# Phase 5: Cloud Sync & Persistence

## Overview

Phase 5 implements cloud-based project persistence using Supabase (PostgreSQL) as the backend. Users can now save their projects to the database and resume work later from any device. This builds upon the existing Supabase integration from Phase 3 by adding project and file management capabilities.

## Features

### 1. Database Schema

**Location**: `supabase/schema.sql`

#### Projects Table
- `id` (UUID, Primary Key): Unique project identifier
- `user_id` (UUID, Foreign Key): Owner of the project
- `name` (TEXT): Human-readable project name
- `last_modified` (TIMESTAMP): Last update time
- `created_at` (TIMESTAMP): Creation time

#### Files Table
- `id` (UUID, Primary Key): Unique file identifier
- `project_id` (UUID, Foreign Key): Associated project
- `path` (TEXT): File path in the project (e.g., `/src/App.tsx`)
- `content` (TEXT): File contents
- `created_at` (TIMESTAMP): Creation time
- `updated_at` (TIMESTAMP): Last update time
- **Constraint**: Unique combination of (project_id, path)

#### Row Level Security (RLS)

Both tables have RLS enabled with policies ensuring:
- Users can only view, create, update, and delete their own projects
- Users can only access files belonging to their own projects
- All operations are authenticated via `auth.uid()`

### 2. Server-Side Supabase Client

**Location**: `lib/supabase-server.ts`

Provides utilities for server-side operations:
- `createSupabaseServerClient()`: Creates a Supabase client with SSR cookie handling
- `getCurrentUser()`: Returns the authenticated user or null

Uses `@supabase/ssr` for proper cookie management in Next.js Server Actions.

### 3. Server Actions

**Location**: `app/actions/persistence.ts`

Four main server actions:

#### `saveProject(input: SaveProjectInput)`
- Creates a new project or updates an existing one
- Accepts: `projectId` (optional), `projectName`, and array of `files`
- Returns: `{ success, projectId?, error? }`
- Behavior:
  - If `projectId` provided: Updates project metadata and replaces all files
  - If no `projectId`: Creates new project with generated UUID
  - Deletes existing files before inserting new ones (handles file deletions)

#### `loadProject(projectId: string)`
- Fetches a project and all its associated files
- Returns: `{ success, data?: { project, files }, error? }`
- Only returns projects owned by the current user

#### `listProjects()`
- Lists all projects for the current user
- Sorted by `last_modified` (newest first)
- Returns: `{ success, data?: Project[], error? }`

#### `deleteProject(projectId: string)`
- Deletes a project and all its files (cascade delete)
- Returns: `{ success, error? }`
- Only deletes if the user owns the project

### 4. Dashboard Page

**Location**: `app/dashboard/page.tsx`

A dedicated page for project management:

**Features:**
- Grid layout displaying all user projects
- Each project card shows:
  - Project name
  - Last modified time (relative format: "2 hours ago")
  - "Open Project" button
  - Delete button with confirmation
- Empty state with helpful message for new users
- Error state with retry functionality
- Loading states for all async operations

**Navigation:**
- "Back to IDE" button (returns to `/`)
- "New Project" button (creates fresh project)
- "Open Project" navigates to `/?id={projectId}`

### 5. IDE Integration

**Updated**: `components/IDELayout.tsx`

#### Save Functionality
- New "Save" button in the header (blue button with save icon)
- Click behavior:
  - For new projects: Prompts for project name
  - For existing projects: Updates silently
  - Serializes entire WebContainer file system
  - Calls `saveProject()` server action
  - Updates URL with project ID (e.g., `/?id=123`)
  - Shows loading state while saving
  - Displays success/error feedback

#### Resume Functionality
- Checks for `id` query parameter on boot
- If found:
  - Calls `loadProject()` to fetch files
  - Uses `writeFilesToContainer()` to mount files
  - Sets project name in header
  - Maintains project ID for future saves
- If not found:
  - Initializes with default template (package.json + README.md)

#### Additional UI Elements
- "Projects" button: Links to `/dashboard`
- Project name displayed in header when loaded
- All buttons respect authentication state

