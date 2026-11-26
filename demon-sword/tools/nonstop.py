"""Make the narration nonstop: shrink every pause in the voice to a short breath, then remap the whole film to the new
time line, so the cuts still land on their words.

    python3 tools/nonstop.py            (reads vo/t1 + src/planT.gen.ts + out/final/TheLastText.mp4)

Writes vo/t2/voice.wav, vo/t2/timings.json, src/planT2.gen.ts (shot times remapped) and, with --video,
out/final/TheLastText_nonstop_picture.mp4 (each shot retimed uniformly to its new length; no new rendering needed:
every frame of the new film is a frame of the old one).
"""
import json, re, subprocess, sys, wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
GAP = 0.10  # what is left of a pause (a breath)
TAIL = 1.1  # the silence after the last word stays (the ending)
FPS = 30

# ---------------------------------------------------------------- the pauses in the voice
src = ROOT / "vo/t1/voice.wav"
with wave.open(str(src)) as f:
    sr, ch, sw, n = f.getframerate(), f.getnchannels(), f.getsampwidth(), f.getnframes()
    raw = f.readframes(n)
a = np.frombuffer(raw, dtype=np.int16).reshape(-1, ch)
dur = len(a) / sr
log = subprocess.run(["ffmpeg", "-v", "info", "-i", str(src), "-af", "silencedetect=noise=-40dB:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
sil = [(s, e) for s, e in zip(starts, ends) if e - s > GAP]
# knots of the time map old -> new
knots = [(0.0, 0.0)]
shift = 0.0
for s, e in sil:
    keep = TAIL if e >= dur - 0.02 else GAP
    if s < 0.05:  # the lead-in before the first word stays as it is
        continue
    knots.append((s, s - shift))
    shift += (e - s) - keep
    knots.append((e, e - shift))
knots.append((dur, dur - shift))
ko = np.array([k[0] for k in knots])
kn = np.array([k[1] for k in knots])
M = lambda t: float(np.interp(t, ko, kn))
new_dur = kn[-1]
print(f"voice {dur:.2f} s -> {new_dur:.2f} s ({len(sil)} pauses shortened, {shift:.2f} s of silence removed)")

# ---------------------------------------------------------------- the new voice: speech kept, pauses cut to a breath
out = []
prev = 0.0
for s, e in sil:
    if s < 0.05:
        continue
    keep = TAIL if e >= dur - 0.02 else GAP
    out.append(a[int(prev * sr):int(s * sr)])
    h = int(keep * sr / 2)
    out.append(a[int(s * sr):int(s * sr) + h])  # the start of the pause (the voice's own release)
    out.append(a[int(e * sr) - (int(keep * sr) - h):int(e * sr)])  # and its end (the breath in)
    prev = e
out.append(a[int(prev * sr):])
v = np.concatenate(out)
(ROOT / "vo/t2").mkdir(exist_ok=True)
with wave.open(str(ROOT / "vo/t2/voice.wav"), "wb") as f:
    f.setnchannels(ch); f.setsampwidth(sw); f.setframerate(sr); f.writeframes(v.astype(np.int16).tobytes())

# ---------------------------------------------------------------- the word timings and the shot plan, remapped
tim = json.loads((ROOT / "vo/t1/timings.json").read_text())
for turn in tim["turns"]:
    for w in turn["words"]:
        w["t"], w["end"] = round(M(w["t"]), 3), round(M(w["end"]), 3)
tim["source"] = tim.get("source", "") + " + nonstop (pauses shortened)"
(ROOT / "vo/t2/timings.json").write_text(json.dumps(tim))
plan_src = (ROOT / "src/planT.gen.ts").read_text()
shots = json.loads(re.search(r"export const SHOTS = (\[.*?\]) as const;", plan_src, re.S).group(1))
old_total = int(re.search(r"export const DURATION = (\d+);", plan_src).group(1))
new_shots = [{**s, "t": round(M(s["t"]), 4), "end": round(M(s["end"]), 4)} for s in shots]
new_total = round(M(old_total / FPS) * FPS)
p2 = re.sub(r"export const SHOTS = \[.*?\] as const;", lambda _: "export const SHOTS = " + json.dumps(new_shots) + " as const;", plan_src, flags=re.S)
p2 = re.sub(r"export const DURATION = \d+;", f"export const DURATION = {new_total};", p2)
(ROOT / "src/planT2.gen.ts").write_text(p2)
print(f"plan: {old_total} -> {new_total} frames")

# ---------------------------------------------------------------- the picture: each shot retimed to its new length
if "--video" in sys.argv:
    W_, H_ = 1080, 1920
    fsz = W_ * H_ * 3 // 2
    old_cut = [round(s["t"] * FPS) for s in shots] + [old_total]
    new_cut = [round(s["t"] * FPS) for s in new_shots] + [new_total]
    new_cut[0] = 0
    src_v = ROOT / "out/final/TheLastText.mp4"
    dst_v = ROOT / "out/final/TheLastText_nonstop_picture.mp4"
    rd = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(src_v), "-f", "rawvideo", "-pix_fmt", "yuv420p", "-"], stdout=subprocess.PIPE)
    wr = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", f"{W_}x{H_}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst_v)], stdin=subprocess.PIPE)
    cur_i, cur = -1, None
    speeds = []
    for k in range(len(shots)):
        a0, a1, b0, b1 = old_cut[k], old_cut[k + 1], new_cut[k], new_cut[k + 1]
        speeds.append((shots[k]["id"], (a1 - a0) / max(1, b1 - b0)))
        for j in range(b0, b1):
            src_i = min(a1 - 1, a0 + int((j - b0) * (a1 - a0) / (b1 - b0) + 1e-6))
            while cur_i < src_i:
                cur = rd.stdout.read(fsz)
                cur_i += 1
            wr.stdin.write(cur)
    wr.stdin.close(); wr.wait(); rd.stdout.close(); rd.kill()
    fast = sorted(speeds, key=lambda x: -x[1])[:6]
    print("fastest shots:", ", ".join(f"{i} x{s:.2f}" for i, s in fast))
    print(f"wrote {dst_v}")
