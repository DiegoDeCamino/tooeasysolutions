# Too Easy Ops Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> Execution note: the user asked for uninterrupted execution ("no pares hasta que esté todo listo"), so this plan is executed inline by the same session that wrote it. Pure logic (pricing, status machine, i18n parity) carries full test code here; SQL and UI tasks carry exact files, interfaces and acceptance checks, and the code is written directly into those files during execution rather than duplicated in this document.

**Goal:** A local, working prototype of cleaning bookings with instant estimates, an invite-only crew PWA with shift claiming, and carpentry enquiries/projects, all on the real Supabase project.

**Architecture:** Next.js 15 App Router in this repo. Marketing pages move into a `(site)` route group; the staff PWA lives at `/app` with its own shell. Supabase provides Postgres + RLS, Auth (email/password, accounts created server-side), private Storage via signed URLs and Realtime. All writes go through server actions using zod validation.

**Tech Stack:** Next 15.5, React 19, Tailwind v4, `@supabase/ssr` + `@supabase/supabase-js`, zod, motion, web-push, Vitest, lucide-react (already in the project; one icon family).

**Spec:** `docs/superpowers/specs/2026-10-04-tooeasy-ops-platform-design.md`

## Global Constraints

- Public site copy: English. Staff app: EN/ES via per-user `locale`, every key present in both dictionaries.
- Business timezone `Australia/Perth` (UTC+08:00, no DST). Store `service_date` (date) + `start_time` (time) for bookings; shifts use `timestamptz` built with `+08:00`.
- Currency AUD, prices rounded up to `settings.price_rounding` (default 5).
- Never expose Postgres to the browser for public flows; service-role client is `server-only`.
- Only admins can read money (`project_financials`, expenses of others, prices in admin views).
- Visual rules (taste): one accent (teal `#0ea5a4`), orange only for "needs attention"; radius rule: buttons `rounded-full`, cards `rounded-2xl`, inputs `rounded-xl`; no em/en dashes in visible new copy; 44px min touch targets; `min-h-dvh` not `h-screen`; reduced-motion respected; staff app supports light + dark via tokens.
- PWA must be installable (manifest + icons + SW + install prompt).
- Missing Resend / Stripe / VAPID / Turnstile keys degrade gracefully.

## File Map

```
supabase/migrations/20261004000100_core.sql        enums, tables, helper fns, triggers
supabase/migrations/20261004000200_rls.sql         RLS policies, grants, storage bucket+policies, realtime
supabase/migrations/20261004000300_functions.sql   claim_shift, leave_shift
supabase/seed.sql                                  settings, clean types, addons, presets, stage templates
scripts/create-user.mjs                            create admin/supervisor/worker from CLI
scripts/seed-demo.mjs                              demo bookings, shifts, enquiry, project with photos
src/middleware.ts                                  session refresh + /app guard
src/lib/supabase/{server,client,admin,middleware,types}.ts
src/lib/auth.ts                                    getViewer(), requireStaff(), requireAdmin()
src/lib/env.ts                                     siteUrl(), feature flags (hasResend, hasStripe, hasPush)
src/lib/pricing/{types,estimate,index}.ts + estimate.test.ts
src/lib/bookings/{status,status.test}.ts
src/lib/i18n/{en,es,index,server,client}.ts(x) + parity.test.ts
src/lib/notify/{email,push,templates,index}.ts
src/lib/payments/index.ts                          createCheckout() stub
src/lib/media.ts                                   signed upload / signed read helpers
src/lib/format.ts                                  money, dates (Perth), initials
src/lib/tokens.ts                                  randomToken()
src/components/ui/*                                Button, Field, Stepper, Chips, Segmented, Sheet, Badge,
                                                   Avatar, EmptyState, Skeleton, Toast, ProgressRing, PhotoPicker,
                                                   PhotoGrid, PageHeader
src/components/app/*                               AppShell, BottomNav, SideNav, InstallPrompt, PushToggle,
                                                   NotificationsBell, LocaleSwitch
src/app/layout.tsx                                 html/body/fonts only (modified)
src/app/(site)/layout.tsx                          marketing header/footer (moved from root layout)
src/app/(site)/{page,about,community,contact,faq,projects}/...   moved, URLs unchanged
src/app/(site)/book/cleaning/{page,BookingWizard,actions}.tsx
src/app/(site)/b/[token]/{page,actions}.tsx
src/app/(site)/carpentry/{page,EnquiryForm,actions}.tsx
src/app/(site)/p/[token]/page.tsx
src/app/(site)/account/page.tsx
src/app/(auth)/{layout,login,join/[token],reset-password}/...
src/app/auth/callback/route.ts
src/app/manifest.ts, public/sw.js, public/icons/*
src/app/app/layout.tsx + pages: page (home), cleaning/{page,[id],calendar,shifts}, shifts, projects/{page,[id],new,enquiries,enquiries/[id]},
                     crew, settings/{pricing,templates}, me, notifications
src/app/app/**/actions.ts                          server actions per area
```

