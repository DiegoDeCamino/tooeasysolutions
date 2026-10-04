"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Menu, Phone, X } from "lucide-react";
import { CONTACT, SITE_NAV } from "@/components/site/nav";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Portal: the header's backdrop-filter would otherwise become the containing block for this fixed overlay. */}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] bg-ink/50"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            onClick={() => setOpen(false)}
          >
            <nav
              className="absolute right-0 top-0 flex h-full w-[82%] max-w-[340px] flex-col gap-6 bg-surface p-5 shadow-lift"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <Image
                  src="/images/logo.svg"
                  alt="Too Easy Solutions"
                  width={82}
                  height={80}
                  className="h-16 w-auto"
                />
                <button
                  aria-label="Close menu"
                  className="flex size-11 items-center justify-center rounded-full border border-line"
                  onClick={() => setOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <ul className="grid gap-1">
                {SITE_NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-2xl px-3 py-3 font-display text-xl font-bold text-ink hover:bg-surface-2"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-auto grid gap-3">
                <Link
                  href="/#quote"
                  className="btn-primary h-12"
                  onClick={() => setOpen(false)}
                >
                  Get a free quote
                </Link>
                <a href={CONTACT.phoneHref} className="btn-secondary h-12">
                  <Phone size={16} /> {CONTACT.phone}
                </a>
                <p className="text-center text-sm text-ink-2">
                  {CONTACT.email}
                </p>
              </div>
            </nav>
          </div>,
          document.body,
        )}
    </div>
  );
}
