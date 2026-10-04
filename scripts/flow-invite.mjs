// E2E: admin creates an invite in the app, a new worker joins with it on a phone (in Spanish).
// node --env-file=.env.local scripts/flow-invite.mjs
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const base = "http://localhost:3001";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const browser = await chromium.launch();

const admin = await (await browser.newContext({ viewport: { width: 1280, height: 860 }, permissions: ["clipboard-read", "clipboard-write"] })).newPage();
await admin.goto(`${base}/login`);
await admin.fill('input[name="email"]', "admin.demo@example.com");
await admin.fill('input[name="password"]', process.env.DEMO_PASSWORD);
await Promise.all([admin.waitForURL(/\/app/), admin.click('button[type="submit"]')]);
await admin.goto(`${base}/app/crew`, { waitUntil: "networkidle" });
await admin.getByRole("button", { name: "Invite someone" }).click();
await admin.getByRole("checkbox", { name: "Carpentry" }).click();
await admin.getByRole("button", { name: "Create invite link" }).click();
const link = (await admin.locator("div.font-mono").first().textContent()).trim();
await admin.screenshot({ path: "screenshots/invite-1-link.png" });
console.log("invite", link);

const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
await phone.goto(link, { waitUntil: "networkidle" });
await phone.getByRole("radio", { name: "es" }).click();
await phone.waitForTimeout(1200);
await phone.screenshot({ path: "screenshots/invite-2-join-es.png" });
const email = `nico.${Date.now()}@example.com`;
await phone.getByLabel("Nombre completo").fill("Nico Fuentes");
await phone.getByLabel("Celular").fill("0455 120 778");
await phone.getByLabel("Email").fill(email);
await phone.getByLabel("Contraseña").fill(process.env.DEMO_PASSWORD);
await Promise.all([phone.waitForURL(/\/app\?welcome=1/, { timeout: 30000 }), phone.getByRole("button", { name: "Crear cuenta" }).click()]);
await phone.waitForLoadState("networkidle");
await phone.screenshot({ path: "screenshots/invite-3-welcome.png" });
const { data } = await db.from("profiles").select("role, skills, locale").eq("email", email).single();
console.log("joined as", data);
await browser.close();
