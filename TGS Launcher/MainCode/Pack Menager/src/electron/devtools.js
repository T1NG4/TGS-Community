'use strict';

const { globalShortcut } = require('electron');

/** DevTools no portable: F12, Ctrl+Shift+I, --devtools / --ga-debug */
function wantDevToolsOnStartup(argv = process.argv) {
  return argv.includes('--devtools') || argv.includes('--ga-debug');
}

function toggleDevToolsWebContents(wc) {
  if (!wc || wc.isDestroyed()) return;
  if (wc.isDevToolsOpened()) {
    wc.closeDevTools();
  } else {
    wc.openDevTools({ mode: 'detach' });
  }
}

const GLOBAL_SHORTCUTS = ['F12', 'CommandOrControl+Shift+I'];

function registerGlobalDevToolsShortcuts(toggleFn) {
  for (const accelerator of GLOBAL_SHORTCUTS) {
    try {
      if (!globalShortcut.isRegistered(accelerator)) {
        globalShortcut.register(accelerator, toggleFn);
      }
    } catch (err) {
      console.warn(`[Pack DevTools] Falha ao registrar ${accelerator}:`, err?.message || err);
    }
  }
}

function unregisterGlobalDevToolsShortcuts() {
  for (const accelerator of GLOBAL_SHORTCUTS) {
    try {
      if (globalShortcut.isRegistered(accelerator)) {
        globalShortcut.unregister(accelerator);
      }
    } catch {
      /* ignore */
    }
  }
}

function setupDevTools(window, options = {}) {
  const { openOnStart = false } = options;
  if (!window?.webContents) return;

  const wc = window.webContents;
  const toggle = () => toggleDevToolsWebContents(wc);

  const onBeforeInput = (event, input) => {
    if (input.type !== 'keyDown') return;
    const key = String(input.key || '');
    const code = String(input.code || '');
    const isF12 = key === 'F12' || code === 'F12';
    const isDevToolsCombo =
      (input.control || input.meta) &&
      input.shift &&
      (key.toLowerCase() === 'i' || code === 'KeyI');
    if (!isF12 && !isDevToolsCombo) return;
    toggle();
    event.preventDefault();
  };

  wc.on('before-input-event', onBeforeInput);

  window.on('focus', () => registerGlobalDevToolsShortcuts(toggle));
  window.on('blur', () => unregisterGlobalDevToolsShortcuts());
  window.on('closed', () => {
    unregisterGlobalDevToolsShortcuts();
    wc.removeListener('before-input-event', onBeforeInput);
  });

  if (openOnStart) {
    window.once('ready-to-show', () => {
      wc.openDevTools({ mode: 'detach' });
    });
  }
}

module.exports = {
  setupDevTools,
  wantDevToolsOnStartup,
  unregisterGlobalDevToolsShortcuts,
};
