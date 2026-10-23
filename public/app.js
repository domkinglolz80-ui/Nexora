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
  switch: '<svg viewBox="0 0 24 24"><path d="M16 3l4 4-4 4M20 7H8M8 21l-4-4 4-4M4 17h12"/></svg>',
  logout: '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  speaker: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4M8 22h8"/></svg>',
  micOff: '<svg viewBox="0 0 24 24"><path d="m2 2 20 20M9 9v2a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 11v-1m14 0v1a7 7 0 0 1-.11 1.23M12 18v4M8 22h8"/></svg>',
  headphones: '<svg viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
  headphonesOff: '<svg viewBox="0 0 24 24"><path d="m2 2 20 20M3 18v-6a9 9 0 0 1 2.64-6.36M8.4 3.6A9 9 0 0 1 21 12v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
  file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  poll: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
  arrowDown: '<svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
  bot: '<svg viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4M9 4h6M9 13h.01M15 13h.01M9 17h6"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24"><path d="M3 11v2a1 1 0 0 0 1 1h3l6 5V5L7 10H4a1 1 0 0 0-1 1zM17 8a5 5 0 0 1 0 8"/></svg>',
  hangup: '<svg viewBox="0 0 24 24"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><path d="m22 2-20 20"/></svg>',
};

const EMOJIS = ('🎃 👻 🦇 🕷️ 🕸️ 💀 ☠️ 🧛 🧟 🧙 🍬 🍭 🔮 🕯️ 🌕 ⚰️ ' +
  '🔥 ⚡ 🚀 💯 ❤️ 🧡 💛 👍 👎 👏 🙌 🤝 🙏 💪 👀 🎉 ' +
  '😀 😂 🤣 😊 😍 🥰 😎 🤩 🥳 😏 😅 😭 😡 🤯 😱 🤔 ' +
  '🫡 🙃 😴 🤤 🤡 👽 🤖 😈 🎮 🎧 🎵 🍕 🍔 🌮 ' +
  '☕ 🍿 🐱 🐶 🦊 🐼 🦄 🌈 ☀️ 🌙 ⭐ ✨ 💎 🏆 ✅ ❌').split(' ');
const HUB_ICONS = ['', '🎃', '👻', '🦇', '💀', '🔥', '⚡', '🚀', '🎮', '🎧', '🎨', '💻', '📚', '⚽', '🍕', '🌙', '🦊', '👾', '💎', '🏆'];
const QUICK_REACTIONS = ['🎃', '👻', '😂'];
const ACCENTS = ['#ff7a18', '#ff9f1c', '#ff5e3a', '#ffb347', '#ff6b00', '#f9a03f', '#ff8c42', '#e85d04', '#ffd166', '#ef476f', '#9b5de5', '#7bdc3a', '#c1121f'];

// Animated avatar accessories (Halloween Edition 2026). The server only stores the id.
const ACCESSORIES = [
  { id: '', name: t('Keins') },
  {
    id: 'kuerbis', name: t('Lachender Kürbis'),
    svg: `<svg viewBox="0 0 40 40"><path class="stem" d="M20 10c0-3 1-5 4-6"/><path class="leaf" d="M21 8c3-3 7-2 8 0-3 2-6 2-8 0z"/>
      <ellipse class="lobe" cx="13" cy="23" rx="9" ry="12"/><ellipse class="lobe" cx="27" cy="23" rx="9" ry="12"/><ellipse class="body" cx="20" cy="23" rx="10" ry="13"/>
      <path class="face" d="m10 19 5-5 2 6zM30 19l-5-5-2 6z"/><g class="jaw"><path class="face" d="M9 25c4 7 18 7 22 0l-3 1-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2z"/></g></svg>
      <b class="ha">HA</b><b class="ha ha2">HA</b>`,
  },
  {
    id: 'hexenhut', name: t('Hexenhut'),
    svg: '<svg viewBox="0 0 40 32"><path class="hat" d="M22 2c-6 2-9 10-12 22h20C27 17 25 11 30 8c-3 0-6-3-8-6z"/><ellipse class="brim" cx="20" cy="25" rx="19" ry="5"/><path class="band" d="M10.5 22h19l.6-3H11.3z"/><rect class="buckle" x="17" y="18.6" width="6" height="4" rx="1"/></svg>',
  },
  {
    id: 'geist', name: t('Kleiner Geist'),
    svg: '<svg viewBox="0 0 30 34"><path class="ghost" d="M15 2C7 2 3 8 3 15v17l4-3 4 3 4-3 4 3 4-3 4 3V15c0-7-4-13-12-13z"/><ellipse class="eye" cx="11" cy="14" rx="2" ry="3"/><ellipse class="eye" cx="19" cy="14" rx="2" ry="3"/><ellipse class="eye" cx="15" cy="22" rx="2.5" ry="2"/></svg>',
  },
  {
    id: 'fledermaus', name: t('Fledermaus'),
    svg: '<svg viewBox="0 0 48 24"><path class="wing l" d="M24 12C19 4 9 2 1 6c4 1 5 4 5 7 3-2 6-1 7 2 2-2 6-2 8 0z"/><path class="wing r" d="M24 12c5-8 15-10 23-6-4 1-5 4-5 7-3-2-6-1-7 2-2-2-6-2-8 0z"/><ellipse class="bat" cx="24" cy="13" rx="4" ry="5"/><path class="bat" d="m21 9-1-4 3 3m4 1 1-4-3 3"/><circle class="eye" cx="22.5" cy="12" r=".9"/><circle class="eye" cx="25.5" cy="12" r=".9"/></svg>',
  },
  {
    id: 'hoerner', name: t('Teufelshörner'),
    svg: '<svg viewBox="0 0 48 20"><path class="horn" d="M8 20C3 14 2 7 5 1c1 6 5 10 11 13z"/><path class="horn" d="M40 20c5-6 6-13 3-19-1 6-5 10-11 13z"/></svg>',
  },
  {
    id: 'spinne', name: t('Spinne'),
    svg: '<svg viewBox="0 0 24 40"><path class="thread" d="M12 0v24"/><g class="spider"><path class="legs" d="M9 27 3 23 1 26M9 29l-7 1-1 3M9 31l-6 4v3M15 27l6-4 2 3M15 29l7 1 1 3M15 31l6 4v3"/><ellipse class="abdomen" cx="12" cy="31" rx="5" ry="6"/><circle class="abdomen" cx="12" cy="25" r="3"/><circle class="eye" cx="11" cy="25" r=".8"/><circle class="eye" cx="13" cy="25" r=".8"/></g></svg>',
  },
  {
    id: 'katze', name: t('Katzenohren'),
    svg: '<svg viewBox="0 0 48 20"><g class="ear l"><path class="fur" d="M2 20 6 1l13 13z"/><path class="pink" d="m6 16 2-10 6 7z"/></g><g class="ear r"><path class="fur" d="m46 20-4-19-13 13z"/><path class="pink" d="m42 16-2-10-6 7z"/></g></svg>',
  },
  // Exclusive: the server only lets these accounts wear them.
  {
    id: 'kuerbiskoenig', name: t('Kürbiskönig'), badge: t('👑 Kürbiskönig'), allowed: (u) => !u.bot && u.username?.toLowerCase() === 'nexora',
    svg: `<span class="ring"></span><span class="ember e1"></span><span class="ember e2"></span><span class="ember e3"></span>
      <svg class="crown" viewBox="0 0 44 26"><path class="gold" d="M4 18 8 4l8 9 6-12 6 12 8-9 4 14z"/><rect class="gold" x="4" y="16.5" width="36" height="8" rx="2"/>
      <circle class="gem" cx="8" cy="4" r="2.2"/><circle class="gem" cx="36" cy="4" r="2.2"/><circle class="gem g2" cx="22" cy="1.8" r="2"/>
      <circle class="gem g2" cx="11" cy="20.5" r="1.8"/><circle class="gem" cx="33" cy="20.5" r="1.8"/>
      <ellipse class="pump" cx="22" cy="20.6" rx="4.6" ry="3.4"/><path class="pump-face" d="m19.6 19.6 1.2-1.2.4 1.4zm4.8 0-1.2-1.2-.4 1.4zM19.3 21.4c1.5 1.6 3.9 1.6 5.4 0z"/><path class="pump-stem" d="M22 17.4v-1.4"/></svg>`,
    scene: `<svg viewBox="0 0 300 84" preserveAspectRatio="xMidYMid slice"><circle class="moon" cx="244" cy="26" r="15"/>
      <path class="hill" d="M0 68q60-20 120-6t120-4 60 6v20H0z"/>
      <g class="lantern-pumpkin" transform="translate(58 58)"><ellipse rx="8" ry="6.5"/><path class="lit" d="m-4-2 2-2 1 3zm8 0-2-2-1 3zM-4 2c2 3 6 3 8 0z"/></g>
      <g class="lantern-pumpkin p2" transform="translate(150 62) scale(.8)"><ellipse rx="8" ry="6.5"/><path class="lit" d="m-4-2 2-2 1 3zm8 0-2-2-1 3zM-4 2c2 3 6 3 8 0z"/></g>
      <g class="lantern-pumpkin p3" transform="translate(206 57) scale(1.15)"><ellipse rx="8" ry="6.5"/><path class="lit" d="m-4-2 2-2 1 3zm8 0-2-2-1 3zM-4 2c2 3 6 3 8 0z"/></g>
      <path class="scene-bat b1" d="M0 4C-3 0-8-1-11 1c2 0 3 2 3 3 1-1 3 0 3 1 1-1 3-1 5 0 2-1 4-1 5 0 0-1 2-2 3-1 0-1 1-3 3-3C8-1 3 0 0 4z"/>
      <path class="scene-bat b2" d="M0 4C-3 0-8-1-11 1c2 0 3 2 3 3 1-1 3 0 3 1 1-1 3-1 5 0 2-1 4-1 5 0 0-1 2-2 3-1 0-1 1-3 3-3C8-1 3 0 0 4z"/></svg>`,
  },
  {
    id: 'irrlicht', name: t('Irrlicht-Wächter'), badge: t('🏮 Irrlicht-Wächter'), allowed: (u) => Boolean(u.system),
    svg: `<span class="ring"></span><span class="wisp w1"></span><span class="wisp w2"></span><span class="wisp w3"></span>
      <svg class="lantern" viewBox="0 0 24 40"><path class="chain" d="M12 0v7"/><path class="iron" d="M7 10h10l-2-3H9z"/><rect class="glass" x="7" y="10" width="10" height="16" rx="1.5"/>
      <path class="flame" d="M12 13c3 4 3 8 0 10-3-2-3-6 0-10z"/><path class="iron" d="M6 26h12v3H6z"/></svg>`,
    scene: `<svg viewBox="0 0 300 84" preserveAspectRatio="xMidYMid slice"><circle class="moon" cx="56" cy="24" r="13"/>
      <path class="tree" d="M250 84V46l-8-10m8 4 7-9m-7 17-12-4m12-2 10-3"/>
      <path class="hill" d="M0 72q70-14 150-6t150-2v20H0z"/>
      <path class="stone" d="M150 72V58a7 7 0 0 1 14 0v14zM186 74V62a6 6 0 0 1 12 0v12zM118 74V63h4v-4h3v4h4v11z"/>
      <ellipse class="fog f1" cx="90" cy="76" rx="90" ry="9"/><ellipse class="fog f2" cx="220" cy="78" rx="100" ry="8"/>
      <circle class="scene-wisp s1" cx="100" cy="44" r="3"/><circle class="scene-wisp s2" cx="200" cy="38" r="2.4"/><circle class="scene-wisp s3" cx="160" cy="30" r="2"/></svg>`,
  },
];

function exclusiveOf(user) {
  const acc = user && user.accessory && ACCESSORIES.find((a) => a.id === user.accessory);
  return acc && acc.allowed ? acc : null;
}

// Extra class for names, cards and profiles of someone wearing an exclusive accessory.
function exClass(user) {
  const ex = exclusiveOf(user);
  return ex ? ` ex-${ex.id}` : '';
}

