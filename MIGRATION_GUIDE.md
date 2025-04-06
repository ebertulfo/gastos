# Firebase to Supabase Migration Guide

This document outlines the steps to complete the migration from Firebase to Supabase for the Gastos app.

## Prerequisites

1. A Supabase project set up with the following environment variables configured:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin/server operations)

## Migration Steps

### 1. Database Schema Setup

Run the `supabase_schema_setup.sql` file in your Supabase SQL editor. This will create all the necessary tables:
- `user_profiles` - For user profile data
- `expenses` - For expense records
- `auth_codes` - For Telegram verification codes
- `auth_tokens` - For authentication tokens

### 2. Data Migration

#### Export Data from Firebase

1. Export your Firebase Firestore data using the Firebase console or the Firebase CLI:
   ```bash
   firebase firestore:export ./firestore-export
   ```

2. Convert the exported data to a format compatible with Supabase:
   - User profiles should map to the `user_profiles` table
   - Expenses should map to the `expenses` table
   - Any authentication codes should map to the `auth_codes` table

#### Import Data to Supabase

1. Using the Supabase interface or the REST API, import your data into the corresponding tables
2. Make sure to preserve user IDs and relationships between tables

### 3. Authentication Migration

1. Export your Firebase Authentication users
2. Import them into Supabase Auth:
   - This can be done through the Supabase dashboard or API
   - Make sure to maintain the same email addresses and passwords (if possible)

### 4. Update Environment Variables

1. Remove the following Firebase-related environment variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

2. Make sure the following Supabase variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 5. Remove Firebase Dependencies

Once testing confirms the migration is successful, you can remove the Firebase dependencies:

```bash
npm uninstall firebase firebase-admin
```

### 6. Cleanup

Remove any unused Firebase-related files:
- `/src/lib/firebase/*`
- `/src/dataStores/firebase.ts`

## Troubleshooting

### Common Issues

1. **Authentication Issues**: 
   - Make sure the auth tokens and user IDs are properly migrated
   - Check that RLS policies are correctly set up in Supabase

2. **Missing Data**:
   - Verify that all data was properly exported from Firebase
   - Ensure all data was correctly imported into Supabase

3. **API Errors**:
   - Check that the Supabase client is properly initialized with the correct URL and API key
   - Verify that the service role key is being used for admin operations