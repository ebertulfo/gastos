# Gastos Web Application - Current State Specification

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive overview of the current state of the Gastos web application. It serves as a reference for understanding the existing functionality, architecture, and implementation details to inform future development and expansion.

### 1.2 Project Overview
Gastos is an expense tracking application that helps users manage and monitor their spending. The web application allows users to log expenses, categorize them, view spending analytics, and interact with an AI assistant for expense management.

### 1.3 Current State
As of May 7, 2025, Gastos is a fully functional web application with core expense tracking functionality, an AI assistant interface, and a responsive design built on Next.js and Supabase.

## 2. System Architecture

### 2.1 Technology Stack
- **Frontend**: 
  - Next.js (v15.2.4)
  - React (v19.0.0-rc)
  - TypeScript
  - Tailwind CSS
  
- **Backend**: 
  - Next.js API routes
  - Supabase (PostgreSQL)
  
- **Authentication**: 
  - Supabase Auth
  
- **External APIs**: 
  - OpenAI API for AI assistant functionality
  
- **Styling/UI**: 
  - Tailwind CSS
  - shadcn/ui components
  - Radix UI primitives
  - Geist font

### 2.2 System Components
- **Authentication Module**: Handles user registration, login, and session management via AuthContext
- **Expense Management Module**: Core functionality for tracking and managing expenses
- **Dashboard Module**: Provides overview and analytics of spending
- **Chat Module**: AI assistant interface for expense logging and queries
- **Travel Mode**: Feature for handling expenses in different currencies during travel

## 3. Database Schema

### 3.1 Main Tables
- **user_profiles**: 
  - id (UUID, primary key, references auth.users)
  - email (text)
  - telegram_id (text)
  - telegramLinked (boolean)
  - onboarded (boolean)
  - created_at (timestamp)
  - updated_at (timestamp)

- **expenses**: 
  - id (UUID, primary key)
  - user_id (UUID, references auth.users)
  - amount (decimal)
  - description (text)
  - category (text)
  - date (timestamp)
  - createdAt (timestamp)
  - currency (text, default 'USD')
  - telegram_user_id (text)
  - is_travel_expense (boolean)
  - travel_currency (text)
  - original_amount (decimal)
  - exchange_rate (decimal)

- **chat_messages**: 
  - id (UUID, primary key)
  - user_id (UUID, references auth.users)
  - content (text)
  - role (text)
  - timestamp (timestamp)
  - expense_id (UUID, optional)
  - attachment_url (text, optional)
  - action (text, optional)

- **auth_codes**: For Telegram verification
- **auth_tokens**: For API authentication

### 3.2 Key Relationships
- Users have many expenses (one-to-many)
- Users have many chat messages (one-to-many)
- Chat messages may reference expenses (many-to-one)

## 4. Core Features

### 4.1 User Authentication
- Email-based registration and login
- Password-based authentication
- Protected routes requiring authentication
- Session persistence
- User profile management

### 4.2 Expense Tracking
- Add new expenses manually
- Edit existing expenses
- Delete expenses
- Categorize expenses based on predefined categories
- View expense history in list and card formats
- Filter expenses by date range and category
- Support for multiple currencies

### 4.3 Dashboard & Analytics
- Total spending overview
- Category breakdown with visualization
- Recent transactions list
- Travel expenses tracking
- Period-based filtering (day, week, month, year)

### 4.4 AI Chat Assistant
- Natural language expense logging
- Image receipt processing for automatic expense extraction
- Conversational interface for expense queries
- AI-powered expense categorization
- Support for uploading receipts

### 4.5 Travel Mode
- Toggle between regular and travel expense tracking
- Currency conversion with exchange rates
- Separate reporting for travel expenses
- Original amount tracking in foreign currency

## 5. User Interface

### 5.1 Pages/Routes
- `/` - Landing page for non-authenticated users
- `/sign-in` - User authentication
- `/onboarding` - First-time user setup
- `/dashboard` - Main dashboard with spending overview
- `/expenses` - Expense management
- `/profile` - User profile management

### 5.2 Components
- **Navigation**:
  - NavBar
  - Theme toggle
  - Travel mode toggle

- **Authentication**:
  - LoginDialog
  - Registration form
  - Password reset functionality

- **Expense Management**:
  - ExpenseDialog
  - ExpensesList
  - ExpensesTable
  - AddExpenseForm
  - ConfirmExpenseDialog

- **Dashboard**:
  - Spending summary
  - Category breakdown charts
  - Recent transactions

- **Chat Interface**:
  - ChatUI
  - ChatInput
  - MessageList
  - MessageItem
  - OnboardingDialog

### 5.3 UI Library
A comprehensive set of UI components based on shadcn/ui and Radix primitives:
- Alert dialog
- Badge
- Button
- Card
- Checkbox
- Command
- Dialog
- Dropdown menu
- Form
- Input
- Label
- Popover
- Select
- Switch
- Table
- Toast notifications

