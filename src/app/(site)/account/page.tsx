import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { getViewer, isStaffRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { Badge, type Tone } from "@/components/ui/Display";
import { buttonClass } from "@/components/ui/Button";
import { signOut } from "@/app/(auth)/login/actions";

export const metadata: Metadata = { title: "Your bookings | Too Easy Solutions", robots: { index: false } };

const LABEL: Record<string, [string, Tone]> = {
  requested: ["Being checked", "attention"],
  awaiting_payment: ["Ready to pay", "attention"],
  scheduled: ["Booked", "accent"],
  completed: ["Done", "ok"],
  declined: ["Declined", "neutral"],
  cancelled: ["Cancelled", "neutral"],
};

export default async function AccountPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/account");
  if (isStaffRole(viewer.profile.role)) redirect("/app");
  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, token, ref, status, service_date, start_time, suburb, final_price, clean_types(name)")
    .order("service_date", { ascending: false });

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-4xl font-extrabold tracking-tight">Hi {viewer.profile.full_name.split(" ")[0] || "there"}</h1>
          <p className="text-ink-2">Your cleans with Too Easy.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/book/cleaning" className={buttonClass()}>
            Book a clean
          </Link>
          <form action={signOut}>
            <button type="submit" aria-label="Sign out" className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface">
              <LogOut className="size-5" />
            </button>
          </form>
        </div>
      </header>
      <div className="grid gap-3">
        {(bookings ?? []).map((b) => {
          const [label, tone] = LABEL[b.status];
          return (
            <Link
              key={b.id}
              href={`/b/${b.token}`}
              className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-soft transition hover:border-ink-2/30"
            >
              <div className="grid min-w-0 flex-1 gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold">{(b.clean_types as { name: string } | null)?.name ?? "Clean"}</span>
                  <Badge tone={tone}>{label}</Badge>
                </div>
                <span className="text-sm text-ink-2">
                  {formatDate(b.service_date)}, {formatTime(b.start_time)} in {b.suburb}
                </span>
              </div>
              <span className="tabular font-extrabold">{formatMoney(b.final_price)}</span>
              <ChevronRight className="size-5 text-ink-2" />
            </Link>
          );
        })}
        {!bookings?.length && <p className="text-ink-2">No bookings yet.</p>}
      </div>
    </div>
  );
}
