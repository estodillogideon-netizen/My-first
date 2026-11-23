"""Shot plan of "Laugh Lift": every shot starts on a WORD of the voice-over (turn = script line, word, occurrence).
Re-run after every voice change: the cuts move with the words. Writes src/plan.gen.ts (SHOTS, WORDS, DURATION) and
plan/SHOTS.md.

    python plan/plan_laugh.py vo/timings.json

Scenes: street (the rule), walk (to school), yard (the attempts), night (bedroom), party, ground (the party yard while
Tomo is in the sky), sky, end (walk to school, golden). Lenses live in src/laugh/shots.ts, keyed by the shot id.
"""
import json, sys
from pathlib import Path

FPS = 30
SHOTS = [
    # id, (turn, word, nth), scene, note
    ("A01", (1, "In", 1), "street", "hook: Tomo floats at head height over the sidewalk, laughing; a neighbour bobs behind"),
    ("A02", (1, "laugh,", 1), "street", "low: a neighbour laughs (HA) and lifts off the slab"),
    ("A03", (2, "Most", 1), "street", "wide street: neighbours bob an inch or two"),
    ("A04", (2, "Me?", 1), "street", "close Tomo grinning, floating"),
    ("A05", (2, "laugh", 1), "street", "low: Tomo laughs, rises"),
    ("A06", (2, "So", 1), "street", "low wide: Tomo up by the lamp top, waving"),
    ("B01", (3, "That's", 1), "walk", "medium Grandpa walking, stern, rope in hand going up"),
    ("B02", (3, "rope", 1), "walk", "low along the rope up to Tomo's backpack"),
    ("B03", (4, "Grandpa", 1), "walk", "close Grandpa, flat, walking"),
    ("B04", (4, "Not", 1), "walk", "side medium: heavy steps"),
    ("B05", (4, "Because", 2), "walk", "low two-shot: Grandpa flat, Tomo above laughing"),
    ("B06", (4, "Not", 2), "walk", "extreme close Grandpa: not once, not ever"),
    ("C01", (5, "So", 1), "yard", "yard wide: Grandpa in his garden chair, Tomo floats in front of him"),
    ("C02", (6, "Funny", 1), "yard", "close Tomo silly face"),
    ("C03", (6, "Nothing.", 1), "yard", "close Grandpa flat"),
    ("C04", (7, "rubber", 1), "yard", "medium Tomo squeezes a rubber chicken"),
    ("C06", (8, "The", 1), "yard", "two-shot: Tomo tells the joke, hands going"),
    ("C08", (8, "Nothing.", 1), "yard", "medium Grandpa flat, tugs the rope: Tomo bobs down"),
    ("C10", (8, "said,", 1), "yard", "close Grandpa: Walk."),
    ("C11", (9, "My", 1), "yard", "Rika and Tomo whisper behind the bush"),
    ("C12", (9, "Operation", 1), "yard", "two-shot sly: Rika holds the OPERATION GIGGLE sign"),
    ("C13", (10, "We", 1), "yard", "the pink cushion goes on the chair"),
    ("C14", (10, "He", 1), "yard", "wide: Grandpa sits, the kids peek"),
    ("C15", (10, "Looked", 1), "yard", "close Grandpa looks at them"),
    ("C16", (10, "Said,", 1), "yard", "close Grandpa: excuse me"),
    ("C18", (11, "Rika", 1), "yard", "close Rika: made of stone"),
    ("D01", (12, "But", 1), "night", "bedroom wide: Tomo asleep, floating over the bed, rope to the bedpost; Grandpa"),
    ("D02", (12, "checks", 1), "night", "close Grandpa in lamp light, tugging the knot"),
    ("D04", (12, "fall", 1), "night", "close Tomo asleep, smiling"),
    ("E01", (13, "Then", 1), "party", "party wide: balloons, cake table, bunting"),
    ("E03", (14, "Cake.", 1), "party", "low over the cake, balloons behind"),
    ("E05", (14, "clown.", 1), "party", "close clown, big grin"),
    ("E06", (15, "slipped", 1), "party", "side: the clown steps on the banana, legs fly up"),
    ("E08", (15, "landed", 1), "party", "face first into the cake: splat"),
    ("E09", (15, "wig", 1), "party", "the wig arcs over and drops into the punch bowl: splash"),
    ("E11", (16, "And", 1), "party", "close Tomo bursts out laughing"),
    ("E12", (17, "laughed", 1), "party", "low: Tomo rising fast, rope taut"),
    ("E13", (17, "rope", 1), "party", "insert: the rope snaps"),
    ("E14", (18, "Grandpa", 1), "party", "Grandpa lunges, arm up"),
    ("E16", (19, "shot", 1), "party", "low: Tomo shoots up through the balloons"),
    ("E17", (19, "roof.", 1), "sky", "past the roof edge, birds scatter"),
    ("F02", (20, "Down", 1), "ground", "the crowd in the yard looks up, shouting"),
    ("F03", (21, "firefighters", 1), "ground", "high, down past Tomo: the tallest ladder rises toward him and stops far short"),
    ("F05", (22, "Mom", 1), "ground", "down past Tomo: three kites tied together climb and stop far short"),
    ("F07", (23, "Rika", 1), "ground", "Rika throws her jump rope up"),
    ("F08", (23, "Way,", 1), "ground", "the jump rope drops back on her head"),
    ("F09", (24, "shoes", 1), "sky", "close: the shoes slip off his feet"),
    ("F10", (24, "watched", 1), "sky", "down: the shoes fall toward the town"),
    ("F11", (25, "bird", 1), "sky", "a bird lands on Tomo's head"),
    ("F12", (25, "looked", 1), "sky", "close: bird and Tomo eye to eye"),
    ("F13", (26, "Up", 1), "sky", "wide: Tomo alone in the sky, clouds"),
    ("F14", (26, "town", 1), "sky", "down: the whole town like a toy, his socks in the foreground"),
    ("F15", (27, "I", 1), "sky", "close Tomo thinking"),
    ("F16", (27, "Just", 1), "sky", "Tomo clamps his mouth shut"),
    ("F17", (28, "scared", 1), "sky", "close Tomo scared"),
    ("F18", (28, "Nervous", 1), "sky", "nervous giggles: small HA bubbles"),
    ("F18b", (28, "every", 1), "sky", "wide: every giggle lifts him past a cloud"),
    ("F20", (29, "couldn't", 1), "sky", "Tomo looks down, sad"),
    ("G01", (30, "Then,", 1), "ground", "Grandpa alone in the yard, looking up, worried"),
    ("G02", (30, "heard", 1), "sky", "Tomo turns his head down, curious"),
    ("G03", (31, "huge,", 1), "ground", "close Grandpa: a huge laugh opens"),
    ("G05", (31, "Like", 1), "ground", "low: Grandpa laughing, his feet leave the grass"),
    ("G06", (32, "Grandpa", 1), "ground", "Rika's face: joy"),
    ("G07", (33, "flying", 1), "sky", "low: Grandpa shoots up past the roof"),
    ("G08", (34, "caught", 1), "sky", "close under the cloud: the hands meet"),
    ("H01", (35, "Grandpa,", 1), "sky", "close Tomo: you laughed!"),
    ("H02", (36, "Don't", 1), "sky", "close Grandpa, a sly smile"),
    ("H03", (36, "Then", 1), "sky", "wide: both laugh and rise"),
    ("H04", (37, "That's", 1), "gold", "two-shot, calm, the sun gets low"),
    ("H05", (38, "He", 1), "gold", "close Grandpa, wistful"),
    ("H06", (38, "Grandma", 1), "gold", "close Tomo listening"),
    ("H07", (38, "When", 1), "gold", "close Grandpa looks down, sad"),
    ("H07b", (39, "I", 1), "gold", "over Tomo's shoulder: Grandpa"),
    ("H08", (39, "Close", 1), "gold", "close Grandpa, soft"),
    ("H09", (40, "So", 1), "gold", "close Tomo: how do we get down?"),
    ("H10", (41, "held", 1), "gold", "wide: Grandpa holds him tight"),
    ("H11", (41, "Slowly.", 1), "gold", "close Grandpa, calm"),
    ("H12", (42, "In.", 1), "gold", "two-shot: eyes closed, breathing, sinking"),
    ("H13", (42, "My", 1), "gold", "close Tomo, calm smile"),
    ("H14", (42, "His", 1), "gold", "close Grandpa smiles"),
    ("H15", (43, "drifted", 1), "gold", "wide: drifting down past a cloud"),
    ("H15b", (43, "Past", 1), "goldlow", "birds, then a roof slide past"),
    ("H17", (44, "pointed", 1), "goldlow", "Grandpa points"),
    ("H18", (44, "That's", 1), "goldlow", "the little rooftop with two chairs"),
    ("H19", (44, "He", 1), "goldlow", "close Grandpa still smiling"),
    ("H20", (45, "Past", 1), "goldparty", "low: down through the balloons into the cake"),
    ("H22", (46, "Everyone", 1), "goldparty", "both sit in the cake, the crowd cheers"),
    ("H23", (46, "clown", 1), "goldparty", "the clown cries"),
    ("J01", (47, "Grandpa", 1), "end", "street morning: Grandpa and Tomo walk, both float a little"),
    ("J02", (48, "tied", 1), "end", "insert: the rope tied to Grandpa's belt too"),
    ("J03", (49, "Because", 1), "end", "wide: both laugh and float higher"),
    ("J04", (50, "Grandpa", 1), "end", "close Grandpa happy"),
    ("J05", (50, "long", 1), "end", "final two-shot over the street"),
]


