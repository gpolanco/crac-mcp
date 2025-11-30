/**
 * CRAC Rules Detector
 * Analyzes context to determine which CRAC rules to provide
 */

import { ContentCategory } from "../rag/content-categories.js";

/**
 * Types of rules available
 */
export enum CracRuleType {
  TESTING = "testing",
  STRUCTURE = "structure",
  ENDPOINTS = "endpoints",
  CODE_STYLE = "code_style",
  ALL = "all",
}

/**
 * Rule detection pattern
 */
interface RulePattern {
  type: CracRuleType;
  keywords: string[];
  description: string;
}

/**
 * CRAC Rules Detector class
 * Detects which rules are needed based on user context
 */
export class CracRulesDetector {
  private patterns: RulePattern[] = [
    {
      type: CracRuleType.TESTING,
      keywords: [
        "test",
        "testing",
        "tests",
        "spec",
        "specs",
        "jest",
        "rtl",
        "react testing library",
        "unit test",
        "integration test",
        "e2e test",
        "test file",
        "test suite",
        "describe",
        "it(",
        "test(",
        "expect",
        "mock",
        "snapshot",
      ],
      description: "Testing rules and conventions",
    },
    {
      type: CracRuleType.STRUCTURE,
      keywords: [
        "structure",
        "folder",
        "directory",
        "organize",
        "architecture",
        "feature",
        "module",
        "create feature",
        "new feature",
        "folder structure",
        "file structure",
        "directory structure",
        "organize code",
        "screaming architecture",
      ],
      description: "Directory structure and organization rules",
    },
    {
      type: CracRuleType.ENDPOINTS,
      keywords: [
        "endpoint",
        "endpoints",
        "api",
        "service",
        "redux action",
        "create service",
        "api service",
        "service file",
        "endpoints.ts",
        "service.ts",
        "actions.ts",
        "screaming architecture",
        "module structure",
        "entities",
        "state/actions",
      ],
      description: "API endpoint and service implementation rules",
    },
    {
      type: CracRuleType.CODE_STYLE,
      keywords: [
        "code style",
        "convention",
        "conventions",
        "naming",
        "component",
        "import",
        "export",
        "pascalcase",
        "camelcase",
        "code style",
        "coding standards",
        "style guide",
      ],
      description: "Code style and naming conventions",
    },
  ];

  /**
   * Detects which rule type(s) are needed based on context
   *
   * @param context - User's query or context (optional)
   * @returns Array of rule types to provide, ordered by relevance
   */
  detectRules(context?: string): CracRuleType[] {
    if (!context || context.trim().length === 0) {
      return [CracRuleType.ALL];
    }

    const normalizedContext = context.toLowerCase();
    const matches: Map<CracRuleType, number> = new Map();

    // Score each rule type based on keyword matches
    for (const pattern of this.patterns) {
      let score = 0;
      for (const keyword of pattern.keywords) {
        if (normalizedContext.includes(keyword)) {
          score += 1;
        }
      }
      if (score > 0) {
        matches.set(pattern.type, score);
      }
    }

    // If no matches found, return all rules
    if (matches.size === 0) {
      return [CracRuleType.ALL];
    }

    // Sort by score (highest first) and return rule types
    const sorted = Array.from(matches.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    // If multiple matches, include the top ones (threshold: score >= 2 or top 2)
    const topMatches = sorted.filter((_, index) => {
      const score = matches.get(sorted[index]) || 0;
      return index < 2 || score >= 2;
    });

    return topMatches.length > 0 ? topMatches : [CracRuleType.ALL];
  }

  /**
   * Gets description of what rules will be provided
   *
   * @param ruleTypes - Array of rule types
   * @returns Human-readable description
   */
  getRulesDescription(ruleTypes: CracRuleType[]): string {
    if (ruleTypes.length === 1 && ruleTypes[0] === CracRuleType.ALL) {
      return "All CRAC monorepo rules and conventions";
    }

    const descriptions = ruleTypes.map((type) => {
      const pattern = this.patterns.find((p) => p.type === type);
      return pattern?.description || type;
    });

    return descriptions.join(", ");
  }

  /**
   * Maps rule types to RAG content categories for Supabase search
   *
   * @param ruleTypes - Array of rule types to map
   * @returns Array of RAG category scope strings for filtering Supabase search
   */
  getRagCategories(ruleTypes: CracRuleType[]): string[] {
    const categories = new Set<string>();

    for (const ruleType of ruleTypes) {
      switch (ruleType) {
        case CracRuleType.TESTING:
          categories.add(ContentCategory.RULES.CRAC);
          categories.add(ContentCategory.RULES.TESTING);
          break;
        case CracRuleType.STRUCTURE:
          categories.add(ContentCategory.RULES.CRAC);
          categories.add(ContentCategory.RULES.STRUCTURE);
          break;
        case CracRuleType.ENDPOINTS:
          categories.add(ContentCategory.RULES.ENDPOINTS);
          break;
        case CracRuleType.CODE_STYLE:
          categories.add(ContentCategory.RULES.CRAC);
          categories.add(ContentCategory.RULES.CODE_STYLE);
          break;
        case CracRuleType.ALL:
          // Return all rule categories
          categories.add(ContentCategory.RULES.CRAC);
          categories.add(ContentCategory.RULES.ENDPOINTS);
          categories.add(ContentCategory.RULES.TESTING);
          categories.add(ContentCategory.RULES.STRUCTURE);
          categories.add(ContentCategory.RULES.CODE_STYLE);
          break;
      }
    }

    return Array.from(categories);
  }
}
