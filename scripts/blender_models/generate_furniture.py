import bpy
import bmesh
import math
import os
from mathutils import Vector, Matrix, Euler

OUTPUT_DIR = "/home/dan/projects/Wolf3D/public/models"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    # Ensure a scene exists
    if not bpy.data.scenes:
        bpy.data.scenes.new("Scene")

def create_pbr_material(name, base_color, roughness=0.6, metalness=0.0, normal_noise=False, noise_scale=40.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output_node = nodes.new(type="ShaderNodeOutputMaterial")
    output_node.location = (400, 0)

    bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metalness

    if normal_noise:
        tex_coord = nodes.new(type="ShaderNodeTexCoord")
        tex_coord.location = (-600, -200)
        noise = nodes.new(type="ShaderNodeTexNoise")
        noise.location = (-400, -200)
        noise.inputs["Scale"].default_value = noise_scale
        noise.inputs["Detail"].default_value = 4.0
        bump = nodes.new(type="ShaderNodeBump")
        bump.location = (-200, -200)
        bump.inputs["Strength"].default_value = 0.08
        bump.inputs["Distance"].default_value = 0.02
        links.new(tex_coord.outputs["Object"], noise.inputs["Vector"])
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    links.new(bsdf.outputs["BSDF"], output_node.inputs["Surface"])
    return mat

def apply_material(obj, mat):
    if not obj.data.materials:
        obj.data.materials.append(mat)
    else:
        obj.data.materials[0] = mat

def smooth_object(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True

def export_glb(filename):
    filepath = os.path.join(OUTPUT_DIR, filename)
    # Deselect all, then select all visible mesh objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )
    print(f"Exported {filename} -> {os.path.getsize(filepath)} bytes")

# -------------------------------------------------------------
# 1. ARTISAN MEDITERRANEAN LOUNGE ARMCHAIR (chair_lounge.glb)
# Dimensions: Width 0.82, Depth 0.82, Height 0.78 (Z in [-0.39, 0.39])
# -------------------------------------------------------------
def build_chair_lounge():
    reset_scene()
    
    mat_boucle = create_pbr_material("BoucleLinen", (0.92, 0.89, 0.83, 1.0), roughness=0.92, normal_noise=True, noise_scale=80.0)
    mat_oak = create_pbr_material("NordicOak", (0.62, 0.44, 0.28, 1.0), roughness=0.62)
    mat_brass = create_pbr_material("AntiqueBrass", (0.83, 0.68, 0.38, 1.0), roughness=0.25, metalness=0.9)
    mat_accent = create_pbr_material("TerracottaLinen", (0.71, 0.38, 0.23, 1.0), roughness=0.9)

    # 4 Splayed Legs with Brass Ferrules
    # Z floor is at -0.39. Seat base bottom is at -0.16.
    leg_coords = [
        (-0.28, 0.28, 7, -7),
        (0.28, 0.28, 7, 7),
        (-0.28, -0.28, -7, -7),
        (0.28, -0.28, -7, 7)
    ]
    for lx, ly, rx, ry in leg_coords:
        # Leg spindle
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.022,
            depth=0.23,
            location=(lx * 0.9, ly * 0.9, -0.275)
        )
        leg = bpy.context.active_object
        leg.rotation_euler = (math.radians(rx), math.radians(ry), 0)
        smooth_object(leg)
        apply_material(leg, mat_oak)

        # Brass ferrule foot
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.024,
            depth=0.04,
            location=(lx * 0.92, ly * 0.92, -0.37)
        )
        ferrule = bpy.context.active_object
        ferrule.rotation_euler = (math.radians(rx), math.radians(ry), 0)
        smooth_object(ferrule)
        apply_material(ferrule, mat_brass)

    # Seat Underframe cross stretchers
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.17))
    underframe = bpy.context.active_object
    underframe.scale = (0.58, 0.58, 0.03)
    apply_material(underframe, mat_oak)

    # Deep Rounded Seat Cushion
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=32,
        radius=0.34,
        depth=0.18,
        location=(0, -0.02, -0.07)
    )
    cushion = bpy.context.active_object
    cushion.scale = (1.08, 1.0, 1.0) # slightly elliptical
    mod_sub = cushion.modifiers.new("Bevel", "BEVEL")
    mod_sub.width = 0.05
    mod_sub.segments = 4
    smooth_object(cushion)
    apply_material(cushion, mat_boucle)

    # Sculptural Wraparound Backrest & Armrest Shell
    # Horseshoe curved sweep around sides and back
    bm = bmesh.new()
    num_pts = 24
    angle_start = math.radians(-25)
    angle_end = math.radians(205)
    r_outer = 0.39
    r_inner = 0.30
    
    verts_outer_bot = []
    verts_inner_bot = []
    verts_outer_top = []
    verts_inner_top = []
    
    for i in range(num_pts + 1):
        t = i / num_pts
        angle = angle_start + t * (angle_end - angle_start)
        # Height rises toward the back (around t=0.5)
        curve_factor = math.sin(t * math.pi)
        h_top = 0.16 + curve_factor * 0.23 # reaches up to Z = 0.39
        h_bot = -0.16

        ca, sa = math.cos(angle), math.sin(angle)
        # center is offset slightly forward
        cy = -0.03
        v_ob = bm.verts.new((ca * r_outer, cy + sa * r_outer, h_bot))
        v_ib = bm.verts.new((ca * r_inner, cy + sa * r_inner, h_bot))
        v_ot = bm.verts.new((ca * r_outer, cy + sa * r_outer, h_top))
        v_it = bm.verts.new((ca * r_inner, cy + sa * r_inner, h_top))
        verts_outer_bot.append(v_ob)
        verts_inner_bot.append(v_ib)
        verts_outer_top.append(v_ot)
        verts_inner_top.append(v_it)

    for i in range(num_pts):
        # Outer face
        bm.faces.new([verts_outer_bot[i], verts_outer_bot[i+1], verts_outer_top[i+1], verts_outer_top[i]])
        # Inner face
        bm.faces.new([verts_inner_bot[i], verts_inner_top[i], verts_inner_top[i+1], verts_inner_bot[i+1]])
        # Top rim
        bm.faces.new([verts_outer_top[i], verts_outer_top[i+1], verts_inner_top[i+1], verts_inner_top[i]])
        # Bottom rim
        bm.faces.new([verts_outer_bot[i], verts_inner_bot[i], verts_inner_bot[i+1], verts_outer_bot[i+1]])

    # End caps at armrest terminals
    bm.faces.new([verts_outer_bot[0], verts_outer_top[0], verts_inner_top[0], verts_inner_bot[0]])
    bm.faces.new([verts_outer_bot[-1], verts_inner_bot[-1], verts_inner_top[-1], verts_outer_top[-1]])

    bm.normal_update()
    mesh = bpy.data.meshes.new("BackrestMesh")
    bm.to_mesh(mesh)
    bm.free()
    backrest_obj = bpy.data.objects.new("BackrestShell", mesh)
    bpy.context.collection.objects.link(backrest_obj)
    
    bev = backrest_obj.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.02
    bev.segments = 3
    smooth_object(backrest_obj)
    apply_material(backrest_obj, mat_boucle)

    # Accent Lumbar Pillow tucked inside
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.12, 0.04))
    pillow = bpy.context.active_object
    pillow.scale = (0.36, 0.14, 0.22)
    pillow.rotation_euler = (math.radians(-15), 0, 0)
    p_bev = pillow.modifiers.new("Bevel", "BEVEL")
    p_bev.width = 0.05
    p_bev.segments = 4
    smooth_object(pillow)
    apply_material(pillow, mat_accent)

    export_glb("chair_lounge.glb")

