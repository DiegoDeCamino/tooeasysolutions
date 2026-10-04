import type { Metadata, Viewport } from "next";
import { Nunito, Rye } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Fallback display font for "TAN TANGKIWOOD" — kicks in until a real
// TAN TANGKIWOOD font file is dropped into /public/fonts/.
const rye = Rye({
  variable: "--font-rye",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "Too Easy Solutions — Removals, Couriers, Cleaning & Home Maintenance",
  description:
    "One page. Every service. All South West WA. Removals, couriers, cleaning and home maintenance from Perth to Augusta — booked right here.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tooeasy.example"),
  keywords: [
    "courier",
    "removals",
    "cleaning",
    "home maintenance",
    "Perth",
    "Margaret River",
    "Augusta",
    "South West WA",
  ],
  appleWebApp: {
    capable: true,
    title: "Too Easy",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3e9" },
    { media: "(prefers-color-scheme: dark)", color: "#171513" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${rye.variable} antialiased min-h-dvh`}>
        {children}
      </body>
    </html>
  );
}
