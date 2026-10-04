import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Home, MapPin, Phone, Sparkles, Users } from "lucide-react";
import { loadBooking } from "@/lib/bookings/load";
import { getViewer } from "@/lib/auth";
import { CLIENT_STEPS } from "@/lib/bookings/status";
import { formatDateLong, formatHours, formatMoney, formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ClientActions, AccountCard } from "./ClientActions";

export const metadata: Metadata = { title: "Your booking | Too Easy Solutions", robots: { index: false } };
export const dynamic = "force-dynamic";

const STEP_LABEL: Record<string, string> = {
  requested: "Requested",
  awaiting_payment: "Confirmed",
  scheduled: "Paid",
  completed: "Done",
};

export default async function ClientBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await loadBooking({ token });
  if (!booking) notFound();
  const viewer = await getViewer();

  const current = CLIENT_STEPS.indexOf(booking.status);
  const closed = booking.status === "declined" || booking.status === "cancelled";
  const price = Number(booking.final_price ?? booking.est.price);
  const crew = booking.final_crew ?? booking.est.crew;
  const hours = Number(booking.final_hours ?? booking.est.hours);
  const firstName = booking.client_name.split(" ")[0];

  const headline: Record<string, { title: string; body: string }> = {
    requested: {
      title: `Thanks ${firstName}, we're on it`,
      body: "We're checking the details and will confirm by email, usually within a few hours.",
    },
    awaiting_payment: {
      title: "Confirmed. One step to go",
      body: "Pay to lock in your spot. Your crew is assigned as soon as payment comes through.",
    },
    scheduled: {
      title: "You're booked in",
      body: `${crew} ${crew === 1 ? "cleaner" : "cleaners"} will arrive ${formatDateLong(booking.service_date)} at ${formatTime(booking.start_time)}.`,
    },
    completed: { title: "All done", body: "Thanks for choosing Too Easy. We hope the place feels great." },
    declined: { title: "We can't take this one", body: booking.admin_note || "Sorry, we can't do this booking. Please call us to find another option." },
    cancelled: { title: "Booking cancelled", body: "This booking was cancelled. You can book again any time." },
  };
  const h = headline[booking.status];

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <header className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink-2">
          <span>Booking</span>
          <span className="tabular rounded-full bg-surface px-3 py-1 text-ink shadow-soft">{booking.ref}</span>
        </div>
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">{h.title}</h1>
        <p className="max-w-[52ch] text-lg text-ink-2">{h.body}</p>
      </header>

      {!closed && (
        <ol className="grid grid-cols-4 gap-2" aria-label="Booking progress">
          {CLIENT_STEPS.map((s, i) => (
            <li key={s} className="grid gap-2">
              <span className={cn("h-1.5 rounded-full", i <= current ? "bg-accent-strong" : "bg-line")} />
              <span className={cn("text-[13px] font-extrabold", i === current ? "text-ink" : i < current ? "text-accent-strong" : "text-ink-2")}>
                {STEP_LABEL[s]}
              </span>
            </li>
          ))}
        </ol>
      )}

      {booking.status === "awaiting_payment" && (
        <section className="grid gap-4 rounded-2xl bg-ink p-6 text-canvas md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid gap-1">
            <span className="text-sm font-bold opacity-75">Total to pay</span>
            <span className="tabular text-4xl font-extrabold">{formatMoney(price)}</span>
            {booking.admin_note && <p className="mt-1 max-w-[50ch] text-[15px] opacity-85">{booking.admin_note}</p>}
          </div>
          {booking.payment_url ? (
            <a
              href={booking.payment_url}
              className="inline-flex h-[52px] items-center justify-center rounded-full bg-accent px-7 font-extrabold text-ink transition hover:brightness-110"
            >
              Pay now
            </a>
          ) : (
            <p className="max-w-[30ch] text-[15px] font-semibold opacity-85">
              We&apos;ll send payment details to {booking.client_email}. Use reference <strong>{booking.ref}</strong>.
            </p>
          )}
        </section>
      )}

      <section className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
        <Detail icon={CalendarDays} label="When">
          {formatDateLong(booking.service_date)}, {formatTime(booking.start_time)}
          {booking.flexible && <span className="block text-sm font-semibold text-ink-2">Flexible on the date</span>}
        </Detail>
        <Detail icon={MapPin} label="Where">
          {booking.address}, {booking.suburb}
        </Detail>
        <Detail icon={Sparkles} label="Service">
          {booking.cleanTypeName}
          {booking.addonNames.length > 0 && <span className="block text-sm font-semibold text-ink-2">Plus {booking.addonNames.join(", ")}</span>}
        </Detail>
        <Detail icon={Home} label="Home">
          {booking.bedrooms === 0 ? "Studio" : `${booking.bedrooms} bed`}, {booking.bathrooms} bath
          {booking.sqm ? `, ${booking.sqm} m²` : ""}
          {booking.pets ? ", pets" : ""}
        </Detail>
        <Detail icon={Users} label="Crew">
          {crew} {crew === 1 ? "cleaner" : "cleaners"} for about {formatHours(hours)}
        </Detail>
        <Detail icon={Sparkles} label={booking.status === "requested" ? "Estimate" : "Price"}>
          <span className="tabular">{formatMoney(price)}</span>
          {booking.status === "requested" && <span className="block text-sm font-semibold text-ink-2">Confirmed before you pay</span>}
        </Detail>
      </section>

      {booking.sugg && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-sm font-bold text-ink-2">Your suggestion</p>
          <p className="mt-1 font-bold">
            {booking.sugg.crew} {booking.sugg.crew === 1 ? "person" : "people"}
            {booking.sugg.hours ? ` for about ${formatHours(booking.sugg.hours)}` : ""}
          </p>
          <p className="mt-1 text-ink-2">&ldquo;{booking.sugg.reason}&rdquo;</p>
        </section>
      )}

      {!viewer && !booking.client_user_id && !closed && <AccountCard token={token} email={booking.client_email} />}

      <ClientActions token={token} canCancel={booking.status === "requested" || booking.status === "awaiting_payment"} />

      <p className="flex items-center gap-2 text-sm text-ink-2">
        <Phone className="size-4" /> Questions? Call or text 0432 689 687.
      </p>
    </div>
  );
}

function Detail({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 bg-surface p-5">
      <Icon className="mt-0.5 size-5 shrink-0 text-accent-strong" />
      <div className="grid gap-0.5">
        <span className="text-sm font-bold text-ink-2">{label}</span>
        <span className="font-extrabold text-ink">{children}</span>
      </div>
    </div>
  );
}
