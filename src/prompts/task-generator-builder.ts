/**
 * Task generator builder module
 * Constructs structured prompts for generating PRD → Tasks → Subtasks
 */

import type { ParsedCommand } from "../parser/command-parser.js";
import type { RAGContext } from "../rag/context-searcher.js";
import type { TemplateContext } from "../rag/template-searcher.js";

/**
 * Structured task generation prompt
 */
export interface TaskGenerationPrompt {
  /** Complete prompt ready for the agent */
  prompt: string;
  /** Metadata about templates and context */
  metadata: {
    templates: {
      prd: boolean;
      tasks: boolean;
      subtasks: boolean;
    };
    context: {
      technology: boolean;
      structure: boolean;
      conventions: boolean;
    };
  };
}

/**
 * Task generator builder class
 * Builds structured prompts for generating complete task documentation
 */
export class TaskGeneratorBuilder {
  /**
   * Builds a complete task generation prompt from parsed command, templates, and RAG context
   *
   * @param command - The parsed command (tool, scope, requirements)
   * @param templates - The templates retrieved from embeddings
   * @param ragContext - The RAG context retrieved from Supabase
   * @returns TaskGenerationPrompt object with complete prompt
   */
  buildTaskGenerationPrompt(
    command: ParsedCommand,
    templates: TemplateContext,
    ragContext: RAGContext
  ): TaskGenerationPrompt {
    const scopeUpper = command.scope.toUpperCase();

    let prompt = `You are an expert Full-Stack Engineer and Product Manager working on the ${scopeUpper} application in the CRAC (Centauro Rent a Car) monorepo.\n\n`;

    // Add metadata
    prompt += `**Context Information:**\n`;
    prompt += `- Application: ${command.scope}\n`;
    prompt += `- Task Type: generate-tasks\n`;
    prompt += `- Monorepo: CRAC Frontend Monorepo (pnpm workspaces + Turborepo)\n\n`;

    // Add monorepo structure
    prompt += `## Monorepo Structure\n\n`;
    prompt += `This is a monorepo managed by pnpm workspaces and Turborepo:\n`;
    prompt += `- **apps/**: Standalone applications (web, rac, partners, mobile, notifications, suppliers, queues)\n`;
    prompt += `- **packages/**: Shared packages (@crac/core, @crac/design-system, @crac/components, etc.)\n`;
    prompt += `- **config/**: Shared configurations (ESLint, TypeScript, Prettier)\n\n`;

    // Add technical context from RAG
    if (ragContext.technology && ragContext.technology.trim().length > 0) {
      prompt += `## Technical Context (from RAG)\n\n`;
      prompt += `*The following context was retrieved from the monorepo documentation:*\n\n`;
      prompt += `${ragContext.technology}\n\n`;
    } else {
      prompt += `## Technical Context (default)\n\n`;
      prompt += `Core technologies used in the monorepo:\n`;
      prompt += `- Language: TypeScript\n`;
      prompt += `- UI Framework: React\n`;
      prompt += `- State Management: Redux Toolkit (primarily)\n`;
      prompt += `- Styling: Tailwind CSS\n`;
      prompt += `- Build Tools: Vite (for most apps) or Next.js (for web app)\n`;
      prompt += `- Testing: Jest + React Testing Library\n\n`;
    }

    // Add project structure from RAG
    if (
      ragContext.folderStructure &&
      ragContext.folderStructure.trim().length > 0
    ) {
      prompt += `## Project Structure (from RAG)\n\n`;
      prompt += `*The following structure information was retrieved from the monorepo documentation:*\n\n`;
      prompt += `${ragContext.folderStructure}\n\n`;
    } else {
      prompt += `## Project Structure (default)\n\n`;
      prompt += `Feature-driven architecture:\n`;
      prompt += `- Each feature in \`src/features/\` directory\n`;
      prompt += `- Shared components in \`src/components/\`\n`;
      prompt += `- Utilities in \`src/utils/\`\n`;
      prompt += `- Types in \`src/types/\`\n\n`;
    }

    // Add code conventions from RAG
    if (ragContext.conventions && ragContext.conventions.trim().length > 0) {
      prompt += `## Code Conventions (from RAG)\n\n`;
      prompt += `*The following conventions were retrieved from the monorepo documentation:*\n\n`;
      prompt += `${ragContext.conventions}\n\n`;
    } else {
      prompt += `## Code Conventions (default)\n\n`;
      prompt += `Follow these conventions:\n`;
      prompt += `- **Components**: PascalCase (e.g., \`UserProfile.tsx\`)\n`;
      prompt += `- **Functions**: camelCase (e.g., \`getUserData\`)\n`;
      prompt += `- **Constants**: UPPER_SNAKE_CASE (e.g., \`API_BASE_URL\`)\n`;
      prompt += `- **Imports**: Group by type (external, internal, relative)\n`;
      prompt += `- **Path aliases**: Use \`~/components\` instead of relative paths\n\n`;
    }

    // Add templates section
    prompt += `## Templates for Task Generation\n\n`;
    prompt += `You have access to three templates that guide the generation process. `;
    prompt += `Use these templates to generate a complete document with PRD, Tasks, and Subtasks.\n\n`;

    // PRD Template
    prompt += `### Template 1: PRD (Product Requirements Document)\n\n`;
    prompt += `${templates.prdTemplate}\n\n`;
    prompt += `---\n\n`;

    // Tasks Template
    prompt += `### Template 2: Tasks Generation\n\n`;
    prompt += `${templates.tasksTemplate}\n\n`;
    prompt += `---\n\n`;

    // Subtasks Template
    prompt += `### Template 3: Subtasks Implementation\n\n`;
    prompt += `${templates.subtasksTemplate}\n\n`;
    prompt += `---\n\n`;

    // Add task requirements
    prompt += `## Task Requirements\n\n`;
    prompt += `Based on the user's request, you need to generate a complete task documentation for:\n\n`;
    prompt += `- **Scope**: ${command.scope}\n`;
    prompt += `- **Requirements**: ${command.requirements}\n\n`;

    // Add generation instructions
    prompt += `## Generation Instructions\n\n`;
    prompt += `You must generate a **single, complete Markdown document** that includes:\n\n`;

    prompt += `### Step 1: Generate PRD\n\n`;
    prompt += `1. Review the PRD template above\n`;
    prompt += `2. If needed, ask 3-5 clarifying questions (with numbered options) to understand the requirements better\n`;
    prompt += `3. Generate a complete PRD following the template structure:\n`;
    prompt += `   - Introduction/Overview\n`;
    prompt += `   - Goals\n`;
    prompt += `   - User Stories\n`;
    prompt += `   - Functional Requirements\n`;
    prompt += `   - Non-Goals (Out of Scope)\n`;
    prompt += `   - Design Considerations (if applicable)\n`;
    prompt += `   - Technical Considerations (if applicable)\n`;
    prompt += `   - Success Metrics\n`;
    prompt += `   - Open Questions\n\n`;

    prompt += `### Step 2: Generate Tasks\n\n`;
    prompt += `1. Review the Tasks template above\n`;
    prompt += `2. Based on the PRD you generated, create a task list following the template format\n`;
    prompt += `3. **IMPORTANT**: Always include task 0.0 "Create feature branch" as the first task\n`;
    prompt += `4. Generate 4-6 high-level parent tasks (numbered 1.0, 2.0, 3.0, etc.)\n`;
    prompt += `5. For each parent task, generate detailed subtasks (numbered 1.1, 1.2, 2.1, etc.)\n`;
    prompt += `6. Include a "Relevant Files" section listing all files that will be created or modified\n`;
    prompt += `7. Use checkboxes format: \`- [ ]\` for incomplete tasks\n\n`;

    prompt += `### Step 3: Format Output\n\n`;
    prompt += `Generate a single Markdown document with this structure:\n\n`;
    prompt += `\`\`\`markdown\n`;
    prompt += `# PRD: [Feature Name]\n\n`;
    prompt += `[Complete PRD content here]\n\n`;
    prompt += `---\n\n`;
    prompt += `# Tasks: [Feature Name]\n\n`;
    prompt += `## Relevant Files\n\n`;
    prompt += `[List of relevant files]\n\n`;
    prompt += `## Tasks\n\n`;
    prompt += `- [ ] 0.0 Create feature branch\n`;
    prompt += `- [ ] 0.1 Create and checkout a new branch\n`;
    prompt += `- [ ] 1.0 Parent Task 1\n`;
    prompt += `- [ ] 1.1 Subtask 1.1\n`;
    prompt += `- [ ] 1.2 Subtask 1.2\n`;
    prompt += `- [ ] 2.0 Parent Task 2\n`;
    prompt += `- [ ] 2.1 Subtask 2.1\n`;
    prompt += `[Continue with all tasks and subtasks]\n`;
    prompt += `\`\`\`\n\n`;

    prompt += `## Important Notes\n\n`;
    prompt += `- Generate **everything in a single response** - do not wait for user confirmation between steps\n`;
    prompt += `- The final document should be ready for the user to review and copy\n`;
    prompt += `- Adapt all templates to the CRAC monorepo conventions shown in the context above\n`;
    prompt += `- Use the technical context, structure, and conventions from RAG to make tasks specific and actionable\n`;
    prompt += `- Ensure tasks are detailed enough for a junior developer to implement\n`;
    prompt += `- Include acceptance criteria where appropriate\n\n`;

    // Build metadata
    const metadata = {
      templates: {
        prd: templates.prdTemplate.includes("PRD") || templates.prdTemplate.includes("Product Requirements"),
        tasks: templates.tasksTemplate.includes("Task") || templates.tasksTemplate.includes("task list"),
        subtasks: templates.subtasksTemplate.includes("Implement") || templates.subtasksTemplate.includes("subtask"),
      },
      context: {
        technology: ragContext.technology.trim().length > 0,
        structure: ragContext.folderStructure.trim().length > 0,
        conventions: ragContext.conventions.trim().length > 0,
      },
    };

    return {
      prompt,
      metadata,
    };
  }
}

