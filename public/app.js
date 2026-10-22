'use strict';

/* =========================================================================
   Nexora client
   ========================================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const ICONS = {
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  invite: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>',
  reply: '<svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
  smile: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  logout: '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  speaker: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"/></svg>',
  micOff: '<svg viewBox="0 0 24 24"><path d="m2 2 20 20M9 9v2a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 11v-1m14 0v1a7 7 0 0 1-.11 1.23M12 18v4M8 22h8"/></svg>',
  headphones: '<svg viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
  headphonesOff: '<svg viewBox="0 0 24 24"><path d="m2 2 20 20M3 18v-6a9 9 0 0 1 2.64-6.36M8.4 3.6A9 9 0 0 1 21 12v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
  hangup: '<svg viewBox="0 0 24 24"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><path d="m22 2-20 20"/></svg>',
};

const EMOJIS = ('🔥 ⚡ 🚀 💯 ❤️ 🧡 💛 👍 👎 👏 🙌 🤝 🙏 💪 👀 🎉 ' +
  '😀 😂 🤣 😊 😍 🥰 😎 🤩 🥳 😏 😅 😭 😡 🤯 😱 🤔 ' +
  '🫡 🙃 😴 🤤 🤡 💀 👻 👽 🤖 😈 🎮 🎧 🎵 🍕 🍔 🌮 ' +
  '☕ 🍿 🐱 🐶 🦊 🐼 🦄 🌈 ☀️ 🌙 ⭐ ✨ 💎 🏆 ✅ ❌').split(' ');
const HUB_ICONS = ['', '🔥', '⚡', '🚀', '🎮', '🎧', '🎨', '💻', '📚', '⚽', '🍕', '🌙', '🦊', '👾', '💎', '🏆'];
const QUICK_REACTIONS = ['🔥', '👍', '😂'];
const ACCENTS = ['#ff7a18', '#ff9f1c', '#ff5e3a', '#ffb347', '#ff6b00', '#f9a03f', '#ff8c42', '#e85d04', '#ffd166', '#ef476f'];
const STATUS_LABEL = { online: 'Online', idle: 'Abwesend', dnd: 'Nicht stören', invisible: 'Unsichtbar', offline: 'Offline' };

const state = {
  token: null,
  me: null,
  hubs: new Map(),
  dms: new Map(),
  users: new Map(),
  presence: new Map(),
  view: { type: 'home', hubId: null, channelId: null },
  lastChannel: {},
  channels: new Map(), // channelId -> { list, hasMore, loading }
  unread: new Map(), // channelId -> { count, mention }
  typing: new Map(), // channelId -> Map(userId -> timeout)
  replyTo: null,
  editingId: null,
  showMembers: true,
  voiceStates: new Map(), // channelId -> [{ userId, muted, deafened }]
  speaking: new Set(), // userIds currently speaking (measured locally)
};

let socket = null;

/* =========================================================================
   Utilities
   ========================================================================= */

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function store(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem('nexora:' + key));
    if (value === null) localStorage.removeItem('nexora:' + key);
    else localStorage.setItem('nexora:' + key, JSON.stringify(value));
  } catch {
    return undefined;
  }
}

function req(event, payload = {}) {
  return new Promise((resolve, reject) => {
    if (!socket || !socket.connected) return reject(new Error('Keine Verbindung zum Server.'));
    socket.timeout(10000).emit(event, payload, (err, res) => {
      if (err) return reject(new Error('Zeitüberschreitung. Versuch es nochmal.'));
      if (res && res.error) return reject(new Error(res.error));
      resolve(res);
    });
  });
}

function toast(text, kind = 'ok') {
  const t = h(`<div class="toast ${kind}">${esc(text)}</div>`);
  $('#toast-root').append(t);
  setTimeout(() => t.remove(), 3200);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = h('<textarea style="position:fixed;opacity:0"></textarea>');
    ta.value = text;
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast('In die Zwischenablage kopiert');
}

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/);
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).slice(0, 2);
}

function userOf(id) {
  return state.users.get(id) || { id, username: 'unbekannt', displayName: 'Unbekannt', color: '#6b5a4e', bio: '' };
}

function statusOf(id) {
  return state.presence.get(id) || 'offline';
}

function isAdmin(hub, userId) {
  return hub.ownerId === userId || Boolean(hub.admins?.includes(userId));
}

function verified(user) {
  return user.official ? '<span class="verified" title="Offizieller Nexora-Account">✓</span>' : '';
}

function avatar(user, { dot = false, size } = {}) {
  const s = size ? `--size:${size}px;` : '';
  const d = dot ? `<span class="dot ${statusOf(user.id)}"></span>` : '';
  return `<div class="avatar" style="--c:${esc(user.color)};${s}" data-user="${esc(user.id)}">${esc(initials(user.displayName))}${d}</div>`;
}

const timeFmt = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fullFmt = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

function sameDay(a, b) {
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

function dayLabel(ts) {
  const now = Date.now();
  if (sameDay(ts, now)) return 'Heute';
  if (sameDay(ts, now - 86400000)) return 'Gestern';
  return dayFmt.format(ts);
}

function stamp(ts) {
  const now = Date.now();
  if (sameDay(ts, now)) return `Heute um ${timeFmt.format(ts)}`;
  if (sameDay(ts, now - 86400000)) return `Gestern um ${timeFmt.format(ts)}`;
  return fullFmt.format(ts);
}

/* ---------- message formatting ---------- */

const URL_RE = /\bhttps?:\/\/[^\s<>"']+[^\s<>"'.,:;!?)\]]/g;
const EMOJI_ONLY_RE = /^(?:\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*\s*)+$/u;

function formatMessage(text) {
  const slots = [];
  const slot = (html) => `\u0000${slots.push(html) - 1}\u0000`;

  let s = text
    .replace(/```(?:[a-zA-Z0-9+-]*\n)?([\s\S]*?)```/g, (_, code) => slot(`<pre><code>${esc(code.replace(/\n$/, ''))}</code></pre>`))
    .replace(/`([^`\n]+)`/g, (_, code) => slot(`<code>${esc(code)}</code>`))
    .replace(URL_RE, (url) => slot(`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>`));

  s = esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\|\|(.+?)\|\|/g, '<span class="spoiler" title="Spoiler anzeigen">$1</span>')
    .replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>')
    .replace(/(^|[^\w])@([a-zA-Z0-9_.]{3,20})/g, (m, pre, name) => {
      const known = [...state.users.values()].some((u) => u.username.toLowerCase() === name.toLowerCase());
      return known ? `${pre}<span class="mention-tag">@${name}</span>` : m;
    })
    .replace(/<\/blockquote>\n/g, '</blockquote>');

  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => slots[Number(i)]);
}

function isJumbo(text) {
  const t = text.trim();
  if (!EMOJI_ONLY_RE.test(t)) return false;
  const count = typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter().segment(t.replace(/\s/g, ''))].length
    : t.length / 2;
  return count <= 6;
}

function mentionsMe(text) {
  if (!state.me) return false;
  return new RegExp(`(^|[^\\w])@${state.me.username.replace(/\./g, '\\.')}(?![\\w.])`, 'i').test(text);
}

/* ---------- sound ---------- */
let audioCtx = null;
function ping() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.08);
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.3);
  } catch {
    /* audio not available */
  }
}

/* =========================================================================
   Auth
   ========================================================================= */

function showAuth() {
  $('#app').classList.add('hidden');
  $('#auth').classList.remove('hidden');
  $('#splash').classList.add('out');
  setAuthMode(store('lastUser') ? 'login' : 'register');
}

function setAuthMode(mode) {
  const auth = $('#auth');
  auth.dataset.mode = mode;
  $$('.auth-tab').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  $('#auth-submit').textContent = mode === 'login' ? "Los geht's" : 'Account erstellen';
  $('#auth-form [name=password]').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('#auth-error').textContent = '';
  const u = $('#auth-form [name=username]');
  if (mode === 'login' && !u.value) u.value = store('lastUser') || '';
}

$$('.auth-tab').forEach((b) => b.addEventListener('click', () => setAuthMode(b.dataset.mode)));

$('#auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const mode = $('#auth').dataset.mode;
  const body = {
    username: form.username.value.trim(),
    password: form.password.value,
    displayName: form.displayName.value.trim(),
  };
  const err = $('#auth-error');
  if (body.username.length < 3) return (err.textContent = 'Benutzername braucht mindestens 3 Zeichen.');
  if (body.password.length < 6) return (err.textContent = 'Passwort braucht mindestens 6 Zeichen.');

  const btn = $('#auth-submit');
  btn.disabled = true;
  err.textContent = '';
  try {
    const res = await fetch(`/api/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Etwas ist schiefgelaufen.');
    store('token', data.token);
    store('lastUser', data.user.username);
    form.password.value = '';
    start(data.token);
  } catch (ex) {
    err.textContent = ex.message;
  } finally {
    btn.disabled = false;
  }
});

async function logout() {
  const token = state.token;
  store('token', null);
  if (socket) socket.disconnect();
  socket = null;
  fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).catch(() => {});
  location.replace('/');
}

/* =========================================================================
   Connection
   ========================================================================= */

