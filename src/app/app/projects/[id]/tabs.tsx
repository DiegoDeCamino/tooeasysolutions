"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Copy, Eye, EyeOff, Package, Phone, Plus, Receipt, Share2, Trash2, UserPlus, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { formatDate, formatHours, formatMoney, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Avatar, Badge, Card, EmptyState } from "@/components/ui/Display";
import { Button } from "@/components/ui/Button";
import { Field, Input, Switch } from "@/components/ui/Field";
import { Chips } from "@/components/ui/Chips";
import { PhotoGrid } from "@/components/ui/Photos";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import {
  addMember,
  addStage,
  deleteExpense,
  removeMember,
  removeStage,
  setBudget,
  setMaterialStatus,
  setStageStatus,
  setUpdateVisibility,
  updateProject,
} from "../actions";
import type { ProjectData } from "./ProjectView";

const NEXT_STAGE = { todo: "doing", doing: "done", done: "todo" } as const;

function useAct() {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast(res.error ?? "Error", "error");
      else after?.();
      router.refresh();
    });
  return { pending, act, start };
}

// --- Feed ------------------------------------------------------------------------

export function FeedTab({ data, onCompose }: { data: ProjectData; onCompose: () => void }) {
  const { t, locale } = useT();
  const { act } = useAct();
  const stageName = (id: string | null) => data.stages.find((s) => s.id === id)?.name;

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <button
        type="button"
        onClick={onCompose}
        className="flex items-center gap-3 rounded-(--r-card) border border-line bg-surface p-3 text-left shadow-soft transition hover:border-ink-2/30"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <Camera className="size-5" />
        </span>
        <span className="flex-1 font-medium text-ink-2">{t("projects.whatsNew")}</span>
      </button>
      {data.updates.length === 0 && <EmptyState icon={<Camera className="size-6" />} title={t("projects.noUpdates")} />}
      {data.updates.map((u) => {
        const mine = u.author_id === data.viewer.id;
        return (
          <article key={u.id} className="grid gap-3 rounded-(--r-card) border border-line bg-surface p-4 shadow-soft">
            <header className="flex items-center gap-3">
              <Avatar name={u.author} />
              <div className="grid min-w-0 flex-1">
                <span className="truncate font-semibold">{u.author}</span>
                <span suppressHydrationWarning className="text-xs font-medium text-ink-2">
                  {timeAgo(u.created_at, locale)}
                  {stageName(u.stage_id) && ` · ${stageName(u.stage_id)}`}
                </span>
              </div>
              {(data.viewer.isAdmin || mine) ? (
                <button
                  type="button"
                  onClick={() => act(() => setUpdateVisibility(u.id, data.project.id, !u.client_visible))}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-(--r-control) px-3 text-xs font-semibold",
                    u.client_visible ? "bg-accent-soft text-accent-strong" : "bg-surface-2 text-ink-2",
                  )}
                  aria-pressed={u.client_visible}
                >
                  {u.client_visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  {u.client_visible ? t("projects.clientSees") : t("projects.internal")}
                </button>
              ) : (
                u.client_visible && <Eye className="size-4 text-ink-2" aria-label={t("projects.clientSees")} />
              )}
            </header>
            {u.body && <p className="whitespace-pre-line text-[15px] leading-relaxed">{u.body}</p>}
            {u.photos.length > 0 && <PhotoGrid urls={u.photos} />}
          </article>
        );
      })}
    </div>
  );
}

// --- Stages -----------------------------------------------------------------------

