import { Workbook } from "exceljs";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { simpleColumns } from "../lib/simple-import";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  secret = process.env.SUPABASE_SECRET_KEY || "";
const local = url === "http://127.0.0.1:55321" && !process.env.TEST_ORIGIN;
const hosted =
  process.env.REPAIR_HOSTED_QA === "approved" &&
  url === "https://bpsmcmmdtxteeswaumse.supabase.co";
const enabled = local || hosted,
  origin = process.env.TEST_ORIGIN || "http://127.0.0.1:3028";
const run = randomUUID().slice(0, 8),
  prefix = "qa-repair-" + run,
  email = prefix + "@example.test",
  password = randomUUID() + "Aa9!";
const sdk = (key: string) =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
let uid = "",
  ordinaryId = "",
  itemId = "",
  itemSlug = "",
  brandSlug = "";
const fixtureIds = new Set<string>(),
  fixtureBrands = new Set<string>();
function sql(query: string) {
  if (local)
    return JSON.parse(
      execFileSync(
        "docker",
        [
          "exec",
          "supabase_db_telefon28mobile",
          "psql",
          "-U",
          "postgres",
          "-d",
          "postgres",
          "-v",
          "ON_ERROR_STOP=1",
          "-tA",
          "-c",
          query,
        ],
        { encoding: "utf8" },
      ).trim() || "null",
    );
  if (!hosted) throw Error("Explicit QA authorization required");
  const file = ".vercel/repair-qa.sql";
  fs.writeFileSync(file, query);
  try {
    const r = spawnSync(
      "cmd.exe",
      [
        "/d",
        "/s",
        "/c",
        "npx --yes supabase db query --linked --file " + file + " -o json",
      ],
      { encoding: "utf8", windowsHide: true },
    );
    if (r.status) throw Error("QA SQL failed");
    const rows = JSON.parse(r.stdout).rows;
    return rows[0]?.result ?? null;
  } finally {
    fs.unlinkSync(file);
  }
}
function command(query: string) {
  return sql(
    "with changed as (" +
      query +
      " returning 1) select count(*) as result from changed",
  );
}
async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("E-poçt", { exact: true }).first().fill(email);
  await page.getByLabel("Şifrə", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Daxil ol" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
async function auth() {
  const c = sdk(pub);
  expect(
    (await c.auth.signInWithPassword({ email, password })).error,
  ).toBeNull();
  return c;
}
async function absentFromStorage(path:string){
 const parts=path.split('/');const listed=await (await auth()).storage.from('product-images').list(parts[0],{search:parts[1]});expect(listed.error).toBeNull();expect(listed.data?.some(x=>x.name===parts[1])).toBe(false);
}
async function product() {
  const r = await (
    await auth()
  )
    .from("products")
    .select("*,product_images(*)")
    .eq("id", itemId)
    .single();
  expect(r.error).toBeNull();
  return r.data!;
}
test.describe.configure({ mode: "serial", timeout: 240000 });
const runtimeErrors=new WeakMap<Page,string[]>();
test.afterEach(async({page})=>{expect(runtimeErrors.get(page)||[]).toEqual([]);});
test.beforeEach(async ({ page }) => {
  const errors:string[]=[];runtimeErrors.set(page,errors);page.on("pageerror",e=>errors.push(e.message));
  await page.route("**/api/events", (r) => r.fulfill({ status: 204 }));
});
test.beforeAll(async () => {
  test.setTimeout(240000);
  if (!enabled) return;
  if(local)command("delete from shop_private.throttles");
  const service = sdk(secret);
  for (const admin of [true, false]) {
    const r = await service.auth.admin.createUser({
      email: admin ? email : "ordinary-" + email,
      password,
      email_confirm: true,
    });
    expect(r.error).toBeNull();
    if (admin) {
      uid = r.data.user!.id;
      command(`insert into public.admin_memberships(user_id) values('${uid}')`);
    } else ordinaryId = r.data.user!.id;
  }
});
test.afterAll(async () => {
  test.setTimeout(240000);
  if (!enabled) return;
  const service = sdk(secret);
  const admin = await auth();
  const rows = await admin
    .from("products")
    .select("id,slug,brand_id,product_images(path)")
    .like("name", "%" + run + "%");
  for (const p of rows.data || []) {
    fixtureIds.add(p.id);
    command("delete from public.daily_stats where subject='" + p.slug + "'");
    if (p.brand_id.includes(run)) fixtureBrands.add(p.brand_id);
    const paths = p.product_images.map((x) => x.path);
    if (paths.length)
      await service.storage.from("product-images").remove(paths);
  }
  for (const id of fixtureIds) {
    command(`delete from public.product_images where product_id='${id}'`);
    command(`delete from public.products where id='${id}'`);
    command(`delete from public.image_cleanup where path like '${id}/%'`);
  }
  for (const b of fixtureBrands)
    command(
      `delete from public.brands where slug='${b}' and not exists(select 1 from public.products where brand_id='${b}')`,
    );
  const removed = command(
    `delete from public.trade_in_requests where name='${prefix}'`,
  );
  if (removed)
    command(
      `update public.daily_stats set count=greatest(0,count-${removed}) where event='trade_in' and subject='' and day=(now() at time zone 'Asia/Baku')::date`,
    );
  // Only exact fixture subjects, never delete historical aggregate events.
  command(`delete from public.daily_stats where subject like '${prefix}%'`);
  for (const id of [uid, ordinaryId])
    if (id) expect((await service.auth.admin.deleteUser(id)).error).toBeNull();
});
test("production seeded Xiaomi name/price edit and exact callback allowlist", async ({
  page,
}) => {
  test.skip(!hosted);
  await login(page);
  const db = await auth();
  const snapshot = await db
    .from("products")
    .select("*")
    .eq("slug", "xiaomi-redmi-note-15-256-gb-black")
    .single();
  expect(snapshot.error).toBeNull();
  const original = snapshot.data!;
  try {
    await page.goto("/admin/products?edit=" + original.slug);
    await expect(page.locator(".productEditor:visible")).toHaveCount(1);
    await page
      .getByRole("textbox", {name:"Ad və model",exact:true})
      .fill("redmi note test");
    await page.getByRole("button", { name: "Saxla", exact: true }).click();
    await expect(page.locator(".productEditor:visible [role=status]")).toContainText(
      "Saxlanıldı",
    );
    await page.reload();
    await expect(page.getByRole("textbox", {name:"Ad və model",exact:true})).toHaveValue(
      "redmi note test",
    );
    await page.goto("/az/products/" + original.slug);
    await expect(page.getByRole("heading",{level:1})).toHaveText("redmi note test");
    const current = (
      await db.from("products").select("*").eq("id", original.id).single()
    ).data!;
    const response = await page.request.post("/api/admin", {
      headers: { origin },
      data: {
        op: "product",
        id: original.id,
        expected_updated_at: current.updated_at,
        record: { ...current, price: Number(original.price) + 0.01 },
      },
    });
    expect(response.status()).toBe(200);
    expect(
      (
        await db
          .from("products")
          .select("price,slug,source_verified_at")
          .eq("id", original.id)
          .single()
      ).data,
    ).toMatchObject({
      price: Number(original.price) + 0.01,
      slug: original.slug,
      source_verified_at: original.source_verified_at,
    });    await page.reload();await expect(page.getByRole('heading',{level:2,name:String(Number(original.price)+.01).replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' ₼',exact:true})).toBeVisible();
  } finally {
    // Restore only fields this test changed, preserving any concurrent unrelated owner edits.
    expect(
      (
        await db
          .from("products")
          .update({ name: original.name, price: original.price })
          .eq("id", original.id)
      ).error,
    ).toBeNull();
  }
  const restored = (
    await db.from("products").select("*").eq("id", original.id).single()
  ).data!;
  expect(restored).toMatchObject({
    ...original,
    updated_at: expect.any(String),
  });
  const link = await sdk(secret).auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: origin + "/auth/callback" },
  });
  expect(link.error).toBeNull();
  const response = await fetch(link.data.properties!.action_link, {
    redirect: "manual",
  });
  const destination = new URL(response.headers.get("location")!);
  expect(destination.origin + destination.pathname).toBe(
    origin + "/auth/callback",
  );
});



