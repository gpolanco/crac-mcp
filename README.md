# crac-mcp

A Model Context Protocol (MCP) server demonstrating tools, resources, and prompts.

**Live Server:** [https://crac-mcp-production.up.railway.app/mcp](https://crac-mcp-production.up.railway.app/mcp)

Built with [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) and deployed on [Railway](https://railway.app).

## Features

- **Tool**: `hello` - Say hello to someone
- **Tool**: `get-info` - Get server information
- **Resource**: `history://hello-world` - The origin story of "Hello, World"
- **Prompt**: `greet` - Reusable greeting template

## Prerequisites

- **Node.js** 20+
- **pnpm** (or npm/yarn)

## Getting Started

### Local Development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start development server:

   ```bash
   pnpm dev
   ```

   This starts the server on `http://localhost:3000/mcp` with hot reload.

3. Try the tools:
   - Tool: `hello` - Greet someone
   - Tool: `get-info` - Get server information
   - Resource: `history://hello-world` - Read about "Hello, World" history
   - Prompt: `greet` - Use greeting template

### Build

```bash
pnpm build
```

Compiles TypeScript to JavaScript in `dist/` directory.

## Deployment

### Railway (Current)

This server is deployed on Railway and automatically deploys on every push to `main`.

**URL:** https://crac-mcp-production.up.railway.app/mcp

Railway automatically:

- Detects the `Dockerfile`
- Builds the Docker image
- Deploys the service
- Assigns a public URL

### Connect from Cursor

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

### Docker (Alternative Deployment)

You can also deploy using Docker on any platform:

```bash
# Build image
docker build -t crac-mcp:latest .

# Run locally
docker run -d -p 8081:8081 --name crac-mcp crac-mcp:latest
```

See [DOCKER.md](./DOCKER.md) for detailed Docker instructions.

## Project Structure

```
crac-mcp/
├── src/
│   ├── index.ts          # MCP server implementation
│   └── server.ts         # Express HTTP server
├── dist/                 # Build output (generated)
├── Dockerfile            # Docker configuration
├── railway.json          # Railway deployment config
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Development

Your code is organized as:

- `src/index.ts` - MCP server with tools, resources, and prompts
- `src/server.ts` - Express HTTP server with MCP transport
- `tsconfig.json` - TypeScript configuration
- `Dockerfile` - Container configuration for deployment

Edit `src/index.ts` to add your own tools, resources, and prompts.

## Available Tools

### `get-info`

Returns generic server information.

**Input:**

- `section` (optional string): Filter information by section (server, tools, resources, prompts)

**Output:**

- Server name and version
- List of available tools
- List of available resources
- List of available prompts

**Example:**

```json
{
  "section": "tools"
}
```

## Learn More

- [MCP Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Railway Docs](https://docs.railway.app)
- [Docker Documentation](./DOCKER.md)

## License

ISC
