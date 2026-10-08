"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import Builder from "@/components/builder/Builder";
import Landing from "@/components/landing/Landing";
import { PortfolioProvider } from "@/state/portfolio";

type View = "landing" | "builder";

export default function Page() {
  const [view, setView] = useState<View>("landing");
  const calm = useReducedMotion() ?? false;

  useEffect(() => {
    const sync = () => setView(window.location.hash === "#build" ? "builder" : "landing");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const go = useCallback((next: View) => {
    if (next === "builder") window.location.hash = "build";
    else history.pushState(null, "", window.location.pathname);
    setView(next);
    window.scrollTo(0, 0);
  }, []);

  const fade = calm ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <PortfolioProvider>
      <AnimatePresence mode="wait" initial={false}>
        {view === "landing" ? (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.985 }} transition={fade}>
            <Landing onBuild={() => go("builder")} />
          </motion.div>
        ) : (
          <motion.div key="builder" initial={{ opacity: 0, scale: 1.015 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={fade}>
            <Builder onExit={() => go("landing")} />
          </motion.div>
        )}
      </AnimatePresence>
    </PortfolioProvider>
  );
}
