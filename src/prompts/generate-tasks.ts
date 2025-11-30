/**
 * Generate Tasks prompt
 * Generate structured task documentation (PRD → Tasks → Subtasks) using templates and RAG context
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseCommand } from "../core/parser/command-parser.js";
import { ContextSearcher } from "../core/rag/context-searcher.js";
import { TemplateSearcher } from "../core/rag/template-searcher.js";
import { TaskGeneratorBuilder } from "../core/prompts/task-generator-builder.js";

interface Dependencies {
  templateSearcher: TemplateSearcher;
  contextSearcher: ContextSearcher;
  taskGeneratorBuilder: TaskGeneratorBuilder;
}

/**
 * Registers the generate_tasks prompt with the MCP server
 * Note: Prompt name uses snake_case according to MCP naming conventions
 *
 * @param server - The MCP server instance
 * @param dependencies - Required dependencies (templateSearcher, contextSearcher, taskGeneratorBuilder)
 */
export function registerGenerateTasksPrompt(
  server: McpServer,
  dependencies: Dependencies
): void {
  const { templateSearcher, contextSearcher, taskGeneratorBuilder } =
    dependencies;

  server.registerPrompt(
    "generate_tasks", // snake_case according to MCP conventions
    {
      title: "Generate Tasks",
      description:
        "Generate structured task documentation (PRD → Tasks → Subtasks) using templates and RAG context. Searches for templates and monorepo context to create a complete markdown document.",
      argsSchema: {
        command: z
          .string()
          .describe(
            "Command in natural language. Examples: 'generate-tasks partners nueva sección settings', 'gen-tasks rac implementar buscador de reservas'"
          ),
      },
    },
    async (args: any) => {
      try {
        const { command } = args;

        if (!command || command.trim().length === 0) {
          return {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: "Error: Command cannot be empty. Please provide a command for task generation.",
                },
              },
            ],
          };
        }

        // Parse command
        const parsed = parseCommand(command);

        // Normalize tool name for generate-tasks variations
        const lowerTool = parsed.tool.toLowerCase();
        if (
          lowerTool === "generate-tasks" ||
          lowerTool === "gen-tasks" ||
          lowerTool === "generate" ||
          lowerTool === "gen"
        ) {
          parsed.tool = "generate-tasks";
        }

        // Search templates and context in parallel
        const [templates, ragContext] = await Promise.all([
          templateSearcher.searchTemplates(),
          contextSearcher.searchContext(
            parsed.requirements,
            parsed.scope,
            parsed.tool
          ),
        ]);

        // Build task generation prompt
        const taskPrompt = taskGeneratorBuilder.buildTaskGenerationPrompt(
          parsed,
          templates,
          ragContext
        );

        // Return prompt ready for agent
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: taskPrompt.prompt,
              },
            },
          ],
        };
      } catch (error) {
        console.error("[MCP] Error in generate_tasks prompt:", error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown error occurred while generating task prompt";

        // Check if it's an environment variable error
        const isEnvError =
          errorMessage.includes("SUPABASE_URL") ||
          errorMessage.includes("SUPABASE_SERVICE_ROLE_KEY") ||
          errorMessage.includes("GEMINI_API_KEY") ||
          errorMessage.includes("Invalid supabaseUrl");

        let errorText = `Error generating task prompt: ${errorMessage}\n\n`;

        if (isEnvError) {
          errorText += `\n═══════════════════════════════════════════════════════════\n`;
          errorText += `⚠️ CONFIGURATION ERROR\n`;
          errorText += `═══════════════════════════════════════════════════════════\n`;
          errorText += `The MCP server is missing required environment variables.\n\n`;
          errorText += `Please ensure the following are set:\n`;
          errorText += `- SUPABASE_URL (e.g., https://your-project.supabase.co)\n`;
          errorText += `- SUPABASE_SERVICE_ROLE_KEY\n`;
          errorText += `- GEMINI_API_KEY\n\n`;
          errorText += `If running locally, create a .env file in the crac-mcp directory.\n`;
          errorText += `If running on Railway, set these in the Railway dashboard.\n`;
          errorText += `═══════════════════════════════════════════════════════════\n`;
        }

        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: errorText,
              },
            },
          ],
        };
      }
    }
  );
}
