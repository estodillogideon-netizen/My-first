"""A fifth original score for "The Villain Card": a curious, wondering storytime bed (not sad), one steady loop that
stays the same to the end, no drums. Bright Lydian colour (the raised 4th that sounds like a question), tiptoeing
pizzicato bass, a soft marimba in eighths, a celesta melody of short rising phrases that stop on a question, a quiet
tick-tock, and a light pad, in a small hall. Our own chords and melody.

    python vo/make_score_hero5.py      (writes vo/h1/music5.wav; the sound effects stay vo/h1/sfx.wav)
"""
import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import NOTE, SR, add, env_exp, lowpass, tone  # noqa: E402
import make_score_text as T  # noqa: E402
from make_score_hero import shots  # noqa: E402
from make_score_hero2 import reverb  # noqa: E402

BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT
# (bass, fifth above the bass, arpeggio notes low->high); one bar each, 8 bars
LOOP = [
    (41, 48, [53, 57, 60, 64, 71]),  # Fmaj7#11 (the B: curiosity)
    (41, 50, [55, 59, 62, 67, 71]),  # G/F
    (41, 48, [53, 57, 60, 64, 71]),  # Fmaj7#11
    (41, 50, [55, 59, 62, 67, 71]),  # G/F
    (40, 47, [52, 55, 59, 62, 67]),  # Em7
    (45, 52, [57, 60, 64, 67, 72]),  # Am7
    (38, 45, [50, 53, 57, 60, 65]),  # Dm7
    (43, 50, [55, 60, 62, 67, 71]),  # G7sus4 -> G
]
# the celesta: short rising phrases that stop on a question (beat, midi)
TOP = [
    [(0, 72), (0.5, 76), (1, 79), (1.5, 83)],
    [(2, 81), (3, 79)],
    [(0, 72), (0.5, 76), (1, 79), (1.5, 84)],
    [(1, 83), (2, 86), (3, 79)],
    [(0, 79), (0.5, 83), (1, 86)],
    [(1, 84), (2, 88)],
    [(0, 81), (0.5, 84), (1, 88), (2, 86)],
    [(0, 84), (1, 86), (2, 83), (3, 86)],
]


def pizz(f):
    """a plucked string, short and light (tiptoe)"""
    return lowpass(tone(f, 0.4, ((1, 1.0), (2, 0.5), (3, 0.22), (4, 0.08)), k=13, att=0.003), 2400) * 0.6


def marimba(f):
    return lowpass(tone(f, 0.6, ((1, 1.0), (3.93, 0.22), (9.2, 0.04)), k=8.5, att=0.002), 5000) * 0.5


def celesta(f):
    """a bell-like keyboard: a bright tine, a soft body"""
    return lowpass(tone(f, 1.6, ((1, 1.0), (2, 0.35), (3.01, 0.12), (4.1, 0.08)), k=3.0, att=0.002), 7000) * 0.45


def tick(f=2200):
    n = int(0.04 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * env_exp(n, 110) * 0.5


def soft_pad(fs, dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * tt + k) + 0.3 * np.sin(4 * np.pi * f * tt) for k, f in enumerate(fs)) / len(fs)
    e = np.minimum(1, tt / 0.8) * np.minimum(1, (dur - tt) / 0.8)
    return lowpass(y * e, 2500) * 0.5 + T.strings(fs, dur, 0.5) * 0.4


def music(total):
    buf = np.zeros((int((total + 4) * SR), 2))
    nbar = int(np.ceil(total / BAR)) + 1
    for bi in range(nbar):
        tb = bi * BAR
        bass, fifth, ch = LOOP[bi % 8]
        # the tiptoe bass: root, fifth, octave, fifth
        for b, m in ((0, bass), (1.5, fifth), (2, bass + 12), (3.5, fifth)):
            add(buf, pizz(NOTE(m)), tb + b * BEAT, 0.75 if b in (0, 2) else 0.5, pan=-0.15)
        # the marimba: eighths, up and back down
        for k, j in enumerate([0, 1, 2, 3, 4, 3, 2, 1]):
            add(buf, marimba(NOTE(ch[j])), tb + k * BEAT / 2, 0.42 if k % 2 == 0 else 0.3, pan=0.3 if k % 2 else -0.05)
        # the celesta phrase
        for b, m in TOP[bi % 8]:
            add(buf, celesta(NOTE(m)), tb + b * BEAT, 0.5, pan=0.2)
        # tick-tock, quiet
        for k in range(4):
            add(buf, tick(2400 if k % 2 == 0 else 1700), tb + k * BEAT, 0.12, pan=0.5 if k % 2 else -0.5)
        # a light pad under it (the G7sus4 bar turns to G halfway)
        pad_fs = [NOTE(m) for m in ch[:4]]
        add(buf, soft_pad(pad_fs, BAR + 0.6), tb, 0.3)
    buf = reverb(buf[: int(total * SR)], 2.0, 0.24)
    n = len(buf)
    fade = np.minimum(1, np.arange(n) / (0.6 * SR))[:, None] * np.minimum(1, (n - np.arange(n)) / (2.0 * SR))[:, None]
    return buf * fade


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    _, total = shots(root / "src/planH.gen.ts")
    T.write(root / "vo/h1/music5.wav", music(total), 0.85)
    print(f"wrote vo/h1/music5.wav ({total:.2f} s)")
