---
name: neon-vector
description: This skill covers vector database capabilities in Neon using pgvector and pgrag. Use when the user asks about "vector database", "pgvector", "embeddings", "similarity search", "RAG with Neon", "semantic search", "hybrid search", "AI embeddings", "LangChain with Neon", or needs to implement retrieval-augmented generation pipelines.
---

# Neon Vector Database & RAG

Neon supports pgvector for vector embeddings and similarity search, plus pgrag for end-to-end RAG pipelines in SQL.

## Enable pgvector

pgvector is pre-installed in Neon, just enable it:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Vector Table Schema

```typescript
// With Drizzle ORM
import { pgTable, serial, text, integer, index, vector } from 'drizzle-orm/pg-core';

export const embeddings = pgTable(
  'embeddings',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id').notNull(),
    chunk: text('chunk').notNull(),
    // Dimensions depend on your model:
    // - OpenAI text-embedding-3-small: 1536
    // - OpenAI text-embedding-3-large: 3072
    // - BGE-small-en-v1.5: 384
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  },
  (table) => [
    // HNSW index for fast similarity search
    index('embeddings_vector_idx').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops')
    ),
  ]
);
```

## Similarity Search

```sql
-- Cosine distance (smaller = more similar)
SELECT id, chunk, embedding <=> '[0.1, 0.2, ...]'::vector as distance
FROM embeddings
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 5;

-- Cosine similarity (larger = more similar)
SELECT id, chunk, 1 - (embedding <=> query_embedding) as similarity
FROM embeddings
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

## Hybrid Search (Semantic + Keyword)

Combine pgvector with PostgreSQL's full-text search for best results:

```sql
-- Create table with both vector and tsvector
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    fts TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
    ) STORED,
    embedding VECTOR(1536)
);

-- Create indexes
CREATE INDEX ON documents USING GIN (fts);
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- Hybrid search with RRF (Reciprocal Rank Fusion)
WITH semantic AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> $1) as rank
    FROM documents
    ORDER BY embedding <=> $1
    LIMIT 20
),
keyword AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank(fts, query) DESC) as rank
    FROM documents, websearch_to_tsquery('english', $2) query
    WHERE fts @@ query
    LIMIT 20
)
SELECT
    COALESCE(s.id, k.id) as id,
    (COALESCE(1.0/(60 + s.rank), 0) * 0.7 +
     COALESCE(1.0/(60 + k.rank), 0) * 0.3) as score
FROM semantic s
FULL OUTER JOIN keyword k ON s.id = k.id
ORDER BY score DESC
LIMIT 10;
```

## pgrag - End-to-End RAG in SQL

pgrag enables complete RAG pipelines without leaving SQL:

```sql
-- Enable pgrag (requires unstable extensions)
SET neon.allow_unstable_extensions = 'true';
CREATE EXTENSION IF NOT EXISTS rag CASCADE;
CREATE EXTENSION IF NOT EXISTS rag_bge_small_en_v15 CASCADE;
CREATE EXTENSION IF NOT EXISTS rag_jina_reranker_v1_tiny_en CASCADE;

-- Extract text from PDF
SELECT rag.text_from_pdf(pdf_bytes);

-- Chunk text
SELECT unnest(rag_bge_small_en_v15.chunks_by_token_count(text, 192, 8));

-- Generate embeddings (runs locally)
SELECT rag_bge_small_en_v15.embedding_for_passage(chunk);

-- Rerank results
SELECT rag_jina_reranker_v1_tiny_en.rerank_distance(query, chunk);

-- Chat completion (requires OpenAI key)
SELECT rag.openai_chat_completion(json_object(...));
```

## Index Types

| Index | Use Case | Build Time | Query Speed |
|-------|----------|------------|-------------|
| HNSW | General purpose, best recall | Slower | Fastest |
| IVFFlat | Large datasets, less memory | Faster | Good |

```sql
-- HNSW (recommended)
CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops);

-- IVFFlat (for very large datasets)
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

## Distance Operators

| Operator | Distance Type | Use For |
|----------|---------------|---------|
| `<=>` | Cosine | Normalized embeddings (most common) |
| `<->` | Euclidean (L2) | Raw vectors |
| `<#>` | Inner product | When vectors aren't normalized |

## LangChain Integration

```typescript
import { NeonPostgres } from "@langchain/community/vectorstores/neon";
import { OpenAIEmbeddings } from "@langchain/openai";

const vectorStore = await NeonPostgres.initialize(
  new OpenAIEmbeddings(),
  {
    connectionString: process.env.DATABASE_URL!,
  }
);

// Add documents
await vectorStore.addDocuments(documents);

// Similarity search
const results = await vectorStore.similaritySearch("query", 5);
```

## Templates

Reference templates at `${CLAUDE_PLUGIN_ROOT}/templates/vector/`:
- `embeddings-schema.ts` - Drizzle schema with vector columns
- `hybrid-search.ts` - Hybrid search implementation
- `setup-extensions.sql` - SQL to enable extensions

## Best Practices

1. **Choose right dimensions**: Match your embedding model
2. **Use HNSW for speed**: Better query performance than IVFFlat
3. **Normalize vectors**: Use cosine distance for normalized embeddings
4. **Hybrid search**: Combine semantic + keyword for best recall
5. **Chunk appropriately**: 200-500 tokens per chunk typically works well