# -------------------------------------------------------------
# 2. FLUTED TRAVERTINE STONE COFFEE TABLE (table_coffee.glb)
# Dimensions: Width 1.18, Depth 0.68, Height 0.38 (Z in [-0.19, 0.19])
# -------------------------------------------------------------
def build_table_coffee():
    reset_scene()
    
    mat_travertine = create_pbr_material("TravertineStone", (0.91, 0.87, 0.80, 1.0), roughness=0.36, normal_noise=True, noise_scale=35.0)
    mat_cedar = create_pbr_material("AgedCedar", (0.64, 0.46, 0.30, 1.0), roughness=0.65)

    # Top Stone Slab: Honed oval-pill curved travertine (Z = 0.14 to 0.19, thickness 0.05)
    # Pill shape: two semicircles connected by a rectangle
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.34, depth=0.05, location=(-0.25, 0, 0.165))
    cap_left = bpy.context.active_object
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.34, depth=0.05, location=(0.25, 0, 0.165))
    cap_right = bpy.context.active_object
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.165))
    center_slab = bpy.context.active_object
    center_slab.scale = (0.50, 0.68, 0.05)

    # Join top slab parts into single mesh
    bpy.ops.object.select_all(action='DESELECT')
    cap_left.select_set(True)
    cap_right.select_set(True)
    center_slab.select_set(True)
    bpy.context.view_layer.objects.active = center_slab
    bpy.ops.object.join()
    top_slab = bpy.context.active_object

    bev = top_slab.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.012
    bev.segments = 3
    smooth_object(top_slab)
    apply_material(top_slab, mat_travertine)

    # Sub-top reveal ring
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.135))
    reveal = bpy.context.active_object
    reveal.scale = (0.90, 0.45, 0.015)
    apply_material(reveal, mat_cedar)

    # Two Architectural Fluted Column Pedestals at X = -0.32 and X = +0.32
    # Pedestal height from -0.19 to 0.125 (height = 0.315)
    for px in [-0.32, 0.32]:
        # Central core cylinder
        bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.17, depth=0.315, location=(px, 0, -0.0325))
        core = bpy.context.active_object
        smooth_object(core)
        apply_material(core, mat_travertine)

        # 16 Architectural Fluting Ribs around the perimeter
        for i in range(16):
            ang = (i / 16) * math.pi * 2
            fx = px + math.cos(ang) * 0.175
            fy = math.sin(ang) * 0.175
            bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.018, depth=0.31, location=(fx, fy, -0.0325))
            rib = bpy.context.active_object
            smooth_object(rib)
            apply_material(rib, mat_travertine)

        # Base plinth foot ring
        bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.20, depth=0.02, location=(px, 0, -0.18))
        plinth = bpy.context.active_object
        smooth_object(plinth)
        apply_material(plinth, mat_travertine)

    export_glb("table_coffee.glb")

# -------------------------------------------------------------
# 3. RUSTIC CEDAR ARCHITECTURAL DINING TABLE (table_dining.glb)
# Dimensions: Width 1.90, Depth 0.95, Height 0.76 (Z in [-0.38, 0.38])
# -------------------------------------------------------------
def build_table_dining():
    reset_scene()
    
    mat_cedar = create_pbr_material("RusticCedar", (0.63, 0.44, 0.27, 1.0), roughness=0.60, normal_noise=True, noise_scale=50.0)
    mat_brass = create_pbr_material("AntiqueBrass", (0.83, 0.68, 0.38, 1.0), roughness=0.25, metalness=0.9)

    # 4 Solid cedar tabletop planks (each 0.23m wide, thickness 0.055m, length 1.90m)
    # Z = 0.325 to 0.38
    for i, py in enumerate([-0.35, -0.117, 0.117, 0.35]):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, py, 0.3525))
        plank = bpy.context.active_object
        plank.scale = (1.90, 0.225, 0.055)
        bev = plank.modifiers.new("Bevel", "BEVEL")
        bev.width = 0.008
        bev.segments = 3
        smooth_object(plank)
        apply_material(plank, mat_cedar)

    # Underframe Aprons
    for ay in [-0.38, 0.38]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, ay, 0.285))
        apron = bpy.context.active_object
        apron.scale = (1.68, 0.035, 0.075)
        apply_material(apron, mat_cedar)
    for ax in [-0.80, 0.80]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(ax, 0, 0.285))
        apron_end = bpy.context.active_object
        apron_end.scale = (0.035, 0.72, 0.075)
        apply_material(apron_end, mat_cedar)

    # 4 Turned Architectural Pillar Legs with Brass Collars & Ferrules
    # Z from -0.38 to 0.325 (depth 0.705)
    for lx, ly in [(-0.80, -0.36), (0.80, -0.36), (-0.80, 0.36), (0.80, 0.36)]:
        # Top brass reveal collar
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.048, depth=0.02, location=(lx, ly, 0.315))
        collar = bpy.context.active_object
        smooth_object(collar)
        apply_material(collar, mat_brass)

        # Turned cylindrical timber leg (tapered)
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.044, depth=0.64, location=(lx, ly, -0.015))
        leg = bpy.context.active_object
        leg.scale = (1.0, 1.0, 1.0)
        smooth_object(leg)
        apply_material(leg, mat_cedar)

        # Bottom brass ferrule sleeve
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.045, depth=0.05, location=(lx, ly, -0.355))
        ferrule = bpy.context.active_object
        smooth_object(ferrule)
        apply_material(ferrule, mat_brass)

    export_glb("table_dining.glb")

