// The cast of "The Villain Card": our own characters, anime-inspired (sharp spiky / swept / twin-tail hair, coloured
// irises, school uniforms with crests and ties, track jackets, sailor collars, capes on Hero Day), textured fabrics.
//   NOAH      12: spiky black hair with a blue sheen, steel-blue eyes; a navy school blazer (gold-edged crest) open over a
//             white shirt and a red tie, charcoal twill trousers, white sneakers with a red stripe. NOAH_G: + black gloves
//   MAX       12, his best friend: spiky orange hair, amber eyes; a red track jacket open over a white tee, black joggers
//             with a white stripe, red sneakers. MAX_HERO: + a gold cape (Hero Day)
//   ELLIE     7, Noah's little sister: brown twin tails with pink ties, big green eyes; a white sailor top with a navy
//             collar and a red bow, a navy pleated skirt, pink shoes
//   MOM       long dark hair, a cream cardigan, a bead necklace (it snaps)
//   MRS_LEE   an old neighbour: a grey bun (pony), round glasses, a lilac cardigan
//   TEACHER   Mr. Park: swept hair, glasses, a brown sweater vest over a blue shirt, a tie
//   KIDS      classmates in the same blazer uniform (other hair, colours); HEROES on Hero Day in capes
import type { Look } from "../blocky/Blocky";

