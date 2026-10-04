"use server";

import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUploadTargets, pathsInScope, type UploadTarget } from "@/lib/media";
import { verifyTurnstile } from "@/lib/verifyTurnstile";
import { emailLayout, notify, sendMail } from "@/lib/notify";
import { siteUrl } from "@/lib/env";
import { categoryLabel } from "@/lib/projects";
import { fail, ok, zodFieldErrors, type ActionResult } from "@/lib/auth";

/** One-shot upload slots for an enquiry that hasn't been saved yet. */
export async function prepareEnquiryUploads(count: number): Promise<ActionResult<{ draftId: string; targets: UploadTarget[] }>> {
  if (count < 1) return ok({ draftId: randomUUID(), targets: [] });
  const draftId = randomUUID();
  try {
    return ok({ draftId, targets: await createUploadTargets("enquiries", draftId, Math.min(count, 10)) });
  } catch {
    return fail("Photo upload is unavailable right now. You can still send your enquiry.");
  }
}

const schema = z.object({
  draftId: z.uuid(),
  photoPaths: z.array(z.string()).max(10),
  category: z.string().min(1, "Pick what you need").max(40),
  description: z.string().trim().min(15, "Tell us a bit more (at least a sentence or two)").max(3000),
  suburb: z.string().trim().min(2, "Enter the suburb").max(80),
  timeframe: z.string().max(40).nullable(),
  budget: z.string().max(40).nullable(),
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email("Enter a valid email"),
  phone: z.string().trim().min(6, "Enter a phone number").max(30),
  token: z.string().nullable(),
});

export async function submitEnquiry(input: z.input<typeof schema>): Promise<ActionResult<{ ref: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields", zodFieldErrors(parsed.error.issues));
  const e = parsed.data;
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY && !(await verifyTurnstile(e.token))) {
    return fail("Please complete the security check");
  }

  const photos = pathsInScope(e.photoPaths, "enquiries", e.draftId);
  const { data, error } = await createAdminClient()
    .from("enquiries")
    .insert({
      name: e.name,
      email: e.email.toLowerCase(),
      phone: e.phone,
      suburb: e.suburb,
      category: e.category,
      description: e.description,
      timeframe: e.timeframe,
      budget_range: e.budget,
      photo_paths: photos,
    })
    .select("id, ref")
    .single();
  if (error || !data) return fail("We couldn't send your enquiry. Please try again.");

  after(async () => {
    await notify(
      { roles: ["admin"] },
      {
        kind: "enquiry_new",
        title: `New ${categoryLabel(e.category).toLowerCase()} enquiry from ${e.name}`,
        body: `${e.suburb}. ${photos.length} ${photos.length === 1 ? "photo" : "photos"}`,
        href: `/app/projects/enquiries/${data.id}`,
      },
      {
        emailAdmins: {
          subject: `New carpentry enquiry ${data.ref}: ${categoryLabel(e.category)} in ${e.suburb}`,
          html: emailLayout({
            heading: "New carpentry enquiry",
            intro: e.description,
            rows: [
              ["From", `${e.name} (${e.phone})`],
              ["Email", e.email],
              ["Job", categoryLabel(e.category)],
              ["Suburb", e.suburb],
              ["Timeframe", e.timeframe],
              ["Budget", e.budget],
              ["Photos", photos.length],
            ],
            cta: { label: "Open in the app", url: siteUrl(`/app/projects/enquiries/${data.id}`) },
          }),
        },
      },
    );
    await sendMail({
      to: e.email,
      subject: `We got your enquiry (${data.ref})`,
      html: emailLayout({
        heading: `Thanks ${e.name.split(" ")[0]}, we'll be in touch`,
        intro: "We'll look over your photos and details and get back to you to talk it through, usually within one business day.",
        rows: [
          ["Reference", data.ref],
          ["Job", categoryLabel(e.category)],
          ["Suburb", e.suburb],
        ],
      }),
    });
  });

  return ok({ ref: data.ref });
}
