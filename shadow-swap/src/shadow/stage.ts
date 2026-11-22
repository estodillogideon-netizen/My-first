// The staging of "The Shadow Swap": where everyone is and what they and their SHADOWS do, as pure functions of t
// (seconds). No React here, so the numeric checks (tools/shadow_check.ts) evaluate exactly what the render shows.
// Every action is anchored to a word of the voice-over (W) or a shot start (ST).
//
// The world's rule: your shadow shows what you really feel. A shadow is a Shade: a puppet pose drawn flat on the
// shadow wall (z = 0) at wall position x. By default a shade mimics its owner (lx = the light's slant: the shade sits
// lx * z to the right of its owner). Kai's shade cries. Mr. Ollie has none.
// Periods: home intro (A, B) -> hall (C, D, E) -> yard (F, H, J, K, L; with the flashback G and the memory H05-H07 cut
// in) -> home at sunset (M).
import type { Look } from "../blocky/Blocky";
import { clamp, hash, keys, L, lerp, SPEC, ss, U } from "../blocky/motion";
import type { Emotion, Pose, V3 } from "../blocky/motion";
import { alive, base, blinkAt, facePoint, heldWorld, pop, SINK, walk } from "../library/characters";
import { BOY, DAD, JAY, KAI, KAI_SMALL, KIDS, MAILMAN, MOM, NEIGHBOUR, OLLIE, OLLIE_YOUNG, PRIYA, SC, TEACHER } from "./cast";
import type { PuppetFx } from "./Puppet";
import { HOME } from "./Sets";
import { ST, W } from "./time";

// ------------------------------------------------------------------ types
export type HeldKind = { side: "L" | "R"; kind: "mop" | "note" | "sandwich" | "photo" | "book" | "clip" | "letter"; tilt?: [number, number] };
export type Actor = {
  key: string;
  look: Look;
  pose: Pose;
  emotion: Emotion;
  s: number;
  blinkSeed: number;
  held?: HeldKind;
  held2?: HeldKind;
  /** contact shadow under the feet (0 = none: Mr. Ollie) */
  blob: number;
  floor: number;
  blink?: boolean;
};
export type Shade = { key: string; x: number; pose: Pose; look: Look; s: number; k: number; op: number; fx: PuppetFx; seed: number };
export type Item =
  | { k: "text"; p: V3; text: string; op: number; s: number; color?: string }
  | { k: "note"; p: V3; text: string[]; c?: string; tilt?: number }
  | { k: "shade"; x0: number; x1: number; op: number }
  | { k: "tower"; p: V3 }
  | { k: "bench"; p: V3 }
  | { k: "mopFloor"; p: V3; yaw: number }
  | { k: "bucket"; p: V3 }
  | { k: "blob"; p: V3; sx: number; sz: number; op: number };
export type SetName = "home" | "hall" | "yard";
export type Stage = { set: SetName; lights: number; dead: number; actors: Actor[]; shades: Shade[]; items: Item[]; lx: number };

// ------------------------------------------------------------------ helpers
const mk = (key: string, look: Look, s: number, pose: Pose, emotion: Emotion, seed: number, extra: Partial<Actor> = {}): Actor => ({ key, look, s, pose, emotion, blinkSeed: seed, blob: 1, floor: 0, ...extra });
const stand = (x: number, z: number, yaw: number, s: number, o: Partial<Pose> = {}) => base(x, z, yaw, s, o, SINK);
export const yawOf = (dx: number, dz: number) => Math.atan2(dx, dz);
/** turn the head toward a point (clamped to +-1.1 rad of the body) */
const lookAt = (p: Pose, s: number, q: V3, k = 1): Pose => {
  const f = facePoint(p, s);
  let d = yawOf(q[0] - f[0], q[2] - f[2]) - p.yaw;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  const pitch = -Math.atan2(q[1] - f[1], Math.hypot(q[0] - f[0], q[2] - f[2]));
  return { ...p, headYaw: lerp(p.headYaw, clamp(d, -1.1, 1.1), k), headPitch: lerp(p.headPitch, clamp(pitch * 0.8, -0.5, 0.5), k) };
};
const faceH = (s: number) => (L + (SPEC.torso.h + SPEC.head.gap + SPEC.head.h / 2) * U) * s;
/** a lunge ("kneeling" down to a kid's eye level): one leg forward, one back, hips low */
const kneel = (x: number, z: number, yaw: number, s: number, u: number, o: Partial<Pose> = {}): Pose => {
  const a = 0.95 * u;
  return { ...base(x, z, yaw, s, {}, SINK), y: (L * Math.cos(a) + 0.02 - SINK) * s, legL: a, legR: -a, pitch: 0.1 * u, ...o };
};
/** sitting on the floor (scaled) */
const sitS = (x: number, z: number, yaw: number, s: number, o: Partial<Pose> = {}, seat = 0): Pose => {
  const pitch = o.pitch ?? 0;
  return { ...base(x, z, yaw, s), y: ((SPEC.shoe.d * U) / 2 + 0.004) * s + seat, legL: Math.PI / 2 + pitch, legR: Math.PI / 2 + pitch, armL: 0.5, armR: 0.5, outL: 0.12, outR: 0.12, ...o };
};
/** sitting on a seat of height h (legs down) */
const sitOn = (x: number, z: number, yaw: number, s: number, h: number, o: Partial<Pose> = {}): Pose => ({
  ...base(x, z, yaw, s), y: h + 0.13 * s, legL: 1.25, legR: 1.25, armL: 0.45, armR: 0.45, outL: 0.1, outR: 0.1, ...o,
});
const wave = (t: number, f = 2.4) => Math.sin(t * Math.PI * 2 * f);
const hand = (a: Actor, side: "L" | "R"): V3 => heldWorld(a.pose, side, a.s, [0, 0.02, 0]);