export function StagesTab({ data }: { data: ProjectData }) {
  const { t } = useT();
  const toast = useToast();
  const router = useRouter();
  const { act, pending } = useAct();
  const [, start] = useTransition();
  const [stages, setStages] = useOptimistic(data.stages);
  const [name, setName] = useState("");
  const canMove = data.viewer.isAdmin || data.viewer.isSupervisor;

  const cycle = (id: string) =>
    start(async () => {
      const s = stages.find((x) => x.id === id)!;
      const next = NEXT_STAGE[s.status];
      setStages(stages.map((x) => (x.id === id ? { ...x, status: next } : x)));
      const res = await setStageStatus(id, data.project.id, next);
      if (!res.ok) toast(res.error, "error");
      else if (next === "done") toast(t("projects.stageDone", { name: s.name }));
      router.refresh();
    });

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      {canMove && <p className="text-sm font-medium text-ink-2">{t("projects.tapToAdvance")}</p>}
      <ol className="relative grid gap-2">
        {stages.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canMove}
              onClick={() => cycle(s.id)}
              className={cn(
                "flex min-h-16 flex-1 items-center gap-4 rounded-(--r-card) border p-3 text-left transition active:scale-[0.99] disabled:active:scale-100",
                s.status === "doing" ? "border-accent bg-accent-soft/60" : "border-line bg-surface",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  s.status === "done" && "border-accent-strong bg-accent-strong text-accent-ink",
                  s.status === "doing" && "border-accent-strong text-accent-strong",
                  s.status === "todo" && "border-line text-ink-2",
                )}
              >
                {s.status === "done" ? <Check className="size-5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="grid flex-1 gap-0.5">
                <span className={cn("font-semibold", s.status === "done" && "text-ink-2 line-through decoration-2")}>{s.name}</span>
                <span className="text-xs font-medium text-ink-2">{t(`stageStatus.${s.status}`)}</span>
              </span>
            </button>
            {data.viewer.isAdmin && (
              <button
                type="button"
                aria-label={t("common.delete")}
                onClick={() => act(() => removeStage(s.id, data.project.id))}
                className="inline-flex size-11 items-center justify-center rounded-(--r-control) text-ink-2 hover:bg-danger-soft hover:text-danger"
              >
                <X className="size-5" />
              </button>
            )}
          </li>
        ))}
      </ol>
      {data.viewer.isAdmin && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            act(() => addStage(data.project.id, name), () => setName(""));
          }}
        >
          <Input aria-label={t("projects.stage")} placeholder={t("projects.stage")} value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" variant="secondary" size="lg" loading={pending} icon={<Plus className="size-5" />} aria-label={t("common.add")} />
        </form>
      )}
    </div>
  );
}

// --- Materials --------------------------------------------------------------------

const NEXT_MATERIAL = { needed: "bought", bought: "used", used: "needed" } as const;

