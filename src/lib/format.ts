export const TZ = "Australia/Perth";
const PERTH_OFFSET = "+08:00"; // Perth has no daylight saving

type Loc = "en" | "es";
const intlLocale = (l: Loc) => (l === "es" ? "es-AR" : "en-AU");

export function formatMoney(value: number | string | null | undefined, opts: { cents?: boolean } = {}) {
  const n = Number(value ?? 0);
  const cents = opts.cents ?? !Number.isInteger(n);
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(n);
}

/** "3h 45m", "4h", "45m" */
export function formatHours(value: number | string | null | undefined) {
  const total = Math.round(Number(value ?? 0) * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/** Build an absolute instant from a Perth calendar date and wall-clock time. */
export function perthDateTime(date: string, time: string) {
  const t = time.length === 5 ? `${time}:00` : time;
  return new Date(`${date}T${t}${PERTH_OFFSET}`);
}

/** Today's date in Perth as YYYY-MM-DD. */
export function todayPerth(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

export function addDays(date: string, days: number) {
  const d = perthDateTime(date, "12:00");
  d.setUTCDate(d.getUTCDate() + days);
  return todayPerth(d);
}

/** "Sat 12 Oct" style label for a YYYY-MM-DD date. */
export function formatDate(date: string, locale: Loc = "en", opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    ...opts,
  }).format(perthDateTime(date, "12:00"));
}

export function formatDateLong(date: string, locale: Loc = "en") {
  return formatDate(date, locale, { weekday: "long", month: "long", year: "numeric" });
}

/** "9:00 am" / "09:00" from "09:00:00" */
export function formatTime(time: string, locale: Loc = "en") {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(perthDateTime("2026-01-01", time));
}

export function formatInstantTime(iso: string, locale: Loc = "en") {
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(
    new Date(iso),
  );
}

export function formatInstantDate(iso: string, locale: Loc = "en", opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    ...opts,
  }).format(new Date(iso));
}

/** Perth calendar date (YYYY-MM-DD) of an instant. */
export function perthDateOf(iso: string) {
  return todayPerth(new Date(iso));
}

export function timeAgo(iso: string, locale: Loc = "en") {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  if (diff < 60) return rtf.format(-Math.round(diff), "second");
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  if (diff < 86400 * 7) return rtf.format(-Math.round(diff / 86400), "day");
  return formatInstantDate(iso, locale);
}

export function initials(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function firstName(name: string | null | undefined) {
  return (name ?? "").trim().split(/\s+/)[0] || "";
}
