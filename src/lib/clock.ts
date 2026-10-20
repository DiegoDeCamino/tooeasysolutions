import { TZ, perthDateTime } from "./format";

/** Open entries get a "still clocked in?" nudge after this long... */
export const REMIND_AFTER_HOURS = 10;
/** ...and are closed at start + this long, flagged for review. */
export const AUTO_CLOSE_HOURS = 12;

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Whole minutes on the clock so far (never negative). */
export function elapsedMinutes(startedAt: string, now: Date) {
  return Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 60000));
}

/**
 * Turn a Perth date and wall-clock start/end into instants. An end before the start is
 * night work and rolls into the next day. `end` is null for an entry still on the clock.
 */
export function entryRange(date: string, start: string, end: string | null) {
  if (!HHMM.test(start) || (end !== null && !HHMM.test(end))) return null;
  const startedAt = perthDateTime(date, start);
  if (end === null) return { startedAt, endedAt: null };
  if (end === start) return null;
  const endedAt = perthDateTime(date, end);
  if (endedAt <= startedAt) endedAt.setUTCDate(endedAt.getUTCDate() + 1);
  return { startedAt, endedAt };
}

/** "07:05" in Perth, for time inputs. */
export function perthHHMM(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
}
