"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  Home,
  Mail,
  MapPin,
  MessageSquareQuote,
  Phone,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { estimate } from "@/lib/pricing/estimate";
import type { Addon, CleanType, PricingSettings, Preset } from "@/lib/pricing/types";
import type { BookingView } from "@/lib/bookings/load";
import { allowedActions, isEditable, type BookingAction } from "@/lib/bookings/status";
import { BOOKING_TONE } from "@/lib/bookings/ui";
import { formatDateLong, formatHours, formatMoney, formatTime, timeAgo } from "@/lib/format";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";
import { AvatarStack, Badge, Card, PageHeader } from "@/components/ui/Display";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { Stepper } from "@/components/ui/Stepper";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { saveQuote, transition } from "./actions";

const STATUSES = ["requested", "awaiting_payment", "scheduled", "completed", "declined", "cancelled"];

type Engine = { settings: PricingSettings; cleanType: CleanType; addons: Addon[]; presets: Preset[] } | null;
type Event = { id: string; kind: string; message: string | null; at: string; actor: string | null };

export function BookingAdmin({
  booking: b,
  engine,
  events,
  crewOnShift,
  siteUrl,
}: {
  booking: BookingView;
  engine: Engine;
  events: Event[];
  crewOnShift: { spots: number; names: string[] } | null;
  siteUrl: string;
}) {
  const { t, locale } = useT();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const editable = isEditable(b.status);

  const [crew, setCrew] = useState(b.final_crew ?? b.est.crew);
  const [hours, setHours] = useState(Number(b.final_hours ?? b.est.hours));
  const [price, setPrice] = useState(String(b.final_price ?? b.est.price));
  const [brief, setBrief] = useState(b.worker_brief ?? "");
  const [note, setNote] = useState(b.admin_note ?? "");
  const [sheet, setSheet] = useState<null | "decline" | "cancel">(null);
  const [reason, setReason] = useState("");

  const labour = b.est.labourHours;
  const dirty =
    crew !== (b.final_crew ?? b.est.crew) ||
    hours !== Number(b.final_hours ?? b.est.hours) ||
    price !== String(b.final_price ?? b.est.price) ||
    brief !== (b.worker_brief ?? "") ||
    note !== (b.admin_note ?? "");

  const recalc = useMemo(
    () =>
      engine
        ? estimate({
            ...engine,
            home: { bedrooms: b.bedrooms, bathrooms: b.bathrooms, sqm: b.sqm, levels: b.levels, pets: b.pets },
            crew,
          })
        : null,
    [engine, b, crew],
  );

  const changeCrew = (n: number) => {
    setCrew(n);
    // Keep total work constant: hours follow crew size.
    setHours(Math.max(0.25, Math.ceil((labour / n) * 4 - 1e-9) / 4));
  };

  const applySuggestion = () => {
    if (!b.sugg) return;
    changeCrew(b.sugg.crew ?? crew);
    if (b.sugg.hours) setHours(b.sugg.hours);
  };

  const quote = () => ({ final_price: price, final_crew: crew, final_hours: hours, worker_brief: brief, admin_note: note });

  const save = () =>
    start(async () => {
      const res = await saveQuote(b.id, quote());
      if (res.ok) toast(t("settings.saved"));
      else toast(res.error, "error");
      if (res.ok) router.refresh();
    });

  const run = (action: BookingAction, opts?: { reason?: string }) =>
    start(async () => {
      if (dirty) {
        const saved = await saveQuote(b.id, quote());
        if (!saved.ok) return toast(saved.error, "error");
      }
      const res = await transition(b.id, action, opts);
      if (!res.ok) return toast(res.error, "error");
      setSheet(null);
      toast(
        action === "confirm"
          ? t("cleaning.confirmSent", { email: b.client_email })
          : action === "mark_paid"
            ? t("cleaning.paidDone")
            : action === "complete"
              ? t("cleaning.completedDone")
              : t("settings.saved"),
      );
      router.refresh();
    });

  const actions = allowedActions(b.status);
  const primary: BookingAction | undefined = actions.find((a) => a === "confirm" || a === "mark_paid" || a === "complete");
  const primaryLabel: Record<string, string> = {
    confirm: t("cleaning.confirm"),
    mark_paid: t("cleaning.markPaid"),
    complete: t("cleaning.complete"),
  };

  return (
    <div className="grid gap-5 pb-24 lg:pb-0">
      <PageHeader
        back="/app/cleaning"
        title={b.client_name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={BOOKING_TONE[b.status]}>{t(`bookingStatus.${b.status}`)}</Badge>
            <span className="tabular text-sm font-bold">
              {t("cleaning.ref")} {b.ref}
            </span>
          </span>
        }
        actions={
          <a
            href={`${siteUrl}/b/${b.token}`}
            target="_blank"
            rel="noreferrer"
            className="hidden h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-sm font-bold sm:inline-flex"
          >
            {t("cleaning.openClientPage")} <ExternalLink className="size-4" />
          </a>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          {b.sugg && b.status === "requested" && (
            <div className="grid gap-3 rounded-2xl border border-attention/30 bg-attention-soft p-5">
              <div className="flex items-center gap-2 font-extrabold text-attention">
                <MessageSquareQuote className="size-5" /> {t("cleaning.suggestion")}
              </div>
              <p className="text-lg font-extrabold text-ink">
                {b.sugg.crew && (b.sugg.crew === 1 ? t("cleaning.person") : t("cleaning.people", { n: b.sugg.crew }))}
                {b.sugg.hours ? ` × ${formatHours(b.sugg.hours)}` : ""}
              </p>
              <p className="text-ink">&ldquo;{b.sugg.reason}&rdquo;</p>
              {editable && (
                <Button variant="secondary" size="sm" className="justify-self-start" icon={<Wand2 className="size-4" />} onClick={applySuggestion}>
                  {t("cleaning.applySuggestion")}
                </Button>
              )}
            </div>
          )}

          <Card className="grid gap-px overflow-hidden bg-line sm:grid-cols-2">
            <Info icon={CalendarDays} label={t("cleaning.when")}>
              {formatDateLong(b.service_date, locale)}, {formatTime(b.start_time, locale)}
              {b.flexible && <span className="block text-sm font-semibold text-accent-strong">{t("cleaning.flexible")}</span>}
            </Info>
            <Info icon={MapPin} label={t("projects.address")}>
              <a className="underline-offset-4 hover:underline" href={`https://maps.google.com/?q=${encodeURIComponent(`${b.address}, ${b.suburb}, WA`)}`} target="_blank" rel="noreferrer">
                {b.address}, {b.suburb}
              </a>
            </Info>
            <Info icon={Sparkles} label={t("cleaning.service")}>
              {b.cleanTypeName}
              {b.addonNames.length > 0 && <span className="block text-sm font-semibold text-ink-2">+ {b.addonNames.join(", ")}</span>}
            </Info>
            <Info icon={Home} label={t("cleaning.home")}>
              {b.bedrooms} {t("cleaning.bedrooms").toLowerCase()}, {b.bathrooms} {t("cleaning.bathrooms").toLowerCase()}
              <span className="block text-sm font-semibold text-ink-2">
                {[
                  b.sqm ? `${b.sqm} m²` : t("cleaning.unknownArea"),
                  b.levels > 1 && `${b.levels} ${t("cleaning.levels").toLowerCase()}`,
                  b.pets && t("cleaning.pets"),
                  b.parking,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </Info>
          </Card>

          {(b.access_notes || b.notes) && (
            <Card className="grid gap-3 p-5">
              {b.access_notes && (
                <div>
                  <p className="text-sm font-bold text-ink-2">{t("cleaning.access")}</p>
                  <p className="whitespace-pre-line">{b.access_notes}</p>
                </div>
              )}
              {b.notes && (
                <div>
                  <p className="text-sm font-bold text-ink-2">{t("common.notes")}</p>
                  <p className="whitespace-pre-line">{b.notes}</p>
                </div>
              )}
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-2 font-extrabold">{t("cleaning.client")}</h2>
            <p className="font-bold">{b.client_name}</p>
            <p className="text-sm text-ink-2">
              {b.client_email}
              {b.client_phone ? `, ${b.client_phone}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {b.client_phone && (
                <a href={`tel:${b.client_phone}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-sm font-extrabold text-accent-strong">
                  <Phone className="size-4" /> {t("common.call")}
                </a>
              )}
              <a href={`mailto:${b.client_email}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-surface-2 px-4 text-sm font-extrabold">
                <Mail className="size-4" /> {t("common.email")}
              </a>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-extrabold">{t("cleaning.timeline")}</h2>
            <ol className="grid gap-3">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-hidden />
                  <div className="grid gap-0.5">
                    <span className="text-sm font-extrabold">
                      {e.kind === "edited" ? t("cleaning.edited") : STATUSES.includes(e.kind) ? t(`bookingStatus.${e.kind}` as "bookingStatus.requested") : e.kind}
                      {e.actor && <span className="font-semibold text-ink-2"> · {e.actor}</span>}
                    </span>
                    {e.message && <span className="text-sm text-ink-2">{e.message}</span>}
                    <span suppressHydrationWarning className="text-xs font-semibold text-ink-2">{timeAgo(e.at, locale)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <aside className="grid gap-5 lg:sticky lg:top-8">
          <Card className="grid gap-4 p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-extrabold">{editable ? t("cleaning.finalQuote") : t("cleaning.price")}</h2>
              <span className="tabular text-sm font-bold text-ink-2">
                {t("cleaning.totalWork")} {formatHours(labour)}
              </span>
            </div>
            <label className="flex h-16 items-center rounded-2xl border border-line bg-surface-2/50 px-4 focus-within:border-accent">
              <span className="text-2xl font-extrabold text-ink-2">$</span>
              <input
                inputMode="decimal"
                aria-label={t("cleaning.price")}
                disabled={!editable}
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
                className="tabular w-full bg-transparent pl-1 text-3xl font-extrabold text-ink outline-none disabled:opacity-80"
              />
              {editable && recalc && Number(price) !== recalc.price && (
                <button
                  type="button"
                  onClick={() => setPrice(String(recalc.price))}
                  title={t("cleaning.recalc")}
                  className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-surface px-3 text-xs font-extrabold text-accent-strong shadow-soft"
                >
                  <RotateCcw className="size-3.5" /> {formatMoney(recalc.price)}
                </button>
              )}
            </label>
            <div className={cn("divide-y divide-line", !editable && "pointer-events-none opacity-70")}>
              <Stepper label={t("cleaning.crew")} value={crew} min={1} max={10} onChange={changeCrew} />
              <Stepper
                label={t("cleaning.duration")}
                value={hours}
                min={0.25}
                max={14}
                step={0.25}
                onChange={setHours}
                format={(v) => formatHours(v)}
                hint={crew * hours < labour ? `${formatHours(crew * hours)} < ${formatHours(labour)}` : undefined}
              />
            </div>
            {crewOnShift && (
              <div className="flex items-center justify-between rounded-xl bg-surface-2 p-3">
                <span className="text-sm font-bold">{t("shifts.spots", { taken: crewOnShift.names.length, spots: crewOnShift.spots })}</span>
                <AvatarStack names={crewOnShift.names} />
              </div>
            )}
            <Field label={t("cleaning.workerBrief")} hint={t("cleaning.workerBriefHint")}>
              {(p) => <Textarea {...p} rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} />}
            </Field>
            <Field label={t("cleaning.noteToClient")} optional={t("common.optional")}>
              {(p) => <Textarea {...p} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}
            </Field>
            {dirty && (
              <Button variant="secondary" onClick={save} loading={pending}>
                {t("common.save")}
              </Button>
            )}
            {b.status === "awaiting_payment" && (
              <p className="rounded-xl bg-attention-soft p-3 text-sm font-bold text-attention">{t("cleaning.paymentPending")}</p>
            )}
          </Card>

          <div className="hidden gap-2 lg:grid">
            {primary && (
              <Button size="lg" onClick={() => run(primary)} loading={pending}>
                {primaryLabel[primary]}
              </Button>
            )}
            <SecondaryActions actions={actions} onDecline={() => setSheet("decline")} onCancel={() => setSheet("cancel")} />
          </div>
        </aside>
      </div>

      {/* Mobile action bar, sits above the tab bar */}
      {(primary || actions.length > 0) && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-2">
            <SecondaryActions actions={actions} onDecline={() => setSheet("decline")} onCancel={() => setSheet("cancel")} compact />
            {primary && (
              <Button size="lg" className="flex-1" onClick={() => run(primary)} loading={pending}>
                {primaryLabel[primary]}
              </Button>
            )}
          </div>
        </div>
      )}

      <Sheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet === "decline" ? t("cleaning.decline") : t("cleaning.cancel")}
        footer={
          <Button
            variant="danger"
            block
            size="lg"
            loading={pending}
            onClick={() => run(sheet === "decline" ? "decline" : "cancel", { reason })}
          >
            {sheet === "decline" ? t("cleaning.decline") : t("cleaning.cancel")}
          </Button>
        }
      >
        <Field label={t("cleaning.declineReason")}>
          {(p) => <Textarea {...p} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}
        </Field>
      </Sheet>
    </div>
  );
}

function SecondaryActions({
  actions,
  onDecline,
  onCancel,
  compact,
}: {
  actions: BookingAction[];
  onDecline: () => void;
  onCancel: () => void;
  compact?: boolean;
}) {
  const { t } = useT();
  return (
    <div className={cn("flex gap-2", !compact && "justify-center")}>
      {actions.includes("decline") && (
        <Button variant={compact ? "secondary" : "ghost"} size={compact ? "lg" : "md"} onClick={onDecline}>
          {t("cleaning.decline")}
        </Button>
      )}
      {actions.includes("cancel") && !actions.includes("decline") && (
        <Button variant={compact ? "secondary" : "ghost"} size={compact ? "lg" : "md"} onClick={onCancel}>
          {compact ? t("common.cancel") : t("cleaning.cancel")}
        </Button>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-surface p-4">
      <Icon className="mt-0.5 size-5 shrink-0 text-accent-strong" />
      <div className="grid gap-0.5">
        <span className="text-[13px] font-bold text-ink-2">{label}</span>
        <span className="font-extrabold">{children}</span>
      </div>
    </div>
  );
}
