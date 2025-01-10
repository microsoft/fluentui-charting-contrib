import { test, expect } from '@playwright/test';

test('Declarative Chart', async ({ page }) => {
  await page.goto('https://fluentchartstest.azurewebsites.net/');

  const combobox = page.getByRole('combobox');
  await combobox.last().click();
  const listbox = page.getByRole('listbox');
  const listitems = listbox.last().getByRole('option');
  const lisItemsCount = await listitems.count();
  const chartsListWithErrors = [33, 84, 87, 90, 91, 92, 98, 99, 100, 101, 167,168, 169, 170, 182, 183, 184, 185, 188, 189, 190, 191, 194, 195];
  for (let i = 0; i < lisItemsCount; i++) {
    if (!chartsListWithErrors.includes(i)) {
      await listitems.nth(i).scrollIntoViewIfNeeded();
      await listitems.nth(i).click();
      const chart = page.getByTestId('chart-container');
      await expect(chart).toHaveScreenshot();
      await combobox.last().click();
    }
  }
});
