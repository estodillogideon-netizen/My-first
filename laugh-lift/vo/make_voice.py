"""Narration from an offline voice (no recording needed): every script line is spoken by espeak-ng with an MBROLA
voice, then time-fitted into its slot from vo/timings.json (from its first word to the start of the next line), so the
cuts and captions of the existing render stay in sync. Writes vo/voice.wav (48 kHz mono, -14 LUFS).

    python vo/make_voice.py vo/timings.json vo/voice.wav [voice] [rate] [pitch]

voice: an espeak-ng voice (default mb-us3, a male MBROLA voice), rate in words per minute (default 215), pitch 0-99.
"""
import json, re, subprocess, sys, tempfile
from pathlib import Path


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout.strip())


def atempo_chain(k):
    parts = []
    while k > 2.0:
        parts.append("atempo=2.0")
        k /= 2.0
    while k < 0.5:
        parts.append("atempo=0.5")
        k /= 0.5
    parts.append(f"atempo={k:.4f}")
    return ",".join(parts)


def main(timings, out, voice="mb-us3", rate=215, pitch=55):
    d = json.loads(Path(timings).read_text(encoding="utf8"))
    turns = d["turns"]
    total = turns[-1]["words"][-1]["end"] + 0.8
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        parts = []
        for i, tr in enumerate(turns):
            text = " ".join(w["w"] for w in tr["words"])
            text = re.sub(r'["“”]', "", text)
            a = tr["words"][0]["t"]
            nxt = turns[i + 1]["words"][0]["t"] if i + 1 < len(turns) else total
            slot = min(nxt - a - 0.06, tr["words"][-1]["end"] - a + 0.22)
            raw = tmp / f"l{i:02d}.wav"
            subprocess.run(["espeak-ng", "-v", voice, "-s", str(rate), "-p", str(pitch), "-g", "1", "-w", str(raw), text], check=True, capture_output=True)
            # trim the engine's leading/trailing silence, then fit into the slot
            trimmed = tmp / f"t{i:02d}.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af",
                            "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",
                            "-ar", "48000", "-ac", "1", str(trimmed)], check=True)
            k = dur(trimmed) / slot
            fitted = tmp / f"f{i:02d}.wav"
            # never slow the voice down (a fast narrator); if the line is shorter than its slot it just ends early
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(trimmed), "-af", atempo_chain(max(1.0, k)), str(fitted)], check=True)
            parts.append((a, fitted))
            print(f"line {i + 1:2d} at {a:6.2f}s slot {slot:4.2f}s speech {dur(trimmed):4.2f}s tempo {max(1.0, k):.2f}")
        ins, filt = [], []
        for j, (a, f) in enumerate(parts):
            ins += ["-i", str(f)]
            ms = int(round(a * 1000))
            filt.append(f"[{j}:a]adelay={ms}|{ms}[d{j}]")
        mix = "".join(f"[d{j}]" for j in range(len(parts))) + f"amix=inputs={len(parts)}:normalize=0,apad=whole_dur={total:.3f}[m]"
        rawmix = tmp / "mix.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", ";".join(filt) + ";" + mix, "-map", "[m]", "-t", f"{total:.3f}", "-ar", "48000", str(rawmix)], check=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(rawmix), "-af", "highpass=f=70,loudnorm=I=-14:TP=-1:LRA=11", "-ar", "48000", "-ac", "1", out], check=True)
    print(f"wrote {out} ({dur(out):.2f} s)")


if __name__ == "__main__":
    a = sys.argv
    main(a[1], a[2], a[3] if len(a) > 3 else "mb-us3", int(a[4]) if len(a) > 4 else 215, int(a[5]) if len(a) > 5 else 55)
