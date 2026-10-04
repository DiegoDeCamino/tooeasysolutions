import Link from "next/link";
import { ArrowRight, CalendarClock, ChevronRight, Hammer, Inbox, PartyPopper, Sparkles, UsersRound, Wallet } from "lucide-react";
import { requireStaff, type Viewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import type { TFn } from "@/lib/i18n";
import { loadShifts } from "@/lib/shifts";
import { addDays, firstName, formatDate, formatMoney, formatTime, todayPerth } from "@/lib/format";
import { Card, EmptyState, ProgressRing } from "@/components/ui/Display";
import { ButtonLink } from "@/components/ui/Button";
import { ShiftCard } from "@/components/app/ShiftCard";
import { PushToggle } from "@/components/app/PushToggle";
import { InstallPrompt } from "@/components/app/InstallPrompt";
import { loadProjectCards } from "@/lib/projects";

export const metadata = { title: "Home" };

function greeting(t: TFn, name: string) {
  const hour = Number(new Intl.DateTimeFormat("en-AU", { hour: "numeric", hourCycle: "h23", timeZone: "Australia/Perth" }).format(new Date()));
  const key = hour < 12 ? "home.morning" : hour < 18 ? "home.afternoon" : "home.evening";
  return t(key, { name: firstName(name) });
}

export default async function AppHome({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const viewer = await requireStaff();
  const { t, locale } = await getServerT();
  const { welcome } = await searchParams;
  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <p className="text-sm font-bold capitalize text-ink-2">{formatDate(todayPerth(), locale, { weekday: "long", month: "long" })}</p>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{greeting(t, viewer.profile.full_name)}</h1>
      </header>
      {welcome && (
        <Card className="grid gap-5 border-accent p-5">
          <div className="flex items-start gap-3">
            <PartyPopper className="mt-0.5 size-6 shrink-0 text-accent-strong" />
            <div className="grid gap-1">
              <h2 className="text-lg font-extrabold">{t("home.welcomeTitle")}</h2>
              <p className="text-ink-2">{t("home.welcomeBody")}</p>
            </div>
          </div>
          <InstallPrompt />
          <PushToggle compact />
        </Card>
      )}
      {viewer.profile.role === "admin" ? <AdminHome t={t} locale={locale} /> : <CrewHome viewer={viewer} t={t} />}
    </div>
  );
}

async function AdminHome({ t, locale }: { t: TFn; locale: "en" | "es" }) {
  const supabase = await createClient();
  const today = todayPerth();
  const [{ data: requests }, { data: awaiting }, { data: enquiries }, shifts, { data: upcoming }, projects] = await Promise.all([
    supabase.from("bookings").select("id, client_name, suburb, service_date, final_price").eq("status", "requested").order("created_at", { ascending: false }),
    supabase.from("bookings").select("id, final_price").eq("status", "awaiting_payment"),
    supabase.from("enquiries").select("id, name, category, suburb").eq("status", "new").order("created_at", { ascending: false }),
    loadShifts(supabase, { statuses: ["open"] }),
    supabase
      .from("bookings")
      .select("id, client_name, suburb, service_date, start_time, final_crew")
      .eq("status", "scheduled")
      .gte("service_date", today)
      .lte("service_date", addDays(today, 7))
      .order("service_date")
      .order("start_time"),
    loadProjectCards(supabase, { status: ["active", "planning"] }),
  ]);
  const unfilled = shifts.filter((s) => new Date(s.starts_at) < new Date(Date.now() + 7 * 86400_000));

  const tiles = [
    { href: "/app/cleaning?tab=new", icon: Sparkles, label: t("home.newRequests"), count: requests?.length ?? 0 },
    { href: "/app/projects/enquiries", icon: Inbox, label: t("home.newEnquiries"), count: enquiries?.length ?? 0 },
    { href: "/app/cleaning/shifts", icon: UsersRound, label: t("home.unfilledShifts"), count: unfilled.length },
    {
      href: "/app/cleaning?tab=awaiting",
      icon: Wallet,
      label: t("cleaning.tabAwaiting"),
      count: awaiting?.length ?? 0,
      extra: awaiting?.length ? formatMoney(awaiting.reduce((a, b) => a + Number(b.final_price ?? 0), 0)) : null,
    },
  ];
  const attention = tiles.some((x) => x.count > 0);

  return (
    <>
      <section className="grid gap-3">
        <h2 className="font-extrabold">{t("home.needsAttention")}</h2>
        {attention ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map(({ href, icon: Icon, label, count, extra }) => (
              <Link
                key={href}
                href={href}
                className={`grid gap-3 rounded-2xl border p-4 transition active:scale-[0.98] ${count ? "border-attention/30 bg-attention-soft" : "border-line bg-surface"}`}
              >
                <Icon className={`size-5 ${count ? "text-attention" : "text-ink-2"}`} />
                <div className="grid gap-0.5">
                  <span className="tabular text-3xl font-extrabold leading-none">{count}</span>
                  <span className="text-sm font-bold leading-snug text-ink-2">{label}</span>
                  {extra && <span className="tabular text-sm font-extrabold text-ink">{extra}</span>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={<PartyPopper className="size-6" />} title={t("home.allClear")} />
        )}
      </section>

      {(requests?.length ?? 0) > 0 && (
        <section className="grid gap-3">
          <SectionHead title={t("home.newRequests")} href="/app/cleaning?tab=new" t={t} />
          <Card className="divide-y divide-line overflow-hidden">
            {requests!.slice(0, 4).map((b) => (
              <Link key={b.id} href={`/app/cleaning/${b.id}`} className="flex items-center gap-3 p-4 hover:bg-surface-2">
                <span className="grid min-w-0 flex-1">
                  <span className="truncate font-extrabold">{b.client_name}</span>
                  <span className="truncate text-sm text-ink-2">
                    {formatDate(b.service_date, locale)}, {b.suburb}
                  </span>
                </span>
                <span className="tabular font-extrabold">{formatMoney(b.final_price)}</span>
                <ChevronRight className="size-5 text-ink-2" />
              </Link>
            ))}
          </Card>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="grid content-start gap-3">
          <SectionHead title={t("home.upcoming")} href="/app/cleaning/calendar" t={t} />
          {upcoming?.length ? (
            <Card className="divide-y divide-line overflow-hidden">
              {upcoming.map((b) => (
                <Link key={b.id} href={`/app/cleaning/${b.id}`} className="flex items-center gap-3 p-4 hover:bg-surface-2">
                  <CalendarClock className="size-5 shrink-0 text-accent-strong" />
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate font-extrabold">
                      {b.service_date === today ? t("common.today") : formatDate(b.service_date, locale)}, {formatTime(b.start_time, locale)}
                    </span>
                    <span className="truncate text-sm text-ink-2">
                      {b.client_name}, {b.suburb}
                    </span>
                  </span>
                </Link>
              ))}
            </Card>
          ) : (
            <EmptyState title={t("home.noUpcoming")} />
          )}
        </section>
        <section className="grid content-start gap-3">
          <SectionHead title={t("home.activeProjects")} href="/app/projects" t={t} />
          {projects.length ? (
            <div className="grid gap-3">
              {projects.slice(0, 4).map((p) => (
                <ProjectRow key={p.id} p={p} t={t} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Hammer className="size-6" />} title={t("projects.empty")} />
          )}
        </section>
      </div>
    </>
  );
}

async function CrewHome({ viewer, t }: { viewer: Viewer; t: TFn }) {
  const supabase = await createClient();
  const { profile } = viewer;
  const [shifts, projects] = await Promise.all([
    loadShifts(supabase, { statuses: ["open", "full"], skill: profile.skills }),
    loadProjectCards(supabase, { status: ["active", "planning"] }),
  ]);
  const mine = shifts.filter((s) => s.crew.some((c) => c.id === profile.id));
  const open = shifts.filter((s) => s.status === "open" && !s.crew.some((c) => c.id === profile.id));
  const me = { id: profile.id, name: profile.full_name };

  return (
    <>
      <section className="grid gap-3">
        <h2 className="font-extrabold">{t("home.nextShift")}</h2>
        {mine[0] ? <ShiftCard shift={mine[0]} viewer={me} /> : <EmptyState title={t("home.noShift")} />}
      </section>
      {profile.skills.includes("cleaning") && (
        <Link
          href="/app/shifts"
          className="flex items-center gap-4 rounded-2xl bg-ink p-5 text-canvas transition active:scale-[0.99]"
        >
          <span className="tabular text-4xl font-extrabold">{open.length}</span>
          <span className="flex-1 font-extrabold">{open.length === 1 ? t("home.openShift") : t("home.openShifts", { n: open.length })}</span>
          <ArrowRight className="size-6" />
        </Link>
      )}
      <section className="grid gap-3">
        <SectionHead title={t("home.myProjects")} href="/app/projects" t={t} />
        {projects.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {projects.map((p) => (
              <ProjectRow key={p.id} p={p} t={t} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<Hammer className="size-6" />} title={t("projects.emptyMine")} />
        )}
      </section>
      {mine.length === 0 && open.length > 0 && (
        <ButtonLink href="/app/shifts" size="lg" className="justify-self-start">
          {t("home.browseShifts")}
        </ButtonLink>
      )}
    </>
  );
}

function SectionHead({ title, href, t }: { title: string; href: string; t: TFn }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-extrabold">{title}</h2>
      <Link href={href} className="text-sm font-extrabold text-accent-strong">
        {t("common.seeAll")}
      </Link>
    </div>
  );
}

function ProjectRow({ p, t }: { p: Awaited<ReturnType<typeof loadProjectCards>>[number]; t: TFn }) {
  return (
    <Link href={`/app/projects/${p.id}`} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-soft hover:border-ink-2/30">
      <ProgressRing value={p.total ? p.done / p.total : 0} size={52} />
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate font-extrabold">{p.title}</span>
        <span className="truncate text-sm text-ink-2">
          {p.currentStage ?? t("projects.progress", { done: p.done, total: p.total })}
        </span>
      </span>
      <ChevronRight className="size-5 text-ink-2" />
    </Link>
  );
}
