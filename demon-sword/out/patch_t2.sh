#!/usr/bin/env bash
# round 2: re-render C06b C10 D03 D03b D05 D06 D07 F03 (faces turned to the lens, the hood's shadow fading), then splice
set -e
cd "$(dirname "$0")/.."
export BROWSER_EXECUTABLE=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
npx --no-install remotion bundle src/index.ts --out-dir=build2 >/dev/null
export BUILD=build2 COMP=TextSub2
cp out/patches_t2_base.txt out/patches_t2.txt
while read id a b; do rm -f "out/final/tfix2_$id.mp4" "out/final/tfix2_${id}_sub.mp4"; bash tools/render_part.sh "tfix2_$id" $a $b < /dev/null && echo "tfix2_$id $a $b" >> out/patches_t2.txt; done < out/patch_t2_ranges.txt
sort -k2 -n out/patches_t2.txt -o out/patches_t2.txt
PLAN=src/planT.gen.ts PRE=t1 MIX=vo/t1/mix.wav PATCHES=out/patches_t2.txt OUT=out/final/TheLastText.mp4 python3 tools/splice_part.py 1
echo PATCHED_READY
