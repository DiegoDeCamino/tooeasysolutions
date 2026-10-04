import type { BreakdownLine, Estimate, EstimateInput, Preset } from "./types";

const MIN_CREW = 1;
const MAX_CREW = 8;
const HOUR_STEP = 0.25;

/** Round up to the next multiple of `step`, tolerant of float noise (2.0000000001 stays 2). */
export function roundUpTo(value: number, step: number): number {
  if (step <= 0) return value;
  const units = Math.ceil(value / step - 1e-9);
  return Math.round(units * step * 100) / 100;
}

/** Rough floor area for clients who don't know their m². */
export function guessSqm(bedrooms: number): number {
  return 50 + 30 * bedrooms;
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function matchPreset(presets: Preset[], cleanTypeId: string, bedrooms: number, bathrooms: number, sqm: number) {
  return (
    presets.find(
      (p) =>
        (p.cleanTypeId === null || p.cleanTypeId === cleanTypeId) &&
        p.bedrooms === bedrooms &&
        p.bathrooms === bathrooms &&
        (p.maxSqm === null || sqm <= p.maxSqm),
    ) ?? null
  );
}

export function estimate(input: EstimateInput): Estimate {
  const { settings: s, cleanType, addons, presets, home } = input;
  const sqm = home.sqm ?? guessSqm(home.bedrooms);
  const extraLevels = Math.max(0, home.levels - 1);
  const breakdown: BreakdownLine[] = [];

  const parts: [string, number][] = [
    ["Base visit", s.baseHours],
    [plural(home.bedrooms, "bedroom", "bedrooms"), home.bedrooms * s.hoursPerBedroom],
    [plural(home.bathrooms, "bathroom", "bathrooms"), home.bathrooms * s.hoursPerBathroom],
    [`About ${sqm} m²${home.sqm === null ? " (estimated)" : ""}`, Math.ceil(sqm / 50) * s.hoursPer50Sqm],
    [plural(extraLevels, "extra level", "extra levels"), extraLevels * s.hoursPerExtraLevel],
    ["Pets at home", home.pets ? s.petHours : 0],
  ];
  let homeHours = 0;
  for (const [label, hours] of parts) {
    if (hours > 0) {
      breakdown.push({ label, hours });
      homeHours += hours;
    }
  }

  let labour = homeHours * cleanType.multiplier;
  if (cleanType.multiplier !== 1) {
    breakdown.push({ label: `${cleanType.name} (x${cleanType.multiplier})`, hours: labour - homeHours });
  }

  let fixed = 0;
  for (const addon of addons) {
    if (addon.kind === "hours") {
      labour += addon.value;
      breakdown.push({ label: addon.name, hours: addon.value });
    } else {
      fixed += addon.value;
      breakdown.push({ label: addon.name, amount: addon.value });
    }
  }

  const labourHours = roundUpTo(labour, HOUR_STEP);

  const preset = matchPreset(presets, cleanType.id, home.bedrooms, home.bathrooms, sqm);
  let price: number;
  if (preset) {
    price = roundUpTo(preset.fixedPrice + fixed, s.priceRounding);
    breakdown.push({ label: `Fixed price: ${preset.name}`, amount: preset.fixedPrice });
  } else {
    price = roundUpTo(labourHours * s.clientHourlyRate + fixed, s.priceRounding);
  }
  price = Math.max(s.minPrice, price);

  let crew: number;
  if (input.crew !== undefined) crew = input.crew;
  else if (input.maxHours !== undefined && input.maxHours > 0) crew = Math.ceil(labourHours / input.maxHours - 1e-9);
  else crew = Math.ceil(labourHours / s.maxShiftHours - 1e-9);
  crew = Math.min(MAX_CREW, Math.max(MIN_CREW, Math.round(crew)));

  const hours = roundUpTo(labourHours / crew, HOUR_STEP);

  return { labourHours, price, crew, hours, breakdown, presetId: preset?.id ?? null };
}
