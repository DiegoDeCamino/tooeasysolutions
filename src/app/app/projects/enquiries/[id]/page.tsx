import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signedUrls } from "@/lib/media";
import { EnquiryDetail } from "./EnquiryDetail";

export const metadata = { title: "Enquiry" };

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: enquiry }, { data: templates }] = await Promise.all([
    supabase.from("enquiries").select("*").eq("id", id).maybeSingle(),
    supabase.from("stage_templates").select("id, name, stages").order("sort"),
  ]);
  if (!enquiry) notFound();
  const urls = await signedUrls(enquiry.photo_paths);
  return (
    <EnquiryDetail
      enquiry={enquiry}
      photos={enquiry.photo_paths.map((p) => urls[p]).filter(Boolean)}
      templates={templates ?? []}
    />
  );
}
