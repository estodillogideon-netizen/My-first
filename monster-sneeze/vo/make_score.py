"""An original background score + sound effects for "The Shadow Swap", synthesised from scratch with numpy (no samples,
no third-party music): a soft piano + pad score that follows the story (bittersweet morning, a lighter school groove,
the power cut, a minor yard, a music-box flashback, the swell when Kai finally cries, a hopeful ending) and a few sound
effects on the beats (light flicker buzz, the power-down thunk, paper rustle, Ollie's humming, a whoosh when the shadow
stands, sparkles when it comes home and when the new shadow appears). Times come from vo/timings.json and
src/plan.gen.ts, so everything stays on its words.

    python vo/make_score.py vo/timings.json src/plan.gen.ts vo/music.wav vo/sfx.wav
"""
import json, re, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import NOTE, SR, W, add, env_exp, highpass, lowpass, pad, tone, words  # noqa: E402

rng = np.random.default_rng(11)
BEAT = 60 / 76


def piano(f, dur=1.6, vel=1.0):
    x = tone(f, dur, ((1, 1.0), (2, 0.38), (3, 0.14), (4.02, 0.07), (5.03, 0.03)), k=2.6, att=0.006)
    return lowpass(x, 3200) * vel


def musicbox(f, dur=1.2):
    return tone(f, dur, ((1, 1.0), (4.2, 0.28), (8.9, 0.06)), k=3.6, att=0.002) * 0.7


def shots(plan):
    src = Path(plan).read_text(encoding="utf8")
    sh = json.loads(re.search(r"export const SHOTS = (\[.*?\]) as const;", src).group(1))
    total = int(re.search(r"export const DURATION = (\d+);", src).group(1)) / 30
    return {s["id"]: s["t"] for s in sh}, total


# chords: (bass MIDI, chord MIDI)
C, G, Am, F, Em, Dm = (36, [60, 64, 67]), (43, [59, 62, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (40, [59, 64, 67]), (38, [57, 62, 65])


def section(buf, t0, t1, prog, style, gain=1.0):
    """fill [t0, t1) with a progression: one chord per bar (4 beats)"""
    bar = 4 * BEAT
    t, i = t0, 0
    while t < t1 - 0.05:
        root, ch = prog[i % len(prog)]
        dur = min(bar, t1 - t)
        if style in ("arp", "arp2", "swell", "end"):
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.55 * gain)
            add(buf, piano(NOTE(root), 3.0, 0.8), t, 0.5 * gain)
            pat = [0, 2, 1, 2, 0 + 12, 2, 1, 2] if style != "end" else [0, 1, 2, 12]
            step = BEAT / 2 if style != "end" else BEAT
            for k, p in enumerate(pat):
                tt = t + k * step
                if tt >= t1 - 0.05:
                    break
                n = ch[p % 12 if p < 12 else 0] + (12 if p >= 12 else 0)
                add(buf, piano(NOTE(n + 12), 1.4, 0.6 if k % 2 else 0.8), tt, 0.32 * gain, pan=0.25 if k % 2 else -0.2)
            if style == "arp2":
                # a light pluck on the off-beats (the school)
                for k in range(4):
                    tt = t + (k + 0.5) * BEAT
                    if tt < t1 - 0.05:
                        add(buf, tone(NOTE(ch[k % 3] + 24), 0.25, ((1, 1.0), (3.9, 0.2)), k=14), tt, 0.12 * gain, pan=0.4)
        elif style == "sparse":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.8), t, 0.6 * gain)
            add(buf, piano(NOTE(root), 3.2, 0.7), t, 0.45 * gain)
            for k, p in enumerate([2, 1]):
                tt = t + (k * 2 + 1) * BEAT
                if tt < t1 - 0.05:
                    add(buf, piano(NOTE(ch[p] + 12), 2.0, 0.6), tt, 0.3 * gain)
        elif style == "box":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.4 * gain)
            mel = [ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[2] + 14, ch[2] + 12, ch[0] + 12]
            for k, n in enumerate(mel):
                tt = t + k * BEAT / 2
                if tt < t1 - 0.05:
                    add(buf, musicbox(NOTE(n + 12)), tt, 0.22 * gain, pan=0.15)
        elif style == "drone":
            add(buf, pad([NOTE(n - 12) for n in ch], dur + 0.4), t, 0.7 * gain)
        t += bar
        i += 1


