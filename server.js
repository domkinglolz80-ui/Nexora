'use strict';

const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const { Server } = require('socket.io');
const botRuntime = require('./bots');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.NEXORA_DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PAGE_SIZE = 50;
const MAX_MESSAGE = 2000;
const MAX_FILE = 8 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;
const MAX_POLL_OPTIONS = 10;
const MAX_BOTS_PER_USER = 5;
const MAX_BOTS_PER_HUB = 10;
const MAX_COMMANDS = 25;
const MAX_COMMAND_OPTIONS = 5;
const MAX_SCRIPT = 10000;
const GHOST_COOLDOWN = 10_000;
const MAX_SYNCED_GHOSTS = 500;
// The Geister-Laden: Halloween accessories bought with caught ghosts, kept forever. Price in ghosts.
const SHOP = {
  spinnennetz: 25,
  mumie: 50,
  hexenkessel: 99,
  vampir: 150,
  sensenmann: 250,
  geisterschwarm: 400,
  blutmond: 666,
};
const STARTED_AT = Date.now();
// The newest changelog entry is the running version; clients compare it to reload on updates.
const CHANGELOG = require('./changelog.json');
const VERSION = CHANGELOG[0].version;
// The desktop app (desktop/) is released on GitHub; its installers always keep the same file names.
const DESKTOP_VERSION = require('./desktop/package.json').version;
const DESKTOP_DOWNLOAD_BASE = (process.env.DESKTOP_DOWNLOAD_BASE || 'https://github.com/domkinglolz80-ui/Nexora/releases/latest/download').replace(/\/+$/, '');
const DESKTOP_FILES = { windows: 'Nexora-Setup.exe', mac: 'Nexora.dmg', linux: 'Nexora.AppImage' };
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
  return { users: {}, sessions: {}, hubs: {}, dms: {}, messages: {}, bots: {}, announcement: null, team: [], audit: [], maintenance: null, retention: null };
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
    const { users, sessions, hubs, dms, bots, announcement, team, audit, maintenance, retention } = db;
    const docs = new Map([['meta', { data: { users, sessions, hubs, dms, bots, announcement, team, audit, maintenance, retention } }]]);
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

// ---------------------------------------------------------------------------
// Message cleanup: so the database does not grow forever, messages older than
// `days` are deleted (with their files) and every channel keeps at most `max`.
// @nexora can change both in the Owner-Zentrale; days = 0 keeps messages forever.
// ---------------------------------------------------------------------------

const RETENTION_DAYS = [0, 7, 14, 30, 60, 90, 180, 365];
const RETENTION_MAX = [500, 1000, 2000, 5000];
const RETENTION_DEFAULT = {
  days: RETENTION_DAYS.includes(Number(process.env.NEXORA_MESSAGE_DAYS)) ? Number(process.env.NEXORA_MESSAGE_DAYS) : 90,
  max: 2000,
};
const DAY = 24 * 60 * 60 * 1000;

function retention() {
  return { ...RETENTION_DEFAULT, ...(db.retention || {}) };
}

// Returns how many messages were deleted.
function pruneMessages() {
  const { days, max } = retention();
  const cutoff = days ? Date.now() - days * DAY : 0;
  let removed = 0;
  for (const [channelId, list] of Object.entries(db.messages)) {
    // Messages are stored oldest first, so everything to delete sits at the start.
    let cut = Math.max(0, list.length - max);
    while (cut < list.length && list[cut].createdAt < cutoff) cut += 1;
    if (cut) {
      discardFiles(list.splice(0, cut));
      removed += cut;
    }
    if (!list.length) delete db.messages[channelId];
  }
  if (removed) {
    save();
    console.log(`[nexora] Aufgeräumt: ${removed} alte Nachrichten gelöscht`);
  }
  return removed;
}

function messageStats() {
  let count = 0;
  let oldest = null;
  for (const list of Object.values(db.messages)) {
    count += list.length;
    if (list.length && (oldest === null || list[0].createdAt < oldest)) oldest = list[0].createdAt;
  }
  return { count, oldest };
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

// The owner (@nexora) can also make others official from the admin panel (db.team).
function isOfficial(u) {
  if (!u) return false;
  const name = u.username.toLowerCase();
  return OFFICIAL.has(name) || (!u.bot && Boolean(db.team?.includes(name)));
}

// The founder of Nexora: only @nexora. Gets every admin power and doubled limits.
const OWNER_USERNAME = 'nexora';
function isOwner(u) {
  return Boolean(u) && !u.bot && u.username.toLowerCase() === OWNER_USERNAME;
}

// The owner's limits are doubled.
function limit(userId, base) {
  return isOwner(db.users[userId]) ? base * 2 : base;
}

// Who may manage a hub: its owner, official accounts in the Lounge, and the Nexora owner everywhere.
function canManage(hub, userId) {
  const user = db.users[userId];
  return hub.ownerId === userId || (hub.isLounge && isOfficial(user)) || isOwner(user);
}

// What happened on Nexora and who did it; the owner reads it in the admin panel.
const MAX_AUDIT = 500;
function audit(byId, action, detail = '') {
  if (!Array.isArray(db.audit)) db.audit = [];
  db.audit.push({ id: id(), at: Date.now(), by: byId || null, action, detail: str(detail, 200) });
  if (db.audit.length > MAX_AUDIT) db.audit.splice(0, db.audit.length - MAX_AUDIT);
  save();
}

// Animated avatar accessories (basic ones for everyone + Halloween Edition). The look lives in the client.
const ACCESSORIES = new Set([
  'sonnenbrille', 'kopfhoerer', 'partyhut', 'heiligenschein', 'blumenkranz', 'herzen', // basic, all year
  'kuerbis', 'hexenhut', 'geist', 'fledermaus', 'hoerner', 'spinne', 'katze', // Halloween Edition 2026
]);

// The one account that owns the legendary Höllenfürst.
const LEGEND_USERNAME = 'zorvecx';
const isLegend = (u) => Boolean(u) && !u.bot && u.username.toLowerCase() === LEGEND_USERNAME;

// Exclusive and legendary accessories: only these accounts may wear them.
const EXCLUSIVE_ACCESSORIES = {
  kuerbiskoenig: (u) => isOwner(u), // only @nexora
  irrlicht: (u) => Boolean(u.system), // the Nexora Helper (Halloween)
  schaltkern: (u) => Boolean(u.system), // official: the Nexora Helper
  hoellenfuerst: isLegend, // legendary: only @Zorvecx
  nexuskrone: (u) => isOwner(u), // founder: only @nexora
};

// Put on once automatically (afterwards it can be changed like any accessory): [accessory, who, flag].
const AUTO_GRANTS = [
  ['kuerbiskoenig', isOwner, 'kingGranted'],
  ['hoellenfuerst', isLegend, 'legendGranted'],
  ['nexuskrone', isOwner, 'founderGranted'],
];

function grantAccessories(u) {
  for (const [accessory, allowed, flag] of AUTO_GRANTS) {
    if (u[flag] || !allowed(u)) continue;
    u.accessory = accessory;
    u[flag] = true;
  }
}

// Shop accessories are worn only by accounts that bought them (bots never can).
const owns = (u, item) => Boolean(u && !u.bot && Array.isArray(u.owned) && u.owned.includes(item));

function accessoryOf(value, user) {
  if (value === '' || value === null) return '';
  if (ACCESSORIES.has(value)) return value;
  if (Object.hasOwn(SHOP, value)) return owns(user, value) ? value : undefined;
  return EXCLUSIVE_ACCESSORIES[value]?.(user) ? value : undefined;
}

// @nexora gets the Kürbiskönig and then the Nexus-Krone, @Zorvecx the Höllenfürst, each once;
// anyone else still holding an exclusive from an earlier version loses it.
function grantExclusives() {
  for (const u of Object.values(db.users)) {
    // Since V0.4.0 ghosts can be spent; the rank counts every ghost ever caught.
    u.ghostsCaught = Math.max(u.ghostsCaught || 0, u.ghosts || 0);
    if (u.accessory && !ACCESSORIES.has(u.accessory) && accessoryOf(u.accessory, u) === undefined) u.accessory = '';
    grantAccessories(u);
  }
  save();
}

function publicUser(u) {
  const view = {
    id: u.id,
    username: u.username,
    official: isOfficial(u),
    owner: isOwner(u) || undefined,
    displayName: u.displayName,
    color: u.color,
    status: u.status,
    bio: u.bio || '',
    accessory: (u.accessory && accessoryOf(u.accessory, u)) || '',
    ghosts: u.ghosts || 0,
    ghostsCaught: u.ghostsCaught || 0,
    owned: Array.isArray(u.owned) ? u.owned.filter((item) => Object.hasOwn(SHOP, item)) : [],
    createdAt: u.createdAt,
    banned: u.banned ? true : undefined,
  };
  if (u.system) {
    Object.assign(view, {
      bot: true,
      system: true,
      official: true,
      disabled: false,
      commands: [], // only @nexora gets them, in the bootstrap
    });
    return view;
  }
  const bot = u.bot && db.bots[u.id];
  if (bot) {
    // Everything a client needs for slash commands; the scripts stay on the server.
    Object.assign(view, {
      bot: true,
      ownerId: bot.ownerId,
      disabled: Boolean(bot.disabled),
      commands: bot.commands.map((c) => ({ name: c.name, description: c.description, options: c.options })),
    });
  }
  return view;
}

function findUserByName(name) {
  const lower = name.toLowerCase();
  return Object.values(db.users).find((u) => u.username.toLowerCase() === lower);
}

// Signs a user out everywhere: sessions are dropped and open tabs are told why.
function endSessions(userId, message) {
  for (const [token, session] of Object.entries(db.sessions)) {
    if (session.userId === userId) delete db.sessions[token];
  }
  save();
  io.to(`user:${userId}`).emit('account:ended', { message });
  io.in(`user:${userId}`).disconnectSockets(true);
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

// Starter channels of a new hub, in the language of the person creating it.
const STARTER_CHANNELS = {
  de: [['willkommen', 'Sag hallo und stell dich vor 👋'], ['allgemein', 'Alles, was gerade los ist'], ['medien', 'Links, Clips & Screenshots'], ['Treffpunkt']],
  en: [['welcome', 'Say hi and introduce yourself 👋'], ['general', "Whatever's going on right now"], ['media', 'Links, clips & screenshots'], ['Hangout']],
};

function createHub({ name, icon, ownerId, inviteCode: code, lang }) {
  const hub = {
    id: id(),
    name,
    icon: icon || '',
    color: pick(ACCENTS),
    ownerId,
    inviteCode: code || inviteCode(),
    members: ownerId ? [ownerId] : [],
    channels: (lang === 'en' ? STARTER_CHANNELS.en : STARTER_CHANNELS.de).map(([channelName, topic]) => newChannel(channelName, topic || '', topic ? 'text' : 'voice')),
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
  // Halloween Edition 2026: a spooky channel, added once (owners may delete it later).
  if (!lounge.halloween2026) {
    lounge.halloween2026 = true;
    if (!lounge.channels.some((c) => c.name === 'halloween')) {
      lounge.channels.splice(2, 0, newChannel('halloween', '🎃 Gruselgeschichten, Kostüme & Süßigkeiten'));
    }
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
    admins: hub.members.filter((m) => canManage(hub, m) && !db.users[m]?.banned),
    inviteCode: hub.inviteCode,
    isLounge: !!hub.isLounge,
    members: hub.members.filter((m) => !db.users[m]?.banned),
    channels: hub.channels,
  };
}

function dmView(dm) {
  const msgs = db.messages[dm.id] || [];
  return { id: dm.id, members: dm.members, lastActivity: msgs.length ? msgs[msgs.length - 1].createdAt : dm.createdAt };
}

// Banned accounts vanish from Nexora: profile, messages, DMs. Only the owner still sees them
// (and can unban them). Their data stays, so an unban brings everything back.
function hiddenFrom(user, viewerId) {
  return Boolean(user?.banned) && user.id !== viewerId && !isOwner(db.users[viewerId]);
}

// Users that `userId` can see: everyone sharing a hub or DM.
function visibleUserIds(userId) {
  const ids = new Set([userId]);
  const add = (m) => { if (!hiddenFrom(db.users[m], userId)) ids.add(m); };
  for (const hub of Object.values(db.hubs)) {
    if (hub.members.includes(userId)) hub.members.forEach(add);
  }
  for (const dm of Object.values(db.dms)) {
    if (dm.members.includes(userId)) dm.members.forEach(add);
  }
  return ids;
}

// A DM is gone for someone when the other person is banned.
const dmPartnerId = (dm, userId) => dm.members.find((m) => m !== userId) || userId;
const dmVisible = (dm, userId) => dm.members.includes(userId) && !hiddenFrom(db.users[dmPartnerId(dm, userId)], userId);

// Messages (and reactions) of banned accounts are left out for everyone but the owner.
function messagesFor(list, viewerId) {
  if (isOwner(db.users[viewerId])) return list;
  const out = [];
  for (const m of list) {
    if (hiddenFrom(db.users[m.authorId], viewerId)) continue;
    const reactions = {};
    let changed = false;
    for (const [emoji, users] of Object.entries(m.reactions || {})) {
      const shown = users.filter((u) => !hiddenFrom(db.users[u], viewerId));
      if (shown.length !== users.length) changed = true;
      if (shown.length) reactions[emoji] = shown;
    }
    out.push(changed ? { ...m, reactions } : m);
  }
  return out;
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

const app = express();
app.disable('x-powered-by');
// Hosting providers like Render sit behind a proxy; trust it so req.ip is the real client.
app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));
// The page names the version it belongs to, and its own scripts and styles carry that
// version in their URL. A device can then never run an old app.js under a new page
// (e.g. while Render briefly runs the old and the new server side by side), and the
// client compares exactly the code it runs with the server.
const INDEX_HTML = fs
  .readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8')
  .replace('<head>', `<head>\n  <meta name="nexora-version" content="${VERSION}" />`)
  .replace(/(src|href)="\/(i18n|app|bots|admin|halloween)\.(js|css)"/g, `$1="/$2.$3?v=${encodeURIComponent(VERSION)}"`);
app.get(['/', '/index.html'], (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.type('html').send(INDEX_HTML);
});

// "no-cache" makes browsers revalidate on every visit, so everyone gets the latest patch.
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache'),
}));

