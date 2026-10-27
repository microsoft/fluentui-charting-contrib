import { test, expect } from '@playwright/test';
import { expectStoryScreenshot, waitForStoryReady } from './storybookSnapshot';

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
  await expectStoryScreenshot(frame.locator('#story'), 'finished-chart.png');
  await expect(frame.locator('svg')).toHaveCSS('opacity', '1');
});
