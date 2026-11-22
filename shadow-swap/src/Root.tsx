import React from "react";
import { useCurrentFrame } from "remotion";
import { Composition, getInputProps } from "remotion";
import { BLOCKY_FRAMES, BlockyTest } from "./blocky/BlockyTest";
import { SHADOW_FRAMES, ShadowSwap } from "./shadow/ShadowSwap";

// ShadowSwap: the 2-minute Short "The Shadow Swap" (sharp, for stills and look-dev); ShadowSwapSub2: 2 sub-frames per
// output frame at 60 fps for motion blur (tools/render_part.sh averages them with ffmpeg tmix).
// ShadowPick: chosen frames in a row (look-dev: --props='{"frames":[10,250,...]}' renders them in one go)
const PICK: number[] = ((getInputProps() as { frames?: number[] }).frames ?? []).map(Number);
const ShadowPick: React.FC = () => {
  const f = useCurrentFrame();
  return <ShadowSwap at={PICK[Math.min(f, PICK.length - 1)] ?? 0} />;
};
export const Root: React.FC = () => (
  <>
    <Composition id="BlockyTest" component={BlockyTest} durationInFrames={BLOCKY_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="ShadowSwap" component={ShadowSwap} durationInFrames={SHADOW_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="ShadowPick" component={ShadowPick} durationInFrames={PICK.length || 1} fps={30} width={1080} height={1920} />
    <Composition id="ShadowSwapSub2" component={ShadowSwap} durationInFrames={SHADOW_FRAMES * 2} fps={60} width={1080} height={1920} defaultProps={{ sub: true, subN: 2 }} />
  </>
);
