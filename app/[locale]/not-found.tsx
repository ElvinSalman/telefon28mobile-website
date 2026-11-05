"use client";
import Link from "next/link";
import { useText } from "@/components/hooks";
export default function Missing() {
  const { t, link } = useText();
  return (
    <div className="wrap inner">
      <small>404</small>
      <h1>{t("notFound")}</h1>
      <Link className="button primary" href={link()}>
        {t("home")}
      </Link>
    </div>
  );
}
