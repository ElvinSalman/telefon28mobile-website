"use client";
import { useEffect, useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";
import { MotionConfig, motion, useScroll } from "motion/react";
import {
  Menu,
  Search,
  Sun,
  Moon,
  Heart,
  ShoppingBag,
  ChevronDown,
  ArrowUp,
  ArrowUpRight,
  Globe,
  Check,
  UserRound,
} from "lucide-react";
import { locales, type Locale } from "@/lib/i18n";
import { products } from "@/data/products";
import { useShop } from "@/lib/store";
import { Modal } from "./modal";
import { useText, money } from "./hooks";
const Notice = createContext<(s: string) => void>(() => {});
export const useNotice = () => useContext(Notice);
export function Logo() {
  return (
    <span className="logo">
      <b>28</b>
      <span>
        Telefon 28<small>MOBILE</small>
      </span>
    </span>
  );
}
export function Shell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <MotionConfig reducedMotion="user">
        <Frame key={locale}>{children}</Frame>
      </MotionConfig>
    </ThemeProvider>
  );
}
function Frame({ children }: { children: React.ReactNode }) {
  const { t, link, locale } = useText();
  const path = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [panel, setPanel] = useState("");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const { scrollYProgress } = useScroll();
  const cart = useShop((s) => s.cart);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  useEffect(() => {
    void useShop.persist.rehydrate();
  }, []);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 2400);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  const nav = ["catalog", "services", "about", "contact"] as const;
  const cats = [
    "phone",
    "tablet",
    "audio",
    "watch",
    "gaming",
    "other",
  ] as const;
  return (
    <Notice.Provider value={(s) => setNotice(s)}>
      <motion.div className="progress" style={{ scaleX: scrollYProgress }} />
      <header>
        <div className="headerInner">
          <Link href={link()} aria-label="Telefon 28 Mobile">
            <Logo />
          </Link>
          <nav>
            {nav.map((k) =>
              k === "catalog" ? (
                <div className="navGroup" key={k}>
                  <Link href={link(k)}>
                    {t(k)} <ChevronDown size={12} />
                  </Link>
                  <div className="mega">
                    {cats.map((c) => (
                      <Link key={c} href={link("catalog?category=" + c)}>
                        {t(c)}
                        <ArrowUpRight size={14} />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link key={k} href={link(k)}>
                  {t(k)}
                </Link>
              ),
            )}
          </nav>
          <div className="tools">
            <button
              className="icon"
              aria-label={t("search")}
              onClick={() => setPanel("search")}
            >
              <Search />
            </button>
            <button
              className="icon theme"
              aria-label={t("theme")}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="sun" />
              <Moon className="moon" />
            </button>
            <button
              className="lang"
              aria-label={t("language")}
              onClick={() => setPanel("language")}
            >
              {locale.toUpperCase()} <ChevronDown size={12} />
            </button>
            <Link
              className="icon favHead"
              href={link("wishlist")}
              aria-label={t("wishlist")}
            >
              <Heart />
            </Link>
            <Link
              className="icon bag"
              href={link("cart")}
              aria-label={t("cart")}
            >
              <ShoppingBag />
              {count > 0 && (
                <motion.i
                  key={count}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                >
                  {count}
                </motion.i>
              )}
            </Link>
            <button
              className="icon hamburger"
              aria-label={t("menu")}
              onClick={() => setPanel("menu")}
            >
              <Menu />
            </button>
          </div>
        </div>
      </header>
      <main key={path}>{children}</main>
      <footer>
        <div className="wrap footerGrid">
          <div>
            <Logo />
            <p>{t("addressLine")}</p>
            <small>{t("demo")}</small>
          </div>
          {[
            ["catalog", "services", "contact", "about"] as const,
            ["cart", "wishlist", "account", "admin"] as const,
            ["faq", "promo", "privacy", "terms"] as const,
          ].map((list, i) => (
            <div key={i}>
              {list.map((k) => (
                <Link key={k} href={link(k)}>
                  {t(k)}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="wrap footBottom">
          © 2026 Telefon 28 Mobile
          <button
            className="icon"
            aria-label={t("top")}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ArrowUp />
          </button>
        </div>
      </footer>
      <Modal
        open={!!panel}
        close={() => setPanel("")}
        title={t(
          panel === "search"
            ? "search"
            : panel === "language"
              ? "language"
              : "menu",
        )}
      >
        {panel === "search" ? (
          <>
            <input
              autoFocus
              type="search"
              placeholder={t("search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="searchResults">
              {products
                .filter((p) =>
                  (p.name + " " + p.storage + " " + p.color)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .slice(0, 7)
                .map((p) => (
                  <Link
                    key={p.slug}
                    href={link("products/" + p.slug)}
                    onClick={() => setPanel("")}
                  >
                    {p.name} {p.storage}
                    <b>{money(p.price)}</b>
                  </Link>
                ))}
              <Link
                href={link("catalog?q=" + encodeURIComponent(query))}
                onClick={() => setPanel("")}
              >
                {t("allProducts")} →
              </Link>
            </div>
          </>
        ) : panel === "language" ? (
          <div className="menuList">
            {locales.map((l, i) => (
              <button
                key={l}
                onClick={() => {
                  setPanel("");
                  router.push("/" + l + path.slice(3) + location.search);
                }}
              >
                <Globe size={16} />
                {["Azərbaycanca", "Русский", "English"][i]}{" "}
                {l === locale && <Check size={16} />}
              </button>
            ))}
          </div>
        ) : (
          <div className="menuList">
            {[...nav, "wishlist", "account"].map((k) => (
              <Link key={k} href={link(k)} onClick={() => setPanel("")}>
                {k === "account" && <UserRound size={16} />}{" "}
                {t(k as (typeof nav)[number])}
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
        )}
      </Modal>
      <div
        role="status"
        aria-live="polite"
        className={"toast " + (notice ? "show" : "")}
      >
        {notice && (
          <>
            <Check size={16} />
            {notice}
          </>
        )}
      </div>
    </Notice.Provider>
  );
}