# -------------------------------------------------------------
# 4. ARTISAN MEDITERRANEAN DINING CHAIR (chair_dining.glb)
# Dimensions: Width 0.52, Depth 0.52, Height 0.88 (Z in [-0.44, 0.44])
# -------------------------------------------------------------
def build_chair_dining():
    reset_scene()
    
    mat_wood = create_pbr_material("TurnedCedar", (0.62, 0.43, 0.26, 1.0), roughness=0.62)
    mat_rush = create_pbr_material("WovenPaperCord", (0.84, 0.77, 0.64, 1.0), roughness=0.88, normal_noise=True, noise_scale=70.0)

    # Front Legs (Z = -0.44 to 0.00, seat height ~0.44m)
    for fx in [-0.21, 0.21]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.018, depth=0.44, location=(fx, -0.21, -0.22))
        leg = bpy.context.active_object
        smooth_object(leg)
        apply_material(leg, mat_wood)

    # Rear Upright Posts extending all the way to top backrest (Z = -0.44 to 0.40)
    for rx in [-0.19, 0.19]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.018, depth=0.84, location=(rx, 0.21, -0.02))
        post = bpy.context.active_object
        post.rotation_euler = (math.radians(-4), 0, 0)
        smooth_object(post)
        apply_material(post, mat_wood)

    # Horizontal Leg Stretchers
    stretcher_coords = [
        ((-0.21, 0, -0.28), (0.01, 0.40, 0.01)),
        ((0.21, 0, -0.28), (0.01, 0.40, 0.01)),
        ((0, -0.21, -0.32), (0.40, 0.01, 0.01)),
        ((0, 0.21, -0.32), (0.36, 0.01, 0.01))
    ]
    for loc, scale in stretcher_coords:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
        str_obj = bpy.context.active_object
        str_obj.scale = scale
        smooth_object(str_obj)
        apply_material(str_obj, mat_wood)

    # Seat Frame & Woven Cord Cushion Pad (Z = 0.0 to 0.04)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.01, 0.02))
    seat = bpy.context.active_object
    seat.scale = (0.47, 0.46, 0.045)
    bev = seat.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.018
    bev.segments = 3
    smooth_object(seat)
    apply_material(seat, mat_rush)

    # Curved Steam-Bent Crest Rail (Backrest top, Z = 0.36 to 0.44)
    bm = bmesh.new()
    num_pts = 16
    for i in range(num_pts + 1):
        t = i / num_pts
        ang = math.radians(-30) + t * math.radians(60)
        x = math.sin(ang) * 0.26
        y = 0.21 + (1.0 - math.cos(ang)) * 0.10
        # cross section quad
        v1 = bm.verts.new((x - 0.015, y, 0.36))
        v2 = bm.verts.new((x + 0.015, y, 0.36))
        v3 = bm.verts.new((x + 0.015, y, 0.43))
        v4 = bm.verts.new((x - 0.015, y, 0.43))

    bm.verts.ensure_lookup_table()
    for i in range(num_pts):
        idx = i * 4
        bm.faces.new([bm.verts[idx], bm.verts[idx+4], bm.verts[idx+7], bm.verts[idx+3]])
        bm.faces.new([bm.verts[idx+1], bm.verts[idx+2], bm.verts[idx+6], bm.verts[idx+5]])
        bm.faces.new([bm.verts[idx+3], bm.verts[idx+7], bm.verts[idx+6], bm.verts[idx+2]])
        bm.faces.new([bm.verts[idx], bm.verts[idx+1], bm.verts[idx+5], bm.verts[idx+4]])
    bm.normal_update()
    crest_mesh = bpy.data.meshes.new("CrestMesh")
    bm.to_mesh(crest_mesh)
    bm.free()
    crest_obj = bpy.data.objects.new("CrestRail", crest_mesh)
    bpy.context.collection.objects.link(crest_obj)
    smooth_object(crest_obj)
    apply_material(crest_obj, mat_wood)

    # Central Wishbone / Spindle Support
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.012, depth=0.34, location=(0, 0.23, 0.20))
    center_spindle = bpy.context.active_object
    center_spindle.rotation_euler = (math.radians(-6), 0, 0)
    smooth_object(center_spindle)
    apply_material(center_spindle, mat_wood)

    export_glb("chair_dining.glb")

# -------------------------------------------------------------
# 5. ARTISAN 3-DRAWER CREDENZA (med_drawers.glb)
# Dimensions: Width 1.30, Depth 0.50, Height 0.84 (Z in [-0.42, 0.42])
# -------------------------------------------------------------
def build_med_drawers():
    reset_scene()
    
    mat_cedar = create_pbr_material("ArtisanCedar", (0.64, 0.45, 0.28, 1.0), roughness=0.62)
    mat_fluted = create_pbr_material("FlutedCedar", (0.61, 0.42, 0.25, 1.0), roughness=0.68, normal_noise=True, noise_scale=90.0)
    mat_brass = create_pbr_material("AntiqueBrass", (0.83, 0.68, 0.38, 1.0), roughness=0.25, metalness=0.9)
    mat_ceramic = create_pbr_material("GlazedCeramic", (0.85, 0.82, 0.76, 1.0), roughness=0.22)

    # 4 Tapered Turned Legs with Brass Ferrules (Z = -0.42 to -0.24, height 0.18)
    for lx, ly in [(-0.55, -0.18), (0.55, -0.18), (-0.55, 0.18), (0.55, 0.18)]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.024, depth=0.18, location=(lx, ly, -0.33))
        leg = bpy.context.active_object
        smooth_object(leg)
        apply_material(leg, mat_cedar)

        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.025, depth=0.045, location=(lx, ly, -0.395))
        ferrule = bpy.context.active_object
        smooth_object(ferrule)
        apply_material(ferrule, mat_brass)

    # Main Carcass Box (Z = -0.24 to 0.39, height 0.63)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.075))
    carcass = bpy.context.active_object
    carcass.scale = (1.28, 0.48, 0.63)
    apply_material(carcass, mat_fluted)

    # Top Beveled Slab (Z = 0.39 to 0.42)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.405))
    top_slab = bpy.context.active_object
    top_slab.scale = (1.30, 0.50, 0.03)
    bev = top_slab.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.008
    bev.segments = 3
    smooth_object(top_slab)
    apply_material(top_slab, mat_cedar)

    # 3 Drawer Fronts with Horizontal Recessed Brass Bar Handles
    drawer_heights = [0.18, 0.19, 0.20]
    drawer_z_centers = [-0.13, 0.07, 0.28]
    for idx, dz in enumerate(drawer_z_centers):
        drawer_empty = bpy.data.objects.new(f"DrawerGroup_{idx}", None)
        bpy.context.collection.objects.link(drawer_empty)
        drawer_empty.location = (0, 0, 0)

        # Front panel
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.245, dz))
        front = bpy.context.active_object
        front.name = f"DrawerFront_{idx}"
        front.scale = (1.22, 0.02, drawer_heights[idx] - 0.015)
        apply_material(front, mat_cedar)
        front.parent = drawer_empty

        # Brushed Brass Bar Pull
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.007, depth=0.18, location=(0, -0.268, dz))
        pull = bpy.context.active_object
        pull.name = f"DrawerPull_{idx}"
        pull.rotation_euler = (0, math.radians(90), 0)
        smooth_object(pull)
        apply_material(pull, mat_brass)
        pull.parent = drawer_empty

        # Pull stanchions
        for s_i, sx in enumerate([-0.07, 0.07]):
            bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.005, depth=0.018, location=(sx, -0.258, dz))
            stanchion = bpy.context.active_object
            stanchion.name = f"DrawerStanchion_{idx}_{s_i}"
            stanchion.rotation_euler = (math.radians(90), 0, 0)
            apply_material(stanchion, mat_brass)
            stanchion.parent = drawer_empty

    # Decorative Ceramic Catchall Bowl on Top
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.11, depth=0.035, location=(-0.35, 0.04, 0.438))
    bowl = bpy.context.active_object
    smooth_object(bowl)
    apply_material(bowl, mat_ceramic)

    export_glb("med_drawers.glb")

