"""Build a scene's soundtrack: AI narration (Kokoro TTS) + generated SFX + generated suspense music.
Everything except the voice model is synthesized here, so there are no copyright issues.

usage: python3 audio.py lostplayer
writes out/<scene>.wav and out/<scene>.timing.json (narration line lengths, used for subtitles)
"""
import json, sys, os
import numpy as np
import soundfile as sf
from scipy.signal import lfilter, butter, sosfilt

SR = 24000
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(7)


def lowpass(x, a):  # one-pole, a in (0,1): smaller = darker
    return lfilter([a], [1, a - 1], x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], 'bandpass', fs=SR, output='sos'), x)


def env(n, att=0.01, rel=0.2):
    e = np.ones(n); a = min(n, int(att * SR)); r = min(n, int(rel * SR))
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] *= np.linspace(1, 0, r)
    return e


def norm(x):
    return x / (np.abs(x).max() + 1e-9)


def tone(f, dur, decay=3.0, harm=(1, 0.5, 0.25)):
    t = np.arange(int(dur * SR)) / SR
    return sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(harm)) * np.exp(-t * decay)


def reverb(x, mix=0.3):
    y = x.copy()
    for d, g in [(0.031, .5), (0.047, .45), (0.071, .4), (0.113, .35), (0.167, .3), (0.241, .25)]:
        k = int(d * SR); y[k:] += x[:-k] * g
    return x * (1 - mix) + lowpass(y, 0.3) * mix


