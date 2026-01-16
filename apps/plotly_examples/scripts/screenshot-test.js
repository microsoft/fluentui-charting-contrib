/**
 * Automated Screenshot Testing for Vega Charts
 *
 * This script:
 * 1. Navigates to the Vega chart page
 * 2. Iterates through charts in the dropdown
 * 3. Takes screenshots of each chart
 * 4. Analyzes and reports issues
 *
 * Usage:
 *   node scripts/screenshot-test.js [--count N] [--start N]
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const VEGA_ROUTE = '/vega';
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots');
const ISSUES_FILE = path.join(__dirname, 'chart-issues.json');
const REPORT_FILE = path.join(__dirname, 'screenshot-report.md');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Issue tracking
const issues = [];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshots(count = 100, startIndex = 0) {
  console.log(`Starting screenshot capture (count: ${count}, start: ${startIndex})`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  try {
    // Navigate to Vega charts page
    console.log(`Navigating to ${BASE_URL}${VEGA_ROUTE}`);
    await page.goto(`${BASE_URL}${VEGA_ROUTE}`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(2000);

    // Get all schema options from dropdown
    const dropdownButton = await page.locator('button[role="combobox"]').first();
    await dropdownButton.click();
    await delay(500);

    // Get all options
    const options = await page.locator('[role="option"]').allTextContents();
    console.log(`Found ${options.length} schemas`);

    // Close dropdown
    await page.keyboard.press('Escape');
    await delay(200);

    // Use all available schemas
    const convertedSchemas = options;

    console.log(`Testing ${Math.min(count, convertedSchemas.length)} schemas (from ${options.length} available)`);

    const schemasToTest = convertedSchemas.slice(startIndex, startIndex + count);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < schemasToTest.length; i++) {
      const schemaName = schemasToTest[i];
      console.log(`[${i + 1}/${schemasToTest.length}] Testing: ${schemaName}`);

      try {
        // Clear previous errors
        consoleErrors.length = 0;
        pageErrors.length = 0;

        // Open dropdown and select schema
        const dropdown = await page.locator('button[role="combobox"]').first();
        await dropdown.click();
        await delay(300);

        // Find and click the option
        const option = await page.locator(`[role="option"]:has-text("${schemaName}")`).first();
        await option.click();
        await delay(1500); // Wait for chart to render

        // Take screenshot of the full page
        const screenshotPath = path.join(SCREENSHOT_DIR, `${schemaName.replace('.json', '')}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        // Check for errors
        const hasErrors = consoleErrors.length > 0 || pageErrors.length > 0;

        // Check if charts rendered (look for SVG or canvas elements)
        const fluentChartSvg = await page.locator('[data-testid="fluent-vega-chart"] svg').count();
        const nativeChartSvg = await page.locator('[data-testid="native-vega-chart"] svg').count();
        const nativeChartCanvas = await page.locator('[data-testid="native-vega-chart"] canvas').count();

        const fluentRendered = fluentChartSvg > 0;
        const nativeRendered = nativeChartSvg > 0 || nativeChartCanvas > 0;

        // Check for error boundaries (text containing "error" or "Error")
        const errorText = await page.locator(':text("error"):visible').count();
        const hasVisibleError = errorText > 0;

        // Record issues
        const issueRecord = {
          schema: schemaName,
          screenshot: screenshotPath,
          fluentRendered,
          nativeRendered,
          hasConsoleErrors: consoleErrors.length > 0,
          hasPageErrors: pageErrors.length > 0,
          hasVisibleError,
          consoleErrors: [...consoleErrors],
          pageErrors: [...pageErrors]
        };

        if (!fluentRendered || !nativeRendered || hasErrors || hasVisibleError) {
          issueRecord.status = 'ERROR';
          errorCount++;
          issues.push(issueRecord);
        } else {
          issueRecord.status = 'OK';
          successCount++;
        }

        console.log(`   ${issueRecord.status} - Fluent: ${fluentRendered ? 'OK' : 'FAIL'}, Native: ${nativeRendered ? 'OK' : 'FAIL'}`);

      } catch (error) {
        console.log(`   ERROR: ${error.message}`);
        issues.push({
          schema: schemaName,
          status: 'EXCEPTION',
          error: error.message
        });
        errorCount++;
      }
    }

    console.log(`\n========== SUMMARY ==========`);
    console.log(`Total tested: ${schemasToTest.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

    // Save issues to JSON
    fs.writeFileSync(ISSUES_FILE, JSON.stringify(issues, null, 2));
    console.log(`\nIssues saved to: ${ISSUES_FILE}`);

    // Generate markdown report
    generateReport(schemasToTest.length, successCount, errorCount);

  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    await browser.close();
  }
}

function generateReport(total, success, errors) {
  const report = `# Vega Chart Screenshot Test Report

## Summary
- **Total Tested:** ${total}
- **Success:** ${success} (${((success/total)*100).toFixed(1)}%)
- **Errors:** ${errors} (${((errors/total)*100).toFixed(1)}%)

## Issues Found

${issues.filter(i => i.status !== 'OK').map(issue => `
### ${issue.schema}
- **Status:** ${issue.status}
- **Fluent Rendered:** ${issue.fluentRendered ? 'Yes' : 'No'}
- **Native Rendered:** ${issue.nativeRendered ? 'Yes' : 'No'}
- **Console Errors:** ${issue.consoleErrors?.length || 0}
- **Page Errors:** ${issue.pageErrors?.length || 0}
${issue.consoleErrors?.length > 0 ? `\n**Console Errors:**\n\`\`\`\n${issue.consoleErrors.slice(0, 3).join('\n')}\n\`\`\`\n` : ''}
${issue.error ? `\n**Exception:** ${issue.error}\n` : ''}
`).join('\n---\n')}

## Passed Charts

${issues.filter(i => i.status === 'OK').slice(0, 20).map(i => `- ${i.schema}`).join('\n')}
${issues.filter(i => i.status === 'OK').length > 20 ? `\n... and ${issues.filter(i => i.status === 'OK').length - 20} more` : ''}

---
Generated: ${new Date().toISOString()}
`;

  fs.writeFileSync(REPORT_FILE, report);
  console.log(`Report saved to: ${REPORT_FILE}`);
}

// CLI
const args = process.argv.slice(2);
let count = 100;
let startIndex = 0;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--count' && args[i + 1]) {
    count = parseInt(args[i + 1]);
  }
  if (args[i] === '--start' && args[i + 1]) {
    startIndex = parseInt(args[i + 1]);
  }
}

takeScreenshots(count, startIndex).catch(console.error);
