import Link from "next/link";
import { Hammer, Inbox, Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import { loadProjectCards } from "@/lib/projects";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { AvatarStack, Badge, EmptyState, PageHeader, ProgressRing, type Tone } from "@/components/ui/Display";
import { ButtonLink } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";

export const metadata = { title: "Projects" };

const TONE: Record<string, Tone> = { planning: "neutral", active: "accent", on_hold: "attention", completed: "ok" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { profile } = await requireStaff();
  const { t, locale } = await getServerT();
  const isAdmin = profile.role === "admin";
  const { tab: raw } = await searchParams;
  const tab = raw === "done" ? "done" : "live";
  const supabase = await createClient();
  const [projects, newEnquiries] = await Promise.all([
    loadProjectCards(supabase, { status: tab === "done" ? ["completed"] : ["planning", "active", "on_hold"] }),
    isAdmin ? supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new") : Promise.resolve({ count: 0 }),
  ]);

  return (
    <div className="grid gap-5">
      <PageHeader
        title={t("projects.title")}
        actions={
          isAdmin && (
            <ButtonLink href="/app/projects/new" size="sm" icon={<Plus className="size-4" />}>
              <span className="hidden sm:inline">{t("projects.new")}</span>
            </ButtonLink>
          )
        }
      />
      {isAdmin && (
        <Link
          href="/app/projects/enquiries"
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-4 font-extrabold transition active:scale-[0.99]",
            newEnquiries.count ? "border-attention/30 bg-attention-soft" : "border-line bg-surface",
          )}
        >
          <Inbox className={cn("size-5", newEnquiries.count ? "text-attention" : "text-ink-2")} />
          <span className="flex-1">{t("projects.enquiries")}</span>
          {!!newEnquiries.count && <span className="tabular rounded-full bg-attention px-2.5 text-sm leading-6 text-white">{newEnquiries.count}</span>}
        </Link>
      )}
      <Segmented
        active={tab}
        items={[
          { key: "live", label: t("projectStatus.active"), href: "/app/projects" },
          { key: "done", label: t("projectStatus.completed"), href: "/app/projects?tab=done" },
        ]}
      />
      {projects.length === 0 ? (
        <EmptyState icon={<Hammer className="size-6" />} title={isAdmin ? t("projects.empty") : t("projects.emptyMine")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/app/projects/${p.id}`}
              className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-soft transition hover:border-ink-2/30 active:scale-[0.99]"
            >
              <div className="relative aspect-[16/9] bg-surface-2">
                {p.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverUrl} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                ) : (
                  <div className="flex size-full items-center justify-center text-ink-2">
                    <Hammer className="size-8" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 p-4">
                <div className="grid min-w-0 flex-1 gap-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-extrabold">{p.title}</span>
                  </div>
                  <span className="truncate text-sm text-ink-2">{p.currentStage ?? t("projects.progress", { done: p.done, total: p.total })}</span>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge tone={TONE[p.status]}>{t(`projectStatus.${p.status}`)}</Badge>
                    {p.due_date && <span className="text-xs font-bold text-ink-2">{t("projects.due")} {formatDate(p.due_date, locale)}</span>}
                    {p.members.length > 0 && <AvatarStack names={p.members} size={24} />}
                  </div>
                </div>
                <ProgressRing value={p.total ? p.done / p.total : 0} size={54} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
