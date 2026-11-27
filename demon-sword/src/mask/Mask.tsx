// The masks of "The Mask That Shows Your Enemy" (our own designs, painted from scratch on canvases):
//   fox     Ren's mask: white lacquer, tall ears with red insides, red flame brows, a red-and-gold jewel on the
//           forehead, swept red cheek marks, slanted eye slits with red liner, gold trim, a red cord
//   cat     Haru's mask: white with indigo markings, round-tipped ears, whiskers, a little pink nose
//   catBlack  the same cat mask gone black, with glowing purple cracks (the ending)
//   rabbit, round, plain, red, night   more masks for the workshop walls and the shrine stand
// A mask is a curved lacquered shell (a displaced plane cut out by its painted silhouette), a dark back, a cord.
// glow 0..1 lights the eye slits (red, or purple for catBlack).
import React from "react";
import * as THREE from "three";
import { canvasTexture, geoOf, plastic } from "../blocky/mat";
import { Glow } from "../goodbye/Fog";

export type MaskKind = "fox" | "cat" | "catBlack" | "rabbit" | "round" | "plain" | "red" | "night";
// mask space (m): x -0.16..0.16, y -0.17..0.27 (eye line at y = 0.02), +z forward
export const MW = 0.32, MH = 0.44, MY0 = -0.17;
const TW = 512, TH = 704;
const px = (x: number) => ((x + MW / 2) / MW) * TW;
const py = (y: number) => ((MY0 + MH - y) / MH) * TH;

type Pal = { base: string; base2: string; mark: string; mark2: string; trim: string; eye: string; inner: string };
const PAL: Record<MaskKind, Pal> = {
  fox: { base: "#fbf7ef", base2: "#e8e0d2", mark: "#d0182a", mark2: "#ff5a3a", trim: "#d8a838", eye: "#120a0a", inner: "#e8304a" },
  cat: { base: "#f8f6f2", base2: "#dcdce4", mark: "#24308a", mark2: "#4a6ad8", trim: "#b8bcc8", eye: "#0c0c14", inner: "#f0a0b8" },
  catBlack: { base: "#141218", base2: "#060508", mark: "#a040ff", mark2: "#e0a0ff", trim: "#3a2a4a", eye: "#000000", inner: "#3a1050" },
  rabbit: { base: "#fff8f8", base2: "#f0dede", mark: "#e84a7a", mark2: "#ff9ab8", trim: "#e8b848", eye: "#140a10", inner: "#ffb0c8" },
  round: { base: "#c8946a", base2: "#9a6a48", mark: "#3a2214", mark2: "#f4e8d0", trim: "#e8c870", eye: "#100804", inner: "#6a4028" },
  plain: { base: "#f4f0e6", base2: "#d8d2c4", mark: "#2a5aa8", mark2: "#6aa0e8", trim: "#c8a040", eye: "#101018", inner: "#2a5aa8" },
  red: { base: "#c8202a", base2: "#7a0c14", mark: "#ffd860", mark2: "#1a0a0a", trim: "#f0c040", eye: "#0a0000", inner: "#1a0a0a" },
  night: { base: "#1a1c2a", base2: "#0a0a12", mark: "#e8c860", mark2: "#f4f0e0", trim: "#e8c860", eye: "#000000", inner: "#c8a040" },
};
const EARS: Record<MaskKind, "fox" | "cat" | "rabbit" | "round" | "none"> = { fox: "fox", cat: "cat", catBlack: "cat", rabbit: "rabbit", round: "round", plain: "none", red: "fox", night: "cat" };

