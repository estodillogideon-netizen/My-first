#!/usr/bin/env bash
# Numeric checks of the Goodbye Monster staging and lenses (no rendering): bash tools/sword_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p out
npx --no-install esbuild tools/sword_check.ts --bundle --platform=node --format=esm --outfile=out/sword_check.mjs --log-level=error
node out/sword_check.mjs | tee out/sword_check.txt
