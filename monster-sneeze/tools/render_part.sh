#!/usr/bin/env bash
# Render output frames a..b of the film with 2-sample motion blur (MonsterSub2), average each pair -> out/final/<name>.mp4
# usage: bash tools/render_part.sh <name> <a> <b>     (never overwrites; env BROWSER_EXECUTABLE for a local Chrome;
#        PROPS='{"captions":false}' renders without the burned-in captions)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
NAME="$1"; A="$2"; B="$3"
mkdir -p out/final
OUT="out/final/$NAME.mp4"; SUBV="out/final/${NAME}_sub.mp4"
[ -e "$OUT" ] && { echo "$OUT exists" >&2; exit 1; }
t0=$(date +%s)
python3 -I scripts/gpu_lock.py -- npx --no-install remotion render "${BUILD:-build}" "${COMP:-MonsterSub2}" "$SUBV" --frames="$((A * 2))-$((B * 2 + 1))" --gl=angle --timeout=240000 \
  --concurrency="${CONC:-4}" ${PROPS:+--props="$PROPS"} --codec=h264 --crf=10 --pixel-format=yuv420p --muted --log=error
ffmpeg -v error -y -i "$SUBV" -vf "tmix=frames=2:weights='1 1',select='eq(mod(n\,2)\,1)',setpts=N/30/TB" -r 30 -frames:v "$((B - A + 1))" \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -an -map_metadata -1 "$OUT"
echo "$NAME frames $A-$B done in $(( $(date +%s) - t0 )) s"
