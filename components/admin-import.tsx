"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Data } from "./admin-console";
import {
  parseSimpleSheet,
  simpleColumns,
  categoryGuess,
  normalizeName,
  importIdentity,
  derivedSlug,
  type SimpleRow,
} from "@/lib/simple-import";
import { adminRequest, AdminRequestError } from "@/lib/admin-client";
export function SimpleImportPanel({ data }: { data: Data }) {
  const [rows, setRows] = useState<SimpleRow[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [results, setResults] = useState<
      { id: string; slug: string; new: boolean }[]
    >([]);
  const router = useRouter();
  const matches = (r: SimpleRow) => {
    const key = importIdentity(r);
    const keyed = data.products.filter((p) => p.import_key === key);
    if (keyed.length) return keyed;
    const brands = data.brands
      .filter((b) => normalizeName(b.name) === normalizeName(r.brand))
      .map((b) => b.slug);
    return data.products.filter(
      (p) =>
        normalizeName(p.name) === normalizeName(r.name) &&
        brands.includes(p.brand_id) &&
        normalizeName(p.storage) === normalizeName(r.storage) &&
        normalizeName(p.color) === normalizeName(r.color),
    );
  };
  function edit(index: number, change: Partial<SimpleRow>) {
    setConfirmed(false);
    setRows((list) =>
      list.map((r, i) =>
        i === index
          ? {
              ...r,
              ...change,
              target_id: change.target_id,
              expected_updated_at: undefined,
            }
          : r,
      ),
    );
  }
  const problems = rows.flatMap((r) =>
    !r.name.trim() || !r.brand.trim()
      ? ["Sətir " + r.row + ": ad və brend tələb olunur."]
      : !Number.isFinite(r.price) ||
          r.price < 0 ||
          r.price > 9999999999 ||
          Math.abs(r.price * 100 - Math.round(r.price * 100)) > 0.00001
        ? ["Sətir " + r.row + ", sütun 2: düzgün AZN qiyməti yazın."]
        : !r.category
          ? ["Sətir " + r.row + ": kateqoriyanı seçin."]
          : matches(r).length > 1 && !r.target_id
            ? ["Sətir " + r.row + ": hansı məhsulun yenilənəcəyini seçin."]
            : [],
  );
  return (
    <section className="box simpleImport">
      <h2>Excel / CSV ilə məhsul əlavə edin</h2>
      <p>
        Altı sadə sütunu doldurun. Brendlər təsdiqdən sonra yaradılır. Yeni
        məhsullar dərhal dərc edilir; fotosu olmayanlarda “Foto əlavə edilməyib”
        göstərilir.
      </p>
      <div className="contactActions">
        <a className="button outline" href="/import-template.csv" download>
          CSV şablonu ↓
        </a>
        <button
          className="button outline"
          onClick={async () => {
            const { Workbook } = (await import("exceljs")).default;
            const book = new Workbook();
            const sheet = book.addWorksheet("Məhsullar");
            sheet.addRow([...simpleColumns]);
            sheet.columns.forEach((c) => (c.width = 24));
            const help = book.addWorksheet("Təlimat və nümunə");
            help.addRow([
              "Yalnız Məhsullar vərəqi idxal edilir. Bu vərəq idxal edilmir.",
            ]);
            help.addRow([
              "Ad, qiymət və brend tələb olunur. Qiymət 1234.50 və ya 1234,50 formatında.",
            ]);
            help.addRow(["UYDURMA NÜMUNƏ — real inventar deyil"]);
            help.addRow([...simpleColumns]);
            help.addRow([
              "Nümunə Telefon",
              123,
              "Nümunə Brend",
              "128 GB",
              "Qara",
              "Yalnız nümunə",
            ]);
            help.getColumn(1).width = 80;
            const url = URL.createObjectURL(
              new Blob([new Uint8Array(await book.xlsx.writeBuffer())]),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = "telefon28-sade-sablon.xlsx";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Excel şablonu ↓
        </button>
      </div>
      <label>
        Faylı seçin
        <input
          aria-label="İdxal faylı"
          type="file"
          accept=".csv,.xlsx"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setRows([]);
            setError("");
            setNotice("");
            setResults([]);
            setConfirmed(false);
            try {
              setRows(await parseSimpleSheet(file));
              setNotice(
                "Önbaxışı yoxlayın. Yeni məhsullar təsdiqdən sonra dərc ediləcək.",
              );
            } catch (e) {
              setError(e instanceof Error ? e.message : "Fayl oxunmadı.");
            }
          }}
        />
      </label>
      {error && (
        <p role="alert" className="adminError">
          {error}
        </p>
      )}
      <p role="status">
        {busy ? "İdxal edilir… Pəncərəni bağlamayın." : notice}
      </p>
      <div className="importPreview">
        {rows.map((r, i) => {
          const found = matches(r),
            target = data.products.find(
              (p) => p.id === (r.target_id || found[0]?.id),
            ),
            brand = data.brands.find(
              (b) => normalizeName(b.name) === normalizeName(r.brand),
            );
          return (
            <fieldset key={r.row} disabled={busy}>
              <legend>
                Sətir {r.row} · {target ? "Yenilənir" : "Yeni məhsul"}
              </legend>
              <div className="editorGrid">
                <label>
                  Məhsulun adı
                  <input
                    value={r.name}
                    onChange={(e) => edit(i, { name: e.target.value })}
                  />
                </label>
                <label>
                  Qiymət (AZN)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={Number.isNaN(r.price) ? "" : r.price}
                    onChange={(e) =>
                      edit(i, {
                        price:
                          e.target.value === "" ? NaN : Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Brend
                  <input
                    value={r.brand}
                    onChange={(e) => edit(i, { brand: e.target.value })}
                  />
                  <small>
                    {brand ? "Mövcud brend" : "Yeni brend yaradılacaq"}
                  </small>
                </label>
                <label>
                  Yaddaş
                  <input
                    value={r.storage}
                    onChange={(e) => edit(i, { storage: e.target.value })}
                  />
                </label>
                <label>
                  Rəng
                  <input
                    value={r.color}
                    onChange={(e) => edit(i, { color: e.target.value })}
                  />
                </label>
                <label>
                  Kateqoriya
                  <select
                    value={r.category}
                    onChange={(e) => edit(i, { category: e.target.value })}
                  >
                    <option value="">Seçin</option>
                    {data.categories
                      .filter((c) => c.active)
                      .map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.az}
                        </option>
                      ))}
                  </select>
                  <small>{categoryGuess(r.name).confidence}</small>
                </label>
              </div>
              <label>
                Təsvir
                <textarea
                  value={r.description}
                  onChange={(e) => edit(i, { description: e.target.value })}
                />
              </label>
              {found.length > 1 && (
                <label>
                  Oxşar qeydlər var — yenilənəcək məhsulu seçin
                  <select
                    value={r.target_id || ""}
                    onChange={(e) => edit(i, { target_id: e.target.value })}
                  >
                    <option value="">Seçin</option>
                    {found.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.slug} · {p.price} ₼
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <small>
                Keçid: {target?.slug || derivedSlug(r)} ·{" "}
                {target?.product_images.length
                  ? `${target.product_images.length} foto saxlanılır`
                  : "Foto yoxdur — sonra əlavə edin"}
              </small>
            </fieldset>
          );
        })}
      </div>
      {!!rows.length && (
        <>
          <p>
            {rows.length} sətir. Boş təsvir mövcud təsviri silmir. Mövcud
            fotolar və cədvəldə olmayan məhsullar qorunur.
          </p>
          {problems.map((p) => (
            <p key={p} className="fieldError">
              {p}
            </p>
          ))}
          <label className="featuredToggle">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              Qiymətləri, yeni brendləri və kateqoriyaları yoxladım. Yeni
              məhsulların dərcini təsdiqləyirəm.
            </span>
          </label>
          <button
            className="button primary"
            disabled={busy || !confirmed || !!problems.length}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const submitted = rows.map((r) => {
                  const found = matches(r),
                    target = data.products.find(
                      (p) => p.id === (r.target_id || found[0]?.id),
                    );
                  return {
                    ...r,
                    target_id: target?.id,
                    expected_updated_at: target?.updated_at,
                  };
                });
                const response = await adminRequest<{
                  items: { id: string; slug: string; new: boolean }[];
                  success: number;
                }>({ op: "import", rows: submitted });
                setResults(response.items);
                setRows([]);
                setNotice(
                  `${response.success} uğurlu, 0 xəta. ${response.items.filter((x) => x.new).length} yeni məhsul.`,
                );
                router.refresh();
              } catch (e) {
                setError(
                  e instanceof AdminRequestError
                    ? e.message +
                        " Bütün əməliyyat geri qaytarıldı; heç bir sətir qismən idxal edilmədi."
                    : "İdxal tamamlanmadı. Yenidən cəhd edin.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            İdxalı təsdiqlə
          </button>
        </>
      )}
      {!!results.length && (
        <div className="box">
          <h3>Şəkilləri əlavə et</h3>
          <p>Məhsullar saxlanıldı. Foto əlavə etmək üçün məhsulu açın.</p>
          {results.map((r) => (
            <p key={r.id}>
              <Link href={"/admin/products?edit=" + encodeURIComponent(r.slug)}>
                {r.slug} → Şəkilləri əlavə et
              </Link>
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
