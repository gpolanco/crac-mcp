# crac-mcp - MCP Server Guide

A Model Context Protocol (MCP) server built with TypeScript and the standard MCP SDK, deployed on Railway.

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
│   ├── index.ts          # MCP server implementation
│   └── server.ts         # Express HTTP server
├── dist/                 # Build output (generated)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── Dockerfile            # Docker configuration for deployment
├── railway.json          # Railway deployment config
└── README.md             # Project documentation
```

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start development server (HTTP on port 3000)
pnpm dev

# Build for production
pnpm build
```

The development server starts on `http://localhost:3000/mcp` with hot reload.

### Kill existing process

```bash
lsof -ti:3000 | xargs kill
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

### Server Architecture

The server uses a stateless HTTP transport, creating a new transport instance for each request to prevent JSON-RPC request ID collisions:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "crac-mcp",
    version: "1.0.0",
  });

  // Register tools, resources, and prompts
  // ...

  return server;
}
```

The HTTP server creates a new transport for each request in stateless mode:

```typescript
app.all("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode
    enableJsonResponse: true,
  });

  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
```

## Development

### Customizing Your Server

1. **Update package.json** with your project details
2. **Add tools, resources, and prompts** in `src/index.ts`
3. **Configure HTTP server** in `src/server.ts` if needed

### Testing Your Server

#### Local Development

```bash
pnpm dev
```

Starts server on `http://localhost:3000/mcp` with hot reload.

#### Direct Protocol Testing

Test the MCP protocol directly with curl:

```bash
# Initialize connection
curl -X POST "http://localhost:3000/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'

# List tools
curl -X POST "http://localhost:3000/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# Call a tool
curl -X POST "http://localhost:3000/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"hello","arguments":{"name":"World"}}}'

# Call get-info tool
curl -X POST "http://localhost:3000/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get-info","arguments":{}}}'
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

Connect to the server URL:

```
https://crac-mcp-production.up.railway.app/mcp
```

### Docker Deployment

You can also deploy using Docker on any platform:

```bash
# Build image
docker build -t crac-mcp:latest .

# Run container
docker run -d -p 3000:3000 --name crac-mcp crac-mcp:latest
```

See [DOCKER.md](./DOCKER.md) for detailed instructions.

## Troubleshooting

### Port Issues

- Default port is **3000** (configurable via `PORT` environment variable)
- Kill existing process: `lsof -ti:3000 | xargs kill`

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
- Check that `dist/` directory is generated with compiled JavaScript
- Verify all dependencies are installed

## Available Tools

### `get-info`

Returns generic server information including server name, version, and lists of available tools, resources, and prompts.

**Input Schema:**

- `section` (optional string): Filter information by section (server, tools, resources, prompts)

**Output:**

- Server information (name, version)
- List of available tools
- List of available resources
- List of available prompts

**Example Usage:**

```typescript
// Get all information
const result = await client.callTool({
  name: "get-info",
  arguments: {},
});

// Get only tools list
const toolsOnly = await client.callTool({
  name: "get-info",
  arguments: { section: "tools" },
});
```

## Resources

- **MCP Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **MCP TypeScript SDK**: [github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Project README**: [README.md](./README.md)
