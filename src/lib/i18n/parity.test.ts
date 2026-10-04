import { describe, expect, it } from "vitest";
import { en } from "./en";
import { es } from "./es";
import { translator } from "./index";

function keys(o: Record<string, unknown>, p = ""): string[] {
  return Object.entries(o).flatMap(([k, v]) =>
    typeof v === "object" && v !== null ? keys(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`],
  );
}

function get(dict: Record<string, unknown>, key: string) {
  return key.split(".").reduce<unknown>((o, s) => (o as Record<string, unknown>)[s], dict);
}

describe("i18n", () => {
  it("has the same keys in English and Spanish", () => {
    expect(keys(es).sort()).toEqual(keys(en).sort());
  });

  it("has no empty strings", () => {
    for (const d of [en, es]) for (const k of keys(d)) expect(get(d, k)).not.toBe("");
  });

  it("keeps the same placeholders in both languages", () => {
    for (const k of keys(en)) {
      const vars = (s: unknown) => String(s).match(/\{\w+\}/g)?.sort() ?? [];
      expect(vars(get(es, k)), k).toEqual(vars(get(en, k)));
    }
  });

  it("interpolates variables", () => {
    const t = translator(es);
    expect(t("home.morning", { name: "Diego" })).toBe("Buenos días, Diego");
  });

  it("has no em or en dashes in copy", () => {
    for (const d of [en, es]) for (const k of keys(d)) expect(String(get(d, k)), k).not.toMatch(/[—–]/);
  });
});
