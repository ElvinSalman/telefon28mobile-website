import { origin } from "@/lib/config";
import { locales } from "@/lib/i18n";
import { loadShop } from "@/lib/catalog-data";
export const dynamic = "force-dynamic";
export default async function sitemap() {
  const { products } = await loadShop();
  return locales.flatMap((l) =>
    [
      "",
      "/catalog",
      "/about",
      "/services",
      "/contact",
      "/stores",
      "/trade-in",
      "/faq",
      ...products.map((p) => "/products/" + p.slug),
    ].map((p) => ({
      url: origin + "/" + l + p,
      alternates: {
        languages: Object.fromEntries(
          locales.map((k) => [k, origin + "/" + k + p]),
        ),
      },
    })),
  );
}
