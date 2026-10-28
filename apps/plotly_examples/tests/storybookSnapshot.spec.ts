import { test, expect, Page } from '@playwright/test';
import { expectStoryScreenshot, performStorybookAction, waitForStorybookReady, waitForStoryReady } from './storybookSnapshot';

async function showLoadingOverlay(page: Page) {
  await page.evaluate(() => {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = 'position: fixed; inset: 0; background: white; z-index: 9999';
    overlay.innerHTML = '<div id="preview-loader" style="display: none"></div>';
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 300);
  });
}

for (const action of ['legend', 'radio', 'slider', 'switch'] as const) {
  test(`waits for overlays appearing after setup and after a ${action} action`, async ({ page }) => {
    await page.setContent('<iframe title="storybook-ref-charts" style="width: 600px; height: 500px"></iframe>');
    const frame = page.frames()[1];
    await frame.setContent(`
      <div id="story">
        <button type="button" role="option" aria-selected="false"
          onclick="this.setAttribute('aria-selected', 'true')">Complete</button>
        <input type="radio">
        <input type="range" min="0" max="100" value="0">
        <input type="checkbox" role="switch">
      </div>
    `);
    const example = frame.locator('#story');
    await waitForStorybookReady(page, example);
    await showLoadingOverlay(page);
    await expect(page.locator('#preview-loader')).toBeHidden();
    await expect(page.locator('#loading-overlay')).toBeVisible();

    await performStorybookAction(example, async () => {
      expect(await page.locator('#loading-overlay').isVisible()).toBe(false);
      switch (action) {
        case 'legend':
          await example.getByRole('option').click({ timeout: 1000 });
          break;
        case 'radio':
          await example.getByRole('radio').check({ timeout: 1000 });
          break;
        case 'slider':
          await example.getByRole('slider').fill('50');
          break;
        case 'switch':
          await example.getByRole('switch').click({ timeout: 1000 });
          break;
      }
      await showLoadingOverlay(page);
    });

    expect(await page.locator('#loading-overlay').isVisible()).toBe(false);
    switch (action) {
      case 'legend':
        await expect(example.getByRole('option')).toHaveAttribute('aria-selected', 'true');
        break;
      case 'radio':
        await expect(example.getByRole('radio')).toBeChecked();
        break;
      case 'slider':
        await expect(example.getByRole('slider')).toHaveValue('50');
        break;
      case 'switch':
        await expect(example.getByRole('switch')).toBeChecked();
        break;
    }
  });
}

for (const loadingOrder of ['loader-first', 'story-last', 'loader-during-render'] as const) {
  test(`waits for the parent loader and iframe content: ${loadingOrder}`, async ({ page }) => {
    await page.setContent(`
      <iframe title="storybook-ref-charts" style="width: 600px; height: 500px"></iframe>
      <div id="loading-overlay" style="position: fixed; inset: 0; background: white">
        <div id="preview-loader" role="progressbar">Loading</div>
      </div>
    `);
    const frame = page.frames()[1];
    await frame.setContent(`
      <input role="switch" type="checkbox" id="dir-switch_r_test_">
      <div id="story" style="width: 300px; height: 200px"><div></div></div>
    `);
    await page.evaluate(order => {
      const overlay = document.getElementById('loading-overlay')!;
      overlay.hidden = order === 'loader-during-render';
      if (order === 'loader-during-render') {
        setTimeout(() => { overlay.hidden = false; }, 50);
      }
      setTimeout(() => { overlay.remove(); }, order === 'story-last' ? 100 : 600);
    }, loadingOrder);
    await frame.evaluate(order => {
      const render = () => {
        document.getElementById('story')!.innerHTML =
          '<svg width="300" height="200"><rect width="300" height="200" fill="blue"/></svg>';
      };
      if (order === 'loader-first') {
        render();
      } else {
        setTimeout(render, 300);
      }
    }, loadingOrder);

    const example = page.locator('iframe[title="storybook-ref-charts"]').contentFrame().locator('#story');
    await waitForStorybookReady(page, example);

    await expect(page.locator('#loading-overlay')).toBeHidden();
    await expect(example.locator('svg')).toBeVisible();
    await frame.getByRole('switch').click({ timeout: 1000 });
    await expect(frame.getByRole('switch')).toBeChecked();
  });
}

test('waits for the selected lazy story, not an already rendered sibling', async ({ page }) => {
  await page.setContent('<iframe title="storybook-ref-charts" style="width: 600px; height: 500px"></iframe>');
  const frame = page.frames()[1];
  await frame.setContent(`
    <div id="first">Already rendered</div>
    <div style="height: 2000px"></div>
    <div id="selected" style="width: 300px; height: 200px"><div></div></div>
    <script>
      const selected = document.querySelector('#selected');
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer.disconnect();
          setTimeout(() => {
            selected.innerHTML = '<svg width="300" height="200"><rect width="300" height="200" fill="blue"/></svg>';
          }, 200);
        }
      });
      observer.observe(selected);
    </script>
  `);

  const example = frame.locator('#selected');
  await waitForStoryReady(example);
  await expect(example.locator('svg')).toBeVisible();
});

test('supports HTML-only legends', async ({ page }) => {
  await page.setContent('<div id="story"><button role="option">Series one</button></div>');
  await waitForStoryReady(page.locator('#story'));
});

test('rejects a blank story instead of accepting its empty wrapper', async ({ page }) => {
  await page.setContent('<div id="story" style="width: 300px; height: 200px"><div></div></div>');
  await expect(waitForStoryReady(page.locator('#story'))).rejects.toThrow(
    'Expected the selected Storybook example to render content before capture'
  );
});

test('captures the finished chart rather than its blank animation frame', async ({ page }, testInfo) => {
  // This SVG-only baseline does not depend on platform fonts.
  testInfo.snapshotSuffix = '';
  await page.setContent('<iframe title="storybook-ref-charts" style="width: 600px; height: 500px"></iframe>');
  const frame = page.frames()[1];
  await frame.setContent(`
    <style>
      @keyframes reveal { from { opacity: 0; } to { opacity: 1; } }
      svg { animation: reveal 60s steps(1, end); }
    </style>
    <div id="story" style="width: 300px; height: 200px">
      <svg width="300" height="200">
        <rect width="300" height="200" fill="#202020"/>
        <rect x="30" y="20" width="60" height="160" fill="#0078d4"/>
        <rect x="130" y="60" width="60" height="120" fill="#0078d4"/>
      </svg>
    </div>
  `);

  await expect(frame.locator('svg')).toHaveCSS('opacity', '0');
  await showLoadingOverlay(page);
  const captureStartedAt = performance.now();
  await expectStoryScreenshot(frame.locator('#story'), 'finished-chart.png');
  expect(performance.now() - captureStartedAt).toBeGreaterThanOrEqual(1000);
  await expect(page.locator('#loading-overlay')).toBeHidden();
  await expect(frame.locator('svg')).toHaveCSS('opacity', '1');
});
