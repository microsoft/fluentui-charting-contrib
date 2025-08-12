import fs from 'fs';
import path from 'path';
import { logEvent } from './utils.js';
import { mcpServerInstance } from './index.js';

export class ResponseHandler {
    private sessionDir?: string;
    private issueDir?: string;

    setSessionDir(sessionDir: string): void {
        this.sessionDir = sessionDir;
    }
    setSessionIssueDir(sessionDir: string, issueDir?: string): void {
        this.sessionDir = sessionDir;
        this.issueDir = issueDir;
    }

    /**
     * Robust JSON parsing with multiple fallback strategies
     */
    async tryParseJSON(jsonStr: string, sessionDir?: string): Promise<any> {
        const strategies = [
            // Try to find valid JSON by looking for balanced braces
            () => {
                let braceCount = 0;
                let validEnd = -1;
                for (let i = 0; i < jsonStr.length; i++) {
                    if (jsonStr[i] === '{') braceCount++;
                    else if (jsonStr[i] === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                            validEnd = i;
                            break;
                        }
                    }
                }
                if (validEnd !== -1) {
                    const validJson = jsonStr.substring(0, validEnd + 1);
                    return JSON.parse(validJson);
                }
                throw new Error('No balanced JSON found');
            }
        ];

        for (let i = 0; i < strategies.length; i++) {
            var rowParsing = false;
            try {
                const result = strategies[i]();
                // save the content from the result
                let content: any = null;
                if (result && typeof result === 'object' && result.content) {
                    logEvent('DEBUG', 'response-handler', `JSON content present.`);
                    content = JSON.parse(result.content);
                } else if (result && typeof result === 'object' && result.rows) {
                    logEvent('DEBUG', 'response-handler', `JSON rows present.`);
                    content = result.rows;
                    rowParsing = true; // Indicate that we are processing rows
                } else if (result && typeof result === 'object' && result.clicked && result.src) {
                    logEvent('DEBUG', 'response-handler', `JSON clicked image present.`);
                    content = result;
                } else if (result && typeof result === 'object' && result.clicked && result.url) {
                    return result;
                }
                else {
                    logEvent('DEBUG', 'response-handler', `No content key found in result.`);
                }
                if (content !== null) {
                    logEvent('DEBUG', 'response-handler', `JSON parse succeeded with strategy ${i + 1}`);
                    return await this.processSuccessfulParsing(content, sessionDir, rowParsing);
                }
            } catch (error) {
                logEvent('DEBUG', 'response-handler', `JSON parse strategy ${i + 1} failed: ${error}`);
                continue;
            }
        }

