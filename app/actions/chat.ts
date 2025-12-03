'use server';

import { createSystemPrompt, parseLLMResponse } from '@/lib/llm-parser';
import type { ChatResponse } from '@/types/chat';

/**
 * Process a chat message and return a response
 * This is a mock implementation that demonstrates the structure
 * In a real implementation, this would call OpenAI, Anthropic, or another LLM API
 */
export async function processChatMessage(
  userMessage: string,
  projectContext: string,
  hasSupabase: boolean = false
): Promise<ChatResponse> {
  try {
    // Create the system prompt with project context and Supabase status
    const systemPrompt = createSystemPrompt(projectContext, hasSupabase);

    // Mock LLM response for demonstration
    // In production, replace this with actual LLM API call:
    // const response = await openai.chat.completions.create({
    //   model: 'gpt-4',
    //   messages: [
    //     { role: 'system', content: systemPrompt },
    //     { role: 'user', content: userMessage }
    //   ]
    // });

    const mockLLMResponse = generateMockResponse(userMessage);

    // Parse the response for file changes
    const { message, fileChanges } = parseLLMResponse(mockLLMResponse);

    return {
      message,
      fileChanges,
    };
  } catch (error) {
    console.error('Error processing chat message:', error);
    return {
      message: 'Sorry, I encountered an error processing your request.',
      fileChanges: [],
    };
  }
}

/**
 * Generate a mock response for demonstration
 * This simulates what an LLM might return
 */
function generateMockResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Hello! I'm your AI coding assistant. I can help you build and modify your project. 

For example, you could ask me to:
- Create a new component
- Add a new feature
- Fix a bug
- Refactor code

What would you like me to help you with?`;
  }

  if (lowerMessage.includes('create') && lowerMessage.includes('component')) {
    return `I'll create a simple React component for you.

<file_change path="/components/Example.tsx">
export default function Example() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">Example Component</h2>
      <p className="mt-2">This is a new component created by AI.</p>
    </div>
  );
}
</file_change>

I've created a new Example component in the components directory. You can use it by importing it into your pages.`;
  }

  if (lowerMessage.includes('button')) {
    return `I'll create a reusable button component for you.

<file_change path="/components/Button.tsx">
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  className = '' 
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  };

  return (
    <button 
      onClick={onClick}
      className={\`\${baseStyles} \${variants[variant]} \${className}\`}
    >
      {children}
    </button>
  );
}
</file_change>

I've created a reusable Button component with support for primary and secondary variants. It includes proper TypeScript types and Tailwind CSS styling.`;
  }

  if (lowerMessage.includes('supabase') || lowerMessage.includes('database')) {
    return `I'll set up Supabase integration for your project.

<file_change path="/lib/supabase.ts">
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
</file_change>

<file_change path="/package.json">
{
  "name": "my-project",
  "version": "1.0.0",
  "description": "A project built with AI",
  "scripts": {
    "dev": "echo \\"Development server would start here\\""
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  }
}
</file_change>

I've created the Supabase client configuration in \`lib/supabase.ts\` and added the \`@supabase/supabase-js\` dependency to your package.json.

The client is configured to use the environment variables from your \`.env.local\` file:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

You can now use the Supabase client in your components:

\`\`\`typescript
import { supabase } from '@/lib/supabase'

// Example: Fetch data
const { data, error } = await supabase
  .from('your_table')
  .select('*')

// Example: Sign up a user
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword'
})
\`\`\``;
  }

  return `I understand you want to: "${userMessage}"

This is a demonstration of the AI chat system. In a production environment, this would be connected to a real LLM like GPT-4 or Claude.

To make file changes, the LLM would respond with XML tags like:
<file_change path="/path/to/file.js">
// file content here
</file_change>

Try asking me to "create a component" or "create a button" to see the file change system in action!`;
}
