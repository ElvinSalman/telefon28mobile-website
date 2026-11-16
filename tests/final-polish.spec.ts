import {test,expect} from '@playwright/test';
test('mobile hero spacing and removed progress indicator',async({page})=>{
 await page.route('**/api/events',r=>r.fulfill({status:204}));
 for(const locale of ['az','ru','en']){await page.goto('/'+locale);for(const theme of ['light','dark']){await page.evaluate(t=>{document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(t)},theme);for(const width of [320,375,390,430]){await page.setViewportSize({width,height:850});const buttons=await page.locator('.heroButtons:visible').boundingBox();const visual=await page.locator('.heroVisual:visible').boundingBox();expect(visual!.y-buttons!.y-buttons!.height).toBeGreaterThanOrEqual(23);await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await expect(page.locator('.progress')).toHaveCount(0);}}}
});
