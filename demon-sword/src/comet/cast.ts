// The cast of "The Comet Swap": our own characters, anime-inspired (swept / long / spiky hair with a sheen, big
// coloured irises, school uniforms, sailor collars, winter coats and scarves), textured fabrics.
//   KAI        12: swept dark-indigo hair, teal eyes. KAI_HOME (most shots): a sky-blue hoodie, grey joggers, socks.
//              KAI_SCHOOL: a charcoal blazer with an emerald tie and a crest.
//   MIRA       12, 25 years ago (Mom as a girl): long dark-brown hair, amber eyes (the same as Mom's), blush.
//              MIRA_PJ: pink pyjamas. MIRA_SCHOOL: a white sailor top, navy collar, red ribbon, navy skirt.
//              MIRA_WINTER: a red duffle coat and a white scarf (she runs to the lake in it).
//   LEO        7, her little brother: messy brown hair, amber eyes. LEO_PJ: star pyjamas. LEO_WINTER: a yellow puffer
//              coat, a red knit hat, a green scarf.
//   MOM        Mira grown up: the same long dark-brown hair and amber eyes, a cream cardigan.
//   UNCLE_LEO  Leo grown up: brown swept hair, amber eyes, a short beard, a red plaid flannel shirt.
//   FRIENDS    Mira's two classmates (sailor uniforms); TEACHER_OLD in a brown suit.
import type { Look } from "../blocky/Blocky";

