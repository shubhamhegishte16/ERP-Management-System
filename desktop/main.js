const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, powerMonitor } = require('electron');
const path = require('path');
const os = require('os');
const axios = require('axios');
const Store = require('electron-store');

const store = new Store();

const DEFAULT_API_URL = 'http://localhost:5000/api';
const POLL_INTERVAL = 2000;
const FLUSH_INTERVAL = 30000;
const IDLE_THRESHOLD_SECONDS = 90;
const TRACKER_VERSION = '1.1.0';

let win;
let tray;
let pollTimer;
let currentSession = null;
let trackerState = {
  apiUrl: normalizeApiUrl(store.get('apiUrl', DEFAULT_API_URL)),
  token: store.get('token', ''),
  trackingPaused: store.get('trackingPaused', false),
  privacyMode: store.get('privacyMode', false),
  user: store.get('user', null),
  lastError: '',
  lastSyncedAt: store.get('lastSyncedAt', null),
};

function normalizeApiUrl(value) {
  const raw = (value || DEFAULT_API_URL).trim().replace(/\/+$/, '');
  if (raw.endsWith('/api')) return raw;
  return `${raw}/api`;
}

function getPublicState() {
  return {
    ...trackerState,
    apiUrl: trackerState.apiUrl,
    token: trackerState.token ? 'configured' : '',
    currentSession: currentSession
      ? {
          appName: currentSession.appName,
          windowTitle: currentSession.windowTitle,
          category: currentSession.category,
          startedAt: currentSession.startedAt,
        }
      : null,
  };
}

function notifyRenderer() {
  if (!win || win.isDestroyed()) return;
  win.webContents.send('tracker-state', getPublicState());
}

function setTrackingPaused(nextValue) {
  trackerState.trackingPaused = nextValue;
  if (nextValue) currentSession = null;
  store.set('trackingPaused', nextValue);
  createTray();
  notifyRenderer();
}

function setPrivacyMode(nextValue) {
  trackerState.privacyMode = nextValue;
  store.set('privacyMode', nextValue);
  notifyRenderer();
}

async function login({ apiUrl, email, password, role }) {
  const normalizedApiUrl = normalizeApiUrl(apiUrl);
  const response = await axios.post(`${normalizedApiUrl}/auth/login`, { email, password, role });

  trackerState = {
    ...trackerState,
    apiUrl: normalizedApiUrl,
    token: response.data.token,
    user: response.data.user,
    lastError: '',
  };

  store.set('apiUrl', normalizedApiUrl);
  store.set('token', response.data.token);
  store.set('user', response.data.user);
  notifyRenderer();

  return getPublicState();
}

function categorize(appName, windowTitle) {
  const appLabel = (appName || '').toLowerCase();
  const title = (windowTitle || '').toLowerCase();

  if (['code', 'webstorm', 'intellij', 'pycharm', 'notepad++', 'vim', 'sublime'].some((token) => appLabel.includes(token))) return 'coding';
  if (['slack', 'teams', 'discord', 'telegram', 'whatsapp'].some((token) => appLabel.includes(token))) return 'communication';
  if (['zoom', 'meet'].some((token) => appLabel.includes(token) || title.includes(token))) return 'meeting';
  if (['figma', 'photoshop', 'illustrator', 'sketch', 'canva'].some((token) => appLabel.includes(token))) return 'design';
  if (['word', 'excel', 'powerpoint', 'notion', 'obsidian'].some((token) => appLabel.includes(token) || title.includes(token))) return 'docs';
  if (['chrome', 'firefox', 'edge', 'brave', 'opera'].some((token) => appLabel.includes(token))) return 'browsing';
  return 'other';
}

function buildSession(activeWindow) {
  const idleSeconds = powerMonitor.getSystemIdleTime();
  const idle = idleSeconds >= IDLE_THRESHOLD_SECONDS;
  const appName = idle ? 'Idle' : (activeWindow?.owner?.name || 'Unknown');
  const windowTitle = idle ? 'System idle' : (activeWindow?.title || '');

  return {
    appName,
    windowTitle,
    executablePath: idle ? '' : (activeWindow?.owner?.path || ''),
    category: idle ? 'idle' : categorize(appName, windowTitle),
    startedAt: Date.now(),
    lastFlushAt: Date.now(),
    lastSeenAt: Date.now(),
  };
}

function isSameSession(a, b) {
  return a && b
    && a.appName === b.appName
    && a.windowTitle === b.windowTitle
    && a.category === b.category
    && a.executablePath === b.executablePath;
}

