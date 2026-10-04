Too Easy Solutions — Next.js + Tailwind CSS + Supabase

Marketing site plus an operations platform:

- **Cleaning bookings** (`/book/cleaning`): 4-step wizard with an instant, rules-based estimate. Clients can suggest a different crew size or finish time. Each booking gets a private tracking page (`/b/[token]`) and an optional client account (`/account`).
- **Crew app** (`/app`, installable PWA, English/Spanish): admins review and confirm bookings, mark them paid (Stripe is prepared but not connected), and every paid booking becomes a shift that crew claim first come, first served. Invite links (`/join/[token]`), roles (admin, supervisor, worker) and skills (cleaning, carpentry).
- **Carpentry** (`/carpentry`): enquiry form with photo uploads → admin inbox → one-tap "Convert to project". Projects have stages, a photo feed, materials, hours, expenses vs budget, and a client portal (`/p/[token]`) that only shows what you mark as visible.

Design and plan: `docs/superpowers/specs/2026-10-04-tooeasy-ops-platform-design.md`, `docs/superpowers/plans/2026-10-04-tooeasy-ops-platform.md`.

## Getting started

1. `pnpm install`
2. Copy `.env.example` to `.env.local` and fill it in (see below).
3. `pnpm dev` and open http://localhost:3000 (Next picks the next free port if 3000 is busy).

## Environment variables

| Variable | What it's for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project (`supabase projects api-keys --project-ref <ref>`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for public flows, invites and uploads. Never expose it. |
| `NEXT_PUBLIC_SITE_URL` | Base URL used in emails and share links |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web push. Generate with `npx web-push generate-vapid-keys` |
| `RESEND_API_KEY`, `MAIL_FROM` | Transactional email. Without a key emails are logged to the console. |
| `CONTACT_EMAIL` | Business inbox that receives new requests |
| `SMTP_*` | Optional legacy SMTP fallback |
| `STRIPE_SECRET_KEY` | Not wired yet; see `src/lib/payments/index.ts` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Optional Cloudflare Turnstile on public forms |
| `DEMO_PASSWORD` | Password of the demo accounts (local prototype only) |

## Database

SQL lives in `supabase/migrations` (schema, RLS, shift-claim functions, hardening) and `supabase/seed.sql` (pricing defaults, stage templates). Apply to a linked project with:

```bash
supabase link --project-ref <ref>
supabase db query --linked -f supabase/migrations/<file>.sql   # in order
supabase db query --linked -f supabase/seed.sql
pnpm db:types                                                   # regenerate src/lib/supabase/types.ts
```

## Scripts

| Command | |
|---|---|
| `pnpm test` | Unit tests (pricing engine, booking status machine, formatting, i18n parity) |
| `pnpm typecheck`, `pnpm lint`, `pnpm build` | |
| `pnpm user:create --email … --password … --name … --role admin` | Create a staff account (roles: admin, supervisor, worker) |
| `pnpm seed:demo` | **Wipes** bookings, shifts, enquiries, projects and notifications, then loads demo data. Refuses to run if non-`@example.com` accounts exist unless `--force`. |
| `node scripts/make-icons.mjs` | Regenerate PWA icons from the logo |
| `node --env-file=.env.local scripts/flow-*.mjs` | Playwright end-to-end checks (booking, admin + shift claim, carpentry, invite). Needs `pnpm dev` running on port 3001. |
| `node --env-file=.env.local scripts/shot.mjs --path /app --as admin --mobile --desktop` | Screenshots for visual review |

## Demo accounts (prototype)

All use the `DEMO_PASSWORD` from `.env.local`: `admin.demo@example.com` (admin), `tama.demo@example.com` (supervisor), `kiri.demo@example.com`, `sofia.demo@example.com`, `mateo.demo@example.com` (crew; Mateo uses Spanish).

## Before going live

- Verify a sending domain in Resend and set `MAIL_FROM` to it.
- In Supabase Auth settings: set the Site URL and redirect URLs to the production domain, and turn off public email sign-ups (accounts are created by invite or from a booking).
- Delete the demo accounts and run against a clean database.
- Connect Stripe in `src/lib/payments/index.ts` and `src/app/api/stripe/webhook/route.ts`.
