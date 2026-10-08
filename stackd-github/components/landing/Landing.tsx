"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BarChart3, Check, Copy, Menu, Send, X as Close } from "lucide-react";
import { useMemo, useState } from "react";
import { fmtPct } from "@/lib/allocation";
import { fromCatalog } from "@/lib/assets";
import { CONTRACT_ADDRESS, LINKS, SITE } from "@/lib/config";
import { demoPortfolio, DEMOS, type Demo } from "@/lib/demos";
import { usePortfolio } from "@/state/portfolio";
import FlatStack from "../FlatStack";
import StackStage from "../three/StackStage";
import { Wordmark } from "../ui";

function XMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
    </svg>
  );
}

const HERO_MIX: [string, number][] = [["SOL", 30], ["BTC", 22], ["ETH", 18], ["USDC", 12], ["BONK", 10], ["JUP", 8]];

function Nav({ onBuild }: { onBuild: () => void }) {
  const [open, setOpen] = useState(false);
  const links = (
    <>
      <button type="button" onClick={onBuild} className="transition hover:text-snow">
        Build
      </button>
      <a href="#demo" onClick={() => setOpen(false)} className="transition hover:text-snow">
        Explore Demo
      </a>
      <a href="#how" onClick={() => setOpen(false)} className="transition hover:text-snow">
        How It Works
      </a>
      {LINKS.x ? (
        <a href={LINKS.x} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition hover:text-snow">
          <XMark size={12} /> Twitter
        </a>
      ) : (
        <span className="flex items-center gap-1.5 opacity-60" title="X link coming soon">
          <XMark size={12} /> Twitter <span className="rounded border border-line px-1 font-mono text-[9px] uppercase tracking-wider">soon</span>
        </span>
      )}
    </>
  );
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-4 px-5 sm:px-8">
        <Wordmark onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
        <nav className="hidden items-center gap-8 text-[13px] font-medium text-mute md:flex">{links}</nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBuild} className="btn-primary !px-3.5 sm:!px-4">
            <span className="hidden min-[420px]:inline">Build my stack</span>
            <span className="min-[420px]:hidden">Build</span> <ArrowRight size={14} />
          </button>
          <button type="button" className="btn-icon md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu" aria-expanded={open}>
            {open ? <Close size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>
      {open && <nav className="flex flex-col items-start gap-4 border-t border-line px-5 py-5 text-sm font-medium text-mute md:hidden">{links}</nav>}
    </header>
  );
}

