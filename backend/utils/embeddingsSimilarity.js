/**
 * utils/embeddingsSimilarity.js
 *
 * Computes semantic similarity using OpenAI's text-embedding-3-small model.
 * Embeddings capture meaning beyond exact word overlap, catching paraphrasing
 * and idea-level plagiarism that TF-IDF misses.
 *
 * Key design decisions:
 *  - We chunk long texts (>8 000 tokens) and average their embeddings.
 *  - Embeddings are cached in the Submission document to avoid re-computing.
 *  - Cosine similarity is used (same as TF-IDF stage).
 */

import OpenAI from 'openai';

// Lazy-initialise so the module can be imported without a valid key in tests
let _client = null;
const getClient = () => {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables.');
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
};

const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dims, cost-efficient
const MAX_CHARS_PER_CHUNK = 6000; // safely within token limit

/**
 * Split text into chunks at sentence boundaries to stay within token limits.
 * @param {string} text
 * @returns {string[]}
 */
function chunkText(text) {
  if (text.length <= MAX_CHARS_PER_CHUNK) return [text];

  const chunks = [];
  // Split by sentence-ending punctuation
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > MAX_CHARS_PER_CHUNK) {
      if (current.trim()) chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Average multiple embedding vectors into a single representative vector.
 * @param {number[][]} embeddings
 * @returns {number[]}
 */
function averageEmbeddings(embeddings) {
  if (embeddings.length === 1) return embeddings[0];
  const dim = embeddings[0].length;
  const avg = new Array(dim).fill(0);
  embeddings.forEach((emb) => emb.forEach((val, i) => { avg[i] += val; }));
  return avg.map((val) => val / embeddings.length);
}

/**
 * Generate an embedding vector for the given text.
 * Automatically handles long texts by chunking + averaging.
 *
 * @param {string} text
 * @returns {Promise<number[]>} embedding vector (1536-dimensional)
 */
export async function generateEmbedding(text) {
  const client = getClient();
  const chunks = chunkText(text);

  const responses = await Promise.all(
    chunks.map((chunk) =>
      client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: chunk,
        encoding_format: 'float',
      })
    )
  );

  const vectors = responses.map((r) => r.data[0].embedding);
  return averageEmbeddings(vectors);
}

/**
 * Compute cosine similarity between two embedding vectors.
 *
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} similarity in [0, 1]
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Compare a query embedding against an array of stored document embeddings.
 *
 * @param {number[]} queryEmbedding
 * @param {Array<{id: string, embedding: number[]}>} documents
 * @returns {Array<{id: string, score: number}>} sorted desc by score
 */
export function computeEmbeddingSimilarity(queryEmbedding, documents) {
  if (!documents || documents.length === 0) return [];

  const scores = documents
    .filter((doc) => doc.embedding && doc.embedding.length > 0)
    .map((doc) => ({
      id: doc.id,
      score: parseFloat(cosineSimilarity(queryEmbedding, doc.embedding).toFixed(4)),
    }));

  return scores.sort((a, b) => b.score - a.score);
}
