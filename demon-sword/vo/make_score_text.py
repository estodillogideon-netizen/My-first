"""An original score + sound effects for "The Last Text" (synthesised with numpy; no samples, no third-party music).
A tender piano theme in A minor (it turns to A major at the end), a music box for Ellie, a low drone and a heartbeat
for the midnight knocks, a choir swell when the man is revealed, warm strings at the lake.
Sound effects on their words: birthday clapping, the phone's buzz, a bike bell, rain all night, three slow knocks, the
deadbolt click, the door creaking open, thunder, the mist whoosh, lake water and birds, the text glitch, a soft chime.

    python vo/make_score_text.py
"""
import json, re, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import NOTE, SR, W, add, env_exp, highpass, lowpass, pad, words  # noqa: E402
from make_score_monster import AH, OO, bassp, musicbox, piano, sparkle, thump, vowel  # noqa: E402
from make_score_sword import choir, drone, heartbeat, whoosh, click, step, bird, hash_  # noqa: E402

rng = np.random.default_rng(77)
noise = lambda n: rng.standard_normal(n)


def shots(plan):
    src = Path(plan).read_text(encoding="utf8")
    sh = json.loads(re.search(r"export const SHOTS = (\[.*?\]) as const;", src).group(1))
    total = int(re.search(r"export const DURATION = (\d+);", src).group(1)) / 30
    return {s["id"]: s["t"] for s in sh}, total


Am, F, C, G, Dm, E7, E, A, D, Fm = (45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62]), (38, [57, 62, 65]), (40, [56, 59, 62]), (40, [56, 59, 64]), (45, [57, 61, 64]), (38, [57, 62, 66]), (41, [56, 60, 65])
THEME = [76, 74, 72, 71, 72, 69, 71, 64]  # the piano theme
THEME_MAJ = [76, 73, 71, 69, 71, 73, 76, 81]


def strings(fs, dur, k=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    y = np.zeros(n)
    for f in fs:
        for det in (-0.004, 0.0, 0.005):
            vib = 1 + 0.003 * np.sin(2 * np.pi * 5.2 * tt + f)
            ph = 2 * np.pi * np.cumsum(f * (1 + det) * vib) / SR
            y += sum(np.sin(h * ph) / (h * 1.3) for h in range(1, 6))
    e = np.minimum(1, tt / 0.6) * np.minimum(1, (dur - tt) / 0.6)
    return lowpass(y * e, 2600) * k / (len(fs) * 3)


def section(buf, t0, t1, prog, style, bpm, gain=1.0):
    beat = 60 / bpm
    bar = 4 * beat
    t, i = t0, 0
    while t < t1 - 0.05:
        root, ch = prog[i % len(prog)]
        dur = min(bar, t1 - t)
        at = lambda k: t + k * beat
        ok = lambda tt: tt < t1 - 0.05
        if style == "party":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.5), t, 0.3 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    n = [ch[0], ch[2], ch[1] + 12, ch[2]][k % 4]
                    add(buf, piano(NOTE(n + 12), 0.5, 0.6), at(k / 2), 0.2 * gain, pan=0.2 if k % 2 else -0.2)
            for k in (0, 2):
                if ok(at(k)):
                    add(buf, bassp(NOTE(root), 0.3), at(k), 0.35 * gain)
        elif style == "theme":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.35 * gain)
            add(buf, piano(NOTE(root), 3.0, 0.7), t, 0.35 * gain)
            if i % 2 == 0:
                for k, n in enumerate(THEME[:4] if i % 4 == 0 else THEME[4:]):
                    if ok(at(k)):
                        add(buf, piano(NOTE(n), 1.6, 0.7), at(k), 0.28 * gain, pan=0.1)
        elif style == "dread":
            add(buf, drone(NOTE(root - 12), dur + 0.6), t, 0.9 * gain)
            if i % 2 == 1 and ok(at(2)):
                add(buf, piano(NOTE(ch[0] + 12), 2.5, 0.5), at(2), 0.18 * gain)
        elif style == "box":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.25 * gain)
            for k, n in enumerate(THEME):
                if ok(at(k / 2)):
                    add(buf, musicbox(NOTE(n + 12)), at(k / 2), 0.16 * gain, pan=0.2)
        elif style == "swell":
            add(buf, strings([NOTE(n) for n in ch], dur + 0.6), t, 1.0 * gain)
            add(buf, choir([NOTE(n) for n in ch], dur + 0.6, OO), t, 0.6 * gain)
            add(buf, piano(NOTE(root), 3.0, 0.8), t, 0.35 * gain)
        elif style == "tender":
            add(buf, strings([NOTE(n) for n in ch], dur + 0.6), t, 0.7 * gain)
            add(buf, piano(NOTE(root), 3.0, 0.7), t, 0.3 * gain)
            for k, n in enumerate([ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[1] + 12]):
                if ok(at(k)):
                    add(buf, piano(NOTE(n), 1.8, 0.6), at(k), 0.24 * gain, pan=0.15 * (k % 2))
        elif style in ("lake", "end"):
            add(buf, strings([NOTE(n) for n in ch], dur + 0.6), t, 0.55 * gain)
            add(buf, piano(NOTE(root), 2.6, 0.8), t, 0.35 * gain)
            mel = THEME_MAJ if style == "end" else [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12]
            for k, n in enumerate(mel):
                tt = at(k * (0.5 if style == "end" else 1.0))
                if not ok(tt):
                    break
                add(buf, piano(NOTE(n), 1.4, 0.7), tt, 0.26 * gain, pan=0.2 if k % 2 else -0.2)
        t += bar
        i += 1


