import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { signedUrls } from "@/lib/media";

type Status = Database["public"]["Enums"]["project_status"];

export type ProjectCard = {
  id: string;
  title: string;
  category: string | null;
  client_name: string | null;
  status: Status;
  due_date: string | null;
  done: number;
  total: number;
  currentStage: string | null;
  members: string[];
  coverUrl: string | null;
};

/** Project list with stage progress. RLS decides which projects the viewer sees. */
export async function loadProjectCards(client: SupabaseClient<Database>, opts: { status?: Status[] } = {}): Promise<ProjectCard[]> {
  let q = client
    .from("projects")
    .select(
      "id, title, category, client_name, status, due_date, cover_path, created_at, project_stages(name, position, status), project_members(profiles(full_name)), project_updates(photo_paths, created_at)",
    )
    .order("created_at", { ascending: false });
  if (opts.status) q = q.in("status", opts.status);
  const { data } = await q;
  const rows = data ?? [];

  const covers = rows.map((p) => {
    if (p.cover_path) return p.cover_path;
    const withPhoto = [...p.project_updates].sort((a, b) => b.created_at.localeCompare(a.created_at)).find((u) => u.photo_paths.length);
    return withPhoto?.photo_paths[0] ?? null;
  });
  const urls = await signedUrls(covers);

  return rows.map((p, i) => {
    const stages = [...p.project_stages].sort((a, b) => a.position - b.position);
    const current = stages.find((s) => s.status === "doing") ?? stages.find((s) => s.status === "todo");
    return {
      id: p.id,
      title: p.title,
      category: p.category,
      client_name: p.client_name,
      status: p.status,
      due_date: p.due_date,
      done: stages.filter((s) => s.status === "done").length,
      total: stages.length,
      currentStage: current?.name ?? null,
      members: p.project_members.map((m) => (m.profiles as { full_name: string } | null)?.full_name ?? ""),
      coverUrl: covers[i] ? (urls[covers[i]!] ?? null) : null,
    };
  });
}

export const PROJECT_CATEGORIES = [
  { value: "deck", label: "Deck" },
  { value: "pergola", label: "Pergola or patio" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "fencing", label: "Fencing or screens" },
  { value: "repairs", label: "Repairs" },
  { value: "other", label: "Something else" },
] as const;

export function categoryLabel(value: string | null | undefined) {
  return PROJECT_CATEGORIES.find((c) => c.value === value)?.label ?? value ?? "";
}

export type OpenClock = { id: string; projectId: string; projectTitle: string; startedAt: string };

/** The person's running clock entry, if they are on site anywhere. */
export async function loadOpenClock(client: SupabaseClient<Database>, profileId: string): Promise<OpenClock | null> {
  const { data } = await client
    .from("time_entries")
    .select("id, project_id, started_at, projects(title)")
    .eq("profile_id", profileId)
    .not("started_at", "is", null)
    .is("ended_at", null)
    .maybeSingle();
  if (!data?.started_at) return null;
  return { id: data.id, projectId: data.project_id, projectTitle: data.projects?.title ?? "", startedAt: data.started_at };
}

export type MyEntry = {
  id: string;
  projectId: string;
  projectTitle: string;
  work_date: string;
  hours: number | null;
  note: string | null;
  started_at: string | null;
  ended_at: string | null;
  auto_closed: boolean;
};

/** The person's own time on every project between two Perth dates, inclusive. */
export async function loadMyHours(client: SupabaseClient<Database>, profileId: string, from: string, to: string): Promise<MyEntry[]> {
  const { data } = await client
    .from("time_entries")
    .select("id, project_id, work_date, hours, note, started_at, ended_at, auto_closed, projects(title)")
    .eq("profile_id", profileId)
    .gte("work_date", from)
    .lte("work_date", to)
    .order("work_date")
    .order("started_at", { nullsFirst: true });
  return (data ?? []).map(({ project_id, projects, hours, ...e }) => ({
    ...e,
    projectId: project_id,
    projectTitle: projects?.title ?? "",
    hours: hours === null ? null : Number(hours),
  }));
}

export type TodayTask ={ id: string; title: string; due_date: string; projectId: string; projectTitle: string };

/** Open tasks due today or earlier on the viewer's projects, for them or for anyone. */
export async function loadTodayTasks(client: SupabaseClient<Database>, profileId: string, today: string): Promise<TodayTask[]> {
  const { data } = await client
    .from("project_tasks")
    .select("id, title, due_date, project_id, created_at, projects(title)")
    .is("done_at", null)
    .lte("due_date", today)
    .or(`assignee_id.is.null,assignee_id.eq.${profileId}`)
    .order("due_date")
    .order("created_at")
    .limit(20);
  return (data ?? []).map((x) => ({ id: x.id, title: x.title, due_date: x.due_date!, projectId: x.project_id, projectTitle: x.projects?.title ?? "" }));
}
