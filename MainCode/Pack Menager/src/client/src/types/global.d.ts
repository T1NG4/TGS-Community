export {};

declare global {
  interface Window {
    electronAPI?: {
      openPacksFolder: () => Promise<{ success: boolean; message?: string; error?: string }>;
      openExternalUrl: (url: string) => Promise<{ success: boolean; error?: string }>;
      closeWindow: () => void;
      minimizeWindow: () => void;
      toggleFullscreen: () => void;
    };
  }
}
