"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/**
 * Android/desktop Chrome: native install button via beforeinstallprompt.
 * iOS Safari: short Share > Add to Home Screen instructions.
 * Renders nothing once running as an installed app.
 */
export function InstallPrompt() {
  const { t } = useT();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"hidden" | "native" | "ios" | "installed">("hidden");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    if (standalone) return setMode("installed");
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    if (ios) setMode("ios");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("native");
    };
    const onInstalled = () => setMode("installed");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "hidden") return null;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <Smartphone className="size-5" />
        </span>
        <span className="grid gap-0.5">
          <span className="font-extrabold">{mode === "installed" ? t("me.installed") : t("me.install")}</span>
          {mode !== "installed" && (
            <span className="text-[13px] text-ink-2">
              {mode === "ios" ? (
                <span className="inline-flex flex-wrap items-center gap-1">
                  <Share className="size-3.5" /> <SquarePlus className="size-3.5" /> {t("me.installIos")}
                </span>
              ) : (
                t("me.installHint")
              )}
            </span>
          )}
        </span>
      </div>
      {mode === "native" && deferred && (
        <Button
          size="sm"
          icon={<Download className="size-4" />}
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            setDeferred(null);
          }}
        >
          {t("me.install")}
        </Button>
      )}
    </div>
  );
}
