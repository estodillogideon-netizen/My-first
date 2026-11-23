// The staging of "Monsters Are Allergic to Laughter": where everyone is and what they do, as pure functions of t
// (seconds) and the shot. No React here, so the numeric checks (tools/monster_check.ts) evaluate exactly what the
// render shows. Every action is anchored to a word of the voice-over (W) or a shot start (ST).
// The world's rule: every kid has a monster under the bed; a kid's laugh makes the monster sneeze.
import type { Look } from "../blocky/Blocky";
import { clamp, hash, L, lerp, SPEC, ss, U } from "../blocky/motion";
import type { Emotion, Pose, V3 } from "../blocky/motion";
import { alive, base, blinkAt, facePoint, heldWorld, pop, SINK, walk } from "../library/characters";
import { LILY, LILY_PJ, ROSIE, ROSIE_DAD, SC } from "./cast";
import { BO, FUZZ, GRIZZLE, MOE, PIP, bodyC, faceLocal } from "./Monster";
import type { MAcc, MEmotion, MonsterLook, MPose } from "./Monster";
import { BED, CLUB, DRESSER, ROOM, RUG, STREET } from "./Sets";
import type { Blanket } from "./Sets";
import { SHOTS, ST, W } from "./time";

// ------------------------------------------------------------------ types
export type HeldKind = { side: "L" | "R"; kind: "book" | "flashlight" | "drawing" | "box" | "sock"; tilt?: [number, number] };
export type Hum = { key: string; look: Look; pose: Pose; emotion: Emotion; s: number; seed: number; held?: HeldKind; held2?: HeldKind; blink?: boolean; blob?: number; floor?: number };
export type Mon = { key: string; look: MonsterLook; pose: MPose; emotion: MEmotion; s: number; seed: number; acc?: MAcc; noseRed?: number; eyeGlow?: number; blink?: boolean; blob?: number; floor?: number };
export type Item =
  | { k: "sock"; p: V3; yaw: number; tilt: number; c: string; striped?: boolean; s?: number }
  | { k: "drawing"; p: V3; kind: "cat" | "pickle"; rot: V3; s?: number }
  | { k: "tissue"; p: V3; yaw: number; note?: boolean; s?: number }
  | { k: "puff"; p: V3; dir: V3; u: number; s?: number }
  | { k: "stars"; p: V3; op: number }
  | { k: "bubble"; p: V3 }
  | { k: "heart"; p: V3; s: number; c?: string }
  | { k: "tablet"; p: V3; yaw: number; tilt: number }
  | { k: "tray"; p: V3; yaw: number }
  | { k: "wig"; p: V3; rot: V3 }
  | { k: "string"; a: V3; b: V3 }
  | { k: "truck"; p: V3; wheel: number }
  | { k: "box"; p: V3; s?: V3; yaw?: number }
  | { k: "crayon"; p: V3; c: string; yaw: number }
  | { k: "fur"; p: V3; s: number; c: string }
  | { k: "blob"; p: V3; sx: number; sz: number; op: number };
export type SetName = "room" | "club" | "street";
export type Room = { night: boolean; glow: number; lamp: number; bounce: number; blanket: Blanket; shake: number; lift: number; drawer: number; crosses: number; under: boolean };
export type Stage = { set: SetName; room: Room; hums: Hum[]; mons: Mon[]; items: Item[]; id: string };

// ------------------------------------------------------------------ helpers
const PI = Math.PI;
const wave = (t: number, f = 2.4) => Math.sin(t * PI * 2 * f);
export const yawOf = (dx: number, dz: number) => Math.atan2(dx, dz);
const shotOf = (t: number) => {
  let r: (typeof SHOTS)[number] = SHOTS[0];
  for (const s of SHOTS) if (t >= s.t - 1e-6) r = s;
  return r;
};
const hum = (key: string, look: Look, s: number, pose: Pose, emotion: Emotion, seed: number, o: Partial<Hum> = {}): Hum => ({ key, look, s, pose, emotion, seed, ...o });
const mon = (key: string, look: MonsterLook, s: number, pose: MPose, emotion: MEmotion, seed: number, o: Partial<Mon> = {}): Mon => ({ key, look, s, pose, emotion, seed, ...o });
const mp = (x: number, z: number, yaw: number, o: Partial<MPose> = {}): MPose => ({ x, y: 0, z, yaw, armL: 0.15, armR: 0.15, outL: 0.25, outR: 0.25, ...o });
/** turn a human's head toward a point */
const lookAt = (p: Pose, s: number, q: V3, k = 1): Pose => {
  const f = facePoint(p, s);
  let d = yawOf(q[0] - f[0], q[2] - f[2]) - p.yaw;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  const pitch = -Math.atan2(q[1] - f[1], Math.hypot(q[0] - f[0], q[2] - f[2]));
  return { ...p, headYaw: lerp(p.headYaw, clamp(d, -1.1, 1.1), k), headPitch: lerp(p.headPitch, clamp(pitch * 0.8, -0.5, 0.5), k) };
};

// ------------------------------------------------------------------ the sneeze
/** a sneeze at t0: wind-up (0.8 s: head back, "ah... ah..."), the CHOO (a snap forward), the puff cloud */
export const sneeze = (t: number, t0: number, wind = 0.8) => {
  const a = ss(t0 - wind, t0, t);
  const after = t - t0;
  const inC = after >= 0 && after < 0.45;
  const pitch = after < 0 ? -0.28 * a + 0.04 * Math.sin(t * 22) * a : 0.32 * Math.exp(-after * 5) * Math.cos(after * 9);
  const emotion: MEmotion = after < 0 ? (a > 0.05 ? "wind" : "happy") : inC ? "sneeze" : "happy";
  return { pitch, emotion, puff: after >= 0 ? Math.exp(-after * 3) : 0.15 * a, noseRed: Math.max(0.5 * a, after >= 0 ? Math.exp(-after * 0.8) : 0), cloud: after >= 0 ? after / 0.9 : -1, active: a > 0.02 || after >= 0 };
};
/** the bed's bounce after a sneeze at t0 */
const bounceOf = (t: number, t0: number, amp = 0.22) => (t < t0 ? 0 : amp * Math.exp(-(t - t0) * 4) * Math.abs(Math.sin((t - t0) * 11)));

// ------------------------------------------------------------------ Lily's poses
const LS = SC.lily;
const SIT_Y = ((SPEC.shoe.d * U) / 2 + 0.004) * LS;
const TOP = BED.top;
/** lying on her back in bed, head on the pillow (yaw 0: head toward the headboard at -z) */
const lieBed = (o: Partial<Pose> = {}): Pose => ({ ...base(BED.cx, -1.05, 0, LS, {}, SINK), y: TOP + 0.14, pitch: -PI / 2, armL: 0.1, armR: 0.1, outL: 0.25, outR: 0.25, ...o });
/** sitting up in bed, legs forward under the blanket */
const sitBed = (o: Partial<Pose> = {}, z = -1.38): Pose => ({ ...base(BED.cx, z, 0, LS), y: TOP + SIT_Y, legL: PI / 2, legR: PI / 2, armL: 0.5, armR: 0.5, outL: 0.12, outR: 0.12, ...o });
/** standing on the bed */
const standBed = (x: number, z: number, yaw: number, o: Partial<Pose> = {}): Pose => ({ ...base(x, z, yaw, LS), y: (L - SINK) * LS + TOP, ...o });
/** a big laugh layered on any pose */
const laughL = (p: Pose, t: number, k = 1): Pose => ({ ...p, bob: (p.bob ?? 0) - 0.02 * k * Math.abs(Math.sin(t * PI * 2 * 3.5)), headPitch: p.headPitch - 0.18 * k + 0.08 * k * Math.sin(t * PI * 2 * 3.5), sway: (p.sway ?? 0) + 0.05 * k * Math.sin(t * PI * 2 * 1.7) });
const lily = (pose: Pose, emotion: Emotion, o: Partial<Hum> = {}, night = true) => hum("lily", night ? LILY_PJ : LILY, LS, pose, emotion, 3, o);

// ------------------------------------------------------------------ Bo's poses
const BO_UNDER: V3 = [-1.36, 0, -0.9];
/** Bo under the bed, squashed, facing out of the open side (+x) */
const boUnder = (t: number, o: Partial<MPose> = {}, x = BO_UNDER[0], z = BO_UNDER[2]): MPose =>
  mp(x, z, PI / 2, { squash: 0.5, armL: 0.5 + 0.05 * Math.sin(t * 1.3), armR: 0.5 + 0.05 * Math.sin(t * 1.5 + 1), outL: 0.9, outR: 0.9, ...o });
