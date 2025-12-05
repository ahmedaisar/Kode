import type { WebContainer } from '@webcontainer/api';
import { logger } from './logger';

export interface FileOperationResult {
  success: boolean;
  error?: string;
}

/**
 * Create a new file in the WebContainer
 */
export async function createFile(
  webContainer: WebContainer,
  path: string,
  content: string = ''
): Promise<FileOperationResult> {
  try {
    // Ensure directory exists
    const dirPath = path.split('/').slice(0, -1).join('/');
    if (dirPath) {
      await webContainer.fs.mkdir(dirPath, { recursive: true });
    }

    // Write file
    await webContainer.fs.writeFile(path, content);
    
    logger.info('File created', { path });
    return { success: true };
  } catch (error) {
    logger.error('Failed to create file', error as Error, { path });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a file from the WebContainer
 */
export async function deleteFile(
  webContainer: WebContainer,
  path: string
): Promise<FileOperationResult> {
  try {
    await webContainer.fs.rm(path);
    
    logger.info('File deleted', { path });
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete file', error as Error, { path });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Rename/move a file in the WebContainer
 */
export async function renameFile(
  webContainer: WebContainer,
  oldPath: string,
  newPath: string
): Promise<FileOperationResult> {
  try {
    // Read the file content
    const content = await webContainer.fs.readFile(oldPath, 'utf-8');
    
    // Ensure destination directory exists
    const dirPath = newPath.split('/').slice(0, -1).join('/');
    if (dirPath) {
      await webContainer.fs.mkdir(dirPath, { recursive: true });
    }
    
    // Write to new location
    await webContainer.fs.writeFile(newPath, content);
    
    // Delete old file
    await webContainer.fs.rm(oldPath);
    
    logger.info('File renamed', { oldPath, newPath });
    return { success: true };
  } catch (error) {
    logger.error('Failed to rename file', error as Error, { oldPath, newPath });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a directory in the WebContainer
 */
export async function createDirectory(
  webContainer: WebContainer,
  path: string
): Promise<FileOperationResult> {
  try {
    await webContainer.fs.mkdir(path, { recursive: true });
    
    logger.info('Directory created', { path });
    return { success: true };
  } catch (error) {
    logger.error('Failed to create directory', error as Error, { path });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a directory and its contents from the WebContainer
 */
export async function deleteDirectory(
  webContainer: WebContainer,
  path: string
): Promise<FileOperationResult> {
  try {
    await webContainer.fs.rm(path, { recursive: true });
    
    logger.info('Directory deleted', { path });
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete directory', error as Error, { path });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
