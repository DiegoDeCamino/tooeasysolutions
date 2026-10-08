"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Moon, Sun } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";
import { THEME_COLOR, THEME_COOKIE, type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; icon: typeof Sun }[] = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
];

/** Light / dark / system picker. Applies instantly (page and browser chrome), then refreshes so server renders agree. */
export function ThemeSwitch({ initial, labels = false, className }: { initial: Theme; labels?: boolean; className?: string }) {
  const { t } = useT();
  const router = useRouter();
  const [theme, setTheme] = useState(initial);
  const [, start] = useTransition();

  const pick = (value: Theme) => {
    setTheme(value);
    document.cookie = `${THEME_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    document.querySelectorAll<HTMLElement>("[data-theme]").forEach((el) => (el.dataset.theme = value));
    const dark = value === "dark" || (value === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
      m.removeAttribute("media");
      m.content = dark ? THEME_COLOR.dark : THEME_COLOR.light;
    });
    start(() => router.refresh());
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("me.theme")}
      className={cn("inline-flex rounded-(--r-control) border border-line bg-surface-2 p-0.5", className)}
    >
      {OPTIONS.map(({ value, icon: Icon }) => {
        const on = theme === value;
        const label = t(`me.theme_${value}`);
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={labels ? undefined : label}
            title={labels ? undefined : label}
            onClick={() => pick(value)}
            className={cn(
              "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[calc(var(--r-control)-2px)] px-2.5 text-[13px] font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
              on ? "bg-surface text-ink shadow-soft" : "text-ink-2 hover:text-ink",
            )}
          >
            <Icon className="size-4" strokeWidth={2} aria-hidden />
            {labels && label}
          </button>
        );
      })}
    </div>
  );
}
