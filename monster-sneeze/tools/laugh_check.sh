#!/usr/bin/env bash
# Numeric checks of the Laugh Lift staging and lenses (no rendering): bash tools/laugh_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p out
npx --no-install esbuild tools/laugh_check.ts --bundle --platform=node --format=esm --outfile=out/laugh_check.mjs --log-level=error
node out/laugh_check.mjs | tee out/laugh_check.txt
