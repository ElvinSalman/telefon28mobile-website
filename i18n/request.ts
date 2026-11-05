import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { locales, messages, type Locale } from "@/lib/i18n";
export default getRequestConfig(async () => {
  const selected = (await cookies()).get("active-language")?.value as Locale;
  const locale = locales.includes(selected) ? selected : "az";
  return { locale, messages: messages(locale), timeZone: "Asia/Baku" };
});
