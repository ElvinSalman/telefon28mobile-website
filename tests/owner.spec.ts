import { execFileSync } from "node:child_process";
import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { Workbook } from "exceljs";
import { parseSheet } from "../lib/importer";
test.describe.configure({ mode: "serial" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const secret = process.env.SUPABASE_SECRET_KEY || "";
const local = url === "http://127.0.0.1:55321" && !process.env.TEST_ORIGIN;
const run = randomUUID().slice(0, 8);
const item = "qa-" + run;
const pass = randomUUID() + "Aa9!";
const email = "owner-" + run + "@example.test";
const user = "staff-" + run + "@example.test";
let adminId = "",
  userId = "";
const sdk = (key: string) =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
function sql(query: string) {
  if (!local) throw Error("Local database required");
  return execFileSync(
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
  ).trim();
}
test.beforeAll(async () => {
  if (!local) return;
  sql("delete from shop_private.throttles where expires<now()");
  const service = sdk(secret);
  for (const [mail, admin] of [
    [email, true],
    [user, false],
  ] as const) {
    const r = await service.auth.admin.createUser({
      email: mail,
      password: pass,
      email_confirm: true,
    });
    expect(r.error).toBeNull();
    if (admin) {
      adminId = r.data.user!.id;
      if (!/^[a-f0-9-]{36}$/.test(adminId)) throw Error("Invalid UUID");
      sql(
        "insert into public.admin_memberships(user_id) values ('" +
          adminId +
          "')",
      );
    } else userId = r.data.user!.id;
  }
});
test.afterAll(async () => {
  if (!local) return;
  const db = sdk(secret);
  for (const id of [adminId, userId])
    if (id) await db.auth.admin.deleteUser(id);
  const paths = sql(
    "select path from public.product_images where product_id=(select id from public.products where slug='" +
      item +
      "')",
  )
    .split("\n")
    .filter(Boolean);
  if (paths.length) await db.storage.from("product-images").remove(paths);
  sql(
    "delete from public.products where slug='" +
      item +
      "-extra';delete from public.product_images where product_id=(select id from public.products where slug='" +
      item +
      "'); delete from public.products where slug='" +
      item +
      "'; delete from public.brands where slug='" +
      item +
      "'; delete from public.trade_in_requests where name='QA " +
      run +
      "'",
  );
});
test("anonymous, ordinary and administrator RLS/storage", async () => {
  test.skip(!local);
  const anon = sdk(pub),
    ordinary = sdk(pub),
    admin = sdk(pub);
  expect((await ordinary.auth.signInWithPassword({ email: user, password: pass })).error).toBeNull();
  expect((await admin.auth.signInWithPassword({ email, password: pass })).error).toBeNull();
  for (const c of [anon, ordinary]) {
    expect(
      (await c.from("brands").insert({ slug: item, name: item }).select())
        .error,
    ).toBeTruthy();
    expect(
      (
        await c.storage
          .from("product-images")
          .upload(item + "/test.webp", new Uint8Array([1]), {
            contentType: "image/webp",
          })
      ).error,
    ).toBeTruthy();
    expect(
      (await c.rpc("shop_count", { kind: "session", item: "" })).error,
    ).toBeTruthy();
    expect(
      (await c.from("trade_in_requests").select("*")).data || [],
    ).toHaveLength(0);
    expect(
      (await c.from("admin_memberships").insert({ user_id: userId })).error,
    ).toBeTruthy();
  }
  const role = await admin.rpc("shop_admin"); expect(role.error).toBeNull(); expect(role.data).toBe(true);
  expect(
    (await admin.from("brands").insert({ name: item, slug: item })).error,
  ).toBeNull();
  expect(
    (
      await admin.from("products").insert({
        slug: item,
        name: "QA Phone",
        price: 230,
        brand_id: item,
        category_id: "phone",
      })
    ).error,
  ).toBeNull();
  expect(
    (await anon.from("products").select("slug").eq("slug", item)).data,
  ).toEqual([]);
});
test("import preview validates CSV and XLSX and rejects duplicate slugs", async () => {
  const headers = "slug,name,brand_id,category_id,price,storage,color,status";
  const entry =
    item + ",QA Phone," + item + ",phone,230,128 GB,Black,published";
  const csv = new File([headers + "\n" + entry], "catalog.csv");
  const row = await parseSheet(csv);
  expect(row[0].price).toBe(230);
  await expect(
    parseSheet(
      new File([headers + "\n" + entry + "\n" + entry], "duplicate.csv"),
    ),
  ).rejects.toThrow();
  const book = new Workbook();
  const s = book.addWorksheet();
  s.addRow(headers.split(","));
  s.addRow(entry.split(","));
  expect(
    await parseSheet(
      new File([new Uint8Array(await book.xlsx.writeBuffer())], "catalog.xlsx"),
    ),
  ).toEqual(row);
});
test("protected UI, publish/import, real uploaded image, cart quote, trade-in and counters", async ({
  page,
  request,
}) => {
  test.skip(!local);
  await page.goto("/admin");
  await expect(page).toHaveURL(/admin\/login/);
  expect(
    (
      await request.post("/api/admin", { data: { op: "archive", slug: item } })
    ).status(),
  ).toBe(403);
  await page.getByLabel("E-poçt", { exact: true }).first().fill(email);
  await page.getByLabel("Şifrə", { exact: true }).fill(pass);
  await page.getByRole("button", { name: "Daxil ol" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/products");
  await page.getByRole("button", { name: "Yeni məhsul" }).click();
  await page.getByLabel("Ad və model").fill("QA second model");
  await page.locator("input[name=slug]").fill(item + "-extra");
  await page.locator("select[name=brand_id]").selectOption(item);
  await page.locator("select[name=category_id]").selectOption("phone");
  await page.locator("input[name=price]").fill("234.99");
  await page.getByRole("button", { name: "Saxla", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saxlanıldı");
  await expect(page.locator("input[name=slug]")).toHaveAttribute(
    "readonly",
    "",
  );
  await page.locator("input[name=price]").fill("245.99");
  const edited = page.waitForResponse((r) => r.url().endsWith("/api/admin"));
  await page
    .locator("form")
    .filter({ has: page.locator("input[name=price]") })
    .getByRole("button", { name: "Saxla" })
    .click();
  expect((await edited).status()).toBe(204);
  await page.goto("/admin/import");
  await page.locator("input[type=file]").setInputFiles({
    name: "catalog.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "slug,name,brand_id,category_id,price,storage,color,status\n" +
        item +
        ",QA Phone," +
        item +
        ",phone,230,128 GB,Black,published",
    ),
  });
  await expect(page.getByText("Önbaxışı yoxlayın.")).toBeVisible();
  page.once("dialog", (d) => d.accept());
  const importing = page.waitForResponse(
    (r) => r.url().endsWith("/api/admin") && r.request().method() === "POST",
  );
  await page.getByText("İdxalı təsdiqlə").click();
  expect((await importing).status()).toBe(204);
  await expect(page.getByRole("status")).toContainText("Saxlanıldı");
  await page.goto("/admin/products");
  await page.getByRole("textbox", { name: "Axtar", exact: true }).fill(item);
  await page
    .locator("article")
    .filter({ hasText: "QA Phone" })
    .getByRole("button", { name: "Redaktə", exact: true })
    .click();
  await page.locator("input[type=file]").setInputFiles({
    name: "sample.png",
    mimeType: "image/png",
    buffer: await (
      await import("sharp")
    )
      .default({
        create: { width: 8, height: 8, channels: 3, background: "#456" },
      })
      .png()
      .toBuffer(),
  });
  const upload = page.waitForResponse((r) =>
    r.url().includes("/api/admin/image"),
  );
  await page
    .locator("form")
    .filter({ has: page.locator("input[type=file]") })
    .getByRole("button", { name: "Saxla" })
    .click();
  expect((await upload).status()).toBe(201);
  await page.goto("/en/products/" + item);
  await expect(page.locator("h1")).toHaveText("QA Phone");
  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await page.goto("/en/cart");
  await page.getByRole("button", { name: "Increase" }).click();
  await page.getByRole("link", { name: "Order inquiry" }).click();
  await page.route("https://wa.me/**", (r) =>
    r.fulfill({ body: "Local QA intercept" }),
  );
  await page.getByRole("button", { name: "Ask on WhatsApp" }).click();
  await expect(page).toHaveURL(/wa.me/);
  expect(decodeURIComponent(page.url())).toContain("460.00");
  expect(decodeURIComponent(page.url())).toContain("/en/products/" + item);
  const origin = "http://127.0.0.1:3028";
  const post = (path: string, data: unknown) =>
    request.post(path, { headers: { origin }, data });
  expect(
    (
      await post("/api/quote", {
        locale: "az",
        lines: [{ slug: item, price: 1, qty: 1 }],
      })
    ).status(),
  ).toBe(409);
  await page.goto("/en/trade-in");
  await page.getByLabel("Full name").fill("QA " + run);
  await page.getByLabel("Phone", { exact: true }).fill("+994000000000");
  await page.getByLabel("Brand and model").fill("QA device");
  await page.getByLabel("Storage").fill("128GB");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(page.getByText("Request received.")).toBeVisible();
  const service = sdk(pub);
  await service.auth.signInWithPassword({ email, password: pass });
  expect(
    (
      await service
        .from("trade_in_requests")
        .select("consent_at")
        .eq("name", "QA " + run)
        .single()
    ).data?.consent_at,
  ).toBeTruthy();
  for (const k of ["session", "page_view", "product_view", "whatsapp_click", "trade_in"])
    expect(
      (
        await service
          .from("daily_stats")
          .select("count")
          .eq("event", k)
          .limit(1)
      ).data?.length,
    ).toBe(1);
  await page.goto("/admin/products");
  await page.getByRole("textbox", { name: "Axtar", exact: true }).fill(item);
  page.once("dialog", (d) => d.accept());
  await page
    .locator("article")
    .filter({ hasText: "QA Phone" })
    .getByRole("button", { name: "Arxivlə" })
    .click();
  await expect(page.getByRole("status")).toContainText("Saxlanıldı");
  expect((await request.get("/en/products/" + item)).status()).toBe(404);
  await page.getByRole("button", { name: "Çıxış" }).click();
  await expect(page).toHaveURL(/admin\/login/);
});
test("invite and recovery callback consume single-use tokens", async ({
  page,
}) => {
  test.skip(!local);
  const db = sdk(secret);
  const invite = await db.auth.admin.generateLink({
    type: "invite",
    email: "invite-" + run + "@example.test",
  });
  expect(invite.error).toBeNull();
  try {
    await page.goto(
      "/auth/callback?type=invite&token_hash=" +
        invite.data.properties!.hashed_token,
    );
    await expect(page).toHaveURL(/admin\/password/);
    await page.getByLabel(/Yeni şifrə/).fill(pass);
    await page.getByRole("button", { name: "Saxla" }).click();
    await expect(page).toHaveURL(/admin\/login/);
    const recovery = await db.auth.admin.generateLink({
      type: "recovery",
      email,
    });
    await page.goto(
      "/auth/callback?type=recovery&token_hash=" +
        recovery.data.properties!.hashed_token,
    );
    await expect(page).toHaveURL(/admin\/password/);
  } finally {
    await db.auth.admin.deleteUser(invite.data.user!.id);
  }
});
