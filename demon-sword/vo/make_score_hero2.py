"""A second original score for "The Villain Card", synthesised from scratch with numpy (no samples, no third-party
music). One catchy main theme (the "Card Day" hook) runs through the whole film and changes with the story:

  Card Day        a music box plays the hook, a riser into the reveal
  Max's gold card the hook as anime pop: supersaw lead, plucks, bass, drums
  the red card    a hit, then the hook slowed down in low strings over a drone and taiko
  shunned         a lonely piano hook
  good deeds      a light bouncy pluck groove that keeps tripping
  night / gloves  piano and pad, then a snare roll as he decides
  Ellie, cookie   warm plucks and piano
  Hero Day        the pop hook again, festival bright
  the sky darkens a drone, taiko and a long riser
  the battle      fast drums, driving bass, string stabs, choir hits, the hook in a minor lead
  the drain       a slow pulse
  Noah stands     strings and choir swell, a riser
  Noah breaks it  the epic: full drums, choir, the hook on the royal-road chords
  the powers back a tender piano + strings hook
  the HERO card   a build and a drop into the anthem (the hook in major, everyone in)
  Max's red card  a broken music-box hook over a dark drone, a heartbeat

    python vo/make_score_hero2.py      (writes vo/h1/music2.wav; the sound effects stay vo/h1/sfx.wav)
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

rng = np.random.default_rng(2027)
noise = lambda n: rng.standard_normal(n)

# chords: (bass root, triad)
Am, F, C, G = (45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])
Em, Dm, E = (40, [55, 59, 64]), (38, [57, 62, 65]), (40, [56, 59, 64])
MIN = [Am, F, C, G]  # vi IV I V
ROYAL = [F, G, Em, Am]  # IV V iii vi: the anime anthem chords
DARK = [Am, F, Dm, E]

# the hook: (beat, midi, beats) per bar, over MIN
HOOK = [
    [(0, 76, 1), (1, 81, 0.5), (1.5, 83, 0.5), (2, 84, 1), (3, 83, 0.5), (3.5, 81, 0.5)],
    [(0, 81, 1.5), (1.5, 79, 0.5), (2, 77, 1), (3, 76, 1)],
    [(0, 76, 0.5), (0.5, 79, 0.5), (1, 84, 1), (2, 83, 0.5), (2.5, 84, 0.5), (3, 86, 1)],
    [(0, 88, 1.5), (1.5, 86, 0.5), (2, 83, 2)],
]
# the same hook shape on the royal-road chords (the epic and the anthem)
HOOK_R = [
    [(0, 81, 0.5), (0.5, 84, 0.5), (1, 88, 1), (2, 86, 0.5), (2.5, 84, 0.5), (3, 86, 1)],
    [(0, 86, 1), (1, 88, 0.5), (1.5, 86, 0.5), (2, 83, 1), (3, 79, 1)],
    [(0, 83, 0.5), (0.5, 84, 0.5), (1, 86, 1), (2, 88, 1), (3, 91, 1)],
    [(0, 88, 2.5), (2.5, 84, 0.5), (3, 81, 1)],
]
# over DARK: the hook bent into harmonic minor
HOOK_D = [
    [(0, 76, 1), (1, 81, 0.5), (1.5, 83, 0.5), (2, 84, 2)],
    [(0, 81, 1.5), (1.5, 79, 0.5), (2, 77, 2)],
    [(0, 74, 1), (1, 77, 1), (2, 81, 1), (3, 77, 1)],
    [(0, 76, 1.5), (1.5, 80, 0.5), (2, 83, 2)],
]


# ------------------------------------------------------------------ instruments
def supersaw(f, dur, k=1.0, cut=3800):
    n = int(dur * SR) + int(0.25 * SR)
    tt = np.arange(n) / SR
    y = np.zeros(n)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * tt) * np.minimum(1, tt / 0.3)
    for d in (-0.011, -0.005, 0.0, 0.006, 0.012):
        ph = np.cumsum(f * (1 + d) * vib) / SR
        y += 2 * (ph - np.floor(ph + 0.5))
    e = np.minimum(1, tt / 0.012) * np.where(tt < dur, 1.0, np.exp(-(tt - dur) * 14))
    return lowpass(y * e, cut) * 0.16 * k


def pluck2(f, dur=0.3):
    n = int(max(dur, 0.25) * SR)
    tt = np.arange(n) / SR
    ph = np.cumsum(np.full(n, f)) / SR
    y = 2 * (ph - np.floor(ph + 0.5))
    return lowpass(y * env_exp(n, 11) * np.minimum(1, tt / 0.002), 2400) * 0.35


def sbass(f, dur, k=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    ph = np.cumsum(np.full(n, f)) / SR
    y = 0.6 * np.sin(2 * np.pi * ph) + 0.4 * lowpass(2 * (ph - np.floor(ph + 0.5)), 700)
    e = np.minimum(1, tt / 0.006) * np.minimum(1, (dur - tt) / 0.03)
    return y * e * k


def kick2():
    n = int(0.4 * SR)
    tt = np.arange(n) / SR
    f = 48 + 110 * np.exp(-tt * 32)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 7.5)
    x[: int(0.004 * SR)] += highpass(noise(int(0.004 * SR)), 2000) * 0.5
    return x


def snare2():
    n = int(0.28 * SR)
    tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * 190 * tt) * env_exp(n, 22) * 0.6
    sn = highpass(lowpass(noise(n), 7000), 1200) * env_exp(n, 16) * 0.7
    return body + sn


def hat2(open_=False):
    n = int((0.25 if open_ else 0.05) * SR)
    return highpass(noise(n), 8000) * env_exp(n, 14 if open_ else 70) * 0.35


def crash(dur=2.2):
    n = int(dur * SR)
    return highpass(noise(n), 5000) * env_exp(n, 2.2) * 0.4


def tom(f=110):
    n = int(0.4 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(f * (1 + 0.5 * np.exp(-tt * 20))) / SR) * env_exp(n, 9) * 0.7


def riser(dur=2.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = noise(n)
    out = np.zeros(n)
    seg = int(0.05 * SR)
    for i in range(0, n, seg):  # a noise sweep: the band climbs
        u = i / n
        out[i: i + seg] = highpass(x[i: i + seg], 300 + 6000 * u * u)[: len(out[i: i + seg])]
    f = 200 * 2 ** (3 * tt / dur)
    tonal = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.2
    return (out * 0.5 + tonal) * (tt / dur) ** 2


def snare_roll(buf, t0, t1, bpm, k=1.0):
    """16ths then 32nds, crescendo"""
    beat = 60 / bpm
    t = t0
    while t < t1 - 0.01:
        u = (t - t0) / max(1e-3, t1 - t0)
        add(buf, snare2(), t, 0.25 + 0.6 * u * k, pan=0.1)
        t += beat / (4 if u < 0.6 else 8)


def reverb(x, sec=2.2, mix=0.22):
    """a stereo hall: convolution with decaying noise (different per side)"""
    n = int(sec * SR)
    tt = np.arange(n) / SR
    out = x.copy()
    for ch in range(2):
        ir = lowpass(noise(n), 5000) * np.exp(-tt * 3.0 / sec * 2.3)
        ir[: int(0.012 * SR)] = 0
        ir /= np.sqrt((ir ** 2).sum())
        L = len(x) + n
        y = np.fft.irfft(np.fft.rfft(x[:, ch], L) * np.fft.rfft(ir, L), L)[: len(x)]
        out[:, ch] = x[:, ch] + y * mix
    return out


# ------------------------------------------------------------------ the sections
def melody(sec, t0, bar, beat, hook, inst, oct_=0, gain=1.0, pan=0.0, every=1):
    for b, m, d in hook[bar % 4]:
        if every > 1 and (bar // 4) % every:
            continue
        f = NOTE(m + 12 * oct_)
        x = inst(f, d * beat)
        add(sec, x, t0 + b * beat, gain, pan)


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
        if style == "box":  # the music box hook, a soft pad
            melody(sec, tb, bi, beat, hook, lambda f, d: musicbox(f, max(0.9, d + 0.6)), oct_=0, gain=0.55)
            add(sec, T.strings(fs, bar_d + 0.6, 0.5), tb, 0.6)
            add(sec, piano(NOTE(root + 12), bar_d + 0.5, 0.4), tb, 0.5)
        elif style in ("pop", "anthem"):  # drums, bass, plucks, supersaw hook
            big = style == "anthem"
            for k in range(4):
                add(sec, kick2(), tb + k * beat, 0.9)
                add(sec, hat2(), tb + (k + 0.5) * beat, 0.5, pan=0.3)
                if k in (1, 3):
                    add(sec, snare2(), tb + k * beat, 0.7)
                    add(sec, snare2() * 0.4, tb + k * beat + 0.01, 0.3, pan=-0.3)
                for h in (0, 0.5):
                    add(sec, sbass(NOTE(root), beat * 0.45), tb + (k + h) * beat, 0.55)
            for k in range(8):  # an arpeggio
                m = tri[[0, 1, 2, 1, 0, 2, 1, 2][k]] + 12
                add(sec, pluck2(NOTE(m), beat * 0.5), tb + k * beat * 0.5, 0.35, pan=0.4 if k % 2 else -0.4)
            add(sec, T.strings(fs, bar_d + 0.5, 0.6), tb, 0.45 if not big else 0.7)
            melody(sec, tb, bi, beat, hook, lambda f, d: supersaw(f, d * 0.95), gain=0.9 if big else 0.75)
            if big:
                melody(sec, tb, bi, beat, hook, lambda f, d: supersaw(f, d * 0.95, 0.6), oct_=-1, gain=0.5)
                add(sec, S_.choir([f * 2 for f in fs], bar_d + 0.6, AH, 0.9), tb, 0.55)
            if bi % 4 == 0:
                add(sec, crash(), tb, 0.45)
        elif style == "villain":  # a drone, slow taiko, the hook low in strings
            if bi == 0:
                add(sec, S_.drone(NOTE(root - 12), L + 1.0, 1.0), 0, 0.8)
            add(sec, S_.taiko(0.9, 52, 1.0), tb, 0.8)
            add(sec, S_.taiko(0.6, 60, 0.7), tb + 2.5 * beat, 0.5)
            melody(sec, tb, bi, beat, hook, lambda f, d: T.strings([f], d + 0.5, 1.0), oct_=-2, gain=0.9)
            add(sec, T.strings([NOTE(m - 12) for m in tri], bar_d + 0.6, 0.6), tb, 0.5)
        elif style == "lonely":  # piano hook, sparse
            melody(sec, tb, bi, beat, hook, lambda f, d: piano(f, d + 1.0, 0.8), gain=0.7)
            add(sec, piano(NOTE(root), bar_d + 0.6, 0.6), tb, 0.6)
            add(sec, T.strings(fs, bar_d + 0.6, 0.4), tb, 0.35)
        elif style == "bounce":  # light plucks, a pizzicato bass, a woodblock tick
            for k in range(4):
                add(sec, bass_pizz(NOTE(root + (0 if k % 2 == 0 else 7))), tb + k * beat, 0.6)
                add(sec, hat2(), tb + (k + 0.5) * beat, 0.35)
                add(sec, tick(), tb + k * beat, 0.25, pan=0.3)
            melody(sec, tb, bi, beat, hook, lambda f, d: pluck2(f, d), gain=0.6, pan=-0.15)
        elif style == "night":  # piano + pad, softer
            melody(sec, tb, bi, beat, hook, lambda f, d: piano(f, d + 1.2, 0.6), gain=0.55, every=2)
            add(sec, T.strings(fs, bar_d + 0.6, 0.55), tb, 0.5)
            for k in (0, 2):
                add(sec, piano(NOTE(tri[k % 3]), 1.6, 0.4), tb + k * beat, 0.35)
        elif style == "warm":  # plucks + piano, light hats
            for k in range(8):
                m = tri[[0, 1, 2, 1, 0, 1, 2, 1][k]] + 12
                add(sec, pluck2(NOTE(m), beat * 0.5), tb + k * beat * 0.5, 0.35, pan=0.3 if k % 2 else -0.3)
                add(sec, hat2(), tb + k * beat * 0.5, 0.2)
            add(sec, piano(NOTE(root), bar_d, 0.6), tb, 0.6)
            melody(sec, tb, bi, beat, hook, lambda f, d: piano(f, d + 0.8, 0.7), gain=0.55)
        elif style == "storm":  # a drone, taiko build, a riser at the end
            if bi == 0:
                add(sec, S_.drone(NOTE(root - 12), L + 1.0, 1.2), 0, 0.9)
                add(sec, riser(L), 0, 0.5)
            for k in range(4):
                add(sec, S_.taiko(0.6, 55, 0.9), tb + k * beat, 0.4 + 0.5 * (tb / L))
        elif style == "battle":  # fast drums, driving bass, stabs, choir, hook lead
            for k in range(4):
                add(sec, kick2(), tb + k * beat, 0.9)
                add(sec, S_.taiko(0.5, 62, 1.0), tb + (k + 0.5) * beat, 0.45)
                if k in (1, 3):
                    add(sec, snare2(), tb + k * beat, 0.75)
                for h in (0, 0.25, 0.5, 0.75):
                    add(sec, sbass(NOTE(root), beat * 0.22), tb + (k + h) * beat, 0.5)
                add(sec, hat2(), tb + (k + 0.5) * beat, 0.4, pan=0.3)
            for o in (0, 1.5, 3):
                add(sec, S_.string_stab([NOTE(m) for m in tri], 0.25), tb + o * beat, 0.7)
            add(sec, S_.choir([NOTE(m) for m in tri], bar_d + 0.5, AH, 0.9), tb, 0.45)
            melody(sec, tb, bi, beat, hook, lambda f, d: supersaw(f, d * 0.9, 0.9, 3000), gain=0.6)
            if bi % 2 == 0:
                add(sec, crash(), tb, 0.35)
        elif style == "drain":  # a slow pulse
            if bi == 0:
                add(sec, S_.drone(NOTE(root - 12), L + 1.0, 1.0), 0, 0.8)
            for k in range(4):
                add(sec, sbass(NOTE(root - 12), beat * 0.4, 0.9), tb + k * beat, 0.6)
            add(sec, thump(0.25, 50), tb, 0.6)
        elif style == "swell":  # strings + choir rising, a riser
            if bi == 0:
                add(sec, riser(L + 0.1), 0, 0.55)
                snare_roll(sec, max(0, L - 1.2), L, bpm, 0.8)
            add(sec, T.strings([f * (1 + 0.0) for f in fs] + [NOTE(root)], bar_d + 0.6, 0.9 + 0.3 * bi), tb, 0.7)
            add(sec, S_.choir([NOTE(m + 12) for m in tri], bar_d + 0.6, OO, 0.9), tb, 0.5)
        elif style == "epic":  # full drums, choir, the hook on royal road
            for k in range(4):
                add(sec, kick2(), tb + k * beat, 0.95)
                if k in (1, 3):
                    add(sec, snare2(), tb + k * beat, 0.8)
                add(sec, S_.taiko(0.6, 55, 1.0), tb + k * beat, 0.4)
                for h in (0, 0.5):
                    add(sec, sbass(NOTE(root), beat * 0.45), tb + (k + h) * beat, 0.6)
                add(sec, hat2(), tb + (k + 0.5) * beat, 0.4)
            add(sec, S_.choir([NOTE(m + 12) for m in tri], bar_d + 0.6, AH, 1.1), tb, 0.65)
            add(sec, T.strings(fs + [NOTE(root)], bar_d + 0.6, 0.9), tb, 0.6)
            melody(sec, tb, bi, beat, hook, lambda f, d: supersaw(f, d * 0.95), gain=0.85)
            melody(sec, tb, bi, beat, hook, lambda f, d: T.strings([f], d + 0.3, 1.0), oct_=-1, gain=0.5)
            if bi % 2 == 0:
                add(sec, crash(), tb, 0.5)
        elif style == "tender":  # piano + strings hook, no drums
            melody(sec, tb, bi, beat, hook, lambda f, d: piano(f, d + 1.2, 0.8), gain=0.7)
            add(sec, T.strings(fs, bar_d + 0.6, 0.7), tb, 0.6)
            for k in range(4):
                add(sec, piano(NOTE(tri[k % 3] - 12), 1.2, 0.4), tb + k * beat, 0.3)
            add(sec, piano(NOTE(root - 12), bar_d, 0.7), tb, 0.5)
        elif style == "build":  # kick on every beat, a snare roll, a riser, into the drop
            if bi == 0:
                add(sec, riser(L), 0, 0.6)
                snare_roll(sec, max(0, L - 1.6), L, bpm, 1.0)
            for k in range(4):
                add(sec, kick2(), tb + k * beat, 0.6 + 0.3 * (tb / L))
                for h in (0, 0.5):
                    add(sec, sbass(NOTE(root), beat * 0.45), tb + (k + h) * beat, 0.5)
            for k in range(8):
                m = tri[[0, 1, 2, 1, 0, 2, 1, 2][k]] + 12
                add(sec, pluck2(NOTE(m), beat * 0.5), tb + k * beat * 0.5, 0.35, pan=0.4 if k % 2 else -0.4)
            add(sec, T.strings(fs, bar_d + 0.5, 0.7), tb, 0.5)
        elif style == "sting":  # the broken music box, a dark drone
            if bi == 0:
                add(sec, S_.drone(NOTE(45 - 24), L + 1.0, 1.2), 0, 0.9)
            for b, m, d in hook[bi % 4][:3]:
                add(sec, musicbox(NOTE(m) * (1 - 0.012 * bi), 1.2), tb + b * beat, 0.5)
    # cut the section at t1 with a short crossfade
    n = len(sec)
    tt = np.arange(n) / SR
    e = np.clip((L + 0.25 - tt) / 0.4, 0, 1)[:, None]
    add2(buf, sec * e * gain, t0)


def add2(buf, x, t):
    i = int(t * SR)
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i]


def bass_pizz(f):
    return lowpass(tone(f, 0.35, ((1, 1.0), (2, 0.4)), k=12, att=0.003), 900) * 0.8


def tick():
    n = int(0.05 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * 1700 * tt) * env_exp(n, 90) * 0.6


def music(ws, S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    plan = [
        ("A01", "B02", "box", 96, 1.3), ("B02", "C01", "pop", 128, 0.95),
        ("C01", "E01", "villain", 68, 1.0), ("E01", "F01", "lonely", 76, 0.9),
        ("F01", "G01", "bounce", 112, 1.7), ("G01", "G04", "night", 70, 1.35),
        ("G04", "H01", "build", 100, 0.85), ("H01", "J01", "warm", 96, 1.1),
        ("J01", "J04", "pop", 128, 0.95), ("J04", "K04", "storm", 90, 1.0),
        ("K04", "L01", "battle", 150, 1.0), ("L01", "M01", "drain", 100, 0.9),
        ("M01", "M03", "swell", 72, 1.0), ("M03", "N01", "epic", 132, 1.05),
        ("N01", "P03", "tender", 76, 0.95), ("P03", "P06", "build", 120, 0.95),
        ("P06", "Q01", "anthem", 128, 1.05), ("Q01", None, "sting", 62, 1.0),
    ]
    for a, b, style, bpm, g in plan:
        section(buf, S[a], S[b] if b else total - 0.1, style, bpm, g)
    # hits: the gold card, the red card, the crash, HERO, the last line
    add(buf, S_.choir([NOTE(n + 12) for n in C[1]], 2.0, AH, 1.1), S["B02"] + 0.3, 0.6)
    S_.boom(S["C02"] + 0.12, buf, 1.0)
    add(buf, crash(3.0), S["C02"] + 0.12, 0.5)
    S_.boom(W(ws, 26, "crashing") + 0.2, buf, 1.2)
    add(buf, crash(3.0), W(ws, 26, "crashing") + 0.2, 0.6)
    add(buf, S_.choir([NOTE(n + 12) for n in F[1]], 2.6, AH, 1.4), S["P06"] + 0.02, 0.9)
    S_.boom(S["P06"] + 0.02, buf, 0.8)
    S_.boom(W(ws, 34, "red.") + 0.05, buf, 1.1)
    buf = reverb(buf[: int(total * SR)])
    n = len(buf)
    fade = np.minimum(1, np.arange(n) / (0.2 * SR))[:, None] * np.minimum(1, (n - np.arange(n)) / (1.0 * SR))[:, None]
    return buf * fade


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    ws = words(root / "vo/h1/timings.json")
    S, total = shots(root / "src/planH.gen.ts")
    T.write(root / "vo/h1/music2.wav", music(ws, S, total), 0.85)
    print(f"wrote vo/h1/music2.wav ({total:.2f} s)")
