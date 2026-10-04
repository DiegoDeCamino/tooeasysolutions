import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** A usable invite (not revoked, expired or used up), or null. */
export async function loadInvite(token: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("invites").select("*").eq("token", token).maybeSingle();
  if (!data || data.revoked || data.uses >= data.max_uses || new Date(data.expires_at) < new Date()) return null;
  return data;
}