// ------------------------------------------------------------------ shade poses (puppet frame: x = z = 0)
const P0 = (yaw: number, s: number, o: Partial<Pose> = {}): Pose => base(0, 0, yaw, s, o, SINK);
/** sitting on the floor, hunched, face in the hands, sobbing (profile: dir = +1 faces +x) */
const sobSit = (t: number, s: number, dir: number, amt = 1, seed = 0): Pose => {
  const sob = Math.sin(t * Math.PI * 2 * 2.6 + seed) * amt;
  return sitS(0, 0, (dir * Math.PI) / 2, s, {
    pitch: lerp(0.2, 0.72, amt) + 0.06 * sob,
    armL: lerp(0.5, 0.95, amt) + 0.08 * sob,
    armR: lerp(0.5, 1.0, amt) + 0.08 * sob,
    outL: 0.12, outR: 0.12,
    headPitch: lerp(0.1, 0.55, amt) + 0.08 * sob,
    sway: 0.03 * sob,
  });
};
/** standing, sobbing into the hands (profile) */
const sobStand = (t: number, s: number, dir: number, seed = 0): Pose => {
  const sob = Math.sin(t * Math.PI * 2 * 2.6 + seed);
  return P0((dir * Math.PI) / 2, s, { pitch: 0.14 + 0.05 * sob, armL: 2.35 + 0.08 * sob, armR: 2.4 + 0.08 * sob, outL: 0.1, outR: 0.1, headPitch: 0.6 + 0.07 * sob, bob: -0.02 * (1 + sob) });
};
/** dancing (front view): bouncing, arms up and alternating, hips swaying */
const dance = (t: number, s: number, seed = 0): Pose => {
  const ph = t * Math.PI * 2 * 1.6 + seed;
  return { ...P0(0, s), y: (L - SINK) * s + 0.06 * Math.abs(Math.sin(ph)), outL: 2.3 + 0.5 * Math.sin(ph), outR: 2.3 - 0.5 * Math.sin(ph), armL: 0.2, armR: 0.2, legL: 0.35 * Math.sin(ph), legR: -0.35 * Math.sin(ph), sway: 0.2 * Math.sin(ph), headYaw: 0.3 * Math.sin(ph) };
};
/** flexing (front view): arms out and up, bulging */
const flex = (t: number, s: number): Pose => {
  const ph = Math.sin(t * Math.PI * 2 * 1.2);
  return P0(0, s, { outL: 1.75 + 0.15 * ph, outR: 1.75 - 0.15 * ph, armL: 0.0, armR: 0.0, sway: 0.08 * ph, legL: 0.2, legR: -0.2 });
};
/** shy (front view): hands over the face, swaying */
const shy = (t: number, s: number): Pose => P0(0, s, { armL: 2.3, armR: 2.3, outL: 0.3, outR: 0.3, headPitch: 0.25, sway: 0.12 * Math.sin(t * 2.4), twist: 0.15 * Math.sin(t * 1.2) });
/** a huge yawn and stretch (profile) */
const yawn = (t: number, s: number, dir: number, u: number): Pose => P0((dir * Math.PI) / 2, s, { armL: lerp(0.1, 2.95, u), armR: lerp(0.1, 3.0, u), outL: 0.15 * u, outR: 0.15 * u, headPitch: -0.45 * u, pitch: -0.12 * u + 0.02 * Math.sin(t * 3) });
/** a big belly laugh (front view) */
const laughP = (t: number, s: number): Pose => {
  const ph = Math.sin(t * Math.PI * 2 * 4);
  return P0(0, s, { y: (L - SINK) * s + 0.03 * Math.abs(ph), armL: 0.7, armR: 0.7, outL: 0.5, outR: 0.5, headPitch: -0.3 + 0.08 * ph, pitch: -0.08 });
};
/** pointing (profile toward dir) */
const pointP = (s: number, dir: number, t: number): Pose => P0((dir * Math.PI) / 2, s, { armR: 1.5 + 0.05 * Math.sin(t * 6), armL: 0.1, headPitch: -0.05 });

/** a shade that mimics its owner */
const mimic = (a: Actor, lx: number, o: Partial<Shade> = {}): Shade => ({
  key: a.key, x: a.pose.x + lx * a.pose.z, pose: { ...a.pose, x: 0, z: 0, y: a.pose.y - a.floor }, look: a.look, s: a.s, k: 1.02 + 0.035 * a.pose.z, op: 1, fx: {}, seed: a.blinkSeed, ...o,
});
/** a shade with its own pose, at its owner's place on the wall */
const own = (a: Actor, lx: number, pose: Pose, fx: PuppetFx = {}, o: Partial<Shade> = {}): Shade => ({ ...mimic(a, lx), pose, fx, ...o });

// ------------------------------------------------------------------ cached word/shot times
let TT: Record<string, number> | null = null;
const TK = () => (TT ??= { C01: ST("C01"), F01: ST("F01"), G01: ST("G01"), G06: ST("G06"), H01: ST("H01"), H05: ST("H05"), H08: ST("H08"), M01: ST("M01") });

// ================================================================== A, B: home in the morning
export const KAI_HOME: V3 = [1.0, 0, 1.25];
const homeIntro = (t: number): Stage => {
  const lx = 0.5;
  const actors: Actor[] = [];
  const shades: Shade[] = [];
  const items: Item[] = [];
  const s = SC.kai;
  const tB = ST("B01");
  // ---- Kai: patio in front of the plain wall (A01, A02), waves (A06), walks the patio (A07), stands (A08, A09);
  //      B: on the patio in front of Mom at the door
  let kp: Pose;
  let ke: Emotion = "smile";
  if (t < tB) {
    const walkT = ST("A07");
    const wx = keys([[walkT, -0.4], [ST("A08"), 1.5]], t);
    if (t < walkT) {
      kp = stand(-0.4, 1.3, 0.25, s, { armR: 0.1 });
      // A01 the wave hello, A06 the big wave
      const w1 = ss(0.1, 0.5, t) * (1 - ss(1.6, 2.1, t));
      const w2 = ss(ST("A06") - 0.1, ST("A06") + 0.35, t);
      const w = Math.max(w1, w2);
      kp = { ...kp, outR: lerp(0.05, 2.3, w) + 0.25 * w * wave(t, 2), armR: 0.1 + 0.25 * w };
    } else if (t < ST("A08")) {
      kp = walk(wx, 1.3, Math.PI / 2, t, walkT, 0, s, {}, SINK);
      kp = { ...walk(-0.4, 1.3, Math.PI / 2, t, walkT, (1.5 + 0.4) / (ST("A08") - walkT), s, {}, SINK), headYaw: -0.9 };
    } else kp = stand(1.5, 1.3, 0.1, s, { headYaw: 0.1 });
    ke = "smile";
  } else {
    kp = stand(-0.6, 1.4, -0.75, s, {});
    const thumbs = ss(W(4, "I") - 0.15, W(4, "I") + 0.2, t) * (1 - ss(W(4, "And", 1) + 0.2, W(4, "And", 1) + 0.6, t));
    kp = { ...kp, armR: lerp(0.06, 1.55, thumbs), outR: 0.15 * thumbs };
    ke = t > W(4, "I") - 0.1 ? "brave" : "smile";
  }
  const kai = mk("kai", KAI, s, kp, ke, 1.1);
  actors.push(kai);
  // Kai's shade: sits at the wall base and cries (it slides with him)
  const ks = own(kai, lx, sobSit(t, s, 1, 1, 0.3), { tears: 1 });
  shades.push(t >= ST("B04") ? own(kai, lx, sobStand(t, s, -1, 0.5), { tears: 1 }) : ks);
  // ---- the neighbour and the mailman at the garden wall (A03..A05)
  if (t > ST("A03") - 0.5 && t < ST("A06")) {
    const nz = 1.15;
    const nx = keys([[ST("A03"), 10.2], [ST("A04"), 9.0]], t);
    let np = t < ST("A04") ? walk(10.2, nz, -Math.PI / 2, t, ST("A03"), (10.2 - 9.0) / (ST("A04") - ST("A03")), SC.adult, {}, SINK) : stand(9.0, nz, -Math.PI / 2 + 0.25, SC.adult);
    np = { ...np, x: t < ST("A04") ? np.x : nx, headYaw: t < ST("A04") ? 0.6 : 0.2 };
    const nb = mk("neighbour", NEIGHBOUR, SC.adult, np, "joy", 2.2);
    actors.push(nb);
    shades.push(own(nb, lx, dance(t, SC.adult, 0.4)));
    const mt = ST("A04");
    if (t > mt - 0.2) {
      const give = ss(mt, mt + 0.5, t);
      const mp = stand(7.6, 1.05, Math.PI / 2 - 0.2, SC.adult, { armR: lerp(0.1, 1.25, give), outR: 0.05 });
      const mm = mk("mailman", MAILMAN, SC.adult, mp, "smile", 3.3, { held: give > 0.3 ? { side: "R", kind: "letter" } : undefined });
      actors.push(mm);
      shades.push(own(mm, lx, P0(Math.PI / 2 - 0.2, SC.adult, { armL: lerp(0.1, 1.25, give), armR: -0.85, outR: 0.05, headYaw: 0.1 }), { cross: true }));
    }
  }
  // ---- Mom at the door (B)
  if (t >= tB - 0.3) {
    const mp = stand(HOME.door + 0.1, 0.5, 0.55, SC.adult, { armL: 0.25 });
    const ask = ss(W(4, "How") - 0.2, W(4, "How") + 0.3, t);
    const mom = mk("mom", MOM, SC.adult, lookAt({ ...mp, y: mp.y + 0.16, armL: 0.25 + 0.35 * ask, outL: 0.2 * ask }, SC.adult, facePoint(kai.pose, s), 0.85), t > ST("B05") ? "sad" : "smile", 4.4, { floor: 0.16 });
    actors.push(mom);
    // Kai looks up at her
    actors[0] = { ...kai, pose: lookAt(kai.pose, s, facePoint(mom.pose, SC.adult), 0.9) };
  }
  return { set: "home", lights: 1, dead: 0, actors, shades, items, lx };
};