def music(ws, S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    plan = [("A01", "B04", [A, D, E, A], "party", 112, 0.85), ("B04", "C01", [Am, F], "theme", 76, 0.85), ("C01", "D01", [Am, Fm], "dread", 64, 1.0),
            ("D01", "D07", [Am, F, C, G], "box", 84, 0.9), ("D07", "E01", [Am, F], "theme", 70, 0.8), ("E01", "F01", [Am, Fm], "dread", 60, 1.05),
            ("F01", "F06", [Am, F, Dm, E], "swell", 64, 1.0), ("F06", "G05", [F, C, Am, G], "tender", 66, 0.95), ("G05", "H01", [Dm, Am, F, E], "swell", 62, 0.95),
            ("H01", "J01", [A, D, A, E], "lake", 92, 0.9), ("J01", "J05", [Am, F], "dread", 64, 0.8), ("J05", None, [A, D, E, A], "end", 76, 1.0)]
    for a, b, prog, style, bpm, g in plan:
        section(buf, S[a], S[b] if b else total - 2.2, prog, style, bpm, g)
    add(buf, choir([NOTE(n + 12) for n in A[1]], 3.0, AH, 1.1), S["F03"] + 0.2, 0.7)
    add(buf, pad([NOTE(n) for n in A[1]], 3.6), total - 2.2, 0.5)
    for k, n in enumerate([57, 64, 69, 73, 76]):
        add(buf, piano(NOTE(n), 3.5, 0.7), total - 2.2 + k * 0.14, 0.3)
    buf = buf[: int(total * SR)]
    n = len(buf)
    fade = np.minimum(1, np.arange(n) / (0.3 * SR))[:, None] * np.minimum(1, (n - np.arange(n)) / (1.5 * SR))[:, None]
    return buf * fade


def rain(dur):
    n = int(dur * SR)
    x = highpass(lowpass(noise(n), 7000), 800) * 0.5 + lowpass(noise(n), 300) * 0.25
    for k in range(int(dur * 30)):
        m = int(0.01 * SR)
        i = int(hash_(k * 1.7) * (n - m))
        x[i: i + m] += highpass(noise(m), 3000) * env_exp(m, 80) * (0.3 + 0.5 * hash_(k))
    tt = np.arange(n) / SR
    return x * np.minimum(1, tt / 1.0) * np.minimum(1, (dur - tt) / 1.0)


def knock():
    n = int(0.28 * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 95 * tt) * env_exp(n, 22) + 0.6 * lowpass(noise(n), 900) * env_exp(n, 40)) * 0.9


def buzz(dur=0.7):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    gate = ((tt % 0.35) < 0.22).astype(float)
    return np.sign(np.sin(2 * np.pi * 150 * tt)) * lowpass(np.ones(n), 400) * gate * 0.3


def clap(n_people=6, dur=2.0):
    out = np.zeros(int(dur * SR))
    for k in range(int(dur * 6 * n_people / 3)):
        m = int(0.03 * SR)
        i = int(hash_(k * 2.3) * (len(out) - m))
        out[i: i + m] += highpass(noise(m), 900) * env_exp(m, 70) * (0.5 + 0.5 * hash_(k))
    return out


def creak(dur=1.1):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = 170 + 70 * np.sin(tt * 7) + 40 * tt
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(tt * 37)) * np.sin(np.pi * tt / dur) * 0.35


