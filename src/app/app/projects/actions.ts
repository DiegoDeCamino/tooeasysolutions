"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, requireAdmin, requireStaff, type ActionResult } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUploadTargets, pathsInScope, type UploadTarget } from "@/lib/media";
import { notify } from "@/lib/notify";

const uuid = z.uuid();
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function refresh(projectId?: string) {
  if (projectId) revalidatePath(`/app/projects/${projectId}`);
  revalidatePath("/app/projects");
  revalidatePath("/app");
}

/** Members and admins can upload project photos and receipts. RLS on projects proves access. */
export async function prepareProjectUploads(projectId: string, count: number, kind: "projects" | "receipts" = "projects"): Promise<ActionResult<UploadTarget[]>> {
  await requireStaff();
  if (!uuid.safeParse(projectId).success) return fail("Bad project");
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("id").eq("id", projectId).maybeSingle();
  if (!data) return fail("Project not found");
  try {
    return ok(await createUploadTargets(kind, projectId, count));
  } catch (e) {
    return fail((e as Error).message);
  }
}

// --- create ------------------------------------------------------------------

const createSchema = z.object({
  title: z.string().trim().min(2).max(120),
  category: z.string().max(40).nullable(),
  description: z.string().trim().max(3000),
  address: z.string().trim().max(200),
  client_name: z.string().trim().max(80),
  client_email: z.union([z.email(), z.literal("")]),
  client_phone: z.string().trim().max(30),
  start_date: z.union([dateStr, z.literal("")]),
  due_date: z.union([dateStr, z.literal("")]),
  templateId: z.union([uuid, z.literal("")]),
  budget: z.coerce.number().min(0).max(10_000_000),
  enquiryId: uuid.nullable(),
});

export async function createProject(input: z.input<typeof createSchema>): Promise<ActionResult<{ id: string }>> {
  const viewer = await requireAdmin();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fail("Check the project details");
  const p = parsed.data;
  const admin = createAdminClient();

  const { data: project, error } = await admin
    .from("projects")
    .insert({
      title: p.title,
      category: p.category,
      description: p.description || null,
      address: p.address || null,
      client_name: p.client_name || null,
      client_email: p.client_email || null,
      client_phone: p.client_phone || null,
      start_date: p.start_date || null,
      due_date: p.due_date || null,
      enquiry_id: p.enquiryId,
      status: "planning",
    })
    .select("id")
    .single();
  if (error || !project) return fail(error?.message ?? "Could not create project");

  await admin.from("project_financials").insert({ project_id: project.id, budget: p.budget });

  if (p.templateId) {
    const { data: tpl } = await admin.from("stage_templates").select("stages").eq("id", p.templateId).single();
    if (tpl?.stages.length) {
      await admin.from("project_stages").insert(tpl.stages.map((name, i) => ({ project_id: project.id, name, position: i })));
    }
  }

  if (p.enquiryId) {
    const { data: enq } = await admin.from("enquiries").select("description, photo_paths").eq("id", p.enquiryId).single();
    if (enq) {
      await admin.from("project_updates").insert({
        project_id: project.id,
        author_id: viewer.userId,
        body: `From the client's enquiry:\n${enq.description}`,
        photo_paths: enq.photo_paths,
        client_visible: false,
      });
      await admin.from("enquiries").update({ status: "converted", project_id: project.id }).eq("id", p.enquiryId);
    }
    revalidatePath("/app/projects/enquiries");
  }

  refresh(project.id);
  return ok({ id: project.id });
}

// --- feed ----------------------------------------------------------------------

const updateSchema = z.object({
  body: z.string().trim().max(4000),
  stageId: uuid.nullable(),
  clientVisible: z.boolean(),
  photoPaths: z.array(z.string()).max(10),
});