### 6. File System Utilities

**Updated**: `lib/filesystem.ts`

New function added:

#### `extractFilesFromTree(node: FileNode)`
- Recursively traverses file tree
- Extracts all files into flat array
- Returns: `Array<{ path: string, content: string }>`
- Used by save functionality to prepare files for database

Existing functions:
- `serializeFileSystem()`: Scans WebContainer and builds file tree
- `fileSystemToText()`: Converts tree to text for LLM
- `writeFilesToContainer()`: Mounts files into WebContainer

### 7. Type Definitions

**Location**: `types/persistence.ts`

```typescript
interface Project {
  id: string;
  user_id: string;
  name: string;
  last_modified: string;
  created_at: string;
}

interface ProjectFile {
  id: string;
  project_id: string;
  path: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface SaveProjectInput {
  projectId?: string;
  projectName: string;
  files: { path: string; content: string }[];
}

interface LoadProjectResult {
  project: Project;
  files: { path: string; content: string }[];
}
```

## Setup Instructions

### 1. Supabase Project Setup

1. Create a Supabase project at https://supabase.com
2. Go to the SQL Editor in your project dashboard
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL script to create tables and RLS policies

### 2. Environment Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Get these values from: Supabase Dashboard → Settings → API

### 3. Authentication Setup

**Note**: This implementation assumes you have Supabase authentication configured from Phase 3. The system uses `auth.uid()` for RLS policies.

If you haven't set up authentication yet, you need to:
1. Configure an auth provider in Supabase (email, OAuth, etc.)
2. Implement sign-in/sign-up UI (not included in this phase)
3. Store auth tokens in cookies (handled by `@supabase/ssr`)

## Usage Examples

### Saving a Project

```typescript
// User clicks "Save" button in IDE
// If new project, prompted for name
// If existing, name is already set

const fs = await serializeFileSystem(webContainer);
const files = extractFilesFromTree(fs.root);

const result = await saveProject({
  projectId: currentProjectId || undefined,
  projectName: 'My Awesome App',
  files: [
    { path: '/package.json', content: '{ "name": "app" }' },
    { path: '/src/App.tsx', content: 'export default function App() { ... }' },
  ]
});

if (result.success) {
  // Update UI, show success message
  // Update URL: /?id={projectId}
}
```

### Loading a Project

```typescript
// User navigates to /?id=abc-123-def
// Or clicks "Open Project" from dashboard

const result = await loadProject('abc-123-def');

if (result.success && result.data) {
  // Mount files into WebContainer
  await writeFilesToContainer(container, result.data.files);
  
  // Update UI with project name
  setProjectName(result.data.project.name);
}
```

### Listing Projects

```typescript
// Dashboard page loads
const result = await listProjects();

if (result.success && result.data) {
  // Display projects in grid
  setProjects(result.data);
}
```

### Deleting a Project

```typescript
// User clicks delete button, confirms
const result = await deleteProject('abc-123-def');

if (result.success) {
  // Remove from UI
  setProjects(projects.filter(p => p.id !== 'abc-123-def'));
}
```

## Workflow Examples

### Scenario 1: First-Time User

1. User visits `/` → sees default template
2. Uses AI to build an app
3. Clicks "Save" → prompted for project name
4. Enters "Todo App" → saved to database
5. URL updates to `/?id=uuid`
6. Continues working, clicks "Save" again → updates existing project

### Scenario 2: Returning User

1. User visits `/dashboard` → sees list of projects
2. Clicks "Open Project" on "Todo App"
3. Redirected to `/?id=uuid`
4. WebContainer boots, files loaded from database
5. User sees their previous work restored
6. Makes changes, clicks "Save" → updates database

### Scenario 3: Multi-Device

1. User builds app on Desktop, saves as "Portfolio"
2. Switches to Laptop, visits `/dashboard`
3. Sees "Portfolio" in project list
4. Opens it → exact same files loaded
5. Makes changes on Laptop, saves
6. Returns to Desktop, opens project → sees Laptop changes

## Architecture Decisions

### Why Delete-and-Insert for File Updates?

