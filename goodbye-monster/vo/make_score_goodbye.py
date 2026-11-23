"""An original cinematic score + sound effects for "The Goodbye Monster" (Part 1 / Part 2), synthesised from scratch
with numpy (no samples, no third-party music). A minor music-box theme ties both parts together; low drones and a
heartbeat carry the dread; a ghostly "ooh" choir is the fog; sparse piano carries Milo's grief; a driving pulse and
drums carry the run and the climax; the burst opens into a bright major choir; the morning is warm piano.
Sound effects sit on their words: the fog's whoosh, the ground "breathing", the lantern eyes' hum, flicker buzz,
the recorder click and hiss, the flashlight click, footsteps, a door banging, lights clicking on, crowd murmur, the
crowd's GOODBYE, the ice crack, the burst, sparkles, morning birds.

    python vo/make_score_goodbye.py 1      python vo/make_score_goodbye.py 2
"""
import json, re, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import NOTE, SR, W, add, env_exp, highpass, lowpass, pad, tone, words  # noqa: E402
from make_score_monster import AH, EE, HM, OO, bassp, musicbox, piano, pluck, sparkle, thump, vowel  # noqa: E402

rng = np.random.default_rng(31)
PART = int(sys.argv[1]) if len(sys.argv) > 1 else 1


def shots(plan):
    src = Path(plan).read_text(encoding="utf8")
    sh = json.loads(re.search(r"export const SHOTS = (\[.*?\]) as const;", src).group(1))
    total = int(re.search(r"export const DURATION = (\d+);", src).group(1)) / 30
    return {s["id"]: s["t"] for s in sh}, total


Am, F, C, G, Dm, E7, Em = (45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62]), (38, [57, 62, 65]), (40, [56, 59, 62]), (40, [55, 59, 64])
THEME = [76, 72, 69, 71, 72, 69, 64, 68]  # the music-box motif (A minor, a raised 7th)


def noise(n):
    return rng.standard_normal(n)


def choir(fs, dur, vowelF=OO, k=1.0):
    """a soft 'ooh' choir: each note a breathy voiced vowel with slow vibrato, layered and detuned"""
    out = np.zeros(int(dur * SR))
    for f in fs:
        for det in (-0.006, 0.0, 0.007):
            v = vowel(f * (1 + det), dur, vowelF, breath=0.25, vib=0.004)
            out[: len(v)] += v[: len(out)]
    tt = np.arange(len(out)) / SR
    e = np.minimum(1, tt / 0.9) * np.minimum(1, (dur - tt) / 0.9)
    return lowpass(out * e, 2400) * k / (len(fs) * 3)


def heartbeat(n=1):
    out = np.zeros(int(0.9 * SR))
    for o, a in ((0.0, 1.0), (0.22, 0.7)):
        x = thump(0.18, 55) * a
        i = int(o * SR)
        out[i: i + len(x)] += x
    return out


