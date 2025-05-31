# Semantic Search Implementation for Gastos MVP 2.0

This document outlines the implementation of semantic search for the Gastos expense tracker application.

## Overview

The semantic tagging system replaces the fixed category approach by:

1. Using AI to suggest relevant tags for expenses
2. Storing these tags with vector embeddings for semantic similarity
3. Supporting natural language search queries

## Key Components

### 1. Database Schema

```sql
-- Enable pgvector extension for vector similarity
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to tags table
ALTER TABLE public.tags 
ADD COLUMN IF NOT EXISTS embedding vector(1536);
```

### 2. OpenAI Integration

The `OpenAIExpenseParser` service has been enhanced to:

- Extract amount, currency, and description from user input
- Generate 2-4 suggested semantic tags for each expense
- Classify user queries for semantic search

### 3. Expense Service

The `SupabaseExpenseService` has been updated to:

- Save suggested tags with expenses
- Support semantic search using the vector embeddings
- Provide fallback to text-based search when needed

### 4. Message API

The `/api/messages/web/route.ts` file now:

- Processes semantic search queries
- Extracts tag suggestions from expense descriptions
- Handles multi-modal inputs (text, photo, audio)

## Implementation Notes

1. **Vector Embeddings**: The semantic search relies on OpenAI's embedding model to convert tags to vector representations for similarity search.

2. **Fallbacks**: The implementation includes fallbacks to ensure the system works even when the vector search is unavailable:
   - Text-based search on expense descriptions
   - Regular filtering by category

3. **Database Functions**: Custom SQL functions have been created to:
   - Generate embeddings for tags
   - Search expenses by semantic similarity
   - Update tag embeddings automatically

## Testing

1. Test tag suggestions:
   - Log a new expense via text, photo, or audio
   - Verify AI suggests relevant semantic tags

2. Test semantic search:
   - Try natural language queries like "show me food expenses"
   - Try semantic concepts that don't literally match tag names

3. Test fallbacks:
   - If pgvector is not available, ensure text search works

## Future Enhancements

1. Add user feedback on tag suggestions to improve the AI model
2. Implement frequent tags as quick selections
3. Support custom user-defined tags
4. Add tag management UI
