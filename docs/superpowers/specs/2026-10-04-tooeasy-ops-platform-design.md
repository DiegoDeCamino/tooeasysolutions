# Too Easy Ops — Cleaning bookings, crew & carpentry projects

**Date:** 2026-10-04 · **Status:** approved (user: "simplemente hazlo y no pares") · **Target:** local prototype on the real Supabase project `yivsqyoxkhesaqeautsy`

## 1. Goal

Turn the Too Easy Solutions marketing site into a small operations platform:

1. **Cleaning** — public self-serve booking with an instant, rules-based estimate; client can propose changes; admin reviews, confirms, collects payment (manual now, Stripe-ready); confirmed jobs become shifts that crew claim first-come-first-served.
2. **Crew** — invite-only worker accounts with skills, a mobile-first app (installable PWA, push notifications), bilingual EN/ES.
3. **Carpentry** — a rich public enquiry ("tell us what you need" + photos) that lands in the admin inbox with no quote; admin converts it into a managed project with stages, photo feed, crew, time, expenses, materials and an optional client progress portal.

"Diego" = any admin. Multiple admins are allowed.

## 2. Decisions (from brainstorming)

| # | Topic | Decision |
|---|---|---|
| 1 | Scope | One spec, three subsystems, built in phases |
| 2 | Language | Public site English. Staff app bilingual EN/ES, per-user toggle |
| 3 | People | Single worker pool with skills (`cleaning`, `carpentry`); roles `admin`, `supervisor`, `worker`; many admins |
| 4 | Notifications | Email (Resend; console fallback) + Web Push via PWA. No SMS |
| 5 | Pricing | Labour-hours model (hours × rate) + fixed-price presets that override when they match |
| 6 | Shift sign-up | First come, first served; admin can add/remove |
| 7 | Worker pay | Global worker hourly rate, per-shift override; shift shows "≈ $X" |
| 8 | Client account | Not required: private token link `/b/[token]`. Optional account offered after booking; bookings with the same email attach to it. Stripe prepared, not wired: admin marks paid |
| 9 | Project progress | Stage templates per job type + photo/update feed |
| 10 | Project money | Budget vs actual, expenses with receipt photo, materials list, time entries. Only admins see money |
| 11 | Client project portal | `/p/[token]`: stages, % and client-visible photos only. Budget share is a per-project toggle, off by default |
| 12 | Email | Resend with a verified domain (domain still to confirm — **open item**) |
| 13 | Architecture | Single Next.js repo + Supabase (Postgres/RLS, Auth, Storage, Realtime) |
| 14 | PWA | Installable app: manifest, icons, service worker, iOS "Add to Home Screen" guide |

## 3. Architecture

```
Next.js 15 App Router (this repo)
├── Public (EN)                 /book/cleaning, /carpentry, /b/[token], /p/[token]
├── Staff app (EN/ES, PWA)      /app/*  (middleware-protected)
├── Server Actions + Route Handlers  ← all writes go through here
└── lib/
    ├── pricing/     pure estimate engine (unit-tested)
    ├── bookings/    status machine (unit-tested)
    ├── supabase/    server / browser / admin(service-role) clients
    ├── notify/      email (Resend → SMTP → console) + web-push
    ├── payments/    provider interface; Stripe stub returns null until keys exist
    └── i18n/        en/es dictionaries for /app
Supabase
├── Postgres + RLS (helper fns is_admin(), is_staff(), my_role())
├── Auth: email + password; staff accounts created server-side from an invite (email pre-confirmed)
├── Storage: private bucket `media` (enquiries/, projects/, receipts/, avatars/) served via signed URLs
└── Realtime: shift spots counter, admin inbox
```

**Trust model.** Public flows never talk to Postgres from the browser. Server code validates input (zod), applies business rules and writes with the service-role client. Signed-in staff read through the RLS-guarded session client; privileged writes (status changes, money) are server actions that re-check the role. Tokens in client links are 32-byte random URL-safe strings, unguessable, and only ever expose a curated view.

## 4. Data model

