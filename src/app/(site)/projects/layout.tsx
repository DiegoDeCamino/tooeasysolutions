import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carpentry projects | Too Easy Solutions",
  description:
    "Decks, pergolas, verandas, sheds and custom timber built for the Margaret River and South West WA community. See before and after photos of our work.",
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
