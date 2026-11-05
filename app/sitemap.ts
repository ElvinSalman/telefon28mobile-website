import { origin } from "@/lib/config";
import { locales } from "@/lib/i18n";
import { products } from "@/data/products";
export default function sitemap() {
  return locales.flatMap((l) =>
    [
      "",
      "/catalog",
      "/about",
      "/services",
      "/contact",
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
