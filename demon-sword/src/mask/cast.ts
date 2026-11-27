// The cast of "The Mask That Shows Your Enemy": our own characters, anime-inspired (curved layered hair with a sheen,
// big coloured irises, Japanese school uniforms, festival yukata), textured fabrics.
//   REN      12: spiky dark-navy hero hair, golden eyes. REN: a navy school jacket with brass buttons. REN_FEST: an
//            indigo yukata with a gold sash.
//   HARU     12, his best friend: soft ash-brown layered hair, lavender eyes, a beige cardigan over the uniform.
//            HARU_FEST: a charcoal yukata.
//   MOM      long dark hair, amber eyes, a cream apron over a rose top; MOM_FEST: a rose yukata.
//   GRANDMA  the mask maker: a silver bun with a red-bead hairpin, a plum kimono, a gold sash, little glasses.
//   TEACHER, LUNCH (the lunch lady), GIRLS / BOYS (classmates), FOLK (townsfolk in yukata)
import type { Look } from "../blocky/Blocky";

const SKIN = "#f4caa4";
const NAVY = "#1c2236";
export const REN: Look = {
  skin: SKIN, shirt: NAVY, pants: NAVY, shoes: "#f4f4f0", sole: "#d83030", hair: "#1c2440", hairStyle: "ren",
  accent: "#e8b848", print: "buttons", cheeks: "none", eyeScale: 1.32, iris: "#e8a020", cuffs: "#141a2a",
  fabric: { top: "cotton", bottom: "cotton" },
};
export const REN_FEST: Look = { ...REN, shirt: "#2a3a78", pants: "#2a3a78", print: "none", cuffs: undefined, belt: "#e0b040", shoes: "#c8a878", sole: "#4a2e1a", fabric: { top: "cotton", bottom: "cotton" } };
export const HARU: Look = {
  skin: "#f6d2b0", shirt: "#d8c49a", pants: NAVY, shoes: "#f4f4f0", sole: "#3a4a8a", hair: "#9a7e66", hairStyle: "haru",
  accent: "#ffffff", print: "none", cheeks: "blush", eyeScale: 1.3, iris: "#8a72d8", tee: "#f8f6f0", cuffs: "#c8b088",
  fabric: { top: "knit", bottom: "cotton" },
};
export const HARU_FEST: Look = { ...HARU, shirt: "#3a3a46", pants: "#3a3a46", tee: undefined, cuffs: undefined, belt: "#8a8ac0", shoes: "#c8a878", sole: "#4a2e1a", fabric: { top: "cotton", bottom: "cotton" } };
export const MOM: Look = {
  skin: SKIN, shirt: "#c86a6a", pants: "#4a4a5a", shoes: "#8a5a3a", sole: "#3a2a1e", hair: "#2e1c14", hairStyle: "flow",
  accent: "#ffffff", print: "none", cheeks: "blush", eyeScale: 1.15, lashes: true, iris: "#d0902a",
  fabric: { top: "knit", bottom: "cotton" }, acc: { apron: "#f4ecd8" },
};
export const MOM_FEST: Look = { ...MOM, shirt: "#c84a6a", pants: "#c84a6a", belt: "#f4d080", acc: {}, shoes: "#c8a878", sole: "#4a2e1a", fabric: { top: "cotton", bottom: "cotton" } };
export const GRANDMA: Look = {
  skin: "#eec4a0", shirt: "#5a3a6a", pants: "#5a3a6a", shoes: "#3a2a22", sole: "#1e1612", hair: "#dcdce4", hairStyle: "bun",
  accent: "#d8b060", print: "none", cheeks: "blush", eyeScale: 1.0, iris: "#6a5040", belt: "#d8b060",
  fabric: { top: "cotton", bottom: "cotton" }, acc: { glasses: "#b89040" },
};
export const TEACHER: Look = {
  skin: "#e8bc94", shirt: "#4a4e5a", pants: "#4a4e5a", shoes: "#2a2220", sole: "#1a1614", hair: "#2a2a30", hairStyle: "ren",
  accent: "#ffffff", print: "none", cheeks: "none", eyeScale: 1.0, iris: "#4a3a2a", tee: "#f4f2ec", fabric: { top: "cord", bottom: "cotton" },
  acc: { glasses: "#2a2a30", tie: "#2a4a8a" },
};
export const LUNCH: Look = {
  skin: "#eec09a", shirt: "#e8e4dc", pants: "#5a5a64", shoes: "#f4f4f0", sole: "#c8c8c8", hair: "#5a3a2a", hairStyle: "bob",
  accent: "#ffffff", print: "none", cheeks: "blush", eyeScale: 1.1, iris: "#6a4a2a", fabric: { top: "cotton", bottom: "cotton" },
  acc: { apron: "#ffffff", headband: "#ffffff" },
};
const girl = (hair: string, hs: Look["hairStyle"], skin: string, iris: string, tie = "#d8202a"): Look => ({
  skin, shirt: "#f8f6f2", pants: skin, shoes: "#3a2a22", sole: "#1e1612", hair, hairStyle: hs, accent: "#ff5a9a", print: "none",
  cheeks: "blush", eyeScale: 1.35, lashes: true, iris, fabric: { top: "cotton", bottom: "cotton" }, acc: { collar: "#1c2a5a", tie, skirt: "#1c2a5a" },
});
const boy = (hair: string, hs: Look["hairStyle"], skin: string, iris: string): Look => ({
  skin, shirt: NAVY, pants: NAVY, shoes: "#f4f4f0", sole: "#3a3a3a", hair, hairStyle: hs, accent: "#e8b848", print: "buttons",
  cheeks: "none", eyeScale: 1.25, iris, cuffs: "#141a2a", fabric: { top: "cotton", bottom: "cotton" },
});
export const CLASSMATES: Look[] = [
  girl("#1e1a26", "flow", "#f6d0b0", "#3a7ad8"),
  boy("#5a3a22", "haru", "#e8b48a", "#3a8a5a"),
  girl("#8a4a2a", "bob", "#f4caa4", "#c86a2a", "#2a6ad8"),
  boy("#14161e", "ren", "#c8946a", "#8a5a2a"),
  girl("#d86a8a", "pony2", "#f6d0b0", "#d84a8a"),
  boy("#c8a060", "haru", "#f6d0b0", "#3a8ad8"),
  girl("#2a2a5a", "bob", "#e8b48a", "#6a4ad8"),
  boy("#3a2a1e", "ren", "#f2c6a0", "#4a3a2a"),
  girl("#3a2418", "pony2", "#f2c6a0", "#2a8a8a"),
  boy("#6a6a74", "haru", "#eec4a0", "#5a5ad8"),
];
const folk = (c: string, belt: string, hair: string, hs: Look["hairStyle"], skin: string, iris: string, lashes = false): Look => ({
  skin, shirt: c, pants: c, shoes: "#c8a878", sole: "#4a2e1a", hair, hairStyle: hs, accent: "#ffffff", print: "none", cheeks: lashes ? "blush" : "none",
  eyeScale: 1.15, lashes, iris, belt, fabric: { top: "cotton", bottom: "cotton" },
});
export const FOLK: Look[] = [
  folk("#2a4a8a", "#f0c040", "#1e1a1a", "ren", "#e8bc94", "#4a3a2a"),
  folk("#e86a8a", "#ffffff", "#2a1a14", "flow", "#f6d0b0", "#8a4a2a", true),
  folk("#3a7a5a", "#e8d8a0", "#5a3a22", "haru", "#c8946a", "#2a2a2a"),
  folk("#f0a040", "#c83a2a", "#3a2418", "pony2", "#f2c6a0", "#3a6ad8", true),
  folk("#6a4a8a", "#f4d080", "#d8d8dc", "bun", "#eec4a0", "#5a4a3a", true),
  folk("#1e3a5a", "#d8d8d8", "#6a4a2a", "ren", "#f2c6a0", "#3a8a5a"),
  folk("#c8303a", "#f4f0e0", "#1e1a26", "bob", "#f6d0b0", "#d84a6a", true),
  folk("#4a4a54", "#8ab0d8", "#2a2a30", "haru", "#e8b48a", "#4a4a8a"),
];
export const SC = { kid: 0.88, adult: 1.12, old: 1.02 };
