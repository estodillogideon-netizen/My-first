import React from "react";
import { Composition } from "remotion";
import { BLOCKY_FRAMES, BlockyTest } from "./blocky/BlockyTest";
import { SUB } from "./engine/core/frame";
import { LAUGH_FRAMES, LaughLift } from "./laugh/LaughLift";

// BlockyTest: the template's 10 s example. LaughLift: the 2-minute Short "Laugh Lift" (sharp, for stills and look-dev);
// LaughLiftSub: the same at SUB x fps for motion blur (render.sh averages every SUB sub-frames with ffmpeg tmix).
export const Root: React.FC = () => (
  <>
    <Composition id="BlockyTest" component={BlockyTest} durationInFrames={BLOCKY_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="BlockyTestSub" component={BlockyTest} durationInFrames={BLOCKY_FRAMES * SUB} fps={30 * SUB} width={1080} height={1920} defaultProps={{ sub: true }} />
    <Composition id="LaughLift" component={LaughLift} durationInFrames={LAUGH_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="LaughLiftSub" component={LaughLift} durationInFrames={LAUGH_FRAMES * SUB} fps={30 * SUB} width={1080} height={1920} defaultProps={{ sub: true }} />
  </>
);
