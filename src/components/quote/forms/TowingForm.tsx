"use client";

import { useState } from "react";
import AddressAutocomplete from "./AddressAutocomplete";
import TurnstileWidget from "../../shared/TurnstileWidget";

export default function TowingForm() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [model, setModel] = useState("");
  const [date, setDate] = useState("");
  const [flex, setFlex] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const resp = await fetch("/api/quote/towing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        model,
        date,
        flex,
        name,
        email,
        phone,
        token,
      }),
    });
    if (resp.ok)
      setStatus(
        "Thanks! Your quote request has been sent. We'll be in touch shortly."
      );
    else setStatus("Could not submit");
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="text-lg font-extrabold">
        Request a Tow – We&apos;ll Need the Following Details:
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <AddressAutocomplete
          label="Pick-up Location"
          value={from}
          onChange={setFrom}
        />
        <AddressAutocomplete
          label="Drop-off Location"
          value={to}
          onChange={setTo}
        />
      </div>
      <TextField
        label="Car Model & Year"
        placeholder="E.g., Toyota Corolla 2015, Ford Ranger 2020, etc."
        value={model}
        onChange={setModel}
      />
      <div className="grid sm:grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-sm font-semibold mb-1">
            Preferred Tow Date
          </label>
          <input
            type="date"
            className="w-full rounded-md border border-black/10 px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            id="flex-tow"
            type="checkbox"
            checked={flex}
            onChange={(e) => setFlex(e.target.checked)}
          />
          <label htmlFor="flex-tow" className="font-semibold">
            My date is flexible
          </label>
        </div>
      </div>
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
      <TurnstileWidget onVerify={(t) => setToken(t)} />
      <div className="flex justify-end">
        <button className="btn-primary" type="submit">
          Submit Quote
        </button>
      </div>
      {status && <p className="text-sm text-black/70">{status}</p>}
    </form>
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
