"use client";

import { motion } from "framer-motion";
import { Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { allocationCents, fmtPct, fmtUsd } from "@/lib/allocation";
import { inkOn } from "@/lib/assets";
import type { Cell } from "@/lib/layout3d";
import type { StackAsset } from "@/lib/types";
import { usePortfolio } from "@/state/portfolio";
import { AnimatedNumber } from "../ui";

const pct = (v: number) => fmtPct(Math.round(v));
const usd = (v: number) => fmtUsd(Math.round(v));

export default function AssetDetail({ asset, cell, levels, rank, onClose, onEdit }: { asset: StackAsset; cell?: Cell; levels: number; rank: number; onClose: () => void; onEdit: () => void }) {
  const { portfolio, dispatch } = usePortfolio();
  const position = !cell || cell.level === 0 ? "Not in the stack yet (0%)" : `Level ${cell.level} of ${levels} · #${rank} by size`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="panel z-10 p-4 xl:absolute xl:right-3 xl:top-3 xl:w-[280px]"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 min-w-[56px] items-center justify-center rounded-xl px-2 font-display text-xs font-extrabold" style={{ background: `linear-gradient(160deg, ${asset.color}, ${asset.color2})`, color: inkOn(asset.color) }}>
          {asset.ticker}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-sm font-bold">{asset.name}</div>
          <div className="label mt-0.5">{asset.custom ? "Custom asset" : "Catalog asset"}</div>
        </div>
        <button type="button" className="btn-icon !h-8 !w-8" onClick={onClose} aria-label="Close asset details">
          <X size={14} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-ink/60 p-2.5">
          <div className="label">Allocation</div>
          <div className="mt-1 font-mono text-lg font-semibold text-cyan">
            <AnimatedNumber value={asset.bp} format={pct} />
          </div>
        </div>
        <div className="rounded-lg bg-ink/60 p-2.5">
          <div className="label">Allocated</div>
          <div className="mt-1 truncate font-mono text-lg font-semibold">
            <AnimatedNumber value={allocationCents(portfolio.budgetCents, asset.bp)} format={usd} />
          </div>
        </div>
      </div>

      <dl className="mt-3 space-y-1.5 text-[12.5px]">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-mute">Material</dt>
          <dd className="flex items-center gap-2 text-right">
            <span className="h-3 w-6 rounded-[3px]" style={{ background: `linear-gradient(90deg, ${asset.color}, ${asset.color2})` }} />
            {asset.material}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-mute">Colour</dt>
          <dd className="font-mono uppercase">{asset.color}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-mute">Position</dt>
          <dd className="text-right">{position}</dd>
        </div>
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className="btn-ghost !px-2" disabled={asset.bp <= 0} onClick={() => dispatch({ type: "bp", id: asset.id, bp: asset.bp - 100 })}>
          <Minus size={13} /> Decrease
        </button>
        <button type="button" className="btn-ghost !px-2" disabled={asset.bp >= 10000} onClick={() => dispatch({ type: "bp", id: asset.id, bp: asset.bp + 100 })}>
          <Plus size={13} /> Increase
        </button>
        <button type="button" className="btn-ghost !px-2" onClick={onEdit}>
          <Pencil size={13} /> Edit asset
        </button>
        <button
          type="button"
          className="btn-ghost !px-2 hover:!border-bad/60 hover:!text-bad"
          onClick={() => {
            dispatch({ type: "remove", id: asset.id });
            onClose();
          }}
        >
          <Trash2 size={13} /> Remove
        </button>
      </div>
    </motion.div>
  );
}