// ================================================================== C, D, E: the school hallway
const KL = -1.85; // Kai's locker
const hall = (t: number): Stage => {
  const lx = 0.42;
  const actors: Actor[] = [];
  const shades: Shade[] = [];
  const items: Item[] = [];
  const s = SC.kai;
  const C08 = ST("C08"), C09 = ST("C09"), C10 = ST("C10"), D01 = ST("D01"), D02 = ST("D02"), D05 = ST("D05"), E01 = ST("E01");
  const pw = W(15, "power");
  // the lights: on; flicker on "Friday"; out on "power"
  let lights = 1;
  if (t > E01 + 0.3) lights = t < pw ? (Math.sin(t * 37) > 0.2 || Math.sin(t * 13) > 0.6 ? 1 : 0.25) : 0;
  // ---- the kids (C01..C06; some stay in D)
  const inD = t > D01 - 0.2 && t < D02;
  const stare = inD ? 1 : ss(ST("C06") - 0.1, ST("C06") + 0.4, t) * (1 - ss(C08 - 0.2, C08, t));
  // in D01 they stare at Kai walking past
  const kaiShadeAt: V3 = inD ? [-6.4 + 1.0 * (t - D01) + 0.4, 1.0, 2.1] : [KL + lx * 0.85, 0.5, 0];
  if (t < C08 || inD) {
    const jp = stand(-6.6, 0.75, 0.35 - 0.7 * stare, SC.kid, { outR: 0.25, armL: 0.2 });
    const jay = mk("jay", JAY, SC.kid, lookAt(jp, SC.kid, kaiShadeAt, stare), stare > 0.5 ? "shock" : "sly", 5.1);
    actors.push(jay);
    shades.push(own(jay, lx, flex(t, SC.kid), { muscle: 1 }));
    const px = keys([[ST("C01"), -5.2], [ST("C04"), -3.9]], t);
    const pp = t < ST("C04") ? { ...walk(-5.2, 1.6, Math.PI / 2, t, ST("C01"), (5.2 - 3.9) / (ST("C04") - ST("C01")), SC.kid, {}, SINK), x: px } : stand(-3.9, 1.6, Math.PI / 2 - 0.9 * stare, SC.kid);
    const priya = mk("priya", PRIYA, SC.kid, lookAt({ ...pp, armL: 0.9, outL: 0.05 }, SC.kid, kaiShadeAt, stare), stare > 0.5 ? "shock" : "love", 6.2, { held: { side: "L", kind: "book" } });
    actors.push(priya);
    shades.push(own(priya, lx, shy(t, SC.kid), { hearts: 1 }));
    const tp = stand(2.45, 1.45, -0.25 - 0.5 * stare, SC.adult, { armL: 0.75, outL: 0.05 });
    const teacher = mk("teacher", TEACHER, SC.adult, lookAt(tp, SC.adult, kaiShadeAt, stare), stare > 0.5 ? "shock" : "flat", 7.3, { held: { side: "L", kind: "clip" } });
    actors.push(teacher);
    const yu = 0.5 + 0.5 * Math.sin((t - ST("C01")) * 2.2 - 1.2);
    shades.push(own(teacher, lx, yawn(t, SC.adult, -1, ss(0, 1, yu)), { yawn: ss(0.2, 1, yu) }));
    // two kids chatting further down (their shades bounce along)
    for (const [i, x, yaw] of [[0, 4.3, -0.5], [1, 5.3, -2.4]] as [number, number, number][]) {
      const kp = stand(x, 0.95, yaw + (i ? 0.9 : -0.9) * stare, SC.kid, { armR: 0.3 * Math.abs(wave(t + i, 0.8)) });
      const kid = mk(`kid${i}`, KIDS[i], SC.kid, lookAt(kp, SC.kid, kaiShadeAt, stare), stare > 0.5 ? "shock" : "joy", 8.4 + i);
      actors.push(kid);
      shades.push(own(kid, lx, i ? dance(t, SC.kid, 1.2) : laughP(t, SC.kid)));
    }
  }
  // C10..C12: two kids walk past the stairs (they never look into the nook)
  if (t > C10 - 0.2 && t < D01) {
    for (const i of [2, 3]) {
      const kp2 = walk(11.8 + (i - 2) * 0.9, 4.0 + (i - 2) * 0.35, -Math.PI / 2, t, C10, 0.85, SC.kid, {}, SINK);
      const kid = mk(`pass${i}`, KIDS[i], SC.kid, kp2, "happy", 3 + i);
      actors.push(kid);
      shades.push(mimic(kid, lx));
    }
  }
  // ---- Kai
  let kp: Pose;
  let ke: Emotion = "smile";
  let kHeld: HeldKind | undefined;
  let kShadeOp = 1;
  let kShadePose: Pose | null = null;
  if (t < C08) {
    // at his locker (C01..C07): side on, smiling, looks round in C07
    kp = stand(KL, 0.85, -2.2, s, { armR: 0.65, outR: 0.05 });
    if (t > ST("C07") - 0.35) kp = { ...kp, yaw: -0.4, headYaw: 0.2, armR: 0.1 };
    ke = t > ST("C07") - 0.35 ? "sly" : "smile";
  } else if (t < C09) {
    // C08: steps into the shade under the dead light (x 6.4..8.2): his shade fades
    const v = 1.1;
    kp = walk(5.0, 1.0, Math.PI / 2, t, C08, v, s, {}, SINK);
    if (kp.x > 7.0) kp = stand(7.0, 1.0, 0.3, s);
    kShadeOp = 1 - ss(5.7, 6.7, kp.x);
    ke = "sly";
  } else if (t < C10) {
    // C09: behind the locker tower, peeking out
    kp = stand(-8.78, 2.0, 0.55, s, { pitch: 0.12, sway: -0.12, outR: 0.1, armL: 0.5, headYaw: 0.25 });
    kShadeOp = 0;
    ke = "sly";
  } else if (t < D01) {
    // C10..C12: under the stairs, sitting, eating
    const bite = ss(0, 0.25, (t * 0.8) % 1) * (1 - ss(0.35, 0.6, (t * 0.8) % 1));
    kp = sitS(12.55, 0.75, -0.25, s, { armR: lerp(1.0, 1.85, bite), outR: 0.05, armL: 0.55, headPitch: 0.1 });
    kHeld = { side: "R", kind: "sandwich" };
    kShadeOp = 0;
    ke = t > ST("C11") ? "smile" : "flat";
  } else if (t < D05) {
    // D01: walks the hall; D02..D04: (off) at his locker
    kp = t < D02 ? walk(-6.4, 2.1, Math.PI / 2, t, D01, 1.0, s, {}, SINK) : stand(KL, 0.85, -2.2, s, { armR: 0.65 });
    ke = "brave";
  } else {
    // D05..E02: at his locker, finds the note, pockets it (D08), looks down the hall at Ollie
    kp = stand(KL, 0.85, -2.0, s, {});
    const take = ss(D05 + 0.2, D05 + 0.7, t) * (1 - ss(ST("D08") + 0.4, ST("D08") + 0.9, t));
    kp = { ...kp, armR: lerp(0.06, 1.5, take), outR: 0.12 * take };
    if (take > 0.6) kHeld = { side: "R", kind: "note" };
    if (t > ST("D08")) kp = { ...kp, yaw: lerp(-2.0, 0.9, ss(ST("D08"), ST("D08") + 0.5, t)), headYaw: 0.3 };
    if (t > E01) kp = { ...kp, yaw: 0.2, headYaw: 0.25 * Math.sin(t * 5), headPitch: -0.25 };
    ke = t > ST("D08") ? "smile" : "curious";
    if (t > E01) ke = "shock";
  }
  const kai = mk("kai", KAI, s, kp, ke, 1.1, { held: kHeld });
  actors.push(kai);
  if (kShadeOp > 0.01) {
    const sit = kp.legL > 1.2;
    kShadePose = sit ? sobSit(t, s, 1) : sobSit(t, s, 1, 1, 0.7);
    shades.push(own(kai, lx, kShadePose, { tears: 1 }, { op: kShadeOp * (lights > 0.5 ? 1 : 0) }));
  }
  // the shade under the dead light (always there), the locker tower (C09), notes on Kai's locker (from D05)
  items.push({ k: "shade", x0: 6.0, x1: 8.6, op: 1 });
  items.push({ k: "tower", p: [-8.0, 0, 2.0] });
  if (t > D05) {
    items.push({ k: "note", p: [KL - 0.12, 1.46, 0.006], text: ["ROUGH", "DAY?"], tilt: 0.08 });
    if (t > ST("D06") + 0.55) items.push({ k: "note", p: [KL + 0.13, 1.25, 0.007], text: ["HANG IN", "THERE :)"], c: "#9ef0c8", tilt: -0.1 });
  }
  // ---- Mr. Ollie: mopping the hall (D01..E02). No shade. No contact shadow.
  if (t > D01 - 0.4) {
    const ox = 3.6 + 0.08 * Math.sin(t * 0.7);
    const sweep = Math.sin(t * Math.PI * 2 * 0.55);
    let op = stand(ox, 2.6, -1.2 + 0.25 * sweep, SC.ollie, { armR: 0.75, armL: 0.6, outR: 0.05, outL: 0.05, twist: 0.25 * sweep, pitch: 0.08 });
    let oe: Emotion = "smile";
    if (t > ST("D04") && t < D05) oe = "sleep";
    if (t > ST("D08")) {
      op = lookAt({ ...op, twist: 0 }, SC.ollie, facePoint(kai.pose, s), ss(ST("D08"), ST("D08") + 0.4, t));
      op = { ...op, headPitch: op.headPitch + 0.12 * Math.max(0, Math.sin((t - ST("D08")) * 6)) * (1 - ss(ST("D08") + 0.6, ST("D08") + 1.0, t)) };
    }
    actors.push(mk("ollie", OLLIE, SC.ollie, op, oe, 9.9, { held: { side: "R", kind: "mop", tilt: [0.25 + 0.15 * sweep, 0.2 * sweep] }, blob: 0 }));
    items.push({ k: "bucket", p: [5.0, 0, 3.2] });
    // humming: notes drift up
    if (t > ST("D03") - 0.2 && t < D05 + 0.3) {
      const f = facePoint(op, SC.ollie);
      for (let i = 0; i < 3; i++) {
        const u = ((t - ST("D03")) * 0.7 + i / 3) % 1;
        items.push({ k: "text", p: [f[0] + 0.15 + 0.25 * Math.sin(u * 5 + i), f[1] + 0.15 + 0.7 * u, f[2] + 0.05], text: i % 2 ? "♫" : "♪", op: Math.sin(Math.PI * u), s: 0.55, color: "#4a7ad8" });
      }
    }
  }
  // the dark under the stairs / around the dead light
  return { set: "hall", lights, dead: 1, actors, shades, items, lx };
};

