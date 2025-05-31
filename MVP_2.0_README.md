# Gastos MVP 2.0: Semantic Tag-Based Expense Tracking

This update implements the new Product Requirements Document (PRD) for Gastos MVP 2.0, focusing on a semantic tag-based approach rather than fixed categories.

## Key Changes Implemented

1. **Simplified Navigation**
   - Modified NavBar to keep only the Chat page in protected routes
   - Updated `layout.tsx` with the required imports
   - Set redirects from dashboard and expenses pages to the Chat page

2. **Semantic Tag System**
   - Added support for semantic tags instead of fixed categories
   - Enhanced OpenAIExpenseParser to generate suggested tags based on expense descriptions
   - Added database schema for tag vector embeddings to support semantic search

3. **Enhanced Search**
   - Implemented semantic search in the `SupabaseExpenseService`
   - Added fallback to text-based search when semantic search is unavailable
   - Updated the message handling API to process semantic search queries

4. **Multi-Modal Input**
   - The system supports expense entry via:
     - Text messages
     - Photo uploads
     - Audio recordings

5. **Onboarding Flow**
   - Implemented user onboarding to collect:
     - User's name
     - Country
     - Default currency

## Database Changes

New SQL migrations are available in `migrations/semantic_search.sql` to add:
- pgvector extension for semantic search
- vector column to the tags table
- functions for semantic search of expenses

### Deploying Database Changes

Run the `deploy_semantic_search.sh` script to deploy these changes to your Supabase project.

## How to Test

1. **Text-based expense tracking:**
   - Send messages like "I spent $25 on lunch today"
   - The system will extract amount, description, and suggest semantic tags

2. **Photo-based expense tracking:**
   - Upload a receipt photo
   - The system will parse the receipt and create an expense entry

3. **Semantic search:**
   - Ask natural language queries like:
     - "Show me my food expenses"
     - "What did I spend on coffee last month?"
     - "How much did I spend on transportation?"

## Technical Implementation Details

1. **OpenAI Integration:**
   - Using OpenAI to extract expense details from text and images
   - Using OpenAI to generate relevant semantic tags
   - Using OpenAI to interpret natural language queries

2. **Vector Search:**
   - Tags are stored with vector embeddings for semantic similarity
   - Search queries are converted to vectors to find similar tags
   - Falls back to text search when vector search is unavailable

3. **User Experience:**
   - Single conversation interface for all interactions
   - Consistent tag-based organization for expenses
   - Natural language search and input
