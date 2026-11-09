"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Data, Row } from "./admin-console";
import {
  adminRequest,
  AdminRequestError,
  type AdminFailure,
} from "@/lib/admin-client";
import { normalizeName } from "@/lib/simple-import";
import { slugify, productInput } from "@/lib/validation";
type Photo = { path: string; alt: string; sort_order: number };
type Pending = {
  key: string;
  file: File;
  preview: string;
  alt: string;
  slot?: number;
  done?: boolean;
  error?: string;
};
type Model = {
  name: string;
  price: string;
  brand: string;
  category_id: string;
  storage: string;
  color: string;
  condition: string;
  az: string;
  ru: string;
  en: string;
  status: string;
  featured: boolean;
  slug: string;
  source_url: string;
};
const blank: Model = {
  name: "",
  price: "",
  brand: "",
  category_id: "",
  storage: "",
  color: "",
  condition: "",
  az: "",
  ru: "",
  en: "",
  status: "draft",
  featured: false,
  slug: "",
  source_url: "",
};
const labels: Record<string, string> = {
  draft: "Qaralama",
  published: "Dərc edilib",
  archived: "Arxiv",
};
const imageUrl = (path: string) =>
  process.env.NEXT_PUBLIC_SUPABASE_URL +
  "/storage/v1/object/public/product-images/" +
  path;