// ================================================================== F, H, J, K, L: the school yard
export const YK = { kai: [0.0, 0, 1.05] as V3, ollie: [-0.8, 0, 1.15] as V3 };
const yard = (t: number): Stage => {
  const lx = 0.45;
  const actors: Actor[] = [];
  const shades: Shade[] = [];
  const items: Item[] = [];
  const s = SC.kai, g = SC.ollie;
  const F01 = ST("F01"), F03 = ST("F03"), F07 = ST("F07");
  const door = -7.0;
  // ---- the kids: out of the door (F01), lined up along the wall (F03..), pointing (F04), Jay laughs (F05);
  //      they drift away before the talk (from F09)
  const KX = [-4.6, -3.3, 2.0, 3.3, 4.6, 6.0];
  const KZ = [1.3, 1.0, 1.25, 0.95, 1.35, 1.05];
  const looks = [JAY, PRIYA, KIDS[0], KIDS[1], KIDS[2], KIDS[3]];
  const point = ss(ST("F04") - 0.1, ST("F04") + 0.3, t) * (1 - ss(ST("F06"), ST("F06") + 0.4, t));
  const leave = ss(ST("F09"), ST("F10"), t);
  if (t < ST("F12")) {
    for (let i = 0; i < 6; i++) {
      const t0 = F01 - 0.8 + i * 0.18;
      const fromDoor = clamp((t - t0) / 1.4);
      let p: Pose;
      if (fromDoor < 1 && t < F03) {
        // out of the door, then toward the place
        const x = lerp(door, KX[i], ss(0, 1, fromDoor)), z = lerp(-0.1, KZ[i], ss(0, 0.6, fromDoor));
        p = { ...walk(x, z, yawOf(KX[i] - door, 1.4), t, t0, 0, SC.kid, {}, SINK), x, z };
        if (t < t0) continue;
      } else {
        const yaw0 = KX[i] < 0 ? 0.6 : -0.6;
        p = stand(KX[i] + (KX[i] > 0 ? 1 : -1) * 3.5 * leave, KZ[i] + 1.5 * leave, yaw0, SC.kid, {});
        if (point > 0.01 && (i === 1 || i === 2 || i === 3)) {
          const tgt: V3 = [YK.kai[0] + lx * YK.kai[2], 0.5, 0];
          p = lookAt({ ...p, yaw: yawOf(tgt[0] - p.x, -0.3) * point + yaw0 * (1 - point), armR: lerp(0.06, 1.45, point), outR: 0.05 }, SC.kid, tgt, point);
        }
        if (leave > 0.01) p = { ...walk(p.x, p.z, KX[i] > 0 ? 1.3 : -1.3, t, ST("F09"), 0, SC.kid, {}, SINK), x: p.x, z: p.z };
      }
      const laughing = i === 0 && t > ST("F05") - 0.1 && t < ST("F07");
      const a = mk(`kid${i}`, looks[i], SC.kid, laughing ? { ...p, headPitch: -0.25 + 0.05 * wave(t, 4), armL: 0.6, armR: 0.6 } : p, laughing ? "joy" : point > 0.5 ? "curious" : i % 2 ? "joy" : "happy", 5 + i);
      actors.push(a);
      const sp = laughing ? laughP(t, SC.kid) : i === 0 ? flex(t, SC.kid) : i === 1 ? shy(t, SC.kid) : i === 4 ? dance(t, SC.kid, i) : point > 0.3 && (i === 2 || i === 3) ? pointP(SC.kid, -1, t) : dance(t, SC.kid, i * 0.7);
      shades.push(own(a, lx, sp, { muscle: i === 0 && !laughing ? 1 : 0, hearts: i === 1 ? 1 : 0 }, { op: 1 - leave }));
    }
  }
  // ---- Kai
  const ST_ = (id: string) => ST(id);
  let kp: Pose;
  let ke: Emotion = "brave";
  const kx = YK.kai[0], kz = YK.kai[2];
  if (t < ST_("F03")) {
    // F02: out of the door into the sun, to his place
    const t0 = ST_("F02") - 0.3;
    const u = clamp((t - t0) / (F03 - t0));
    const x = lerp(door + 0.4, kx, ss(0, 1, u)), z = lerp(-0.6, kz, ss(0, 0.5, u));
    kp = { ...walk(x, z, yawOf(kx - door, 0.6), t, t0, 0, s, {}, SINK), x, z, headPitch: -0.15 };
    ke = "curious";
  } else {
    kp = stand(kx, kz, 0.15, s, {});
    ke = "brave";
    if (t > ST_("F04")) ke = "flat";
    if (t > ST_("F06")) ke = "sad";
    // shrinking (F06): head down, shoulders in
    const shrink = ss(ST_("F06"), ST_("F06") + 0.5, t) * (1 - ss(ST_("F08"), ST_("F08") + 0.5, t));
    kp = { ...kp, headPitch: 0.4 * shrink, pitch: 0.06 * shrink, armL: 0.25 * shrink, armR: 0.25 * shrink, outL: -0.04 * shrink, outR: -0.04 * shrink };
  }
  // Ollie (from F07): out of the door, along the wall, stops next to Kai (on his left, -x)
  let op: Pose | null = null;
  let oe: Emotion = "smile";
  let oHeld: HeldKind | undefined;
  const kneelU = ss(ST_("J01") - 0.1, ST_("J01") + 0.6, t) * (1 - ss(ST_("K08") - 0.1, ST_("K08") + 0.5, t));
  if (t > F07 - 0.3) {
    const arrive = ST_("F08") + 0.25;
    const ox = YK.ollie[0], oz = YK.ollie[2];
    if (t < arrive) {
      const u = clamp((t - (F07 - 0.3)) / (arrive - F07 + 0.3));
      const x = lerp(door + 0.2, ox, ss(0, 1, u)), z = lerp(0.3, oz, ss(0, 0.4, u));
      op = { ...walk(x, z, yawOf(ox - door, 0.5), t, F07, 0, g, {}, SINK), x, z, armR: 0.5 };
    } else {
      op = stand(ox, oz, 0.55, g, { armR: 0.5, outR: 0.05 });
    }
    oHeld = kneelU < 0.05 && t < ST_("K08") ? { side: "R", kind: "mop", tilt: [0.15, 0] } : undefined;
    // F14: leans on the mop; F16: looks up, remembering
    if (t > ST_("F14") - 0.1 && t < ST_("H01")) {
      const lean = ss(ST_("F14") - 0.1, ST_("F14") + 0.4, t);
      op = { ...op, pitch: 0.06 * lean, sway: -0.06 * lean, armR: lerp(0.5, 0.85, lean) };
    }
    if (t > ST_("F16") && t < ST_("H01")) op = { ...op, headPitch: -0.3 * ss(ST_("F16"), ST_("F16") + 0.5, t), headYaw: 0.25 };
    // H01: looks at Kai's shade on the wall; H02 on: at Kai
    const kaiFace = facePoint(kp, s);
    if (t > ST_("H01") - 0.1 && t < ST_("H02")) op = lookAt(op, g, [kx + lx * kz + 0.2, 0.5, 0], ss(ST_("H01") - 0.1, ST_("H01") + 0.3, t));
    else if (t > ST_("F09") && t < ST_("F14")) op = lookAt(op, g, kaiFace, 0.8);
    else if (t >= ST_("H02")) op = lookAt(op, g, kaiFace, ss(ST_("H02") - 0.1, ST_("H02") + 0.3, t));
    // J01: kneels down to Kai (facing him), J07: the hug, K06..K07: eyes closed, a hand on his chest
    if (kneelU > 0.001) {
      const yawK = yawOf(kx - ox, kz - oz);
      const hug = ss(ST_("J07") - 0.1, ST_("J07") + 0.5, t) * (1 - ss(ST_("K01") + 0.2, ST_("K01") + 0.8, t));
      const kp2 = kneel(ox + 0.1 * kneelU, oz, lerp(0.55, yawK, kneelU), g, kneelU, { armL: 0.2 + 1.15 * hug, armR: 0.2 + 1.15 * hug, outL: 0.05 - 0.25 * hug, outR: 0.05 - 0.25 * hug });
      op = lookAt({ ...kp2, headYaw: 0, headPitch: 0 }, g, kaiFace, 1 - hug * 0.5);
      const chest = ss(ST_("K06") - 0.1, ST_("K06") + 0.4, t);
      if (chest > 0.01) op = { ...op, armR: lerp(op.armR, 1.15, chest), outR: lerp(op.outR, -0.25, chest), headPitch: -0.15 * chest };
    }
    // K08..: stands, waves at his shade; L05: takes Kai's hand
    if (t > ST_("K08") - 0.1) {
      const w = ss(ST_("K08"), ST_("K08") + 0.4, t) * (1 - ss(ST_("L01") - 0.3, ST_("L01"), t));
      op = { ...op, outL: lerp(op.outL, 2.3, w) + 0.25 * w * wave(t, 2), armL: op.armL + 0.2 * w };
      const hold = ss(ST_("L05") - 0.1, ST_("L05") + 0.35, t);
      if (hold > 0.01) op = { ...op, yaw: lerp(op.yaw, 0.1, hold), outL: lerp(op.outL, -0.32, hold), armL: lerp(op.armL, 0.3, hold) };
    }
    oe = t > ST_("F13") ? "smile" : "happy";
    if (t > ST_("F16") && t < ST_("H01")) oe = "smile";
    if (t > ST_("H09") && t < ST_("J07")) oe = "brave";
    if (t > ST_("J07")) oe = "smile";
    if (t > ST_("K06") && t < ST_("K08")) oe = "sleep";
    if (t > ST_("K08")) oe = "joy";
    if (t > ST_("L01")) oe = "smile";
  }
  // Kai's acting with Ollie
  if (t > ST_("F09") - 0.1) {
    // F09: notices the wall; F13: looks up at Ollie
    const f = op ? facePoint(op, g) : [0, 1.6, 1];
    if (t < ST_("F13")) kp = lookAt({ ...kp, yaw: 0.15 }, s, [kx - 0.5, 0.6, 0], ss(ST_("F09"), ST_("F09") + 0.4, t));
    else kp = lookAt(kp, s, f as V3, 0.95);
    ke = t < ST_("F13") ? "curious" : t < ST_("H04") ? "curious" : "shock";
    if (t > ST_("H04") + 0.5) ke = "brave";
    if (t > ST_("H09")) ke = "sad";
    if (t > ST_("J02")) ke = "sad";
    if (t > ST_("J03") + 0.3) ke = "flat";
    if (t > ST_("J03b")) ke = "sad";
    if (t > ST_("J06") - 0.1) ke = "sob";
    if (t > ST_("K02")) ke = "sad";
    if (t > ST_("K03") + 0.3) ke = "curious";
    if (t > ST_("K06")) ke = "shock";
    if (t > ST_("K07")) ke = "smile";
    if (t > ST_("L01") && t < ST_("L03")) ke = "curious";
    if (t > ST_("L03")) ke = "smile";
    // turn toward Ollie when he kneels; J07: the hug (arms round him)
    if (kneelU > 0.01 && op) {
      const yawO = yawOf(op.x - kx, op.z - kz);
      kp = lookAt({ ...kp, yaw: lerp(kp.yaw, yawO, kneelU) }, s, facePoint(op, g), 1);
      const hug = ss(ST_("J07") - 0.1, ST_("J07") + 0.5, t) * (1 - ss(ST_("K01") + 0.2, ST_("K01") + 0.8, t));
      if (hug > 0.01) kp = { ...kp, armL: lerp(kp.armL, 1.25, hug), armR: lerp(kp.armR, 1.25, hug), outL: -0.2 * hug, outR: -0.2 * hug, headPitch: 0.15 * hug };
      // K01..: turns his head to the wall to watch his shade
      const watch = ss(ST_("K01") + 0.1, ST_("K01") + 0.6, t);
      if (watch > 0.01) kp = lookAt(kp, s, [kx + 0.2, 0.55, 0], watch);
    }
    if (t > ST_("K08") - 0.1) {
      kp = stand(kx, kz, 0.15, s, {});
      kp = lookAt(kp, s, [kx - 0.3, 0.6, 0], 0.8);
      // L01: looks down at his feet / the new shade
      const down = ss(ST_("L01") - 0.1, ST_("L01") + 0.4, t) * (1 - ss(ST_("L03") + 0.2, ST_("L03") + 0.7, t));
      kp = { ...kp, headPitch: lerp(kp.headPitch, 0.45, down), headYaw: lerp(kp.headYaw, 0.55, down) };
      const hold = ss(ST_("L05") - 0.1, ST_("L05") + 0.35, t);
      if (hold > 0.01) kp = { ...kp, outR: lerp(kp.outR, -0.42, hold), armR: lerp(kp.armR, 0.25, hold), headYaw: lerp(kp.headYaw, -0.45, hold), headPitch: lerp(kp.headPitch, -0.3, hold) };
    }
  }
  const kai = mk("kai", KAI, s, kp, ke, 1.1);
  actors.push(kai);
  if (op) actors.push(mk("ollie", OLLIE, g, op, oe, 9.9, { held: oHeld, blob: t > ST_("K07") ? ss(ST_("K07"), ST_("K07") + 0.8, t) : 0 }));
  // ---- Kai's shade: crying (sitting), stops (K01), lifts its head (K02), wipes (K03), stands (K04), walks to Ollie
  //      (K05), hugs him and becomes HIS shade (K06..K07); then a small new shade rises at Kai's feet (L02)
  const kxw = kx + lx * kz;
  const oxw = YK.ollie[0] + lx * YK.ollie[2];
  const K01 = ST_("K01"), K03 = ST_("K03"), K04 = ST_("K04"), K05 = ST_("K05"), K06 = ST_("K06"), K07 = ST_("K07");
  const stop = ss(K01, K01 + 0.6, t);
  const lift = ss(ST_("K02"), ST_("K02") + 0.5, t);
  let sp: Pose;
  let sx = kxw;
  let tears = 1 - stop;
  let ss_ = s;
  let k = 1.02 + 0.035 * kz;
  if (t < K04) {
    sx = kp.x + lx * kp.z;
    sp = sobSit(t, s, 1, 1 - stop * 0.9, 0.3);
    sp = { ...sp, headPitch: lerp(sp.headPitch, -0.15, lift), pitch: lerp(sp.pitch, 0.15, lift), armL: lerp(sp.armL, 0.5, lift), armR: lerp(sp.armR, 0.5, lift) };
    // the wipe: one arm sweeps across the face twice
    const wp = clamp((t - K03) / 0.8);
    if (wp > 0 && wp < 1) sp = { ...sp, armR: 1.8 + 0.25 * Math.sin(wp * Math.PI * 4), outR: 0.2 * Math.sin(wp * Math.PI * 2), headPitch: 0.1 };
  } else if (t < K05) {
    // stands up (a pop), turns to face Ollie (-x)
    const u = pop((t - K04) / 0.6);
    const sitP = sobSit(t, s, 1, 0.1, 0.3);
    const up = P0(-Math.PI / 2, s, {});
    sp = { ...up, y: lerp(sitP.y, up.y, clamp(u, 0, 1.1)), legL: lerp(sitP.legL, 0, clamp(u)), legR: lerp(sitP.legR, 0, clamp(u)), pitch: lerp(0.15, 0, clamp(u)), yaw: lerp(Math.PI / 2, -Math.PI / 2, ss(0.3, 0.9, (t - K04) / 0.6)) };
  } else if (t < K06) {
    // walks along the wall to Ollie's empty spot
    const v = (kxw - oxw) / (K06 - K05 - 0.1);
    sp = walk(0, 0, -Math.PI / 2, t, K05, 0, s, {}, SINK);
    sx = Math.max(oxw, kxw - v * (t - K05));
  } else {
    // K06: arrives, turns to the front, opens its arms and closes them round the spot where Ollie's shade belongs;
    // K07: grows into Ollie's shape, then mimics him
    sx = oxw;
    const open = ss(K06 - 0.05, K06 + 0.35, t), close = ss(K06 + 0.45, K06 + 0.9, t);
    sp = P0(0, s, { outL: lerp(0.05, 1.3, open) - 1.15 * close, outR: lerp(0.05, 1.3, open) - 1.15 * close, armL: 1.1 * close, armR: 1.1 * close, headPitch: 0.15 * close });
    const grow = ss(K07 - 0.1, K07 + 0.7, t);
    ss_ = lerp(s, g, grow);
    k = lerp(k, 1.02 + 0.035 * YK.ollie[2], grow);
    if (op && grow > 0.98) sp = { ...op, x: 0, z: 0 };
    tears = 0;
  }
  const kaiShade: Shade = { key: "kaiShade", x: sx, pose: sp, look: t > K07 + 0.3 ? OLLIE : KAI, s: ss_, k, op: 1, fx: { tears }, seed: 3 };
  if (t > F03 - 0.6 || t < F03) shades.push(kaiShade);
  // in F02 Kai is just out of the door: his shade sits by his feet already
  // the new small shade (L02..): rises from the floor at Kai's place, wipes its eyes, waves, holds hands (L05)
  if (t > ST_("L02") - 0.05) {
    const rise = ss(ST_("L02"), ST_("L02") + 0.9, t);
    let np = P0(0.25, s, {});
    const wipe = ss(ST_("L03") - 0.1, ST_("L03") + 0.3, t) * (1 - ss(ST_("L03") + 0.8, ST_("L03") + 1.1, t));
    if (wipe > 0.01) np = { ...np, armR: lerp(0.06, 1.95, wipe) + 0.15 * wave(t, 3) * wipe, outR: 0.1 };
    const hi = ss(ST_("L03") + 0.9, ST_("L03") + 1.2, t) * (1 - ss(ST_("L04") + 0.2, ST_("L04") + 0.6, t));
    if (hi > 0.01) np = { ...np, outR: lerp(np.outR, 2.1, hi) + 0.25 * hi * wave(t, 2.2), armR: lerp(np.armR, 0.2, hi) };
    const hold = ss(ST_("L05") - 0.1, ST_("L05") + 0.35, t);
    if (hold > 0.01) np = { ...np, yaw: lerp(np.yaw, -0.1, hold), outR: lerp(np.outR, -0.42, hold), armR: lerp(np.armR, 0.25, hold) };
    shades.push({ key: "newShade", x: kxw + 0.05, pose: { ...np, y: np.y * lerp(0.35, 1, rise) }, look: KAI, s: s * 0.82 * lerp(0.4, 1, rise), k: 1.0, op: rise, fx: { tears: 0.5 * (1 - ss(ST_("L03") + 0.6, ST_("L03") + 1.0, t)) }, seed: 4 });
  }
  return { set: "yard", lights: 1, dead: 0, actors, shades, items, lx };
};

