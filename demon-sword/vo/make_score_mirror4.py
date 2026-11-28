"""A third score for "The Town With No Mirrors": slow, dreamy, reverb-drenched guitar pop (an original piece in that
general style, no melody or recording borrowed). A clean electric guitar with chorus picks slow arpeggios inside a huge
reverb, a soft bass, brushed half-time drums, a hazy pad and a slow lead guitar line. It drifts through the town,
thins out to a few notes in the mirror, falls silent at the empty street, then comes back sadder (A minor), swells for
"every face I ever knew" and ends on the guitar alone.

    python vo/make_score_mirror4.py      (writes vo/n1/music4.wav; the sound effects stay vo/n1/sfx.wav)
"""
import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import NOTE, SR, add, highpass, lowpass, pad  # noqa: E402
import make_score_hero as H  # noqa: E402
import make_score_hero2 as H2  # noqa: E402
import make_score_text as T  # noqa: E402

rng = np.random.default_rng(1717)
BPM = 68
BEAT = 60 / BPM
BAR = 4 * BEAT

# chords: (bass root, guitar voicing)
Fmaj7 = (41, [53, 57, 60, 64])
Em7 = (40, [52, 55, 59, 62])
Am7 = (45, [57, 60, 64, 67])
Cmaj7 = (48, [55, 59, 60, 64])
G6 = (43, [55, 59, 62, 64])
Dm9 = (38, [53, 57, 60, 64])
Asus = (45, [57, 59, 64, 69])

DREAM = [Fmaj7, Em7, Am7, Cmaj7]
SAD = [Am7, Fmaj7, Cmaj7, G6]
# the lead lines (beat, midi, beats): one for the town, one for the grief
LEAD_A = [
    [(0, 76, 1.5), (1.5, 74, 0.5), (2, 72, 2)],
    [(0, 71, 2), (2, 67, 2)],
    [(0, 72, 1.5), (1.5, 71, 0.5), (2, 69, 1), (3, 67, 1)],
    [(0, 64, 3), (3, 67, 1)],
]
LEAD_B = [
    [(0, 76, 2), (2, 74, 1), (3, 72, 1)],
    [(0, 72, 1.5), (1.5, 69, 0.5), (2, 72, 2)],
    [(0, 71, 1), (1, 72, 1), (2, 74, 2)],
    [(0, 71, 3), (3, 67, 1)],
]


# ------------------------------------------------------------------ instruments
def eguitar(f, ring=3.0, bright=1.0):
    """a clean electric guitar: plucked harmonics (pick near the bridge), the high ones dying first"""
    n = int(ring * SR)
    tt = np.arange(n) / SR
    y = np.zeros(n)
    for h in range(1, 13):
        a = abs(np.sin(np.pi * h * 0.18)) / h ** 1.1
        y += a * np.sin(2 * np.pi * f * h * (1 + 0.00015 * h * h) * tt) * np.exp(-tt * (0.9 + 0.32 * h ** 1.3 / bright))
    y *= np.minimum(1, tt / 0.003) * np.minimum(1, (ring - tt) / 0.3)
    return lowpass(y, 3600 * bright) * 0.45


def lead(f, dur):
    """the lead: the same guitar held longer, a slow vibrato after the attack"""
    ring = dur + 2.5
    n = int(ring * SR)
    tt = np.arange(n) / SR
    vib = 1 + 0.0035 * np.sin(2 * np.pi * 5.0 * tt) * np.clip((tt - 0.35) / 0.5, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    y = sum(abs(np.sin(np.pi * h * 0.22)) / h ** 1.2 * np.sin(h * ph) * np.exp(-tt * (0.55 + 0.25 * h)) for h in range(1, 10))
    y *= np.minimum(1, tt / 0.004) * np.where(tt < dur + 0.4, 1.0, np.exp(-(tt - dur - 0.4) * 3))
    return lowpass(y, 3200) * 0.5


def bass(f, dur):
    n = int((dur + 0.3) * SR)
    tt = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(4 * np.pi * f * tt) + 0.08 * np.sin(6 * np.pi * f * tt)
    return y * np.minimum(1, tt / 0.02) * np.exp(-tt * 0.6) * np.minimum(1, (dur + 0.3 - tt) / 0.25) * 0.5


def kick():
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(50 + 60 * np.exp(-tt * 28)) / SR) * np.exp(-tt * 7) * 0.9


