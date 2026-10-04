"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-[16px] text-ink placeholder:text-ink-2/70 " +
  "outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/15";

export const inputClass = cn(control, "h-12");
export const textareaClass = cn(control, "py-3 min-h-28 leading-relaxed");

type FieldProps = {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  optional?: string;
  className?: string;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode;
};

/** Label above, control, hint, error below. */
export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-bold text-ink">
        {label}
        {optional && <span className="ml-1.5 font-semibold text-ink-2">({optional})</span>}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-[13px] text-ink-2">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(textareaClass, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, "appearance-none bg-no-repeat pr-10", props.className)} />;
}

/** Toggle row: label + description on the left, switch on the right. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-center justify-between gap-4", disabled && "opacity-60")}>
      <span className="grid gap-0.5">
        <span className="text-[15px] font-bold text-ink">{label}</span>
        {description && <span className="text-[13px] text-ink-2">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-7 w-12 rounded-full bg-line transition peer-checked:bg-accent-strong peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" />
        <span className="absolute left-1 top-1 size-5 rounded-full bg-surface shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