---

### Task 1: Foundation deps, env, Supabase clients, route groups

**Files:** package.json, `.env.local` (not committed), `.env.example`, `src/lib/supabase/*`, `src/lib/env.ts`, `src/middleware.ts`, `src/app/layout.tsx`, `src/app/(site)/layout.tsx`, move marketing pages into `(site)`, `vitest.config.ts`.

- [ ] Install: `pnpm add @supabase/supabase-js @supabase/ssr zod motion web-push server-only` and `pnpm add -D vitest @types/web-push`.
- [ ] Write `.env.local` from `supabase projects api-keys` (never echo values), generate VAPID keys with `web-push generate-vapid-keys --json`.
- [ ] Create clients: `createClient()` (server, cookies), `createBrowserClient()`, `createAdminClient()` (`import "server-only"`), `updateSession(req)`.
- [ ] Middleware: refresh session for all routes except static; redirect unauthenticated `/app/*` to `/login?next=`.
- [ ] Root layout keeps fonts + `<html><body>`; move header/footer into `(site)/layout.tsx`; `git mv` marketing pages into `(site)`.
- [ ] `pnpm build` passes; commit.

### Task 2: Database schema, RLS, functions, seed

**Files:** the three migrations + `supabase/seed.sql`, `src/lib/supabase/types.ts` (generated).

Schema exactly as spec §4 plus: `bookings.ref` (6-char code), `bookings.suburb`, `shift_details(shift_id PK, address, access_notes)` (readable by admins and signed-up workers only), `settings.hours_per_extra_level`, `settings.pet_hours`, `settings.price_rounding`.

- [ ] `core.sql`: enums `app_role`, `booking_status`, `payment_status`, `shift_status`, `enquiry_status`, `project_status`, `stage_status`, `expense_category`, `material_status`; tables; `updated_at` trigger; `handle_new_user()` trigger on `auth.users` inserting a `client` profile (role never taken from metadata); helpers `my_role()`, `is_admin()`, `is_staff()`, `is_project_member(uuid)` (`security definer`, `stable`, `search_path = ''`).
- [ ] `rls.sql`: enable RLS on every table; policies per spec §4; column grants on `profiles` (authenticated may update only `full_name, phone, locale, avatar_path`); bucket `media` (private, 10 MB, images only); realtime publication for `shift_signups`, `shifts`, `notifications`.
- [ ] `functions.sql`: `claim_shift(p_shift uuid) returns text` ('ok' | 'full' | 'closed' | 'forbidden' | 'already'), `leave_shift(p_shift uuid) returns text`; both `security definer`, lock the shift row `for update`.
- [ ] Apply with `supabase db query --linked -f <file>` in order; run `seed.sql`.
- [ ] Verify: query `pg_policies` count per table > 0; `supabase db advisors --linked` shows no RLS-disabled tables.
- [ ] `supabase gen types typescript --linked > src/lib/supabase/types.ts`; commit.

### Task 3: Pricing engine (TDD)

**Files:** `src/lib/pricing/types.ts`, `estimate.ts`, `index.ts`, `estimate.test.ts`.

