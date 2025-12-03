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
 * Create a system prompt with project context
 */
export function createSystemPrompt(projectContext: string): string {
  return `You are an AI coding assistant helping with a web development project.

CURRENT PROJECT STATE:
${projectContext}

IMPORTANT INSTRUCTIONS:
1. When making file changes, use this XML format:
   <file_change path="/path/to/file.ext">
   file content here
   </file_change>

2. You can provide multiple file changes in a single response.

3. Always provide clear explanations of what you're doing.

4. Use absolute paths starting with / for all file paths.

5. Be concise but thorough in your explanations.

Your role is to understand the user's request, analyze the current project state, and provide code changes that fulfill their needs.`;
}
