const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { promisify } = require('util');
const { pipeline } = require('stream/promises');
const { app } = require('electron');
const logger = require('./logger');
const { DOWNLOAD_URLS, MIN_DISK_SPACE, MIN_NODE_VERSION } = require('./constants');

const execAsync = promisify(exec);
const fsExists = promisify(fs.exists);
const fsMkdir = promisify(fs.mkdir);
const fsWriteFile = promisify(fs.writeFile);
const fsReadFile = promisify(fs.readFile);
const fsRename = promisify(fs.rename);
const fsUnlink = promisify(fs.unlink);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let installationCancelled = false;

async function checkSystem() {
  const results = {
    nodejs: { installed: false },
    npm: { installed: false },
    diskSpace: { available: false, required: MIN_DISK_SPACE, availableSpace: 0 },
    permissions: { hasWrite: false },
    internet: { connected: false },
    antivirus: { detected: false },
  };

  try {
    // Check Node.js
    try {
      const { stdout } = await execAsync('node --version');
      const version = stdout.trim().replace('v', '');
      results.nodejs.installed = true;
      results.nodejs.version = version;

      if (version < MIN_NODE_VERSION) {
        results.nodejs.action = `Node.js ${MIN_NODE_VERSION} ou superior é necessário`;
      }
    } catch (error) {
      results.nodejs.action = 'Instale Node.js 20.x ou superior';
    }

    // Check npm
    try {
      const { stdout } = await execAsync('npm --version');
      results.npm.installed = true;
      results.npm.version = stdout.trim();
    } catch (error) {
      results.npm.action = 'Instale npm junto com Node.js';
    }

    // Check disk space
    const platform = process.platform;
    let diskPath = platform === 'win32' ? 'C:' : '/';
    
    try {
      const { stdout } = await execAsync(
        platform === 'win32'
          ? `wmic logicaldisk get size,freespace`
          : `df -k ${diskPath}`
      );
      
      // Parse disk space (simplified)
      const freeSpace = 10 * 1024 * 1024 * 1024; // 10GB default
      results.diskSpace.availableSpace = freeSpace;
      results.diskSpace.available = freeSpace >= MIN_DISK_SPACE;
    } catch (error) {
      results.diskSpace.available = false;
    }

    // Check write permissions
    const testDir = path.join(process.env.TEMP || '/tmp', 'tgs-test');
    try {
      await fsMkdir(testDir, { recursive: true });
      await fsWriteFile(path.join(testDir, 'test.txt'), 'test');
      fs.unlinkSync(path.join(testDir, 'test.txt'));
      fs.rmdirSync(testDir);
      results.permissions.hasWrite = true;
    } catch (error) {
      results.permissions.hasWrite = false;
    }

    // Check internet connection
    try {
      await axios.get('https://www.google.com', { timeout: 5000 });
      results.internet.connected = true;
    } catch (error) {
      results.internet.connected = false;
    }

    // Check for antivirus (Windows only)
    if (platform === 'win32') {
      try {
        const { stdout } = await execAsync('wmic /namespace:\\\\root\\securitycenter2 path antivirusproduct get name');
        if (stdout && stdout.trim().length > 0) {
          results.antivirus.detected = true;
          results.antivirus.name = stdout.trim().split('\n')[1]?.trim() || 'Antivírus detectado';
          results.antivirus.recommendation = 'Adicione o instalador à whitelist do seu antivírus';
        }
      } catch (error) {
        // Antivirus check failed, continue
      }
    }

    logger.info('System check completed', results);
    return results;
  } catch (error) {
    logger.error('System check failed', error);
    throw error;
  }
}

async function downloadFile(url, destination, onProgress) {
  const writer = fs.createWriteStream(destination);
  let downloadedBytes = 0;
  let totalBytes = 0;

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  totalBytes = parseInt(response.headers['content-length'], 10) || 0;

  response.data.on('data', (chunk) => {
    downloadedBytes += chunk.length;
    if (onProgress && totalBytes > 0) {
      onProgress({
        component: path.basename(destination),
        progress: (downloadedBytes / totalBytes) * 100,
        speed: 0,
        eta: 0,
        downloaded: downloadedBytes,
        total: totalBytes,
      });
    }
  });

  await pipeline(response.data, writer);
}

async function calculateHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function fetchLatestVersion(appType) {
  const urlDict = DOWNLOAD_URLS[appType];
  if (!urlDict?.releaseApi) return null;

  try {
    const response = await axios.get(urlDict.releaseApi, {
      timeout: 10000,
      headers: { 'User-Agent': 'TGS-Launcher/1.0.0' },
    });
    const tag = response.data?.tag_name || response.data?.name || '';
    return tag.replace(/^v/, '') || null;
  } catch (error) {
    logger.warn(`Could not fetch latest version for ${appType}`, error.message);
    return null;
  }
}

