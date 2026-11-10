"use client";
import { useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useInventory } from "./inventory";
import { useText } from "./hooks";
import { Card } from "./products";
import { Modal } from "./modal";
export function Catalog() {
  const { t, locale } = useText();
  const { products, categories, offline } = useInventory();
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const get = (k: string) => params.get(k) || "";
  function update(k: string, v: string) {
    const p = new URLSearchParams(window.location.search);
    if (k !== "page") p.delete("page");
    if (v) p.set(k, v);
    else p.delete(k);
    window.history.replaceState(null, "", path + (p.size ? "?" + p : ""));
  }
  const result = products.filter(
    (p) =>
      [p.name, p.color, p.storage]
        .join(" ")
        .toLowerCase()
        .includes(get("q").toLowerCase()) &&
      (["category", "brand", "color", "storage"] as const).every(
        (k) => !get(k) || p[k] === get(k),
      ) &&
      p.price >= Number(get("min") || 0) &&
      p.price <= Number(get("max") || Infinity),
  );
  if (get("sort"))
    result.sort((a, b) =>
      get("sort") === "high" ? b.price - a.price : a.price - b.price,
    );
  const pages = Math.ceil(result.length / 12);
  const page = Math.max(1, Math.min(Number(get("page")) || 1, pages));
  const filters = (
    <div className="filterFields">
      {(["category", "brand", "storage", "color"] as const).map((k) => (
        <label key={k}>
          {t(k === "category" ? "categories" : k)}
          <span className="catalogSelect">
            <select value={get(k)} onChange={(e) => update(k, e.target.value)}>
              <option value="">{t("all")}</option>
              {[...new Set(products.map((p) => p[k]).filter(Boolean))]
                .sort()
                .map((v) => (
                  <option value={v} key={v}>
                    {k === "category"
                      ? categories.find((c) => c.slug === v)?.[locale] || v
                      : v}
                  </option>
                ))}
            </select>
            <ChevronDown aria-hidden="true" />
          </span>
        </label>
      ))}
      <div className="pair">
        {(["min", "max"] as const).map((k) => (
          <label key={k}>
            {t(k)}
            <input
              type="number"
              min="0"
              value={get(k)}
              onChange={(e) => update(k, e.target.value)}
            />
          </label>
        ))}
      </div>
      <button
        className="textlink"
        onClick={() => router.replace(path, { scroll: false })}
      >
        {t("clear")}
      </button>
    </div>
  );
  return (
    <div className="wrap inner">
      <h1>{t("catalog")}</h1>
      <div className="catalogBar">
        <label className="searchInput">
          <Search size={18} />
          <input
            aria-label={t("search")}
            value={get("q")}
            placeholder={t("search")}
            onChange={(e) => update("q", e.target.value)}
          />
        </label>
        <select
          aria-label={t("sort")}
          value={get("sort")}
          onChange={(e) => update("sort", e.target.value)}
        >
          <option value="">{t("sort")}</option>
          <option value="low">{t("low")}</option>
          <option value="high">{t("high")}</option>
        </select>
        <button
          className="icon filterToggle"
          onClick={() => setOpen(true)}
          aria-label={t("filter")}
        >
          <SlidersHorizontal />
        </button>
      </div>
      <div className="catalogLayout">
        <aside>
          <h3>{t("filter")}</h3>
          {filters}
        </aside>
        <section>
          <small>
            {result.length} {t("results")}
          </small>
          <div className="grid catalogGrid">
            {result.slice((page - 1) * 12, page * 12).map((p) => (
              <Card key={p.slug} p={p} />
            ))}
          </div>
          {!result.length && <p>{t(offline ? "catalogOffline" : "empty")}</p>}
          <div className="chips">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                aria-current={page === i + 1}
                onClick={() => {
                  update("page", String(i + 1));
                  window.scrollTo({ top: 0 });
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </section>
      </div>
      <Modal open={open} close={() => setOpen(false)} title={t("filter")}>
        {filters}
        <button className="button primary" onClick={() => setOpen(false)}>
          {result.length} {t("results")}
        </button>
      </Modal>
    </div>
  );
}
