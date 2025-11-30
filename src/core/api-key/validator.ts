/**
 * API Key Validator
 *
 * Validates API keys against the database
 * Checks format, existence, active status, and expiration
 */

import { listApiKeys, updateLastUsedAt } from "./client.js";
import { verifyApiKey } from "./verifier.js";
import type { ApiKey, ApiKeyValidationResult } from "./types.js";

/**
 * Validates an API key
 *
 * Checks:
 * 1. Key format is valid (starts with rag_)
 * 2. Key exists in database and matches
 * 3. Key is active
 * 4. Key has not expired
 *
 * Updates last_used_at timestamp if validation succeeds
 *
 * Note: Since bcrypt generates different hashes each time (due to salt),
 * we need to fetch all active keys and compare each one.
 *
 * @param apiKey - The plain text API key to validate
 * @returns Promise resolving to validation result
 */
export async function validateApiKey(
  apiKey: string
): Promise<ApiKeyValidationResult> {
  // Validate key format
  if (!apiKey || !apiKey.startsWith("rag_")) {
    return {
      valid: false,
      reason: "Invalid API key format",
    };
  }

  // Extract prefix from key to filter candidates
  const prefixMatch = apiKey.match(/^rag_(live|test)_/);
  if (!prefixMatch) {
    return {
      valid: false,
      reason: "Invalid API key format",
    };
  }

  const prefix = prefixMatch[1] as "live" | "test";

  // Get all active keys with matching prefix
  // This reduces the number of keys we need to compare
  const allKeys = await listApiKeys(false);
  const candidateKeys = allKeys.filter(
    (key) => key.prefix === prefix && key.is_active
  );

  // Check expiration and verify each candidate key
  const now = new Date();
  for (const dbKey of candidateKeys) {
    // Check if key has expired
    if (dbKey.expires_at) {
      const expiresAt = new Date(dbKey.expires_at);
      if (expiresAt < now) {
        continue; // Skip expired keys
      }
    }

    // Verify the key matches using bcrypt
    const isValid = await verifyApiKey(apiKey, dbKey.key_hash);
    if (isValid) {
      // Update last_used_at timestamp (fire and forget)
      updateLastUsedAt(dbKey.id).catch((err) => {
        console.error("Failed to update last_used_at:", err);
      });

      return {
        valid: true,
        apiKey: dbKey,
      };
    }
  }

  // No matching key found
  return {
    valid: false,
    reason: "Invalid API key",
  };
}

