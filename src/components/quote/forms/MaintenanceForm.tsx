"use client";

import { useState } from "react";
import AddressAutocomplete from "./AddressAutocomplete";
import TurnstileWidget from "../../shared/TurnstileWidget";

export default function MaintenanceForm() {
  const [address, setAddress] = useState("");
  const [kinds, setKinds] = useState<{
    maintenance: boolean;
    landscaping: boolean;
    gardening: boolean;
    carpentry: boolean;
  }>({
    maintenance: false,
    landscaping: false,
    gardening: false,
    carpentry: false,
  });
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
    const resp = await fetch("/api/quote/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        kinds,
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
        Book House Maintenance – Please Provide:
      </h3>
      <AddressAutocomplete
        label="Full Address or Suburb"
        value={address}
        onChange={setAddress}
      />
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">
          What Type of Maintenance Do You Need?
        </legend>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kinds.maintenance}
            onChange={(e) =>
              setKinds({ ...kinds, maintenance: e.target.checked })
            }
          />{" "}
          House Maintenance
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kinds.landscaping}
            onChange={(e) =>
              setKinds({ ...kinds, landscaping: e.target.checked })
            }
          />{" "}
          Landscaping
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kinds.gardening}
            onChange={(e) =>
              setKinds({ ...kinds, gardening: e.target.checked })
            }
          />{" "}
          Gardening
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={kinds.carpentry}
            onChange={(e) =>
              setKinds({ ...kinds, carpentry: e.target.checked })
            }
          />{" "}
          Carpentry
        </label>
      </fieldset>
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
            id="flex-maint"
            type="checkbox"
            checked={flex}
            onChange={(e) => setFlex(e.target.checked)}
          />
          <label htmlFor="flex-maint" className="font-semibold">
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
