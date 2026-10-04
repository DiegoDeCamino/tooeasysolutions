"use server";

import { after } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPricing } from "@/lib/pricing/load";
import { estimate } from "@/lib/pricing/estimate";
import { verifyTurnstile } from "@/lib/verifyTurnstile";
import { addDays, formatDateLong, formatHours, formatMoney, formatTime, todayPerth } from "@/lib/format";
import { siteUrl } from "@/lib/env";
import { emailLayout, notify, sendMail } from "@/lib/notify";
import { fail, ok, zodFieldErrors, type ActionResult } from "@/lib/auth";

const schema = z.object({
  cleanTypeId: z.uuid(),
  addonIds: z.array(z.uuid()).max(20),
  bedrooms: z.number().int().min(0).max(12),
  bathrooms: z.number().int().min(0).max(10),
  levels: z.number().int().min(1).max(5),
  sqm: z.number().int().min(10).max(5000).nullable(),
  pets: z.boolean(),
  parking: z.string().max(40).nullable(),
  accessNotes: z.string().trim().max(600),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
  flexible: z.boolean(),
  address: z.string().trim().min(5, "Enter the street address").max(200),
  suburb: z.string().trim().min(2, "Enter the suburb").max(80),
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email("Enter a valid email"),
  phone: z.string().trim().min(6, "Enter a phone number").max(30),
  notes: z.string().trim().max(1000),
  suggestion: z
    .object({
      crew: z.number().int().min(1).max(8).optional(),
      maxHours: z.number().min(1).max(12).optional(),
      reason: z.string().trim().min(3, "Tell us why").max(500),
    })
    .nullable(),
  token: z.string().nullable(),
});

export type BookingInput = z.infer<typeof schema>;

export async function createBooking(input: BookingInput): Promise<ActionResult<{ token: string; ref: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields", zodFieldErrors(parsed.error.issues));
  const b = parsed.data;

  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY && !(await verifyTurnstile(b.token))) {
    return fail("Please complete the security check");
  }

  const today = todayPerth();
  if (b.date < today || b.date > addDays(today, 180)) return fail("Pick a date in the next six months", { date: "Pick another date" });

  const admin = createAdminClient();
  const pricing = await loadPricing(admin, { activeOnly: true });
  const cleanType = pricing.cleanTypes.find((c) => c.id === b.cleanTypeId);
  if (!cleanType) return fail("That clean type is no longer available");
  const addons = pricing.addons.filter((a) => b.addonIds.includes(a.id));

  // Never trust a client-side price: recompute from current rules.
  const base = { settings: pricing.settings, cleanType, addons, presets: pricing.presets, home: { bedrooms: b.bedrooms, bathrooms: b.bathrooms, sqm: b.sqm, levels: b.levels, pets: b.pets } };
  const est = estimate(base);
  const suggested = b.suggestion ? estimate({ ...base, crew: b.suggestion.crew, maxHours: b.suggestion.maxHours }) : null;

  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      client_name: b.name,
      client_email: b.email.toLowerCase(),
      client_phone: b.phone,
      address: b.address,
      suburb: b.suburb,
      service_date: b.date,
      start_time: b.time,
      flexible: b.flexible,
      clean_type_id: cleanType.id,
      addon_ids: addons.map((a) => a.id),
      bedrooms: b.bedrooms,
      bathrooms: b.bathrooms,
      sqm: b.sqm,
      levels: b.levels,
      pets: b.pets,
      parking: b.parking,
      access_notes: b.accessNotes || null,
      notes: b.notes || null,
      estimate: est,
      suggestion: b.suggestion && suggested ? { ...b.suggestion, crew: suggested.crew, hours: suggested.hours } : null,
      final_price: est.price,
      final_crew: suggested?.crew ?? est.crew,
      final_hours: suggested?.hours ?? est.hours,
    })
    .select("id, token, ref")
    .single();
  if (error || !booking) {
    console.error("[booking] insert failed", error);
    return fail("We couldn't save your booking. Please try again.");
  }

  await admin.from("booking_events").insert({
    booking_id: booking.id,
    kind: "requested",
    message: b.suggestion ? `Client suggested: ${b.suggestion.reason}` : null,
  });

  const link = siteUrl(`/b/${booking.token}`);
  const when = `${formatDateLong(b.date)}, ${formatTime(b.time)}`;
  after(async () => {
    await notify(
      { roles: ["admin"] },
      {
        kind: "booking_requested",
        title: `New cleaning request in ${b.suburb}`,
        body: `${cleanType.name}, ${when}. ${formatMoney(est.price)}${b.suggestion ? ". Change suggested" : ""}`,
        href: `/app/cleaning/${booking.id}`,
      },
      {
        emailAdmins: {
          subject: `New cleaning request ${booking.ref} (${b.suburb})`,
          html: emailLayout({
            heading: "New cleaning request",
            intro: b.suggestion ? `The client suggested a change: "${b.suggestion.reason}"` : undefined,
            rows: [
              ["Client", `${b.name} (${b.phone})`],
              ["When", when],
              ["Where", `${b.address}, ${b.suburb}`],
              ["Service", cleanType.name],
              ["Home", `${b.bedrooms} bed, ${b.bathrooms} bath${b.sqm ? `, ${b.sqm} m²` : ""}`],
              ["Estimate", `${formatMoney(est.price)} (${est.crew} × ${formatHours(est.hours)})`],
            ],
            cta: { label: "Review booking", url: siteUrl(`/app/cleaning/${booking.id}`) },
          }),
        },
      },
    );
    await sendMail({
      to: b.email,
      subject: `We got your cleaning request (${booking.ref})`,
      html: emailLayout({
        heading: `Thanks ${b.name.split(" ")[0]}, we got your request`,
        intro: "We'll check the details and confirm your booking, usually within a few hours. You can follow it any time from the link below.",
        rows: [
          ["Reference", booking.ref],
          ["When", when],
          ["Service", cleanType.name],
          ["Estimated price", formatMoney(est.price)],
        ],
        cta: { label: "Track your booking", url: link },
      }),
    });
  });

  return ok({ token: booking.token, ref: booking.ref });
}
