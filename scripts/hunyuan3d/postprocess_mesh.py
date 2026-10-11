"""
Headless Blender post-processor for Hunyuan3D-2mini meshes.
Optimizes polycount, centers pivot at bottom-center (Y=0), and scales to target metric dimensions.
Usage:
  /usr/local/bin/blender -b -P scripts/hunyuan3d/postprocess_mesh.py -- <input_glb> <output_glb> <target_w> <target_h> <target_d>
"""
import sys
import os
try:
    import bpy  # type: ignore
    import mathutils  # type: ignore
except ImportError:
    pass  # Executed inside Blender via /usr/local/bin/blender -b -P

def postprocess(input_path, output_path, target_w=1.2, target_h=0.45, target_d=0.7, max_faces=5000):
    # Reset scene
    bpy.ops.wm.read_factory_settings(use_empty=True)

    print(f"[Blender] Importing {input_path}...")
    bpy.ops.import_scene.gltf(filepath=input_path)

    # Find imported mesh objects
    context = bpy.context
    if context is None or context.scene is None or context.view_layer is None:
        raise RuntimeError("Blender context, scene, or view_layer not available.")
    scene = context.scene
    view_layer = context.view_layer

    mesh_objs = [obj for obj in scene.objects if obj.type == 'MESH']
    if not mesh_objs:
        print("[Blender ERROR] No mesh objects found!")
        sys.exit(1)

    # Join multiple mesh objects into one if needed
    if len(mesh_objs) > 1:
        view_layer.objects.active = mesh_objs[0]
        for obj in mesh_objs:
            obj.select_set(True)
        bpy.ops.object.join()
        mesh_obj = view_layer.objects.active
    else:
        mesh_obj = mesh_objs[0]
        view_layer.objects.active = mesh_obj
        mesh_obj.select_set(True)

    # Clean geometry: remove doubles / degenerate faces
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=0.0005)
    bpy.ops.mesh.delete_loose()
    bpy.ops.object.mode_set(mode='OBJECT')

    mesh_data = getattr(mesh_obj, "data", None)
    raw_faces = len(getattr(mesh_data, "polygons", []))
    print(f"[Blender] Raw face count: {raw_faces}")

    # Decimate to maximum 5,000 polygons while preserving silhouette and topology
    if raw_faces > max_faces:
        ratio = max_faces / raw_faces
        print(f"[Blender] Decimating from {raw_faces} to ~{max_faces} faces (ratio: {ratio:.4f})...")
        mod = mesh_obj.modifiers.new(name="Decimate", type='DECIMATE')
        setattr(mod, "ratio", ratio)
        setattr(mod, "use_collapse_triangulate", True)
        bpy.ops.object.modifier_apply(modifier="Decimate")
        post_faces = len(getattr(mesh_data, "polygons", []))
        print(f"[Blender] Post-decimate face count: {post_faces}")

    # Apply smooth shading to preserve visual curvature with lower polycount
    bpy.ops.object.shade_smooth()

    # Calculate current bounding box
    bbox = [mesh_obj.matrix_world @ mathutils.Vector(corner) for corner in mesh_obj.bound_box]
    min_x = min(v.x for v in bbox)
    max_x = max(v.x for v in bbox)
    min_y = min(v.y for v in bbox)
    max_y = max(v.y for v in bbox)
    min_z = min(v.z for v in bbox)
    max_z = max(v.z for v in bbox)

    current_w = max_x - min_x
    current_h = max_z - min_z  # Z is UP in Blender, Y is depth
    current_d = max_y - min_y

    print(f"[Blender] Initial BBox: W={current_w:.2f}m, H={current_h:.2f}m, D={current_d:.2f}m")

    # Apply metric scale to match target architectural proportions
    scale_x = target_w / max(0.001, current_w)
    scale_z = target_h / max(0.001, current_h)
    scale_y = target_d / max(0.001, current_d)

    mesh_obj.scale = (scale_x, scale_y, scale_z)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # Recalculate BBox after scale
    bbox = [mesh_obj.matrix_world @ mathutils.Vector(corner) for corner in mesh_obj.bound_box]
    min_x = min(v.x for v in bbox)
    max_x = max(v.x for v in bbox)
    min_y = min(v.y for v in bbox)
    max_y = max(v.y for v in bbox)
    min_z = min(v.z for v in bbox)
    max_z = max(v.z for v in bbox)

    center_x = (min_x + max_x) / 2.0
    center_y = (min_y + max_y) / 2.0
    floor_z = min_z

    # Re-ground pivot so bottom is exactly at Z=0 (Three.js Y=0) and centered in X/Y
    mesh_obj.location.x -= center_x
    mesh_obj.location.y -= center_y
    mesh_obj.location.z -= floor_z
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    print(f"[Blender] Re-grounded object: Centered at (0,0), floor Z=0.000")

    # Apply Smart UV Projection and Architectural Walnut PBR Material
    script_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    tex_dir = os.path.join(workspace_root, "public", "models", "generated", "textures")
    albedo_file = os.path.join(tex_dir, "walnut_albedo.png")
    roughness_file = os.path.join(tex_dir, "walnut_roughness.png")
    normal_file = os.path.join(tex_dir, "walnut_normal.png")

    if os.path.exists(albedo_file):
        print(f"[Blender] Applying Cube Projection for continuous, distortion-free wood grain...")
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.cube_project(cube_size=1.2)
        bpy.ops.object.mode_set(mode='OBJECT')

        print(f"[Blender] Creating Architectural Scandinavian Blonde Oak PBR Material...")
        mat_oak = bpy.data.materials.new(name="ScandinavianOak_PBR")
        mat_oak.use_nodes = True
        nodes = getattr(getattr(mat_oak, "node_tree", None), "nodes", None)
        links = getattr(getattr(mat_oak, "node_tree", None), "links", None)
        if nodes is not None and links is not None:
            nodes.clear()

            out_node = nodes.new(type="ShaderNodeOutputMaterial")
            out_node.location = (400, 0)

            bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
            bsdf.location = (0, 0)
            links.new(bsdf.outputs["BSDF"], out_node.inputs["Surface"])

            tex_coord = nodes.new(type="ShaderNodeTexCoord")
            tex_coord.location = (-800, 0)
            mapping = nodes.new(type="ShaderNodeMapping")
            mapping.location = (-600, 0)
            mapping.inputs["Scale"].default_value = (1.2, 1.2, 1.2)
            links.new(tex_coord.outputs["UV"], mapping.inputs["Vector"])

            # Albedo Texture
            albedo_img = bpy.data.images.load(albedo_file)
            albedo_node = nodes.new(type="ShaderNodeTexImage")
            albedo_node.image = albedo_img
            albedo_node.location = (-350, 150)
            links.new(mapping.outputs["Vector"], albedo_node.inputs["Vector"])
            links.new(albedo_node.outputs["Color"], bsdf.inputs["Base Color"])

            # Roughness Texture
            if os.path.exists(roughness_file):
                rough_img = bpy.data.images.load(roughness_file)
                rough_img.colorspace_settings.name = "Non-Color"
                rough_node = nodes.new(type="ShaderNodeTexImage")
                rough_node.image = rough_img
                rough_node.location = (-350, -100)
                links.new(mapping.outputs["Vector"], rough_node.inputs["Vector"])
                links.new(rough_node.outputs["Color"], bsdf.inputs["Roughness"])

            # Normal Map Texture
            if os.path.exists(normal_file):
                norm_img = bpy.data.images.load(normal_file)
                norm_img.colorspace_settings.name = "Non-Color"
                norm_node = nodes.new(type="ShaderNodeTexImage")
                norm_node.image = norm_img
                norm_node.location = (-350, -350)
                norm_map_node = nodes.new(type="ShaderNodeNormalMap")
                norm_map_node.location = (-100, -350)
                norm_map_node.inputs["Strength"].default_value = 0.6
                links.new(mapping.outputs["Vector"], norm_node.inputs["Vector"])
                links.new(norm_node.outputs["Color"], norm_map_node.inputs["Color"])
                links.new(norm_map_node.outputs["Normal"], bsdf.inputs["Normal"])

            # Create secondary ceramic material for accessories sitting on top of the table
            mat_ceramic = bpy.data.materials.new(name="CeramicWhite_PBR")
            mat_ceramic.use_nodes = True
            c_nodes = getattr(getattr(mat_ceramic, "node_tree", None), "nodes", None)
            c_links = getattr(getattr(mat_ceramic, "node_tree", None), "links", None)
            if c_nodes is not None and c_links is not None:
                c_nodes.clear()
                c_out = c_nodes.new(type="ShaderNodeOutputMaterial")
                c_bsdf = c_nodes.new(type="ShaderNodeBsdfPrincipled")
                c_bsdf.inputs["Base Color"].default_value = (0.92, 0.92, 0.90, 1.0)
                c_bsdf.inputs["Roughness"].default_value = 0.22
                c_links.new(c_bsdf.outputs["BSDF"], c_out.inputs["Surface"])

            # Assign materials to mesh object
            mesh_data_obj = getattr(mesh_obj, "data", None)
            if mesh_data_obj is not None:
                mats = getattr(mesh_data_obj, "materials", None)
                if mats is not None:
                    mats.clear()
                    mats.append(mat_oak)
                    mats.append(mat_ceramic)

                # Segment faces by height (Z in Blender object coordinates after grounding)
                polys = getattr(mesh_data_obj, "polygons", [])
                verts = getattr(mesh_data_obj, "vertices", [])
                accessory_faces = 0
                for poly in polys:
                    z_center = sum(verts[v_idx].co.z for v_idx in poly.vertices) / len(poly.vertices)
                    # Faces above tabletop level (>0.285m) are tabletop accessories (pot / book)
                    if z_center > 0.285:
                        poly.material_index = 1
                        accessory_faces += 1
                    else:
                        poly.material_index = 0
                print(f"[Blender] Materials assigned: {len(polys) - accessory_faces} Oak faces, {accessory_faces} Ceramic accessory faces!")


    # Export optimized GLB
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True
    )
    print(f"[Blender] Exported successfully to {output_path}")

if __name__ == "__main__":
    args = sys.argv
    if "--" in args:
        idx = args.index("--")
        custom_args = args[idx + 1:]
    else:
        custom_args = []

    if len(custom_args) < 2:
        print("Usage: blender -b -P postprocess_mesh.py -- <in.glb> <out.glb> [target_w] [target_h] [target_d]")
        sys.exit(1)

    in_glb = custom_args[0]
    out_glb = custom_args[1]
    tw = float(custom_args[2]) if len(custom_args) > 2 else 1.2
    th = float(custom_args[3]) if len(custom_args) > 3 else 0.45
    td = float(custom_args[4]) if len(custom_args) > 4 else 0.70
    max_f = int(custom_args[5]) if len(custom_args) > 5 else 5000

    postprocess(in_glb, out_glb, tw, th, td, max_f)
