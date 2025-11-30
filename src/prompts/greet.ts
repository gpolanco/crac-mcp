/**
 * Greet prompt
 * Simple greeting prompt for testing
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const inputSchema = z.object({
  name: z.string().describe("Name of the person to greet"),
});

/**
 * Registers the greet prompt with the MCP server
 *
 * @param server - The MCP server instance
 */
export function registerGreetPrompt(server: McpServer): void {
  server.registerPrompt(
    "greet",
    {
      title: "Hello Prompt",
      description: "Say hello to someone",
      argsSchema: inputSchema.shape,
    },
    async (args: any) => {
      const { name } = args;
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Say hello to ${name}`,
            },
          },
        ],
      };
    }
  );
}

