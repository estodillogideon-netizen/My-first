"""An original cinematic score + sound effects for "The Sword That Can't Lie", synthesised from scratch with numpy (no
samples, no third-party music). A koto-like theme in a Japanese "in" scale (D, Eb, G, A, Bb) ties it together; low
drones and a heartbeat carry the dread; taiko drums and a string ostinato carry the hunts and the battle; a soft
"ooh" choir carries the memory and the truth; the gold sword opens into a bright major choir; dawn is warm piano with
the theme in major.
Sound effects sit on their words: the sword's glow hum, the unsheathing ring, slashes, demon growls and bursts, fire
crackle, the crowd, footsteps, cloth, the paper door, the shadow claws, the ground cracking, the king's roar, the gold
burst, sparkles, wind, dawn birds.

    python vo/make_score_sword.py
"""
import json, re, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import NOTE, SR, W, add, env_exp, highpass, lowpass, pad, words  # noqa: E402
from make_score_monster import AH, EE, HM, OO, bassp, piano, sparkle, thump, vowel  # noqa: E402

rng = np.random.default_rng(57)


def shots(plan):
    src = Path(plan).read_text(encoding="utf8")
    sh = json.loads(re.search(r"export const SHOTS = (\[.*?\]) as const;", src).group(1))
    total = int(re.search(r"export const DURATION = (\d+);", src).group(1)) / 30
    return {s["id"]: s["t"] for s in sh}, total


def noise(n):
    return rng.standard_normal(n)


# chords in D minor (root, voicing)
Dm, Bb, Gm, A7, F, C, Eb = (38, [62, 65, 69]), (34, [62, 65, 70]), (31, [62, 67, 70]), (33, [61, 64, 69]), (41, [60, 65, 69]), (36, [60, 64, 67]), (39, [63, 67, 70])
D, G, Bm, A = (38, [62, 66, 69]), (43, [62, 67, 71]), (35, [62, 66, 71]), (45, [61, 64, 69])
THEME = [74, 75, 79, 81, 82, 81, 79, 75]  # the koto motif: D Eb G A Bb A G Eb (in scale)
THEME_MAJ = [74, 76, 78, 81, 83, 81, 78, 76]  # dawn: the same shape in D major


