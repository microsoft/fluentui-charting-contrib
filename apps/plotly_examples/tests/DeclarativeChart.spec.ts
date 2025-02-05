import { test, expect, Locator } from '@playwright/test';
import * as dotenv from 'dotenv';

const chartsListWithErrors = [];
var totalChartExamplesCount = 302;

test.beforeEach( async ({ page }) => {
  //Pass base URL as part of playwright command 
  //ex:  npx cross-env BASE_URL='https://fluentchartstest-stage.azurewebsites.net/' npx playwright test
  await page.goto(process.env.BASE_URL);
});

for (let index = 0; index < totalChartExamplesCount; index++) {
  test(`Declarative chart example ${ index + 1 }`, async ({ page }) => {
   const iframe = page.locator('#webpack-dev-server-client-overlay');
   if (await iframe.count() > 0) {
      await iframe.evaluate((el) => el.remove()).catch(() => {
      console.warn("Failed to remove overlay iframe.");
    });
  }
  const combobox = page.getByRole('combobox');
  await combobox.nth(1).click();
  const listbox = page.getByRole('listbox');
  const listitems = listbox.last().getByRole('option');
  if (!chartsListWithErrors.includes(index)) {
    await listitems.nth(index).scrollIntoViewIfNeeded();
    await listitems.nth(index).click();
    const chart = page.getByTestId('chart-container');
    await expect(chart).toHaveScreenshot();
    await combobox.last().click();
  } else {
    test.fail();
  }
  });
};
