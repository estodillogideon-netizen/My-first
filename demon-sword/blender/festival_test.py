"""A Blender (Cycles) look test: Ren at the lantern festival at night, holding a paper lantern, the fox mask on the
side of his head. Our own blocky character family, built from primitives; no imported assets.

    /root/bpyenv/bin/python blender/festival_test.py out.png [scale%] [samples]
"""
import math
import random
import sys

import bpy
from mathutils import Vector

OUT = sys.argv[1] if len(sys.argv) > 1 else "out/blender_test.png"
SCALE = int(sys.argv[2]) if len(sys.argv) > 2 else 100
SAMPLES = int(sys.argv[3]) if len(sys.argv) > 3 else 128
rnd = random.Random(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene


# ------------------------------------------------------------------ helpers
def hexc(h, a=1.0):
    h = h.lstrip("#")
    c = [int(h[i: i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [a]


MATS = {}


def mat(name, color, rough=0.5, metal=0.0, coat=0.0, emit=None, emit_k=0.0, sss=0.0, sheen=0.0):
    key = (name,)
    if key in MATS:
        return MATS[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = hexc(color)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    p.inputs["Coat Weight"].default_value = coat
    p.inputs["Subsurface Weight"].default_value = sss
    if sss:
        p.inputs["Subsurface Radius"].default_value = (0.9, 0.35, 0.2)
        p.inputs["Subsurface Scale"].default_value = 0.02
    p.inputs["Sheen Weight"].default_value = sheen
    if emit:
        p.inputs["Emission Color"].default_value = hexc(emit)
        p.inputs["Emission Strength"].default_value = emit_k
    MATS[key] = m
    return m


def link(ob, parent=None):
    if ob.name not in scn.collection.objects:
        pass
    if parent:
        ob.parent = parent
    return ob


def rbox(name, size, loc, m, bevel=0.03, parent=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        bv = ob.modifiers.new("bevel", "BEVEL")
        bv.width = bevel
        bv.segments = 4
        bv.harden_normals = True
        bpy.ops.object.shade_smooth()
    ob.data.materials.append(m)
    return link(ob, parent)


def sphere(name, r, loc, m, scale=(1, 1, 1), parent=None, seg=32, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = scale
    bpy.ops.object.shade_smooth()
    ob.data.materials.append(m)
    return link(ob, parent)


def cone(name, r, h, loc, m, rot=(0, 0, 0), parent=None, r2=0.0, verts=24):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    bpy.ops.object.shade_smooth()
    ob.data.materials.append(m)
    return link(ob, parent)


def cyl(name, r, h, loc, m, rot=(0, 0, 0), parent=None, verts=32, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc, rotation=rot)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = scale
    bpy.ops.object.shade_smooth()
    ob.data.materials.append(m)
    return link(ob, parent)


def empty(name, loc=(0, 0, 0), rot=(0, 0, 0)):
    ob = bpy.data.objects.new(name, None)
    scn.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    return ob


def tube(name, a, b, r, m, parent=None):
    a, b = Vector(a), Vector(b)
    d = b - a
    ob = cyl(name, r, d.length, (a + b) / 2, m, parent=parent, verts=12)
    ob.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    return ob


# ------------------------------------------------------------------ materials
SKIN = mat("skin", "#f4c9a2", rough=0.55, sss=0.25)
NAVY = mat("navy", "#1c2440", rough=0.7, sheen=0.4)
NAVY_D = mat("navyDark", "#141a2e", rough=0.75)
GOLD = mat("gold", "#e0a830", rough=0.25, metal=1.0)
HAIR = mat("hair", "#161a2a", rough=0.5, coat=0.1)
WHITE = mat("eyeWhite", "#ffffff", rough=0.3)
IRIS = mat("iris", "#e8a020", rough=0.2, emit="#ffb030", emit_k=0.4)
PUPIL = mat("pupil", "#1a0e06", rough=0.2)
SHINE = mat("shine", "#ffffff", rough=0.1, emit="#ffffff", emit_k=2.0)
LINE = mat("line", "#1a1420", rough=0.6)
BLUSH = mat("blush", "#f29a9a", rough=0.6)
MOUTH = mat("mouth", "#7a2a2a", rough=0.5)
MASK = mat("mask", "#f6f2ea", rough=0.25, coat=1.0)
RED = mat("maskRed", "#d0202a", rough=0.3, coat=1.0)
BLACK = mat("maskBlack", "#0c0c10", rough=0.3, coat=0.6)
PANTS = mat("pants", "#1a1a22", rough=0.8)
SHOE = mat("shoe", "#f0f0f0", rough=0.5)
SOLE = mat("sole", "#c02a2a", rough=0.6)
GROUND = None


# ------------------------------------------------------------------ Ren
def build_ren():
    root = empty("Ren", (0, 0, 0), (0, 0, math.radians(-18)))
    # legs and shoes (only the top shows, but they ground him)
    for sx in (-1, 1):
        rbox(f"leg{sx}", (0.2, 0.21, 0.5), (sx * 0.115, 0, 0.27), PANTS, 0.03, root)
        rbox(f"shoe{sx}", (0.22, 0.27, 0.08), (sx * 0.115, -0.03, 0.04), SHOE, 0.025, root)
    # torso: the navy school jacket, stand collar, brass buttons
    rbox("torso", (0.46, 0.25, 0.5), (0, 0, 0.77), NAVY, 0.045, root)
    rbox("collar", (0.24, 0.2, 0.06), (0, -0.01, 1.04), NAVY_D, 0.02, root)
    for k in range(5):
        sphere(f"btn{k}", 0.014, (0, -0.128, 0.97 - k * 0.085), GOLD, parent=root, seg=16)
    rbox("hem", (0.465, 0.255, 0.035), (0, 0, 0.535), NAVY_D, 0.012, root)
    # arms: left (+x) relaxed, right (-x) raised forward holding the lantern stick
    rbox("armL", (0.19, 0.21, 0.46), (0.33, 0, 0.78), NAVY, 0.04, root, rot=(0, math.radians(-6), 0))
    rbox("handL", (0.15, 0.17, 0.11), (0.345, 0, 0.5), SKIN, 0.035, root)
    armR = empty("armRpivot", (-0.33, 0, 0.98), (math.radians(-70), 0, math.radians(-4)))
    armR.parent = root
    rbox("armR", (0.19, 0.21, 0.42), (0, 0, -0.2), NAVY, 0.04, armR)
    rbox("cuffR", (0.195, 0.215, 0.04), (0, 0, -0.4), NAVY_D, 0.012, armR)
    rbox("handR", (0.15, 0.17, 0.11), (0, 0, -0.47), SKIN, 0.035, armR)
    # head
    head = empty("head", (0, 0, 1.25), (math.radians(-4), 0, math.radians(8)))
    head.parent = root
    rbox("neck", (0.12, 0.12, 0.08), (0, 0, -0.17), SKIN, 0.02, head)
    rbox("headBox", (0.38, 0.36, 0.36), (0, 0, 0.02), SKIN, 0.06, head)
    fz = -0.181  # the face plane (front = -y)
    # eyes: big anime eyes, lash line, two catch-lights
    for sx in (-1, 1):
        x = sx * 0.085
        cyl(f"eyeW{sx}", 0.048, 0.004, (x, fz - 0.001, 0.0), WHITE, rot=(math.pi / 2, 0, 0), parent=head, scale=(0.9, 1.25, 1))
        cyl(f"iris{sx}", 0.04, 0.004, (x + sx * -0.006, fz - 0.003, -0.006), IRIS, rot=(math.pi / 2, 0, 0), parent=head, scale=(0.85, 1.2, 1))
        cyl(f"pupil{sx}", 0.021, 0.004, (x + sx * -0.006, fz - 0.005, -0.008), PUPIL, rot=(math.pi / 2, 0, 0), parent=head, scale=(0.85, 1.25, 1))
        cyl(f"shine{sx}", 0.011, 0.004, (x + sx * -0.006 + 0.014, fz - 0.007, 0.018), SHINE, rot=(math.pi / 2, 0, 0), parent=head)
        cyl(f"shine2{sx}", 0.006, 0.004, (x + sx * -0.006 - 0.012, fz - 0.007, -0.03), SHINE, rot=(math.pi / 2, 0, 0), parent=head)
        rbox(f"lash{sx}", (0.1, 0.008, 0.016), (x, fz - 0.006, 0.058), LINE, 0.004, head, rot=(0, sx * math.radians(-8), 0))
        rbox(f"brow{sx}", (0.07, 0.008, 0.012), (x + sx * 0.005, fz - 0.003, 0.122), LINE, 0.004, head, rot=(0, sx * math.radians(8), 0))
        cyl(f"blush{sx}", 0.026, 0.003, (sx * 0.125, fz - 0.001, -0.07), BLUSH, rot=(math.pi / 2, 0, 0), parent=head, scale=(1.4, 0.6, 1))
    # a small open smile
    cyl("mouth", 0.018, 0.004, (0.0, fz - 0.002, -0.105), MOUTH, rot=(math.pi / 2, 0, 0), parent=head, scale=(1.3, 0.7, 1))
    # hair: a cap over the top and back, spiky locks, a fringe over the forehead
    rbox("hairCap", (0.41, 0.39, 0.16), (0, 0.015, 0.17), HAIR, 0.07, head)
    rbox("hairBack", (0.41, 0.12, 0.3), (0, 0.14, 0.04), HAIR, 0.05, head)
    for k in range(9):
        a = -0.9 + k * 0.225
        x = math.sin(a) * 0.15
        cone(f"spike{k}", 0.065, 0.2 + 0.06 * rnd.random(), (x, 0.03 + 0.04 * rnd.random(), 0.27), HAIR,
             rot=(math.radians(-25 + 20 * rnd.random()), a * 0.9, 0), parent=head, verts=12)
    for k in range(6):
        x = -0.16 + k * 0.064
        cone(f"fringe{k}", 0.045, 0.16, (x, -0.17, 0.155), HAIR, rot=(math.radians(200), math.radians(-12 + 4 * k + rnd.uniform(-6, 6)), 0), parent=head, verts=10)
    for sx in (-1, 1):
        cone(f"side{sx}", 0.05, 0.2, (sx * 0.2, -0.05, 0.03), HAIR, rot=(math.radians(180), sx * math.radians(-8), 0), parent=head, verts=10)
    # the fox mask on the side of his head (his left), tilted, glossy white with red markings
    mk = empty("mask", (0.245, -0.02, 0.07), (math.radians(-14), math.radians(-8), math.radians(58)))
    mk.parent = head
    sphere("maskShell", 0.15, (0, 0, 0), MASK, scale=(0.82, 0.38, 1.0), parent=mk)
    cone("snout", 0.07, 0.12, (0, -0.07, -0.06), MASK, rot=(math.radians(110), 0, 0), parent=mk)
    sphere("nose", 0.016, (0, -0.125, -0.085), BLACK, parent=mk, seg=16)
    for sx in (-1, 1):
        cone(f"ear{sx}", 0.05, 0.12, (sx * 0.075, 0.0, 0.16), MASK, rot=(0, sx * math.radians(18), 0), parent=mk)
        cone(f"earIn{sx}", 0.03, 0.08, (sx * 0.075, -0.022, 0.15), RED, rot=(0, sx * math.radians(18), 0), parent=mk)
        rbox(f"slit{sx}", (0.065, 0.01, 0.018), (sx * 0.055, -0.052, 0.03), BLACK, 0.006, mk, rot=(0, sx * math.radians(-18), 0))
        rbox(f"slitR{sx}", (0.08, 0.008, 0.008), (sx * 0.06, -0.053, 0.052), RED, 0.003, mk, rot=(0, sx * math.radians(-22), 0))
        for j in range(3):
            rbox(f"whisk{sx}{j}", (0.05, 0.008, 0.008), (sx * (0.085 + 0.008 * j), -0.045, -0.02 - j * 0.026), RED, 0.003, mk, rot=(0, sx * math.radians(10 + 8 * j), 0))
    rbox("mark", (0.026, 0.01, 0.05), (0, -0.055, 0.1), RED, 0.008, mk, rot=(0, math.radians(45), 0))
    tube("cord", (-0.02, 0.05, 0.02), (-0.16, 0.18, 0.06), 0.007, RED, parent=mk)
    # the paper lantern on a stick, in his raised hand: it lights his face
    hand_w = (armR.matrix_world @ Vector((0, 0, -0.47))) if False else None
    return root, armR


ren, armR = build_ren()
bpy.context.view_layer.update()
hand = armR.matrix_world @ Vector((0, -0.02, -0.5))
stick_top = hand + Vector((0.02, -0.05, 0.42))
tube("stick", hand + Vector((0, 0, -0.03)), stick_top, 0.008, mat("bamboo", "#8a6a3a", rough=0.6))
LANT_P = stick_top + Vector((0.12, -0.02, -0.02))
tube("hook", stick_top, LANT_P + Vector((0, 0, 0.13)), 0.004, mat("string", "#2a2020", rough=0.8))
paper = mat("paper", "#ffe0b0", rough=0.6, emit="#ffb060", emit_k=7.0)
sphere("lantern", 0.11, LANT_P, paper, scale=(1, 1, 1.15))
for dz in (-0.125, 0.125):
    cyl("lantCap", 0.05, 0.03, LANT_P + Vector((0, 0, dz)), mat("lacq", "#1a1010", rough=0.4))
for k in range(5):
    cyl(f"rib{k}", 0.111 * math.cos(math.radians(-50 + k * 25)), 0.004, LANT_P + Vector((0, 0, 0.125 * math.sin(math.radians(-50 + k * 25)))), mat("ribs", "#c06030", rough=0.6), verts=32)
bpy.ops.object.light_add(type="POINT", location=LANT_P)
lp = bpy.context.active_object
lp.data.energy = 85
lp.data.color = (1.0, 0.62, 0.3)
lp.data.shadow_soft_size = 0.08


# ------------------------------------------------------------------ the festival street
def street():
    g = mat("ground", "#4a3a30", rough=0.45)
    n = g.node_tree.nodes
    tex = n.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = 18
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    g.node_tree.links.new(tex.outputs["Fac"], bump.inputs["Height"])
    g.node_tree.links.new(bump.outputs["Normal"], n["Principled BSDF"].inputs["Normal"])
    rough_ramp = n.new("ShaderNodeMapRange")
    rough_ramp.inputs["To Min"].default_value = 0.25
    rough_ramp.inputs["To Max"].default_value = 0.7
    g.node_tree.links.new(tex.outputs["Fac"], rough_ramp.inputs["Value"])
    g.node_tree.links.new(rough_ramp.outputs["Result"], n["Principled BSDF"].inputs["Roughness"])
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 60, 0))
    bpy.context.active_object.data.materials.append(g)

    # striped awnings
    stripe = mat("stripe", "#ffffff", rough=0.6)
    nt = stripe.node_tree
    wave = nt.nodes.new("ShaderNodeTexWave")
    wave.inputs["Scale"].default_value = 3.0
    wave.inputs["Distortion"].default_value = 0
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[0].color = hexc("#c81e28")
    ramp.color_ramp.elements[1].position = 0.5
    ramp.color_ramp.elements[1].color = hexc("#f4ecd8")
    nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], nt.nodes["Principled BSDF"].inputs["Base Color"])
    wood = mat("wood", "#6a4428", rough=0.7)
    wood_d = mat("woodD", "#3e2616", rough=0.8)
    glow_sign = [mat(f"sign{i}", c, rough=0.5, emit=c, emit_k=3.0) for i, c in enumerate(("#ffcc66", "#ff8a5a", "#ffe8b0"))]
    for side in (-1, 1):
        for k in range(7):
            y = 3.0 + k * 3.2
            x = side * 3.1
            rbox(f"counter{side}{k}", (1.0, 2.4, 0.95), (x, y, 0.48), wood, 0.03)
            for py in (-1.1, 1.1):
                rbox(f"post{side}{k}{py}", (0.08, 0.08, 2.4), (x + side * 0.4, y + py, 1.2), wood_d, 0.01)
            aw = rbox(f"awning{side}{k}", (1.7, 2.6, 0.05), (x - side * 0.2, y, 2.35), stripe, 0.01, rot=(0, side * math.radians(-14), 0))
            rbox(f"sign{side}{k}", (0.04, 1.2, 0.35), (x - side * 0.52, y, 1.75), glow_sign[(k + side) % 3], 0.01)
            bpy.ops.object.light_add(type="POINT", location=(x - side * 0.4, y, 1.6))
            l = bpy.context.active_object
            l.data.energy = 60
            l.data.color = (1.0, 0.6, 0.32)
            l.data.shadow_soft_size = 0.3
            # goods on the counter: little glowing jars and fruit
            for j in range(4):
                sphere(f"good{side}{k}{j}", 0.07, (x - side * 0.2, y - 0.8 + j * 0.5, 1.02), mat(f"fruit{j % 3}", ("#e83030", "#f0a020", "#f6f0e0")[j % 3], rough=0.3, coat=0.5), seg=16)
    # lantern strings across the street, two rows of light
    lant_r = mat("lantR", "#ff5a3a", rough=0.6, emit="#ff4a2a", emit_k=9.0)
    lant_w = mat("lantW", "#fff0d0", rough=0.6, emit="#ffc880", emit_k=8.0)
    rope = mat("rope", "#3a2a20", rough=0.9)
    for k in range(8):
        y = 2.2 + k * 2.8
        h = 3.1
        a, b = Vector((-3.4, y, h)), Vector((3.4, y + 0.6, h))
        for j in range(12):
            u = (j + 0.5) / 12
            p = a.lerp(b, u) - Vector((0, 0, 0.55 * 4 * u * (1 - u)))
            sphere(f"lant{k}{j}", 0.13, p, lant_r if (j + k) % 2 else lant_w, scale=(1, 1, 1.25), seg=16)
        prev = a
        for j in range(1, 13):
            u = j / 12
            p = a.lerp(b, u) - Vector((0, 0, 0.55 * 4 * u * (1 - u))) + Vector((0, 0, 0.16))
            tube(f"rope{k}{j}", prev, p, 0.008, rope)
            prev = p
    # the lantern tower at the end of the street
    tw = Vector((0.5, 26, 0))
    for sx in (-1, 1):
        for sy in (-1, 1):
            rbox("towerLeg", (0.25, 0.25, 7.0), tw + Vector((sx * 2.0, sy * 2.0, 3.5)), wood_d, 0.02)
    rbox("towerDeck", (4.8, 4.8, 0.25), tw + Vector((0, 0, 3.6)), wood, 0.02)
    rbox("towerCurtain", (4.3, 4.3, 1.4), tw + Vector((0, 0, 2.8)), stripe, 0.01)
    cone("towerRoof", 3.6, 1.6, tw + Vector((0, 0, 7.6)), mat("roofTile", "#2a2a34", rough=0.5), rot=(0, 0, math.radians(45)), verts=4)
    for k in range(10):
        a = k / 10 * math.tau
        sphere(f"tLant{k}", 0.2, tw + Vector((math.cos(a) * 2.5, math.sin(a) * 2.5, 3.3)), lant_r if k % 2 else lant_w, scale=(1, 1, 1.2), seg=16)
        sphere(f"tLant2{k}", 0.17, tw + Vector((math.cos(a) * 1.8, math.sin(a) * 1.8, 6.6)), lant_w if k % 2 else lant_r, scale=(1, 1, 1.2), seg=16)
    # a red torii behind the stalls on the left
    tor = mat("torii", "#c42a1a", rough=0.45)
    tp = Vector((-6.5, 14, 0))
    for sx in (-1, 1):
        cyl("toriiPost", 0.18, 4.4, tp + Vector((sx * 1.6, 0, 2.2)), tor)
    rbox("toriiTop", (4.6, 0.35, 0.3), tp + Vector((0, 0, 4.5)), mat("toriiBlack", "#1a1414", rough=0.5), 0.03)
    rbox("toriiBeam", (3.8, 0.25, 0.22), tp + Vector((0, 0, 3.8)), tor, 0.02)
    # cherry trees: soft pink crowns
    pink = mat("blossom", "#f2a8c4", rough=0.8, sss=0.2)
    bark = mat("bark", "#3a2420", rough=0.9)
    for (x, y, s) in ((-5.5, 8, 1.0), (5.8, 11, 1.15), (-6.2, 20, 1.2), (6.5, 19, 1.0), (-4.8, 30, 1.3), (5.5, 32, 1.3)):
        cyl("trunk", 0.15 * s, 2.4 * s, (x, y, 1.2 * s), bark, verts=12)
        for j in range(7):
            sphere("crown", (0.9 + 0.4 * rnd.random()) * s, (x + rnd.uniform(-1, 1) * s, y + rnd.uniform(-1, 1) * s, (2.6 + rnd.uniform(0, 1.2)) * s), pink, seg=20)
    # festival-goers in yukata, blurry in the background
    yk = [mat(f"yukata{i}", c, rough=0.7, sheen=0.3) for i, c in enumerate(("#3a5a9a", "#c84a6a", "#e8d070", "#4a8a6a", "#8a4ab0"))]
    for k, (x, y, yaw) in enumerate(((-1.4, 5.0, 0.4), (1.5, 6.5, -2.6), (-0.6, 9.0, 3.0), (1.1, 11.5, 0.2), (-1.8, 13.0, 1.6), (0.4, 16.0, 2.5), (-1.0, 19.0, 0.1), (1.6, 21.0, -1.2))):
        r = empty(f"folk{k}", (x, y, 0), (0, 0, yaw))
        s = 1.12 if k % 3 else 0.9
        rbox("fBody", (0.46 * s, 0.26 * s, 1.0 * s), (0, 0, 0.55 * s), yk[k % 5], 0.04, r)
        rbox("fObi", (0.47 * s, 0.27 * s, 0.1 * s), (0, 0, 0.72 * s), mat("obi", "#f0e0b0", rough=0.5), 0.02, r)
        rbox("fHead", (0.34 * s, 0.32 * s, 0.32 * s), (0, 0, 1.25 * s), SKIN, 0.05, r)
        rbox("fHair", (0.36 * s, 0.34 * s, 0.14 * s), (0, 0.02, 1.4 * s), HAIR, 0.05, r)
        for sx in (-1, 1):
            rbox("fArm", (0.17 * s, 0.19 * s, 0.5 * s), (sx * 0.33 * s, 0, 0.72 * s), yk[k % 5], 0.04, r)
    # far mountains and houses
    mtn = mat("mountain", "#2a2a48", rough=0.9)
    for k, (x, y, r, h) in enumerate(((-30, 90, 30, 34), (10, 110, 40, 46), (45, 95, 28, 30), (-60, 120, 40, 38))):
        cone(f"mtn{k}", r, h, (x, y, h / 2 - 2), mtn, verts=7)
    roofm = mat("roofs", "#2a2630", rough=0.6)
    wall = mat("walls", "#d8ccb8", rough=0.8)
    win = mat("windows", "#ffd090", rough=0.5, emit="#ffb860", emit_k=4.0)
    for side in (-1, 1):
        for k in range(6):
            x, y = side * 7.5, 4 + k * 5
            rbox("house", (3.2, 4.0, 3.0), (x, y, 1.5), wall, 0.02)
            cone("houseRoof", 3.0, 1.4, (x, y, 3.7), roofm, rot=(0, 0, math.radians(45)), verts=4)
            rbox("win", (0.05, 1.0, 0.7), (x - side * 1.61, y, 1.6), win, 0.01)


street()


# ------------------------------------------------------------------ sky, light, camera
world = bpy.data.worlds.new("night")
scn.world = world
world.use_nodes = True
wn = world.node_tree.nodes
bg = wn["Background"]
coord = wn.new("ShaderNodeTexCoord")
sep = wn.new("ShaderNodeSeparateXYZ")
grad = wn.new("ShaderNodeValToRGB")
grad.color_ramp.elements[0].position = 0.0
grad.color_ramp.elements[0].color = hexc("#3a2a5a")
grad.color_ramp.elements[1].position = 0.45
grad.color_ramp.elements[1].color = hexc("#0a0c22")
world.node_tree.links.new(coord.outputs["Generated"], sep.inputs["Vector"])
stars = wn.new("ShaderNodeTexVoronoi")
stars.inputs["Scale"].default_value = 260
st_ramp = wn.new("ShaderNodeValToRGB")
st_ramp.color_ramp.elements[0].position = 0.0
st_ramp.color_ramp.elements[0].color = (1, 1, 1, 1)
st_ramp.color_ramp.elements[1].position = 0.035
st_ramp.color_ramp.elements[1].color = (0, 0, 0, 1)
mix = wn.new("ShaderNodeMix")
mix.data_type = "RGBA"
mix.blend_type = "ADD"
mix.inputs["Factor"].default_value = 0.6
world.node_tree.links.new(coord.outputs["Generated"], stars.inputs["Vector"])
world.node_tree.links.new(stars.outputs["Distance"], st_ramp.inputs["Fac"])
mp = wn.new("ShaderNodeMapRange")
mp.inputs["From Min"].default_value = 0.5
mp.inputs["From Max"].default_value = 0.75
world.node_tree.links.new(sep.outputs["Z"], mp.inputs["Value"])
world.node_tree.links.new(mp.outputs["Result"], grad.inputs["Fac"])
world.node_tree.links.new(grad.outputs["Color"], mix.inputs[6])
world.node_tree.links.new(st_ramp.outputs["Color"], mix.inputs[7])
world.node_tree.links.new(mix.outputs[2], bg.inputs["Color"])
bg.inputs["Strength"].default_value = 1.0

# moonlight: a cool rim from behind-left; a soft warm fill from the front
bpy.ops.object.light_add(type="SUN", rotation=(math.radians(60), 0, math.radians(200)))
sun = bpy.context.active_object
sun.data.energy = 0.6
sun.data.color = (0.55, 0.65, 1.0)
bpy.ops.object.light_add(type="AREA", location=(1.6, -2.2, 1.9))
fill = bpy.context.active_object
fill.data.energy = 40
fill.data.size = 1.5
fill.data.color = (1.0, 0.8, 0.65)
fill.rotation_euler = (Vector((0, 0, 1.2)) - fill.location).to_track_quat("-Z", "Y").to_euler()
bpy.ops.object.light_add(type="AREA", location=(-1.2, 1.4, 2.2))
rim = bpy.context.active_object
rim.data.energy = 60
rim.data.size = 1.0
rim.data.color = (0.6, 0.7, 1.0)
rim.rotation_euler = (Vector((0, 0, 1.3)) - rim.location).to_track_quat("-Z", "Y").to_euler()

bpy.ops.object.camera_add(location=(0.5, -1.95, 1.28))
cam = bpy.context.active_object
scn.camera = cam
target = Vector((-0.13, 0, 1.14))
cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
cam.data.lens = 38
cam.data.sensor_width = 36
cam.data.dof.use_dof = True
cam.data.dof.focus_distance = (Vector((0.05, -0.18, 1.27)) - cam.location).length
cam.data.dof.aperture_fstop = 1.8

# ------------------------------------------------------------------ render settings + bloom
scn.render.engine = "CYCLES"
scn.cycles.device = "CPU"
scn.cycles.samples = SAMPLES
scn.cycles.use_adaptive_sampling = True
scn.cycles.use_denoising = True
scn.cycles.max_bounces = 6
scn.render.resolution_x = 1080
scn.render.resolution_y = 1920
scn.render.resolution_percentage = SCALE
scn.view_settings.view_transform = "AgX"
scn.view_settings.look = "AgX - Medium High Contrast"
scn.view_settings.exposure = 0.3
scn.render.image_settings.file_format = "PNG"
scn.render.filepath = OUT
scn.use_nodes = True
ct = scn.node_tree
rl = ct.nodes["Render Layers"]
comp = ct.nodes["Composite"]
glare = ct.nodes.new("CompositorNodeGlare")
glare.glare_type = "FOG_GLOW"
glare.quality = "HIGH"
glare.threshold = 0.9
glare.size = 8
glare.mix = -0.55
ct.links.new(rl.outputs["Image"], glare.inputs["Image"])
ct.links.new(glare.outputs["Image"], comp.inputs["Image"])
bpy.ops.render.render(write_still=True)
print("WROTE", OUT)