The `saveProject()` function deletes all existing files before inserting new ones. This approach:
- ✅ Handles file deletions automatically
- ✅ Simpler than diffing old vs new files
- ✅ Atomic operation (all files replaced together)
- ⚠️ Less efficient for large projects with few changes

**Future optimization**: Implement delta updates by comparing file paths and contents.

### Why Prompt for Project Name on First Save?

- Improves user experience (clear project identity)
- Avoids generic "Untitled Project 1, 2, 3..."
- User can provide meaningful names upfront
- Can be changed later by updating project metadata

### Why Store File Content as TEXT?

- PostgreSQL TEXT type has no size limit (up to 1GB)
- Simpler than managing file uploads to storage buckets
- Binary files could be base64-encoded if needed
- For very large projects, consider blob storage integration

### Why Flat File List in Database?

- Directory structure is implicit in file paths
- Simplifies queries and RLS policies
- Easy to reconstruct directory tree from paths
- Matches WebContainer file system model

## Security Considerations

### Row Level Security (RLS)

- **Critical**: All database tables have RLS enabled
- Users can ONLY access their own data
- Enforced at database level (cannot be bypassed)
- Uses `auth.uid()` from Supabase Auth

### Server Actions

- All persistence operations run on server
- Authenticated via Supabase SSR cookies
- Input validation before database operations
- Error messages don't leak sensitive information

### Client-Side Security

- Never store service role keys in client code
- Only anon/public key is exposed (safe for client use)
- WebContainer runs isolated in browser
- No file system access to user's machine

### Best Practices

1. **Always validate projectId**: Server actions verify ownership
2. **Sanitize file paths**: Prevent directory traversal
3. **Limit file sizes**: Consider adding validation
4. **Rate limiting**: Add for production (not implemented)
5. **Audit logging**: Track project changes (not implemented)

## Testing

### Manual Testing Checklist

#### Database Schema
- [ ] Run `supabase/schema.sql` in SQL Editor
- [ ] Verify tables created: `projects`, `files`
- [ ] Check RLS policies are enabled
- [ ] Test policies with authenticated user

#### Save Functionality
- [ ] Save new project (prompted for name)
- [ ] Save existing project (silent update)
- [ ] Verify files appear in database
- [ ] Verify last_modified timestamp updates
- [ ] Check URL includes project ID

#### Load Functionality
- [ ] Navigate to `/?id=valid-uuid`
- [ ] Verify files load into WebContainer
- [ ] Check project name appears in header
- [ ] Test with invalid UUID (error handling)

#### Dashboard
- [ ] Visit `/dashboard`
- [ ] Verify all projects listed
- [ ] Check "Last modified" times
- [ ] Open project from list
- [ ] Delete project with confirmation
- [ ] Test empty state (no projects)

#### Error Handling
- [ ] Save without authentication → error message
- [ ] Load non-existent project → error message
- [ ] Delete someone else's project → error
- [ ] Network failure → graceful error

#### Edge Cases
- [ ] Save project with 0 files
- [ ] Save project with 100+ files
- [ ] Load project with special characters in names
- [ ] Multiple rapid saves (debouncing)
- [ ] Save while WebContainer is booting

### Automated Testing

Currently, the implementation focuses on functionality. Future improvements:

```typescript
// Example tests (not implemented)
describe('saveProject', () => {
  it('creates new project with generated UUID', async () => {
    const result = await saveProject({
      projectName: 'Test Project',
      files: [{ path: '/test.js', content: 'test' }]
    });
    expect(result.success).toBe(true);
    expect(result.projectId).toBeDefined();
  });

  it('updates existing project', async () => {
    // Test implementation
  });

  it('requires authentication', async () => {
    // Test implementation
  });
});
```

## Performance Considerations

### Current Implementation

- **Save operation**: Deletes all files, then inserts all files
  - Time complexity: O(n) where n = number of files
  - Database operations: 1 project update + 1 delete + n inserts
  
- **Load operation**: Single query for project + single query for files
  - Time complexity: O(n) where n = number of files
  - Database operations: 2 queries total

