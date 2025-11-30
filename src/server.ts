// Load environment variables from .env file FIRST, before any other imports
import "dotenv/config";

import express from "express";
import cors from "cors";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./index.js";
import { validateEnvVars } from "./lib/env.js";

// Validate environment variables on startup
try {
  validateEnvVars();
} catch (error) {
  console.error("Environment validation failed:", error);
  process.exit(1);
}

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

app.use(express.json());

// Health check endpoint
app.get("/health", (_req: express.Request, res: express.Response) => {
  res.json({ status: "ok", service: "crac-mcp" });
});

// Create MCP server instance (reused across requests)
const mcpServer = createMcpServer();

// MCP endpoint
app.all("/mcp", async (req: express.Request, res: express.Response) => {
  // In stateless mode, create a new transport for each request to prevent
  // request ID collisions. Different clients may use the same JSON-RPC request IDs,
  // which would cause responses to be routed to the wrong HTTP connections if
  // the transport state is shared.

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
    });

    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

const PORT = parseInt(process.env.PORT || "3000", 10);

app
  .listen(PORT, () => {
    console.log(`MCP Server running on http://localhost:${PORT}/mcp`);
  })
  .on("error", (error: Error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
