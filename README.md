# crac-mcp

A Model Context Protocol (MCP) server demonstrating tools, resources, and prompts.

**Live Server:** [https://crac-mcp-production.up.railway.app/mcp](https://crac-mcp-production.up.railway.app/mcp)

Built with [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) and deployed on [Railway](https://railway.app).

## Features

- **Tool**: `hello` - Say hello to someone
- **Tool**: `get-info` - Get server information
- **Resource**: `history://hello-world` - The origin story of "Hello, World"
- **Prompt**: `greet` - Reusable greeting template
- **Prompt**: `dev-task` - ⭐ **Context-aware development prompts** using RAG (Retrieval-Augmented Generation)

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
   - Resource: `history://hello-world` - Read about "Hello, World" history
   - Prompt: `greet` - Use greeting template
   - Prompt: `dev-task` - Generate context-aware development prompts

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
│   ├── index.ts              # MCP server implementation
│   ├── server.ts             # Express HTTP server
│   ├── lib/
│   │   └── env.ts            # Environment variables validation
│   ├── parser/
│   │   └── command-parser.ts # Natural language command parser
│   ├── rag/
│   │   ├── gemini-client.ts  # Gemini embeddings client
│   │   └── context-searcher.ts # RAG context searcher (Supabase)
│   └── prompts/
│       └── prompt-builder.ts # Structured prompt builder
├── dist/                     # Build output (generated)
├── Dockerfile                # Docker configuration
├── railway.json              # Railway deployment config
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Development

Your code is organized as:

- `src/index.ts` - MCP server with tools, resources, and prompts
- `src/server.ts` - Express HTTP server with MCP transport
- `src/lib/env.ts` - Environment variables validation
- `src/parser/command-parser.ts` - Parses natural language commands
- `src/rag/gemini-client.ts` - Generates embeddings using Gemini API
- `src/rag/context-searcher.ts` - Searches context in Supabase using RAG
- `src/prompts/prompt-builder.ts` - Builds structured prompts with context
- `tsconfig.json` - TypeScript configuration
- `Dockerfile` - Container configuration for deployment

### Architecture

The `dev-task` prompt uses the following flow:

1. **Command Parsing**: Extracts tool, scope, and requirements from natural language
2. **Context Search**: Performs 4 parallel semantic searches in Supabase:
   - Technology/stack information
   - Folder structure patterns
   - Code conventions
   - Similar examples
3. **Prompt Building**: Combines search results into structured prompts
4. **Response**: Returns prompt ready for development agents

All RAG operations are transparent to the user - they only see the final prompt result.

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

## Available Prompts

### `dev-task`

Generates context-aware development prompts using RAG (Retrieval-Augmented Generation). This prompt automatically searches for relevant context from the monorepo documentation and generates structured prompts for development agents.

**How it works:**

1. Parses natural language commands to extract tool, scope, and requirements
2. Searches for relevant context using semantic similarity (embeddings)
3. Generates structured prompts with:
   - Technical context (technology stack, frameworks)
   - Project structure (folder organization, patterns)
   - Code conventions (naming, imports, components)
   - Similar examples (if available)

**Input:**

- `command` (string): Development command in natural language

**Examples:**

```json
{
  "command": "dev rac implementa la nueva sección booking-search"
}
```

```json
{
  "command": "test partners add unit tests for auth flow"
}
```

```json
{
  "command": "refactor global improve code structure"
}
```

**Supported Commands:**

- **Tools**: `dev`, `test`, `refactor`, `fix`, `update` (and variants)
- **Scopes**: `rac`, `partners`, `global`, `web`, `mobile`, `suppliers`, `notifications`, `queues`
- **Requirements**: Any natural language description of the task

**Output:**

Returns a structured prompt with:

- System context (monorepo structure, conventions, principles)
- Technical context from RAG search
- Project structure from RAG search
- Code conventions from RAG search
- Similar examples from RAG search
- Specific task instructions

**Note:** The RAG search is completely transparent to the user. The prompt automatically includes relevant context from the monorepo documentation stored in Supabase.

## Learn More

- [MCP Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Railway Docs](https://docs.railway.app)
- [Docker Documentation](./DOCKER.md)

## License

ISC

## A mejorar

### contexto adaptado a la aplicación o scope

En algunas aplicaciones del monorepo tenemos contextos que son muy específicos para la aplicación. Tenemos aplicaciones con nextjs y con vite que algunas tienen nomenclaturas y tecnologías distintas, por eso en su readme hemos agregado contexto especifico. Este contexto lo tendremos también en el rag context searcher.

### Tareas

Implementa tarea por tarea y no todo a la vez.
Cada vez que termines una tarea, actualiza el archivo de tareas con la tarea completada (si existe).
Espera la confirmación del usuario para continuar con la siguiente tarea.

### Tests

Tenemos que indicarle la nomenclatura a utilizar en los unit tests.
Para los mocks usar los mocks que tenemos en el paquete @crac/fake-api. Si no existe un mock crearlo con datos de pruebas.

Intentar evitar warnings de act warnings.
Evitar complejidades innecesarias en el código de los tests.
Si en la feature usamos servicios hay que hacer los mocks para evitar llamadas reales.
Como mínimo lleva los test a un 80% de cobertura.

### Code style

Usamos siempre que sea posible import con aliases

X no a agregado la nueva feature en el menu
x ha implementado algunos test muy complejos
x Ha intentado ejecutar todos los test de la aplicación en vez de los de la feature
x en los test no ha utilizado @crac/fake-api para los mocks
x ha dejado muchos test con errores de tipos y eslint
x ha utilizado mal los handlers. En un formulario ha agregado el submit inline en vez de en el handler.
x Ha creado carpetas vacías, porque lo ponía el contexto. Debería crearlas solo si le hacen falta archivos de ese tipo
x Renombra propiedades sin sentido. Ejemplo `const { delete: deleteRequest, save, roles, permissions: permissionsList, role: roleFromState } = useRoleSelector();` debería de usar las que retorna el hook a como norma general
x quizás deberíamos pedirle al agente que le pregunte al usuario ciertas decisiones que debe de tomar y con eso ya que genere las tareas. Por ejemplo: Que rol tendrá esta sección? Agrego la sección al menu o dashboard?
x ha creado una sola página y las distintas rutas la ha implementado condicionando el path para mostrar una cosa u otra.
