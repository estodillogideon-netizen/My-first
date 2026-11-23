#!/usr/bin/env bash
# Numeric checks of the Shadow Swap staging and lenses (no rendering): bash tools/shadow_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p out
npx --no-install esbuild tools/shadow_check.ts --bundle --platform=node --format=esm --outfile=out/shadow_check.mjs --log-level=error
node out/shadow_check.mjs | tee out/shadow_check.txt
