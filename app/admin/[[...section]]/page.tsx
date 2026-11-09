import { readPages } from "@/lib/read-pages";
import { redirect, notFound } from "next/navigation";
import { adminDb } from "@/lib/db";
import Link from "next/link";
import { logout } from "../actions";
import {AdminThemeSwitch} from "@/components/admin-theme";
import { AdminConsole } from "@/components/admin-console";
const sections = {
  overview: "İcmal",
  products: "Məhsullar",
  categories: "Kateqoriyalar / Brendlər",
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
  searchParams: Promise<{ days?: string;new?:string;edit?:string;request_status?:string }>;
}) {
  const db = await adminDb();
  if (!db) redirect("/admin/login");
  const route = (await params).section || [];
  const tab = route[0] || "overview";
  if (route.length > 1 || !Object.hasOwn(sections, tab)) notFound();
  const query=await searchParams;const days = [1,7,30,90].includes(Number(query.days))?Number(query.days):7;
  const requestStatus=["new","contacted","closed"].includes(query.request_status||"")?query.request_status!:"";
  const start = new Date(
    new Date().getTime() +
      4 * 3600000 -
      (Math.min(90, Math.max(1, days)) - 1) * 86400000,
  )
    .toISOString()
    .slice(0, 10);
  const end=new Date(new Date().getTime()+4*3600000+86400000).toISOString().slice(0,10);
  const requestQuery=()=>{let q=db.from("trade_in_requests").select("*").gte("created_at",start+"T00:00:00+04:00").lt("created_at",end+"T00:00:00+04:00");if(requestStatus)q=q.eq("status",requestStatus);return q;};
  let countQuery=db.from("trade_in_requests").select("id",{count:"exact",head:true}).gte("created_at",start+"T00:00:00+04:00").lt("created_at",end+"T00:00:00+04:00");if(requestStatus)countQuery=countQuery.eq("status",requestStatus);
  const [products, brands, categories, stores, settings, requests, stats,requestCount] =
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
            requestQuery()
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
          .lt("day",end)
          .order("day")
          .order("event")
          .order("subject")
          .range(from, to),
      ),
      countQuery,
    ]);
  if (
    [products, brands, categories, stores, settings, requests, stats,requestCount].some(
      (r) => r.error,
    )
  )
    throw Error("İdarəetmə məlumatları yüklənmədi");
  return (
    <div className="wrap inner">
      <header className="adminHeader">
        <Link href="/az">Telefon28Mobile ↗</Link>
        <div className="contactActions"><Link className="button outline" href="/admin/password">Şifrəni dəyiş</Link><AdminThemeSwitch/><form action={logout}>
          <button>Çıxış</button>
        </form></div>
      </header>
      <h1>{sections[tab as keyof typeof sections]}</h1>
      <nav className="adminTabs">
        {Object.entries(sections).map(([s, label]) => (
          <Link
            aria-current={s === tab}
            href={"/admin/" + (s === "overview" ? "" : s)+"?days="+days}
            key={s}
          >
            {label}
          </Link>
        ))}
      </nav>
      <AdminConsole
        key={tab}
        tab={tab}
        newProduct={query.new==="1"}
        editSlug={query.edit}
        data={{
          requestCount:requestCount.count||0,days,requestStatus,
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

