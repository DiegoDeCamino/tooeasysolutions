export const metadata = { title: "Contact — Too Easy Solutions" };

import ContactForm from "@/components/contact/ContactForm";

export default function ContactPage() {
  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold">Contact</h1>
        <p>
          Phone:{" "}
          <a className="text-brand-teal" href="tel:0432689687">
            0432 689 687
          </a>
        </p>
        <p>
          Email:{" "}
          <a
            className="text-brand-teal"
            href="mailto:tooeasyparceldelivery@gmail.com"
          >
            tooeasyparceldelivery@gmail.com
          </a>
        </p>
        <div className="rounded-xl overflow-hidden border border-black/5">
          <iframe
            title="Service Area"
            src="https://www.openstreetmap.org/export/embed.html?bbox=114.9%2C-35.4%2C116.4%2C-31.5&layer=mapnik"
            className="w-full h-[300px]"
          ></iframe>
        </div>
      </div>
      <ContactForm />
    </div>
  );
}