const SKIN = "#f2c6a0";
const AMBER = "#d0902a";
export const KAI: Look = {
  skin: SKIN, shirt: "#4a86c8", pants: "#5a5e6a", shoes: "#f0f0f4", sole: "#ffffff", hair: "#262a48", hairStyle: "swept",
  accent: "#ffffff", print: "none", cheeks: "none", eyeScale: 1.3, iris: "#1ab8b0", pantsStyle: "joggers", cuffs: "#3a6aa8",
  fabric: { top: "knit", bottom: "cotton" }, acc: { hood: ["#4a86c8", "#3a6aa8"] },
};
export const KAI_HOME: Look = KAI;
export const KAI_SCHOOL: Look = {
  ...KAI, shirt: "#3a3e4a", pants: "#3a3e4a", tee: "#f8f6f0", pantsStyle: undefined, cuffs: undefined, kicks: "#1a8a5a",
  fabric: { top: "cord", bottom: "cotton" }, acc: { tie: "#1a8a5a", crest: "#3a3e4a" },
};
export const MIRA_PJ: Look = {
  skin: "#f6cca8", shirt: "#f4b8c8", pants: "#f4b8c8", shoes: "#ffffff", sole: "#ffe0e8", hair: "#3a2418", hairStyle: "long",
  accent: "#ff7aa0", print: "heart", cheeks: "blush", eyeScale: 1.4, lashes: true, iris: AMBER, cuffs: "#ffffff",
  fabric: { top: "cotton", bottom: "cotton" },
};
export const MIRA_SCHOOL: Look = {
  ...MIRA_PJ, shirt: "#f8f6f2", pants: "#f6cca8", shoes: "#3a2a22", sole: "#1e1612", print: "none", cuffs: undefined,
  acc: { collar: "#24305a", tie: "#d8202a", skirt: "#24305a" },
};
export const MIRA_WINTER: Look = {
  ...MIRA_PJ, shirt: "#c8282a", pants: "#3a3a48", shoes: "#5a3a2a", sole: "#2a1a12", print: "none", cuffs: "#a81e20",
  fabric: { top: "knit", bottom: "denim" }, acc: { scarf: "#f4f0ea", coat: "#c8282a" },
};
export const LEO_PJ: Look = {
  skin: "#f6cca8", shirt: "#6aa8e0", pants: "#6aa8e0", shoes: "#ffffff", sole: "#e0e8f0", hair: "#6a4228", hairStyle: "shaggy",
  accent: "#ffd23a", print: "star", cheeks: "blush", eyeScale: 1.5, iris: AMBER, fabric: { top: "cotton", bottom: "cotton" },
};
export const LEO_WINTER: Look = {
  ...LEO_PJ, shirt: "#f0c020", pants: "#3a4a6a", shoes: "#8a4a2a", sole: "#2a1a12", print: "none", cuffs: "#d8a010",
  fabric: { top: "knit", bottom: "denim" }, acc: { hat: ["#d8302a", "#f4f0ea"], scarf: "#2a8a4a", coat: "#f0c020" },
};
export const MOM: Look = {
  skin: SKIN, shirt: "#ead8bc", pants: "#4a5a7a", shoes: "#8a5a3a", sole: "#3a2a1e", hair: "#3a2418", hairStyle: "long",
  accent: "#ffffff", print: "none", cheeks: "blush", eyeScale: 1.15, lashes: true, iris: AMBER, tee: "#b85a6a",
  pantsStyle: "jeans", fabric: { top: "knit", bottom: "denim" },
};
export const UNCLE_LEO: Look = {
  skin: "#efc29a", shirt: "#b8302a", pants: "#3a3e4a", shoes: "#5a3a2a", sole: "#2a1a12", hair: "#6a4228", hairStyle: "swept",
  accent: "#ffffff", print: "none", cheeks: "none", eyeScale: 1.05, iris: AMBER, tee: "#3a3a40", pantsStyle: "jeans",
  fabric: { top: "plaid", bottom: "denim" }, acc: { beard: "#5a3820" },
};
const girl = (hair: string, hs: Look["hairStyle"], skin: string, iris: string, tie = "#d8202a"): Look => ({
  skin, shirt: "#f8f6f2", pants: skin, shoes: "#3a2a22", sole: "#1e1612", hair, hairStyle: hs, accent: "#ff5a9a", print: "none",
  cheeks: "blush", eyeScale: 1.35, lashes: true, iris, fabric: { top: "cotton", bottom: "cotton" }, acc: { collar: "#24305a", tie, skirt: "#24305a" },
});
export const FRIENDS: Look[] = [girl("#d8a040", "pony", "#f6d0b0", "#3a8ad8"), girl("#1e1a22", "twin", "#e8b48a", "#8a4ad8", "#2a6ad8")];
const boy = (hair: string, hs: Look["hairStyle"], skin: string, iris: string): Look => ({
  skin, shirt: "#24305a", pants: "#24305a", shoes: "#2a2a30", sole: "#ffffff", hair, hairStyle: hs, accent: "#ffffff", print: "none",
  cheeks: "none", eyeScale: 1.2, iris, tee: "#f8f6f0", fabric: { top: "cotton", bottom: "cotton" }, acc: { crest: "#24305a" },
});
export const CLASSMATES: Look[] = [boy("#2a2a2a", "spiky", "#c8946a", "#4a3a2a"), girl("#5a3a8a", "long", "#f2c6a0", "#8a4ad8"), boy("#e8c84a", "swept", "#f6d0b0", "#3a8ad8"), girl("#d84a3a", "twin", "#f6d0b0", "#3aa86a")];
export const TEACHER_OLD: Look = {
  skin: "#e8bc94", shirt: "#7a5a3a", pants: "#5a4a3a", shoes: "#3a2a1e", sole: "#1e1610", hair: "#5a5a5a", hairStyle: "swept",
  accent: "#ffffff", print: "none", cheeks: "none", eyeScale: 1.0, iris: "#4a3a2a", tee: "#e8e0d0", fabric: { top: "cord", bottom: "cotton" },
  acc: { glasses: "#2a2a30", tie: "#6a2a2a" },
};
/** townsfolk in winter coats (the street 25 years ago) */
const folk = (coat: string, pants: string, hair: string, hs: Look["hairStyle"], skin: string, iris: string, scarf: string, hat?: [string, string]): Look => ({
  skin, shirt: coat, pants, shoes: "#3a2a22", sole: "#1e1612", hair, hairStyle: hs, accent: "#ffffff", print: "none", cheeks: "none",
  eyeScale: 1.1, iris, fabric: { top: "knit", bottom: "denim" }, acc: { scarf, coat, ...(hat ? { hat } : {}) },
});
export const FOLK: Look[] = [
  folk("#3a5a7a", "#2a2a30", "#2a2220", "swept", "#e8bc94", "#4a3a2a", "#c8302a"),
  folk("#7a3a5a", "#3a3a48", "#c8a060", "long", "#f6d0b0", "#3a8ad8", "#f4f0ea", ["#3a3a48", "#c8302a"]),
  folk("#4a6a3a", "#2a2a30", "#5a3a22", "spiky", "#a8704a", "#2a2a2a", "#e8c040"),
  folk("#8a6a4a", "#3a3a48", "#d8d8d8", "pony", "#efc8a8", "#5a4a3a", "#5a7aa8", ["#5a7aa8", "#ffffff"]),
];
export const SC = { kid: 0.88, leo: 0.66, adult: 1.12 };
