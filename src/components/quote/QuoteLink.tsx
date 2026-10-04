"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type QuoteService = "carpentry" | "removals" | "cleaning" | "maintenance";

export const QUOTE_SELECT_EVENT = "quote:select";

/**
 * Link to the homepage quote form with a service tab preselected.
 * On the homepage it switches the tab and scrolls in place; elsewhere it navigates to /?service=…#quote.
 */
export function QuoteLink({
  service,
  className,
  children,
}: {
  service: QuoteService;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <Link
      href={`/?service=${service}#quote`}
      className={className}
      onClick={(e) => {
        if (pathname !== "/") return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent<QuoteService>(QUOTE_SELECT_EVENT, { detail: service }));
        document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      {children}
    </Link>
  );
}
