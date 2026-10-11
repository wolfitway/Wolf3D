#!/usr/bin/env python3
"""
Standalone CLI runner and benchmark for TripoSR local neural 3D inference.
"""
import os
import sys
import time
import argparse
import numpy as np
import torch
from PIL import Image

# Ensure TripoSR is on path
current_dir = os.path.dirname(os.path.abspath(__file__))
tripo_dir = os.path.join(current_dir, "TripoSR")
if tripo_dir not in sys.path:
    sys.path.insert(0, tripo_dir)

import rembg
from tsr.system import TSR
from tsr.utils import remove_background, resize_foreground
from tsr.bake_texture import bake_texture
import xatlas

def run_inference(image_path, output_glb=None, device="cuda:0", mc_resolution=256, chunk_size=8192, bake_tex=True):
    print(f"=== Wolf3D Neural 3D Generator Benchmark ===")
    print(f"Input: {image_path}")
    print(f"Device: {device}")
    
    t0 = time.time()
    
    # 1. Background removal
    print("[1/5] Removing background & isolating foreground...")
    t_bg0 = time.time()
    rembg_session = rembg.new_session()
    raw_img = Image.open(image_path).convert("RGB")
    fg_img = remove_background(raw_img, rembg_session)
    fg_img = resize_foreground(fg_img, 0.85)
    
    # Convert RGBA to RGB composite on neutral gray
    img_arr = np.array(fg_img).astype(np.float32) / 255.0
    composite = img_arr[:, :, :3] * img_arr[:, :, 3:4] + (1.0 - img_arr[:, :, 3:4]) * 0.5
    input_image = Image.fromarray((composite * 255.0).astype(np.uint8))
    t_bg = time.time() - t_bg0
    print(f"   ✓ Background matting done in {t_bg:.2f}s")
    
    # 2. Load model
    print("[2/5] Loading TripoSR model weights...")
    t_m0 = time.time()
    model = TSR.from_pretrained(
        "stabilityai/TripoSR",
        config_name="config.yaml",
        weight_name="model.ckpt"
    )
    model.renderer.set_chunk_size(chunk_size)
    model.to(device)
    t_m = time.time() - t_m0
    print(f"   ✓ Model loaded in {t_m:.2f}s")
    
    # 3. Neural 3D Reconstruction
    print("[3/5] Running Neural 3D Transformer Backbone...")
    if torch.cuda.is_available():
        torch.cuda.synchronize()
    t_infer0 = time.time()
    with torch.no_grad():
        scene_codes = model([input_image], device=device)
    if torch.cuda.is_available():
        torch.cuda.synchronize()
    t_infer = time.time() - t_infer0
    print(f"   ★ 3D Neural Backbone Inference: {t_infer:.3f}s on {torch.cuda.get_device_name(0)}")
    
    # 4. Mesh Extraction
    print(f"[4/5] Extracting surface isosurface (resolution={mc_resolution})...")
    t_ext0 = time.time()
    meshes = model.extract_mesh(scene_codes, not bake_tex, resolution=mc_resolution)
    mesh = meshes[0]
    t_ext = time.time() - t_ext0
    print(f"   ✓ Isosurface extracted in {t_ext:.2f}s (vertices: {len(mesh.vertices):,}, faces: {len(mesh.faces):,})")
    
    # 5. Texture Bake & Export
    raw_obj_path = os.path.splitext(output_glb or "output.glb")[0] + "_raw.obj"
    raw_tex_path = os.path.splitext(output_glb or "output.glb")[0] + "_raw.png"
    
    if bake_tex:
        print("[5/5] Baking UV texture map (xatlas)...")
        t_b0 = time.time()
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
        t_b = time.time() - t_b0
        print(f"   ✓ Texture baked in {t_b:.2f}s -> {raw_obj_path}, {raw_tex_path}")
    else:
        mesh.export(raw_obj_path)
        
    total_time = time.time() - t0
    print(f"=== Neural 3D Stage Completed in {total_time:.2f}s ===")
    return raw_obj_path, raw_tex_path if bake_tex else None

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", default="public/images/samples/sample_coffee_table.jpg")
    parser.add_argument("--output", default="public/models/generated/victorian_chair_neural.glb")
    parser.add_argument("--device", default="cuda:0")
    parser.add_argument("--mc-resolution", type=int, default=256)
    parser.add_argument("--bake-texture", action="store_true", default=True)
    args = parser.parse_args()
    
    raw_obj, raw_tex = run_inference(
        image_path=args.image,
        output_glb=args.output,
        device=args.device,
        mc_resolution=args.mc_resolution,
        bake_tex=args.bake_texture
    )
