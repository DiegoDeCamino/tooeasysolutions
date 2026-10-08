// Reset operational data and load a realistic demo (keeps users, pricing and templates).
// pnpm seed:demo            -> wipe bookings/shifts/enquiries/projects/notifications + seed
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { estimate } from "../src/lib/pricing/estimate.ts";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const must = <T>(r: { data: T; error: { message: string } | null }, what: string) => {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data;
};

// --- dates (Perth) -------------------------------------------------------------------
const perthToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Perth" }).format(new Date());
const day = (offset: number) => {
  const d = new Date(`${perthToday}T12:00:00+08:00`);
  d.setUTCDate(d.getUTCDate() + offset);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Perth" }).format(d);
};
const at = (date: string, time: string) => new Date(`${date}T${time}:00+08:00`);
const ago = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();

// --- wipe ------------------------------------------------------------------------------
async function emptyFolder(prefix: string) {
  const storage = db.storage.from("media");
  const { data: dirs } = await storage.list(prefix, { limit: 1000 });
  for (const d of dirs ?? []) {
    const path = `${prefix}/${d.name}`;
    const { data: files } = await storage.list(path, { limit: 1000 });
    if (files?.length) await storage.remove(files.map((f) => `${path}/${f.name}`));
  }
}
// Safety: this wipes operational data, so refuse on a project with real accounts.
{
  const { data: real } = await db.from("profiles").select("email").not("email", "ilike", "%@example.com");
  if ((real ?? []).length && !process.argv.includes("--force")) {
    console.error(`Refusing to wipe: found ${real!.length} non-demo account(s). Re-run with --force if you really mean it.`);
    process.exit(1);
  }
}
console.log("wiping operational data…");
// Children cascade from these (shifts -> signups/details, projects -> stages/updates/members/money).
for (const table of ["bookings", "shifts", "projects", "enquiries", "notifications", "invites"] as const) {
  must(await db.from(table).delete().not("id", "is", null), `wipe ${table}`);
}
for (const prefix of ["enquiries", "projects", "receipts"]) await emptyFolder(prefix);

// --- lookups -----------------------------------------------------------------------------
const profiles = must(await db.from("profiles").select("id, email, full_name, role"), "profiles")!;
const who = (email: string) => profiles.find((p) => p.email === email)!.id;
const admin = who("admin.demo@example.com");
const tama = who("tama.demo@example.com");
const kiri = who("kiri.demo@example.com");
const mateo = who("mateo.demo@example.com");
const sofia = who("sofia.demo@example.com");

const s = must(await db.from("settings").select("*").eq("id", 1).single(), "settings")!;
const settings = {
  clientHourlyRate: +s.client_hourly_rate, baseHours: +s.base_hours, hoursPerBedroom: +s.hours_per_bedroom,
  hoursPerBathroom: +s.hours_per_bathroom, hoursPer50Sqm: +s.hours_per_50sqm, hoursPerExtraLevel: +s.hours_per_extra_level,
  petHours: +s.pet_hours, maxShiftHours: +s.max_shift_hours, minPrice: +s.min_price, priceRounding: +s.price_rounding,
};
const types = must(await db.from("clean_types").select("*"), "types")!;
const addons = must(await db.from("addons").select("*"), "addons")!;
const presets = must(await db.from("price_presets").select("*").eq("active", true), "presets")!;
const type = (key: string) => types.find((t) => t.key === key)!;
const addon = (name: string) => addons.find((a) => a.name === name)!;
const templates = must(await db.from("stage_templates").select("*"), "templates")!;

async function upload(scope: string, scopeId: string, file: string) {
  const path = `${scope}/${scopeId}/${randomUUID()}.jpg`;
  const body = await readFile(`public/images/${file}`);
  must(await db.storage.from("media").upload(path, body, { contentType: "image/jpeg" }), `upload ${file}`);
  return path;
}

