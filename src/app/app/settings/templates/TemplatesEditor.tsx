"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { Card } from "@/components/ui/Display";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { deleteTemplate, saveTemplate } from "./actions";

type Template = { id?: string; name: string; stages: string[] };

export function TemplatesEditor({ templates }: { templates: Template[] }) {
  const { t } = useT();
  const [drafts, setDrafts] = useState(templates.map((x) => ({ ...x, text: x.stages.join("\n") })));
  return (
    <div className="grid gap-4">
      {drafts.map((d, i) => (
        <TemplateCard
          key={d.id ?? `new-${i}`}
          draft={d}
          onRemoved={() => setDrafts((all) => all.filter((_, j) => j !== i))}
        />
      ))}
      <Button
        variant="secondary"
        size="lg"
        icon={<Plus className="size-5" />}
        className="justify-self-start"
        onClick={() => setDrafts((all) => [...all, { name: "", stages: [], text: "" }])}
      >
        {t("settings.addTemplate")}
      </Button>
    </div>
  );
}

function TemplateCard({ draft, onRemoved }: { draft: Template & { text: string }; onRemoved: () => void }) {
  const { t } = useT();
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState(draft.name);
  const [text, setText] = useState(draft.text);
  const [pending, start] = useTransition();
  const dirty = name !== draft.name || text !== draft.text;

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex items-end gap-2">
        <Field label={t("settings.name")} className="flex-1">
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <IconButton
          label={t("common.delete")}
          onClick={() =>
            start(async () => {
              if (draft.id) await deleteTemplate(draft.id);
              onRemoved();
              router.refresh();
            })
          }
        >
          <Trash2 className="size-5 text-danger" />
        </IconButton>
      </div>
      <Field label={t("projects.stages")} hint={t("settings.stagesHint")}>
        {(p) => <Textarea {...p} rows={6} value={text} onChange={(e) => setText(e.target.value)} />}
      </Field>
      {dirty && (
        <Button
          loading={pending}
          className="justify-self-start"
          onClick={() =>
            start(async () => {
              const res = await saveTemplate({ id: draft.id, name, stages: text.split("\n").map((s) => s.trim()).filter(Boolean) });
              if (!res.ok) return toast(res.error, "error");
              toast(t("settings.saved"));
              router.refresh();
            })
          }
        >
          {t("common.save")}
        </Button>
      )}
    </Card>
  );
}
