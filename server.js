'use strict';

const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.NEXORA_DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PAGE_SIZE = 50;
const MAX_MESSAGE = 2000;
const ACCENTS = ['#ff7a18', '#ff9f1c', '#ff5e3a', '#ffb347', '#ff6b00', '#f9a03f', '#ff8c42', '#e85d04'];

// ---------------------------------------------------------------------------
// Persistence (JSON file, debounced writes)
// ---------------------------------------------------------------------------

function emptyDb() {
  return { users: {}, sessions: {}, hubs: {}, dms: {}, messages: {} };
}

function loadDb() {
  try {
    return { ...emptyDb(), ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('[nexora] Konnte Datenbank nicht lesen:', err.message);
    return emptyDb();
  }
}

const db = loadDb();
let saveTimer = null;

function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(flush, 400);
}

function flush() {
  clearTimeout(saveTimer);
  saveTimer = null;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const id = () => crypto.randomBytes(9).toString('base64url');
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, user) {
  const { hash } = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passHash, 'hex'));
}

function inviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from(crypto.randomBytes(6), (b) => chars[b % chars.length]).join('');
  } while (Object.values(db.hubs).some((h) => h.inviteCode === code));
  return code;
}

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    color: u.color,
    status: u.status,
    bio: u.bio || '',
    createdAt: u.createdAt,
  };
}

function findUserByName(name) {
  const lower = name.toLowerCase();
  return Object.values(db.users).find((u) => u.username.toLowerCase() === lower);
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions[token] = { userId, createdAt: Date.now() };
  save();
  return token;
}

function newChannel(name, topic = '', kind = 'text') {
  return { id: id(), name, topic, kind };
}

function createHub({ name, icon, ownerId, inviteCode: code }) {
  const hub = {
    id: id(),
    name,
    icon: icon || '',
    color: pick(ACCENTS),
    ownerId,
    inviteCode: code || inviteCode(),
    members: ownerId ? [ownerId] : [],
    channels: [
      newChannel('willkommen', 'Sag hallo und stell dich vor 👋'),
      newChannel('allgemein', 'Alles, was gerade los ist'),
      newChannel('medien', 'Links, Clips & Screenshots'),
    ],
    createdAt: Date.now(),
  };
  db.hubs[hub.id] = hub;
  save();
  return hub;
}

// A public lounge everyone joins on sign-up so new users are never alone.
function ensureLounge() {
  let lounge = Object.values(db.hubs).find((h) => h.isLounge);
  if (!lounge) {
    lounge = createHub({ name: 'Nexora Lounge', icon: '🌐', ownerId: null, inviteCode: 'NEXORA' });
    lounge.isLounge = true;
    lounge.channels.push(newChannel('feedback', 'Wünsche & Ideen für Nexora'));
    save();
  }
  return lounge;
}

function hubForChannel(channelId) {
  return Object.values(db.hubs).find((h) => h.channels.some((c) => c.id === channelId));
}

// Returns { type: 'hub', hub } or { type: 'dm', dm } when the user may access the channel.
function channelAccess(userId, channelId) {
  const dm = db.dms[channelId];
  if (dm) return dm.members.includes(userId) ? { type: 'dm', dm } : null;
  const hub = hubForChannel(channelId);
  if (hub && hub.members.includes(userId)) return { type: 'hub', hub };
  return null;
}

function hubView(hub) {
  return {
    id: hub.id,
    name: hub.name,
    icon: hub.icon,
    color: hub.color,
    ownerId: hub.ownerId,
    inviteCode: hub.inviteCode,
    isLounge: !!hub.isLounge,
    members: hub.members,
    channels: hub.channels,
  };
}

function dmView(dm) {
  const msgs = db.messages[dm.id] || [];
  return { id: dm.id, members: dm.members, lastActivity: msgs.length ? msgs[msgs.length - 1].createdAt : dm.createdAt };
}

