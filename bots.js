'use strict';

// ---------------------------------------------------------------------------
// Bot commands: a command either answers with a text template or runs a small
// JavaScript script. Scripts run in QuickJS (WebAssembly), a separate JS engine
// without access to the server, files, network or environment variables.
// ---------------------------------------------------------------------------

const { getQuickJS, shouldInterruptAfterDeadline } = require('quickjs-emscripten');

const SCRIPT_TIMEOUT = 250; // ms of CPU time a single run may take
const SCRIPT_MEMORY = 16 * 1024 * 1024;
const MAX_STORE = 32 * 1024; // bytes of JSON a bot may keep in its store
const MAX_REPLIES = 3;
const MAX_LOGS = 50;
const MAX_REPLY = 2000;

let quickjs = null;
const ready = getQuickJS().then((q) => (quickjs = q));

// Defines the API scripts can use. `__host` is the only bridge to the server and
// just collects output; everything else is plain JavaScript inside the sandbox.
const PRELUDE = `
const ctx = JSON.parse(__ctxJson);
const __store = JSON.parse(__storeJson);
const __text = (v) => typeof v === 'string' ? v : v === undefined ? 'undefined' : (() => { try { return JSON.stringify(v); } catch { return String(v); } })();
function reply(...parts) { __host('reply', parts.map(__text).join(' ')); }
function whisper(...parts) { __host('whisper', parts.map(__text).join(' ')); }
const console = { log: (...a) => __host('log', a.map(__text).join(' ')) };
console.info = console.warn = console.error = console.log;
function random(min, max) {
  if (max === undefined) { max = min === undefined ? 1 : min; min = min === undefined ? 0 : 1; }
  return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
}
function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
const store = Object.freeze({
  get: (key, fallback) => (Object.prototype.hasOwnProperty.call(__store, key) ? __store[key] : fallback),
  set: (key, value) => { __store[String(key)] = JSON.parse(JSON.stringify(value === undefined ? null : value)); return value; },
  delete: (key) => delete __store[key],
  keys: () => Object.keys(__store),
});
`;

/**
 * Runs a command script.
 * @returns {{ replies: {text, ephemeral}[], logs: string[], store: object|null, error: string|null }}
 *          `store` is the new store, or null when it did not change or the run failed.
 */
function runScript(code, ctx, storeData) {
  if (!quickjs) return { replies: [], logs: [], store: null, error: 'Die Skript-Engine startet gerade. Versuch es gleich nochmal.' };
  const replies = [];
  const logs = [];
  const runtime = quickjs.newRuntime();
  runtime.setMemoryLimit(SCRIPT_MEMORY);
  runtime.setMaxStackSize(512 * 1024);
  const vm = runtime.newContext();
  try {
    const host = vm.newFunction('__host', (kindHandle, textHandle) => {
      const kind = vm.getString(kindHandle);
      const text = vm.getString(textHandle);
      if (kind === 'log') {
        if (logs.length < MAX_LOGS) logs.push(text.slice(0, 500));
      } else if (replies.length < MAX_REPLIES && text.trim()) {
        replies.push({ text: text.trim().slice(0, MAX_REPLY), ephemeral: kind === 'whisper' });
      }
    });
    vm.setProp(vm.global, '__host', host);
    host.dispose();
    for (const [name, value] of [['__ctxJson', JSON.stringify(ctx)], ['__storeJson', JSON.stringify(storeData || {})]]) {
      const handle = vm.newString(value);
      vm.setProp(vm.global, name, handle);
      handle.dispose();
    }

    const before = JSON.stringify(storeData || {});
    runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + SCRIPT_TIMEOUT));
    // The user code becomes a function body, so `return "text"` answers too.
    const result = vm.evalCode(`${PRELUDE}\n;(function () {\n${code}\n})()`, 'befehl.js');
    if (result.error) {
      const err = vm.dump(result.error);
      result.error.dispose();
      return { replies, logs, store: null, error: describeError(err) };
    }
    const value = vm.dump(result.value);
    result.value.dispose();
    if (value !== undefined && value !== null && replies.length < MAX_REPLIES) {
      const text = (typeof value === 'string' ? value : JSON.stringify(value)).trim();
      if (text) replies.push({ text: text.slice(0, MAX_REPLY), ephemeral: false });
    }

    runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + SCRIPT_TIMEOUT));
    const saved = vm.evalCode('JSON.stringify(__store)');
    if (saved.error) {
      saved.error.dispose();
      return { replies, logs, store: null, error: null };
    }
    const after = vm.dump(saved.value);
    saved.value.dispose();
    if (after === before) return { replies, logs, store: null, error: null };
    if (Buffer.byteLength(after) > MAX_STORE) {
      return { replies, logs, store: null, error: `Der Speicher des Bots ist voll (max. ${MAX_STORE / 1024} KB). Änderungen wurden verworfen.` };
    }
    return { replies, logs, store: JSON.parse(after), error: null };
  } catch (err) {
    return { replies, logs, store: null, error: describeError(err) };
  } finally {
    vm.dispose();
    runtime.dispose();
  }
}

function describeError(err) {
  if (!err || typeof err !== 'object') return String(err);
  if (err.message === 'interrupted') return `Das Skript hat zu lange gebraucht (max. ${SCRIPT_TIMEOUT} ms).`;
  if (/out of memory/i.test(err.message || '')) return 'Das Skript hat zu viel Speicher verbraucht.';
  // Line numbers refer to the user's code: the prelude and the wrapper line come first.
  const offset = PRELUDE.split('\n').length + 1;
  const line = /befehl\.js:(\d+)/.exec(err.stack || '');
  const where = line && Number(line[1]) > offset ? ` (Zeile ${Number(line[1]) - offset})` : '';
  return `${err.name || 'Fehler'}: ${err.message || 'Unbekannter Fehler'}${where}`;
}

/**
 * Fills a text template such as "Hey {user}, du würfelst {random:1-6}!".
 */
function renderTemplate(template, ctx) {
  return template.replace(/\{([a-zA-Z0-9äöüÄÖÜß_-]+)(?::([^{}]*))?\}/g, (whole, key, arg) => {
    switch (key) {
      case 'user': return ctx.user.displayName;
      case 'mention': return '@' + ctx.user.username;
      case 'username': return ctx.user.username;
      case 'args': return ctx.text;
      case 'channel': return ctx.channel.name;
      case 'hub': return ctx.hub ? ctx.hub.name : '';
      case 'random': {
        const m = /^\s*(-?\d+)\s*-\s*(-?\d+)\s*$/.exec(arg || '');
        const [min, max] = m ? [Number(m[1]), Number(m[2])] : [1, 100];
        const lo = Math.min(min, max), hi = Math.max(min, max);
        return String(lo + Math.floor(Math.random() * (hi - lo + 1)));
      }
      case 'choose': {
        const list = (arg || '').split('|').map((s) => s.trim()).filter(Boolean);
        return list.length ? list[Math.floor(Math.random() * list.length)] : '';
      }
      default:
        if (/^\d+$/.test(key)) return ctx.args[Number(key) - 1] ?? '';
        if (Object.prototype.hasOwnProperty.call(ctx.options, key)) return ctx.options[key];
        return whole;
    }
  });
}

module.exports = { ready, runScript, renderTemplate, MAX_REPLIES, SCRIPT_TIMEOUT };
