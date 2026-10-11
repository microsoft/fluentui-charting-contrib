#!/usr/bin/env node
import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Python environment validation and auto-setup
async function validatePythonEnvironment(): Promise<{ valid: boolean; message: string; pythonCmd?: string }> {
  for (const cmd of ['python3', 'python', 'py']) {
    try {
      const { stdout } = await execAsync(`${cmd} --version`);
      const match = stdout.match(/Python (\d+)\.(\d+)/);
      
      if (match) {
        const [major, minor] = [parseInt(match[1]), parseInt(match[2])];
        if (major >= 3 && minor >= 8) {
          // Check if packages are installed
          try {
            await execAsync(`${cmd} -c "import plotly, kaleido"`);
            return { valid: true, message: `Python ready: ${stdout.trim()}`, pythonCmd: cmd };
          } catch {
            // Try to auto-install packages
            console.log(`[Python] Installing plotly and kaleido...`);
            try {
              await execAsync(`${cmd} -m pip install --user plotly kaleido`);
              await execAsync(`${cmd} -c "import plotly, kaleido"`); // Verify installation
              return { valid: true, message: `Python ready: ${stdout.trim()} (packages auto-installed)`, pythonCmd: cmd };
            } catch (installError) {
              return { 
                valid: false, 
                message: `Python found but package install failed. Manual install: ${cmd} -m pip install plotly kaleido` 
              };
            }
          }
        }
      }
    } catch {
      // Command not found, continue
    }
  }
  
  return { 
    valid: false, 
    message: 'Python 3.8+ not found. Install: https://python.org/downloads/' 
  };
}

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8100;

