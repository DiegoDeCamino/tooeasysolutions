import type { Metadata } from "next";
import { getServerT } from "@/lib/i18n/server";
import { loadInvite } from "@/lib/invites";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = { title: "Join the crew | Too Easy" };

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await loadInvite(token);
  const { t } = await getServerT();

  if (!invite) {
    return (
      <div className="grid gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{t("auth.joinTitle")}</h1>
        <p className="rounded-(--r-card) bg-attention-soft p-4 font-medium text-ink">{t("auth.inviteInvalid")}</p>
      </div>
    );
  }

  return <JoinForm token={token} role={invite.role} skills={invite.skills} />;
}
