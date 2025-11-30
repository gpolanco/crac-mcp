import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ContextSearcher } from "./core/rag/context-searcher.js";
import { PromptBuilder } from "./core/prompts/prompt-builder.js";
import { TemplateSearcher } from "./core/rag/template-searcher.js";
import { TaskGeneratorBuilder } from "./core/prompts/task-generator-builder.js";
import { registerHelloTool } from "./tools/hello.js";
import { registerGetInfoTool } from "./tools/get-info.js";
import { registerHelloWorldHistoryResource } from "./resources/hello-world-history.js";
import { registerGreetPrompt } from "./prompts/greet.js";
import { registerDevTaskPrompt } from "./prompts/dev-task.js";
import { registerGenerateTasksPrompt } from "./prompts/generate-tasks.js";

/**
 * Creates and configures the MCP server with all tools, resources, and prompts
 *
 * @returns Configured MCP server instance
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "crac",
    version: "1.0.0",
  });

  // Initialize core dependencies
  const contextSearcher = new ContextSearcher();
  const promptBuilder = new PromptBuilder();
  const templateSearcher = new TemplateSearcher();
  const taskGeneratorBuilder = new TaskGeneratorBuilder();

  // Register tools
  registerHelloTool(server);
  registerGetInfoTool(server);

  // Register resources
  registerHelloWorldHistoryResource(server);

  // Register prompts
  registerGreetPrompt(server);
  registerDevTaskPrompt(server, { contextSearcher, promptBuilder });
  registerGenerateTasksPrompt(server, {
    templateSearcher,
    contextSearcher,
    taskGeneratorBuilder,
  });

  return server;
}
