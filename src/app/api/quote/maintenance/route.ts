import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/sendEmail";
import { verifyTurnstile } from "@/lib/verifyTurnstile";

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { token } = data || {};
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(token);
    if (!valid) return new NextResponse("captcha_failed", { status: 400 });
  }
  const html = `<h1>Maintenance Quote</h1><pre>${JSON.stringify(data, null, 2)}</pre>`;
  await sendEmail({ subject: "Maintenance Quote Request", html });
  return NextResponse.json({ ok: true });
}


