import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { locales, messages, type Locale } from "@/lib/i18n";
import { Shell } from "@/components/shell";
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = (await params).locale as Locale;
  if (!locales.includes(locale)) notFound();
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages(locale)}
      timeZone="Asia/Baku"
    >
      <Shell locale={locale}>{children}</Shell>
    </NextIntlClientProvider>
  );
}
