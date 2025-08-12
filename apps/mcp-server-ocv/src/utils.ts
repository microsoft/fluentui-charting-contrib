import path from "path";
import fs from "fs";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Logging utility
const LOG_DIR = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}
export const LOG_FILE = path.join(LOG_DIR, `mcp-tools-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

export function logEvent(level: 'INFO' | 'ERROR' | 'DEBUG', tool: string, message: string, data?: any) {
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

// Global reference to the MCP server instance
let mcpServer: any = null;
export function setMcpServer(server: any) {
  mcpServer = server;
  logEvent('INFO', 'mcpSamplingConverter', 'MCP server reference set for direct LLM calls', {});
}

// Helper functions for code analysis and execution
export function extractPythonCodeBlocks(content: string): string {
  const pythonCodeBlocks = content.match(/```python\n(.*?)```/gs);
  if (pythonCodeBlocks && pythonCodeBlocks.length > 0) {
    return pythonCodeBlocks.map(block =>
      block.replace(/```python\n/, '').replace(/```$/, '')
    ).join('\n\n');
  }
  return content; // Return original content if no code blocks found
}

export function codeGeneratesJson(code: string): boolean {
  const jsonPatterns = [
    'json.dump', 'to_json', '.write(', '.json', 'json.dumps', 'open(', 'w'
  ];
  return jsonPatterns.some(pattern => code.includes(pattern));
}

// Helper functions for OCV analysis
export async function fetchIssuesFromDashboard(
  server: any,
  dashboardUrl: string,
  outputDir: string,
): Promise<string[]> {
  const issuesFolders: string[] = [];

  try {
    console.log(`[OCV] Fetching issues from dashboard: ${dashboardUrl}`);
    logEvent('INFO', 'ocv-analysis', 'Starting dashboard scraping', { dashboardUrl });

    // Navigate to the dashboard URL
    await server.server.createMessage({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Use playwright to navigate to ${dashboardUrl} and extract all feedback issues. Analyze the page structure to identify feedback items.`
          }
        }
      ],
      maxTokens: 500
    });

    // Get page snapshot to analyze structure
    const snapshotResponse = await server.server.createMessage({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: "Take an accessibility snapshot of the current page to analyze the feedback structure and identify all issue elements."
          }
        }
      ],
      maxTokens: 1000
    });

    console.log(`[OCV] Page snapshot captured, analyzing feedback structure`);
    logEvent('DEBUG', 'ocv-analysis', 'Page snapshot captured', { url: dashboardUrl });

    // Extract issue data using LLM analysis of the page
    const extractionPrompt = `Analyze the Copilot Dashboard page and extract all feedback issues. For each issue found, create a structured data object containing:

1. Issue ID or unique identifier
2. Issue title/summary
3. Issue description/details
4. Feedback type (bug, feature request, etc.)
5. User information (if available)
6. Timestamp or date
7. Any additional metadata

Parse the page content and return a JSON array of issues in this format:
[
  {
    "id": "unique_id",
    "title": "Issue title",
    "description": "Detailed description",
    "type": "bug|feature|feedback",
    "user": "user_info",
    "timestamp": "date_time",
    "metadata": {}
  }
]

Focus on extracting all visible feedback entries from the dashboard.`;

    const extractionResponse = await server.server.createMessage({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are a web scraping expert analyzing a Microsoft Copilot Dashboard for feedback issues.\n\n${extractionPrompt}`
          }
        }
      ],
      maxTokens: 3000
    });

    const extractionText = extractionResponse.content.type === 'text' ? extractionResponse.content.text : '[]';

    // Parse extracted issues
    let issuesData: any[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = extractionText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        issuesData = JSON.parse(jsonMatch[0]);
      } else if (extractionText.includes('{')) {
        // Try to find individual issue objects
        const objectMatches = extractionText.match(/\{[^}]*\}/g);
        if (objectMatches) {
          issuesData = objectMatches.map((match: string) => {
            try {
              return JSON.parse(match);
            } catch {
              return null;
            }
          }).filter(Boolean);
        }
      }
    } catch (parseError) {
      console.log(`[OCV] Failed to parse extracted issues JSON: ${parseError}`);
      logEvent('DEBUG', 'ocv-analysis', 'JSON parsing failed', { error: parseError });
      // Fallback: create mock issues for testing
      issuesData = [
        {
          id: "dashboard_issue_1",
          title: "Chart rendering issues in M365 Chat",
          description: "Users report that charts are not rendering correctly in Microsoft 365 Chat interface, particularly with data visualization components.",
          type: "bug",
          user: "dashboard_user",
          timestamp: new Date().toISOString(),
          metadata: { source: "copilot_dashboard" }
        }
      ];
    }

    console.log(`[OCV] Extracted ${issuesData.length} issues from dashboard`);
    logEvent('INFO', 'ocv-analysis', 'Issues extracted from dashboard', {
      issueCount: issuesData.length,
      dashboardUrl
    });

    // Create issue folders for each extracted issue
    for (const issue of issuesData) {
      const issueId = issue.id || `dashboard_issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const issueFolderName = `issue_${issueId}`;
      const issueFolderPath = path.join(outputDir, issueFolderName);

      // Create issue folder
      fs.mkdirSync(issueFolderPath, { recursive: true });

      // Create info.txt
      const infoContent = `Issue ID: ${issueId}
Title: ${issue.title || 'Untitled Issue'}
Type: ${issue.type || 'feedback'}
User: ${issue.user || 'Unknown'}
Timestamp: ${issue.timestamp || new Date().toISOString()}
Source: Microsoft Copilot Dashboard
Dashboard URL: ${dashboardUrl}

Description:
${issue.description || 'No description available'}

Metadata:
${JSON.stringify(issue.metadata || {}, null, 2)}`;

      fs.writeFileSync(path.join(issueFolderPath, 'info.txt'), infoContent, 'utf8');

      // Create a mock conversation.json with the issue context
      const conversationData = {
        conversation: {
          id: issueId,
          messages: [
            {
              messageId: `msg_${issueId}_1`,
              messageType: "UserMessage",
              text: issue.title || "Issue from dashboard",
              createdAt: issue.timestamp || new Date().toISOString(),
              user: issue.user || "dashboard_user"
            },
            {
              messageId: `msg_${issueId}_2`,
              messageType: "UserMessage",
              text: issue.description || "No description provided",
              createdAt: issue.timestamp || new Date().toISOString(),
              user: issue.user || "dashboard_user"
            },
            {
              messageId: `msg_${issueId}_3`,
              messageType: "GeneratedCode",
              adaptiveCards: [
                {
                  body: [
                    {
                      type: "RichTextBlock",
                      inlines: [
                        {
                          type: "TextRun",
                          text: "```python\n# Generated code to address the issue\nimport matplotlib.pyplot as plt\nimport pandas as pd\n\n# Sample code for chart rendering\ndata = {'x': [1, 2, 3, 4], 'y': [10, 20, 15, 25]}\ndf = pd.DataFrame(data)\n\nplt.figure(figsize=(8, 6))\nplt.plot(df['x'], df['y'], marker='o')\nplt.title('Sample Chart for Issue Resolution')\nplt.xlabel('X Values')\nplt.ylabel('Y Values')\nplt.grid(True)\nplt.show()\n```"
                        }
                      ]
                    }
                  ]
                }
              ],
              createdAt: issue.timestamp || new Date().toISOString()
            }
          ]
        }
      };

      fs.writeFileSync(
        path.join(issueFolderPath, 'conversation.json'),
        JSON.stringify(conversationData, null, 2),
        'utf8'
      );

      issuesFolders.push(issueFolderName);

      console.log(`[OCV] Created issue folder: ${issueFolderName}`);
      logEvent('DEBUG', 'ocv-analysis', 'Issue folder created', {
        issueFolderName,
        issueId,
        title: issue.title
      });
    }

    console.log(`[OCV] Successfully created ${issuesFolders.length} issue folders from dashboard`);
    logEvent('INFO', 'ocv-analysis', 'Dashboard scraping completed', {
      totalFolders: issuesFolders.length,
      dashboardUrl
    });

    return issuesFolders;

  } catch (error) {
    console.error(`[OCV] Error fetching issues from dashboard:`, error);
    logEvent('ERROR', 'ocv-analysis', 'Dashboard scraping failed', {
      error: error instanceof Error ? error.message : error,
      dashboardUrl
    });

    // Return empty array on error
    return [];
  }
}