// ================================================================== G: the flashback (hall, then home)
const flashHall = (t: number): Stage => {
  const lx = 0.42;
  const actors: Actor[] = [];
  const shades: Shade[] = [];
  const items: Item[] = [];
  const G01 = ST("G01"), G03 = ST("G03"), G04 = ST("G04"), G05 = ST("G05");
  const bx = -5.0, bz = 0.55;
  // the boy: sitting against the lockers, head down; stands up lighter at G05
  const up = ss(G05 + 0.5, G05 + 1.2, t);
  let bp = sitS(bx, bz, 0.2, SC.boy, { pitch: 0.3, armL: 1.2, armR: 1.2, outL: -0.05, outR: -0.05, headPitch: 0.45 });
  if (up > 0.01) {
    const st = stand(bx, bz + 0.2, 0.5, SC.boy, { headPitch: -0.1 });
    bp = { ...st, y: lerp(bp.y, st.y, up), legL: lerp(bp.legL, 0, up), legR: lerp(bp.legR, 0, up), pitch: lerp(0.3, 0, up), armL: lerp(1.2, 0.1, up), armR: lerp(1.2, 0.1, up), headPitch: lerp(0.45, -0.1, up) };
  }
  const boy = mk("boy", BOY, SC.boy, bp, up > 0.5 ? "joy" : t > ST("G02") ? "sob" : "sad", 2.7);
  actors.push(boy);
  // his shade: huge and slumped over him (the heavy sadness); light again when it is taken
  const heavy = 1 - ss(G05, G05 + 0.8, t);
  const hp = P0(0.2, SC.boy, { pitch: 0.55 * heavy, headPitch: 0.5 * heavy, armL: 0.5, armR: 0.5, outL: 0.1, outR: 0.1, bob: -0.02 });
  shades.push(own(boy, lx, heavy > 0.5 ? hp : { ...bp, x: 0, z: 0 }, {}, { k: lerp(1.06, 1.75, heavy), x: bx + lx * bz - 0.1 }));
  // young Ollie with his mop: sees him (G03), kneels (G04); his shade steps off the wall, sits with the boy's (G05)
  if (t > G03 - 0.6 || t > G01) {
    const ox = -2.9, oz = 1.5;
    const kn = ss(G04 - 0.1, G04 + 0.6, t);
    let op = stand(ox, oz, -1.1, SC.ollie, { armR: 0.5 });
    if (kn > 0.01) op = kneel(lerp(ox, -3.9, kn), lerp(oz, 1.0, kn), -1.35, SC.ollie, kn, { armL: 0.6 * kn, armR: 0.6 * kn });
    op = lookAt(op, SC.ollie, facePoint(bp, SC.boy), t > G03 - 0.2 ? 1 : 0);
    const ollie = mk("ollieY", OLLIE_YOUNG, SC.ollie, op, t > G04 ? "smile" : t > G03 ? "sad" : "happy", 9.1, { held: kn < 0.1 ? { side: "R", kind: "mop", tilt: [0.15, 0] } : undefined, blob: 1 - ss(G05, G05 + 0.8, t) });
    actors.push(ollie);
    const leave = ss(G04 + 0.3, G05 + 0.2, t);
    const oxw = op.x + lx * op.z;
    const bxw = bx + lx * bz + 0.45;
    if (leave < 0.01) shades.push(mimic(ollie, lx));
    else {
      // walks over to the boy's shade and sits down with it, taking the sadness (sobbing)
      const sitDown = ss(G05 - 0.1, G05 + 0.4, t);
      const wp = walk(0, 0, -Math.PI / 2, t, G04, 0, SC.ollie, {}, SINK);
      const sp = sitDown > 0.5 ? sobSit(t, SC.ollie, -1, sitDown, 1.3) : wp;
      shades.push({ key: "ollieYShade", x: lerp(oxw, bxw, ss(0, 1, leave)), pose: sp, look: OLLIE_YOUNG, s: SC.ollie, k: 1.06, op: 1, fx: { tears: sitDown }, seed: 7 });
    }
  }
  return { set: "hall", lights: 1, dead: 0, actors, shades, items, lx };
};
const flashHome = (t: number): Stage => {
  const lx = 0.5;
  const actors: Actor[] = [];
  const shades: Shade[] = [];
  const G06 = ST("G06");
  // the boy grown up, little Kai on the patio; the shade (Ollie's old shade) stands behind them, a hand on the
  // little shade's head, keeping watch
  const dp = stand(1.0, 1.2, 0.35, SC.adult, { outL: 0.35, armL: 0.25 });
  const dad = mk("dad", DAD, SC.adult, lookAt(dp, SC.adult, [1.55, 0.75, 1.35], 0.9), "smile", 3.9);
  actors.push(dad);
  const lp = stand(1.55, 1.35, -0.3, SC.small, { outR: 0.6, armR: 0.3 });
  const little = mk("little", KAI_SMALL, SC.small, lookAt(lp, SC.small, facePoint(dp, SC.adult), 0.9), "joy", 4.7);
  actors.push(little);
  const pat = Math.sin((t - G06) * 6) * 0.06;
  shades.push(own(dad, lx, P0(0.6, SC.adult, { pitch: 0.12, headPitch: 0.35, outR: -0.1, armR: 1.0 + pat, armL: 0.3 }), {}, { x: dp.x + lx * dp.z + 0.15 }));
  shades.push(mimic(little, lx));
  return { set: "home", lights: 1, dead: 0, actors, shades, items: [], lx };
};

