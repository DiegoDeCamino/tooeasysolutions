import { describe, expect, it } from "vitest";
import { dayTasks, doneTasks, groupTasks } from "./tasks";

const today = "2026-10-20";
const t = (id: string, due_date: string | null, done_at: string | null = null, created_at = "2026-10-01T00:00:00Z") => ({ id, due_date, done_at, created_at });

describe("groupTasks", () => {
  it("orders open tasks: overdue, today, tomorrow, later dates, then undated", () => {
    const groups = groupTasks(
      [t("none", null), t("later2", "2026-10-25"), t("later1", "2026-10-23"), t("tomorrow", "2026-10-21"), t("today", today), t("late", "2026-10-18"), t("done", today, "2026-10-20T01:00:00Z")],
      today,
    );
    expect(groups.map((g) => [g.key, g.date, g.tasks.map((x) => x.id)])).toEqual([
      ["overdue", null, ["late"]],
      ["today", today, ["today"]],
      ["tomorrow", "2026-10-21", ["tomorrow"]],
      ["date", "2026-10-23", ["later1"]],
      ["date", "2026-10-25", ["later2"]],
      ["none", null, ["none"]],
    ]);
  });

  it("keeps the oldest overdue first and skips empty groups", () => {
    const groups = groupTasks([t("b", "2026-10-19"), t("a", "2026-10-10")], today);
    expect(groups).toEqual([{ key: "overdue", date: null, tasks: [t("a", "2026-10-10"), t("b", "2026-10-19")] }]);
  });

  it("orders tasks on the same day by when they were added", () => {
    const groups = groupTasks([t("second", today, null, "2026-10-02T00:00:00Z"), t("first", today, null, "2026-10-01T00:00:00Z")], today);
    expect(groups[0].tasks.map((x) => x.id)).toEqual(["first", "second"]);
  });
});

describe("dayTasks", () => {
  const all = [t("late", "2026-10-18"), t("today", today), t("todayDone", today, "2026-10-20T02:00:00Z"), t("tomorrow", "2026-10-21"), t("none", null)];

  it("shows overdue work on top when looking at today", () => {
    const d = dayTasks(all, today, today);
    expect(d.overdue.map((x) => x.id)).toEqual(["late"]);
    expect(d.due.map((x) => x.id)).toEqual(["today"]);
    expect(d.done.map((x) => x.id)).toEqual(["todayDone"]);
  });

  it("shows only that day's tasks for other days", () => {
    const d = dayTasks(all, "2026-10-21", today);
    expect(d.overdue).toEqual([]);
    expect(d.due.map((x) => x.id)).toEqual(["tomorrow"]);
    expect(d.done).toEqual([]);
  });
});

describe("doneTasks", () => {
  it("lists finished tasks, most recent first", () => {
    const d = doneTasks([t("old", null, "2026-10-01T00:00:00Z"), t("open", null), t("new", null, "2026-10-19T00:00:00Z")]);
    expect(d.map((x) => x.id)).toEqual(["new", "old"]);
  });
});
