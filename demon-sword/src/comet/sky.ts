// Where the comet hangs in each frame: high over the northern mountains, its tails sweeping up and to the left.
// The bedroom sits on the third floor of a block at the north end of the street: ROOM_AT is its floor centre in the
// valley frame (the window looks north up the avenue to downtown and the mountains).
import type { V3 } from "../blocky/motion";

export const ROOM_AT: V3 = [0, 9, -62];
export const COMET = {
  city: { p: [70, 215, -330] as V3, dir: [-0.72, 0.5, -0.2] as V3, len: 190, scale: 1.7 },
  lake: { p: [60, 210, -330] as V3, dir: [-0.72, 0.5, -0.2] as V3, len: 190, scale: 1.7 },
};
