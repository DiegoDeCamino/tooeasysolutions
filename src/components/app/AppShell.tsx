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
import type { Theme } from "@/lib/theme";
import { Avatar } from "@/components/ui/Display";
import { NotificationsBell } from "./NotificationsBell";
import { ServiceWorker } from "./ServiceWorker";
import { ThemeSwitch } from "./ThemeSwitch";

type Role = "admin" | "supervisor" | "worker";
type Icon = React.ComponentType<{ className?: string; strokeWidth?: number }>;
type NavItem = { href: string; label: TKey; icon: Icon; badge?: number };
type NavGroup = { label?: TKey; items: NavItem[] };

function navFor(role: Role, counts: ShellCounts) {
  if (role === "admin") {
    const mobile: NavItem[] = [
      { href: "/app", label: "nav.home", icon: Home },
      { href: "/app/cleaning", label: "nav.cleaning", icon: Sparkles, badge: counts.newBookings },
      { href: "/app/projects", label: "nav.projects", icon: Hammer, badge: counts.newEnquiries },
      { href: "/app/crew", label: "nav.crew", icon: Users },
      { href: "/app/more", label: "nav.more", icon: LayoutGrid },
    ];
    const desktop: NavGroup[] = [
      { items: [{ href: "/app", label: "nav.home", icon: Home }] },
      {
        label: "nav.cleaning",
        items: [
          { href: "/app/cleaning", label: "nav.bookings", icon: Sparkles, badge: counts.newBookings },
          { href: "/app/cleaning/calendar", label: "nav.calendar", icon: CalendarDays },
          { href: "/app/cleaning/shifts", label: "nav.shifts", icon: ClipboardList },
        ],
      },
      {
        label: "nav.carpentry",
        items: [
          { href: "/app/projects", label: "nav.projects", icon: Hammer },
          { href: "/app/projects/enquiries", label: "nav.enquiries", icon: Inbox, badge: counts.newEnquiries },
        ],
      },
      {
        label: "nav.manage",
        items: [
          { href: "/app/crew", label: "nav.crew", icon: Users },
          { href: "/app/settings/pricing", label: "nav.pricing", icon: SlidersHorizontal },
          { href: "/app/settings/templates", label: "nav.templates", icon: ListChecks },
        ],
      },
    ];
    return { mobile, desktop };
  }
  const items: NavItem[] = [
    { href: "/app", label: "nav.home", icon: Home },
    { href: "/app/shifts", label: "nav.shifts", icon: ClipboardList, badge: counts.openShifts },
    { href: "/app/projects", label: "nav.projects", icon: Hammer },
    { href: "/app/me", label: "nav.me", icon: UserRound },
  ];
  return { mobile: items, desktop: [{ items: items.filter((i) => i.href !== "/app/me") }] };
}

export type ShellCounts = { newBookings: number; newEnquiries: number; openShifts: number; unread: number };

function isActive(pathname: string, href: string, all: NavItem[]) {
  if (href === "/app") return pathname === "/app";
  if (!(pathname === href || pathname.startsWith(href + "/"))) return false;
  // Prefer the most specific matching item (e.g. /app/cleaning/calendar over /app/cleaning).
  return !all.some((o) => o.href !== href && o.href.startsWith(href + "/") && (pathname === o.href || pathname.startsWith(o.href + "/")));
}

function Count({ n, small, className }: { n: number; small?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "tabular inline-flex items-center justify-center rounded-full bg-attention font-semibold text-attention-ink",
        small ? "h-4 min-w-4 px-1 text-[10px]" : "h-5 min-w-5 px-1.5 text-[11px]",
        className,
      )}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function AppShell({
  role,
  name,
  profileId,
  counts,
  theme,
  children,
}: {
  role: Role;
  name: string;
  profileId: string;
  counts: ShellCounts;
  theme: Theme;
  children: React.ReactNode;
}) {
  const { t } = useT();
  const pathname = usePathname();
  const { mobile, desktop } = navFor(role, counts);
  const allDesktop = desktop.flatMap((g) => g.items);
  const onNotifications = pathname.startsWith("/app/notifications");
  const onMe = pathname.startsWith("/app/me");

  return (
    <div className="lg:flex">
      <ServiceWorker />
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-canvas lg:flex">
        <Link href="/app" className="flex h-16 items-center gap-2.5 px-5">
          <Image src="/icons/icon-192.png" alt="" width={28} height={28} className="rounded-md" />
          <span className="text-[15px] font-semibold tracking-tight">Too Easy</span>
        </Link>
        <nav aria-label="Main" className="no-scrollbar grid content-start gap-5 overflow-y-auto px-3 pb-4 pt-1">
          {desktop.map((group, gi) => (
            <div key={gi} className="grid gap-px">
              {group.label && <p className="px-2.5 pb-1.5 text-xs font-medium text-ink-2">{t(group.label)}</p>}
              {group.items.map((item) => {
                const active = isActive(pathname, item.href, allDesktop);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
                      active ? "bg-surface font-medium text-ink shadow-soft ring-1 ring-line" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    <Icon className={cn("size-[18px]", active && "text-accent-strong")} strokeWidth={1.9} />
                    <span className="flex-1 truncate">{t(item.label)}</span>
                    {!!item.badge && <Count n={item.badge} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="mt-auto grid gap-3 border-t border-line p-3">
          <Link
            href="/app/notifications"
            aria-current={onNotifications ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
              onNotifications ? "bg-surface font-medium text-ink ring-1 ring-line" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
            )}
          >
            <Bell className="size-[18px]" strokeWidth={1.9} />
            <span className="flex-1">{t("nav.notifications")}</span>
            <NotificationsBell profileId={profileId} initial={counts.unread} variant="count" />
          </Link>
          <ThemeSwitch initial={theme} className="w-full" />
          <Link
            href="/app/me"
            aria-current={onMe ? "page" : undefined}
            className={cn("flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-surface-2", onMe && "bg-surface-2")}
          >
            <Avatar name={name} size={30} />
            <span className="grid min-w-0 leading-tight">
              <span className="truncate text-sm font-medium">{name}</span>
              <span className="text-xs text-ink-2">{t(`roles.${role}`)}</span>
            </span>
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-canvas/90 px-4 pb-2 pt-[calc(8px+env(safe-area-inset-top))] backdrop-blur-md lg:hidden">
          <Link href="/app" className="flex items-center gap-2">
            <Image src="/icons/icon-192.png" alt="" width={26} height={26} className="rounded-md" />
            <span className="text-[15px] font-semibold tracking-tight">Too Easy</span>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationsBell profileId={profileId} initial={counts.unread} variant="icon" />
            <Link href="/app/me" aria-label={t("nav.me")} className="inline-flex size-11 items-center justify-center">
              <Avatar name={name} size={30} />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-5 md:px-8 lg:px-10 lg:pb-16 lg:pt-9">{children}</main>
      </div>

      {/* Mobile tab bar */}
      <nav aria-label="Main" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${mobile.length}, minmax(0, 1fr))` }}>
          {mobile.map((item) => {
            const active = isActive(pathname, item.href, mobile);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium", active ? "text-ink" : "text-ink-2")}
              >
                <span className="relative">
                  <Icon className={cn("size-[22px]", active && "text-accent-strong")} strokeWidth={active ? 2.2 : 1.8} />
                  {!!item.badge && <Count n={item.badge} small className="absolute -right-3 -top-1.5" />}
                </span>
                {t(item.label)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
