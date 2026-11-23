// The cast of "The Goodbye Monster" (our own characters; every outfit textured):
//   MILO      10, quiet and brave: teal knit sweater, brown corduroy trousers, red sneakers, a chunky red knit scarf
//   PIA       10, loud and fearless: a sunny yellow cotton raincoat with a navy bolt, denim jeans, green boots, ginger hair
//   MOM       Milo's mom: a camel cotton coat, her blue knit scarf
//   MAYOR     Mayor Grimble: a black top hat with a red band, white mustache, round glasses, a dark twill suit, red tie
//   OLD_MAN / OLD_WIFE (the hospital), BAKER, JUNE (the mayor's daughter, 40 years ago), TEACHER, the hook family,
//   and the townsfolk for Part 2.
import type { Look } from "../blocky/Blocky";
import { mix } from "../engine/util";

const SK = "#e9b98c";
export const MILO: Look = {
  skin: SK, shirt: "#2f8f9a", pants: "#6a4a32", shoes: "#e8402a", sole: "#ffffff", hair: "#2a1a12", hairStyle: "shaggy",
  accent: "#ffffff", print: "none", cheeks: "freckles", eyeScale: 1.25, cuffs: "#1f6f78",
  fabric: { top: "knit", bottom: "cord" }, acc: { scarf: "#d8302a" },
};
export const PIA: Look = {
  skin: "#c8865a", shirt: "#ffc928", pants: "#2a3a6a", shoes: "#2fa05a", sole: "#1a5a32", hair: "#c8501a", hairStyle: "shaggy",
  accent: "#2a3a6a", print: "bolt", cheeks: "freckles", eyeScale: 1.3, lashes: true, cuffs: "#e8a818",
  fabric: { top: "cotton", bottom: "denim" },
};
export const MOM: Look = {
  skin: SK, shirt: "#c89a6a", pants: "#3a3a4a", shoes: "#4a2e1c", sole: "#1e1612", hair: "#3a2418", hairStyle: "puffs",
  accent: "#3a2418", print: "none", cheeks: "blush", eyeScale: 1.1, lashes: true, cuffs: "#a87a4a",
  fabric: { top: "cotton", bottom: "denim" }, acc: { scarf: "#3a7ae0", coat: "#c89a6a" },
};
export const MAYOR: Look = {
  skin: "#f1c393", shirt: "#2a2a36", pants: "#2a2a36", shoes: "#141418", sole: "#0a0a0c", hair: "#e0e0e8", hairStyle: "tuft",
  accent: "#8a1a2a", print: "none", cheeks: "none", eyeScale: 0.95, cuffs: "#1a1a22",
  fabric: { top: "denim", bottom: "denim" }, acc: { hat: ["#16161c", "#8a1a2a"], mustache: "#e8e8f0", glasses: "#c8a040", tie: "#8a1a2a", coat: "#2a2a36" },
};
export const OLD_MAN: Look = {
  skin: "#e8b890", shirt: "#8a6a4a", pants: "#6a6a72", shoes: "#3a2a1e", sole: "#1a1410", hair: "#f0f0f4", hairStyle: "tuft",
  accent: "#6a4a2a", print: "none", cheeks: "none", eyeScale: 0.95, cuffs: "#6a4a2a",
  fabric: { top: "knit", bottom: "cord" }, acc: { glasses: "#3a3a44" },
};
export const OLD_WIFE: Look = {
  skin: "#f0c8a8", shirt: "#a8d0e8", pants: "#a8d0e8", shoes: "#ffffff", sole: "#ffffff", hair: "#d8d8e0", hairStyle: "puffs",
  accent: "#d8d8e0", print: "none", cheeks: "blush", eyeScale: 0.95, fabric: { top: "cotton", bottom: "cotton" },
};
export const BAKER: Look = {
  skin: "#c8865a", shirt: "#f4f0e6", pants: "#4a4a5a", shoes: "#2a2a2a", sole: "#1a1a1a", hair: "#2b1912", hairStyle: "bald",
  accent: "#c8a070", print: "none", cheeks: "blush", eyeScale: 1.0, fabric: { top: "cotton", bottom: "denim" }, acc: { apron: "#ffffff", hat: ["#ffffff", "#e8e0d0"] },
};
export const JUNE: Look = {
  skin: "#f1c393", shirt: "#e8a838", pants: "#f4e6d0", shoes: "#8a4a2a", sole: "#3a2a1a", hair: "#7a4a2a", hairStyle: "puffs",
  accent: "#7a4a2a", print: "none", cheeks: "blush", eyeScale: 1.15, lashes: true, fabric: { top: "knit", bottom: "cotton" }, acc: { skirt: "#c8603a" },
};
export const MAYOR_YOUNG: Look = { ...MAYOR, hair: "#4a3020", acc: { tie: "#8a1a2a", coat: "#2a2a36" } };
export const TEACHER: Look = {
  skin: "#b07a50", shirt: "#7a5ab0", pants: "#3a3a4a", shoes: "#2a1a1a", sole: "#1a1a1a", hair: "#1a120c", hairStyle: "puffs",
  accent: "#1a120c", print: "none", cheeks: "blush", eyeScale: 1.05, lashes: true, fabric: { top: "knit", bottom: "cotton" }, acc: { glasses: "#2a2a3a", skirt: "#3a3a4a" },
};
export const HOOK_KID: Look = {
  skin: "#f6c9a4", shirt: "#ff8a3a", pants: "#3a5ad0", shoes: "#ffffff", sole: "#e8402a", hair: "#c89040", hairStyle: "shaggy",
  accent: "#ffffff", print: "star", cheeks: "blush", eyeScale: 1.4, fabric: { top: "plaid", bottom: "cord" },
};
export const HOOK_MOM: Look = {
  skin: "#f6c9a4", shirt: "#4a9a6a", pants: "#2f3d66", shoes: "#f4f4f2", sole: "#c8c8c8", hair: "#c89040", hairStyle: "puffs",
  accent: "#c89040", print: "none", cheeks: "blush", eyeScale: 1.05, lashes: true, fabric: { top: "knit", bottom: "denim" },
};
const TONES = ["#f1c393", "#8a5a3a", "#c8865a", "#ffd0a8", "#b07a50", "#e9b98c"];
const SHIRTS = ["#e8402a", "#3a8a5a", "#5a6ad0", "#ff9a3a", "#8a4ab0", "#20a0a8", "#c8a030", "#d85a8a"];
const HAIRS = ["#1a120c", "#6a3a1e", "#c8501a", "#e0e0e8", "#3a2418", "#d8a030"];
/** the townsfolk: adults and kids in pyjamas, robes and coats (Part 2 crowd), deterministic variety */
export const TOWN: Look[] = Array.from({ length: 14 }, (_, i) => ({
  skin: TONES[i % 6], shirt: SHIRTS[i % 8], pants: ["#2f3d66", "#3a3a4a", "#5a4a3a", "#6a6a8a"][i % 4], shoes: "#ffffff", sole: "#3a3a3a",
  hair: HAIRS[(i * 5) % 6], hairStyle: (["shaggy", "puffs", "tuft", "bald", "shaggy", "puffs"] as const)[i % 6], accent: "#ffffff",
  print: (["none", "stripe", "star", "none", "heart", "none", "bolt"] as const)[i % 7], cheeks: i % 3 ? "none" : "blush", eyeScale: i % 4 === 1 ? 1.3 : 1.05,
  fabric: { top: (["knit", "plaid", "cotton", "knit"] as const)[i % 4], bottom: (["denim", "cord", "plaid", "cotton"] as const)[i % 4] },
  acc: i % 5 === 2 ? { scarf: SHIRTS[(i + 3) % 8] } : i % 5 === 4 ? { coat: SHIRTS[(i + 2) % 8] } : undefined,
}));
/** scales */
export const SC = { kid: 0.86, small: 0.66, adult: 1.15, mayor: 1.2, june: 1.05 };

