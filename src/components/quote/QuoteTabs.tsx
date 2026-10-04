"use client";

import { useEffect, useState } from "react";
import CarpentryForm from "@/components/quote/forms/CarpentryForm";
import RemovalsForm from "@/components/quote/forms/RemovalsForm";
import CleaningForm from "@/components/quote/forms/CleaningForm";
import MaintenanceForm from "@/components/quote/forms/MaintenanceForm";
import { QUOTE_SELECT_EVENT, type QuoteService } from "@/components/quote/QuoteLink";
import { cn } from "@/lib/cn";

type TabKey = QuoteService;

const TABS: { key: TabKey; label: string }[] = [
  { key: "carpentry", label: "Carpentry" },
  { key: "removals", label: "Removals" },
  { key: "cleaning", label: "Cleaning" },
  { key: "maintenance", label: "Home maintenance" },
];

export default function QuoteTabs({ initial = "carpentry" }: { initial?: TabKey }) {
  const [activeTab, setActiveTab] = useState<TabKey>(initial);

  // Preselect from ?service=… (links from other pages) or a QuoteLink click on this page.
  useEffect(() => {
    const isTab = (v: unknown): v is TabKey => TABS.some((t) => t.key === v);
    const fromUrl = new URLSearchParams(window.location.search).get("service");
    if (isTab(fromUrl)) setActiveTab(fromUrl);
    const onSelect = (e: Event) => {
      const v = (e as CustomEvent).detail;
      if (isTab(v)) setActiveTab(v);
    };
    window.addEventListener(QUOTE_SELECT_EVENT, onSelect);
    return () => window.removeEventListener(QUOTE_SELECT_EVENT, onSelect);
  }, []);

  return (
    <div className="grid gap-6">
      <div
        role="tablist"
        aria-label="Choose a service"
        className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1 sm:flex sm:rounded-full"
      >
        {TABS.map((t) => {
          const on = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`quote-panel-${t.key}`}
              id={`quote-tab-${t.key}`}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "h-10 grow rounded-full px-4 text-sm font-bold whitespace-nowrap transition",
                on ? "bg-surface text-ink shadow-soft" : "text-ink-2 hover:text-ink",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`quote-panel-${activeTab}`}
        aria-labelledby={`quote-tab-${activeTab}`}
        className="site-form"
      >
        {activeTab === "carpentry" && <CarpentryForm />}
        {activeTab === "removals" && <RemovalsForm />}
        {activeTab === "cleaning" && <CleaningForm />}
        {activeTab === "maintenance" && <MaintenanceForm />}
      </div>
    </div>
  );
}
