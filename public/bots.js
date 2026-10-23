'use strict';

/* =========================================================================
   Bots: create bots, give them slash commands and write their scripts.
   Uses the helpers from app.js (req, openModal, h, esc, avatar, …).
   ========================================================================= */

const MAX_BOT_COMMANDS = 25;
const MAX_BOT_OPTIONS = 5;

const SCRIPT_EXAMPLES = [
  {
    label: '🎲 Würfel',
    options: [{ name: 'seiten', description: 'Wie viele Seiten hat der Würfel?', required: false }],
    script: `// /wuerfel [seiten]
const seiten = Number(ctx.options.seiten) || 6;
if (seiten < 2 || seiten > 1000) return whisper('Bitte eine Zahl zwischen 2 und 1000.');
return \`🎲 \${ctx.user.displayName} würfelt eine **\${random(1, seiten)}** (1–\${seiten})\`;`,
  },
  {
    label: '🎱 8-Ball',
    options: [{ name: 'frage', description: 'Deine Frage an die Kugel', required: true }],
    script: `const antworten = ['Ja!', 'Auf keinen Fall.', 'Frag später nochmal.', 'Sieht gut aus 🔮', 'Eher nicht.', 'Ganz sicher!'];
return \`🎱 „\${ctx.options.frage}“ – \${pick(antworten)}\`;`,
  },
  {
    label: '⭐ Punkte',
    options: [],
    script: `// Jede Person sammelt Punkte – sie bleiben gespeichert.
const punkte = store.get('punkte', {});
punkte[ctx.user.id] = (punkte[ctx.user.id] || 0) + 1;
store.set('punkte', punkte);
return \`\${ctx.user.mention} hat jetzt **\${punkte[ctx.user.id]}** Punkte ⭐\`;`,
  },
  {
    label: '🔢 Zähler',
    options: [],
    script: `const n = store.get('zaehler', 0) + 1;
store.set('zaehler', n);
reply(\`Dieser Befehl wurde schon \${n}-mal benutzt!\`);
whisper('Psst – nur du siehst diese Nachricht.');`,
  },
];

// Two-step button for destructive actions: the first click arms it, the second runs it.
function armButton(btn, armedLabel, action) {
  const label = btn.innerHTML;
  let timer = null;
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!btn.classList.contains('armed')) {
      btn.classList.add('armed');
      btn.textContent = armedLabel;
      timer = setTimeout(() => { btn.classList.remove('armed'); btn.innerHTML = label; }, 3500);
      return;
    }
    clearTimeout(timer);
    btn.disabled = true;
    try {
      await action();
    } catch (ex) {
      toast(ex.message, 'error');
    } finally {
      btn.disabled = false;
      btn.classList.remove('armed');
      if (btn.isConnected) btn.innerHTML = label;
    }
  });
}

async function loadBot(botId) {
  const { bots } = await req('bot:list');
  return bots.find((b) => b.id === botId) || null;
}

/* ---------- bot list ---------- */

