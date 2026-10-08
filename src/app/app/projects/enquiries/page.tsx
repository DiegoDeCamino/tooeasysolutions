import Link from "next/link";
import { Camera, Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import { signedUrls } from "@/lib/media";
import { categoryLabel } from "@/lib/projects";
import { timeAgo } from "@/lib/format";
import { Badge, EmptyState, PageHeader, type Tone } from "@/components/ui/Display";
import { Segmented } from "@/components/ui/Segmented";

export const metadata = { title: "Enquiries" };

const TABS = { new: ["new"], contacted: ["contacted"], closed: ["converted", "archived"] } as const;
type Tab = keyof typeof TABS;
const TONE: Record<string, Tone> = { new: "attention", contacted: "accent", converted: "ok", archived: "neutral" };

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdmin();
  const { t, locale } = await getServerT();
  const { tab: raw } = await searchParams;
  const tab: Tab = raw && raw in TABS ? (raw as Tab) : "new";
  const supabase = await createClient();
  const [{ data: rows }, { data: all }] = await Promise.all([
    supabase.from("enquiries").select("*").in("status", [...TABS[tab]]).order("created_at", { ascending: false }),
    supabase.from("enquiries").select("status").in("status", ["new", "contacted"]),
  ]);
  const thumbs = await signedUrls((rows ?? []).flatMap((r) => r.photo_paths.slice(0, 3)));

  return (
    <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-5">
      <PageHeader back="/app/projects" title={t("projects.enquiries")} />
      <Segmented
        active={tab}
        items={[
          { key: "new", label: t("enquiryStatus.new"), href: "?tab=new", count: (all ?? []).filter((r) => r.status === "new").length },
          { key: "contacted", label: t("enquiryStatus.contacted"), href: "?tab=contacted", count: (all ?? []).filter((r) => r.status === "contacted").length },
          { key: "closed", label: `${t("enquiryStatus.converted")} / ${t("enquiryStatus.archived")}`, href: "?tab=closed" },
        ]}
      />
      {!rows?.length ? (
        <EmptyState icon={<Inbox className="size-6" />} title={t("projects.noEnquiries")} />
      ) : (
        <div className="grid gap-3">
          {rows.map((e) => (
            <Link
              key={e.id}
              href={`/app/projects/enquiries/${e.id}`}
              className="grid gap-3 rounded-(--r-card) border border-line bg-surface p-4 shadow-soft transition hover:border-ink-2/30 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid min-w-0 gap-0.5">
                  <span className="truncate font-semibold">{e.name}</span>
                  <span className="text-sm text-ink-2">
                    {categoryLabel(e.category)}
                    {e.suburb ? `, ${e.suburb}` : ""} · {timeAgo(e.created_at, locale)}
                  </span>
                </div>
                <Badge tone={TONE[e.status]}>{t(`enquiryStatus.${e.status}`)}</Badge>
              </div>
              <p className="line-clamp-2 text-[15px] text-ink">{e.description}</p>
              {e.photo_paths.length > 0 && (
                <div className="flex gap-2">
                  {e.photo_paths.slice(0, 3).map((p) =>
                    thumbs[p] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p} src={thumbs[p]} alt="" className="size-20 rounded-xl object-cover" />
                    ) : null,
                  )}
                  {e.photo_paths.length > 3 && (
                    <span className="flex size-20 items-center justify-center gap-1 rounded-xl bg-surface-2 text-sm font-semibold text-ink-2">
                      <Camera className="size-4" />+{e.photo_paths.length - 3}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
