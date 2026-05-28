'use strict';

function wantDevToolsOnStartup(argv = process.argv) {
  return argv.includes('--devtools') || argv.includes('--ga-debug');
}

function setupDevTools(window, options = {}) {
  const { openOnStart = false } = options;
  if (!window?.webContents) return;

  const wc = window.webContents;

  wc.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    const key = String(input.key || '');
    const toggle =
      key === 'F12' ||
      ((input.control || input.meta) && input.shift && key.toLowerCase() === 'i');
    if (!toggle) return;
    if (wc.isDevToolsOpened()) wc.closeDevTools();
    else wc.openDevTools({ mode: 'detach' });
    event.preventDefault();
  });

  if (openOnStart) {
    window.once('ready-to-show', () => {
      wc.openDevTools({ mode: 'detach' });
    });
  }
}

module.exports = { setupDevTools, wantDevToolsOnStartup };
