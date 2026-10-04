"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Clock, Hammer, Mail, MapPin, MessageCircle, Phone, PhoneCall, Wallet } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";
import { useT } from "@/lib/i18n/client";
import { timeAgo } from "@/lib/format";
import { Badge, Card, PageHeader } from "@/components/ui/Display";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Chips } from "@/components/ui/Chips";
import { PhotoGrid } from "@/components/ui/Photos";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { createProject, setEnquiryStatus } from "../../actions";

const CATEGORY: Record<string, string> = {
  deck: "Deck",
  pergola: "Pergola or patio",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  fencing: "Fencing or screens",
  repairs: "Repairs",
  other: "Something else",
};
const TEMPLATE_FOR: Record<string, string> = { deck: "Deck", pergola: "Pergola", kitchen: "Kitchen", bathroom: "Bathroom", repairs: "General repairs" };

export function EnquiryDetail({
  enquiry: e,
  photos,
  templates,
}: {
  enquiry: Tables<"enquiries">;
  photos: string[];
  templates: { id: string; name: string; stages: string[] }[];
}) {
  const { t, locale } = useT();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`${CATEGORY[e.category] ?? "Project"} for ${e.name.split(" ")[0]}`);
  const [templateId, setTemplateId] = useState(templates.find((x) => x.name === TEMPLATE_FOR[e.category])?.id ?? templates[0]?.id ?? "");
  const [address, setAddress] = useState(e.suburb ?? "");
  const tpl = templates.find((x) => x.id === templateId);
  const phoneDigits = (e.phone ?? "").replace(/[^\d+]/g, "").replace(/^0/, "+61");

  const status = (s: "contacted" | "archived") =>
    start(async () => {
      const res = await setEnquiryStatus(e.id, s);
      if (!res.ok) return toast(res.error, "error");
      router.refresh();
    });

  const convert = () =>
    start(async () => {
      const res = await createProject({
        title,
        category: e.category,
        description: e.description,
        address,
        client_name: e.name,
        client_email: e.email,
        client_phone: e.phone ?? "",
        start_date: "",
        due_date: "",
        templateId,
        budget: 0,
        enquiryId: e.id,
      });
      if (!res.ok) return toast(res.error, "error");
      toast(t("projects.converted"));
      router.push(`/app/projects/${res.data.id}`);
    });

  return (
    <div className="mx-auto grid max-w-3xl gap-5 pb-24 lg:pb-0">
      <PageHeader
        back="/app/projects/enquiries"
        title={e.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={e.status === "new" ? "attention" : "accent"}>{t(`enquiryStatus.${e.status}`)}</Badge>
            <span suppressHydrationWarning className="text-sm font-bold">
              {CATEGORY[e.category] ?? e.category} · {timeAgo(e.created_at, locale)}
            </span>
          </span>
        }
      />

      {photos.length > 0 && <PhotoGrid urls={photos} />}

      <Card className="grid gap-4 p-5">
        <p className="whitespace-pre-line text-[17px] leading-relaxed">{e.description}</p>
        <div className="flex flex-wrap gap-2">
          {e.suburb && (
            <Badge>
              <MapPin className="size-3.5" /> {e.suburb}
            </Badge>
          )}
          {e.timeframe && (
            <Badge>
              <Clock className="size-3.5" /> {e.timeframe}
            </Badge>
          )}
          {e.budget_range && (
            <Badge>
              <Wallet className="size-3.5" /> {e.budget_range}
            </Badge>
          )}
        </div>
      </Card>

      <Card className="grid gap-3 p-5">
        <div>
          <p className="font-extrabold">{e.name}</p>
          <p className="text-sm text-ink-2">
            {e.email}
            {e.phone ? `, ${e.phone}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {e.phone && (
            <a href={`tel:${e.phone}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-accent-soft px-4 font-extrabold text-accent-strong">
              <Phone className="size-4" /> {t("common.call")}
            </a>
          )}
          {e.phone && (
            <a
              href={`https://wa.me/${phoneDigits.replace("+", "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-surface-2 px-4 font-extrabold"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          )}
          <a href={`mailto:${e.email}?subject=Your enquiry ${e.ref}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-surface-2 px-4 font-extrabold">
            <Mail className="size-4" /> {t("common.email")}
          </a>
        </div>
      </Card>

      {e.status === "converted" && e.project_id ? (
        <Link href={`/app/projects/${e.project_id}`} className="font-extrabold text-accent-strong">
          {t("projects.title")} →
        </Link>
      ) : (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-md lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <div className="mx-auto flex max-w-3xl gap-2">
            {e.status === "new" && (
              <Button variant="secondary" size="lg" icon={<PhoneCall className="size-4" />} onClick={() => status("contacted")} loading={pending}>
                <span className="hidden sm:inline">{t("projects.markContacted")}</span>
              </Button>
            )}
            {e.status !== "archived" && (
              <Button variant="secondary" size="lg" icon={<Archive className="size-4" />} onClick={() => status("archived")} aria-label={t("projects.archive")}>
                <span className="hidden sm:inline">{t("projects.archive")}</span>
              </Button>
            )}
            <Button size="lg" className="flex-1 lg:flex-none" icon={<Hammer className="size-5" />} onClick={() => setOpen(true)}>
              {t("projects.convert")}
            </Button>
          </div>
        </div>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("projects.convert")}
        footer={
          <Button block size="lg" onClick={convert} loading={pending}>
            {t("projects.create")}
          </Button>
        }
      >
        <div className="grid gap-5">
          <Field label={t("projects.name")}>{(p) => <Input {...p} value={title} onChange={(ev) => setTitle(ev.target.value)} />}</Field>
          <Field label={t("projects.address")}>{(p) => <Input {...p} value={address} onChange={(ev) => setAddress(ev.target.value)} />}</Field>
          <div className="grid gap-2">
            <span className="text-sm font-bold">{t("projects.template")}</span>
            <Chips value={templateId} onChange={setTemplateId} options={templates.map((x) => ({ value: x.id, label: x.name }))} />
            {tpl && <p className="text-sm text-ink-2">{tpl.stages.join(", ")}</p>}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
