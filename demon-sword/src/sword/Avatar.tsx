// A square profile picture (1080 x 1080, safe for a circle crop): only the face of Ren (or Mei), cute (a big happy
// smile, rosy cheeks), straight to the lens, soft warm lantern bokeh behind.
import React from "react";
import { AbsoluteFill } from "remotion";
import { useFonts } from "../engine/core/frame";
import { View } from "../engine/core/View";
import type { Cam } from "../engine/core/View";
import { Blocky } from "../blocky/Blocky";
import type { Look } from "../blocky/Blocky";
import { base, facePoint } from "../library/characters";
import type { V3 } from "../blocky/motion";
import { Glow } from "../goodbye/Fog";
import { canvasTexture } from "../blocky/mat";
import * as THREE from "three";
import { MEI, REN, SC } from "./cast";
import { moodOfShot } from "./mood";

export const Avatar: React.FC<{ who?: "ren" | "mei" }> = ({ who = "ren" }) => {
  const ready = useFonts();
  const isMei = who === "mei";
  const s = isMei ? SC.mei : SC.ren;
  const look: Look = isMei ? MEI : { ...REN, cheeks: "blush", eyeScale: 1.3 };
  const pose = { ...base(0, 0, 0, s), headPitch: -0.04, headYaw: 0.0, sway: 0.0 };
  const f = facePoint(pose, s);
  const aim: V3 = [f[0], f[1] + 0.05 * s, f[2]];
  // straight on, only the head (no body)
  const cam: Cam = { pos: [f[0] + 0.03, f[1] + 0.12 * s, f[2] + 1.3 * s], look: [aim[0], aim[1] - 0.02, aim[2]], fov: 30 };
  const bg = canvasTexture(`avatarBg|${who}`, 512, 512, (g, W, H) => {
    const gr = g.createRadialGradient(W / 2, H * 0.42, 10, W / 2, H / 2, W * 0.72);
    if (isMei) {
      gr.addColorStop(0, "#ffc890");
      gr.addColorStop(0.4, "#f0607a");
      gr.addColorStop(1, "#5a1a5a");
    } else {
      gr.addColorStop(0, "#ffb070");
      gr.addColorStop(0.4, "#d8503a");
      gr.addColorStop(1, "#1a1a4a");
    }
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  });
  const mood = moodOfShot(isMei ? "AVATAR_MEI3" : "AVATAR_REN3", "home", cam);
  if (!ready) return <AbsoluteFill style={{ background: "#2a1a14" }} />;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #ffcf9a 0%, #e8835a 45%, #5a2238 100%)" }}>
      <View mood={mood} cam={cam} t={0} blur={0.3} sky={false} width={1080} height={1080}>
        {/* the backdrop: a warm gradient behind the head, facing the lens */}
        <mesh position={[f[0] - (cam.pos[0] - f[0]) * 2.2, f[1] - (cam.pos[1] - f[1]) * 2.2, f[2] - (cam.pos[2] - f[2]) * 2.2]} quaternion={new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(...cam.pos), new THREE.Vector3(...f), new THREE.Vector3(0, 1, 0)))}>
          <planeGeometry args={[9, 9]} />
          <meshBasicMaterial map={bg} toneMapped={false} fog={false} />
        </mesh>
        <Blocky pose={pose} look={look} emotion="joy" scale={s} headOnly />
        {/* soft key and a warm rim */}
        <pointLight position={[f[0] + 0.5, f[1] + 0.5, f[2] + 1.0]} color="#fff0e0" intensity={3.2} distance={4} decay={2} />
        <pointLight position={[f[0] - 0.6, f[1] + 0.4, f[2] - 0.6]} color="#ffb070" intensity={5} distance={3} decay={2} />
        {/* lantern bokeh far behind */}
        {Array.from({ length: 16 }, (_, i) => {
          const a = i * 2.39996;
          const r = 0.9 + 0.55 * ((i * 0.618) % 1);
          return <Glow key={i} p={[f[0] + Math.cos(a) * r * 1.6, f[1] + Math.sin(a) * r * 1.1, f[2] - 1.6]} s={0.3 + 0.22 * (i % 3)} c={i % 3 === 0 ? "#ff7a50" : i % 3 === 1 ? "#ffd27a" : "#ff9ab0"} op={0.45} />;
        })}
        {/* a few sparkles */}
        {Array.from({ length: 10 }, (_, i) => {
          const a = i * 1.7 + 0.4;
          return <Glow key={`s${i}`} p={[f[0] + Math.cos(a) * 0.42 * s * 1.3, f[1] + Math.sin(a) * 0.38 * s * 1.3, f[2] + 0.05]} s={0.025 + 0.012 * (i % 3)} c="#ffffff" op={0.9} />;
        })}
      </View>
    </AbsoluteFill>
  );
};
