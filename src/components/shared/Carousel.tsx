"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = { src: string; alt: string };

export default function Carousel({
  slides,
  intervalMs = 3500,
  showArrows = true,
  showDots = true,
  aspectClass = "aspect-[16/9] sm:aspect-[21/9]",
}: {
  slides: Slide[];
  intervalMs?: number;
  showArrows?: boolean;
  showDots?: boolean;
  aspectClass?: string;
}) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const paused = useRef(false);

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + slides.length) % slides.length),
    [slides.length]
  );
  const goTo = (i: number) =>
    setIndex(((i % slides.length) + slides.length) % slides.length);

  useEffect(() => {
    if (paused.current) return;
    const id = setInterval(() => go(1), intervalMs);
    return () => clearInterval(id);
  }, [index, intervalMs, go]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    if (start == null) return;
    const delta = e.changedTouches[0].clientX - start;
    if (Math.abs(delta) > 50) {
      go(delta > 0 ? -1 : 1);
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl group"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Gallery"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
    >
      <div className={`relative ${aspectClass}`}>
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {showArrows && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => go(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => go(1)}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {showDots && (
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i === index ? "bg-white" : "bg-white/50 hover:bg-white/80"
              }`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
