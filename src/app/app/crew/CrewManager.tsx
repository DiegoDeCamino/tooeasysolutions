"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, MessageCircle, Phone, Share2, UserPlus, Users } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { formatInstantDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Avatar, Badge, Card, EmptyState } from "@/components/ui/Display";
import { Button } from "@/components/ui/Button";
import { Chips } from "@/components/ui/Chips";
import { Switch } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { createInvite, revokeInvite, updateMember } from "./actions";

type Role = "admin" | "supervisor" | "worker";
type Skill = "cleaning" | "carpentry";
type Person = { id: string; full_name: string; email: string; phone: string | null; role: string; skills: string[]; active: boolean };
type Invite = { id: string; token: string; role: string; skills: string[]; uses: number; max_uses: number; expires_at: string };

export function CrewManager({ me, people, invites, siteUrl }: { me: string; people: Person[]; invites: Invite[]; siteUrl: string }) {
  const { t, locale } = useT();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [role, setRole] = useState<Role>("worker");
  const [skills, setSkills] = useState<Skill[]>(["cleaning"]);
  const [days, setDays] = useState("7");
  const [uses, setUses] = useState("1");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);

  const roles = (["worker", "supervisor", "admin"] as Role[]).map((r) => ({ value: r, label: t(`roles.${r}`) }));
  const skillOptions = (["cleaning", "carpentry"] as Skill[]).map((s) => ({ value: s, label: t(`skills.${s}`) }));
  const inviteUrl = (token: string) => `${siteUrl}/join/${token}`;
  const shareText = (url: string) => `${t("auth.joinTitle")}: ${url}`;

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast(t("common.copied"));
    window.setTimeout(() => setCopied(false), 2000);
  };

  const share = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Too Easy", text: shareText(url), url });
      } catch {
        /* dismissed */
      }
    } else copy(url);
  };

  const create = () =>
    start(async () => {
      const res = await createInvite({ role, skills, days: Number(days), maxUses: Number(uses) });
      if (!res.ok) return toast(res.error, "error");
      setLink(inviteUrl(res.data.token));
      router.refresh();
    });

  const closeInvite = () => {
    setInviteOpen(false);
    setLink(null);
  };

  return (
    <>
      <Button size="lg" icon={<UserPlus className="size-5" />} onClick={() => setInviteOpen(true)} className="justify-self-start">
        {t("crew.inviteTitle")}
      </Button>

      {invites.length > 0 && (
        <section className="grid gap-2">
          <h2 className="text-sm font-extrabold text-ink-2">{t("crew.pending")}</h2>
          <Card className="divide-y divide-line">
            {invites.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-ink-2">
                  <Link2 className="size-5" />
                </span>
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="accent">{t(`roles.${i.role}` as "roles.worker")}</Badge>
                    {i.skills.map((s) => (
                      <Badge key={s}>{t(`skills.${s}` as "skills.cleaning")}</Badge>
                    ))}
                  </div>
                  <span className="text-[13px] text-ink-2">
                    {t("crew.used", { uses: i.uses, max: i.max_uses })} · {t("crew.expiresOn", { date: formatInstantDate(i.expires_at, locale) })}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" icon={<Share2 className="size-4" />} onClick={() => share(inviteUrl(i.token))}>
                    {t("common.share")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger"
                    onClick={() =>
                      start(async () => {
                        await revokeInvite(i.id);
                        router.refresh();
                      })
                    }
                  >
                    {t("crew.revoke")}
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}

      <section className="grid gap-2">
        <h2 className="text-sm font-extrabold text-ink-2">
          {t("crew.people")} ({people.filter((p) => p.active).length})
        </h2>
        {people.length === 0 ? (
          <EmptyState icon={<Users className="size-6" />} title={t("crew.noCrew")} />
        ) : (
          <Card className="divide-y divide-line overflow-hidden">
            {people.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setEditing(p)}
                className={cn("flex w-full items-center gap-3 p-4 text-left hover:bg-surface-2", !p.active && "opacity-50")}
              >
                <Avatar name={p.full_name} size={44} />
                <div className="grid min-w-0 flex-1 gap-1">
                  <span className="truncate font-extrabold">
                    {p.full_name}
                    {p.id === me && <span className="ml-1.5 text-sm font-bold text-ink-2">({t("nav.me")})</span>}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={p.role === "admin" ? "accent" : "neutral"}>{t(`roles.${p.role}` as "roles.worker")}</Badge>
                    {p.skills.map((s) => (
                      <Badge key={s}>{t(`skills.${s}` as "skills.cleaning")}</Badge>
                    ))}
                    {!p.active && <Badge tone="danger">{t("crew.inactive")}</Badge>}
                  </div>
                </div>
                {p.phone && (
                  <a
                    href={`tel:${p.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${t("common.call")} ${p.full_name}`}
                    className="inline-flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-strong"
                  >
                    <Phone className="size-5" />
                  </a>
                )}
              </button>
            ))}
          </Card>
        )}
      </section>

      <Sheet
        open={inviteOpen}
        onClose={closeInvite}
        title={link ? t("crew.linkReady") : t("crew.inviteTitle")}
        description={link ? t("crew.linkHint") : undefined}
        footer={
          link ? (
            <Button block variant="secondary" onClick={closeInvite}>
              {t("common.done")}
            </Button>
          ) : (
            <Button block size="lg" onClick={create} loading={pending}>
              {t("crew.createLink")}
            </Button>
          )
        }
      >
        {link ? (
          <div className="grid gap-3">
            <div className="break-all rounded-xl bg-surface-2 p-3 font-mono text-sm">{link}</div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="secondary" icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />} onClick={() => copy(link)}>
                {copied ? t("common.copied") : t("common.copy")}
              </Button>
              <Button variant="secondary" icon={<Share2 className="size-4" />} onClick={() => share(link)}>
                {t("common.share")}
              </Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText(link))}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-[15px] font-bold text-[#0b2e17]"
              >
                <MessageCircle className="size-4" /> {t("crew.whatsapp")}
              </a>
            </div>
          </div>
        ) : (
          <div className="grid gap-5">
            <div className="grid gap-2">
              <span className="text-sm font-bold">{t("crew.role")}</span>
              <Chips value={role} onChange={setRole} options={roles} />
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-bold">{t("crew.skills")}</span>
              <Chips multiple value={skills} onChange={setSkills} options={skillOptions} />
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-bold">{t("crew.expires")}</span>
              <Chips
                value={days}
                onChange={setDays}
                options={[
                  { value: "1", label: t("crew.day") },
                  { value: "7", label: t("crew.days", { n: 7 }) },
                  { value: "30", label: t("crew.days", { n: 30 }) },
                ]}
              />
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-bold">{t("crew.uses")}</span>
              <Chips
                value={uses}
                onChange={setUses}
                options={[
                  { value: "1", label: t("crew.once") },
                  { value: "5", label: t("crew.times", { n: 5 }) },
                  { value: "25", label: t("crew.times", { n: 25 }) },
                ]}
              />
            </div>
          </div>
        )}
      </Sheet>

      <MemberSheet key={editing?.id ?? "none"} person={editing} me={me} onClose={() => setEditing(null)} />
    </>
  );

}

