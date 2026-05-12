const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { app } = require('electron');
const logger = require('./logger');
const { DEFAULT_INSTALL_PATHS } = require('./constants');

const CONFIG_FILE = 'config.json';
const CONFIG_DIR = path.join(app.getPath('userData'));

async function load() {
  try {
    const configPath = path.join(CONFIG_DIR, CONFIG_FILE);

    if (!fs.existsSync(configPath)) {
      // Return default config
      const defaultConfig = {
        installPath: DEFAULT_INSTALL_PATHS[process.platform] || DEFAULT_INSTALL_PATHS.win32,
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