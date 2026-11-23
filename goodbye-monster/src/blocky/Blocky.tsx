// Blocky: the parametric blocky character of this series (our own design; proportions in references/style.md).
// Rigid parts pivot at the shoulders, hips and neck (no elbows, no knees). The face is a flat decal drawn on a
// CanvasTexture, on a plane 4 mm proud of the head's flat front (never z-fights). Proportions live in SPEC (motion.ts);
// the group tree here mirrors coneMatrix() in motion.ts, so held props land exactly where the maths says.
import React from "react";
import * as THREE from "three";
import { CONE, GRIP, HAND, SCOOP_R, SCOOP_SEAT, SCOOP_STACK, SHOULDER_Y, shoulderXOf, SPEC, U } from "./motion";
import type { Emotion, Pose, V3 } from "./motion";
import { canvasTexture, geoOf, plastic, rbox } from "./mat";
import { mix } from "../engine/util";

/** false: no character part casts an engine shadow (in "The Shadow Swap" shadows are drawn as puppets) */
export const CastCtx = React.createContext(true);

export type Fabric = "knit" | "denim" | "plaid" | "cord" | "cotton";
export type HairStyle = "shaggy" | "puffs" | "antennae" | "antenna1" | "bald" | "tuft";
export type Look = {
  skin: string;
  shirt: string;
  pants: string;
  shoes: string;
  sole: string;
  hair: string;
  hairStyle: HairStyle;
  accent: string; // print / hair ties / antenna tips
  print: "bolt" | "heart" | "ring" | "star" | "bow" | "none" | "patch" | "stripe" | "num";
  cheeks: "freckles" | "blush" | "none";
  /** eye size (1 = the family default) */
  eyeScale?: number;
  /** long eyelashes (cute) */
  lashes?: boolean;
  /** fabric of the top / the bottom (default: knit top, denim bottom; same colour top + bottom = twill) */
  fabric?: { top?: Fabric; bottom?: Fabric };
  /** clothing details: a belt and sleeve cuffs (colours) */
  belt?: string;
  cuffs?: string;
  /** accessories (colours): a hat with a band, a shoulder bag, an apron, tiny round glasses, a rocket backpack */
  acc?: { hat?: [string, string]; bag?: string; apron?: string; glasses?: string; backpack?: [string, string]; nose?: string; mustache?: string; helmet?: [string, string]; cap?: [string, string]; beard?: string; hood?: [string, string]; tie?: string; keys?: boolean; bows?: string; skirt?: string; scarf?: string; coat?: string };
};
/** something held in one hand (kept upright in the world, like the cone) or hugged against the chest */
export type Held = { side: "L" | "R"; node: React.ReactNode; tilt?: [number, number] };
export type ConeProps = { side: "L" | "R"; scoops: number; colors: string[]; pop?: [number, number] };

const EDGE = 0.05 * U; // edge rounding of body parts
const DECAL_OFF = 0.0045; // m, decal planes stand this far off their surface

