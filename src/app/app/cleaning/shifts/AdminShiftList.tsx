"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { ShiftView } from "@/lib/shifts";
import { useT } from "@/lib/i18n/client";
import { Avatar, EmptyState } from "@/components/ui/Display";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { ShiftCard } from "@/components/app/ShiftCard";
import { adminAddWorker, adminRemoveWorker } from "@/app/app/shifts/actions";

export function AdminShiftList({
  shifts,
  viewer,
  crew,
}: {
  shifts: ShiftView[];
  viewer: { id: string; name: string };
  crew: { id: string; name: string }[];
}) {
  const { t } = useT();
  const toast = useToast();
  const router = useRouter();
  const [managing, setManaging] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const shift = shifts.find((s) => s.id === managing);

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast(res.error ?? t("common.error"), "error");
      router.refresh();
    });

  if (!shifts.length) return <EmptyState title={t("shifts.noUpcoming")} />;

  return (
    <>
      <div className="grid gap-3">
        {shifts.map((s) => (
          <ShiftCard key={s.id} shift={s} viewer={viewer} onManage={() => setManaging(s.id)} />
        ))}
      </div>
      <Sheet open={Boolean(shift)} onClose={() => setManaging(null)} title={shift?.title ?? ""} description={shift?.suburb}>
        {shift && (
          <div className="grid gap-5">
            <section className="grid gap-2">
              <h3 className="text-sm font-extrabold text-ink-2">
                {t("shifts.onShift")} ({shift.crew.length}/{shift.spots})
              </h3>
              {shift.crew.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <Avatar name={c.name} />
                  <span className="flex-1 font-bold">{c.name}</span>
                  <button
                    type="button"
                    disabled={pending}
                    aria-label={`${t("common.remove")} ${c.name}`}
                    onClick={() => act(() => adminRemoveWorker(shift.id, c.id))}
                    className="inline-flex size-10 items-center justify-center rounded-full text-danger hover:bg-danger-soft"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              ))}
            </section>
            <section className="grid gap-2">
              <h3 className="text-sm font-extrabold text-ink-2">{t("shifts.addWorker")}</h3>
              {crew
                .filter((c) => !shift.crew.some((x) => x.id === c.id))
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={pending}
                    onClick={() => act(() => adminAddWorker(shift.id, c.id))}
                    className="flex items-center gap-3 rounded-xl p-1 text-left hover:bg-surface-2"
                  >
                    <Avatar name={c.name} />
                    <span className="flex-1 font-bold">{c.name}</span>
                    <span className="inline-flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                      <Plus className="size-5" />
                    </span>
                  </button>
                ))}
            </section>
          </div>
        )}
      </Sheet>
    </>
  );
}
