"use client";

import { useState } from "react";
import TurnstileWidget from "@/components/shared/TurnstileWidget";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resp = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message, token }),
    });
    if (resp.ok) setStatus("Thanks! We'll get back to you shortly.");
    else setStatus("Could not submit");
  };

  return (
    <form onSubmit={submit} className="card p-5 space-y-3">
      <h2 className="text-xl font-bold">Send us a message</h2>
      <TextField label="Name" value={name} onChange={setName} required />
      <TextField
        label="Email"
        value={email}
        onChange={setEmail}
        type="email"
        required
      />
      <div>
        <label className="block text-sm font-semibold mb-1">Message</label>
        <textarea
          className="w-full rounded-md border border-black/10 px-3 py-2"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <TurnstileWidget onVerify={(t) => setToken(t)} />
      <div className="flex justify-end">
        <button className="btn-primary" type="submit">
          Send
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