async function openBotManager() {
  closePopover();
  let bots;
  try {
    ({ bots } = await req('bot:list'));
  } catch (ex) {
    return toast(ex.message, 'error');
  }
  const { modal, close } = openModal(`
    <div class="bm-hero"><span class="bm-ico">${ICONS.bot}</span><div><h3>Meine Bots</h3>
      <p class="sub">Bots antworten in Hubs auf Slash-Befehle wie <code>/wuerfel</code> – mit festem Text oder einem eigenen Skript.</p></div></div>
    <div class="bot-cards"></div>
    <form class="bot-create">
      <div class="field"><span>Neuen Bot erstellen</span></div>
      <div class="bot-create-row">
        <input class="input" name="username" maxlength="20" required placeholder="Name, z. B. wuerfelbot" autocomplete="off" />
        <input class="input" name="displayName" maxlength="32" placeholder="Anzeigename (optional)" autocomplete="off" />
        <button type="submit" class="btn primary">${ICONS.plus} Erstellen</button>
      </div>
      <p class="form-error"></p>
    </form>
    <div class="modal-actions"><button class="btn" data-close>Schließen</button></div>`, { className: 'wide' });

  const cards = modal.querySelector('.bot-cards');
  if (!bots.length) cards.innerHTML = '<div class="empty-hint">Du hast noch keinen Bot. Leg unten deinen ersten an – er bekommt gleich einen <code>/hallo</code>-Befehl.</div>';
  for (const bot of bots) {
    const card = h(`<button class="bot-card" style="--c:${esc(bot.color)}">
      ${avatar(bot, { size: 44 })}
      <span class="info"><span class="name">${esc(bot.displayName)}${verified(bot)}</span>
        <span class="bio">@${esc(bot.username)} · ${bot.commands.length} Befehl${bot.commands.length === 1 ? '' : 'e'} · ${bot.hubs.length} Hub${bot.hubs.length === 1 ? '' : 's'}</span></span>
      ${bot.disabled ? '<span class="pill danger">Gesperrt</span>' : bot.public ? '<span class="pill">Öffentlich</span>' : ''}
      ${ICONS.edit}
    </button>`);
    card.onclick = () => { close(); openBotEditor(bot.id); };
    cards.append(card);
  }

  const form = modal.querySelector('.bot-create');
  if (bots.length >= 5) form.classList.add('hidden');
  form.onsubmit = (e) => {
    e.preventDefault();
    submitting(form, async () => {
      const { bot } = await req('bot:create', { username: form.username.value.trim(), displayName: form.displayName.value.trim() });
      close();
      toast(`${bot.displayName} ist bereit!`);
      openBotEditor(bot.id, 'hubs');
    });
  };
}

/* ---------- one bot ---------- */

