#!/usr/bin/env bash
# Numeric checks of the Goodbye Monster staging and lenses (no rendering): bash tools/text_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p out
npx --no-install esbuild tools/text_check.ts --bundle --platform=node --format=esm --outfile=out/text_check.mjs --log-level=error
node out/text_check.mjs | tee out/text_check.txt
