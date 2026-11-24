"""Shot plan of "The Sword That Can't Lie" (one video): every shot starts on a WORD of the voice-over.
Writes src/plan1.gen.ts and plan/SHOTS1.md.     python plan/plan_sword.py

Scenes (= light): night (the village at night: lanterns, mist, the mountains), home (inside Ren and Mei's house, a
warm lantern), memory (the night of the fire, years ago: ember-red), day (the village by day, overcast), battle (the
village under attack: fires, red eyes everywhere), mount (the mountain forest at night, moonlight), shrine (inside the
old shrine: candles, painted scrolls), peak (the mountain top: the Demon King, a red storm), dawn (the morning after).
"""
import json, sys
from pathlib import Path

FPS = 30
PART = 1
SHOTS = [
    ("A01", (1, "In", 1), "night", "hook: rooftops at night, a hunter's sword blazing red, red eyes in the mist below"),
    ("A02", (1, "sword", 1), "night", "close: the blade lights up red, runes pulsing, the crack glowing"),
    ("A02b", (1, "near", 1), "night", "red eyes open in the mist below the rooftops"),
    ("A03", (2, "And", 1), "home", "Mei hugs Ren goodnight; the sword on his hip glows red through the sheath"),
    ("A04", (2, "mine", 1), "home", "close Ren: smile turns to shock, red light on his face"),
    ("A05", (2, "little", 1), "home", "close Mei hugging him, eyes closed, innocent, lit red"),
    ("B01", (3, "My", 1), "night", "Ren on a rooftop at night, coat and headband tails in the wind"),
    ("B02", (3, "youngest", 1), "night", "the hunters lined up on the street, Ren the smallest"),
    ("B03", (4, "Every", 1), "night", "the black mountains above the village; red eyes open in the forest"),
    ("B04", (4, "crawl", 1), "night", "shadow demons crawl down the slope, black aura, red eyes"),
    ("B05", (5, "And", 1), "night", "Ren slashes a demon: a red arc; it bursts into black smoke"),
    ("B06", (5, "never", 1), "night", "close: the blade, runes, red light"),
    ("C01", (6, "Demons", 1), "memory", "years ago: the house burning, a huge shadow in the smoke"),
    ("C02", (6, "parents", 1), "memory", "Mom stands with a sword against the shadow"),
    ("C03", (6, "baby.", 1), "memory", "little Ren holds baby Mei in a blanket"),
    ("C04", (7, "That", 1), "memory", "close little Ren, crying, hugging the baby"),
    ("C05", (7, "nothing", 1), "home", "now: Ren watches Mei sleep, brave"),
    ("D01", (8, "Mei", 1), "day", "Mei skipping down the street by day"),
    ("D02", (8, "hums", 1), "day", "close Mei humming, happy"),
    ("D03", (8, "steals", 1), "home", "Mei snatches a dumpling off Ren's plate; Ren annoyed, then smiles"),
    ("D04", (9, "But", 1), "home", "dim: Mei at the table, quiet"),
    ("D04b", (9, "something", 1), "home", "close Mei, staring at nothing"),
    ("D05", (10, "She", 1), "home", "close: the dumplings untouched; Mei looks away"),
    ("D06", (11, "Her", 1), "home", "Mei walks past the lantern; her shadow on the paper wall follows late"),
    ("D07", (11, "second", 1), "home", "close: the shadow lags behind her"),
    ("D08", (12, "And", 1), "home", "Mei turns toward Ren"),
    ("D09", (12, "her", 1), "home", "extreme close: her eyes flash red"),
    ("E01", (13, "Then", 1), "day", "the square: Captain Gorou on the platform, hunters, townsfolk"),
    ("E02", (13, "made", 1), "day", "close Gorou, stern"),
    ("E03", (14, "Tomorrow,", 1), "day", "Gorou raises his sword over the crowd"),
    ("E04", (14, "check", 1), "day", "close Ren in the crowd: worried"),
    ("E05", (15, "So", 1), "home", "close Ren, guilty"),
    ("E06", (15, "wrapped", 1), "home", "Ren wraps the glowing sword in cloth; the red dims"),
    ("E07", (15, "hid", 1), "home", "Mei hides in the cupboard, peeking; Ren slides the door shut"),
    ("F01", (16, "That", 1), "night", "the mountain: dozens of red eyes open in the dark"),
    ("F02", (16, "demons", 1), "battle", "demons pour over the rooftops"),
    ("F03", (17, "More", 1), "battle", "wide: the street full of demons, fires, hunters' red blades"),
    ("F04", (17, "ever", 1), "battle", "a sea of red eyes in the smoke"),
    ("F05", (18, "I", 1), "battle", "Ren slashes and spins, red arcs, a demon bursts into smoke"),
    ("F07", (18, "arms", 1), "battle", "close Ren exhausted, the sword shaking"),
    ("F08", (19, "Then", 1), "battle", "low angle: a huge demon looms over Ren against a wall, red eyes and grin"),
    ("G01", (20, "And", 1), "battle", "Mei runs in and stands in front of Ren, arms wide"),
    ("G02", (20, "front", 1), "battle", "close Mei, brave"),
    ("G03", (21, "Her", 1), "battle", "Mei's shadow stretches up behind her and grows giant claws"),
    ("G05", (21, "tore", 1), "battle", "the claws slash; the demon bursts into black smoke"),
    ("G06", (22, "Every", 1), "battle", "the hunters around them, shocked, every sword glowing red at Mei"),
    ("G08", (23, "Step", 1), "battle", "Gorou points his sword at Mei"),
    ("G09", (24, "I", 1), "battle", "Ren steps in front of Mei and raises his sword at the captain"),
    ("G10", (24, "own", 1), "battle", "close Ren, brave, the red blade between them"),
    ("H01", (25, "We", 1), "mount", "Ren and Mei run through the moonlit forest"),
    ("H02", (25, "mountains.", 1), "mount", "wide: the mountain, the hunters' red lights far below"),
    ("H03", (26, "Little", 1), "mount", "close Mei: small dark horns growing in her hair"),
    ("H04", (27, "Leave", 1), "mount", "Mei sobs and pushes Ren away"),
    ("H05", (27, "I'll", 1), "mount", "close Ren holding her hands"),
    ("H06", (28, "But", 1), "mount", "an old shrine in the mountains, a torii gate, moonlight"),
    ("H07", (28, "found", 1), "shrine", "inside: candles, old painted scrolls"),
    ("J01", (29, "Our", 1), "shrine", "a scroll: hunters and swords"),
    ("J02", (29, "They", 1), "shrine", "Ren looks at his own sword glowing red"),
    ("J03", (30, "Every", 1), "shrine", "a scroll: a demon forged into a blade"),
    ("J03b", (30, "forged", 1), "shrine", "close: Ren's blade, the runes glowing like the scroll's demon"),
    ("J04", (31, "And", 1), "shrine", "close Ren: shock"),
    ("J05", (31, "die", 1), "memory", "the fire again: Mom with her sword, glowing gold"),
    ("J06", (32, "She", 1), "memory", "the giant shadow is pulled into Mom in a storm of gold"),
    ("J07", (32, "inside", 1), "memory", "close Mom, eyes closed, gold light"),
    ("J08", (33, "And", 1), "memory", "a tiny gold spark floats from Mom to the baby"),
    ("J09", (33, "went", 1), "memory", "baby Mei glows softly"),
    ("K01", (34, "My", 1), "shrine", "close Mei with horns, crying"),
    ("K01b", (34, "turning", 1), "shrine", "Ren kneels and takes her hands"),
    ("K02", (35, "She", 1), "shrine", "Ren and Mei, a gold glow in her chest"),
    ("K02b", (35, "holding", 1), "shrine", "close: the gold glow pulsing in her chest, red cracks around it"),
    ("K03", (36, "And", 1), "shrine", "the ground shakes; red cracks; Mei in pain"),
    ("K04", (37, "The", 1), "peak", "the mountain top bursts: the Demon King rises"),
    ("K05", (37, "tore", 1), "peak", "low angle: the Demon King, burning red eyes, black aura"),
    ("K06", (38, "The", 1), "peak", "hunters slash at it; their red blades bounce off"),
    ("K07", (38, "stop", 1), "peak", "Gorou is thrown back"),
    ("L01", (39, "Mei", 1), "peak", "close: Mei's hand grabs Ren's"),
    ("L02", (39, "Together?", 1), "peak", "close Mei, brave"),
    ("L03", (40, "My", 1), "peak", "close: the crack splits open, gold light bursts out"),
    ("L04", (40, "glowed", 1), "peak", "Ren raises the gold sword"),
    ("L05", (41, "It", 1), "peak", "close Ren, tears and a smile in the gold light"),
    ("L06", (41, "all", 1), "peak", "a ghostly gold figure of Mom behind them"),
    ("L08", (42, "We", 1), "peak", "Ren and Mei leap and strike: the Demon King shatters into light"),
    ("M01", (43, "At", 1), "dawn", "the mountain top at dawn, smoke drifting away"),
    ("M02", (43, "lowered", 1), "dawn", "Gorou lowers his sword and bows"),
    ("M03", (44, "Mei's", 1), "dawn", "Mei, no horns, smiling"),
    ("M04", (44, "Only", 1), "dawn", "close Mei: a tiny gold spark in her eyes"),
    ("M04b", (44, "spark", 1), "dawn", "extreme close: the gold spark in her eye"),
    ("M05", (45, "My", 1), "dawn", "Mei hugs Ren; his sword glows soft gold"),
    ("M06", (45, "Gold,", 1), "dawn", "close: the blade glowing gold"),
    ("M07", (46, "The", 1), "dawn", "Ren and Mei walk down the mountain in the sunrise"),
    ("M08", (46, "It", 1), "dawn", "wide: the sunrise over the village"),
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
    (root / "src" / f"plan{PART}.gen.ts").write_text(
        "// generated by plan/plan_sword.py; do not edit\n"
        f"export const FPS = {FPS};\nexport const DURATION = {round(total * FPS)};\nexport const SYNTHETIC_VO = {str(synth).lower()};\n"
        f"export const SHOTS = {json.dumps(shots)} as const;\n"
        f"export const WORDS: [string, number, number, number][] = {json.dumps(ws)};\n", encoding="utf8")
    md = ["| id | start | len | scene | note |", "|---|---|---|---|---|"]
    md += [f"| {s['id']} | {s['t']:.2f} | {s['end'] - s['t']:.2f} | {s['scene']} | {s['note']} |" for s in shots]
    (root / "plan" / f"SHOTS{PART}.md").write_text("\n".join(md) + "\n", encoding="utf8")
    lens = [s["end"] - s["t"] for s in shots]
    print(f"{len(shots)} shots, {total:.2f} s, mean shot {sum(lens) / len(lens):.2f} s, min {min(lens):.2f}, max {max(lens):.2f}")


if __name__ == "__main__":
    main("vo/p1/timings.json")
