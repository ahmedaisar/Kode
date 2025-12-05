'use client';

import { useState, useEffect, useRef } from 'react';
import type { WebContainer } from '@webcontainer/api';
import { RefreshCw, ExternalLink, Maximize2 } from 'lucide-react';

interface PreviewProps {
  webContainer: WebContainer | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function Preview({ 
  webContainer, 
  isExpanded = false,
  onToggleExpand 
}: PreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!webContainer) return;

    const startServer = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if package.json has a dev script
        let hasDevScript = false;
        try {
          const packageJson = await webContainer.fs.readFile('/package.json', 'utf-8');
          const pkg = JSON.parse(packageJson);
          hasDevScript = !!pkg.scripts?.dev;
        } catch (e) {
          // package.json might not exist or be invalid
        }

        if (hasDevScript) {
          // Install dependencies first
          console.log('Installing dependencies...');
          const installProcess = await webContainer.spawn('npm', ['install']);
          
          const installExitCode = await installProcess.exit;
          
          if (installExitCode !== 0) {
            throw new Error('Failed to install dependencies');
          }

          // Start the dev server
          console.log('Starting dev server...');
          const devProcess = await webContainer.spawn('npm', ['run', 'dev']);

          // Listen for server ready
          webContainer.on('server-ready', (port, url) => {
            console.log('Server ready:', { port, url });
            setUrl(url);
            setIsLoading(false);
          });

          // Handle server output
          devProcess.output.pipeTo(
            new WritableStream({
              write(data) {
                console.log('Dev server:', data);
              },
            })
          );
        } else {
          // No dev script, show a simple HTML preview
          console.log('No dev script found, serving static files');
          
          // Create a simple index.html if it doesn't exist
          try {
            await webContainer.fs.readFile('/index.html', 'utf-8');
          } catch (e) {
            // Create a default index.html
            await webContainer.fs.writeFile(
              '/index.html',
              `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #2563eb; }
    .info {
      background: #f0f9ff;
      border-left: 4px solid #2563eb;
      padding: 16px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>Welcome to Your Project</h1>
  <div class="info">
    <p>This is a basic preview. To enable a development server:</p>
    <ol>
      <li>Add a framework (React, Vue, etc.)</li>
      <li>Configure a dev script in package.json</li>
      <li>The preview will automatically update</li>
    </ol>
  </div>
  <p>Start building by asking the AI assistant to create components!</p>
</body>
</html>`
            );
          }

          // Start a simple HTTP server
          const serverProcess = await webContainer.spawn('npx', [
            'serve',
            '-s',
            '.',
            '-l',
            '3000',
          ]);

          webContainer.on('server-ready', (port, url) => {
            console.log('Static server ready:', { port, url });
            setUrl(url);
            setIsLoading(false);
          });
        }
      } catch (err) {
        console.error('Error starting preview:', err);
        setError(err instanceof Error ? err.message : 'Failed to start preview');
        setIsLoading(false);
      }
    };

    startServer();
  }, [webContainer]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleOpenInNewTab = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Preview
          </h3>
          {url && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {new URL(url).port}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {url && (
            <>
              <button
                onClick={handleRefresh}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={handleOpenInNewTab}
                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </>
          )}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={isExpanded ? 'Minimize' : 'Maximize'}
            >
              <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Starting preview...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
            <div className="text-center max-w-md px-4">
              <div className="text-red-500 mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Preview Error
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {url && !isLoading && (
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
          />
        )}
        
        {!url && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>Waiting for preview to start...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
