"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { CarpentryProject } from "@/data/carpentry";
import { cn } from "@/lib/cn";

type View = "after" | "before";

export function ProjectLightbox({ project, onClose }: { project: CarpentryProject | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key={project.slug}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lightbox-title"
            className="relative grid max-h-[94dvh] w-full max-w-5xl overflow-y-auto rounded-t-2xl bg-surface sm:rounded-2xl md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:overflow-hidden"
            initial={reduce ? false : { y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <LightboxBody project={project} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LightboxBody({ project, onClose }: { project: CarpentryProject; onClose: () => void }) {
  const [view, setView] = useState<View>("after");
  const [index, setIndex] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  const photos = view === "before" && project.before ? [project.before] : project.photos;
  const photo = photos[Math.min(index, photos.length - 1)];
  const many = photos.length > 1;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, photos.length]);

  return (
    <>
      <div className="relative aspect-[4/3] bg-ink md:aspect-auto md:min-h-[560px]">
        <Image
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 768px) 60vw, 100vw"
          className="object-contain"
        />
        {many && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow-soft"
              onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow-soft"
              onClick={() => setIndex((i) => (i + 1) % photos.length)}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      <div className="grid content-start gap-5 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <span className="text-sm font-bold text-accent-strong">{project.kind}</span>
            <h2 id="lightbox-title" className="font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              {project.title}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-ink hover:bg-surface-2"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {project.before && (
          <div className="grid grid-cols-2 rounded-full bg-surface-2 p-1" role="group" aria-label="Show before or after">
            {(["before", "after"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                className={cn(
                  "h-10 rounded-full text-sm font-bold capitalize transition",
                  view === v ? "bg-surface text-ink shadow-soft" : "text-ink-2 hover:text-ink",
                )}
                onClick={() => {
                  setView(v);
                  setIndex(0);
                }}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        <p className="text-[15px] leading-relaxed text-ink-2">{project.summary}</p>

        {many && (
          <div className="flex gap-2">
            {photos.map((ph, i) => (
              <button
                key={ph.src}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative size-16 overflow-hidden rounded-xl ring-2 transition",
                  i === index ? "ring-accent-strong" : "ring-transparent opacity-70 hover:opacity-100",
                )}
                onClick={() => setIndex(i)}
              >
                <Image src={ph.src} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-3 border-t border-line pt-5">
          <p className="text-sm text-ink-2">Thinking about something similar?</p>
          <Link href="/#quote" className="btn-primary justify-self-start" onClick={onClose}>
            Get a free quote
          </Link>
        </div>
      </div>
    </>
  );
}