function start(token) {
  state.token = token;
  socket = io({ auth: { token } });
  let banner = null;

  socket.on('connect', async () => {
    banner?.remove();
    banner = null;
    try {
      const data = await req('bootstrap');
      applyBootstrap(data);
      if (vc.channelId) rejoinVoice();
    } catch (ex) {
      toast(ex.message, 'error');
    }
  });

  socket.on('connect_error', (err) => {
    if (err.message === 'unauthorized') {
      store('token', null);
      socket.disconnect();
      showAuth();
    }
  });

  socket.on('disconnect', () => {
    if (!banner && socket) {
      banner = h('<div class="conn-banner">Verbindung verloren – verbinde neu…</div>');
      document.body.append(banner);
    }
  });

  socket.on('hub:update', (hub) => {
    state.hubs.set(hub.id, hub);
    if (state.view.type === 'hub' && state.view.hubId === hub.id && !hub.channels.some((c) => c.id === state.view.channelId)) {
      openHub(hub.id);
      return;
    }
    renderRail();
    if (state.view.hubId === hub.id) {
      renderSidebar();
      renderChatHeader();
      renderMembers();
    }
  });

  socket.on('hub:removed', ({ hubId }) => {
    const hub = state.hubs.get(hubId);
    if (vc.hubId === hubId) cleanupVoice();
    state.hubs.delete(hubId);
    hub?.channels.forEach((c) => {
      state.channels.delete(c.id);
      state.unread.delete(c.id);
    });
    if (state.view.hubId === hubId) {
      if (hub) toast(`Du bist nicht mehr in „${hub.name}“`, 'error');
      openHome();
    } else renderRail();
  });

  socket.on('dm:update', (dm) => {
    state.dms.set(dm.id, dm);
    if (state.view.type === 'home') renderSidebar();
  });

  socket.on('user:update', (user) => {
    state.users.set(user.id, user);
    if (user.id === state.me?.id) {
      state.me = user;
      renderMe();
    }
    renderMembers();
    if (state.view.type === 'home') renderSidebar();
    rerenderMessages();
  });

  socket.on('presence', ({ userId, status }) => {
    state.presence.set(userId, status);
    renderMembers();
    if (state.view.type === 'home') renderSidebar();
    if (userId === state.me?.id) renderMe();
  });

  socket.on('message:new', onMessageNew);

  socket.on('message:update', (msg) => {
    const ch = state.channels.get(msg.channelId);
    if (!ch) return;
    const i = ch.list.findIndex((m) => m.id === msg.id);
    if (i < 0) return;
    ch.list[i] = msg;
    if (msg.channelId === state.view.channelId) {
      const node = $(`.msg[data-id="${msg.id}"]`);
      if (node && state.editingId !== msg.id) {
        const prev = ch.list[i - 1];
        node.replaceWith(messageNode(msg, prev));
      }
      // replies quoting this message show its new content
      $$(`.msg-reply[data-ref="${msg.id}"] span`).forEach((s) => (s.textContent = msg.content));
    }
  });

  socket.on('message:remove', ({ channelId, messageId }) => {
    const ch = state.channels.get(channelId);
    if (!ch) return;
    ch.list = ch.list.filter((m) => m.id !== messageId);
    if (state.replyTo?.id === messageId) setReply(null);
    if (channelId === state.view.channelId) rerenderMessages();
  });

  socket.on('voice:state', onVoiceState);
  socket.on('voice:signal', (msg) => handleSignal(msg).catch((err) => console.warn('[voice] signal', err)));
  socket.on('voice:peer-left', ({ socketId }) => closePeer(socketId));
  socket.on('voice:kicked', ({ reason }) => {
    cleanupVoice();
    if (reason === 'elsewhere') toast('Du bist jetzt auf einem anderen Gerät im Sprachkanal.');
    else if (reason === 'deleted') toast('Der Sprachkanal wurde gelöscht.', 'error');
    renderVoiceUi();
  });

  socket.on('typing', ({ channelId, userId }) => {
    if (userId === state.me?.id) return;
    let map = state.typing.get(channelId);
    if (!map) state.typing.set(channelId, (map = new Map()));
    clearTimeout(map.get(userId));
    map.set(userId, setTimeout(() => {
      map.delete(userId);
      if (channelId === state.view.channelId) renderTyping();
    }, 4000));
    if (channelId === state.view.channelId) renderTyping();
  });
}

function applyBootstrap(data) {
  state.me = data.me;
  state.hubs = new Map(data.hubs.map((x) => [x.id, x]));
  state.dms = new Map(data.dms.map((x) => [x.id, x]));
  state.users = new Map(Object.entries(data.users));
  state.presence = new Map(Object.entries(data.presence));
  state.voiceStates = new Map(Object.entries(data.voice || {}));
  // After a reconnect the cache may be stale — drop it and refetch lazily.
  state.channels.clear();
  state.lastChannel = store('lastChannel') || {};

  $('#auth').classList.add('hidden');
  $('#app').classList.remove('hidden');
  $('#splash').classList.add('out');
  renderMe();
  checkVersion(data.version);

  const params = new URLSearchParams(location.search);
  const invite = params.get('invite');
  if (invite) {
    history.replaceState(null, '', '/');
    joinHub(invite);
    return;
  }

  const last = store('view');
  if (last?.type === 'hub' && state.hubs.has(last.hubId)) openHub(last.hubId, last.channelId);
  else if (last?.type === 'home' && last.channelId && state.dms.has(last.channelId)) openDm(last.channelId);
  else if (state.hubs.size) openHub(state.hubs.keys().next().value);
  else openHome();
}

/* =========================================================================
   Navigation
   ========================================================================= */

function setView(view) {
  state.view = view;
  state.replyTo = null;
  state.editingId = null;
  store('view', view);
  if (view.type === 'hub' && view.channelId) {
    state.lastChannel[view.hubId] = view.channelId;
    store('lastChannel', state.lastChannel);
  }
  if (view.channelId) state.unread.delete(view.channelId);
  $('#app').classList.remove('drawer-open', 'show-members');
  renderAll();
  if (view.channelId && !isVoiceChannel(view.channelId)) {
    loadChannel(view.channelId);
    if (window.matchMedia('(min-width: 761px)').matches) $('#composer-input').focus();
  }
}

function openHub(hubId, channelId) {
  const hub = state.hubs.get(hubId);
  if (!hub) return openHome();
  const wanted = channelId || state.lastChannel[hubId];
  const channel = hub.channels.find((c) => c.id === wanted) || hub.channels.find((c) => c.kind !== 'voice') || hub.channels[0];
  setView({ type: 'hub', hubId, channelId: channel?.id || null });
}

function openHome() {
  setView({ type: 'home', hubId: null, channelId: null });
}

function openDm(dmId) {
  setView({ type: 'home', hubId: null, channelId: dmId });
}

async function openDmWith(userId) {
  closePopover();
  try {
    const { dm } = await req('dm:open', { userId });
    state.dms.set(dm.id, dm);
    openDm(dm.id);
  } catch (ex) {
    toast(ex.message, 'error');
  }
}

function sortedDms() {
  return [...state.dms.values()].sort((a, b) => b.lastActivity - a.lastActivity);
}

function currentHub() {
  return state.view.type === 'hub' ? state.hubs.get(state.view.hubId) : null;
}

function currentChannel() {
  const hub = currentHub();
  return hub ? hub.channels.find((c) => c.id === state.view.channelId) : null;
}

function currentDm() {
  return state.view.type === 'home' && state.view.channelId ? state.dms.get(state.view.channelId) : null;
}

function dmPartner(dm) {
  return userOf(dm.members.find((m) => m !== state.me.id) || state.me.id);
}

function channelLabel(channelId) {
  const dm = state.dms.get(channelId);
  if (dm) return '@' + dmPartner(dm).displayName;
  for (const hub of state.hubs.values()) {
    const c = hub.channels.find((x) => x.id === channelId);
    if (c) return (c.kind === 'voice' ? '🔊 ' : '#') + c.name;
  }
  return '';
}

/* =========================================================================
   Rendering
   ========================================================================= */

function renderAll() {
  renderRail();
  renderSidebar();
  renderChatHeader();
  renderMessagesShell();
  renderMembers();
  renderTyping();
  renderReplyBar();
  updateTitle();
}

function hubUnread(hub) {
  let count = 0, mention = false;
  for (const c of hub.channels) {
    const u = state.unread.get(c.id);
    if (u) { count += u.count; mention ||= u.mention; }
  }
  return { count, mention };
}

function renderRail() {
  const list = $('#hub-list');
  list.innerHTML = '';
  for (const hub of state.hubs.values()) {
    const u = hubUnread(hub);
    const active = state.view.type === 'hub' && state.view.hubId === hub.id;
    const btn = h(`<button class="rail-item ${active ? 'active' : ''} ${u.count ? 'unread' : ''}" style="--hub-color:${esc(hub.color)}" title="${esc(hub.name)}">
      ${hub.icon ? `<span class="emoji">${esc(hub.icon)}</span>` : esc(initials(hub.name))}
      ${u.mention ? `<span class="badge">${u.count > 99 ? '99+' : u.count}</span>` : ''}
    </button>`);
    btn.addEventListener('click', () => openHub(hub.id));
    btn.addEventListener('contextmenu', (e) => { e.preventDefault(); openHubSettings(hub.id); });
    list.append(btn);
  }
  const home = $('#home-btn');
  home.classList.toggle('active', state.view.type === 'home');
  const dmUnread = [...state.dms.keys()].reduce((n, id) => n + (state.unread.get(id)?.count || 0), 0);
  home.querySelector('.badge')?.remove();
  if (dmUnread) home.append(h(`<span class="badge">${dmUnread > 99 ? '99+' : dmUnread}</span>`));
  updateTitle();
}