def drone(f, dur, k=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * h * tt * (1 + 0.002 * np.sin(tt * 0.7 + h))) / h for h in (1, 2, 3, 5))
    y += 0.3 * lowpass(noise(n), 300)
    e = np.minimum(1, tt / 1.2) * np.minimum(1, (dur - tt) / 1.0)
    return lowpass(y * e, 900) * k * 0.3


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
                        add(buf, musicbox(NOTE(n)), at(k), 0.16 * gain, pan=0.2)
        elif style == "box":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.3 * gain)
            for k, n in enumerate(THEME):
                if ok(at(k / 2)):
                    add(buf, musicbox(NOTE(n)), at(k / 2), 0.2 * gain, pan=0.15)
        elif style == "sparse":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.8), t, 0.45 * gain)
            add(buf, piano(NOTE(root), 3.0, 0.7), t, 0.4 * gain)
            for k, p in enumerate([2, 1]):
                if ok(at(k * 2 + 1)):
                    add(buf, piano(NOTE(ch[p] + 12), 2.0, 0.6), at(k * 2 + 1), 0.26 * gain)
        elif style == "sneak":
            for k in range(8):
                if ok(at(k / 2)):
                    n = [root, root + 7, root + 12, root + 7][k % 4]
                    add(buf, pluck(NOTE(n + 12), 0.15), at(k / 2), (0.26 if k % 2 == 0 else 0.15) * gain, pan=-0.2)
            add(buf, drone(NOTE(root - 12), dur + 0.4), t, 0.4 * gain)
        elif style == "pulse":
            add(buf, drone(NOTE(root - 12), dur + 0.4), t, 0.5 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    add(buf, bassp(NOTE(root), 0.2), at(k / 2), 0.4 * gain)
                    if k % 2:
                        add(buf, lowpass(noise(int(0.05 * SR)), 6000) * env_exp(int(0.05 * SR), 50), at(k / 2), 0.12 * gain)
            for k in (0, 2):
                if ok(at(k)):
                    add(buf, thump(0.3, 60), at(k), 0.5 * gain)
        elif style == "choir":
            add(buf, choir([NOTE(n) for n in ch], dur + 0.8), t, 1.1 * gain)
            add(buf, pad([NOTE(n - 12) for n in ch], dur + 0.6), t, 0.25 * gain)
            if i % 2 == 1 and ok(at(1)):
                for k, n in enumerate(THEME[4:]):
                    if ok(at(1 + k)):
                        add(buf, musicbox(NOTE(n + 12)), at(1 + k), 0.1 * gain, pan=-0.3)
        elif style == "grief":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.8), t, 0.5 * gain)
            add(buf, piano(NOTE(root), 3.2, 0.8), t, 0.45 * gain)
            mel = [ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[1] + 12]
            for k, n in enumerate(mel):
                if ok(at(k)):
                    add(buf, piano(NOTE(n), 1.8, 0.7), at(k), 0.3 * gain, pan=0.15 * (k % 2))
        elif style == "march":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.45 * gain)
            for k in range(4):
                if ok(at(k)):
                    add(buf, thump(0.35, 65 if k % 2 == 0 else 80), at(k), 0.55 * gain)
                    add(buf, bassp(NOTE(root), 0.35), at(k), 0.45 * gain)
            for k, p in enumerate([0, 1, 2, 1, 2, 3, 2, 1]):
                tt = at(k / 2)
                if ok(tt):
                    n = ch[p] if p < 3 else ch[0] + 12
                    add(buf, piano(NOTE(n + 12), 0.8, 0.6), tt, 0.24 * gain, pan=0.2 if k % 2 else -0.2)
        elif style == "storm":
            add(buf, drone(NOTE(root - 12), dur + 0.4, 1.4), t, 0.9 * gain)
            add(buf, choir([NOTE(n) for n in ch], dur + 0.6, AH), t, 1.0 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    add(buf, thump(0.3, 50 + 10 * (k % 2)), at(k / 2), (0.7 if k % 2 == 0 else 0.4) * gain)
        elif style in ("swell", "end"):
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.5 * gain)
            add(buf, piano(NOTE(root), 2.6, 0.8), t, 0.45 * gain)
            if style == "swell":
                add(buf, choir([NOTE(n) for n in ch], dur + 0.6, AH), t, 0.8 * gain)
            pat = [0, 2, 1, 2, 3, 2, 1, 2] if style == "swell" else [0, 1, 2, 3]
            step = 0.5 if style == "swell" else 1.0
            for k, p in enumerate(pat):
                tt = at(k * step)
                if not ok(tt):
                    break
                n = ch[p] if p < 3 else ch[0] + 12
                add(buf, piano(NOTE(n + 12), 1.2, 0.6 if k % 2 else 0.8), tt, 0.28 * gain, pan=0.25 if k % 2 else -0.2)
        t += bar
        i += 1


def boom(t, buf, k=1.0):
    n = int(2.2 * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * (45 * np.exp(-tt * 0.8) + 25) * tt) * env_exp(n, 2.0) + lowpass(noise(n), 150) * env_exp(n, 4)
    add(buf, x * k, t, 0.9)