test("RLS, allowlist, API and Storage reject anonymous and ordinary users", async ({
  page,
  request,
}) => {
  test.skip(!enabled);
  await page.goto("/admin");
  await expect(page).toHaveURL(/admin\/login/);
  const denied = await request.post("/api/admin", {
    headers: { origin },
    data: { op: "archive", slug: "none" },
  });
  expect(denied.status()).toBe(403);
  expect(await denied.json()).toMatchObject({
    code: "FORBIDDEN",
    requestId: expect.any(String),
  });
  const ordinary = sdk(pub);
  await ordinary.auth.signInWithPassword({
    email: "ordinary-" + email,
    password,
  });
  for (const c of [sdk(pub), ordinary]) {
    expect(
      (await c.from("brands").insert({ name: prefix, slug: prefix })).error,
    ).toBeTruthy();
    expect(
      (
        await c.rpc("shop_resolve_brand", {
          brand_name: prefix,
          preferred_slug: prefix,
        })
      ).error,
    ).toBeTruthy();
    expect(
      (await c.rpc("shop_import_products", { items: [] })).error,
    ).toBeTruthy();
    expect(
      (
        await c.storage
          .from("product-images")
          .upload(prefix + "/test.webp", new Uint8Array([1]), {
            contentType: "image/webp",
          })
      ).error,
    ).toBeTruthy();
    expect(
      (await c.from("trade_in_requests").select("id")).data || [],
    ).toHaveLength(0);
    expect(
      (await c.from("admin_memberships").insert({ user_id: ordinaryId })).error,
    ).toBeTruthy();
  }
});
test("one-step creation, new inline brand, two photos, reorder, responsive editor", async ({
  page,
}) => {
  test.skip(!enabled);
  await login(page);
  await page.goto("/admin/products?new=1");
  await expect(page.locator(".productEditor:visible")).toHaveCount(1);
  await page
    .getByRole("textbox", {name:"Ad və model",exact:true})
    .fill("iPhone QA " + run);
  await page.locator("input[name=price]:visible").fill("123.45");
  await page.locator("input[name=brand]:visible").fill("QA Brand " + run);
  await page.locator("input[name=category_id]:visible").fill("phone");
  await page.locator("textarea[name=desc_az]:visible").fill("QA təsvir " + run);
  await page.locator("select[name=status]:visible").selectOption("published");
  await page
    .getByLabel("Fotoları seç")
    .setInputFiles([
      "public/catalog/49076729.webp",
      "public/catalog/49041247.webp",
    ]);
  await expect(page.locator(".pendingPhotos figure")).toHaveCount(2);
  await page
    .locator(".pendingPhotos figure")
    .nth(1)
    .getByRole("button", { name: "Əvvələ" })
    .click();
  let uploads=0;
  await page.route('**/api/admin/image',r=>++uploads===2?r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'STORAGE',message:'QA interrupted upload'})}):r.continue());
  await page.getByRole('button',{name:'Saxla',exact:true}).click();await expect(page.locator('.productEditor:visible .adminError')).toContainText('QA interrupted upload');
  const partial=(await (await auth()).from('products').select('status,product_images(path)').eq('name','iPhone QA '+run).single()).data!;expect(partial.status).toBe('draft');expect(partial.product_images).toHaveLength(1);
  await page.unroute('**/api/admin/image');  await page.getByRole("button", { name: "Saxla", exact: true }).click();
  await expect(page.locator(".productEditor:visible [role=status]")).toContainText(
    "Saxlanıldı",
    { timeout: 60000 },
  );
  itemSlug = await page.locator(".productEditor:visible input[name=slug]").inputValue();
  const a = await auth();
  const r = await a
    .from("products")
    .select("id,brand_id,status,product_images(*)")
    .eq("slug", itemSlug)
    .single();
  expect(r.error).toBeNull();
  itemId = r.data!.id;
  brandSlug = r.data!.brand_id;
  fixtureIds.add(itemId);
  fixtureBrands.add(brandSlug);
  expect(r.data!.status).toBe("published");
  expect(r.data!.product_images).toHaveLength(2);
  await expect(page.locator(".productEditor:visible input[name=slug]")).toHaveAttribute(
    "readonly",
    "",
  );
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.vercel/admin-mobile-repair.png',fullPage:true});
  await page.getByRole('button',{name:'Görünüşü dəyiş'}).click();await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'.vercel/admin-desktop-repair.png',fullPage:true});  for (const locale of ["az", "ru", "en"]) {
    await page.goto("/" + locale + "/products/" + itemSlug);
    await expect(page.getByRole("heading",{level:1})).toHaveText("iPhone QA " + run);
    await expect(
      page.getByText("QA təsvir " + run, { exact: true }),
    ).toBeVisible();
  }
});
test("existing ID edits every field, timestamp regression, concurrency and safe errors", async ({
  page,
}) => {
  test.skip(!enabled);
  await login(page);
  const post = (data: unknown) =>
    page.request.post("/api/admin", { headers: { origin }, data });
  const other = await post({ op: "brand", name: "QA Alternate " + run });
  expect(other.ok()).toBe(true);
  const otherBrand = (await other.json()).slug;
  fixtureBrands.add(otherBrand);
  let p = await product();
  const immutable = p.slug;
  for (const change of [
    { name: "iPhone edited " + run },
    { price: 245.99 },
    { brand_id: otherBrand },
    { brand_id: brandSlug },
    { category_id: "tablet" },
    { category_id: "phone" },
    { storage: "256 GB", color: "Ağ" },
    { description: { az: "Yeniləndi " + run, ru: "QA RU", en: "QA EN" } },
    { specifications: { Ekran: "QA 6.1" } },
    { featured: true },
    { status: "draft" },
    { status: "published" },
    {},
  ]) {
    const result = await post({
      op: "product",
      id: itemId,
      expected_updated_at: p.updated_at,
      record: {
        ...p,
        ...change,
        source_verified_at: "2026-11-01T00:00:00+00:00",
      },
    });
    expect(result.status(), await result.text()).toBe(200);
    expect((await result.json()).affected).toBe(1);
    p = await product();
    expect(p).toMatchObject(change);
    expect(p.slug).toBe(immutable);
  }
  for (const [payload, status, code] of [
    [{ op: "product", id: randomUUID(), record: p }, 404, "NOT_FOUND"],
    [
      { op: "product", id: itemId, record: { ...p, price: -1 } },
      422,
      "VALIDATION",
    ],
    [
      {
        op: "product",
        id: itemId,
        record: { ...p, source_url: "javascript:test" },
      },
      422,
      "VALIDATION",
    ],
    [
      { op: "product", id: itemId, record: { ...p, slug: "new-slug" } },
      422,
      "STABLE_SLUG",
    ],
    [
      {
        op: "product",
        id: itemId,
        expected_updated_at: "2000-01-01T00:00:00Z",
        record: p,
      },
      409,
      "CONFLICT",
    ],
    [
      {
        op: "product",
        id: itemId,
        record: { ...p, brand_id: "missing-brand-qa" },
      },
      422,
      "REFERENCE",
    ],
    [{ op: "product", record: p }, 409, "DUPLICATE"],
  ] as const) {
    const r = await post(payload);
    expect(r.status()).toBe(status);
    expect(await r.json()).toMatchObject({
      code,
      requestId: expect.any(String),
    });
  }
  expect(
    (
      await page.request.post("/api/admin", {
        headers: { origin: "https://wrong.example" },
        data: { op: "archive", slug: itemSlug },
      })
    ).status(),
  ).toBe(403);
  await page.goto("/admin/products?edit=" + itemSlug);
  await expect(page.getByRole("textbox", {name:"Ad və model",exact:true})).toHaveValue(
    p.name,
  );
  await page.locator("input[name=price]:visible").fill("-2");
  await page.getByRole("button", { name: "Saxla", exact: true }).click();
  await expect(page.locator(".productEditor .adminError")).toBeVisible();
  await expect(page.locator("input[name=price]:visible")).toHaveValue("-2");
  // Simulated transport interruption must keep unsaved content.
  await page.locator("input[name=price]:visible").fill("246");
  await page.route("**/api/admin", (r) => r.abort());
  await page.getByRole("button", { name: "Saxla", exact: true }).click();
  await expect(page.locator(".productEditor .adminError")).toBeVisible();
  await expect(page.locator("input[name=price]:visible")).toHaveValue("246");
  await page.unroute("**/api/admin");
  await page.getByRole("button", { name: "Saxla", exact: true }).click();
  await expect(page.locator(".productEditor:visible [role=status]")).toContainText(
    "Saxlanıldı",
  );
  expect((await product()).price).toBe(246);
});
test("photo primary/replacement/deletion updates Storage and requires no file input", async ({
  page,
}) => {
  test.skip(!enabled);
  await login(page);
  await page.goto("/admin/products?edit=" + itemSlug);
  let p = await product();
  const old = p.product_images.find(
    (x: { sort_order: number }) => x.sort_order === 1,
  ).path;
  await page
    .locator(".imageManager figure")
    .nth(1)
    .getByRole("button", { name: "Əsas şəkil et" })
    .click();
  await expect
    .poll(
      async () =>
        (await product()).product_images.find(
          (x: { sort_order: number }) => x.sort_order === 0,
        ).path,
    )
    .toBe(old);
  await page
    .locator(".imageManager figure")
    .first()
    .getByLabel("Əvəz et")
    .setInputFiles("public/catalog/49076729.webp");
  await page
    .getByRole("button", { name: "Foto əlavə et", exact: true })
    .click();
  await expect(page.locator(".productEditor:visible [role=status]")).toContainText(
    "Fotolar əlavə edildi",
  );
  await absentFromStorage(old);
  for (const left of [1, 0]) {
    p = await product();
    const path = p.product_images.sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order,
    )[0].path;
    page.once("dialog", (d) => d.accept());
    await page
      .locator(".imageManager figure")
      .first()
      .getByRole("button", { name: "Fotonu sil" })
      .click();
    await expect(page.locator(".imageManager figure")).toHaveCount(left);
    expect((await product()).product_images).toHaveLength(left);
    await absentFromStorage(path);
  }
  await page.getByRole("button", { name: "Saxla", exact: true }).click();
  await expect(page.locator(".productEditor:visible [role=status]")).toContainText(
    "Saxlanıldı",
  );
  await page.goto("/az/products/" + itemSlug);
  await expect(
    page.getByText("Foto əlavə edilməyib", { exact: true }).first(),
  ).toBeVisible();
});
test("six-column UI import creates brands, idempotent price update, transactional rollback", async ({
  page,
}) => {
  test.skip(!enabled);
  await login(page);
  const a = await auth();
  const importName = "iPad QA " + run;
  const brand = "QA Imported " + run;
  const upload = async (price: string, excel = false) => {
    await page.goto("/admin/import");
    let buffer = Buffer.from(
      simpleColumns.join(",") +
        "\n" +
        [importName, price, brand, "128 GB", "Qara", "Təsvir " + run].join(","),
    );
    if (excel) {
      const csv = await page.request.get("/import-template.csv");
      expect((await csv.text()).replace(/^\uFEFF/, "").trim()).toBe(
        simpleColumns.join(","),
      );
      const downloading = page.waitForEvent("download");
      await page.getByRole("button", { name: "Excel şablonu ↓" }).click();
      const downloaded = await downloading;
      const stream = await downloaded.createReadStream();
      const chunks = [];
      for await (const chunk of stream!) chunks.push(chunk);
      const book = new Workbook();
      await book.xlsx.load(new Uint8Array(Buffer.concat(chunks)).buffer);
      expect(
        Array.from(
          { length: 6 },
          (_, i) => book.worksheets[0].getRow(1).getCell(i + 1).text,
        ),
      ).toEqual([...simpleColumns]);
      expect(book.worksheets).toHaveLength(2);
      book.worksheets[0].addRow([
        importName,
        price,
        brand,
        "128 GB",
        "Qara",
        "Təsvir " + run,
      ]);
      buffer = Buffer.from(await book.xlsx.writeBuffer());
    }
    await page
      .getByLabel("İdxal faylı")
      .setInputFiles({
        name: excel ? "six.xlsx" : "six.csv",
        mimeType: excel
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv",
        buffer,
      });
    await expect(page.locator(".importPreview fieldset")).toHaveCount(1);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "İdxalı təsdiqlə" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "uğurlu" }),
    ).toBeVisible();
  };
  await upload("123.45", true);
  let rows = (await a.from("products").select("*").eq("name", importName))
    .data!;
  expect(rows).toHaveLength(1);
  const first = rows[0];
  fixtureIds.add(first.id);
  fixtureBrands.add(first.brand_id);
  expect(first.status).toBe("published");
  expect(first.category_id).toBe("tablet");
  const photograph=await page.request.post('/api/admin/image',{headers:{origin},multipart:{id:first.id,index:'0',alt:'QA import preservation',file:{name:'real.webp',mimeType:'image/webp',buffer:fs.readFileSync('public/catalog/49076729.webp')}}});expect(photograph.status()).toBe(201);const preservedPath=(await photograph.json()).image.path;
  await upload("123.45");
  await upload("234.56");
  rows = (await a.from("products").select("*").eq("name", importName)).data!;
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    id: first.id,
    slug: first.slug,
    price: 234.56,
  });
  const post = (rows: unknown[]) =>
    page.request.post("/api/admin", {
      headers: { origin },
      data: { op: "import", rows },
    });
  const r = {
    row: 2,
    name: importName,
    brand,
    price: 345.67,
    storage: "128 GB",
    color: "Qara",
    description: "",
    category: "tablet",
  };
  expect((await post([r])).status()).toBe(200);
  expect(
    (await a.from("products").select("description").eq("id", first.id).single())
      .data?.description.az,
  ).toBe("Təsvir " + run);
  const rollbackBrand = "QA Rollback " + run;
  const failure = await post([
    { ...r, name: "QA rollback " + run, brand: rollbackBrand },
    { ...r, row: 3, name: "QA invalid " + run, category: "missing-qa" },
  ]);
  expect(failure.status()).toBe(422);
  expect(
    (await a.from("brands").select("slug").eq("name", rollbackBrand)).data,
  ).toHaveLength(0);
  expect(
    (
      await a
        .from("products")
        .select("id")
        .eq("name", "QA rollback " + run)
    ).data,
  ).toHaveLength(0);
  const variant = await post([
    { ...r, storage: "256 GB" },
    { ...r, row: 3, name: "MacBook QA " + run, category: "laptop" },
  ]);
  expect(variant.status()).toBe(200);
  for (const x of (await variant.json()).items) fixtureIds.add(x.id);
  expect((await post([r, r])).status()).toBe(422);
  const ambiguousName='QA ambiguous '+run;
  const duplicates=await a.from('products').insert([0,1].map(n=>({name:ambiguousName,slug:prefix+'-ambiguous-'+n,brand_id:first.brand_id,category_id:'tablet',price:10,storage:'128 GB',color:'Qara',status:'draft'}))).select('id');expect(duplicates.error).toBeNull();for(const x of duplicates.data!)fixtureIds.add(x.id);
  expect((await post([{...r,name:ambiguousName}])).status()).toBe(422);
  expect((await post([{...r,name:ambiguousName,target_id:duplicates.data![0].id}])).status()).toBe(200);
  expect((await a.from('products').select('price').eq('id',duplicates.data![1].id).single()).data?.price).toBe(10);
  expect((await a.from('product_images').select('path').eq('product_id',first.id).single()).data?.path).toBe(preservedPath);
  const concurrent = await Promise.all([post([r]), post([r])]);
  expect(concurrent.map((r) => r.status())).toEqual([200, 200]);
  expect(
    (await a.from("products").select("id").eq("import_key", first.import_key))
      .data,
  ).toHaveLength(1);
  for (const locale of ["az", "ru", "en"]) {
    await page.goto("/" + locale + "/products/" + first.slug);
    await expect(page.getByRole("heading",{level:1})).toHaveText(importName);
    await expect(
      page.getByText("Təsvir " + run, { exact: true }),
    ).toBeVisible();
  }
});
test("trade-in actual counts, status, quote, admin password change and logout", async ({
  page,
}) => {
  test.skip(!enabled);
  await login(page);
  const a = await auth();
  const before = (
    await a
      .from("trade_in_requests")
      .select("id", { head: true, count: "exact" })
  ).count!;
  const trade = await page.request.post("/api/trade-in", {
    headers: { origin },
    data: {
      name: prefix,
      phone: "+994000000000",
      model: "QA device",
      storage: "128 GB",
      condition: "good",
      notes: "Disposable QA",
      consent: true,
      website: "",
    },
  });
  expect(trade.ok()).toBe(true);
  const request = (
    await a.from("trade_in_requests").select("id").eq("name", prefix).single()
  ).data!;
  expect(
    (
      await a
        .from("trade_in_requests")
        .select("id", { head: true, count: "exact" })
    ).count,
  ).toBe(before + 1);
  for (const days of [1, 7, 30, 90]) {
    await page.goto("/admin/trade-in?days=" + days);
    await expect(
      page.getByText(prefix, { exact: false }).first(),
    ).toBeVisible();
    const count = await page
      .locator("[data-testid=request-count]:visible")
      .textContent();
    await page.goto("/admin/?days=" + days);
    await expect(page.locator("[data-testid=request-count]:visible")).toHaveText(
      count!,
    );
  }
  expect(
    (
      await page.request.post("/api/admin", {
        headers: { origin },
        data: { op: "trade", id: request.id, status: "contacted" },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/admin/trade-in?request_status=contacted");
  await expect(page.getByText(prefix, { exact: false }).first()).toBeVisible();
  for (const kind of [
    "session",
    "page_view",
    "product_view",
    "whatsapp_click",
  ]) {
    const event = await page.request.post("/api/events", {
      headers: { origin },
      data: { kind, item: itemSlug },
    });
    expect(event.status()).toBe(204);
    expect(
      (
        await a
          .from("daily_stats")
          .select("count")
          .eq("subject", itemSlug)
          .eq("event", kind)
      ).data?.some((x) => Number(x.count) > 0),
    ).toBe(true);
  }
  const p = await product();
  const quote = await page.request.post("/api/quote", {
    headers: { origin },
    data: { locale: "en", lines: [{ slug: itemSlug, qty: 2, price: p.price }] },
  });
  expect(quote.ok()).toBe(true);
  const target = (await quote.json()).url;
  expect(target).toContain("https://wa.me/994556002001?text=");
  expect(decodeURIComponent(target)).toContain((p.price * 2).toFixed(2));
  expect(decodeURIComponent(target)).toContain(p.name);
  expect(
    (
      await page.request.post("/api/quote", {
        headers: { origin },
        data: { locale: "en", lines: [{ slug: itemSlug, qty: 1, price: 1 }] },
      })
    ).status(),
  ).toBe(409);
  await page.goto("/admin/password");
  await page.getByLabel("Cari şifrə", { exact: true }).fill(password);
  await page
    .getByLabel("Yeni şifrə · minimum 12 simvol", { exact: true })
    .fill(password + "x");
  await page
    .getByLabel("Yeni şifrəni təkrar edin", { exact: true })
    .fill(password + "x");
  await page.getByRole("button", { name: "Saxla", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  expect(
    (
      await sdk(pub).auth.signInWithPassword({
        email,
        password: password + "x",
      })
    ).error,
  ).toBeNull();
  // Restore only this disposable QA password for fixture cleanup, never the owner's account.
  expect(
    (await sdk(secret).auth.admin.updateUserById(uid, { password })).error,
  ).toBeNull();
  await page.getByRole("button", { name: "Çıxış" }).click();
  await expect(page).toHaveURL(/admin\/login/);
});





