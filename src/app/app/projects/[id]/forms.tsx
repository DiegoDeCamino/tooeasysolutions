"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { todayPerth, formatHours } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Field, Input, Switch, Textarea } from "@/components/ui/Field";
import { Chips } from "@/components/ui/Chips";
import { Stepper } from "@/components/ui/Stepper";
import { PhotoPicker, type PickedPhoto } from "@/components/ui/Photos";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { uploadPhotos } from "@/lib/upload";
import { addExpense, addMaterial, logHours, postUpdate, prepareProjectUploads } from "../actions";
import type { ProjectData } from "./ProjectView";

type FormProps = { open: boolean; onClose: () => void; data: ProjectData };

function useSubmit(onDone: () => void) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return toast(res.error ?? "Error", "error");
      toast(success);
      onDone();
      router.refresh();
    });
  return { pending, run };
}

export function UpdateForm({ open, onClose, data }: FormProps) {
  const { t } = useT();
  const toast = useToast();
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const current = data.stages.find((s) => s.status === "doing") ?? data.stages.find((s) => s.status === "todo");
  const [stageId, setStageId] = useState<string>(current?.id ?? "general");
  const [clientVisible, setClientVisible] = useState(true);
  const [progress, setProgress] = useState<string | null>(null);
  const reset = () => {
    setBody("");
    setPhotos([]);
    setProgress(null);
    onClose();
  };
  const { pending, run } = useSubmit(reset);

  const submit = () =>
    run(async () => {
      let paths: string[] = [];
      if (photos.length) {
        const prep = await prepareProjectUploads(data.project.id, photos.length);
        if (!prep.ok) return prep;
        paths = await uploadPhotos(prep.data, photos, (d, n) => setProgress(`${d}/${n}`));
        if (paths.length < photos.length) toast(t("common.error"), "error");
      }
      return postUpdate(data.project.id, { body, photoPaths: paths, stageId: stageId === "general" ? null : stageId, clientVisible });
    }, t("projects.posted"));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("projects.update")}
      footer={
        <Button block size="lg" onClick={submit} loading={pending} disabled={!body.trim() && !photos.length}>
          {progress ? `${t("projects.post")} ${progress}` : t("projects.post")}
        </Button>
      }
    >
      <div className="grid gap-5">
        <PhotoPicker value={photos} onChange={setPhotos} max={10} label={t("projects.update")} />
        <Field label={t("projects.note")}>
          {(p) => <Textarea {...p} rows={3} placeholder={t("projects.whatsNew")} value={body} onChange={(e) => setBody(e.target.value)} />}
        </Field>
        {data.stages.length > 0 && (
          <div className="grid gap-2">
            <span className="text-sm font-bold">{t("projects.stage")}</span>
            <Chips
              scroll
              value={stageId}
              onChange={setStageId}
              options={[{ value: "general", label: t("projects.general") }, ...data.stages.map((s) => ({ value: s.id, label: s.name }))]}
            />
          </div>
        )}
        <Switch checked={clientVisible} onChange={setClientVisible} label={t("projects.clientVisible")} description={t("projects.clientSees")} />
      </div>
    </Sheet>
  );
}

export function HoursForm({ open, onClose, data }: FormProps) {
  const { t } = useT();
  const [date, setDate] = useState(todayPerth());
  const [hours, setHours] = useState(8);
  const [note, setNote] = useState("");
  const canPick = data.viewer.isAdmin || data.viewer.isSupervisor;
  const [who, setWho] = useState(data.viewer.id);
  const { pending, run } = useSubmit(() => {
    setNote("");
    onClose();
  });
  const people = data.viewer.isAdmin && data.staff.length ? data.staff : data.members.map((m) => ({ id: m.id, name: m.name }));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("projects.logHours")}
      footer={
        <Button
          block
          size="lg"
          loading={pending}
          onClick={() => run(() => logHours(data.project.id, { date, hours, note, profileId: who === data.viewer.id ? null : who }), t("projects.hoursLogged"))}
        >
          {t("projects.logHours")}
        </Button>
      }
    >
      <div className="grid gap-5">
        {canPick && (
          <div className="grid gap-2">
            <span className="text-sm font-bold">{t("projects.person")}</span>
            <Chips
              scroll
              value={who}
              onChange={setWho}
              options={[{ id: data.viewer.id, name: t("nav.me") }, ...people.filter((p) => p.id !== data.viewer.id)].map((p) => ({ value: p.id, label: p.name }))}
            />
          </div>
        )}
        <Field label={t("projects.date")}>{(p) => <Input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
        <Stepper label={t("projects.hours")} value={hours} min={0.5} max={14} step={0.5} onChange={setHours} format={(v) => formatHours(v)} />
        <Field label={t("projects.note")} optional={t("common.optional")}>
          {(p) => <Input {...p} value={note} onChange={(e) => setNote(e.target.value)} />}
        </Field>
      </div>
    </Sheet>
  );
}

