import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/sendEmail";
import { verifyTurnstile } from "@/lib/verifyTurnstile";

const Body = z.object({
  jobs: z.array(z.string().max(60)).max(12).default([]),
  details: z.string().trim().min(1).max(4000),
  suburb: z.string().trim().max(200).default(""),
  timeframe: z.string().trim().max(60).default(""),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).default(""),
  token: z.string().nullish(),
});

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new NextResponse("invalid", { status: 400 });
  const d = parsed.data;

  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY) {
    if (!(await verifyTurnstile(d.token))) return new NextResponse("captcha_failed", { status: 400 });
  }

  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 12px;color:#6a625b;font-weight:bold;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:8px 12px;color:#2a2522">${value}</td></tr>`;

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.5;max-width:720px;margin:0 auto;padding:20px;color:#2a2522">
    <div style="background:#0a7472;color:#fff;padding:24px;border-radius:12px;margin-bottom:20px">
      <h1 style="margin:0;font-size:24px">New carpentry enquiry</h1>
      <p style="margin:6px 0 0;opacity:.9">Received ${new Date().toLocaleString("en-AU", { timeZone: "Australia/Perth" })}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;background:#f5f2ec;border-radius:12px">
      ${row("Job", d.jobs.length ? d.jobs.map(esc).join(", ") : "<em>Not specified</em>")}
      ${row("Location", d.suburb ? esc(d.suburb) : "<em>Not specified</em>")}
      ${row("Timeframe", esc(d.timeframe || "Not specified"))}
      ${row("Name", `<strong>${esc(d.name)}</strong>`)}
      ${row("Email", `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`)}
      ${d.phone ? row("Phone", `<a href="tel:${esc(d.phone)}">${esc(d.phone)}</a>`) : ""}
    </table>
    <h2 style="font-size:18px;margin:24px 0 8px">Details</h2>
    <div style="background:#fff;border:1px solid #e2dcd1;border-radius:12px;padding:16px;white-space:pre-wrap">${esc(d.details)}</div>
  </body></html>`;

  await sendEmail({ subject: `New carpentry enquiry from ${d.name}`, html });
  return NextResponse.json({ ok: true });
}
