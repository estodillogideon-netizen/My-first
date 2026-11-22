# Laugh Lift 🎈

A 2-minute vertical blocky-world Short (1080×1920, 30 fps), built with the `blocky-shorts` skill (Remotion + three.js).

> In my town, every time you laugh, you float a little higher.

## Layout
| path | what |
|---|---|
| `vo/script.txt` | the voice-over, one line per turn |
| `vo/timings.json` | word timings (placeholder: `vo/synth_timings.py` at ~260 wpm until a voice is recorded) |
| `plan/plan_laugh.py` | 93 shots, each anchored to a word → `src/plan.gen.ts`, `plan/SHOTS.md` |
| `src/laugh/cast.ts` | Tomo, Grandpa, Rika, the clown, Mom, the firefighter, guests |
| `src/laugh/stage.ts` | the staging: everyone's pose and every prop as pure functions of t |
| `src/laugh/shots.ts` | one lens per shot |
| `src/laugh/props.tsx`, `Town.tsx`, `mood.ts` | props, the town (+ the big toy town for the sky), light |
| `src/laugh/LaughLift.tsx` | the compositions `LaughLift` (sharp) and `LaughLiftSub` (motion blur) |
| `tools/laugh_check.sh` | numeric lens checks (lens inside a body, blocked face, face turned away, face out of frame) |

## Recording the real voice
1. Record `voice.wav` reading `vo/script.txt` (fast and warm, ~260 words per minute).
2. `python vo/transcribe.py voice.wav vo/script.txt vo/timings.json` (needs `faster-whisper`).
3. `python plan/plan_laugh.py vo/timings.json` — every cut and action moves with its word.
4. Render again, then mux the voice at −14 LUFS (see the skill's `references/render.md`).

## Render
```
npm ci
bash tools/laugh_check.sh
NAME=laugh_v bash render.sh 1 LaughLiftSub > out/renders/laugh_v1_render.txt 2>&1
```
In a sandbox without access to Remotion's Chrome download, set `BROWSER_EXECUTABLE` to a local Chrome Headless Shell.
