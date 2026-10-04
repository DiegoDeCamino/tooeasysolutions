"use client";

import { createContext, useContext, useMemo } from "react";
import type { Dict } from "./en";
import { translator, type Locale, type TFn } from "./index";

const I18nContext = createContext<{ t: TFn; locale: Locale } | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: React.ReactNode }) {
  const value = useMemo(() => ({ t: translator(dict), locale }), [dict, locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside <I18nProvider>");
  return ctx;
}
