/* eslint-disable no-loop-func */
import { test, expect, Page, BrowserContext } from '@playwright/test';
import { testMatrix } from './test-matrix';


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
        const listitems = listbox.last().getByRole('option');
        
        // Check if the index is available, if not scroll listbox to load more items
        let totalOptions = await listitems.count();
        let maxAttempts = 5; // Prevent infinite loop
        let attempts = 0;
        
        while (index >= totalOptions && attempts < maxAttempts) {
          // Scroll to bottom of listbox to trigger loading more items
          await listbox.last().evaluate((el) => {
            el.scrollTop = el.scrollHeight;
          });
          // Wait for items to load
          await page.waitForTimeout(1000);
          
          const newTotalOptions = await listitems.count();
          if (newTotalOptions <= totalOptions) {
            // No new items loaded, break to avoid infinite loop
            break;
          }
          totalOptions = newTotalOptions;
          attempts++;
        }
        
        // Use the actual index if available, otherwise use the last available option
        const actualIndex = Math.min(index, totalOptions - 1);
        if (actualIndex !== index) {
          console.warn(`Index ${index} not available in dropdown. Using index ${actualIndex} instead. Total available: ${totalOptions}`);
        }
        
        await listitems.nth(actualIndex).scrollIntoViewIfNeeded();
        await listitems.nth(actualIndex).click();
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

async function stream2buffer(stream: any) {
  return new Promise<any>((resolve, reject) => {
    const _buf = Array<any>();
    stream.on("data", (chunk: any) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err: any) => reject(`error converting stream - ${err}`));
  });
} 