function accessoryHtml(id) {
  const acc = id && ACCESSORIES.find((a) => a.id === id);
  return acc ? `<span class="acc acc-${acc.id}" aria-hidden="true">${acc.svg}</span>` : '';
}

// Ghost hunt ranks (Halloween Edition 2026): the number of ghosts needed for each title.
const GHOST_RANKS = [
  { at: 1, name: t('Geisterlehrling') },
  { at: 5, name: t('Spukjäger:in') },
  { at: 13, name: t('Geisterjäger:in') },
  { at: 31, name: t('Kürbismeister:in') },
  { at: 66, name: t('Legende der Nacht') },
];

function ghostRank(n) {
  return [...GHOST_RANKS].reverse().find((r) => n >= r.at) || null;
}

function ghostBadge(user) {
  const n = user.ghosts || 0;
  if (!n || user.bot) return '';
  return `<div class="ghost-badge">👻 ${plural(n, 'Geist gefangen', 'Geister gefangen')} · ${esc(ghostRank(n).name)}</div>`;
}

// The ghost hunt card in the settings: count, title and the next goal.
function ghostStats(user) {
  const n = user.ghosts || 0;
  const rank = ghostRank(n);
  const next = GHOST_RANKS.find((r) => r.at > n);
  return `<div class="ghost-stats"><span class="gs-ico">👻</span><div>
    <b>${n ? plural(n, 'Geist gefangen', 'Geister gefangen') : t('Noch kein Geist gefangen')}</b>${rank ? ` · ${esc(rank.name)}` : ''}
    <small>${next ? t('Noch {n} bis „{rank}“', { n: next.at - n, rank: next.name }) : t('Höchster Rang erreicht – unheimlich gut!')}</small></div></div>`;
}

// The presence dot. Online, away and do-not-disturb are animated so a live profile never looks frozen.
function statusDot(status) {
  return `<span class="dot ${esc(status)}" title="${esc(STATUS_LABEL[status] || '')}"></span>`;
}

// A row of live previews (the user's own avatar wearing each accessory). Returns a getter.
function accessoryPicker(container, user) {
  let value = user.accessory || '';
  container.innerHTML = ACCESSORIES.filter((a) => !a.allowed || a.allowed(user)).map((a) => `<button type="button" class="acc-opt ${a.id === value ? 'sel' : ''}${a.allowed ? ' exclusive' : ''}" data-a="${a.id}" title="${esc(a.name)}">
    ${a.allowed ? `<i class="ex-tag">${t('Exklusiv')}</i>` : ''}${avatar({ ...user, accessory: a.id }, { size: 40 })}<span>${esc(a.name)}</span></button>`).join('');
  container.addEventListener('click', (e) => {
    const opt = e.target.closest('.acc-opt');
    if (!opt) return;
    value = opt.dataset.a;
    container.querySelectorAll('.acc-opt').forEach((x) => x.classList.toggle('sel', x === opt));
  });
  return () => value;
}
const MAX_FILE = 8 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;
const MAX_POLL_OPTIONS = 10;
const MAX_MESSAGE = 2000;

// The Nexora owner (@nexora) has every limit doubled; the server checks it again.
function myLimit(base) {
  return state.me?.owner ? base * 2 : base;
}
const STATUS_LABEL = { online: t('Online'), idle: t('Abwesend'), dnd: t('Nicht stören'), invisible: t('Unsichtbar'), offline: t('Offline') };

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
  uploads: [], // attachments waiting in the composer
  drafts: {}, // channelId -> unsent text
  missed: 0, // new messages that arrived while scrolled up
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
    if (!socket || !socket.connected) return reject(new Error(t('Keine Verbindung zum Server.')));
    socket.timeout(10000).emit(event, payload, (err, res) => {
      if (err) return reject(new Error(t('Zeitüberschreitung. Versuch es nochmal.')));
      if (res && res.error) return reject(new Error(tServer(res.error)));
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
  toast(t('In die Zwischenablage kopiert'));
}

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/);
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).slice(0, 2);
}

function userOf(id) {
  return state.users.get(id) || { id, username: t('unbekannt'), displayName: t('Unbekannt'), color: '#6b5a4e', bio: '' };
}

function statusOf(id) {
  return state.presence.get(id) || 'offline';
}

function isAdmin(hub, userId) {
  return hub.ownerId === userId || Boolean(hub.admins?.includes(userId));
}

function verified(user) {
  const check = user.official ? `<span class="verified" title="${user.bot ? t('Offizieller Nexora-Bot') : t('Offizieller Nexora-Account')}">✓</span>` : '';
  if (user.bot) return `${check}<span class="bot-tag" title="Bot">BOT</span>`;
  return user.owner ? `${check}<span class="founder-tag" title="${t('Gründer von Nexora')}">👑 ${t('GRÜNDER')}</span>` : check;
}

function avatar(user, { dot = false, size } = {}) {
  const s = size ? `--size:${size}px;` : '';
  const d = dot ? statusDot(statusOf(user.id)) : '';
  const acc = accessoryHtml(user.accessory);
  return `<div class="avatar${acc ? ' has-acc' : ''}${size && size < 30 ? ' tiny' : ''}" style="--c:${esc(user.color)};${s}" data-user="${esc(user.id)}">${esc(initials(user.displayName))}${acc}${d}</div>`;
}

const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fullFmt = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' });
const dateFmt = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' });

function sameDay(a, b) {
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

function dayLabel(ts) {
  const now = Date.now();
  if (sameDay(ts, now)) return t('Heute');
  if (sameDay(ts, now - 86400000)) return t('Gestern');
  return dayFmt.format(ts);
}

function stamp(ts) {
  const now = Date.now();
  if (sameDay(ts, now)) return t('Heute um {time}', { time: timeFmt.format(ts) });
  if (sameDay(ts, now - 86400000)) return t('Gestern um {time}', { time: timeFmt.format(ts) });
  return fullFmt.format(ts);
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${decimal((bytes / 1024).toFixed(bytes < 10240 ? 1 : 0))} KB`;
  return `${decimal((bytes / 1024 / 1024).toFixed(1))} MB`;
}

// One line describing a message, also when it has no text (poll, files).
function previewText(m) {
  if (m.content) return m.content;
  if (m.poll) return `📊 ${m.poll.question}`;
  if (m.attachments?.length) return `📎 ${m.attachments.map((a) => a.name).join(', ')}`;
  return '';
}

function fileUrl(a) {
  return `/files/${encodeURIComponent(a.id)}/${encodeURIComponent(a.name)}`;
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
    .replace(/\|\|(.+?)\|\|/g, `<span class="spoiler" title="${t('Spoiler anzeigen')}">$1</span>`)
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

function showAuth({ adding = false } = {}) {
  $('#app').classList.add('hidden');
  $('#auth').classList.remove('hidden');
  $('#auth').classList.toggle('adding', adding);
  $('#splash').classList.add('out');
  setAuthMode(adding || store('lastUser') || savedAccounts().length ? 'login' : 'register');
  if (adding) $('#auth-form [name=username]').value = '';
  renderAuthAccounts();
}

/* ---------- several accounts on one device ---------- */

// Every account signed in on this device keeps its own session token, so switching
// needs no password. The active one is stored under "token" as before.
const MAX_ACCOUNTS = 5;

function savedAccounts() {
  const list = store('accounts');
  return Array.isArray(list) ? list.filter((a) => a && typeof a.token === 'string' && a.username) : [];
}

function rememberAccount(token, user) {
  const list = savedAccounts();
  const entry = { token, id: user.id, username: user.username, displayName: user.displayName, color: user.color, accessory: user.accessory || '' };
  const at = list.findIndex((a) => a.token === token || a.id === user.id);
  if (at === -1) list.push(entry);
  else {
    // Signed in again with an account that was already here: the older session is not needed anymore.
    if (list[at].token !== token) signOutToken(list[at].token);
    list[at] = entry;
  }
  store('accounts', list);
}

function forgetAccount(token) {
  store('accounts', savedAccounts().filter((a) => a.token !== token));
}

// Drafts and the last opened channels belong to one account, not to the device.
const ACCOUNT_KEYS = ['drafts', 'lastChannel', 'view'];
function accountStore(key, value) {
  return store(`${key}:${state.me.id}`, value);
}

// Before V0.1.6.5 these were stored once per device; they now go to the account that was signed in.
function adoptDeviceKeys() {
  for (const key of ACCOUNT_KEYS) {
    const old = store(key);
    if (old == null) continue;
    if (accountStore(key) == null) accountStore(key, old);
    store(key, null);
  }
}

function signOutToken(token) {
  // keepalive: the request still goes out when the page reloads right after.
  fetch('/api/logout', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).catch(() => {});
}

// A fresh page load makes sure nothing of the previous account stays around (chats, voice, drafts).
function switchAccount(token) {
  store('token', token);
  if (socket) socket.disconnect();
  socket = null;
  location.replace('/');
}

function addAccount() {
  closePopover();
  closeAllModals();
  if (savedAccounts().length >= MAX_ACCOUNTS) return toast(t('Maximal {n} Accounts pro Gerät.', { n: MAX_ACCOUNTS }), 'error');
  showAuth({ adding: true });
}

// Accounts that are still signed in, as quick buttons on the login screen.
function renderAuthAccounts() {
  const box = $('#auth-accounts');
  const list = savedAccounts().filter((a) => a.token !== state.token);
  box.classList.toggle('hidden', !list.length);
  if (!list.length) return (box.innerHTML = '');
  box.innerHTML = `<div class="section-label"><span>${t('Angemeldet auf diesem Gerät')}</span></div>`;
  for (const a of list) {
    const row = h(`<button type="button" class="account-row">${avatar(a)}<div class="info"><div class="name">${esc(a.displayName)}</div><div class="handle">@${esc(a.username)}</div></div>${ICONS.switch}</button>`);
    row.onclick = () => switchAccount(a.token);
    box.append(row);
  }
}

function openAccountSwitcher(anchor) {
  closePopover();
  const list = savedAccounts();
  const pop = h(`<div class="popover account-pop">
    <div class="section-label"><span>${t('Accounts')}</span></div>
    <div class="account-list"></div>
    <button type="button" class="btn block" data-act="add">${ICONS.plus} ${t('Account hinzufügen')}</button>
  </div>`);
  const box = pop.querySelector('.account-list');
  for (const a of list) {
    const active = a.token === state.token;
    const row = h(`<div class="account-row${active ? ' active' : ''}">${avatar(a)}<div class="info"><div class="name">${esc(a.displayName)}</div><div class="handle">@${esc(a.username)}${active ? ` · ${t('aktiv')}` : ''}</div></div>
      ${active ? ICONS.check : `<button type="button" class="icon-btn" data-act="forget" title="${t('Auf diesem Gerät abmelden')}">${ICONS.x}</button>`}</div>`);
    if (!active) {
      row.onclick = () => switchAccount(a.token);
      row.querySelector('[data-act=forget]').onclick = (e) => {
        e.stopPropagation();
        forgetAccount(a.token);
        signOutToken(a.token);
        row.remove();
        toast(t('@{name} wurde auf diesem Gerät abgemeldet.', { name: a.username }));
      };
    }
    box.append(row);
  }
  pop.querySelector('[data-act=add]').onclick = addAccount;
  placePopover(pop, anchor);
}

$('#auth-back').addEventListener('click', () => {
  $('#auth').classList.add('hidden');
  $('#auth').classList.remove('adding');
  $('#app').classList.remove('hidden');
});

function setAuthMode(mode) {
  const auth = $('#auth');
  auth.dataset.mode = mode;
  $$('.auth-tab').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  $('#auth-submit').textContent = mode === 'login' ? t("Los geht's") : t('Account erstellen');
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
  if (body.username.length < 3) return (err.textContent = t('Benutzername braucht mindestens 3 Zeichen.'));
  if (body.password.length < 6) return (err.textContent = t('Passwort braucht mindestens 6 Zeichen.'));

  const btn = $('#auth-submit');
  btn.disabled = true;
  err.textContent = '';
  try {
    const res = await fetch(`/api/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, lang: LANG }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ? tServer(data.error) : t('Etwas ist schiefgelaufen.'));
    store('lastUser', data.user.username);
    rememberAccount(data.token, data.user);
    form.password.value = '';
    // While another account is still connected, the new one starts with a fresh page.
    if (socket) switchAccount(data.token);
    else {
      store('token', data.token);
      start(data.token);
    }
  } catch (ex) {
    err.textContent = ex.message;
  } finally {
    btn.disabled = false;
  }
});

