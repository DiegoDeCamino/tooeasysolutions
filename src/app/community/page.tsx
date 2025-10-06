import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community | Too Easy Solutions",
  description:
    "Margaret River and South West is our home. Every job is our way of getting closer to the community and giving back.",
};

export default function CommunityPage() {
  return (
    <div className="space-y-8 sm:space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-teal to-brand-orange">
          Our Community
        </h1>
        <p className="text-lg sm:text-xl text-black/70 max-w-3xl mx-auto italic">
          &quot;If we all work together, life can be too easy!&quot;
        </p>
      </section>

      <section className="card p-6 sm:p-10 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="relative aspect-[9/16] max-w-md mx-auto w-full overflow-hidden rounded-xl shadow-lg">
            <Image
              src="/images/Community/community collage.jpg"
              alt="Community collage"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="prose prose-lg max-w-none space-y-6">
            <div className="text-base sm:text-lg text-black/80 leading-relaxed space-y-4">
              <p>
                At Too Easy Solutions, community means a lot to us! Margaret
                River and South West is our home, and every Job is our way of
                getting closer to the community and giving back — by supporting
                our neighbours, caring for their belongings, and making life
                just a little bit easier. If we all work together, life can be
                too easy!
              </p>

              <div className="pt-6 border-t border-black/10">
                <p className="text-lg font-semibold text-brand-charcoal">
                  With Gratitude.
                </p>
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-teal to-brand-orange">
                  Diego
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="card p-6 space-y-3">
          <h3 className="text-xl font-bold text-brand-charcoal">Local First</h3>
          <p className="text-black/70 leading-relaxed">
            We&apos;re proud to be part of the Margaret River and South West
            community. Supporting local means supporting each other.
          </p>
        </div>

        <div className="card p-6 space-y-3">
          <h3 className="text-xl font-bold text-brand-charcoal">
            Caring Service
          </h3>
          <p className="text-black/70 leading-relaxed">
            Every job is done with care and respect. Your belongings and your
            trust matter to us, and we treat both with the utmost care.
          </p>
        </div>
      </section>

      <section className="card p-6 sm:p-8 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold">
          Ready to Work Together?
        </h2>
        <p className="text-black/70 max-w-2xl mx-auto">
          Whether you need a parcel delivered, a removal job done, or
          maintenance help — we&apos;re here for you. Let&apos;s make life too
          easy, together!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link href="/" className="btn-primary">
            Get a Quote
          </Link>
          <Link href="/contact" className="btn-secondary">
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
