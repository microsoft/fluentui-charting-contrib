import { test, expect } from '@playwright/test';

// Function to sanitize file names for Windows compatibility
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}


const areaChartStories = [
  '#story--charts-areachart--area-chart-basic-inner',
  '#story--charts-areachart--area-chart-custom-accessibility-inner',
  '#story--charts-areachart--area-chart-large-data-inner',
  '#story--charts-areachart--area-chart-multiple-inner',
  '#story--charts-areachart--area-chart-negative-inner',
  '#story--charts-areachart--area-chart-multiple-negative-inner',
  '#story--charts-areachart--area-chart-all-negative-inner',
  '#story--charts-areachart--area-chart-secondary-y-axis-inner',
];

const donutChartStories = [
  '#story--charts-donutchart--donut-chart-basic-inner',
  '#story--charts-donutchart--donut-chart-custom-accessibility-inner',
  '#story--charts-donutchart--donut-chart-dynamic-inner',
  '#story--charts-donutchart--donut-chart-custom-callout-inner',
  '#story--charts-donutchart--donut-chart-styled-inner',
  '#story--charts-donutchart--donut-chart-responsive-inner',
];

const funnelChartStories = [
  '#story--charts-funnelchart--funnel-chart-basic-inner',
  '#story--charts-funnelchart--funnel-chart-stacked-inner'
];

const ganttChartStories = [
  '#story--charts-ganttchart--gantt-chart-basic-inner',
  '#story--charts-ganttchart--gantt-chart-grouped-inner'
];

const guageChartStories = [
  '#story--charts-gaugechart--gauge-chart-basic-inner',
  '#story--charts-gaugechart--gauge-chart-single-segment-inner',
  '#story--charts-gaugechart--gauge-chart-responsive-inner'
];

const gvbChartStories = [
  '#story--charts-groupedverticalbarchart--grouped-vertical-bar-default-inner',
  '#story--charts-groupedverticalbarchart--grouped-vertical-bar-negative-inner',
  '#story--charts-groupedverticalbarchart--grouped-vertical-bar-secondary-y-axis-inner'
];

const heatMapChartStories = [
  '#story--charts-heatmapchart--heat-map-chart-basic-inner',
  '#story--charts-heatmapchart--heat-map-chart-custom-accessibility-inner'
];

const horizontalBarChartStories = [
  '#story--charts-horizontalbarchart--horizontal-bar-basic-inner',
  '#story--charts-horizontalbarchart--horizontal-bar-absolute-scale-inner',
  '#story--charts-horizontalbarchart--horizontal-bar-benchmark-inner',
  '#story--charts-horizontalbarchart--horizontal-bar-stacked-inner',
  '#story--charts-horizontalbarchart--horizontal-bar-custom-accessibility-inner',
  '#story--charts-horizontalbarchart--horizontal-bar-custom-callout-inner',
  // '#story--charts-horizontalbarchart--horizontal-bar-stacked-annotated-inline-legend-inner',
];

const horizontalBarChartWithAxisStories = [
  '#story--charts-horizontalbarchartwithaxis--horizontal-bar-with-axis-basic-inner',
  '#story--charts-horizontalbarchartwithaxis--horizontal-bar-with-axis-string-axis-tooltip-inner',
  '#story--charts-horizontalbarchartwithaxis--horizontal-bar-with-axis-dynamic-inner'
];

const legendsStories = [
  '#story--charts-legends--legends-basic-inner',
  '#story--charts-legends--legends-overflow-inner',
  '#story--charts-legends--legends-styled-inner',
  '#story--charts-legends--legends-wrap-lines-inner',
  '#story--charts-legends--legends-controlled-inner'
];

const lineChartStories = [
  '#story--charts-linechart--line-chart-basic-inner',
  '#story--charts-linechart--line-chart-custom-accessibility-inner',
  '#story--charts-linechart--line-chart-multiple-inner',
  '#story--charts-linechart--line-chart-styled-inner',
  '#story--charts-linechart--line-chart-custom-locale-date-axis-inner',
  '#story--charts-linechart--line-chart-events-inner',
  '#story--charts-linechart--line-chart-gaps-inner',
  '#story--charts-linechart--line-chart-large-data-inner',
  '#story--charts-linechart--line-chart-negative-inner',
  '#story--charts-linechart--line-chart-all-negative-inner',
  '#story--charts-linechart--line-chart-secondary-y-axis-inner',
];

const sankeyChartStories = [
  '#story--charts-sankeychart--sankey-chart-basic-inner',
  '#story--charts-sankeychart--sankey-chart-inbox-inner',
  '#story--charts-sankeychart--sankey-chart-rebalance-inner',
  '#story--charts-sankeychart--sankey-chart-responsive-inner'
];

const scatterChartStories = [
  '#story--charts-scatterchart--scatter-chart-default-inner',
  '#story--charts-scatterchart--scatter-chart-date-inner',
  '#story--charts-scatterchart--scatter-chart-string-inner',
];

const sparklineChartStories = [
  '#story--charts-sparkline--sparkline-basic--primary-inner'
];

