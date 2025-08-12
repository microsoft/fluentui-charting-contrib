import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { ocvAnalysisHandler } from './handlers/ocvAnalysisHandler.js';
import { feedbackLogsScrapingAgent } from './handlers/feedbackLogsScrapingAgent.js';
import { LOG_FILE, logEvent, setMcpServer } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store chart type globally
let globalChartType: string | undefined;

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;

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
    name: "plotly-dataset-mcp",
    version: "1.0.0",
    capabilities: {
      resources: {},
      tools: {},
      sampling: {}, // Enable sampling capability for LLM access
    },
  });

  // Register modularized handlers
  server.tool(
    "ocv-analysis",
    {
      issueFolder: {
        type: "string",
        description: "Specific issue folder to analyze (e.g., 'issue_1'). If not provided, analyzes all issue folders"
      },
      maxAttempts: {
        type: "number",
        description: "Maximum number of retry attempts for code execution (default: 3)"
      },
      generateMissingData: {
        type: "boolean",
        description: "Whether to generate synthetic datasets for missing data files"
      },
      prompt: {
        type: "string",
        description: "User prompt describing specific analysis requirements or focus areas"
      },
      userPrompt: {
        type: "string",
        description: "Alternative parameter name for user prompt (same as prompt)"
      },
      dashboardUrl: {
        type: "string",
        description: "URL to Microsoft Copilot Dashboard to fetch issues from (e.g., 'https://copilotdash.microsoft.com/product/feedback?product=M365ChatWebChat&queryId=...')"
      },
      query: {
        type: "string",
        description: "Query string that may contain issue folder and analysis requirements"
      }
    },
    ocvAnalysisHandler
  );
  toolHandlers["ocv-analysis"] = (args) => ocvAnalysisHandler(args, undefined);

  server.tool(
    "feedback-logs-scraping-agent",
    "Enhanced dashboard agent that navigates to Microsoft Copilot Dashboard, clicks on a table row, accesses Conversation Messages tab, and extracts JSON conversation data using Monaco editor detection.",
    {
      dashboardUrl: {
        type: "string",
        description: "URL to Microsoft Copilot Dashboard"
      },
      outputDir: {
        type: "string",
        description: "Directory to save extracted JSON conversation and workflow results"
      },
      query: {
        type: "string",
        description: "Additional query parameters"
      }
    },
    feedbackLogsScrapingAgent
  );
  toolHandlers["feedback-logs-scraping-agent"] = (args) => feedbackLogsScrapingAgent(args, undefined);

  cachedServer = server;
  return server;
}

