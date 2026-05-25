"use client";

import { useState } from "react";
import AddressAutocomplete from "./AddressAutocomplete";
import TurnstileWidget from "../../shared/TurnstileWidget";

export default function CleaningForm() {
  const [address, setAddress] = useState("");
  const [kinds, setKinds] = useState<{
    house: boolean;
    endOfLease: boolean;
    commercial: boolean;
    deep: boolean;
    windows: boolean;
  }>({
    house: false,
    endOfLease: false,
    commercial: false,
    deep: false,
    windows: false,
  });
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [details, setDetails] = useState("");
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
    const resp = await fetch("/api/quote/cleaning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        kinds,
        bedrooms,
        bathrooms,
        details,
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
        Book a Clean – Please Provide:
      </h3>
      <AddressAutocomplete
        label="Full Address or Suburb"
        value={address}
        onChange={setAddress}
      />
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">
          What Type of Cleaning Do You Need?
        </legend>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kinds.house}
            onChange={(e) => setKinds({ ...kinds, house: e.target.checked })}
          />{" "}
          Regular House Cleaning
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kinds.endOfLease}
            onChange={(e) =>
              setKinds({ ...kinds, endOfLease: e.target.checked })
            }
          />{" "}
          End of Lease / Bond Clean
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kinds.commercial}
            onChange={(e) =>
              setKinds({ ...kinds, commercial: e.target.checked })
            }
          />{" "}
          Commercial / Office Cleaning
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kinds.deep}
            onChange={(e) => setKinds({ ...kinds, deep: e.target.checked })}
          />{" "}
          Deep / Spring Clean
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kinds.windows}
            onChange={(e) => setKinds({ ...kinds, windows: e.target.checked })}
          />{" "}
          Windows
        </label>
      </fieldset>
      <div className="grid sm:grid-cols-2 gap-4">
        <TextField
          label="Bedrooms"
          placeholder="e.g. 3"
          value={bedrooms}
          onChange={setBedrooms}
        />
        <TextField
          label="Bathrooms"
          placeholder="e.g. 2"
          value={bathrooms}
          onChange={setBathrooms}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">
          Please provide more details
        </label>
        <textarea
          className="w-full rounded-md border border-black/10 px-3 py-2"
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-sm font-semibold mb-1">
            Preferred Date for Service
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
            id="flex-clean"
            type="checkbox"
            checked={flex}
            onChange={(e) => setFlex(e.target.checked)}
          />
          <label htmlFor="flex-clean" className="font-semibold">
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
      {status && (
        <div
          className={`p-4 rounded-lg text-center text-lg font-bold ${
            status.includes("Thanks") || status.includes("shortly")
              ? "bg-green-100 text-green-800 border-2 border-green-500"
              : "bg-red-100 text-red-800 border-2 border-red-500"
          }`}
        >
          {status}
        </div>
      )}
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
