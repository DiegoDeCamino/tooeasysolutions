/* Too Easy Crew service worker: push notifications + offline copies of the staff app. */
const VERSION = "v2";
const STATIC_CACHE = `static-${VERSION}`;
const ASSETS_CACHE = `assets-${VERSION}`;
// Last seen copy of each /app page. Cleared on the sign-in page (see ForgetOfflineCopies).
const PAGES_CACHE = "app-pages";
const OFFLINE_URL = "/offline.html";
const MAX_ASSETS = 200;
const MAX_PAGES = 40;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = [STATIC_CACHE, ASSETS_CACHE, PAGES_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

// Build files are content-hashed, so a cached copy never goes stale.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(ASSETS_CACHE);
    await cache.put(request, response.clone());
    trim(ASSETS_CACHE, MAX_ASSETS);
  }
  return response;
}

// Network first; keep the latest copy of staff pages so they still open without signal.
async function navigate(event, url) {
  const isApp = url.pathname === "/app" || url.pathname.startsWith("/app/");
  try {
    const response = await fetch(event.request);
    const landed = new URL(response.url || url.href).pathname;
    if (landed === "/login") {
      // Signed out or session expired: drop everything we kept for the previous person.
      event.waitUntil(caches.delete(PAGES_CACHE));
    } else if (isApp && response.ok && !response.redirected) {
      const copy = response.clone();
      event.waitUntil(
        caches
          .open(PAGES_CACHE)
          .then((cache) => cache.put(url.pathname + url.search, copy))
          .then(() => trim(PAGES_CACHE, MAX_PAGES)),
      );
    }
    return response;
  } catch {
    const saved = isApp && (await caches.match(url.pathname + url.search, { cacheName: PAGES_CACHE }));
    return saved || (await caches.match(OFFLINE_URL));
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(event, url));
  } else if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Too Easy", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Too Easy";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: data.tag,
      renotify: Boolean(data.tag),
      data: { href: data.href || "/app" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/app";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client && new URL(client.url).origin === self.location.origin) {
          client.navigate(href);
          return client.focus();
        }
      }
      return self.clients.openWindow(href);
    }),
  );
});