/** the outline path of a mask (canvas px), ears included */
const outline = (g: CanvasRenderingContext2D, k: MaskKind) => {
  const ears = EARS[k];
  g.beginPath();
  g.moveTo(px(0), py(-0.155));
  // right jaw to the cheek and temple
  g.bezierCurveTo(px(0.06), py(-0.15), px(0.15), py(-0.06), px(0.152), py(0.04));
  g.quadraticCurveTo(px(0.155), py(0.1), px(0.13), py(0.13));
  if (ears === "fox") {
    g.lineTo(px(0.142), py(0.25));
    g.quadraticCurveTo(px(0.12), py(0.255), px(0.05), py(0.15));
  } else if (ears === "cat") {
    g.quadraticCurveTo(px(0.145), py(0.215), px(0.128), py(0.225));
    g.quadraticCurveTo(px(0.11), py(0.22), px(0.05), py(0.16));
  } else if (ears === "rabbit") {
    g.bezierCurveTo(px(0.15), py(0.2), px(0.125), py(0.27), px(0.095), py(0.268));
    g.bezierCurveTo(px(0.065), py(0.265), px(0.06), py(0.2), px(0.045), py(0.155));
  } else if (ears === "round") {
    g.arc(px(0.1), py(0.16), 0.045 * (TW / MW), -0.1, Math.PI + 0.6, true);
  }
  g.quadraticCurveTo(px(0), py(0.172), px(-0.05), py(ears === "none" ? 0.165 : 0.15));
  if (ears === "fox") {
    g.quadraticCurveTo(px(-0.12), py(0.255), px(-0.142), py(0.25));
    g.lineTo(px(-0.13), py(0.13));
  } else if (ears === "cat") {
    g.quadraticCurveTo(px(-0.11), py(0.22), px(-0.128), py(0.225));
    g.quadraticCurveTo(px(-0.145), py(0.215), px(-0.13), py(0.13));
  } else if (ears === "rabbit") {
    g.bezierCurveTo(px(-0.06), py(0.2), px(-0.065), py(0.265), px(-0.095), py(0.268));
    g.bezierCurveTo(px(-0.125), py(0.27), px(-0.15), py(0.2), px(-0.13), py(0.13));
  } else if (ears === "round") {
    g.lineTo(px(-0.05), py(0.15));
    g.arc(px(-0.1), py(0.16), 0.045 * (TW / MW), -0.6, Math.PI + 0.1, true);
    g.lineTo(px(-0.13), py(0.13));
  } else {
    g.quadraticCurveTo(px(-0.13), py(0.16), px(-0.13), py(0.13));
  }
  g.quadraticCurveTo(px(-0.155), py(0.1), px(-0.152), py(0.04));
  g.bezierCurveTo(px(-0.15), py(-0.06), px(-0.06), py(-0.15), px(0), py(-0.155));
  g.closePath();
};
/** an eye slit (almond), slant > 0 lifts the outer corner */
const eyePath = (g: CanvasRenderingContext2D, side: 1 | -1, w: number, h: number, slant: number) => {
  const cx = px(side * 0.062), cy = py(0.02);
  const ox = cx + side * w * 0.5, oy = cy - slant;
  const ix = cx - side * w * 0.5, iy = cy + slant * 0.4;
  g.beginPath();
  g.moveTo(ix, iy);
  g.quadraticCurveTo(cx, cy - h, ox, oy);
  g.quadraticCurveTo(cx, cy + h * 0.7, ix, iy);
  g.closePath();
};
const EYE: Record<MaskKind, [number, number, number]> = { fox: [96, 30, 26], cat: [86, 40, 14], catBlack: [86, 40, 14], rabbit: [70, 42, 4], round: [64, 44, 0], plain: [84, 26, 6], red: [96, 30, 30], night: [86, 38, 16] };

