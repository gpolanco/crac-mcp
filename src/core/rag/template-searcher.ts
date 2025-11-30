/**
 * Template searcher module
 * Searches for specific templates (PRD, tasks, subtasks) in Supabase using semantic similarity
 */

import { generateEmbedding } from "./gemini-client.js";
import {
  type SearchResult,
  searchSimilarContexts,
} from "./context-searcher.js";

/**
 * Template context structure containing the three required templates
 */
export interface TemplateContext {
  prdTemplate: string;
  tasksTemplate: string;
  subtasksTemplate: string;
}

/**
 * Template searcher class
 * Handles semantic search for templates stored in embeddings
 */
export class TemplateSearcher {
  /**
   * Searches for the three required templates (PRD, tasks, subtasks)
   * Searches in parallel for better performance
   *
   * @returns Promise resolving to TemplateContext object with all three templates
   * @throws Error if templates cannot be found
   */
  async searchTemplates(): Promise<TemplateContext> {
    // Build queries for each template
    const queries = [
      {
        query: "create-prd product requirements document template guide",
        scopes: ["prd-template"],
        topK: 1,
        template: "prdTemplate" as const,
      },
      {
        query: "generate-tasks task list template guide",
        scopes: ["tasks-template"],
        topK: 1,
        template: "tasksTemplate" as const,
      },
      {
        query: "implement-task subtask implementation template guide",
        scopes: ["subtasks-template"],
        topK: 1,
        template: "subtasksTemplate" as const,
      },
    ];

    // Search all templates in parallel
    const searchPromises = queries.map(async (queryConfig) => {
      const embedding = await generateEmbedding(queryConfig.query);

      const results = await searchSimilarContexts(
        embedding,
        ["global"], // Templates are typically in global scope
        queryConfig.scopes,
        queryConfig.topK
      );

      // Combine results into single template content
      const templateContent =
        results.length > 0
          ? results
              .map(
                (r) =>
                  `--- ${r.title} (${r.app}/${r.scope}) ---\n${r.content}`
              )
              .join("\n\n")
          : "";

      return {
        template: queryConfig.template,
        content: templateContent,
        found: results.length > 0,
      };
    });

    const searchResults = await Promise.all(searchPromises);

    // Extract templates
    const prdResult = searchResults.find(
      (r: { template: string }) => r.template === "prdTemplate"
    );
    const tasksResult = searchResults.find(
      (r: { template: string }) => r.template === "tasksTemplate"
    );
    const subtasksResult = searchResults.find(
      (r: { template: string }) => r.template === "subtasksTemplate"
    );

    // Build template context
    const templateContext: TemplateContext = {
      prdTemplate:
        prdResult?.content ||
        "# PRD Template\n\n*Template not found in embeddings. Using fallback.*",
      tasksTemplate:
        tasksResult?.content ||
        "# Tasks Template\n\n*Template not found in embeddings. Using fallback.*",
      subtasksTemplate:
        subtasksResult?.content ||
        "# Subtasks Template\n\n*Template not found in embeddings. Using fallback.*",
    };

    return templateContext;
  }
}

