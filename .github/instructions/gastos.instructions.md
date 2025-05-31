---
applyTo: '**'
---
Coding standards, domain knowledge, and preferences that AI should follow.

# Gastos AI Copilot Instructions

## 🔒 General Behavior Rules
- **Do not make changes unless 95% confident they are correct.** When uncertain, ask the user for clarification.
- **Always prefer clarity and simplicity.** Follow established best practices in React, Next.js, and the tools listed below.

## ⚙️ Tech Stack & Tools
- **Frameworks:** Next.js 15 (Web)
- **Backend & DB:** Supabase (PostgreSQL), pgvector for semantic search
- **AI:** OpenAI (GPT-4, `text-embedding-3-small`)
- **UI:** ShadCN for UI components, styled with Tailwind CSS
- **Validation:** Zod for schema validation
- **Language:** TypeScript

## 🧠 Domain Knowledge: Gastos MVP
- Gastos is an **AI-powered expense tracker** with a **chat-first interface**, backed by both Web and Telegram clients.
- Expense input is parsed from messages like:  
  `5 SGD for lunch` or `3.50 train ticket`
- Focus on **quick capture, AI-categorization (tags or categories), and summarization**.
- Features include:
  - Email-based login, followed by onboarding for **timezone** and **currency**
  - Chat and form-based **expense logging**
  - Time-period-based **summaries** (e.g., "Today", "This Week")
  - Simple **CRUD for expenses** with tag support
- Defer advanced features (e.g. analytics, bank integrations, multi-currency) unless explicitly requested.

## 📁 Project Structure
- **`/specs`**: Contains up-to-date feature breakdowns and project specs. Always review these before implementing or suggesting new logic.
- **Context7 Tool:** Use this to look up usage patterns and examples for any tool or technology above.

---

## ✅ React / Next.js Best Practices

### 📦 Code Structure & Project Organization
- Organize by **feature**, not file type (e.g., `/features/expenses`, `/features/auth`).
- Use **barrel exports** (`index.ts`) to simplify import paths.
- Keep components **small, focused, and composable**.

### 🔄 Component Design
- Default to **server components** in Next.js App Router. Add `use client` only when needed.
- Minimize prop drilling — use context or URL/search params when appropriate.
- Memoize with `useMemo`, `useCallback`, or `React.memo` for expensive logic.
- Create **custom hooks** (e.g., `useExpenses`, `useAuth`) to encapsulate logic.
- Dynamically import non-critical UI using `dynamic(() => import(...), { ssr: false })`.

### 🧪 State Management
- Use `useState` or `useReducer` for local UI state.
- Use **React Context** for app-wide shared state (e.g., user session, theme).
- Avoid Redux unless absolutely necessary.

### 🧼 Clean Code Practices
- Enforce **strict typing** — no `any`. Use Zod schemas to drive types.
- Name boolean props with prefixes (`is`, `has`, `can`).
- Extract constants (e.g., tag limits, scan rates) into enums or config files.
- Always **destructure props** and prefer meaningful names.

### 🖼️ UI/UX with ShadCN & Tailwind
- Use consistent **spacing**, **typography**, and **corner radius** via Tailwind (e.g., `gap-4`, `text-sm`, `rounded-xl`).
- Stick to **ShadCN component patterns** (e.g., `<Button>`, `<Card>`, `<Input>`).
- Use `lucide-react` icons with accessible labels.
- Add subtle motion with `framer-motion` for modals, drawers, feedback.
- Support all UI states: **loading**, **empty**, **error**, **success**.
- Prioritize **accessibility** (`aria-*`, keyboard navigation, color contrast).

### 📤 API & Data Handling (Supabase)
- Prefer using **Supabase server-side** in server components when fetching.
- Always **validate user inputs** with Zod before database interaction.
- Wrap logic in hooks like `useCreateExpense`, `useFetchTags`.
- Enforce authorization with **Supabase RLS** (Row-Level Security).

### 🔐 Authentication
- Use middleware to protect authenticated routes.
- Restore sessions gracefully on page load — show skeletons or loaders during auth hydration.
- Never store sensitive data in local state or `localStorage`.

### ⚡ Performance Optimizations
- Lazy-load infrequent pages (e.g., analytics, settings).
- Use `next/image` for image optimization and responsiveness.
- Debounce search, tag suggestion, or AI input where needed.
- Split large UI into smaller memoized pieces.

### Other Instructions
- Always check the codebase for existing patterns before implementing new features.
- Always check the codebase for relevant code and if the feature already exists.
- Use the existing codebase as a reference for new features.
- Do not do anything else that is not mentioned in the instructions.
- Do not make any assumptions about the codebase or the project.
- Use your tools especially Context7 to look up usage patterns and examples for any tool or technology above and Supabase to look check the current state of the database.