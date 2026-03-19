#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerDivinationTools } from "./tools/divination.js";

// Initialize server
const server = new McpServer({
  name: "qimen-mcp-server",
  version: "1.0.0"
});

// Register all tools
registerDivinationTools(server);

// Start server on stdio
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Qimen/Meihua MCP server running on stdio");
  } catch (error) {
    console.error("Fatal error starting MCP server:", error);
    process.exit(1);
  }
}

main();