const verticalBarChartStories = [
  '#story--charts-verticalbarchart--vertical-bar-default-inner',
  '#story--charts-verticalbarchart--vertical-bar-custom-accessibility-inner',
  '#story--charts-verticalbarchart--vertical-bar-date-axis-inner',
  '#story--charts-verticalbarchart--vertical-bar-axis-tooltip-inner',
  '#story--charts-verticalbarchart--vertical-bar-rotate-labels-inner',
  '#story--charts-verticalbarchart--vertical-bar-styled-inner',
  '#story--charts-verticalbarchart--vertical-bar-dynamic-inner',
  '#story--charts-verticalbarchart--vertical-bar-all-negative-inner',
  '#story--charts-verticalbarchart--vertical-bar-negative-inner',
  '#story--charts-verticalbarchart--vertical-bar-chart-responsive-inner',
  '#story--charts-verticalbarchart--vertical-bar-secondary-y-axis-inner',
];

const verticalStackedBarChartStories = [
  '#story--charts-verticalstackedbarchart--vertical-stacked-bar-default-inner',
  '#story--charts-verticalstackedbarchart--vertical-stacked-bar-axis-tooltip-inner',
  '#story--charts-verticalstackedbarchart--vertical-stacked-bar-callout-inner',
  '#story--charts-verticalstackedbarchart--vertical-stacked-bar-custom-accessibility-inner',
  '#story--charts-verticalstackedbarchart--vertical-stacked-bar-date-axis-inner',
  '#story--charts-verticalstackedbarchart--vertical-stacked-bar-negative-inner',
  '#story--charts-verticalstackedbarchart--vertical-stacked-bar-secondary-y-axis-inner',
];

const charts = [
  { name: 'AreaChart', path: 'charts-areachart--docs', selector: '#story--charts-areachart--area-chart-basic--primary-inner', stories: areaChartStories },
  { name: 'DonutChart', path: 'charts-DonutChart--docs', selector: '#story--charts-donutchart--donut-chart-basic--primary-inner' , stories: donutChartStories},
  { name: 'FunnelChart', path: 'charts-FunnelChart--docs', selector: '#story--charts-funnelchart--funnel-chart-basic--primary-inner', stories: funnelChartStories },
  { name: 'GanttChart', path: 'charts-GanttChart--docs', selector: '#story--charts-ganttchart--gantt-chart-basic--primary-inner', stories: ganttChartStories },
  { name: 'GaugeChart', path: 'charts-GaugeChart--docs', selector: '#story--charts-gaugechart--gauge-chart-basic--primary-inner' , stories: guageChartStories},
  { name: 'GroupedVerticalBarChart', path: 'charts-GroupedVerticalBarChart--docs', selector: '#story--charts-groupedverticalbarchart--grouped-vertical-bar-default--primary-inner' , stories: gvbChartStories},
  { name: 'HeatMapChart', path: 'charts-HeatMapChart--docs', selector: '#story--charts-heatmapchart--heat-map-chart-basic--primary-inner', stories: heatMapChartStories },
  { name: 'HorizontalBarChart', path: 'charts-HorizontalBarChart--docs', selector: '#story--charts-horizontalbarchart--horizontal-bar-basic--primary-inner' , stories: horizontalBarChartStories},
  { name: 'HorizontalBarChartWithAxis', path: 'charts-HorizontalBarChartWithAxis--docs', selector: '#story--charts-horizontalbarchartwithaxis--horizontal-bar-with-axis-basic--primary-inner' , stories: horizontalBarChartWithAxisStories},
  { name: 'Legends', path: 'charts-Legends--docs', selector: '#story--charts-legends--legends-basic--primary-inner', stories: legendsStories },
  { name: 'LineChart', path: 'charts-LineChart--docs', selector: '#story--charts-linechart--line-chart-basic--primary-inner', stories: lineChartStories },
  { name: 'SankeyChart', path: 'charts-SankeyChart--docs', selector: '#story--charts-sankeychart--sankey-chart-basic--primary-inner', stories: sankeyChartStories },
  { name: 'ScatterChart', path: 'charts-ScatterChart--docs', selector: '#story--charts-scatterchart--scatter-chart-default--primary-inner', stories: scatterChartStories },
  { name: 'Sparkline', path: 'charts-Sparkline--docs', selector: '#story--charts-sparkline--sparkline-basic--primary-inner', stories: sparklineChartStories },
  { name: 'VerticalBarChart', path: 'charts-VerticalBarChart--docs', selector: '#story--charts-verticalbarchart--vertical-bar-default--primary-inner', stories: verticalBarChartStories },
  { name: 'VerticalStackedBarChart', path: 'charts-VerticalStackedBarChart--docs', selector: '#story--charts-verticalstackedbarchart--vertical-stacked-bar-default--primary-inner', stories: verticalStackedBarChartStories },
];

const themes = ['web-light', 'web-dark'];
const modes = ['LTR', 'RTL'];

