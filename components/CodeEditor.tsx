'use client';

import { useEffect, useRef, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { WebContainer } from '@webcontainer/api';
import { Save, X } from 'lucide-react';
import { useToast } from './Toast';

interface CodeEditorProps {
  webContainer: WebContainer | null;
  selectedFile: string | null;
  content: string | null;
  onFileClose?: () => void;
}

export default function CodeEditor({ 
  webContainer, 
  selectedFile, 
  content,
  onFileClose 
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [currentContent, setCurrentContent] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (content !== null) {
      setCurrentContent(content);
      setIsDirty(false);
    }
  }, [content, selectedFile]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    
    // Configure editor
    editor.updateOptions({
      minimap: { enabled: true },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: true,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCurrentContent(value);
      setIsDirty(value !== content);
    }
  };

  const handleSave = async () => {
    if (!webContainer || !selectedFile || !isDirty) return;

    setIsSaving(true);
    try {
      // Ensure directory exists
      const dirPath = selectedFile.split('/').slice(0, -1).join('/');
      if (dirPath) {
        try {
          await webContainer.fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
          // Directory might already exist
        }
      }

      // Write file
      await webContainer.fs.writeFile(selectedFile, currentContent);
      setIsDirty(false);
      showToast('File saved successfully', 'success');
      console.log(`Saved: ${selectedFile}`);
    } catch (error) {
      console.error('Error saving file:', error);
      showToast('Failed to save file', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getLanguage = (filepath: string): string => {
    const ext = filepath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'json':
        return 'json';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No file selected</p>
          <p className="text-sm mt-2">Select a file from the tree to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {selectedFile.split('/').pop()}
          </span>
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-blue-500" title="Unsaved changes" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-3 h-3" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
          {onFileClose && (
            <button
              onClick={onFileClose}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={getLanguage(selectedFile)}
          value={currentContent}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            readOnly: !webContainer,
          }}
        />
      </div>
    </div>
  );
}

function FileCode({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  );
}
