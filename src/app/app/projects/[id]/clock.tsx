"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Pencil } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { formatDate, formatHours, formatInstantTime, todayPerth } from "@/lib/format";
import { perthHHMM } from "@/lib/clock";
import { cn } from "@/lib/cn";
import { Avatar, Badge, Card } from "@/components/ui/Display";
import { Button } from "@/components/ui/Button";
import { Field, Input, Switch } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { Elapsed } from "@/components/app/Clock";
import { clockIn, clockOut, editClockTimes } from "../actions";
import type { ProjectData } from "./ProjectView";

type Entry = ProjectData["time"][number];

function useRun() {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done?: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast(res.error ?? "Error", "error");
      else {
        if (done) toast(done);
        after?.();
      }
      router.refresh();
    });
  return { pending, run };
}

/** Who is clocked in on this project. Supervisors and admins can clock people in and out. */
export function OnSiteNow({ data }: { data: ProjectData }) {
  const { t, locale } = useT();
  const { pending, run } = useRun();
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const manage = data.viewer.isAdmin || data.viewer.isSupervisor;
  const open = data.time.filter((e) => e.started_at && !e.ended_at);
  const off = data.members.filter((m) => !open.some((e) => e.profile_id === m.id));

  if (!open.length && !manage) return null;

  return (
    <section className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink-2">{t("clock.onSiteNow")}</h3>
        {manage && data.members.length > 0 && (
          <Button size="sm" variant="ghost" icon={<LogIn className="size-4" />} onClick={() => setPicking(true)}>
            {t("clock.clockInSomeone")}
          </Button>
        )}
      </div>
      {open.length === 0 ? (
        <p className="rounded-(--r-card) border border-dashed border-line px-4 py-3 text-sm text-ink-2">{t("clock.nobodyOnSite")}</p>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {open.map((e) => (
            <div key={e.id} className="flex items-center gap-3 p-4">
              <Avatar name={e.name} size={40} />
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate font-semibold">{e.name}</span>
                <span className="text-sm text-ink-2">
                  {t("clock.since", { time: formatInstantTime(e.started_at!, locale) })} · <Elapsed since={e.started_at!} className="font-semibold text-ink" />
                </span>
              </div>
              {manage && (
                <>
                  <button
                    type="button"
                    aria-label={`${t("clock.editTimes")}: ${e.name}`}
                    onClick={() => setEditing(e)}
                    className="inline-flex size-10 items-center justify-center rounded-(--r-control) text-ink-2 hover:bg-surface-2 hover:text-ink"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={pending}
                    icon={<LogOut className="size-4" />}
                    aria-label={`${t("clock.clockOut")}: ${e.name}`}
                    onClick={() => run(() => clockOut(e.id, data.project.id), t("clock.clockedOut"))}
                  >
                    <span className="hidden sm:inline">{t("clock.clockOut")}</span>
                  </Button>
                </>
              )}
            </div>
          ))}
        </Card>
      )}
      {editing && <EditTimes key={editing.id} entry={editing} projectId={data.project.id} onClose={() => setEditing(null)} />}
      <Sheet open={picking} onClose={() => setPicking(false)} title={t("clock.clockInSomeone")}>
        {off.length === 0 ? (
          <p className="text-ink-2">{t("clock.everyoneIn")}</p>
        ) : (
          <div className="grid gap-1">
            {off.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={pending}
                onClick={() => run(() => clockIn(data.project.id, m.id), t("clock.clockedIn"), () => setPicking(false))}
                className="flex items-center gap-3 rounded-xl p-2 text-left hover:bg-surface-2"
              >
                <Avatar name={m.name} />
                <span className="flex-1 font-medium">{m.name}</span>
                <LogIn className="size-5 text-ink-2" />
              </button>
            ))}
          </div>
        )}
      </Sheet>
    </section>
  );
}

/** Finished and manual entries. Clocked ones show their times; supervisors fix them. */
export function TimeLog({ data }: { data: ProjectData }) {
  const { t, locale } = useT();
  const [editing, setEditing] = useState<Entry | null>(null);
  const manage = data.viewer.isAdmin || data.viewer.isSupervisor;
  const done = data.time.filter((e) => !e.started_at || e.ended_at);
  if (!done.length) return null;

  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-semibold text-ink-2">{t("projects.hoursLogged")}</h3>
      <Card className="divide-y divide-line overflow-hidden">
        {done.slice(0, 30).map((e) => {
          const editable = manage && e.started_at !== null;
          const row = (
            <>
              <span className="w-24 shrink-0 font-medium text-ink-2">{formatDate(e.work_date, locale)}</span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate font-medium">
                  {e.name}
                  {e.note && <span className="font-medium text-ink-2"> · {e.note}</span>}
                </span>
                {e.started_at && e.ended_at && (
                  <span className="tabular flex flex-wrap items-center gap-x-2 text-xs text-ink-2">
                    {formatInstantTime(e.started_at, locale)} – {formatInstantTime(e.ended_at, locale)}
                    {e.auto_closed && <Badge tone="attention">{t("clock.review")}</Badge>}
                  </span>
                )}
              </span>
              <span className="tabular font-semibold">{formatHours(e.hours)}</span>
              {editable && <Pencil className="size-4 shrink-0 text-ink-2" aria-hidden />}
            </>
          );
          return editable ? (
            <button
              key={e.id}
              type="button"
              aria-label={`${t("clock.editTimes")}: ${e.name}, ${formatDate(e.work_date, locale)}`}
              onClick={() => setEditing(e)}
              className={cn("flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-surface-2", e.auto_closed && "bg-attention-soft/40")}
            >
              {row}
            </button>
          ) : (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              {row}
            </div>
          );
        })}
      </Card>
      {editing && <EditTimes key={editing.id} entry={editing} projectId={data.project.id} onClose={() => setEditing(null)} />}
    </section>
  );
}

function EditTimes({ entry, projectId, onClose }: { entry: Entry; projectId: string; onClose: () => void }) {
  const { t } = useT();
  const { pending, run } = useRun();
  const [date, setDate] = useState(entry.work_date);
  const [start, setStart] = useState(perthHHMM(entry.started_at!));
  const [end, setEnd] = useState(entry.ended_at ? perthHHMM(entry.ended_at) : "");
  const [stillOn, setStillOn] = useState(!entry.ended_at);

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${t("clock.editTimes")} · ${entry.name}`}
      footer={
        <Button
          block
          size="lg"
          loading={pending}
          onClick={() => run(() => editClockTimes(entry.id, projectId, { date, start, end: stillOn ? null : end }), t("clock.saved"), onClose)}
        >
          {t("common.save")}
        </Button>
      }
    >
      <div className="grid gap-5">
        {entry.auto_closed && <p className="rounded-xl bg-attention-soft px-3 py-2 text-sm font-medium text-attention">{t("clock.reviewHint")}</p>}
        <Field label={t("clock.date")}>{(p) => <Input {...p} type="date" max={todayPerth()} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("clock.start")}>{(p) => <Input {...p} type="time" value={start} onChange={(e) => setStart(e.target.value)} />}</Field>
          <Field label={t("clock.finish")}>
            {(p) => <Input {...p} type="time" disabled={stillOn} value={stillOn ? "" : end} onChange={(e) => setEnd(e.target.value)} />}
          </Field>
        </div>
        {!entry.ended_at && <Switch label={t("clock.stillOnSite")} checked={stillOn} onChange={setStillOn} />}
      </div>
    </Sheet>
  );
}
