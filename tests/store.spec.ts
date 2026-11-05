import { test, expect } from "@playwright/test";
import { products } from "../data/products";
for (const width of [320, 375, 390, 768, 1024, 1440, 1920])
  test("layout " + width, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/az",
      "/ru/catalog",
      "/en/products/" + products[0].slug,
    ]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        await page
          .locator("img")
          .evaluateAll((imgs) =>
            imgs
              .filter((i) => i.getAttribute("loading") !== "lazy")
              .every(
                (i) =>
                  (i as HTMLImageElement).complete &&
                  (i as HTMLImageElement).naturalWidth > 0,
              ),
          ),
      ).toBe(true);
    }
  });
test("browse and purchase inquiry", async ({ page }) => {
  await page.goto("/en/catalog?brand=Samsung");
  await expect(page.locator("article").first()).toContainText("Samsung");
  await page.getByPlaceholder("Search products").fill("Galaxy S26");
  await expect(page.locator("article")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("article")).toHaveCount(1);
  await page.getByRole("button", { name: "Quick view" }).first().click();
  const modal = page.getByRole("dialog");
  await modal.getByRole("button", { name: "Add to cart" }).click();
  await modal.getByRole("button", { name: "Wishlist" }).click();
  await page.keyboard.press("Escape");
  await page.goto("/en/wishlist");
  await expect(page.locator("article")).toHaveCount(1);
  await page.goto("/en/cart");
  await page.getByRole("button", { name: "Increase" }).click();
  await expect(page.locator(".qty")).toContainText("2");
  await page.getByRole("link", { name: "Order inquiry" }).click();
  await page.getByRole("button", { name: "Ask on WhatsApp" }).click();
  await expect(page.locator("form [role=alert]")).toBeVisible();
  await page.getByLabel("Full name").fill("Demo Buyer");
  await page.getByLabel("Phone", { exact: true }).fill("0551234567");
  await page.evaluate(() => {
    window.open = (url) => {
      document.body.dataset.inquiry = String(url);
      return null;
    };
  });
  await page.getByRole("button", { name: "Ask on WhatsApp" }).click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-inquiry",
    /wa.me\/994556002001/,
  );
  await page.goto("/en/cart");
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("No products here yet")).toBeVisible();
});
test("mobile navigation, theme and language", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await expect(page).toHaveURL(/\/az$/);
  await page.getByRole("button", { name: "Menyu", exact: true }).click();
  await page.getByRole("dialog").getByText("Kataloq").click();
  await page.getByRole("button", { name: "Filtrlər" }).click();
  await page.getByRole("dialog").getByLabel("Brend").selectOption("Apple");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Dil", exact: true }).click();
  await page.getByText("Русский", { exact: true }).click();
  await expect(page).toHaveURL(/\/ru\/catalog\?brand=Apple/);
  await page.getByRole("button", { name: "Тема", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/ru$/);
});
test("localized routes and all product pages", async ({ request }) => {
  for (const l of ["az", "ru", "en"]) {
    for (const r of [
      "",
      "catalog",
      "about",
      "contact",
      "services",
      "cart",
      "wishlist",
      "checkout",
      "account",
      "register",
      "reset",
      "profile",
      "addresses",
      "admin",
      "promo",
      "faq",
      "privacy",
      "terms",
      "products/" + products[0].slug,
    ])
      expect((await request.get("/" + l + "/" + r)).status()).toBe(200);
  }
  for (const p of products)
    expect((await request.get("/en/products/" + p.slug)).status()).toBe(200);
  expect((await request.get("/en/missing")).status()).toBe(404);
});