**Interfaces (Produces):**
```ts
export type PricingSettings = { clientHourlyRate: number; baseHours: number; hoursPerBedroom: number;
  hoursPerBathroom: number; hoursPer50Sqm: number; hoursPerExtraLevel: number; petHours: number;
  maxShiftHours: number; minPrice: number; priceRounding: number };
export type CleanType = { id: string; name: string; multiplier: number };
export type Addon = { id: string; name: string; kind: "hours" | "fixed"; value: number };
export type Preset = { id: string; name: string; cleanTypeId: string | null; bedrooms: number;
  bathrooms: number; maxSqm: number | null; fixedPrice: number };
export type HomeInput = { bedrooms: number; bathrooms: number; sqm: number | null; levels: number; pets: boolean };
export type EstimateInput = { settings: PricingSettings; cleanType: CleanType; addons: Addon[];
  presets: Preset[]; home: HomeInput; crew?: number; maxHours?: number };
export type BreakdownLine = { label: string; hours?: number; amount?: number };
export type Estimate = { labourHours: number; price: number; crew: number; hours: number;
  breakdown: BreakdownLine[]; presetId: string | null };
export function estimate(input: EstimateInput): Estimate;
export function guessSqm(bedrooms: number): number;   // 50 + 30*bedrooms
export function roundUpTo(value: number, step: number): number;
```

