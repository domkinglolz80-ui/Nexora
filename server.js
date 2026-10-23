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
const MAX_FILE = 8 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;
const MAX_POLL_OPTIONS = 10;
// The newest changelog entry is the running version; clients compare it to reload on updates.
const CHANGELOG = require('./changelog.json');
const VERSION = CHANGELOG[0].version;
const ACCENTS = ['#ff7a18', '#ff9f1c', '#ff5e3a', '#ffb347', '#ff6b00', '#f9a03f', '#ff8c42', '#e85d04'];

// ---------------------------------------------------------------------------
// Persistence: MongoDB when MONGODB_URI is set, otherwise a local JSON file.
// The whole state lives in memory; writes are debounced.
// ---------------------------------------------------------------------------

// Remove whitespace and stray quotes that easily sneak in when pasting on a phone.
// A connection string never contains spaces, so dropping all of them is safe.
const MONGODB_URI = (process.env.MONGODB_URI || '').replace(/\s+/g, '').replace(/^["']|["']$/g, '');

// Explains a MongoDB problem in plain words for the hosting log (never prints the URI itself).
function mongoHint(err) {
  const msg = String(err && err.message);
  if (!/^mongodb(\+srv)?:\/\//.test(MONGODB_URI)) {
    return 'MONGODB_URI muss mit "mongodb+srv://" beginnen. Steht der Connection String wirklich unter Value (nicht unter Key)?';
  }
  if (/[<>]/.test(MONGODB_URI)) {
    return 'Im Connection String steht noch <db_password> oder spitze Klammern. Ersetze <db_password> komplett durch dein Passwort.';
  }
  if (/auth|authentication|bad auth/i.test(msg)) {
    return 'Benutzername oder Passwort falsch. In Atlas unter "Database Access" das Passwort neu setzen und in MONGODB_URI eintragen.';
  }
  if (/querySrv|ENOTFOUND|EBADNAME|Invalid scheme|URI|hostname/i.test(msg)) {
    return 'Der Connection String ist kaputt (Adresse ungültig). Kopiere ihn neu aus Atlas: Connect -> Drivers. Sonderzeichen im Passwort (@ : / # %) vermeiden.';
  }
  if (/Server selection timed out|ETIMEDOUT|ECONNREFUSED|timed out/i.test(msg)) {
    return 'Atlas lässt die Verbindung nicht zu. In Atlas unter "Network Access" -> "Add IP Address" -> "Allow Access from Anywhere" (0.0.0.0/0) eintragen.';
  }
  return 'Unbekannter Fehler – Logzeile oben prüfen.';
}

function emptyDb() {
  return { users: {}, sessions: {}, hubs: {}, dms: {}, messages: {} };
}

const db = emptyDb();
let saveTimer = null;

function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(flush, 400);
}

function flush() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (MONGODB_URI) return mongoStore.flush();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}

