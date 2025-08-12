// Enhanced Dashboard Scraping Agent with MCP Sampling Integration
import path from 'path';
import fs from 'fs';
import { extractJsonArray, extractViewScreenshotsLink, logEvent } from '../utils.js';
import { PlaywrightMCPClient } from '../playwrightClient.js';

export const feedbackLogsScrapingAgent = async (
  args: {
    dashboardUrl?: string;
    outputDir?: string;
    includeOcvLinks?: boolean;
    maxIssuesPerDate?: number;
    query?: string;
    saveJson?: boolean;
    saveLog?: boolean;
  },
  _extra: any
): Promise<{ content: { type: "text"; text: string }[] }> => {
  const {
    dashboardUrl: argDashboardUrl,
    outputDir = path.join(process.cwd(), 'ocv_logs'),
    includeOcvLinks = true,
    maxIssuesPerDate = 100,
    query = '',
    saveJson = true,
    saveLog = true,
  } = args;

  const dashboardUrl = argDashboardUrl || "https://copilotdash.microsoft.com/product/feedback?product=M365ChatWebChat&queryId=b6b4f975-8a88-4eac-a675-805fcb1a071b&from=2025-08-07T00%3A00%3A00Z&to=2025-08-07T23%3A59%3A59Z&searchText=chart&prefix=All&triggeredSkill=Code+interpreter&optionsSets=code_interpreter_interactive_charts&tab=allFeedback&systemTags=Reference%3AInteractiveChart";

  // Extract time range from dashboardUrl
  let timeRange = '';
  let issue_folder_path = '';
  logEvent('DEBUG', 'feedbackLogsScrapingAgent', 'dashboard URL: ', { dashboardUrl });
  try {
    const urlObj = new URL(dashboardUrl);
    const from = urlObj.searchParams.get('from') || '';
    const to = urlObj.searchParams.get('to') || '';
    if (from && to) {
      // Clean up for filesystem
      const fromClean = from.replace(/[:%]/g, '-');
      const toClean = to.replace(/[:%]/g, '-');
      timeRange = `from_${fromClean}_to_${toClean}`;
    }
  } catch (e) {
    // Ignore if URL parsing fails
    timeRange = '';
  }

  // Create timestamp-based session directory to avoid debug.log in root
  const sessionTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sessionDir = path.join(outputDir, `session_${sessionTimestamp}${timeRange ? '_' + timeRange : ''}`);

  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const debugLog = path.join(sessionDir, 'debug.log');
  const logMessage = (message: string) => {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    console.log(`[DASHBOARD-AGENT] ${message}`);
    fs.appendFileSync(debugLog, logLine, 'utf8');
    logEvent('DEBUG', 'feedbackLogsScrapingAgent', message, { dashboardUrl, outputDir: sessionDir });
  };

  let stepSuccess = true;
  let extractedJson: any = null;
  let errorDetails = '';
  let allRowsData: any[] = [];
  const client = new PlaywrightMCPClient();

  // Set the session directory for JSON file saving
  client.setSessionDir(sessionDir);

  try {
    logMessage('Starting enhanced dashboard scraping workflow with MCP sampling integration');

    // Connect to playwright (in headed mode to see what's happening)
    await client.connect(false); // headed mode
    logMessage('Connected to Playwright MCP server');

    // Step 1: Navigate to dashboard
    logMessage(`Step 1: Navigating to ${dashboardUrl}`);
    try {
      await client.callTool('mcp_playwright-mc_browser_navigate', { url: dashboardUrl });
      logMessage('Successfully navigated to dashboard');

      // Wait for page to load completely
      logMessage('Waiting 10 seconds for page to load...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      logMessage('Page load wait completed');

      // Wait for loading indicators to disappear and data to load
      logMessage('Waiting for data table to load...');
      let dataLoadAttempts = 0;
      const maxDataLoadAttempts = 5;
      let dataLoaded = false;

      while (!dataLoaded && dataLoadAttempts < maxDataLoadAttempts) {
        dataLoadAttempts++;
        try {
          const loadingStatusResult = await client.callTool('mcp_playwright-mc_browser_evaluate', {
            function: `() => {
              // Check for loading indicators
              const loadingElements = document.querySelectorAll('progressbar, .loading, .spinner, [role="progressbar"]');
              const hasLoadingIndicators = Array.from(loadingElements).some(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden';
              });
              
              // Check for table/grid content
              const tableSelectors = [
                '[role="grid"]',
                '[role="table"]', 
                'table',
                '.data-grid',
                '.ag-grid',
                '.table-container',
                '[role="row"]:not([aria-rowindex="1"])',
                'tbody tr'
              ];
              
              let hasTableContent = false;
              for (const selector of tableSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                  hasTableContent = true;
                  break;
                }
              }
              
              // Check for error states
              const errorElements = document.querySelectorAll('.error, .no-data, .empty-state');
              const hasErrors = errorElements.length > 0;
              
              return {
                hasLoadingIndicators: hasLoadingIndicators,
                hasTableContent: hasTableContent,
                hasErrors: hasErrors,
                readyState: document.readyState,
                url: window.location.href,
                attempt: ${dataLoadAttempts}
              };
            }`
          });

          // Extract the actual result from the playwright response
          let loadingStatus = loadingStatusResult;
          if (typeof loadingStatusResult === 'string') {
            try {
              // If it's a string response, try to parse the JSON from it
              const match = loadingStatusResult.match(/### Result\s*(\{.*?\})/s);
              if (match) {
                loadingStatus = JSON.parse(match[1]);
              }
            } catch (parseErr) {
              logMessage(`Could not parse loadingStatus from string response: ${parseErr}`);
              // Continue with the assumption that data is loaded
              dataLoaded = true;
              break;
            }
          }

          logMessage(`Data load check [Attempt ${dataLoadAttempts}]: Loading=${loadingStatus.hasLoadingIndicators}, Table=${loadingStatus.hasTableContent}, Errors=${loadingStatus.hasErrors}, ReadyState=${loadingStatus.readyState}`);

          if (!loadingStatus.hasLoadingIndicators && loadingStatus.hasTableContent) {
            dataLoaded = true;
            logMessage('Data appears to be loaded - no loading indicators and table content found');
            break;
          }

          if (loadingStatus.hasErrors) {
            logMessage('Error state detected on page, proceeding anyway');
            dataLoaded = true;
            break;
          }

          // Wait before next check - increased wait time
          await new Promise(resolve => setTimeout(resolve, 5000));

        } catch (err) {
          logMessage(`Data load check error [Attempt ${dataLoadAttempts}]: ${err}`);
          try {
            let errStr = '';
            if (typeof err === 'string') {
              errStr = err;
            } else if (err && typeof err === 'object') {
              if ('message' in err && typeof (err as any).message === 'string') {
                errStr = String((err as any).message);
              } else {
                errStr = JSON.stringify(err);
              }
            }
            if (errStr) {
              const match = errStr.match(/### Result\s*({[\s\S]*?})/);
              if (match && match[1]) {
                const parsedErr = JSON.parse(match[1]);
                if (parsedErr.hasTableContent) {
                  logMessage('Found valid data in error message, proceeding');
                  dataLoaded = true;
                  break;
                }
              }
            }
          } catch (e) {
            // JSON parsing failed
            logMessage(`In data load check error, error parsing JSON from error message: ${e}`);
          }

          // Check if the error message contains valid JSON data
          if (typeof err === 'string' && err.includes('"hasTableContent": true')) {
            logMessage('Found valid data in error message, proceeding');
            dataLoaded = true;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      if (!dataLoaded) {
        logMessage(`Data load timeout after ${maxDataLoadAttempts} attempts, proceeding anyway`);
      } else {
        logMessage('Data loading completed successfully');
      }
    } catch (err) {
      logMessage(`Navigation error: ${err}`);
      logMessage('Continuing anyway to check if page loaded...');
      // Don't mark as failure yet - check if rows can be found despite the error
    }

    await new Promise(resolve => setTimeout(resolve, 10000));

    // Save page snapshot for metadata
    // enableTicketIdInColumnSettings();

    // Step 2: Get all available rows and process them sequentially
    logMessage('Step 2: Getting all available table rows');
    let allRowsData: any[] = [];

    try {
      // Wait longer for initial data to load before attempting scroll
      logMessage('Waiting additional time for data to fully load before starting scroll...');
      let initialDataWaitAttempts = 0;
      const maxInitialWaitAttempts = 10;
      let hasInitialData = false;

      while (!hasInitialData && initialDataWaitAttempts < maxInitialWaitAttempts) {
        initialDataWaitAttempts++;
        try {
          const initialRowCheck = await client.callTool('mcp_playwright-mc_browser_evaluate', {
            function: `() => {
              const rowSelectors = [
                '[role="row"]:not([aria-rowindex="1"])',
                'div[role="rowgroup"] [role="row"]',
                'div[role="grid"] [role="row"]:not(:first-child)',
                '[role="row"]',
                'tr:not(:first-child)',
                'tbody tr'
              ];
              
              let maxRows = 0;
              for (const selector of rowSelectors) {
                const rows = document.querySelectorAll(selector);
                if (rows.length > maxRows) {
                  maxRows = rows.length;
                }
              }
              
              // Also check if loading indicators are gone
              const loadingElements = document.querySelectorAll('progressbar, .loading, .spinner, [role="progressbar"]');
              const isLoading = Array.from(loadingElements).some(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden';
              });
              
              return { rowCount: maxRows, isLoading: isLoading };
            }`
          });

          const currentRowCount = initialRowCheck.rowCount || 0;
          const isLoading = initialRowCheck.isLoading;
          logMessage(`Initial data check [Attempt ${initialDataWaitAttempts}]: Found ${currentRowCount} rows, Loading=${isLoading}`);

          if (currentRowCount > 0 && !isLoading) {
            hasInitialData = true;
            logMessage(`Initial data loaded: ${currentRowCount} rows available, proceeding with scroll`);
            break;
          }

          // Wait before next check
          await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (err) {
          logMessage(`Initial data check error [Attempt ${initialDataWaitAttempts}]: ${err}`);
          try {
            let errStr = '';
            if (typeof err === 'string') {
              errStr = err;
            } else if (err && typeof err === 'object') {
              if ('message' in err && typeof (err as any).message === 'string') {
                errStr = String((err as any).message);
              } else {
                errStr = JSON.stringify(err);
              }
            }
            if (errStr) {
              const match = errStr.match(/### Result\s*({[\s\S]*?})/);
              if (match && match[1]) {
                const parsedErr = JSON.parse(match[1]);
                // Handle isLoading property in error result
                if (typeof parsedErr.isLoading === 'boolean') {
                  logMessage(`Error result has isLoading=${parsedErr.isLoading}`);
                  if (!parsedErr.isLoading) {
                    logMessage('isLoading is false in error result, proceeding');
                    hasInitialData = true;
                    break;
                  }
                }
              }
            }
          } catch (e) {
            logMessage(`In initial data check error, error parsing JSON from error message: ${e}`);
          }
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      if (!hasInitialData) {
        logMessage('Initial data wait timeout, proceeding with scroll anyway');
      }

      // Simple scroll approach - just scroll down multiple times to load more content
      logMessage('Starting simplified scroll approach to load all available rows...');
      const scrollAttempts = 10;

      for (let i = 0; i < scrollAttempts; i++) {
        try {
          logMessage(`Scroll attempt ${i + 1}/${scrollAttempts}`);

          // Simple scroll using window
          await client.callTool(
            'mcp_playwright-mc_browser_evaluate', {
            function: `() => {
              try {
                // Find the scrollable container (AG Grid viewport)
                const scrollableSelectors = [
                  '.ag-body-viewport',
                  '.ag-center-cols-viewport', 
                  '.ag-body-horizontal-scroll-viewport',
                  '[role="grid"]',
                  '.ag-root-wrapper',
                  '.table-container',
                  'main',
                  window
                ];
                
                let scrollTarget = null;
                for (const selector of scrollableSelectors) {
                  if (selector === window) {
                    scrollTarget = window;
                    break;
                  }
                  const elem = document.querySelector(selector);
                  if (elem) {
                    scrollTarget = elem;
                    break;
                  }
                }
                
                if (scrollTarget) {
                  // Progressive scroll by chunks
                  const currentScroll = scrollTarget === window ? window.pageYOffset : scrollTarget.scrollTop;
                  const scrollIncrement = 1000; // Larger scroll increments for faster loading
                  
                  if (scrollTarget === window) {
                    window.scrollBy(0, scrollIncrement);
                  } else {
                    scrollTarget.scrollTop = currentScroll + scrollIncrement;
                  }
                  
                  return { 
                    success: true, 
                    scrolled: true,
                    scrollHeight: scrollTarget.scrollHeight || document.body.scrollHeight,
                    scrollTop: scrollTarget === window ? window.pageYOffset : scrollTarget.scrollTop,
                    increment: scrollIncrement
                  };
                }
                
                return { success: false, message: 'No scrollable container found' };
              } catch (error) {
                return { success: false, message: 'Scroll error: ' + error.toString() };
              }
            }`
          });

          // Wait for content to load
          await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (scrollErr) {
          logMessage(`Scroll attempt ${i + 1} failed, continuing: ${scrollErr}`);
          // Continue with next scroll attempt even if this one fails
          let getAllRowsResult = await client.callTool('mcp_playwright-mc_browser_evaluate', {
            function: `() => {
            var selectors = [
              '[role="row"]:not([aria-rowindex="1"])',
              'div[role="rowgroup"] [role="row"]',
              'div[role="grid"] [role="row"]:not(:first-child)',
              '[role="row"]',
              'tr:not(:first-child)',
              'tbody tr',
              '[role="gridcell"]',
              '.grid-row',
              '.data-row',
              '.feedback-row',
              '.issue-card',
              '[data-row]',
              '.dashboard-row',
              '.table-row',
              '.ag-row',
              '.ag-row-even',
              '.ag-row-odd'
            ];
            var foundSelector = null;
            var rows = [];
            var gridElements = [];
            // Try each selector
            for (var i = 0; i < selectors.length; i++) {
              var found = document.querySelectorAll(selectors[i]);
              console.log('Trying selector:', selectors[i], 'Found:', found.length);
              if (found.length > 0) {
                rows = Array.prototype.slice.call(found);
                foundSelector = selectors[i];
                break;
              }
            }
            // If no rows found, try to find any clickable elements in grids/tables
            if (rows.length === 0) {
              gridElements = document.querySelectorAll('[role="grid"], [role="table"], table, .data-grid, .ag-grid');
              for (var j = 0; j < gridElements.length; j++) {
                var clickableInGrid = gridElements[j].querySelectorAll('[role="row"], tr, .row, [data-row-index]');
                if (clickableInGrid.length > 1) { // More than just header
                  rows = Array.prototype.slice.call(clickableInGrid).slice(1); // Skip header
                  foundSelector = 'grid_children';
                  break;
                }
              }
            }
            if (rows.length > 0) {
              // Store row information for sequential processing
              var rowsData = rows.map((row, index) => {
                // Find the sentiment value from the 'Emotion type' column
                let sentiment = null;
                let ticketId = null;
                try {
                  // Find all cells in this row
                  const cells = row.querySelectorAll('td, [role="gridcell"], .ag-cell');
                  // Find the header row (assume it's the first row in the table or grid)
                  let headerCells = [];
                  let table = row.closest('table');
                  if (table) {
                    const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
                    if (headerRow) {
                      headerCells = Array.from(headerRow.querySelectorAll('th, td'));
                    }
                  } else {
                    // Try to find header in grid
                    const grid = row.closest('[role="grid"]');
                    if (grid) {
                      const headerRow = grid.querySelector('[role="row"]');
                      if (headerRow) {
                        headerCells = Array.from(headerRow.querySelectorAll('[role="columnheader"], [role="gridcell"], th, td'));
                      }
                    }
                  }
                  // Find the index of the 'Emotion type' column
                  let emotionColIndex = -1;
                  let ticketIdColIndex = -1;
                  for (let i = 0; i < headerCells.length; i++) {
                    const text = (headerCells[i].textContent || '').trim().toLowerCase();
                    if (text === 'emotion type') {
                      emotionColIndex = i;
                    }
                    if (text === 'ticket id' || text === 'ticketid' || text === 'ticket-id') {
                      ticketIdColIndex = i;
                    }
                  }
                  // If found, get the cell value for this row
                  if (emotionColIndex >= 0 && cells.length > emotionColIndex) {
                    sentiment = (cells[emotionColIndex].textContent || '').trim();
                  }
                  if (ticketIdColIndex >= 0 && cells.length > ticketIdColIndex) {
                    ticketId = (cells[ticketIdColIndex].textContent || '').trim();
                  }
                } catch (e) {
                  sentiment = null;
                  ticketId = null;
                }
                return {
                  index: index,
                  id: row.id || row.getAttribute('data-row-id') || row.getAttribute('aria-rowindex') || 'row_' + index,
                  // Extract ticketId from cell, attribute, or text
                  ticketId: ticketId || (() => {
                    let tid = row.getAttribute('data-ticket-id');
                    if (tid) return tid;
                    const text = (row.textContent || '');
                    const match = text.match(/ticket[ _-]?id[:\s]*([a-zA-Z0-9\-]+)/i);
                    return match ? match[1] : null;
                  })(),
                  text: (row.textContent || '').substring(0, 200),
                  selector: foundSelector,
                  className: row.className || '',
                  tagName: row.tagName || '',
                  sentiment: sentiment
                };
              });
              return { 
                success: true, 
                message: 'Found rows: ' + rows.length, 
                rowCount: rows.length, 
                rows: rowsData, 
                selector: foundSelector,
                debug: {
                  gridElements: gridElements.length,
                  triedSelectors: selectors
                }
              };
            }
            // Debug info if no rows found
            var debugInfo = {
              allElements: document.querySelectorAll('*').length,
              gridElements: document.querySelectorAll('[role="grid"], [role="table"], table').length,
              rowElements: document.querySelectorAll('[role="row"]').length,
              trElements: document.querySelectorAll('tr').length,
              hasProgressBar: document.querySelectorAll('progressbar, [role="progressbar"]').length > 0,
              bodyText: document.body ? document.body.textContent.substring(0, 500) : 'No body'
            };
            return { 
              success: false, 
              message: 'No clickable rows found', 
              triedSelectors: selectors,
              debug: debugInfo
            };
          }`
          });

          logMessage('All rows result: ' + JSON.stringify(getAllRowsResult));
          // save the rows to a json file. Append to the json if it exists
          const rowsJsonFile = path.join(sessionDir, 'all_rows_data.json');
          if (getAllRowsResult && Array.isArray(getAllRowsResult)) {
            if (fs.existsSync(rowsJsonFile)) {
              const existingData = JSON.parse(fs.readFileSync(rowsJsonFile, 'utf8'));
              if (Array.isArray(existingData)) {
                getAllRowsResult = existingData.concat(getAllRowsResult);
              }
            }
            fs.writeFileSync(rowsJsonFile, JSON.stringify(getAllRowsResult, null, 2), 'utf8');
            logMessage(`Saved all rows data to ${rowsJsonFile}`);
          } else {
            logMessage(`No valid rows found in getAllRowsResult: ${JSON.stringify(getAllRowsResult)}`);
          }
        }
      }

      logMessage(`Scrolling completed after ${scrollAttempts} attempts. Final row count check...`);

      // Final wait for any remaining content to load
      await new Promise(resolve => setTimeout(resolve, 5000));

      const rowsJsonFile = path.join(sessionDir, 'all_rows_data.json');
      const data = fs.existsSync(rowsJsonFile) ? JSON.parse(fs.readFileSync(rowsJsonFile, 'utf8')) : [];
      // Deduplicate by 'id' (or another unique property)
      const seen = new Set();
      const uniqueRows = data.filter((item: any) => {
        const key = item.ticketId || item.id; // fallback to text if no id
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (uniqueRows.length) {
        allRowsData = uniqueRows;
        logMessage(`Found ${allRowsData.length} rows to process`);
        fs.writeFileSync(rowsJsonFile, JSON.stringify(allRowsData, null, 2), 'utf8');
      } else {
        stepSuccess = false;
        errorDetails += 'No rows found to process\n';
        logMessage('No rows found to process');
      }
    } catch (err) {
      stepSuccess = false;
      errorDetails += 'Get rows error: ' + err + '\n';
      logMessage('Get rows error: ' + err);
    }

    // Process each row sequentially with proper error handling
    for (let rowIndex = 0; rowIndex < Math.min(allRowsData.length, maxIssuesPerDate); rowIndex++) {
      const currentRow = allRowsData[rowIndex];
      issue_folder_path = path.join(sessionDir, `issue_${currentRow.ticketId || currentRow.id || rowIndex + 1}`);
      fs.mkdirSync(issue_folder_path, { recursive: true });
      client.setSessionIssueDir(sessionDir, issue_folder_path);

      // Ensure previous row has fully completed before starting next
      logMessage(`Starting row ${rowIndex + 1}/${Math.min(allRowsData.length, maxIssuesPerDate)} (current time: ${new Date().toISOString()})`);
      logMessage(`Row data: ${currentRow.text.substring(0, 100)}...`);

      // Verify we start with a clean state (no open dialogs)
      logMessage(`Pre-row cleanup: Ensuring no dialogs are open before processing row ${rowIndex}`);
      try {
        const preCleanupCheck = await client.callTool('mcp_playwright-mc_browser_evaluate', {
          function: `() => {
            // Check for any open dialogs before starting
            const dialogs = document.querySelectorAll('[role="dialog"], [role="modal"], .modal, .dialog, .panel, .ms-Dialog, .ms-Panel');
            let openDialogs = 0;
            const openDialogInfo = [];
            
            for (const dialog of dialogs) {
              const style = window.getComputedStyle(dialog);
              const rect = dialog.getBoundingClientRect();
              
              if (style.display !== 'none' && style.visibility !== 'hidden' && 
                  style.opacity !== '0' && rect.width > 0 && rect.height > 0) {
                openDialogs++;
                openDialogInfo.push({
                  className: dialog.className,
                  id: dialog.id,
                  tagName: dialog.tagName
                });
              }
            }
            
            return {
              hasOpenDialogs: openDialogs > 0,
              openDialogCount: openDialogs,
              dialogInfo: openDialogInfo
            };
          }`
        });

        if (preCleanupCheck.hasOpenDialogs) {
          logMessage(`Found ${preCleanupCheck.openDialogCount} open dialogs before row ${rowIndex}, cleaning up...`);

          // Force close any open dialogs
          await client.callTool('mcp_playwright-mc_browser_evaluate', {
            function: `() => {
              // Force close all dialogs
              const dialogs = document.querySelectorAll('[role="dialog"], [role="modal"], .modal, .dialog, .panel, .ms-Dialog, .ms-Panel');
              let closed = 0;
              
              for (const dialog of dialogs) {
                // Try to find and click close button in this dialog
                const closeBtn = dialog.querySelector('button[aria-label*="close" i], button[title*="close" i], .close-button, button[class*="close"]');
                if (closeBtn) {
                  closeBtn.click();
                  closed++;
                } else {
                  // Force hide if no close button found
                  dialog.style.display = 'none';
                  closed++;
                }
              }
              
              return { dialogsClosed: closed };
            }`
          });

          // Press ESC a few times to ensure cleanup
          for (let i = 0; i < 2; i++) {
            try {
              await client.callTool('mcp_playwright-mc_browser_press_key', { key: 'Escape' });
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (escErr) {
              logMessage(`ESC during pre-cleanup failed: ${escErr}`);
            }
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
          logMessage('Pre-row cleanup completed');
        } else {
          logMessage('No open dialogs found, proceeding with clean state');
        }
      } catch (preCleanupErr) {
        logMessage(`Pre-row cleanup check failed: ${preCleanupErr}, continuing anyway`);
      }

      try {
        // Click on the current row with fixed rowIndex closure
        logMessage(`Clicking row ${rowIndex} (0-based index)`);
        let rowClickResult = null;
        try {
          rowClickResult = await client.callTool('mcp_playwright-mc_browser_evaluate', {
            function: `() => {
              var targetRowIndex = ${rowIndex};
              var selectors = [
                '[role="row"]:not([aria-rowindex="1"])',
                'div[role="rowgroup"] [role="row"]',
                'div[role="grid"] [role="row"]:not(:first-child)',
                '[role="row"]',
                'tr:not(:first-child)',
                'tbody tr',
                '.issue-card',
                '[data-row]',
                '.dashboard-row',
                '.feedback-row',
                '.table-row'
              ];
              var foundSelector = null;
              var rows = [];
              for (var i = 0; i < selectors.length; i++) {
                var found = document.querySelectorAll(selectors[i]);
                if (found.length > 0) {
                  rows = Array.prototype.slice.call(found);
                  foundSelector = selectors[i];
                  break;
                }
              }
              if (rows.length > targetRowIndex && rows[targetRowIndex]) {
                var row = rows[targetRowIndex];
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Click synchronously without busy wait
                row.click();
                return { success: true, message: 'Row ' + targetRowIndex + ' clicked synchronously', rowText: (row.textContent || '').substring(0, 100) };
              }
              return { success: false, message: 'Row ' + targetRowIndex + ' not found or not clickable' };
            }`
          });
        } catch (rowClickErr) {
          logMessage(`Row click tool call failed for row ${rowIndex}: ${rowClickErr}`);
          logMessage(` Continuing with assumption that row ${rowIndex} was clicked successfully`);
          // Continue with processing as if the click succeeded
          rowClickResult = { success: true, message: `Row ${rowIndex} click assumed successful after tool error` };
        }

        logMessage(`Row ${rowIndex} click result: ${JSON.stringify(rowClickResult)}`);

        // Verify the row click was successful before proceeding
        if (!rowClickResult || !rowClickResult.success) {
          logMessage(`Row ${rowIndex} click failed, skipping to next row`);
          continue;
        }

        // Step 3a: Save page snapshot for metadata
        logMessage('Step 3a: Capturing page snapshot for metadata');
        const snapshotFile = path.join(sessionDir, 'page_snapshot.txt');
        try {
          const snapshotResult = await client.callTool('mcp_playwright-mc_browser_snapshot', {});
          fs.writeFileSync(snapshotFile, JSON.stringify(snapshotResult, null, 2), 'utf8');
          logMessage(`Page snapshot saved to: ${snapshotFile}`);
        } catch (snapshotErr) {
          logMessage(`Error capturing page snapshot: ${snapshotErr}`);
          fs.writeFileSync(snapshotFile, `Error capturing snapshot: ${snapshotErr}`, 'utf8');
          logMessage(`Page snapshot saved to: ${snapshotFile}`);
        }

        // Click on Conversation Messages tab
        logMessage(`Step 3b: Clicking on Conversation Messages tab for row ${rowIndex}`);
        let tabClickResult = null;
        try {
          tabClickResult = await client.callTool('mcp_playwright-mc_browser_evaluate', {
            function: `() => {
              // Look for Conversation Messages tab
              const tabs = document.querySelectorAll('[role="tab"]');
              for (const tab of tabs) {
                const text = (tab.textContent || tab.innerText || '').trim();
                if (text.includes('Conversation Messages') || text === 'Conversation Messages') {
                  tab.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  tab.click();
                  return { success: true, message: 'Conversation Messages tab clicked', tabText: text };
                }
              }
              return { success: false, message: 'Conversation Messages tab not found' };
            }`
          });
        } catch (tabClickErr) {
          logMessage(`Tab click tool call failed for row ${rowIndex}: ${tabClickErr}`);
          logMessage(`Continuing with assumption that Conversation Messages tab was clicked successfully`);
          // Continue with processing as if the tab click succeeded
          tabClickResult = { success: true, message: `Conversation Messages tab click assumed successful after tool error` };
        }

        logMessage(`Tab click result for row ${rowIndex}: ${JSON.stringify(tabClickResult)}`);

        // Verify tab click was successful before proceeding  
        if (!tabClickResult || !tabClickResult.success) {
          logMessage(`Conversation Messages tab click failed for row ${rowIndex}, skipping to extraction anyway`);
        } else {
          logMessage('Conversation Messages tab clicked successfully');
        }

        // Wait for tab content to load
        logMessage('Waiting 6 seconds for conversation content to load...');
        await new Promise(resolve => setTimeout(resolve, 6000));
        logMessage('Conversation content load wait completed');

        // Extract content for this row
        logMessage(`Step 4: Extracting content for row ${rowIndex}`);
        try {
          const extractionResult = await client.callTool('mcp_playwright-mc_browser_evaluate', {
            function: `() => {
              let bestContent = null;
              // Monaco API
              if (typeof monaco !== 'undefined' && monaco.editor) {
                const models = monaco.editor.getModels();
                for (let model of models) {
                  const content = model.getValue();
                  if (content && content.length > 100) {
                    bestContent = { source: 'monaco_api', content: content, length: content.length };
                    break;
                  }
                }
              }
              // Monaco DOM and other fallbacks
              if (!bestContent) {
                const monacoSelectors = [
                  '.monaco-editor .view-lines',
                  '.monaco-editor .view-line',
                  '.view-lines',
                  '.lines-content',
                  '.monaco-editor textarea',
                  '.monaco-editor',
                  '[data-mode-id="json"]',
                  'textarea[data-mode-id="json"]'
                ];
                for (let selector of monacoSelectors) {
                  const elements = document.querySelectorAll(selector);
                  for (let elem of elements) {
                    const text = elem.innerText || elem.textContent || elem.value || '';
                    if (text && text.length > 100) {
                      if (!bestContent || text.length > bestContent.length) {
                        bestContent = { source: 'monaco_dom_' + selector, content: text, length: text.length };
                      }
                    }
                  }
                }
              }
              if (bestContent) {
                return bestContent;
              }
              return { source: 'fallback', content: 'No content found', length: 0 };
            }`
          });

          // Save extracted content for this row
          if (extractionResult?.content && extractionResult.content.length > 0) {
            const rowJsonFile = path.join(sessionDir, `row_${rowIndex}_extracted.json`);
            fs.writeFileSync(rowJsonFile, JSON.stringify({
              rowIndex: rowIndex,
              rowInfo: currentRow,
              extractionSource: extractionResult.source || 'unknown',
              content: extractionResult.content,
              length: extractionResult.length || extractionResult.content.length,
              timestamp: new Date().toISOString()
            }, null, 2), 'utf8');
            logMessage(`Successfully saved row ${rowIndex} content to ${rowJsonFile} (${extractionResult.length || extractionResult.content.length} chars from ${extractionResult.source})`);

            // Try to parse as JSON for message counting
            try {
              const parsedContent = JSON.parse(extractionResult.content);
              if (parsedContent) {
                extractedJson = parsedContent; // Keep track of the last valid extraction
                logMessage(`Row ${rowIndex} content parsed as valid JSON`);
              }
            } catch (parseErr) {
              logMessage(`Content for row ${rowIndex} is not valid JSON: ${parseErr}`);
            }
          } else {
            logMessage(`No content extracted for row ${rowIndex} - extraction result: ${JSON.stringify(extractionResult)}`);
          }

        } catch (extractErr) {
          logMessage(`Content extraction error for row ${rowIndex}: ${extractErr}`);
        }

        // Step 4b: Robustly checking and clicking "View screenshots" link/button in the panel
        logMessage('Step 4b: Robustly checking and clicking "View screenshots" link/button in the panel');
        let initialTabCount = 1; // Default assumption - we start with 1 tab

        try {
          // First, get current tab count to detect if new tab opens
          initialTabCount = await client.getTabCount();
          logMessage(`Initial tab count: ${initialTabCount}`);

          let snapshotResult = null;
          const screenshot_snapshotFile = path.join(sessionDir, 'page_snapshot_screenshot.txt');
          snapshotResult = null;

          logMessage('Step 1a: Capturing page snapshot for metadata');
          try {
            snapshotResult = await client.callTool('mcp_playwright-mc_browser_snapshot', {});
            fs.writeFileSync(screenshot_snapshotFile, snapshotResult, 'utf8');
            logMessage(`Page snapshot saved to: ${snapshotFile}`);
          } catch (snapshotErr) {
            logMessage(`Error capturing page snapshot: ${snapshotErr}`);
            fs.writeFileSync(screenshot_snapshotFile, `Error capturing snapshot: ${snapshotErr}`, 'utf8');
            logMessage(`Page snapshot saved to: ${snapshotFile}`);
          }
          let screenshotUrl = extractViewScreenshotsLink(screenshot_snapshotFile);

          // Log the extracted URL for debugging
          if (screenshotUrl) {
            logMessage(`Row ${rowIndex}: Extracted OCV URL: ${screenshotUrl}`);

            // Extract the OCV ID from the URL for logging
            const ocvIdMatch = screenshotUrl.match(/\/item\/[^\/]+_([a-f0-9]+)/);
            const ocvId = ocvIdMatch ? ocvIdMatch[1] : 'unknown';
            logMessage(`Row ${rowIndex}: OCV ID: ${ocvId}`);
          } else {
            logMessage(`Row ${rowIndex}: No screenshot URL found!`);
          }

          // Use browser_navigate tool to open the screenshots URL in a new window
          if (screenshotUrl) {
            try {
              // Open screenshots URL in a new tab
              await client.callTool('mcp_playwright-mc_browser_tab_new', { url: screenshotUrl });
              logMessage(`Opened View screenshots URL in new window using browser_navigate: ${screenshotUrl}`);

              // Wait for the new tab to load
              logMessage('Waiting 7 seconds for screenshots tab to load...');
              await new Promise(resolve => setTimeout(resolve, 7000));

              // Switch focus to the new tab (assume last tab is the new one)
              const tabCount = await client.getTabCount();
              if (tabCount > 1) {
                await client.callTool('mcp_playwright-mc_browser_tab_select', { index: tabCount - 1 });
                logMessage(`Switched focus to screenshots tab (index ${tabCount - 1})`);
              }

              // Wait a bit more for DOM readiness
              logMessage('Waiting 2 seconds for DOM to be ready...');
              await new Promise(resolve => setTimeout(resolve, 10000));

              // Now attempt to click the image thumbnail
              try {
                await client.callTool('mcp_playwright-mc_browser_evaluate', {
                  "function": "() => {\n  // Find all images with the thumbnail-image class\n  const images = Array.from(document.querySelectorAll('img.thumbnail-image'));\n  if (images.length === 0) return { found: false, reason: 'No img.thumbnail-image found' };\n  // Save all thumbnail srcs\n  return images.map(img => ({ src: img.src, alt: img.alt, width: img.width, height: img.height }));\n}"
                });
                logMessage('Images Saved');
              } catch (err) {
                logMessage(`Error saving images *****: ${err}`);
                try {
                  // Extract JSON array from error message using helper function
                  const arr = extractJsonArray(err as string);
                  logMessage(`Extracted image sources: ${JSON.stringify(arr)}`);
                  if (arr && Array.isArray(arr)) {
                    for (const img of arr) {
                      // save each image source to a file
                      const imgFileName = path.join(issue_folder_path, `screenshot_${Date.now()}.png`);

                      // Extract base64 data from data URL
                      let base64Data = img.src;
                      if (base64Data.startsWith('data:')) {
                        // Remove the data URL prefix (e.g., "data:image/png;base64,")
                        const base64Index = base64Data.indexOf(',');
                        if (base64Index !== -1) {
                          base64Data = base64Data.substring(base64Index + 1);
                        }
                      }

                      fs.writeFileSync(imgFileName, base64Data, 'base64');
                      logMessage(`Saved image source to ${imgFileName}`);
                    }
                  }
                } catch (extractErr) {
                  logMessage(`Error extracting images from error: ${extractErr}`);
                }
              }

              // close the current tab after processing
              await client.callTool('mcp_playwright-mc_browser_tab_close', { index: tabCount });
              logMessage(`Closed screenshots tab after processing`);
            } catch (navErr) {
              logMessage(`Error opening screenshots URL in new window: ${navErr}`);
              // Switch focus to the new tab (assume last tab is the new one)
              const tabCount = await client.getTabCount();
              if (tabCount > 1) {
                await client.callTool('mcp_playwright-mc_browser_tab_select', { index: tabCount - 1 });
                logMessage(`Switched focus to screenshots tab (index ${tabCount - 1})`);
              }

              // Wait a bit more for DOM readiness
              logMessage('Waiting 2 seconds for DOM to be ready...');
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Now attempt to click the image thumbnail
              try {
                await client.callTool('mcp_playwright-mc_browser_evaluate', {
                  "function": "() => {\n  // Find all images with the thumbnail-image class\n  const images = Array.from(document.querySelectorAll('img.thumbnail-image'));\n  if (images.length === 0) return { found: false, reason: 'No img.thumbnail-image found' };\n  // Save all thumbnail srcs\n  return images.map(img => ({ src: img.src, alt: img.alt, width: img.width, height: img.height }));\n}"
                });
                logMessage('Images Saved');
              } catch (err) {
                logMessage(`Error saving images *****: ${err}`);
                try {
                  // Extract JSON array from error message using helper function
                  const arr = extractJsonArray(err as string);
                  logMessage(`Extracted image sources: ${JSON.stringify(arr)}`);
                  if (arr && Array.isArray(arr)) {
                    for (const img of arr) {
                      // save each image source to a file
                      const imgFileName = path.join(issue_folder_path, `screenshot_${Date.now()}.png`);

                      // Extract base64 data from data URL
                      let base64Data = img.src;
                      if (base64Data.startsWith('data:')) {
                        // Remove the data URL prefix (e.g., "data:image/png;base64,")
                        const base64Index = base64Data.indexOf(',');
                        if (base64Index !== -1) {
                          base64Data = base64Data.substring(base64Index + 1);
                        }
                      }

                      fs.writeFileSync(imgFileName, base64Data, 'base64');
                      logMessage(`Saved image source to ${imgFileName}`);
                    }
                  }
                } catch (extractErr) {
                  logMessage(`Error extracting images from error: ${extractErr}`);
                }
              }

              // close the current tab after processing
              await client.callTool('mcp_playwright-mc_browser_tab_close', { index: tabCount });
              logMessage(`Closed screenshots tab after processing`);
            }
          }
        } catch (viewScreenshotsErr) {
          logMessage(`Error clicking View screenshots link/button: ${viewScreenshotsErr}`);
        }

        // Close the current panel/dialog before moving to next row
        logMessage(`Step 5: Closing panel for row ${rowIndex}`);
        try {
          const closeResult = await client.callTool('mcp_playwright-mc_browser_evaluate', {
            function: `() => {
              let closedCount = 0;
              
              // Strategy 1: Find and click all possible close buttons
              const closeSelectors = [
                'button[aria-label*="Close" i]',
                'button[title*="Close" i]',
                'button[aria-label*="close" i]',
                'button[title*="close" i]',
                '.close-button',
                '.modal-close', 
                '.dialog-close',
                '.panel-close',
                '[data-dismiss="modal"]',
                '.btn-close',
                '[aria-label*="Close" i]',
                '[role="button"][aria-label*="close" i]',
                'button[data-testid*="close" i]',
                'button[class*="close" i]',
                // Specific patterns for Microsoft dialogs
                'button[class*="ms-Button--icon"]',
                'button[class*="ms-Dialog-button"]',
                '.ms-Dialog-button',
                '.ms-Panel-closeButton'
              ];
              
              for (const selector of closeSelectors) {
                const buttons = document.querySelectorAll(selector);
                for (const btn of buttons) {
                  if (btn && typeof btn.click === 'function') {
                    // Check if this looks like a close button
                    const text = (btn.textContent || btn.innerText || '').trim();
                    const ariaLabel = btn.getAttribute('aria-label') || '';
                    const title = btn.getAttribute('title') || '';
                    const className = btn.className || '';
                    
                    if (text === '×' || text === '✕' || text.toLowerCase().includes('close') ||
                        ariaLabel.toLowerCase().includes('close') ||
                        title.toLowerCase().includes('close') ||
                        className.includes('close')) {
                      btn.click();
                      closedCount++;
                    }
                  }
                }
              }
              
              // Strategy 2: Look for buttons with × or close text content
              const allButtons = document.querySelectorAll('button, [role="button"]');
              for (const btn of allButtons) {
                const text = (btn.textContent || btn.innerText || '').trim();
                if (text === '×' || text === '✕' || text === 'Close' || text === 'close') {
                  btn.click();
                  closedCount++;
                }
              }
              
              // Strategy 3: Click outside any dialogs to close them (backdrop click)
              const dialogs = document.querySelectorAll('[role="dialog"], [role="modal"], .modal, .dialog, .panel');
              for (const dialog of dialogs) {
                if (dialog.parentElement) {
                  // Click on the backdrop/overlay if it exists
                  const backdrop = dialog.parentElement.querySelector('.modal-backdrop, .dialog-backdrop, .overlay');
                  if (backdrop) {
                    backdrop.click();
                    closedCount++;
                  }
                }
              }
              
              return { 
                success: true, 
                message: 'Attempted to close panels using multiple strategies', 
                closedCount: closedCount,
                strategiesUsed: ['close buttons', 'text matching', 'backdrop clicks']
              };
            }`
          });
          logMessage(`Close panel result for row ${rowIndex}: ${JSON.stringify(closeResult)}`);

          // Use the proper press key tool name
          logMessage('Pressing ESC key to ensure panel closure...');
          try {
            await client.callTool('mcp_playwright-mc_browser_press_key', { key: 'Escape' });
            await new Promise(resolve => setTimeout(resolve, 1000));
            logMessage('ESC key pressed successfully');
          } catch (escErr) {
            logMessage(`ESC key failed: ${escErr}`);
          }

          // Wait longer for panel to close completely
          logMessage('Waiting 3 seconds for panel to close completely...');
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Verify panel has actually closed with enhanced detection
          const panelClosedVerification = await client.callTool('mcp_playwright-mc_browser_evaluate', {
            function: `() => {
              // Check for all types of dialog/modal elements
              const dialogSelectors = [
                '[role="dialog"]',
                '[role="modal"]', 
                '.modal',
                '.dialog',
                '.panel',
                '.ms-Dialog',
                '.ms-Panel',
                '.overlay',
                '.popup',
                '[data-portal-node]',
                // Check for elements with high z-index (likely overlays)
                '*[style*="z-index"]'
              ];
              
              let visibleDialogs = [];
              let totalVisible = 0;
              
              for (const selector of dialogSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const elem of elements) {
                  const style = window.getComputedStyle(elem);
                  const rect = elem.getBoundingClientRect();
                  
                  // Check if element is actually visible and taking up space
                  const isVisible = style.display !== 'none' && 
                                  style.visibility !== 'hidden' && 
                                  style.opacity !== '0' &&
                                  rect.width > 0 && 
                                  rect.height > 0;
                  
                  if (isVisible) {
                    totalVisible++;
                    visibleDialogs.push({
                      selector: selector,
                      className: elem.className,
                      id: elem.id,
                      tagName: elem.tagName
                    });
                  }
                }
              }
              
              return { 
                panelClosed: totalVisible === 0, 
                visibleDialogs: totalVisible,
                dialogDetails: visibleDialogs,
                message: totalVisible === 0 ? 'All panels successfully closed' : totalVisible + ' panels still visible'
              };
            }`
          });

          logMessage(`Panel close verification for row ${rowIndex}: ${JSON.stringify(panelClosedVerification)}`);

          // If panels are still open, try more aggressive closing
          if (!panelClosedVerification.panelClosed) {
            logMessage(`${panelClosedVerification.visibleDialogs} panels still open for row ${rowIndex}, trying aggressive cleanup...`);

            try {
              // Try multiple ESC key presses
              for (let i = 0; i < 3; i++) {
                await client.callTool('mcp_playwright-mc_browser_press_key', { key: 'Escape' });
                await new Promise(resolve => setTimeout(resolve, 500));
              }

              // Try clicking the document body to lose focus
              await client.callTool('mcp_playwright-mc_browser_evaluate', {
                function: `() => {
                  // Force hide any visible dialogs
                  const dialogs = document.querySelectorAll('[role="dialog"], [role="modal"], .modal, .dialog, .panel, .ms-Dialog, .ms-Panel');
                  let forceClosed = 0;
                  for (const dialog of dialogs) {
                    const style = window.getComputedStyle(dialog);
                    if (style.display !== 'none') {
                      dialog.style.display = 'none';
                      forceClosed++;
                    }
                  }
                  
                  // Click on document body to lose focus
                  document.body.click();
                  
                  return { forceClosed: forceClosed, bodyClicked: true };
                }`
              });

              await new Promise(resolve => setTimeout(resolve, 1000));
              logMessage('Aggressive panel cleanup completed');
            } catch (aggressiveErr) {
              logMessage(`Aggressive cleanup failed: ${aggressiveErr}`);
            }
          } else {
            logMessage('Panel confirmed closed');
          }

          logMessage('Panel close wait completed');

        } catch (closeErr) {
          logMessage(`Error closing panel for row ${rowIndex}: ${closeErr}`);
          // Try ESC key as fallback
          try {
            await client.callTool('mcp_playwright-mc_browser_press_key', { key: 'Escape' });
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait longer for ESC to take effect
          } catch (escErr) {
            logMessage(`ESC key fallback failed for row ${rowIndex}: ${escErr}`);
          }
        }

        logMessage(`Completed processing row ${rowIndex + 1}/${Math.min(allRowsData.length, maxIssuesPerDate)}`);

        // Additional safety wait between rows to ensure complete cleanup
        if (rowIndex < Math.min(allRowsData.length, maxIssuesPerDate) - 1) {
          logMessage('Waiting 3 additional seconds between rows for cleanup...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (rowErr) {
        logMessage(`Error processing row ${rowIndex}: ${rowErr}`);
        logMessage(`Continuing to next row after error in row ${rowIndex}`);
        // Ensure we still clean up before next row
        try {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for any pending operations
        } catch (waitErr) {
          logMessage(`Wait error after row ${rowIndex} failure: ${waitErr}`);
        }
        // Continue to next row
        continue;
      }

      logMessage(`Completed processing row ${rowIndex}`);
    }

    // Save summary of all processed rows
    const summaryFile = path.join(sessionDir, 'processing_summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify({
      totalRowsFound: allRowsData.length,
      rowsProcessed: Math.min(allRowsData.length, maxIssuesPerDate),
      processingLimit: maxIssuesPerDate,
      sessionTimestamp: sessionTimestamp,
      dashboardUrl: dashboardUrl
    }, null, 2), 'utf8');
    logMessage(`Processing summary saved to ${summaryFile}`);

    // Step 6: Save page snapshot for metadata
    logMessage('Step 6: Capturing final page snapshot for metadata');
    const finalSnapshotFile = path.join(sessionDir, 'final_page_snapshot.txt');
    try {
      const snapshotResult = await client.callTool('mcp_playwright-mc_browser_snapshot', {});
      fs.writeFileSync(finalSnapshotFile, JSON.stringify(snapshotResult, null, 2), 'utf8');
      logMessage(`Final page snapshot saved to: ${finalSnapshotFile}`);
    } catch (snapshotErr) {
      logMessage(`Error capturing final page snapshot: ${snapshotErr}`);
      fs.writeFileSync(finalSnapshotFile, `Error capturing snapshot: ${snapshotErr}`, 'utf8');
      logMessage(`Final snapshot saved to: ${finalSnapshotFile}`);
    }

    logMessage('Enhanced dashboard scraping workflow completed successfully');

  } catch (err) {
    stepSuccess = false;
    errorDetails += `Fatal error: ${err}\n`;
    logMessage(`Fatal error: ${err}`);
  } finally {
    // Disconnect after a delay to allow for debugging
    setTimeout(async () => {
      try {
        await client.disconnect();
        logMessage('Disconnected from Playwright MCP server (delayed)');
      } catch (disconnectError) {
        logMessage(`Error during disconnect: ${disconnectError}`);
      }
    }, 10000); // Wait 10 seconds before disconnecting
  }

  // Move debug.log to issue-specific folder if extraction was successful
  let finalOutputDir = sessionDir;
  if (extractedJson && (extractedJson.traceId || extractedJson.id)) {
    const issueId = extractedJson.traceId || extractedJson.id || `issue_${Date.now()}`;
    const issueFolder = path.join(sessionDir, issueId);

    if (!fs.existsSync(issueFolder)) {
      fs.mkdirSync(issueFolder, { recursive: true });
    }

    finalOutputDir = issueFolder;
  }

  const messageCount = extractedJson?.conversation?.messages?.length ||
    extractedJson?.messages?.length ||
    (extractedJson ? 1 : 0);

  const totalRowsProcessed = Math.min(allRowsData.length, maxIssuesPerDate);
  const rowsFoundText = allRowsData.length > 0 ? ` Found ${allRowsData.length} rows, processed ${totalRowsProcessed}.` : '';

  return {
    content: [{
      type: 'text',
      text: `Enhanced dashboard scraping completed using MCP sampling converter. Success: ${stepSuccess}. Data extracted: ${extractedJson ? 'Yes' : 'No'}. Messages: ${messageCount}.${rowsFoundText} Output: ${finalOutputDir}. ${errorDetails ? `Errors: ${errorDetails}` : 'No errors.'}`
    }]
  };
};
