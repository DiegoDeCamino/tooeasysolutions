"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/client";

/** Live unread counter. New notifications also pop a toast and refresh server data. */
export function NotificationsBell({
  profileId,
  initial,
  variant,
}: {
  profileId: string;
  initial: number;
  variant: "icon" | "count";
}) {
  const [unread, setUnread] = useState(initial);
  const toast = useToast();
  const router = useRouter();
  const { t } = useT();

  useEffect(() => setUnread(initial), [initial]);

  useEffect(() => {
    if (variant !== "icon") return; // one subscription per page is enough
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `profile_id=eq.${profileId}` },
        (payload) => {
          setUnread((n) => n + 1);
          const title = (payload.new as { title?: string }).title;
          if (title) toast(title);
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, variant, toast, router]);

  if (variant === "count") {
    return unread ? (
      <span className="tabular rounded-full bg-attention px-2 text-xs font-extrabold leading-5 text-white">{unread}</span>
    ) : null;
  }

  return (
    <Link
      href="/app/notifications"
      aria-label={`${t("nav.notifications")}${unread ? ` (${unread})` : ""}`}
      className="relative inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface-2"
    >
      <Bell className="size-[22px]" strokeWidth={2.2} />
      {unread > 0 && (
        <span className="tabular absolute right-1.5 top-1.5 min-w-[18px] rounded-full bg-attention px-1 text-center text-[10px] font-extrabold leading-[18px] text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