app.get('/api/version', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ version: VERSION, desktop: { version: DESKTOP_VERSION }, changelog: CHANGELOG });
});

// /download/windows, /download/mac, /download/linux → the newest installer on GitHub.
app.get('/download/:platform', (req, res) => {
  const file = Object.hasOwn(DESKTOP_FILES, req.params.platform) && DESKTOP_FILES[req.params.platform];
  if (!file) return res.status(404).json({ error: 'Unbekannte Plattform.' });
  res.redirect(302, `${DESKTOP_DOWNLOAD_BASE}/${file}`);
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

function maintenanceMessage() {
  return `Nexora wird gerade gewartet.${db.maintenance.text ? ` ${db.maintenance.text}` : ''} Schau gleich wieder vorbei!`;
}

// Maintenance: everyone outside the team is signed out and cannot sign in until it ends.
function setMaintenance(enabled, text, byId) {
  if (enabled) {
    db.maintenance = { text: str(text, 200), at: Date.now(), by: byId };
    const message = maintenanceMessage();
    for (const u of Object.values(db.users)) {
      if (!u.bot && !isOfficial(u)) endSessions(u.id, message);
    }
  } else {
    db.maintenance = null;
  }
  audit(byId, enabled ? 'maintenanceOn' : 'maintenanceOff', db.maintenance?.text || '');
}

app.post('/api/register', (req, res) => {
  if (authRateLimited(req.ip)) return res.status(429).json({ error: 'Zu viele Versuche. Warte kurz.' });
  if (db.maintenance) return res.status(503).json({ error: maintenanceMessage() });
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
  grantAccessories(user);
  db.users[user.id] = user;

  const lounge = ensureLounge();
  lounge.members.push(user.id);
  io.to(`hub:${lounge.id}`).emit('user:update', publicUser(user));
  io.to(`hub:${lounge.id}`).emit('hub:update', hubView(lounge));
  audit(user.id, 'register', `@${user.username}`);

  res.json({ token: createSession(user.id), user: publicUser(user) });
});

app.post('/api/login', (req, res) => {
  if (authRateLimited(req.ip)) return res.status(429).json({ error: 'Zu viele Versuche. Warte kurz.' });
  const username = str(req.body?.username, 32);
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const user = findUserByName(username);
  // Bot accounts have no password and can never log in.
  if (!user || user.bot || !verifyPassword(password, user)) {
    return res.status(401).json({ error: 'Benutzername oder Passwort falsch.' });
  }
  if (user.banned) return res.status(403).json({ error: banMessage(user) });
  if (db.maintenance && !isOfficial(user)) return res.status(503).json({ error: maintenanceMessage() });
  res.json({ token: createSession(user.id), user: publicUser(user) });
});

function banMessage(user) {
  return `Dein Account wurde gesperrt.${user.banned.reason ? ` Grund: ${user.banned.reason}` : ''}`;
}

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
  for (const [uid, list] of scriptRuns) if (!list.some((t) => now - t < 10_000)) scriptRuns.delete(uid);
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
  const user = session && db.users[session.userId];
  if (!user || user.banned) return res.status(401).json({ error: 'Nicht angemeldet.' });
  const now = Date.now();
  const list = (uploadTimes.get(session.userId) || []).filter((t) => now - t < 60_000);
  if (list.length >= 20) return res.status(429).json({ error: 'Zu viele Uploads. Warte kurz.' });
  list.push(now);
  uploadTimes.set(session.userId, list);
  req.userId = session.userId;
  next();
}

// The raw limit fits the owner's doubled size; everyone else is checked right after.
app.post('/api/upload', uploadAuth, express.raw({ type: () => true, limit: MAX_FILE * 2 }), async (req, res) => {
  const data = req.body;
  if (!Buffer.isBuffer(data) || !data.length) return res.status(400).json({ error: 'Die Datei ist leer.' });
  const maxFile = limit(req.userId, MAX_FILE);
  if (data.length > maxFile) return res.status(413).json({ error: `Die Datei ist zu groß (max. ${maxFile / 1024 / 1024} MB).` });
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
  res.status(err.status || 500).json({ error: tooLarge ? `Die Datei ist zu groß (max. ${limit(req.userId, MAX_FILE) / 1024 / 1024} MB).` : 'Anfrage fehlgeschlagen.' });
});

// ---------------------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------------------

const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 64 * 1024 });

const online = new Map(); // userId -> number of open sockets

function presenceOf(user) {
  // The Nexora Helper shows the status @nexora gives it with /status.
  if (user.system) return user.status === 'invisible' ? 'offline' : user.status || 'online';
  if (user.bot) return db.bots[user.id]?.disabled ? 'offline' : 'online';
  if (!online.get(user.id)) return 'offline';
  return user.status === 'invisible' ? 'offline' : user.status;
}

