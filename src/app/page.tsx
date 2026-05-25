import QuoteTabs from "@/components/quote/QuoteTabs";
import Image from "next/image";
import Link from "next/link";
import Carousel from "@/components/shared/Carousel";

type ServiceCard = {
  title: string;
  src: string;
  alt: string;
};

const SERVICE_CARDS: ServiceCard[] = [
  {
    title: "Parcel Delivery",
    src: "/images/removals.jpg",
    alt: "Parcel delivery across the South West",
  },
  {
    title: "Removals",
    src: "/images/house and commercial removal.jpg",
    alt: "House and commercial removals",
  },
  {
    title: "Cleaning",
    src: "/images/cleaning.jpg",
    alt: "Home and commercial cleaning",
  },
  {
    title: "Home Maintenance",
    src: "/images/home maintenance.jpg",
    alt: "Home maintenance, carpentry and handyman work",
  },
];

export default function Home() {
  return (
    <div className="space-y-10 sm:space-y-12">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-teal via-cyan-700 to-brand-orange min-h-[420px] sm:min-h-[360px] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="relative z-10 w-full p-6 sm:p-10 text-white">
          <div className="max-w-3xl space-y-3">
            <h1 className="font-tangkiwood text-3xl sm:text-5xl leading-tight text-amber-100 drop-shadow">
              One Page. Every Service. All South West WA.
            </h1>
            <h2 className="text-xl sm:text-2xl font-extrabold">
              Removals, couriers, cleaning, and home maintenance — all booked
              right here, serving Perth to Augusta. We are here to help 🌱
            </h2>
            <p className="text-base sm:text-lg opacity-95">
              Stop searching. Start sorting. It&apos;s all Too Easy.
            </p>
            <p>
              <Link
                href="#quote"
                className="inline-flex items-center gap-2 rounded-full bg-white text-brand-charcoal font-bold px-5 py-2.5 shadow-lg hover:shadow-xl transition-shadow"
              >
                👉 Get a Free Quote Today
              </Link>
            </p>
          </div>
          <div id="quote" className="mt-4 sm:mt-6 scroll-mt-24">
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
                  tooeasysolutionswa@gmail.com • 0432 689 687
                </span>
              </div>
              <QuoteTabs />
            </div>
          </div>
        </div>
      </section>

      <Carousel
        slides={[
          { src: "/images/landing page hello.jpg", alt: "Welcome — Hello" },
        ]}
        intervalMs={3500}
        showArrows={false}
        showDots={false}
        aspectClass="aspect-[16/9] sm:aspect-[16/7]"
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {SERVICE_CARDS.map((card) => (
          <article
            key={card.title}
            className="group relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/10 aspect-[4/5]"
          >
            <Image
              src={card.src}
              alt={card.alt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
            <h3 className="absolute inset-x-0 top-4 text-center font-tangkiwood text-white text-2xl sm:text-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] px-3">
              {card.title}
            </h3>
          </article>
        ))}
      </section>
    </div>
  );
}
