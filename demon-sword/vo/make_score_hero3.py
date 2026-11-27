"""A third original score for "The Villain Card": the same main theme as make_score_hero2.py, but as normal film
music, with no pop drums and no electronic synths. Piano, strings (bowed and pizzicato), a warm brass section, a
glockenspiel, choir, timpani and cymbal swells, in a hall.

  Card Day        a glockenspiel plays the theme over soft strings
  Max's gold card the theme bright on strings and glockenspiel, pizzicato bass, light timpani
  the red card    a hit, then the theme slow in low strings over a drone and timpani
  shunned         a lonely piano theme
  good deeds      a light pizzicato walk with the piano theme
  night / gloves  piano and strings, then a timpani roll as he decides
  Ellie, cookie   a warm piano with pizzicato
  Hero Day        the bright orchestral theme again
  the sky darkens a drone, timpani, a cymbal swell
  the battle      a string ostinato, timpani, brass stabs, choir, the theme in the horns
  the drain       a slow low pulse
  Noah stands     strings and choir swell
  Noah breaks it  the full orchestra: the theme in brass and strings, choir, timpani
  the powers back a tender piano + strings theme
  the HERO card   a string build into the full orchestral theme with choir
  Max's red card  the broken glockenspiel theme over a dark drone

    python vo/make_score_hero3.py      (writes vo/h1/music3.wav; the sound effects stay vo/h1/sfx.wav)
"""
import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import NOTE, SR, W, add, env_exp, highpass, lowpass, tone, words  # noqa: E402
from make_score_monster import AH, OO, musicbox, piano, thump  # noqa: E402
import make_score_text as T  # noqa: E402
import make_score_sword as S_  # noqa: E402
from make_score_hero import shots  # noqa: E402
from make_score_hero2 import DARK, HOOK, HOOK_D, HOOK_R, MIN, ROYAL, C, F, add2, bass_pizz, melody, reverb  # noqa: E402

rng = np.random.default_rng(3033)
noise = lambda n: rng.standard_normal(n)


# ------------------------------------------------------------------ orchestral instruments
def brass(f, dur, k=1.0):
    """a warm horn section: a few detuned saws, darkened, a soft swell in"""
    n = int(dur * SR) + int(0.3 * SR)
    tt = np.arange(n) / SR
    y = np.zeros(n)
    vib = 1 + 0.003 * np.sin(2 * np.pi * 5 * tt) * np.minimum(1, tt / 0.4)
    for d in (-0.004, 0.0, 0.005):
        ph = np.cumsum(f * (1 + d) * vib) / SR
        y += 2 * (ph - np.floor(ph + 0.5))
    e = np.minimum(1, tt / 0.07) * np.where(tt < dur, 1.0, np.exp(-(tt - dur) * 8))
    bright = 900 + 900 * np.minimum(1, tt / 0.15)  # the bloom of a horn note
    return lowpass(y * e, 1700) * 0.22 * k * (bright / 1800)


def glock(f, dur=1.4):
    return tone(f, max(dur, 1.0), ((1, 1.0), (2.76, 0.25), (5.4, 0.08)), k=3.2, att=0.001) * 0.45


def pizz(f, dur=0.3):
    return lowpass(tone(f, 0.45, ((1, 1.0), (2, 0.45), (3, 0.2)), k=10, att=0.003), 1800) * 0.55


def timp(f=55, k=1.0, dur=1.2):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * (1 + 0.08 * np.exp(-tt * 18)) * tt) * env_exp(n, 3.5)
    x += 0.4 * np.sin(2 * np.pi * f * 1.5 * tt) * env_exp(n, 5)
    x += 0.25 * lowpass(noise(n), 500) * env_exp(n, 30)
    return x * k * 0.8


def timp_roll(buf, t0, t1, f=55, k=1.0):
    t = t0
    while t < t1:
        u = (t - t0) / max(1e-3, t1 - t0)
        add(buf, timp(f, 0.2 + 0.7 * u * k, 0.5), t, 0.6)
        t += 0.07