export async function postUpdate(projectId: string, input: z.input<typeof updateSchema>): Promise<ActionResult> {
  const viewer = await requireStaff();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return fail("Check your update");
  const photos = pathsInScope(parsed.data.photoPaths, "projects", projectId);
  if (!parsed.data.body && !photos.length) return fail("Add a photo or a note");

  const supabase = await createClient();
  const { error } = await supabase.from("project_updates").insert({
    project_id: projectId,
    author_id: viewer.userId,
    body: parsed.data.body,
    stage_id: parsed.data.stageId,
    client_visible: parsed.data.clientVisible,
    photo_paths: photos,
  });
  if (error) return fail(error.message);

  after(async () => {
    const admin = createAdminClient();
    const [{ data: project }, { data: members }] = await Promise.all([
      admin.from("projects").select("title").eq("id", projectId).single(),
      admin.from("project_members").select("profile_id").eq("project_id", projectId),
    ]);
    await notify(
      { roles: ["admin"], profileIds: (members ?? []).map((m) => m.profile_id), exclude: viewer.userId },
      {
        kind: "project_update",
        title: `${viewer.profile.full_name} posted on ${project?.title ?? "a project"}`,
        body: parsed.data.body.slice(0, 120) || `${photos.length} new ${photos.length === 1 ? "photo" : "photos"}`,
        href: `/app/projects/${projectId}`,
      },
    );
  });
  refresh(projectId);
  return ok();
}

export async function setUpdateVisibility(updateId: string, projectId: string, clientVisible: boolean): Promise<ActionResult> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("project_updates").update({ client_visible: clientVisible }).eq("id", updateId);
  if (error) return fail(error.message);
  refresh(projectId);
  return ok();
}

// --- stages --------------------------------------------------------------------

export async function setStageStatus(stageId: string, projectId: string, status: "todo" | "doing" | "done"): Promise<ActionResult> {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase.from("project_stages").update({ status }).eq("id", stageId).select("id");
  if (error) return fail(error.message);
  if (!data?.length) return fail("Only supervisors and admins can move stages");
  // First stage started moves the project from planning to active.
  if (status !== "todo") await createAdminClient().from("projects").update({ status: "active" }).eq("id", projectId).eq("status", "planning");
  refresh(projectId);
  return ok();
}

export async function addStage(projectId: string, name: string): Promise<ActionResult> {
  await requireAdmin();
  const clean = name.trim().slice(0, 80);
  if (!clean) return fail("Name the stage");
  const supabase = await createClient();
  const { data: last } = await supabase.from("project_stages").select("position").eq("project_id", projectId).order("position", { ascending: false }).limit(1);
  const { error } = await supabase.from("project_stages").insert({ project_id: projectId, name: clean, position: (last?.[0]?.position ?? -1) + 1 });
  if (error) return fail(error.message);
  refresh(projectId);
  return ok();
}

export async function removeStage(stageId: string, projectId: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("project_stages").delete().eq("id", stageId);
  refresh(projectId);
  return ok();
}

// --- hours, materials, expenses ---------------------------------------------------

const hoursSchema = z.object({
  date: dateStr,
  hours: z.coerce.number().min(0.25).max(24),
  note: z.string().trim().max(300),
  profileId: uuid.nullable(),
});

export async function logHours(projectId: string, input: z.input<typeof hoursSchema>): Promise<ActionResult> {
  const viewer = await requireStaff();
  const parsed = hoursSchema.safeParse(input);
  if (!parsed.success) return fail("Check the hours");
  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").insert({
    project_id: projectId,
    profile_id: parsed.data.profileId ?? viewer.userId,
    work_date: parsed.data.date,
    hours: parsed.data.hours,
    note: parsed.data.note || null,
    created_by: viewer.userId,
  });
  if (error) return fail(error.message.includes("row-level") ? "You can only log your own hours" : error.message);
  refresh(projectId);
  return ok();
}

const materialSchema = z.object({
  name: z.string().trim().min(1).max(120),
  qty: z.coerce.number().min(0).max(100000),
  unit: z.string().trim().min(1).max(20),
  estCost: z.coerce.number().min(0).max(1_000_000).nullable(),
});

