"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogIn, LogOut } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { formatHours, formatInstantTime } from "@/lib/format";
import { elapsedMinutes } from "@/lib/clock";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { clockIn, clockOut } from "@/app/app/projects/actions";
import type { OpenClock } from "@/lib/projects";

/** Current time, ticking every `ms`. Null until mounted so server and client markup match. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function Elapsed({ since, className }: { since: string; className?: string }) {
  const now = useNow();
  return <span className={cn("tabular", className)}>{now ? formatHours(elapsedMinutes(since, now) / 60) : " "}</span>;
}

/**
 * The viewer's own clock. On a project page (`projectId`) it offers Clock in; anywhere it
 * shows a running entry with Clock out, linking to the project when it's elsewhere.
 */
export function ClockPanel({ entry, projectId }: { entry: OpenClock | null; projectId?: string }) {
  const { t, locale } = useT();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const here = !projectId || entry?.projectId === projectId;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast(res.error ?? "Error", "error");
      else toast(done);
      router.refresh();
    });

  if (!entry && !projectId) return null;

  if (!entry) {
    return (
      <div className="flex items-center gap-4 rounded-(--r-card) border border-line bg-surface p-4 shadow-soft">
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="font-semibold">{t("clock.readyTitle")}</span>
          <span className="text-sm text-ink-2">{t("clock.readyBody")}</span>
        </div>
        <Button size="lg" loading={pending} icon={<LogIn className="size-5" />} onClick={() => run(() => clockIn(projectId!), t("clock.clockedIn"))}>
          {t("clock.clockIn")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-(--r-card) border border-accent bg-accent-soft/60 p-4 shadow-soft">
      <span className="relative flex size-3 shrink-0" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-strong opacity-50 motion-reduce:animate-none" />
        <span className="relative inline-flex size-3 rounded-full bg-accent-strong" />
      </span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        {here ? (
          <span className="font-semibold">{t("clock.onSite")}</span>
        ) : (
          <Link href={`/app/projects/${entry.projectId}`} className="flex items-center gap-1 font-semibold hover:underline">
            <span className="truncate">{projectId ? t("clock.elsewhere", { project: entry.projectTitle }) : entry.projectTitle}</span>
            <ChevronRight className="size-4 shrink-0" />
          </Link>
        )}
        <span className="text-sm text-ink-2">
          {t("clock.since", { time: formatInstantTime(entry.startedAt, locale) })} · <Elapsed since={entry.startedAt} className="font-semibold text-ink" />
        </span>
      </div>
      <Button
        size="lg"
        variant="ink"
        loading={pending}
        icon={<LogOut className="size-5" />}
        onClick={() => run(() => clockOut(entry.id, entry.projectId), t("clock.clockedOut"))}
      >
        {t("clock.clockOut")}
      </Button>
    </div>
  );
}
