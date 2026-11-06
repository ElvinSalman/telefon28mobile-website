import { tradeSchema } from "@/lib/validation";
import { eventDb } from "@/lib/db";
import { body, limited } from "@/lib/ingest";
export async function POST(req: Request) {
  let input;
  try {
    input = tradeSchema.parse(await body(req));
  } catch {
    return new Response(null, { status: 400 });
  }
  try {
    if (!(await limited(req, "trade", 3, 3600)))
      return new Response(null, { status: 429 });
    const r = await eventDb().rpc("shop_trade", { payload: input });
    return new Response(null, { status: r.error ? 503 : 201 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
