import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Estimate, Suggestion } from "@/lib/pricing/types";
import type { Tables } from "@/lib/supabase/types";

export type BookingRow = Tables<"bookings">;
export type BookingView = BookingRow & {
  cleanTypeName: string;
  addonNames: string[];
  est: Estimate;
  sugg: (Suggestion & { hours?: number }) | null;
};

/** Load a booking with its clean type and add-on names. Service role: callers must authorise. */
export async function loadBooking(by: { token: string } | { id: string }): Promise<BookingView | null> {
  const admin = createAdminClient();
  const query = admin.from("bookings").select("*, clean_types(name)");
  const { data } = "token" in by ? await query.eq("token", by.token).maybeSingle() : await query.eq("id", by.id).maybeSingle();
  if (!data) return null;
  const { data: addons } = data.addon_ids.length
    ? await admin.from("addons").select("id, name").in("id", data.addon_ids)
    : { data: [] as { id: string; name: string }[] };
  const { clean_types, ...row } = data as typeof data & { clean_types: { name: string } | null };
  return {
    ...row,
    cleanTypeName: clean_types?.name ?? "Clean",
    addonNames: (addons ?? []).map((a) => a.name),
    est: data.estimate as unknown as Estimate,
    sugg: (data.suggestion as unknown as BookingView["sugg"]) ?? null,
  };
}