// --- bookings ------------------------------------------------------------------------------
type B = {
  name: string; email: string; phone: string; address: string; suburb: string; date: string; time: string; type: string;
  addons?: string[]; bedrooms: number; bathrooms: number; sqm: number | null; levels?: number; pets?: boolean; parking?: string;
  access?: string; notes?: string; status: "requested" | "awaiting_payment" | "scheduled" | "completed"; suggestion?: { crew: number; reason: string };
  brief?: string; crew?: string[]; createdHoursAgo: number;
};
const bookings: B[] = [
  { name: "Ava Thompson", email: "ava.demo@example.com", phone: "0412 556 781", address: "14 Seymour Boulevard", suburb: "Dunsborough", date: day(3), time: "09:00", type: "end_of_lease", addons: ["Inside oven", "Interior windows"], bedrooms: 3, bathrooms: 2, sqm: 160, pets: true, parking: "Driveway", status: "requested", suggestion: { crew: 3, reason: "We hand the keys back to the agent at 1pm" }, createdHoursAgo: 2 },
  { name: "Noah Bennett", email: "noah.demo@example.com", phone: "0438 902 115", address: "7 Bussell Highway", suburb: "Margaret River", date: day(5), time: "10:00", type: "regular", bedrooms: 2, bathrooms: 1, sqm: 95, parking: "Street parking", status: "requested", createdHoursAgo: 5 },
  { name: "Chloe Nguyen", email: "chloe.demo@example.com", phone: "0401 337 264", address: "22 Queen Street", suburb: "Busselton", date: day(4), time: "08:00", type: "deep", addons: ["Inside fridge"], bedrooms: 4, bathrooms: 2, sqm: 210, levels: 2, parking: "Driveway", status: "awaiting_payment", createdHoursAgo: 26 },
  { name: "Oliver Smith", email: "oliver.demo@example.com", phone: "0417 448 092", address: "3 Marine Terrace", suburb: "Busselton", date: day(2), time: "09:00", type: "regular", bedrooms: 3, bathrooms: 2, sqm: 150, access: "Key in the lockbox by the side gate, code 4471", parking: "Driveway", status: "scheduled", brief: "Regular clean. Bring the extendable duster for the high windows in the lounge.", crew: [kiri], createdHoursAgo: 50 },
  { name: "Mia Robinson", email: "mia.demo@example.com", phone: "0422 610 553", address: "41 Bottlebrush Drive", suburb: "Cowaramup", date: day(6), time: "11:00", type: "airbnb", addons: ["Laundry and linen"], bedrooms: 2, bathrooms: 2, sqm: 120, status: "scheduled", brief: "Holiday rental turnover. Fresh linen is in the hallway cupboard. Guests arrive at 3pm.", crew: [sofia], createdHoursAgo: 70 },
  { name: "Ethan Clarke", email: "ethan.demo@example.com", phone: "0409 771 380", address: "9 Gifford Road", suburb: "Dunsborough", date: day(-4), time: "09:00", type: "deep", bedrooms: 3, bathrooms: 2, sqm: 170, status: "completed", crew: [kiri, sofia], createdHoursAgo: 200 },
];

