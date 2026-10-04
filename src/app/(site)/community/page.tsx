import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";

export const metadata: Metadata = {
  title: "Community | Too Easy Solutions",
  description:
    "Margaret River and the South West is our home. Every job is our way of getting closer to the community and giving back.",
};

const COMMUNITY_WORK = [
  { src: "/images/carpentry/veranda-after.jpg", alt: "Pepper's veranda, a timber veranda on a local home" },
  { src: "/images/carpentry/spa-pergola.jpg", alt: "Timber spa pergola on a bush block" },
  { src: "/images/carpentry/deck-patio-roof-after.jpg", alt: "Hardwood deck and patio roof on a green weatherboard house" },
];

export default function CommunityPage() {
  return (
    <div className="grid gap-20 md:gap-28">
      <section className="grid items-start gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-14">
        <Reveal className="grid gap-8">
          <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
            Our community
          </h1>
          <div className="grid gap-5 text-lg leading-relaxed text-ink-2">
            <p>
              At Too Easy Solutions, community means a lot to us. Margaret River and the South West is our home, and
              every job is our way of getting closer to the community and giving back: supporting our neighbours,
              caring for their homes and belongings, and making life just a little bit easier.
            </p>
            <p>
              The decks, verandas and pergolas we build become part of everyday life for local families. That&apos;s
              what keeps us going.
            </p>
          </div>
          <figure className="grid gap-3 border-l-4 border-accent-strong pl-5">
            <blockquote className="font-display text-2xl font-bold leading-snug tracking-tight text-ink md:text-3xl">
              &ldquo;If we all work together, life can be too easy!&rdquo;
            </blockquote>
            <figcaption className="text-ink-2">
              With gratitude, <span className="font-bold text-ink">Diego</span>
            </figcaption>
          </figure>
        </Reveal>
        <Reveal delay={0.1} className="relative mx-auto aspect-[9/16] w-full max-w-sm overflow-hidden rounded-2xl shadow-lift">
          <Image
            src="/images/Community/community collage.jpg"
            alt="Collage of photos of the Too Easy crew with clients and on jobs around the region"
            fill
            priority
            sizes="(min-width: 768px) 30vw, 90vw"
            className="object-cover"
          />
        </Reveal>
      </section>

      <section className="grid gap-8">
        <Reveal className="grid max-w-2xl gap-3">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">Built for our neighbours</h2>
          <p className="text-lg leading-relaxed text-ink-2">
            A few of the carpentry projects we&apos;ve built for people around Margaret River.
          </p>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr]">
          {COMMUNITY_WORK.map((w, i) => (
            <Reveal
              key={w.src}
              delay={i * 0.06}
              className={`relative overflow-hidden rounded-2xl ${i === 0 ? "aspect-[4/3] sm:aspect-auto sm:min-h-[340px]" : "aspect-[4/5]"}`}
            >
              <Image src={w.src} alt={w.alt} fill sizes="(min-width: 640px) 35vw, 100vw" className="object-cover" />
            </Reveal>
          ))}
        </div>
        <Link href="/projects" className="group inline-flex items-center gap-2 justify-self-start font-bold text-accent-strong">
          See all carpentry projects
          <ArrowRight size={18} className="transition group-hover:translate-x-1" aria-hidden />
        </Link>
      </section>

      <section className="grid justify-items-start gap-5 rounded-2xl bg-surface-2 px-6 py-12 sm:px-10">
        <h2 className="max-w-[24ch] font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
          Ready to work together?
        </h2>
        <p className="max-w-[54ch] text-lg leading-relaxed text-ink-2">
          A new deck, a move across town or a hand around the house. Let&apos;s make life too easy, together.
        </p>
        <Link href="/#quote" className="btn-primary h-12 px-6">
          Get a free quote <ArrowRight size={18} aria-hidden />
        </Link>
      </section>
    </div>
  );
}
