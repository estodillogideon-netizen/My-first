"""A second, cinematic score for "The Mask That Shows Your Enemy", in the family of the sword film's score (a Japanese
colour, drums, choir, a theme that follows the story) but its own sound: synthesised from scratch with numpy (no
samples, no third-party music).

Instead of the koto, a breathy bamboo flute (shakuhachi-like) carries the mask theme and a buzzy plucked shamisen
drives the rhythm; festival drums (a big drum, a tight high drum, a small bell) carry the lantern festival; a music
box plays the mask theme in the dark places; a choir and taiko lift the rescue. Key: E, with the Japanese "in" scale
(E F A B C) for the mystery and a turn to C major when the red glow turns out to be love.

    python vo/make_score_mask2.py      (writes vo/m1/music2.wav; the sound effects stay vo/m1/sfx.wav)
"""
import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import NOTE, SR, add, env_exp, highpass, lowpass, pad, tone  # noqa: E402
from make_score_monster import AH, OO, bassp, musicbox, piano  # noqa: E402
import make_score_sword as S_  # noqa: E402
import make_score_hero as H  # noqa: E402
import make_score_text as T  # noqa: E402

rng = np.random.default_rng(2024)
noise = lambda n: rng.standard_normal(n)

# ------------------------------------------------------------------ chords (root, voicing)
Em, Fm7, F, C, G, Am, D, B7 = (40, [64, 67, 71]), (41, [65, 69, 72]), (41, [65, 69, 72]), (36, [64, 67, 72]), (43, [62, 67, 71]), (45, [64, 69, 72]), (38, [62, 66, 69]), (35, [63, 66, 69])
Esus = (40, [64, 69, 71])
# the mask theme (beat offset, midi, length in beats): a fall through the "in" scale, B C B A F E ...
THEME = [(0, 71, 0.5), (0.5, 72, 0.5), (1, 71, 0.5), (1.5, 69, 0.5), (2, 65, 1.0), (3, 64, 1.0)]
# ... and its answer, climbing back up
ANSWER = [(0, 64, 0.5), (0.5, 65, 0.5), (1, 69, 0.5), (1.5, 71, 0.5), (2, 76, 1.5), (3.5, 72, 0.5)]
# the same shape in C major: the red glow is love
THEME_MAJ = [(0, 79, 0.5), (0.5, 81, 0.5), (1, 79, 0.5), (1.5, 76, 0.5), (2, 74, 1.0), (3, 72, 1.0)]
ANSWER_MAJ = [(0, 72, 0.5), (0.5, 74, 0.5), (1, 76, 0.5), (1.5, 79, 0.5), (2, 84, 1.5), (3.5, 79, 0.5)]


# ------------------------------------------------------------------ instruments
def flute(f, dur):
    """a breathy bamboo flute: a scoop up into the note, breath noise round the pitch, vibrato that grows"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    scoop = 1 - 0.035 * np.exp(-tt * 14)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * tt) * np.minimum(1, tt / 0.6)
    ph = 2 * np.pi * np.cumsum(f * scoop * vib) / SR
    y = np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
    X = np.fft.rfft(noise(n))
    fr = np.fft.rfftfreq(n, 1 / SR)
    X *= np.exp(-((fr - f) / (f * 0.25)) ** 2) + 0.25 * np.exp(-((fr - 2 * f) / (f * 0.4)) ** 2)
    br = np.fft.irfft(X, n)
    br /= np.abs(br).max() + 1e-9
    chiff = highpass(noise(n), 2500) * np.exp(-tt * 40) * 0.25
    e = np.minimum(1, tt / 0.07) * np.minimum(1, (dur - tt) / 0.12).clip(0) * (1 - 0.15 * tt / max(dur, 0.1))
    return (y * 0.8 + br * 0.35 + chiff) * e * 0.75


def shamisen(f, dur=0.45):
    """a plucked three-string lute: a hard bachi click, bright harmonics that die fast, and the sawari buzz"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    ph = 2 * np.pi * f * tt
    y = sum(np.sin(h * ph + 0.3 * h) / h ** 0.9 for h in range(1, 9))
    buzz = np.tanh(3 * np.sin(ph)) * highpass(noise(n), 1500) * 0.25
    click = highpass(noise(n), 3000) * np.exp(-tt * 300) * 0.8
    e = env_exp(n, 9) * np.minimum(1, tt / 0.002)
    return lowpass((y * 0.5 + buzz) * e + click, 7000) * 0.6


