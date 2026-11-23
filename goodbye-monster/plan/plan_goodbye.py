"""Shot plans of "The Goodbye Monster" (Part 1 and Part 2): every shot starts on a WORD of that part's voice-over.
Writes src/plan<part>.gen.ts and plan/SHOTS<part>.md.

    python plan/plan_goodbye.py 1      python plan/plan_goodbye.py 2

Scenes (= light): fog (the town at night in thick fog), home (inside the hook family's room), day (the town by day,
thin mist), class (the classroom), memory (sepia: the bus stop three / forty years ago), room (Milo's room at night),
lhx (the cliff and the lighthouse at night), lhin (inside the lighthouse), fogworld (inside the fog: grey, no sound),
dawn (the morning after: gold, no fog), card (the end card).
"""
import json, sys
from pathlib import Path

FPS = 30
PART = int(sys.argv[1]) if len(sys.argv) > 1 else 1
P1 = [
    ("A01", (1, "Never", 1), "home", "hook: inside, past the waving boy, out of the window, a little boy waves and starts to say good-; his mom slaps a hand over his mouth; lantern eyes glide past in the fog"),
    ("A02", (1, "town.", 1), "fog", "inside: mom's hand over his mouth, both frozen, staring at the window; the glow passes outside"),
    ("A03", (2, "Because", 1), "fog", "low wide street: fog rolling down the road under the streetlamps"),
    ("A04", (2, "listening.", 1), "fog", "deep in the fog two lantern eyes open"),
    ("A05", (3, "There's", 1), "fog", "the monster rises over the rooftops, low angle"),
    ("A06", (3, "It", 2), "fog", "a fog arm reaches down the street past a NO GOODBYES sign"),
    ("A07", (3, "nobody", 1), "fog", "the empty bus stop in the fog, a lost hat on the bench"),
    ("B01", (4, "So", 1), "day", "morning: neighbours pass each other, finger to lips"),
    ("B02", (5, "We", 1), "day", "two neighbours wave silently"),
    ("B03", (5, "See", 1), "day", "a dad mouths see you to his kid, then just walks away"),
    ("B05", (6, "There", 1), "day", "a NO GOODBYES sign, push in"),
    ("B06", (6, "No", 1), "day", "low angle: the signs down the street"),
    ("B07", (7, "At", 1), "class", "the classroom: the teacher points at the safe words"),
    ("B08", (7, "Catch", 1), "class", "kids chant, cheerful"),
    ("B09", (7, "Until", 1), "class", "the chalkboard"),
    ("C01", (8, "I'm", 1), "class", "close Milo at his desk, quiet, the red scarf"),
    ("C02", (8, "know", 1), "class", "Milo looks out of the window"),
    ("C03", (9, "Three", 1), "memory", "sepia dusk: the bus stop, little Milo and Mom"),
    ("C04", (9, "hugged", 1), "memory", "Mom kneels and hugs him"),
    ("C05", (10, "And", 1), "memory", "close Mom whispering"),
    ("C06", (10, "Goodbye.", 1), "memory", "close little Milo, eyes wide"),
    ("C07", (11, "The", 1), "memfog", "the fog rushes down the street at them"),
    ("C08", (11, "Two", 1), "memfog", "lantern eyes open huge behind Mom"),
    ("C09", (11, "A", 1), "memfog", "the fog wraps round Mom, her blue scarf whipping"),
    ("C10", (12, "And", 1), "memory", "little Milo alone at the bus stop, the fog thinning"),
    ("D01", (13, "Since", 1), "day", "Milo now, walking alone, head down"),
    ("D02", (13, "Not", 1), "day", "Milo alone on the bus stop bench"),
    ("D03", (14, "Except", 1), "day", "Pia slides onto the bench, grinning"),
    ("D04", (14, "loud,", 1), "day", "Pia laughs, arms wide"),
    ("D05", (14, "never", 1), "day", "Pia clicks her flashlight on under her chin; Milo almost smiles"),
    ("E01", (15, "Last", 1), "room", "night: Milo on his floor with a cardboard box"),
    ("E01b", (15, "something", 1), "room", "he lifts the lid: old photos, Mom's things"),
    ("E02", (15, "Her", 1), "room", "insert: the voice recorder in his hands"),
    ("E03", (16, "I", 1), "room", "his thumb presses play: click, a red light"),
    ("E04", (17, "Milo,", 1), "room", "close Milo listening, eyes wet"),
    ("E05", (17, "go", 1), "room", "through his window: the lighthouse beam far away in the fog"),
    ("E06", (18, "Pia", 1), "room", "Pia's flashlight taps the window: she is outside, determined"),
    ("E07", (18, "Tonight,", 1), "room", "close Pia outside the window: tonight"),
    ("F01", (19, "At", 1), "fog", "midnight: Milo and Pia tiptoe along the sidewalk, her beam cutting the fog"),
    ("F02", (19, "The", 1), "fog", "wide silent street, the lamps"),
    ("F03", (19, "fog", 1), "fog", "low: fog curling round their feet"),
    ("F04", (20, "We", 1), "fog", "the hospital; the kids small below it"),
    ("F05", (20, "In", 1), "fog", "through the window: the old man beside the bed"),
    ("F05b", (20, "old", 1), "fog", "closer: the old man in his chair beside the bed"),
    ("F06", (21, "She", 1), "fog", "close the old wife asleep"),
    ("F07", (21, "He", 1), "fog", "their hands"),
    ("F08", (22, "And", 1), "fog", "close the old man whispering"),
    ("F09", (22, "Goodbye,", 1), "fog", "Milo and Pia outside gasp"),
    ("F10", (23, "flickered.", 1), "fog", "the streetlamp flickers"),
    ("F11", (23, "poured", 1), "fog", "fog pours in through the window"),
    ("F12", (24, "Two", 1), "fog", "lantern eyes open in the ward behind him"),
    ("F13", (25, "Pia", 1), "fog", "Pia slaps her hand over Milo's mouth"),
    ("F13b", (25, "before", 1), "fog", "close Milo, eyes huge over Pia's hand"),
    ("F14", (26, "When", 1), "fog", "the window: an empty chair, the fog clearing"),
    ("G01", (27, "We", 1), "fog", "the kids run down the street"),
    ("G02", (27, "cliff.", 1), "lhx", "up the cliff path, the lighthouse towering in the fog, the beam sweeping"),
    ("G04", (28, "The", 1), "lhx", "the open door, fog spilling out"),
    ("G05", (28, "Inside,", 1), "lhin", "they step inside, the flashlight cutting the fog"),
    ("G05b", (28, "thick", 1), "lhin", "the beam swims in thick fog; the kids cough"),
    ("G06", (29, "Pia's", 1), "lhin", "the beam finds a figure"),
    ("G07", (29, "another.", 1), "lhin", "another"),
    ("G08", (29, "hundreds.", 1), "lhin", "wide: rings of frozen people in the fog"),
    ("G09", (30, "People.", 1), "lhin", "close frozen faces"),
    ("G10", (30, "Frozen,", 1), "lhin", "Milo walks between them"),
    ("G11", (31, "The", 1), "lhin", "the old man from the hospital, frozen"),
    ("G12", (31, "baker", 1), "lhin", "the frozen baker"),
    ("H01", (32, "And", 1), "lhin", "Milo pushes through; slow reveal"),
    ("H02", (32, "my", 1), "lhin", "Mom frozen in the middle, the beam on her"),
    ("H03", (33, "She", 1), "lhin", "close: the blue scarf"),
    ("H04", (33, "Her", 1), "lhin", "close Mom's face, eyes closed"),
    ("H05", (33, "But", 1), "lhin", "a tiny breath of mist"),
    ("H06", (34, "They", 1), "lhin", "Pia and Milo look at each other"),
    ("H07", (34, "They", 2), "lhin", "overhead: the rings of the kept"),
    ("H08", (35, "I", 1), "lhin", "Milo's hand touches Mom's"),
    ("H09", (35, "She", 1), "lhin", "close Milo crying"),
    ("J01", (36, "Then", 1), "lhin", "the fog on the floor shivers; low angle"),
    ("J02", (37, "The", 1), "lhin", "behind the kids the monster rises; the eyes open"),
    ("J03", (37, "behind", 1), "lhin", "Pia's beam swings up to it"),
    ("J04", (38, "And", 1), "lhin", "close Milo understanding"),
    ("J05", (38, "The", 1), "lhin", "the fog arms curl round the frozen crowd"),
    ("J06", (39, "Pia", 1), "lhin", "Pia grabs Milo's arm"),
    ("J07", (39, "Milo,", 1), "lhin", "close Pia: don't"),
    ("J08", (40, "I", 1), "lhin", "Milo looks at Mom"),
    ("J09", (40, "Then", 1), "lhin", "then at Pia"),
    ("J10", (41, "Goodbye,", 1), "lhin", "close Milo: goodbye, Pia; the fog swirls up round him, the eyes flare"),
    ("K01", (42, "To", 1), "lhin", "the fog swallows Milo; Pia reaching; flare"),
    ("K02", (43, "Subscribe,", 1), "card", "end card: SUBSCRIBE FOR PART 2, the lantern eyes in the fog"),
]
P2 = [
    ("P01", (1, "Last", 1), "fog", "recap: lantern eyes over the foggy town"),
    ("P02", (1, "saying", 1), "fog", "recap: a NO GOODBYES sign in the fog"),
    ("P03", (2, "I", 1), "lhin", "recap: Mom frozen in the lighthouse"),
    ("P04", (2, "And", 1), "lhin", "recap: Milo between Pia and Mom"),
    ("P05", (3, "Goodbye,", 1), "lhin", "close Milo: goodbye, Pia"),
    ("P06", (4, "The", 1), "lhin", "the fog spirals up round Milo"),
    ("P07", (4, "cold", 1), "lhin", "close Milo, eyes closing, the fog over him"),
    ("P08", (4, "everything", 1), "fogworld", "white-out: silence"),
    ("Q01", (5, "When", 1), "fogworld", "close Milo opening his eyes"),
    ("Q02", (5, "I", 2), "fogworld", "Milo stands up in a grey world"),
    ("Q03", (5, "A", 1), "fogworld", "wide: grey void, frozen silhouettes"),
    ("Q04", (6, "All", 1), "fogworld", "Milo walks among frozen people"),
    ("Q05", (6, "Mid-wave.", 1), "fogworld", "a man frozen mid-wave"),
    ("Q06", (6, "Mid-hug.", 1), "fogworld", "two people frozen mid-hug"),
    ("Q07", (6, "Mid-word.", 1), "fogworld", "a girl frozen mid-word"),
    ("Q09", (7, "And", 1), "fogworld", "Milo turns: Mom, frozen"),
    ("Q10", (8, "I", 1), "fogworld", "Milo holds her hand"),
    ("Q11", (8, "Her", 2), "fogworld", "her fingers twitch"),
    ("Q12", (8, "But", 1), "fogworld", "close Milo pleading"),
    ("Q13", (8, "Not", 1), "fogworld", "wide: Milo and Mom alone in the grey"),
    ("R01", (9, "Outside,", 1), "lhin", "Pia alone in the lighthouse, flashlight shaking"),
    ("R02", (9, "And", 1), "lhin", "close Pia: brave"),
    ("R03", (10, "She", 1), "lhin", "the beam finds a book on the stairs"),
    ("R04", (10, "The", 1), "lhin", "the diary in her hands"),
    ("R05", (11, "Forty", 1), "memory", "sepia, forty years ago: the young mayor and June at home in town"),
    ("R06", (11, "Her", 1), "memory", "close June smiling"),
    ("R07", (12, "One", 1), "memory", "June with a suitcase at the bus stop"),
    ("R08", (12, "She", 1), "memory", "June waves goodbye and walks away down the road"),
    ("R09", (12, "And", 1), "memory", "the empty road"),
    ("R10", (13, "The", 1), "memory", "the young mayor at the bus stop, silent"),
    ("R11", (13, "He", 1), "memory", "he stands there as the light changes, day to night"),
    ("R12", (14, "His", 1), "memory", "fog rises from his feet"),
    ("R13", (14, "turned", 1), "fog", "the fog spreads over the town"),
    ("R14", (15, "The", 1), "lhin", "Pia reading, realising"),
    ("R15", (15, "It", 1), "lhin", "the monster curled round the frozen crowd, holding on"),
    ("R16", (15, "So", 1), "lhin", "close Pia, a tear"),
    ("S01", (16, "Pia", 1), "fog", "Pia runs down the street, her beam bouncing"),
    ("S02", (16, "banging", 1), "fog", "Pia bangs on a door"),
    ("S03", (17, "Wake", 1), "fog", "Pia shouting in the street"),
    ("S04", (17, "Everyone", 1), "fog", "close Pia shouting"),
    ("S05", (18, "Lights", 1), "fog", "a window lights up"),
    ("S06", (18, "One", 1), "fog", "the street: window after window lights up"),
    ("S07", (18, "Then", 2), "fog", "townsfolk come out with lanterns"),
    ("S08", (19, "And", 1), "fog", "the line of people; at the end, the mayor"),
    ("S09", (19, "holding", 1), "fog", "close the mayor with his lantern"),
    ("T01", (20, "They", 1), "lhx", "the crowd climbs the cliff path with lanterns"),
    ("T02", (20, "cliff", 1), "lhx", "the crowd reaches the lighthouse"),
    ("T03", (21, "The", 1), "lhx", "the monster rises over the lighthouse, roaring"),
    ("T04", (21, "The", 2), "lhx", "the lantern eyes burn"),
    ("T05", (22, "Pia", 1), "lhx", "Pia steps out in front of everyone"),
    ("T06", (22, "took", 1), "lhx", "close Pia: a deep breath"),
    ("T07", (23, "On", 1), "lhx", "Pia raises her hand"),
    ("T08", (23, "One.", 1), "lhx", "the crowd, tense; the mayor at the back"),
    ("T10", (23, "Three.", 2), "lhx", "the monster lunges"),
    ("U01", (24, "Goodbye!", 1), "lhx", "the whole town shouts"),
    ("U02", (24, "whole", 1), "lhx", "faces shouting"),
    ("U03", (24, "All", 1), "lhx", "low angle: the crowd against the monster"),
    ("U04", (25, "The", 1), "lhx", "the monster swells"),
    ("U05", (25, "It", 1), "lhx", "it shakes"),
    ("U06", (25, "cracked", 1), "lhx", "cracks of light across its body"),
    ("U07", (26, "And", 1), "lhx", "it bursts into light"),
    ("U08", (26, "sparkling", 1), "lhx", "sparkles drift down over the crowd"),
    ("V01", (27, "Inside,", 1), "lhin", "inside: the fog is gone, sparkles; Milo and Mom"),
    ("V02", (27, "squeezed", 1), "lhin", "her hand squeezes his"),
    ("V03", (27, "Her", 1), "lhin", "Mom's eyes open"),
    ("V04", (28, "Milo?", 1), "lhin", "close Mom: Milo?"),
    ("V05", (28, "You", 1), "lhin", "Milo hugs her"),
    ("V06", (29, "All", 1), "lhin", "people wake, colour returning"),
    ("V07", (29, "Hugging.", 1), "lhin", "Pia runs in and hugs Milo"),
    ("V09", (29, "Laughing.", 1), "lhin", "wide: laughing"),
    ("W01", (30, "The", 1), "lhx", "the mayor alone on the lighthouse steps"),
    ("W02", (30, "holding", 1), "lhx", "the old photo of June"),
    ("W03", (31, "For", 1), "lhx", "close the mayor, a tear"),
    ("W03b", (31, "forty", 1), "lhx", "he holds the photo to his chest"),
    ("W04", (31, "Goodbye,", 1), "lhx", "he whispers goodbye, sweetheart"),
    ("W05", (32, "The", 1), "lhx", "the last fog floats up to the stars"),
    ("W06", (32, "And", 1), "lhx", "the mayor smiles"),
    ("X01", (33, "The", 1), "dawn", "morning: a neighbour takes a sign down"),
    ("X02", (33, "All", 1), "dawn", "the street with no signs, sunrise"),
    ("X03", (34, "At", 1), "dawn", "the bus stop: Mom and Milo"),
    ("X04", (34, "fixed", 1), "dawn", "Mom fixes Milo's scarf"),
    ("X05", (35, "Goodbye,", 1), "dawn", "close Mom: goodbye, Milo; sunlight, no fog"),
    ("X06", (35, "she", 1), "dawn", "wide: nothing happens; birds"),
    ("X07", (36, "And", 1), "dawn", "close Milo smiles"),
    ("X08", (36, "See", 1), "dawn", "see you tomorrow; Pia waves him over"),
    ("Y01", (37, "Turns", 1), "dawn", "Milo and Pia walk off together; Mom waves"),
    ("Y02", (37, "takes", 1), "dawn", "wide: the town in sunlight"),
    ("Y03", (38, "Never", 1), "dawn", "the lighthouse in the morning sun"),
]
SHOTS = P1 if PART == 1 else P2


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
    (root / "src" / f"plan{PART}.gen.ts").write_text(
        "// generated by plan/plan_goodbye.py; do not edit\n"
        f"export const FPS = {FPS};\nexport const DURATION = {round(total * FPS)};\nexport const SYNTHETIC_VO = {str(synth).lower()};\n"
        f"export const SHOTS = {json.dumps(shots)} as const;\n"
        f"export const WORDS: [string, number, number, number][] = {json.dumps(ws)};\n", encoding="utf8")
    md = ["| id | start | len | scene | note |", "|---|---|---|---|---|"]
    md += [f"| {s['id']} | {s['t']:.2f} | {s['end'] - s['t']:.2f} | {s['scene']} | {s['note']} |" for s in shots]
    (root / "plan" / f"SHOTS{PART}.md").write_text("\n".join(md) + "\n", encoding="utf8")
    lens = [s["end"] - s["t"] for s in shots]
    print(f"{len(shots)} shots, {total:.2f} s, mean shot {sum(lens) / len(lens):.2f} s, min {min(lens):.2f}, max {max(lens):.2f}")


if __name__ == "__main__":
    main(f"vo/p{PART}/timings.json")
