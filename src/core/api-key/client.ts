/**
 * Supabase client for API keys table
 * Provides read operations for api_keys table
 * Note: API keys are created/managed from rag-playground, not from this MCP
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { ApiKey } from "./types.js";

// Lazy initialization
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
      );
    }

    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabase;
}

/**
 * Lists all API keys from the database
 *
 * @param activeOnly - If true, only return active keys
 * @returns Promise resolving to array of API keys
 */
export async function listApiKeys(
  activeOnly: boolean = false
): Promise<ApiKey[]> {
  const client = getSupabaseClient();
  let query = client
    .from("api_keys")
    .select("*")
    .order("created_at", { ascending: false });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list API keys: ${error.message}`);
  }

  return data || [];
}

/**
 * Updates the last_used_at timestamp for an API key
 *
 * @param id - The API key ID
 */
export async function updateLastUsedAt(id: number): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    // Don't throw error for this - it's not critical if it fails
    console.error(`Failed to update last_used_at: ${error.message}`);
  }
}

