// The sets of "The Comet Swap" (the city and the mountains are in World.tsx):
//   Room   one bedroom in two eras (the same walls, the same window, the same loose floorboard):
//            now   Kai's room: soft blue-grey paint, a comet poster, a white desk with a laptop, a bookshelf
//            then  Mira's room 25 years ago: flowery mustard wallpaper, a wooden desk with a lamp and a notebook, an
//                  old radio on the dresser, a paper calendar, Leo's little bed by the window
//          the window looks out over the city to the mountains (the city is drawn outside by the composition)
//   Lake   the frozen lake at the foot of the mountains at night: snowy banks, pines, footprints, the ice with its
//          crack and the hole (dark water, broken slabs), a glint of the comet on the ice
//   props  Note (new white / old yellow / shaky), Notebook (new / worn), Laptop (search screen), Radio, Calendar,
//          Photo, Box, Pancakes
import React from "react";
import * as THREE from "three";
import { Blob } from "../blocky/Contact";
import { canvasTexture, geoOf, plastic, rbox } from "../blocky/mat";
import { hash } from "../blocky/motion";
import type { V3 } from "../blocky/motion";
import { SnowTree } from "./World";

const B: React.FC<{ s: V3; p: V3; c: string; r?: V3; rough?: number; cast?: boolean; map?: THREE.Texture; e?: number; ec?: string; round?: number }> = ({ s, p, c, r, rough = 0.6, cast = true, map, e, ec, round = 0.015 }) => (
  <mesh geometry={rbox(s[0], s[1], s[2], round)} material={plastic(c, { rough, map, emissive: ec ?? (e ? c : undefined), ei: e })} position={p} rotation={r} castShadow={cast} receiveShadow />
);

// ------------------------------------------------------------------ textures
const wallTex = (era: "now" | "then") =>
  canvasTexture(`cwall|${era}`, 256, 256, (g, W, H) => {
    if (era === "now") {
      g.fillStyle = "#9aaec4";
      g.fillRect(0, 0, W, H);
      for (let i = 0; i < 4000; i++) {
        g.fillStyle = hash(i * 1.3) > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
        g.fillRect(hash(i * 2.1) * W, hash(i * 3.7) * H, 2, 2);
      }
      return;
    }
    // old flowery wallpaper: mustard with stripes and little roses
    g.fillStyle = "#d8b870";
    g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 32) {
      g.fillStyle = "rgba(255,240,200,0.35)";
      g.fillRect(x, 0, 6, H);
      g.fillStyle = "rgba(120,90,40,0.18)";
      g.fillRect(x + 14, 0, 2, H);
    }
    for (let k = 0; k < 16; k++) {
      const x = ((k % 4) + 0.5) * (W / 4) + ((Math.floor(k / 4) % 2) * W) / 8, y = (Math.floor(k / 4) + 0.5) * (H / 4);
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        g.fillStyle = "#b8584a";
        g.beginPath();
        g.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4.5, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = "#f0d070";
      g.beginPath();
      g.arc(x, y, 3, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#6a8a4a";
      g.beginPath();
      g.ellipse(x + 9, y + 7, 6, 3, 0.6, 0, Math.PI * 2);
      g.fill();
    }
    // age: faded patches
    for (let i = 0; i < 60; i++) {
      g.fillStyle = "rgba(120,90,40,0.04)";
      g.beginPath();
      g.arc(hash(i * 3.3) * W, hash(i * 7.1) * H, 10 + 30 * hash(i), 0, Math.PI * 2);
      g.fill();
    }
  });
const plankTex = (era: "now" | "then") =>
  canvasTexture(`cplank|${era}`, 256, 256, (g, W, H) => {
    const base = era === "now" ? [178, 140, 100] : [150, 98, 58];
    for (let y = 0; y < H; y += 32)
      for (let x = (y / 32) % 2 ? -64 : 0; x < W; x += 128) {
        const k = 0.85 + 0.25 * hash(x * 0.37 + y * 0.11 + (era === "now" ? 3 : 0));
        g.fillStyle = `rgb(${Math.round(base[0] * k)},${Math.round(base[1] * k)},${Math.round(base[2] * k)})`;
        g.fillRect(x, y, 128, 32);
        for (let i = 0; i < 6; i++) {
          g.fillStyle = "rgba(60,30,10,0.12)";
          g.fillRect(x, y + 4 + i * 5, 128, 1);
        }
        g.fillStyle = "rgba(0,0,0,0.3)";
        g.fillRect(x, y, 2, 32);
      }
    for (let y = 0; y < H; y += 32) {
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.fillRect(0, y, W, 2);
    }
  });
const posterTex = () =>
  canvasTexture("cposter", 256, 360, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, "#0a1030");
    gr.addColorStop(1, "#2a3a7a");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 120; i++) {
      g.fillStyle = "rgba(255,255,255,0.8)";
      g.fillRect(hash(i) * W, hash(i * 2.3) * H * 0.8, 1.5, 1.5);
    }
    // a comet streaking across
    const cg = g.createLinearGradient(60, 90, 220, 20);
    cg.addColorStop(0, "rgba(220,245,255,1)");
    cg.addColorStop(1, "rgba(80,140,255,0)");
    g.strokeStyle = cg;
    g.lineWidth = 16;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(70, 100);
    g.lineTo(230, 25);
    g.stroke();
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(66, 102, 9, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#1a2040";
    g.beginPath();
    g.moveTo(0, H);
    g.lineTo(60, 230);
    g.lineTo(110, 290);
    g.lineTo(170, 210);
    g.lineTo(W, 300);
    g.lineTo(W, H);
    g.fill();
    g.fillStyle = "#ffffff";
    g.font = "bold 34px Poppins, sans-serif";
    g.textAlign = "center";
    g.fillText("BLUE COMET", W / 2, H - 28);
  });