// Signs out the active account; another account on this device takes over if there is one.
async function logout() {
  const token = state.token;
  forgetAccount(token);
  signOutToken(token);
  const next = savedAccounts()[0];
  if (next) return switchAccount(next.token);
  store('token', null);
  if (socket) socket.disconnect();
  socket = null;
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
      forgetAccount(token);
      store('token', null);
      socket.disconnect();
      socket = null;
      showAuth();
    }
  });

  // Banned, signed out or password reset by an admin: back to the login screen.
  let endedMessage = '';
  socket.on('account:ended', ({ message }) => (endedMessage = tServer(message)));

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      banner?.remove();
      banner = null;
      forgetAccount(token);
      store('token', null);
      state.token = null;
      socket = null;
      cleanupVoice();
      closeAllModals();
      showAuth();
      $('#auth-error').textContent = endedMessage || t('Du wurdest abgemeldet.');
      return;
    }
    if (!banner && socket) {
      banner = h(`<div class="conn-banner">${t('Verbindung verloren – verbinde neu…')}</div>`);
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
      if (hub) toast(t('Du bist nicht mehr in „{name}“', { name: hub.name }), 'error');
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
      rememberAccount(state.token, user);
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
      $$(`.msg-reply[data-ref="${msg.id}"] span`).forEach((s) => (s.textContent = previewText(msg)));
    }
  });

  socket.on('message:remove', ({ channelId, messageId }) => {
    const ch = state.channels.get(channelId);
    if (!ch) return;
    ch.list = ch.list.filter((m) => m.id !== messageId);
    if (state.replyTo?.id === messageId) setReply(null);
    if (channelId === state.view.channelId) rerenderMessages();
  });

  socket.on('announcement', (a) => {
    state.announcement = a;
    renderAnnouncement();
  });

  socket.on('owner:broadcast', showBroadcast);

  socket.on('voice:state', onVoiceState);
  socket.on('voice:signal', (msg) => handleSignal(msg).catch((err) => console.warn('[voice] signal', err)));
  socket.on('voice:peer-left', ({ socketId }) => closePeer(socketId));
  socket.on('voice:kicked', ({ reason }) => {
    cleanupVoice();
    if (reason === 'elsewhere') toast(t('Du bist jetzt auf einem anderen Gerät im Sprachkanal.'));
    else if (reason === 'deleted') toast(t('Der Sprachkanal wurde gelöscht.'), 'error');
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
  rememberAccount(state.token, data.me);
  adoptDeviceKeys();
  state.drafts = accountStore('drafts') || {};
  state.hubs = new Map(data.hubs.map((x) => [x.id, x]));
  state.dms = new Map(data.dms.map((x) => [x.id, x]));
  state.users = new Map(Object.entries(data.users));
  state.presence = new Map(Object.entries(data.presence));
  state.voiceStates = new Map(Object.entries(data.voice || {}));
  state.announcement = data.announcement || null;
  // After a reconnect the cache may be stale — drop it and refetch lazily.
  state.channels.clear();
  state.lastChannel = accountStore('lastChannel') || {};

  $('#auth').classList.add('hidden');
  $('#app').classList.remove('hidden');
  $('#splash').classList.add('out');
  renderMe();
  renderAnnouncement();
  checkVersion(data.version);
  document.dispatchEvent(new CustomEvent('nexora:ready'));

  const params = new URLSearchParams(location.search);
  const invite = params.get('invite');
  if (invite) {
    history.replaceState(null, '', '/');
    joinHub(invite);
    return;
  }

  const last = accountStore('view');
  if (last?.type === 'hub' && state.hubs.has(last.hubId)) openHub(last.hubId, last.channelId);
  else if (last?.type === 'home' && last.channelId && state.dms.has(last.channelId)) openDm(last.channelId);
  else if (state.hubs.size) openHub(state.hubs.keys().next().value);
  else openHome();
}

/* =========================================================================
   Navigation
   ========================================================================= */

function setView(view) {
  if (view.channelId !== state.view.channelId) clearUploads();
  state.view = view;
  state.replyTo = null;
  state.editingId = null;
  state.missed = 0;
  accountStore('view', view);
  input.value = state.drafts[view.channelId] || '';
  autosize(input);
  updateComposerState();
  hideSlash();
  if (view.type === 'hub' && view.channelId) {
    state.lastChannel[view.hubId] = view.channelId;
    accountStore('lastChannel', state.lastChannel);
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

function openChannel(channelId) {
  if (state.dms.has(channelId)) return openDm(channelId);
  for (const hub of state.hubs.values()) {
    if (hub.channels.some((c) => c.id === channelId)) return openHub(hub.id, channelId);
  }
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
        <button class="icon-btn" data-act="settings" title="${t('Hub-Einstellungen')}">${ICONS.gear}</button>
      </div>
      <div class="hub-sub">
        <button class="chip" data-act="invite" title="${t('Einladen')}">${ICONS.invite} ${esc(hub.inviteCode)}</button>
        <span>${plural(hub.members.length, 'Mitglied', 'Mitglieder')}</span>
      </div>`;
    head.querySelector('[data-act=settings]').onclick = () => openHubSettings(hub.id);
    head.querySelector('[data-act=invite]').onclick = () => openInvite(hub.id);

    body.innerHTML = `<div class="section-label"><span>${t('Textkanäle')}</span>${isOwner ? `<button class="icon-btn" data-act="add" title="${t('Kanal erstellen')}">${ICONS.plus}</button>` : ''}</div>`;
    body.querySelector('[data-act=add]')?.addEventListener('click', () => openChannelEditor(hub.id));
    for (const c of hub.channels.filter((x) => x.kind !== 'voice')) {
      const u = state.unread.get(c.id);
      const active = c.id === state.view.channelId;
      const item = h(`<button class="nav-item ${active ? 'active' : ''} ${u ? 'unread' : ''}">
        <span class="hash">#</span><span class="label">${esc(c.name)}</span>
        ${u?.mention ? `<span class="badge">${u.count}</span>` : ''}
        ${isOwner ? `<span class="row-actions"><span class="icon-btn" data-act="edit" title="${t('Kanal bearbeiten')}">${ICONS.gear}</span></span>` : ''}
      </button>`);
      item.addEventListener('click', (e) => {
        if (e.target.closest('[data-act=edit]')) return openChannelEditor(hub.id, c.id);
        openHub(hub.id, c.id);
      });
      body.append(item);
    }

    const voiceChannels = hub.channels.filter((x) => x.kind === 'voice');
    if (voiceChannels.length || isOwner) {
      const label = h(`<div class="section-label"><span>${t('Sprachkanäle')}</span>${isOwner ? `<button class="icon-btn" title="${t('Sprachkanal erstellen')}">${ICONS.plus}</button>` : ''}</div>`);
      label.querySelector('.icon-btn')?.addEventListener('click', () => openChannelEditor(hub.id, null, 'voice'));
      body.append(label);
    }
    for (const c of voiceChannels) {
      const members = state.voiceStates.get(c.id) || [];
      const active = c.id === state.view.channelId;
      const item = h(`<button class="nav-item voice-item ${active ? 'active' : ''} ${vc.channelId === c.id ? 'connected' : ''}">
        <span class="hash">${ICONS.speaker}</span><span class="label">${esc(c.name)}</span>
        ${members.length ? `<span class="voice-count">${members.length}</span>` : ''}
        ${isOwner ? `<span class="row-actions"><span class="icon-btn" data-act="edit" title="${t('Kanal bearbeiten')}">${ICONS.gear}</span></span>` : ''}
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
            ${m.deafened ? `<span class="vs-icon" title="${t('Stumm geschaltet (Ton aus)')}">${ICONS.headphonesOff}</span>` : m.muted ? `<span class="vs-icon" title="${t('Mikrofon aus')}">${ICONS.micOff}</span>` : ''}
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
      <button class="search-pill" style="width:100%" data-act="find">${ICONS.search}<span>${t('Unterhaltung finden')}</span></button>`;
    head.querySelector('[data-act=find]').onclick = openPalette;

    body.innerHTML = `<div class="section-label"><span>${t('Direktnachrichten')}</span><button class="icon-btn" data-act="new" title="${t('Neue Nachricht')}">${ICONS.plus}</button></div>`;
    body.querySelector('[data-act=new]').onclick = openNewDm;
    const dms = sortedDms();
    if (!dms.length) {
      body.append(h(`<div class="empty-hint">${t('Noch keine Unterhaltungen.<br>Klick auf ein Mitglied oder auf <b>+</b>, um loszulegen.')}</div>`));
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
  input.maxLength = myLimit(MAX_MESSAGE);
  const card = $('#me-card');
  card.innerHTML = `
    ${avatar(me, { dot: true })}
    <div class="who${exClass(me)}"><div class="name">${esc(me.displayName)}${verified(me)}</div><div class="handle">${esc(STATUS_LABEL[me.status] || '')} · @${esc(me.username)}</div></div>
    <button class="icon-btn" data-act="accounts" title="${t('Account wechseln')}">${ICONS.switch}</button>
    <button class="icon-btn" data-act="bots" title="${t('Meine Bots')}">${ICONS.bot}</button>
    <button class="icon-btn" data-act="settings" title="${t('Einstellungen')}">${ICONS.gear}</button>`;
  card.querySelector('[data-act=accounts]').onclick = (e) => openAccountSwitcher(e.currentTarget);
  card.querySelector('[data-act=bots]').onclick = () => openBotManager();
  card.querySelector('[data-act=settings]').onclick = openSettings;
  $('#admin-btn').classList.toggle('hidden', !me.official);
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
    title.innerHTML = `<div class="hash-big voice">${ICONS.speaker}</div><h1>${esc(channel.name)}</h1><div class="topic">${n ? t('{n} im Kanal', { n }) : t('Sprachkanal')}</div>`;
  } else if (channel) {
    title.innerHTML = `<div class="hash-big">#</div><h1>${esc(channel.name)}</h1>${channel.topic ? `<div class="topic">${esc(channel.topic)}</div>` : ''}`;
    composer.placeholder = t('Nachricht an #{name}', { name: channel.name });
  } else if (dm) {
    const p = dmPartner(dm);
    title.innerHTML = `${avatar(p, { dot: true })}<h1>${esc(p.displayName)}${verified(p)}</h1><div class="topic">@${esc(p.username)}</div>`;
    title.querySelector('.avatar').onclick = (e) => showProfile(p.id, e.currentTarget);
    composer.placeholder = t('Nachricht an @{name}', { name: p.displayName });
  } else {
    title.innerHTML = `<div class="hash-big">✦</div><h1>${t('Zentrale')}</h1>`;
    composer.placeholder = t('Wähle eine Unterhaltung');
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
        <div class="meta">${t('Dabei seit {date}', { date: dateFmt.format(p.createdAt) })}</div>
      </div>`;
    return;
  }
  if (!hub) { panel.innerHTML = ''; return; }

  const everyone = hub.members.map(userOf);
  const members = everyone.filter((m) => !m.bot);
  const botList = everyone.filter((m) => m.bot).sort((a, b) => a.displayName.localeCompare(b.displayName));
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
      const sub = m.system ? t('Offizieller Bot') : m.bot ? (m.disabled ? t('Gesperrt') : plural(m.commands?.length || 0, 'Befehl', 'Befehle')) : m.bio || STATUS_LABEL[st];
      const row = h(`<button class="member ${st === 'offline' ? 'offline' : ''}" style="--c:${esc(m.color)}">
        ${avatar(m, { dot: true })}
        <div class="info"><div class="name">${esc(m.displayName)}${verified(m)}${m.id === hub.ownerId ? `<span class="crown" title="${t('Besitzer')}">👑</span>` : ''}</div>
        <div class="bio">${esc(sub)}</div></div>
      </button>`);
      row.onclick = () => showProfile(m.id, row);
      panel.append(row);
    }
  };
  section(t('Online'), onlineList);
  section(t('Offline'), offlineList);
  section(t('Bots'), botList);
}

function renderTyping() {
  const box = $('#typing');
  const map = state.typing.get(state.view.channelId);
  const names = map ? [...map.keys()].map((id) => userOf(id).displayName) : [];
  if (!names.length) { box.innerHTML = ''; return; }
  let text;
  if (names.length === 1) text = t('<b>{name}</b> schreibt', { name: esc(names[0]) });
  else if (names.length <= 3) text = t('<b>{names}</b> schreiben', { names: names.map(esc).join(', ') });
  else text = t('Mehrere Leute schreiben');
  box.innerHTML = `<span class="typing-dots"><i></i><i></i><i></i></span><span>${text}…</span>`;
}

// A message from the Nexora team on top of the chat, until it is dismissed.
function renderAnnouncement() {
  $('#announce-bar')?.remove();
  const a = state.announcement;
  if (!a || store('dismissedAnnouncement') === a.id) return;
  const bar = h(`<div class="announce-bar" id="announce-bar">${ICONS.megaphone}
    <div class="announce-text"><b>Nexora</b><span>${formatMessage(a.text)}</span></div>
    <button class="icon-btn" title="${t('Ausblenden')}">${ICONS.x}</button></div>`);
  bar.querySelector('button').onclick = () => {
    store('dismissedAnnouncement', a.id);
    bar.remove();
  };
  $('#chat').prepend(bar);
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
      <h2>${t('Willkommen, {name}!', { name: esc(state.me.displayName) })}</h2>
      <p>${hasDms ? t('Wähle links eine Unterhaltung aus.') : t('Starte eine Direktnachricht mit <b>+</b> oder klick auf ein Mitglied in einem Hub.')}</p>
      <p style="margin-top:14px"><button class="btn primary" data-act="new">${ICONS.chat} ${t('Neue Nachricht')}</button>
      <button class="btn" data-act="hub" style="margin-left:6px">${ICONS.plus} ${t('Hub erstellen')}</button></p>
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
      <h2>${t('Willkommen in #{name}', { name: esc(channel.name) })}</h2>
      <p>${channel.topic ? esc(channel.topic) : t('Das ist der Anfang dieses Kanals.')}</p></div>`);
  }
  const p = dmPartner(dm);
  const node = h(`<div class="channel-intro">${avatar(p, { size: 72 })}
    <h2 style="margin-top:16px">${esc(p.displayName)}${verified(p)}</h2>
    <p>${t('Das ist der Anfang deiner Unterhaltung mit <b>@{name}</b>.', { name: esc(p.username) })}</p></div>`);
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
    const more = h(`<button class="btn load-more">${t('Ältere Nachrichten laden')}</button>`);
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
  updateJumpBtn();
}

function isContinuation(m, prev) {
  return prev && prev.authorId === m.authorId && !m.replyTo && !m.interaction && !m.ephemeral && !prev.ephemeral &&
    m.createdAt - prev.createdAt < 7 * 60 * 1000 && sameDay(prev.createdAt, m.createdAt);
}

function attachmentsHtml(m) {
  if (!m.attachments?.length) return '';
  const items = m.attachments.map((a) => {
    if (a.image) {
      // Reserve the final size up front so loading images do not make the chat jump.
      let style = '';
      if (a.width && a.height) {
        const scale = Math.min(1, 400 / a.width, 300 / a.height);
        style = `width:${Math.max(1, Math.round(a.width * scale))}px;aspect-ratio:${a.width}/${a.height}`;
      }
      return `<a class="att-image" href="${fileUrl(a)}" target="_blank" rel="noopener" data-name="${esc(a.name)}"><img src="${fileUrl(a)}" alt="${esc(a.name)}" style="${style}" /></a>`;
    }
    return `<a class="att-file" href="${fileUrl(a)}?download" download="${esc(a.name)}" title="${esc(t('{name} herunterladen', { name: a.name }))}">
      <span class="att-ico">${ICONS.file}</span>
      <span class="att-meta"><span class="att-name">${esc(a.name)}</span><span class="att-size">${formatSize(a.size)}</span></span>
      <span class="att-dl">${ICONS.download}</span></a>`;
  });
  return `<div class="attachments">${items.join('')}</div>`;
}

function pollHtml(m, canClose) {
  const p = m.poll;
  if (!p) return '';
  const voters = new Set(p.options.flatMap((o) => o.votes));
  const top = Math.max(...p.options.map((o) => o.votes.length));
  const options = p.options.map((o) => {
    const mine = o.votes.includes(state.me.id);
    const pct = voters.size ? Math.round((o.votes.length / voters.size) * 100) : 0;
    const win = p.closed && top > 0 && o.votes.length === top;
    const names = o.votes.map((id) => userOf(id).displayName).join(', ');
    return `<button class="poll-opt ${mine ? 'mine' : ''} ${win ? 'win' : ''}" data-act="vote" data-option="${esc(o.id)}" ${p.closed ? 'disabled' : ''} title="${esc(names || t('Noch keine Stimmen'))}">
      <span class="poll-bar" style="width:${pct}%"></span>
      <span class="poll-check">${mine ? ICONS.check : ''}</span>
      <span class="poll-text">${esc(o.text)}</span>
      <span class="poll-pct">${o.votes.length} · ${pct}%</span>
    </button>`;
  }).join('');
  return `<div class="poll ${p.closed ? 'closed' : ''}">
    <div class="poll-head">${ICONS.poll}<span>${p.closed ? t('Umfrage beendet') : p.multi ? t('Umfrage · Mehrfachauswahl') : t('Umfrage · eine Antwort')}</span></div>
    <div class="poll-q">${esc(p.question)}</div>
    <div class="poll-opts">${options}</div>
    <div class="poll-foot"><span>${plural(voters.size, 'Stimme', 'Stimmen')}</span>
      ${canClose && !p.closed ? `<button class="poll-close" data-act="close-poll">${t('Umfrage beenden')}</button>` : ''}</div>
  </div>`;
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

  const edited = m.editedAt ? `<span class="edited" title="${esc(fullFmt.format(m.editedAt))}">${t('(bearbeitet)')}</span>` : '';
  const used = m.interaction ? `<div class="msg-interaction">${t('<b>{name}</b> hat <code>/{command}</code> benutzt', { name: esc(userOf(m.interaction.userId).displayName), command: esc(m.interaction.command) })}</div>` : '';
  if (m.ephemeral) {
    return h(`<div class="msg first ephemeral" data-id="${esc(m.id)}">
      ${avatar(author)}
      <div class="msg-main">
        ${used}
        <div class="msg-head"><span class="msg-author${exClass(author)}" style="--c:${esc(author.color)}">${esc(author.displayName)}</span>${verified(author)}<span class="msg-time">${esc(stamp(m.createdAt))}</span></div>
        <div class="msg-body">${formatMessage(m.content)}</div>
        <div class="ephemeral-note">${t('Nur für dich sichtbar')} · <button data-act="dismiss">${t('Ausblenden')}</button></div>
      </div>
    </div>`);
  }
  const node = h(`<div class="msg ${cont ? '' : 'first'} ${mentionsMe(m.content) ? 'mention' : ''}" data-id="${esc(m.id)}">
    ${cont ? `<div class="gutter-time" title="${esc(stamp(m.createdAt))}">${timeFmt.format(m.createdAt)}</div>` : avatar(author)}
    <div class="msg-main">
      ${used}
      ${m.replyTo ? `<div class="msg-reply" data-ref="${esc(m.replyTo)}">${ref ? `<b>${esc(userOf(ref.authorId).displayName)}</b><span>${esc(previewText(ref))}</span>` : `<span><i>${t('Ursprüngliche Nachricht nicht geladen oder gelöscht')}</i></span>`}</div>` : ''}
      ${cont ? '' : `<div class="msg-head"><span class="msg-author${exClass(author)}" style="--c:${esc(author.color)}">${esc(author.displayName)}</span>${verified(author)}${hub && hub.ownerId === author.id ? '<span class="owner-tag">OWNER</span>' : ''}<span class="msg-time" title="${esc(fullFmt.format(m.createdAt))}">${esc(stamp(m.createdAt))}</span></div>`}
      ${m.content ? `<div class="msg-body ${isJumbo(m.content) ? 'jumbo' : ''}">${formatMessage(m.content)}${edited}</div>` : ''}
      ${pollHtml(m, canDelete)}
      ${attachmentsHtml(m)}
      ${!m.content && edited ? `<div class="msg-body">${edited}</div>` : ''}
      ${reactions ? `<div class="reactions">${reactions}</div>` : ''}
    </div>
    <div class="msg-tools">
      ${QUICK_REACTIONS.map((e) => `<button class="icon-btn quick" data-act="react" data-emoji="${e}" title="${t('Mit {emoji} reagieren', { emoji: e })}">${e}</button>`).join('')}
      <button class="icon-btn" data-act="pick" title="${t('Reaktion hinzufügen')}">${ICONS.smile}</button>
      <button class="icon-btn" data-act="reply" title="${t('Antworten')}">${ICONS.reply}</button>
      ${m.content ? `<button class="icon-btn" data-act="copy" title="${t('Text kopieren')}">${ICONS.copy}</button>` : ''}
      ${mine && m.content ? `<button class="icon-btn" data-act="edit" title="${t('Bearbeiten')}">${ICONS.edit}</button>` : ''}
      ${canDelete ? `<button class="icon-btn danger" data-act="delete" title="${t('Löschen')}">${ICONS.trash}</button>` : ''}
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

  const imageEl = e.target.closest('.att-image');
  if (imageEl && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    return openLightbox(imageEl.getAttribute('href'), imageEl.dataset.name);
  }

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
    case 'copy': return copyText(findMsg(id)?.content || '');
    case 'edit': return startEdit(id);
    case 'delete': return deleteMessage(id);
    case 'vote': return votePoll(id, act.dataset.option);
    case 'close-poll': return closePoll(id);
    case 'dismiss': return dismissEphemeral(id);
  }
});

$('#messages').addEventListener('scroll', () => {
  const box = $('#messages');
  const ch = state.channels.get(state.view.channelId);
  if (box.scrollTop < 60 && ch && ch.hasMore && !ch.loading) loadChannel(state.view.channelId, true);
  updateJumpBtn();
});

function updateJumpBtn() {
  const box = $('#messages');
  const btn = $('#jump-btn');
  const far = box.scrollHeight - box.scrollTop - box.clientHeight > 300;
  if (!far) state.missed = 0;
  btn.classList.toggle('hidden', !far || !state.channels.has(state.view.channelId));
  btn.classList.toggle('has-new', state.missed > 0);
  btn.innerHTML = state.missed
    ? `${state.missed > 99 ? t('99+ neue Nachrichten') : plural(state.missed, 'neue Nachricht', 'neue Nachrichten')} ${ICONS.arrowDown}`
    : `${t('Zum Neuesten')} ${ICONS.arrowDown}`;
}

$('#jump-btn').addEventListener('click', () => {
  const box = $('#messages');
  box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
});

function findMsg(id) {
  return state.channels.get(state.view.channelId)?.list.find((m) => m.id === id);
}

function jumpTo(id) {
  const node = $(`.msg[data-id="${id}"]`);
  if (!node) return toast(t('Nachricht ist nicht geladen.'), 'error');
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
    if (!prev || !sameDay(prev.createdAt, msg.createdAt)) box.append(h(`<div class="day-divider">${esc(dayLabel(msg.createdAt))}</div>`));
    const node = messageNode(msg, prev);
    node.classList.add('new');
    box.append(node);
    document.dispatchEvent(new CustomEvent('nexora:message', { detail: msg }));
    if (atBottom || mine) box.scrollTop = box.scrollHeight;
    else state.missed += 1;
    updateJumpBtn();
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
    // "Nicht stören" keeps the badges but stays silent.
    if (mention && state.me.status !== 'dnd') {
      ping();
      notify(msg);
    }
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

function notify(msg) {
  if (!store('notify') || !document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const author = userOf(msg.authorId);
    const where = state.dms.has(msg.channelId) ? '' : ` · ${channelLabel(msg.channelId)}`;
    const text = previewText(msg);
    const n = new Notification(`${author.displayName}${where}`, {
      body: text.length > 140 ? text.slice(0, 139) + '…' : text,
      tag: msg.channelId,
    });
    n.onclick = () => {
      window.focus();
      openChannel(msg.channelId);
      n.close();
    };
  } catch {
    /* notifications not available (e.g. some mobile browsers) */
  }
}

async function votePoll(messageId, optionId) {
  try {
    await req('poll:vote', { channelId: state.view.channelId, messageId, optionId });
  } catch (ex) {
    toast(ex.message, 'error');
  }
}

async function closePoll(messageId) {
  const channelId = state.view.channelId;
  if (!(await confirmDialog(t('Umfrage beenden?'), t('Danach kann niemand mehr abstimmen. Das Ergebnis bleibt sichtbar.'), t('Beenden')))) return;
  try {
    await req('poll:close', { channelId, messageId });
  } catch (ex) {
    toast(ex.message, 'error');
  }
}

async function deleteMessage(id) {
  const msg = findMsg(id);
  if (!msg) return;
  const text = previewText(msg);
  const ok = await confirmDialog(t('Nachricht löschen?'), t('„{text}“ wird für alle entfernt.', { text: text.slice(0, 120) + (text.length > 120 ? '…' : '') }), t('Löschen'));
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
  const box = h(`<div class="edit-box"><textarea rows="1" maxlength="${myLimit(MAX_MESSAGE)}"></textarea>
    <small>${t('Esc zum <b data-act="cancel">Abbrechen</b> · Enter zum <b data-act="save">Speichern</b>')}</small></div>`);
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
    if (!text && !msg.attachments?.length) return deleteMessage(id).then(finish);
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
  bar.innerHTML = `${t('Antwort an <b>{name}</b>', { name: esc(userOf(msg.authorId).displayName) })}<button class="icon-btn x" title="${t('Abbrechen')}">${ICONS.x}</button>`;
  bar.querySelector('.x').onclick = () => setReply(null);
}

function saveDraft() {
  const channelId = state.view.channelId;
  if (!channelId) return;
  if (input.value.trim()) state.drafts[channelId] = input.value;
  else delete state.drafts[channelId];
  accountStore('drafts', state.drafts);
}

// Send button and character counter follow the text and the pending uploads.
function updateComposerState() {
  const uploading = state.uploads.some((u) => !u.attachment && !u.error);
  const ready = state.uploads.some((u) => u.attachment);
  $('#send-btn').disabled = uploading || (!input.value.trim() && !ready);
  const left = myLimit(MAX_MESSAGE) - input.value.length;
  const counter = $('#char-count');
  counter.textContent = left <= 200 ? String(left) : '';
  counter.classList.toggle('low', left <= 50);
}

input.addEventListener('input', () => {
  autosize(input);
  updateComposerState();
  saveDraft();
  renderSlash();
  const now = Date.now();
  if (input.value.trim() && now - lastTypingSent > 2500 && state.view.channelId) {
    lastTypingSent = now;
    req('typing', { channelId: state.view.channelId }).catch(() => {});
  }
});

input.addEventListener('keydown', (e) => {
  if (slash.items.length && !e.isComposing) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = slash.items.length;
      slash.sel = (slash.sel + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
      return renderSlash(false);
    }
    if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault();
      return chooseSlash(slash.items[slash.sel], e.key === 'Enter');
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      return hideSlash();
    }
  }
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    sendMessage();
  } else if (e.key === 'Escape' && state.replyTo) {
    setReply(null);
  } else if (e.key === 'ArrowUp' && !input.value) {
    const ch = state.channels.get(state.view.channelId);
    const last = ch && [...ch.list].reverse().find((m) => m.authorId === state.me.id && m.content);
    if (last) { e.preventDefault(); startEdit(last.id); }
  }
});

input.addEventListener('paste', (e) => {
  const files = [...(e.clipboardData?.files || [])];
  if (!files.length) return;
  e.preventDefault();
  addFiles(files);
});

$('#composer').addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage();
});

async function sendMessage() {
  const text = input.value.trim();
  const channelId = state.view.channelId;
  if (!channelId) return;
  if (state.uploads.some((u) => !u.attachment && !u.error)) return toast(t('Warte kurz, die Dateien werden noch hochgeladen.'));
  const sent = state.uploads.filter((u) => u.attachment);
  if (!text && !sent.length) return;
  const match = !sent.length && matchCommand(text);
  if (match) return runCommand(channelId, match.command, match.text, text);
  const replyTo = state.replyTo?.id;
  input.value = '';
  autosize(input);
  saveDraft();
  $('#send-btn').disabled = true;
  setReply(null);
  lastTypingSent = 0;
  try {
    await req('message:send', { channelId, content: text, replyTo, attachments: sent.map((u) => u.attachment.id) });
    if (state.view.channelId === channelId) sent.forEach(removeUpload);
  } catch (ex) {
    toast(ex.message, 'error');
    if (!input.value && state.view.channelId === channelId) { input.value = text; autosize(input); saveDraft(); }
  }
  updateComposerState();
}

/* ---------- slash commands ---------- */

const slash = { items: [], sel: 0, botId: null, hideTimer: null };

// Commands of all bots in the current hub, plus the Nexora Helper for official accounts (also in DMs).
// Commands marked ownerOnly (inviting the helper) are only listed for @nexora.
function availableCommands() {
  if (!state.view.channelId || isVoiceChannel(state.view.channelId)) return [];
  const hub = currentHub();
  const bots = hub ? hub.members.map((m) => state.users.get(m)).filter((u) => u?.bot && !u.disabled && !u.system) : [];
  if (state.me?.official) bots.push(...[...state.users.values()].filter((u) => u.system));
  const out = [];
  for (const u of bots) {
    for (const c of u.commands || []) if (!c.ownerOnly || state.me?.owner) out.push({ ...c, bot: u });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name) || a.bot.displayName.localeCompare(b.bot.displayName));
}

function commandUsage(c) {
  return [`/${c.name}`, ...c.options.map((o) => (o.required ? `<${o.name}>` : `[${o.name}]`))].join(' ');
}

// The command a "/name …" text refers to; the bot picked in the list wins when two share a name.
function matchCommand(text) {
  const m = /^\/(\S+)(?:\s+([\s\S]*))?$/.exec(text);
  if (!m) return null;
  const name = m[1].toLowerCase();
  const list = availableCommands().filter((c) => c.name === name);
  const command = list.find((c) => c.bot.id === slash.botId) || list[0];
  return command ? { command, text: (m[2] || '').trim() } : null;
}

function hideSlash() {
  slash.items = [];
  $('#slash-pop').classList.add('hidden');
}

function renderSlash(resetSelection = true) {
  const pop = $('#slash-pop');
  const value = input.value;
  if (resetSelection) slash.sel = 0;
  slash.items = [];
  if (!value.startsWith('/') || !state.view.channelId) return hideSlash();
  const all = availableCommands();

  if (/^\/\S*$/.test(value)) {
    const term = value.slice(1).toLowerCase();
    slash.items = all.filter((c) => c.name.startsWith(term)).concat(all.filter((c) => !c.name.startsWith(term) && c.name.includes(term))).slice(0, 8);
    slash.sel = Math.min(slash.sel, Math.max(0, slash.items.length - 1));
    if (!slash.items.length) {
      pop.innerHTML = `<div class="slash-empty">${all.length ? t('Kein passender Befehl.') : currentHub() ? t('In diesem Hub gibt es noch keine Bots. Erstelle einen unter {icon} <b>Meine Bots</b>.', { icon: ICONS.bot }) : t('Slash-Befehle gibt es nur in Hubs.')}</div>`;
      pop.classList.remove('hidden');
      return;
    }
    pop.innerHTML = `<div class="slash-head">${t('Befehle')}</div>${slash.items.map((c, i) => `<button type="button" class="slash-item ${i === slash.sel ? 'sel' : ''}" data-i="${i}">
      ${avatar(c.bot, { size: 26 })}
      <span class="slash-main"><span class="slash-name">${esc(commandUsage(c))}</span><span class="slash-desc">${esc(c.description ? tServer(c.description) : t('Keine Beschreibung'))}</span></span>
      <span class="slash-bot">${esc(c.bot.displayName)}</span>
    </button>`).join('')}`;
    pop.classList.remove('hidden');
    pop.querySelector('.slash-item.sel')?.scrollIntoView({ block: 'nearest' });
    return;
  }

  // While typing the options: show which one comes next.
  const match = matchCommand(value);
  if (!match || !match.command.options.length) return hideSlash();
  const { command } = match;
  const words = match.text ? match.text.split(/\s+/).length : 0;
  const current = Math.min(command.options.length - 1, /\s$/.test(value) ? words : Math.max(0, words - 1));
  const opt = command.options[current];
  pop.innerHTML = `<div class="slash-hint"><code>/${esc(command.name)}</code> ${command.options.map((o, i) => `<span class="slash-opt ${i === current ? 'sel' : ''}">${o.required ? '&lt;' : '['}${esc(o.name)}${o.required ? '&gt;' : ']'}</span>`).join(' ')}
    ${opt.description ? `<div class="slash-desc">${esc(opt.name)}: ${esc(tServer(opt.description))}${opt.required ? '' : ` ${t('(optional)')}`}</div>` : ''}</div>`;
  pop.classList.remove('hidden');
}

function chooseSlash(c, viaEnter = false) {
  slash.botId = c.bot.id;
  // A command without required options runs straight away on Enter.
  if (viaEnter && input.value.trim().toLowerCase() === `/${c.name}` && !c.options.some((o) => o.required)) {
    hideSlash();
    return sendMessage();
  }
  input.value = `/${c.name} `;
  autosize(input);
  updateComposerState();
  saveDraft();
  renderSlash();
  input.focus();
}

$('#slash-pop').addEventListener('mousedown', (e) => e.preventDefault());
$('#slash-pop').addEventListener('click', (e) => {
  const item = e.target.closest('.slash-item');
  if (item) chooseSlash(slash.items[Number(item.dataset.i)]);
});
input.addEventListener('blur', () => {
  clearTimeout(slash.hideTimer);
  slash.hideTimer = setTimeout(hideSlash, 150);
});
input.addEventListener('focus', () => {
  clearTimeout(slash.hideTimer);
  if (input.value.startsWith('/')) renderSlash();
});

async function runCommand(channelId, command, args, raw) {
  input.value = '';
  autosize(input);
  saveDraft();
  hideSlash();
  setReply(null);
  slash.botId = null;
  $('#send-btn').disabled = true;
  try {
    const res = await req('command:run', { channelId, botId: command.bot.id, name: command.name, text: args });
    for (const text of res.ephemeral || []) addEphemeral(channelId, res.botId, res.command || command.name, tServer(text));
  } catch (ex) {
    toast(ex.message, 'error');
    if (!input.value && state.view.channelId === channelId) { input.value = raw; autosize(input); saveDraft(); }
  }
  updateComposerState();
}

// Answers only the invoking person sees; they live in this tab until reloaded.
function addEphemeral(channelId, botId, command, content) {
  if (!state.channels.has(channelId)) return;
  onMessageNew({
    id: `eph-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    channelId,
    authorId: botId,
    content,
    createdAt: Date.now(),
    reactions: {},
    ephemeral: true,
    interaction: { userId: state.me.id, command },
  });
}

