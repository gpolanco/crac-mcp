/**
 * Environment variables validation utility
 * Validates that all required environment variables are present
 */

interface RequiredEnvVars {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GEMINI_API_KEY: string;
}

/**
 * Validates that all required environment variables are present
 * @throws Error if any required environment variable is missing
 */
export function validateEnvVars(): void {
  const required: (keyof RequiredEnvVars)[] = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GEMINI_API_KEY",
  ];

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key] || process.env[key]?.trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Please set the following environment variables:\n` +
        `- SUPABASE_URL\n` +
        `- SUPABASE_SERVICE_ROLE_KEY\n` +
        `- GEMINI_API_KEY`
    );
  }
}

