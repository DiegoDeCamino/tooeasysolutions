import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";

export const metadata: Metadata = {
  title: "About us | Too Easy Solutions",
  description:
    "A local crew from Margaret River doing carpentry, removals, cleaning and home maintenance across the South West of WA.",
};

const VALUES = [
  { title: "Local first", body: "We live here. The people we build for are the people we see at the shops." },
  { title: "Straight pricing", body: "A clear quote before we start, and no surprises when we finish." },
  { title: "Care in the detail", body: "Whether it's a hardwood deck or your grandmother's dresser, we treat it like our own." },
];

export default function AboutPage() {
  return (
    <div className="grid gap-20 md:gap-28">
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        <Reveal className="grid gap-6">
          <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
            A Margaret River crew that builds, moves and looks after homes.
          </h1>
          <p className="max-w-[54ch] text-lg leading-relaxed text-ink-2">
            Too Easy Solutions started in the Margaret River region helping neighbours move things and fix things.
            Word of mouth did the rest. Today carpentry is at the heart of what we do, alongside removals, cleaning
            and home maintenance from Perth to Augusta.
          </p>
          <Link href="/projects" className="group inline-flex items-center gap-2 justify-self-start font-bold text-accent-strong">
            See our carpentry projects
            <ArrowRight size={18} className="transition group-hover:translate-x-1" aria-hidden />
          </Link>
        </Reveal>
        <Reveal delay={0.1} className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lift">
          <Image
            src="/images/workforce and carpentry.jpg"
            alt="The Too Easy crew talking through a job on a timber-frame build site"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </Reveal>
      </section>

      <section className="grid gap-x-10 md:grid-cols-3">
        {VALUES.map((v, i) => (
          <Reveal key={v.title} delay={i * 0.06} className="grid content-start gap-2 border-t border-line py-7">
            <h2 className="font-display text-2xl font-bold tracking-tight">{v.title}</h2>
            <p className="leading-relaxed text-ink-2">{v.body}</p>
          </Reveal>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-[1.3fr_1fr]">
        <Reveal className="relative aspect-[4/3] overflow-hidden rounded-2xl sm:aspect-auto sm:min-h-[420px]">
          <Image
            src="/images/carpentry/veranda-after.jpg"
            alt="Timber veranda with rough-sawn posts on a local home"
            fill
            sizes="(min-width: 640px) 55vw, 100vw"
            className="object-cover"
          />
        </Reveal>
        <div className="grid gap-4">
          <Reveal delay={0.06} className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src="/images/furniture assembly.jpg"
              alt="Assembling furniture in a client's home"
              fill
              sizes="(min-width: 640px) 40vw, 100vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal delay={0.12} className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src="/images/removals.jpg"
              alt="Two of the crew planning a job with a clipboard"
              fill
              sizes="(min-width: 640px) 40vw, 100vw"
              className="object-cover"
            />
          </Reveal>
        </div>
      </section>

      <section className="grid justify-items-start gap-5">
        <h2 className="max-w-[22ch] font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
          Local. Affordable. Too Easy.
        </h2>
        <Link href="/#quote" className="btn-primary h-12 px-6">
          Get a free quote <ArrowRight size={18} aria-hidden />
        </Link>
      </section>
    </div>
  );
}