export function ProductsPanel({
  data,
  newProduct = false,
  editSlug,
}: {
  data: Data;
  newProduct?: boolean;
  editSlug?: string;
}) {
  const [selected, setSelected] = useState<string | null>(
      editSlug || (newProduct ? "" : null),
    ),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [brand, setBrand] = useState(""),
    [category, setCategory] = useState(""),
    [page, setPage] = useState(1),
    [sort, setSort] = useState("updated"),
    [message, setMessage] = useState("");
  const router = useRouter();
  const rows = data.products
    .filter(
      (p) =>
        (p.name + " " + p.slug + " " + p.brand_id)
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (!status || p.status === status) &&
        (!brand || p.brand_id === brand) &&
        (!category || p.category_id === category),
    )
    .sort((a, b) =>
      sort === "price"
        ? a.price - b.price
        : sort === "name"
          ? a.name.localeCompare(b.name)
          : b.updated_at.localeCompare(a.updated_at),
    );
  const pages = Math.max(1, Math.ceil(rows.length / 20)),
    current = Math.min(page, pages);
  return (
    <>
      <div className="adminToolbar">
        <label>
          Axtar
          <input
            aria-label="Axtar"
            placeholder="Ad, brend və ya slug"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <button className="button primary" onClick={() => setSelected("")}>
          + Yeni məhsul
        </button>
      </div>
      <div className="adminFilters">
        <label>
          Status
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Bütün statuslar</option>
            {Object.entries(labels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Brend
          <select
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Bütün brendlər</option>
            {data.brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kateqoriya
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Bütün kateqoriyalar</option>
            {data.categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.az}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sıralama
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="updated">Son dəyişiklik</option>
            <option value="name">Ad</option>
            <option value="price">Qiymət</option>
          </select>
        </label>
      </div>
      {message && <p role="status">{message}</p>}
      {selected !== null && (
        <ProductEditor
          key={selected || "new"}
          product={data.products.find((p) => p.slug === selected)}
          data={data}
          close={() => setSelected(null)}
        />
      )}
      {!rows.length && (
        <div className="box empty">
          Məhsul tapılmadı. Filtrləri dəyişin və ya ilk məhsulunuzu əlavə edin.
        </div>
      )}
      <div className="ownerProducts">
        {rows.slice((current - 1) * 20, current * 20).map((p) => (
          <article className="ownerProduct" key={p.id}>
            <div className="ownerProductPhoto">
              {p.product_images.length ? (
                <Image
                  unoptimized
                  width={100}
                  height={90}
                  alt=""
                  src={imageUrl(
                    [...p.product_images].sort(
                      (a, b) => a.sort_order - b.sort_order,
                    )[0].path,
                  )}
                />
              ) : (
                <span>Foto yoxdur</span>
              )}
            </div>
            <div>
              <h3>{p.name}</h3>
              <p>
                {data.brands.find((b) => b.slug === p.brand_id)?.name} ·{" "}
                {data.categories.find((c) => c.slug === p.category_id)?.az}
              </p>
              <small>
                {new Date(p.updated_at).toLocaleString("az-AZ", {
                  timeZone: "Asia/Baku",
                })}
              </small>
            </div>
            <strong>{Number(p.price).toFixed(2)} ₼</strong>
            <span className={"statusBadge status-" + p.status}>
              {labels[p.status]}
            </span>
            <div className="ownerActions">
              <button
                className="button outline"
                onClick={() => {
                  setSelected(p.slug);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Redaktə et
              </button>
              <button
                className="button outline"
                disabled={p.status === "archived"}
                onClick={async () => {
                  if (!confirm("Məhsul arxivlənsin? Saytda görünməyəcək."))
                    return;
                  try {
                    await adminRequest({ op: "archive", slug: p.slug });
                    setMessage("Məhsul arxivləndi.");
                    router.refresh();
                  } catch (e) {
                    setMessage(e instanceof Error ? e.message : "Xəta");
                  }
                }}
              >
                Arxivlə
              </button>
            </div>
          </article>
        ))}
      </div>
      <nav className="pagination" aria-label="Məhsul səhifələri">
        <button disabled={current === 1} onClick={() => setPage(current - 1)}>
          Əvvəlki
        </button>
        <span>
          {current} / {pages} · {rows.length} məhsul
        </span>
        <button
          disabled={current === pages}
          onClick={() => setPage(current + 1)}
        >
          Növbəti
        </button>
      </nav>
    </>
  );
}
function ProductEditor({
  product,
  data,
  close,
}: {
  product?: Row;
  data: Data;
  close: () => void;
}) {
  const router = useRouter();
  const [model, setModel] = useState<Model>(
    product
      ? {
          name: product.name,
          price: String(product.price),
          brand:
            data.brands.find((b) => b.slug === product.brand_id)?.name || "",
          category_id: product.category_id,
          storage: product.storage,
          color: product.color,
          condition: product.condition || "",
          az: product.description?.az || "",
          ru: product.description?.ru || "",
          en: product.description?.en || "",
          status: product.status,
          featured: product.featured,
          slug: product.slug,
          source_url: product.source_url || "",
        }
      : { ...blank },
  );
  const [specs, setSpecs] = useState<[string, string][]>(
    Object.entries(product?.specifications || {}),
  );
  const [photos, setPhotos] = useState<Photo[]>(product?.product_images || []),
    [pending, setPending] = useState<Pending[]>([]),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState<AdminFailure | null>(null);
  const [cleanupPending, setCleanupPending] = useState(false);
  const [hasSaved, setHasSaved] = useState(!!product);
  const saved = useRef(
      product
        ? { id: product.id, slug: product.slug, updated_at: product.updated_at }
        : null,
    ),
    urls = useRef<string[]>([]);
  useEffect(
    () => () => urls.current.forEach((url) => URL.revokeObjectURL(url)),
    [],
  );
  const update = (key: keyof Model, value: string | boolean) =>
    setModel((m) => ({ ...m, [key]: value }));
  const fail = (e: unknown) =>
    setError(
      e instanceof AdminRequestError
        ? e.info
        : {
            code: "CLIENT",
            message: e instanceof Error ? e.message : "Əməliyyat tamamlanmadı.",
          },
    );
  const field = (
    key: keyof Model,
    label: string,
    options: { required?: boolean; type?: string; list?: string } = {},
  ) => (
    <label>
      {label}
      <input
        name={key}
        value={String(model[key])}
        onChange={(e) => update(key, e.target.value)}
        aria-invalid={!!error?.fieldErrors?.[key]}
        {...options}
      />
      {error?.fieldErrors?.[key] && (
        <small className="fieldError">{error.fieldErrors[key]}</small>
      )}
    </label>
  );
  function choose(files: FileList | null, slot?: number) {
    if (!files) return;
    setError(null);
    const list = [...files];
    if (
      (slot === undefined
        ? photos.length + pending.filter((p) => !p.done).length
        : photos.length - 1) +
        list.length >
      8
    ) {
      fail(Error("Maksimum 8 foto seçin."));
      return;
    }
    if (
      list.some(
        (f) =>
          f.size > 4194304 ||
          !["image/jpeg", "image/png", "image/webp"].includes(f.type),
      )
    ) {
      fail(
        Error("Hər foto JPG/PNG/WebP olmalı və 4 MB-dan böyük olmamalıdır."),
      );
      return;
    }
    setPending((old) => [
      ...old,
      ...list.map((file) => {
        const preview = URL.createObjectURL(file);
        urls.current.push(preview);
        return {
          key: crypto.randomUUID(),
          file,
          preview,
          alt: model.name,
          slot,
        };
      }),
    ]);
  }
  async function uploadAll(id: string) {
    let occupied = new Set(photos.map((p) => p.sort_order));
    for (const item of pending.filter((p) => !p.done)) {
      const slot =
        item.slot ??
        Array.from({ length: 8 }, (_, i) => i).find((i) => !occupied.has(i));
      if (slot === undefined) throw Error("Boş foto yeri yoxdur.");
      const form = new FormData();
      form.set("id", id);
      form.set("index", String(slot));
      form.set("alt", item.alt.trim() || model.name);
      form.set("file", item.file);
      form.set(
        "expected_path",
        photos.find((p) => p.sort_order === slot)?.path || "",
      );
      try {
        const result = await adminRequest<{
          image: Photo;
          cleanupPending?: boolean;
        }>(form, true);
        setCleanupPending(!!result.cleanupPending);
        occupied = new Set([...occupied, slot]);
        setPhotos((p) => [
          ...p.filter((x) => x.sort_order !== slot),
          result.image,
        ]);
        setPending((p) =>
          p.map((x) =>
            x.key === item.key ? { ...x, done: true, error: undefined } : x,
          ),
        );
      } catch (e) {
        setPending((p) =>
          p.map((x) =>
            x.key === item.key
              ? { ...x, error: "Yüklənmədi — təkrar cəhd edin" }
              : x,
          ),
        );
        throw e;
      }
    }
  }
  async function resolveBrand() {
    const result = await adminRequest<{ slug: string }>({
      op: "brand",
      name: model.brand,
    });
    return result.slug;
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice("");
    try {
      const brand = data.brands.find(
        (b) => normalizeName(b.name) === normalizeName(model.brand),
      );
      const record = {
        slug:
          saved.current?.slug ||
          model.slug ||
          slugify(
            [model.name, model.storage, model.color].filter(Boolean).join(" "),
          ),
        name: model.name,
        price: Number(model.price.replace(",", ".")),
        brand_id: brand?.slug || slugify(model.brand) || "brend",
        category_id: model.category_id,
        storage: model.storage,
        color: model.color,
        condition: model.condition || null,
        description: { az: model.az, ru: model.ru, en: model.en },
        specifications: Object.fromEntries(
          specs.filter(([k]) => k.trim()).map(([k, v]) => [k.trim(), v]),
        ),
        status: model.status,
        featured: model.featured,
        source_url: model.source_url || null,
      };
      const parsed = productInput.safeParse(record);
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parsed.error.issues)
          fieldErrors[String(issue.path[0])] =
            (
              {
                price:
                  "0 və ya daha böyük, ən çox 2 onluq rəqəmli qiymət yazın.",
                source_url: "https:// ilə başlayan düzgün keçid yazın.",
                slug: "Kiçik latın hərfləri, rəqəmlər və defis istifadə edin.",
              } as Record<string, string>
            )[String(issue.path[0])] || "Bu sahəni yoxlayın.";
        throw new AdminRequestError({
          code: "VALIDATION",
          message: "Qeyd olunan sahələri düzəldin.",
          fieldErrors,
        });
      }
      if (!model.brand.trim()) throw Error("Brendi yazın.");
      record.brand_id = brand?.slug || (await resolveBrand());
      const withPhotos = pending.some((p) => !p.done);
      const desired = record.status;
      const result = await adminRequest<{
        product: { id: string; slug: string; updated_at: string };
        affected: number;
      }>({
        op: "product",
        id: saved.current?.id,
        expected_updated_at: saved.current?.updated_at,
        record: { ...record, status: withPhotos ? "draft" : desired },
      });
      saved.current = result.product;
      setHasSaved(true);
      update("slug", result.product.slug);
      if (withPhotos) {
        setNotice("Fotolar yüklənir. Tamamlanana qədər məhsul qaralamadır.");
        await uploadAll(result.product.id);
        const published = await adminRequest<{
          product: { id: string; slug: string; updated_at: string };
        }>({
          op: "product",
          id: saved.current.id,
          expected_updated_at: saved.current.updated_at,
          record: { ...record, slug: saved.current.slug, status: desired },
        });
        saved.current = published.product;
      }
      setPending((p) => p.filter((x) => !x.done));
      setNotice("Saxlanıldı. Məhsul məlumatları yeniləndi.");
      router.refresh();
    } catch (e) {
      fail(e);
      setNotice(
        "Tamamlanmadı. Yazdıqlarınız və uğurlu fotolar saxlanılıb; xətanı düzəldib təkrar cəhd edin.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function photoAction(value: unknown, after: () => void) {
    setBusy(true);
    setError(null);
    try {
      const response = await adminRequest<{ cleanupPending?: boolean }>(value);
      after();
      setCleanupPending(!!response.cleanupPending);
      setNotice("Foto dəyişikliyi saxlanıldı. Əlavə Saxla tələb olunmur.");
      router.refresh();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="box productEditor">
      <div className="sectionHead">
        <h2>{product ? "Məhsulu redaktə et" : "Yeni məhsul"}</h2>
        <button type="button" onClick={close}>
          Bağla
        </button>
      </div>
      {error && (
        <div role="alert" className="adminError">
          <strong>{error.message}</strong>
          {error.requestId && <small>Sorğu: {error.requestId}</small>}
          {error.code === "CONFLICT" && (
            <p>
              Başqa pəncərədə edilmiş dəyişiklikləri yoxlamaq üçün redaktəni
              bağlayıb yenidən açın. Bu formadakı yazılar hələ saxlanır.
            </p>
          )}
        </div>
      )}
      <p role="status">{busy ? notice || "Saxlanılır…" : notice}</p>
      {cleanupPending && (
        <div role="alert" className="adminError">
          Foto kataloqu yeniləndi. Köhnə faylın təmizlənməsi növbədədir.
          <button
            type="button"
            onClick={() => void photoAction({ op: "image-cleanup" }, () => {})}
          >
            Fayl təmizlənməsini təkrar et
          </button>
        </div>
      )}
      <form onSubmit={submit}>
        <fieldset disabled={busy}>
          <legend>1 · Məhsul məlumatları</legend>
          <div className="editorGrid">
            {field("name", "Ad və model", { required: true })}
            {field("price", "Qiymət (AZN)", { required: true })}
            <label>
              Brend
              <input
                name="brand"
                list="owner-brand-list"
                value={model.brand}
                required
                onChange={(e) => update("brand", e.target.value)}
              />
              <datalist id="owner-brand-list">
                {data.brands.map((b) => (
                  <option key={b.slug} value={b.name} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={async () => {
                  setBusy(true);
                  setError(null);
                  try {
                    await resolveBrand();
                    setNotice("Brend hazırdır.");
                    router.refresh();
                  } catch (e) {
                    fail(e);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                + Yeni brend
              </button>
              <small>Siyahıdan seçin və ya yeni brendin adını yazın.</small>
            </label>
            <label>
              Kateqoriya
              <input
                list="owner-category-list"
                value={
                  data.categories.find((c) => c.slug === model.category_id)
                    ?.az || model.category_id
                }
                onChange={(e) =>
                  update(
                    "category_id",
                    data.categories.find(
                      (c) =>
                        normalizeName(c.az) === normalizeName(e.target.value),
                    )?.slug || e.target.value,
                  )
                }
                required
                name="category_id"
              />
              <datalist id="owner-category-list">
                {data.categories
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.slug} value={c.az} />
                  ))}
              </datalist>
              {error?.fieldErrors?.category_id && (
                <small className="fieldError">
                  Kateqoriyanı siyahıdan seçin.
                </small>
              )}
            </label>
            {field("storage", "Yaddaş")}
            {field("color", "Rəng")}
            <label>
              Vəziyyət
              <select
                name="condition"
                value={model.condition}
                onChange={(e) => update("condition", e.target.value)}
              >
                <option value="">Göstərilməyib</option>
                <option value="new">Yeni</option>
                <option value="used">İşlənmiş</option>
                <option value="refurbished">Bərpa edilmiş</option>
              </select>
            </label>
          </div>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>2 · Təsvir və xüsusiyyətlər</legend>
          <p>RU/EN tərcüməsi yoxdursa, saytda AZ təsviri göstərilir.</p>
          <div className="editorGrid">
            {(["az", "ru", "en"] as const).map((l) => (
              <label key={l}>
                Təsvir · {l.toUpperCase()}
                <textarea
                  name={"desc_" + l}
                  value={model[l]}
                  onChange={(e) => update(l, e.target.value)}
                />
              </label>
            ))}
          </div>
          {specs.map(([k, v], i) => (
            <div className="specRow" key={i}>
              <input
                aria-label={"Xüsusiyyət " + (i + 1)}
                placeholder="Məsələn, Ekran"
                value={k}
                onChange={(e) =>
                  setSpecs((s) =>
                    s.map((x, j) => (i === j ? [e.target.value, x[1]] : x)),
                  )
                }
              />
              <input
                aria-label={"Dəyər " + (i + 1)}
                placeholder="6.1 düym"
                value={v}
                onChange={(e) =>
                  setSpecs((s) =>
                    s.map((x, j) => (i === j ? [x[0], e.target.value] : x)),
                  )
                }
              />
              <button
                type="button"
                onClick={() => setSpecs((s) => s.filter((_, j) => j !== i))}
              >
                Sil
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSpecs((s) => [...s, ["", ""]])}
          >
            + Xüsusiyyət
          </button>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>3 · Məhsul fotoları</legend>
          <p>
            İlk saxlamadan əvvəl seçə bilərsiniz. Maksimum 8 foto, hər biri 4
            MB. İlk foto əsas fotodur.
          </p>
          <label>
            Fotoları seç
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                choose(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <div className="pendingPhotos">
            {pending.map((p, i) => (
              <figure key={p.key}>
                <Image
                  unoptimized
                  src={p.preview}
                  alt={p.alt}
                  width={130}
                  height={110}
                />
                <label>
                  Foto təsviri
                  <input
                    value={p.alt}
                    onChange={(e) =>
                      setPending((list) =>
                        list.map((x) =>
                          x.key === p.key ? { ...x, alt: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <figcaption>
                  {p.done ? "Yükləndi" : p.error || p.file.name}
                </figcaption>
                <button
                  type="button"
                  disabled={i === 0 || p.done}
                  onClick={() =>
                    setPending((list) => {
                      const next = [...list];
                      [next[i - 1], next[i]] = [next[i], next[i - 1]];
                      return next;
                    })
                  }
                >
                  Əvvələ
                </button>
                <button
                  type="button"
                  disabled={p.done}
                  onClick={() =>
                    setPending((list) => list.filter((x) => x.key !== p.key))
                  }
                >
                  Seçimdən çıxar
                </button>
              </figure>
            ))}
          </div>
          {hasSaved && pending.some((p) => !p.done) && (
            <button
              type="button"
              className="button outline"
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  await uploadAll(saved.current!.id);
                  setPending((p) => p.filter((x) => !x.done));
                  setNotice("Fotolar əlavə edildi.");
                  router.refresh();
                } catch (e) {
                  fail(e);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Foto əlavə et
            </button>
          )}
        </fieldset>
        <fieldset disabled={busy}>
          <legend>4 · Dərc statusu</legend>
          <label className="featuredToggle">
            <input
              type="checkbox"
              role="switch"
              checked={model.featured}
              onChange={(e) => update("featured", e.target.checked)}
            />
            <span>
              Ana səhifədə seçilmiş məhsullar arasında göstər
              <small>Seçilmiş məhsullar ana səhifədə önə çıxır.</small>
            </span>
          </label>
          <label>
            Status
            <select
              name="status"
              value={model.status}
              onChange={(e) => update("status", e.target.value)}
            >
              {Object.entries(labels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <small>Qaralama və arxiv məhsullar müştərilərə göstərilmir.</small>
          <details>
            <summary>Əlavə texniki məlumatlar</summary>
            <label>
              Slug
              <input
                name="slug"
                value={model.slug}
                readOnly={hasSaved}
                placeholder="Addan avtomatik yaranır"
                onChange={(e) => update("slug", e.target.value)}
              />
            </label>
            {field("source_url", "Mənbə keçidi")}
            {product?.source_verified_at && (
              <p>
                Mənbə yoxlanılıb: {product.source_verified_at.slice(0, 10)}{" "}
                (yalnız oxumaq üçün)
              </p>
            )}
          </details>
          <button className="button primary" type="submit">
            {busy ? "Saxlanılır…" : "Saxla"}
          </button>
        </fieldset>
      </form>
      {!!photos.length && (
        <section>
          <h3>Saxlanmış fotolar</h3>
          <p>Bu düymələr dərhal işləyir; ayrıca Saxla düyməsi lazım deyil.</p>
          <div className="imageManager">
            {[...photos]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((im) => (
                <figure key={im.path}>
                  <Image
                    unoptimized
                    src={imageUrl(im.path)}
                    alt={im.alt}
                    width={160}
                    height={120}
                  />
                  <figcaption>
                    {im.sort_order === 0
                      ? "Əsas şəkil"
                      : "Foto " + (im.sort_order + 1)}
                    <button
                      type="button"
                      disabled={busy || im.sort_order === 0}
                      onClick={() =>
                        void photoAction(
                          {
                            op: "image-move",
                            product: saved.current!.id,
                            from: im.sort_order,
                            to: 0,
                          },
                          () =>
                            setPhotos((p) =>
                              p.map((x) => ({
                                ...x,
                                sort_order:
                                  x.sort_order === 0
                                    ? im.sort_order
                                    : x.sort_order === im.sort_order
                                      ? 0
                                      : x.sort_order,
                              })),
                            ),
                        )
                      }
                    >
                      Əsas şəkil et
                    </button>
                    <label className="replacePhoto">
                      Əvəz et
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          choose(e.target.files, im.sort_order);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (confirm("Bu foto silinsin?"))
                          void photoAction(
                            {
                              op: "image-delete",
                              product: saved.current!.id,
                              index: im.sort_order,
                              expected_path: im.path,
                            },
                            () =>
                              setPhotos((p) =>
                                p.filter((x) => x.path !== im.path),
                              ),
                          );
                      }}
                    >
                      Fotonu sil
                    </button>
                  </figcaption>
                </figure>
              ))}
          </div>
        </section>
      )}
    </section>
  );
}