## 6. API Endpoints

### 6.1 Authentication
- `/api/auth/*` - Supabase authentication endpoints

### 6.2 Expenses
- `GET /api/expenses` - Retrieve expenses with filtering
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/[id]` - Update existing expense
- `DELETE /api/expenses/[id]` - Delete expense
- `GET /api/expenses/web` - Web-specific expense endpoint

### 6.3 Messages
- `GET /api/messages` - Retrieve chat history
- `POST /api/messages` - Send new message to AI assistant
- `POST /api/messages/web` - Web-specific message handling

### 6.4 Webhooks
- `/api/webhooks/*` - Endpoints for external service integrations

## 7. Business Logic & Services

### 7.1 Core Services
- **ExpenseService**: Legacy service for expense operations
- **SupabaseExpenseService**: Current implementation for expense CRUD operations
- **ChatMessageService**: Handles chat message operations
- **OpenAIExpenseParser**: Parses expense information from text or images
- **OpenAIIntentDetector**: Detects user intents in chat messages

### 7.2 Context Providers
- **AuthContext**: Manages authentication state
- **TravelModeContext**: Manages travel mode state

### 7.3 Interface Definitions
- **IDataStore**: Interface for data storage operations
- **IExpenseHandler**: Interface for expense handling
- **IExpenseParser**: Interface for parsing expenses
- **IExpenseService**: Interface for expense service operations
- **IImageParser**: Interface for parsing images
- **IIntentDetector**: Interface for detecting intents

## 8. Authentication Implementation

### 8.1 Authentication Flow
- Authentication state managed via AuthContext
- JWT tokens stored in cookies
- Session validation on protected routes
- User information retrieval from Supabase

### 8.2 Protected Routes
- Implementation via useProtectedRoute hook
- Redirects unauthenticated users to login page
- Handles loading states during authentication checks

## 9. Performance Considerations

### 9.1 Current Optimizations
- Next.js optimized chunk loading
- Lazy loading of components
- Package import optimization
- Image optimization

### 9.2 Known Performance Bottlenecks
- Initial loading of chat history
- Large expense datasets rendering
- AI response generation time

## 10. Migration Status

### 10.1 Firebase to Supabase
- Migration complete
- All data and authentication moved to Supabase
- Legacy Firebase code removed
- Supabase Row Level Security (RLS) implemented

### 10.2 Legacy Code
- Some legacy service implementations maintained for compatibility
- Deprecation notices added to guide developers to newer implementations

## 11. Known Issues & Limitations

### 11.1 Technical Debt
- Dual implementation of expense services (legacy and current)
- Inconsistent date handling across components
- Some components need refactoring for better state management

### 11.2 Feature Limitations
- Limited offline capability
- Basic analytics without advanced reporting
- No budget tracking functionality
- Limited data export options

## 12. Testing Infrastructure

### 12.1 Current Testing
- Manual testing procedures
- Basic error handling and validation

### 12.2 Testing Gaps
- Limited automated tests
- No end-to-end testing
- Inconsistent error handling

## 13. Deployment

### 13.1 Current Deployment
- Vercel hosting
- Supabase database and authentication
- Environment variables management
- Production and development environments

### 13.2 CI/CD
- Basic deployment pipeline through Vercel
- Manual testing before deployment

## 14. Future Development Roadmap (Current Plans)

### 14.1 Near-Term Improvements
- Mobile application development
- Enhanced analytics and reporting
- Budget tracking features
- Data export capabilities

### 14.2 Technical Improvements
- Code consolidation and refactoring
- Improved testing infrastructure
- Performance optimizations
- Enhanced offline capabilities

## 15. Appendix

### 15.1 Expense Categories
- Food
- Transportation
- Housing
- Entertainment
- Utilities
- Healthcare
- Shopping
- Travel
- Education
- Personal Care
- Gifts
- Investments
- Other

### 15.2 Supported Currencies
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- JPY (Japanese Yen)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)
- PHP (Philippine Peso)
- CHF (Swiss Franc)
- CNY (Chinese Yuan)
- INR (Indian Rupee)
- SGD (Singapore Dollar)
- MXN (Mexican Peso)
- BRL (Brazilian Real)

### 15.3 File Structure Overview
The project follows a structured organization with:
- `/app` - Next.js app router pages and API routes
- `/components` - React components including UI library
- `/contexts` - React context providers
- `/dataStores` - Data storage implementations
- `/handlers` - Business logic handlers
- `/hooks` - Custom React hooks
- `/interfaces` - TypeScript interfaces
- `/lib` - Utilities and constants
- `/schemas` - Zod schemas for validation
- `/services` - Service implementations
- `/supabase` - Supabase migrations and configuration

---

## Document Information
- **Version**: 1.0
- **Last Updated**: May 7, 2025
- **Status**: Approved