// ================================================================== H05..H07: the memory (home, grey)
const memory = (t: number): Stage => {
  const lx = 0.5;
  const actors: Actor[] = [];
  const shades: Shade[] = [];
  const s = SC.kai;
  const kp = stand(1.2, 1.2, 0.05, s, { armL: 0.85, armR: 0.85, outL: -0.12, outR: -0.12, headPitch: 0.12 });
  const kai = mk("kai", KAI, s, kp, t > ST("H06") ? "brave" : "flat", 1.1, { held: { side: "R", kind: "photo" } });
  actors.push(kai);
  const mp = stand(0.35, 1.35, 0.5, SC.adult, { armR: 0.55, outR: -0.38, headPitch: 0.25 });
  actors.push(mk("mom", MOM, SC.adult, lookAt(mp, SC.adult, facePoint(kp, s), 1), "sad", 4.4));
  // H07: a neighbour pats him; Kai looks up and smiles
  if (t > ST("H07") - 0.3) {
    const pat = ss(ST("H07") - 0.1, ST("H07") + 0.3, t);
    const np = stand(2.0, 1.6, -0.8, SC.adult, { armL: 1.1 * pat + 0.05 * wave(t, 2) * pat, outL: 0.1 });
    actors.push(mk("neighbour", NEIGHBOUR, SC.adult, lookAt(np, SC.adult, facePoint(kp, s), 1), "sad", 2.2));
    actors[0] = { ...kai, emotion: "brave", pose: lookAt(kp, s, facePoint(np, SC.adult), pat) };
  }
  shades.push(own(kai, lx, sobStand(t, s, 1, 0.4), { tears: 1 }));
  // Mom's shade: a hand on the little shade's shoulder too, head bowed
  shades.push(own(actors[1], lx, { ...actors[1].pose, x: 0, z: 0, headPitch: 0.45 }));
  return { set: "home", lights: 1, dead: 0, actors, shades, items: [], lx };
};

