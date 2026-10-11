"""
End-to-End Test for Hunyuan3D-2mini:
1. Loads reference image
2. Strips background using BackgroundRemover
3. Loads tencent/Hunyuan3D-2mini (Turbo 0.6B)
4. Generates 3D mesh on RTX 3060
5. Runs headless Blender grounding and architectural normalization
6. Saves final game-ready GLB to public/models/generated/hunyuan_coffee_table.glb
"""
import os
import sys
import time
import subprocess
import torch
from PIL import Image

# Ensure hunyuan3d is on path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
HUNYUAN_REPO = os.path.join(CURRENT_DIR, "Hunyuan3D-2")
if HUNYUAN_REPO not in sys.path:
    sys.path.insert(0, HUNYUAN_REPO)

from hy3dgen.rembg import BackgroundRemover
from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline

def run_cycle():
    print("=" * 65)
    print("🚀 HUNYUAN 3D VERSION 2 MINI: FULL GENERATION CYCLE TEST")
    print("=" * 65)

    input_img_path = os.path.abspath("public/images/samples/sample_coffee_table.jpg")
    output_dir = os.path.abspath("public/models/generated")
    os.makedirs(output_dir, exist_ok=True)

    raw_glb_path = os.path.join(output_dir, "hunyuan_mini_raw.glb")
    final_glb_path = os.path.join(output_dir, "hunyuan_mini_table.glb")

    print(f"\n[1/5] Loading Input Image: {input_img_path}")
    image = Image.open(input_img_path).convert("RGBA")
    print(f"      Image size: {image.size}")

    print("\n[2/5] Running Background Removal (rembg)...")
    rembg_start = time.time()
    remover = BackgroundRemover()
    rgba_image = remover(image)
    del remover
    import gc
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    print(f"      Background extracted in {time.time() - rembg_start:.2f}s")

    print("\n[3/5] Initializing Hunyuan3D-2mini on RTX 3060...")
    model_start = time.time()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"      Target Device: {device} ({torch.cuda.get_device_name(0)})")

    # Load mini model weights from Hugging Face
    pipeline = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(
        'tencent/Hunyuan3D-2mini',
        subfolder='hunyuan3d-dit-v2-mini-turbo',
        use_safetensors=True,
        device=device,
    )
    pipeline.enable_flashvdm(mc_algo='mc')
    print(f"      Model loaded in {time.time() - model_start:.2f}s")

    print("\n[4/5] Generating 3D Volume with Hunyuan3D-2mini Turbo (20 steps)...")
    gen_start = time.time()
    generator = torch.Generator(device).manual_seed(42)
    mesh = pipeline(
        image=rgba_image,
        num_inference_steps=20,
        guidance_scale=5.0,
        octree_resolution=256,
        generator=generator,
        mc_algo='mc'
    )[0]

    gen_duration = time.time() - gen_start
    print(f"      Mesh generated in {gen_duration:.2f}s! Vertices: {len(mesh.vertices)}, Faces: {len(mesh.faces)}")

    # Export raw GLB
    mesh.export(raw_glb_path)
    raw_size_kb = os.path.getsize(raw_glb_path) / 1024
    print(f"      Exported raw mesh: {raw_glb_path} ({raw_size_kb:.1f} KB)")

    print("\n[5/5] Running Headless Blender Grounding & Metric Normalization...")
    blender_script = os.path.join(CURRENT_DIR, "postprocess_mesh.py")
    cmd = [
        "/usr/local/bin/blender",
        "-b",
        "-P", blender_script,
        "--",
        raw_glb_path,
        final_glb_path,
        "1.15", # W = 1.15m
        "0.45", # H = 0.45m
        "0.65"  # D = 0.65m
    ]
    subprocess.run(cmd, check=True)

    final_size_kb = os.path.getsize(final_glb_path) / 1024
    print("\n" + "=" * 65)
    print("✅ FULL CYCLE COMPLETE!")
    print(f"   Model Output: {final_glb_path}")
    print(f"   Final File Size: {final_size_kb:.1f} KB")
    print(f"   Total Inference Time: {gen_duration:.2f}s")
    print("=" * 65)

if __name__ == "__main__":
    run_cycle()
