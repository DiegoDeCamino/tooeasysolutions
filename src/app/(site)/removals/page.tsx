import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Phone } from "lucide-react";
import { QuoteLink } from "@/components/quote/QuoteLink";
import { Reveal } from "@/components/site/Reveal";
import { CONTACT } from "@/components/site/nav";
import { REMOVAL_PHOTOS, REMOVAL_SERVICES } from "@/data/removals";

export const metadata: Metadata = {
  title: "Removals in Margaret River and the South West | Too Easy Solutions",
  description:
    "House moves, business moves, single items and furniture assembly from Margaret River to Perth and Augusta. A local crew that treats your things like their own.",
};

const STEPS = [
  { title: "Tell us what's moving", body: "Where from, where to, and roughly what's going. A list or a few photos is plenty." },
  { title: "Get a clear price", body: "We come back with a quote and a date that suits you." },
  { title: "Moving day", body: "We wrap, load, carry in and put the furniture back together." },
];

export default function RemovalsPage() {
  return (
    <div className="grid gap-20 md:gap-28">
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <Reveal className="grid gap-6">
          <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
            Removals, handled with care.
          </h1>
          <p className="max-w-[48ch] text-lg leading-relaxed text-ink-2">
            House and business moves, single items and furniture, from Margaret River to Perth and Augusta.
          </p>
          <div className="flex flex-wrap gap-3">
            <QuoteLink service="removals" className="btn-primary h-12 px-6 text-base">
              Get a free quote <ArrowRight size={18} aria-hidden />
            </QuoteLink>
            <a href={CONTACT.phoneHref} className="btn-secondary h-12 px-6 text-base">
              <Phone size={18} aria-hidden /> {CONTACT.phone}
            </a>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="grid grid-cols-2 gap-4">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lift">
            <Image
              src={REMOVAL_PHOTOS.truck.src}
              alt={REMOVAL_PHOTOS.truck.alt}
              fill
              priority
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="relative mt-12 aspect-[3/4] overflow-hidden rounded-2xl shadow-lift">
            <Image
              src={REMOVAL_PHOTOS.dresser.src}
              alt={REMOVAL_PHOTOS.dresser.alt}
              fill
              priority
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </section>

      <section className="grid gap-8">
        <Reveal className="grid max-w-2xl gap-3">
          <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">What we move</h2>
          <p className="text-lg leading-relaxed text-ink-2">Big or small, across town or across the region.</p>
        </Reveal>
        <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
          {REMOVAL_SERVICES.map((r, i) => (
            <li key={r.title} className="border-t border-line py-6">
              <Reveal delay={i * 0.05} className="grid gap-2">
                <span className="font-display text-xl font-bold tracking-tight">{r.title}</span>
                <span className="leading-relaxed text-ink-2">{r.body}</span>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid items-center gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-14">
        <Reveal className="grid grid-cols-2 gap-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image src={REMOVAL_PHOTOS.fridge.src} alt={REMOVAL_PHOTOS.fridge.alt} fill sizes="(min-width: 768px) 28vw, 50vw" className="object-cover" />
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image src={REMOVAL_PHOTOS.assembly.src} alt={REMOVAL_PHOTOS.assembly.alt} fill sizes="(min-width: 768px) 28vw, 50vw" className="object-cover" />
          </div>
        </Reveal>
        <Reveal delay={0.08} className="grid gap-6">
          <h2 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight md:text-4xl">How it works</h2>
          <ol className="grid gap-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[2.25rem_1fr] gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft font-display font-bold text-accent-strong">
                  {i + 1}
                </span>
                <span className="grid gap-0.5">
                  <span className="font-bold">{s.title}</span>
                  <span className="text-[15px] leading-relaxed text-ink-2">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-ink-2">Cover options for your items are available on request.</p>
        </Reveal>
      </section>

      <section className="grid justify-items-start gap-5 rounded-2xl bg-accent-strong px-6 py-12 text-white sm:px-10 md:py-16">
        <h2 className="max-w-[20ch] font-display text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
          Planning a move?
        </h2>
        <p className="max-w-[50ch] text-lg leading-relaxed text-white/85">
          Tell us what&apos;s moving and when. We&apos;ll come back with a clear price, no obligation.
        </p>
        <QuoteLink
          service="removals"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-accent-strong transition hover:bg-white/90 active:scale-[0.98]"
        >
          Get a free quote <ArrowRight size={18} aria-hidden />
        </QuoteLink>
      </section>
    </div>
  );
}
