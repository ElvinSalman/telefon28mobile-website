import { test, expect } from "@playwright/test";
const product = "/products/xiaomi-redmi-note-15-256-gb-black";
test.use({ hasTouch: true });
test.beforeEach(async ({ page }) => {
  await page.route("**/api/events", (r) => r.fulfill({ status: 204 }));
});
for (const [locale, theme, width] of [
  ["az", "dark", 390],
  ["az", "light", 1440],
  ["ru", "dark", 768],
  ["ru", "light", 390],
  ["en", "dark", 1440],
  ["en", "light", 768],
] as const) {
  test(`gallery ${locale} ${theme} ${width}`, async ({ page, context }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/" + locale + product);
    const gallery = page.locator(".productGallery:visible"),
      main = gallery.locator(".galleryOpen");
    await expect(gallery.locator(".galleryThumbnails button")).toHaveCount(2);
    await expect(gallery.locator(".galleryCount")).toHaveText("1 / 2");
    await expect(gallery.locator(".galleryImage")).toHaveJSProperty(
      "complete",
      true,
    );
    expect(
      await gallery
        .locator(".galleryImage")
        .evaluate((im: HTMLImageElement) => im.naturalWidth),
    ).toBeGreaterThan(0);
    await gallery.locator(".galleryNext").click();
    await expect(gallery.locator(".galleryCount")).toHaveText("2 / 2");
    await gallery.locator(".galleryPrevious").click();
    await expect(gallery.locator(".galleryCount")).toHaveText("1 / 2");
    await gallery.locator(".galleryThumbnails button").nth(1).click();
    await expect(
      gallery.locator(".galleryThumbnails button").nth(1),
    ).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("ArrowLeft");
    await expect(gallery.locator(".galleryCount")).toHaveText("1 / 2");
    await page.keyboard.press("End");
    await expect(gallery.locator(".galleryCount")).toHaveText("2 / 2");
    await page.keyboard.press("Home");
    await main.scrollIntoViewIfNeeded();
    const box = (await main.boundingBox())!;
    const cdp = await context.newCDPSession(page);
    const x = box.x + box.width * 0.75,
      y = box.y + box.height * 0.5;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (const offset of [20, 50, 90, 130])
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x - offset, y }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect(gallery.locator(".galleryCount")).toHaveText("2 / 2");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await main.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator(".galleryLightboxHeader button").first().click();
    await expect(dialog.locator(".galleryViewport")).toHaveClass(/isZoomed/);
    expect(
      await dialog
        .locator(".galleryViewport")
        .evaluate((e) => e.scrollWidth > e.clientWidth),
    ).toBe(true);
    await page.keyboard.press("ArrowLeft");
    await expect(dialog.locator(".galleryCount")).toHaveText("1 / 2");
    await expect(dialog.locator(".galleryViewport")).not.toHaveClass(
      /isZoomed/,
    );
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(main).toBeFocused();
    const actions = page.locator(".productContactActions:visible");
    const order = (await actions.locator("button").first().boundingBox())!,
      share = (await actions.locator("button").last().boundingBox())!;
    expect(
      share.x >= order.x + order.width + 12 ||
        share.y >= order.y + order.height + 10,
    ).toBe(true);
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (v: string) => {
            document.documentElement.dataset.shared = v;
          },
        },
      });
    });
    await actions.locator("button").last().click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-shared",
      new RegExp(locale + product),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
    if (locale === "en")
      await page.screenshot({
        path: `.vercel/gallery-${theme}-${width}.png`,
        fullPage: true,
      });
  });
}
test("single photo hides navigation; filters retain values and arrow inset", async ({
  page,
}) => {
  await page.goto("/en/products/apple-iphone-14-128-gb-blue");
  await expect(page.locator(".productGallery")).toBeVisible();
  await expect(page.locator(".galleryThumbnails,.galleryArrow")).toHaveCount(0);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/en/catalog");
    if (await page.locator(".filterToggle").isVisible())
      await page.locator(".filterToggle").click();
    const filters = page.locator(".filterFields:visible");
    await expect(filters.locator("select")).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      const s = filters.locator("select").nth(i);
      const value = await s.locator("option").nth(1).getAttribute("value");
      await s.selectOption(value!);
      await expect(s).toHaveValue(value!);
      expect(
        new URL(page.url()).searchParams.get(
          ["category", "brand", "storage", "color"][i],
        ),
      ).toBe(value);
      const padding = await s.evaluate((e) =>
        parseFloat(getComputedStyle(e).paddingRight),
      );
      expect(padding).toBeGreaterThanOrEqual(40);
      const arrow = await filters
          .locator(".catalogSelect>svg")
          .nth(i)
          .boundingBox(),
        box = await s.boundingBox();
      expect(
        box!.x + box!.width - arrow!.x - arrow!.width,
      ).toBeGreaterThanOrEqual(12);
      await s.selectOption("");
    }
    if (await page.getByRole("dialog").count())
      await page.keyboard.press("Escape");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
});
