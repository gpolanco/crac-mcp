import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseCommand } from "./parser/command-parser.js";
import { ContextSearcher } from "./rag/context-searcher.js";
import { PromptBuilder } from "./prompts/prompt-builder.js";

const inputSchema = z.object({
  name: z.string().describe("Name to greet"),
});

const outputSchema = z.object({
  content: z.array(
    z.object({
      type: z.string(),
      text: z.string(),
    })
  ),
});

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "crac-mcp",
    version: "1.0.0",
  });

  // Initialize RAG components
  const contextSearcher = new ContextSearcher();
  const promptBuilder = new PromptBuilder();

  // Add a tool
  server.registerTool(
    "hello",
    {
      title: "Hello Tool",
      description: "Say hello to someone",
      inputSchema: inputSchema.shape,
      outputSchema: outputSchema.shape,
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

  // Add get-info tool
  server.registerTool(
    "get-info",
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
      outputSchema: outputSchema.shape,
    },
    async (args: any) => {
      const { section } = args;
      const tools = ["hello", "get-info"];
      const resources = ["hello-world-history"];
      const prompts = ["greet", "dev-task"];

      const info = {
        server: {
          name: "crac-mcp",
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
        structuredContent: filteredInfo,
      };
    }
  );

  // Add a resource
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

  // Add a prompt
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

  // Add dev-task prompt with RAG integration
  server.registerPrompt(
    "dev-task",
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
        console.log(`[MCP] Parsed command:`, parsed);

        // Search context using RAG (invisible to user)
        console.log(
          `[MCP] Starting RAG context search for scope: ${parsed.scope}, tool: ${parsed.tool}`
        );
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

        console.log(`[MCP] RAG context search completed:`);
        console.log(`[MCP]   - Technology: ${hasTechnology ? "✓" : "✗"}`);
        console.log(`[MCP]   - Structure: ${hasStructure ? "✓" : "✗"}`);
        console.log(`[MCP]   - Conventions: ${hasConventions ? "✓" : "✗"}`);
        console.log(`[MCP]   - Examples: ${hasExamples ? "✓" : "✗"}`);
        console.log(
          `[MCP]   - RAG found context: ${
            ragFoundContext ? "YES" : "NO (using fallbacks)"
          }`
        );

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
        console.error("[MCP] Error generating dev-task prompt:", error);

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

  return server;
}
