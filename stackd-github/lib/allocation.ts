import { STABLES } from "./assets";
import type { StackAsset } from "./types";

// All allocation maths runs on integer basis points (10000 = 100%)
// and integer cents, so totals never drift.

export const FULL = 10000;
export const MAX_BUDGET_CENTS = 1e14;

export function clampBp(bp: number): number {
  if (!Number.isFinite(bp)) return 0;
  return Math.max(0, Math.min(FULL, Math.round(bp)));
}

/** "12.5" -> 1250. Returns null when the text is not a usable percentage. */
export function parsePercent(text: string): number | null {
  const t = text.trim().replace(",", ".").replace("%", "");
  if (t === "" || !/^\d*\.?\d*$/.test(t)) return null;
  const v = Number(t);
  if (!Number.isFinite(v) || v > 100) return null;
  return clampBp(v * 100);
}

export function parseBudget(text: string): number | null {
  const t = text.replace(/[$,\s]/g, "");
  if (t === "" || !/^\d*\.?\d*$/.test(t)) return null;
  const v = Number(t);
  if (!Number.isFinite(v)) return null;
  return Math.min(MAX_BUDGET_CENTS, Math.round(v * 100));
}

export function totalBp(assets: Pick<StackAsset, "bp">[]): number {
  return assets.reduce((s, a) => s + a.bp, 0);
}

export function fmtPct(bp: number): string {
  const v = bp / 100;
  return `${Number.isInteger(v) ? v : v.toFixed(2).replace(/0$/, "")}%`;
}

export function fmtUsd(cents: number): string {
  const whole = cents % 100 === 0;
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** Planned budget share: budget x allocation / 100, rounded to the cent. */
export function allocationCents(budgetCents: number, bp: number): number {
  return Math.round((budgetCents * bp) / FULL);
}

/**
 * Scale positive allocations proportionally to exactly 100%.
 * Largest-remainder rounding; ties go to the earlier asset.
 */
export function autoBalance<T extends { bp: number }>(assets: T[]): T[] {
  const sum = totalBp(assets);
  if (sum <= 0) return assets;
  const exact = assets.map((a) => (a.bp * FULL) / sum);
  const floors = exact.map(Math.floor);
  let left = FULL - floors.reduce((s, v) => s + v, 0);
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .filter((o) => assets[o.i].bp > 0)
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; left > 0 && order.length > 0; k = (k + 1) % order.length, left--) floors[order[k].i]++;
  return assets.map((a, i) => ({ ...a, bp: floors[i] }));
}

export interface Stats {
  total: number;
  unallocated: number;
  over: number;
  count: number;
  largest: StackAsset | null;
  status: "empty" | "under" | "exact" | "over";
}

export function stats(assets: StackAsset[]): Stats {
  const total = totalBp(assets);
  const largest = assets.reduce<StackAsset | null>((m, a) => (a.bp > 0 && (!m || a.bp > m.bp) ? a : m), null);
  return {
    total,
    unallocated: Math.max(0, FULL - total),
    over: Math.max(0, total - FULL),
    count: assets.length,
    largest,
    status: assets.length === 0 ? "empty" : total === FULL ? "exact" : total < FULL ? "under" : "over",
  };
}

/** Plain statements derived only from what the user entered. */
export function stackDna(assets: StackAsset[]): string[] {
  const s = stats(assets);
  if (s.count === 0) return ["Your stack is empty. Add a first block to give it a shape."];
  const out: string[] = [];
  const sorted = [...assets].sort((a, b) => b.bp - a.bp);
  if (s.largest) out.push(`Your largest allocation is ${s.largest.ticker} at ${fmtPct(s.largest.bp)}.`);
  out.push(`Your portfolio contains ${s.count} ${s.count === 1 ? "asset" : "different assets"}.`);
  if (s.count > 3) {
    const top = totalBp(sorted.slice(0, 3));
    out.push(`Your top three assets represent ${fmtPct(top)} of your planned budget.`);
  }
  const stable = totalBp(assets.filter((a) => STABLES.has(a.ticker)));
  if (stable > 0) out.push(`Stablecoins make up ${fmtPct(stable)} of the stack.`);
  const positive = sorted.filter((a) => a.bp > 0);
  if (positive.length > 1) {
    const small = positive[positive.length - 1];
    if (positive.every((a) => a.bp === small.bp)) out.push("Every block is the same size: an equal-weight stack.");
    else out.push(`Your smallest block is ${small.ticker} at ${fmtPct(small.bp)}.`);
  }
  if (s.unallocated > 0) out.push(`${fmtPct(s.unallocated)} of the budget is still unallocated.`);
  if (s.over > 0) out.push(`Allocations run ${fmtPct(s.over)} over 100%.`);
  return out;
}
