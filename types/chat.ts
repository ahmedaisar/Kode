export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface FileChange {
  path: string;
  content: string;
}

export interface ChatResponse {
  message: string;
  fileChanges?: FileChange[];
}
