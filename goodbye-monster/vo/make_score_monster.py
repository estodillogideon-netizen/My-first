"""An original score + sound effects for "Monsters Are Allergic to Laughter", synthesised from scratch with numpy (no
samples, no third-party music). The score follows the story: a spooky-cute music box for the hook, a bouncy piano for
the giggly mornings, a quirky plucked groove in the Underbed, a bittersweet goodbye, a near-silent sad week, a sneaky
tiptoe for the plan, a bouncy dance, a held breath, then a big happy swell and a warm ending. The sound effects are on
their beats: Lily's giggles, Bo's "ah... ah... CHOO!" sneezes, the boing of the bouncing bed, scratching, a snore, the
truck, the honk, dancing socks, the scribble of crayons, soft sobs, the wig, the ceiling BONK and its stars, and
sparkles. Times come from vo/timings.json and src/plan.gen.ts, so everything stays on its words.

    python vo/make_score_monster.py vo/timings.json src/plan.gen.ts vo/music.wav vo/sfx.wav
"""
import json, re, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import NOTE, SR, W, add, env_exp, highpass, lowpass, pad, tone, words  # noqa: E402

rng = np.random.default_rng(23)


def shots(plan):
    src = Path(plan).read_text(encoding="utf8")
    sh = json.loads(re.search(r"export const SHOTS = (\[.*?\]) as const;", src).group(1))
    total = int(re.search(r"export const DURATION = (\d+);", src).group(1)) / 30
    return {s["id"]: s["t"] for s in sh}, {s["id"]: s["end"] for s in sh}, total


def piano(f, dur=1.4, vel=1.0):
    return lowpass(tone(f, dur, ((1, 1.0), (2, 0.38), (3, 0.14), (4.02, 0.07)), k=2.8, att=0.005), 3400) * vel


def musicbox(f, dur=1.2):
    return tone(f, dur, ((1, 1.0), (4.2, 0.28), (8.9, 0.06)), k=3.6, att=0.002) * 0.7


def pluck(f, dur=0.35):
    return lowpass(tone(f, dur, ((1, 1.0), (2, 0.5), (3, 0.25)), k=14, att=0.002), 2600)


def bassp(f, dur=0.4):
    return lowpass(tone(f, dur, ((1, 1.0), (2, 0.3)), k=7, att=0.004), 500)


