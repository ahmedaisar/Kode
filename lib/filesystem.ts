import type { WebContainer } from '@webcontainer/api';
import type { FileNode, SerializedFileSystem } from '@/types/filesystem';

/**
 * Recursively scan a directory and build a file tree
 */
async function scanDirectory(
  container: WebContainer,
  path: string,
  name: string
): Promise<FileNode> {
  const node: FileNode = {
    name,
    path,
    type: 'directory',
    children: [],
  };

  try {
    const entries = await container.fs.readdir(path, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`;
      
      if (entry.isDirectory()) {
        const childNode = await scanDirectory(container, fullPath, entry.name);
        node.children!.push(childNode);
      } else if (entry.isFile()) {
        try {
          const content = await container.fs.readFile(fullPath, 'utf-8');
          node.children!.push({
            name: entry.name,
            path: fullPath,
            type: 'file',
            content,
          });
        } catch (error) {
          console.error(`Error reading file ${fullPath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${path}:`, error);
  }

  return node;
}

/**
 * Serialize the entire WebContainer file system
 */
export async function serializeFileSystem(
  container: WebContainer
): Promise<SerializedFileSystem> {
  const root = await scanDirectory(container, '/', 'root');
  
  return {
    root,
    timestamp: Date.now(),
  };
}

/**
 * Convert a file tree to a text representation for LLM context
 */
export function fileSystemToText(fs: SerializedFileSystem): string {
  let output = '# Project File System\n\n';
  
  function traverse(node: FileNode, indent: number = 0): void {
    const prefix = '  '.repeat(indent);
    
    if (node.type === 'directory') {
      output += `${prefix}📁 ${node.name}/\n`;
      if (node.children) {
        for (const child of node.children) {
          traverse(child, indent + 1);
        }
      }
    } else {
      output += `${prefix}📄 ${node.name}\n`;
      if (node.content) {
        output += `${prefix}   Path: ${node.path}\n`;
        output += `${prefix}   Content:\n`;
        const lines = node.content.split('\n');
        const preview = lines.slice(0, 50).join('\n'); // First 50 lines
        output += preview.split('\n').map(line => `${prefix}   ${line}`).join('\n');
        if (lines.length > 50) {
          output += `\n${prefix}   ... (${lines.length - 50} more lines)`;
        }
        output += '\n\n';
      }
    }
  }
  
  traverse(fs.root);
  return output;
}

/**
 * Write files to the WebContainer
 */
export async function writeFilesToContainer(
  container: WebContainer,
  files: { path: string; content: string }[]
): Promise<void> {
  for (const file of files) {
    try {
      // Ensure parent directories exist
      const pathParts = file.path.split('/').filter(Boolean);
      let currentPath = '';
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentPath += `/${pathParts[i]}`;
        try {
          await container.fs.mkdir(currentPath);
        } catch (error) {
          // Directory might already exist
        }
      }
      
      // Write the file
      await container.fs.writeFile(file.path, file.content);
      console.log(`Successfully wrote file: ${file.path}`);
    } catch (error) {
      console.error(`Error writing file ${file.path}:`, error);
      throw error;
    }
  }
}
