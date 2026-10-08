"use client";

import { animate, AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.png" alt="STACKD" width={size} height={size} className={className} draggable={false} />;
}

export function Wordmark({ onClick, size = 30 }: { onClick?: () => void; size?: number }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2.5" aria-label="STACKD home">
      <Logo size={size} />
      <span className="font-display text-[15px] font-extrabold tracking-[0.04em] text-snow">STACKD</span>
    </button>
  );
}

/** Tweens between numeric values and renders them through `format`. */
export function AnimatedNumber({ value, format }: { value: number; format: (v: number) => string }) {
  const calm = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(value);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (calm || from.current === value) {
      el.textContent = format(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = format(v);
        from.current = v;
      },
      onComplete: () => {
        el.textContent = format(value);
        from.current = value;
      },
    });
    return () => controls.stop();
  }, [value, format, calm]);
  return <span ref={ref}>{format(value)}</span>;
}

export function Modal({ open, onClose, title, kicker, children, wide = false }: { open: boolean; onClose: () => void; title: string; kicker?: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/75 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`thin-scroll max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-deep p-5 shadow-panel sm:rounded-3xl sm:p-7 ${wide ? "sm:max-w-5xl" : "sm:max-w-xl"}`}
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                {kicker && <div className="label mb-1.5">{kicker}</div>}
                <h2 className="font-display text-lg font-bold leading-tight tracking-tight sm:text-xl">{title}</h2>
              </div>
              <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Destructive actions ask for a second click instead of a browser dialog. */
export function ConfirmButton({ onConfirm, children, confirmLabel = "Click again to confirm", className = "btn-ghost", title }: { onConfirm: () => void; children: ReactNode; confirmLabel?: ReactNode; className?: string; title?: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      title={title}
      className={`${className} ${armed ? "!border-bad/60 !text-bad" : ""}`}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