def load(p):
    d = json.loads(Path(p).read_text(encoding="utf8"))
    return [{"turn": tr["turn"], "w": w["w"], "t": w["t"], "end": w["end"]} for tr in d["turns"] for w in tr["words"]], d.get("synthetic", False)


def find(words, turn, word, nth=1):
    k = 0
    for w in words:
        if w["turn"] == turn and w["w"].lower().strip('.,!?;:"“”') == word.lower().strip('.,!?;:"'):
            k += 1
            if k == nth:
                return w
    raise SystemExit(f"anchor not found: turn {turn} word {word!r} #{nth}")


def main(p):
    words, synth = load(p)
    total = words[-1]["end"] + 0.8
    shots = []
    for i, (sid, (tn, wd, nth), scene, note) in enumerate(SHOTS):
        t0 = 0.0 if i == 0 else find(words, tn, wd, nth)["t"]
        shots.append({"id": sid, "t": round(round(t0 * FPS) / FPS, 4), "scene": scene, "note": note})
    for a, b in zip(shots, shots[1:] + [{"t": round(total * FPS) / FPS}]):
        a["end"] = b["t"]
    warn = [s for s in shots if s["end"] - s["t"] < 0.75 or s["end"] - s["t"] > 2.2]
    for s in warn:
        print(f"WARN {s['id']} {s['end'] - s['t']:.2f} s")
    if any(b["t"] <= a["t"] for a, b in zip(shots, shots[1:])):
        raise SystemExit("shots out of order")
    root = Path(__file__).resolve().parent.parent
    ws = [[w["w"], w["t"], w["end"], w["turn"]] for w in words]
    (root / "src" / "plan.gen.ts").write_text(
        "// generated by plan/plan_laugh.py; do not edit\n"
        f"export const FPS = {FPS};\nexport const DURATION = {round(total * FPS)};\nexport const SYNTHETIC_VO = {str(synth).lower()};\n"
        f"export const SHOTS = {json.dumps(shots)} as const;\n"
        f"export const WORDS: [string, number, number, number][] = {json.dumps(ws)};\n", encoding="utf8")
    md = ["| id | start | len | scene | note |", "|---|---|---|---|---|"]
    md += [f"| {s['id']} | {s['t']:.2f} | {s['end'] - s['t']:.2f} | {s['scene']} | {s['note']} |" for s in shots]
    (root / "plan" / "SHOTS.md").write_text("\n".join(md) + "\n", encoding="utf8")
    lens = [s["end"] - s["t"] for s in shots]
    print(f"{len(shots)} shots, {total:.2f} s, mean shot {sum(lens) / len(lens):.2f} s, min {min(lens):.2f}, max {max(lens):.2f}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "vo/timings.json")
