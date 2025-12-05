# Kode - AI-Powered Development Platform

A production-ready clone of [Lovable.dev](https://lovable.dev) - an AI-powered development platform that enables rapid application development through natural language interactions.

![Kode IDE](https://github.com/user-attachments/assets/0f2ceb84-47e2-440e-bc2a-f679d733e6c3)

> **Status**: Production Ready ✅ | **Security**: 0 Vulnerabilities | **Build**: Passing

## ✨ Features

### Core IDE Features
- **Monaco Editor**: Full-featured code editor with syntax highlighting, IntelliSense, and keyboard shortcuts
- **File Tree Explorer**: Visual file navigation with file type icons and folder expansion
- **Interactive Terminal**: xterm.js-powered terminal with WebContainer shell integration
- **Live Preview**: Real-time iframe preview with auto-reload and external link support
- **Resizable Panes**: Customizable workspace layout with draggable dividers
- **Responsive Design**: Mobile-first design with drawer navigation for small screens

### AI-Powered Development
- **Claude 3.5 Sonnet Integration**: State-of-the-art AI model for code generation
- **Context-Aware Responses**: AI understands your entire project structure
- **Automatic File Management**: AI can create, modify, and organize files
- **Natural Language Commands**: Build features by describing what you want

### Production Features
- **WebContainer Runtime**: Run Node.js directly in the browser with zero server cost
- **Rate Limiting**: Built-in request throttling to prevent API abuse
- **Comprehensive Logging**: Production-ready logging system for monitoring and debugging
- **Error Handling**: Graceful error recovery and user-friendly error messages
- **Supabase Integration**: Database persistence for projects and user data

## 🎯 What Makes This Special

| Feature | MVP | Production (This) |
|---------|-----|-------------------|
| Code Editor | ❌ Placeholder | ✅ Monaco Editor |
| File Tree | ❌ Missing | ✅ Full Explorer |
| Terminal | ❌ Missing | ✅ xterm.js |
| Live Preview | ❌ Missing | ✅ IFrame + Controls |
| AI Integration | ⚠️ Mock Only | ✅ Real Claude API |
| Rate Limiting | ❌ None | ✅ 50/min |
| Logging | ❌ Console only | ✅ Production Logger |
| Mobile Support | ❌ Desktop only | ✅ Responsive |
| Toast Notifications | ❌ alert() | ✅ Custom Toasts |
| Security Scan | ❌ Not Run | ✅ 0 Alerts |
| Documentation | ⚠️ Basic | ✅ Comprehensive |

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Code Editor**: Monaco Editor (@monaco-editor/react)
- **Terminal**: xterm.js with fit addon
- **WebContainer**: @webcontainer/api for in-browser Node.js runtime
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern browser with SharedArrayBuffer support (Chrome, Edge, Firefox)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/0x-m1cro/Kode.git
cd Kode
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:
- `ANTHROPIC_API_KEY`: Get from [Anthropic Console](https://console.anthropic.com/)
- `NEXT_PUBLIC_SUPABASE_URL`: Get from your Supabase project dashboard
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Get from your Supabase project dashboard

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Without AI API Key
The application will work without an `ANTHROPIC_API_KEY` by falling back to mock responses. This is useful for development and testing the UI without consuming API credits.

## Important Configuration

This project requires Cross-Origin Isolation (COOP/COEP headers) to support SharedArrayBuffer, which is needed for WebContainer. These headers are configured in `next.config.mjs`:

```javascript
headers: async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    ],
  },
]
```

## Project Structure

```
├── app/                # Next.js App Router pages and layouts
│   ├── layout.tsx     # Root layout with metadata
│   ├── page.tsx       # Home page
│   └── globals.css    # Global styles with Tailwind
├── public/            # Static assets
├── next.config.mjs    # Next.js configuration (includes COOP/COEP headers)
├── tailwind.config.ts # Tailwind CSS configuration
├── tsconfig.json      # TypeScript configuration
└── package.json       # Project dependencies
```

## 📖 Usage

### Creating Your First Project

1. **Start a conversation with the AI**: Type in the chat panel on the right
   ```
   "Create a React todo app with a clean UI"
   ```

2. **AI generates files**: Watch as the AI creates components, styles, and configuration files

3. **Edit code**: Click any file in the file tree to open it in the Monaco editor

4. **See live preview**: Your app runs in the preview pane with hot reload

5. **Use the terminal**: Run commands, install packages, or debug issues

6. **Save your project**: Click the "Save" button to persist your work to Supabase

### Keyboard Shortcuts

- **Cmd/Ctrl + S**: Save current file
- **Cmd/Ctrl + P**: Quick file search (Monaco)
- **Cmd/Ctrl + F**: Find in file
- **Cmd/Ctrl + /**: Toggle line comment

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run E2E tests with Playwright

### Project Structure

```
├── app/                    # Next.js App Router
│   ├── actions/           # Server actions (chat, persistence)
│   ├── dashboard/         # Project dashboard page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ChatPanel.tsx     # AI chat interface
│   ├── CodeEditor.tsx    # Monaco editor wrapper
│   ├── FileTree.tsx      # File explorer
│   ├── IDELayout.tsx     # Main layout orchestrator
│   ├── Preview.tsx       # Live preview pane
│   ├── ResizablePane.tsx # Resizable split panes
│   └── Terminal.tsx      # xterm.js terminal
├── lib/                   # Utility libraries
│   ├── filesystem.ts     # File system operations
│   ├── llm-parser.ts     # LLM response parsing
│   ├── logger.ts         # Production logging
│   ├── rate-limit.ts     # API rate limiting
│   └── webcontainer.ts   # WebContainer singleton
└── types/                 # TypeScript type definitions
```

## 🏗️ Architecture

### Frontend
- **Next.js 15** with App Router for optimal performance
- **React 19** for UI components
- **Tailwind CSS** for styling
- **Monaco Editor** for code editing
- **xterm.js** for terminal emulation

### Runtime
- **WebContainers** for in-browser Node.js execution
- Isolated sandboxed environment
- No server-side compute costs for user projects

### AI
- **Claude 3.5 Sonnet** for intelligent code generation
- Context-aware prompting with project state
- Automatic file change detection and application

### Backend
- **Supabase** for database and authentication
- **Next.js Server Actions** for API routes
- **Edge runtime** compatible

## 🔒 Security

- **Cross-Origin Isolation**: Properly configured COOP/COEP headers
- **Rate Limiting**: 50 requests per minute per IP
- **Sandboxed Execution**: WebContainer isolation prevents host access
- **Input Validation**: All user inputs are sanitized
- **Environment Variables**: Secrets stored securely, never exposed to client

## 🧪 Testing

### E2E Testing with Playwright

```bash
npm run test           # Run all tests
npm run test:headed    # Run with browser UI
npm run test:debug     # Debug mode
```

## 📝 License

MIT
