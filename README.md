# IN THIS TOWN, YOU HAD TO PAY FOR EVERY WORD

**Final video:** `pay_for_every_word.mp4` (1080×1920, 9:16, 1:54, 30 fps, H.264 + AAC). Checked: 3420 frames, plays through with no errors.

- Lucas uses the same model as Alex (`DESIGNS.lucas`). Mom, the Mayor (black suit, red tie), police and about 40 citizens.
- Voices: narrator, Lucas, Mom, the Mayor, two citizens, and the distorted "???" speaker, who switches to Lucas's warped voice at the end.
- Every word a character says makes a coin fly off their head, with a wallet counter and a coin sound. The Mayor's words cost nothing (a clue).
- Files: `video/scenes/words.json` (voices, sound, music), `video/scenes/words.js` (shots), `video/lib/wordstown.js` (square, alley, bedroom).

---

# IN THIS TOWN, YOU GET ARRESTED FOR TELLING THE TRUTH

**Final video:** `truth_is_illegal.mp4` (1080×1920, 9:16, exactly 60.0 s, 30 fps, H.264 + AAC 192k). Checked: 1800 frames, plays through with no errors.

Cast (defined once in `video/lib/human.js`): **Alex** (spiky black hair, black hoodie, gray cargo pants, white sneakers, crossbody bag), **Mom**, **the Teacher** (brown suit, glasses), **Leo** (green jacket, gray beanie), police, students and townspeople.
Voices: narrator (deep), Alex, Mom (whisper), Teacher (British, formal), Leo. Captions show who is speaking and highlight key words in yellow.

Scenes: 1 billboard "TRUTH IS A CRIME" and a police scan · 2 kitchen with Mom · 3 classroom: "Who stole the money?" · 4 the teacher's smile disappears, police arrive · 5 hallway chase, locked doors, Leo · 6 secret control room · 7 every screen shows Alex: "THE NEXT MAYOR HAS BEEN FOUND."

**Rebuild:** `cd video && python3 audio.py truth`, then render in parts (`SCALE=1.5 START=0 END=12 PART=1 node render.mjs truth`, …) and join them with ffmpeg concat.

---

# IN THIS TOWN, NOBODY IS ALLOWED TO SLEEP

**Final video:** `nobody_is_allowed_to_sleep.mp4` (1080×1920, 9:16, 60 s, 30 fps, AAC audio). Deep narrator voice, word-synced captions with yellow keywords, music, and sound effects.

| Time | Scene | On screen |
|------|-------|-----------|
| 0–4 s | 1 Hook | A sleeper in moonlight vanishes into particles; the blanket drops; fast zoom into the empty bed |
| 4–9 s | 2 Mystery | Drone shot over the town at dawn; police at a house; untouched dinner |
| 9–17 s | 3 Panic | Empty bed, plates, a toy on the floor; STAY AWAKE emergency billboard; crowd with coffee; police car; ticking clock; yawning man |
| 17–22 s | 4 Bus | Bus in the rain; Alex by the window; eyes get heavy and close; cut to black and silence |
| 22–29 s | 5 Empty city | Alex wakes up; empty bus, no driver; bus drifts through the dark city; traffic light changes for no one |
| 29–36 s | 6 Basement | Alex gets off and runs to a house, opens the door and then the basement door; lights flicker on over rows of beds |
| 36–40 s | 7 His face | The sleepers all have Alex's face |
| 40–47 s | 8 Experiment 438 | A TV turns on; a man in a suit on a surveillance feed: EXPERIMENT 438 / SUBJECT AWAKENED |
| 47–60 s | 9 Twist | "Begin the final test."; every clone opens its eyes and turns to look; another Alex stands at the top of the stairs; lights out; Alex's eyes in the dark |

**Alex** is defined once in `video/lib/human.js` (`DESIGNS.alex`): messy, spiky black hair, black oversized hoodie with drawstrings and a pocket, gray cargo pants, white sneakers, black crossbody bag. The same model is used for every clone.

**Files:** `video/scenes/sleep.json` (narration, music, SFX), `video/scenes/sleep.js` (shots and camera), `video/lib/sleeptown.js` (bedroom, suburb, house, city, bus, basement, TV studio).
**Rebuild:** `cd video && python3 audio.py sleep && SCALE=1.5 node render.mjs sleep`

---

# THE PLAYER WHO WASN'T IN THE SERVER