for (const b of bookings) {
  const ct = type(b.type);
  const ads = (b.addons ?? []).map(addon);
  const base = {
    settings,
    cleanType: { id: ct.id, name: ct.name, multiplier: +ct.multiplier },
    addons: ads.map((a) => ({ id: a.id, name: a.name, kind: a.kind, value: +a.value })),
    presets: presets.map((p) => ({ id: p.id, name: p.name, cleanTypeId: p.clean_type_id, bedrooms: p.bedrooms, bathrooms: p.bathrooms, maxSqm: p.max_sqm, fixedPrice: +p.fixed_price })),
    home: { bedrooms: b.bedrooms, bathrooms: b.bathrooms, sqm: b.sqm, levels: b.levels ?? 1, pets: b.pets ?? false },
  };
  const est = estimate(base);
  const sug = b.suggestion ? estimate({ ...base, crew: b.suggestion.crew }) : null;
  const crewSize = b.crew ? Math.max(b.crew.length, est.crew) : est.crew;
  const plan = b.status === "requested" ? est : estimate({ ...base, crew: crewSize });
  const created = ago(b.createdHoursAgo);
  const booking = must(
    await db.from("bookings").insert({
      status: b.status, client_name: b.name, client_email: b.email, client_phone: b.phone, address: b.address, suburb: b.suburb,
      service_date: b.date, start_time: b.time, clean_type_id: ct.id, addon_ids: ads.map((a) => a.id), bedrooms: b.bedrooms,
      bathrooms: b.bathrooms, sqm: b.sqm, levels: b.levels ?? 1, pets: b.pets ?? false, parking: b.parking ?? null,
      access_notes: b.access ?? null, notes: b.notes ?? null, estimate: est,
      suggestion: b.suggestion && sug ? { ...b.suggestion, hours: sug.hours } : null,
      final_price: est.price, final_crew: sug?.crew ?? plan.crew, final_hours: sug?.hours ?? plan.hours, worker_brief: b.brief ?? null,
      payment_status: b.status === "scheduled" || b.status === "completed" ? "paid" : b.status === "awaiting_payment" ? "pending" : "unpaid",
      paid_at: b.status === "scheduled" || b.status === "completed" ? ago(b.createdHoursAgo - 20) : null, created_at: created,
    }).select("id").single(),
    `booking ${b.name}`,
  )!;
  const events: { kind: string; message: string | null; at: string }[] = [{ kind: "requested", message: b.suggestion ? `Client suggested: ${b.suggestion.reason}` : null, at: created }];
  if (b.status !== "requested") events.push({ kind: "awaiting_payment", message: `Confirmed at $${est.price}`, at: ago(b.createdHoursAgo - 3) });
  if (b.status === "scheduled" || b.status === "completed") events.push({ kind: "scheduled", message: "Paid. Shift published to the crew", at: ago(b.createdHoursAgo - 20) });
  if (b.status === "completed") events.push({ kind: "completed", message: "Marked as completed", at: ago(60) });
  must(await db.from("booking_events").insert(events.map((e) => ({ booking_id: booking.id, kind: e.kind, message: e.message, created_at: e.at, actor_id: e.kind === "requested" ? null : admin }))), "events");

  if (b.status === "scheduled" || b.status === "completed") {
    const start = at(b.date, b.time);
    const spots = plan.crew;
    const shift = must(
      await db.from("shifts").insert({
        booking_id: booking.id, title: ct.name, suburb: b.suburb, starts_at: start.toISOString(),
        ends_at: new Date(start.getTime() + plan.hours * 3600_000).toISOString(), spots, pay_rate: +s.worker_hourly_rate,
        brief: b.brief ?? null, status: b.status === "completed" ? "done" : (b.crew?.length ?? 0) >= spots ? "full" : "open",
      }).select("id").single(),
      "shift",
    )!;
    const access = [b.parking && `Parking: ${b.parking}`, b.access, b.pets && "Pets at home"].filter(Boolean).join("\n");
    must(await db.from("shift_details").insert({ shift_id: shift.id, address: `${b.address}, ${b.suburb}`, access_notes: access || null }), "details");
    if (b.crew?.length) must(await db.from("shift_signups").insert(b.crew.map((w) => ({ shift_id: shift.id, worker_id: w }))), "signups");
  }
}
console.log(`bookings: ${bookings.length}`);

