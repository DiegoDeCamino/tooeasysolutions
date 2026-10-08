"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Clock, KeyRound, MapPin, UserMinus, UserPlus, Wallet } from "lucide-react";
import type { ShiftView } from "@/lib/shifts";
import { shiftHours } from "@/lib/shifts";
import { formatHours, formatInstantDate, formatInstantTime, formatMoney } from "@/lib/format";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";
import { AvatarStack, Badge } from "@/components/ui/Display";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { SHIFT_TONE } from "@/lib/bookings/ui";
import { claimShift, leaveShift } from "@/app/app/shifts/actions";

export function ShiftCard({
  shift,
  viewer,
  canClaim = true,
  onManage,
}: {
  shift: ShiftView;
  viewer: { id: string; name: string };
  canClaim?: boolean;
  onManage?: () => void;
}) {
  const { t, locale } = useT();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [crew, setCrew] = useOptimistic(shift.crew);

  const mine = crew.some((c) => c.id === viewer.id);
  const left = Math.max(0, shift.spots - crew.length);
  const hours = shiftHours(shift);
  const closed = shift.status === "done" || shift.status === "cancelled";

  const claim = () =>
    start(async () => {
      setCrew([...crew, viewer]);
      const res = await claimShift(shift.id);
      if (!res.ok) return toast(res.error, "error");
      const msg: Record<string, string> = {
        ok: t("shifts.claimed"),
        full: t("shifts.full"),
        closed: t("shifts.closed"),
        forbidden: t("shifts.forbidden"),
        already: t("shifts.claimed"),
      };
      toast(msg[res.data] ?? t("common.error"), res.data === "ok" || res.data === "already" ? "ok" : "error");
    });

  const leave = () =>
    start(async () => {
      setCrew(crew.filter((c) => c.id !== viewer.id));
      setConfirmLeave(false);
      const res = await leaveShift(shift.id);
      if (!res.ok || res.data !== "ok") toast(t("common.error"), "error");
    });

  return (
    <article
      className={cn(
        "grid gap-4 rounded-(--r-card) border bg-surface p-4 shadow-soft transition",
        mine ? "border-accent" : "border-line",
        closed && "opacity-70",
      )}
    >
      <header className="flex items-start gap-3">
        <div className={cn("flex w-12 shrink-0 flex-col items-center rounded-lg py-1.5 leading-none", mine ? "bg-accent-strong text-accent-ink" : "bg-surface-2")}>
          <span className="text-[11px] font-semibold uppercase opacity-80">{formatInstantDate(shift.starts_at, locale, { weekday: "short", day: undefined, month: undefined })}</span>
          <span className="tabular text-2xl font-semibold leading-none">{formatInstantDate(shift.starts_at, locale, { day: "numeric", weekday: undefined, month: undefined })}</span>
          <span className="text-[11px] font-medium opacity-80">{formatInstantDate(shift.starts_at, locale, { month: "short", weekday: undefined, day: undefined })}</span>
        </div>
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{shift.title}</h3>
            {mine ? (
              <Badge tone="accent">{t("shifts.claimed")}</Badge>
            ) : (
              <Badge tone={SHIFT_TONE[shift.status]}>{left === 1 ? t("shifts.spotLeft") : left > 0 ? t("shifts.spotsLeft", { n: left }) : t(`shiftStatus.${shift.status}`)}</Badge>
            )}
          </div>
          <p className="flex items-center gap-1.5 text-sm font-medium text-ink-2">
            <Clock className="size-4" />
            <span className="tabular">
              {formatInstantTime(shift.starts_at, locale)} - {formatInstantTime(shift.ends_at, locale)} ({formatHours(hours)})
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-sm font-medium text-ink-2">
            <MapPin className="size-4" /> {shift.suburb}
          </p>
        </div>
      </header>

      {shift.brief && <p className="whitespace-pre-line rounded-xl bg-surface-2/70 p-3 text-[15px] leading-relaxed">{shift.brief}</p>}

      {shift.details ? (
        <div className="grid gap-2 rounded-xl border border-line p-3">
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(shift.details.address + ", WA")}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 font-semibold text-accent-strong"
          >
            <MapPin className="size-4" /> {shift.details.address}
          </a>
          {shift.details.access_notes && (
            <p className="flex gap-2 whitespace-pre-line text-sm">
              <KeyRound className="mt-0.5 size-4 shrink-0 text-ink-2" />
              {shift.details.access_notes}
            </p>
          )}
        </div>
      ) : (
        !onManage && <p className="text-[13px] font-medium text-ink-2">{t("shifts.addressAfter")}</p>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {crew.length > 0 && <AvatarStack names={crew.map((c) => c.name)} />}
          <span className="tabular flex items-center gap-1.5 text-sm font-semibold">
            <Wallet className="size-4 text-accent-strong" />
            {t("common.approx", { amount: formatMoney(shift.pay_rate * hours) })}
          </span>
        </div>
        {onManage ? (
          <Button size="sm" variant="secondary" onClick={onManage}>
            {t("common.edit")}
          </Button>
        ) : closed ? null : mine ? (
          <Button size="md" variant="secondary" icon={<UserMinus className="size-4" />} onClick={() => setConfirmLeave(true)} loading={pending}>
            {t("shifts.leave")}
          </Button>
        ) : left > 0 && canClaim ? (
          <Button size="md" icon={<UserPlus className="size-4" />} onClick={claim} loading={pending}>
            {t("shifts.claim")}
          </Button>
        ) : null}
      </footer>

      <Sheet
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title={t("shifts.leave")}
        description={t("shifts.leaveConfirm")}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" block onClick={() => setConfirmLeave(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" block onClick={leave}>
              {t("shifts.leave")}
            </Button>
          </div>
        }
      >
        <span />
      </Sheet>
    </article>
  );
}
