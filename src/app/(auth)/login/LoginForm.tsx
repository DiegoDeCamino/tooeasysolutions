"use client";

import { useActionState, useState } from "react";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { requestReset, signIn, type LoginState } from "./actions";

export function LoginForm({ next, denied }: { next?: string; denied?: boolean }) {
  const { t } = useT();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [loginState, loginAction, loggingIn] = useActionState<LoginState, FormData>(signIn, null);
  const [resetState, resetAction, resetting] = useActionState<LoginState, FormData>(requestReset, null);

  const error =
    loginState?.error === "invalid" ? t("auth.invalid") : loginState?.error === "noAccess" || denied ? t("auth.noAccess") : null;

  if (mode === "reset") {
    return (
      <form action={resetAction} className="grid gap-5">
        <div className="grid gap-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight">{t("auth.forgot")}</h1>
        </div>
        {resetState?.resetSent ? (
          <p className="rounded-2xl bg-accent-soft p-4 text-[15px] font-semibold text-ink">{t("auth.resetSent")}</p>
        ) : (
          <>
            <Field label={t("auth.email")}>
              {(p) => <Input {...p} name="email" type="email" autoComplete="email" required />}
            </Field>
            <Button type="submit" size="lg" block loading={resetting}>
              {t("auth.sendReset")}
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={() => setMode("login")}>
          {t("common.back")}
        </Button>
      </form>
    );
  }

  return (
    <form action={loginAction} className="grid gap-5">
      <div className="grid gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("auth.signInTitle")}</h1>
        <p className="text-ink-2">{t("auth.signInSub")}</p>
      </div>
      {error && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-[15px] font-bold text-danger">
          {error}
        </p>
      )}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label={t("auth.email")}>
        {(p) => <Input {...p} name="email" type="email" autoComplete="email" inputMode="email" required />}
      </Field>
      <Field label={t("auth.password")}>
        {(p) => <Input {...p} name="password" type="password" autoComplete="current-password" required />}
      </Field>
      <Button type="submit" size="lg" block loading={loggingIn}>
        {t("auth.signIn")}
      </Button>
      <button type="button" onClick={() => setMode("reset")} className="justify-self-center text-sm font-bold text-ink-2 underline-offset-4 hover:underline">
        {t("auth.forgot")}
      </button>
    </form>
  );
}