- [ ] **Step 1: failing tests** (`estimate.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { estimate, guessSqm, roundUpTo } from "./estimate";
import type { PricingSettings, CleanType, Addon, Preset } from "./types";

const settings: PricingSettings = { clientHourlyRate: 55, baseHours: 1.5, hoursPerBedroom: 1,
  hoursPerBathroom: 0.75, hoursPer50Sqm: 0.5, hoursPerExtraLevel: 0.5, petHours: 0.5,
  maxShiftHours: 5, minPrice: 140, priceRounding: 5 };
const regular: CleanType = { id: "regular", name: "Regular", multiplier: 1 };
const bond: CleanType = { id: "bond", name: "End of lease", multiplier: 1.7 };
const oven: Addon = { id: "oven", name: "Inside oven", kind: "hours", value: 0.75 };
const carpet: Addon = { id: "carpet", name: "Carpet steam", kind: "fixed", value: 120 };
const home = { bedrooms: 3, bathrooms: 2, sqm: 150, levels: 1, pets: false };

describe("roundUpTo", () => {
  it("rounds up to the step", () => {
    expect(roundUpTo(401, 5)).toBe(405);
    expect(roundUpTo(400, 5)).toBe(400);
    expect(roundUpTo(2.1, 0.25)).toBe(2.25);
  });
});

describe("guessSqm", () => {
  it("estimates floor area from bedrooms", () => expect(guessSqm(3)).toBe(140));
});

describe("estimate", () => {
  it("computes labour hours from the home", () => {
    // 1.5 + 3*1 + 2*0.75 + ceil(150/50)*0.5 = 7.5
    const e = estimate({ settings, cleanType: regular, addons: [], presets: [], home });
    expect(e.labourHours).toBe(7.5);
    expect(e.price).toBe(415); // 7.5*55 = 412.5 -> 415
    expect(e.crew).toBe(2);    // ceil(7.5/5)
    expect(e.hours).toBe(3.75);
    expect(e.presetId).toBeNull();
  });

  it("applies the clean type multiplier, extra levels, pets and hour add-ons", () => {
    const e = estimate({ settings, cleanType: bond, addons: [oven], presets: [],
      home: { ...home, levels: 2, pets: true } });
    // base labour (7.5 + 0.5 level + 0.5 pets) * 1.7 = 14.45 + 0.75 oven = 15.2 -> 15.25
    expect(e.labourHours).toBe(15.25);
    expect(e.crew).toBe(4);
    expect(e.hours).toBe(4); // 15.25/4 = 3.8125 -> 4
  });

  it("adds fixed add-ons to the price, not to the hours", () => {
    const e = estimate({ settings, cleanType: regular, addons: [carpet], presets: [], home });
    expect(e.labourHours).toBe(7.5);
    expect(e.price).toBe(535); // 412.5 + 120 = 532.5 -> 535
  });

  it("never goes below the minimum price", () => {
    const e = estimate({ settings, cleanType: regular, addons: [], presets: [],
      home: { bedrooms: 0, bathrooms: 0, sqm: 20, levels: 1, pets: false } }); // 2h * 55 = 110
    expect(e.price).toBe(140);
  });

  it("uses a guessed floor area when sqm is unknown", () => {
    const known = estimate({ settings, cleanType: regular, addons: [], presets: [], home: { ...home, sqm: 140 } });
    const unknown = estimate({ settings, cleanType: regular, addons: [], presets: [], home: { ...home, sqm: null } });
    expect(unknown.labourHours).toBe(known.labourHours);
  });

  it("lets a matching preset fix the price", () => {
    const preset: Preset = { id: "p1", name: "3x2 regular", cleanTypeId: "regular", bedrooms: 3,
      bathrooms: 2, maxSqm: 180, fixedPrice: 380 };
    const e = estimate({ settings, cleanType: regular, addons: [], presets: [preset], home });
    expect(e.price).toBe(380);
    expect(e.presetId).toBe("p1");
  });

  it("ignores presets for other clean types or bigger homes", () => {
    const preset: Preset = { id: "p1", name: "3x2 regular", cleanTypeId: "regular", bedrooms: 3,
      bathrooms: 2, maxSqm: 120, fixedPrice: 380 };
    expect(estimate({ settings, cleanType: regular, addons: [], presets: [preset], home }).presetId).toBeNull();
    expect(estimate({ settings, cleanType: bond, addons: [], presets: [{ ...preset, maxSqm: null }], home }).presetId).toBeNull();
  });

  it("still adds fixed add-ons on top of a preset", () => {
    const preset: Preset = { id: "p1", name: "any 3x2", cleanTypeId: null, bedrooms: 3, bathrooms: 2,
      maxSqm: null, fixedPrice: 380 };
    expect(estimate({ settings, cleanType: regular, addons: [carpet], presets: [preset], home }).price).toBe(500);
  });

  it("re-plans crew when the client asks for more people, keeping the price", () => {
    const base = estimate({ settings, cleanType: regular, addons: [], presets: [], home });
    const three = estimate({ settings, cleanType: regular, addons: [], presets: [], home, crew: 3 });
    expect(three.crew).toBe(3);
    expect(three.hours).toBe(2.5);
    expect(three.price).toBe(base.price);
  });

  it("re-plans crew from a maximum duration", () => {
    const e = estimate({ settings, cleanType: regular, addons: [], presets: [], home, maxHours: 2 });
    expect(e.crew).toBe(4);
    expect(e.hours).toBe(2);
  });

  it("clamps crew between 1 and 8", () => {
    expect(estimate({ settings, cleanType: regular, addons: [], presets: [], home, crew: 0 }).crew).toBe(1);
    expect(estimate({ settings, cleanType: regular, addons: [], presets: [], home, crew: 20 }).crew).toBe(8);
  });

  it("explains itself with a breakdown", () => {
    const e = estimate({ settings, cleanType: regular, addons: [carpet], presets: [], home });
    expect(e.breakdown.map((l) => l.label)).toEqual(
      expect.arrayContaining(["Base visit", "3 bedrooms", "2 bathrooms", "Carpet steam"]));
  });
});
```

- [ ] **Step 2:** `pnpm vitest run src/lib/pricing` → FAIL (module missing).
- [ ] **Step 3:** implement `estimate.ts` per spec §5 (labour rounded up to 0.25; crew clamp 1..8; preset match: active filtering is done by caller, match `cleanTypeId === null || === cleanType.id`, equal bedrooms and bathrooms, `maxSqm === null || effectiveSqm <= maxSqm`, first match wins).
- [ ] **Step 4:** tests PASS.
- [ ] **Step 5:** commit `feat(pricing): labour-hours estimate engine`.

### Task 4: Booking status machine (TDD)

**Files:** `src/lib/bookings/status.ts`, `status.test.ts`.

**Produces:**
```ts
export type BookingStatus = "requested" | "awaiting_payment" | "scheduled" | "completed" | "declined" | "cancelled";
export type BookingAction = "confirm" | "mark_paid" | "complete" | "decline" | "cancel";
export function canTransition(from: BookingStatus, action: BookingAction): boolean;
export function nextStatus(from: BookingStatus, action: BookingAction): BookingStatus; // throws on invalid
export function allowedActions(from: BookingStatus): BookingAction[];
export const CLIENT_STEPS: BookingStatus[]; // requested, awaiting_payment, scheduled, completed
export function isEditable(status: BookingStatus): boolean; // requested | awaiting_payment
```

- [ ] **Step 1: failing tests**

```ts
import { describe, expect, it } from "vitest";
import { allowedActions, canTransition, isEditable, nextStatus } from "./status";

describe("booking status machine", () => {
  it("follows the happy path", () => {
    expect(nextStatus("requested", "confirm")).toBe("awaiting_payment");
    expect(nextStatus("awaiting_payment", "mark_paid")).toBe("scheduled");
    expect(nextStatus("scheduled", "complete")).toBe("completed");
  });
  it("declines only new requests", () => {
    expect(canTransition("requested", "decline")).toBe(true);
    expect(canTransition("scheduled", "decline")).toBe(false);
  });
  it("cancels anything not finished", () => {
    for (const s of ["requested", "awaiting_payment", "scheduled"] as const)
      expect(nextStatus(s, "cancel")).toBe("cancelled");
    expect(canTransition("completed", "cancel")).toBe(false);
    expect(canTransition("declined", "cancel")).toBe(false);
  });
  it("rejects skipping payment", () => {
    expect(() => nextStatus("requested", "mark_paid")).toThrow();
  });
  it("lists actions for the admin UI", () => {
    expect(allowedActions("requested")).toEqual(["confirm", "decline", "cancel"]);
    expect(allowedActions("completed")).toEqual([]);
  });
  it("only allows price edits before scheduling", () => {
    expect(isEditable("requested")).toBe(true);
    expect(isEditable("awaiting_payment")).toBe(true);
    expect(isEditable("scheduled")).toBe(false);
  });
});
```

- [ ] Run → FAIL; implement transition table; run → PASS; commit.

### Task 5: i18n, format helpers, UI kit, design tokens

**Files:** `src/lib/i18n/*`, `src/lib/format.ts`, `src/lib/tokens.ts`, `src/components/ui/*`, `src/app/globals.css`.

**Produces:** `type Locale = "en" | "es"`; `getDict(locale)`; `getServerT()` → `{ t, locale }` reading viewer profile or `locale` cookie; `<I18nProvider dict locale>` + `useT()` → `t(key, vars?)`; keys are dotted strings typed from `en`.
`formatMoney(n)`, `formatDate(dateStr, locale)`, `formatTime(hhmm)`, `formatHours(n)`, `initials(name)`, `perthDateTime(date, time) → Date`, `randomToken(bytes=24)`.

- [ ] **Parity test** `src/lib/i18n/parity.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { en } from "./en";
import { es } from "./es";

function keys(o: Record<string, unknown>, p = ""): string[] {
  return Object.entries(o).flatMap(([k, v]) =>
    typeof v === "object" && v !== null ? keys(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`]);
}

