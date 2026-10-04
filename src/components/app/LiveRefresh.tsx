"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

/** Re-render server data when any of the given tables change (Realtime, RLS-filtered). */
export function LiveRefresh({ tables, channel }: { tables: string[]; channel: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createBrowserClient();
    let timer: number | undefined;
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => router.refresh(), 250);
    };
    let ch = supabase.channel(channel);
    for (const table of tables) ch = ch.on("postgres_changes", { event: "*", schema: "public", table }, bump);
    ch.subscribe();
    return () => {
      window.clearTimeout(timer);
      supabase.removeChannel(ch);
    };
  }, [router, channel, tables]);
  return null;
}
