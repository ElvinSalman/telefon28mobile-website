import { readPages } from "./read-pages";
import { cache } from "react";
import { publicDb, dbUrl } from "./db";
import { branches } from "./business";
import type { Product } from "@/data/products";
export const loadShop = cache(async () => {
  const fallback = {
    products: [] as Product[],
    locations: branches,
    categories: [] as { slug: string; az: string; en: string; ru: string }[],
    whatsapp: "994556002001",
    offline: true,
  };
  try {
    const db = publicDb();
    const [items, cats, places, settings] = await Promise.all([
      readPages((from, to) =>
        db
          .from("products")
          .select("*,brands(name),product_images(path,alt,sort_order)")
          .eq("status", "published")
          .order("updated_at", { ascending: false })
          .order("id")
          .range(from, to),
      ),
      db
        .from("categories")
        .select("slug,az,ru,en")
        .eq("active", true)
        .order("sort_order"),
      db
        .from("store_locations")
        .select("name,address,phone,hours,map_url")
        .order("sort_order"),
      db.from("site_settings").select("whatsapp").eq("id", 1).single(),
    ]);
    if (items.error || cats.error || places.error || settings.error)
      return fallback;
    return {
      products: items.data.map((r): Product => ({
        slug: r.slug,
        name: r.name,
        category: r.category_id,
        brand: r.brands?.name || "",
        price: Number(r.price),
        storage: r.storage,
        color: r.color,
        condition: r.condition,
        description: r.description,
        specifications: r.specifications,
        images: (
          r.product_images as {
            path: string;
            alt: string;
            sort_order: number;
          }[]
        )
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((i) => ({
            url: dbUrl() + "/storage/v1/object/public/product-images/" + i.path,
            alt: i.alt,
          })),

        verifiedAt: r.updated_at,
      })),
      locations: places.data as typeof branches,
      categories: cats.data,
      whatsapp: settings.data.whatsapp as string,
      offline: false,
    };
  } catch {
    return fallback;
  }
});
export type ShopData = Awaited<ReturnType<typeof loadShop>>;