# -------------------------------------------------------------
# 6. MEDITERRANEAN BEDSIDE NIGHTSTAND (nightstand_drawer.glb)
# Dimensions: Width 0.56, Depth 0.44, Height 0.62 (Z in [-0.31, 0.31])
# -------------------------------------------------------------
def build_nightstand():
    reset_scene()
    
    mat_cedar = create_pbr_material("NightstandCedar", (0.64, 0.45, 0.28, 1.0), roughness=0.62)
    mat_brass = create_pbr_material("AntiqueBrass", (0.83, 0.68, 0.38, 1.0), roughness=0.25, metalness=0.9)
    mat_book = create_pbr_material("LeatherCover", (0.28, 0.34, 0.42, 1.0), roughness=0.55)

    # 4 Round Tapered Legs (Z = -0.31 to -0.13, height 0.18)
    for lx, ly in [(-0.23, -0.17), (0.23, -0.17), (-0.23, 0.17), (0.23, 0.17)]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.018, depth=0.18, location=(lx, ly, -0.22))
        leg = bpy.context.active_object
        smooth_object(leg)
        apply_material(leg, mat_cedar)

        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.019, depth=0.035, location=(lx, ly, -0.29))
        ferrule = bpy.context.active_object
        smooth_object(ferrule)
        apply_material(ferrule, mat_brass)

    # Carcass (Z = -0.13 to 0.29, height 0.42)
    # Open cubby in lower half (Z = -0.11 to 0.06), Drawer in upper half (Z = 0.08 to 0.27)
    # Side walls
    for sx in [-0.265, 0.265]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, 0, 0.08))
        wall = bpy.context.active_object
        wall.scale = (0.025, 0.42, 0.42)
        apply_material(wall, mat_cedar)

    # Bottom and Middle shelf
    for sz in [-0.12, 0.07]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, sz))
        shelf = bpy.context.active_object
        shelf.scale = (0.52, 0.42, 0.02)
        apply_material(shelf, mat_cedar)

    # Top Beveled Cap (Z = 0.29 to 0.31)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.30))
    cap = bpy.context.active_object
    cap.scale = (0.56, 0.44, 0.02)
    bev = cap.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.006
    bev.segments = 2
    smooth_object(cap)
    apply_material(cap, mat_cedar)

    # Drawer Front & Pull grouped under NightstandDrawerGroup
    ns_empty = bpy.data.objects.new("NightstandDrawerGroup", None)
    bpy.context.collection.objects.link(ns_empty)
    ns_empty.location = (0, 0, 0)

    # Drawer Front (Z = 0.175)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.205, 0.175))
    df = bpy.context.active_object
    df.name = "NSDrawerFront"
    df.scale = (0.50, 0.02, 0.19)
    apply_material(df, mat_cedar)
    df.parent = ns_empty

    # Antique Brass Ring Drop Pull
    bpy.ops.mesh.primitive_torus_add(major_radius=0.022, minor_radius=0.004, location=(0, -0.228, 0.175))
    ring = bpy.context.active_object
    ring.name = "NSDrawerRing"
    ring.rotation_euler = (math.radians(90), 0, 0)
    smooth_object(ring)
    apply_material(ring, mat_brass)
    ring.parent = ns_empty

    # Display Book in Lower Cubby
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.04, 0, -0.07))
    book = bpy.context.active_object
    book.scale = (0.24, 0.28, 0.035)
    apply_material(book, mat_book)

    export_glb("nightstand_drawer.glb")

# -------------------------------------------------------------
# 7. ARTISAN MEDITERRANEAN PLATFORM KING BED (bed_king.glb)
# Dimensions: Width 2.15, Depth 2.25, Height 1.15 (Z in [-0.575, 0.575])
# -------------------------------------------------------------
def build_bed_king():
    reset_scene()
    
    mat_cedar = create_pbr_material("PlatformCedar", (0.64, 0.45, 0.28, 1.0), roughness=0.62)
    mat_boucle = create_pbr_material("BoucleHeadboard", (0.91, 0.88, 0.82, 1.0), roughness=0.92, normal_noise=True, noise_scale=75.0)
    mat_linen_white = create_pbr_material("BelgianLinen", (0.94, 0.92, 0.88, 1.0), roughness=0.90)
    mat_duvet = create_pbr_material("TerracottaDuvet", (0.76, 0.46, 0.33, 1.0), roughness=0.92, normal_noise=True, noise_scale=60.0)
    mat_brass = create_pbr_material("AntiqueBrass", (0.83, 0.68, 0.38, 1.0), roughness=0.25, metalness=0.9)

    # Cantilevered Base Plinth (recessed shadow box, Z = -0.575 to -0.475)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.10, -0.525))
    plinth = bpy.context.active_object
    plinth.scale = (1.80, 1.85, 0.10)
    apply_material(plinth, mat_cedar)

    # Floating Solid Cedar Platform (Z = -0.475 to -0.325, height 0.15)
    # Width 2.15, Depth 2.20
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.02, -0.40))
    platform = bpy.context.active_object
    platform.scale = (2.15, 2.18, 0.15)
    bev = platform.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.012
    bev.segments = 3
    smooth_object(platform)
    apply_material(platform, mat_cedar)

    # Architectural Fluted Bouclé Headboard (at back Y = 1.05, Z = -0.575 to 0.575)
    # Height = 1.15, Width = 2.15, Depth = 0.16
    # Cedar border frame
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 1.05, 0.0))
    hb_frame = bpy.context.active_object
    hb_frame.scale = (2.15, 0.14, 1.15)
    apply_material(hb_frame, mat_cedar)

    # 4 Horizontal Channel-Tufted Bouclé Cushions on Headboard face
    hb_cushion_z = [-0.28, -0.08, 0.12, 0.32]
    for hz in hb_cushion_z:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.97, hz))
        panel = bpy.context.active_object
        panel.scale = (1.98, 0.06, 0.18)
        p_bev = panel.modifiers.new("Bevel", "BEVEL")
        p_bev.width = 0.025
        p_bev.segments = 3
        smooth_object(panel)
        apply_material(panel, mat_boucle)

    # Mattress (Z = -0.325 to -0.075, thickness 0.25, width 1.80, depth 1.95)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.05, -0.20))
    mattress = bpy.context.active_object
    mattress.scale = (1.80, 1.95, 0.25)
    m_bev = mattress.modifiers.new("Bevel", "BEVEL")
    m_bev.width = 0.04
    m_bev.segments = 4
    smooth_object(mattress)
    apply_material(mattress, mat_linen_white)

    # Folded Terracotta Linen Duvet (covering lower 60% of bed, Y = -1.02 to 0.15, Z = -0.06 to 0.02)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.42, -0.04))
    duvet = bpy.context.active_object
    duvet.scale = (1.84, 1.20, 0.12)
    d_bev = duvet.modifiers.new("Bevel", "BEVEL")
    d_bev.width = 0.045
    d_bev.segments = 4
    smooth_object(duvet)
    apply_material(duvet, mat_duvet)

    # Duvet foldback cuff at top edge
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.18, -0.01))
    cuff = bpy.context.active_object
    cuff.scale = (1.85, 0.16, 0.06)
    c_bev = cuff.modifiers.new("Bevel", "BEVEL")
    c_bev.width = 0.025
    c_bev.segments = 3
    smooth_object(cuff)
    apply_material(cuff, mat_linen_white)

    # 4 European Sleeping Pillows angled 20 degrees against headboard (Y = 0.65 to 0.85)
    for px in [-0.46, 0.46]:
        # Back pillows
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, 0.76, 0.08))
        pillow = bpy.context.active_object
        pillow.scale = (0.75, 0.20, 0.44)
        pillow.rotation_euler = (math.radians(-25), 0, 0)
        p_bev = pillow.modifiers.new("Bevel", "BEVEL")
        p_bev.width = 0.06
        p_bev.segments = 4
        smooth_object(pillow)
        apply_material(pillow, mat_linen_white)

        # Front accent pillows
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, 0.54, 0.02))
        front_p = bpy.context.active_object
        front_p.scale = (0.58, 0.16, 0.34)
        front_p.rotation_euler = (math.radians(-20), 0, 0)
        fp_bev = front_p.modifiers.new("Bevel", "BEVEL")
        fp_bev.width = 0.05
        fp_bev.segments = 4
        smooth_object(front_p)
        apply_material(front_p, mat_duvet)

    # Sconce Plates on headboard sides
    for bx in [-1.02, 1.02]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.035, depth=0.015, location=(bx, 0.98, 0.20))
        plate = bpy.context.active_object
        plate.rotation_euler = (math.radians(90), 0, 0)
        smooth_object(plate)
        apply_material(plate, mat_brass)

    export_glb("bed_king.glb")

