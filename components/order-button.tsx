"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useText } from "./hooks";
import { track } from "./inventory";
export function OrderButton({
  lines,
}: {
  lines: { slug: string; qty: number; price: number }[];
}) {
  const { locale, t } = useText();
  const router = useRouter();
  const [state, set] = useState("");
  return (
    <>
      <button
        className="button primary"
        disabled={state === "busy"}
        onClick={async () => {
          set("busy");
          try {
            const r = await fetch("/api/quote", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ locale, lines }),
            });
            if (!r.ok) {
              set(r.status === 409 ? "changed" : "failed");
              router.refresh();
              return;
            }
            const { url } = await r.json();
            if (new URL(url).hostname !== "wa.me") throw Error();
            if (navigator.doNotTrack !== "1")
              track(
                "whatsapp_click",
                lines.length === 1 ? lines[0].slug : undefined,
              );
            set("");
            location.assign(url);
          } catch {
            set("failed");
          }
        }}
      >
        {t(state === "busy" ? "busy" : "inquire")} ↗
      </button>
      {state && state !== "busy" && <p role="alert">{t(state as "changed")}</p>}
    </>
  );
}
