"use client";
import { useLocale, useTranslations } from "next-intl";
import type { Locale, Key } from "@/lib/i18n";
export function useText() {
  const locale = useLocale() as Locale;
  const msg = useTranslations();
  return {
    locale,
    t: (key: Key) => msg(key),
    link: (path = "") => "/" + locale + (path ? "/" + path : ""),
  };
}
export const money = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₼";
