'use client';

import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

export interface SupabaseCredentials {
  projectUrl: string;
  anonKey: string;
}

interface SupabaseContextType {
  credentials: SupabaseCredentials | null;
  setCredentials: (credentials: SupabaseCredentials | null) => void;
  isConfigured: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<SupabaseCredentials | null>(null);

  const isConfigured = useMemo(
    () => credentials !== null && 
      credentials.projectUrl.trim() !== '' && 
      credentials.anonKey.trim() !== '',
    [credentials]
  );

  return (
    <SupabaseContext.Provider value={{ credentials, setCredentials, isConfigured }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
