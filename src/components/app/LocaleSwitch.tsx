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
      className={cn("inline-flex rounded-full border border-line bg-surface-2/60 p-1", pending && "opacity-60", className)}
    >
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={locale === l}
          onClick={() => start(() => setLocale(l))}
          className={cn(
            "h-9 rounded-full px-4 text-sm font-extrabold uppercase transition",
            locale === l ? "bg-surface text-ink shadow-soft" : "text-ink-2",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
