# The Player Who Wasn't in the Server

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
