import { CalendarX2, ClipboardList } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import { loadShifts } from "@/lib/shifts";
import { EmptyState, PageHeader } from "@/components/ui/Display";
import { Segmented } from "@/components/ui/Segmented";
import { ShiftCard } from "@/components/app/ShiftCard";
import { LiveRefresh } from "@/components/app/LiveRefresh";

export const metadata = { title: "Shifts" };

const LIVE_TABLES = ["shifts", "shift_signups"];

export default async function ShiftsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { profile } = await requireStaff();
  const { t } = await getServerT();
  const { tab: raw } = await searchParams;
  const tab = raw === "mine" ? "mine" : "open";
  const supabase = await createClient();
  const shifts = await loadShifts(supabase, { statuses: ["open", "full"], skill: profile.role === "admin" ? undefined : profile.skills });

  const mine = shifts.filter((s) => s.crew.some((c) => c.id === profile.id));
  const open = shifts.filter((s) => s.status === "open" && !s.crew.some((c) => c.id === profile.id));
  const list = tab === "mine" ? mine : open;
  const viewer = { id: profile.id, name: profile.full_name };

  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <LiveRefresh tables={LIVE_TABLES} channel="shifts-board" />
      <PageHeader title={t("shifts.title")} />
      <Segmented
        active={tab}
        items={[
          { key: "open", label: t("shifts.open"), href: "/app/shifts", count: open.length },
          { key: "mine", label: t("shifts.mine"), href: "/app/shifts?tab=mine", count: mine.length },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState
          icon={tab === "open" ? <CalendarX2 className="size-6" /> : <ClipboardList className="size-6" />}
          title={tab === "open" ? t("shifts.noOpen") : t("shifts.noMine")}
        />
      ) : (
        <div className="grid gap-3">
          {list.map((s) => (
            <ShiftCard key={s.id} shift={s} viewer={viewer} />
          ))}
        </div>
      )}
    </div>
  );
}
