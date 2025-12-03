import type { FileChange } from '@/types/chat';

/**
 * Parse LLM response for file changes
 * Supports both XML tags and markdown code blocks
 */
export function parseLLMResponse(response: string): {
  message: string;
  fileChanges: FileChange[];
} {
  const fileChanges: FileChange[] = [];
  let message = response;

  // Pattern 1: XML-style tags <file_change path="...">content</file_change>
  const xmlPattern = /<file_change\s+path=["']([^"']+)["']>([\s\S]*?)<\/file_change>/g;
  let match;

  while ((match = xmlPattern.exec(response)) !== null) {
    const path = match[1];
    const content = match[2].trim();
    fileChanges.push({ path, content });
  }

  // Pattern 2: Markdown code blocks with filename comment
  // ```javascript:path/to/file.js
  // content
  // ```
  const markdownPattern = /```(?:\w+)?:([^\n]+)\n([\s\S]*?)```/g;
  
  while ((match = markdownPattern.exec(response)) !== null) {
    const path = match[1].trim();
    const content = match[2].trim();
    fileChanges.push({ path, content });
  }

  // Remove file change blocks from message for cleaner display
  message = response
    .replace(xmlPattern, '')
    .replace(markdownPattern, '')
    .trim();

  return { message, fileChanges };
}

/**
 * Create a system prompt with project context and optional Supabase configuration
 */
export function createSystemPrompt(projectContext: string, hasSupabase: boolean = false): string {
  const supabaseSection = hasSupabase ? `

SUPABASE INTEGRATION:
The project has Supabase configured. When users ask to add Supabase functionality:

1. Supabase Client Setup - Create /lib/supabase.ts:
\`\`\`typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
\`\`\`

2. Dependencies - Ensure @supabase/supabase-js is in package.json:
   - If it's not present, add it to the dependencies section
   - Version: "^2.39.0" or latest

3. Common Patterns:
   - Authentication: Use supabase.auth.signUp(), signIn(), signOut()
   - Database queries: Use supabase.from('table_name').select()
   - Real-time subscriptions: Use supabase.channel().on()
   - Storage: Use supabase.storage for file uploads

4. Environment Variables:
   - NEXT_PUBLIC_SUPABASE_URL: Already configured in .env.local
   - NEXT_PUBLIC_SUPABASE_ANON_KEY: Already configured in .env.local

Example usage in a component:
\`\`\`typescript
import { supabase } from '@/lib/supabase'

// Fetch data
const { data, error } = await supabase
  .from('users')
  .select('*')

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})
\`\`\`
` : '';

  return `You are an AI coding assistant helping with a web development project.

CURRENT PROJECT STATE:
${projectContext}${supabaseSection}

IMPORTANT INSTRUCTIONS:
1. When making file changes, use this XML format:
   <file_change path="/path/to/file.ext">
   file content here
   </file_change>

2. You can provide multiple file changes in a single response.

3. Always provide clear explanations of what you're doing.

4. Use absolute paths starting with / for all file paths.

5. Be concise but thorough in your explanations.

6. When adding new dependencies, update the package.json file accordingly.

Your role is to understand the user's request, analyze the current project state, and provide code changes that fulfill their needs.`;
}