def shime(k=1.0):
    """a small tight high drum: a crack and a short ring"""
    n = int(0.18 * SR)
    tt = np.arange(n) / SR
    y = np.sin(2 * np.pi * (380 + 120 * np.exp(-tt * 60)) * tt) * np.exp(-tt * 28) + highpass(noise(n), 1800) * np.exp(-tt * 70) * 0.7
    return y * 0.5 * k


def bell(k=1.0):
    """a small hand bell struck with a metal beater (the festival's chan-chiki)"""
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * 1650 * r * tt) * a for r, a in ((1, 1.0), (2.76, 0.45), (5.4, 0.2)))
    return (y * np.exp(-tt * 14) + highpass(noise(n), 5000) * np.exp(-tt * 120) * 0.4) * 0.22 * k


def drone(f, dur, k=1.0):
    return S_.drone(f, dur, k) * 0.55


def odaiko(k=1.0):
    return S_.taiko(0.8, 48, 1.0) * k


def tremolo(fs, dur, rate=12.0):
    """strings shivering on a chord (the tension under the reveal)"""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    y = np.zeros(n)
    for f in fs:
        for det in (-0.004, 0.0, 0.005):
            ph = 2 * np.pi * f * (1 + det) * tt
            y += sum(np.sin(h * ph) / h for h in range(1, 6))
    am = 0.55 + 0.45 * np.abs(np.sin(np.pi * rate * tt))
    e = np.minimum(1, tt / 0.3) * np.minimum(1, (dur - tt) / 0.3)
    return lowpass(y * am * e, 2800) / (len(fs) * 3)


