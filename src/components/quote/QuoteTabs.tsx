"use client";

import { useState } from "react";
import ParcelForm from "@/components/quote/forms/ParcelForm";
import RemovalsForm from "@/components/quote/forms/RemovalsForm";
import TowingForm from "@/components/quote/forms/TowingForm";
import MaintenanceForm from "@/components/quote/forms/MaintenanceForm";
import { Package, Move, Car, Cog } from "lucide-react";

type TabKey = "parcel" | "removals" | "towing" | "maintenance";

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
          tab="towing"
          label="Towing"
          icon={<Car size={16} />}
          active={activeTab}
          onClick={setActiveTab}
        />
        <TabButton
          tab="maintenance"
          label="House Maintenance"
          icon={<Cog size={16} />}
          active={activeTab}
          onClick={setActiveTab}
        />
      </div>
      <div className="mt-4">
        {activeTab === "parcel" && <ParcelForm />}
        {activeTab === "removals" && <RemovalsForm />}
        {activeTab === "towing" && <TowingForm />}
        {activeTab === "maintenance" && <MaintenanceForm />}
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
