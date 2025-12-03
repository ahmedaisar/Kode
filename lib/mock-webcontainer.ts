/**
 * Utility to create mock WebContainer instance for testing
 * Use this when WebContainer is not available or for testing purposes
 */

export interface MockFileSystem {
  [path: string]: string;
}

export class MockWebContainer {
  private _fileSystem: MockFileSystem = {};

  async mount(fileTree: any) {
    // Mock implementation - convert file tree to flat structure
    const processNode = (node: any, basePath: string = '') => {
      for (const [name, value] of Object.entries(node)) {
        const path = basePath + '/' + name;
        const val = value as any;
        if (val && typeof val === 'object' && 'file' in val) {
          this._fileSystem[path] = val.file.contents;
        } else if (val && typeof val === 'object' && 'directory' in val) {
          if (val.directory) {
            processNode(val.directory, path);
          }
        }
      }
    };
    processNode(fileTree);
  }

  fs = {
    readdir: async (path: string, options?: any) => {
      const entries: any[] = [];
      const prefix = path === '/' ? '/' : path + '/';
      
      for (const filePath in this._fileSystem) {
        if (filePath.startsWith(prefix)) {
          const relativePath = filePath.substring(prefix.length);
          const name = relativePath.split('/')[0];
          
          if (name && !entries.some(e => e.name === name)) {
            entries.push({
              name,
              isFile: () => !relativePath.includes('/') || relativePath.split('/').length === 1,
              isDirectory: () => relativePath.includes('/') && relativePath.split('/').length > 1,
            });
          }
        }
      }
      
      return entries;
    },

    readFile: async (path: string, encoding: string) => {
      if (this._fileSystem[path]) {
        return this._fileSystem[path];
      }
      throw new Error(`File not found: ${path}`);
    },

    writeFile: async (path: string, content: string) => {
      this._fileSystem[path] = content;
      console.log(`[MockWebContainer] Wrote file: ${path}`);
    },

    mkdir: async (path: string) => {
      // Mock - no-op
      console.log(`[MockWebContainer] Created directory: ${path}`);
    },
  };
}

/**
 * Create a mock WebContainer for development/testing
 */
export async function createMockWebContainer(): Promise<any> {
  const mock = new MockWebContainer();
  console.log('Created mock WebContainer for testing');
  return mock;
}
