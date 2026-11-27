"""A fourth original score for "The Villain Card", in the style the user asked for (a calm, emotional storytime bed
under nonstop narration): one slow chord loop that never changes until the end. No drums. A warm pad holds the
chords, a soft felt piano plays gentle broken chords, a round sub bass, and a few high bell notes on top, all mellow
(nothing bright) and in a hall. Our own chords and melody; written to match the feel measured from the reference
(about 76-88 BPM, F major / A minor colour with a bittersweet borrowed major chord, sustained, drumless).

    python vo/make_score_hero4.py      (writes vo/h1/music4.wav; the sound effects stay vo/h1/sfx.wav)
"""
import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import NOTE, SR, add, env_exp, lowpass, tone  # noqa: E402
import make_score_text as T  # noqa: E402
from make_score_hero import shots  # noqa: E402
from make_score_hero2 import reverb  # noqa: E402

BPM = 76
BEAT = 60 / BPM
BAR = 4 * BEAT
# one bar each: (bass, chord tones low->high)
LOOP = [
    (41, [53, 57, 60, 64]),  # Fmaj7
    (40, [52, 55, 59, 62]),  # Em7
    (38, [53, 57, 60, 64]),  # Dm9 (F A C E over D)
    (42, [50, 54, 57, 62]),  # D/F#  (the bittersweet major)
    (43, [50, 55, 59, 62]),  # G
    (45, [52, 55, 60, 64]),  # Am7
    (41, [53, 57, 60, 65]),  # F
    (36, [52, 55, 60, 62]),  # Csus2/C
]
# a slow top line, one or two notes a bar (beat, midi)
TOP = [[(0, 76)], [(0, 74), (2, 71)], [(0, 72)], [(0, 74), (2, 78)], [(0, 79)], [(0, 76), (2, 72)], [(0, 77)], [(0, 76), (2, 74)]]


def felt(f, dur=1.6, vel=1.0):
    """a soft felt piano: round, little attack, dark"""
    x = tone(f, dur, ((1, 1.0), (2, 0.42), (3, 0.18), (4.01, 0.08), (5.02, 0.04)), k=2.2, att=0.008)
    return lowpass(x, 3600) * vel


def pad(fs, dur):
    """a warm pad: soft strings + a sine bed, slow in and out"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * tt * (1 + 0.0015 * np.sin(tt * 0.9 + f))) for f in fs) / len(fs)
    e = np.minimum(1, tt / 1.2) * np.minimum(1, (dur - tt) / 1.2)
    return (T.strings(fs, dur, 0.8) * 0.6 + lowpass(y * e, 2600) * 0.35 + shimmer(fs, dur) * 0.5)


def shimmer(fs, dur):
    """an airy high layer: the chord two octaves up, soft, with a slow tremolo"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * 4 * tt + k) for k, f in enumerate(fs)) / len(fs)
    e = np.minimum(1, tt / 1.5) * np.minimum(1, (dur - tt) / 1.5) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.5 * tt))
    return y * e


def sub(f, dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    e = np.minimum(1, tt / 0.25) * np.minimum(1, (dur - tt) / 0.4)
    return (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt)) * e * 0.55


def bell(f):
    return lowpass(tone(f, 2.4, ((1, 1.0), (2.0, 0.2), (3.0, 0.15), (4.2, 0.06)), k=1.6, att=0.003), 6000) * 0.45


def music(total):
    buf = np.zeros((int((total + 4) * SR), 2))
    nbar = int(np.ceil(total / BAR)) + 1
    for bi in range(nbar):
        tb = bi * BAR
        bass, ch = LOOP[bi % 8]
        fs = [NOTE(m) for m in ch]
        add(buf, pad(fs, BAR + 1.0), max(0.0, tb - 0.2), 0.55)
        add(buf, sub(NOTE(bass), BAR + 0.1), tb, 0.6)
        # broken chords in eighths: low, up, down, a soft lilt
        order = [0, 2, 1, 3, 2, 1, 3, 2]
        for k in range(8):
            m = ch[order[k]] + (12 if k in (3, 6) else 0)
            vel = 0.55 if k % 2 == 0 else 0.4
            add(buf, felt(NOTE(m), 1.6, vel), tb + k * BEAT / 2, 0.55, pan=-0.25 if k % 2 else 0.25)
        add(buf, felt(NOTE(bass + 12), BAR + 0.5, 0.6), tb, 0.25)
        for b, m in TOP[bi % 8]:
            add(buf, bell(NOTE(m)), tb + b * BEAT, 0.45, pan=0.15)
    # a faint air layer (soft, slowly breathing)
    n = int(total * SR)
    tt = np.arange(n) / SR
    from make_bed import highpass
    rng = np.random.default_rng(404)
    for ch in range(2):
        buf[:n, ch] += highpass(rng.standard_normal(n), 5000) * 0.012 * (0.75 + 0.25 * np.sin(2 * np.pi * tt / BAR + ch))
    buf = reverb(buf[: int(total * SR)], 3.0, 0.32)
    n = len(buf)
    fade = np.minimum(1, np.arange(n) / (1.0 * SR))[:, None] * np.minimum(1, (n - np.arange(n)) / (2.0 * SR))[:, None]
    return buf * fade


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    _, total = shots(root / "src/planH.gen.ts")
    T.write(root / "vo/h1/music4.wav", music(total), 0.85)
    print(f"wrote vo/h1/music4.wav ({total:.2f} s)")
