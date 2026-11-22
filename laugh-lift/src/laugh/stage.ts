// The staging of "Laugh Lift": where everyone is and what they do, as pure functions of t (seconds). No React here,
// so the numeric checks (tools/laugh_check.ts) evaluate exactly what the render shows. Every action is anchored to a
// word of the voice-over (W) or a shot start (ST).
//
// The world's rule: laughing makes you float. lift = how far someone's soles are above the ground.
// Periods: street intro -> walk to school -> the yard attempts -> Operation Giggle -> the bedroom at night ->
// the party, the flight, the sky, the descent (one continuous stretch) -> the walk to school at the end.
import * as THREE from "three";
import type { Held, Look } from "../blocky/Blocky";
import { clamp, coneMatrix, hash, keys, L, lerp, SPEC, ss, U, upperMatrix } from "../blocky/motion";
import type { Emotion, Pose, V3 } from "../blocky/motion";
import { alive, base, blinkAt, facePoint, GRASS_SINK, heldWorld, pop, walk } from "../library/characters";
import { CLOWN, FIRE, GRANDPA, GUESTS, MOM, RIKA, SC, TOMO } from "./cast";
import { SE, ST, W } from "./time";

// ------------------------------------------------------------------ types
export type Actor = {
  key: string;
  look: Look;
  pose: Pose;
  emotion: Emotion;
  s: number;
  blinkSeed: number;
  /** a prop in one hand (rendered by the composition from heldKind) */
  heldKind?: { side: "L" | "R"; kind: "chicken" | "sign" | "rope" | "kiteSpool"; squeeze?: number; tilt?: [number, number] };
  heldKind2?: { side: "L" | "R"; kind: "chicken" | "sign" | "rope" | "kiteSpool"; squeeze?: number; tilt?: [number, number] };
  socks?: string;
  /** soles above the floor (m) and the floor height, for the contact shadow */
  lift: number;
  floor: number;
  /** the clown's wig on the head */
  wig?: boolean;
  blink?: boolean;
};
export type Held2 = Held;
export type Item =
  | { k: "rope"; a: V3; b: V3; sag: number; c?: string; wave?: number; r?: number }
  | { k: "text"; p: V3; text: string; op: number; s: number; color?: string }
  | { k: "cake"; p: V3; squash: number; flames: boolean }
  | { k: "bowl"; p: V3; wig: boolean }
  | { k: "wig"; p: V3; rot: V3 }
  | { k: "banana"; p: V3; yaw: number; roll: number }
  | { k: "chair"; p: V3; yaw: number }
  | { k: "cushion"; p: V3; squash: number; yaw: number }
  | { k: "ladder"; p: V3; h: number; tilt?: number }
  | { k: "kite"; p: V3; c: string; yaw: number; seed: number }
  | { k: "jump"; a: V3; b: V3; sag: number }
  | { k: "bird"; p: V3; yaw: number; flap: number; s?: number; seed: number }
  | { k: "cloud"; p: V3; s: number; seed: number }
  | { k: "shoe"; p: V3; rot: V3 }
  | { k: "splash"; p: V3; u: number; c: string; n?: number; r?: number; seed?: number }
  | { k: "ring"; p: V3; u: number; c?: string; r?: number }
  | { k: "table"; p: V3 }
  | { k: "banner"; p: V3; text: string; w: number }
  | { k: "bunch"; at: V3; h: number; n: number; seed: number }
  | { k: "knot"; p: V3 }
  | { k: "blob"; p: V3; sx: number; sz: number; op: number }
  | { k: "stake"; p: V3; h: number };
export type Stage = { set: "town" | "room"; big: boolean; actors: Actor[]; items: Item[] };

