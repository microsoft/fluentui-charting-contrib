import { expect, Locator, Page } from '@playwright/test';

export async function waitForStorybookReady(page: Page, example: Locator) {
  // The wrapper blocks pointer events even if its spinner is hidden.
  const loadingOverlay = page.locator('#preview-loader').locator('..');
  await expect(loadingOverlay, 'Expected the Storybook manager loading overlay to disappear').toBeHidden({ timeout: 30000 });
  await expect(example).toBeAttached({ timeout: 30000 });
  await waitForStoryReady(example);
  // The manager can show its loader while the iframe is rendering.
  await expect(loadingOverlay, 'Expected the Storybook manager loading overlay to disappear').toBeHidden({ timeout: 30000 });
}

export async function performStorybookAction(example: Locator, action: () => Promise<void>) {
  await waitForStorybookReady(example.page(), example);
  await action();
  await waitForStorybookReady(example.page(), example);
}

export async function waitForStoryReady(example: Locator) {
  await example.scrollIntoViewIfNeeded();
  await expect(example).toBeVisible();
  await expect.poll(
    () => example.evaluate(element => Boolean(element.querySelector('svg') || element.textContent?.trim())),
    { message: 'Expected the selected Storybook example to render content before capture' }
  ).toBe(true);
}

export async function expectStoryScreenshot(example: Locator, snapshotFilename: string) {
  const page = example.page();
  await waitForStorybookReady(page, example);
  await page.waitForTimeout(1000);
  await waitForStorybookReady(page, example);
  await expect(example).toHaveScreenshot(snapshotFilename, {
    animations: 'disabled',
    maxDiffPixelRatio: 0.02,
  });
}
