import { test, expect } from '@playwright/test';

test('verify donut chart renders', async ({ page }) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  // Navigate directly to vega page
  await page.goto(`${baseUrl}/vega`, { timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  
  // Remove any overlay
  const overlay = page.locator('#webpack-dev-server-client-overlay');
  if (await overlay.count() > 0) {
    await overlay.evaluate((el) => el.remove());
  }
  
  // Collect console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Take initial screenshot
  await page.screenshot({ path: '/tmp/vega_page_initial.png' });
  
  // Get the schema dropdown
  const schemaDropdown = page.locator('button[role="combobox"]').last();
  await schemaDropdown.click({ timeout: 10000 });
  
  // Wait for listbox to appear
  const listbox = page.getByRole('listbox').last();
  await listbox.waitFor({ state: 'visible', timeout: 10000 });
  
  // Get all available options
  const options = await listbox.getByRole('option').all();
  const optionNames: string[] = [];
  for (const opt of options.slice(0, 20)) {
    const text = await opt.textContent();
    if (text) optionNames.push(text);
  }
  console.log('First 20 options:', optionNames);
  
  // Find donut option (might not be "donutchart" exactly)
  let donutOptionText = optionNames.find(n => n.toLowerCase().includes('donut'));
  if (!donutOptionText) {
    console.log('No donut option found in first 20, scrolling to search...');
    // Try to find it by searching all options
    for (const opt of options) {
      const text = await opt.textContent();
      if (text?.toLowerCase().includes('donut')) {
        donutOptionText = text;
        break;
      }
    }
  }
  
  console.log('Found donut option:', donutOptionText);
  
  if (donutOptionText) {
    const donutOption = listbox.getByRole('option', { name: donutOptionText, exact: true });
    await donutOption.scrollIntoViewIfNeeded({ timeout: 5000 });
    await donutOption.click({ timeout: 3000 });
    
    // Wait for chart to render
    await page.waitForTimeout(1000);
    
    // Check if fluent chart rendered
    const fluentChart = page.getByTestId('fluent-vega-chart');
    const fluentVisible = await fluentChart.isVisible().catch(() => false);
    
    console.log('Fluent chart visible:', fluentVisible);
    console.log('Console errors:', consoleErrors.filter(e => !e.includes('favicon') && !e.includes('DevTools')));
    
    // Take screenshot of chart
    await page.screenshot({ path: '/tmp/donut_chart_rendered.png' });
    
    expect(fluentVisible).toBe(true);
  } else {
    console.log('No donut chart option found');
    expect(false).toBe(true);
  }
});
