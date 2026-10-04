"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

/**
 * Bottom sheet on phones, centred dialog from 768px.
 * Portals into #sheet-root when present (inside the themed app shell), else <body>.
 */
export function Sheet({ open, onClose, title, description, children, footer, className }: SheetProps) {
  const [mounted, setMounted] = useState(false);
  const [wide, setWide] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        "input:not([type=hidden]), textarea, select, button:not([data-close])",
      );
      first?.focus({ preventScroll: true });
    }, 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      window.clearTimeout(t);
      prev?.focus?.();
    };
  }, [open]);

  if (!mounted) return null;
  const root = document.getElementById("sheet-root") ?? document.body;

  const panelMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : wide
      ? { initial: { opacity: 0, scale: 0.96, y: 8 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.97 } }
      : { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-6">
          <motion.div
            className="absolute inset-0 bg-[rgb(20_18_16/0.45)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            {...panelMotion}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className={cn(
              "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-surface text-ink shadow-lift",
              "md:max-w-lg md:rounded-2xl",
              className,
            )}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line md:hidden" aria-hidden />
            <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-3 md:pt-5">
              <div className="grid gap-1">
                <h2 className="text-lg font-extrabold leading-tight">{title}</h2>
                {description && <p className="text-sm text-ink-2">{description}</p>}
              </div>
              <button
                type="button"
                data-close
                aria-label="Close"
                onClick={onClose}
                className="-mr-2 -mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-surface-2"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 pb-5">{children}</div>
            {footer && <div className="border-t border-line bg-surface px-5 py-3 pb-safe md:pb-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    root,
  );
}