// Logging utility
const LOG_DIR = path.resolve(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, `chart-capture-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logEvent(level: 'INFO' | 'ERROR' | 'DEBUG', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} [${level}] ${message}${data ? ` | Data: ${JSON.stringify(data)}` : ''}\n`;
  
  // Only log to console for INFO and ERROR
  if (level !== 'DEBUG') {
    console.log(`[${level}] ${message}`, data || '');
  }
  
  // Log to file
  try {
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Helper function to extract Python code blocks
function extractPythonCodeBlocks(content: string): string {
  const pythonCodeBlocks = content.match(/```python\n(.*?)```/gs);
  if (pythonCodeBlocks && pythonCodeBlocks.length > 0) {
    return pythonCodeBlocks.map(block => 
      block.replace(/```python\n/, '').replace(/```$/, '')
    ).join('\n\n');
  }
  return content; // Return original content if no code blocks found
}

// Helper function to generate React component code from Plotly JSON
function generateReactComponentCode(chartJson: any, chartName: string): string {
  const schemaString = JSON.stringify({ plotlySchema: chartJson }, null, 2);
  
  return `/**
 * Chart component generated from Plotly schema: ${chartName}
 * 
 * DEPENDENCIES REQUIRED:
 * To use this component, install the following packages:
 * 
 * npm install react react-dom @fluentui/react-charts
 * 
 * Or with yarn:
 * yarn add react react-dom @fluentui/react-charts
 * 
 * Required versions:
 * - react: ^18.0.0 or higher
 * - react-dom: ^18.0.0 or higher
 * - @fluentui/react-charts: ^6.0.0 or higher
 */

import * as React from 'react';
import { DeclarativeChart, Schema } from '@fluentui/react-charts';

/**
 * This component renders the chart using Fluent UI's DeclarativeChart.
 */
export const ${chartName.split('_').map((word, idx) => 
  idx === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : 
  word.charAt(0).toUpperCase() + word.slice(1)
).join('')}Component = () => {
  const schema: Schema = ${schemaString.split('\n').map((line, idx) => 
    idx === 0 ? line : '  ' + line
  ).join('\n')};

  return <DeclarativeChart chartSchema={schema} />;
};
`;
}

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Local map to store tool handlers for REST access
const toolHandlers: Record<string, (args: any) => Promise<any>> = {};

let cachedServer: McpServer | null = null;

function buildServer() {
  if (cachedServer) return cachedServer;

  const server = new McpServer({
    name: "fluent-charts-mcp",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  // MCP tool to execute Python code and capture Fluent chart image
  const executePythonAndCaptureChartHandler = async (
    toolArgs: {
      pythonCode?: string;
      timeout?: number;
      outputFormat?: 'png' | 'jpeg';
    }
  ): Promise<{ content: Array<{ type: "text"; text: string } | { type: "image"; mimeType: string; data: string }> }> => {
    logEvent('INFO', 'Handler invoked', toolArgs);
    
    const { 
      pythonCode: inputPythonCode,
      timeout = 30000,
      outputFormat = 'png'
    } = toolArgs;
    
    // pythonCode is required
    if (!inputPythonCode) {
      throw new Error('pythonCode is required');
    }
    
    // Extract and clean Python code from string input
    const pythonCode = extractPythonCodeBlocks(inputPythonCode);
    
    logEvent('INFO', 'Using Python code from string input', {
      codeLength: pythonCode.length
    });
    
    try {
      // Step 1: Execute Python code and get JSON files
      const tempDir = path.resolve(__dirname, '..', 'temp');
      const timestamp = Date.now();
      const executionDir = path.join(tempDir, `execution_${timestamp}`);
      
      // Ensure temp directories exist
      [tempDir, executionDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
      
      // Modified Python code to generate JSON files
      const modifiedPythonCode = `
import json
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np
from plotly.utils import PlotlyJSONEncoder
import os

os.chdir("${executionDir.replace(/\\/g, '/')}")

# User code starts here
${pythonCode}

# Auto-detect and save all figures created
import plotly.graph_objects as go_check
figure_count = 0

for name, obj in list(globals().items()):
    if isinstance(obj, go_check.Figure):
        figure_count += 1
        filename = f"chart_{figure_count}_{name}.json"
        with open(filename, "w") as f:
            json.dump(obj.to_plotly_json(), f, cls=PlotlyJSONEncoder, indent=2)
        print(f"Chart JSON saved to: {filename}")

print(f"Total figures saved: {figure_count}")
`;

      // Write and execute Python code
      const tempPythonFile = path.join(executionDir, 'temp_chart.py');
      fs.writeFileSync(tempPythonFile, modifiedPythonCode);
      
      logEvent('INFO', 'Executing Python code');
      const { stdout, stderr } = await execAsync(`python "${tempPythonFile}"`, { 
        cwd: executionDir,
        timeout: timeout 
      });
      
      if (stderr) {
        logEvent('ERROR', 'Python execution error', { stderr });
        throw new Error(`Python execution failed: ${stderr}`);
      }
      
      logEvent('INFO', 'Python execution completed', { 
        executionDir 
      });
      
      // Find generated JSON files
      const jsonFiles = fs.readdirSync(executionDir).filter(f => f.endsWith('.json'));
      
      if (jsonFiles.length === 0) {
        throw new Error('No chart JSON files were generated from Python code');
      }
      
      logEvent('INFO', 'Found JSON files', { count: jsonFiles.length });
      
      // Create unique session output directory
      const outputDir = path.join(__dirname, '..', 'output', 'charts');
      const sessionFolder = `session_${Date.now()}`;
      const finalOutputDir = path.join(outputDir, sessionFolder);
      const tempDownloadDir = path.join(tempDir, 'downloads');
      
      [finalOutputDir, tempDownloadDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
      
      // Step 2: Process each chart with Puppeteer
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1200, height: 800 }
      });
      
      const chartImages: Array<{ type: 'image', mimeType: string, data: string }> = [];
      const chartReactCodes: Array<{ type: 'text', text: string }> = [];
      
      // Limit to maximum 3 charts to prevent excessive processing
      const maxCharts = Math.min(jsonFiles.length, 3);
      
      for (let i = 0; i < maxCharts; i++) {
        const jsonFile = jsonFiles[i];
        let page = null;
        try {
          const jsonFilePath = path.join(executionDir, jsonFile);
          const chartJson = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
          const chartName = path.basename(jsonFile, '.json');
          
          logEvent('INFO', 'Processing chart', { 
            chartName,
            chartIndex: i + 1
          });
          
          page = await browser.newPage();
          
          // Navigate to Fluent Charts website
          await page.goto('https://fluentchartseval.azurewebsites.net', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
          });
          
          // Enable JSON Input switch by finding it via its label
          const switchInfo = await page.evaluate(() => {
            // Find the label that contains "JSON input disabled"
            const labels = Array.from(document.querySelectorAll('label.fui-Switch__label'));
            const jsonLabel = labels.find(label => 
              label.textContent?.includes('JSON input disabled')
            );
            
            if (jsonLabel) {
              // Get the 'for' attribute to find the associated input
              const forId = jsonLabel.getAttribute('for');
              if (forId) {
                const switchElement = document.getElementById(forId) as HTMLInputElement;
                if (switchElement && switchElement.getAttribute('role') === 'switch') {
                  const wasChecked = switchElement.checked;
                  
                  // Click the switch to enable JSON input
                  switchElement.click();
                  
                  const nowChecked = switchElement.checked;
                  
                  return {
                    found: true,
                    switchId: forId,
                    wasChecked,
                    nowChecked,
                    clicked: true,
                    labelText: jsonLabel.textContent
                  };
                }
              }
            }
            return { 
              found: false,
              wasChecked: false,
              nowChecked: false,
              clicked: false,
              availableLabels: labels.map(l => l.textContent).filter(t => t)
            };
          });
          
          if (!switchInfo.found) {
            throw new Error('JSON input switch not found');
          }
          
          if (switchInfo.clicked) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          // Wait for and find the JSON textarea
          await page.waitForFunction(
            () => !!(document.querySelector('textarea') || document.querySelector('input[type="text"]')),
            { timeout: 15000 }
          );
          
          const jsonInput = await page.$('textarea') || await page.$('input[type="text"]');
          
          if (!jsonInput) {
            throw new Error('JSON input textarea not found after enabling switch');
          }
          
          // Clear existing content and paste JSON
          await jsonInput.click({ clickCount: 3 });
          await page.keyboard.press('Delete');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const jsonString = JSON.stringify(chartJson, null, 2);
          
          // Use clipboard for more reliable pasting
          await page.evaluate((jsonValue) => {
            navigator.clipboard.writeText(jsonValue);
          }, jsonString);
          await new Promise(resolve => setTimeout(resolve, 300));
          
          await jsonInput.click();
          await page.keyboard.down('Control');
          await page.keyboard.press('KeyV');
          await page.keyboard.up('Control');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Trigger chart rendering
          await jsonInput.focus();
          await page.keyboard.press('Enter');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Set up download handling
          const client = await page.target().createCDPSession();
          await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: tempDownloadDir
          });
          
          // Find and click download button
          let downloadButton: any = null;
          
          const xpathSelectors = [
            '//button[contains(text(), "download")]',
            '//button[contains(text(), "Download")]'
          ];
          
          for (const xpath of xpathSelectors) {
            downloadButton = await page.evaluateHandle((xpathExpr: string) => {
              const result = document.evaluate(xpathExpr, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
              return result.singleNodeValue as HTMLElement;
            }, xpath);
            
            if (downloadButton && await page.evaluate((el) => el !== null, downloadButton)) {
              break;
            } else {
              downloadButton = null;
            }
          }
          
          if (downloadButton) {
            // Clear download directory before each download
            fs.readdirSync(tempDownloadDir).forEach(file => {
              try {
                fs.unlinkSync(path.join(tempDownloadDir, file));
              } catch (e) {
                // Ignore errors
              }
            });
            
            await downloadButton.click();
            
            // Wait for download to complete with polling
            let downloadedFiles: string[] = [];
            const maxWaitTime = 15000; // 15 seconds max wait
            const checkInterval = 500; // Check every 500ms
            const startTime = Date.now();
            
            while (Date.now() - startTime < maxWaitTime) {
              await new Promise(resolve => setTimeout(resolve, checkInterval));
              downloadedFiles = fs.readdirSync(tempDownloadDir).filter(f => 
                f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
              );
              
              if (downloadedFiles.length > 0) {
                break;
              }
            }
            
            if (downloadedFiles.length > 0) {
              const downloadedFile = downloadedFiles[downloadedFiles.length - 1];
              const downloadedImagePath = path.join(tempDownloadDir, downloadedFile);
              const downloadedImageBuffer = fs.readFileSync(downloadedImagePath);
              
              // Generate React component code
              const reactComponentCode = generateReactComponentCode(chartJson, chartName);
              
              // Save image and React component to the session output directory
              const outputImagePath = path.join(finalOutputDir, `${chartName}_fluent_chart.png`);
              fs.writeFileSync(outputImagePath, downloadedImageBuffer);
              
              const outputReactPath = path.join(finalOutputDir, `${chartName}_fluent_chart.tsx`);
              fs.writeFileSync(outputReactPath, reactComponentCode);
              
              // Add image to results
              chartImages.push({
                type: 'image' as const,
                mimeType: `image/${outputFormat}`,
                data: downloadedImageBuffer.toString('base64')
              });
              
              // Add React component code to results
              chartReactCodes.push({
                type: 'text' as const,
                text: `React Component Code for ${chartName}:\n\n\`\`\`tsx\n${reactComponentCode}\n\`\`\``
              });
              
              logEvent('INFO', 'Chart saved successfully', { 
                chartName,
                imageSize: downloadedImageBuffer.length,
                reactComponentGenerated: true
              });
            } else {
              logEvent('ERROR', 'No downloaded files found', { chartName });
            }
          } else {
            logEvent('ERROR', 'Download button not found', { chartName });
          }
          
          if (page) {
            await page.close();
          }
          
          // Add delay between charts
          if (i < maxCharts - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (chartError) {
          logEvent('ERROR', 'Error processing chart', { 
            chartIndex: i + 1,
            error: chartError instanceof Error ? chartError.message : String(chartError)
          });
          
          // Ensure page is closed even on error
          if (page) {
            try {
              await page.close();
            } catch (closeError) {
              // Ignore close errors
            }
          }
        }
      }
      
      await browser.close();
      
      // Cleanup temp files and directories
      [executionDir, tempDownloadDir].forEach(dir => {
        try {
          if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      });
      
      logEvent('INFO', 'Handler completed successfully', {
        chartCount: chartImages.length,
        reactCodeCount: chartReactCodes.length,
        format: outputFormat,
        outputDir: finalOutputDir
      });
      
      // Return chart images and React component code
      if (chartImages.length > 0) {
        return {
          content: [...chartImages, ...chartReactCodes]
        };
      } else {
        return {
          content: [
            { 
              type: 'text' as const, 
              text: `No chart images were captured. Output directory: ${finalOutputDir}`
            }
          ]
        };
      }
      
    } catch (error) {
      logEvent('ERROR', 'Handler failed', { 
        error: error instanceof Error ? error.message : error 
      });
      throw error;
    }
  };
  
  server.tool(
    "execute-python-and-capture-chart",
    "Execute Python code that generates a Plotly chart, convert it to Fluent UI representation, and capture it as an image. The Python code should create Plotly figures which will be automatically saved as JSON, then rendered in Fluent UI Charts and captured as images. Returns the chart image as base64 data along with saving both the image and JSON to an output directory.",
    {
      pythonCode: { 
        type: "string", 
        description: "Python code as a string that creates a Plotly figure using plotly.express or plotly.graph_objects. This parameter is required. Example: 'import plotly.express as px; fig = px.scatter(x=[1,2,3], y=[4,5,6])'"
      },
      timeout: { 
        type: "number", 
        description: "Python execution timeout in milliseconds (default: 30000)"
      },
      outputFormat: { 
        type: "string", 
        enum: ["png", "jpeg"],
        description: "Image output format (default: png)"
      }
    },
    async (context: any) => {
      // Try to find the actual tool arguments
      let toolArgs = context;
      
      // Check if context itself has the expected properties
      if (!context.pythonCode && context.arguments) {
        toolArgs = context.arguments;
      } else if (!context.pythonCode && context.params && context.params.arguments) {
        toolArgs = context.params.arguments;
      }
      
      return executePythonAndCaptureChartHandler({
        pythonCode: toolArgs.pythonCode,
        timeout: toolArgs.timeout,
        outputFormat: toolArgs.outputFormat
      });
    }
  );
  toolHandlers["execute-python-and-capture-chart"] = executePythonAndCaptureChartHandler;

  cachedServer = server;
  return server;
}

// POST /mcp endpoint for MCP requests
app.post('/mcp', async (req, res) => {
  // Log the incoming request body for debugging
  logEvent('DEBUG', 'MCP POST request received', { 
    body: req.body,
    method: req.body?.method 
  });
  
  // Workaround: If this is a tools/call request, handle it directly
  if (req.body?.method === 'tools/call' && req.body?.params) {
    const toolName = req.body.params.name;
    const toolArgs = req.body.params.arguments || {};
    
    if (toolName === 'execute-python-and-capture-chart' && toolHandlers[toolName]) {
      try {
        const result = await toolHandlers[toolName](toolArgs);
        res.json({
          jsonrpc: "2.0",
          id: req.body.id,
          result
        });
        return;
      } catch (error) {
        res.json({
          jsonrpc: "2.0",
          id: req.body.id,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal error'
          }
        });
        return;
      }
    }
  }
  
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId: string) => {
        logEvent('DEBUG', 'Session initialized', { sessionId });
        transports[sessionId] = transport;
      },
    });
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };
    const server = buildServer();
    await server.connect(transport);
  } else {
    return res.status(400).json({ error: 'Invalid MCP session' });
  }

  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    logEvent('ERROR', 'Error handling MCP request', { 
      error: error instanceof Error ? error.message : String(error)
    });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET /mcp for SSE
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId) {
    res.status(404).send('No session established. Initialize via POST first.');
    return;
  }

  if (!transports[sessionId]) {
    res.status(400).send('Invalid session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

// DELETE /mcp for session termination
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

// REST endpoint to invoke tool directly
app.post('/tools/execute-python-and-capture-chart', async (req, res) => {
  const args = req.body || {};

  try {
    const result = await toolHandlers["execute-python-and-capture-chart"](args);
    res.json(result);
  } catch (error) {
    logEvent('ERROR', 'Tool execution failed', { 
      error: error instanceof Error ? error.message : String(error)
    });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
});

// GET endpoint to list available tools
app.get('/tools', (req, res) => {
  res.json({ 
    tools: ["execute-python-and-capture-chart"],
    description: "Execute Python code and capture Fluent UI chart images"
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'fluent-chart-mcp',
    version: '1.0.0'
  });
});

app.listen(PORT, async () => {
  // Build server first to populate toolHandlers
  buildServer();
  
  console.log(`\n========================================`);
  console.log(`Fluent Charts MCP Server`);
  console.log(`========================================`);
  console.log(`Server listening on port ${PORT}`);
  
  // Validate Python environment
  const pythonCheck = await validatePythonEnvironment();
  
  if (pythonCheck.valid) {
    console.log(`[Python] ${pythonCheck.message}`);
  } else {
    console.log(`[Python] ${pythonCheck.message}`);
    console.log(`[Warning] Chart generation may fail without Python setup`);
  }
  console.log(`\nAvailable endpoints:`);
  console.log(`  POST /tools/execute-python-and-capture-chart - Execute Python code and capture chart`);
  console.log(`  GET /tools - List available tools`);
  console.log(`  GET /health - Health check`);
  console.log(`\nMCP endpoints:`);
  console.log(`  POST /mcp - MCP protocol requests`);
  console.log(`  GET /mcp - Server-sent events for notifications`);
  console.log(`  DELETE /mcp - Session termination`);
  console.log(`\nLogging:`);
  console.log(`  - All events logged to: ${LOG_FILE}`);
  console.log(`  - Chart outputs saved to: output/charts/<session_id>/`);
  console.log(`\nFeatures:`);
  console.log(`  - Executes Python Plotly code`);
  console.log(`  - Auto-detects generated Plotly figures`);
  console.log(`  - Renders charts in Fluent UI`);
  console.log(`  - Captures chart images via Puppeteer`);
  console.log(`  - Returns base64-encoded images`);
  console.log(`  - Saves images and JSON to session folders`);
  console.log(`========================================\n`);
  
  logEvent('INFO', 'MCP server started successfully', { 
    port: PORT, 
    logFile: LOG_FILE 
  });
});

// Graceful shutdown
const handleShutdown = (signal: string) => {
  console.log('\nShutting down server...');
  logEvent('INFO', 'Server shutdown initiated', { signal });
  process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
