import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
export const dbUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = () => process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
export function publicDb() {
  return createClient(dbUrl(), key(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
    },
  });
}
export async function sessionDb() {
  const jar = await cookies();
  return createServerClient(dbUrl(), key(), {
    cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        try {
          for (const { name, value, options } of values)
            jar.set(name, value, options);
        } catch {
          /* Proxy refreshes cookies for Server Components. */
        }
      },
    },
  });
}
export async function adminDb() {
  const db = await sessionDb();
  const { data } = await db.auth.getClaims();
  if (!data?.claims?.sub) return null;
  const role = await db.rpc("shop_admin");
  return role.data === true && !role.error ? db : null;
}
export function eventDb() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw Error("Server ingest unavailable");
  return createClient(dbUrl(), secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
