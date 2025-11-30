/**
 * CRAC Rules Provider
 * Core logic for providing CRAC monorepo rules and conventions
 * Uses RAG (Retrieval-Augmented Generation) to search for relevant rules from Supabase
 */

import { ContextSearcher } from "../rag/context-searcher.js";
import { CracRulesDetector, CracRuleType } from "./crac-rules-detector.js";

/**
 * CRAC Rules Provider class
 * Provides access to different types of CRAC rules based on context
 * Uses semantic search (RAG) to find relevant rules from Supabase
 */
export class CracRulesProvider {
  private contextSearcher: ContextSearcher;
  private detector: CracRulesDetector;

  constructor() {
    this.contextSearcher = new ContextSearcher();
    this.detector = new CracRulesDetector();
  }

  /**
   * Gets CRAC rules based on context
   * Automatically detects which rules are needed and searches using RAG
   *
   * @param context - Optional context/query from user to determine which rules to provide
   * @returns Promise resolving to object with rules content and metadata
   */
  async getRules(context?: string): Promise<{
    content: string;
    ruleTypes: CracRuleType[];
    description: string;
  }> {
    // Detect which rules are needed
    const ruleTypes = this.detector.detectRules(context);
    const description = this.detector.getRulesDescription(ruleTypes);

    // Map rule types to RAG categories
    const ragCategories = this.detector.getRagCategories(ruleTypes);

    // Search for rules using RAG
    const content = await this.contextSearcher.searchRules(
      context || "",
      ragCategories.length > 0 ? ragCategories : undefined,
      5 // topK: get up to 5 results per category
    );

    // If RAG returns empty content, provide informative message
    const finalContent =
      content ||
      "No CRAC rules found. Make sure the rules are ingested in Supabase with the correct categories.";

    return {
      content: finalContent,
      ruleTypes,
      description,
    };
  }
}
