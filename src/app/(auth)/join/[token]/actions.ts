"use server";

import { after } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE } from "@/lib/i18n";
import { notify } from "@/lib/notify";
import { zodFieldErrors } from "@/lib/auth";
import { loadInvite } from "@/lib/invites";

export type JoinState = { error?: "invite" | "emailTaken" | "failed"; fieldErrors?: Record<string, string> } | null;

const schema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  phone: z.string().trim().min(6, "Enter a mobile number").max(30),
  password: z.string().min(8, "At least 8 characters"),
  locale: z.enum(["en", "es"]),
});

export async function joinCrew(token: string, _: JoinState, form: FormData): Promise<JoinState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { fieldErrors: zodFieldErrors(parsed.error.issues) };
  const input = parsed.data;

  const invite = await loadInvite(token);
  if (!invite) return { error: "invite" };

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });
  if (error || !created.user) {
    return { error: /already|registered|exists/i.test(error?.message ?? "") ? "emailTaken" : "failed" };
  }

  await admin
    .from("profiles")
    .update({
      full_name: input.fullName,
      phone: input.phone,
      locale: input.locale,
      role: invite.role,
      skills: invite.skills,
    })
    .eq("id", created.user.id);
  await admin.from("invites").update({ uses: invite.uses + 1 }).eq("id", invite.id);

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: input.email, password: input.password });
  (await cookies()).set(LOCALE_COOKIE, input.locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  after(() =>
    notify(
      { roles: ["admin"] },
      { kind: "crew_joined", title: `${input.fullName} joined the crew`, body: `Joined as ${invite.role}`, href: "/app/crew" },
    ),
  );
  redirect("/app?welcome=1");
}
