export {};

declare global {
  interface Window {
    electronAPI?: {
      openPacksFolder: () => Promise<{ success: boolean; message?: string; error?: string }>;
      closeWindow: () => void;
      minimizeWindow: () => void;
      toggleFullscreen: () => void;
    };
  }
}
