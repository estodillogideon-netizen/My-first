"""An original background score + sound effects for "Laugh Lift", synthesised from scratch with numpy (no samples, no
third-party music): a bouncy marimba / bass / light-drums groove that follows the story's sections, and cartoon sound
effects on the story beats (squeak, pfft, splat, splash, snap, whooshes, a creaky door, pops, a cheer chime).
Times come from vo/timings.json and src/plan.gen.ts, so the sounds stay on their words.

    python vo/make_bed.py vo/timings.json src/plan.gen.ts vo/music.wav vo/sfx.wav
"""
import json, re, sys, wave
from pathlib import Path
import numpy as np

SR = 48000
BPM = 112
BEAT = 60 / BPM
rng = np.random.default_rng(7)


def words(timings):
    d = json.loads(Path(timings).read_text(encoding="utf8"))
    return [(tr["turn"], w["w"], w["t"], w["end"]) for tr in d["turns"] for w in tr["words"]]


def W(ws, turn, word, nth=1):
    n = 0
    norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())
    for tn, w, t, e in ws:
        if tn == turn and norm(w) == norm(word):
            n += 1
            if n == nth:
                return t
    raise SystemExit(f"word not found {turn} {word}")


def env_exp(n, k):
    return np.exp(-np.arange(n) / SR * k)


def tone(f, dur, partials=((1, 1.0),), k=6.0, att=0.004):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * m * t) for m, a in partials)
    e = env_exp(n, k)
    a = int(att * SR)
    if a:
        e[:a] *= np.linspace(0, 1, a)
    return y * e


def lowpass(x, fc):
    # FFT brick-ish lowpass with a soft roll-off
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))


def highpass(x, fc):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))


def add(buf, x, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(x) <= 0:
        return
    j = min(len(buf), i + len(x))
    seg = x[: j - i] * gain
    buf[i:j, 0] += seg * np.sqrt(0.5 * (1 - pan))
    buf[i:j, 1] += seg * np.sqrt(0.5 * (1 + pan))


NOTE = lambda m: 440.0 * 2 ** ((m - 69) / 12)
# chords as MIDI roots + triad; I - V - vi - IV in C (bright), vi - IV - I - V (the sky), and IV - I - V - vi (gold)
BRIGHT = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]
SKY = [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])]
GOLD = [(41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62]), (45, [57, 60, 64])]


def marimba(f, dur=0.5):
    return tone(f, dur, ((1, 1.0), (3.93, 0.25), (9.2, 0.05)), k=7.5)


def bass(f, dur):
    return tone(f, dur, ((1, 1.0), (2, 0.25)), k=2.2, att=0.01)


def pad(fs, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for f in fs:
        for det in (-0.004, 0.004):
            for h in range(1, 6):
                y += np.sin(2 * np.pi * f * (1 + det) * h * t) / h
    e = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
    return lowpass(y * e, 1400) / (len(fs) * 6)


def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 45 + 80 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 9)


def hat():
    n = int(0.06 * SR)
    return highpass(rng.standard_normal(n), 7000) * env_exp(n, 60) * 0.5


def clap():
    n = int(0.18 * SR)
    x = highpass(lowpass(rng.standard_normal(n), 3000), 900) * env_exp(n, 22)
    return x * 0.8


def music(total, sections):
    buf = np.zeros((int(total * SR) + SR, 2))
    nbeats = int(total / BEAT) + 1
    for b in range(nbeats):
        t = b * BEAT
        sec = next((s for s in sections if s[0] <= t < s[1]), sections[-1])
        _, _, prog, drums, arp, level = sec
        bar = b // 4
        root, triad = prog[bar % 4]
        beat = b % 4
        g = level
        if beat == 0:
            add(buf, bass(NOTE(root), BEAT * 3.6), t, 0.55 * g)
            if arp == "pad":
                add(buf, pad([NOTE(m) for m in triad], BEAT * 4.1), t, 0.9 * g)
        if arp in ("bounce", "soft"):
            # eighth-note arpeggio, up and down, with a little swing
            seq = triad + [triad[1] + 12, triad[2], triad[1], triad[0] + 12, triad[2]]
            for h in range(2):
                m = seq[(beat * 2 + h) % len(seq)]
                tt = t + h * BEAT / 2 + (0.03 if h else 0)
                add(buf, marimba(NOTE(m + 12)), tt, (0.32 if arp == "bounce" else 0.18) * g, pan=0.35 if h else -0.35)
        if arp == "pad" and beat == 2:
            add(buf, marimba(NOTE(triad[2] + 12), 0.8), t, 0.12 * g, pan=0.4)
        if drums:
            if beat in (0, 2):
                add(buf, kick(), t, 0.6 * g)
            if beat in (1, 3):
                add(buf, clap(), t, 0.22 * g)
            for h in range(2):
                add(buf, hat(), t + h * BEAT / 2, (0.12 if h else 0.07) * g, pan=0.5)
    # a gentle fade out at the very end
    n = len(buf)
    f = np.ones(n)
    a = int((total - 1.6) * SR)
    f[a:] = np.linspace(1, 0, n - a)
    return buf * f[:, None]


# ------------------------------------------------------------------ sound effects
def squeak():
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    f = 1500 + 900 * np.sin(np.pi * t / 0.22)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.22) ** 0.5 * 0.6


def pfft():
    n = int(0.75 * SR)
    t = np.arange(n) / SR
    buzz = np.sign(np.sin(2 * np.pi * np.cumsum(95 + 30 * np.sin(t * 40)) / SR)) * 0.4
    noise = lowpass(rng.standard_normal(n), 900) * 0.6
    return lowpass(buzz + noise, 1200) * np.minimum(1, t / 0.03) * env_exp(n, 3.5)


