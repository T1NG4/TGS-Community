const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const logger = require('./logger');

const CONFIG_FILE = 'config.json';
const CONFIG_DIR = path.join(app.getPath('userData'));

/** Pasta raiz onde ficam os apps (Pack/Mod) instalados pelo Launcher. */
function defaultAppsInstallRoot() {
  try {
    if (process.platform === 'win32' && app.isPackaged) {
      // Sem admin e estável no Windows
      return path.join(app.getPath('appData'), 'TGS Launcher', 'Apps');
    }
  } catch (_) {
    /* ignore */
  }
  return path.join(app.getPath('appData'), 'TGS Launcher', 'Apps');
}

/** Local antigo (legado) onde versões antigas colocavam TGSApps ao lado do .exe. */
function legacyAppsInstallRoot() {
  try {
    if (process.platform === 'win32' && app.isPackaged) {
      return path.join(path.dirname(app.getPath('exe')), 'TGSApps');
    }
  } catch (_) {
    /* ignore */
  }
  return null;
}

async function exists(p) {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Migração: se o utilizador já tem apps instalados no caminho legado e ainda não escolheu um installPath,
 * mantemos o legado para não “sumir” Pack/Mod instalados.
 */
async function resolveDefaultInstallPath() {
  const legacy = legacyAppsInstallRoot();
  if (!legacy) return defaultAppsInstallRoot();
  const legacyHasPack = await exists(path.join(legacy, 'packManager'));
  const legacyHasMod = await exists(path.join(legacy, 'modManager'));
  if (legacyHasPack || legacyHasMod) return legacy;
  return defaultAppsInstallRoot();
}

async function load() {
  try {
    const configPath = path.join(CONFIG_DIR, CONFIG_FILE);

    if (!fs.existsSync(configPath)) {
      const defaultConfig = {
        installPath: await resolveDefaultInstallPath(),
        createShortcuts: true,
        addToPath: false,
        language: 'pt',
        type: 'full',
        advancedOptions: {},
      };
      return defaultConfig;
    }

    const data = await fs.promises.readFile(configPath, 'utf8');
    const config = JSON.parse(data);
    if (!config.installPath || typeof config.installPath !== 'string') {
      config.installPath = await resolveDefaultInstallPath();
    }

    logger.info('Configuration loaded', config);
    return config;
  } catch (error) {
    logger.error('Failed to load configuration', error);
    throw error;
  }
}

async function save(configData) {
  try {
    const configPath = path.join(CONFIG_DIR, CONFIG_FILE);

    // Ensure config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
      await fs.promises.mkdir(CONFIG_DIR, { recursive: true });
    }

    await fs.promises.writeFile(configPath, JSON.stringify(configData, null, 2));

    logger.info('Configuration saved', configData);
    return { success: true };
  } catch (error) {
    logger.error('Failed to save configuration', error);
    throw error;
  }
}

async function reset() {
  try {
    const configPath = path.join(CONFIG_DIR, CONFIG_FILE);

    if (fs.existsSync(configPath)) {
      await fs.promises.unlink(configPath);
    }

    logger.info('Configuration reset');
    return { success: true };
  } catch (error) {
    logger.error('Failed to reset configuration', error);
    throw error;
  }
}

module.exports = {
  load,
  save,
  reset,
};