"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loadBooking } from "@/lib/bookings/load";
import { canTransition, nextStatus } from "@/lib/bookings/status";
import { notify } from "@/lib/notify";
import { fail, ok, type ActionResult } from "@/lib/auth";

export async function cancelByClient(token: string): Promise<ActionResult> {
  const booking = await loadBooking({ token });
  if (!booking) return fail("Booking not found");
  if (booking.status === "scheduled") return fail("Your clean is already scheduled. Please call us to change it.");
  if (!canTransition(booking.status, "cancel")) return fail("This booking can't be cancelled");

  const admin = createAdminClient();
  await admin.from("bookings").update({ status: nextStatus(booking.status, "cancel") }).eq("id", booking.id);
  await admin.from("booking_events").insert({ booking_id: booking.id, kind: "cancelled", message: "Cancelled by the client" });
  after(() =>
    notify(
      { roles: ["admin"] },
      { kind: "booking_cancelled", title: `${booking.client_name} cancelled ${booking.ref}`, body: booking.suburb, href: `/app/cleaning/${booking.id}` },
    ),
  );
  revalidatePath(`/b/${token}`);
  return ok();
}

const accountSchema = z.object({ password: z.string().min(8, "At least 8 characters") });

/**
 * Optional account for clients: holding the private link proves access to the booking email,
 * so we create the account pre-confirmed and attach every booking made with that email.
 */
export async function createClientAccount(token: string, password: string): Promise<ActionResult<{ existing: boolean }>> {
  const parsed = accountSchema.safeParse({ password });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const booking = await loadBooking({ token });
  if (!booking) return fail("Booking not found");

  const admin = createAdminClient();
  const email = booking.client_email.toLowerCase();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: booking.client_name },
  });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) return ok({ existing: true });
    return fail("We couldn't create your account. Please try again.");
  }
  await admin.from("profiles").update({ full_name: booking.client_name, phone: booking.client_phone }).eq("id", created.user.id);
  await admin.from("bookings").update({ client_user_id: created.user.id }).eq("client_email", email);

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password });
  revalidatePath(`/b/${token}`);
  return ok({ existing: false });
}
