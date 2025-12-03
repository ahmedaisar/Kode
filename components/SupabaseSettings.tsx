'use client';

import { useState, useEffect } from 'react';
import { X, Database, Save, AlertCircle } from 'lucide-react';
import { useSupabase, type SupabaseCredentials } from '@/contexts/SupabaseContext';
import type { WebContainer } from '@webcontainer/api';

interface SupabaseSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  webContainer: WebContainer | null;
}

export default function SupabaseSettings({ isOpen, onClose, webContainer }: SupabaseSettingsProps) {
  const { credentials, setCredentials } = useSupabase();
  const [projectUrl, setProjectUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load existing credentials when modal opens
  useEffect(() => {
    if (isOpen && credentials) {
      setProjectUrl(credentials.projectUrl);
      setAnonKey(credentials.anonKey);
    }
  }, [isOpen, credentials]);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    // Validate inputs
    if (!projectUrl.trim() || !anonKey.trim()) {
      setError('Both Project URL and Anon Key are required');
      return;
    }

    // Validate URL format
    try {
      new URL(projectUrl);
    } catch {
      setError('Invalid Project URL format');
      return;
    }

    setIsSaving(true);

    try {
      // Save to context
      const newCredentials: SupabaseCredentials = {
        projectUrl: projectUrl.trim(),
        anonKey: anonKey.trim(),
      };
      setCredentials(newCredentials);

      // Write to .env.local in WebContainer
      if (webContainer) {
        let existingEnv = '';
        try {
          existingEnv = await webContainer.fs.readFile('/.env.local', 'utf-8');
        } catch {
          // File doesn't exist yet, which is fine
        }

        // Parse existing env vars and update/add Supabase ones
        const envVars = new Map<string, string>();
        existingEnv.split('\n').forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key) {
              envVars.set(key.trim(), valueParts.join('=').trim());
            }
          }
        });

        // Update Supabase credentials
        envVars.set('NEXT_PUBLIC_SUPABASE_URL', newCredentials.projectUrl);
        envVars.set('NEXT_PUBLIC_SUPABASE_ANON_KEY', newCredentials.anonKey);

        // Rebuild env file content
        const envContent = Array.from(envVars.entries())
          .map(([key, value]) => `${key}=${value}`)
          .join('\n') + '\n';
        
        await webContainer.fs.writeFile('/.env.local', envContent);
        console.log('Supabase credentials written to .env.local');
      }

      setSuccess(true);
      
      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Error saving Supabase credentials:', err);
      setError('Failed to save credentials. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Supabase Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure your Supabase project credentials to enable authentication and database features in your application.
          </p>

          {/* Project URL */}
          <div>
            <label htmlFor="projectUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project URL
            </label>
            <input
              id="projectUrl"
              type="text"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://xxxxxxxxxxxxx.supabase.co"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Anon Key */}
          <div>
            <label htmlFor="anonKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Anon Key
            </label>
            <textarea
              id="anonKey"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0">✓</div>
              <p className="text-sm text-green-700 dark:text-green-300">Credentials saved successfully!</p>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="font-medium mb-1">Where to find these?</p>
            <p>1. Go to your Supabase project dashboard</p>
            <p>2. Click on Settings → API</p>
            <p>3. Copy the Project URL and anon/public key</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Credentials
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
