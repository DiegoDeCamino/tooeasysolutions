"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n";

export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const viewer = await getViewer();
  if (viewer) {
    const supabase = await createClient();
    await supabase.from("profiles").update({ locale }).eq("id", viewer.userId);
  }
  revalidatePath("/", "layout");
}