const calTex = (era: "now" | "then") =>
  canvasTexture(`ccal|${era}`, 256, 320, (g, W, H) => {
    g.fillStyle = era === "then" ? "#f4ead0" : "#ffffff";
    g.fillRect(0, 0, W, H);
    g.fillStyle = era === "then" ? "#a8402a" : "#2a6ad8";
    g.fillRect(0, 0, W, 92);
    g.fillStyle = "#ffffff";
    g.textAlign = "center";
    g.font = "bold 30px Poppins, sans-serif";
    g.fillText("DECEMBER", W / 2, 38);
    g.font = "bold 40px Poppins, sans-serif";
    g.fillText(era === "then" ? "2001" : "2026", W / 2, 82);
    g.fillStyle = "#3a3a3a";
    g.font = "18px Poppins, sans-serif";
    for (let d = 0; d < 31; d++) {
      const c = d % 7, r = Math.floor(d / 7);
      g.fillText(String(d + 1), 22 + c * 35, 126 + r * 40);
    }
    // the comet nights circled
    g.strokeStyle = "#2a8ad8";
    g.lineWidth = 3;
    for (const d of [4, 11, 18, 25]) {
      const c = d % 7, r = Math.floor(d / 7);
      g.beginPath();
      g.arc(22 + c * 35, 120 + r * 40, 15, 0, Math.PI * 2);
      g.stroke();
    }
  });

// ------------------------------------------------------------------ props
const hand = (g: CanvasRenderingContext2D, lines: string[], x: number, y: number, size: number, color: string, shaky = 0) => {
  g.fillStyle = color;
  g.font = `600 ${size}px "Comic Sans MS", Poppins, sans-serif`;
  g.textAlign = "left";
  lines.forEach((l, i) => {
    if (!shaky) g.fillText(l, x, y + i * size * 1.3);
    else
      [...l].forEach((ch, k) => {
        g.fillText(ch, x + k * size * 0.56 + (hash(i * 31 + k) - 0.5) * shaky, y + i * size * 1.3 + (hash(i * 7 + k * 3) - 0.5) * shaky * 1.4);
      });
  });
};
export type NoteKind = "new" | "old" | "shaky" | "blank";
const noteTex = (kind: NoteKind) =>
  canvasTexture(`cnote|${kind}`, 512, 384, (g, W, H) => {
    g.fillStyle = kind === "new" || kind === "blank" ? "#fbfbf6" : "#e8d498";
    g.fillRect(0, 0, W, H);
    if (kind !== "new" && kind !== "blank") {
      // age: brown edges, stains, a fold
      const gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.62);
      gr.addColorStop(0, "rgba(0,0,0,0)");
      gr.addColorStop(1, "rgba(120,70,20,0.55)");
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) {
        g.fillStyle = "rgba(140,90,30,0.08)";
        g.beginPath();
        g.arc(hash(i * 3.1) * W, hash(i * 5.7) * H, 10 + 40 * hash(i), 0, Math.PI * 2);
        g.fill();
      }
    }
    g.strokeStyle = "rgba(80,120,200,0.25)";
    g.lineWidth = 2;
    for (let y = 70; y < H; y += 46) {
      g.beginPath();
      g.moveTo(20, y);
      g.lineTo(W - 20, y);
      g.stroke();
    }
    g.fillStyle = "rgba(0,0,0,0.08)";
    g.fillRect(W / 2 - 1, 0, 2, H);
    if (kind === "new") hand(g, ["Hi. I'm Kai.", "You were in my body", "last night. Who are you?"], 34, 62, 40, "#1a2a6a");
    if (kind === "old") hand(g, ["Who are you?", "And why is your writing", "in my floor??", "     - Mira"], 34, 62, 40, "#2a1a4a");
    if (kind === "shaky") hand(g, ["Kai, I'm scared.", "Leo keeps sneaking to", "the frozen lake at night...", "     - M"], 30, 62, 38, "#3a1a2a", 5);
  });
/** a sheet of note paper lying flat (x: width, z: height), text up */
export const Note: React.FC<{ kind: NoteKind; s?: number }> = ({ kind, s = 1 }) => (
  <mesh geometry={geoOf("noteSheet", () => new THREE.BoxGeometry(0.2, 0.0015, 0.15))} material={plastic("#ffffff", { rough: 0.85, map: noteTex(kind) })} scale={[s, 1, s]} castShadow receiveShadow />
);
const bookTex = (worn: boolean) =>
  canvasTexture(`cbook|${worn}`, 384, 512, (g, W, H) => {
    g.fillStyle = worn ? "#6a8aa8" : "#4a8ad0";
    g.fillRect(0, 0, W, H);
    if (worn) {
      for (let i = 0; i < 40; i++) {
        g.fillStyle = `rgba(${hash(i) > 0.5 ? "255,240,210" : "40,30,20"},0.12)`;
        g.beginPath();
        g.arc(hash(i * 1.9) * W, hash(i * 2.7) * H, 6 + 28 * hash(i * 3.3), 0, Math.PI * 2);
        g.fill();
      }
    }
    // stickers: a star, a heart
    g.fillStyle = "#ffd23a";
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 14 : 32;
      g.lineTo(300 + Math.cos(a) * r, 80 + Math.sin(a) * r);
    }
    g.fill();
    g.fillStyle = "#ff6a8a";
    g.beginPath();
    g.arc(70, 440, 16, Math.PI, 0);
    g.arc(102, 440, 16, Math.PI, 0);
    g.lineTo(86, 476);
    g.closePath();
    g.fill();
    // the label
    g.fillStyle = worn ? "#efe2c0" : "#fbfaf4";
    g.fillRect(48, 190, W - 96, 150);
    g.strokeStyle = "rgba(0,0,0,0.25)";
    g.strokeRect(48, 190, W - 96, 150);
    hand(g, ["MIRA HALE", "Age 12"], 76, 252, 46, worn ? "#3a2a3a" : "#1a1a4a");
  });
