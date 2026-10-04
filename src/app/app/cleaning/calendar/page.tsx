import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import { formatDate, formatTime, todayPerth } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card, PageHeader } from "@/components/ui/Display";

export const metadata = { title: "Calendar" };

const TONE: Record<string, string> = {
  requested: "bg-attention-soft text-attention",
  awaiting_payment: "bg-attention-soft text-attention",
  scheduled: "bg-accent-soft text-accent-strong",
  completed: "bg-ok-soft text-ok",
};

function monthBounds(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  const prev = new Date(Date.UTC(y, m - 2, 1));
  const next = new Date(Date.UTC(y, m, 1));
  return {
    start: `${y}-${pad(m)}-01`,
    end: `${y}-${pad(m)}-${pad(days)}`,
    days,
    lead: (first.getUTCDay() + 6) % 7, // Monday first
    prev: `${prev.getUTCFullYear()}-${pad(prev.getUTCMonth() + 1)}`,
    next: `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}`,
    date: (d: number) => `${y}-${pad(m)}-${pad(d)}`,
  };
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  await requireAdmin();
  const { t, locale } = await getServerT();
  const today = todayPerth();
  const { month } = await searchParams;
  const ym = month && /^\d{4}-\d{2}$/.test(month) ? month : today.slice(0, 7);
  const mb = monthBounds(ym);

  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, client_name, suburb, service_date, start_time, final_crew, shifts(status, spots, shift_signups(worker_id))")
    .gte("service_date", mb.start)
    .lte("service_date", mb.end)
    .in("status", ["requested", "awaiting_payment", "scheduled", "completed"])
    .order("start_time");

  const byDay = new Map<string, NonNullable<typeof bookings>>();
  for (const b of bookings ?? []) byDay.set(b.service_date, [...(byDay.get(b.service_date) ?? []), b]);

  const intl = locale === "es" ? "es-AR" : "en-AU";
  const monthLabel = new Date(`${mb.start}T12:00:00+08:00`).toLocaleDateString(intl, { month: "long", year: "numeric", timeZone: "Australia/Perth" });
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2026, 0, 5 + i)).toLocaleDateString(intl, { weekday: "short", timeZone: "UTC" }),
  );

  const fill = (b: NonNullable<typeof bookings>[number]) => {
    const shift = (b.shifts as { status: string; spots: number; shift_signups: unknown[] }[] | null)?.find((s) => s.status !== "cancelled");
    return shift ? `${shift.shift_signups.length}/${shift.spots}` : null;
  };

  const chip = (b: NonNullable<typeof bookings>[number]) => (
    <Link
      key={b.id}
      href={`/app/cleaning/${b.id}`}
      className={cn("block truncate rounded-lg px-2 py-1 text-xs font-extrabold transition hover:brightness-95", TONE[b.status])}
    >
      <span className="tabular">{formatTime(b.start_time, locale)}</span> {b.suburb}
      {fill(b) && <span className="tabular ml-1 opacity-80">{fill(b)}</span>}
    </Link>
  );

  return (
    <div className="grid gap-5">
      <PageHeader
        back="/app/cleaning"
        title={t("nav.calendar")}
        actions={
          <div className="flex items-center gap-1">
            <Link href={`?month=${mb.prev}`} aria-label={t("calendar.prev")} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-2">
              <ChevronLeft className="size-5" />
            </Link>
            <span className="min-w-36 text-center font-extrabold capitalize">{monthLabel}</span>
            <Link href={`?month=${mb.next}`} aria-label={t("calendar.next")} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-2">
              <ChevronRight className="size-5" />
            </Link>
          </div>
        }
      />

      {/* Month grid from tablet up */}
      <Card className="hidden overflow-hidden md:block">
        <div className="grid grid-cols-7 border-b border-line bg-surface-2/60">
          {weekdays.map((w) => (
            <div key={w} className="px-3 py-2 text-xs font-extrabold uppercase text-ink-2">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: mb.lead }, (_, i) => (
            <div key={`lead-${i}`} className="min-h-28 border-b border-r border-line bg-surface-2/30" />
          ))}
          {Array.from({ length: mb.days }, (_, i) => {
            const d = mb.date(i + 1);
            const items = byDay.get(d) ?? [];
            return (
              <div key={d} className="grid min-h-28 content-start gap-1 border-b border-r border-line p-1.5">
                <span
                  className={cn(
                    "tabular inline-flex size-7 items-center justify-center rounded-full text-sm font-extrabold",
                    d === today ? "bg-accent-strong text-accent-ink" : "text-ink-2",
                  )}
                >
                  {i + 1}
                </span>
                {items.slice(0, 3).map(chip)}
                {items.length > 3 && <span className="px-2 text-xs font-bold text-ink-2">+{items.length - 3}</span>}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Agenda on phones */}
      <div className="grid gap-4 md:hidden">
        {[...byDay.entries()].length === 0 && <p className="text-ink-2">{t("calendar.noJobs")}</p>}
        {[...byDay.entries()].map(([d, items]) => (
          <section key={d} className="grid gap-2">
            <h2 className={cn("text-sm font-extrabold", d === today ? "text-accent-strong" : "text-ink-2")}>
              {d === today ? `${t("common.today")}, ` : ""}
              {formatDate(d, locale)}
            </h2>
            <div className="grid gap-2">
              {items.map((b) => (
                <Link key={b.id} href={`/app/cleaning/${b.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
                  <span className={cn("tabular rounded-lg px-2 py-1 text-sm font-extrabold", TONE[b.status])}>{formatTime(b.start_time, locale)}</span>
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate font-extrabold">{b.client_name}</span>
                    <span className="truncate text-sm text-ink-2">{b.suburb}</span>
                  </span>
                  {fill(b) && <span className="tabular text-sm font-extrabold text-ink-2">{fill(b)}</span>}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
