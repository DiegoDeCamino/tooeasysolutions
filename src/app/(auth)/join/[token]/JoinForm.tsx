"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Display";
import { useT } from "@/lib/i18n/client";
import { joinCrew, type JoinState } from "./actions";

export function JoinForm({ token, role, skills }: { token: string; role: string; skills: string[] }) {
  const { t, locale } = useT();
  const [state, action, pending] = useActionState<JoinState, FormData>(joinCrew.bind(null, token), null);
  const fe = state?.fieldErrors ?? {};
  const roleLabel = t(`roles.${role}` as "roles.worker");

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("auth.joinTitle")}</h1>
        <p className="text-ink-2">{t("auth.joinSub")}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge tone="accent">{t("auth.joinAs", { role: roleLabel })}</Badge>
          {skills.map((s) => (
            <Badge key={s}>{t(`skills.${s}` as "skills.cleaning")}</Badge>
          ))}
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 font-bold text-danger">
          {state.error === "invite" ? t("auth.inviteInvalid") : state.error === "emailTaken" ? t("auth.emailTaken") : t("common.error")}
          {state.error === "emailTaken" && (
            <Link href="/login" className="ml-2 underline">
              {t("auth.signIn")}
            </Link>
          )}
        </p>
      )}

      <input type="hidden" name="locale" value={locale} />
      <Field label={t("auth.fullName")} error={fe.fullName}>
        {(p) => <Input {...p} name="fullName" autoComplete="name" required />}
      </Field>
      <Field label={t("auth.phone")} error={fe.phone}>
        {(p) => <Input {...p} name="phone" type="tel" autoComplete="tel" inputMode="tel" required />}
      </Field>
      <Field label={t("auth.email")} error={fe.email}>
        {(p) => <Input {...p} name="email" type="email" autoComplete="email" inputMode="email" required />}
      </Field>
      <Field label={t("auth.password")} hint={t("auth.passwordHint")} error={fe.password}>
        {(p) => <Input {...p} name="password" type="password" autoComplete="new-password" minLength={8} required />}
      </Field>
      <Button type="submit" size="lg" block loading={pending}>
        {t("auth.createAccount")}
      </Button>
    </form>
  );
}
