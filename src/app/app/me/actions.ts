"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff, fail, ok, type ActionResult } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPush } from "@/lib/notify/push";

const subSchema = z.object({
  endpoint: z.url(),
  keys: z.object({ p256dh: z.string().min(10), auth: z.string().min(5) }),
});

export async function savePushSubscription(sub: unknown, userAgent: string): Promise<ActionResult> {
  const viewer = await requireStaff();
  const parsed = subSchema.safeParse(sub);
  if (!parsed.success) return fail("Invalid subscription");
  const supabase = await createClient();
  // An endpoint belongs to one device; re-subscribing on a shared device moves it to the current user.
  await supabase.from("push_subscriptions").delete().eq("endpoint", parsed.data.endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    profile_id: viewer.userId,
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
    user_agent: userAgent.slice(0, 200),
  });
  return error ? fail(error.message) : ok();
}

export async function removePushSubscription(endpoint: string): Promise<ActionResult> {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return ok();
}

export async function sendTestPush(): Promise<ActionResult> {
  const viewer = await requireStaff();
  await sendPush([viewer.userId], { title: "Too Easy", body: "Notifications are working.", href: "/app/me", tag: "test" });
  return ok();
}

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30),
});

export async function updateProfile(input: { full_name: string; phone: string }): Promise<ActionResult> {
  const viewer = await requireStaff();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fail("Please check your details");
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", viewer.userId);
  if (error) return fail(error.message);
  revalidatePath("/app", "layout");
  return ok();
}

export async function changePassword(password: string): Promise<ActionResult> {
  await requireStaff();
  if (password.length < 8) return fail("short");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  return error ? fail(error.message) : ok();
}