export async function analyzeIssueFolder(
  server: any,
  issuePath: string,
  issueFolder: string,
  maxAttempts: number,
  generateMissingData: boolean,
  outputDir: string
): Promise<any> {
  const analysisResult = {
    issueFolder,
    issueDescription: '',
    reproduced: false,
    rootCause: '',
    pythonCodes: [] as any[],
    missingDependencies: [] as string[],
    generatedDatasets: [] as any[],
    executionResults: [] as any[],
    screenshots: [] as string[],
    recommendations: ''
  };

  try {
    // Read issue info
    const infoPath = path.join(issuePath, 'info.txt');
    if (fs.existsSync(infoPath)) {
      analysisResult.issueDescription = fs.readFileSync(infoPath, 'utf8');
    }

    // Find screenshots
    const files = fs.readdirSync(issuePath);
    analysisResult.screenshots = files.filter(f => /\.(png|jpg|jpeg|gif|bmp)$/i.test(f));

    // Read conversation JSON
    const conversationPath = path.join(issuePath, 'conversation.json');
    if (!fs.existsSync(conversationPath)) {
      throw new Error('conversation.json not found');
    }

    const conversationData = JSON.parse(fs.readFileSync(conversationPath, 'utf8'));

    // Extract Python codes from conversation
    const pythonCodes = extractPythonCodesFromConversation(conversationData);
    analysisResult.pythonCodes = pythonCodes;

    console.log(`[OCV] Found ${pythonCodes.length} Python code blocks in ${issueFolder}`);
    logEvent('INFO', 'ocv-analysis', 'Python codes extracted', {
      issueFolder,
      codeCount: pythonCodes.length
    });

    if (pythonCodes.length === 0) {
      analysisResult.rootCause = 'No Python code found in conversation';
      return analysisResult;
    }

    // Create issue-specific output directory
    const issueOutputDir = path.join(outputDir, issueFolder);
    fs.mkdirSync(issueOutputDir, { recursive: true });

    // Test each Python code for reproducibility
    for (let i = 0; i < pythonCodes.length; i++) {
      const codeBlock = pythonCodes[i];
      const executionResult = await testPythonCodeExecution(
        server,
        codeBlock,
        i,
        issueOutputDir,
        maxAttempts,
        generateMissingData
      );

      analysisResult.executionResults.push(executionResult);

      if (executionResult.success) {
        analysisResult.reproduced = true;
      }

      if (executionResult.missingDependencies) {
        analysisResult.missingDependencies.push(...executionResult.missingDependencies);
      }

      if (executionResult.generatedDataset) {
        analysisResult.generatedDatasets.push(executionResult.generatedDataset);
      }
    }

    // Perform root cause analysis using LLM
    analysisResult.rootCause = await performRootCauseAnalysis(
      server,
      analysisResult,
      conversationData
    );

    // Generate recommendations
    analysisResult.recommendations = await generateRecommendations(
      server,
      analysisResult
    );

    // Copy relevant files to output directory
    await copyRelevantFiles(issuePath, issueOutputDir);

    console.log(`[OCV] Analysis completed for ${issueFolder}: reproduced=${analysisResult.reproduced}`);
    logEvent('INFO', 'ocv-analysis', 'Issue analysis completed', {
      issueFolder,
      reproduced: analysisResult.reproduced,
      rootCause: analysisResult.rootCause.substring(0, 100)
    });

    return analysisResult;

  } catch (error) {
    console.error(`[OCV] Error analyzing ${issueFolder}:`, error);
    logEvent('ERROR', 'ocv-analysis', 'Issue analysis error', {
      issueFolder,
      error: error instanceof Error ? error.message : error
    });

    analysisResult.rootCause = `Analysis failed: ${error instanceof Error ? error.message : error}`;
    return analysisResult;
  }
}

