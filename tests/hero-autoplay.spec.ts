import {test,expect} from '@playwright/test';
test('hero autoplay and manual timer controls',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.clock.install();await page.goto('/en');
 await page.mouse.move(0,0);const dots=page.locator('.hero .sequence button');await expect(dots).toHaveCount(3);
 const current=()=>page.locator('.hero .sequence button[aria-current="true"]');
 const coherent=async()=>{const name=await page.locator('.hero .spec b').innerText();await expect(page.locator('.hero .device img')).toHaveAttribute('alt',name);await expect(page.locator('.heroCopy p')).toContainText(name);await expect(page.locator('.heroButtons a').nth(1)).toHaveAttribute('href',/\/en\/products\//);};
 await page.clock.fastForward(5000);await expect(dots.nth(1)).toHaveAttribute('aria-current','true');await coherent();
 await page.clock.fastForward(5000);await expect(dots.nth(2)).toHaveAttribute('aria-current','true');await page.clock.fastForward(5000);await expect(dots.nth(0)).toHaveAttribute('aria-current','true');
 await page.clock.fastForward(4000);await dots.nth(2).click();await page.mouse.move(0,0);await page.clock.fastForward(4900);await expect(dots.nth(2)).toHaveAttribute('aria-current','true');await page.clock.fastForward(100);await expect(dots.nth(0)).toHaveAttribute('aria-current','true');
 await page.locator('.heroArrows button').first().click();await expect(dots.nth(2)).toHaveAttribute('aria-current','true');await page.locator('.heroArrows button').last().click();await expect(dots.nth(0)).toHaveAttribute('aria-current','true');
 await page.locator('.hero').hover();await page.clock.fastForward(15000);await expect(dots.nth(0)).toHaveAttribute('aria-current','true');await page.mouse.move(0,0);await page.clock.fastForward(5000);await expect(dots.nth(1)).toHaveAttribute('aria-current','true');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await page.clock.fastForward(15000);await expect(dots.nth(1)).toHaveAttribute('aria-current','true');await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await page.clock.fastForward(5000);await expect(dots.nth(2)).toHaveAttribute('aria-current','true');
 await page.emulateMedia({reducedMotion:'reduce'});await page.clock.fastForward(15000);await expect(dots.nth(2)).toHaveAttribute('aria-current','true');await coherent();await expect(current()).toHaveCount(1);
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'no-preference'});await page.clock.fastForward(5000);await expect(dots.nth(0)).toHaveAttribute('aria-current','true');
});
