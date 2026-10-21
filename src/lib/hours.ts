import { addDays, perthDateTime } from "./format";

/** Monday of the week holding `date` (YYYY-MM-DD, Perth). */
export function weekStart(date: string) {
  const dow = (perthDateTime(date, "12:00").getUTCDay() + 6) % 7;
  return addDays(date, -dow);
}

type Entry = { work_date: string; hours: number | null };

/**
 * One person's week: hours for each of the seven days, Monday first, and the days that
 * have entries, newest first. Entries still on the clock (no hours yet) don't count.
 */
export function weekSummary<T extends Entry>(entries: T[], start: string) {
  const done = entries.filter((e) => e.hours !== null);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const list = done.filter((e) => e.work_date === date);
    return { date, entries: list, hours: list.reduce((a, e) => a + e.hours!, 0) };
  });
  return {
    days,
    worked: days.filter((d) => d.entries.length).reverse(),
    total: days.reduce((a, d) => a + d.hours, 0),
  };
}