function dismissEphemeral(messageId) {
  const ch = state.channels.get(state.view.channelId);
  if (ch) ch.list = ch.list.filter((m) => m.id !== messageId);
  $(`.msg[data-id="${messageId}"]`)?.remove();
}

/* ---------- attachments ---------- */

function addFiles(files) {
  const channelId = state.view.channelId;
  if (!channelId || isVoiceChannel(channelId)) return;
  for (const file of files) {
    if (state.uploads.length >= myLimit(MAX_ATTACHMENTS)) {
      toast(t('Maximal {n} Dateien pro Nachricht.', { n: myLimit(MAX_ATTACHMENTS) }), 'error');
      break;
    }
    if (file.size > myLimit(MAX_FILE)) {
      toast(t('„{name}“ ist zu groß (max. {n} MB).', { name: file.name, n: myLimit(MAX_FILE) / 1024 / 1024 }), 'error');
      continue;
    }
    if (!file.size) {
      toast(t('„{name}“ ist leer.', { name: file.name }), 'error');
      continue;
    }
    const up = { file, name: file.name || t('bild.png'), progress: 0, attachment: null, error: null, xhr: null, preview: null };
    if (file.type.startsWith('image/')) up.preview = URL.createObjectURL(file);
    state.uploads.push(up);
    upload(up);
  }
  renderAttachTray();
  updateComposerState();
  input.focus();
}

