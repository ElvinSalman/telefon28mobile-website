import { NextResponse, type NextRequest } from "next/server";
import { locales, type Locale } from "./lib/i18n";
export function proxy(req: NextRequest) {
  const locale = req.nextUrl.pathname.split("/")[1];
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
  matcher: ["/", "/az/:path*", "/en/:path*", "/ru/:path*"],
};
