import { addDays } from "./format";

export type TaskLike = { id: string; due_date: string | null; done_at: string | null; created_at: string };
export type TaskGroup<T> = { key: "overdue" | "today" | "tomorrow" | "date" | "none"; date: string | null; tasks: T[] };

const byDueThenAdded = (a: TaskLike, b: TaskLike) =>
  (a.due_date ?? "").localeCompare(b.due_date ?? "") || a.created_at.localeCompare(b.created_at);

/** Open tasks for the list view: overdue, today, tomorrow, each later date, then undated. */
export function groupTasks<T extends TaskLike>(tasks: T[], today: string): TaskGroup<T>[] {
  const open = tasks.filter((x) => !x.done_at).sort(byDueThenAdded);
  const tomorrow = addDays(today, 1);
  const groups: TaskGroup<T>[] = [];
  const push = (key: TaskGroup<T>["key"], date: string | null, task: T) => {
    const last = groups.at(-1);
    if (last && last.key === key && last.date === date) last.tasks.push(task);
    else groups.push({ key, date, tasks: [task] });
  };
  for (const task of open.filter((x) => x.due_date && x.due_date < today)) push("overdue", null, task);
  for (const task of open.filter((x) => x.due_date && x.due_date >= today)) {
    const d = task.due_date!;
    push(d === today ? "today" : d === tomorrow ? "tomorrow" : "date", d, task);
  }
  for (const task of open.filter((x) => !x.due_date)) push("none", null, task);
  return groups;
}

/** One day as a simple list. Overdue work only shows on today, so it isn't lost. */
export function dayTasks<T extends TaskLike>(tasks: T[], day: string, today: string) {
  const sorted = [...tasks].sort(byDueThenAdded);
  return {
    overdue: day === today ? sorted.filter((x) => !x.done_at && x.due_date && x.due_date < today) : [],
    due: sorted.filter((x) => !x.done_at && x.due_date === day),
    done: sorted.filter((x) => x.done_at && x.due_date === day),
  };
}

/** Finished tasks, most recent first. */
export function doneTasks<T extends TaskLike>(tasks: T[]) {
  return tasks.filter((x) => x.done_at).sort((a, b) => b.done_at!.localeCompare(a.done_at!));
}
