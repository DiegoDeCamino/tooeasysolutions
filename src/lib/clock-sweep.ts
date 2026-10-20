import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notify";
import { formatHours } from "@/lib/format";
import { AUTO_CLOSE_HOURS, REMIND_AFTER_HOURS } from "@/lib/clock";

/**
 * Nudge people who forgot to clock out, and close entries left open too long.
 * Each entry is claimed by an atomic update, so overlapping runs never notify twice.
 */
export async function sweepClocks() {
  const admin = createAdminClient();
  // Close first so an entry already past the limit is not also nudged.
  const { data: closed, error: closeError } = await admin.rpc("close_stale_clocks", { p_after_hours: AUTO_CLOSE_HOURS });
  if (closeError) throw new Error(closeError.message);
  const { data: reminded, error: remindError } = await admin.rpc("remind_open_clocks", { p_after_hours: REMIND_AFTER_HOURS });
  if (remindError) throw new Error(remindError.message);

  const entries = [...(closed ?? []), ...(reminded ?? [])];
  if (!entries.length) return { closed: 0, reminded: 0 };

  const projectIds = [...new Set(entries.map((e) => e.project_id))];
  const [{ data: projects }, { data: people }, { data: supervisors }] = await Promise.all([
    admin.from("projects").select("id, title").in("id", projectIds),
    admin.from("profiles").select("id, full_name").in("id", [...new Set(entries.map((e) => e.profile_id))]),
    admin.from("project_members").select("project_id, profile_id").eq("role", "supervisor").in("project_id", projectIds),
  ]);
  const title = (id: string) => projects?.find((p) => p.id === id)?.title ?? "the project";
  const name = (id: string) => people?.find((p) => p.id === id)?.full_name || "Someone";

  await Promise.all([
    ...(reminded ?? []).map((e) =>
      notify(
        { profileIds: [e.profile_id] },
        {
          kind: "clock_reminder",
          title: "Still clocked in?",
          body: `You've been on the clock at ${title(e.project_id)} for ${formatHours(REMIND_AFTER_HOURS)}. Clock out when you finish.`,
          href: `/app/projects/${e.project_id}`,
        },
      ),
    ),
    ...(closed ?? []).map((e) =>
      notify(
        {
          roles: ["admin"],
          profileIds: [e.profile_id, ...(supervisors ?? []).filter((s) => s.project_id === e.project_id).map((s) => s.profile_id)],
        },
        {
          kind: "clock_auto_closed",
          title: `${name(e.profile_id)}'s day was closed after ${formatHours(AUTO_CLOSE_HOURS)}`,
          body: `${title(e.project_id)}: nobody clocked out. Check the real finish time.`,
          href: `/app/projects/${e.project_id}?tab=team`,
        },
      ),
    ),
  ]);
  return { closed: closed?.length ?? 0, reminded: reminded?.length ?? 0 };
}
