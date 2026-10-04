import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/Display";
import { NewProjectForm } from "./NewProjectForm";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireAdmin();
  const { t } = await getServerT();
  const supabase = await createClient();
  const { data: templates } = await supabase.from("stage_templates").select("id, name, stages").order("sort");
  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <PageHeader back="/app/projects" title={t("projects.new")} />
      <NewProjectForm templates={templates ?? []} />
    </div>
  );
}
