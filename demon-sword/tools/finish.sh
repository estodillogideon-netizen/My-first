#!/usr/bin/env bash
# After the three parts are rendered: join them, check the frame count, and put the sound on.
# Writes out/final/laugh_lift_silent.mp4 and out/final/laugh_lift_final.mp4 (1080x1920, 30 fps, voice + music + sfx).
set -euo pipefail
cd "$(dirname "$0")/.."
D=out/final
printf "file '%s'\n" "$PWD/$D/part1.mp4" "$PWD/$D/part2.mp4" "$PWD/$D/part3.mp4" > $D/parts.txt
ffmpeg -v error -y -f concat -safe 0 -i $D/parts.txt -c copy -movflags +faststart $D/laugh_lift_silent.mp4
ffmpeg -v error -y -i $D/laugh_lift_silent.mp4 -i vo/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart $D/laugh_lift_final.mp4
FR=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $D/laugh_lift_final.mp4 | tr -d ',\r')
echo "FINISHED frames=$FR $(ffprobe -v error -show_entries format=duration -of csv=p=0 $D/laugh_lift_final.mp4)s"
