"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { updatePassword } from "./actions";

export default function ResetPasswordPage() {
  const { t } = useT();
  const [state, action, pending] = useActionState(updatePassword, null);
  return (
    <form action={action} className="grid gap-5">
      <h1 className="text-3xl font-semibold tracking-tight">{t("auth.newPassword")}</h1>
      {state?.error && (
        <p role="alert" className="rounded-(--r-card) bg-danger-soft px-4 py-3 font-medium text-danger">
          {state.error === "short" ? t("auth.passwordHint") : t("common.error")}
        </p>
      )}
      <Field label={t("auth.newPassword")} hint={t("auth.passwordHint")}>
        {(p) => <Input {...p} name="password" type="password" autoComplete="new-password" minLength={8} required />}
      </Field>
      <Button type="submit" size="lg" block loading={pending}>
        {t("auth.setPassword")}
      </Button>
    </form>
  );
}
