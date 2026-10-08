"use client";

import { useTransition } from "react";
import { setLocale } from "@/app/actions/locale";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";

export function LocaleSwitch({ className }: { className?: string }) {
  const { locale } = useT();
  const [pending, start] = useTransition();
  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className={cn("inline-flex rounded-(--r-control) border border-line bg-surface-2 p-0.5", pending && "opacity-60", className)}
    >
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={locale === l}
          onClick={() => start(() => setLocale(l))}
          className={cn(
            "h-8 rounded-[calc(var(--r-control)-2px)] px-3 text-[13px] font-medium uppercase transition",
            locale === l ? "bg-surface text-ink shadow-soft" : "text-ink-2",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
