// E2E: a client books a clean on a phone. Prints the private booking URL.
// node --env-file=.env.local scripts/flow-booking.mjs [--name "Ava Thompson"] [--suggest]
import { chromium } from "playwright";
import { parseArgs } from "node:util";
import { mkdir } from "node:fs/promises";

const { values } = parseArgs({
  options: {
    name: { type: "string", default: "Ava Thompson" },
    email: { type: "string", default: "ava.demo@example.com" },
    suburb: { type: "string", default: "Dunsborough" },
    suggest: { type: "boolean", default: false },
    type: { type: "string", default: "Deep clean" },
    base: { type: "string", default: "http://localhost:3001" },
    shots: { type: "boolean", default: true },
  },
});

await mkdir("screenshots", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const shot = async (n) => values.shots && page.screenshot({ path: `screenshots/flow-${n}.png` });
const cont = () => page.getByRole("button", { name: "Continue" }).last().click();

await page.goto(`${values.base}/book/cleaning`, { waitUntil: "networkidle" });
await page.getByRole("radio", { name: new RegExp(values.type) }).click();
await page.getByRole("checkbox", { name: /Inside oven/ }).click();
await shot("1-service");
await cont();

await page.getByRole("button", { name: "Increase" }).nth(1).click(); // bathrooms 2 -> 3
await page.getByText("Pets at home", { exact: true }).click();
await page.getByRole("radio", { name: "Driveway" }).click();
await shot("2-home");
await cont();

await page.getByRole("radiogroup", { name: "Day" }).getByRole("radio").nth(2).click();
await page.getByRole("radio", { name: /^9:00/ }).click();
await shot("3-when");
await cont();

await page.getByLabel("Street address").fill("14 Seymour Boulevard");
await page.getByLabel("Suburb").fill(values.suburb);
await page.getByLabel("Your name").fill(values.name);
await page.getByLabel("Email").fill(values.email);
await page.getByLabel("Mobile").fill("0412 556 781");
if (values.suggest) {
  await page.getByText("Suggest a change", { exact: true }).click();
  await page.getByLabel("Why?").fill("We hand the keys back to the agent at 1pm");
}
await shot("4-you");
await page.getByRole("button", { name: "Request booking" }).last().click();
await page.getByText("Request sent").waitFor({ timeout: 30000 });
await shot("5-sent");
await page.getByRole("link", { name: "Track your booking" }).click();
await page.waitForURL(/\/b\//);
await page.waitForLoadState("networkidle");
await page.screenshot({ path: "screenshots/flow-6-client.png", fullPage: true });
console.log("BOOKING_URL", page.url());
if (errors.length) console.log("page errors:", errors);
await browser.close();
