"use client";

import { Check, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { fmtPct } from "@/lib/allocation";
import { CATALOG, CUSTOM_SWATCHES, customAsset, fromCatalog, inkOn, isHex, shade } from "@/lib/assets";
import { MAX_ASSETS } from "@/lib/storage";
import type { StackAsset } from "@/lib/types";
import { usePortfolio } from "@/state/portfolio";
import { Modal } from "../ui";

function AssetForm({ initial, taken, submitLabel, onSubmit }: { initial?: StackAsset; taken: string[]; submitLabel: string; onSubmit: (v: { name: string; ticker: string; color: string }) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [ticker, setTicker] = useState(initial?.ticker ?? "");
  const [color, setColor] = useState(initial?.color ?? CUSTOM_SWATCHES[0]);
  const [touched, setTouched] = useState(false);

  const cleanTicker = ticker.trim().toUpperCase();
  const errors = {
    name: name.trim() ? "" : "Give the asset a name.",
    ticker: !cleanTicker ? "Add a ticker, up to 8 characters." : taken.includes(cleanTicker) ? `${cleanTicker} is already in this stack.` : "",
  };
  const valid = !errors.name && !errors.ticker && isHex(color);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (valid) onSubmit({ name: name.trim().slice(0, 32), ticker: cleanTicker, color });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <label className="block">
          <span className="label mb-1.5 block">Name</span>
          <input className="field" value={name} maxLength={32} placeholder="My Favourite Coin" onChange={(e) => setName(e.target.value)} />
          {touched && errors.name && <span className="mt-1 block text-xs text-bad">{errors.name}</span>}
        </label>
        <label className="block">
          <span className="label mb-1.5 block">Ticker</span>
          <input className="field font-mono uppercase" value={ticker} maxLength={8} placeholder="COIN" onChange={(e) => setTicker(e.target.value.replace(/[^a-zA-Z0-9$]/g, ""))} />
        </label>
      </div>
      {touched && errors.ticker && <span className="block text-xs text-bad">{errors.ticker}</span>}

      <div>
        <span className="label mb-2 block">Colour</span>
        <div className="flex flex-wrap items-center gap-2">
          {CUSTOM_SWATCHES.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Colour ${c}`} className={`h-8 w-8 rounded-lg transition ${color.toLowerCase() === c.toLowerCase() ? "ring-2 ring-snow ring-offset-2 ring-offset-deep" : "hover:scale-110"}`} style={{ background: c }} />
          ))}
          <label className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-line px-2 font-mono text-xs uppercase text-mute">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0" aria-label="Pick any colour" />
            {color}
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-ink/50 p-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 min-w-[60px] items-center justify-center rounded-xl px-2 font-display text-xs font-extrabold" style={{ background: `linear-gradient(160deg, ${color}, ${shade(color, -0.45)})`, color: inkOn(color) }}>
            {cleanTicker || "COIN"}
          </span>
          <span className="text-xs text-mute">Block preview</span>
        </div>
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export function AddAssetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { portfolio, dispatch, nextBp } = usePortfolio();
  const [tab, setTab] = useState<"catalog" | "custom">("catalog");
  useEffect(() => {
    if (open) setTab("catalog");
  }, [open]);
  const taken = portfolio.assets.map((a) => a.ticker);
  const full = portfolio.assets.length >= MAX_ASSETS;
  const start = nextBp();

  return (
    <Modal open={open} onClose={onClose} title="Add a block to your stack" kicker="Asset catalog">
      <div className="mb-4 flex gap-1 rounded-xl border border-line bg-ink/50 p-1">
        {(["catalog", "custom"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`flex-1 rounded-lg py-2 font-display text-[11px] font-semibold uppercase tracking-wider transition ${tab === t ? "bg-snow/10 text-snow" : "text-mute hover:text-snow"}`}>
            {t === "catalog" ? "Catalog" : "Custom asset"}
          </button>
        ))}
      </div>

      {full ? (
        <p className="rounded-xl border border-line p-4 text-sm text-mute">This stack already holds {MAX_ASSETS} blocks. Remove one to add another.</p>
      ) : tab === "catalog" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {CATALOG.map((c) => {
            const inStack = taken.includes(c.ticker);
            return (
              <button
                key={c.ticker}
                type="button"
                disabled={inStack}
                onClick={() => dispatch({ type: "add", asset: fromCatalog(c.ticker, start) })}
                className="group flex items-center gap-3 rounded-xl border border-line bg-ink/40 p-2.5 text-left transition enabled:hover:border-cyan/50 enabled:hover:bg-snow/[0.04] disabled:opacity-55"
              >
                <span className="flex h-10 min-w-[54px] items-center justify-center rounded-lg px-1.5 font-display text-[10px] font-extrabold" style={{ background: `linear-gradient(160deg, ${c.color}, ${c.color2})`, color: inkOn(c.color) }}>
                  {c.ticker}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  <span className="block truncate text-[11px] text-mute">{c.material}</span>
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-mute group-enabled:group-hover:border-cyan/50 group-enabled:group-hover:text-cyan">
                  {inStack ? <Check size={13} /> : <Plus size={13} />}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <AssetForm
          key={portfolio.assets.length}
          taken={taken}
          submitLabel="Add block"
          onSubmit={({ name, ticker, color }) => {
            dispatch({ type: "add", asset: customAsset(name, ticker, color, start) });
            onClose();
          }}
        />
      )}
      <p className="mt-4 text-[11px] leading-relaxed text-mute">
        New blocks start at {fmtPct(start)}. Nothing else is changed for you: if the total passes 100%, lower a block or press Auto Balance. No prices are attached to any asset.
      </p>
    </Modal>
  );
}

export function EditAssetModal({ asset, onClose }: { asset: StackAsset | null; onClose: () => void }) {
  const { portfolio, dispatch } = usePortfolio();
  return (
    <Modal open={Boolean(asset)} onClose={onClose} title={asset ? `Edit ${asset.ticker}` : "Edit asset"} kicker="Asset">
      {asset && (
        <AssetForm
          key={asset.id}
          initial={asset}
          taken={portfolio.assets.filter((a) => a.id !== asset.id).map((a) => a.ticker)}
          submitLabel="Save changes"
          onSubmit={({ name, ticker, color }) => {
            // a new colour gets a matching darker tone; an untouched one keeps its catalog material
            const recolour = color.toLowerCase() !== asset.color.toLowerCase();
            dispatch({ type: "edit", id: asset.id, patch: { name, ticker, color, ...(recolour ? { color2: shade(color, -0.45), material: "Custom gloss", finish: "gloss" as const } : {}) } });
            onClose();
          }}
        />
      )}
    </Modal>
  );
}
