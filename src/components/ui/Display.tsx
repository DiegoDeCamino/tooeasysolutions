import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

export type Tone = "neutral" | "accent" | "attention" | "ok" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-2",
  accent: "bg-accent-soft text-accent-strong",
  attention: "bg-attention-soft text-attention",
  ok: "bg-ok-soft text-ok",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-full px-2 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-(--r-card) border border-line bg-surface shadow-soft", className)} {...rest}>
      {children}
    </div>
  );
}

export function Avatar({ name, size = 36, className }: { name: string | null | undefined; size?: number; className?: string }) {
  return (
    <span
      title={name ?? undefined}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-strong ring-2 ring-surface",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names, max = 4, size = 30 }: { names: string[]; max?: number; size?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <span className="flex items-center">
      {shown.map((n, i) => (
        <Avatar key={`${n}-${i}`} name={n} size={size} className={i ? "-ml-2" : ""} />
      ))}
      {rest > 0 && (
        <span
          style={{ width: size, height: size }}
          className="-ml-2 inline-flex items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink-2 ring-2 ring-surface"
        >
          +{rest}
        </span>
      )}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-(--r-card) border border-dashed border-line px-6 py-10 text-center", className)}>
      {icon && <div className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-ink-2 [&_svg]:size-5">{icon}</div>}
      <div className="grid max-w-xs gap-1">
        <p className="font-medium text-ink">{title}</p>
        {body && <p className="text-sm text-ink-2">{body}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} aria-hidden />;
}

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  back?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-1.5">
        {back && (
          <Link
            href={back}
            aria-label="Back"
            className="-ml-2 inline-flex size-9 shrink-0 items-center justify-center rounded-(--r-control) text-ink-2 transition hover:bg-surface-2 hover:text-ink"
          >
            <ChevronLeft className="size-5" />
          </Link>
        )}
        <div className="grid min-w-0 gap-1">
          <h1 className="text-2xl font-semibold leading-9 tracking-[-0.02em] text-ink">{title}</h1>
          {subtitle && <div className="text-sm text-ink-2">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Circular progress. value 0..1 */
export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  label,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <span className="tabular absolute text-[13px] font-semibold text-ink">{label ?? `${Math.round(v * 100)}%`}</span>
    </span>
  );
}

/** Thin linear progress with an optional trailing label. value 0..1 */
export function ProgressBar({ value, label, className }: { value: number; label?: React.ReactNode; className?: string }) {
  const v = Math.min(1, Math.max(0, value));
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v * 100)}
        className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"
      >
        <span className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${v * 100}%` }} />
      </span>
      {label !== undefined && <span className="tabular shrink-0 text-xs font-medium text-ink-2">{label}</span>}
    </span>
  );
}

/** Label/value pair used in detail views. */
export function Stat({ label, value, className }: { label: React.ReactNode; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-0.5", className)}>
      <span className="text-[13px] text-ink-2">{label}</span>
      <span className="tabular text-base font-semibold text-ink">{value}</span>
    </div>
  );
}