const bo = (pose: MPose, emotion: MEmotion, o: Partial<Mon> = {}) => mon("bo", BO, SC.bo, pose, emotion, 7, o);
/** the monster idle layer: breathing squash, a little sway, arms never frozen */
const aliveM = (m: Mon, t: number): Mon => {
  const s = m.seed * 1.7;
  const p = m.pose;
  return { ...m, pose: { ...p, squash: (p.squash ?? 1) * (1 + 0.012 * Math.sin(t * 2.3 + s)), roll: (p.roll ?? 0) + 0.02 * Math.sin(t * 0.9 + s), armL: p.armL + 0.04 * Math.sin(t * 1.1 + s), armR: p.armR + 0.04 * Math.sin(t * 1.3 + s + 1) } };
};
/** a world point of a monster's face (nose height) */
export const monFace = (m: Mon): V3 => {
  const f = faceLocal(m.look);
  const sq = m.pose.squash ?? 1;
  const y = ((f[1] - 0.13) * sq + 0.13 + (m.pose.bob ?? 0)) * m.s + m.pose.y;
  const d = f[2] * (1 + (1 - sq) * 0.45) * m.s;
  return [m.pose.x + Math.sin(m.pose.yaw) * d, y, m.pose.z + Math.cos(m.pose.yaw) * d];
};
/** the monster's body centre */
export const monCentre = (m: Mon): V3 => {
  const sq = m.pose.squash ?? 1;
  return [m.pose.x, ((bodyC(m.look) - 0.13) * sq + 0.13) * m.s + m.pose.y, m.pose.z];
};
const noseDir = (m: Mon): V3 => [Math.sin(m.pose.yaw), 0.05, Math.cos(m.pose.yaw)];
/** apply a sneeze to Bo: emotion, pitch, fur puff, red nose; the puff cloud item */
const withSneeze = (m: Mon, t: number, t0: number, items: Item[], wind = 0.8): Mon => {
  const z = sneeze(t, t0, wind);
  if (!z.active) return m;
  const out: Mon = { ...m, emotion: z.emotion, noseRed: Math.max(m.noseRed ?? 0, z.noseRed), pose: { ...m.pose, pitch: (m.pose.pitch ?? 0) + z.pitch, puff: Math.max(m.pose.puff ?? 0, z.puff), look: [0, 0] } };
  if (z.cloud >= 0 && z.cloud < 1) {
    const f = monFace(out);
    const d = noseDir(out);
    items.push({ k: "puff", p: [f[0] + d[0] * 0.08, f[1] - 0.05, f[2] + d[2] * 0.08], dir: d, u: z.cloud, s: 1.1 });
  }
  return out;
};

// ------------------------------------------------------------------ the other monsters at the club
const SEAT = 0.32;
const seatPose = (p: V3, yaw: number, o: Partial<MPose> = {}): MPose => mp(p[0], p[2], yaw, { y: SEAT - 0.11, legL: 1.1, legR: 1.1, ...o });
const toward = (a: V3, b: V3) => yawOf(b[0] - a[0], b[2] - a[2]);
const S = CLUB.seats;
const grizzle = (pose: MPose, e: MEmotion, o: Partial<Mon> = {}) => mon("grizzle", GRIZZLE, SC.grizzle, pose, e, 11, o);
const pip = (pose: MPose, e: MEmotion, o: Partial<Mon> = {}) => mon("pip", PIP, SC.pip, pose, e, 13, o);
const fuzz = (pose: MPose, e: MEmotion, o: Partial<Mon> = {}) => mon("fuzz", FUZZ, SC.fuzz, pose, e, 17, o);
const moe = (pose: MPose, e: MEmotion, o: Partial<Mon> = {}) => mon("moe", MOE, SC.moe, pose, e, 19, o);
const T0: V3 = CLUB.table;
/** the club at rest: everyone on their block, facing the table (chatting) */
const clubBase = (t: number): Mon[] => [
  grizzle(seatPose(S.grizzle, toward(S.grizzle, T0) + 0.2 * Math.sin(t * 0.7), { armR: 0.6 + 0.3 * Math.max(0, Math.sin(t * 2.2)) }), "grin"),
  pip(seatPose(S.pip, toward(S.pip, T0) - 0.2, {}), "smug"),
  fuzz(seatPose(S.fuzz, toward(S.fuzz, T0), { armL: 0.5 + 0.4 * Math.max(0, Math.sin(t * 2.6 + 1)) }), "happy"),
  moe(seatPose(S.moe, toward(S.moe, T0) + 0.3, {}), "grin"),
];
const swap = (ms: Mon[], key: string, f: (m: Mon) => Mon) => ms.map((m) => (m.key === key ? f(m) : m));
/** knee-slapping tease */
const teaseP = (p: MPose, t: number, ph = 0): MPose => ({ ...p, armL: 0.9 + 0.5 * Math.abs(Math.sin(t * 9 + ph)), armR: 0.9 + 0.5 * Math.abs(Math.sin(t * 9 + ph + 1)), outL: 0.3, outR: 0.3, pitch: 0.12 * Math.abs(Math.sin(t * 4.5 + ph)), bob: 0.02 * Math.abs(Math.sin(t * 9 + ph)) });
const pointAt = (p: MPose, target: V3, side: "L" | "R" = "R"): MPose => {
  const yaw = toward([p.x, 0, p.z], target);
  return { ...p, yaw, ...(side === "R" ? { armR: 1.6, outR: 0.1 } : { armL: 1.6, outL: 0.1 }) };
};

// ------------------------------------------------------------------ room presets
const ROOMS: Record<string, Room> = {
  night: { night: true, glow: 0.7, lamp: 0.55, bounce: 0, blanket: "lie", shake: 0, lift: 0, drawer: 0, crosses: 0, under: true },
  day: { night: false, glow: 0, lamp: 0, bounce: 0, blanket: "fold", shake: 0, lift: 0, drawer: 0, crosses: 0, under: true },
  quiet: { night: true, glow: 0.12, lamp: 0.12, bounce: 0, blanket: "lie", shake: 0, lift: 0, drawer: 0, crosses: 6, under: true },
  warm: { night: true, glow: 1, lamp: 1, bounce: 0, blanket: "fold", shake: 0, lift: 0, drawer: 0, crosses: 7, under: true },
};
const roomOf = (scene: string, o: Partial<Room> = {}): Room => ({ ...(ROOMS[scene] ?? ROOMS.night), ...o });

// ------------------------------------------------------------------ the shots
type Ctx = { t: number; u: number; id: string; end: number; scene: string };
type Built = { set: SetName; room?: Partial<Room>; hums: Hum[]; mons: Mon[]; items: Item[] };
const pillowP: V3 = [BED.cx + 0.27, TOP + 0.18, -1.7];
const pillowQ: V3 = [BED.cx - 0.28, TOP + 0.18, -1.7];

const SHOT: Record<string, (c: Ctx) => Built> = {};
const room = (f: (c: Ctx, items: Item[]) => { hums?: Hum[]; mons?: Mon[]; room?: Partial<Room> }) => (c: Ctx): Built => {
  const items: Item[] = [];
  const r = f(c, items);
  return { set: "room", room: r.room, hums: r.hums ?? [], mons: r.mons ?? [], items };
};
const club = (f: (c: Ctx, items: Item[]) => { mons: Mon[] }) => (c: Ctx): Built => {
  const items: Item[] = [];
  const r = f(c, items);
  return { set: "club", hums: [], mons: r.mons, items };
};

