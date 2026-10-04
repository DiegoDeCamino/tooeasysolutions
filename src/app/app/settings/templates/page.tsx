import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/Display";
import { TemplatesEditor } from "./TemplatesEditor";

export const metadata = { title: "Stage templates" };

export default async function TemplatesPage() {
  await requireAdmin();
  const { t } = await getServerT();
  const supabase = await createClient();
  const { data } = await supabase.from("stage_templates").select("id, name, stages").order("sort");
  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <PageHeader title={t("settings.templates")} />
      <TemplatesEditor templates={data ?? []} />
    </div>
  );
}
