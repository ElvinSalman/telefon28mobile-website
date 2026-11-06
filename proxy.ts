import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { locales, type Locale } from "./lib/i18n";
export async function proxy(req: NextRequest) {
  const locale = req.nextUrl.pathname.split("/")[1];
  if (locale === "admin" || locale === "auth" || locale === "api") {
    let res = NextResponse.next({ request: req });
    const db = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll(values) {
            for (const c of values) req.cookies.set(c.name, c.value);
            res = NextResponse.next({ request: req });
            for (const c of values) res.cookies.set(c.name, c.value, c.options);
          },
        },
      },
    );
    await db.auth.getClaims();
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }
  const pref = req.cookies.get("language")?.value as Locale;
  if (!locale)
    return NextResponse.redirect(
      new URL("/" + (locales.includes(pref) ? pref : "az"), req.url),
    );
  if (locales.includes(locale as Locale)) {
    req.cookies.set("active-language", locale);
    const res = NextResponse.next({ request: { headers: req.headers } });
    res.cookies.set("language", locale, {
      path: "/",
      sameSite: "lax",
      maxAge: 31536000,
    });
    return res;
  }
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/",
    "/az/:path*",
    "/en/:path*",
    "/ru/:path*",
    "/admin/:path*",
    "/auth/:path*",
    "/api/admin/:path*",
  ],
};
