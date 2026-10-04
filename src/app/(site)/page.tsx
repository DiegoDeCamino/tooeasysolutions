import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Hammer, Mail, Phone } from "lucide-react";
import QuoteTabs from "@/components/quote/QuoteTabs";
import { ProjectGallery } from "@/components/site/ProjectGallery";
import { Reveal } from "@/components/site/Reveal";
import { CONTACT } from "@/components/site/nav";
import { BEFORE_AFTER, CARPENTRY_PROJECTS, CARPENTRY_SERVICES } from "@/data/carpentry";

// The hero shows the spa pergola and the before/after band shows the deck and veranda,
// so the bento sticks to the rest to avoid repeating photos.
const HOME_PROJECTS = ["covered-outdoor-area", "shed-and-alfresco", "resort-deck", "live-edge-benchtop", "pergola-privacy-screen"].map(
  (slug) => CARPENTRY_PROJECTS.find((p) => p.slug === slug)!,
);

const OTHER_SERVICES = [
  {
    title: "Removals",
    body: "House and business moves, single items and furniture. Wrapped, loaded and carried with care.",
    src: "/images/house and commercial removal.jpg",
    alt: "Two of the crew moving a fridge on a trolley",
  },
  {
    title: "Cleaning",
    body: "Regular cleans, end-of-lease and holiday homes between guests.",
    src: "/images/cleaning.jpg",
    alt: "A cleaner vacuuming a living room",
  },
  {
    title: "Home maintenance",
    body: "Repairs, odd jobs, gardening and the list that keeps growing.",
    src: "/images/home maintenance.jpg",
    alt: "A tradesman fixing a cabinet",
  },
];

const STEPS = [
  { title: "Tell us what you need", body: "Pick a service and give us the rough idea. Photos help but aren't required." },
  { title: "We talk it through", body: "We call you back, visit if needed, and give you a clear price." },
  { title: "We get it done", body: "We turn up when we said we would and leave the place tidy." },
];

export default function Home() {
  return (
    <div className="grid gap-24 md:gap-32">
      <Hero />
      <CarpentryWork />
      <BeforeAfter />
      <WhatWeBuild />
      <Community />
      <OtherServices />
      <Quote />
    </div>
  );
}

