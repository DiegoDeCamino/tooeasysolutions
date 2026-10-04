// E2E: client sends a carpentry enquiry with photos, admin converts it and adds a supervisor,
// supervisor posts a photo update and advances a stage, then the client portal is captured.
// node --env-file=.env.local scripts/flow-carpentry.mjs
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const base = "http://localhost:3001";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const browser = await chromium.launch();
const log = (...a) => console.log("•", ...a);

async function ctx(viewport, isMobile) {
  const c = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile, hasTouch: isMobile });
  const page = await c.newPage();
  page.on("pageerror", (e) => console.log("pageerror:", e.message));
  return page;
}
async function login(page, email) {
  await page.goto(`${base}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', process.env.DEMO_PASSWORD);
  await Promise.all([page.waitForURL(/\/app/), page.click('button[type="submit"]')]);
}

// 1. Client enquiry on a phone
const client = await ctx({ width: 390, height: 844 }, true);
await client.goto(`${base}/carpentry`, { waitUntil: "networkidle" });
await client.getByRole("radio", { name: "Deck" }).click();
await client.getByLabel("Tell us about it").fill("We'd like a 6 by 4 metre merbau deck off the back sliding door, about 60cm off the ground, with two steps down to the lawn.");
await client.locator('input[type="file"]').setInputFiles(["public/images/projects/deck for resort.jpg", "public/images/projects/pergola and privacy screen.jpg"]);
await client.getByLabel("Suburb").fill("Yallingup");
await client.getByRole("radio", { name: "In 1 to 3 months" }).click();
await client.getByRole("radio", { name: "$15k to $40k" }).click();
await client.getByLabel("Your name").fill("Liam Carter");
await client.getByLabel("Email").fill("liam.demo@example.com");
await client.getByLabel("Mobile").fill("0423 118 904");
await client.screenshot({ path: "screenshots/carp-1-form.png" });
await client.getByRole("button", { name: "Send enquiry" }).click();
await client.getByText("we've got it").waitFor({ timeout: 60000 });
await client.screenshot({ path: "screenshots/carp-2-sent.png" });
const { data: enquiry } = await db.from("enquiries").select("id, photo_paths").order("created_at", { ascending: false }).limit(1).single();
log("enquiry saved with", enquiry.photo_paths.length, "photos");

// 2. Admin converts + adds supervisor
const admin = await ctx({ width: 1280, height: 860 }, false);
await login(admin, "admin.demo@example.com");
await admin.goto(`${base}/app/projects/enquiries/${enquiry.id}`, { waitUntil: "networkidle" });
await admin.screenshot({ path: "screenshots/carp-3-enquiry.png" });
await admin.getByRole("button", { name: "Convert to project" }).click();
await admin.getByRole("button", { name: "Create project" }).click();
await admin.waitForURL(/\/app\/projects\/[0-9a-f-]{36}/, { timeout: 30000 });
const projectUrl = admin.url().split("?")[0];
log("project created", projectUrl);
await admin.goto(`${projectUrl}?tab=team`, { waitUntil: "networkidle" });
await admin.getByRole("button", { name: "Add to team" }).click();
await admin.getByRole("radio", { name: "Supervisor" }).click();
await admin.getByRole("button", { name: /Tama Rewi/ }).click();
await admin.getByText("Tama Rewi").first().waitFor();
log("supervisor added");

// 3. Supervisor posts from site on a phone
const tama = await ctx({ width: 390, height: 844 }, true);
await login(tama, "tama.demo@example.com");
await tama.goto(projectUrl, { waitUntil: "networkidle" });
await tama.getByRole("button", { name: "Add" }).last().click();
await tama.getByRole("button", { name: /Update/ }).first().click();
await tama.locator('input[type="file"]').last().setInputFiles(["public/images/projects/deck for resort.jpg"]);
await tama.getByLabel("Note").fill("Site cleared and set out. Footings go in tomorrow morning.");
await tama.getByRole("button", { name: "Post update" }).click();
await tama.getByText("Update posted").waitFor({ timeout: 60000 });
await tama.waitForLoadState("networkidle");
log("update posted");
await tama.screenshot({ path: "screenshots/carp-4-feed.png" });
await tama.goto(`${projectUrl}?tab=stages`, { waitUntil: "networkidle" });
await tama.getByRole("button", { name: /Site prep/ }).click();
await tama.waitForTimeout(800);
await tama.getByRole("button", { name: /Site prep/ }).click();
await tama.waitForTimeout(1500);
await tama.screenshot({ path: "screenshots/carp-5-stages.png" });
log("stage advanced");

// 4. Client portal
const { data: project } = await db.from("projects").select("token").order("created_at", { ascending: false }).limit(1).single();
await client.goto(`${base}/p/${project.token}`, { waitUntil: "networkidle" });
await client.screenshot({ path: "screenshots/carp-6-portal.png", fullPage: true });
log("portal", `${base}/p/${project.token}`);
await admin.goto(projectUrl, { waitUntil: "networkidle" });
await admin.screenshot({ path: "screenshots/carp-7-admin-project.png" });
await browser.close();
