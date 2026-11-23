// Captures the core screens for review: SCREENS=1 npx playwright test e2e/screens.spec.ts
import { test } from '@playwright/test';

const out = (n: string) => `../docs/pilots/screens/flipped-${n}.png`;

test('screens', async ({ page }) => {
  test.skip(!process.env.SCREENS, 'set SCREENS=1 to capture');
  await page.goto('/');
  await page.getByTestId('intro').waitFor();
  for (let i = 0; i < 3; i++) await page.getByTestId('intro-next').click();
  const items: [string, string, string, string | null][] = [['Denim jacket', 'vinted', '5', '22'], ['Nike Air Max', 'ebay', '18', '45'], ['Vintage tee', 'depop', '2', '14'], ['Lamp', 'facebook', '3', null], ['Board game', 'vinted', '4', null]];
  for (const [name, platform, cost, price] of items) {
    await page.goto('/item/new');
    await page.getByTestId('item-name').fill(name);
    await page.getByTestId(`platform-${platform}`).click();
    await page.getByTestId('item-cost').fill(cost);
    await page.getByTestId('item-save').click();
    if (price) {
      await page.getByTestId('item-sell').click();
      await page.getByTestId('sell-price').fill(price);
      await page.getByTestId('sell-postage').fill('2.70');
      await page.getByTestId('sell-save').click();
      await page.waitForTimeout(2800);
    }
  }
  await page.goto('/');
  await page.getByTestId('profit').waitFor();
  await page.screenshot({ path: out('1-profit'), fullPage: true });
  await page.goto('/stock');
  await page.getByTestId('stock').waitFor();
  await page.screenshot({ path: out('2-stock'), fullPage: true });
});
