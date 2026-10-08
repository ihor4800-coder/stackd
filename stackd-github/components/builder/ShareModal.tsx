"use client";

import { Check, Copy, Download, Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { allocationCents, fmtPct, fmtUsd, FULL, totalBp } from "@/lib/allocation";
import { SITE } from "@/lib/config";
import { cardToPng, sortedAssets, summaryText, xIntentUrl, type ShareMode } from "@/lib/share";
import { downloadFile, slug } from "@/lib/storage";
import type { Portfolio } from "@/lib/types";
import FlatStack from "../FlatStack";
import { Modal } from "../ui";

const W = 1200;
const H = 675;
const MAX_ROWS = 8;

/** The export layout. Rendered at a fixed 1200x675 and scaled down for preview. */
function ShareCard({ portfolio, mode, shot }: { portfolio: Portfolio; mode: ShareMode; shot: string | null }) {
  const rows = sortedAssets(portfolio);
  const shown = rows.slice(0, MAX_ROWS);
  const total = totalBp(portfolio.assets);
  const priv = mode === "private";
  return (
    <div style={{ width: W, height: H, background: "#050711", fontFamily: "var(--font-sans)" }} className="relative overflow-hidden text-snow">
      <div className="absolute -right-24 -top-40 h-[640px] w-[760px] rounded-full" style={{ background: "radial-gradient(closest-side, rgba(36,67,218,0.5), rgba(36,67,218,0))" }} />
      <div className="absolute -bottom-52 left-[-120px] h-[520px] w-[620px] rounded-full" style={{ background: "radial-gradient(closest-side, rgba(138,120,255,0.18), rgba(138,120,255,0))" }} />
      <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(149,163,195,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(149,163,195,0.05) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <div className="absolute bottom-0 right-0 top-0 flex w-[700px] items-center justify-center">
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot} alt="" className="h-full w-full object-contain" />
        ) : (
          <FlatStack assets={portfolio.assets} className="h-[560px] w-[560px]" />
        )}
      </div>

      <div className="absolute bottom-0 left-0 top-0 flex w-[520px] flex-col p-[52px]">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={46} height={46} />
          <span className="font-display text-[24px] font-extrabold tracking-[0.04em]">STACKD</span>
          {priv && <span className="ml-auto rounded-md border border-warn/50 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-warn">Private preview</span>}
        </div>

        <div className="mt-9 font-mono text-[12px] uppercase tracking-[0.22em] text-mute">My stack</div>
        <div className="mt-2 font-display font-extrabold leading-[1.05] tracking-[-0.01em]" style={{ fontSize: portfolio.name.length > 22 ? 34 : 44, overflowWrap: "anywhere" }}>
          {portfolio.name}
        </div>
        {priv && (
          <div className="mt-3 font-mono text-[17px] text-cyan">
            Planned budget {fmtUsd(portfolio.budgetCents)}
          </div>
        )}

        <div className="mt-7 flex flex-col gap-[9px]">
          {shown.map((a) => (
            <div key={a.id} className="flex items-center gap-3">
              <span className="h-[14px] w-[14px] shrink-0 rounded-[4px]" style={{ background: `linear-gradient(160deg, ${a.color}, ${a.color2})` }} />
              <span className="w-[86px] shrink-0 font-display text-[15px] font-bold">{a.ticker}</span>
              <span className="h-[6px] flex-1 overflow-hidden rounded-full" style={{ background: "rgba(149,163,195,0.14)" }}>
                <span className="block h-full rounded-full" style={{ width: `${Math.min(100, a.bp / 100)}%`, background: a.color }} />
              </span>
              <span className="w-[74px] shrink-0 text-right font-mono text-[15px]">{fmtPct(a.bp)}</span>
              {priv && <span className="w-[92px] shrink-0 text-right font-mono text-[13px] text-mute">{fmtUsd(allocationCents(portfolio.budgetCents, a.bp))}</span>}
            </div>
          ))}
          {rows.length > MAX_ROWS && <div className="font-mono text-[12px] text-mute">+ {rows.length - MAX_ROWS} more blocks</div>}
          {total !== FULL && <div className="font-mono text-[12px] text-mute">Total allocated {fmtPct(total)}</div>}
        </div>

        <div className="mt-auto">
          <div className="font-display text-[20px] font-extrabold" style={{ color: "#68E9FF" }}>
            {SITE.ticker}
          </div>
          <div className="mt-1 text-[15px] text-mute">{SITE.tagline}</div>
        </div>
      </div>
    </div>
  );
}

export default function ShareModal({ open, onClose, portfolio, shot, notify }: { open: boolean; onClose: () => void; portfolio: Portfolio; shot: string | null; notify: (msg: string) => void }) {
  const [mode, setMode] = useState<ShareMode>("public");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(0.5);
  const frame = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setMode("public");
  }, [open]);

  useEffect(() => {
    const el = frame.current;
    if (!open || !el) return;
    const fit = () => setScale(el.clientWidth / W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const empty = sortedAssets(portfolio).length === 0;

  const download = async () => {
    if (!card.current) return;
    setBusy(true);
    try {
      const png = await cardToPng(card.current);
      downloadFile(`stackd-${slug(portfolio.name)}${mode === "private" ? "-private" : ""}.png`, png);
      notify("PNG card downloaded");
    } catch {
      notify("The card could not be rendered in this browser");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText(portfolio, mode));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      notify("Clipboard access was blocked");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Show the world your stack." kicker="Share card" wide>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <div ref={frame} className="relative w-full overflow-hidden rounded-2xl border border-line" style={{ aspectRatio: `${W} / ${H}` }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: W, height: H }}>
              <div ref={card} data-share-card>
                <ShareCard portfolio={portfolio} mode={mode} shot={shot} />
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-mute">
            {shot ? "The 3D view is captured from your live stack." : "3D capture is unavailable here, so the card uses the flat stack graphic."} PNG exports at 2400 × 1350.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <div className="label mb-2">Card mode</div>
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-ink/50 p-1">
              {(["public", "private"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-display text-[10px] font-semibold uppercase tracking-wider transition ${mode === m ? "bg-snow/10 text-snow" : "text-mute hover:text-snow"}`}>
                  {m === "public" ? <EyeOff size={12} /> : <Eye size={12} />} {m === "public" ? "Public" : "Private preview"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-mute">
              {mode === "public" ? "Shows percentages only. Your budget and dollar amounts stay hidden." : "Shows your budget and the dollars planned for each block. Meant for your own eyes."}
            </p>
          </div>

          <button type="button" className="btn-primary" onClick={download} disabled={busy || empty}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} {busy ? "Rendering" : "Download PNG"}
          </button>
          <button type="button" className="btn-ghost" onClick={copy} disabled={empty}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy portfolio summary"}
          </button>
          <a href={empty ? undefined : xIntentUrl(portfolio)} target="_blank" rel="noreferrer" aria-disabled={empty} className={`btn-ghost ${empty ? "pointer-events-none opacity-40" : ""}`}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
            </svg>
            Share on X
          </a>
          <p className="text-[11px] leading-relaxed text-mute">
            Share on X opens a post with your tickers and percentages as text (never the budget). X does not accept the image from here, so download the PNG and attach it to the post yourself.
          </p>
          {empty && <p className="text-xs text-warn">Add at least one block with an allocation to export a card.</p>}
        </div>
      </div>
    </Modal>
  );
}
