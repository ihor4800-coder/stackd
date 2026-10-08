"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { allocationCents, fmtPct, fmtUsd, stackDna, stats } from "@/lib/allocation";
import { usePortfolio } from "@/state/portfolio";
import { AnimatedNumber } from "../ui";

const usd = (v: number) => fmtUsd(Math.round(v));
const pct = (v: number) => fmtPct(Math.round(v));
const int = (v: number) => String(Math.round(v));

function Tile({ label, children, sub }: { label: string; children: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/50 p-3">
      <div className="label">{label}</div>
      <div className="mt-1.5 truncate font-mono text-[17px] font-semibold leading-tight">{children}</div>
      {sub && <div className="mt-0.5 truncate text-[11px] text-mute">{sub}</div>}
    </div>
  );
}

export default function AnalyticsPanel({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string | null) => void }) {
  const { portfolio } = usePortfolio();
  const s = stats(portfolio.assets);
  const dna = useMemo(() => stackDna(portfolio.assets), [portfolio.assets]);
  const rows = useMemo(() => [...portfolio.assets].sort((a, b) => b.bp - a.bp), [portfolio.assets]);
  const slices = useMemo(() => {
    const data = rows.filter((a) => a.bp > 0).map((a) => ({ id: a.id, name: a.ticker, value: a.bp, color: a.color }));
    if (s.unallocated > 0) data.push({ id: "__free", name: "Unallocated", value: s.unallocated, color: "rgba(149,163,195,0.14)" });
    return data;
  }, [rows, s.unallocated]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Tile label="Total budget" sub="Planned, not a market value">
          <AnimatedNumber value={portfolio.budgetCents} format={usd} />
        </Tile>
        <Tile label="Asset count" sub={s.count === 1 ? "block" : "blocks"}>
          <AnimatedNumber value={s.count} format={int} />
        </Tile>
        <Tile label="Largest allocation" sub={s.largest ? s.largest.name : "Nothing allocated"}>
          {s.largest ? (
            <>
              {s.largest.ticker} <span className="text-cyan">{fmtPct(s.largest.bp)}</span>
            </>
          ) : (
            "—"
          )}
        </Tile>
        <Tile label={s.over > 0 ? "Over-allocated" : "Unallocated"} sub={s.over > 0 ? "Above 100%" : fmtUsd(allocationCents(portfolio.budgetCents, s.unallocated))}>
          <span className={s.over > 0 ? "text-bad" : s.unallocated > 0 ? "text-warn" : ""}>
            <AnimatedNumber value={s.over > 0 ? s.over : s.unallocated} format={pct} />
          </span>
        </Tile>
      </div>

      <div className="rounded-xl border border-line bg-ink/50 p-3.5">
        <div className="label">Allocation</div>
        <div className="relative mx-auto mt-2 h-[188px] w-full max-w-[240px]">
          {slices.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="96%" paddingAngle={slices.length > 1 ? 2 : 0} cornerRadius={4} stroke="none" startAngle={90} endAngle={-270} animationDuration={450} onClick={(d: { id?: string }) => d.id && d.id !== "__free" && onSelect(d.id)}>
                  {slices.map((d) => (
                    <Cell key={d.id} fill={d.color} opacity={selectedId && selectedId !== d.id ? 0.35 : 1} style={{ cursor: d.id === "__free" ? "default" : "pointer", outline: "none" }} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-3 rounded-full border-[14px] border-snow/[0.06]" />
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-mono text-2xl font-semibold ${s.status === "over" ? "text-bad" : ""}`}>
              <AnimatedNumber value={s.total} format={pct} />
            </span>
            <span className="label mt-0.5">allocated</span>
          </div>
        </div>
        {s.over > 0 && <p className="mt-2 text-center text-[11px] text-bad">Above 100%: chart and blocks show each share of the entered total.</p>}
        <ul className="mt-3 space-y-0.5">
          {rows.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onSelect(selectedId === a.id ? null : a.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] transition hover:bg-snow/[0.05] ${selectedId === a.id ? "bg-snow/[0.06]" : ""}`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: a.color }} />
                <span className="w-14 shrink-0 font-display text-[11px] font-bold">{a.ticker}</span>
                <span className="flex-1 truncate text-right font-mono text-xs text-mute">{fmtUsd(allocationCents(portfolio.budgetCents, a.bp))}</span>
                <span className="w-16 shrink-0 text-right font-mono text-xs">{fmtPct(a.bp)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-line bg-ink/50 p-3.5">
        <div className="label">Your stack DNA</div>
        <ul className="mt-2.5 space-y-2">
          {dna.map((line) => (
            <li key={line} className="flex gap-2.5 text-[13px] leading-snug text-snow/90">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-[2px] bg-cyan" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-mute">Calculated from the numbers you entered. No prices, no predictions.</p>
      </div>
    </div>
  );
}
