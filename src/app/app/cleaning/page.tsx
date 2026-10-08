import Link from "next/link";
import { CalendarDays, ChevronRight, ClipboardList, MessageSquareQuote, Sparkles } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import { formatHours, formatMoney, formatTime, todayPerth } from "@/lib/format";
import { BOOKING_TONE } from "@/lib/bookings/ui";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/Display";
import { cn } from "@/lib/cn";
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
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
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
        <Card className="divide-y divide-line overflow-hidden">
          {bookings.map((b) => {
            const d = new Date(`${b.service_date}T12:00:00+08:00`);
            const intl = locale === "es" ? "es-AR" : "en-AU";
            const isToday = b.service_date === today;
            return (
              <Link key={b.id} href={`/app/cleaning/${b.id}`} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2 sm:px-5">
                <div
                  className={cn(
                    "flex w-12 shrink-0 flex-col items-center rounded-lg py-1.5 leading-none",
                    isToday ? "bg-accent-strong text-accent-ink" : "bg-surface-2 text-ink",
                  )}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide opacity-75">
                    {d.toLocaleDateString(intl, { weekday: "short", timeZone: "Australia/Perth" })}
                  </span>
                  <span className="tabular my-0.5 text-lg font-semibold">{d.getUTCDate()}</span>
                  <span className="text-[10px] font-medium opacity-75">
                    {d.toLocaleDateString(intl, { month: "short", timeZone: "Australia/Perth" })}
                  </span>
                </div>
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="max-w-full truncate font-medium">{b.client_name}</span>
                    {tab === "past" && <Badge tone={BOOKING_TONE[b.status]}>{t(`bookingStatus.${b.status}`)}</Badge>}
                    {b.suggestion && b.status === "requested" && (
                      <Badge tone="attention">
                        <MessageSquareQuote className="size-3.5" /> {t("cleaning.suggestion")}
                      </Badge>
                    )}
                  </div>
                  <span className="truncate text-sm text-ink-2">
                    <span className="tabular sm:hidden">{formatTime(b.start_time, locale)} · </span>
                    {(b.clean_types as { name: string } | null)?.name}, {b.suburb}
                  </span>
                </div>
                <span className="tabular hidden w-40 shrink-0 text-sm text-ink-2 sm:block">
                  {formatTime(b.start_time, locale)} · {b.final_crew} × {formatHours(b.final_hours)}
                </span>
                <span className="tabular w-16 shrink-0 text-right font-medium">{formatMoney(b.final_price)}</span>
                <ChevronRight className="hidden size-4 shrink-0 text-ink-2 sm:block" />
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
