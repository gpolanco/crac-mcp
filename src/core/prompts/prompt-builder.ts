/**
 * Prompt builder module
 * Constructs structured prompts for development agents using parsed commands and RAG context
 */

import type { ParsedCommand } from "../parser/command-parser.js";
import type { RAGContext } from "../rag/context-searcher.js";
import { ContextSearcher } from "../rag/context-searcher.js";
import { ContentCategory } from "../rag/content-categories.js";

/**
 * Structured prompt with system and user messages
 */
export interface StructuredPrompt {
  /** System prompt with context and instructions */
  system: string;
  /** User prompt with specific task */
  user: string;
  /** Context metadata for reference */
  context: {
    technology: string;
    structure: string;
    conventions: string;
    examples: string;
  };
}

/**
 * Prompt builder class
 * Builds structured prompts for development agents with RAG context
 */
export class PromptBuilder {
  private contextSearcher?: ContextSearcher;

  /**
   * Sets the context searcher for automatic inclusion of CRAC rules via RAG
   *
   * @param searcher - The ContextSearcher instance
   */
  setContextSearcher(searcher: ContextSearcher): void {
    this.contextSearcher = searcher;
  }

  /**
   * Builds a structured prompt from a parsed command and RAG context
   *
   * @param command - The parsed command (tool, scope, requirements)
   * @param ragContext - The RAG context retrieved from Supabase
   * @returns Promise resolving to StructuredPrompt object with system and user messages
   */
  async buildPrompt(
    command: ParsedCommand,
    ragContext: RAGContext
  ): Promise<StructuredPrompt> {
    const systemPrompt = await this.buildSystemPrompt(command, ragContext);
    const userPrompt = this.buildUserPrompt(command, ragContext);

    return {
      system: systemPrompt,
      user: userPrompt,
      context: {
        technology: ragContext.technology,
        structure: ragContext.folderStructure,
        conventions: ragContext.conventions,
        examples: ragContext.examples,
      },
    };
  }

