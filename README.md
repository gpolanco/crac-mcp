# crac-mcp

A Model Context Protocol (MCP) server demonstrating tools, resources, and prompts.

**Live Server:** [https://crac-mcp-production.up.railway.app/mcp](https://crac-mcp-production.up.railway.app/mcp)

Built with [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) and deployed on [Railway](https://railway.app).

## Features

- **Tool**: `hello` - Say hello to someone
- **Tool**: `get-info` - Get server information
- **Tool**: `get-crac-rules` - ⭐ **Get CRAC monorepo rules and conventions** - Automatically detects which rules are relevant based on context (testing, structure, endpoints, code style)
- **Prompt**: `greet` - Reusable greeting template
- **Prompt**: `dev-task` - ⭐ **Context-aware development prompts** using RAG (Retrieval-Augmented Generation)
- **Prompt**: `generate-tasks` - Generate structured task documentation using templates and RAG

## Prerequisites

- **Node.js** 20+
- **pnpm** (or npm/yarn)
- **Supabase project** with pgvector extension enabled
- **Google Gemini API key**

## Environment Variables

The following environment variables are required:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)
- `GEMINI_API_KEY` - Your Google Gemini API key

Create a `.env` file in the root directory with these variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

**Note:** The server will fail to start if any of these environment variables are missing.

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
   - Tool: `get-crac-rules` - Get CRAC monorepo rules (automatically detects relevant rules)
   - Prompt: `greet` - Use greeting template
   - Prompt: `dev-task` - Generate context-aware development prompts
   - Prompt: `generate-tasks` - Generate structured task documentation

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
│   ├── index.ts                    # MCP server implementation
│   ├── server.ts                   # Express HTTP server
│   ├── tools/                      # MCP tools
│   │   ├── hello.ts
│   │   ├── get-info.ts
│   │   └── get-crac-rules.ts       # CRAC rules tool (auto-detects context)
│   ├── prompts/                    # MCP prompts
│   │   ├── greet.ts
│   │   ├── dev-task.ts             # Context-aware dev prompts (RAG)
│   │   └── generate-tasks.ts       # Task generation (RAG + Templates)
│   ├── core/
│   │   ├── tools/                  # Core tool logic
│   │   │   ├── crac-rules-detector.ts  # Pattern-based rule detection
│   │   │   └── crac-rules-provider.ts  # Rules provider
│   │   ├── resources/              # Core resource logic
│   │   │   └── agent-rules-reader.ts   # Reads .mdc files
│   │   ├── parser/                 # Command parsing
│   │   │   └── command-parser.ts
│   │   ├── rag/                    # RAG functionality
│   │   │   ├── gemini-client.ts
│   │   │   ├── context-searcher.ts
│   │   │   └── template-searcher.ts
│   │   └── prompts/                # Prompt building
│   │       ├── prompt-builder.ts
│   │       └── task-generator-builder.ts
│   ├── docs/                       # Documentation files (.mdc)
│   │   ├── crac-config.mdc         # CRAC monorepo rules
│   │   └── endpoints.mdc           # Endpoint implementation guide
│   └── client/
│       └── index.html              # Web UI (route /)
├── dist/                           # Build output (generated)
├── Dockerfile                      # Docker configuration
├── railway.json                    # Railway deployment config
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies and scripts
└── README.md                       # This file
```

## Development

### Architecture

The `dev-task` prompt uses the following flow:

1. **Command Parsing**: Extracts tool, scope, and requirements from natural language
2. **Context Search**: Performs 4 parallel semantic searches in Supabase:
   - Technology/stack information
   - Folder structure patterns
   - Code conventions
   - Similar examples
3. **Prompt Building**: Combines search results into structured prompts (automatically includes CRAC rules)
4. **Response**: Returns prompt ready for development agents

All RAG operations are transparent to the user - they only see the final prompt result.

### Code Organization

- `src/tools/` - MCP tools (registration only, logic in `core/tools/`)
- `src/prompts/` - MCP prompts (registration only, logic in `core/prompts/`)
- `src/core/tools/` - Core tool logic (CracRulesDetector, CracRulesProvider)
- `src/core/resources/` - Core resource logic (AgentRulesReader)
- `src/core/parser/` - Command parsing logic
- `src/core/rag/` - RAG functionality (Gemini, Supabase, context search)
- `src/core/prompts/` - Prompt building logic
- `src/docs/` - Documentation files (.mdc) with CRAC rules

## Available Tools

### `get-info`

Returns generic server information (server name, version, lists of tools/resources/prompts).

### `get-crac-rules` ⭐

Provides CRAC monorepo rules and conventions based on context. Automatically detects which rules are relevant using pattern matching:

- **Testing rules**: Detected when context contains "test", "testing", "jest", "spec", etc.
- **Structure rules**: Detected when context contains "structure", "folder", "directory", "feature", etc.
- **Endpoint rules**: Detected when context contains "endpoint", "api", "service", "redux action", etc.
- **Code style rules**: Detected when context contains "code style", "convention", "naming", "component", etc.

**Input:** `context` (optional string) - Description of the task

**Note:** The agent should automatically use this tool when it detects it needs CRAC conventions. See the web UI at `/` for detailed examples.

## Available Prompts

### `dev-task` ⭐

Generates context-aware development prompts using RAG. Automatically searches for relevant context and includes CRAC rules.

**Input:** `command` (string) - Development command in natural language

**Supported:** Tools (`dev`, `test`, `refactor`, etc.), Scopes (`rac`, `partners`, `global`, etc.)

### `generate-tasks`

Generates structured task documentation (PRD → Tasks → Subtasks) using templates and RAG context.

**Input:** `command` (string) - Task generation command

See the web UI at `/` for detailed examples and usage.

## Learn More

- [MCP Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Railway Docs](https://docs.railway.app)
- [Docker Documentation](./DOCKER.md)

## License

ISC