function MemberSheet({ person, me, onClose }: { person: Person | null; me: string; onClose: () => void }) {
  const { t } = useT();
  const toast = useToast();
  const router = useRouter();
  const roles = (["worker", "supervisor", "admin"] as Role[]).map((r) => ({ value: r, label: t(`roles.${r}`) }));
  const skillOptions = (["cleaning", "carpentry"] as Skill[]).map((s) => ({ value: s, label: t(`skills.${s}`) }));
  const [r, setR] = useState<Role>((person?.role as Role) ?? "worker");
  const [s, setS] = useState<Skill[]>((person?.skills as Skill[]) ?? []);
  const [active, setActive] = useState(person?.active ?? true);
  const [saving, startSave] = useTransition();
  return (
    <Sheet
      key={person?.id}
      open={Boolean(person)}
      onClose={onClose}
      title={person?.full_name ?? ""}
      description={person ? `${person.email}${person.phone ? `, ${person.phone}` : ""}` : undefined}
      footer={
        <Button
          block
          size="lg"
          loading={saving}
          onClick={() =>
            person &&
            startSave(async () => {
              const res = await updateMember(person.id, { role: r, skills: s, active });
              if (!res.ok) return toast(res.error, "error");
              toast(t("settings.saved"));
              onClose();
              router.refresh();
            })
          }
        >
          {t("common.save")}
        </Button>
      }
    >
      <div className="grid gap-5">
        <div className="grid gap-2">
          <span className="text-sm font-bold">{t("crew.role")}</span>
          <Chips value={r} onChange={setR} options={roles} />
        </div>
        <div className="grid gap-2">
          <span className="text-sm font-bold">{t("crew.skills")}</span>
          <Chips multiple value={s} onChange={setS} options={skillOptions} />
        </div>
        {person?.id !== me && <Switch checked={active} onChange={setActive} label={t("crew.active")} />}
      </div>
    </Sheet>
  );
}