function renderSidebar() {
  const head = $('#sidebar-head');
  const body = $('#sidebar-body');
  const hub = currentHub();

  if (hub) {
    const isOwner = isAdmin(hub, state.me.id);
    head.className = 'sidebar-head hub-banner';
    head.style.setProperty('--hub-color', hub.color);
    head.innerHTML = `
      <div class="hub-title">
        <h2>${hub.icon ? esc(hub.icon) + ' ' : ''}${esc(hub.name)}</h2>
        <button class="icon-btn" data-act="settings" title="Hub-Einstellungen">${ICONS.gear}</button>
      </div>
      <div class="hub-sub">
        <button class="chip" data-act="invite" title="Einladen">${ICONS.invite} ${esc(hub.inviteCode)}</button>
        <span>${hub.members.length} Mitglied${hub.members.length === 1 ? '' : 'er'}</span>
      </div>`;
    head.querySelector('[data-act=settings]').onclick = () => openHubSettings(hub.id);
    head.querySelector('[data-act=invite]').onclick = () => openInvite(hub.id);

    body.innerHTML = `<div class="section-label"><span>Textkanäle</span>${isOwner ? `<button class="icon-btn" data-act="add" title="Kanal erstellen">${ICONS.plus}</button>` : ''}</div>`;
    body.querySelector('[data-act=add]')?.addEventListener('click', () => openChannelEditor(hub.id));
    for (const c of hub.channels.filter((x) => x.kind !== 'voice')) {
      const u = state.unread.get(c.id);
      const active = c.id === state.view.channelId;
      const item = h(`<button class="nav-item ${active ? 'active' : ''} ${u ? 'unread' : ''}">
        <span class="hash">#</span><span class="label">${esc(c.name)}</span>
        ${u?.mention ? `<span class="badge">${u.count}</span>` : ''}
        ${isOwner ? `<span class="row-actions"><span class="icon-btn" data-act="edit" title="Kanal bearbeiten">${ICONS.gear}</span></span>` : ''}
      </button>`);
      item.addEventListener('click', (e) => {
        if (e.target.closest('[data-act=edit]')) return openChannelEditor(hub.id, c.id);
        openHub(hub.id, c.id);
      });
      body.append(item);
    }

    const voiceChannels = hub.channels.filter((x) => x.kind === 'voice');
    if (voiceChannels.length || isOwner) {
      const label = h(`<div class="section-label"><span>Sprachkanäle</span>${isOwner ? `<button class="icon-btn" title="Sprachkanal erstellen">${ICONS.plus}</button>` : ''}</div>`);
      label.querySelector('.icon-btn')?.addEventListener('click', () => openChannelEditor(hub.id, null, 'voice'));
      body.append(label);
    }
    for (const c of voiceChannels) {
      const members = state.voiceStates.get(c.id) || [];
      const active = c.id === state.view.channelId;
      const item = h(`<button class="nav-item voice-item ${active ? 'active' : ''} ${vc.channelId === c.id ? 'connected' : ''}">
        <span class="hash">${ICONS.speaker}</span><span class="label">${esc(c.name)}</span>
        ${members.length ? `<span class="voice-count">${members.length}</span>` : ''}
        ${isOwner ? `<span class="row-actions"><span class="icon-btn" data-act="edit" title="Kanal bearbeiten">${ICONS.gear}</span></span>` : ''}
      </button>`);
      item.addEventListener('click', (e) => {
        if (e.target.closest('[data-act=edit]')) return openChannelEditor(hub.id, c.id);
        openHub(hub.id, c.id);
      });
      body.append(item);
      if (members.length) {
        const list = h('<div class="voice-users"></div>');
        for (const m of members) {
          const u = userOf(m.userId);
          const row = h(`<button class="voice-user ${state.speaking.has(m.userId) ? 'speaking' : ''}" data-voice-user="${esc(m.userId)}">
            ${avatar(u, { size: 24 })}<span class="label">${esc(u.displayName)}</span>
            ${m.deafened ? `<span class="vs-icon" title="Stumm geschaltet (Ton aus)">${ICONS.headphonesOff}</span>` : m.muted ? `<span class="vs-icon" title="Mikrofon aus">${ICONS.micOff}</span>` : ''}
          </button>`);
          row.onclick = () => showProfile(m.userId, row);
          list.append(row);
        }
        body.append(list);
      }
    }
  } else {
    head.className = 'sidebar-head';
    head.style.removeProperty('--hub-color');
    head.innerHTML = `
      <button class="search-pill" style="width:100%" data-act="find">${ICONS.search}<span>Unterhaltung finden</span></button>`;
    head.querySelector('[data-act=find]').onclick = openPalette;

    body.innerHTML = `<div class="section-label"><span>Direktnachrichten</span><button class="icon-btn" data-act="new" title="Neue Nachricht">${ICONS.plus}</button></div>`;
    body.querySelector('[data-act=new]').onclick = openNewDm;
    const dms = sortedDms();
    if (!dms.length) {
      body.append(h('<div class="empty-hint">Noch keine Unterhaltungen.<br>Klick auf ein Mitglied oder auf <b>+</b>, um loszulegen.</div>'));
    }
    for (const dm of dms) {
      const p = dmPartner(dm);
      const u = state.unread.get(dm.id);
      const item = h(`<button class="nav-item ${dm.id === state.view.channelId ? 'active' : ''} ${u ? 'unread' : ''}">
        ${avatar(p, { dot: true, size: 32 })}<span class="label">${esc(p.displayName)}${verified(p)}</span>
        ${u ? `<span class="badge">${u.count}</span>` : ''}
      </button>`);
      item.onclick = () => openDm(dm.id);
      body.append(item);
    }
  }
}

function renderMe() {
  const me = state.me;
  if (!me) return;
  const card = $('#me-card');
  card.innerHTML = `
    ${avatar(me, { dot: true })}
    <div class="who"><div class="name">${esc(me.displayName)}${verified(me)}</div><div class="handle">${esc(STATUS_LABEL[me.status] || '')} · @${esc(me.username)}</div></div>
    <button class="icon-btn" title="Einstellungen">${ICONS.gear}</button>`;
  card.querySelector('.icon-btn').onclick = openSettings;
  card.querySelector('.who').onclick = openSettings;
  card.querySelector('.avatar').onclick = openSettings;
}

function renderChatHeader() {
  const title = $('#chat-title');
  const channel = currentChannel();
  const dm = currentDm();
  const composer = $('#composer-input');
  const membersBtn = $('#toggle-members');

  if (channel?.kind === 'voice') {
    const n = (state.voiceStates.get(channel.id) || []).length;
    title.innerHTML = `<div class="hash-big voice">${ICONS.speaker}</div><h1>${esc(channel.name)}</h1><div class="topic">${n ? `${n} im Kanal` : 'Sprachkanal'}</div>`;
  } else if (channel) {
    title.innerHTML = `<div class="hash-big">#</div><h1>${esc(channel.name)}</h1>${channel.topic ? `<div class="topic">${esc(channel.topic)}</div>` : ''}`;
    composer.placeholder = `Nachricht an #${channel.name}`;
  } else if (dm) {
    const p = dmPartner(dm);
    title.innerHTML = `${avatar(p, { dot: true })}<h1>${esc(p.displayName)}${verified(p)}</h1><div class="topic">@${esc(p.username)}</div>`;
    title.querySelector('.avatar').onclick = (e) => showProfile(p.id, e.currentTarget);
    composer.placeholder = `Nachricht an @${p.displayName}`;
  } else {
    title.innerHTML = `<div class="hash-big">✦</div><h1>Zentrale</h1>`;
    composer.placeholder = 'Wähle eine Unterhaltung';
  }
  const hasTarget = Boolean(channel || dm);
  $('.composer-wrap').classList.toggle('hidden', !hasTarget || channel?.kind === 'voice');
  membersBtn.classList.toggle('active', state.showMembers);
  $('#app').classList.toggle('no-members', !state.showMembers || !hasTarget);
}

function renderMembers() {
  const panel = $('#members');
  const hub = currentHub();
  const dm = currentDm();
  if (dm) {
    const p = dmPartner(dm);
    panel.innerHTML = `<div class="profile-banner" style="--c:${esc(p.color)};border-radius:14px"></div>
      <div class="profile-body" style="padding:0 6px">
        ${avatar(p, { dot: true })}
        <h4>${esc(p.displayName)}${verified(p)}</h4>
        <div class="handle">@${esc(p.username)} · ${STATUS_LABEL[statusOf(p.id)]}</div>
        ${p.bio ? `<div class="bio">${esc(p.bio)}</div>` : ''}
        <div class="meta">Dabei seit ${fullFmt.format(p.createdAt).split(',')[0]}</div>
      </div>`;
    return;
  }
  if (!hub) { panel.innerHTML = ''; return; }

  const members = hub.members.map(userOf);
  const rank = { online: 0, idle: 1, dnd: 2, offline: 3 };
  members.sort((a, b) => (rank[statusOf(a.id)] - rank[statusOf(b.id)]) || a.displayName.localeCompare(b.displayName));
  const onlineList = members.filter((m) => statusOf(m.id) !== 'offline');
  const offlineList = members.filter((m) => statusOf(m.id) === 'offline');

  panel.innerHTML = '';
  const section = (label, list) => {
    if (!list.length) return;
    panel.append(h(`<div class="section-label"><span>${label} — ${list.length}</span></div>`));
    for (const m of list) {
      const st = statusOf(m.id);
      const row = h(`<button class="member ${st === 'offline' ? 'offline' : ''}" style="--c:${esc(m.color)}">
        ${avatar(m, { dot: true })}
        <div class="info"><div class="name">${esc(m.displayName)}${verified(m)}${m.id === hub.ownerId ? '<span class="crown" title="Besitzer">👑</span>' : ''}</div>
        <div class="bio">${esc(m.bio || STATUS_LABEL[st])}</div></div>
      </button>`);
      row.onclick = () => showProfile(m.id, row);
      panel.append(row);
    }
  };
  section('Online', onlineList);
  section('Offline', offlineList);
}

function renderTyping() {
  const box = $('#typing');
  const map = state.typing.get(state.view.channelId);
  const names = map ? [...map.keys()].map((id) => userOf(id).displayName) : [];
  if (!names.length) { box.innerHTML = ''; return; }
  let text;
  if (names.length === 1) text = `<b>${esc(names[0])}</b> schreibt`;
  else if (names.length <= 3) text = `<b>${names.map(esc).join(', ')}</b> schreiben`;
  else text = 'Mehrere Leute schreiben';
  box.innerHTML = `<span class="typing-dots"><i></i><i></i><i></i></span><span>${text}…</span>`;
}

function updateTitle() {
  let total = 0;
  for (const u of state.unread.values()) if (u.mention) total += u.count;
  const label = state.view.channelId ? channelLabel(state.view.channelId) : '';
  document.title = `${total ? `(${total}) ` : ''}${label ? label + ' · ' : ''}Nexora`;
}

/* =========================================================================
   Messages
   ========================================================================= */

function renderMessagesShell() {
  const box = $('#messages');
  box.innerHTML = '';
  if (!state.view.channelId) {
    const hasDms = state.dms.size > 0;
    box.append(h(`<div class="channel-intro">
      <div class="hash-huge">✦</div>
      <h2>Willkommen, ${esc(state.me.displayName)}!</h2>
      <p>${hasDms ? 'Wähle links eine Unterhaltung aus.' : 'Starte eine Direktnachricht mit <b>+</b> oder klick auf ein Mitglied in einem Hub.'}</p>
      <p style="margin-top:14px"><button class="btn primary" data-act="new">${ICONS.chat} Neue Nachricht</button>
      <button class="btn" data-act="hub" style="margin-left:6px">${ICONS.plus} Hub erstellen</button></p>
    </div>`));
    box.querySelector('[data-act=new]').onclick = openNewDm;
    box.querySelector('[data-act=hub]').onclick = openCreateHub;
    return;
  }
  if (isVoiceChannel(state.view.channelId)) return renderStage();
  const ch = state.channels.get(state.view.channelId);
  if (ch && !ch.loading) rerenderMessages();
}

async function loadChannel(channelId, older = false) {
  let ch = state.channels.get(channelId);
  if (ch && !older) {
    if (!ch.loading) rerenderMessages(true);
    return;
  }
  if (ch?.loading) return;
  if (!ch) state.channels.set(channelId, (ch = { list: [], hasMore: true, loading: true }));
  ch.loading = true;

  const box = $('#messages');
  const prevHeight = box.scrollHeight;
  try {
    const res = await req('messages:fetch', { channelId, before: older ? ch.list[0]?.id : undefined });
    ch.list = older ? [...res.messages, ...ch.list] : res.messages;
    ch.hasMore = res.hasMore;
  } catch (ex) {
    toast(ex.message, 'error');
    state.channels.delete(channelId);
    return;
  } finally {
    ch.loading = false;
  }
  if (channelId !== state.view.channelId) return;
  rerenderMessages(!older);
  if (older) box.scrollTop = box.scrollHeight - prevHeight;
}

