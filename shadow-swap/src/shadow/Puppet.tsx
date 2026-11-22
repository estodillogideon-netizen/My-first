// The shadows of "The Shadow Swap": a shadow is its own little actor. It is drawn as a flat, unlit silhouette of a
// blocky figure (the same body maths as Blocky: SPEC, shoulders, hips, neck), squashed onto a wall like an orthographic
// projection. Its pose is its own: Kai smiles while his shadow sits and cries.
//   Puppet      the silhouette figure in its own frame (feet on y = 0, facing +z = out of the wall)
//   OnWall      places a Puppet flat on a wall plane (the wall's front face at z = zw, facing +z)
// Opaque, one colour per wall (the wall's colour in shade), so overlapping limbs never double-darken; a fade is a
// colour lerp toward the wall colour.
import React from "react";
import * as THREE from "three";
import type { Look } from "../blocky/Blocky";
import { rbox, geoOf } from "../blocky/mat";
import { HAND, SHOULDER_Y, shoulderXOf, SPEC, U } from "../blocky/motion";
import type { Pose } from "../blocky/motion";

const mats = new Map<string, THREE.MeshBasicMaterial>();
export const shadowMat = (c: string) => {
  let m = mats.get(c);
  if (!m) {
    if (mats.size > 300) mats.clear();
    m = new THREE.MeshBasicMaterial({ color: c, toneMapped: true });
    mats.set(c, m);
  }
  return m;
};
const OUT = { outline: false };

export type PuppetFx = {
  /** tears: 0..1 (drops falling from the face) */
  tears?: number;
  /** crossed fingers on the right hand */
  cross?: boolean;
  /** little hearts floating up from the head: 0..1 */
  hearts?: number;
  /** muscles: 0..1 (bulging arm blobs) */
  muscle?: number;
  /** yawn: 0..1 (the mouth opens as a hole in the head) */
  yawn?: number;
};

const heartGeo = () =>
  geoOf("heartShape", () => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.5);
    s.bezierCurveTo(-0.9, 0.05, -0.45, 0.75, 0, 0.3);
    s.bezierCurveTo(0.45, 0.75, 0.9, 0.05, 0, -0.5);
    return new THREE.ShapeGeometry(s, 10);
  });

/** hair / headwear silhouette from a look */
const HeadSil: React.FC<{ look: Look; m: THREE.Material }> = ({ look, m }) => {
  const H = SPEC.head;
  const a = look.acc ?? {};
  const parts: React.ReactNode[] = [];
  if (a.cap) {
    parts.push(<mesh key="cap" geometry={rbox((H.w + 0.1) * U, 0.38 * U, (H.d + 0.1) * U, 0.14 * U)} material={m} position={[0, (H.h / 2 + 0.1) * U, 0]} userData={OUT} />);
    parts.push(<mesh key="bill" geometry={rbox((H.w - 0.08) * U, 0.08 * U, 0.55 * U, 0.03 * U)} material={m} position={[0, (H.h / 2 - 0.04) * U, (H.d / 2 + 0.22) * U]} userData={OUT} />);
  } else if (look.hairStyle === "shaggy") {
    parts.push(<mesh key="hair" geometry={rbox((H.w + 0.16) * U, 0.42 * U, (H.d + 0.16) * U, 0.12 * U)} material={m} position={[0, (H.h / 2 + 0.02) * U, -0.04 * U]} userData={OUT} />);
    for (const k of [-1, 0, 1])
      parts.push(<mesh key={`spk${k}`} geometry={rbox(0.3 * U, 0.3 * U, 0.3 * U, 0.1 * U)} material={m} position={[k * 0.34 * U, (H.h / 2 + 0.22) * U, 0.12 * U]} rotation={[0, 0, k * 0.5 + 0.4]} userData={OUT} />);
  } else if (look.hairStyle === "puffs") {
    for (const k of [-1, 1])
      parts.push(<mesh key={`puff${k}`} geometry={geoOf("puffSph", () => new THREE.IcosahedronGeometry(0.34 * U, 2))} material={m} position={[k * 0.58 * U, (H.h / 2 + 0.05) * U, -0.05 * U]} userData={OUT} />);
    parts.push(<mesh key="top" geometry={rbox((H.w + 0.1) * U, 0.3 * U, (H.d + 0.1) * U, 0.1 * U)} material={m} position={[0, (H.h / 2) * U, 0]} userData={OUT} />);
  } else if (look.hairStyle === "tuft") {
    for (const k of [-1, 1]) parts.push(<mesh key={`tf${k}`} geometry={rbox(0.22 * U, 0.42 * U, 0.7 * U, 0.08 * U)} material={m} position={[k * (H.w / 2 + 0.07) * U, 0.02 * U, -0.12 * U]} userData={OUT} />);
  }
  if (a.beard) parts.push(<mesh key="beard" geometry={rbox((H.w + 0.04) * U, 0.3 * U, (H.d + 0.1) * U, 0.1 * U)} material={m} position={[0, -0.55 * U, 0.06 * U]} userData={OUT} />);
  // (the hood is left out: in silhouette it reads as a second head)
  return <>{parts}</>;
};

