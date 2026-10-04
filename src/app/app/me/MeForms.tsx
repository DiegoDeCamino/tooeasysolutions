"use client";

import { useState, useTransition } from "react";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/client";
import { changePassword, updateProfile } from "./actions";

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const { t } = useT();
  const toast = useToast();
  const [values, setValues] = useState({ full_name: name, phone });
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await updateProfile(values);
          toast(res.ok ? t("settings.saved") : t("common.error"), res.ok ? "ok" : "error");
        });
      }}
    >
      <Field label={t("auth.fullName")}>
        {(p) => <Input {...p} value={values.full_name} onChange={(e) => setValues({ ...values, full_name: e.target.value })} />}
      </Field>
      <Field label={t("auth.phone")}>
        {(p) => <Input {...p} type="tel" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />}
      </Field>
      <Button type="submit" variant="secondary" loading={pending} className="justify-self-start">
        {t("common.save")}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const { t } = useT();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await changePassword(password);
          if (res.ok) {
            setPassword("");
            toast(t("me.passwordChanged"));
          } else toast(res.error === "short" ? t("auth.passwordHint") : t("common.error"), "error");
        });
      }}
    >
      <Field label={t("auth.newPassword")} hint={t("auth.passwordHint")}>
        {(p) => (
          <Input
            {...p}
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
      </Field>
      <Button type="submit" variant="secondary" loading={pending} className="justify-self-start">
        {t("auth.setPassword")}
      </Button>
    </form>
  );
}
