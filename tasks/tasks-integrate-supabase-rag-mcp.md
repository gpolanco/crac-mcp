# Task List: Integración de Supabase y RAG en crac-mcp

Generated from: prd-integrate-supabase-rag-mcp.md

## Overview

This task list breaks down the implementation of Supabase and RAG integration in the crac-mcp server. The feature will enable the MCP to search for relevant context from the monorepo using semantic similarity and generate structured prompts for development agents.

## Relevant Files

- `package.json` - Add dependencies (@supabase/supabase-js, @google/generative-ai) and update scripts if needed
- `src/parser/command-parser.ts` - Parser module to extract tool, scope, and requirements from natural language commands
- `src/rag/gemini-client.ts` - Gemini client for generating embeddings using text-embedding-004 model
- `src/rag/context-searcher.ts` - Context searcher that queries Supabase using RPC function for semantic similarity search
- `src/prompts/prompt-builder.ts` - Prompt builder that constructs structured prompts with context for development agents
- `src/index.ts` - MCP server implementation (update to register new dev-task prompt)
- `.env.example` - Example environment variables file (if it exists, update it; if not, create it)
- `README.md` - Update documentation with new prompt usage and environment variables

### Notes

- Follow existing project structure and naming conventions in crac-mcp
- Use TypeScript strict mode
- Export types/interfaces for all modules
- Document public functions with JSDoc
- Maintain compatibility with existing tools (hello, get-info)
- Use the same Supabase database as rag-playground
- Maximum 2 results per context aspect (configurable)
- Log queries, results, tokens, and timing for debugging
- Validate scope exists in dev_apps table, return clear error with available scopes if not found
- Support only single scope per command (no multiple scopes)

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:

- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
- [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/integrate-supabase-rag`)

- [x] 1.0 Set up dependencies and configuration
- [x] 1.1 Add `@supabase/supabase-js` dependency (version ^2.47.10) to package.json
- [x] 1.2 Add `@google/generative-ai` dependency (version ^0.21.0) to package.json
- [x] 1.3 Run `pnpm install` to install new dependencies
- [x] 1.4 Create or update `.env.example` file with required environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY)
- [x] 1.5 Create environment validation utility function to check all required env vars are present
- [x] 1.6 Add validation call in server.ts or index.ts to validate env vars on startup
- [x] 1.7 Test that server fails gracefully with clear error message if env vars are missing

- [x] 2.0 Implement command parser
- [x] 2.1 Create `src/parser/command-parser.ts` file
- [x] 2.2 Define `ParsedCommand` interface with tool, scope, requirements, and raw fields
- [x] 2.3 Implement tool pattern matching (dev, test, refactor, fix, update and variants) - case insensitive
- [x] 2.4 Implement scope pattern matching (rac, partners, global, web, mobile, suppliers, notifications, queues) - case insensitive
- [x] 2.5 Implement `parseCommand` function that extracts tool, scope, and requirements from natural language
- [x] 2.6 Add default values: tool="dev", scope="global" if not detected
- [x] 2.7 Handle commands without explicit tool or scope
- [x] 2.8 Export `parseCommand` function and `ParsedCommand` type
- [x] 2.9 Add JSDoc documentation for the parseCommand function
- [x] 2.10 Test parser with various command formats (with/without tool, with/without scope, case variations)

- [ ] 3.0 Implement Gemini client for embeddings
- [ ] 3.1 Create `src/rag/gemini-client.ts` file
- [ ] 3.2 Import GoogleGenerativeAI from @google/generative-ai
- [ ] 3.3 Validate GEMINI_API_KEY environment variable on module load
- [ ] 3.4 Initialize GoogleGenerativeAI client with GEMINI_API_KEY
- [ ] 3.5 Define EMBEDDING_MODEL constant as "text-embedding-004"
- [ ] 3.6 Define EMBEDDING_DIMENSION constant as 768
- [ ] 3.7 Implement `generateEmbedding` function that takes text string and returns Promise<number[]>
- [ ] 3.8 Use model.embedContent() to generate embeddings
- [ ] 3.9 Validate that embedding has 768 dimensions, throw error if not
- [ ] 3.10 Handle errors from Gemini API with descriptive error messages
- [ ] 3.11 Export `generateEmbedding`, `EMBEDDING_DIMENSION`, and `EMBEDDING_MODEL`
- [ ] 3.12 Add JSDoc documentation for generateEmbedding function
- [ ] 3.13 Test embedding generation with sample text

- [ ] 4.0 Implement context searcher with Supabase integration
- [ ] 4.1 Create `src/rag/context-searcher.ts` file
- [ ] 4.2 Import createClient from @supabase/supabase-js
- [ ] 4.3 Import generateEmbedding from gemini-client
- [ ] 4.4 Validate SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables on module load
- [ ] 4.5 Initialize Supabase client with service role key (no auth, no session persistence)
- [ ] 4.6 Define SearchResult interface (id, app, scope, title, path, content, distance)
- [ ] 4.7 Define RAGContext interface (technology, folderStructure, conventions, examples, architecture)
- [ ] 4.8 Implement `searchSimilarContexts` helper function that calls RPC match_dev_contexts
- [ ] 4.9 Convert embedding array to string format for pgvector: `[${embedding.join(",")}]`
- [ ] 4.10 Handle RPC errors - fail with clear error message (no fallback per PRD)
- [ ] 4.11 Implement ContextSearcher class with searchContext method
- [ ] 4.12 In searchContext, build 4 parallel queries for different aspects:
  - Technology/stack: apps=[scope, "global"], scopes=["architecture", "introduction"], topK=2
  - Folder structure: apps=[scope, "global"], scopes=["architecture", "routing"], topK=2
  - Code conventions: apps=[scope, "global"], scopes=["style-guide", "architecture"], topK=2
  - Similar examples: apps=[scope, "global"], scopes=["tasks-examples", "core"], topK=2
- [ ] 4.13 Generate embeddings for each query using generateEmbedding
- [ ] 4.14 Execute all searches in parallel using Promise.all
- [ ] 4.15 Combine results into RAGContext object with combineResults helper method
- [ ] 4.16 Implement combineResults method that formats SearchResult[] into string with metadata
- [ ] 4.17 Add logging for queries, results, tokens, and timing
- [ ] 4.18 Export ContextSearcher class and interfaces
- [ ] 4.19 Add JSDoc documentation for ContextSearcher class and methods
- [ ] 4.20 Test context search with sample queries

- [ ] 5.0 Implement prompt builder
- [ ] 5.1 Create `src/prompts/prompt-builder.ts` file
- [ ] 5.2 Import ParsedCommand from parser module
- [ ] 5.3 Import RAGContext from context-searcher
- [ ] 5.4 Define StructuredPrompt interface (system, user, context)
- [ ] 5.5 Implement PromptBuilder class with buildPrompt method
- [ ] 5.6 Implement buildSystemPrompt method that includes:
  - Technical context (technology and stack)
  - Project structure
  - Code conventions
  - Development principles (SOLID, Clean Code)
- [ ] 5.7 Implement buildUserPrompt method that includes:
  - Specific task (tool + requirements)
  - Similar examples if available
  - Instructions to follow conventions
- [ ] 5.8 Include metadata in prompts (app, scope, distance) from context
- [ ] 5.9 Export PromptBuilder class and StructuredPrompt interface
- [ ] 5.10 Add JSDoc documentation for PromptBuilder class and methods
- [ ] 5.11 Test prompt generation with sample commands and context

- [ ] 6.0 Integrate with MCP server
- [ ] 6.1 Open `src/index.ts` file
- [ ] 6.2 Import parseCommand from parser module
- [ ] 6.3 Import ContextSearcher from context-searcher module
- [ ] 6.4 Import PromptBuilder from prompt-builder module
- [ ] 6.5 Initialize ContextSearcher instance in createMcpServer function
- [ ] 6.6 Initialize PromptBuilder instance in createMcpServer function
- [ ] 6.7 Register new MCP prompt "dev-task" using server.registerPrompt
- [ ] 6.8 Define argsSchema with command field (z.string().describe(...))
- [ ] 6.9 Implement prompt handler that:
  - Parses the command using parseCommand
  - Searches context using contextSearcher.searchContext
  - Builds structured prompt using promptBuilder.buildPrompt
  - Returns messages array with system and user roles
- [ ] 6.10 Add error handling in prompt handler - return error message in user role if something fails
- [ ] 6.11 Log errors for debugging
- [ ] 6.12 Verify existing tools (hello, get-info) still work
- [ ] 6.13 Test dev-task prompt with sample commands

- [ ] 7.0 Add scope validation
- [ ] 7.1 In context-searcher.ts, add method to validate scope exists in dev_apps table
- [ ] 7.2 Query dev_apps table to check if scope key exists and is active
- [ ] 7.3 If scope doesn't exist, query all active apps from dev_apps table
- [ ] 7.4 Return clear error message with list of available scopes if validation fails
- [ ] 7.5 Call scope validation in searchContext before performing searches
- [ ] 7.6 Test scope validation with valid and invalid scopes

- [ ] 8.0 Testing and validation
- [ ] 8.1 Test parser with various command formats:
  - "dev rac implementa la nueva sección booking-search"
  - "test partners add unit tests"
  - "refactor global improve code structure"
  - Commands without explicit tool or scope
  - Case variations
- [ ] 8.2 Test embedding generation with different text lengths
- [ ] 8.3 Test context search with different scopes and queries
- [ ] 8.4 Test prompt generation end-to-end with real commands
- [ ] 8.5 Test error handling:
  - Missing environment variables
  - Invalid scope
  - RPC function not found
  - Gemini API errors
  - Supabase connection errors
- [ ] 8.6 Verify logging works correctly (queries, results, tokens, timing)
- [ ] 8.7 Test that existing MCP tools (hello, get-info) still function
- [ ] 8.8 Measure performance - ensure total time < 5 seconds for typical queries
- [ ] 8.9 Test with actual Supabase database (ensure RPC function exists)

- [ ] 9.0 Documentation and cleanup
- [ ] 9.1 Update README.md with:
  - New dev-task prompt usage
  - Required environment variables
  - Example commands
  - Architecture overview
- [ ] 9.2 Add JSDoc comments to all public functions and classes
- [ ] 9.3 Ensure all TypeScript types are exported where needed
- [ ] 9.4 Verify code follows SOLID principles and Clean Code practices
- [ ] 9.5 Run `pnpm build` to ensure TypeScript compilation succeeds
- [ ] 9.6 Run `pnpm test:types` to check for type errors
- [ ] 9.7 Review code for any hardcoded values that should be configurable
- [ ] 9.8 Remove any console.log statements used for debugging (replace with proper logging if needed)
