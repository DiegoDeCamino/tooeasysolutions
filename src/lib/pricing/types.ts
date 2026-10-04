export type PricingSettings = {
  clientHourlyRate: number;
  baseHours: number;
  hoursPerBedroom: number;
  hoursPerBathroom: number;
  hoursPer50Sqm: number;
  hoursPerExtraLevel: number;
  petHours: number;
  maxShiftHours: number;
  minPrice: number;
  priceRounding: number;
};

export type CleanType = { id: string; name: string; multiplier: number };

export type Addon = { id: string; name: string; kind: "hours" | "fixed"; value: number };

export type Preset = {
  id: string;
  name: string;
  cleanTypeId: string | null;
  bedrooms: number;
  bathrooms: number;
  maxSqm: number | null;
  fixedPrice: number;
};

export type HomeInput = {
  bedrooms: number;
  bathrooms: number;
  /** null when the client is not sure; a guess from bedrooms is used instead. */
  sqm: number | null;
  levels: number;
  pets: boolean;
};

export type EstimateInput = {
  settings: PricingSettings;
  cleanType: CleanType;
  addons: Addon[];
  /** Already filtered to active presets by the caller. */
  presets: Preset[];
  home: HomeInput;
  /** Client or admin asks for a specific crew size. */
  crew?: number;
  /** Client asks to be done within this many hours. Ignored when crew is set. */
  maxHours?: number;
};

export type BreakdownLine = { label: string; hours?: number; amount?: number };

export type Estimate = {
  labourHours: number;
  price: number;
  crew: number;
  hours: number;
  breakdown: BreakdownLine[];
  presetId: string | null;
};

/** Shape stored in bookings.suggestion */
export type Suggestion = { crew?: number; maxHours?: number; reason: string };
