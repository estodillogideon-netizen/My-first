#!/usr/bin/env bash
# round 3: B01/B02 re-rendered with the rebuilt bike (Max seated, feet on the pedals, hands on the grips)
set -e
cd "$(dirname "$0")/.."
export BROWSER_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npx --no-install remotion bundle src/index.ts --out-dir=build2 >/dev/null
export BUILD=build2 COMP=TextSub2
cp out/patches_t3_base.txt out/patches_t3.txt
while read id a b; do rm -f "out/final/tfix3_$id.mp4" "out/final/tfix3_${id}_sub.mp4"; bash tools/render_part.sh "tfix3_$id" $a $b < /dev/null && echo "tfix3_$id $a $b" >> out/patches_t3.txt; done < out/patch_t3_ranges.txt
sort -k2 -n out/patches_t3.txt -o out/patches_t3.txt
PLAN=src/planT.gen.ts PRE=t1 MIX=vo/t1/mix.wav PATCHES=out/patches_t3.txt OUT=out/final/TheLastText.mp4 python3 tools/splice_part.py 1
echo PATCHED_READY
