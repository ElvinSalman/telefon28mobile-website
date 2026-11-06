import { z } from "zod";
import { publicDb, eventDb } from "@/lib/db";
import { body, limited } from "@/lib/ingest";
import { slug } from "@/lib/validation";
export async function POST(req: Request) {
  try {
    const { kind, item } = z
      .object({
        kind: z.enum(["session", "product_view", "whatsapp_click"]),
        item: slug.optional(),
      })
      .parse(await body(req, 512));
    if (!(await limited(req, "metrics", 90, 3600)))
      return new Response(null, { status: 429 });
    if (kind === "product_view" && !item)
      return new Response(null, { status: 400 });
    if (item) {
      const { data } = await publicDb()
        .from("products")
        .select("id")
        .eq("slug", item)
        .maybeSingle();
      if (!data) return new Response(null, { status: 404 });
    }
    const { error } = await eventDb().rpc("shop_count", {
      kind,
      item: item || "",
    });
    return new Response(null, { status: error ? 503 : 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
