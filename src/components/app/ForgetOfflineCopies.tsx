"use client";

import { useEffect } from "react";

/** Same name as PAGES_CACHE in public/sw.js. */
const PAGES_CACHE = "app-pages";

/** On the sign-in page, drop the staff pages the service worker kept for offline use. */
export function ForgetOfflineCopies() {
  useEffect(() => {
    if ("caches" in window) caches.delete(PAGES_CACHE).catch(() => {});
  }, []);
  return null;
}
