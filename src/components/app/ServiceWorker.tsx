"use client";

import { useEffect } from "react";

/** Registers the service worker that powers install, push and the offline page. */
export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => console.warn("SW registration failed", err));
  }, []);
  return null;
}
