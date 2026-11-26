#!/usr/bin/env bash
# Numeric checks of the Villain Card staging and lenses (no rendering): bash tools/hero_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p out
npx --no-install esbuild tools/hero_check.ts --bundle --platform=node --format=esm --outfile=out/hero_check.mjs --log-level=error
node out/hero_check.mjs | tee out/hero_check.txt
