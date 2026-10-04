"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, requireAdmin, type ActionResult } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const num = (min = 0, max = 100000) => z.coerce.number().min(min).max(max);

const schema = z.object({
  settings: z.object({
    client_hourly_rate: num(1, 1000),
    worker_hourly_rate: num(1, 1000),
    base_hours: num(0, 24),
    hours_per_bedroom: num(0, 24),
    hours_per_bathroom: num(0, 24),
    hours_per_50sqm: num(0, 24),
    hours_per_extra_level: num(0, 24),
    pet_hours: num(0, 24),
    max_shift_hours: num(1, 14),
    min_price: num(0, 100000),
    price_rounding: num(1, 100),
  }),
  cleanTypes: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().trim().min(1).max(60),
      description: z.string().trim().max(200),
      multiplier: num(0.1, 5),
      active: z.boolean(),
    }),
  ),
  addons: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().trim().min(1).max(60),
      kind: z.enum(["hours", "fixed"]),
      value: num(0, 10000),
      active: z.boolean(),
    }),
  ),
  presets: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().trim().min(1).max(60),
      cleanTypeId: z.string().nullable(),
      bedrooms: z.coerce.number().int().min(0).max(20),
      bathrooms: z.coerce.number().int().min(0).max(20),
      maxSqm: z.coerce.number().int().min(1).max(5000).nullable(),
      fixedPrice: num(0, 100000),
      active: z.boolean(),
    }),
  ),
  deletedAddons: z.array(z.string()),
  deletedPresets: z.array(z.string()),
});

export type PricingPayload = z.input<typeof schema>;

function slug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40) || "type"
  ) + `_${Math.random().toString(36).slice(2, 6)}`;
}

const isUuid = (v?: string) => !!v && /^[0-9a-f-]{36}$/i.test(v);

export async function savePricing(payload: PricingPayload): Promise<ActionResult> {
  await requireAdmin();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return fail("Please check the highlighted values");
  const p = parsed.data;
  const supabase = await createClient();

  const errors: string[] = [];
  const check = (r: { error: { message: string } | null }) => r.error && errors.push(r.error.message);

  check(await supabase.from("settings").update(p.settings).eq("id", 1));

  for (const [i, ct] of p.cleanTypes.entries()) {
    const row = { name: ct.name, description: ct.description, multiplier: ct.multiplier, active: ct.active, sort: i };
    check(
      isUuid(ct.id)
        ? await supabase.from("clean_types").update(row).eq("id", ct.id!)
        : await supabase.from("clean_types").insert({ ...row, key: slug(ct.name) }),
    );
  }

  for (const [i, a] of p.addons.entries()) {
    const row = { name: a.name, kind: a.kind, value: a.value, active: a.active, sort: i };
    check(isUuid(a.id) ? await supabase.from("addons").update(row).eq("id", a.id!) : await supabase.from("addons").insert(row));
  }

  for (const pr of p.presets) {
    const row = {
      name: pr.name,
      clean_type_id: pr.cleanTypeId && isUuid(pr.cleanTypeId) ? pr.cleanTypeId : null,
      bedrooms: pr.bedrooms,
      bathrooms: pr.bathrooms,
      max_sqm: pr.maxSqm,
      fixed_price: pr.fixedPrice,
      active: pr.active,
    };
    check(
      isUuid(pr.id) ? await supabase.from("price_presets").update(row).eq("id", pr.id!) : await supabase.from("price_presets").insert(row),
    );
  }

  const delAddons = p.deletedAddons.filter(isUuid);
  if (delAddons.length) check(await supabase.from("addons").delete().in("id", delAddons));
  const delPresets = p.deletedPresets.filter(isUuid);
  if (delPresets.length) check(await supabase.from("price_presets").delete().in("id", delPresets));

  revalidatePath("/app/settings/pricing");
  revalidatePath("/book/cleaning");
  return errors.length ? fail(errors[0]) : ok();
}