  /**
   * Builds the system prompt with technical context, structure, and conventions
   *
   * @param command - The parsed command
   * @param context - The RAG context
   * @returns Promise resolving to system prompt string
   */
  private async buildSystemPrompt(
    command: ParsedCommand,
    context: RAGContext
  ): Promise<string> {
    const scopeUpper = command.scope.toUpperCase();

    let systemPrompt = `You are an expert Full-Stack Engineer working on the ${scopeUpper} application in the CRAC (Centauro Rent a Car) monorepo.\n\n`;

    // Automatically include CRAC rules if context searcher is available
    if (this.contextSearcher) {
      try {
        const rulesContent = await this.contextSearcher.searchRules(
          "",
          [ContentCategory.RULES.CRAC],
          5
        );
        if (rulesContent && rulesContent.trim().length > 0) {
          systemPrompt += `## CRAC Monorepo Rules and Conventions\n\n`;
          systemPrompt += `*The following rules and conventions are MANDATORY and must be followed for all development tasks:*\n\n`;
          systemPrompt += `${rulesContent}\n\n`;
          systemPrompt += `---\n\n`;
        }
      } catch (error) {
        // Silently fail if rules cannot be loaded - don't break the prompt
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.warn(
          `[PromptBuilder] Failed to load CRAC rules: ${errorMessage}`
        );
      }
    }

    // Add metadata about the context
    systemPrompt += `**Context Information:**\n`;
    systemPrompt += `- Application: ${command.scope}\n`;
    systemPrompt += `- Task Type: ${command.tool}\n`;
    systemPrompt += `- Monorepo: CRAC Frontend Monorepo (pnpm workspaces + Turborepo)\n\n`;

    // Add monorepo structure context
    systemPrompt += `## Monorepo Structure\n\n`;
    systemPrompt += `This is a monorepo managed by pnpm workspaces and Turborepo:\n`;
    systemPrompt += `- **apps/**: Standalone applications (web, rac, partners, mobile, notifications, suppliers, queues)\n`;
    systemPrompt += `- **packages/**: Shared packages (@crac/core, @crac/design-system, @crac/components, etc.)\n`;
    systemPrompt += `- **config/**: Shared configurations (ESLint, TypeScript, Prettier)\n\n`;

    // Add technical context
    if (context.technology) {
      systemPrompt += `## Technical Context\n\n${context.technology}\n\n`;
    } else {
      // Fallback if no technology context found
      systemPrompt += `## Technical Context\n\n`;
      systemPrompt += `Core technologies used in the monorepo:\n`;
      systemPrompt += `- Language: TypeScript\n`;
      systemPrompt += `- UI Framework: React\n`;
      systemPrompt += `- State Management: Redux Toolkit (primarily)\n`;
      systemPrompt += `- Styling: Tailwind CSS\n`;
      systemPrompt += `- Build Tools: Vite (for most apps) or Next.js (for web app)\n`;
      systemPrompt += `- Testing: Jest + React Testing Library\n\n`;
    }

    // Add project structure
    if (context.folderStructure) {
      systemPrompt += `## Project Structure\n\n${context.folderStructure}\n\n`;
    } else {
      // Fallback structure information
      systemPrompt += `## Project Structure\n\n`;
      systemPrompt += `The application follows a **feature-driven architecture** (Screaming Architecture):\n\n`;
      systemPrompt += `\`\`\`\n`;
      systemPrompt += `src/features/<feature>/\n`;
      systemPrompt += `├── pages/          # Top-level components (views/screens)\n`;
      systemPrompt += `├── components/     # Reusable UI components\n`;
      systemPrompt += `├── hooks/          # Custom React hooks\n`;
      systemPrompt += `├── state/          # Redux slices (reducers, actions, selectors)\n`;
      systemPrompt += `├── types/          # TypeScript types\n`;
      systemPrompt += `├── utils/          # Utility functions\n`;
      systemPrompt += `└── routes.ts       # Route definitions\n`;
      systemPrompt += `\`\`\`\n\n`;
    }

    // Add code conventions
    if (context.conventions) {
      systemPrompt += `## Code Conventions\n\n${context.conventions}\n\n`;
    } else {
      // Fallback conventions
      systemPrompt += `## Code Conventions\n\n`;
      systemPrompt += `**Naming:**\n`;
      systemPrompt += `- PascalCase: Components, interfaces, types, enums\n`;
      systemPrompt += `- camelCase: Variables, functions, objects, folders, non-component files\n`;
      systemPrompt += `- Component files: PascalCase (e.g., BookingList.tsx)\n\n`;
      systemPrompt += `**Components:**\n`;
      systemPrompt += `- Use functional components with arrow functions\n`;
      systemPrompt += `- Use named exports (not default exports)\n`;
      systemPrompt += `- Define props using interfaces\n`;
      systemPrompt += `- Use fragments (<>) instead of div wrappers\n\n`;
      systemPrompt += `**Imports:**\n`;
      systemPrompt += `- Use path aliases: \`~/*\` for app code, \`@crac/*\` for shared packages\n`;
      systemPrompt += `- Import order: React → External libs → @crac/* → ~/* → Relative\n`;
      systemPrompt += `- Use \`type\` imports for TypeScript types\n\n`;
      systemPrompt += `**Shared Packages:**\n`;
      systemPrompt += `- \`@crac/core\`: Business logic, types, services (MUST use for shared logic)\n`;
      systemPrompt += `- \`@crac/design-system\`: UI components (PREFERRED for new components)\n`;
      systemPrompt += `- \`@crac/components\`: Legacy components (only for legacy code)\n\n`;
    }

    // Add development principles
    systemPrompt += `## Development Principles\n\n`;
    systemPrompt += `You will receive a specific development task. Follow these principles:\n\n`;
    systemPrompt += `**Code Quality:**\n`;
    systemPrompt += `- Apply SOLID principles and Clean Code practices\n`;
    systemPrompt += `- Write production-ready, maintainable code\n`;
    systemPrompt += `- Include proper TypeScript types (no \`any\` unless absolutely necessary)\n`;
    systemPrompt += `- Use custom hooks to separate presentation logic from business logic\n\n`;
    systemPrompt += `**Structure & Organization:**\n`;
    systemPrompt += `- Follow the feature-driven architecture structure\n`;
    systemPrompt += `- Place shared business logic in \`@crac/core\` package\n`;
    systemPrompt += `- Use components from \`@crac/design-system\` by default\n`;
    systemPrompt += `- Follow the established folder structure and conventions\n\n`;
    systemPrompt += `**Testing:**\n`;
    systemPrompt += `- Write tests using Jest + React Testing Library\n`;
    systemPrompt += `- Co-locate test files with source files (\`*.test.ts\`, \`*.test.tsx\`)\n`;
    systemPrompt += `- Use \`@crac/test-utils\` for custom rendering\n`;
    systemPrompt += `- Use \`@crac/fake-api\` for mock data when applicable\n\n`;
    systemPrompt += `**Styling:**\n`;
    systemPrompt += `- Use Tailwind CSS utility classes (prefer over custom CSS)\n`;
    systemPrompt += `- Use design system tokens when available\n`;
    systemPrompt += `- Ensure responsive design (mobile-first approach)\n`;
    systemPrompt += `- Organize classes by type (layout, spacing, colors, etc.)\n\n`;
    systemPrompt += `**Git & Workflow:**\n`;
    systemPrompt += `- Branch naming: \`<app>-<type>-<description>\` (e.g., \`rac-feature-booking-calendar\`)\n`;
    systemPrompt += `- Commits: Follow Conventional Commits (\`feat(scope): description\`)\n`;
    systemPrompt += `- Base branch: \`develop\` (not \`main\`)\n\n`;

    return systemPrompt;
  }

