import { test, expect, Locator } from '@playwright/test';
import * as dotenv from 'dotenv';
import { totalChartExamplesCount, chartsListWithErrors, testMatrix } from './test-matrix';


test.beforeEach(async ({ page }) => {
  //Pass base URL as part of playwright command 
  //ex:  npx cross-env BASE_URL='https://fluentchartstest-stage.azurewebsites.net/' npx playwright test
  //await page.goto(process.env.BASE_URL!);
});


for (const testConfig of testMatrix) {
  const theme = testConfig.theme;
  const mode = testConfig.mode;
  const locale = testConfig.locale;
    //test.describe(`Declarative chart examples in ${theme} mode and ${mode} layout`, () => {
  for (let index = testConfig.startExampleIndex; index <= testConfig.endExampleIndex; index++) {
    const testLocaleName = locale ? `-${locale}` : '';
    test(`Declarative chart example ${index + 1}-${theme}-${mode} mode${testLocaleName}` , async ({ browser }) => {
      const context = await browser.newContext({ locale: locale });
      const page = await context.newPage();
      await page.goto(process.env.BASE_URL!);
      const iframe = page.locator('#webpack-dev-server-client-overlay');
      if (await iframe.count() > 0) {
        await iframe.evaluate((el) => el.remove()).catch(() => {
          console.warn("Failed to remove overlay iframe.");
        });
      }
      await page.getByRole('combobox').first().click();
      const listbox = page.getByRole('listbox');
      await listbox.getByRole('option').locator(`text=${theme}`).click();
      const rtlSwitch = page.getByTestId('rtl_switch');
      const isCurrentlyRTL = await rtlSwitch.isChecked();
      if ((mode === 'RTL' && !isCurrentlyRTL) || (mode === 'LTR' && isCurrentlyRTL)) {
        await rtlSwitch.click();
      }
      const combobox = page.getByRole('combobox');
      await combobox.nth(1).click();
      const listitems = listbox.last().getByRole('option');
      if (!chartsListWithErrors.includes(index)) {
        await listitems.nth(index).scrollIntoViewIfNeeded();
        await listitems.nth(index).click();
        const chart = page.getByTestId('chart-container');
        await page.mouse.move(0, 0); // Move mouse to top-left corner
        await expect(chart).toHaveScreenshot();
        await combobox.last().click();
      } else {
        test.fail();
      }
    });
  };
}
