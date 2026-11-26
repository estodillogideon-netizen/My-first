"""An original score + sound effects for "The Villain Card", synthesised from scratch with numpy (no samples, no
third-party music). It reuses the instrument and section code of the earlier scores (vo/make_score_text.py,
vo/make_score_sword.py): music box anticipation on Card Day, a bright bounce for Max's gold card, dread for the red
card, a sad piano for the shunning, a playful bounce for the failed good deeds, warmth for Ellie and the cookie, a
festival for Hero Day, a storm and taiko battle for the machine, a pulse for the drain, an epic swell with a choir when
Noah breaks it, a tender lift when the powers come back, the gold choir for HERO, and a dark sting for Max's red card.
Sound effects sit on their words.

    python vo/make_score_hero.py      (writes vo/h1/music.wav and vo/h1/sfx.wav)
"""
import json, re, sys, wave
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_bed import NOTE, SR, W, add, env_exp, highpass, lowpass, pad, words  # noqa: E402
from make_score_monster import AH, OO, piano, sparkle, thump, vowel  # noqa: E402
import make_score_text as T  # noqa: E402
import make_score_sword as S_  # noqa: E402

rng = np.random.default_rng(91)
noise = lambda n: rng.standard_normal(n)
hash_ = S_.hash_
Am, F, C, G, Dm, E = T.Am, T.F, T.C, T.G, T.Dm, T.E
A, D = T.A, T.D
Bb, Gm, A7, Eb, Bm = S_.Bb, S_.Gm, S_.A7, S_.Eb, S_.Bm
DD, GG = S_.D, S_.G


def shots(plan):
    src = Path(plan).read_text(encoding="utf8")
    sh = json.loads(re.search(r"export const SHOTS = (\[.*?\]) as const;", src).group(1))
    total = int(re.search(r"export const DURATION = (\d+);", src).group(1)) / 30
    return {s["id"]: s["t"] for s in sh}, total


def music(ws, S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    plan = [
        ("A01", "B02", [Am, F, C, G], "box", 84, 0.9, T), ("B02", "C01", [A, D, E, A], "party", 112, 0.85, T),
        ("C01", "D01", [Dm, Eb], "dread", 66, 1.0, S_), ("D01", "E01", [Am, T.Fm], "dread", 60, 0.95, T),
        ("E01", "F01", [Am, F], "theme", 72, 0.85, T), ("F01", "G01", [F, C, Dm, Bb], "play", 104, 0.8, S_),
        ("G01", "G04", [Am, F], "theme", 66, 0.85, T), ("G04", "H01", [F, C], "sparse", 72, 0.75, S_),
        ("H01", "J01", [A, D, A, E], "lake", 92, 0.85, T), ("J01", "J04", [A, D, E, A], "party", 116, 0.85, T),
        ("J04", "K04", [Dm, Eb], "storm", 90, 1.0, S_), ("K04", "L01", [Dm, Bb, Gm, A7], "battle", 140, 1.0, S_),
        ("L01", "M01", [Dm, Eb], "pulse", 110, 0.95, S_), ("M01", "M03", [Am, F, Dm, E], "swell", 64, 1.0, T),
        ("M03", "N01", [DD, GG, Bm, A], "epic", 120, 1.1, S_), ("N01", "P03", [F, C, Am, G], "tender", 70, 0.95, T),
        ("P03", "P07", [DD, GG, Bm, A], "epic", 100, 0.95, S_), ("P07", "Q01", [A, D, E, A], "end", 76, 1.0, T),
        ("Q01", None, [Dm, Eb], "dread", 62, 1.0, S_),
    ]
    for a, b, prog, style, bpm, g, mod in plan:
        mod.section(buf, S[a], S[b] if b else total - 0.2, prog, style, bpm, g)
    # gold choirs on the hero cards; booms on the villain card, the crash and the last line
    add(buf, S_.choir([NOTE(n + 12) for n in A[1]], 2.4, AH, 1.1), S["B02"] + 0.35, 0.7)
    S_.boom(S["C02"] + 0.12, buf, 0.9)
    S_.boom(W(ws, 26, "crashing") + 0.2, buf, 1.2)
    add(buf, S_.choir([NOTE(n + 12) for n in DD[1]], 3.0, AH, 1.4), S["P06"] + 0.05, 1.0)
    S_.boom(W(ws, 34, "red.") + 0.05, buf, 1.0)
    buf = buf[: int(total * SR)]
    n = len(buf)
    fade = np.minimum(1, np.arange(n) / (0.3 * SR))[:, None] * np.minimum(1, (n - np.arange(n)) / (1.2 * SR))[:, None]
    return buf * fade


# ------------------------------------------------------------------ sound effects
def laser(dur=0.5):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = 1900 * np.exp(-tt * 3) + 500 + 60 * np.sin(2 * np.pi * 40 * tt)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 4) * 0.5 + highpass(noise(n), 3000) * env_exp(n, 12) * 0.15