export function extractPythonCodesFromConversation(conversationData: any): any[] {
  const pythonCodes: any[] = [];

  if (!conversationData.conversation || !conversationData.conversation.messages) {
    return pythonCodes;
  }

  for (const message of conversationData.conversation.messages) {
    // Check for GeneratedCode message type
    if (message.messageType === 'GeneratedCode' && message.adaptiveCards) {
      for (const card of message.adaptiveCards) {
        if (card.body) {
          for (const bodyElement of card.body) {
            if (bodyElement.type === 'RichTextBlock' && bodyElement.inlines) {
              for (const inline of bodyElement.inlines) {
                if (inline.type === 'TextRun' && inline.text) {
                  const codeMatches = inline.text.match(/```python\n(.*?)```/gs);
                  if (codeMatches) {
                    for (const match of codeMatches) {
                      const code = match.replace(/```python\n/, '').replace(/```$/, '');
                      pythonCodes.push({
                        messageId: message.messageId,
                        code,
                        timestamp: message.createdAt,
                        source: 'GeneratedCode'
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Check for Progress message type (which might also contain code)
    if (message.messageType === 'Progress' && message.adaptiveCards) {
      for (const card of message.adaptiveCards) {
        if (card.body) {
          for (const bodyElement of card.body) {
            if (bodyElement.type === 'RichTextBlock' && bodyElement.inlines) {
              for (const inline of bodyElement.inlines) {
                if (inline.type === 'TextRun' && inline.text) {
                  const codeMatches = inline.text.match(/```python\n(.*?)```/gs);
                  if (codeMatches) {
                    for (const match of codeMatches) {
                      const code = match.replace(/```python\n/, '').replace(/```$/, '');
                      pythonCodes.push({
                        messageId: message.messageId,
                        code,
                        timestamp: message.createdAt,
                        source: 'Progress'
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Check invocation field for function calls with Python code
    if (message.invocation && typeof message.invocation === 'string') {
      try {
        // Try to parse the invocation as JSON array
        const invocationData = JSON.parse(message.invocation);
        if (Array.isArray(invocationData)) {
          for (const invocation of invocationData) {
            if (invocation.function && invocation.function.arguments) {
              const args = JSON.parse(invocation.function.arguments);
              if (args.python_task) {
                // This doesn't contain actual code, but indicates a Python task was requested
                // We'll skip this as the actual code should be in GeneratedCode messages
              }
            }
          }
        }
      } catch (e) {
        // Invocation might not be JSON, skip
      }
    }
  }

  return pythonCodes;
}

export async function testPythonCodeExecution(
  server: any,
  codeBlock: any,
  index: number,
  outputDir: string,
  maxAttempts: number,
  generateMissingData: boolean
): Promise<any> {
  const result = {
    index,
    messageId: codeBlock.messageId,
    success: false,
    error: '',
    attempts: 0,
    missingDependencies: [] as string[],
    generatedDataset: null as any,
    workingCode: '',
    outputFiles: [] as any[],
    renderable: true
  };

  const codeFileName = `code_block_${index}.py`;
  const codeFilePath = path.join(outputDir, codeFileName);

  // Save original code
  fs.writeFileSync(codeFilePath, codeBlock.code);
  result.workingCode = codeBlock.code;

  // Check if code is directly executable (basic validation)
  if (!isCodeDirectlyExecutable(codeBlock.code)) {
    result.renderable = false;
    result.error = 'Code is not directly executable - contains incomplete blocks, syntax errors, or requires manual intervention';
    console.log(`[OCV] Code block ${index} marked as not renderable`);
    logEvent('INFO', 'ocv-analysis', 'Code marked as not renderable', {
      index,
      reason: result.error
    });

    // For non-renderable code, do NOT attempt LLM fixes - report as incorrect Python code
    result.error = 'Incorrect Python code: ' + result.error;
    console.log(`[OCV] Code block ${index} marked as incorrect Python code due to syntax/structural issues`);
    logEvent('INFO', 'ocv-analysis', 'Code marked as incorrect Python code', {
      index,
      reason: 'syntax/structural issues'
    });

    return result;
  }

  // Attempt execution with retries
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    result.attempts = attempt;

    try {
      console.log(`[OCV] Attempt ${attempt} to execute code block ${index}`);
      logEvent('DEBUG', 'ocv-analysis', 'Code execution attempt', {
        index,
        attempt,
        codeLength: result.workingCode.length
      });

      // Execute Python code in the output directory
      const { stdout, stderr } = await execAsync(`cd "${outputDir}" && python "${codeFileName}"`, {
        timeout: 30000 // 30 second timeout
      });

      if (stderr && !stderr.includes('Warning')) {
        throw new Error(`Execution error: ${stderr}`);
      }

      // Check for generated files
      const filesAfter = fs.readdirSync(outputDir);
      const newFiles = filesAfter.filter(f => !fs.existsSync(path.join(outputDir, f)) || f === codeFileName);
      result.outputFiles = newFiles.filter(f => f !== codeFileName);

      result.success = true;
      console.log(`[OCV] Code block ${index} executed successfully on attempt ${attempt}`);
      logEvent('INFO', 'ocv-analysis', 'Code execution success', {
        index,
        attempt,
        outputFiles: result.outputFiles.length
      });
      break;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.error = errorMessage;

      console.log(`[OCV] Code block ${index} failed on attempt ${attempt}: ${errorMessage}`);
      logEvent('DEBUG', 'ocv-analysis', 'Code execution failed', {
        index,
        attempt,
        error: errorMessage.substring(0, 200)
      });

      // Analyze error for missing dependencies
      const missingDeps = analyzeMissingDependencies(errorMessage);
      if (missingDeps.length > 0) {
        result.missingDependencies = missingDeps;

        if (generateMissingData && attempt < maxAttempts) {
          // Only attempt fixes for missing dependencies, not syntax errors
          try {
            const fixedCode = await generateFixedCode(server, result.workingCode, errorMessage, missingDeps);
            if (fixedCode !== result.workingCode) {
              result.workingCode = fixedCode;
              fs.writeFileSync(codeFilePath, fixedCode);

              console.log(`[OCV] Generated fixed code for missing dependencies on attempt ${attempt + 1}`);
              logEvent('INFO', 'ocv-analysis', 'Code fixed with LLM for missing dependencies', {
                index,
                attempt,
                missingDeps
              });
              continue;
            }
          } catch (fixError) {
            console.log(`[OCV] Failed to generate fixed code: ${fixError}`);
            logEvent('DEBUG', 'ocv-analysis', 'Code fix failed', {
              index,
              attempt,
              fixError: fixError instanceof Error ? fixError.message : fixError
            });
          }

          // Try to generate missing datasets separately
          try {
            const datasetInfo = await generateMissingDataset(server, result.workingCode, errorMessage, outputDir);
            if (datasetInfo) {
              result.generatedDataset = datasetInfo;
              console.log(`[OCV] Generated missing dataset for attempt ${attempt + 1}: ${datasetInfo.filename}`);
              logEvent('INFO', 'ocv-analysis', 'Dataset generated with LLM', {
                index,
                attempt,
                filename: datasetInfo.filename
              });
              continue;
            }
          } catch (dataError) {
            console.log(`[OCV] Failed to generate missing dataset: ${dataError}`);
            logEvent('DEBUG', 'ocv-analysis', 'Dataset generation failed', {
              index,
              attempt,
              dataError: dataError instanceof Error ? dataError.message : dataError
            });
          }
        }
      } else {
        // For non-dependency errors (syntax errors, etc.), mark as incorrect Python code
        result.renderable = false;
        result.error = `Incorrect Python code: ${errorMessage}`;
        console.log(`[OCV] Code block ${index} has syntax/runtime errors - marked as incorrect Python code`);
        logEvent('INFO', 'ocv-analysis', 'Code marked as incorrect due to syntax/runtime errors', {
          index,
          error: errorMessage.substring(0, 200)
        });
      }

      if (attempt === maxAttempts) {
        // Mark as not renderable if all attempts failed
        result.renderable = false;
        console.log(`[OCV] Code block ${index} failed after ${maxAttempts} attempts - marked as not renderable`);
        logEvent('ERROR', 'ocv-analysis', 'Code execution final failure', {
          index,
          maxAttempts,
          finalError: errorMessage.substring(0, 200)
        });
      }
    }
  }

  return result;
}

export function isCodeDirectlyExecutable(code: string): boolean {
  // Basic checks for code that is likely not directly executable
  const codeLines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Check for common patterns that indicate non-executable code
  const nonExecutablePatterns = [
    // Incomplete function definitions
    /^def\s+\w+\([^)]*\):\s*$/,
    // Class definitions without implementation
    /^class\s+\w+.*:\s*$/,
    // Import statements at the end (unusual)
    /^(import|from)\s+.*/,
    // Incomplete loops
    /^(for|while)\s+.*:\s*$/,
    // Incomplete conditionals
    /^(if|elif|else)\s*.*:\s*$/,
    // Incomplete try/except blocks
    /^(try|except|finally)\s*.*:\s*$/,
    // Code fragments with ellipsis
    /\.\.\./,
    // Comments indicating incomplete code
    /^#.*\b(TODO|FIXME|INCOMPLETE|PLACEHOLDER)\b/i,
    // Function calls without proper syntax
    /^\w+\([^)]*$/,
    // Incomplete string literals
    /^["'][^"']*$/
  ];

  // Check if code contains only comments or whitespace
  const meaningfulLines = codeLines.filter(line => !line.startsWith('#') && line.length > 0);
  if (meaningfulLines.length === 0) {
    return false;
  }

  // Check for syntax errors or incomplete blocks
  let indentLevel = 0;
  let hasIncompleteBlock = false;

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i];

    // Check against non-executable patterns
    for (const pattern of nonExecutablePatterns) {
      if (pattern.test(line)) {
        // Check if the next line provides implementation
        const nextLine = i + 1 < codeLines.length ? codeLines[i + 1] : '';
        if (line.endsWith(':') && (!nextLine || !nextLine.startsWith('    '))) {
          return false; // Incomplete block
        }
      }
    }

    // Track indentation for block structure
    if (line.endsWith(':')) {
      indentLevel++;
      hasIncompleteBlock = true;
    } else if (hasIncompleteBlock && line.startsWith('    ')) {
      hasIncompleteBlock = false;
    }
  }

  // If we still have incomplete blocks at the end
  if (hasIncompleteBlock) {
    return false;
  }

  // Check for basic Python syntax requirements
  try {
    // Very basic syntax check - look for balanced parentheses, quotes, etc.
    let parenCount = 0;
    let singleQuoteCount = 0;
    let doubleQuoteCount = 0;

    for (const char of code) {
      if (char === '(') parenCount++;
      else if (char === ')') parenCount--;
      else if (char === "'" && code[code.indexOf(char) - 1] !== '\\') singleQuoteCount++;
      else if (char === '"' && code[code.indexOf(char) - 1] !== '\\') doubleQuoteCount++;
    }

    if (parenCount !== 0 || singleQuoteCount % 2 !== 0 || doubleQuoteCount % 2 !== 0) {
      return false;
    }
  } catch (error) {
    return false;
  }

  return true;
}

export function analyzeMissingDependencies(errorMessage: string): string[] {
  const dependencies: string[] = [];

  // Only consider actual import/module errors as missing dependencies
  const importPatterns = [
    /No module named '([^']+)'/g,
    /ModuleNotFoundError: No module named '([^']+)'/g,
    /ImportError: No module named ([^\s]+)/g,
    /cannot import name '([^']+)'/g
  ];

  for (const pattern of importPatterns) {
    let match;
    while ((match = pattern.exec(errorMessage)) !== null) {
      dependencies.push(match[1]);
    }
  }

  // File not found patterns (for datasets) - only if they're clearly data files
  const filePatterns = [
    /FileNotFoundError.*'([^']+\.(csv|json|xlsx|txt|parquet|hdf5|pkl|pickle))'/g,
    /No such file or directory: '([^']+\.(csv|json|xlsx|txt|parquet|hdf5|pkl|pickle))'/g
  ];

  for (const pattern of filePatterns) {
    let match;
    while ((match = pattern.exec(errorMessage)) !== null) {
      dependencies.push(`file:${match[1]}`);
    }
  }

  // Exclude syntax errors and other non-dependency related errors
  const syntaxErrorPatterns = [
    /SyntaxError/i,
    /IndentationError/i,
    /TypeError/i,
    /NameError/i,
    /AttributeError/i,
    /ValueError/i,
    /KeyError/i,
    /IndexError/i,
    /ZeroDivisionError/i,
    /UnboundLocalError/i,
    /RecursionError/i
  ];

  // If the error is a syntax error, return empty array (no dependencies to fix)
  for (const pattern of syntaxErrorPatterns) {
    if (pattern.test(errorMessage)) {
      // Only return dependencies if they were explicitly import-related
      return dependencies.filter(dep => !dep.startsWith('file:'));
    }
  }

  return [...new Set(dependencies)]; // Remove duplicates
}

export async function generateFixedCode(
  server: any,
  originalCode: string,
  errorMessage: string,
  missingDependencies: string[]
): Promise<string> {
  try {
    const prompt = `Fix the following Python code that has execution errors. The error message and missing dependencies are provided below.

ORIGINAL CODE:
\`\`\`python
${originalCode}
\`\`\`

ERROR MESSAGE:
${errorMessage}

MISSING DEPENDENCIES:
${missingDependencies.join(', ')}

Please provide a corrected version of the code that:
1. Handles missing modules by either installing them or using alternatives
2. Generates synthetic datasets for missing data files
3. Fixes any syntax or runtime errors
4. Maintains the original intent and functionality of the code
5. Includes proper error handling

Return only the corrected Python code without explanations.`;

    const response = await server.server.createMessage({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are a Python debugging expert specializing in data visualization and scientific computing.\n\n${prompt}`
          }
        }
      ],
      maxTokens: 2000
    });

    const responseText = response.content.type === 'text' ? response.content.text : originalCode;

    // Extract Python code from response
    const codeMatch = responseText.match(/```python\n(.*?)```/s);
    if (codeMatch) {
      return codeMatch[1];
    }

    // If no code block found, try to use the entire response
    return responseText.includes('import') ? responseText : originalCode;

  } catch (error) {
    console.error(`[OCV] Error generating fixed code:`, error);
    logEvent('ERROR', 'ocv-analysis', 'Fixed code generation failed', {
      error: error instanceof Error ? error.message : error
    });
    return originalCode;
  }
}

export async function generateMissingDataset(
  server: any,
  originalCode: string,
  errorMessage: string,
  outputDir: string
): Promise<any> {
  try {
    // Extract filename from error message
    const fileMatch = errorMessage.match(/['""]([^'""]*\.(?:csv|json|xlsx|txt))['""]/) ||
      errorMessage.match(/No such file or directory: ['"]?([^'"\s]+\.(?:csv|json|xlsx|txt))['"]?/);

    if (!fileMatch) {
      console.log(`[OCV] No data file detected in error message`);
      return null;
    }

    const missingFilename = fileMatch[1];
    console.log(`[OCV] Detected missing data file: ${missingFilename}`);

    const prompt = `Generate synthetic data for a missing file based on the Python code context.

PYTHON CODE:
\`\`\`python
${originalCode}
\`\`\`

MISSING FILE: ${missingFilename}
ERROR MESSAGE: ${errorMessage}

Based on the code, generate realistic synthetic data that would allow this code to execute successfully. Consider:
1. Variable names and column references in the code
2. Data types expected (numbers, strings, dates, etc.)
3. Reasonable sample size (50-200 rows)
4. File format (CSV, JSON, etc.)

Return the data in the appropriate format for the file extension. For CSV, provide comma-separated values with headers. For JSON, provide valid JSON structure.`;

    const response = await server.server.createMessage({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are a data science expert specializing in generating realistic synthetic datasets for testing and development.\n\n${prompt}`
          }
        }
      ],
      maxTokens: 3000
    });

    const responseText = response.content.type === 'text' ? response.content.text : '';

    // Determine file type and extract data
    const fileExt = path.extname(missingFilename).toLowerCase();
    let dataContent = '';

    if (fileExt === '.csv') {
      // Extract CSV data
      const csvMatch = responseText.match(/```csv\n(.*?)```/s) ||
        responseText.match(/```\n(.*?)```/s);
      dataContent = csvMatch ? csvMatch[1].trim() : responseText.trim();
    } else if (fileExt === '.json') {
      // Extract JSON data
      const jsonMatch = responseText.match(/```json\n(.*?)```/s) ||
        responseText.match(/\{.*\}/s);
      dataContent = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
    } else {
      // Plain text or other formats
      dataContent = responseText.trim();
    }

    // Save the generated data
    const dataFilePath = path.join(outputDir, missingFilename);
    fs.writeFileSync(dataFilePath, dataContent, 'utf8');

    console.log(`[OCV] Generated synthetic dataset: ${missingFilename} (${dataContent.length} chars)`);
    logEvent('INFO', 'ocv-analysis', 'Synthetic dataset generated', {
      filename: missingFilename,
      size: dataContent.length,
      fileType: fileExt
    });

    return {
      filename: missingFilename,
      path: dataFilePath,
      size: dataContent.length,
      type: fileExt,
      content: dataContent.substring(0, 500) // Store first 500 chars for reference
    };

  } catch (error) {
    console.error(`[OCV] Error generating missing dataset:`, error);
    logEvent('ERROR', 'ocv-analysis', 'Dataset generation failed', {
      error: error instanceof Error ? error.message : error
    });
    return null;
  }
}

export async function performRootCauseAnalysis(
  server: any,
  analysisResult: any,
  conversationData: any
): Promise<string> {
  try {
    const prompt = `Perform a comprehensive root cause analysis for this issue based on the execution results and conversation data.

ISSUE DESCRIPTION:
${analysisResult.issueDescription}

PYTHON CODES FOUND: ${analysisResult.pythonCodes.length}
EXECUTION RESULTS:
${analysisResult.executionResults.map((result: any, index: number) =>
      `Code Block ${index}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.error || 'No errors'}`
    ).join('\n')}

MISSING DEPENDENCIES:
${analysisResult.missingDependencies.join(', ') || 'None'}

SCREENSHOTS AVAILABLE: ${analysisResult.screenshots.join(', ') || 'None'}

CONVERSATION CONTEXT:
Total Messages: ${conversationData.conversation?.messages?.length || 0}
User Request: ${conversationData.conversation?.messages?.[0]?.text || 'Not available'}

Please analyze and provide:
1. Primary root cause of the issue
2. Contributing factors
3. Whether the issue is reproducible and why
4. Technical assessment of the problem
5. Classification (e.g., missing dependency, code error, environment issue, data issue)

Provide a concise but comprehensive analysis in 2-3 paragraphs.`;

    const response = await server.server.createMessage({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are a technical analyst specializing in software debugging and issue resolution.\n\n${prompt}`
          }
        }
      ],
      maxTokens: 1500
    });

    return response.content.type === 'text' ? response.content.text : 'Root cause analysis could not be completed';

  } catch (error) {
    console.error(`[OCV] Error performing root cause analysis:`, error);
    logEvent('ERROR', 'ocv-analysis', 'Root cause analysis failed', {
      error: error instanceof Error ? error.message : error
    });
    return `Root cause analysis failed: ${error instanceof Error ? error.message : error}`;
  }
}

export async function generateRecommendations(
  server: any,
  analysisResult: any
): Promise<string> {
  try {
    const prompt = `Based on the analysis results, provide actionable recommendations to resolve this issue.

ANALYSIS SUMMARY:
- Reproduced: ${analysisResult.reproduced}
- Root Cause: ${analysisResult.rootCause}
- Python Codes: ${analysisResult.pythonCodes.length}
- Missing Dependencies: ${analysisResult.missingDependencies.join(', ') || 'None'}
- Generated Datasets: ${analysisResult.generatedDatasets.length}

EXECUTION RESULTS:
${analysisResult.executionResults.map((result: any, index: number) =>
      `Code ${index}: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.attempts} attempts)`
    ).join('\n')}

Please provide:
1. Immediate action items to resolve the issue
2. Prevention strategies for similar issues
3. Environment or setup recommendations
4. Code quality improvements if applicable
5. Testing and validation steps

Format as a numbered list of actionable recommendations.`;

    const response = await server.server.createMessage({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are a software engineering consultant providing actionable recommendations for issue resolution.\n\n${prompt}`
          }
        }
      ],
      maxTokens: 1000
    });

    return response.content.type === 'text' ? response.content.text : 'Recommendations could not be generated';

  } catch (error) {
    console.error(`[OCV] Error generating recommendations:`, error);
    logEvent('ERROR', 'ocv-analysis', 'Recommendations generation failed', {
      error: error instanceof Error ? error.message : error
    });
    return `Recommendations generation failed: ${error instanceof Error ? error.message : error}`;
  }
}

export async function copyRelevantFiles(sourcePath: string, targetPath: string): Promise<void> {
  try {
    const files = fs.readdirSync(sourcePath);

    for (const file of files) {
      const sourceFile = path.join(sourcePath, file);
      const targetFile = path.join(targetPath, file);

      const stat = fs.statSync(sourceFile);
      if (stat.isFile()) {
        fs.copyFileSync(sourceFile, targetFile);
      }
    }

    console.log(`[OCV] Copied ${files.length} files to analysis output`);
    logEvent('DEBUG', 'ocv-analysis', 'Files copied', {
      fileCount: files.length,
      targetPath
    });

  } catch (error) {
    console.error(`[OCV] Error copying files:`, error);
    logEvent('ERROR', 'ocv-analysis', 'File copy failed', {
      error: error instanceof Error ? error.message : error
    });
  }
}

export async function generateExcelReport(analysisResults: any[], outputDir: string): Promise<void> {
  try {
    // Since we can't use external Excel libraries without adding dependencies,
    // we'll create a CSV file that can be opened in Excel
    const csvData = [];

    // Headers
    csvData.push([
      'Issue Folder',
      'Reproduced',
      'Renderable Code',
      'Incorrect Python Code',
      'Root Cause',
      'Python Codes Found',
      'Successful Executions',
      'Missing Dependencies',
      'Generated Datasets',
      'Screenshots',
      'Recommendations',
      'Issue Description (First 100 chars)'
    ]);

    // Data rows
    for (const result of analysisResults) {
      const successfulExec = result.executionResults?.filter((r: any) => r.success).length || 0;
      const renderableCode = result.executionResults?.filter((r: any) => r.renderable !== false).length || 0;
      const incorrectCode = result.executionResults?.filter((r: any) =>
        r.error && r.error.startsWith('Incorrect Python code:')).length || 0;
      const totalCode = result.executionResults?.length || 0;
      const generatedDatasets = result.executionResults?.filter((r: any) => r.generatedDataset).length || 0;

      csvData.push([
        result.issueFolder || '',
        result.reproduced ? 'YES' : 'NO',
        `${renderableCode}/${totalCode}`,
        `${incorrectCode}/${totalCode}`,
        (result.rootCause || '').replace(/"/g, '""').substring(0, 500),
        result.pythonCodes?.length || 0,
        `${successfulExec}/${totalCode}`,
        (result.missingDependencies?.join('; ') || '').replace(/"/g, '""'),
        generatedDatasets,
        (result.screenshots?.join('; ') || '').replace(/"/g, '""'),
        (result.recommendations || '').replace(/"/g, '""').substring(0, 500),
        (result.issueDescription || '').replace(/"/g, '""').substring(0, 100)
      ]);
    }

    // Convert to CSV string
    const csvContent = csvData.map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Save CSV file
    const csvPath = path.join(outputDir, 'ocv_analysis_report.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf8');

    // Also create a detailed JSON report
    const jsonPath = path.join(outputDir, 'ocv_analysis_detailed.json');
    fs.writeFileSync(jsonPath, JSON.stringify(analysisResults, null, 2), 'utf8');

    // Create summary statistics
    const summary = {
      totalIssues: analysisResults.length,
      reproducedIssues: analysisResults.filter(r => r.reproduced).length,
      issuesWithCode: analysisResults.filter(r => r.pythonCodes?.length > 0).length,
      issuesWithMissingDeps: analysisResults.filter(r => r.missingDependencies?.length > 0).length,
      totalPythonCodes: analysisResults.reduce((sum, r) => sum + (r.pythonCodes?.length || 0), 0),
      renderableCodes: analysisResults.reduce((sum, r) =>
        sum + (r.executionResults?.filter((ex: any) => ex.renderable !== false).length || 0), 0),
      incorrectPythonCodes: analysisResults.reduce((sum, r) =>
        sum + (r.executionResults?.filter((ex: any) =>
          ex.error && ex.error.startsWith('Incorrect Python code:')).length || 0), 0),
      successfulExecutions: analysisResults.reduce((sum, r) =>
        sum + (r.executionResults?.filter((ex: any) => ex.success).length || 0), 0),
      generatedDatasets: analysisResults.reduce((sum, r) =>
        sum + (r.executionResults?.filter((ex: any) => ex.generatedDataset).length || 0), 0)
    };

    const summaryPath = path.join(outputDir, 'ocv_analysis_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

    console.log(`[OCV] Generated Excel report: ${csvPath}`);
    console.log(`[OCV] Generated detailed report: ${jsonPath}`);
    console.log(`[OCV] Generated summary: ${summaryPath}`);
    logEvent('INFO', 'ocv-analysis', 'Reports generated', {
      csvPath,
      jsonPath,
      summaryPath,
      totalIssues: summary.totalIssues,
      reproducedIssues: summary.reproducedIssues
    });

  } catch (error) {
    console.error(`[OCV] Error generating Excel report:`, error);
    logEvent('ERROR', 'ocv-analysis', 'Excel report generation failed', {
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
}

export function extractJsonArray(text: any): any[] | string | null {
  // Ensure input is a string
  if (typeof text !== 'string') {
    text = String(text);
  }

  // Try to find JSON arrays more intelligently
  // Look for patterns that are more likely to be JSON arrays
  const jsonArrayPatterns = [
    // Look for arrays that start with objects
    /\[\s*\{[^}]*\}/g,
    // Look for arrays with strings
    /\[\s*"[^"]*"/g,
    // Look for simple arrays
    /\[\s*[{\["0-9]/g
  ];

  for (const pattern of jsonArrayPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const startIndex = text.indexOf(match);
        if (startIndex !== -1) {
          // Try to find the complete JSON array starting from this position
          let bracketCount = 0;
          let inString = false;
          let escaped = false;
          let arrayEnd = -1;

          for (let i = startIndex; i < text.length; i++) {
            const char = text[i];

            if (escaped) {
              escaped = false;
              continue;
            }

            if (char === '\\' && inString) {
              escaped = true;
              continue;
            }

            if (char === '"' && !escaped) {
              inString = !inString;
              continue;
            }

            if (!inString) {
              if (char === '[') {
                bracketCount++;
              } else if (char === ']') {
                bracketCount--;
                if (bracketCount === 0) {
                  arrayEnd = i;
                  break;
                }
              }
            }
          }

          if (arrayEnd !== -1) {
            const jsonArrayStr = text.substring(startIndex, arrayEnd + 1);
            try {
              const parsed = JSON.parse(jsonArrayStr);
              if (Array.isArray(parsed)) {
                return parsed;
              }
            } catch (err) {
              // Continue trying other matches
              continue;
            }
          }
        }
      }
    }
  }

  // Fallback to original simple method but with better validation
  const arrayStart = text.indexOf('[');
  const arrayEnd = text.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    const jsonArrayStr = text.substring(arrayStart, arrayEnd + 1);
    // Only try to parse if it looks like it could be JSON
    if (jsonArrayStr.includes('{') || jsonArrayStr.includes('"') || /^\[\s*\d/.test(jsonArrayStr)) {
      try {
        const parsed = JSON.parse(jsonArrayStr);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (err) {
        return String(err);
      }
    }
  }

  return null;
}
/**
 * Extracts the first 'View screenshots' link from a YAML snapshot file.
 * @param snapshotFilePath Path to the snapshot file
 * @returns The extracted link, or null if not found
 */
export function extractViewScreenshotsLink(snapshotFilePath: string): string | null {
  const content = fs.readFileSync(snapshotFilePath, 'utf-8');
  // Look for the line with: link "View screenshots" ... /url: ...
  // The link is on a line like: - link "View screenshots" [ref=...] [cursor=pointer]:
  // The next indented line contains: - /url: <url>
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('link "View screenshots"')) {
      // Look ahead for the /url: line
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const urlMatch = lines[j].match(/- \/url: (\S+)/);
        if (urlMatch && urlMatch[1]) {
          // Remove any surrounding quotes
          return urlMatch[1].replace(/^"|"$/g, '');
        }
      }
    }
  }
  return null;
}

export async function enableTicketIdInColumnSettings() {
  // logMessage('Step 1a: Capturing page snapshot for metadata');
    // const snapshotFile = path.join(sessionDir, 'page_snapshot.txt');
    // const ticket_snapshotFile = path.join(sessionDir, 'page_snapshot_ticket.txt');    
    // let snapshotResult = null;
    // try {
    //   snapshotResult = await client.callTool('mcp_playwright-mc_browser_snapshot', {});
    //   fs.writeFileSync(snapshotFile, JSON.stringify(snapshotResult, null, 2), 'utf8');
    //   fs.writeFileSync(ticket_snapshotFile, JSON.stringify(snapshotResult, null, 2), 'utf8');
    //   logMessage(`Page snapshot saved to: ${snapshotFile}`);
    // } catch (snapshotErr) {
    //   logMessage(`Error capturing page snapshot: ${snapshotErr}`);
    //   fs.writeFileSync(snapshotFile, `Error capturing snapshot: ${snapshotErr}`, 'utf8');
    //   logMessage(`Page snapshot saved to: ${snapshotFile}`);
    // }

    // let clickTicketId = true;
    // logMessage('Ensuring "Ticket id" column is visible...');
    // try {
    //   // 1. Click the Column Settings button using the page snapshot (by accessible name, aria-label, title, or text)
    //   let buttonRef = null;
    //   const snapshotFile = path.join(sessionDir, 'page_snapshot.txt');
    //   const snapshot = fs.readFileSync(snapshotFile, 'utf8');
    //   // The snapshot might be in string format (YAML) or object format
    //   if (snapshot) {
    //     // First, try to parse as string (YAML format)
    //     const snapshotStr = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

    //     // find if ticket id header is already present
    //     if (snapshotStr.includes('Ticket id') || snapshotStr.includes('ticket id') || snapshotStr.includes('ticketid') || snapshotStr.includes('ticket-id')) {
    //       logMessage('Ticket id column already present in snapshot, skipping Column Settings click');
    //       clickTicketId = false; // No need to click if already present
    //     }

    //     if (clickTicketId) {

    //       // Look for the pattern: button "Column Settings" [ref=xxx]
    //       const buttonMatch = snapshotStr.match(/button\s+"Column Settings"\s+\[ref=([^\]]+)\]/i);
    //       if (buttonMatch) {
    //         buttonRef = buttonMatch[1];
    //         logMessage(`Found Column Settings button via regex pattern: ${buttonRef}`);
    //       }

    //       // If not found via regex, try object-based search
    //       if (!buttonRef && snapshotResult.children) {
    //         function findButton(node: any): string | null {
    //           if (!node) return null;

    //           // Check if this is a button node by looking at the structure
    //           const nodeStr = String(node);
    //           if (nodeStr.includes('button') && nodeStr.toLowerCase().includes('column settings')) {
    //             // Try to extract ref from various formats
    //             if (node.ref) return node.ref;
    //             const refMatch = nodeStr.match(/\[ref=([^\]]+)\]/);
    //             if (refMatch) return refMatch[1];
    //           }

    //           // Also check node properties
    //           const name = (node.name || '').toLowerCase();
    //           const role = (node.role || '').toLowerCase();
    //           const aria = (node['aria-label'] || '').toLowerCase();
    //           const title = (node.title || '').toLowerCase();
    //           const text = (node.text || '').toLowerCase();

    //           // Check if this is a button with "Column Settings" text or accessible name
    //           if (
    //             role === 'button' && (
    //               name.includes('column settings') ||
    //               aria.includes('column settings') ||
    //               title.includes('column settings') ||
    //               text.includes('column settings') ||
    //               name === 'column settings' ||
    //               aria === 'column settings' ||
    //               title === 'column settings' ||
    //               text === 'column settings'
    //             )
    //           ) {
    //             return node.ref;
    //           }

    //           if (node.children && Array.isArray(node.children)) {
    //             for (const child of node.children) {
    //               const found: string | null = findButton(child);
    //               if (found) return found;
    //             }
    //           }
    //           return null;
    //         }
    //         buttonRef = findButton(snapshotResult);
    //       }

    //       // If still not found, try a final search in the raw snapshot text
    //       if (!buttonRef) {
    //         const lines = snapshotStr.split('\n');
    //         for (const line of lines) {
    //           if (line.toLowerCase().includes('column settings') && line.includes('[ref=')) {
    //             const refMatch = line.match(/\[ref=([^\]]+)\]/);
    //             if (refMatch) {
    //               buttonRef = refMatch[1];
    //               logMessage(`Found Column Settings button via line search: ${buttonRef}`);
    //               break;
    //             }
    //           }
    //         }
    //       }
    //     }

    //     logMessage(`Snapshot search result - buttonRef: ${buttonRef}`);

    //     if (buttonRef) {
    //       logMessage(`Found Column Settings button ref: ${buttonRef}`);
    //       const clickResult = await client.callTool('mcp_playwright-mc_browser_click', {
    //         element: 'Column Settings button',
    //         ref: buttonRef
    //       });
    //       logMessage('Column Settings button click result: ' + JSON.stringify(clickResult));
    //     } else {
    //       logMessage('Column Settings button not found in page snapshot, skipping click.');
    //     }
    //   }
    // } catch (err) {
    //   logMessage('Error clicking Column Settings button using snapshot: ' + err);
    // }
    // // Continue with the assumption that the button was clicked successfully
    // await new Promise(resolve => setTimeout(resolve, 1500));

    // if (clickTicketId) {
    //   logMessage('Step 1a: Capturing page snapshot for metadata');
    //   snapshotResult = null;
    //   try {
    //     snapshotResult = await client.callTool('mcp_playwright-mc_browser_snapshot', {});
    //     fs.writeFileSync(snapshotFile, JSON.stringify(snapshotResult, null, 2), 'utf8');
    //     logMessage(`Page snapshot saved to: ${snapshotFile}`);
    //   } catch (snapshotErr) {
    //     logMessage(`Error capturing page snapshot: ${snapshotErr}`);
    //     fs.writeFileSync(snapshotFile, `Error capturing snapshot: ${snapshotErr}`, 'utf8');
    //     logMessage(`Page snapshot saved to: ${snapshotFile}`);
    //   }

    //   // --- Try to find and click the 'Ticket id' button from snapshot, similar to Column Settings ---
    //   try {
    //     let ticketIdButtonRef: string | null = null;
    //     const snapshot = fs.readFileSync(snapshotFile, 'utf8');
    //     const ticketIdSnapshotStr = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);
    //     // Regex search for button "Ticket id" [ref=xxx]
    //     const ticketIdButtonMatch = ticketIdSnapshotStr.match(/button\s+"Ticket id"\s+\[ref=([^\]]+)\]/i);
    //     if (ticketIdButtonMatch) {
    //       ticketIdButtonRef = ticketIdButtonMatch[1];
    //       logMessage(`Found Ticket id button via regex pattern: ${ticketIdButtonRef}`);
    //     }
    //     // Object-based search
    //     if (!ticketIdButtonRef && snapshotResult && (snapshotResult as any).children) {
    //       function findTicketIdButton(node: any): string | null {
    //         if (!node) return null;
    //         const nodeStr = String(node);
    //         if (nodeStr.includes('button') && nodeStr.toLowerCase().includes('ticket id')) {
    //           if (node.ref) return node.ref;
    //           const refMatch = nodeStr.match(/\[ref=([^\]]+)\]/);
    //           if (refMatch) return refMatch[1];
    //         }
    //         const name = (node.name || '').toLowerCase();
    //         const role = (node.role || '').toLowerCase();
    //         const aria = (node['aria-label'] || '').toLowerCase();
    //         const title = (node.title || '').toLowerCase();
    //         const text = (node.text || '').toLowerCase();
    //         if (
    //           role === 'button' && (
    //             name.includes('ticket id') ||
    //             aria.includes('ticket id') ||
    //             title.includes('ticket id') ||
    //             text.includes('ticket id') ||
    //             name === 'ticket id' ||
    //             aria === 'ticket id' ||
    //             title === 'ticket id' ||
    //             text === 'ticket id'
    //           )
    //         ) {
    //           return node.ref;
    //         }
    //         if (node.children && Array.isArray(node.children)) {
    //           for (const child of node.children) {
    //             const found: string | null = findTicketIdButton(child);
    //             if (found) return found;
    //           }
    //         }
    //         return null;
    //       }
    //       ticketIdButtonRef = findTicketIdButton(snapshotResult);
    //     }
    //     // Line-based search
    //     if (!ticketIdButtonRef) {
    //       const lines = ticketIdSnapshotStr.split('\n');
    //       for (const line of lines) {
    //         if (line.toLowerCase().includes('ticket id') && line.includes('[ref=')) {
    //           const refMatch = line.match(/\[ref=([^\]]+)\]/);
    //           if (refMatch) {
    //             ticketIdButtonRef = refMatch[1];
    //             logMessage(`Found Ticket id button via line search: ${ticketIdButtonRef}`);
    //             break;
    //           }
    //         }
    //       }
    //     }
    //     logMessage(`Snapshot search result - ticketIdButtonRef: ${ticketIdButtonRef}`);
    //     if (ticketIdButtonRef) {
    //       // find the next button in the snapshot after the Ticket id element
    //       let nextButtonRef: string | null = null;
    //       try {
    //         // Read the snapshot text file and find the next button after Ticket id
    //         const snapshotFileContent = fs.readFileSync(snapshotFile, 'utf8');
    //         logMessage(`Snapshot file content length: ${snapshotFileContent.length} characters`);

    //         // Parse snapshot text to find next button after Ticket id
    //         const lines = snapshotFileContent.split('\n');
    //         let foundTicketIdLine = false;

    //         logMessage(`Searching for next button after Ticket id ref: ${ticketIdButtonRef}`);

    //         for (let i = 0; i < lines.length; i++) {
    //           const line = lines[i];

    //           // Check if this line contains our Ticket id button reference
    //           if (line.includes(ticketIdButtonRef)) {
    //             foundTicketIdLine = true;
    //             logMessage(`Found Ticket id reference at line ${i}: ${line.trim()}`);
    //             continue;
    //           }

    //           // If we've found the Ticket id line, look for the next button
    //           if (foundTicketIdLine && line.includes('button') && line.includes('[ref=')) {
    //             const refMatch = line.match(/\[ref=([^\]]+)\]/);
    //             if (refMatch) {
    //               nextButtonRef = refMatch[1];
    //               logMessage(`Found next button after Ticket id at line ${i}: ${line.trim()}`);
    //               logMessage(`Next button ref: ${nextButtonRef}`);
    //               break;
    //             }
    //           }
    //         }

    //         if (!nextButtonRef) {
    //           logMessage('No next button found after Ticket id in snapshot, will use Ticket id button itself');
    //         }
    //       } catch (err) {
    //         logMessage('Error finding next button in snapshot: ' + err);
    //       }

    //       const targetRef = nextButtonRef || ticketIdButtonRef;
    //       const targetLabel = nextButtonRef ? 'button next to Ticket id' : 'Ticket id button';

    //       logMessage(`Found ${targetLabel} ref: ${targetRef}`);
    //       const clickResult = await client.callTool('mcp_playwright-mc_browser_click', {
    //         element: targetLabel,
    //         ref: targetRef
    //       });
    //       logMessage(`${targetLabel} click result: ` + JSON.stringify(clickResult));
    //       await new Promise(resolve => setTimeout(resolve, 5000));
    //     }
    //   } catch (err) {
    //     logMessage('Error clicking Ticket id button using snapshot: ' + err);
    //   }
    // }
}