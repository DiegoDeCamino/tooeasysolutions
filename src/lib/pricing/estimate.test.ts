import { describe, expect, it } from "vitest";
import { estimate, guessSqm, roundUpTo } from "./estimate";
import type { PricingSettings, CleanType, Addon, Preset } from "./types";

const settings: PricingSettings = {
  clientHourlyRate: 55,
  baseHours: 1.5,
  hoursPerBedroom: 1,
  hoursPerBathroom: 0.75,
  hoursPer50Sqm: 0.5,
  hoursPerExtraLevel: 0.5,
  petHours: 0.5,
  maxShiftHours: 5,
  minPrice: 140,
  priceRounding: 5,
};
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
    expect(e.crew).toBe(2); // ceil(7.5/5)
    expect(e.hours).toBe(3.75);
    expect(e.presetId).toBeNull();
  });

  it("applies the clean type multiplier, extra levels, pets and hour add-ons", () => {
    const e = estimate({
      settings,
      cleanType: bond,
      addons: [oven],
      presets: [],
      home: { ...home, levels: 2, pets: true },
    });
    // (7.5 + 0.5 level + 0.5 pets) * 1.7 = 14.45 + 0.75 oven = 15.2 -> 15.25
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
    const e = estimate({
      settings,
      cleanType: regular,
      addons: [],
      presets: [],
      home: { bedrooms: 0, bathrooms: 0, sqm: 20, levels: 1, pets: false }, // 2h * 55 = 110
    });
    expect(e.price).toBe(140);
  });

  it("uses a guessed floor area when sqm is unknown", () => {
    const known = estimate({ settings, cleanType: regular, addons: [], presets: [], home: { ...home, sqm: 140 } });
    const unknown = estimate({ settings, cleanType: regular, addons: [], presets: [], home: { ...home, sqm: null } });
    expect(unknown.labourHours).toBe(known.labourHours);
  });

  it("lets a matching preset fix the price", () => {
    const preset: Preset = {
      id: "p1",
      name: "3x2 regular",
      cleanTypeId: "regular",
      bedrooms: 3,
      bathrooms: 2,
      maxSqm: 180,
      fixedPrice: 380,
    };
    const e = estimate({ settings, cleanType: regular, addons: [], presets: [preset], home });
    expect(e.price).toBe(380);
    expect(e.presetId).toBe("p1");
  });

  it("ignores presets for other clean types or bigger homes", () => {
    const preset: Preset = {
      id: "p1",
      name: "3x2 regular",
      cleanTypeId: "regular",
      bedrooms: 3,
      bathrooms: 2,
      maxSqm: 120,
      fixedPrice: 380,
    };
    expect(estimate({ settings, cleanType: regular, addons: [], presets: [preset], home }).presetId).toBeNull();
    expect(
      estimate({ settings, cleanType: bond, addons: [], presets: [{ ...preset, maxSqm: null }], home }).presetId,
    ).toBeNull();
  });

  it("still adds fixed add-ons on top of a preset", () => {
    const preset: Preset = {
      id: "p1",
      name: "any 3x2",
      cleanTypeId: null,
      bedrooms: 3,
      bathrooms: 2,
      maxSqm: null,
      fixedPrice: 380,
    };
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
      expect.arrayContaining(["Base visit", "3 bedrooms", "2 bathrooms", "Carpet steam"]),
    );
  });
});