### Optimizations for Large Projects

1. **Batch Inserts**: Already implemented (single INSERT for all files)
2. **Indexed Queries**: Indexes on `user_id` and `project_id`
3. **Delta Updates**: Future improvement (only update changed files)
4. **Compression**: Store file content as compressed BYTEA
5. **Pagination**: For dashboard (not needed for <1000 projects)

### Database Limits

- PostgreSQL row limit: None (effectively unlimited)
- TEXT field size: 1GB per file
- Recommended max files per project: <10,000
- Recommended max file size: <10MB (large files → storage bucket)

## Known Limitations

1. **No Authentication UI**: Assumes auth is already set up
2. **No Project Metadata**: Can't add description, tags, etc.
3. **No Collaboration**: One project = one owner
4. **No Version History**: Latest version only
5. **No Conflict Resolution**: Last write wins
6. **No Offline Mode**: Requires internet connection
7. **No File Size Limits**: Could cause issues with very large files
8. **No Binary File Support**: TEXT storage (base64 encoding needed)

## Future Enhancements

### Short-Term
- [ ] Add project description field
- [ ] Implement auto-save (every 30 seconds)
- [ ] Add "Last saved" indicator in UI
- [ ] Add "Save as Copy" functionality
- [ ] Add project search/filter in dashboard
- [ ] Add project templates

### Medium-Term
- [ ] Implement delta updates (only changed files)
- [ ] Add version history (snapshots)
- [ ] Add file size validation
- [ ] Add rate limiting
- [ ] Add project sharing (read-only links)
- [ ] Add project export (ZIP download)

### Long-Term
- [ ] Real-time collaboration (multiple users)
- [ ] Conflict resolution UI
- [ ] Binary file support via storage buckets
- [ ] Git-like branching/merging
- [ ] Activity feed (who changed what)
- [ ] Project analytics (build times, etc.)

## Troubleshooting

### "Not authenticated" Error

**Problem**: Server actions return authentication error.

**Solutions**:
1. Ensure Supabase Auth is configured
2. Check that user is signed in
3. Verify cookies are being passed to server
4. Check browser console for auth errors

### "Project not found" Error

**Problem**: Trying to load project that doesn't exist.

**Solutions**:
1. Check if project ID in URL is correct
2. Verify project exists in database
3. Check if project belongs to current user
4. Clear URL parameter and create new project

### Files Not Appearing in WebContainer

**Problem**: Project loads but files are missing.

**Solutions**:
1. Check database contains files for project
2. Verify `writeFilesToContainer()` succeeds
3. Check browser console for errors
4. Verify WebContainer is fully booted before loading

### Save Button Disabled

**Problem**: Cannot save project.

**Solutions**:
1. Wait for WebContainer to finish booting
2. Check "🟢 Ready" status indicator
3. Refresh page and try again
4. Check network connection

### Database Connection Issues

**Problem**: All operations fail.

**Solutions**:
1. Verify `.env.local` has correct credentials
2. Check Supabase project is active
3. Test connection in Supabase dashboard
4. Verify RLS policies are correct

## Migration Guide

### From Phase 3 to Phase 5

If you already have Phase 3 implemented:

1. Install new dependencies:
   ```bash
   npm install @supabase/ssr
   ```

2. Run the SQL schema:
   - Copy `supabase/schema.sql`
   - Paste in Supabase SQL Editor
   - Execute

3. No code changes needed to existing Phase 3 features
4. New features are additive (backward compatible)

### Database Migrations

For existing projects, no data migration needed:
- New tables are independent
- RLS policies are self-contained
- No foreign keys to existing tables

## Support

### Resources
- Supabase Documentation: https://supabase.com/docs
- Next.js Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- @supabase/ssr Guide: https://supabase.com/docs/guides/auth/server-side/nextjs

### Common Issues
- See "Troubleshooting" section above
- Check browser console for errors
- Check Supabase dashboard for logs
- Verify network tab shows requests

---

**Implementation Date**: December 2024  
**Phase**: 5 - Cloud Sync & Persistence  
**Status**: ✅ Complete