describe("i18n", () => {
  it("has the same keys in English and Spanish", () => {
    expect(keys(es).sort()).toEqual(keys(en).sort());
  });
  it("has no empty strings", () => {
    for (const d of [en, es]) for (const k of keys(d))
      expect(k.split(".").reduce((o: any, s) => o[s], d)).not.toBe("");
  });
});
```

- [ ] Tokens in `globals.css`: `.app` scope with `--surface`, `--surface-2`, `--ink`, `--ink-2`, `--line`, `--accent`, `--accent-ink`, `--attention`, `--ok`, `--danger`; dark values under `@media (prefers-color-scheme: dark)`; Tailwind `@theme` aliases (`bg-surface`, `text-ink`, ...).
- [ ] UI kit components (client where interactive), each with 44px targets, focus-visible ring, disabled/loading states: `Button` (variants primary/secondary/ghost/danger, `loading`), `Field` (label above, hint, error below), `Stepper` (− value +), `Chips` (single/multi), `Segmented`, `Sheet` (bottom sheet < 768px, centered dialog ≥ 768px, focus trap, Esc, motion slide), `Badge`, `Avatar`/`AvatarStack`, `EmptyState`, `Skeleton`, `ToastProvider`/`useToast`, `ProgressRing`, `PhotoPicker` (resize ≤1600px JPEG q0.82 via canvas, previews, remove), `PhotoGrid` + lightbox, `PageHeader`.
- [ ] Tests pass, build passes, commit.

### Task 6: Auth flows, PWA shell, notifications plumbing

**Files:** `src/lib/auth.ts`, `(auth)/*`, `auth/callback/route.ts`, `src/app/manifest.ts`, `public/sw.js`, `public/icons/*`, `src/components/app/*`, `src/app/app/layout.tsx`, `src/app/app/me/*`, `src/app/app/notifications/*`, `src/lib/notify/*`, `src/lib/email` refactor of `src/lib/sendEmail.ts` (accept `to`).

**Produces:** `getViewer(): Promise<{ user; profile } | null>`, `requireStaff()`, `requireAdmin()`; `notify({ to: { roles?: AppRole[]; profileIds?: string[]; skill?: "cleaning" | "carpentry" }, title, body, href, emailAdmins?: { subject; html } })`; `sendMail({ to, subject, html })`; `sendPush(profileIds, payload)`; `emailLayout({ heading, intro, rows?, cta? })`.

- [ ] Login (email + password, `next` param), forgot password → `resetPasswordForEmail` → `/auth/callback` → `/reset-password`.
- [ ] `/join/[token]`: validate invite (exists, not expired, uses < max), form → server action creates user via admin API (`email_confirm: true`), sets profile role/skills/locale/phone, increments uses, signs in, notifies admins, redirects `/app?welcome=1`.
- [ ] App shell: SideNav ≥1024px, BottomNav <1024px with safe-area padding, role-based items (admin: Home, Cleaning, Projects, Crew, More; staff: Home, Shifts, Projects, Me); notifications bell with Realtime unread count.
- [ ] PWA: manifest (`name: "Too Easy Crew"`, `start_url: "/app"`, `display: "standalone"`, theme `#0ea5a4`, background `#f7f3e9`, icons 192/512 + maskable), icons generated from `public/images/logo.png` with `sharp` (dev-only script), SW handles `push`, `notificationclick`, offline fallback; `InstallPrompt` (Android `beforeinstallprompt`; iOS share-sheet steps; hidden when `display-mode: standalone`); `PushToggle` subscribes with VAPID and saves to `push_subscriptions`.
- [ ] `/app/me`: name, phone, language switch (writes profile + cookie), notifications toggle, install app, change password, sign out.
- [ ] Create admin with `scripts/create-user.mjs`; log in locally; verify redirect guards; commit.

### Task 7: Pricing settings (admin)

**Files:** `src/app/app/settings/pricing/{page,PricingEditor,actions}.tsx`, `src/lib/pricing/load.ts` (`loadPricing(client) → { settings, cleanTypes, addons, presets }` mapping snake_case rows to engine types).

- [ ] Sections: Rates & rules (number fields with units), Clean types (name, multiplier, active), Add-ons (name, hours/fixed, value), Fixed-price presets (type or any, bedrooms, bathrooms, max m², price).
- [ ] Sticky "Try it" preview: steppers for a sample home, shows the engine output live using unsaved values.
- [ ] Actions: `saveSettings`, `upsertCleanType`, `upsertAddon`, `upsertPreset`, `deleteRow(table,id)`; all `requireAdmin()` + zod.
- [ ] Commit.

### Task 8: Public cleaning booking wizard

**Files:** `src/app/(site)/book/cleaning/{page,BookingWizard,EstimateBar,actions}.tsx`, home page tab CTA in `QuoteTabs.tsx`.

**Consumes:** `estimate()`, `loadPricing()`, `notify()`, `sendMail()`, `emailLayout()`.
**Produces:** `createBooking(input) → { ok: true, token } | { ok: false, error, fieldErrors? }`.

- [ ] Steps: Service (clean type cards with description + multiplier hint, add-on chips) → Home (steppers bedrooms/bathrooms/levels, m² slider + "Not sure" toggle, pets, parking chips, access notes) → When (next-14-days chips + date input, start time chips 7:00 to 15:00, flexible toggle) → You (address, suburb, name, email, phone, notes, "Suggest a change" panel: more people / shorter time with crew stepper or max-hours chips + reason, shows "Same total work, finished sooner") → Turnstile → Submit.
- [ ] Estimate bar: sticky bottom on mobile (price + crew×hours, expandable breakdown), sticky side card on desktop; animates value changes (motion, reduced-motion safe).
- [ ] Server re-computes the estimate from DB pricing (never trusts the client price), stores `estimate` and `suggestion` jsonb, logs `booking_events`, notifies admins (inbox + push + email), emails client with `/b/[token]`.
- [ ] Success screen with reference code and link.
- [ ] Commit.

### Task 9: Client booking page + optional account

**Files:** `src/app/(site)/b/[token]/{page,ClientActions,actions}.tsx`, `src/app/(site)/account/page.tsx`.

- [ ] Progress tracker (Requested, Confirmed, Paid, Done) with current step; details; estimate vs final; client suggestion echo; admin note.
- [ ] `awaiting_payment`: Pay button when `payment_url`, otherwise "We'll send payment details" with reference.
- [ ] Cancel (requested/awaiting_payment) with confirm sheet → status `cancelled`, admin notified.
- [ ] "Keep track of your bookings" card: create password → creates `client` user with booking email (if none), links all bookings with that email, signs in, redirects `/account`. If the email already has an account: sign-in link.
- [ ] `/account`: list of bookings with status badges linking to `/b/[token]`.
- [ ] Commit.

### Task 10: Admin cleaning: requests, detail, calendar

**Files:** `src/app/app/cleaning/{page,[id]/page,[id]/BookingAdmin,[id]/actions,calendar/page,shifts/page}.tsx`.

- [ ] List with Segmented filter (New, Awaiting payment, Scheduled, Past) and counts; cards show date, suburb, type, price, suggestion flag (orange "Change suggested").
- [ ] Detail: client card (tap to call/email), home details, estimate breakdown, suggestion highlight with "Apply suggestion" button, editable final crew/hours/price with live engine recalculation, worker brief, admin note to client, timeline.
- [ ] Actions with `nextStatus()`: confirm (emails client with link + payment info via `createCheckout()`), decline (reason), mark paid (creates shift + `shift_details`, pushes to cleaning crew, emails client "You're booked"), complete (marks shift done), cancel.
- [ ] Calendar: month grid ≥768px, agenda list <768px; bookings coloured by status; shift fill "2/3".
- [ ] Shifts (admin): upcoming shifts with signups, add/remove worker sheet.
- [ ] Commit.

### Task 11: Crew: invites, people, worker shifts

**Files:** `src/app/app/crew/{page,InviteSheet,actions}.tsx`, `src/app/app/shifts/{page,ShiftCard,actions}.tsx`, `src/app/app/page.tsx` (home).

- [ ] Invite sheet: role, skills, expiry (1/7/30 days), uses (1/5/25); result link with Copy, Share (Web Share API), WhatsApp deep link; pending invites with revoke.
- [ ] People list: avatar, name, role badge, skills, active switch, edit role/skills sheet.
- [ ] Worker shifts: tabs Open / Mine; ShiftCard (date, time window, suburb, pay "≈ $128", brief, AvatarStack + spots left), Claim/Leave via `claim_shift`/`leave_shift` RPC with optimistic UI and Realtime refresh; full address + access notes visible once claimed; admins notified on claim/leave.
- [ ] Home: admin "Needs attention" (new requests, new enquiries, unfilled shifts in next 7 days, active projects); worker next shift, open shifts CTA, my projects; welcome card (install + notifications) when `?welcome=1` or not installed.
- [ ] Commit.

### Task 12: Carpentry enquiry (public) + inbox

**Files:** `src/app/(site)/carpentry/{page,EnquiryForm,actions}.tsx`, `src/lib/media.ts`, `src/app/app/projects/enquiries/{page,[id]/page,[id]/actions}.tsx`.

**Produces:** `createUploadTargets({ scope: "enquiry" | "project" | "receipt", scopeId, files: number }) → { path, token }[]`, `signedUrls(paths) → Record<path, url>`.

- [ ] Landing: asymmetric split hero with real photo (`/images/workforce and carpentry.jpg`), recent work strip from `/images/projects/*`, the enquiry form.
- [ ] Form: category chips, description, PhotoPicker (≤10, compressed, upload progress per photo), suburb, timeframe chips, budget range chips (optional), contact, Turnstile; submit creates enquiry with photo paths, notifies admins.
- [ ] Inbox: cards with photo strip, status filter; detail with photos lightbox, contact actions, status change, Convert to project (template select) → creates project + stages + first update with photos, redirects to project.
- [ ] Commit.

### Task 13: Projects

**Files:** `src/app/app/projects/{page,new/page,[id]/page,[id]/*Tab,[id]/QuickAdd,[id]/actions}.tsx`.

- [ ] List: cover photo, title, client, status, ProgressRing (done stages / total), members avatars; admins see all, others only membership (RLS).
- [ ] New project form (admin): title, category, client, address, dates, template, budget.
- [ ] Project page tabs (scrollable Segmented): Feed, Stages, Materials, Team, Money (admin), Settings (admin).
- [ ] QuickAdd FAB → sheet: Update (photos + text + stage + client-visible), Hours (date, hours, note; admins can pick a person), Material (name, qty, unit, est cost admin-only), Expense (admin/supervisor: amount, category, receipt photo).
- [ ] Stages: tap to cycle todo → doing → done, reorder not required; progress recalculated.
- [ ] Team: members with role, total hours; add/remove member (admin).
- [ ] Money: budget editor, spent = expenses + labour (hours × worker rate), remaining, by category, expense list with receipt thumbnails.
- [ ] Settings: status, client portal link (copy/share), `share_budget` toggle, client contact.
- [ ] Notify members on new update (push).
- [ ] Commit.

### Task 14: Client project portal

**Files:** `src/app/(site)/p/[token]/page.tsx`.

- [ ] Cover, title, progress ring + "Stage 3 of 5", stages timeline, client-visible updates feed with photos (signed URLs), budget vs spent only if `share_budget`.
- [ ] No internal notes, amounts, hours or member names beyond first names.
- [ ] Commit.

### Task 15: Demo data, verification, polish

**Files:** `scripts/seed-demo.mjs`, `README.md`.

- [ ] Demo seed: admin, supervisor, two workers; bookings in each status (one with suggestion), shifts (one partly filled), enquiry with photos (uploaded from `/public/images/projects`), project with stages, updates, expenses, materials, hours.
- [ ] `pnpm vitest run`, `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build` all pass.
- [ ] `pnpm dev`; Playwright screenshots at 390×844 and 1280×800 for: `/book/cleaning` (each step), `/b/[token]`, `/carpentry`, `/p/[token]`, `/login`, `/app` (admin + worker), `/app/cleaning/[id]`, `/app/shifts`, `/app/projects/[id]`, `/app/settings/pricing`; review each image against the taste pre-flight items that apply, fix issues.
- [ ] End-to-end click-through: book a clean → admin confirms → mark paid → worker claims → complete; enquiry → convert → post update → portal shows it.
- [ ] README: env vars, scripts, demo accounts, open items (domain/Resend, Stripe, Supabase auth email settings).
- [ ] Commit.

---

## Self-review

- Spec coverage: §2 decisions 1-14 map to Tasks 1-15 (language → T5, people → T6/T11, notifications → T6, pricing → T3/T7/T8, sign-up → T11, pay → T10/T11, client account → T9, progress → T13, money → T13, portal → T14, email → T6, PWA → T6).
- Stage budgets from the spec data model are dropped (YAGNI); project-level budget only.
- Names cross-checked: `estimate`, `loadPricing`, `nextStatus`, `notify`, `sendMail`, `emailLayout`, `createUploadTargets`, `signedUrls`, `claim_shift`, `leave_shift` are used consistently.