export const Notebook: React.FC<{ worn?: boolean }> = ({ worn = false }) => (
  <group>
    <mesh geometry={rbox(0.15, 0.016, 0.2, 0.004)} material={plastic("#f4f0e4", { rough: 0.8 })} position={[0, 0.008, 0]} castShadow />
    <mesh geometry={geoOf("nbCover", () => new THREE.BoxGeometry(0.152, 0.002, 0.202))} material={plastic("#ffffff", { rough: 0.7, map: bookTex(worn) })} position={[0, 0.017, 0]} />
  </group>
);
const laptopTex = (k: number) =>
  canvasTexture(`claptop|${k}`, 512, 320, (g, W, H) => {
    g.fillStyle = "#f4f6fa";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#e0e4ec";
    g.fillRect(0, 0, W, 34);
    g.fillStyle = "#ffffff";
    g.fillRect(70, 56, W - 140, 46);
    g.strokeStyle = "#8aa0c0";
    g.lineWidth = 3;
    g.strokeRect(70, 56, W - 140, 46);
    g.fillStyle = "#2a2a3a";
    g.font = "26px Poppins, sans-serif";
    g.textAlign = "left";
    g.fillText(k > 0 ? "Mira Hale" : "", 86, 88);
    if (k > 0.5) {
      g.fillStyle = "#c82a2a";
      g.font = "bold 34px Poppins, sans-serif";
      g.textAlign = "center";
      g.fillText("0 results", W / 2, 170);
      g.fillStyle = "#6a6a7a";
      g.font = "22px Poppins, sans-serif";
      g.fillText("No one found with that name.", W / 2, 214);
    }
  });
export const Laptop: React.FC<{ k: number; on?: boolean }> = ({ k, on = true }) => (
  <group>
    <mesh geometry={rbox(0.34, 0.018, 0.24, 0.008)} material={plastic("#c8ccd4", { rough: 0.3 })} position={[0, 0.009, 0]} castShadow />
    <group position={[0, 0.018, -0.115]} rotation={[-0.3, 0, 0]}>
      <mesh geometry={rbox(0.34, 0.23, 0.012, 0.008)} material={plastic("#c8ccd4", { rough: 0.3 })} position={[0, 0.115, 0]} castShadow />
      <mesh geometry={geoOf("lapScreen", () => new THREE.PlaneGeometry(0.31, 0.19))} material={plastic("#ffffff", { map: laptopTex(Math.round(k * 2) / 2), emissive: "#ffffff", ei: on ? 0.25 : 0, rough: 0.6 })} position={[0, 0.118, 0.0065]} />
    </group>
  </group>
);
export const Radio: React.FC = () => (
  <group>
    <mesh geometry={rbox(0.42, 0.24, 0.16, 0.03)} material={plastic("#8a5a3a", { rough: 0.5 })} position={[0, 0.12, 0]} castShadow />
    <mesh geometry={geoOf("radGrill", () => new THREE.CircleGeometry(0.075, 24))} material={plastic("#3a2a22", { rough: 0.9 })} position={[-0.1, 0.12, 0.081]} />
    <mesh geometry={rbox(0.15, 0.07, 0.01, 0.01)} material={plastic("#f0e0b0", { emissive: "#ffc860", ei: 0.4 })} position={[0.1, 0.16, 0.081]} />
    {[0.06, 0.14].map((x) => (
      <mesh key={x} geometry={geoOf("radKnob", () => new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12))} material={plastic("#e8e0d0")} position={[x, 0.07, 0.085]} rotation={[Math.PI / 2, 0, 0]} />
    ))}
    <mesh geometry={geoOf("radAnt", () => new THREE.CylinderGeometry(0.004, 0.004, 0.4, 6))} material={plastic("#c8c8cc", { rough: 0.2 })} position={[0.17, 0.42, -0.03]} rotation={[0, 0, -0.35]} />
    <mesh geometry={rbox(0.26, 0.03, 0.03, 0.01)} material={plastic("#3a2a22")} position={[0, 0.255, 0]} />
  </group>
);
const photoTex = () =>
  canvasTexture("cphoto", 256, 320, (g, W, H) => {
    g.fillStyle = "#f4f0e4";
    g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, 20, 0, 260);
    gr.addColorStop(0, "#a8c0d8");
    gr.addColorStop(1, "#e8e0d0");
    g.fillStyle = gr;
    g.fillRect(18, 18, W - 36, 250);
    // a girl with long dark hair and a little boy, both smiling, snow
    const kid = (x: number, y: number, s: number, hair: string, coat: string, long: boolean) => {
      g.fillStyle = coat;
      g.fillRect(x - 26 * s, y, 52 * s, 70 * s);
      g.fillStyle = "#f2c6a0";
      g.fillRect(x - 22 * s, y - 46 * s, 44 * s, 44 * s);
      g.fillStyle = hair;
      g.fillRect(x - 24 * s, y - 52 * s, 48 * s, 14 * s);
      if (long) {
        g.fillRect(x - 28 * s, y - 46 * s, 8 * s, 64 * s);
        g.fillRect(x + 20 * s, y - 46 * s, 8 * s, 64 * s);
      }
      g.fillStyle = "#3a2a22";
      g.fillRect(x - 12 * s, y - 30 * s, 5 * s, 7 * s);
      g.fillRect(x + 7 * s, y - 30 * s, 5 * s, 7 * s);
      g.strokeStyle = "#8a3a3a";
      g.lineWidth = 2;
      g.beginPath();
      g.arc(x, y - 18 * s, 7 * s, 0.2, Math.PI - 0.2);
      g.stroke();
    };
    kid(96, 160, 1.3, "#3a2418", "#c8282a", true);
    kid(170, 196, 0.95, "#6a4228", "#f0c020", false);
    g.fillStyle = "rgba(255,255,255,0.8)";
    g.fillRect(18, 236, W - 36, 32);
    g.fillStyle = "rgba(120,80,40,0.15)";
    g.fillRect(0, 0, W, H);
    hand(g, ["Mira & Leo"], 70, 300, 24, "#3a2a2a");
  });