def music(ws, S, total):
    buf = np.zeros((int((total + 3) * SR), 2))
    pw = W(ws, 15, "power")
    section(buf, 0.0, S["C01"], [C, G, Am, F], "arp", 0.9)
    section(buf, S["C01"], S["E01"], [C, Em, F, G], "arp2", 0.85)
    section(buf, S["E01"], pw + 0.2, [Am], "drone", 0.8)
    # silence after the power cut, then the minor yard
    section(buf, S["F01"], S["G01"], [Am, F, C, G], "sparse", 0.85)
    section(buf, S["G01"], S["H01"], [Am, F, C, G], "box", 0.9)
    section(buf, S["H01"], S["J01"], [Am, F, C, G], "sparse", 0.85)
    section(buf, S["J01"], S["K01"], [F, G, Am, Am], "sparse", 1.0)
    section(buf, S["K01"], S["M01"], [C, G, Am, F], "swell", 1.05)
    section(buf, S["M01"], total - 2.4, [F, C, G, C], "arp", 0.9)
    # the last chord rings out
    add(buf, pad([NOTE(n) for n in C[1]], 4.0), total - 2.4, 0.6)
    for k, n in enumerate([48, 60, 64, 67, 72]):
        add(buf, piano(NOTE(n), 4.0, 0.8), total - 2.4 + k * 0.12, 0.35)
    buf = buf[: int(total * SR)]
    fade = np.minimum(1, np.arange(len(buf)) / (0.4 * SR))[:, None] * np.minimum(1, (len(buf) - np.arange(len(buf))) / (1.2 * SR))[:, None]
    return buf * fade


def noise(n):
    return rng.standard_normal(n)


def sfx(ws, S, total):
    buf = np.zeros((int((total + 3) * SR), 2))
    pw = W(ws, 15, "power")
    # light flicker: short 120 Hz buzz bursts from E01 to the power cut
    t = S["E01"] + 0.3
    while t < pw:
        n = int(0.09 * SR)
        x = np.sign(np.sin(2 * np.pi * 120 * np.arange(n) / SR)) * env_exp(n, 30)
        add(buf, lowpass(x, 900) * 0.25, t, 1.0, pan=0.3)
        t += 0.17 + 0.11 * rng.random()
    # the power-down thunk: a falling hum and a low thump
    n = int(1.1 * SR)
    tt = np.arange(n) / SR
    fdrop = 120 * np.exp(-tt * 2.2) + 30
    x = np.sin(2 * np.pi * np.cumsum(fdrop) / SR) * env_exp(n, 2.6)
    add(buf, x * 0.5, pw + 0.15)
    add(buf, lowpass(noise(int(0.3 * SR)), 200) * env_exp(int(0.3 * SR), 14) * 0.9, pw + 0.15)
    # paper rustle (the note)
    for k in range(3):
        m = int(0.12 * SR)
        add(buf, highpass(lowpass(noise(m), 6000), 1500) * env_exp(m, 18) * 0.25, S["D05"] + 0.35 + 0.13 * k, 1.0, pan=-0.2)
    # Ollie humming (D03 .. D05): a soft "mm" melody with vibrato
    mel = [64, 67, 69, 67, 64, 62, 60, 62]
    t0 = S["D03"] + 0.1
    for k, m in enumerate(mel):
        tt0 = t0 + k * 0.42
        if tt0 > S["D05"] - 0.2:
            break
        n = int(0.4 * SR)
        tt = np.arange(n) / SR
        f = NOTE(m - 12) * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * tt))
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
        e = np.minimum(1, tt / 0.06) * np.minimum(1, (0.4 - tt) / 0.08)
        add(buf, lowpass(x * e, 1200) * 0.22, tt0, 1.0, pan=0.3)
    # the shadow stands up: a soft rising whoosh
    n = int(0.8 * SR)
    tt = np.arange(n) / SR
    x = noise(n)
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(n, 1 / SR)
    X *= np.exp(-((fr - 900) / 700) ** 2)
    x = np.fft.irfft(X, n) * np.sin(np.pi * tt / 0.8) ** 2
    add(buf, x / (np.abs(x).max() + 1e-9) * 0.35, S["K04"] - 0.1)
    # sparkles: the shadow comes home (K07), the new shadow appears (L02)
    for t0, base in ((S["K07"] + 0.05, 84), (S["L02"] + 0.05, 88)):
        for k, m in enumerate([0, 4, 7, 12, 16, 19]):
            add(buf, tone(NOTE(base + m), 1.2, ((1, 1.0), (2.76, 0.2)), k=4.5), t0 + k * 0.07, 0.11, pan=(k % 3 - 1) * 0.4)
    return buf[: int(total * SR)]


def write(path, buf, peak=0.9):
    m = np.abs(buf).max() or 1
    pcm = (buf / m * peak * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())


def main(timings, plan, out_music, out_sfx):
    ws = words(timings)
    S, total = shots(plan)
    write(out_music, music(ws, S, total), 0.85)
    write(out_sfx, sfx(ws, S, total), 0.8)
    print(f"wrote {out_music} and {out_sfx} ({total:.2f} s)")


if __name__ == "__main__":
    main(*sys.argv[1:5])
