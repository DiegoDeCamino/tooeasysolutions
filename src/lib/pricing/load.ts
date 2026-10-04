import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";
import type { Addon, CleanType, PricingSettings, Preset } from "./types";

export type CleanTypeRow = Tables<"clean_types">;
export type AddonRow = Tables<"addons">;
export type PresetRow = Tables<"price_presets">;
export type SettingsRow = Tables<"settings">;

export type PricingData = {
  settings: PricingSettings;
  workerRate: number;
  cleanTypes: (CleanType & { key: string; description: string; active: boolean; sort: number })[];
  addons: (Addon & { active: boolean; sort: number })[];
  presets: (Preset & { active: boolean })[];
};

export function toSettings(s: SettingsRow): PricingSettings {
  return {
    clientHourlyRate: Number(s.client_hourly_rate),
    baseHours: Number(s.base_hours),
    hoursPerBedroom: Number(s.hours_per_bedroom),
    hoursPerBathroom: Number(s.hours_per_bathroom),
    hoursPer50Sqm: Number(s.hours_per_50sqm),
    hoursPerExtraLevel: Number(s.hours_per_extra_level),
    petHours: Number(s.pet_hours),
    maxShiftHours: Number(s.max_shift_hours),
    minPrice: Number(s.min_price),
    priceRounding: Number(s.price_rounding),
  };
}

/** Load every pricing table and map rows to engine types. Pass an admin client for public flows. */
export async function loadPricing(client: SupabaseClient<Database>, opts: { activeOnly?: boolean } = {}): Promise<PricingData> {
  const [s, ct, ad, pr] = await Promise.all([
    client.from("settings").select("*").eq("id", 1).single(),
    client.from("clean_types").select("*").order("sort"),
    client.from("addons").select("*").order("sort"),
    client.from("price_presets").select("*").order("created_at"),
  ]);
  if (s.error || !s.data) throw new Error(`Pricing settings missing: ${s.error?.message}`);

  const keep = <T extends { active: boolean }>(rows: T[]) => (opts.activeOnly ? rows.filter((r) => r.active) : rows);

  return {
    settings: toSettings(s.data),
    workerRate: Number(s.data.worker_hourly_rate),
    cleanTypes: keep(ct.data ?? []).map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      description: r.description,
      multiplier: Number(r.multiplier),
      active: r.active,
      sort: r.sort,
    })),
    addons: keep(ad.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      kind: r.kind,
      value: Number(r.value),
      active: r.active,
      sort: r.sort,
    })),
    presets: keep(pr.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      cleanTypeId: r.clean_type_id,
      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms,
      maxSqm: r.max_sqm,
      fixedPrice: Number(r.fixed_price),
      active: r.active,
    })),
  };
}
