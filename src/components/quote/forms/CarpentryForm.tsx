"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import TurnstileWidget from "../../shared/TurnstileWidget";
import { cn } from "@/lib/cn";

const JOB_TYPES = [
  "Deck",
  "Pergola or veranda",
  "Shed or carport",
  "Patio roof",
  "Screen or fencing",
  "Custom timber piece",
  "Kitchen or laundry",
  "Something else",
] as const;

const TIMEFRAMES = ["As soon as possible", "In the next 1-3 months", "Later this year", "Just getting ideas"] as const;

export default function CarpentryForm() {
  const [jobs, setJobs] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [suburb, setSuburb] = useState("");
  const [timeframe, setTimeframe] = useState<string>(TIMEFRAMES[1]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const toggle = (job: string) =>
    setJobs((cur) => (cur.includes(job) ? cur.filter((j) => j !== job) : [...cur, job]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!details.trim()) {
      setError("Tell us a little about the job so we can come back with a plan.");
      return;
    }
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Add your name and a valid email so we can reply.");
      return;
    }
    setState("sending");
    const resp = await fetch("/api/quote/carpentry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobs, details, suburb, timeframe, name, email, phone, token }),
    }).catch(() => null);
    if (resp?.ok) {
      setState("sent");
    } else {
      setState("error");
      setError("We couldn't send that. Please try again, or call us on 0432 689 687.");
    }
  };

  if (state === "sent") {
    return (
      <div className="grid justify-items-start gap-3 rounded-2xl bg-ok-soft p-6 text-ink" role="status">
        <CheckCircle2 className="size-8 text-ok" />
        <p className="font-display text-xl font-bold">Thanks {name.split(" ")[0] || "for that"}, we&apos;ve got it.</p>
        <p className="text-ink-2">
          Diego will be in touch to talk it through. If you have photos of the space, have them handy, they help us
          plan.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="site-form grid gap-5" noValidate>
      <fieldset className="grid gap-2.5">
        <legend className="mb-2.5 text-sm font-bold">What are you thinking of building?</legend>
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map((job) => {
            const on = jobs.includes(job);
            return (
              <button
                key={job}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(job)}
                className={cn(
                  "h-10 rounded-full border px-4 text-sm font-bold transition active:scale-[0.98]",
                  on ? "border-accent-strong bg-accent-strong text-white" : "border-line bg-surface text-ink hover:border-ink-2",
                )}
              >
                {job}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-2">
        <label htmlFor="cp-details" className="text-sm font-bold">
          Tell us about the job *
        </label>
        <textarea
          id="cp-details"
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Rough size, materials you like, anything that's there now"
          aria-invalid={Boolean(error && !details.trim())}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="cp-suburb" className="text-sm font-bold">
            Suburb or address
          </label>
          <input id="cp-suburb" value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="e.g. Cowaramup" />
        </div>
        <div className="grid gap-2">
          <label htmlFor="cp-when" className="text-sm font-bold">
            When would you like it done?
          </label>
          <select id="cp-when" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            {TIMEFRAMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <label htmlFor="cp-name" className="text-sm font-bold">
            Name *
          </label>
          <input id="cp-name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="cp-email" className="text-sm font-bold">
            Email *
          </label>
          <input
            id="cp-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="cp-phone" className="text-sm font-bold">
            Phone
          </label>
          <input id="cp-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <TurnstileWidget onVerify={(t) => setToken(t)} />

      {error && (
        <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-2">A real person reads every enquiry.</p>
        <button
          className="btn-primary"
          type="submit"
          disabled={state === "sending"}
        >
          {state === "sending" && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Send my enquiry
        </button>
      </div>
    </form>
  );
}
