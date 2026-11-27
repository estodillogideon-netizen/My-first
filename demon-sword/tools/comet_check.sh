#!/usr/bin/env bash
# Numeric checks of the Comet Swap staging and lenses (no rendering): bash tools/comet_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p out
npx --no-install esbuild tools/comet_check.ts --bundle --platform=node --format=esm --outfile=out/comet_check.mjs --log-level=error
node out/comet_check.mjs | tee out/comet_check.txt
