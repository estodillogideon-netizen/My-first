"""The second score of "The Town With No Mirrors": scary and sad until Sora sees the empty street in the mirror, then
very sad to the end. Synthesised with numpy (no samples). The same mirror theme as make_score_mirror.py, slower and
lower: a detuned music box, a lone cello, a slow piano, low drones and a heartbeat for the dread; from the empty street
on, a bare piano, a cello lament, soft strings and a hummed choir, all in A minor, ending on a single fading chord.

    python vo/make_score_mirror3.py      (writes vo/n1/music3.wav; the sound effects stay vo/n1/sfx.wav)
"""
import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import NOTE, SR, add, lowpass, pad  # noqa: E402
from make_score_monster import OO, AH, musicbox, piano  # noqa: E402
import make_score_sword as S_  # noqa: E402
import make_score_mask2 as M2  # noqa: E402
import make_score_hero as H  # noqa: E402
import make_score_hero2 as H2  # noqa: E402
import make_score_hero3 as H3  # noqa: E402
import make_score_text as T  # noqa: E402
import make_score_mirror as MR  # noqa: E402

Am, F, C, G, E7, Dm = MR.Am, MR.F, MR.C, MR.G, MR.E7, MR.Dm
Em = (40, [64, 67, 71])
THEME, ANSWER = MR.THEME, MR.ANSWER
# the lament: a falling line that sighs and comes home to A
LAMENT = [(0, 76, 1.0), (1, 74, 0.5), (1.5, 72, 0.5), (2, 71, 1.0), (3, 69, 1.0)]
LAMENT2 = [(0, 72, 1.0), (1, 71, 0.5), (1.5, 69, 0.5), (2, 68, 1.0), (3, 69, 1.0)]
phrase, drone = M2.phrase, M2.drone


def sour_box(f, d):
    """the music box, a little out of tune and wobbling, like an old one left in the fog"""
    a = musicbox(f * 0.994, max(d, 1.3))
    b = musicbox(f * 1.009, max(d, 1.3))
    return (a + 0.5 * b) / 1.5


cello = lambda f, d: H3.bowed(f, d * 0.95, 0.18, 1.2)
violin = lambda f, d: H3.bowed(f, d * 0.95, 0.25, 0.8)
slow_piano = lambda f, d: piano(f, max(d, 2.0), 0.6)


def cluster(f, dur):
    """two glassy notes a half step apart: the scary shimmer"""
    return (MR.celesta(f, dur) + MR.celesta(f * 1.0595, dur)) * 0.5