export function MaterialForm({ open, onClose, data }: FormProps) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState("pcs");
  const [cost, setCost] = useState("");
  const { pending, run } = useSubmit(() => {
    setName("");
    setQty(1);
    setCost("");
    onClose();
  });
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("projects.addMaterial")}
      footer={
        <Button
          block
          size="lg"
          loading={pending}
          disabled={!name.trim()}
          onClick={() => run(() => addMaterial(data.project.id, { name, qty, unit, estCost: cost ? Number(cost) : null }), t("settings.saved"))}
        >
          {t("projects.addMaterial")}
        </Button>
      }
    >
      <div className="grid gap-5">
        <Field label={t("projects.materialName")}>
          {(p) => <Input {...p} placeholder="e.g. 90x45 treated pine" value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Stepper label={t("projects.qty")} value={qty} min={0} max={9999} onChange={setQty} />
        <div className="grid gap-2">
          <span className="text-sm font-bold">{t("projects.unit")}</span>
          <Chips value={unit} onChange={setUnit} options={["pcs", "m", "m²", "L", "box", "bag"].map((u) => ({ value: u, label: u }))} />
        </div>
        {data.viewer.isAdmin && (
          <Field label={t("projects.estCost")} optional={t("common.optional")}>
            {(p) => <Input {...p} inputMode="decimal" placeholder="$" value={cost} onChange={(e) => setCost(e.target.value.replace(/[^\d.]/g, ""))} />}
          </Field>
        )}
      </div>
    </Sheet>
  );
}

export function ExpenseForm({ open, onClose, data }: FormProps) {
  const { t } = useT();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<"materials" | "labour" | "equipment" | "other">("materials");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayPerth());
  const [receipt, setReceipt] = useState<PickedPhoto[]>([]);
  const { pending, run } = useSubmit(() => {
    setAmount("");
    setDescription("");
    setReceipt([]);
    onClose();
  });

  const submit = () =>
    run(async () => {
      let receiptPath: string | null = null;
      if (receipt.length) {
        const prep = await prepareProjectUploads(data.project.id, 1, "receipts");
        if (!prep.ok) return prep;
        receiptPath = (await uploadPhotos(prep.data, receipt))[0] ?? null;
      }
      return addExpense(data.project.id, { amount, category, description, spentOn: date, receiptPath });
    }, t("projects.expenseAdded"));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("projects.expense")}
      footer={
        <Button block size="lg" loading={pending} disabled={!Number(amount)} onClick={submit}>
          {t("projects.addExpense")}
        </Button>
      }
    >
      <div className="grid gap-5">
        <label className="flex h-16 items-center rounded-2xl border border-line bg-surface px-4 focus-within:border-accent">
          <span className="text-2xl font-extrabold text-ink-2">$</span>
          <input
            inputMode="decimal"
            aria-label={t("projects.amount")}
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            className="tabular w-full bg-transparent pl-1 text-3xl font-extrabold outline-none"
          />
        </label>
        <div className="grid gap-2">
          <span className="text-sm font-bold">{t("projects.category")}</span>
          <Chips
            value={category}
            onChange={setCategory}
            options={[
              { value: "materials", label: t("projects.catMaterials") },
              { value: "labour", label: t("projects.catLabour") },
              { value: "equipment", label: t("projects.catEquipment") },
              { value: "other", label: t("projects.catOther") },
            ]}
          />
        </div>
        <Field label={t("projects.note")} optional={t("common.optional")}>
          {(p) => <Input {...p} placeholder="Bunnings, timber order" value={description} onChange={(e) => setDescription(e.target.value)} />}
        </Field>
        <Field label={t("projects.date")}>{(p) => <Input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
        <div className="grid gap-2">
          <span className="text-sm font-bold">{t("projects.receipt")}</span>
          <PhotoPicker value={receipt} onChange={setReceipt} max={1} label={t("projects.receipt")} compact />
        </div>
      </div>
    </Sheet>
  );
}
