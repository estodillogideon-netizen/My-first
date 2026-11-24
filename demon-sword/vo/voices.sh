#!/usr/bin/env bash
# Joe (Piper en_US-joe-medium) narration of "The Sword That Can't Lie", with dramatic pauses before some lines
set -e
cd "$(dirname "$0")/.."
export PIPER=/tmp/claude-0/-home-user-My-first/b653b0c1-9ad4-51aa-9c76-f27eef8c0f4c/scratchpad/tts/venv/bin/piper PIPER_MODEL=/tmp/claude-0/-home-user-My-first/b653b0c1-9ad4-51aa-9c76-f27eef8c0f4c/scratchpad/tts/voice/joe_us_piper_voice/data/en_US-joe-medium.onnx
EXTRA_JSON='{}' /tmp/claude-0/-home-user-My-first/b653b0c1-9ad4-51aa-9c76-f27eef8c0f4c/scratchpad/tts/venv/bin/python -u vo/make_voice2.py vo/p1/script.txt vo/p1/voice.wav vo/p1/timings.json 126
echo VOICE_DONE