export function MaterialsTab({ data, onAdd }: { data: ProjectData; onAdd: () => void }) {
  const { t } = useT();
  const toast = useToast();
  const router = useRouter();
  const [, start] = useTransition();
  const [items, setItems] = useOptimistic(data.materials);
  const total = items.reduce((a, m) => a + (m.est_cost ?? 0), 0);
  const tone = { needed: "attention", bought: "accent", used: "ok" } as const;

  const cycle = (id: string) =>
    start(async () => {
      const m = items.find((x) => x.id === id)!;
      const next = NEXT_MATERIAL[m.status];
      setItems(items.map((x) => (x.id === id ? { ...x, status: next } : x)));
      const res = await setMaterialStatus(id, data.project.id, next);
      if (!res.ok) toast(res.error, "error");
      router.refresh();
    });

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <div className="flex items-center justify-between gap-3">
        {data.viewer.isAdmin && total > 0 ? (
          <span className="tabular text-sm font-semibold text-ink-2">
            {t("projects.estCost")}: {formatMoney(total)}
          </span>
        ) : (
          <span />
        )}
        <Button size="sm" variant="secondary" icon={<Plus className="size-4" />} onClick={onAdd}>
          {t("projects.addMaterial")}
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<Package className="size-6" />} title={t("projects.noMaterials")} />
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {items.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-4">
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className={cn("truncate font-semibold", m.status === "used" && "text-ink-2")}>{m.name}</span>
                <span className="tabular text-sm text-ink-2">
                  {m.qty} {m.unit}
                  {data.viewer.isAdmin && m.est_cost !== null && ` · ${formatMoney(m.est_cost)}`}
                </span>
              </div>
              <button type="button" onClick={() => cycle(m.id)} className="shrink-0">
                <Badge tone={tone[m.status]} className="h-9 px-3.5 text-sm">
                  {t(`projects.${m.status}`)}
                </Badge>
              </button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// --- Team -------------------------------------------------------------------------

export function TeamTab({ data, onLog }: { data: ProjectData; onLog: () => void }) {
  const { t, locale } = useT();
  const { act, pending } = useAct();
  const [adding, setAdding] = useState(false);
  const [role, setRole] = useState<"worker" | "supervisor">("worker");
  const candidates = data.staff.filter((s) => !data.members.some((m) => m.id === s.id));

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={onLog}>
          {t("projects.logHours")}
        </Button>
        {data.viewer.isAdmin && (
          <Button size="sm" icon={<UserPlus className="size-4" />} onClick={() => setAdding(true)}>
            {t("projects.addMember")}
          </Button>
        )}
      </div>
      {data.members.length === 0 ? (
        <EmptyState title={t("projects.noMembers")} />
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {data.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-4">
              <Avatar name={m.name} size={44} />
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate font-semibold">{m.name}</span>
                <span className="text-sm text-ink-2">
                  {m.role === "supervisor" ? t("projects.supervisor") : t("projects.worker")} · {t("projects.totalHours", { hours: formatHours(m.hours) })}
                </span>
              </div>
              {m.phone && (
                <a href={`tel:${m.phone}`} aria-label={t("common.call")} className="inline-flex size-11 items-center justify-center rounded-(--r-control) bg-accent-soft text-accent-strong">
                  <Phone className="size-5" />
                </a>
              )}
              {data.viewer.isAdmin && (
                <button
                  type="button"
                  aria-label={t("common.remove")}
                  onClick={() => act(() => removeMember(data.project.id, m.id))}
                  className="inline-flex size-11 items-center justify-center rounded-(--r-control) text-ink-2 hover:bg-danger-soft hover:text-danger"
                >
                  <X className="size-5" />
                </button>
              )}
            </div>
          ))}
        </Card>
      )}
      {data.time.length > 0 && (
        <section className="grid gap-2">
          <h3 className="text-sm font-semibold text-ink-2">{t("projects.hoursLogged")}</h3>
          <Card className="divide-y divide-line overflow-hidden">
            {data.time.slice(0, 20).map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-24 shrink-0 font-medium text-ink-2">{formatDate(e.work_date, locale)}</span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {e.name}
                  {e.note && <span className="font-medium text-ink-2"> · {e.note}</span>}
                </span>
                <span className="tabular font-semibold">{formatHours(e.hours)}</span>
              </div>
            ))}
          </Card>
        </section>
      )}
      <Sheet open={adding} onClose={() => setAdding(false)} title={t("projects.addMember")}>
        <div className="grid gap-4">
          <Chips
            value={role}
            onChange={setRole}
            options={[
              { value: "worker", label: t("projects.worker") },
              { value: "supervisor", label: t("projects.supervisor") },
            ]}
          />
          <div className="grid gap-1">
            {candidates.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={pending}
                onClick={() => act(() => addMember(data.project.id, c.id, role), () => setAdding(false))}
                className="flex items-center gap-3 rounded-xl p-2 text-left hover:bg-surface-2"
              >
                <Avatar name={c.name} />
                <span className="flex-1 font-medium">{c.name}</span>
                {c.skills.includes("carpentry") && <Badge>{t("skills.carpentry")}</Badge>}
              </button>
            ))}
          </div>
        </div>
      </Sheet>
    </div>
  );
}

// --- Money (admin) -------------------------------------------------------------------

