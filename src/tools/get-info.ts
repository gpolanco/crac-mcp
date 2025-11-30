/**
 * Get Info tool
 * Returns generic server information including available tools, resources, and prompts
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers the get_info tool with the MCP server
 * Note: Tool name uses snake_case according to MCP naming conventions
 *
 * @param server - The MCP server instance
 */
export function registerGetInfoTool(server: McpServer): void {
  server.registerTool(
    "get_info", // snake_case according to MCP conventions
    {
      title: "Get Server Info",
      description: "Retorna información genérica del servidor MCP",
      inputSchema: {
        section: z
          .string()
          .optional()
          .describe(
            "Sección específica de información (server, tools, resources, prompts)"
          ),
      },
    },
    async (args: any) => {
      const { section } = args;
      const tools = ["hello", "get_info", "get_crac_rules"];
      const resources: string[] = []; // Resources disabled, using tools instead
      const prompts = ["greet", "dev_task", "generate_tasks"]; // Updated to snake_case

      const info = {
        server: {
          name: "crac",
          version: "1.0.0",
        },
        tools,
        resources,
        prompts,
      };

      let filteredInfo: Partial<typeof info> = info;
      if (section) {
        const sectionLower = section.toLowerCase();
        if (sectionLower === "server") {
          filteredInfo = { server: info.server };
        } else if (sectionLower === "tools") {
          filteredInfo = { tools: info.tools };
        } else if (sectionLower === "resources") {
          filteredInfo = { resources: info.resources };
        } else if (sectionLower === "prompts") {
          filteredInfo = { prompts: info.prompts };
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(filteredInfo, null, 2),
          },
        ],
      };
    }
  );
}
