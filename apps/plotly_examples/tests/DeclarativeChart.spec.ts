/* eslint-disable no-loop-func */
import { test, expect } from '@playwright/test';
import { chartsListWithErrors, testMatrix } from './test-matrix';


for (const testConfig of testMatrix) {
  const theme = testConfig.theme;
  const mode = testConfig.mode;
  const locale = testConfig.locale;
  const testLocaleName = locale ? `-${locale}` : '';
  const highContrast = testConfig.highContrast ? '-HighContrast' : '';
  test.describe('', () => {
    let context;
    let page;

    test.beforeAll(async ({ browser }) => {
      if (testConfig.highContrast) {
        context = await browser.newContext({ locale, forcedColors: 'active', colorScheme: theme === 'Dark'? 'dark': 'light' });
      }
      else {
        context = await browser.newContext({ locale });
      }

      page = await context.newPage();
      await page.goto(process.env.BASE_URL!);
    });

    test.afterAll(async () => {
      await context?.close();
    });
    for (let index = testConfig.startExampleIndex; index <= testConfig.endExampleIndex; index++) {
      test(`Declarative chart example ${index + 1}-${theme}-${mode} mode${testLocaleName}${highContrast}` , async () => {
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
        if (!chartsListWithErrors.includes(index + 1)) {
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
  });
}