def ice(dur=0.6):
    n = int(dur * SR)
    out = highpass(noise(n), 4000) * env_exp(n, 6) * 0.4
    for k in range(10):
        m = int(0.05 * SR)
        i = int(hash_(k * 2.7) * (n - m))
        tt = np.arange(m) / SR
        out[i: i + m] += np.sin(2 * np.pi * (2800 + 1800 * hash_(k * 3.1)) * tt) * env_exp(m, 40) * 0.25
    return out


def servo(dur=0.9, up=True):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = (220 + 260 * tt / dur) if up else (480 - 260 * tt / dur)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.25 + np.sin(2 * np.pi * np.cumsum(f * 0.5) / SR) * 0.3
    return lowpass(x, 1800) * np.sin(np.pi * tt / dur)


def clank(k=1.0):
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * tt) * env_exp(n, d) for f, d in ((310, 9), (742, 12), (1260, 16), (2030, 22)))
    return (x * 0.35 + lowpass(noise(n), 1200) * env_exp(n, 30) * 0.5) * k


def glass(dur=0.9):
    n = int(dur * SR)
    out = highpass(noise(n), 2500) * env_exp(n, 7) * 0.5
    for k in range(16):
        m = int(0.08 * SR)
        i = int(hash_(k * 5.3) * (n - m))
        tt = np.arange(m) / SR
        out[i: i + m] += np.sin(2 * np.pi * (2200 + 3000 * hash_(k * 1.9)) * tt) * env_exp(m, 30) * 0.22
    return out


def rip(dur=0.35):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    return highpass(noise(n), 1500) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 70 * tt))) * np.minimum(1, tt / 0.02) * np.exp(-tt * 5) * 0.6


def splat():
    n = int(0.18 * SR)
    return lowpass(noise(n), 700) * env_exp(n, 25) * 0.9


def tinkle(f):
    n = int(0.3 * SR)
    tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * env_exp(n, 18) * 0.3


def cheer(dur=2.4):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = lowpass(highpass(noise(n), 300), 2400) * 0.5
    voices = sum(np.sin(2 * np.pi * (280 + 160 * hash_(k)) * (1 + 0.08 * np.sin(tt * (3 + k))) * tt) * 0.05 for k in range(8))
    return (x + voices) * np.minimum(1, tt / 0.15) * np.minimum(1, (dur - tt) / 0.6)


def zap_hum(dur=2.0, f=120):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    ff = f * (1 + 1.2 * tt / dur)
    return (np.sin(2 * np.pi * np.cumsum(ff) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(ff * 2.01) / SR)) * np.minimum(1, tt / 0.3) * np.minimum(1, (dur - tt) / 0.3) * 0.35


