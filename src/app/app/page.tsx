import Link from "next/link";
import { ArrowRight, ChevronRight, Hammer, Inbox, PartyPopper, Sparkles, Timer, UsersRound, Wallet } from "lucide-react";
import { requireStaff, type Viewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import type { TFn } from "@/lib/i18n";
import { loadShifts } from "@/lib/shifts";
import { addDays, firstName, formatDate, formatHours, formatMoney, formatTime, todayPerth } from "@/lib/format";
import { weekStart, weekSummary } from "@/lib/hours";
import { Card, EmptyState, ProgressBar } from "@/components/ui/Display";
import { cn } from "@/lib/cn";
import { ShiftCard } from "@/components/app/ShiftCard";
import { PushToggle } from "@/components/app/PushToggle";
import { InstallPrompt } from "@/components/app/InstallPrompt";
import { loadMyHours, loadOpenClock, loadProjectCards, loadTodayTasks, type TodayTask } from "@/lib/projects";
import { ClockPanel } from "@/components/app/Clock";

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
  const supabase = await createClient();
  const today = todayPerth();
  const monday = weekStart(today);
  const [clock, tasks, week] = await Promise.all([
    loadOpenClock(supabase, viewer.profile.id),
    loadTodayTasks(supabase, viewer.profile.id, today),
    loadMyHours(supabase, viewer.profile.id, monday, addDays(monday, 6)),
  ]);
  const weekHours = weekSummary(week, monday).total;
  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold leading-9 tracking-[-0.02em] md:text-[28px]">{greeting(t, viewer.profile.full_name)}</h1>
        <p className="text-sm text-ink-2 first-letter:uppercase">{formatDate(todayPerth(), locale, { weekday: "long", month: "long" })}</p>
      </header>
      <ClockPanel entry={clock} />
      {/* Admins rarely clock in; show them the link only once they have time logged. */}
      {(viewer.profile.role !== "admin" || week.length > 0) && <WeekHours hours={weekHours} t={t} />}
      {tasks.length > 0 && <TodayTasks tasks={tasks} t={t} locale={locale} />}
      {welcome && (
        <Card className="grid gap-5 p-5">
          <div className="flex items-start gap-3">
            <PartyPopper className="mt-0.5 size-6 shrink-0 text-accent-strong" />
            <div className="grid gap-1">
              <h2 className="text-lg font-semibold">{t("home.welcomeTitle")}</h2>
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
        <h2 className="text-[15px] font-semibold">{t("home.needsAttention")}</h2>
        {attention ? (
          <Card className="grid overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map(({ href, icon: Icon, label, count, extra }, i) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 border-line p-4 transition-colors hover:bg-surface-2",
                  i > 0 && "border-t sm:border-t-0",
                  i % 2 === 1 && "sm:border-l",
                  i > 1 && "sm:border-t lg:border-t-0",
                  i > 0 && "lg:border-l",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                    count ? "bg-attention-soft text-attention" : "bg-surface-2 text-ink-2",
                  )}
                >
                  <Icon className="size-[18px]" />
                </span>
                <span className="grid min-w-0 flex-1">
                  <span className="text-sm leading-snug text-ink-2">{label}</span>
                  {extra && <span className="tabular text-sm font-medium text-ink">{extra}</span>}
                </span>
                <span className={cn("tabular text-2xl font-semibold", !count && "text-ink-2")}>{count}</span>
              </Link>
            ))}
          </Card>
        ) : (
          <EmptyState icon={<PartyPopper className="size-6" />} title={t("home.allClear")} />
        )}
      </section>

      {(requests?.length ?? 0) > 0 && (
        <section className="grid gap-3">
          <SectionHead title={t("home.newRequests")} href="/app/cleaning?tab=new" t={t} />
          <Card className="divide-y divide-line overflow-hidden">
            {requests!.slice(0, 4).map((b) => (
              <Link key={b.id} href={`/app/cleaning/${b.id}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2">
                <span className="grid min-w-0 flex-1">
                  <span className="truncate font-medium">{b.client_name}</span>
                  <span className="truncate text-sm text-ink-2">
                    {formatDate(b.service_date, locale)}, {b.suburb}
                  </span>
                </span>
                <span className="tabular font-medium">{formatMoney(b.final_price)}</span>
                <ChevronRight className="size-4 text-ink-2" />
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
                <Link key={b.id} href={`/app/cleaning/${b.id}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2">
                  <span
                    className={cn(
                      "tabular w-[72px] shrink-0 text-sm",
                      b.service_date === today ? "font-semibold text-accent-strong" : "text-ink-2",
                    )}
                  >
                    {formatTime(b.start_time, locale)}
                  </span>
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate font-medium">
                      {b.client_name}, {b.suburb}
                    </span>
                    <span className="truncate text-sm text-ink-2">
                      {b.service_date === today ? t("common.today") : formatDate(b.service_date, locale)}
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-ink-2" />
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
            <Card className="divide-y divide-line overflow-hidden">
              {projects.slice(0, 4).map((p) => (
                <ProjectRow key={p.id} p={p} />
              ))}
            </Card>
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
        <h2 className="text-[15px] font-semibold">{t("home.nextShift")}</h2>
        {mine[0] ? <ShiftCard shift={mine[0]} viewer={me} /> : <EmptyState title={t("home.noShift")} />}
      </section>
      {profile.skills.includes("cleaning") && (
        <Link
          href="/app/shifts"
          className="flex items-center gap-4 rounded-(--r-card) bg-accent-strong p-5 text-accent-ink transition hover:brightness-105 active:scale-[0.99]"
        >
          <span className="tabular text-4xl font-semibold">{open.length}</span>
          <span className="flex-1 font-medium">{open.length === 1 ? t("home.openShift") : t("home.openShifts")}</span>
          <ArrowRight className="size-5" />
        </Link>
      )}
      <section className="grid gap-3">
        <SectionHead title={t("home.myProjects")} href="/app/projects" t={t} />
        {projects.length ? (
          <Card className="divide-y divide-line overflow-hidden">
            {projects.map((p) => (
              <ProjectRow key={p.id} p={p} />
            ))}
          </Card>
        ) : (
          <EmptyState icon={<Hammer className="size-6" />} title={t("projects.emptyMine")} />
        )}
      </section>
    </>
  );
}

function SectionHead({ title, href, t }: { title: string; href: string; t: TFn }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      <Link href={href} className="text-sm font-medium text-ink-2 underline-offset-4 transition-colors hover:text-accent-strong hover:underline">
        {t("common.seeAll")}
      </Link>
    </div>
  );
}

function ProjectRow({ p }: { p: Awaited<ReturnType<typeof loadProjectCards>>[number] }) {
  return (
    <Link href={`/app/projects/${p.id}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2">
      <span className="grid min-w-0 flex-1 gap-1.5">
        <span className="flex min-w-0 items-baseline justify-between gap-3">
          <span className="min-w-0 truncate font-medium">{p.title}</span>
          {/* Stage names can be long; cap them so the title keeps its space. */}
          <span className="min-w-0 max-w-[55%] truncate text-right text-sm text-ink-2">{p.currentStage}</span>
        </span>
        <ProgressBar value={p.total ? p.done / p.total : 0} label={`${p.done}/${p.total}`} />
      </span>
      <ChevronRight className="size-4 shrink-0 text-ink-2" />
    </Link>
  );
}

function WeekHours({ hours, t }: { hours: number; t: TFn }) {
  return (
    <Link
      href="/app/me/hours"
      className="flex items-center gap-3 rounded-(--r-card) border border-line bg-surface px-4 py-3.5 shadow-soft transition-colors hover:bg-surface-2"
    >
      <Timer className="size-5 shrink-0 text-ink-2" aria-hidden />
      <span className="flex-1 font-medium">{t("hours.thisWeek")}</span>
      <span className="tabular font-semibold">{formatHours(hours)}</span>
      <ChevronRight className="size-4 shrink-0 text-ink-2" />
    </Link>
  );
}

function TodayTasks({ tasks, t, locale }: { tasks: TodayTask[]; t: TFn; locale: "en" | "es" }) {
  const today = todayPerth();
  return (
    <section className="grid gap-3">
      <h2 className="text-[15px] font-semibold">{t("tasks.todayTitle")}</h2>
      <Card className="divide-y divide-line overflow-hidden">
        {tasks.map((task) => {
          const late = task.due_date < today;
          return (
            <Link key={task.id} href={`/app/projects/${task.projectId}?tab=tasks`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2">
              <span className={cn("size-5 shrink-0 rounded-full border-2", late ? "border-danger" : "border-line")} aria-hidden />
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate font-medium">{task.title}</span>
                <span className={cn("truncate text-xs font-medium", late ? "text-danger" : "text-ink-2")}>
                  {task.projectTitle}
                  {late && ` · ${t("tasks.due", { date: formatDate(task.due_date, locale) })}`}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-ink-2" />
            </Link>
          );
        })}
      </Card>
    </section>
  );
}
