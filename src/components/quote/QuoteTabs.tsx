"use client";

import { useState } from "react";
import ParcelForm from "@/components/quote/forms/ParcelForm";
import RemovalsForm from "@/components/quote/forms/RemovalsForm";
import CleaningForm from "@/components/quote/forms/CleaningForm";
import MaintenanceForm from "@/components/quote/forms/MaintenanceForm";
import Link from "next/link";
import { Package, Move, Cog, Sparkles, ArrowRight } from "lucide-react";

type TabKey = "parcel" | "removals" | "cleaning" | "maintenance";

export default function QuoteTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>("parcel");

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        <TabButton
          tab="parcel"
          label="Parcel Delivery"
          icon={<Package size={16} />}
          active={activeTab}
          onClick={setActiveTab}
        />
        <TabButton
          tab="removals"
          label="Removals"
          icon={<Move size={16} />}
          active={activeTab}
          onClick={setActiveTab}
        />
        <TabButton
          tab="cleaning"
          label="Cleaning"
          icon={<Sparkles size={16} />}
          active={activeTab}
          onClick={setActiveTab}
        />
        <TabButton
          tab="maintenance"
          label="Home Maintenance"
          icon={<Cog size={16} />}
          active={activeTab}
          onClick={setActiveTab}
        />
      </div>
      <div className="mt-4">
        {activeTab === "parcel" && <ParcelForm />}
        {activeTab === "removals" && <RemovalsForm />}
        {activeTab === "cleaning" && (
          <>
            <OnlineCta
              href="/book/cleaning"
              title="See your price now"
              body="Book online in two minutes and get an instant estimate."
              label="Book a clean"
            />
            <CleaningForm />
          </>
        )}
        {activeTab === "maintenance" && (
          <>
            <OnlineCta
              href="/carpentry"
              title="Planning a deck, pergola or kitchen?"
              body="Send us photos of the job and we'll come back with a plan."
              label="Carpentry enquiry"
            />
            <MaintenanceForm />
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({
  tab,
  label,
  icon,
  active,
  onClick,
}: {
  tab: TabKey;
  label: string;
  icon?: React.ReactNode;
  active: TabKey;
  onClick: (t: TabKey) => void;
}) {
  const isActive = active === tab;
  return (
    <button
      type="button"
      onClick={() => onClick(tab)}
      className={`px-4 py-2 rounded-full border transition-colors flex items-center gap-2 ${
        isActive
          ? "bg-brand-orange text-white border-brand-orange"
          : "bg-white border-black/10 hover:border-brand-orange hover:text-brand-orange"
      }`}
      aria-pressed={isActive}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function OnlineCta({ href, title, body, label }: { href: string; title: string; body: string; label: string }) {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-brand-teal/30 bg-brand-teal/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-extrabold">{title}</p>
        <p className="text-sm text-black/70">{body}</p>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-charcoal px-5 py-2.5 font-bold text-white hover:bg-black/80"
      >
        {label} <ArrowRight size={16} />
      </Link>
    </div>
  );
}
