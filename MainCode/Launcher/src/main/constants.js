const APP_NAME = 'TGS FiveM Pack Manager';
const APP_VERSION = '2.0.0';
const LAUNCHER_VERSION = '2.0.12';

const MIN_NODE_VERSION = '20.0.0';
const MIN_DISK_SPACE = 2 * 1024 * 1024 * 1024; // 2GB in bytes

// Repositórios públicos de releases (T maiúsculo no TGS)
const RELEASES_REPOS = {
  launcher: 'T1NG4/TGS-launcher-releases',
  packManager: 'T1NG4/TGS-pack-manager-releases',
  modManager: 'T1NG4/TGS-mod-manager-releases',
};

const DOWNLOAD_URLS = {
  packManager: {
    fileName: 'TGS-Pack-Manager-Portable.exe',
    mainApp: `https://github.com/${RELEASES_REPOS.packManager}/releases/latest/download/TGS-Pack-Manager-Portable.exe`,
    latestYml: `https://github.com/${RELEASES_REPOS.packManager}/releases/latest/download/latest.yml`,
    releaseApi: `https://api.github.com/repos/${RELEASES_REPOS.packManager}/releases/latest`,
  },
  modManager: {
    fileName: 'TGS-Mod-Manager-Portable.exe',
    mainApp: `https://github.com/${RELEASES_REPOS.modManager}/releases/latest/download/TGS-Mod-Manager-Portable.exe`,
    latestYml: `https://github.com/${RELEASES_REPOS.modManager}/releases/latest/download/latest.yml`,
    releaseApi: `https://api.github.com/repos/${RELEASES_REPOS.modManager}/releases/latest`,
  }
};

const COMPONENT_SIZES = {
  mainApp: 150 * 1024 * 1024, // 150MB
  templates: 50 * 1024 * 1024, // 50MB
  dependencies: 200 * 1024 * 1024, // 200MB
  documentation: 10 * 1024 * 1024, // 10MB
  examples: 30 * 1024 * 1024, // 30MB
};

const INSTALLATION_STEPS = [
  'welcome',
  'systemCheck',
  'installation',
  'configuration',
  'completion',
];

const INSTALLATION_TYPES = {
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
};

const DEFAULT_INSTALL_PATHS = {
  win32: 'C:\\Program Files\\TGS\\FiveM Pack Manager',
  darwin: '/Applications/TGS FiveM Pack Manager',
  linux: '/opt/tgs-fivem-pack-manager',
};

const SUPPORTED_LANGUAGES = ['pt', 'en'];

const LOG_LEVELS = ['error', 'warn', 'info', 'debug'];

const SECURITY_CONFIG = {
  verifySignatures: true,
  checkHashes: true,
  scanForMalware: false,
  requireHttps: true,
};

const UPDATE_CONFIG = {
  autoCheck: true,
  checkInterval: 24 * 60 * 60 * 1000, // 24 hours
  channel: 'latest',
};

module.exports = {
  APP_NAME,
  APP_VERSION,
  LAUNCHER_VERSION,
  MIN_NODE_VERSION,
  MIN_DISK_SPACE,
  DOWNLOAD_URLS,
  RELEASES_REPOS,
  COMPONENT_SIZES,
  INSTALLATION_STEPS,
  INSTALLATION_TYPES,
  DEFAULT_INSTALL_PATHS,
  SUPPORTED_LANGUAGES,
  LOG_LEVELS,
  SECURITY_CONFIG,
  UPDATE_CONFIG,
};