def brush_snare():
    n = int(0.5 * SR)
    tt = np.arange(n) / SR
    nz = lowpass(highpass(rng.standard_normal(n), 900), 6000)
    return (nz * np.exp(-tt * 11) * 0.45 + np.sin(2 * np.pi * 185 * tt) * np.exp(-tt * 30) * 0.25)


def hat():
    n = int(0.12 * SR)
    tt = np.arange(n) / SR
    return highpass(rng.standard_normal(n), 7000) * np.exp(-tt * 55) * 0.18


def reverse_swell(fs, dur=2.2):
    """a chord played backwards out of its own reverb: the dreamy rush before a change"""
    n = int(dur * SR)
    y = sum(eguitar(f, dur + 0.5)[:n] for f in fs)
    st = H2.reverb(np.stack([y, y], 1) * 0.3, 2.5, 1.2)
    return st.mean(1)[::-1] * np.linspace(0, 1, n) ** 1.5


def chorus(x, depth=0.003, base=0.013, rate=0.7):
    """two slowly wobbling delayed copies, one per side"""
    n = len(x)
    idx = np.arange(n)
    out = np.zeros((n, 2))
    for c, ph in ((0, 0.0), (1, np.pi)):
        d = (base + depth * np.sin(2 * np.pi * rate * idx / SR + ph)) * SR
        out[:, c] = x + 0.7 * np.interp(idx - d, idx, x, left=0)
    return out


