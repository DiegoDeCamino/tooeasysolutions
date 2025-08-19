"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Home, Info, HelpCircle, Phone } from "lucide-react";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="p-2 rounded-md border border-black/10 bg-white/70 hover:bg-white"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <nav
            className="absolute right-0 top-0 h-full w-[78%] max-w-[320px] bg-white shadow-2xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold">Menu</span>
              <button
                aria-label="Close menu"
                className="p-2 rounded-md border border-black/10"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              <li>
                <NavLink
                  href="/"
                  icon={<Home size={16} />}
                  text="Home"
                  onNavigate={() => setOpen(false)}
                />
              </li>
              <li>
                <NavLink
                  href="/about"
                  icon={<Info size={16} />}
                  text="About Us"
                  onNavigate={() => setOpen(false)}
                />
              </li>
              <li>
                <NavLink
                  href="/faq"
                  icon={<HelpCircle size={16} />}
                  text="FAQ"
                  onNavigate={() => setOpen(false)}
                />
              </li>
              <li>
                <NavLink
                  href="/contact"
                  icon={<Phone size={16} />}
                  text="Contact"
                  onNavigate={() => setOpen(false)}
                />
              </li>
            </ul>
            <div className="mt-auto text-sm text-black/70">
              <p>tooeasyparceldelivery@gmail.com</p>
              <p>0432 689 687</p>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

function NavLink({
  href,
  icon,
  text,
  onNavigate,
}: {
  href: string;
  icon: React.ReactNode;
  text: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-brand-cream"
      onClick={onNavigate}
    >
      <span className="text-brand-teal">{icon}</span>
      <span className="font-semibold">{text}</span>
    </Link>
  );
}