async function openBotEditor(botId, tab = 'commands') {
  closePopover();
  let bot;
  try {
    bot = await loadBot(botId);
  } catch (ex) {
    return toast(ex.message, 'error');
  }
  if (!bot) return toast('Bot nicht gefunden.', 'error');

  const { modal, close } = openModal(`
    <div class="be-head"></div>
    <div class="tabs" role="tablist">
      <button type="button" data-tab="commands">Befehle</button>
      <button type="button" data-tab="hubs">Hubs</button>
      <button type="button" data-tab="profile">Profil</button>
    </div>
    <div class="tab-body"></div>
    <div class="modal-actions"><button class="btn" data-act="back">← Alle Bots</button><span class="spacer"></span><button class="btn" data-close>Schließen</button></div>`, { className: 'wide' });
  const body = modal.querySelector('.tab-body');
  modal.querySelector('[data-act=back]').onclick = () => { close(); openBotManager(); };

  const renderHead = () => {
    modal.querySelector('.be-head').innerHTML = `${avatar(bot, { size: 52 })}
      <div><h3>${esc(bot.displayName)}${verified(bot)}</h3>
      <p class="sub">@${esc(bot.username)} · ${bot.public ? 'Öffentlich' : 'Privat'}${bot.disabled ? ' · <b class="warn">von Nexora gesperrt</b>' : ''}</p></div>`;
  };
  const update = (fresh) => {
    bot = fresh;
    renderHead();
    show(tab);
  };

  const views = {
    commands() {
      body.innerHTML = `${bot.disabled ? '<div class="notice danger">Dieser Bot wurde gesperrt und antwortet gerade nicht auf Befehle.</div>' : ''}
        <div class="cmd-list"></div>
        <button class="btn" data-act="add" ${bot.commands.length >= MAX_BOT_COMMANDS ? 'disabled' : ''}>${ICONS.plus} Befehl hinzufügen</button>`;
      const list = body.querySelector('.cmd-list');
      if (!bot.commands.length) list.innerHTML = '<div class="empty-hint">Noch keine Befehle.</div>';
      for (const c of bot.commands) {
        const row = h(`<div class="cmd-row">
          <div class="info"><div class="name"><code>${esc(commandUsage(c))}</code></div><div class="bio">${esc(c.description || 'Keine Beschreibung')}</div></div>
          <span class="pill">${c.type === 'script' ? 'Skript' : 'Text'}</span>
          ${c.ephemeral ? '<span class="pill">Nur für dich</span>' : ''}
          <button class="icon-btn" data-act="edit" title="Bearbeiten">${ICONS.edit}</button>
          <button class="icon-btn danger" data-act="delete" title="Löschen">${ICONS.trash}</button>
        </div>`);
        row.querySelector('[data-act=edit]').onclick = () => { close(); openCommandEditor(bot, c); };
        armButton(row.querySelector('[data-act=delete]'), 'Löschen?', async () => {
          const res = await req('bot:command:delete', { botId: bot.id, commandId: c.id });
          update(res.bot);
          toast(`/${c.name} gelöscht`);
        });
        list.append(row);
      }
      body.querySelector('[data-act=add]').onclick = () => { close(); openCommandEditor(bot, null); };
    },

    hubs() {
      const manageable = [...state.hubs.values()].filter((hub) => isAdmin(hub, state.me.id) && !bot.hubs.some((x) => x.id === hub.id));
      body.innerHTML = `<p class="hint">Der Bot antwortet in allen Textkanälen der Hubs, in denen er ist.${bot.public ? ' Weil er öffentlich ist, können ihn auch andere Hub-Besitzer über seinen Namen hinzufügen.' : ''}</p>
        <div class="hub-bot-list"></div>
        ${manageable.length ? `<div class="bot-add-row"><select class="input" name="hub">${manageable.map((hub) => `<option value="${esc(hub.id)}">${esc(hub.icon ? hub.icon + ' ' : '')}${esc(hub.name)}</option>`).join('')}</select>
          <button class="btn primary" data-act="add">${ICONS.plus} Zum Hub hinzufügen</button></div>`
        : '<p class="hint">Du verwaltest keinen weiteren Hub. Erstelle einen Hub, um den Bot dort einzusetzen.</p>'}`;
      const list = body.querySelector('.hub-bot-list');
      if (!bot.hubs.length) list.innerHTML = '<div class="empty-hint">Der Bot ist noch in keinem Hub.</div>';
      for (const hub of bot.hubs) {
        const row = h(`<div class="cmd-row"><span class="hub-ico">${esc(hub.icon || initials(hub.name))}</span>
          <div class="info"><div class="name">${esc(hub.name)}</div></div>
          <button class="btn" data-act="remove">Entfernen</button></div>`);
        armButton(row.querySelector('[data-act=remove]'), 'Wirklich entfernen?', async () => {
          await req('bot:hub:remove', { hubId: hub.id, botId: bot.id });
          update(await loadBot(bot.id));
        });
        list.append(row);
      }
      body.querySelector('[data-act=add]')?.addEventListener('click', async () => {
        try {
          await addBotToHub(body.querySelector('[name=hub]').value, bot.id);
          update(await loadBot(bot.id));
        } catch (ex) {
          toast(ex.message, 'error');
        }
      });
    },

    profile() {
      body.innerHTML = `<form>
        <label class="field"><span>Anzeigename</span><input name="displayName" maxlength="32" required /></label>
        <label class="field"><span>Beschreibung <em>(optional)</em></span><textarea name="bio" maxlength="190" rows="3" placeholder="Was kann dein Bot?"></textarea></label>
        <div class="field"><span>Farbe</span></div>
        <div class="color-row">${ACCENTS.map((c) => `<button type="button" class="swatch ${c === bot.color ? 'sel' : ''}" style="--c:${c}" data-c="${c}"></button>`).join('')}
          <input type="color" value="${esc(bot.color)}" title="Eigene Farbe" /></div>
        <div class="field"><span>Halloween-Accessoire 🎃</span></div>
        <div class="acc-row"></div>
        <label class="check-row"><input type="checkbox" name="public" /><span>Öffentlich – andere Hub-Besitzer dürfen den Bot über seinen Namen <b>@${esc(bot.username)}</b> hinzufügen</span></label>
        <p class="form-error"></p>
        <div class="modal-actions"><button type="submit" class="btn primary">Speichern</button></div>
      </form>
      <hr />
      <div class="field"><span>Speicher</span></div>
      <p class="hint">Skripte können mit <code>store</code> Daten dauerhaft ablegen. Belegt: <b>${formatSize(bot.storeSize)}</b> von 32 KB.</p>
      <div class="modal-actions" style="justify-content:flex-start">
        <button class="btn" data-act="clear" ${bot.storeSize <= 2 ? 'disabled' : ''}>Speicher leeren</button>
        <span class="spacer"></span>
        <button class="btn danger" data-act="delete">${ICONS.trash} Bot löschen</button>
      </div>`;
      const form = body.querySelector('form');
      form.displayName.value = bot.displayName;
      form.bio.value = bot.bio || '';
      form.public.checked = bot.public;
      let color = bot.color;
      const accessory = accessoryPicker(form.querySelector('.acc-row'), bot);
      const picker = form.querySelector('input[type=color]');
      form.querySelector('.color-row').addEventListener('click', (e) => {
        const s = e.target.closest('.swatch');
        if (!s) return;
        color = s.dataset.c;
        picker.value = color;
        form.querySelectorAll('.swatch').forEach((x) => x.classList.toggle('sel', x === s));
      });
      picker.addEventListener('input', () => {
        color = picker.value;
        form.querySelectorAll('.swatch').forEach((x) => x.classList.remove('sel'));
      });
      form.onsubmit = (e) => {
        e.preventDefault();
        submitting(form, async () => {
          const res = await req('bot:update', { botId: bot.id, displayName: form.displayName.value, bio: form.bio.value, color, accessory: accessory(), public: form.public.checked });
          update(res.bot);
          toast('Bot gespeichert');
        });
      };
      armButton(body.querySelector('[data-act=clear]'), 'Wirklich leeren?', async () => {
        const res = await req('bot:update', { botId: bot.id, clearStore: true });
        update(res.bot);
        toast('Speicher geleert');
      });
      armButton(body.querySelector('[data-act=delete]'), 'Endgültig löschen?', async () => {
        await req('bot:delete', { botId: bot.id });
        close();
        toast(`${bot.displayName} wurde gelöscht`);
        openBotManager();
      });
    },
  };

  const show = (name) => {
    tab = name;
    modal.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    views[name]();
  };
  modal.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) show(b.dataset.tab);
  });
  renderHead();
  show(tab);
}

