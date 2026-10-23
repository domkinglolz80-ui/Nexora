'use strict';

// Bridge between the pages and the desktop shell. Nexora itself only gets a few
// harmless helpers; the local pages can set the server address (connect page)
// and follow the update (update window).
const { contextBridge, ipcRenderer } = require('electron');

const version = (process.argv.find((a) => a.startsWith('--nexora-desktop=')) || '').split('=')[1] || '';

if (location.protocol === 'file:') {
  contextBridge.exposeInMainWorld('nexoraSetup', {
    connect: (url) => ipcRenderer.invoke('setup:connect', String(url || '')),
    retry: () => ipcRenderer.send('setup:retry'),
    change: () => ipcRenderer.send('setup:change'),
  });
  contextBridge.exposeInMainWorld('nexoraUpdate', {
    state: () => ipcRenderer.invoke('update:get'),
    onState: (fn) => ipcRenderer.on('update:state', (_e, state) => fn(state)),
    retry: () => ipcRenderer.send('update:retry'),
    openNexora: () => ipcRenderer.send('update:open'),
  });
} else {
  contextBridge.exposeInMainWorld('nexoraDesktop', {
    version,
    platform: process.platform,
    setBadge: (count) => ipcRenderer.send('app:badge', Number(count) || 0),
    focus: () => ipcRenderer.send('app:focus'),
    attention: () => ipcRenderer.send('app:attention'),
    checkUpdate: () => ipcRenderer.send('update:check'),
  });
}
