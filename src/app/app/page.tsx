import { requireStaff } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/Display";

export default async function AppHome() {
  const { profile } = await requireStaff();
  const { t } = await getServerT();
  return <PageHeader title={t("home.morning", { name: profile.full_name })} />;
}
