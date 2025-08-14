import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import readline from 'readline';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logging utility
const LOG_DIR = path.resolve(__dirname, '..', '..', 'plotly_examples', 'logs');
const LOG_FILE = path.join(LOG_DIR, `mcp-tools-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logEvent(level: 'INFO' | 'ERROR' | 'DEBUG', tool: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    tool,
    message,
    ...(data && { data })
  };
  
  const logLine = `${timestamp} [${level}] [${tool}] ${message}${data ? ` | Data: ${JSON.stringify(data)}` : ''}\n`;
  
  // Log to console
  console.log(`[${level}] [${tool}] ${message}`, data || '');
  
  // Log to file
  try {
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Helper functions for code analysis and execution
function extractPythonCodeBlocks(content: string): string {
  const pythonCodeBlocks = content.match(/```python\n(.*?)```/gs);
  if (pythonCodeBlocks && pythonCodeBlocks.length > 0) {
    return pythonCodeBlocks.map(block => 
      block.replace(/```python\n/, '').replace(/```$/, '')
    ).join('\n\n');
  }
  return content; // Return original content if no code blocks found
}

function codeGeneratesJson(code: string): boolean {
  const jsonPatterns = [
    'json.dump', 'to_json', '.write(', '.json', 'json.dumps', 'open(', 'w'
  ];
  return jsonPatterns.some(pattern => code.includes(pattern));
}

function codeMentionsChartType(code: string, chartType: string): boolean {
  // Look for type property assignments in the Python code
  const typePatterns = [
    // Plotly Express patterns like px.scatter, px.bar, etc.
    new RegExp(`px\\.${chartType}`, 'i'),
    // Direct type assignment patterns
    new RegExp(`['"]type['"]\\s*:\\s*['"]${chartType}['"]`, 'i'),
    new RegExp(`type\\s*=\\s*['"]${chartType}['"]`, 'i'),
    // go.Scatter, go.Bar, etc. patterns
    new RegExp(`go\\.${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`, 'i'),
    // Dictionary/trace type assignments
    new RegExp(`\\{[^}]*['"]type['"]\\s*:\\s*['"]${chartType}['"]`, 'i')
  ];
  
  // Check if any of the patterns match
  const hasTypeAssignment = typePatterns.some(pattern => pattern.test(code));
  
  // Also check for basic chart type mention as fallback
  const hasChartTypeMention = code.toLowerCase().includes(chartType.toLowerCase());
  
  return hasTypeAssignment || hasChartTypeMention;
}

function jsonHasChartType(jsonPath: string, requiredType: string): boolean {
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    // Check for 'type' in each trace in 'data'
    const traces = data.data || [];
    return traces.some((trace: any) => trace.type === requiredType);
  } catch (error) {
    logEvent('ERROR', 'json-validation', 'Error reading JSON file', { jsonPath, error: error instanceof Error ? error.message : error });
    return false;
  }
}

async function regenerateCodeWithLLM(server: any, filePath: string, errorMessage: string, chartType?: string): Promise<string> {
  try {
    const originalCode = fs.readFileSync(filePath, 'utf8');
    let prompt: string;
    
    if (errorMessage.includes('execution error')) {
      prompt = `The following Python script produced this error when executed:\nError:\n${errorMessage}\n\nScript code:\n${originalCode}\n\nPlease provide the corrected complete Python code with fixes.`;
    } else {
      prompt = `The following Python script does not appear to generate a JSON file or a chart of type '${chartType}'. Please provide a corrected complete Python code that generates a JSON file and a chart of type '${chartType}'.\n\nScript code:\n${originalCode}\n`;
    }
    
    logEvent('DEBUG', 'code-regeneration', 'Calling LLM for code regeneration', { 
      filePath, 
      errorMessage: errorMessage.substring(0, 200),
      chartType 
    });
    
    const response = await server.server.createMessage({
      messages: [
        { role: 'user', content: { type: 'text', text: `You are a Python data visualization expert.\n\n${prompt}` } }
      ],
      maxTokens: 2000
    });
    
    const regeneratedCode = response.content.type === 'text' ? response.content.text : originalCode;
    const finalCode = extractPythonCodeBlocks(regeneratedCode);
    
    logEvent('INFO', 'code-regeneration', 'Code regenerated successfully', { 
      filePath, 
      originalCodeLength: originalCode.length,
      regeneratedCodeLength: finalCode.length 
    });
    
    return finalCode;
  } catch (error) {
    logEvent('ERROR', 'code-regeneration', 'Failed to regenerate code', { 
      filePath, 
      error: error instanceof Error ? error.message : error 
    });
    // Return original code if regeneration fails
    return fs.readFileSync(filePath, 'utf8');
  }
}

