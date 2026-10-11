"""
postprocessor.py
Python wrapper for executing headless Blender 5.2 post-processing.
"""

import os
import subprocess
import logging

logger = logging.getLogger("Wolf3D.Postprocessor")
BLENDER_PATH = "/usr/local/bin/blender"
SCRIPT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "blender_glb_bake.py")

def postprocess_mesh_with_blender(
    input_mesh_path: str,
    output_glb_path: str,
    texture_path: str = None,
    target_faces: int = 30000,
    target_height: float = 1.0,
    target_width: float = None,
    target_depth: float = None
) -> str:
    """
    Executes headless Blender to:
    - Decimate mesh to target polygon budget
    - Auto-ground base pivot at Y = 0 (bottom-center)
    - Scale to real-world target height
    - Link PBR material & texture map
    - Export clean binary GLB
    """
    abs_input = os.path.abspath(input_mesh_path)
    abs_output = os.path.abspath(output_glb_path)
    abs_script = os.path.abspath(SCRIPT_PATH)
    
    cmd = [
        BLENDER_PATH,
        "-b",
        "-P",
        abs_script,
        "--",
        "--input", abs_input,
        "--output", abs_output,
        "--target-faces", str(target_faces),
        "--target-height", str(target_height)
    ]
    
    if texture_path and os.path.exists(texture_path):
        cmd.extend(["--texture", os.path.abspath(texture_path)])
    if target_width:
        cmd.extend(["--target-width", str(target_width)])
    if target_depth:
        cmd.extend(["--target-depth", str(target_depth)])
        
    logger.info(f"Running Blender post-processor: {' '.join(cmd)}")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    if result.returncode != 0:
        logger.error(f"Blender post-processor failed: {result.stderr}")
        raise RuntimeError(f"Blender failed with code {result.returncode}: {result.stderr}")
        
    if not os.path.exists(abs_output) or os.path.getsize(abs_output) == 0:
        raise RuntimeError(f"Blender finished but {abs_output} was not created or is empty.")
        
    logger.info(f"Blender post-processing completed: {abs_output} ({os.path.getsize(abs_output):,} bytes)")
    return abs_output

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2:
        postprocess_mesh_with_blender(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python3 postprocessor.py <input_mesh> <output_glb>")
