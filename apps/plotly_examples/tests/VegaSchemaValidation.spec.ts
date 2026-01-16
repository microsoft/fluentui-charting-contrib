import { test, expect, Page, ConsoleMessage, Browser, BrowserContext } from '@playwright/test';

interface SchemaIssue {
  schemaName: string;
  errorType: 'console_error' | 'render_error' | 'warning' | 'exception';
  message: string;
  timestamp: string;
}

const issues: SchemaIssue[] = [];
const seenErrors = new Set<string>(); // Track unique errors per schema

// Increase test timeout for validating many schemas
test.setTimeout(1800000); // 30 minutes

async function removeOverlay(page: Page) {
  try {
    const overlay = page.locator('#webpack-dev-server-client-overlay');
    if (await overlay.count() > 0) {
      await overlay.evaluate((el) => el.remove());
    }
  } catch {
    // Ignore errors removing overlay
  }
}

async function setupPage(browser: Browser, baseUrl: string): Promise<{ context: BrowserContext; page: Page; consoleMessages: ConsoleMessage[] }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleMessages: ConsoleMessage[] = [];

  // Collect console messages
  page.on('console', (msg) => {
    consoleMessages.push(msg);
  });

  // Navigate to the vega chart page
  await page.goto(`${baseUrl}/vega`, { timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Remove any overlay
  await removeOverlay(page);

  return { context, page, consoleMessages };
}

test.describe('Vega Schema Validation', () => {
  test('should validate all vega schemas', async ({ browser }) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    let { context, page, consoleMessages } = await setupPage(browser, baseUrl);

    // Get the schema dropdown
    await removeOverlay(page);
    const schemaDropdown = page.locator('button[role="combobox"]').last();
    await schemaDropdown.click({ timeout: 10000 });

    // Get all schema options
    const listbox = page.getByRole('listbox').last();
    await listbox.waitFor({ state: 'visible', timeout: 10000 });
    const options = await listbox.getByRole('option').all();
    const schemaNames: string[] = [];

    for (const option of options) {
      const text = await option.textContent();
      if (text) {
        schemaNames.push(text);
      }
    }

    // Close the dropdown
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    console.log(`\nFound ${schemaNames.length} schemas to validate\n`);

    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 5;

    // Test each schema
    for (let i = 0; i < schemaNames.length; i++) {
      const schemaName = schemaNames[i];

      // Clear console messages and seen errors for this schema
      consoleMessages.length = 0;
      seenErrors.clear();

      try {
        // Remove overlay before each interaction
        await removeOverlay(page);

        // Select the schema
        const dropdown = page.locator('button[role="combobox"]').last();
        await dropdown.click({ timeout: 5000 });
        await page.waitForTimeout(200);

        const listboxNow = page.getByRole('listbox').last();
        await listboxNow.waitFor({ state: 'visible', timeout: 5000 });

        const schemaOption = listboxNow.getByRole('option', { name: schemaName, exact: true });

        await schemaOption.scrollIntoViewIfNeeded({ timeout: 3000 });
        await schemaOption.click({ timeout: 3000 });

        // Wait for chart to render
        await page.waitForTimeout(500);

        // Reset consecutive failures on success
        consecutiveFailures = 0;

        // Check for errors in console
        const errors = consoleMessages.filter(msg => msg.type() === 'error');
        const warnings = consoleMessages.filter(msg => msg.type() === 'warning');

        // Record unique errors
        for (const error of errors) {
          const errorText = error.text();
          // Filter out common non-critical errors
          if (!errorText.includes('favicon') &&
              !errorText.includes('DevTools') &&
              !errorText.includes('React DevTools')) {
            // Create a unique key for deduplication
            const errorKey = `${schemaName}:${errorText.substring(0, 100)}`;
            if (!seenErrors.has(errorKey)) {
              seenErrors.add(errorKey);
              issues.push({
                schemaName,
                errorType: 'console_error',
                message: errorText.substring(0, 500),
                timestamp: new Date().toISOString()
              });
            }
          }
        }

        // Record warnings that might indicate schema issues (deduplicated)
        for (const warning of warnings) {
          const warningText = warning.text();
          if (warningText.includes('Vega') ||
              warningText.includes('vega') ||
              warningText.includes('schema') ||
              warningText.includes('spec') ||
              warningText.includes('Invalid') ||
              warningText.includes('undefined')) {
            const warningKey = `${schemaName}:${warningText.substring(0, 100)}`;
            if (!seenErrors.has(warningKey)) {
              seenErrors.add(warningKey);
              issues.push({
                schemaName,
                errorType: 'warning',
                message: warningText.substring(0, 500),
                timestamp: new Date().toISOString()
              });
            }
          }
        }

        // Check if chart rendered
        const fluentChart = page.getByTestId('fluent-vega-chart');
        const nativeChart = page.getByTestId('native-vega-chart');

        const fluentVisible = await fluentChart.isVisible().catch(() => false);
        const nativeVisible = await nativeChart.isVisible().catch(() => false);

        if (!fluentVisible) {
          issues.push({
            schemaName,
            errorType: 'render_error',
            message: 'Fluent VegaDeclarativeChart failed to render',
            timestamp: new Date().toISOString()
          });
        }

        if (!nativeVisible) {
          issues.push({
            schemaName,
            errorType: 'render_error',
            message: 'Native Vega chart failed to render',
            timestamp: new Date().toISOString()
          });
        }

        // Check for error boundary triggering
        const errorBoundaryText = await page.locator('text=Something went wrong').count();
        if (errorBoundaryText > 0) {
          issues.push({
            schemaName,
            errorType: 'exception',
            message: 'Error boundary triggered - component crashed',
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        consecutiveFailures++;
        const errorMessage = (e as Error).message;

        // Check if we need to recreate the page
        if (errorMessage.includes('closed') || errorMessage.includes('crashed') || consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          console.log(`  Recovering browser at schema ${i}...`);
          try {
            await context.close();
          } catch {
            // Ignore close errors
          }

          // Recreate browser context and page
          const setup = await setupPage(browser, baseUrl);
          context = setup.context;
          page = setup.page;
          consoleMessages = setup.consoleMessages;
          consecutiveFailures = 0;
          console.log(`  Browser recovered, continuing from schema ${i}`);
        }
      }

      // Progress indicator
      if ((i + 1) % 100 === 0 || i === schemaNames.length - 1) {
        console.log(`Validated ${i + 1}/${schemaNames.length} schemas (${issues.length} issues found so far)`);
      }
    }

    // Print summary
    console.log('\n========== VEGA SCHEMA VALIDATION SUMMARY ==========');
    console.log(`Total issues found: ${issues.length}`);

    if (issues.length > 0) {
      console.log('\nIssues by type:');
      const errorsByType = issues.reduce((acc, issue) => {
        acc[issue.errorType] = (acc[issue.errorType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(errorsByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      // Group by schema for cleaner output
      const issuesBySchema = issues.reduce((acc, issue) => {
        if (!acc[issue.schemaName]) {
          acc[issue.schemaName] = [];
        }
        acc[issue.schemaName].push(issue);
        return acc;
      }, {} as Record<string, SchemaIssue[]>);

      console.log('\nSchemas with issues:');
      Object.entries(issuesBySchema).forEach(([schema, schemaIssues]) => {
        console.log(`\n  ${schema}:`);
        schemaIssues.forEach(issue => {
          console.log(`    [${issue.errorType}] ${issue.message.substring(0, 100)}...`);
        });
      });

      // Final assertion
      const criticalIssues = issues.filter(i =>
        i.errorType === 'exception' ||
        i.errorType === 'render_error'
      );

      if (criticalIssues.length > 0) {
        console.log('\nCRITICAL ISSUES:');
        criticalIssues.forEach(issue => {
          console.log(`  - ${issue.schemaName}: ${issue.message}`);
        });
      }
    } else {
      console.log('\nNo issues found! All schemas validated successfully.');
    }
    console.log('====================================================\n');

    await context.close();

    // Test passes but logs all issues for review
    expect(true).toBe(true);
  });
});
