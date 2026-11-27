"""Music + sound effects for "The Mask That Shows Your Enemy", synthesised from scratch (no samples, no third-party
music). Music: the curious storytime loop the user asked for (make_score_hero5.py: bright Lydian chords, tiptoeing
pizzicato, marimba, a celesta of question phrases, a quiet tick-tock, a light pad; one steady loop to the end), moved
down a semitone so this film has its own colour. Sound effects sit on their shots and words.

    python vo/make_score_mask.py      (writes vo/m1/music.wav and vo/m1/sfx.wav)
"""
import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import SR, W, add, env_exp, highpass, lowpass, words  # noqa: E402
from make_score_monster import sparkle, thump  # noqa: E402
import make_score_text as T  # noqa: E402
import make_score_sword as S_  # noqa: E402
import make_score_hero as H  # noqa: E402
import make_score_hero5 as C5  # noqa: E402
import make_score_comet as CM  # noqa: E402

rng = np.random.default_rng(91)
noise = lambda n: rng.standard_normal(n)
hash_ = S_.hash_


def music(total):
    semi = -1
    C5.LOOP = [(b + semi, f + semi, [m + semi for m in ch]) for b, f, ch in C5.LOOP]
    C5.TOP = [[(b, m + semi) for b, m in bar] for bar in C5.TOP]
    return C5.music(total)


def red_glow(dur=1.6):
    """the red sight: a low throb with a soft shimmer on top"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.sin(2 * np.pi * 55 * tt) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.2 * tt)) * 0.6
    out += np.sin(2 * np.pi * 110 * tt + np.sin(tt * 9)) * 0.25
    out += highpass(noise(n), 5000) * 0.05 * (0.5 + 0.5 * np.sin(tt * 17))
    return out * np.minimum(1, tt / 0.3) * np.minimum(1, (dur - tt) / 0.4)


def smash(dur=0.9):
    """a clay pot hitting the ground: a thud, a crack, scattering bits"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = thump(0.25, 70)[: n]
    out = np.pad(out, (0, n - len(out)))
    out += lowpass(highpass(noise(n), 900), 6000) * np.exp(-tt * 14) * 0.9
    for k in range(10):
        i = int((0.04 + 0.5 * hash_(k * 3.1) ** 1.6) * SR)
        c = S_.click(2000 + 2500 * hash_(k))
        out[i: i + len(c)] += c[: n - i] * (0.6 - 0.04 * k)
    return out


def whirr(dur):
    """bike wheels and a freewheel ticking on the hill"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = lowpass(noise(n), 900) * 0.4
    tick = (np.sin(2 * np.pi * 18 * tt) > 0.95).astype(float)
    out += highpass(tick * noise(n), 3000) * 0.3
    return out * np.minimum(1, tt / 0.2) * np.minimum(1, (dur - tt) / 0.2)


def snap():
    """a brake cable snapping: a click and a ringing twang"""
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    out = np.sin(2 * np.pi * (900 - 500 * tt) * tt) * np.exp(-tt * 9) * 0.5
    c = S_.click(3000)
    out[: len(c)] += c
    return out


def wood_crack(dur=1.2):
    n = int(dur * SR)
    out = np.zeros(n)
    for k in range(9):
        m = int(0.08 * SR)
        i = int(hash_(k * 5.3) * (n - m) * (0.2 + 0.8 * k / 9))
        tt = np.arange(m) / SR
        out[i: i + m] += (lowpass(noise(m), 2500) * env_exp(m, 40) + np.sin(2 * np.pi * (140 + 90 * hash_(k)) * tt) * env_exp(m, 30)) * 0.6
    tt = np.arange(n) / SR
    out += np.sin(2 * np.pi * (70 + 30 * np.exp(-tt * 2)) * tt) * np.exp(-tt * 2.5) * 0.35
    return out


def crash(dur=2.2):
    """the tower hitting the plaza: a deep boom, splintering wood, falling bits"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.sin(2 * np.pi * (48 + 30 * np.exp(-tt * 3)) * tt) * np.exp(-tt * 2.2) * 0.9
    out += lowpass(noise(n), 1800) * np.exp(-tt * 3.5) * 0.8
    out += wood_crack(dur)[:n] * 0.7
    for k in range(14):
        i = int((0.15 + 1.6 * hash_(k * 2.7)) * SR)
        c = S_.click(1200 + 1800 * hash_(k * 9))
        out[i: i + len(c)] += c[: n - i] * 0.35
    return out


def crowd_run(dur):
    """many feet running on packed earth"""
    out = np.zeros(int(dur * SR))
    t = 0.0
    k = 0
    while t < dur - 0.1:
        st = S_.step()
        i = int(t * SR)
        out[i: i + len(st)] += st[: len(out) - i] * (0.4 + 0.3 * hash_(k))
        t += 0.045 + 0.06 * hash_(k * 1.7)
        k += 1
    return out