# -------------------------------------------------------------
# 8. POTTED MEDITERRANEAN OLIVE TREE (prop_plant.glb)
# Dimensions: Width 0.60, Depth 0.60, Height 1.75 (Z in [-0.875, 0.875])
# -------------------------------------------------------------
def build_prop_plant():
    reset_scene()
    
    mat_pot = create_pbr_material("TerracottaPlanter", (0.72, 0.38, 0.24, 1.0), roughness=0.75, normal_noise=True, noise_scale=45.0)
    mat_soil = create_pbr_material("PottingSoil", (0.16, 0.12, 0.09, 1.0), roughness=0.96)
    mat_bark = create_pbr_material("OliveBark", (0.38, 0.32, 0.26, 1.0), roughness=0.88, normal_noise=True, noise_scale=60.0)
    mat_leaf = create_pbr_material("OliveLeaf", (0.32, 0.40, 0.26, 1.0), roughness=0.55)
    mat_olive = create_pbr_material("RipeOlive", (0.14, 0.16, 0.12, 1.0), roughness=0.30)

    # Planter Pot: Classical fluted urn planter (Z = -0.875 to -0.425, height 0.45)
    # Lathe profile for urn
    bm = bmesh.new()
    segments = 32
    profile = [
        (-0.875, 0.14),
        (-0.855, 0.15),
        (-0.835, 0.17),
        (-0.700, 0.19),
        (-0.500, 0.22),
        (-0.450, 0.235), # neck flare
        (-0.425, 0.245), # rolled lip rim
        (-0.425, 0.21)   # inside lip
    ]
    # Build lathe rings
    rings = []
    for z, r in profile:
        ring = []
        for s in range(segments):
            ang = (s / segments) * math.pi * 2
            ring.append(bm.verts.new((math.cos(ang) * r, math.sin(ang) * r, z)))
        rings.append(ring)
    
    for r_idx in range(len(rings) - 1):
        for s in range(segments):
            s_next = (s + 1) % segments
            bm.faces.new([rings[r_idx][s], rings[r_idx+1][s], rings[r_idx+1][s_next], rings[r_idx][s_next]])
    
    # Base bottom cap
    base_center = bm.verts.new((0, 0, -0.875))
    for s in range(segments):
        s_next = (s + 1) % segments
        bm.faces.new([base_center, rings[0][s_next], rings[0][s]])

    bm.normal_update()
    pot_mesh = bpy.data.meshes.new("PotMesh")
    bm.to_mesh(pot_mesh)
    bm.free()
    pot_obj = bpy.data.objects.new("PlanterPot", pot_mesh)
    bpy.context.collection.objects.link(pot_obj)
    smooth_object(pot_obj)
    apply_material(pot_obj, mat_pot)

    # Soil Disc (Z = -0.45)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.205, depth=0.03, location=(0, 0, -0.45))
    soil = bpy.context.active_object
    smooth_object(soil)
    apply_material(soil, mat_soil)

    # Gnarled Sculptural Olive Trunk (Z = -0.45 to 0.20, then branches out)
    trunk_pts = [
        (0.00, 0.00, -0.44, 0.045),
        (0.01, -0.02, -0.25, 0.040),
        (-0.02, 0.02, -0.05, 0.035),
        (0.02, -0.01, 0.15, 0.030)
    ]
    for i in range(len(trunk_pts) - 1):
        p1 = trunk_pts[i]
        p2 = trunk_pts[i+1]
        mid = ((p1[0]+p2[0])/2, (p1[1]+p2[1])/2, (p1[2]+p2[2])/2)
        dz = p2[2] - p1[2]
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=(p1[3]+p2[3])/2, depth=dz * 1.05, location=mid)
        seg = bpy.context.active_object
        smooth_object(seg)
        apply_material(seg, mat_bark)

    # 3 Organic Boughs branching upward into the canopy
    branch_targets = [
        ((-0.18, -0.12, 0.55), (-15, -25, 0)),
        ((0.16, -0.10, 0.60), (-12, 22, 0)),
        ((0.00, 0.18, 0.65), (25, 0, 0))
    ]
    for b_target, rot in branch_targets:
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.020, depth=0.45, location=((b_target[0]*0.5), (b_target[1]*0.5), 0.35))
        branch = bpy.context.active_object
        branch.rotation_euler = (math.radians(rot[0]), math.radians(rot[1]), math.radians(rot[2]))
        smooth_object(branch)
        apply_material(branch, mat_bark)

    # Foliage Canopy Clusters (layered spheres/ellipsoids with olive leaf material)
    canopy_clusters = [
        (-0.18, -0.12, 0.65, 0.22, 0.18),
        (0.18, -0.10, 0.70, 0.24, 0.20),
        (0.00, 0.18, 0.74, 0.23, 0.19),
        (-0.08, 0.05, 0.82, 0.25, 0.18),
        (0.08, -0.04, 0.84, 0.22, 0.17)
    ]
    for cx, cy, cz, rx, rz in canopy_clusters:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=16, radius=rx, location=(cx, cy, cz))
        cluster = bpy.context.active_object
        cluster.scale = (1.0, 1.0, rz / rx)
        # Randomize slightly with noise/displace
        smooth_object(cluster)
        apply_material(cluster, mat_leaf)

    # Tiny Hanging Ripe Olives
    olive_locs = [
        (-0.22, -0.08, 0.52),
        (0.14, -0.15, 0.56),
        (0.02, 0.22, 0.58),
        (-0.05, 0.12, 0.68)
    ]
    for ox, oy, oz in olive_locs:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.016, location=(ox, oy, oz))
        ol = bpy.context.active_object
        ol.scale = (0.9, 0.9, 1.4)
        smooth_object(ol)
        apply_material(ol, mat_olive)

    export_glb("prop_plant.glb")

