"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Turnstile from "react-turnstile";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Building2,
  CalendarCheck2,
  Check,
  ChevronDown,
  KeyRound,
  PackageOpen,
  Sparkles,
  SprayCan,
  Users,
} from "lucide-react";
import { estimate } from "@/lib/pricing/estimate";
import type { PricingData } from "@/lib/pricing/load";
import { addDays, formatDate, formatHours, formatMoney, formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button, buttonClass } from "@/components/ui/Button";
import { Field, Input, Switch, Textarea } from "@/components/ui/Field";
import { Stepper } from "@/components/ui/Stepper";
import { Chips } from "@/components/ui/Chips";
import { createBooking } from "./actions";

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  regular: Sparkles,
  deep: SprayCan,
  end_of_lease: KeyRound,
  move_in: PackageOpen,
  airbnb: BedDouble,
  office: Building2,
};

const STEPS = ["Home", "Service", "When", "You"] as const;
const TIMES = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
const PARKING = ["Driveway", "Street parking", "Paid or limited"];

type SuggestKind = "more" | "fewer" | "within";

export function BookingWizard({ pricing, today, turnstileSiteKey }: { pricing: PricingData; today: string; turnstileSiteKey: string | null }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<{ token: string; ref: string } | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Service
  const [typeId, setTypeId] = useState(pricing.cleanTypes[0]?.id ?? "");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  // Home
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [levels, setLevels] = useState(1);
  const [sqm, setSqm] = useState(150);
  const [sqmKnown, setSqmKnown] = useState(false);
  const [pets, setPets] = useState(false);
  const [parking, setParking] = useState<string | null>(null);
  const [accessNotes, setAccessNotes] = useState("");
  // When
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [flexible, setFlexible] = useState(false);
  // You
  const [address, setAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestKind, setSuggestKind] = useState<SuggestKind>("more");
  const [suggestCrew, setSuggestCrew] = useState(3);
  const [suggestHours, setSuggestHours] = useState(3);
  const [suggestReason, setSuggestReason] = useState("");
  const [token, setToken] = useState<string | null>(null);

  const cleanType = pricing.cleanTypes.find((c) => c.id === typeId) ?? pricing.cleanTypes[0];
  const addons = pricing.addons.filter((a) => addonIds.includes(a.id));
  const home = { bedrooms, bathrooms, sqm: sqmKnown ? sqm : null, levels, pets };

  const est = useMemo(
    () => (cleanType ? estimate({ settings: pricing.settings, cleanType, addons, presets: pricing.presets, home }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pricing, typeId, addonIds, bedrooms, bathrooms, levels, sqm, sqmKnown, pets],
  );

  const suggestion =
    suggestOpen && est
      ? suggestKind === "within"
        ? { maxHours: suggestHours, reason: suggestReason }
        : { crew: suggestCrew, reason: suggestReason }
      : null;
  const suggested = useMemo(
    () =>
      suggestion && cleanType
        ? estimate({ settings: pricing.settings, cleanType, addons, presets: pricing.presets, home, crew: suggestion.crew, maxHours: suggestion.maxHours })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [suggestOpen, suggestKind, suggestCrew, suggestHours, est],
  );

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i + 1)), [today]);

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 2) {
      if (!date) e.date = "Pick a day";
      if (!time) e.time = "Pick a start time";
    }
    if (s === 3) {
      if (address.trim().length < 5) e.address = "Enter the street address";
      if (suburb.trim().length < 2) e.suburb = "Enter the suburb";
      if (name.trim().length < 2) e.name = "Enter your name";
      if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email";
      if (phone.trim().length < 6) e.phone = "Enter a phone number";
      if (suggestOpen && suggestReason.trim().length < 3) e.reason = "Tell us why";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const go = (to: number) => {
    if (to > step && !validate(step)) return;
    setDir(to > step ? 1 : -1);
    setStep(to);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const submit = () => {
    if (!validate(3) || !est) return;
    setFormError(null);
    start(async () => {
      const res = await createBooking({
        cleanTypeId: typeId,
        addonIds,
        bedrooms,
        bathrooms,
        levels,
        sqm: sqmKnown ? sqm : null,
        pets,
        parking,
        accessNotes,
        date,
        time,
        flexible,
        address,
        suburb,
        name,
        email,
        phone,
        notes,
        suggestion,
        token,
      });
      if (res.ok) {
        setDone(res.data);
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      } else {
        setFormError(res.error);
        if (res.fieldErrors) setErrors(res.fieldErrors);
      }
    });
  };

  if (done) return <Success ref_={done.ref} token={done.token} email={email} />;
  if (!cleanType || !est) return <p className="text-ink-2">Online booking is not available right now. Please call us on 0432 689 687.</p>;

  const isLast = step === STEPS.length - 1;
  const primary = isLast ? (
    <Button size="lg" onClick={submit} loading={pending} className="flex-1 md:flex-none">
      Request booking
    </Button>
  ) : (
    <Button size="lg" onClick={() => go(step + 1)} className="flex-1 md:flex-none">
      Continue <ArrowRight className="size-5" />
    </Button>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 pb-28 md:pb-0 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-6">
        <Progress step={step} onJump={(i) => i < step && go(i)} />

        <div className="relative">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -24 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="grid gap-6"
            >
              {step === 1 && (
                <>
                  <StepTitle title="What kind of clean?" />
                  <div role="radiogroup" aria-label="Clean type" className="grid gap-3 sm:grid-cols-2">
                    {pricing.cleanTypes.map((c) => {
                      const Icon = TYPE_ICONS[c.key] ?? Sparkles;
                      const selected = c.id === typeId;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setTypeId(c.id)}
                          className={cn(
                            "flex items-start gap-3 rounded-2xl border-2 bg-surface p-4 text-left transition active:scale-[0.99]",
                            selected ? "border-accent shadow-soft" : "border-line hover:border-ink-2/30",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-11 shrink-0 items-center justify-center rounded-xl",
                              selected ? "bg-accent-strong text-accent-ink" : "bg-surface-2 text-ink",
                            )}
                          >
                            <Icon className="size-5" />
                          </span>
                          <span className="grid gap-0.5">
                            <span className="font-extrabold text-ink">{c.name}</span>
                            <span className="text-sm leading-snug text-ink-2">{c.description}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {pricing.addons.length > 0 && (
                    <div className="grid gap-3">
                      <h3 className="text-lg font-extrabold">Anything extra?</h3>
                      <Chips
                        multiple
                        label="Extras"
                        value={addonIds}
                        onChange={setAddonIds}
                        options={pricing.addons.map((a) => ({
                          value: a.id,
                          label: (
                            <span>
                              {a.name}{" "}
                              <span className="font-semibold text-ink-2">
                                {a.kind === "fixed" ? `+${formatMoney(a.value)}` : `+${formatHours(a.value)}`}
                              </span>
                            </span>
                          ),
                        }))}
                      />
                    </div>
                  )}
                </>
              )}

              {step === 0 && (
                <>
                  <StepTitle title="Tell us about the place" />
                  <div className="divide-y divide-line rounded-2xl border border-line bg-surface px-4">
                    <Stepper label="Bedrooms" value={bedrooms} max={10} onChange={setBedrooms} format={(v) => (v === 0 ? "Studio" : v)} />
                    <Stepper label="Bathrooms" value={bathrooms} min={1} max={8} onChange={setBathrooms} />
                    <Stepper label="Levels" value={levels} min={1} max={4} onChange={setLevels} />
                  </div>
                  <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold">Floor area</span>
                      <span className="tabular text-lg font-extrabold">{sqmKnown ? `${sqm} m²` : "Not sure"}</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={600}
                      step={10}
                      value={sqm}
                      aria-label="Floor area in square metres"
                      onChange={(e) => {
                        setSqm(Number(e.target.value));
                        setSqmKnown(true);
                      }}
                      className={cn("h-11 w-full accent-[var(--accent-strong)]", !sqmKnown && "opacity-50")}
                    />
                    <Switch
                      checked={!sqmKnown}
                      onChange={(v) => setSqmKnown(!v)}
                      label="I'm not sure"
                      description="We'll estimate it from the number of bedrooms."
                    />
                  </div>
                  <div className="rounded-2xl border border-line bg-surface p-4">
                    <Switch checked={pets} onChange={setPets} label="Pets at home" description="Extra time for fur on floors and furniture." />
                  </div>
                  <div className="grid gap-3">
                    <h3 className="font-extrabold">Parking</h3>
                    <Chips label="Parking" value={parking} onChange={setParking} options={PARKING.map((p) => ({ value: p, label: p }))} />
                  </div>
                  <Field label="Access notes" optional="optional" hint="Gate codes, where the key is, alarm, anything we should know.">
                    {(p) => <Textarea {...p} rows={3} value={accessNotes} onChange={(e) => setAccessNotes(e.target.value)} />}
                  </Field>
                </>
              )}

              {step === 2 && (
                <>
                  <StepTitle title="When suits you?" />
                  <div className="grid gap-3">
                    <h3 className="font-extrabold">Day</h3>
                    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="Day">
                      {days.map((d, i) => {
                        const selected = d === date;
                        const [weekday, num, month] = formatDate(d).replace(",", "").split(" ");
                        return (
                          <button
                            key={d}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setDate(d)}
                            className={cn(
                              "flex h-[84px] w-[68px] shrink-0 flex-col items-center justify-center rounded-2xl border-2 transition active:scale-95",
                              selected ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-ink-2/30",
                            )}
                          >
                            <span className="text-xs font-extrabold uppercase text-ink-2">{i === 0 ? "Tmrw" : weekday}</span>
                            <span className="tabular text-2xl font-extrabold leading-tight">{num}</span>
                            <span className="text-xs font-bold text-ink-2">{month}</span>
                          </button>
                        );
                      })}
                    </div>
                    <label className="flex items-center gap-3 text-sm font-bold text-ink-2">
                      Another date
                      <input
                        type="date"
                        min={addDays(today, 1)}
                        max={addDays(today, 180)}
                        value={days.includes(date) ? "" : date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-11 rounded-xl border border-line bg-surface px-3 text-[16px] text-ink"
                      />
                    </label>
                    {errors.date && <p className="text-sm font-bold text-danger">{errors.date}</p>}
                  </div>
                  <div className="grid gap-3">
                    <h3 className="font-extrabold">Start time</h3>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Start time">
                      {TIMES.map((tm) => (
                        <button
                          key={tm}
                          type="button"
                          role="radio"
                          aria-checked={tm === time}
                          onClick={() => setTime(tm)}
                          className={cn(
                            "tabular h-12 rounded-full border-2 text-[15px] font-extrabold transition active:scale-95",
                            tm === time ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-ink-2/30",
                          )}
                        >
                          {formatTime(tm)}
                        </button>
                      ))}
                    </div>
                    {errors.time && <p className="text-sm font-bold text-danger">{errors.time}</p>}
                  </div>
                  <div className="rounded-2xl border border-line bg-surface p-4">
                    <Switch checked={flexible} onChange={setFlexible} label="I'm flexible" description="We may offer a nearby day or time if it helps the schedule." />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <StepTitle title="Where, and who do we talk to?" />
                  <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                    <Field label="Street address" error={errors.address}>
                      {(p) => <Input {...p} autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} />}
                    </Field>
                    <Field label="Suburb" error={errors.suburb}>
                      {(p) => <Input {...p} autoComplete="address-level2" value={suburb} onChange={(e) => setSuburb(e.target.value)} />}
                    </Field>
                  </div>
                  <Field label="Your name" error={errors.name}>
                    {(p) => <Input {...p} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Email" error={errors.email}>
                      {(p) => <Input {...p} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
                    </Field>
                    <Field label="Mobile" error={errors.phone}>
                      {(p) => <Input {...p} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />}
                    </Field>
                  </div>
                  <Field label="Anything else?" optional="optional">
                    {(p) => <Textarea {...p} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />}
                  </Field>

                  <SuggestPanel
                    open={suggestOpen}
                    setOpen={(v) => {
                      setSuggestOpen(v);
                      if (v && suggestKind === "more") setSuggestCrew(Math.min(8, est.crew + 1));
                    }}
                    kind={suggestKind}
                    setKind={(k) => {
                      setSuggestKind(k);
                      if (k === "more") setSuggestCrew(Math.min(8, est.crew + 1));
                      if (k === "fewer") setSuggestCrew(Math.max(1, est.crew - 1));
                      if (k === "within") setSuggestHours(Math.max(1, Math.floor(est.hours)));
                    }}
                    crew={suggestCrew}
                    setCrew={setSuggestCrew}
                    hours={suggestHours}
                    setHours={setSuggestHours}
                    reason={suggestReason}
                    setReason={setSuggestReason}
                    reasonError={errors.reason}
                    plan={{ crew: est.crew, hours: est.hours }}
                    idea={suggested ? { crew: suggested.crew, hours: suggested.hours } : null}
                  />

                  {turnstileSiteKey && <Turnstile sitekey={turnstileSiteKey} theme="light" onVerify={setToken} />}
                  {formError && (
                    <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 font-bold text-danger">
                      {formError}
                    </p>
                  )}
                  <p className="text-sm text-ink-2">
                    No payment now. We check every request and confirm the final price before you pay.
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="hidden items-center justify-between gap-3 md:flex">
          {step > 0 ? (
            <Button variant="ghost" size="lg" onClick={() => go(step - 1)}>
              <ArrowLeft className="size-5" /> Back
            </Button>
          ) : (
            <span />
          )}
          {primary}
        </div>
      </div>

      {/* Desktop estimate card */}
      <aside className="hidden lg:sticky lg:top-24 lg:block">
        <EstimateCard est={est} typeName={cleanType.name} date={date} time={time} />
      </aside>

      {/* Mobile and tablet bottom bar */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden">
        <AnimatePresence>
          {showBreakdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-4"
            >
              <Breakdown est={est} className="pt-4" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          {step > 0 && (
            <button
              type="button"
              aria-label="Back"
              onClick={() => go(step - 1)}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-line md:hidden"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowBreakdown((v) => !v)}
            aria-expanded={showBreakdown}
            className="grid min-w-0 flex-1 text-left"
          >
            <span className="flex items-center gap-1">
              <PriceTag value={est.price} className="text-2xl" />
              <ChevronDown className={cn("size-4 text-ink-2 transition", showBreakdown && "rotate-180")} />
            </span>
            <span className="tabular truncate text-[13px] font-bold text-ink-2">
              {est.crew} {est.crew === 1 ? "cleaner" : "cleaners"} × {formatHours(est.hours)}
            </span>
          </button>
          <div className="md:hidden">{primary}</div>
        </div>
      </div>
    </div>
  );
}

function StepTitle({ title }: { title: string }) {
  return <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>;
}

function Progress({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Booking progress">
      {STEPS.map((label, i) => (
        <li key={label}>
          <button
            type="button"
            onClick={() => onJump(i)}
            disabled={i >= step}
            aria-current={i === step ? "step" : undefined}
            className="grid w-full gap-2 text-left disabled:cursor-default"
          >
            <span className={cn("h-1.5 rounded-full transition-colors", i <= step ? "bg-accent-strong" : "bg-line")} />
            <span className={cn("text-[13px] font-extrabold", i === step ? "text-ink" : i < step ? "text-accent-strong" : "text-ink-2")}>
              {label}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function PriceTag({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      key={value}
      initial={reduce ? false : { y: 6, opacity: 0.4 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn("tabular inline-block font-extrabold text-ink", className)}
    >
      {formatMoney(value)}
    </motion.span>
  );
}

function Breakdown({ est, className }: { est: ReturnType<typeof estimate>; className?: string }) {
  return (
    <dl className={cn("grid gap-1.5 text-sm", className)}>
      {est.breakdown.map((l) => (
        <div key={l.label} className="flex justify-between gap-3">
          <dt className="text-ink-2">{l.label}</dt>
          <dd className="tabular font-bold text-ink">
            {l.amount !== undefined ? formatMoney(l.amount) : `+${formatHours(l.hours ?? 0)}`}
          </dd>
        </div>
      ))}
      <div className="mt-1 flex justify-between gap-3 border-t border-line pt-2">
        <dt className="font-bold text-ink">Total work</dt>
        <dd className="tabular font-extrabold text-ink">{formatHours(est.labourHours)}</dd>
      </div>
    </dl>
  );
}

function EstimateCard({
  est,
  typeName,
  date,
  time,
}: {
  est: ReturnType<typeof estimate>;
  typeName: string;
  date: string;
  time: string;
}) {
  return (
    <div className="grid gap-5 rounded-2xl border border-line bg-surface p-6 shadow-soft">
      <div className="grid gap-1">
        <span className="text-sm font-bold text-ink-2">Your estimate</span>
        <PriceTag value={est.price} className="text-5xl" />
        <span className="text-sm font-bold text-ink-2">{typeName}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-2 p-3">
          <Users className="mb-1 size-4 text-accent-strong" />
          <p className="tabular text-lg font-extrabold">
            {est.crew} {est.crew === 1 ? "cleaner" : "cleaners"}
          </p>
        </div>
        <div className="rounded-xl bg-surface-2 p-3">
          <CalendarCheck2 className="mb-1 size-4 text-accent-strong" />
          <p className="tabular text-lg font-extrabold">{formatHours(est.hours)}</p>
        </div>
      </div>
      {date && (
        <p className="text-sm font-bold text-ink">
          {formatDate(date)}
          {time && `, ${formatTime(time)}`}
        </p>
      )}
      <Breakdown est={est} />
      <p className="text-[13px] leading-relaxed text-ink-2">We confirm the final price with you before any payment.</p>
    </div>
  );
}

function SuggestPanel(props: {
  open: boolean;
  setOpen: (v: boolean) => void;
  kind: SuggestKind;
  setKind: (k: SuggestKind) => void;
  crew: number;
  setCrew: (v: number) => void;
  hours: number;
  setHours: (v: number) => void;
  reason: string;
  setReason: (v: string) => void;
  reasonError?: string;
  plan: { crew: number; hours: number };
  idea: { crew: number; hours: number } | null;
}) {
  const { open, setOpen, kind } = props;
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="p-4">
        <Switch
          checked={open}
          onChange={setOpen}
          label="Suggest a change"
          description="Need it done faster, or with a smaller team? Tell us and we'll take it into account."
        />
      </div>
      {open && (
        <div className="grid gap-4 border-t border-line p-4">
          <Chips<SuggestKind>
            value={kind}
            onChange={props.setKind}
            label="Change"
            options={[
              { value: "more", label: "More people, done sooner" },
              { value: "fewer", label: "Fewer people" },
              { value: "within", label: "Finish within a time" },
            ]}
          />
          {kind === "within" ? (
            <Stepper label="Done within" value={props.hours} min={1} max={10} step={0.5} onChange={props.setHours} format={(v) => formatHours(v)} />
          ) : (
            <Stepper label="People" value={props.crew} min={1} max={8} onChange={props.setCrew} />
          )}
          {props.idea && (
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-surface-2 p-3">
                <p className="text-xs font-extrabold uppercase text-ink-2">Our plan</p>
                <p className="tabular font-extrabold">
                  {props.plan.crew} × {formatHours(props.plan.hours)}
                </p>
              </div>
              <div className="rounded-xl bg-accent-soft p-3">
                <p className="text-xs font-extrabold uppercase text-accent-strong">Your idea</p>
                <p className="tabular font-extrabold">
                  {props.idea.crew} × {formatHours(props.idea.hours)}
                </p>
              </div>
              <p className="col-span-2 text-[13px] text-ink-2">Same total work, so the price stays the same.</p>
            </div>
          )}
          <Field label="Why?" error={props.reasonError}>
            {(p) => (
              <Textarea
                {...p}
                rows={2}
                placeholder="e.g. We hand the keys back at 1pm"
                value={props.reason}
                onChange={(e) => props.setReason(e.target.value)}
              />
            )}
          </Field>
        </div>
      )}
    </div>
  );
}

function Success({ ref_, token, email }: { ref_: string; token: string; email: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto grid max-w-lg justify-items-center gap-5 rounded-2xl border border-line bg-surface p-8 text-center shadow-soft"
    >
      <motion.span
        initial={reduce ? false : { scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="flex size-16 items-center justify-center rounded-full bg-accent-strong text-accent-ink"
      >
        <Check className="size-8" strokeWidth={3} />
      </motion.span>
      <div className="grid gap-2">
        <h2 className="text-3xl font-extrabold tracking-tight">Request sent</h2>
        <p className="text-ink-2">
          We&apos;ll check the details and confirm by email to <strong className="text-ink">{email}</strong>, usually within a few hours.
        </p>
      </div>
      <p className="tabular rounded-full bg-surface-2 px-4 py-2 font-extrabold">Reference {ref_}</p>
      <Link href={`/b/${token}`} className={buttonClass({ size: "lg" })}>
        Track your booking
      </Link>
    </motion.div>
  );
}