def koto(f, dur=1.3):
    """a plucked zither: bright attack, quick decay, a little pitch bend down at the start"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    bend = 1 + 0.012 * np.exp(-tt * 30)
    ph = 2 * np.pi * np.cumsum(f * bend) / SR
    y = np.sin(ph) + 0.5 * np.sin(2 * ph + 0.3) + 0.28 * np.sin(3 * ph) + 0.12 * np.sin(5 * ph)
    y *= env_exp(n, 3.2) * np.minimum(1, tt / 0.003)
    return lowpass(y, 5200) * 0.5


def taiko(dur=0.6, f=58, k=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * (f * (1 + 0.6 * np.exp(-tt * 30))) * tt) * env_exp(n, 6) + 0.35 * lowpass(noise(n), 400) * env_exp(n, 25)
    return x * k


def string_stab(fs, dur=0.25):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    y = np.zeros(n)
    for f in fs:
        for det in (-0.004, 0.0, 0.005):
            ph = 2 * np.pi * f * (1 + det) * tt
            y += sum(np.sin(h * ph) / h for h in range(1, 7))
    return lowpass(y * env_exp(n, 9) * np.minimum(1, tt / 0.01), 3200) / (len(fs) * 3)


def choir(fs, dur, vowelF=OO, k=1.0):
    out = np.zeros(int(dur * SR))
    for f in fs:
        for det in (-0.006, 0.0, 0.007):
            v = vowel(f * (1 + det), dur, vowelF, breath=0.25, vib=0.004)
            out[: len(v)] += v[: len(out)]
    tt = np.arange(len(out)) / SR
    e = np.minimum(1, tt / 0.9) * np.minimum(1, (dur - tt) / 0.9)
    return lowpass(out * e, 2400) * k / (len(fs) * 3)


def drone(f, dur, k=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * h * tt * (1 + 0.002 * np.sin(tt * 0.7 + h))) / h for h in (1, 2, 3, 5))
    y += 0.3 * lowpass(noise(n), 300)
    e = np.minimum(1, tt / 1.2) * np.minimum(1, (dur - tt) / 1.0)
    return lowpass(y * e, 900) * k * 0.3


def heartbeat():
    out = np.zeros(int(0.9 * SR))
    for o, a in ((0.0, 1.0), (0.22, 0.7)):
        x = thump(0.18, 55) * a
        i = int(o * SR)
        out[i: i + len(x)] += x
    return out


def section(buf, t0, t1, prog, style, bpm, gain=1.0):
    beat = 60 / bpm
    bar = 4 * beat
    t, i = t0, 0
    while t < t1 - 0.05:
        root, ch = prog[i % len(prog)]
        dur = min(bar, t1 - t)
        at = lambda k: t + k * beat
        ok = lambda tt: tt < t1 - 0.05
        if style == "dread":
            add(buf, drone(NOTE(root - 12), dur + 0.6), t, 0.9 * gain)
            if i % 2 == 0:
                for k, n in enumerate(THEME[:4]):
                    if ok(at(k)):
                        add(buf, koto(NOTE(n - 12)), at(k), 0.22 * gain, pan=0.2)
        elif style == "koto":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.3 * gain)
            for k, n in enumerate(THEME):
                if ok(at(k / 2)):
                    add(buf, koto(NOTE(n)), at(k / 2), 0.26 * gain, pan=0.15)
        elif style == "play":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.25 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    n = [ch[0], ch[2], ch[1] + 12, ch[2]][k % 4]
                    add(buf, koto(NOTE(n), 0.6), at(k / 2), 0.2 * gain, pan=-0.2 if k % 2 else 0.2)
            for k in (0, 2):
                if ok(at(k)):
                    add(buf, taiko(0.3, 120, 0.5), at(k), 0.3 * gain)
        elif style == "sparse":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.8), t, 0.45 * gain)
            add(buf, piano(NOTE(root), 3.0, 0.7), t, 0.4 * gain)
            for k, p in enumerate([2, 1]):
                if ok(at(k * 2 + 1)):
                    add(buf, koto(NOTE(ch[p] + 12), 1.6), at(k * 2 + 1), 0.2 * gain)
        elif style == "grief":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.8), t, 0.5 * gain)
            add(buf, choir([NOTE(n) for n in ch], dur + 0.6), t, 0.7 * gain)
            add(buf, piano(NOTE(root), 3.2, 0.8), t, 0.4 * gain)
            mel = [ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[1] + 12]
            for k, n in enumerate(mel):
                if ok(at(k)):
                    add(buf, piano(NOTE(n), 1.8, 0.7), at(k), 0.26 * gain, pan=0.15 * (k % 2))
        elif style == "march":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.4 * gain)
            for k in range(4):
                if ok(at(k)):
                    add(buf, taiko(0.6, 55 if k % 2 == 0 else 70), at(k), 0.6 * gain)
                    add(buf, bassp(NOTE(root), 0.35), at(k), 0.35 * gain)
            if i % 2 == 0:
                for k, n in enumerate(THEME[:4]):
                    if ok(at(k)):
                        add(buf, koto(NOTE(n)), at(k), 0.2 * gain, pan=-0.2)
        elif style == "sneak":
            for k in range(8):
                if ok(at(k / 2)):
                    n = [root, root + 7, root + 12, root + 7][k % 4]
                    add(buf, koto(NOTE(n + 12), 0.3), at(k / 2), (0.24 if k % 2 == 0 else 0.13) * gain, pan=-0.2)
            add(buf, drone(NOTE(root - 12), dur + 0.4), t, 0.45 * gain)
        elif style == "battle":
            add(buf, drone(NOTE(root - 12), dur + 0.4, 1.2), t, 0.6 * gain)
            for k in range(16):
                if ok(at(k / 4)):
                    add(buf, string_stab([NOTE(n) for n in ch], 0.18), at(k / 4), (0.5 if k % 4 == 0 else 0.3) * gain, pan=0.25 * ((k % 2) * 2 - 1))
            for k in range(8):
                if ok(at(k / 2)):
                    add(buf, taiko(0.5, 52 + 12 * (k % 2)), at(k / 2), (0.8 if k % 2 == 0 else 0.5) * gain)
            for k, n in enumerate(THEME):
                if ok(at(k / 2)) and i % 2 == 1:
                    add(buf, koto(NOTE(n)), at(k / 2), 0.2 * gain)
        elif style == "storm":
            add(buf, drone(NOTE(root - 12), dur + 0.4, 1.4), t, 0.9 * gain)
            add(buf, choir([NOTE(n) for n in ch], dur + 0.6, AH), t, 1.0 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    add(buf, taiko(0.5, 46 + 10 * (k % 2)), at(k / 2), (0.75 if k % 2 == 0 else 0.4) * gain)
        elif style == "pulse":
            add(buf, drone(NOTE(root - 12), dur + 0.4), t, 0.5 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    add(buf, bassp(NOTE(root), 0.2), at(k / 2), 0.4 * gain)
            for k in (0, 2):
                if ok(at(k)):
                    add(buf, taiko(0.4, 60), at(k), 0.5 * gain)
        elif style in ("swell", "epic", "end"):
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.5 * gain)
            add(buf, piano(NOTE(root), 2.6, 0.8), t, 0.4 * gain)
            if style in ("swell", "epic"):
                add(buf, choir([NOTE(n) for n in ch], dur + 0.6, AH), t, (0.9 if style == "epic" else 0.7) * gain)
            if style == "epic":
                for k in range(8):
                    if ok(at(k / 2)):
                        add(buf, taiko(0.5, 50 + 14 * (k % 2)), at(k / 2), (0.8 if k % 2 == 0 else 0.45) * gain)
                        add(buf, string_stab([NOTE(n) for n in ch], 0.2), at(k / 2), 0.35 * gain)
            mel = THEME_MAJ if style == "end" else [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12]
            step = 0.5 if style != "end" else 1.0
            for k, n in enumerate(mel):
                tt = at(k * step)
                if not ok(tt):
                    break
                add(buf, (koto(NOTE(n), 1.6) if style == "end" else piano(NOTE(n), 1.2, 0.7)), tt, 0.28 * gain, pan=0.25 if k % 2 else -0.2)
        t += bar
        i += 1


def boom(t, buf, k=1.0):
    n = int(2.2 * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * (45 * np.exp(-tt * 0.8) + 25) * tt) * env_exp(n, 2.0) + lowpass(noise(n), 150) * env_exp(n, 4)
    add(buf, x * k, t, 0.9)


def music(ws, S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    plan = [
        ("A01", "B01", [Dm, Bb], "dread", 72, 1.0), ("B01", "C01", [Dm, Bb, Gm, A7], "march", 96, 0.9), ("C01", "C05", [Dm, Bb, Gm, A7], "grief", 66, 0.9),
        ("C05", "D01", [F, C], "sparse", 72, 0.75), ("D01", "D04", [F, C, Dm, Bb], "play", 104, 0.85), ("D04", "E01", [Dm, Eb], "dread", 66, 0.9),
        ("E01", "E05", [Dm, Gm, A7, Dm], "march", 84, 0.85), ("E05", "F01", [Dm, Eb], "sneak", 88, 0.85), ("F01", "F03", [Dm, Eb], "storm", 90, 1.0),
        ("F03", "G01", [Dm, Bb, Gm, A7], "battle", 140, 1.0), ("G01", "G06", [Dm, Eb, Dm, A7], "storm", 96, 1.05), ("G06", "H01", [Dm, Eb], "pulse", 110, 0.9),
        ("H01", "H06", [Dm, Bb, Gm, A7], "pulse", 124, 0.9), ("H06", "J01", [Dm, Gm], "sparse", 66, 0.8), ("J01", "K03", [Dm, Bb, Gm, A7], "grief", 64, 0.95),
        ("K03", "L01", [Dm, Eb], "storm", 96, 1.1), ("L01", "L03", [Gm, A7], "swell", 80, 1.0), ("L03", "M01", [D, G, Bm, A], "epic", 120, 1.1),
        ("M01", None, [D, G, Bm, A], "end", 76, 0.9),
    ]
    for a, b, prog, style, bpm, g in plan:
        t1 = S[b] if b else total - 2.4
        section(buf, S[a], t1, prog, style, bpm, g)
    # the gold sword: a bright major choir opens; the strike: a boom and a burst of light
    add(buf, choir([NOTE(n + 12) for n in D[1]], 3.0, AH, 1.3), S["L03"] + 0.3, 0.9)
    boom(S["L08"] + 0.5, buf, 1.0)
    add(buf, choir([NOTE(n + 12) for n in D[1]], 3.5, AH, 1.5), S["L08"] + 0.55, 1.0)
    add(buf, pad([NOTE(n) for n in D[1]], 4.0), total - 2.4, 0.6)
    for k, n in enumerate([50, 62, 66, 69, 74]):
        add(buf, koto(NOTE(n), 3.0), total - 2.4 + k * 0.12, 0.3)
    buf = buf[: int(total * SR)]
    n = len(buf)
    fade = np.minimum(1, np.arange(n) / (0.3 * SR))[:, None] * np.minimum(1, (n - np.arange(n)) / (1.5 * SR))[:, None]
    return buf * fade


# ------------------------------------------------------------------ sound effects
def whoosh(dur=1.2, fc=600, rise=True):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    X = np.fft.rfft(noise(n))
    fr = np.fft.rfftfreq(n, 1 / SR)
    X *= np.exp(-((fr - fc) / (fc * 0.8)) ** 2)
    x = np.fft.irfft(X, n)
    e = np.sin(np.pi * tt / dur) ** 2 if rise else env_exp(n, 3)
    return x / (np.abs(x).max() + 1e-9) * e


def slash(dur=0.32):
    """a blade cutting the air: a fast high whoosh with a metallic edge"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = highpass(noise(n), 1800) * np.sin(np.pi * np.minimum(1, tt / dur)) ** 3
    ring = np.sin(2 * np.pi * 3200 * tt) * env_exp(n, 12) * 0.15
    return x / (np.abs(x).max() + 1e-9) + ring


