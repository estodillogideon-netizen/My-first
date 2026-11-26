import React from "react";
import { useCurrentFrame } from "remotion";
import { Composition, getInputProps } from "remotion";
import { BLOCKY_FRAMES, BlockyTest } from "./blocky/BlockyTest";
import { SwordShort } from "./sword/SwordShort";
import { Avatar } from "./sword/Avatar";
import { Thumb } from "./sword/Thumb";
import { Sample, SAMPLE_FRAMES } from "./sample/Sample";
import { TextShort } from "./text/TextShort";
import { FRAMES as TEXT_FRAMES } from "./text/time";
import { HeroShort } from "./hero/HeroShort";
import { FRAMES as HERO_FRAMES } from "./hero/time";
import { FRAMES } from "./sword/time";

// Sword: the Short (sharp, for stills); SwordSub2: 2 sub-frames per output frame at 60 fps for motion blur
// (tools/render_part.sh averages them). SwordPick: chosen frames in a row (look-dev: --props='{"frames":[10,250,...]}').
const PROPS = getInputProps() as { frames?: number[] };
const PICK: number[] = (PROPS.frames ?? []).map(Number);
const TextPick: React.FC = () => {
  const f = useCurrentFrame();
  return <TextShort at={PICK[Math.min(f, PICK.length - 1)] ?? 0} />;
};
const HeroPick: React.FC = () => {
  const f = useCurrentFrame();
  return <HeroShort at={PICK[Math.min(f, PICK.length - 1)] ?? 0} />;
};
const SwordPick: React.FC = () => {
  const f = useCurrentFrame();
  return <SwordShort at={PICK[Math.min(f, PICK.length - 1)] ?? 0} />;
};
export const Root: React.FC = () => (
  <>
    <Composition id="BlockyTest" component={BlockyTest} durationInFrames={BLOCKY_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="Sword" component={SwordShort} durationInFrames={FRAMES} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="SwordSub2" component={SwordShort} durationInFrames={FRAMES * 2} fps={60} width={1080} height={1920} defaultProps={{ sub: true, subN: 2 }} />
    <Composition id="AvatarRen" component={Avatar} durationInFrames={1} fps={30} width={1080} height={1080} defaultProps={{ who: "ren" as const }} />
    <Composition id="AvatarMei" component={Avatar} durationInFrames={1} fps={30} width={1080} height={1080} defaultProps={{ who: "mei" as const }} />
    <Composition id="Thumb" component={Thumb} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{ wide: false }} />
    <Composition id="ThumbWide" component={Thumb} durationInFrames={1} fps={30} width={1280} height={720} defaultProps={{ wide: true }} />
    <Composition id="Sample" component={Sample} durationInFrames={SAMPLE_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="SampleSub2" component={Sample} durationInFrames={SAMPLE_FRAMES * 2} fps={60} width={1080} height={1920} defaultProps={{ sub: true, subN: 2 }} />
    <Composition id="Text" component={TextShort} durationInFrames={TEXT_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="TextSub2" component={TextShort} durationInFrames={TEXT_FRAMES * 2} fps={60} width={1080} height={1920} defaultProps={{ sub: true, subN: 2 }} />
    <Composition id="TextPick" component={TextPick} durationInFrames={PICK.length || 1} fps={30} width={1080} height={1920} />
    <Composition id="Hero" component={HeroShort} durationInFrames={HERO_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ sub: false }} />
    <Composition id="HeroSub2" component={HeroShort} durationInFrames={HERO_FRAMES * 2} fps={60} width={1080} height={1920} defaultProps={{ sub: true, subN: 2 }} />
    <Composition id="HeroPick" component={HeroPick} durationInFrames={PICK.length || 1} fps={30} width={1080} height={1920} />
    <Composition id="SwordPick" component={SwordPick} durationInFrames={PICK.length || 1} fps={30} width={1080} height={1920} />
  </>
);
