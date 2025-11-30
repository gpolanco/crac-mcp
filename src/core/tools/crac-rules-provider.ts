/**
 * CRAC Rules Provider
 * Core logic for providing CRAC monorepo rules and conventions
 */

import { AgentRulesReader } from "../resources/agent-rules-reader.js";
import { CracRulesDetector, CracRuleType } from "./crac-rules-detector.js";

/**
 * CRAC Rules Provider class
 * Provides access to different types of CRAC rules based on context
 */
export class CracRulesProvider {
  private reader: AgentRulesReader;
  private detector: CracRulesDetector;

  constructor() {
    this.reader = new AgentRulesReader();
    this.detector = new CracRulesDetector();
  }

  /**
   * Gets CRAC rules based on context
   * Automatically detects which rules are needed
   *
   * @param context - Optional context/query from user to determine which rules to provide
   * @returns Object with rules content and metadata
   */
  getRules(context?: string): {
    content: string;
    ruleTypes: CracRuleType[];
    description: string;
  } {
    // Detect which rules are needed
    const ruleTypes = this.detector.detectRules(context);
    const description = this.detector.getRulesDescription(ruleTypes);

    // Get rules content based on detected types
    let content = "";

    if (ruleTypes.includes(CracRuleType.ALL)) {
      // Return all rules
      const result = this.reader.readRules("crac-rules://all");
      if (
        result.contents.length > 0 &&
        !result.contents[0].text.startsWith("Error:")
      ) {
        content = result.contents[0].text;
      } else {
        content = "Error: Could not load CRAC rules";
      }
    } else {
      // Combine specific rule types
      const ruleContents: string[] = [];

      for (const ruleType of ruleTypes) {
        let ruleContent = "";
        switch (ruleType) {
          case CracRuleType.TESTING:
          case CracRuleType.STRUCTURE:
          case CracRuleType.CODE_STYLE:
            // These are in crac-config.mdc
            const configResult = this.reader.readRules(
              "crac-rules://crac-config"
            );
            if (
              configResult.contents.length > 0 &&
              !configResult.contents[0].text.startsWith("Error:")
            ) {
              ruleContent = configResult.contents[0].text;
            }
            break;
          case CracRuleType.ENDPOINTS:
            // This is in endpoints.mdc
            const endpointsResult = this.reader.readRules(
              "crac-rules://endpoints"
            );
            if (
              endpointsResult.contents.length > 0 &&
              !endpointsResult.contents[0].text.startsWith("Error:")
            ) {
              ruleContent = endpointsResult.contents[0].text;
            }
            break;
        }
        if (ruleContent) {
          ruleContents.push(ruleContent);
        }
      }

      // Combine all rule contents, removing duplicates
      const uniqueContents = Array.from(new Set(ruleContents));
      content = uniqueContents.join("\n\n---\n\n");

      if (!content) {
        // Fallback to all rules if specific rules couldn't be loaded
        const fallbackResult = this.reader.readRules("crac-rules://all");
        if (
          fallbackResult.contents.length > 0 &&
          !fallbackResult.contents[0].text.startsWith("Error:")
        ) {
          content = fallbackResult.contents[0].text;
        } else {
          content = "Error: Could not load CRAC rules";
        }
      }
    }

    return {
      content,
      ruleTypes,
      description,
    };
  }
}