// ================================================================== M: home at sunset
const ending = (t: number): Stage => {
  const lx = 0.5;
  const actors: Actor[] = [];
  const shades: Shade[] = [];
  const items: Item[] = [];
  const s = SC.kai, a = SC.adult;
  const M03 = ST("M03");
  const bench: V3 = [1.4, 0, 1.45];
  items.push({ k: "bench", p: bench });
  let kp: Pose, mp: Pose;
  let ke: Emotion = "smile", me: Emotion = "smile";
  if (t < M03) {
    // Mom kneels to Kai on the patio (M01), he tells her the truth (M02)
    kp = stand(1.75, 1.25, -1.2, s, {});
    mp = kneel(0.95, 1.4, 1.35, a, 1, { armL: 0.6, armR: 0.6, outL: -0.1, outR: -0.1 });
    ke = t > ST("M02") ? "sad" : "flat";
    me = "smile";
    kp = { ...kp, armR: 0.35 + 0.15 * Math.sin(t * 3), outR: 0.1 };
  } else {
    // on the bench: Kai cries a little, Mom's arm round him; it gets lighter
    kp = sitOn(bench[0] + 0.32, bench[2], 0.1, s, 0.42, { armL: 0.6, armR: 0.6, headPitch: 0.2 });
    mp = sitOn(bench[0] - 0.42, bench[2], 0.15, a, 0.42, { outR: 0.9, armR: 0.3, headYaw: -0.5, headPitch: 0.15 });
    ke = t > ST("M05") ? "smile" : t > ST("M04") ? "sob" : "sad";
    me = "smile";
    if (t > ST("M06")) {
      kp = { ...kp, headPitch: -0.1, headYaw: -0.3 };
      ke = "joy";
    }
  }
  const kai = mk("kai", KAI, s, kp, ke, 1.1);
  const mom = mk("mom", MOM, a, t < M03 ? lookAt(mp, a, facePoint(kp, s), 1) : mp, me, 4.4);
  actors.push(kai, mom);
  if (t < M03) actors[0] = { ...kai, pose: lookAt(kp, s, facePoint(mom.pose, a), 1) };
  // the shades: Kai's (small, his own) cries with him (M03, M04), they lean together, then stand and hold hands (M06)
  const kxw = (t < M03 ? kp.x : kp.x) + lx * kp.z;
  const mxw = mp.x + lx * mp.z;
  if (t < M03) {
    shades.push({ ...own(kai, lx, { ...actors[0].pose, x: 0, z: 0 }), s: s * 0.82 });
    shades.push(own(mom, lx, { ...mom.pose, x: 0, z: 0 }));
  } else {
    const stand2 = ss(ST("M06") - 0.1, ST("M06") + 0.6, t);
    const lean = ss(ST("M04"), ST("M04") + 0.6, t);
    let ks = sobSit(t, s, -1, 1 - lean * 0.6, 0.2);
    let ms = sitS(0, 0, Math.PI / 2, a, { pitch: 0.1, outR: 0.6, armR: 1.0, headPitch: 0.3 * lean });
    if (stand2 > 0.01) {
      ks = { ...P0(-0.15, s, { outL: -0.38, armL: 0.25 }), y: lerp(ks.y, P0(0, s).y, stand2) };
      ms = { ...P0(0.15, a, { outR: -0.32, armR: 0.25 }), y: lerp(ms.y, P0(0, a).y, stand2) };
    }
    if (stand2 < 0.5) {
      ks = { ...ks, y: ks.y + 0.42 };
      ms = { ...ms, y: ms.y + 0.42 };
    }
    shades.push({ key: "kaiShade", x: stand2 > 0.5 ? kxw - 0.1 : kxw - 0.25 * lean, pose: ks, look: KAI, s: s * 0.82, k: 1.05, op: 1, fx: { tears: (1 - lean) * (1 - stand2) }, seed: 5 });
    shades.push({ key: "momShade", x: stand2 > 0.5 ? kxw - 0.75 : mxw + 0.25 * lean, pose: ms, look: MOM, s: a, k: 1.05, op: 1, fx: {}, seed: 6 });
  }
  // M06: Ollie walks by on the sidewalk and waves, his shade walking with him on the garden wall
  if (t > ST("M05") + 0.4) {
    const t0 = ST("M05") + 0.4;
    let op = walk(-3.6, 2.0, Math.PI / 2, t, t0, 0.75, SC.ollie, {}, SINK);
    const w = ss(ST("M06") + 0.3, ST("M06") + 0.7, t);
    op = { ...op, outL: lerp(op.outL, 2.2, w) + 0.2 * w * wave(t, 2), headYaw: -0.7 * w };
    const ollie = mk("ollie", OLLIE, SC.ollie, op, "joy", 9.9, { held: { side: "R", kind: "mop", tilt: [0.2, 0] } });
    actors.push(ollie);
    shades.push(mimic(ollie, lx));
  }
  return { set: "home", lights: 1, dead: 0, actors, shades, items, lx };
};