// ------------------------------------------------------------------ geometry helpers
const M4 = () => new THREE.Matrix4();
/** world point of an upper-body local point (m, body units before scale) of a posed, scaled character */
export const bodyPoint = (p: Pose, s: number, local: V3): V3 => {
  const p0: Pose = { ...p, x: 0, y: 0, z: 0, yaw: 0 };
  const m = M4().makeTranslation(p.x, p.y, p.z).multiply(M4().makeRotationY(p.yaw)).multiply(M4().makeScale(s, s, s)).multiply(upperMatrix(p0));
  const v = new THREE.Vector3(...local).applyMatrix4(m);
  return [v.x, v.y, v.z];
};
/** the top of Tomo's rocket backpack (the rope is tied to its nose) */
export const packTop = (p: Pose, s: number): V3 => bodyPoint(p, s, [0, 2.32 * U, -(0.5 + 0.36) * U]);
/** the belt buckle (front, low) */
export const beltPoint = (p: Pose, s: number): V3 => bodyPoint(p, s, [0, 0.12 * U, 0.6 * U]);
export const hand = (p: Pose, side: "L" | "R", s: number): V3 => heldWorld(p, side, s, [0, 0.02, 0]);
/** the top of the head (where a bird lands) */
export const headTop = (p: Pose, s: number): V3 => {
  const f = facePoint(p, s);
  const up = (SPEC.head.h / 2 + 0.02) * U * s;
  return [f[0] + Math.sin(p.yaw) * Math.sin(p.pitch) * up, f[1] + Math.cos(p.pitch) * up, f[2] + Math.cos(p.yaw) * Math.sin(p.pitch) * up];
};
/** the ankle of a leg (for the bedroom rope) */
export const ankle = (p: Pose, side: "L" | "R", s: number): V3 => {
  const sx = side === "L" ? 1 : -1;
  const p0: Pose = { ...p, x: 0, y: 0, z: 0, yaw: 0 };
  const m = M4()
    .makeTranslation(p.x, p.y, p.z)
    .multiply(M4().makeRotationY(p.yaw))
    .multiply(M4().makeScale(s, s, s))
    .multiply(M4().makeRotationX(p0.pitch))
    .multiply(M4().makeTranslation(sx * SPEC.hipX * U, 0, 0))
    .multiply(M4().makeRotationX(-(side === "L" ? p.legL : p.legR)));
  const v = new THREE.Vector3(0, -L + 0.12, 0).applyMatrix4(m);
  return [v.x, v.y, v.z];
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const lerp3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const yawOf = (dx: number, dz: number) => Math.atan2(dx, dz);
const kIn = (k: [number, number][], t: number) => {
  // keyframes with ease-in (accelerating) segments
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++)
    if (t <= k[i][0]) {
      const u = clamp((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
      return lerp(k[i - 1][1], k[i][1], u * u);
    }
  return k[k.length - 1][1];
};
/** linear keyframes (for altitudes that must keep moving) */
const lin = (k: [number, number][], t: number) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], (t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
  return k[k.length - 1][1];
};

// ------------------------------------------------------------------ pose layers
/** standing on grass (s = scale) */
const stand = (x: number, z: number, yaw: number, s: number, o: Partial<Pose> = {}) => base(x, z, yaw, s, o, GRASS_SINK);
/** floating: soles `lift` above the floor, legs dangling a little, arms a touch out */
const float = (x: number, z: number, yaw: number, s: number, lift: number, t: number, seed: number, o: Partial<Pose> = {}, floor = 0): Pose => {
  const b = base(x, z, yaw, s, {}, 0);
  return {
    ...b,
    y: b.y + lift + floor,
    legL: 0.12 * Math.sin(t * 1.5 + seed),
    legR: -0.1 * Math.sin(t * 1.5 + seed + 0.9),
    outL: 0.2 + 0.04 * Math.sin(t * 1.1 + seed),
    outR: 0.2 + 0.04 * Math.sin(t * 1.2 + seed + 2),
    armL: 0.15,
    armR: 0.15,
    ...o,
  };
};
/** a belly laugh on top of a pose: leaning back, head up, hands at the belly, shaking at ~2.2 Hz. k = 0..1 */
const laughL = (p: Pose, t: number, k: number): Pose => {
  if (k <= 0) return p;
  const sh = Math.sin(t * 2 * Math.PI * 2.2);
  return {
    ...p,
    pitch: p.pitch - 0.1 * k,
    headPitch: p.headPitch - 0.28 * k + 0.05 * sh * k,
    armL: lerp(p.armL, 0.62, k),
    armR: lerp(p.armR, 0.62, k),
    outL: lerp(p.outL, -0.02, k),
    outR: lerp(p.outR, -0.02, k),
    bob: (p.bob ?? 0) - 0.014 * k * Math.abs(sh),
    sway: (p.sway ?? 0) + 0.03 * k * Math.sin(t * 2 * Math.PI * 1.1),
  };
};
/** sitting on a chair seat (hip on the seat, legs straight forward: the blocky way) */
const seated = (x: number, z: number, yaw: number, s: number, seatY: number, o: Partial<Pose> = {}): Pose => ({
  ...base(x, z, yaw, s),
  y: seatY + 0.5 * SPEC.leg.d * U * s + 0.01,
  legL: Math.PI / 2 - 0.12,
  legR: Math.PI / 2 - 0.1,
  armL: 0.35,
  armR: 0.35,
  outL: 0.12,
  outR: 0.12,
  ...o,
});
/** HA! bubbles for a laugh in [a, b]: one every `every` s, each rises and fades in 1 s, beside the face */
const haBubbles = (items: Item[], face: V3, t: number, a: number, b: number, seed: number, s = 1, every = 0.42, text = "HA!") => {
  if (t < a || t > b + 1) return;
  const k0 = Math.max(0, Math.floor((t - a) / every) - 3);
  for (let k = k0; k <= Math.floor((t - a) / every); k++) {
    const born = a + k * every;
    if (born > b) break;
    const age = t - born;
    if (age < 0 || age > 1) continue;
    const side = hash(seed + k * 1.7) < 0.5 ? -1 : 1;
    const op = age < 0.12 ? age / 0.12 : 1 - (age - 0.12) / 0.88;
    items.push({ k: "text", p: add(face, [side * (0.22 + 0.12 * age) * s, (0.18 + 0.5 * age) * s, 0.05 * side]), text: k % 3 === 2 ? "HA" : text, op, s: (0.75 + 0.25 * hash(seed * 3 + k)) * s });
  }
};
const shadowOf = (a: Actor): Item => {
  const f = facePoint(a.pose, a.s);
  const k = clamp(1 - a.lift / 3.5);
  return { k: "blob", p: [a.pose.x, a.floor, a.pose.z], sx: (0.95 + 0.5 * (1 - k)) * a.s, sz: (0.7 + 0.4 * (1 - k)) * a.s, op: 0.62 * Math.max(0.25, k) * (f[1] > -1 ? 1 : 0) };
};
const mk = (key: string, look: Look, s: number, pose: Pose, emotion: Emotion, seed: number, lift = 0, floor = 0, extra: Partial<Actor> = {}): Actor => ({
  key, look, s, pose, emotion, blinkSeed: seed, lift, floor, ...extra,
});

// ------------------------------------------------------------------ fixed places
export const LAMP: V3 = [-8, 0, -1.25];
export const CH: V3 = [1.6, 0, 4.3]; // Grandpa's garden chair (faces the street, -z)
export const CHAIR_SEAT = 0.48;
export const BUSH: V3 = [-3.0, 0, 3.5];
export const TB: V3 = [0.6, 0, 5.4]; // party table
export const CAKE: V3 = [0.25, 0.78, 5.4];
export const BOWL: V3 = [1.35, 0.78, 5.45];
export const BANANA: V3 = [0.28, 0, 3.98];
export const STAKE: V3 = [-1.15, 0, 3.35]; // balloon stake Tomo shoots up through
export const COTTAGE_ROOF: V3 = [-11.5, 3.3, 10.0];
export const ROOM_BED = { x: -1.85, z: -0.6, top: 0.52, post: [-1.85, 0.62, 0.42] as V3 };

// ------------------------------------------------------------------ key times
const T = () => ({
  B01: ST("B01"), C01: ST("C01"), C11: ST("C11"), D01: ST("D01"), E01: ST("E01"), J01: ST("J01"),
});
let TT: ReturnType<typeof T> | null = null;
const TK = () => (TT ??= T());

// ================================================================== period A + B: the street and the walk
const streetWalk = (t: number): Stage => {
  const items: Item[] = [];
  const actors: Actor[] = [];
  const { B01 } = TK();
  const s = SC.tomo, g = SC.grandpa;
  // Grandpa: stands by the lamp holding the rope (A), then walks to school along +x (B)
  const gx0 = -6.0;
  const v = 0.95;
  let gp: Pose;
  if (t < B01) gp = stand(gx0 + 0.05, -2.2, -0.4, g, { armR: 0.85, outR: 0.1, headPitch: -0.12 });
  else gp = walk(gx0, -1.3, Math.PI / 2, t, B01, v, g, { armL: 0.75, outL: 0.12 }, GRASS_SINK);
  // heavy steps: the walk is slower and the body sinks a little more
  const gWalking = t >= B01;
  if (gWalking) gp = { ...gp, bob: (gp.bob ?? 0) * 2.2, armL: 0.72 + 0.04 * Math.sin(t * 3) };
  const gx = gp.x;
  actors.push(mk("grandpa", GRANDPA, g, gp, "flat", 2.1));
  // Tomo: floats over the sidewalk; laughs; rises to the lamp top on "always up here"
  const laughA: [number, number] = [W(1, "laugh,") - 0.2, W(1, "higher.", 1, true) + 0.2];
  const laughB: [number, number] = [W(2, "laugh") - 0.1, W(2, "everything.", 1, true) + 0.4];
  const lift = keys([[0, 0.85], [1.0, 1.0], [laughB[0], 1.0], [laughB[1], 1.7], [W(2, "up"), 2.35], [B01 - 0.01, 2.2], [B01, 1.45], [B01 + 1.0, 1.5], [ST("B05"), 1.45], [ST("B06"), 1.55]], t) + 0.05 * Math.sin(t * 1.7);
  let tx: number, tz: number, tyaw: number;
  if (t < B01) {
    tx = gx0 - 0.85;
    tz = -1.75;
    tyaw = keys([[0, 0.25], [W(2, "Me?"), 0.15], [W(2, "So"), 0.3]], t);
  } else {
    tx = gx + 1.05;
    tz = -1.95;
    tyaw = Math.PI / 2 - 0.35;
  }
  const laughing = (t > laughA[0] && t < laughA[1]) || (t > laughB[0] && t < laughB[1]) || (t > ST("B05") && t < SE("B06"));
  const lk = t < B01 ? Math.max(ss(laughB[0], laughB[0] + 0.3, t) * (1 - ss(laughB[1], laughB[1] + 0.4, t)), 0.5 * ss(laughA[0], laughA[0] + 0.3, t) * (1 - ss(laughA[1], laughA[1] + 0.3, t))) : ss(ST("B05"), ST("B05") + 0.3, t);
  let tp = float(tx, tz, tyaw, s, lift, t, 1.3);
  tp = laughL(tp, t, lk);
  // wave from up high ("always up here"): the far arm (L, away from the lenses on +z)
  const wave = ss(W(2, "up") - 0.3, W(2, "up") + 0.3, t) * (1 - ss(B01 - 0.5, B01 - 0.1, t));
  if (wave > 0) tp = { ...tp, armL: lerp(tp.armL, 2.75 + 0.25 * Math.sin(t * 2 * Math.PI * 1.6), wave), outL: lerp(tp.outL, 0.35, wave) };
  const tEmo: Emotion = laughing ? "joy" : t < 1.0 ? "happy" : t < W(2, "Me?") ? "happy" : "happy";
  actors.push(mk("tomo", TOMO, s, tp, tEmo, 1.0, lift));
  if (laughing) haBubbles(items, facePoint(tp, s), t, t < B01 ? (t < laughB[0] ? laughA[0] : laughB[0]) : ST("B05"), t < B01 ? (t < laughB[0] ? laughA[1] : laughB[1]) : SE("B06"), 11, 0.9);
  // the rope: Grandpa's L hand -> Tomo's backpack
  const hg = hand(gp, t < B01 ? "R" : "L", g);
  const pt = packTop(tp, s);
  items.push({ k: "rope", a: hg, b: pt, sag: 0.05 + 0.04 * Math.sin(t * 1.3) });
  // neighbours: bob an inch or two when they laugh
  const n0Laugh: [number, number] = [W(1, "laugh,") - 0.4, W(2, "two.", 1, true) + 0.3];
  const n0lift = 0.16 * ss(n0Laugh[0], n0Laugh[0] + 0.3, t) * (1 - ss(n0Laugh[1], n0Laugh[1] + 0.5, t)) + 0.02 * Math.max(0, Math.sin(t * 2 * Math.PI * 1.1));
  const n0 = laughL(stand(-4.6, -1.15, -0.55, SC.adult, { y: (L - GRASS_SINK) * SC.adult + n0lift }), t, ss(n0Laugh[0], n0Laugh[0] + 0.25, t) * (1 - ss(n0Laugh[1], n0Laugh[1] + 0.5, t)));
  if (t < B01) {
    actors.push(mk("n0", GUESTS[4], SC.adult, n0, n0lift > 0.03 ? "joy" : "happy", 5.5, n0lift));
    haBubbles(items, facePoint(n0, SC.adult), t, n0Laugh[0], n0Laugh[1], 23, 1.0);
  }
  const n1lift = 0.05 * Math.max(0, Math.sin(t * 2 * Math.PI * 0.9 + 1));
  const n1 = laughL(stand(-9.6, -1.7, 0.75, SC.kid, { y: (L - GRASS_SINK) * SC.kid + n1lift }), t, 0.6);
  const n2 = stand(-10.4, -1.35, 2.2, SC.adult, { armR: 0.5 });
  if (t < B01) {
    actors.push(mk("n1", GUESTS[1], SC.kid, n1, "joy", 6.6, n1lift));
    actors.push(mk("n2", GUESTS[3], SC.adult, n2, "happy", 7.7));
  }
  if (t > B01 + 1.5) {
    // a far neighbour on the walk
    const n3lift = 0.06 * Math.max(0, Math.sin(t * 2 * Math.PI * 1.0));
    actors.push(mk("n3", GUESTS[0], SC.kid, laughL(stand(4.2, -1.4, -2.2, SC.kid, { y: (L - GRASS_SINK) * SC.kid + n3lift }), t, 0.7), "joy", 8.8, n3lift));
  }
  return { set: "town", big: false, actors, items };
};

// ================================================================== period C1: the yard, the attempts
const yardAttempts = (t: number): Stage => {
  const items: Item[] = [];
  const actors: Actor[] = [];
  const g = SC.grandpa, s = SC.tomo;
  items.push({ k: "chair", p: CH, yaw: Math.PI });
  // Grandpa in his chair, reading the morning: flat face, rope in his L hand on the armrest
  const tug = W(8, "tugged");
  const tugU = (t - tug) / 0.7;
  const tugA = tugU > 0 && tugU < 1.4 ? 0.55 * Math.sin(Math.PI * clamp(tugU)) : 0;
  const walkW = W(8, "Walk.");
  let gp = seated(CH[0], CH[2] - 0.08, Math.PI, g, CHAIR_SEAT, { armL: 0.55 + tugA * -1.0, outL: 0.18, armR: 0.3 });
  // on "Walk." he leans forward to get up
  gp = { ...gp, pitch: 0.12 * ss(walkW - 0.1, walkW + 0.4, t), headPitch: 0.06 - 0.05 * ss(W(6, "Nothing."), W(6, "Nothing.") + 0.3, t) };
  actors.push(mk("grandpa", GRANDPA, g, gp, "flat", 2.1, 0, 0));
  // Tomo floats in front of him, facing him (+z)
  const jokeLaugh: [number, number] = [W(8, "Ground"), W(8, "beef.", 1, true) + 0.35];
  const jl = ss(jokeLaugh[0], jokeLaugh[0] + 0.2, t) * (1 - ss(jokeLaugh[1], jokeLaugh[1] + 0.3, t));
  const dip = tugU > 0 && tugU < 1.6 ? -0.42 * Math.sin(Math.PI * clamp(tugU / 1.3)) : 0;
  const lift = keys([[ST("C01"), 1.25], [ST("C01") + 0.8, 0.95], [jokeLaugh[0], 0.95], [jokeLaugh[1], 1.35], [tug, 1.3], [walkW + 0.6, 1.15]], t) + dip + 0.04 * Math.sin(t * 1.6);
  const tx = lerp(CH[0] - 1.6, CH[0] - 0.05, ss(ST("C01") - 0.3, ST("C01") + 0.9, t));
  let tp = float(tx, CH[2] - 1.45, 0.02, s, lift, t, 2.2);
  // funny faces: hands up by the cheeks; the chicken: thrust out in the R hand and squeezed; the joke: hands going
  const faces = ss(W(6, "Funny") - 0.2, W(6, "Funny") + 0.25, t) * (1 - ss(W(7, "A") - 0.1, W(7, "A") + 0.2, t));
  const chick = ss(W(7, "rubber") - 0.35, W(7, "rubber") + 0.1, t) * (1 - ss(W(8, "The") - 0.1, W(8, "The") + 0.25, t));
  const joke = ss(W(8, "The") - 0.1, W(8, "The") + 0.2, t) * (1 - ss(jokeLaugh[0], jokeLaugh[0] + 0.2, t));
  if (faces > 0) tp = { ...tp, armL: lerp(tp.armL, 2.55, faces), armR: lerp(tp.armR, 2.55, faces), outL: lerp(tp.outL, 0.42, faces), outR: lerp(tp.outR, 0.42, faces), headYaw: 0.15 * Math.sin(t * 2 * Math.PI * 1.2) * faces };
  if (chick > 0) tp = { ...tp, armR: lerp(tp.armR, 1.25 + 0.06 * Math.sin(t * 2 * Math.PI * 2), chick), outR: lerp(tp.outR, 0.12, chick) };
  if (joke > 0) tp = { ...tp, armL: lerp(tp.armL, 0.9 + 0.5 * Math.sin(t * 2 * Math.PI * 0.9), joke), armR: lerp(tp.armR, 0.9 + 0.5 * Math.sin(t * 2 * Math.PI * 0.9 + 2.2), joke), outL: lerp(tp.outL, 0.35, joke), outR: lerp(tp.outR, 0.35, joke) };
  tp = laughL(tp, t, jl);
  const emo: Emotion = faces > 0.5 ? "silly" : jl > 0.3 ? "joy" : t > tug ? "sad" : chick > 0.5 ? "joy" : joke > 0.5 ? "happy" : "happy";
  const squeeze = chick > 0.5 ? Math.max(0, Math.sin(t * 2 * Math.PI * 2)) : 0;
  actors.push(mk("tomo", TOMO, s, tp, emo, 1.0, lift, 0, chick > 0.05 ? { heldKind: { side: "R", kind: "chicken", squeeze, tilt: [0.25, 0] } } : {}));
  if (jl > 0.1) haBubbles(items, facePoint(tp, s), t, jokeLaugh[0], jokeLaugh[1], 31, 0.9);
  if (chick > 0.5 && squeeze > 0.7) items.push({ k: "text", p: add(hand(tp, "R", s), [0.25, 0.5, -0.1]), text: "SQUEAK!", op: 1, s: 0.75, color: "#ffffff" });
  items.push({ k: "rope", a: hand(gp, "L", g), b: packTop(tp, s), sag: tugA > 0.1 ? 0.0 : 0.12 });
  return { set: "town", big: false, actors, items };
};

// ================================================================== period C2: Operation Giggle
const operation = (t: number): Stage => {
  const items: Item[] = [];
  const actors: Actor[] = [];
  const g = SC.grandpa, s = SC.tomo;
  items.push({ k: "chair", p: CH, yaw: Math.PI });
  const sit = W(10, "sat") - 0.1;
  const c13 = ST("C13");
  // the cushion drops onto the seat in C13 and squashes when he sits
  const cdrop = ss(c13 + 0.2, c13 + 0.65, t);
  const cushY = CHAIR_SEAT + 0.06 + 0.75 * (1 - cdrop) + (cdrop > 0.99 && t < c13 + 0.85 ? 0.04 * Math.sin((Math.PI * (t - c13 - 0.65)) / 0.2) : 0);
  const sq = ss(sit + 0.05, sit + 0.3, t);
  if (t > c13) items.push({ k: "cushion", p: [CH[0], cushY - 0.02 * sq, CH[2] + 0.02], squash: sq, yaw: 0.3 });
  if (t > sit + 0.1 && t < sit + 1.4) {
    const u = (t - sit - 0.1) / 1.3;
    items.push({ k: "text", p: [CH[0] + 0.45, 0.7 + 0.5 * u, CH[2] - 0.45], text: "PFFT!", op: u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85, s: 1.25, color: "#ff8ac0" });
  }
  // Grandpa walks in from the right (+x) and sits down on "sat"
  if (t > c13 - 0.6) {
    let gp: Pose;
    const arrive = sit - 0.45;
    if (t < arrive) {
      const w0 = arrive - 2.0;
      gp = walk(CH[0] + 2.6, CH[2] - 0.75, -Math.PI / 2, t, w0, 2.6 / 2.0, g, {}, GRASS_SINK);
      if (gp.x < CH[0]) gp = { ...gp, x: CH[0] };
    } else {
      const u = ss(arrive, sit + 0.15, t);
      const st = stand(CH[0], CH[2] - 0.75, lerp(-Math.PI / 2, -Math.PI, ss(arrive, arrive + 0.3, t)), g);
      const se = seated(CH[0], CH[2] - 0.08, Math.PI, g, CHAIR_SEAT + 0.05 * (1 - sq));
      gp = {
        ...st,
        x: lerp(st.x, se.x, u), y: lerp(st.y, se.y, u), z: lerp(st.z, se.z, u), yaw: lerp(st.yaw, se.yaw, ss(arrive, arrive + 0.3, t)),
        legL: lerp(0, se.legL, u), legR: lerp(0, se.legR, u), armL: lerp(0.06, 0.35, u), armR: lerp(0.06, 0.35, u),
      };
    }
    // looks at the kids (his left, -x), then back
    const look = ss(W(10, "Looked") - 0.1, W(10, "Looked") + 0.35, t);
    gp = { ...gp, headYaw: 0.55 * look, headPitch: 0.04 };
    actors.push(mk("grandpa", GRANDPA, g, gp, "flat", 2.1));
  }
  // the kids behind the bush (lenses on the street side, -z): faces toward -z, turned to each other
  const behindZ = BUSH[2] + 0.95;
  const giggle = 0.12 + 0.05 * Math.max(0, Math.sin(t * 2 * Math.PI * 1.3));
  const plan = W(9, "plan.");
  let tp = float(BUSH[0] - 0.45, behindZ, Math.PI - 0.55, s, giggle, t, 3.1, { armL: 0.25, armR: 0.25 });
  let rp = stand(BUSH[0] + 0.45, behindZ - 0.05, -Math.PI + 0.55, SC.rika, { armL: 0.2, armR: 0.2 });
  // whisper: Rika's hand to her mouth (her R arm is the one toward Tomo... the far arm from the lens is L)
  const whisper = ss(ST("C11"), ST("C11") + 0.3, t) * (1 - ss(plan - 0.1, plan + 0.2, t));
  rp = { ...rp, armR: lerp(rp.armR, 2.35, whisper), outR: lerp(rp.outR, -0.1, whisper), headYaw: -0.25 * whisper };
  // Operation Giggle: Rika raises the sign in her far (L) hand
  const sign = ss(W(9, "Operation") - 0.35, W(9, "Operation") + 0.25, t) * (1 - ss(ST("C13") - 0.1, ST("C13") + 0.2, t));
  if (sign > 0) rp = { ...rp, armL: lerp(rp.armL, 2.6, sign), outL: lerp(rp.outL, 0.15, sign) };
  // "nothing": both slump; Rika crosses her arms for "made of stone"
  const slump = ss(W(10, "Nothing.") - 0.1, W(10, "Nothing.") + 0.35, t);
  const cross = ss(ST("C18") - 0.2, ST("C18") + 0.3, t);
  if (cross > 0) rp = { ...rp, armL: lerp(rp.armL, 1.35, cross), armR: lerp(rp.armR, 1.2, cross), outL: lerp(rp.outL, -0.42, cross), outR: lerp(rp.outR, -0.36, cross), yaw: lerp(rp.yaw, -Math.PI + 0.2, cross) };
  tp = { ...tp, pitch: 0.1 * slump, headPitch: 0.2 * slump, headYaw: 0.15 * (1 - slump) };
  const peek = ss(ST("C14") - 0.2, ST("C14") + 0.2, t);
  const tEmo: Emotion = slump > 0.5 ? "sad" : peek > 0.5 ? "curious" : sign > 0.4 || whisper > 0.4 ? "sly" : "sly";
  const rEmo: Emotion = cross > 0.5 ? "flat" : slump > 0.5 ? "sad" : peek > 0.5 ? "curious" : "sly";
  actors.push(mk("tomo", TOMO, s, tp, tEmo, 1.0, giggle));
  actors.push(mk("rika", RIKA, SC.rika, rp, rEmo, 4.4, 0, 0, sign > 0.05 ? { heldKind: { side: "L", kind: "sign", tilt: [0, 0.05] } } : {}));
  if (whisper > 0.3) haBubbles(items, facePoint(tp, s), t, ST("C11") + 0.2, plan, 41, 0.6, 0.6, "hee");
  return { set: "town", big: false, actors, items };
};

// ================================================================== period D: the bedroom at night
const bedroom = (t: number): Stage => {
  const items: Item[] = [];
  const actors: Actor[] = [];
  const s = SC.tomo, g = SC.grandpa;
  // Tomo asleep, lying on his back a hand above the bed, bobbing slowly (a giggle in a dream)
  const lift = 0.22 + 0.04 * Math.sin(t * 1.4);
  const hipZ = -0.72;
  const tp: Pose = {
    ...base(ROOM_BED.x, hipZ, 0, s, {}, 0),
    y: ROOM_BED.top + 0.5 * SPEC.torso.d * U * s + lift,
    pitch: -Math.PI / 2,
    legL: -Math.PI / 2 + 0.06,
    legR: -Math.PI / 2 - 0.04,
    armL: -0.15,
    armR: -0.2,
    outL: 0.35,
    outR: 0.3,
    headPitch: 0,
    headYaw: 0.25,
  };
  // a relaxed rotation: legs are relative to the pitched root, so -pi/2 + pitch keeps them along the body
  const tp2: Pose = { ...tp, legL: tp.pitch + 0.0 + 0.06, legR: tp.pitch - 0.04 };
  actors.push(mk("tomo", TOMO, s, { ...tp2, legL: 0.06, legR: -0.04 }, "sleep", 1.0, lift, ROOM_BED.top, { socks: "#ffd23a" }));
  // Grandpa at the bedside, checking the knot at the foot post twice
  const c1 = W(12, "checks"), c2 = W(12, "twice");
  const tugs = [c1 + 0.05, c2 + 0.05].reduce((m, a) => m + (t > a && t < a + 0.45 ? Math.sin((Math.PI * (t - a)) / 0.45) : 0), 0);
  const gp = stand(-0.85, 0.42, -Math.PI / 2 + 0.25, g, { pitch: 0.18, armL: 1.15 - 0.28 * tugs, outL: 0.05, armR: 0.2, headPitch: 0.35, headYaw: 0.1 });
  actors.push(mk("grandpa", GRANDPA, g, gp, "flat", 2.1, 0, 0, { blink: false }));
  const an = ankle(tp2, "R", s);
  const post = ROOM_BED.post;
  const hg = hand(gp, "L", g);
  items.push({ k: "rope", a: an, b: post, sag: 0.04 });
  items.push({ k: "rope", a: post, b: hg, sag: 0.02 });
  items.push({ k: "knot", p: post });
  items.push({ k: "knot", p: an });
  // soft "z" over the sleeper
  const zz = (t * 0.6) % 1;
  items.push({ k: "text", p: [ROOM_BED.x + 0.15, ROOM_BED.top + 0.7 + 0.4 * zz, hipZ - 0.55], text: "z", op: zz < 0.2 ? zz / 0.2 : 1 - (zz - 0.2) / 0.8, s: 0.6, color: "#bfe0ff" });
  return { set: "room", big: false, actors, items };
};

// ================================================================== period E-H: the party, the flight, the sky, the descent
/** Tomo's altitude (soles above the ground) from the snap to the landing */
const tomoAlt = (t: number) => {
  const snap = W(17, "snapped.");
  return lin(
    [
      [snap, 1.65], [W(18, "missed.") - 0.2, 2.45], [ST("E16"), 3.6], [ST("E17"), 8.0], [ST("F02"), 13], [ST("F03"), 17], [ST("F05"), 21.5],
      [ST("F07"), 25.5], [ST("F09"), 33], [ST("F11"), 41], [ST("F13"), 52], [ST("F14"), 68], [ST("F15"), 76], [ST("F16"), 79], [ST("F17"), 78],
      [ST("F18"), 82], [ST("F18b"), 88], [ST("F20"), 101], [ST("G01"), 106], [ST("G08"), 124], [W(34, "caught"), 125], [ST("H03"), 125.5],
      [ST("H04"), 131], [ST("H10"), 132], [ST("H12"), 132], [ST("H15"), 124], [ST("H15b"), 42], [ST("H17"), 9.5], [ST("H20"), 9.0],
    ],
    t,
  );
};
const descentLand = () => W(45, "cake.") - 0.05;

const party = (t: number): Stage => {
  const items: Item[] = [];
  const actors: Actor[] = [];
  const s = SC.tomo, g = SC.grandpa;
  const land = descentLand();
  // ---------------------------------------------------------------- the set dressing
  items.push({ k: "table", p: TB });
  items.push({ k: "banner", p: [TB[0], 2.35, 6.55], text: "HAPPY BIRTHDAY!", w: 3.6 });
  items.push({ k: "bunch", at: [TB[0] - 1.15, 0.78, TB[2] - 0.3], h: 1.5, n: 5, seed: 1 });
  items.push({ k: "stake", p: STAKE, h: 1.0 });
  items.push({ k: "bunch", at: [STAKE[0], 1.0, STAKE[2]], h: 1.0, n: 6, seed: 4 });
  items.push({ k: "bunch", at: [TB[0] + 1.9, 0.0, TB[2] - 0.9], h: 1.8, n: 4, seed: 7 });
  // ---------------------------------------------------------------- the clown, the banana, the cake, the wig
  const slip = W(15, "slipped") + 0.05;
  const faceIn = W(15, "face") - 0.08;
  const wigOff = W(15, "wig") - 0.1;
  const wigIn = W(15, "punch") + 0.2;
  const cs = SC.clown;
  let cp: Pose;
  let clownEmo: Emotion = "joy";
  let wigOn = true;
  if (t < slip) {
    // performing toward the guests, then walking up to the cake (faces +z, the table)
    const w0 = slip - 1.6;
    if (t < w0) {
      cp = stand(CAKE[0], 3.0, 0.0, cs, { armL: 2.4 + 0.3 * Math.sin(t * 2 * Math.PI * 1.2), armR: 2.4 + 0.3 * Math.sin(t * 2 * Math.PI * 1.2 + Math.PI), outL: 0.4, outR: 0.4 });
      cp = { ...cp, y: cp.y + 0.05 * Math.abs(Math.sin(t * 2 * Math.PI * 1.0)) };
    } else cp = walk(CAKE[0], 3.0, 0, t, w0, 0.85 / 1.6, cs, { armL: 0.4, armR: 0.4, outL: 0.3, outR: 0.3 }, GRASS_SINK);
  } else {
    // the slip: the banana shoots forward, the legs fly up behind, he dives face first into the cake
    const u = clamp((t - slip) / (faceIn - slip));
    const hipStart: V3 = [CAKE[0], (L - GRASS_SINK) * cs, 3.85];
    const pitch = keys([[slip, 0], [slip + 0.15, -0.25], [faceIn, 1.12], [faceIn + 0.1, 1.08], [faceIn + 0.3, 1.12]], t);
    const h = 0.7074 * cs; // hip -> face centre
    const faceTarget: V3 = [CAKE[0], CAKE[1] + 0.2, CAKE[2] - 0.12];
    const hipEnd: V3 = [faceTarget[0], faceTarget[1] - Math.cos(1.12) * h, faceTarget[2] - Math.sin(1.12) * h];
    const arc = 0.35 * Math.sin(Math.PI * u);
    const hp = lerp3(hipStart, hipEnd, u * u * (3 - 2 * u));
    const kick = keys([[slip, 0], [slip + 0.25, -1.1], [faceIn, -0.55], [faceIn + 0.3, -0.45]], t);
    cp = {
      ...base(hp[0], hp[2], 0, cs),
      y: hp[1] + arc,
      pitch,
      legL: pitch + kick,
      legR: pitch + kick - 0.15,
      armL: keys([[slip, 0.4], [slip + 0.2, 2.6], [faceIn, 1.4]], t),
      armR: keys([[slip, 0.4], [slip + 0.2, 2.9], [faceIn, 1.5]], t),
      outL: 0.5,
      outR: 0.5,
      headPitch: -0.1,
      headYaw: 0,
    };
    clownEmo = t < faceIn ? "shock" : "flat";
    if (t > faceIn + 1.2) {
      // he pulls his face out of the cake and sits on the grass beside the table, bald, frosting on his face
      const uu = ss(faceIn + 1.2, faceIn + 1.8, t);
      const seat = base(TB[0] + 1.55, 4.15, -0.4, cs);
      cp = { ...cp, x: lerp(cp.x, seat.x, uu), z: lerp(cp.z, seat.z, uu), y: lerp(cp.y, seat.y, uu), pitch: lerp(cp.pitch, 0, uu), legL: lerp(cp.legL, 0, uu), legR: lerp(cp.legR, 0, uu), yaw: lerp(0, -0.4, uu), armL: lerp(cp.armL, 0.3, uu), armR: lerp(cp.armR, 0.3, uu) };
      clownEmo = "shock";
    }
    if (t > wigOff) wigOn = false;
  }
  // later beats for the clown: looks up at the flight (shock), cries at the end
  if (t > ST("F02")) {
    cp = stand(TB[0] + 1.7, 4.0, -0.5, cs, { headPitch: -0.55, armL: 0.3, armR: 0.3 });
    clownEmo = "shock";
  }
  if (t > ST("H22") - 0.2) {
    cp = stand(TB[0] + 1.75, 4.05, -0.35, cs, { headPitch: -0.05, armL: 2.2, armR: 2.2, outL: 0.25, outR: 0.25 });
    clownEmo = t > W(46, "clown") - 0.1 ? "cry" : "joy";
  }
  actors.push(mk("clown", CLOWN, cs, cp, clownEmo, 9.1, 0, 0, { wig: wigOn }));
  // banana: on the grass; squirts forward under the shoe
  const bu = clamp((t - slip) / 0.5);
  items.push({ k: "banana", p: [BANANA[0], 0.0, BANANA[2] - 1.1 * bu], yaw: 0.4 + 3 * bu, roll: bu > 0 && bu < 1 ? 0.6 : 0 });
  // cake: squashed by the face, then by Tomo at the landing
  const squash = Math.max(ss(faceIn - 0.02, faceIn + 0.08, t) * 0.55, ss(land - 0.02, land + 0.12, t));
  items.push({ k: "cake", p: CAKE, squash, flames: t < faceIn });
  items.push({ k: "splash", p: [CAKE[0], CAKE[1] + 0.2, CAKE[2]], u: (t - faceIn) / 0.6, c: "#ffd6e6", n: 12, r: 0.6, seed: 1 });
  items.push({ k: "splash", p: [CAKE[0], CAKE[1] + 0.2, CAKE[2]], u: (t - land) / 0.6, c: "#ff8ab4", n: 14, r: 0.8, seed: 2 });
  if (t > faceIn && t < faceIn + 1.0) items.push({ k: "text", p: [CAKE[0] + 0.5, CAKE[1] + 0.7 + 0.3 * (t - faceIn), CAKE[2] - 0.4], text: "SPLAT!", op: 1 - (t - faceIn), s: 1.6, color: "#ffffff" });
  // wig: on the head -> arcs over -> lands in the punch bowl
  const headC = facePoint(cp, cs);
  if (!wigOn) {
    const u = clamp((t - wigOff) / (wigIn - wigOff));
    const p0: V3 = add(headC, [0, 0.25, 0]);
    const p1: V3 = [BOWL[0], BOWL[1] + 0.24, BOWL[2]];
    if (u < 1) items.push({ k: "wig", p: [lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u) + 1.6 * 4 * u * (1 - u), lerp(p0[2], p1[2], u)], rot: [u * 5, u * 3, u * 2] });
    items.push({ k: "splash", p: [BOWL[0], BOWL[1] + 0.22, BOWL[2]], u: (t - wigIn) / 0.6, c: "#e8204a", n: 12, r: 0.45, seed: 3 });
  }
  items.push({ k: "bowl", p: BOWL, wig: t >= wigIn });
  // ---------------------------------------------------------------- Tomo
  const lost = W(16, "And") - 0.05;
  const snap = W(17, "snapped.");
  let tp: Pose;
  let tEmo: Emotion = "happy";
  let lift: number;
  let tx = -1.55, tz = 2.75;
  const tyaw0 = 0.55;
  let tyaw = tyaw0;
  let socks: string | undefined;
  let held: Actor["heldKind"];
  // drift while he rises (closer to the house roof for E17), then stays over the yard
  if (t > snap) {
    const u = ss(snap, ST("F02"), t);
    tx = lerp(-1.55, -1.25, u);
    tz = lerp(2.75, 3.6, u);
  }
  if (t < snap) lift = keys([[ST("E01"), 0.62], [lost, 0.66], [ST("E12"), 1.15], [snap, 1.65]], t) + 0.04 * Math.sin(t * 1.6);
  else lift = tomoAlt(t);
  const laughing = (t > W(15, "slipped") + 0.3 && t < ST("E11")) ? 0.45 : t > lost && t < ST("F15") ? 1 : 0;
  tp = float(tx, tz, tyaw, s, lift, t, 1.7);
  if (t < snap) {
    tEmo = t < W(15, "slipped") + 0.3 ? "happy" : "joy";
    tp = laughL(tp, t, laughing);
    if (laughing > 0) haBubbles(items, facePoint(tp, s), t, lost, snap + 0.6, 51, 1.0, 0.33);
  } else if (t < ST("F02")) {
    // shooting up: arms flung up, legs trailing, laughing turning to shock
    const u = ss(snap, snap + 0.4, t);
    tp = laughL({ ...tp, armL: lerp(tp.armL, 2.6, u), armR: lerp(tp.armR, 2.5, u), outL: 0.35, outR: 0.35, legL: -0.15, legR: 0.1, headPitch: 0.25 }, t, 0.5);
    tEmo = t < W(19, "shot") ? "joy" : "shock";
    haBubbles(items, facePoint(tp, s), t, snap, ST("F02"), 53, 1.0, 0.36);
  }
  // the sky: beat by beat (all lenses for these shots look at him from close by)
  if (t >= ST("F02")) {
    const shoesOff = W(24, "fell") - 0.1;
    if (t > shoesOff) socks = "#ffd23a";
    tyaw = 0.35 + 0.1 * Math.sin(t * 0.4);
    tEmo = "shock";
    // looking down at the rescue attempts
    let headPitch = 0.55;
    if (t > ST("F09")) headPitch = 0.65;
    if (t > W(25, "bird")) headPitch = keys([[W(25, "bird"), 0.4], [W(25, "looked"), -0.35]], t);
    if (t > ST("F13")) headPitch = 0.1;
    tp = { ...tp, yaw: tyaw, headPitch, armL: 0.35, armR: 0.35, outL: 0.45, outR: 0.45 };
    if (t > ST("F09") && t < ST("F11")) tEmo = "shock";
    if (t > ST("F11") && t < ST("F13")) tEmo = "curious";
    if (t > ST("F13") && t < ST("F15")) {
      tEmo = "sad";
      // cold: hugging himself
      const k = ss(ST("F13"), ST("F13") + 0.5, t);
      tp = { ...tp, armL: lerp(tp.armL, 1.25, k), armR: lerp(tp.armR, 1.2, k), outL: lerp(tp.outL, -0.4, k), outR: lerp(tp.outR, -0.36, k), sway: 0.02 * Math.sin(t * 2 * Math.PI * 1.8) * k };
    }
    if (t > ST("F15") && t < ST("F16")) tEmo = "curious";
    if (t > ST("F16") && t < ST("F17")) {
      // clamps his mouth shut: both hands over his mouth
      tEmo = "flat";
      const k = ss(ST("F16") - 0.1, ST("F16") + 0.4, t);
      tp = { ...tp, armL: lerp(tp.armL, 2.75, k), armR: lerp(tp.armR, 2.75, k), outL: lerp(tp.outL, -0.32, k), outR: lerp(tp.outR, -0.32, k), headPitch: 0.05 };
    }
    if (t > ST("F17") && t < ST("F18")) tEmo = "shock";
    if (t > ST("F18") && t < ST("F20")) {
      // nervous giggles
      tEmo = Math.sin(t * 2 * Math.PI * 1.6) > -0.2 ? "joy" : "shock";
      tp = laughL(tp, t, 0.7);
      haBubbles(items, facePoint(tp, s), t, ST("F18"), SE("F18b"), 61, 0.65, 0.3, "hee");
    }
    if (t > ST("F20") && t < ST("G02")) {
      tEmo = "sad";
      tp = { ...tp, headPitch: 0.7 };
    }
    if (t > ST("G02") && t < ST("G08")) {
      tEmo = "curious";
      tp = { ...tp, headPitch: 0.6, headYaw: 0.25 };
    }
  }
  // ---------------------------------------------------------------- Grandpa
  let gp: Pose;
  let gEmo: Emotion = "flat";
  let gLift = 0;
  const gx = -2.25, gz = 2.6;
  const gyaw = 0.75;
  const lunge = ST("E14") + 0.1;
  const huge = W(31, "huge,") - 0.1;
  const flyStart = ST("G05") + 0.5;
  if (t < ST("F02")) {
    gp = stand(gx, gz, gyaw, g, { armL: t < snap ? 0.95 + 0.25 * ss(ST("E12"), snap, t) : 0.6, outL: 0.1, headPitch: t < ST("E11") ? 0.05 : -0.35 });
    if (t > lunge) {
      // lunge: both arms up, a step forward, the trailing rope end slips past his fingers
      const u = pop(clamp((t - lunge) / 0.75));
      gp = { ...gp, armL: lerp(0.6, 2.95, u), armR: lerp(0.06, 2.75, u), outL: 0.1, outR: 0.12, pitch: -0.1 * u, headPitch: -0.6 * clamp((t - lunge) / 0.4), y: gp.y + 0.12 * Math.sin(Math.PI * clamp((t - lunge) / 0.7)) };
      gEmo = "shock";
    } else if (t > snap - 0.1) gEmo = "shock";
  } else if (t < huge) {
    // the crowd period: looking up, worried
    gp = stand(gx + 0.25, gz + 0.35, 0.45, g, { headPitch: -0.75, armL: 0.25, armR: 0.25 });
    gEmo = t > ST("G01") ? "sad" : "shock";
  } else if (t < ST("G08")) {
    // the laugh: head back, rusty and huge; then he lifts off
    gLift = t < flyStart ? 0 : kIn([[flyStart, 0], [ST("G06"), 1.3], [ST("G07"), 3.2], [SE("G07"), 17]], t);
    gp = laughL(stand(gx + 0.25, gz + 0.35, 0.45, g, { headPitch: -0.5 }), t, ss(huge, huge + 0.35, t));
    gp = { ...gp, y: gp.y + gLift };
    if (gLift > 0.05) gp = { ...gp, legL: 0.15 * Math.sin(t * 1.5), legR: -0.12 * Math.sin(t * 1.5 + 1), armL: lerp(gp.armL, 2.7, ss(ST("G07") - 0.2, ST("G07") + 0.2, t)), armR: lerp(gp.armR, 2.5, ss(ST("G07") - 0.2, ST("G07") + 0.2, t)), outL: 0.15, outR: 0.15 };
    gEmo = "joy";
    haBubbles(items, facePoint(gp, g), t, huge, ST("G08"), 71, 1.5, 0.3);
  } else {
    gp = stand(0, 0, 0, g); // replaced below (the sky pair)
  }
  // ---------------------------------------------------------------- the sky pair (from the catch to the landing)
  if (t >= ST("G08")) {
    const caught = W(34, "caught");
    // Tomo hangs in the sky; Grandpa arrives from below and their hands meet; positions follow the hand
    const hold = t < ST("H10") || t > ST("H12") - 0.2;
    const hug = !hold;
    const a = tomoAlt(t);
    // drift toward the yard on the way down; over the cottage for the point
    const path = (tt: number): V3 => {
      const base0: V3 = [-1.25, 0, 3.6];
      if (tt < ST("H15")) return base0;
      if (tt < ST("H17")) return lerp3(base0, [-2.6, 0, 4.0], ss(ST("H15"), ST("H17"), tt));
      if (tt < ST("H20")) return [-2.6, 0, 4.0];
      return lerp3([-2.6, 0, 4.0], [CAKE[0], 0, CAKE[2] - 0.1], ss(ST("H20"), land, tt));
    };
    const pth = path(t);
    tx = pth[0];
    tz = pth[2];
    let alt = a;
    if (t > ST("H20")) alt = keys([[ST("H20"), 9.0], [land, CAKE[1] + 0.12]], t);
    tyaw = hug ? 0.0 : 0.55;
    if (t > ST("H17") && t < ST("H20")) tyaw = -0.4;
    const giggly = t < ST("H04") || (t > ST("H12") - 0.3 && t < W(42, "quiet."));
    tp = float(tx, tz, tyaw, s, alt, t, 1.9, { armR: 1.15, outR: 0.05, armL: 0.3, outL: 0.4 });
    if (t < caught + 0.1) tp = { ...tp, armR: lerp(0.35, 1.9, ss(ST("G08"), caught, t)), headPitch: 0.45 };
    tEmo = t < ST("H01") ? "shock" : t < ST("H04") ? "joy" : t < ST("H05") ? "happy" : t < ST("H07") ? "curious" : t < ST("H10") ? "sad" : t < ST("H12") ? "smile" : t < ST("H13") ? "sleep" : "smile";
    if (t > ST("H09") && t < ST("H10")) tEmo = "curious";
    if (t >= ST("H03") && t < ST("H04")) tp = laughL(tp, t, 0.9);
    if (giggly && t >= ST("H03")) haBubbles(items, facePoint(tp, s), t, ST("H03"), ST("H04") - 0.2, 81, 0.9, 0.3);
    if (t > ST("H20")) tEmo = "joy";
    // Grandpa
    const gyawS = hug ? 0.0 : -0.75;
    let gpS = float(0, 0, gyawS, g, 0, t, 2.6, { armL: 1.2, outL: 0.0 });
    if (hold) {
      // put his L hand on Tomo's R hand
      const th = hand(tp, "R", s);
      const gh = hand({ ...gpS, x: 0, y: 0, z: 0 }, "L", g);
      gpS = { ...gpS, x: th[0] - gh[0], y: th[1] - gh[1], z: th[2] - gh[2] };
      if (t < caught) {
        // arriving from below
        const u = ss(ST("G08"), caught, t);
        gpS = { ...gpS, y: gpS.y - 2.2 * (1 - u), armL: lerp(2.9, 1.2, u) };
      }
    } else {
      // the hug: Grandpa behind Tomo, both facing the same way, his arms round Tomo's shoulders
      gpS = float(tx - 0.02, tz - 0.42, 0, g, alt + 0.12, t, 2.6, { armL: 1.05, armR: 1.05, outL: -0.28, outR: -0.28, headPitch: 0.25 });
      tp = { ...tp, armL: 0.2, armR: 0.2, outL: 0.12, outR: 0.12, headPitch: -0.12 };
    }
    gEmo = t < ST("H01") ? "joy" : t < ST("H02") ? "joy" : t < ST("H03") ? "sly" : t < ST("H05") ? "joy" : t < ST("H07") ? "smile" : t < ST("H08") ? "sad" : t < ST("H11") ? "smile" : t < ST("H12") ? "smile" : t < ST("H14") ? "sleep" : "smile";
    if (t >= ST("H03") && t < ST("H04")) gpS = laughL(gpS, t, 0.9);
    if (t >= ST("H03") && t < ST("H04")) haBubbles(items, facePoint(gpS, g), t, ST("H03"), ST("H04") - 0.2, 83, 1.3, 0.32);
    if (t >= ST("H07") && t < ST("H07b")) gpS = { ...gpS, headPitch: 0.45 };
    // the point at the cottage roof: the far arm (R) toward the cottage, his body turned to it
    if (t > ST("H17") - 0.2 && t < ST("H20")) {
      const k = ss(ST("H17") - 0.1, ST("H17") + 0.6, t) * (1 - ss(ST("H19") + 0.2, ST("H19") + 0.8, t));
      gpS = { ...gpS, armR: lerp(gpS.armR, 1.15, k), outR: lerp(gpS.outR, 0.3, k), headYaw: -0.2 * k };
      gEmo = "smile";
    }
    if (t > ST("H20")) {
      gEmo = "joy";
    }
    // after the landing Grandpa stands on the grass beside the table
    if (t > land) {
      const u = ss(land, land + 0.5, t);
      gpS = { ...gpS, x: lerp(gpS.x, CAKE[0] - 0.95, u), z: lerp(gpS.z, CAKE[2] - 0.75, u), y: lerp(gpS.y, (L - GRASS_SINK) * g, u), yaw: lerp(gpS.yaw, Math.PI + 0.35, u), legL: 0, legR: 0, armL: 2.6, armR: 2.6, outL: 0.3, outR: 0.3 };
      // Tomo sits in the squashed cake, legs over the table edge, cheering
      const seatY = CAKE[1] + 0.12 + 0.5 * SPEC.leg.d * U * s;
      tp = { ...base(CAKE[0], CAKE[2] - 0.05, Math.PI, s), y: lerp(tp.y, seatY, u), legL: Math.PI / 2 - 0.15, legR: Math.PI / 2 - 0.1, armL: 2.7, armR: 2.6, outL: 0.35, outR: 0.35, headPitch: -0.1 };
    }
    gp = gpS;
    gLift = gpS.y - (L - GRASS_SINK) * g;
  }
  // after the snap Tomo trails the long end of the rope (until he lands)
  if (t > snap && t < land) {
    const pt = packTop(tp, s);
    const tail: V3 = [pt[0] + 0.12 * Math.sin(t * 1.3), pt[1] - 1.35, pt[2] - 0.1];
    items.push({ k: "rope", a: pt, b: tail, sag: -0.08, wave: 0.06 });
  }
  actors.push(mk("tomo", TOMO, s, tp, tEmo, 1.0, Math.max(0, lift), 0, { socks, heldKind: held }));
  actors.push(mk("grandpa", GRANDPA, g, gp, gEmo, 2.1, Math.max(0, gLift)));
  // the rope before the snap; after it Grandpa holds a short stub
  if (t < snap) items.push({ k: "rope", a: hand(gp, "L", g), b: packTop(tp, s), sag: t < ST("E12") ? 0.12 : 0.0 });
  else if (t < ST("F02")) {
    const hl = hand(gp, "L", g);
    items.push({ k: "rope", a: hl, b: [hl[0] + 0.05, hl[1] - 0.35, hl[2]], sag: 0.0 });
    if (t < snap + 0.6) items.push({ k: "text", p: [lerp(hl[0], tp.x, 0.5), hl[1] + 0.6, lerp(hl[2], tp.z, 0.5)], text: "SNAP!", op: 1 - (t - snap) / 0.6, s: 1.5, color: "#ffffff" });
  }
  // ---------------------------------------------------------------- the crowd
  const crowdUp = t > ST("F02") && t < ST("H22") - 0.2;
  const cheer = t > ST("H22") - 0.2;
  const guestsAt: [number, number, number, number][] = [
    [-1.05, 4.9, 0.5, SC.kid], [2.15, 4.55, -0.5, SC.kid], [2.85, 3.45, -0.8, SC.kid], [-0.15, 3.35, 0.1, SC.adult],
  ];
  guestsAt.forEach(([x, z, yaw, sc], i) => {
    const look = GUESTS[i];
    let p = stand(x, z, yaw, sc, { armL: 0.2, armR: 0.2 });
    let emo: Emotion = "happy";
    let gl = 0;
    if (t > W(15, "slipped") + 0.4 && t < ST("F02")) {
      // laughing at the clown: they bob up a little
      gl = 0.12 + 0.06 * Math.max(0, Math.sin(t * 2 * Math.PI * 1.2 + i));
      p = laughL({ ...p, y: p.y + gl }, t, 0.9);
      emo = "joy";
      if (i < 2) haBubbles(items, facePoint(p, sc), t, W(15, "slipped") + 0.4, ST("F02"), 90 + i, 0.8, 0.5);
    } else if (crowdUp) {
      p = { ...p, headPitch: -0.7, armL: 0.5, armR: 0.5, outL: 0.25, outR: 0.25, yaw: p.yaw * 0.5 };
      emo = t > W(31, "huge,") + 0.3 ? "shock" : "shock";
    } else if (cheer) {
      gl = 0.18 + 0.1 * Math.max(0, Math.sin(t * 2 * Math.PI * 1.3 + i));
      p = { ...p, y: p.y + gl, armL: 2.7 + 0.15 * Math.sin(t * 7 + i), armR: 2.6 + 0.15 * Math.sin(t * 7 + i + 1), outL: 0.35, outR: 0.35, yaw: p.yaw + 0.3 };
      emo = "joy";
    }
    actors.push(mk(`guest${i}`, look, sc, p, emo, 10 + i, gl));
  });
  // Rika, Mom and the firefighter arrive for the rescue
  if (t > ST("F02") - 0.3) {
    const rk = SC.rika;
    const throwT = W(23, "threw") - 0.15;
    const dropT = W(23, "Way,") + 0.3;
    let rp = stand(-3.15, 2.0, 0.3, rk, { headPitch: -0.75, armL: 0.4, armR: 0.4 });
    let rEmo: Emotion = "shock";
    if (t > throwT - 0.3 && t < dropT + 0.9) {
      const u = pop(clamp((t - throwT + 0.3) / 0.75));
      rp = { ...rp, armL: lerp(0.4, 2.9, u), armR: lerp(0.4, 2.9, u), outL: 0.2, outR: 0.2 };
      rEmo = "curious";
    }
    if (t > dropT + 0.2) rEmo = "flat";
    if (t > W(31, "huge,") + 0.2) {
      rEmo = "shock";
      rp = { ...rp, headPitch: -0.35, yaw: 0.6 };
    }
    if (t > ST("G06") && t < ST("H22")) {
      rEmo = "joy";
      rp = { ...rp, headPitch: -0.75, armL: 2.6, armR: 2.5, outL: 0.3, outR: 0.3 };
    }
    let rl = 0;
    if (cheer) {
      rl = 0.22 + 0.1 * Math.max(0, Math.sin(t * 2 * Math.PI * 1.3));
      rp = { ...rp, y: rp.y + rl, armL: 2.7, armR: 2.6, outL: 0.35, outR: 0.35, headPitch: 0, yaw: 0.5 };
      rEmo = "joy";
    }
    actors.push(mk("rika", RIKA, rk, rp, rEmo, 4.4, rl));
    // the jump rope: up from her hands, then down over her head
    if (t > throwT && t < ST("G01")) {
      const hL = hand(rp, "L", rk), hR = hand(rp, "R", rk);
      const u = clamp((t - throwT) / (dropT - throwT));
      const up = 4.2 * Math.sin(Math.PI * u);
      const top = facePoint(rp, rk);
      if (t < dropT) items.push({ k: "jump", a: [hL[0] - 0.2, hL[1] + up, hL[2]], b: [hR[0] + 0.2, hR[1] + up + 0.1, hR[2]], sag: -0.25 });
      else items.push({ k: "jump", a: [top[0] - 0.32, top[1] - 0.25, top[2] + 0.05], b: [top[0] + 0.32, top[1] - 0.3, top[2] - 0.05], sag: -0.28 });
    }
    // Mom with the three kites
    const ms = SC.mom;
    const kiteA = W(22, "tied") - 0.3;
    let mp = stand(0.45, 2.2, -0.2, ms, { headPitch: -0.75, armL: 0.4, armR: 0.4 });
    let mEmo: Emotion = "shock";
    if (t > kiteA && t < ST("G01")) {
      mp = { ...mp, armL: 1.9, outL: 0.1, armR: 1.7, outR: 0.1 };
      mEmo = "curious";
      const hm = hand(mp, "L", ms);
      const top = lin([[kiteA, 1.5], [W(22, "Too") - 0.1, 17.5], [ST("G01"), 17.8]], t);
      const pts: V3[] = [0, 1, 2].map((i) => [hm[0] - 0.35 * i + 0.5 * Math.sin(t * 0.7 + i), lerp(hm[1], top, (i + 1) / 3), hm[2] + 0.6 * i]);
      let prev: V3 = hm;
      pts.forEach((p, i) => {
        items.push({ k: "rope", a: prev, b: [p[0], p[1] - 0.7, p[2]], sag: 0.15 * (3 - i), c: "#ffffff", r: 0.006 });
        items.push({ k: "kite", p, c: ["#ff3b5c", "#ffd23a", "#2f9cf0"][i], yaw: 0.3, seed: i });
        prev = [p[0], p[1] - 0.7, p[2]];
      });
    }
    if (cheer) {
      mp = { ...mp, armL: 2.7, armR: 2.6, outL: 0.35, outR: 0.35, headPitch: 0, y: mp.y + 0.15, yaw: -0.4 };
      mEmo = "joy";
    } else if (t > W(31, "huge,") + 0.2 && t < ST("H22")) mEmo = "shock";
    actors.push(mk("mom", MOM, ms, mp, mEmo, 12.2, cheer ? 0.15 : 0));
    // the firefighter and the tallest ladder (it extends, and stops far short)
    const fs = SC.fire;
    const ladT = W(21, "brought") - 0.2;
    const fp = stand(-3.6, 3.55, 0.6, fs, { headPitch: -0.7, armL: 1.3, armR: 1.25, outL: 0.15, outR: 0.15 });
    actors.push(mk("fire", FIRE, fs, cheer ? { ...fp, armL: 2.7, armR: 2.6, headPitch: 0 } : fp, cheer ? "joy" : "shock", 13.3));
    const lh = t < ladT ? 2.8 : lin([[ladT, 2.8], [W(21, "Too") - 0.15, 12.0]], t);
    items.push({ k: "ladder", p: [-3.25, 0.02, 3.95], h: cheer ? 2.8 : lh });
  }
  // ---------------------------------------------------------------- birds, clouds, shoes, the bird on his head
  if (t > ST("E16")) {
    // a small flock round the roof height, scattering when he passes
    for (let i = 0; i < 6; i++) {
      const t0 = ST("E17");
      const sc = clamp((t - t0) / 1.6);
      const a = i * 1.05 + 0.3;
      const p: V3 = [-1.25 + Math.cos(a) * (2.2 + 4.5 * sc) + 0.6 * Math.sin(t * 0.8 + i), 8.5 + i * 0.35 + 2.0 * sc, 3.6 + Math.sin(a) * (1.6 + 3.5 * sc)];
      if (t < ST("F02") + 1) items.push({ k: "bird", p, yaw: a + Math.PI / 2, flap: 1, seed: i });
    }
  }
  if (t > ST("F02")) {
    // clouds around his altitude band (static in the world: he rises past them)
    const C: [number, number, number, number][] = [
      [-6, 30, -2, 2.2], [5, 38, 8, 2.6], [-2.5, 60, 10, 3.0], [6, 74, -4, 2.4], [-8, 88, 6, 3.2], [2.5, 93, 3.0, 2.6], [-1.3, 131.5, 3.2, 2.4],
      [9, 120, 12, 3.4], [-12, 112, -6, 3.6], [-4, 140, -10, 3.2], [12, 136, 2, 3.0], [-10, 128, 14, 3.2], [-2.0, 50, -6, 3.0], [-10, 20, 12, 3.0],
    ];
    C.forEach(([x, y, z, sc], i) => items.push({ k: "cloud", p: [x, y, z], s: sc, seed: i * 1.7 }));
    // shoes fall from his feet
    const off = W(24, "fell") - 0.1;
    if (t > off && t < off + 6) {
      const dt = t - off;
      const p0: V3 = [tp.x, tomoAlt(off) + 0.05, tp.z];
      (["L", "R"] as const).forEach((side, i) => {
        const y = p0[1] - 0.5 * 9.8 * dt * dt * 0.55;
        if (y > 0.1) items.push({ k: "shoe", p: [p0[0] + (i ? 0.14 : -0.14) + 0.2 * dt * (i ? 1 : -1), y, p0[2] + 0.1 * dt], rot: [dt * 4 + i, dt * 2, dt * 3 * (i ? 1 : -1)] });
      });
    }
    // the bird lands on his head and looks into his face
    const bl = W(25, "bird") + 0.1;
    if (t > ST("F11") - 0.2 && t < ST("F13")) {
      const ht = headTop(tp, s);
      const u = ss(ST("F11") - 0.2, bl + 0.35, t);
      const from: V3 = [ht[0] + 2.2, ht[1] + 0.8, ht[2] + 0.6];
      const p = lerp3(from, ht, u);
      const look = ss(W(25, "looked") - 0.2, W(25, "looked") + 0.2, t);
      const fwd: V3 = [Math.sin(tp.yaw) * 0.12 * look, 0.07 - 0.02 * look, Math.cos(tp.yaw) * 0.12 * look];
      items.push({ k: "bird", p: add(p, fwd), yaw: u < 1 ? -Math.PI / 2 : tp.yaw + Math.PI * look, flap: u < 0.98 ? 1 : 0, s: 1.15, seed: 9 });
    }
    // the giggle cloud he rises past (F18b), and birds on the way down (H15b)
    if (t > ST("H15b") && t < ST("H17")) {
      for (let i = 0; i < 5; i++) items.push({ k: "bird", p: [tx + 1.5 + i * 0.7, tomoAlt(t) + 1.2 + 0.3 * Math.sin(i * 2), tz + 1.8 - i * 0.4], yaw: -Math.PI / 2 + 0.2, flap: 1, seed: 20 + i });
    }
  }
  // blobs for everyone + the yard
  return { set: "town", big: t > ST("E17") - 0.01 && t < ST("H22") - 0.5, actors, items };
};