// --- enquiries -------------------------------------------------------------------------------
const enquiries = [
  { name: "Grace Walker", email: "grace.demo@example.com", phone: "0433 205 917", suburb: "Busselton", category: "kitchen", timeframe: "In 1 to 3 months", budget: "$15k to $40k", hours: 3,
    description: "Our kitchen is from the 90s. We'd like new cabinetry and benchtops, keep the same layout but add an island bench if it fits. Open to suggestions on timber finishes.", photos: ["projects/kitchen renovation.jpg"] },
  { name: "Jack Morris", email: "jack.demo@example.com", phone: "0419 664 230", suburb: "Dunsborough", category: "pergola", timeframe: "As soon as possible", budget: "$5k to $15k", hours: 20,
    description: "Looking for a pergola off the back deck, about 5 by 4 metres, with a privacy screen on the neighbour's side. Something like the photo.", photos: ["projects/pergola and privacy screen.jpg"] },
];
for (const e of enquiries) {
  const id = randomUUID();
  const paths = [];
  for (const p of e.photos) paths.push(await upload("enquiries", id, p));
  must(await db.from("enquiries").insert({ id, name: e.name, email: e.email, phone: e.phone, suburb: e.suburb, category: e.category, description: e.description, timeframe: e.timeframe, budget_range: e.budget, photo_paths: paths, created_at: ago(e.hours) }), "enquiry");
}
console.log(`enquiries: ${enquiries.length}`);

// --- projects ---------------------------------------------------------------------------------
async function project(p: {
  title: string; category: string; template: string; status: "planning" | "active" | "completed"; client: [string, string, string]; address: string;
  start: number; due: number; budget: number; doneStages: number; doingStage: boolean; members: [string, "supervisor" | "worker"][];
  updates: { by: string; body: string; photos: string[]; stage: number | null; visible: boolean; hoursAgo: number }[];
  materials: [string, number, string, number | null, "needed" | "bought" | "used"][]; expenses: [number, "materials" | "equipment" | "other", string, number, string | null][];
  hours: [string, number, number, string][];
}) {
  const proj = must(
    await db.from("projects").insert({
      title: p.title, category: p.category, status: p.status, address: p.address, client_name: p.client[0], client_email: p.client[1], client_phone: p.client[2],
      start_date: day(p.start), due_date: day(p.due),
    }).select("id").single(),
    "project",
  )!;
  must(await db.from("project_financials").insert({ project_id: proj.id, budget: p.budget }), "fin");
  const stages = templates.find((t) => t.name === p.template)!.stages;
  const stageRows = must(
    await db.from("project_stages").insert(stages.map((name, i) => ({ project_id: proj.id, name, position: i, status: i < p.doneStages ? "done" : i === p.doneStages && p.doingStage ? "doing" : "todo" }))).select("id, position"),
    "stages",
  )!;
  const stageId = (i: number | null) => (i === null ? null : stageRows.find((r) => r.position === i)!.id);
  must(await db.from("project_members").insert(p.members.map(([id, role]) => ({ project_id: proj.id, profile_id: id, role }))), "members");
  for (const u of p.updates) {
    const paths = [];
    for (const ph of u.photos) paths.push(await upload("projects", proj.id, ph));
    must(await db.from("project_updates").insert({ project_id: proj.id, author_id: u.by, body: u.body, photo_paths: paths, stage_id: stageId(u.stage), client_visible: u.visible, created_at: ago(u.hoursAgo) }), "update");
  }
  if (p.materials.length) must(await db.from("materials").insert(p.materials.map(([name, qty, unit, cost, status]) => ({ project_id: proj.id, name, qty, unit, est_cost: cost, status, created_by: tama }))), "materials");
  for (const [amount, category, description, dayOffset, receipt] of p.expenses) {
    const receipt_path = receipt ? await upload("receipts", proj.id, receipt) : null;
    must(await db.from("expenses").insert({ project_id: proj.id, amount, category, description, spent_on: day(dayOffset), receipt_path, created_by: tama }), "expense");
  }
  if (p.hours.length) must(await db.from("time_entries").insert(p.hours.map(([pid, dayOffset, hrs, note]) => ({ project_id: proj.id, profile_id: pid, work_date: day(dayOffset), hours: hrs, note, created_by: pid }))), "hours");
  return proj.id;
}

