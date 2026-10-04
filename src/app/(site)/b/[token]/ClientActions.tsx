"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { History } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { cancelByClient, createClientAccount } from "./actions";

export function ClientActions({ token, canCancel }: { token: string; canCancel: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!canCancel) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="justify-self-start text-sm font-bold text-ink-2 underline underline-offset-4 hover:text-danger">
        Cancel this booking
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Cancel this booking?"
        description="You won't be charged. You can book again any time."
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" block onClick={() => setOpen(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              block
              loading={pending}
              onClick={() =>
                start(async () => {
                  const res = await cancelByClient(token);
                  if (res.ok) {
                    setOpen(false);
                    router.refresh();
                  } else setError(res.error);
                })
              }
            >
              Yes, cancel
            </Button>
          </div>
        }
      >
        {error && <p className="font-bold text-danger">{error}</p>}
      </Sheet>
    </>
  );
}

export function AccountCard({ token, email }: { token: string; email: string }) {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "existing" | "created">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (state === "existing") {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-5">
        <p className="font-bold">You already have an account with {email}.</p>
        <Link href="/login?next=/account" className={buttonClass({ variant: "secondary" })}>
          Sign in
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5 md:grid-cols-[1fr_minmax(0,320px)] md:items-end">
      <div className="flex gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <History className="size-5" />
        </span>
        <div className="grid gap-1">
          <h2 className="text-lg font-extrabold">Keep track of your bookings</h2>
          <p className="text-[15px] text-ink-2">Optional. Pick a password and see all your cleans in one place, using {email}.</p>
        </div>
      </div>
      <form
        className="grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          start(async () => {
            const res = await createClientAccount(token, password);
            if (!res.ok) return setError(res.error);
            if (res.data.existing) setState("existing");
            else {
              setState("created");
              router.push("/account");
            }
          });
        }}
      >
        <Field label="Password" hint="At least 8 characters" error={error ?? undefined}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        <Button type="submit" variant="ink" loading={pending}>
          Create account
        </Button>
      </form>
    </section>
  );
}
