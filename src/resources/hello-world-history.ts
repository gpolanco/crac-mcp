/**
 * Hello World History resource
 * Provides read-only information about the origin of "Hello, World"
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Registers the hello-world-history resource with the MCP server
 *
 * @param server - The MCP server instance
 */
export function registerHelloWorldHistoryResource(server: McpServer): void {
  server.registerResource(
    "hello-world-history",
    "history://hello-world",
    {
      title: "Hello World History",
      description: "The origin story of the famous 'Hello, World' program",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: '"Hello, World" first appeared in a 1972 Bell Labs memo by Brian Kernighan and later became the iconic first program for beginners in countless languages.',
          mimeType: "text/plain",
        },
      ],
    })
  );
}

