import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export async function openStorybookPreview(
  page: Page,
  storyId: string,
  theme: 'Web Light' | 'Web Dark',
  mode: 'LTR' | 'RTL'
) {
  const iframe = page.locator('iframe[title="storybook-ref-charts"]');
  await expect(iframe).toBeVisible({ timeout: 30000 });
  await expect(iframe).toHaveAttribute('src', /\/iframe\.html(?:[?#]|$)/, { timeout: 30000 });
  const source = await iframe.getAttribute('src');
  if (!source) {
    throw new Error('The charts Storybook iframe has no preview URL');
  }
  const previewUrl = new URL(source, page.url());
  previewUrl.searchParams.set('id', storyId.toLowerCase());
  previewUrl.searchParams.set('viewMode', 'docs');
  const themeKey = 'storybook_fluentui-react-addon_theme';
  const directionKey = 'storybook_fluentui-react-addon_dir';
  const globals = (previewUrl.searchParams.get('globals')?.split(';') ?? [])
    .filter(value => value && !value.startsWith(`${themeKey}:`) && !value.startsWith(`${directionKey}:`));
  globals.push(`${themeKey}:${theme === 'Web Dark' ? 'web-dark' : 'web-light'}`);
  globals.push(`${directionKey}:${mode.toLowerCase()}`);
  previewUrl.searchParams.set('globals', globals.join(';'));
  const viewport = await iframe.evaluate(element => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }));
  await page.setViewportSize(viewport);
  await page.goto(previewUrl.href, { waitUntil: 'domcontentloaded' });
}

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

export async function expectStoryDirection(example: Locator, mode: 'LTR' | 'RTL') {
  const direction = mode.toLowerCase();
  const provider = example.locator('.fui-FluentProvider').first();
  await expect(provider, `Expected the chart provider to have dir="${direction}"`).toHaveAttribute('dir', direction);
  await expect(provider, `Expected the chart provider to render in ${direction}`).toHaveCSS('direction', direction);
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
