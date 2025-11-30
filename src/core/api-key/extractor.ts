/**
 * API Key Extractor
 *
 * Extracts API keys from HTTP request headers
 * Supports both Authorization Bearer and X-API-Key headers
 */

import type { Request } from "express";

/**
 * Extracts API key from Express request headers
 *
 * Supports both:
 * - Authorization: Bearer rag_live_...
 * - X-API-Key: rag_live_...
 *
 * @param req - Express Request object
 * @returns The extracted API key or null if not found
 */
export function extractApiKeyFromRequest(req: Request): string | null {
  // Try Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Fall back to X-API-Key header
  const apiKeyHeader = req.headers["x-api-key"];
  if (apiKeyHeader && typeof apiKeyHeader === "string") {
    return apiKeyHeader;
  }

  return null;
}

