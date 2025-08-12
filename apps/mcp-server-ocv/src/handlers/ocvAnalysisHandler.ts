// OCV Analysis Handler
import path from 'path';
import fs from 'fs';
import net from 'net';
import { spawn } from 'child_process';
import { logEvent } from '../utils.js';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mcpServerInstance as server } from '../index.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);

// Track issue-level error/dependency/LLM info (module scope)
type IssueErrorInfo = {
  issueId: string;
  errors: string[];
  hasMissingDependencies: boolean;
  llmCreatedDeps: boolean;
};
const issueErrorInfoArr: IssueErrorInfo[] = [];

export const ocvAnalysisHandler = async (
  args: {
    issueFolder?: string;
    maxAttempts?: number;
    generateMissingData?: boolean;
    prompt?: string;
    userPrompt?: string;
    query?: string;
  },
  _extra: any
): Promise<{ content: { type: "text"; text: string }[] }> => {
  logEvent('INFO', 'ocv-analysis', 'Handler invoked', args);

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
      console.log('[MCP] Looking for arguments in MCP request structure');
      actualArgs = args; // Keep original args as fallback
    }
  }

  console.log('[MCP] DEBUG - actualArgs:', JSON.stringify(actualArgs, null, 2));

  const issueFolder = actualArgs.issueFolder;
  const maxAttempts = actualArgs.maxAttempts || 3;
  const generateMissingData = actualArgs.generateMissingData || true;
  let userPrompt = actualArgs.prompt || actualArgs.userPrompt || 'Perform comprehensive OCV analysis';

  logEvent('INFO', 'ocv-analysis', 'Extracted arguments - generateMissingData', generateMissingData);

  // If query is provided, try to extract parameters from it
  if (actualArgs.query) {
    const query = String(actualArgs.query);
    console.log(`[MCP] Original query: "${query}"`);
    logEvent('DEBUG', 'ocv-analysis', 'Processing query', { query });

    // Look for specific issue folder in query
    const issueFolderMatch = query.match(/issue[_-]?(\w+)/i);
    if (issueFolderMatch && !issueFolder) {
      actualArgs.issueFolder = `issue_${issueFolderMatch[1]}`;
    }

    // Extract user prompt from query
    userPrompt = query.trim();
  }

  console.log(`[MCP] Final values - issueFolder: "${issueFolder}", maxAttempts: ${maxAttempts}, generateMissingData: ${generateMissingData}`);
  logEvent('INFO', 'ocv-analysis', 'Final extracted values', { issueFolder, maxAttempts, generateMissingData, userPrompt });

  try {
    const ocvLogsDir = path.resolve(process.cwd(), 'ocv_logs');
    const analysisOutputDir = path.resolve(process.cwd(), 'ocv_analysis_output');

    // Clean and create analysis output directory
    if (fs.existsSync(analysisOutputDir)) {
      fs.rmSync(analysisOutputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(analysisOutputDir, { recursive: true });

    if (!fs.existsSync(ocvLogsDir)) {
      fs.mkdirSync(ocvLogsDir, { recursive: true });
    }

    // Find all session folders in ocv_logs
    const sessionFolders = fs.readdirSync(ocvLogsDir).filter(f =>
      fs.statSync(path.join(ocvLogsDir, f)).isDirectory() && f.startsWith('session_')
    );

    logEvent('INFO', 'ocv-analysis', `Found ${sessionFolders.length} session folders in OCV logs directory: ${ocvLogsDir}`);

    let issueFolders: { session: string; issue: string }[] = [];

    for (const session of sessionFolders) {
      const sessionPath = path.join(ocvLogsDir, session);
      console.log('Session path:', sessionPath);
      // Always iterate through all issue folders in this session
      const issues = fs.readdirSync(sessionPath).filter(f =>
        fs.statSync(path.join(sessionPath, f)).isDirectory() && f.startsWith('issue_')
      );
      for (const issue of issues) {
        issueFolders.push({ session, issue });
      }
    }

    console.log(`[MCP] Found ${issueFolders.length} issue folders to analyze`);
    logEvent('INFO', 'ocv-analysis', 'Found issue folders', {
      folderCount: issueFolders.length,
      folders: issueFolders,
      analysisOutputDir
    });

    // Return immediately to avoid timeout, process in background
    setImmediate(async () => {
      console.log(`[MCP] Starting background OCV analysis of ${issueFolders.length} issues`);
      logEvent('INFO', 'ocv-analysis', 'Starting background analysis', {
        folderCount: issueFolders.length
      });

      // Clear any previous issue error info from the global array
      issueErrorInfoArr.length = 0;

      const analysisResults: any[] = [];

      for (const { session, issue } of issueFolders) {
        try {
          console.log(`[MCP] Analyzing issue folder: ${issue} in session: ${session}`);
          logEvent('INFO', 'ocv-analysis', 'Starting issue analysis', { session, issue });

          const issuePath = path.join(ocvLogsDir, session, issue);
          const sessionOutputDir = path.join(analysisOutputDir, session);
          fs.mkdirSync(sessionOutputDir, { recursive: true });
          const issueAnalysis = await analyzeIssueFolder(
            issuePath,
            issue,
            maxAttempts,
            generateMissingData,
            sessionOutputDir
          );
          analysisResults.push({ session, ...issueAnalysis });

          logEvent('INFO', 'ocv-analysis', 'Issue analysis completed', {
            session,
            issue,
            reproStatus: issueAnalysis.reproduced,
            pythonCodesFound: issueAnalysis.pythonCodes.length
          });

        } catch (error) {
          console.error(`[MCP] Error analyzing issue ${issue} in session ${session}:`, error);
          logEvent('ERROR', 'ocv-analysis', 'Issue analysis failed', {
            session,
            issue,
            error: error instanceof Error ? error.message : error
          });

          analysisResults.push({
            session,
            issueFolder: issue,
            error: error instanceof Error ? error.message : String(error),
            reproduced: false,
            rootCause: 'Analysis failed',
            pythonCodes: [],
            missingDependencies: [],
            generatedDatasets: []
          });
        }
      }

      // Generate comprehensive Excel report
      try {
        await generateExcelReport(analysisResults, analysisOutputDir);
        logEvent('INFO', 'ocv-analysis', 'Excel report generated', {
          outputDir: analysisOutputDir,
          totalIssues: analysisResults.length
        });
      } catch (error) {
        console.error(`[OCV] Error generating Excel report:`, error);
        logEvent('ERROR', 'ocv-analysis', 'Excel report generation failed', {
          error: error instanceof Error ? error.message : error
        });
      }

      // Generate summary CSV
      try {
        await generateSummaryCsv(issueFolders, ocvLogsDir, analysisOutputDir);
      } catch (error) {
        console.error(`[OCV] Error generating summary CSV:`, error);
        logEvent('ERROR', 'ocv-analysis', 'Summary CSV generation failed', {
          error: error instanceof Error ? error.message : error
        });
      }

      console.log(`[MCP] Background OCV analysis completed: ${analysisResults.length} issues analyzed`);
      logEvent('INFO', 'ocv-analysis', 'Background analysis completed', {
        totalIssues: analysisResults.length,
        successfulAnalyses: analysisResults.filter(r => !r.error).length,
        failedAnalyses: analysisResults.filter(r => r.error).length,
        outputDir: analysisOutputDir
      });
    }); // end setImmediate

    const resultMessage = `Started background OCV analysis of ${issueFolders.length} issue folders. Analysis includes: issue parsing, Python code extraction, execution testing, root cause analysis, and Excel report generation. Output directory: ${analysisOutputDir}`;

    logEvent('INFO', 'ocv-analysis', 'Handler completed - background analysis started', {
      folderCount: issueFolders.length,
      analysisOutputDir,
      userPrompt
    });

    return {
      content: [
        { type: 'text' as const, text: resultMessage }
      ]
    };

  } catch (error) {
    logEvent('ERROR', 'ocv-analysis', 'Handler failed', {
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
};

function analyzeMissingDependencies(errorMessage: string): string[] {
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

function isCodeDirectlyExecutable(code: string): boolean {
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

async function generateFixedCode(
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

async function generateMissingDataset(
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
    if (fileExt === '.json') {
      // Parse, append id, and re-stringify
      try {
        let jsonObj = JSON.parse(dataContent);
        jsonObj.id = 1;
        dataContent = JSON.stringify(jsonObj, null, 2);
      } catch (e) {
        // If parsing fails, fallback to original content
      }
    }
    fs.writeFileSync(dataFilePath, dataContent, 'utf8');

    console.log(`[OCV] Generated synthetic dataset: ${missingFilename} (${dataContent.length} chars)`);
    logEvent('INFO', 'ocv-analysis', 'Synthetic dataset generated', {
      filename: missingFilename,
      size: dataContent.length,
      fileType: fileExt
    });

    // If JSON, run visualization workflow
    if (fileExt === '.json') {
      await processGeneratedJsonForVisualization(dataFilePath, outputDir);
    }

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

async function testPythonCodeExecution(

  codeBlock: any,
  index: number,
  outputDir: string,
  maxAttempts: number,
  generateMissingData: boolean,
  issueFolder: string,
  analysisOutputDir: string
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
    generatedScreenshots: [] as string[],
    renderable: true
  };

  const codeFileName = `code_block_${index}.py`;
  const codeFilePath = path.join(outputDir, codeFileName);

  // Save original code
  fs.writeFileSync(codeFilePath, codeBlock.code);
  result.workingCode = codeBlock.code;

  // Always attempt to run the code, even if not directly executable, to capture real Python errors

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
        // Instead of throwing, save the error to result.error and break to capture in summary
        result.error = `Execution error: ${stderr}`;
        result.success = false;
        // Optionally, you can break or continue based on your retry logic; here, break to record the error
        break;
      }

      // Check for generated files
      const filesAfter = fs.readdirSync(outputDir);
      const newFiles = filesAfter.filter(f => !fs.existsSync(path.join(outputDir, f)) || f === codeFileName);
      result.outputFiles = newFiles.filter(f => f !== codeFileName);

      // After successful execution, process any generated JSON files for visualization
      for (const file of filesAfter) {
        if (file.endsWith('.json')) {
          const jsonPath = path.join(outputDir, file);
          // Optionally, skip if this is a known non-dataset JSON (e.g., conversation.json)
          if (!file.startsWith('parsed_json') && fs.existsSync(jsonPath)) {
            const generatedScreenshots = await processGeneratedJsonForVisualization(jsonPath, issueFolder, analysisOutputDir);
            if (generatedScreenshots && generatedScreenshots.length > 0) {
              result.generatedScreenshots.push(...generatedScreenshots);
            }
          }
        }
      }

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
            const fixedCode = await generateFixedCode(result.workingCode, errorMessage, missingDeps);
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
            const datasetInfo = await generateMissingDataset(result.workingCode, errorMessage, outputDir);
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

async function performRootCauseAnalysis(

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

async function generateRecommendations(

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

async function copyRelevantFiles(sourcePath: string, targetPath: string): Promise<void> {
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

async function analyzeIssueFolder(

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

  // Track errors, missing deps, and LLM-created deps for this issue
  const errorTraces: string[] = [];
  let hasMissingDeps = false;
  let llmCreatedDeps = false;


  try {
    // Find screenshots
    const files = fs.readdirSync(issuePath);
    analysisResult.screenshots = files.filter(f => /\.(png|jpg|jpeg|gif|bmp)$/i.test(f));

    // Read conversation JSON
    const conversationFile = files.find(f => f.startsWith('parsed_json') && f.endsWith('.json'));
    const conversationPath = conversationFile ? path.join(issuePath, conversationFile) : path.join(issuePath, 'conversation.json');
    logEvent('DEBUG', 'ocv-analysis', 'Conversation file path', conversationPath);
    if (!fs.existsSync(conversationPath)) {
      logEvent('ERROR', 'ocv-analysis', 'Conversation file not found', {
        issueFolder,
        conversationPath
      });
      return analysisResult;
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
        codeBlock,
        i,
        issueOutputDir,
        maxAttempts,
        generateMissingData,
        issueFolder,
        outputDir
      );

      analysisResult.executionResults.push(executionResult);

      // Track error traces for issueErrorInfoArr
      if (executionResult.error) {
        errorTraces.push(executionResult.error);
      }

      // Track missing dependencies for issueErrorInfoArr
      if (executionResult.missingDependencies && executionResult.missingDependencies.length > 0) {
        hasMissingDeps = true;
      }

      // Track if LLM created any missing dep (by checking generatedDataset or workingCode changed)
      if (executionResult.generatedDataset || (executionResult.workingCode && executionResult.workingCode !== codeBlock.code)) {
        llmCreatedDeps = true;
      }

      if (executionResult.success) {
        analysisResult.reproduced = true;
      }

      if (executionResult.missingDependencies) {
        analysisResult.missingDependencies.push(...executionResult.missingDependencies);
      }

      if (executionResult.generatedDataset) {
        analysisResult.generatedDatasets.push(executionResult.generatedDataset);
      }

      // Collect generated screenshots
      if (executionResult.generatedScreenshots && executionResult.generatedScreenshots.length > 0) {
        // Add generated screenshots to the main screenshots list with relative paths for better readability
        const relativeScreenshots = executionResult.generatedScreenshots.map((screenshotPath: string) => {
          const relativePath = path.relative(outputDir, screenshotPath);
          return relativePath || path.basename(screenshotPath);
        });
        analysisResult.screenshots.push(...relativeScreenshots);
      }
    }

    // Save error/dependency/LLM info for this issue to the module-level array
    issueErrorInfoArr.push({
      issueId: issueFolder.replace(/^issue_/, ''),
      errors: errorTraces,
      hasMissingDependencies: hasMissingDeps,
      llmCreatedDeps: llmCreatedDeps
    });

    // Perform root cause analysis using LLM
    analysisResult.rootCause = await performRootCauseAnalysis(
      analysisResult,
      conversationData
    );

    // Generate recommendations
    analysisResult.recommendations = await generateRecommendations(
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

function extractPythonCodesFromConversation(conversationData: any): any[] {
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

async function generateExcelReport(analysisResults: any[], outputDir: string): Promise<void> {
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
      'Screenshots (Original + Generated)',
      'Generated Screenshots Count',
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

      // Count generated screenshots
      const generatedScreenshotsCount = result.executionResults?.reduce((sum: number, r: any) =>
        sum + (r.generatedScreenshots?.length || 0), 0) || 0;

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
        generatedScreenshotsCount,
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
        sum + (r.executionResults?.filter((ex: any) => ex.generatedDataset).length || 0), 0),
      totalScreenshots: analysisResults.reduce((sum, r) => sum + (r.screenshots?.length || 0), 0),
      generatedScreenshots: analysisResults.reduce((sum, r) =>
        sum + (r.executionResults?.reduce((exSum: number, ex: any) =>
          exSum + (ex.generatedScreenshots?.length || 0), 0) || 0), 0),
      issuesWithScreenshots: analysisResults.filter(r => r.screenshots?.length > 0).length
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

async function generateSummaryCsv(issueFolders: { session: string; issue: string }[], ocvLogsDir: string, outputDir: string) {
  const csvRows = [['Issue ID', 'Issue Summary', 'Ticket Link', 'Sentiment', 'Python Errors', 'Has Missing Deps', 'LLM Created Deps']];

  // Create a map to store sentiment data by session
  const sessionSentimentMap = new Map<string, any[]>();

  // First, read all sentiment data from all_rows_data.json files
  for (const { session } of issueFolders) {
    if (!sessionSentimentMap.has(session)) {
      const sessionPath = path.join(ocvLogsDir, session);
      const allRowsPath = path.join(sessionPath, 'all_rows_data.json');

      if (fs.existsSync(allRowsPath)) {
        try {
          const allRowsData = JSON.parse(fs.readFileSync(allRowsPath, 'utf8'));
          sessionSentimentMap.set(session, allRowsData);
          console.log(`[OCV] Loaded sentiment data for session ${session}: ${allRowsData.length} rows`);
        } catch (error) {
          console.error(`[OCV] Error reading sentiment data for session ${session}:`, error);
          sessionSentimentMap.set(session, []);
        }
      } else {
        console.log(`[OCV] No all_rows_data.json found for session ${session}`);
        sessionSentimentMap.set(session, []);
      }
    }
  }

  // Track issue index per session to match with sentiment data
  // Note: No longer needed since we're matching by ticketId instead of index

  for (const { session, issue } of issueFolders) {
    const issueId = issue.replace(/^issue_/, '');
    const issuePath = path.join(ocvLogsDir, session, issue);
    const conversationFile = fs.readdirSync(issuePath).find(f => f.startsWith('parsed_json') && f.endsWith('.json'));
    const conversationPath = conversationFile ? path.join(issuePath, conversationFile) : path.join(issuePath, 'conversation.json');
    let issueSummary = '';
    let missingDeps = [];
    let sentiment = 'Unknown';
    let pythonErrors = '';
    let hasMissingDeps = '';
    let llmCreatedDeps = '';

    // Get error/dependency/LLM info for this issue from the tracked array
    const errInfo = issueErrorInfoArr.find(e => e.issueId === issueId);
    if (errInfo) {
      pythonErrors = '"' + errInfo.errors.map(e =>
        e.replace(/[\r\n]+/g, ' ') // flatten to single line
          .replace(/"/g, '""')     // escape double quotes
          .trim()
      ).join(' ||| ') + '"';
      hasMissingDeps = errInfo.hasMissingDependencies ? 'YES' : 'NO';
      llmCreatedDeps = errInfo.llmCreatedDeps ? 'YES' : 'NO';
    }

    // Get sentiment data for this issue by matching ticketId with issueId
    const sessionSentimentData = sessionSentimentMap.get(session) || [];

    // Find the row where ticketId matches the current issueId
    const matchingRow = sessionSentimentData.find(row => {
      // Check if ticketId field exists and matches issueId
      if (row.ticketId && row.ticketId === issueId) {
        return true;
      }
      return false;
    });

    if (matchingRow) {
      sentiment = matchingRow.sentiment || 'Unknown';
      console.log(`[OCV] Issue ${issueId}: found matching ticketId, sentiment = ${sentiment}`);
    } else {
      console.log(`[OCV] Issue ${issueId}: no matching ticketId found in sentiment data (total rows: ${sessionSentimentData.length})`);
      // Log available ticketIds for debugging
      const availableTicketIds = sessionSentimentData
        .map(row => row.ticketId)
        .filter(Boolean)
        .slice(0, 5); // Show first 5 for debugging
      console.log(`[OCV] Available ticketIds in session ${session}:`, availableTicketIds);
    }

    if (fs.existsSync(conversationPath)) {
      try {
        const conversationData = JSON.parse(fs.readFileSync(conversationPath, 'utf8'));
        // Ask LLM for gist
        const prompt = `Summarize the main issue described in this Copilot conversation in approximately 200 words. Be detailed and cover all relevant aspects, including user intent, errors, and context.\n\n${JSON.stringify(conversationData).substring(0, 4000)}`;
        const response = await server.server.createMessage({
          messages: [
            { role: 'user', content: { type: 'text', text: prompt } }
          ],
          maxTokens: 200
        });
        issueSummary = response.content.type === 'text' ? response.content.text : '';
        // Extract missing dependencies if available
        if (conversationData.missingDependencies) {
          missingDeps = conversationData.missingDependencies;
        } else {
          // Optionally, scan messages for missing dependency errors
          const deps = new Set();
          if (conversationData.conversation && conversationData.conversation.messages) {
            for (const msg of conversationData.conversation.messages) {
              if (msg.content && typeof msg.content.text === 'string') {
                const matches = msg.content.text.match(/No module named '([^']+)'/g);
                if (matches) {
                  matches.forEach((m: any) => deps.add(m.replace(/No module named '|'$/g, '')));
                }
              }
            }
          }
          missingDeps = Array.from(deps);
        }
      } catch (e) {
        issueSummary = 'Error summarizing issue';
        missingDeps = [];
      }
    } else {
      issueSummary = 'No conversation file';
      missingDeps = [];
    }
    const ticketLink = `https://copilotdash.microsoft.com/ticket/${issueId}`;
    // Escape newlines and commas in issueSummary to keep CSV columns aligned
    const safeIssueSummary = (issueSummary || '').replace(/\r?\n|\r/g, ' ').replace(/,+/g, ' ').replace(/\s+/g, ' ').trim();
    csvRows.push([
      issueId,
      safeIssueSummary,
      ticketLink,
      sentiment,
      pythonErrors,
      hasMissingDeps,
      llmCreatedDeps
    ]);
  }

  const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const csvPath = path.join(outputDir, 'ocv_summary.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  console.log(`[OCV] Summary CSV generated: ${csvPath}`);
}

// Helper to process a generated JSON for visualization and screenshots
async function processGeneratedJsonForVisualization(jsonPath: string, issueFolder: string, analysisOutputDir?: string): Promise<string[]> {
  const plotlyDir = 'C:/Users/srmukher/Downloads/fluentui-charting-contrib/apps/plotly_examples';
  const srcDataDir = path.join(plotlyDir, 'src', 'data');
  const dataOriginalDir = path.join(plotlyDir, 'src', 'data_original');
  const jsonFileName = path.basename(jsonPath);
  const destJsonPath = path.join(srcDataDir, jsonFileName);

  // Track the dev server process for cleanup
  let devServerProcess: any = null;

  // Helper to check if port 3000 is open (dev server running)
  async function isPortOpen(port: number): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const socket = new net.Socket();

      const timeout = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, 3000); // 3 second timeout

      socket.connect(port, '127.0.0.1', () => {
        clearTimeout(timeout);
        socket.end();
        resolve(true);
      });

      socket.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  // Helper to check if dev server is actually responding with valid content
  async function isDevServerReady(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3000');
      if (!response.ok) {
        return false;
      }

      // Check if the response contains expected content
      const text = await response.text();

      // Look for common patterns that indicate a working React dev server
      const indicators = [
        'react',
        'root',
        'div',
        'html',
        'title',
        'script',
        'Declarative chart',
        'fluentui',
        'Chart Width',
        'data_001.json'
      ];

      // If response is substantial (>500 chars) and contains any indicator, consider it ready
      const hasValidContent = text.length > 500 && indicators.some(indicator =>
        text.toLowerCase().includes(indicator.toLowerCase())
      );

      return hasValidContent;
    } catch {
      return false;
    }
  }

  // 1. Start dev server if not running (idempotent, robust startup)
  try {
    logEvent('DEBUG', 'ocv-analysis', 'Checking if Plotly dev server is running');
    const serverReady = await isDevServerReady();
    if (!serverReady) {
      logEvent('DEBUG', 'ocv-analysis', 'Starting Plotly dev server');

      // Check if yarn is available, fallback to npm
      let packageManager = 'npm';
      let installCmd = 'install';
      let startCmd = 'run start';

      try {
        await execAsync('yarn --version', { cwd: plotlyDir });
        packageManager = 'yarn';
        startCmd = 'start'; // yarn doesn't need 'run'
        logEvent('DEBUG', 'ocv-analysis', 'Using yarn package manager');
      } catch (e) {
        logEvent('DEBUG', 'ocv-analysis', 'Yarn not available, using npm package manager');
      }

      // Install dependencies
      await execAsync(`${packageManager} ${installCmd}`, { cwd: plotlyDir });
      logEvent('DEBUG', 'ocv-analysis', `${packageManager} install completed for Plotly dev server`);

      // Start the dev server in detached mode
      const logPath = path.join(plotlyDir, 'dev-server.log');

      // Clear previous log
      if (fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, '');
      }

      // Use cmd.exe on Windows to properly handle package manager commands
      const isWindows = process.platform === 'win32';
      const command = isWindows ? 'cmd' : packageManager;
      const args = isWindows ? ['/c', `${packageManager} ${startCmd}`] : [startCmd];

      const child = spawn(command, args, {
        cwd: plotlyDir,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Store the process reference for later cleanup
      devServerProcess = child;

      // Handle spawn errors
      child.on('error', (error) => {
        logEvent('ERROR', 'ocv-analysis', 'Error spawning dev server process', {
          error: error.message,
          command,
          args: args.join(' ')
        });
      });

      // Log output to file
      const logStream = fs.createWriteStream(logPath, { flags: 'a' });
      child.stdout?.pipe(logStream);
      child.stderr?.pipe(logStream);

      // Detach the process so it continues running independently
      child.unref();

      logEvent('DEBUG', 'ocv-analysis', `Dev server process started with PID ${child.pid}`);

      // Wait for the server to actually start and be ready
      let waited = 0;
      let started = false;
      const maxWaitTime = 60000; // Increase timeout to 60 seconds
      const checkInterval = 3000; // Check every 3 seconds

      while (waited < maxWaitTime) {
        await new Promise(r => setTimeout(r, checkInterval));
        waited += checkInterval;

        // First check if port is open, then check if server is ready
        const portOpen = await isPortOpen(3000);
        const serverReady = await isDevServerReady();

        logEvent('DEBUG', 'ocv-analysis', `Dev server check: port open=${portOpen}, server ready=${serverReady}, waited=${waited}ms`);

        // If port is open and we've waited a reasonable amount of time, consider it ready
        // This handles cases where the server is serving content but our content check is too strict
        if (portOpen && (serverReady || waited >= 30000)) {
          started = true;
          logEvent('DEBUG', 'ocv-analysis', `Dev server started and ready after ${waited}ms (fallback: ${!serverReady && waited >= 30000})`);
          break;
        }

        // Check if we're getting close to timeout
        if (waited > maxWaitTime * 0.8) {
          logEvent('DEBUG', 'ocv-analysis', `Still waiting for dev server, ${maxWaitTime - waited}ms remaining`);
        }
      }

      if (!started) {
        logEvent('INFO', 'ocv-analysis', 'Dev server did not start within timeout, but process may still be starting');
        // Don't throw error, just log warning and continue - the process might still be starting
        // The dev server will be available for subsequent requests
      }
    } else {
      logEvent('DEBUG', 'ocv-analysis', 'Dev server already running and ready on port 3000');
    }
  } catch (e) {
    logEvent('INFO', 'ocv-analysis', 'Dev server startup encountered an issue, continuing anyway', {
      error: e instanceof Error ? e.message : e
    });
    // Don't throw the error - continue with the process even if dev server startup fails
  }

  // 2. Rename data to data_original if not already done
  if (fs.existsSync(srcDataDir) && !fs.existsSync(dataOriginalDir)) {
    fs.renameSync(srcDataDir, dataOriginalDir);
    logEvent('DEBUG', 'ocv-analysis', 'Renamed data directory to data_original');
  }
  // 3. Create new empty data folder
  if (!fs.existsSync(srcDataDir)) {
    fs.mkdirSync(srcDataDir, { recursive: true });
    logEvent('DEBUG', 'ocv-analysis', 'Created new data directory');
  }
  // 4. Copy JSON to data
  fs.copyFileSync(jsonPath, destJsonPath);
  logEvent('DEBUG', 'ocv-analysis', `Copied JSON to data directory: ${destJsonPath}`);

  // Wait for dev server to be ready before taking screenshots
  logEvent('DEBUG', 'ocv-analysis', 'Waiting for dev server to be ready for screenshots');
  let serverReady = false;
  const maxRetries = 10;

  for (let i = 0; i < maxRetries; i++) {
    const portOpen = await isPortOpen(3000);
    const contentReady = await isDevServerReady();

    // Consider ready if port is open and either content check passes OR we've tried enough times
    if (portOpen && (contentReady || i >= 3)) {
      serverReady = true;
      logEvent('DEBUG', 'ocv-analysis', `Dev server ready for screenshots after ${i + 1} attempts (content check: ${contentReady})`);
      break;
    }
    await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds between checks
  }

  if (!serverReady) {
    logEvent('ERROR', 'ocv-analysis', 'Dev server not ready for screenshots, skipping visualization');
    return []; // Skip screenshot taking if server is not ready
  }

  // 6. Use Playwright to refresh and take screenshots
  logEvent('DEBUG', 'ocv-analysis', 'Taking screenshots of charts using Playwright');
  const generatedScreenshots: string[] = [];

  try {
    // Playwright is already installed in plotly_examples according to package.json
    logEvent('DEBUG', 'ocv-analysis', 'Using pre-installed Playwright from plotly_examples');

    // Get the base name of the issue folder for consistent naming
    const issueFolderName = path.basename(issueFolder);
    // Use the provided analysis output directory or fallback to process.cwd() based path
    const outputBase = analysisOutputDir || path.resolve(process.cwd(), 'ocv_analysis_output');
    const screenshotDir = path.join(outputBase, issueFolderName);
    logEvent('DEBUG', 'ocv-analysis', `Screenshot directory: ${screenshotDir}`);
    // Ensure screenshot directory exists
    fs.mkdirSync(screenshotDir, { recursive: true });

    const img_path_decl = path.join(screenshotDir, `${jsonFileName.split('.json')[0]}_declarative.png`);
    const img_path_plotly = path.join(screenshotDir, `${jsonFileName.split('.json')[0]}_plotly.png`);

    // Track the screenshot paths
    generatedScreenshots.push(img_path_decl, img_path_plotly);

    // Use playwright from the plotly_examples directory where it's installed
    const playwrightScript = `
      const { chromium } = require('@playwright/test');
      const path = require('path');
      
      (async () => {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        page.setDefaultTimeout(30000);
        
        try {
          await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
          console.log('Successfully loaded dev server page');
          
          await page.waitForTimeout(5000);
          
          // Screenshot declarative chart using correct test ID
          try {
            const chart1 = await page.$('[data-testid="chart-container"]');
            if (chart1) {
              await chart1.screenshot({ path: '${img_path_decl.replace(/\\/g, '/')}' });
              console.log('Screenshot taken for declarative chart at: ${img_path_decl}');
            } else {
              console.log('Declarative chart container not found');
            }
          } catch (err) {
            console.error('Error taking declarative chart screenshot:', err.message);
          }
          
          // Screenshot plotly chart using correct test ID
          try {
            const chart2 = await page.$('[data-testid="plotly-plot"]');
            if (chart2) {
              await chart2.screenshot({ path: '${img_path_plotly.replace(/\\/g, '/')}' });
              console.log('Screenshot taken for plotly chart at: ${img_path_plotly}');
            } else {
              console.log('Plotly chart container not found');
            }
          } catch (err) {
            console.error('Error taking plotly chart screenshot:', err.message);
          }
          
        } catch (err) {
          console.error('Error loading dev server page:', err.message);
        } finally {
          await browser.close();
        }
      })().catch(console.error);
    `;

    // Write the script to a temporary file
    const scriptPath = path.join(plotlyDir, 'screenshot-temp.js');
    fs.writeFileSync(scriptPath, playwrightScript);

    try {
      // Execute the playwright script from the plotly_examples directory
      await execAsync(`node screenshot-temp.js`, { cwd: plotlyDir, timeout: 60000 });
      logEvent('DEBUG', 'ocv-analysis', 'Screenshots taken successfully');
    } catch (err) {
      logEvent('ERROR', 'ocv-analysis', 'Error taking screenshots with Playwright', {
        error: err instanceof Error ? err.message : err
      });
    } finally {
      // Clean up the temporary script
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
      }

      // Close the dev server process after screenshots are taken
      if (devServerProcess && devServerProcess.pid) {
        try {
          // Kill the process tree (including child processes)
          if (process.platform === 'win32') {
            // On Windows, use taskkill to kill the process tree
            await execAsync(`taskkill /pid ${devServerProcess.pid} /T /F`);
          } else {
            // On Unix-like systems, kill the process group
            process.kill(-devServerProcess.pid, 'SIGTERM');
          }
          logEvent('DEBUG', 'ocv-analysis', `Terminated dev server process with PID ${devServerProcess.pid}`);
        } catch (killError) {
          logEvent('DEBUG', 'ocv-analysis', 'Error terminating dev server process', {
            pid: devServerProcess.pid,
            error: killError instanceof Error ? killError.message : killError
          });
        }
      }
    }

  } catch (err) {
    logEvent('ERROR', 'ocv-analysis', 'Error with Playwright setup', {
      error: err instanceof Error ? err.message : err
    });
  }

  // 7. Delete JSON from data
  fs.unlinkSync(destJsonPath);
  logEvent('DEBUG', 'ocv-analysis', `Deleted JSON from data directory: ${destJsonPath}`);

  // 8. Optional: Clean up any remaining dev server processes if they were started by this function
  // This is a safety measure in case the cleanup in the try-catch didn't work
  if (devServerProcess && devServerProcess.pid) {
    setTimeout(async () => {
      try {
        // Double-check if process is still running and kill it
        if (process.platform === 'win32') {
          await execAsync(`taskkill /pid ${devServerProcess.pid} /F`);
        } else {
          process.kill(devServerProcess.pid, 'SIGTERM');
        }
        logEvent('DEBUG', 'ocv-analysis', `Final cleanup: terminated dev server process ${devServerProcess.pid}`);
      } catch (error) {
        // Process might already be terminated, which is fine
        logEvent('DEBUG', 'ocv-analysis', 'Dev server process already terminated or not found');
      }
    }, 5000); // Wait 5 seconds to ensure screenshots are fully complete
  }

  // Return the paths of successfully generated screenshots
  return generatedScreenshots.filter(screenshotPath => fs.existsSync(screenshotPath));
}