async function upload(up) {
  let size = '';
  if (up.preview && window.createImageBitmap) {
    try {
      const bmp = await createImageBitmap(up.file);
      size = `&w=${bmp.width}&h=${bmp.height}`;
      bmp.close();
    } catch {
      /* format the browser cannot decode – the server treats it as a normal file */
    }
  }
  if (!state.uploads.includes(up)) return;
  const xhr = new XMLHttpRequest();
  up.xhr = xhr;
  xhr.open('POST', `/api/upload?name=${encodeURIComponent(up.name)}${size}`);
  xhr.setRequestHeader('Authorization', `Bearer ${state.token}`);
  xhr.setRequestHeader('Content-Type', up.file.type || 'application/octet-stream');
  xhr.upload.onprogress = (e) => {
    if (!e.lengthComputable) return;
    up.progress = e.loaded / e.total;
    const bar = $(`.att-chip[data-key="${state.uploads.indexOf(up)}"] .att-progress i`);
    if (bar) bar.style.width = `${Math.round(up.progress * 100)}%`;
  };
  const done = () => {
    up.xhr = null;
    let data = {};
    try { data = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
    if (xhr.status === 200 && data.attachment) up.attachment = data.attachment;
    else up.error = data.error ? tServer(data.error) : t('Upload fehlgeschlagen.');
    if (up.error) toast(`${up.name}: ${up.error}`, 'error');
    renderAttachTray();
    updateComposerState();
  };
  xhr.onload = done;
  xhr.onerror = done;
  xhr.send(up.file);
}

function removeUpload(up) {
  up.xhr?.abort();
  if (up.preview) URL.revokeObjectURL(up.preview);
  state.uploads = state.uploads.filter((u) => u !== up);
  renderAttachTray();
  updateComposerState();
}

function clearUploads() {
  [...state.uploads].forEach(removeUpload);
}

function renderAttachTray() {
  const tray = $('#attach-tray');
  tray.classList.toggle('hidden', !state.uploads.length);
  tray.innerHTML = '';
  state.uploads.forEach((up, i) => {
    const status = up.error ? 'error' : up.attachment ? 'done' : 'busy';
    const chip = h(`<div class="att-chip ${status}" data-key="${i}" title="${esc(up.error || up.name)}">
      ${up.preview ? `<img src="${up.preview}" alt="" />` : `<span class="att-ico">${ICONS.file}</span>`}
      <span class="att-meta"><span class="att-name">${esc(up.name)}</span><span class="att-size">${up.error ? esc(up.error) : formatSize(up.file.size)}</span></span>
      <button type="button" class="icon-btn" title="${t('Entfernen')}">${ICONS.x}</button>
      ${status === 'busy' ? `<span class="att-progress"><i style="width:${Math.round(up.progress * 100)}%"></i></span>` : ''}
    </div>`);
    chip.querySelector('button').onclick = () => removeUpload(up);
    tray.append(chip);
  });
}

$('#attach-btn').addEventListener('click', () => $('#file-input').click());
$('#file-input').addEventListener('change', (e) => {
  addFiles([...e.target.files]);
  e.target.value = '';
});

// Drag & drop files anywhere onto the chat.
let dragDepth = 0;
const chatEl = $('#chat');
const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
const canDrop = () => state.view.channelId && !isVoiceChannel(state.view.channelId);
chatEl.addEventListener('dragenter', (e) => {
  if (!hasFiles(e) || !canDrop()) return;
  e.preventDefault();
  dragDepth += 1;
  chatEl.classList.add('dragging');
});
chatEl.addEventListener('dragover', (e) => {
  if (hasFiles(e) && canDrop()) e.preventDefault();
});
chatEl.addEventListener('dragleave', () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (!dragDepth) chatEl.classList.remove('dragging');
});
chatEl.addEventListener('drop', (e) => {
  dragDepth = 0;
  chatEl.classList.remove('dragging');
  if (!hasFiles(e) || !canDrop()) return;
  e.preventDefault();
  addFiles([...e.dataTransfer.files]);
});

