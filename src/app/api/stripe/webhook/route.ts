import { NextResponse } from "next/server";

/** Placeholder for Stripe's checkout.session.completed webhook (see lib/payments). */
export async function POST() {
  return NextResponse.json({ error: "Payments are not connected yet" }, { status: 501 });
}
