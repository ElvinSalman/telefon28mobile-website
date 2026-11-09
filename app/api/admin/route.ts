import { adminDb } from "@/lib/db";
import { productInput, slug } from "@/lib/validation";
import { z } from "zod";
import { body } from "@/lib/ingest";
const word = z.string().trim().min(1).max(160);
const action = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("product"),
    id: z.uuid().optional(),
    record: productInput,
  }),
  z.object({
    op: z.literal("import"),
    rows: z
      .array(
        productInput.pick({
          slug: true,
          name: true,
          brand_id: true,
          category_id: true,
          price: true,
          storage: true,
          color: true,
          status: true,
        }),
      )
      .min(1)
      .max(200),
  }),
  z.object({ op: z.literal("archive"), slug }),
  z.object({ op: z.literal("image-delete"), product: z.uuid(), index: z.number().int().min(0).max(7) }),
  z.object({ op: z.literal("image-move"), product: z.uuid(), from: z.number().int().min(0).max(7), to: z.number().int().min(0).max(7) }),
  z.object({ op: z.literal("brand"), slug, name: word }),
  z.object({
    op: z.literal("category"),
    slug,
    az: word,
    ru: word,
    en: word,
    sort_order: z.number().int(),
    active: z.boolean(),
  }),
  z.object({
    op: z.literal("store"),
    id: z.uuid().optional(),
    name: word,
    address: word,
    phone: z.string().max(32),
    hours: z.string().max(150),
    map_url: z.union([z.string().url().startsWith("https://"), z.literal("")]),
    sort_order: z.number().int(),
    active: z.boolean(),
  }),
  z.object({
    op: z.literal("settings"),
    whatsapp: z.string().regex(/^[1-9][0-9]{7,14}$/),
  }),
  z.object({
    op: z.literal("trade"),
    id: z.uuid(),
    status: z.enum(["new", "contacted", "closed"]),
  }),
]);
export async function POST(req: Request) {
  const db = await adminDb();
  if (!db) return new Response(null, { status: 403 });
  try {
    const a = action.parse(await body(req, 250000));
    let result;
    switch (a.op) {
      case "product":
        result = a.id
          ? await db
              .from("products")
              .update(a.record)
              .eq("id", a.id)
              .eq("slug", a.record.slug)
              .select("id")
              .single()
          : await db.from("products").insert(a.record);
        break;
      case "import":
        if (
          new Set(a.rows.map((x) => x.slug)).size !== a.rows.length ||
          a.rows.some((x) => x.status === "archived")
        )
          return new Response(null, { status: 422 });
        result = await db.from("products").upsert(
          a.rows.map((r) => ({ ...r, origin: "owner_import" })),
          { onConflict: "slug", defaultToNull: false },
        );
        break;
      case "image-move":
        result = await db.rpc("shop_move_image", {product:a.product,from_slot:a.from,to_slot:a.to});
        break;
      case "image-delete": {
        const image = await db.from("product_images").select("id,path").eq("product_id",a.product).eq("sort_order",a.index).single();
        if(image.error) return new Response(null,{status:404});
        result=await db.from("product_images").delete().eq("id",image.data.id);
        if(!result.error) await db.storage.from("product-images").remove([image.data.path]);
        break;
      }
      case "archive":
        result = await db
          .from("products")
          .update({ status: "archived" })
          .eq("slug", a.slug);
        break;
      case "brand":
        result = await db
          .from("brands")
          .upsert({ slug: a.slug, name: a.name }, { onConflict: "slug" });
        break;
      case "category": {
        const { op, ...row } = a;
        void op;
        result = await db.from("categories").upsert(row);
        break;
      }
      case "store": {
        const { op, ...row } = a;
        void op;
        result = await db
          .from("store_locations")
          .upsert({ ...row, map_url: row.map_url || null });
        break;
      }
      case "settings":
        result = await db
          .from("site_settings")
          .update({ whatsapp: a.whatsapp })
          .eq("id", 1);
        break;
      case "trade":
        result = await db
          .from("trade_in_requests")
          .update({ status: a.status })
          .eq("id", a.id);
        break;
    }
    return new Response(null, { status: result.error ? 422 : 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