function channelIntro() {
  const channel = currentChannel();
  const dm = currentDm();
  if (channel) {
    return h(`<div class="channel-intro"><div class="hash-huge">#</div>
      <h2>Willkommen in #${esc(channel.name)}</h2>
      <p>${channel.topic ? esc(channel.topic) : 'Das ist der Anfang dieses Kanals.'}</p></div>`);
  }
  const p = dmPartner(dm);
  const node = h(`<div class="channel-intro">${avatar(p, { size: 72 })}
    <h2 style="margin-top:16px">${esc(p.displayName)}${verified(p)}</h2>
    <p>Das ist der Anfang deiner Unterhaltung mit <b>@${esc(p.username)}</b>.</p></div>`);
  return node;
}

function rerenderMessages(scrollToBottom = false) {
  const box = $('#messages');
  const ch = state.channels.get(state.view.channelId);
  if (!ch) return;
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
  const prevTop = box.scrollTop;

  const frag = document.createDocumentFragment();
  if (!ch.hasMore) frag.append(channelIntro());
  else {
    const more = h('<button class="btn load-more">Ältere Nachrichten laden</button>');
    more.onclick = () => loadChannel(state.view.channelId, true);
    frag.append(more);
  }
  let prev = null;
  for (const m of ch.list) {
    if (!prev || !sameDay(prev.createdAt, m.createdAt)) frag.append(h(`<div class="day-divider">${esc(dayLabel(m.createdAt))}</div>`));
    frag.append(messageNode(m, prev));
    prev = m;
  }
  box.innerHTML = '';
  box.append(frag);
  if (scrollToBottom || atBottom) box.scrollTop = box.scrollHeight;
  else box.scrollTop = prevTop;
}

function isContinuation(m, prev) {
  return prev && prev.authorId === m.authorId && !m.replyTo &&
    m.createdAt - prev.createdAt < 7 * 60 * 1000 && sameDay(prev.createdAt, m.createdAt);
}

function messageNode(m, prev) {
  const author = userOf(m.authorId);
  const hub = currentHub();
  const cont = isContinuation(m, prev);
  const mine = m.authorId === state.me.id;
  const canDelete = mine || (hub && isAdmin(hub, state.me.id));
  const ch = state.channels.get(m.channelId);
  const ref = m.replyTo && ch?.list.find((x) => x.id === m.replyTo);

  const reactions = Object.entries(m.reactions || {}).map(([emoji, users]) => {
    const names = users.map((id) => userOf(id).displayName).join(', ');
    return `<button class="reaction ${users.includes(state.me.id) ? 'mine' : ''}" data-emoji="${esc(emoji)}" title="${esc(names)}">${esc(emoji)}<span class="n">${users.length}</span></button>`;
  }).join('');

  const node = h(`<div class="msg ${cont ? '' : 'first'} ${mentionsMe(m.content) ? 'mention' : ''}" data-id="${esc(m.id)}">
    ${cont ? `<div class="gutter-time" title="${esc(stamp(m.createdAt))}">${timeFmt.format(m.createdAt)}</div>` : avatar(author)}
    <div class="msg-main">
      ${m.replyTo ? `<div class="msg-reply" data-ref="${esc(m.replyTo)}">${ref ? `<b>${esc(userOf(ref.authorId).displayName)}</b><span>${esc(ref.content)}</span>` : '<span><i>Ursprüngliche Nachricht nicht geladen oder gelöscht</i></span>'}</div>` : ''}
      ${cont ? '' : `<div class="msg-head"><span class="msg-author" style="--c:${esc(author.color)}">${esc(author.displayName)}</span>${verified(author)}${hub && hub.ownerId === author.id ? '<span class="owner-tag">OWNER</span>' : ''}<span class="msg-time" title="${esc(fullFmt.format(m.createdAt))}">${esc(stamp(m.createdAt))}</span></div>`}
      <div class="msg-body ${isJumbo(m.content) ? 'jumbo' : ''}">${formatMessage(m.content)}${m.editedAt ? `<span class="edited" title="${esc(fullFmt.format(m.editedAt))}">(bearbeitet)</span>` : ''}</div>
      ${reactions ? `<div class="reactions">${reactions}</div>` : ''}
    </div>
    <div class="msg-tools">
      ${QUICK_REACTIONS.map((e) => `<button class="icon-btn quick" data-act="react" data-emoji="${e}" title="Mit ${e} reagieren">${e}</button>`).join('')}
      <button class="icon-btn" data-act="pick" title="Reaktion hinzufügen">${ICONS.smile}</button>
      <button class="icon-btn" data-act="reply" title="Antworten">${ICONS.reply}</button>
      ${mine ? `<button class="icon-btn" data-act="edit" title="Bearbeiten">${ICONS.edit}</button>` : ''}
      ${canDelete ? `<button class="icon-btn danger" data-act="delete" title="Löschen">${ICONS.trash}</button>` : ''}
    </div>
  </div>`);
  if (m.id === state.editingId) startEdit(m.id, node);
  return node;
}

$('#messages').addEventListener('click', (e) => {
  const msgEl = e.target.closest('.msg');
  const spoiler = e.target.closest('.spoiler');
  if (spoiler) return spoiler.classList.toggle('shown');

  const userEl = e.target.closest('.avatar[data-user], .msg-author');
  if (userEl && msgEl) {
    const msg = findMsg(msgEl.dataset.id);
    if (msg) return showProfile(msg.authorId, userEl);
  }

  const replyEl = e.target.closest('.msg-reply');
  if (replyEl) return jumpTo(replyEl.dataset.ref);

  const reaction = e.target.closest('.reaction');
  if (reaction && msgEl) return react(msgEl.dataset.id, reaction.dataset.emoji);

  const act = e.target.closest('[data-act]');
  if (!act || !msgEl) return;
  const id = msgEl.dataset.id;
  switch (act.dataset.act) {
    case 'react': return react(id, act.dataset.emoji);
    case 'pick': {
      const tools = act.closest('.msg-tools');
      tools.classList.add('open');
      return openEmojiPicker(act, (emoji) => react(id, emoji), () => tools.classList.remove('open'));
    }
    case 'reply': return setReply(findMsg(id));
    case 'edit': return startEdit(id);
    case 'delete': return deleteMessage(id);
  }
});

$('#messages').addEventListener('scroll', () => {
  const box = $('#messages');
  const ch = state.channels.get(state.view.channelId);
  if (box.scrollTop < 60 && ch && ch.hasMore && !ch.loading) loadChannel(state.view.channelId, true);
});

function findMsg(id) {
  return state.channels.get(state.view.channelId)?.list.find((m) => m.id === id);
}

function jumpTo(id) {
  const node = $(`.msg[data-id="${id}"]`);
  if (!node) return toast('Nachricht ist nicht geladen.', 'error');
  node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  node.classList.remove('highlight');
  void node.offsetWidth;
  node.classList.add('highlight');
}

function onMessageNew(msg) {
  const ch = state.channels.get(msg.channelId);
  if (ch && !ch.list.some((m) => m.id === msg.id)) ch.list.push(msg);

  const dm = state.dms.get(msg.channelId);
  if (dm) dm.lastActivity = msg.createdAt;

  const viewing = msg.channelId === state.view.channelId;
  const mine = msg.authorId === state.me.id;

  if (viewing && ch) {
    const box = $('#messages');
    const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 160;
    const prev = ch.list[ch.list.length - 2];
    if (prev && !sameDay(prev.createdAt, msg.createdAt)) box.append(h(`<div class="day-divider">${esc(dayLabel(msg.createdAt))}</div>`));
    const node = messageNode(msg, prev);
    node.classList.add('new');
    box.append(node);
    if (atBottom || mine) box.scrollTop = box.scrollHeight;
  }

  const typers = state.typing.get(msg.channelId);
  if (typers?.has(msg.authorId)) {
    clearTimeout(typers.get(msg.authorId));
    typers.delete(msg.authorId);
    if (viewing) renderTyping();
  }

  if (!mine && (!viewing || document.hidden)) {
    const mention = Boolean(dm) || mentionsMe(msg.content);
    if (!viewing) {
      const u = state.unread.get(msg.channelId) || { count: 0, mention: false };
      u.count += 1;
      u.mention ||= mention;
      state.unread.set(msg.channelId, u);
    }
    if (mention) ping();
  }

  if (!viewing || dm) {
    renderRail();
    renderSidebar();
  }
  updateTitle();
}

async function react(messageId, emoji) {
  try {
    await req('message:react', { channelId: state.view.channelId, messageId, emoji });
  } catch (ex) {
    toast(ex.message, 'error');
  }
}

async function deleteMessage(id) {
  const msg = findMsg(id);
  if (!msg) return;
  const ok = await confirmDialog('Nachricht löschen?', `„${msg.content.slice(0, 120)}${msg.content.length > 120 ? '…' : ''}“ wird für alle entfernt.`, 'Löschen');
  if (!ok) return;
  try {
    await req('message:delete', { channelId: state.view.channelId, messageId: id });
  } catch (ex) {
    toast(ex.message, 'error');
  }
}

function startEdit(id, node = $(`.msg[data-id="${id}"]`)) {
  const msg = findMsg(id);
  if (!msg || !node) return;
  state.editingId = id;
  const body = node.querySelector('.msg-body');
  const box = h(`<div class="edit-box"><textarea rows="1" maxlength="2000"></textarea>
    <small>Esc zum <b data-act="cancel">Abbrechen</b> · Enter zum <b data-act="save">Speichern</b></small></div>`);
  const ta = box.querySelector('textarea');
  ta.value = msg.content;
  body.replaceWith(box);
  autosize(ta);
  requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); });

  const finish = () => {
    state.editingId = null;
    const fresh = findMsg(id);
    if (!fresh) return;
    const ch = state.channels.get(state.view.channelId);
    node.replaceWith(messageNode(fresh, ch.list[ch.list.indexOf(fresh) - 1]));
    $('#composer-input').focus();
  };
  const save = async () => {
    const text = ta.value.trim();
    if (!text) return deleteMessage(id).then(finish);
    if (text !== msg.content) {
      try {
        await req('message:edit', { channelId: state.view.channelId, messageId: id, content: text });
      } catch (ex) {
        return toast(ex.message, 'error');
      }
    }
    finish();
  };
  ta.addEventListener('input', () => autosize(ta));
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(); }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
  });
  box.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'cancel') finish();
    if (act === 'save') save();
  });
}

/* ---------- composer ---------- */

