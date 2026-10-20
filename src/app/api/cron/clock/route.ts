import { sweepClocks } from "@/lib/clock-sweep";

export const dynamic = "force-dynamic";

/**
 * Called every 15 minutes by pg_cron in Supabase. Needs no secret: it takes no input and
 * only acts on entries that are already due, so extra calls change nothing.
 */
export async function POST() {
  try {
    return Response.json(await sweepClocks());
  } catch (err) {
    console.error("[cron/clock] failed", err);
    return Response.json({ error: "sweep failed" }, { status: 500 });
  }
}