async function sendActivity(session, endTime = Date.now()) {
  if (!trackerState.token || trackerState.trackingPaused || !session) return;

  const durationSeconds = Math.max(1, Math.round((endTime - session.startedAt) / 1000));
  if (durationSeconds <= 0) return;

  const payload = {
    appName: session.appName,
    windowTitle: trackerState.privacyMode ? '' : session.windowTitle,
    executablePath: session.executablePath,
    category: session.category,
    durationSeconds,
    isPrivate: trackerState.privacyMode,
    sessionStart: new Date(session.startedAt).toISOString(),
    sessionEnd: new Date(endTime).toISOString(),
    trackerVersion: TRACKER_VERSION,
    platform: process.platform,
    deviceName: os.hostname(),
  };

  try {
    await axios.post(`${trackerState.apiUrl}/activity`, payload, {
      headers: { Authorization: `Bearer ${trackerState.token}` },
    });
    trackerState.lastSyncedAt = new Date().toISOString();
    trackerState.lastError = '';
    store.set('lastSyncedAt', trackerState.lastSyncedAt);
  } catch (error) {
    trackerState.lastError = error.response?.data?.message || error.message;
  }

  notifyRenderer();
}

async function flushCurrentSession(endTime = Date.now()) {
  if (!currentSession) return;

  const sessionToFlush = { ...currentSession };
  currentSession.startedAt = endTime;
  currentSession.lastFlushAt = endTime;
  currentSession.lastSeenAt = endTime;

  await sendActivity(sessionToFlush, endTime);
}

async function pollActiveWindow() {
  if (trackerState.trackingPaused || !trackerState.token) {
    notifyRenderer();
    return;
  }

  let activeWindow = null;
  try {
    const { default: activeWin } = await import('active-win');
    activeWindow = await activeWin();
  } catch (error) {
    trackerState.lastError = `active-win: ${error.message}`;
    notifyRenderer();
    return;
  }

  const nextSession = buildSession(activeWindow);

  if (!currentSession) {
    currentSession = nextSession;
    notifyRenderer();
    return;
  }

  if (isSameSession(currentSession, nextSession)) {
    currentSession.lastSeenAt = Date.now();

    if (Date.now() - currentSession.startedAt >= FLUSH_INTERVAL) {
      await flushCurrentSession(Date.now());
    }

    notifyRenderer();
    return;
  }

  await flushCurrentSession(Date.now());
  currentSession = nextSession;
  notifyRenderer();
}

function createWindow() {
  win = new BrowserWindow({
    width: 460,
    height: 620,
    minWidth: 420,
    minHeight: 560,
    title: 'WorkPulse Tracker',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.on('close', (event) => {
    event.preventDefault();
    win.hide();
  });
}

function createTray() {
  if (tray) tray.destroy();

  tray = new Tray(nativeImage.createEmpty());
  const contextMenu = Menu.buildFromTemplate([
    {
      label: trackerState.trackingPaused ? 'Resume Tracking' : 'Pause Tracking',
      click: async () => {
        if (!trackerState.trackingPaused) {
          await flushCurrentSession();
        }
        setTrackingPaused(!trackerState.trackingPaused);
      },
    },
    {
      label: trackerState.privacyMode ? 'Disable Privacy Mode' : 'Enable Privacy Mode',
      click: () => setPrivacyMode(!trackerState.privacyMode),
    },
    {
      label: 'Open Tracker',
      click: () => win.show(),
    },
    { type: 'separator' },
    {
      label: 'Quit WorkPulse',
      click: async () => {
        await flushCurrentSession();
        app.exit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(trackerState.trackingPaused ? 'WorkPulse Tracker - Paused' : 'WorkPulse Tracker - Active');
}

ipcMain.handle('tracker:get-state', async () => getPublicState());

ipcMain.handle('tracker:login', async (_event, credentials) => {
  return login(credentials);
});

ipcMain.handle('tracker:logout', async () => {
  await flushCurrentSession();
  currentSession = null;
  trackerState = {
    ...trackerState,
    token: '',
    user: null,
    lastError: '',
  };
  store.delete('token');
  store.delete('user');
  notifyRenderer();
  return getPublicState();
});

ipcMain.handle('tracker:update-settings', async (_event, settings) => {
  if (typeof settings.apiUrl === 'string' && settings.apiUrl.trim()) {
    trackerState.apiUrl = normalizeApiUrl(settings.apiUrl);
    store.set('apiUrl', trackerState.apiUrl);
  }

  if (typeof settings.trackingPaused === 'boolean') {
    if (settings.trackingPaused && !trackerState.trackingPaused) {
      await flushCurrentSession();
    }
    setTrackingPaused(settings.trackingPaused);
  }

  if (typeof settings.privacyMode === 'boolean') {
    setPrivacyMode(settings.privacyMode);
  }

  return getPublicState();
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  notifyRenderer();

  pollTimer = setInterval(() => {
    pollActiveWindow().catch((error) => {
      trackerState.lastError = error.message;
      notifyRenderer();
    });
  }, POLL_INTERVAL);

  powerMonitor.on('lock-screen', async () => {
    await flushCurrentSession();
    currentSession = buildSession(null);
    notifyRenderer();
  });
});

app.on('before-quit', async () => {
  if (pollTimer) clearInterval(pollTimer);
  await flushCurrentSession();
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});