async function loadChartPage(
  page: any,
  chart: { name: string; path: string; selector: string },
  theme: string,
  mode: string
) {
  await page.goto('http://localhost:3000/?path=/docs/introduction--docs');
  await page.getByLabel('Shortcuts').click();
  await page.locator('#list-item-T').click();
  await page.getByRole('button', { name: /Theme:/ }).click();
  await page.locator(`#list-item-${theme}`).click();
  await page.getByRole('button', { name: chart.name, exact: true }).click();
  // Check current direction and only click if needed
  const directionButton = await page.getByRole('button', { name: /Direction:/ });
  const directionText = await directionButton.textContent();
  if ((mode === 'RTL' && directionText?.includes('LTR')) ||
    (mode === 'LTR' && directionText?.includes('RTL'))) {
    await directionButton.click();
  }
  await page.getByLabel('Shortcuts').click();
  await page.locator('#list-item-T').click();
  const chartContainer = page.locator('iframe[title="storybook-preview-iframe"]');
  const frame = await chartContainer.contentFrame();
  if (!frame) throw new Error('Could not get content frame');
  const chartInner = frame.locator(chart.selector);
  await expect(chartInner).toBeVisible({ timeout: 30000 });
  return frame;
}

// Helper to interact with controls and take screenshots
async function interactWithLegends(frame: any, imgId: string, screenshotName: string) {
  const legendItems = frame.locator(`#${imgId} button[type="button"][role="option"]`);
  const count = await legendItems.count();
  if (count > 0) {
    await legendItems.first().click();
    const label = await legendItems.first().getAttribute('aria-label');
    const labelText = label ? label.split('(')[0].trim() : 'unknown';
    const sanitizedLabelText = sanitizeFileName(labelText);
    const sanitizedScreenshotName = sanitizeFileName(screenshotName);
    const path = `apps/plotly_examples/tests/FluentUIv9ChartsSnapshotTests.spec.ts-snapshots/${sanitizedScreenshotName}-${sanitizedLabelText}-legend-click.png`;
    await frame.locator(`#${imgId}`).screenshot({ path: path });
  }
}

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

async function interactWithSliders(frame: any, imgId: string, screenshotName: string) {
  const sliders = frame.locator(`#${imgId} input[type="range"]`);
  for (let i = 0, count = await sliders.count(); i < count; i++) {
    const slider = sliders.nth(i);
    if (!(await slider.isEnabled())) {
      continue;
    }
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

for (const chart of charts) {
  for (const mode of modes) {
    for (const theme of themes) {
      test.describe(`${chart.name} [${theme}] [${mode}]`, () => {
        for (const exampleSelector of chart.stories) {
          test(`Legend Action - ${exampleSelector.split('--').slice(-1)[0].trim()}`, async ({ page }) => {
            const frame = await loadChartPage(page, chart, theme, mode);
            const example = frame.locator(exampleSelector);
            await example.scrollIntoViewIfNeeded();
            const imgId = await example.getAttribute('id');
            const dataName = await example.getAttribute('data-name');
            if (imgId) {
              const screenshotName = sanitizeFileName(`${dataName || `${chart.name} basic`} [${theme}] [${mode}]`);
              await interactWithLegends(frame, imgId, screenshotName);
            }
          });

          test(`Radio button Action - ${exampleSelector.split('--').slice(-1)[0].trim()}`, async ({ page }) => {
            const frame = await loadChartPage(page, chart, theme, mode);
            const example = frame.locator(exampleSelector);
            await example.scrollIntoViewIfNeeded();
            const imgId = await example.getAttribute('id');
            const dataName = await example.getAttribute('data-name');
            if (imgId) {
              const screenshotName = sanitizeFileName(`${dataName || `${chart.name} basic`} [${theme}] [${mode}]`);
              await interactWithRadios(frame, imgId, screenshotName);
            }
          });

          test(`slider Action - ${exampleSelector.split('--').slice(-1)[0].trim()}`, async ({ page }) => {
            const frame = await loadChartPage(page, chart, theme, mode);
            const example = frame.locator(exampleSelector);
            await example.scrollIntoViewIfNeeded();
            const imgId = await example.getAttribute('id');
            const dataName = await example.getAttribute('data-name');
            if (imgId) {
              const screenshotName = sanitizeFileName(`${dataName || `${chart.name} basic`} [${theme}] [${mode}]`);
              await interactWithSliders(frame, imgId, screenshotName);
            }
          });

           test(`Switch Action - ${exampleSelector.split('--').slice(-1)[0].trim()}`, async ({ page }) => {
            const frame = await loadChartPage(page, chart, theme, mode);
            const example = frame.locator(exampleSelector);
            await example.scrollIntoViewIfNeeded();
            const imgId = await example.getAttribute('id');
            const dataName = await example.getAttribute('data-name');
            if (imgId) {
              const screenshotName = sanitizeFileName(`${dataName || `${chart.name} basic`} [${theme}] [${mode}]`);
              await interactWithSwitches(frame, imgId, screenshotName);
            }
          });
        }
      });
    }
  }
}