```
profiles(id=auth.uid, full_name, phone, role[admin|supervisor|worker|client], skills text[], locale[en|es], active, avatar_path)
invites(id, token, role, skills, note, created_by, expires_at, max_uses, uses)
settings(id=1, client_hourly_rate, worker_hourly_rate, base_hours, hours_per_bedroom, hours_per_bathroom,
         hours_per_50sqm, max_shift_hours, min_price, business_timezone)
clean_types(id, key, name, description, multiplier, sort, active)
addons(id, name, kind[hours|fixed], value, sort, active)
price_presets(id, name, clean_type_id?, bedrooms, bathrooms, max_sqm?, fixed_price, active)
bookings(id, token, status, client_name, client_email, client_phone, client_user_id?,
         address, service_date, start_time, flexible,
         clean_type_id, addon_ids, bedrooms, bathrooms, sqm, levels, pets, parking, access_notes, notes,
         estimate jsonb, suggestion jsonb?  -- {crew, hours, reason}
         final_price, final_crew, final_hours, admin_note, worker_brief,
         payment_status[unpaid|pending|paid], payment_url, payment_ref, paid_at, created_at, updated_at)
booking_events(id, booking_id, kind, message, actor_id?, created_at)   -- timeline
shifts(id, booking_id, starts_at, ends_at, spots, pay_rate, brief, address, status[open|full|done|cancelled])
shift_signups(shift_id, worker_id, created_at)  PK(shift_id, worker_id)
enquiries(id, name, email, phone, address, category, description, timeframe, budget_range,
          photo_paths text[], status[new|contacted|converted|archived], project_id?, created_at)
stage_templates(id, name, stages text[])
projects(id, token, title, category, description, address, client_name, client_email, client_phone,
         status[planning|active|on_hold|completed], start_date, due_date, cover_path, enquiry_id?,
         share_budget bool default false, created_at)
project_financials(project_id PK, budget)                      -- admin-only table
project_members(project_id, profile_id, role[supervisor|worker])
project_stages(id, project_id, name, position, status[todo|doing|done], budget?)
project_updates(id, project_id, stage_id?, author_id, body, photo_paths text[], client_visible, created_at)
expenses(id, project_id, stage_id?, category[materials|labour|equipment|other], amount, description,
         receipt_path?, spent_on, created_by, created_at)
materials(id, project_id, name, qty, unit, est_cost?, status[needed|bought|used], created_by)
time_entries(id, project_id, profile_id, work_date, hours, note, created_by)
notifications(id, profile_id? (null = all admins), kind, title, body, href, read_at, created_at)
push_subscriptions(id, profile_id, endpoint unique, p256dh, auth, created_at)
```

**RLS summary**

- `admin`: everything.
- `supervisor`/`worker`: own profile; open shifts + shifts they signed up for; read/insert own signups (insert only via RPC `claim_shift` that locks the row and checks spots); projects they are members of (no `project_financials`); insert updates/time entries/materials on those projects; supervisors also insert expenses and read only expenses they created.
- `client`: own profile; bookings where `client_user_id = auth.uid()`.
- `anon`: nothing (public flows run server-side).

`claim_shift(shift_id)` / `leave_shift(shift_id)` are `security definer` functions; they enforce skill = cleaning, spots and status, and flip the shift to `full`/`open`.

## 5. Pricing engine (`lib/pricing`)

Inputs: settings, clean type, addons, `{bedrooms, bathrooms, sqm, levels}`, optional `{crew}` override.

```
labour = (base + bed*hpb + bath*hpba + ceil(sqm/50)*h50 + (levels-1)*0.5) * type.multiplier + Σ hours-addons
price  = max(min_price, labour * client_rate + Σ fixed-addons)            (rounded to $5)
preset = first active preset matching type (or any) & bedrooms & bathrooms & sqm ≤ max_sqm → price = preset.fixed_price
crew   = override ?? ceil(labour / max_shift_hours)  (min 1)
hours  = round_up_to_0.25(labour / crew)
```

Returns `{labourHours, price, crew, hours, breakdown[], presetId?}`. The client's suggestion re-runs the engine with `crew` (or `hours` → crew = ceil(labour/hours)) and shows both side by side; price does not change with crew size because labour is constant — that's explained in the UI ("Same total work, finished sooner").

## 6. Cleaning booking flow

Status machine (`lib/bookings/status.ts`):

```
requested ──admin confirm──▶ awaiting_payment ──paid──▶ scheduled ──done──▶ completed
    │  ▲                          │
    │  └── admin edits/requote ───┘
    ├──admin decline──▶ declined
    └──client/admin cancel (any pre-completed)──▶ cancelled
```

1. **Public form `/book/cleaning`** — a 4-step mobile wizard with a sticky live-estimate bar: *Service* (clean type cards + add-on chips) → *Home* (steppers for bedrooms/bathrooms/levels, m² slider with "not sure" option, pets/parking/access) → *When* (date chips for the next 14 days + calendar, time windows, flexible toggle) → *Review* (estimate card, "Suggest a change" panel: crew stepper or max hours + reason; contact details; Turnstile). Submit → booking `requested`, event logged, admins notified (email + push + inbox), client gets email with `/b/[token]`.
2. **Client page `/b/[token]`** — progress tracker, details, estimate or final price, Pay button when `awaiting_payment` (Stripe url if present, else "We'll send payment details"), cancel request, and an optional "Create an account" card.
3. **Admin `/app/bookings/[id]`** — summary, client suggestion highlighted, editable final crew/hours/price (engine pre-fills), worker brief, timeline. Actions: Confirm & request payment, Decline, Mark paid (manual), Mark completed, Cancel. Mark paid → `scheduled` + creates the **shift** (date/time from booking, spots = final crew, pay = worker rate) and pushes "New shift" to cleaning-skilled workers.
4. **Payments** — `lib/payments` exposes `createCheckout(booking) → {url}|null`. With no `STRIPE_SECRET_KEY` it returns null; `/api/stripe/webhook` responds 501. Fields `payment_url/payment_ref` exist.

