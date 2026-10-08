"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export type ChipOption<V extends string> = { value: V; label: React.ReactNode; icon?: React.ReactNode };

const chip =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-(--r-control) border px-3.5 text-sm font-medium transition active:scale-[0.97] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const off = "border-line bg-surface text-ink hover:border-ink-2/40";
const on = "border-accent bg-accent-soft text-ink ring-1 ring-accent";

type Common<V extends string> = {
  options: ChipOption<V>[];
  className?: string;
  /** Lay out in one horizontally-scrolling row instead of wrapping. */
  scroll?: boolean;
  label?: string;
};

export function Chips<V extends string>(
  props: Common<V> &
    ({ multiple?: false; value: V | null; onChange: (v: V) => void } | { multiple: true; value: V[]; onChange: (v: V[]) => void }),
) {
  const { options, className, scroll, label } = props;
  const isOn = (v: V) => (props.multiple ? props.value.includes(v) : props.value === v);
  const toggle = (v: V) => {
    if (props.multiple) props.onChange(isOn(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    else props.onChange(v);
  };
  return (
    <div
      role={props.multiple ? "group" : "radiogroup"}
      aria-label={label}
      className={cn(
        "flex gap-2",
        scroll ? "no-scrollbar -mx-4 overflow-x-auto px-4 pb-1" : "flex-wrap",
        className,
      )}
    >
      {options.map((o) => {
        const selected = isOn(o.value);
        return (
          <button
            key={o.value}
            type="button"
            role={props.multiple ? "checkbox" : "radio"}
            aria-checked={selected}
            onClick={() => toggle(o.value)}
            className={cn(chip, selected ? on : off)}
          >
            {selected && props.multiple ? <Check className="size-4 text-accent-strong" strokeWidth={3} /> : o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
