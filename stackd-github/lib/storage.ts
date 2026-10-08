import { clampBp, MAX_BUDGET_CENTS } from "./allocation";
import { isHex, shade, uid } from "./assets";
import type { Finish, Portfolio, StackAsset } from "./types";

// Portfolios live in this browser only. Nothing is uploaded or synced.

const LIBRARY_KEY = "stackd:library:v1";
const DRAFT_KEY = "stackd:draft:v1";
const FINISHES: Finish[] = ["glass", "metal", "ceramic", "gloss", "satin"];
export const MAX_ASSETS = 16;

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function text(v: unknown, max: number, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : fallback;
}

/** Turns untrusted JSON (storage or an imported file) into a valid portfolio, or null. */
export function sanitizePortfolio(input: unknown): Portfolio | null {
  if (!input || typeof input !== "object") return null;
  const p = input as Record<string, unknown>;
  if (!Array.isArray(p.assets)) return null;
  const assets: StackAsset[] = [];
  for (const raw of p.assets.slice(0, MAX_ASSETS)) {
    if (!raw || typeof raw !== "object") continue;
    const a = raw as Record<string, unknown>;
    const ticker = text(a.ticker, 8, "").toUpperCase().replace(/[^A-Z0-9$]/g, "");
    if (!ticker) continue;
    const color = isHex(a.color) ? a.color : "#4285FF";
    assets.push({
      id: text(a.id, 40, uid()),
      ticker,
      name: text(a.name, 32, ticker),
      color,
      color2: isHex(a.color2) ? a.color2 : shade(color, -0.45),
      finish: FINISHES.includes(a.finish as Finish) ? (a.finish as Finish) : "gloss",
      material: text(a.material, 40, "Custom gloss"),
      bp: clampBp(Number(a.bp)),
      custom: Boolean(a.custom),
    });
  }
  const ids = new Set<string>();
  for (const a of assets) {
    if (ids.has(a.id)) a.id = uid();
    ids.add(a.id);
  }
  const budget = Number(p.budgetCents);
  return {
    id: text(p.id, 40, uid("p")),
    name: text(p.name, 48, "Untitled Stack"),
    budgetCents: Number.isFinite(budget) ? Math.max(0, Math.min(MAX_BUDGET_CENTS, Math.round(budget))) : 0,
    assets,
    updatedAt: Number.isFinite(Number(p.updatedAt)) ? Number(p.updatedAt) : Date.now(),
  };
}

export function loadLibrary(): Portfolio[] {
  const raw = read<unknown[]>(LIBRARY_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.map(sanitizePortfolio).filter((p): p is Portfolio => p !== null);
}

export function saveLibrary(list: Portfolio[]): boolean {
  return write(LIBRARY_KEY, list);
}

export function loadDraft(): Portfolio | null {
  return sanitizePortfolio(read<unknown>(DRAFT_KEY));
}

export function saveDraft(p: Portfolio): boolean {
  return write(DRAFT_KEY, p);
}

export function portfolioToJson(p: Portfolio): string {
  return JSON.stringify({ app: "STACKD", version: 1, portfolio: p }, null, 2);
}

export function portfolioFromJson(textContent: string): Portfolio | null {
  try {
    const data = JSON.parse(textContent) as Record<string, unknown>;
    const p = sanitizePortfolio(data && typeof data === "object" && "portfolio" in data ? data.portfolio : data);
    // an imported file is always a new entry, never an overwrite
    return p ? { ...p, id: uid("p"), updatedAt: Date.now() } : null;
  } catch {
    return null;
  }
}

export function downloadFile(name: string, href: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "stack";
}