function loadFile() {
  try {
    Object.assign(db, JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('[nexora] Konnte Datenbank nicht lesen:', err.message);
  }
}

// One "meta" document for users/sessions/hubs/dms and one document per channel's
// messages, so no single document approaches MongoDB's 16 MB limit.
const mongoStore = {
  col: null,
  saved: new Map(), // docId -> last written JSON, to only write what changed
  running: null,
  again: false,

  async load() {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    await client.connect();
    const mongoDb = client.db(process.env.MONGODB_DB || 'nexora');
    this.col = mongoDb.collection('state');
    fileStore.col = mongoDb.collection('files');
    for (const doc of await this.col.find().toArray()) {
      if (doc._id === 'meta') Object.assign(db, doc.data);
      else if (doc._id.startsWith('ch:')) db.messages[doc._id.slice(3)] = doc.list;
      this.saved.set(doc._id, JSON.stringify(doc._id === 'meta' ? doc.data : doc.list));
    }
  },

  flush() {
    if (this.running) {
      this.again = true;
      return this.running;
    }
    this.running = this.write()
      .catch((err) => {
        console.error('[nexora] Speichern in MongoDB fehlgeschlagen:', err.message);
        setTimeout(save, 5000);
      })
      .finally(() => {
        this.running = null;
        if (this.again) {
          this.again = false;
          save();
        }
      });
    return this.running;
  },

  async write() {
    const { users, sessions, hubs, dms } = db;
    const docs = new Map([['meta', { data: { users, sessions, hubs, dms } }]]);
    for (const [channelId, list] of Object.entries(db.messages)) docs.set('ch:' + channelId, { list });

    const ops = [];
    const written = [];
    for (const [docId, body] of docs) {
      const json = JSON.stringify(body.data || body.list);
      if (this.saved.get(docId) === json) continue;
      ops.push({ replaceOne: { filter: { _id: docId }, replacement: body, upsert: true } });
      written.push([docId, json]);
    }
    const removed = [...this.saved.keys()].filter((docId) => !docs.has(docId));
    for (const docId of removed) ops.push({ deleteOne: { filter: { _id: docId } } });
    if (!ops.length) return;

    await this.col.bulkWrite(ops, { ordered: false });
    for (const [docId, json] of written) this.saved.set(docId, json);
    for (const docId of removed) this.saved.delete(docId);
  },
};

// Uploaded files live outside the main state: in the "files" collection when
// MongoDB is used, otherwise as plain files in DATA_DIR/uploads.
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

const fileStore = {
  col: null,

  async put(fileId, meta, data) {
    if (this.col) return void (await this.col.insertOne({ _id: fileId, meta, data }));
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.promises.writeFile(path.join(UPLOAD_DIR, fileId), data);
    await fs.promises.writeFile(path.join(UPLOAD_DIR, fileId + '.json'), JSON.stringify(meta));
  },

  async get(fileId) {
    if (this.col) {
      const doc = await this.col.findOne({ _id: fileId });
      return doc && { meta: doc.meta, data: Buffer.from(doc.data.buffer) };
    }
    try {
      const meta = JSON.parse(await fs.promises.readFile(path.join(UPLOAD_DIR, fileId + '.json'), 'utf8'));
      return { meta, data: await fs.promises.readFile(path.join(UPLOAD_DIR, fileId)) };
    } catch (err) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  },

  async remove(fileId) {
    if (this.col) return void (await this.col.deleteOne({ _id: fileId }));
    await fs.promises.rm(path.join(UPLOAD_DIR, fileId), { force: true });
    await fs.promises.rm(path.join(UPLOAD_DIR, fileId + '.json'), { force: true });
  },

  async ids() {
    if (this.col) return (await this.col.find({}, { projection: { _id: 1 } }).toArray()).map((d) => d._id);
    try {
      return (await fs.promises.readdir(UPLOAD_DIR)).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  },
};

// Deletes the uploaded files of messages that are gone for good.
function discardFiles(messages) {
  for (const m of messages) {
    for (const a of m.attachments || []) {
      fileStore.remove(a.id).catch((err) => console.error('[nexora] Datei konnte nicht gelöscht werden:', err.message));
    }
  }
}

// Files nobody sent (upload abandoned, or the server restarted in between) are removed.
async function sweepOrphanFiles() {
  const used = new Set();
  for (const list of Object.values(db.messages)) {
    for (const m of list) for (const a of m.attachments || []) used.add(a.id);
  }
  const orphans = (await fileStore.ids()).filter((fileId) => !used.has(fileId));
  for (const fileId of orphans) await fileStore.remove(fileId);
  if (orphans.length) console.log(`[nexora] ${orphans.length} verwaiste Datei(en) entfernt`);
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

// Official accounts get a verified badge and run the Nexora Lounge.
// Usernames containing "nexora" are reserved for them.
const OFFICIAL = new Set(
  (process.env.NEXORA_OFFICIAL || 'nexora').split(',').map((n) => n.trim().toLowerCase()).filter(Boolean),
);

function isOfficial(u) {
  return Boolean(u) && OFFICIAL.has(u.username.toLowerCase());
}

// Who may manage a hub: its owner, and official accounts in the Lounge.
function canManage(hub, userId) {
  return hub.ownerId === userId || (hub.isLounge && isOfficial(db.users[userId]));
}

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    official: isOfficial(u),
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
      newChannel('Treffpunkt', '', 'voice'),
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
  // Lounges created before voice channels existed get one too.
  if (!lounge.channels.some((c) => c.kind === 'voice')) {
    lounge.channels.push(newChannel('Treffpunkt', '', 'voice'), newChannel('Gaming', '', 'voice'));
    save();
  }
  return lounge;
}

function channelById(channelId) {
  const hub = hubForChannel(channelId);
  return hub && hub.channels.find((c) => c.id === channelId);
}

function isVoice(channelId) {
  return channelById(channelId)?.kind === 'voice';
}

function textChannelName(name) {
  return str(name, 32).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9äöüß_-]/g, '');
}

