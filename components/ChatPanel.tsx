'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, FileEdit } from 'lucide-react';
import { processChatMessage } from '@/app/actions/chat';
import { useSupabase } from '@/contexts/SupabaseContext';
import type { Message } from '@/types/chat';
import type { WebContainer } from '@webcontainer/api';
import { serializeFileSystem, fileSystemToText, writeFilesToContainer } from '@/lib/filesystem';

interface ChatPanelProps {
  webContainer: WebContainer | null;
}

export default function ChatPanel({ webContainer }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filesBeingUpdated, setFilesBeingUpdated] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isConfigured } = useSupabase();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !webContainer) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Serialize the current file system for context
      const fs = await serializeFileSystem(webContainer);
      const projectContext = fileSystemToText(fs);

      // Process the message with the server action
      const response = await processChatMessage(input, projectContext, isConfigured);

      // Apply file changes if any
      if (response.fileChanges && response.fileChanges.length > 0) {
        setFilesBeingUpdated(response.fileChanges.map((f) => f.path));
        
        try {
          await writeFilesToContainer(webContainer, response.fileChanges);
          console.log(`Applied ${response.fileChanges.length} file changes`);
        } catch (error) {
          console.error('Error applying file changes:', error);
        }
        
        setFilesBeingUpdated([]);
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          AI Assistant
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {webContainer ? 'Ready to help' : 'WebContainer loading...'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p className="text-lg mb-2">👋 Hi! I&apos;m your AI assistant.</p>
            <p className="text-sm">Ask me to create components, add features, or modify your code!</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
              <div className="text-xs mt-1 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Update Indicator */}
      {filesBeingUpdated.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <FileEdit className="w-4 h-4" />
            <span>Updating {filesBeingUpdated.length} file(s)...</span>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={webContainer ? "Ask me anything..." : "Waiting for WebContainer..."}
            disabled={isLoading || !webContainer}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !webContainer}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