// ---- A: the rule, night
SHOT.A01 = room(({ t, u }) => ({
  hums: [lily(lieBed({ headYaw: 0.1 }), "sleep")],
  mons: [bo(boUnder(t, { look: [0.3 * Math.sin(t * 1.5), 0] }), "happy", { eyeGlow: 1, blink: u < 0.55 })],
}));
SHOT.A02 = room(({ t, u }) => ({
  hums: [lily(lieBed(), "sleep")],
  mons: [bo(boUnder(t, { look: [lerp(-0.6, 0.6, ss(0.2, 0.8, u / 1.1)), 0.1] }), "happy", { eyeGlow: 1, blink: u > 0.5 && u < 0.62 })],
}));
SHOT.A03 = room(({ t, u }) => {
  const g = ss(0.35, 0.8, u);
  return {
    hums: [lily(laughL(sitBed({ armL: 0.9, armR: 1.0, outL: 0.1, outR: 0.05, headPitch: 0.25 - 0.2 * g }), t, g), g > 0.5 ? "joy" : "happy", { held: { side: "R", kind: "flashlight", tilt: [0.5, 0] }, held2: { side: "L", kind: "book", tilt: [-0.9, 0] } })],
    mons: [bo(boUnder(t), "happy", { eyeGlow: 0.6 })],
  };
});
SHOT.A04 = room(({ t, u }, items) => {
  const w = ss(0.1, 1.2, u);
  const m = bo(boUnder(t, { pitch: -0.12 * w + 0.03 * Math.sin(t * 30) * w, puff: 0.15 * w }), w > 0.3 ? "wind" : "shy", { noseRed: 0.5 * w, eyeGlow: 0.4 });
  return { room: { bounce: 0.01 * Math.abs(Math.sin(t * 20)) }, hums: [lily(laughL(sitBed({ armL: 0.9, armR: 1.0, headPitch: 0.1 }), t), "joy", { held: { side: "R", kind: "flashlight", tilt: [0.5, 0] }, held2: { side: "L", kind: "book", tilt: [-0.9, 0] } })], mons: [m] };
});
SHOT.A05 = room(({ t }, items) => {
  const t0 = W(3, "sneeze.");
  return {
    room: { bounce: bounceOf(t, t0, 0.14) },
    hums: [lily(laughL(sitBed({ armL: 0.9, armR: 1.0 }), t), "joy", { held: { side: "R", kind: "flashlight", tilt: [0.5, 0] }, held2: { side: "L", kind: "book", tilt: [-0.9, 0] } })],
    mons: [withSneeze(bo(boUnder(t), "happy", { eyeGlow: 0.3 }), t, t0, items, 0.7)],
  };
});
SHOT.A06 = room(({ t, u }, items) => {
  const sc = Math.sin(t * PI * 2 * 3.2);
  for (let i = 0; i < 5; i++) {
    const ph = (u * 1.2 + i * 0.2) % 1;
    items.push({ k: "fur", p: [BO_UNDER[0] + 0.45 + 0.4 * ph, 0.28 + 0.25 * Math.sin(i * 2 + ph * 3) * ph, BO_UNDER[2] + (hash(i) - 0.5) * 0.7], s: 0.03 * (1 - ph), c: "#8a5ae0" });
  }
  return {
    hums: [lily(laughL(sitBed({ armL: 0.9, armR: 1.0 }), t), "joy", { held: { side: "R", kind: "flashlight", tilt: [0.5, 0] }, held2: { side: "L", kind: "book", tilt: [-0.9, 0] } })],
    mons: [bo(boUnder(t, { armL: 1.2 + 0.8 * sc, armR: 1.2 - 0.8 * sc, outL: 0.6 + 0.4 * sc, outR: 0.6 - 0.4 * sc, roll: 0.12 * sc, puff: 0.5 + 0.3 * Math.abs(sc) }), "itch", { noseRed: 0.6 })],
  };
});
SHOT.A07 = room(({ t, u }) => ({
  hums: [lily(lieBed(), "sleep")],
  mons: [bo(boUnder(t, { x: BO_UNDER[0] + 0.12, armR: 2.2 + 0.25 * wave(t, 2.2), outR: 0.6 }), u < 0.35 ? "shy" : "happy", { noseRed: 0.4 })],
}));
SHOT.A08 = room(({ t }) => ({
  hums: [lily(laughL(sitBed({ armL: 0.9, armR: 1.0, headYaw: -0.3 }), t, 1.2), "joy", { held: { side: "R", kind: "flashlight", tilt: [0.5, 0] }, held2: { side: "L", kind: "book", tilt: [-0.9, 0] } })],
  mons: [bo(boUnder(t), "happy")],
}));
// ---- A09, B: the giggliest kid (morning)
SHOT.A09 = room(({ t, u }) => {
  const ph = (u / 0.48) % 1;
  const jump = 0.32 * Math.sin(PI * ph);
  return {
    hums: [lily(laughL(standBed(BED.cx, -0.95, 0.5, { y: (L - SINK) * LS + TOP + jump, armL: 2.6 + 0.3 * Math.sin(ph * PI * 2), armR: 2.6 - 0.3 * Math.sin(ph * PI * 2), outL: 0.5, outR: 0.5, legL: 0.25 * Math.sin(ph * PI), legR: -0.25 * Math.sin(ph * PI) }), t), "joy", {}, false)],
    room: { bounce: 0.03 * (1 - Math.sin(PI * ph)) },
    mons: [bo(boUnder(t, { squash: 0.5 - 0.06 * (1 - Math.sin(PI * ph)) }), "itch", { noseRed: 0.4 })],
  };
});
const belly = (t: number): Pose => ({ ...base(BED.cx, -1.32, 0, LS), y: TOP + 0.12, pitch: PI / 2 - 0.05, headPitch: -1.15, armL: 2.6, armR: 2.6, outL: 0.35, outR: 0.35, legL: -0.5 - 0.35 * Math.sin(t * 7), legR: -0.5 + 0.35 * Math.sin(t * 7) });
SHOT.B01 = room(({ t }, items) => {
  items.push({ k: "tablet", p: [BED.cx, TOP + 0.005, -0.42], yaw: PI, tilt: 1.15 });
  const p = belly(t);
  return { hums: [lily({ ...p, bob: -0.015 * Math.abs(Math.sin(t * 20)) }, "joy", {}, false)], mons: [bo(boUnder(t), "wind", { noseRed: 0.5 })] };
});
SHOT.B02 = room(({ t }, items) => {
  items.push({ k: "tray", p: [BED.cx, TOP, -0.92], yaw: 0 });
  return { hums: [lily(laughL(sitBed({ armL: 0.75, armR: 0.75, outL: 0.25, outR: 0.25, headPitch: 0.25 }), t, 1.2), "joy", {}, false)], mons: [bo(boUnder(t), "wind", { noseRed: 0.6 })] };
});
SHOT.B03 = room(({ t }) => {
  const k = Math.sin(t * PI * 2 * 2.6);
  return { hums: [lily(laughL(sitBed({ legL: PI / 2 + 0.16 * k, legR: PI / 2 - 0.16 * k, armL: 0.3, armR: 0.3, outL: 0.35, outR: 0.35, pitch: -0.12, headPitch: 0.1 }), t, 1.3), "joy", {}, false)], mons: [bo(boUnder(t), "wind", { noseRed: 0.7 })] };
});
SHOT.B04 = room(({ t }, items) => {
  const t0 = W(6, "sneeze") + 0.05;
  return { hums: [lily(laughL(sitBed({ armL: 0.4, armR: 0.4, outL: 0.3, outR: 0.3 }), t), "joy", {}, false)], mons: [withSneeze(bo(boUnder(t), "happy"), t, t0, items, 1.3)] };
});
SHOT.B05 = room(({ t }, items) => {
  const t0 = W(6, "sneeze") + 0.05;
  const b = bounceOf(t, t0, 0.26);
  const lp = sitBed({ armL: 0.4 + 2 * b, armR: 0.4 + 2 * b, outL: 0.3 + 2 * b, outR: 0.3 + 2 * b });
  return {
    room: { bounce: b },
    hums: [lily(laughL({ ...lp, y: lp.y + b * 1.5 }, t, 1.2), "joy", {}, false)],
    mons: [withSneeze(bo(boUnder(t), "happy"), t, t0, items, 1.3)],
  };
});
SHOT.B06 = room(({ t, u }) => ({
  hums: [lily(sitBed({ armL: 0.4, armR: 0.4 }), "happy", {}, false)],
  mons: [bo(boUnder(t, { x: BO_UNDER[0] + 0.1, armL: 0.4, armR: 0.4 }), u < 0.7 ? "happy" : "shock", { acc: { earmuffs: true }, noseRed: 0.3 })],
}));
SHOT.B07 = room(({ t, u }) => ({
  hums: [lily(sitBed({ armL: 0.4, armR: 0.4 }), "happy", {}, false)],
  mons: [bo(boUnder(t, { x: BO_UNDER[0] + 0.1, look: [Math.sin(u * 5) * 0.8, 0] }), "determined", { acc: { mask: true }, noseRed: 0.3 })],
}));
/** Bo crammed in the sock drawer (the drawer pulled out 0.36 m): small and squashed, his body inside the drawer box,
 * only his face and head peeking over the drawer's front edge */
