import { sessionDb } from "@/lib/db";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const db = await sessionDb();
  const r = code
    ? await db.auth.exchangeCodeForSession(code)
    : hash && (type === "invite" || type === "recovery")
      ? await db.auth.verifyOtp({ token_hash: hash, type })
      : null;
  return new Response(null, {
    status: 303,
    headers: {
      Location: r && !r.error ? "/admin/password" : "/admin/login?error=link",
      "Cache-Control": "no-store",
    },
  });
}
