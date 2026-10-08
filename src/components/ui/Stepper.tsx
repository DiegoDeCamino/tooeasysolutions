"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

type StepperProps = {
  label: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
};

/** Big-thumb number control: label left, − value + right. */
export function Stepper({ label, value, onChange, min = 0, max = 99, step = 1, format, hint, className }: StepperProps) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v * 100) / 100)));
  return (
    <div className={cn("flex min-h-14 items-center justify-between gap-3", className)}>
      <div className="grid gap-0.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint && <span className="text-[13px] text-ink-2">{hint}</span>}
      </div>
      <div className="flex items-center gap-0.5 rounded-(--r-control) border border-line bg-surface p-0.5">
        <button
          type="button"
          aria-label="Decrease"
          disabled={value <= min}
          onClick={() => set(value - step)}
          className="inline-flex size-9 items-center justify-center rounded-[calc(var(--r-control)-2px)] text-ink-2 transition hover:bg-surface-2 hover:text-ink active:scale-90 disabled:opacity-30"
        >
          <Minus className="size-4" strokeWidth={2.2} />
        </button>
        <output aria-live="polite" className="tabular min-w-12 text-center text-[15px] font-semibold text-ink">
          {format ? format(value) : value}
        </output>
        <button
          type="button"
          aria-label="Increase"
          disabled={value >= max}
          onClick={() => set(value + step)}
          className="inline-flex size-9 items-center justify-center rounded-[calc(var(--r-control)-2px)] text-ink-2 transition hover:bg-surface-2 hover:text-ink active:scale-90 disabled:opacity-30"
        >
          <Plus className="size-4" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