# ------------------------------------------------------------------ the arrangement
def play(bus, t0, t1, prog, parts, lead_lines=None, arp="eighths", lead_every=1, kick_only=False):
    """bars from t0 until t1, with the parts listed (guitar, bass, drums, pad, lead)"""
    gtr, lead_b, bas, drm, pd = bus
    t, i = t0, 0
    while t < t1 - 0.2:
        root, ch = prog[i % len(prog)]
        end_bar = min(t + BAR, t1)
        ok = lambda tt: tt < t1 - 0.12
        if "guitar" in parts:
            pat = [0, 1, 2, 3, 2, 1, 2, 3] if arp == "eighths" else [0, 2, 3, 1]
            step = BEAT / 2 if arp == "eighths" else BEAT
            for k, p in enumerate(pat):
                tk = t + k * step
                if ok(tk):
                    add(gtr, eguitar(NOTE(ch[p] + 12), 3.2, 0.9 + 0.2 * (k % 2 == 0)), tk, 0.55 if k % 4 == 0 else 0.4)
        if "bass" in parts:
            add(bas, bass(NOTE(root - 12), end_bar - t), t, 0.75)
            if ok(t + 2.5 * BEAT):
                add(bas, bass(NOTE(root - 12 + 7), BEAT * 1.4), t + 2.5 * BEAT, 0.4)
        if "pad" in parts:
            add(pd, pad([NOTE(n) for n in ch], end_bar - t + 1.2), t, 0.35)
        if "drums" in parts:
            add(drm, kick(), t, 0.8)
            if ok(t + 2.5 * BEAT) and not kick_only:
                add(drm, kick(), t + 2.5 * BEAT, 0.45)
            if not kick_only:
                if ok(t + 2 * BEAT):
                    add(drm, brush_snare(), t + 2 * BEAT, 0.7)
                for k in range(8):
                    if ok(t + k * BEAT / 2):
                        add(drm, hat(), t + k * BEAT / 2, 0.55 if k % 2 == 0 else 0.3, pan=0.25)
        if lead_lines is not None and (i // len(prog)) % lead_every == 0:
            for b, m, ln in lead_lines[i % len(lead_lines)]:
                if ok(t + b * BEAT):
                    add(lead_b, lead(NOTE(m), ln * BEAT), t + b * BEAT, 0.5, pan=0.12)
        t += BAR
        i += 1


def music(S, total):
    L = int((total + 6) * SR)
    gtr, lead_b, bas, drm, pd = (np.zeros((L, 2)) for _ in range(5))
    bus = (gtr, lead_b, bas, drm, pd)
    # --- the town: dreamy, drifting
    play(bus, S["A01"], S["C01"], DREAM, {"guitar", "pad"})
    play(bus, S["C01"], S["F01"], DREAM, {"guitar", "pad", "bass"})
    play(bus, S["F01"], S["J01"], DREAM, {"guitar", "pad", "bass", "drums"}, LEAD_A, lead_every=1)
    play(bus, S["J01"], S["M01"], DREAM, {"guitar", "pad", "bass", "drums"}, kick_only=True)  # night, stones, rain
    play(bus, S["M01"], S["P01"], [Fmaj7, Em7], {"guitar", "pad"}, arp="quarters")  # the river, the shard
    # --- the mirror: just a few notes ringing
    t = S["P01"]
    for k, m in enumerate((76, 72, 71, 67, 64)):
        if t + k * BEAT * 1.5 < S["P03"] - 0.3:
            add(gtr, eguitar(NOTE(m), 4.0, 0.8), t + k * BEAT * 1.5, 0.5)
    add(gtr, reverse_swell([NOTE(n + 12) for n in Am7[1]]), S["P01"] - 2.2, 0.35)
    # --- the empty street: silence, then the guitar alone, sad
    play(bus, S["P03"] + 0.6, S["R01"], SAD, {"guitar"}, arp="quarters")
    play(bus, S["R01"], S["S02"], SAD, {"guitar", "pad", "bass"}, LEAD_B)
    play(bus, S["S02"], S["S06"], [Am7, Fmaj7, Dm9, Asus], {"guitar", "pad", "bass", "drums"}, kick_only=True)  # the fire
    add(gtr, reverse_swell([NOTE(n + 12) for n in Fmaj7[1]]), S["S06"] - 2.2, 0.4)
    play(bus, S["S06"], S["V01"], SAD, {"guitar", "pad", "bass", "drums"}, LEAD_B)  # every face he knew
    end = total - 4.0
    play(bus, S["V01"], end, [Fmaj7, Am7, Cmaj7, G6], {"guitar", "pad"}, LEAD_A, arp="quarters")
    # the last chord rings out on its own
    for k, n in enumerate(Am7[1] + [71]):
        add(gtr, eguitar(NOTE(n + 12), 5.0, 0.8), end + k * 0.09, 0.45)
    add(lead_b, lead(NOTE(76), 3.0), end + 0.6, 0.45)
    # --- the sound: chorus and a long hall on the guitars, a short room on the drums
    g = chorus(gtr.mean(1))
    g = H2.reverb(g, 4.5, 0.85)
    ld = H2.reverb(chorus(lead_b.mean(1), 0.002, 0.009, 0.5), 4.0, 0.75)
    p = H2.reverb(np.stack([lowpass(pd.mean(1), 1800)] * 2, 1), 3.0, 0.5)
    d = H2.reverb(drm, 1.2, 0.3)
    b = np.stack([lowpass(bas.mean(1), 600)] * 2, 1)
    buf = (g * 0.9 + ld * 0.7 + p * 0.35 + d * 0.55 + b * 0.6)[: int(total * SR)]
    # gentle level riding, fades, and the silence at the empty street
    m = buf.mean(1)
    win = int(2.0 * SR)
    rms = np.sqrt(np.convolve(m ** 2, np.ones(win) / win, mode="same") + 1e-10)
    target = np.median(rms[rms > 1e-4])
    gg = np.clip((target / rms) ** 0.4, 0.7, 1.6)
    gg = np.convolve(gg, np.ones(win // 2) / (win // 2), mode="same")
    buf *= gg[:, None]
    n = len(buf)
    fade = np.minimum(1, np.arange(n) / (0.6 * SR)) * np.minimum(1, (n - np.arange(n)) / (2.5 * SR))
    gate = np.ones(n)
    for key, lo, rise in (("P01", 0.3, 0.8), ("P03", 0.08, 2.4)):
        q = int(S[key] * SR)
        gate[q - int(0.25 * SR): q] = np.linspace(1.0, lo, int(0.25 * SR))
        gate[q: q + int(rise * SR)] = np.linspace(lo, 1.0, int(rise * SR))
    return buf * (fade * gate)[:, None]


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    S, total = H.shots(root / "src/planN.gen.ts")
    T.write(root / "vo/n1/music4.wav", music(S, total), 0.85)
    print(f"wrote vo/n1/music4.wav ({total:.2f} s)")
