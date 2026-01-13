---
name: setup-vector
description: Set up full vector database and RAG infrastructure with Neon
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
argument-hint: "[--with-hybrid] [--with-pgrag]"
---

# Setup Vector Database & RAG Infrastructure

Set up complete vector database capabilities with pgvector, optional hybrid search, and pgrag for RAG pipelines.

## Instructions

1. Determine which features to set up:
   - `--with-hybrid`: Include hybrid search (semantic + keyword)
   - `--with-pgrag`: Include pgrag for end-to-end SQL RAG
   - Default: Basic pgvector setup

2. Install required dependencies:
   ```bash
   npm install @neondatabase/serverless drizzle-orm
   npm install -D drizzle-kit tsx
   ```

3. Create SQL setup script at `scripts/setup-vector.sql`:
   ```sql
   -- Enable pgvector
   CREATE EXTENSION IF NOT EXISTS vector;

   -- For hybrid search
   CREATE EXTENSION IF NOT EXISTS pg_trgm;

   -- For pgrag (if requested)
   -- SET neon.allow_unstable_extensions = 'true';
   -- CREATE EXTENSION IF NOT EXISTS rag CASCADE;
   -- CREATE EXTENSION IF NOT EXISTS rag_bge_small_en_v15 CASCADE;
   ```
   Use template from `${CLAUDE_PLUGIN_ROOT}/templates/vector/setup-extensions.sql`

4. Create embeddings schema at `src/db/embeddings-schema.ts`:
   - Use template from `${CLAUDE_PLUGIN_ROOT}/templates/vector/embeddings-schema.ts`
   - Ask user about embedding dimensions (1536 for OpenAI, 384 for BGE, etc.)

5. If `--with-hybrid`, create hybrid search implementation:
   - Use template from `${CLAUDE_PLUGIN_ROOT}/templates/vector/hybrid-search.ts`
   - Includes:
     - Documents table with tsvector column
     - Embeddings table with vector column
     - Hybrid search function with RRF scoring

6. Create a vector utilities file at `src/lib/vector-utils.ts`:
   ```typescript
   // Similarity search function
   export async function similaritySearch(
     queryEmbedding: number[],
     limit: number = 5
   ) {
     const embeddingStr = `[${queryEmbedding.join(',')}]`;
     return db.execute(sql`
       SELECT id, chunk, 1 - (embedding <=> ${embeddingStr}::vector) as similarity
       FROM embeddings
       ORDER BY embedding <=> ${embeddingStr}::vector
       LIMIT ${limit}
     `);
   }
   ```

7. If `--with-pgrag`, add pgrag examples:
   - Text extraction functions
   - Chunking functions
   - Local embedding generation
   - Reranking functions

8. Update drizzle.config.ts if it exists to include vector schema.

9. Print next steps:
   - Run setup SQL: `psql $DATABASE_URL -f scripts/setup-vector.sql`
   - Generate migrations: `npm run db:generate`
   - Apply migrations: `npm run db:migrate`
   - Choose an embedding model and integrate

10. Recommend embedding model options:
    - OpenAI text-embedding-3-small (1536 dims)
    - OpenAI text-embedding-3-large (3072 dims)
    - BGE-small-en-v1.5 (384 dims, runs locally with pgrag)
    - Cohere embed-english-v3.0 (1024 dims)

## Tips

- HNSW indexes are recommended for best query performance
- Use cosine distance (<=>) for normalized embeddings
- Hybrid search improves recall by combining semantic + keyword
- Reference neon-vector skill for detailed documentation
