import { test, expect } from '@playwright/test';
import { startExampleTestIndexLocalization, endExampleTestIndexLocalization, chartsListWithErrors } from './test-matrix';

test.beforeEach(async ({ page }) => {
  //Pass base URL as part of playwright command 
  // ex:  npx cross-env BASE_URL='https://fluentchartstest-stage.azurewebsites.net/' npx playwright test
  await page.goto("http://localhost:3000/");
});

for (let index = 960; index < 991; index++) {
  test(`Declarative chart example ${index + 1}`, async ({ page }) => {
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
    } else {
      test.fail();
    }
  });

  test(`Declarative chart example ${index + 1} Download V9 Chart Image`, async ({ page }) => {
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
    await listitems.nth(index).scrollIntoViewIfNeeded();
    await listitems.nth(index).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: "Download V9 Chart as Image" }).click()
    ]);
    const downloadedImageBuffer = await stream2buffer(await download.createReadStream())
    expect(downloadedImageBuffer).toMatchSnapshot(`downloaded-declarative-chart-example-${index + 1}.png`)
    await download.delete()
  });
};

async function stream2buffer(stream: Stream) {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf = Array<any>();
    stream.on("data", chunk => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", err => reject(`error converting stream - ${err}`));
  });
} 