function voiceChannelName(name) {
  return str(name, 32).replace(/\s+/g, ' ');
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
    admins: hub.members.filter((m) => canManage(hub, m)),
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
// Hosting providers like Render sit behind a proxy; trust it so req.ip is the real client.
app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));
// "no-cache" makes browsers revalidate on every visit, so everyone gets the latest patch.
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache'),
}));

app.get('/api/version', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ version: VERSION, changelog: CHANGELOG });
});

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
  if (/nexora/i.test(username) && !OFFICIAL.has(username.toLowerCase())) {
    return res.status(400).json({ error: 'Namen mit „Nexora“ sind für offizielle Accounts reserviert.' });
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
// File uploads: the client uploads first and gets an attachment back, which it
// then sends along with a message. Unsent uploads expire after an hour.
// ---------------------------------------------------------------------------

const PENDING_TTL = 60 * 60 * 1000;
const pendingFiles = new Map(); // fileId -> { attachment, uploaderId, createdAt }
const uploadTimes = new Map(); // userId -> recent upload timestamps

setInterval(() => {
  const now = Date.now();
  for (const [fileId, p] of pendingFiles) {
    if (now - p.createdAt < PENDING_TTL) continue;
    pendingFiles.delete(fileId);
    fileStore.remove(fileId).catch(() => {});
  }
  for (const [uid, list] of uploadTimes) if (!list.some((t) => now - t < 60_000)) uploadTimes.delete(uid);
}, 10 * 60 * 1000).unref();

// Only these are shown inline; everything else is offered as a download.
function sniffImage(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf.toString('latin1', 1, 4) === 'PNG') return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.toString('latin1', 0, 4) === 'GIF8') return 'image/gif';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

