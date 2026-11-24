"""Assemble out/final/GoodbyeMonster_Part<P>.mp4 from the 3 render parts + patches (later win), mux vo/p<P>/mix.wav.
usage: python3 tools/splice_part.py <P>    (patches: lines "name a b" in out/patches<P>.txt)"""
import re, subprocess, sys
P = sys.argv[1]
N = int(re.search(r"DURATION = (\d+)", open(f"src/plan{P}.gen.ts").read()).group(1))
A, B = N // 3, 2 * N // 3
srcs = [(f"p{P}_part1", 0, A - 1), (f"p{P}_part2", A, B - 1), (f"p{P}_part3", B, N - 1)]
try:
    srcs += [(n, int(a), int(b)) for n, a, b in (l.split() for l in open(f"out/patches{P}.txt") if l.strip())]
except FileNotFoundError:
    pass
owner = [None] * N
for name, a, b in srcs:
    for f in range(a, b + 1):
        owner[f] = (name, a)
assert all(owner), "gap"
segs = []
for f in range(N):
    if segs and segs[-1][0] == owner[f][0] and segs[-1][2] == f - 1:
        segs[-1][2] = f
    else:
        segs.append([owner[f][0], f, f, owner[f][1]])
names = sorted({s[0] for s in segs})
inputs, idx = [], {}
for n in names:
    idx[n] = len(inputs) // 2
    inputs += ["-i", f"out/final/{n}.mp4"]
mix = len(names)
inputs += ["-i", f"vo/p{P}/mix.wav"]
uses = {n: sum(1 for s in segs if s[0] == n) for n in names}
fc = []
for n in names:
    k = uses[n]
    fc.append(f"[{idx[n]}:v]split={k}" + "".join(f"[{n}_{i}]" for i in range(k)) if k > 1 else f"[{idx[n]}:v]null[{n}_0]")
cnt = {n: 0 for n in names}
labels = []
for j, (n, a, b, base) in enumerate(segs):
    i = cnt[n]; cnt[n] += 1
    fc.append(f"[{n}_{i}]trim=start_frame={a - base}:end_frame={b - base + 1},setpts=PTS-STARTPTS[s{j}]")
    labels.append(f"[s{j}]")
fc.append("".join(labels) + f"concat=n={len(segs)}:v=1:a=0,fps=30[v]")
print("segments:", [(s[0], s[1], s[2]) for s in segs])
out = f"out/final/TheSwordThatCantLie.mp4"
cmd = ["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "[v]", "-map", f"{mix}:a",
       "-c:v", "libx264", "-b:v", "3200k", "-maxrate", "4200k", "-bufsize", "8400k", "-preset", "slow", "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out]
subprocess.run(cmd, check=True)
print(subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-show_entries", "stream=codec_type,nb_read_frames", "-of", "compact", out], capture_output=True, text=True).stdout)
print(f"SPLICED{P}")
