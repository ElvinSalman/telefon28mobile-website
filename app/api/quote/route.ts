import { z } from "zod";
import { slug } from "@/lib/validation";
import { body } from "@/lib/ingest";
import { publicDb } from "@/lib/db";
import { origin } from "@/lib/config";
export async function POST(req: Request) {
  try {
    const { lines, locale } = z
      .object({
        locale: z.enum(["az", "ru", "en"]),
        lines: z
          .array(
            z.object({
              slug,
              qty: z.number().int().min(1).max(99),
              price: z.number().nonnegative(),
            }),
          )
          .min(1)
          .max(50),
      })
      .parse(await body(req));
    if (new Set(lines.map((l) => l.slug)).size !== lines.length)
      return new Response(null, { status: 400 });
    const db = publicDb();
    const [items, settings] = await Promise.all([
      db
        .from("products")
        .select("slug,name,price,storage,color")
        .in(
          "slug",
          lines.map((x) => x.slug),
        )
        .eq("status", "published"),
      db.from("site_settings").select("whatsapp").eq("id", 1).single(),
    ]);
    if (items.error || settings.error)
      return new Response(null, { status: 503 });
    const messages = [
      {
        az: "Salam, Telefon28Mobile! Saytdan aşağıdakı məhsullarla maraqlanıram:",
        ru: "Здравствуйте, Telefon28Mobile! Меня интересуют следующие товары:",
        en: "Hello Telefon28Mobile! I am interested in these products:",
      }[locale],
    ];
    let cents = 0;
    for (const line of lines) {
      const p = items.data.find((x) => x.slug === line.slug);
      if (!p || Number(p.price) !== line.price)
        return Response.json({ changed: true }, { status: 409 });
      const subtotal = Math.round(Number(p.price) * 100) * line.qty;
      cents += subtotal;
      messages.push(
        [p.name, p.storage, p.color].filter(Boolean).join(" · ") +
          " — " +
          line.qty +
          " × " +
          Number(p.price).toFixed(2) +
          " ₼ = " +
          (subtotal / 100).toFixed(2) +
          " ₼\n" +
          origin +
          "/" +
          locale +
          "/products/" +
          p.slug,
      );
    }
    messages.push(
      { az: "Cəmi", ru: "Итого", en: "Total" }[locale] +
        " " +
        (cents / 100).toFixed(2) +
        " ₼",
    );
    return Response.json(
      {
        url:
          "https://wa.me/" +
          settings.data.whatsapp +
          "?text=" +
          encodeURIComponent(messages.join("\n\n")),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return new Response(null, { status: 400 });
  }
}
