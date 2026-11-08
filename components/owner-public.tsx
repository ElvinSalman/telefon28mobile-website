"use client";
import { useState } from "react";
import { MapPin, ArrowUpRight, MessageCircle,Navigation } from "lucide-react";
import {WhatsAppLink} from "./whatsapp-link";
import Link from "next/link";
import { useText } from "./hooks";
import { mapUrl } from "@/lib/business";
import { tradeSchema } from "@/lib/validation";
import { useInventory } from "./inventory";
export function Stores() {
  const { t } = useText();
  const { locations, whatsapp } = useInventory();
  return (
    <section className="wrap inner">
      <div className="storeIntro"><div className="kicker">TELEFON 28 MOBILE · BAKI</div><h1>{t("stores")}</h1><p>{t("storesIntro")}</p></div>
      <div className="branchGrid">
        {locations.map((x) => (
          <article className="box branchCard" key={x.address}>
            <MapPin />
            <h2>{x.address}</h2>
            {x.phone && <p>{x.phone}</p>}
            {x.hours && <p>{x.hours}</p>}
            <WhatsAppLink className="button outline" href={"https://wa.me/"+whatsapp+"?text="+encodeURIComponent(t("branchInquiry")+" "+x.address)}><MessageCircle size={17}/>{t("inquire")}</WhatsAppLink>
            {x.map_url && (
              <a className="textlink" href={x.map_url}>
                {t("map")}
              </a>
            )}
          </article>
        ))}
      </div>
      <div className="box mapCard">
        <div className="mapEmblem" aria-hidden><Navigation/><span>BAKI</span></div>
        <div className="mapContent"><div className="kicker">{t("map")}</div><h2>Telefon 28 Store</h2><p>{t("mapIntro")}</p><div className="contactActions">
        <a className="button primary" target="_blank" rel="noreferrer" href={mapUrl}>{t("map")} <ArrowUpRight size={16}/></a>
        <WhatsAppLink className="button outline" href={"https://wa.me/"+whatsapp}><MessageCircle size={17}/>WhatsApp</WhatsAppLink></div></div>
      </div>
    </section>
  );
}
export function Trade() {
  const { t, link } = useText();
  const [state, set] = useState("");
  return (
    <section className="wrap inner">
      <h1>{t("trade-in")}</h1>
      <form
        className="box ownerForm"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = e.currentTarget;
          const data = Object.fromEntries(new FormData(f));
          const value = tradeSchema.safeParse({
            ...data,
            consent: data.consent === "on",
          });
          if (!value.success) {
            set("invalid");
            return;
          }
          set("busy");
          try {
            const res = await fetch("/api/trade-in", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(value.data),
            });
            set(res.ok ? "submitted" : res.status === 429 ? "rate" : "failed");
            if (res.ok) f.reset();
          } catch {
            set("failed");
          }
        }}
      >
        <p>{t("tradeIntro")}</p>
        {(["name", "phone", "model", "storage"] as const).map((k) => (
          <label key={k}>
            {t(k === "phone" ? "tel" : k)}
            <input
              name={k}
              required
              type={k === "phone" ? "tel" : "text"}
              maxLength={k === "phone" ? 22 : 80}
            />
          </label>
        ))}
        <label>
          {t("deviceCondition")}
          <select name="condition">
            {(["good", "fair", "damaged"] as const).map((k) => (
              <option key={k} value={k}>
                {t(k)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("issues")}
          <textarea name="notes" rows={3} maxLength={1500} />
        </label>
        <input
          hidden
          tabIndex={-1}
          aria-hidden
          name="website"
          autoComplete="off"
        />
        <label className="consent">
          <input type="checkbox" name="consent" required />
          {t("consent")}
        </label>
        <Link href={link("privacy")}>{t("privacy")}</Link>
        <button className="button primary" disabled={state === "busy"}>
          {t("sendRequest")}
        </button>
        {state && <p role="status">{t(state as "submitted")}</p>}
      </form>
    </section>
  );
}
