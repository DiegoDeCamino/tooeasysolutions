import { LogOut } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { Avatar, Badge, Card, PageHeader } from "@/components/ui/Display";
import { LocaleSwitch } from "@/components/app/LocaleSwitch";
import { PushToggle } from "@/components/app/PushToggle";
import { InstallPrompt } from "@/components/app/InstallPrompt";
import { signOut } from "@/app/(auth)/login/actions";
import { ProfileForm, PasswordForm } from "./MeForms";

export const metadata = { title: "Me" };

export default async function MePage() {
  const { profile, email } = await requireStaff();
  const { t } = await getServerT();

  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <PageHeader title={t("me.title")} />

      <Card className="flex items-center gap-4 p-5">
        <Avatar name={profile.full_name} size={56} />
        <div className="grid min-w-0 gap-1">
          <p className="truncate text-lg font-extrabold">{profile.full_name}</p>
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
        <div className="flex items-center justify-between gap-4">
          <span className="font-extrabold">{t("me.language")}</span>
          <LocaleSwitch />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-extrabold">{t("me.profile")}</h2>
        <ProfileForm name={profile.full_name} phone={profile.phone ?? ""} />
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-extrabold">{t("me.password")}</h2>
        <PasswordForm />
      </Card>

      <form action={signOut}>
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full font-extrabold text-danger hover:bg-danger-soft"
        >
          <LogOut className="size-5" /> {t("common.signOut")}
        </button>
      </form>
    </div>
  );
}
