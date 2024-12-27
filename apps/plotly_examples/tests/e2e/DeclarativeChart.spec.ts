import { test, expect } from '@playwright/test';

test('Declarative Chart', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await expect(page.getByText('Data Visualization')).toBeVisible();
  const combobox = page.getByRole('combobox');
  await expect(combobox).toHaveCount(1);
  await combobox.click();
  const listbox = page.locator('.ms-Callout-main');
  await expect(listbox).toHaveCount(1);
  const listitems = listbox.getByRole('option');
  const lisItemsCount = await listitems.count();
  for (let i = 0; i < lisItemsCount; i++) {
    if (i != 33) {
      await listitems.nth(i).scrollIntoViewIfNeeded();
      await listitems.nth(i).click();
      const chart = page.getByTestId('chart-container');
      await expect(chart).toHaveScreenshot();
      await combobox.click();
    }
  }
});
