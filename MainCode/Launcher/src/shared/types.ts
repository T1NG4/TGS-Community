export interface SystemCheckResult {
  nodejs: {
    installed: boolean;
    version?: string;
    action?: string;
  };
  npm: {
    installed: boolean;
    version?: string;
    action?: string;
  };
  diskSpace: {
    available: boolean;
    required: number;
    availableSpace: number;
  };
  permissions: {
    hasWrite: boolean;
    suggestedPath?: string;
  };
  internet: {
    connected: boolean;
    speed?: number;
  };
  antivirus: {
    detected: boolean;
    name?: string;
    recommendation?: string;
  };
}

export interface InstallationConfig {
  type: 'full' | 'minimal' | 'offline';
  installPath: string;
  createShortcuts: boolean;
  addToPath: boolean;
  language: 'pt' | 'en';
  advancedOptions?: {
    customEnvVars?: Record<string, string>;
    ideIntegration?: boolean;
    postInstallScript?: string;
  };
}

export interface InstallationResult {
  success: boolean;
  installedPath: string;
  components: string[];
  duration: number;
  errors?: string[];
}

export interface DownloadProgress {
  component: string;
  progress: number;
  speed: number;
  eta: number;
  downloaded: number;
  total: number;
}

export interface CacheManager {
  checkCache(component: string, version: string): Promise<boolean>;
  downloadWithCache(url: string, component: string): Promise<string>;
  clearCache(): Promise<void>;
  getCacheSize(): Promise<number>;
}

export interface SecurityValidator {
  validateSignature(filePath: string): Promise<boolean>;
  checkHash(filePath: string, expectedHash: string): Promise<boolean>;
  scanForMalware(filePath: string): Promise<boolean>;
  verifyCertificate(url: string): Promise<boolean>;
}

export interface InstallerState {
  currentStep: 'welcome' | 'systemCheck' | 'installation' | 'configuration' | 'completion';
  systemCheckResults?: SystemCheckResult;
  installationConfig?: InstallationConfig;
  installationProgress?: DownloadProgress[];
  installationResult?: InstallationResult;
}