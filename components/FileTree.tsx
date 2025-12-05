'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import type { WebContainer } from '@webcontainer/api';
import { serializeFileSystem } from '@/lib/filesystem';
import type { FileNode } from '@/types/filesystem';

interface FileTreeProps {
  webContainer: WebContainer | null;
  onFileSelect: (path: string, content: string) => void;
  selectedFile: string | null;
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: TreeNode[];
  isExpanded?: boolean;
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'tsx':
    case 'ts':
    case 'jsx':
    case 'js':
      return <FileCode className="w-4 h-4 text-blue-500" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-500" />;
    case 'md':
    case 'txt':
      return <FileText className="w-4 h-4 text-gray-500" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return <ImageIcon className="w-4 h-4 text-purple-500" />;
    default:
      return <File className="w-4 h-4 text-gray-400" />;
  }
}

function buildTree(fileNode: FileNode, basePath: string = ''): TreeNode[] {
  const tree: TreeNode[] = [];
  
  if (fileNode.type === 'directory' && fileNode.children) {
    Object.entries(fileNode.children).forEach(([name, child]) => {
      const path = basePath ? `${basePath}/${name}` : name;
      
      if (child.type === 'directory') {
        tree.push({
          name,
          path,
          isDirectory: true,
          children: buildTree(child, path),
          isExpanded: false,
        });
      } else {
        tree.push({
          name,
          path,
          isDirectory: false,
        });
      }
    });
  }
  
  // Sort: directories first, then files, both alphabetically
  return tree.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}

function TreeNodeComponent({ 
  node, 
  level, 
  onToggle, 
  onFileSelect, 
  selectedFile 
}: { 
  node: TreeNode; 
  level: number; 
  onToggle: (path: string) => void;
  onFileSelect: (path: string) => void;
  selectedFile: string | null;
}) {
  const isSelected = selectedFile === node.path;
  
  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          if (node.isDirectory) {
            onToggle(node.path);
          } else {
            onFileSelect(node.path);
          }
        }}
      >
        {node.isDirectory ? (
          <>
            {node.isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            {node.isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500" />
            )}
          </>
        ) : (
          <>
            <div className="w-4" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
          {node.name}
        </span>
      </div>
      
      {node.isDirectory && node.isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.path}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree({ webContainer, onFileSelect, selectedFile }: FileTreeProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const loadFileTree = async () => {
    if (!webContainer) return;
    
    setIsLoading(true);
    try {
      const fs = await serializeFileSystem(webContainer);
      const nodes = buildTree(fs.root);
      setTree(nodes);
    } catch (error) {
      console.error('Error loading file tree:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (webContainer) {
      loadFileTree();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webContainer]);

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
    
    // Update tree with expanded state
    setTree((prevTree) => {
      const updateNode = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map((node) => {
          if (node.path === path) {
            return { ...node, isExpanded: !node.isExpanded };
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });
      };
      return updateNode(prevTree);
    });
  };

  const handleFileSelect = async (path: string) => {
    if (!webContainer) return;
    
    try {
      const content = await webContainer.fs.readFile(path, 'utf-8');
      onFileSelect(path, content);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Files
        </h3>
        <button
          onClick={loadFileTree}
          className="text-xs text-emerald-600 dark:text-blue-400 hover:underline"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {tree.length === 0 && !isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No files found
          </div>
        ) : (
          tree.map((node) => (
            <TreeNodeComponent
              key={node.path}
              node={node}
              level={0}
              onToggle={toggleExpand}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
          ))
        )}
      </div>
    </div>
  );
}
