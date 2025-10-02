"use client";

type AddressAutocompleteProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
};

// Simple text input for addresses
export default function AddressAutocomplete({
  label,
  placeholder,
  value,
  onChange,
}: AddressAutocompleteProps) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        type="text"
        className="w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal"
        placeholder={placeholder || "Enter address"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