/* ---------- one command ---------- */

function openCommandEditor(bot, command) {
  const draft = command
    ? JSON.parse(JSON.stringify(command))
    : { name: '', description: '', options: [], type: 'text', response: '', script: '', ephemeral: false };

  const { modal, close } = openModal(`
    <h3>${command ? `/${esc(command.name)} bearbeiten` : 'Neuer Befehl'}</h3>
    <p class="sub">für ${esc(bot.displayName)}</p>
    <form>
      <div class="cmd-grid">
        <label class="field"><span>Name</span><span class="prefix-input"><b>/</b><input name="name" maxlength="32" required placeholder="wuerfel" autocomplete="off" /></span></label>
        <label class="field"><span>Beschreibung</span><input name="description" maxlength="100" placeholder="Was macht der Befehl?" /></label>
      </div>
      <div class="field"><span>Optionen <em>– werden der Reihe nach ausgefüllt, die letzte bekommt den ganzen Rest</em></span></div>
      <div class="opt-list"></div>
      <button type="button" class="btn small" data-act="add-opt">${ICONS.plus} Option</button>

      <div class="field" style="margin-top:18px"><span>Antwort</span></div>
      <div class="kind-row two">
        <button type="button" class="kind-opt" data-type="text"><b>T</b><span><strong>Text</strong><small>Feste Antwort mit Platzhaltern</small></span></button>
        <button type="button" class="kind-opt" data-type="script"><b>{ }</b><span><strong>Skript</strong><small>Eigenes JavaScript</small></span></button>
      </div>
      <div class="type-text">
        <label class="field"><textarea name="response" maxlength="2000" rows="4" placeholder="Hey {user}, du würfelst eine {random:1-6}! 🎲"></textarea></label>
        <p class="hint">Platzhalter: <code>{user}</code> Name · <code>{mention}</code> @Erwähnung · <code>{args}</code> ganzer Text · <code>{1}</code>, <code>{2}</code> einzelne Wörter ·
          <code>{name}</code> Wert einer Option · <code>{random:1-6}</code> Zufallszahl · <code>{choose:Ja|Nein}</code> Zufallswahl · <code>{channel}</code> · <code>{hub}</code></p>
      </div>
      <div class="type-script">
        <div class="script-bar"><span>Beispiele:</span>${SCRIPT_EXAMPLES.map((x, i) => `<button type="button" class="chip" data-example="${i}">${esc(x.label)}</button>`).join('')}</div>
        <textarea class="code" name="script" spellcheck="false" autocomplete="off" rows="12" placeholder="return \`Hallo \${ctx.user.displayName}!\`;"></textarea>
        <details class="script-docs"><summary>Was kann ein Skript?</summary>
          <ul>
            <li><code>ctx.user</code> – wer den Befehl nutzt: <code>id</code>, <code>username</code>, <code>displayName</code>, <code>mention</code></li>
            <li><code>ctx.text</code> – alles nach dem Befehl · <code>ctx.args</code> – die einzelnen Wörter · <code>ctx.options.name</code> – eine Option</li>
            <li><code>ctx.channel</code>, <code>ctx.hub</code> (<code>name</code>, <code>memberCount</code>), <code>ctx.bot</code></li>
            <li><code>reply(text)</code> – schreibt in den Kanal (bis zu 3-mal) · <code>return text</code> macht dasselbe</li>
            <li><code>whisper(text)</code> – Antwort, die nur die Person sieht</li>
            <li><code>random(1, 6)</code>, <code>pick(liste)</code> – Zufall</li>
            <li><code>store.get(key, standard)</code>, <code>store.set(key, wert)</code>, <code>store.delete(key)</code>, <code>store.keys()</code> – dauerhaft gespeichert (max. 32 KB)</li>
            <li><code>console.log(…)</code> – erscheint nur beim Testen</li>
          </ul>
          <p class="hint">Skripte laufen abgeschottet auf dem Server: max. 250 ms, kein Internet, keine Dateien. Formatierung wie im Chat (<code>**fett**</code>, <code>@name</code> …) funktioniert.</p>
        </details>
      </div>
      <label class="check-row" style="margin-top:14px"><input type="checkbox" name="ephemeral" /><span>Antwort nur für die Person sichtbar, die den Befehl nutzt</span></label>

      <div class="test-box">
        <div class="field"><span>Testen <em>– nichts wird gepostet oder gespeichert</em></span></div>
        <div class="test-row"><code class="test-cmd">/</code><input class="input" name="testText" placeholder="Eingabe nach dem Befehl" autocomplete="off" />
          <button type="button" class="btn" data-act="test">${ICONS.play} Testen</button></div>
        <div class="test-out hidden"></div>
      </div>
      <p class="form-error"></p>
      <div class="modal-actions"><button type="button" class="btn" data-act="back">Abbrechen</button><button type="submit" class="btn primary">Speichern</button></div>
    </form>`, { className: 'wide' });

  const form = modal.querySelector('form');
  const optList = modal.querySelector('.opt-list');
  form.name.value = draft.name;
  form.description.value = draft.description;
  form.response.value = draft.response;
  form.script.value = draft.script;
  form.ephemeral.checked = draft.ephemeral;

  const syncName = () => {
    modal.querySelector('.test-cmd').textContent = '/' + (form.name.value || 'befehl');
  };
  form.name.addEventListener('input', () => {
    const pos = form.name.selectionStart;
    form.name.value = form.name.value.toLowerCase().replace(/\s/g, '-').replace(/^\//, '');
    form.name.setSelectionRange(pos, pos);
    syncName();
  });
  syncName();

  const addOption = (o = { name: '', description: '', required: false }) => {
    const row = h(`<div class="opt-row">
      <input class="input" data-k="name" maxlength="20" placeholder="name" autocomplete="off" />
      <input class="input" data-k="description" maxlength="60" placeholder="Beschreibung (optional)" autocomplete="off" />
      <label class="mini-check"><input type="checkbox" data-k="required" /> Pflicht</label>
      <button type="button" class="icon-btn" title="Entfernen">${ICONS.x}</button>
    </div>`);
    row.querySelector('[data-k=name]').value = o.name;
    row.querySelector('[data-k=description]').value = o.description;
    row.querySelector('[data-k=required]').checked = o.required;
    row.querySelector('button').onclick = () => { row.remove(); syncOptions(); };
    optList.append(row);
    syncOptions();
  };
  const syncOptions = () => {
    const n = optList.children.length;
    modal.querySelector('[data-act=add-opt]').classList.toggle('hidden', n >= MAX_BOT_OPTIONS);
    if (!n) optList.innerHTML = '';
  };
  draft.options.forEach(addOption);
  syncOptions();
  modal.querySelector('[data-act=add-opt]').onclick = () => addOption();

  let type = draft.type;
  const applyType = () => {
    modal.querySelectorAll('[data-type]').forEach((b) => b.classList.toggle('sel', b.dataset.type === type));
    modal.querySelector('.type-text').classList.toggle('hidden', type !== 'text');
    modal.querySelector('.type-script').classList.toggle('hidden', type !== 'script');
  };
  modal.querySelector('.kind-row').addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    type = b.dataset.type;
    applyType();
  });
  applyType();

  modal.querySelector('.script-bar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-example]');
    if (!b) return;
    const ex = SCRIPT_EXAMPLES[Number(b.dataset.example)];
    form.script.value = ex.script;
    optList.innerHTML = '';
    ex.options.forEach(addOption);
    syncOptions();
    form.script.focus();
  });

  // Tab indents inside the code editor instead of leaving it.
  form.script.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    form.script.setRangeText('  ', form.script.selectionStart, form.script.selectionEnd, 'end');
  });

  const collect = () => ({
    id: draft.id,
    name: form.name.value.trim(),
    description: form.description.value.trim(),
    options: [...optList.children].map((row) => ({
      name: row.querySelector('[data-k=name]').value.trim().toLowerCase(),
      description: row.querySelector('[data-k=description]').value.trim(),
      required: row.querySelector('[data-k=required]').checked,
    })).filter((o) => o.name || o.description),
    type,
    response: form.response.value,
    script: form.script.value,
    ephemeral: form.ephemeral.checked,
  });

  const out = modal.querySelector('.test-out');
  const testBtn = modal.querySelector('[data-act=test]');
  const runTest = async () => {
    testBtn.disabled = true;
    try {
      const res = await req('bot:test', { botId: bot.id, command: collect(), text: form.testText.value });
      const parts = res.replies.map((r) => `<div class="test-reply ${r.ephemeral ? 'eph' : ''}"><span class="test-label">${r.ephemeral ? 'Nur für dich' : 'Antwort'}</span><div class="msg-body">${formatMessage(r.text)}</div></div>`);
      if (res.logs?.length) parts.push(`<div class="test-reply log"><span class="test-label">console.log</span><pre>${esc(res.logs.join('\n'))}</pre></div>`);
      if (res.scriptError) parts.push(`<div class="test-reply err"><span class="test-label">Fehler</span><div>${esc(res.scriptError)}</div></div>`);
      if (!parts.length) parts.push('<div class="test-reply"><span class="test-label">Ergebnis</span><div>Keine Antwort. Nutze <code>reply()</code> oder <code>return</code>.</div></div>');
      out.innerHTML = parts.join('');
    } catch (ex) {
      out.innerHTML = `<div class="test-reply err"><span class="test-label">Fehler</span><div>${esc(ex.message)}</div></div>`;
    } finally {
      out.classList.remove('hidden');
      testBtn.disabled = false;
    }
  };
  testBtn.onclick = runTest;
  form.testText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); runTest(); }
  });

  modal.querySelector('[data-act=back]').onclick = () => { close(); openBotEditor(bot.id); };
  form.onsubmit = (e) => {
    e.preventDefault();
    submitting(form, async () => {
      const res = await req('bot:command:save', { botId: bot.id, command: collect() });
      close();
      toast(`/${res.command.name} gespeichert`);
      openBotEditor(bot.id);
    });
  };
}
