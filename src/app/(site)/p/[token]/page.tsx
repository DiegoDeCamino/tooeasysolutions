import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Phone } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { signedUrls } from "@/lib/media";
import { categoryLabel } from "@/lib/projects";
import { firstName, formatDate, formatMoney, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { PhotoGrid } from "@/components/ui/Photos";
import { ProgressRing } from "@/components/ui/Display";

export const metadata: Metadata = { title: "Your project | Too Easy Solutions", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Client portal. Only fields chosen here leave the server: no internal notes,
 * hours, crew surnames or money (unless share_budget is on).
 */
export default async function ProjectPortal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("id, title, category, status, start_date, due_date, share_budget, client_name")
    .eq("token", token)
    .maybeSingle();
  if (!project) notFound();

  const [{ data: stages }, { data: updates }, money] = await Promise.all([
    admin.from("project_stages").select("id, name, status, position").eq("project_id", project.id).order("position"),
    admin
      .from("project_updates")
      .select("id, body, photo_paths, created_at, stage_id, profiles(full_name)")
      .eq("project_id", project.id)
      .eq("client_visible", true)
      .order("created_at", { ascending: false }),
    project.share_budget
      ? Promise.all([
          admin.from("project_financials").select("budget").eq("project_id", project.id).maybeSingle(),
          admin.from("expenses").select("amount").eq("project_id", project.id),
        ])
      : Promise.resolve(null),
  ]);

  const urls = await signedUrls((updates ?? []).flatMap((u) => u.photo_paths));
  const list = stages ?? [];
  const done = list.filter((s) => s.status === "done").length;
  const current = list.find((s) => s.status === "doing") ?? list.find((s) => s.status === "todo");
  const cover = (updates ?? []).find((u) => u.photo_paths.length)?.photo_paths[0];
  const budget = money ? Number(money[0].data?.budget ?? 0) : 0;
  const spent = money ? (money[1].data ?? []).reduce((a, e) => a + Number(e.amount), 0) : 0;
  const stageName = (id: string | null) => list.find((s) => s.id === id)?.name;
  const statusLine: Record<string, string> = {
    planning: "Getting ready to start",
    active: current ? `Now working on: ${current.name}` : "In progress",
    on_hold: "Paused for now",
    completed: "Finished. Enjoy it!",
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-8">
      <header className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
        <div className="grid gap-3">
          <p className="text-sm font-bold text-ink-2">
            {project.client_name
              ? `Hi ${firstName(project.client_name)}, here's how your ${categoryLabel(project.category).toLowerCase() || "project"} is going`
              : "Project progress"}
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">{project.title}</h1>
          <div className="flex items-center gap-4 pt-2">
            <ProgressRing value={list.length ? done / list.length : 0} size={72} stroke={7} />
            <div className="grid gap-0.5">
              <span className="font-extrabold">{statusLine[project.status]}</span>
              <span className="tabular text-sm text-ink-2">
                {done} of {list.length} stages done
                {project.due_date && project.status !== "completed" ? `. Aiming to finish ${formatDate(project.due_date)}` : ""}
              </span>
            </div>
          </div>
        </div>
        {cover && urls[cover] && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lift">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urls[cover]} alt="Latest photo from site" className="absolute inset-0 size-full object-cover" />
          </div>
        )}
      </header>

      {list.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-2xl font-extrabold tracking-tight">The plan</h2>
          <ol className="grid gap-0">
            {list.map((s, i) => (
              <li key={s.id} className="grid grid-cols-[40px_1fr] gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full border-2 text-sm font-extrabold",
                      s.status === "done" && "border-accent-strong bg-accent-strong text-accent-ink",
                      s.status === "doing" && "border-accent-strong bg-surface text-accent-strong",
                      s.status === "todo" && "border-line bg-surface text-ink-2",
                    )}
                  >
                    {s.status === "done" ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                  </span>
                  {i < list.length - 1 && <span className={cn("w-0.5 flex-1", s.status === "done" ? "bg-accent-strong" : "bg-line")} />}
                </div>
                <div className="pb-5 pt-1.5">
                  <p className={cn("font-extrabold", s.status === "todo" && "text-ink-2")}>{s.name}</p>
                  {s.status === "doing" && <p className="text-sm font-bold text-accent-strong">In progress</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {money && budget > 0 && (
        <section className="grid gap-3 rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-lg font-extrabold">Budget</h2>
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-sm font-bold text-ink-2">Agreed</p>
              <p className="tabular text-2xl font-extrabold">{formatMoney(budget)}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-ink-2">Spent on materials and hire so far</p>
              <p className="tabular text-2xl font-extrabold">{formatMoney(Math.round(spent))}</p>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight">From site</h2>
        {!updates?.length && <p className="text-ink-2">Photos from the job will show up here as the work goes on.</p>}
        <div className="grid gap-4">
          {(updates ?? []).map((u) => (
            <article key={u.id} className="grid gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft md:p-5">
              <p className="text-sm font-bold text-ink-2">
                {firstName((u.profiles as { full_name: string } | null)?.full_name) || "Too Easy"}, {timeAgo(u.created_at)}
                {stageName(u.stage_id) && `. ${stageName(u.stage_id)}`}
              </p>
              {u.body && <p className="whitespace-pre-line text-[16px] leading-relaxed">{u.body}</p>}
              {u.photo_paths.length > 0 && <PhotoGrid urls={u.photo_paths.map((p) => urls[p]).filter(Boolean)} />}
            </article>
          ))}
        </div>
      </section>

      <p className="flex items-center gap-2 text-sm text-ink-2">
        <Phone className="size-4" /> Questions about the job? Call or text 0432 689 687.
      </p>
    </div>
  );
}
