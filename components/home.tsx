"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, type PointerEvent } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { products } from "@/data/products";
import { artFor } from "@/lib/art";
import { useText } from "./hooks";
import { Card } from "./products";
const categories = [
  "phone",
  "tablet",
  "watch",
  "audio",
  "gaming",
  "other",
] as const;
export function Home() {
  function followPointer(event: PointerEvent<HTMLAnchorElement>) {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const target = event.currentTarget;
    const bounds = target.getBoundingClientRect();
    const x = (event.clientX - bounds.left - bounds.width / 2) * 0.065;
    const y = (event.clientY - bounds.top - bounds.height / 2) * 0.12;
    target.style.translate = x + "px " + y + "px";
  }
  const { t, link } = useText();
  const [slide, setSlide] = useState(0);
  const hero = [
    products.find(
      (p) => p.name.includes("17 Pro") && p.color === "Cosmic Orange",
    ) || products[0],
    products.find((p) => p.category === "watch")!,
    products.find((p) => p.category === "gaming")!,
  ][slide];
  return (
    <>
      <section className="hero">
        <div className="heroGrid" />
        <div className="wrap heroIn">
          <div className="heroCopy">
            <div className="kicker">
              <i />
              {t("collection")} <span>/</span> 2026
            </div>
            <h1>
              {[t("hero1"), t("hero2")].map((s, i) => (
                <motion.span
                  key={s}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.12 * i }}
                >
                  {s}
                </motion.span>
              ))}
            </h1>
            <p>
              {slide === 0
                ? t("heroText")
                : hero.name + " · " + (hero.storage || hero.color)}
            </p>
            <div className="heroButtons">
              <Link
                className="button primary"
                href={link("catalog")}
                onPointerMove={followPointer}
                onPointerLeave={(e) => {
                  e.currentTarget.style.translate = "";
                }}
              >
                {t("explore")}
                <ArrowRight size={17} />
              </Link>
              <Link
                className="button subtle"
                href={link("products/" + hero.slug)}
              >
                {t("view")}
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
          <div className="heroVisual">
            <div className="orbit" />
            <motion.div
              className="device"
              key={slide}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Image
                src={slide === 0 ? "/art/hero.svg" : artFor(hero)}
                width={760}
                height={620}
                priority
                alt={hero.name}
              />
            </motion.div>
            <div className="spec">
              <i />
              <div>
                <b>{hero.name.replace("Apple ", "")}</b>
                <small>
                  {[hero.color, hero.storage].filter(Boolean).join(" / ")}
                </small>
              </div>
            </div>
          </div>
          <div className="heroFoot">
            <div className="sequence">
              <b>0{slide + 1}</b>
              <div>
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    aria-label={t("collection") + " " + (i + 1)}
                    aria-current={slide === i}
                    onClick={() => setSlide(i)}
                  />
                ))}
              </div>
              03
            </div>
            <div className="heroArrows">
              {[-1, 1].map((d) => (
                <button
                  className="icon"
                  key={d}
                  aria-label={t(d < 0 ? "previous" : "next")}
                  onClick={() => setSlide((slide + d + 3) % 3)}
                >
                  {d < 0 ? <ChevronLeft /> : <ChevronRight />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="wrap">
        <section className="section">
          <div className="sectionHead">
            <h2>{t("categories")}</h2>
            <Link href={link("catalog")}>
              {t("allProducts")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="catGrid">
            {categories.map((c, i) => (
              <Link
                key={c}
                className={"cat cat" + i}
                href={link("catalog?category=" + c)}
              >
                <Image
                  src={"/art/" + c + ".svg"}
                  alt=""
                  width={210}
                  height={150}
                />
                <div>
                  {t(c)}
                  <ArrowUpRight size={15} />
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="section">
          <div className="sectionHead">
            <h2>{t("selected")}</h2>
            <Link href={link("catalog")}>
              {t("catalog")} <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid">
            {products.slice(0, 8).map((p, i) => (
              <Card key={p.slug} p={p} i={i} />
            ))}
          </div>
        </section>
        <section className="section">
          <h2>{t("brands")}</h2>
          <div className="brands">
            {Array.from(new Set(products.map((p) => p.brand))).map((b) => (
              <Link
                key={b}
                href={link("catalog?brand=" + encodeURIComponent(b))}
              >
                {b}
              </Link>
            ))}
          </div>
        </section>
        <section className="bento section">
          <div>
            <div className="kicker">Telefon 28 Mobile</div>
            <h2>{t("services")}</h2>
            <p>{t("serviceText")}</p>
            <Link className="textlink" href={link("services")}>
              {t("services")} <ArrowRight size={16} />
            </Link>
          </div>
          <div>
            <MapPin />
            <h2>{t("visit")}</h2>
            <p>{t("addressLine")}</p>
            <Link className="textlink" href={link("contact")}>
              {t("contact")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
