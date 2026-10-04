import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signedUrls } from "@/lib/media";
import { ProjectView, type ProjectData } from "./ProjectView";

export const metadata = { title: "Project" };

const TABS = ["feed", "stages", "materials", "team", "money", "settings"] as const;

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { profile } = await requireStaff();
  const { id } = await params;
  const { tab: raw } = await searchParams;
  const isAdmin = profile.role === "admin";
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!project) notFound();

  const [{ data: stages }, { data: updates }, { data: members }, { data: time }, { data: materials }] = await Promise.all([
    supabase.from("project_stages").select("id, name, position, status").eq("project_id", id).order("position"),
    supabase
      .from("project_updates")
      .select("id, body, photo_paths, client_visible, stage_id, author_id, created_at, profiles(full_name)")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("project_members").select("profile_id, role, profiles(full_name, phone)").eq("project_id", id),
    supabase.from("time_entries").select("id, profile_id, work_date, hours, note, profiles!time_entries_profile_id_fkey(full_name)").eq("project_id", id).order("work_date", { ascending: false }),
    isAdmin
      ? createAdminClient().from("materials").select("id, name, qty, unit, status, est_cost").eq("project_id", id).order("created_at")
      : supabase.from("materials").select("id, name, qty, unit, status").eq("project_id", id).order("created_at"),
  ]);

  const myRole = members?.find((m) => m.profile_id === profile.id)?.role ?? null;
  const isSupervisor = myRole === "supervisor";

  let money: ProjectData["money"] = null;
  let staff: ProjectData["staff"] = [];
  if (isAdmin) {
    const admin = createAdminClient();
    const [{ data: fin }, { data: expenses }, { data: settings }, { data: people }] = await Promise.all([
      admin.from("project_financials").select("budget").eq("project_id", id).maybeSingle(),
      admin.from("expenses").select("id, amount, category, description, spent_on, receipt_path, profiles(full_name)").eq("project_id", id).order("spent_on", { ascending: false }),
      admin.from("settings").select("worker_hourly_rate").eq("id", 1).single(),
      admin.from("profiles").select("id, full_name, skills").eq("active", true).in("role", ["admin", "supervisor", "worker"]).order("full_name"),
    ]);
    const receipts = await signedUrls((expenses ?? []).map((e) => e.receipt_path));
    money = {
      budget: Number(fin?.budget ?? 0),
      workerRate: Number(settings?.worker_hourly_rate ?? 0),
      expenses: (expenses ?? []).map((e) => ({
        id: e.id,
        amount: Number(e.amount),
        category: e.category,
        description: e.description,
        spent_on: e.spent_on,
        by: (e.profiles as { full_name: string } | null)?.full_name ?? "",
        receiptUrl: e.receipt_path ? (receipts[e.receipt_path] ?? null) : null,
      })),
    };
    staff = (people ?? []).map((p) => ({ id: p.id, name: p.full_name, skills: p.skills }));
  }

  const photoUrls = await signedUrls((updates ?? []).flatMap((u) => u.photo_paths));
  const hoursBy = new Map<string, number>();
  for (const e of time ?? []) hoursBy.set(e.profile_id, (hoursBy.get(e.profile_id) ?? 0) + Number(e.hours));

  const data: ProjectData = {
    project: {
      id: project.id,
      token: project.token,
      title: project.title,
      category: project.category,
      description: project.description,
      address: project.address,
      client_name: project.client_name,
      client_email: project.client_email,
      client_phone: project.client_phone,
      status: project.status,
      start_date: project.start_date,
      due_date: project.due_date,
      share_budget: project.share_budget,
    },
    stages: stages ?? [],
    updates: (updates ?? []).map((u) => ({
      id: u.id,
      body: u.body,
      client_visible: u.client_visible,
      stage_id: u.stage_id,
      author_id: u.author_id,
      author: (u.profiles as { full_name: string } | null)?.full_name ?? "Too Easy",
      created_at: u.created_at,
      photos: u.photo_paths.map((p) => photoUrls[p]).filter(Boolean),
    })),
    materials: (materials ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      qty: Number(m.qty),
      unit: m.unit,
      status: m.status,
      est_cost: "est_cost" in m && m.est_cost !== null ? Number(m.est_cost) : null,
    })),
    members: (members ?? []).map((m) => ({
      id: m.profile_id,
      name: (m.profiles as { full_name: string } | null)?.full_name ?? "",
      phone: (m.profiles as { phone: string | null } | null)?.phone ?? null,
      role: m.role,
      hours: hoursBy.get(m.profile_id) ?? 0,
    })),
    time: (time ?? []).map((e) => ({
      id: e.id,
      name: (e.profiles as { full_name: string } | null)?.full_name ?? "",
      work_date: e.work_date,
      hours: Number(e.hours),
      note: e.note,
    })),
    money,
    staff,
    viewer: { id: profile.id, isAdmin, isSupervisor },
  };

  const tab = (TABS as readonly string[]).includes(raw ?? "") ? (raw as (typeof TABS)[number]) : "feed";
  return <ProjectView data={data} tab={(tab === "money" || tab === "settings") && !isAdmin ? "feed" : tab} siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""} />;
}