def splat():
    n = int(0.45 * SR)
    x = lowpass(rng.standard_normal(n), 1800) * env_exp(n, 9)
    k = kick()
    th = np.zeros(n)
    th[: min(n, len(k))] = k[:n] * 0.8
    return x + th


def splash():
    n = int(0.6 * SR)
    return highpass(lowpass(rng.standard_normal(n), 6000), 600) * env_exp(n, 6) * 0.7


def snap():
    n = int(0.12 * SR)
    return highpass(rng.standard_normal(n), 2500) * env_exp(n, 45) * 1.2


def whoosh(dur=0.6, up=True):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    # sweep a band through the noise by mixing two filtered copies
    lo = lowpass(x, 700)
    hi = highpass(x, 2200)
    u = t / dur
    m = (u if up else 1 - u)
    y = lo * (1 - m) + hi * m
    return y * np.sin(np.pi * u) ** 1.5 * 0.7


def pop():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = 900 * np.exp(-t * 18) + 300
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 30)


def creak(dur=1.1):
    # a rusty door: a slow, rough, wavering squeak
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 320 + 140 * np.sin(2 * np.pi * 0.7 * t) + 40 * np.sin(2 * np.pi * 9 * t)
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))
    am = (np.sin(2 * np.pi * 23 * t) > 0.2).astype(float) * 0.8 + 0.2
    return lowpass(s * am, 2400) * np.sin(np.pi * t / dur) * 0.45


def whistle_down(dur=1.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 1800 - 1100 * t / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / dur) * 0.35


def chime():
    y = sum(marimba(NOTE(m), 1.2) for m in (84, 88, 91, 96))
    return y * 0.5


def chirp():
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    f = 3200 + 1500 * np.sin(np.pi * t / 0.09)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.09) * 0.3


def write(path, buf, peak=0.89):
    m = np.max(np.abs(buf)) or 1
    y = (buf / m * peak * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(y.tobytes())


def main(timings, plan, out_music, out_sfx):
    ws = words(timings)
    total = ws[-1][3] + 0.8
    shots = json.loads(re.search(r"export const SHOTS = (\[.*?\]) as const;", Path(plan).read_text(encoding="utf8"), re.S).group(1))
    ST = {s["id"]: s["t"] for s in shots}
    sections = [
        # start, end, progression, drums, arp style, level
        (0, ST["D01"], BRIGHT, True, "bounce", 1.0),
        (ST["D01"], ST["E01"], GOLD, False, "soft", 0.7),
        (ST["E01"], ST["F02"], BRIGHT, True, "bounce", 1.1),
        (ST["F02"], ST["G03"], SKY, False, "soft", 0.85),
        (ST["G03"], ST["H04"], BRIGHT, True, "bounce", 1.1),
        (ST["H04"], ST["H20"], GOLD, False, "pad", 0.9),
        (ST["H20"], total + 2, BRIGHT, True, "bounce", 1.05),
    ]
    mus = music(total, sections)
    write(out_music, mus)

    sfx = np.zeros_like(mus)
    w = lambda *a: W(ws, *a)
    # squeaks while the chicken is squeezed (2 per second, like the staging)
    t0, t1 = w(7, "rubber") + 0.1, w(8, "The") - 0.1
    k = np.ceil(t0 * 2 - 0.25)
    while (k + 0.25) / 2 < t1:
        add(sfx, squeak(), (k + 0.25) / 2, 0.55, 0.2)
        k += 1
    add(sfx, pfft(), w(10, "sat") + 0.02, 0.75)
    add(sfx, whoosh(0.45, False), w(15, "slipped"), 0.4)
    add(sfx, splat(), w(15, "face") - 0.08, 0.85)
    add(sfx, whoosh(0.7, True), w(15, "wig") - 0.1, 0.3, 0.4)
    add(sfx, splash(), w(15, "punch") + 0.2, 0.7, 0.4)
    add(sfx, snap(), w(17, "snapped."), 0.9)
    add(sfx, whoosh(1.3, True), w(19, "shot") - 0.2, 0.55)
    for i in range(5):
        add(sfx, chirp(), ST["E17"] + 0.15 + i * 0.17, 0.5, (-1) ** i * 0.5)
    add(sfx, whistle_down(1.6), w(24, "fell") - 0.05, 0.5)
    for i in range(3):
        add(sfx, chirp(), w(25, "bird") + 0.1 + i * 0.14, 0.5, 0.3)
    add(sfx, creak(1.2), w(31, "creaky,") - 0.05, 0.7)
    add(sfx, whoosh(1.0, True), ST["G07"] - 0.1, 0.6)
    add(sfx, pop(), w(34, "caught") + 0.05, 0.6)
    add(sfx, whoosh(1.2, False), ST["H15"], 0.3)
    add(sfx, splat(), w(45, "cake.") - 0.05, 0.85)
    add(sfx, chime(), w(46, "Everyone"), 0.5)
    # a soft whoosh on the cuts of the fast stretches (never under the golden talk)
    for s in shots[1:]:
        if s["t"] < ST["H04"] or s["t"] > ST["H20"]:
            add(sfx, whoosh(0.28, True), s["t"] - 0.12, 0.09, (-1) ** len(s["id"]) * 0.3)
    write(out_sfx, sfx, peak=0.7)
    print(f"wrote {out_music} and {out_sfx} ({total:.2f} s)")


if __name__ == "__main__":
    main(*sys.argv[1:5])
