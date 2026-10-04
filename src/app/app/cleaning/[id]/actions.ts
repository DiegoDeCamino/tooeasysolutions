"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, requireAdmin, type ActionResult } from "@/lib/auth";
import type { TablesUpdate } from "@/lib/supabase/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadBooking } from "@/lib/bookings/load";
import { canTransition, isEditable, nextStatus, type BookingAction } from "@/lib/bookings/status";
import { createCheckout } from "@/lib/payments";
import { emailLayout, notify, sendMail } from "@/lib/notify";
import { siteUrl } from "@/lib/env";
import { formatDate, formatDateLong, formatHours, formatMoney, formatTime, perthDateTime } from "@/lib/format";

const quoteSchema = z.object({
  final_price: z.coerce.number().min(0).max(100000),
  final_crew: z.coerce.number().int().min(1).max(20),
  final_hours: z.coerce.number().min(0.25).max(24),
  worker_brief: z.string().trim().max(2000),
  admin_note: z.string().trim().max(1000),
});
export type QuoteInput = z.input<typeof quoteSchema>;

function refresh(id: string, token?: string) {
  revalidatePath(`/app/cleaning/${id}`);
  revalidatePath("/app/cleaning");
  revalidatePath("/app", "layout");
  if (token) revalidatePath(`/b/${token}`);
}

export async function saveQuote(id: string, input: QuoteInput): Promise<ActionResult> {
  const viewer = await requireAdmin();
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return fail("Check the price, crew and hours");
  const booking = await loadBooking({ id });
  if (!booking) return fail("Booking not found");

  const admin = createAdminClient();
  const q = parsed.data;
  const patch = isEditable(booking.status)
    ? { ...q, worker_brief: q.worker_brief || null, admin_note: q.admin_note || null }
    : { worker_brief: q.worker_brief || null, admin_note: q.admin_note || null };
  const { error } = await admin.from("bookings").update(patch).eq("id", id);
  if (error) return fail(error.message);

  // Keep the published shift brief in sync.
  if (booking.status === "scheduled") await admin.from("shifts").update({ brief: q.worker_brief || null }).eq("booking_id", id);
  await admin.from("booking_events").insert({ booking_id: id, kind: "edited", actor_id: viewer.userId });
  refresh(id, booking.token);
  return ok();
}