// POST /mcp endpoint for MCP requests
app.post('/mcp', async (req, res) => {
  console.log('[MCP] POST request received:', req.method, req.url);
  logEvent('INFO', 'MCP-ENDPOINT', 'POST request received', { method: req.method, url: req.url });
  console.log('[MCP] Headers:', req.headers);
  logEvent('DEBUG', 'MCP-ENDPOINT', 'Request headers received', { headers: req.headers });
  console.log('[MCP] Body:', JSON.stringify(req.body, null, 2));
  logEvent('DEBUG', 'MCP-ENDPOINT', 'Request body received', { body: req.body });

  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    console.log('[MCP] Using existing session:', sessionId);
    logEvent('DEBUG', 'MCP-ENDPOINT', 'Using existing session', { sessionId });
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    console.log('[MCP] Creating new session for initialize request');
    logEvent('INFO', 'MCP-ENDPOINT', 'Creating new session for initialize request', {});
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        console.log('[MCP] Session initialized:', sessionId);
        logEvent('INFO', 'MCP-ENDPOINT', 'Session initialized', { sessionId });
        transports[sessionId] = transport;
      },
    });
    transport.onclose = () => {
      if (transport.sessionId) {
        console.log('[MCP] Session closed:', transport.sessionId);
        logEvent('INFO', 'MCP-ENDPOINT', 'Session closed', { sessionId: transport.sessionId });
        delete transports[transport.sessionId];
      }
    };
    const server = buildServer();
    
    // Set the MCP server reference for direct LLM calls
    setMcpServer(server);
    
    await server.connect(transport);
  } else {
    console.log('[MCP] Invalid request - no session ID and not initialize');
    return res.status(400).json({ error: 'Invalid MCP session' });
  }

  try {
    // Pass the request to the transport
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('[MCP] Error handling request:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Reusable handler for GET and DELETE requests (SSE and session termination)
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId) {
    // For clients trying to connect via SSE without session, return 404 to trigger fallback
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

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

// REST endpoint to invoke tools directly
app.post('/tools/:toolName', async (req, res) => {
  const { toolName } = req.params;
  const args = req.body || {};

  console.log(`[REST] Invoking tool: ${toolName} with args:`, args);
  logEvent('INFO', 'REST-' + toolName, 'Tool invoked via REST API', args);

  if (!toolHandlers[toolName]) {
    logEvent('ERROR', 'REST-' + toolName, 'Tool not found', { toolName });
    return res.status(404).json({ error: `Tool '${toolName}' not found` });
  }

  try {
    const result = await toolHandlers[toolName](args);
    logEvent('INFO', 'REST-' + toolName, 'Tool completed successfully', { resultLength: JSON.stringify(result).length });
    res.json(result);
  } catch (error) {
    console.error(`[REST] Error invoking tool ${toolName}:`, error);
    logEvent('ERROR', 'REST-' + toolName, 'Tool execution failed', { error: error instanceof Error ? error.message : error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
});

// GET endpoint to list available tools
app.get('/tools', (req, res) => {
  const availableTools = Object.keys(toolHandlers);
  res.json({ tools: availableTools });
});

// Test route to invoke generate-datasets directly
app.get('/test/generate-datasets', async (req, res) => {
  const prompt = req.query.prompt as string || "Generate datasets for line chart";

  console.log(`[TEST] Generating datasets with prompt: ${prompt}`);
  logEvent('INFO', 'TEST-generate-datasets', 'Test endpoint invoked', { prompt });

  try {
    const result = await toolHandlers['generate-datasets']({ prompt });
    logEvent('INFO', 'TEST-generate-datasets', 'Test completed successfully', { promptLength: prompt.length });
    res.json({
      success: true,
      prompt,
      result
    });
  } catch (error) {
    console.error('[TEST] Error generating datasets:', error);
    logEvent('ERROR', 'TEST-generate-datasets', 'Test failed', { error: error instanceof Error ? error.message : error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Test route for OCV analysis
app.get('/test/ocv-analysis', async (req, res) => {
  const issueFolder = req.query.issueFolder as string;
  const maxAttempts = parseInt(req.query.maxAttempts as string) || 3;
  const generateMissingData = req.query.generateMissingData !== 'false';

  console.log(`[TEST] Running OCV analysis: issueFolder=${issueFolder || 'all'}, maxAttempts=${maxAttempts}, generateMissingData=${generateMissingData}`);
  logEventLocal('INFO', 'TEST-ocv-analysis', 'Test endpoint invoked', { issueFolder, maxAttempts, generateMissingData });

  try {
    const args: any = { maxAttempts, generateMissingData };
    if (issueFolder) args.issueFolder = issueFolder;

    const result = await toolHandlers['ocv-analysis'](args);
    logEventLocal('INFO', 'TEST-ocv-analysis', 'Test completed successfully', { issueFolder, maxAttempts, generateMissingData });
    res.json({
      success: true,
      issueFolder: issueFolder || 'all',
     
      maxAttempts,
      generateMissingData,
      result
    });
  } catch (error) {
    console.error('[TEST] Error running OCV analysis:', error);
    logEvent('ERROR', 'TEST-ocv-analysis', 'Test failed', { error: error instanceof Error ? error.message : error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Test route for Dashboard Scraping Agent
app.get('/test/dashboard-scraping-agent', async (req, res) => {
  const dashboardUrl = req.query.dashboardUrl as string || 'https://copilotdash.microsoft.com/product/feedback?product=M365ChatWebChat&queryId=b6b4f975-8a88-4eac-a675-805fcb1a071b';
  const outputDir = req.query.outputDir as string || path.join(process.cwd(), 'dashboard_issues_agent');
  const includeOcvLinks = req.query.includeOcvLinks !== 'false';
  const maxIssuesPerDate = parseInt(req.query.maxIssuesPerDate as string) || 50;

  console.log(`[TEST] Running dashboard scraping agent: dashboardUrl=${dashboardUrl}, outputDir=${outputDir}, includeOcvLinks=${includeOcvLinks}, maxIssuesPerDate=${maxIssuesPerDate}`);
  logEvent('INFO', 'TEST-dashboard-scraping-agent', 'Test endpoint invoked', { dashboardUrl, outputDir, includeOcvLinks, maxIssuesPerDate });

  try {
    const args: any = { dashboardUrl, outputDir, includeOcvLinks, maxIssuesPerDate };
    const result = await toolHandlers['dashboard-scraping-agent'](args);
    logEvent('INFO', 'TEST-dashboard-scraping-agent', 'Test completed successfully', { dashboardUrl, outputDir, includeOcvLinks, maxIssuesPerDate });
    res.json({
      success: true,
      dashboardUrl,
      outputDir,
      includeOcvLinks,
      maxIssuesPerDate,
      result
    });
  } catch (error) {
    console.error('[TEST] Error running dashboard scraping agent:', error);
    logEvent('ERROR', 'TEST-dashboard-scraping-agent', 'Test failed', { error: error instanceof Error ? error.message : error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

const mcpServerInstance = buildServer();
export { mcpServerInstance };

app.listen(PORT, () => {
  // Build server first to populate toolHandlers
  buildServer();
  console.log(`Server listening on port ${PORT}`);
  logEvent('INFO', 'SERVER', 'MCP server started successfully', {
    port: PORT,
    logFile: LOG_FILE,
    availableTools: Object.keys(toolHandlers)
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[MCP] Shutting down server...');
  logEvent('INFO', 'SERVER', 'Server shutdown initiated (SIGINT)', {});
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[MCP] Shutting down server...');
  logEvent('INFO', 'SERVER', 'Server shutdown initiated (SIGTERM)', {});
  process.exit(0);
});

function logEventLocal(level: string, source: string, message: string, details?: any) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] [${source}] ${message} ${details ? JSON.stringify(details) : ''}\n`;
  // Write to debug log if available
  try {
    fs.appendFileSync(LOG_FILE, logLine, 'utf8');
  } catch (e) {
    // Ignore file write errors
  }
  // Also log to console
  console.log(logLine.trim());
}
