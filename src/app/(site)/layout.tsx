import Link from "next/link";
import {
  PackageSearch,
  Truck,
  HelpCircle,
  Phone,
  Briefcase,
  Heart,
} from "lucide-react";
import MobileNav from "@/components/shared/MobileNav";
import { OPS_ENABLED } from "@/lib/flags";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh bg-brand-cream">
      <header className="w-full sticky top-0 z-50 bg-white border-b border-black/5 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Truck className="text-brand-orange" size={28} />
            <span className="font-tangkiwood text-2xl sm:text-3xl tracking-tight text-brand-charcoal leading-none">
              Too Easy Solutions
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-semibold">
            <Link href="/" className="hover:text-brand-teal flex items-center gap-1">
              <PackageSearch size={18} /> Home
            </Link>
            <Link href="/about" className="hover:text-brand-teal flex items-center gap-1">
              <Truck size={18} /> About Us
            </Link>
            <Link href="/community" className="hover:text-brand-teal flex items-center gap-1">
              <Heart size={18} /> Community
            </Link>
            <Link href="/projects" className="hover:text-brand-teal flex items-center gap-1">
              <Briefcase size={18} /> Our Projects
            </Link>
            <Link href="/faq" className="hover:text-brand-teal flex items-center gap-1">
              <HelpCircle size={18} /> FAQ
            </Link>
            <Link href="/contact" className="hover:text-brand-teal flex items-center gap-1">
              <Phone size={18} /> Contact
            </Link>
          </nav>
          <MobileNav />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mt-16 border-t border-black/5 py-8 text-sm text-black/70">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            © {new Date().getFullYear()} Too Easy Solutions. All rights
            reserved.
          </p>
          <p>
            Servicing Perth to Augusta, Western Australia — Local. Affordable.
            Too Easy.
          </p>
        </div>
        {OPS_ENABLED && (
          <div className="mx-auto max-w-6xl px-4 mt-4 flex flex-wrap items-center justify-center sm:justify-end gap-x-5 gap-y-2">
            <Link href="/book/cleaning" className="hover:text-brand-teal">Book a clean</Link>
            <Link href="/carpentry" className="hover:text-brand-teal">Carpentry</Link>
            <Link href="/login" className="hover:text-brand-teal">Crew login</Link>
          </div>
        )}
      </footer>
    </div>
  );
}
