"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, requireAdmin, type ActionResult } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const SKILLS = ["cleaning", "carpentry"] as const;

const inviteSchema = z.object({
  role: z.enum(["admin", "supervisor", "worker"]),
  skills: z.array(z.enum(SKILLS)).max(2),
  days: z.number().int().min(1).max(60),
  maxUses: z.number().int().min(1).max(100),
});

export async function createInvite(input: z.input<typeof inviteSchema>): Promise<ActionResult<{ token: string }>> {
  const viewer = await requireAdmin();
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return fail("Check the invite options");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invites")
    .insert({
      role: parsed.data.role,
      skills: parsed.data.skills,
      max_uses: parsed.data.maxUses,
      expires_at: new Date(Date.now() + parsed.data.days * 86400_000).toISOString(),
      created_by: viewer.userId,
    })
    .select("token")
    .single();
  if (error || !data) return fail(error?.message ?? "Could not create invite");
  revalidatePath("/app/crew");
  return ok({ token: data.token });
}

export async function revokeInvite(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("invites").update({ revoked: true }).eq("id", id);
  revalidatePath("/app/crew");
  return ok();
}

const memberSchema = z.object({
  role: z.enum(["admin", "supervisor", "worker"]),
  skills: z.array(z.enum(SKILLS)).max(2),
  active: z.boolean(),
});

/** Role, skills and active flag are protected columns: only changed here, with the service role. */
export async function updateMember(id: string, input: z.input<typeof memberSchema>): Promise<ActionResult> {
  const viewer = await requireAdmin();
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return fail("Check the member details");
  if (id === viewer.userId && (parsed.data.role !== "admin" || !parsed.data.active)) {
    return fail("You can't remove your own admin access");
  }
  const { error } = await createAdminClient().from("profiles").update(parsed.data).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/app/crew");
  return ok();
}
