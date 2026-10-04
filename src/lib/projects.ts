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
