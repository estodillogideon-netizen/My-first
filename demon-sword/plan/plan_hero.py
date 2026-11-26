"""Shot plan of "The Villain Card": every shot starts on a WORD of the voice-over.
Writes src/planH.gen.ts and plan/SHOTS_H.md.     python plan/plan_hero.py
Scenes (= light): hall (Card Day in the school hall: warm stage light, spotlights), red (the hall flooded red by the
villain card), school (the locker corridor / the classroom by day), street (the town by day), home (the living room by
day), night (Noah's room at night, the red card glowing), yard (the school yard at lunch, sunny), square (Hero Day in
the town square, bright festival), dark (the square under the machine: storm dark, red eye light), dust (the square
after the crash: golden dust, sunset), maxroom (Max's room at night, the card turning red).
"""
import json, sys
from pathlib import Path

FPS = 30
SHOTS = [
    ("A01", (1, "In", 1), "hall", "close Noah holding his sealed card, light leaking from the seam"),
    ("A02", (1, "you", 1), "hall", "wide: Card Day in the school hall, the stage, the banner, kids lined up"),
    ("A03", (1, "It", 1), "hall", "insert: the sealed card, gold sparks and red smoke swirling round it"),
    ("A04", (1, "Hero", 1), "hall", "a girl on stage: her card bursts gold"),
    ("A05", (1, "villain", 1), "red", "a red flicker over Noah's worried face"),
    ("B01", (2, "My", 1), "hall", "Max steps up to the stage, grinning, card in hand"),
    ("B02", (2, "opened", 1), "hall", "close Max tearing the card open: gold light bursts out, rays"),
    ("B03", (2, "Gold", 1), "hall", "insert: the gold HERO card, SUPER SPEED, sparkles"),
    ("B04", (2, "Super", 1), "hall", "Max zooms round the hall in a streak, speed lines"),
    ("B05", (2, "The", 1), "hall", "the crowd cheers, confetti"),
    ("C01", (3, "Then", 1), "hall", "Noah on stage, nervous, sweat drop, opening his card"),
    ("C02", (4, "It", 1), "red", "close: the card opening, red light floods his face and the hall"),
    ("C04", (5, "Villain", 1), "red", "insert: the red VILLAIN card, cracked letters, smoke"),
    ("C05", (5, "you", 1), "red", "close Noah: shock, gloom lines; his hand on the podium cracks it"),
    ("D01", (6, "The", 1), "red", "the crowd silent, shocked faces"),
    ("D02", (6, "Max", 1), "red", "Max steps back, nervous"),
    ("D03", (6, "He", 1), "red", "Max turns his face away; Noah's sad face"),
    ("E01", (7, "By", 1), "school", "the locker corridor: kids staring at Noah's locker"),
    ("E01b", (7, "said", 1), "school", "close: the locker sprayed VILLAIN in red, Noah's sad face"),
    ("E02", (7, "Kids", 1), "street", "the street: kids cross to the other side as Noah walks"),
    ("E03", (7, "saw", 1), "street", "close Noah walking alone, gloom"),
    ("E04", (8, "Even", 1), "school", "the classroom: the teacher eyes Noah nervously"),
    ("E04b", (8, "desk", 1), "school", "the teacher drags Noah's desk to the back"),
    ("E05", (8, "Right", 1), "school", "Noah at the back desk next to the fire extinguisher, deadpan"),
    ("F01", (9, "So", 1), "street", "Noah determined, fist up"),
    ("F02", (10, "I", 1), "street", "Noah runs up to old Mrs. Lee, struggling with her bags"),
    ("F02b", (10, "carry", 1), "street", "Noah carries her grocery bags, smiling"),
    ("F03", (10, "The", 1), "street", "the bag rips, groceries tumble"),
    ("F04", (10, "Eggs", 1), "street", "eggs splatter, Mrs. Lee shocked, Noah sweating"),
    ("F05", (11, "I", 1), "school", "Noah at the class computer, fixing it"),
    ("F06", (11, "It", 1), "school", "the computer bursts into flames, Noah shocked"),
    ("F07", (12, "I", 1), "home", "Noah hugs his mom in the living room"),
    ("F08", (12, "and", 1), "home", "her necklace snaps, beads flying"),
    ("G01", (13, "Every", 1), "night", "Noah's room at night, Noah on his bed"),
    ("G01b", (13, "stared", 1), "night", "close: the red card glowing in his hands"),
    ("G02", (13, "asked", 1), "night", "close Noah: why me?"),
    ("G03", (13, "It", 2), "night", "insert: the red card, silent, glow pulsing"),
    ("G04", (14, "So", 1), "home", "close: Noah pulls on black gloves"),
    ("G05", (14, "Every", 1), "street", "Noah in the summer sun with gloves on, kids in t-shirts"),
    ("H01", (15, "The", 1), "yard", "the school yard at lunch: Noah alone on a bench"),
    ("H01b", (15, "was", 1), "yard", "Ellie skips over and sits down next to him"),
    ("H02", (15, "Ellie", 1), "yard", "close Ellie, sparkly smile, a cookie"),
    ("H03", (15, "Villains", 1), "yard", "Ellie talking, holding out the cookie"),
    ("H04", (15, "So", 1), "yard", "Noah takes the cookie, a small blushing smile"),
    ("J01", (16, "Then", 1), "square", "the town square: the HERO DAY stage, heroes in capes, crowd, balloons"),
    ("J02", (16, "Every", 1), "square", "Max on stage in a hero pose, cape flying"),
    ("J03", (16, "on", 1), "square", "Noah and Ellie at the back of the crowd"),
    ("J04", (17, "And", 1), "dark", "the sky goes dark: clouds roll in, everyone looks up"),
    ("K01", (18, "A", 1), "dark", "the giant machine rises behind the roofs"),
    ("K02", (18, "Metal", 1), "dark", "its metal arms unfold"),
    ("K03", (18, "One", 1), "dark", "close: one red eye opens"),
    ("K04", (19, "The", 1), "dark", "the heroes leap into action"),
    ("K05", (19, "Lasers", 1), "dark", "a hero fires lasers"),
    ("K06", (19, "Ice", 1), "dark", "a hero blasts ice"),
    ("K07", (19, "Super", 1), "dark", "a strong hero punches the machine's leg: impact ring"),
    ("K08", (19, "Nothing", 1), "dark", "not a scratch; the eye glares"),
    ("L01", (20, "It", 1), "dark", "beams pull glowing powers out of the heroes"),
    ("L02", (20, "One", 1), "dark", "the heroes collapse"),
    ("L03", (20, "Max", 1), "dark", "Max on the ground, trying to stand"),
    ("L04", (21, "Then", 1), "dark", "a claw comes down"),
    ("L05", (21, "grabbed", 1), "dark", "the claw grabs Ellie and lifts her"),
    ("L06", (22, "Everyone", 1), "dark", "the crowd runs"),
    ("M01", (23, "I", 1), "dark", "Noah stands still in the running crowd"),
    ("M02", (24, "I", 1), "dark", "close: Noah pulls off his gloves, red sparks"),
    ("M03", (25, "I", 1), "dark", "Noah slams both hands on the machine's leg"),
    ("M04", (25, "and", 1), "dark", "red cracks spread from his hands across the metal"),
    ("M05", (26, "The", 1), "dark", "the arms snap and fall"),
    ("M06", (26, "The", 2), "dark", "the eye shatters"),
    ("M07", (26, "whole", 1), "dark", "the whole machine crashes down"),
    ("N01", (27, "The", 1), "dust", "glowing powers fly back into the heroes"),
    ("N02", (27, "Max", 1), "dust", "Max shoots across the square in a streak"),
    ("N03", (27, "caught", 1), "dust", "Max catches Ellie"),
    ("N04", (28, "Then", 1), "dust", "quiet: the dust settles, everyone stares at Noah"),
    ("P01", (29, "Max", 1), "dust", "Max walks up to Noah with Ellie"),
    ("P02", (29, "You", 1), "dust", "close Max: you saved us"),
    ("P03", (30, "In", 1), "dust", "Noah's pocket glows"),
    ("P04", (30, "card", 1), "dust", "Noah pulls out the glowing card"),
    ("P05", (31, "The", 1), "dust", "insert: the card, red fading to gold, letters changing"),
    ("P06", (32, "Hero", 1), "dust", "insert: HERO, a gold burst"),
    ("P07", (33, "Turns", 1), "dust", "Noah smiles, Ellie hugs him, the crowd cheers"),
    ("P08", (33, "Just", 1), "dust", "wide: the three of them in the golden square"),
    ("Q01", (34, "But", 1), "maxroom", "Max's room at night, his card on the desk"),
    ("Q02", (34, "Max's", 1), "maxroom", "insert: the card turning red"),
    ("Q03", (34, "red", 1), "maxroom", "close Max lit red, shocked"),
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
    (root / "src" / "planH.gen.ts").write_text(
        "// generated by plan/plan_hero.py; do not edit\n"
        f"export const FPS = {FPS};\nexport const DURATION = {round(total * FPS)};\nexport const SYNTHETIC_VO = {str(synth).lower()};\n"
        f"export const SHOTS = {json.dumps(shots)} as const;\n"
        f"export const WORDS: [string, number, number, number][] = {json.dumps(ws)};\n", encoding="utf8")
    md = ["| id | start | len | scene | note |", "|---|---|---|---|---|"]
    md += [f"| {s['id']} | {s['t']:.2f} | {s['end'] - s['t']:.2f} | {s['scene']} | {s['note']} |" for s in shots]
    (root / "plan" / "SHOTS_H.md").write_text("\n".join(md) + "\n", encoding="utf8")
    lens = [s["end"] - s["t"] for s in shots]
    print(f"{len(shots)} shots, {total:.2f} s, mean shot {sum(lens) / len(lens):.2f} s, min {min(lens):.2f}, max {max(lens):.2f}")


if __name__ == "__main__":
    main("vo/h1/timings.json")
