"use client";
import { createContext, useContext, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { ShopData } from "@/lib/catalog-data";
const Store = createContext<ShopData | null>(null);
export function useInventory() {
  const s = useContext(Store);
  if (!s) throw Error("Store missing");
  return s;
}
export function track(kind: string, item?: string) {
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, item }),
    keepalive: true,
  }).catch(() => {});
}
export function Inventory({
  data,
  children,
}: {
  data: ShopData;
  children: React.ReactNode;
}) {
  const path = usePathname();
  useEffect(() => {
    try {
      if (navigator.doNotTrack === "1") return;
      const now = Date.now();
      if (now - Number(sessionStorage.getItem("t28-last")) > 1800000)
        track("session");
      sessionStorage.setItem("t28-last", String(now));
      const slug = path.split("/products/")[1];
      if (
        slug &&
        data.products.some((p) => p.slug === slug) &&
        now - Number(sessionStorage.getItem("t28-view-" + slug)) > 60000
      ) {
        track("product_view", slug);
        sessionStorage.setItem("t28-view-" + slug, String(now));
      }
    } catch {}
  }, [path, data.products]);
  return <Store.Provider value={data}>{children}</Store.Provider>;
}
