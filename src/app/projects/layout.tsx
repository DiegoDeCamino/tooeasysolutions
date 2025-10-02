import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Projects | Too Easy Solutions",
  description:
    "View our completed projects including carpentry, renovations, removals, and maintenance work across the South West.",
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