        logEvent('DEBUG', 'response-handler', 'All JSON parse strategies failed');
        return null;
    }

    /**
     * Process successfully parsed JSON content
     */
    private async processSuccessfulParsing(content: any, sessionDir?: string, rowsParsing?: boolean): Promise<any> {
        // Save the successfully parsed JSON to a file
        try {
            // Use session directory if provided, otherwise fall back to default
            const outputDir = sessionDir || path.join(process.cwd(), 'dashboard_issues_agent');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            if (rowsParsing) {
                // logEvent('DEBUG', 'response-handler', `Processing rows parsing, skipping issue ID extraction.`);
                // const jsonFile = path.join(outputDir, `parsed_json_rows_${timestamp}.json`);
                //     fs.writeFileSync(jsonFile, JSON.stringify(content, null, 2), 'utf8');
                //     logEvent('DEBUG', 'response-handler', `Successfully parsed JSON saved to: ${jsonFile}`);
            } else if (content && content.src) {
                logEvent('DEBUG', 'response-handler', `Processing clicked image, saving to session directory.`);
                const imageFile = path.join(outputDir, `image_${timestamp}.png`);
                const imageBuffer = Buffer.from(content.src.split(',')[1], 'base64');
                fs.writeFileSync(imageFile, imageBuffer);
                logEvent('DEBUG', 'response-handler', `Image saved to: ${imageFile}`);
            } else {
                logEvent('DEBUG', 'response-handler', `Processing standard JSON parsing, extracting issue ID.`);
                // const issueDir = path.join(outputDir, `issue_${this.issueId}`);
                if (!fs.existsSync(this.issueDir!)) {
                    fs.mkdirSync(this.issueDir!, { recursive: true });
                }

                const jsonFile = path.join(this.issueDir!, `parsed_json_${timestamp}.json`);
                fs.writeFileSync(jsonFile, JSON.stringify(content, null, 2), 'utf8');
                logEvent('DEBUG', 'response-handler', `Successfully parsed JSON saved to: ${jsonFile}`);

                // Download all assets asynchronously
                this.downloadAssets(content, this.issueDir!);

            }

            return content;
        } catch (saveError) {
            logEvent('DEBUG', 'response-handler', `Failed to save parsed JSON to file: ${saveError}`);
            return content;
        }
    }

    /**
     * Download all assets found in the content
     */
    private async downloadAssets(content: any, issueDir: string): Promise<void> {
        try {
            const fetch = (await import('node-fetch')).default;
            const urls = this.findUrls(content);
            logEvent('DEBUG', 'response-handler', `Found URLs in JSON: ${urls.length}`);

            for (const url of urls) {
                try {
                    let fileUrl = url;
                    // Handle base64 images
                    if (/^data:image\/(png|jpeg|jpg|gif|bmp);base64,/.test(fileUrl)) {
                        await this.saveBase64Image(fileUrl, issueDir);
                        continue;
                    }

                    // If relative, skip or handle as needed
                    if (!/^https?:\/\//i.test(fileUrl)) {
                        logEvent('DEBUG', 'response-handler', `Skipping non-HTTP URL: ${fileUrl}`);
                        continue;
                    }

                    await this.downloadHttpResource(fileUrl, issueDir);
                } catch (err) {
                    logEvent('ERROR', 'response-handler', `Failed to download URL: ${url}`, {
                        error: err instanceof Error ? err.message : err
                    });
                }
            }
        } catch (error) {
            logEvent('ERROR', 'response-handler', `Error in downloadAssets: ${error}`);
        }
    }

    /**
     * Find all URLs in the content object
     */
    private findUrls(obj: any, urls: string[] = []): string[] {
        if (Array.isArray(obj)) {
            obj.forEach(item => this.findUrls(item, urls));
        } else if (obj && typeof obj === 'object') {
            for (const key of Object.keys(obj)) {
                if (key.toLowerCase() === 'url' && typeof obj[key] === 'string') {
                    urls.push(obj[key]);
                } else {
                    this.findUrls(obj[key], urls);
                }
            }
        }
        return urls;
    }

    /**
     * Save base64 encoded image
     */
    private async saveBase64Image(dataUrl: string, issueDir: string): Promise<void> {
        const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|gif|bmp);base64,(.*)$/);
        if (match) {
            const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
            const base64Data = match[2];
            const filename = `image_${Date.now()}.${ext}`;
            const filePath = path.join(issueDir, filename);
            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
            logEvent('DEBUG', 'response-handler', `Saved base64 image: ${filePath}`);
        }
    }

    /**
     * Download HTTP resource
     */
    private async downloadHttpResource(url: string, issueDir: string): Promise<void> {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Try to get filename from URL or fallback
        let filename = path.basename(new URL(url).pathname);
        if (!filename) filename = `downloaded_${Date.now()}`;

        const filePath = path.join(issueDir, filename);
        const buffer = await res.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));
        logEvent('DEBUG', 'response-handler', `Downloaded URL: ${url} -> ${filePath}`);
    }

    /**
     * Process playwright tool result with LLM conversion and fallback parsing
     */
    async processToolResult(result: any, toolName: string): Promise<any> {
        // Check if the result contains an error in the content
        if (result.content && Array.isArray(result.content) && result.content.length > 0) {
            const firstContent = result.content[0];
            if (firstContent && firstContent.type === 'text' && firstContent.text) {
                // Check if the text content indicates an error
                const errorPatterns = ['not found', 'error', 'failed', 'unable to'];
                const contentText = firstContent.text.toLowerCase();
                const hasError = errorPatterns.some(pattern => contentText.includes(pattern));

                let parsed;
                try {
                    const raw = firstContent.text;
                    const jsonStart = raw.indexOf('{');
                    const jsonEnd = raw.lastIndexOf('}');


                    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                        const jsonStr = raw.substring(jsonStart, jsonEnd + 1);
                        logEvent('DEBUG', 'response-handler', `Tool raw result: ${raw}`);
                        logEvent('DEBUG', 'response-handler', `Tool JSON substring: ${jsonStr}`);
                        logEvent('DEBUG', 'response-handler', `JSON contains content: ${jsonStr.includes('"content"')}`);

                        // const raw_parsed = await this.tryLLMConversion(raw).then((result) => {
                        //     logEvent('DEBUG', 'response-handler', `Tool raw parsed result by Sampling: ${result}`);
                        // });

                        if (jsonStr.includes('"rows"')) {
                            // Parse and process rows array of JSON objects
                            const parsedObj = await this.tryParseJSON(jsonStr, this.sessionDir);
                            if (parsedObj && Array.isArray(parsedObj.rows)) {
                                // Optionally, process each row if needed (e.g., filter/map)
                                return parsedObj.rows;
                            }
                            return parsedObj;
                        } else if (jsonStr.includes('"content"')) {
                            parsed = await this.tryLLMConversion(jsonStr) || await this.tryParseJSON(jsonStr, this.sessionDir);
                        } else if (jsonStr.includes('"clicked"') && jsonStr.includes('"src"')) {
                            parsed = await this.tryParseJSON(jsonStr, this.sessionDir);
                        } else if (jsonStr.includes('"clicked"') && jsonStr.includes('"url"')) {
                            return await this.tryParseJSON(jsonStr, this.sessionDir);
                        } else {
                            // No content key, try direct JSON parse
                            parsed = await this.tryParseJSON(jsonStr, this.sessionDir);
                        }
                    }
                } catch (error) {
                    parsed = null;
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    logEvent('DEBUG', 'response-handler', `Tool parse failed with error: ${errorMessage}`);

                    // Additional fallback: try to extract any JSON-like content from the raw text
                    if (firstContent.text) {
                        parsed = this.tryFallbackJSONExtraction(firstContent.text);
                    }
                }

                if (hasError) {
                    console.warn(`[ResponseHandler] Tool result contains error: ${firstContent.text}`);
                    throw new Error(`Tool execution failed: ${firstContent.text}`);
                }

                // If parsed is an array of objects (rows), return it
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
                    return parsed;
                }

                // Return the actual content for successful results
                return firstContent.text;
            }
        }

        // Return the raw result if it doesn't match the expected content structure
        return result.content || result;
    }

    /**
     * Try to convert response using LLM
     */
    private async tryLLMConversion(jsonStr: string): Promise<any> {
        try {
            // Add timeout wrapper with proper error handling
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('LLM sampling timeout')), 30000); // 30 second timeout
            });

            const llmPromise = mcpServerInstance.server.createMessage({
                messages: [
                    { role: 'user', content: { type: 'text', text: `Convert the following string into JSON format. \n\n${jsonStr}` } }
                ],
                maxTokens: 2000
            });

            const converted = await Promise.race([llmPromise, timeoutPromise]).then(res => {
                if (res && typeof res === 'object' && 'text' in res) {
                    logEvent('DEBUG', 'response-handler', `Tool converted result: ${res}`);
                    const jsonMatch = (res.text as string).match(/```json\s*([\s\S]*?)```/);
                    if (jsonMatch) {
                        const jsonString = jsonMatch[1];
                        const parsed = JSON.parse(jsonString);
                        logEvent('DEBUG', 'response-handler', `Tool parsed result: ${parsed}`);
                        return parsed;
                    }
                }
                return null;
            }).catch(error => {
                logEvent('DEBUG', 'response-handler', `LLM sampling failed: ${error}`);
                return null;
            });

            return converted;
        } catch (llmError) {
            logEvent('DEBUG', 'response-handler', `LLM sampling error: ${llmError}, falling back to direct parse`);
            return null;
        }
    }

    /**
     * Try to extract JSON from text using regex
     */
    private tryFallbackJSONExtraction(text: string): any {
        try {
            // Look for any JSON object in the text
            const jsonRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
            const matches = text.match(jsonRegex);
            if (matches && matches.length > 0) {
                // Try to parse the largest JSON-like string
                const largestMatch = matches.reduce((longest: string, current: string) =>
                    current.length > longest.length ? current : longest
                );
                const parsed = JSON.parse(largestMatch);
                logEvent('DEBUG', 'response-handler', `Fallback JSON parse succeeded with: ${largestMatch}`);
                return parsed;
            }
        } catch (fallbackError) {
            logEvent('DEBUG', 'response-handler', `Fallback JSON parse also failed: ${fallbackError}`);
        }
        return null;
    }

    /**
     * Extract string value from various result formats
     */
    extractStringFromResult(result: any): string {
        if (typeof result === 'string') {
            return result;
        }

        if (result && typeof result === 'object') {
            // Handle MCP client result structure first
            if (result.content && Array.isArray(result.content) && result.content.length > 0) {
                const firstContent = result.content[0];
                if (firstContent && typeof firstContent === 'object' && firstContent.text) {
                    return firstContent.text;
                }
                if (typeof firstContent === 'string') {
                    return firstContent;
                }
            }

            // Try different possible properties where the string value might be stored
            const possiblePaths = [
                result.content?.text,
                result.content,
                result.result,
                result.value,
                result.text,
                result.data,
                result.output,
                result.response?.content,
                result.response?.text,
                result.response?.result,
                result.returnValue,
                result.evaluation,
                result.evaluationResult
            ];

            for (const path of possiblePaths) {
                if (typeof path === 'string' && path.length > 0) {
                    return path;
                }
            }

            // If it's an array, try to get the first string element
            if (Array.isArray(result) && result.length > 0) {
                for (const item of result) {
                    const extracted = this.extractStringFromResult(item);
                    if (extracted) return extracted;
                }
            }

            // Try to find any string property in the object
            const allValues = Object.values(result);
            for (const value of allValues) {
                if (typeof value === 'string' && value.length > 0) {
                    return value;
                }
            }

            // Check for nested objects
            for (const value of allValues) {
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    const nestedResult = this.extractStringFromResult(value);
                    if (nestedResult) return nestedResult;
                }
            }

            // Last resort: try to convert to string but avoid [object Object]
            const stringResult = String(result);
            if (stringResult !== '[object Object]' && stringResult !== 'undefined' && stringResult !== 'null') {
                return stringResult;
            }
        }

        return '';
    }

    /**
     * Extract array value from various result formats
     */
    extractArrayFromResult(result: any): any[] {
        if (Array.isArray(result)) {
            return result;
        }

        if (result && typeof result === 'object') {
            // Handle MCP client result structure first
            if (result.content && Array.isArray(result.content)) {
                return result.content;
            }

            // Try different possible properties where the array value might be stored
            const possiblePaths = [
                result.content,
                result.result,
                result.value,
                result.data,
                result.output,
                result.response?.content,
                result.response?.result
            ];

            for (const path of possiblePaths) {
                if (Array.isArray(path)) {
                    return path;
                }
            }

            // Try to find an array property in the result object
            const values = Object.values(result);
            const arrayValue = values.find(v => Array.isArray(v));
            if (arrayValue) {
                return arrayValue as any[];
            }
        }

        return [];
    }
}

// Export a singleton instance
export const responseHandler = new ResponseHandler();
