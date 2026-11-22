import React from "react";
import { useCurrentFrame } from "remotion";
import { Composition, getInputProps } from "remotion";
import { BLOCKY_FRAMES, BlockyTest } from "./blocky/BlockyTest";
import { SUB } from "./engine/core/frame";
import { LAUGH_FRAMES, LaughLift } from "./laugh/LaughLift";

// BlockyTest: the template's 10 s example. LaughLift: the 2-minute Short "Laugh Lift" (sharp, for stills and look-dev);
// LaughLiftSub: the same at SUB x fps for motion blur (render.sh averages every SUB sub-frames with ffmpeg tmix).
// LaughPick: chosen frames of LaughLift in a row (look-dev: --props='{"frames":[10,250,...]}' renders them in one go)
const PICK: number[] = ((getInputProps() as { frames?: number[] }).frames ?? []).map(Number);
const LaughPick: React.FC = () => {
  const f = useCurrentFrame();
  return <LaughLift at={PICK[Math.min(f, PICK.length - 1)] ?? 0} />;
};
export const Root: React.FC = () => (
  <>
    <Composition id="BlockyTest" component={BlockyTest} durationInFrames={BLOCKY_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="BlockyTestSub" component={BlockyTest} durationInFrames={BLOCKY_FRAMES * SUB} fps={30 * SUB} width={1080} height={1920} defaultProps={{ sub: true }} />
    <Composition id="LaughLift" component={LaughLift} durationInFrames={LAUGH_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="LaughPick" component={LaughPick} durationInFrames={PICK.length || 1} fps={30} width={1080} height={1920} />
    <Composition id="LaughLiftSub" component={LaughLift} durationInFrames={LAUGH_FRAMES * SUB} fps={30 * SUB} width={1080} height={1920} defaultProps={{ sub: true }} />
    {/* LaughLiftSub2: 2 sub-frames per output frame (lighter motion blur, half the render time of LaughLiftSub) */}
    <Composition id="LaughLiftSub2" component={LaughLift} durationInFrames={LAUGH_FRAMES * 2} fps={60} width={1080} height={1920} defaultProps={{ sub: true, subN: 2 }} />
  </>
);
