import QuoteTabs from "@/components/quote/QuoteTabs";
import Image from "next/image";
import { Package, Move, Wrench, Car } from "lucide-react";
import Carousel from "@/components/shared/Carousel";

export default function Home() {
  return (
    <div className="space-y-10 sm:space-y-12">
      <section className="relative overflow-hidden rounded-2xl bg-[url('/images/hero.jpg')] bg-cover bg-center min-h-[420px] sm:min-h-[360px] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/20" />
        <div className="relative z-10 w-full p-6 sm:p-10 text-white">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-amber-300">
              QUICK QUOTE
            </h1>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Community-Based Couriers & Removalists
            </h2>
            <p className="text-lg opacity-95">
              From Perth to Augusta – We&apos;ve Got You Covered!
            </p>
            <p className="text-base opacity-90">
              Need to send or collect something across the South West? We’re
              your local, friendly movers – fast, reliable, and
              community-focused. Whether it&apos;s a single item or a full move,
              we&apos;re here to help. 🌱 Local. Affordable. Too Easy.
            </p>
          </div>
          <div className="mt-4 sm:mt-6">
            <div className="card p-3 sm:p-6 shadow-2xl ring-1 ring-black/5">
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src="/images/logo.png"
                  alt="Too Easy Solutions"
                  width={40}
                  height={40}
                  className="h-8 w-auto"
                />
                <span className="text-sm text-black/70">
                  tooeasyparceldelivery@gmail.com • 0432 689 687
                </span>
              </div>
              <QuoteTabs />
            </div>
          </div>
        </div>
      </section>

      <Carousel
        slides={[
          { src: "/images/crew/diego working main.jpg", alt: "Diego working" },
          { src: "/images/crew/diego working 1.jpg", alt: "On the job" },
          {
            src: "/images/crew/Diego and customer 1.jpg",
            alt: "With a customer",
          },
        ]}
        intervalMs={3500}
        aspectClass="aspect-[4/3] sm:aspect-[16/9]"
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-5 hover:shadow-2xl transition-shadow">
          <Package className="text-brand-teal" size={40} />
          <h3 className="mt-3 font-bold text-lg">Parcel Delivery</h3>
          <p className="text-sm text-black/70">
            From a letter to a bulky item, we deliver across the South West,
            fast.
          </p>
        </div>
        <div className="card p-4 sm:p-5 hover:shadow-2xl transition-shadow">
          <Move className="text-brand-teal" size={40} />
          <h3 className="mt-3 font-bold text-lg">Removals</h3>
          <p className="text-sm text-black/70">
            Single items to full moves. Careful hands, fair prices.
          </p>
        </div>
        <div className="card p-4 sm:p-5 hover:shadow-2xl transition-shadow">
          <div className="flex items-center gap-3">
            <Car className="text-brand-teal" size={36} />
            <Wrench className="text-brand-orange" size={32} />
          </div>
          <h3 className="mt-3 font-bold text-lg">Towing & Maintenance</h3>
          <p className="text-sm text-black/70">
            Vehicle towing and handy home maintenance — one call, too easy.
          </p>
        </div>
      </section>
    </div>
  );
}
