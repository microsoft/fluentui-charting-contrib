import { test, expect } from '@playwright/test';

const chartsListWithErrors = [];
var totalChartExamplesCount = 302;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

for (let index = 0; index < totalChartExamplesCount; index++) {
  test(`Declarative chart example ${index + 1}`, async ({ page }) => {
    // if (!process.env.USE_STAGING_URL) {
    //   const iframe = page.locator('#webpack-dev-server-client-overlay');
    //   await iframe.evaluate((el) => el.remove());
    // }
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
    } else {
      test.fail();
    }
  });

  test(`Declarative chart example ${index + 1} downloaded image`, async ({ page }) => {
    // if (!process.env.USE_STAGING_URL) {
    //   const iframe = page.locator('#webpack-dev-server-client-overlay');
    //   await iframe.evaluate((el) => el.remove());
    // }
    const combobox = page.getByRole('combobox');
    await combobox.last().click();
    const listbox = page.getByRole('listbox');
    const listitems = listbox.last().getByRole('option');
    await listitems.nth(index).scrollIntoViewIfNeeded();
    await listitems.nth(index).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: "Download as Image" }).click()
    ]);
    const downloadedImageBuffer = await stream2buffer(await download.createReadStream())
    expect(downloadedImageBuffer).toMatchSnapshot(`downloaded-declarative-chart-example-${index + 1}.png`)
    await download.delete()
    await combobox.last().click();
  });
};

async function stream2buffer(stream) {
  return new Promise((resolve, reject) => {
    const _buf = [];
    stream.on("data", chunk => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", err => reject(`error converting stream - ${err}`));
  });
} 