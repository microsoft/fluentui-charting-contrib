import { test, expect } from '@playwright/test';

// This test suite validates the rendering of various chart components in the Fluent UI React library documentation site.
const charts = [
  { name: 'AreaChart', path: 'charts-areachart--docs', selector: '#story--charts-areachart--area-chart-basic--primary-inner' },
  { name: 'DeclarativeChart', path: 'charts-declarativechart--docs', selector: '#story--charts-declarativechart--declarative-chart-basic-example--primary-inner' },
  { name: 'DonutChart', path: 'charts-DonutChart--docs', selector: '#story--charts-donutchart--donut-chart-basic--primary-inner' },
  { name: 'GaugeChart', path: 'charts-GaugeChart--docs', selector: '#story--charts-gaugechart--gauge-chart-basic--primary-inner' },
  { name: 'GroupedVerticalBarChart', path: 'charts-GroupedVerticalBarChart--docs', selector: '#story--charts-groupedverticalbarchart--grouped-vertical-bar-default--primary-inner' },
  { name: 'HeatMapChart', path: 'charts-HeatMapChart--docs', selector: '#story--charts-heatmapchart--heat-map-chart-basic--primary-inner' },
  { name: 'HorizontalBarChart', path: 'charts-HorizontalBarChart--docs', selector: '#story--charts-horizontalbarchart--horizontal-bar-basic--primary-inner' },
  { name: 'HorizontalBarChartWithAxis', path: 'charts-HorizontalBarChartWithAxis--docs', selector: '#story--charts-horizontalbarchartwithaxis--horizontal-bar-with-axis-basic--primary-inner' },
  { name: 'Legends', path: 'charts-Legends--docs', selector: '#story--charts-legends--legends-basic--primary-inner' },
  { name: 'LineChart', path: 'charts-LineChart--docs', selector: '#story--charts-linechart--line-chart-basic--primary-inner' },
  { name: 'SankeyChart', path: 'charts-SankeyChart--docs', selector: '#story--charts-sankeychart--sankey-chart-basic--primary-inner' },
  { name: 'ScatterChart', path: 'charts-ScatterChart--docs', selector: '#story--charts-scatterchart--scatter-chart-default--primary-inner' },
  { name: 'Sparkline', path: 'charts-Sparkline--docs', selector: '#story--charts-sparkline--sparkline-basic--primary-inner' },
  { name: 'VerticalBarChart', path: 'charts-VerticalBarChart--docs', selector: '#story--charts-verticalbarchart--vertical-bar-default--primary-inner' },
  { name: 'VerticalStackedBarChart', path: 'charts-VerticalStackedBarChart--docs', selector: '#story--charts-verticalstackedbarchart--vertical-stacked-bar-default--primary-inner' },
];


// Helper to interact with controls and take screenshots
async function interactWithRadios(frame: any, imgId: string) {
  const radios = frame.locator(`#${imgId} input[type="radio"]`);
  for (let i = 0, count = await radios.count(); i < count; i++) {
    await radios.nth(i).click();
    await expect(frame.locator(`#${imgId}`)).toHaveScreenshot();
  }
}

async function interactWithSwitches(frame: any, imgId: string) {
  const switches = frame.locator(`#${imgId} input[type="checkbox"], #${imgId} input[type="switch"]`);
  for (let i = 0, count = await switches.count(); i < count; i++) {
    const control = switches.nth(i);
    await expect(frame.locator(`#${imgId}`)).toHaveScreenshot();
    if (!(await control.isChecked())) {
      await control.check();
    } else {
      await control.uncheck();
    }
    await expect(frame.locator(`#${imgId}`)).toHaveScreenshot();
  }
}

async function interactWithSliders(frame: any, imgId: string) {
  const sliders = frame.locator(`#${imgId} input[type="range"]`);
  for (let i = 0, count = await sliders.count(); i < count; i++) {
    const slider = sliders.nth(i);
    const min = Number(await slider.getAttribute('min')) || 0;
    const max = Number(await slider.getAttribute('max')) || 100;
    const middle = Math.round((min + max) / 2);
    await slider.fill(middle.toString());
    await expect(frame.locator(`#${imgId}`)).toHaveScreenshot();
  }
}

