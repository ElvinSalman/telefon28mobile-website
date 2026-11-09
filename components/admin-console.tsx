"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductsPanel } from "./admin-products";
import { SimpleImportPanel } from "./admin-import";
import { adminRequest } from "@/lib/admin-client";
import { slugify } from "@/lib/validation";
export type Row = {
  id: string;
  slug: string;
  name: string;
  status: string;
  price: number;
  brand_id: string;
  category_id: string;
  color: string;
  storage: string;
  condition: string;
  description: Record<string, string>;
  specifications: Record<string, string>;
  product_images: { path: string; sort_order: number; alt: string }[];
  updated_at: string;
  featured: boolean;
  source_url: string | null;
  source_verified_at: string | null;
  import_key?: string | null;
};
type Cat = {
  slug: string;
  az: string;
  ru: string;
  en: string;
  sort_order: number;
  active: boolean;
};
type Store = {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  map_url: string;
  sort_order: number;
  active: boolean;
};
export type Data = {
  products: Row[];
  requestCount: number;
  days: number;
  requestStatus: string;
  categories: Cat[];
  brands: { slug: string; name: string }[];
  stores: Store[];
  whatsapp: string;
  requests: {
    id: string;
    name: string;
    phone: string;
    created_at: string;
    model: string;
    storage: string;
    condition: string;
    notes: string;
    status: string;
  }[];
  stats: { day: string; event: string; subject: string; count: number }[];
};
const states = ["draft", "published", "archived"];
const statusName: Record<string, string> = {
  draft: "Qaralama",
  published: "Dərc edilib",
  archived: "Arxiv",
  new: "Yeni",
  contacted: "Əlaqə saxlanılıb",
  closed: "Bağlı",
};
function Field({
  name,
  label,
  value = "",
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  value?: string | number;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={value ?? ""}
        step={type === "number" ? "any" : undefined}
      />
    </label>
  );
}
export function AdminConsole({
  tab,
  data: d,
  newProduct = false,
  editSlug,
}: {
  tab: string;
  data: Data;
  newProduct?: boolean;
  editSlug?: string;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(value: unknown) {
    setBusy(true);
    try {
      await adminRequest(value);
      setNotice("Saxlanıldı.");
      router.refresh();
      return true;
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Əməliyyat tamamlanmadı.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  const wrap =
    (action: (f: FormData) => void) =>
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      action(new FormData(e.currentTarget));
    };
  const button = (
    <button className="button primary" disabled={busy}>
      Saxla
    </button>
  );
  const totals = (k: string) =>
    d.stats
      .filter((x) => x.event === k)
      .reduce((s, x) => s + Number(x.count), 0);
  const popular = new Map<string, number>();
  d.stats
    .filter((r) => r.event === "product_view")
    .forEach((r) =>
      popular.set(r.subject, (popular.get(r.subject) || 0) + Number(r.count)),
    );
  const daily = [...new Set(d.stats.map((r) => r.day))].map((day) => {
    const counts = (event: string) =>
      d.stats
        .filter((r) => r.day === day && r.event === event)
        .reduce((s, r) => s + Number(r.count), 0);
    return {
      day,
      views: counts("product_view"),
      clicks: counts("whatsapp_click"),
    };
  });
  const scale = Math.max(1, ...daily.map((r) => Math.max(r.views, r.clicks)));
  return (
    <>
      <p role="status" className={notice ? "adminNotice" : ""}>
        {busy ? "Saxlanılır…" : notice}
      </p>
      {(tab === "overview" || tab === "analytics") && (
        <>
          {tab === "overview" && (
            <section className="box adminWelcome">
              <div>
                <div className="kicker">TELEFON28MOBILE</div>
                <h2>Mağazanızı idarə edin</h2>
                <p>
                  Məhsul əlavə edin, qiymətləri yeniləyin və müştəri
                  müraciətlərini izləyin.
                </p>
              </div>
              <Link className="button primary" href="/admin/products?new=1">
                + Məhsul əlavə et
              </Link>
              <ol>
                <li>Brend və kateqoriyanı seçin, model və qiyməti yazın.</li>
                <li>Fotoları seçin, sıralayın və əsas şəkli müəyyən edin.</li>
                <li>“Dərc edilib” seçin. Məhsul saytda görünəcək.</li>
              </ol>
              <Link className="textlink" href="/admin/import">
                CSV / XLSX ilə toplu əlavə et ↗
              </Link>
            </section>
          )}
          <div className="chips">
            {[1, 7, 30, 90].map((n) => (
              <Link key={n} href={"?days=" + n}>
                {n} gün
              </Link>
            ))}
          </div>
          <div className="adminGrid">
            {Object.entries({
              page_view: "Səhifə ziyarətləri",
              session: "Brauzer sessiyaları",
              product_view: "Məhsula baxış",
              whatsapp_click: "WhatsApp keçidləri",
            }).map(([k, v]) => (
              <article className="box" key={k}>
                <small>{v}</small>
                <h2>{totals(k)}</h2>
              </article>
            ))}
            <article className="box">
              <small>Saxlanmış Trade-in müraciətləri · {d.days} gün</small>
              <h2 data-testid="request-count">{d.requestCount}</h2>
              <Link
                href={
                  "/admin/trade-in?days=" +
                  d.days +
                  "&request_status=" +
                  d.requestStatus
                }
              >
                Müraciətlərə bax →
              </Link>
            </article>
          </div>
          <small>
            Sayğaclar Bakı vaxtı ilə hesablanır. WhatsApp göstəricisi keçidə
            klik sayıdır. Sessiya brauzer vərəqində 30 dəqiqəlik fasilədən sonra
            yenilənir.
          </small>
          {tab === "overview" ? (
            <div className="box">
              <h3>Məhsullar</h3>
              <p>
                {states
                  .map(
                    (k) =>
                      statusName[k] +
                      " " +
                      d.products.filter((p) => p.status === k).length,
                  )
                  .join(" · ")}
              </p>
              <h3>Son dəyişikliklər</h3>
              {d.products.slice(0, 5).map((p) => (
                <div key={p.slug} className="tableRow">
                  {p.name}
                  <time>{p.updated_at.slice(0, 10)}</time>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="box">
                <h3>Ən çox baxılan məhsullar</h3>
                {[...popular]
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([k, n]) => (
                    <div className="tableRow" key={k}>
                      {d.products.find((p) => p.slug === k)?.name || k}
                      <b>{n}</b>
                    </div>
                  ))}
                {!popular.size && <p>Hələ baxış qeydə alınmayıb.</p>}
              </div>
              <div className="box">
                <h3>Gündəlik fəaliyyət</h3>
                {daily.map((r) => (
                  <article key={r.day}>
                    <time>{r.day}</time>
                    <div>
                      Baxışlar · {r.views}
                      <meter
                        aria-label="Məhsula baxış"
                        min={0}
                        max={scale}
                        value={r.views}
                      />
                    </div>
                    <div>
                      WhatsApp · {r.clicks}
                      <meter
                        aria-label="WhatsApp keçidləri"
                        min={0}
                        max={scale}
                        value={r.clicks}
                      />
                    </div>
                  </article>
                ))}
                {!daily.length && <p>Bu dövr üçün fəaliyyət yoxdur.</p>}
              </div>
            </>
          )}
        </>
      )}
      {tab === "products" && (
        <ProductsPanel data={d} newProduct={newProduct} editSlug={editSlug} />
      )}
      {tab === "import" && <SimpleImportPanel data={d} />}
      {tab === "categories" && (
        <>
          <form
            className="box"
            onSubmit={wrap((f) =>
              save({
                op: "brand",
                slug: slugify(String(f.get("name"))),
                name: f.get("name"),
              }),
            )}
          >
            <h3>Brend əlavə et</h3>
            <Field name="name" label="Ad" required />
            {button}
            <small>
              {d.brands.map((b) => b.name + " (" + b.slug + ")").join(", ")}
            </small>
          </form>
          <details className="box">
            <summary>Brend adlarını redaktə et</summary>
            {d.brands.map((b) => (
              <form
                key={b.slug}
                onSubmit={wrap((f) =>
                  save({ op: "brand", slug: b.slug, name: f.get("name") }),
                )}
              >
                <Field name="name" label={b.slug} value={b.name} required />
                {button}
              </form>
            ))}
          </details>
          {[...d.categories, null].map((c) => (
            <details key={c?.slug || "new"} className="box">
              <summary>{c?.az || "Yeni kateqoriya"}</summary>
              <form
                onSubmit={wrap((f) =>
                  save({
                    op: "category",
                    ...Object.fromEntries(f),
                    slug: c?.slug || f.get("slug"),
                    sort_order: Number(f.get("sort_order")),
                    active: f.has("active"),
                  }),
                )}
              >
                <Field name="slug" label="Slug" value={c?.slug} required />
                {(["az", "ru", "en"] as const).map((l) => (
                  <Field key={l} name={l} label={l} value={c?.[l]} required />
                ))}
                <Field
                  name="sort_order"
                  type="number"
                  label="Sıra"
                  value={c?.sort_order || 0}
                />
                <label>
                  Aktiv
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={c?.active ?? true}
                  />
                </label>
                {button}
              </form>
            </details>
          ))}
        </>
      )}
      {tab === "locations" &&
        d.stores.map((x) => (
          <form
            className="box"
            key={x.id}
            onSubmit={wrap((f) =>
              save({
                op: "store",
                id: x.id,
                ...Object.fromEntries(f),
                sort_order: Number(f.get("sort_order")),
                active: f.has("active"),
              }),
            )}
          >
            {(
              [
                "name",
                "address",
                "phone",
                "hours",
                "map_url",
                "sort_order",
              ] as const
            ).map((k, i) => (
              <Field
                key={k}
                label={
                  [
                    "Filial",
                    "Ünvan",
                    "Telefon",
                    "İş vaxtı",
                    "Təsdiqlənmiş filial xəritəsi",
                    "Sıra",
                  ][i]
                }
                name={k}
                value={x[k]}
              />
            ))}
            <label>
              Aktiv
              <input type="checkbox" name="active" defaultChecked={x.active} />
            </label>
            {button}
          </form>
        ))}
      {tab === "settings" && (
        <form
          className="box"
          onSubmit={wrap((f) =>
            save({ op: "settings", whatsapp: f.get("whatsapp") }),
          )}
        >
          <Field
            name="whatsapp"
            label="Ümumi WhatsApp nömrəsi (yalnız rəqəmlər)"
            value={d.whatsapp}
            required
          />
          {button}
        </form>
      )}
      {tab === "trade-in" && (
        <>
          <div className="adminFilters">
            <label>
              Dövr
              <select
                value={d.days}
                onChange={(e) =>
                  router.push(
                    "?days=" +
                      e.target.value +
                      "&request_status=" +
                      d.requestStatus,
                  )
                }
              >
                {[1, 7, 30, 90].map((n) => (
                  <option key={n} value={n}>
                    {n} gün
                  </option>
                ))}
              </select>
            </label>
            <label>
              Müraciət statusu
              <select
                value={d.requestStatus}
                onChange={(e) =>
                  router.push(
                    "?days=" + d.days + "&request_status=" + e.target.value,
                  )
                }
              >
                <option value="">Bütün statuslar</option>
                {["new", "contacted", "closed"].map((s) => (
                  <option key={s} value={s}>
                    {statusName[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p>
            <span data-testid="request-count">{d.requestCount}</span> saxlanmış
            müraciət · Bakı vaxtı ilə {d.days} gün
          </p>
          {d.requests.map((r) => (
            <article className="box" key={r.id}>
              <h3>
                {r.model} · {r.storage}
              </h3>
              <p>
                {r.name} · {r.phone}
              </p>
              <p>
                {(
                  { good: "Yaxşı", fair: "Orta", damaged: "Zədəli" } as Record<
                    string,
                    string
                  >
                )[r.condition] || r.condition}{" "}
                · {r.notes}
              </p>
              <small>
                {new Date(r.created_at).toLocaleString("az-AZ", {
                  timeZone: "Asia/Baku",
                })}
              </small>
              <select
                aria-label="Status"
                value={r.status}
                disabled={busy}
                onChange={(e) =>
                  save({ op: "trade", id: r.id, status: e.target.value })
                }
              >
                {["new", "contacted", "closed"].map((s) => (
                  <option key={s} value={s}>
                    {statusName[s]}
                  </option>
                ))}
              </select>
            </article>
          ))}
          {!d.requests.length && (
            <div className="box">
              <h3>Hələ müraciət yoxdur</h3>
              <p>
                Saytın Trade-in formasından göndərilən cihaz və əlaqə
                məlumatları burada görünəcək.
              </p>
              <Link className="textlink" href="/az/trade-in">
                Trade-in formasına bax ↗
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