**Finished 60-second Short:** `the_player_who_wasnt_in_the_server.mp4` (vertical 9:16, 62 s, narration + music + SFX + subtitles).
It's one continuous render; the 7 scenes are timed shots inside `video/scenes/lostplayer.js`:

| Time | Scene | What happens on screen |
|------|-------|------------------------|
| 0–5 s | Hook | Player list shows 1 player → LOSTPLAYER joins; camera snaps in on Jay's shocked face |
| 5–12 s | 2 | Crane shot over the abandoned town; LOSTPLAYER spawns in a light beam; "Do you still remember me?"; Jay freezes |
| 12–22 s | 3 | Jay types "Who are you?" → "You left me here."; sky turns red, buildings glitch and sink, debris floats |
| 22–35 s | 4 | LEAVING SERVER… → FAILED.; player list shows 3 players, one hidden |
| 35–47 s | 5 | Footsteps; Jay turns; his smiling double stares; "That's not you."; the double walks toward him |
| 47–56 s | 6 | Chase shot; "YOU WERE NEVER THE FIRST PLAYER."; daytime flashback of Jay and his friend building "OUR GAME" |
| 56–62 s | 7 | Camera sinks through the floor into a hidden room: two avatars sitting motionless; fade; whisper "Now you remember." |

**Cast:** JayBuilds (blue shirt, brown hair), LOSTPLAYER (green hoodie, black cap, red name), the Double (identical to Jay, hidden name, frozen wide-eyed smile). Defined once in `video/lib/characters.js`.

**Rebuild:** `cd video && python3 audio.py lostplayer && node render.mjs lostplayer`
**Quick preview stills:** `SNAP="5,20,40" node render.mjs lostplayer` → `video/out/snap_*.png`

---

# Earlier test: Scene 1 of a longer version


An animated, Roblox-style horror-mystery short, made scene by scene. Format: vertical 9:16 (720×1280, 30 fps), for TikTok, YouTube Shorts and Reels.

## Story outline (about 3–4 minutes total)

| # | Scene | Beat |
|---|-------|------|
| 1 | **The List Said Two** ✅ rendered | Max is alone on a night server. The player list says 2/1. A grey, faceless, nameless avatar stands at the map edge and gets closer every time Max looks away. |
| 2 | Chat Says Nothing | Max types "who r u?". The chat shows his message, then a blank message from no one. The stranger copies Max's movements. |
| 3 | Kick Doesn't Work | Max opens the admin panel. "Kick ███" → *Player not found.* The stranger is now standing on the spawn pad. |
| 4 | The Old Badge | Max follows the stranger to a hidden room with a 2017 badge: "First Visitor — Guest_0". The stranger was the server's first player, and was never saved. |
| 5 | Rejoin | Max leaves and rejoins. The list says 1/1, but the name tag over his own head reads `Guest_0`. |
| 6 | Outro / Hook | The stranger, now with Max's face, waves at the camera. "Part 2?" |

## Cast (fixed model sheet: `video/lib/characters.js`)

- **Max_Builds**: yellow skin, blue shirt, navy pants, smiley face. Changes to a worried face when scared.
- **The Stranger (Guest_0)**: all grey, no face, no name tag. It never animates and only moves between cuts.

Every scene builds its characters from this one file, so they look the same in every shot.

## How a scene is made

```
video/scenes/sceneN.json   ← narration lines, timing, sound effects (easy to edit, even on a phone)
video/scenes/sceneN.js     ← shots, camera moves, character animation
video/audio.py             ← AI voice narration (Kokoro TTS, offline) + generated SFX → out/sceneN.wav
video/render.mjs           ← renders every frame in headless Chrome (three.js) → out/sceneN.mp4
```

Build one scene (on the cloud machine; Claude runs this for you):

```bash
cd video
npm install                 # three.js
pip install kokoro-onnx soundfile numpy
# voice model files go in video/models/ (see audio.py)
python3 audio.py scene1     # narration + SFX + subtitle timing
node render.mjs scene1      # video with burned-in subtitles + audio
```

## Phone workflow

1. In the chat, ask Claude: *"Make scene 2"*, or *"In scene 1, make the narrator slower / add a scream / zoom in more."*
2. Claude edits the scene files, renders, and sends you the MP4. Watch it in the app.
3. Approve it or ask for changes. Repeat for each scene.
4. When every scene is approved, Claude joins them into one `final.mp4`.
5. Optional polish on your phone in **CapCut** (free): music, trending sounds, stickers, then post.