async function interactWithLegends(frame: any, imgId: string) {
  const legendItems = frame.locator(`#${imgId} button[type="button"][role="option"]`);
  const count = await legendItems.count();
  for (let i = 0; i < count; i++) {
    const item = legendItems.nth(i);
    await item.click();
    await expect(frame.locator(`#${imgId}`)).toHaveScreenshot();
  }
}

const themes = ['web-light', 'web-dark'];
const modes = ["LTR", "RTL"];

for (const theme of themes) {
  for (const mode of modes) {
    for (const chart of charts) {
      async function loadChartPage(page: any, chart: { name: string; path: string }) {
        const url = `http://localhost:3000/?path=/docs/`;
        await page.goto(url);
        await page.getByLabel('Shortcuts').click();
        await page.locator('#list-item-T').click();
        await page.getByRole('button', { name: /Theme:/ }).click();
        await page.locator(`#list-item-${theme}`).click();
        await page.getByRole('link', { name: chart.name, exact: true }).click();
        // Check current direction and only click if needed
        const directionButton = await page.getByRole('button', { name: /Direction:/ });
        const directionText = await directionButton.textContent();
        if ((mode === 'RTL' && directionText?.includes('LTR')) ||
            (mode === 'LTR' && directionText?.includes('RTL'))) {
          await directionButton.click();
        }
        await page.getByLabel('Shortcuts').click();
        await page.locator('#list-item-T').click();
        await page.getByRole('link', { name: chart.name, exact: true }).click();
        const chartContainer = page.locator('iframe[title="storybook-preview-iframe"]');
        const frame = await chartContainer.contentFrame();
        if (!frame) throw new Error('Could not get content frame');
        const chartInner = frame.locator(chart.selector);
        await expect(chartInner).toBeVisible({ timeout: 10000 });
        return frame;
      }

      test.describe(`${chart.name} chart interactions`, () => {
        test(`Radio button actions-${theme}-${mode} mode`, async ({ page }) => {
          const frame = await loadChartPage(page, chart);
          const chartImages = await frame.locator(`[id^="story--charts-${chart.name.toLowerCase()}--"][id$="-inner"]`).elementHandles();
          for (const img of chartImages) {
            await img.scrollIntoViewIfNeeded();
            const imgId = await img.getAttribute('id');
            if (imgId) {
              await interactWithRadios(frame, imgId);
            }
          }
        });

        test(`Switch actions-${theme}-${mode} mode`, async ({ page }) => {
          const frame = await loadChartPage(page, chart);
          const chartImages = await frame.locator(`[id^="story--charts-${chart.name.toLowerCase()}--"][id$="-inner"]`).elementHandles();
          for (const img of chartImages) {
            await img.scrollIntoViewIfNeeded();
            const imgId = await img.getAttribute('id');
            if (imgId) {
              await interactWithSwitches(frame, imgId);
            }
          }
        });

        test(`Slider actions-${theme}-${mode} mode`, async ({ page }) => {
          const frame = await loadChartPage(page, chart);
          const chartImages = await frame.locator(`[id^="story--charts-${chart.name.toLowerCase()}--"][id$="-inner"]`).elementHandles();
          for (const img of chartImages) {
            await img.scrollIntoViewIfNeeded();
            const imgId = await img.getAttribute('id');
            if (imgId) {
              await interactWithSliders(frame, imgId);
            }
          }
        });

        test(`legend actions-${theme}-${mode} mode`, async ({ page }) => {
          const frame = await loadChartPage(page, chart);
          const chartImages = await frame.locator(`[id^="story--charts-${chart.name.toLowerCase()}--"][id$="-inner"]`).elementHandles();
          for (const img of chartImages) {
            await img.scrollIntoViewIfNeeded();
            const imgId = await img.getAttribute('id');
            if (imgId) {
              // Interact with legend items by type="button" and role="option"
              await interactWithLegends(frame, imgId);
            }
          }
        });
      });
    }
  }
}