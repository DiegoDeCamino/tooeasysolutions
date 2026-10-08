"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { estimate } from "@/lib/pricing/estimate";
import type { PricingData } from "@/lib/pricing/load";
import { formatHours, formatMoney } from "@/lib/format";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Display";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Stepper } from "@/components/ui/Stepper";
import { Chips } from "@/components/ui/Chips";
import { useToast } from "@/components/ui/Toast";
import { savePricing } from "./actions";

type SettingsForm = Record<
  | "client_hourly_rate"
  | "worker_hourly_rate"
  | "base_hours"
  | "hours_per_bedroom"
  | "hours_per_bathroom"
  | "hours_per_50sqm"
  | "hours_per_extra_level"
  | "pet_hours"
  | "max_shift_hours"
  | "min_price"
  | "price_rounding",
  string
>;

let tmp = 0;
const newId = () => `new-${++tmp}`;

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = "0.25",
  bare,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  step?: string;
  /** Hide the visible label (column header carries it). */
  bare?: boolean;
}) {
  return (
    <label className="grid gap-1.5">
      <span className={bare ? "sr-only" : "text-sm font-medium text-ink"}>{label}</span>
      <span className="flex h-10 items-center rounded-(--r-field) border border-line bg-surface px-3 transition focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/15">
        {prefix && <span className="mr-1 text-ink-2">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="tabular w-full min-w-0 bg-transparent text-base text-ink outline-none md:text-[15px]"
        />
        {suffix && <span className="ml-1 whitespace-nowrap text-sm text-ink-2">{suffix}</span>}
      </span>
    </label>
  );
}

function Section({ title, hint, action, children }: { title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="grid gap-0.5">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {hint && <p className="text-sm text-ink-2">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

export function PricingEditor({ initial }: { initial: PricingData }) {
  const { t } = useT();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [dirty, setDirty] = useState(false);

  const s0 = initial.settings;
  const [settings, setSettings] = useState<SettingsForm>({
    client_hourly_rate: String(s0.clientHourlyRate),
    worker_hourly_rate: String(initial.workerRate),
    base_hours: String(s0.baseHours),
    hours_per_bedroom: String(s0.hoursPerBedroom),
    hours_per_bathroom: String(s0.hoursPerBathroom),
    hours_per_50sqm: String(s0.hoursPer50Sqm),
    hours_per_extra_level: String(s0.hoursPerExtraLevel),
    pet_hours: String(s0.petHours),
    max_shift_hours: String(s0.maxShiftHours),
    min_price: String(s0.minPrice),
    price_rounding: String(s0.priceRounding),
  });
  const [types, setTypes] = useState(initial.cleanTypes.map((c) => ({ ...c, multiplier: String(c.multiplier) })));
  const [addons, setAddons] = useState(initial.addons.map((a) => ({ ...a, value: String(a.value) })));
  const [presets, setPresets] = useState(
    initial.presets.map((p) => ({ ...p, maxSqm: p.maxSqm === null ? "" : String(p.maxSqm), fixedPrice: String(p.fixedPrice) })),
  );
  const [deletedAddons, setDeletedAddons] = useState<string[]>([]);
  const [deletedPresets, setDeletedPresets] = useState<string[]>([]);

  const touch = <A extends unknown[]>(fn: (...args: A) => void) => (...args: A) => {
    fn(...args);
    setDirty(true);
  };
  const setS = touch((key: keyof SettingsForm, v: string) => setSettings((s) => ({ ...s, [key]: v })));

  // "Try it" sample home
  const [sample, setSample] = useState({ bedrooms: 3, bathrooms: 2, typeId: types[0]?.id ?? "" });
  const preview = useMemo(() => {
    const ct = types.find((x) => x.id === sample.typeId) ?? types[0];
    if (!ct) return null;
    const n = (v: string) => Number(v) || 0;
    return estimate({
      settings: {
        clientHourlyRate: n(settings.client_hourly_rate),
        baseHours: n(settings.base_hours),
        hoursPerBedroom: n(settings.hours_per_bedroom),
        hoursPerBathroom: n(settings.hours_per_bathroom),
        hoursPer50Sqm: n(settings.hours_per_50sqm),
        hoursPerExtraLevel: n(settings.hours_per_extra_level),
        petHours: n(settings.pet_hours),
        maxShiftHours: Math.max(1, n(settings.max_shift_hours)),
        minPrice: n(settings.min_price),
        priceRounding: Math.max(1, n(settings.price_rounding)),
      },
      cleanType: { id: ct.id, name: ct.name, multiplier: n(ct.multiplier) },
      addons: [],
      presets: presets
        .filter((p) => p.active)
        .map((p) => ({ ...p, maxSqm: p.maxSqm === "" ? null : Number(p.maxSqm), fixedPrice: n(p.fixedPrice) })),
      home: { bedrooms: sample.bedrooms, bathrooms: sample.bathrooms, sqm: null, levels: 1, pets: false },
    });
  }, [settings, types, presets, sample]);

  const save = () =>
    start(async () => {
      const res = await savePricing({
        settings,
        cleanTypes: types.map((c) => ({ id: c.id.startsWith("new-") ? undefined : c.id, name: c.name, description: c.description, multiplier: c.multiplier, active: c.active })),
        addons: addons.map((a) => ({ id: a.id.startsWith("new-") ? undefined : a.id, name: a.name, kind: a.kind, value: a.value, active: a.active })),
        presets: presets.map((p) => ({
          id: p.id.startsWith("new-") ? undefined : p.id,
          name: p.name,
          cleanTypeId: p.cleanTypeId,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          maxSqm: p.maxSqm === "" ? null : p.maxSqm,
          fixedPrice: p.fixedPrice,
          active: p.active,
        })),
        deletedAddons,
        deletedPresets,
      });
      if (res.ok) {
        setDirty(false);
        toast(t("settings.saved"));
      } else toast(res.error, "error");
    });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid gap-5">
        <Section title={t("settings.rates")}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <NumberInput label={t("settings.clientRate")} prefix="$" suffix="/h" step="1" value={settings.client_hourly_rate} onChange={(v) => setS("client_hourly_rate", v)} />
            <NumberInput label={t("settings.workerRate")} prefix="$" suffix="/h" step="1" value={settings.worker_hourly_rate} onChange={(v) => setS("worker_hourly_rate", v)} />
            <NumberInput label={t("settings.minPrice")} prefix="$" step="5" value={settings.min_price} onChange={(v) => setS("min_price", v)} />
            <NumberInput label={t("settings.baseHours")} suffix="h" value={settings.base_hours} onChange={(v) => setS("base_hours", v)} />
            <NumberInput label={t("settings.perBedroom")} suffix="h" value={settings.hours_per_bedroom} onChange={(v) => setS("hours_per_bedroom", v)} />
            <NumberInput label={t("settings.perBathroom")} suffix="h" value={settings.hours_per_bathroom} onChange={(v) => setS("hours_per_bathroom", v)} />
            <NumberInput label={t("settings.per50sqm")} suffix="h" value={settings.hours_per_50sqm} onChange={(v) => setS("hours_per_50sqm", v)} />
            <NumberInput label={t("settings.perLevel")} suffix="h" value={settings.hours_per_extra_level} onChange={(v) => setS("hours_per_extra_level", v)} />
            <NumberInput label={t("settings.pets")} suffix="h" value={settings.pet_hours} onChange={(v) => setS("pet_hours", v)} />
            <NumberInput label={t("settings.maxShift")} suffix="h" step="0.5" value={settings.max_shift_hours} onChange={(v) => setS("max_shift_hours", v)} />
            <NumberInput label={t("settings.rounding")} prefix="$" step="1" value={settings.price_rounding} onChange={(v) => setS("price_rounding", v)} />
          </div>
        </Section>

        <Section
          title={t("settings.cleanTypes")}
          action={
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus className="size-4" />}
              onClick={touch(() => setTypes((x) => [...x, { id: newId(), key: "", name: "", description: "", multiplier: "1", active: true, sort: x.length }]))}
            >
              {t("common.add")}
            </Button>
          }
        >
          <div className="-mx-5 -my-5 divide-y divide-line">
            <RowHead cols={TYPE_COLS} labels={[t("settings.name"), t("settings.description"), t("settings.multiplier"), t("settings.active")]} />
            {types.map((c, i) => {
              const set = touch((patch: Partial<typeof c>) => setTypes((x) => x.map((y, j) => (j === i ? { ...y, ...patch } : y))));
              return (
                <div key={c.id} className={cn("grid gap-2 px-5 py-3 md:items-center md:gap-3", TYPE_COLS, !c.active && "opacity-55")}>
                  <Input aria-label={t("settings.name")} placeholder={t("settings.name")} value={c.name} onChange={(e) => set({ name: e.target.value })} />
                  <Input
                    aria-label={t("settings.description")}
                    placeholder={t("settings.description")}
                    value={c.description}
                    onChange={(e) => set({ description: e.target.value })}
                    className="text-ink-2"
                  />
                  <div className="flex items-center justify-between gap-3 md:contents">
                    <div className="w-28 md:w-auto">
                      <NumberInput bare label={t("settings.multiplier")} suffix="×" step="0.05" value={c.multiplier} onChange={(v) => set({ multiplier: v })} />
                    </div>
                    <ActiveToggle active={c.active} onChange={(active) => set({ active })} label={t("settings.active")} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          title={t("settings.extras")}
          action={
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus className="size-4" />}
              onClick={touch(() => setAddons((x) => [...x, { id: newId(), name: "", kind: "hours", value: "0.5", active: true, sort: x.length }]))}
            >
              {t("common.add")}
            </Button>
          }
        >
          <div className="-mx-5 -my-5 divide-y divide-line">
            <RowHead cols={EXTRA_COLS} labels={[t("settings.name"), "", t("settings.value"), t("settings.active"), ""]} />
            {addons.map((a, i) => {
              const set = touch((patch: Partial<typeof a>) => setAddons((x) => x.map((y, j) => (j === i ? { ...y, ...patch } : y))));
              return (
                <div key={a.id} className={cn("grid gap-2 px-5 py-3 md:items-center md:gap-3", EXTRA_COLS, !a.active && "opacity-55")}>
                  <Input aria-label={t("settings.name")} placeholder={t("settings.name")} value={a.name} onChange={(e) => set({ name: e.target.value })} />
                  <div className="flex items-center gap-2 md:contents">
                    <Select aria-label={t("settings.value")} className="flex-1" value={a.kind} onChange={(e) => set({ kind: e.target.value as "hours" | "fixed" })}>
                      <option value="hours">{t("settings.kindHours")}</option>
                      <option value="fixed">{t("settings.kindFixed")}</option>
                    </Select>
                    <div className="w-28 md:w-auto">
                      <NumberInput
                        bare
                        label={t("settings.value")}
                        prefix={a.kind === "fixed" ? "$" : undefined}
                        suffix={a.kind === "hours" ? "h" : undefined}
                        step={a.kind === "fixed" ? "5" : "0.25"}
                        value={a.value}
                        onChange={(v) => set({ value: v })}
                      />
                    </div>
                    <ActiveToggle active={a.active} onChange={(active) => set({ active })} label={t("settings.active")} />
                    <DeleteButton
                      label={t("common.delete")}
                      onClick={touch(() => {
                        if (!a.id.startsWith("new-")) setDeletedAddons((d) => [...d, a.id]);
                        setAddons((x) => x.filter((_, j) => j !== i));
                      })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          title={t("settings.presets")}
          hint={t("settings.presetsHint")}
          action={
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus className="size-4" />}
              onClick={touch(() =>
                setPresets((x) => [
                  ...x,
                  { id: newId(), name: "", cleanTypeId: null, bedrooms: 3, bathrooms: 2, maxSqm: "", fixedPrice: "350", active: true },
                ]),
              )}
            >
              {t("common.add")}
            </Button>
          }
        >
          <div className="grid gap-3">
            {presets.map((p, i) => {
              const set = touch((patch: Partial<typeof p>) => setPresets((x) => x.map((y, j) => (j === i ? { ...y, ...patch } : y))));
              return (
                <div key={p.id} className={cn("grid gap-3 rounded-lg border border-line bg-canvas/50 p-3.5", !p.active && "opacity-55")}>
                  <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                    <Input aria-label={t("settings.name")} placeholder={t("settings.name")} value={p.name} onChange={(e) => set({ name: e.target.value })} />
                    <Select aria-label={t("settings.cleanTypes")} value={p.cleanTypeId ?? ""} onChange={(e) => set({ cleanTypeId: e.target.value || null })}>
                      <option value="">{t("settings.anyType")}</option>
                      {types
                        .filter((c) => !c.id.startsWith("new-"))
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                    <NumberInput label={t("cleaning.bedrooms")} step="1" value={String(p.bedrooms)} onChange={(v) => set({ bedrooms: Number(v) })} />
                    <NumberInput label={t("cleaning.bathrooms")} step="1" value={String(p.bathrooms)} onChange={(v) => set({ bathrooms: Number(v) })} />
                    <NumberInput label={t("settings.maxSqm")} suffix="m²" step="10" value={p.maxSqm} onChange={(v) => set({ maxSqm: v })} />
                    <NumberInput label={t("settings.fixedPrice")} prefix="$" step="5" value={p.fixedPrice} onChange={(v) => set({ fixedPrice: v })} />
                    <div className="col-span-2 flex items-center justify-end gap-1 sm:col-span-1">
                      <ActiveToggle active={p.active} onChange={(active) => set({ active })} label={t("settings.active")} />
                      <DeleteButton
                        label={t("common.delete")}
                        onClick={touch(() => {
                          if (!p.id.startsWith("new-")) setDeletedPresets((d) => [...d, p.id]);
                          setPresets((x) => x.filter((_, j) => j !== i));
                        })}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-8">
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold">{t("settings.tryIt")}</h2>
          <p className="mb-3 text-sm text-ink-2">{t("settings.tryItHint")}</p>
          <Chips
            options={types.filter((c) => c.name).map((c) => ({ value: c.id, label: c.name }))}
            value={sample.typeId}
            onChange={(typeId) => setSample((s) => ({ ...s, typeId }))}
          />
          <div className="mt-2 divide-y divide-line">
            <Stepper label={t("cleaning.bedrooms")} value={sample.bedrooms} max={10} onChange={(bedrooms) => setSample((s) => ({ ...s, bedrooms }))} />
            <Stepper label={t("cleaning.bathrooms")} value={sample.bathrooms} max={8} onChange={(bathrooms) => setSample((s) => ({ ...s, bathrooms }))} />
          </div>
          {preview && (
            <div className="mt-3 rounded-lg bg-surface-2 p-4">
              <p className="tabular text-[28px] font-semibold leading-tight">{formatMoney(preview.price)}</p>
              <p className="tabular text-sm text-ink-2">
                {preview.crew} × {formatHours(preview.hours)} · {t("cleaning.totalWork")} {formatHours(preview.labourHours)}
              </p>
              {preview.presetId && <p className="mt-1 text-sm font-medium text-accent-strong">{t("settings.presets")}</p>}
            </div>
          )}
        </Card>
      </aside>

      <div
        className={cn(
          "fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 flex justify-center px-4 transition lg:bottom-6 lg:left-60",
          dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-(--r-card) border border-line bg-surface py-2 pl-4 pr-2 text-ink shadow-lift">
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className="size-2 rounded-full bg-attention" aria-hidden />
            {t("settings.unsaved")}
          </span>
          <Button onClick={save} loading={pending}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActiveToggle({ active, onChange, label }: { active: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      onClick={() => onChange(!active)}
      className="inline-flex h-10 items-center justify-center rounded-(--r-control) px-1.5 focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span className={cn("relative h-6 w-10 rounded-full transition", active ? "bg-accent-strong" : "bg-line")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left]", active ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}

function DeleteButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-(--r-control) text-ink-2 transition hover:bg-danger-soft hover:text-danger focus-visible:outline-2 focus-visible:outline-accent"
    >
      <Trash2 className="size-[18px]" />
    </button>
  );
}

const TYPE_COLS = "md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_110px_56px]";
const EXTRA_COLS = "md:grid-cols-[minmax(0,1fr)_150px_110px_56px_40px]";

/** Column labels above a row list, from tablet up. */
function RowHead({ cols, labels }: { cols: string; labels: string[] }) {
  return (
    <div className={cn("hidden gap-3 bg-surface-2/60 px-5 py-2 text-xs font-medium text-ink-2 md:grid", cols)} aria-hidden>
      {labels.map((l, i) => (
        <span key={i}>{l}</span>
      ))}
    </div>
  );
}
