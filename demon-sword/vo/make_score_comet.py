"""Music + sound effects for "The Comet Swap", synthesised from scratch (no samples, no third-party music).
Music: the curious storytime loop the user asked for (make_score_hero5.py: bright Lydian chords, tiptoeing pizzicato,
marimba, a celesta melody of question phrases, a quiet tick-tock, a light pad; one steady loop to the end), moved up a
whole tone to G Lydian so this film has its own colour. Sound effects sit on their words.

    python vo/make_score_comet.py      (writes vo/c1/music.wav and vo/c1/sfx.wav)
"""
import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import SR, W, add, env_exp, highpass, lowpass, words  # noqa: E402
from make_score_monster import AH, sparkle, thump, vowel, boing  # noqa: E402
import make_score_text as T  # noqa: E402
import make_score_sword as S_  # noqa: E402
import make_score_hero as H  # noqa: E402
import make_score_hero5 as C5  # noqa: E402

rng = np.random.default_rng(77)
noise = lambda n: rng.standard_normal(n)
hash_ = S_.hash_


def transpose(semi):
    C5.LOOP = [(b + semi, f + semi, [m + semi for m in ch]) for b, f, ch in C5.LOOP]
    C5.TOP = [[(b, m + semi) for b, m in bar] for bar in C5.TOP]


def music(total):
    transpose(2)
    return C5.music(total)


