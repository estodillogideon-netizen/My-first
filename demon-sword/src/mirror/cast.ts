// The cast of "The Town With No Mirrors": our own characters, anime-inspired (layered hair with a sheen, big coloured
// irises), dressed for a cold foggy town. Only Sora is alive; everyone else is a ghost (no shadows; blue at the end).
//   SORA     12: messy layered dark hair with a long side-swept fringe, grey-blue eyes; a charcoal duffel coat with
//            wooden toggles, a red knit scarf (the one warm colour in the fog). SORA_WET: the same, soaked.
//   GRANDMA  a silver bun with a wooden hairpin, warm brown eyes, a moss cardigan, an indigo apron, little glasses.
//   MINA     12, his best friend: long black hair with blunt bangs, amber eyes, a yellow raincoat.
//   ODA      the candy shop man: bald, a grey moustache, a striped headband, a brown apron over a cream shirt.
//   FOLK     townsfolk in muted coats; BABY / TODDLER: Sora small (the fire, the memories).
import type { Look } from "../blocky/Blocky";

const SKIN = "#f2c8a4";
export const SORA: Look = {
  skin: SKIN, shirt: "#3a3e48", pants: "#2a2c34", shoes: "#5a3a2a", sole: "#2a1a12", hair: "#20242e", hairStyle: "sora",
  accent: "#c8a070", print: "buttons", cheeks: "none", eyeScale: 1.34, iris: "#6a8ab8", cuffs: "#2a2e38",
  fabric: { top: "knit", bottom: "cotton" }, acc: { scarf: "#c8282e" },
};
export const SORA_WET: Look = { ...SORA, shirt: "#262a32", pants: "#1c1e24", hair: "#14171e", acc: { scarf: "#8a1a20" } };
export const GRANDMA: Look = {
  skin: "#eec4a0", shirt: "#5a6a4a", pants: "#3a3a48", shoes: "#3a2a22", sole: "#1e1612", hair: "#dcdce2", hairStyle: "bun",
  accent: "#a8783a", print: "none", cheeks: "blush", eyeScale: 1.05, iris: "#7a5a3a", fabric: { top: "knit", bottom: "cotton" },
  acc: { glasses: "#a88040", apron: "#2a3a6a" },
};
export const MINA: Look = {
  skin: "#f6d2b2", shirt: "#f2c22a", pants: "#3a3a4a", shoes: "#d8a820", sole: "#6a4a10", hair: "#16141c", hairStyle: "flow",
  accent: "#f2c22a", print: "none", cheeks: "blush", eyeScale: 1.36, lashes: true, iris: "#c8842a",
  fabric: { top: "cotton", bottom: "cotton" }, acc: { collar: "#e8b020" },
};
export const ODA: Look = {
  skin: "#e8b890", shirt: "#e8e0cc", pants: "#4a4038", shoes: "#3a2a22", sole: "#1e1612", hair: "#c8c8cc", hairStyle: "bald",
  accent: "#ffffff", print: "none", cheeks: "blush", eyeScale: 1.0, iris: "#5a4030", fabric: { top: "cotton", bottom: "cotton" },
  acc: { apron: "#7a4a2a", mustache: "#b8b8bc", headband: "#2a4a8a" },
};
export const BABY: Look = {
  skin: "#f6d0b0", shirt: "#f0e8d8", pants: "#f0e8d8", shoes: "#f0e8d8", sole: "#e8dcc8", hair: "#20242e", hairStyle: "tuft",
  accent: "#ffffff", print: "none", cheeks: "blush", eyeScale: 1.5, iris: "#6a8ab8", fabric: { top: "knit", bottom: "knit" },
};
export const TODDLER: Look = { ...SORA, hairStyle: "tuft", shirt: "#6a8ab8", pants: "#3a3e48", print: "none", acc: { scarf: "#c8282e" } };
const folk = (c: string, hair: string, hs: Look["hairStyle"], skin: string, iris: string, o: Partial<Look> = {}): Look => ({
  skin, shirt: c, pants: "#2e3038", shoes: "#3a2a22", sole: "#1e1612", hair, hairStyle: hs, accent: "#ffffff", print: "none", cheeks: "none",
  eyeScale: 1.1, iris, fabric: { top: "knit", bottom: "cotton" }, ...o,
});
export const FOLK: Look[] = [
  folk("#5a5048", "#2a2420", "ren", "#e8bc94", "#4a3a2a", { acc: { scarf: "#6a6a70" } }),
  folk("#4a5a6a", "#3a2418", "bob", "#f4caa4", "#6a4a3a", { lashes: true, cheeks: "blush" }),
  folk("#6a4a4a", "#d8d8dc", "bun", "#eec4a0", "#5a4a3a", { lashes: true }),
  folk("#3a4a44", "#1e1a1a", "haru", "#c8946a", "#2a2a2a", { acc: { hat: ["#3a3a40", "#5a4a3a"] } }),
  folk("#5a5a60", "#5a3a22", "pony2", "#f2c6a0", "#3a6a8a", { lashes: true, cheeks: "blush" }),
  folk("#4a4038", "#8a8a90", "ren", "#e8b48a", "#4a4a5a", { acc: { glasses: "#2a2a30" } }),
  folk("#2e3a4a", "#2a1a14", "flow", "#f6d0b0", "#7a4a3a", { lashes: true, cheeks: "blush" }),
  folk("#5a4a3a", "#3a3a3e", "haru", "#eec4a0", "#4a5a3a", { acc: { scarf: "#4a5a7a" } }),
  folk("#3a3438", "#6a4a2a", "bob", "#e8bc94", "#5a3a2a", { lashes: true }),
  folk("#48505a", "#2a2420", "ren", "#f2c6a0", "#3a3a4a", { acc: { cap: ["#2a2e38", "#2a2e38"] } }),
];
export const SC = { kid: 0.88, adult: 1.12, old: 1.02, baby: 0.34, toddler: 0.52 };
