// The cast of "The Last Text" (our own characters; cool, textured outfits):
//   NOAH     12: a navy bomber jacket open over a white tee, blue jeans with rolled cuffs and stitched pockets, white
//            sneakers with a red stripe, messy dark hair, freckles; NOAH_HOME: a grey hoodie and black joggers (night)
//   ELLIE    6: pink star pyjamas, a teddy; ELLIE_DAY: a yellow dress over a white tee; brown puffs with pink bows
//   FUTURE   Noah at 32: the same face and hair, a short dark beard, a soaked charcoal hoodie with the hood up, olive
//            cargo pants, dark boots
//   MOM, DAD, MAX (a red cap, a green tee, black joggers with a white stripe), ZOE (a purple jacket over a tee, beige
//   cargo pants)
import type { Look } from "../blocky/Blocky";

const NOAH_SKIN = "#efc196";
export const NOAH: Look = {
  skin: NOAH_SKIN, shirt: "#26385e", pants: "#3e5f8e", shoes: "#f4f4f2", sole: "#ffffff", hair: "#2a1a12", hairStyle: "shaggy",
  accent: "#ffffff", print: "none", cheeks: "freckles", eyeScale: 1.25, cuffs: "#c8302a", tee: "#f4f2ec", kicks: "#d8302a", pantsStyle: "jeans",
  fabric: { top: "denim", bottom: "denim" },
};
export const NOAH_HOME: Look = {
  ...NOAH, shirt: "#6a7480", pants: "#26262e", cuffs: "#4a5460", tee: undefined, pantsStyle: "joggers", kicks: undefined, shoes: "#3a3a44", sole: "#26262e",
  fabric: { top: "knit", bottom: "cotton" },
};
export const ELLIE: Look = {
  skin: "#f6caa4", shirt: "#ffb0c8", pants: "#ffb0c8", shoes: "#ffffff", sole: "#ffd0e0", hair: "#7a4a2a", hairStyle: "puffs",
  accent: "#ff6aa0", print: "star", cheeks: "blush", eyeScale: 1.5, lashes: true, fabric: { top: "cotton", bottom: "cotton" }, acc: { bows: "#ff5a9a" },
};
export const ELLIE_DAY: Look = {
  ...ELLIE, shirt: "#ffffff", pants: "#ffd23a", print: "none", shoes: "#ff6aa0", sole: "#ffffff", acc: { bows: "#ff5a9a", skirt: "#ffd23a" },
  fabric: { top: "cotton", bottom: "cotton" },
};
export const FUTURE: Look = {
  skin: NOAH_SKIN, shirt: "#3a3e48", pants: "#4e5236", shoes: "#2a2018", sole: "#141010", hair: "#2a1a12", hairStyle: "shaggy",
  accent: "#ffffff", print: "none", cheeks: "freckles", eyeScale: 1.1, cuffs: "#2a2e36", pantsStyle: "cargo",
  fabric: { top: "knit", bottom: "cotton" }, acc: { beard: "#2a1a12" },
};
export const futureHood = (up: boolean): Look => ({ ...FUTURE, acc: { ...FUTURE.acc, ...(up ? { hood: ["#3a3e48", "#2a2e36"] as [string, string] } : {}) } });
export const MOM: Look = {
  skin: "#efc196", shirt: "#c86a5a", pants: "#3a4a6a", shoes: "#f4f4f2", sole: "#e8e8e8", hair: "#3a2418", hairStyle: "puffs",
  accent: "#3a2418", print: "none", cheeks: "blush", eyeScale: 1.1, lashes: true, pantsStyle: "jeans", fabric: { top: "knit", bottom: "denim" },
};
export const DAD: Look = {
  skin: "#efc196", shirt: "#4a7a5a", pants: "#6a5a4a", shoes: "#3a2a1e", sole: "#1a1410", hair: "#2a1a12", hairStyle: "tuft",
  accent: "#ffffff", print: "none", cheeks: "none", eyeScale: 1.0, pantsStyle: "cargo", fabric: { top: "plaid", bottom: "cotton" }, acc: { glasses: "#2a2a30" },
};
export const MAX: Look = {
  skin: "#b07a50", shirt: "#3aa86a", pants: "#1e1e24", shoes: "#ffffff", sole: "#ffffff", hair: "#1a120c", hairStyle: "shaggy",
  accent: "#ffffff", print: "bolt", cheeks: "none", eyeScale: 1.2, pantsStyle: "joggers", kicks: "#3aa86a", fabric: { top: "cotton", bottom: "cotton" }, acc: { cap: ["#e8302a", "#ffffff"] },
};
export const ZOE: Look = {
  skin: "#f1c393", shirt: "#7a4ab0", pants: "#c8b48a", shoes: "#2a2a30", sole: "#ffffff", hair: "#e0a040", hairStyle: "puffs",
  accent: "#7a4ab0", print: "none", cheeks: "blush", eyeScale: 1.25, lashes: true, tee: "#f4f2ec", pantsStyle: "cargo", kicks: "#ffd23a", fabric: { top: "denim", bottom: "cotton" },
};
/** scales */
export const SC = { noah: 0.88, ellie: 0.66, adult: 1.12, future: 1.16 };
