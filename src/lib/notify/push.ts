import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { features } from "@/lib/env";

export type PushPayload = { title: string; body?: string; href?: string; tag?: string };

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:tooeasysolutionswa@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

/** Push to every device the given people have subscribed. Dead subscriptions are pruned. */
export async function sendPush(profileIds: string[], payload: PushPayload) {
  if (!features.push || !profileIds.length) return;
  configure();
  const admin = createAdminClient();
  const { data: subs } = await admin.from("push_subscriptions").select("*").in("profile_id", profileIds);
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), {
          TTL: 60 * 60 * 12,
        });
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await admin.from("push_subscriptions").delete().eq("id", s.id);
        else console.error("[push] failed", status, (err as Error).message);
      }
    }),
  );
}
