/* eslint-disable no-loop-func */
import { test, expect, Page, BrowserContext } from '@playwright/test';
import { chartsListWithErrors, testMatrix } from './test-matrix';


for (const testConfig of testMatrix) {
  const theme = testConfig.theme;
  const mode = testConfig.mode;
  const locale = testConfig.locale;
  const testLocaleName = locale ? `-${locale}` : '';
  const highContrast = testConfig.highContrast ? '-HighContrast' : '';
  test.describe('', () => {
    let context: BrowserContext;
    let page: Page;

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
      test(`Declarative chart example ${index + 1}-${theme}-${mode} mode${testLocaleName}${highContrast}`, async () => {
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

        await listitems.nth(index).scrollIntoViewIfNeeded();
        await listitems.nth(index).click();
        const chart = page.getByTestId('chart-container');
        await page.mouse.move(0, 0); // Move mouse to top-left corner
        if (!chartsListWithErrors.includes(index + 1)) {
          await expect(chart).toHaveScreenshot();
          await combobox.last().click();
        } else {
          await expect(chart).not.toHaveScreenshot();
        }
      });

      test(`Declarative chart example ${index + 1}-${theme}-${mode} mode${testLocaleName}${highContrast} Download V9 Chart Image`, async () => {
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
        const listbox1 = page.getByRole('listbox');
        const listitems = listbox1.last().getByRole('option');
        await listitems.nth(index).scrollIntoViewIfNeeded();
        await listitems.nth(index).click();
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          page.getByRole('button', { name: "Download V9 Chart as Image" }).click()
        ]);
        const downloadedImageBuffer = await stream2buffer(await download.createReadStream())
        expect(downloadedImageBuffer).toMatchSnapshot(`downloaded-declarative-chart-example-${index + 1}-${theme}-${mode}mode${testLocaleName}${highContrast}.png`)
        await download.delete()
      });
    };
  });
}

async function stream2buffer(stream: Stream) {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf = Array<any>();
    stream.on("data", chunk => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", err => reject(`error converting stream - ${err}`));
  });
} 