def thunder(dur=3.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return lowpass(noise(n), 160) * (np.exp(-tt * 1.4) + 0.4 * np.exp(-((tt - 0.6) ** 2) * 6)) * 1.6


def glitch(dur=0.9):
    n = int(dur * SR)
    out = np.zeros(n)
    for k in range(14):
        m = int(0.04 * SR)
        i = int(hash_(k * 3.9) * (n - m))
        tt = np.arange(m) / SR
        out[i: i + m] += np.sign(np.sin(2 * np.pi * (300 + 1200 * hash_(k)) * tt)) * 0.3
    return highpass(out, 400)


def lake(dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return lowpass(noise(n), 500) * (0.4 + 0.3 * np.sin(2 * np.pi * 0.35 * tt)) * np.minimum(1, tt / 0.8) * np.minimum(1, (dur - tt) / 0.8)


def sfx(ws, S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    w = lambda *a: W(ws, *a)
    add(buf, clap(6, 2.4), S["A01"] + 0.1, 0.25)
    add(buf, whoosh(0.5, 900), S["A02"] + 0.3, 0.2)
    add(buf, buzz(0.9), S["A03"] + 0.05, 0.4)
    m = int(0.25 * SR)
    add(buf, np.sin(2 * np.pi * 2600 * np.arange(m) / SR) * env_exp(m, 14) * 0.4, S["B01"] + 0.6, 0.3, pan=-0.3)
    add(buf, np.sin(2 * np.pi * 2600 * np.arange(m) / SR) * env_exp(m, 14) * 0.4, S["B01"] + 0.85, 0.3, pan=-0.3)
    add(buf, vowel(160, 0.5, AH, breath=0.7, glide=-0.3) * 0.5, S["B03b"] + 0.2, 0.35)
    night0, night1 = S["C01"], S["H01"]
    add(buf, rain(night1 - night0), night0, 0.22)
    add(buf, thunder(3.0), S["C01"] + 0.3, 0.45)
    for k in range(3):
        add(buf, knock(), w(6, "Three") + 0.05 + 0.42 * k, 0.8, pan=0.1)
    for k in range(3):
        add(buf, knock(), w(9, "same", 2) + 0.1 + 0.42 * k, 0.75, pan=0.1)
    for k in range(4):
        add(buf, heartbeat(), S["C05"] + k * 0.75, 0.4)
    for k in range(3):
        add(buf, knock() * 0.6, S["D05"] + 0.3 + 0.42 * k, 0.5)
    add(buf, click(1400), S["E03"] + 0.35, 0.7)
    add(buf, click(900), S["E03"] + 0.45, 0.5)
    add(buf, creak(1.4), S["E04"] - 0.1, 0.5)
    add(buf, thunder(2.6), S["F01"] + 0.2, 0.35)
    for k in range(5):
        add(buf, step(), S["F01"] + 0.3 + 0.38 * k, 0.3)
    add(buf, thump(0.3, 70), S["F06"] + 0.35, 0.5)
    for k in range(3):
        add(buf, knock() * 0.45, S["G04"] + 0.15 + 0.42 * k, 0.45)
    add(buf, whoosh(2.4, 600), S["G05"], 0.4)
    add(buf, sparkle(88), S["G06"] + 0.3, 0.35)
    add(buf, whoosh(2.0, 400, rise=False), S["G10"], 0.4)
    add(buf, lake(S["J01"] - S["H01"]), S["H01"], 0.25)
    for k in range(12):
        add(buf, bird(2400 + 900 * hash_(k)), S["H01"] + 0.4 + k * 0.6 + 0.2 * hash_(k * 5), 0.07, pan=hash_(k * 7) - 0.5)
    add(buf, buzz(0.9), S["J01"] + 0.1, 0.45)
    add(buf, glitch(1.0), S["J03"], 0.5)
    add(buf, sparkle(91), S["J05"] + 0.1, 0.4)
    return buf[: int(total * SR)]


def write(path, buf, peak=0.9):
    m = np.abs(buf).max() or 1
    pcm = (buf / m * peak * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    ws = words(root / "vo/t1/timings.json")
    S, total = shots(root / "src/planT.gen.ts")
    write(root / "vo/t1/music.wav", music(ws, S, total), 0.85)
    write(root / "vo/t1/sfx.wav", sfx(ws, S, total), 0.85)
    print(f"wrote music + sfx ({total:.2f} s)")
