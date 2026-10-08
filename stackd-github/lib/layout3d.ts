import { FULL } from "./allocation";

// Deterministic stack layout.
// A full 100% portfolio fills one cube of side SIDE. Every asset owns a cell
// whose volume is exactly (its share) x SIDE^3, so block volume maps linearly
// to allocation. Cells come from a balanced binary split of the cube, which
// keeps blocks chunky, never overlapping, and stable from frame to frame.

export const SIDE = 3;
export const GAP = 0.05;

export interface Cell {
  id: string;
  center: [number, number, number];
  size: [number, number, number];
  /** 1 = bottom-most layer of the stack */
  level: number;
}

interface Box {
  min: [number, number, number];
  size: [number, number, number];
}

interface Item {
  id: string;
  w: number;
}

function split(items: Item[], box: Box, out: Map<string, Box>) {
  if (items.length === 1) {
    out.set(items[0].id, box);
    return;
  }
  const sum = items.reduce((s, i) => s + i.w, 0);
  let acc = 0;
  let cut = 1;
  let best = Infinity;
  for (let i = 0; i < items.length - 1; i++) {
    acc += items[i].w;
    const d = Math.abs(acc - sum / 2);
    if (d < best - 1e-9) {
      best = d;
      cut = i + 1;
    }
  }
  const a = items.slice(0, cut);
  const b = items.slice(cut);
  const fa = a.reduce((s, i) => s + i.w, 0) / sum;
  // longest axis first; ties prefer height so the heavy group sits at the base
  const [sx, sy, sz] = box.size;
  const axis = sy >= sx - 1e-9 && sy >= sz - 1e-9 ? 1 : sx >= sz - 1e-9 ? 0 : 2;
  const sizeA: [number, number, number] = [...box.size];
  const sizeB: [number, number, number] = [...box.size];
  const minB: [number, number, number] = [...box.min];
  sizeA[axis] = box.size[axis] * fa;
  sizeB[axis] = box.size[axis] - sizeA[axis];
  minB[axis] = box.min[axis] + sizeA[axis];
  split(a, { min: box.min, size: sizeA }, out);
  split(b, { min: minB, size: sizeB }, out);
}

export function layoutStack(assets: { id: string; bp: number }[]): Map<string, Cell> {
  const cells = new Map<string, Cell>();
  const live = assets
    .map((a, i) => ({ id: a.id, w: a.bp, i }))
    .filter((a) => a.w > 0)
    .sort((a, b) => b.w - a.w || a.i - b.i);
  const total = live.reduce((s, a) => s + a.w, 0);
  const half = SIDE / 2;

  if (live.length > 0) {
    // under 100% the stack is shorter and the missing volume stays empty on top;
    // over 100% shares are shown relative to the entered total
    const fill = Math.min(1, total / FULL);
    const boxes = new Map<string, Box>();
    split(live, { min: [-half, -half, -half], size: [SIDE, SIDE * fill, SIDE] }, boxes);
    const floors = [...new Set([...boxes.values()].map((b) => Math.round(b.min[1] * 1000)))].sort((a, b) => a - b);
    for (const [id, b] of boxes) {
      cells.set(id, {
        id,
        center: [b.min[0] + b.size[0] / 2, b.min[1] + b.size[1] / 2, b.min[2] + b.size[2] / 2],
        size: [Math.max(0.02, b.size[0] - GAP), Math.max(0.02, b.size[1] - GAP), Math.max(0.02, b.size[2] - GAP)],
        level: floors.indexOf(Math.round(b.min[1] * 1000)) + 1,
      });
    }
  }
  // 0% assets have no volume: park them on top of the stack, collapsed
  const top = -half + SIDE * Math.min(1, total / FULL);
  for (const a of assets) {
    if (!cells.has(a.id)) cells.set(a.id, { id: a.id, center: [0, top + 0.3, 0], size: [0, 0, 0], level: 0 });
  }
  return cells;
}
