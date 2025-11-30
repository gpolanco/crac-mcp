/**
 * Dev Task prompt
 * Generate context-aware development prompts using RAG
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseCommand } from "../core/parser/command-parser.js";
import { ContextSearcher } from "../core/rag/context-searcher.js";
import { PromptBuilder } from "../core/prompts/prompt-builder.js";

interface Dependencies {
  contextSearcher: ContextSearcher;
  promptBuilder: PromptBuilder;
}

/**
 * Registers the dev_task prompt with the MCP server
 * Note: Prompt name uses snake_case according to MCP naming conventions
 *
 * @param server - The MCP server instance
 * @param dependencies - Required dependencies (contextSearcher, promptBuilder)
 */
export function registerDevTaskPrompt(
  server: McpServer,
  dependencies: Dependencies
): void {
  const { contextSearcher, promptBuilder } = dependencies;

  server.registerPrompt(
    "dev_task", // snake_case according to MCP conventions
    {
      title: "Development Task",
      description:
        "Generate context-aware development prompts using RAG. Parses natural language commands and searches for relevant context from the monorepo.",
      argsSchema: {
        command: z
          .string()
          .describe(
            "Development command in natural language. Examples: 'dev rac implementa la nueva sección booking-search', 'test partners add unit tests for auth flow', 'refactor global improve code structure'"
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
                  text: "Error: Command cannot be empty. Please provide a development command.",
                },
              },
            ],
          };
        }

        // Parse command
        const parsed = parseCommand(command);

        // Search context using RAG (invisible to user)
        const ragContext = await contextSearcher.searchContext(
          parsed.requirements,
          parsed.scope,
          parsed.tool
        );

        // Check if RAG found context
        const hasTechnology = ragContext.technology.trim().length > 0;
        const hasStructure = ragContext.folderStructure.trim().length > 0;
        const hasConventions = ragContext.conventions.trim().length > 0;
        const hasExamples = ragContext.examples.trim().length > 0;
        const ragFoundContext =
          hasTechnology || hasStructure || hasConventions || hasExamples;

        // Build structured prompt
        const structuredPrompt = promptBuilder.buildPrompt(parsed, ragContext);

        // Add RAG status indicator to prompt (for debugging/verification)
        // Make it very visible at the top of the prompt
        let ragStatusHeader = "";
        if (ragFoundContext) {
          ragStatusHeader = `\n\n═══════════════════════════════════════════════════════════\n`;
          ragStatusHeader += `✅ RAG CONTEXT LOADED SUCCESSFULLY\n`;
          ragStatusHeader += `═══════════════════════════════════════════════════════════\n`;
          ragStatusHeader += `This prompt includes context retrieved from the monorepo documentation using semantic search.\n`;
          ragStatusHeader += `- Technology context: ${
            hasTechnology ? "✓ Found" : "✗ Not found"
          }\n`;
          ragStatusHeader += `- Structure context: ${
            hasStructure ? "✓ Found" : "✗ Not found"
          }\n`;
          ragStatusHeader += `- Conventions context: ${
            hasConventions ? "✓ Found" : "✗ Not found"
          }\n`;
          ragStatusHeader += `- Examples context: ${
            hasExamples ? "✓ Found" : "✗ Not found"
          }\n`;
          ragStatusHeader += `═══════════════════════════════════════════════════════════\n\n`;
        } else {
          ragStatusHeader = `\n\n═══════════════════════════════════════════════════════════\n`;
          ragStatusHeader += `⚠️ RAG CONTEXT NOT FOUND - USING FALLBACKS\n`;
          ragStatusHeader += `═══════════════════════════════════════════════════════════\n`;
          ragStatusHeader += `No context was found in Supabase for scope "${parsed.scope}".\n`;
          ragStatusHeader += `Using default fallback context. Make sure embeddings are available in Supabase.\n`;
          ragStatusHeader += `═══════════════════════════════════════════════════════════\n\n`;
        }

        // Return prompt ready for agent
        // Note: MCP prompts only support "user" or "assistant" roles
        // Combine system and user prompts into a single user message
        // Put RAG status at the very beginning so it's immediately visible
        const combinedPrompt = `${ragStatusHeader}${structuredPrompt.system}\n\n---\n\n${structuredPrompt.user}`;

        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: combinedPrompt,
              },
            },
          ],
        };
      } catch (error) {
        console.error("[MCP] Error in dev_task prompt:", error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown error occurred while generating prompt";

        // Check if it's an environment variable error
        const isEnvError =
          errorMessage.includes("SUPABASE_URL") ||
          errorMessage.includes("SUPABASE_SERVICE_ROLE_KEY") ||
          errorMessage.includes("GEMINI_API_KEY") ||
          errorMessage.includes("Invalid supabaseUrl");

        let errorText = `Error generating context-aware prompt: ${errorMessage}\n\n`;

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