const input = $('#composer-input');
let lastTypingSent = 0;

function autosize(ta) {
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 220) + 'px';
}

function setReply(msg) {
  state.replyTo = msg || null;
  renderReplyBar();
  if (msg) input.focus();
}

function renderReplyBar() {
  const bar = $('#reply-bar');
  const msg = state.replyTo;
  if (!msg) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  bar.innerHTML = `Antwort an <b>${esc(userOf(msg.authorId).displayName)}</b><button class="icon-btn x" title="Abbrechen">${ICONS.x}</button>`;
  bar.querySelector('.x').onclick = () => setReply(null);
}

input.addEventListener('input', () => {
  autosize(input);
  $('#send-btn').disabled = !input.value.trim();
  const now = Date.now();
  if (input.value.trim() && now - lastTypingSent > 2500 && state.view.channelId) {
    lastTypingSent = now;
    req('typing', { channelId: state.view.channelId }).catch(() => {});
  }
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    sendMessage();
  } else if (e.key === 'Escape' && state.replyTo) {
    setReply(null);
  } else if (e.key === 'ArrowUp' && !input.value) {
    const ch = state.channels.get(state.view.channelId);
    const last = ch && [...ch.list].reverse().find((m) => m.authorId === state.me.id);
    if (last) { e.preventDefault(); startEdit(last.id); }
  }
});

$('#composer').addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage();
});

async function sendMessage() {
  const text = input.value.trim();
  const channelId = state.view.channelId;
  if (!text || !channelId) return;
  const replyTo = state.replyTo?.id;
  input.value = '';
  autosize(input);
  $('#send-btn').disabled = true;
  setReply(null);
  lastTypingSent = 0;
  try {
    await req('message:send', { channelId, content: text, replyTo });
  } catch (ex) {
    toast(ex.message, 'error');
    if (!input.value) { input.value = text; autosize(input); $('#send-btn').disabled = false; }
  }
}

$('#emoji-btn').addEventListener('click', (e) => {
  openEmojiPicker(e.currentTarget, (emoji) => {
    const start = input.selectionStart ?? input.value.length;
    input.setRangeText(emoji, start, input.selectionEnd ?? start, 'end');
    input.dispatchEvent(new Event('input'));
    input.focus();
  });
});

/* =========================================================================
   Popovers
   ========================================================================= */

let popoverCleanup = null;

function closePopover() {
  $('#popover-root').innerHTML = '';
  popoverCleanup?.();
  popoverCleanup = null;
}

function placePopover(pop, anchor) {
  $('#popover-root').append(pop);
  const r = anchor.getBoundingClientRect();
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  let left = r.right + 10;
  if (left + pw > innerWidth - 12) left = r.left - pw - 10;
  if (left < 12) left = Math.min(Math.max(12, r.left), innerWidth - pw - 12);
  let top = r.top;
  if (top + ph > innerHeight - 12) top = innerHeight - ph - 12;
  if (left === r.left || (left > r.left - pw && left < r.right)) {
    // anchored horizontally over the element — open above or below instead
    top = r.top - ph - 8 > 12 ? r.top - ph - 8 : r.bottom + 8;
  }
  pop.style.left = left + 'px';
  pop.style.top = Math.max(12, top) + 'px';
  setTimeout(() => {
    const onDown = (e) => { if (!pop.contains(e.target)) closePopover(); };
    document.addEventListener('mousedown', onDown);
    popoverCleanup = () => document.removeEventListener('mousedown', onDown);
  });
}

function showProfile(userId, anchor) {
  closePopover();
  const u = userOf(userId);
  const st = statusOf(u.id);
  const isMe = u.id === state.me.id;
  const pop = h(`<div class="popover" style="--c:${esc(u.color)}">
    <div class="profile-banner"></div>
    <div class="profile-body">
      ${avatar(u, { dot: true })}
      <h4>${esc(u.displayName)}${verified(u)}</h4>
      <div class="handle">@${esc(u.username)} · ${STATUS_LABEL[st]}</div>
      ${u.bio ? `<div class="bio">${esc(u.bio)}</div>` : '<div style="height:12px"></div>'}
      <div class="meta">Dabei seit ${u.createdAt ? esc(fullFmt.format(u.createdAt).split(',')[0]) : '–'}</div>
      ${isMe ? `<button class="btn block" data-act="edit">${ICONS.edit} Profil bearbeiten</button>` : `<button class="btn primary block" data-act="dm">${ICONS.chat} Nachricht senden</button>`}
    </div>
  </div>`);
  pop.querySelector('[data-act]').onclick = () => (isMe ? (closePopover(), openSettings()) : openDmWith(u.id));
  placePopover(pop, anchor);
}

function openEmojiPicker(anchor, onPick, onClose) {
  closePopover();
  const pop = h(`<div class="popover emoji-pop"><div class="section-label"><span>Emojis</span></div><div class="emoji-grid">
    ${EMOJIS.map((e) => `<button data-e="${e}">${e}</button>`).join('')}</div></div>`);
  pop.addEventListener('click', (e) => {
    const b = e.target.closest('[data-e]');
    if (!b) return;
    onPick(b.dataset.e);
    closePopover();
  });
  placePopover(pop, anchor);
  const prev = popoverCleanup;
  setTimeout(() => {
    const inner = popoverCleanup;
    popoverCleanup = () => { inner?.(); prev?.(); onClose?.(); };
  });
}

/* =========================================================================
   Modals
   ========================================================================= */

function openModal(html, { className = '', backdropClass = '' } = {}) {
  const root = h(`<div class="modal-backdrop ${backdropClass}"><div class="modal ${className}">${html}</div></div>`);
  const close = () => {
    root.remove();
    document.removeEventListener('keydown', onKey, true);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
  };
  document.addEventListener('keydown', onKey, true);
  root.addEventListener('mousedown', (e) => { if (e.target === root) close(); });
  $('#modal-root').append(root);
  const modal = root.firstElementChild;
  modal.querySelectorAll('[data-close]').forEach((b) => (b.onclick = close));
  requestAnimationFrame(() => modal.querySelector('input:not([type=color]), textarea')?.focus());
  return { modal, close };
}

function confirmDialog(title, text, confirmLabel = 'Bestätigen') {
  return new Promise((resolve) => {
    const { modal, close } = openModal(`<h3>${esc(title)}</h3><p class="sub">${esc(text)}</p>
      <div class="modal-actions"><button class="btn" data-close>Abbrechen</button><button class="btn danger" data-ok>${esc(confirmLabel)}</button></div>`);
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    modal.querySelector('[data-ok]').onclick = () => { finish(true); close(); };
    const obs = new MutationObserver(() => { if (!modal.isConnected) { finish(false); obs.disconnect(); } });
    obs.observe($('#modal-root'), { childList: true });
    modal.querySelector('[data-ok]').focus();
  });
}

function iconPicker(selected) {
  return `<div class="icon-picker">${HUB_ICONS.map((i) => `<button type="button" data-icon="${i}" class="${i === selected ? 'sel' : ''}" title="${i ? '' : 'Initialen'}">${i || 'Aa'}</button>`).join('')}</div>`;
}

function bindIconPicker(modal) {
  modal.querySelector('.icon-picker').addEventListener('click', (e) => {
    const b = e.target.closest('[data-icon]');
    if (!b) return;
    modal.querySelectorAll('.icon-picker button').forEach((x) => x.classList.toggle('sel', x === b));
  });
  return () => modal.querySelector('.icon-picker .sel')?.dataset.icon ?? '';
}