/** doorways and windows on the shadow walls (x ranges): shades fade out over them */
export const HOLES: Record<SetName, [number, number][]> = { home: [[-3.3, -1.9], [-5.3, -3.9]], hall: [[-0.05, 1.25]], yard: [[-8.3, -5.7]] };

// ================================================================== the stage at t
export const stageAt = (t: number): Stage => {
  const { C01, F01, G01, G06, H01, H05, H08, M01 } = TK();
  const st = t < C01 ? homeIntro(t) : t < F01 ? hall(t) : t < G01 ? yard(t) : t < G06 ? flashHall(t) : t < H01 ? flashHome(t) : t < H05 ? yard(t) : t < H08 ? memory(t) : t < M01 ? yard(t) : ending(t);
  // the idle layer on everyone (never frozen) + blinks + contact shadows
  st.actors = st.actors.map((a) => {
    const live = alive({ key: a.key, look: a.look, pose: a.pose, emotion: a.emotion, s: a.s, blinkSeed: a.blinkSeed }, t);
    return { ...a, pose: live.pose, blink: a.blink ?? blinkAt(t, a.blinkSeed) };
  });
  // a shade over a doorway / window disappears into the dark there
  const holes = HOLES[st.set];
  st.shades = st.shades.map((sh) => {
    const half = 0.42 * sh.s * sh.k;
    let op = sh.op;
    for (const [a, b] of holes) {
      const gap = Math.max(a - (sh.x + half), sh.x - half - b);
      op *= clamp(gap / 0.4 + 0.2);
    }
    return { ...sh, op };
  });
  st.shades = st.shades.map((sh) => ({ ...sh, pose: alive({ key: sh.key, look: sh.look, pose: sh.pose, emotion: "flat", s: sh.s, blinkSeed: sh.seed }, t).pose }));
  for (const a of st.actors) if (a.blob > 0.02) st.items.push({ k: "blob", p: [a.pose.x, a.floor, a.pose.z], sx: 0.95 * a.s, sz: 0.7 * a.s, op: 0.55 * a.blob });
  return st;
};
export const actorOf = (st: Stage, key: string) => st.actors.find((a) => a.key === key);
export const shadeOf = (st: Stage, key: string) => st.shades.find((a) => a.key === key);
export const FACE = (st: Stage, key: string): V3 => {
  const a = actorOf(st, key);
  if (!a) throw new Error(`no actor ${key}`);
  return facePoint(a.pose, a.s);
};
/** the world point of a shade's head (on the wall) */
export const shadeHead = (sh: Shade): V3 => {
  const f = facePoint({ ...sh.pose, x: 0, z: 0 }, sh.s);
  return [sh.x + f[0] * sh.k, f[1] * sh.k, 0.02];
};
export { facePoint, hand, faceH, hash };
