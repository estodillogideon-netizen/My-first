#!/usr/bin/env bash
# Look-dev: render chosen output frames of ShadowSwap in one render, tile them into out/pick_<tag>.jpg.
# usage: bash tools/pick.sh <tag> <frame> [frame...]   (env SCALE=0.4, COLS=6)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
TAG="${1:?usage: pick.sh <tag> <frames...>}"; shift
SCALE="${SCALE:-0.4}"; COLS="${COLS:-6}"
[ -e "out/pick_${TAG}.jpg" ] && { echo "tag used" >&2; exit 1; }
FR=$(printf '%s,' "$@"); FR="[${FR%,}]"
N=$#
npx --no-install remotion bundle src/index.ts --out-dir=build >/dev/null
python3 -I scripts/gpu_lock.py -- npx --no-install remotion render build ShadowPick "out/pick_${TAG}.mp4" --props="{\"frames\":$FR}" --scale="$SCALE" --gl=angle --concurrency=4 --log=error --crf=12
ROWS=$(( (N + COLS - 1) / COLS ))
ffmpeg -v error -y -i "out/pick_${TAG}.mp4" -vf "tile=${COLS}x${ROWS}:padding=4:color=white" -frames:v 1 "out/pick_${TAG}.jpg"
echo "out/pick_${TAG}.jpg"
