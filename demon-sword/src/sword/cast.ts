// The cast of "The Sword That Can't Lie" (our own characters; every outfit textured):
//   REN     14, the youngest demon hunter: a deep-blue hunter's coat over a charcoal knit top, grey hakama-style
//           trousers, a white cloth headband with tails, black spiky hair, serious eyes
//   MEI     8, his little sister: a sunny yellow cotton jacket, a red plaid skirt, ginger pigtails with red bows, big
//           bright eyes; later small dark horns with ember tips (hornK grows)
//   GOROU   the captain: a big man in a dark crimson hunter's coat, black beard, grey hair tuft
//   HUNTERS the town's hunters: dark coats in slate, navy and plum, headbands
//   MOM     their mother (the memory): a white-and-gold coat, long dark hair puffs
//   FOLK    the townsfolk (day crowd)
import type { Look } from "../blocky/Blocky";

export const REN: Look = {
  skin: "#efc196", shirt: "#2e3446", pants: "#5a5e6a", shoes: "#1a1a1e", sole: "#0c0c0e", hair: "#16141a", hairStyle: "shaggy",
  accent: "#ffffff", print: "none", cheeks: "none", eyeScale: 1.12, cuffs: "#1e3a78", belt: "#1a1a22",
  fabric: { top: "knit", bottom: "cotton" }, acc: { coat: "#24448e", headband: "#f4f2ec", scarf: undefined },
};
export const MEI: Look = {
  skin: "#f6caa4", shirt: "#ffc93a", pants: "#c8302a", shoes: "#8a2a22", sole: "#3a1410", hair: "#c8541e", hairStyle: "puffs",
  accent: "#d8302a", print: "none", cheeks: "blush", eyeScale: 1.38, lashes: true, cuffs: "#e8a020",
  fabric: { top: "cotton", bottom: "plaid" }, acc: { bows: "#e8302a", skirt: "#c8302a" },
};
export const meiHorns = (k: number): Look => ({ ...MEI, acc: { ...MEI.acc, horns: "#2a1018", hornK: k } });
export const GOROU: Look = {
  skin: "#d8a070", shirt: "#3a1a1e", pants: "#2a2a30", shoes: "#141418", sole: "#08080a", hair: "#8a8a92", hairStyle: "tuft",
  accent: "#c8a040", print: "none", cheeks: "none", eyeScale: 0.95, cuffs: "#6a1a22", belt: "#c8a040",
  fabric: { top: "knit", bottom: "cotton" }, acc: { coat: "#7a1a24", beard: "#1a1414", headband: "#c8a040" },
};
const HUNT = ["#3a4a5a", "#22305a", "#4a2a4a", "#2a4a3a", "#5a3a2a"];
const SKINS = ["#efc196", "#c8865a", "#f6caa4", "#b07a50", "#e0a878"];
const HAIRS = ["#16141a", "#3a2418", "#5a3a22", "#1a120c", "#2a2a30"];
export const HUNTERS: Look[] = HUNT.map((c, i) => ({
  skin: SKINS[i], shirt: "#24242c", pants: "#3a3a44", shoes: "#141418", sole: "#08080a", hair: HAIRS[i], hairStyle: (["shaggy", "tuft", "shaggy", "bald", "shaggy"] as const)[i],
  accent: "#ffffff", print: "none", cheeks: "none", eyeScale: 1.0, cuffs: c, belt: "#1a1a1e",
  fabric: { top: "knit", bottom: "cotton" }, acc: { coat: c, headband: i % 2 ? "#e8e4dc" : "#8a2a2a" },
}));
export const MOM: Look = {
  skin: "#f2c8a0", shirt: "#f0ece0", pants: "#f0ece0", shoes: "#8a6a3a", sole: "#3a2a1a", hair: "#1a1218", hairStyle: "puffs",
  accent: "#c8a040", print: "none", cheeks: "blush", eyeScale: 1.1, lashes: true, cuffs: "#c8a040", belt: "#c8a040",
  fabric: { top: "cotton", bottom: "cotton" }, acc: { coat: "#e8e0cc", skirt: "#d8c8a0" },
};
export const REN_LITTLE: Look = { ...REN, acc: { scarf: "#24448e" }, eyeScale: 1.35 };
const SHIRTS = ["#c84a3a", "#3a8a5a", "#5a6ad0", "#d89a3a", "#8a4ab0", "#20a0a8", "#c8a030", "#d85a8a"];
export const FOLK: Look[] = Array.from({ length: 10 }, (_, i) => ({
  skin: SKINS[i % 5], shirt: SHIRTS[i % 8], pants: ["#3a3a4a", "#5a4a3a", "#2f3d66", "#6a5a4a"][i % 4], shoes: "#2a2a2a", sole: "#141414",
  hair: HAIRS[(i * 3) % 5], hairStyle: (["shaggy", "puffs", "tuft", "bald", "puffs"] as const)[i % 5], accent: "#ffffff",
  print: "none", cheeks: i % 3 ? "none" : "blush", eyeScale: 1.05,
  fabric: { top: (["knit", "plaid", "cotton", "knit"] as const)[i % 4], bottom: (["cotton", "cord", "plaid", "denim"] as const)[i % 4] },
  acc: i % 3 === 0 ? { coat: SHIRTS[(i + 3) % 8] } : i % 3 === 1 ? { scarf: SHIRTS[(i + 2) % 8] } : undefined,
}));
/** scales */
export const SC = { ren: 0.94, mei: 0.74, adult: 1.12, gorou: 1.26, little: 0.66, hunter: 1.1 };