$('#poll-btn').addEventListener('click', openPollCreator);

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
  if (u.bot) return showBotProfile(u, anchor);
  const ex = exclusiveOf(u);
  const pop = h(`<div class="popover${exClass(u)}" style="--c:${esc(u.color)}">
    <div class="profile-banner">${ex ? ex.scene : ''}</div>
    <div class="profile-body">
      ${avatar(u, { dot: true })}
      <h4>${esc(u.displayName)}${verified(u)}</h4>
      <div class="handle">@${esc(u.username)} · ${STATUS_LABEL[st]}</div>
      ${ex ? `<div class="ex-badge">${esc(ex.badge)} · ${t('Exklusiv')}</div>` : ''}
      ${ghostBadge(u)}
      ${u.bio ? `<div class="bio">${esc(u.bio)}</div>` : '<div style="height:12px"></div>'}
      <div class="meta">${t('Dabei seit {date}', { date: u.createdAt ? esc(dateFmt.format(u.createdAt)) : '–' })}</div>
      ${isMe ? `<button class="btn block" data-act="edit">${ICONS.edit} ${t('Profil bearbeiten')}</button>` : `<button class="btn primary block" data-act="dm">${ICONS.chat} ${t('Nachricht senden')}</button>`}
    </div>
  </div>`);
  pop.querySelector('[data-act]').onclick = () => (isMe ? (closePopover(), openSettings()) : openDmWith(u.id));
  placePopover(pop, anchor);
}

function showBotProfile(u, anchor) {
  const commands = (u.commands || []).filter((c) => !c.ownerOnly || state.me.owner).map((c) => `<li><code>/${esc(c.name)}</code><span>${esc(c.description ? tServer(c.description) : '')}</span></li>`).join('');
  const mine = u.ownerId === state.me.id;
  const ex = exclusiveOf(u);
  const pop = h(`<div class="popover${exClass(u)}" style="--c:${esc(u.color)}">
    <div class="profile-banner">${ex ? ex.scene : ''}</div>
    <div class="profile-body">
      ${avatar(u, { dot: true })}
      <h4>${esc(u.displayName)}${verified(u)}</h4>
      <div class="handle">@${esc(u.username)} · ${u.system ? t('Offizieller Bot') : u.disabled ? t('Gesperrt') : 'Bot'}${u.ownerId ? ` · ${t('von {name}', { name: esc(userOf(u.ownerId).displayName) })}` : ''}</div>
      ${ex ? `<div class="ex-badge">${esc(ex.badge)} · ${t('Exklusiv')}</div>` : ''}
      ${u.bio ? `<div class="bio">${esc(u.system ? tServer(u.bio) : u.bio)}</div>` : '<div style="height:12px"></div>'}
      ${u.system && !state.me.official ? '' : commands ? `<div class="field"><span>${t('Befehle')}${u.system ? ` <em>${t('– nur für das Nexora-Team')}</em>` : ''}</span></div><ul class="bot-cmd-list">${commands}</ul>` : `<div class="meta">${t('Noch keine Befehle.')}</div>`}
      ${mine ? `<button class="btn block" data-act="edit">${ICONS.bot} ${t('Bot bearbeiten')}</button>` : ''}
    </div>
  </div>`);
  pop.querySelector('[data-act=edit]')?.addEventListener('click', () => { closePopover(); openBotEditor(u.id); });
  placePopover(pop, anchor);
}

function openEmojiPicker(anchor, onPick, onClose) {
  closePopover();
  const pop = h(`<div class="popover emoji-pop"><div class="section-label"><span>${t('Emojis')}</span></div><div class="emoji-grid">
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

function closeAllModals() {
  // Each modal removes its own key handler when its backdrop is clicked.
  $$('#modal-root .modal-backdrop').forEach((b) => b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
}

function confirmDialog(title, text, confirmLabel = t('Bestätigen')) {
  return new Promise((resolve) => {
    const { modal, close } = openModal(`<h3>${esc(title)}</h3><p class="sub">${esc(text)}</p>
      <div class="modal-actions"><button class="btn" data-close>${t('Abbrechen')}</button><button class="btn danger" data-ok>${esc(confirmLabel)}</button></div>`);
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    modal.querySelector('[data-ok]').onclick = () => { finish(true); close(); };
    const obs = new MutationObserver(() => { if (!modal.isConnected) { finish(false); obs.disconnect(); } });
    obs.observe($('#modal-root'), { childList: true });
    modal.querySelector('[data-ok]').focus();
  });
}

function iconPicker(selected) {
  return `<div class="icon-picker">${HUB_ICONS.map((i) => `<button type="button" data-icon="${i}" class="${i === selected ? 'sel' : ''}" title="${i ? '' : t('Initialen')}">${i || 'Aa'}</button>`).join('')}</div>`;
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
    <h3>${t('Neuen Hub starten')}</h3>
    <p class="sub">${t('Ein Hub ist euer eigener Ort mit Kanälen. Lad Freunde per Code ein.')}</p>
    <form>
      <label class="field"><span>${t('Name')}</span><input name="name" maxlength="40" required placeholder="${t('z. B. Late Night Squad')}" /></label>
      <div class="field"><span>${t('Symbol')}</span></div>
      ${iconPicker('🔥')}
      <p class="form-error"></p>
      <div class="modal-actions"><button type="button" class="btn" data-close>${t('Abbrechen')}</button><button type="submit" class="btn primary">${t('Hub erstellen')}</button></div>
    </form>`);
  const getIcon = bindIconPicker(modal);
  const form = modal.querySelector('form');
  form.onsubmit = (e) => {
    e.preventDefault();
    submitting(form, async () => {
      const { hub } = await req('hub:create', { name: form.name.value, icon: getIcon(), lang: LANG });
      state.hubs.set(hub.id, hub);
      close();
      openHub(hub.id);
      toast(t('„{name}“ ist live!', { name: hub.name }));
    });
  };
}