async function submitting(form, fn) {
  const btn = form.querySelector('[type=submit]');
  const err = form.querySelector('.form-error');
  btn.disabled = true;
  if (err) err.textContent = '';
  try {
    await fn();
  } catch (ex) {
    if (err) err.textContent = ex.message;
    else toast(ex.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

function openCreateHub() {
  const { modal, close } = openModal(`
    <h3>Neuen Hub starten</h3>
    <p class="sub">Ein Hub ist euer eigener Ort mit Kanälen. Lad Freunde per Code ein.</p>
    <form>
      <label class="field"><span>Name</span><input name="name" maxlength="40" required placeholder="z. B. Late Night Squad" /></label>
      <div class="field"><span>Symbol</span></div>
      ${iconPicker('🔥')}
      <p class="form-error"></p>
      <div class="modal-actions"><button type="button" class="btn" data-close>Abbrechen</button><button type="submit" class="btn primary">Hub erstellen</button></div>
    </form>`);
  const getIcon = bindIconPicker(modal);
  const form = modal.querySelector('form');
  form.onsubmit = (e) => {
    e.preventDefault();
    submitting(form, async () => {
      const { hub } = await req('hub:create', { name: form.name.value, icon: getIcon() });
      state.hubs.set(hub.id, hub);
      close();
      openHub(hub.id);
      toast(`„${hub.name}“ ist live!`);
    });
  };
}

function openJoinHub() {
  const { modal, close } = openModal(`
    <h3>Hub beitreten</h3>
    <p class="sub">Gib einen Einladungscode oder -link ein.</p>
    <form>
      <label class="field"><span>Einladung</span><input name="code" required placeholder="z. B. NEXORA oder https://…/?invite=ABC123" /></label>
      <p class="form-error"></p>
      <div class="modal-actions"><button type="button" class="btn" data-close>Abbrechen</button><button type="submit" class="btn primary">Beitreten</button></div>
    </form>`);
  const form = modal.querySelector('form');
  form.onsubmit = (e) => {
    e.preventDefault();
    submitting(form, async () => {
      await joinHub(form.code.value, true);
      close();
    });
  };
}

async function joinHub(code, throwErrors = false) {
  try {
    const { hub } = await req('hub:join', { code });
    state.hubs.set(hub.id, hub);
    openHub(hub.id);
    toast(`Willkommen in „${hub.name}“`);
  } catch (ex) {
    if (throwErrors) throw ex;
    toast(ex.message, 'error');
    if (!state.view.channelId) openHome();
  }
}

function inviteLink(hub) {
  return `${location.origin}/?invite=${hub.inviteCode}`;
}

function openInvite(hubId) {
  const hub = state.hubs.get(hubId);
  const { modal } = openModal(`
    <h3>Leute in ${esc(hub.name)} einladen</h3>
    <p class="sub">Teile den Code oder den Link. Wer ihn hat, kann beitreten.</p>
    <div class="invite-box"><code>${esc(hub.inviteCode)}</code><button class="btn primary" data-act="code">${ICONS.copy} Code</button></div>
    <div class="invite-box"><code style="font-size:13px;letter-spacing:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(inviteLink(hub))}</code><button class="btn" data-act="link">${ICONS.copy} Link</button></div>
    <div class="modal-actions"><button class="btn" data-close>Fertig</button></div>`);
  modal.querySelector('[data-act=code]').onclick = () => copyText(hub.inviteCode);
  modal.querySelector('[data-act=link]').onclick = () => copyText(inviteLink(hub));
}

function openHubSettings(hubId) {
  const hub = state.hubs.get(hubId);
  if (!hub) return;
  const isOwner = isAdmin(hub, state.me.id);
  if (!isOwner) {
    const { modal, close } = openModal(`
      <h3>${hub.icon ? esc(hub.icon) + ' ' : ''}${esc(hub.name)}</h3>
      <p class="sub">${hub.members.length} Mitglieder · Besitzer: ${hub.ownerId ? esc(userOf(hub.ownerId).displayName) : 'Nexora'}</p>
      <div class="invite-box"><code>${esc(hub.inviteCode)}</code><button class="btn primary" data-act="copy">${ICONS.copy} Kopieren</button></div>
      <div class="modal-actions"><button class="btn danger" data-act="leave">${ICONS.logout} Hub verlassen</button><span class="spacer"></span><button class="btn" data-close>Schließen</button></div>`);
    modal.querySelector('[data-act=copy]').onclick = () => copyText(inviteLink(hub));
    modal.querySelector('[data-act=leave]').onclick = async () => {
      close();
      if (!(await confirmDialog('Hub verlassen?', `Du verlässt „${hub.name}“. Du kannst jederzeit per Einladung zurückkommen.`, 'Verlassen'))) return;
      req('hub:leave', { hubId }).catch((ex) => toast(ex.message, 'error'));
    };
    return;
  }

  const { modal, close } = openModal(`
    <h3>Hub-Einstellungen</h3>
    <p class="sub">Nur ${hub.isLounge ? 'offizielle Accounts' : 'du als Besitzer'} ${hub.isLounge ? 'sehen' : 'siehst'} diese Optionen.</p>
    <form>
      <label class="field"><span>Name</span><input name="name" maxlength="40" required /></label>
      <div class="field"><span>Symbol</span></div>
      ${iconPicker(hub.icon)}
      <p class="form-error"></p>
      <div class="modal-actions"><button type="submit" class="btn primary">Speichern</button></div>
    </form>
    <hr />
    <div class="field"><span>Einladungscode</span></div>
    <div class="invite-box"><code data-code>${esc(hub.inviteCode)}</code>
      <button class="btn" data-act="copy" title="Link kopieren">${ICONS.copy}</button>
      <button class="btn" data-act="regen">Neu</button></div>
    <hr />
    <div class="modal-actions">${hub.isLounge ? '' : `<button class="btn danger" data-act="delete">${ICONS.trash} Hub löschen</button>`}<span class="spacer"></span><button class="btn" data-close>Schließen</button></div>`);
  const form = modal.querySelector('form');
  form.name.value = hub.name;
  const getIcon = bindIconPicker(modal);
  form.onsubmit = (e) => {
    e.preventDefault();
    submitting(form, async () => {
      await req('hub:update', { hubId, name: form.name.value, icon: getIcon() });
      toast('Gespeichert');
    });
  };
  modal.querySelector('[data-act=copy]').onclick = () => copyText(inviteLink(state.hubs.get(hubId)));
  modal.querySelector('[data-act=regen]').onclick = async () => {
    try {
      const { inviteCode } = await req('hub:regenerateInvite', { hubId });
      modal.querySelector('[data-code]').textContent = inviteCode;
      toast('Neuer Code erstellt – der alte gilt nicht mehr');
    } catch (ex) {
      toast(ex.message, 'error');
    }
  };
  const deleteBtn = modal.querySelector('[data-act=delete]');
  if (deleteBtn) deleteBtn.onclick = async () => {
    close();
    if (!(await confirmDialog('Hub endgültig löschen?', `„${hub.name}“ und alle Nachrichten werden für alle Mitglieder gelöscht. Das kann nicht rückgängig gemacht werden.`, 'Endgültig löschen'))) return;
    req('hub:delete', { hubId }).catch((ex) => toast(ex.message, 'error'));
  };
}

function openChannelEditor(hubId, channelId, initialKind = 'text') {
  const hub = state.hubs.get(hubId);
  const channel = channelId && hub.channels.find((c) => c.id === channelId);
  let kind = channel ? channel.kind || 'text' : initialKind;
  const { modal, close } = openModal(`
    <h3>${channel ? 'Kanal bearbeiten' : 'Kanal erstellen'}</h3>
    <p class="sub">${channel ? `${esc(channelLabel(channel.id))} in ${esc(hub.name)}` : `Neuer Kanal in ${esc(hub.name)}`}</p>
    <form>
      ${channel ? '' : `<div class="field"><span>Art</span></div>
      <div class="kind-row">
        <button type="button" class="kind-opt" data-kind="text"><b>#</b><span><strong>Text</strong><small>Nachrichten, Emojis, Links</small></span></button>
        <button type="button" class="kind-opt" data-kind="voice">${ICONS.speaker}<span><strong>Sprache</strong><small>Zusammen reden in Echtzeit</small></span></button>
      </div>`}
      <label class="field"><span>Name</span><input name="name" maxlength="32" required placeholder="neuer-kanal" /></label>
      <label class="field topic-field"><span>Thema <em>(optional)</em></span><input name="topic" maxlength="120" placeholder="Worum geht's hier?" /></label>
      <p class="form-error"></p>
      <div class="modal-actions">
        ${channel ? `<button type="button" class="btn danger" data-act="delete">${ICONS.trash} Löschen</button><span class="spacer"></span>` : ''}
        <button type="button" class="btn" data-close>Abbrechen</button>
        <button type="submit" class="btn primary">${channel ? 'Speichern' : 'Erstellen'}</button>
      </div>
    </form>`);
  const form = modal.querySelector('form');
  if (channel) {
    form.name.value = channel.name;
    form.topic.value = channel.topic || '';
  }
  const applyKind = () => {
    modal.querySelectorAll('.kind-opt').forEach((b) => b.classList.toggle('sel', b.dataset.kind === kind));
    modal.querySelector('.topic-field').classList.toggle('hidden', kind === 'voice');
    form.name.placeholder = kind === 'voice' ? 'Treffpunkt' : 'neuer-kanal';
  };
  modal.querySelector('.kind-row')?.addEventListener('click', (e) => {
    const b = e.target.closest('.kind-opt');
    if (!b) return;
    kind = b.dataset.kind;
    applyKind();
  });
  applyKind();
  form.name.addEventListener('input', () => {
    if (kind === 'voice') return;
    const pos = form.name.selectionStart;
    form.name.value = form.name.value.toLowerCase().replace(/\s/g, '-');
    form.name.setSelectionRange(pos, pos);
  });
  form.onsubmit = (e) => {
    e.preventDefault();
    submitting(form, async () => {
      if (channel) {
        await req('channel:update', { channelId, name: form.name.value, topic: form.topic.value });
      } else {
        const res = await req('channel:create', { hubId, name: form.name.value, topic: kind === 'voice' ? '' : form.topic.value, kind });
        const fresh = state.hubs.get(hubId);
        if (!fresh.channels.some((c) => c.id === res.channel.id)) fresh.channels.push(res.channel);
        openHub(hubId, res.channel.id);
      }
      close();
    });
  };
  modal.querySelector('[data-act=delete]')?.addEventListener('click', async () => {
    close();
    const text = channel.kind === 'voice' ? `${channelLabel(channel.id)} wird gelöscht. Wer gerade drin ist, fliegt raus.` : `#${channel.name} und alle Nachrichten darin werden gelöscht.`;
    if (!(await confirmDialog('Kanal löschen?', text, 'Löschen'))) return;
    req('channel:delete', { channelId }).catch((ex) => toast(ex.message, 'error'));
  });
}

function openNewDm() {
  const { modal, close } = openModal(`
    <h3>Neue Direktnachricht</h3>
    <p class="sub">Suche nach Benutzername oder Anzeigename.</p>
    <label class="field"><span>Suchen</span><input name="q" placeholder="Name eingeben…" autocomplete="off" /></label>
    <div class="result-list"></div>
    <div class="modal-actions"><button class="btn" data-close>Schließen</button></div>`);
  const q = modal.querySelector('[name=q]');
  const list = modal.querySelector('.result-list');
  const render = (users) => {
    list.innerHTML = users.length ? '' : '<div class="empty-hint">Niemand gefunden.</div>';
    for (const u of users) {
      const row = h(`<button class="member" style="--c:${esc(u.color)}">${avatar(u, { dot: true })}<div class="info"><div class="name">${esc(u.displayName)}${verified(u)}</div><div class="bio">@${esc(u.username)}</div></div></button>`);
      row.onclick = () => { close(); openDmWith(u.id); };
      list.append(row);
    }
  };
  const known = () => [...state.users.values()].filter((u) => u.id !== state.me.id).sort((a, b) => a.displayName.localeCompare(b.displayName));
  render(known().slice(0, 20));
  let timer;
  q.addEventListener('input', () => {
    clearTimeout(timer);
    const value = q.value.trim();
    if (value.length < 2) return render(known().slice(0, 20));
    timer = setTimeout(async () => {
      try {
        const { users } = await req('user:search', { query: value });
        users.forEach((u) => { if (!state.users.has(u.id)) state.users.set(u.id, u); });
        if (q.value.trim() === value) render(users);
      } catch (ex) {
        toast(ex.message, 'error');
      }
    }, 200);
  });
}

function openSettings() {
  closePopover();
  const me = state.me;
  const { modal, close } = openModal(`
    <h3>Dein Profil</h3>
    <p class="sub">@${esc(me.username)}</p>
    <form>
      <label class="field"><span>Anzeigename</span><input name="displayName" maxlength="32" required /></label>
      <label class="field"><span>Über mich <em>(optional)</em></span><textarea name="bio" maxlength="190" rows="3" placeholder="Erzähl was über dich"></textarea></label>
      <div class="field"><span>Akzentfarbe</span></div>
      <div class="color-row">${ACCENTS.map((c) => `<button type="button" class="swatch ${c === me.color ? 'sel' : ''}" style="--c:${c}" data-c="${c}"></button>`).join('')}
        <input type="color" value="${esc(me.color)}" title="Eigene Farbe" /></div>
      <div class="field"><span>Status</span></div>
      <div class="status-row">${['online', 'idle', 'dnd', 'invisible'].map((s) => `<button type="button" class="status-opt ${s === me.status ? 'sel' : ''}" data-s="${s}"><span class="dot ${s === 'invisible' ? 'offline' : s}"></span>${STATUS_LABEL[s]}</button>`).join('')}</div>
      <p class="form-error"></p>
      <div class="modal-actions">
        <button type="button" class="btn danger" data-act="logout">${ICONS.logout} Abmelden</button><span class="spacer"></span>
        <button type="button" class="btn" data-close>Abbrechen</button><button type="submit" class="btn primary">Speichern</button>
      </div>
    </form>`);
  const form = modal.querySelector('form');
  form.displayName.value = me.displayName;
  form.bio.value = me.bio || '';
  let color = me.color;
  let status = me.status;
  const picker = modal.querySelector('input[type=color]');
  modal.querySelector('.color-row').addEventListener('click', (e) => {
    const s = e.target.closest('.swatch');
    if (!s) return;
    color = s.dataset.c;
    picker.value = color;
    modal.querySelectorAll('.swatch').forEach((x) => x.classList.toggle('sel', x === s));
  });
  picker.addEventListener('input', () => {
    color = picker.value;
    modal.querySelectorAll('.swatch').forEach((x) => x.classList.remove('sel'));
  });
  modal.querySelector('.status-row').addEventListener('click', (e) => {
    const s = e.target.closest('.status-opt');
    if (!s) return;
    status = s.dataset.s;
    modal.querySelectorAll('.status-opt').forEach((x) => x.classList.toggle('sel', x === s));
  });
  modal.querySelector('[data-act=logout]').onclick = logout;
  form.onsubmit = (e) => {
    e.preventDefault();
    submitting(form, async () => {
      const { user } = await req('profile:update', { displayName: form.displayName.value, bio: form.bio.value, color, status });
      state.me = user;
      state.users.set(user.id, user);
      renderMe();
      close();
      toast('Profil gespeichert');
    });
  };
}

/* ---------- command palette ---------- */

function openPalette() {
  if ($('.palette')) return;
  const { modal, close } = openModal(`
    <div class="palette-input">${ICONS.search}<input placeholder="Wohin willst du? Hubs, Kanäle, Leute…" autocomplete="off" /></div>
    <div class="palette-list"></div>
    <div class="palette-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> auswählen</span><span><kbd>Enter</kbd> öffnen</span><span><kbd>Esc</kbd> schließen</span></div>`,
  { className: 'palette', backdropClass: 'palette-backdrop' });
  const q = modal.querySelector('input');
  const list = modal.querySelector('.palette-list');
  let items = [];
  let sel = 0;

  const all = () => {
    const out = [];
    for (const hub of state.hubs.values()) {
      out.push({ label: hub.name, kind: 'Hub', ico: hub.icon || initials(hub.name), go: () => openHub(hub.id) });
      for (const c of hub.channels) {
        out.push({ label: c.name, kind: hub.name, ico: c.kind === 'voice' ? '🔊' : '#', go: () => openHub(hub.id, c.id), unread: state.unread.has(c.id) });
      }
    }
    const dmUsers = new Set();
    for (const dm of sortedDms()) {
      const p = dmPartner(dm);
      dmUsers.add(p.id);
      out.push({ label: p.displayName, kind: 'Direktnachricht', user: p, go: () => openDm(dm.id), unread: state.unread.has(dm.id) });
    }
    for (const u of state.users.values()) {
      if (u.id === state.me.id || dmUsers.has(u.id)) continue;
      out.push({ label: u.displayName, kind: '@' + u.username, user: u, go: () => openDmWith(u.id) });
    }
    return out;
  };

  const render = () => {
    const term = q.value.trim().toLowerCase();
    const source = all();
    items = term
      ? source.filter((i) => i.label.toLowerCase().includes(term) || i.kind.toLowerCase().includes(term))
        .sort((a, b) => (b.label.toLowerCase().startsWith(term) ? 1 : 0) - (a.label.toLowerCase().startsWith(term) ? 1 : 0))
      : source.filter((i) => i.unread).concat(source.filter((i) => !i.unread));
    items = items.slice(0, 40);
    sel = Math.min(sel, Math.max(0, items.length - 1));
    list.innerHTML = items.length ? '' : '<div class="empty-hint">Nichts gefunden.</div>';
    items.forEach((it, i) => {
      const row = h(`<button class="palette-item ${i === sel ? 'sel' : ''}">
        ${it.user ? avatar(it.user, { dot: true }) : `<span class="ico">${esc(it.ico)}</span>`}
        <span>${esc(it.label)}</span>${it.unread ? '<span class="badge" style="border:0">•</span>' : ''}<span class="kind">${esc(it.kind)}</span></button>`);
      row.onmouseenter = () => { sel = i; highlight(); };
      row.onclick = () => { close(); it.go(); };
      list.append(row);
    });
  };
  const highlight = () => {
    $$('.palette-item', list).forEach((r, i) => r.classList.toggle('sel', i === sel));
    $$('.palette-item', list)[sel]?.scrollIntoView({ block: 'nearest' });
  };
  q.addEventListener('input', () => { sel = 0; render(); });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, items.length - 1); highlight(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); highlight(); }
    if (e.key === 'Enter' && items[sel]) { e.preventDefault(); close(); items[sel].go(); }
  });
  render();
}