function broadcastToVisible(userId, event, payload) {
  const subject = db.users[userId];
  for (const uid of visibleUserIds(userId)) {
    if (!hiddenFrom(subject, uid)) io.to(`user:${uid}`).emit(event, payload);
  }
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
  const payload = { channelId, members: voiceMembers(channelId) };
  const dm = db.dms[channelId];
  if (dm) {
    for (const uid of dm.members) io.to(`user:${uid}`).emit('voice:state', payload);
    return;
  }
  const hub = hubForChannel(channelId);
  if (hub) io.to(`hub:${hub.id}`).emit('voice:state', payload);
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

function emitToChannel(access, event, payload) {
  if (access.type === 'hub') io.to(`hub:${access.hub.id}`).emit(event, payload);
  else for (const uid of access.dm.members) io.to(`user:${uid}`).emit(event, payload);
}

// Stores a new message in a channel and delivers it to everyone who can see it.
function postMessage(access, channelId, authorId, fields) {
  const list = (db.messages[channelId] ||= []);
  const message = {
    id: id(),
    channelId,
    authorId,
    content: '',
    createdAt: Date.now(),
    editedAt: null,
    replyTo: null,
    reactions: {},
    ...fields,
  };
  list.push(message);
  const { max } = retention();
  if (list.length > max) discardFiles(list.splice(0, list.length - max));
  save();
  emitToChannel(access, 'message:new', message);
  return message;
}

function deleteHub(hub) {
  voiceKickHub(hub);
  io.to(`hub:${hub.id}`).emit('hub:removed', { hubId: hub.id });
  io.in(`hub:${hub.id}`).socketsLeave(`hub:${hub.id}`);
  for (const c of hub.channels) {
    discardFiles(db.messages[c.id] || []);
    delete db.messages[c.id];
  }
  delete db.hubs[hub.id];
  save();
}

function removeFromHub(hub, memberId) {
  voiceKickHub(hub, memberId);
  hub.members = hub.members.filter((m) => m !== memberId);
  save();
  io.in(`user:${memberId}`).socketsLeave(`hub:${hub.id}`);
  io.to(`user:${memberId}`).emit('hub:removed', { hubId: hub.id });
  io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
}

// ---------------------------------------------------------------------------
// Moderation, shared by the admin panel and the Nexora Helper.
// ---------------------------------------------------------------------------

// The target of a moderation action: a real (non-bot) user that is not official.
function moderatable(target) {
  if (!target || target.bot) return { error: 'Benutzer nicht gefunden.' };
  if (isOfficial(target)) return { error: 'Offizielle Accounts können nicht moderiert werden.' };
  return { target };
}

// Someone muted with /stumm can't post until the time is up.
function muteError(user) {
  if (!user?.mutedUntil) return null;
  if (user.mutedUntil <= Date.now()) {
    delete user.mutedUntil;
    delete user.muteReason;
    return null;
  }
  return `Du bist bis ${stampFmt.format(user.mutedUntil)} stumm geschaltet.${user.muteReason ? ` Grund: ${user.muteReason}` : ''}`;
}

function banUser(target, reason, byId) {
  target.banned = { reason: str(reason, 200), at: Date.now(), by: byId };
  endSessions(target.id, banMessage(target));
  // Gone for everyone at once; the owner keeps seeing the account, marked as banned.
  const owner = findUserByName(OWNER_USERNAME);
  const ownerRoom = owner ? `user:${owner.id}` : null;
  (ownerRoom ? io.except(ownerRoom) : io).emit('user:removed', { userId: target.id });
  if (ownerRoom) io.to(ownerRoom).emit('user:update', publicUser(target));
  for (const hub of Object.values(db.hubs)) {
    if (hub.members.includes(target.id)) io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
  }
}

function unbanUser(target) {
  delete target.banned;
  save();
  const user = publicUser(target);
  broadcastToVisible(target.id, 'user:restored', { user, status: presenceOf(target) });
  for (const hub of Object.values(db.hubs)) {
    if (hub.members.includes(target.id)) io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
  }
  for (const dm of Object.values(db.dms)) {
    if (dm.members.includes(target.id)) for (const uid of dm.members) io.to(`user:${uid}`).emit('dm:update', dmView(dm));
  }
}

// A banner on top of Nexora for everyone; an empty text removes it.
function setAnnouncement(text) {
  const content = str(text, 300);
  db.announcement = content ? { id: id(), text: content, createdAt: Date.now() } : null;
  save();
  io.emit('announcement', db.announcement);
  return db.announcement;
}

function platformCounts() {
  const humans = Object.values(db.users).filter((u) => !u.bot);
  const dayAgo = Date.now() - 86400000;
  let messages = 0, messagesToday = 0;
  for (const list of Object.values(db.messages)) {
    messages += list.length;
    for (let i = list.length - 1; i >= 0 && list[i].createdAt > dayAgo; i--) messagesToday += 1;
  }
  let inVoice = 0;
  for (const room of voice.values()) inVoice += room.size;
  return {
    users: humans.length,
    online: humans.filter((u) => online.get(u.id)).length,
    newToday: humans.filter((u) => u.createdAt > dayAgo).length,
    banned: humans.filter((u) => u.banned).length,
    bots: Object.keys(db.bots).length,
    hubs: Object.keys(db.hubs).length,
    channels: Object.values(db.hubs).reduce((n, h) => n + h.channels.length, 0),
    dms: Object.keys(db.dms).length,
    messages,
    messagesToday,
    inVoice,
  };
}

// ---------------------------------------------------------------------------
// Bots: accounts without a password that answer slash commands in hubs. Each
// command replies with a text template or runs a sandboxed script (bots.js).
// ---------------------------------------------------------------------------

const COMMAND_NAME_RE = /^[a-z0-9äöüß_-]{1,32}$/;
const OPTION_NAME_RE = /^[a-z0-9äöüß_]{1,20}$/;
const SCRIPT_RUNS = 10; // script runs per person and 10 seconds, across all their tabs
const scriptRuns = new Map(); // userId -> recent run timestamps

// Looks up an id from a client without ever landing on inherited keys like "__proto__".
const own = (map, key) => (typeof key === 'string' && Object.hasOwn(map, key) ? map[key] : null);

function scriptLimited(userId) {
  const now = Date.now();
  const list = (scriptRuns.get(userId) || []).filter((t) => now - t < 10_000);
  if (list.length >= SCRIPT_RUNS) return true;
  list.push(now);
  scriptRuns.set(userId, list);
  return false;
}

function botHubs(botId) {
  return Object.values(db.hubs).filter((h) => h.members.includes(botId));
}

// Everything about a bot, scripts included – only for its owner.
function botView(bot) {
  return {
    ...publicUser(db.users[bot.id]),
    public: Boolean(bot.public),
    commands: bot.commands,
    hubs: botHubs(bot.id).map((h) => ({ id: h.id, name: h.name, icon: h.icon })),
    storeSize: Buffer.byteLength(JSON.stringify(bot.store || {})),
  };
}

function broadcastBot(bot) {
  const user = db.users[bot.id];
  broadcastToVisible(bot.id, 'user:update', publicUser(user));
  emitPresence(user);
}

function cleanCommand(input, bot, { checkDuplicate = true } = {}) {
  if (!input || typeof input !== 'object') return { error: 'Ungültiger Befehl.' };
  const name = str(input.name, 33).toLowerCase().replace(/^\//, '');
  if (!COMMAND_NAME_RE.test(name)) return { error: 'Befehlsname: 1–32 Zeichen, nur Kleinbuchstaben, Zahlen, _ und -.' };
  if (checkDuplicate && bot.commands.some((c) => c.name === name && c.id !== input.id)) {
    return { error: `/${name} gibt es bei diesem Bot schon.` };
  }
  const rawOptions = Array.isArray(input.options) ? input.options : [];
  if (rawOptions.length > MAX_COMMAND_OPTIONS) return { error: `Maximal ${MAX_COMMAND_OPTIONS} Optionen pro Befehl.` };
  const options = [];
  for (const o of rawOptions) {
    const optionName = str(o?.name, 20).toLowerCase();
    if (!OPTION_NAME_RE.test(optionName)) return { error: `Ungültiger Optionsname „${optionName}“ (Kleinbuchstaben, Zahlen, _).` };
    if (options.some((x) => x.name === optionName)) return { error: `Die Option „${optionName}“ gibt es doppelt.` };
    options.push({ name: optionName, description: str(o.description, 60), required: Boolean(o.required) });
  }
  // Options are filled by position, so a required one after an optional one could never be set alone.
  const firstOptional = options.findIndex((o) => !o.required);
  if (firstOptional >= 0 && options.slice(firstOptional).some((o) => o.required)) {
    return { error: 'Pflicht-Optionen müssen vor den optionalen stehen.' };
  }
  const type = input.type === 'script' ? 'script' : 'text';
  const response = typeof input.response === 'string' ? input.response.trim() : '';
  const script = typeof input.script === 'string' ? input.script : '';
  if (type === 'text' && !response) return { error: 'Die Antwort darf nicht leer sein.' };
  if (response.length > MAX_MESSAGE) return { error: `Die Antwort darf maximal ${MAX_MESSAGE} Zeichen haben.` };
  if (type === 'script' && !script.trim()) return { error: 'Das Skript darf nicht leer sein.' };
  if (script.length > MAX_SCRIPT) return { error: `Das Skript darf maximal ${MAX_SCRIPT} Zeichen haben.` };
  return {
    command: {
      id: typeof input.id === 'string' && bot.commands.some((c) => c.id === input.id) ? input.id : id(),
      name,
      description: str(input.description, 100),
      options,
      type,
      response,
      script,
      ephemeral: Boolean(input.ephemeral),
    },
  };
}

// "/wetter Berlin morgen" with options [stadt, tag] -> { stadt: 'Berlin', tag: 'morgen' }.
// The last option takes the rest of the text.
function parseArgs(command, text) {
  const args = text ? text.split(/\s+/) : [];
  const options = {};
  command.options.forEach((o, i) => {
    const value = i === command.options.length - 1 ? args.slice(i).join(' ') : args[i] || '';
    if (value) options[o.name] = value;
  });
  const missing = command.options.find((o) => o.required && !options[o.name]);
  return { args, options, missing };
}

// Runs a command and returns { replies: [{ text, ephemeral }], logs, error }.
function executeCommand(bot, command, ctx, { dryRun = false } = {}) {
  if (command.type === 'text') {
    const text = botRuntime.renderTemplate(command.response, ctx).trim().slice(0, MAX_MESSAGE);
    return { replies: text ? [{ text, ephemeral: command.ephemeral }] : [], logs: [], error: null };
  }
  if (scriptLimited(ctx.user.id)) return { replies: [], logs: [], error: 'Zu viele Skripte in kurzer Zeit. Warte ein paar Sekunden.' };
  const result = botRuntime.runScript(command.script, ctx, bot.store || {});
  if (result.store && !dryRun) {
    bot.store = result.store;
    save();
  }
  if (command.ephemeral) result.replies.forEach((r) => (r.ephemeral = true));
  return result;
}

function deleteBot(bot) {
  for (const hub of botHubs(bot.id)) {
    hub.members = hub.members.filter((m) => m !== bot.id);
    io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
  }
  delete db.bots[bot.id];
  delete db.users[bot.id];
  save();
}

// ---------------------------------------------------------------------------
// Nexora Helper: the official system bot. Its commands are built in and only
// @nexora can use them – in every hub and DM, without inviting it. Nobody else
// even gets the list of commands.
// ---------------------------------------------------------------------------

const HELPER_ID = 'nexora-helper';
const MAX_PURGE = 100;
const HELPER_RATE = 15; // commands per minute
const CONFIRM_MS = 60_000; // time to answer /ja
const MAX_MUTE = 7 * 24 * 60; // minutes

// Bots and the Nexora Helper don't count as people in a hub.
const isBotMember = (memberId) => memberId === HELPER_ID || Boolean(db.bots[memberId]);

const helperTimes = new Map(); // userId -> times of the last helper commands
const helperPending = new Map(); // userId -> { name, options, channelId, expires } waiting for /ja
const helperDenied = new Map(); // userId -> last logged attempt

function helperLimited(userId) {
  const now = Date.now();
  const list = (helperTimes.get(userId) || []).filter((t) => now - t < 60_000);
  if (list.length >= HELPER_RATE) return true;
  list.push(now);
  helperTimes.set(userId, list);
  return false;
}

// Someone else tried to use the helper: written to the log, at most every 10 minutes per account.
function noteHelperDenied(user, command) {
  const last = helperDenied.get(user.id) || 0;
  if (Date.now() - last < 600_000) return;
  helperDenied.set(user.id, Date.now());
  audit(user.id, 'helperDenied', `/${command}`);
}

// @nexora can invite the helper into any hub; it then shows up in the member list for everyone.
function helperTargetHub(access, code) {
  const wanted = String(code || '').trim().replace(/^.*[/=]/, '').toUpperCase();
  if (wanted) return Object.values(db.hubs).find((h) => h.inviteCode === wanted) || null;
  return access.type === 'hub' ? access.hub : null;
}

function addHelperToHub(hub) {
  hub.members.push(HELPER_ID);
  save();
  io.to(`hub:${hub.id}`).emit('user:update', publicUser(db.users[HELPER_ID]));
  io.to(`hub:${hub.id}`).emit('presence', { userId: HELPER_ID, status: presenceOf(db.users[HELPER_ID]) });
  io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
  const channel = hub.channels.find((c) => c.kind !== 'voice');
  if (channel) {
    postMessage({ type: 'hub', hub }, channel.id, HELPER_ID, {
      content: '👋 Hallo zusammen! Ich bin der **Nexora Helper**, der offizielle Helfer von Nexora. Ab jetzt bin ich hier – im Auftrag von @nexora.',
    });
  }
}

// /status accepts German and English words for the four statuses.
const HELPER_STATUS = {
  online: 'online', on: 'online',
  abwesend: 'idle', idle: 'idle', away: 'idle',
  nichtstoeren: 'dnd', nichtstören: 'dnd', dnd: 'dnd', donotdisturb: 'dnd',
  unsichtbar: 'invisible', invisible: 'invisible', offline: 'invisible',
};
const HELPER_STATUS_LABEL = { online: 'online', idle: 'abwesend', dnd: 'auf „Nicht stören“', invisible: 'unsichtbar' };
const HELPER_STATUS_ICON = { online: '🟢', idle: '🌙', dnd: '⛔', invisible: '👻' };

// Everyone knows the helper, so everyone gets its new status right away.
function setHelperStatus(status) {
  const helper = db.users[HELPER_ID];
  helper.status = status;
  save();
  io.emit('user:update', publicUser(helper));
  io.emit('presence', { userId: HELPER_ID, status: presenceOf(helper) });
}

function ensureHelper() {
  const taken = findUserByName('NexoraHelper');
  // The profile is fixed in code and refreshed on every start.
  db.users[HELPER_ID] = {
    id: HELPER_ID,
    username: taken && taken.id !== HELPER_ID ? 'Nexora.Helper' : 'NexoraHelper',
    displayName: 'Nexora Helper',
    color: '#ff7a18',
    status: db.users[HELPER_ID]?.status || 'online', // set by @nexora with /status, kept across restarts
    bio: 'Der offizielle Helfer von Nexora. Gesteuert per Slash-Befehl – nur von @nexora.',
    accessory: 'schaltkern',
    createdAt: db.users[HELPER_ID]?.createdAt || Date.now(),
    bot: true,
    system: true,
  };
  save();
}

const option = (name, description, required = false) => ({ name, description, required });
const userByMention = (name) => findUserByName(String(name || '').replace(/^@/, ''));
const dateFmt = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' });
const stampFmt = new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Berlin' });
const numberFmt = new Intl.NumberFormat('de-DE');

function commandUsage(command) {
  return [`/${command.name}`, ...command.options.map((o) => (o.required ? `<${o.name}>` : `[${o.name}]`))].join(' ');
}

// What the client needs for the slash menu (sent to @nexora only).
function helperCommandView(c) {
  return { name: c.name, description: c.description, options: c.options };
}

// "30", "30m", "2h", "1d" (also "std", "t") -> minutes; null when invalid or longer than a week.
function parseMinutes(text) {
  const m = /^(\d{1,5})\s*(m|min|h|std|d|t)?$/i.exec(String(text || '').trim());
  if (!m) return null;
  const minutes = Number(m[1]) * ({ h: 60, std: 60, d: 1440, t: 1440 }[(m[2] || '').toLowerCase()] || 1);
  return minutes >= 1 && minutes <= MAX_MUTE ? minutes : null;
}

function durationText(minutes) {
  if (minutes % 1440 === 0) return `${minutes / 1440} ${minutes === 1440 ? 'Tag' : 'Tage'}`;
  if (minutes % 60 === 0) return `${minutes / 60} Std.`;
  return `${minutes} Min.`;
}

function uptimeText(seconds) {
  const d = Math.floor(seconds / 86400), h = Math.floor((seconds % 86400) / 3600), m = Math.floor((seconds % 3600) / 60);
  return [d && `${d} T.`, (d || h) && `${h} Std.`, `${m} Min.`].filter(Boolean).join(' ');
}

const mb = (bytes) => `${numberFmt.format(Math.round(bytes / 1048576))} MB`;
// 🔒 commands only ask for /ja when they would actually run; otherwise the error comes right away.
const canModerate = (name) => !moderatable(userByMention(name)).error;
const validPurge = (value) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= MAX_PURGE;
const isOff = (text) => /^(aus|off|ende|stop)$/i.test(String(text || '').trim());

const HELPER_GROUPS = ['Moderation', 'Kanal', 'Nexora', 'Helper'];

// Each run gets { invoker, access, channelId, options } and returns
// { public: [texts posted by the helper], ephemeral: [texts only the invoker sees] }.
// confirm(options) -> true: the command waits for /ja first.
const HELPER_COMMANDS = [
  {
    name: 'hilfe',
    group: 'Helper',
    description: 'Zeigt alle Befehle des Nexora Helpers',
    options: [],
    run: () => ({
      ephemeral: [[
        `🛡️ **Nexora Helper** · nur für @nexora · ${VERSION}`,
        ...HELPER_GROUPS.flatMap((group) => [
          `**${group}**`,
          ...HELPER_COMMANDS.filter((c) => c.group === group).map((c) => `\`${commandUsage(c)}\`${c.confirm ? ' 🔒' : ''} – ${c.description}`),
        ]),
        `🔒 = wartet auf \`/ja\` · höchstens ${HELPER_RATE} Befehle pro Minute · jeder Eingriff landet im Protokoll`,
      ].join('\n')],
    }),
  },
  {
    name: 'ja',
    group: 'Helper',
    description: 'Bestätigt den letzten 🔒-Befehl',
    options: [],
    run: ({ invoker }) => {
      const pending = helperPending.get(invoker.id);
      helperPending.delete(invoker.id);
      if (!pending || pending.expires < Date.now()) return { ephemeral: ['Es wartet kein Befehl auf eine Bestätigung.'] };
      const access = channelAccess(invoker.id, pending.channelId);
      if (!access) return { ephemeral: ['Der Kanal ist nicht mehr erreichbar – abgebrochen.'] };
      const command = HELPER_COMMANDS.find((c) => c.name === pending.name);
      const result = command.run({ invoker, access, channelId: pending.channelId, options: pending.options });
      return { ...result, access, channelId: pending.channelId, ran: command.name };
    },
  },
  {
    name: 'abbrechen',
    group: 'Helper',
    description: 'Verwirft den wartenden 🔒-Befehl',
    options: [],
    run: ({ invoker }) => ({
      ephemeral: [helperPending.delete(invoker.id) ? '❎ Abgebrochen – nichts ist passiert.' : 'Es wartet kein Befehl auf eine Bestätigung.'],
    }),
  },
  {
    name: 'einladen',
    group: 'Helper',
    description: 'Lädt den Nexora Helper in einen Hub ein – für alle sichtbar',
    options: [option('code', 'Einladungscode – ohne Code: dieser Hub')],
    run: ({ invoker, access, options }) => {
      const hub = helperTargetHub(access, options.code);
      if (!hub) return { ephemeral: [options.code ? 'Einladungscode ungültig.' : 'Gib den Einladungscode des Hubs an, z. B. `/einladen ABC123`.'] };
      if (hub.members.includes(HELPER_ID)) return { ephemeral: [`Der Nexora Helper ist schon in „${hub.name}“.`] };
      addHelperToHub(hub);
      audit(invoker.id, 'helperInvite', hub.name);
      return { ephemeral: [`✅ Der Nexora Helper ist jetzt in „${hub.name}“ – alle Mitglieder sehen ihn.`] };
    },
  },
  {
    name: 'ausladen',
    group: 'Helper',
    description: 'Holt den Nexora Helper wieder aus einem Hub',
    options: [option('code', 'Einladungscode – ohne Code: dieser Hub')],
    run: ({ invoker, access, options }) => {
      const hub = helperTargetHub(access, options.code);
      if (!hub) return { ephemeral: [options.code ? 'Einladungscode ungültig.' : 'Gib den Einladungscode des Hubs an, z. B. `/ausladen ABC123`.'] };
      if (!hub.members.includes(HELPER_ID)) return { ephemeral: [`Der Nexora Helper ist nicht in „${hub.name}“.`] };
      removeFromHub(hub, HELPER_ID);
      audit(invoker.id, 'helperRemove', hub.name);
      return { ephemeral: [`👋 Der Nexora Helper hat „${hub.name}“ verlassen.`] };
    },
  },
  {
    name: 'status',
    group: 'Helper',
    description: 'Setzt den Status des Nexora Helpers für alle',
    options: [option('status', 'online, abwesend, nichtstoeren oder unsichtbar', true)],
    run: ({ invoker, options }) => {
      const key = String(options.status).toLowerCase().replace(/[\s_.-]/g, '');
      const status = Object.hasOwn(HELPER_STATUS, key) ? HELPER_STATUS[key] : null;
      if (!status) return { ephemeral: ['Unbekannter Status. Möglich: `online`, `abwesend`, `nichtstoeren`, `unsichtbar`.'] };
      setHelperStatus(status);
      audit(invoker.id, 'helperStatus', HELPER_STATUS_LABEL[status]);
      return { ephemeral: [`${HELPER_STATUS_ICON[status]} Der Nexora Helper ist jetzt **${HELPER_STATUS_LABEL[status]}**.`] };
    },
  },
  {
    name: 'ban',
    group: 'Moderation',
    description: 'Sperrt einen Account auf ganz Nexora',
    confirm: (options) => canModerate(options.nutzer),
    options: [option('nutzer', 'Wer gesperrt wird', true), option('grund', 'Sieht die Person beim Login')],
    run: ({ invoker, options }) => {
      const { target, error } = moderatable(userByMention(options.nutzer));
      if (error) return { ephemeral: [error] };
      if (target.banned) return { ephemeral: [`@${target.username} ist schon gesperrt.`] };
      banUser(target, options.grund, invoker.id);
      audit(invoker.id, 'ban', `@${target.username}${options.grund ? ` – ${options.grund}` : ''} (Helper)`);
      return { public: [`🔨 **@${target.username}** wurde gesperrt.${options.grund ? ` Grund: ${options.grund}` : ''}`] };
    },
  },
  {
    name: 'unban',
    group: 'Moderation',
    description: 'Hebt eine Sperre wieder auf',
    options: [option('nutzer', 'Wer entsperrt wird', true)],
    run: ({ invoker, options }) => {
      const { target, error } = moderatable(userByMention(options.nutzer));
      if (error) return { ephemeral: [error] };
      if (!target.banned) return { ephemeral: [`@${target.username} ist nicht gesperrt.`] };
      unbanUser(target);
      audit(invoker.id, 'unban', `@${target.username} (Helper)`);
      return { ephemeral: [`✅ @${target.username} ist wieder entsperrt.`] };
    },
  },
  {
    name: 'stumm',
    group: 'Moderation',
    description: 'Schaltet jemanden auf ganz Nexora stumm (max. 7 Tage)',
    options: [option('nutzer', 'Wer stumm geschaltet wird', true), option('dauer', 'z. B. 30, 30m, 2h oder 1d', true), option('grund', 'Sieht die Person beim Schreiben')],
    run: ({ invoker, options }) => {
      const { target, error } = moderatable(userByMention(options.nutzer));
      if (error) return { ephemeral: [error] };
      const minutes = parseMinutes(options.dauer);
      if (!minutes) return { ephemeral: ['Dauer ungültig: 1 Minute bis 7 Tage, z. B. `30`, `30m`, `2h` oder `1d`.'] };
      target.mutedUntil = Date.now() + minutes * 60_000;
      target.muteReason = str(options.grund, 200);
      audit(invoker.id, 'mute', `@${target.username} – ${durationText(minutes)}${target.muteReason ? ` – ${target.muteReason}` : ''}`);
      return { public: [`🔇 **@${target.username}** ist für ${durationText(minutes)} stumm geschaltet.${target.muteReason ? ` Grund: ${target.muteReason}` : ''}`] };
    },
  },
  {
    name: 'entstummen',
    group: 'Moderation',
    description: 'Hebt eine Stummschaltung auf',
    options: [option('nutzer', 'Wer wieder schreiben darf', true)],
    run: ({ invoker, options }) => {
      const { target, error } = moderatable(userByMention(options.nutzer));
      if (error) return { ephemeral: [error] };
      if (!muteError(target)) return { ephemeral: [`@${target.username} ist nicht stumm geschaltet.`] };
      delete target.mutedUntil;
      delete target.muteReason;
      audit(invoker.id, 'unmute', `@${target.username}`);
      return { ephemeral: [`🔊 @${target.username} darf wieder schreiben.`] };
    },
  },
  {
    name: 'kick',
    group: 'Moderation',
    description: 'Wirft jemanden aus diesem Hub',
    options: [option('nutzer', 'Wer den Hub verlassen muss', true), option('grund', 'Wird im Kanal angezeigt')],
    run: ({ invoker, access, options }) => {
      if (access.type !== 'hub') return { ephemeral: ['/kick funktioniert nur in Hubs.'] };
      const { target, error } = moderatable(userByMention(options.nutzer));
      if (error) return { ephemeral: [error] };
      const { hub } = access;
      if (!hub.members.includes(target.id)) return { ephemeral: [`@${target.username} ist nicht in diesem Hub.`] };
      if (hub.ownerId === target.id) return { ephemeral: ['Den Besitzer kann man nicht aus seinem eigenen Hub werfen.'] };
      removeFromHub(hub, target.id);
      audit(invoker.id, 'kick', `@${target.username} – ${hub.name}`);
      return { public: [`👢 **@${target.username}** wurde aus dem Hub entfernt.${options.grund ? ` Grund: ${options.grund}` : ''}`] };
    },
  },
  {
    name: 'verwarnen',
    group: 'Moderation',
    description: 'Verwarnt jemanden öffentlich im Kanal',
    options: [option('nutzer', 'Wer verwarnt wird', true), option('grund', 'Worum es geht', true)],
    run: ({ invoker, options }) => {
      const { target, error } = moderatable(userByMention(options.nutzer));
      if (error) return { ephemeral: [error] };
      audit(invoker.id, 'warn', `@${target.username} – ${options.grund}`);
      return { public: [`⚠️ @${target.username}, das ist eine Verwarnung vom Nexora-Team: ${options.grund}`] };
    },
  },
  {
    name: 'umbenennen',
    group: 'Moderation',
    description: 'Ändert den Anzeigenamen eines Accounts',
    options: [option('nutzer', 'Wessen Name', true), option('name', 'Der neue Anzeigename', true)],
    run: ({ invoker, options }) => {
      const { target, error } = moderatable(userByMention(options.nutzer));
      if (error) return { ephemeral: [error] };
      const name = str(options.name, 32);
      const before = target.displayName;
      target.displayName = name;
      save();
      broadcastToVisible(target.id, 'user:update', publicUser(target));
      audit(invoker.id, 'rename', `@${target.username}: ${before} → ${name}`);
      return { ephemeral: [`✏️ @${target.username} heißt jetzt „${name}“ (vorher „${before}“).`] };
    },
  },
  {
    name: 'abmelden',
    group: 'Moderation',
    description: 'Meldet jemanden auf allen Geräten ab',
    confirm: (options) => canModerate(options.nutzer),
    options: [option('nutzer', 'Wer abgemeldet wird', true)],
    run: ({ invoker, options }) => {
      const { target, error } = moderatable(userByMention(options.nutzer));
      if (error) return { ephemeral: [error] };
      endSessions(target.id, 'Du wurdest vom Nexora-Team abgemeldet. Bitte melde dich neu an.');
      audit(invoker.id, 'logout', `@${target.username} (Helper)`);
      return { ephemeral: [`🚪 @${target.username} wurde überall abgemeldet.`] };
    },
  },
  {
    name: 'sagen',
    group: 'Kanal',
    description: 'Der Helper schreibt deinen Text in diesen Kanal',
    options: [option('text', 'Was der Helper schreibt', true)],
    run: ({ invoker, options }) => {
      audit(invoker.id, 'helperSay', options.text.slice(0, 120));
      return { public: [options.text] };
    },
  },
  {
    name: 'loeschen',
    group: 'Kanal',
    description: `Löscht die letzten Nachrichten in diesem Kanal (max. ${MAX_PURGE})`,
    confirm: (options) => validPurge(options.anzahl),
    options: [option('anzahl', `Wie viele (1–${MAX_PURGE})`, true)],
    run: ({ invoker, access, channelId, options }) => {
      if (!validPurge(options.anzahl)) return { ephemeral: [`Bitte eine Zahl von 1 bis ${MAX_PURGE}.`] };
      const removed = (db.messages[channelId] || []).splice(-Number(options.anzahl));
      discardFiles(removed);
      save();
      for (const m of removed) emitToChannel(access, 'message:remove', { channelId, messageId: m.id });
      audit(invoker.id, 'purge', `${removed.length} Nachrichten`);
      return { ephemeral: [`🧹 ${removed.length} Nachricht${removed.length === 1 ? '' : 'en'} gelöscht.`] };
    },
  },
  {
    name: 'ankuendigung',
    group: 'Nexora',
    description: 'Setzt das Banner für alle – ohne Text wird es entfernt',
    options: [option('text', 'Was alle oben im Chat sehen')],
    run: ({ invoker, options }) => {
      const live = setAnnouncement(options.text);
      audit(invoker.id, live ? 'announce' : 'announceClear', live?.text || '');
      return { ephemeral: [live ? '📣 Die Ankündigung ist live.' : '📣 Die Ankündigung wurde entfernt.'] };
    },
  },
  {
    name: 'wartung',
    group: 'Nexora',
    description: 'Schaltet den Wartungsmodus ein – „aus“ beendet ihn',
    confirm: (options) => !isOff(options.text),
    options: [option('text', 'Hinweis für alle – oder „aus“')],
    run: ({ invoker, options }) => {
      if (isOff(options.text)) {
        if (!db.maintenance) return { ephemeral: ['Nexora ist gerade nicht in Wartung.'] };
        setMaintenance(false, '', invoker.id);
        return { ephemeral: ['🟢 Wartung beendet – alle können sich wieder anmelden.'] };
      }
      setMaintenance(true, options.text, invoker.id);
      return { ephemeral: ['🚧 Wartungsmodus an: Alle außer dem Team wurden abgemeldet. Beenden mit `/wartung aus`.'] };
    },
  },
  {
    name: 'info',
    group: 'Nexora',
    description: 'Zeigt Infos zu einem Account',
    options: [option('nutzer', 'Wessen Infos', true)],
    run: ({ options }) => {
      const u = userByMention(options.nutzer);
      if (!u || u.bot) return { ephemeral: ['Benutzer nicht gefunden.'] };
      let messages = 0;
      for (const list of Object.values(db.messages)) for (const m of list) if (m.authorId === u.id) messages += 1;
      const hubs = Object.values(db.hubs).filter((h) => h.members.includes(u.id)).length;
      const bots = Object.values(db.bots).filter((b) => b.ownerId === u.id).length;
      const sessions = Object.values(db.sessions).filter((s) => s.userId === u.id).length;
      return {
        ephemeral: [[
          `ℹ️ **${u.displayName}** (@${u.username})${isOfficial(u) ? ' · offiziell' : ''}`,
          `Dabei seit ${dateFmt.format(u.createdAt)} · ${online.get(u.id) ? 'gerade online' : 'offline'} · ${numberFmt.format(sessions)} angemeldete Geräte`,
          `${numberFmt.format(hubs)} Hubs · ${numberFmt.format(messages)} Nachrichten · ${numberFmt.format(bots)} Bots`,
          u.banned ? `🔨 Gesperrt seit ${dateFmt.format(u.banned.at)}${u.banned.reason ? ` – ${u.banned.reason}` : ''}` : 'Nicht gesperrt',
          muteError(u) ? `🔇 Stumm bis ${stampFmt.format(u.mutedUntil)}${u.muteReason ? ` – ${u.muteReason}` : ''}` : 'Nicht stumm',
        ].join('\n')],
      };
    },
  },
  {
    name: 'suche',
    group: 'Nexora',
    description: 'Sucht Accounts nach Name',
    options: [option('name', 'Teil des Benutzer- oder Anzeigenamens', true)],
    run: ({ options }) => {
      const q = options.name.replace(/^@/, '').toLowerCase();
      const found = Object.values(db.users).filter((u) => !u.bot && (u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)));
      if (!found.length) return { ephemeral: [`Niemand gefunden für „${options.name}“.`] };
      const rows = found.slice(0, 10).map((u) => `• **${u.displayName}** @${u.username}${online.get(u.id) ? ' 🟢' : ''}${isOfficial(u) ? ' ✓' : ''}${u.banned ? ' 🔨' : ''}${muteError(u) ? ' 🔇' : ''}`);
      return { ephemeral: [[`🔎 ${numberFmt.format(found.length)} Treffer${found.length > 10 ? ' (die ersten 10)' : ''}`, ...rows].join('\n')] };
    },
  },
  {
    name: 'online',
    group: 'Nexora',
    description: 'Zeigt, wer gerade online ist',
    options: [],
    run: () => {
      const people = Object.values(db.users).filter((u) => !u.bot && online.get(u.id));
      if (!people.length) return { ephemeral: ['Gerade ist niemand online.'] };
      const names = people.slice(0, 40).map((u) => `@${u.username}${u.status === 'invisible' ? ' (unsichtbar)' : ''}`);
      return { ephemeral: [`🟢 **${numberFmt.format(people.length)} online:** ${names.join(', ')}${people.length > 40 ? ' …' : ''}`] };
    },
  },
  {
    name: 'hubs',
    group: 'Nexora',
    description: 'Die größten Hubs mit Einladungscode',
    options: [],
    run: () => {
      const people = (h) => h.members.filter((m) => !isBotMember(m)).length;
      const hubs = Object.values(db.hubs).sort((a, b) => people(b) - people(a)).slice(0, 10);
      if (!hubs.length) return { ephemeral: ['Es gibt noch keine Hubs.'] };
      const rows = hubs.map((h) => `• **${h.name}** · ${numberFmt.format(people(h))} Mitglieder · \`${h.inviteCode}\`${h.members.includes(HELPER_ID) ? ' · 🛡️ Helper' : ''}`);
      return { ephemeral: [[`🏠 **Hubs** (${numberFmt.format(Object.keys(db.hubs).length)} insgesamt)`, ...rows].join('\n')] };
    },
  },
  {
    name: 'stats',
    group: 'Nexora',
    description: 'Zeigt Nexora in Zahlen',
    options: [],
    run: () => {
      const c = platformCounts();
      const n = numberFmt.format;
      return {
        ephemeral: [[
          `📊 **Nexora in Zahlen** · ${VERSION}`,
          `Nutzer: ${n(c.users)} (${n(c.online)} online, +${n(c.newToday)} heute) · gesperrt: ${n(c.banned)}`,
          `Hubs: ${n(c.hubs)} · Kanäle: ${n(c.channels)} · Bots: ${n(c.bots)} · im Sprachkanal: ${n(c.inVoice)}`,
          `Nachrichten: ${n(c.messages)} (${n(c.messagesToday)} in 24 Std.)`,
        ].join('\n')],
      };
    },
  },
  {
    name: 'system',
    group: 'Nexora',
    description: 'Technik-Check: Laufzeit, Speicher, Verbindungen',
    options: [],
    run: () => {
      const mem = process.memoryUsage();
      return {
        ephemeral: [[
          `⚙️ **Nexora-System** · ${VERSION}`,
          `Laufzeit: ${uptimeText(process.uptime())} · Node ${process.version}`,
          `Speicher: ${mb(mem.rss)} (Heap ${mb(mem.heapUsed)} von ${mb(mem.heapTotal)})`,
          `Datenbank: ${MONGODB_URI ? 'MongoDB' : 'Datei (db.json)'} · Verbindungen: ${numberFmt.format(io.engine.clientsCount)} · Sessions: ${numberFmt.format(Object.keys(db.sessions).length)}`,
          `Wartung: ${db.maintenance ? 'an' : 'aus'} · Helper in ${numberFmt.format(Object.values(db.hubs).filter((h) => h.members.includes(HELPER_ID)).length)} Hubs`,
        ].join('\n')],
      };
    },
  },
  {
    name: 'protokoll',
    group: 'Nexora',
    description: 'Zeigt die letzten Einträge im Protokoll',
    options: [option('anzahl', 'Wie viele (1–25), Standard 10')],
    run: ({ options }) => {
      const count = options.anzahl ? Number(options.anzahl) : 10;
      if (!Number.isInteger(count) || count < 1 || count > 25) return { ephemeral: ['Bitte eine Zahl von 1 bis 25.'] };
      const entries = (db.audit || []).slice(-count).reverse();
      if (!entries.length) return { ephemeral: ['Das Protokoll ist leer.'] };
      const rows = entries.map((e) => `• ${stampFmt.format(e.at)} · ${e.by && db.users[e.by] ? `@${db.users[e.by].username}` : '–'} · \`${e.action}\`${e.detail ? ` ${e.detail}` : ''}`);
      return { ephemeral: [[`📜 **Protokoll** · die letzten ${entries.length}`, ...rows].join('\n')] };
    },
  },
];

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const session = typeof token === 'string' && db.sessions[token];
  const user = session && db.users[session.userId];
  if (!user || user.bot || user.banned) return next(new Error('unauthorized'));
  if (db.maintenance && !isOfficial(user)) return next(new Error('unauthorized'));
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
    // Everyone can see the helper's messages, so everyone knows its profile.
    users[HELPER_ID] = publicUser(db.users[HELPER_ID]);
    presence[HELPER_ID] = presenceOf(db.users[HELPER_ID]);
    return {
      version: VERSION,
      helperCommands: isOwner(me()) ? HELPER_COMMANDS.map(helperCommandView) : undefined,
      announcement: db.announcement,
      me: publicUser(me()),
      hubs: Object.values(db.hubs).filter((h) => h.members.includes(userId)).map(hubView),
      dms: Object.values(db.dms).filter((d) => dmVisible(d, userId)).map(dmView),
      users,
      presence,
      voice: Object.fromEntries([
        ...Object.values(db.hubs)
          .filter((h) => h.members.includes(userId))
          .flatMap((h) => h.channels.filter((c) => voice.has(c.id)).map((c) => [c.id, voiceMembers(c.id)])),
        ...Object.values(db.dms)
          .filter((d) => voice.has(d.id) && dmVisible(d, userId))
          .map((d) => [d.id, voiceMembers(d.id)]),
      ]),
    };
  });

  on('hub:create', ({ name, icon, lang }) => {
    const hubName = str(name, 40);
    if (hubName.length < 2) return { error: 'Der Hub-Name braucht mindestens 2 Zeichen.' };
    const hub = createHub({ name: hubName, icon: str(icon, 8), ownerId: userId, lang });
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
        if (!u || hiddenFrom(u, userId)) continue;
        io.to(`user:${userId}`).emit('user:update', publicUser(u));
        io.to(`user:${userId}`).emit('presence', { userId: uid, status: presenceOf(u) });
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
    removeFromHub(hub, userId);
    return {};
  });

  on('hub:delete', ({ hubId }) => {
    const hub = db.hubs[hubId];
    if (!hub || hub.ownerId !== userId) return { error: 'Nur der Besitzer kann den Hub löschen.' };
    deleteHub(hub);
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
    return { messages: messagesFor(all.slice(start, end), userId), hasMore: start > 0 };
  });

  function rateLimited() {
    const now = Date.now();
    while (sendTimes.length && now - sendTimes[0] > 5000) sendTimes.shift();
    if (sendTimes.length >= limit(userId, 8)) return true;
    sendTimes.push(now);
    return false;
  }

  on('message:send', ({ channelId, content, replyTo, attachments }) => {
    const access = channelAccess(userId, channelId);
    if (!access || isVoice(channelId)) return { error: 'Kein Zugriff.' };
    const text = typeof content === 'string' ? content.trim() : '';
    if (text.length > limit(userId, MAX_MESSAGE)) return { error: `Maximal ${limit(userId, MAX_MESSAGE)} Zeichen.` };

    const fileIds = [...new Set(Array.isArray(attachments) ? attachments : [])];
    if (fileIds.length > limit(userId, MAX_ATTACHMENTS)) return { error: `Maximal ${limit(userId, MAX_ATTACHMENTS)} Anhänge pro Nachricht.` };
    const pending = fileIds.map((fileId) => pendingFiles.get(fileId));
    if (pending.some((p) => !p || p.uploaderId !== userId)) {
      return { error: 'Ein Anhang ist abgelaufen. Entferne ihn und lade ihn neu hoch.' };
    }
    if (!text && !pending.length) return { error: 'Leere Nachricht.' };
    const muted = muteError(me());
    if (muted) return { error: muted };
    if (rateLimited()) return { error: 'Langsam! Du sendest zu schnell.' };

    for (const fileId of fileIds) pendingFiles.delete(fileId);
    const reply = replyTo && (db.messages[channelId] || []).find((m) => m.id === replyTo);
    const fields = { content: text, replyTo: reply ? reply.id : null };
    if (pending.length) fields.attachments = pending.map((p) => p.attachment);
    return { message: postMessage(access, channelId, userId, fields) };
  });

  on('poll:create', ({ channelId, question, options, multi }) => {
    const access = channelAccess(userId, channelId);
    if (!access || isVoice(channelId)) return { error: 'Kein Zugriff.' };
    const q = str(question, 200);
    if (!q) return { error: 'Die Umfrage braucht eine Frage.' };
    const answers = [...new Set((Array.isArray(options) ? options : []).map((o) => str(o, 80)).filter(Boolean))];
    if (answers.length < 2) return { error: 'Eine Umfrage braucht mindestens 2 verschiedene Antworten.' };
    if (answers.length > limit(userId, MAX_POLL_OPTIONS)) return { error: `Maximal ${limit(userId, MAX_POLL_OPTIONS)} Antworten.` };
    const muted = muteError(me());
    if (muted) return { error: muted };
    if (rateLimited()) return { error: 'Langsam! Du sendest zu schnell.' };
    const poll = {
      question: q,
      multi: Boolean(multi),
      closed: false,
      options: answers.map((text) => ({ id: id(), text, votes: [] })),
    };
    return { message: postMessage(access, channelId, userId, { poll }) };
  });

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
    if ((!text && !message.attachments?.length) || text.length > limit(userId, MAX_MESSAGE)) return { error: 'Ungültiger Inhalt.' };
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
    const other = own(db.users, otherId);
    if (!other || otherId === userId || hiddenFrom(other, userId)) return { error: 'Benutzer nicht gefunden.' };
    if (other.bot) return { error: 'Bots antworten nur auf Slash-Befehle in Hubs.' };
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
      .filter((u) => u.id !== userId && !hiddenFrom(u, userId) && (u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)))
      .slice(0, 10)
      .map(publicUser);
    return { users };
  });

  on('profile:update', ({ displayName, status, color, bio, accessory }) => {
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
    if (accessory !== undefined) {
      const acc = accessoryOf(accessory, user);
      if (acc === undefined) return { error: 'Dieses Accessoire kannst du nicht tragen.' };
      user.accessory = acc;
    }
    save();
    broadcastToVisible(userId, 'user:update', publicUser(user));
    emitPresence(user);
    return { user: publicUser(user) };
  });

  on('voice:join', ({ channelId, muted, deafened }) => {
    const access = channelAccess(userId, channelId);
    // A call in a DM uses the DM itself as its voice room.
    const call = access?.type === 'dm';
    if (call) {
      const partner = db.users[dmPartnerId(access.dm, userId)];
      if (!dmVisible(access.dm, userId) || !partner || partner.bot || partner.id === userId) return { error: 'Anruf nicht möglich.' };
    } else if (!access || !isVoice(channelId)) return { error: 'Sprachkanal nicht gefunden.' };
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
    // Nobody else on the line yet: let the other person's devices ring.
    if (call && !peers.length) {
      io.to(`user:${dmPartnerId(access.dm, userId)}`).emit('call:incoming', { dmId: channelId, from: userId });
    }
    return { peers, iceServers: ICE_SERVERS };
  });

  on('call:decline', ({ dmId }) => {
    const access = channelAccess(userId, dmId);
    if (access?.type !== 'dm') return { error: 'Anruf nicht gefunden.' };
    for (const uid of access.dm.members) io.to(`user:${uid}`).emit('call:declined', { dmId, by: userId });
    return {};
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

  // ----- Bots -----

  const ownBot = (botId) => {
    const bot = own(db.bots, botId);
    return bot && bot.ownerId === userId ? bot : null;
  };

  on('bot:list', () => ({
    bots: Object.values(db.bots).filter((b) => b.ownerId === userId).map(botView),
  }));

  on('bot:create', ({ username, displayName, lang }) => {
    if (Object.values(db.bots).filter((b) => b.ownerId === userId).length >= limit(userId, MAX_BOTS_PER_USER)) {
      return { error: `Du kannst maximal ${limit(userId, MAX_BOTS_PER_USER)} Bots haben.` };
    }
    const name = str(username, 32);
    if (!USERNAME_RE.test(name)) return { error: 'Bot-Name: 3–20 Zeichen, nur Buchstaben, Zahlen, _ und .' };
    if (/nexora/i.test(name) && !isOfficial(me())) return { error: 'Namen mit „Nexora“ sind für offizielle Accounts reserviert.' };
    if (findUserByName(name)) return { error: 'Der Name ist schon vergeben.' };
    const user = {
      id: id(),
      username: name,
      displayName: str(displayName, 32) || name,
      color: pick(ACCENTS),
      status: 'online',
      bio: '',
      createdAt: Date.now(),
      bot: true,
    };
    db.users[user.id] = user;
    db.bots[user.id] = {
      id: user.id,
      ownerId: userId,
      public: false,
      disabled: false,
      // A first command, so the bot answers something right away.
      commands: [lang === 'en'
        ? { id: id(), name: 'hello', description: 'Says hello', options: [], type: 'text', response: 'Hey {user}! 👋', script: '', ephemeral: false }
        : { id: id(), name: 'hallo', description: 'Sagt hallo', options: [], type: 'text', response: 'Hey {user}! 👋', script: '', ephemeral: false }],
      store: {},
      createdAt: Date.now(),
    };
    save();
    return { bot: botView(db.bots[user.id]) };
  });

  on('bot:update', ({ botId, displayName, bio, color, accessory, public: isPublic, clearStore }) => {
    const bot = ownBot(botId);
    if (!bot) return { error: 'Bot nicht gefunden.' };
    const user = db.users[bot.id];
    if (displayName !== undefined) {
      const name = str(displayName, 32);
      if (!name) return { error: 'Anzeigename darf nicht leer sein.' };
      user.displayName = name;
    }
    if (bio !== undefined) user.bio = str(bio, 190);
    if (color !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: 'Ungültige Farbe.' };
      user.color = color;
    }
    if (accessory !== undefined) {
      const acc = accessoryOf(accessory, user);
      if (acc === undefined) return { error: 'Dieses Accessoire kann dein Bot nicht tragen.' };
      user.accessory = acc;
    }
    if (isPublic !== undefined) bot.public = Boolean(isPublic);
    if (clearStore) bot.store = {};
    save();
    broadcastBot(bot);
    return { bot: botView(bot) };
  });

  on('bot:delete', ({ botId }) => {
    const bot = ownBot(botId);
    if (!bot) return { error: 'Bot nicht gefunden.' };
    deleteBot(bot);
    return {};
  });

  on('bot:command:save', ({ botId, command }) => {
    const bot = ownBot(botId);
    if (!bot) return { error: 'Bot nicht gefunden.' };
    const res = cleanCommand(command, bot);
    if (res.error) return res;
    const idx = bot.commands.findIndex((c) => c.id === res.command.id);
    if (idx >= 0) bot.commands[idx] = res.command;
    else if (bot.commands.length >= MAX_COMMANDS) return { error: `Maximal ${MAX_COMMANDS} Befehle pro Bot.` };
    else bot.commands.push(res.command);
    save();
    broadcastBot(bot);
    return { bot: botView(bot), command: res.command };
  });

  on('bot:command:delete', ({ botId, commandId }) => {
    const bot = ownBot(botId);
    if (!bot) return { error: 'Bot nicht gefunden.' };
    bot.commands = bot.commands.filter((c) => c.id !== commandId);
    save();
    broadcastBot(bot);
    return { bot: botView(bot) };
  });

  // Runs an (unsaved) command without posting anything and without changing the bot's store.
  on('bot:test', ({ botId, command, text }) => {
    const bot = ownBot(botId);
    if (!bot) return { error: 'Bot nicht gefunden.' };
    const res = cleanCommand(command, bot, { checkDuplicate: false });
    if (res.error) return res;
    if (rateLimited()) return { error: 'Langsam! Warte kurz.' };
    const input = str(text, MAX_MESSAGE);
    const { args, options, missing } = parseArgs(res.command, input);
    if (missing) return { replies: [], logs: [], scriptError: `Pflicht-Option „${missing.name}“ fehlt.` };
    const u = me();
    const botUser = db.users[bot.id];
    const ctx = {
      user: { id: u.id, username: u.username, displayName: u.displayName, mention: '@' + u.username },
      channel: { id: 'test', name: 'testkanal' },
      hub: { id: 'test', name: 'Testlauf', memberCount: 1 },
      bot: { id: bot.id, username: botUser.username, displayName: botUser.displayName },
      command: res.command.name,
      text: input,
      args,
      options,
    };
    // Not "error": that would mark the whole request as failed and drop the logs.
    const { replies, logs, error } = executeCommand(bot, res.command, ctx, { dryRun: true });
    return { replies, logs, scriptError: error };
  });

  on('bot:hub:add', ({ hubId, bot: wanted }) => {
    const hub = own(db.hubs, hubId);
    if (!hub || !canManage(hub, userId)) return { error: 'Nur wer den Hub verwaltet, kann Bots hinzufügen.' };
    const key = str(wanted, 32).replace(/^@/, '');
    const bot = own(db.bots, key) || own(db.bots, findUserByName(key)?.id);
    if (!bot || (bot.ownerId !== userId && !bot.public)) return { error: 'Bot nicht gefunden (oder er ist nicht öffentlich).' };
    if (bot.disabled) return { error: 'Dieser Bot wurde gesperrt.' };
    if (hub.members.includes(bot.id)) return { error: 'Der Bot ist schon in diesem Hub.' };
    if (hub.members.filter((m) => db.bots[m]).length >= MAX_BOTS_PER_HUB) return { error: `Maximal ${MAX_BOTS_PER_HUB} Bots pro Hub.` };
    hub.members.push(bot.id);
    save();
    const botUser = db.users[bot.id];
    io.to(`hub:${hub.id}`).emit('user:update', publicUser(botUser));
    io.to(`hub:${hub.id}`).emit('presence', { userId: bot.id, status: presenceOf(botUser) });
    io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
    return { bot: publicUser(botUser) };
  });

  on('bot:hub:remove', ({ hubId, botId }) => {
    const hub = own(db.hubs, hubId);
    const bot = own(db.bots, botId);
    if (!hub || !bot || !hub.members.includes(bot.id)) return { error: 'Bot nicht gefunden.' };
    if (!canManage(hub, userId) && bot.ownerId !== userId) return { error: 'Nicht erlaubt.' };
    hub.members = hub.members.filter((m) => m !== bot.id);
    save();
    io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
    return {};
  });

  // Built-in command of the Nexora Helper, for @nexora only. Commands that can't be undone
  // easily wait for /ja; the confirmed run (result.access/channelId) posts where it was typed.
  function runHelper(access, channelId, command, text) {
    if (helperLimited(userId)) return { error: `Langsam! Höchstens ${HELPER_RATE} Helper-Befehle pro Minute.` };
    const input = typeof text === 'string' ? text.trim().slice(0, MAX_MESSAGE) : '';
    const { options, missing } = parseArgs(command, input);
    const reply = (ephemeral) => ({ botId: HELPER_ID, command: command.name, ephemeral });
    if (missing) return reply([`Es fehlt „${missing.name}“. So geht's: \`${commandUsage(command)}\``]);
    if (command.confirm?.(options)) {
      helperPending.set(userId, { name: command.name, options, channelId, expires: Date.now() + CONFIRM_MS });
      return reply([`⚠️ **Bestätigung nötig:** \`/${command.name}${input ? ` ${input}` : ''}\` lässt sich nicht einfach rückgängig machen. Tippe \`/ja\` innerhalb von ${CONFIRM_MS / 1000} Sekunden oder \`/abbrechen\`.`]);
    }
    const result = command.run({ invoker: me(), access, channelId, options });
    const target = result.access || access;
    const targetChannel = result.channelId || channelId;
    const interaction = { userId, command: result.ran || command.name };
    (result.public || []).forEach((content, i) => postMessage(target, targetChannel, HELPER_ID, { content, interaction: i ? null : interaction }));
    return reply(result.ephemeral || []);
  }

  on('command:run', ({ channelId, botId, name, text }) => {
    const access = channelAccess(userId, channelId);
    if (!access || isVoice(channelId)) return { error: 'Befehle funktionieren nur in Textkanälen.' };
    const commandName = str(name, 33).toLowerCase().replace(/^\//, '');
    const inHub = access.type === 'hub' ? access.hub.members.map((m) => db.bots[m]).filter((b) => b && !b.disabled) : [];
    const has = (b) => b.commands.some((c) => c.name === commandName);
    const bot = inHub.find((b) => b.id === botId && has(b)) || inHub.find(has);
    const helperCommand = HELPER_COMMANDS.find((c) => c.name === commandName);
    if (helperCommand && isOwner(me()) && (botId === HELPER_ID || !bot)) return runHelper(access, channelId, helperCommand, text);
    // Nobody else sees the helper's commands; asking for it directly means a modified client.
    if (botId === HELPER_ID) {
      noteHelperDenied(me(), commandName);
      return { error: 'Der Nexora Helper gehört nur @nexora.' };
    }
    if (access.type !== 'hub') return { error: 'Befehle von Bots funktionieren nur in Hubs.' };
    const { hub } = access;
    if (!bot) return { error: `Unbekannter Befehl /${commandName}.` };
    const muted = muteError(me());
    if (muted) return { error: muted };
    if (rateLimited()) return { error: 'Langsam! Du sendest zu schnell.' };

    const command = bot.commands.find((c) => c.name === commandName);
    const input = typeof text === 'string' ? text.trim().slice(0, MAX_MESSAGE) : '';
    const { args, options, missing } = parseArgs(command, input);
    const botUser = db.users[bot.id];
    if (missing) return { botId: bot.id, ephemeral: [`Es fehlt „${missing.name}“. So geht's: \`${commandUsage(command)}\``] };
    const u = me();
    const ctx = {
      user: { id: u.id, username: u.username, displayName: u.displayName, mention: '@' + u.username },
      channel: { id: channelId, name: channelById(channelId).name },
      hub: { id: hub.id, name: hub.name, memberCount: hub.members.filter((m) => !isBotMember(m)).length },
      bot: { id: bot.id, username: botUser.username, displayName: botUser.displayName },
      command: command.name,
      text: input,
      args,
      options,
    };
    const { replies, error } = executeCommand(bot, command, ctx);
    const interaction = { userId, command: command.name };
    const ephemeral = [];
    let first = true;
    for (const r of replies) {
      if (r.ephemeral) ephemeral.push(r.text);
      else {
        postMessage(access, channelId, bot.id, { content: r.text, interaction: first ? interaction : null });
        first = false;
      }
    }
    if (error) ephemeral.push(`⚠️ Fehler im Befehl /${command.name}: ${error}`);
    else if (!replies.length) ephemeral.push(`/${command.name} hat nichts geantwortet.`);
    return { botId: bot.id, command: command.name, ephemeral };
  });

  // ----- Admin panel (official Nexora accounts only) -----

  const onAdmin = (event, handler) => on(event, (payload) => (isOfficial(me()) ? handler(payload) : { error: 'Nur für offizielle Nexora-Accounts.' }));

  onAdmin('admin:overview', () => ({
    version: VERSION,
    storage: MONGODB_URI ? 'MongoDB' : 'Datei (db.json)',
    startedAt: STARTED_AT,
    memory: process.memoryUsage().rss,
    dataSize: Buffer.byteLength(JSON.stringify(db)),
    counts: platformCounts(),
    announcement: db.announcement,
  }));

  onAdmin('admin:users', ({ query }) => {
    const q = str(query, 32).toLowerCase();
    const counts = new Map();
    for (const list of Object.values(db.messages)) for (const m of list) counts.set(m.authorId, (counts.get(m.authorId) || 0) + 1);
    const sessions = new Map();
    for (const s of Object.values(db.sessions)) sessions.set(s.userId, (sessions.get(s.userId) || 0) + 1);
    const hubs = Object.values(db.hubs);
    const users = Object.values(db.users)
      .filter((u) => !u.bot && !hiddenFrom(u, userId) && (!q || u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 100)
      .map((u) => ({
        ...publicUser(u),
        online: Boolean(online.get(u.id)),
        banned: u.banned || null,
        hubs: hubs.filter((h) => h.members.includes(u.id)).length,
        messages: counts.get(u.id) || 0,
        sessions: sessions.get(u.id) || 0,
        bots: Object.values(db.bots).filter((b) => b.ownerId === u.id).length,
      }));
    return { users, total: Object.values(db.users).filter((u) => !u.bot && !hiddenFrom(u, userId)).length };
  });

  onAdmin('admin:ban', ({ userId: targetId, reason }) => {
    const { target, error } = moderatable(own(db.users, targetId));
    if (error) return { error };
    banUser(target, reason, userId);
    audit(userId, 'ban', `@${target.username}${target.banned.reason ? ` – ${target.banned.reason}` : ''}`);
    return {};
  });

  onAdmin('admin:unban', ({ userId: targetId }) => {
    const { target, error } = moderatable(own(db.users, targetId));
    if (error) return { error };
    if (!isOwner(me())) return { error: 'Nur der Nexora-Owner kann Sperren aufheben.' };
    unbanUser(target);
    audit(userId, 'unban', `@${target.username}`);
    return {};
  });

  onAdmin('admin:logout', ({ userId: targetId }) => {
    const { target, error } = moderatable(own(db.users, targetId));
    if (error) return { error };
    endSessions(target.id, 'Du wurdest von einem Admin abgemeldet. Bitte melde dich neu an.');
    audit(userId, 'logout', `@${target.username}`);
    return {};
  });

  onAdmin('admin:resetPassword', ({ userId: targetId }) => {
    const { target, error } = moderatable(own(db.users, targetId));
    if (error) return { error };
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    const password = Array.from(crypto.randomBytes(10), (b) => chars[b % chars.length]).join('');
    const { salt, hash } = hashPassword(password);
    target.salt = salt;
    target.passHash = hash;
    endSessions(target.id, 'Dein Passwort wurde von einem Admin zurückgesetzt. Melde dich mit dem neuen Passwort an.');
    audit(userId, 'resetPassword', `@${target.username}`);
    return { password };
  });

  onAdmin('admin:hubs', () => {
    const hubs = Object.values(db.hubs)
      .map((h) => ({
        id: h.id,
        name: h.name,
        icon: h.icon,
        color: h.color,
        isLounge: Boolean(h.isLounge),
        inviteCode: h.inviteCode,
        owner: h.ownerId && db.users[h.ownerId] ? publicUser(db.users[h.ownerId]) : null,
        members: h.members.filter((m) => !isBotMember(m)).length,
        bots: h.members.filter(isBotMember).length,
        channels: h.channels.length,
        messages: h.channels.reduce((n, c) => n + (db.messages[c.id]?.length || 0), 0),
        createdAt: h.createdAt,
      }))
      .sort((a, b) => b.members - a.members);
    return { hubs };
  });

  onAdmin('admin:deleteHub', ({ hubId }) => {
    const hub = own(db.hubs, hubId);
    if (!hub) return { error: 'Hub nicht gefunden.' };
    if (hub.isLounge) return { error: 'Die Nexora Lounge kann nicht gelöscht werden.' };
    deleteHub(hub);
    audit(userId, 'deleteHub', hub.name);
    return {};
  });

  onAdmin('admin:bots', () => {
    const list = Object.values(db.bots)
      .map((b) => ({
        ...publicUser(db.users[b.id]),
        public: Boolean(b.public),
        owner: db.users[b.ownerId] ? publicUser(db.users[b.ownerId]) : null,
        scripts: b.commands.filter((c) => c.type === 'script').length,
        hubs: botHubs(b.id).length,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
    return { bots: list };
  });

  onAdmin('admin:botDisable', ({ botId, disabled }) => {
    const bot = own(db.bots, botId);
    if (!bot) return { error: 'Bot nicht gefunden.' };
    bot.disabled = Boolean(disabled);
    broadcastBot(bot);
    audit(userId, bot.disabled ? 'botDisable' : 'botEnable', `@${db.users[bot.id].username}`);
    return {};
  });

  onAdmin('admin:deleteBot', ({ botId }) => {
    const bot = own(db.bots, botId);
    if (!bot) return { error: 'Bot nicht gefunden.' };
    const name = db.users[bot.id].username;
    deleteBot(bot);
    audit(userId, 'deleteBot', `@${name}`);
    return {};
  });

  onAdmin('admin:announce', ({ text }) => {
    const announcement = setAnnouncement(text);
    audit(userId, announcement ? 'announce' : 'announceClear', announcement?.text || '');
    return { announcement };
  });

  // ----- Owner tools (@nexora only) -----

  const onOwner = (event, handler) => on(event, (payload) => (isOwner(me()) ? handler(payload) : { error: 'Nur für den Nexora-Owner.' }));

  // Everything the owner controls in one place: team, maintenance and the log.
  onOwner('owner:state', () => {
    const humans = Object.values(db.users).filter((u) => !u.bot);
    return {
      team: humans
        .filter((u) => isOfficial(u))
        .map((u) => ({ ...publicUser(u), fixed: OFFICIAL.has(u.username.toLowerCase()), online: Boolean(online.get(u.id)) })),
      maintenance: db.maintenance,
      retention: { ...retention(), ...messageStats(), dayOptions: RETENTION_DAYS, maxOptions: RETENTION_MAX },
      audit: (db.audit || []).slice(-150).reverse().map((e) => ({ ...e, user: e.by && db.users[e.by] ? publicUser(db.users[e.by]) : null })),
    };
  });

  // Makes someone official (team) or takes it away. Accounts from NEXORA_OFFICIAL stay.
  onOwner('owner:setOfficial', ({ username, official }) => {
    const target = findUserByName(str(username, 32).replace(/^@/, ''));
    if (!target || target.bot) return { error: 'Benutzer nicht gefunden.' };
    const name = target.username.toLowerCase();
    if (OFFICIAL.has(name)) return { error: 'Dieser Account ist fest offiziell (NEXORA_OFFICIAL).' };
    if (official && target.banned) return { error: 'Gesperrte Accounts können nicht ins Team.' };
    if (!Array.isArray(db.team)) db.team = [];
    db.team = db.team.filter((n) => n !== name);
    if (official) db.team.push(name);
    audit(userId, official ? 'teamAdd' : 'teamRemove', `@${target.username}`);
    broadcastToVisible(target.id, 'user:update', publicUser(target));
    io.to(`user:${target.id}`).emit('user:update', publicUser(target));
    return { user: publicUser(target) };
  });

  onOwner('owner:maintenance', ({ enabled, text }) => {
    setMaintenance(enabled, text, userId);
    return { maintenance: db.maintenance };
  });

  // How long messages are kept; cleans up right away with the new values.
  onOwner('owner:retention', ({ days, max }) => {
    if (!RETENTION_DAYS.includes(days) || !RETENTION_MAX.includes(max)) return { error: 'Ungültige Einstellung.' };
    db.retention = { days, max };
    save();
    const removed = pruneMessages();
    audit(userId, 'retention', `${days ? `${days} Tage` : 'für immer'} · max. ${max} pro Kanal${removed ? ` · ${removed} gelöscht` : ''}`);
    return { removed, retention: { ...retention(), ...messageStats() } };
  });

  // A message that pops up right now for everyone who is online.
  onOwner('owner:broadcast', ({ text }) => {
    const content = str(text, 300);
    if (!content) return { error: 'Schreib zuerst einen Text.' };
    io.emit('owner:broadcast', { text: content, from: publicUser(me()), at: Date.now() });
    audit(userId, 'broadcast', content);
    return { reached: online.size };
  });

  // Hands a hub to someone else (also to the owner). They join it if they are not a member yet.
  onOwner('owner:hubOwner', ({ hubId, username }) => {
    const hub = own(db.hubs, hubId);
    if (!hub) return { error: 'Hub nicht gefunden.' };
    if (hub.isLounge) return { error: 'Die Nexora Lounge gehört Nexora.' };
    const target = findUserByName(str(username, 32).replace(/^@/, ''));
    if (!target || target.bot) return { error: 'Benutzer nicht gefunden.' };
    if (target.banned) return { error: 'Gesperrte Accounts können keinen Hub besitzen.' };
    if (!hub.members.includes(target.id)) {
      hub.members.push(target.id);
      io.in(`user:${target.id}`).socketsJoin(`hub:${hub.id}`);
      io.to(`hub:${hub.id}`).emit('user:update', publicUser(target));
    }
    hub.ownerId = target.id;
    io.to(`hub:${hub.id}`).emit('hub:update', hubView(hub));
    audit(userId, 'hubOwner', `${hub.name} → @${target.username}`);
    return {};
  });

  // Halloween Edition: the ghost hunt counter belongs to the account. Ghosts appear at
  // most every 15 seconds, so faster catches are ignored.
  let lastGhost = 0;
  on('halloween:ghost', ({ golden }) => {
    const user = me();
    const now = Date.now();
    if (now - lastGhost >= GHOST_COOLDOWN) {
      lastGhost = now;
      const value = golden ? 3 : 1;
      user.ghosts = (user.ghosts || 0) + value;
      user.ghostsCaught = (user.ghostsCaught || 0) + value;
      save();
    }
    return { ghosts: user.ghosts || 0, ghostsCaught: user.ghostsCaught || 0 };
  });

  // Counters from before V0.1.5.5 lived on the device; they are taken over once.
  on('halloween:sync', ({ count }) => {
    const user = me();
    if (!user.ghostsSynced) {
      user.ghostsSynced = true;
      const local = Number.isInteger(count) ? Math.min(Math.max(count, 0), MAX_SYNCED_GHOSTS) : 0;
      user.ghosts = Math.max(user.ghosts || 0, local);
      user.ghostsCaught = Math.max(user.ghostsCaught || 0, user.ghosts);
      save();
    }
    return { ghosts: user.ghosts || 0, ghostsCaught: user.ghostsCaught || 0 };
  });

  // Geister-Laden: the price is taken from the ghosts, the accessory stays forever and is put on.
  on('shop:buy', ({ item }) => {
    const user = me();
    if (user.bot || typeof item !== 'string' || !Object.hasOwn(SHOP, item)) return { error: 'Diese Dekoration gibt es im Laden nicht.' };
    if (owns(user, item)) return { error: 'Diese Dekoration gehört dir schon.' };
    const price = SHOP[item];
    if ((user.ghosts || 0) < price) return { error: 'Dafür hast du nicht genug Geister.' };
    user.ghosts -= price;
    user.owned = [...(Array.isArray(user.owned) ? user.owned : []), item];
    user.accessory = item;
    save();
    broadcastToVisible(userId, 'user:update', publicUser(user));
    return { user: publicUser(user) };
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
  ensureHelper();
  grantExclusives();
  pruneMessages();
  setInterval(pruneMessages, 60 * 60 * 1000);
  await botRuntime.ready;
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
