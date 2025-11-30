/**
 * CRAC Rules resource
 * Provides read-only access to agent configuration rules from .mdc files
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AgentRulesReader } from "../core/resources/agent-rules-reader.js";

/**
 * Registers the crac-rules resource with the MCP server
 *
 * @param server - The MCP server instance
 */
export function registerAgentRulesResource(server: McpServer): void {
  const reader = new AgentRulesReader();

  server.registerResource(
    "crac-rules",
    "crac-rules://*",
    {
      title: "CRAC Rules",
      description:
        "Provides access to agent configuration rules and conventions from CRAC monorepo documentation. Available URIs: crac-rules://crac-config, crac-rules://endpoints, crac-rules://all",
    },
    async (uri) => {
      return reader.readRules(uri.href);
    }
  );
}
