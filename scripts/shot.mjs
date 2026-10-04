// Visual check helper (dev only).
// node --env-file=.env.local scripts/shot.mjs --path /app --as admin --out home --mobile --desktop [--dark] [--full]
import { chromium } from "playwright";
import { parseArgs } from "node:util";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const { values } = parseArgs({
  options: {
    path: { type: "string", default: "/" },
    as: { type: "string" },
    out: { type: "string", default: "shot" },
    mobile: { type: "boolean", default: false },
    desktop: { type: "boolean", default: false },
    dark: { type: "boolean", default: false },
    full: { type: "boolean", default: false },
    click: { type: "string", multiple: true },
    wait: { type: "string", default: "600" },
    base: { type: "string", default: "http://localhost:3001" },
  },
});

const ACCOUNTS = {
  admin: "admin.demo@example.com",
  supervisor: "tama.demo@example.com",
  kiri: "kiri.demo@example.com",
  mateo: "mateo.demo@example.com",
  sofia: "sofia.demo@example.com",
};

await mkdir("screenshots", { recursive: true });
await mkdir("screenshots/.auth", { recursive: true });
const browser = await chromium.launch();

async function session(viewport, isMobile) {
  const statePath = values.as ? `screenshots/.auth/${values.as}.json` : undefined;
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    isMobile,
    hasTouch: isMobile,
    colorScheme: values.dark ? "dark" : "light",
    storageState: statePath && existsSync(statePath) ? statePath : undefined,
  });
  if (values.as) {
    const page = await ctx.newPage();
    await page.goto(`${values.base}/app`);
    if (page.url().includes("/login")) {
      await page.fill('input[name="email"]', ACCOUNTS[values.as]);
      await page.fill('input[name="password"]', process.env.DEMO_PASSWORD);
      await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 }), page.click('button[type="submit"]')]);
      await ctx.storageState({ path: statePath });
    }
    await page.close();
  }
  return ctx;
}

const targets = [];
if (values.mobile || !values.desktop) targets.push(["m", { width: 390, height: 844 }, true]);
if (values.desktop) targets.push(["d", { width: 1280, height: 800 }, false]);

for (const [tag, viewport, isMobile] of targets) {
  const ctx = await session(viewport, isMobile);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${values.base}${values.path}`, { waitUntil: "networkidle" });
  for (const sel of values.click ?? []) {
    await page.click(sel);
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(Number(values.wait));
  const file = `screenshots/${values.out}-${tag}${values.dark ? "-dark" : ""}.png`;
  await page.screenshot({ path: file, fullPage: values.full });
  console.log(`saved ${file} (${page.url()})`);
  if (errors.length) console.log("page errors:\n  " + errors.slice(0, 8).join("\n  "));
  await ctx.close();
}
await browser.close();