def section(buf, t0, t1, prog, style, bpm, gain=1.0):
    beat = 60 / bpm
    bar = 4 * beat
    t, i = t0, 0
    while t < t1 - 0.05:
        root, ch = prog[i % len(prog)]
        dur = min(bar, t1 - t)
        at = lambda k: t + k * beat
        ok = lambda tt: tt < t1 - 0.05
        fs = [NOTE(n) for n in ch]
        # ---------------------------------------------------------------- scary + sad
        if style == "creep":  # the rule: a deep drone, the sour music box asking, a cold shimmer
            add(buf, drone(NOTE(root - 12), dur + 0.8, 1.2), t, 0.8 * gain)
            add(buf, pad(fs, dur + 0.8), t, 0.2 * gain)
            phrase(buf, t, THEME if i % 2 == 0 else ANSWER, beat, sour_box, 0.42 * gain, t1, 0, pan=0.25)
            if ok(at(2.5)):
                add(buf, cluster(NOTE(ch[2] + 12), 2.2), at(2.5), 0.1 * gain, pan=-0.35)
        elif style == "sadhome":  # Grandma, the shop: a slow piano and a lone cello, too quiet for a home
            add(buf, pad(fs, dur + 0.8), t, 0.3 * gain)
            add(buf, drone(NOTE(root - 12), dur + 0.6), t, 0.4 * gain)
            add(buf, piano(NOTE(root), 3.4, 0.6), t, 0.32 * gain)
            for k in (0, 1, 2, 3):
                if ok(at(k)):
                    add(buf, piano(NOTE([ch[0], ch[2], ch[1], ch[2]][k] + 12), 2.0, 0.45), at(k), 0.17 * gain, pan=0.15 if k % 2 else -0.15)
            if i % 2 == 1:
                phrase(buf, t, LAMENT, beat, cello, 0.3 * gain, t1, -24, pan=-0.1)
            else:
                phrase(buf, t, THEME, beat, sour_box, 0.2 * gain, t1, 0, pan=0.3)
        elif style == "fog":  # the road into white: drone, breath, a clock
            add(buf, drone(NOTE(root - 12), dur + 0.6, 1.25), t, 0.75 * gain)
            add(buf, M2.tremolo(fs, dur + 0.4, 5), t, 0.16 * gain)
            for k in range(4):
                if ok(at(k)):
                    add(buf, MR.tick(), at(k), 0.28 * gain, pan=0.3)
            phrase(buf, t, LAMENT if i % 2 == 0 else LAMENT2, beat, cello, 0.26 * gain, t1, -24, pan=-0.1)
            if ok(at(3)):
                add(buf, cluster(NOTE(ch[1] + 24), 2.0), at(3), 0.07 * gain, pan=0.4)
        elif style == "mina":  # Mina: the flute, sad and far away, over slow piano
            add(buf, pad(fs, dur + 0.8), t, 0.28 * gain)
            add(buf, piano(NOTE(root), 3.4, 0.6), t, 0.3 * gain)
            for k in range(4):
                if ok(at(k)):
                    add(buf, piano(NOTE([ch[0], ch[1], ch[2], ch[1]][k] + 12), 1.8, 0.4), at(k), 0.15 * gain, pan=0.2)
            phrase(buf, t, LAMENT if i % 2 == 0 else LAMENT2, beat, MR.fl, 0.24 * gain, t1, 12, pan=-0.15)
        elif style == "uneasy":  # the shadows, the stones: heartbeat, a hummed choir, the box out of tune
            add(buf, drone(NOTE(root - 12), dur + 0.4, 1.25), t, 0.7 * gain)
            add(buf, S_.choir(fs, dur + 0.6, OO), t, 0.42 * gain)
            for k in (0, 2):
                if ok(at(k)):
                    add(buf, S_.heartbeat(), at(k), 0.35 * gain)
            phrase(buf, t, THEME, beat, sour_box, 0.24 * gain, t1, 0, pan=-0.2)
            if ok(at(1.5)):
                add(buf, cluster(NOTE(ch[2] + 24), 2.0), at(1.5), 0.08 * gain, pan=0.35)
        elif style == "rain":  # rain: shivering low strings, piano drops, the cello
            add(buf, M2.tremolo([NOTE(n - 12) for n in ch], dur + 0.4, 9), t, 0.3 * gain)
            add(buf, drone(NOTE(root - 12), dur + 0.4), t, 0.5 * gain)
            for k in range(5):
                if ok(at(k * 0.8)):
                    add(buf, piano(NOTE(ch[(k * 2) % 3] + 24), 1.6, 0.45), at(k * 0.8), 0.13 * gain, pan=(k % 3 - 1) * 0.3)
            phrase(buf, t, LAMENT, beat, cello, 0.24 * gain, t1, -24)
        elif style == "tension":  # the river, the shard: heartbeat, a tremolo that climbs
            add(buf, drone(NOTE(root - 12), dur + 0.4, 1.3), t, 0.78 * gain)
            add(buf, M2.tremolo(fs, dur + 0.3, 13), t, (0.22 + 0.09 * i) * gain)
            for k in (0, 1.6):
                if ok(at(k)):
                    add(buf, S_.heartbeat(), at(k), 0.5 * gain)
            if i % 2 == 1:
                phrase(buf, t, THEME, beat * 1.5, sour_box, 0.26 * gain, t1, 0, pan=0.25)
        elif style == "mirror":  # in the mirror: glass, his own face, the box slowing down
            add(buf, drone(NOTE(root - 12), dur + 0.6, 1.1), t, 0.6 * gain)
            add(buf, pad([NOTE(n + 12) for n in ch], dur + 0.6), t, 0.18 * gain)
            phrase(buf, t, THEME, beat * 1.4, sour_box, 0.34 * gain, t1, 0, pan=0.2)
        # ---------------------------------------------------------------- very sad
        elif style == "empty":  # the empty street: almost nothing, a bare piano, one long cello note
            add(buf, piano(NOTE(root - 12), 4.0, 0.5), t, 0.3 * gain)
            add(buf, cello(NOTE(ch[0] - 12), dur + 0.4), t, 0.22 * gain, pan=-0.1)
            phrase(buf, t, LAMENT if i % 2 == 0 else LAMENT2, beat, slow_piano, 0.32 * gain, t1, 0, pan=0.1)
            add(buf, H3.bowed(NOTE(ch[2] + 12), dur * 0.9, 1.2, 0.5), t, 0.1 * gain, pan=0.3)
        elif style == "ghosts":  # the town in blue, Grandma's story: a hummed choir, low strings, the cello sings
            add(buf, S_.choir(fs, dur + 0.8, OO), t, 0.55 * gain)
            add(buf, T.strings([NOTE(n - 12) for n in ch], dur + 0.8), t, 0.5 * gain)
            add(buf, piano(NOTE(root), 3.6, 0.55), t, 0.3 * gain)
            phrase(buf, t, LAMENT if i % 2 == 0 else LAMENT2, beat, cello, 0.36 * gain, t1, -12, pan=-0.1)
        elif style == "burning":  # the fire, remembered: slow and heavy, a dark choir, one low drum per bar
            add(buf, S_.choir(fs, dur + 0.8, AH), t, 0.6 * gain)
            add(buf, T.strings([NOTE(n - 12) for n in ch], dur + 0.8), t, 0.55 * gain)
            add(buf, drone(NOTE(root - 12), dur + 0.4, 1.3), t, 0.55 * gain)
            add(buf, S_.taiko(1.2, 38), t, 0.45 * gain)
            phrase(buf, t, THEME, beat * 1.3, violin, 0.26 * gain, t1, 0, pan=0.15)
        elif style == "farewell":  # every face he knew: the full lament, strings, piano, violin over cello
            add(buf, T.strings(fs, dur + 0.8), t, 0.55 * gain)
            add(buf, T.strings([NOTE(root - 12)], dur + 0.8), t, 0.4 * gain)
            add(buf, piano(NOTE(root), 3.6, 0.6), t, 0.32 * gain)
            for k in range(4):
                if ok(at(k)):
                    add(buf, piano(NOTE([ch[0], ch[1], ch[2], ch[1]][k] + 12), 1.8, 0.45), at(k), 0.14 * gain, pan=0.2 if k % 2 else -0.2)
            phrase(buf, t, LAMENT if i % 2 == 0 else LAMENT2, beat, violin, 0.34 * gain, t1, 12, pan=0.15)
            phrase(buf, t, LAMENT2 if i % 2 == 0 else LAMENT, beat, cello, 0.22 * gain, t1, -12, pan=-0.15)
        elif style == "end":  # her hand: piano alone with soft strings and the box, slowing to the last chord
            add(buf, T.strings(fs, dur + 0.8), t, 0.38 * gain)
            add(buf, S_.choir(fs, dur + 0.8, OO), t, 0.3 * gain)
            add(buf, piano(NOTE(root), 3.8, 0.55), t, 0.3 * gain)
            phrase(buf, t, THEME if i % 2 == 0 else ANSWER, beat * 1.2, slow_piano, 0.32 * gain, t1, 0, pan=0.1)
            phrase(buf, t, THEME if i % 2 == 0 else ANSWER, beat * 1.2, musicbox, 0.12 * gain, t1, 12, pan=0.3)
        t += bar
        i += 1


