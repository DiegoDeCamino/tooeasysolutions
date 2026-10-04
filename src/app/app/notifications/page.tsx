import Link from "next/link";
import { BellOff, ChevronRight } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card, EmptyState, PageHeader } from "@/components/ui/Display";
import { markAllRead } from "./actions";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const viewer = await requireStaff();
  const { t, locale } = await getServerT();
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", viewer.userId)
    .order("created_at", { ascending: false })
    .limit(60);
  const unread = (items ?? []).some((n) => !n.read_at);

  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <PageHeader
        title={t("notifications.title")}
        actions={
          unread && (
            <form action={markAllRead}>
              <button type="submit" className="h-10 rounded-full px-4 text-sm font-extrabold text-accent-strong hover:bg-accent-soft">
                {t("notifications.markAll")}
              </button>
            </form>
          )
        }
      />
      {!items?.length ? (
        <EmptyState icon={<BellOff className="size-6" />} title={t("notifications.empty")} />
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {items.map((n) => {
            const body = (
              <>
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-attention")} aria-hidden />
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className={cn("text-[15px]", n.read_at ? "font-semibold text-ink-2" : "font-extrabold")}>{n.title}</span>
                  {n.body && <span className="truncate text-sm text-ink-2">{n.body}</span>}
                  <span className="text-xs font-semibold text-ink-2">{timeAgo(n.created_at, locale)}</span>
                </span>
                {n.href && <ChevronRight className="mt-1 size-5 shrink-0 text-ink-2" />}
              </>
            );
            return n.href ? (
              <Link key={n.id} href={n.href} className="flex gap-3 px-4 py-3.5 hover:bg-surface-2">
                {body}
              </Link>
            ) : (
              <div key={n.id} className="flex gap-3 px-4 py-3.5">
                {body}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
