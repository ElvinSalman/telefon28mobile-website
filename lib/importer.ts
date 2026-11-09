import Papa from "papaparse";
import { productInput } from "./validation";
export const columns = [
  "slug",
  "name",
  "brand_id",
  "category_id",
  "price",
  "storage",
  "color",
  "status",
] as const;
export function suggestCategory(name: string) {
  const n=name.toLowerCase();
  const rules:[string,RegExp][]=[["tablet",/ipad|tablet|galaxy tab|redmi pad|honor pad/],["laptop",/macbook|laptop|noutbuk|notebook/],["watch",/watch|saat/],["audio",/airpods|headphone|earbud|qulaql/],["gaming",/playstation|xbox|nintendo|console/],["home-appliances",/dyson|dreame|vacuum|tozsoran/],["accessories",/adapter|cable|charger|case|pitaka|kabro/],["phone",/iphone|galaxy|redmi|smartphone/],["other",/camera|canon|osmo|ray.?ban/]];
  return rules.find(([,re])=>re.test(n))?.[0] || "";
}
export async function parseSheet(file: File, suggest = false) {
  if (file.size > 2 * 1024 * 1024) throw Error("Fayl 2 MB-dan böyükdür.");
  let rows: Record<string, string>[];
  if (file.name.toLowerCase().endsWith(".csv")) {
    const p = Papa.parse<Record<string, string>>(
      (await file.text()).replace(/^\uFEFF/, ""),
      {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (s) => s.trim(),
      },
    );
    if (p.errors.length) throw Error("CSV: " + p.errors[0].message);
    rows = p.data;
  } else if (file.name.toLowerCase().endsWith(".xlsx")) {
    const { Workbook } = (await import("exceljs")).default;
    const book = new Workbook();
    await book.xlsx.load(await file.arrayBuffer());
    const sheet = book.worksheets[0];
    if (!sheet || sheet.actualRowCount > 201 || sheet.columnCount > 20)
      throw Error("Cədvəl ölçüsü uyğun deyil.");
    const header = columns.map((_, i) =>
      sheet
        .getRow(1)
        .getCell(i + 1)
        .text.trim(),
    );
    rows = [];
    sheet.eachRow((row, n) => {
      if (n > 1)
        rows.push(
          Object.fromEntries(
            header.map((k, i) => [k, row.getCell(i + 1).text.trim()]),
          ),
        );
    });
  } else throw Error("CSV və ya XLSX seçin.");
  if (!rows.length || rows.length > 200) throw Error("1–200 sətir seçin.");
  const seen = new Set<string>();
  return rows.map((row, i) => {
    if (columns.some((k) => !(k in row)))
      throw Error("Şablon sütunları tələb olunur.");
    const suggested = suggest && !row.category_id.trim() ? suggestCategory(row.name) : "";
    const parsed = productInput.safeParse({
      ...row,
      category_id: row.category_id || suggested,
      price: row.price.trim() === "" ? NaN : Number(row.price),
      status: row.status || "draft",
    });
    if (!parsed.success || seen.has(row.slug))
      throw Error("Sətir " + (i + 2) + ": yanlış məlumat və ya təkrar slug.");
    seen.add(row.slug);
    const result: Record<string, unknown> = Object.fromEntries(columns.map((k) => [k, parsed.data[k]]));
    if(suggested) result.category_suggested=true;
    return result;
  });
}
