"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { fail, ok, requireAdmin, requireStaff, type ActionResult } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
import { formatInstantDate, formatInstantTime } from "@/lib/format";

type ClaimCode = "ok" | "full" | "closed" | "forbidden" | "already" | "not_signed_up";

function refresh() {
  revalidatePath("/app/shifts");
  revalidatePath("/app/cleaning/shifts");
  revalidatePath("/app", "layout");
}

async function describe(shiftId: string) {
  const { data } = await createAdminClient()
    .from("shifts")
    .select("suburb, starts_at, spots, booking_id, shift_signups(worker_id)")
    .eq("id", shiftId)
    .single();
  if (!data) return null;
  return {
    label: `${formatInstantDate(data.starts_at)} ${formatInstantTime(data.starts_at)} in ${data.suburb}`,
    fill: `${data.shift_signups.length}/${data.spots}`,
    bookingId: data.booking_id,
  };
}

export async function claimShift(shiftId: string): Promise<ActionResult<ClaimCode>> {
  const viewer = await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_shift", { p_shift: shiftId });
  if (error) return fail(error.message);
  const code = data as ClaimCode;
  if (code === "ok") {
    after(async () => {
      const d = await describe(shiftId);
      if (d)
        await notify(
          { roles: ["admin"], exclude: viewer.userId },
          { kind: "shift_claimed", title: `${viewer.profile.full_name} took ${d.label}`, body: `${d.fill} filled`, href: "/app/cleaning/shifts" },
        );
    });
  }
  refresh();
  return ok(code);
}

export async function leaveShift(shiftId: string): Promise<ActionResult<ClaimCode>> {
  const viewer = await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("leave_shift", { p_shift: shiftId });
  if (error) return fail(error.message);
  const code = data as ClaimCode;
  if (code === "ok") {
    after(async () => {
      const d = await describe(shiftId);
      if (d)
        await notify(
          { roles: ["admin"], exclude: viewer.userId },
          { kind: "shift_left", title: `${viewer.profile.full_name} left ${d.label}`, body: `${d.fill} filled`, href: "/app/cleaning/shifts" },
        );
    });
  }
  refresh();
  return ok(code);
}

async function syncStatus(shiftId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("shifts").select("spots, status, shift_signups(worker_id)").eq("id", shiftId).single();
  if (!data || data.status === "done" || data.status === "cancelled") return;
  const status = data.shift_signups.length >= data.spots ? "full" : "open";
  if (status !== data.status) await admin.from("shifts").update({ status }).eq("id", shiftId);
}

export async function adminAddWorker(shiftId: string, workerId: string): Promise<ActionResult> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("shift_signups").upsert({ shift_id: shiftId, worker_id: workerId });
  if (error) return fail(error.message);
  await syncStatus(shiftId);
  after(async () => {
    const d = await describe(shiftId);
    if (d) await notify({ profileIds: [workerId] }, { kind: "shift_assigned", title: `You're on ${d.label}`, href: "/app/shifts?tab=mine" });
  });
  refresh();
  return ok();
}

export async function adminRemoveWorker(shiftId: string, workerId: string): Promise<ActionResult> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("shift_signups").delete().eq("shift_id", shiftId).eq("worker_id", workerId);
  if (error) return fail(error.message);
  await syncStatus(shiftId);
  refresh();
  return ok();
}
