import { test, expect } from '@playwright/test';

test('verify polar/radar chart renders', async ({ page }) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  await page.goto(`${baseUrl}/vega`, { timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  
  // Remove overlay
  const overlay = page.locator('#webpack-dev-server-client-overlay');
  if (await overlay.count() > 0) {
    await overlay.evaluate((el) => el.remove());
  }
  
  // Collect console messages
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });
  
  // Open dropdown
  const schemaDropdown = page.locator('button[role="combobox"]').last();
  await schemaDropdown.click({ timeout: 10000 });
  
  const listbox = page.getByRole('listbox').last();
  await listbox.waitFor({ state: 'visible', timeout: 10000 });
  
  // Find radar_performance option
  const radarOption = listbox.getByRole('option', { name: 'radar_performance.json', exact: true });
  await radarOption.scrollIntoViewIfNeeded({ timeout: 5000 });
  await radarOption.click({ timeout: 3000 });
  
  // Wait for chart to render
  await page.waitForTimeout(1500);
  
  // Check rendering
  const fluentChart = page.getByTestId('fluent-vega-chart');
  const fluentVisible = await fluentChart.isVisible().catch(() => false);
  
  // Filter errors
  const relevantErrors = consoleErrors.filter(e => 
    !e.includes('favicon') && !e.includes('DevTools')
  );
  const relevantWarnings = consoleWarnings.filter(w => 
    w.includes('Vega') || w.includes('polar') || w.includes('theta') || w.includes('radius')
  );
  
  console.log('Fluent chart visible:', fluentVisible);
  console.log('Console errors:', relevantErrors);
  console.log('Relevant warnings:', relevantWarnings);
  
  await page.screenshot({ path: '/tmp/polar_chart_test.png' });
  
  expect(fluentVisible).toBe(true);
  expect(relevantErrors.length).toBe(0);
});
