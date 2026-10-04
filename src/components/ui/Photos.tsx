"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, ChevronLeft, ChevronRight, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type PickedPhoto = { id: string; file: File; preview: string };

/** Pick photos from camera or gallery with instant previews. Compression happens at upload time. */
export function PhotoPicker({
  value,
  onChange,
  max = 10,
  label = "Add photos",
  compact,
}: {
  value: PickedPhoto[];
  onChange: (photos: PickedPhoto[]) => void;
  max?: number;
  label?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => () => valueRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const add = (files: FileList | null) => {
    if (!files) return;
    const room = max - value.length;
    const next = Array.from(files)
      .filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name))
      .slice(0, room)
      .map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }));
    onChange([...value, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (id: string) => {
    const p = value.find((x) => x.id === id);
    if (p) URL.revokeObjectURL(p.preview);
    onChange(value.filter((x) => x.id !== id));
  };

  return (
    <div className="grid gap-3">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((p) => (
            <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className="size-full object-cover" />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => remove(p.id)}
                className="absolute right-1 top-1 inline-flex size-8 items-center justify-center rounded-full bg-[rgb(20_18_16/0.6)] text-white backdrop-blur"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {value.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-surface text-ink-2 transition hover:border-accent hover:text-ink",
            compact ? "h-14 text-sm font-bold" : "flex-col py-7",
          )}
        >
          <span className={cn("flex items-center justify-center rounded-full bg-accent-soft text-accent-strong", compact ? "size-8" : "size-12")}>
            {compact ? <Camera className="size-4" /> : <ImagePlus className="size-6" />}
          </span>
          <span className="grid gap-0.5 text-center">
            <span className="font-extrabold text-ink">{label}</span>
            {!compact && <span className="text-[13px]">{value.length ? `${value.length} of ${max}` : `Up to ${max}`}</span>}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => add(e.target.files)}
      />
    </div>
  );
}

/** Responsive photo grid with a swipeable fullscreen viewer. */
export function PhotoGrid({ urls, className }: { urls: string[]; className?: string }) {
  const [index, setIndex] = useState<number | null>(null);
  if (!urls.length) return null;
  const many = urls.length > 1;
  return (
    <>
      <div className={cn("grid gap-1.5 overflow-hidden rounded-2xl", many ? "grid-cols-2" : "grid-cols-1", className)}>
        {urls.slice(0, 4).map((u, i) => (
          <button
            key={u}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              "relative overflow-hidden bg-surface-2",
              many ? "aspect-square" : "aspect-[4/3]",
              urls.length === 3 && i === 0 && "row-span-2 aspect-auto",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" loading="lazy" className="size-full object-cover transition hover:scale-[1.02]" />
            {i === 3 && urls.length > 4 && (
              <span className="absolute inset-0 flex items-center justify-center bg-[rgb(20_18_16/0.5)] text-xl font-extrabold text-white">
                +{urls.length - 4}
              </span>
            )}
          </button>
        ))}
      </div>
      {index !== null && <Lightbox urls={urls} start={index} onClose={() => setIndex(null)} />}
    </>
  );
}

function Lightbox({ urls, start, onClose }: { urls: string[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const touchX = useRef<number | null>(null);
  const go = useCallback((d: number) => setI((v) => (v + d + urls.length) % urls.length), [urls.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [go, onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgb(12_11_10/0.94)]"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={urls[i]} alt="" className="max-h-[88dvh] max-w-[94vw] rounded-lg object-contain" />
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-3 top-[calc(12px+env(safe-area-inset-top))] inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white"
      >
        <X className="size-6" />
      </button>
      {urls.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => go(-1)}
            className="absolute left-3 hidden size-12 items-center justify-center rounded-full bg-white/10 text-white md:inline-flex"
          >
            <ChevronLeft className="size-7" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => go(1)}
            className="absolute right-3 hidden size-12 items-center justify-center rounded-full bg-white/10 text-white md:inline-flex"
          >
            <ChevronRight className="size-7" />
          </button>
          <span className="tabular absolute bottom-[calc(16px+env(safe-area-inset-bottom))] rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
            {i + 1} / {urls.length}
          </span>
        </>
      )}
    </div>,
    document.body,
  );
}
