#!/usr/bin/env bash
# Numeric checks of the Monster Sneeze staging and lenses (no rendering): bash tools/monster_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p out
npx --no-install esbuild tools/monster_check.ts --bundle --platform=node --format=esm --outfile=out/monster_check.mjs --log-level=error
node out/monster_check.mjs | tee out/monster_check.txt
