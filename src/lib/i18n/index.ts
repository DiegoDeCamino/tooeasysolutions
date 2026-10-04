import { en, type Dict } from "./en";
import { es } from "./es";

export type Locale = "en" | "es";
export const LOCALES: Locale[] = ["en", "es"];
export const LOCALE_COOKIE = "locale";

type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TKey = Leaves<Dict>;
export type TVars = Record<string, string | number>;
export type TFn = (key: TKey, vars?: TVars) => string;

export function getDict(locale: Locale): Dict {
  return locale === "es" ? es : en;
}

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "es";
}

export function translator(dict: Dict): TFn {
  return (key, vars) => {
    const raw = key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], dict);
    let text = typeof raw === "string" ? raw : key;
    if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
    return text;
  };
}
