// MCP Server Entry Point
// Starts the Newsletter AI MCP server for Claude Code integration

import { startMCPServer } from "./server.js";

startMCPServer().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
