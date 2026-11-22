#!/usr/bin/env bash
# Mix the narration, the music bed (ducked under the voice) and the sound effects into vo/mix.wav at -14 LUFS / -1 dBTP,
# then (optionally) mux it onto a video: bash vo/mix.sh [video.mp4 out.mp4]
set -euo pipefail
cd "$(dirname "$0")/.."
VOICE="${VOICE:-vo/voice_normal.wav}"
ffmpeg -v error -y -i "$VOICE" -i vo/music.wav -i vo/sfx.wav -filter_complex "\
[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.0,asplit=2[v][vk];\
[1:a]volume=0.22[m];[m][vk]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[md];\
[2:a]volume=0.9[s];\
[v][md][s]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1:LRA=11[o]" -map "[o]" -ar 48000 vo/mix.wav
echo "wrote vo/mix.wav"
if [ "$#" -ge 2 ]; then
  ffmpeg -v error -y -i "$1" -i vo/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart "$2"
  echo "wrote $2"
fi
