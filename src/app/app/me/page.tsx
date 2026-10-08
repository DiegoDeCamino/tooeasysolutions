import { LogOut } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { Avatar, Badge, Card, PageHeader } from "@/components/ui/Display";
import { LocaleSwitch } from "@/components/app/LocaleSwitch";
import { ThemeSwitch } from "@/components/app/ThemeSwitch";
import { getServerTheme } from "@/lib/theme.server";
import { PushToggle } from "@/components/app/PushToggle";
import { InstallPrompt } from "@/components/app/InstallPrompt";
import { signOut } from "@/app/(auth)/login/actions";
import { ProfileForm, PasswordForm } from "./MeForms";

export const metadata = { title: "Me" };

export default async function MePage() {
  const { profile, email } = await requireStaff();
  const [{ t }, theme] = await Promise.all([getServerT(), getServerTheme()]);

  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <PageHeader title={t("me.title")} />

      <Card className="flex items-center gap-4 p-5">
        <Avatar name={profile.full_name} size={52} />
        <div className="grid min-w-0 gap-1">
          <p className="truncate text-lg font-semibold">{profile.full_name}</p>
          <p className="truncate text-sm text-ink-2">{email}</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="accent">{t(`roles.${profile.role}` as "roles.worker")}</Badge>
            {profile.skills.map((s) => (
              <Badge key={s}>{t(`skills.${s}` as "skills.cleaning")}</Badge>
            ))}
          </div>
        </div>
      </Card>

      <Card className="grid gap-5 p-5">
        <InstallPrompt />
        <PushToggle />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <span className="font-medium">{t("me.theme")}</span>
          <ThemeSwitch initial={theme} labels />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium">{t("me.language")}</span>
          <LocaleSwitch />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-[15px] font-semibold">{t("me.profile")}</h2>
        <ProfileForm name={profile.full_name} phone={profile.phone ?? ""} />
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-[15px] font-semibold">{t("me.password")}</h2>
        <PasswordForm />
      </Card>

      <form action={signOut}>
        <button
          type="submit"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-(--r-control) text-sm font-medium text-danger transition hover:bg-danger-soft"
        >
          <LogOut className="size-4" /> {t("common.signOut")}
        </button>
      </form>
    </div>
  );
}
