import React from "react";
import { useCurrentFrame } from "remotion";
import { Composition, getInputProps } from "remotion";
import { BLOCKY_FRAMES, BlockyTest } from "./blocky/BlockyTest";
import { GoodbyeShort } from "./goodbye/GoodbyeShort";
import { FRAMES_OF } from "./goodbye/time";

// GoodbyePart1 / GoodbyePart2: the two Shorts (sharp, for stills); *Sub2: 2 sub-frames per output frame at 60 fps for
// motion blur (tools/render_part.sh averages them). GoodbyePick: chosen frames of a part in a row (look-dev:
// --props='{"part":1,"frames":[10,250,...]}').
const PROPS = getInputProps() as { frames?: number[]; part?: number };
const PICK: number[] = (PROPS.frames ?? []).map(Number);
const PART = (PROPS.part === 2 ? 2 : 1) as 1 | 2;
const GoodbyePick: React.FC = () => {
  const f = useCurrentFrame();
  return <GoodbyeShort part={PART} at={PICK[Math.min(f, PICK.length - 1)] ?? 0} />;
};
const P1: React.FC<{ sub?: boolean; subN?: number }> = (p) => <GoodbyeShort part={1} {...p} />;
const P2: React.FC<{ sub?: boolean; subN?: number }> = (p) => <GoodbyeShort part={2} {...p} />;
export const Root: React.FC = () => (
  <>
    <Composition id="BlockyTest" component={BlockyTest} durationInFrames={BLOCKY_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="GoodbyePart1" component={P1} durationInFrames={FRAMES_OF(1)} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="GoodbyePart2" component={P2} durationInFrames={FRAMES_OF(2)} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="GoodbyePart1Sub2" component={P1} durationInFrames={FRAMES_OF(1) * 2} fps={60} width={1080} height={1920} defaultProps={{ sub: true, subN: 2 }} />
    <Composition id="GoodbyePart2Sub2" component={P2} durationInFrames={FRAMES_OF(2) * 2} fps={60} width={1080} height={1920} defaultProps={{ sub: true, subN: 2 }} />
    <Composition id="GoodbyePick" component={GoodbyePick} durationInFrames={PICK.length || 1} fps={30} width={1080} height={1920} />
  </>
);