const DRAWER_OPEN = 0.36;
const BO_DRAWER_S = 0.5;
const boDrawer = (t: number, lift = 0): MPose => {
  const floor = DRESSER.drawerY - DRESSER.drawerH / 2 + 0.02;
  return mp(DRESSER.x, DRESSER.z + DRESSER.d / 2 - 0.2 + DRAWER_OPEN - 0.04, 0, { y: floor + 0.19 + lift, squash: 0.5, armL: 0.3, armR: 0.3, outL: 0.2, outR: 0.2, bob: 0.006 * Math.sin(t * 2) });
};
/** socks draped over Bo's head (fly = 0..1: they fly off) */
const drawerSocks = (items: Item[], m: Mon, fly = 0) => {
  const c = monCentre(m);
  const top = c[1] + ((m.look.h ?? 0.78) / 2) * (m.pose.squash ?? 1) * m.s;
  const cs = ["#ff8ab0", "#7ad0ff", "#ffd23a"];
  [[-0.1, 0.02, 0.4], [0.07, -0.04, -0.5], [0.16, 0.05, 1.2]].forEach(([dx, dz, yaw], i) => {
    const a = i * 2.1;
    items.push({ k: "sock", p: [c[0] + dx + fly * (dx * 4 + 0.3 * Math.cos(a)), top - 0.01 + fly * (0.9 + 0.5 * hash(i)) - 4.9 * Math.max(0, fly - 0.5) ** 2, c[2] + dz + fly * 0.4 * Math.sin(a)], yaw: yaw + fly * 6, tilt: PI / 2 + fly * 8 * (i - 1), c: cs[i], striped: i === 1, s: 0.75 });
  });
};
SHOT.B08 = room(({ t }, items) => {
  const m = bo(boDrawer(t), "sleep", { s: BO_DRAWER_S, noseRed: 0.3, blob: 0 });
  drawerSocks(items, m);
  return { room: { drawer: DRAWER_OPEN }, hums: [lily(sitBed({ armL: 0.4, armR: 0.4 }), "happy", {}, false)], mons: [m] };
});
SHOT.B09 = room(({ t, u }, items) => {
  const t0 = ST("B09") + 0.25;
  const up = t > t0 ? 0.28 * Math.sin(Math.min(PI, (t - t0) * 6)) : 0;
  let m = bo({ ...boDrawer(t, up), squash: 0.5 + 0.3 * clamp((t - t0) * 6) }, "happy", { s: BO_DRAWER_S, blob: 0 });
  m = withSneeze(m, t, t0, items, 0.25);
  drawerSocks(items, bo(boDrawer(t), "happy", { s: BO_DRAWER_S }), clamp((t - t0) * 1.6));
  return { room: { drawer: DRAWER_OPEN }, hums: [lily(laughL(sitBed({ armL: 0.5, armR: 0.5 }), t), "joy", {}, false)], mons: [m] };
});

// ---- C: the Underbed
SHOT.C01 = club(({ t }) => ({ mons: clubBase(t) }));
SHOT.C01b = club(({ t, u, end }) => {
  const st = ST("C01b");
  const k = ss(0, end - st, u);
  const from: V3 = [3.8, 0, 1.3], to: V3 = [S.bo[0] + 0.45, 0, S.bo[2] + 0.1];
  const x = lerp(from[0], to[0], k), z = lerp(from[2], to[2], k);
  const step = Math.sin(t * PI * 2 * 2.2);
  const ms = clubBase(t).map((m) => (m.key === "grizzle" || m.key === "fuzz" ? { ...m, pose: { ...m.pose, yaw: toward([m.pose.x, 0, m.pose.z], [x, 0, z]), armR: 2.4 + 0.3 * wave(t, 2), outR: 0.5 } } : m));
  return { mons: [...ms, bo(mp(x, z, toward(from, to), { legL: 0.45 * step, legR: -0.45 * step, bob: 0.02 * Math.abs(step), armL: 0.3 - 0.3 * step, armR: 0.3 + 0.3 * step }), "shy", { noseRed: 0.7 })] };
});
SHOT.C02 = club(({ t, u }) => ({ mons: swap(clubBase(t), "grizzle", (m) => ({ ...m, emotion: "grin", pose: { ...m.pose, yaw: toward(S.grizzle, [0.6, 0, 2.2]), armR: 2.3 + 0.2 * wave(t, 1.5), outR: 0.7, armL: 0.6 } })) }));
SHOT.C03 = club(({ t }, items) => {
  const ms = swap(clubBase(t), "grizzle", (m) => ({ ...m, emotion: "sleep", acc: { nightcap: true }, pose: { ...m.pose, pitch: 0.18 + 0.03 * Math.sin(t * 2.2), roll: 0.12, armL: 0.2, armR: 0.2, outL: 0.1, outR: 0.1, squash: 0.96 + 0.03 * Math.sin(t * 2.2) } }));
  const g = ms.find((m) => m.key === "grizzle")!;
  items.push({ k: "bubble", p: monFace(g) });
  return { mons: ms };
});
SHOT.C04 = club(({ t }) => ({ mons: swap(clubBase(t), "pip", (m) => ({ ...m, emotion: "smug", pose: { ...m.pose, yaw: toward(S.pip, [0.2, 0, 2.4]), armL: 2.5 + 0.25 * wave(t, 2.6), outL: 0.6 } })) }));
SHOT.C05 = club(({ t }) => ({ mons: swap(clubBase(t), "pip", (m) => ({ ...m, emotion: "smug", pose: { ...m.pose, yaw: toward(S.pip, [0.4, 0, 2.2]), armR: 2.35 + 0.06 * Math.sin(t * 14), outR: 0.95, armL: 0.3, pitch: -0.12 } })) }));
const boSeat = (t: number, o: Partial<MPose> = {}) => seatPose(S.bo, toward(S.bo, T0) + 0.6, { pitch: 0.15, armL: 0.6, armR: 0.9 + 0.1 * Math.sin(t * 2), outL: 0.2, outR: 0.3, ...o });
SHOT.C06 = club(({ t }) => ({ mons: [...clubBase(t), bo(boSeat(t), "sad", { noseRed: 1, acc: { tissue: "R" } })] }));
SHOT.C07 = club(({ t, u }) => {
  const k = ss(0, 0.4, u);
  const ms = clubBase(t).map((m) => (m.key === "grizzle" || m.key === "pip" || m.key === "moe" ? { ...m, emotion: "tease" as MEmotion, pose: k > 0.5 ? pointAt(m.pose, S.bo, m.key === "pip" ? "L" : "R") : m.pose } : m));
  return { mons: [...ms, bo(boSeat(t), "shock", { noseRed: 1, acc: { tissue: "R" } })] };
});
SHOT.C08 = club(({ t }) => {
  const ms = clubBase(t).map((m, i) => (m.key === "grizzle" || m.key === "pip" ? { ...m, emotion: "tease" as MEmotion, pose: teaseP({ ...m.pose, yaw: toward([m.pose.x, 0, m.pose.z], S.bo) }, t, i) } : { ...m, emotion: "grin" as MEmotion, pose: { ...m.pose, yaw: toward([m.pose.x, 0, m.pose.z], S.bo) } }));
  return { mons: [...ms, bo(boSeat(t), "sad", { noseRed: 1, acc: { tissue: "R" } })] };
});
SHOT.C09 = club(({ t }, items) => {
  const m = bo(boSeat(t, { armL: 1.65, armR: 1.65, outL: 0.05, outR: 0.05, pitch: 0.25 }), "sad", { noseRed: 1 });
  const f = monFace(m);
  const d = noseDir(m);
  items.push({ k: "sock", p: [f[0] + d[0] * 0.2, f[1] - 0.1, f[2] + d[2] * 0.2], yaw: m.pose.yaw + PI / 2, tilt: 0.1, c: "#ffd23a", striped: true });
  const ms = clubBase(t).map((x, i) => (x.key === "grizzle" || x.key === "pip" ? { ...x, emotion: "tease" as MEmotion, pose: teaseP({ ...x.pose, yaw: toward([x.pose.x, 0, x.pose.z], S.bo) }, t, i) } : x));
  return { mons: [...ms, m] };
});
SHOT.C10 = room(({ t }) => ({ room: { blanket: "lie" }, hums: [lily(laughL(lieBed(), t, 0.6), "joy")], mons: [bo(boUnder(t, { look: [0, 0.9], pitch: -0.08, armL: 0.2, armR: 0.2 }), "sad", { noseRed: 0.8 })] }));

