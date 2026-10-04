import type { Metadata } from "next";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadPricing } from "@/lib/pricing/load";
import { todayPerth } from "@/lib/format";
import { BookingWizard } from "./BookingWizard";

export const metadata: Metadata = {
  title: "Book a clean | Too Easy Solutions",
  description: "Get an instant price for a house, end of lease or office clean in South West WA and request a time that suits you.",
};

export const dynamic = "force-dynamic";

export default async function BookCleaningPage() {
  const pricing = await loadPricing(createAdminClient(), { activeOnly: true });

  return (
    <div className="grid gap-8">
      <section className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3">
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-ink md:text-5xl">Book a clean</h1>
          <p className="max-w-[46ch] text-lg text-ink-2">
            Tell us about your place and see the price straight away. We confirm every booking personally.
          </p>
        </div>
        <div className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl md:block">
          <Image src="/images/cleaning.jpg" alt="A freshly cleaned living room" fill sizes="320px" className="object-cover" priority />
        </div>
      </section>
      <BookingWizard pricing={pricing} today={todayPerth()} turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null} />
    </div>
  );
}
