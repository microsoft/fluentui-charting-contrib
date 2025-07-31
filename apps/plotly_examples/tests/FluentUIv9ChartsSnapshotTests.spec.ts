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
async function interactWithRadios(frame: any, imgId: string, screenshotName: string) {
  const radios = frame.locator(`#${imgId} input[type="radio"]`);
  for (let i = 0, count = await radios.count(); i < count; i++) {
    await radios.nth(i).click();
    const label = await frame.locator(`label[for="${await radios.nth(i).getAttribute('id')}"]`).textContent();
    const labelText = label.split('(')[0].trim();
    const path = `apps/plotly_examples/tests/FluentUIv9ChartsSnapshotTests.spec.ts-snapshots/${screenshotName}-${labelText.toLowerCase()} radio-button-click.png`;
    await frame.locator(`#${imgId}`).screenshot({ path: path });
  }
}

async function interactWithSwitches(frame: any, imgId: string, screenshotName: string) {
  const switches = frame.locator(`#${imgId} input[type="checkbox"], #${imgId} input[type="switch"]`);
  for (let i = 0, count = await switches.count(); i < count; i++) {
    const control = switches.nth(i);
    await expect(frame.locator(`#${imgId}`)).toHaveScreenshot();
    if (!(await control.isChecked())) {
      await control.check();
    } else {
      await control.uncheck();
    }
    const label = await frame.locator(`label[for="${await control.getAttribute('id')}"]`).textContent();
    const labelText = label.split('(')[0].trim();
    const path = `apps/plotly_examples/tests/FluentUIv9ChartsSnapshotTests.spec.ts-snapshots/${screenshotName}-${labelText.toLowerCase()} checkbox-click.png`;
    await frame.locator(`#${imgId}`).screenshot({ path: path });
  }
}

async function interactWithSliders(frame: any, imgId: string, screenshotName: string) {
  const sliders = frame.locator(`#${imgId} input[type="range"]`);
  for (let i = 0, count = await sliders.count(); i < count; i++) {
    const slider = sliders.nth(i);
    const min = Number(await slider.getAttribute('min')) || 0;
    const max = Number(await slider.getAttribute('max')) || 100;
    const middle = Math.round((min + max) / 2);
    await slider.fill(middle.toString());
    // Try to get the label associated with the slider by its id
    const sliderId = await slider.getAttribute('id');
    const sliderIdText = sliderId.split('(')[0].trim();
    const path = `apps/plotly_examples/tests/FluentUIv9ChartsSnapshotTests.spec.ts-snapshots/${screenshotName}-${sliderIdText.toLowerCase()} slider-value-change.png`;
    await frame.locator(`#${imgId}`).screenshot({ path: path });
  }
}

async function interactWithLegends(frame: any, imgId: string, screenshotName: string) {
  const legendItems = frame.locator(`#${imgId} button[type="button"][role="option"]`);
  const count = await legendItems.count();
  if (count > 0) {
    await legendItems.first().click(); // Click the first item to ensure the legend is visible
    
    const label = await legendItems.first().getAttribute('aria-label');
    const labelText = label.split('(')[0].trim();
    const path = `apps/plotly_examples/tests/FluentUIv9ChartsSnapshotTests.spec.ts-snapshots/${screenshotName}-${labelText.toLowerCase()} legend-click.png`;
    await frame.locator(`#${imgId}`).screenshot({ path: path });
  }
}

const themes = ['web-light', 'web-dark'];
const modes = ["LTR", "RTL"];

for (const theme of themes) {
  for (const mode of modes) {
    for (const chart of charts) {
      async function loadChartPage(page: any, chart: { name: string; path: string }) {
        const url = `${process.env.BASE_URL!}`;
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

      test.describe(`${chart.name} chart`, () => {
        test(`Radio button actions-${theme}-${mode} mode`, async ({ page }) => {
          const frame = await loadChartPage(page, chart);
          const chartImages = await frame.locator(`[id^="story--charts-${chart.name.toLowerCase()}--"][id$="-inner"]`).elementHandles();
          // Capture data-name attribute from each chart image
          for (const img of chartImages) {
            await img.scrollIntoViewIfNeeded();
            const imgId = await img.getAttribute('id');
            const dataName = await img.getAttribute('data-name');
            // Append dataName to the screenshot name for better identification
            const screenshotName = `${dataName || `${chart.name} basic`} example-${theme}-${mode} mode -`;
            if (imgId) {
              await interactWithRadios(frame, imgId, screenshotName);
            }
          }
        });

        test(`Switch actions-${theme}-${mode} mode`, async ({ page }) => {
          const frame = await loadChartPage(page, chart);
          const chartImages = await frame.locator(`[id^="story--charts-${chart.name.toLowerCase()}--"][id$="-inner"]`).elementHandles();
          for (const img of chartImages) {
            await img.scrollIntoViewIfNeeded();
            const imgId = await img.getAttribute('id');
            const dataName = await img.getAttribute('data-name');
            // Append dataName to the screenshot name for better identification
            const screenshotName = `${dataName || `${chart.name} basic`} example-${theme}-${mode} mode -`;
            if (imgId) {
              await interactWithSwitches(frame, imgId, screenshotName);
            }
          }
        });

        test(`Slider actions-${theme}-${mode} mode`, async ({ page }) => {
          const frame = await loadChartPage(page, chart);
          const chartImages = await frame.locator(`[id^="story--charts-${chart.name.toLowerCase()}--"][id$="-inner"]`).elementHandles();
          for (const img of chartImages) {
            await img.scrollIntoViewIfNeeded();
            const imgId = await img.getAttribute('id');
            const dataName = await img.getAttribute('data-name');
            // Append dataName to the screenshot name for better identification
            const screenshotName = `${dataName || `${chart.name} basic`} example-${theme}-${mode} mode -`;
            if (imgId) {
              await interactWithSliders(frame, imgId, screenshotName);
            }
          }
        });

        test(`legend actions-${theme}-${mode} mode`, async ({ page }) => {
          const frame = await loadChartPage(page, chart);
          const chartImages = await frame.locator(`[id^="story--charts-${chart.name.toLowerCase()}--"][id$="-inner"]`).elementHandles();
          for (const img of chartImages) {
            await img.scrollIntoViewIfNeeded();
            const imgId = await img.getAttribute('id');
            const dataName = await img.getAttribute('data-name');
            // Append dataName to the screenshot name for better identification
            const screenshotName = `${dataName || `${chart.name} basic`} example-${theme}-${mode} mode -`;
            if (imgId) {
              // Interact with legend items by type="button" and role="option"
              await interactWithLegends(frame, imgId, screenshotName);
            }
          }
        });
      });
    }
  }
}