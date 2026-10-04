import "server-only";
import { cookies } from "next/headers";
import { getViewer } from "@/lib/auth";
import { getDict, isLocale, LOCALE_COOKIE, translator, type Locale } from "./index";

export async function getServerLocale(): Promise<Locale> {
  const viewer = await getViewer();
  if (viewer && isLocale(viewer.profile.locale)) return viewer.profile.locale;
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(cookie) ? cookie : "en";
}

export async function getServerT() {
  const locale = await getServerLocale();
  const dict = getDict(locale);
  return { t: translator(dict), locale, dict };
}