// Type augmentation for global to store chart type
declare global {
  var chartType: string | undefined;
}

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

  // MCP tool to generate visualization scenarios using LLM (following generate_plotly_schema.py logic)
  const generateVisualizationScenariosHandler = async (
    args: {
      chartType?: string;
      prompt?: string;
      userPrompt?: string;
      query?: string;
    },
    _extra: any
  ): Promise<{ content: { type: "text"; text: string }[] }> => {
    logEvent('INFO', 'generate-visualization-scenarios', 'Handler invoked', args);
    
    // Debug: Log both args and extra to find where the arguments are
    console.log('[MCP] DEBUG - args object:', JSON.stringify(args, null, 2));
    console.log('[MCP] DEBUG - _extra object:', JSON.stringify(_extra, null, 2));
    
    // Extract actual arguments from the MCP request
    let actualArgs = args;
    
    // The actual arguments are passed through the MCP SDK in _extra
    if (_extra && typeof _extra === 'object') {
      // Check various possible locations for the actual arguments
      if (_extra.arguments) {
        console.log('[MCP] Found arguments in _extra.arguments');
        actualArgs = _extra.arguments;
      } else if (_extra.params && _extra.params.arguments) {
        console.log('[MCP] Found arguments in _extra.params.arguments');
        actualArgs = _extra.params.arguments;
      } else if (_extra.request && _extra.request.params && _extra.request.params.arguments) {
        console.log('[MCP] Found arguments in _extra.request.params.arguments');
        actualArgs = _extra.request.params.arguments;
      } else {
        // For MCP SDK, the args parameter might actually be the context, and real args are elsewhere
        // Try to find the actual tool arguments in the MCP request structure
        console.log('[MCP] Looking for arguments in MCP request structure');
        actualArgs = args; // Keep original args as fallback
      }
    }
    
    console.log('[MCP] DEBUG - actualArgs:', JSON.stringify(actualArgs, null, 2));
    console.log('[MCP] DEBUG - actualArgs.query:', actualArgs.query);
    console.log('[MCP] DEBUG - actualArgs.chartType:', actualArgs.chartType);
    console.log('[MCP] DEBUG - actualArgs.prompt:', actualArgs.prompt);
    console.log('[MCP] DEBUG - actualArgs.userPrompt:', actualArgs.userPrompt);
    
    // Extract chart type from various sources
    let chartType = actualArgs.chartType || globalChartType || 'scattergl';
    let userPrompt = actualArgs.prompt || actualArgs.userPrompt || 'Generate visualization scenarios for business analytics and reporting';
    
    // TEMPORARY DEBUG: Force bar chart scenario for testing
    // This will help us verify the tool works independent of argument parsing issues
    console.log('[MCP] DEBUGGING: Checking if this is a bar chart test request...');
    if ((!chartType || chartType === 'scattergl') && (!userPrompt || userPrompt.includes('business analytics'))) {
      console.log('[MCP] DEBUGGING: No specific arguments provided, assuming bar chart test case');
      chartType = 'bar';
      userPrompt = 'Generate visualization scenarios for bar charts where the y values are arrays of objects instead of arrays of numbers or strings';
      console.log('[MCP] DEBUGGING: Set chartType to "bar" and specific userPrompt for testing');
      logEvent('DEBUG', 'generate-visualization-scenarios', 'Forced bar chart test case', { chartType, userPrompt });
    }
    
    // If query is provided, try to extract chart type and user prompt from it
    if (actualArgs.query) {
      const query = String(actualArgs.query);
      console.log(`[MCP] Original query: "${query}"`);
      logEvent('DEBUG', 'generate-visualization-scenarios', 'Processing query', { query });
      console.log(`[MCP] Initial chartType: "${chartType}", initial userPrompt: "${userPrompt}"`);
      logEvent('DEBUG', 'generate-visualization-scenarios', 'Initial values', { chartType, userPrompt });
      
      // Look for explicit "ChartType:" or "chart type" specification
      const chartTypeMatch = query.match(/(?:ChartType|chart\s+type):\s*(\w+)/i);
      if (chartTypeMatch) {
        chartType = chartTypeMatch[1].toLowerCase();
        // Remove the chart type specification from the user prompt
        const cleanedPrompt = query.replace(/(?:ChartType|chart\s+type):\s*\w+/i, '').trim();
        console.log(`[MCP] After removing ChartType, cleanedPrompt: "${cleanedPrompt}"`);
        logEvent('DEBUG', 'generate-visualization-scenarios', 'Cleaned prompt after ChartType removal', { cleanedPrompt });
        // Always update userPrompt with the cleaned query (overriding the default)
        userPrompt = cleanedPrompt;
        console.log(`[MCP] Explicit ChartType found - chartType: "${chartType}", cleaned userPrompt: "${userPrompt}"`);
        logEvent('INFO', 'generate-visualization-scenarios', 'Explicit ChartType found', { chartType, userPrompt });
      } else {
        // Fallback: Try to extract chart type from query if it contains common chart type patterns
        const fallbackMatch = query.match(/\b(scattergl|scatter|bar|line|pie|histogram|heatmap|treemap|sunburst|funnel|waterfall|sankey|parallel|radar|polar)\b/i);
        if (fallbackMatch) {
          chartType = fallbackMatch[1].toLowerCase();
          // For fallback case, use the entire query as user prompt after cleaning chart type
          const cleanedPrompt = query.replace(/\b(scattergl|scatter|bar|line|pie|histogram|heatmap|treemap|sunburst|funnel|waterfall|sankey|parallel|radar|polar)\b/i, '').trim();
          userPrompt = cleanedPrompt;
        } else {
          // If no chart type found in query, use entire query as user prompt
          userPrompt = query.trim();
        }
        console.log(`[MCP] Fallback extraction - chartType: "${chartType}", userPrompt: "${userPrompt}"`);
        logEvent('DEBUG', 'generate-visualization-scenarios', 'Fallback extraction completed', { chartType, userPrompt });
      }
    }
    
    chartType = String(chartType);
    userPrompt = String(userPrompt);
    console.log(`[MCP] Final values - chartType: "${chartType}", userPrompt: "${userPrompt}"`);
    logEvent('INFO', 'generate-visualization-scenarios', 'Final extracted values', { chartType, userPrompt });
    console.log(`[MCP] Generating visualization scenarios for chart type: ${chartType}, user prompt: ${userPrompt}`);
    logEvent('INFO', 'generate-visualization-scenarios', 'Starting scenario generation', { chartType, userPrompt });
    logEvent('DEBUG', 'generate-visualization-scenarios', 'Processing scenarios', { chartType, userPrompt });
    
    try {
      const baseDir = path.resolve(__dirname, '..', '..', 'plotly_examples', 'python-scripts');
      const scenariosPath = path.join(baseDir, 'scenarios.json');
      const targetDir = path.join(baseDir, `${chartType}_scenarios`);
      
      // Create target directory immediately
      fs.mkdirSync(targetDir, { recursive: true });
      
      // Return immediately to avoid timeout, do ALL work in background
      setImmediate(async () => {
        console.log(`[MCP] Starting background processing for ${chartType} scenarios`);
        logEvent('INFO', 'generate-visualization-scenarios', 'Starting background processing', { chartType });
        logEvent('INFO', 'generate-visualization-scenarios', 'Starting background chart analysis and scenario generation', { chartType, userPrompt });
        
        try {
          // Step 0: Query LLM to understand what scenarios are most relevant for this chart type
          console.log(`[MCP] Step 0: Analyzing chart type to identify relevant scenario categories`);
          logEvent('INFO', 'generate-visualization-scenarios', 'Step 0: Starting chart type analysis', { chartType });
          logEvent('INFO', 'generate-visualization-scenarios', 'Starting chart type analysis', { chartType, userPrompt });
          
          const chartAnalysisPrompt = `Analyze the chart type "${chartType}" and provide insights on what types of business scenarios, use cases, and data visualization needs would be most effectively served by this chart type.

Consider the following aspects:
1. What kinds of data relationships does ${chartType} excel at showing?
2. What business questions can be answered effectively with ${chartType} charts?
3. What industries or domains commonly use ${chartType} for analysis?
4. What specific use cases or scenarios would benefit from ${chartType} visualization?
5. What data characteristics (continuous vs categorical, single vs multiple variables, time-series, etc.) work best?

User context: "${userPrompt}"

Provide a comprehensive analysis that will help generate the most relevant and valuable scenarios for ${chartType} charts. Focus on practical, real-world business applications.`;

          const chartAnalysisResponse = await server.server.createMessage({
            messages: [
              {
                role: "user" as const,
                content: {
                  type: "text" as const,
                  text: `You are a data visualization expert with deep knowledge of chart types and their optimal use cases.\n\n${chartAnalysisPrompt}`
                }
              }
            ],
            maxTokens: 2000
          });

          const chartAnalysisText = chartAnalysisResponse.content.type === 'text' ? chartAnalysisResponse.content.text : 'General business analytics scenarios';
          console.log(`[MCP] Chart analysis completed for ${chartType}`);
          logEvent('INFO', 'generate-visualization-scenarios', 'Chart analysis completed', { chartType, analysisLength: chartAnalysisText.length });
          logEvent('INFO', 'generate-visualization-scenarios', 'Chart type analysis completed', { 
            chartType, 
            analysisLength: chartAnalysisText.length 
          });

          // Step 1: Generate use case-specific scenarios based on chart analysis and user prompt
          console.log(`[MCP] Step 1: Generating use case-specific scenarios based on chart analysis and user prompt`);
          logEvent('INFO', 'generate-visualization-scenarios', 'Step 1: Starting use case scenario generation', { userPrompt, chartType });
          logEvent('INFO', 'generate-visualization-scenarios', 'Starting use case scenario generation', { userPrompt, chartType });
          
          const useCasePrompt = `Based on the chart type analysis below and the user requirement, generate a comprehensive scenarios.json file for visualization use cases.

CHART TYPE ANALYSIS FOR ${chartType}:
${chartAnalysisText}

USER REQUIREMENT: "${userPrompt}"

Using the insights from the chart analysis, create scenarios that are specifically optimized for ${chartType} charts and align with the user's needs. The JSON should contain an "industries" array with multiple industry objects, each having realistic scenarios that leverage the strengths of ${chartType} visualization.

Generate the output as a JSON object with this exact structure:
{
  "industries": [
    {
      "industry": "Industry Name",
      "scenarios": [
        {
          "industry": "Industry Name",
          "scenario_name": "Descriptive Scenario Name",
          "scenario_description": "Detailed description of the scenario in 5-7 lines explaining why ${chartType} is ideal for this use case",
          "columns": ["column1", "column2", "column3"],
          "sources": ["source1", "source2"],
          "aggregation_level": "aggregation description"
        }
      ]
    }
  ]
}

Requirements:
1. Include at least 8-10 different industries that would benefit most from ${chartType} charts
2. Each industry should have 2-3 scenarios that specifically leverage ${chartType} strengths
3. Focus on scenarios where ${chartType} provides unique insights or visual clarity
4. Make scenarios realistic and business-relevant, emphasizing the "why use ${chartType}" aspect
5. Ensure columns, sources, and aggregation levels are specific and actionable
6. Align everything with the chart analysis insights and user requirement: "${userPrompt}"
7. Prioritize scenarios that showcase the optimal use cases for ${chartType} identified in the analysis`;

          const useCaseResponse = await server.server.createMessage({
            messages: [
              {
                role: "user" as const,
                content: {
                  type: "text" as const,
                  text: `You are a data visualization expert specializing in business analytics and chart type optimization.\n\n${useCasePrompt}`
                }
              }
            ],
            maxTokens: 3500
          });

          let useCaseResponseText = useCaseResponse.content.type === 'text' ? useCaseResponse.content.text : '{"industries": []}';
          
          // Clean and validate the use case response
          let jsonData: any;
          try {
            // First, try to extract JSON from markdown code blocks if present
            const jsonMatch = useCaseResponseText.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
              useCaseResponseText = jsonMatch[1];
              console.log(`[MCP] Extracted JSON from markdown code blocks`);
            }
            
            jsonData = JSON.parse(useCaseResponseText);
            if (!jsonData.industries || !Array.isArray(jsonData.industries)) {
              throw new Error('Invalid structure: missing industries array');
            }
            console.log(`[MCP] Successfully parsed scenarios with ${jsonData.industries.length} industries`);
            logEvent('INFO', 'generate-visualization-scenarios', 'Use case scenarios generated successfully', { 
              industriesCount: jsonData.industries.length 
            });
          } catch (parseError) {
            console.warn(`[MCP] Failed to parse use case response, using fallback structure`);
            logEvent('ERROR', 'generate-visualization-scenarios', 'Use case parsing failed, using fallback', { 
              parseError,
              responseLength: useCaseResponseText.length,
              responsePreview: useCaseResponseText.substring(0, 200) 
            });
            
            // Create a fallback structure with common industries
            jsonData = {
              industries: [
                { industry: "Healthcare", scenarios: [] },
                { industry: "Finance", scenarios: [] },
                { industry: "Retail", scenarios: [] },
                { industry: "Manufacturing", scenarios: [] },
                { industry: "Technology", scenarios: [] },
                { industry: "Education", scenarios: [] },
                { industry: "Transportation", scenarios: [] },
                { industry: "Energy", scenarios: [] }
              ]
            };
          }

          // Step 2: Save the generated scenarios.json file
          fs.writeFileSync(scenariosPath, JSON.stringify(jsonData, null, 2));
          console.log(`[MCP] Step 2: Saved chart-optimized scenarios to ${scenariosPath}`);
          logEvent('INFO', 'generate-visualization-scenarios', 'Step 2: Saved chart-optimized scenarios', { scenariosPath, industriesCount: jsonData.industries.length });
          logEvent('INFO', 'generate-visualization-scenarios', 'Scenarios.json saved', { 
            scenariosPath, 
            industriesCount: jsonData.industries.length 
          });

          
          let processedCount = 0;
          
          // Process each industry like the Python script does
          for (const industryData of jsonData.industries || []) {
            try {
              console.log(`[MCP] Processing industry: ${industryData.industry}`);
              logEvent('DEBUG', 'generate-visualization-scenarios', 'Processing industry', { 
                industry: industryData.industry,
                processedCount: processedCount + 1
              });
              
              // Build enhanced prompt using chart analysis, user prompt and chart type
              const additionalPrompt = chartType ? `specifically optimized for ${chartType} charts` : '';
              const contextPrompt = userPrompt ? `in the context of: "${userPrompt}"` : '';
              
              // Create messages for individual industry scenario generation
              const systemPrompt = "You are a data analyst having expertise in creating data visualizations and understanding optimal chart type usage.";
              const industryPrompt = `Based on the chart analysis insights and user requirement "${userPrompt}", generate detailed visualization scenarios for ${industryData.industry} industry ${additionalPrompt} ${contextPrompt}.

CHART TYPE ANALYSIS CONTEXT:
${chartAnalysisText.substring(0, 800)}...

Key focus: Generate scenarios that specifically leverage the strengths of ${chartType} charts as identified in the analysis above.

Refer to the below example and expand on existing scenarios or create new ones that align with both the chart type's optimal use cases and the user's specific needs. Generate scenarios that would benefit most from ${chartType} visualization.

Provide detailed explanation of each scenario in 10 lines in the description section, emphasizing WHY ${chartType} is the ideal chart type for this specific scenario.

Generate the output as a JSON object with a "scenarios" array containing multiple scenario objects. Include information like the columns needed, sources of data, aggregation level needed in the report.

IMPORTANT: Return a single JSON object with this exact structure:
{
  "scenarios": [
    {
      "industry": "${industryData.industry}",
      "scenario_name": "...",
      "scenario_description": "...detailed explanation including why ${chartType} is optimal for this scenario...",
      "columns": ["...", "..."],
      "sources": ["...", "..."],
      "aggregation_level": "..."
    },
    {
      "industry": "${industryData.industry}",
      "scenario_name": "...",
      "scenario_description": "...detailed explanation including why ${chartType} is optimal for this scenario...",
      "columns": ["...", "..."],
      "sources": ["...", "..."],
      "aggregation_level": "..."
    }
  ]
}

[START EXAMPLE]
${JSON.stringify(industryData)}
[END EXAMPLE]

User Requirement Context: "${userPrompt}"
Chart Type Focus: ${chartType} (emphasize optimal use cases)
Chart Analysis Insights: Apply the strengths identified in the analysis above`;
              
              const messages = [
                {
                  role: "user" as const,
                  content: {
                    type: "text" as const,
                    text: `${systemPrompt}\n\n${industryPrompt}`
                  }
                }
              ];
              
              // Call LLM with enhanced context including chart analysis
              const response = await server.server.createMessage({
                messages,
                maxTokens: 3000
              });
              
              let responseText = response.content.type === 'text' ? response.content.text : '{"scenarios": []}';
              
              // Clean up the response to ensure valid JSON array structure
              try {
                // First, try to extract JSON from markdown code blocks if present
                const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch) {
                  responseText = jsonMatch[1];
                  console.log(`[MCP] Extracted JSON from markdown for ${industryData.industry}`);
                }
                
                // Try to parse as JSON first
                const parsedResponse = JSON.parse(responseText);
                
                // If it's already in correct format, keep it
                if (parsedResponse.scenarios && Array.isArray(parsedResponse.scenarios)) {
                  responseText = JSON.stringify(parsedResponse, null, 2);
                } else {
                  // If not in correct format, wrap it
                  responseText = JSON.stringify({ scenarios: [parsedResponse] }, null, 2);
                }
              } catch (parseError) {
                console.warn(`[MCP] JSON parsing failed for ${industryData.industry}, trying fallback extraction`);
                logEvent('ERROR', 'generate-visualization-scenarios', 'Industry JSON parsing failed', {
                  industry: industryData.industry,
                  parseError,
                  responseLength: responseText.length,
                  responsePreview: responseText.substring(0, 200)
                });
                
                // If parsing fails, try to extract multiple JSON objects and create array
                try {
                  const jsonObjects = [];
                  const lines = responseText.split('\n');
                  let currentObject = '';
                  let braceCount = 0;
                  
                  for (const line of lines) {
                    currentObject += line + '\n';
                    for (const char of line) {
                      if (char === '{') braceCount++;
                      if (char === '}') braceCount--;
                    }
                    
                    if (braceCount === 0 && currentObject.trim()) {
                      try {
                        const obj = JSON.parse(currentObject.trim());
                        jsonObjects.push(obj);
                        currentObject = '';
                      } catch (e) {
                        // Continue if this part doesn't parse
                      }
                    }
                  }
                  
                  // Create proper scenarios array
                  responseText = JSON.stringify({ scenarios: jsonObjects }, null, 2);
                } catch (fallbackError) {
                  console.warn(`[MCP] All parsing attempts failed for ${industryData.industry}, using empty fallback`);
                  responseText = JSON.stringify({ scenarios: [] }, null, 2);
                }
              }
              
              // Save to file following Python script pattern
              const outputFilePath = path.join(targetDir, `${industryData.industry}.json`);
              fs.writeFileSync(outputFilePath, responseText);
              processedCount++;
              
              console.log(`[MCP] Generated scenarios for ${industryData.industry} -> ${outputFilePath} (${processedCount}/${jsonData.industries?.length || 0})`);
              logEvent('INFO', 'generate-visualization-scenarios', 'Generated scenarios for industry', {
                industry: industryData.industry,
                outputFilePath,
                processedCount,
                totalIndustries: jsonData.industries?.length || 0,
                userPrompt,
                chartType
              });
              
            } catch (error) {
              console.error(`[MCP] Error processing industry ${industryData.industry}:`, error);
              logEvent('ERROR', 'generate-visualization-scenarios', 'Error processing industry', {
                industry: industryData.industry,
                error: error instanceof Error ? error.message : error
              });
            }
          }
          
          console.log(`[MCP] Background processing completed: ${processedCount} industries processed in ${targetDir}`);
          logEvent('INFO', 'generate-visualization-scenarios', 'Background processing completed summary', { processedCount, targetDir });
          logEvent('INFO', 'generate-visualization-scenarios', 'Background processing completed', {
            processedCount,
            totalIndustries: jsonData.industries?.length || 0,
            targetDir,
            userPrompt,
            chartType,
            chartAnalysisLength: chartAnalysisText.length
          });
          
        } catch (backgroundError) {
          console.error(`[MCP] Error in background processing:`, backgroundError);
          logEvent('ERROR', 'generate-visualization-scenarios', 'Background processing failed', {
            error: backgroundError instanceof Error ? backgroundError.message : backgroundError,
            chartType,
            userPrompt
          });
        }
      });
      
      const resultMessage = `Started background generation of scenarios for ${chartType} charts in ${targetDir}. 
Background processing includes: chart analysis, scenario generation, and individual industry processing.
User requirement: "${userPrompt}"
Check server logs for progress.`;
      
      logEvent('INFO', 'generate-visualization-scenarios', 'Handler completed - background processing started', { 
        targetDir,
        chartType,
        userPrompt
      });
      
      return {
        content: [
          { type: 'text' as const, text: resultMessage }
        ]
      };
    } catch (error) {
      logEvent('ERROR', 'generate-visualization-scenarios', 'Handler failed', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  };
  server.tool(
    "generate-visualization-scenarios",
    "Generate detailed visualization scenarios for industries using LLM. First analyzes the chart type to identify optimal use cases, then generates chart-optimized scenarios.json based on user prompt, and finally creates individual industry scenarios tailored to leverage the chart type's strengths.",
    {
      chartType: { type: "string", description: "Chart type identifier to analyze and generate scenarios for" },
      prompt: { type: "string", description: "User prompt describing the specific use case or requirements for scenario generation" },
      userPrompt: { type: "string", description: "Alternative parameter name for user prompt (same as prompt)" },
      query: { type: "string", description: "Query string that may contain chart type and user requirements" }
    },
    generateVisualizationScenariosHandler
  );
  toolHandlers["generate-visualization-scenarios"] = (args) => generateVisualizationScenariosHandler(args, undefined);

  // MCP tool to generate Python Plotly code for scenarios via direct MCP sampling
  const generateVisualizationCodesHandler = async (
    args: {
      chartType?: string;
      prompt?: string;
      userPrompt?: string;
      query?: string;
    },
    _extra: any
  ): Promise<{ content: { type: "text"; text: string }[] }> => {
    logEvent('INFO', 'generate-visualization-codes', 'Handler invoked', args);
    
    // Debug: Log both args and extra to find where the arguments are
    console.log('[MCP] DEBUG - args object:', JSON.stringify(args, null, 2));
    console.log('[MCP] DEBUG - _extra object:', JSON.stringify(_extra, null, 2));
    
    // Extract actual arguments from the MCP request
    let actualArgs = args;
    
    // The actual arguments are passed through the MCP SDK in _extra
    if (_extra && typeof _extra === 'object') {
      // Check various possible locations for the actual arguments
      if (_extra.arguments) {
        console.log('[MCP] Found arguments in _extra.arguments');
        actualArgs = _extra.arguments;
      } else if (_extra.params && _extra.params.arguments) {
        console.log('[MCP] Found arguments in _extra.params.arguments');
        actualArgs = _extra.params.arguments;
      } else if (_extra.request && _extra.request.params && _extra.request.params.arguments) {
        console.log('[MCP] Found arguments in _extra.request.params.arguments');
        actualArgs = _extra.request.params.arguments;
      } else {
        // For MCP SDK, the args parameter might actually be the context, and real args are elsewhere
        // Try to find the actual tool arguments in the MCP request structure
        console.log('[MCP] Looking for arguments in MCP request structure');
        actualArgs = args; // Keep original args as fallback
      }
    }
    
    console.log('[MCP] DEBUG - actualArgs:', JSON.stringify(actualArgs, null, 2));
    console.log('[MCP] DEBUG - actualArgs.query:', actualArgs.query);
    console.log('[MCP] DEBUG - actualArgs.chartType:', actualArgs.chartType);
    console.log('[MCP] DEBUG - actualArgs.prompt:', actualArgs.prompt);
    console.log('[MCP] DEBUG - actualArgs.userPrompt:', actualArgs.userPrompt);
    
    // Extract chart type from various sources
    let chartType = actualArgs.chartType || globalChartType || 'scattergl';
    let userPrompt = actualArgs.prompt || actualArgs.userPrompt || 'Generate Python code for data visualization';
    
    // TEMPORARY DEBUG: Force bar chart scenario for testing
    // This will help us verify the tool works independent of argument parsing issues
    console.log('[MCP] DEBUGGING: Checking if this is a bar chart test request...');
    if ((!chartType || chartType === 'scattergl') && (!userPrompt || userPrompt.includes('data visualization'))) {
      console.log('[MCP] DEBUGGING: No specific arguments provided, assuming bar chart test case');
      chartType = 'bar';
      userPrompt = 'Generate Python Plotly code for bar chart scenarios';
      console.log('[MCP] DEBUGGING: Set chartType to "bar" and specific userPrompt for testing');
      logEvent('DEBUG', 'generate-visualization-codes', 'Forced bar chart test case', { chartType, userPrompt });
    }
    
    // If query is provided, try to extract chart type and user prompt from it
    if (actualArgs.query) {
      const query = String(actualArgs.query);
      console.log(`[MCP] Original query: "${query}"`);
      logEvent('DEBUG', 'generate-visualization-codes', 'Processing query', { query });
      console.log(`[MCP] Initial chartType: "${chartType}", initial userPrompt: "${userPrompt}"`);
      logEvent('DEBUG', 'generate-visualization-codes', 'Initial values', { chartType, userPrompt });
      
      // Look for explicit "ChartType:" or "chart type" specification
      const chartTypeMatch = query.match(/(?:ChartType|chart\s+type):\s*(\w+)/i);
      if (chartTypeMatch) {
        chartType = chartTypeMatch[1].toLowerCase();
        // Remove the chart type specification from the user prompt
        const cleanedPrompt = query.replace(/(?:ChartType|chart\s+type):\s*\w+/i, '').trim();
        console.log(`[MCP] After removing ChartType, cleanedPrompt: "${cleanedPrompt}"`);
        logEvent('DEBUG', 'generate-visualization-codes', 'Cleaned prompt after ChartType removal', { cleanedPrompt });
        // Always update userPrompt with the cleaned query (overriding the default)
        userPrompt = cleanedPrompt;
        console.log(`[MCP] Explicit ChartType found - chartType: "${chartType}", cleaned userPrompt: "${userPrompt}"`);
        logEvent('INFO', 'generate-visualization-codes', 'Explicit ChartType found', { chartType, userPrompt });
      } else {
        // Fallback: Try to extract chart type from query if it contains common chart type patterns
        const fallbackMatch = query.match(/\b(scattergl|scatter|bar|line|pie|histogram|heatmap|treemap|sunburst|funnel|waterfall|sankey|parallel|radar|polar)\b/i);
        if (fallbackMatch) {
          chartType = fallbackMatch[1].toLowerCase();
          // For fallback case, use the entire query as user prompt after cleaning chart type
          const cleanedPrompt = query.replace(/\b(scattergl|scatter|bar|line|pie|histogram|heatmap|treemap|sunburst|funnel|waterfall|sankey|parallel|radar|polar)\b/i, '').trim();
          userPrompt = cleanedPrompt;
        } else {
          // If no chart type found in query, use entire query as user prompt
          userPrompt = query.trim();
        }
        console.log(`[MCP] Fallback extraction - chartType: "${chartType}", userPrompt: "${userPrompt}"`);
        logEvent('DEBUG', 'generate-visualization-codes', 'Fallback extraction completed', { chartType, userPrompt });
      }
    }
    
    chartType = String(chartType);
    userPrompt = String(userPrompt);
    console.log(`[MCP] Final values - chartType: "${chartType}", userPrompt: "${userPrompt}"`);
    logEvent('INFO', 'generate-visualization-codes', 'Final extracted values', { chartType, userPrompt });
    
    console.log(`[MCP] Generating visualization code for ${chartType} scenarios`);
    logEvent('INFO', 'generate-visualization-codes', 'Starting visualization code generation', { chartType, userPrompt });
    logEvent('DEBUG', 'generate-visualization-codes', 'Starting code generation', { chartType });
    
    try {
      // Read scenarios from disk (updated to read from industry files)
      const baseDir = path.resolve(__dirname, '..', '..', 'plotly_examples', 'python-scripts');
      const targetDir = path.join(baseDir, `${chartType}_scenarios`);
      
      // Define the new output directory for generated Python code
      const outputDir = path.resolve(__dirname, '..', '..', 'plotly_examples', 'python-scripts', 'plotly_express', 'generated_python_code', 'code_blocks');
      
      // Delete the output folder if it exists
      if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
        logEvent('INFO', 'generate-visualization-codes', 'Deleted existing output directory', { outputDir });
      }
      
      // Create the output directory
      fs.mkdirSync(outputDir, { recursive: true });
      logEvent('INFO', 'generate-visualization-codes', 'Created output directory', { outputDir });
      
      if (!fs.existsSync(targetDir)) {
        logEvent('ERROR', 'generate-visualization-codes', 'Scenarios directory not found', { targetDir });
        throw new Error(`Scenarios directory not found: ${targetDir}`);
      }
      
      // Read industry files (e.g., Automobile.json, Healthcare.json) instead of scenario_*.json
      const industryFiles = fs.readdirSync(targetDir).filter(f => f.endsWith('.json') && !f.startsWith('scenario_'));
      console.log(`[MCP] Found ${industryFiles.length} industry files to process`);
      logEvent('DEBUG', 'generate-visualization-codes', 'Found industry files', { 
        industryFileCount: industryFiles.length, 
        targetDir, 
        outputDir 
      });
      
      // Count total scenarios across all industries
      let totalScenarios = 0;
      for (const industryFile of industryFiles) {
        try {
          const industryPath = path.join(targetDir, industryFile);
          const industryData = JSON.parse(fs.readFileSync(industryPath, 'utf8'));
          totalScenarios += industryData.scenarios?.length || 0;
        } catch (error) {
          console.warn(`[MCP] Could not count scenarios in ${industryFile}`);
        }
      }
      
      // Return immediately to avoid timeout, process in background
      setImmediate(async () => {
        console.log(`[MCP] Starting background processing of ${totalScenarios} scenarios from ${industryFiles.length} industries`);
        logEvent('INFO', 'generate-visualization-codes', 'Starting background processing', { 
          industryFileCount: industryFiles.length, 
          totalScenarios 
        });
        let processedCount = 0;
        
        for (const industryFile of industryFiles) {
          try {
            const industryPath = path.join(targetDir, industryFile);
            const industryData = JSON.parse(fs.readFileSync(industryPath, 'utf8'));
            const industry = industryFile.replace('.json', '');
            
            // Process each scenario within the industry file
            for (let i = 0; i < (industryData.scenarios?.length || 0); i++) {
              const scenario = industryData.scenarios[i];
              
              try {
                console.log(`[MCP] Processing ${industry} scenario ${i + 1}: ${scenario.scenario_name}`);
                logEvent('DEBUG', 'generate-visualization-codes', 'Processing scenario', { 
                  industry,
                  scenarioIndex: i + 1,
                  scenarioName: scenario.scenario_name,
                  processedCount: processedCount + 1,
                  totalScenarios
                });
                
                // Generate comprehensive Python code prompt using all scenario fields
                const codePrompt = `Create a complete Python script using Plotly Express to generate a ${chartType} chart for the following scenario:

**Industry**: ${scenario.industry}
**Scenario**: ${scenario.scenario_name}
**Description**: ${scenario.scenario_description}

**Required Data Columns**: ${scenario.columns?.join(', ') || 'Not specified'}
**Data Sources**: ${scenario.sources?.join(', ') || 'Not specified'}
**Aggregation Level**: ${scenario.aggregation_level || 'Not specified'}

Requirements:
1. Generate realistic sample data that matches the columns and scenario description
2. Create a ${chartType} chart using Plotly Express specifically for this scenario
3. Include proper titles, axis labels, and styling
4. Add hover information and interactivity
5. Save the chart as both HTML and JSON formats
6. Include comments explaining each section
7. Ensure the chart type is set to "${chartType}" in the JSON output

The script should be complete and executable, generating both visualization files and a JSON schema file.`;
                
                const response = await server.server.createMessage({
                  messages: [
                    { 
                      role: 'user', 
                      content: { 
                        type: 'text', 
                        text: `You are a Python data visualization expert specializing in Plotly.\n\n${codePrompt}` 
                      } 
                    }
                  ],
                  maxTokens: 3000 // Increased for more comprehensive code
                });
                
                const codeText = response.content.type === 'text' ? response.content.text : '# Unable to generate code';
                
                // Generate descriptive filename using industry and scenario
                const sanitizedScenarioName = scenario.scenario_name?.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50) || `scenario_${i + 1}`;
                const codeFileName = `${industry}_${sanitizedScenarioName}.py`;
                const codeFilePath = path.join(outputDir, codeFileName);
                fs.writeFileSync(codeFilePath, codeText);
                processedCount++;
                
                console.log(`[MCP] Generated code for ${industry}/${scenario.scenario_name} -> ${codeFileName} (${processedCount}/${totalScenarios})`);
                logEvent('INFO', 'generate-visualization-codes', 'Generated code file', { 
                  industry,
                  scenarioName: scenario.scenario_name,
                  codeFileName, 
                  processedCount, 
                  totalScenarios,
                  outputPath: codeFilePath
                });
                
              } catch (scenarioError) {
                console.error(`[MCP] Error processing scenario ${i + 1} in ${industry}:`, scenarioError);
                logEvent('ERROR', 'generate-visualization-codes', 'Error processing individual scenario', { 
                  industry,
                  scenarioIndex: i + 1,
                  error: scenarioError instanceof Error ? scenarioError.message : scenarioError 
                });
              }
            }
            
          } catch (industryError) {
            console.error(`[MCP] Error processing industry file ${industryFile}:`, industryError);
            logEvent('ERROR', 'generate-visualization-codes', 'Error processing industry file', { 
              industryFile, 
              error: industryError instanceof Error ? industryError.message : industryError 
            });
          }
        }
        
        console.log(`[MCP] Background processing completed: ${processedCount} Python files generated in ${outputDir}`);
        logEvent('INFO', 'generate-visualization-codes', 'Background processing completed summary', { processedCount, outputDir });
        logEvent('INFO', 'generate-visualization-codes', 'Background processing completed', { 
          processedCount, 
          totalScenarios,
          outputDir
        });
      });
      
      const resultMessage = `Started background generation of Python code for ${totalScenarios} scenarios from ${industryFiles.length} industries in ${outputDir}. Check server logs for progress.`;
      logEvent('INFO', 'generate-visualization-codes', 'Handler completed - background processing started', { 
        industryFileCount: industryFiles.length,
        totalScenarios,
        outputDir 
      });
      
      return {
        content: [
          { type: 'text' as const, text: resultMessage }
        ]
      };
    } catch (error) {
      logEvent('ERROR', 'generate-visualization-codes', 'Handler failed', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  };
  server.tool(
    "generate-visualization-codes",
    "Generate comprehensive Python Plotly code for scenarios using all scenario fields (industry, scenario_name, scenario_description, columns, sources, aggregation_level). Creates detailed, executable Python scripts with realistic data generation.",
    {
      chartType: { type: "string", description: "Chart type identifier" },
      prompt: { type: "string", description: "User prompt describing the specific use case or requirements for code generation" },
      userPrompt: { type: "string", description: "Alternative parameter name for user prompt (same as prompt)" },
      query: { type: "string", description: "Query string that may contain chart type and user requirements" }
    },
    generateVisualizationCodesHandler
  );
  toolHandlers["generate-visualization-codes"] = (args) => generateVisualizationCodesHandler(args, undefined);

  // MCP tool to execute and auto-fix Python visualization codes
  const executeVisualizationCodesHandler = async (
    args: {
      chartType?: string;
      maxAttempts?: number;
      prompt?: string;
      userPrompt?: string;
      query?: string;
    },
    _extra: any
  ): Promise<{ content: { type: "text"; text: string }[] }> => {
    logEvent('INFO', 'execute-visualization-codes', 'Handler invoked', args);
    
    // Debug: Log both args and extra to find where the arguments are
    console.log('[MCP] DEBUG - args object:', JSON.stringify(args, null, 2));
    console.log('[MCP] DEBUG - _extra object:', JSON.stringify(_extra, null, 2));
    
    // Extract actual arguments from the MCP request
    let actualArgs = args;
    
    // The actual arguments are passed through the MCP SDK in _extra
    if (_extra && typeof _extra === 'object') {
      // Check various possible locations for the actual arguments
      if (_extra.arguments) {
        console.log('[MCP] Found arguments in _extra.arguments');
        actualArgs = _extra.arguments;
      } else if (_extra.params && _extra.params.arguments) {
        console.log('[MCP] Found arguments in _extra.params.arguments');
        actualArgs = _extra.params.arguments;
      } else if (_extra.request && _extra.request.params && _extra.request.params.arguments) {
        console.log('[MCP] Found arguments in _extra.request.params.arguments');
        actualArgs = _extra.request.params.arguments;
      } else {
        // For MCP SDK, the args parameter might actually be the context, and real args are elsewhere
        // Try to find the actual tool arguments in the MCP request structure
        console.log('[MCP] Looking for arguments in MCP request structure');
        actualArgs = args; // Keep original args as fallback
      }
    }
    
    console.log('[MCP] DEBUG - actualArgs:', JSON.stringify(actualArgs, null, 2));
    console.log('[MCP] DEBUG - actualArgs.query:', actualArgs.query);
    console.log('[MCP] DEBUG - actualArgs.chartType:', actualArgs.chartType);
    console.log('[MCP] DEBUG - actualArgs.maxAttempts:', actualArgs.maxAttempts);
    console.log('[MCP] DEBUG - actualArgs.prompt:', actualArgs.prompt);
    console.log('[MCP] DEBUG - actualArgs.userPrompt:', actualArgs.userPrompt);
    
    // Extract chart type from various sources
    let chartType = actualArgs.chartType || globalChartType || 'scattergl';
    let userPrompt = actualArgs.prompt || actualArgs.userPrompt || 'Execute Python visualization codes with auto-fix capability';
    const maxAttempts = actualArgs.maxAttempts || 3;
    
    // TEMPORARY DEBUG: Force bar chart scenario for testing
    // This will help us verify the tool works independent of argument parsing issues
    console.log('[MCP] DEBUGGING: Checking if this is a bar chart test request...');
    if ((!chartType || chartType === 'scattergl') && (!userPrompt || userPrompt.includes('Execute Python visualization'))) {
      console.log('[MCP] DEBUGGING: No specific arguments provided, assuming bar chart test case');
      chartType = 'bar';
      userPrompt = 'Execute and validate Python code for bar chart visualizations';
      console.log('[MCP] DEBUGGING: Set chartType to "bar" and specific userPrompt for testing');
      logEvent('DEBUG', 'execute-visualization-codes', 'Forced bar chart test case', { chartType, userPrompt });
    }
    
    // If query is provided, try to extract chart type and user prompt from it
    if (actualArgs.query) {
      const query = String(actualArgs.query);
      console.log(`[MCP] Original query: "${query}"`);
      logEvent('DEBUG', 'execute-visualization-codes', 'Processing query', { query });
      console.log(`[MCP] Initial chartType: "${chartType}", initial userPrompt: "${userPrompt}"`);
      logEvent('DEBUG', 'execute-visualization-codes', 'Initial values', { chartType, userPrompt });
      
      // Look for explicit "ChartType:" or "chart type" specification
      const chartTypeMatch = query.match(/(?:ChartType|chart\s+type):\s*(\w+)/i);
      if (chartTypeMatch) {
        chartType = chartTypeMatch[1].toLowerCase();
        // Remove the chart type specification from the user prompt
        const cleanedPrompt = query.replace(/(?:ChartType|chart\s+type):\s*\w+/i, '').trim();
        console.log(`[MCP] After removing ChartType, cleanedPrompt: "${cleanedPrompt}"`);
        logEvent('DEBUG', 'execute-visualization-codes', 'Cleaned prompt after ChartType removal', { cleanedPrompt });
        // Always update userPrompt with the cleaned query (overriding the default)
        userPrompt = cleanedPrompt;
        console.log(`[MCP] Explicit ChartType found - chartType: "${chartType}", cleaned userPrompt: "${userPrompt}"`);
        logEvent('INFO', 'execute-visualization-codes', 'Explicit ChartType found', { chartType, userPrompt });
      } else {
        // Fallback: Try to extract chart type from query if it contains common chart type patterns
        const fallbackMatch = query.match(/\b(scattergl|scatter|bar|line|pie|histogram|heatmap|treemap|sunburst|funnel|waterfall|sankey|parallel|radar|polar)\b/i);
        if (fallbackMatch) {
          chartType = fallbackMatch[1].toLowerCase();
          // For fallback case, use the entire query as user prompt after cleaning chart type
          const cleanedPrompt = query.replace(/\b(scattergl|scatter|bar|line|pie|histogram|heatmap|treemap|sunburst|funnel|waterfall|sankey|parallel|radar|polar)\b/i, '').trim();
          userPrompt = cleanedPrompt;
        } else {
          // If no chart type found in query, use entire query as user prompt
          userPrompt = query.trim();
        }
        console.log(`[MCP] Fallback extraction - chartType: "${chartType}", userPrompt: "${userPrompt}"`);
        logEvent('DEBUG', 'execute-visualization-codes', 'Fallback extraction completed', { chartType, userPrompt });
      }
    }
    
    chartType = String(chartType);
    userPrompt = String(userPrompt);
    console.log(`[MCP] Final values - chartType: "${chartType}", userPrompt: "${userPrompt}", maxAttempts: ${maxAttempts}`);
    logEvent('INFO', 'execute-visualization-codes', 'Final extracted values', { chartType, userPrompt, maxAttempts });
    
    try {
      // Define directories
      const codeBlocksDir = path.resolve(__dirname, '..', '..', 'plotly_examples', 'python-scripts', 'plotly_express', 'generated_python_code', 'code_blocks');
      const extractedCodeDir = path.resolve(__dirname, '..', '..', 'plotly_examples', 'python-scripts', 'plotly_express', 'generated_python_code', 'extracted_code');
      const extractedJsonDir = path.resolve(__dirname, '..', '..', 'plotly_examples', 'python-scripts', 'plotly_express', 'generated_python_code', 'extracted_json');
      
      if (!fs.existsSync(codeBlocksDir)) {
        throw new Error(`Code blocks directory not found: ${codeBlocksDir}`);
      }
      
      // Clean and create directories
      [extractedCodeDir, extractedJsonDir].forEach(dir => {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
        fs.mkdirSync(dir, { recursive: true });
      });
      
      logEvent('INFO', 'execute-visualization-codes', 'Directories prepared', { 
        codeBlocksDir, 
        extractedCodeDir, 
        extractedJsonDir 
      });
      
      const pythonFiles = fs.readdirSync(codeBlocksDir).filter(f => f.endsWith('.py'));
      logEvent('DEBUG', 'execute-visualization-codes', 'Found Python files', { 
        fileCount: pythonFiles.length, 
        chartType, 
        maxAttempts 
      });
      
      // Return immediately to avoid timeout, process in background
      setImmediate(async () => {
        logEvent('INFO', 'execute-visualization-codes', 'Starting background execution', { fileCount: pythonFiles.length });
        
        let successCount = 0;
        let skipCount = 0;
        
        for (const filename of pythonFiles) {
          try {
            const sourceFile = path.join(codeBlocksDir, filename);
            const targetDir = path.join(extractedCodeDir, filename.replace('.py', ''));
            const targetFile = path.join(targetDir, filename);
            
            // Create individual directory for each file
            fs.mkdirSync(targetDir, { recursive: true });
            
            // Extract code blocks and copy to target directory
            const originalContent = fs.readFileSync(sourceFile, 'utf8');
            const extractedCode = extractPythonCodeBlocks(originalContent);
            fs.writeFileSync(targetFile, extractedCode);
            
            logEvent('DEBUG', 'execute-visualization-codes', 'Processing file', { 
              filename, 
              targetDir,
              codeLength: extractedCode.length 
            });
            
            // Validate code before execution
            let needsRegeneration = false;
            let regenerationReason = '';
            
            if (!codeGeneratesJson(extractedCode)) {
              needsRegeneration = true;
              regenerationReason = 'Code does not appear to generate JSON file';
            }
            
            if (chartType && !codeMentionsChartType(extractedCode, chartType)) {
              needsRegeneration = true;
              regenerationReason += (regenerationReason ? ' and ' : '') + `Code does not mention chart type '${chartType}'`;
            }
            
            // Pre-execution regeneration if needed
            if (needsRegeneration) {
              logEvent('INFO', 'execute-visualization-codes', 'Pre-execution regeneration needed', { 
                filename, 
                reason: regenerationReason 
              });
              
              const regeneratedCode = await regenerateCodeWithLLM(server, targetFile, regenerationReason, chartType);
              fs.writeFileSync(targetFile, regeneratedCode);
            }
            
            // Execute with retry logic
            let attempt = 0;
            let executionSuccess = false;
            
            while (attempt < maxAttempts && !executionSuccess) {
              try {
                // Change to target directory for execution
                const originalCwd = process.cwd();
                process.chdir(targetDir);
                
                logEvent('DEBUG', 'execute-visualization-codes', 'Executing Python file', { 
                  filename, 
                  attempt: attempt + 1, 
                  targetDir 
                });
                
                // Execute Python file
                await execAsync(`python "${filename}"`, { 
                  cwd: targetDir,
                  timeout: 60000 // 60 seconds timeout
                });
                
                process.chdir(originalCwd);
                
                // Check if JSON files were generated
                const jsonFiles = fs.readdirSync(targetDir).filter(f => f.endsWith('.json'));
                
                if (jsonFiles.length === 0) {
                  throw new Error('No JSON files generated after execution');
                }
                
                // Validate chart type in generated JSON
                let foundCorrectType = false;
                for (const jsonFile of jsonFiles) {
                  const jsonPath = path.join(targetDir, jsonFile);
                  if (jsonHasChartType(jsonPath, chartType)) {
                    foundCorrectType = true;
                    break;
                  }
                }
                
                if (!foundCorrectType && chartType) {
                  throw new Error(`Generated JSON does not contain chart type '${chartType}'`);
                }
                
                executionSuccess = true;
                successCount++;
                
                logEvent('INFO', 'execute-visualization-codes', 'File executed successfully', { 
                  filename, 
                  attempt: attempt + 1,
                  jsonFilesGenerated: jsonFiles.length
                });
                
                // Copy JSON files to extracted_json directory
                for (const jsonFile of jsonFiles) {
                  const sourcePath = path.join(targetDir, jsonFile);
                  const destPath = path.join(extractedJsonDir, `${filename.replace('.py', '')}_${jsonFile}`);
                  fs.copyFileSync(sourcePath, destPath);
                }
                
              } catch (executionError) {
                attempt++;
                const errorMessage = executionError instanceof Error ? executionError.message : String(executionError);
                
                logEvent('ERROR', 'execute-visualization-codes', 'Execution failed', { 
                  filename, 
                  attempt, 
                  error: errorMessage 
                });
                
                if (attempt < maxAttempts) {
                  // Regenerate code using LLM
                  logEvent('INFO', 'execute-visualization-codes', 'Regenerating code after execution error', { 
                    filename, 
                    attempt 
                  });
                  
                  const regeneratedCode = await regenerateCodeWithLLM(server, targetFile, `execution error: ${errorMessage}`, chartType);
                  fs.writeFileSync(targetFile, regeneratedCode);
                } else {
                  logEvent('ERROR', 'execute-visualization-codes', 'File execution failed after max attempts', { 
                    filename, 
                    maxAttempts,
                    finalError: errorMessage 
                  });
                  skipCount++;
                }
                
                // Restore original working directory
                try {
                  process.chdir(path.resolve(__dirname, '..', '..', '..', '..'));
                } catch (chdirError) {
                  logEvent('ERROR', 'execute-visualization-codes', 'Failed to restore working directory', { chdirError });
                }
              }
            }
            
          } catch (error) {
            logEvent('ERROR', 'execute-visualization-codes', 'Unexpected error processing file', { 
              filename, 
              error: error instanceof Error ? error.message : error 
            });
            skipCount++;
          }
        }
        
        logEvent('INFO', 'execute-visualization-codes', 'Background execution completed', { 
          totalFiles: pythonFiles.length,
          successCount,
          skipCount,
          extractedJsonDir
        });
      });
      
      const resultMessage = `Started background execution of ${pythonFiles.length} Python files with auto-fix capability. Chart type: ${chartType}, Max attempts: ${maxAttempts}. Check server logs for progress.`;
      
      logEvent('INFO', 'execute-visualization-codes', 'Handler completed - background execution started', { 
        fileCount: pythonFiles.length, 
        chartType,
        maxAttempts,
        codeBlocksDir,
        extractedJsonDir
      });
      
      return {
        content: [
          { type: 'text' as const, text: resultMessage }
        ]
      };
      
    } catch (error) {
      logEvent('ERROR', 'execute-visualization-codes', 'Handler failed', { 
        error: error instanceof Error ? error.message : error 
      });
      throw error;
    }
  };
  
  server.tool(
    "execute-visualization-codes",
    "Execute Python visualization codes with auto-fix capability using MCP sampling for error correction and chart type validation.",
    {
      chartType: { 
        type: "string", 
        description: "Chart type to validate in generated JSON files" 
      },
      maxAttempts: { 
        type: "number", 
        description: "Maximum number of retry attempts for each file (default: 3)" 
      },
      prompt: { 
        type: "string", 
        description: "User prompt describing the specific execution requirements or validation criteria" 
      },
      userPrompt: { 
        type: "string", 
        description: "Alternative parameter name for user prompt (same as prompt)" 
      },
      query: { 
        type: "string", 
        description: "Query string that may contain chart type and execution requirements" 
      }
    },
    executeVisualizationCodesHandler
  );
  toolHandlers["execute-visualization-codes"] = (args) => executeVisualizationCodesHandler(args, undefined);

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
        delete transports[transport.sessionId];
      }
    };
    const server = buildServer();
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