def riser(dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = 200 * 2 ** (3 * tt / dur)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + highpass(noise(n), 1500) * 0.4
    return y * (tt / dur) ** 2


def phrase(buf, t0, notes, beat, inst, gain, t1, shift=0, pan=0.15):
    for b, m, ln in notes:
        t = t0 + b * beat
        if t < t1 - 0.05:
            add(buf, inst(NOTE(m + shift), min(ln * beat, t1 - t) + 0.25), t, gain, pan=pan)


fl = lambda f, d: flute(f, d)
mb = lambda f, d: musicbox(f, max(d, 1.0))
pn = lambda f, d: piano(f, max(d, 1.2), 0.75)


# ------------------------------------------------------------------ the sections
def section(buf, t0, t1, prog, style, bpm, gain=1.0):
    beat = 60 / bpm
    bar = 4 * beat
    t, i = t0, 0
    while t < t1 - 0.05:
        root, ch = prog[i % len(prog)]
        dur = min(bar, t1 - t)
        at = lambda k: t + k * beat
        ok = lambda tt: tt < t1 - 0.05
        if style == "mystery":  # the hook: a low drone, the shamisen ticking, the flute stating the theme
            add(buf, drone(NOTE(root - 12), dur + 0.6), t, 0.7 * gain)
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.22 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    m = [root + 24, root + 31, root + 36, root + 25][k % 4]
                    add(buf, shamisen(NOTE(m), 0.35), at(k / 2), (0.3 if k % 2 == 0 else 0.18) * gain, pan=-0.25)
            for k in (1, 3):
                if ok(at(k)):
                    add(buf, shime(0.7), at(k), 0.25 * gain, pan=0.2)
            if ok(at(0)):
                add(buf, odaiko(0.8), at(0), 0.45 * gain)
            phrase(buf, t, THEME if i % 2 == 0 else ANSWER, beat, fl, 0.32 * gain, t1)
        elif style == "red":  # the school glows: the same, with a pulse bass and string hits
            add(buf, drone(NOTE(root - 12), dur + 0.6, 1.1), t, 0.75 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    add(buf, bassp(NOTE(root), 0.28), at(k / 2), 0.4 * gain)
                    m = [root + 24, root + 31, root + 36, root + 31][k % 4]
                    add(buf, shamisen(NOTE(m), 0.3), at(k / 2), (0.28 if k % 2 == 0 else 0.16) * gain, pan=-0.25)
            for k in (0, 2.5):
                if ok(at(k)):
                    add(buf, S_.string_stab([NOTE(n) for n in ch], 0.3), at(k), 0.42 * gain, pan=0.2)
            for k in (0, 2):
                if ok(at(k)):
                    add(buf, odaiko(), at(k), 0.55 * gain)
            for k in (1, 3):
                if ok(at(k)):
                    add(buf, shime(), at(k), 0.3 * gain)
            if i % 2 == 1:
                phrase(buf, t, THEME, beat, fl, 0.3 * gain, t1)
        elif style == "run":  # running home: shamisen in sixteenths, drums driving
            add(buf, drone(NOTE(root - 12), dur + 0.4), t, 0.5 * gain)
            for k in range(16):
                if ok(at(k / 4)):
                    m = [root + 24, root + 24, root + 31, root + 24, root + 36, root + 24, root + 31, root + 25][k % 8]
                    add(buf, shamisen(NOTE(m), 0.22), at(k / 4), (0.3 if k % 4 == 0 else 0.17) * gain, pan=-0.2)
            for k in range(8):
                if ok(at(k / 2)):
                    add(buf, S_.taiko(0.45, 56 + 10 * (k % 2)), at(k / 2), (0.6 if k % 2 == 0 else 0.35) * gain)
                    add(buf, bassp(NOTE(root), 0.22), at(k / 2), 0.35 * gain)
            phrase(buf, t, THEME, beat / 2, fl, 0.26 * gain, t1, 12)
        elif style == "friend":  # Haru and the roof: light, warm, curious (C, G, Am, Em); bell and shamisen arpeggios
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.32 * gain)
            add(buf, piano(NOTE(root), 2.4, 0.6), t, 0.3 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    m = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2], ch[1], ch[0] + 12, ch[1]][k]
                    add(buf, shamisen(NOTE(m), 0.4), at(k / 2), (0.22 if k % 2 == 0 else 0.14) * gain, pan=-0.2 if k % 2 else 0.2)
            for k in (1, 3):
                if ok(at(k)):
                    add(buf, shime(0.5), at(k), 0.18 * gain)
            if ok(at(3.5)):
                add(buf, bell(0.6), at(3.5), 0.4 * gain, pan=0.3)
            mel = [(0, ch[2] + 12, 1), (1, ch[1] + 12, 0.5), (1.5, ch[2] + 12, 0.5), (2, ch[0] + 24, 1.5)] if i % 2 == 0 else [(0, ch[1] + 12, 1), (1, ch[0] + 12, 1), (2, ch[1] + 12, 2)]
            phrase(buf, t, mel, beat, fl, 0.28 * gain, t1)
        elif style == "danger":  # the accidents: E and F rocking, strings in sixteenths, big drums
            add(buf, drone(NOTE(root - 12), dur + 0.4, 1.2), t, 0.65 * gain)
            for k in range(16):
                if ok(at(k / 4)):
                    add(buf, S_.string_stab([NOTE(n) for n in ch], 0.16), at(k / 4), (0.48 if k % 4 == 0 else 0.26) * gain, pan=0.25 * ((k % 2) * 2 - 1))
            for k in range(8):
                if ok(at(k / 2)):
                    add(buf, S_.taiko(0.5, 50 + 12 * (k % 2)), at(k / 2), (0.75 if k % 2 == 0 else 0.45) * gain)
                    add(buf, bassp(NOTE(root), 0.2), at(k / 2), 0.38 * gain)
            if i % 2 == 0:
                phrase(buf, t, THEME, beat / 2, fl, 0.28 * gain, t1, 12)
            else:
                for k in range(4):
                    if ok(at(k)):
                        add(buf, shamisen(NOTE(root + 36 + (1 if k == 3 else 0)), 0.3), at(k), 0.3 * gain, pan=-0.3)
        elif style == "whisper":  # "you can only trust me": a drone and the music box, nothing else
            add(buf, drone(NOTE(root - 12), dur + 0.6), t, 0.65 * gain)
            add(buf, tremolo([NOTE(n - 12) for n in ch], dur + 0.4, 9), t, 0.22 * gain)
            phrase(buf, t, THEME, beat, mb, 0.4 * gain, t1, 12, pan=0.25)
        elif style == "workshop":  # the masks on the walls: music box, flute phrases, a soft ticking drum
            add(buf, pad([NOTE(n) for n in ch], dur + 0.8), t, 0.3 * gain)
            add(buf, drone(NOTE(root - 12), dur + 0.6), t, 0.45 * gain)
            for k in range(4):
                if ok(at(k)):
                    add(buf, shime(0.4), at(k), 0.14 * gain, pan=0.3)
                    add(buf, bassp(NOTE(root), 0.4), at(k), 0.25 * gain)
            if i % 2 == 0:
                phrase(buf, t, THEME, beat, mb, 0.35 * gain, t1, 12, pan=0.25)
            else:
                phrase(buf, t, ANSWER, beat, fl, 0.26 * gain, t1, 0, pan=-0.15)
        elif style == "heart":  # red is the colour of the heart: the theme in C major, choir, warm and lifting
            add(buf, pad([NOTE(n) for n in ch], dur + 0.8), t, 0.45 * gain)
            add(buf, S_.choir([NOTE(n) for n in ch], dur + 0.6, OO), t, 0.7 * gain)
            add(buf, piano(NOTE(root), 3.0, 0.8), t, 0.38 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    m = [ch[0], ch[1], ch[2], ch[1]][k % 4] + 12
                    add(buf, piano(NOTE(m), 1.2, 0.5), at(k / 2), 0.16 * gain, pan=0.2 if k % 2 else -0.2)
            phrase(buf, t, THEME_MAJ if i % 2 == 0 else ANSWER_MAJ, beat, fl, 0.3 * gain, t1, -12)
        elif style == "suspect":  # the ones who don't glow: a ticking pulse, low strings, the theme down low
            add(buf, drone(NOTE(root - 12), dur + 0.4, 1.1), t, 0.6 * gain)
            add(buf, tremolo([NOTE(n) for n in ch], dur + 0.4, 14), t, 0.3 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    add(buf, bassp(NOTE(root), 0.2), at(k / 2), 0.4 * gain)
                    add(buf, shamisen(NOTE(root + 36), 0.2), at(k / 2), (0.2 if k % 2 == 0 else 0.1) * gain, pan=-0.3)
            if ok(at(0)):
                add(buf, odaiko(), at(0), 0.5 * gain)
            phrase(buf, t, THEME, beat, pn, 0.34 * gain, t1, 0, pan=0.1)
        elif style == "matsuri":  # the lantern festival: big drum, tight drum, bell, shamisen riff, flute on top
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.25 * gain)
            for k in range(4):
                if ok(at(k)):
                    add(buf, odaiko(1.0 if k % 2 == 0 else 0.7), at(k), 0.5 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    add(buf, shime(1.0 if k % 2 else 0.6), at(k / 2 + 0.25) if k % 2 else at(k / 2), 0.26 * gain, pan=0.25)
                    add(buf, bassp(NOTE(root), 0.25), at(k / 2), 0.3 * gain)
            for k in (0, 0.75, 1.5, 2, 2.75, 3.5):
                if ok(at(k)):
                    add(buf, bell(), at(k), 0.35 * gain, pan=-0.35)
            for k in range(8):
                if ok(at(k / 2)):
                    m = [ch[0] + 12, ch[2] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 12, ch[0] + 12][k]
                    add(buf, shamisen(NOTE(m), 0.3), at(k / 2), (0.26 if k % 2 == 0 else 0.16) * gain, pan=0.15)
            phrase(buf, t, THEME if i % 2 == 0 else ANSWER, beat, fl, 0.3 * gain, t1, 12, pan=-0.1)
        elif style == "fall":  # the ropes are cut: strings shiver and climb, the drums drop out
            add(buf, drone(NOTE(root - 12), dur + 0.4, 1.3), t, 0.8 * gain)
            add(buf, tremolo([NOTE(n) for n in ch], dur + 0.3, 16), t, 0.45 * gain)
            for k in range(16):
                if ok(at(k / 4)):
                    add(buf, shamisen(NOTE(root + 36 + (k // 4)), 0.15), at(k / 4), (0.16 + 0.012 * k) * gain, pan=-0.2)
        elif style == "heroes":  # everyone runs to save him: C G Am F, choir, taiko, strings, the theme in major
            add(buf, pad([NOTE(n) for n in ch], dur + 0.6), t, 0.45 * gain)
            add(buf, S_.choir([NOTE(n) for n in ch], dur + 0.6, AH), t, 0.95 * gain)
            add(buf, drone(NOTE(root - 12), dur + 0.4), t, 0.45 * gain)
            for k in range(8):
                if ok(at(k / 2)):
                    add(buf, S_.taiko(0.5, 50 + 14 * (k % 2)), at(k / 2), (0.8 if k % 2 == 0 else 0.45) * gain)
                    add(buf, S_.string_stab([NOTE(n) for n in ch], 0.2), at(k / 2), 0.32 * gain, pan=0.2 * ((k % 2) * 2 - 1))
                    add(buf, bassp(NOTE(root), 0.25), at(k / 2), 0.35 * gain)
            phrase(buf, t, THEME_MAJ if i % 2 == 0 else ANSWER_MAJ, beat, fl, 0.36 * gain, t1, -12)
        elif style == "reveal":  # Haru: a drone, a soft choir, the music box theme, a low piano; eerie, not sad
            add(buf, drone(NOTE(root - 12), dur + 0.6), t, 0.6 * gain)
            add(buf, S_.choir([NOTE(n) for n in ch], dur + 0.6, OO), t, 0.5 * gain)
            add(buf, piano(NOTE(root - 12), 3.0, 0.7), t, 0.35 * gain)
            for k in (1, 3):
                if ok(at(k)):
                    add(buf, shime(0.35), at(k), 0.12 * gain, pan=0.3)
            phrase(buf, t, THEME if i % 2 == 0 else ANSWER, beat, mb, 0.36 * gain, t1, 12, pan=0.25)
        t += bar
        i += 1


def music(S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    plan = [
        ("A01", "B01", [Em, Em, F, Em], "mystery", 92, 1.0),
        ("B01", "D01", [Em, F, Em, B7], "red", 92, 1.0),
        ("D01", "E01", [Em, F], "run", 104, 0.95),
        ("E01", "G01", [C, G, Am, Em], "friend", 96, 0.9),
        ("G01", "H01", [Em, F, Em, F], "danger", 120, 1.0),
        ("H01", "J01", [Em, F], "whisper", 80, 0.9),
        ("J01", "K04", [Am, F, Em, Esus], "workshop", 84, 0.9),
        ("K04", "L01", [C, G, Am, F], "heart", 84, 0.95),
        ("L01", "M01", [Em, F, Em, B7], "suspect", 100, 0.95),
        ("M01", "N02", [Em, D, C, B7], "matsuri", 100, 1.0),
        ("N02", "P01", [F, F, Em, Em], "fall", 100, 1.05),
        ("P01", "Q02", [C, G, Am, F], "heroes", 120, 1.05),
        ("R01", "S05", [Em, C, Am, B7], "reveal", 76, 0.9),
    ]
    for a, b, prog, style, bpm, g in plan:
        section(buf, S[a], S[b], prog, style, bpm, g)
    # the hook opens on a big drum and the flute alone
    add(buf, odaiko(1.2), S["A01"] + 0.02, 0.6)
    # the whole school glows: a choir swell under the reveal
    add(buf, S_.choir([NOTE(n) for n in Em[1]], 3.2, AH), S["B05"], 0.6)
    # the tower: a riser into the fall, then the rescue
    add(buf, riser(S["P01"] - S["N03"]), S["N03"], 0.35)
    # the crash: the music stops for a breath, a boom; then the hush before Haru
    add(buf, S_.choir([NOTE(n) for n in C[1]], 1.6, AH), S["Q02"] - 0.6, 0.5)
    add(buf, pad([NOTE(n) for n in Em[1]], S["R01"] - S["Q02"] + 1.0), S["Q02"] + 0.4, 0.3)
    # the mask turns black: a low F to E, a dark choir, the flute's last falling notes, a big drum
    end = total - 0.2
    add(buf, drone(NOTE(29), end - S["S05"] + 0.5, 1.4), S["S05"], 0.9)
    add(buf, S_.choir([NOTE(n) for n in (52, 59, 64, 65)], end - S["S05"], OO), S["S05"], 0.7)
    add(buf, odaiko(1.4), S["S05"] + 0.05, 0.7)
    add(buf, tremolo([NOTE(n) for n in (52, 53, 59)], end - S["S05"], 18), S["S05"], 0.35)
    for k, m in enumerate((71, 69, 65, 64)):
        add(buf, flute(NOTE(m), 0.9 if k < 3 else 2.0), S["S06"] - 0.8 + k * 0.4, 0.3)
    buf = buf[: int(total * SR)]
    # less rumble: cut below ~110 Hz by about 8 dB, so the flute and shamisen read under the voice
    for c in range(2):
        buf[:, c] -= 0.6 * lowpass(buf[:, c], 110)
    # a slow leveller: quiet sections up, loud ones down (2:1 toward the median level over 1.5 s windows)
    m = buf.mean(1)
    win = int(1.5 * SR)
    pw = np.convolve(m ** 2, np.ones(win) / win, mode="same")
    rms = np.sqrt(pw + 1e-10)
    target = np.median(rms[rms > 1e-4])
    g = np.clip((target / rms) ** 0.5, 0.6, 2.2)
    g = np.convolve(g, np.ones(win // 2) / (win // 2), mode="same")
    buf *= g[:, None]
    n = len(buf)
    fade = np.minimum(1, np.arange(n) / (0.05 * SR))[:, None] * np.minimum(1, (n - np.arange(n)) / (1.2 * SR))[:, None]
    # the breath of silence at the crash
    q = int(S["Q02"] * SR)
    gate = np.ones(n)
    gate[q: q + int(0.5 * SR)] = np.linspace(0.0, 1.0, int(0.5 * SR)) ** 2
    gate[q - int(0.08 * SR): q] = np.linspace(1.0, 0.0, int(0.08 * SR))
    return buf * fade * gate[:, None]


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    S, total = H.shots(root / "src/planM.gen.ts")
    T.write(root / "vo/m1/music2.wav", music(S, total), 0.85)
    print(f"wrote vo/m1/music2.wav ({total:.2f} s)")