const SKIN = "#f2c6a0";
export const NOAH: Look = {
  skin: SKIN, shirt: "#1e2a4e", pants: "#3a3c46", shoes: "#f4f4f2", sole: "#ffffff", hair: "#1a1c2a", hairStyle: "spiky",
  accent: "#ffffff", print: "none", cheeks: "none", eyeScale: 1.25, iris: "#3a7ad8", tee: "#f8f6f0", kicks: "#d8302a",
  fabric: { top: "cord", bottom: "cotton" }, acc: { tie: "#c8202a", crest: "#1e2a4e" },
};
export const NOAH_G: Look = { ...NOAH, gloves: "#1a1a20" };
/** Noah at home at night: a grey hoodie, gloves off */
export const NOAH_HOME: Look = { ...NOAH, shirt: "#5a6270", pants: "#26262e", tee: undefined, cuffs: "#3a4250", pantsStyle: "joggers", fabric: { top: "knit", bottom: "cotton" }, acc: {} };
export const MAX: Look = {
  skin: "#e8b48a", shirt: "#c8282a", pants: "#1e1e26", shoes: "#d8302a", sole: "#ffffff", hair: "#ff7a1a", hairStyle: "spiky",
  accent: "#ffffff", print: "none", cheeks: "none", eyeScale: 1.25, iris: "#e8a020", tee: "#f8f6f0", kicks: "#ffffff",
  pantsStyle: "joggers", cuffs: "#ffffff", fabric: { top: "cotton", bottom: "cotton" },
};
export const MAX_HERO: Look = { ...MAX, acc: { cape: ["#ffc81a", "#c8282a"] } };
export const MAX_HOME: Look = { ...MAX, shirt: "#3a4a6a", tee: undefined, cuffs: undefined, fabric: { top: "knit", bottom: "cotton" } };
export const ELLIE: Look = {
  skin: "#f6cca8", shirt: "#f8f6f2", pants: "#f6cca8", shoes: "#ff7aa8", sole: "#ffffff", hair: "#6a3a22", hairStyle: "twin",
  accent: "#ff5a9a", print: "none", cheeks: "blush", eyeScale: 1.5, lashes: true, iris: "#3aa86a",
  fabric: { top: "cotton", bottom: "cotton" }, acc: { collar: "#1e2a5a", tie: "#d8202a", skirt: "#1e2a5a" },
};
export const MOM: Look = {
  skin: SKIN, shirt: "#efe2c8", pants: "#4a5a7a", shoes: "#8a5a3a", sole: "#3a2a1e", hair: "#1e1a22", hairStyle: "long",
  accent: "#ffffff", print: "none", cheeks: "blush", eyeScale: 1.1, lashes: true, iris: "#6a4a2a", tee: "#c8506a",
  pantsStyle: "jeans", fabric: { top: "knit", bottom: "denim" }, acc: { necklace: "#f4f0f8" },
};
export const MOM_SNAPPED: Look = { ...MOM, acc: {} };
export const MRS_LEE: Look = {
  skin: "#efc8a8", shirt: "#a88ac8", pants: "#6a6070", shoes: "#4a3a3a", sole: "#2a2020", hair: "#c8c8cc", hairStyle: "pony",
  accent: "#a88ac8", print: "none", cheeks: "blush", eyeScale: 0.95, iris: "#5a4a3a", fabric: { top: "knit", bottom: "cotton" }, acc: { glasses: "#4a3a3a" },
};
export const TEACHER: Look = {
  skin: "#e8bc94", shirt: "#4a7ab8", pants: "#4a4a52", shoes: "#3a2a1e", sole: "#1e1610", hair: "#2a2220", hairStyle: "swept",
  accent: "#ffffff", print: "none", cheeks: "none", eyeScale: 1.0, iris: "#4a3a2a", tee: "#8a5a3a", fabric: { top: "cotton", bottom: "cotton" },
  acc: { glasses: "#2a2a30", tie: "#2a3a6a" },
};
const kid = (hair: string, hs: Look["hairStyle"], skin: string, iris: string, girl = false, tie = "#c8202a"): Look => ({
  skin, shirt: "#1e2a4e", pants: girl ? skin : "#3a3c46", shoes: "#2a2a30", sole: "#ffffff", hair, hairStyle: hs, accent: "#ff5a9a",
  print: "none", cheeks: girl ? "blush" : "none", eyeScale: girl ? 1.35 : 1.2, lashes: girl, iris, tee: "#f8f6f0",
  fabric: { top: "cord", bottom: "cotton" }, acc: girl ? { tie, crest: "#1e2a4e", skirt: "#3a2a4e" } : { tie, crest: "#1e2a4e" },
});
/** classmates in the school uniform */
export const KIDS: Look[] = [
  kid("#e8c84a", "swept", "#f6d0b0", "#3a8ad8"),
  kid("#3a2418", "long", "#e8b48a", "#8a5a2a", true),
  kid("#5a3a8a", "pony", "#f2c6a0", "#8a4ad8", true),
  kid("#2a2a2a", "spiky", "#c8946a", "#4a3a2a"),
  kid("#d84a3a", "twin", "#f6d0b0", "#3aa86a", true),
  kid("#6a4a2a", "swept", "#a8704a", "#2a2a2a"),
  kid("#e8e0d0", "long", "#f6d0b0", "#d84a6a", true),
  kid("#2a4a8a", "spiky", "#e8b48a", "#3ac8c8"),
];
/** the girl whose card bursts gold before Max (A04) */
export const GOLD_GIRL: Look = { ...KIDS[2] };
/** Hero Day: heroes in capes and bright suits */
const hero = (suit: string, cape: [string, string], hair: string, hs: Look["hairStyle"], iris: string, skin = "#f2c6a0", girl = false): Look => ({
  skin, shirt: suit, pants: suit, shoes: cape[1], sole: "#ffffff", hair, hairStyle: hs, accent: cape[0], print: "bolt", cheeks: girl ? "blush" : "none",
  eyeScale: girl ? 1.35 : 1.2, lashes: girl, iris, belt: cape[1], fabric: { top: "cotton", bottom: "cotton" }, acc: { cape },
});
export const LASER_HERO = hero("#2a3a8a", ["#d8202a", "#ffd23a"], "#2a2a30", "spiky", "#d82a2a");
export const ICE_HERO = hero("#e8f4ff", ["#3ab8f0", "#ffffff"], "#bfe6ff", "long", "#3ab8f0", "#f6d6c0", true);
export const STRONG_HERO = hero("#3a8a3a", ["#2a2a30", "#ffd23a"], "#6a3a1a", "swept", "#3a8a3a", "#a8704a");
export const HEROES = [LASER_HERO, ICE_HERO, STRONG_HERO, hero("#8a2a8a", ["#ffd23a", "#8a2a8a"], "#e8e0d0", "twin", "#d84ad8", "#f6d0b0", true)];
/** the crowd in the square (townsfolk, casual) */
const folk = (shirt: string, pants: string, hair: string, hs: Look["hairStyle"], skin: string, iris: string, girl = false): Look => ({
  skin, shirt, pants, shoes: "#f4f4f2", sole: "#ffffff", hair, hairStyle: hs, accent: "#ffffff", print: "none", cheeks: girl ? "blush" : "none",
  eyeScale: 1.15, lashes: girl, iris, fabric: { top: "cotton", bottom: "denim" }, pantsStyle: "jeans",
});
export const FOLK: Look[] = [
  folk("#3aa8a0", "#3a4a6a", "#2a1a12", "swept", "#e8b48a", "#4a3a2a"),
  folk("#ffb03a", "#5a5a6a", "#d8b060", "long", "#f6d0b0", "#3a8ad8", true),
  folk("#8a5ad8", "#2a2a3a", "#1a1a1a", "spiky", "#a8704a", "#2a2a2a"),
  folk("#e85a6a", "#3a5a8a", "#6a3a1a", "pony", "#f2c6a0", "#3aa86a", true),
  folk("#5a9a3a", "#4a3a2a", "#c8c8cc", "swept", "#efc8a8", "#5a4a3a"),
  folk("#f4f0e6", "#3a3c46", "#3a2418", "twin", "#c8946a", "#8a5a2a", true),
];
export const SC = { kid: 0.88, ellie: 0.66, adult: 1.12, old: 1.0 };
