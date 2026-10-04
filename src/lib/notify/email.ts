import "server-only";
import { sendEmail } from "@/lib/sendEmail";

type Mail = { to: string; subject: string; html: string; replyTo?: string };

/**
 * Send an email without ever throwing.
 * Resend when RESEND_API_KEY is set, else the legacy SMTP transport, else console.
 */
export async function sendMail({ to, subject, html, replyTo }: Mail) {
  try {
    if (process.env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM || "Too Easy Solutions <onboarding@resend.dev>",
          to: [to],
          subject,
          html,
          reply_to: replyTo,
        }),
      });
      if (!res.ok) console.error("[mail] Resend error", res.status, await res.text());
      return;
    }
    if (process.env.SMTP_HOST) {
      await sendEmail({ to, subject, html });
      return;
    }
    console.log(`[mail] (no provider configured) to=${to} subject="${subject}"`);
  } catch (err) {
    console.error("[mail] failed", err);
  }
}

/** The business inbox that receives new requests. */
export function businessInbox() {
  return process.env.CONTACT_EMAIL || "tooeasysolutionswa@gmail.com";
}
