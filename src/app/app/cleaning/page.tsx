import Link from "next/link";
import { CalendarDays, ClipboardList, MessageSquareQuote, Sparkles } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import { formatHours, formatMoney, formatTime, todayPerth } from "@/lib/format";
import { BOOKING_TONE } from "@/lib/bookings/ui";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Display";
import { Segmented } from "@/components/ui/Segmented";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Cleaning" };

const TABS = {
  new: ["requested"],
  awaiting: ["awaiting_payment"],
  scheduled: ["scheduled"],
  past: ["completed", "declined", "cancelled"],
} as const;
type Tab = keyof typeof TABS;

export default async function CleaningPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const { t, locale } = await getServerT();
  const { tab: rawTab } = await searchParams;
  const tab: Tab = rawTab && rawTab in TABS ? (rawTab as Tab) : "new";
  const supabase = await createClient();

  const [{ data: bookings }, { data: all }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, ref, status, client_name, suburb, service_date, start_time, final_price, final_crew, final_hours, suggestion, clean_types(name)")
      .in("status", [...TABS[tab]])
      .order("service_date", { ascending: tab !== "past" })
      .order("start_time")
      .limit(100),
    supabase.from("bookings").select("status").in("status", ["requested", "awaiting_payment", "scheduled"]),
  ]);
  const count = (s: string) => (all ?? []).filter((b) => b.status === s).length;
  const today = todayPerth();

  return (
    <div className="grid gap-5">
      <PageHeader
        title={t("cleaning.title")}
        actions={
          <div className="flex gap-2">
            <ButtonLink href="/app/cleaning/calendar" variant="secondary" size="sm" icon={<CalendarDays className="size-4" />}>
              <span className="hidden sm:inline">{t("nav.calendar")}</span>
            </ButtonLink>
            <ButtonLink href="/app/cleaning/shifts" variant="secondary" size="sm" icon={<ClipboardList className="size-4" />}>
              <span className="hidden sm:inline">{t("nav.shifts")}</span>
            </ButtonLink>
          </div>
        }
      />
      <Segmented
        active={tab}
        items={[
          { key: "new", label: t("cleaning.tabNew"), href: "/app/cleaning?tab=new", count: count("requested") },
          { key: "awaiting", label: t("cleaning.tabAwaiting"), href: "/app/cleaning?tab=awaiting", count: count("awaiting_payment") },
          { key: "scheduled", label: t("cleaning.tabScheduled"), href: "/app/cleaning?tab=scheduled", count: count("scheduled") },
          { key: "past", label: t("cleaning.tabPast"), href: "/app/cleaning?tab=past" },
        ]}
      />

      {!bookings?.length ? (
        <EmptyState icon={<Sparkles className="size-6" />} title={t("cleaning.empty")} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {bookings.map((b) => {
            const d = new Date(`${b.service_date}T12:00:00+08:00`);
            const isToday = b.service_date === today;
            return (
              <Link
                key={b.id}
                href={`/app/cleaning/${b.id}`}
                className="flex gap-4 rounded-2xl border border-line bg-surface p-4 shadow-soft transition hover:border-ink-2/30 active:scale-[0.99]"
              >
                <div
                  className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-xl py-2 ${isToday ? "bg-accent-strong text-accent-ink" : "bg-surface-2"}`}
                >
                  <span className="text-[11px] font-extrabold uppercase opacity-80">
                    {d.toLocaleDateString(locale === "es" ? "es-AR" : "en-AU", { weekday: "short", timeZone: "Australia/Perth" })}
                  </span>
                  <span className="tabular text-2xl font-extrabold leading-none">{d.getUTCDate()}</span>
                  <span className="text-[11px] font-bold opacity-80">
                    {d.toLocaleDateString(locale === "es" ? "es-AR" : "en-AU", { month: "short", timeZone: "Australia/Perth" })}
                  </span>
                </div>
                <div className="grid min-w-0 flex-1 gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="truncate font-extrabold">{b.client_name}</span>
                    <span className="tabular shrink-0 font-extrabold">{formatMoney(b.final_price)}</span>
                  </div>
                  <span className="truncate text-sm text-ink-2">
                    {(b.clean_types as { name: string } | null)?.name}, {b.suburb}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="tabular text-sm font-bold">
                      {formatTime(b.start_time, locale)} · {b.final_crew} × {formatHours(b.final_hours)}
                    </span>
                    {tab === "past" && <Badge tone={BOOKING_TONE[b.status]}>{t(`bookingStatus.${b.status}`)}</Badge>}
                    {b.suggestion && b.status === "requested" && (
                      <Badge tone="attention">
                        <MessageSquareQuote className="size-3.5" /> {t("cleaning.suggestion")}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
