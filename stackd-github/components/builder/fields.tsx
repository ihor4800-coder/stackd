"use client";

import { useEffect, useState } from "react";
import { parseBudget, parsePercent } from "@/lib/allocation";

/** Precise percentage entry. Invalid text is flagged and never applied. */
export function PercentInput({ bp, onChange, label }: { bp: number; onChange: (bp: number) => void; label: string }) {
  const [text, setText] = useState(String(bp / 100));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(String(bp / 100));
  }, [bp, focused]);
  const invalid = focused && parsePercent(text) === null;
  return (
    <label className={`flex h-8 w-[74px] shrink-0 items-center rounded-lg border bg-ink/60 pl-2 pr-1.5 font-mono text-[13px] transition ${invalid ? "border-bad" : "border-line focus-within:border-cyan/60"}`}>
      <input
        aria-label={label}
        aria-invalid={invalid}
        inputMode="decimal"
        value={text}
        onFocus={(e) => {
          setFocused(true);
          e.target.select();
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setText(e.target.value);
          const v = parsePercent(e.target.value);
          if (v !== null) onChange(v);
        }}
        className="w-full min-w-0 bg-transparent text-right outline-none"
      />
      <span className="ml-0.5 text-mute">%</span>
    </label>
  );
}

export function BudgetInput({ cents, onChange }: { cents: number; onChange: (cents: number) => void }) {
  const pretty = (c: number) => (c / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const [text, setText] = useState(pretty(cents));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(pretty(cents));
  }, [cents, focused]);
  const invalid = focused && parseBudget(text) === null;
  return (
    <label className={`flex h-10 items-center gap-1 rounded-[10px] border bg-ink/60 px-3 font-mono text-sm transition ${invalid ? "border-bad" : "border-line focus-within:border-cyan/60"}`}>
      <span className="text-mute">$</span>
      <input
        aria-label="Total budget in US dollars"
        aria-invalid={invalid}
        inputMode="decimal"
        value={text}
        onFocus={(e) => {
          setFocused(true);
          setText(String(cents / 100));
          e.target.select();
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setText(e.target.value);
          const v = parseBudget(e.target.value);
          if (v !== null) onChange(v);
        }}
        className="w-full min-w-0 bg-transparent outline-none"
      />
      <span className="label !tracking-wider">USD</span>
    </label>
  );
}
