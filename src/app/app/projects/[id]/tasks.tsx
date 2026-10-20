"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ListTodo, Plus, Trash2, User } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { addDays, formatDate, todayPerth } from "@/lib/format";
import { dayTasks, doneTasks, groupTasks } from "@/lib/tasks";
import { cn } from "@/lib/cn";
import { Card, EmptyState } from "@/components/ui/Display";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Chips } from "@/components/ui/Chips";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { addTask, deleteTask, setTaskDone, updateTask } from "../actions";
import type { ProjectData } from "./ProjectView";

type Task = ProjectData["tasks"][number];
type View = "list" | "day";

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
  return { pending, run, start, toast, router };
}

export function TasksTab({ data }: { data: ProjectData }) {
  const { t, locale } = useT();
  const { start, toast, router } = useRun();
  const today = todayPerth();
  const [view, setView] = useState<View>("list");
  const [day, setDay] = useState(today);
  const [editing, setEditing] = useState<Task | null>(null);
  const [tasks, setTasks] = useOptimistic(data.tasks);

  const canEdit = (task: Task) => data.viewer.isAdmin || data.viewer.isSupervisor || task.created_by === data.viewer.id;

  const toggle = (task: Task) =>
    start(async () => {
      const done = !task.done_at;
      setTasks(tasks.map((x) => (x.id === task.id ? { ...x, done_at: done ? new Date().toISOString() : null } : x)));
      const res = await setTaskDone(task.id, data.project.id, done);
      if (!res.ok) toast(res.error, "error");
      router.refresh();
    });

  const row = (task: Task, opts: { showDue?: boolean; late?: boolean } = {}) => (
    <TaskRow key={task.id} task={task} {...opts} onToggle={() => toggle(task)} onEdit={canEdit(task) ? () => setEditing(task) : undefined} />
  );

  const groupLabel = (key: string, date: string | null) =>
    key === "overdue" ? t("tasks.overdue") : key === "today" ? t("tasks.today") : key === "tomorrow" ? t("tasks.tomorrow") : key === "none" ? t("tasks.noDate") : formatDate(date!, locale);

  const done = doneTasks(tasks);
  const groups = groupTasks(tasks, today);
  const d = dayTasks(tasks, day, today);

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-4">
      <Chips
        label={t("tasks.tab")}
        value={view}
        onChange={setView}
        options={[
          { value: "list", label: t("tasks.list"), icon: <ListTodo className="size-4" /> },
          { value: "day", label: t("tasks.byDay"), icon: <CalendarDays className="size-4" /> },
        ]}
      />

      {view === "day" && <DayPicker day={day} today={today} onChange={setDay} />}

      <QuickAdd data={data} date={view === "day" ? day : null} />

      {view === "list" ? (
        tasks.length === 0 ? (
          <EmptyState icon={<ListTodo className="size-6" />} title={t("tasks.empty")} body={t("tasks.emptyHint")} />
        ) : (
          <>
            {groups.map((g) => (
              <section key={`${g.key}-${g.date}`} className="grid gap-2">
                <h3 className={cn("text-sm font-semibold", g.key === "overdue" ? "text-danger" : "text-ink-2")}>{groupLabel(g.key, g.date)}</h3>
                <Card className="divide-y divide-line overflow-hidden">{g.tasks.map((x) => row(x, { showDue: g.key === "overdue", late: g.key === "overdue" }))}</Card>
              </section>
            ))}
            {done.length > 0 && (
              <details className="group grid gap-2">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-ink-2 [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="size-4 transition group-open:rotate-180" />
                  {t("tasks.done", { n: done.length })}
                </summary>
                <Card className="mt-2 divide-y divide-line overflow-hidden">{done.slice(0, 50).map((x) => row(x, { showDue: true }))}</Card>
              </details>
            )}
          </>
        )
      ) : (
        <>
          {d.overdue.length > 0 && (
            <section className="grid gap-2">
              <h3 className="text-sm font-semibold text-danger">{t("tasks.overdue")}</h3>
              <Card className="divide-y divide-line overflow-hidden">{d.overdue.map((x) => row(x, { showDue: true, late: true }))}</Card>
            </section>
          )}
          {d.due.length + d.done.length === 0 ? (
            <p className="rounded-(--r-card) border border-dashed border-line px-4 py-6 text-center text-sm text-ink-2">{t("tasks.emptyDay")}</p>
          ) : (
            <Card className="divide-y divide-line overflow-hidden">{[...d.due, ...d.done].map((x) => row(x))}</Card>
          )}
        </>
      )}

      {editing && <TaskSheet key={editing.id} data={data} task={editing} defaultDate={null} onClose={() => setEditing(null)} />}
    </div>
  );
}

