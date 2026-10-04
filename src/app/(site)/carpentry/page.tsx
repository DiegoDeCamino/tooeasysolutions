import type { Metadata } from "next";
import Image from "next/image";
import { Camera, ClipboardCheck, Smartphone } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { EnquiryForm } from "./EnquiryForm";

export const metadata: Metadata = {
  title: "Carpentry and renovations | Too Easy Solutions",
  description: "Decks, pergolas, kitchens and bathrooms across South West WA. Send photos of your job and we'll come back with a plan.",
};

const WORK = [
  { src: "/images/projects/deck for resort.jpg", title: "Resort deck", place: "Hardwood decking and steps" },
  { src: "/images/projects/kitchen renovation.jpg", title: "Kitchen renovation", place: "Cabinetry, benchtops and layout" },
  { src: "/images/projects/pergola and privacy screen.jpg", title: "Pergola and privacy screen", place: "Outdoor living extension" },
  { src: "/images/projects/vanity renovation.jpg", title: "Vanity renovation", place: "Bathroom refresh" },
];

const HOW = [
  { icon: Camera, title: "Send a few photos", body: "Show us the space and tell us what you have in mind. Rough ideas are fine." },
  { icon: ClipboardCheck, title: "We visit and quote", body: "We'll call to talk it through, measure up and give you a clear plan and price." },
  { icon: Smartphone, title: "Watch it come together", body: "You get a private page with progress photos at every stage of the build." },
];

export default function CarpentryPage() {
  return (
    <div className="grid gap-16 md:gap-24">
      <section className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="grid gap-5">
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-ink md:text-6xl">
            Decks, pergolas and kitchens, built properly.
          </h1>
          <p className="max-w-[44ch] text-lg text-ink-2">
            Tell us what you have in mind and send a few photos. We&apos;ll come back with a plan and a quote.
          </p>
          <a href="#enquire" className={buttonClass({ size: "lg", className: "justify-self-start" })}>
            Tell us about your job
          </a>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lift md:aspect-[5/4]">
          <Image
            src="/images/workforce and carpentry.jpg"
            alt="The Too Easy crew talking through a job on a timber-frame build site"
            fill
            priority
            sizes="(min-width: 768px) 55vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="grid gap-5">
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Recent work</h2>
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
          {WORK.map((w, i) => (
            <figure key={w.src} className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]">
              <div className={`relative overflow-hidden rounded-2xl ${i % 2 ? "aspect-[4/5]" : "aspect-[4/3]"}`}>
                <Image src={w.src} alt={w.title} fill sizes="(min-width: 1024px) 31vw, 78vw" className="object-cover transition duration-500 hover:scale-[1.03]" />
              </div>
              <figcaption className="mt-3 grid gap-0.5">
                <span className="font-extrabold text-ink">{w.title}</span>
                <span className="text-sm text-ink-2">{w.place}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="enquire" className="grid scroll-mt-24 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="grid content-start gap-8 lg:sticky lg:top-28">
          <div className="grid gap-3">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Tell us what you need</h2>
            <p className="max-w-[44ch] text-ink-2">No obligation. Every job is different, so there&apos;s no instant price here. A real person reads every enquiry.</p>
          </div>
          <ol className="grid gap-6">
            {HOW.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
                  <Icon className="size-6" />
                </span>
                <div className="grid gap-1">
                  <span className="font-extrabold text-ink">{title}</span>
                  <span className="text-[15px] text-ink-2">{body}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <EnquiryForm turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null} />
      </section>
    </div>
  );
}
