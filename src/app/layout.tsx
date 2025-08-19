import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Link from "next/link";
// Image is not used directly; keep import removed to avoid lint warning
import { PackageSearch, Truck, HelpCircle, Phone } from "lucide-react";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Too Easy Solutions — Couriers, Removals, Towing & House Maintenance",
  description:
    "Community-based couriers and removalists servicing Perth to Augusta, Western Australia. Fast quotes — Too Easy.",
  metadataBase: new URL("https://tooeasy.example"),
  keywords: [
    "courier",
    "removals",
    "towing",
    "house maintenance",
    "Perth",
    "Margaret River",
    "South West WA",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} antialiased min-h-screen bg-brand-cream`}
      >
        <header className="w-full sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-black/5">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Truck className="text-brand-orange" size={28} />
              <span className="text-xl font-extrabold tracking-tight">
                Too Easy Solutions
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-semibold">
              <Link
                href="/"
                className="hover:text-brand-teal flex items-center gap-1"
              >
                <PackageSearch size={18} /> Home
              </Link>
              <Link
                href="/about"
                className="hover:text-brand-teal flex items-center gap-1"
              >
                <Truck size={18} /> About Us
              </Link>
              <Link
                href="/faq"
                className="hover:text-brand-teal flex items-center gap-1"
              >
                <HelpCircle size={18} /> FAQ
              </Link>
              <Link
                href="/contact"
                className="hover:text-brand-teal flex items-center gap-1"
              >
                <Phone size={18} /> Contact
              </Link>
            </nav>
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
        </footer>
      </body>
    </html>
  );
}
