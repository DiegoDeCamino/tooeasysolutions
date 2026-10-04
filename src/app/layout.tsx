import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Nunito, Rye } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Fallback display font for "TAN TANGKIWOOD" — kicks in until a real
// TAN TANGKIWOOD font file is dropped into /public/fonts/.
const rye = Rye({
  variable: "--font-rye",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Too Easy Solutions | Carpentry, Removals, Cleaning and Home Maintenance in Margaret River",
  description:
    "Local carpentry, removals, cleaning and home maintenance for Margaret River and the South West of WA. Decks, pergolas, verandas, sheds and custom timber work.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://tooeasy.example"),
  keywords: [
    "carpentry",
    "decks",
    "pergolas",
    "verandas",
    "sheds",
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
      <body className={`${nunito.variable} ${display.variable} ${rye.variable} antialiased min-h-dvh`}>
        {children}
      </body>
    </html>
  );
}
