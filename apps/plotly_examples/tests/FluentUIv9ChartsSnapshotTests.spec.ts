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

for (const chart of charts) {
  test(`should render ${chart.name} correctly`, async ({ page }) => {
    await page.goto(`https://fluentuipr.z22.web.core.windows.net/pull/33270/chart-docsite/storybook/index.html?path=/docs/${chart.path}`);
    await page.getByRole('link', { name: chart.name, exact: true }).click();
    const chartContainer = page.locator('iframe[title="storybook-preview-iframe"]');
    const frame = await chartContainer.contentFrame();
    const chartInner = frame.locator(chart.selector);
    await expect(chartInner).toBeVisible({ timeout: 10000 });
    const areaChartImages = await frame.locator(`[id^="story--charts-${chart.name.toLowerCase()}--"][id$="-inner"]`).elementHandles();
    for (const img of areaChartImages) {
      await img.scrollIntoViewIfNeeded();
      const imgId = await img.getAttribute('id');
      if (imgId) {
        const imgLocator = frame.locator(`#${imgId}`);
        await expect(imgLocator).toHaveScreenshot();
      }
    }
});
}
