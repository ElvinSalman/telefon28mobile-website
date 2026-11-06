import { test, expect } from "@playwright/test";
for (const width of [320, 375, 390, 768, 1024, 1440, 1920])
  test("storefront layout " + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/az",
      "/ru/catalog",
      "/en/stores",
      "/az/trade-in",
      "/admin/login",
    ]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  });
for (const [locale, theme] of [
  ["az", "dark"],
  ["ru", "dark"],
  ["en", "dark"],
  ["az", "light"],
  ["ru", "light"],
  ["en", "light"],
])
  test(locale + " " + theme + " branches and map", async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
    await page.goto("/" + locale + "/stores");
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    await expect(page.locator(".branchGrid article")).toHaveCount(3);
    await expect(
      page.locator('a[href="https://maps.app.goo.gl/FHLKC7UydaLqFPM99"]'),
    ).toHaveCount(1);
    for (const a of [
      "Azadlıq prospekti, 39D, Bakı",
      "Dilarə Əliyeva küçəsi, 21, Bakı",
      "Azadlıq prospekti, 39E, Bakı",
    ])
      await expect(page.getByText(a, { exact: true })).toBeVisible();
  });
test("localized 404 and guarded routes", async ({ request }) => {
  expect((await request.get("/en/missing")).status()).toBe(404);
  expect((await request.get("/admin/products")).url()).toContain(
    "/admin/login",
  );
  expect((await request.get("/auth/callback")).url()).toContain(
    "/admin/login?error=link",
  );
});
