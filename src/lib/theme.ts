export type Theme = "light" | "dark" | "system";
export const THEMES: Theme[] = ["light", "dark", "system"];
export const THEME_COOKIE = "theme";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

/** Browser chrome colour per theme; matches --canvas in globals.css. */
export const THEME_COLOR = { light: "#f7f7f5", dark: "#121314" } as const;