// Users that `userId` can see: everyone sharing a hub or DM.
function visibleUserIds(userId) {
  const ids = new Set([userId]);
  for (const hub of Object.values(db.hubs)) {
    if (hub.members.includes(userId)) hub.members.forEach((m) => ids.add(m));
  }
  for (const dm of Object.values(db.dms)) {
    if (dm.members.includes(userId)) dm.members.forEach((m) => ids.add(m));
  }
  return ids;
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;
const authAttempts = new Map();

function authRateLimited(ip) {
  const now = Date.now();
  const list = (authAttempts.get(ip) || []).filter((t) => now - t < 60_000);
  list.push(now);
  authAttempts.set(ip, list);
  return list.length > 20;
}

app.post('/api/register', (req, res) => {
  if (authRateLimited(req.ip)) return res.status(429).json({ error: 'Zu viele Versuche. Warte kurz.' });
  const username = str(req.body?.username, 32);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const displayName = str(req.body?.displayName, 32) || username;

  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Benutzername: 3–20 Zeichen, nur Buchstaben, Zahlen, _ und .' });
  }
  if (password.length < 6 || password.length > 128) {
    return res.status(400).json({ error: 'Passwort muss 6–128 Zeichen lang sein.' });
  }
  if (findUserByName(username)) return res.status(409).json({ error: 'Benutzername ist schon vergeben.' });

  const { salt, hash } = hashPassword(password);
  const user = {
    id: id(),
    username,
    displayName,
    passHash: hash,
    salt,
    color: pick(ACCENTS),
    status: 'online',
    bio: '',
    createdAt: Date.now(),
  };
  db.users[user.id] = user;

  const lounge = ensureLounge();
  lounge.members.push(user.id);
  io.to(`hub:${lounge.id}`).emit('user:update', publicUser(user));
  io.to(`hub:${lounge.id}`).emit('hub:update', hubView(lounge));
  save();

  res.json({ token: createSession(user.id), user: publicUser(user) });
});

app.post('/api/login', (req, res) => {
  if (authRateLimited(req.ip)) return res.status(429).json({ error: 'Zu viele Versuche. Warte kurz.' });
  const username = str(req.body?.username, 32);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const user = findUserByName(username);
  if (!user || !verifyPassword(password, user)) {
    return res.status(401).json({ error: 'Benutzername oder Passwort falsch.' });
  }
  res.json({ token: createSession(user.id), user: publicUser(user) });
});

app.post('/api/logout', (req, res) => {
  const token = str(req.body?.token, 128);
  if (db.sessions[token]) {
    delete db.sessions[token];
    save();
  }
  res.json({ ok: true });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---------------------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------------------

const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 64 * 1024 });

const online = new Map(); // userId -> number of open sockets

function presenceOf(user) {
  if (!online.get(user.id)) return 'offline';
  return user.status === 'invisible' ? 'offline' : user.status;
}

function broadcastToVisible(userId, event, payload) {
  for (const uid of visibleUserIds(userId)) io.to(`user:${uid}`).emit(event, payload);
}

