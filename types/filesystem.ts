export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileNode[];
}

export interface SerializedFileSystem {
  root: FileNode;
  timestamp: number;
}