# -------------------------------------------------------------
# 9. HANDCRAFTED TERRACOTTA AMPHORA URN (prop_vase.glb)
# Dimensions: Width 0.44, Depth 0.44, Height 0.58 (Z in [-0.29, 0.29])
# -------------------------------------------------------------
def build_prop_vase():
    reset_scene()
    
    mat_clay = create_pbr_material("TerracottaAmphora", (0.76, 0.41, 0.25, 1.0), roughness=0.76, normal_noise=True, noise_scale=50.0)

    # Lathe of Revolution for Urn Body
    bm = bmesh.new()
    segments = 36
    # Profile from base to flared lip rim
    profile = [
        (-0.290, 0.08),  # base foot ring
        (-0.270, 0.09),
        (-0.240, 0.11),  # lower taper
        (-0.120, 0.17),  # swelling belly
        (0.020, 0.185),  # shoulder maximum
        (0.120, 0.12),   # neck constriction
        (0.200, 0.095),  # slender neck
        (0.260, 0.125),  # neck flare
        (0.290, 0.140),  # rolled lip rim
        (0.280, 0.115)   # inner lip recess
    ]
    rings = []
    for z, r in profile:
        ring = []
        for s in range(segments):
            ang = (s / segments) * math.pi * 2
            ring.append(bm.verts.new((math.cos(ang) * r, math.sin(ang) * r, z)))
        rings.append(ring)
    
    for r_idx in range(len(rings) - 1):
        for s in range(segments):
            s_next = (s + 1) % segments
            bm.faces.new([rings[r_idx][s], rings[r_idx+1][s], rings[r_idx+1][s_next], rings[r_idx][s_next]])
    
    # Base bottom cap
    base_center = bm.verts.new((0, 0, -0.290))
    for s in range(segments):
        s_next = (s + 1) % segments
        bm.faces.new([base_center, rings[0][s_next], rings[0][s]])

    bm.normal_update()
    urn_mesh = bpy.data.meshes.new("UrnMesh")
    bm.to_mesh(urn_mesh)
    bm.free()
    urn_obj = bpy.data.objects.new("AmphoraUrn", urn_mesh)
    bpy.context.collection.objects.link(urn_obj)
    smooth_object(urn_obj)
    apply_material(urn_obj, mat_clay)

    # Two Curved Loop Handles connecting neck to shoulder (X = -0.15 and X = +0.15)
    for sign in [-1, 1]:
        bm_h = bmesh.new()
        handle_pts = 12
        for i in range(handle_pts + 1):
            t = i / handle_pts
            # Arc from neck (0.10, 0, 0.22) arching outward to shoulder (0.17, 0, 0.04)
            ang = t * math.pi
            hx = sign * (0.11 + math.sin(ang) * 0.08)
            hz = 0.22 - t * 0.18
            # Cross section
            r_h = 0.014
            for s in range(8):
                h_ang = (s / 8) * math.pi * 2
                hy = math.cos(h_ang) * r_h
                hz_sub = math.sin(h_ang) * r_h
                bm_h.verts.new((hx, hy, hz + hz_sub))
        
        bm_h.verts.ensure_lookup_table()
        for i in range(handle_pts):
            for s in range(8):
                s_next = (s + 1) % 8
                v0 = bm_h.verts[i * 8 + s]
                v1 = bm_h.verts[(i + 1) * 8 + s]
                v2 = bm_h.verts[(i + 1) * 8 + s_next]
                v3 = bm_h.verts[i * 8 + s_next]
                bm_h.faces.new([v0, v1, v2, v3])

        bm_h.normal_update()
        h_mesh = bpy.data.meshes.new("HandleMesh")
        bm_h.to_mesh(h_mesh)
        bm_h.free()
        h_obj = bpy.data.objects.new("AmphoraHandle", h_mesh)
        bpy.context.collection.objects.link(h_obj)
        smooth_object(h_obj)
        apply_material(h_obj, mat_clay)

    export_glb("prop_vase.glb")

# -------------------------------------------------------------
# 10. MEDITERRANEAN WOVEN LINEN POUF (pouf_velvet.glb)
# Dimensions: Width 0.62, Depth 0.62, Height 0.36 (Z in [-0.18, 0.18])
# -------------------------------------------------------------
def build_pouf():
    reset_scene()
    
    mat_pouf = create_pbr_material("WovenPouf", (0.86, 0.81, 0.72, 1.0), roughness=0.92, normal_noise=True, noise_scale=65.0)
    mat_leather = create_pbr_material("LeatherButton", (0.42, 0.28, 0.18, 1.0), roughness=0.45)

    # Organic rounded cylinder with 8 radial seam segments
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.31, depth=0.36, location=(0, 0, 0))
    pouf = bpy.context.active_object
    bev = pouf.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.08
    bev.segments = 5
    smooth_object(pouf)
    apply_material(pouf, mat_pouf)

    # Center Button Tuft on Top (Z = 0.17)
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.024, depth=0.015, location=(0, 0, 0.175))
    btn = bpy.context.active_object
    smooth_object(btn)
    apply_material(btn, mat_leather)

    # 8 Seam Piping Ribs radiating from center button to outer edge
    for i in range(8):
        ang = (i / 8) * math.pi * 2
        px = math.cos(ang) * 0.15
        py = math.sin(ang) * 0.15
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.006, depth=0.28, location=(px, py, 0.172))
        rib = bpy.context.active_object
        rib.rotation_euler = (math.radians(90), 0, ang + math.pi / 2)
        smooth_object(rib)
        apply_material(rib, mat_pouf)

    export_glb("pouf_velvet.glb")

# -------------------------------------------------------------
# 11. SCULPTURAL CAT COMPANION (prop_cat.glb)
# Dimensions: Width 0.32, Depth 0.45, Height 0.28 (Z in [-0.14, 0.14])
# -------------------------------------------------------------
def build_prop_cat():
    reset_scene()
    
    mat_ceramic = create_pbr_material("GlazedCatCeramic", (0.82, 0.52, 0.32, 1.0), roughness=0.28)

    # Sleek Architectural Cat Body (seated posture)
    # Hindquarters sphere/egg at back
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.12, location=(0, 0.08, -0.04))
    body_rear = bpy.context.active_object
    body_rear.scale = (0.95, 1.35, 1.0)
    smooth_object(body_rear)
    apply_material(body_rear, mat_ceramic)

    # Chest & Arched Back extending forward and upward
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.09, location=(0, -0.08, 0.02))
    chest = bpy.context.active_object
    chest.scale = (0.9, 1.1, 1.25)
    smooth_object(chest)
    apply_material(chest, mat_ceramic)

    # Sculptural Head & Neck
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.07, location=(0, -0.16, 0.07))
    head = bpy.context.active_object
    head.scale = (0.95, 1.05, 0.95)
    smooth_object(head)
    apply_material(head, mat_ceramic)

    # Pointed Alert Ears
    for ex in [-0.042, 0.042]:
        bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.025, depth=0.05, location=(ex, -0.15, 0.13))
        ear = bpy.context.active_object
        ear.rotation_euler = (math.radians(-10), math.radians(-ex * 200), 0)
        smooth_object(ear)
        apply_material(ear, mat_ceramic)

    # Curled Tail Wrapping Around Paw (Torus segment)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.13, minor_radius=0.016, location=(0.04, 0.04, -0.125))
    tail = bpy.context.active_object
    tail.scale = (0.9, 1.2, 0.8)
    smooth_object(tail)
    apply_material(tail, mat_ceramic)

    export_glb("prop_cat.glb")

