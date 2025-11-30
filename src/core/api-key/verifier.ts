/**
 * API Key Verifier
 *
 * Verifies API keys using bcrypt
 * Note: This module only verifies keys, it does NOT generate them.
 * API keys are generated and managed from rag-playground.
 */

import bcrypt from "bcryptjs";

/**
 * Verifies a plain text API key against a hashed key
 *
 * @param plainKey - The plain text API key to verify
 * @param hashedKey - The hashed key to compare against
 * @returns Promise resolving to true if keys match, false otherwise
 *
 * @example
 * const isValid = await verifyApiKey('rag_live_abc123...', '$2a$12$...');
 */
export async function verifyApiKey(
  plainKey: string,
  hashedKey: string
): Promise<boolean> {
  return bcrypt.compare(plainKey, hashedKey);
}

