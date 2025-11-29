import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const inputSchema = z.object({
  name: z.string().describe("Name to greet"),
});

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "crac-mcp",
    version: "1.0.0",
  });

  // Add a tool
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
    },
    async (args: any) => {
      const { section } = args;
      const tools = ["hello", "get-info"];
      const resources = ["hello-world-history"];
      const prompts = ["greet"];

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

  return server;
}
