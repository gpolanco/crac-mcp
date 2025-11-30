/**
 * Content Categories
 * Organized hierarchical categories for RAG content classification
 * Used to filter and search content in Supabase by purpose/type
 */

/**
 * Content category constants organized by purpose
 * These match the scope values used in Supabase dev_scopes table
 *
 * TODO: extract from supabase dev_scopes table
 */
export const ContentCategory = {
  /**
   * Rules and conventions categories
   */
  RULES: {
    /** General CRAC monorepo rules and conventions */
    CRAC: "rules/crac",
    /** Testing rules and conventions (Jest, RTL, patterns) */
    TESTING: "rules/testing",
    /** API endpoint implementation rules */
    ENDPOINTS: "rules/endpoints",
    /** Code style and naming conventions */
    CODE_STYLE: "rules/code-style",
    /** Directory structure and organization rules */
    STRUCTURE: "rules/structure",
  },

  /**
   * Architecture categories
   */
  ARCHITECTURE: {
    /** General architecture documentation */
    GENERAL: "architecture",
    /** Routing architecture */
    ROUTING: "architecture/routing",
    /** State management architecture */
    STATE: "architecture/state",
  },

  /**
   * Style guide categories
   */
  STYLE_GUIDE: {
    /** General style guide */
    GENERAL: "style-guide",
    /** Naming conventions */
    NAMING: "style-guide/naming",
  },

  /**
   * Template categories
   */
  TEMPLATES: {
    /** PRD template */
    PRD: "templates/prd",
    /** Tasks template */
    TASKS: "templates/tasks",
    /** Subtasks template */
    SUBTASKS: "templates/subtasks",
  },

  /**
   * Example categories
   */
  EXAMPLES: {
    /** General examples */
    GENERAL: "examples",
    /** Task examples */
    TASKS: "examples/tasks",
  },

  /**
   * Introduction categories
   */
  INTRODUCTION: "introduction",
} as const;

/**
 * Type for content category values
 */
export type ContentCategoryValue =
  | (typeof ContentCategory.RULES)[keyof typeof ContentCategory.RULES]
  | (typeof ContentCategory.ARCHITECTURE)[keyof typeof ContentCategory.ARCHITECTURE]
  | (typeof ContentCategory.STYLE_GUIDE)[keyof typeof ContentCategory.STYLE_GUIDE]
  | (typeof ContentCategory.TEMPLATES)[keyof typeof ContentCategory.TEMPLATES]
  | (typeof ContentCategory.EXAMPLES)[keyof typeof ContentCategory.EXAMPLES]
  | typeof ContentCategory.INTRODUCTION;
