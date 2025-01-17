import { test, expect, Locator } from '@playwright/test';

const chartsListWithErrors = [33, 84, 87, 90, 91, 92, 98, 99, 100, 101, 167,168, 169, 170, 182, 183, 184, 185, 188, 189, 190, 191, 194, 195];
var totalChartExamplesCount = 252;
test.beforeEach( async ({ page }) => {
  await page.goto('https://fluentchartstest.azurewebsites.net/');
});

for (let index = 0; index < totalChartExamplesCount; index++) {
  test(`Declarative chart example ${ index + 1 }`, async ({ page }) => {
  const combobox = page.getByRole('combobox');
  await combobox.last().click();
  const listbox = page.getByRole('listbox');
  const listitems = listbox.last().getByRole('option');
  if (!chartsListWithErrors.includes(index)) {
    await listitems.nth(index).scrollIntoViewIfNeeded();
    await listitems.nth(index).click();
    const chart = page.getByTestId('chart-container');
    await expect(chart).toHaveScreenshot();
    await combobox.last().click();
  }
  });
};
