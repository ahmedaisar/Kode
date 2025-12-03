'use client';

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import type { WebContainer } from '@webcontainer/api';
import { getWebContainer } from '@/lib/webcontainer';
import { createMockWebContainer } from '@/lib/mock-webcontainer';
import { useSupabase } from '@/contexts/SupabaseContext';
import ChatPanel from './ChatPanel';
import SupabaseSettings from './SupabaseSettings';

export default function IDELayout() {
  const [webContainer, setWebContainer] = useState<WebContainer | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isConfigured } = useSupabase();

  useEffect(() => {
    async function initWebContainer() {
      try {
        // Set a timeout for WebContainer boot
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('WebContainer boot timeout')), 30000)
        );
        
        const bootPromise = getWebContainer();
        const container = await Promise.race([bootPromise, timeoutPromise]) as WebContainer;
        
        setWebContainer(container);
        
        // Initialize with a basic file structure
        await container.mount({
          'package.json': {
            file: {
              contents: JSON.stringify({
                name: 'my-project',
                version: '1.0.0',
                description: 'A project built with AI',
                scripts: {
                  dev: 'echo "Development server would start here"',
                },
              }, null, 2),
            },
          },
          'README.md': {
            file: {
              contents: '# My AI Project\n\nThis project is being built with AI assistance!\n',
            },
          },
        });

        console.log('WebContainer initialized with basic structure');
        setIsBooting(false);
      } catch (err) {
        console.error('Failed to initialize WebContainer:', err);
        
        // Fall back to mock WebContainer for testing
        try {
          const mockContainer = await createMockWebContainer();
          await mockContainer.mount({
            'package.json': {
              file: {
                contents: JSON.stringify({
                  name: 'my-project',
                  version: '1.0.0',
                  description: 'A project built with AI',
                }, null, 2),
              },
            },
            'README.md': {
              file: {
                contents: '# My AI Project\n\nThis project is being built with AI assistance!\n',
              },
            },
          });
          
          setWebContainer(mockContainer as any);
          setIsMock(true);
          setError(null);
          setIsBooting(false);
          console.log('Using mock WebContainer for testing');
        } catch (mockErr) {
          setError(err instanceof Error ? err.message : 'Failed to initialize WebContainer. Please refresh the page.');
          setIsBooting(false);
        }
      }
    }

    initWebContainer();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Lovable Clone - AI Development Platform
        </h1>
        <div className="ml-auto flex items-center gap-2">
          {isMock && (
            <div className="px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              Mock Mode
            </div>
          )}
          {isConfigured && (
            <div className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Supabase Connected
            </div>
          )}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Supabase Settings"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className={`px-3 py-1 rounded-full text-sm ${
            webContainer ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
            isBooting ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {webContainer ? '🟢 Ready' : isBooting ? '🟡 Booting...' : '🔴 Error'}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side - Code editor placeholder */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              Code Editor
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Monaco Editor will be integrated here
            </p>
            {error && (
              <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg max-w-md mx-auto">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Chat panel */}
        <div className="w-96">
          <ChatPanel webContainer={webContainer} />
        </div>
      </div>

      {/* Supabase Settings Modal */}
      <SupabaseSettings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        webContainer={webContainer}
      />
    </div>
  );
}