function TaskRow({ task, showDue, late, onToggle, onEdit }: { task: Task; showDue?: boolean; late?: boolean; onToggle: () => void; onEdit?: () => void }) {
  const { t, locale } = useT();
  const done = Boolean(task.done_at);
  const meta = [
    task.assignee,
    showDue && task.due_date ? t("tasks.due", { date: formatDate(task.due_date, locale) }) : null,
    done && task.done_by ? t("tasks.doneBy", { name: task.done_by }) : null,
  ].filter(Boolean);

  const body = (
    <span className="grid min-w-0 flex-1 gap-0.5">
      <span className={cn("font-medium break-words", done && "text-ink-2 line-through decoration-2")}>{task.title}</span>
      {meta.length > 0 && <span className={cn("text-xs font-medium", late ? "text-danger" : "text-ink-2")}>{meta.join(" · ")}</span>}
    </span>
  );

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <button
        type="button"
        aria-pressed={done}
        aria-label={t(done ? "tasks.markOpen" : "tasks.markDone", { task: task.title })}
        onClick={onToggle}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full transition active:scale-90"
      >
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full border-2 transition",
            done ? "border-accent-strong bg-accent-strong text-accent-ink" : late ? "border-danger" : "border-line",
          )}
        >
          {done && <Check className="size-4" strokeWidth={3} />}
        </span>
      </button>
      {onEdit ? (
        <button type="button" onClick={onEdit} className="flex min-w-0 flex-1 rounded-lg py-1 text-left hover:bg-surface-2" aria-label={`${t("tasks.edit")}: ${task.title}`}>
          {body}
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 py-1">{body}</span>
      )}
    </div>
  );
}

