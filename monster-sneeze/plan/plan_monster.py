"""Shot plan of "Monsters Are Allergic to Laughter": every shot starts on a WORD of the voice-over (turn = script line,
word, occurrence). Re-run after every voice change: the cuts move with the words. Writes src/plan.gen.ts (SHOTS, WORDS,
DURATION) and plan/SHOTS.md.

    python plan/plan_monster.py vo/timings.json

Scenes (= light): night (Lily's bedroom at night: moonlight + the warm night-light), day (the bedroom in the morning),
club (the Underbed: the monsters' den), street (the moving truck, morning), quiet (the sad week: cold, dim),
warm (the ending: the lamp on, cosy). Sets: night/day/quiet/warm -> Bedroom, club -> Club, street -> Street.
Lenses live in src/monster/shots.ts, keyed by shot id.
"""
import json, sys
from pathlib import Path

FPS = 30
SHOTS = [
    # id, (turn, word, nth), scene, note
    ("A01", (1, "In", 1), "night", "hook: dark bedroom from the floor, Lily asleep above; two glowing eyes open under the bed"),
    ("A02", (1, "monster", 1), "night", "close under the bed: Bo's big eyes blink in the dark"),
    ("A03", (2, "And", 1), "night", "Lily in bed with a flashlight and a joke book, starting to giggle"),
    ("A04", (2, "one", 1), "night", "under the bed: Bo's nose twitches, eyes water"),
    ("A05", (3, "One", 1), "night", "Bo sneezes: ACHOO, his fur puffs out"),
    ("A06", (3, "Two", 1), "night", "Bo scratches all over, fur flying"),
    ("A07", (4, "I'm", 1), "night", "close Bo, shy little wave: the hero"),
    ("A08", (4, "under", 1), "night", "close Lily giggling, pigtails bouncing"),
    ("A09", (4, "kid", 1), "day", "the bedroom in the morning, Lily bouncing on her bed laughing"),
    ("B01", (5, "Lily", 1), "day", "Lily on her belly laughing at a tablet"),
    ("B02", (5, "Pancakes.", 1), "day", "Lily laughing at a pancake with a smiley face"),
    ("B03", (5, "own", 1), "day", "Lily wiggles her bare toes and cracks up"),
    ("B04", (6, "And", 1), "day", "under the bed: Bo winds up, ah... ah..."),
    ("B05", (6, "sneeze", 1), "day", "wide: CHOO, the whole bed bounces with Lily on it"),
    ("B06", (7, "earmuffs.", 1), "day", "Bo under the bed in fluffy earmuffs, hopeful"),
    ("B07", (7, "tiny", 1), "day", "Bo in a tiny gas mask"),
    ("B08", (7, "slept", 1), "day", "the dresser's sock drawer: Bo crammed inside, socks on his head"),
    ("B09", (8, "Nothing", 1), "day", "Lily giggles; Bo sneezes out of the drawer, socks fly"),
    ("C01", (9, "Every", 1), "club", "the Underbed: a den of lost socks, toy blocks and night-lights; monsters gather"),
    ("C01b", (9, "meet", 1), "club", "Bo squeezes in through a gap between two bed legs; the others wave"),
    ("C02", (10, "Grizzle", 1), "club", "Grizzle: big, green, one eye, shaggy"),
    ("C03", (10, "sleeps", 1), "club", "Grizzle dozes, a happy snore"),
    ("C04", (11, "Pip", 1), "club", "Pip: small, orange, antennae, smug"),
    ("C05", (11, "She", 1), "club", "Pip polishes her clean nose, proud"),
    ("C06", (12, "And", 1), "club", "Bo sits apart on a toy block, red nose, tissue"),
    ("C07", (12, "Sneezy", 1), "club", "the others turn and point at Bo"),
    ("C08", (13, "Sneezy", 1), "club", "Grizzle and Pip teasing, slapping knees"),
    ("C09", (13, "Every", 1), "club", "Bo hides his face behind a sock"),
    ("C10", (14, "All", 1), "night", "back under the bed: Bo lies looking up at the slats, sighs"),
    ("D01", (15, "Then", 1), "street", "morning street: a big moving truck pulls up next door"),
    ("D02", (16, "Lily's", 1), "street", "Lily and Rosie hug on the sidewalk"),
    ("D03", (16, "moving", 1), "street", "boxes in the truck, Rosie's dad loading"),
    ("D04", (17, "Lily", 1), "street", "the truck drives away; Lily waves and waves"),
    ("D05", (17, "She", 1), "street", "close Lily: sad, no laugh"),
    ("E01", (18, "That", 1), "quiet", "night: Lily in bed facing the wall, the room cold and still"),
    ("E02", (18, "No", 2), "quiet", "under the bed: Bo waits for a sneeze that never comes"),
    ("E03", (18, "Just", 1), "quiet", "wide quiet room, the moon through the window"),
    ("E04", (19, "The", 1), "quiet", "the calendar on the wall: days crossed off"),
    ("E05", (19, "And", 1), "quiet", "Bo under the bed, bored, chin on his paws"),
    ("E06", (19, "whole", 1), "quiet", "Bo rolls over, stares up"),
    ("E07", (20, "I", 1), "quiet", "Bo stretches out, relaxed... then frowns"),
    ("E08", (20, "So", 1), "quiet", "close Bo: something's wrong"),
    ("F01", (21, "Then", 1), "quiet", "Bo's ears perk"),
    ("F02", (21, "sound", 1), "quiet", "Bo looks up at the bed slats"),
    ("F03", (21, "Lily", 1), "quiet", "above: Lily crying under her blanket, shaking"),
    ("F04", (22, "And", 1), "quiet", "close Bo, eyes wide: realising"),
    ("F05", (22, "I", 2), "quiet", "Bo holds the tissue box, sad"),
    ("F06", (23, "I", 1), "quiet", "Bo touches the slats from below"),
    ("F07", (23, "even", 1), "quiet", "close Bo, a small sad smile"),
    ("G01", (24, "So", 1), "quiet", "Bo crawls out from under the bed, determined"),
    ("G02", (25, "I", 1), "quiet", "Bo stands in the moonlight, fist clenched"),
    ("G03", (25, "On", 1), "quiet", "Bo tiptoes past sleeping Lily"),
    ("G04", (26, "Night", 1), "quiet", "Bo on the floor drawing with crayons"),
    ("G04b", (26, "by", 1), "quiet", "Bo tiptoes and lays the drawings by her pillow"),
    ("G05", (26, "cat", 1), "quiet", "insert: a cat in a bow tie, next to her pillow"),
    ("G06", (26, "pickle", 1), "quiet", "insert: a pickle with a mustache"),
    ("G07", (27, "She", 1), "day", "morning: Lily holds the drawings, the tiniest smile"),
    ("G08", (28, "Night", 1), "quiet", "night two: Bo under the bed working strings"),
    ("G09", (28, "dance", 1), "quiet", "wide: socks hop and dance across the floor"),
    ("G10", (29, "She", 1), "quiet", "Lily peeks over the blanket at the socks, then rolls back over; Bo slumps"),
    ("H01", (30, "Night", 1), "quiet", "night three: Bo slides out, all in"),
    ("H02", (30, "borrowed", 1), "quiet", "Bo pulls on the curly wig"),
    ("H03", (30, "put", 1), "quiet", "Bo pokes a sock onto his horn"),
    ("H04", (30, "danced.", 1), "quiet", "Bo dances in the moonlight, wig bouncing"),
    ("H05", (31, "Lily", 1), "quiet", "Lily lifts the blanket"),
    ("H06", (31, "And", 1), "quiet", "Lily's view: Bo frozen mid-dance"),
    ("H07", (32, "A", 1), "quiet", "Bo frozen, awkward grin, push in"),
    ("H07b", (32, "In", 1), "quiet", "close: the wig slips over one eye"),
    ("H08", (33, "For", 1), "quiet", "two-shot standoff: nothing happens"),
    ("J01", (34, "Then", 1), "warm", "Lily bursts out laughing; the room warms"),
    ("J02", (34, "biggest", 1), "warm", "Lily rolls on the bed laughing"),
    ("J03", (35, "And", 1), "warm", "Bo winds up: ah... ah..."),
    ("J04", (35, "flew", 1), "warm", "CHOO: Bo rockets straight up"),
    ("J05", (35, "the", 1), "warm", "Bo bonks the ceiling, stars spin"),
    ("J06", (36, "Now", 1), "warm", "Bo drops onto the bed; both laughing / sneezing"),
    ("J06b", (36, "Well,", 1), "warm", "close Lily laughing, tears of joy"),
    ("J07", (36, "I", 1), "warm", "Bo sneezes again, Lily laughs harder"),
    ("K01", (37, "You're", 1), "warm", "Lily leans close: you're my monster?"),
    ("K02", (37, "whispered.", 1), "warm", "Bo nods shyly"),
    ("K03", (37, "My", 2), "warm", "close Bo: a very red nose"),
    ("L01", (38, "Now", 1), "warm", "Lily and Bo reading jokes with the flashlight, laughing"),
    ("L02", (38, "And", 1), "warm", "the bed bounces with a sneeze, both laughing"),
    ("L03", (39, "The", 1), "club", "the Underbed: the others tease; Bo grins with a tissue"),
    ("L04", (39, "I", 1), "club", "close Bo: I don't mind"),
    ("L05", (40, "Because", 1), "warm", "under the bed: a box of tissues"),
    ("L05b", (40, "tissues", 1), "warm", "Bo hugs the tissue box, happy"),
    ("L06", (40, "With", 1), "warm", "insert: the note FOR BO with a heart"),
    ("L07", (41, "Turns", 1), "warm", "Lily peeks under the bed with the flashlight; Bo smiles back"),
    ("L08", (41, "sneezing", 1), "warm", "pull back: the bed bounces once more; the room glows"),

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
        "// generated by plan/plan_monster.py; do not edit\n"
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