function Hero({ onBuild }: { onBuild: () => void }) {
  const calm = useReducedMotion() ?? false;
  const assets = useMemo(() => HERO_MIX.map(([t, p]) => ({ ...fromCatalog(t, p * 100), id: `hero-${t}` })), []);
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: calm ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  });
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-72 top-[-22%] h-[1100px] w-[1100px]" style={{ background: "radial-gradient(closest-side, rgba(36,67,218,0.3), rgba(36,67,218,0))" }} />
      <div className="pointer-events-none absolute left-[-20%] top-[30%] h-[700px] w-[800px]" style={{ background: "radial-gradient(closest-side, rgba(138,120,255,0.1), rgba(138,120,255,0))" }} />
      <div className="relative mx-auto grid max-w-[1320px] items-center gap-6 px-5 pb-14 pt-10 sm:px-8 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:pb-10 lg:pt-0">
        <div className="relative z-10">
          <motion.div {...rise(0)} className="label mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-cyan" />
            The next way to visualize crypto
          </motion.div>
          <motion.h1 {...rise(0.06)} className="font-display text-[clamp(2.1rem,6.2vw,4.6rem)] font-extrabold leading-[1.02] tracking-[-0.02em]">
            Don&apos;t just hold.
            <br />
            <span className="grad-text">Build your stack.</span>
          </motion.h1>
          <motion.p {...rise(0.14)} className="mt-6 max-w-[30rem] text-[17px] leading-relaxed text-mute">
            Turn your crypto ideas into something you can actually see. Build, balance and visualize your perfect portfolio — one block at a time.
          </motion.p>
          <motion.div {...rise(0.22)} className="mt-9 flex flex-wrap items-center gap-3">
            <button type="button" onClick={onBuild} className="btn-primary !px-6 !py-3.5 !text-xs">
              Start building <ArrowRight size={15} />
            </button>
            <a href="#demo" className="btn-ghost !px-6 !py-3.5 !text-xs">
              Explore demo
            </a>
          </motion.div>
          <motion.p {...rise(0.3)} className="mt-5 font-mono text-xs text-mute">
            No wallet. No signup. Just your stack.
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.15 }} className="relative mx-auto aspect-square w-full max-w-[640px] lg:max-w-none">
          <div className="grid-backdrop absolute inset-0" />
          <div className="absolute inset-0">
            <StackStage assets={assets} mode="hero" calm={calm} />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span className="label rounded-full border border-line bg-ink/70 px-3 py-1.5 backdrop-blur">Example stack · 6 blocks · volume = allocation</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DemoCard({ demo, index, onLoad }: { demo: Demo; index: number; onLoad: () => void }) {
  // fixed ids keep the server and client markup identical
  const assets = useMemo(() => demo.mix.map(([t, p]) => ({ ...fromCatalog(t, p * 100), id: `${demo.key}-${t}` })), [demo]);
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="panel group flex flex-col overflow-hidden transition duration-300 hover:border-cyan/40"
    >
      <div className="relative flex h-56 items-center justify-center border-b border-line bg-ink/50">
        <span className="label absolute left-4 top-4 rounded-md border border-cyan/30 bg-cyan/10 px-2 py-1 !text-cyan">Example {index + 1}</span>
        <FlatStack assets={assets} className="h-48 transition duration-500 group-hover:scale-[1.04]" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-bold tracking-tight">{demo.name}</h3>
        <p className="mt-1 text-sm text-mute">{demo.note}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {assets.map((a) => (
            <li key={a.id} className="flex items-center gap-1.5 rounded-md border border-line bg-ink/50 px-2 py-1 font-mono text-[11px]">
              <span className="h-2 w-2 rounded-sm" style={{ background: a.color }} />
              {a.ticker} <span className="text-mute">{fmtPct(a.bp)}</span>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onLoad} className="btn-ghost mt-5 w-full">
          Load in builder <ArrowRight size={14} />
        </button>
      </div>
    </motion.article>
  );
}

function Demos({ onBuild }: { onBuild: () => void }) {
  const { swap } = usePortfolio();
  return (
    <section id="demo" className="scroll-mt-20 border-t border-line bg-deep/60">
      <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="label mb-3">Explore demo</div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-4xl">Take an example apart.</h2>
          </div>
          <p className="max-w-sm text-sm text-mute">Three example stacks to load, edit and break. They show how the builder works. They are not recommendations.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {DEMOS.map((d, i) => (
            <DemoCard
              key={d.key}
              demo={d}
              index={i}
              onLoad={() => {
                swap(demoPortfolio(d), `Loaded example "${d.name}"`);
                onBuild();
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", title: "Pick your coins", body: "Choose the assets that belong in your portfolio.", blocks: 1 },
  { n: "02", title: "Build your balance", body: "Set allocations and watch your stack take shape.", blocks: 2 },
  { n: "03", title: "Make it yours", body: "Explore, save and share your unique portfolio.", blocks: 3 },
];

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-line">
      <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-8">
        <div className="label mb-3">How it works</div>
        <h2 className="max-w-3xl font-display text-2xl font-extrabold tracking-tight sm:text-4xl">
          Every great stack starts with <span className="grad-text">one block.</span>
        </h2>
        <ol className="relative mt-14 grid gap-12 md:grid-cols-3 md:gap-0">
          <div className="absolute left-0 right-0 top-[52px] hidden h-px bg-gradient-to-r from-cobalt via-blue to-cyan md:block" />
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative md:pr-10"
            >
              {/* the stack literally grows by one block per step */}
              <div className="flex h-[52px] items-end gap-1">
                {Array.from({ length: s.blocks }).map((_, b) => (
                  <span
                    key={b}
                    className="rounded-[5px] bg-gradient-to-br from-cyan to-blue"
                    style={{ width: 22 + b * 6, height: 18 + b * 12, opacity: 1 - (s.blocks - 1 - b) * 0.22 }}
                  />
                ))}
              </div>
              <span className="relative z-10 -mt-[5px] block h-[10px] w-[10px] rounded-[3px] bg-cyan ring-4 ring-ink" />
              <div className="mt-6 font-mono text-xs text-cyan">{s.n}</div>
              <h3 className="mt-2 font-display text-lg font-bold uppercase tracking-tight">{s.title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-mute">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function SocialTile({ label, href, icon }: { label: string; href: string; icon: React.ReactNode }) {
  const inner = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-snow/[0.05] text-snow">{icon}</span>
      <span className="flex flex-col items-start">
        <span className="font-display text-xs font-bold uppercase tracking-wide">{label}</span>
        <span className="font-mono text-[11px] text-mute">{href ? "Open" : "Coming Soon"}</span>
      </span>
    </>
  );
  const cls = "flex items-center gap-3 rounded-2xl border border-line bg-surface/60 p-3 pr-5 transition";
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={`${cls} hover:border-cyan/50 hover:bg-surface`}>
      {inner}
    </a>
  ) : (
    <div className={`${cls} opacity-70`} aria-disabled>
      {inner}
    </div>
  );
}

function Community({ onBuild }: { onBuild: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the address stays visible to copy by hand */
    }
  };
  return (
    <section id="community" className="relative overflow-hidden border-t border-line bg-deep/60">
      <div className="pointer-events-none absolute bottom-[-60%] left-1/2 h-[800px] w-[1300px] -translate-x-1/2" style={{ background: "radial-gradient(closest-side, rgba(36,67,218,0.28), rgba(36,67,218,0))" }} />
      <div className="relative mx-auto grid max-w-[1320px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="label mb-3">{SITE.ticker} · community</div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Stack it <span className="grad-text">your way.</span>
          </h2>
          <p className="mt-5 max-w-md text-[17px] text-mute">Every portfolio tells a story. Build yours with STACKD.</p>
          <button type="button" onClick={onBuild} className="btn-primary mt-8 !px-6 !py-3.5 !text-xs">
            Build my stack <ArrowRight size={15} />
          </button>
        </div>
        <div className="space-y-3">
          <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="font-display text-xl font-extrabold tracking-tight">{SITE.ticker}</div>
              <div className="mt-1 truncate font-mono text-xs text-mute">{CONTRACT_ADDRESS || "Contract address: Coming Soon"}</div>
            </div>
            {CONTRACT_ADDRESS && (
              <button type="button" onClick={copy} className="btn-ghost">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy CA"}
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <SocialTile label="X / Twitter" href={LINKS.x} icon={<XMark size={16} />} />
            <SocialTile label="Telegram" href={LINKS.telegram} icon={<Send size={16} />} />
            <SocialTile label="Dexscreener" href={LINKS.dexscreener} icon={<BarChart3 size={16} />} />
          </div>
        </div>
      </div>
      <footer className="relative border-t border-line">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-5 py-7 text-xs leading-relaxed text-mute sm:px-8 md:flex-row md:items-center md:justify-between">
          <Wordmark size={22} />
          <p className="max-w-2xl md:text-right">
            STACKD is a visual planning toy and {SITE.ticker} is a memecoin with no promise of value. The builder shows no prices, holds no funds and makes no trades. Every allocation is hypothetical, and none of it is financial advice.
          </p>
        </div>
      </footer>
    </section>
  );
}

export default function Landing({ onBuild }: { onBuild: () => void }) {
  return (
    <div className="min-h-dvh">
      <Nav onBuild={onBuild} />
      <main>
        <Hero onBuild={onBuild} />
        <Demos onBuild={onBuild} />
        <HowItWorks />
        <Community onBuild={onBuild} />
      </main>
    </div>
  );
}