C, G, Am, F, Em, Dm, E7 = (36, [60, 64, 67]), (43, [59, 62, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (40, [59, 64, 67]), (38, [57, 62, 65]), (40, [56, 59, 62])


def section(buf, t0, t1, prog, style, bpm, gain=1.0):
    beat = 60 / bpm
    bar = 4 * beat
    t, i = t0, 0
    while t < t1 - 0.05:
        root, ch = prog[i % len(prog)]
        dur = min(bar, t1 - t)

        def at(k):
            return t + k * beat

        def ok(tt):
            return tt < t1 - 0.05

        if style == "box":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.35 * gain)
            mel = [ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[2] + 13, ch[2] + 12, ch[0] + 12]
            for k, n in enumerate(mel):
                if ok(at(k / 2)):
                    add(buf, musicbox(NOTE(n + 12)), at(k / 2), 0.22 * gain, pan=0.15)
        elif style == "bounce":
            # oom-pah piano: bass on 1 and 3, chord stabs on 2 and 4, a skipping melody on top
            for k in range(4):
                if not ok(at(k)):
                    break
                if k % 2 == 0:
                    add(buf, piano(NOTE(root), 0.6, 0.9), at(k), 0.45 * gain)
                else:
                    for n in ch:
                        add(buf, piano(NOTE(n), 0.35, 0.7), at(k), 0.16 * gain)
            mel = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[2] + 12, ch[2] + 14, ch[2] + 12, ch[1] + 12]
            for k, n in enumerate(mel):
                tt = at(k / 2 + (0.08 if k % 2 else 0))
                if ok(tt):
                    add(buf, pluck(NOTE(n + 12), 0.3), tt, 0.16 * gain, pan=0.3 if k % 2 else -0.2)
        elif style == "quirky":
            # the Underbed: a walking plucked bass, off-beat plucks, a low pad
            add(buf, pad([NOTE(n - 12) for n in ch], dur + 0.4), t, 0.35 * gain)
            walk = [0, 7, 12, 7, 3, 7, 10, 7]
            for k, d in enumerate(walk):
                if ok(at(k / 2)):
                    add(buf, bassp(NOTE(root + d), 0.3), at(k / 2), 0.4 * gain)
            for k in range(4):
                if ok(at(k + 0.5)):
                    add(buf, pluck(NOTE(ch[k % 3] + 12), 0.2), at(k + 0.5), 0.12 * gain, pan=0.45)
        elif style == "sneak":
            # tiptoe: staccato low plucks on every beat, a high pluck answering
            for k in range(8):
                if ok(at(k / 2)):
                    n = [root, root + 7, root + 12, root + 7][k % 4]
                    add(buf, pluck(NOTE(n + 12), 0.15), at(k / 2), (0.3 if k % 2 == 0 else 0.18) * gain, pan=-0.2)
            if ok(at(3.5)):
                add(buf, pluck(NOTE(ch[2] + 24), 0.2), at(3.5), 0.14 * gain, pan=0.4)
        elif style == "sparse":
            add(buf, pad([NOTE(n) for n in ch], dur + 0.8), t, 0.55 * gain)
            add(buf, piano(NOTE(root), 3.0, 0.7), t, 0.4 * gain)
            for k, p in enumerate([2, 1]):
                if ok(at(k * 2 + 1)):
                    add(buf, piano(NOTE(ch[p] + 12), 2.0, 0.6), at(k * 2 + 1), 0.28 * gain)
        elif style == "drone":
            add(buf, pad([NOTE(n - 12) for n in ch], dur + 0.4), t, 0.5 * gain)
            if ok(at(2)):
                add(buf, musicbox(NOTE(ch[(i % 3)] + 24)), at(2), 0.08 * gain, pan=0.2)
        elif style in ("swell", "end", "dance"):
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.5 * gain)
            add(buf, piano(NOTE(root), 2.6, 0.8), t, 0.45 * gain)
            pat = [0, 2, 1, 2, 3, 2, 1, 2] if style != "end" else [0, 1, 2, 3]
            step = 0.5 if style != "end" else 1.0
            for k, p in enumerate(pat):
                tt = at(k * step)
                if not ok(tt):
                    break
                n = ch[p] if p < 3 else ch[0] + 12
                add(buf, piano(NOTE(n + 12), 1.2, 0.6 if k % 2 else 0.8), tt, 0.3 * gain, pan=0.25 if k % 2 else -0.2)
            if style == "dance":
                for k in range(4):
                    if ok(at(k)):
                        add(buf, lowpass(rng.standard_normal(int(0.05 * SR)), 5000) * env_exp(int(0.05 * SR), 40) * 0.5, at(k + 0.5), 0.2 * gain)
                        add(buf, bassp(NOTE(root), 0.25), at(k), 0.5 * gain)
        t += bar
        i += 1


def music(ws, S, E, total):
    buf = np.zeros((int((total + 3) * SR), 2))
    section(buf, 0.0, S["A03"], [Am, E7], "box", 96, 0.9)
    section(buf, S["A03"], S["C01"], [C, F, G, C], "bounce", 112, 0.85)
    section(buf, S["C01"], S["C10"], [Dm, Am, Dm, E7], "quirky", 104, 0.9)
    section(buf, S["C10"], S["D01"], [Am], "drone", 80, 0.7)
    section(buf, S["D01"], S["E01"], [C, Am, F, G], "sparse", 76, 0.85)
    section(buf, S["E01"], S["G01"], [Am, F, Am, E7], "drone", 70, 0.8)
    section(buf, S["G01"], S["H01"], [Am, Dm, E7, Am], "sneak", 100, 0.9)
    section(buf, S["H01"], S["H05"], [C, F, G, C], "dance", 112, 0.9)
    section(buf, S["H05"], S["J01"], [Am], "drone", 80, 0.55)
    section(buf, S["J01"], S["L03"], [C, G, Am, F], "swell", 112, 1.05)
    section(buf, S["L03"], S["L05"], [Dm, Am, Dm, G], "quirky", 104, 0.85)
    section(buf, S["L05"], total - 2.4, [F, C, G, C], "end", 84, 0.9)
    add(buf, pad([NOTE(n) for n in C[1]], 4.0), total - 2.4, 0.6)
    for k, n in enumerate([48, 60, 64, 67, 72]):
        add(buf, piano(NOTE(n), 4.0, 0.8), total - 2.4 + k * 0.12, 0.35)
    buf = buf[: int(total * SR)]
    n = len(buf)
    fade = np.minimum(1, np.arange(n) / (0.3 * SR))[:, None] * np.minimum(1, (n - np.arange(n)) / (1.2 * SR))[:, None]
    return buf * fade


