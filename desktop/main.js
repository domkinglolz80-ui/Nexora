'use strict';

/* =========================================================================
   Nexora Desktop. A small Electron shell around the Nexora web app: it opens
   the Nexora server in its own window, so nobody needs a browser tab. The
   web app itself still comes from the server, which means every Nexora
   update arrives here automatically – only this shell is installed, and it
   updates itself too (see "self-update" below).
   ========================================================================= */

const { app, BrowserWindow, Menu, dialog, ipcMain, net, screen, session, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');

const DE = /^de\b/i.test(app.getLocale?.() || process.env.LANG || '');
const L = (de, en) => (DE ? de : en);

// The official Nexora server. The release workflow can build in another one (server.json,
// from the NEXORA_URL variable), and the user can change it in the menu.
const DEFAULT_SERVER = 'https://nexora-yxvx.onrender.com';

function bundledServer() {
  try {
    return normalizeUrl(JSON.parse(fs.readFileSync(path.join(__dirname, 'server.json'), 'utf8')).url) || DEFAULT_SERVER;
  } catch {
    return DEFAULT_SERVER;
  }
}

function normalizeUrl(value) {
  let text = String(value || '').trim();
  if (!text) return null;
  if (!/^https?:\/\//i.test(text)) text = 'https://' + text;
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/* ---------- settings (server address, window size) ---------- */

const SETTINGS_FILE = () => path.join(app.getPath('userData'), 'settings.json');
let settings = {};

function loadSettings() {
  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS_FILE(), 'utf8')) || {};
  } catch {
    settings = {};
  }
}

function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(SETTINGS_FILE()), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE(), JSON.stringify(settings, null, 2));
  } catch {
    /* not writable – settings then only last for this run */
  }
}

const serverUrl = () => normalizeUrl(settings.serverUrl) || bundledServer();
const isServerUrl = (url) => {
  try {
    return Boolean(serverUrl()) && new URL(url).origin === serverUrl();
  } catch {
    return false;
  }
};
const isLocalPage = (url) => url.startsWith('file://');
// Installer downloads (a newer desktop app) are handed to the normal browser.
const isDownload = (url) => isServerUrl(url) && new URL(url).pathname.startsWith('/download/');

/* ---------- window ---------- */

let win = null;

function restoredBounds() {
  const saved = settings.bounds;
  const fallback = { width: 1280, height: 820 };
  if (!saved || !saved.width || !saved.height) return fallback;
  // Only reuse the old position when it is still on a connected screen.
  const area = screen.getDisplayMatching(saved).workArea;
  const visible = saved.x + 80 > area.x && saved.x < area.x + area.width - 80 && saved.y >= area.y - 10 && saved.y < area.y + area.height - 80;
  return visible ? saved : { width: saved.width, height: saved.height };
}

function createWindow() {
  win = new BrowserWindow({
    ...restoredBounds(),
    minWidth: 380,
    minHeight: 520,
    title: 'Nexora',
    backgroundColor: '#0a0705',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: true,
      additionalArguments: [`--nexora-desktop=${app.getVersion()}`],
    },
  });
  if (settings.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());

  const remember = () => {
    if (!win || win.isDestroyed()) return;
    settings.maximized = win.isMaximized();
    if (!win.isMaximized() && !win.isMinimized() && !win.isFullScreen()) settings.bounds = win.getBounds();
  };
  win.on('resize', remember);
  win.on('move', remember);
  win.on('close', () => { remember(); saveSettings(); });
  win.on('closed', () => { win = null; });
  win.on('focus', () => win?.flashFrame(false));

  const contents = win.webContents;
  contents.setUserAgent(`${contents.getUserAgent()} NexoraDesktop/${app.getVersion()}`);

  // Links to other sites open in the normal browser; Nexora pages stay in the app.
  contents.setWindowOpenHandler(({ url }) => {
    if (isServerUrl(url) && !isDownload(url)) return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true, backgroundColor: '#0a0705' } };
    openExternal(url);
    return { action: 'deny' };
  });
  contents.on('will-navigate', (e, url) => {
    if ((isServerUrl(url) && !isDownload(url)) || isLocalPage(url)) return;
    e.preventDefault();
    openExternal(url);
  });

  // Server unreachable (offline, wrong address): show the connect page instead of a blank window.
  contents.on('did-fail-load', (_e, code, description, url, isMainFrame) => {
    if (!isMainFrame || code === -3 /* aborted, e.g. by a reload */ || isLocalPage(url)) return;
    showConnect('offline', description);
  });

  openServer();
}