def dark_shimmer(dur=2.0):
    """the mask turning black: a falling shimmer, a low swell"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(7):
        f = 1400 * 2 ** (-k / 5) * (1 - 0.45 * tt / dur)
        out += np.sin(2 * np.pi * np.cumsum(f) / SR + k) / (k + 2)
    out += np.sin(2 * np.pi * 41 * tt) * (tt / dur) * 0.7
    return out * np.minimum(1, tt / 0.3) * np.minimum(1, (dur - tt) / 0.3) * 0.6


def sfx(ws, S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    w = lambda *a: W(ws, *a)
    # A: the red school yard, the town, the mask's eyes
    add(buf, red_glow(1.2), S["A01"], 0.35)
    add(buf, S_.heartbeat(), S["A01"] + 0.1, 0.4)
    add(buf, S_.bird(2900), S["A02"] + 0.2, 0.12)
    add(buf, S_.wind(S["A04"] - S["A02"]), S["A02"], 0.08)
    add(buf, sparkle(88), S["A03"] + 0.3, 0.25)
    add(buf, red_glow(1.0), S["A05"], 0.3)
    add(buf, S_.shing(1.2), S["A06"] + 0.2, 0.35)
    add(buf, S_.glow_hum(0.9, 110), S["A06"] + 0.25, 0.3)
    # B: the birthday, the gate, the whole school red
    add(buf, sparkle(91), S["B01"] + 0.2, 0.25)
    add(buf, S_.cloth(0.6), S["B02"] + 0.1, 0.3)
    add(buf, S_.shing(1.0) * 0.6, S["B03"] + 0.3, 0.25)
    for k in range(5):
        add(buf, S_.step(), S["B04"] + 0.1 + 0.42 * k, 0.25)
    add(buf, S_.murmur(S["C04"] - S["B05"]), S["B05"], 0.12)
    add(buf, red_glow(S["C04"] - S["B05"] + 0.3), S["B05"], 0.3)
    add(buf, S_.heartbeat(), S["B05"] + 0.1, 0.45)
    add(buf, S_.heartbeat(), S["C02"] + 0.1, 0.45)
    add(buf, S_.slide(0.5) * 0.6, S["C04"] + 0.05, 0.3)
    # D: running home, Mom, the curry
    for k in range(int((S["D02"] - S["D01"]) / 0.16)):
        add(buf, S_.step(), S["D01"] + 0.05 + 0.16 * k, 0.35, pan=0.15 * ((k % 2) * 2 - 1))
    add(buf, red_glow(1.6), S["D02"], 0.4)
    add(buf, CM.sizzle(S["D04"] - S["D02"]), S["D02"], 0.15)
    add(buf, S_.slide(0.5), S["D04"] + 0.15, 0.35)
    # E, F: Haru, the roof
    add(buf, S_.heartbeat(), S["E01"] + 0.2, 0.35)
    add(buf, sparkle(86), S["E02"] + 0.05, 0.25)
    add(buf, S_.bird(3100), S["F03"] + 0.3, 0.12)
    add(buf, S_.wind(S["G01"] - S["F03"]), S["F03"], 0.12)
    # G: the flowerpot, the bike
    add(buf, T.creak(0.8) * 0.6, S["G01"] + 0.3, 0.3)
    add(buf, S_.whoosh(0.7, 900, rise=False), S["G02"] + 0.1, 0.45)
    add(buf, smash(), S["G03"], 0.8)
    add(buf, whirr(S["G06"] - S["G04"]), S["G04"], 0.3)
    add(buf, S_.wind(S["G06"] - S["G04"]), S["G04"], 0.3)
    add(buf, snap(), S["G05"] + 0.2, 0.7)
    add(buf, thump(0.3, 70), S["G06"] + 0.02, 0.7)
    add(buf, S_.cloth(0.8), S["G06"] + 0.05, 0.4)
    add(buf, red_glow(1.6), S["G08"], 0.35)
    add(buf, S_.heartbeat(), S["G08"] + 0.4, 0.4)
    # J, K, L: the night, the workshop
    add(buf, T.creak(1.0) * 0.7, S["J02"] + 0.05, 0.35)
    add(buf, sparkle(80), S["J03"] + 0.3, 0.2)
    add(buf, CM.paper(0.6), S["K02"] + 0.2, 0.3)
    add(buf, S_.shing(1.2) * 0.7, S["K04"] + 0.1, 0.25)
    add(buf, S_.heartbeat(), S["L02"] + 0.05, 0.5)
    add(buf, CM.whoosh_white(0.6), S["L03"] - 0.3, 0.35)
    # M, N: the festival, the tower
    add(buf, S_.murmur(S["N01"] - S["M01"]), S["M01"], 0.2)
    for k in range(int((S["N03"] - S["M01"]) / 0.6)):
        add(buf, S_.taiko(0.6, 58, 1.0), S["M01"] + 0.6 * k, 0.22 if k % 2 else 0.3)
    add(buf, T.creak(1.2) * 0.8, S["N02"] + 0.1, 0.4)
    add(buf, wood_crack(1.2), S["N03"] + 0.05, 0.7)
    add(buf, S_.whoosh(1.3, 500, rise=True), S["N04"], 0.5)
    # P, Q: everyone runs, the crash
    add(buf, crowd_run(S["Q02"] - S["P01"]), S["P01"], 0.35)
    add(buf, red_glow(S["Q01"] - S["P01"]), S["P01"], 0.3)
    add(buf, S_.heartbeat(), S["P05"] + 0.1, 0.5)
    add(buf, crash(), S["Q02"], 0.95)
    S_.boom(S["Q02"] + 0.05, buf, 0.6)
    # R, S: Haru
    add(buf, S_.wind(S["S05"] - S["R01"]), S["R01"], 0.15)
    add(buf, S_.cloth(0.6), S["S01"] + 0.4, 0.3)
    add(buf, S_.heartbeat(), w(23, "except") - 0.1, 0.5)
    add(buf, dark_shimmer(2.2), S["S05"], 0.6)
    S_.boom(w(24, "black") + 0.15, buf, 0.7)
    return buf[: int(total * SR)]


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    ws = words(root / "vo/m1/timings.json")
    S, total = H.shots(root / "src/planM.gen.ts")
    T.write(root / "vo/m1/music.wav", music(total), 0.85)
    T.write(root / "vo/m1/sfx.wav", sfx(ws, S, total), 0.85)
    print(f"wrote vo/m1/music.wav + sfx.wav ({total:.2f} s)")
