/**
 * Agent Rules Reader
 * Core logic for reading and parsing agent configuration rules from .mdc files
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Resolves the path to the docs directory
 * Tries development path first, then production path
 *
 * @param filename - Name of the file to read
 * @returns Path to the file
 * @throws Error if file cannot be found in either location
 */
function resolveDocsPath(filename: string): string {
  // Try development path first (from project root)
  const devPath = join(process.cwd(), "docs", filename);
  try {
    readFileSync(devPath, "utf-8");
    return devPath;
  } catch {
    // If not found, try production path (from dist/core/resources/ to dist/docs/)
    // __dirname will be dist/core/resources/ in production
    const prodPath = join(__dirname, "..", "..", "docs", filename);
    try {
      readFileSync(prodPath, "utf-8");
      return prodPath;
    } catch {
      throw new Error(
        `File ${filename} not found in docs directory. Tried: ${devPath} and ${prodPath}`
      );
    }
  }
}

/**
 * Reads a markdown file from the docs directory
 *
 * @param filename - Name of the file to read (without extension)
 * @returns Content of the file
 * @throws Error if file cannot be read
 */
function readMarkdownFile(filename: string): string {
  const fullFilename = `${filename}.mdc`;
  const filePath = resolveDocsPath(fullFilename);
  return readFileSync(filePath, "utf-8");
}

/**
 * Parses the URI to determine which file(s) to read
 *
 * @param uri - The resource URI (e.g., crac-rules://crac-config)
 * @returns Array of filenames to read
 * @throws Error if URI path is invalid
 */
export function parseAgentRulesUri(uri: string): string[] {
  const uriObj = new URL(uri);
  const path = uriObj.hostname || uriObj.pathname.replace(/^\//, "");

  if (path === "all") {
    return ["crac-config", "endpoints"];
  }

  if (path === "crac-config" || path === "endpoints") {
    return [path];
  }

  throw new Error(
    `Invalid URI path: ${path}. Valid paths are: crac-config, endpoints, all`
  );
}

/**
 * Formats content with metadata header
 *
 * @param filename - Name of the file
 * @param content - File content
 * @returns Formatted content with metadata
 */
export function formatAgentRulesContent(
  filename: string,
  content: string
): string {
  const header = `# Agent Rules: ${filename}\n\n---\n\n`;
  return header + content;
}

/**
 * Combines multiple file contents into a single formatted string
 *
 * @param files - Array of objects with filename and content
 * @returns Combined formatted content
 */
export function combineAgentRulesContents(
  files: Array<{ filename: string; content: string }>
): string {
  return files
    .map(({ filename, content }) => formatAgentRulesContent(filename, content))
    .join("\n\n---\n\n");
}

/**
 * Agent Rules Reader class
 * Handles reading and formatting agent configuration rules from .mdc files
 */
export class AgentRulesReader {
  /**
   * Reads agent rules based on URI
   *
   * @param uri - The resource URI (e.g., agent-rules://crac-config)
   * @returns Object with contents array ready for MCP resource response
   */
  readRules(uri: string): {
    contents: Array<{
      uri: string;
      text: string;
      mimeType: string;
    }>;
  } {
    try {
      const files = parseAgentRulesUri(uri);
      const fileContents = files.map((filename) => ({
        filename,
        content: readMarkdownFile(filename),
      }));

      // If multiple files, combine them; otherwise return single file
      if (fileContents.length === 1) {
        return {
          contents: [
            {
              uri,
              text: formatAgentRulesContent(
                fileContents[0].filename,
                fileContents[0].content
              ),
              mimeType: "text/markdown",
            },
          ],
        };
      } else {
        return {
          contents: [
            {
              uri,
              text: combineAgentRulesContents(fileContents),
              mimeType: "text/markdown",
            },
          ],
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error occurred while reading agent rules";

      return {
        contents: [
          {
            uri,
            text: `Error: ${errorMessage}`,
            mimeType: "text/plain",
          },
        ],
      };
    }
  }
}
