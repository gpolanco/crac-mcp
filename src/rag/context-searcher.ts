/**
 * Context searcher module
 * Searches for relevant context in Supabase using semantic similarity
 * Note: Embeddings are already stored in the database (created by rag-playground)
 * This module only generates embeddings for search queries
 */

import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "./gemini-client.js";

if (!process.env.SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL environment variable");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Search result from Supabase
 */
export interface SearchResult {
  id: number;
  app: string;
  scope: string;
  title: string;
  path: string | null;
  content: string;
  distance: number;
}

/**
 * RAG context structure containing different aspects of context
 */
export interface RAGContext {
  technology: string;
  folderStructure: string;
  conventions: string;
  examples: string;
  architecture: string;
}

/**
 * Searches for similar contexts in Supabase using the RPC function
 *
 * @param queryEmbedding - The embedding vector for the search query
 * @param apps - Array of app names to search in
 * @param scopes - Optional array of scope names to filter by
 * @param topK - Maximum number of results to return (default: 2)
 * @returns Promise resolving to array of SearchResult objects
 * @throws Error if the RPC function call fails
 */
async function searchSimilarContexts(
  queryEmbedding: number[],
  apps: string[],
  scopes?: string[],
  topK: number = 2
): Promise<SearchResult[]> {
  // Convert embedding array to string format for pgvector
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  const { data, error } = await supabase.rpc("match_dev_contexts", {
    query_embedding: embeddingStr,
    match_apps: apps,
    match_scopes: scopes || null,
    match_count: topK,
  });

  if (error) {
    throw new Error(
      `Failed to search contexts: ${error.message}. Make sure the RPC function 'match_dev_contexts' exists in Supabase.`
    );
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    app: row.app,
    scope: row.scope,
    title: row.title,
    path: row.path,
    content: row.content,
    distance: row.distance || 0,
  }));
}

/**
 * Validates that a scope exists in the dev_apps table
 *
 * @param scope - The scope key to validate
 * @returns Promise resolving to true if scope exists and is active, false otherwise
 */
async function validateScope(scope: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("dev_apps")
    .select("key, is_active")
    .eq("key", scope)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Gets all active scopes from dev_apps table
 *
 * @returns Promise resolving to array of active scope keys
 */
async function getActiveScopes(): Promise<string[]> {
  const { data, error } = await supabase
    .from("dev_apps")
    .select("key")
    .eq("is_active", true);

  if (error || !data) {
    return [];
  }

  return data.map((row) => row.key);
}

/**
 * Context searcher class
 * Handles semantic search for development context using RAG
 */
export class ContextSearcher {
  /**
   * Searches for context relevant to the given requirements, scope, and tool
   * Performs 4 parallel searches for different aspects:
   * - Technology/stack
   * - Folder structure
   * - Code conventions
   * - Similar examples
   *
   * @param requirements - The task requirements/description
   * @param scope - The application scope (rac, partners, global, etc.)
   * @param tool - The development tool/action (dev, test, refactor, etc.)
   * @returns Promise resolving to RAGContext object with combined results
   * @throws Error if scope validation fails or search fails
   */
  async searchContext(
    requirements: string,
    scope: string,
    tool: string
  ): Promise<RAGContext> {
    const startTime = Date.now();

    // Validate scope exists
    const isValidScope = await validateScope(scope);
    if (!isValidScope) {
      const availableScopes = await getActiveScopes();
      throw new Error(
        `Invalid scope: "${scope}". Available scopes: ${availableScopes.join(
          ", "
        )}`
      );
    }

    // Build queries for different aspects
    const queries = [
      {
        query: `${scope} technology stack framework libraries dependencies`,
        apps: [scope, "global"],
        scopes: ["architecture", "introduction"],
        topK: 2,
        aspect: "technology" as const,
      },
      {
        query: `${scope} folder structure directory organization file layout`,
        apps: [scope, "global"],
        scopes: ["architecture", "routing"],
        topK: 2,
        aspect: "folderStructure" as const,
      },
      {
        query: `${scope} code conventions style guide patterns best practices`,
        apps: [scope, "global"],
        scopes: ["style-guide", "architecture"],
        topK: 2,
        aspect: "conventions" as const,
      },
      {
        query: `${tool} ${requirements} example implementation similar`,
        apps: [scope, "global"],
        scopes: ["tasks-examples", "core"],
        topK: 2,
        aspect: "examples" as const,
      },
    ];

    // Log queries
    console.log(
      `[ContextSearcher] Searching context for scope: ${scope}, tool: ${tool}`
    );
    console.log(`[ContextSearcher] Requirements: ${requirements}`);
    queries.forEach((q, idx) => {
      console.log(
        `[ContextSearcher] Query ${idx + 1} (${q.aspect}): ${q.query}`
      );
    });

    // Generate embeddings and search in parallel
    const searchPromises = queries.map(async (queryConfig) => {
      const queryStartTime = Date.now();

      // Generate embedding for the query
      const embedding = await generateEmbedding(queryConfig.query);

      // Search in Supabase
      const results = await searchSimilarContexts(
        embedding,
        queryConfig.apps,
        queryConfig.scopes,
        queryConfig.topK
      );

      const queryEndTime = Date.now();
      const queryTime = queryEndTime - queryStartTime;

      // Log results
      console.log(
        `[ContextSearcher] Query ${queryConfig.aspect} completed in ${queryTime}ms, found ${results.length} results`
      );
      results.forEach((r, idx) => {
        console.log(
          `[ContextSearcher]   Result ${idx + 1}: ${r.title} (${r.app}/${
            r.scope
          }, distance: ${r.distance.toFixed(4)})`
        );
      });

      return {
        aspect: queryConfig.aspect,
        results,
        time: queryTime,
      };
    });

    // Execute all searches in parallel
    const searchResults = await Promise.all(searchPromises);

    // Combine results into RAGContext
    const ragContext: RAGContext = {
      technology: this.combineResults(
        searchResults.find((r) => r.aspect === "technology")?.results || []
      ),
      folderStructure: this.combineResults(
        searchResults.find((r) => r.aspect === "folderStructure")?.results || []
      ),
      conventions: this.combineResults(
        searchResults.find((r) => r.aspect === "conventions")?.results || []
      ),
      examples: this.combineResults(
        searchResults.find((r) => r.aspect === "examples")?.results || []
      ),
      architecture: "",
    };

    // Combine technology and folder structure for architecture
    ragContext.architecture = `${ragContext.technology}\n\n${ragContext.folderStructure}`;

    const totalTime = Date.now() - startTime;
    const totalTokens = queries.length; // One embedding per query

    console.log(
      `[ContextSearcher] Total search time: ${totalTime}ms, queries: ${queries.length}, tokens: ${totalTokens}`
    );

    return ragContext;
  }

  /**
   * Combines search results into a formatted string with metadata
   *
   * @param results - Array of SearchResult objects
   * @returns Formatted string with combined results
   */
  private combineResults(results: SearchResult[]): string {
    if (results.length === 0) {
      return "";
    }

    return results
      .map(
        (r, idx) =>
          `--- ${r.title} (${r.app}/${r.scope}, distance: ${r.distance.toFixed(
            4
          )}) ---\n${r.content}`
      )
      .join("\n\n");
  }
}
