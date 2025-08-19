"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="py-16 text-center space-y-3">
      <h1 className="text-3xl font-extrabold">Something went wrong</h1>
      <p className="text-black/70">
        {error?.message || "An unexpected error occurred."}
      </p>
    </div>
  );
}
