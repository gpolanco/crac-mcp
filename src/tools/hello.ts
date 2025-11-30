/**
 * Hello tool
 * Simple greeting tool for testing
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const inputSchema = z.object({
  name: z.string().describe("Name to greet"),
});

/**
 * Registers the hello tool with the MCP server
 *
 * @param server - The MCP server instance
 */
export function registerHelloTool(server: McpServer): void {
  server.registerTool(
    "hello",
    {
      title: "Hello Tool",
      description: "Say hello to someone",
      inputSchema: inputSchema.shape,
    },
    async (args: any) => {
      const { name } = args;
      return {
        content: [
          {
            type: "text",
            text: `Hello, ${name}!`,
          },
        ],
      };
    }
  );
}

