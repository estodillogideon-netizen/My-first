// Word and shot times of "The Goodbye Monster" (Part 1 and Part 2), from the generated plans (plan/plan_goodbye.py).
// Shot ids are unique across both parts (Part 1: A..K, Part 2: P..Y), so one staging table serves both.
import * as P1 from "../plan1.gen";
import * as P2 from "../plan2.gen";

export type Row = { id: string; t: number; end: number; scene: string; note: string };
const plans = { 1: P1, 2: P2 } as const;
export const SHOTS_OF = (part: 1 | 2): Row[] => plans[part].SHOTS as unknown as Row[];
export const FRAMES_OF = (part: 1 | 2) => plans[part].DURATION;
const partOfId = (id: string): 1 | 2 => ("PQRSTUVWXY".includes(id[0]) ? 2 : 1);
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
const cacheW = new Map<string, number>();
/** onset (s) of the nth occurrence of `word` in script line `turn` of a part (end = true: the word's end) */
export const Wp = (part: 1 | 2, turn: number, word: string, nth = 1, end = false): number => {
  const k = `${part}|${turn}|${word}|${nth}|${end}`;
  const hit = cacheW.get(k);
  if (hit !== undefined) return hit;
  let n = 0;
  for (const w of plans[part].WORDS) {
    if (w[3] === turn && norm(w[0]) === norm(word)) {
      n++;
      if (n === nth) {
        const v = end ? w[2] : w[1];
        cacheW.set(k, v);
        return v;
      }
    }
  }
  throw new Error(`word not found: part ${part} line ${turn} ${word} #${nth}`);
};
export const W1 = (turn: number, word: string, nth = 1, end = false) => Wp(1, turn, word, nth, end);
export const W2 = (turn: number, word: string, nth = 1, end = false) => Wp(2, turn, word, nth, end);
const byId = new Map<string, Row>([...SHOTS_OF(1), ...SHOTS_OF(2)].map((s) => [s.id, s]));
export const shot = (id: string): Row => {
  const s = byId.get(id);
  if (!s) throw new Error(`no shot ${id}`);
  return s;
};
export const ST = (id: string) => shot(id).t;
export const SE = (id: string) => shot(id).end;
export const partOf = partOfId;
/** the shot of OUTPUT frame n of a part (all motion-blur sub-frames of n stay in one shot) */
export const shotAtFrame = (part: 1 | 2, n: number): Row => {
  const S = SHOTS_OF(part);
  let r = S[0];
  for (const s of S) if (n >= Math.round(s.t * 30)) r = s;
  return r;
};
