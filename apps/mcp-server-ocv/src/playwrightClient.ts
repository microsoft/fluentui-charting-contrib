import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { logEvent } from './utils.js';
import { responseHandler } from './responseHandler.js';

// PlaywrightMCPClient for cross-server tool invocation
export class PlaywrightMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isConnected: boolean = false;
  private sessionDir?: string;

  setSessionDir(sessionDir: string): void {
    this.sessionDir = sessionDir;
    responseHandler.setSessionDir(sessionDir);
  }

  setSessionIssueDir(sessionDir: string, issueId: string): void {
    const sessionDirValue = sessionDir || this.sessionDir;
    responseHandler.setSessionIssueDir(sessionDir, issueId);
  }

  async connect(headless: boolean = false): Promise<void> {
    if (this.isConnected) {
      console.log('[PlaywrightMCP] Already connected');
      return;
    }

    try {
      console.log(`[PlaywrightMCP] Connecting to playwright-mcp server (requesting headless: ${headless})...`);

      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['@playwright/mcp@latest']
      });

      this.client = new Client({
        name: 'plotly-mcp-client',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      await this.client.connect(this.transport);
      this.isConnected = true;
      console.log('[PlaywrightMCP] Successfully connected to playwright-mcp server');

      // Test tool availability by listing available tools
      try {
        const tools = await this.client.listTools();
        console.log(`[PlaywrightMCP] Available tools count: ${tools.tools.length}`);
        console.log(`[PlaywrightMCP] Available tool names:`, tools.tools.map((t:any)=> t.name));
        logEvent('INFO', 'playwright-client', 'Available playwright tools', {
          toolCount: tools.tools.length,
          toolNames: tools.tools.map((t:any)=> t.name)
        });

        // Check if essential tools are available with the expected names
        const requiredTools = ['mcp_playwright-mc_browser_evaluate', 'mcp_playwright-mc_browser_navigate'];
        const availableToolNames = tools.tools.map((t:any)=> t.name);
        const missingTools = requiredTools.filter(tool => !availableToolNames.includes(tool));

        if (missingTools.length > 0) {
          console.warn(`[PlaywrightMCP] Missing required tools: ${missingTools.join(', ')}`);
          console.warn(`[PlaywrightMCP] Available tools: ${availableToolNames.join(', ')}`);

          // Try to find similar tool names
          const similarTools = availableToolNames.filter((name: any) =>
            name.includes('browser') || name.includes('playwright') || name.includes('navigate') || name.includes('evaluate')
          );
          if (similarTools.length > 0) {
            console.log(`[PlaywrightMCP] Found similar tools: ${similarTools.join(', ')}`);
            logEvent('INFO', 'playwright-client', 'Found similar browser tools', { similarTools });
          }

          // Log all tools for analysis
          tools.tools.forEach((tool: any) => {
            console.log(`[PlaywrightMCP] Tool: ${tool.name} - Description: ${tool.description || 'No description'}`);
          });
        } else {
          console.log('[PlaywrightMCP] All required tools are available');
        }
      } catch (toolListError) {
        console.warn('[PlaywrightMCP] Could not list tools:', toolListError);
        logEvent('ERROR', 'playwright-client', 'Failed to list tools', {
          error: toolListError instanceof Error ? toolListError.message : toolListError
        });
      }

      // Try to launch browser in headed mode if requested
      if (!headless) {
        try {
          console.log('[PlaywrightMCP] Attempting to launch browser in headed mode...');

          // Some playwright-mcp packages support browser launch configuration
          await this.callTool('mcp_playwright-mc_browser_install', {});

          // Try to configure headed mode through resize (this makes the browser visible)
          await this.callTool('mcp_playwright-mc_browser_resize', {
            width: 1280,
            height: 720
          });

          console.log('[PlaywrightMCP] Browser configured for headed mode');
        } catch (configError) {
          console.warn('[PlaywrightMCP] Could not configure headed mode:', configError);
          console.log('[PlaywrightMCP] Proceeding with default browser configuration');
        }
      }

      logEvent('INFO', 'playwright-client', 'Connected to playwright-mcp server', { headless });

    } catch (error) {
      console.error('[PlaywrightMCP] Failed to connect:', error);
      logEvent('ERROR', 'playwright-client', 'Failed to connect to playwright-mcp server', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  // Map from expected tool names to actual playwright-mcp tool names
  private getActualToolName(expectedName: string): string {
    const toolMapping: { [key: string]: string } = {
      'mcp_playwright-mc_browser_navigate': 'browser_navigate',
      'mcp_playwright-mc_browser_evaluate': 'browser_evaluate',
      'mcp_playwright-mc_browser_snapshot': 'browser_snapshot',
      'mcp_playwright-mc_browser_click': 'browser_click',
      'mcp_playwright-mc_browser_type': 'browser_type',
      'mcp_playwright-mc_browser_take_screenshot': 'browser_take_screenshot',
      'mcp_playwright-mc_browser_wait_for': 'browser_wait_for',
      'mcp_playwright-mc_browser_install': 'browser_install',
      'mcp_playwright-mc_browser_hover': 'browser_hover',
      'mcp_playwright-mc_browser_press_key': 'browser_press_key',
      'mcp_playwright-mc_browser_resize': 'browser_resize',
      'mcp_playwright-mc_browser_tab_list': 'browser_tab_list',
      'mcp_playwright-mc_browser_tab_new': 'browser_tab_new',
      'mcp_playwright-mc_browser_tab_select': 'browser_tab_select',
      'mcp_playwright-mc_browser_tab_close': 'browser_tab_close'
    };

    return toolMapping[expectedName] || expectedName;
  }

  async callTool(toolName: string, args: any): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('PlaywrightMCP client not connected. Call connect() first.');
    }

    // Map to the actual tool name
    const actualToolName = this.getActualToolName(toolName);

    try {
      console.log(`[PlaywrightMCP] Calling tool: ${toolName} -> ${actualToolName}`, args);
      logEvent('DEBUG', 'playwright-client', `Calling tool: ${toolName} -> ${actualToolName}`, { args });

      const result = await this.client.callTool({
        name: actualToolName,
        arguments: args
      });

      console.log(`[PlaywrightMCP] Tool ${actualToolName} completed successfully`);
      logEvent('INFO', 'playwright-client', `Tool ${actualToolName} completed`, { toolName: actualToolName, success: true });

      // Use the response handler to process the result
      return await responseHandler.processToolResult(result, actualToolName);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[PlaywrightMCP] Tool ${actualToolName} failed:`, error);
      logEvent('ERROR', 'playwright-client', `Tool ${actualToolName} failed`, { toolName: actualToolName, error: errorMessage });

      // Re-throw with more context for debugging
      throw new Error(`PlaywrightMCP tool call failed - ${actualToolName}: ${errorMessage}`);
    }
  }

  extractStringFromResult(result: any): string {
    return responseHandler.extractStringFromResult(result);
  }

  extractArrayFromResult(result: any): any[] {
    return responseHandler.extractArrayFromResult(result);
  }

  async waitForAuthentication(timeoutMs: number = 120000): Promise<void> {
    console.log(`[PlaywrightMCP] Waiting for user authentication (timeout: ${timeoutMs}ms)`);
    console.log('[PlaywrightMCP] Please complete sign-in in the browser window...');

    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        // Check if we're still on a login page by looking for common login indicators
        const urlResult = await this.callTool('mcp_playwright-mc_browser_evaluate', {
          function: '() => window.location.href'
        });

        const titleResult = await this.callTool('mcp_playwright-mc_browser_evaluate', {
          function: '() => document.title'
        });

        // Extract string values using improved helper
        const currentUrl = this.extractStringFromResult(urlResult);
        const pageTitle = this.extractStringFromResult(titleResult);

        console.log(`[PlaywrightMCP] Current URL: "${currentUrl}", Title: "${pageTitle}"`);

        // Check if we're no longer on login/auth pages
        const isLoginPage = currentUrl.includes('login') ||
          currentUrl.includes('auth') ||
          currentUrl.includes('signin') ||
          pageTitle.toLowerCase().includes('sign in') ||
          pageTitle.toLowerCase().includes('login');

        if (!isLoginPage && !currentUrl.includes('oauth') && currentUrl.length > 0) {
          console.log('[PlaywrightMCP] Authentication appears to be complete');
          return;
        }

        await new Promise(resolve => setTimeout(resolve, checkInterval));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`[PlaywrightMCP] Error checking auth status: ${errorMessage}`);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }

    console.log('[PlaywrightMCP] Authentication timeout reached');
    throw new Error('Authentication timeout - please complete sign-in faster');
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      console.log('[PlaywrightMCP] Disconnecting from playwright-mcp server...');

      if (this.client) {
        await this.client.close();
        this.client = null;
      }

      if (this.transport) {
        await this.transport.close();
        this.transport = null;
      }

      this.isConnected = false;
      console.log('[PlaywrightMCP] Disconnected successfully');
      logEvent('INFO', 'playwright-client', 'Disconnected from playwright-mcp server', {});

    } catch (error) {
      console.error('[PlaywrightMCP] Error during disconnect:', error);
      logEvent('ERROR', 'playwright-client', 'Error during disconnect', { error: error instanceof Error ? error.message : error });
    }
  }

  isClientConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Tab management helper functions
  async getTabCount(): Promise<number> {
    try {
      const result = await this.callTool('mcp_playwright-mc_browser_tab_list', {});
      return result?.tabs?.length || 1;
    } catch (error) {
      console.warn('[PlaywrightMCP] Failed to get tab count:', error);
      return 1; // Default assumption
    }
  }

  async switchToTab(index: number): Promise<boolean> {
    try {
      await this.callTool('mcp_playwright-mc_browser_tab_select', { index });
      logEvent('INFO', 'playwright-client', `Switched to tab index ${index}`, { tabIndex: index });
      return true;
    } catch (error) {
      console.error(`[PlaywrightMCP] Failed to switch to tab ${index}:`, error);
      logEvent('ERROR', 'playwright-client', `Failed to switch to tab ${index}`, { tabIndex: index, error: error instanceof Error ? error.message : error });
      return false;
    }
  }

  async closeTab(index: number): Promise<boolean> {
    try {
      await this.callTool('mcp_playwright-mc_browser_tab_close', { index });
      logEvent('INFO', 'playwright-client', `Closed tab index ${index}`, { tabIndex: index });
      return true;
    } catch (error) {
      console.error(`[PlaywrightMCP] Failed to close tab ${index}:`, error);
      logEvent('ERROR', 'playwright-client', `Failed to close tab ${index}`, { tabIndex: index, error: error instanceof Error ? error.message : error });
      return false;
    }
  }

  async switchBackToOriginalTab(): Promise<boolean> {
    const currentTabCount = await this.getTabCount();
    if (currentTabCount > 1) {
      console.log(`[PlaywrightMCP] Detected ${currentTabCount} tabs, switching back to original tab (index 0)`);
      return await this.switchToTab(0);
    }
    return true; // Already on the original tab
  }

  async closeExtraTabs(): Promise<void> {
    const currentTabCount = await this.getTabCount();
    if (currentTabCount > 1) {
      console.log(`[PlaywrightMCP] Closing ${currentTabCount - 1} extra tabs`);
      // Close tabs from highest index to lowest to avoid index shifting issues
      for (let i = currentTabCount - 1; i > 0; i--) {
        const closed = await this.closeTab(i);
        if (closed) {
          logEvent('INFO', 'playwright-client', `Closed tab ${i}`, { tabIndex: i });
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay between closures
      }
    }
  }

  async openManualBrowser(url: string): Promise<void> {
    console.log('[PlaywrightMCP] Opening manual browser for authentication...');

    try {
      // Try to open browser manually using system commands
      const { exec } = require('child_process');
      const platform = process.platform;

      let command: string;
      if (platform === 'win32') {
        command = `start "" "${url}"`;
      } else if (platform === 'darwin') {
        command = `open "${url}"`;
      } else {
        command = `xdg-open "${url}"`;
      }

      exec(command, (error: any) => {
        if (error) {
          console.error('[PlaywrightMCP] Failed to open browser manually:', error);
          console.log('[PlaywrightMCP] Please manually open your browser and navigate to:');
          console.log(`[PlaywrightMCP] ${url}`);
        } else {
          console.log('[PlaywrightMCP] Browser opened manually for authentication');
        }
      });

    } catch (error) {
      console.error('[PlaywrightMCP] Error opening manual browser:', error);
      console.log('[PlaywrightMCP] Please manually open your browser and navigate to:');
      console.log(`[PlaywrightMCP] ${url}`);
    }
  }
}
