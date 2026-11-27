"""Shot plan of "The Mask That Shows Your Enemy": every shot starts on a WORD of the voice-over.
Writes src/planM.gen.ts and plan/SHOTS_M.md.     python plan/plan_mask.py
Scenes (= light): town (the town in its ring of mountains by day), school (the school yard / outside by day), class
(the classroom / corridor / canteen by day), roof (the school roof, noon), street (the hill street, afternoon), home
(the house at evening, warm), workshop (Grandma's mask workshop at night, candles), fest (the lantern festival at
night), pov (the same light, seen through the mask: red auras, a vignette) is a flag by id, not a scene.
tr = how the shot comes IN: cut | fade (a dissolve) | zoom (a zoom-blur) | whip (a sideways whip-pan blur)
"""
import json
from pathlib import Path

FPS = 30
# id, (line, word, nth), scene, transition in, note
SHOTS = [
    ("A01", (1, "In", 1), "school", "cut", "POV through the fox mask: the school yard, everyone glowing red; Ren's hands at the mask edge"),
    ("A02", (1, "every", 1), "town", "zoom", "wide: the town in its ring of mountains, morning, cherry trees, the school, the shrine"),
    ("A03", (1, "mask", 1), "workshop", "whip", "the shrine stand: a row of beautiful masks waiting for twelve-year-olds"),
    ("A04", (1, "They", 1), "home", "cut", "close Ren (12) holding his fox mask up, curious"),
    ("A05", (1, "anyone", 1), "town", "zoom", "POV through the mask: a stranger on the street glowing red"),
    ("A06", (1, "hurt", 1), "town", "cut", "close: the fox mask's eyes flare red"),
    ("B01", (2, "On", 1), "home", "fade", "birthday: Grandma behind Ren at home, a little cake on the table"),
    ("B02", (2, "tied", 1), "home", "cut", "Grandma ties the red cord of the fox mask behind his head"),
    ("B03", (2, "mask", 1), "home", "cut", "hero shot: Ren in the fox mask, facing us"),
    ("B04", (2, "walked", 1), "school", "whip", "Ren in the mask walks through the school gate"),
    ("B05", (2, "whole", 1), "school", "zoom", "POV: the whole school yard glowing red"),
    ("C01", (3, "teacher", 1), "class", "cut", "POV: the teacher at the board glowing red"),
    ("C02", (3, "classmates", 1), "class", "whip", "POV: the classmates at their desks glowing red, turning to look"),
    ("C03", (3, "lunch", 1), "class", "whip", "POV: the lunch lady with a ladle glowing red"),
    ("C04", (3, "All", 1), "class", "cut", "Ren pushes the mask up on his head: scared"),
    ("D01", (4, "I", 1), "street", "fade", "Ren runs home down the hill street"),
    ("D02", (4, "And", 1), "home", "zoom", "POV: Mom in the kitchen glowing the brightest red of all"),
    ("D03", (4, "She", 1), "home", "cut", "insert: a plate of curry, steaming"),
    ("D04", (4, "I", 2), "home", "cut", "Ren at the table, mask on his head, pushes the plate away; Mom worried"),
    ("E01", (5, "Only", 1), "class", "fade", "POV: the corridor, everyone red, but one boy not glowing"),
    ("E02", (5, "Haru", 1), "class", "cut", "close Haru: a warm smile, a wave (no glow)"),
    ("E03", (5, "best", 1), "home", "zoom", "insert: an old photo of two little boys"),
    ("F01", (6, "So", 1), "class", "fade", "Ren walks past classmates (red) who reach out to him; he turns away"),
    ("F02", (6, "Except", 1), "class", "cut", "Haru falls in beside him, an arm on his shoulder"),
    ("F03", (6, "We", 1), "roof", "whip", "the school roof: Ren and Haru eating lunch, the town behind"),
    ("F04", (6, "just", 1), "roof", "cut", "wide: the two boys alone on the roof, the mountains"),
    ("G01", (7, "Then", 1), "school", "fade", "low: a flowerpot on a high window ledge, wobbling"),
    ("G02", (8, "A", 1), "school", "cut", "the flowerpot falls"),
    ("G03", (8, "smashed", 1), "school", "cut", "it smashes right behind Ren; he leaps away"),
    ("G04", (8, "My", 1), "street", "whip", "Ren rides his bike down the steep hill"),
    ("G05", (8, "snapped", 1), "street", "cut", "insert: the brake cable snaps; the wheel wobbles"),
    ("G06", (8, "Somebody", 1), "street", "cut", "Ren tumbled in the grass by the bike, scared"),
    ("G08", (8, "And", 1), "street", "zoom", "POV: people gathering round him, all glowing red"),
    ("H01", (9, "Haru", 1), "street", "cut", "Haru kneels and puts his arm around Ren"),
    ("H02", (9, "Everyone's", 1), "street", "cut", "close Haru, gentle, his eyes a bit too calm"),
    ("H03", (9, "You", 1), "street", "cut", "close Ren, nodding, trusting"),
    ("J01", (10, "The", 1), "fest", "fade", "the town at night: lantern strings going up for tomorrow's festival"),
    ("J02", (10, "I", 1), "workshop", "cut", "Ren at the workshop door, candlelight inside"),
    ("J03", (10, "Hundreds", 1), "workshop", "zoom", "the workshop: walls of hundreds of masks"),
    ("J04", (10, "watching", 1), "workshop", "cut", "close: rows of mask eyes in the candlelight"),
    ("J05", (11, "I", 1), "workshop", "cut", "Ren and Grandma at her work table"),
    ("J06", (11, "She", 1), "workshop", "cut", "Grandma laughs, then stops, serious"),
    ("K01", (12, "Who", 1), "workshop", "cut", "close Grandma speaking"),
    ("K02", (12, "Red", 2), "workshop", "cut", "Grandma paints a red heart inside a mask"),
    ("K03", (12, "The", 3), "workshop", "cut", "Grandma holds up Ren's fox mask between them"),
    ("K04", (12, "would", 1), "school", "fade", "memory: the school yard, the red glows now warm, smiling"),
    ("K05", (13, "My", 1), "home", "fade", "memory: Mom glowing, smiling at him"),
    ("K06", (13, "would", 1), "workshop", "fade", "close Ren: realising, eyes wet"),
    ("L01", (14, "And", 1), "workshop", "cut", "close Grandma whispering, the candle low"),
    ("L01b", (14, "whispered", 1), "workshop", "cut", "the candle flame and the masks' eyes behind it"),
    ("L02", (14, "are", 1), "workshop", "cut", "close Ren: eyes widen"),
    ("L03", (15, "Haru", 1), "class", "zoom", "memory: Haru smiling, no glow, cold"),
    ("L04", (15, "The", 2), "school", "cut", "memory: Haru at the high window where the pot fell"),
    ("L05", (15, "accidents", 1), "street", "cut", "memory: Haru crouched by Ren's bike, cutting the brake"),
    ("M01", (16, "The", 1), "fest", "fade", "the festival: the whole town full of lanterns, the lantern tower"),
    ("M01b", (16, "town", 1), "fest", "cut", "a festival street: lanterns, stalls, crowds in yukata"),
    ("M02", (16, "Haru", 1), "fest", "cut", "Haru pulls Ren by the arm through the crowd"),
    ("M03", (16, "Come", 1), "fest", "cut", "close Haru: come on"),
    ("M04", (16, "best", 1), "fest", "whip", "low: the tall lantern tower glowing"),
    ("N01", (17, "I", 1), "fest", "cut", "Ren under the tower looks up"),
    ("N02", (17, "The", 1), "fest", "zoom", "insert: the tower ropes, cut and fraying"),
    ("N03", (18, "The", 1), "fest", "cut", "the tower cracks and tilts"),
    ("N04", (18, "and", 1), "fest", "cut", "the tower falls toward Ren, who looks up in shock"),
    ("P01", (19, "But", 1), "fest", "whip", "POV: red glows rushing in from everywhere"),
    ("P02", (19, "My", 1), "fest", "cut", "his classmates running in"),
    ("P03", (19, "My", 2), "fest", "cut", "the teacher running"),
    ("P04", (19, "My", 3), "fest", "cut", "Mom running, glowing"),
    ("P05", (19, "Every", 1), "fest", "zoom", "wide: dozens of red glows rushing to the tower"),
    ("Q01", (20, "They", 1), "fest", "cut", "they grab Ren and pull him out"),
    ("Q02", (20, "just", 1), "fest", "cut", "the tower crashes down behind them, lanterns flying; Ren safe in Mom's arms"),
    ("R01", (21, "And", 1), "fest", "fade", "Haru alone, standing still, not glowing"),
    ("R02", (21, "Not", 2), "fest", "cut", "close Haru, blank"),
    ("R03", (21, "I", 1), "fest", "cut", "Ren steps up to Haru"),
    ("S01", (22, "He", 1), "fest", "cut", "Haru takes off his cat mask"),
    ("S02", (22, "Everyone", 1), "fest", "cut", "close Haru, bitter"),
    ("S03", (22, "Nobody", 1), "fest", "cut", "close Haru, a tear"),
    ("S04", (23, "Nobody", 1), "fest", "cut", "close Haru: except you, a sad smile"),
    ("S05", (24, "Then", 1), "fest", "zoom", "the cat mask in his hand turns black, smoke curling"),
    ("S06", (24, "black", 1), "fest", "cut", "close: the black mask's eyes glow purple"),
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
    total = words[-1]["end"] + 1.3
    shots = []
    for i, (sid, (tn, wd, nth), scene, tr, note) in enumerate(SHOTS):
        t0 = 0.0 if i == 0 else find(words, tn, wd, nth)["t"]
        shots.append({"id": sid, "t": round(round(t0 * FPS) / FPS, 4), "scene": scene, "tr": tr, "note": note})
    for a, b in zip(shots, shots[1:] + [{"t": round(total * FPS) / FPS}]):
        a["end"] = b["t"]
    for s in shots:
        if s["end"] - s["t"] < 0.6 or s["end"] - s["t"] > 2.3:
            print(f"WARN {s['id']} {s['end'] - s['t']:.2f} s")
    if any(b["t"] <= a["t"] for a, b in zip(shots, shots[1:])):
        raise SystemExit("shots out of order")
    root = Path(__file__).resolve().parent.parent
    ws = [[w["w"], w["t"], w["end"], w["turn"]] for w in words]
    (root / "src" / "planM.gen.ts").write_text(
        "// generated by plan/plan_mask.py; do not edit\n"
        f"export const FPS = {FPS};\nexport const DURATION = {round(total * FPS)};\nexport const SYNTHETIC_VO = {str(synth).lower()};\n"
        f"export const SHOTS = {json.dumps(shots)} as const;\n"
        f"export const WORDS: [string, number, number, number][] = {json.dumps(ws)};\n", encoding="utf8")
    md = ["| id | start | len | scene | in | note |", "|---|---|---|---|---|---|"]
    md += [f"| {s['id']} | {s['t']:.2f} | {s['end'] - s['t']:.2f} | {s['scene']} | {s['tr']} | {s['note']} |" for s in shots]
    (root / "plan" / "SHOTS_M.md").write_text("\n".join(md) + "\n", encoding="utf8")
    lens = [s["end"] - s["t"] for s in shots]
    print(f"{len(shots)} shots, {total:.2f} s, mean shot {sum(lens) / len(lens):.2f} s, min {min(lens):.2f}, max {max(lens):.2f}")


if __name__ == "__main__":
    main("vo/m1/timings.json")
