"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Display";
import { useT } from "@/lib/i18n/client";

/** Keeps the nav around when a staff page fails, and explains a tap made without signal. */
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useT();
  const router = useRouter();
  const offline = typeof navigator !== "undefined" && !navigator.onLine;

  if (offline) {
    // The page is still in the router cache, so going back needs no network.
    return (
      <EmptyState
        icon={<WifiOff />}
        title={t("common.offlineTitle")}
        body={t("common.offlineNotSaved")}
        action={<Button onClick={reset}>{t("common.back")}</Button>}
      />
    );
  }

  return (
    <EmptyState
      icon={<AlertCircle />}
      title={t("common.errorTitle")}
      body={t("common.error")}
      action={
        <Button
          onClick={() =>
            startTransition(() => {
              router.refresh();
              reset();
            })
          }
        >
          {t("common.retry")}
        </Button>
      }
    />
  );
}
