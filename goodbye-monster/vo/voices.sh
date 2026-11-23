#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
export PIPER=/tmp/claude-0/-home-user-My-first/b653b0c1-9ad4-51aa-9c76-f27eef8c0f4c/scratchpad/tts/venv/bin/piper PIPER_MODEL=/tmp/claude-0/-home-user-My-first/b653b0c1-9ad4-51aa-9c76-f27eef8c0f4c/scratchpad/tts/voice/joe_us_piper_voice/data/en_US-joe-medium.onnx
EXTRA_JSON='{"2":0.25,"3":0.2,"10":0.3,"11":0.2,"12":0.45,"17":0.4,"22":0.35,"24":0.3,"26":0.35,"30":0.3,"32":0.4,"33":0.3,"36":0.3,"37":0.35,"41":0.6,"42":0.9,"43":0.35}' /tmp/claude-0/-home-user-My-first/b653b0c1-9ad4-51aa-9c76-f27eef8c0f4c/scratchpad/tts/venv/bin/python -u vo/make_voice2.py vo/p1/script.txt vo/p1/voice.wav vo/p1/timings.json 118
EXTRA_JSON='{"3":0.3,"5":0.3,"7":0.3,"9":0.35,"11":0.3,"14":0.3,"15":0.2,"19":0.3,"23":0.2,"24":0.15,"26":0.3,"27":0.4,"28":0.2,"30":0.4,"31":0.3,"33":0.4,"35":0.3,"36":0.3,"37":0.4,"38":0.3}' /tmp/claude-0/-home-user-My-first/b653b0c1-9ad4-51aa-9c76-f27eef8c0f4c/scratchpad/tts/venv/bin/python -u vo/make_voice2.py vo/p2/script.txt vo/p2/voice.wav vo/p2/timings.json 118
echo VOICES_DONE