// ---- D: the moving truck (street, morning)
const STREET_Z = (STREET.walk[0] + STREET.walk[1]) / 2;
const LILY_ST: V3 = [1.6, 0, STREET_Z - 0.15];
const ROSIE_ST: V3 = [2.12, 0, STREET_Z - 0.15];
const TRUCK_STOP = 2.4;
const truckX = (t: number) => {
  const a = ST("D01"), arrive = a + 1.6;
  const leave = W(17, "waved") - 0.1;
  if (t < arrive) return TRUCK_STOP - 9 * (1 - ss(a - 0.4, arrive, t)) ** 1.6;
  if (t < leave) return TRUCK_STOP;
  return TRUCK_STOP + 1.4 * (t - leave) ** 2 + 0.8 * (t - leave);
};
const street = (f: (c: Ctx, items: Item[]) => Hum[]) => (c: Ctx): Built => {
  const items: Item[] = [];
  const hums = f(c, items);
  const x = truckX(c.t);
  items.push({ k: "truck", p: [x, 0, STREET.truckZ], wheel: x * 2.4 });
  return { set: "street", hums, mons: [], items };
};
const dadAt = (t: number): Hum => {
  // Rosie's dad carries boxes from the house to the truck's back (2.4 s loop)
  const ph = (t % 2.4) / 2.4;
  const back = TRUCK_STOP - 3.0;
  const a: V3 = [STREET.rosie[0] - 0.6, 0, 1.6], b: V3 = [back, 0, STREET.walk[1] + 0.2];
  const go = ph < 0.5;
  const k = go ? ph / 0.5 : (1 - ph) / 0.5;
  const x = lerp(a[0], b[0], k), z = lerp(a[2], b[2], k);
  const yaw = go ? toward(a, b) : toward(b, a);
  const p = walk(x, z, yaw, t, 0, 0, SC.dad, { armL: go ? 1.3 : 0.1, armR: go ? 1.3 : 0.1, outL: 0.25, outR: 0.25 });
  return hum("dad", ROSIE_DAD, SC.dad, { ...p, x, z }, "smile", 23, go ? { held: { side: "R", kind: "box", tilt: [0, 0] } } : {});
};
const hugP = (x: number, z: number, yaw: number, s: number, t: number): Pose => base(x, z, yaw, s, { armL: 1.45, armR: 1.45, outL: -0.35, outR: -0.35, sway: 0.08 * Math.sin(t * 2.5), headYaw: 0.25 });
SHOT.D01 = street(({ t }) => [
  hum("lily", LILY, LS, lookAt(base(LILY_ST[0], LILY_ST[2], toward(LILY_ST, [truckX(t), 0, STREET.truckZ]), LS), LS, [truckX(t), 1.2, STREET.truckZ]), "curious", 3),
  hum("rosie", ROSIE, SC.rosie, base(ROSIE_ST[0], ROSIE_ST[2], -PI / 2 + 0.3, SC.rosie, { armL: 0.3, armR: 0.2 }), "sad", 5),
]);
SHOT.D02 = street(({ t }) => [
  hum("lily", LILY, LS, { ...hugP(LILY_ST[0] + 0.12, LILY_ST[2], PI / 2, LS, t), headYaw: -0.85 }, "sad", 3, { blink: true }),
  hum("rosie", ROSIE, SC.rosie, { ...hugP(ROSIE_ST[0] - 0.12, ROSIE_ST[2], -PI / 2, SC.rosie, t + 1), headYaw: 0.85 }, "sad", 5),
]);
SHOT.D03 = street(({ t }) => [hum("lily", LILY, LS, base(LILY_ST[0], LILY_ST[2], PI / 2 + 0.4, LS), "sad", 3), hum("rosie", ROSIE, SC.rosie, base(ROSIE_ST[0], ROSIE_ST[2], -PI / 2 - 0.2, SC.rosie), "sad", 5), dadAt(t)]);
SHOT.D04 = street(({ t }) => {
  const x = truckX(t);
  const rp = base(x + 2.0, STREET.truckZ - 0.85, PI, SC.rosie, { y: 0.78, armR: 2.6 + 0.3 * wave(t, 2), outR: 0.4 });
  return [
    hum("lily", LILY, LS, lookAt(base(LILY_ST[0] + 0.3, LILY_ST[2], toward(LILY_ST, [x, 0, STREET.truckZ]) * 0.6 + PI * 0.4, LS, { armR: 2.7 + 0.35 * wave(t, 1.8), outR: 0.45 }), LS, [x + 2, 1.4, STREET.truckZ]), "sad", 3),
    hum("rosie", ROSIE, SC.rosie, rp, "cry", 5, { blob: 0 }),
  ];
});
SHOT.D05 = street(({ t, u }) => [hum("lily", LILY, LS, base(LILY_ST[0] + 0.3, LILY_ST[2], PI * 0.75, LS, { armR: lerp(1.2, 0.1, ss(0, 0.6, u)), headPitch: lerp(0, 0.25, ss(0.3, 1.0, u)) }), "sad", 3)]);

// ---- E, F: the quiet week (night, cold)
SHOT.E01 = room(({ t }) => ({ hums: [lily(lieBed({ headYaw: 0.5, headPitch: 0 }), "sad")], mons: [bo(boUnder(t), "happy")] }));
SHOT.E02 = room(({ t, u }) => ({ hums: [lily(lieBed({ headYaw: 0.5 }), "sad")], mons: [bo(boUnder(t, { look: [0, 0.8], pitch: -0.18 * ss(0, 0.4, u) }), u < 0.6 ? "wind" : "shock", { noseRed: 0.2 })] }));
SHOT.E03 = room(({ t }) => ({ hums: [lily(lieBed({ headYaw: 0.5 }), "sad")], mons: [bo(boUnder(t), "sad")] }));
SHOT.E04 = room(({ u, end, t }) => ({ room: { crosses: 2 + Math.floor(5 * ss(0.05, end - ST("E04") - 0.1, u)) }, hums: [lily(lieBed(), "sad")], mons: [bo(boUnder(t), "sad")] }));
SHOT.E05 = room(({ t }) => ({ hums: [lily(lieBed(), "sad")], mons: [bo(boUnder(t, { squash: 0.44, pitch: 0.28, armL: 1.25, armR: 1.25, outL: 0.25, outR: 0.25, look: [0.3, -0.2] }), "sad")] }));
SHOT.E06 = room(({ t, u }) => ({ hums: [lily(lieBed(), "sad")], mons: [bo(boUnder(t, { roll: -0.5 * ss(0, 0.8, u), look: [0, 0.9], armL: 0.4, armR: 0.4 }), "sad")] }));
SHOT.E07 = room(({ t, u }) => ({ hums: [lily(lieBed(), "sad")], mons: [bo(boUnder(t, { armL: 2.6, armR: 2.6, outL: 0.5, outR: 0.5, pitch: -0.12 }), u < 0.6 ? "happy" : "sad")] }));
SHOT.E08 = room(({ t }) => ({ hums: [lily(lieBed(), "sad")], mons: [bo(boUnder(t, { look: [-0.3, -0.3] }), "sad")] }));
SHOT.F01 = room(({ t, u }) => ({ hums: [lily(lieBed(), "sad")], mons: [bo(boUnder(t, { puff: 0.4 * ss(0, 0.3, u), squash: 0.5 + 0.04 * ss(0, 0.3, u), look: [0, 0.4] }), "shock")] }));
SHOT.F02 = room(({ t }) => ({ room: { blanket: "over", shake: Math.sin(t * 16) }, hums: [], mons: [bo(boUnder(t, { look: [0, 1], pitch: -0.15 }), "shock")] }));
SHOT.F03 = room(({ t }) => ({ room: { blanket: "over", shake: Math.sin(t * 16) }, hums: [], mons: [bo(boUnder(t, { look: [0, 1] }), "sad")] }));
SHOT.F04 = room(({ t }) => ({ room: { blanket: "over", shake: Math.sin(t * 16) }, hums: [], mons: [bo(boUnder(t, { look: [0, 0.2] }), "shock")] }));
SHOT.F05 = room(({ t }) => ({ room: { blanket: "over", shake: Math.sin(t * 16) }, hums: [], mons: [bo(boUnder(t, { armL: 1.3, armR: 1.3, outL: -0.2, outR: -0.2 }), "cry", { acc: {} })] }));
SHOT.F06 = room(({ t }) => ({ room: { blanket: "over", shake: Math.sin(t * 16) * 0.6 }, hums: [], mons: [bo(boUnder(t, { armR: 2.9, outR: 0.2, look: [0, 1] }), "sad")] }));
SHOT.F07 = room(({ t }) => ({ room: { blanket: "over", shake: Math.sin(t * 16) * 0.6 }, hums: [], mons: [bo(boUnder(t, { look: [0, 0.6] }), "shy")] }));

