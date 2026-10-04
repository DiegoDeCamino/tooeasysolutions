import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { sendPush } from "./push";
import { businessInbox, sendMail } from "./email";

type Role = Database["public"]["Enums"]["app_role"];

export type Audience = {
  roles?: Role[];
  profileIds?: string[];
  /** Staff with this skill (any staff role). */
  skill?: "cleaning" | "carpentry";
  /** Don't notify the person who caused the event. */
  exclude?: string | null;
};

export type Message = { kind: string; title: string; body?: string; href?: string };

async function resolveRecipients(aud: Audience) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, email, role, skills")
    .eq("active", true)
    .neq("role", "client");
  return (data ?? []).filter(
    (p) =>
      p.id !== aud.exclude &&
      ((aud.roles?.includes(p.role) ?? false) ||
        (aud.profileIds?.includes(p.id) ?? false) ||
        (aud.skill ? p.skills.includes(aud.skill) : false)),
  );
}

/**
 * Fan an event out to the in-app inbox and push. Optionally email the admins.
 * Never throws: notifications must not break the action that triggered them.
 */
export async function notify(aud: Audience, msg: Message, opts: { emailAdmins?: { subject: string; html: string } } = {}) {
  try {
    const recipients = await resolveRecipients(aud);
    const ids = recipients.map((r) => r.id);
    if (ids.length) {
      await createAdminClient()
        .from("notifications")
        .insert(ids.map((id) => ({ profile_id: id, kind: msg.kind, title: msg.title, body: msg.body ?? null, href: msg.href ?? null })));
      await sendPush(ids, { title: msg.title, body: msg.body, href: msg.href, tag: msg.kind });
    }
    if (opts.emailAdmins) {
      const adminEmails = recipients.filter((r) => r.role === "admin").map((r) => r.email);
      const to = [...new Set([businessInbox(), ...adminEmails])];
      await Promise.all(to.map((address) => sendMail({ to: address, ...opts.emailAdmins! })));
    }
  } catch (err) {
    console.error("[notify] failed", err);
  }
}

export { sendMail } from "./email";
export { emailLayout, escapeHtml } from "./templates";
