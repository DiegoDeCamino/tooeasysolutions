import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CONTACT } from "@/components/site/nav";

export const metadata: Metadata = { title: "FAQ | Too Easy Solutions" };

const faqs = [
  {
    q: "What areas do you service?",
    a: "We're based in Margaret River and work across the South West of Western Australia, from Perth down to Augusta.",
  },
  {
    q: "What kind of carpentry do you do?",
    a: "Decks, pergolas, verandas, sheds, patio roofs, screens and fencing, custom timber pieces like benchtops, and small kitchen and laundry renovations.",
  },
  {
    q: "How do you price a carpentry job?",
    a: "Every job is different, so we quote each one after we've talked it through and, if needed, visited to measure up. You get a clear price before we start.",
  },
  {
    q: "Do I need approval from the shire?",
    a: "Some larger decks, verandas and sheds need approval from the local shire. We'll talk you through what is likely to apply to your job when we quote.",
  },
  {
    q: "Are my items insured during a move?",
    a: "Yes, we can provide cover options on request.",
  },
  {
    q: "What are your operating hours?",
    a: "We're available 7 days, with flexible scheduling for special requests.",
  },
];

export default function FAQPage() {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
      <div className="grid content-start gap-5 lg:sticky lg:top-28">
        <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
          Questions, answered
        </h1>
        <p className="max-w-[40ch] text-lg leading-relaxed text-ink-2">
          Can&apos;t find what you need? Call us on{" "}
          <a href={CONTACT.phoneHref} className="whitespace-nowrap font-bold text-accent-strong">
            {CONTACT.phone}
          </a>{" "}
          or{" "}
          <Link href="/contact" className="font-bold text-accent-strong">
            send a message
          </Link>
          .
        </p>
      </div>
      <ul className="grid content-start">
        {faqs.map((f) => (
          <li key={f.q} className="border-b border-line">
            <details className="group py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-xl font-bold tracking-tight [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus size={22} className="shrink-0 text-ink-2 transition group-open:rotate-45" aria-hidden />
              </summary>
              <p className="max-w-[62ch] pb-5 leading-relaxed text-ink-2">{f.a}</p>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