// ---- G: the plan (quiet night)
SHOT.G01 = room(({ t, u, end }) => {
  const k = ss(0, end - ST("G01") - 0.2, u);
  return { room: { blanket: "over" }, hums: [], mons: [bo(boUnder(t, { x: lerp(BO_UNDER[0], -0.3, k), squash: lerp(0.5, 1.0, ss(0.55, 1, k)), legL: 0.5 * Math.sin(t * 12), legR: -0.5 * Math.sin(t * 12), armL: 1.4 + 0.5 * Math.sin(t * 12), armR: 1.4 - 0.5 * Math.sin(t * 12) }), "determined")] };
});
const BO_RUG: V3 = [0.15, 0, -0.55];
SHOT.G02 = room(({ t, u }) => ({ room: { blanket: "over" }, hums: [], mons: [bo(mp(BO_RUG[0], BO_RUG[2], 0.5, { armR: lerp(0.3, 2.9, pop(u / 0.6)), outR: 0.3, armL: 0.3, puff: 0.2 }), "determined")] }));
SHOT.G03 = room(({ t, u, end }) => {
  const k = u / Math.max(0.1, end - ST("G03"));
  const ph = Math.sin(t * PI * 2 * 1.4);
  return { room: { blanket: "lie" }, hums: [lily(lieBed(), "sleep")], mons: [bo(mp(lerp(-0.4, 0.5, k), lerp(-1.05, -0.15, k), 0.78, { legL: 0.7 * Math.max(0, ph), legR: 0.7 * Math.max(0, -ph), bob: 0.05 * Math.abs(ph), armL: 1.2, armR: 1.2, outL: 0.6, outR: 0.6, look: [0.6, 0.3] }), "shy")] };
});
SHOT.G04 = room(({ t }, items) => {
  items.push({ k: "drawing", p: [0.05, 0.003, -0.25], kind: "cat", rot: [-PI / 2, 0, 0.3] });
  items.push({ k: "drawing", p: [0.35, 0.003, -0.3], kind: "pickle", rot: [-PI / 2, 0, -0.2] });
  items.push({ k: "crayon", p: [0.5, 0.012, -0.1], c: "#2fb05a", yaw: 1.2 });
  items.push({ k: "crayon", p: [-0.1, 0.012, -0.05], c: "#ff8a1a", yaw: 0.4 });
  return { room: { blanket: "lie" }, hums: [lily(lieBed(), "sleep")], mons: [bo(mp(0.2, -0.75, 0, { pitch: 0.35, armR: 1.1 + 0.25 * Math.sin(t * 16), outR: 0.2 + 0.1 * Math.sin(t * 11), armL: 0.6, look: [0, -0.9] }), "determined")] };
});
SHOT.G04b = room(({ t, u }, items) => {
  items.push({ k: "drawing", p: pillowP, kind: "cat", rot: [-PI / 2 + 0.25, 0, 0.2] });
  items.push({ k: "drawing", p: pillowQ, kind: "pickle", rot: [-PI / 2 + 0.25, 0, -0.15] });
  return { room: { blanket: "lie" }, hums: [lily(lieBed(), "sleep")], mons: [bo(mp(-0.42, -1.25, -PI / 2, { armL: 1.6, armR: 1.6 - 0.2 * Math.sin(u * 4), outL: 0.1, outR: 0.1, legL: 0.1, look: [0, 0.2] }), "shy")] };
});
SHOT.G05 = room(({ t }, items) => {
  items.push({ k: "drawing", p: pillowP, kind: "cat", rot: [-PI / 2 + 0.25, 0, 0.2] });
  items.push({ k: "drawing", p: pillowQ, kind: "pickle", rot: [-PI / 2 + 0.25, 0, -0.15] });
  return { room: { blanket: "lie" }, hums: [lily(lieBed(), "sleep")], mons: [] };
});
SHOT.G06 = SHOT.G05;
SHOT.G07 = room(({ t, u }, items) => {
  const lp = sitBed({ armL: 1.05, armR: 1.05, outL: 0.05, outR: 0.05, headPitch: 0.35 });
  const h = heldWorld(lp, "R", LS, [0, 0, 0]);
  items.push({ k: "drawing", p: [h[0] + 0.12, h[1] + 0.12, h[2] + 0.05], kind: "cat", rot: [-0.5, 0, 0], s: 1.2 });
  return { room: { blanket: "lie" }, hums: [lily(lp, u > 0.55 ? "smile" : "sad", {}, false)], mons: [bo(boUnder(t, { look: [0, 0.7] }), "shy")] };
});
const SOCKS = [
  { x: 0.5, z: -0.2, c: "#ff8ab0", st: false },
  { x: 0.9, z: -0.5, c: "#7ad0ff", st: true },
  { x: 0.2, z: -0.75, c: "#ffd23a", st: false },
];
const dancingSocks = (t: number, items: Item[], strings: boolean) => {
  SOCKS.forEach((s, i) => {
    const ph = t * PI * 2 * 1.8 + i * 2;
    const hop = 0.12 * Math.abs(Math.sin(ph));
    const p: V3 = [s.x + 0.15 * Math.sin(t * 1.4 + i), hop, s.z + 0.1 * Math.cos(t * 1.2 + i)];
    items.push({ k: "sock", p, yaw: 0.6 * Math.sin(ph / 2) + i, tilt: 0.25 * Math.sin(ph), c: s.c, striped: s.st });
    if (strings) items.push({ k: "string", a: [p[0], p[1] + 0.25, p[2]], b: [-0.9, 0.55, -0.9 + 0.2 * (i - 1)] });
  });
};
SHOT.G08 = room(({ t }, items) => {
  dancingSocks(t, items, true);
  const k = Math.sin(t * PI * 2 * 1.8);
  return { room: { blanket: "lie" }, hums: [lily(lieBed({ headYaw: 0.4 }), "sad")], mons: [bo(boUnder(t, { x: BO_UNDER[0] + 0.15, armL: 1.5 + 0.4 * k, armR: 1.5 - 0.4 * k, outL: 0.3, outR: 0.3 }), "determined")] };
});
SHOT.G09 = room(({ t }, items) => {
  dancingSocks(t, items, true);
  const k = Math.sin(t * PI * 2 * 1.8);
  return { room: { blanket: "lie" }, hums: [lily(lieBed({ headYaw: 0.4 }), "sad")], mons: [bo(boUnder(t, { x: BO_UNDER[0] + 0.15, armL: 1.5 + 0.4 * k, armR: 1.5 - 0.4 * k, outL: 0.3, outR: 0.3 }), "determined")] };
});
SHOT.G10 = room(({ t, u, end }, items) => {
  dancingSocks(t, items, true);
  const d = end - ST("G10");
  const up = ss(0, 0.35, u) * (1 - ss(d - 0.55, d - 0.1, u));
  const lp = lieBed({ pitch: -PI / 2 + 0.9 * up, y: TOP + 0.14 + 0.05 * up, headYaw: 0.5 * up, headPitch: 0.25 * up });
  const k = Math.sin(t * PI * 2 * 1.8);
  return { room: { blanket: up > 0.2 ? "lifted" : "lie", lift: up }, hums: [lily(lp, "sad")], mons: [bo(boUnder(t, { x: BO_UNDER[0] + 0.15, armL: 1.5 + 0.4 * k * (1 - up), armR: 1.5 - 0.4 * k * (1 - up), outL: 0.3, outR: 0.3, look: [0, 0.6] }), u > d - 0.5 ? "sad" : "determined")] };
});

// ---- H: night three (all in)
const danceP = (t: number, o: Partial<MPose> = {}): MPose => {
  const ph = t * PI * 2 * 1.7;
  return mp(BO_RUG[0], BO_RUG[2], -0.4 + 0.35 * Math.sin(ph / 2), { armL: 2.6 + 0.4 * Math.sin(ph), armR: 2.6 - 0.4 * Math.sin(ph), outL: 0.8, outR: 0.8, roll: 0.18 * Math.sin(ph), bob: 0.05 * Math.abs(Math.sin(ph)), legL: 0.4 * Math.max(0, Math.sin(ph)), legR: 0.4 * Math.max(0, -Math.sin(ph)), ...o });
};
/** the pose Bo freezes in when Lily looks */
const FREEZE_T = (): number => W(31, "saw");
const frozen = (t: number): MPose => {
  const p = danceP(Math.min(t, FREEZE_T()));
  return { ...p, yaw: lerp(p.yaw, -1.2, ss(FREEZE_T(), FREEZE_T() + 0.35, t)) };
};
SHOT.H01 = room(({ t, u, end }) => {
  const k = ss(0, end - ST("H01"), u);
  return { room: { blanket: "lie" }, hums: [lily(lieBed({ headYaw: 0.4 }), "sad")], mons: [bo(boUnder(t, { x: lerp(BO_UNDER[0], -0.2, k), z: lerp(BO_UNDER[2], -0.6, k), squash: lerp(0.5, 1, ss(0.4, 1, k)), armL: 2.5, armR: 2.5, outL: 0.4, outR: 0.4, pitch: 0.2 }), "grin")] };
});
SHOT.H02 = room(({ t, u }, items) => {
  const k = ss(0.1, 0.7, u);
  const m = bo(mp(BO_RUG[0], BO_RUG[2], -0.4, { armL: 2.9 - 0.5 * k, armR: 2.9 - 0.5 * k, outL: 0.35, outR: 0.35 }), "grin", { acc: { wig: k > 0.95 } });
  if (k <= 0.95) {
    const c = monCentre(m);
    items.push({ k: "wig", p: [c[0], c[1] + 0.39 + 0.35 * (1 - k), c[2] - 0.02], rot: [0, -0.4, 0.2 * (1 - k)] });
  }
  return { room: { blanket: "lie" }, hums: [lily(lieBed({ headYaw: 0.4 }), "sad")], mons: [m] };
});
SHOT.H03 = room(({ t, u }) => ({ room: { blanket: "lie" }, hums: [lily(lieBed({ headYaw: 0.4 }), "sad")], mons: [bo(mp(BO_RUG[0], BO_RUG[2], -0.4, { armR: 3.0, outR: -0.25, armL: 0.5 }), u > 0.5 ? "joy" : "grin", { acc: { wig: true, sockHorn: u > 0.45 } })] }));
SHOT.H04 = room(({ t }) => ({ room: { blanket: "lie" }, hums: [lily(lieBed({ headYaw: 0.4 }), "sad")], mons: [bo(danceP(t), "joy", { acc: { wig: true, sockHorn: true } })] }));
const lilyPeek = (t: number, u: number, k = 1): Pose => sitBed({ pitch: 0.05, armL: lerp(0.2, 1.2, k), armR: lerp(0.2, 1.2, k), outL: 0.1, outR: 0.1, headYaw: 0.55 * k, headPitch: 0.1 }, -1.3);
SHOT.H05 = room(({ t, u }) => {
  const k = ss(0, 0.8, u);
  return { room: { blanket: k > 0.3 ? "lifted" : "lie", lift: k }, hums: [lily(k > 0.3 ? lilyPeek(t, u, k) : lieBed({ headYaw: 0.4 }), "curious")], mons: [bo(danceP(t), "joy", { acc: { wig: true, sockHorn: true } })] };
});
SHOT.H06 = room(({ t, u }) => ({ room: { blanket: "lifted", lift: 1 }, hums: [lily(lilyPeek(t, u), "shock")], mons: [bo(frozen(t), t < FREEZE_T() ? "joy" : "shock", { acc: { wig: true, sockHorn: true } })] }));
SHOT.H07 = room(({ t }) => ({ room: { blanket: "lifted", lift: 1 }, hums: [lily(lilyPeek(t, 0), "shock")], mons: [bo(frozen(t), "grin", { acc: { wig: true, sockHorn: true }, noseRed: 0.2 })] }));
SHOT.H07b = room(({ t, u }) => ({ room: { blanket: "lifted", lift: 1 }, hums: [lily(lilyPeek(t, 0), "shock")], mons: [bo({ ...frozen(t), look: [0.5, 0] }, "shy", { acc: { wig: true, sockHorn: true }, noseRed: 0.3 })] }));
SHOT.H08 = room(({ t }) => ({ room: { blanket: "lifted", lift: 1 }, hums: [lily(lilyPeek(t, 0), "shock")], mons: [bo(frozen(t), "shy", { acc: { wig: true, sockHorn: true }, noseRed: 0.3 })] }));

