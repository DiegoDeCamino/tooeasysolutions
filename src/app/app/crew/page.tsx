import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/Display";
import { CrewManager } from "./CrewManager";

export const metadata = { title: "Crew" };

export default async function CrewPage() {
  const { profile } = await requireAdmin();
  const { t } = await getServerT();
  const supabase = await createClient();
  const [{ data: people }, { data: invites }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone, role, skills, active").neq("role", "client").order("active", { ascending: false }).order("full_name"),
    supabase
      .from("invites")
      .select("id, token, role, skills, uses, max_uses, expires_at")
      .eq("revoked", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);
  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <PageHeader title={t("crew.title")} />
      <CrewManager
        me={profile.id}
        people={people ?? []}
        invites={(invites ?? []).filter((i) => i.uses < i.max_uses)}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
      />
    </div>
  );
}
