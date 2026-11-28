"""The score + sound effects of "The Town With No Mirrors", synthesised from scratch with numpy (no samples, no
third-party music). In the family of the sword and mask scores (a theme that follows the story) with its own sound:
a music box plays the mirror theme; a glassy celesta, low fog drones, a clock that ticks, a heartbeat for the dread;
plucked strings for the town's strange little habits; a choir swell at the reveal; drums and strings for the fire; a
warm piano with strings, the theme in major, for the love at the end. Key: A minor, turning to A major at the end.

    python vo/make_score_mirror.py      (writes vo/n1/music.wav and vo/n1/sfx.wav)
"""
import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import NOTE, SR, W, add, env_exp, highpass, lowpass, pad, tone, words  # noqa: E402
from make_score_monster import AH, OO, bassp, musicbox, piano, sparkle, thump, vowel  # noqa: E402
import make_score_sword as S_  # noqa: E402
import make_score_mask2 as M2  # noqa: E402
import make_score_hero as H  # noqa: E402
import make_score_text as T  # noqa: E402
import make_score_comet as CM  # noqa: E402

rng = np.random.default_rng(4141)
noise = lambda n: rng.standard_normal(n)
hash_ = S_.hash_

Am, F, C, G, E7, Dm, E, A, D, Fsus = (45, [64, 69, 72]), (41, [65, 69, 72]), (36, [64, 67, 72]), (43, [62, 67, 71]), (40, [64, 68, 71]), (38, [62, 65, 69]), (40, [64, 68, 71]), (45, [64, 69, 73]), (38, [62, 66, 69]), (41, [65, 70, 72])
F_ = F
Bm, Fsm, Cs = (47, [62, 66, 71]), (42, [61, 66, 69]), (37, [61, 65, 68])
# the mirror theme: E A B C B A G# A (a question), and its answer climbing to E
THEME = [(0, 76, 0.5), (0.5, 81, 0.5), (1, 83, 0.5), (1.5, 84, 1.0), (2.5, 83, 0.5), (3, 81, 0.5), (3.5, 80, 0.5)]
ANSWER = [(0, 81, 0.5), (0.5, 84, 0.5), (1, 83, 0.5), (1.5, 81, 0.5), (2, 79, 0.5), (2.5, 76, 1.5)]
THEME_MAJ = [(0, 76, 0.5), (0.5, 81, 0.5), (1, 83, 0.5), (1.5, 85, 1.0), (2.5, 83, 0.5), (3, 81, 0.5), (3.5, 80, 0.5)]
ANSWER_MAJ = [(0, 81, 0.5), (0.5, 85, 0.5), (1, 88, 1.0), (2, 85, 0.5), (2.5, 81, 1.5)]


def celesta(f, dur=1.4):
    """a glassy bell-piano: a pure tone, a bright inharmonic shimmer that dies fast"""
    return (tone(f, dur, ((1, 1.0), (2, 0.25), (4.1, 0.18), (6.8, 0.06)), k=3.2, att=0.002) * 0.6)


def pluck(f, dur=0.3):
    return lowpass(tone(f, dur, ((1, 1.0), (2, 0.45), (3, 0.2)), k=13, att=0.002), 2800) * 0.6


def tick():
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2400 * tt) * 0.4 + highpass(noise(n), 3000) * 0.6) * np.exp(-tt * 140) * 0.5


