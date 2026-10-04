import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadBooking } from "@/lib/bookings/load";
import { loadPricing } from "@/lib/pricing/load";
import { BookingAdmin } from "./BookingAdmin";

export const metadata = { title: "Booking" };

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const booking = await loadBooking({ id });
  if (!booking) notFound();

  const admin = createAdminClient();
  const [{ data: events }, pricing, { data: shift }] = await Promise.all([
    admin.from("booking_events").select("id, kind, message, created_at, profiles(full_name)").eq("booking_id", id).order("created_at"),
    loadPricing(admin),
    admin
      .from("shifts")
      .select("id, spots, status, shift_signups(worker_id, profiles(full_name))")
      .eq("booking_id", id)
      .neq("status", "cancelled")
      .maybeSingle(),
  ]);

  const cleanType = pricing.cleanTypes.find((c) => c.id === booking.clean_type_id);
  const addons = pricing.addons.filter((a) => booking.addon_ids.includes(a.id));

  return (
    <BookingAdmin
      booking={booking}
      engine={cleanType ? { settings: pricing.settings, cleanType, addons, presets: pricing.presets.filter((p) => p.active) } : null}
      events={(events ?? []).map((e) => ({
        id: e.id,
        kind: e.kind,
        message: e.message,
        at: e.created_at,
        actor: (e.profiles as { full_name: string } | null)?.full_name ?? null,
      }))}
      crewOnShift={
        shift
          ? {
              spots: shift.spots,
              names: shift.shift_signups.map((s) => (s.profiles as { full_name: string } | null)?.full_name ?? "Crew"),
            }
          : null
      }
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
    />
  );
}
