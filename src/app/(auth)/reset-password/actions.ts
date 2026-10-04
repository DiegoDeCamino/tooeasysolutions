"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(_: { error?: string } | null, form: FormData) {
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "short" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "failed" };
  redirect("/app");
}
