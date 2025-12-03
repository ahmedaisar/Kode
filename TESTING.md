# Phase 2: AI Intelligence (Chat-to-Code) - Testing Guide

This document provides instructions for testing the Phase 2 implementation.

## Features Implemented

### 1. Context Awareness (Read State)
- **File System Scanning**: `lib/filesystem.ts` contains utilities to recursively scan and serialize the WebContainer file system
- **Serialization**: Converts the file tree into both structured format and text format for LLM context
- **Functions**:
  - `serializeFileSystem(container)` - Scans and returns structured file tree
  - `fileSystemToText(fs)` - Converts to text representation for LLM

### 2. Chat Interface
- **Component**: `components/ChatPanel.tsx`
- **Features**:
  - Message input field
  - Conversation history display (user & assistant messages)
  - Loading indicators
  - File update feedback
  - Auto-scroll to latest messages

### 3. LLM Integration
- **Server Action**: `app/actions/chat.ts`
- **Current State**: Mock implementation for demonstration
- **To integrate real LLM**:
  1. Install AI SDK: `npm install ai openai` (or `@anthropic-ai/sdk`)
  2. Add API key to `.env.local`: `OPENAI_API_KEY=your-key`
  3. Replace mock in `processChatMessage()` with actual LLM call

Example integration:
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ]
});
```

### 4. Response Parsing & File Writing
- **Parser**: `lib/llm-parser.ts`
- **Supported Formats**:
  1. XML tags: `<file_change path="/path/to/file.ext">content</file_change>`
  2. Markdown: ` ```language:path/to/file.ext\ncontent\n``` `
- **File Writing**: Automatically applies parsed changes to WebContainer

## Testing Instructions

### Manual Testing

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open the application**:
   Navigate to `http://localhost:3000`

3. **Wait for WebContainer to boot**:
   - Status indicator in header will show "🟢 Ready" when ready
   - Chat input will become enabled

4. **Test the chat interface**:

   **Test Case 1: Hello/Greeting**
   - Input: "Hello"
   - Expected: Friendly greeting with capabilities list

   **Test Case 2: Create a component**
   - Input: "create a component"
   - Expected: Creates `/components/Example.tsx` with a React component

   **Test Case 3: Create a button**
   - Input: "create a button"
   - Expected: Creates `/components/Button.tsx` with a reusable button component

   **Test Case 4: General request**
   - Input: "help me build a todo app"
   - Expected: Demo message explaining the system

5. **Verify file changes**:
   - Check browser console for "Successfully wrote file" messages
   - Files are written to WebContainer (in-memory file system)
   - Future: Integrate file explorer to view created files

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │   Code Editor       │  │    Chat Panel           │  │
│  │   (Placeholder)     │  │  - Message History      │  │
│  │                     │  │  - User Input           │  │
│  └─────────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  WebContainer API                        │
│  - In-browser Node.js runtime                           │
│  - File system (in-memory)                              │
│  - Process execution                                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Server Actions                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  processChatMessage()                             │  │
│  │  1. Serialize project context                     │  │
│  │  2. Create system prompt                          │  │
│  │  3. Call LLM API (mock)                          │  │
│  │  4. Parse response for file changes               │  │
│  │  5. Return to client                              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Client-side Processing                      │
│  1. Receive LLM response                                │
│  2. Apply file changes to WebContainer                  │
│  3. Update UI with feedback                             │
│  4. Display assistant message                           │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
app/
├── actions/
│   └── chat.ts              # Server action for chat
├── page.tsx                 # Main page (uses IDELayout)
└── layout.tsx               # Root layout

components/
├── ChatPanel.tsx            # Chat UI component
└── IDELayout.tsx            # Main IDE layout

lib/
├── filesystem.ts            # File system utilities
├── llm-parser.ts            # LLM response parser
└── webcontainer.ts          # WebContainer management

types/
├── chat.ts                  # Chat-related types
└── filesystem.ts            # File system types
```

## Next Steps

1. **Add real LLM integration** - Replace mock with OpenAI/Anthropic API
2. **Add Monaco Editor** - Show code in left panel
3. **Add File Explorer** - Display WebContainer files
4. **Add Terminal** - Show command output
5. **Improve error handling** - Better user feedback
6. **Add streaming responses** - Real-time LLM output
7. **Add conversation persistence** - Save chat history
8. **Add file tree view** - Visual file navigation

## Known Issues

1. **WebContainer boot time**: Can take 10-30 seconds in some environments
2. **Browser compatibility**: Requires SharedArrayBuffer support (Chrome, Edge, Firefox)
3. **CORS headers**: Requires Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy headers (already configured)

## Troubleshooting

**WebContainer won't boot**:
- Check browser console for errors
- Ensure COOP/COEP headers are set (check `next.config.mjs`)
- Try a different browser (Chrome recommended)
- Refresh the page

**Chat not responding**:
- Ensure WebContainer status shows "Ready"
- Check browser console for errors
- Verify network requests in DevTools

**Files not being created**:
- Check console for "Successfully wrote file" messages
- Verify the LLM response format matches expected patterns
- Currently, files are only in memory (WebContainer), not on disk
