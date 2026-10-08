import "server-only";
import { cookies } from "next/headers";
import type { Viewport } from "next";
import { isTheme, THEME_COLOR, THEME_COOKIE, type Theme } from "./theme";

/** Staff app theme from the cookie. Light unless the person picked otherwise. */
export async function getServerTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : "light";
}

export async function themeViewport(): Promise<Viewport> {
  const theme = await getServerTheme();
  return {
    viewportFit: "cover",
    themeColor:
      theme === "system"
        ? [
            { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
            { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
          ]
        : THEME_COLOR[theme],
  };
}
