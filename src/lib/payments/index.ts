import "server-only";
import { features } from "@/lib/env";

export type Checkout = { url: string; ref: string };

/**
 * Payment provider seam. Stripe is not wired yet: until STRIPE_SECRET_KEY exists
 * this returns null and admins mark bookings as paid by hand.
 *
 * To connect Stripe later: create a Checkout Session here (amount in cents, AUD,
 * metadata.booking_id), return its url and id, and handle
 * checkout.session.completed in /api/stripe/webhook by running the mark_paid transition.
 */
export async function createCheckout(_booking: { id: string; ref: string; amount: number; email: string }): Promise<Checkout | null> {
  if (!features.stripe) return null;
  return null;
}
