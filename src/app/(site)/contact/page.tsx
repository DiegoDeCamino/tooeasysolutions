import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/contact/ContactForm";
import { CONTACT } from "@/components/site/nav";

export const metadata: Metadata = { title: "Contact | Too Easy Solutions" };

export default function ContactPage() {
  return (
    <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
      <div className="grid gap-8">
        <div className="grid gap-4">
          <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">Get in touch</h1>
          <p className="max-w-[44ch] text-lg leading-relaxed text-ink-2">
            Questions, a job you&apos;re planning or just want to say hello. We&apos;re around 7 days.
          </p>
        </div>
        <div className="grid gap-4">
          <a href={CONTACT.phoneHref} className="flex items-center gap-4 font-display text-2xl font-bold hover:text-accent-strong">
            <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
              <Phone size={20} aria-hidden />
            </span>
            {CONTACT.phone}
          </a>
          <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-4 break-all text-lg font-bold hover:text-accent-strong">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
              <Mail size={20} aria-hidden />
            </span>
            {CONTACT.email}
          </a>
          <span className="flex items-center gap-4 text-lg font-bold">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
              <MapPin size={20} aria-hidden />
            </span>
            Margaret River, servicing Perth to Augusta
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line">
          <iframe
            title="Service area map, Perth to Augusta"
            src="https://www.openstreetmap.org/export/embed.html?bbox=114.9%2C-35.4%2C116.4%2C-31.5&layer=mapnik"
            className="h-[280px] w-full"
            loading="lazy"
          ></iframe>
        </div>
      </div>
      <ContactForm />
    </div>
  );
}
