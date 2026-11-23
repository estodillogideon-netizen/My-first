"""Placeholder word timings for a Short that has no recorded voice yet: every word of script.txt gets an onset and an
end at a narrator's pace (~260 words per minute), longer words take longer, and sentences and commas leave a pause.
Writes the same timings.json format as vo/transcribe.py, so the plan, the captions and the cuts work now; once a voice
is recorded, run vo/transcribe.py on it and re-run the plan: every shot moves with its word.

    python vo/synth_timings.py vo/script.txt vo/timings.json [total_seconds]
"""
import json, re, sys
from pathlib import Path


def syl(w):
    w = re.sub(r"[^a-z]", "", w.lower())
    if not w:
        return 1
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and n > 1 and not w.endswith("le"):
        n -= 1
    return max(1, n)


def main(script, out, total=119.0):
    lines = [l.strip() for l in Path(script).read_text(encoding="utf8").splitlines() if l.strip()]
    items = []
    for ti, l in enumerate(lines, 1):
        ws = l.split()
        for k, w in enumerate(ws):
            dur = 0.11 + 0.085 * syl(w)
            end = w.rstrip('"”')
            pause = 0.34 if end[-1:] in ".?!" else 0.16 if end[-1:] in ",;:" else 0.0
            if k == len(ws) - 1:
                pause = max(pause, 0.3)
            items.append([ti, w, dur, pause])
    speech = sum(i[2] for i in items)
    pauses = sum(i[3] for i in items[:-1])
    target = total - 0.8  # the picture runs ~0.8 s after the last word
    k = (target - pauses) / speech
    t, turns = 0.0, {}
    for i, (ti, w, d, p) in enumerate(items):
        d *= k
        turns.setdefault(ti, []).append({"w": w, "t": round(t, 3), "end": round(t + d, 3)})
        t += d + (p if i < len(items) - 1 else 0)
    Path(out).write_text(json.dumps({"synthetic": True, "turns": [{"turn": n, "words": ws} for n, ws in sorted(turns.items())]}, indent=1), encoding="utf8")
    print(f"{len(items)} words, last word ends {t:.2f} s, speech scale {k:.2f}, {len(items) / (t / 60):.0f} wpm overall")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 119.0)
