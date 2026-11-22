# House style for every new video

Reference: `style_test.mp4` (scene code: `video/scenes/test.js`).

## Format
- Vertical 1080×1920, 30 fps, MP4.
- **Hook at 0:00:** "In this town, …" plus an aerial shot of a bright town.
- **Non-stop narration:** one narrator, gaps of 0.05–0.1 s, no dead air. Characters speak only a line or two.
- **Cut every 0.6–2 seconds.** Every key noun or action gets its own shot ("dog" means a dog on screen).
- **Captions:** one word at a time, lowercase, pale yellow `#fbf59c`, Inter 900, thick black outline, just below the middle of the screen (`captions: "word1"`).
- **Ending:** a twist or cliffhanger, then cut.

## Look
- Bright, saturated pastel world: colorful houses with white trim, picket fences, fluffy round trees in mixed colors, flowers, lamps, props everywhere.
- Lighting: sky light, warm sun with soft high-resolution shadows, ambient occlusion and soft glow (`EffectComposer`: GTAO + UnrealBloom + Output).
- Characters: the rounded-block Roblox-style humans in `lib/human.js`. Each character is defined once so they stay consistent.

## Sound
- Bouncy music in fun parts, tension music before the twist, a short silence and a bass hit on the reveal.
- Effects on every cut or action (whoosh, boing, ping, hit). Voice sits about 10 dB or more above the music.

## Pipeline
1. `scenes/<name>.json`: narration lines (auto timing), music and sound effects. Then run `python3 audio.py <name>`.
2. `scenes/<name>.js`: sets, shots anchored to word timings (`W(line, word)`), and `render()` using the composer.
3. Preview stills: `SNAP="1,2,3" SCALE=1.5 node render.mjs <name>`.
4. Render in parts, about 5 s each, in parallel: `SCALE=1.5 START=a END=b PART=n node render.mjs <name>`. Then join the parts with ffmpeg concat, add the audio, and apply loudnorm.
