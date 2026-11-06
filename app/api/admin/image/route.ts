import { sameOrigin } from "@/lib/ingest";
import { adminDb } from "@/lib/db";
import sharp from "sharp";
import { z } from "zod";
export async function POST(req: Request) {
  const db = await adminDb();
  if (!db) return new Response(null, { status: 403 });
  if (!sameOrigin(req) || Number(req.headers.get("content-length")) > 4300000)
    return new Response(null, { status: 400 });
  try {
    const form = await req.formData();
    const id = z.uuid().parse(form.get("id"));
    const index = z.coerce
      .number()
      .int()
      .min(0)
      .max(7)
      .parse(form.get("index"));
    const alt = z.string().trim().min(1).max(160).parse(form.get("alt"));
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 4194304 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      return new Response(null, { status: 422 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const image = sharp(bytes, { limitInputPixels: 24000000 });
    const meta = await image.metadata();
    if (!["jpeg", "webp", "png"].includes(meta.format || ""))
      return new Response(null, { status: 422 });
    const output = await image
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
    const path = id + "/" + crypto.randomUUID() + ".webp";
    const bucket = db.storage.from("product-images");
    const upload = await bucket.upload(path, output, {
      contentType: "image/webp",
    });
    if (upload.error) return new Response(null, { status: 422 });
    const old = await db
      .from("product_images")
      .select("path")
      .eq("product_id", id)
      .eq("sort_order", index)
      .maybeSingle();
    const r = await db
      .from("product_images")
      .upsert(
        { product_id: id, path, alt, sort_order: index },
        { onConflict: "product_id,sort_order" },
      );
    if (r.error) {
      await bucket.remove([path]);
      return new Response(null, { status: 422 });
    }
    if (old.data) await bucket.remove([old.data.path]);
    return new Response(null, { status: 201 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
