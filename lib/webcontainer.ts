import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;

/**
 * Get or create a WebContainer instance
 */
export async function getWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) {
    return webcontainerInstance;
  }

  try {
    webcontainerInstance = await WebContainer.boot();
    console.log('WebContainer booted successfully');
    return webcontainerInstance;
  } catch (error) {
    console.error('Failed to boot WebContainer:', error);
    throw error;
  }
}

/**
 * Check if WebContainer is available
 */
export function isWebContainerReady(): boolean {
  return webcontainerInstance !== null;
}