def music(S, total):
    buf = np.zeros((int((total + 6) * SR), 2))
    plan = [
        ("A01", "C01", [Am, F, Am, E7], "creep", 66, 1.0),
        ("C01", "D01", [Am, F, Dm, E7], "sadhome", 66, 0.95),
        ("D01", "F01", [Am, Dm, Am, E7], "fog", 66, 1.0),
        ("F01", "H01", [Am, F, Dm, E7], "sadhome", 66, 0.95),
        ("H01", "J01", [F, C, Dm, Am], "mina", 66, 0.95),
        ("J01", "L01", [Am, F, Dm, E7], "uneasy", 64, 1.0),
        ("L01", "M01", [Am, F], "rain", 64, 0.95),
        ("M01", "P01", [Am, Dm, Am, E7], "tension", 70, 1.0),
        ("P01", "P03", [Am, F], "mirror", 60, 0.95),
        ("P03", "R01", [Am, F, Dm, E7], "empty", 56, 0.95),
        ("R01", "S02", [Am, F, C, E7], "ghosts", 58, 1.0),
        ("S02", "S06", [Am, F, Dm, E7], "burning", 62, 1.0),
        ("S06", "V01", [F, C, Dm, Am, F, C, E7, Am], "farewell", 58, 1.05),
        ("V01", None, [F, Am, Dm, E7], "end", 54, 1.0),
    ]
    for a, b, prog, style, bpm, g in plan:
        section(buf, S[a], S[b] if b else total - 3.6, prog, style, bpm, g)
    add(buf, S_.taiko(1.1, 36, 1.0), S["A01"] + 0.02, 0.5)  # the hook: a deep hit
    add(buf, M2.riser(S["P01"] - S["N05"]), S["N05"], 0.22)  # lifting the shard
    add(buf, S_.taiko(1.4, 34, 1.0), S["P03"], 0.35)  # the empty street: one low, soft hit, then the grief
    # the end: A minor held by strings and the choir, the music box's last notes, falling
    end = total - 3.6
    add(buf, T.strings([NOTE(n) for n in (45, 57, 64, 69, 72)], 3.8), end, 0.5)
    add(buf, S_.choir([NOTE(n) for n in (57, 64, 69, 72)], 3.8, OO), end, 0.4)
    add(buf, piano(NOTE(45), 4.0, 0.5), end, 0.32)
    for k, m in enumerate((84, 81, 76, 69)):
        add(buf, musicbox(NOTE(m), 2.6), end + 0.2 + k * 0.55, 0.26 * (1 - 0.12 * k))
    buf = H2.reverb(buf, 2.8, 0.3)[: int(total * SR)]
    for c in range(2):
        buf[:, c] -= 0.5 * lowpass(buf[:, c], 100)
    m = buf.mean(1)
    win = int(1.5 * SR)
    rms = np.sqrt(np.convolve(m ** 2, np.ones(win) / win, mode="same") + 1e-10)
    target = np.median(rms[rms > 1e-4])
    g = np.clip((target / rms) ** 0.5, 0.6, 1.8)
    g = np.convolve(g, np.ones(win // 2) / (win // 2), mode="same")
    buf *= g[:, None]
    n = len(buf)
    fade = np.minimum(1, np.arange(n) / (0.05 * SR))[:, None] * np.minimum(1, (n - np.arange(n)) / (2.0 * SR))[:, None]
    # a breath on "I looked", and the music falling away as he sees the empty street
    gate = np.ones(n)
    for key, lo, rise in (("P01", 0.25, 0.7), ("P03", 0.15, 1.6)):
        q = int(S[key] * SR)
        gate[q - int(0.15 * SR): q] = np.linspace(1.0, lo, int(0.15 * SR))
        gate[q: q + int(rise * SR)] = np.linspace(lo, 1.0, int(rise * SR))
    return buf * fade * gate[:, None]


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    S, total = H.shots(root / "src/planN.gen.ts")
    T.write(root / "vo/n1/music3.wav", music(S, total), 0.85)
    print(f"wrote vo/n1/music3.wav ({total:.2f} s)")
