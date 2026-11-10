"use client";
import { ProductGallery } from "./product-gallery";
import { useInventory } from "./inventory";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  Heart,
  ArrowUpRight,
  Plus,
  Scan,
  Share2,
  ChevronRight,
} from "lucide-react";
import { type Product } from "@/data/products";
import { artFor } from "@/lib/art";
import { useText, money } from "./hooks";
import { useNotice } from "./shell";
import { useShop } from "@/lib/store";
import { OrderButton } from "./order-button";
import { Modal } from "./modal";
import { buttonVariants } from "./ui/button";
export function Art({
  p,
  large = false,
  index = 0,
}: {
  p: Product;
  large?: boolean;
  index?: number;
}) {
  const { t } = useText();
  if (!p.images?.length)
    return (
      <div className={large ? "art big missingPhoto" : "art missingPhoto"}>
        <Scan aria-hidden="true" />
        <span>{t("missingPhoto")}</span>
      </div>
    );
  return (
    <Image
      src={p.images?.[index]?.url || artFor(p)}
      width={420}
      height={300}
      unoptimized
      className={large ? "art big" : "art"}
      alt={
        p.images?.[index]?.alt ||
        p.name + " · " + [p.storage, p.color].filter(Boolean).join(" ")
      }
    />
  );
}
export function Actions({
  p,
  compact = false,
}: {
  p: Product;
  compact?: boolean;
}) {
  const { t } = useText();
  const notice = useNotice();
  const { favorites, change, toggle } = useShop();
  const saved = favorites.includes(p.slug);
  return (
    <div className="actions">
      <button
        aria-label={t("add")}
        className={compact ? "icon addMini" : buttonVariants()}
        onClick={() => {
          change(p.slug, 1);
          notice(t("added"));
        }}
      >
        <Plus size={17} />
        {!compact && t("add")}
      </button>
      <button
        aria-label={t("wishlist")}
        aria-pressed={saved}
        className={"icon heart " + (saved ? "active" : "")}
        onClick={() => {
          toggle(p.slug);
          notice(t(saved ? "unsaved" : "saved"));
        }}
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
export function Card({ p, i = 0 }: { p: Product; i?: number }) {
  const { t, link } = useText();
  const [open, setOpen] = useState(false);
  return (
    <motion.article
      initial={{ opacity: 0.55, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (i % 4) * 0.035 }}
      className="card"
    >
      <div className="cardImage">
        <Link href={link("products/" + p.slug)}>
          <Art p={p} />
        </Link>
        <button
          className="quick icon"
          aria-label={t("quick")}
          onClick={() => setOpen(true)}
        >
          <Scan size={17} />
        </button>
      </div>
      <div className="cardBody">
        <small>{p.brand}</small>
        <Link href={link("products/" + p.slug)}>
          <h3>{p.name}</h3>
        </Link>
        <p>{[p.storage, p.color].filter(Boolean).join(" · ") || p.brand}</p>
        <div className="row">
          <strong>{money(p.price)}</strong>
          <Actions p={p} compact />
        </div>
      </div>
      <Modal open={open} close={() => setOpen(false)} title={p.name}>
        <Art p={p} />
        <p>
          {p.storage} {p.color}
        </p>
        <h3>{money(p.price)}</h3>
        <p>{t("priceNote")}</p>
        <Actions p={p} />
        <Link
          className="textlink"
          href={link("products/" + p.slug)}
          onClick={() => setOpen(false)}
        >
          {t("view")} <ArrowUpRight size={16} />
        </Link>
      </Modal>
    </motion.article>
  );
}
export function Detail({ p }: { p: Product }) {
  const { t, link, locale } = useText();
  const notice = useNotice();
  const { products, categories } = useInventory();
  const related = products
    .filter((x) => x.slug !== p.slug && x.category === p.category)
    .slice(0, 4);
  return (
    <div className="wrap inner">
      <div className="crumb">
        <Link href={link("catalog")}>{t("catalog")}</Link>
        <ChevronRight size={14} />
        {p.name}
      </div>
      <div className="detail">
        <ProductGallery key={p.slug} product={p} />
        <div>
          <div className="kicker">
            {p.brand} /{" "}
            {categories.find((c) => c.slug === p.category)?.[locale] ||
              p.category}
          </div>
          <h1>{p.name}</h1>
          <p>{p.description?.[locale] || p.description?.az}</p>
          <p>{[p.storage, p.color].filter(Boolean).join(" · ")}</p>
          <h2>{money(p.price)}</h2>
          <small>{t("priceNote")}</small>
          <Actions p={p} />
          <div className="productContactActions">
            <div>
              <OrderButton lines={[{ slug: p.slug, qty: 1, price: p.price }]} />
            </div>
            <button
              className="textlink"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(location.href);
                  notice(t("copied"));
                } catch {
                  window.prompt(t("share"), location.href);
                }
              }}
            >
              <Share2 size={16} />
              {t("share")}
            </button>
          </div>
          <dl>
            {[
              [t("brand"), p.brand],
              [t("storage"), p.storage],
              [t("color"), p.color],
              ...Object.entries(p.specifications || {}),
              ...(p.condition ? [[t("deviceCondition"), t(p.condition)]] : []),
            ]
              .filter((x) => x[1])
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>

          <div className="chips">
            {products
              .filter((x) => x.name === p.name && x.slug !== p.slug)
              .map((x) => (
                <Link key={x.slug} href={link("products/" + x.slug)}>
                  {x.storage} {x.color}
                </Link>
              ))}
          </div>
        </div>
      </div>
      <h2>{t("related")}</h2>
      <div className="grid">
        {related.map((p) => (
          <Card key={p.slug} p={p} />
        ))}
      </div>
    </div>
  );
}
