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
        const ragContext = await contextSearcher.searchContext(
          parsed.requirements,
          parsed.scope,
          parsed.tool
        );

        // Build structured prompt
        const structuredPrompt = promptBuilder.buildPrompt(parsed, ragContext);

        // Return prompt ready for agent
        // Note: MCP prompts only support "user" or "assistant" roles
        // Combine system and user prompts into a single user message
        const combinedPrompt = `${structuredPrompt.system}\n\n---\n\n${structuredPrompt.user}`;

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

        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Error generating context-aware prompt: ${errorMessage}`,
              },
            },
          ],
        };
      }
    }
  );

  return server;
}
