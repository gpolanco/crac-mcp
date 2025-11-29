# crac-mcp - MCP Server Guide

A Model Context Protocol (MCP) server built with TypeScript and the Smithery SDK, deployed on Railway.

## Table of Contents

- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)

## Project Structure

```
crac-mcp/
├── src/
│   └── index.ts          # Main server implementation
├── package.json           # Dependencies and scripts
├── smithery.yaml          # Runtime configuration
├── Dockerfile            # Docker configuration for deployment
├── railway.json          # Railway deployment config
└── README.md             # Project documentation
```

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start development server (HTTP on port 8081)
pnpm dev

# Build for production
pnpm build
```

The development server starts on `http://127.0.0.1:8081/mcp` and opens the Smithery playground for testing.

### Kill existing process

```bash
lsof -ti:8081 | xargs kill
```

## Core Concepts

### Tools, Resources, and Prompts

MCP servers expose three types of components that AI applications can interact with:

#### Tools: Executable Functions

Tools perform actions and return results:

```typescript
server.registerTool(
  "hello",
  {
    title: "Hello Tool",
    description: "Say hello to someone",
    inputSchema: { name: z.string().describe("Name to greet") },
  },
  async ({ name }) => {
    return {
      content: [{ type: "text", text: `Hello, ${name}!` }],
    };
  }
);
```

#### Resources: Read-Only Data Sources

Resources provide read-only information:

```typescript
server.registerResource(
  "hello-world-history",
  "history://hello-world",
  {
    title: "Hello World History",
    description: "The origin story of 'Hello, World'",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: '"Hello, World" first appeared in a 1972 Bell Labs memo...',
        mimeType: "text/plain",
      },
    ],
  })
);
```

#### Prompts: Reusable Message Templates

Prompts provide structured message templates:

```typescript
server.registerPrompt(
  "greet",
  {
    title: "Hello Prompt",
    description: "Say hello to someone",
    argsSchema: {
      name: z.string().describe("Name of the person to greet"),
    },
  },
  async ({ name }) => {
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
```

#### When to Use Each

- **Tools**: Actions (API calls, computations, database operations)
- **Resources**: Read-only data (documentation, reference info)
- **Prompts**: Conversation templates (reusable workflows)

### Session Configuration

Define a configuration schema using Zod to pass personalized settings per connection:

```typescript
export const configSchema = z.object({
  apiKey: z.string().describe("Your API key"),
  debug: z.boolean().default(false).describe("Enable debug mode"),
});

export default function createServer({
  config,
}: {
  config: z.infer<typeof configSchema>;
}) {
  const server = new McpServer({ name: "My Server", version: "1.0.0" });

  // Use config in your tools
  server.registerTool(
    "my-tool",
    {
      /* ... */
    },
    async (args) => {
      if (config.debug) console.log("Debug mode enabled");
      // Use config.apiKey for API calls
      return { content: [{ type: "text", text: "Result" }] };
    }
  );

  return server.server;
}
```

**Pass configuration via URL parameters:**

```
http://localhost:8081/mcp?apiKey=abc123&debug=true
```

### Stateful vs Stateless Servers

**Stateful (Default)**: Maintains state between calls within a session:

```typescript
export default function createServer({ sessionId, config }) {
  const server = new McpServer({ name: "My App", version: "1.0.0" });
  // Store session-specific state
  return server.server;
}
```

**Stateless**: Fresh instance for each request:

```typescript
export const stateless = true;

export default function createServer({ config }) {
  const server = new McpServer({ name: "My App", version: "1.0.0" });
  return server.server;
}
```

## Development

### Customizing Your Server

1. **Update package.json** with your project details
2. **Choose stateless or stateful** (default is stateful)
3. **Define config schema** (optional) using Zod
4. **Add tools, resources, and prompts** in `src/index.ts`

### Testing Your Server

#### Local Development

```bash
pnpm dev
```

Starts server on `http://127.0.0.1:8081/mcp` with hot reload.

#### Direct Protocol Testing

Test the MCP protocol directly with curl:

```bash
# Initialize connection
curl -X POST "http://127.0.0.1:8081/mcp?debug=false" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'

# List tools
curl -X POST "http://127.0.0.1:8081/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# Call a tool
curl -X POST "http://127.0.0.1:8081/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"hello","arguments":{"name":"World"}}}'
```

## Deployment

### Railway (Current)

This server is deployed on Railway and automatically deploys on every push to `main`.

**URL:** https://crac-mcp-production.up.railway.app/mcp

Railway automatically:

- Detects the `Dockerfile`
- Builds the Docker image
- Deploys the service
- Assigns a public URL

### Connect from MCP Clients

#### Cursor

Add to your Cursor MCP configuration:

```json
{
  "mcpServers": {
    "crac-mcp": {
      "url": "https://crac-mcp-production.up.railway.app/mcp",
      "type": "http"
    }
  }
}
```

#### Other Clients

Connect to the server URL with optional configuration parameters:

```
https://crac-mcp-production.up.railway.app/mcp?debug=false
```

### Docker Deployment

You can also deploy using Docker on any platform:

```bash
# Build image
docker build -t crac-mcp:latest .

# Run container
docker run -d -p 8081:8081 --name crac-mcp crac-mcp:latest
```

See [DOCKER.md](./DOCKER.md) for detailed instructions.

## Troubleshooting

### Port Issues

- Default port is **8081**
- Kill existing process: `lsof -ti:8081 | xargs kill`

### Config Issues

```bash
# Check your configuration schema
node -e "import('./src/index.ts').then(m => console.log(JSON.stringify(m.configSchema._def, null, 2)))"
```

### Import Issues

- Ensure you're in the project root directory
- Run `pnpm install` to install dependencies
- Verify Node.js version is 20 or higher
- Check that `package.json` has `"type": "module"`

### TypeScript Issues

- Run `npx tsc --noEmit` to check for TypeScript errors
- Ensure all imports use `.js` extensions (TypeScript + ESM requirement)

### Build Issues

- Ensure `pnpm build` completes successfully
- Check that `.smithery/index.cjs` is generated
- Verify all dependencies are installed

## Resources

- **MCP Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Smithery SDK**: [smithery.ai/docs](https://smithery.ai/docs)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Project README**: [README.md](./README.md)
