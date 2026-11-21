"""Build a scene's soundtrack: AI narration (Kokoro TTS) + procedurally generated SFX.

usage: python3 audio.py scene1
writes out/scene1.wav and out/scene1.timing.json (narration line lengths, used for subtitles)
"""
import json, sys, os
import numpy as np
import soundfile as sf

SR = 24000
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(7)


def lowpass(x, a):  # one-pole filter, a in (0,1): smaller = darker
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y


def env(n, att=0.01, rel=0.2):
    e = np.ones(n); a = int(att * SR); r = int(rel * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] *= np.linspace(1, 0, r)
    return e


def sfx(kind, dur=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    if kind == 'wind':
        x = lowpass(rng.standard_normal(n), 0.02)
        x *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * t) ** 2
        return x / np.abs(x).max() * env(n, 1.5, 1.5)
    if kind == 'drone':
        x = sum(np.sin(2 * np.pi * f * t + p) for f, p in [(55, 0), (55.4, 1), (82.4, 2), (110.7, 0.5)])
        x *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.08 * t)
        return x / np.abs(x).max() * env(n, 3, 2)
    if kind == 'steps':
        x = np.zeros(n)
        for s in np.arange(0.1, dur, 0.39):
            i = int(s * SR); m = min(int(0.08 * SR), n - i)
            x[i:i + m] += lowpass(rng.standard_normal(m), 0.25) * np.exp(-np.linspace(0, 8, m))
        return x / np.abs(x).max()
    if kind == 'join':  # bright two-note chime ("player joined")
        n = int(0.9 * SR); t = np.arange(n) / SR
        x = np.where(t < 0.15, np.sin(2 * np.pi * 880 * t), np.sin(2 * np.pi * 1318.5 * t))
        x += 0.3 * np.sin(2 * np.pi * 2637 * t)
        return x * np.exp(-t * 4) * env(n, 0.005, 0.1)
    if kind == 'glitch':
        x = rng.standard_normal(n)
        chunk = int(0.03 * SR)
        for i in range(0, n, chunk):  # stutter / bitcrush
            if rng.random() < 0.5: x[i:i + chunk] = np.round(np.sin(2 * np.pi * rng.uniform(80, 2000) * t[i:i + chunk]) * 3) / 3
            elif rng.random() < 0.3: x[i:i + chunk] = 0
        return x * 0.8 * env(n, 0.005, 0.05)
    if kind == 'whoosh':
        n = int(0.6 * SR); t = np.arange(n) / SR
        x = lowpass(rng.standard_normal(n), 0.15) * np.sin(np.pi * t / 0.6) ** 2
        return x / np.abs(x).max()
    if kind == 'heartbeat':
        x = np.zeros(n)
        for s in np.arange(0, dur, 0.75):
            for off, g in [(0, 1), (0.22, 0.7)]:
                i = int((s + off) * SR); m = min(int(0.18 * SR), n - i)
                if m <= 0: continue
                tt = np.arange(m) / SR
                x[i:i + m] += g * np.sin(2 * np.pi * (60 - 25 * tt / 0.18) * tt) * np.exp(-tt * 22)
        return x / np.abs(x).max()
    if kind == 'hit':  # cinematic boom
        n = int(2.5 * SR); t = np.arange(n) / SR
        x = np.sin(2 * np.pi * (45 * np.exp(-t * 0.6)) * t) * np.exp(-t * 1.6)
        x += 0.4 * lowpass(rng.standard_normal(n), 0.05) * np.exp(-t * 3)
        return x / np.abs(x).max()
    raise ValueError(kind)


def main(name):
    tl = json.load(open(os.path.join(HERE, 'scenes', f'{name}.json')))
    total = int(tl['duration'] * SR)
    music = np.zeros(total); voice = np.zeros(total)

    def place(buf, clip, t, gain):
        i = int(t * SR); clip = clip[: max(0, total - i)]
        buf[i:i + len(clip)] += clip * gain

    for s in tl['sfx']:
        place(music, sfx(s['type'], s.get('dur', 1.0)), s['t'], s.get('gain', 0.5))

    from kokoro_onnx import Kokoro
    models = os.path.join(HERE, 'models')
    k = Kokoro(os.path.join(models, 'kokoro-v1.0.int8.onnx'), os.path.join(models, 'voices-v1.0.bin'))
    durs = []
    for line in tl['narration']:
        a, sr = k.create(line['text'], voice=line.get('voice', tl['voice']), speed=tl.get('speed', 1.0), lang='en-us')
        assert sr == SR
        durs.append(round(len(a) / SR + 0.3, 2))
        place(voice, a / max(1e-6, np.abs(a).max()) * 0.9, line['t'], 1.0)
        end = line['t'] + len(a) / SR
        print(f"  {line['t']:5.1f}s → {end:5.1f}s  {line['text']}")

    # duck SFX under the voice
    v_env = lowpass(np.abs(voice), 0.002)
    duck = 1 - 0.55 * np.clip(v_env / (v_env.max() + 1e-9) * 3, 0, 1)
    mix = music * duck * 0.8 + voice
    mix = np.tanh(mix * 1.1) * 0.95
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    sf.write(os.path.join(HERE, 'out', f'{name}.wav'), mix.astype(np.float32), SR)
    json.dump(durs, open(os.path.join(HERE, 'out', f'{name}.timing.json'), 'w'))
    print('audio done')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'scene1')
