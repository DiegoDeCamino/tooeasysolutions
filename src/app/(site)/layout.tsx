import Image from "next/image";
import Link from "next/link";
import MobileNav from "@/components/shared/MobileNav";
import { CONTACT, SITE_NAV } from "@/components/site/nav";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-50 w-full border-b border-line/70 bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 lg:h-[72px]">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-ink" aria-label="Too Easy Solutions, home">
            <Image src="/images/logo-mark.svg" alt="" width={54} height={40} priority className="h-9 w-auto lg:h-10" />
            <span className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="font-display text-2xl font-extrabold tracking-tight">Too Easy</span>
              <span className="hidden text-sm font-bold text-ink-2 sm:inline lg:hidden xl:inline">Solutions</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-5 whitespace-nowrap text-sm font-bold text-ink-2 lg:flex xl:gap-7 xl:text-[15px]">
            {SITE_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-ink">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/#quote" className="btn-primary hidden h-10 sm:inline-flex">
              Get a free quote
            </Link>
            <MobileNav />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">{children}</main>

      <footer className="mt-20 border-t border-line bg-surface-2/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="grid content-start gap-4">
            <Image src="/images/logo.svg" alt="Too Easy Solutions" width={160} height={156} className="h-28 w-auto" />
            <p className="max-w-[40ch] text-ink-2">
              Carpentry, removals, cleaning and home maintenance. A local crew working for the Margaret River and
              South West community.
            </p>
          </div>
          <div className="grid content-start gap-2">
            <span className="font-bold">Explore</span>
            {SITE_NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-ink-2 hover:text-ink">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="grid content-start gap-2">
            <span className="font-bold">Talk to us</span>
            <a href={CONTACT.phoneHref} className="text-ink-2 hover:text-ink">
              {CONTACT.phone}
            </a>
            <a href={`mailto:${CONTACT.email}`} className="break-all text-ink-2 hover:text-ink">
              {CONTACT.email}
            </a>
            <span className="text-ink-2">Margaret River, Perth to Augusta</span>
          </div>
        </div>
        <div className="border-t border-line">
          <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-ink-2">
            © {new Date().getFullYear()} Too Easy Solutions. Local. Affordable. Too Easy.
          </p>
        </div>
      </footer>
    </div>
  );
}
