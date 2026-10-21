import { describe, expect, it } from "vitest";
import { weekStart, weekSummary } from "./hours";

describe("weekStart", () => {
  it("goes back to Monday", () => {
    expect(weekStart("2026-10-21")).toBe("2026-10-19"); // Wednesday
    expect(weekStart("2026-10-25")).toBe("2026-10-19"); // Sunday
  });

  it("keeps a Monday and crosses months", () => {
    expect(weekStart("2026-10-19")).toBe("2026-10-19");
    expect(weekStart("2026-11-01")).toBe("2026-10-26");
  });
});

describe("weekSummary", () => {
  const entries = [
    { id: "a", work_date: "2026-10-19", hours: 8 },
    { id: "b", work_date: "2026-10-19", hours: 1.5 },
    { id: "c", work_date: "2026-10-21", hours: 7.25 },
    { id: "open", work_date: "2026-10-22", hours: null },
  ];

  it("totals each day and the week, skipping a running clock", () => {
    const s = weekSummary(entries, "2026-10-19");
    expect(s.days.map((d) => d.hours)).toEqual([9.5, 0, 7.25, 0, 0, 0, 0]);
    expect(s.total).toBe(16.75);
  });

  it("lists only worked days, newest first", () => {
    const s = weekSummary(entries, "2026-10-19");
    expect(s.worked.map((d) => d.date)).toEqual(["2026-10-21", "2026-10-19"]);
    expect(s.worked[1].entries.map((e) => e.id)).toEqual(["a", "b"]);
  });
});
