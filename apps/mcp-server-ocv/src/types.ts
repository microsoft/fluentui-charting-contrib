/**
 * Types and interfaces for the MCP server components
 */

export interface ParsedResponse {
  content: any;
  issueId: string;
  savedFiles: string[];
}

export interface ToolResult {
  content?: any;
  result?: any;
  value?: any;
  text?: string;
  data?: any;
  output?: any;
  response?: {
    content?: any;
    text?: string;
    result?: any;
  };
}

export interface MCPClientConfig {
  name: string;
  version: string;
  capabilities?: {
    [key: string]: any;
  };
}

export interface TransportConfig {
  command: string;
  args: string[];
}