def shing(dur=1.3):
    """the sword's ring (unsheathing / the glow)"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * tt) * a for f, a in ((2637, 0.5), (3951, 0.3), (5274, 0.2), (1318, 0.25)))
    sw = highpass(noise(n), 3000) * env_exp(n, 20) * 0.6
    return (y * env_exp(n, 2.5) + sw) * np.minimum(1, tt / 0.005)


def glow_hum(dur=1.5, f=146):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt) * 0.6 + np.sin(2 * np.pi * f * 2.01 * tt) * 0.3 + np.sin(2 * np.pi * f * 8 * tt) * 0.05 * np.sin(2 * np.pi * 5 * tt)
    return x * np.minimum(1, tt / 0.4) * np.minimum(1, (dur - tt) / 0.5)


def growl(dur=1.4, f0=70):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 23 * tt) * np.sin(2 * np.pi * 3.1 * tt)
    y = (np.sign(np.sin(2 * np.pi * f0 * (1 + 0.05 * np.sin(tt * 4)) * tt)) * 0.3 + lowpass(noise(n), 400)) * am
    return lowpass(y, 900) * np.sin(np.pi * tt / dur) ** 0.7


def roar(dur=2.6):
    a = growl(dur, 48) * 1.2
    b = vowel(90, dur, AH, breath=0.8, glide=-0.2)[: len(a)]
    return lowpass(a + 0.6 * b, 1400)


def poof(dur=0.9):
    n = int(dur * SR)
    return lowpass(noise(n), 700) * env_exp(n, 5) + thump(dur, 70)[:n] * 0.6


def crackle(dur=3.0):
    n = int(dur * SR)
    out = lowpass(noise(n), 500) * 0.15
    for k in range(int(dur * 14)):
        m = int(0.012 * SR)
        i = int(hash_(k) * (n - m))
        out[i: i + m] += highpass(noise(m), 2000) * env_exp(m, 60) * (0.3 + hash_(k * 3))
    return out


def click(f=2200):
    n = int(0.03 * SR)
    return highpass(noise(n), f) * env_exp(n, 60)


def step():
    n = int(0.09 * SR)
    return lowpass(noise(n), 900) * env_exp(n, 35)


def cloth(dur=0.8):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return highpass(lowpass(noise(n), 4000), 800) * (0.5 + 0.5 * np.sin(2 * np.pi * 6 * tt)) * np.sin(np.pi * tt / dur) * 0.5


def slide(dur=0.6):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return lowpass(noise(n), 1200) * np.sin(np.pi * tt / dur) * 0.6


def crack(dur=0.9):
    n = int(dur * SR)
    out = np.zeros(n)
    for k in range(9):
        m = int(0.05 * SR)
        i = int(hash_(k) * (n - m))
        out[i: i + m] += highpass(noise(m), 1800) * env_exp(m, 40) * (0.5 + hash_(k * 3))
    return out


def hash_(k):
    x = np.sin(k * 127.1 + 311.7) * 43758.5453
    return x - np.floor(x)


def bird(f0=2800):
    n = int(0.16 * SR)
    tt = np.arange(n) / SR
    f = f0 * (1 + 0.35 * np.sin(2 * np.pi * 18 * tt)) * (1 + 0.4 * tt / 0.16)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.16) ** 2


def murmur(dur=3.0):
    out = np.zeros(int(dur * SR))
    for k in range(int(dur * 7)):
        syl = vowel(110 + 160 * hash_(k), 0.12, [AH, EE, HM][k % 3], breath=0.35)
        i = int(hash_(k * 5) * (len(out) - len(syl)))
        out[i: i + len(syl)] += syl * 0.4
    return lowpass(out, 2500)


def wind(dur=3.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return lowpass(noise(n), 500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * tt)) * np.minimum(1, tt / 0.8) * np.minimum(1, (dur - tt) / 0.8)


def sfx(ws, S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    # the hook: the glow hum and ring on the rooftop; the eyes; the sheath glowing at Mei
    add(buf, shing(1.4), S["A01"] + 0.5, 0.35, pan=-0.2)
    add(buf, glow_hum(1.4), S["A02"], 0.35)
    add(buf, growl(1.4, 62), S["A02b"] + 0.1, 0.4, pan=0.3)
    add(buf, glow_hum(2.4, 130), S["A03"] + 0.3, 0.4)
    add(buf, heartbeat(), S["A04"] + 0.1, 0.4)
    add(buf, heartbeat(), S["A05"] + 0.1, 0.35)
    # the hunters; the demons crawl; Ren's slash
    add(buf, wind(2.5), S["B01"], 0.2)
    add(buf, growl(2.0, 55), S["B04"], 0.45)
    add(buf, slash(), S["B05"] + 0.12, 0.6, pan=-0.2)
    add(buf, poof(), S["B05"] + 0.4, 0.5)
    add(buf, glow_hum(1.2), S["B06"], 0.3)
    # the fire
    add(buf, crackle(S["C05"] - S["C01"]), S["C01"], 0.35)
    add(buf, roar(2.0), S["C01"] + 0.1, 0.35)
    # home: dumplings, the shadow, the red flash
    add(buf, click(1200), S["D03"] + 0.5, 0.2)
    add(buf, heartbeat(), S["D07"], 0.4)
    add(buf, glow_hum(0.8, 300), S["D09"] + 0.2, 0.45)
    # the square: crowd
    add(buf, murmur(S["E04"] - S["E01"]), S["E01"], 0.25)
    add(buf, shing(1.2), S["E03"] + 0.1, 0.35)
    # the lie: cloth, the paper door
    add(buf, cloth(1.0), S["E06"] + 0.2, 0.45)
    add(buf, slide(0.6), S["E07"] + 0.3, 0.45, pan=0.3)
    # the attack: eyes, growls, fires, slashes, bursts
    add(buf, growl(2.5, 50), S["F01"], 0.45)
    add(buf, growl(2.0, 64), S["F02"], 0.45, pan=0.4)
    add(buf, crackle(S["H01"] - S["F03"]), S["F03"], 0.3)
    add(buf, growl(2.0, 58), S["F04"], 0.45, pan=-0.3)
    for k, dt in enumerate((0.05, 0.75)):
        add(buf, slash(), S["F05"] + dt, 0.6, pan=0.2 * (k * 2 - 1))
        add(buf, poof(), S["F05"] + dt + 0.25, 0.45)
    add(buf, heartbeat(), S["F07"], 0.45)
    add(buf, roar(1.8), S["F08"] + 0.1, 0.6)
    t = S["G01"]
    while t < S["G01"] + 0.8:
        add(buf, step(), t, 0.3)
        t += 0.18
    add(buf, whoosh(1.4, 220), S["G03"] + 0.1, 0.6)
    add(buf, growl(1.2, 90), S["G03"] + 0.4, 0.35)
    add(buf, slash(0.4), S["G05"] + 0.05, 0.6)
    add(buf, poof(1.2), S["G05"] + 0.3, 0.6)
    add(buf, shing(1.2), S["G06"] + 0.1, 0.35)
    add(buf, shing(1.0), S["G09"] + 0.15, 0.4)
    # the run; wind; the shrine
    t = S["H01"]
    while t < S["H03"]:
        add(buf, step(), t, 0.25)
        t += 0.2
    add(buf, wind(S["H07"] - S["H03"]), S["H03"], 0.3)
    add(buf, glow_hum(1.4, 130), S["J02"] + 0.2, 0.4)
    add(buf, glow_hum(2.0, 196), S["J05"] + 0.1, 0.4)
    add(buf, whoosh(2.0, 500), S["J06"], 0.45)
    add(buf, sparkle(86), S["J08"] + 0.2, 0.4)
    for k in range(4):
        add(buf, heartbeat(), S["K02"] + k * 0.8, 0.35)
    add(buf, crack(1.2), S["K03"] + 0.1, 0.6)
    add(buf, roar(3.0), S["K04"] + 0.1, 0.8)
    boom(S["K04"], buf, 0.7)
    add(buf, slash(), S["K06"] + 0.2, 0.4)
    add(buf, thump(0.2, 200), S["K06"] + 0.35, 0.4)
    add(buf, whoosh(1.2, 300, rise=False), S["K07"], 0.5)
    add(buf, shing(2.0), S["L03"] + 0.25, 0.6)
    add(buf, glow_hum(2.4, 220), S["L04"], 0.4)
    add(buf, sparkle(91), S["L06"] + 0.1, 0.4)
    add(buf, slash(0.5), S["L08"] + 0.3, 0.7)
    add(buf, roar(1.4), S["L08"] + 0.45, 0.5)
    add(buf, sparkle(84), S["L08"] + 0.7, 0.6)
    # dawn
    add(buf, wind(4.0), S["M01"], 0.15)
    for k in range(16):
        add(buf, bird(2400 + 900 * hash_(k)), S["M01"] + 0.4 + k * 0.6 + 0.2 * hash_(k * 5), 0.07, pan=hash_(k * 7) - 0.5)
    add(buf, glow_hum(2.0, 220), S["M05"] + 0.3, 0.25)
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
    ws = words(root / "vo/p1/timings.json")
    S, total = shots(root / "src/plan1.gen.ts")
    write(root / "vo/p1/music.wav", music(ws, S, total), 0.85)
    write(root / "vo/p1/sfx.wav", sfx(ws, S, total), 0.85)
    print(f"wrote music + sfx ({total:.2f} s)")