## 7. Crew

- **Invite** — admin creates an invite (role, skills, expiry, max uses) and shares the link (copy / native share sheet / WhatsApp). `/join/[token]`: name, phone, email, password, language, skills confirmation → account created server-side, signed in, prompted to install the app and enable notifications.
- **Shifts** — `/app/shifts`: tabs *Open* / *Mine*. Card: date, time window, suburb, crew avatars + "1 spot left", pay "≈ $128", brief. Big **Claim** button with optimistic update; Realtime keeps spots live. Full address + access notes only after claiming.
- **Admin crew** — list with role/skills filters, activate/deactivate, change role/skills.

## 8. Carpentry

- **Public `/carpentry`** — hero + "Tell us what you need": category chips (deck, pergola, kitchen, bathroom, repairs, other), description, photo drop zone (client-side resize to ≤1600px JPEG, up to 10 photos via signed upload URLs), suburb, timeframe, optional budget range, contact. Admin notified; no quote.
- **Admin inbox `/app/enquiries`** — cards with photo strip; statuses; **Convert to project** (pick stage template, prefilled title/client/photos as first update).
- **Projects `/app/projects`** — list with progress rings. Project page tabs: *Feed* (updates with photos, composer pinned bottom on mobile, client-visible toggle), *Stages* (tap to advance status), *Team* (members + hours), *Money* (admin: budget vs spent, expenses with receipts, materials), *Settings* (client portal link, share budget toggle, status).
- Supervisors/workers see only assigned projects, no Money tab; they can post updates, log hours and add materials; supervisors can log expenses (amounts they entered only).
- **Client portal `/p/[token]`** — cover, progress, stages timeline, client-visible photo feed; budget only if `share_budget`.

## 9. Notifications & PWA

- `notify(event)` fans out to: in-app `notifications` rows, web push (`web-push` + VAPID) to matching subscriptions, and email via Resend (`RESEND_API_KEY`) → existing SMTP → console log.
- Events: booking requested / suggestion included, booking confirmed (client), paid/scheduled (client + crew push), shift claimed/left (admins), enquiry received (admins), project update (members), invite accepted (admins).
- PWA: `app/manifest.ts` (name "Too Easy Crew", start_url `/app`, standalone, theme teal), maskable icons, `public/sw.js` (push + notificationclick + offline fallback page), install prompt component (Android `beforeinstallprompt`, iOS share-sheet instructions).

## 10. UX & visual direction

Applied via the `design-taste-frontend` skill. Principles: thumb-first (bottom tab bar on mobile, sidebar ≥1024px), one primary action per screen, steppers/chips over typing, optimistic updates, skeletons, empty states that teach, 44px targets, safe-area insets, no modal-heavy flows on mobile (bottom sheets), photo-first project feed. Brand continuity with the site: cream canvas, charcoal ink, teal primary, orange accent, Nunito; staff app is calmer and denser than marketing pages.

## 11. Error handling

- zod validation on every action; friendly field errors inline.
- Server actions return `{ok:false, error}` instead of throwing to the client.
- `claim_shift` race → "Someone just took the last spot".
- Upload failures retry per photo; enquiry can submit with partial photos.
- Missing integrations (Resend, Stripe, VAPID) degrade to console/no-op, never crash.

## 12. Testing

- Vitest unit tests: pricing engine, booking status machine, preset matching, i18n key parity.
- `pnpm build` + `tsc` must pass.
- Smoke run against Supabase: seed script creates admin, pricing defaults, stage templates, a worker; manual click-through of each flow in a local browser (Playwright screenshots for visual review at 390px and 1280px).

## 13. Phases

1. Foundation: deps, Supabase clients/middleware, schema + RLS + seed, auth, app shell, i18n, PWA.
2. Cleaning: pricing settings UI, booking wizard, client page, admin bookings, calendar, shifts.
3. Carpentry: enquiry form + uploads, inbox, projects (feed, stages, team, money), client portal.
4. Notifications polish, verification, screenshots.

## 14. Open items

- Production domain + Resend domain verification (needed for real client emails).
- Stripe keys when ready.
- Real copy/photos for the carpentry landing.