function openExternal(url) {
  if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url)) shell.openExternal(url);
}

function showConnect(mode, detail = '') {
  if (!win) return;
  win.loadFile(path.join(__dirname, 'connect.html'), {
    query: { mode, server: serverUrl() || '', detail: String(detail).slice(0, 200), lang: DE ? 'de' : 'en' },
  });
}

// The free Render server sleeps and can take about a minute to wake up, so show a
// waiting screen and only load Nexora once the server answers.
async function openServer() {
  const url = serverUrl();
  if (!url) return showConnect('setup');
  showConnect('loading');
  if (await reachable(url, 90_000)) win?.loadURL(url);
  else showConnect('offline');
}

async function reachable(url, timeout) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      const res = await net.fetch(`${url}/api/health`, { cache: 'no-store', signal: AbortSignal.timeout(20_000) });
      if (res.ok) return true;
    } catch {
      /* not awake yet */
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return false;
}

/* ---------- messages from the pages ---------- */

const fromLocalPage = (e) => isLocalPage(e.senderFrame?.url || '');
const fromNexora = (e) => isServerUrl(e.senderFrame?.url || '');

ipcMain.handle('setup:connect', async (e, value) => {
  if (!fromLocalPage(e)) return { ok: false };
  const url = normalizeUrl(value);
  if (!url) return { ok: false, error: L('Das ist keine gültige Adresse.', 'That is not a valid address.') };
  if (!(await reachable(url, 60_000))) return { ok: false, error: L('Unter dieser Adresse antwortet kein Nexora-Server.', 'No Nexora server answers at this address.') };
  settings.serverUrl = url;
  saveSettings();
  win?.loadURL(url);
  return { ok: true };
});

ipcMain.on('setup:retry', (e) => { if (fromLocalPage(e)) openServer(); });
ipcMain.on('setup:change', (e) => { if (fromLocalPage(e)) showConnect('setup'); });

ipcMain.on('app:badge', (e, count) => {
  if (!fromNexora(e)) return;
  const n = Math.max(0, Math.min(9999, Number(count) || 0));
  app.setBadgeCount?.(n);
  if (n && win && !win.isFocused()) win.flashFrame(true);
});

// Incoming call: blink in the taskbar / bounce in the dock until the window is used.
ipcMain.on('app:attention', (e) => {
  if (!fromNexora(e) || !win || win.isFocused()) return;
  win.flashFrame(true);
  if (process.platform === 'darwin') app.dock?.bounce('critical');
});

