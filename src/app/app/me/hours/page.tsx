import Link from "next/link";
import { ChevronLeft, ChevronRight, Timer } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import { addDays, formatDate, formatHours, formatInstantTime, perthDateTime, todayPerth } from "@/lib/format";
import { weekStart, weekSummary } from "@/lib/hours";
import { loadMyHours, loadOpenClock } from "@/lib/projects";
import { cn } from "@/lib/cn";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/Display";
import { ClockPanel } from "@/components/app/Clock";

export const metadata = { title: "My hours" };

/** "8:15" — seven days of "8h 15m" don't fit across a phone. */
const clockHours = (h: number) => {
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
};

const navClass = "inline-flex size-11 items-center justify-center rounded-(--r-control)";

export default async function MyHoursPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { profile } = await requireStaff();
  const { t, locale } = await getServerT();
  const today = todayPerth();
  const current = weekStart(today);
  const { week } = await searchParams;
  const valid = week && /^\d{4}-\d{2}-\d{2}$/.test(week) && !Number.isNaN(perthDateTime(week, "12:00").getTime());
  const start = valid && weekStart(week) < current ? weekStart(week) : current;
  const end = addDays(start, 6);
  const isCurrent = start === current;

  const supabase = await createClient();
  const [entries, clock] = await Promise.all([loadMyHours(supabase, profile.id, start, end), isCurrent ? loadOpenClock(supabase, profile.id) : null]);
  const { days, worked, total } = weekSummary(entries, start);
  // Bars scale to a full day so a short day looks short, or to the longest day past that.
  const scale = Math.max(8, ...days.map((d) => d.hours));

  const noDay = { weekday: undefined } as const;
  const label = isCurrent ? t("hours.thisWeek") : start === addDays(current, -7) ? t("hours.lastWeek") : t("hours.weekOf", { date: formatDate(start, locale, noDay) });
  const next = addDays(start, 7);

  return (
    <div className="mx-auto grid w-full max-w-xl gap-5">
      <PageHeader
        back="/app/me"
        title={t("hours.title")}
        actions={
          <div className="flex items-center">
            <Link href={`?week=${addDays(start, -7)}`} aria-label={t("hours.prev")} className={cn(navClass, "hover:bg-surface-2")}>
              <ChevronLeft className="size-5" />
            </Link>
            {isCurrent ? (
              <span aria-disabled className={cn(navClass, "text-ink-2/40")}>
                <ChevronRight className="size-5" />
              </span>
            ) : (
              <Link href={next === current ? "?" : `?week=${next}`} aria-label={t("hours.next")} className={cn(navClass, "hover:bg-surface-2")}>
                <ChevronRight className="size-5" />
              </Link>
            )}
          </div>
        }
      />

      {clock && <ClockPanel entry={clock} />}

      <Card className="grid gap-5 p-5">
        <div className="grid gap-0.5">
          <span className="text-sm font-medium text-ink-2">{label}</span>
          <span className="tabular text-4xl font-semibold tracking-[-0.02em]">{formatHours(total)}</span>
          <span className="text-sm text-ink-2">
            {formatDate(start, locale, noDay)} – {formatDate(end, locale, noDay)}
          </span>
        </div>
        <ol className="grid grid-cols-7 gap-1">
          {days.map((d) => (
            <li key={d.date} className={cn("grid justify-items-center gap-1.5 rounded-lg px-0.5 py-2", d.date === today && "bg-accent-soft")}>
              <span className="flex h-12 w-2 items-end overflow-hidden rounded-full bg-surface-2" aria-hidden>
                <span className="w-full rounded-full bg-accent-strong" style={{ height: `${(d.hours / scale) * 100}%` }} />
              </span>
              <span className={cn("text-xs capitalize", d.date === today ? "font-semibold text-accent-strong" : "text-ink-2")}>
                {formatDate(d.date, locale, { day: undefined, month: undefined })}
              </span>
              <span className={cn("tabular text-xs", d.hours ? "font-semibold" : "text-ink-2")}>{d.hours ? clockHours(d.hours) : "–"}</span>
            </li>
          ))}
        </ol>
      </Card>

      {worked.length === 0 ? (
        !clock && <EmptyState icon={<Timer />} title={t("hours.none")} body={isCurrent ? t("hours.noneBody") : undefined} />
      ) : (
        worked.map((day) => (
          <section key={day.date} className="grid gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className={cn("text-sm font-semibold first-letter:uppercase", day.date === today ? "text-accent-strong" : "text-ink-2")}>
                {day.date === today ? `${t("common.today")}, ` : ""}
                {formatDate(day.date, locale, { weekday: "long" })}
              </h2>
              <span className="tabular text-sm font-semibold">{formatHours(day.hours)}</span>
            </div>
            <Card className="divide-y divide-line overflow-hidden">
              {day.entries.map((e) => {
                const times = e.started_at && e.ended_at ? `${formatInstantTime(e.started_at, locale)} – ${formatInstantTime(e.ended_at, locale)}` : null;
                const meta = [times, e.note].filter(Boolean).join(" · ");
                return (
                  <Link
                    key={e.id}
                    href={`/app/projects/${e.projectId}?tab=team`}
                    className={cn("flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-2", e.auto_closed && "bg-attention-soft/40")}
                  >
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="truncate font-medium">{e.projectTitle}</span>
                      {(meta || e.auto_closed) && (
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-2">
                          {meta && <span className="tabular min-w-0 break-words">{meta}</span>}
                          {e.auto_closed && <Badge tone="attention">{t("clock.review")}</Badge>}
                        </span>
                      )}
                    </span>
                    <span className="tabular font-semibold">{formatHours(e.hours)}</span>
                    <ChevronRight className="size-4 shrink-0 text-ink-2" />
                  </Link>
                );
              })}
            </Card>
          </section>
        ))
      )}
    </div>
  );
}