await project({
  title: "Merbau deck, Yallingup", category: "deck", template: "Deck", status: "active",
  client: ["Liam Carter", "liam.demo@example.com", "0423 118 904"], address: "18 Elmore Road, Yallingup",
  start: -9, due: 12, budget: 18500, doneStages: 2, doingStage: true,
  members: [[tama, "supervisor"], [mateo, "worker"]],
  updates: [
    { by: tama, body: "Bearers are down and level. Joists go on tomorrow, then we can start boards early next week.", photos: ["projects/deck for resort.jpg"], stage: 2, visible: true, hoursAgo: 6 },
    { by: mateo, body: "Footings poured and posts set. Concrete curing over the weekend.", photos: ["workforce and carpentry.jpg"], stage: 1, visible: true, hoursAgo: 70 },
    { by: tama, body: "Note for the team: neighbour asked us to keep the side gate shut for their dog.", photos: [], stage: null, visible: false, hoursAgo: 96 },
    { by: tama, body: "Site cleared and set out. String lines up, matches the plan.", photos: ["projects/pergola and privacy screen.jpg"], stage: 0, visible: true, hoursAgo: 190 },
  ],
  materials: [["Merbau decking 90x19", 120, "m", 2280, "needed"], ["Treated pine joists 140x45", 24, "pcs", 610, "bought"], ["Stainless deck screws", 4, "box", 260, "bought"], ["Concrete bags 20kg", 18, "bag", 198, "used"]],
  expenses: [[1840.5, "materials", "Timber yard, joists and bearers", -6, "projects/deck for resort.jpg"], [214, "materials", "Concrete and post stirrups", -8, null], [385, "equipment", "Post hole auger hire", -8, null]],
  hours: [[tama, -8, 8, "Set out and footings"], [mateo, -8, 8, "Footings"], [tama, -5, 7.5, "Posts and bearers"], [mateo, -5, 7.5, "Bearers"], [mateo, -1, 6, "Joists"]],
});
await project({
  title: "Vanity renovation, Busselton", category: "bathroom", template: "Bathroom", status: "completed",
  client: ["Harper Lee", "harper.demo@example.com", "0402 551 873"], address: "5 Brown Street, Busselton",
  start: -30, due: -14, budget: 6200, doneStages: 5, doingStage: false, members: [[tama, "supervisor"]],
  updates: [{ by: tama, body: "All done. New vanity in, sealed and cleaned up. Client is happy.", photos: ["projects/vanity renovation.jpg"], stage: 4, visible: true, hoursAgo: 340 }],
  materials: [], expenses: [[2950, "materials", "Vanity unit and tapware", -25, null]], hours: [[tama, -20, 8, "Install"]],
});
await project({
  title: "Kitchen refresh, Vasse", category: "kitchen", template: "Kitchen", status: "planning",
  client: ["Sam Patel", "sam.demo@example.com", "0430 286 419"], address: "12 Napier Way, Vasse",
  start: 10, due: 40, budget: 26000, doneStages: 0, doingStage: false, members: [[tama, "supervisor"], [mateo, "worker"]],
  updates: [], materials: [], expenses: [], hours: [],
});
console.log("projects: 3");

// --- a few inbox items so the bell isn't empty -----------------------------------------------------
must(await db.from("notifications").insert([
  { profile_id: admin, kind: "booking_requested", title: "New cleaning request in Dunsborough", body: "End of lease. Change suggested", href: "/app/cleaning?tab=new", created_at: ago(2) },
  { profile_id: admin, kind: "enquiry_new", title: "New kitchen enquiry from Grace Walker", body: "Busselton. 1 photo", href: "/app/projects/enquiries", created_at: ago(3) },
  { profile_id: admin, kind: "project_update", title: "Tama Rewi posted on Merbau deck, Yallingup", body: "Bearers are down and level.", href: "/app/projects", created_at: ago(6), read_at: ago(5) },
  { profile_id: kiri, kind: "shift_new", title: "New shift in Cowaramup", body: "Holiday rental turnover, 1 spot left", href: "/app/shifts", created_at: ago(10) },
]), "notifications");
console.log("done ✓");
