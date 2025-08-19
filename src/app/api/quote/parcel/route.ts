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

  const html = `<h1>Parcel Quote</h1>
  <p><strong>From:</strong> ${data.from}</p>
  <p><strong>To:</strong> ${data.to}</p>
  <p><strong>Pickup Type:</strong> ${data.fromType}</p>
  <p><strong>Dropoff Type:</strong> ${data.toType}</p>
  <p><strong>Dangerous Goods:</strong> ${data.dangerousGoods ? "Yes" : "No"}</p>
  <p><strong>Budget:</strong> ${data.budget || ""}</p>
  <h3>Items</h3>
  <pre>${JSON.stringify(data.rows, null, 2)}</pre>
  <h3>User</h3>
  <pre>${JSON.stringify({ name: data.name, email: data.email, phone: data.phone }, null, 2)}</pre>`;

  await sendEmail({ subject: "Parcel Quote Request", html });
  return NextResponse.json({ ok: true });
}