def sfx(kind, dur=1.0, s=None):
    s = s or {}
    n = int(dur * SR); t = np.arange(n) / SR
    if kind in ('wind', 'redwind'):
        x = lowpass(rng.standard_normal(n), 0.02 if kind == 'wind' else 0.01)
        x *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * t) ** 2
        if kind == 'redwind': x += 0.3 * norm(np.sin(2 * np.pi * 41 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.3 * t)))
        return norm(x) * env(n, 1.5, 1.5)
    if kind == 'steps':
        x = np.zeros(n); rate = s.get('rate', 0.4)
        for st in np.arange(0.05, dur, rate):
            i = int(st * SR); m = min(int(0.09 * SR), n - i)
            x[i:i + m] += lowpass(rng.standard_normal(m), 0.3) * np.exp(-np.linspace(0, 9, m)) \
                + 0.6 * np.sin(2 * np.pi * 70 * np.arange(m) / SR) * np.exp(-np.linspace(0, 12, m))
        return norm(reverb(x, 0.25))
    if kind == 'join':  # bright two-note "player joined" chime
        a = tone(880, 0.9, 4); b = tone(1318.5, 0.9, 4); k = int(0.13 * SR)
        x = a.copy(); x[k:] += b[:-k] * 1.1
        return norm(x) * env(len(x), 0.005, 0.1)
    if kind == 'ping':  # chat message pop
        return norm(tone(1567, 0.35, 12, (1, 0.3)) + tone(2093, 0.35, 14, (0.6,)))
    if kind == 'click':
        return norm(tone(2400, 0.06, 60, (1,)) + 0.4 * rng.standard_normal(int(0.06 * SR)) * np.exp(-np.linspace(0, 20, int(0.06 * SR))))
    if kind == 'typing':
        x = np.zeros(n)
        for st in np.arange(0.02, dur - 0.05, 0.085):
            st += rng.uniform(-0.02, 0.02); i = int(st * SR); m = int(0.03 * SR)
            x[i:i + m] += bp(rng.standard_normal(m), 1500, 5000) * np.exp(-np.linspace(0, 10, m))
        return norm(x)
    if kind == 'error':  # harsh buzzer
        n = int(0.7 * SR); t = np.arange(n) / SR
        x = np.sign(np.sin(2 * np.pi * 110 * t)) * 0.5 + np.sign(np.sin(2 * np.pi * 116 * t)) * 0.5
        return norm(lowpass(x, 0.3)) * env(n, 0.005, 0.1)
    if kind == 'glitch':
        x = rng.standard_normal(n); chunk = int(0.03 * SR)
        for i in range(0, n, chunk):
            if rng.random() < 0.5: x[i:i + chunk] = np.round(np.sin(2 * np.pi * rng.uniform(80, 2000) * t[i:i + chunk]) * 3) / 3
            elif rng.random() < 0.3: x[i:i + chunk] = 0
        return x * 0.8 * env(n, 0.005, 0.05)
    if kind == 'whoosh':
        n = int(0.7 * SR); t = np.arange(n) / SR
        return norm(bp(rng.standard_normal(n), 300, 3000) * np.sin(np.pi * t / 0.7) ** 3)
    if kind == 'spawn':  # shimmering sci-fi materialize
        n = int(1.6 * SR); t = np.arange(n) / SR
        x = np.sin(2 * np.pi * (300 + 900 * t) * t) * np.sin(2 * np.pi * 13 * t) + 0.5 * bp(rng.standard_normal(n), 2000, 8000)
        return norm(reverb(x * np.exp(-t * 1.5), 0.5)) * env(n, 0.05, 0.4)
    if kind == 'heartbeat':
        x = np.zeros(n)
        for st in np.arange(0, dur, 0.75):
            for off, g in [(0, 1), (0.22, 0.7)]:
                i = int((st + off) * SR); m = min(int(0.18 * SR), n - i)
                if m <= 0: continue
                tt = np.arange(m) / SR
                x[i:i + m] += g * np.sin(2 * np.pi * (60 - 25 * tt / 0.18) * tt) * np.exp(-tt * 22)
        return norm(x)
    if kind == 'hit':  # cinematic boom
        n = int(2.5 * SR); t = np.arange(n) / SR
        x = np.sin(2 * np.pi * (45 * np.exp(-t * 0.6)) * t) * np.exp(-t * 1.6)
        x += 0.4 * lowpass(rng.standard_normal(n), 0.05) * np.exp(-t * 3)
        return norm(reverb(x, 0.3))
    if kind == 'rumble':
        x = lowpass(rng.standard_normal(n), 0.004) + 0.5 * np.sin(2 * np.pi * 32 * t)
        return norm(x) * env(n, 1.0, 1.5)
    if kind == 'crumble':
        n = int(1.4 * SR); x = np.zeros(n)
        for _ in range(40):
            i = int(rng.uniform(0, 1.0) * SR); m = int(0.05 * SR)
            x[i:i + m] += bp(rng.standard_normal(m), 150, 1500) * np.exp(-np.linspace(0, 6, m)) * rng.uniform(0.3, 1)
        return norm(reverb(x, 0.4))
    if kind == 'riser':
        n = int(0.6 * SR); t = np.arange(n) / SR
        x = np.sin(2 * np.pi * (200 + 2400 * (t / 0.6) ** 2) * t) * 0.4 + bp(rng.standard_normal(n), 3000, 9000)
        return norm(x * (t / 0.6) ** 2)
    if kind == 'hum':  # electrical hum of the hidden room / old monitor
        x = np.sin(2 * np.pi * 60 * t) + 0.4 * np.sin(2 * np.pi * 120 * t) + 0.15 * np.sin(2 * np.pi * 15700 * t)
        return norm(x) * env(n, 0.3, 0.6)
    if kind == 'tick':  # clock ticking
        x = np.zeros(n)
        for k2, st in enumerate(np.arange(0, dur, 0.5)):
            i = int(st * SR); m = min(int(0.025 * SR), n - i)
            x[i:i + m] += bp(rng.standard_normal(m), 2500 if k2 % 2 else 3200, 7000) * np.exp(-np.linspace(0, 8, m))
        return norm(reverb(x, 0.3))
    if kind == 'vanish':  # reverse-swell + shimmer pop
        n = int(1.2 * SR); t = np.arange(n) / SR
        sw = bp(rng.standard_normal(n), 400, 6000) * (t / 1.2) ** 3
        sh = np.sin(2 * np.pi * (1800 - 1500 * t) * t) * np.exp(-((t - 0.95) * 8) ** 2)
        return norm(reverb(sw + 0.8 * sh, 0.5))
    if kind == 'siren':  # distant police siren
        f = 700 + 350 * np.sin(2 * np.pi * 0.35 * t)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
        return norm(lowpass(reverb(x, 0.7), 0.12)) * env(n, 1.0, 1.0)
    if kind == 'rain':
        x = bp(rng.standard_normal(n), 800, 9000) * 0.6
        drops = (rng.random(n) < 0.0015) * rng.uniform(0.5, 1, n)
        x += lfilter([1], [1, -0.97], drops) * 0.3
        return norm(x) * env(n, 0.8, 0.8)
    if kind == 'engine':  # bus engine rumble
        f0 = 38 + 3 * np.sin(2 * np.pi * 0.2 * t)
        ph = 2 * np.pi * np.cumsum(f0) / SR
        x = np.sin(ph) + 0.6 * np.sin(2 * ph) + 0.3 * np.sign(np.sin(3 * ph)) * 0.3 + 0.4 * lowpass(rng.standard_normal(n), 0.02)
        return norm(lowpass(x, 0.08)) * env(n, 0.6, 0.6)
    if kind == 'static':
        x = rng.standard_normal(n) * (0.7 + 0.3 * (rng.random(n // 400 + 1).repeat(400)[:n] > 0.5))
        return norm(bp(x, 500, 8000)) * env(n, 0.01, 0.08)
    if kind == 'creak':  # door creak: slow, rough pitch glide
        n = int(1.3 * SR); t = np.arange(n) / SR
        f = 300 + 120 * np.sin(2 * np.pi * 0.8 * t) + 60 * rng.standard_normal(n).cumsum() / np.sqrt(SR) * 0.02
        pulses = np.sin(2 * np.pi * np.cumsum(f) / SR) ** 15
        return norm(reverb(bp(pulses, 200, 3000), 0.4)) * env(n, 0.1, 0.3)
    if kind == 'flicker':  # fluorescent tubes buzzing on
        x = np.sin(2 * np.pi * 120 * t) * (rng.random(n // 1200 + 1).repeat(1200)[:n] > 0.35)
        x += 0.3 * bp(rng.standard_normal(n), 3000, 8000) * (rng.random(n // 600 + 1).repeat(600)[:n] > 0.7)
        return norm(x) * env(n, 0.01, 0.3)
    if kind == 'crowd':  # anxious murmuring crowd
        x = sum(bp(rng.standard_normal(n), lo, lo * 1.8) * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(2, 5) * t + rng.uniform(0, 6)))
                for lo in [300, 450, 600, 800, 1000])
        return norm(x) * env(n, 0.5, 0.5)
    if kind == 'alarm':  # emergency broadcast tone
        x = (np.sin(2 * np.pi * 853 * t) + np.sin(2 * np.pi * 960 * t)) * (np.sin(2 * np.pi * 1.5 * t) > 0)
        return norm(x) * env(n, 0.02, 0.2)
    if kind == 'door':  # door bump/open thud
        n = int(0.5 * SR); t = np.arange(n) / SR
        return norm(np.sin(2 * np.pi * 90 * t) * np.exp(-t * 18) + 0.4 * bp(rng.standard_normal(n), 200, 2000) * np.exp(-t * 25))
    if kind == 'tvon':  # CRT power-on thunk + whine
        n = int(0.6 * SR); t = np.arange(n) / SR
        return norm(np.sin(2 * np.pi * 60 * t) * np.exp(-t * 10) + 0.25 * np.sin(2 * np.pi * 15734 / 4 * t) * np.exp(-t * 3))
    if kind == 'sub':  # deep sub drop
        n = int(3 * SR); t = np.arange(n) / SR
        return norm(np.sin(2 * np.pi * (60 * np.exp(-t * 0.8)) * t) * np.exp(-t * 0.9))
    raise ValueError(kind)


# ---------- music ----------
A1 = 55.0
def note(semi, base=220.0): return base * 2 ** (semi / 12)


def music(kind, dur, cue):
    n = int(dur * SR); t = np.arange(n) / SR
    if kind == 'tension':
        rise = cue.get('rise', [0, 1, dur, 1])
        inten = np.interp(t, rise[0::2], rise[1::2])
        # dark detuned pad (A minor, with a dissonant b2 creeping in)
        pad = sum(np.sin(2 * np.pi * f * t + p) for f, p in [(A1, 0), (A1 * 1.003, 1), (A1 * 1.5, 2), (A1 * 2 * 2 ** (1 / 12), .4)])
        pad = lowpass(pad, 0.05) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t))
        # pulsing low "heart" synth: 8th notes at 100 bpm, gets louder with intensity
        beat = 60 / 100 / 2
        ph = (t % beat) / beat
        pulse = np.sin(2 * np.pi * A1 * t) * np.exp(-ph * 6) * inten ** 2
        # high ticking clock
        tick = bp(rng.standard_normal(n), 5000, 9000) * (np.exp(-((t % (beat * 2)) / 0.004))) * inten
        # sparse eerie piano motif
        pno = np.zeros(n); motif = [12, 15, 11, 12, 8, 7]
        for k, st in enumerate(np.arange(1.0, dur - 1, 2.4)):
            s = tone(note(motif[k % len(motif)]), 2.0, 2.2, (1, .35, .12, .05))
            i = int(st * SR); pno[i:i + len(s)] += s[: n - i] * 0.5
        x = 0.55 * norm(pad) + 0.5 * pulse + 0.12 * tick + 0.35 * reverb(pno, 0.5)
        return x * env(n, 1.2, 0.6)
    if kind == 'musicbox':  # nostalgic, slightly detuned memory melody
        mel = [12, 16, 19, 24, 19, 16, 14, 17, 21, 19]
        x = np.zeros(n)
        for k, m in enumerate(mel):
            s = tone(note(m, 440) * (1 + 0.003 * np.sin(k)), 1.2, 3.5, (1, 0.2, 0.3))
            i = int(k * 0.36 * SR)
            if i < n: x[i:i + len(s)] += s[: n - i]
        return reverb(norm(x), 0.5) * env(n, 0.02, 0.8)
    if kind == 'pad':
        x = sum(np.sin(2 * np.pi * f * t) for f in [A1, A1 * 1.19, A1 * 1.5, A1 * 2.01])
        return norm(lowpass(x, 0.04)) * env(n, 0.5, 1.2)
    raise ValueError(kind)


def whisperize(a):
    """Turn a voiced line into a breathy whisper: noise shaped by the voice's envelope + a faint copy."""
    e = lowpass(np.abs(a), 0.01)
    breath = bp(rng.standard_normal(len(a)), 1200, 7000) * e * 6
    hi = bp(a, 900, 8000)
    return reverb(norm(0.7 * norm(breath) + 0.5 * norm(hi)), 0.55)


def tvize(a):
    x = bp(a, 350, 3400)
    x = np.tanh(x * 3) * 0.6
    x += 0.04 * bp(rng.standard_normal(len(a)), 2000, 8000)
    return reverb(norm(x), 0.2)


def trim(a, th=0.01):
    idx = np.where(np.abs(a) > th * np.abs(a).max())[0]
    return a[max(0, idx[0] - int(0.02 * SR)): idx[-1] + int(0.06 * SR)]


def word_times(text, t0, dur):
    words = text.split()
    wts = [len(w) + 2 + (4 if w[-1] in ',;' else 0) + (7 if w[-1] in '.?!…”' else 0) for w in words]
    tot = sum(wts); out = []; c = t0
    for w, k in zip(words, wts):
        d = dur * k / tot; out.append({'w': w, 't0': round(c, 3), 't1': round(c + d, 3)}); c += d
    return out


def main(name):
    tl = json.load(open(os.path.join(HERE, 'scenes', f'{name}.json')))
    total = int(tl['duration'] * SR)
    fx = np.zeros(total); mus = np.zeros(total); voice = np.zeros(total)

    def place(buf, clip, t, gain):
        i = int(t * SR); clip = clip[: max(0, total - i)]
        buf[i:i + len(clip)] += clip * gain

    from kokoro_onnx import Kokoro
    models = os.path.join(HERE, 'models')
    k = Kokoro(os.path.join(models, 'kokoro-v1.0.int8.onnx'), os.path.join(models, 'voices-v1.0.bin'))
    durs = []; lines_out = []; cursor = 0.0
    auto = tl.get('layout') == 'auto'
    for line in tl['narration']:
        v = line.get('voice', tl['voice'])
        a, sr = k.create(line.get('say', line['text']), voice=v, speed=line.get('speed', tl.get('speed', 1.0)), lang='en-gb' if v.startswith('b') else 'en-us')
        assert sr == SR
        a = norm(a)
        if auto: a = trim(a)
        if line.get('fx') == 'whisper': a = whisperize(a)
        if line.get('fx') == 'tv': a = tvize(a)
        if auto: line['t'] = round(cursor + line.get('gap', 0.12), 3)
        d = len(a) / SR; cursor = line['t'] + d
        durs.append(round(d + 0.3, 2))
        lines_out.append({'t': line['t'], 'dur': round(d, 3), 'words': word_times(line['text'], line['t'], d)})
        place(voice, a * 0.9, line['t'], 1.0)
        print(f"  L{len(lines_out) - 1:<2} {line['t']:6.2f}s -> {cursor:6.2f}s  {line['text']}")
    T = lambda e: e['t'] if 't' in e else tl['narration'][e['line']]['t'] + e.get('off', 0)
    for s in tl.get('sfx', []):
        place(fx, sfx(s['type'], s.get('dur', 1.0), s), T(s), s.get('gain', 0.5))
    for m in tl.get('music', []):
        place(mus, music(m['kind'], m['dur'], m), T(m), m.get('gain', 0.3))
    for m in tl.get('mute', []):  # hard silence windows for music+sfx (e.g. before the twist)
        a0, a1 = int(T(m) * SR), int((T(m) + m['dur']) * SR); ramp = int(0.05 * SR)
        g = np.ones(total); g[a0:a1] = 0; g[max(0, a0 - ramp):a0] = np.linspace(1, 0, min(ramp, a0)); 
        fx *= g; mus *= g

    # duck music + SFX under the voice
    v_env = lowpass(np.abs(voice), 0.002)
    duck = 1 - tl.get('duck', 0.6) * np.clip(v_env / (v_env.max() + 1e-9) * 3, 0, 1)
    bed = (fx * 0.85 + mus) * duck * tl.get('bed_gain', 1.0)
    vm = np.abs(voice) > 1e-3
    if vm.any():
        rv = np.sqrt(np.mean(voice[vm] ** 2)); rb = np.sqrt(np.mean(bed[vm] ** 2))
        print(f'voice vs music+sfx while speaking: {20 * np.log10(rv / (rb + 1e-9)):.1f} dB louder')
    mix = bed + voice
    mix = np.tanh(mix * 1.1) * 0.95
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    sf.write(os.path.join(HERE, 'out', f'{name}.wav'), mix.astype(np.float32), SR)
    print('narration ends at', round(cursor, 2))
    json.dump(durs, open(os.path.join(HERE, 'out', f'{name}.timing.json'), 'w'))
    json.dump(lines_out, open(os.path.join(HERE, 'out', f'{name}.lines.json'), 'w'))
    print('audio done')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'lostplayer')
