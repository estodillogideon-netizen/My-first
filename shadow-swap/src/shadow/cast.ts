// The cast of "The Shadow Swap" (our own characters, one blocky family; new outfits, nothing reused from Laugh Lift):
//   KAI        the hero, ~10: mustard hoodie (hood + kangaroo pocket + drawstrings), dark jeans, red sneakers
//   OLLIE      the school janitor: navy work cap with a gold bill, white beard, blue-grey coveralls with an OLLIE patch,
//              a key ring on the belt
//   OLLIE_YOUNG  the same coveralls thirty years ago (dark hair, no beard)
//   BOY        Kai's dad as a boy (flashback): striped sky-blue tee, brown pants
//   DAD        Kai's dad grown up (flashback): green flannel shirt
//   MOM        plum cardigan with white cuffs
//   JAY, PRIYA, TEACHER, KIDS, NEIGHBOUR, MAILMAN
import type { Look } from "../blocky/Blocky";

const SK = "#e9b98c";
export const KAI: Look = {
  skin: SK, shirt: "#f2b233", pants: "#2f3d66", shoes: "#e8402a", sole: "#ffffff", hair: "#3a2418", hairStyle: "shaggy",
  accent: "#d89418", print: "none", cheeks: "none", eyeScale: 1.22, cuffs: "#d89418", acc: { hood: ["#e8a62a", "#d89418"] },
};
export const OLLIE: Look = {
  skin: "#d9a47a", shirt: "#5b7fa6", pants: "#5b7fa6", shoes: "#3a2a1e", sole: "#1a1410", hair: "#e8e8ec", hairStyle: "bald",
  accent: "#2a3f66", print: "patch", cheeks: "blush", eyeScale: 0.96, belt: "#2a2a34", cuffs: "#46658a",
  acc: { cap: ["#2a3f66", "#e8a62a"], beard: "#ececf0", keys: true },
};
export const OLLIE_YOUNG: Look = { ...OLLIE, hair: "#4a3020", hairStyle: "tuft", acc: { cap: ["#2a3f66", "#e8a62a"], keys: true }, cheeks: "none", eyeScale: 1.02 };
export const BOY: Look = {
  skin: SK, shirt: "#4aa0e0", pants: "#7a4a2a", shoes: "#f4f4f2", sole: "#3a3a3a", hair: "#3a2418", hairStyle: "shaggy",
  accent: "#ffffff", print: "stripe", cheeks: "none", eyeScale: 1.22,
};
export const DAD: Look = {
  skin: SK, shirt: "#3a8a5a", pants: "#2f3d66", shoes: "#4a2e1c", sole: "#1e1612", hair: "#3a2418", hairStyle: "shaggy",
  accent: "#2a6a44", print: "stripe", cheeks: "none", eyeScale: 1.02, cuffs: "#2a6a44", belt: "#3a2a1a",
};
export const KAI_SMALL: Look = { ...KAI, shirt: "#ff8a6a", cuffs: "#e8705a", acc: undefined, eyeScale: 1.35 };
export const MOM: Look = {
  skin: SK, shirt: "#9a4a7a", pants: "#2f3550", shoes: "#f4f4f2", sole: "#c75a8a", hair: "#3a2418", hairStyle: "puffs",
  accent: "#ffd8e8", print: "none", cheeks: "blush", eyeScale: 1.05, cuffs: "#ffffff",
};
export const JAY: Look = {
  skin: "#8a5a3a", shirt: "#2fbf5a", pants: "#3a3f78", shoes: "#ffffff", sole: "#2fbf5a", hair: "#1a120c", hairStyle: "shaggy",
  accent: "#ffffff", print: "num", cheeks: "none", eyeScale: 1.15, cuffs: "#ffffff",
};
export const PRIYA: Look = {
  skin: "#b07a50", shirt: "#ffb3c8", pants: "#5a3fc8", shoes: "#ffffff", sole: "#ff4f9a", hair: "#1a120c", hairStyle: "puffs",
  accent: "#e8234a", print: "heart", cheeks: "blush", eyeScale: 1.2,
};
export const TEACHER: Look = {
  skin: "#f1c393", shirt: "#eae6da", pants: "#4a4a5a", shoes: "#3a2a1a", sole: "#1a1a1a", hair: "#7a5a3a", hairStyle: "tuft",
  accent: "#c0303a", print: "none", cheeks: "none", eyeScale: 0.95, belt: "#2a2a2a", acc: { glasses: "#2a2a3a", tie: "#c0303a" },
};
export const KIDS: Look[] = [
  { skin: "#ffd0a8", shirt: "#ff8a1f", pants: "#2f63c9", shoes: "#ffffff", sole: "#2fd0bd", hair: "#d8a030", hairStyle: "shaggy", accent: "#ffffff", print: "bolt", cheeks: "freckles", cuffs: "#ffffff" },
  { skin: "#8a5a3a", shirt: "#7a5af0", pants: "#2a2a3a", shoes: "#ffffff", sole: "#ffd23a", hair: "#1a120c", hairStyle: "puffs", accent: "#ffd23a", print: "star", cheeks: "blush" },
  { skin: "#f1c393", shirt: "#e8302a", pants: "#3a3f78", shoes: "#ffffff", sole: "#2f63c9", hair: "#8a4a20", hairStyle: "shaggy", accent: "#ffffff", print: "stripe", cheeks: "none" },
  { skin: "#c8865a", shirt: "#20c0a8", pants: "#4a4a5a", shoes: "#ffffff", sole: "#ff4f9a", hair: "#2b1912", hairStyle: "puffs", accent: "#ffffff", print: "ring", cheeks: "none" },
  { skin: "#ffe0c0", shirt: "#ffd23a", pants: "#2a3a8a", shoes: "#ffffff", sole: "#e8402a", hair: "#c06030", hairStyle: "shaggy", accent: "#e8402a", print: "num", cheeks: "freckles" },
];
export const NEIGHBOUR: Look = {
  skin: "#ffd0a8", shirt: "#ffd23a", pants: "#3a8a5a", shoes: "#ffffff", sole: "#ff7a1a", hair: "#c0c0c8", hairStyle: "puffs", accent: "#ff7a1a", print: "heart", cheeks: "blush", eyeScale: 1.0,
};
export const MAILMAN: Look = {
  skin: "#c8865a", shirt: "#3a6ad0", pants: "#2a3a6a", shoes: "#1a1a22", sole: "#1a1a1a", hair: "#2b1912", hairStyle: "bald", accent: "#ffffff", print: "none", cheeks: "none", eyeScale: 1.0,
  belt: "#1a1a22", acc: { cap: ["#3a6ad0", "#ffffff"], bag: "#8a5a2a" },
};
/** scales: kids ~0.9, adults taller */
export const SC = { kai: 0.9, kid: 0.88, ollie: 1.2, adult: 1.15, boy: 0.88, small: 0.6 };