export async function transition(id: string, action: BookingAction, opts: { reason?: string } = {}): Promise<ActionResult> {
  const viewer = await requireAdmin();
  const booking = await loadBooking({ id });
  if (!booking) return fail("Booking not found");
  if (!canTransition(booking.status, action)) return fail(`This booking is ${booking.status.replace("_", " ")}`);

  const admin = createAdminClient();
  const to = nextStatus(booking.status, action);
  const price = Number(booking.final_price ?? booking.est.price);
  const crew = booking.final_crew ?? booking.est.crew;
  const hours = Number(booking.final_hours ?? booking.est.hours);
  const link = siteUrl(`/b/${booking.token}`);
  const when = `${formatDateLong(booking.service_date)}, ${formatTime(booking.start_time)}`;
  const first = booking.client_name.split(" ")[0];
  const patch: TablesUpdate<"bookings"> = { status: to };
  let eventMessage: string | null = null;
  const emails: { subject: string; html: string }[] = [];
  const after_: (() => Promise<unknown>)[] = [];

  if (action === "confirm") {
    const checkout = await createCheckout({ id, ref: booking.ref, amount: price, email: booking.client_email });
    Object.assign(patch, { payment_status: "pending", payment_url: checkout?.url ?? null, payment_ref: checkout?.ref ?? null });
    eventMessage = `Confirmed at ${formatMoney(price)}`;
    emails.push({
      subject: `Your clean is confirmed: ${formatMoney(price)} (${booking.ref})`,
      html: emailLayout({
        heading: `Good news ${first}, we can do it`,
        intro: booking.admin_note ?? "Your booking is confirmed. Pay to lock in your spot and we'll assign the crew.",
        rows: [
          ["When", when],
          ["Service", booking.cleanTypeName],
          ["Crew", `${crew} × ${formatHours(hours)}`],
          ["Total", formatMoney(price)],
          ["Reference", booking.ref],
        ],
        cta: { label: checkout ? "Pay now" : "View your booking", url: checkout?.url ?? link },
        outro: checkout ? undefined : "We'll send payment details separately. Please use your reference when paying.",
      }),
    });
  }

  if (action === "decline") {
    patch.admin_note = opts.reason?.trim() || booking.admin_note;
    eventMessage = opts.reason?.trim() || null;
    emails.push({
      subject: `About your cleaning request (${booking.ref})`,
      html: emailLayout({
        heading: `Sorry ${first}, we can't take this one`,
        intro: opts.reason?.trim() || "Unfortunately we can't do this booking. Give us a call and we'll try to find another option.",
        cta: { label: "View your request", url: link },
      }),
    });
  }

  if (action === "mark_paid") {
    Object.assign(patch, { payment_status: "paid", paid_at: new Date().toISOString() });
    const { data: settings } = await admin.from("settings").select("worker_hourly_rate").eq("id", 1).single();
    const startsAt = perthDateTime(booking.service_date, booking.start_time);
    const endsAt = new Date(startsAt.getTime() + hours * 3600_000);
    const { data: shift, error } = await admin
      .from("shifts")
      .insert({
        booking_id: id,
        title: booking.cleanTypeName,
        suburb: booking.suburb,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        spots: crew,
        pay_rate: Number(settings?.worker_hourly_rate ?? 30),
        brief: booking.worker_brief,
        skill: "cleaning",
      })
      .select("id")
      .single();
    if (error || !shift) return fail(error?.message ?? "Could not create the shift");
    const access = [booking.parking && `Parking: ${booking.parking}`, booking.access_notes, booking.pets && "Pets at home"].filter(Boolean).join("\n");
    await admin.from("shift_details").insert({ shift_id: shift.id, address: `${booking.address}, ${booking.suburb}`, access_notes: access || null });
    eventMessage = "Paid. Shift published to the crew";
    after_.push(() =>
      notify(
        { skill: "cleaning" },
        {
          kind: "shift_new",
          title: `New shift: ${formatDate(booking.service_date)} ${formatTime(booking.start_time)}`,
          body: `${booking.cleanTypeName} in ${booking.suburb}. ${crew} ${crew === 1 ? "spot" : "spots"}, ${formatHours(hours)}.`,
          href: "/app/shifts",
        },
      ),
    );
    emails.push({
      subject: `You're booked in for ${formatDate(booking.service_date)} (${booking.ref})`,
      html: emailLayout({
        heading: "Payment received. You're booked in",
        intro: `${crew} ${crew === 1 ? "cleaner" : "cleaners"} will arrive ${when}.`,
        rows: [
          ["Where", `${booking.address}, ${booking.suburb}`],
          ["Service", booking.cleanTypeName],
          ["Paid", formatMoney(price)],
        ],
        cta: { label: "View your booking", url: link },
      }),
    });
  }

  if (action === "complete") {
    await admin.from("shifts").update({ status: "done" }).eq("booking_id", id);
    eventMessage = "Marked as completed";
  }

  if (action === "cancel") {
    const { data: shifts } = await admin.from("shifts").select("id, shift_signups(worker_id)").eq("booking_id", id);
    await admin.from("shifts").update({ status: "cancelled" }).eq("booking_id", id);
    const workerIds = (shifts ?? []).flatMap((s) => s.shift_signups.map((x) => x.worker_id));
    if (workerIds.length) {
      after_.push(() =>
        notify(
          { profileIds: workerIds },
          { kind: "shift_cancelled", title: `Shift cancelled: ${formatDate(booking.service_date)}`, body: `${booking.cleanTypeName} in ${booking.suburb}`, href: "/app/shifts" },
        ),
      );
    }
    eventMessage = opts.reason?.trim() || "Cancelled by admin";
    emails.push({
      subject: `Your booking ${booking.ref} was cancelled`,
      html: emailLayout({
        heading: "Your booking was cancelled",
        intro: opts.reason?.trim() || "Your booking has been cancelled. Give us a call if this doesn't look right.",
        cta: { label: "View booking", url: link },
      }),
    });
  }

  const { error } = await admin.from("bookings").update(patch).eq("id", id);
  if (error) return fail(error.message);
  await admin.from("booking_events").insert({ booking_id: id, kind: to, message: eventMessage, actor_id: viewer.userId });

  after(async () => {
    await Promise.all(emails.map((e) => sendMail({ to: booking.client_email, ...e })));
    for (const fn of after_) await fn();
  });

  refresh(id, booking.token);
  return ok();
}