// ================================================================== period J: the walk to school, the end
const ending = (t: number): Stage => {
  const items: Item[] = [];
  const actors: Actor[] = [];
  const { J01 } = TK();
  const s = SC.tomo, g = SC.grandpa;
  const laugh = W(49, "Because") - 0.2;
  const v = 0.85;
  const gLift = keys([[J01, 0.14], [laugh, 0.18], [laugh + 1.0, 0.85], [W(50, "long"), 1.0], [J01 + 9, 1.1]], t) + 0.04 * Math.sin(t * 1.4);
  const lk = ss(laugh, laugh + 0.3, t) * (1 - ss(W(50, "Grandpa") - 0.1, W(50, "Grandpa") + 0.3, t));
  let gp = walk(-4.0, -1.3, Math.PI / 2, t, J01, v, g, { armL: 0.2 }, GRASS_SINK);
  gp = laughL({ ...gp, y: gp.y + gLift, legL: gp.legL * 0.6, legR: gp.legR * 0.6 }, t, lk);
  const tl = keys([[J01, 0.55], [laugh, 0.6], [laugh + 1.0, 1.35], [W(50, "long"), 1.5], [J01 + 9, 1.6]], t) + 0.05 * Math.sin(t * 1.7 + 1);
  let tp = float(gp.x + 0.8, -1.9, Math.PI / 2 - 0.25, s, tl, t, 1.4);
  tp = laughL(tp, t, lk);
  // the last line: they look at each other, then at the street ahead
  const lookAt = ss(W(50, "Grandpa") - 0.2, W(50, "Grandpa") + 0.3, t);
  gp = { ...gp, headYaw: lerp(gp.headYaw, -0.55, lookAt) };
  tp = { ...tp, headYaw: lerp(tp.headYaw, 0.45, lookAt) };
  actors.push(mk("grandpa", GRANDPA, g, gp, lk > 0.3 ? "joy" : "smile", 2.1, gLift));
  actors.push(mk("tomo", TOMO, s, tp, lk > 0.3 ? "joy" : "happy", 1.0, tl));
  if (lk > 0.1) {
    haBubbles(items, facePoint(gp, g), t, laugh, W(50, "Grandpa"), 101, 1.3, 0.36);
    haBubbles(items, facePoint(tp, s), t, laugh + 0.15, W(50, "Grandpa"), 103, 0.9, 0.36);
  }
  // the rope: from Grandpa's belt to Tomo's backpack ("tied to both of us")
  const bp = beltPoint(gp, g);
  const pt = packTop(tp, s);
  items.push({ k: "rope", a: bp, b: pt, sag: 0.18 });
  items.push({ k: "knot", p: bp });
  items.push({ k: "knot", p: pt });
  // a few neighbours bob as they pass
  const nl = 0.06 * Math.max(0, Math.sin(t * 2 * Math.PI * 1.1));
  actors.push(mk("n0", GUESTS[4], SC.adult, laughL(stand(3.8, -1.2, -1.9, SC.adult, { y: (L - GRASS_SINK) * SC.adult + nl }), t, 0.8), "joy", 5.5, nl));
  actors.push(mk("n1", GUESTS[1], SC.kid, laughL(stand(4.6, -1.85, -2.4, SC.kid, { y: (L - GRASS_SINK) * SC.kid + nl * 1.5 }), t, 0.8), "joy", 6.6, nl * 1.5));
  return { set: "town", big: false, actors, items };
};

// ================================================================== the stage at t
export const stageAt = (t: number): Stage => {
  const { C01, C11, D01, E01, J01 } = TK();
  const st = t < C01 ? streetWalk(t) : t < C11 ? yardAttempts(t) : t < D01 ? operation(t) : t < E01 ? bedroom(t) : t < J01 ? party(t) : ending(t);
  // the idle layer on everyone (never frozen) + blinks + contact shadows
  st.actors = st.actors.map((a) => {
    const live = alive({ key: a.key, look: a.look, pose: a.pose, emotion: a.emotion, s: a.s, blinkSeed: a.blinkSeed }, t);
    return { ...a, pose: live.pose, blink: a.blink ?? blinkAt(t, a.blinkSeed) };
  });
  for (const a of st.actors) st.items.push(shadowOf(a));
  return st;
};
export const actorOf = (st: Stage, key: string) => st.actors.find((a) => a.key === key);
export const FACE = (st: Stage, key: string): V3 => {
  const a = actorOf(st, key);
  if (!a) throw new Error(`no actor ${key}`);
  return facePoint(a.pose, a.s);
};
export { coneMatrix, facePoint, heldWorld, yawOf };
export const _unused = [lerp3, kIn, SE];
