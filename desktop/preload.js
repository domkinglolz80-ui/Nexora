'use strict';

// Bridge between the pages and the desktop shell. Nexora itself only gets a few
// harmless helpers; the connect page (a local file) can set the server address.
const { contextBridge, ipcRenderer } = require('electron');

const version = (process.argv.find((a) => a.startsWith('--nexora-desktop=')) || '').split('=')[1] || '';

if (location.protocol === 'file:') {
  contextBridge.exposeInMainWorld('nexoraSetup', {
    connect: (url) => ipcRenderer.invoke('setup:connect', String(url || '')),
    retry: () => ipcRenderer.send('setup:retry'),
    change: () => ipcRenderer.send('setup:change'),
  });
} else {
  contextBridge.exposeInMainWorld('nexoraDesktop', {
    version,
    platform: process.platform,
    setBadge: (count) => ipcRenderer.send('app:badge', Number(count) || 0),
    focus: () => ipcRenderer.send('app:focus'),
  });
}
