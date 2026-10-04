"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";

export type LoginState = { error?: "invalid" | "noAccess"; resetSent?: boolean } | null;

const credentials = z.object({ email: z.email(), password: z.string().min(1) });

function safeNext(next: unknown) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export async function signIn(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "invalid" };

  const { data: profile } = await supabase.from("profiles").select("role, active").eq("id", data.user.id).single();
  if (!profile?.active) {
    await supabase.auth.signOut();
    return { error: "noAccess" };
  }
  const next = safeNext(form.get("next"));
  if (profile.role === "client") redirect(next?.startsWith("/app") ? "/account" : (next ?? "/account"));
  redirect(next ?? "/app");
}

export async function requestReset(_: LoginState, form: FormData): Promise<LoginState> {
  const email = z.email().safeParse(form.get("email"));
  if (email.success) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: siteUrl("/auth/callback?next=/reset-password"),
    });
  }
  // Same answer either way so the form can't be used to probe for accounts.
  return { resetSent: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
