import { readPages } from "@/lib/read-pages";
import { redirect, notFound } from "next/navigation";
import { adminDb } from "@/lib/db";
import Link from "next/link";
import { logout } from "../actions";
import { AdminConsole } from "@/components/admin-console";
const sections = {
  overview: "İcmal",
  products: "Məhsullar",
  categories: "Kateqoriyalar",
  locations: "Filiallar",
  settings: "Ayarlar",
  "trade-in": "Trade-in",
  analytics: "Analitika",
  import: "İdxal",
};
export default async function Admin({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const db = await adminDb();
  if (!db) redirect("/admin/login");
  const route = (await params).section || [];
  const tab = route[0] || "overview";
  if (route.length > 1 || !Object.hasOwn(sections, tab)) notFound();
  const days = Number((await searchParams).days) || 7;
  const start = new Date(
    new Date().getTime() +
      4 * 3600000 -
      (Math.min(90, Math.max(1, days)) - 1) * 86400000,
  )
    .toISOString()
    .slice(0, 10);
  const [products, brands, categories, stores, settings, requests, stats] =
    await Promise.all([
      readPages((from, to) =>
        db
          .from("products")
          .select("*,product_images(path,alt,sort_order)")
          .order("updated_at", { ascending: false })
          .order("id")
          .range(from, to),
      ),
      db.from("brands").select("*").order("name"),
      db.from("categories").select("*").order("sort_order"),
      db.from("store_locations").select("*").order("sort_order"),
      db.from("site_settings").select("whatsapp").single(),
      tab === "trade-in"
        ? readPages((from, to) =>
            db
              .from("trade_in_requests")
              .select("*")
              .order("created_at", { ascending: false })
              .order("id")
              .range(from, to),
          )
        : Promise.resolve({ data: [], error: null }),
      readPages((from, to) =>
        db
          .from("daily_stats")
          .select("*")
          .gte("day", start)
          .order("day")
          .order("event")
          .order("subject")
          .range(from, to),
      ),
    ]);
  if (
    [products, brands, categories, stores, settings, requests, stats].some(
      (r) => r.error,
    )
  )
    throw Error("İdarəetmə məlumatları yüklənmədi");
  return (
    <div className="wrap inner">
      <header className="adminHeader">
        <Link href="/az">Telefon28Mobile ↗</Link>
        <form action={logout}>
          <button>Çıxış</button>
        </form>
      </header>
      <h1>{sections[tab as keyof typeof sections]}</h1>
      <nav className="adminTabs">
        {Object.entries(sections).map(([s, label]) => (
          <Link
            aria-current={s === tab}
            href={"/admin/" + (s === "overview" ? "" : s)}
            key={s}
          >
            {label}
          </Link>
        ))}
      </nav>
      <AdminConsole
        key={tab}
        tab={tab}
        data={{
          products: products.data || [],
          brands: brands.data || [],
          categories: categories.data || [],
          stores: stores.data || [],
          requests: requests.data || [],
          stats: stats.data || [],
          whatsapp: settings.data?.whatsapp || "",
        }}
      />
    </div>
  );
}