function openJoinHub() {
  const { modal, close } = openModal(`
    <h3>${t('Hub beitreten')}</h3>
    <p class="sub">${t('Gib einen Einladungscode oder -link ein.')}</p>
    <form>
      <label class="field"><span>${t('Einladung')}</span><input name="code" required placeholder="${t('z. B. NEXORA oder https://…/?invite=ABC123')}" /></label>
      <p class="form-error"></p>
      <div class="modal-actions"><button type="button" class="btn" data-close>${t('Abbrechen')}</button><button type="submit" class="btn primary">${t('Beitreten')}</button></div>
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
    toast(t('Willkommen in „{name}“', { name: hub.name }));
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
    <h3>${t('Leute in {name} einladen', { name: esc(hub.name) })}</h3>
    <p class="sub">${t('Teile den Code oder den Link. Wer ihn hat, kann beitreten.')}</p>
    <div class="invite-box"><code>${esc(hub.inviteCode)}</code><button class="btn primary" data-act="code">${ICONS.copy} ${t('Code')}</button></div>
    <div class="invite-box"><code style="font-size:13px;letter-spacing:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(inviteLink(hub))}</code><button class="btn" data-act="link">${ICONS.copy} ${t('Link')}</button></div>
    <div class="modal-actions"><button class="btn" data-close>${t('Fertig')}</button></div>`);
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
      <p class="sub">${plural(hub.members.length, 'Mitglied', 'Mitglieder')} · ${t('Besitzer: {name}', { name: hub.ownerId ? esc(userOf(hub.ownerId).displayName) : 'Nexora' })}</p>
      <div class="invite-box"><code>${esc(hub.inviteCode)}</code><button class="btn primary" data-act="copy">${ICONS.copy} ${t('Kopieren')}</button></div>
      <div class="modal-actions"><button class="btn danger" data-act="leave">${ICONS.logout} ${t('Hub verlassen')}</button><span class="spacer"></span><button class="btn" data-close>${t('Schließen')}</button></div>`);
    modal.querySelector('[data-act=copy]').onclick = () => copyText(inviteLink(hub));
    modal.querySelector('[data-act=leave]').onclick = async () => {
      close();
      if (!(await confirmDialog(t('Hub verlassen?'), t('Du verlässt „{name}“. Du kannst jederzeit per Einladung zurückkommen.', { name: hub.name }), t('Verlassen')))) return;
      req('hub:leave', { hubId }).catch((ex) => toast(ex.message, 'error'));
    };
    return;
  }

  const { modal, close } = openModal(`
    <h3>${t('Hub-Einstellungen')}</h3>
    <p class="sub">${hub.isLounge ? t('Nur offizielle Accounts sehen diese Optionen.') : t('Nur du als Besitzer siehst diese Optionen.')}</p>
    <form>
      <label class="field"><span>${t('Name')}</span><input name="name" maxlength="40" required /></label>
      <div class="field"><span>${t('Symbol')}</span></div>
      ${iconPicker(hub.icon)}
      <p class="form-error"></p>
      <div class="modal-actions"><button type="submit" class="btn primary">${t('Speichern')}</button></div>
    </form>
    <hr />
    <div class="field"><span>${t('Einladungscode')}</span></div>
    <div class="invite-box"><code data-code>${esc(hub.inviteCode)}</code>
      <button class="btn" data-act="copy" title="${t('Link kopieren')}">${ICONS.copy}</button>
      <button class="btn" data-act="regen">${t('Neu')}</button></div>
    <hr />
    <div class="field"><span>${t('Bots')}</span></div>
    <div class="hub-bots"></div>
    <form class="bot-add-row">
      <input class="input" name="bot" maxlength="32" placeholder="${t('Bot-Name, z. B. wuerfelbot')}" autocomplete="off" />
      <button type="submit" class="btn">${ICONS.plus} ${t('Hinzufügen')}</button>
    </form>
    <div class="my-bot-chips"></div>
    <hr />
    <div class="modal-actions">${hub.isLounge ? '' : `<button class="btn danger" data-act="delete">${ICONS.trash} ${t('Hub löschen')}</button>`}<span class="spacer"></span><button class="btn" data-close>${t('Schließen')}</button></div>`);
  const form = modal.querySelector('form');
  form.name.value = hub.name;
  const getIcon = bindIconPicker(modal);
  form.onsubmit = (e) => {
    e.preventDefault();
    submitting(form, async () => {
      await req('hub:update', { hubId, name: form.name.value, icon: getIcon() });
      toast(t('Gespeichert'));
    });
  };
  modal.querySelector('[data-act=copy]').onclick = () => copyText(inviteLink(state.hubs.get(hubId)));
  modal.querySelector('[data-act=regen]').onclick = async () => {
    try {
      const { inviteCode } = await req('hub:regenerateInvite', { hubId });
      modal.querySelector('[data-code]').textContent = inviteCode;
      toast(t('Neuer Code erstellt – der alte gilt nicht mehr'));
    } catch (ex) {
      toast(ex.message, 'error');
    }
  };
  renderHubBots(modal, hubId);
  const addForm = modal.querySelector('.bot-add-row');
  addForm.onsubmit = async (e) => {
    e.preventDefault();
    const name = addForm.bot.value.trim();
    if (!name) return;
    try {
      await addBotToHub(hubId, name);
      addForm.bot.value = '';
      renderHubBots(modal, hubId);
    } catch (ex) {
      toast(ex.message, 'error');
    }
  };
  const deleteBtn = modal.querySelector('[data-act=delete]');
  if (deleteBtn) deleteBtn.onclick = async () => {
    close();
    if (!(await confirmDialog(t('Hub endgültig löschen?'), t('„{name}“ und alle Nachrichten werden für alle Mitglieder gelöscht. Das kann nicht rückgängig gemacht werden.', { name: hub.name }), t('Endgültig löschen')))) return;
    req('hub:delete', { hubId }).catch((ex) => toast(ex.message, 'error'));
  };
}

async function addBotToHub(hubId, bot) {
  const res = await req('bot:hub:add', { hubId, bot });
  state.users.set(res.bot.id, res.bot);
  state.presence.set(res.bot.id, res.bot.disabled ? 'offline' : 'online');
  const hub = state.hubs.get(hubId);
  if (hub && !hub.members.includes(res.bot.id)) hub.members.push(res.bot.id);
  toast(hub ? t('{bot} ist jetzt in „{hub}“', { bot: res.bot.displayName, hub: hub.name }) : t('{bot} ist jetzt im Hub', { bot: res.bot.displayName }));
}

// The bots of a hub inside its settings, plus one-click chips for the user's own bots.
async function renderHubBots(modal, hubId) {
  const hub = state.hubs.get(hubId);
  const list = modal.querySelector('.hub-bots');
  if (!hub || !list) return;
  const inHub = hub.members.map((m) => state.users.get(m)).filter((u) => u?.bot);
  list.innerHTML = inHub.length ? '' : `<div class="empty-hint" style="padding:4px 0 12px">${t('Noch keine Bots in diesem Hub.')}</div>`;
  for (const u of inHub) {
    const row = h(`<div class="bot-row">${avatar(u, { size: 30 })}<div class="info"><div class="name">${esc(u.displayName)}${verified(u)}</div>
      <div class="bio">@${esc(u.username)} · ${plural(u.commands?.length || 0, 'Befehl', 'Befehle')}</div></div>
      <button class="icon-btn" title="${t('Aus dem Hub entfernen')}">${ICONS.x}</button></div>`);
    row.querySelector('button').onclick = async () => {
      try {
        await req('bot:hub:remove', { hubId, botId: u.id });
        hub.members = hub.members.filter((m) => m !== u.id);
        renderHubBots(modal, hubId);
      } catch (ex) {
        toast(ex.message, 'error');
      }
    };
    list.append(row);
  }
  const chips = modal.querySelector('.my-bot-chips');
  try {
    const { bots } = await req('bot:list');
    const addable = bots.filter((b) => !hub.members.includes(b.id) && !b.disabled);
    chips.innerHTML = addable.length ? `<span class="chips-label">${t('Deine Bots:')}</span>` : '';
    for (const b of addable) {
      const chip = h(`<button type="button" class="chip">${ICONS.plus} ${esc(b.displayName)}</button>`);
      chip.onclick = async () => {
        try {
          await addBotToHub(hubId, b.id);
          renderHubBots(modal, hubId);
        } catch (ex) {
          toast(ex.message, 'error');
        }
      };
      chips.append(chip);
    }
  } catch {
    chips.innerHTML = '';
  }
}

function openChannelEditor(hubId, channelId, initialKind = 'text') {
  const hub = state.hubs.get(hubId);
  const channel = channelId && hub.channels.find((c) => c.id === channelId);
  let kind = channel ? channel.kind || 'text' : initialKind;
  const { modal, close } = openModal(`
    <h3>${channel ? t('Kanal bearbeiten') : t('Kanal erstellen')}</h3>
    <p class="sub">${channel ? t('{channel} in {hub}', { channel: esc(channelLabel(channel.id)), hub: esc(hub.name) }) : t('Neuer Kanal in {hub}', { hub: esc(hub.name) })}</p>
    <form>
      ${channel ? '' : `<div class="field"><span>${t('Art')}</span></div>
      <div class="kind-row">
        <button type="button" class="kind-opt" data-kind="text"><b>#</b><span><strong>${t('Text')}</strong><small>${t('Nachrichten, Emojis, Links')}</small></span></button>
        <button type="button" class="kind-opt" data-kind="voice">${ICONS.speaker}<span><strong>${t('Sprache')}</strong><small>${t('Zusammen reden in Echtzeit')}</small></span></button>
      </div>`}
      <label class="field"><span>${t('Name')}</span><input name="name" maxlength="32" required placeholder="${t('neuer-kanal')}" /></label>
      <label class="field topic-field"><span>${t('Thema')} <em>${t('(optional)')}</em></span><input name="topic" maxlength="120" placeholder="${t("Worum geht's hier?")}" /></label>
      <p class="form-error"></p>
      <div class="modal-actions">
        ${channel ? `<button type="button" class="btn danger" data-act="delete">${ICONS.trash} ${t('Löschen')}</button><span class="spacer"></span>` : ''}
        <button type="button" class="btn" data-close>${t('Abbrechen')}</button>
        <button type="submit" class="btn primary">${channel ? t('Speichern') : t('Erstellen')}</button>
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
    form.name.placeholder = kind === 'voice' ? t('Treffpunkt') : t('neuer-kanal');
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
    const text = channel.kind === 'voice' ? t('{channel} wird gelöscht. Wer gerade drin ist, fliegt raus.', { channel: channelLabel(channel.id) }) : t('#{name} und alle Nachrichten darin werden gelöscht.', { name: channel.name });
    if (!(await confirmDialog(t('Kanal löschen?'), text, t('Löschen')))) return;
    req('channel:delete', { channelId }).catch((ex) => toast(ex.message, 'error'));
  });
}

function openPollCreator() {
  const channelId = state.view.channelId;
  if (!channelId || isVoiceChannel(channelId)) return;
  const { modal, close } = openModal(`
    <h3>${t('Umfrage erstellen')}</h3>
    <p class="sub">${t('Frag deine Crew – alle sehen die Ergebnisse live.')}</p>
    <form>
      <label class="field"><span>${t('Frage')}</span><input name="question" maxlength="200" required placeholder="${t('z. B. Wann zocken wir heute?')}" /></label>
      <div class="field"><span>${t('Antworten')}</span></div>
      <div class="poll-inputs"></div>
      <button type="button" class="btn poll-add" data-act="add">${ICONS.plus} ${t('Antwort hinzufügen')}</button>
      <label class="check-row"><input type="checkbox" name="multi" /><span>${t('Mehrfachauswahl erlauben')}</span></label>
      <p class="form-error"></p>
      <div class="modal-actions"><button type="button" class="btn" data-close>${t('Abbrechen')}</button><button type="submit" class="btn primary">${ICONS.poll} ${t('Umfrage starten')}</button></div>
    </form>`);
  const form = modal.querySelector('form');
  const list = modal.querySelector('.poll-inputs');
  const addBtn = modal.querySelector('[data-act=add]');
  const sync = () => {
    const rows = $$('.poll-input', list);
    rows.forEach((row, i) => {
      row.querySelector('input').placeholder = t('Antwort {n}', { n: i + 1 });
      row.querySelector('button').disabled = rows.length <= 2;
    });
    addBtn.classList.toggle('hidden', rows.length >= myLimit(MAX_POLL_OPTIONS));
  };
  const addRow = (focus = false) => {
    const row = h(`<div class="poll-input"><input maxlength="80" /><button type="button" class="icon-btn" title="${t('Entfernen')}">${ICONS.x}</button></div>`);
    row.querySelector('button').onclick = () => { row.remove(); sync(); };
    // Enter jumps to the next answer (and adds one at the end) instead of submitting.
    row.querySelector('input').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const next = row.nextElementSibling?.querySelector('input');
      if (next) next.focus();
      else if ($$('.poll-input', list).length < myLimit(MAX_POLL_OPTIONS)) addRow(true);
    });
    list.append(row);
    sync();
    if (focus) row.querySelector('input').focus();
  };
  addRow();
  addRow();
  addBtn.onclick = () => addRow(true);
  form.onsubmit = (e) => {
    e.preventDefault();
    submitting(form, async () => {
      const options = $$('.poll-input input', list).map((i) => i.value.trim()).filter(Boolean);
      if (options.length < 2) throw new Error(t('Gib mindestens 2 Antworten ein.'));
      await req('poll:create', { channelId, question: form.question.value, options, multi: form.multi.checked });
      close();
    });
  };
}

