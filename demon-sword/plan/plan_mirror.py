"""Shot plan of "The Town With No Mirrors": every shot starts on a WORD of the voice-over.
Writes src/planN.gen.ts and plan/SHOTS_N.md.     python plan/plan_mirror.py
Scenes (= light): square (the foggy town by day, grey-blue), home (Grandma's dining room, a warm lamp, black windows),
shop (Mister Oda's candy shop, warm), night (the town at night under the street lamps, fog), shrine (the stone field
behind the shrine, cold fog), rain (the town in the rain), river (the river at dawn, white fog), mirror (what the
broken mirror shows), ghost (the town with everyone glowing blue), fire (memory: the town burning, twelve years ago),
memory (warm memory: the ghosts raising baby Sora), end (the last shots: blue glow, the fog lifting a little).
tr = how the shot comes IN: cut | fade (a dissolve) | zoom (a zoom-blur) | whip (a sideways whip-pan blur)
"""
import json
from pathlib import Path

FPS = 30
# id, (line, word, nth), scene, transition in, note
SHOTS = [
    ("A01", (1, "In", 1), "square", "cut", "Sora in the foggy town square, the big NO MIRRORS sign behind him"),
    ("A02", (1, "mirrors", 1), "square", "zoom", "insert: the sign NO MIRRORS, fog drifting across it"),
    ("A03", (1, "If", 1), "square", "cut", "a townsman painting a window black, slow strokes"),
    ("A04", (1, "disappear", 1), "square", "whip", "a figure walking away into the fog, fading"),
    ("B01", (2, "window", 1), "square", "fade", "a row of houses, every window painted black"),
    ("B02", (2, "lake", 1), "square", "whip", "the lake, covered edge to edge with wooden boards"),
    ("B03", (2, "Even", 1), "home", "cut", "insert: wooden spoons and wooden bowls on the table"),
    ("C01", (3, "Grandma", 1), "home", "fade", "Grandma wraps Sora's red scarf at the door"),
    ("C02", (3, "Never", 1), "home", "cut", "close Grandma, serious: never look at your reflection"),
    ("C03", (3, "Sora", 1), "home", "cut", "close Sora, nodding: promise"),
    ("D01", (4, "And", 1), "square", "fade", "high wide: the town drowned in fog, roofs and bare trees"),
    ("D02", (4, "road", 1), "square", "whip", "the road out of town ending in a wall of white"),
    ("D03", (4, "Nobody", 1), "square", "cut", "Sora at the end of the road, staring into the white"),
    ("D04", (4, "Nobody", 2), "square", "cut", "an empty bus stop, its sign rusted, fog"),
    ("E01", (5, "But", 1), "square", "zoom", "close Sora, uneasy, fog behind"),
    ("F01", (6, "Grandma", 1), "home", "fade", "Grandma ladles soup into wooden bowls, the lamp warm"),
    ("F02", (6, "But", 1), "home", "cut", "Sora eats; Grandma's bowl is full and untouched, she just watches him"),
    ("G01", (7, "Mister", 1), "square", "whip", "the candy shop front glowing in the fog"),
    ("G02", (7, "gives", 1), "shop", "cut", "Mister Oda hands Sora a candy over the counter"),
    ("G03", (7, "He", 1), "shop", "cut", "Sora puts a coin down; Oda slides it back with a wink"),
    ("G04", (7, "Not", 1), "shop", "cut", "insert: a jar full of coins Sora left, never taken"),
    ("H01", (8, "My", 1), "square", "fade", "Mina (yellow raincoat) walks beside Sora along the covered lake"),
    ("H02", (8, "hold", 1), "square", "cut", "Sora reaches for her hand; she pulls it away"),
    ("H03", (8, "She", 1), "square", "cut", "close Mina, smiling"),
    ("H04", (8, "Not", 1), "square", "cut", "Mina skips ahead into the fog: not today"),
    ("J01", (9, "At", 1), "night", "fade", "the town at night: street lamps glowing in the fog"),
    ("J02", (9, "I'm", 1), "night", "cut", "low: under a lamp, Sora's long shadow; Grandma and Mina beside him have none"),
    ("J03", (9, "Grandma", 1), "night", "cut", "close Grandma, a strange smile: the fog eats them"),
    ("K01", (10, "Behind", 1), "shrine", "fade", "the little shrine in the fog"),
    ("K02", (10, "field", 1), "shrine", "cut", "rows of stones fading into the fog"),
    ("K03", (10, "all", 1), "shrine", "cut", "insert: the same date carved on every stone"),
    ("K04", (10, "Nobody", 1), "shrine", "cut", "Sora among the stones looking back; Grandma waits at the gate"),
    ("L01", (11, "And", 1), "rain", "fade", "rain pours on the street, people walking"),
    ("L02", (11, "everyone", 1), "rain", "cut", "rain falls straight through Mina and Grandma: they stay dry"),
    ("L03", (11, "Everyone", 2), "rain", "cut", "close Sora, soaked, hair dripping"),
    ("M01", (12, "One", 1), "river", "fade", "the river at dawn, white fog on the water"),
    ("M02", (12, "something", 1), "river", "cut", "a glint in the shallow water"),
    ("M03", (12, "The", 1), "river", "cut", "wide: Sora alone on the bank, the water still"),
    ("M04", (12, "Even", 1), "river", "cut", "crows on a bare branch, frozen, silent"),
    ("M05", (13, "A", 1), "river", "zoom", "insert: a broken mirror piece in the water, the sky in it"),
    ("N01", (14, "My", 1), "river", "cut", "close: Sora's hands shaking over the shard"),
    ("N02", (14, "If", 1), "river", "cut", "close Sora, scared"),
    ("N03", (14, "That's", 1), "home", "whip", "memory: Grandma, never look (cold)"),
    ("N04", (15, "But", 1), "river", "whip", "close Sora, eyes hardening"),
    ("N05", (15, "So", 1), "river", "cut", "Sora lifts the shard out of the water"),
    ("P01", (16, "I", 1), "mirror", "zoom", "the shard: Sora's face in it"),
    ("P02", (16, "My", 1), "mirror", "cut", "the shard, closer: his eyes, his hair"),
    ("P03", (17, "But", 1), "mirror", "cut", "the shard: behind him, the street is empty"),
    ("P03b", (17, "street", 1), "mirror", "cut", "the shard, focus pulls past him: the empty street behind"),
    ("P04", (18, "No", 1), "mirror", "cut", "the shard: where Grandma stood, nobody"),
    ("P05", (18, "No", 2), "mirror", "cut", "the shard: where Mina and Oda stood, nobody"),
    ("P06", (18, "Nobody", 1), "mirror", "cut", "the shard: the whole street, empty, only Sora"),
    ("Q01", (19, "They", 1), "river", "zoom", "close Sora, eyes wide, understanding"),
    ("Q02", (19, "someone", 1), "mirror", "cut", "the shard again: only him, a crack runs across it"),
    ("Q03", (19, "It", 1), "river", "cut", "close Sora, a tear"),
    ("R01", (20, "I", 1), "river", "cut", "Sora turns around (over his shoulder)"),
    ("R02", (20, "They", 1), "ghost", "zoom", "reveal: everyone standing in the fog, glowing blue"),
    ("R03", (20, "glowing", 1), "ghost", "cut", "closer: the townsfolk glowing, faces gentle"),
    ("S01", (21, "Grandma", 1), "ghost", "cut", "Grandma steps forward, glowing"),
    ("S02", (21, "Twelve", 1), "fire", "fade", "memory: the town burning at night, twelve years ago"),
    ("S02b", (21, "night", 1), "fire", "cut", "memory: flames leaping over the roofs, smoke"),
    ("S03", (21, "there", 1), "fire", "cut", "a house in flames, sparks rising"),
    ("S04", (21, "The", 2), "fire", "cut", "the whole street burning"),
    ("S05", (21, "Only", 1), "fire", "zoom", "a baby in a basket in the ash, a glow around it"),
    ("S06", (22, "You", 1), "ghost", "fade", "close Grandma, gentle: you"),
    ("T01", (23, "So", 1), "memory", "fade", "memory: ghost Grandma rocking baby Sora by the lamp"),
    ("T02", (23, "We", 3), "memory", "cut", "memory: Oda giving little Sora his first candy"),
    ("T03", (23, "hid", 1), "memory", "cut", "memory: the ghosts painting the windows black at night"),
    ("T04", (24, "Mina", 1), "ghost", "fade", "close Mina, glowing, crying"),
    ("T05", (24, "hand", 1), "ghost", "cut", "Mina's hand reaching for his, not quite touching"),
    ("U01", (25, "Every", 1), "ghost", "cut", "the glowing crowd, every face he knows"),
    ("U02", (25, "Every", 2), "ghost", "cut", "Mister Oda glowing, his kind smile"),
    ("U03", (25, "They", 1), "ghost", "cut", "close Sora crying"),
    ("U04", (25, "said", 1), "memory", "cut", "memory: toddler Sora's first word, ghost Grandma clapping"),
    ("V01", (26, "Grandma", 1), "end", "fade", "Grandma takes Sora's hand"),
    ("V02", (26, "and", 1), "end", "cut", "insert: his hand passes through hers, blue sparks"),
    ("V03", (26, "I", 1), "end", "cut", "close Sora: tears, a small smile"),
    ("W01", (27, "We", 1), "end", "cut", "close Grandma: we were always here"),
    ("W02", (27, "And", 1), "end", "zoom", "the last wide: Sora in the street, the whole glowing town around him, the camera rising"),
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
    (root / "src" / "planN.gen.ts").write_text(
        "// generated by plan/plan_mirror.py; do not edit\n"
        f"export const FPS = {FPS};\nexport const DURATION = {round(total * FPS)};\nexport const SYNTHETIC_VO = {str(synth).lower()};\n"
        f"export const SHOTS = {json.dumps(shots)} as const;\n"
        f"export const WORDS: [string, number, number, number][] = {json.dumps(ws)};\n", encoding="utf8")
    md = ["| id | start | len | scene | in | note |", "|---|---|---|---|---|---|"]
    md += [f"| {s['id']} | {s['t']:.2f} | {s['end'] - s['t']:.2f} | {s['scene']} | {s['tr']} | {s['note']} |" for s in shots]
    (root / "plan" / "SHOTS_N.md").write_text("\n".join(md) + "\n", encoding="utf8")
    lens = [s["end"] - s["t"] for s in shots]
    print(f"{len(shots)} shots, {total:.2f} s, mean shot {sum(lens) / len(lens):.2f} s, min {min(lens):.2f}, max {max(lens):.2f}")


if __name__ == "__main__":
    main("vo/n1/timings.json")
