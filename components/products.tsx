"use client";
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
  ZoomIn,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { products, contact, type Product } from "@/data/products";
import { artFor } from "@/lib/art";
import { useText, money } from "./hooks";
import { useNotice } from "./shell";
import { useShop } from "@/lib/store";
import { Modal } from "./modal";
import { buttonVariants } from "./ui/button";
export function Art({ p, large = false }: { p: Product; large?: boolean }) {
  return (
    <Image
      src={artFor(p)}
      width={420}
      height={300}
      unoptimized
      className={large ? "art big" : "art"}
      alt={p.name + " · " + [p.storage, p.color].filter(Boolean).join(" ")}
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
        <p>
          {[p.storage, p.color].filter(Boolean).join(" · ") || t(p.category)}
        </p>
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
  const [zoom, setZoom] = useState(false);
  const [angle, setAngle] = useState(false);
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
        <div>
          <button
            className={"stage " + (angle ? "cropped" : "")}
            onClick={() => setZoom(true)}
            aria-label={t("zoom")}
          >
            <Art p={p} large />
            <span>
              <ZoomIn size={17} />
              {t("art")}
            </span>
          </button>
          <div className="chips">
            {[false, true].map((a, i) => (
              <button
                key={i}
                aria-pressed={angle === a}
                onClick={() => setAngle(a)}
              >
                {t(a ? "zoom" : "gallery")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="kicker">
            {p.brand} / {t(p.category)}
          </div>
          <h1>{p.name}</h1>
          <p>{[p.storage, p.color].filter(Boolean).join(" · ")}</p>
          <h2>{money(p.price)}</h2>
          <small>{t("priceNote")}</small>
          <Actions p={p} />
          <a
            className="textlink"
            href={
              "https://wa.me/" +
              contact.whatsapp +
              "?text=" +
              encodeURIComponent(
                t("view") + " — " + p.name + " " + p.storage + " " + p.color,
              )
            }
          >
            <MessageCircle size={16} />
            {t("inquire")}
          </a>
          <button
            className="textlink"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(location.href);
                notice(t("copied"));
              } catch {
                setZoom(false);
                window.prompt(t("share"), location.href);
              }
            }}
          >
            <Share2 size={16} />
            {t("share")}
          </button>
          <dl>
            {[
              [t("brand"), p.brand],
              [t("storage"), p.storage],
              [t("color"), p.color],
              ...[
                ...(p.condition === "new"
                  ? [
                      [
                        locale === "az"
                          ? "Vəziyyət"
                          : locale === "ru"
                            ? "Состояние"
                            : "Condition",
                        locale === "az"
                          ? "Yeni"
                          : locale === "ru"
                            ? "Новый"
                            : "New",
                      ],
                    ]
                  : []),
              ],
            ]
              .filter((x) => x[1])
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>
          <a
            className="textlink"
            href={p.source}
            target="_blank"
            rel="noreferrer"
          >
            {t("source")} · {p.verifiedAt.slice(0, 10)}{" "}
            <ArrowUpRight size={15} />
          </a>
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
      <Modal open={zoom} close={() => setZoom(false)} title={p.name}>
        <div className={angle ? "cropped" : ""}>
          <Art p={p} large />
        </div>
        <small>{t("art")}</small>
      </Modal>
    </div>
  );
}
