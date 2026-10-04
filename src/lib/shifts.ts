import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type ShiftView = {
  id: string;
  title: string;
  suburb: string;
  starts_at: string;
  ends_at: string;
  spots: number;
  pay_rate: number;
  brief: string | null;
  status: "open" | "full" | "done" | "cancelled";
  crew: { id: string; name: string }[];
  details: { address: string; access_notes: string | null } | null;
};

/** Upcoming shifts with crew names. Private details only come back where RLS allows. */
export async function loadShifts(
  client: SupabaseClient<Database>,
  opts: { from?: string; statuses?: ShiftView["status"][]; skill?: string[] } = {},
): Promise<ShiftView[]> {
  let q = client
    .from("shifts")
    .select("id, title, suburb, starts_at, ends_at, spots, pay_rate, brief, status, skill, shift_signups(worker_id, created_at, profiles(full_name)), shift_details(address, access_notes)")
    .gte("starts_at", opts.from ?? new Date(Date.now() - 6 * 3600_000).toISOString())
    .order("starts_at");
  if (opts.statuses) q = q.in("status", opts.statuses);
  if (opts.skill) q = q.in("skill", opts.skill);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => {
    const details = Array.isArray(s.shift_details) ? s.shift_details[0] : s.shift_details;
    return {
      id: s.id,
      title: s.title,
      suburb: s.suburb,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      spots: s.spots,
      pay_rate: Number(s.pay_rate),
      brief: s.brief,
      status: s.status,
      crew: [...s.shift_signups]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((x) => ({ id: x.worker_id, name: (x.profiles as { full_name: string } | null)?.full_name ?? "Crew" })),
      details: details ?? null,
    };
  });
}

export function shiftHours(s: Pick<ShiftView, "starts_at" | "ends_at">) {
  return (new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime()) / 3600_000;
}
