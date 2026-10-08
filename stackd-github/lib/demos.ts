import { fromCatalog, uid } from "./assets";
import type { Portfolio } from "./types";

export interface Demo {
  key: string;
  name: string;
  note: string;
  mix: [string, number][];
}

// Examples only. They show how the builder works, nothing more.
export const DEMOS: Demo[] = [
  {
    key: "balanced",
    name: "The Balanced Stack",
    note: "Four blocks, wide base.",
    mix: [["SOL", 35], ["BTC", 30], ["ETH", 25], ["USDC", 10]],
  },
  {
    key: "degen",
    name: "The Degen Stack",
    note: "Five blocks, loud colours.",
    mix: [["SOL", 30], ["BONK", 25], ["WIF", 20], ["JUP", 15], ["RAY", 10]],
  },
  {
    key: "solana",
    name: "The Solana Stack",
    note: "One big block carries the rest.",
    mix: [["SOL", 50], ["JUP", 20], ["RAY", 15], ["PYTH", 10], ["BONK", 5]],
  },
];

export function demoPortfolio(demo: Demo): Portfolio {
  return {
    id: uid("p"),
    name: demo.name,
    budgetCents: 1000000,
    assets: demo.mix.map(([t, pct]) => fromCatalog(t, pct * 100)),
    updatedAt: Date.now(),
  };
}

export function starterPortfolio(): Portfolio {
  return {
    id: uid("p"),
    name: "My Degen Stack",
    budgetCents: 1000000,
    assets: [fromCatalog("SOL", 4000), fromCatalog("BTC", 2500), fromCatalog("ETH", 2000), fromCatalog("USDC", 1500)],
    updatedAt: Date.now(),
  };
}

export function emptyPortfolio(): Portfolio {
  return { id: uid("p"), name: "Untitled Stack", budgetCents: 1000000, assets: [], updatedAt: Date.now() };
}
