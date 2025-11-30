/**
 * API Key Authentication Middleware
 *
 * Express middleware to protect MCP endpoints with API key authentication
 */

import type { Request, Response, NextFunction } from "express";
import { extractApiKeyFromRequest } from "./extractor.js";
import { validateApiKey } from "./validator.js";

/**
 * Middleware to validate API keys in MCP requests
 *
 * Supports two header formats:
 * - Authorization: Bearer rag_live_...
 * - X-API-Key: rag_live_...
 *
 * Returns JSON-RPC error response if validation fails
 */
export async function apiKeyAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Extract API key from request headers
  const apiKey = extractApiKeyFromRequest(req);

  if (!apiKey) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32001, // Unauthorized (custom MCP error code)
        message:
          "API key required. Provide it via 'Authorization: Bearer <key>' or 'X-API-Key' header",
      },
      id: null,
    });
    return;
  }

  // Validate the API key
  const validation = await validateApiKey(apiKey);

  if (!validation.valid) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message: validation.reason || "Invalid API key",
      },
      id: null,
    });
    return;
  }

  // API key is valid, attach to request for potential logging
  (req as any).apiKey = validation.apiKey;

  // TODO: Implement rate limiting per API key
  // - Track requests per key
  // - Enforce limits based on key configuration
  // - Return 429 Too Many Requests if limit exceeded

  next();
}