// ---- J, K: she laughs (warm)
const BO_WARM: V3 = [BO_RUG[0], 0, BO_RUG[2]];
SHOT.J01 = room(({ t, u }) => ({ room: { blanket: "lifted", lift: 1 }, hums: [lily(laughL(lilyPeek(t, u), t, 1.3), "joy")], mons: [bo(frozen(t), "shock", { acc: { wig: true, sockHorn: true }, noseRed: 0.4 })] }));
SHOT.J02 = room(({ t }) => {
  const k = Math.sin(t * PI * 2 * 3);
  return { room: { blanket: "fold" }, hums: [lily(laughL(sitBed({ pitch: -0.4, legL: PI / 2 - 0.25 + 0.3 * k, legR: PI / 2 - 0.25 - 0.3 * k, armL: 1.9 + 0.3 * k, armR: 1.9 - 0.3 * k, outL: 0.5, outR: 0.5 }), t, 1.4), "joy")], mons: [bo(frozen(t), "wind", { acc: { wig: true, sockHorn: true }, noseRed: 0.6 })] };
});
const SNEEZE_UP = (): number => W(35, "flew") - 0.1;
const BONK = (): number => W(35, "bonked");
const flight = (t: number): MPose => {
  const t0 = SNEEZE_UP(), tb = BONK();
  const top = ROOM.h - 1.0;
  let y = 0;
  let squash = 1;
  if (t >= t0 && t < tb) y = top * ss(t0, tb, t) ** 0.7;
  else if (t >= tb) {
    const f = t - tb;
    const fall = Math.max(0, f - 0.3);
    y = Math.max(TOP - 0.02, top - 4.9 * fall * fall);
    squash = f < 0.3 ? 0.6 + 0.4 * ss(0, 0.3, f) : 1;
  }
  return { ...frozen(t), x: BO_WARM[0], z: BO_WARM[2], y, squash, armL: 2.8, armR: 2.8, outL: 0.6, outR: 0.6, legL: 0, legR: 0 };
};
SHOT.J03 = room(({ t }, items) => {
  const k = Math.sin(t * PI * 2 * 3);
  const m = withSneeze(bo(frozen(t), "happy", { acc: { wig: true, sockHorn: true } }), t, SNEEZE_UP(), items, 1.1);
  return { room: { blanket: "fold" }, hums: [lily(laughL(lieBed({ legL: 0.4 + 0.35 * k, legR: 0.4 - 0.35 * k, armL: 2.2, armR: 2.2, outL: 0.6, outR: 0.6 }), t, 1.3), "joy")], mons: [m] };
});
SHOT.J04 = room(({ t }, items) => {
  const m = withSneeze(bo(flight(t), "happy", { acc: { wig: true, sockHorn: true } }), t, SNEEZE_UP(), items, 0.3);
  return { room: { blanket: "fold" }, hums: [lily(laughL(sitBed({ armL: 0.6, armR: 0.6, headYaw: 0.6, headPitch: -0.3 }), t, 1.2), "joy")], mons: [m] };
});
SHOT.J05 = room(({ t }, items) => {
  const m = bo(flight(t), t > BONK() ? "itch" : "sneeze", { acc: { wig: true, sockHorn: true }, noseRed: 1 });
  if (t > BONK()) {
    const c = monCentre(m);
    items.push({ k: "stars", p: [c[0], c[1] + 0.5, c[2]], op: clamp((t - BONK()) * 4) });
  }
  return { room: { blanket: "fold" }, hums: [lily(laughL(sitBed({ armL: 0.6, armR: 0.6, headYaw: 0.6, headPitch: -0.4 }), t, 1.2), "joy")], mons: [m] };
});
/** after the bonk: Bo lands sitting on the end of the bed */
const BO_BED: V3 = [BED.cx + 0.05, 0, -0.42];
const boOnBed = (t: number, o: Partial<MPose> = {}): MPose => mp(BO_BED[0], BO_BED[2], PI + 0.25, { y: TOP - 0.1, legL: 1.2, legR: 1.2, armL: 0.6, armR: 0.6, ...o });
const lilyOnBed = (t: number, o: Partial<Pose> = {}): Pose => sitBed({ armL: 0.5, armR: 0.5, outL: 0.3, outR: 0.3, ...o }, -1.38);
SHOT.J06 = room(({ t, u }, items) => {
  const land = ss(0, 0.25, u);
  const m = bo(boOnBed(t, { y: TOP - 0.1 + 0.6 * (1 - land), squash: 1 - 0.3 * Math.exp(-u * 8) * land }), "joy", { acc: { wig: true, sockHorn: true }, noseRed: 1 });
  const m2 = withSneeze(m, t, ST("J06") + 1.1, items, 0.5);
  return { room: { blanket: "fold", bounce: bounceOf(t, ST("J06") + 0.25, 0.08) + bounceOf(t, ST("J06") + 1.1, 0.1) }, hums: [lily(laughL(lilyOnBed(t), t, 1.3), "joy")], mons: [m2] };
});
SHOT.J06b = room(({ t }) => ({ room: { blanket: "fold" }, hums: [lily(laughL(lilyOnBed(t, { armL: 1.9, armR: 1.9, outL: 0.0, outR: 0.0 }), t, 1.4), "joy")], mons: [bo(boOnBed(t), "joy", { acc: { wig: true, sockHorn: true }, noseRed: 1 })] }));
SHOT.J07 = room(({ t }, items) => {
  const t0 = W(36, "sneezing.") - 0.1;
  const m = withSneeze(bo(boOnBed(t), "joy", { acc: { wig: true, sockHorn: true }, noseRed: 1 }), t, t0, items, 0.6);
  return { room: { blanket: "fold", bounce: bounceOf(t, t0, 0.12) }, hums: [lily(laughL(lilyOnBed(t), t, 1.5), "joy")], mons: [m] };
});
/** K: Lily on the edge of the bed, Bo on the rug in front of her */
const LILY_EDGE: Pose = { ...base(BED.x1 - 0.12, -0.95, PI / 2, LS), y: TOP + 0.12, legL: 1.3, legR: 1.3, armL: 0.4, armR: 0.4, outL: 0.25, outR: 0.25, headYaw: -0.45 };
const BO_FRONT: V3 = [-0.05, 0, -0.95];
SHOT.K01 = room(({ t, u }) => ({ room: { blanket: "fold" }, hums: [lily({ ...LILY_EDGE, pitch: 0.25 * ss(0, 0.5, u), headPitch: 0.1 }, "curious")], mons: [bo(mp(BO_FRONT[0], BO_FRONT[2], -PI / 2 + 0.8, { armL: 0.5, armR: 0.5 }), "shy", { noseRed: 0.9, acc: { wig: true } })] }));
SHOT.K02 = room(({ t, u }) => ({ room: { blanket: "fold" }, hums: [lily({ ...LILY_EDGE, pitch: 0.25, headPitch: 0.1 }, "happy")], mons: [bo(mp(BO_FRONT[0], BO_FRONT[2], -PI / 2 + 0.8, { pitch: 0.22 * Math.max(0, Math.sin(u * PI * 2 * 1.6)), armL: 0.5, armR: 0.5 }), "shy", { noseRed: 0.95, acc: { wig: true } })] }));
SHOT.K03 = room(({ t }) => ({ room: { blanket: "fold" }, hums: [lily({ ...LILY_EDGE, pitch: 0.2 }, "happy")], mons: [bo(mp(BO_FRONT[0], BO_FRONT[2], -PI / 2 + 0.8, { armL: 0.6, armR: 0.6, look: [0, 0.3] }), "shy", { noseRed: 1, acc: { wig: true } })] }));
// ---- L: every night again
SHOT.L01 = room(({ t }) => {
  const lp: Pose = { ...base(RUG.x - 0.25, RUG.z + 0.1, 0.6, LS), y: SIT_Y, legL: PI / 2, legR: PI / 2, armL: 0.9, armR: 1.0, outL: 0.1, outR: 0.05 };
  return { room: { blanket: "fold" }, hums: [lily(laughL(lp, t, 1.2), "joy", { held: { side: "R", kind: "flashlight", tilt: [0.6, 0] }, held2: { side: "L", kind: "book", tilt: [-0.9, 0] } })], mons: [bo(mp(RUG.x + 0.42, RUG.z + 0.05, -0.7, { armL: 0.5, armR: 0.5, pitch: -0.1 + 0.08 * Math.sin(t * 9), puff: 0.2 }), "joy", { noseRed: 0.8 })] };
});
SHOT.L02 = room(({ t }, items) => {
  const t0 = W(38, "sneeze") + 0.05;
  const b = bounceOf(t, t0, 0.24);
  const lp = sitBed({ armL: 0.4 + 2 * b, armR: 0.4 + 2 * b, outL: 0.4 + 2 * b, outR: 0.4 + 2 * b });
  return { room: { blanket: "fold", bounce: b }, hums: [lily(laughL({ ...lp, y: lp.y + 1.4 * b }, t, 1.3), "joy")], mons: [withSneeze(bo(boUnder(t), "joy", { noseRed: 0.8 }), t, t0, items, 0.9)] };
});
SHOT.L03 = club(({ t }) => {
  const ms = clubBase(t).map((m, i) => (m.key === "grizzle" || m.key === "pip" ? { ...m, emotion: "tease" as MEmotion, pose: teaseP({ ...m.pose, yaw: toward([m.pose.x, 0, m.pose.z], S.bo) }, t, i) } : m));
  return { mons: [...ms, bo(seatPose(S.bo, toward(S.bo, T0), { armR: 1.0 + 0.2 * Math.sin(t * 3), armL: 0.4, pitch: -0.05 }), "grin", { noseRed: 1, acc: { tissue: "R" } })] };
});
SHOT.L04 = club(({ t }) => ({ mons: [...clubBase(t), bo(seatPose(S.bo, toward(S.bo, T0) + 0.3, { armR: 1.0, armL: 0.4, pitch: -0.08 }), "happy", { noseRed: 1, acc: { tissue: "R" } })] }));
const BOX_UNDER: V3 = [-1.15, 0, -0.45];
SHOT.L05 = room(({ t }, items) => {
  items.push({ k: "tissue", p: BOX_UNDER, yaw: PI / 2 + 0.2, note: true });
  return { room: { blanket: "fold" }, hums: [], mons: [bo(boUnder(t, { z: BO_UNDER[2] - 0.15 }), "happy", { noseRed: 0.7 })] };
});
SHOT.L05b = room(({ t }, items) => {
  const m = bo(boUnder(t, { z: BO_UNDER[2] - 0.05, armL: 1.25, armR: 1.25, outL: -0.25, outR: -0.25 }), "joy", { noseRed: 0.7 });
  const f = monFace(m);
  items.push({ k: "tissue", p: [f[0] + 0.24, 0.12, f[2]], yaw: PI / 2, note: true, s: 0.9 });
  for (let i = 0; i < 3; i++) {
    const ph = ((t - ST("L05b")) / 1.2 + i / 3) % 1;
    items.push({ k: "heart", p: [f[0] + 0.15, f[1] + 0.12 + 0.35 * ph, f[2] + (i - 1) * 0.15], s: 0.05 * Math.sin(PI * ph) });
  }
  return { room: { blanket: "fold" }, hums: [], mons: [m] };
});
SHOT.L06 = room(({ t }, items) => {
  items.push({ k: "tissue", p: BOX_UNDER, yaw: PI / 2 + 0.2, note: true });
  return { room: { blanket: "fold" }, hums: [], mons: [bo(boUnder(t, { z: BO_UNDER[2] - 0.15 }), "happy", { noseRed: 0.7 })] };
});
/** Lily lying on her belly on the floor beside the bed, peeking under it with the flashlight */
const lilyFloor = (t: number): Pose => ({ ...base(0.4, -0.95, -PI / 2, LS), y: 0.12, pitch: PI / 2 - 0.05, headPitch: -1.1, armL: 2.4, armR: 2.6, outL: 0.3, outR: 0.2, legL: -0.4 - 0.3 * Math.sin(t * 5), legR: -0.4 + 0.3 * Math.sin(t * 5) });
SHOT.L07 = room(({ t }, items) => {
  items.push({ k: "tissue", p: [BO_UNDER[0] - 0.25, 0, BO_UNDER[2] - 0.45], yaw: PI / 2, note: true });
  return { room: { blanket: "fold" }, hums: [lily(lilyFloor(t), "joy", { held: { side: "R", kind: "flashlight", tilt: [-1.4, 0] } })], mons: [bo(boUnder(t, { x: BO_UNDER[0] + 0.12 }), "grin", { noseRed: 0.8 })] };
});
SHOT.L08 = room(({ t }, items) => {
  const t0 = W(41, "sneezing") - 0.2;
  items.push({ k: "tissue", p: [BO_UNDER[0] - 0.25, 0, BO_UNDER[2] - 0.45], yaw: PI / 2, note: true });
  return { room: { blanket: "fold", bounce: bounceOf(t, t0, 0.2) }, hums: [lily(laughL(lilyFloor(t), t, 1.2), "joy", { held: { side: "R", kind: "flashlight", tilt: [-1.4, 0] } })], mons: [withSneeze(bo(boUnder(t, { x: BO_UNDER[0] + 0.12 }), "grin", { noseRed: 0.9 }), t, t0, items, 0.7)] };
});