def music(ws, S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    w = lambda *a: W(ws, *a)
    if PART == 1:
        plan = [("A01", "B01", [Am, E7], "dread", 70, 1.0), ("B01", "C01", [Am, F, C, G], "sparse", 76, 0.75), ("C01", "C03", [Am, F], "grief", 70, 0.8),
                ("C03", "C07", [C, Am, F, G], "box", 84, 0.9), ("C07", "D01", [Am, E7], "dread", 70, 1.1), ("D01", "E01", [C, F, Am, G], "sparse", 80, 0.85),
                ("E01", "F01", [Am, F, C, E7], "box", 76, 0.8), ("F01", "G01", [Am, Dm, E7, Am], "sneak", 96, 0.95), ("G01", "G02", [Am], "pulse", 132, 1.0),
                ("G02", "H01", [Am, F, Dm, E7], "choir", 70, 1.0), ("H01", "J01", [Am, F, C, G], "grief", 66, 0.95), ("J01", "K02", [Am, E7], "storm", 80, 1.0)]
    else:
        plan = [("P01", "P08", [Am, E7], "dread", 70, 1.0), ("P08", "R01", [Am, F, C, E7], "choir", 64, 1.0), ("R01", "R05", [Am, Dm], "sneak", 84, 0.8),
                ("R05", "R13", [C, Am, F, G], "box", 84, 0.95), ("R13", "S01", [Am, F, C, G], "grief", 66, 0.9), ("S01", "T01", [Am, F, C, G], "march", 104, 0.95),
                ("T01", "U01", [Am, E7, F, E7], "storm", 88, 1.0), ("U01", "V01", [Am, E7], "storm", 88, 1.15), ("V01", "W01", [C, G, Am, F], "swell", 96, 1.0),
                ("W01", "X01", [F, C, Dm, G], "grief", 66, 0.85), ("X01", None, [C, F, G, C], "end", 84, 0.9)]
    for a, b, prog, style, bpm, g in plan:
        t1 = S[b] if b else total - 2.6
        if PART == 2 and a == "U01":
            # the burst: the storm cuts at the burst, a bright major choir opens
            tb = w(26, "burst")
            section(buf, S["U01"], tb, prog, style, bpm, g)
            boom(tb, buf, 0.9)
            add(buf, choir([NOTE(n + 12) for n in C[1]], 3.0, AH, 1.4), tb, 1.0)
            continue
        section(buf, S[a], t1, prog, style, bpm, g)
    if PART == 1:
        # the cliffhanger: silence on "To be continued", then the card's sting
        tc = w(42, "To")
        boom(tc - 0.1, buf, 0.8)
        for k, n in enumerate(THEME):
            add(buf, musicbox(NOTE(n)), S["K02"] + 0.3 + k * 0.32, 0.22, pan=0.2)
        add(buf, drone(NOTE(33), total - S["K02"] + 0.5), S["K02"], 0.8)
    else:
        add(buf, pad([NOTE(n) for n in C[1]], 4.0), total - 2.6, 0.6)
        for k, n in enumerate([48, 60, 64, 67, 72]):
            add(buf, piano(NOTE(n), 4.0, 0.8), total - 2.6 + k * 0.12, 0.35)
    buf = buf[: int(total * SR)]
    n = len(buf)
    fade = np.minimum(1, np.arange(n) / (0.3 * SR))[:, None] * np.minimum(1, (n - np.arange(n)) / (1.5 * SR))[:, None]
    return buf * fade


# ------------------------------------------------------------------ sound effects
def whoosh(dur=1.2, fc=600, rise=True):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = noise(n)
    X = np.fft.rfft(x)
    fr = np.fft.rfftfreq(n, 1 / SR)
    X *= np.exp(-((fr - fc) / (fc * 0.8)) ** 2)
    x = np.fft.irfft(X, n)
    e = np.sin(np.pi * tt / dur) ** 2 if rise else env_exp(n, 3)
    return x / (np.abs(x).max() + 1e-9) * e


def breathing(dur=2.0):
    """the ground breathing: a slow low in-out rumble"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = lowpass(noise(n), 180) * (0.5 + 0.5 * np.sin(2 * np.pi * tt / dur - np.pi / 2)) + 0.4 * np.sin(2 * np.pi * 38 * tt) * np.sin(np.pi * tt / dur)
    return x / (np.abs(x).max() + 1e-9)


def eyes_hum(dur=1.5):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * 110 * tt) * 0.6 + np.sin(2 * np.pi * 220.7 * tt) * 0.3 + np.sin(2 * np.pi * 1760 * tt) * 0.05 * np.sin(2 * np.pi * 6 * tt)
    return x * np.minimum(1, tt / 0.4) * np.minimum(1, (dur - tt) / 0.5)


def click(f=2200):
    n = int(0.03 * SR)
    return highpass(noise(n), f) * env_exp(n, 60)


def step():
    n = int(0.09 * SR)
    return lowpass(noise(n), 900) * env_exp(n, 35)


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


def crowd_shout(n_voices=14, dur=0.9):
    out = np.zeros(int(dur * SR))
    for v in range(n_voices):
        f0 = [115, 130, 150, 210, 240, 280, 320][v % 7] * (1 + 0.05 * hash_(v))
        s1 = vowel(f0, 0.28, OO, breath=0.4, glide=0.1)
        s2 = vowel(f0 * 1.05, 0.5, AH, breath=0.35, glide=-0.15)
        o = int(0.02 * hash_(v * 7) * SR)
        out[o: o + len(s1)] += s1 * 0.6
        out[o + int(0.26 * SR): o + int(0.26 * SR) + len(s2)] += s2[: len(out) - o - int(0.26 * SR)]
    return out / n_voices * 3


def murmur(dur=3.0):
    out = np.zeros(int(dur * SR))
    for k in range(int(dur * 7)):
        syl = vowel(110 + 160 * hash_(k), 0.12, [AH, EE, HM][k % 3], breath=0.35)
        i = int(hash_(k * 5) * (len(out) - len(syl)))
        out[i: i + len(syl)] += syl * 0.4
    return lowpass(out, 2500)


def sfx(ws, S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    w = lambda *a: W(ws, *a)
    if PART == 1:
        # the hook: a low hum as the eyes pass; the slap of the hand
        add(buf, eyes_hum(2.6), 0.0, 0.35, pan=-0.3)
        add(buf, thump(0.12, 300), w(1, "goodbye") - 0.05, 0.3)
        add(buf, whoosh(1.6, 500), S["A03"] - 0.2, 0.3)
        add(buf, eyes_hum(1.6), S["A04"] + 0.1, 0.4)
        add(buf, breathing(2.4), S["A05"] - 0.3, 0.45)
        add(buf, whoosh(1.4, 400), S["A06"], 0.35, pan=0.4)
        # school chatter
        add(buf, murmur(2.5), S["B07"], 0.18)
        # the memory: the fog rushes, the eyes, the breathing
        add(buf, whoosh(1.8, 350), S["C07"] - 0.2, 0.55, pan=0.3)
        add(buf, eyes_hum(1.4), S["C08"] + 0.1, 0.45)
        add(buf, breathing(2.4), w(11, "A") - 0.2, 0.6)
        add(buf, whoosh(1.6, 300, rise=False), S["C09"] + 0.4, 0.5)
        # the recorder: click, tape hiss
        add(buf, click(1800), w(16, "play.") - 0.05, 0.5)
        n = int((S["E06"] - w(16, "play.")) * SR)
        add(buf, highpass(noise(n), 3000) * 0.05, w(16, "play."), 0.6)
        # Pia taps the window with her flashlight; the flashlight clicks on (D05)
        for k in range(3):
            add(buf, thump(0.06, 900), S["E06"] + 0.15 + 0.18 * k, 0.25, pan=0.3)
        add(buf, click(), S["D05"] + 0.3, 0.4)
        # midnight footsteps
        t = S["F01"]
        while t < S["F04"]:
            add(buf, step(), t, 0.18, pan=-0.1)
            add(buf, step(), t + 0.25, 0.14, pan=0.1)
            t += 0.9
        # the flicker buzz, the fog pours in, the eyes open, the breath
        t = S["F10"]
        while t < S["F12"]:
            m = int(0.07 * SR)
            add(buf, lowpass(np.sign(np.sin(2 * np.pi * 120 * np.arange(m) / SR)), 800) * env_exp(m, 30) * 0.4, t, 0.5, pan=0.3)
            t += 0.12 + 0.1 * hash_(t)
        add(buf, whoosh(2.2, 350), S["F11"] - 0.1, 0.55)
        add(buf, eyes_hum(1.8), S["F12"] + 0.1, 0.5)
        add(buf, thump(0.1, 260), S["F13"] + 0.05, 0.35)
        add(buf, whoosh(1.4, 300, rise=False), S["F14"], 0.4)
        # the run, the heartbeat
        t = S["G01"]
        while t < S["G04"]:
            add(buf, step(), t, 0.25)
            t += 0.21
        # the lighthouse: the creaking door, the fog spills, wind
        n = int(0.9 * SR)
        tt = np.arange(n) / SR
        add(buf, np.sin(2 * np.pi * np.cumsum(180 + 60 * np.sin(tt * 9)) / SR) * env_exp(n, 3) * 0.3, S["G04"] + 0.1, 0.35)
        add(buf, whoosh(3.0, 250), S["G05"], 0.35)
        for k in range(6):
            add(buf, heartbeat(), S["H01"] + k * 0.9, 0.35)
        add(buf, vowel(240, 0.25, HM, breath=0.6) * 0.3, S["H05"] + 0.3, 0.25)
        # the ground breathes again; the eyes rise; the swirl; the swallow
        add(buf, breathing(3.0), S["J01"] - 0.2, 0.7)
        add(buf, eyes_hum(2.5), S["J02"] + 0.3, 0.55)
        t = S["J04"]
        while t < S["K01"]:
            add(buf, heartbeat(), t, 0.45)
            t += 0.62
        add(buf, whoosh(2.4, 380), w(41, "Goodbye,") + 0.2, 0.7)
        add(buf, whoosh(1.5, 200, rise=False), S["K01"], 0.6)
        add(buf, eyes_hum(3.0), S["K02"] + 0.2, 0.4)
    else:
        add(buf, eyes_hum(2.0), S["P01"], 0.4)
        add(buf, whoosh(2.4, 380), S["P05"] + 0.3, 0.6)
        add(buf, whoosh(2.0, 250, rise=False), S["P07"], 0.5)
        # the fog world: a high airy tone (no sound), a heartbeat
        n = int((S["R01"] - S["P08"]) * SR)
        tt = np.arange(n) / SR
        add(buf, np.sin(2 * np.pi * 2093 * tt) * 0.03 * np.minimum(1, tt / 1.5) * np.minimum(1, (n / SR - tt) / 1.0), S["P08"], 0.5)
        for k in range(4):
            add(buf, heartbeat(), S["Q10"] + k * 0.9, 0.3)
        # Pia: the flashlight trembles, the diary pages
        add(buf, click(), S["R01"] + 0.1, 0.3)
        for k in range(3):
            m = int(0.12 * SR)
            add(buf, highpass(lowpass(noise(m), 6000), 1500) * env_exp(m, 18) * 0.3, S["R04"] + 0.2 + 0.15 * k, 0.8)
        add(buf, breathing(2.0), S["R12"], 0.45)
        add(buf, whoosh(2.5, 300), S["R13"], 0.45)
        # Pia runs, bangs on doors, shouts; lights click on; doors open; the crowd murmurs
        t = S["S01"]
        while t < S["S02"]:
            add(buf, step(), t, 0.28)
            t += 0.2
        t = S["S02"]
        while t < S["S03"]:
            add(buf, thump(0.12, 120), t, 0.7)
            t += 1 / 3.0
        for k in range(10):
            add(buf, click(1500), w(18, "Lights") + 0.25 * k + 0.1 * hash_(k), 0.2, pan=(hash_(k * 3) - 0.5))
        add(buf, murmur(5.0), S["S07"], 0.3)
        add(buf, murmur(4.0), S["T02"], 0.25)
        # the roar, the countdown, GOODBYE, the swell, the crack, the burst, sparkles
        add(buf, lowpass(noise(int(2.0 * SR)), 260) * np.sin(np.pi * np.arange(int(2.0 * SR)) / (2.0 * SR)) * 1.4, S["T03"] + 0.1, 0.7)
        add(buf, eyes_hum(1.6), S["T04"], 0.5)
        for k, word in enumerate(["One.", "Two.", "Three."]):
            add(buf, thump(0.25, 60), w(23, word, 2 if word == "Three." else 1), 0.6)
        add(buf, crowd_shout(), w(24, "Goodbye!") - 0.05, 0.9)
        add(buf, breathing(2.0), S["U04"], 0.6)
        add(buf, crack(1.0), w(25, "cracked"), 0.7)
        add(buf, sparkle(84), w(26, "burst") + 0.1, 0.6)
        add(buf, sparkle(91), w(26, "sparkling") + 0.1, 0.5)
        # inside: everyone wakes, laughter; the mayor; morning birds
        add(buf, murmur(3.0), S["V06"], 0.3)
        add(buf, whoosh(2.5, 900), S["W05"], 0.25)
        for k in range(14):
            add(buf, bird(2400 + 900 * hash_(k)), S["X01"] + 0.4 + k * 0.55 + 0.2 * hash_(k * 5), 0.08, pan=hash_(k * 7) - 0.5)
        for k in range(10):
            add(buf, bird(2600 + 800 * hash_(k + 20)), S["Y01"] + 0.3 + k * 0.6, 0.07, pan=hash_(k * 9) - 0.5)
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
    ws = words(root / f"vo/p{PART}/timings.json")
    S, total = shots(root / f"src/plan{PART}.gen.ts")
    write(root / f"vo/p{PART}/music.wav", music(ws, S, total), 0.85)
    write(root / f"vo/p{PART}/sfx.wav", sfx(ws, S, total), 0.85)
    print(f"part {PART}: wrote music + sfx ({total:.2f} s)")