// ------------------------------------------------------------------ face decal
const FW = SPEC.head.w - 2 * SPEC.head.r; // flat front of the head (U)
const FH = SPEC.head.h - 2 * SPEC.head.r;
const faceTex = (emotion: Emotion, blink: boolean, cheeks: Look["cheeks"], es = 1, lashes = false) =>
  canvasTexture(`face|${emotion}|${blink ? 1 : 0}|${cheeks}|${es}|${lashes ? 1 : 0}`, 512, Math.round((512 * FH) / FW), (g, W, H) => {
    // face coordinates in U, origin = head centre, y up
    const X = (x: number) => (x / FW + 0.5) * W;
    const Y = (y: number) => (0.5 - y / FH) * H;
    const S = W / FW; // px per U
    const ink = "#17161c";
    g.clearRect(0, 0, W, H);
    g.lineCap = "round";
    g.lineJoin = "round";
    // cheeks
    if (cheeks === "none") {
      // no cheek marks
    } else if (cheeks === "blush") {
      g.fillStyle = "rgba(255,110,140,0.55)";
      for (const s of [-1, 1]) {
        g.beginPath();
        g.ellipse(X(s * 0.27), Y(-0.12), 0.075 * S, 0.04 * S, 0, 0, Math.PI * 2);
        g.fill();
      }
    } else {
      g.fillStyle = "rgba(150,80,40,0.75)";
      for (const s of [-1, 1])
        for (const [dx, dy] of [[0, 0], [0.05, 0.03], [0.07, -0.025]]) {
          g.beginPath();
          g.arc(X(s * (0.24 + dx)), Y(-0.1 + dy), 0.014 * S, 0, Math.PI * 2);
          g.fill();
        }
    }
    // eyes (~1/5 of the head width)
    const ex = 0.21, ey = 0.05;
    g.fillStyle = ink;
    g.strokeStyle = ink;
    for (const s of [-1, 1]) {
      const cx = X(s * ex), cy = Y(ey);
      if (emotion === "love" && !blink) {
        // heart eyes
        g.fillStyle = "#e8234a";
        g.beginPath();
        const r = 0.13 * es * S;
        g.moveTo(cx, cy + r * 0.95);
        g.bezierCurveTo(cx - r * 1.5, cy - r * 0.1, cx - r * 0.75, cy - r * 1.25, cx, cy - r * 0.45);
        g.bezierCurveTo(cx + r * 0.75, cy - r * 1.25, cx + r * 1.5, cy - r * 0.1, cx, cy + r * 0.95);
        g.fill();
        g.fillStyle = "#ffffff";
        g.beginPath();
        g.arc(cx - 0.04 * S, cy - 0.04 * S, 0.025 * S, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = ink;
        continue;
      }
      if (emotion === "sly" && !blink) {
        // half-lidded: the lower half of the oval, a flat lid line on top
        g.save();
        g.beginPath();
        g.rect(cx - 0.2 * S, cy - 0.01 * S, 0.4 * S, 0.3 * S);
        g.clip();
        g.beginPath();
        g.ellipse(cx + s * 0.02 * S, cy, 0.105 * es * S, 0.13 * es * S, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#ffffff";
        g.beginPath();
        g.arc(cx + 0.04 * S, cy + 0.04 * S, 0.022 * es * S, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = ink;
        g.restore();
        g.lineWidth = 0.04 * S;
        g.beginPath();
        g.moveTo(cx - 0.12 * S, cy - 0.01 * S);
        g.lineTo(cx + 0.12 * S, cy - 0.01 * S);
        g.stroke();
        continue;
      }
      if (emotion === "sleep" || emotion === "sob" || ((emotion === "smile" || emotion === "brave") && blink)) {
        // closed, relaxed: a soft downward arc
        g.lineWidth = 0.045 * S;
        g.beginPath();
        g.arc(cx, cy - 0.03 * S, 0.08 * S, Math.PI * 0.15, Math.PI * 0.85);
        g.stroke();
        continue;
      }
      if (emotion === "silly" && !blink) {
        // crossed eyes: each pupil squeezed toward the nose
        g.beginPath();
        g.ellipse(cx, cy, 0.11 * es * S, 0.14 * es * S, 0, 0, Math.PI * 2);
        g.fillStyle = "#ffffff";
        g.fill();
        g.lineWidth = 0.025 * S;
        g.stroke();
        g.fillStyle = ink;
        g.beginPath();
        g.arc(cx - s * 0.05 * S, cy + 0.02 * S, 0.06 * es * S, 0, Math.PI * 2);
        g.fill();
        continue;
      }
      if (blink) {
        g.lineWidth = 0.045 * S;
        g.beginPath();
        g.moveTo(cx - 0.085 * S, cy);
        g.lineTo(cx + 0.085 * S, cy);
        g.stroke();
      } else if (emotion === "joy" || emotion === "cry") {
        g.lineWidth = 0.055 * S;
        g.beginPath();
        g.arc(cx, cy + 0.05 * S, 0.09 * S, Math.PI * 1.1, Math.PI * 1.9);
        g.stroke();
        if (lashes) {
          g.lineWidth = 0.026 * S;
          g.beginPath();
          g.moveTo(cx + s * 0.085 * S, cy + 0.02 * S);
          g.lineTo(cx + s * 0.13 * S, cy - 0.02 * S);
          g.stroke();
        }
      } else {
        const big = (emotion === "shock" ? 1.14 : emotion === "sad" ? 0.94 : 1) * es;
        g.beginPath();
        g.ellipse(cx, cy, 0.105 * big * S, 0.15 * big * S, 0, 0, Math.PI * 2);
        g.fill();
        if (lashes) {
          // three little lashes flicking up and out from the top-outer edge
          g.lineWidth = 0.028 * S;
          for (const k of [0, 1, 2]) {
            const a = -Math.PI / 2 + s * (0.55 + 0.32 * k);
            const r0 = 0.15 * big;
            const px = cx + Math.cos(a) * 0.105 * big * S, py = cy + Math.sin(a) * r0 * S;
            g.beginPath();
            g.moveTo(px, py);
            g.lineTo(px + s * (0.03 + 0.012 * k) * S, py - (0.055 - 0.012 * k) * S);
            g.stroke();
          }
        }
        // catch-lights on every open eye: one big, one small (eyes read alive)
        g.fillStyle = "#ffffff";
        g.beginPath();
        g.arc(cx + 0.035 * big * S, cy - 0.06 * big * S, 0.034 * big * S, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.arc(cx - 0.035 * big * S, cy + 0.06 * big * S, 0.015 * big * S, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = ink;
      }
    }
    // one angled brow stroke each
    g.lineWidth = 0.05 * S;
    for (const s of [-1, 1]) {
      const by = (es - 1) * 0.14 + (emotion === "shock" ? 0.31 : emotion === "joy" || emotion === "love" || emotion === "smile" ? 0.29 : emotion === "curious" ? (s < 0 ? 0.33 : 0.25) : emotion === "sly" || emotion === "flat" ? 0.22 : emotion === "silly" ? (s < 0 ? 0.34 : 0.24) : emotion === "cry" ? 0.27 : 0.26);
      // angle: + = inner end up (sad/worried), - = inner end down
      const tilt = emotion === "sad" || emotion === "cry" || emotion === "sob" || emotion === "brave" ? 0.42 : emotion === "shock" ? 0.12 : emotion === "joy" || emotion === "love" || emotion === "smile" || emotion === "sleep" ? -0.05 : emotion === "sly" ? -0.4 : emotion === "flat" ? -0.12 : emotion === "curious" ? (s < 0 ? 0.2 : -0.15) : emotion === "silly" ? (s < 0 ? 0.3 : -0.2) : -0.08;
      const cx = s * 0.22, len = 0.085;
      g.beginPath();
      const dy = tilt * 0.12; // inner end up by dy, outer end down by dy
      g.moveTo(X(cx - s * len), Y(by + dy));
      g.lineTo(X(cx + s * len), Y(by - dy));
      g.stroke();
    }
    // mouth
    const my = -0.2;
    if (emotion === "flat") {
      g.lineWidth = 0.045 * S;
      g.beginPath();
      g.moveTo(X(-0.13), Y(my - 0.01));
      g.lineTo(X(0.13), Y(my - 0.01));
      g.stroke();
    } else if (emotion === "sob") {
      // an open, wobbly frown
      g.save();
      g.beginPath();
      g.ellipse(X(0), Y(my - 0.06), 0.15 * S, 0.12 * S, 0, Math.PI, Math.PI * 2);
      g.closePath();
      g.fillStyle = "#8a1a2e";
      g.fill();
      g.restore();
      g.strokeStyle = ink;
      g.lineWidth = 0.035 * S;
      g.beginPath();
      g.ellipse(X(0), Y(my - 0.06), 0.15 * S, 0.12 * S, 0, Math.PI, Math.PI * 2);
      g.closePath();
      g.stroke();
    } else if (emotion === "sleep" || emotion === "smile" || emotion === "brave") {
      g.lineWidth = 0.045 * S;
      g.beginPath();
      g.arc(X(0), Y(my + 0.06), 0.12 * S, Math.PI * 0.25, Math.PI * 0.75);
      g.stroke();
    } else if (emotion === "silly") {
      // a wobbly grin with the tongue out
      g.lineWidth = 0.045 * S;
      g.beginPath();
      g.moveTo(X(-0.17), Y(my + 0.02));
      g.quadraticCurveTo(X(0), Y(my - 0.08), X(0.17), Y(my + 0.02));
      g.stroke();
      g.fillStyle = "#ff6f8e";
      g.strokeStyle = ink;
      g.lineWidth = 0.03 * S;
      g.beginPath();
      g.ellipse(X(0.04), Y(my - 0.1), 0.07 * S, 0.09 * S, 0.2, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    } else if (emotion === "happy") {
      g.lineWidth = 0.045 * S;
      g.beginPath();
      g.arc(X(0), Y(my + 0.1), 0.15 * S, Math.PI * 0.22, Math.PI * 0.78);
      g.stroke();
    } else if (emotion === "sad") {
      g.lineWidth = 0.045 * S;
      g.beginPath();
      g.arc(X(0), Y(my - 0.12), 0.12 * S, Math.PI * 1.25, Math.PI * 1.75);
      g.stroke();
      // a tear
      g.fillStyle = "#6cc8ff";
      g.beginPath();
      g.ellipse(X(0.27), Y(-0.1), 0.028 * S, 0.045 * S, 0, 0, Math.PI * 2);
      g.fill();
    } else if (emotion === "sly") {
      // a one-sided smirk
      g.lineWidth = 0.045 * S;
      g.beginPath();
      g.moveTo(X(-0.14), Y(my + 0.01));
      g.quadraticCurveTo(X(0.06), Y(my - 0.07), X(0.19), Y(my + 0.07));
      g.stroke();
    } else if (emotion === "curious") {
      g.fillStyle = "#c81a36";
      g.strokeStyle = ink;
      g.lineWidth = 0.03 * S;
      g.beginPath();
      g.ellipse(X(0.03), Y(my - 0.02), 0.06 * S, 0.07 * S, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    } else if (emotion === "shock") {
      g.fillStyle = "#d61f3c";
      g.strokeStyle = ink;
      g.lineWidth = 0.03 * S;
      g.beginPath();
      g.ellipse(X(0), Y(my - 0.03), 0.1 * S, 0.13 * S, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    } else {
      // joy: a big open D mouth with a tongue
      g.save();
      g.beginPath();
      g.moveTo(X(-0.19), Y(my + 0.03));
      g.lineTo(X(0.19), Y(my + 0.03));
      g.ellipse(X(0), Y(my + 0.03), 0.19 * S, 0.17 * S, 0, 0, Math.PI);
      g.closePath();
      g.fillStyle = "#c81a36";
      g.fill();
      g.clip();
      g.fillStyle = "#ff8aa0";
      g.beginPath();
      g.ellipse(X(0), Y(my - 0.13), 0.11 * S, 0.07 * S, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
      g.strokeStyle = ink;
      g.lineWidth = 0.03 * S;
      g.beginPath();
      g.moveTo(X(-0.19), Y(my + 0.03));
      g.lineTo(X(0.19), Y(my + 0.03));
      g.ellipse(X(0), Y(my + 0.03), 0.19 * S, 0.17 * S, 0, 0, Math.PI);
      g.closePath();
      g.stroke();
    }
    if (emotion === "cry" || emotion === "sob") {
      g.fillStyle = "#6cc8ff";
      for (const s of [-1, 1]) {
        g.beginPath();
        g.roundRect(X(s * 0.21) - 0.03 * S, Y(-0.02), 0.06 * S, 0.2 * S, 0.03 * S);
        g.fill();
      }
    }
  });

// ------------------------------------------------------------------ fabric (multiplied into the clothes' colours)
/** knit: columns of little V stitches with soft shading (sweaters, shirts) */
const knitTex = () => {
  const t = canvasTexture("fabricKnit", 256, 256, (g, W) => {
    g.fillStyle = "#f4f4f4";
    g.fillRect(0, 0, W, W);
    const cols = 8, rows = 10, cw = W / cols, rh = W / rows;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const x = i * cw, y = j * rh;
        for (const s of [-1, 1]) {
          const gr = g.createLinearGradient(x + cw / 2, y, x + cw / 2 + s * cw * 0.45, y + rh);
          gr.addColorStop(0, "#ffffff");
          gr.addColorStop(1, "#d2d2d2");
          g.fillStyle = gr;
          g.beginPath();
          g.moveTo(x + cw / 2, y + rh * 0.95);
          g.lineTo(x + cw / 2 + s * cw * 0.46, y + rh * 0.05);
          g.lineTo(x + cw / 2 + s * cw * 0.46, y + rh * 0.45);
          g.lineTo(x + cw / 2 + s * cw * 0.06, y + rh * 1.25);
          g.closePath();
          g.fill();
        }
        g.fillStyle = "rgba(120,120,120,0.35)";
        g.fillRect(x + cw / 2 - 1, y, 2, rh);
      }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2.5, 2.5);
  return t;
};
/** denim / twill: fine diagonal ribs and a few slubs (trousers, coveralls) */
const denimTex = () => {
  const t = canvasTexture("fabricDenim", 256, 256, (g, W) => {
    g.fillStyle = "#e6e6ea";
    g.fillRect(0, 0, W, W);
    g.lineWidth = 3;
    for (let k = -W; k < W * 2; k += 8) {
      g.strokeStyle = (k / 8) % 2 ? "rgba(255,255,255,0.85)" : "rgba(150,150,165,0.55)";
      g.beginPath();
      g.moveTo(k, 0);
      g.lineTo(k + W, W);
      g.stroke();
    }
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.5)" : "rgba(110,110,130,0.35)";
      g.fillRect(r() * W, r() * W, 2 + r() * 8, 1.5);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
};

/** plaid / gingham: soft crossing bands (pyjamas) */
const plaidTex = () => {
  const t = canvasTexture("fabricPlaid", 256, 256, (g, W) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, W, W);
    const n = 4, c = W / n;
    g.fillStyle = "rgba(150,150,170,0.32)";
    for (let i = 0; i < n; i++) {
      g.fillRect(i * c, 0, c * 0.42, W);
      g.fillRect(0, i * c, W, c * 0.42);
    }
    g.fillStyle = "rgba(255,255,255,0.55)";
    for (let i = 0; i < n; i++) {
      g.fillRect(i * c + c * 0.62, 0, 2, W);
      g.fillRect(0, i * c + c * 0.62, W, 2);
    }
    // a fine weave
    g.fillStyle = "rgba(120,120,140,0.12)";
    for (let y = 0; y < W; y += 3) g.fillRect(0, y, W, 1);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1.6, 1.6);
  return t;
};
/** corduroy: soft vertical wales */
const cordTex = () => {
  const t = canvasTexture("fabricCord", 256, 256, (g, W) => {
    for (let x = 0; x < W; x += 8) {
      const gr = g.createLinearGradient(x, 0, x + 8, 0);
      gr.addColorStop(0, "#c8c8cc");
      gr.addColorStop(0.5, "#ffffff");
      gr.addColorStop(1, "#c8c8cc");
      g.fillStyle = gr;
      g.fillRect(x, 0, 8, W);
    }
    let seed = 3;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 200; i++) {
      g.fillStyle = "rgba(255,255,255,0.35)";
      g.fillRect(r() * W, r() * W, 1.5, 3 + r() * 6);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
};
/** brushed cotton: a fine soft weave with a little mottling */
const cottonTex = () => {
  const t = canvasTexture("fabricCotton", 256, 256, (g, W) => {
    g.fillStyle = "#f6f6f6";
    g.fillRect(0, 0, W, W);
    for (let y = 0; y < W; y += 4) {
      g.fillStyle = "rgba(170,170,180,0.22)";
      g.fillRect(0, y, W, 1.5);
    }
    for (let x = 0; x < W; x += 4) {
      g.fillStyle = "rgba(170,170,180,0.16)";
      g.fillRect(x, 0, 1.5, W);
    }
    let seed = 5;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.4)" : "rgba(140,140,150,0.14)";
      g.beginPath();
      g.arc(r() * W, r() * W, 4 + r() * 10, 0, Math.PI * 2);
      g.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
};
const fabricTex = (f: Fabric) => (f === "knit" ? knitTex() : f === "denim" ? denimTex() : f === "plaid" ? plaidTex() : f === "cord" ? cordTex() : cottonTex());

const printTex = (kind: Look["print"], color: string) =>
  canvasTexture(`print|${kind}|${color}`, 512, 512, (g, W) => {
    g.clearRect(0, 0, W, W);
    g.fillStyle = color;
    g.beginPath();
    if (kind === "bolt") {
      const p = [[0.58, 0.04], [0.22, 0.56], [0.47, 0.56], [0.36, 0.96], [0.8, 0.4], [0.54, 0.4], [0.7, 0.04]];
      p.forEach(([x, y], i) => (i ? g.lineTo(x * W, y * W) : g.moveTo(x * W, y * W)));
    } else if (kind === "star") {
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.2 : 0.46;
        const x = 0.5 + r * Math.cos(a), y = 0.53 + r * Math.sin(a);
        i ? g.lineTo(x * W, y * W) : g.moveTo(x * W, y * W);
      }
    } else if (kind === "ring") {
      // a little ringed planet: a ball and a tilted ring band
      g.arc(0.5 * W, 0.5 * W, 0.24 * W, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.lineWidth = 0.07 * W;
      g.strokeStyle = color;
      g.ellipse(0.5 * W, 0.5 * W, 0.46 * W, 0.13 * W, -0.35, 0, Math.PI * 2);
      g.stroke();
      return;
    } else if (kind === "none") {
      return;
    } else if (kind === "patch") {
      // a name patch on the left chest
      g.fillStyle = "#f4f0e6";
      g.beginPath();
      g.roundRect(0.56 * W, 0.08 * W, 0.4 * W, 0.2 * W, 0.04 * W);
      g.fill();
      g.strokeStyle = color;
      g.lineWidth = 0.025 * W;
      g.stroke();
      g.fillStyle = color;
      g.font = `bold ${0.12 * W}px Poppins, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("OLLIE", 0.76 * W, 0.185 * W);
      return;
    } else if (kind === "stripe") {
      g.fillRect(-0.5 * W, 0.3 * W, 2 * W, 0.16 * W);
      g.fillRect(-0.5 * W, 0.58 * W, 2 * W, 0.08 * W);
      return;
    } else if (kind === "num") {
      g.font = `900 ${0.78 * W}px Poppins, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("7", 0.5 * W, 0.56 * W);
      return;
    } else if (kind === "bow") {
      // a bow tie, high on the chest
      g.moveTo(0.5 * W, 0.2 * W);
      g.lineTo(0.12 * W, 0.04 * W);
      g.lineTo(0.12 * W, 0.4 * W);
      g.closePath();
      g.moveTo(0.5 * W, 0.2 * W);
      g.lineTo(0.88 * W, 0.04 * W);
      g.lineTo(0.88 * W, 0.4 * W);
      g.closePath();
      g.fill();
      g.beginPath();
      g.arc(0.5 * W, 0.21 * W, 0.08 * W, 0, Math.PI * 2);
    } else {
      g.moveTo(0.5 * W, 0.88 * W);
      g.bezierCurveTo(0.08 * W, 0.6 * W, 0.12 * W, 0.12 * W, 0.5 * W, 0.32 * W);
      g.bezierCurveTo(0.88 * W, 0.12 * W, 0.92 * W, 0.6 * W, 0.5 * W, 0.88 * W);
    }
    g.closePath();
    g.fill();
  });

// ------------------------------------------------------------------ hair kit
/** alien antennae on top of the head: thin stalks with glowing ball tips. ant: 0 relaxed, 1 straight up, -1 drooped */
const Antennae: React.FC<{ look: Look; ant: number; wob?: number; lift?: number }> = ({ look, ant, wob = 0, lift = 0 }) => {
  const cs = React.useContext(CastCtx);
  const H = SPEC.head;
  const stalk = plastic(look.hair, { rough: 0.45 });
  const tip = plastic(look.accent, { rough: 0.3, emissive: look.accent, ei: 0.35 });
  const len = 0.6 * U;
  const xs = look.hairStyle === "antennae" ? [-0.26, 0.26] : [0.08];
  const splay = ant >= 0 ? lerpN(0.38, 0.06, ant) : lerpN(0.38, 1.25, -ant);
  return (
    <>
      {xs.map((x) => {
        const s = x < 0 ? -1 : 1;
        return (
          <group key={x} position={[x * U * (lift ? 0.7 : 1), (H.h / 2 - 0.05) * U + lift, -0.05 * U]} rotation={[-0.12 + wob * (x < 0 ? 1 : 0.8), 0, -s * (xs.length === 1 ? 0.15 + splay * 0.4 : splay) + wob * 0.5 * s]}>
            <mesh geometry={geoOf("antStalk", () => new THREE.CylinderGeometry(0.011, 0.014, len, 8))} material={stalk} position={[0, len / 2, 0]} castShadow={cs} />
            <mesh geometry={geoOf("antTip", () => new THREE.IcosahedronGeometry(0.036, 2))} material={tip} position={[0, len + 0.02, 0]} castShadow={cs} />
          </group>
        );
      })}
    </>
  );
};
const HAT_CROWN = 0.5 * U; // the dad's hat crown height (antennae come out on top)
const lerpN = (a: number, b: number, u: number) => a + (b - a) * Math.min(1, Math.max(0, u));

const Hair: React.FC<{ look: Look; ant?: number; wob?: number }> = ({ look, ant = 0, wob = 0 }) => {
  const cs = React.useContext(CastCtx);
  if (look.hairStyle === "antennae" || look.hairStyle === "antenna1") return <Antennae look={look} ant={ant} wob={wob} lift={look.acc?.hat ? HAT_CROWN : 0} />;
  const H = SPEC.head;
  if (look.hairStyle === "bald") return null;
  if (look.hairStyle === "tuft") {
    // a grandpa: bald on top, grey tufts over the ears and round the back
    const m = plastic(look.hair, { rough: 0.7 });
    return (
      <>
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={rbox(0.2 * U, 0.42 * U, 0.7 * U, 0.08 * U)} material={m} position={[s * (H.w / 2 + 0.06) * U, 0.02 * U, -0.12 * U]} castShadow={cs} />
        ))}
        <mesh geometry={rbox((H.w + 0.1) * U, 0.4 * U, 0.2 * U, 0.08 * U)} material={m} position={[0, 0.0, -(H.d / 2 + 0.06) * U]} castShadow={cs} />
      </>
    );
  }
  const m = plastic(look.hair, { rough: 0.62 });
  const shaggy = look.hairStyle === "shaggy";
  const kx = (shaggy ? 0.85 : 0.92) * (H.w / 1.1);
  // the cap is built at the real head size (never narrower than the head); the other pieces are authored for a
  // 1.1 x 1.14 x 1.05 U head and scaled by kx (x), H.h/1.14 (y), H.d/1.05 (z)
  const cap = rbox((H.w + 0.08) * U, 0.5 * U, (H.d + 0.06) * U, 0.2 * U);
  const capY = 0.42 * U * (H.h / 1.14), capZ = -0.08 * U;
  const parts: { g: THREE.BufferGeometry; p: V3; r?: V3; mat?: THREE.Material }[] = [];
  if (shaggy) {
    // front fringe: chunky wedges over the forehead, bottom edge above the brows
    [-0.36, -0.12, 0.12, 0.36].forEach((x, i) =>
      parts.push({ g: rbox(0.3 * U, 0.34 * U, 0.15 * U, 0.04 * U), p: [x * U, 0.5 * U, 0.49 * U], r: [-0.28, 0, (i - 1.5) * 0.12] }),
    );
    // spikes on top
    [[-0.38, 0.1, 0.5], [0, 0.18, -0.2], [0.38, 0.06, -0.5], [-0.2, -0.3, 0.3], [0.24, -0.32, -0.3]].forEach(([x, z, rz]) =>
      parts.push({ g: rbox(0.36 * U, 0.36 * U, 0.36 * U, 0.06 * U), p: [x * U, 0.66 * U, z * U], r: [0.5 + z, 0.7, rz] }),
    );
    // side tufts and the back
    for (const s of [-1, 1]) parts.push({ g: rbox(0.18 * U, 0.55 * U, 0.62 * U, 0.05 * U), p: [s * (0.62 / kx) * (H.w / 1.1) * U, 0.22 * U, -0.08 * U], r: [0, 0, s * 0.08] });
    parts.push({ g: rbox(1.22 * U, 0.8 * U, 0.2 * U, 0.06 * U), p: [0, 0.12 * U, -0.54 * U] });
  } else {
    // bangs: one slanted slab; two round puffs with hair ties
    parts.push({ g: rbox(0.86 * U, 0.24 * U, 0.15 * U, 0.06 * U), p: [0.04 * U, 0.48 * U, 0.49 * U], r: [-0.25, 0, -0.1] });
    const puff = geoOf("puff", () => new THREE.IcosahedronGeometry(0.34 * U, 3)); // smooth: one material language
    const tie = plastic(look.accent, { rough: 0.35 });
    const bow = look.acc?.bows ? plastic(look.acc.bows, { rough: 0.4 }) : null;
    for (const s of [-1, 1]) {
      if (bow) {
        // a big bow on each pigtail: two flared loops and a knot, tilted out
        for (const k of [-1, 1])
          parts.push({ g: rbox(0.36 * U, 0.3 * U, 0.12 * U, 0.06 * U), p: [s * 0.5 * U + k * 0.17 * U, 0.6 * U + k * s * 0.0, -0.12 * U], r: [0, Math.PI / 2, s * 0.9 + k * 0.5], mat: bow });
        parts.push({ g: rbox(0.16 * U, 0.16 * U, 0.16 * U, 0.05 * U), p: [s * 0.5 * U, 0.6 * U, -0.12 * U], r: [0, 0, s * 0.9], mat: bow });
      }
      parts.push({ g: puff, p: [s * 0.66 * U, 0.6 * U, -0.12 * U] });
      parts.push({ g: geoOf("tie", () => new THREE.CylinderGeometry(0.12 * U, 0.12 * U, 0.1 * U, 12)), p: [s * 0.46 * U, 0.5 * U, -0.12 * U], r: [0, 0, s * 0.9], mat: tie });
    }
    parts.push({ g: rbox(1.16 * U, 0.55 * U, 0.2 * U, 0.06 * U), p: [0, 0.2 * U, -0.54 * U] });
  }
  // authored for a 1.1 x 1.14 x 1.05 U head; scaled to SPEC.head, and 8 % narrower so the hair never reads wider than the head
  return (
    <>
      <mesh geometry={cap} material={m} position={[0, capY, capZ]} castShadow={cs} receiveShadow />
      <group scale={[kx, H.h / 1.14, H.d / 1.05]}>
        {parts.map((q, i) => (
          <mesh key={i} geometry={q.g} material={q.mat ?? m} position={q.p} rotation={q.r} castShadow={cs} receiveShadow />
        ))}
      </group>
    </>
  );
};

// ------------------------------------------------------------------ held cone
/** pop = [width, height] scale of the top scoop (landing squash) */
export const Cone: React.FC<{ scoops: number; colors: string[]; pop?: [number, number] }> = ({ scoops, colors, pop = [1, 1] }) => {
  const cs = React.useContext(CastCtx);
  const cone = geoOf("cone", () => {
    const g = new THREE.ConeGeometry(CONE.r, CONE.h, 9, 1, false);
    g.rotateX(Math.PI); // tip down, rim at +h/2
    return g;
  });
  const ball = geoOf("scoop", () => new THREE.IcosahedronGeometry(SCOOP_R, 3));
  return (
    <>
      <mesh geometry={cone} material={plastic("#d99a4e", { rough: 0.7, flat: true })} castShadow={cs} receiveShadow />
      {Array.from({ length: scoops }, (_, i) => (
        <mesh key={i} geometry={ball} material={plastic(colors[i], { rough: 0.38 })} position={[0, CONE.h / 2 + SCOOP_SEAT + i * SCOOP_STACK, 0]} scale={i === scoops - 1 ? [pop[0], pop[1], pop[0]] : 1} castShadow={cs} receiveShadow />
      ))}
    </>
  );
};

// ------------------------------------------------------------------ the character
export const Blocky: React.FC<{ pose: Pose; look: Look; emotion: Emotion; blink?: boolean; cone?: ConeProps; held?: Held; held2?: Held; chest?: React.ReactNode; scale?: number; socks?: string }> = ({
  pose: p,
  look,
  emotion,
  blink = false,
  cone,
  held,
  held2,
  chest,
  scale = 1,
  socks,
}) => {
  const cs = React.useContext(CastCtx);
  const S = SPEC;
  const skin = plastic(look.skin, { rough: 0.42 });
  const hand = plastic(mix(look.skin, "#fff4e8", 0.28), { rough: 0.4 });
  const shirt = plastic(look.shirt, { rough: 0.72, map: fabricTex(look.fabric?.top ?? (look.shirt === look.pants ? "denim" : "knit")) });
  const pants = plastic(look.pants, { rough: 0.75, map: fabricTex(look.fabric?.bottom ?? "denim") });
  const shoes = plastic(socks ?? look.shoes, { rough: socks ? 0.8 : 0.45 });
  const sole = plastic(socks ?? look.sole, { rough: socks ? 0.8 : 0.5 });
  const face = plastic("#ffffff", { decal: true, rough: 0.45, map: faceTex(emotion, blink, look.cheeks, look.eyeScale ?? 1, look.lashes) });
  const print = plastic("#ffffff", { decal: true, rough: 0.55, map: printTex(look.print, look.accent) });
  const arm = (side: "L" | "R") => {
    const sx = side === "L" ? 1 : -1;
    const raise = side === "L" ? p.armL : p.armR;
    const out = side === "L" ? p.outL : p.outR;
    const top = S.arm.up * U; // arm top above the pivot
    const sl = S.sleeve * U;
    return (
      <group key={side} position={[sx * shoulderXOf(out), SHOULDER_Y, 0]} rotation={[0, 0, sx * out]}>
        <group rotation={[-raise, 0, 0]}>
          <mesh geometry={rbox((S.arm.w + 0.06) * U, sl, (S.arm.d + 0.06) * U, EDGE)} material={shirt} position={[0, top - sl / 2, 0]} castShadow={cs} receiveShadow />
          {look.cuffs ? <mesh geometry={rbox((S.arm.w + 0.1) * U, 0.14 * U, (S.arm.d + 0.1) * U, EDGE)} material={plastic(look.cuffs, { rough: 0.5 })} position={[0, top - sl + 0.05 * U, 0]} castShadow={cs} /> : null}
          <mesh geometry={rbox(S.arm.w * U, (S.arm.h - S.sleeve + 0.02) * U, S.arm.d * U, EDGE)} material={skin} position={[0, top - sl - ((S.arm.h - S.sleeve - 0.02) * U) / 2, 0]} castShadow={cs} receiveShadow />
          {/* hand: a lighter end cap, so a raised arm doesn't read as a plain box */}
          <mesh geometry={rbox((S.arm.w + 0.03) * U, 0.26 * U, (S.arm.d + 0.03) * U, EDGE)} material={hand} position={[0, -HAND + 0.12 * U, 0]} castShadow={cs} receiveShadow />
          {cone && cone.side === side ? (
            <group position={[0, -HAND - GRIP, 0]}>
              <group rotation={[raise, 0, -sx * out]}>
                <group rotation={[-p.pitch, -(p.twist ?? 0), -(p.sway ?? 0), "ZYX"]}>
                  <group rotation={[p.coneTilt?.[0] ?? 0, 0, p.coneTilt?.[1] ?? 0]}>
                    <group position={[0, -0.02, 0]}>
                      <Cone scoops={cone.scoops} colors={cone.colors} pop={cone.pop} />
                    </group>
                  </group>
                </group>
              </group>
            </group>
          ) : null}
          {held2 && held2.side === side ? (
            <group position={[0, -HAND - GRIP, 0]}>
              <group rotation={[raise, 0, -sx * out]}>
                <group rotation={[-p.pitch, -(p.twist ?? 0), -(p.sway ?? 0), "ZYX"]}>
                  <group rotation={[held2.tilt?.[0] ?? 0, 0, held2.tilt?.[1] ?? 0]}>{held2.node}</group>
                </group>
              </group>
            </group>
          ) : null}
          {held && held.side === side ? (
            <group position={[0, -HAND - GRIP, 0]}>
              <group rotation={[raise, 0, -sx * out]}>
                <group rotation={[-p.pitch, -(p.twist ?? 0), -(p.sway ?? 0), "ZYX"]}>
                  <group rotation={[held.tilt?.[0] ?? 0, 0, held.tilt?.[1] ?? 0]}>{held.node}</group>
                </group>
              </group>
            </group>
          ) : null}
        </group>
      </group>
    );
  };
  const leg = (side: "L" | "R") => {
    const sx = side === "L" ? 1 : -1;
    const sw = side === "L" ? p.legL : p.legR;
    const pantsH = (S.leg.h - S.shoe.h + 0.03) * U;
    const shoeH = S.shoe.h * U;
    return (
      <group key={side} position={[sx * S.hipX * U, 0, 0]} rotation={[-sw, 0, 0]}>
        <mesh geometry={rbox(S.leg.w * U, pantsH, S.leg.d * U, EDGE)} material={pants} position={[0, -pantsH / 2, 0]} castShadow={cs} receiveShadow />
        <mesh geometry={rbox(S.shoe.w * U, shoeH * 0.78, S.shoe.d * U, EDGE)} material={shoes} position={[0, -S.leg.h * U + shoeH * 0.22 + (shoeH * 0.78) / 2, 0]} castShadow={cs} receiveShadow />
        <mesh geometry={rbox((S.shoe.w + 0.02) * U, shoeH * 0.24, (S.shoe.d + 0.02) * U, 0.02 * U)} material={sole} position={[0, -S.leg.h * U + (shoeH * 0.24) / 2 + 0.002, 0]} castShadow={cs} receiveShadow />
      </group>
    );
  };
  const H = S.head;
  return (
    <group position={[p.x, p.y, p.z]} rotation={[0, p.yaw, 0]} scale={scale}>
      <group rotation={[p.pitch, 0, 0]}>
        {leg("L")}
        {leg("R")}
        <group position={[0, p.bob ?? 0, 0]} rotation={[0, p.twist ?? 0, p.sway ?? 0]}>
        <mesh geometry={rbox(S.torso.w * U, S.torso.h * U, S.torso.d * U, EDGE)} material={shirt} position={[0, (S.torso.h * U) / 2, 0]} castShadow={cs} receiveShadow />
        <mesh geometry={geoOf("printPlane", () => new THREE.PlaneGeometry(1.15 * U, 1.15 * U))} material={print} position={[0, 1.12 * U, (S.torso.d * U) / 2 + DECAL_OFF]} />
        {arm("L")}
        {arm("R")}
        {chest ? <group position={[0, 1.0 * U, (S.torso.d * U) / 2]}>{chest}</group> : null}
        <BodyAcc look={look} />
        <group position={[0, (S.torso.h + H.gap) * U, 0]} rotation={[0, p.headYaw, 0]}>
          <group rotation={[p.headPitch, 0, 0]}>
            <group position={[0, (H.h * U) / 2, 0]}>
              <mesh geometry={rbox(H.w * U, H.h * U, H.d * U, H.r * U)} material={skin} castShadow={cs} receiveShadow />
              <mesh geometry={geoOf("facePlane", () => new THREE.PlaneGeometry(FW * U, FH * U))} material={face} position={[0, 0, (H.d * U) / 2 + DECAL_OFF]} />
              <Hair look={look} ant={p.ant ?? 0} wob={p.antWob ?? 0} />
              <HeadAcc look={look} />
            </group>
          </group>
        </group>
        </group>
      </group>
    </group>
  );
};

export const KID_A: Look = { skin: "#f1c393", shirt: "#f5c400", pants: "#2f63c9", shoes: "#f4f4f2", sole: "#e8402a", hair: "#ff6a12", hairStyle: "shaggy", accent: "#ff5a1f", print: "bolt", cheeks: "freckles" };
export const KID_B: Look = { skin: "#a7663c", shirt: "#ff4d94", pants: "#5a3fc8", shoes: "#ffffff", sole: "#2fb7a8", hair: "#2b1912", hairStyle: "puffs", accent: "#2fd0bd", print: "heart", cheeks: "blush" };
export const SCOOPS_A = ["#7fe3b8", "#ff8db2"]; // mint, strawberry

// ------------------------------------------------------------------ accessories (silhouette makers)
/** on the head: the dad's hat (brim, crown, band), the seller's tiny round glasses */
const HeadAcc: React.FC<{ look: Look }> = ({ look }) => {
  const cs = React.useContext(CastCtx);
  const H = SPEC.head;
  const a = look.acc;
  if (!a) return null;
  return (
    <>
      {a.hat ? (
        <group position={[0, (H.h / 2) * U, 0]}>
          <mesh geometry={rbox((H.w + 0.42) * U, 0.07 * U, (H.d + 0.42) * U, 0.03 * U)} material={plastic(a.hat[0], { rough: 0.55 })} position={[0, 0.02 * U, 0]} castShadow={cs} receiveShadow />
          <mesh geometry={rbox((H.w - 0.02) * U, HAT_CROWN, (H.d - 0.02) * U, 0.1 * U)} material={plastic(a.hat[0], { rough: 0.55 })} position={[0, HAT_CROWN / 2 + 0.04 * U, 0]} castShadow={cs} receiveShadow />
          <mesh geometry={rbox((H.w + 0.02) * U, 0.13 * U, (H.d + 0.02) * U, 0.04 * U)} material={plastic(a.hat[1], { rough: 0.4 })} position={[0, 0.12 * U, 0]} castShadow={cs} />
        </group>
      ) : null}
      {a.cap ? (
        <group position={[0, (H.h / 2) * U, 0]}>
          <mesh geometry={rbox((H.w + 0.1) * U, 0.36 * U, (H.d + 0.1) * U, 0.14 * U)} material={plastic(a.cap[0], { rough: 0.6 })} position={[0, 0.1 * U, -0.01 * U]} castShadow={cs} />
          <mesh geometry={rbox((H.w - 0.08) * U, 0.06 * U, 0.52 * U, 0.03 * U)} material={plastic(a.cap[1], { rough: 0.5 })} position={[0, -0.04 * U, (H.d / 2 + 0.22) * U]} castShadow={cs} />
          <mesh geometry={rbox(0.5 * U, 0.2 * U, 0.03 * U, 0.03 * U)} material={plastic(a.cap[1], { rough: 0.5 })} position={[0, 0.12 * U, (H.d / 2 + 0.06) * U]} />
          <mesh geometry={rbox(0.14 * U, 0.06 * U, 0.14 * U, 0.03 * U)} material={plastic(a.cap[1], { rough: 0.5 })} position={[0, 0.3 * U, 0]} />
        </group>
      ) : null}
      {a.beard ? (
        <>
          <mesh geometry={rbox((H.w - 0.06) * U, 0.22 * U, 0.16 * U, 0.08 * U)} material={plastic(a.beard, { rough: 0.8 })} position={[0, -0.58 * U, (H.d / 2 - 0.04) * U]} castShadow={cs} />
          <mesh geometry={rbox((H.w - 0.06) * U, 0.18 * U, 0.7 * U, 0.08 * U)} material={plastic(a.beard, { rough: 0.8 })} position={[0, -0.66 * U, 0.14 * U]} castShadow={cs} />
        </>
      ) : null}
      {a.nose ? <mesh geometry={geoOf("clownNose", () => new THREE.IcosahedronGeometry(0.15 * U, 3))} material={plastic(a.nose, { rough: 0.25 })} position={[0, -0.08 * U, (H.d / 2) * U + 0.1 * U]} castShadow={cs} /> : null}
      {a.mustache ? <mesh geometry={rbox(0.6 * U, 0.13 * U, 0.08 * U, 0.05 * U)} material={plastic(a.mustache, { rough: 0.7 })} position={[0, -0.12 * U, (H.d / 2) * U + 0.04 * U]} castShadow={cs} /> : null}
      {a.helmet ? (
        <group position={[0, (H.h / 2) * U, 0]}>
          <mesh geometry={geoOf("helmetDome", () => new THREE.SphereGeometry(0.62 * U, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2))} material={plastic(a.helmet[0], { rough: 0.35 })} position={[0, -0.12 * U, 0]} castShadow={cs} />
          <mesh geometry={rbox((H.w + 0.5) * U, 0.06 * U, (H.d + 0.7) * U, 0.03 * U)} material={plastic(a.helmet[0], { rough: 0.35 })} position={[0, -0.1 * U, -0.1 * U]} castShadow={cs} />
          <mesh geometry={rbox(0.32 * U, 0.36 * U, 0.06 * U, 0.04 * U)} material={plastic(a.helmet[1], { rough: 0.3 })} position={[0, 0.12 * U, 0.58 * U]} />
        </group>
      ) : null}
      {a.glasses ? (
        <group position={[0, 0.05 * U, (H.d / 2) * U + 0.012]}>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.21 * U, 0, 0]}>
              <mesh geometry={geoOf("glassRim", () => new THREE.TorusGeometry(0.12 * U, 0.019 * U, 8, 28))} material={plastic(a.glasses!, { rough: 0.25 })} castShadow={cs} />
              <mesh geometry={geoOf("glassLens", () => new THREE.CircleGeometry(0.12 * U, 28))} material={plastic("#bfefff", { transparent: true, opacity: 0.22, rough: 0.05 })} />
            </group>
          ))}
          <mesh geometry={rbox(0.18 * U, 0.025 * U, 0.02 * U, 0.008 * U)} material={plastic(a.glasses, { rough: 0.25 })} />
        </group>
      ) : null}
    </>
  );
};
/** on the body: belt + buckle, the dad's bag on a strap, the seller's apron, the kid's rocket backpack */
const BodyAcc: React.FC<{ look: Look }> = ({ look }) => {
  const cs = React.useContext(CastCtx);
  const S = SPEC;
  const a = look.acc ?? {};
  const fz = (S.torso.d * U) / 2;
  return (
    <>
      {look.belt ? (
        <>
          <mesh geometry={rbox((S.torso.w + 0.04) * U, 0.2 * U, (S.torso.d + 0.04) * U, 0.03 * U)} material={plastic(look.belt, { rough: 0.5 })} position={[0, 0.12 * U, 0]} castShadow={cs} />
          <mesh geometry={rbox(0.32 * U, 0.16 * U, 0.04 * U, 0.02 * U)} material={plastic("#ffd23a", { rough: 0.25 })} position={[0, 0.12 * U, fz + 0.025 * U]} />
        </>
      ) : null}
      {a.bag ? (
        <>
          <mesh geometry={rbox(0.16 * U, 2.5 * U, 0.04 * U, 0.02 * U)} material={plastic("#5a3a22", { rough: 0.6 })} position={[0, 1.05 * U, fz + 0.03 * U]} rotation={[0, 0, -0.78]} castShadow={cs} />
          <mesh geometry={rbox(0.16 * U, 2.5 * U, 0.04 * U, 0.02 * U)} material={plastic("#5a3a22", { rough: 0.6 })} position={[0, 1.05 * U, -fz - 0.03 * U]} rotation={[0, 0, -0.78]} castShadow={cs} />
          <group position={[1.12 * U, 0.15 * U, 0.15 * U]}>
            <mesh geometry={rbox(0.36 * U, 0.8 * U, 0.95 * U, 0.08 * U)} material={plastic(a.bag, { rough: 0.55 })} castShadow={cs} receiveShadow />
            <mesh geometry={rbox(0.38 * U, 0.3 * U, 0.97 * U, 0.06 * U)} material={plastic("#5a3a22", { rough: 0.6 })} position={[0, 0.27 * U, 0]} />
            <mesh geometry={rbox(0.04 * U, 0.12 * U, 0.12 * U, 0.02 * U)} material={plastic("#ffd23a", { rough: 0.25 })} position={[0.2 * U, 0.15 * U, 0]} />
          </group>
        </>
      ) : null}
      {a.apron ? (
        <>
          <mesh geometry={rbox(1.7 * U, 1.35 * U, 0.06 * U, 0.03 * U)} material={plastic(a.apron, { rough: 0.6 })} position={[0, 0.72 * U, fz + 0.035 * U]} castShadow={cs} />
          <mesh geometry={rbox(1.84 * U, 0.95 * U, 0.06 * U, 0.03 * U)} material={plastic(a.apron, { rough: 0.6 })} position={[0, -0.42 * U, fz + 0.12 * U]} rotation={[0.08, 0, 0]} castShadow={cs} />
          <mesh geometry={rbox(0.9 * U, 0.34 * U, 0.03 * U, 0.02 * U)} material={plastic("#ffffff", { rough: 0.6 })} position={[0, 0.35 * U, fz + 0.075 * U]} />
          <mesh geometry={rbox(1.2 * U, 0.1 * U, (S.torso.d + 0.08) * U, 0.02 * U)} material={plastic(a.apron, { rough: 0.6 })} position={[0, 1.98 * U, 0]} />
        </>
      ) : null}
      {a.hood ? (
        <>
          <mesh geometry={rbox(1.5 * U, 0.62 * U, 0.7 * U, 0.26 * U)} material={plastic(a.hood[0], { rough: 0.7 })} position={[0, 1.9 * U, -fz - 0.18 * U]} rotation={[-0.35, 0, 0]} castShadow={cs} />
          <mesh geometry={rbox(1.36 * U, 0.6 * U, 0.06 * U, 0.03 * U)} material={plastic(a.hood[1], { rough: 0.7 })} position={[0, 0.5 * U, fz + 0.03 * U]} />
          {[-1, 1].map((k) => (
            <mesh key={k} geometry={rbox(0.07 * U, 0.55 * U, 0.04 * U, 0.02 * U)} material={plastic("#f4f0e6", { rough: 0.5 })} position={[k * 0.22 * U, 1.62 * U, fz + 0.03 * U]} />
          ))}
        </>
      ) : null}
      {a.scarf ? (
        // a chunky knit scarf: a soft ring round the neck and one tail hanging down the front
        <>
          <mesh geometry={rbox(1.5 * U, 0.34 * U, (S.torso.d + 0.24) * U, 0.14 * U)} material={plastic(a.scarf, { rough: 0.85, map: knitTex() })} position={[0, 1.98 * U, 0]} castShadow={cs} />
          <mesh geometry={rbox(0.36 * U, 1.0 * U, 0.14 * U, 0.06 * U)} material={plastic(a.scarf, { rough: 0.85, map: knitTex() })} position={[0.38 * U, 1.45 * U, fz + 0.1 * U]} rotation={[0.08, 0, 0.06]} castShadow={cs} />
          {[-0.1, 0.1].map((k) => (
            <mesh key={k} geometry={rbox(0.08 * U, 0.16 * U, 0.08 * U, 0.03 * U)} material={plastic(a.scarf!, { rough: 0.9 })} position={[(0.38 + k) * U, 0.88 * U, fz + 0.1 * U]} />
          ))}
        </>
      ) : null}
      {a.coat ? (
        // a long coat hem below the waist (a flared panel front and back)
        <mesh geometry={geoOf("coatHem", () => {
          const g = new THREE.CylinderGeometry(Math.SQRT2, Math.SQRT2 * 1.12, 1, 4, 1, true);
          g.rotateY(Math.PI / 4);
          return g;
        })} material={plastic(a.coat, { rough: 0.75, map: cottonTex(), side: THREE.DoubleSide })} position={[0, -0.32 * U, 0]} scale={[1.05 * U, 1.1 * U, 0.56 * U]} castShadow={cs} />
      ) : null}
      {a.skirt ? (
        // a flared skirt: a square frustum from the waist to mid-thigh, open at the bottom
        <mesh geometry={geoOf("skirt", () => {
          const g = new THREE.CylinderGeometry(Math.SQRT2, Math.SQRT2 * 1.32, 1, 4, 1, true);
          g.rotateY(Math.PI / 4);
          return g;
        })} material={plastic(a.skirt, { rough: 0.7, map: cottonTex(), side: THREE.DoubleSide })} position={[0, -0.12 * U, 0]} scale={[1.06 * U, 0.95 * U, 0.57 * U]} castShadow={cs} />
      ) : null}
      {a.tie ? (
        <>
          <mesh geometry={rbox(0.24 * U, 1.25 * U, 0.04 * U, 0.02 * U)} material={plastic(a.tie, { rough: 0.45 })} position={[0, 1.22 * U, fz + 0.03 * U]} />
          <mesh geometry={rbox(0.3 * U, 0.2 * U, 0.06 * U, 0.03 * U)} material={plastic(a.tie, { rough: 0.45 })} position={[0, 1.9 * U, fz + 0.04 * U]} />
        </>
      ) : null}
      {a.keys ? (
        <group position={[-1.04 * U, 0.05 * U, 0.2 * U]}>
          <mesh geometry={geoOf("keyRing", () => new THREE.TorusGeometry(0.13 * U, 0.025 * U, 8, 20))} material={plastic("#c8c8d0", { rough: 0.2 })} rotation={[0, Math.PI / 2, 0]} />
          {[-1, 1].map((k) => (
            <mesh key={k} geometry={rbox(0.04 * U, 0.34 * U, 0.12 * U, 0.02 * U)} material={plastic(k < 0 ? "#d8b040" : "#c8c8d0", { rough: 0.25 })} position={[0, -0.22 * U, k * 0.07 * U]} rotation={[k * 0.25, 0, 0]} />
          ))}
        </group>
      ) : null}
      {a.backpack ? (
        <group position={[0, 1.05 * U, -fz - 0.36 * U]}>
          <mesh geometry={rbox(1.4 * U, 1.55 * U, 0.7 * U, 0.25 * U)} material={plastic(a.backpack[0], { rough: 0.45 })} castShadow={cs} receiveShadow />
          <mesh geometry={geoOf("packNose", () => new THREE.ConeGeometry(0.62 * U, 0.55 * U, 20))} material={plastic(a.backpack[1], { rough: 0.4 })} position={[0, 1.02 * U, 0]} castShadow={cs} />
          <mesh geometry={geoOf("packPort", () => new THREE.CylinderGeometry(0.26 * U, 0.26 * U, 0.06 * U, 20))} material={plastic("#9ff8ff", { emissive: "#5fd8ff", ei: 0.9, rough: 0.15 })} position={[0, 0.2 * U, -0.36 * U]} rotation={[Math.PI / 2, 0, 0]} />
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={rbox(0.12 * U, 0.55 * U, 0.5 * U, 0.04 * U)} material={plastic(a.backpack![1], { rough: 0.4 })} position={[s * 0.75 * U, -0.6 * U, 0]} rotation={[0, 0, s * 0.35]} castShadow={cs} />
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`st${s}`} geometry={rbox(0.24 * U, 0.08 * U, 1.6 * U, 0.03 * U)} material={plastic(a.backpack![0], { rough: 0.5 })} position={[s * 0.55 * U, 0.98 * U, 0.75 * U]} />
          ))}
        </group>
      ) : null}
    </>
  );
};
