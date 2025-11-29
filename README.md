# crac-mcp

[![smithery badge](https://smithery.ai/badge/@gpolanco/crac-mcp-v2)](https://smithery.ai/server/@gpolanco/crac-mcp-v2) [![smithery badge](https://smithery.ai/badge/@gpolanco/crac-mcp)](https://smithery.ai/server/@gpolanco/crac-mcp)

A Model Context Protocol (MCP) server demonstrating tools, resources, and prompts.

**Live Server:** [https://crac-mcp-production.up.railway.app/mcp](https://crac-mcp-production.up.railway.app/mcp)

Built with [Smithery SDK](https://smithery.ai/docs) and deployed on [Railway](https://railway.app).

## Features

- **Tool**: `hello` - Say hello to someone
- **Resource**: `history://hello-world` - The origin story of "Hello, World"
- **Prompt**: `greet` - Reusable greeting template

## Prerequisites

- **Node.js** 20+
- **pnpm** (or npm/yarn)
- **Smithery API key** (for local development): Get yours at [smithery.ai/account/api-keys](https://smithery.ai/account/api-keys)

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

   This starts the server on `http://127.0.0.1:8081/mcp` and opens the Smithery playground.

3. Try the tools:
   - Tool: `hello` - Greet someone
   - Resource: `history://hello-world` - Read about "Hello, World" history
   - Prompt: `greet` - Use greeting template

### Build

```bash
pnpm build
```

Creates bundled server in `.smithery/index.cjs`

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
│   └── index.ts          # MCP server implementation
├── .smithery/            # Build output (generated)
├── Dockerfile            # Docker configuration
├── railway.json          # Railway deployment config
├── smithery.yaml         # Smithery runtime config
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## Development

Your code is organized as:

- `src/index.ts` - MCP server with tools, resources, and prompts
- `smithery.yaml` - Runtime specification (TypeScript)
- `Dockerfile` - Container configuration for deployment

Edit `src/index.ts` to add your own tools, resources, and prompts.

## Configuration

### Session Configuration

The server supports optional session configuration via `configSchema`:

- `debug` (boolean, default: false) - Enable debug logging

Pass configuration as URL parameters:

```
https://crac-mcp-production.up.railway.app/mcp?debug=true
```

## Learn More

- [Smithery Docs](https://smithery.ai/docs)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Railway Docs](https://docs.railway.app)
- [Docker Documentation](./DOCKER.md)

## License

ISC