"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, RotateCcw, Scale, Trash2 } from "lucide-react";
import { allocationCents, fmtPct, fmtUsd, FULL, stats } from "@/lib/allocation";
import { inkOn } from "@/lib/assets";
import { demoPortfolio, DEMOS, emptyPortfolio } from "@/lib/demos";
import { MAX_ASSETS } from "@/lib/storage";
import { usePortfolio } from "@/state/portfolio";
import { AnimatedNumber, ConfirmButton } from "../ui";
import { PercentInput } from "./fields";

const pct = (v: number) => fmtPct(Math.round(v));

export function AllocationMeter() {
  const { portfolio, dispatch } = usePortfolio();
  const s = stats(portfolio.assets);
  const tone = s.status === "over" ? "text-bad" : s.status === "exact" ? "text-cyan" : "text-warn";
  return (
    <div className="rounded-xl border border-line bg-ink/50 p-3.5">
      <div className="flex items-baseline justify-between">
        <span className="label">Total allocation</span>
        <span className={`font-mono text-lg font-semibold ${tone}`} aria-live="polite">
          <AnimatedNumber value={s.total} format={pct} />
        </span>
      </div>
      <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-snow/[0.07]">
        {portfolio.assets.map((a) => (
          <div key={a.id} className="h-full transition-[width] duration-300" style={{ width: `${(a.bp / Math.max(FULL, s.total)) * 100}%`, background: a.color }} />
        ))}
      </div>
      <div className="mt-2.5 flex min-h-[32px] items-center justify-between gap-3">
        <p className={`text-xs ${s.status === "exact" ? "text-mute" : tone}`}>
          {s.status === "empty" && "Add a block to start allocating."}
          {s.status === "exact" && "Fully allocated. Every block is in place."}
          {s.status === "under" && `Unallocated: ${fmtPct(s.unallocated)}`}
          {s.status === "over" && `Over by ${fmtPct(s.over)}. Lower a block or auto balance.`}
        </p>
        <button type="button" className="btn-ghost !px-2.5 !py-1.5 !text-[10px]" disabled={s.total === 0 || s.total === FULL} onClick={() => dispatch({ type: "balance" })} title="Scale every allocation proportionally so the total is exactly 100%">
          <Scale size={12} /> Auto balance
        </button>
      </div>
    </div>
  );
}

export default function AssetPanel({ selectedId, onSelect, onAdd }: { selectedId: string | null; onSelect: (id: string | null) => void; onAdd: () => void }) {
  const { portfolio, dispatch, swap } = usePortfolio();
  const full = portfolio.assets.length >= MAX_ASSETS;

  return (
    <div className="space-y-3">
      <AllocationMeter />

      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {portfolio.assets.map((a) => (
            <motion.li
              key={a.id}
              layout="position"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
              className={`rounded-xl border p-3 transition-colors ${selectedId === a.id ? "border-cyan/60 bg-cyan/[0.06]" : "border-line bg-ink/40 hover:border-snow/20"}`}
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onSelect(selectedId === a.id ? null : a.id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  title="Select this block in the 3D stack"
                >
                  <span
                    className="flex h-8 min-w-[46px] items-center justify-center rounded-lg px-1.5 font-display text-[10px] font-extrabold"
                    style={{ background: `linear-gradient(160deg, ${a.color}, ${a.color2})`, color: inkOn(a.color) }}
                  >
                    {a.ticker}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium leading-tight">{a.name}</span>
                    <span className="block font-mono text-[11px] text-mute">{fmtUsd(allocationCents(portfolio.budgetCents, a.bp))}</span>
                  </span>
                </button>
                <PercentInput bp={a.bp} onChange={(bp) => dispatch({ type: "bp", id: a.id, bp })} label={`${a.ticker} allocation percent`} />
                <button type="button" className="btn-icon !h-8 !w-8" onClick={() => dispatch({ type: "remove", id: a.id })} aria-label={`Remove ${a.ticker}`} title={`Remove ${a.ticker}`}>
                  <Trash2 size={13} />
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={a.bp / 100}
                onChange={(e) => dispatch({ type: "bp", id: a.id, bp: Number(e.target.value) * 100 })}
                className="slider mt-2"
                style={{ "--v": a.bp / 100, "--c": a.color } as React.CSSProperties}
                aria-label={`${a.ticker} allocation slider`}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {portfolio.assets.length === 0 && (
        <div className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-mute">
          No blocks yet. Add your first asset or start from an example below.
        </div>
      )}

      <button type="button" className="btn-primary w-full" onClick={onAdd} disabled={full}>
        <Plus size={14} /> Add asset
      </button>
      {full && <p className="text-center text-xs text-mute">A stack holds up to {MAX_ASSETS} blocks.</p>}

      <div className="rounded-xl border border-line bg-ink/40 p-3.5">
        <div className="label mb-2.5">Start from an example</div>
        <div className="grid gap-1.5">
          {DEMOS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => {
                onSelect(null);
                swap(demoPortfolio(d), `Loaded example "${d.name}"`);
              }}
              className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-left text-[13px] transition hover:border-cyan/50 hover:bg-snow/[0.04]"
            >
              <span>{d.name}</span>
              <span className="flex h-2 w-20 shrink-0 overflow-hidden rounded-full">
                {demoPortfolio(d).assets.map((a) => (
                  <span key={a.ticker} style={{ width: `${a.bp / 100}%`, background: a.color }} />
                ))}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-mute">Examples only. They are not recommended investments.</p>
      </div>

      <ConfirmButton
        className="btn-ghost w-full"
        onConfirm={() => {
          onSelect(null);
          swap(emptyPortfolio(), "Stack reset");
        }}
      >
        <RotateCcw size={13} /> Reset everything
      </ConfirmButton>
    </div>
  );
}
