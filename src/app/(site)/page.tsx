import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import QuoteTabs from "@/components/quote/QuoteTabs";
import { QuoteLink } from "@/components/quote/QuoteLink";
import { ProjectGallery } from "@/components/site/ProjectGallery";
import { Reveal } from "@/components/site/Reveal";
import { CONTACT } from "@/components/site/nav";
import { BEFORE_AFTER, CARPENTRY_PROJECTS } from "@/data/carpentry";
import { REMOVAL_PHOTOS, REMOVAL_SERVICES } from "@/data/removals";

// The hero shows the spa pergola and the before/after band shows the deck and veranda,
// so the bento sticks to the rest to avoid repeating photos.
const HOME_PROJECTS = ["covered-outdoor-area", "shed-and-alfresco", "resort-deck", "live-edge-benchtop", "pergola-privacy-screen"].map(
  (slug) => CARPENTRY_PROJECTS.find((p) => p.slug === slug)!,
);

const MORE_SERVICES = [
  {
    title: "Cleaning",
    body: "Regular cleans, end-of-lease and holiday homes between guests.",
    src: "/images/cleaning.jpg",
    alt: "A cleaner vacuuming a living room",
    service: "cleaning" as const,
  },
  {
    title: "Home maintenance",
    body: "Repairs, odd jobs, gardening and the list that keeps growing.",
    src: "/images/home maintenance.jpg",
    alt: "A tradesman fixing a cabinet",
    service: "maintenance" as const,
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
      <Removals />
      <Community />
      <MoreServices />
      <Quote />
    </div>
  );
}

function Hero() {
  return (
    <section className="grid items-center gap-10 pt-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
      <Reveal className="grid gap-6">
        <span className="text-sm font-bold text-accent-strong">Carpentry and removals in Margaret River</span>
        <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-[3.6rem] xl:text-[4rem]">
          Built and moved by locals.
        </h1>
        <p className="max-w-[46ch] text-lg leading-relaxed text-ink-2">
          Decks, pergolas, sheds and custom timber. House moves, furniture and single items. Plus cleaning and home
          maintenance for the South West.
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
        <div className="absolute -bottom-12 -left-4 hidden w-[31%] overflow-hidden rounded-2xl border-[6px] border-canvas shadow-lift sm:block lg:-left-12">
          <div className="relative aspect-[3/4]">
            <Image
              src={REMOVAL_PHOTOS.dresser.src}
              alt={REMOVAL_PHOTOS.dresser.alt}
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
          Carpentry around Margaret River
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
    <section className="-mx-4 bg-surface-2 px-4 py-14 sm:mx-0 sm:rounded-2xl sm:px-8 md:px-10 md:py-16">
      <div className="grid gap-10">
        <Reveal className="grid max-w-2xl gap-3">
          <h2 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight md:text-4xl">
            Before and after
          </h2>
          <p className="text-lg leading-relaxed text-ink-2">
            Two local homes, before we started and after we packed up the tools.
          </p>
        </Reveal>
        <div className="grid gap-10 md:grid-cols-2 md:gap-8">
          {BEFORE_AFTER.map((project, i) => (
            <Reveal key={project.slug} delay={i * 0.08} className="grid content-start gap-4">
              <div className="grid grid-cols-2 gap-3">
                <BeforeAfterPhoto photo={project.before!} label="Before" />
                <BeforeAfterPhoto photo={project.cover} label="After" />
              </div>
              <div className="grid gap-1">
                <h3 className="font-display text-xl font-bold tracking-tight">{project.title}</h3>
                <p className="leading-relaxed text-ink-2">{project.summary}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function BeforeAfterPhoto({ photo, label }: { photo: { src: string; alt: string }; label: "Before" | "After" }) {
  const before = label === "Before";
  return (
    <figure className="grid gap-2">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 768px) 25vw, 50vw"
          className={before ? "object-cover saturate-[0.85]" : "object-cover"}
        />
      </div>
      <figcaption className={before ? "text-sm font-bold text-ink-2" : "text-sm font-bold text-accent-strong"}>
        {label}
      </figcaption>
    </figure>
  );
}

function Removals() {
  return (
    <section
      id="removals"
      className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14"
    >
      <Reveal className="order-2 grid grid-cols-[1.15fr_1fr] gap-4">
        <div className="relative row-span-2 min-h-[320px] overflow-hidden rounded-2xl sm:min-h-[460px]">
          <Image
            src={REMOVAL_PHOTOS.truck.src}
            alt={REMOVAL_PHOTOS.truck.alt}
            fill
            sizes="(min-width: 1024px) 28vw, 55vw"
            className="object-cover"
          />
        </div>
        <div className="relative aspect-square overflow-hidden rounded-2xl">
          <Image
            src={REMOVAL_PHOTOS.fridge.src}
            alt={REMOVAL_PHOTOS.fridge.alt}
            fill
            sizes="(min-width: 1024px) 22vw, 45vw"
            className="object-cover"
          />
        </div>
        <div className="relative aspect-square overflow-hidden rounded-2xl">
          <Image
            src={REMOVAL_PHOTOS.assembly.src}
            alt={REMOVAL_PHOTOS.assembly.alt}
            fill
            sizes="(min-width: 1024px) 22vw, 45vw"
            className="object-cover"
          />
        </div>
      </Reveal>
      <Reveal className="order-1 grid content-start gap-8">
        <div className="grid gap-4">
          <h2 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
            Removals across the South West
          </h2>
          <p className="max-w-[52ch] text-lg leading-relaxed text-ink-2">
            From Margaret River to Perth and Augusta. Your things wrapped, loaded and carried in like they were ours.
          </p>
        </div>
        <ul className="grid gap-x-8 sm:grid-cols-2">
          {REMOVAL_SERVICES.map((r) => (
            <li key={r.title} className="grid content-start gap-1 border-t border-line py-4">
              <span className="font-display text-lg font-bold tracking-tight">{r.title}</span>
              <span className="text-[15px] leading-relaxed text-ink-2">{r.body}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <QuoteLink service="removals" className="btn-primary h-12 px-6">
            Get a free quote <ArrowRight size={18} aria-hidden />
          </QuoteLink>
          <Link href="/removals" className="group inline-flex items-center gap-2 font-bold text-accent-strong">
            More about removals
            <ArrowRight size={18} className="transition group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </Reveal>
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

function MoreServices() {
  return (
    <section id="services" className="grid scroll-mt-28 gap-8">
      <Reveal className="grid max-w-2xl gap-3">
        <h2 className="font-display text-3xl font-extrabold leading-[1.05] tracking-tight md:text-4xl">
          Cleaning and home maintenance
        </h2>
        <p className="text-lg leading-relaxed text-ink-2">The same crew and the same care, for the rest of the list.</p>
      </Reveal>
      <div className="grid gap-5 md:grid-cols-2">
        {MORE_SERVICES.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.06}>
            <QuoteLink
              service={s.service}
              className="group grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] items-center gap-5 rounded-2xl"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src={s.src}
                  alt={s.alt}
                  fill
                  sizes="(min-width: 768px) 20vw, 40vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div className="grid gap-1">
                <h3 className="font-display text-2xl font-bold tracking-tight">{s.title}</h3>
                <p className="leading-relaxed text-ink-2">{s.body}</p>
                <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-accent-strong">
                  Get a quote
                  <ArrowRight size={16} className="transition group-hover:translate-x-1" aria-hidden />
                </span>
              </div>
            </QuoteLink>
          </Reveal>
        ))}
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