// Test route to invoke LLM directly with GitHub Copilot integration
app.get('/test/invoke-llm', async (req, res) => {
  const prompt = req.query.prompt as string || "Say hello!";
  const maxTokens = parseInt(req.query.maxTokens as string) || 2000;
  const model = req.query.model as string;
  const temperature = req.query.temperature ? parseFloat(req.query.temperature as string) : 0.7;
  const systemPrompt = req.query.systemPrompt as string;

  console.log(`[TEST] Invoking GitHub Copilot LLM with prompt: ${prompt}`);
  if (model) console.log(`[TEST] Requested model: ${model}`);
  if (systemPrompt) console.log(`[TEST] System prompt: ${systemPrompt}`);
  
  logEvent('INFO', 'TEST-invoke-llm', 'Test endpoint invoked', { 
    promptLength: prompt.length, 
    maxTokens, 
    temperature, 
    model, 
    hasSystemPrompt: !!systemPrompt 
  });

  try {
    const args: any = { prompt, maxTokens, temperature };
    if (model) args.model = model;
    if (systemPrompt) args.systemPrompt = systemPrompt;

    const result = await toolHandlers['invoke-LLM'](args);
    logEvent('INFO', 'TEST-invoke-llm', 'Test completed successfully', { 
      promptLength: prompt.length, 
      maxTokens, 
      temperature 
    });
    res.json({
      success: true,
      prompt,
      maxTokens,
      temperature,
      model: model || "default",
      systemPrompt: systemPrompt || "none",
      result
    });
  } catch (error) {
    console.error('[TEST] Error invoking GitHub Copilot LLM:', error);
    logEvent('ERROR', 'TEST-invoke-llm', 'Test failed', { error: error instanceof Error ? error.message : error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Test route to execute visualization codes with auto-fix
app.get('/test/execute-visualization-codes', async (req, res) => {
  const chartType = req.query.chartType as string || globalChartType || 'scattergl';
  const maxAttempts = parseInt(req.query.maxAttempts as string) || 3;

  console.log(`[TEST] Executing visualization codes with chart type: ${chartType}, max attempts: ${maxAttempts}`);
  logEvent('INFO', 'TEST-execute-visualization-codes', 'Test endpoint invoked', { chartType, maxAttempts });

  try {
    const result = await toolHandlers['execute-visualization-codes']({ chartType, maxAttempts });
    logEvent('INFO', 'TEST-execute-visualization-codes', 'Test completed successfully', { chartType, maxAttempts });
    res.json({
      success: true,
      chartType,
      maxAttempts,
      result
    });
  } catch (error) {
    console.error('[TEST] Error executing visualization codes:', error);
    logEvent('ERROR', 'TEST-execute-visualization-codes', 'Test failed', { error: error instanceof Error ? error.message : error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Prompt for chart type once on server start
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter chart type for dataset generation (e.g., scatter, bar, line): ', async (chartType) => {
    rl.close();
    // Pass chartType to MCP tool handler
    // You may want to store chartType in a variable or environment for later use
    globalChartType = chartType;
    // Optionally, trigger dataset generation here or pass chartType to REST/tool endpoints
    console.log(`[MCP] Chart type selected: ${chartType}`);
  });
}

main();

app.listen(PORT, () => {
  // Build server first to populate toolHandlers
  buildServer();
  
  console.log(`Server listening on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  POST /tools/generate-datasets - Generate Plotly datasets`);
  console.log(`  POST /tools/invoke-LLM - Invoke LLM via MCP sampling (createMessage API)`);
  console.log(`  POST /tools/generate-visualization-scenarios - Generate visualization scenarios from JSON`);
  console.log(`  POST /tools/generate-visualization-codes - Generate Python code for scenarios`);
  console.log(`  POST /tools/execute-visualization-codes - Execute Python codes with auto-fix`);
  console.log(`  GET /tools - List available tools`);
  console.log(`  GET /test/generate-datasets?prompt=<prompt> - Test dataset generation`);
  console.log(`  GET /test/invoke-llm?prompt=<prompt>&maxTokens=<tokens> - Test LLM invocation`);
  console.log(`  GET /test/execute-visualization-codes?chartType=<type>&maxAttempts=<num> - Test Python execution with auto-fix`);
  console.log(`\nMCP LLM Integration:`);
  console.log(`  - Uses server.createMessage() for direct LLM access`);
  console.log(`  - Supports MCP sampling capabilities`);
  console.log(`  - Auto-fix functionality with LLM error correction`);
  console.log(`  - Compatible with MCP clients that provide LLM models`);
  console.log(`\nLogging:`);
  console.log(`  - All tool events logged to: ${LOG_FILE}`);
  console.log(`  - Generated Python code saved to: plotly_express/generated_python_code/code_blocks`);
  console.log(`\nPython Execution Pipeline:`);
  console.log(`  - Code extraction from generated files`);
  console.log(`  - Automatic execution with error handling`);
  console.log(`  - LLM-powered auto-fix for execution errors`);
  console.log(`  - Chart type validation in generated JSON`);
  console.log(`  - Max 3 retry attempts per file with regeneration`);
  
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
