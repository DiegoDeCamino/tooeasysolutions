"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Hammer,
  Home,
  Inbox,
  LayoutGrid,
  ListChecks,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import type { TKey } from "@/lib/i18n";
import { Avatar } from "@/components/ui/Display";
import { NotificationsBell } from "./NotificationsBell";
import { ServiceWorker } from "./ServiceWorker";

type Role = "admin" | "supervisor" | "worker";
type NavItem = { href: string; label: TKey; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; badge?: number };

function navFor(role: Role, counts: ShellCounts) {
  if (role === "admin") {
    const mobile: NavItem[] = [
      { href: "/app", label: "nav.home", icon: Home },
      { href: "/app/cleaning", label: "nav.cleaning", icon: Sparkles, badge: counts.newBookings },
      { href: "/app/projects", label: "nav.projects", icon: Hammer, badge: counts.newEnquiries },
      { href: "/app/crew", label: "nav.crew", icon: Users },
      { href: "/app/more", label: "nav.more", icon: LayoutGrid },
    ];
    const desktop: NavItem[] = [
      { href: "/app", label: "nav.home", icon: Home },
      { href: "/app/cleaning", label: "nav.cleaning", icon: Sparkles, badge: counts.newBookings },
      { href: "/app/cleaning/calendar", label: "nav.calendar", icon: CalendarDays },
      { href: "/app/cleaning/shifts", label: "nav.shifts", icon: ClipboardList },
      { href: "/app/projects", label: "nav.projects", icon: Hammer },
      { href: "/app/projects/enquiries", label: "nav.enquiries", icon: Inbox, badge: counts.newEnquiries },
      { href: "/app/crew", label: "nav.crew", icon: Users },
      { href: "/app/settings/pricing", label: "nav.pricing", icon: SlidersHorizontal },
      { href: "/app/settings/templates", label: "nav.templates", icon: ListChecks },
    ];
    return { mobile, desktop };
  }
  const items: NavItem[] = [
    { href: "/app", label: "nav.home", icon: Home },
    { href: "/app/shifts", label: "nav.shifts", icon: ClipboardList, badge: counts.openShifts },
    { href: "/app/projects", label: "nav.projects", icon: Hammer },
    { href: "/app/me", label: "nav.me", icon: UserRound },
  ];
  return { mobile: items, desktop: items.filter((i) => i.href !== "/app/me") };
}

export type ShellCounts = { newBookings: number; newEnquiries: number; openShifts: number; unread: number };

function isActive(pathname: string, href: string, all: NavItem[]) {
  if (href === "/app") return pathname === "/app";
  if (!(pathname === href || pathname.startsWith(href + "/"))) return false;
  // Prefer the most specific matching item (e.g. /app/cleaning/calendar over /app/cleaning).
  return !all.some((o) => o.href !== href && o.href.startsWith(href + "/") && (pathname === o.href || pathname.startsWith(o.href + "/")));
}

export function AppShell({
  role,
  name,
  profileId,
  counts,
  children,
}: {
  role: Role;
  name: string;
  profileId: string;
  counts: ShellCounts;
  children: React.ReactNode;
}) {
  const { t } = useT();
  const pathname = usePathname();
  const { mobile, desktop } = navFor(role, counts);

  return (
    <div className="lg:flex">
      <ServiceWorker />
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/60 px-3 py-5 lg:flex">
        <Link href="/app" className="mb-6 flex items-center gap-2.5 px-3">
          <Image src="/icons/icon-192.png" alt="" width={36} height={36} className="rounded-xl" />
          <span className="text-lg font-extrabold tracking-tight">Too Easy</span>
        </Link>
        <nav className="grid gap-0.5">
          {desktop.map((item) => {
            const active = isActive(pathname, item.href, desktop);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-bold transition",
                  active ? "bg-accent-soft text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                <Icon className={cn("size-5", active && "text-accent-strong")} strokeWidth={2.2} />
                <span className="flex-1">{t(item.label)}</span>
                {!!item.badge && (
                  <span className="tabular rounded-full bg-attention px-2 text-xs font-extrabold leading-5 text-white">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto grid gap-1 border-t border-line pt-3">
          <Link
            href="/app/notifications"
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-bold text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            <Bell className="size-5" strokeWidth={2.2} />
            <span className="flex-1">{t("nav.notifications")}</span>
            <NotificationsBell profileId={profileId} initial={counts.unread} variant="count" />
          </Link>
          <Link href="/app/me" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-2">
            <Avatar name={name} size={34} />
            <span className="grid min-w-0">
              <span className="truncate text-sm font-extrabold">{name}</span>
              <span className="text-xs font-semibold text-ink-2">{t(`roles.${role}`)}</span>
            </span>
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line/70 bg-canvas/85 px-4 pb-2 pt-[calc(8px+env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
          <Link href="/app" className="flex items-center gap-2">
            <Image src="/icons/icon-192.png" alt="" width={30} height={30} className="rounded-lg" />
            <span className="font-extrabold tracking-tight">Too Easy</span>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationsBell profileId={profileId} initial={counts.unread} variant="icon" />
            <Link href="/app/me" aria-label={t("nav.me")} className="inline-flex size-11 items-center justify-center">
              <Avatar name={name} size={32} />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-5 md:px-8 lg:pb-12 lg:pt-8">{children}</main>
      </div>

      {/* Mobile tab bar */}
      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/92 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${mobile.length}, minmax(0, 1fr))` }}>
          {mobile.map((item) => {
            const active = isActive(pathname, item.href, mobile);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-extrabold"
              >
                <span
                  className={cn(
                    "relative flex h-8 w-14 items-center justify-center rounded-full transition",
                    active ? "bg-accent-soft text-accent-strong" : "text-ink-2",
                  )}
                >
                  <Icon className="size-[22px]" strokeWidth={active ? 2.5 : 2} />
                  {!!item.badge && (
                    <span className="tabular absolute -right-0.5 -top-1 min-w-[18px] rounded-full bg-attention px-1 text-center text-[10px] leading-[18px] text-white">
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className={active ? "text-ink" : "text-ink-2"}>{t(item.label)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