function Hero() {
  return (
    <section className="grid items-center gap-10 pt-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
      <Reveal className="grid gap-6">
        <span className="flex items-center gap-2 text-sm font-bold text-accent-strong">
          <Hammer size={16} aria-hidden /> Local carpentry in Margaret River
        </span>
        <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-[3.6rem] xl:text-[4rem]">
          Built by locals, for locals.
        </h1>
        <p className="max-w-[46ch] text-lg leading-relaxed text-ink-2">
          Decks, pergolas, verandas, sheds and custom timber for the Margaret River community. Plus removals, cleaning
          and home maintenance.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="#quote" className="btn-primary h-12 px-6 text-base">
            Get a free quote <ArrowRight size={18} aria-hidden />
          </Link>
          <Link href="#carpentry" className="btn-secondary h-12 px-6 text-base">
            See our work
          </Link>
        </div>
      </Reveal>

      <Reveal delay={0.1} className="relative">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lift">
          <Image
            src="/images/carpentry/spa-pergola.jpg"
            alt="Timber pergola with a clear roof sheltering a swim spa in a bush garden"
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute -bottom-12 -left-4 hidden w-[27%] overflow-hidden rounded-2xl border-[6px] border-canvas shadow-lift sm:block lg:-left-12">
          <div className="relative aspect-[3/4]">
            <Image
              src="/images/carpentry/live-edge-benchtop.jpg"
              alt="Close-up of a live-edge timber benchtop"
              fill
              sizes="20vw"
              className="object-cover"
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function CarpentryWork() {
  return (
    <section id="carpentry" className="grid scroll-mt-28 gap-10">
      <Reveal className="grid max-w-3xl gap-4">
        <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
          Recent carpentry around Margaret River
        </h2>
        <p className="max-w-[60ch] text-lg leading-relaxed text-ink-2">
          Every one of these was built for neighbours in and around the region. Tap a project to see more photos.
        </p>
      </Reveal>
      <ProjectGallery projects={HOME_PROJECTS} layout="bento" />
      <Link
        href="/projects"
        className="group inline-flex items-center gap-2 justify-self-start font-bold text-accent-strong"
      >
        See all carpentry projects
        <ArrowRight size={18} className="transition group-hover:translate-x-1" aria-hidden />
      </Link>
    </section>
  );
}

function BeforeAfter() {
  return (
    <section className="-mx-4 bg-surface-2 px-4 py-16 sm:mx-0 sm:rounded-2xl sm:px-8 md:px-12 md:py-20">
      <div className="grid gap-14">
        <Reveal className="grid max-w-2xl gap-4">
          <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Before and after
          </h2>
          <p className="text-lg leading-relaxed text-ink-2">
            Two local homes, before we started and after we packed up the tools.
          </p>
        </Reveal>
        {BEFORE_AFTER.map((project) => (
          <Reveal key={project.slug} className="grid gap-5">
            <div
              className="grid gap-4 md:grid-cols-[1fr_1.45fr] md:items-end md:gap-6"
            >
              <figure className="grid gap-2">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                  <Image
                    src={project.before!.src}
                    alt={project.before!.alt}
                    fill
                    sizes="(min-width: 768px) 40vw, 100vw"
                    className="object-cover saturate-[0.85]"
                  />
                </div>
                <figcaption className="text-sm font-bold text-ink-2">Before</figcaption>
              </figure>
              <figure className="grid gap-2">
                <div className={`relative overflow-hidden rounded-2xl ${project.cover.ratio === "portrait" ? "aspect-[4/5] md:aspect-[5/4]" : "aspect-[5/4]"}`}>
                  <Image
                    src={project.cover.src}
                    alt={project.cover.alt}
                    fill
                    sizes="(min-width: 768px) 58vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="text-sm font-bold text-accent-strong">After</figcaption>
              </figure>
            </div>
            <div className="grid max-w-2xl gap-1">
              <h3 className="font-display text-2xl font-bold tracking-tight">{project.title}</h3>
              <p className="leading-relaxed text-ink-2">{project.summary}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function WhatWeBuild() {
  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
      <Reveal className="grid content-start gap-6 lg:sticky lg:top-28">
        <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
          What we build
        </h2>
        <p className="max-w-[48ch] text-lg leading-relaxed text-ink-2">
          From a single garden gate to a full veranda. If it&apos;s made of timber or goes over your outdoor area, ask us.
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
  );
}

function Community() {
  return (
    <section className="grid items-center gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-16">
      <Reveal className="grid gap-8">
        <blockquote className="font-display text-3xl font-bold leading-[1.15] tracking-tight text-ink md:text-[2.75rem]">
          &ldquo;Margaret River and the South West is our home. Every job is our way of giving back. If we all work
          together, life can be too easy!&rdquo;
        </blockquote>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="grid">
            <span className="font-bold">Diego</span>
            <span className="text-sm text-ink-2">Founder, Too Easy Solutions</span>
          </span>
          <Link href="/community" className="group inline-flex items-center gap-2 font-bold text-accent-strong">
            Our community
            <ArrowRight size={18} className="transition group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </Reveal>
      <Reveal delay={0.1} className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl md:max-w-none">
        <Image
          src="/images/Community/community collage.jpg"
          alt="Collage of the Too Easy crew with clients and on jobs around the region"
          fill
          sizes="(min-width: 768px) 35vw, 90vw"
          className="object-cover"
        />
      </Reveal>
    </section>
  );
}

function OtherServices() {
  const [lead, ...rest] = OTHER_SERVICES;
  return (
    <section id="services" className="grid scroll-mt-28 gap-10">
      <Reveal className="grid max-w-3xl gap-4">
        <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
          Moving, cleaning and the rest
        </h2>
        <p className="max-w-[60ch] text-lg leading-relaxed text-ink-2">
          The same crew, the same care. One call for the jobs around your home.
        </p>
      </Reveal>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Reveal className="grid gap-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl lg:aspect-auto lg:h-full lg:min-h-[420px]">
            <Image src={lead.src} alt={lead.alt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
          </div>
          <div className="grid gap-1">
            <h3 className="font-display text-2xl font-bold tracking-tight">{lead.title}</h3>
            <p className="max-w-[52ch] leading-relaxed text-ink-2">{lead.body}</p>
          </div>
        </Reveal>
        <div className="grid gap-5">
          {rest.map((s, i) => (
            <Reveal key={s.title} delay={0.06 * (i + 1)} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] items-center gap-5">
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <Image src={s.src} alt={s.alt} fill sizes="(min-width: 1024px) 20vw, 45vw" className="object-cover" />
              </div>
              <div className="grid gap-1">
                <h3 className="font-display text-2xl font-bold tracking-tight">{s.title}</h3>
                <p className="leading-relaxed text-ink-2">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Quote() {
  return (
    <section id="quote" className="grid scroll-mt-24 gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-14">
      <div className="grid content-start gap-8 lg:sticky lg:top-28">
        <div className="grid gap-4">
          <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Get a free quote
          </h2>
          <p className="max-w-[44ch] text-lg leading-relaxed text-ink-2">
            No obligation. Tell us what you need and we&apos;ll get back to you with a plan and a price.
          </p>
        </div>
        <ol className="grid gap-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[2.25rem_1fr] gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft font-display font-bold text-accent-strong">
                {i + 1}
              </span>
              <span className="grid gap-0.5">
                <span className="font-bold">{s.title}</span>
                <span className="text-[15px] leading-relaxed text-ink-2">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="grid gap-2 border-t border-line pt-6">
          <span className="text-sm text-ink-2">Rather talk now?</span>
          <a href={CONTACT.phoneHref} className="inline-flex items-center gap-2 font-display text-2xl font-bold hover:text-accent-strong">
            <Phone size={20} aria-hidden /> {CONTACT.phone}
          </a>
          <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2 break-all text-ink-2 hover:text-ink">
            <Mail size={16} aria-hidden /> {CONTACT.email}
          </a>
        </div>
      </div>
      <div className="card p-5 sm:p-8">
        <QuoteTabs />
      </div>
    </section>
  );
}
