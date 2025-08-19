"use client";

import { useEffect, useState } from "react";
import Turnstile from "react-turnstile";

export default function TurnstileWidget({
  onVerify,
}: {
  onVerify: (token: string) => void;
}) {
  const [siteKey, setSiteKey] = useState<string | null>(null);

  useEffect(() => {
    // Expose site key from public env
    setSiteKey(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null);
  }, []);

  if (!siteKey) {
    return null;
  }
  return (
    <div className="mt-2">
      <Turnstile
        sitekey={siteKey}
        theme="light"
        onVerify={(token) => onVerify(token)}
      />
    </div>
  );
}