function fileName(name) {
  // eslint-disable-next-line no-control-regex
  return str(name, 120).replace(/[\u0000-\u001f\\/:*?"<>|]/g, '_') || 'datei';
}

function dimension(v) {
  const n = Math.round(Number(v));
  return n >= 1 && n <= 20000 ? n : null;
}

// Authenticates before the body is read, so strangers cannot make the server buffer 8 MB.
function uploadAuth(req, res, next) {
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const session = db.sessions[token];
  if (!session || !db.users[session.userId]) return res.status(401).json({ error: 'Nicht angemeldet.' });
  const now = Date.now();
  const list = (uploadTimes.get(session.userId) || []).filter((t) => now - t < 60_000);
  if (list.length >= 20) return res.status(429).json({ error: 'Zu viele Uploads. Warte kurz.' });
  list.push(now);
  uploadTimes.set(session.userId, list);
  req.userId = session.userId;
  next();
}

app.post('/api/upload', uploadAuth, express.raw({ type: () => true, limit: MAX_FILE }), async (req, res) => {
  const data = req.body;
  if (!Buffer.isBuffer(data) || !data.length) return res.status(400).json({ error: 'Die Datei ist leer.' });
  const image = sniffImage(data);
  const declared = String(req.get('content-type') || '').toLowerCase().split(';')[0].trim();
  const attachment = {
    id: id(),
    name: fileName(req.query.name),
    size: data.length,
    type: image || (/^[\w.+-]+\/[\w.+-]+$/.test(declared) ? declared : 'application/octet-stream'),
    image: Boolean(image),
  };
  if (image) {
    const width = dimension(req.query.w);
    const height = dimension(req.query.h);
    if (width && height) Object.assign(attachment, { width, height });
  }
  try {
    await fileStore.put(attachment.id, { ...attachment, uploaderId: req.userId, createdAt: Date.now() }, data);
  } catch (err) {
    console.error('[nexora] Upload fehlgeschlagen:', err.message);
    return res.status(500).json({ error: 'Upload fehlgeschlagen. Versuch es nochmal.' });
  }
  pendingFiles.set(attachment.id, { attachment, uploaderId: req.userId, createdAt: Date.now() });
  res.json({ attachment });
});

app.get('/files/:fileId/:name?', async (req, res) => {
  const { fileId } = req.params;
  try {
    const file = /^[\w-]{12}$/.test(fileId) && (await fileStore.get(fileId));
    if (!file) return res.status(404).type('text').send('Datei nicht gefunden.');
    const { meta, data } = file;
    const inline = meta.image && req.query.download === undefined;
    res.set({
      'Content-Type': meta.image ? meta.type : 'application/octet-stream',
      'Content-Length': data.length,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(meta.name)}`,
      // File ids never change their content, so browsers may keep them forever.
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    });
    res.end(data);
  } catch (err) {
    console.error('[nexora] Datei konnte nicht gelesen werden:', err.message);
    res.status(500).type('text').send('Datei konnte nicht geladen werden.');
  }
});

// Errors from the body parsers (e.g. a file over the limit) as readable JSON.
app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err);
  const tooLarge = err.type === 'entity.too.large';
  res.status(err.status || 500).json({ error: tooLarge ? `Die Datei ist zu groß (max. ${MAX_FILE / 1024 / 1024} MB).` : 'Anfrage fehlgeschlagen.' });
});

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

// ---------------------------------------------------------------------------
// Voice: audio flows peer-to-peer over WebRTC; the server only tracks who is in
// which voice channel and relays the connection setup (offer/answer/ICE).
// ---------------------------------------------------------------------------

const VOICE_LIMIT = 10;
const voice = new Map(); // channelId -> Map(userId -> { socketId, muted, deafened })

const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
if (process.env.TURN_URL) {
  ICE_SERVERS.push({
    urls: process.env.TURN_URL.split(',').map((u) => u.trim()),
    username: process.env.TURN_USERNAME,
    credential: process.env.TURN_CREDENTIAL,
  });
}

function voiceMembers(channelId) {
  return [...(voice.get(channelId)?.entries() || [])].map(([userId, v]) => ({ userId, muted: v.muted, deafened: v.deafened }));
}

function emitVoiceState(channelId) {
  const hub = hubForChannel(channelId);
  if (hub) io.to(`hub:${hub.id}`).emit('voice:state', { channelId, members: voiceMembers(channelId) });
}

function voiceLeave(socket) {
  const channelId = socket.data.voice;
  if (!channelId) return;
  socket.data.voice = null;
  socket.leave(`voice:${channelId}`);
  const room = voice.get(channelId);
  const entry = room?.get(socket.data.userId);
  if (entry && entry.socketId === socket.id) room.delete(socket.data.userId);
  if (room && !room.size) voice.delete(channelId);
  socket.to(`voice:${channelId}`).emit('voice:peer-left', { socketId: socket.id });
  emitVoiceState(channelId);
}

function voiceKick(socketId, reason) {
  const target = io.sockets.sockets.get(socketId);
  if (!target) return;
  const channelId = target.data.voice;
  voiceLeave(target);
  target.emit('voice:kicked', { channelId, reason });
}

// Removes everyone (or one user) from the voice channels of a hub.
function voiceKickHub(hub, onlyUserId = null, reason = 'removed') {
  for (const c of hub.channels) {
    for (const [uid, v] of voice.get(c.id) || []) {
      if (!onlyUserId || uid === onlyUserId) voiceKick(v.socketId, reason);
    }
  }
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
      version: VERSION,
      me: publicUser(me()),
      hubs: Object.values(db.hubs).filter((h) => h.members.includes(userId)).map(hubView),
      dms: Object.values(db.dms).filter((d) => d.members.includes(userId)).map(dmView),
      users,
      presence,
      voice: Object.fromEntries(
        Object.values(db.hubs)
          .filter((h) => h.members.includes(userId))
          .flatMap((h) => h.channels.filter((c) => voice.has(c.id)).map((c) => [c.id, voiceMembers(c.id)])),
      ),
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
    if (!hub || !canManage(hub, userId)) return { error: 'Nur der Besitzer kann den Hub bearbeiten.' };
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
    if (!hub || !canManage(hub, userId)) return { error: 'Nur der Besitzer kann das.' };
    hub.inviteCode = inviteCode();
    save();
    io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
    return { inviteCode: hub.inviteCode };
  });

  on('hub:leave', ({ hubId }) => {
    const hub = db.hubs[hubId];
    if (!hub || !hub.members.includes(userId)) return { error: 'Hub nicht gefunden.' };
    if (hub.ownerId === userId) return { error: 'Als Besitzer kannst du den Hub nur löschen.' };
    voiceKickHub(hub, userId);
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
    voiceKickHub(hub);
    io.to(`hub:${hub.id}`).emit('hub:removed', { hubId: hub.id });
    io.in(`hub:${hub.id}`).socketsLeave(`hub:${hub.id}`);
    for (const c of hub.channels) {
      discardFiles(db.messages[c.id] || []);
      delete db.messages[c.id];
    }
    delete db.hubs[hub.id];
    save();
    return {};
  });

  on('channel:create', ({ hubId, name, topic, kind }) => {
    const hub = db.hubs[hubId];
    if (!hub || !canManage(hub, userId)) return { error: 'Nur der Besitzer kann Kanäle erstellen.' };
    const channelKind = kind === 'voice' ? 'voice' : 'text';
    const channelName = channelKind === 'voice' ? voiceChannelName(name) : textChannelName(name);
    if (!channelName) return { error: 'Ungültiger Kanalname.' };
    if (hub.channels.length >= 50) return { error: 'Maximal 50 Kanäle pro Hub.' };
    const channel = newChannel(channelName, str(topic, 120), channelKind);
    hub.channels.push(channel);
    save();
    io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
    return { channel };
  });

  on('channel:update', ({ channelId, name, topic }) => {
    const hub = hubForChannel(channelId);
    if (!hub || !canManage(hub, userId)) return { error: 'Nur der Besitzer kann Kanäle bearbeiten.' };
    const channel = hub.channels.find((c) => c.id === channelId);
    const channelName = channel.kind === 'voice' ? voiceChannelName(name) : textChannelName(name);
    if (!channelName) return { error: 'Ungültiger Kanalname.' };
    channel.name = channelName;
    channel.topic = str(topic, 120);
    save();
    io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
    return {};
  });

  on('channel:delete', ({ channelId }) => {
    const hub = hubForChannel(channelId);
    if (!hub || !canManage(hub, userId)) return { error: 'Nur der Besitzer kann Kanäle löschen.' };
    const channel = hub.channels.find((c) => c.id === channelId);
    if (channel.kind !== 'voice' && hub.channels.filter((c) => c.kind !== 'voice').length <= 1) {
      return { error: 'Ein Hub braucht mindestens einen Textkanal.' };
    }
    for (const [, v] of voice.get(channelId) || []) voiceKick(v.socketId, 'deleted');
    hub.channels = hub.channels.filter((c) => c.id !== channelId);
    discardFiles(db.messages[channelId] || []);
    delete db.messages[channelId];
    save();
    io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
    return {};
  });

  on('messages:fetch', ({ channelId, before }) => {
    if (!channelAccess(userId, channelId) || isVoice(channelId)) return { error: 'Kein Zugriff.' };
    const all = db.messages[channelId] || [];
    let end = all.length;
    if (before) {
      const idx = all.findIndex((m) => m.id === before);
      if (idx >= 0) end = idx;
    }
    const start = Math.max(0, end - PAGE_SIZE);
    return { messages: all.slice(start, end), hasMore: start > 0 };
  });

  function rateLimited() {
    const now = Date.now();
    while (sendTimes.length && now - sendTimes[0] > 5000) sendTimes.shift();
    if (sendTimes.length >= 8) return true;
    sendTimes.push(now);
    return false;
  }

  // Stores a new message in a channel and delivers it to everyone who can see it.
  function postMessage(access, channelId, fields) {
    const list = (db.messages[channelId] ||= []);
    const message = {
      id: id(),
      channelId,
      authorId: userId,
      content: '',
      createdAt: Date.now(),
      editedAt: null,
      replyTo: null,
      reactions: {},
      ...fields,
    };
    list.push(message);
    if (list.length > 5000) discardFiles(list.splice(0, list.length - 5000));
    save();
    emitToChannel(access, 'message:new', message);
    return message;
  }

  on('message:send', ({ channelId, content, replyTo, attachments }) => {
    const access = channelAccess(userId, channelId);
    if (!access || isVoice(channelId)) return { error: 'Kein Zugriff.' };
    const text = typeof content === 'string' ? content.trim() : '';
    if (text.length > MAX_MESSAGE) return { error: `Maximal ${MAX_MESSAGE} Zeichen.` };

    const fileIds = [...new Set(Array.isArray(attachments) ? attachments : [])];
    if (fileIds.length > MAX_ATTACHMENTS) return { error: `Maximal ${MAX_ATTACHMENTS} Anhänge pro Nachricht.` };
    const pending = fileIds.map((fileId) => pendingFiles.get(fileId));
    if (pending.some((p) => !p || p.uploaderId !== userId)) {
      return { error: 'Ein Anhang ist abgelaufen. Entferne ihn und lade ihn neu hoch.' };
    }
    if (!text && !pending.length) return { error: 'Leere Nachricht.' };
    if (rateLimited()) return { error: 'Langsam! Du sendest zu schnell.' };

    for (const fileId of fileIds) pendingFiles.delete(fileId);
    const reply = replyTo && (db.messages[channelId] || []).find((m) => m.id === replyTo);
    const fields = { content: text, replyTo: reply ? reply.id : null };
    if (pending.length) fields.attachments = pending.map((p) => p.attachment);
    return { message: postMessage(access, channelId, fields) };
  });

  on('poll:create', ({ channelId, question, options, multi }) => {
    const access = channelAccess(userId, channelId);
    if (!access || isVoice(channelId)) return { error: 'Kein Zugriff.' };
    const q = str(question, 200);
    if (!q) return { error: 'Die Umfrage braucht eine Frage.' };
    const answers = [...new Set((Array.isArray(options) ? options : []).map((o) => str(o, 80)).filter(Boolean))];
    if (answers.length < 2) return { error: 'Eine Umfrage braucht mindestens 2 verschiedene Antworten.' };
    if (answers.length > MAX_POLL_OPTIONS) return { error: `Maximal ${MAX_POLL_OPTIONS} Antworten.` };
    if (rateLimited()) return { error: 'Langsam! Du sendest zu schnell.' };
    const poll = {
      question: q,
      multi: Boolean(multi),
      closed: false,
      options: answers.map((text) => ({ id: id(), text, votes: [] })),
    };
    return { message: postMessage(access, channelId, { poll }) };
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
    if (message.poll) return { error: 'Umfragen können nicht bearbeitet werden.' };
    const text = typeof content === 'string' ? content.trim() : '';
    if ((!text && !message.attachments?.length) || text.length > MAX_MESSAGE) return { error: 'Ungültiger Inhalt.' };
    message.content = text;
    message.editedAt = Date.now();
    save();
    emitToChannel(access, 'message:update', message);
    return {};
  });

  on('message:delete', ({ channelId, messageId }) => {
    const { access, message } = findMessage(channelId, messageId);
    if (!message) return { error: 'Nachricht nicht gefunden.' };
    const isHubOwner = access.type === 'hub' && canManage(access.hub, userId);
    if (message.authorId !== userId && !isHubOwner) return { error: 'Nicht erlaubt.' };
    db.messages[channelId] = db.messages[channelId].filter((m) => m.id !== messageId);
    discardFiles([message]);
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

  on('poll:vote', ({ channelId, messageId, optionId }) => {
    const { access, message } = findMessage(channelId, messageId);
    if (!message?.poll) return { error: 'Umfrage nicht gefunden.' };
    const { poll } = message;
    if (poll.closed) return { error: 'Die Umfrage ist schon beendet.' };
    const option = poll.options.find((o) => o.id === optionId);
    if (!option) return { error: 'Antwort nicht gefunden.' };
    const hadVote = option.votes.includes(userId);
    // Single choice: a new vote replaces the old one.
    if (!poll.multi) for (const o of poll.options) o.votes = o.votes.filter((v) => v !== userId);
    if (hadVote) option.votes = option.votes.filter((v) => v !== userId);
    else option.votes.push(userId);
    save();
    emitToChannel(access, 'message:update', message);
    return {};
  });

  on('poll:close', ({ channelId, messageId }) => {
    const { access, message } = findMessage(channelId, messageId);
    if (!message?.poll) return { error: 'Umfrage nicht gefunden.' };
    const isHubOwner = access.type === 'hub' && canManage(access.hub, userId);
    if (message.authorId !== userId && !isHubOwner) return { error: 'Nur wer die Umfrage gestartet hat, kann sie beenden.' };
    message.poll.closed = true;
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

  on('voice:join', ({ channelId, muted, deafened }) => {
    const access = channelAccess(userId, channelId);
    if (!access || !isVoice(channelId)) return { error: 'Sprachkanal nicht gefunden.' };
    if (socket.data.voice === channelId) return { error: 'Du bist schon in diesem Sprachkanal.' };
    const room = voice.get(channelId) || new Map();
    if (room.size >= VOICE_LIMIT && !room.has(userId)) return { error: `Der Sprachkanal ist voll (max. ${VOICE_LIMIT}).` };

    voiceLeave(socket);
    // One voice connection per user: a session on another device is disconnected.
    for (const r of [...voice.values()]) {
      const existing = r.get(userId);
      if (existing && existing.socketId !== socket.id) voiceKick(existing.socketId, 'elsewhere');
    }

    const peers = [...room.entries()].map(([uid, v]) => ({ socketId: v.socketId, userId: uid }));
    room.set(userId, { socketId: socket.id, muted: Boolean(muted), deafened: Boolean(deafened) });
    voice.set(channelId, room);
    socket.data.voice = channelId;
    socket.join(`voice:${channelId}`);
    emitVoiceState(channelId);
    return { peers, iceServers: ICE_SERVERS };
  });

  on('voice:leave', () => {
    voiceLeave(socket);
    return {};
  });

  on('voice:signal', ({ to, data }) => {
    const target = typeof to === 'string' && io.sockets.sockets.get(to);
    if (!socket.data.voice || !target || target.data.voice !== socket.data.voice) return { error: 'Peer nicht gefunden.' };
    if (!data || typeof data !== 'object') return { error: 'Ungültig.' };
    target.emit('voice:signal', { from: socket.id, userId, data });
    return {};
  });

  on('voice:update', ({ muted, deafened }) => {
    const entry = socket.data.voice && voice.get(socket.data.voice)?.get(userId);
    if (!entry || entry.socketId !== socket.id) return { error: 'Nicht im Sprachkanal.' };
    entry.muted = Boolean(muted);
    entry.deafened = Boolean(deafened);
    emitVoiceState(socket.data.voice);
    return {};
  });

  socket.on('disconnect', () => {
    voiceLeave(socket);
    const count = (online.get(userId) || 1) - 1;
    if (count <= 0) online.delete(userId);
    else online.set(userId, count);
    if (db.users[userId]) emitPresence(me());
  });
});

// ---------------------------------------------------------------------------

async function shutdown() {
  try {
    if (saveTimer) await flush();
    if (mongoStore.running) await mongoStore.running;
  } finally {
    process.exit(0);
  }
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function main() {
  if (MONGODB_URI) {
    // Refuse to start on an empty state: the next save would overwrite the real data.
    await mongoStore.load();
    console.log('[nexora] Daten werden in MongoDB gespeichert');
  } else {
    loadFile();
    console.log(`[nexora] Daten werden in ${DB_FILE} gespeichert`);
  }
  ensureLounge();
  await sweepOrphanFiles().catch((err) => console.error('[nexora] Aufräumen der Dateien fehlgeschlagen:', err.message));
  server.listen(PORT, () => {
    console.log(`[nexora] läuft auf http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('[nexora] Start fehlgeschlagen:', String(err && err.message).replace(MONGODB_URI || '\0', '<MONGODB_URI>'));
  if (MONGODB_URI) console.error('[nexora] TIPP: ' + mongoHint(err));
  process.exit(1);
});
