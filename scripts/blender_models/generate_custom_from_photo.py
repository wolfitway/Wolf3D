import bpy
import bmesh
import math
import os
import sys
import argparse
from mathutils import Vector, Euler

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if not bpy.data.scenes:
        bpy.data.scenes.new("Scene")

def create_pbr_material(name, base_color, roughness=0.6, metalness=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output_node = nodes.new(type="ShaderNodeOutputMaterial")
    output_node.location = (300, 0)

    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metalness

    links.new(bsdf.outputs["BSDF"], output_node.inputs["Surface"])
    return mat

def build_armchair(output_path, width=0.84, depth=0.82, height=0.78):
    reset_scene()
    mat_boucle = create_pbr_material("BoucleLinen", (0.92, 0.89, 0.83, 1.0), roughness=0.92)
    mat_oak = create_pbr_material("NordicOak", (0.62, 0.44, 0.28, 1.0), roughness=0.6)
    mat_brass = create_pbr_material("AntiqueBrass", (0.83, 0.68, 0.38, 1.0), roughness=0.25, metalness=0.9)

    seat_y = 0.42
    leg_h = seat_y - 0.04
    seat_r = min(width, depth) * 0.44

    # 4 Splayed Legs with Brass Ferrules
    leg_spread_x = width * 0.32
    leg_spread_z = depth * 0.32
    legs_data = [
        (-leg_spread_x, leg_spread_z, 7, -7),
        (leg_spread_x, leg_spread_z, 7, 7),
        (-leg_spread_x, -leg_spread_z, -7, -7),
        (leg_spread_x, -leg_spread_z, -7, 7)
    ]

    for lx, lz, rx, rz in legs_data:
        # Leg Cylinder
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.022,
            depth=leg_h,
            location=(lx, lz, leg_h / 2 - height / 2)
        )
        leg = bpy.context.active_object
        leg.rotation_euler = (math.radians(rx), math.radians(rz), 0)
        leg.data.materials.append(mat_oak)

        # Brass ferrule
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.024,
            depth=0.04,
            location=(lx, lz, 0.02 - height / 2)
        )
        ferrule = bpy.context.active_object
        ferrule.rotation_euler = (math.radians(rx), math.radians(rz), 0)
        ferrule.data.materials.append(mat_brass)

    # Thick Sculpted Cushion
    bpy.ops.mesh.primitive_cylinder_add(
        radius=seat_r,
        depth=0.14,
        location=(0, 0, seat_y - height / 2)
    )
    seat = bpy.context.active_object
    seat.data.materials.append(mat_boucle)

    # Curved Barrel Wraparound Backrest
    back_h = height - seat_y
    bpy.ops.mesh.primitive_cylinder_add(
        radius=seat_r * 1.04,
        depth=back_h,
        location=(0, -depth * 0.04, seat_y + back_h / 2 - height / 2)
    )
    back = bpy.context.active_object
    back.data.materials.append(mat_boucle)

    # Export to GLB
    bpy.ops.object.select_all(action='SELECT')
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )
    print(f"Successfully generated 3D GLB model: {output_path} ({os.path.getsize(output_path)} bytes)")

if __name__ == '__main__':
    # Parse CLI arguments after '--'
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    output_file = "/home/dan/projects/Wolf3D/public/models/custom_armchair.glb"
    for i, a in enumerate(args):
        if a == '--output' and i + 1 < len(args):
            output_file = args[i + 1]

    build_armchair(output_file)