/* =========================================================================
   Voice (WebRTC mesh; the server only relays the connection setup)
   ========================================================================= */

const vc = {
  channelId: null,
  hubId: null,
  stream: null,
  muted: false,
  deafened: false,
  mutedBeforeDeafen: false,
  iceServers: [],
  peers: new Map(), // socketId -> { pc, userId, audio, pendingIce, analyser }
  localAnalyser: null,
  joining: false,
};

function isVoiceChannel(channelId) {
  for (const hub of state.hubs.values()) {
    const c = hub.channels.find((x) => x.id === channelId);
    if (c) return c.kind === 'voice';
  }
  return false;
}

function getAudioCtx() {
  audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

function makeAnalyser(stream) {
  try {
    const ctx = getAudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    return { analyser, buf: new Uint8Array(analyser.fftSize) };
  } catch {
    return null;
  }
}

function level(a) {
  if (!a) return 0;
  a.analyser.getByteTimeDomainData(a.buf);
  let sum = 0;
  for (const v of a.buf) sum += (v - 128) * (v - 128);
  return Math.sqrt(sum / a.buf.length);
}

// Short two-tone chime for join/leave.
function voiceSound(up) {
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    [0, 0.09].forEach((offset, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = up ? [660, 990][i] : [990, 660][i];
      g.gain.setValueAtTime(0.0001, t + offset);
      g.gain.exponentialRampToValueAtTime(0.08, t + offset + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.16);
      o.connect(g).connect(ctx.destination);
      o.start(t + offset);
      o.stop(t + offset + 0.2);
    });
  } catch {
    /* audio not available */
  }
}

setInterval(() => {
  if (!vc.channelId) {
    if (state.speaking.size) { state.speaking.clear(); updateSpeaking(); }
    return;
  }
  const next = new Set();
  if (!vc.muted && level(vc.localAnalyser) > 6) next.add(state.me.id);
  for (const peer of vc.peers.values()) if (peer.userId && level(peer.analyser) > 6) next.add(peer.userId);
  const changed = next.size !== state.speaking.size || [...next].some((id) => !state.speaking.has(id));
  if (changed) {
    state.speaking = next;
    updateSpeaking();
  }
}, 120);

function updateSpeaking() {
  $$('[data-voice-user]').forEach((el) => el.classList.toggle('speaking', state.speaking.has(el.dataset.voiceUser)));
}

async function joinVoice(channelId) {
  if (vc.joining || vc.channelId === channelId) return;
  if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
    return toast('Dein Browser unterstützt keine Sprachkanäle (HTTPS nötig).', 'error');
  }
  vc.joining = true;
  renderVoiceUi();
  try {
    getAudioCtx();
    if (vc.channelId) leaveVoice(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    }).catch(() => {
      throw new Error('Kein Mikrofon-Zugriff. Erlaube das Mikrofon in den Browser-Einstellungen.');
    });
    stream.getAudioTracks().forEach((t) => (t.enabled = !vc.muted));
    let res;
    try {
      res = await req('voice:join', { channelId, muted: vc.muted, deafened: vc.deafened });
    } catch (ex) {
      stream.getTracks().forEach((t) => t.stop());
      throw ex;
    }
    vc.stream = stream;
    vc.channelId = channelId;
    vc.hubId = [...state.hubs.values()].find((h) => h.channels.some((c) => c.id === channelId))?.id || null;
    vc.iceServers = res.iceServers || [];
    vc.localAnalyser = makeAnalyser(stream);
    for (const p of res.peers) startCall(p.socketId, p.userId);
    voiceSound(true);
  } catch (ex) {
    toast(ex.message, 'error');
  } finally {
    vc.joining = false;
    renderVoiceUi();
  }
}

// After a reconnect the server forgot us: rebuild all connections with the same mic.
async function rejoinVoice() {
  const channelId = vc.channelId;
  for (const id of [...vc.peers.keys()]) closePeer(id);
  if (!isVoiceChannel(channelId)) return cleanupVoice();
  try {
    const res = await req('voice:join', { channelId, muted: vc.muted, deafened: vc.deafened });
    vc.iceServers = res.iceServers || [];
    for (const p of res.peers) startCall(p.socketId, p.userId);
  } catch {
    cleanupVoice();
  }
  renderVoiceUi();
}

function leaveVoice(silent = false) {
  if (!vc.channelId) return;
  req('voice:leave').catch(() => {});
  cleanupVoice();
  if (!silent) voiceSound(false);
  renderVoiceUi();
}

function cleanupVoice() {
  for (const id of [...vc.peers.keys()]) closePeer(id);
  vc.stream?.getTracks().forEach((t) => t.stop());
  vc.stream = null;
  vc.localAnalyser = null;
  vc.channelId = null;
  vc.hubId = null;
}

function createPeer(socketId, userId) {
  const pc = new RTCPeerConnection({ iceServers: vc.iceServers });
  const peer = { pc, userId, audio: null, pendingIce: [], analyser: null, warned: false };
  vc.peers.set(socketId, peer);
  vc.stream?.getTracks().forEach((t) => pc.addTrack(t, vc.stream));
  pc.onicecandidate = (e) => {
    if (e.candidate) req('voice:signal', { to: socketId, data: { candidate: e.candidate.toJSON() } }).catch(() => {});
  };
  pc.ontrack = (e) => {
    const stream = e.streams[0] || new MediaStream([e.track]);
    if (!peer.audio) {
      peer.audio = document.createElement('audio');
      peer.audio.autoplay = true;
      peer.audio.playsInline = true;
      $('#voice-audio').append(peer.audio);
    }
    peer.audio.srcObject = stream;
    peer.audio.muted = vc.deafened;
    peer.audio.play().catch(() => {});
    peer.analyser = makeAnalyser(stream);
  };
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'failed' && !peer.warned) {
      peer.warned = true;
      toast(`Keine Sprachverbindung zu ${userOf(peer.userId).displayName} – das Netzwerk blockiert sie.`, 'error');
    }
  };
  return peer;
}