const paint = (g: CanvasRenderingContext2D, k: MaskKind) => {
  const P = PAL[k];
  const ears = EARS[k];
  g.clearRect(0, 0, TW, TH);
  g.save();
  outline(g, k);
  g.clip();
  // lacquer base: a soft radial shade (lighter in the middle)
  const rg = g.createRadialGradient(px(0), py(0.02), 20, px(0), py(0.02), 330);
  rg.addColorStop(0, P.base);
  rg.addColorStop(0.75, P.base);
  rg.addColorStop(1, P.base2);
  g.fillStyle = rg;
  g.fillRect(0, 0, TW, TH);
  // inner ears
  g.fillStyle = P.inner;
  if (ears === "fox")
    for (const s of [1, -1]) {
      g.beginPath();
      g.moveTo(px(s * 0.128), py(0.225));
      g.lineTo(px(s * 0.118), py(0.15));
      g.quadraticCurveTo(px(s * 0.09), py(0.17), px(s * 0.075), py(0.16));
      g.closePath();
      const eg = g.createLinearGradient(0, py(0.23), 0, py(0.15));
      eg.addColorStop(0, P.inner);
      eg.addColorStop(1, P.mark2);
      g.fillStyle = eg;
      g.fill();
    }
  if (ears === "cat" || ears === "rabbit")
    for (const s of [1, -1]) {
      g.beginPath();
      const top = ears === "rabbit" ? 0.25 : 0.205;
      g.ellipse(px(s * (ears === "rabbit" ? 0.096 : 0.112)), py((top + 0.155) / 2), ears === "rabbit" ? 18 : 14, ((top - 0.155) / MH) * TH * 0.45, s * (ears === "rabbit" ? 0.1 : -0.35), 0, Math.PI * 2);
      g.fill();
    }
  // markings
  g.lineCap = "round";
  g.lineJoin = "round";
  if (k === "fox" || k === "red") {
    // flame brows sweeping up and out
    for (const s of [1, -1]) {
      g.fillStyle = P.mark;
      g.beginPath();
      g.moveTo(px(s * 0.03), py(0.06));
      g.bezierCurveTo(px(s * 0.06), py(0.11), px(s * 0.1), py(0.1), px(s * 0.13), py(0.14));
      g.bezierCurveTo(px(s * 0.1), py(0.085), px(s * 0.07), py(0.07), px(s * 0.03), py(0.06));
      g.fill();
      // cheek marks: three swept strokes
      for (let i = 0; i < 3; i++) {
        g.strokeStyle = i === 1 ? P.mark2 : P.mark;
        g.lineWidth = 9 - i * 2;
        g.beginPath();
        g.moveTo(px(s * (0.06 + i * 0.012)), py(-0.04 - i * 0.022));
        g.quadraticCurveTo(px(s * 0.11), py(-0.03 - i * 0.025), px(s * (0.145 - i * 0.006)), py(-0.005 - i * 0.03));
        g.stroke();
      }
    }
    // the forehead jewel: a red flame drop in a gold rim
    g.fillStyle = P.trim;
    g.beginPath();
    g.moveTo(px(0), py(0.155));
    g.bezierCurveTo(px(0.035), py(0.11), px(0.03), py(0.07), px(0), py(0.065));
    g.bezierCurveTo(px(-0.03), py(0.07), px(-0.035), py(0.11), px(0), py(0.155));
    g.fill();
    g.fillStyle = k === "red" ? "#1a0a0a" : P.mark;
    g.beginPath();
    g.moveTo(px(0), py(0.142));
    g.bezierCurveTo(px(0.026), py(0.108), px(0.022), py(0.077), px(0), py(0.074));
    g.bezierCurveTo(px(-0.022), py(0.077), px(-0.026), py(0.108), px(0), py(0.142));
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.55)";
    g.beginPath();
    g.ellipse(px(-0.007), py(0.098), 5, 10, 0.3, 0, Math.PI * 2);
    g.fill();
  }
  if (k === "cat" || k === "catBlack" || k === "night") {
    g.strokeStyle = P.mark;
    for (const s of [1, -1]) {
      // brows, whiskers, cheek dots
      g.lineWidth = 8;
      g.beginPath();
      g.arc(px(s * 0.062), py(0.06), 30, s > 0 ? Math.PI * 1.15 : Math.PI * 1.35, s > 0 ? Math.PI * 1.65 : Math.PI * 1.85);
      g.stroke();
      g.lineWidth = 5;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(px(s * 0.055), py(-0.065 - i * 0.016));
        g.lineTo(px(s * 0.145), py(-0.05 - i * 0.03));
        g.stroke();
      }
    }
    // forehead stripes
    g.lineWidth = 10;
    for (const x of [-0.03, 0, 0.03]) {
      g.beginPath();
      g.moveTo(px(x), py(0.16));
      g.lineTo(px(x * 0.6), py(0.11 - Math.abs(x) * 0.6));
      g.stroke();
    }
  }
  if (k === "rabbit") {
    g.fillStyle = P.mark;
    for (const s of [1, -1]) {
      g.beginPath();
      g.arc(px(s * 0.1), py(-0.05), 16, 0, Math.PI * 2);
      g.fill();
    }
    g.beginPath();
    g.arc(px(0), py(0.1), 12, 0, Math.PI * 2);
    g.fill();
  }
  if (k === "round") {
    g.fillStyle = P.mark2;
    g.beginPath();
    g.ellipse(px(0), py(-0.08), 70, 60, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = P.mark;
    for (const s of [1, -1]) {
      g.beginPath();
      g.ellipse(px(s * 0.062), py(0.02), 58, 44, s * 0.4, 0, Math.PI * 2);
      g.fill();
    }
  }
  if (k === "plain") {
    // blue waves across the forehead and the cheeks
    g.strokeStyle = P.mark;
    g.lineWidth = 7;
    for (const [y, r] of [[0.12, 26], [-0.07, 22]] as [number, number][])
      for (let x = -0.13; x <= 0.14; x += 0.052) {
        g.beginPath();
        g.arc(px(x), py(y), r, Math.PI, 2 * Math.PI);
        g.stroke();
      }
  }
  if (k === "night") {
    g.fillStyle = P.mark2;
    g.beginPath();
    g.arc(px(0), py(0.11), 16, 0, Math.PI * 2);
    g.fill();
  }
  // the eyes: slits with a liner (red for the fox, the mark colour for the others)
  const [ew, eh, sl] = EYE[k];
  for (const s of [1, -1] as const) {
    g.lineWidth = k === "fox" || k === "red" ? 11 : 8;
    g.strokeStyle = k === "round" ? P.trim : k === "fox" ? "#c8101e" : P.mark;
    eyePath(g, s, ew + 14, eh + 8, sl);
    g.stroke();
    if (k === "fox" || k === "red") {
      // the flick at the outer corner
      g.beginPath();
      g.moveTo(px(s * 0.062) + s * (ew + 14) * 0.5, py(0.02) - sl);
      g.quadraticCurveTo(px(s * 0.13), py(0.07), px(s * 0.145), py(0.085));
      g.stroke();
    }
    g.fillStyle = P.eye;
    eyePath(g, s, ew, eh, sl);
    g.fill();
  }
  // nose and mouth
  g.fillStyle = k === "cat" || k === "rabbit" ? "#f07a9a" : k === "catBlack" ? P.mark : P.eye;
  g.beginPath();
  g.moveTo(px(-0.016), py(-0.1));
  g.lineTo(px(0.016), py(-0.1));
  g.lineTo(px(0), py(-0.118));
  g.closePath();
  g.fill();
  g.strokeStyle = k === "fox" ? P.mark : P.mark;
  g.lineWidth = 5;
  g.beginPath();
  if (k === "cat" || k === "catBlack" || k === "night") {
    g.arc(px(-0.013), py(-0.122), 9, 0, Math.PI);
    g.arc(px(0.013), py(-0.122), 9, 0, Math.PI);
  } else {
    g.moveTo(px(-0.035), py(-0.128));
    g.quadraticCurveTo(px(0), py(-0.14), px(0.035), py(-0.128));
  }
  g.stroke();
  if (k === "catBlack") {
    // glowing cracks spreading from the eyes
    g.strokeStyle = P.mark2;
    g.lineWidth = 4;
    const cr = [[0.06, 0.02, 0.12, 0.12, 0.15, 0.1], [-0.06, 0.02, -0.1, -0.06, -0.14, -0.1], [0.05, -0.02, 0.02, -0.09, 0.06, -0.14], [-0.05, 0.05, -0.02, 0.13, -0.08, 0.17]];
    for (const [a, b, c, d, e, f] of cr) {
      g.beginPath();
      g.moveTo(px(a), py(b));
      g.lineTo(px(c), py(d));
      g.lineTo(px(e), py(f));
      g.stroke();
    }
  }
  g.restore();
  // gold trim round the edge
  g.strokeStyle = P.trim;
  g.lineWidth = 10;
  outline(g, k);
  g.stroke();
  g.strokeStyle = "rgba(0,0,0,0.25)";
  g.lineWidth = 2;
  g.stroke();
};
const maskTex = (k: MaskKind) => canvasTexture(`mask|${k}`, TW, TH, (g) => paint(g, k));
const shapeTex = (k: MaskKind) =>
  canvasTexture(
    `maskShape|${EARS[k]}`,
    TW,
    TH,
    (g) => {
      g.fillStyle = "#000";
      g.fillRect(0, 0, TW, TH);
      g.fillStyle = "#fff";
      outline(g, k);
      g.fill();
      g.strokeStyle = "#fff";
      g.lineWidth = 10;
      g.stroke();
    },
    false,
  );
