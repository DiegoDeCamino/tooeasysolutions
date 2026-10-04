"use client";

import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let client: ReturnType<typeof createSsrBrowserClient<Database>> | null = null;

/** Browser client (singleton). Used for Realtime, RPCs and signed-URL uploads. */
export function createBrowserClient() {
  client ??= createSsrBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}
