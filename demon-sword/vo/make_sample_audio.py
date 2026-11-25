"""Sound for the 10 s sample: a tense original bed (drone + ticking pulse + plucks), a whoosh on every cut, a news
sting, a yawn swell and a hit on the last beat; mixed under Joe at -14 LUFS."""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import NOTE, SR, add, env_exp, lowpass, highpass
from make_score_sword import drone, koto, taiko, whoosh, glow_hum, write
from make_score_monster import thump

root = Path(__file__).resolve().parent.parent
ws = [w for tr in json.load(open(root / "vo/s1/timings.json"))["turns"] for w in tr["words"]]
W = lambda word, nth=1: [w["t"] for w in ws if re.sub(r"[^a-z]", "", w["w"].lower()) == word][nth - 1]
total = ws[-1]["end"] + 0.9
buf = np.zeros((int((total + 2) * SR), 2))
# the bed: a low drone, a ticking clock pulse, a little creepy pluck motif
add(buf, drone(NOTE(38 - 12), total + 0.5), 0, 0.7)
t = 0.0
while t < total - 0.5:
    n = int(0.02 * SR)
    add(buf, highpass(np.random.default_rng(int(t * 10)).standard_normal(n), 3000) * env_exp(n, 80), t, 0.18, pan=0.3)
    t += 0.5
for k, n in enumerate([74, 75, 79, 81, 79, 75]):
    add(buf, koto(NOTE(n)), 0.1 + k * 0.5, 0.18, pan=-0.2)
for k, n in enumerate([74, 75, 79, 81, 82, 81]):
    add(buf, koto(NOTE(n)), 5.0 + k * 0.4, 0.16, pan=0.2)
# whooshes on the cuts
for c in [W("if"), W("you", 2), W("so"), W("sleeps"), W("day"), W("everyone"), W("except"), W("he")]:
    add(buf, whoosh(0.35, 1200), c - 0.12, 0.18)
add(buf, thump(0.3, 70), W("you", 2), 0.5)
add(buf, glow_hum(1.0, 220), W("day"), 0.25)
add(buf, taiko(0.6, 60), W("fourteen"), 0.6)
add(buf, whoosh(0.9, 400), W("yawned") - 0.2, 0.3)
add(buf, taiko(0.8, 48, 1.2), W("yawned") + 0.45, 0.9)
add(buf, thump(0.5, 55), W("yawned") + 0.45, 0.7)
buf = buf[: int(total * SR)]
write(root / "vo/s1/bed.wav", buf, 0.85)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(root / "vo/s1/voice.wav"), "-i", str(root / "vo/s1/bed.wav"), "-filter_complex",
    "[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][vk];[1:a]volume=0.45[m];[m][vk]sidechaincompress=threshold=0.03:ratio=4:attack=20:release=300[md];[v][md]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1:LRA=11[o]",
    "-map", "[o]", "-ar", "48000", str(root / "vo/s1/mix.wav")], check=True)
print("mix done", round(total, 2))
