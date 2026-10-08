"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { Card } from "@/components/ui/Display";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Chips } from "@/components/ui/Chips";
import { useToast } from "@/components/ui/Toast";
import { createProject } from "../actions";

const CATEGORIES = [
  { value: "deck", label: "Deck" },
  { value: "pergola", label: "Pergola" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "fencing", label: "Fencing" },
  { value: "repairs", label: "Repairs" },
  { value: "other", label: "Other" },
];

export function NewProjectForm({ templates }: { templates: { id: string; name: string; stages: string[] }[] }) {
  const { t } = useT();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({
    title: "",
    category: "deck",
    description: "",
    address: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    start_date: "",
    due_date: "",
    templateId: templates[0]?.id ?? "",
    budget: "",
  });
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const tpl = templates.find((x) => x.id === f.templateId);

  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await createProject({ ...f, budget: f.budget || "0", enquiryId: null });
          if (!res.ok) return toast(res.error, "error");
          router.push(`/app/projects/${res.data.id}`);
        });
      }}
    >
      <Card className="grid gap-5 p-5">
        <Field label={t("projects.name")}>{(p) => <Input {...p} required value={f.title} onChange={(e) => set("title")(e.target.value)} />}</Field>
        <div className="grid gap-2">
          <span className="text-sm font-medium">{t("projects.category_")}</span>
          <Chips value={f.category} onChange={set("category")} options={CATEGORIES} />
        </div>
        <Field label={t("projects.description")} optional={t("common.optional")}>
          {(p) => <Textarea {...p} rows={3} value={f.description} onChange={(e) => set("description")(e.target.value)} />}
        </Field>
        <Field label={t("projects.address")}>{(p) => <Input {...p} value={f.address} onChange={(e) => set("address")(e.target.value)} />}</Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("projects.start")}>{(p) => <Input {...p} type="date" value={f.start_date} onChange={(e) => set("start_date")(e.target.value)} />}</Field>
          <Field label={t("projects.due")}>{(p) => <Input {...p} type="date" value={f.due_date} onChange={(e) => set("due_date")(e.target.value)} />}</Field>
        </div>
      </Card>

      <Card className="grid gap-5 p-5">
        <h2 className="font-semibold">{t("projects.client")}</h2>
        <Field label={t("auth.fullName")}>{(p) => <Input {...p} value={f.client_name} onChange={(e) => set("client_name")(e.target.value)} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("auth.email")}>{(p) => <Input {...p} type="email" value={f.client_email} onChange={(e) => set("client_email")(e.target.value)} />}</Field>
          <Field label={t("auth.phone")}>{(p) => <Input {...p} type="tel" value={f.client_phone} onChange={(e) => set("client_phone")(e.target.value)} />}</Field>
        </div>
      </Card>

      <Card className="grid gap-5 p-5">
        <div className="grid gap-2">
          <span className="text-sm font-medium">{t("projects.template")}</span>
          <Chips value={f.templateId} onChange={set("templateId")} options={templates.map((x) => ({ value: x.id, label: x.name }))} />
          {tpl && <p className="text-sm text-ink-2">{tpl.stages.join(", ")}</p>}
        </div>
        <Field label={t("projects.budget")} optional={t("common.optional")}>
          {(p) => <Input {...p} inputMode="decimal" placeholder="$" value={f.budget} onChange={(e) => set("budget")(e.target.value.replace(/[^\d.]/g, ""))} />}
        </Field>
      </Card>

      <Button type="submit" size="lg" loading={pending}>
        {t("projects.create")}
      </Button>
    </form>
  );
}
