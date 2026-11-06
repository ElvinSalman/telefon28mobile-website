import "server-only";
import { createHmac } from "node:crypto";
import { eventDb } from "./db";
export async function limited(
  req: Request,
  kind: string,
  max: number,
  seconds: number,
) {
  const db = eventDb();
  const address = process.env.VERCEL
    ? req.headers.get("x-vercel-forwarded-for")?.split(",")[0] || "unknown"
    : "local";
  const digest = createHmac("sha256", process.env.SUPABASE_SECRET_KEY!)
    .update(kind + ":" + address + ":" + new Date().toISOString().slice(0, 10))
    .digest("hex");
  const r = await db.rpc("shop_limit", {
    key_hash: digest,
    maximum: max,
    seconds,
  });
  if (r.error) throw Error("Unavailable");
  return r.data === true;
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return (
      new URL(origin).host === req.headers.get("host") &&
      ["http:", "https:"].includes(new URL(origin).protocol)
    );
  } catch {
    return false;
  }
}
export async function body(req: Request, max = 24000) {
  if (!sameOrigin(req)) throw Error("Origin");
  if (Number(req.headers.get("content-length")) > max) throw Error("Size");
  const raw = await req.text();
  if (raw.length > max) throw Error("Size");
  return JSON.parse(raw);
}
