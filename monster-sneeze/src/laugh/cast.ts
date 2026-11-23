// The cast of "Laugh Lift" (our own characters, one blocky family). One silhouette and one saturated colour each:
//   TOMO     the hero kid: big eyes, freckles, sky-blue shirt with a yellow star, the rocket backpack the rope ties to
//   GRANDPA  tall, bald top with grey tufts, round glasses, a grey mustache, maroon cardigan with a bow tie
//   RIKA     the best friend: puffs, purple shirt with a heart
//   CLOWN    red suit, red nose, rainbow-puff wig (the wig is a prop: it flies), giant shoes
//   MOM      teal dress shirt, a bun
//   FIRE     the firefighter: red helmet, red jacket
//   GUESTS   party kids and neighbours
import type { Look } from "../blocky/Blocky";

export const TOMO: Look = {
  skin: "#f1c393", shirt: "#2f9cf0", pants: "#2a3a8a", shoes: "#ffffff", sole: "#e8402a", hair: "#2b1912", hairStyle: "shaggy",
  accent: "#ffd23a", print: "star", cheeks: "freckles", eyeScale: 1.22, cuffs: "#ffd23a", belt: "#1f2a66", acc: { backpack: ["#ff4f6a", "#ffd23a"] },
};
export const GRANDPA: Look = {
  skin: "#e8b48a", shirt: "#8a2f4a", pants: "#4a4a5a", shoes: "#4a2e1c", sole: "#1e1612", hair: "#e6e6ea", hairStyle: "tuft",
  accent: "#ffd23a", print: "bow", cheeks: "none", eyeScale: 0.92, belt: "#3a2a1a", cuffs: "#c8a060", acc: { glasses: "#c89a40", mustache: "#e6e6ea" },
};
export const RIKA: Look = {
  skin: "#a7663c", shirt: "#9b5cf0", pants: "#2fb7a8", shoes: "#ffffff", sole: "#ff4f9a", hair: "#2b1912", hairStyle: "puffs",
  accent: "#ffd23a", print: "heart", cheeks: "blush", eyeScale: 1.18, cuffs: "#ffd23a",
};
export const CLOWN: Look = {
  skin: "#fbe6d2", shirt: "#e8302a", pants: "#2f7de1", shoes: "#e8302a", sole: "#ffd23a", hair: "#ffffff", hairStyle: "bald",
  accent: "#ffd23a", print: "ring", cheeks: "blush", eyeScale: 1.1, cuffs: "#ffffff", belt: "#ffd23a", acc: { nose: "#ff1f3a" },
};
export const MOM: Look = {
  skin: "#f1c393", shirt: "#20c0a8", pants: "#3a3f78", shoes: "#ffffff", sole: "#ff7a1a", hair: "#2b1912", hairStyle: "puffs",
  accent: "#ff7a1a", print: "heart", cheeks: "blush", cuffs: "#ffffff", belt: "#3a3f78",
};
export const FIRE: Look = {
  skin: "#c8865a", shirt: "#d9262a", pants: "#2a2a34", shoes: "#1a1a22", sole: "#ffd23a", hair: "#2b1912", hairStyle: "bald",
  accent: "#ffd23a", print: "star", cheeks: "none", belt: "#ffd23a", cuffs: "#ffd23a", acc: { helmet: ["#d9262a", "#ffd23a"] },
};
export const GUESTS: Look[] = [
  { skin: "#ffd0a8", shirt: "#ff8a1f", pants: "#2f63c9", shoes: "#ffffff", sole: "#2fd0bd", hair: "#d8a030", hairStyle: "shaggy", accent: "#ffffff", print: "bolt", cheeks: "freckles", cuffs: "#ffffff" },
  { skin: "#8a5a3a", shirt: "#ffd23a", pants: "#d9262a", shoes: "#ffffff", sole: "#2f63c9", hair: "#1a120c", hairStyle: "puffs", accent: "#ff4f9a", print: "heart", cheeks: "blush" },
  { skin: "#f1c393", shirt: "#7fd04a", pants: "#3a3f78", shoes: "#ffffff", sole: "#ff4f9a", hair: "#8a4a20", hairStyle: "shaggy", accent: "#ffffff", print: "star", cheeks: "none" },
  { skin: "#c8865a", shirt: "#ff5aa0", pants: "#2a3a8a", shoes: "#ffffff", sole: "#ffd23a", hair: "#2b1912", hairStyle: "shaggy", accent: "#ffffff", print: "ring", cheeks: "none" },
  { skin: "#ffe0c0", shirt: "#3ab0ff", pants: "#4a4a5a", shoes: "#3a2a1a", sole: "#1a1a1a", hair: "#c0c0c8", hairStyle: "tuft", accent: "#ffd23a", print: "bolt", cheeks: "none", acc: { glasses: "#3a3a4a" } },
];
/** scales: kids ~1, adults taller */
export const SC = { tomo: 0.92, rika: 0.9, grandpa: 1.22, clown: 1.12, mom: 1.12, fire: 1.18, kid: 0.88, adult: 1.1 };
/** the rope / kite string / jump rope colours */
export const ROPE = "#f0d9a8";
