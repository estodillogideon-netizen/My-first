"""Shot plan of "The Shadow Swap": every shot starts on a WORD of the voice-over (turn = script line, word, occurrence).
Re-run after every voice change: the cuts move with the words. Writes src/plan.gen.ts (SHOTS, WORDS, DURATION) and
plan/SHOTS.md.

    python plan/plan_shadow.py vo/timings.json

Scenes (= light): home (Kai's house, morning), hall (school hallway), dark (the power cut), yard (school front, sun),
sepia (the flashback: hall / home), memory (Kai after the funeral, grey), gold (the ending at home).
Sets: home -> Home, hall/dark/sepiaHall -> Hall, yard -> Yard. Lenses live in src/shadow/shots.ts, keyed by shot id.
"""
import json, sys
from pathlib import Path

FPS = 30
SHOTS = [
    # id, (turn, word, nth), scene, note
    ("A01", (1, "In", 1), "home", "hook: Kai smiles on the patio; on the house wall behind him his shadow sits and cries"),
    ("A02", (1, "shows", 1), "home", "the crying shadow close, Kai's shoulder in the foreground"),
    ("A03", (2, "Happy", 1), "home", "the neighbour walks by smiling; her shadow dances on the garden wall"),
    ("A04", (2, "Liars?", 1), "home", "the mailman hands her a letter, all smiles; his shadow hides crossed fingers"),
    ("A05", (2, "cross", 1), "home", "close: the shadow's crossed fingers behind its back"),
    ("A06", (3, "Me?", 1), "home", "close Kai, big smile, a wave"),
    ("A07", (3, "smile", 1), "home", "Kai walks the patio grinning"),
    ("A08", (3, "And", 1), "home", "wide: Kai smiling, his shadow sitting on the ground crying"),
    ("A09", (3, "crying", 1), "home", "close the shadow sobbing, tears dripping"),
    ("B01", (4, "Every", 1), "home", "Mom at the open door, Kai on the step with his backpack"),
    ("B02", (4, "How", 1), "home", "close Mom: how are you, Kai?"),
    ("B03", (4, "I", 1), "home", "close Kai: thumbs up, I'm fine"),
    ("B04", (4, "And", 1), "home", "low two-shot: Kai grinning, Mom; behind him his shadow sobs into its hands"),
    ("B05", (4, "sobs", 1), "home", "the shadow sobs; Mom's shadow wrings its hands (she knows)"),
    ("C01", (5, "At", 1), "hall", "hallway wide: kids at the lockers, every shadow doing something"),
    ("C02", (6, "Jay's", 1), "hall", "Jay leans, cool; his shadow flexes huge muscles"),
    ("C03", (6, "Priya's", 1), "hall", "Priya walks past with a book; her shadow hides its face, hearts float up"),
    ("C04", (6, "Even", 1), "hall", "the teacher stands stern at the door; his shadow yawns and stretches"),
    ("C05", (7, "Mine", 1), "hall", "Kai at his locker, smiling; his shadow sits on the floor crying"),
    ("C06", (7, "In", 1), "hall", "the kids turn and stare at Kai's shadow"),
    ("C07", (8, "So", 1), "hall", "close Kai: a sly, determined look"),
    ("C08", (9, "stand", 1), "hall", "Kai steps under the dead light: his shadow fades"),
    ("C09", (9, "hide", 1), "hall", "Kai hides behind a column of lockers, peeking"),
    ("C10", (9, "eat", 1), "hall", "under the stairs in the dark: Kai eats his sandwich alone"),
    ("C11", (10, "No", 1), "hall", "close Kai in the dark, chewing, small smile"),
    ("C12", (10, "No", 3), "hall", "from the nook: kids walk past without noticing"),
    ("D01", (11, "Only", 1), "hall", "Kai walks the hall; kids stare"),
    ("D02", (11, "Mr.", 1), "hall", "Mr. Ollie mopping: the cap, the beard, a kind face"),
    ("D03", (12, "Every", 1), "hall", "wide: Ollie mops the hall, music notes float"),
    ("D04", (12, "humming", 1), "hall", "close Ollie humming, eyes closed"),
    ("D05", (13, "And", 1), "hall", "Kai at his locker finds a note"),
    ("D06", (13, "Rough", 1), "hall", "insert: the notes ROUGH DAY? and HANG IN THERE"),
    ("D08", (14, "I", 1), "hall", "Kai pockets the note, looks down the hall at Ollie, who nods"),
    ("E01", (15, "Then", 1), "hall", "Friday: Kai at his locker, the lights flicker"),
    ("E02", (15, "power", 1), "dark", "the lights go out: the hall goes dark, kids gasp"),
    ("F01", (16, "Everyone", 1), "yard", "the school door: kids stream out into the sun"),
    ("F02", (16, "Into", 1), "yard", "Kai steps out, squinting, worried"),
    ("F03", (16, "Every", 1), "yard", "wide: the school wall, a row of shadows doing things; Kai's sits crying"),
    ("F04", (17, "Kids", 1), "yard", "kids point at Kai's shadow"),
    ("F05", (17, "Somebody", 1), "yard", "Jay laughs; his shadow laughs too"),
    ("F06", (18, "I", 1), "yard", "close Kai: the smile cracks, he shrinks"),
    ("F07", (19, "Then", 1), "yard", "Mr. Ollie walks out of the door with his mop"),
    ("F08", (19, "stood", 1), "yard", "two-shot: Ollie stands right next to Kai in the sun"),
    ("F09", (20, "And", 1), "yard", "close Kai looks at the wall: something's off"),
    ("F10", (21, "Mr.", 1), "yard", "wide wall: Kai's shadow, and behind Ollie: nothing (push to the empty wall)"),
    ("F12", (21, "Not", 1), "yard", "low: their shoes. Kai's shadow at his heels, nothing at Ollie's"),
    ("F13", (22, "Where's", 1), "yard", "close Kai looks up at Ollie: where's your shadow?"),
    ("F14", (23, "He", 1), "yard", "Ollie leans on his mop and smiles"),
    ("F15", (23, "I", 1), "yard", "close Ollie: I gave it away"),
    ("F16", (23, "long", 1), "yard", "Ollie looks up, remembering; slow push"),
    ("G01", (24, "There", 1), "sepia", "flashback hall: a boy sits against the lockers, head down, a huge heavy shadow over him"),
    ("G02", (24, "His", 1), "sepia", "close the boy crying"),
    ("G03", (24, "he", 1), "sepia", "young Ollie with his mop sees him"),
    ("G04", (25, "So", 1), "sepia", "young Ollie kneels; his shadow steps off the wall toward the boy"),
    ("G05", (25, "It", 1), "sepia", "Ollie's shadow sits by the boy's and takes the sadness; the boy stands up"),
    ("G06", (26, "When", 1), "sepiaHome", "the boy grown up on the porch with little Kai; the shadow keeps watch"),
    ("H01", (27, "He", 1), "yard", "Ollie looks at Kai's crying shadow"),
    ("H02", (27, "Then", 1), "yard", "close Ollie turns to Kai"),
    ("H03", (27, "smile", 1), "yard", "close Ollie: you smile just like your father"),
    ("H04", (28, "That", 1), "yard", "close Kai: realisation"),
    ("H05", (29, "Dad", 1), "memory", "grey memory: Kai on the porch holding Dad's photo, Mom's hand on his shoulder"),
    ("H06", (29, "And", 1), "memory", "close Kai smiling bravely"),
    ("H07", (29, "smiled,", 1), "memory", "neighbours pat Kai; he smiles; behind him his shadow sobs"),
    ("H08", (30, "But", 1), "yard", "the yard wall: Kai's shadow crying"),
    ("H09", (30, "It", 1), "yard", "close Kai, eyes welling"),
    ("J01", (31, "Mr.", 1), "yard", "Ollie kneels down in front of Kai"),
    ("J02", (31, "How", 1), "yard", "close Ollie: how are you, Kai? Really?"),
    ("J03", (32, "And", 1), "yard", "close Kai: the smile falls"),
    ("J03b", (32, "didn't", 1), "yard", "close Kai: no more smile"),
    ("J04", (33, "I'm", 1), "yard", "close Kai: I'm not okay"),
    ("J05", (33, "miss", 1), "yard", "two-shot: I miss my dad"),
    ("J06", (34, "And", 1), "yard", "close Kai crying, real tears"),
    ("J07", (34, "Big,", 1), "yard", "Ollie hugs Kai"),
    ("K01", (35, "And", 1), "yard", "the wall: behind them, Kai's shadow stops crying"),
    ("K02", (35, "stopped", 1), "yard", "close: the shadow lifts its head"),
    ("K03", (36, "It", 1), "yard", "the shadow wipes its face"),
    ("K04", (36, "It", 2), "yard", "the shadow stands up"),
    ("K05", (36, "walked", 1), "yard", "wide: the shadow walks along the wall to Ollie"),
    ("K06", (37, "And", 1), "yard", "the shadow hugs Ollie; Ollie closes his eyes"),
    ("K07", (37, "After", 1), "yard", "close Ollie, tears and a smile; the shadow becomes his"),
    ("K08", (37, "finally", 1), "yard", "Ollie waves; his shadow waves with him"),
    ("L01", (38, "Then", 1), "yard", "Kai looks down"),
    ("L02", (38, "At", 1), "yard", "low: at his feet a small new shadow rises on the wall"),
    ("L03", (38, "Small.", 1), "yard", "the small shadow wipes its eyes and waves shyly; Kai smiles through tears"),
    ("L04", (39, "Two", 1), "yard", "wide: Kai and Ollie side by side, two shadows side by side"),
    ("L05", (39, "Holding", 1), "yard", "the shadows hold hands; Kai takes Ollie's hand"),
    ("M01", (40, "Now", 1), "gold", "home, evening: Mom kneels to Kai"),
    ("M02", (40, "I", 2), "gold", "close Kai telling her the truth"),
    ("M03", (41, "Some", 1), "gold", "on the step: Kai sits, his small shadow cries beside him"),
    ("M04", (41, "But", 1), "gold", "Kai cries with it, Mom's arm round him; their shadows lean together"),
    ("M05", (42, "Turns", 1), "gold", "wide: the porch at sunset, the shadows hug"),
    ("M06", (42, "lighter", 1), "gold", "the shadows stand, hold hands, lighter; Ollie passes on the sidewalk and waves"),
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
    (root / "src" / "plan.gen.ts").write_text(
        "// generated by plan/plan_shadow.py; do not edit\n"
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