function DayPicker({ day, today, onChange }: { day: string; today: string; onChange: (d: string) => void }) {
  const { t, locale } = useT();
  const label = day === today ? t("tasks.today") : day === addDays(today, 1) ? t("tasks.tomorrow") : null;
  return (
    <div className="flex items-center gap-2 rounded-(--r-card) border border-line bg-surface p-1.5 shadow-soft">
      <button
        type="button"
        aria-label={t("tasks.prevDay")}
        onClick={() => onChange(addDays(day, -1))}
        className="inline-flex size-11 items-center justify-center rounded-(--r-control) text-ink-2 hover:bg-surface-2 hover:text-ink"
      >
        <ChevronLeft className="size-5" />
      </button>
      <label className="relative flex flex-1 cursor-pointer flex-col items-center rounded-(--r-control) py-1 hover:bg-surface-2">
        <span className="font-semibold first-letter:uppercase">{formatDate(day, locale, { weekday: "long", month: "long" })}</span>
        {label && <span className="text-xs font-medium text-accent-strong">{label}</span>}
        <input type="date" value={day} onChange={(e) => e.target.value && onChange(e.target.value)} aria-label={t("tasks.pickDate")} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
      <button
        type="button"
        aria-label={t("tasks.nextDay")}
        onClick={() => onChange(addDays(day, 1))}
        className="inline-flex size-11 items-center justify-center rounded-(--r-control) text-ink-2 hover:bg-surface-2 hover:text-ink"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

type DateChoice = "none" | "today" | "tomorrow" | "pick";

/** Quick add. Date and person chips appear once you start typing; the day view fixes the date. */
function QuickAdd({ data, date }: { data: ProjectData; date: string | null }) {
  const { t } = useT();
  const { pending, run } = useRun();
  const [title, setTitle] = useState("");
  const when = useWhen(null);
  const [who, setWho] = useState("anyone");
  const typing = title.trim().length > 0;
  return (
    <form
      className="grid gap-3 rounded-(--r-card) border border-line bg-surface p-3 shadow-soft"
      onSubmit={(e) => {
        e.preventDefault();
        if (!typing) return;
        const dueDate = date ?? when.dueDate;
        run(() => addTask(data.project.id, { title, dueDate, assigneeId: who === "anyone" ? null : who }), t("tasks.added"), () => {
          setTitle("");
          when.setChoice("none");
          setWho("anyone");
        });
      }}
    >
      <div className="flex gap-2">
        <Input aria-label={t("tasks.add")} placeholder={t("tasks.placeholder")} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        <Button type="submit" size="lg" loading={pending} icon={<Plus className="size-5" />} aria-label={t("tasks.add")} />
      </div>
      {typing && (
        <div className="grid gap-2">
          {date === null && <WhenChips when={when} />}
          <WhoChips data={data} value={who} onChange={setWho} />
        </div>
      )}
    </form>
  );
}

function useWhen(initial: string | null) {
  const today = todayPerth();
  const tomorrow = addDays(today, 1);
  const [choice, setChoice] = useState<DateChoice>(initial === null ? "none" : initial === today ? "today" : initial === tomorrow ? "tomorrow" : "pick");
  const [picked, setPicked] = useState(initial ?? tomorrow);
  const dueDate = choice === "none" ? null : choice === "today" ? today : choice === "tomorrow" ? tomorrow : picked;
  return { choice, setChoice, picked, setPicked, dueDate };
}

function WhenChips({ when }: { when: ReturnType<typeof useWhen> }) {
  const { t } = useT();
  return (
    <>
      <Chips
        scroll
        label={t("tasks.when")}
        value={when.choice}
        onChange={when.setChoice}
        options={[
          { value: "none", label: t("tasks.noDate") },
          { value: "today", label: t("tasks.today") },
          { value: "tomorrow", label: t("tasks.tomorrow") },
          { value: "pick", label: t("tasks.pickDate"), icon: <CalendarDays className="size-4" /> },
        ]}
      />
      {when.choice === "pick" && (
        <Input type="date" aria-label={t("tasks.pickDate")} value={when.picked} onChange={(e) => e.target.value && when.setPicked(e.target.value)} />
      )}
    </>
  );
}

function WhoChips({ data, value, onChange }: { data: ProjectData; value: string; onChange: (v: string) => void }) {
  const { t } = useT();
  if (!data.members.length) return null;
  return (
    <Chips
      scroll
      label={t("tasks.assignee")}
      value={value}
      onChange={onChange}
      options={[
        { value: "anyone", label: t("tasks.anyone"), icon: <User className="size-4" /> },
        ...data.members.map((m) => ({ value: m.id, label: m.id === data.viewer.id ? t("nav.me") : m.name })),
      ]}
    />
  );
}

/** Create (task = null) or edit a task with its date and person. */
export function TaskSheet({ data, task, defaultDate, onClose }: { data: ProjectData; task: Task | null; defaultDate: string | null; onClose: () => void }) {
  const { t } = useT();
  const { pending, run } = useRun();
  const [title, setTitle] = useState(task?.title ?? "");
  const when = useWhen(task ? task.due_date : defaultDate);
  const [who, setWho] = useState(task?.assignee_id ?? "anyone");
  const input = { title, dueDate: when.dueDate, assigneeId: who === "anyone" ? null : who };

  return (
    <Sheet
      open
      onClose={onClose}
      title={task ? t("tasks.edit") : t("tasks.add")}
      footer={
        <div className="flex gap-2">
          {task && (
            <Button
              variant="danger"
              size="lg"
              loading={pending}
              icon={<Trash2 className="size-5" />}
              aria-label={t("common.delete")}
              onClick={() => run(() => deleteTask(task.id, data.project.id), t("tasks.deleted"), onClose)}
            />
          )}
          <Button
            block
            size="lg"
            loading={pending}
            onClick={() =>
              run(() => (task ? updateTask(task.id, data.project.id, input) : addTask(data.project.id, input)), task ? t("tasks.saved") : t("tasks.added"), onClose)
            }
          >
            {task ? t("common.save") : t("tasks.add")}
          </Button>
        </div>
      }
    >
      <div className="grid gap-5">
        <Field label={t("tasks.task")}>{(p) => <Input {...p} placeholder={t("tasks.placeholder")} value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />}</Field>
        <div className="grid gap-2">
          <span className="text-sm font-medium">{t("tasks.when")}</span>
          <WhenChips when={when} />
        </div>
        {data.members.length > 0 && (
          <div className="grid gap-2">
            <span className="text-sm font-medium">{t("tasks.assignee")}</span>
            <WhoChips data={data} value={who} onChange={setWho} />
          </div>
        )}
      </div>
    </Sheet>
  );
}
