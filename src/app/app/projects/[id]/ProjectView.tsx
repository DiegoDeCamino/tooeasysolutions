"use client";

import { useState } from "react";
import { Camera, Clock, MapPin, Package, Plus, Receipt } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { formatDate } from "@/lib/format";
import { Badge, PageHeader, ProgressRing, type Tone } from "@/components/ui/Display";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { FeedTab, MaterialsTab, MoneyTab, SettingsTab, StagesTab, TeamTab } from "./tabs";
import { ExpenseForm, HoursForm, MaterialForm, UpdateForm } from "./forms";

export type ProjectData = {
  project: {
    id: string;
    token: string;
    title: string;
    category: string | null;
    description: string | null;
    address: string | null;
    client_name: string | null;
    client_email: string | null;
    client_phone: string | null;
    status: "planning" | "active" | "on_hold" | "completed";
    start_date: string | null;
    due_date: string | null;
    share_budget: boolean;
  };
  stages: { id: string; name: string; position: number; status: "todo" | "doing" | "done" }[];
  updates: {
    id: string;
    body: string;
    client_visible: boolean;
    stage_id: string | null;
    author_id: string | null;
    author: string;
    created_at: string;
    photos: string[];
  }[];
  materials: { id: string; name: string; qty: number; unit: string; status: "needed" | "bought" | "used"; est_cost: number | null }[];
  members: { id: string; name: string; phone: string | null; role: "supervisor" | "worker"; hours: number }[];
  time: { id: string; name: string; work_date: string; hours: number; note: string | null }[];
  money: {
    budget: number;
    workerRate: number;
    expenses: { id: string; amount: number; category: string; description: string; spent_on: string; by: string; receiptUrl: string | null }[];
  } | null;
  staff: { id: string; name: string; skills: string[] }[];
  viewer: { id: string; isAdmin: boolean; isSupervisor: boolean };
};

export type Tab = "feed" | "stages" | "materials" | "team" | "money" | "settings";
type Quick = "update" | "hours" | "material" | "expense";

const STATUS_TONE: Record<string, Tone> = { planning: "neutral", active: "accent", on_hold: "attention", completed: "ok" };