def warm_strings(fs, dur):
    """a soft string section (detuned saws, slow attack) for the love theme"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    y = np.zeros(n)
    for f in fs:
        for det in (-0.005, 0.0, 0.006):
            ph = 2 * np.pi * f * (1 + det) * tt + 0.3 * np.sin(2 * np.pi * 5.0 * tt) * 0.004 * f / f
            y += sum(np.sin(h * ph) / h for h in range(1, 7))
    e = np.minimum(1, tt / 0.6) * np.minimum(1, (dur - tt) / 0.6)
    return lowpass(y * e, 2600) / (len(fs) * 3)


fl = lambda f, d: M2.flute(f, d)
mb = lambda f, d: musicbox(f, max(d, 1.1))
ce = lambda f, d: celesta(f, max(d, 1.2))
pn = lambda f, d: piano(f, max(d, 1.2), 0.75)
phrase = M2.phrase
drone = M2.drone


def section(buf, t0, t1, prog, style, bpm, gain=1.0):
    beat = 60 / bpm
    bar = 4 * beat
    t, i = t0, 0
    while t < t1 - 0.05:
        root, ch = prog[i % len(prog)]
        dur = min(bar, t1 - t)
        at = lambda k: t + k * beat
        ok = lambda tt: tt < t1 - 0.05
        if style == "eerie":  # the hook: a low drone, the music box asking its question, a glassy shimmer
            add(buf, drone(NOTE(root - 12), dur + 0.6, 1.1), t, 0.75 * gain)
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.22 * gain)
            phrase(buf, t, THEME if i % 2 == 0 else ANSWER, beat, mb, 0.4 * gain, t1, 0, pan=0.25)
            for k in (1.5, 3.5):
                if ok(at(k)):
                    add(buf, celesta(NOTE(ch[2] + 24), 1.6), at(k), 0.12 * gain, pan=-0.3)
        elif style == "home":  # Grandma: a soft piano, the music box, warm but a little uneasy
            add(buf, pad([NOTE(n) for n in ch], dur + 0.8), t, 0.35 * gain)
            add(buf, piano(NOTE(root), 3.0, 0.7), t, 0.35 * gain)
            for k in range(4):
                if ok(at(k)):
                    add(buf, piano(NOTE([ch[0], ch[1], ch[2], ch[1]][k] + 12), 1.4, 0.5), at(k), 0.2 * gain, pan=0.15 if k % 2 else -0.15)
            if i % 2 == 1:
                phrase(buf, t, ANSWER, beat, mb, 0.3 * gain, t1, -12, pan=0.25)
        elif style == "fog":  # the fog and the road that ends: a drone, a breathy pad, a clock ticking
            add(buf, drone(NOTE(root - 12), dur + 0.6, 1.2), t, 0.7 * gain)
            add(buf, M2.tremolo([NOTE(n) for n in ch], dur + 0.4, 6), t, 0.18 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    add(buf, tick(), at(k / 2), (0.3 if k % 2 == 0 else 0.18) * gain, pan=0.3)
            if i % 2 == 0:
                phrase(buf, t, THEME, beat, ce, 0.22 * gain, t1, 0, pan=-0.2)
        elif style == "curious":  # the strange little habits: plucked strings tiptoeing, the music box, a tick
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.25 * gain)
            add(buf, bassp(NOTE(root), 0.4), t, 0.4 * gain)
            if ok(at(2)):
                add(buf, bassp(NOTE(root + 7), 0.4), at(2), 0.3 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    m = [ch[0], ch[2], ch[1] + 12, ch[2], ch[0] + 12, ch[2], ch[1], ch[2]][k]
                    add(buf, pluck(NOTE(m), 0.28), at(k / 2), (0.32 if k % 2 == 0 else 0.2) * gain, pan=-0.25 if k % 2 else 0.25)
            for k in (1, 3):
                if ok(at(k)):
                    add(buf, tick(), at(k), 0.22 * gain, pan=0.35)
            phrase(buf, t, THEME if i % 2 == 0 else ANSWER, beat, mb, 0.26 * gain, t1, 0, pan=0.2)
        elif style == "mina":  # Mina: lighter, the flute over plucks
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.28 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    m = [ch[0], ch[1], ch[2], ch[1] + 12][k % 4]
                    add(buf, pluck(NOTE(m), 0.3), at(k / 2), (0.26 if k % 2 == 0 else 0.16) * gain, pan=0.2)
            mel = [(0, ch[2] + 12, 1), (1, ch[1] + 12, 0.5), (1.5, ch[2] + 12, 0.5), (2, ch[0] + 24, 1.5)]
            phrase(buf, t, mel, beat, fl, 0.26 * gain, t1)
        elif style == "uneasy":  # the shadow, the stones: a low pulse, a hummed choir, the theme on celesta
            add(buf, drone(NOTE(root - 12), dur + 0.4, 1.2), t, 0.65 * gain)
            add(buf, S_.choir([NOTE(n) for n in ch], dur + 0.6, OO), t, 0.45 * gain)
            for k in (0, 2):
                if ok(at(k)):
                    add(buf, S_.heartbeat(), at(k), 0.35 * gain)
            phrase(buf, t, THEME, beat, ce, 0.24 * gain, t1, 0, pan=-0.2)
        elif style == "rain":  # rain: shivering low strings, piano drops
            add(buf, M2.tremolo([NOTE(n - 12) for n in ch], dur + 0.4, 10), t, 0.32 * gain)
            add(buf, drone(NOTE(root - 12), dur + 0.4), t, 0.5 * gain)
            for k in range(6):
                if ok(at(k * 0.66)):
                    add(buf, piano(NOTE(ch[(k * 2) % 3] + 24), 1.2, 0.5), at(k * 0.66), 0.15 * gain, pan=(k % 3 - 1) * 0.3)
        elif style == "tension":  # the river, the mirror in the water: a heartbeat, a rising tremolo
            add(buf, drone(NOTE(root - 12), dur + 0.4, 1.3), t, 0.75 * gain)
            add(buf, M2.tremolo([NOTE(n) for n in ch], dur + 0.3, 14), t, (0.25 + 0.1 * i) * gain)
            for k in (0, 1.6):
                if ok(at(k)):
                    add(buf, S_.heartbeat(), at(k), 0.5 * gain)
            if i % 2 == 1:
                phrase(buf, t, THEME, beat * 1.5, mb, 0.26 * gain, t1, 0, pan=0.25)
        elif style == "mirror":  # in the mirror: glass, a high shimmer, the theme slowed on the music box
            add(buf, drone(NOTE(root - 12), dur + 0.6, 1.1), t, 0.6 * gain)
            add(buf, pad([NOTE(n + 12) for n in ch], dur + 0.6), t, 0.2 * gain)
            phrase(buf, t, THEME, beat * 1.4, mb, 0.34 * gain, t1, 0, pan=0.2)
            for k in range(4):
                if ok(at(k + 0.5)):
                    add(buf, celesta(NOTE(ch[k % 3] + 24), 1.4), at(k + 0.5), 0.1 * gain, pan=0.4 * (k % 2 * 2 - 1))
        elif style == "reveal":  # the ghosts: a choir opening, strings, bells
            add(buf, S_.choir([NOTE(n) for n in ch], dur + 0.8, AH), t, 1.0 * gain)
            add(buf, warm_strings([NOTE(n) for n in ch], dur + 0.6), t, 0.5 * gain)
            add(buf, drone(NOTE(root - 12), dur + 0.4), t, 0.5 * gain)
            for k in range(4):
                if ok(at(k)):
                    add(buf, celesta(NOTE(ch[k % 3] + 12), 1.6), at(k), 0.2 * gain, pan=0.3 * (k % 2 * 2 - 1))
        elif style == "fire":  # the fire: drums, a dark choir, string stabs
            add(buf, S_.choir([NOTE(n) for n in ch], dur + 0.6, AH), t, 0.8 * gain)
            add(buf, drone(NOTE(root - 12), dur + 0.4, 1.4), t, 0.7 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    add(buf, S_.taiko(0.5, 46 + 12 * (k % 2)), at(k / 2), (0.75 if k % 2 == 0 else 0.4) * gain)
                    add(buf, S_.string_stab([NOTE(n) for n in ch], 0.2), at(k / 2), 0.3 * gain, pan=0.2 * ((k % 2) * 2 - 1))
        elif style == "love":  # the memories, Mina, every face: warm piano and strings, the theme in major
            add(buf, warm_strings([NOTE(n) for n in ch], dur + 0.8), t, 0.55 * gain)
            add(buf, pad([NOTE(n) for n in ch], dur + 0.8), t, 0.3 * gain)
            add(buf, piano(NOTE(root), 3.0, 0.8), t, 0.38 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    m = [ch[0], ch[1], ch[2], ch[1]][k % 4] + 12
                    add(buf, piano(NOTE(m), 1.2, 0.5), at(k / 2), 0.15 * gain, pan=0.2 if k % 2 else -0.2)
            phrase(buf, t, THEME_MAJ if i % 2 == 0 else ANSWER_MAJ, beat, pn, 0.3 * gain, t1, 0, pan=0.1)
        elif style == "end":  # her hand, the end: the music box with strings and a soft choir, resolving in A major
            add(buf, warm_strings([NOTE(n) for n in ch], dur + 0.8), t, 0.5 * gain)
            add(buf, S_.choir([NOTE(n) for n in ch], dur + 0.8, OO), t, 0.55 * gain)
            add(buf, piano(NOTE(root), 3.2, 0.7), t, 0.32 * gain)
            phrase(buf, t, THEME_MAJ if i % 2 == 0 else ANSWER_MAJ, beat, mb, 0.36 * gain, t1, 0, pan=0.2)
        t += bar
        i += 1


def music(S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    plan = [
        ("A01", "C01", [Am, F, Am, E7], "eerie", 84, 1.0),
        ("C01", "D01", [Am, F, C, E7], "home", 84, 0.9),
        ("D01", "F01", [Am, Dm, Am, E7], "fog", 84, 1.0),
        ("F01", "H01", [Am, F, Dm, E7], "curious", 96, 0.95),
        ("H01", "J01", [C, G, Am, F], "mina", 96, 0.9),
        ("J01", "L01", [Am, F, Dm, E7], "uneasy", 80, 0.95),
        ("L01", "M01", [Am, F], "rain", 80, 0.95),
        ("M01", "P01", [Am, Dm, Am, E7], "tension", 84, 1.0),
        ("P01", "R01", [Am, F, Dm, E7], "mirror", 72, 0.95),
        ("R01", "S02", [A, D, A, E], "reveal", 72, 1.05),
        ("S02", "S06", [Am, F, Dm, E7], "fire", 104, 1.05),
        ("S06", "V01", [A, Fsm, D, E], "love", 80, 1.0),
        ("V01", None, [D, A, Bm, E], "end", 72, 1.0),
    ]
    for a, b, prog, style, bpm, g in plan:
        section(buf, S[a], S[b] if b else total - 2.6, prog, style, bpm, g)
    # the hook: a deep hit and the music box alone
    add(buf, S_.taiko(0.9, 40, 1.0), S["A01"] + 0.02, 0.5)
    # "disappear": a falling shimmer
    add(buf, CM.whoosh_white(0.9) if hasattr(CM, "whoosh_white") else M2.riser(0.9), S["A04"], 0.15)
    # the mirror: the music drops out to the drone for "I looked"
    add(buf, M2.riser(S["P01"] - S["N05"]), S["N05"], 0.25)
    # the turn: a big choir breath as the blue appears
    add(buf, S_.choir([NOTE(n) for n in (57, 64, 69, 73)], 3.5, AH), S["R02"] - 0.2, 0.9)
    # the end chord: A major, the music box last notes
    end = total - 2.6
    add(buf, warm_strings([NOTE(n) for n in (57, 64, 69, 73)], 3.0), end, 0.55)
    add(buf, S_.choir([NOTE(n) for n in (57, 64, 69, 73)], 3.0, OO), end, 0.5)
    for k, m in enumerate((81, 85, 88, 93)):
        add(buf, musicbox(NOTE(m), 2.4), end + 0.1 + k * 0.32, 0.3)
    buf = buf[: int(total * SR)]
    for c in range(2):
        buf[:, c] -= 0.55 * lowpass(buf[:, c], 110)
    m = buf.mean(1)
    win = int(1.5 * SR)
    pw = np.convolve(m ** 2, np.ones(win) / win, mode="same")
    rms = np.sqrt(pw + 1e-10)
    target = np.median(rms[rms > 1e-4])
    g = np.clip((target / rms) ** 0.5, 0.6, 2.0)
    g = np.convolve(g, np.ones(win // 2) / (win // 2), mode="same")
    buf *= g[:, None]
    n = len(buf)
    fade = np.minimum(1, np.arange(n) / (0.05 * SR))[:, None] * np.minimum(1, (n - np.arange(n)) / (1.5 * SR))[:, None]
    # a breath of silence on "I looked"
    q = int(S["P01"] * SR)
    gate = np.ones(n)
    gate[q - int(0.1 * SR): q] = np.linspace(1.0, 0.25, int(0.1 * SR))
    gate[q: q + int(0.7 * SR)] = np.linspace(0.25, 1.0, int(0.7 * SR))
    return buf * fade * gate[:, None]


# ------------------------------------------------------------------ sound effects
def rain(dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = lowpass(highpass(noise(n), 600), 7000) * 0.35
    for k in range(int(dur * 60)):
        i = int(hash_(k * 1.3) * (n - 400))
        out[i: i + 300] += highpass(noise(300), 3000) * env_exp(300, 200) * (0.2 + 0.3 * hash_(k))
    return out * np.minimum(1, tt / 0.5) * np.minimum(1, (dur - tt) / 0.5)


def river(dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = lowpass(noise(n), 700) * 0.4 * (0.8 + 0.2 * np.sin(tt * 1.3))
    for k in range(int(dur * 6)):
        i = int(hash_(k * 2.1) * (n - 3000))
        m = 2400
        f = 600 + 900 * hash_(k * 3)
        out[i: i + m] += np.sin(2 * np.pi * f * (1 + 0.6 * np.arange(m) / m) * np.arange(m) / SR) * env_exp(m, 40) * 0.12
    return out * np.minimum(1, tt / 0.6) * np.minimum(1, (dur - tt) / 0.6)


def caw(f0=520):
    v = vowel(f0, 0.32, AH, breath=0.6, glide=-0.25)
    n = len(v)
    tt = np.arange(n) / SR
    return lowpass(np.tanh(3 * v) * (0.6 + 0.4 * np.sin(2 * np.pi * 38 * tt)), 3200) * np.sin(np.pi * tt / tt[-1]) * 0.6


def tinkle(f=3300):
    n = int(1.2 * SR)
    tt = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * r * tt) * a for r, a in ((1, 1.0), (1.48, 0.5), (2.31, 0.3), (3.7, 0.15)))
    return y * np.exp(-tt * 5) * 0.3


def glass_crack():
    n = int(0.7 * SR)
    tt = np.arange(n) / SR
    out = highpass(noise(n), 2500) * np.exp(-tt * 18) * 0.6
    for k in range(6):
        i = int((0.01 + 0.25 * hash_(k * 7.7)) * SR)
        c = S_.click(4000 + 3000 * hash_(k))
        out[i: i + len(c)] += c[: n - i] * 0.7
    return out + tinkle(4200)[:n] * 0.4


def brush(dur=0.5):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return lowpass(highpass(noise(n), 1500), 6000) * np.sin(np.pi * tt / dur) ** 2 * 0.35


def clink(f=2600):
    n = int(0.4 * SR)
    tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 2.7 * tt)) * np.exp(-tt * 18) * 0.3


def baby_cry(dur=1.6):
    out = np.zeros(int(dur * SR))
    t = 0.0
    k = 0
    while t < dur - 0.4:
        v = vowel(430 + 40 * hash_(k), 0.5, AH, breath=0.3, vib=0.02, glide=-0.15)
        i = int(t * SR)
        out[i: i + len(v)] += v[: len(out) - i] * 0.5
        t += 0.62
        k += 1
    return lowpass(out, 3000)


def fire_roar(dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return (lowpass(noise(n), 400) * 0.7 + S_.crackle(dur)[:n] * 0.8) * np.minimum(1, tt / 0.4) * np.minimum(1, (dur - tt) / 0.4)


def sfx(ws, S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    w = lambda *a: W(ws, *a)
    wind = lambda d: S_.wind(d)
    # A, B: the rule, the windows, the lake, the spoons
    add(buf, wind(S["C01"] - S["A01"]), S["A01"], 0.22)
    for k in range(3):
        add(buf, brush(0.45), S["A03"] + 0.1 + 0.4 * k, 0.4, pan=-0.2)
    for k in range(4):
        add(buf, S_.step(), S["A04"] + 0.05 + 0.4 * k, 0.18 * (1 - k / 4))
    add(buf, T.creak(1.0) * 0.4, S["B02"] + 0.2, 0.25)
    add(buf, clink(2400), S["B03"] + 0.3, 0.45)
    add(buf, clink(2900), S["B03"] + 0.55, 0.35)
    # C: the scarf, the door
    add(buf, S_.cloth(0.8), S["C01"] + 0.2, 0.35)
    # D, E: the fog, the road, the bus stop
    add(buf, wind(S["F01"] - S["D01"]), S["D01"], 0.32)
    add(buf, T.creak(0.8) * 0.5, S["D04"] + 0.2, 0.25)
    # F: dinner
    add(buf, clink(2600), S["F01"] + 0.4, 0.35)
    for k in range(3):
        add(buf, clink(2200 + 300 * k), S["F02"] + 0.2 + 0.45 * k, 0.25)
    # G: the shop (a door bell), the coin
    add(buf, M2.bell(1.0), S["G01"] + 0.5, 0.35)
    add(buf, tinkle(2200) * 0.5, S["G03"] + 0.45, 0.35)
    add(buf, tinkle(2400) * 0.5, S["G04"] + 0.15, 0.25)
    # H: Mina by the lake, footsteps
    for k in range(int((S["J01"] - S["H01"]) / 0.45)):
        add(buf, S_.step(), S["H01"] + 0.1 + 0.45 * k, 0.14, pan=0.1 * ((k % 2) * 2 - 1))
    # J, K: the night, the lamps hum, the stones
    add(buf, S_.glow_hum(S["K01"] - S["J01"], 120) * 0.3, S["J01"], 0.2)
    add(buf, wind(S["L01"] - S["K01"]), S["K01"], 0.3)
    add(buf, caw(480), S["K02"] + 0.4, 0.18, pan=-0.4)
    # L: the rain
    add(buf, rain(S["M01"] - S["L01"] + 0.4), S["L01"] - 0.2, 0.5)
    # M, N: the river, the glint, the crows, the shard
    add(buf, river(S["R01"] - S["M01"]), S["M01"], 0.25)
    add(buf, tinkle(3600), S["M02"] + 0.2, 0.3)
    add(buf, caw(560), S["M04"] - 0.15, 0.3, pan=0.3)
    add(buf, sparkle(77), S["M05"] + 0.1, 0.2)
    add(buf, S_.heartbeat(), S["N01"] + 0.1, 0.45)
    add(buf, S_.heartbeat(), S["N02"] + 0.2, 0.5)
    add(buf, CM.whoosh_white(0.6) if hasattr(CM, "whoosh_white") else S_.whoosh(0.6), S["N03"] - 0.2, 0.25)
    add(buf, tinkle(3000), S["N05"] + 0.4, 0.35)
    # P, Q: in the mirror
    add(buf, tinkle(4000) * 0.6, S["P01"] + 0.05, 0.3)
    add(buf, S_.heartbeat(), S["P03"] + 0.1, 0.55)
    add(buf, S_.heartbeat(), S["P05"] + 0.1, 0.55)
    add(buf, glass_crack(), S["Q02"] + 0.25, 0.6)
    # R, S: the turn, the ghosts, the fire, the baby
    add(buf, S_.cloth(0.6), S["R01"] + 0.2, 0.3)
    add(buf, M2.riser(1.0), S["R02"] - 1.0, 0.25)
    add(buf, sparkle(91), S["R02"] + 0.1, 0.35)
    add(buf, S_.glow_hum(S["S02"] - S["R02"], 196) * 0.4, S["R02"], 0.2)
    add(buf, fire_roar(S["S06"] - S["S02"] + 0.3), S["S02"] - 0.1, 0.6)
    add(buf, T.creak(1.2), S["S03"] + 0.2, 0.35)
    S_.boom(S["S04"] + 0.1, buf, 0.5)
    add(buf, baby_cry(S["S06"] - S["S05"]), S["S05"] + 0.1, 0.32)
    # T, U: memories
    add(buf, sparkle(83), S["T01"] + 0.2, 0.18)
    add(buf, brush(0.5), S["T03"] + 0.3, 0.3)
    add(buf, sparkle(88), S["T05"] + 0.6, 0.25)
    # V, W: through her hand, the end
    add(buf, sparkle(95), S["V02"] + 0.1, 0.45)
    add(buf, S_.glow_hum(1.6, 262) * 0.5, S["V02"] + 0.1, 0.25)
    add(buf, wind(total - S["W02"]), S["W02"], 0.18)
    return buf[: int(total * SR)]


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    ws = words(root / "vo/n1/timings.json")
    S, total = H.shots(root / "src/planN.gen.ts")
    T.write(root / "vo/n1/music.wav", music(S, total), 0.85)
    T.write(root / "vo/n1/sfx.wav", sfx(ws, S, total), 0.85)
    print(f"wrote vo/n1/music.wav + sfx.wav ({total:.2f} s)")
