/**
 * Type definitions for API key management
 */

export interface ApiKey {
  id: number;
  name: string;
  key_hash: string;
  prefix: "live" | "test";
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  last_used_at: string | null;
}

export interface ApiKeyValidationResult {
  valid: boolean;
  reason?: string;
  apiKey?: ApiKey;
}