function emitPresence(user) {
  broadcastToVisible(user.id, 'presence', { userId: user.id, status: presenceOf(user) });
}

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const session = typeof token === 'string' && db.sessions[token];
  const user = session && db.users[session.userId];
  if (!user) return next(new Error('unauthorized'));
  socket.data.userId = user.id;
  next();
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  const me = () => db.users[userId];
  const sendTimes = [];

  socket.join(`user:${userId}`);
  for (const hub of Object.values(db.hubs)) {
    if (hub.members.includes(userId)) socket.join(`hub:${hub.id}`);
  }
  online.set(userId, (online.get(userId) || 0) + 1);
  emitPresence(me());

  // Wrap handlers so a thrown error becomes an ack error instead of crashing.
  const on = (event, handler) => {
    socket.on(event, (payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        const result = handler(payload || {});
        reply(result && result.error ? result : { ok: true, ...result });
      } catch (err) {
        console.error(`[nexora] Fehler in ${event}:`, err);
        reply({ error: 'Interner Fehler.' });
      }
    });
  };

  on('bootstrap', () => {
    const users = {};
    const presence = {};
    for (const uid of visibleUserIds(userId)) {
      const u = db.users[uid];
      if (!u) continue;
      users[uid] = publicUser(u);
      presence[uid] = presenceOf(u);
    }
    return {
      me: publicUser(me()),
      hubs: Object.values(db.hubs).filter((h) => h.members.includes(userId)).map(hubView),
      dms: Object.values(db.dms).filter((d) => d.members.includes(userId)).map(dmView),
      users,
      presence,
    };
  });

  on('hub:create', ({ name, icon }) => {
    const hubName = str(name, 40);
    if (hubName.length < 2) return { error: 'Der Hub-Name braucht mindestens 2 Zeichen.' };
    const hub = createHub({ name: hubName, icon: str(icon, 8), ownerId: userId });
    io.in(`user:${userId}`).socketsJoin(`hub:${hub.id}`);
    io.to(`user:${userId}`).emit('hub:update', hubView(hub));
    return { hub: hubView(hub) };
  });

  on('hub:join', ({ code }) => {
    const wanted = str(code, 64).replace(/^.*[/=]/, '').toUpperCase();
    const hub = Object.values(db.hubs).find((h) => h.inviteCode === wanted);
    if (!hub) return { error: 'Einladungscode ungültig.' };
    if (!hub.members.includes(userId)) {
      hub.members.push(userId);
      save();
      io.in(`user:${userId}`).socketsJoin(`hub:${hub.id}`);
      // Make the newcomer and the existing members aware of each other.
      for (const uid of hub.members) {
        const u = db.users[uid];
        if (u) io.to(`user:${userId}`).emit('user:update', publicUser(u));
        if (u) io.to(`user:${userId}`).emit('presence', { userId: uid, status: presenceOf(u) });
      }
      io.to(`hub:${hub.id}`).emit('user:update', publicUser(me()));
      io.to(`hub:${hub.id}`).emit('presence', { userId, status: presenceOf(me()) });
      io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
    }
    return { hub: hubView(hub) };
  });

  on('hub:update', ({ hubId, name, icon }) => {
    const hub = db.hubs[hubId];
    if (!hub || hub.ownerId !== userId) return { error: 'Nur der Besitzer kann den Hub bearbeiten.' };
    const hubName = str(name, 40);
    if (hubName.length < 2) return { error: 'Der Hub-Name braucht mindestens 2 Zeichen.' };
    hub.name = hubName;
    hub.icon = str(icon, 8);
    save();
    io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
    return {};
  });

  on('hub:regenerateInvite', ({ hubId }) => {
    const hub = db.hubs[hubId];
    if (!hub || hub.ownerId !== userId) return { error: 'Nur der Besitzer kann das.' };
    hub.inviteCode = inviteCode();
    save();
    io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
    return { inviteCode: hub.inviteCode };
  });

  on('hub:leave', ({ hubId }) => {
    const hub = db.hubs[hubId];
    if (!hub || !hub.members.includes(userId)) return { error: 'Hub nicht gefunden.' };
    if (hub.ownerId === userId) return { error: 'Als Besitzer kannst du den Hub nur löschen.' };
    hub.members = hub.members.filter((m) => m !== userId);
    save();
    io.in(`user:${userId}`).socketsLeave(`hub:${hub.id}`);
    io.to(`user:${userId}`).emit('hub:removed', { hubId: hub.id });
    io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
    return {};
  });

  on('hub:delete', ({ hubId }) => {
    const hub = db.hubs[hubId];
    if (!hub || hub.ownerId !== userId) return { error: 'Nur der Besitzer kann den Hub löschen.' };
    io.to(`hub:${hub.id}`).emit('hub:removed', { hubId: hub.id });
    io.in(`hub:${hub.id}`).socketsLeave(`hub:${hub.id}`);
    for (const c of hub.channels) delete db.messages[c.id];
    delete db.hubs[hub.id];
    save();
    return {};
  });

  on('channel:create', ({ hubId, name, topic }) => {
    const hub = db.hubs[hubId];
    if (!hub || hub.ownerId !== userId) return { error: 'Nur der Besitzer kann Kanäle erstellen.' };
    const channelName = str(name, 32).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9äöüß_-]/g, '');
    if (!channelName) return { error: 'Ungültiger Kanalname.' };
    if (hub.channels.length >= 50) return { error: 'Maximal 50 Kanäle pro Hub.' };
    const channel = newChannel(channelName, str(topic, 120));
    hub.channels.push(channel);
    save();
    io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
    return { channel };
  });

  on('channel:update', ({ channelId, name, topic }) => {
    const hub = hubForChannel(channelId);
    if (!hub || hub.ownerId !== userId) return { error: 'Nur der Besitzer kann Kanäle bearbeiten.' };
    const channel = hub.channels.find((c) => c.id === channelId);
    const channelName = str(name, 32).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9äöüß_-]/g, '');
    if (!channelName) return { error: 'Ungültiger Kanalname.' };
    channel.name = channelName;
    channel.topic = str(topic, 120);
    save();
    io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
    return {};
  });

  on('channel:delete', ({ channelId }) => {
    const hub = hubForChannel(channelId);
    if (!hub || hub.ownerId !== userId) return { error: 'Nur der Besitzer kann Kanäle löschen.' };
    if (hub.channels.length <= 1) return { error: 'Ein Hub braucht mindestens einen Kanal.' };
    hub.channels = hub.channels.filter((c) => c.id !== channelId);
    delete db.messages[channelId];
    save();
    io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
    return {};
  });

  on('messages:fetch', ({ channelId, before }) => {
    if (!channelAccess(userId, channelId)) return { error: 'Kein Zugriff.' };
    const all = db.messages[channelId] || [];
    let end = all.length;
    if (before) {
      const idx = all.findIndex((m) => m.id === before);
      if (idx >= 0) end = idx;
    }
    const start = Math.max(0, end - PAGE_SIZE);
    return { messages: all.slice(start, end), hasMore: start > 0 };
  });

  on('message:send', ({ channelId, content, replyTo }) => {
    const access = channelAccess(userId, channelId);
    if (!access) return { error: 'Kein Zugriff.' };
    const text = typeof content === 'string' ? content.trim() : '';
    if (!text) return { error: 'Leere Nachricht.' };
    if (text.length > MAX_MESSAGE) return { error: `Maximal ${MAX_MESSAGE} Zeichen.` };

    const now = Date.now();
    while (sendTimes.length && now - sendTimes[0] > 5000) sendTimes.shift();
    if (sendTimes.length >= 8) return { error: 'Langsam! Du sendest zu schnell.' };
    sendTimes.push(now);

    const list = (db.messages[channelId] ||= []);
    const reply = replyTo && list.find((m) => m.id === replyTo);
    const message = {
      id: id(),
      channelId,
      authorId: userId,
      content: text,
      createdAt: now,
      editedAt: null,
      replyTo: reply ? reply.id : null,
      reactions: {},
    };
    list.push(message);
    if (list.length > 5000) list.splice(0, list.length - 5000);
    save();

    if (access.type === 'hub') {
      io.to(`hub:${access.hub.id}`).emit('message:new', message);
    } else {
      for (const uid of access.dm.members) io.to(`user:${uid}`).emit('message:new', message);
    }
    return { message };
  });

  function emitToChannel(access, event, payload) {
    if (access.type === 'hub') io.to(`hub:${access.hub.id}`).emit(event, payload);
    else for (const uid of access.dm.members) io.to(`user:${uid}`).emit(event, payload);
  }

  function findMessage(channelId, messageId) {
    const access = channelAccess(userId, channelId);
    if (!access) return {};
    const message = (db.messages[channelId] || []).find((m) => m.id === messageId);
    return { access, message };
  }

  on('message:edit', ({ channelId, messageId, content }) => {
    const { access, message } = findMessage(channelId, messageId);
    if (!message || message.authorId !== userId) return { error: 'Nicht erlaubt.' };
    const text = typeof content === 'string' ? content.trim() : '';
    if (!text || text.length > MAX_MESSAGE) return { error: 'Ungültiger Inhalt.' };
    message.content = text;
    message.editedAt = Date.now();
    save();
    emitToChannel(access, 'message:update', message);
    return {};
  });

  on('message:delete', ({ channelId, messageId }) => {
    const { access, message } = findMessage(channelId, messageId);
    if (!message) return { error: 'Nachricht nicht gefunden.' };
    const isHubOwner = access.type === 'hub' && access.hub.ownerId === userId;
    if (message.authorId !== userId && !isHubOwner) return { error: 'Nicht erlaubt.' };
    db.messages[channelId] = db.messages[channelId].filter((m) => m.id !== messageId);
    save();
    emitToChannel(access, 'message:remove', { channelId, messageId });
    return {};
  });

  on('message:react', ({ channelId, messageId, emoji }) => {
    const { access, message } = findMessage(channelId, messageId);
    if (!message) return { error: 'Nachricht nicht gefunden.' };
    const e = str(emoji, 16);
    if (!e) return { error: 'Ungültiges Emoji.' };
    const users = (message.reactions[e] ||= []);
    const idx = users.indexOf(userId);
    if (idx >= 0) users.splice(idx, 1);
    else {
      if (Object.keys(message.reactions).length >= 20 && users.length === 0) return { error: 'Zu viele Reaktionen.' };
      users.push(userId);
    }
    if (!users.length) delete message.reactions[e];
    save();
    emitToChannel(access, 'message:update', message);
    return {};
  });

  on('typing', ({ channelId }) => {
    const access = channelAccess(userId, channelId);
    if (!access) return { error: 'Kein Zugriff.' };
    const payload = { channelId, userId };
    if (access.type === 'hub') socket.to(`hub:${access.hub.id}`).emit('typing', payload);
    else for (const uid of access.dm.members) if (uid !== userId) io.to(`user:${uid}`).emit('typing', payload);
    return {};
  });

  on('dm:open', ({ userId: otherId }) => {
    const other = db.users[otherId];
    if (!other || otherId === userId) return { error: 'Benutzer nicht gefunden.' };
    let dm = Object.values(db.dms).find((d) => d.members.includes(userId) && d.members.includes(otherId));
    if (!dm) {
      dm = { id: id(), members: [userId, otherId], createdAt: Date.now() };
      db.dms[dm.id] = dm;
      save();
      for (const [a, b] of [[userId, other], [otherId, me()]]) {
        io.to(`user:${a}`).emit('user:update', publicUser(b));
        io.to(`user:${a}`).emit('presence', { userId: b.id, status: presenceOf(b) });
        io.to(`user:${a}`).emit('dm:update', dmView(dm));
      }
    }
    return { dm: dmView(dm) };
  });

  on('user:search', ({ query }) => {
    const q = str(query, 32).toLowerCase();
    if (q.length < 2) return { users: [] };
    const users = Object.values(db.users)
      .filter((u) => u.id !== userId && (u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)))
      .slice(0, 10)
      .map(publicUser);
    return { users };
  });

  on('profile:update', ({ displayName, status, color, bio }) => {
    const user = me();
    if (displayName !== undefined) {
      const name = str(displayName, 32);
      if (name.length < 1) return { error: 'Anzeigename darf nicht leer sein.' };
      user.displayName = name;
    }
    if (status !== undefined) {
      if (!['online', 'idle', 'dnd', 'invisible'].includes(status)) return { error: 'Ungültiger Status.' };
      user.status = status;
    }
    if (color !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: 'Ungültige Farbe.' };
      user.color = color;
    }
    if (bio !== undefined) user.bio = str(bio, 190);
    save();
    broadcastToVisible(userId, 'user:update', publicUser(user));
    emitPresence(user);
    return { user: publicUser(user) };
  });

  socket.on('disconnect', () => {
    const count = (online.get(userId) || 1) - 1;
    if (count <= 0) online.delete(userId);
    else online.set(userId, count);
    if (db.users[userId]) emitPresence(me());
  });
});

// ---------------------------------------------------------------------------

ensureLounge();

function shutdown() {
  if (saveTimer) flush();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, () => {
  console.log(`[nexora] läuft auf http://localhost:${PORT}`);
});
