import { expect, test, type Page } from '@playwright/test';

async function finishIntro(page: Page) {
  await expect(page.getByTestId('intro')).toBeVisible();
  for (let i = 0; i < 3; i++) await page.getByTestId('intro-next').click();
  await expect(page.getByTestId('profit')).toBeVisible();
}

async function addItem(page: Page, name: string, platform: string, cost: string) {
  await page.getByTestId('item-name').fill(name);
  await page.getByTestId(`platform-${platform}`).click();
  await page.getByTestId('item-cost').fill(cost);
  await page.getByTestId('item-save').click();
  await expect(page.getByTestId('item')).toBeVisible();
}

test('first open → add item → sell it → real profit everywhere, and it persists', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await finishIntro(page);
  await page.getByTestId('profit-add').click();
  await addItem(page, 'Denim jacket', 'vinted', '5');

  await page.getByTestId('item-sell').click();
  await page.getByTestId('sell-price').fill('20');
  await page.getByTestId('sell-postage').fill('2.50');
  await expect(page.getByText('Profit: £12.50')).toBeVisible();
  await page.getByTestId('sell-save').click();
  await expect(page.getByTestId('celebrate')).toContainText('Ka-ching!');
  await expect(page.getByTestId('breakdown')).toContainText('+£12.50');

  await page.goto('/');
  await expect(page.getByTestId('month-profit')).toHaveText('+£12.50');
  await expect(page.getByTestId('report-vinted')).toHaveText('Under both limits');
  await expect(page.getByTestId('trading')).toContainText('£20 of £1,000');

  await page.reload();
  await expect(page.getByTestId('month-profit')).toHaveText('+£12.50');
  await page.goto('/sold');
  await expect(page.getByTestId('sold-Denim jacket')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Depop suggests its payment-processing fee, which you can override', async ({ page }) => {
  await page.goto('/');
  await finishIntro(page);
  await page.getByTestId('profit-add').click();
  await addItem(page, 'Vintage tee', 'depop', '2');
  await page.getByTestId('item-sell').click();
  await page.getByTestId('sell-price').fill('10');
  await expect(page.getByTestId('sell-fees')).toHaveValue('0.59');
  await page.getByTestId('sell-fees').fill('0.80');
  await page.getByTestId('sell-price').fill('12');
  await expect(page.getByTestId('sell-fees')).toHaveValue('0.80'); // your edit sticks
  await page.getByTestId('sell-save').click();
  await expect(page.getByTestId('breakdown')).toContainText('+£9.20');
});

test('stock shows unsold items, own stuff is kept out of trading income, delete has undo', async ({ page }) => {
  await page.goto('/');
  await finishIntro(page);
  await page.getByTestId('profit-add').click();
  await page.getByTestId('item-name').fill('Old phone');
  await page.getByTestId('platform-ebay').click();
  await page.getByTestId('item-cost').fill('0');
  await page.getByRole('radio', { name: 'My own stuff' }).click();
  await page.getByTestId('item-save').click();
  await page.getByTestId('item-sell').click();
  await page.getByTestId('sell-price').fill('80');
  await page.getByTestId('sell-save').click();
  await page.goto('/');
  await expect(page.getByTestId('trading')).toContainText('£0 of £1,000');

  await page.goto('/stock');
  await page.getByTestId('stock-add').click();
  await addItem(page, 'Lamp', 'facebook', '3');
  await page.goto('/stock');
  await expect(page.getByTestId('stock-Lamp')).toContainText('listed today');
  await page.getByTestId('stock-Lamp').click();
  await page.getByTestId('item-delete').click();
  await page.getByTestId('confirm-yes').click();
  await page.getByTestId('toast-action').click();
  await page.goto('/stock');
  await expect(page.getByTestId('stock-Lamp')).toBeVisible();
});

test('validation: an item needs a name and a cost', async ({ page }) => {
  await page.goto('/');
  await finishIntro(page);
  await page.getByTestId('profit-add').click();
  await page.getByTestId('item-save').click();
  await expect(page.getByText('What is it? A short name is fine.')).toBeVisible();
  await page.getByTestId('item-name').fill('Boots');
  await page.getByTestId('item-save').click();
  await expect(page.getByText('Enter what you paid (0 if it was free).')).toBeVisible();
});

test('learning cards: 20 free, sourced, quiz works, the 21st is Premium', async ({ page }) => {
  await page.goto('/');
  await finishIntro(page);
  await page.getByRole('tab', { name: /Learn/ }).click();
  await expect(page.getByTestId('cards-progress')).toContainText('0 of 30 cards read · 20 free');
  await page.getByTestId('card-c01').click();
  await expect(page.getByTestId('card-sheet')).toContainText('Source:');
  const quiz = page.getByTestId('card-quiz-0');
  if (await quiz.count()) await quiz.click();
  else await page.getByTestId('card-done').click();
  await page.getByTestId('sheet-close').click();
  await expect(page.getByTestId('cards-progress')).toContainText('1 of 30');
  await page.getByTestId('card-c21').click();
  await expect(page.getByTestId('paywall')).toBeVisible();
});
