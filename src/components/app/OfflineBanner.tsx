"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { useT } from "@/lib/i18n/client";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** Tells the crew they are looking at a saved copy while the phone has no signal. */
export function OfflineBanner() {
  const { t } = useT();
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-attention-soft px-4 py-2 text-sm font-medium text-attention">
      <WifiOff className="size-4 shrink-0" strokeWidth={2} />
      {t("common.offline")}
    </div>
  );
}
