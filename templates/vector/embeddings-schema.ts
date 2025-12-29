/**
 * Vector Embeddings Schema for Neon with pgvector
 *
 * This template includes:
 * - Documents table with full-text search (tsvector)
 * - Embeddings table with vector column
 * - Hybrid search support (semantic + keyword)
 * - HNSW and GIN indexes for optimal performance
 */

import { sql } from 'drizzle-orm';
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  index,
  vector,
  customType,
} from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Custom tsvector type for full-text search
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

// ============================================
// Documents Table with Full-Text Search
// ============================================
export const documents = pgTable(
  'documents',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    url: varchar('url', { length: 2048 }),
    // Full-text search vector (auto-generated)
    fts: tsvector('fts').generatedAlwaysAs(
      sql`to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))`
    ),
    metadata: text('metadata'), // JSON metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // GIN index for full-text search
    index('documents_fts_idx').using('gin', table.fts),
  ]
);

// ============================================
// Embeddings Table with Vector Column
// ============================================
export const embeddings = pgTable(
  'embeddings',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull().default(0),
    chunk: text('chunk').notNull(),
    // Vector embedding - adjust dimensions based on your model:
    // - OpenAI text-embedding-3-small: 1536
    // - OpenAI text-embedding-3-large: 3072
    // - BGE-small-en-v1.5: 384
    // - Cohere embed-english-v3.0: 1024
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // HNSW index for fast approximate nearest neighbor search
    // Using cosine distance (vector_cosine_ops) - best for normalized embeddings
    index('embeddings_vector_idx').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops')
    ),
    // Index for document lookups
    index('embeddings_document_idx').on(table.documentId),
  ]
);

// ============================================
// Type Inference
// ============================================
export type Document = InferSelectModel<typeof documents>;
export type NewDocument = InferInsertModel<typeof documents>;

export type Embedding = InferSelectModel<typeof embeddings>;
export type NewEmbedding = InferInsertModel<typeof embeddings>;
