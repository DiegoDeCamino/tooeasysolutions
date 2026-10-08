"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

export type SegmentItem = { key: string; label: React.ReactNode; href?: string; count?: number };

const item =
  "relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[calc(var(--r-control)-3px)] px-3 text-sm font-medium transition " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Pill tabs. Pass href for URL-driven tabs, or onSelect for local state. */
export function Segmented({
  items,
  active,
  onSelect,
  className,
}: {
  items: SegmentItem[];
  active: string;
  onSelect?: (key: string) => void;
  className?: string;
}) {
  return (
    <nav className={cn("no-scrollbar -mx-4 overflow-x-auto px-4", className)}>
      <div className="inline-flex gap-0.5 rounded-(--r-control) border border-line bg-surface-2 p-[3px]">
        {items.map((it) => {
          const isActive = it.key === active;
          const cls = cn(item, isActive ? "bg-surface text-ink shadow-soft" : "text-ink-2 hover:text-ink");
          const content = (
            <>
              {it.label}
              {typeof it.count === "number" && it.count > 0 && (
                <span
                  className={cn(
                    "tabular inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                    isActive ? "bg-accent-strong text-accent-ink" : "bg-line text-ink-2",
                  )}
                >
                  {it.count}
                </span>
              )}
            </>
          );
          return it.href ? (
            <Link key={it.key} href={it.href} className={cls} aria-current={isActive ? "page" : undefined} scroll={false}>
              {content}
            </Link>
          ) : (
            <button key={it.key} type="button" className={cls} aria-pressed={isActive} onClick={() => onSelect?.(it.key)}>
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
