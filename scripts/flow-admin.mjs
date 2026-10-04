// E2E: admin confirms + marks paid the newest requested booking, then a worker claims the shift.
// node --env-file=.env.local scripts/flow-admin.mjs
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const base = "http://localhost:3001";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: booking } = await db
  .from("bookings")
  .select("id, ref")
  .eq("status", "requested")
  .order("created_at", { ascending: false })
  .limit(1)
  .single();
if (!booking) throw new Error("No requested booking to work with");
console.log("booking", booking.ref);

const browser = await chromium.launch();
async function login(email, viewport, isMobile) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile, hasTouch: isMobile });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  await page.goto(`${base}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', process.env.DEMO_PASSWORD);
  await Promise.all([page.waitForURL(/\/app/), page.click('button[type="submit"]')]);
  return page;
}

const admin = await login("admin.demo@example.com", { width: 1280, height: 860 }, false);
await admin.goto(`${base}/app/cleaning/${booking.id}`, { waitUntil: "networkidle" });
await admin.getByRole("button", { name: "Confirm and request payment" }).last().click();
await admin.getByRole("button", { name: "Mark as paid" }).last().waitFor({ timeout: 30000 });
console.log("confirmed");
await admin.getByRole("button", { name: "Mark as paid" }).last().click();
await admin.getByRole("button", { name: "Mark completed" }).last().waitFor({ timeout: 30000 });
console.log("paid, shift created");
await admin.screenshot({ path: "screenshots/flow-admin-scheduled.png" });

const kiri = await login("kiri.demo@example.com", { width: 390, height: 844 }, true);
await kiri.goto(`${base}/app/shifts`, { waitUntil: "networkidle" });
await kiri.screenshot({ path: "screenshots/flow-kiri-open.png" });
await kiri.getByRole("button", { name: "Grab this shift" }).first().click();
await kiri.getByText("You're on it").first().waitFor({ timeout: 30000 });
await kiri.goto(`${base}/app/shifts?tab=mine`, { waitUntil: "networkidle" });
await kiri.screenshot({ path: "screenshots/flow-kiri-mine.png" });
console.log("kiri claimed");

await admin.goto(`${base}/app/cleaning/shifts`, { waitUntil: "networkidle" });
await admin.screenshot({ path: "screenshots/flow-admin-shifts.png" });
await browser.close();
