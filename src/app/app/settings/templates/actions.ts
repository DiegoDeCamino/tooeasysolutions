"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, requireAdmin, type ActionResult } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(60),
  stages: z.array(z.string().trim().min(1).max(80)).min(1).max(30),
});

export async function saveTemplate(input: z.input<typeof schema>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail("Give it a name and at least one stage");
  const supabase = await createClient();
  const { id, ...row } = parsed.data;
  const { error } = id ? await supabase.from("stage_templates").update(row).eq("id", id) : await supabase.from("stage_templates").insert({ ...row, sort: 99 });
  if (error) return fail(error.message);
  revalidatePath("/app/settings/templates");
  return ok();
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("stage_templates").delete().eq("id", id);
  revalidatePath("/app/settings/templates");
  return ok();
}
