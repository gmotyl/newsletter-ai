import { startMCPServer } from "./mcp/server.js";

startMCPServer().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
