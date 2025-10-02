"use client";

import { useState } from "react";
import AddressAutocomplete from "./AddressAutocomplete";
import TurnstileWidget from "../../shared/TurnstileWidget";

type PackageRow = {
  quantity: number;
  itemType: string;
  kg: number;
  unit: "CM" | "IN";
  width: number;
  length: number;
  height: number;
};

export default function ParcelForm() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromType, setFromType] = useState<"home" | "business">("home");
  const [toType, setToType] = useState<"home" | "business">("home");
  const [rows, setRows] = useState<PackageRow[]>([
    {
      quantity: 1,
      itemType: "",
      kg: 0,
      unit: "CM",
      width: 0,
      length: 0,
      height: 0,
    },
  ]);
  const [dangerousGoods, setDangerousGoods] = useState(false);
  const [budget, setBudget] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const addRow = () =>
    setRows((r) => [
      ...r,
      {
        quantity: 1,
        itemType: "",
        kg: 0,
        unit: "CM",
        width: 0,
        length: 0,
        height: 0,
      },
    ]);
  const removeRow = (idx: number) =>
    setRows((r) => r.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!email || !name) {
      setStatus("Please fill in your name and email.");
      return;
    }
    const resp = await fetch("/api/quote/parcel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        fromType,
        toType,
        rows,
        dangerousGoods,
        budget,
        name,
        email,
        phone,
        token,
      }),
    });
    if (resp.ok) {
      setStatus(
        "Thanks! Your quote request has been sent. We'll be in touch shortly."
      );
    } else {
      const t = await resp.text();
      setStatus(`Could not submit: ${t || resp.statusText}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <AddressAutocomplete
          label="From"
          value={from}
          onChange={setFrom}
          placeholder="Start typing an address"
        />
        <AddressAutocomplete
          label="To"
          value={to}
          onChange={setTo}
          placeholder="Start typing an address"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-semibold mb-2">Pick-up Building Type</p>
          <div className="flex gap-2">
            <TogglePill
              active={fromType === "home"}
              onClick={() => setFromType("home")}
              label="Home Address"
            />
            <TogglePill
              active={fromType === "business"}
              onClick={() => setFromType("business")}
              label="Business"
            />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">Drop-off Building Type</p>
          <div className="flex gap-2">
            <TogglePill
              active={toType === "home"}
              onClick={() => setToType("home")}
              label="Home Address"
            />
            <TogglePill
              active={toType === "business"}
              onClick={() => setToType("business")}
              label="Business"
            />
          </div>
        </div>
      </div>

      <hr className="border-black/10" />
      <h3 className="text-xl font-extrabold">Package Details</h3>
      {rows.map((row, idx) => (
        <div key={idx} className="grid sm:grid-cols-8 gap-2 items-end">
          <NumberField
            label="Quantity"
            value={row.quantity}
            onChange={(v) => updateRow(idx, { quantity: v })}
          />
          <TextField
            label="Item Type"
            placeholder="Select an option please"
            value={row.itemType}
            onChange={(v) => updateRow(idx, { itemType: v })}
          />
          <NumberField
            label="Kg per item"
            value={row.kg}
            onChange={(v) => updateRow(idx, { kg: v })}
          />
          <div>
            <label className="block text-sm font-semibold mb-1">Unit</label>
            <div className="flex gap-2">
              <TogglePill
                active={row.unit === "CM"}
                onClick={() => updateRow(idx, { unit: "CM" })}
                label="CM"
              />
              <TogglePill
                active={row.unit === "IN"}
                onClick={() => updateRow(idx, { unit: "IN" })}
                label="IN"
              />
            </div>
          </div>
          <NumberField
            label="Width"
            value={row.width}
            onChange={(v) => updateRow(idx, { width: v })}
          />
          <NumberField
            label="Length"
            value={row.length}
            onChange={(v) => updateRow(idx, { length: v })}
          />
          <NumberField
            label="Height"
            value={row.height}
            onChange={(v) => updateRow(idx, { height: v })}
          />
          <div className="flex justify-end">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => removeRow(idx)}
            >
              -Remove
            </button>
          </div>
        </div>
      ))}
      <div>
        <button type="button" className="btn-secondary" onClick={addRow}>
          + Add package
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="danger"
          type="checkbox"
          checked={dangerousGoods}
          onChange={(e) => setDangerousGoods(e.target.checked)}
        />
        <label htmlFor="danger" className="font-semibold">
          My items contain Dangerous Goods
        </label>
      </div>

      <NumberField
        label="My Budget (optional)"
        value={Number(budget || 0)}
        placeholder="e.g., $50"
        onChange={(v) => setBudget(String(v))}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <TextField label="Full Name" required value={name} onChange={setName} />
        <TextField
          label="Email"
          type="email"
          required
          value={email}
          onChange={setEmail}
        />
        <TextField label="Phone" type="tel" value={phone} onChange={setPhone} />
      </div>

      <TurnstileWidget onVerify={setToken} />

      <div className="flex justify-end">
        <button className="btn-primary" type="submit">
          Submit Quote
        </button>
      </div>
      {status && <p className="text-sm text-black/70">{status}</p>}
    </form>
  );

  function updateRow(idx: number, changes: Partial<PackageRow>) {
    setRows((r) =>
      r.map((row, i) => (i === idx ? { ...row, ...changes } : row))
    );
  }
}

function TogglePill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-full border ${
        active
          ? "bg-brand-orange text-white border-brand-orange"
          : "bg-white border-black/10"
      }`}
    >
      {label}
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        type="number"
        className="w-full rounded-md border border-black/10 px-3 py-2"
        value={isNaN(value) ? 0 : value}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        type={type}
        className="w-full rounded-md border border-black/10 px-3 py-2"
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