export function ProjectView({ data, tab, siteUrl }: { data: ProjectData; tab: Tab; siteUrl: string }) {
  const { t, locale } = useT();
  const [menu, setMenu] = useState(false);
  const [quick, setQuick] = useState<Quick | null>(null);
  const { project: p, stages, viewer } = data;
  const done = stages.filter((s) => s.status === "done").length;
  const current = stages.find((s) => s.status === "doing") ?? stages.find((s) => s.status === "todo");
  const cover = data.updates.find((u) => u.photos.length)?.photos[0];
  const canExpense = viewer.isAdmin || viewer.isSupervisor;

  const tabs = [
    { key: "feed", label: t("projects.feed"), href: "?tab=feed" },
    { key: "stages", label: t("projects.stages"), href: "?tab=stages" },
    { key: "materials", label: t("projects.materials"), href: "?tab=materials" },
    { key: "team", label: t("projects.team"), href: "?tab=team" },
    ...(viewer.isAdmin
      ? [
          { key: "money", label: t("projects.money"), href: "?tab=money" },
          { key: "settings", label: t("projects.settings"), href: "?tab=settings" },
        ]
      : []),
  ];

  const quickOptions: { key: Quick; icon: React.ComponentType<{ className?: string }>; label: string; hint: string; show: boolean }[] = [
    { key: "update", icon: Camera, label: t("projects.update"), hint: t("projects.updateHint"), show: true },
    { key: "hours", icon: Clock, label: t("projects.hours"), hint: t("projects.hoursHint"), show: true },
    { key: "material", icon: Package, label: t("projects.material"), hint: t("projects.materialHint"), show: true },
    { key: "expense", icon: Receipt, label: t("projects.expense"), hint: t("projects.expenseHint"), show: canExpense },
  ];

  const close = () => setQuick(null);

  return (
    <div className="grid gap-5 pb-20 lg:pb-0">
      <PageHeader back="/app/projects" title={p.title} />

      <section className="grid overflow-hidden rounded-2xl border border-line bg-surface shadow-soft md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="relative aspect-[16/9] bg-surface-2 md:aspect-auto md:min-h-56">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink-2">
              <Camera className="size-8" />
            </div>
          )}
        </div>
        <div className="grid content-center gap-4 p-5">
          <div className="flex items-center gap-4">
            <ProgressRing value={stages.length ? done / stages.length : 0} size={68} stroke={7} />
            <div className="grid gap-1">
              <Badge tone={STATUS_TONE[p.status]} className="justify-self-start">
                {t(`projectStatus.${p.status}`)}
              </Badge>
              <span className="font-extrabold">{current ? current.name : t("projects.progress", { done, total: stages.length })}</span>
              <span className="tabular text-sm text-ink-2">{t("projects.progress", { done, total: stages.length })}</span>
            </div>
          </div>
          <div className="grid gap-1.5 text-sm">
            {p.client_name && <span className="font-bold">{p.client_name}</span>}
            {p.address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(p.address + ", WA")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 font-semibold text-ink-2 hover:text-ink"
              >
                <MapPin className="size-4" /> {p.address}
              </a>
            )}
            {(p.start_date || p.due_date) && (
              <span className="tabular font-semibold text-ink-2">
                {p.start_date && `${t("projects.start")} ${formatDate(p.start_date, locale)}`}
                {p.start_date && p.due_date && " · "}
                {p.due_date && `${t("projects.due")} ${formatDate(p.due_date, locale)}`}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <Segmented items={tabs} active={tab} className="min-w-0 flex-1" />
        <button
          type="button"
          onClick={() => setMenu(true)}
          className="hidden h-11 shrink-0 items-center gap-2 rounded-full bg-accent-strong px-5 font-extrabold text-accent-ink shadow-soft lg:inline-flex"
        >
          <Plus className="size-5" /> {t("projects.quickAdd")}
        </button>
      </div>

      {tab === "feed" && <FeedTab data={data} onCompose={() => setQuick("update")} />}
      {tab === "stages" && <StagesTab data={data} />}
      {tab === "materials" && <MaterialsTab data={data} onAdd={() => setQuick("material")} />}
      {tab === "team" && <TeamTab data={data} onLog={() => setQuick("hours")} />}
      {tab === "money" && data.money && <MoneyTab data={data} onAdd={() => setQuick("expense")} />}
      {tab === "settings" && viewer.isAdmin && <SettingsTab data={data} siteUrl={siteUrl} />}

      {/* Floating add button on phones, above the tab bar */}
      <button
        type="button"
        aria-label={t("projects.quickAdd")}
        onClick={() => setMenu(true)}
        className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-4 z-30 inline-flex size-14 items-center justify-center rounded-full bg-accent-strong text-accent-ink shadow-lift transition active:scale-95 lg:hidden"
      >
        <Plus className="size-7" strokeWidth={2.5} />
      </button>

      <Sheet open={menu} onClose={() => setMenu(false)} title={t("projects.quickAdd")}>
        <div className="grid gap-2">
          {quickOptions
            .filter((o) => o.show)
            .map(({ key, icon: Icon, label, hint }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMenu(false);
                  setQuick(key);
                }}
                className="flex items-center gap-4 rounded-2xl border border-line p-4 text-left transition hover:bg-surface-2 active:scale-[0.99]"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
                  <Icon className="size-6" />
                </span>
                <span className="grid gap-0.5">
                  <span className="font-extrabold">{label}</span>
                  <span className="text-sm text-ink-2">{hint}</span>
                </span>
              </button>
            ))}
        </div>
      </Sheet>

      <UpdateForm open={quick === "update"} onClose={close} data={data} />
      <HoursForm open={quick === "hours"} onClose={close} data={data} />
      <MaterialForm open={quick === "material"} onClose={close} data={data} />
      {canExpense && <ExpenseForm open={quick === "expense"} onClose={close} data={data} />}
    </div>
  );
}