# ------------------------------------------------------------------ effects
def shimmer(dur=1.6):
    """the swap: a rising glassy shimmer"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(9):
        f = 900 * 2 ** (k / 4) * (1 + 0.6 * tt / dur)
        out += np.sin(2 * np.pi * np.cumsum(f) / SR + k) * (0.5 + 0.5 * np.sin(tt * (7 + k) + k)) / (k + 2)
    out += highpass(noise(n), 6000) * 0.15
    return out * np.minimum(1, tt / 0.5) * np.minimum(1, (dur - tt) / 0.3) * 0.6


def whoosh_white(dur=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = noise(n)
    out = np.zeros(n)
    seg = int(0.04 * SR)
    for i in range(0, n, seg):
        u = i / n
        out[i: i + seg] = lowpass(x[i: i + seg], 400 + 7000 * u)[: len(out[i: i + seg])]
    return out * (tt / dur) ** 1.5 * 0.8


def paper(dur=0.35):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = highpass(noise(n), 2500) * (0.4 + 0.6 * np.abs(np.sin(tt * 60)))
    return x * np.minimum(1, tt / 0.02) * np.exp(-tt * 6) * 0.5


def board_creak():
    return T.creak(0.8) * 0.8


def typing(dur=1.0):
    out = np.zeros(int(dur * SR))
    t = 0.0
    k = 0
    while t < dur - 0.05:
        c = S_.click(1800 + 600 * hash_(k))
        i = int(t * SR)
        out[i: i + len(c)] += c[: len(out) - i] * 0.6
        t += 0.07 + 0.08 * hash_(k * 3.1)
        k += 1
    return out


def crunch():
    """a footstep in snow"""
    n = int(0.16 * SR)
    tt = np.arange(n) / SR
    x = lowpass(highpass(noise(n), 500), 4000) * (0.5 + 0.5 * (noise(n) > 0.6))
    return x * np.minimum(1, tt / 0.01) * np.exp(-tt * 22) * 0.6


def ice_crack(dur=0.9):
    n = int(dur * SR)
    out = np.zeros(n)
    for k in range(14):
        m = int(0.05 * SR)
        i = int(hash_(k * 4.7) * (n - m) * (0.3 + 0.7 * k / 14))
        tt = np.arange(m) / SR
        out[i: i + m] += (np.sin(2 * np.pi * (300 + 1400 * hash_(k)) * tt) * env_exp(m, 60) + highpass(noise(m), 2000) * env_exp(m, 80)) * 0.5
    # the deep groan of lake ice
    tt = np.arange(n) / SR
    out += np.sin(2 * np.pi * (180 * np.exp(-tt * 2) + 60) * tt) * np.exp(-tt * 3) * 0.4
    return out


def splash(dur=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = lowpass(noise(n), 2500) * np.exp(-tt * 5) * np.minimum(1, tt / 0.01)
    bub = sum(np.sin(2 * np.pi * (400 + 600 * hash_(k)) * tt) * np.exp(-((tt - 0.15 - 0.05 * k) * 40) ** 2) for k in range(8)) * 0.2
    return (x + bub) * 0.8


def sizzle(dur=2.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return highpass(noise(n), 3000) * (0.6 + 0.4 * np.sin(tt * 13)) * np.minimum(1, tt / 0.3) * np.minimum(1, (dur - tt) / 0.3) * 0.25


def sfx(ws, S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    w = lambda *a: W(ws, *a)
    # A: the comet hums over the city; the swap
    add(buf, S_.glow_hum(2.4, 220), S["A01"] + 0.1, 0.25)
    add(buf, sparkle(86), S["A02"] + 0.2, 0.35)
    add(buf, S_.wind(S["A05"] - S["A02"]), S["A02"], 0.12)
    add(buf, shimmer(2.2), S["A05"] + 0.1, 0.5)
    add(buf, whoosh_white(0.9), S["A06"], 0.7)
    add(buf, S_.shing(1.2), S["A06"] + 0.5, 0.35)
    add(buf, sparkle(91), S["A07"] + 0.1, 0.3)
    # B: waking as Mira: a gasp, the radio crackle, Leo's feet and bounces
    add(buf, vowel(420, 0.45, AH, breath=0.8, glide=0.4) * 0.4, S["B01"] + 0.15, 0.3)
    add(buf, S_.crackle(1.0) * 0.5, S["B06"] + 0.1, 0.25)
    for k in range(3):
        add(buf, S_.step(), S["B10"] + 0.05 + 0.13 * k, 0.3)
    for k in range(4):
        add(buf, boing(0.4, 200 + 20 * k), S["B10"] + 0.45 + 0.57 * k, 0.25)
    # C: snow steps; the comet fades; Kai wakes
    for k in range(5):
        add(buf, crunch(), S["C01"] + 0.1 + 0.34 * k, 0.35, pan=0.1)
    add(buf, S_.glow_hum(0.8, 196) * np.linspace(1, 0, int(0.8 * SR)), S["C04"], 0.3)
    add(buf, vowel(240, 0.4, AH, breath=0.9, glide=0.3) * 0.4, S["C05"] + 0.15, 0.3)
    # D: typing, a sigh, writing, the floorboard
    add(buf, typing(1.0), S["D01"] + 0.05, 0.3)
    add(buf, S_.click(1500), S["D02"] + 0.1, 0.3)
    add(buf, paper(0.5), S["D04"] + 0.1, 0.35)
    add(buf, board_creak(), S["D05"] + 0.1, 0.45)
    add(buf, paper(0.35), S["D05"] + 1.1, 0.35)
    add(buf, board_creak(), S["D05"] + 1.8, 0.35)
    # E: the comet again, the swap, the answer
    add(buf, sparkle(88), S["E01"] + 0.2, 0.3)
    add(buf, whoosh_white(0.7), S["E02"], 0.6)
    add(buf, board_creak(), S["E03"] + 0.15, 0.45)
    add(buf, paper(0.4), S["E04"] + 0.1, 0.35)
    add(buf, sparkle(84), S["E07"] + 0.3, 0.3)
    # F: writing back and forth
    add(buf, paper(0.4), S["F01"] + 0.1, 0.3)
    add(buf, paper(0.4), S["F03"] + 0.1, 0.3)
    add(buf, S_.heartbeat(), S["F05"] + 0.05, 0.4)
    # G: the door at night, wind at the lake
    add(buf, T.creak(1.0) * 0.7, S["G02"] + 0.05, 0.4)
    add(buf, S_.wind(S["G05"] - S["G03"] + 0.3), S["G03"], 0.3)
    add(buf, S_.heartbeat(), S["G05"] + 0.05, 0.45)
    # H: the crack (memory), the box, the shock
    add(buf, ice_crack(1.4) * 0.7, S["H03"] + 0.3, 0.5)
    add(buf, splash(0.8) * 0.6, S["H03"] + 1.6, 0.4)
    add(buf, S_.cloth(0.6), S["H06"] + 0.2, 0.3)
    add(buf, paper(0.4), S["H06"] + 1.0, 0.3)
    add(buf, S_.shing(1.2), S["H08"] + 0.1, 0.35)
    # J: the comet blazing, the run
    add(buf, shimmer(1.4), S["J01"] + 0.1, 0.4)
    add(buf, S_.wind(S["K01"] - S["J03"] + 2), S["J03"], 0.35)
    for k in range(int((S["K01"] - S["J04"]) / 0.17)):
        add(buf, crunch(), S["J04"] + 0.05 + 0.17 * k, 0.45, pan=0.2 * ((k % 2) * 2 - 1))
    # K: the ice
    add(buf, ice_crack(0.9), S["K04"] + 0.05, 0.85)
    add(buf, splash(1.0), S["K04"] + 0.3, 0.8)
    add(buf, vowel(520, 0.5, AH, breath=0.6, glide=0.5) * 0.5, S["K04"] + 0.12, 0.3)
    add(buf, S_.slide(1.1), S["K05"] + 0.05, 0.5)
    add(buf, splash(0.8) * 0.7, S["K07"] + 0.5, 0.6)
    # L: breathing in the snow, the white
    for k in range(3):
        add(buf, vowel(180, 0.5, AH, breath=1.0) * 0.25, S["L01"] + 0.1 + 0.8 * k, 0.3)
    add(buf, shimmer(1.6), S["L04"], 0.55)
    add(buf, whoosh_white(0.8), S["L04"] + 0.1, 0.6)
    # M: morning, pancakes
    add(buf, S_.bird(2800), S["M01"] + 0.3, 0.12)
    add(buf, sizzle(S["N01"] - S["M02"]), S["M02"], 0.35)
    add(buf, S_.shing(1.0) * 0.6, S["M06"] + 0.05, 0.3)
    # N: the note slides, the hug
    add(buf, S_.slide(0.6) * 0.6, S["N02"] + 0.2, 0.4)
    add(buf, paper(0.4), S["N03"] + 0.1, 0.35)
    add(buf, S_.cloth(0.7), S["N05"] + 0.05, 0.35)
    # P: the whisper; the comet returns; a heartbeat
    add(buf, S_.glow_hum(1.4, 98), S["P02"] + 0.05, 0.35)
    add(buf, S_.heartbeat(), S["P03"] + 0.6, 0.5)
    add(buf, S_.heartbeat(), w(30, "happens") - 0.1, 0.55)
    S_.boom(w(30, "happens") + 0.3, buf, 0.6)
    return buf[: int(total * SR)]


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    ws = words(root / "vo/c1/timings.json")
    S, total = H.shots(root / "src/planC.gen.ts")
    T.write(root / "vo/c1/music.wav", music(total), 0.85)
    T.write(root / "vo/c1/sfx.wav", sfx(ws, S, total), 0.85)
    print(f"wrote vo/c1/music.wav + sfx.wav ({total:.2f} s)")