const eyeTex = (k: MaskKind) =>
  canvasTexture(
    `maskEye|${k}`,
    TW,
    TH,
    (g) => {
      g.fillStyle = "#000";
      g.fillRect(0, 0, TW, TH);
      const [ew, eh, sl] = EYE[k];
      for (const s of [1, -1] as const) {
        g.fillStyle = "#fff";
        eyePath(g, s, ew, eh, sl);
        g.fill();
      }
      if (k === "catBlack") {
        g.strokeStyle = "#fff";
        g.lineWidth = 4;
        const cr = [[0.06, 0.02, 0.12, 0.12, 0.15, 0.1], [-0.06, 0.02, -0.1, -0.06, -0.14, -0.1], [0.05, -0.02, 0.02, -0.09, 0.06, -0.14], [-0.05, 0.05, -0.02, 0.13, -0.08, 0.17]];
        for (const [a, b, c, d, e, f] of cr) {
          g.beginPath();
          g.moveTo(px(a), py(b));
          g.lineTo(px(c), py(d));
          g.lineTo(px(e), py(f));
          g.stroke();
        }
      }
    },
    false,
  );

/** the curved shell: a plane bulged like a face, a snout, ears leaning back */
const shellGeo = (k: MaskKind) =>
  geoOf(`maskShell|${EARS[k]}`, () => {
    const g = new THREE.PlaneGeometry(MW, MH, 40, 56);
    g.translate(0, MY0 + MH / 2, 0);
    const p = g.attributes.position as THREE.BufferAttribute;
    const snout = EARS[k] === "fox" ? 0.05 : EARS[k] === "cat" ? 0.026 : 0.02;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const u = x / (MW / 2);
      let z = 0.048 * (1 - u * u) * (1 - 0.3 * Math.max(0, (y - 0.05) / 0.2));
      z -= 0.035 * Math.max(0, (Math.abs(y - 0.0) - 0.1) / 0.1) ** 2 * (y < 0 ? 1 : 0);
      z += snout * Math.exp(-((x / 0.05) ** 2) - ((y + 0.085) / 0.065) ** 2);
      // eye sockets dip slightly
      z -= 0.008 * Math.exp(-(((Math.abs(x) - 0.062) / 0.04) ** 2) - ((y - 0.02) / 0.025) ** 2);
      if (y > 0.13) z -= (y - 0.13) * 0.35;
      p.setZ(i, z);
    }
    g.computeVertexNormals();
    return g;
  });

