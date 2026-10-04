"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n/client";
import { removePushSubscription, savePushSubscription, sendTestPush } from "@/app/app/me/actions";

type State = "loading" | "unsupported" | "blocked" | "off" | "on";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushToggle({ compact }: { compact?: boolean }) {
  const { t } = useT();
  const toast = useToast();
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return setState("unsupported");
      }
      if (Notification.permission === "denied") return setState("blocked");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState(permission === "denied" ? "blocked" : "off");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const res = await savePushSubscription(sub.toJSON(), navigator.userAgent);
      if (!res.ok) throw new Error(res.error);
      setState("on");
      toast(t("me.pushOn"));
    } catch {
      toast(t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await removePushSubscription(sub.endpoint);
      await sub.unsubscribe();
    }
    setState("off");
    setBusy(false);
  };

  const description =
    state === "on"
      ? t("me.pushOn")
      : state === "blocked"
        ? t("me.pushBlocked")
        : state === "unsupported"
          ? t("me.pushUnsupported")
          : t("me.pushOff");

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <BellRing className="size-5" />
        </span>
        <span className="grid gap-0.5">
          <span className="font-extrabold">{t("me.notifications")}</span>
          <span className="text-[13px] text-ink-2">{description}</span>
        </span>
      </div>
      {state === "off" && (
        <Button size="sm" onClick={enable} loading={busy}>
          {t("me.enable")}
        </Button>
      )}
      {state === "on" && !compact && (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await sendTestPush();
              toast(t("me.testSent"));
            }}
          >
            {t("me.test")}
          </Button>
          <Button size="sm" variant="secondary" onClick={disable} loading={busy}>
            {t("me.disable")}
          </Button>
        </div>
      )}
    </div>
  );
}
