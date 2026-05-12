'use strict';

const { app, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.allowPrerelease = false;

function setupAutoUpdater(getMainWindow) {
  const isDev = !app.isPackaged;

  const send = (channel, payload) => {
    const mainWindow = typeof getMainWindow === 'function' ? getMainWindow() : getMainWindow;
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
      mainWindow.webContents.send(channel, payload);
    }
  };

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdate] Verificando atualizações...');
    send('update-checking');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdate] Update disponível:', info?.version);
    send('update-available', { version: info?.version, releaseDate: info?.releaseDate });
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdate] Já está na versão mais recente:', info?.version);
    send('update-not-available', { version: info?.version });
  });

  autoUpdater.on('download-progress', (progress) => {
    send('download-progress', {
      percent: progress?.percent ?? 0,
      bytesPerSecond: progress?.bytesPerSecond ?? 0,
      transferred: progress?.transferred ?? 0,
      total: progress?.total ?? 0,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdate] Update baixado:', info?.version);
    send('update-downloaded', { version: info?.version });
  });

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdate] Erro:', err?.message || err);
    send('update-error', { message: err?.message || String(err) });
  });

  ipcMain.handle('check-updates', async () => {
    try {
      if (isDev) {
        return { success: false, error: 'Auto-update desabilitado em desenvolvimento' };
      }
      await autoUpdater.checkForUpdates();
      return { success: true };
    } catch (error) {
      console.error('[AutoUpdate] Falha em check-updates:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('install-update', async () => {
    try {
      autoUpdater.quitAndInstall();
      return { success: true };
    } catch (error) {
      console.error('[AutoUpdate] Falha em install-update:', error);
      return { success: false, error: error.message };
    }
  });

  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.error('[AutoUpdate] Verificação inicial falhou:', err?.message || err);
      });
    }, 5000);
  } else {
    console.log('[AutoUpdate] Modo desenvolvimento — auto-update desabilitado');
  }
}

module.exports = { setupAutoUpdater };
