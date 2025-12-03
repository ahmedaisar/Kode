# Supabase Integration Guide

This document describes the Supabase integration feature implemented in Phase 3.

## Overview

The Supabase integration enables users to connect their AI-generated applications to a Supabase backend for authentication, database, and storage features. The system handles credential management, environment configuration, and provides AI assistance for generating Supabase-related code.

## Features

### 1. Credential Management

Users can configure their Supabase credentials through a settings modal:

- **Project URL**: The Supabase project URL (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
- **Anon Key**: The public/anonymous API key for client-side access

**How to access:**
1. Click the settings icon (⚙️) in the top-right corner of the IDE
2. Enter your Supabase Project URL and Anon Key
3. Click "Save Credentials"

**Finding your credentials:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "Project URL" and "anon/public" key

### 2. Environment Variable Management

When credentials are saved, they are automatically written to `.env.local` in the WebContainer filesystem:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Features:**
- Preserves existing environment variables
- Updates only Supabase-related keys
- Automatically applies to the running project

### 3. AI-Powered Code Generation

The AI assistant is enhanced with Supabase knowledge and can generate integration code automatically.

**Usage:**
Simply ask the AI to "add supabase" or "set up supabase", and it will:

1. Create `lib/supabase.ts` with the client configuration:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

2. Add `@supabase/supabase-js` to `package.json` dependencies

### 4. Visual Indicators

- **Settings Button**: Gear icon in the header for easy access to Supabase settings
- **Connection Status Badge**: Green "Supabase Connected" badge appears when credentials are configured
- **Success Feedback**: Visual confirmation when credentials are saved

## Architecture

### Components

#### `SupabaseContext` (`contexts/SupabaseContext.tsx`)
React Context for managing Supabase credentials state:
- Stores credentials in React state
- Provides `isConfigured` status (memoized for performance)
- Available throughout the app via `useSupabase()` hook

#### `SupabaseSettings` (`components/SupabaseSettings.tsx`)
Modal component for credential input:
- Form validation (URL format, required fields)
- Writes to `.env.local` on save
- Preserves existing environment variables
- Success/error feedback
- Auto-closes after successful save

#### `IDELayout` Updates
- Integrates settings button in header
- Displays connection status badge
- Wraps app with `SupabaseProvider`

### AI Integration

#### System Prompt Enhancement (`lib/llm-parser.ts`)
When Supabase is configured, the AI system prompt includes:
- Client initialization patterns
- Common usage examples (auth, database, storage)
- Dependency management instructions
- Best practices for Next.js integration

#### Mock Response (`app/actions/chat.ts`)
Demonstrates the AI's ability to:
- Generate Supabase client setup
- Update package.json with dependencies
- Provide usage examples

## Usage Examples

### Basic Setup

1. **Configure Credentials:**
```typescript
// User enters credentials in settings modal
// System automatically creates .env.local
```

2. **Generate Client Code:**
```typescript
// User asks AI: "add supabase"
// AI creates lib/supabase.ts and updates package.json
```

3. **Use in Components:**
```typescript
import { supabase } from '@/lib/supabase'

// Fetch data
const { data, error } = await supabase
  .from('users')
  .select('*')

// Sign up user
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})
```

### Advanced Patterns

#### Authentication
```typescript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Sign out
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

#### Database Queries
```typescript
// Insert
const { data, error } = await supabase
  .from('posts')
  .insert({ title: 'Hello World', content: 'First post' })

// Update
const { data, error } = await supabase
  .from('posts')
  .update({ title: 'Updated Title' })
  .eq('id', 1)

// Delete
const { data, error } = await supabase
  .from('posts')
  .delete()
  .eq('id', 1)
```

#### Real-time Subscriptions
```typescript
const channel = supabase
  .channel('posts')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'posts' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

#### File Storage
```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', file)

// Download file
const { data, error } = await supabase.storage
  .from('avatars')
  .download('public/avatar1.png')
```

## Security Considerations

1. **Anon Key is Public**: The anon key is meant to be public and is safe to use in client-side code
2. **Row Level Security**: Always enable RLS on your Supabase tables
3. **Environment Variables**: Keys are stored in `.env.local` which is gitignored
4. **No Secrets in Code**: Service role keys should NEVER be used in client code

## Testing

The implementation includes:
- ✅ Unit tests for context and components (if test infrastructure exists)
- ✅ Integration tests for .env.local file creation
- ✅ Manual UI testing with screenshots
- ✅ AI response validation
- ✅ Build and lint verification
- ✅ Security scan (CodeQL)

## Future Enhancements

Potential improvements for future iterations:
- Persistent credential storage (localStorage/sessionStorage)
- Credential validation against Supabase API
- Support for multiple environments (dev/staging/prod)
- Service role key management (server-side only)
- Built-in Supabase schema inspector
- Database migration helpers
- Real-time connection status monitoring

## Troubleshooting

### Credentials Not Saving
- Ensure WebContainer is fully initialized (check status indicator)
- Check browser console for error messages
- Verify URL format is correct (must start with https://)

### AI Not Generating Code
- Confirm "Supabase Connected" badge is visible
- Try rephrasing the request (e.g., "set up supabase integration")
- Check that WebContainer is ready

### Environment Variables Not Working
- Restart the development server (if applicable)
- Verify .env.local exists in the WebContainer filesystem
- Check variable names match exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Support

For issues or questions:
1. Check the console for error messages
2. Verify WebContainer is running
3. Review the Supabase documentation: https://supabase.com/docs
4. Check the implementation files for inline comments

---

**Implementation Date**: December 2024  
**Phase**: 3 - Full-Stack Integration  
**Status**: ✅ Complete