# -------------------------------------------------------------
# 12. TIMBER SHIPPING CRATE (crate_wood.glb)
# Dimensions: Width 0.55, Depth 0.55, Height 0.55 (Z in [-0.275, 0.275])
# -------------------------------------------------------------
def build_crate_wood():
    reset_scene()
    
    mat_pine = create_pbr_material("PinePlanks", (0.70, 0.54, 0.36, 1.0), roughness=0.72, normal_noise=True, noise_scale=50.0)
    mat_metal = create_pbr_material("CornerIron", (0.24, 0.24, 0.26, 1.0), roughness=0.45, metalness=0.85)

    # Core Crate Box (0.53m)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    core = bpy.context.active_object
    core.scale = (0.53, 0.53, 0.53)
    apply_material(core, mat_pine)

    # Outer Battens (top, bottom, and vertical edges)
    # 4 Vertical corner battens
    for bx in [-0.26, 0.26]:
        for by in [-0.26, 0.26]:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(bx, by, 0))
            b_vert = bpy.context.active_object
            b_vert.scale = (0.035, 0.035, 0.55)
            apply_material(b_vert, mat_pine)

    # Horizontal rim battens (top & bottom)
    for bz in [-0.26, 0.26]:
        for bx in [-0.26, 0.26]:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(bx, 0, bz))
            b_h1 = bpy.context.active_object
            b_h1.scale = (0.035, 0.52, 0.035)
            apply_material(b_h1, mat_pine)
        for by in [-0.26, 0.26]:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, by, bz))
            b_h2 = bpy.context.active_object
            b_h2.scale = (0.52, 0.035, 0.035)
            apply_material(b_h2, mat_pine)

    # Metal Corner Angle Brackets on all 8 corners
    for cx in [-0.265, 0.265]:
        for cy in [-0.265, 0.265]:
            for cz in [-0.265, 0.265]:
                bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz))
                bracket = bpy.context.active_object
                bracket.scale = (0.045, 0.045, 0.045)
                smooth_object(bracket)
                apply_material(bracket, mat_metal)

    export_glb("crate_wood.glb")

# -------------------------------------------------------------
# 13. INDUSTRIAL GALVANIZED STEEL CARGO BOX (crate_industrial.glb)
# Dimensions: Width 0.50, Depth 0.50, Height 0.50 (Z in [-0.25, 0.25])
# -------------------------------------------------------------
def build_crate_industrial():
    reset_scene()
    
    mat_steel = create_pbr_material("GalvanizedSteel", (0.58, 0.60, 0.62, 1.0), roughness=0.35, metalness=0.90, normal_noise=True, noise_scale=40.0)
    mat_black_steel = create_pbr_material("IndustrialBlack", (0.18, 0.18, 0.20, 1.0), roughness=0.50, metalness=0.80)
    mat_hazard = create_pbr_material("HazardYellow", (0.85, 0.65, 0.12, 1.0), roughness=0.40)

    # Main Steel Box
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    box = bpy.context.active_object
    box.scale = (0.48, 0.48, 0.48)
    apply_material(box, mat_steel)

    # Corrugated Stiffener Ribs on Front and Back faces
    for side_y in [-0.245, 0.245]:
        for rz in [-0.14, 0.0, 0.14]:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, side_y, rz))
            rib = bpy.context.active_object
            rib.scale = (0.42, 0.015, 0.035)
            smooth_object(rib)
            apply_material(rib, mat_steel)

    # Heavy Industrial Corner Castings on 8 corners
    for cx in [-0.235, 0.235]:
        for cy in [-0.235, 0.235]:
            for cz in [-0.235, 0.235]:
                bpy.ops.mesh.primitive_cube_add(size=1.0, location=(cx, cy, cz))
                casting = bpy.context.active_object
                casting.scale = (0.045, 0.045, 0.045)
                smooth_object(casting)
                apply_material(casting, mat_black_steel)

    # Top Lifting Lugs / Handles
    for hx in [-0.15, 0.15]:
        bpy.ops.mesh.primitive_torus_add(major_radius=0.03, minor_radius=0.007, location=(hx, 0, 0.25))
        lug = bpy.context.active_object
        lug.rotation_euler = (math.radians(90), 0, 0)
        smooth_object(lug)
        apply_material(lug, mat_black_steel)

    # Warning Hazard Stencil Plate on Front
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.248, 0))
    stencil = bpy.context.active_object
    stencil.scale = (0.16, 0.005, 0.08)
    apply_material(stencil, mat_hazard)

    export_glb("crate_industrial.glb")

# -------------------------------------------------------------
# 14. ARCHITECTURAL L-SECTIONAL DESIGNER SOFA (sofa_sectional.glb)
# Dimensions: Main width 3.0, Return depth 2.2, Height 0.72 (Z in [-0.36, 0.36])
# -------------------------------------------------------------
def build_sofa_sectional():
    reset_scene()
    
    mat_boucle = create_pbr_material("NordicBoucle", (0.92, 0.90, 0.85, 1.0), roughness=0.92, normal_noise=True, noise_scale=75.0)
    mat_oak = create_pbr_material("SofaOakPlinth", (0.64, 0.46, 0.29, 1.0), roughness=0.62)
    mat_terracotta = create_pbr_material("TerracottaAccent", (0.74, 0.42, 0.28, 1.0), roughness=0.90)
    mat_sage = create_pbr_material("SageOliveAccent", (0.38, 0.46, 0.34, 1.0), roughness=0.90)

    # Low-profile Cantilever Oak Plinth (Z = -0.36 to -0.26)
    # Main plinth
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.31))
    plinth_main = bpy.context.active_object
    plinth_main.scale = (3.0, 1.05, 0.10)
    apply_material(plinth_main, mat_oak)

    # Chaise return plinth (on left side X = -1.0 to -1.5, extending forward Y = -0.5 to -1.3)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.0, -0.85, -0.31))
    plinth_return = bpy.context.active_object
    plinth_return.scale = (1.00, 0.85, 0.10)
    apply_material(plinth_return, mat_oak)

    # 3 Plump Seat Modules along main run (Z = -0.26 to -0.04)
    for i, mx in enumerate([-0.95, 0.05, 1.05]):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(mx, 0.05, -0.15))
        seat_mod = bpy.context.active_object
        seat_mod.scale = (0.94, 0.92, 0.22)
        bev = seat_mod.modifiers.new("Bevel", "BEVEL")
        bev.width = 0.045
        bev.segments = 4
        smooth_object(seat_mod)
        apply_material(seat_mod, mat_boucle)

    # Chaise Lounge Cushion (left side extending forward)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.0, -0.85, -0.15))
    chaise = bpy.context.active_object
    chaise.scale = (0.94, 0.90, 0.22)
    c_bev = chaise.modifiers.new("Bevel", "BEVEL")
    c_bev.width = 0.045
    c_bev.segments = 4
    smooth_object(chaise)
    apply_material(chaise, mat_boucle)

    # Curved Backrest Structure (at back Y = 0.42, Z = -0.26 to 0.32, height 0.58)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.05, 0.42, 0.03))
    back_wall = bpy.context.active_object
    back_wall.scale = (2.95, 0.22, 0.58)
    bw_bev = back_wall.modifiers.new("Bevel", "BEVEL")
    bw_bev.width = 0.05
    bw_bev.segments = 4
    smooth_object(back_wall)
    apply_material(back_wall, mat_boucle)

    # Right Armrest (at X = 1.45, Y = 0.0, Z = -0.26 to 0.18)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.42, 0.05, -0.04))
    arm = bpy.context.active_object
    arm.scale = (0.22, 0.95, 0.44)
    arm_bev = arm.modifiers.new("Bevel", "BEVEL")
    arm_bev.width = 0.04
    arm_bev.segments = 3
    smooth_object(arm)
    apply_material(arm, mat_boucle)

    # Left Chaise Low Armrest (at X = -1.45, Y = -0.5)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.42, -0.40, -0.04))
    arm_left = bpy.context.active_object
    arm_left.scale = (0.20, 1.70, 0.44)
    al_bev = arm_left.modifiers.new("Bevel", "BEVEL")
    al_bev.width = 0.04
    al_bev.segments = 3
    smooth_object(arm_left)
    apply_material(arm_left, mat_boucle)

    # 3 Plush Angled Back Cushions (Z = -0.04 to 0.34)
    for i, bx in enumerate([-0.70, 0.15, 0.95]):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(bx, 0.26, 0.15))
        back_cushion = bpy.context.active_object
        back_cushion.scale = (0.76, 0.18, 0.38)
        back_cushion.rotation_euler = (math.radians(-12), 0, 0)
        bc_bev = back_cushion.modifiers.new("BeVEL", "BEVEL")
        bc_bev.width = 0.05
        bc_bev.segments = 4
        smooth_object(back_cushion)
        apply_material(back_cushion, mat_boucle)

    # Designer Accent Throw Pillows
    # Terracotta pillow
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.75, 0.15, 0.08))
    p_terra = bpy.context.active_object
    p_terra.scale = (0.38, 0.14, 0.38)
    p_terra.rotation_euler = (math.radians(-15), math.radians(18), 0)
    pt_bev = p_terra.modifiers.new("Bevel", "BEVEL")
    pt_bev.width = 0.045
    pt_bev.segments = 4
    smooth_object(p_terra)
    apply_material(p_terra, mat_terracotta)

    # Sage Olive pillow
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.90, -0.25, 0.08))
    p_sage = bpy.context.active_object
    p_sage.scale = (0.36, 0.14, 0.36)
    p_sage.rotation_euler = (math.radians(-10), math.radians(-25), 0)
    ps_bev = p_sage.modifiers.new("Bevel", "BEVEL")
    ps_bev.width = 0.045
    ps_bev.segments = 4
    smooth_object(p_sage)
    apply_material(p_sage, mat_sage)

    export_glb("sofa_sectional.glb")

