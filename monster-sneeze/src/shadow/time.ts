// Word and shot times from the generated plan (plan/plan_laugh.py -> src/plan.gen.ts). Everything in the staging is
// anchored to a word, so a new voice-over moves every action with its word.
import { DURATION, SHOTS, WORDS } from "../plan.gen";

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
const cacheW = new Map<string, number>();
/** onset (s) of the nth occurrence of `word` in script line `turn` (end = true: the word's end) */
export const W = (turn: number, word: string, nth = 1, end = false): number => {
  const k = `${turn}|${word}|${nth}|${end}`;
  const hit = cacheW.get(k);
  if (hit !== undefined) return hit;
  let n = 0;
  for (const w of WORDS) {
    if (w[3] === turn && norm(w[0]) === norm(word)) {
      n++;
      if (n === nth) {
        const v = end ? w[2] : w[1];
        cacheW.set(k, v);
        return v;
      }
    }
  }
  throw new Error(`word not found: ${turn} ${word} #${nth}`);
};
export type ShotRow = (typeof SHOTS)[number];
const byId = new Map<string, ShotRow>(SHOTS.map((s) => [s.id, s]));
export const shot = (id: string): ShotRow => {
  const s = byId.get(id);
  if (!s) throw new Error(`no shot ${id}`);
  return s;
};
/** start / end of a shot (s) */
export const ST = (id: string) => shot(id).t;
export const SE = (id: string) => shot(id).end;
/** the shot of OUTPUT frame n (all motion-blur sub-frames of n stay in one shot) */
export const shotIndexAt = (n: number) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (n >= Math.round(SHOTS[k].t * 30)) i = k;
  return i;
};
export const shotAtFrame = (n: number): ShotRow => SHOTS[shotIndexAt(n)];
export const FRAMES = DURATION;
export { SHOTS, WORDS };
