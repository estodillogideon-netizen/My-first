#!/usr/bin/env bash
# Mix one part's narration, score (ducked under the voice) and sound effects into vo/p<N>/mix.wav at -14 LUFS.
# usage: bash vo/mix_part.sh <1|2>
set -euo pipefail
cd "$(dirname "$0")/.."
P="$1"; D="vo/p$P"
ffmpeg -v error -y -i "$D/voice.wav" -i "$D/music.wav" -i "$D/sfx.wav" -filter_complex "\
[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.0,asplit=2[v][vk];\
[1:a]volume=0.36[m];[m][vk]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=400[md];\
[2:a]volume=0.55[s];\
[v][md][s]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1:LRA=11[o]" -map "[o]" -ar 48000 "$D/mix.wav"
echo "wrote $D/mix.wav"
