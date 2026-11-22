"""Print output frame numbers inside the given shots (default: 45 % into each shot): python3 tools/frames_of.py A01 B02 ..."""
import json, re, sys
from pathlib import Path
src = Path(__file__).resolve().parent.parent / "src" / "plan.gen.ts"
shots = json.loads(re.search(r"export const SHOTS = (\[.*?\]) as const;", src.read_text()).group(1))
by = {s["id"]: s for s in shots}
u = float(dict(a.split("=") for a in sys.argv[1:] if "=" in a).get("u", 0.45))
ids = [a for a in sys.argv[1:] if "=" not in a] or [s["id"] for s in shots]
print(" ".join(str(int(round((by[i]["t"] + u * (by[i]["end"] - by[i]["t"])) * 30))) for i in ids))