const frontMats = new Map<string, THREE.MeshPhysicalMaterial>();
const frontMat = (k: MaskKind, glow: number, op: number) => {
  const key = `${k}|${glow.toFixed(2)}|${op.toFixed(2)}`;
  let m = frontMats.get(key);
  if (!m) {
    if (frontMats.size > 160) {
      for (const v of frontMats.values()) v.dispose();
      frontMats.clear();
    }
    const purple = k === "catBlack";
    m = new THREE.MeshPhysicalMaterial({
      map: maskTex(k),
      alphaMap: shapeTex(k),
      alphaTest: op < 1 ? 0 : 0.5,
      transparent: op < 1,
      opacity: op,
      depthWrite: op >= 1,
      roughness: k === "catBlack" || k === "night" ? 0.25 : 0.32,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      emissive: purple ? "#9a30ff" : "#e00808",
      emissiveMap: eyeTex(k),
      emissiveIntensity: glow * (purple ? 2.2 : 1.6) + (purple ? 0.5 : 0),
      side: THREE.FrontSide,
    });
    frontMats.set(key, m);
  }
  return m;
};
const backMat = (k: MaskKind) => plastic("#2a1610", { rough: 0.6, alphaMap: shapeTex(k), side: THREE.BackSide });

/** a mask (mask space: eye line at y 0.02, +z forward). glow 0..1 lights the eyes; cord = a loose cord hanging below */
export const Mask: React.FC<{ kind: MaskKind; glow?: number; op?: number; cord?: "loose" | "none" }> = ({ kind, glow = 0, op = 1, cord = "none" }) => {
  const g = shellGeo(kind);
  const gl = Math.round(glow * 20) / 20;
  const back = backMat(kind);
  back.alphaTest = 0.5;
  const eyeC = kind === "catBlack" ? "#c070ff" : "#ff2a18";
  return (
    <group>
      <mesh geometry={g} material={frontMat(kind, gl, Math.round(op * 20) / 20)} castShadow receiveShadow />
      {op >= 1 ? <mesh geometry={g} material={back} position={[0, 0, -0.005]} castShadow /> : null}
      {gl > 0.02
        ? [1, -1].map((s) => (
            <React.Fragment key={s}>
              <Glow p={[s * 0.062, 0.022, 0.05]} s={0.12 * gl} c={eyeC} op={0.95 * gl} />
              <Glow p={[s * 0.062, 0.022, 0.05]} s={0.42 * gl} c={eyeC} op={0.35 * gl} />
            </React.Fragment>
          ))
        : null}
      {cord === "loose" ? (
        <>
          {[1, -1].map((s) => (
            <mesh key={s} geometry={geoOf("cordLoose", () => new THREE.TorusGeometry(0.06, 0.006, 6, 20, Math.PI))} material={plastic("#c81e24", { rough: 0.6 })} position={[s * 0.15, -0.04, -0.01]} rotation={[0, Math.PI / 2, Math.PI / 2 + s * 0.3]} />
          ))}
          <mesh geometry={geoOf("tassel", () => new THREE.ConeGeometry(0.014, 0.07, 8))} material={plastic("#c81e24", { rough: 0.7 })} position={[0.155, -0.13, -0.01]} />
        </>
      ) : null}
    </group>
  );
};

