import Papa from "papaparse";
import { slugify } from "./validation";
export const simpleColumns = [
  "Məhsulun adı",
  "Qiymət (AZN)",
  "Brend",
  "Yaddaş",
  "Rəng",
  "Təsvir",
] as const;
export const normalizeName = (s: string) =>
  s
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\u0307/g, "");
export type SimpleRow = {
  row: number;
  name: string;
  price: number;
  brand: string;
  storage: string;
  color: string;
  description: string;
  category: string;
  target_id?: string;
  expected_updated_at?: string;
};
export const importIdentity = (
  r: Pick<SimpleRow, "name" | "brand" | "storage" | "color">,
) => JSON.stringify([r.name, r.brand, r.storage, r.color].map(normalizeName));
export function categoryGuess(name: string): {
  slug: string;
  confidence: string;
} {
  const n = normalizeName(name);
  const rules: [string, RegExp][] = [
    ["tablet", /ipad|tablet|galaxy tab|redmi pad|honor pad/],
    ["laptop", /macbook|laptop|noutbuk|notebook/],
    ["watch", /watch|smart saat/],
    ["audio", /airpods|headphone|earbud|qulaql/],
    ["gaming", /playstation|xbox|nintendo|console/],
    ["home-appliances", /dyson|dreame|vacuum|tozsoran/],
    ["accessories", /adapter|cable|charger|case|pitaka|kabro/],
    ["phone", /iphone|galaxy [saz]|redmi|smartphone/],
    ["other", /camera|canon|osmo|ray.?ban/],
  ];
  const slug = rules.find(([, rule]) => rule.test(n))?.[0] || "";
  return {
    slug,
    confidence: slug ? "Təklif — təsdiqləyin" : "Kateqoriya seçilməlidir",
  };
}
export function derivedSlug(r: SimpleRow) {
  return (
    slugify([r.name, r.storage, r.color].filter(Boolean).join(" "))
      .slice(0, 140)
      .replace(/-$/g, "") || "mehsul"
  );
}
export function parsePrice(value: string, row: number) {
  const v = value.trim().replace(/\s/g, "").replace(",", ".");
  if (
    !/^\d+(\.\d{1,2})?$/.test(v) ||
    !Number.isFinite(Number(v)) ||
    Number(v) > 9999999999
  )
    throw Error(
      `Sətir ${row}, sütun 2 (Qiymət): 0 və ya daha böyük, maksimum iki onluq rəqəmli AZN qiyməti yazın.`,
    );
  return Number(v);
}
export async function parseSimpleSheet(file: File): Promise<SimpleRow[]> {
  if (file.size > 2 * 1024 * 1024) throw Error("Fayl 2 MB-dan böyükdür.");
  let table: string[][];
  if (file.name.toLowerCase().endsWith(".csv")) {
    const result = Papa.parse<string[]>(
      (await file.text()).replace(/^\uFEFF/, ""),
      { skipEmptyLines: false },
    );
    if (result.errors.length)
      throw Error(
        "CSV faylı düzgün deyil: sətir " + ((result.errors[0].row || 0) + 1),
      );
    table = result.data;
  } else if (file.name.toLowerCase().endsWith(".xlsx")) {
    try {
      const { Workbook } = (await import("exceljs")).default;
      const book = new Workbook();
      await book.xlsx.load(await file.arrayBuffer());
      const sheet = book.worksheets[0];
      if (
        !sheet ||
        sheet.actualRowCount > 201 ||
        sheet.rowCount > 10000 ||
        sheet.columnCount > 6
      )
        throw Error(
          "İlk vərəqdə yalnız 6 sütun və maksimum 200 məhsul olmalıdır.",
        );
      table = [];
      sheet.eachRow((row, n) => {
        const values: string[] = [];
        for (let c = 1; c <= 6; c++) {
          const cell = row.getCell(c);
          if (cell.formula)
            throw Error(
              `Sətir ${n}, sütun ${c}: formul deyil, adi dəyər yazın.`,
            );
          values.push(cell.text.trim());
        }
        table[n - 1] = values;
      });
    } catch (error) {
      throw Error(
        error instanceof Error ? error.message : "XLSX faylı oxunmadı.",
      );
    }
  } else throw Error("CSV və ya XLSX faylı seçin.");
  if (
    table[0]?.length !== 6 ||
    simpleColumns.some((c, i) => table[0][i]?.trim() !== c)
  )
    throw Error("Şablonun altı Azərbaycan dilində sütun başlığını dəyişməyin.");
  if (
    table.slice(1).filter((v) => v?.some((x) => x.trim())).length < 1 ||
    table.slice(1).filter((v) => v?.some((x) => x.trim())).length > 200
  )
    throw Error("1–200 məhsul sətri tələb olunur.");
  const seen = new Set<string>();
  return table
    .slice(1)
    .map((v, i) => ({ v, row: i + 2 }))
    .filter((x) => x.v?.some((v) => v.trim()))
    .map(({ v, row }) => {
      if (v.length !== 6) throw Error(`Sətir ${row}: 6 sütun tələb olunur.`);
      const limits = [160, 30, 160, 80, 80, 4000];
      v = v.map((x) => x.trim().replace(/\r\n/g, "\n"));
      for (let c = 0; c < 6; c++) {
        if (v[c].length > limits[c] || ([0, 2].includes(c) && !v[c]))
          throw Error(
            `Sətir ${row}, sütun ${c + 1} (${simpleColumns[c]}): boş və ya həddən uzun məlumat.`,
          );
      }
      const result: SimpleRow = {
        row,
        name: v[0],
        price: parsePrice(v[1], row),
        brand: v[2].replace(/\s+/g, " "),
        storage: v[3],
        color: v[4],
        description: v[5],
        category: categoryGuess(v[0]).slug,
      };
      const key = importIdentity(result);
      if (seen.has(key))
        throw Error(`Sətir ${row}: eyni ad/brend/yaddaş/rəng təkrar olunur.`);
      seen.add(key);
      return result;
    });
}