export const Photo: React.FC = () => (
  <group>
    <mesh geometry={rbox(0.2, 0.25, 0.02, 0.006)} material={plastic("#6a4a2a", { rough: 0.5 })} castShadow />
    <mesh geometry={geoOf("photoFace", () => new THREE.PlaneGeometry(0.17, 0.215))} material={plastic("#ffffff", { rough: 0.6, map: photoTex() })} position={[0, 0, 0.011]} />
  </group>
);
export const Box: React.FC<{ open?: number }> = ({ open = 1 }) => (
  <group>
    <mesh geometry={rbox(0.5, 0.3, 0.4, 0.02)} material={plastic("#b8905a", { rough: 0.85 })} position={[0, 0.15, 0]} castShadow />
    <mesh geometry={rbox(0.5, 0.01, 0.2, 0.005)} material={plastic("#a8804a", { rough: 0.85 })} position={[0, 0.3, -0.2]} rotation={[-1.9 * open, 0, 0]} />
    <mesh geometry={rbox(0.5, 0.01, 0.2, 0.005)} material={plastic("#a8804a", { rough: 0.85 })} position={[0, 0.3, 0.2]} rotation={[1.9 * open, 0, 0]} />
  </group>
);
export const Pancakes: React.FC = () => (
  <group>
    <mesh geometry={geoOf("plate", () => new THREE.CylinderGeometry(0.13, 0.11, 0.015, 28))} material={plastic("#ffffff", { rough: 0.25 })} position={[0, 0.008, 0]} castShadow />
    {[0, 1, 2, 3].map((i) => (
      <mesh key={i} geometry={geoOf("cake1", () => new THREE.CylinderGeometry(0.085, 0.085, 0.016, 24))} material={plastic(i % 2 ? "#d8a050" : "#c88a3a", { rough: 0.7 })} position={[0.004 * (i % 2), 0.024 + i * 0.016, 0]} castShadow />
    ))}
    <mesh geometry={rbox(0.03, 0.012, 0.03, 0.004)} material={plastic("#fff4c0")} position={[0, 0.09, 0]} />
    <mesh geometry={geoOf("syrup", () => new THREE.CylinderGeometry(0.07, 0.075, 0.004, 24))} material={plastic("#8a4a10", { rough: 0.1 })} position={[0, 0.084, 0]} />
  </group>
);

