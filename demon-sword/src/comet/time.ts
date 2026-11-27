// Word and shot times of "The Comet Swap", from the generated plan (plan/plan_comet.py).
import * as P1 from "../planC.gen";

export type Row = { id: string; t: number; end: number; scene: string; note: string };
export const SHOTS = P1.SHOTS as unknown as Row[];
export const FRAMES = P1.DURATION;
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
const cacheW = new Map<string, number>();
/** onset (s) of the nth occurrence of `word` in script line `turn` (end = true: the word's end) */
export const W = (turn: number, word: string, nth = 1, end = false): number => {
  const k = `${turn}|${word}|${nth}|${end}`;
  const hit = cacheW.get(k);
  if (hit !== undefined) return hit;
  let n = 0;
  for (const w of P1.WORDS) {
    if (w[3] === turn && norm(w[0]) === norm(word)) {
      n++;
      if (n === nth) {
        const v = end ? w[2] : w[1];
        cacheW.set(k, v);
        return v;
      }
    }
  }
  throw new Error(`word not found: line ${turn} ${word} #${nth}`);
};
const byId = new Map<string, Row>(SHOTS.map((s) => [s.id, s]));
export const shot = (id: string): Row => {
  const s = byId.get(id);
  if (!s) throw new Error(`no shot ${id}`);
  return s;
};
export const ST = (id: string) => shot(id).t;
export const SE = (id: string) => shot(id).end;
/** the shot of OUTPUT frame n (all motion-blur sub-frames of n stay in one shot) */
export const shotAtFrame = (n: number): Row => {
  let r = SHOTS[0];
  for (const s of SHOTS) if (n >= Math.round(s.t * 30)) r = s;
  return r;
};
