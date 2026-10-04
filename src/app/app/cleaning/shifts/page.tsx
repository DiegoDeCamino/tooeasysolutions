import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import { loadShifts } from "@/lib/shifts";
import { PageHeader } from "@/components/ui/Display";
import { LiveRefresh } from "@/components/app/LiveRefresh";
import { AdminShiftList } from "./AdminShiftList";

export const metadata = { title: "Shifts" };

const LIVE_TABLES = ["shifts", "shift_signups"];

export default async function AdminShiftsPage() {
  const { profile } = await requireAdmin();
  const { t } = await getServerT();
  const supabase = await createClient();
  const [shifts, { data: crew }] = await Promise.all([
    loadShifts(supabase, { statuses: ["open", "full"] }),
    supabase.from("profiles").select("id, full_name, skills").eq("active", true).neq("role", "client").order("full_name"),
  ]);
  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <LiveRefresh tables={LIVE_TABLES} channel="shifts-admin" />
      <PageHeader back="/app/cleaning" title={t("shifts.upcoming")} />
      <AdminShiftList
        shifts={shifts}
        viewer={{ id: profile.id, name: profile.full_name }}
        crew={(crew ?? []).filter((c) => c.skills.includes("cleaning")).map((c) => ({ id: c.id, name: c.full_name }))}
      />
    </div>
  );
}
