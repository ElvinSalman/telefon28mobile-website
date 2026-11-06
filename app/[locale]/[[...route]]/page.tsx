import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Home } from "@/components/home";
import { Catalog } from "@/components/catalog";
import { Detail } from "@/components/products";
import { Shopping, Info } from "@/components/pages";
import { loadShop } from "@/lib/catalog-data";
import { Stores, Trade } from "@/components/owner-public";
import { redirect } from "next/navigation";
import { translate, locales, type Locale, type Key } from "@/lib/i18n";
import { origin } from "@/lib/config";
type Params = Promise<{ locale: Locale; route?: string[] }>;
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, route = [] } = await params;
  if (!locales.includes(locale)) return {};
  const { products } = await loadShop();
  const p =
    route[0] === "products" ? products.find((x) => x.slug === route[1]) : null;
  const title =
    (p
      ? p.name + " " + p.storage + " " + p.color
      : translate(locale, (route[0] || "home") as Key) || "404") +
    " | Telefon 28 Mobile";
  const path = route.length ? "/" + route.join("/") : "";
  const url = origin + "/" + locale + path;
  const description = p
    ? p.name + " · " + p.price + " AZN. " + translate(locale, "priceNote")
    : translate(locale, "serviceText");
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        locales.map((l) => [l, origin + "/" + l + path]),
      ),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Telefon 28 Mobile",
      locale,
    },
  };
}
export default async function Page({ params }: { params: Params }) {
  const { route = [], locale } = await params;
  const [page, slug] = route;
  const { products, locations, whatsapp } = await loadShop();
  if (
    route.length === 1 &&
    ["account", "login", "register", "reset", "profile", "addresses"].includes(
      page,
    )
  )
    redirect("/" + locale + "/catalog");
  if (!page)
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Telefon28Mobile",
              telephone: "+" + whatsapp,
              location: locations.map((x) => ({
                "@type": "Store",
                name: "Telefon28Mobile · " + x.name,
                address: {
                  "@type": "PostalAddress",
                  streetAddress: x.address,
                  addressCountry: "AZ",
                },
              })),
            }).replace(/</g, "\\u003c"),
          }}
        />
        <Home />
      </>
    );
  if (route.length === 1 && page === "admin") redirect("/admin");
  if (route.length === 1 && ["stores", "contact"].includes(page))
    return <Stores />;
  if (route.length === 1 && page === "trade-in") return <Trade />;
  if (page === "products" && route.length === 2) {
    const p = products.find((x) => x.slug === slug);
    if (!p) notFound();
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: p.name,
              brand: { "@type": "Brand", name: p.brand },
              color: p.color || undefined,
              sku: p.slug,
              url: origin + "/" + locale + "/products/" + p.slug,
              offers: {
                "@type": "Offer",
                price: p.price,
                priceCurrency: "AZN",
              },
              description: translate(locale, "priceNote"),
            }).replace(/</g, "\\u003c"),
          }}
        />
        <Detail p={p} />
      </>
    );
  }
  if (route.length !== 1) notFound();
  if (page === "catalog")
    return (
      <Suspense fallback={<div aria-busy className="wrap inner skeleton" />}>
        <Catalog />
      </Suspense>
    );
  if (page === "cart" || page === "wishlist" || page === "checkout")
    return <Shopping page={page} />;
  if (
    [
      "services",
      "about",
      "contact",
      "promo",
      "faq",
      "privacy",
      "terms",
      "admin",
      "account",
      "login",
      "register",
      "reset",
      "profile",
      "addresses",
    ].includes(page)
  )
    return <Info page={page} />;
  notFound();
}