export function MoneyTab({ data, onAdd }: { data: ProjectData; onAdd: () => void }) {
  const { t, locale } = useT();
  const { act, pending } = useAct();
  const money = data.money!;
  const [budget, setBudgetValue] = useState(String(money.budget || ""));
  const totalHours = data.time.reduce((a, e) => a + e.hours, 0);
  const labour = totalHours * money.workerRate;
  const expenses = money.expenses.reduce((a, e) => a + e.amount, 0);
  const spent = expenses + labour;
  const remaining = money.budget - spent;
  const pct = money.budget ? Math.min(1, spent / money.budget) : 0;
  const byCat = ["materials", "labour", "equipment", "other"].map((c) => ({
    c,
    v: money.expenses.filter((e) => e.category === c).reduce((a, e) => a + e.amount, 0) + (c === "labour" ? labour : 0),
  }));
  const catLabel: Record<string, string> = {
    materials: t("projects.catMaterials"),
    labour: t("projects.catLabour"),
    equipment: t("projects.catEquipment"),
    other: t("projects.catOther"),
  };

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <Card className="grid gap-5 p-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="grid gap-0.5">
            <span className="text-[13px] font-medium text-ink-2">{t("projects.budget")}</span>
            <span className="tabular text-xl font-semibold md:text-2xl">{formatMoney(money.budget)}</span>
          </div>
          <div className="grid gap-0.5">
            <span className="text-[13px] font-medium text-ink-2">{t("projects.spent")}</span>
            <span className="tabular text-xl font-semibold md:text-2xl">{formatMoney(Math.round(spent))}</span>
          </div>
          <div className="grid gap-0.5">
            <span className="text-[13px] font-medium text-ink-2">{t("projects.remaining")}</span>
            <span className={cn("tabular text-xl font-semibold md:text-2xl", remaining < 0 ? "text-danger" : "text-ok")}>
              {formatMoney(Math.round(remaining))}
            </span>
          </div>
        </div>
        {money.budget > 0 && (
          <div className="grid gap-2">
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
              <div className={cn("h-full rounded-full", remaining < 0 ? "bg-danger" : "bg-accent-strong")} style={{ width: `${pct * 100}%` }} />
            </div>
            {remaining < 0 && <p className="text-sm font-semibold text-danger">{t("projects.overBudget", { amount: formatMoney(Math.round(-remaining)) })}</p>}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {byCat.map(({ c, v }) => (
            <div key={c} className="rounded-xl bg-surface-2/70 p-3">
              <p className="text-xs font-medium text-ink-2">{c === "labour" ? t("projects.labourCost", { hours: formatHours(totalHours) }) : catLabel[c]}</p>
              <p className="tabular font-semibold">{formatMoney(Math.round(v))}</p>
            </div>
          ))}
        </div>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            act(() => setBudget(data.project.id, Number(budget) || 0));
          }}
        >
          <Field label={t("projects.budget")} className="flex-1">
            {(p) => <Input {...p} inputMode="decimal" placeholder="$" value={budget} onChange={(e) => setBudgetValue(e.target.value.replace(/[^\d.]/g, ""))} />}
          </Field>
          <Button type="submit" variant="secondary" size="lg" loading={pending}>
            {t("common.save")}
          </Button>
        </form>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t("projects.expenses")}</h3>
        <Button size="sm" variant="secondary" icon={<Plus className="size-4" />} onClick={onAdd}>
          {t("projects.expense")}
        </Button>
      </div>
      {money.expenses.length === 0 ? (
        <EmptyState icon={<Receipt className="size-6" />} title={t("projects.noExpenses")} />
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {money.expenses.map((e) => (
            <div key={e.id} className="flex items-center gap-3 p-4">
              {e.receiptUrl ? (
                <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.receiptUrl} alt="" className="size-12 rounded-lg object-cover" />
                </a>
              ) : (
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-2">
                  <Receipt className="size-5" />
                </span>
              )}
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate font-semibold">{e.description || catLabel[e.category]}</span>
                <span className="truncate text-sm text-ink-2">
                  {catLabel[e.category]} · {formatDate(e.spent_on, locale)} · {e.by}
                </span>
              </div>
              <span className="tabular font-semibold">{formatMoney(e.amount)}</span>
              <button
                type="button"
                aria-label={t("common.delete")}
                onClick={() => act(() => deleteExpense(e.id, data.project.id))}
                className="inline-flex size-10 items-center justify-center rounded-(--r-control) text-ink-2 hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// --- Settings (admin) ------------------------------------------------------------------

export function SettingsTab({ data, siteUrl }: { data: ProjectData; siteUrl: string }) {
  const { t } = useT();
  const toast = useToast();
  const { act, pending } = useAct();
  const p = data.project;
  const [f, setF] = useState({
    status: p.status,
    share_budget: p.share_budget,
    title: p.title,
    address: p.address ?? "",
    client_name: p.client_name ?? "",
    client_email: p.client_email ?? "",
    client_phone: p.client_phone ?? "",
    start_date: p.start_date ?? "",
    due_date: p.due_date ?? "",
  });
  const portal = `${siteUrl}/p/${p.token}`;
  const [copied, setCopied] = useState(false);

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <Card className="grid gap-4 p-5">
        <div className="grid gap-1">
          <h3 className="font-semibold">{t("projects.portal")}</h3>
          <p className="text-sm text-ink-2">{t("projects.portalHint")}</p>
        </div>
        <div className="break-all rounded-xl bg-surface-2 p-3 font-mono text-sm">{portal}</div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            onClick={async () => {
              await navigator.clipboard.writeText(portal);
              setCopied(true);
              toast(t("common.copied"));
            }}
          >
            {t("common.copy")}
          </Button>
          <Button
            variant="secondary"
            icon={<Share2 className="size-4" />}
            onClick={() => (navigator.share ? navigator.share({ title: p.title, url: portal }).catch(() => {}) : navigator.clipboard.writeText(portal))}
          >
            {t("common.share")}
          </Button>
          <a href={portal} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-(--r-control) px-4 font-medium text-accent-strong">
            {t("common.open")}
          </a>
        </div>
        <Switch checked={f.share_budget} onChange={(v) => setF({ ...f, share_budget: v })} label={t("projects.shareBudget")} />
      </Card>

      <Card className="grid gap-4 p-5">
        <div className="grid gap-2">
          <span className="text-sm font-medium">{t("projects.status")}</span>
          <Chips
            value={f.status}
            onChange={(status) => setF({ ...f, status })}
            options={(["planning", "active", "on_hold", "completed"] as const).map((s) => ({ value: s, label: t(`projectStatus.${s}`) }))}
          />
        </div>
        <Field label={t("projects.name")}>{(pp) => <Input {...pp} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
        <Field label={t("projects.address")}>{(pp) => <Input {...pp} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("projects.start")}>{(pp) => <Input {...pp} type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} />}</Field>
          <Field label={t("projects.due")}>{(pp) => <Input {...pp} type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} />}</Field>
        </div>
        <Field label={t("projects.client")}>{(pp) => <Input {...pp} value={f.client_name} onChange={(e) => setF({ ...f, client_name: e.target.value })} />}</Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("auth.email")}>{(pp) => <Input {...pp} type="email" value={f.client_email} onChange={(e) => setF({ ...f, client_email: e.target.value })} />}</Field>
          <Field label={t("auth.phone")}>{(pp) => <Input {...pp} type="tel" value={f.client_phone} onChange={(e) => setF({ ...f, client_phone: e.target.value })} />}</Field>
        </div>
        <Button size="lg" loading={pending} onClick={() => act(() => updateProject(p.id, f), () => toast(t("settings.saved")))}>
          {t("common.save")}
        </Button>
      </Card>
    </div>
  );
}