// ------------------------------------------------------------------ the room
export const ROOM = { x0: -2.6, x1: 2.6, back: -2.2, front: 3.2, h: 2.6 };
export const WIN = { x0: -0.45, x1: 1.25, y0: 0.85, y1: 2.25 };
export const BED = { x0: -2.55, x1: -1.45, z0: -2.15, z1: -0.05, top: 0.55, cx: -2.0 };
export const LEOBED = { x0: 1.8, x1: 2.55, z0: -2.15, z1: -0.85, top: 0.42, cx: 2.17 };
export const DESK = { x0: 1.95, x1: 2.55, z0: 0.45, z1: 1.75, h: 0.75 };
export const BOARD = { x0: 0.05, x1: 0.85, z: 0.8, w: 0.16 };
export const DRESSER = { x: -0.95, z: -1.98, w: 0.75, d: 0.42, h: 0.9 };
export const CALP: V3 = [ROOM.x1 - 0.012, 1.55, 1.1];
export const Room: React.FC<{ era: "now" | "then"; night: boolean; lamp?: number; board?: number; notes?: number; open?: number; leoBed?: "full" | "empty" | "none"; laptop?: number; t: number }> = ({ era, night, lamp = 0, board = 0, notes = 0, open = 0, leoBed = "none", laptop = 0 }) => {
  const W = ROOM.x1 - ROOM.x0, D = ROOM.front - ROOM.back, H = ROOM.h;
  const wt = wallTex(era).clone();
  wt.wrapS = wt.wrapT = THREE.RepeatWrapping;
  wt.repeat.set(era === "then" ? 3 : 1, era === "then" ? 1.6 : 1);
  wt.needsUpdate = true;
  const paper = plastic("#ffffff", { rough: 0.85, map: wt });
  const pt = plankTex(era).clone();
  pt.wrapS = pt.wrapT = THREE.RepeatWrapping;
  pt.repeat.set(3, 3);
  pt.needsUpdate = true;
  const { x0, x1, y0, y1 } = WIN;
  const bz = ROOM.back;
  const wood = era === "then" ? "#8a5a34" : "#f2f0ec";
  const trim = era === "then" ? "#f0e6cc" : "#ffffff";
  return (
    <>
      <mesh geometry={geoOf("crFloor", () => new THREE.PlaneGeometry(W, D))} material={plastic("#ffffff", { rough: 0.55, map: pt })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (ROOM.front + bz) / 2]} receiveShadow />
      {/* the back wall with the window hole */}
      <mesh geometry={geoOf("crBack", () => {
        const sh = new THREE.Shape();
        sh.moveTo(ROOM.x0, 0);
        sh.lineTo(ROOM.x1, 0);
        sh.lineTo(ROOM.x1, H);
        sh.lineTo(ROOM.x0, H);
        sh.closePath();
        const hole = new THREE.Path();
        hole.moveTo(x0, y0);
        hole.lineTo(x0, y1);
        hole.lineTo(x1, y1);
        hole.lineTo(x1, y0);
        hole.closePath();
        sh.holes.push(hole);
        const g = new THREE.ShapeGeometry(sh);
        const uv = g.attributes.uv as THREE.BufferAttribute;
        const p = g.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - ROOM.x0) / 2.6, p.getY(i) / 2.6);
        return g;
      })} material={paper} position={[0, 0, bz]} receiveShadow />
      {/* the facade outside (seen when the lens looks in through the window) */}
      <mesh geometry={geoOf("crBack", () => new THREE.BufferGeometry())} material={plastic(era === "then" ? "#b8846a" : "#c8ccd4", { rough: 0.85 })} position={[0, 0, bz - 0.3]} scale={[1, 1, -1]} />
      {/* the outside wall thickness round the window (so the view does not leak) */}
      <B s={[0.12, y1 - y0, 0.3]} p={[x0 - 0.06, (y0 + y1) / 2, bz - 0.15]} c={trim} cast={false} />
      <B s={[0.12, y1 - y0, 0.3]} p={[x1 + 0.06, (y0 + y1) / 2, bz - 0.15]} c={trim} cast={false} />
      <B s={[x1 - x0 + 0.24, 0.12, 0.3]} p={[(x0 + x1) / 2, y1 + 0.06, bz - 0.15]} c={trim} cast={false} />
      <B s={[x1 - x0 + 0.24, 0.12, 0.3]} p={[(x0 + x1) / 2, y0 - 0.06, bz - 0.15]} c={trim} cast={false} />
      {/* side walls, front wall, ceiling */}
      {[ROOM.x0, ROOM.x1].map((x) => (
        <mesh key={x} geometry={geoOf("crSide", () => {
          const g = new THREE.BoxGeometry(0.2, H, D);
          return g;
        })} material={paper} position={[x + (x < 0 ? -0.1 : 0.1), H / 2, (ROOM.front + bz) / 2]} receiveShadow />
      ))}
      <mesh geometry={geoOf("crFront", () => new THREE.BoxGeometry(W + 0.4, H, 0.2))} material={paper} position={[0, H / 2, ROOM.front + 0.1]} />
      <mesh geometry={geoOf("crCeil", () => new THREE.PlaneGeometry(W, D))} material={plastic(era === "then" ? "#f4ecd8" : "#f8f8fa", { rough: 0.85 })} rotation={[Math.PI / 2, 0, 0]} position={[0, H, (ROOM.front + bz) / 2]} />
      {/* skirting */}
      <B s={[W, 0.1, 0.03]} p={[0, 0.05, bz + 0.015]} c={trim} cast={false} />
      {[ROOM.x0, ROOM.x1].map((x) => (
        <B key={`sk${x}`} s={[0.03, 0.1, D]} p={[x + (x < 0 ? 0.015 : -0.015), 0.05, (ROOM.front + bz) / 2]} c={trim} cast={false} />
      ))}
      {/* the window frame: sill, mullions; frost in the corners */}
      <B s={[x1 - x0 + 0.2, 0.06, 0.18]} p={[(x0 + x1) / 2, y0 - 0.03, bz + 0.06]} c={trim} />
      {[x0, x1, (x0 + x1) / 2].map((x, i) => (
        <B key={i} s={[0.05, y1 - y0, 0.06]} p={[x, (y0 + y1) / 2, bz - 0.05]} c={trim} cast={false} />
      ))}
      <B s={[x1 - x0, 0.05, 0.06]} p={[(x0 + x1) / 2, y0 + (y1 - y0) * 0.62, bz - 0.05]} c={trim} cast={false} />
      {/* curtains */}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={rbox(0.34, 1.55, 0.06, 0.03)} material={plastic(era === "then" ? "#a8483a" : "#3a4a6a", { rough: 0.9 })} position={[s < 0 ? x0 - 0.22 : x1 + 0.22, 1.5, bz + 0.1]} castShadow />
      ))}
      <B s={[x1 - x0 + 1.0, 0.03, 0.03]} p={[(x0 + x1) / 2, 2.3, bz + 0.1]} c={era === "then" ? "#c8a050" : "#2a2a30"} />
      {/* the bed (Kai's / Mira's) */}
      <group>
        <B s={[BED.x1 - BED.x0, 0.32, BED.z1 - BED.z0]} p={[BED.cx, 0.2, (BED.z0 + BED.z1) / 2]} c={wood} rough={0.6} round={0.03} />
        <B s={[BED.x1 - BED.x0 - 0.04, 0.16, BED.z1 - BED.z0 - 0.04]} p={[BED.cx, 0.44, (BED.z0 + BED.z1) / 2]} c="#f8f8f4" rough={0.9} round={0.06} />
        <B s={[BED.x1 - BED.x0 + 0.02, 0.1, 1.3]} p={[BED.cx, BED.top - 0.02, BED.z1 - 0.7]} c={era === "then" ? "#d87a8a" : "#3a5a8a"} rough={0.95} round={0.05} />
        <B s={[0.7, 0.14, 0.4]} p={[BED.cx, BED.top + 0.03, BED.z0 + 0.32]} c="#ffffff" rough={0.9} round={0.07} />
        <B s={[BED.x1 - BED.x0, 0.9, 0.08]} p={[BED.cx, 0.45, BED.z0 + 0.02]} c={wood} />
        <Blob p={[BED.cx, 0, (BED.z0 + BED.z1) / 2]} sx={1.5} sz={2.4} op={0.45} />
      </group>
      {leoBed !== "none" ? (
        <group>
          <B s={[LEOBED.x1 - LEOBED.x0, 0.26, LEOBED.z1 - LEOBED.z0]} p={[LEOBED.cx, 0.16, (LEOBED.z0 + LEOBED.z1) / 2]} c="#6a8ab8" rough={0.6} round={0.03} />
          <B s={[LEOBED.x1 - LEOBED.x0 - 0.04, 0.12, LEOBED.z1 - LEOBED.z0 - 0.04]} p={[LEOBED.cx, 0.34, (LEOBED.z0 + LEOBED.z1) / 2]} c="#f8f8f4" rough={0.9} round={0.05} />
          {leoBed === "full" ? (
            <B s={[LEOBED.x1 - LEOBED.x0 + 0.02, 0.09, 0.85]} p={[LEOBED.cx, LEOBED.top, LEOBED.z1 - 0.45]} c="#f0c020" rough={0.95} round={0.04} />
          ) : (
            // the blanket thrown back
            <B s={[LEOBED.x1 - LEOBED.x0 + 0.02, 0.16, 0.4]} p={[LEOBED.cx, LEOBED.top + 0.02, LEOBED.z1 - 0.15]} r={[0.25, 0, 0.05]} c="#f0c020" rough={0.95} round={0.06} />
          )}
          <B s={[0.45, 0.1, 0.28]} p={[LEOBED.cx, LEOBED.top + 0.01, LEOBED.z0 + 0.22]} c="#ffffff" rough={0.9} round={0.05} />
          <Blob p={[LEOBED.cx, 0, (LEOBED.z0 + LEOBED.z1) / 2]} sx={1.0} sz={1.6} op={0.4} />
        </group>
      ) : era === "now" ? (
        // a bookshelf in the corner
        <group position={[2.3, 0, -1.6]}>
          <B s={[0.5, 1.7, 0.9]} p={[0, 0.85, 0]} c="#f2f0ec" />
          {[0.35, 0.8, 1.25].map((y, i) => (
            <group key={i}>
              {[0, 1, 2, 3, 4].map((k) => (
                <B key={k} s={[0.2, 0.28, 0.07]} p={[-0.1, y + 0.14, -0.3 + k * 0.13]} c={["#c8302a", "#2a6ad8", "#f0c020", "#2a8a5a", "#8a3ad8"][(k + i) % 5]} rough={0.7} />
              ))}
            </group>
          ))}
        </group>
      ) : null}
      {/* the dresser, with the radio (then) or a speaker and a plant (now) */}
      <group position={[DRESSER.x, 0, DRESSER.z]}>
        <B s={[DRESSER.w, DRESSER.h, DRESSER.d]} p={[0, DRESSER.h / 2, 0]} c={wood} />
        {[0.22, 0.5, 0.78].map((y) => (
          <B key={y} s={[DRESSER.w - 0.08, 0.22, 0.02]} p={[0, y, DRESSER.d / 2 + 0.005]} c={era === "then" ? "#9a6a44" : "#e8e6e2"} cast={false} />
        ))}
        {era === "then" ? (
          <group position={[0.05, DRESSER.h, 0.02]}>
            <Radio />
          </group>
        ) : (
          <group position={[0, DRESSER.h, 0]}>
            <B s={[0.12, 0.2, 0.12]} p={[-0.2, 0.1, 0]} c="#2a2a30" rough={0.4} />
            <mesh geometry={geoOf("pot", () => new THREE.CylinderGeometry(0.07, 0.055, 0.12, 14))} material={plastic("#e8e0d0")} position={[0.18, 0.06, 0]} />
            {[0, 1, 2, 3, 4].map((k) => (
              <mesh key={k} geometry={geoOf("leaf", () => new THREE.SphereGeometry(0.05, 8, 6))} material={plastic("#3a8a4a", { rough: 0.7 })} position={[0.18 + Math.cos(k * 1.3) * 0.05, 0.16 + 0.02 * k, Math.sin(k * 1.3) * 0.05]} scale={[1, 1.6, 0.5]} />
            ))}
          </group>
        )}
      </group>
      {/* the desk and chair, lamp, notebook / laptop */}
      <group>
        <B s={[DESK.x1 - DESK.x0, 0.04, DESK.z1 - DESK.z0]} p={[(DESK.x0 + DESK.x1) / 2, DESK.h, (DESK.z0 + DESK.z1) / 2]} c={wood} />
        {[[DESK.x0 + 0.04, DESK.z0 + 0.04], [DESK.x0 + 0.04, DESK.z1 - 0.04], [DESK.x1 - 0.04, DESK.z0 + 0.04], [DESK.x1 - 0.04, DESK.z1 - 0.04]].map(([x, z], i) => (
          <B key={i} s={[0.05, DESK.h, 0.05]} p={[x, DESK.h / 2, z]} c={wood} />
        ))}
        <group position={[DESK.x1 - 0.12, DESK.h + 0.02, DESK.z0 + 0.15]}>
          <mesh geometry={geoOf("lampBase", () => new THREE.CylinderGeometry(0.07, 0.08, 0.02, 16))} material={plastic(era === "then" ? "#3a6a4a" : "#2a2a30")} />
          <mesh geometry={geoOf("lampArm", () => new THREE.CylinderGeometry(0.012, 0.012, 0.34, 8))} material={plastic(era === "then" ? "#3a6a4a" : "#2a2a30")} position={[0, 0.17, 0]} />
          <mesh geometry={geoOf("lampShade", () => new THREE.ConeGeometry(0.1, 0.12, 18, 1, true))} material={plastic(era === "then" ? "#3a6a4a" : "#2a2a30", { side: THREE.DoubleSide })} position={[-0.05, 0.33, 0.04]} rotation={[0, 0, 0.5]} />
          <mesh geometry={geoOf("lampBulb", () => new THREE.SphereGeometry(0.03, 10, 8))} material={plastic("#fff0c0", { emissive: "#ffc860", ei: 0.5 + 6 * lamp })} position={[-0.07, 0.3, 0.04]} />
          {lamp > 0.02 ? <pointLight position={[-0.25, 0.25, 0.05]} color="#ffc070" intensity={2.6 * lamp} distance={3.5} decay={2} /> : null}
        </group>
        {era === "now" ? (
          <group position={[(DESK.x0 + DESK.x1) / 2 - 0.02, DESK.h + 0.02, (DESK.z0 + DESK.z1) / 2 + 0.05]} rotation={[0, -Math.PI / 2, 0]}>
            <Laptop k={laptop} />
          </group>
        ) : (
          <group position={[(DESK.x0 + DESK.x1) / 2, DESK.h + 0.02, (DESK.z0 + DESK.z1) / 2 + 0.2]} rotation={[0, -Math.PI / 2 + 0.2, 0]}>
            <Notebook />
          </group>
        )}
        {/* the chair */}
        <group position={[DESK.x0 - 0.35, 0, (DESK.z0 + DESK.z1) / 2]}>
          <B s={[0.42, 0.05, 0.42]} p={[0, 0.46, 0]} c={era === "then" ? "#8a5a34" : "#3a3a44"} />
          <B s={[0.05, 0.5, 0.42]} p={[-0.2, 0.72, 0]} c={era === "then" ? "#8a5a34" : "#3a3a44"} />
          {[[-0.18, -0.18], [-0.18, 0.18], [0.18, -0.18], [0.18, 0.18]].map(([x, z], i) => (
            <B key={i} s={[0.04, 0.46, 0.04]} p={[x, 0.23, z]} c={era === "then" ? "#7a4a2a" : "#2a2a30"} />
          ))}
        </group>
      </group>
      {/* the calendar on the right wall; the poster (now) over the bed */}
      <mesh geometry={geoOf("crCal", () => new THREE.PlaneGeometry(0.34, 0.42))} material={plastic("#ffffff", { rough: 0.7, map: calTex(era) })} position={CALP} rotation={[0, -Math.PI / 2, 0]} />
      {era === "now" ? (
        <mesh geometry={geoOf("crPoster", () => new THREE.PlaneGeometry(0.62, 0.87))} material={plastic("#ffffff", { rough: 0.5, map: posterTex() })} position={[ROOM.x0 + 0.012, 1.6, -1.0]} rotation={[0, Math.PI / 2, 0]} />
      ) : (
        <group position={[ROOM.x0 + 0.03, 1.55, -1.0]} rotation={[0, Math.PI / 2, 0]}>
          <Photo />
        </group>
      )}
      {/* the rug */}
      <mesh geometry={geoOf("crRug", () => new THREE.PlaneGeometry(1.6, 1.1))} material={plastic(era === "then" ? "#8a3a3a" : "#c8ccd8", { rough: 0.95 })} rotation={[-Math.PI / 2, 0, 0]} position={[-0.6, 0.004, 1.6]} receiveShadow />
      {/* the loose floorboard (hinged on its far edge) and the hiding place under it */}
      <mesh geometry={geoOf("crHole", () => new THREE.PlaneGeometry(BOARD.x1 - BOARD.x0, BOARD.w))} material={plastic("#140c08", { rough: 1 })} rotation={[-Math.PI / 2, 0, 0]} position={[(BOARD.x0 + BOARD.x1) / 2, 0.002, BOARD.z]} />
      {Array.from({ length: Math.round(notes) }, (_, i) => (
        <group key={i} position={[(BOARD.x0 + BOARD.x1) / 2 + (hash(i) - 0.5) * 0.1, 0.004 + i * 0.002, BOARD.z]} rotation={[0, (hash(i * 2) - 0.5) * 0.4, 0]} scale={[0.7, 1, 0.7]}>
          <Note kind={i === 0 ? "old" : "blank"} />
        </group>
      ))}
      <group position={[(BOARD.x0 + BOARD.x1) / 2, 0.012, BOARD.z - BOARD.w / 2]} rotation={[-1.25 * board, 0, 0]}>
        <B s={[BOARD.x1 - BOARD.x0, 0.022, BOARD.w]} p={[0, 0, BOARD.w / 2]} c="#ffffff" map={plankTex(era)} rough={0.55} round={0.004} />
      </group>
      {/* fake AO in the corners */}
      <Blob p={[0, 0, bz + 0.2]} sx={W} sz={0.6} op={0.35} />
      <Blob p={[ROOM.x1 - 0.2, 0, 0.5]} sx={0.6} sz={D} op={0.3} />
      <Blob p={[ROOM.x0 + 0.2, 0, 0.5]} sx={0.6} sz={D} op={0.3} />
      {/* the ceiling light (soft) */}
      <mesh geometry={geoOf("crCeilLamp", () => new THREE.SphereGeometry(0.22, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2))} material={plastic("#fff8f0", { emissive: "#fff0d8", ei: night ? 0.2 : 0.6 })} position={[0, H - 0.01, 0.4]} rotation={[Math.PI, 0, 0]} />
      {/* the window glass with a faint reflection; open: pushed out */}
      <mesh geometry={geoOf("crGlass", () => new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0))} material={plastic("#d8e8ff", { transparent: true, opacity: 0.08 * (1 - open), rough: 0.05 })} position={[(x0 + x1) / 2, (y0 + y1) / 2, bz - 0.06]} />
    </>
  );
};

