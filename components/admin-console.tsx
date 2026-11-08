"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { columns, parseSheet } from "@/lib/importer";
import { slugify } from "@/lib/validation";
type Row = {
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
type Data = {
  products: Row[];
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
export function AdminConsole({ tab, data: d,newProduct=false }: { tab: string; data: Data;newProduct?:boolean }) {
  const router = useRouter();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");
  const [statusFilter,setStatusFilter]=useState("");
  const [sort, setSort] = useState("updated");
  const [selected, select] = useState<string | null>(newProduct ? "" : null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [preview, setPreview] = useState("");
  const edit = d.products.find((p) => p.slug === selected);
  const path = (r: Row) => {
    const im = r.product_images
      ?.slice()
      .sort((a, b) => a.sort_order - b.sort_order)[0];
    return im
      ? process.env.NEXT_PUBLIC_SUPABASE_URL +
          "/storage/v1/object/public/product-images/" +
          im.path
      : "/art/other.svg";
  };
  async function save(value: unknown, upload = false) {
    setBusy(true);
    try {
      const r = await fetch(upload ? "/api/admin/image" : "/api/admin", {
        method: "POST",
        headers: upload ? {} : { "Content-Type": "application/json" },
        body: upload ? (value as FormData) : JSON.stringify(value),
      });
      if (!r.ok)
        throw Error(
          r.status === 403
            ? "Sessiya və ya icazə yoxdur."
            : "Saxlanmadı. Məlumatları yoxlayın.",
        );
      setNotice("Saxlanıldı.");
      router.refresh();
      return true;
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Xəta");
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
  const sorted = d.products
    .filter((p) =>
      (p.name + " " + p.slug + " " + p.brand_id)
        .toLowerCase()
        .includes(filter.toLowerCase())&&(!statusFilter||p.status===statusFilter),
    )
    .sort((a, b) =>
      sort === "price"
        ? a.price - b.price
        : sort === "name"
          ? a.name.localeCompare(b.name)
          : b.updated_at.localeCompare(a.updated_at),
    );
  return (
    <>
      <p role="status" className={notice ? "adminNotice" : ""}>
        {busy ? "Saxlanılır…" : notice}
      </p>
      {(tab === "overview" || tab === "analytics") && (
        <>
          {tab==="overview"&&<section className="box adminWelcome"><div><div className="kicker">TELEFON28MOBILE</div><h2>Mağazanızı idarə edin</h2><p>Məhsul əlavə edin, qiymətləri yeniləyin və müştəri müraciətlərini izləyin.</p></div><Link className="button primary" href="/admin/products?new=1">+ Məhsul əlavə et</Link><ol><li>Brend və kateqoriyanı seçin, model və qiyməti yazın.</li><li>Məhsulu saxlayın və öz fotolarınızı yükləyin.</li><li>“Dərc edilib” seçin. Məhsul saytda görünəcək.</li></ol><Link className="textlink" href="/admin/import">CSV / XLSX ilə toplu əlavə et ↗</Link></section>}
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
              trade_in: "Trade-in müraciətləri",
            }).map(([k, v]) => (
              <article className="box" key={k}>
                <small>{v}</small>
                <h2>{totals(k)}</h2>
              </article>
            ))}
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
        <>
          <div className="catalogBar">
            <input
              aria-label="Axtar"
              placeholder="Ad, brend və ya slug"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <select
              aria-label="Sıralama"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="updated">Son dəyişiklik</option>
              <option value="name">Ad</option>
              <option value="price">Qiymət</option>
            </select>
            <button
              className="button primary"
              onClick={() => {
                select("");
                setPreview("");
              }}
            >
              Yeni məhsul
            </button>
          </div>
          <label className="statusFilter">Status<select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">Bütün məhsullar</option>{states.map(s=><option key={s} value={s}>{statusName[s]}</option>)}</select></label>
          {selected !== null && (
            <div className="box" key={edit?.id||"new-"+selected}>
              <form
                onSubmit={wrap(async (f) => {
                  const fields = Object.fromEntries(f);
                  try {
                    const record = {
                      ...fields,
                      slug:
                        edit?.slug ||
                        fields.slug ||
                        slugify(String(fields.name)),
                      price: Number(fields.price),
                      description: Object.fromEntries(
                        ["az", "ru", "en"].map((l) => [l, fields["desc_" + l]]),
                      ),
                      specifications: JSON.parse(
                        String(fields.specifications) || "{}",
                      ),
                      condition: fields.condition || null,
                    };
                    if (await save({ op: "product", id: edit?.id, record }))
                      select(String(record.slug));
                  } catch {
                    setNotice("Xüsusiyyətlər düzgün JSON olmalıdır.");
                  }
                })}
              >
                <h3>{edit ? "Məhsulu redaktə et" : "Məhsul əlavə et"}</h3>
                <Field
                  name="name"
                  label="Ad və model"
                  required
                  value={edit?.name}
                />
                <label>
                  Slug
                  <input
                    name="slug"
                    defaultValue={edit?.slug}
                    readOnly={!!edit}
                    placeholder="Ad əsasında avtomatik"
                  />
                </label>
                <div className="adminGrid">
                  {(["brand_id", "category_id"] as const).map((k) => (
                    <label key={k}>
                      {k === "brand_id" ? "Brend" : "Kateqoriya"}
                      <select required name={k} defaultValue={edit?.[k] || ""}>
                        <option value="">Seçin</option>
                        {(k === "brand_id"
                          ? d.brands.map((b) => [b.slug, b.name])
                          : d.categories.map((c) => [c.slug, c.az])
                        ).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <Field
                  name="price"
                  type="number"
                  label="Qiymət (AZN)"
                  required
                  value={edit?.price}
                />
                <Field name="storage" label="Yaddaş" value={edit?.storage} />
                <Field name="color" label="Rəng" value={edit?.color} />
                <label>
                  Vəziyyət
                  <select name="condition" defaultValue={edit?.condition || ""}>
                    <option value="">Göstərilməyib</option>
                    <option value="new">Yeni</option>
                    <option value="used">İşlənmiş</option>
                    <option value="refurbished">Bərpa edilmiş</option>
                  </select>
                </label>
                {["az", "ru", "en"].map((l) => (
                  <label key={l}>
                    Təsvir · {l.toUpperCase()}
                    <textarea
                      name={"desc_" + l}
                      defaultValue={edit?.description?.[l]}
                    />
                  </label>
                ))}
                <details><summary>Əlavə xüsusiyyətlər</summary><p>İstəyə görə yazın. Məsələn, {"{\"Ekran\":\"6.1 düym\"}"}</p><label>
                  Xüsusiyyətlər (JSON)
                  <textarea
                    name="specifications"
                    defaultValue={JSON.stringify(edit?.specifications || {})}
                  />
                </label></details>
                <label>
                  Status
                  <select name="status" defaultValue={edit?.status || "draft"}>
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {statusName[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={(e) => {
                    const f = new FormData(e.currentTarget.form!);
                    setPreview(
                      [
                        f.get("name"),
                        f.get("price") + " ₼",
                        f.get("storage"),
                        f.get("color"),
                        f.get("desc_az"),
                      ].join(" · "),
                    );
                  }}
                >
                  Önbaxış
                </button>
                {preview && <p>{preview}</p>}
                {button}
              </form>
              {edit && (
                <form onSubmit={wrap((f) => save(f, true))}>
                  <h3>Foto əlavə et və ya əvəz et</h3>
                  <input type="hidden" name="id" value={edit.id} />
                  <label>
                    Sıra (0–7)
                    <input
                      type="number"
                      name="index"
                      min="0"
                      max="7"
                      defaultValue={Math.min(edit.product_images.length, 7)}
                      required
                    />
                  </label>
                  <Field
                    name="alt"
                    label="Şəklin təsviri"
                    value={edit.name}
                    required
                  />
                  <input
                    type="file"
                    name="file"
                    required
                    accept="image/jpeg,image/png,image/webp"
                  />
                  {button}
                </form>
              )}
              <button onClick={() => select(null)}>Bağla</button>
            </div>
          )}
          {!sorted.length&&<div className="box"><h3>{d.products.length?"Uyğun məhsul tapılmadı":"İlk məhsulunuzu əlavə edin"}</h3><p>{d.products.length?"Axtarış və status filtrini dəyişin.":"Başlamaq üçün model, qiymət və bir neçə foto kifayətdir."}</p></div>}
          {sorted.map((p) => (
            <article className="tableRow" key={p.slug}>
              <Image
                unoptimized
                src={path(p)}
                alt=""
                className="thumb"
                width={52}
                height={46}
              />
              <span>
                {p.name}
                <small>
                  {" "}
                  · {p.category_id} / {p.brand_id}
                </small>
              </span>
              <b>{p.price} ₼</b>
              <span className={"statusBadge status-"+p.status}>{statusName[p.status]}</span>
              <button
                onClick={() => {
                  select(p.slug);
                  setPreview("");
                  window.scrollTo({ top: 0 });
                }}
              >
                Redaktə
              </button>
              <button
                disabled={busy || p.status === "archived"}
                onClick={() => {
                  if (confirm("Məhsul arxivlənsin?"))
                    void save({ op: "archive", slug: p.slug });
                }}
              >
                Arxivlə
              </button>
            </article>
          ))}
        </>
      )}
      {tab === "import" && (
        <div className="box">
          <h3>CSV / XLSX idxalı</h3>
          <p>
            Yalnız mağazanın öz məlumatlarını daxil edin. Eyni slug mövcud
            məhsulun göstərilən sahələrini yeniləyir. Fotolar ayrı yüklənir.
          </p>
          <a className="textlink" href="/import-template.csv" download>
            CSV şablonu ↓
          </a>
          <button
            onClick={async () => {
              const { Workbook } = (await import("exceljs")).default;
              const w = new Workbook();
              w.addWorksheet("Products").addRow([...columns]);
              const url = URL.createObjectURL(
                new Blob([await w.xlsx.writeBuffer()]),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "products.xlsx";
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            XLSX şablonu ↓
          </button>
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={async (e) => {
              setRows([]);
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const parsed = await parseSheet(f);
                if (
                  parsed.some(
                    (x) =>
                      !d.brands.some((b) => b.slug === x.brand_id) ||
                      !d.categories.some((c) => c.slug === x.category_id) ||
                      x.status === "archived",
                  )
                )
                  throw Error(
                    "Brend və kateqoriya əvvəlcədən yaradılmalıdır. Arxiv idxal edilmir.",
                  );
                setRows(parsed);
                setNotice("Önbaxışı yoxlayın.");
              } catch (err) {
                setNotice(String(err));
              }
            }}
          />
          {rows.map((r) => (
            <p key={String(r.slug)}>
              {String(r.name)} · {String(r.price)} ₼ · {String(r.status)} ·{" "}
              {d.products.some((p) => p.slug === r.slug) ? "Yenilənir" : "Yeni"}
            </p>
          ))}
          {!!rows.length && (
            <button
              className="button primary"
              disabled={busy}
              onClick={async () => {
                if (
                  confirm(rows.length + " sətir saxlanılsın?") &&
                  (await save({ op: "import", rows }))
                )
                  setRows([]);
              }}
            >
              İdxalı təsdiqlə
            </button>
          )}
        </div>
      )}
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
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Bütün statuslar</option>
            {["new", "contacted", "closed"].map((s) => (
              <option key={s} value={s}>
                {statusName[s]}
              </option>
            ))}
          </select>
          {d.requests
            .filter((r) => !filter || r.status === filter)
            .map((r) => (
              <article className="box" key={r.id}>
                <h3>
                  {r.model} · {r.storage}
                </h3>
                <p>
                  {r.name} · {r.phone}
                </p>
                <p>
                  {r.condition} · {r.notes}
                </p>
                <small>{r.created_at.slice(0, 10)}</small>
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
          {!d.requests.length && <div className="box"><h3>Hələ müraciət yoxdur</h3><p>Saytın Trade-in formasından göndərilən cihaz və əlaqə məlumatları burada görünəcək.</p><Link className="textlink" href="/az/trade-in">Trade-in formasına bax ↗</Link></div>}
        </>
      )}
    </>
  );
}
