"""Voice first: the narration is spoken by Piper (en_US-joe-medium), one sentence at a time, and the word timings come
from the audio itself (no Whisper needed): every sentence's start is known exactly, its internal pauses are found in the
waveform and matched to its commas, and the words between pauses share the voiced time by syllable weight.
The speaking speed is solved so the narration fills the target length. Writes vo/voice.wav (48 kHz mono) and
vo/timings.json (the same format as vo/transcribe.py).

    PIPER=... PIPER_MODEL=... python vo/make_voice2.py vo/script.txt vo/voice.wav vo/timings.json [total_s]
"""
import json, os, re, subprocess, sys, tempfile, wave
from pathlib import Path

import numpy as np

SR = 22050
GAP_SENT, GAP_LINE, LEAD, TAIL = 0.2, 0.36, 0.12, 1.1
# dramatic beats: extra silence before these lines (1-based)
EXTRA = {15: 0.25, 18: 0.3, 21: 0.3, 22: 0.2, 24: 0.25, 31: 0.2, 33: 0.25, 34: 0.35, 41: 0.35}


def syl(w):
    if w.lower().startswith("mr."):
        return 2
    w = re.sub(r"[^a-z]", "", w.lower())
    if not w:
        return 1
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and n > 1 and not w.endswith("le"):
        n -= 1
    return max(1, n)


def synth(text, ls, tmp):
    raw = Path(tmp) / "s.wav"
    clean = re.sub(r'["“”]', "", text)
    subprocess.run([os.environ["PIPER"], "-m", os.environ["PIPER_MODEL"], "-f", str(raw), "--length-scale", f"{ls:.3f}",
                    "--noise-scale", "0.667", "--noise-w-scale", "0.8", "--sentence-silence", "0.0"], input=clean, text=True, check=True, capture_output=True)
    with wave.open(str(raw)) as f:
        a = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        assert f.getframerate() == SR, f.getframerate()
    env = np.sqrt(np.convolve(a * a, np.ones(220) / 220, mode="same"))
    thr = max(env.max() * 0.03, 1e-4)
    on = np.where(env > thr)[0]
    a = a[max(0, on[0] - 110): on[-1] + 330]
    return a


def pauses(a):
    """internal silences >= 70 ms: list of (start_s, end_s)"""
    hop = 220
    n = len(a) // hop
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1))
    thr = rms.max() * 0.035
    quiet = rms < thr
    out, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if j - i >= 7 and i > 3 and j < n - 3:
                out.append((i * hop / SR, j * hop / SR))
            i = j
        else:
            i += 1
    return out


def word_times(words, a):
    """words of one sentence -> [(t0, t1)] relative to the sentence start"""
    T = len(a) / SR
    w8 = [0.5 + syl(w) for w in words]
    # boundaries after words that end with , ; : (or a closing quote after them)
    cuts = [k for k, w in enumerate(words[:-1]) if re.search(r"[,;:.?!][\"”]?$", w) and w != "Mr."]
    ps = pauses(a)
    tot = sum(w8)
    chosen = []
    for k in cuts:
        exp = T * sum(w8[: k + 1]) / tot
        best = None
        for p in ps:
            if p in chosen or (chosen and p[0] <= chosen[-1][0]):
                continue
            d = abs((p[0] + p[1]) / 2 - exp)
            if d < 0.45 and (best is None or d < best[0]):
                best = (d, p)
        chosen.append(best[1] if best else None)
    # segments: [w_start, w_end) with a time span
    segs, t0, w0 = [], 0.0, 0
    for k, p in zip(cuts, chosen):
        if p is None:
            continue
        segs.append((w0, k + 1, t0, p[0]))
        w0, t0 = k + 1, p[1]
    segs.append((w0, len(words), t0, T))
    out = []
    for a0, a1, s0, s1 in segs:
        ww = w8[a0:a1]
        tt = s0
        for x in ww:
            d = (s1 - s0) * x / sum(ww)
            out.append((tt, tt + d))
            tt += d
    return out


def main(script, out_wav, out_json, total=118.6):
    lines = [l.strip() for l in Path(script).read_text(encoding="utf8").splitlines() if l.strip()]
    sents = [[s for s in re.split(r'(?<!Mr\.)(?<=[.?!])["”]?\s+(?=["“A-Z])|(?<=[.?!]["”])\s+', l) if s] for l in lines]
    # re-attach closing quotes lost by the split
    fixed = []
    for l, ss in zip(lines, sents):
        res, pos = [], 0
        for s in ss:
            i = l.index(s, pos)
            j = i + len(s)
            while j < len(l) and l[j] in "\"”":
                j += 1
            res.append(l[i:j])
            pos = j
        fixed.append(res)
    gaps = LEAD + TAIL + sum(GAP_SENT * (len(ss) - 1) for ss in fixed) + GAP_LINE * (len(fixed) - 1) + sum(EXTRA.values())
    with tempfile.TemporaryDirectory() as tmp:
        ls = 1.0
        for it in range(3):
            clips = [[synth(s, ls, tmp) for s in ss] for ss in fixed]
            speech = sum(len(c) for cs in clips for c in cs) / SR
            print(f"length scale {ls:.3f}: speech {speech:.2f} s + gaps {gaps:.2f} s = {speech + gaps:.2f} s")
            if abs(speech + gaps - total) < 0.25:
                break
            ls *= (total - gaps) / speech
        t = LEAD
        buf = np.zeros(int((total + 2) * SR), dtype=np.float32)
        turns = []
        for li, (ss, cs) in enumerate(zip(fixed, clips), 1):
            if li > 1:
                t += GAP_LINE
            t += EXTRA.get(li, 0)
            words = []
            for si, (s, c) in enumerate(zip(ss, cs)):
                if si:
                    t += GAP_SENT
                i0 = int(round(t * SR))
                buf[i0: i0 + len(c)] += c
                ws = s.split()
                for w, (a0, a1) in zip(ws, word_times(ws, c)):
                    words.append({"w": w, "t": round(t + a0, 3), "end": round(t + a1, 3)})
                t += len(c) / SR
            turns.append({"turn": li, "words": words})
        end = t + TAIL
        buf = buf[: int(end * SR)]
    Path(out_json).write_text(json.dumps({"synthetic": False, "source": "piper per-sentence", "turns": turns}, indent=1), encoding="utf8")
    pcm = (np.clip(buf, -1, 1) * 32767).astype(np.int16)
    raw = Path(out_wav).with_suffix(".raw.wav")
    with wave.open(str(raw), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", "highpass=f=70,loudnorm=I=-14:TP=-1:LRA=11", "-ar", "48000", "-ac", "1", out_wav], check=True)
    raw.unlink()
    nw = sum(len(x["words"]) for x in turns)
    print(f"wrote {out_wav} ({end:.2f} s), {nw} words, {nw / (end / 60):.0f} wpm, length scale {ls:.3f}")


if __name__ == "__main__":
    a = sys.argv
    main(a[1], a[2], a[3], float(a[4]) if len(a) > 4 else 118.6)