export const Puppet: React.FC<{ pose: Pose; look: Look; s: number; color: string; fx?: PuppetFx; t: number; seed?: number }> = ({ pose: p, look, s, color, fx = {}, t, seed = 0 }) => {
  const S = SPEC;
  const H = S.head;
  const m = shadowMat(color);
  const box = (w: number, h: number, d: number, r = 0.05) => rbox(w * U, h * U, d * U, r * U);
  const arm = (side: "L" | "R") => {
    const sx = side === "L" ? 1 : -1;
    const raise = side === "L" ? p.armL : p.armR;
    const out = side === "L" ? p.outL : p.outR;
    const mus = fx.muscle ?? 0;
    return (
      <group key={side} position={[sx * shoulderXOf(out), SHOULDER_Y, 0]} rotation={[0, 0, sx * out]}>
        <group rotation={[-raise, 0, 0]}>
          <mesh geometry={box(S.arm.w + 0.06, S.arm.h, S.arm.d + 0.06)} material={m} position={[0, (S.arm.up - S.arm.h / 2) * U, 0]} userData={OUT} />
          {mus > 0.02 ? (
            <mesh geometry={geoOf("musc", () => new THREE.IcosahedronGeometry(0.62 * U, 2))} material={m} position={[sx * 0.25 * U * mus, -0.55 * U, 0.15 * U]} scale={[0.4 + 0.9 * mus, 0.5 + 0.7 * mus, 0.5 + 0.6 * mus]} userData={OUT} />
          ) : null}
          {fx.cross && side === "R" ? (
            <group position={[0, -HAND - 0.05, 0]}>
              {[-1, 1].map((k) => (
                <mesh key={k} geometry={box(0.14, 0.62, 0.14, 0.05)} material={m} position={[0, -0.16 * U, 0]} rotation={[0, 0, k * 0.42]} userData={OUT} />
              ))}
            </group>
          ) : null}
        </group>
      </group>
    );
  };
  const leg = (side: "L" | "R") => {
    const sx = side === "L" ? 1 : -1;
    const sw = side === "L" ? p.legL : p.legR;
    return (
      <group key={side} position={[sx * S.hipX * U, 0, 0]} rotation={[-sw, 0, 0]}>
        <mesh geometry={box(S.leg.w, S.leg.h, S.leg.d)} material={m} position={[0, (-S.leg.h / 2) * U, 0]} userData={OUT} />
        <mesh geometry={box(S.shoe.w, S.shoe.h, S.shoe.d + 0.1)} material={m} position={[0, (-S.leg.h + S.shoe.h / 2) * U, 0.05 * U]} userData={OUT} />
      </group>
    );
  };
  const tears = fx.tears ?? 0;
  const drops: React.ReactNode[] = [];
  if (tears > 0.02) {
    // drops fall from both eyes (head-local), a 0.55 s cycle, staggered
    for (let i = 0; i < 4; i++) {
      const ph = ((t + seed * 0.37) / 0.55 + i * 0.25) % 1;
      const side = i % 2 ? 1 : -1;
      drops.push(
        <mesh key={`d${i}`} geometry={geoOf("tearSph", () => new THREE.IcosahedronGeometry(0.17 * U, 1))} material={m} position={[side * (0.45 + 0.3 * ph) * U, (-0.05 - 1.6 * ph * ph) * U, (0.7 + 0.35 * ph) * U]} scale={tears * (1 - 0.4 * ph)} userData={OUT} />,
      );
    }
  }
  const hearts = fx.hearts ?? 0;
  const hs: React.ReactNode[] = [];
  if (hearts > 0.02) {
    for (let i = 0; i < 3; i++) {
      const ph = (t / 1.3 + i / 3) % 1;
      hs.push(
        <mesh key={`h${i}`} geometry={heartGeo()} material={m} position={[(i - 1) * 0.5 * U + 0.15 * Math.sin(ph * 6 + i) * U, (H.h + 0.6 + 2.4 * ph) * U, 0.3 * U]} scale={1.1 * U * hearts * Math.sin(Math.PI * Math.min(1, ph * 1.2))} userData={OUT} />,
      );
    }
  }
  const yawn = fx.yawn ?? 0;
  return (
    <group position={[p.x, p.y, p.z]} rotation={[0, p.yaw, 0]} scale={s}>
      <group rotation={[p.pitch, 0, 0]}>
        {leg("L")}
        {leg("R")}
        <group position={[0, p.bob ?? 0, 0]} rotation={[0, p.twist ?? 0, p.sway ?? 0]}>
          <mesh geometry={box(S.torso.w, S.torso.h, S.torso.d)} material={m} position={[0, (S.torso.h / 2) * U, 0]} userData={OUT} />
          {arm("L")}
          {arm("R")}
          <group position={[0, (S.torso.h + H.gap) * U, 0]} rotation={[0, p.headYaw, 0]}>
            <group rotation={[p.headPitch, 0, 0]}>
              <group position={[0, (H.h / 2) * U, 0]}>
                {/* the neck fills the gap so the head never floats in silhouette */}
                <mesh geometry={box(0.5, 0.3, 0.5)} material={m} position={[0, (-H.h / 2 - 0.05) * U, 0]} userData={OUT} />
                {yawn > 0.02 ? (
                  // a yawning head: the jaw drops (two halves), the gap reads as an open mouth in profile
                  <>
                    <mesh geometry={box(H.w, H.h * 0.62, H.d, H.r)} material={m} position={[0, H.h * 0.19 * U, 0]} rotation={[-0.45 * yawn, 0, 0]} userData={OUT} />
                    <mesh geometry={box(H.w, H.h * 0.36, H.d, H.r)} material={m} position={[0, -H.h * 0.32 * U, 0]} rotation={[0.35 * yawn, 0, 0]} userData={OUT} />
                  </>
                ) : (
                  <mesh geometry={box(H.w, H.h, H.d, H.r)} material={m} userData={OUT} />
                )}
                <HeadSil look={look} m={m} />
                {drops}
              </group>
            </group>
          </group>
          {hs}
        </group>
      </group>
    </group>
  );
};

/** a puppet flat on a wall: the wall's front face is the plane z = zw (normal +z); x = where its feet are along the
 * wall; k = size relative to the owner (a shadow is a little bigger); floor = the floor height at the wall */
export const OnWall: React.FC<{ x: number; zw: number; floor?: number; k?: number; children: React.ReactNode }> = ({ x, zw, floor = 0, k = 1.06, children }) => (
  <group position={[x, floor, zw + 0.012]} scale={[k, k, 0.045]}>
    {children}
  </group>
);