/** the frozen look: every colour pulled toward cold stone (k = 0..1) */
const ICE = "#a9b8c8";
export const freeze = (l: Look, k: number): Look => {
  if (k < 0.01) return l;
  const f = (c: string) => mix(c, ICE, 0.78 * k);
  const acc = l.acc ? Object.fromEntries(Object.entries(l.acc).map(([key, v]) => [key, typeof v === "string" ? f(v) : Array.isArray(v) ? v.map(f) : v])) : undefined;
  return { ...l, skin: f(l.skin), shirt: f(l.shirt), pants: f(l.pants), shoes: f(l.shoes), sole: f(l.sole), hair: f(l.hair), accent: f(l.accent), cuffs: l.cuffs ? f(l.cuffs) : undefined, belt: l.belt ? f(l.belt) : undefined, acc: acc as Look["acc"] };
};
/** sepia (memories): every colour pulled toward warm brown */
export const sepiaLook = (l: Look, k = 0.3): Look => {
  const f = (c: string) => mix(c, "#b08a5a", k);
  const acc = l.acc ? Object.fromEntries(Object.entries(l.acc).map(([key, v]) => [key, typeof v === "string" ? f(v) : Array.isArray(v) ? v.map(f) : v])) : undefined;
  return { ...l, skin: f(l.skin), shirt: f(l.shirt), pants: f(l.pants), shoes: f(l.shoes), sole: f(l.sole), hair: f(l.hair), accent: f(l.accent), cuffs: l.cuffs ? f(l.cuffs) : undefined, acc: acc as Look["acc"] };
};
