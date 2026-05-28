export const APP_NAME = 'TGS FiveM Pack Manager';
export const APP_VERSION = '2.0.0';
export const LAUNCHER_VERSION = '1.0.0';

export const MIN_NODE_VERSION = '20.0.0';
export const MIN_DISK_SPACE = 2 * 1024 * 1024 * 1024; // 2GB in bytes

export const DOWNLOAD_URLS = {
  mainApp: 'https://github.com/T1NG4/TGS_fivem_pack_maneger/releases/latest',
  templates: 'https://github.com/T1NG4/TGS_fivem_pack_maneger/releases/download/v2.0.0/templates.zip',
  dependencies: 'https://github.com/T1NG4/TGS_fivem_pack_maneger/releases/download/v2.0.0/dependencies.zip',
  documentation: 'https://github.com/T1NG4/TGS_fivem_pack_maneger/releases/download/v2.0.0/docs.zip',
  examples: 'https://github.com/T1NG4/TGS_fivem_pack_maneger/releases/download/v2.0.0/examples.zip',
};

export const COMPONENT_SIZES = {
  mainApp: 150 * 1024 * 1024, // 150MB
  templates: 50 * 1024 * 1024, // 50MB
  dependencies: 200 * 1024 * 1024, // 200MB
  documentation: 10 * 1024 * 1024, // 10MB
  examples: 30 * 1024 * 1024, // 30MB
};

export const INSTALLATION_STEPS = [
  'welcome',
  'systemCheck',
  'installation',
  'configuration',
  'completion',
] as const;

export const INSTALLATION_TYPES = {
  full: {
    components: ['mainApp', 'templates', 'dependencies', 'documentation', 'examples'],
    description: 'Instalação completa com todos os componentes',
  },
  minimal: {
    components: ['mainApp', 'dependencies'],
    description: 'Instalação mínima (aplicação principal)',
  },
  offline: {
    components: ['mainApp', 'templates', 'dependencies'],
    description: 'Prepara pacote para instalação offline',
  },
} as const;

export const DEFAULT_INSTALL_PATHS = {
  win32: 'C:\\Program Files\\TGS\\FiveM Pack Manager',
  darwin: '/Applications/TGS FiveM Pack Manager',
  linux: '/opt/tgs-fivem-pack-manager',
};

export const SUPPORTED_LANGUAGES = ['pt', 'en'] as const;

export const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;

export const SECURITY_CONFIG = {
  verifySignatures: true,
  checkHashes: true,
  scanForMalware: false,
  requireHttps: true,
};

export const UPDATE_CONFIG = {
  autoCheck: true,
  checkInterval: 24 * 60 * 60 * 1000, // 24 hours
  channel: 'latest',
};