# -------------------------------------------------------------
# 15. CALACATTA VIOLA WATERFALL KITCHEN ISLAND (kitchen_island.glb)
# Dimensions: Width 2.60, Depth 1.05, Height 0.90 (Z in [-0.45, 0.45])
# -------------------------------------------------------------
def build_kitchen_island():
    reset_scene()
    
    mat_marble = create_pbr_material("CalacattaViolaMarble", (0.92, 0.88, 0.84, 1.0), roughness=0.25, normal_noise=True, noise_scale=25.0)
    mat_dark_oak = create_pbr_material("SmokedOakCabinets", (0.28, 0.22, 0.18, 1.0), roughness=0.65, normal_noise=True, noise_scale=80.0)
    mat_brass = create_pbr_material("AntiqueBrass", (0.83, 0.68, 0.38, 1.0), roughness=0.25, metalness=0.90)
    mat_glass = create_pbr_material("CeramicInductionCooktop", (0.12, 0.12, 0.14, 1.0), roughness=0.10)

    # Waterfall Marble Slab: Top surface + two mitered side gable ends
    # Top horizontal slab (Z = 0.40 to 0.45, thickness 0.05)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.425))
    top_slab = bpy.context.active_object
    top_slab.scale = (2.60, 1.05, 0.05)
    bev_top = top_slab.modifiers.new("Bevel", "BEVEL")
    bev_top.width = 0.008
    bev_top.segments = 3
    smooth_object(top_slab)
    apply_material(top_slab, mat_marble)

    # Left & Right Waterfall Marble Ends (Z = -0.45 to 0.40)
    for sx in [-1.275, 1.275]:
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(sx, 0, -0.025))
        gable = bpy.context.active_object
        gable.scale = (0.05, 1.05, 0.85)
        bev_g = gable.modifiers.new("Bevel", "BEVEL")
        bev_g.width = 0.008
        bev_g.segments = 3
        smooth_object(gable)
        apply_material(gable, mat_marble)

    # Smoked Oak Cabinet Carcass with Fluted Texture (front side Y = -0.10)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.12, -0.025))
    cabinet = bpy.context.active_object
    cabinet.scale = (2.48, 0.68, 0.84)
    apply_material(cabinet, mat_dark_oak)

    # Recessed Brass Toe Kick at bottom (Z = -0.45 to -0.37)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -0.18, -0.41))
    toekick = bpy.context.active_object
    toekick.scale = (2.46, 0.55, 0.08)
    apply_material(toekick, mat_brass)

    # Flush Ceramic Glass Induction Cooktop on top (left half, X = -0.55)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.55, -0.05, 0.452))
    cooktop = bpy.context.active_object
    cooktop.scale = (0.78, 0.52, 0.004)
    smooth_object(cooktop)
    apply_material(cooktop, mat_glass)

    # Undermount Brushed Antique Brass Sink (right half, X = 0.55)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.55, -0.05, 0.448))
    sink_rim = bpy.context.active_object
    sink_rim.scale = (0.58, 0.44, 0.006)
    apply_material(sink_rim, mat_brass)

    # Designer Minimalist Gooseneck Faucet in Antique Brass
    # Base cylinder
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.022, depth=0.08, location=(0.55, 0.22, 0.49))
    f_base = bpy.context.active_object
    smooth_object(f_base)
    apply_material(f_base, mat_brass)

    # Upright neck
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.012, depth=0.28, location=(0.55, 0.22, 0.63))
    f_neck = bpy.context.active_object
    smooth_object(f_neck)
    apply_material(f_neck, mat_brass)

    # Curved spout (torus arch)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.09, minor_radius=0.012, location=(0.55, 0.13, 0.77))
    spout = bpy.context.active_object
    spout.rotation_euler = (0, math.radians(90), 0)
    smooth_object(spout)
    apply_material(spout, mat_brass)

    export_glb("kitchen_island.glb")

# -------------------------------------------------------------
# MAIN RUNNER
# -------------------------------------------------------------
if __name__ == "__main__":
    print("Starting architectural furniture generation via Blender 5.2...")
    build_chair_lounge()
    build_table_coffee()
    build_table_dining()
    build_chair_dining()
    build_med_drawers()
    build_nightstand()
    build_bed_king()
    build_prop_plant()
    build_prop_vase()
    build_pouf()
    build_prop_cat()
    build_crate_wood()
    build_crate_industrial()
    build_sofa_sectional()
    build_kitchen_island()
    print("ALL 15 ARCHITECTURAL GLB MODELS GENERATED SUCCESSFULLY!")
