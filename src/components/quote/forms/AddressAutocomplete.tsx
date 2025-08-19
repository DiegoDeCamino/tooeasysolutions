"use client";

import { useEffect, useRef, useState } from "react";

type AddressAutocompleteProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
};

// Free address autocomplete powered by OpenStreetMap Nominatim
// Rate-limit friendly: simple debounce and minimal fields
export default function AddressAutocomplete({
  label,
  placeholder,
  value,
  onChange,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<
    Array<{ display_name: string }>
  >([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        setSuggestions([]);
        return;
      }
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            trimmed + ", Western Australia"
          )}&format=json&addressdetails=1&limit=5`,
          { headers: { "Accept-Language": "en-AU" } }
        );
        const json = await resp.json();
        setSuggestions(json ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        type="text"
        className="w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-black/10 bg-white shadow">
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              className="px-3 py-2 text-sm hover:bg-brand-cream cursor-pointer"
              onClick={() => {
                onChange(s.display_name);
                setQuery(s.display_name);
                setOpen(false);
              }}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
