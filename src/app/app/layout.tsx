import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";
import { ToastProvider } from "@/components/ui/Toast";
import { AppShell, type ShellCounts } from "@/components/app/AppShell";
import { getServerTheme, themeViewport } from "@/lib/theme.server";
import { uiFont } from "@/lib/fonts";

export const metadata: Metadata = {
  title: { default: "Too Easy Crew", template: "%s | Too Easy Crew" },
  manifest: "/manifest.webmanifest",
  icons: { apple: "/icons/apple-touch-icon.png", icon: "/icons/icon-192.png" },
};

export const generateViewport = themeViewport;

async function loadCounts(profileId: string, role: string, skills: string[]): Promise<ShellCounts> {
  const supabase = await createClient();
  const unread = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .is("read_at", null);

  if (role === "admin") {
    const [b, e, u] = await Promise.all([
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "requested"),
      supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
      unread,
    ]);
    return { newBookings: b.count ?? 0, newEnquiries: e.count ?? 0, openShifts: 0, unread: u.count ?? 0 };
  }

  const [shifts, u] = await Promise.all([
    skills.length
      ? supabase
          .from("shifts")
          .select("id, skill, shift_signups(worker_id)")
          .eq("status", "open")
          .gt("starts_at", new Date().toISOString())
          .in("skill", skills)
      : Promise.resolve({ data: [] as { id: string; shift_signups: { worker_id: string }[] }[] }),
    unread,
  ]);
  const openShifts = (shifts.data ?? []).filter((s) => !s.shift_signups.some((x) => x.worker_id === profileId)).length;
  return { newBookings: 0, newEnquiries: 0, openShifts, unread: u.count ?? 0 };
}

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireStaff();
  const { locale, dict } = await getServerT();
  const { profile } = viewer;
  const [counts, theme] = await Promise.all([loadCounts(profile.id, profile.role, profile.skills), getServerTheme()]);

  return (
    <I18nProvider locale={locale} dict={dict}>
      <div className={`app min-h-dvh ${uiFont.variable}`} data-theme={theme}>
        <ToastProvider>
          <AppShell
            role={profile.role as "admin" | "supervisor" | "worker"}
            name={profile.full_name || viewer.email}
            profileId={profile.id}
            counts={counts}
            theme={theme}
          >
            {children}
          </AppShell>
          <div id="sheet-root" />
        </ToastProvider>
      </div>
    </I18nProvider>
  );
}
