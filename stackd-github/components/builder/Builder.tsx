"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, ChevronDown, FolderOpen, Focus, RotateCw, Save, Share2, Tag, Undo2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { fmtPct, FULL, stats } from "@/lib/allocation";
import { layoutStack } from "@/lib/layout3d";
import { hasPixels } from "@/lib/share";
import { usePortfolio } from "@/state/portfolio";
import type { StackApi } from "../three/StackCanvas";
import StackStage from "../three/StackStage";
import { Logo } from "../ui";
import AnalyticsPanel from "./AnalyticsPanel";
import AssetDetail from "./AssetDetail";
import { AddAssetModal, EditAssetModal } from "./AssetModal";
import AssetPanel from "./AssetPanel";
import { BudgetInput } from "./fields";
import LibraryModal from "./LibraryModal";
import ShareModal from "./ShareModal";

/** Side panel: always open on desktop, collapsible below it. */
function Section({ title, meta, children, defaultOpen = true }: { title: string; meta?: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="panel flex flex-col xl:min-h-0 xl:flex-1">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex items-center justify-between gap-3 px-4 py-3.5 xl:pointer-events-none">
        <span className="font-display text-xs font-bold uppercase tracking-[0.08em]">{title}</span>
        <span className="flex items-center gap-2">
          {meta && <span className="label">{meta}</span>}
          <ChevronDown size={15} className={`text-mute transition xl:hidden ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <div className={`thin-scroll px-3 pb-3 xl:block xl:min-h-0 xl:flex-1 xl:overflow-y-auto ${open ? "" : "hidden"}`}>{children}</div>
    </div>
  );
}

function Toggle({ on, onClick, label, children }: { on: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} title={label} aria-label={label} className={`btn-icon !h-10 !w-10 ${on ? "!border-cyan/60 !bg-cyan/10 !text-cyan" : ""}`}>
      {children}
    </button>
  );
}

export default function Builder({ onExit }: { onExit: () => void }) {
  const { portfolio, dispatch, dirty, save, undo, undoSwap, clearUndo } = usePortfolio();
  const calm = useReducedMotion() ?? false;
  const api = useRef<StackApi | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exploded, setExploded] = useState(false);
  const [labels, setLabels] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [share, setShare] = useState<{ shot: string | null } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const s = stats(portfolio.assets);
  const cells = useMemo(() => layoutStack(portfolio.assets), [portfolio.assets]);
  const selected = portfolio.assets.find((a) => a.id === selectedId) ?? null;
  const editing = portfolio.assets.find((a) => a.id === editingId) ?? null;
  const levels = useMemo(() => Math.max(0, ...[...cells.values()].map((c) => c.level)), [cells]);
  const rank = selected ? [...portfolio.assets].sort((a, b) => b.bp - a.bp).findIndex((a) => a.id === selected.id) + 1 : 0;

  useEffect(() => {
    if (selectedId && !selected) setSelectedId(null);
  }, [selectedId, selected]);

  const notify = useCallback((msg: string) => setToast(msg), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(clearUndo, 9000);
    return () => clearTimeout(t);
  }, [undo, clearUndo]);

  const openShare = async () => {
    // capture synchronously from a freshly rendered frame, then make sure it is not blank
    const shot = api.current?.capture() ?? null;
    const usable = shot ? await hasPixels(shot) : false;
    setShare({ shot: usable ? shot : null });
  };

  const tone = s.status === "over" ? "border-bad/50 text-bad" : s.status === "exact" ? "border-cyan/40 text-cyan" : "border-warn/50 text-warn";

  return (
    <div className="flex min-h-dvh flex-col xl:h-dvh xl:overflow-hidden">
      <header className="z-30 border-b border-line bg-ink/80 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-4">
          <button type="button" onClick={onExit} className="flex items-center gap-2 rounded-lg pr-2 text-mute transition hover:text-snow" title="Back to the intro" aria-label="Back to the intro">
            <ArrowLeft size={15} />
            <Logo size={28} />
            <span className="hidden font-display text-sm font-extrabold tracking-[0.04em] text-snow sm:block">STACKD</span>
          </button>

          <div className="order-3 flex w-full items-center gap-2 md:order-none md:w-auto md:flex-1">
            <input
              aria-label="Portfolio name"
              value={portfolio.name}
              maxLength={48}
              placeholder="Name your stack"
              onChange={(e) => dispatch({ type: "name", name: e.target.value })}
              className="h-10 min-w-0 flex-1 rounded-[10px] border border-transparent bg-transparent px-2.5 font-display text-sm font-bold outline-none transition hover:border-line focus:border-cyan/60 focus:bg-ink/60 md:max-w-[340px]"
            />
            <div className="w-[170px] shrink-0 sm:w-[190px]">
              <BudgetInput cents={portfolio.budgetCents} onChange={(cents) => dispatch({ type: "budget", cents })} />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button type="button" className="btn-ghost !px-3" onClick={() => setLibraryOpen(true)}>
              <FolderOpen size={14} /> <span className="hidden sm:inline">Stacks</span>
            </button>
            <button type="button" className="btn-ghost !px-3" disabled={!dirty} onClick={() => notify(save() ? `Saved "${portfolio.name}" to this browser` : "This browser blocked storage, so nothing was saved")}>
              {dirty ? <Save size={14} /> : <Check size={14} />} <span className="hidden sm:inline">{dirty ? "Save" : "Saved"}</span>
            </button>
            <button type="button" className="btn-primary !px-3.5" onClick={openShare}>
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>
      </header>

      <div className="grid flex-1 gap-3 p-3 md:grid-cols-2 xl:min-h-0 xl:grid-cols-[350px_minmax(0,1fr)_330px]">
        <div className="order-1 flex flex-col gap-3 md:col-span-2 xl:relative xl:order-2 xl:col-span-1 xl:min-h-0">
          <section className="relative h-[54dvh] min-h-[380px] md:h-[60dvh] overflow-hidden rounded-2xl border border-line bg-deep/70 xl:h-auto xl:flex-1" aria-label="3D stack">
            <div className="grid-backdrop pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(closest-side, rgba(36,67,218,0.26), rgba(36,67,218,0))" }} />
            <div className="absolute inset-0">
              <StackStage assets={portfolio.assets} mode="builder" exploded={exploded} showLabels={labels} autoRotate={autoRotate} selectedId={selectedId} onSelect={setSelectedId} apiRef={api} calm={calm} />
            </div>

            <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
              <span className={`rounded-lg border bg-ink/75 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] backdrop-blur ${tone}`}>Total allocation: {fmtPct(s.total)}</span>
              {s.status === "under" && <span className="rounded-lg border border-line bg-ink/75 px-2.5 py-1 font-mono text-[11px] text-mute backdrop-blur">Unallocated: {fmtPct(s.unallocated)}</span>}
              {s.status === "over" && <span className="rounded-lg border border-line bg-ink/75 px-2.5 py-1 font-mono text-[11px] text-mute backdrop-blur">Over 100% by {fmtPct(s.total - FULL)}</span>}
            </div>
            <span className="label pointer-events-none absolute right-3 top-3 hidden rounded-lg border border-line bg-ink/60 px-2.5 py-1.5 backdrop-blur sm:block xl:hidden 2xl:block">Drag to rotate · scroll to zoom · click a block</span>

            {s.count === 0 && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                <p className="font-display text-base font-bold">An empty frame, waiting for blocks.</p>
                <button type="button" className="btn-primary pointer-events-auto" onClick={() => setAdding(true)}>
                  Add your first block
                </button>
              </div>
            )}

            <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-center gap-2">
              <button type="button" className={exploded ? "btn-ghost !bg-ink/80 !py-3 backdrop-blur" : "btn-primary !py-3"} onClick={() => setExploded((v) => !v)} disabled={s.total === 0}>
                {exploded ? "Reassemble" : "Explode my stack"}
              </button>
              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-ink/75 p-1 backdrop-blur">
                <Toggle on={labels || exploded} onClick={() => setLabels((v) => !v)} label={labels ? "Hide labels" : "Show labels"}>
                  <Tag size={15} />
                </Toggle>
                <Toggle on={autoRotate} onClick={() => setAutoRotate((v) => !v)} label={autoRotate ? "Stop auto rotation" : "Start auto rotation"}>
                  <RotateCw size={15} />
                </Toggle>
                <button type="button" className="btn-icon !h-10 !w-10" onClick={() => api.current?.resetCamera()} title="Reset camera" aria-label="Reset camera">
                  <Focus size={15} />
                </button>
              </div>
            </div>
          </section>

          <AnimatePresence>
            {selected && <AssetDetail key={selected.id} asset={selected} cell={cells.get(selected.id)} levels={levels} rank={rank} onClose={() => setSelectedId(null)} onEdit={() => setEditingId(selected.id)} />}
          </AnimatePresence>
        </div>

        <aside className="order-2 flex flex-col xl:order-1 xl:min-h-0">
          <Section title="Assets" meta={`${s.count} ${s.count === 1 ? "block" : "blocks"}`}>
            <AssetPanel selectedId={selectedId} onSelect={setSelectedId} onAdd={() => setAdding(true)} />
          </Section>
        </aside>

        <aside className="order-3 flex flex-col xl:min-h-0">
          <Section title="Analytics" meta="Planned, not live">
            <AnalyticsPanel selectedId={selectedId} onSelect={setSelectedId} />
          </Section>
        </aside>
      </div>

      <AddAssetModal open={adding} onClose={() => setAdding(false)} />
      <EditAssetModal asset={editing} onClose={() => setEditingId(null)} />
      <LibraryModal open={libraryOpen} onClose={() => setLibraryOpen(false)} notify={notify} />
      <ShareModal open={Boolean(share)} onClose={() => setShare(null)} portfolio={portfolio} shot={share?.shot ?? null} notify={notify} />

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {undo && (
            <motion.div key="undo" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm shadow-panel">
              <span>{undo.label}</span>
              <button type="button" className="flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-wider text-cyan hover:underline" onClick={undoSwap}>
                <Undo2 size={13} /> Undo
              </button>
            </motion.div>
          )}
          {toast && (
            <motion.div key="toast" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm shadow-panel">
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
