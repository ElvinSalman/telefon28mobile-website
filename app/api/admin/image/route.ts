import { cleanImages } from "@/lib/image-cleanup";
import { adminError, validationError, databaseError } from "@/lib/admin-errors";
import { sameOrigin } from "@/lib/ingest";
import { adminDb } from "@/lib/db";
import sharp from "sharp";
import { z } from "zod";
export async function POST(req: Request) {
  const db = await adminDb();
  if (!db)
    return adminError(
      403,
      "FORBIDDEN",
      "Sessiya bitib və ya idarəçi icazəsi yoxdur.",
    );
  if (!sameOrigin(req) || Number(req.headers.get("content-length")) > 4300000)
    return adminError(
      400,
      "IMAGE_REQUEST",
      "Foto sorğusu və ya fayl ölçüsü uyğun deyil.",
    );
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
      return adminError(
        422,
        "IMAGE_INVALID",
        "JPG, PNG və ya WebP seçin. Maksimum 4 MB və 24 meqapiksel.",
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    const image = sharp(bytes, { limitInputPixels: 24000000 });
    const meta = await image.metadata();
    if (!["jpeg", "webp", "png"].includes(meta.format || ""))
      return adminError(
        422,
        "IMAGE_INVALID",
        "Foto formatı dəstəklənmir və ya fayl yüklənmədi.",
      );
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
    if (upload.error)
      return adminError(503, "STORAGE", "Foto yüklənmədi. Təkrar cəhd edin.");
    const old = await db
      .from("product_images")
      .select("path")
      .eq("product_id", id)
      .eq("sort_order", index)
      .maybeSingle();
    if (old.error) {
      await bucket.remove([path]);
      return databaseError(old.error);
    }
    const supplied = form.get("expected_path");
    const r = await db.rpc("shop_write_image", {
      product: id,
      slot: index,
      new_path: path,
      new_alt: alt,
      expected_path:
        typeof supplied === "string"
          ? supplied || null
          : old.data?.path || null,
    });
    if (r.error) {
      await db.from("image_cleanup").insert({ path });
      await cleanImages(db);
      return databaseError(r.error);
    }
    const cleanupPending = !(await cleanImages(db));
    return Response.json(
      { cleanupPending, image: { path, alt, sort_order: index } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) return validationError(error);
    return adminError(
      422,
      "IMAGE_INVALID",
      "Foto oxunmadı. Etibarlı JPG, PNG və ya WebP seçin.",
    );
  }
}
