/**
 * Hybrid Search Implementation for Neon
 *
 * Combines:
 * - Semantic search (pgvector cosine similarity)
 * - Keyword search (tsvector full-text search)
 * - Reciprocal Rank Fusion (RRF) for score combination
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

// Initialize database
const db = drizzle(process.env.DATABASE_URL!);

interface SearchResult {
  id: number;
  documentId: number;
  chunk: string;
  title: string;
  semanticScore: number;
  keywordScore: number;
  combinedScore: number;
}

interface HybridSearchOptions {
  query: string;
  queryEmbedding: number[];
  limit?: number;
  semanticWeight?: number; // 0-1, default 0.7
  keywordWeight?: number; // 0-1, default 0.3
}

/**
 * Perform hybrid search combining semantic and keyword search
 *
 * Uses Reciprocal Rank Fusion (RRF) to combine rankings:
 * RRF(d) = sum(1 / (k + rank_i(d))) for each ranking method
 */
export async function hybridSearch(
  options: HybridSearchOptions
): Promise<SearchResult[]> {
  const {
    query,
    queryEmbedding,
    limit = 10,
    semanticWeight = 0.7,
    keywordWeight = 0.3,
  } = options;

  // Validate weights
  if (semanticWeight + keywordWeight !== 1) {
    throw new Error('semanticWeight + keywordWeight must equal 1');
  }

  // Convert embedding array to pgvector format
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const results = await db.execute(sql`
    WITH semantic_search AS (
      SELECT
        e.id,
        e.document_id,
        e.chunk,
        d.title,
        1 - (e.embedding <=> ${embeddingStr}::vector) as similarity,
        ROW_NUMBER() OVER (ORDER BY e.embedding <=> ${embeddingStr}::vector) as rank
      FROM embeddings e
      JOIN documents d ON e.document_id = d.id
      ORDER BY e.embedding <=> ${embeddingStr}::vector
      LIMIT ${limit * 2}
    ),
    keyword_search AS (
      SELECT
        e.id,
        e.document_id,
        e.chunk,
        d.title,
        ts_rank(d.fts, websearch_to_tsquery('english', ${query})) as similarity,
        ROW_NUMBER() OVER (
          ORDER BY ts_rank(d.fts, websearch_to_tsquery('english', ${query})) DESC
        ) as rank
      FROM embeddings e
      JOIN documents d ON e.document_id = d.id
      WHERE d.fts @@ websearch_to_tsquery('english', ${query})
      ORDER BY similarity DESC
      LIMIT ${limit * 2}
    )
    SELECT
      COALESCE(s.id, k.id) as id,
      COALESCE(s.document_id, k.document_id) as document_id,
      COALESCE(s.chunk, k.chunk) as chunk,
      COALESCE(s.title, k.title) as title,
      COALESCE(s.similarity, 0) as semantic_score,
      COALESCE(k.similarity, 0) as keyword_score,
      (
        ${semanticWeight} * COALESCE(1.0 / (60 + s.rank), 0) +
        ${keywordWeight} * COALESCE(1.0 / (60 + k.rank), 0)
      ) as combined_score
    FROM semantic_search s
    FULL OUTER JOIN keyword_search k ON s.id = k.id
    ORDER BY combined_score DESC
    LIMIT ${limit}
  `);

  return results.rows as SearchResult[];
}

/**
 * Semantic-only search using pgvector
 */
export async function semanticSearch(
  queryEmbedding: number[],
  limit: number = 10
): Promise<Array<{ id: number; chunk: string; similarity: number }>> {
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const results = await db.execute(sql`
    SELECT
      e.id,
      e.chunk,
      1 - (e.embedding <=> ${embeddingStr}::vector) as similarity
    FROM embeddings e
    ORDER BY e.embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `);

  return results.rows as any;
}

/**
 * Keyword-only search using tsvector
 */
export async function keywordSearch(
  query: string,
  limit: number = 10
): Promise<Array<{ id: number; chunk: string; rank: number }>> {
  const results = await db.execute(sql`
    SELECT
      e.id,
      e.chunk,
      ts_rank(d.fts, websearch_to_tsquery('english', ${query})) as rank
    FROM embeddings e
    JOIN documents d ON e.document_id = d.id
    WHERE d.fts @@ websearch_to_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT ${limit}
  `);

  return results.rows as any;
}