/** how a mask is worn: on the face; pushed to the side of the head; pushed up on the forehead */
export type Wear = "face" | "side" | "up";
/** for Blocky's headNode (head space, unscaled: the head is 0.275 wide, 0.30 tall, 0.27 deep, centred at 0) */
export const WornMask: React.FC<{ kind: MaskKind; wear: Wear; glow?: number; op?: number }> = ({ kind, wear, glow = 0, op = 1 }) => {
  const cord = plastic("#c81e24", { rough: 0.55 });
  const ring = geoOf("maskCord", () => new THREE.TorusGeometry(1, 0.035, 6, 40));
  if (wear === "face")
    return (
      <group>
        <group position={[0, -0.005, 0.158]}>
          <Mask kind={kind} glow={glow} op={op} />
        </group>
        {/* the cord round the head, a knot and two tails at the back */}
        <mesh geometry={ring} material={cord} position={[0, 0.025, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.152, 0.152, 0.2]} />
        <mesh geometry={geoOf("cordKnot", () => new THREE.SphereGeometry(0.018, 10, 8))} material={cord} position={[0, 0.025, -0.15]} />
        {[1, -1].map((s) => (
          <mesh key={s} geometry={geoOf("cordTail", () => new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6))} material={cord} position={[s * 0.02, -0.03, -0.155]} rotation={[0.2, 0, s * 0.3]} />
        ))}
      </group>
    );
  if (wear === "side")
    return (
      <group>
        <group position={[0.142, 0.07, 0.03]} rotation={[0, 1.25, 0.18]} scale={0.82}>
          <Mask kind={kind} glow={glow} op={op} />
        </group>
      </group>
    );
  return (
    <group>
      <group position={[0, 0.19, 0.09]} rotation={[-1.05, 0, 0]} scale={0.84}>
        <Mask kind={kind} glow={glow} op={op} />
      </group>
    </group>
  );
};

/** a wall of masks hung on pegs (rows x cols, spacing dx, dy), facing +z; kinds and tilts vary by hash */
export const MaskWall: React.FC<{ rows: number; cols: number; dx: number; dy: number; seed: number; glowAt?: number; glow?: number }> = ({ rows, cols, dx, dy, seed, glowAt = -1, glow = 0 }) => {
  const kinds: MaskKind[] = ["fox", "cat", "rabbit", "round", "plain", "red", "night", "fox", "plain", "cat"];
  const out: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const h = Math.abs(Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453) % 1;
      const k = kinds[Math.floor(h * kinds.length) % kinds.length];
      out.push(
        <group key={i} position={[(c - (cols - 1) / 2) * dx + (h - 0.5) * 0.04, (r - (rows - 1) / 2) * dy, 0.02]} rotation={[0.06, (h - 0.5) * 0.25, (h - 0.5) * 0.18]} scale={0.95 + 0.15 * h}>
          <Mask kind={k} glow={i === glowAt ? glow : 0} />
          <mesh geometry={geoOf("peg", () => new THREE.CylinderGeometry(0.01, 0.01, 0.05, 6))} material={plastic("#3a2414", { rough: 0.6 })} position={[0, 0.17, -0.02]} rotation={[Math.PI / 2, 0, 0]} />
        </group>,
      );
    }
  return <group>{out}</group>;
};
