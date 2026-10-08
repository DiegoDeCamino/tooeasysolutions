import Link from "next/link";
import { ChevronRight, Hammer, Inbox, Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import { loadProjectCards } from "@/lib/projects";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { AvatarStack, Badge, EmptyState, PageHeader, ProgressBar, type Tone } from "@/components/ui/Display";
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
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
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
          className="flex items-center gap-3 rounded-(--r-card) border border-line bg-surface px-4 py-3 shadow-soft transition-colors hover:bg-surface-2"
        >
          <span
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-lg",
              newEnquiries.count ? "bg-attention-soft text-attention" : "bg-surface-2 text-ink-2",
            )}
          >
            <Inbox className="size-4" />
          </span>
          <span className="flex-1 text-sm font-medium">{t("projects.enquiries")}</span>
          {!!newEnquiries.count && (
            <span className="tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-attention px-1.5 text-[11px] font-semibold text-attention-ink">
              {newEnquiries.count}
            </span>
          )}
          <ChevronRight className="size-4 text-ink-2" />
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
              className="group overflow-hidden rounded-(--r-card) border border-line bg-surface shadow-soft transition hover:border-ink-2/30"
            >
              <div className="relative aspect-[16/9] bg-surface-2">
                {p.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverUrl} alt="" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                ) : (
                  <div className="flex size-full items-center justify-center text-ink-2/60">
                    <Hammer className="size-8" />
                  </div>
                )}
              </div>
              <div className="grid gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid min-w-0 gap-0.5">
                    <span className="truncate font-medium">{p.title}</span>
                    <span className="truncate text-sm text-ink-2">{p.currentStage ?? t("projects.progress", { done: p.done, total: p.total })}</span>
                  </div>
                  <Badge tone={TONE[p.status]}>{t(`projectStatus.${p.status}`)}</Badge>
                </div>
                <ProgressBar value={p.total ? p.done / p.total : 0} label={`${p.done}/${p.total}`} />
                {(p.due_date || p.members.length > 0) && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-ink-2">{p.due_date && `${t("projects.due")} ${formatDate(p.due_date, locale)}`}</span>
                    {p.members.length > 0 && <AvatarStack names={p.members} size={24} />}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