ipcMain.on('app:focus', (e) => {
  if (!fromNexora(e) || !win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
});

/* ---------- self-update ---------- */

// Every desktop release on GitHub carries latest.yml next to the installers. When a newer
// version is there, the Nexora window closes, the update window downloads and installs it,
// and Nexora opens again by itself. Windows and the Linux AppImage can do this; macOS
// can't (the app isn't signed by Apple), there the download icon in Nexora lights up.
const UPDATE_FEED = process.env.NEXORA_UPDATE_FEED || 'https://github.com/domkinglolz80-ui/Nexora/releases/latest/download';
const UPDATE_CHECK_EVERY = 10 * 60 * 1000;
const canSelfUpdate = () => app.isPackaged && (process.platform === 'win32' || (process.platform === 'linux' && Boolean(process.env.APPIMAGE)));

let updater = null; // the update window while an update runs
let updateState = { step: 'prepare' };
let manualCheck = false;

function setUpdateState(state) {
  updateState = state;
  if (updater && !updater.isDestroyed()) updater.webContents.send('update:state', state);
}

function checkForUpdates(manual = false) {
  if (!canSelfUpdate()) {
    if (manual) dialog.showMessageBox({ message: L('Auf diesem System aktualisiert sich Nexora nicht selbst. Neue Versionen gibt es über das Download-Symbol in Nexora.', 'Nexora cannot update itself on this system. New versions are available via the download icon in Nexora.') });
    return;
  }
  if (updater) return;
  manualCheck = manual;
  autoUpdater.checkForUpdates().catch(() => {});
}

function startUpdate(version) {
  if (updater) return;
  updater = new BrowserWindow({
    width: 440,
    height: 380,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    title: 'Nexora Update',
    backgroundColor: '#0a0705',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  updater.setMenu(null);
  updater.on('closed', () => { updater = null; });
  // The update window is open before Nexora closes, so the app keeps running in between.
  updater.once('ready-to-show', () => {
    updater.show();
    win?.close();
  });
  setUpdateState({ step: 'prepare' });
  updater.loadFile(path.join(__dirname, 'update.html'), { query: { version, from: app.getVersion(), lang: DE ? 'de' : 'en' } });
  autoUpdater.downloadUpdate().catch(() => {});
}

function setupUpdates() {
  if (!canSelfUpdate()) return;
  autoUpdater.setFeedURL({ provider: 'generic', url: UPDATE_FEED });
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.on('update-available', (info) => startUpdate(info.version));
  autoUpdater.on('update-not-available', () => {
    if (manualCheck) dialog.showMessageBox({ message: L(`Du hast schon die neueste Version (${app.getVersion()}).`, `You already have the newest version (${app.getVersion()}).`) });
  });
  autoUpdater.on('download-progress', (p) => setUpdateState({ step: 'download', percent: Math.round(p.percent || 0) }));
  autoUpdater.on('update-downloaded', () => {
    setUpdateState({ step: 'install' });
    // Install without questions, then start Nexora again.
    setTimeout(() => autoUpdater.quitAndInstall(true, true), 1500);
  });
  autoUpdater.on('error', (err) => {
    if (updater) setUpdateState({ step: 'error', detail: String(err?.message || err).split('\n')[0].slice(0, 200) });
  });
  checkForUpdates();
  setInterval(checkForUpdates, UPDATE_CHECK_EVERY);
}

ipcMain.handle('update:get', (e) => (fromLocalPage(e) ? updateState : null));
ipcMain.on('update:retry', (e) => {
  if (!fromLocalPage(e) || !updater) return;
  setUpdateState({ step: 'prepare' });
  autoUpdater.downloadUpdate().catch(() => {});
});
// After a failed update: back to the old version for now, the next check tries again.
ipcMain.on('update:open', (e) => {
  if (!fromLocalPage(e) || !updater) return;
  if (!win) createWindow();
  updater.close();
});
// The web app noticed a newer desktop version (the server knows it before the next check).
ipcMain.on('update:check', (e) => { if (fromNexora(e)) checkForUpdates(); });

/* ---------- permissions: microphone for voice channels, notifications ---------- */

const ALLOWED = new Set(['media', 'notifications', 'clipboard-sanitized-write', 'fullscreen']);

function setupPermissions() {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((contents, permission, callback, details) => {
    const origin = details.requestingUrl || contents.getURL();
    callback(ALLOWED.has(permission) && isServerUrl(origin));
  });
  ses.setPermissionCheckHandler((_contents, permission, origin) => ALLOWED.has(permission) && isServerUrl(origin));
}

/* ---------- menu ---------- */

function buildMenu() {
  const mac = process.platform === 'darwin';
  const template = [
    ...(mac ? [{ role: 'appMenu' }] : []),
    {
      label: 'Nexora',
      submenu: [
        { label: L('Neu laden', 'Reload'), accelerator: 'CmdOrCtrl+R', click: () => (serverUrl() ? openServer() : showConnect('setup')) },
        { label: L('Server-Adresse ändern…', 'Change server address…'), click: () => showConnect('setup') },
        { label: L('Im Browser öffnen', 'Open in browser'), click: () => serverUrl() && shell.openExternal(serverUrl()) },
        { label: L('Nach Updates suchen', 'Check for updates'), click: () => checkForUpdates(true) },
        { type: 'separator' },
        mac ? { role: 'close' } : { role: 'quit', label: L('Beenden', 'Quit') },
      ],
    },
    { role: 'editMenu', label: L('Bearbeiten', 'Edit') },
    {
      label: L('Ansicht', 'View'),
      submenu: [
        { role: 'zoomIn', label: L('Vergrößern', 'Zoom in') },
        { role: 'zoomOut', label: L('Verkleinern', 'Zoom out') },
        { role: 'resetZoom', label: L('Originalgröße', 'Actual size') },
        { type: 'separator' },
        { role: 'togglefullscreen', label: L('Vollbild', 'Full screen') },
        { role: 'toggleDevTools', label: L('Entwicklertools', 'Developer tools') },
      ],
    },
    {
      label: L('Hilfe', 'Help'),
      submenu: [
        { label: L('Nexora auf GitHub', 'Nexora on GitHub'), click: () => shell.openExternal('https://github.com/domkinglolz80-ui/Nexora') },
        { label: `Nexora Desktop ${app.getVersion()}`, enabled: false },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ---------- start ---------- */

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });

  app.whenReady().then(() => {
    if (process.platform === 'win32') app.setAppUserModelId('app.nexora.desktop');
    loadSettings();
    setupPermissions();
    buildMenu();
    createWindow();
    setupUpdates();
    app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