def cym_swell(dur=2.0):
    """a suspended cymbal rolled with soft mallets, swelling up"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return highpass(noise(n), 4000) * (tt / dur) ** 2.2 * 0.35


def cym(dur=2.6):
    n = int(dur * SR)
    return highpass(noise(n), 3500) * env_exp(n, 1.8) * 0.3


def bowed(f, dur, att=0.05, k=1.0):
    """a string section that can play short notes: a quicker bow, vibrato, a little release"""
    n = int((dur + 0.2) * SR)
    tt = np.arange(n) / SR
    y = np.zeros(n)
    for det in (-0.004, 0.0, 0.005):
        vib = 1 + 0.004 * np.sin(2 * np.pi * 5.3 * tt + f) * np.minimum(1, tt / 0.25)
        ph = 2 * np.pi * np.cumsum(f * (1 + det) * vib) / SR
        y += sum(np.sin(h * ph) / (h * 1.2) for h in range(1, 7))
    e = np.minimum(1, tt / att) * np.where(tt < dur, 1.0, np.exp(-(tt - dur) * 18))
    return lowpass(y * e, 3000) * k / 3 * 0.55


def ostinato(sec, tb, beat, tri, gain=0.5, n=8):
    """low strings in eighths, spiccato"""
    for k in range(n):
        m = tri[[0, 0, 1, 0, 2, 0, 1, 0][k % 8]] - 12
        add(sec, bowed(NOTE(m), beat * 0.32, 0.008), tb + k * beat * 0.5, gain, pan=-0.2)


# ------------------------------------------------------------------ the sections
def section(buf, t0, t1, style, bpm, gain=1.0):
    beat = 60 / bpm
    bar_d = 4 * beat
    L = t1 - t0
    sec = np.zeros((int((L + 3.0) * SR), 2))
    prog, hook = {"epic": (ROYAL, HOOK_R), "anthem": (ROYAL, HOOK_R), "villain": (DARK, HOOK_D), "battle": (DARK, HOOK_D), "storm": (DARK, HOOK_D), "sting": (DARK, HOOK_D), "drain": (DARK, HOOK_D)}.get(style, (MIN, HOOK))
    nbar = int(np.ceil(L / bar_d))
    for bi in range(nbar):
        tb = bi * bar_d
        root, tri = prog[bi % 4]
        fs = [NOTE(m) for m in tri]
        if style == "box":
            melody(sec, tb, bi, beat, hook, lambda f, d: glock(f, d + 0.8), gain=0.5)
            add(sec, T.strings(fs, bar_d + 0.6, 0.6), tb, 0.6)
            add(sec, piano(NOTE(root), bar_d + 0.5, 0.5), tb, 0.45)
        elif style == "bright":  # strings + glock theme, pizzicato bass, light timpani
            melody(sec, tb, bi, beat, hook, lambda f, d: bowed(f, d * 0.95), gain=0.75, pan=0.1)
            melody(sec, tb, bi, beat, hook, lambda f, d: glock(f, d + 0.6), gain=0.3, pan=-0.2)
            add(sec, T.strings(fs, bar_d + 0.6, 0.7), tb, 0.5)
            for k in range(4):
                add(sec, pizz(NOTE(root - 12 + (0 if k % 2 == 0 else 7))), tb + k * beat, 0.7)
                add(sec, piano(NOTE(tri[k % 3]), 0.8, 0.35), tb + (k + 0.5) * beat, 0.3, pan=0.3)
            add(sec, timp(NOTE(root - 24) * 2, 0.6), tb, 0.6)
            if bi % 4 == 0:
                add(sec, cym(), tb, 0.3)
        elif style == "villain":
            if bi == 0:
                add(sec, S_.drone(NOTE(root - 12), L + 1.0, 1.0), 0, 0.8)
            add(sec, timp(NOTE(root - 24) * 2, 1.0), tb, 0.8)
            add(sec, timp(NOTE(root - 24) * 2, 0.5), tb + 2.5 * beat, 0.5)
            melody(sec, tb, bi, beat, hook, lambda f, d: T.strings([f], d + 0.5, 1.0), oct_=-2, gain=0.9)
            add(sec, T.strings([NOTE(m - 12) for m in tri], bar_d + 0.6, 0.6), tb, 0.5)
        elif style == "lonely":
            melody(sec, tb, bi, beat, hook, lambda f, d: piano(f, d + 1.0, 0.8), gain=0.7)
            add(sec, piano(NOTE(root), bar_d + 0.6, 0.6), tb, 0.6)
            add(sec, T.strings(fs, bar_d + 0.6, 0.4), tb, 0.35)
        elif style == "bounce":  # a pizzicato walk, the theme on piano
            for k in range(4):
                add(sec, pizz(NOTE(root - 12 + (0 if k % 2 == 0 else 7))), tb + k * beat, 0.8)
                add(sec, pizz(NOTE(tri[(k + 1) % 3])), tb + (k + 0.5) * beat, 0.45, pan=0.3)
            melody(sec, tb, bi, beat, hook, lambda f, d: piano(f, d + 0.5, 0.7), gain=0.6, pan=-0.15)
        elif style == "night":
            melody(sec, tb, bi, beat, hook, lambda f, d: piano(f, d + 1.2, 0.6), gain=0.55, every=2)
            add(sec, T.strings(fs, bar_d + 0.6, 0.55), tb, 0.5)
            for k in (0, 2):
                add(sec, piano(NOTE(tri[k % 3]), 1.6, 0.4), tb + k * beat, 0.35)
        elif style == "warm":
            for k in range(8):
                m = tri[[0, 1, 2, 1, 0, 1, 2, 1][k]] + 12
                add(sec, piano(NOTE(m), 0.7, 0.4), tb + k * beat * 0.5, 0.35, pan=0.3 if k % 2 else -0.3)
            for k in (0, 2):
                add(sec, pizz(NOTE(root - 12)), tb + k * beat, 0.6)
            add(sec, T.strings(fs, bar_d + 0.6, 0.5), tb, 0.4)
            melody(sec, tb, bi, beat, hook, lambda f, d: bowed(f, d * 0.95), gain=0.5)
        elif style == "storm":
            if bi == 0:
                add(sec, S_.drone(NOTE(root - 12), L + 1.0, 1.2), 0, 0.9)
                add(sec, cym_swell(L), 0, 0.7)
            for k in range(4):
                add(sec, timp(NOTE(root - 24) * 2, 0.5 + 0.5 * (tb / L)), tb + k * beat, 0.6)
        elif style == "battle":  # string ostinato, timpani, brass stabs, choir, the theme in the horns
            ostinato(sec, tb, beat, tri, 0.55)
            for k in range(4):
                add(sec, timp(NOTE(root - 24) * 2, 0.9 if k in (0, 2) else 0.5), tb + k * beat, 0.7)
            for o in (0, 1.5, 3):
                add(sec, S_.string_stab([NOTE(m) for m in tri], 0.25), tb + o * beat, 0.6)
            add(sec, S_.choir([NOTE(m) for m in tri], bar_d + 0.5, AH, 0.9), tb, 0.45)
            melody(sec, tb, bi, beat, hook, lambda f, d: brass(f, d * 0.95), oct_=-1, gain=0.8)
            if bi % 4 == 0:
                add(sec, cym(), tb, 0.35)
        elif style == "drain":
            if bi == 0:
                add(sec, S_.drone(NOTE(root - 12), L + 1.0, 1.0), 0, 0.8)
            for k in range(4):
                add(sec, T.strings([NOTE(root - 12)], beat * 0.5, 1.0), tb + k * beat, 0.5)
            add(sec, timp(NOTE(root - 24) * 2, 0.7), tb, 0.6)
        elif style == "swell":
            if bi == 0:
                add(sec, cym_swell(L + 0.1), 0, 0.7)
                timp_roll(sec, max(0, L - 1.4), L, NOTE(33) * 2, 1.0)
            add(sec, T.strings(fs + [NOTE(root)], bar_d + 0.6, 0.9 + 0.3 * bi), tb, 0.7)
            add(sec, S_.choir([NOTE(m + 12) for m in tri], bar_d + 0.6, OO, 0.9), tb, 0.5)
        elif style == "epic":  # the full orchestra
            ostinato(sec, tb, beat, tri, 0.45)
            for k in range(4):
                add(sec, timp(NOTE(root - 24) * 2, 1.0 if k in (0, 2) else 0.55), tb + k * beat, 0.75)
            add(sec, S_.choir([NOTE(m + 12) for m in tri], bar_d + 0.6, AH, 1.1), tb, 0.6)
            add(sec, T.strings(fs + [NOTE(root)], bar_d + 0.6, 0.9), tb, 0.55)
            melody(sec, tb, bi, beat, hook, lambda f, d: brass(f, d * 0.95), oct_=-1, gain=0.85)
            melody(sec, tb, bi, beat, hook, lambda f, d: bowed(f, d * 0.95), gain=0.6)
            if bi % 2 == 0:
                add(sec, cym(), tb, 0.4)
        elif style == "tender":
            melody(sec, tb, bi, beat, hook, lambda f, d: piano(f, d + 1.2, 0.8), gain=0.7)
            add(sec, T.strings(fs, bar_d + 0.6, 0.7), tb, 0.6)
            for k in range(4):
                add(sec, piano(NOTE(tri[k % 3] - 12), 1.2, 0.4), tb + k * beat, 0.3)
            add(sec, piano(NOTE(root - 12), bar_d, 0.7), tb, 0.5)
        elif style == "build":  # strings in eighths, rising, a timpani roll and cymbal swell into the hit
            if bi == 0:
                add(sec, cym_swell(L), 0, 0.7)
                timp_roll(sec, max(0, L - 1.5), L, NOTE(33) * 2, 1.0)
            ostinato(sec, tb, beat, tri, 0.4 + 0.3 * (tb / L))
            add(sec, T.strings(fs, bar_d + 0.5, 0.7 + 0.4 * (tb / L)), tb, 0.55)
            melody(sec, tb, bi, beat, hook, lambda f, d: glock(f, d + 0.5), gain=0.25)
        elif style == "anthem":  # the theme in full: strings + brass + choir + timpani
            for k in range(4):
                add(sec, timp(NOTE(root - 24) * 2, 0.9 if k == 0 else 0.45), tb + k * beat, 0.7)
                add(sec, pizz(NOTE(root - 12)), tb + k * beat, 0.5)
            add(sec, S_.choir([NOTE(m + 12) for m in tri], bar_d + 0.6, AH, 1.2), tb, 0.65)
            add(sec, T.strings(fs + [NOTE(root)], bar_d + 0.6, 1.0), tb, 0.6)
            melody(sec, tb, bi, beat, hook, lambda f, d: bowed(f, d * 0.95), gain=0.85)
            melody(sec, tb, bi, beat, hook, lambda f, d: brass(f, d * 0.95), oct_=-1, gain=0.6)
            melody(sec, tb, bi, beat, hook, lambda f, d: glock(f, d + 0.6), gain=0.25)
            if bi % 4 == 0:
                add(sec, cym(), tb, 0.45)
        elif style == "sting":
            if bi == 0:
                add(sec, S_.drone(NOTE(45 - 24), L + 1.0, 1.2), 0, 0.9)
            for b, m, d in hook[bi % 4][:3]:
                add(sec, musicbox(NOTE(m) * (1 - 0.012 * bi), 1.2), tb + b * beat, 0.5)
    n = len(sec)
    tt = np.arange(n) / SR
    e = np.clip((L + 0.25 - tt) / 0.4, 0, 1)[:, None]
    add2(buf, sec * e * gain, t0)


def music(ws, S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    plan = [
        ("A01", "B02", "box", 92, 1.3), ("B02", "C01", "bright", 112, 1.2),
        ("C01", "E01", "villain", 68, 0.72), ("E01", "F01", "lonely", 76, 0.9),
        ("F01", "G01", "bounce", 108, 0.9), ("G01", "G04", "night", 70, 1.35),
        ("G04", "H01", "build", 96, 1.0), ("H01", "J01", "warm", 92, 1.2),
        ("J01", "J04", "bright", 116, 1.2), ("J04", "K04", "storm", 90, 1.0),
        ("K04", "L01", "battle", 144, 1.0), ("L01", "M01", "drain", 96, 1.0),
        ("M01", "M03", "swell", 72, 1.0), ("M03", "N01", "epic", 120, 1.05),
        ("N01", "P03", "tender", 76, 0.95), ("P03", "P06", "build", 112, 1.0),
        ("P06", "Q01", "anthem", 96, 1.05), ("Q01", None, "sting", 62, 1.0),
    ]
    for a, b, style, bpm, g in plan:
        section(buf, S[a], S[b] if b else total - 0.1, style, bpm, g)
    add(buf, S_.choir([NOTE(n + 12) for n in C[1]], 2.0, AH, 1.1), S["B02"] + 0.3, 0.6)
    S_.boom(S["C02"] + 0.12, buf, 1.0)
    add(buf, cym(3.0), S["C02"] + 0.12, 0.5)
    S_.boom(W(ws, 26, "crashing") + 0.2, buf, 1.2)
    add(buf, cym(3.0), W(ws, 26, "crashing") + 0.2, 0.6)
    add(buf, S_.choir([NOTE(n + 12) for n in F[1]], 2.6, AH, 1.4), S["P06"] + 0.02, 0.9)
    add(buf, timp(NOTE(29) * 2, 1.2, 2.0), S["P06"] + 0.02, 0.9)
    S_.boom(W(ws, 34, "red.") + 0.05, buf, 1.1)
    buf = reverb(buf[: int(total * SR)], 2.6, 0.28)
    n = len(buf)
    fade = np.minimum(1, np.arange(n) / (0.2 * SR))[:, None] * np.minimum(1, (n - np.arange(n)) / (1.0 * SR))[:, None]
    return buf * fade


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    ws = words(root / "vo/h1/timings.json")
    S, total = shots(root / "src/planH.gen.ts")
    T.write(root / "vo/h1/music3.wav", music(ws, S, total), 0.85)
    print(f"wrote vo/h1/music3.wav ({total:.2f} s)")
