import bpy, bmesh, math, sys, os, random
from mathutils import Vector

args = sys.argv[1:]
QUALITY = args[0] if args else "preview"
OUTDIR = args[1] if len(args) > 1 else "."
SHOTS = args[2].split(",") if len(args) > 2 else ["1", "2", "3", "4"]
os.makedirs(OUTDIR, exist_ok=True)
random.seed(7)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
coll = scene.collection

# ---------------------------------------------------------------- materials
def principled(name, color, rough=0.5, metal=0.0, **kw):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    for k, v in kw.items():
        b.inputs[k].default_value = v
    return m

def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)

def glass_mat(name, tint=(0.9, 0.95, 0.97), rough=0.02):
    """Glass that lets light (shadow rays) pass straight through."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    g = nt.nodes.new("ShaderNodeBsdfPrincipled")
    g.inputs["Base Color"].default_value = (*tint, 1)
    g.inputs["Roughness"].default_value = rough
    g.inputs["Transmission Weight"].default_value = 1.0
    g.inputs["IOR"].default_value = 1.45
    t = nt.nodes.new("ShaderNodeBsdfTransparent")
    t.inputs["Color"].default_value = (*tint, 1)
    lp = nt.nodes.new("ShaderNodeLightPath")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(lp.outputs["Is Shadow Ray"], mix.inputs["Fac"])
    nt.links.new(g.outputs[0], mix.inputs[1])
    nt.links.new(t.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    return m

def wood_floor():
    m = bpy.data.materials.new("WoodFloor")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    brick = nt.nodes.new("ShaderNodeTexBrick")
    brick.offset = 0.37
    brick.inputs["Color1"].default_value = (*srgb("#c9a274"), 1)
    brick.inputs["Color2"].default_value = (*srgb("#b38a5c"), 1)
    brick.inputs["Mortar"].default_value = (*srgb("#6b5038"), 1)
    brick.inputs["Scale"].default_value = 1.0
    brick.inputs["Mortar Size"].default_value = 0.0025
    brick.inputs["Brick Width"].default_value = 1.25
    brick.inputs["Row Height"].default_value = 0.19
    brick.inputs["Bias"].default_value = 0.0
    # grain: stretched noise
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (2.0, 60.0, 1.0)
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3.0
    noise.inputs["Detail"].default_value = 8.0
    nt.links.new(tc.outputs["Object"], brick.inputs["Vector"])
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs[0], noise.inputs["Vector"])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 0.35
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.75, 0.68, 0.6, 1)
    ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
    nt.links.new(noise.outputs["Fac"], ramp.inputs[0])
    nt.links.new(brick.outputs["Color"], mix.inputs[6])
    nt.links.new(ramp.outputs[0], mix.inputs[7])
    nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    # gaps slightly rougher / bumped
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    bump.invert = True
    nt.links.new(brick.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs[0], b.inputs["Normal"])
    b.inputs["Roughness"].default_value = 0.32
    b.inputs["Coat Weight"].default_value = 0.25
    b.inputs["Coat Roughness"].default_value = 0.15
    return m

def wood_light(name="WoodTop", base="#d9bb8f"):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1.5, 40.0, 40.0)
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 4.0
    noise.inputs["Detail"].default_value = 6.0
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*[c * 0.82 for c in srgb(base)], 1)
    ramp.color_ramp.elements[1].color = (*srgb(base), 1)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs[0], noise.inputs["Vector"])
    nt.links.new(noise.outputs["Fac"], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.4
    return m

def fabric(name, color):
    m = principled(name, color, rough=0.9)
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Sheen Weight"].default_value = 0.6
    b.inputs["Sheen Tint"].default_value = (1, 1, 1, 1)
    return m

M = dict(
    wall=principled("Wall", srgb("#f2f1ec"), 0.85),
    floor=wood_floor(),
    woodtop=wood_light(),
    woodpanel=wood_light("WoodPanel", "#dcb987"),
    white=principled("WhiteLacquer", srgb("#f4f4f2"), 0.35),
    metal=principled("MetalLight", srgb("#d8dadc"), 0.3, 1.0),
    alu=principled("Aluminium", srgb("#c8ccd0"), 0.25, 1.0),
    chrome=principled("Chrome", (0.9, 0.9, 0.9), 0.08, 1.0),
    black=principled("BlackPaint", srgb("#141516"), 0.4),
    chair=principled("ChairPlastic", srgb("#6f93ab"), 0.42),
    board=principled("Chalkboard", srgb("#2d4a35"), 0.75),
    screen=principled("Screen", (0.01, 0.01, 0.012), 0.05),
    blinds=principled("Blinds", srgb("#9fc4d2"), 0.5),
    glass=glass_mat("Glass"),
    bottle=glass_mat("Bottle", (0.55, 0.75, 0.95), 0.05),
    sofa=fabric("SofaFabric", srgb("#a6bfcf")),
    rug=fabric("Rug", srgb("#8a8d90")),
    leaf=principled("Leaf", srgb("#3f7a2e"), 0.5, **{"Subsurface Weight": 0.15}),
    soil=principled("Soil", srgb("#3a2a1e"), 1.0),
    pot=principled("PotCeramic", srgb("#efefea"), 0.3),
    ground=principled("Ground", srgb("#8c9097"), 0.9),
    slab=principled("SlabEdge", srgb("#c8a070"), 0.5),
    chalk=principled("Chalk", (0.85, 0.85, 0.85), 0.9),
    shadow=principled("CubbyInside", srgb("#e4e4e0"), 0.8),
)

# ---------------------------------------------------------------- primitives
def _obj(name, bm, mat, parent=None, loc=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    ob.location = loc
    me.materials.append(mat)
    if parent:
        ob.parent = parent
    return ob

def box(x0, x1, y0, y1, z0, z1, mat, bevel=0.004, segs=2, parent=None, name="box"):
    sx, sy, sz = x1 - x0, y1 - y0, z1 - z0
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= sx; v.co.y *= sy; v.co.z *= sz
    ob = _obj(name, bm, mat, parent, ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    if bevel > 0 and min(sx, sy, sz) > bevel * 2.2:
        m = ob.modifiers.new("bevel", "BEVEL")
        m.width = bevel; m.segments = segs; m.limit_method = "ANGLE"
        if segs > 2:
            for p in ob.data.polygons:
                p.use_smooth = True
            m.harden_normals = False
    return ob

def cyl(x, y, z0, r, h, mat, segs=32, parent=None, axis="Z", r2=None, name="cyl"):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r,
                          radius2=r if r2 is None else r2, depth=h)
    ob = _obj(name, bm, mat, parent)
    for p in ob.data.polygons:
        p.use_smooth = abs(p.normal.z) < 0.5
    if axis == "Z":
        ob.location = (x, y, z0 + h / 2)
    elif axis == "Y":  # centered at (x, y=z0-ish)
        ob.rotation_euler = (math.radians(90), 0, 0)
        ob.location = (x, z0 + h / 2, y)  # here y means height
    return ob

def ellipsoid(loc, scale, rot, mat, parent=None):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=1.0)
    ob = _obj("leaf", bm, mat, parent, loc)
    for p in ob.data.polygons:
        p.use_smooth = True
    ob.scale = scale
    ob.rotation_euler = rot
    return ob

def empty(x, y, z=0.0, rz=0.0, name="grp"):
    e = bpy.data.objects.new(name, None)
    coll.objects.link(e)
    e.location = (x, y, z)
    e.rotation_euler = (0, 0, math.radians(rz))
    return e

# ---------------------------------------------------------------- furniture
def chair(x, y, rz=0.0):
    e = empty(x, y, rz=rz, name="chair")
    box(-0.22, 0.22, -0.2, 0.22, 0.43, 0.46, M["chair"], 0.012, 3, e)
    back = box(-0.21, 0.21, -0.015, 0.015, -0.16, 0.16, M["chair"], 0.01, 3, e)
    back.location = (0, -0.235, 0.71)
    back.rotation_euler = (math.radians(-10), 0, 0)
    t = 0.011
    for sx in (-0.19, 0.19):
        for sy in (-0.17, 0.18):
            box(sx - t, sx + t, sy - t, sy + t, 0.0, 0.43, M["metal"], 0, parent=e)
        box(sx - t, sx + t, -0.24, -0.22, 0.43, 0.62, M["metal"], 0, parent=e)
        box(sx - t, sx + t, -0.17, 0.18, 0.05, 0.07, M["metal"], 0, parent=e)
    return e

def table(x, y, w=1.8, d=0.55, rz=0.0):
    e = empty(x, y, rz=rz, name="table")
    box(-w / 2, w / 2, -d / 2, d / 2, 0.72, 0.75, M["woodtop"], 0.004, 2, e)
    for sx in (-w / 2 + 0.1, w / 2 - 0.1):
        box(sx - 0.02, sx + 0.02, -0.02, 0.02, 0.03, 0.72, M["white"], 0.003, parent=e)
        box(sx - 0.025, sx + 0.025, -d / 2 + 0.03, d / 2 - 0.03, 0.0, 0.035, M["white"], 0.003, parent=e)
        box(sx - 0.02, sx + 0.02, -d / 2 + 0.04, d / 2 - 0.04, 0.68, 0.72, M["white"], 0.003, parent=e)
    box(-w / 2 + 0.1, w / 2 - 0.1, 0.2, 0.23, 0.62, 0.7, M["white"], 0.003, parent=e)
    return e

def plant(x, y, z=0.0, scale=1.0, n=16):
    e = empty(x, y, z, name="plant")
    e.scale = (scale,) * 3
    cyl(0, 0, 0, 0.11, 0.22, M["pot"], parent=e, r2=0.13)
    cyl(0, 0, 0.2, 0.115, 0.012, M["soil"], parent=e)
    for i in range(n):
        th = i / n * 2 * math.pi + random.uniform(-0.2, 0.2)
        a = math.radians(random.uniform(25, 75))
        L = random.uniform(0.17, 0.27)
        d = Vector((-math.sin(th) * math.cos(a), math.cos(th) * math.cos(a), math.sin(a)))
        loc = Vector((0, 0, 0.23)) + d * L * 0.95
        ellipsoid(loc, (0.035, L, 0.006), (a, 0, th), M["leaf"], e)
    return e

def sofa(x0, x1, y0, y1):
    s = M["sofa"]
    bv = 0.035
    box(x0, x1, y0, y1, 0.12, 0.40, s, bv, 4)
    arm = 0.17
    for ax in ((x0, x0 + arm), (x1 - arm, x1)):
        box(ax[0], ax[1], y0, y1, 0.12, 0.64, s, bv, 4)
    n = 3
    cw = (x1 - x0 - 2 * arm) / n
    for i in range(n):
        cx0 = x0 + arm + i * cw
        box(cx0 + 0.005, cx0 + cw - 0.005, y0 + 0.02, y1 - 0.2, 0.40, 0.54, s, 0.05, 5)
        box(cx0 + 0.005, cx0 + cw - 0.005, y1 - 0.24, y1 - 0.02, 0.40, 0.86, s, 0.06, 5)
    for lx in (x0 + 0.08, x1 - 0.08):
        for ly in (y0 + 0.08, y1 - 0.08):
            cyl(lx, ly, 0, 0.022, 0.12, M["chrome"], 16)

# ================================================================ LAYOUT v3 (from floor-plan screenshots)
# X: 0 = lounge (left short wall) -> LX = board wall (right short wall)
# Y: 0 = front wall (doors, green exterior) -> LY = window wall
LX, LY, H = 10.0, 8.0, 3.0
T = 0.2

M["wallin"] = principled("WallInterior", srgb("#e6e4df"), 0.85)
M["wallout"] = principled("WallExterior", srgb("#7e9179"), 0.95)
M["walltop"] = principled("WallTop", srgb("#c9c9c6"), 0.8)
M["blinds"] = principled("BlindsSage", srgb("#879c93"), 0.55)
M["chair"] = principled("ChairNavy", srgb("#2e4153"), 0.45)
M["officefab"] = fabric("OfficeFabric", srgb("#7f95a8"))
M["cabwood"] = wood_light("CabinetWood", "#b9752f")
M["mirror"] = principled("Mirror", (0.95, 0.95, 0.95), 0.02, 1.0)
M["canvas"] = principled("Canvas", srgb("#ece3cc"), 0.9)
M["lemon"] = principled("Lemon", srgb("#e8c62a"), 0.45)
M["tray"] = principled("Tray", srgb("#2f4f7a"), 0.4)
M["cream"] = principled("CreamDesk", srgb("#f1ecdf"), 0.4)
M["lightem"] = principled("LightDiffuser", (1, 1, 1), 0.5,
                          **{"Emission Color": (1.0, 0.97, 0.92, 1), "Emission Strength": 0.0})
BOOKS = [principled(f"Book{i}", srgb(c), 0.6) for i, c in
         enumerate(["#8c3b32", "#2f5d7c", "#d1a54a", "#3f6b45", "#6b4a7c", "#c7c2b5"])]

# exterior-textured wall material (bump noise)
nt = M["wallout"].node_tree
_n = nt.nodes.new("ShaderNodeTexNoise"); _n.inputs["Scale"].default_value = 180
_b = nt.nodes.new("ShaderNodeBump"); _b.inputs["Strength"].default_value = 0.35
nt.links.new(_n.outputs["Fac"], _b.inputs["Height"])
nt.links.new(_b.outputs[0], nt.nodes["Principled BSDF"].inputs["Normal"])

# floor: warmer oak
fb = [n for n in M["floor"].node_tree.nodes if n.bl_idname == "ShaderNodeTexBrick"][0]
fb.inputs["Color1"].default_value = (*srgb("#bd8550"), 1)
fb.inputs["Color2"].default_value = (*srgb("#a66e3d"), 1)
fb.inputs["Mortar"].default_value = (*srgb("#7a5230"), 1)
# table tops: pale maple
for n in M["woodtop"].node_tree.nodes:
    if n.bl_idname == "ShaderNodeValToRGB":
        n.color_ramp.elements[0].color = (*[c * 0.85 for c in srgb("#ecd8a6")], 1)
        n.color_ramp.elements[1].color = (*srgb("#ecd8a6"), 1)


def wall(x0, x1, y0, y1, holes, inner_side, name):
    """Wall box with boolean holes; exterior/interior/top get different materials."""
    ob = box(x0, x1, y0, y1, 0, H, M["wallin"], 0, name=name)
    me = ob.data
    me.materials.append(M["wallout"])
    me.materials.append(M["walltop"])
    for p in me.polygons:
        n = p.normal
        if n.z > 0.5:
            p.material_index = 2
        elif inner_side == "+y" and n.y < -0.5 or inner_side == "-y" and n.y > 0.5 \
                or inner_side == "+x" and n.x < -0.5 or inner_side == "-x" and n.x > 0.5:
            p.material_index = 1
    for (a0, a1, b0, b1, z0, z1) in holes:
        cut = box(a0, a1, b0, b1, z0, z1, M["wallin"], 0, name="cut")
        cut.hide_render = True; cut.hide_viewport = True
        m = ob.modifiers.new("hole", "BOOLEAN")
        m.object = cut; m.operation = "DIFFERENCE"
    return ob


def window_x(x0, x1, ywall_out, ywall_in, z0, z1, panes, blind_bottom, inside_dir):
    """Window in a wall running along X. inside_dir = +1 if room is at larger y."""
    f = 0.06
    ym = (ywall_out + ywall_in) / 2
    fy0, fy1 = ym - 0.05, ym + 0.05
    box(x0, x1, fy0, fy1, z0, z0 + f, M["black"], 0.004)
    box(x0, x1, fy0, fy1, z1 - f, z1, M["black"], 0.004)
    w = x1 - x0
    for k in range(panes + 1):
        xx = x0 + k * w / panes
        e = f if k in (0, panes) else f / 2
        box(max(x0, xx - e), min(x1, xx + e), fy0, fy1, z0, z1, M["black"], 0.004)
    box(x0 + f, x1 - f, ym - 0.005, ym + 0.005, z0 + f, z1 - f, M["glass"], 0)
    sa, sb2 = ywall_out, ywall_in + 0.06 * inside_dir
    box(x0 - 0.04, x1 + 0.04, min(sa, sb2), max(sa, sb2), z0 - 0.03, z0, M["white"], 0.004)
    # venetian blinds on the room side
    by = ywall_in + 0.05 * inside_dir
    box(x0 + 0.02, x1 - 0.02, by - 0.04, by + 0.04, z1 - 0.06, z1, M["blinds"], 0.005)
    z = z1 - 0.09
    while z > blind_bottom:
        s = box(-w / 2 + 0.04, w / 2 - 0.04, -0.025, 0.025, -0.002, 0.002, M["blinds"], 0)
        s.location = ((x0 + x1) / 2, by, z)
        s.rotation_euler = (math.radians(25 * inside_dir), 0, 0)
        z -= 0.034
    box(x0 + 0.03, x1 - 0.03, by - 0.03, by + 0.03, z - 0.015, z + 0.01, M["blinds"], 0.004)


def door_x(x0, x1, yo, yi, hinge_left=True):
    """Black glazed door with sidelights + transom in the front wall (y = 0)."""
    f = 0.07
    DH = 2.45
    side = 0.22
    for xa, xb in ((x0, x0 + f), (x1 - f, x1), (x0 + side, x0 + side + f), (x1 - side - f, x1 - side)):
        box(xa, xb, yo - 0.03, yi + 0.03, 0, DH, M["black"], 0.004)
    box(x0, x1, yo - 0.03, yi + 0.03, DH - f, DH, M["black"], 0.004)
    box(x0, x1, yo - 0.03, yi + 0.03, 2.08, 2.08 + f, M["black"], 0.004)
    ym = (yo + yi) / 2
    box(x0 + f, x1 - f, ym - 0.005, ym + 0.005, 2.08 + f, DH - f, M["glass"], 0)  # transom
    for xa, xb in ((x0 + f, x0 + side), (x1 - side, x1 - f)):                  # sidelights
        box(xa, xb, ym - 0.005, ym + 0.005, 0.05, 2.08, M["glass"], 0)
        box(xa, xb, ym - 0.03, ym + 0.03, 0.0, 0.5, M["black"], 0.004)
    # leaf, opened outward (towards -y)
    lx0, lx1 = x0 + side + f, x1 - side - f
    dw = lx1 - lx0
    hx = lx0 if hinge_left else lx1
    hinge = empty(hx, yo, 0, rz=(-65 if hinge_left else 65), name="door")
    sgn = 1 if hinge_left else -1
    # leaf built along local +x (or -x), thickness towards +y
    def lb(a0, a1, b0, b1, z0, z1, m, bv=0.004):
        if sgn > 0:
            return box(a0, a1, b0, b1, z0, z1, m, bv, parent=hinge)
        return box(-a1, -a0, b0, b1, z0, z1, m, bv, parent=hinge)
    lb(0, dw, 0, 0.05, 0.01, 2.06, M["black"], 0.006)
    for k in range(3):
        a0 = 0.14 + k * (dw - 0.28) / 3 + 0.025
        a1 = 0.14 + (k + 1) * (dw - 0.28) / 3 - 0.025
        lb(a0, a1, -0.002, 0.052, 1.05, 1.9, M["glass"], 0)
    lb(0.12, dw - 0.12, -0.015, 0.0, 0.2, 0.85, M["black"])
    lb(dw - 0.14, dw - 0.05, -0.05, 0.0, 0.98, 1.01, M["chrome"])
    lb(dw - 0.14, dw - 0.05, 0.05, 0.1, 0.98, 1.01, M["chrome"])


# ---------------------------------------------------------------- shell
box(-T - 0.05, LX + T + 0.05, -T - 0.05, LY + T + 0.05, -0.18, 0.0, M["floor"], 0, name="FloorSlab")
box(-80, 80, -80, 80, -0.2, -0.18, M["ground"], 0, name="Ground")

# back wall: windows
WWIN = [(0.55, 2.15, 2, 1.65), (2.55, 4.15, 2, 1.65), (5.45, 9.05, 3, 1.75)]
WZ0, WZ1 = 0.9, 2.35
wall(-T, LX + T, LY, LY + T,
     [(a, b, LY - 0.1, LY + T + 0.1, WZ0, WZ1) for a, b, _, _ in WWIN], "-y", "WindowWall")
for a, b, p, bb in WWIN:
    window_x(a, b, LY + T, LY, WZ0, WZ1, p, bb, -1)
box(4.55, 5.05, LY - 0.25, LY, 0, H, M["wallin"], 0.003)  # pilaster

# front wall: 2 doors + 2 windows
FDOORS = [(1.0, 2.55), (7.25, 8.8)]
FWIN = [(3.0, 4.6), (5.4, 7.0)]
front = wall(-T, LX + T, -T, 0, [(a, b, -T - 0.1, 0.1, 0.0, 2.45) for a, b in FDOORS] +
             [(a, b, -T - 0.1, 0.1, WZ0, WZ1) for a, b in FWIN], "+y", "FrontWall")
door_x(*FDOORS[0], -T, 0, hinge_left=True)
door_x(*FDOORS[1], -T, 0, hinge_left=True)
for a, b in FWIN:
    window_x(a, b, -T, 0, WZ0, WZ1, 2, 1.7, +1)

# left wall (lounge) and right wall (board)
wall(-T, 0, -T, LY + T, [], "+x", "LeftWall")
wall(LX, LX + T, -T, LY + T, [], "-x", "RightWall")
for (a0, a1, b0, b1) in ((0, 0.015, 0, LY), (LX - 0.015, LX, 0, LY), (0, LX, LY - 0.015, LY)):
    box(a0, a1, b0, b1, 0, 0.08, M["white"], 0)

# ---------------------------------------------------------------- lounge (x 0 .. 2.3)
box(0.0, 0.06, 0.45, 3.4, 0.0, 1.85, M["woodpanel"], 0.005)      # tall wood panel behind sofa
sofa_e = empty(0.0, 0.0, 0.0)
# sofa against panel, facing +x: build along y using rotated helper
def sofa_y(y0, y1, x0, x1):
    s = M["sofa"]
    box(x0, x1, y0, y1, 0.12, 0.40, s, 0.035, 4)
    arm = 0.17
    for a in ((y0, y0 + arm), (y1 - arm, y1)):
        box(x0, x1, a[0], a[1], 0.12, 0.64, s, 0.035, 4)
    n = 3
    cw = (y1 - y0 - 2 * arm) / n
    for i in range(n):
        c0 = y0 + arm + i * cw
        box(x0 + 0.2, x1 - 0.02, c0 + 0.005, c0 + cw - 0.005, 0.40, 0.54, s, 0.05, 5)
        box(x0 + 0.02, x0 + 0.24, c0 + 0.005, c0 + cw - 0.005, 0.40, 0.86, s, 0.06, 5)
    for lx in (x0 + 0.08, x1 - 0.08):
        for ly in (y0 + 0.08, y1 - 0.08):
            cyl(lx, ly, 0, 0.022, 0.12, M["chrome"], 16)
sofa_y(0.65, 2.95, 0.1, 0.98)
box(1.0, 2.25, 0.45, 3.05, 0.0, 0.012, M["rug"], 0)                 # rug
ct = empty(1.6, 1.8)
box(-0.3, 0.3, -0.4, 0.4, 0.42, 0.46, M["white"], 0.006, 3, ct)
for sx in (-0.25, 0.25):
    for sy in (-0.35, 0.35):
        cyl(sx, sy, 0, 0.025, 0.42, M["white"], 16, parent=ct, r2=0.018)
        cyl(sx, sy, 0.15, 0.035, 0.06, M["white"], 16, parent=ct)
# water dispenser, front-left corner
box(0.12, 0.52, 0.08, 0.48, 0, 0.92, M["white"], 0.01, 3)
cyl(0.32, 0.28, 0.92, 0.15, 0.44, M["bottle"], 32)
cyl(0.32, 0.28, 1.36, 0.06, 0.05, M["bottle"], 16)
box(0.52, 0.55, 0.2, 0.36, 0.72, 0.8, M["chrome"], 0.003)
# wood cabinet
box(0.08, 0.58, 3.5, 4.3, 0, 1.1, M["cabwood"], 0.006, 3)
box(0.58, 0.59, 3.895, 3.905, 0.05, 1.05, M["black"], 0)
for yy in (3.85, 3.95):
    cyl(0.6, yy, 0.6, 0.012, 0.012, M["chrome"], 12)
# picture frame + oval mirror + AC on left wall
box(0.0, 0.04, 3.55, 4.45, 1.3, 2.05, M["cabwood"], 0.004)
box(0.0, 0.045, 3.6, 4.4, 1.35, 2.0, M["canvas"], 0)
mo = ellipsoid((0.02, 5.85, 1.55), (0.025, 0.3, 0.48), (0, 0, 0), M["black"])
mi = ellipsoid((0.035, 5.85, 1.55), (0.018, 0.27, 0.44), (0, 0, 0), M["mirror"])
box(0.0, 0.24, 6.3, 7.4, 2.45, 2.75, M["white"], 0.03, 4)
box(0.19, 0.25, 6.35, 7.35, 2.47, 2.52, M["alu"], 0.005)
# L-shaped white desk with hutch
box(0.06, 1.95, 4.5, 5.1, 0.73, 0.76, M["cream"], 0.004)           # section A top
box(1.35, 1.95, 5.1, 6.9, 0.73, 0.76, M["cream"], 0.004)           # section B top
box(0.08, 0.12, 4.52, 5.08, 0, 0.73, M["cream"], 0.003)
box(0.9, 1.35, 4.52, 5.08, 0, 0.73, M["cream"], 0.003, 3)           # drawer pedestal
for zz in (0.25, 0.5):
    box(1.35, 1.36, 4.55, 5.05, zz, zz + 0.005, M["walltop"], 0)
box(1.37, 1.93, 6.84, 6.88, 0, 0.73, M["cream"], 0.003)
box(1.37, 1.93, 5.12, 5.16, 0, 0.73, M["cream"], 0.003)
# hutch on section B (back part)
box(1.4, 1.95, 5.95, 6.9, 0.76, 1.85, M["cream"], 0.004)
for zz in (1.1, 1.45):
    box(1.42, 1.93, 5.97, 6.88, zz, zz + 0.02, M["walltop"], 0)
for i in range(9):
    bkm = BOOKS[i % len(BOOKS)]
    y0 = 6.0 + i * 0.07
    box(1.5, 1.75, y0, y0 + 0.05, 1.12, 1.12 + random.uniform(0.2, 0.28), bkm, 0.002)
box(1.35, 1.95, 5.95, 5.98, 0.76, 1.85, M["cream"], 0)   # hutch side
# laptop & items on desk
lap = empty(1.05, 4.8, 0.76, rz=-160)
box(-0.17, 0.17, -0.12, 0.12, 0, 0.015, M["black"], 0.003, parent=lap)
scr = box(-0.17, 0.17, -0.005, 0.005, 0, 0.23, M["black"], 0.003, parent=lap)
scr.location = (0, 0.12, 0.012); scr.rotation_euler = (math.radians(-15), 0, 0)
cyl(0.3, 4.8, 0.76, 0.17, 0.04, M["tray"], 40)
for k in range(5):
    a = k / 5 * 2 * math.pi
    ellipsoid((0.3 + 0.08 * math.cos(a), 4.8 + 0.08 * math.sin(a), 0.82), (0.045, 0.035, 0.035),
              (0, 0, a), M["lemon"])
box(0.6, 0.8, 4.65, 4.8, 0.76, 0.77, M["white"], 0)  # paper

def office_chair(x, y, rz, high=True):
    e = empty(x, y, rz=rz, name="ochair")
    for k in range(5):
        a = k / 5 * 2 * math.pi
        leg = box(0, 0.3, -0.02, 0.02, 0.06, 0.09, M["black"], 0.008, parent=e)
        leg.rotation_euler = (0, 0, a)
        ellipsoid((0.3 * math.cos(a), 0.3 * math.sin(a), 0.03), (0.03, 0.03, 0.03), (0, 0, 0), M["black"], e)
    cyl(0, 0, 0.08, 0.03, 0.35, M["chrome"], 16, parent=e)
    box(-0.27, 0.27, -0.25, 0.27, 0.43, 0.53, M["officefab"], 0.04, 4, e)
    bh = 0.75 if high else 0.45
    bk = box(-0.25, 0.25, -0.06, 0.06, 0, bh, M["officefab"], 0.05, 5, e)
    bk.location = (0, -0.28, 0.55 + bh / 2); bk.rotation_euler = (math.radians(-8), 0, 0)
    for sx in (-0.29, 0.29):
        box(sx - 0.03, sx + 0.03, -0.2, 0.15, 0.64, 0.68, M["black"], 0.01, 3, e)
        box(sx - 0.015, sx + 0.015, -0.05, -0.01, 0.5, 0.64, M["black"], 0, parent=e)
    return e
office_chair(0.85, 5.75, 180, True)    # sits in the L, faces the front (-y)

# ---------------------------------------------------------------- classroom seating (faces +x, board)
GROUP_Y = [6.65, 4.15, 1.6]
def long_group(xt, yc):
    table(xt, yc, w=1.65, d=0.5, rz=90)
    for dy in (-0.55, 0.0, 0.55):
        chair(xt - 0.48 + random.uniform(-0.04, 0.02), yc + dy + random.uniform(-0.03, 0.03),
              -90 + random.uniform(-5, 5))
def small_pair(xt, yc):
    for dy in (-0.36, 0.36):
        table(xt, yc + dy, w=0.68, d=0.62, rz=90)
        chair(xt - 0.5 + random.uniform(-0.04, 0.02), yc + dy + random.uniform(-0.03, 0.03),
              -90 + random.uniform(-6, 6))
for yc in GROUP_Y:
    long_group(3.05, yc)
    small_pair(4.1, yc)
    small_pair(5.15, yc)
    long_group(6.45, yc)
    long_group(7.55, yc)

# ---------------------------------------------------------------- teacher area & board (x = LX)
box(LX - 0.04, LX, 0.8, 5.9, 0.95, 2.3, M["alu"], 0.004)
box(LX - 0.05, LX - 0.03, 0.84, 5.86, 0.99, 2.26, M["board"], 0)
box(LX - 0.12, LX, 0.8, 5.9, 0.94, 0.97, M["alu"], 0.003)
for sy in (2.0, 2.07, 4.6):
    box(LX - 0.1, LX - 0.09, sy, sy + 0.06, 0.97, 0.98, M["chalk"], 0)
for (a, b2, z) in ((1.5, 2.9, 1.8), (1.5, 2.4, 1.65), (3.9, 5.2, 1.5)):
    box(LX - 0.052, LX - 0.05, a, b2, z, z + 0.012, M["chalk"], 0)
box(LX - 0.12, LX - 0.06, 2.7, 4.0, 2.14, 2.86, M["black"], 0.008, 3)    # TV
box(LX - 0.125, LX - 0.115, 2.73, 3.97, 2.17, 2.83, M["screen"], 0)
ck = cyl(0, 0, 0, 0.16, 0.05, M["black"], 48); ck.rotation_euler = (0, math.radians(90), 0)
ck.location = (LX - 0.025, 5.0, 2.6)
cf = cyl(0, 0, 0, 0.145, 0.012, M["white"], 48); cf.rotation_euler = (0, math.radians(90), 0)
cf.location = (LX - 0.055, 5.0, 2.6)
box(LX - 0.24, LX, 6.4, 7.5, 2.45, 2.75, M["white"], 0.03, 4)            # AC
box(LX - 0.25, LX - 0.19, 6.45, 7.45, 2.47, 2.52, M["alu"], 0.005)
box(8.75, 9.45, 2.0, 3.4, 0.73, 0.76, M["cream"], 0.004)                 # teacher desk
box(8.78, 9.42, 2.03, 2.5, 0, 0.73, M["cream"], 0.004, 3)
box(8.78, 9.42, 3.32, 3.37, 0, 0.73, M["cream"], 0.003)
box(9.4, 9.42, 2.5, 3.32, 0.35, 0.73, M["cream"], 0)
lap2 = empty(9.05, 2.9, 0.76, rz=90)
box(-0.17, 0.17, -0.12, 0.12, 0, 0.015, M["alu"], 0.003, parent=lap2)
s2 = box(-0.17, 0.17, -0.005, 0.005, 0, 0.23, M["alu"], 0.003, parent=lap2)
s2.location = (0, 0.12, 0.012); s2.rotation_euler = (math.radians(-15), 0, 0)
office_chair(9.75, 2.85, 90, False)
box(9.4, 9.9, 7.35, 7.85, 0, 0.75, M["white"], 0.006, 3)                # small stand
plant(9.65, 7.6, 0.75, 0.8, 14)

# ---------------------------------------------------------------- linear pendant lights
LIGHT_EMIT = []
for lx in (3.6, 6.0, 8.4):
    for (y0, y1) in ((0.7, 2.6), (3.05, 4.95), (5.4, 7.3)):
        box(lx - 0.06, lx + 0.06, y0, y1, 2.6, 2.66, M["white"], 0.006, 2)
        box(lx - 0.045, lx + 0.045, y0 + 0.02, y1 - 0.02, 2.595, 2.6, M["lightem"], 0)
        for yy in (y0 + 0.15, y1 - 0.15):
            box(lx - 0.002, lx + 0.002, yy - 0.002, yy + 0.002, 2.66, H, M["black"], 0)

CEIL = box(-T, LX + T, -T, LY + T, H, H + 0.1, M["wallin"], 0, name="Ceiling")

# ---------------------------------------------------------------- lighting & world
world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
sun_d = bpy.data.lights.new("Sun", "SUN")
sun_d.energy = 2.0
sun_d.angle = math.radians(20)
sun_d.color = (1.0, 0.97, 0.92)
sun = bpy.data.objects.new("Sun", sun_d)
coll.objects.link(sun)
sun.rotation_euler = Vector((0.45, -0.6, -1.0)).normalized().to_track_quat("-Z", "Y").to_euler()
sb_d = bpy.data.lights.new("Softbox", "AREA")
sb_d.size = 16
sb_d.energy = 5000
SOFTBOX = bpy.data.objects.new("Softbox", sb_d)
coll.objects.link(SOFTBOX)
SOFTBOX.location = (5, 4, 15)
# fill lights for interior shots (under the pendants)
FILL = []
for lx in (3.6, 6.0, 8.4):
    for yc in (1.65, 4.0, 6.35):
        ld = bpy.data.lights.new("fill", "AREA")
        ld.shape = "RECTANGLE"; ld.size = 0.1; ld.size_y = 1.8
        ld.energy = 110; ld.color = (1.0, 0.96, 0.9)
        lo = bpy.data.objects.new("fill", ld)
        coll.objects.link(lo)
        lo.location = (lx, yc, 2.58)
        lo.visible_camera = False
        FILL.append(lo)

# ---------------------------------------------------------------- render
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.use_denoising = True
scene.cycles.use_adaptive_sampling = True
scene.cycles.max_bounces = 8
scene.cycles.diffuse_bounces = 4
scene.cycles.glossy_bounces = 3
scene.cycles.transmission_bounces = 6
scene.cycles.sample_clamp_indirect = 8.0
scene.render.image_settings.file_format = "JPEG"
scene.render.image_settings.quality = 93
scene.view_settings.view_transform = "AgX"
try:
    scene.view_settings.look = "AgX - Medium High Contrast"
except Exception as ex:
    print("look:", ex)
if QUALITY == "final":
    scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
    SAMPLES = {"aerial": 128, "interior": 192}
else:
    scene.render.resolution_x, scene.render.resolution_y = 800, 450
    SAMPLES = {"aerial": 24, "interior": 32}

def camera(loc, target, lens):
    cd = bpy.data.cameras.new("cam")
    cd.lens = lens
    cd.clip_start = 0.05
    co = bpy.data.objects.new("cam", cd)
    coll.objects.link(co)
    co.location = loc
    co.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return co

SHOT_DEFS = {
    "1": dict(name="01_aerial_front_left", kind="aerial",
              loc=(-2.5, -7.5, 17.5), target=(5.0, 4.2, 0.0), lens=28, exp=0.0),
    "2": dict(name="02_aerial_front_right", kind="aerial",
              loc=(15.0, -8.5, 14.0), target=(4.8, 4.2, 0.0), lens=30, exp=0.0),
    "3": dict(name="03_interior_lounge_to_board", kind="interior",
              loc=(1.35, 0.55, 1.6), target=(9.8, 5.0, 1.25), lens=19, exp=0.0),
    "4": dict(name="04_interior_board_to_lounge", kind="interior",
              loc=(9.6, 7.4, 1.7), target=(0.5, 2.0, 0.9), lens=19, exp=0.0),
}

for key in SHOTS:
    s = SHOT_DEFS[key]
    interior = s["kind"] == "interior"
    CEIL.hide_render = not interior
    SOFTBOX.hide_render = interior
    for lo in FILL:
        lo.hide_render = not interior
    M["lightem"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = \
        6.0 if interior else 1.5
    if interior:
        bg.inputs["Color"].default_value = (0.78, 0.86, 1.0, 1)
        bg.inputs["Strength"].default_value = 1.4
        sun_d.energy = 3.0
        sun_d.angle = math.radians(2)
    else:
        bg.inputs["Color"].default_value = (0.66, 0.7, 0.77, 1)
        bg.inputs["Strength"].default_value = 1.0
        sun_d.energy = 1.6
        sun_d.angle = math.radians(20)
    scene.view_settings.exposure = s["exp"]
    scene.cycles.samples = SAMPLES[s["kind"]]
    scene.camera = camera(s["loc"], s["target"], s["lens"])
    scene.render.filepath = os.path.join(OUTDIR, s["name"] + ".jpg")
    bpy.ops.render.render(write_still=True)
    print("WROTE", scene.render.filepath, flush=True)
