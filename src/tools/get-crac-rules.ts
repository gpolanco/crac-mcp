/**
 * Get CRAC Rules tool
 * Provides CRAC monorepo rules and conventions based on context
 * The agent should use this tool when it needs to understand CRAC conventions
 * The tool automatically detects which rules are relevant based on the context provided
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CracRulesProvider } from "../core/tools/crac-rules-provider.js";

/**
 * Registers the get_crac_rules tool with the MCP server
 * Note: Tool name uses snake_case according to MCP naming conventions
 *
 * @param server - The MCP server instance
 */
export function registerGetCracRulesTool(server: McpServer): void {
  const provider = new CracRulesProvider();

  server.registerTool(
    "get_crac_rules",
    {
      title: "Get CRAC Rules",
      description:
        "Get CRAC monorepo rules and conventions. Use this tool when you need to: " +
        "create tests (Jest, RTL, testing patterns), " +
        "create directory structure or organize code (folder structure, architecture), " +
        "implement API services or endpoints (Screaming Architecture, Redux actions), " +
        "write code following CRAC conventions (naming, components, imports). " +
        "The tool automatically detects which rules are relevant based on your task context. " +
        "Always call this tool first before implementing code, tests, services, or structures in the CRAC monorepo.",
      inputSchema: {
        context: z
          .string()
          .optional()
          .describe(
            "La tarea o contexto actual que estás realizando. Pasa la descripción completa de lo que vas a hacer. " +
              "Ejemplos: 'implementa los test de EmailSendBookingAgencyService', 'crea la estructura para un nuevo módulo roles en core', 'implementa el servicio de usuarios'"
          ),
      },
    },
    async (args: any) => {
      const { context } = args || {};
      const result = await provider.getRules(context);

      // Format response with metadata
      let response = `## CRAC Rules - ${result.description}\n\n`;
      response += `*Detected rule types: ${result.ruleTypes.join(", ")}*\n\n`;
      response += `---\n\n`;
      response += result.content;

      return {
        content: [
          {
            type: "text",
            text: response,
          },
        ],
      };
    }
  );
}
