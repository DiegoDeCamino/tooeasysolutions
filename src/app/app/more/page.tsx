import Link from "next/link";
import { Bell, CalendarDays, ChevronRight, ClipboardList, Inbox, ListChecks, SlidersHorizontal, UserRound } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { Card, PageHeader } from "@/components/ui/Display";

export const metadata = { title: "More" };

export default async function MorePage() {
  await requireAdmin();
  const { t } = await getServerT();
  const groups = [
    [
      { href: "/app/cleaning/calendar", label: t("nav.calendar"), icon: CalendarDays },
      { href: "/app/cleaning/shifts", label: t("nav.shifts"), icon: ClipboardList },
      { href: "/app/projects/enquiries", label: t("nav.enquiries"), icon: Inbox },
    ],
    [
      { href: "/app/settings/pricing", label: t("nav.pricing"), icon: SlidersHorizontal },
      { href: "/app/settings/templates", label: t("nav.templates"), icon: ListChecks },
    ],
    [
      { href: "/app/notifications", label: t("nav.notifications"), icon: Bell },
      { href: "/app/me", label: t("nav.me"), icon: UserRound },
    ],
  ];
  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <PageHeader title={t("nav.more")} />
      {groups.map((items, i) => (
        <Card key={i} className="divide-y divide-line overflow-hidden">
          {items.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex h-13 items-center gap-3 px-4 transition-colors hover:bg-surface-2">
              <Icon className="size-[18px] text-ink-2" />
              <span className="flex-1 font-medium">{label}</span>
              <ChevronRight className="size-4 text-ink-2" />
            </Link>
          ))}
        </Card>
      ))}
    </div>
  );
}