async function startCall(socketId, userId) {
  const { pc } = createPeer(socketId, userId);
  try {
    await pc.setLocalDescription(await pc.createOffer());
    await req('voice:signal', { to: socketId, data: { sdp: pc.localDescription.toJSON() } });
  } catch (err) {
    console.warn('[voice] offer', err);
  }
}

async function handleSignal({ from, userId, data }) {
  if (!vc.channelId) return;
  const peer = vc.peers.get(from) || createPeer(from, userId);
  peer.userId = userId;
  const { pc } = peer;
  if (data.sdp) {
    await pc.setRemoteDescription(data.sdp);
    for (const c of peer.pendingIce.splice(0)) await pc.addIceCandidate(c).catch(() => {});
    if (data.sdp.type === 'offer') {
      await pc.setLocalDescription(await pc.createAnswer());
      await req('voice:signal', { to: from, data: { sdp: pc.localDescription.toJSON() } });
    }
  } else if (data.candidate) {
    if (pc.remoteDescription) await pc.addIceCandidate(data.candidate).catch(() => {});
    else peer.pendingIce.push(data.candidate);
  }
}

function closePeer(socketId) {
  const peer = vc.peers.get(socketId);
  if (!peer) return;
  vc.peers.delete(socketId);
  peer.pc.close();
  if (peer.audio) {
    peer.audio.srcObject = null;
    peer.audio.remove();
  }
}

function setVoiceFlags(muted, deafened) {
  vc.muted = muted;
  vc.deafened = deafened;
  vc.stream?.getAudioTracks().forEach((t) => (t.enabled = !muted));
  for (const peer of vc.peers.values()) if (peer.audio) peer.audio.muted = deafened;
  if (vc.channelId) req('voice:update', { muted, deafened }).catch(() => {});
  renderVoiceUi();
}

function toggleMute() {
  if (vc.deafened) return setVoiceFlags(false, false);
  setVoiceFlags(!vc.muted, false);
}

function toggleDeafen() {
  if (vc.deafened) return setVoiceFlags(vc.mutedBeforeDeafen, false);
  vc.mutedBeforeDeafen = vc.muted;
  setVoiceFlags(true, true);
}

function onVoiceState({ channelId, members }) {
  const before = (state.voiceStates.get(channelId) || []).map((m) => m.userId);
  if (members.length) state.voiceStates.set(channelId, members);
  else state.voiceStates.delete(channelId);
  if (channelId === vc.channelId) {
    const after = members.map((m) => m.userId).filter((id) => id !== state.me.id);
    const prev = before.filter((id) => id !== state.me.id);
    if (after.some((id) => !prev.includes(id))) voiceSound(true);
    else if (prev.some((id) => !after.includes(id))) voiceSound(false);
  }
  renderVoiceUi();
}

function voiceButtons(big = false) {
  const cls = big ? 'stage-btn' : 'icon-btn';
  return `
    <button class="${cls} ${vc.muted ? 'off' : ''}" data-voice="mute" title="${vc.muted ? 'Mikrofon an' : 'Stumm schalten'}">${vc.muted ? ICONS.micOff : ICONS.mic}</button>
    <button class="${cls} ${vc.deafened ? 'off' : ''}" data-voice="deafen" title="${vc.deafened ? 'Ton an' : 'Ton aus'}">${vc.deafened ? ICONS.headphonesOff : ICONS.headphones}</button>
    <button class="${cls} hangup" data-voice="leave" title="Verlassen">${ICONS.hangup}</button>`;
}

function bindVoiceButtons(root) {
  root.querySelectorAll('[data-voice]').forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation();
      if (b.dataset.voice === 'mute') toggleMute();
      if (b.dataset.voice === 'deafen') toggleDeafen();
      if (b.dataset.voice === 'leave') leaveVoice();
    };
  });
}

function renderVoiceBar() {
  const bar = $('#voice-bar');
  if (!vc.channelId) {
    bar.classList.add('hidden');
    bar.innerHTML = '';
    return;
  }
  const hub = state.hubs.get(vc.hubId);
  const channel = hub?.channels.find((c) => c.id === vc.channelId);
  bar.classList.remove('hidden');
  bar.innerHTML = `
    <div class="vb-info" title="Zum Sprachkanal">
      <span class="vb-status"><i></i>Sprachverbindung</span>
      <span class="vb-where">${esc(channel?.name || '')} · ${esc(hub?.name || '')}</span>
    </div>
    <div class="vb-actions">${voiceButtons()}</div>`;
  bar.querySelector('.vb-info').onclick = () => vc.hubId && openHub(vc.hubId, vc.channelId);
  bindVoiceButtons(bar);
}

function renderStage() {
  const box = $('#messages');
  const channel = currentChannel();
  if (!channel) return;
  const members = state.voiceStates.get(channel.id) || [];
  const inHere = vc.channelId === channel.id;
  box.innerHTML = '';
  const stage = h(`<div class="stage">
    <div class="stage-grid ${members.length ? '' : 'empty'}"></div>
    <div class="stage-controls"></div>
  </div>`);
  const grid = stage.querySelector('.stage-grid');
  if (!members.length) {
    grid.append(h(`<div class="stage-empty"><div class="hash-huge">${ICONS.speaker}</div><h2>${esc(channel.name)}</h2><p>Noch niemand da. Sei die erste Person!</p></div>`));
  }
  for (const m of members) {
    const u = userOf(m.userId);
    const tile = h(`<div class="stage-tile ${state.speaking.has(m.userId) ? 'speaking' : ''}" data-voice-user="${esc(m.userId)}" style="--c:${esc(u.color)}">
      <div class="tile-ring">${avatar(u, { size: 84 })}</div>
      <div class="tile-name">${esc(u.displayName)}${verified(u)}</div>
      <div class="tile-flags">${m.deafened ? ICONS.headphonesOff : m.muted ? ICONS.micOff : ''}</div>
    </div>`);
    tile.querySelector('.avatar').onclick = (e) => showProfile(m.userId, e.currentTarget);
    grid.append(tile);
  }
  const controls = stage.querySelector('.stage-controls');
  if (inHere) {
    controls.innerHTML = voiceButtons(true);
    bindVoiceButtons(controls);
  } else {
    const full = members.length >= 10;
    controls.innerHTML = `<button class="btn primary stage-join" ${full || vc.joining ? 'disabled' : ''}>${ICONS.speaker} ${vc.joining ? 'Verbinde…' : full ? 'Kanal ist voll' : vc.channelId ? 'Hierher wechseln' : 'Beitreten'}</button>`;
    controls.querySelector('.stage-join').onclick = () => joinVoice(channel.id);
  }
  box.append(stage);
}

function renderVoiceUi() {
  renderVoiceBar();
  if (state.view.type === 'hub') renderSidebar();
  if (isVoiceChannel(state.view.channelId)) {
    renderStage();
    renderChatHeader();
  }
}

/* ---------- version & changelog ---------- */

const versionReady = fetch('/api/version', { cache: 'no-store' })
  .then((r) => r.json())
  .then((d) => {
    state.version = d.version;
    state.changelog = d.changelog;
    $$('[data-version]').forEach((el) => {
      el.textContent = d.version;
      el.hidden = false;
    });
  })
  .catch(() => {});

const dateOnlyFmt = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

function openChangelog() {
  if (!state.changelog) return;
  store('seenVersion', state.version);
  const entries = state.changelog.map((e, i) => `<section class="cl-entry">
    <div class="cl-head"><span class="cl-version ${i === 0 ? 'current' : ''}">${esc(e.version)}</span><span class="cl-date">${esc(dateOnlyFmt.format(new Date(e.date + 'T12:00:00')))}</span></div>
    <h4>${esc(e.title)}</h4>
    <ul>${e.changes.map((c) => `<li><span class="cl-ico">${esc(c.icon)}</span><span>${formatMessage(c.text)}</span></li>`).join('')}</ul>
  </section>`).join('');
  openModal(`
    <div class="cl-hero"><div class="logo-mark"><span>N</span></div><div><h3>Was ist neu?</h3><p class="sub">Du nutzt Nexora <b>${esc(state.version)}</b></p></div></div>
    <div class="cl-list">${entries}</div>
    <div class="modal-actions"><button class="btn primary" data-close>Los geht's</button></div>`, { className: 'changelog' });
}

// Runs after every (re)connect. A different server version means a new patch was
// deployed while this tab was open: reload to get it, unless the user is typing.
async function checkVersion(serverVersion) {
  await versionReady;
  if (!state.version) return;
  if (serverVersion && serverVersion !== state.version) {
    if (!input.value.trim() && !$('.modal') && !state.editingId) return location.reload();
    if ($('.update-banner')) return;
    const banner = h(`<div class="update-banner"><span>🔥 <b>${esc(serverVersion)}</b> ist da!</span><button class="btn primary">Jetzt laden</button></div>`);
    banner.querySelector('button').onclick = () => location.reload();
    document.body.append(banner);
    return;
  }
  if (store('seenVersion') !== state.version && !$('.modal')) openChangelog();
}

/* =========================================================================
   Global wiring
   ========================================================================= */

$('#home-btn').onclick = openHome;
$('#create-hub-btn').onclick = openCreateHub;
$('#join-hub-btn').onclick = openJoinHub;
$('#palette-btn').onclick = openPalette;
$('#version-btn').onclick = openChangelog;
$('#auth-version').onclick = openChangelog;
$('#toggle-members').onclick = () => {
  if (window.matchMedia('(max-width: 1100px)').matches) {
    $('#app').classList.toggle('show-members');
    state.showMembers = true;
  } else {
    state.showMembers = !state.showMembers;
    store('showMembers', state.showMembers);
  }
  renderChatHeader();
};
$('#open-sidebar').onclick = () => $('#app').classList.add('drawer-open');
$('#scrim').onclick = () => $('#app').classList.remove('drawer-open', 'show-members');

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (state.me) openPalette();
  } else if (e.key === 'Escape') {
    closePopover();
  }
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.view.channelId) {
    state.unread.delete(state.view.channelId);
    renderRail();
  }
});

// Boot
state.showMembers = store('showMembers') ?? true;
const savedToken = store('token');
if (savedToken) start(savedToken);
else showAuth();
