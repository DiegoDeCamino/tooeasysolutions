import Image from "next/image";
import Link from "next/link";
import { QuoteLink } from "@/components/quote/QuoteLink";
import { ArrowRight } from "lucide-react";
import { ProjectGallery } from "@/components/site/ProjectGallery";
import { Reveal } from "@/components/site/Reveal";
import { CARPENTRY_PROJECTS, CARPENTRY_SERVICES } from "@/data/carpentry";

const REMOVALS = [
  { src: "/images/projects/removal.jpg", alt: "Loading an antique wardrobe into the truck" },
  { src: "/images/projects/removal 2.jpg", alt: "Two of the crew carrying a timber dresser across a garden" },
];

export default function ProjectsPage() {
  return (
    <div className="grid gap-20 md:gap-28">
      <Reveal className="grid max-w-3xl gap-5">
        <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
          Carpentry projects
        </h1>
        <p className="max-w-[58ch] text-lg leading-relaxed text-ink-2">
          Decks, pergolas, verandas, sheds and custom timber, built for homes and businesses around Margaret River and
          the South West. Tap any project for more photos.
        </p>
      </Reveal>

      <ProjectGallery projects={CARPENTRY_PROJECTS} layout="masonry" />

      <section className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <Reveal className="grid content-start gap-6 lg:sticky lg:top-28">
          <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            What we build
          </h2>
          <p className="max-w-[48ch] text-lg leading-relaxed text-ink-2">
            From a single garden gate to a full veranda. If it&apos;s made of timber or goes over your outdoor area, ask
            us.
          </p>
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl lg:block">
            <Image
              src="/images/carpentry/veranda-rafters.jpg"
              alt="Hardwood rafters of a timber veranda against a blue sky"
              fill
              sizes="40vw"
              className="object-cover"
            />
          </div>
        </Reveal>
        <ul className="grid content-start gap-x-8 sm:grid-cols-2">
          {CARPENTRY_SERVICES.map((s, i) => (
            <li key={s.title} className="border-t border-line py-6">
              <Reveal delay={(i % 2) * 0.06} className="grid gap-2">
                <span className="font-display text-xl font-bold tracking-tight">{s.title}</span>
                <span className="leading-relaxed text-ink-2">{s.body}</span>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-center md:gap-12">
        <Reveal className="grid gap-4">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">We move things too</h2>
          <p className="max-w-[46ch] leading-relaxed text-ink-2">
            The same crew handles house and business moves, from a single heirloom to a full home.
          </p>
          <Link href="/removals" className="group inline-flex items-center gap-2 justify-self-start font-bold text-accent-strong">
            More about removals
            <ArrowRight size={18} className="transition group-hover:translate-x-1" aria-hidden />
          </Link>
        </Reveal>
        <div className="grid grid-cols-2 gap-4">
          {REMOVALS.map((r, i) => (
            <Reveal key={r.src} delay={i * 0.08} className={i ? "md:mt-12" : ""}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                <Image src={r.src} alt={r.alt} fill sizes="(min-width: 768px) 30vw, 50vw" className="object-cover" />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="grid justify-items-start gap-5 rounded-2xl bg-accent-strong px-6 py-12 text-white sm:px-10 md:py-16">
        <h2 className="max-w-[20ch] font-display text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
          Got a project in mind?
        </h2>
        <p className="max-w-[50ch] text-lg leading-relaxed text-white/85">
          Tell us what you&apos;re thinking. We&apos;ll come back with a plan and a price, no obligation.
        </p>
        <QuoteLink
          service="carpentry"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-accent-strong transition hover:bg-white/90 active:scale-[0.98]"
        >
          Get a free quote <ArrowRight size={18} aria-hidden />
        </QuoteLink>
      </section>
    </div>
  );
}
