import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadPricing } from "@/lib/pricing/load";
import { getServerT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/Display";
import { PricingEditor } from "./PricingEditor";

export const metadata = { title: "Pricing" };

export default async function PricingPage() {
  await requireAdmin();
  const { t } = await getServerT();
  const supabase = await createClient();
  const pricing = await loadPricing(supabase);
  return (
    <div className="grid gap-6">
      <PageHeader title={t("settings.pricing")} />
      <PricingEditor initial={pricing} />
    </div>
  );
}
