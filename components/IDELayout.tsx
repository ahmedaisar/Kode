'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Settings, Save, FolderOpen, Code, Monitor, Terminal as TerminalIcon } from 'lucide-react';
import type { WebContainer } from '@webcontainer/api';
import { getWebContainer } from '@/lib/webcontainer';
import { createMockWebContainer } from '@/lib/mock-webcontainer';
import { useSupabase } from '@/contexts/SupabaseContext';
import { serializeFileSystem, extractFilesFromTree, writeFilesToContainer } from '@/lib/filesystem';
import { saveProject, loadProject } from '@/app/actions/persistence';
import { useToast } from './Toast';
import ChatPanel from './ChatPanel';
import SupabaseSettings from './SupabaseSettings';
import FileTree from './FileTree';
import CodeEditor from './CodeEditor';
import Terminal from './Terminal';
import Preview from './Preview';
import ResizablePane from './ResizablePane';

export default function IDELayout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [webContainer, setWebContainer] = useState<WebContainer | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string>('my-project');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'preview' | 'code' | 'chat'>('preview');
  const { isConfigured } = useSupabase();
  const { showToast } = useToast();

  // Check for mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        
        // Check if we should load a project
        const projectId = searchParams.get('id');
        
        if (projectId) {
          // Load project from database
          console.log('Loading project:', projectId);
          const result = await loadProject(projectId);
          
          if (result.success && result.data) {
            setCurrentProjectId(projectId);
            setCurrentProjectName(result.data.project.name);
            
            // Mount the loaded files
            if (result.data.files.length > 0) {
              await writeFilesToContainer(container, result.data.files);
              console.log('Loaded project files:', result.data.files.length);
            }
          } else {
            console.error('Failed to load project:', result.error);
            setError(result.error || 'Failed to load project');
          }
        } else {
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
        }

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
  }, [searchParams]);

  const handleSaveProject = async () => {
    if (!webContainer) {
      showToast('WebContainer not ready', 'error');
      return;
    }

    // Prompt for project name if it's a new project
    let projectName = currentProjectName;
    if (!currentProjectId) {
      const name = prompt('Enter a name for your project:', projectName);
      if (!name) return; // User cancelled
      projectName = name;
    }

    setIsSaving(true);
    
    try {
      // Serialize the file system
      const fs = await serializeFileSystem(webContainer);
      const files = extractFilesFromTree(fs.root);
      
      // Save to database
      const result = await saveProject({
        projectId: currentProjectId || undefined,
        projectName,
        files,
      });

      if (result.success) {
        setCurrentProjectId(result.projectId || currentProjectId);
        setCurrentProjectName(projectName);
        
        // Update URL if this is a new project
        if (!currentProjectId && result.projectId) {
          router.push(`/?id=${result.projectId}`);
        }
        
        showToast('Project saved successfully!', 'success');
      } else {
        showToast(result.error || 'Failed to save project', 'error');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      showToast('An error occurred while saving the project', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (path: string, content: string) => {
    setSelectedFile(path);
    setFileContent(content);
  };

  const handleFileClose = () => {
    setSelectedFile(null);
    setFileContent(null);
  };

  // Desktop layout
  if (!isMobile) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Kode
          </h1>
          {currentProjectName && (
            <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
              {currentProjectName}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {isMock && (
              <div className="px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                Mock Mode
              </div>
            )}
            {isConfigured && (
              <div className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Supabase
              </div>
            )}
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="My Projects"
            >
              <FolderOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleSaveProject}
              disabled={!webContainer || isSaving}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save Project"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className={`px-3 py-1 rounded-full text-sm ${
              webContainer ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
              isBooting ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {webContainer ? '●' : isBooting ? '○' : '✕'}
            </div>
          </div>
        </header>

        {/* Main content - Three pane layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left pane - File tree + Editor + Terminal */}
          <ResizablePane initialSize={50} minSize={30} maxSize={70}>
            <div className="h-full flex">
              {/* File tree */}
              <div className="w-64 flex-shrink-0">
                <FileTree 
                  webContainer={webContainer} 
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                />
              </div>

              {/* Editor and Terminal */}
              <div className="flex-1 flex flex-col">
                {showTerminal ? (
                  <ResizablePane direction="vertical" initialSize={60} minSize={30} maxSize={80}>
                    <CodeEditor
                      webContainer={webContainer}
                      selectedFile={selectedFile}
                      content={fileContent}
                      onFileClose={handleFileClose}
                    />
                    <Terminal 
                      webContainer={webContainer}
                      onClose={() => setShowTerminal(false)}
                    />
                  </ResizablePane>
                ) : (
                  <>
                    <CodeEditor
                      webContainer={webContainer}
                      selectedFile={selectedFile}
                      content={fileContent}
                      onFileClose={handleFileClose}
                    />
                    <button
                      onClick={() => setShowTerminal(true)}
                      className="h-8 bg-gray-800 text-white text-sm hover:bg-gray-700 flex items-center justify-center gap-2"
                    >
                      <TerminalIcon className="w-4 h-4" />
                      Show Terminal
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Center pane - Preview */}
            <ResizablePane initialSize={60} minSize={40} maxSize={70}>
              <Preview webContainer={webContainer} />
              
              {/* Right pane - Chat */}
              <div className="w-full">
                <ChatPanel webContainer={webContainer} />
              </div>
            </ResizablePane>
          </ResizablePane>
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

  // Mobile layout
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Kode
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleSaveProject}
            disabled={!webContainer || isSaving}
            className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {mobileView === 'preview' && <Preview webContainer={webContainer} />}
        {mobileView === 'code' && (
          <div className="h-full flex">
            <div className="w-1/3">
              <FileTree 
                webContainer={webContainer} 
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
              />
            </div>
            <div className="flex-1">
              <CodeEditor
                webContainer={webContainer}
                selectedFile={selectedFile}
                content={fileContent}
                onFileClose={handleFileClose}
              />
            </div>
          </div>
        )}
        {mobileView === 'chat' && <ChatPanel webContainer={webContainer} />}
      </div>

      {/* Bottom navigation */}
      <div className="h-14 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around">
        <button
          onClick={() => setMobileView('preview')}
          className={`flex flex-col items-center gap-1 px-4 py-2 ${
            mobileView === 'preview' ? 'text-emerald-600' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <Monitor className="w-5 h-5" />
          <span className="text-xs">Preview</span>
        </button>
        <button
          onClick={() => setMobileView('code')}
          className={`flex flex-col items-center gap-1 px-4 py-2 ${
            mobileView === 'code' ? 'text-emerald-600' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <Code className="w-5 h-5" />
          <span className="text-xs">Code</span>
        </button>
        <button
          onClick={() => setMobileView('chat')}
          className={`flex flex-col items-center gap-1 px-4 py-2 ${
            mobileView === 'chat' ? 'text-emerald-600' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="text-xs">Chat</span>
        </button>
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