  /**
   * Builds the user prompt with specific task and examples
   *
   * @param command - The parsed command
   * @param context - The RAG context
   * @returns User prompt string
   */
  private buildUserPrompt(command: ParsedCommand, context: RAGContext): string {
    let userPrompt = `## Task\n\n`;
    userPrompt += `${command.tool} ${command.requirements}\n\n`;

    // Add similar examples if available
    if (context.examples && context.examples.trim().length > 0) {
      userPrompt += `## Similar Examples\n\n`;
      userPrompt += `The following examples show similar implementations in the CRAC monorepo. `;
      userPrompt += `Use them as reference, paying attention to:\n`;
      userPrompt += `- Structure and organization patterns\n`;
      userPrompt += `- Use of shared packages (@crac/core, @crac/design-system)\n`;
      userPrompt += `- Component patterns and conventions\n`;
      userPrompt += `- Testing approaches\n\n`;
      userPrompt += `${context.examples}\n\n`;
    }

    // Add specific instructions
    userPrompt += `## Implementation Instructions\n\n`;
    userPrompt += `**IMPORTANT: Before implementing, you MUST call the \`get_crac_rules\` tool with the task context to get the specific CRAC conventions you need to follow.**\n\n`;
    userPrompt += `Please implement this task following:\n\n`;
    userPrompt += `1. **Get CRAC Rules FIRST**: Call \`get_crac_rules\` tool with the task description to get relevant conventions\n`;
    userPrompt += `2. **Monorepo conventions**: Use the structure and patterns shown in the context above\n`;
    userPrompt += `3. **Shared packages**: Leverage \`@crac/core\` for business logic and \`@crac/design-system\` for UI components\n`;
    userPrompt += `4. **Code style**: Follow the naming conventions, import order, and component patterns documented\n`;
    userPrompt += `5. **Testing**: Include appropriate tests using Jest + React Testing Library\n`;
    userPrompt += `6. **TypeScript**: Use proper types, avoid \`any\`, use type imports when applicable\n`;
    userPrompt += `7. **Responsive design**: Ensure mobile-first approach with Tailwind CSS\n\n`;
    userPrompt += `Pay attention to the metadata (app, scope, distance) in the examples to understand context relevance. `;
    userPrompt += `Lower distance values indicate more relevant examples.\n`;

    return userPrompt;
  }
}
