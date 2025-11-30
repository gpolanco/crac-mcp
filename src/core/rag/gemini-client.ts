/**
 * Gemini client for generating embeddings
 * Uses Google's text-embedding-004 model to generate 768-dimensional vectors
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy initialization to allow dotenv to load first
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Gemini embedding model: text-embedding-004 produces 768-dimensional vectors
 * If using a different model, adjust the vector dimension in the database schema
 */
export const EMBEDDING_MODEL = "text-embedding-004";
export const EMBEDDING_DIMENSION = 768;

/**
 * Generates an embedding vector for the given text using Gemini's embedding model
 *
 * @param text - The text to generate an embedding for
 * @returns Promise resolving to an array of 768 numbers representing the embedding vector
 * @throws Error if the embedding generation fails or returns invalid data
 *
 * @example
 * ```typescript
 * const embedding = await generateEmbedding("Hello world");
 * console.log(embedding.length); // 768
 * ```
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty");
  }

  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: EMBEDDING_MODEL });

    // For embedding models, we use embedContent with a string
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;

    if (!embedding || embedding.length === 0) {
      throw new Error("Empty embedding returned from Gemini");
    }

    // Validate embedding dimension
    if (embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Invalid embedding dimension: expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`
      );
    }

    return Array.from(embedding);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
    throw new Error("Failed to generate embedding: Unknown error");
  }
}