function openLightbox(url, name) {
  const { modal } = openModal(`
    <img src="${esc(url)}" alt="${esc(name)}" />
    <div class="lightbox-bar"><span>${esc(name)}</span>
      <a class="btn" href="${esc(url)}?download" download="${esc(name)}">${ICONS.download} ${t('Herunterladen')}</a>
      <button class="btn" data-close>${t('Schließen')}</button></div>`, { className: 'lightbox' });
  modal.querySelector('img').onclick = () => modal.querySelector('[data-close]').click();
}

function openNewDm() {
  const { modal, close } = openModal(`
    <h3>${t('Neue Direktnachricht')}</h3>
    <p class="sub">${t('Suche nach Benutzername oder Anzeigename.')}</p>
    <label class="field"><span>${t('Suchen')}</span><input name="q" placeholder="${t('Name eingeben…')}" autocomplete="off" /></label>
    <div class="result-list"></div>
    <div class="modal-actions"><button class="btn" data-close>${t('Schließen')}</button></div>`);
  const q = modal.querySelector('[name=q]');
  const list = modal.querySelector('.result-list');
  const render = (users) => {
    list.innerHTML = users.length ? '' : `<div class="empty-hint">${t('Niemand gefunden.')}</div>`;
    for (const u of users) {
      const row = h(`<button class="member${exClass(u)}" style="--c:${esc(u.color)}">${avatar(u, { dot: true })}<div class="info"><div class="name">${esc(u.displayName)}${verified(u)}</div><div class="bio">@${esc(u.username)}</div></div></button>`);
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
    <h3>${t('Dein Profil')}</h3>
    <p class="sub">@${esc(me.username)}</p>
    <form>
      <label class="field"><span>${t('Anzeigename')}</span><input name="displayName" maxlength="32" required /></label>
      <label class="field"><span>${t('Über mich')} <em>${t('(optional)')}</em></span><textarea name="bio" maxlength="190" rows="3" placeholder="${t('Erzähl was über dich')}"></textarea></label>
      <div class="field"><span>${t('Akzentfarbe')}</span></div>
      <div class="color-row">${ACCENTS.map((c) => `<button type="button" class="swatch ${c === me.color ? 'sel' : ''}" style="--c:${c}" data-c="${c}"></button>`).join('')}
        <input type="color" value="${esc(me.color)}" title="${t('Eigene Farbe')}" /></div>
      <div class="field"><span>${t('Halloween-Accessoire 🎃')} <em>${t('(alle sehen es)')}</em></span></div>
      <div class="acc-row"></div>
      <div class="field"><span>${t('Status')}</span></div>
      <div class="status-row">${['online', 'idle', 'dnd', 'invisible'].map((s) => `<button type="button" class="status-opt ${s === me.status ? 'sel' : ''}" data-s="${s}">${statusDot(s === 'invisible' ? 'offline' : s)}${STATUS_LABEL[s]}</button>`).join('')}</div>
      <div class="field"><span>${LANG === 'en' ? 'Language · Sprache' : 'Sprache · Language'}</span></div>
      <div class="lang-row">${LANGS.map((l) => `<button type="button" class="status-opt lang-opt ${l.id === LANG ? 'sel' : ''}" data-lang="${l.id}"><span class="flag">${l.flag}</span>${esc(l.name)}</button>`).join('')}</div>
      ${ghostStats(me)}
      <label class="check-row"><input type="checkbox" name="notify" /><span>${t('Desktop-Benachrichtigungen bei Erwähnungen und DMs')} <em>${t('(auf diesem Gerät)')}</em></span></label>
      <label class="check-row"><input type="checkbox" name="spooky" /><span>${t('Gruseleffekte: Fledermäuse, Nebel und Geister zum Fangen 👻')} <em>${t('(auf diesem Gerät)')}</em></span></label>
      <p class="form-error"></p>
      <div class="modal-actions sticky">
        <button type="button" class="btn danger" data-act="logout" title="${t('Abmelden')}">${ICONS.logout}<span class="btn-label">${t('Abmelden')}</span></button><span class="spacer"></span>
        <button type="button" class="btn" data-close>${t('Abbrechen')}</button><button type="submit" class="btn primary">${t('Speichern')}</button>
      </div>
    </form>`);
  const form = modal.querySelector('form');
  form.displayName.value = me.displayName;
  form.bio.value = me.bio || '';
  let color = me.color;
  let status = me.status;
  const accessory = accessoryPicker(modal.querySelector('.acc-row'), me);
  form.spooky.checked = store('spooky') !== false;
  form.spooky.addEventListener('change', () => {
    store('spooky', form.spooky.checked);
    document.body.classList.toggle('calm', !form.spooky.checked);
  });
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
  modal.querySelector('.lang-row').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (b) setLanguage(b.dataset.lang);
  });
  modal.querySelector('[data-act=logout]').onclick = logout;
  const notifyBox = form.notify;
  notifyBox.checked = Boolean(store('notify')) && 'Notification' in window && Notification.permission === 'granted';
  notifyBox.addEventListener('change', async () => {
    if (!notifyBox.checked) return store('notify', false);
    if (!('Notification' in window)) {
      notifyBox.checked = false;
      return toast(t('Dein Browser unterstützt keine Benachrichtigungen.'), 'error');
    }
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    if (permission !== 'granted') {
      notifyBox.checked = false;
      return toast(t('Benachrichtigungen sind im Browser blockiert. Erlaube sie in den Website-Einstellungen.'), 'error');
    }
    store('notify', true);
    toast(t('Benachrichtigungen sind an'));
  });
  form.onsubmit = (e) => {
    e.preventDefault();
    submitting(form, async () => {
      const { user } = await req('profile:update', { displayName: form.displayName.value, bio: form.bio.value, color, status, accessory: accessory() });
      state.me = user;
      state.users.set(user.id, user);
      renderMe();
      close();
      toast(t('Profil gespeichert'));
    });
  };
}

/* ---------- command palette ---------- */

function openPalette() {
  if ($('.palette')) return;
  const { modal, close } = openModal(`
    <div class="palette-input">${ICONS.search}<input placeholder="${t('Wohin willst du? Hubs, Kanäle, Leute…')}" autocomplete="off" /></div>
    <div class="palette-list"></div>
    <div class="palette-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> ${t('auswählen')}</span><span><kbd>Enter</kbd> ${t('öffnen')}</span><span><kbd>Esc</kbd> ${t('schließen')}</span></div>`,
  { className: 'palette', backdropClass: 'palette-backdrop' });
  const q = modal.querySelector('input');
  const list = modal.querySelector('.palette-list');
  let items = [];
  let sel = 0;

  const all = () => {
    const out = [{ label: t('Meine Bots'), kind: t('Bots & Slash-Befehle'), ico: '🤖', go: () => openBotManager() }];
    if (state.me.official) out.push({ label: t('Admin-Panel'), kind: t('Nexora verwalten'), ico: '🛡️', go: () => openAdminPanel() });
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
      out.push({ label: p.displayName, kind: t('Direktnachricht'), user: p, go: () => openDm(dm.id), unread: state.unread.has(dm.id) });
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
    list.innerHTML = items.length ? '' : `<div class="empty-hint">${t('Nichts gefunden.')}</div>`;
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
    return toast(t('Dein Browser unterstützt keine Sprachkanäle (HTTPS nötig).'), 'error');
  }
  vc.joining = true;
  renderVoiceUi();
  try {
    getAudioCtx();
    if (vc.channelId) leaveVoice(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    }).catch(() => {
      throw new Error(t('Kein Mikrofon-Zugriff. Erlaube das Mikrofon in den Browser-Einstellungen.'));
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
      toast(t('Keine Sprachverbindung zu {name} – das Netzwerk blockiert sie.', { name: userOf(peer.userId).displayName }), 'error');
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
    <button class="${cls} ${vc.muted ? 'off' : ''}" data-voice="mute" title="${vc.muted ? t('Mikrofon an') : t('Stumm schalten')}">${vc.muted ? ICONS.micOff : ICONS.mic}</button>
    <button class="${cls} ${vc.deafened ? 'off' : ''}" data-voice="deafen" title="${vc.deafened ? t('Ton an') : t('Ton aus')}">${vc.deafened ? ICONS.headphonesOff : ICONS.headphones}</button>
    <button class="${cls} hangup" data-voice="leave" title="${t('Verlassen')}">${ICONS.hangup}</button>`;
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
    <div class="vb-info" title="${t('Zum Sprachkanal')}">
      <span class="vb-status"><i></i>${t('Sprachverbindung')}</span>
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
    grid.append(h(`<div class="stage-empty"><div class="hash-huge">${ICONS.speaker}</div><h2>${esc(channel.name)}</h2><p>${t('Noch niemand da. Sei die erste Person!')}</p></div>`));
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
    controls.innerHTML = `<button class="btn primary stage-join" ${full || vc.joining ? 'disabled' : ''}>${ICONS.speaker} ${vc.joining ? t('Verbinde…') : full ? t('Kanal ist voll') : vc.channelId ? t('Hierher wechseln') : t('Beitreten')}</button>`;
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

/* ---------- live broadcast from the Nexora owner ---------- */

function showBroadcast({ text, from }) {
  $('.broadcast')?.remove();
  const node = h(`<div class="broadcast" role="alert">
    <div class="broadcast-card">
      <div class="broadcast-head">${avatar(from, { size: 44 })}<div><b>📢 ${t('Durchsage')}</b><span>${esc(from.displayName)}${verified(from)}</span></div></div>
      <div class="broadcast-text">${formatMessage(text)}</div>
      <button type="button" class="btn primary">${t('Verstanden')}</button>
    </div>
  </div>`);
  const close = () => node.remove();
  node.querySelector('button').onclick = close;
  node.addEventListener('click', (e) => e.target === node && close());
  document.body.append(node);
  setTimeout(close, 20000);
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

const dateOnlyFmt = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });

function openChangelog() {
  if (!state.changelog) return;
  store('seenVersion', state.version);
  const entries = state.changelog.map((e, i) => `<section class="cl-entry">
    <div class="cl-head"><span class="cl-version ${i === 0 ? 'current' : ''}">${esc(e.version)}</span><span class="cl-date">${esc(dateOnlyFmt.format(new Date(e.date + 'T12:00:00')))}</span></div>
    <h4>${esc((LANG === 'en' && e.titleEn) || e.title)}</h4>
    <ul>${e.changes.map((c) => `<li><span class="cl-ico">${esc(c.icon)}</span><span>${formatMessage((LANG === 'en' && c.textEn) || c.text)}</span></li>`).join('')}</ul>
  </section>`).join('');
  openModal(`
    <div class="cl-hero"><div class="logo-mark"><span>N</span></div><div><h3>${t('Was ist neu?')}</h3><p class="sub">${t('Du nutzt Nexora <b>{version}</b>', { version: esc(state.version) })}</p></div></div>
    <div class="cl-list">${entries}</div>
    <div class="modal-actions"><button class="btn primary" data-close>${t("Los geht's")}</button></div>`, { className: 'changelog' });
}

// The version of the code running in this tab, written into the page by the server.
const CLIENT_VERSION = $('meta[name="nexora-version"]')?.content || null;

// Runs after every (re)connect and when the tab comes back. A different server version
// means a new patch was deployed: reload to get it, unless the user is typing.
async function checkVersion(serverVersion) {
  await versionReady;
  const running = CLIENT_VERSION || state.version;
  if (!running) return;
  if (serverVersion && serverVersion !== running) {
    if (!input.value.trim() && !state.uploads.length && !$('.modal') && !state.editingId) return location.reload();
    if ($('.update-banner')) return;
    const banner = h(`<div class="update-banner"><span>🎃 ${t('<b>{version}</b> ist da!', { version: esc(serverVersion) })}</span><button class="btn primary">${t('Jetzt laden')}</button></div>`);
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
$('#admin-btn').onclick = () => openAdminPanel();
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

// Sockets on phones can stay asleep through a deploy, so also ask when the tab returns
// and every few minutes.
function pollVersion() {
  if (!state.me || document.hidden) return;
  fetch('/api/version', { cache: 'no-store' })
    .then((r) => r.json())
    .then((d) => checkVersion(d.version))
    .catch(() => {});
}
setInterval(pollVersion, 5 * 60 * 1000);
document.addEventListener('visibilitychange', pollVersion);

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