export async function addMaterial(projectId: string, input: z.input<typeof materialSchema>): Promise<ActionResult> {
  const viewer = await requireStaff();
  const parsed = materialSchema.safeParse(input);
  if (!parsed.success) return fail("Check the material");
  const m = parsed.data;
  // Estimated cost is admin-only money, so admins write through the service role.
  if (viewer.profile.role === "admin") {
    const { error } = await createAdminClient()
      .from("materials")
      .insert({ project_id: projectId, name: m.name, qty: m.qty, unit: m.unit, est_cost: m.estCost, created_by: viewer.userId });
    if (error) return fail(error.message);
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("materials").insert({ project_id: projectId, name: m.name, qty: m.qty, unit: m.unit, created_by: viewer.userId });
    if (error) return fail(error.message);
  }
  refresh(projectId);
  return ok();
}

export async function setMaterialStatus(id: string, projectId: string, status: "needed" | "bought" | "used"): Promise<ActionResult> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("materials").update({ status }).eq("id", id);
  if (error) return fail(error.message);
  refresh(projectId);
  return ok();
}

const expenseSchema = z.object({
  amount: z.coerce.number().min(0.01).max(1_000_000),
  category: z.enum(["materials", "labour", "equipment", "other"]),
  description: z.string().trim().max(300),
  spentOn: dateStr,
  receiptPath: z.string().nullable(),
});

export async function addExpense(projectId: string, input: z.input<typeof expenseSchema>): Promise<ActionResult> {
  const viewer = await requireStaff();
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return fail("Check the amount");
  const receipt = parsed.data.receiptPath ? (pathsInScope([parsed.data.receiptPath], "receipts", projectId)[0] ?? null) : null;
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    project_id: projectId,
    amount: parsed.data.amount,
    category: parsed.data.category,
    description: parsed.data.description,
    spent_on: parsed.data.spentOn,
    receipt_path: receipt,
    created_by: viewer.userId,
  });
  if (error) return fail(error.message.includes("row-level") ? "Only supervisors and admins can add expenses" : error.message);
  refresh(projectId);
  return ok();
}

export async function deleteExpense(id: string, projectId: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id);
  refresh(projectId);
  return ok();
}

// --- admin settings ----------------------------------------------------------------

const settingsSchema = z.object({
  status: z.enum(["planning", "active", "on_hold", "completed"]),
  share_budget: z.boolean(),
  title: z.string().trim().min(2).max(120),
  address: z.string().trim().max(200),
  client_name: z.string().trim().max(80),
  client_email: z.string().trim().max(120),
  client_phone: z.string().trim().max(30),
  start_date: z.union([dateStr, z.literal("")]),
  due_date: z.union([dateStr, z.literal("")]),
});

export async function updateProject(projectId: string, input: z.input<typeof settingsSchema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail("Check the project details");
  const s = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      ...s,
      address: s.address || null,
      client_name: s.client_name || null,
      client_email: s.client_email || null,
      client_phone: s.client_phone || null,
      start_date: s.start_date || null,
      due_date: s.due_date || null,
    })
    .eq("id", projectId);
  if (error) return fail(error.message);
  refresh(projectId);
  return ok();
}

export async function setBudget(projectId: string, budget: number): Promise<ActionResult> {
  await requireAdmin();
  if (!(budget >= 0)) return fail("Check the budget");
  const supabase = await createClient();
  const { error } = await supabase.from("project_financials").upsert({ project_id: projectId, budget });
  if (error) return fail(error.message);
  refresh(projectId);
  return ok();
}

export async function addMember(projectId: string, profileId: string, role: "supervisor" | "worker"): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("project_members").upsert({ project_id: projectId, profile_id: profileId, role });
  if (error) return fail(error.message);
  after(async () => {
    const { data } = await createAdminClient().from("projects").select("title").eq("id", projectId).single();
    await notify({ profileIds: [profileId] }, { kind: "project_added", title: `You've been added to ${data?.title ?? "a project"}`, href: `/app/projects/${projectId}` });
  });
  refresh(projectId);
  return ok();
}

export async function removeMember(projectId: string, profileId: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("project_members").delete().eq("project_id", projectId).eq("profile_id", profileId);
  refresh(projectId);
  return ok();
}

// --- enquiries ------------------------------------------------------------------------

export async function setEnquiryStatus(id: string, status: "new" | "contacted" | "archived"): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/app/projects/enquiries");
  revalidatePath(`/app/projects/enquiries/${id}`);
  revalidatePath("/app", "layout");
  return ok();
}
