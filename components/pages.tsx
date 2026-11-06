"use client";

import Link from "next/link";

import {
  ArrowUpRight,
  Minus,
  Plus,
  Trash2,
  MapPin,
  Phone,
  Smartphone,
  Wrench,
  Repeat,
  ShoppingBag,
  Heart,
} from "lucide-react";
import { useInventory } from "./inventory";
import { OrderButton } from "./order-button";
import { useShop } from "@/lib/store";
import { useText, money } from "./hooks";
import { Art, Card } from "./products";
import type { Key } from "@/lib/i18n";
export function Shopping({ page }: { page: "wishlist" | "cart" | "checkout" }) {
  const { t, link } = useText();
  const { cart, favorites, change, remove } = useShop();
  const { products, offline } = useInventory();
  const missing = offline
    ? []
    : Object.keys(cart).filter((id) => !products.some((p) => p.slug === id));
  const items = products.filter((p) =>
    page === "wishlist" ? favorites.includes(p.slug) : cart[p.slug] > 0,
  );
  const total = items.reduce((s, p) => s + p.price * (cart[p.slug] || 0), 0);

  return (
    <div className="wrap inner">
      <h1>{t(page)}</h1>
      {page !== "wishlist" &&
        missing.map((id) => (
          <div key={id} className="tableRow">
            <span>
              {t("changed")} · {id}
            </span>
            <button onClick={() => remove(id)}>{t("remove")}</button>
          </div>
        ))}
      {!items.length ? (
        <div className="empty">
          {page === "wishlist" ? <Heart /> : <ShoppingBag />}
          <h2>{t("empty")}</h2>
          <Link className="button primary" href={link("catalog")}>
            {t("explore")}
          </Link>
        </div>
      ) : page === "wishlist" ? (
        <div className="grid">
          {items.map((p) => (
            <Card p={p} key={p.slug} />
          ))}
        </div>
      ) : (
        <div className="checkoutLayout">
          <section>
            {items.map((p) => (
              <div className="basketItem" key={p.slug}>
                <Art p={p} />
                <div>
                  <Link href={link("products/" + p.slug)}>{p.name}</Link>
                  <small>
                    {p.color} {p.storage}
                  </small>
                  {page === "cart" ? (
                    <div className="qty">
                      <button
                        aria-label={t("minus")}
                        onClick={() => change(p.slug, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      {cart[p.slug]}
                      <button
                        aria-label={t("plus")}
                        onClick={() => change(p.slug, 1)}
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        aria-label={t("remove")}
                        onClick={() => remove(p.slug)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <small>× {cart[p.slug]}</small>
                  )}
                </div>
                <b>{money(p.price * cart[p.slug])}</b>
              </div>
            ))}
          </section>
          <div className="box">
            <div className="row">
              <h3>{t("total")}</h3>
              <b>{money(total)}</b>
            </div>
            <p>{t("priceNote")}</p>
            {page === "cart" ? (
              <Link className="button primary" href={link("checkout")}>
                {t("checkout")}
                <ArrowUpRight size={17} />
              </Link>
            ) : (
              <OrderButton
                lines={Object.entries(cart).map(([slug, qty]) => ({
                  slug,
                  qty,
                  price: products.find((p) => p.slug === slug)?.price ?? 0,
                }))}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export function Info({ page }: { page: string }) {
  const { t, link } = useText();
  const { whatsapp } = useInventory();
  const contact = { whatsapp, phone: "+" + whatsapp };
  const wa = "https://wa.me/" + contact.whatsapp;
  const contactBox = (
    <div className="box">
      <MapPin />
      <h3>{t("addressLine")}</h3>
      <a className="textlink" href={"tel:+" + contact.whatsapp}>
        <Phone size={16} />
        {contact.phone}
      </a>
      <a className="button primary" href={wa}>
        {t("inquire")}
        <ArrowUpRight size={16} />
      </a>
    </div>
  );
  return (
    <div className="wrap inner">
      <h1>{t(page as Key)}</h1>
      {["services", "contact", "about"].includes(page) ? (
        <>
          <div className="checkoutLayout">
            <div className="box">
              <div className="kicker">BAKU / AZ</div>
              <h2>Telefon 28 Mobile</h2>
              <p>{t("serviceText")}</p>
              <a
                className="textlink"
                href="https://ru.tap.az/shops/telefon28mobile"
              >
                Tap.az <ArrowUpRight size={16} />
              </a>
              <a
                className="textlink"
                href="https://www.instagram.com/telefon28mobile/"
              >
                Instagram <ArrowUpRight size={16} />
              </a>
            </div>
            {contactBox}
          </div>
          {page === "services" && (
            <div className="serviceGrid">
              {(["buy", "sell", "trade", "repair"] as const).map((k, i) => {
                const Icon = [ShoppingBag, Smartphone, Repeat, Wrench][i];
                return (
                  <a
                    className="box"
                    key={k}
                    href={
                      k === "trade"
                        ? link("trade-in")
                        : wa + "?text=" + encodeURIComponent(t(k))
                    }
                  >
                    <Icon />
                    <h3>{t(k)}</h3>
                    <small>{t("inquire")} ↗</small>
                  </a>
                );
              })}
            </div>
          )}
        </>
      ) : page === "faq" ? (
        <div className="box">
          {(
            [
              ["address", "addressLine"],
              ["prices", "priceNote"],
              ["checkout", "checkoutNote"],
              ["services", "serviceText"],
            ] as const
          ).map(([k, v]) => (
            <details key={k}>
              <summary>{t(k)}</summary>
              <p>{t(v)}</p>
            </details>
          ))}
        </div>
      ) : (
        <div className="box">
          {page === "privacy" && <p>{t("tradePrivacy")}</p>}
          <p>{t(page === "promo" ? "noPromo" : "pending")}</p>
          <Link className="textlink" href={link("contact")}>
            {t("contact")} ↗
          </Link>
        </div>
      )}
    </div>
  );
}
