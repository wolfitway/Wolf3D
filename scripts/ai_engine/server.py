"""
server.py
Wolf3D In-House Neural Image-to-3D Local FastAPI Microservice.

Provides:
- POST /api/generate-3d
- GET /api/progress/{task_id} (Server-Sent Events)
- GET /api/health
"""

import os
import sys
import time
import uuid
import json
import asyncio
import logging
from typing import Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
from PIL import Image
import numpy as np
import torch

# Paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AI_ENGINE_DIR = os.path.join(ROOT_DIR, "scripts", "ai_engine")
GENERATED_DIR = os.path.join(ROOT_DIR, "public", "models", "generated")
TRIPOSR_DIR = os.path.join(AI_ENGINE_DIR, "TripoSR")

if TRIPOSR_DIR not in sys.path:
    sys.path.insert(0, TRIPOSR_DIR)
if AI_ENGINE_DIR not in sys.path:
    sys.path.insert(0, AI_ENGINE_DIR)

os.makedirs(GENERATED_DIR, exist_ok=True)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("Wolf3D.AIEngine")

app = FastAPI(title="Wolf3D Neural 3D Generator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory state
tasks_state: Dict[str, Dict[str, Any]] = {}
tasks_queues: Dict[str, asyncio.Queue] = {}

global_model = None
global_rembg_session = None

def get_device():
    return "cuda:0" if torch.cuda.is_available() else "cpu"

def get_rembg_session():
    global global_rembg_session
    if global_rembg_session is None:
        import rembg
        # Use standard u2net for reliable performance
        global_rembg_session = rembg.new_session(model_name="u2net")
    return global_rembg_session

def get_model():
    global global_model
    if global_model is None:
        logger.info("Initializing TripoSR model on GPU...")
        from tsr.system import TSR
        model = TSR.from_pretrained(
            "stabilityai/TripoSR",
            config_name="config.yaml",
            weight_name="model.ckpt"
        )
        model.renderer.set_chunk_size(8192)
        model.to(get_device())
        global_model = model
        logger.info(f"TripoSR initialized on {get_device()}")
    return global_model

async def publish_progress(task_id: str, stage: str, progress: int, message: str, extra: Optional[Dict[str, Any]] = None):
    payload = {
        "taskId": task_id,
        "stage": stage,
        "progress": progress,
        "message": message,
        **(extra or {})
    }
    tasks_state[task_id] = payload
    if task_id in tasks_queues:
        await tasks_queues[task_id].put(payload)

def run_3d_pipeline(
    task_id: str,
    temp_img_path: str,
    target_height: float,
    target_width: Optional[float],
    target_depth: Optional[float],
    target_faces: int,
    loop: asyncio.AbstractEventLoop
):
    try:
        t_start = time.time()
        
        # 1. Background Extraction
        asyncio.run_coroutine_threadsafe(
            publish_progress(task_id, "segmentation", 15, "Isolating foreground object and removing background..."),
            loop
        )
        
        import rembg
        from tsr.utils import remove_background, resize_foreground
        from tsr.bake_texture import bake_texture
        import xatlas
        from postprocessor import postprocess_mesh_with_blender

        raw_img = Image.open(temp_img_path).convert("RGB")
        session = get_rembg_session()
        fg_img = remove_background(raw_img, session)
        fg_img = resize_foreground(fg_img, 0.85)

        img_arr = np.array(fg_img).astype(np.float32) / 255.0
        composite = img_arr[:, :, :3] * img_arr[:, :, 3:4] + (1.0 - img_arr[:, :, 3:4]) * 0.5
        input_image = Image.fromarray((composite * 255.0).astype(np.uint8))

        # 2. Neural 3D Reconstruction
        asyncio.run_coroutine_threadsafe(
            publish_progress(task_id, "neural_synthesis", 40, "Generating 3D neural volume with TripoSR transformer..."),
            loop
        )

        model = get_model()
        device = get_device()
        with torch.no_grad():
            scene_codes = model([input_image], device=device)

        # 3. Surface Mesh Extraction & Texture Bake
        asyncio.run_coroutine_threadsafe(
            publish_progress(task_id, "mesh_extraction", 65, "Extracting isosurface mesh & baking UV texture coordinates..."),
            loop
        )

        meshes = model.extract_mesh(scene_codes, False, resolution=256)
        mesh = meshes[0]

        raw_obj_path = os.path.join(GENERATED_DIR, f"{task_id}_raw.obj")
        raw_tex_path = os.path.join(GENERATED_DIR, f"{task_id}_raw.png")
        final_glb_path = os.path.join(GENERATED_DIR, f"{task_id}.glb")

        bake_output = bake_texture(mesh, model, scene_codes[0], texture_resolution=1024)
        vmapping = bake_output["vmapping"]
        xatlas.export(
            raw_obj_path,
            mesh.vertices[vmapping],
            bake_output["indices"],
            bake_output["uvs"],
            mesh.vertex_normals[vmapping]
        )
        tex_img = Image.fromarray((bake_output["colors"] * 255.0).astype(np.uint8)).transpose(Image.FLIP_TOP_BOTTOM)
        tex_img.save(raw_tex_path)

        # 4. Headless Blender Post-Processing (Decimation, UV, Ground Pivot Y=0, GLB export)
        asyncio.run_coroutine_threadsafe(
            publish_progress(task_id, "blender_postprocess", 85, "Running Blender 5.2 headless decimation & GLB export..."),
            loop
        )

        postprocess_mesh_with_blender(
            input_mesh_path=raw_obj_path,
            output_glb_path=final_glb_path,
            texture_path=raw_tex_path,
            target_faces=target_faces,
            target_height=target_height,
            target_width=target_width,
            target_depth=target_depth
        )

        # Clean intermediate raw files to save disk space
        try:
            if os.path.exists(raw_obj_path): os.remove(raw_obj_path)
            if os.path.exists(raw_tex_path): os.remove(raw_tex_path)
            if os.path.exists(temp_img_path): os.remove(temp_img_path)
        except Exception:
            pass

        t_total = time.time() - t_start
        glb_size = os.path.getsize(final_glb_path) if os.path.exists(final_glb_path) else 0

        asyncio.run_coroutine_threadsafe(
            publish_progress(
                task_id,
                "completed",
                100,
                f"Generated high-fidelity 3D model in {t_total:.1f}s!",
                extra={
                    "glbUrl": f"/models/generated/{task_id}.glb",
                    "fileSize": glb_size,
                    "durationSeconds": round(t_total, 2),
                    "targetHeight": target_height
                }
            ),
            loop
        )

    except Exception as e:
        logger.exception(f"Pipeline error for task {task_id}: {e}")
        asyncio.run_coroutine_threadsafe(
            publish_progress(task_id, "error", -1, str(e)),
            loop
        )

@app.get("/api/health")
def health():
    gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "None"
    vram_alloc = torch.cuda.memory_allocated(0) / (1024**2) if torch.cuda.is_available() else 0
    vram_reserved = torch.cuda.memory_reserved(0) / (1024**2) if torch.cuda.is_available() else 0
    return {
        "status": "online",
        "engine": "TripoSR + Blender 5.2",
        "gpu": gpu_name,
        "cudaAvailable": torch.cuda.is_available(),
        "vramAllocatedMB": round(vram_alloc, 1),
        "vramReservedMB": round(vram_reserved, 1),
        "isModelLoaded": global_model is not None
    }

@app.post("/api/generate-3d")
async def generate_3d(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    target_height: float = Form(1.0),
    target_width: Optional[float] = Form(None),
    target_depth: Optional[float] = Form(None),
    target_faces: int = Form(30000)
):
    task_id = f"model_{uuid.uuid4().hex[:10]}"
    tasks_queues[task_id] = asyncio.Queue()
    
    # Save uploaded image to temp file
    temp_img_path = os.path.join(GENERATED_DIR, f"{task_id}_input.png")
    contents = await image.read()
    with open(temp_img_path, "wb") as f:
        f.write(contents)

    tasks_state[task_id] = {
        "taskId": task_id,
        "stage": "queued",
        "progress": 0,
        "message": "Task queued for neural processing..."
    }

    loop = asyncio.get_running_loop()
    background_tasks.add_task(
        run_3d_pipeline,
        task_id,
        temp_img_path,
        target_height,
        target_width,
        target_depth,
        target_faces,
        loop
    )

    return {"taskId": task_id, "status": "processing"}

@app.get("/api/progress/{task_id}")
async def get_progress(task_id: str):
    if task_id not in tasks_queues:
        # Check if already finished
        if task_id in tasks_state:
            async def single_event():
                yield {"data": json.dumps(tasks_state[task_id])}
            return EventSourceResponse(single_event())
        raise HTTPException(status_code=404, detail="Task ID not found")

    queue = tasks_queues[task_id]

    async def event_generator():
        # First send current state if available
        if task_id in tasks_state:
            yield {"data": json.dumps(tasks_state[task_id])}

        while True:
            try:
                payload = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield {"data": json.dumps(payload)}
                if payload.get("stage") in ["completed", "error"]:
                    break
            except asyncio.TimeoutError:
                # Keep-alive heartbeat
                yield {"comment": "keep-alive"}

    return EventSourceResponse(event_generator())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
