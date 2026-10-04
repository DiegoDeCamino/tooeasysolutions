"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function markAllRead() {
  const viewer = await requireStaff();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", viewer.userId)
    .is("read_at", null);
  revalidatePath("/app", "layout");
}