# ------------------------------------------------------------------ sound effects
def noise(n):
    return rng.standard_normal(n)


def vowel(f0, dur, formants, breath=0.15, vib=0.0, glide=0.0):
    """a voiced syllable: a glottal pulse train through resonant formants"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + glide * t / max(dur, 1e-3)) * (1 + vib * np.sin(2 * np.pi * 6 * t))
    ph = np.cumsum(f) / SR
    src = (ph % 1.0) * 2 - 1
    src = src - np.convolve(src, np.ones(3) / 3, mode="same")
    src = src + breath * noise(n)
    X = np.fft.rfft(src)
    fr = np.fft.rfftfreq(n, 1 / SR)
    H = np.zeros_like(fr)
    for fc, bw, g in formants:
        H += g / (1 + ((fr - fc) / bw) ** 2)
    y = np.fft.irfft(X * H, n)
    e = np.minimum(1, t / 0.015) * np.minimum(1, (dur - t) / 0.03)
    y = y * e
    return y / (np.abs(y).max() + 1e-9)


EE = [(320, 80, 1.0), (2400, 200, 0.5), (3000, 300, 0.25)]
AH = [(750, 110, 1.0), (1200, 150, 0.6), (2600, 250, 0.2)]
OO = [(330, 70, 1.0), (850, 120, 0.4), (2300, 250, 0.08)]
HM = [(250, 60, 1.0), (1100, 200, 0.15)]


def giggle(n=5, f0=420, seed=0):
    r = np.random.default_rng(seed)
    out = np.zeros(int((n * 0.13 + 0.3) * SR))
    for k in range(n):
        syl = vowel(f0 * (1.12 - 0.05 * k) * (1 + 0.04 * r.standard_normal()), 0.09, EE, breath=0.35, glide=-0.15)
        h = lowpass(noise(int(0.035 * SR)), 5000) * 0.25 * env_exp(int(0.035 * SR), 30)
        i = int(k * 0.125 * SR)
        out[i: i + len(h)] += h
        out[i + len(h) // 2: i + len(h) // 2 + len(syl)] += syl * 0.8
    return out


def laugh_big(n=8, f0=400, seed=0):
    r = np.random.default_rng(seed)
    out = np.zeros(int((n * 0.17 + 0.4) * SR))
    for k in range(n):
        syl = vowel(f0 * (1.15 - 0.03 * k) * (1 + 0.05 * r.standard_normal()), 0.12, AH if k % 3 else EE, breath=0.3, glide=-0.2)
        i = int(k * 0.165 * SR)
        out[i: i + len(syl)] += syl
    return out


def sneeze_sfx(wind):
    """'ah... ah...' rising, then CHOO: a broadband burst into a short 'oo'"""
    n_ah = max(1, int(round(wind / 0.45)))
    parts = []
    t = 0.0
    out = np.zeros(int((wind + 0.9) * SR))
    for k in range(n_ah):
        d = min(0.32, wind / n_ah * 0.75)
        a = vowel(170 * (1 + 0.15 * k), d, AH, breath=0.45, glide=0.25) * (0.5 + 0.25 * k)
        i = int(t * SR)
        out[i: i + len(a)] += a
        t += wind / n_ah
    i0 = int(wind * SR)
    nb = int(0.22 * SR)
    burst = highpass(lowpass(noise(nb), 7000), 700) * env_exp(nb, 9) * 1.4
    out[i0: i0 + nb] += burst
    oo = vowel(220, 0.3, OO, breath=0.5, glide=-0.35) * 0.7
    out[i0 + int(0.06 * SR): i0 + int(0.06 * SR) + len(oo)] += oo
    return out


def boing(dur=0.7, f0=180):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.6 * np.exp(-t * 6)) * (1 + 0.08 * np.sin(2 * np.pi * 14 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 4.5)


def thump(dur=0.25, f=90):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * (1 - 0.4 * t / dur) * t) * env_exp(n, 18) + lowpass(noise(n), 400) * env_exp(n, 30) * 0.6)


def sparkle(base=84):
    out = np.zeros(int(1.6 * SR))
    for k, m in enumerate([0, 4, 7, 12, 16, 19]):
        x = tone(NOTE(base + m), 1.1, ((1, 1.0), (2.76, 0.2)), k=4.5)
        i = int(k * 0.07 * SR)
        out[i: i + len(x)] += x * 0.3
    return out


def scratch(dur=0.12):
    n = int(dur * SR)
    return highpass(lowpass(noise(n), 6000), 1800) * np.sin(np.pi * np.arange(n) / n) ** 2


def sfx(ws, S, E, total):
    buf = np.zeros((int((total + 3) * SR), 2))
    w = lambda *a: W(ws, *a)
    # --- giggles and laughs (Lily, panned a little left: she is above / beside Bo)
    gig = [S["A03"] + 0.45, S["A04"] + 0.2, S["A04"] + 0.85, S["A08"] + 0.1, S["A09"] + 0.05, S["B01"] + 0.15, S["B01"] + 0.95, S["B02"] + 0.05, S["B03"] + 0.0,
           S["B05"] + 0.2, S["B09"] + 0.0, S["C10"] + 0.2]
    for k, t in enumerate(gig):
        add(buf, giggle(4 + k % 3, 420 + 20 * (k % 3), k), t, 0.32, pan=-0.25)
    for k, t in enumerate([S["J01"] + 0.05, S["J02"] + 0.1, S["J06"] + 0.3, S["J06b"] + 0.05, S["J07"] + 0.1, S["L01"] + 0.1, S["L02"] + 0.3, S["L07"] + 0.2, S["L08"] + 0.1]):
        add(buf, laugh_big(7 + k % 3, 410, 50 + k), t, 0.36, pan=-0.2)
    # --- Bo's sneezes (t0 = the CHOO, wind = the wind-up), each followed by the bed's boing when he is under / on it
    snz = [(w(3, "sneeze."), 0.7, True), (w(6, "sneeze") + 0.05, 1.3, True), (S["B09"] + 0.25, 0.25, False), (w(35, "flew") - 0.1, 1.1, False),
           (S["J06"] + 1.1, 0.5, True), (w(36, "sneezing.") - 0.1, 0.6, True), (w(38, "sneeze") + 0.05, 0.9, True), (w(41, "sneezing") - 0.2, 0.7, True)]
    for t0, wind, bed in snz:
        add(buf, sneeze_sfx(wind), t0 - wind, 0.55, pan=0.1)
        if bed:
            add(buf, boing(0.8, 150), t0 + 0.05, 0.28, pan=-0.1)
    # --- a small itch-scratch flurry (A06) and the drawer socks' scramble (B09)
    for k in range(9):
        add(buf, scratch(0.09 + 0.04 * (k % 2)), S["A06"] + 0.1 + k * 0.17, 0.22, pan=0.2 * ((k % 3) - 1))
    # --- the Underbed: chatter murmurs, Grizzle's snore, teasing chuckles
    for k in range(6):
        add(buf, vowel(140 + 30 * (k % 3), 0.14, HM, breath=0.3, glide=0.1) * 0.5, S["C01"] + 0.2 + k * 0.25, 0.12, pan=(k % 3 - 1) * 0.5)
    for k in range(2):
        n = int(0.9 * SR)
        tt = np.arange(n) / SR
        snore = lowpass(noise(n), 260 + 60 * np.sin(2 * np.pi * 30 * tt).mean()) * np.sin(np.pi * tt / 0.9) ** 2 * (1 + 0.5 * np.sin(2 * np.pi * 32 * tt))
        add(buf, snore * 1.2, S["C03"] + 0.05 + k * 0.6, 0.35)
    for k, t in enumerate([S["C07"] + 0.3, S["C08"] + 0.1, S["C08"] + 0.9, S["C09"] + 0.2, S["L03"] + 0.1, S["L03"] + 0.8]):
        for j in range(3):
            add(buf, vowel(115 + 10 * j, 0.11, AH, breath=0.4, glide=-0.2), t + j * 0.15, 0.18, pan=0.3 if k % 2 else -0.3)
    # --- the street: the truck rumbles in, idles, honks, drives off
    t_a, t_leave = S["D01"], w(17, "waved") - 0.1
    n = int((S["E01"] - t_a) * SR)
    tt = np.arange(n) / SR
    rpm = 32 + 10 * np.clip((tt - (t_leave - t_a)) / 1.5, 0, 1)
    eng = lowpass(np.sign(np.sin(2 * np.pi * np.cumsum(rpm) / SR)) * 0.6 + noise(n) * 0.3, 300)
    vol = np.minimum(1, tt / 1.2) * (1 - 0.5 * np.clip((tt - (t_leave - t_a) - 1.0) / 2.0, 0, 1))
    add(buf, eng * vol, t_a, 0.22)
    for k in range(2):
        add(buf, tone(392, 0.22, ((1, 1.0), (2, 0.4), (3, 0.3)), k=2) + tone(494, 0.22, ((1, 1.0), (2, 0.4)), k=2), t_leave - 0.4 + k * 0.3, 0.12, pan=0.3)
    # --- the sad week: soft muffled sobs under the blanket
    for k in range(5):
        add(buf, lowpass(vowel(300, 0.18, HM, breath=0.5, glide=-0.3), 900), S["F02"] + 0.2 + k * 0.55, 0.14, pan=-0.3)
    # --- the plan: crayon scribble, socks hopping, the wig, the dance stomps
    for k in range(10):
        add(buf, scratch(0.07) * 0.8, S["G04"] + 0.15 + k * 0.11, 0.16)
    t = S["G08"]
    while t < S["G10"] + 1.5:
        add(buf, thump(0.08, 260) * 0.6, t, 0.12, pan=0.3)
        t += 1 / 1.8 / 3
    n = int(0.3 * SR)
    add(buf, lowpass(noise(n), 1200) * env_exp(n, 10), S["H02"] + 0.5, 0.3)
    t = S["H04"]
    while t < w(31, "saw"):
        add(buf, thump(0.15, 80), t, 0.25)
        t += 1 / 1.7 / 2
    # --- the BONK: a thump, a wooden knock, a boing, the stars twinkle
    tb = w(35, "bonked")
    add(buf, thump(0.35, 70), tb, 0.8)
    add(buf, tone(520, 0.12, ((1, 1.0), (2.3, 0.5)), k=30), tb, 0.35)
    add(buf, boing(0.9, 240), tb + 0.05, 0.3)
    add(buf, sparkle(91), tb + 0.2, 0.3)
    # --- whoosh as Bo rockets up
    n = int(0.6 * SR)
    X = np.fft.rfft(noise(n))
    fr = np.fft.rfftfreq(n, 1 / SR)
    X *= np.exp(-((fr - 1500) / 1000) ** 2)
    x = np.fft.irfft(X, n) * np.sin(np.pi * np.arange(n) / n) ** 2
    add(buf, x / (np.abs(x).max() + 1e-9), w(35, "flew") - 0.05, 0.3)
    # --- sparkles: the tissue box, the note
    add(buf, sparkle(84), S["L05"] + 0.1, 0.35)
    add(buf, sparkle(88), S["L06"] + 0.05, 0.3)
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
    S, E, total = shots(plan)
    write(out_music, music(ws, S, E, total), 0.85)
    write(out_sfx, sfx(ws, S, E, total), 0.85)
    print(f"wrote {out_music} and {out_sfx} ({total:.2f} s)")


if __name__ == "__main__":
    main(*sys.argv[1:5])
