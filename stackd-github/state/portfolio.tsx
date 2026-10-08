"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { autoBalance, clampBp, FULL, totalBp } from "@/lib/allocation";
import { uid } from "@/lib/assets";
import { emptyPortfolio, starterPortfolio } from "@/lib/demos";
import { loadDraft, loadLibrary, MAX_ASSETS, saveDraft, saveLibrary } from "@/lib/storage";
import type { Portfolio, StackAsset } from "@/lib/types";

type Action =
  | { type: "replace"; portfolio: Portfolio }
  | { type: "name"; name: string }
  | { type: "budget"; cents: number }
  | { type: "add"; asset: StackAsset }
  | { type: "remove"; id: string }
  | { type: "bp"; id: string; bp: number }
  | { type: "edit"; id: string; patch: Partial<StackAsset> }
  | { type: "balance" }
  | { type: "reset" };

function reducer(state: Portfolio, action: Action): Portfolio {
  const touch = (p: Portfolio): Portfolio => ({ ...p, updatedAt: Date.now() });
  switch (action.type) {
    case "replace":
      return action.portfolio;
    case "name":
      return touch({ ...state, name: action.name.slice(0, 48) });
    case "budget":
      return touch({ ...state, budgetCents: Math.max(0, action.cents) });
    case "add":
      if (state.assets.length >= MAX_ASSETS) return state;
      return touch({ ...state, assets: [...state.assets, action.asset] });
    case "remove":
      return touch({ ...state, assets: state.assets.filter((a) => a.id !== action.id) });
    case "bp":
      return touch({ ...state, assets: state.assets.map((a) => (a.id === action.id ? { ...a, bp: clampBp(action.bp) } : a)) });
    case "edit":
      return touch({ ...state, assets: state.assets.map((a) => (a.id === action.id ? { ...a, ...action.patch } : a)) });
    case "balance":
      return touch({ ...state, assets: autoBalance(state.assets) });
    case "reset":
      return emptyPortfolio();
  }
}

interface Store {
  portfolio: Portfolio;
  dispatch: (a: Action) => void;
  /** what a freshly added asset starts at, without touching the others */
  nextBp: () => number;
  library: Portfolio[];
  /** true when the current stack differs from its saved copy */
  dirty: boolean;
  savedId: boolean;
  save: () => boolean;
  load: (id: string) => void;
  duplicate: (id: string) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  addToLibrary: (p: Portfolio) => void;
  /** replace the whole working stack, keeping the old one for one undo */
  swap: (next: Portfolio, label: string) => void;
  undo: { label: string } | null;
  undoSwap: () => void;
  clearUndo: () => void;
  ready: boolean;
}

const Ctx = createContext<Store | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolio, dispatch] = useReducer(reducer, null, starterPortfolio);
  const [library, setLibrary] = useState<Portfolio[]>([]);
  const [ready, setReady] = useState(false);
  const [undo, setUndo] = useState<{ label: string; prev: Portfolio } | null>(null);
  const libRef = useRef(library);
  libRef.current = library;

  useEffect(() => {
    const draft = loadDraft();
    if (draft) dispatch({ type: "replace", portfolio: draft });
    setLibrary(loadLibrary());
    setReady(true);
  }, []);

  // the working stack survives a reload even before it is saved to the library
  useEffect(() => {
    if (ready) saveDraft(portfolio);
  }, [portfolio, ready]);

  const commit = useCallback((next: Portfolio[]) => {
    setLibrary(next);
    return saveLibrary(next);
  }, []);

  const store = useMemo<Store>(() => {
    const saved = library.find((p) => p.id === portfolio.id);
    const same = (a: Portfolio, b: Portfolio) =>
      JSON.stringify([a.name, a.budgetCents, a.assets]) === JSON.stringify([b.name, b.budgetCents, b.assets]);
    return {
      portfolio,
      dispatch,
      ready,
      library,
      savedId: Boolean(saved),
      dirty: !saved || !same(saved, portfolio),
      nextBp: () => {
        const free = FULL - totalBp(portfolio.assets);
        return free > 0 && free <= 1000 ? free : 1000;
      },
      save: () => {
        const entry = { ...portfolio, updatedAt: Date.now() };
        const list = libRef.current;
        return commit(list.some((p) => p.id === entry.id) ? list.map((p) => (p.id === entry.id ? entry : p)) : [entry, ...list]);
      },
      swap: (next, label) => {
        setUndo({ label, prev: portfolio });
        dispatch({ type: "replace", portfolio: next });
      },
      undo: undo ? { label: undo.label } : null,
      undoSwap: () => {
        if (undo) dispatch({ type: "replace", portfolio: undo.prev });
        setUndo(null);
      },
      clearUndo: () => setUndo(null),
      load: (id) => {
        const p = libRef.current.find((x) => x.id === id);
        if (!p || p.id === portfolio.id) return;
        setUndo({ label: `Loaded "${p.name}"`, prev: portfolio });
        dispatch({ type: "replace", portfolio: p });
      },
      duplicate: (id) => {
        const p = libRef.current.find((x) => x.id === id);
        if (!p) return;
        const copy: Portfolio = {
          ...p,
          id: uid("p"),
          name: `${p.name} copy`.slice(0, 48),
          assets: p.assets.map((a) => ({ ...a, id: uid() })),
          updatedAt: Date.now(),
        };
        commit([copy, ...libRef.current]);
      },
      rename: (id, name) => {
        const clean = name.trim().slice(0, 48);
        if (!clean) return;
        commit(libRef.current.map((p) => (p.id === id ? { ...p, name: clean, updatedAt: Date.now() } : p)));
        if (portfolio.id === id) dispatch({ type: "name", name: clean });
      },
      remove: (id) => {
        commit(libRef.current.filter((p) => p.id !== id));
      },
      addToLibrary: (p) => {
        commit([p, ...libRef.current.filter((x) => x.id !== p.id)]);
      },
    };
  }, [portfolio, library, ready, commit, undo]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function usePortfolio(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("usePortfolio must be used inside PortfolioProvider");
  return s;
}
