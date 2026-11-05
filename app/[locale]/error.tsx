"use client";
import { useText } from "@/components/hooks";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useText();
  return (
    <div className="wrap inner">
      <h1>{t("error")}</h1>
      <button className="button primary" onClick={reset}>
        {t("retry")}
      </button>
    </div>
  );
}
