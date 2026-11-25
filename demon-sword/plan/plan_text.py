"""Shot plan of "The Last Text": every shot starts on a WORD of the voice-over.
Writes src/planT.gen.ts and plan/SHOTS_T.md.     python plan/plan_text.py
Scenes (= light): party (the birthday, warm day inside), day (the street by day), dusk (the hallway at dusk), night (the
house inside at night: blue, a lamp, the TV), rain (outside at night in the rain), memory (a warm flashback), grey (the
future without Ellie), lake (a sunny Saturday), room (Noah's room at night, lit by the phone).
"""
import json, sys
from pathlib import Path

FPS = 30
PART = 1
SHOTS = [
    ("A01", (1, "In", 1), "party", "birthday table: cake with 12 candles, Mom and Dad and Ellie clapping, Noah grinning"),
    ("A02", (1, "birthday,", 1), "party", "close Noah blowing out the candles"),
    ("A03", (1, "you", 1), "party", "the phone on the table buzzes and lights up"),
    ("A04", (1, "From", 1), "party", "insert: the phone: a text from YOU, AGE 32"),
    ("A05", (1, "twenty", 1), "party", "close Noah, curious, lit by the screen"),
    ("B01", (2, "My", 1), "day", "the street by day: Max rides past on a shiny red bike, grinning"),
    ("B02", (2, "Buy", 1), "day", "Max skids to a stop by the curb, holding up his phone: Buy the red bike"),
    ("B03", (2, "cousin", 1), "day", "cousin Zoe holds a gas station sushi box, disgusted"),
    ("B03b", (2, "Never", 1), "day", "close Zoe gagging"),
    ("B04", (3, "Mine", 1), "party", "close Noah reading his phone, his smile falling"),
    ("B05", (3, "Don't", 1), "party", "insert: the phone: Don't open the door."),
    ("B06", (4, "No", 1), "party", "Noah scrolls, confused, the party blurred behind"),
    ("B07", (4, "Just", 1), "dusk", "the front door at dusk, slow push in"),
    ("C01", (5, "That", 1), "rain", "the house at night in the rain, streetlamps, wet road"),
    ("C02", (5, "exactly", 1), "night", "the wall clock: midnight"),
    ("C03", (5, "someone", 1), "night", "Noah on the stairs, his eyes snap to the door"),
    ("C04", (6, "Three", 1), "night", "close: the door shakes with each knock"),
    ("C05", (7, "Through", 1), "night", "Noah creeps to the door, eye to the peephole"),
    ("C06", (7, "tall", 1), "rain", "peephole: a tall dark figure on the porch in the rain"),
    ("C06b", (7, "standing", 1), "rain", "close: the figure's hood, rain streaming off it, face in shadow"),
    ("C07", (8, "I", 1), "night", "Noah backs away, scared"),
    ("C08", (9, "The", 1), "rain", "the porch again, the figure under the light, rain"),
    ("C09", (9, "same", 2), "night", "close: the door handle, knock knock knock"),
    ("C10", (10, "Every", 1), "night", "Noah in bed, eyes open, rain on the window"),
    ("C11", (10, "whole", 1), "night", "close Noah exhausted, staring"),
    ("D01", (11, "My", 1), "night", "Ellie in pyjamas with her teddy peeking from the stairs"),
    ("D02", (11, "thought", 1), "night", "close Ellie giggling"),
    ("D03", (11, "She'd", 1), "night", "Ellie whispers to Noah in his bed: is the door man back?"),
    ("D03b", (11, "Is", 1), "night", "close Ellie whispering"),
    ("D04", (12, "And", 1), "night", "close Noah: realisation"),
    ("D05", (12, "That", 1), "memory", "memory: Ellie knocks three times on his bedroom door, teddy in her arm"),
    ("D05b", (12, "The", 1), "memory", "memory: close Ellie in the hallway, sleepy, the teddy"),
    ("D06", (12, "every", 1), "memory", "memory: Noah opens, lets her in, she climbs into his bed"),
    ("D07", (13, "I", 1), "night", "Noah kneels to Ellie, a pinky promise"),
    ("D08", (13, "Never", 1), "night", "close Noah, serious, talking"),
    ("E01", (14, "Then", 1), "night", "Noah asleep on the couch, TV glow, rain on the window"),
    ("E01b", (14, "asleep", 1), "night", "the front door in the dark behind the couch"),
    ("E02", (15, "I", 1), "night", "close Noah: eyes snap open"),
    ("E03", (15, "lock", 1), "night", "close: the deadbolt turns, click"),
    ("E04", (16, "Ellie", 1), "night", "the open door, Ellie small in the doorway, rain and porch light"),
    ("E04b", (16, "open", 1), "rain", "from outside: Ellie in the doorway, the rain between us"),
    ("E05", (17, "And", 1), "rain", "close Ellie smiling up, lit by the porch light"),
    ("F01", (18, "The", 1), "rain", "the tall figure steps forward into the porch light"),
    ("F02", (18, "tall,", 1), "rain", "the man: a soaked hoodie, hood up, rain dripping"),
    ("F03", (19, "He", 1), "rain", "the hood comes down: Noah's face, older"),
    ("F04", (19, "Just", 1), "night", "close kid Noah: shock"),
    ("F05", (20, "It", 1), "night", "kid Noah and the man, eyes meeting across the doorway"),
    ("F06", (21, "He", 1), "rain", "the man drops to his knees"),
    ("F07", (21, "hugged", 1), "rain", "he hugs Ellie tight"),
    ("F08", (22, "He", 1), "rain", "close the man crying"),
    ("F09", (23, "I'm", 1), "rain", "close the man whispering"),
    ("F10", (23, "just", 1), "rain", "Ellie giggles in his arms"),
    ("F11", (23, "laugh", 1), "rain", "the man smiles through his tears"),
    ("G01", (24, "That's", 1), "night", "close kid Noah understanding"),
    ("G02", (24, "In", 1), "grey", "the future: Ellie's room, empty and grey, the teddy alone on the bed"),
    ("G03", (25, "He", 1), "rain", "the man on his knees outside the threshold, never stepping in"),
    ("G03b", (25, "just", 1), "rain", "close: his hand on the doorframe, rain behind"),
    ("G04", (25, "close", 1), "rain", "Ellie knocks three times on his chest, her knock"),
    ("G05", (26, "He", 1), "rain", "the man starts to glow, mist rising off him"),
    ("G06", (26, "fog", 1), "rain", "wide: the mist swirls up round him"),
    ("G07", (27, "He", 1), "rain", "he looks at kid Noah over Ellie's shoulder"),
    ("G08", (28, "Saturday.", 1), "rain", "close the man talking"),
    ("G09", (28, "Don't", 1), "night", "close kid Noah nodding"),
    ("G10", (29, "Then", 1), "rain", "the empty doorway, mist drifting, Ellie holding nothing"),
    ("H01", (30, "On", 1), "lake", "the lake on a sunny Saturday: the dock, trees, the family picnic"),
    ("H02", (30, "held", 1), "lake", "close: Noah's hand holding Ellie's"),
    ("H03", (30, "She", 1), "lake", "Ellie rolls her eyes: weird; Noah grins"),
    ("H04", (31, "I", 1), "lake", "on the dock Ellie slips at the edge"),
    ("H05", (31, "go", 1), "lake", "Noah pulls her back by the hand; both laugh"),
    ("J01", (32, "That", 1), "room", "Noah's room at night: the phone buzzes, glowing"),
    ("J02", (32, "buzzed.", 1), "room", "Noah grabs the phone"),
    ("J03", (33, "The", 1), "room", "insert: the old text glitching"),
    ("J04", (33, "changed.", 1), "room", "close Noah lit by the screen, eyes wide"),
    ("J05", (34, "Now", 1), "room", "insert: She's safe. Thank you."),
    ("J06", (34, "Thank", 1), "room", "close Noah smiling through tears"),
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
    total = words[-1]["end"] + 1.1
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
    (root / "src" / "planT.gen.ts").write_text(
        "// generated by plan/plan_text.py; do not edit\n"
        f"export const FPS = {FPS};\nexport const DURATION = {round(total * FPS)};\nexport const SYNTHETIC_VO = {str(synth).lower()};\n"
        f"export const SHOTS = {json.dumps(shots)} as const;\n"
        f"export const WORDS: [string, number, number, number][] = {json.dumps(ws)};\n", encoding="utf8")
    md = ["| id | start | len | scene | note |", "|---|---|---|---|---|"]
    md += [f"| {s['id']} | {s['t']:.2f} | {s['end'] - s['t']:.2f} | {s['scene']} | {s['note']} |" for s in shots]
    (root / "plan" / "SHOTS_T.md").write_text("\n".join(md) + "\n", encoding="utf8")
    lens = [s["end"] - s["t"] for s in shots]
    print(f"{len(shots)} shots, {total:.2f} s, mean shot {sum(lens) / len(lens):.2f} s, min {min(lens):.2f}, max {max(lens):.2f}")


if __name__ == "__main__":
    main("vo/t1/timings.json")
