"""
blender_glb_bake.py
Headless Blender post-processor for Wolf3D Image-to-3D pipeline.

Runs via:
  /usr/local/bin/blender -b -P scripts/ai_engine/blender_glb_bake.py -- \
    --input <input_mesh_path> \
    --output <output_glb_path> \
    --target-faces 30000 \
    --target-height 1.0
"""

import sys
import os
import argparse
import bpy
import mathutils

def parse_args():
    # Blender arguments precede '--', script arguments follow '--'
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    parser = argparse.ArgumentParser(description="Headless Blender 3D Mesh Post-Processor")
    parser.add_argument("--input", required=True, help="Path to input 3D model (obj, ply, stl, glb)")
    parser.add_argument("--output", required=True, help="Path to output GLB")
    parser.add_argument("--texture", default=None, help="Optional texture image path")
    parser.add_argument("--target-faces", type=int, default=30000, help="Target face count for decimation")
    parser.add_argument("--target-height", type=float, default=1.0, help="Target height in meters")
    parser.add_argument("--target-width", type=float, default=None, help="Target width in meters")
    parser.add_argument("--target-depth", type=float, default=None, help="Target depth in meters")
    return parser.parse_args(argv)

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    # Remove all collections and objects
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)
    for img in list(bpy.data.images):
        bpy.data.images.remove(img)

def import_model(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".obj":
        bpy.ops.wm.obj_import(filepath=filepath)
    elif ext == ".ply":
        bpy.ops.wm.ply_import(filepath=filepath)
    elif ext == ".stl":
        bpy.ops.wm.stl_import(filepath=filepath)
    elif ext in [".glb", ".gltf"]:
        bpy.ops.import_scene.gltf(filepath=filepath)
    else:
        raise ValueError(f"Unsupported format: {ext}")

    selected = [obj for obj in bpy.context.selected_objects if obj.type == 'MESH']
    if not selected:
        # Fallback to any mesh in scene
        selected = [obj for obj in bpy.data.objects if obj.type == 'MESH']
    return selected

def process_mesh(objects, target_faces=30000, target_height=1.0, texture_path=None):
    if not objects:
        raise RuntimeError("No mesh objects found after import!")

    # If multiple mesh pieces, join them into one unified model
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]

    if len(objects) > 1:
        bpy.ops.object.join()

    main_obj = bpy.context.view_layer.objects.active
    mesh = main_obj.data

    # Apply all existing transforms
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Clean geometry in Edit mode
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    # Merge near vertices
    bpy.ops.mesh.remove_doubles(threshold=0.0001)
    # Recalculate outside normals
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')

    # Decimate if face count exceeds target
    current_faces = len(mesh.polygons)
    print(f"[Blender] Current face count: {current_faces}, target: {target_faces}")
    if current_faces > target_faces:
        ratio = max(0.05, float(target_faces) / float(current_faces))
        dec_mod = main_obj.modifiers.new(name="WolfDecimate", type='DECIMATE')
        dec_mod.ratio = ratio
        dec_mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier="WolfDecimate")
        print(f"[Blender] Reduced faces to: {len(main_obj.data.polygons)}")

    # Smooth shading
    for poly in main_obj.data.polygons:
        poly.use_smooth = True

    # Compute bounding box
    bbox_corners = [main_obj.matrix_world @ mathutils.Vector(corner) for corner in main_obj.bound_box]
    min_x = min(c.x for c in bbox_corners)
    max_x = max(c.x for c in bbox_corners)
    min_y = min(c.y for c in bbox_corners)
    max_y = max(c.y for c in bbox_corners)
    min_z = min(c.z for c in bbox_corners)
    max_z = max(c.z for c in bbox_corners)

    size_x = max_x - min_x
    size_y = max_y - min_y
    size_z = max_z - min_z
    print(f"[Blender] Bounding box: X={size_x:.3f}, Y={size_y:.3f}, Z={size_z:.3f}")

    # Wolf3D Coordinate Alignment:
    # In Blender, Z is UP. When exported with GLTF (+Y up), Blender Z becomes Three.js Y!
    # Pivot grounding: Center X and Y at 0, align minimum Z (base) to Z = 0.
    center_x = (min_x + max_x) / 2.0
    center_y = (min_y + max_y) / 2.0
    bottom_z = min_z

    # Shift vertices directly so origin is at bottom-center (X=0, Y=0, Z=0)
    for v in mesh.vertices:
        v.co.x -= center_x
        v.co.y -= center_y
        v.co.z -= bottom_z

    mesh.update()

    # Scale to match target height if specified (in Blender Z)
    if target_height and size_z > 0.001:
        scale_factor = target_height / size_z
        main_obj.scale = (scale_factor, scale_factor, scale_factor)
        bpy.ops.object.transform_apply(scale=True)
        print(f"[Blender] Scaled by {scale_factor:.3f} to height {target_height:.2f}m")

    # Ensure UV map exists
    if not mesh.uv_layers:
        print("[Blender] Generating Smart UV Project...")
        bpy.ops.object.mode_set(mode='EDIT')
        try:
            bpy.ops.uv.smart_project(island_margin=0.01)
        except Exception:
            bpy.ops.uv.unwrap()
        bpy.ops.object.mode_set(mode='OBJECT')

    # Setup PBR Material
    mat = None
    if main_obj.data.materials:
        mat = main_obj.data.materials[0]
    else:
        mat = bpy.data.materials.new(name="M_Generated_PBR")
        main_obj.data.materials.append(mat)

    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")

    # If texture provided, link texture image
    if texture_path and os.path.exists(texture_path):
        print(f"[Blender] Applying texture map: {texture_path}")
        tex_image = nodes.new(type="ShaderNodeTexImage")
        img = bpy.data.images.load(texture_path)
        tex_image.image = img
        links.new(tex_image.outputs["Color"], bsdf.inputs["Base Color"])
    elif mesh.color_attributes:
        # Mesh has vertex colors
        try:
            col_node = nodes.new(type="ShaderNodeColorAttribute")
            col_node.attribute_name = mesh.color_attributes[0].name
            links.new(col_node.outputs["Color"], bsdf.inputs["Base Color"])
            print(f"[Blender] Linked color attribute layer: {mesh.color_attributes[0].name}")
        except Exception:
            try:
                col_node = nodes.new(type="ShaderNodeVertexColor")
                col_node.layer_name = mesh.color_attributes[0].name
                links.new(col_node.outputs["Color"], bsdf.inputs["Base Color"])
            except Exception:
                pass

    # Set realistic default PBR properties
    if "Roughness" in bsdf.inputs:
        bsdf.inputs["Roughness"].default_value = 0.65
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = 0.05

    return main_obj

def export_glb(output_path):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_normals=True,
        export_all_vertex_colors=True,
        export_materials='EXPORT',
        export_image_format='JPEG',
        export_jpeg_quality=85,
        export_yup=True
    )
    print(f"[Blender] Successfully exported GLB to: {output_path} ({os.path.getsize(output_path):,} bytes)")

def main():
    args = parse_args()
    print(f"[Blender] Processing {args.input} -> {args.output}")
    clean_scene()
    objects = import_model(args.input)
    process_mesh(
        objects,
        target_faces=args.target_faces,
        target_height=args.target_height,
        texture_path=args.texture
    )
    export_glb(args.output)
    print("[Blender] Post-processing completed successfully.")

if __name__ == "__main__":
    main()
