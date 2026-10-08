import type { CatalogAsset, Finish, StackAsset } from "./types";

// Local catalog only: identities and materials, never prices.
export const CATALOG: CatalogAsset[] = [
  { ticker: "SOL", name: "Solana", color: "#7B4DFF", color2: "#35E6D2", finish: "glass", material: "Violet-cyan glass" },
  { ticker: "BTC", name: "Bitcoin", color: "#F6A21B", color2: "#B8650A", finish: "metal", material: "Amber metal" },
  { ticker: "ETH", name: "Ethereum", color: "#C9D6F2", color2: "#7F96C9", finish: "ceramic", material: "Silver-blue ceramic" },
  { ticker: "USDC", name: "USD Coin", color: "#2F6BFF", color2: "#1B3FCB", finish: "gloss", material: "Cobalt gloss" },
  { ticker: "USDT", name: "Tether", color: "#2BC79A", color2: "#12806A", finish: "gloss", material: "Emerald gloss" },
  { ticker: "BONK", name: "Bonk", color: "#FF8A1F", color2: "#F0531C", finish: "satin", material: "Warm orange satin" },
  { ticker: "WIF", name: "dogwifhat", color: "#E9B48C", color2: "#C0785A", finish: "ceramic", material: "Sand ceramic" },
  { ticker: "JUP", name: "Jupiter", color: "#B6F25C", color2: "#19C7B4", finish: "glass", material: "Lime-teal glass" },
  { ticker: "RAY", name: "Raydium", color: "#5B6BFF", color2: "#C24DE8", finish: "gloss", material: "Indigo-magenta gloss" },
  { ticker: "PYTH", name: "Pyth Network", color: "#B79CFF", color2: "#6A45D9", finish: "metal", material: "Lilac metal" },
];

export const STABLES = new Set(["USDC", "USDT"]);

export const CUSTOM_SWATCHES = ["#68E9FF", "#4285FF", "#8A78FF", "#FF5FA2", "#FF8A1F", "#FFD23F", "#4ADE80", "#F6F8FF"];

export function uid(prefix = "a"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export function fromCatalog(ticker: string, bp: number): StackAsset {
  const c = CATALOG.find((a) => a.ticker === ticker);
  if (!c) throw new Error(`Unknown catalog asset ${ticker}`);
  return { ...c, id: uid(), bp };
}

/** Darker companion tone so custom colours still get a two-tone material. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amount < 0 ? v : 255 - v) * amount)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function isHex(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}

export function customAsset(name: string, ticker: string, color: string, bp: number, finish: Finish = "gloss"): StackAsset {
  return {
    id: uid(),
    ticker: ticker.toUpperCase(),
    name,
    color,
    color2: shade(color, -0.45),
    finish,
    material: "Custom gloss",
    bp,
    custom: true,
  };
}

/** Readable text colour on top of an asset colour. */
export function inkOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.62 ? "#050711" : "#F6F8FF";
}
