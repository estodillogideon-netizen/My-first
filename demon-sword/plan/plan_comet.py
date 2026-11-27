"""Shot plan of "The Comet Swap": every shot starts on a WORD of the voice-over.
Writes src/planC.gen.ts and plan/SHOTS_C.md.     python plan/plan_comet.py
Scenes (= light): city (the city in its ring of mountains at night, the comet), room (the bedroom at night, comet light
through the window), swap (the blue swap light), then (Mira's bedroom 25 years ago, winter morning), past (the town
25 years ago by day, snow), school (the old classroom), now (Kai's bedroom by day), home (the living room / kitchen by
day), homenight (the house at night), lake (the frozen lake under the mountains at night, the comet), white (the flash).
"""
import json, sys
from pathlib import Path

FPS = 30
SHOTS = [
    ("A01", (1, "In", 1), "room", "close Kai at his window at night, the comet's blue light on his face"),
    ("A02", (1, "when", 1), "city", "wide: the city in its ring of snowy mountains, the blue comet over it"),
    ("A03", (1, "two", 1), "city", "the comet over the rooftops, its blue light sweeping into windows"),
    ("A05", (1, "And", 1), "swap", "close Kai asleep: blue sparks spiral round him"),
    ("A06", (1, "swapped", 1), "swap", "the swap: a blue-white flash, sparks rushing"),
    ("A07", (1, "girl", 1), "then", "close: a girl asleep (Mira) lit by blue sparks"),
    ("B01", (2, "I", 1), "then", "Mira (Kai inside) jolts awake and sits up in bed"),
    ("B03", (2, "in", 1), "then", "she looks round: the same bedroom, but old"),
    ("B04", (2, "But", 1), "then", "close: confused, a sweat drop"),
    ("B05", (3, "Old", 1), "then", "insert: the old flowery wallpaper"),
    ("B06", (3, "A", 1), "then", "insert: an old radio on the dresser"),
    ("B07", (3, "A", 2), "then", "insert: the wall calendar, 25 years ago"),
    ("B07b", (3, "years", 1), "then", "close Mira (Kai inside): realising, wide eyes"),
    ("B08", (4, "On", 1), "then", "Mira at the desk picks up a notebook"),
    ("B09", (4, "Mira", 1), "then", "insert: the notebook: MIRA HALE, AGE 12"),
    ("B10", (5, "Her", 1), "then", "Leo bursts in and jumps on the bed"),
    ("B12", (5, "Pancakes", 1), "then", "Mira startled, then a small smile"),
    ("C01", (6, "I", 1), "past", "Mira walks to school down the snowy old street"),
    ("C02", (6, "school", 1), "school", "the old classroom: Mira at her desk"),
    ("C04", (7, "Then", 1), "city", "the comet fading over the mountains"),
    ("C05", (7, "and", 1), "now", "Kai jolts awake in his own bed, checks his hands"),
    ("D01", (8, "I", 1), "now", "Kai at his laptop, searching"),
    ("D02", (8, "No", 1), "now", "insert: the screen: Mira Hale, 0 results"),
    ("D03", (8, "Anywhere", 1), "now", "Kai slumps at the desk, gloom"),
    ("D04", (9, "So", 1), "now", "Kai writes a note"),
    ("D05", (9, "hid", 1), "now", "insert: he lifts the loose floorboard and slips the note in"),
    ("E01", (10, "The", 1), "city", "the comet over the city again"),
    ("E02", (10, "swapped", 1), "swap", "the swap flash over Kai's bed"),
    ("E03", (10, "And", 1), "now", "morning: Kai lifts the floorboard"),
    ("E04", (10, "was", 1), "now", "insert: a folded yellow note in the floor"),
    ("E05", (11, "The", 1), "now", "insert: the old yellow paper, worn edges"),
    ("E06", (11, "Who", 1), "now", "insert: the note: WHO ARE YOU? AND WHY IS YOUR WRITING IN MY FLOOR?"),
    ("E07", (11, "why", 1), "now", "Kai reading, amazed, sparkly eyes"),
    ("F01", (12, "We", 1), "now", "Kai writing back, laughing"),
    ("F02", (12, "She", 1), "then", "Mira at her desk by lamplight writing, smiling"),
    ("F03", (12, "best", 1), "now", "Kai lying on the floor reading a note, blushing smile"),
    ("F04", (13, "Then", 1), "now", "insert: a note in shaky writing"),
    ("F05", (13, "scared", 1), "now", "close Kai: shock"),
    ("G01", (14, "My", 1), "then", "Mira at night writing, worried"),
    ("G02", (14, "sneaking", 1), "homenight", "Leo sneaks out of the front door in his winter coat"),
    ("G03", (14, "frozen", 1), "lake", "the frozen lake under the mountains at night"),
    ("G04", (14, "He", 1), "lake", "tiny Leo on the ice looking up at the comet"),
    ("G05", (15, "Leo", 1), "now", "close Kai, frozen, realising"),
    ("H01", (16, "had", 1), "home", "Mom at the living room window"),
    ("H02", (16, "named", 1), "home", "insert: an old photo of a girl and a little boy"),
    ("H03", (16, "He", 1), "lake", "dark: the ice cracking"),
    ("H04", (16, "On", 1), "city", "the comet, ominous"),
    ("H05", (17, "Mom", 1), "home", "Mom looks away out of the window, sad; Kai watching"),
    ("H06", (18, "Mom's", 1), "home", "Kai finds an old notebook in a box"),
    ("H07", (18, "Mira", 1), "home", "insert: the same notebook, old and worn: MIRA HALE"),
    ("H08", (19, "The", 1), "home", "close Kai: shock, hands on his head"),
    ("J01", (20, "The", 1), "city", "the comet huge and bright over the city"),
    ("J02", (20, "I", 1), "then", "Mira (Kai inside) wakes up, determined"),
    ("J03", (20, "Leo's", 1), "then", "Leo's bed empty, the window open, snow blowing in"),
    ("J04", (21, "I", 1), "past", "Mira runs out into the snowy street at night, the comet above"),
    ("J06", (21, "Down", 1), "lake", "she runs down the hill through the pines to the lake"),
    ("K01", (22, "He", 1), "lake", "wide: Leo in the middle of the ice"),
    ("K02", (22, "looking", 1), "lake", "close Leo, awed, the comet in his eyes"),
    ("K04", (22, "Then", 1), "lake", "the ice breaks, Leo falls in"),
    ("K05", (23, "I", 1), "lake", "Mira slides across the ice to the hole"),
    ("K07", (23, "I", 2), "lake", "their hands grab; Mira pulls Leo out of the water"),
    ("L01", (24, "We", 1), "lake", "from above: the two lying in the snow, breathing fog"),
    ("L02", (24, "under", 1), "lake", "the comet over them"),
    ("L04", (25, "Then", 1), "white", "everything goes white"),
    ("M01", (26, "I", 1), "now", "Kai wakes up in his bed, morning sun"),
    ("M02", (26, "It", 1), "home", "Kai sniffs, curious, walks into the kitchen"),
    ("M03", (27, "At", 1), "home", "the kitchen table: a man with pancakes"),
    ("M04", (27, "man", 1), "home", "close: the man, a warm grin"),
    ("M05", (27, "Morning", 1), "home", "Uncle Leo waves: morning, kid"),
    ("M06", (27, "Uncle", 1), "home", "close Kai: shock, sparkly eyes"),
    ("N01", (28, "Mom", 1), "home", "close Mom, tears, smiling"),
    ("N02", (28, "She", 1), "home", "insert: the old yellow note sliding across the table"),
    ("N03", (28, "across", 1), "home", "Kai picks up the note, stunned"),
    ("N04", (29, "I", 1), "home", "Mom talking, crying, smiling"),
    ("N05", (29, "meet", 1), "home", "Kai hugs Mom, Uncle Leo smiling behind"),
    ("P01", (30, "whispered", 1), "home", "Mom leans in to whisper, serious"),
    ("P02", (30, "comet", 1), "city", "the comet rising over the mountains at dusk"),
    ("P03", (30, "And", 1), "home", "close Mom's eyes, worried"),
    ("P05", (30, "saw", 1), "room", "Kai at his window, fear, the comet over the city, ominous"),
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
    (root / "src" / "planC.gen.ts").write_text(
        "// generated by plan/plan_comet.py; do not edit\n"
        f"export const FPS = {FPS};\nexport const DURATION = {round(total * FPS)};\nexport const SYNTHETIC_VO = {str(synth).lower()};\n"
        f"export const SHOTS = {json.dumps(shots)} as const;\n"
        f"export const WORDS: [string, number, number, number][] = {json.dumps(ws)};\n", encoding="utf8")
    md = ["| id | start | len | scene | note |", "|---|---|---|---|---|"]
    md += [f"| {s['id']} | {s['t']:.2f} | {s['end'] - s['t']:.2f} | {s['scene']} | {s['note']} |" for s in shots]
    (root / "plan" / "SHOTS_C.md").write_text("\n".join(md) + "\n", encoding="utf8")
    lens = [s["end"] - s["t"] for s in shots]
    print(f"{len(shots)} shots, {total:.2f} s, mean shot {sum(lens) / len(lens):.2f} s, min {min(lens):.2f}, max {max(lens):.2f}")


if __name__ == "__main__":
    main("vo/c1/timings.json")
