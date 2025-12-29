-- Setup script for Neon Vector/RAG capabilities
-- Run this script to enable all necessary extensions

-- Enable pgvector for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm for fuzzy text matching (optional, for typo tolerance)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- For pgrag (end-to-end RAG in SQL) - requires unstable extensions
-- Uncomment if you want to use pgrag:
--
-- SET neon.allow_unstable_extensions = 'true';
-- CREATE EXTENSION IF NOT EXISTS rag CASCADE;
-- CREATE EXTENSION IF NOT EXISTS rag_bge_small_en_v15 CASCADE;
-- CREATE EXTENSION IF NOT EXISTS rag_jina_reranker_v1_tiny_en CASCADE;

-- Verify extensions are installed
SELECT extname, extversion FROM pg_extension
WHERE extname IN ('vector', 'pg_trgm', 'rag', 'rag_bge_small_en_v15', 'rag_jina_reranker_v1_tiny_en');
