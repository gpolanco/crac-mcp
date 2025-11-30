/**
 * Command parser module
 * Parses natural language commands to extract tool, scope, and requirements
 */

/**
 * Parsed command structure
 */
export interface ParsedCommand {
  /** The tool/action to perform (dev, test, refactor, fix, update) */
  tool: string;
  /** The application scope (rac, partners, global, web, mobile, etc.) */
  scope: string;
  /** The remaining requirements/description of the task */
  requirements: string;
  /** The original raw command */
  raw: string;
}

/**
 * Tool patterns for matching development actions
 * Case-insensitive matching
 */
const TOOL_PATTERNS = [
  /^(generate-tasks|gen-tasks|generate|gen)\s+/i,
  /^(dev|develop|implement|create|add|build)\s+/i,
  /^(test|testing)\s+/i,
  /^(refactor|refactoring)\s+/i,
  /^(fix|bugfix|debug)\s+/i,
  /^(update|modify|change)\s+/i,
];

/**
 * Scope patterns for matching application names
 * Case-insensitive matching
 */
const SCOPE_PATTERNS = [
  /\b(rac|partners|global|web|mobile|suppliers|notifications|queues)\b/i,
];

/**
 * Default values when tool or scope are not detected
 */
const DEFAULT_TOOL = "dev";
const DEFAULT_SCOPE = "global";

/**
 * Parses a natural language command to extract tool, scope, and requirements
 *
 * @param command - The natural language command to parse
 * @returns ParsedCommand object with tool, scope, requirements, and raw command
 *
 * @example
 * ```typescript
 * parseCommand("dev rac implementa la nueva sección booking-search")
 * // Returns: { tool: "dev", scope: "rac", requirements: "implementa la nueva sección booking-search", raw: "..." }
 * ```
 */
export function parseCommand(command: string): ParsedCommand {
  const normalized = command.trim();

  if (!normalized) {
    return {
      tool: DEFAULT_TOOL,
      scope: DEFAULT_SCOPE,
      requirements: "",
      raw: normalized,
    };
  }

  // Extract tool
  let tool = DEFAULT_TOOL;
  let toolMatch: RegExpMatchArray | null = null;

  for (const pattern of TOOL_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      tool = match[1].toLowerCase();
      toolMatch = match;
      break;
    }
  }

  // Extract scope
  let scope = DEFAULT_SCOPE;
  let scopeMatch: RegExpMatchArray | null = null;

  for (const pattern of SCOPE_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      scope = match[1].toLowerCase();
      scopeMatch = match;
      break;
    }
  }

  // Extract requirements (remove tool and scope from command)
  let requirements = normalized;

  // Remove tool if found
  if (toolMatch) {
    requirements = requirements.replace(toolMatch[0], "").trim();
  }

  // Remove scope if found
  if (scopeMatch) {
    // Use word boundary to avoid partial matches
    const scopeRegex = new RegExp(`\\b${scope}\\b`, "gi");
    requirements = requirements.replace(scopeRegex, "").trim();
  }

  // Clean up multiple spaces
  requirements = requirements.replace(/\s+/g, " ").trim();

  // If requirements is empty after extraction, use the whole command
  if (!requirements) {
    requirements = normalized;
  }

  return {
    tool,
    scope,
    requirements,
    raw: normalized,
  };
}