// ------------------------------------------------------------------ the frozen lake
export const LAKE = { r: 26, leo: [0, 0, -4] as V3, hole: [0, 0, -4] as V3, bank: 30 };
const iceTex = () =>
  canvasTexture("cice", 1024, 1024, (g, W, H) => {
    const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    gr.addColorStop(0, "#9ab8d8");
    gr.addColorStop(0.8, "#b8d0e8");
    gr.addColorStop(1, "#e8f0fa");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    // frozen bubbles, old cracks, snow dust
    for (let i = 0; i < 500; i++) {
      g.fillStyle = hash(i * 1.1) > 0.6 ? "rgba(255,255,255,0.35)" : "rgba(40,70,110,0.12)";
      g.beginPath();
      g.arc(hash(i * 2.3) * W, hash(i * 3.9) * H, 1 + 4 * hash(i * 5.1), 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "rgba(255,255,255,0.35)";
    g.lineWidth = 1.5;
    for (let k = 0; k < 40; k++) {
      let x = hash(k * 7.7) * W, y = hash(k * 9.1) * H;
      g.beginPath();
      g.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += (hash(k * 13 + s) - 0.5) * 80;
        y += (hash(k * 17 + s) - 0.5) * 80;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    for (let i = 0; i < 300; i++) {
      g.fillStyle = "rgba(240,246,255,0.25)";
      g.beginPath();
      g.ellipse(hash(i * 4.4) * W, hash(i * 6.6) * H, 20 + 60 * hash(i), 6 + 14 * hash(i * 2), hash(i * 8) * 3, 0, Math.PI * 2);
      g.fill();
    }
  });
/** the new crack spreading from a point: k 0..1 */
const crackTex = (k: number) =>
  canvasTexture(`ccrack|${Math.round(k * 20)}`, 512, 512, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const kk = Math.round(k * 20) / 20;
    g.strokeStyle = "rgba(255,255,255,0.95)";
    g.lineCap = "round";
    for (let a = 0; a < 11; a++) {
      let x = W / 2, y = H / 2;
      const ang = (a / 11) * Math.PI * 2 + hash(a) * 0.5;
      const len = (0.35 + 0.65 * hash(a * 3.1)) * kk * W * 0.5;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(x, y);
      const n = 9;
      for (let s = 1; s <= n; s++) {
        const r = (s / n) * len;
        x = W / 2 + Math.cos(ang + (hash(a * 7 + s) - 0.5) * 0.5) * r;
        y = H / 2 + Math.sin(ang + (hash(a * 7 + s) - 0.5) * 0.5) * r;
        g.lineTo(x, y);
        g.lineWidth = 4 * (1 - s / n) + 1;
      }
      g.stroke();
    }
    // rings between the spokes
    g.lineWidth = 2;
    for (let r = 1; r <= 3; r++) {
      const rr = r * 0.12 * kk * W;
      g.beginPath();
      for (let a = 0; a <= 24; a++) {
        const ang = (a / 24) * Math.PI * 2;
        const j = 1 + (hash(r * 31 + a) - 0.5) * 0.3;
        g.lineTo(W / 2 + Math.cos(ang) * rr * j, H / 2 + Math.sin(ang) * rr * j);
      }
      g.stroke();
    }
  });
const snowTex = () =>
  canvasTexture("clakeSnow", 512, 512, (g, W, H) => {
    g.fillStyle = "#eef3fb";
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 3000; i++) {
      g.fillStyle = hash(i * 1.7) > 0.5 ? "rgba(255,255,255,0.6)" : "rgba(150,175,215,0.2)";
      g.beginPath();
      g.arc(hash(i * 2.9) * W, hash(i * 4.1) * H, 1 + 5 * hash(i * 6.3), 0, Math.PI * 2);
      g.fill();
    }
  });
const snowyGround = (r0: number, r1: number) => {
  const g = new THREE.RingGeometry(r0, r1, 96, 48);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const r = Math.hypot(x, y);
    const u = Math.max(0, (r - r0) / (r1 - r0));
    // the bank rises away from the ice; a hill to the south (where the path comes down)
    const hill = y > 0 ? 0 : 6 * Math.exp(-((x / 18) ** 2)) * Math.min(1, u * 2);
    p.setZ(i, 0.35 * Math.min(1, u * 6) + 4 * u * u + hill * u + 0.4 * Math.sin(x * 0.4) * Math.sin(y * 0.3) * u);
  }
  g.computeVertexNormals();
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 8, p.getY(i) / 8);
  return g;
};
export const Lake: React.FC<{ crack?: number; hole?: number; t: number; glint?: number; tracks?: number }> = ({ crack = 0, hole = 0, t, glint = 1, tracks = 1 }) => {
  const st = snowTex();
  st.wrapS = st.wrapT = THREE.RepeatWrapping;
  return (
    <group>
      {/* the ice */}
      <mesh geometry={geoOf("lakeIce", () => new THREE.CircleGeometry(LAKE.r + 0.6, 96))} material={new THREE.MeshStandardMaterial({ color: "#c8dcf0", map: iceTex(), roughness: 0.12, metalness: 0.25, emissive: "#1a3050", emissiveIntensity: 0.35 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow />
      {/* the comet's glint on the ice: a soft streak toward the lens side */}
      <mesh geometry={geoOf("lakeGlint", () => new THREE.PlaneGeometry(3.5, 40))} material={glintMat()} rotation={[-Math.PI / 2, 0, 0]} position={[2, 0.012, -14]} renderOrder={3} visible={glint > 0.05} />
      {/* the snow banks */}
      <mesh geometry={geoOf("lakeBank", () => snowyGround(LAKE.r, 140))} material={plastic("#ffffff", { rough: 0.95, map: st })} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      {/* snow lying on the ice near the shore */}
      <mesh geometry={geoOf("lakeRim", () => new THREE.RingGeometry(LAKE.r - 2.5, LAKE.r + 0.2, 96))} material={plastic("#e8f0fa", { rough: 0.95, transparent: true, opacity: 0.75 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} />
      {/* pines round the bank (not on the path to the south) */}
      {Array.from({ length: 70 }, (_, i) => {
        const a = (i / 70) * Math.PI * 2 + hash(i) * 0.08;
        const r = LAKE.r + 6 + 26 * hash(i * 3.3);
        if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2) < 0.22 && r < 50) return null;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        return <SnowTree key={i} p={[x, 0.3 + (r - LAKE.r) * 0.12, z]} s={1.3 + 1.2 * hash(i * 5.5)} />;
      })}
      {/* rocks by the shore */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + 0.3;
        return <mesh key={i} geometry={geoOf(`lrock${i % 3}`, () => new THREE.DodecahedronGeometry(0.8 + 0.3 * (i % 3), 0))} material={plastic("#4a5260", { rough: 0.9, flat: true })} position={[Math.cos(a) * (LAKE.r + 1.2), 0.2, Math.sin(a) * (LAKE.r + 1.2)]} scale={[1.3, 0.6, 1]} rotation={[0, i, 0]} castShadow />;
      })}
      {/* Leo's little footprints from the south shore to the middle */}
      {tracks > 0
        ? Array.from({ length: 26 }, (_, i) => {
            const z = LAKE.r - 1 - i * ((LAKE.r - 5) / 26);
            return <mesh key={i} geometry={geoOf("fprint", () => new THREE.CircleGeometry(0.07, 10))} material={plastic("#7a90b0", { rough: 1, transparent: true, opacity: 0.55 })} rotation={[-Math.PI / 2, 0, 0]} position={[(i % 2 ? 0.1 : -0.1) + Math.sin(i * 0.4) * 0.3, 0.013, z]} scale={[1, 1.5, 1]} />;
          })
        : null}
      {/* the crack round the hole */}
      {crack > 0.02 ? (
        <mesh geometry={geoOf("lakeCrack", () => new THREE.PlaneGeometry(5, 5))} material={plastic("#ffffff", { transparent: true, map: crackTex(crack), rough: 0.2, emissive: "#c8e8ff", ei: 0.6, decal: true })} rotation={[-Math.PI / 2, 0, 0]} position={[LAKE.hole[0], 0.015, LAKE.hole[2]]} />
      ) : null}
      {hole > 0.02 ? (
        <group position={[LAKE.hole[0], 0, LAKE.hole[2]]}>
          {/* dark water, a few slabs tipping */}
          <mesh geometry={geoOf("lakeHole", () => {
            const sh = new THREE.Shape();
            for (let a = 0; a <= 18; a++) {
              const ang = (a / 18) * Math.PI * 2;
              const r = 0.75 * (0.8 + 0.4 * hash(a * 3.7));
              if (a === 0) sh.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
              else sh.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
            }
            return new THREE.ShapeGeometry(sh);
          })} material={plastic("#0a1624", { rough: 0.05 })} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[hole, hole, 1]} />
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2 + 0.4;
            return <mesh key={i} geometry={rbox(0.55, 0.08, 0.4, 0.02)} material={plastic("#c8dcf0", { rough: 0.15 })} position={[Math.cos(a) * 0.7 * hole, 0.02 - 0.05 * hole, Math.sin(a) * 0.7 * hole]} rotation={[(hash(i) - 0.5) * 0.6 * hole, a, (hash(i * 2) - 0.5) * 0.5 * hole]} />;
          })}
        </group>
      ) : null}
    </group>
  );
};
let GLINT: THREE.ShaderMaterial | null = null;
const glintMat = () => {
  if (GLINT) return GLINT;
  GLINT = new THREE.ShaderMaterial({
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv; void main(){ float x = (vUv.x - 0.5) * 2.0; float a = exp(-x*x*6.0) * smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.6, vUv.y); gl_FragColor = vec4(vec3(0.55, 0.8, 1.0) * a * 0.6, 1.0); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  return GLINT;
};
