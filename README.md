# Lovable Clone

This is a clone of [Lovable.dev](https://lovable.dev), an AI-powered development platform that enables rapid application development through natural language interactions.

## Features (Planned)

- **WebContainer Integration**: Run Node.js environments directly in the browser
- **Monaco Editor**: Code editing with syntax highlighting and IntelliSense
- **Terminal Support**: Interactive terminal using xterm.js
- **Real-time Preview**: See changes instantly as you code
- **AI-Powered Development**: Build applications using natural language

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Code Editor**: Monaco Editor (@monaco-editor/react)
- **Terminal**: xterm.js with fit addon
- **WebContainer**: @webcontainer/api for in-browser Node.js runtime
- **Icons**: Lucide React

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
