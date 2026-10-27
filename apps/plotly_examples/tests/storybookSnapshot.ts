import { expect, Locator } from '@playwright/test';

export async function waitForStoryReady(example: Locator) {
  await example.scrollIntoViewIfNeeded();
  await expect(example).toBeVisible();
  await expect.poll(
    () => example.evaluate(element => Boolean(element.querySelector('svg') || element.textContent?.trim())),
    { message: 'Expected the selected Storybook example to render content before capture' }
  ).toBe(true);
}

export async function expectStoryScreenshot(example: Locator, snapshotFilename: string) {
  await waitForStoryReady(example);
  await expect(example).toHaveScreenshot(snapshotFilename, {
    animations: 'disabled',
    maxDiffPixelRatio: 0.02,
  });
}