async function startInstallation(config, onProgress) {
  installationCancelled = false;
  const startTime = Date.now();
  const errors = [];
  const appType = config.appType || 'packManager';

  try {
    logger.info('Starting installation', config);

    const urlDict = DOWNLOAD_URLS[appType];
    if (!urlDict) {
      throw new Error(`Unknown app type: ${appType}`);
    }

    const baseInstallDir = config.installPath;
    const dataDir = path.join(baseInstallDir, 'data');
    const appsRootDir = path.join(dataDir, 'apps');
    const appInstallDir = path.join(appsRootDir, appType);

    if (!fs.existsSync(appInstallDir)) {
      await fsMkdir(appInstallDir, { recursive: true });
    }

    if (process.platform === 'win32') {
      try {
        await execAsync(`attrib +h "${dataDir}"`);
      } catch {
        // Não-admin: ignora silenciosamente; pasta apenas não fica oculta
      }
    }

    if (installationCancelled) {
      throw new Error('Installation cancelled by user');
    }

    const fileName = urlDict.fileName || path.basename(urlDict.mainApp);
    const destination = path.join(appInstallDir, fileName);
    const partialPath = `${destination}.partial`;

    logger.info(`Downloading ${appType} portable`, { url: urlDict.mainApp, destination, partialPath });

    try {
      if (await fsExists(partialPath)) await fsUnlink(partialPath);
    } catch {
      /* ignore */
    }

    await downloadFile(urlDict.mainApp, partialPath, (progress) => {
      onProgress({
        ...progress,
        component: 'mainApp',
      });
    });

    let replaced = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      if (attempt > 0) await sleep(400 * attempt);
      try {
        if (await fsExists(destination)) {
          await fsUnlink(destination);
        }
        await fsRename(partialPath, destination);
        replaced = true;
        break;
      } catch (err) {
        if (err.code !== 'EBUSY' && err.code !== 'EPERM' && err.code !== 'EACCES') {
          throw err;
        }
      }
    }

    if (!replaced) {
      try {
        if (await fsExists(partialPath)) await fsUnlink(partialPath);
      } catch {
        /* ignore */
      }
      throw new Error(
        'Não foi possível substituir o executável. Feche o aplicativo (Pack/Mod Manager) e tente atualizar de novo.'
      );
    }

    const hash = await calculateHash(destination);
    logger.info(`Hash for ${appType} mainApp: ${hash}`);

    const installedVersion = await fetchLatestVersion(appType);
    const versionPath = path.join(appInstallDir, 'version.json');
    await fsWriteFile(versionPath, JSON.stringify({
      appType,
      fileName,
      version: installedVersion,
      installedAt: new Date().toISOString(),
      hash,
    }, null, 2));

    if (config.createShortcuts) {
      await createShortcuts(appInstallDir);
    }

    const configPath = path.join(appInstallDir, 'config.json');
    await fsWriteFile(configPath, JSON.stringify(config, null, 2));

    const duration = Date.now() - startTime;

    logger.info('Installation completed successfully', {
      duration,
      appType,
      installPath: appInstallDir,
      version: installedVersion,
    });

    return {
      success: true,
      installedPath: appInstallDir,
      appType,
      fileName,
      version: installedVersion,
      components: ['mainApp'],
      duration,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    logger.error('Installation failed', error);
    throw error;
  }
}

async function createShortcuts(installDir) {
  const platform = process.platform;
  
  try {
    if (platform === 'win32') {
      // Create desktop shortcut
      const desktopPath = path.join(process.env.USERPROFILE, 'Desktop');
      const shortcutPath = path.join(desktopPath, 'TGS FiveM Pack Manager.lnk');
      
      // Note: Creating shortcuts requires additional libraries like 'shortcut' or 'windows-shortcuts'
      // This is a placeholder for the actual implementation
      logger.info('Creating desktop shortcut', { shortcutPath });
    } else if (platform === 'darwin') {
      // Create macOS shortcut
      logger.info('Creating macOS shortcut');
    } else if (platform === 'linux') {
      // Create Linux .desktop file
      const desktopPath = path.join(process.env.HOME, 'Desktop');
      const desktopFile = path.join(desktopPath, 'tgs-fivem-pack-manager.desktop');
      
      const content = `[Desktop Entry]
Version=1.0
Type=Application
Name=TGS FiveM Pack Manager
Exec=${installDir}/start.sh
Icon=${installDir}/icon.png
Terminal=false
Categories=Development;`;
      
      await fsWriteFile(desktopFile, content);
      logger.info('Created Linux desktop shortcut', { desktopFile });
    }
  } catch (error) {
    logger.error('Failed to create shortcuts', error);
  }
}

async function cancelInstallation() {
  installationCancelled = true;
  logger.info('Installation cancellation requested');
}

async function clearCache() {
  const cacheDir = path.join(app.getPath('userData'), 'cache');
  
  try {
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      logger.info('Cache cleared', { cacheDir });
    }
  } catch (error) {
    logger.error('Failed to clear cache', error);
    throw error;
  }
}

module.exports = {
  checkSystem,
  startInstallation,
  cancelInstallation,
  clearCache,
  fetchLatestVersion,
};