// ================================================================== stageAt
export const stageAt = (t: number, id?: string): Stage => {
  const row = id ? SHOTS.find((s) => s.id === id)! : shotOf(t);
  const f = SHOT[row.id];
  if (!f) throw new Error(`no staging for ${row.id}`);
  const b = f({ t, u: t - row.t, id: row.id, end: row.end, scene: row.scene });
  const scene = row.scene === "club" || row.scene === "street" ? "night" : row.scene;
  const rm = roomOf(scene, b.room ?? {});
  const hums = b.hums.map((h) => {
    const live = alive({ key: h.key, look: h.look, pose: h.pose, emotion: h.emotion, s: h.s, blinkSeed: h.seed }, t);
    return { ...h, pose: live.pose, blink: h.blink ?? (h.emotion !== "sleep" && blinkAt(t, h.seed)) };
  });
  const mons = b.mons.map((m) => ({ ...aliveM(m, t), blink: m.blink ?? blinkAt(t, m.seed) }));
  const items = [...b.items];
  // contact shadows: monsters and people on the floor (not on the bed: the mattress has its own)
  for (const m of mons) if (m.pose.y < 0.05 && (m.blob ?? 1) > 0) items.push({ k: "blob", p: [m.pose.x, 0, m.pose.z], sx: 1.0 * m.s * (m.look.w ?? 0.84) * 1.4, sz: 0.9 * m.s * (m.look.d ?? 0.66) * 1.4, op: 0.55 });
  for (const h of hums) if (h.pose.y < 0.6 && (h.blob ?? 1) > 0 && Math.abs(h.pose.pitch) < 0.5) items.push({ k: "blob", p: [h.pose.x, 0, h.pose.z], sx: 0.95 * h.s, sz: 0.7 * h.s, op: 0.5 });
  return { set: b.set, room: rm, hums, mons, items, id: row.id };
};
export const humOf = (st: Stage, key: string) => st.hums.find((a) => a.key === key);
export const monOf = (st: Stage, key: string) => st.mons.find((a) => a.key === key);
export { facePoint, heldWorld, hash };
