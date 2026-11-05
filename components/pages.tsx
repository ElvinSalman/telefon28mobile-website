"use client";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
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
  LockKeyhole,
} from "lucide-react";
import { contact, products } from "@/data/products";
import { useShop } from "@/lib/store";
import { useText, money } from "./hooks";
import { Art, Card } from "./products";
import type { Key } from "@/lib/i18n";
export function Shopping({ page }: { page: "wishlist" | "cart" | "checkout" }) {
  const { t, link } = useText();
  const { cart, favorites, change, remove } = useShop();
  const items = products.filter((p) =>
    page === "wishlist" ? favorites.includes(p.slug) : cart[p.slug] > 0,
  );
  const total = items.reduce((s, p) => s + p.price * (cart[p.slug] || 0), 0);
  const [delivery, setDelivery] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div className="wrap inner">
      <h1>{t(page)}</h1>
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
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  const schema = z.object({
                    name: z.string().trim().min(2),
                    phone: z.string().regex(/^\+?[\d ()-]{7,22}$/),
                    address: delivery ? z.string().trim().min(4) : z.string(),
                  });
                  const r = schema.safeParse({
                    name: data.get("name"),
                    phone: data.get("phone"),
                    address: data.get("address") || "",
                  });
                  setError(!r.success);
                  if (r.success) {
                    const lines = [
                      t("checkout"),
                      r.data.name,
                      r.data.phone,
                      t(delivery ? "delivery" : "pickup"),
                      r.data.address,
                      ...items.map(
                        (p) =>
                          p.name +
                          " " +
                          p.storage +
                          " " +
                          p.color +
                          " × " +
                          cart[p.slug] +
                          " — " +
                          money(p.price * cart[p.slug]),
                      ),
                      t("total") + " " + money(total),
                    ];
                    window.open(
                      "https://wa.me/" +
                        contact.whatsapp +
                        "?text=" +
                        encodeURIComponent(lines.filter(Boolean).join("\n")),
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }
                }}
              >
                <label>
                  {t("name")}
                  <input name="name" autoComplete="name" />
                </label>
                <label>
                  {t("tel")}
                  <input type="tel" name="phone" autoComplete="tel" />
                </label>
                <select
                  aria-label={t("checkout")}
                  value={delivery ? "delivery" : "pickup"}
                  onChange={(e) => setDelivery(e.target.value === "delivery")}
                >
                  <option value="pickup">{t("pickup")}</option>
                  <option value="delivery">{t("delivery")}</option>
                </select>
                {delivery && (
                  <label>
                    {t("address")}
                    <input name="address" autoComplete="street-address" />
                  </label>
                )}
                <small>{t("checkoutNote")}</small>
                {error && <p role="alert">{t("validation")}</p>}
                <button className="button primary">
                  {t("inquire")}
                  <ArrowUpRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export function Info({ page }: { page: string }) {
  const { t, link } = useText();
  const wa = "https://wa.me/" + contact.whatsapp;
  const account = [
    "account",
    "login",
    "register",
    "reset",
    "profile",
    "addresses",
  ].includes(page);
  const [tab, setTab] = useState<Key>("catalog");
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
      {account ? (
        <div className="checkoutLayout">
          <div className="box">
            <LockKeyhole />
            <h3>{t("demo")}</h3>
            <p>{t("accountNote")}</p>
            <div className="chips">
              {(
                ["login", "register", "reset", "profile", "addresses"] as const
              ).map((k) => (
                <Link key={k} href={link(k)}>
                  {t(k)}
                </Link>
              ))}
            </div>
          </div>
          <div className="box">
            <h2>{t(page === "account" ? "login" : (page as Key))}</h2>
            {["account", "login", "register", "reset"].includes(page) ? (
              <fieldset disabled>
                <label>
                  {t("email")}
                  <input type="email" />
                </label>
                {page !== "reset" && (
                  <label>
                    {t("password")}
                    <input type="password" />
                  </label>
                )}
                <button className="button outline" disabled>
                  {t("demo")}
                </button>
              </fieldset>
            ) : (
              <p>{t("accountNote")}</p>
            )}
          </div>
        </div>
      ) : page === "admin" ? (
        <>
          <Badge>{t("prototype")}</Badge>
          <div className="metrics">
            {[
              [t("catalog"), products.length],
              [t("brands"), new Set(products.map((p) => p.brand)).size],
              [t("categories"), new Set(products.map((p) => p.category)).size],
            ].map(([k, v]) => (
              <div className="box" key={k}>
                <small>{k}</small>
                <h2>{v}</h2>
              </div>
            ))}
          </div>
          <div className="chips">
            {(
              [
                "catalog",
                "categories",
                "prices",
                "variants",
                "inventory",
                "orders",
                "customers",
                "promo",
              ] as const
            ).map((k) => (
              <button
                aria-pressed={tab === k}
                onClick={() => setTab(k)}
                key={k}
              >
                {t(k)}
              </button>
            ))}
          </div>
          <div className="box">
            <h2>{t(tab)}</h2>
            {["orders", "customers", "promo"].includes(tab) ? (
              <p>{t("prototype")} · 0</p>
            ) : tab === "categories" ? (
              Array.from(new Set(products.map((p) => p.category))).map((c) => (
                <p key={c}>
                  {t(c)} · {products.filter((p) => p.category === c).length}
                </p>
              ))
            ) : (
              products.map((p) => (
                <div className="tableRow" key={p.slug}>
                  <span>
                    {p.name} {p.storage} {p.color}
                  </span>
                  <b>{tab === "inventory" ? t("unknown") : money(p.price)}</b>
                </div>
              ))
            )}
          </div>
        </>
      ) : ["services", "contact", "about"].includes(page) ? (
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
                    href={wa + "?text=" + encodeURIComponent(t(k))}
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
          <p>{t(page === "promo" ? "noPromo" : "pending")}</p>
          <Link className="textlink" href={link("contact")}>
            {t("contact")} ↗
          </Link>
        </div>
      )}
    </div>
  );
}
