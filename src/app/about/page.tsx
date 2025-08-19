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
          <h1 className="text-3xl font-extrabold">About Us</h1>
          <p>
            Too Easy Solutions is a community-based courier, removalist, towing
            and home maintenance service proudly operating across the South West
            of Western Australia, from Perth to Augusta.
          </p>
          <p>
            Our mission is simple: be local, reliable and affordable. We started
            in the Margaret River region helping neighbours move items and
            quickly grew through word of mouth. Today, we continue to focus on
            friendly service, transparent pricing and fast response times.
          </p>
          <p>
            Whether it&apos;s a single parcel, a home move, a vehicle tow, or a
            handyman job — we&apos;re here to help. Local. Affordable. Too Easy.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Image
              src="/images/logo.png"
              alt="Too Easy Solutions"
              width={120}
              height={120}
              className="h-12 w-auto"
            />
            <span className="text-sm text-black/70">
              Local. Affordable. Too Easy.
            </span>
          </div>
        </div>
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
          <Image
            src="/images/crew/diego working main.jpg"
            alt="Diego working"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md">
          <Image
            src="/images/crew/diego working 1.jpg"
            alt="On the job"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md">
          <Image
            src="/images/crew/Diego and customer 1.jpg"
            alt="With a customer"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md">
          <Image
            src="/images/crew/Diego and customers 2.jpg"
            alt="Delivering to clients"
            fill
            className="object-cover"
          />
        </div>
      </div>

      <Carousel
        slides={[
          {
            src: "/images/crew/diego and customers 3.jpg",
            alt: "Community deliveries",
          },
          { src: "/images/crew/diego working 1.jpg", alt: "On the job" },
          {
            src: "/images/crew/Diego and customers 2.jpg",
            alt: "Delivering to clients",
          },
        ]}
        intervalMs={3500}
      />
    </div>
  );
}