def sfx(ws, S, total):
    buf = np.zeros((int((total + 4) * SR), 2))
    w = lambda *a: W(ws, *a)
    # Card Day: the hall murmurs; the gold bursts sparkle; Max's whoosh; the cheer and claps
    add(buf, S_.murmur(S["C02"] - S["A01"]), S["A01"], 0.16)
    add(buf, S_.glow_hum(1.2, 196), S["A03"], 0.3)
    add(buf, sparkle(77), S["A04"] + 0.05, 0.45)
    add(buf, S_.shing(1.0), S["A04"] + 0.03, 0.25)
    add(buf, S_.growl(0.5, 60) * 0.5, S["A05"] + 0.02, 0.25)
    for k in range(4):
        add(buf, S_.step(), S["B01"] + 0.1 + 0.26 * k, 0.25)
    add(buf, S_.slide(0.35), S["B02"] + 0.25, 0.4)
    add(buf, sparkle(81), S["B02"] + 0.32, 0.55)
    add(buf, S_.shing(1.3), S["B02"] + 0.3, 0.35)
    add(buf, S_.whoosh(0.8, 1100), S["B04"] + 0.05, 0.7)
    add(buf, cheer(2.2), S["B05"] - 0.1, 0.5)
    add(buf, T.clap(8, 2.0), S["B05"], 0.3)
    # the red card: the slide, a boom (music), a crack under his hand, a gasp, silence
    add(buf, S_.slide(0.35), S["C02"] + 0.05, 0.4)
    add(buf, T.thunder(2.2), S["C02"] + 0.1, 0.35)
    add(buf, S_.crack(0.9), S["C05"] + 0.2, 0.8)
    add(buf, vowel(220, 0.6, AH, breath=0.9, glide=0.3) * 0.4, S["D01"] + 0.05, 0.3)
    for k in range(2):
        add(buf, S_.step(), S["D02"] + 0.2 + 0.35 * k, 0.3)
    # the corridor, the street, the classroom
    add(buf, S_.murmur(2.4) * 0.5, S["E01"], 0.12)
    for k in range(5):
        add(buf, S_.step(), S["E02"] + 0.2 + 0.4 * k, 0.2)
    add(buf, T.creak(1.0) * 0.6, S["E04b"] + 0.05, 0.35)
    # the bag rips, eggs splat; the computer bursts into flames; the necklace snaps, beads
    for k in range(4):
        add(buf, S_.step(), S["F02"] + 0.15 + 0.22 * k, 0.28)
    add(buf, rip(0.35), S["F03"] + 0.05, 0.7)
    for k in range(5):
        add(buf, splat(), S["F03"] + 0.4 + 0.11 * k + 0.05 * hash_(k), 0.5, pan=hash_(k * 3) - 0.5)
    for k in range(6):
        add(buf, S_.click(1800 + 400 * hash_(k)), S["F05"] + 0.2 + 0.16 * k, 0.25)
    add(buf, S_.poof(0.9), S["F06"] + 0.05, 0.8)
    add(buf, S_.crackle(1.0), S["F06"] + 0.1, 0.5)
    add(buf, S_.cloth(0.6), S["F07"] + 0.05, 0.25)
    add(buf, S_.click(3000), S["F08"] + 0.12, 0.6)
    for k in range(14):
        add(buf, tinkle(2400 + 1400 * hash_(k * 2.1)), S["F08"] + 0.2 + 0.06 * k + 0.05 * hash_(k), 0.35, pan=hash_(k * 5) - 0.5)
    # night: the card's hum; the gloves
    add(buf, S_.glow_hum(S["G04"] - S["G01"], 98), S["G01"], 0.22)
    add(buf, S_.cloth(0.7), S["G04"] + 0.1, 0.35)
    add(buf, S_.cloth(0.6), S["G04"] + 0.8, 0.3)
    # lunch: the yard, birds
    add(buf, S_.murmur(S["J01"] - S["H01"]) * 0.4, S["H01"], 0.1)
    for k in range(8):
        add(buf, S_.bird(2400 + 900 * hash_(k)), S["H01"] + 0.3 + k * 0.8, 0.06, pan=hash_(k * 7) - 0.5)
    # Hero Day: the crowd; the sky darkens (thunder, wind); the machine rises (rumble, servos); the eye
    add(buf, cheer(S["J04"] - S["J01"] + 0.3), S["J01"], 0.4)
    add(buf, T.clap(10, 2.4), S["J01"] + 0.1, 0.25)
    add(buf, T.thunder(3.0), S["J04"] + 0.2, 0.6)
    add(buf, S_.wind(S["N01"] - S["J04"]), S["J04"], 0.15)
    add(buf, S_.boom.__call__ if False else lowpass(noise(int(2.5 * SR)), 90) * np.minimum(1, np.arange(int(2.5 * SR)) / SR / 0.6) * 1.2, S["K01"], 0.6)
    add(buf, servo(0.9, True), S["K02"] + 0.05, 0.4)
    add(buf, servo(0.7, True), S["K02"] + 0.35, 0.3, pan=0.4)
    add(buf, S_.glow_hum(0.9, 80), S["K03"] + 0.05, 0.4)
    add(buf, S_.whoosh(0.7, 700), S["K04"] + 0.1, 0.5)
    add(buf, laser(0.5), S["K05"] + 0.02, 0.55)
    add(buf, ice(0.6), S["K06"] + 0.02, 0.55)
    add(buf, thump(0.35, 60), S["K07"] + 0.15, 0.9)
    add(buf, clank(0.8), S["K07"] + 0.16, 0.5)
    # the drain, the falls, the claw, the screams
    add(buf, zap_hum(S["L02"] - S["L01"] + 0.6, 110), S["L01"], 0.45)
    for k in range(4):
        add(buf, thump(0.25, 80), S["L02"] + 0.25 + 0.25 * k, 0.4)
    add(buf, servo(1.0, False), S["L04"] + 0.05, 0.45)
    add(buf, clank(0.7), S["L05"] + 0.08, 0.6)
    add(buf, vowel(420, 0.6, AH, breath=0.6, glide=0.6) * 0.5, S["L05"] + 0.12, 0.35)
    add(buf, S_.murmur(1.4) * 1.5, S["L06"], 0.4)
    for k in range(8):
        add(buf, S_.step(), S["L06"] + 0.05 + 0.12 * k, 0.25, pan=hash_(k) - 0.5)
    # Noah: the gloves come off (sparks), the run, the slam, the cracks, the arms, the eye, the crash
    add(buf, S_.cloth(0.5), S["M02"] + 0.3, 0.4)
    add(buf, S_.crackle(1.0) * 0.7, S["M02"] + 0.6, 0.35)
    for k in range(6):
        add(buf, S_.step(), S["M03"] + 0.1 + 0.2 * k, 0.32)
    add(buf, thump(0.35, 55), S["M03"] + S_.hash_(1) * 0 + (S["M04"] - S["M03"]) * 0.88, 1.0)
    add(buf, S_.crack(1.2), S["M04"] + 0.05, 1.0)
    add(buf, S_.crackle(1.0), S["M04"] + 0.1, 0.5)
    add(buf, clank(1.0), w(26, "arms.") + 0.05, 0.8)
    add(buf, thump(0.4, 50), w(26, "arms.") + 0.6, 0.7)
    add(buf, glass(0.9), w(26, "eye.") + 0.02, 0.8)
    add(buf, lowpass(noise(int(2.0 * SR)), 120) * env_exp(int(2.0 * SR), 1.6) * 1.4, w(26, "crashing") + 0.2, 0.8)
    # the powers come back; Max's dash; the catch; quiet
    add(buf, sparkle(85), S["N01"] + 0.1, 0.5)
    add(buf, S_.whoosh(1.2, 500), S["N01"] + 0.1, 0.35)
    add(buf, S_.whoosh(0.6, 1200), w(27, "shot") + 0.05, 0.75)
    add(buf, thump(0.2, 90), S["N03"] + 0.02, 0.35)
    add(buf, S_.wind(2.0) * 0.5, S["N04"], 0.15)
    # the card: a hum, the change (sparkles), HERO (a burst), the cheer
    add(buf, S_.glow_hum(1.8, 196), S["P03"] + 0.1, 0.3)
    add(buf, sparkle(89), S["P05"] + 0.4, 0.45)
    add(buf, S_.shing(1.4), S["P06"] + 0.02, 0.45)
    add(buf, sparkle(93), S["P06"] + 0.05, 0.55)
    add(buf, cheer(2.6), S["P07"] + 0.1, 0.5)
    add(buf, T.clap(10, 2.4), S["P07"] + 0.2, 0.3)
    # Max's room: a hum, the card turns red
    add(buf, S_.glow_hum(1.0, 82), S["Q02"], 0.4)
    add(buf, S_.heartbeat(), S["Q03"] + 0.2, 0.5)
    add(buf, S_.heartbeat(), S["Q03"] + 0.95, 0.5)
    return buf[: int(total * SR)]


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    ws = words(root / "vo/h1/timings.json")
    S, total = shots(root / "src/planH.gen.ts")
    T.write(root / "vo/h1/music.wav", music(ws, S, total), 0.85)
    T.write(root / "vo/h1/sfx.wav", sfx(ws, S, total), 0.85)
    print(f"wrote music + sfx ({total:.2f} s)")
