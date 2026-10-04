export const metadata = {
  title: "About Us — Too Easy Solutions",
};

import Image from "next/image";
import Carousel from "@/components/shared/Carousel";

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <h1 className="font-tangkiwood text-4xl sm:text-5xl text-brand-charcoal">
            About Us
          </h1>
          <p>
            Too Easy Solutions is a local removals, courier, cleaning and home
            maintenance service proudly operating across the South West of
            Western Australia, from Perth to Augusta.
          </p>
          <p>
            Our mission is simple: be local, reliable and affordable. We
            started in the Margaret River region helping neighbours move items
            and quickly grew through word of mouth. Today, we continue to
            focus on friendly service, transparent pricing and fast response
            times.
          </p>
          <p>
            Whether it&apos;s a parcel across town, a full house move, a deep
            clean, or a handyman job — we&apos;re here to help. One page.
            Every service. All South West WA. Local. Affordable. Too Easy.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Image
              src="/images/logo.png"
              alt="Too Easy Solutions"
              width={120}
              height={120}
              className="h-12 w-auto"
            />
            <span className="font-tangkiwood text-lg text-brand-charcoal">
              Local. Affordable. Too Easy.
            </span>
          </div>
        </div>
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
          <Image
            src="/images/house and commercial removal.jpg"
            alt="House and commercial removals across the South West"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      <Carousel
        slides={[
          {
            src: "/images/removals.jpg",
            alt: "Parcel delivery and removals",
          },
          {
            src: "/images/cleaning.jpg",
            alt: "Home and commercial cleaning",
          },
          {
            src: "/images/home maintenance.jpg",
            alt: "Home maintenance and handyman work",
          },
        ]}
        aspectClass="aspect-[4/3] sm:aspect-[16/9]"
      />

      <Carousel
        slides={[
          {
            src: "/images/furniture assembly.jpg",
            alt: "Furniture assembly",
          },
          {
            src: "/images/workforce and carpentry.jpg",
            alt: "Workforce and carpentry",
          },
          {
            src: "/images/house and commercial removal.jpg",
            alt: "House and commercial removals",
          },
        ]}
        intervalMs={3500}
        aspectClass="aspect-[16/10] sm:aspect-[21/9]"
      />
    </div>
  );
}
