'use strict';

/* =========================================================================
   Nexora V0.9.0 — community features: pinned messages, search, threads,
   friends, hub roles and member moderation. Uses helpers from app.js.
   ========================================================================= */

const PERM_INFO = [
  ['admin', t('Admin'), t('Darf alles, was der Besitzer darf – außer den Hub löschen.')],
  ['manageHub', t('Hub verwalten'), t('Name, Symbol, Einladungscode und Bots ändern.')],
  ['manageChannels', t('Kanäle verwalten'), t('Kanäle erstellen, bearbeiten, löschen und den Langsam-Modus setzen.')],
  ['manageRoles', t('Rollen verwalten'), t('Rollen unter der eigenen erstellen und vergeben.')],
  ['manageMessages', t('Nachrichten verwalten'), t('Nachrichten anderer löschen, anpinnen und Umfragen beenden. Der Langsam-Modus gilt dann nicht.')],
  ['kick', t('Mitglieder rauswerfen'), t('Mitglieder aus dem Hub werfen oder ihnen eine Auszeit geben.')],
  ['ban', t('Mitglieder sperren'), t('Mitglieder rauswerfen und den Wiedereintritt sperren.')],
];
const ROLE_COLORS = ['', '#ff7a18', '#ffd166', '#ef476f', '#9b5de5', '#4cc9f0', '#3ddc84', '#ff5e3a', '#f72585', '#c1121f'];

function roleChip(role) {
  return `<span class="role-chip" style="--rc:${esc(role.color || '#9a8170')}"><i></i>${esc(role.name)}</span>`;
}

/* ---------- jumping to any message ---------- */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Opens the channel and loads older pages until the message is there (or the start is reached).
async function jumpToMessage(channelId, messageId) {
  if (state.view.channelId !== channelId) openChannel(channelId);
  for (let i = 0; i < 50; i++) {
    const ch = state.channels.get(channelId);
    if (state.view.channelId !== channelId) return;
    if (ch && !ch.loading) {
      if (ch.list.some((m) => m.id === messageId)) {
        await wait(30);
        return jumpTo(messageId);
      }
      if (!ch.hasMore) return toast(t('Die Nachricht gibt es nicht mehr.'), 'error');
      await loadChannel(channelId, true);
    } else await wait(100);
  }
}

/* ---------- pins ---------- */

async function togglePin(msg) {
  if (!msg) return;
  try {
    await req('message:pin', { channelId: msg.channelId, messageId: msg.id, pinned: !msg.pinned });
    toast(msg.pinned ? t('Nicht mehr angepinnt') : t('📌 Angepinnt'));
  } catch (ex) {
    toast(ex.message, 'error');
  }
}

async function openPins(anchor) {
  closePopover();
  const channelId = state.view.channelId;
  if (!channelId) return;
  const pop = h(`<div class="popover pins-pop"><div class="section-label"><span>📌 ${t('Angepinnt')}</span></div><div class="pins-list"><div class="empty-hint">${t('Lädt…')}</div></div></div>`);
  placePopover(pop, anchor);
  const list = pop.querySelector('.pins-list');
  try {
    const { messages } = await req('pins:list', { channelId });
    const hub = currentHub();
    const canUnpin = !hub || canIn(hub, 'manageMessages');
    list.innerHTML = messages.length ? '' : `<div class="empty-hint">${t('Hier ist noch nichts angepinnt. Fahr über eine Nachricht und klick auf 📌.')}</div>`;
    for (const m of messages) {
      const author = userOf(m.authorId);
      const row = h(`<div class="pin-row">${avatar(author, { size: 28 })}
        <div class="pin-main"><div class="pin-head"><b>${esc(author.displayName)}</b><span>${esc(stamp(m.createdAt))}</span></div>
        <div class="pin-text">${m.content ? formatMessage(m.content) : esc(previewText(m))}</div>
        <div class="pin-acts"><button class="btn small" data-act="jump">${t('Hinspringen')}</button>${canUnpin ? `<button class="btn small" data-act="unpin">${t('Lösen')}</button>` : ''}</div></div></div>`);
      row.querySelector('[data-act=jump]').onclick = () => { closePopover(); jumpToMessage(channelId, m.id); };
      row.querySelector('[data-act=unpin]')?.addEventListener('click', async () => {
        await togglePin(m);
        row.remove();
      });
      list.append(row);
    }
  } catch (ex) {
    list.innerHTML = `<div class="empty-hint">${esc(ex.message)}</div>`;
  }
}

/* ---------- search ---------- */

function openSearch() {
  const hub = currentHub();
  const dm = currentDm();
  if (!hub && !dm) return toast(t('Öffne zuerst einen Hub oder eine Unterhaltung.'), 'error');
  const scopeId = hub ? hub.id : dm.id;
  const { modal, close } = openModal(`
    <h3>🔎 ${t('Nachrichten suchen')}</h3>
    <p class="sub">${hub ? t('In allen Textkanälen von „{name}“.', { name: esc(hub.name) }) : t('In deiner Unterhaltung mit {name}.', { name: esc(dmPartner(dm).displayName) })}</p>
    <div class="palette-input search-input">${ICONS.search}<input placeholder="${t('Suchbegriff oder Filter…')}" autocomplete="off" /></div>
    <div class="search-filters">${['von:@', hub ? 'in:#' : '', 'hat:bild', 'hat:datei', 'hat:link', 'hat:umfrage', 'angepinnt'].filter(Boolean).map((f) => `<button type="button" class="chip" data-f="${f}">${f}</button>`).join('')}</div>
    <div class="search-results"></div>
    <div class="modal-actions"><button class="btn" data-close>${t('Schließen')}</button></div>`, { className: 'search-modal' });
  const q = modal.querySelector('input');
  const results = modal.querySelector('.search-results');
  let timer = null;
  let run = 0;

  const search = async () => {
    const query = q.value.trim();
    const mine = ++run;
    if (!query) { results.innerHTML = `<div class="empty-hint">${t('Tipp: <code>von:@name</code>, <code>in:#kanal</code>, <code>hat:bild</code> oder <code>angepinnt</code> lassen sich mit Wörtern kombinieren.')}</div>`; return; }
    try {
      const res = await req('messages:search', { scopeId, query });
      if (mine !== run) return;
      results.innerHTML = res.results.length
        ? `<div class="section-label"><span>${plural(res.total, 'Treffer', 'Treffer')}${res.total > res.results.length ? ` · ${t('die neuesten {n}', { n: res.results.length })}` : ''}</span></div>`
        : `<div class="empty-hint">${t('Nichts gefunden.')}</div>`;
      for (const m of res.results) {
        const author = userOf(m.authorId);
        const row = h(`<button class="search-hit">${avatar(author, { size: 30 })}
          <span class="hit-main"><span class="hit-head"><b>${esc(author.displayName)}</b>${hub ? `<span>${esc(channelLabel(m.channelId))}</span>` : ''}${m.threadId ? `<span>💬 ${t('Thread')}</span>` : ''}<span>${esc(stamp(m.createdAt))}</span></span>
          <span class="hit-text">${m.content ? formatMessage(m.content) : esc(previewText(m))}</span></span></button>`);
        row.onclick = () => {
          close();
          if (m.threadId) {
            openChannel(m.channelId);
            openThread(m.channelId, m.threadId, m.id);
          } else jumpToMessage(m.channelId, m.id);
        };
        results.append(row);
      }
    } catch (ex) {
      if (mine === run) results.innerHTML = `<div class="empty-hint">${esc(ex.message)}</div>`;
    }
  };
  q.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(search, 250);
  });
  modal.querySelector('.search-filters').addEventListener('click', (e) => {
    const f = e.target.closest('[data-f]')?.dataset.f;
    if (!f) return;
    q.value = `${q.value.trim()} ${f}`.trim() + (/[@#]$/.test(f) ? '' : ' ');
    q.focus();
    search();
  });
  search();
}

/* ---------- threads ---------- */

async function openThread(channelId, rootId, highlightId = null) {
  closeThread();
  const { modal, close } = openModal(`
    <div class="thread-head"><span class="thread-ico">${ICONS.thread}</span><div><h3>${t('Thread')}</h3><p class="sub">${esc(channelLabel(channelId))}</p></div>
      <button class="icon-btn" data-close title="${t('Schließen')}">${ICONS.x}</button></div>
    <div class="thread-list messages"><div class="empty-hint">${t('Lädt…')}</div></div>
    <form class="thread-composer composer"><textarea rows="1" maxlength="${myLimit(MAX_MESSAGE)}" placeholder="${t('Im Thread antworten…')}" enterkeyhint="send"></textarea>
      <button type="submit" class="send-btn" title="${t('Senden')}"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>`, { className: 'thread-modal' });
  const thread = { channelId, rootId, root: null, list: [], modal, close };
  state.thread = thread;
  // Closed with Esc, the backdrop or the x: forget the thread.
  const watch = new MutationObserver(() => {
    if (modal.isConnected) return;
    watch.disconnect();
    if (state.thread === thread) state.thread = null;
  });
  watch.observe($('#modal-root'), { childList: true });

  const box = modal.querySelector('.thread-list');
  box.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]');
    if (act?.dataset.act === 'reply') {
      const msg = findMsg(act.closest('.msg')?.dataset.id);
      if (msg) {
        ta.value = `@${userOf(msg.authorId).username} ${ta.value}`;
        ta.focus();
      }
      return;
    }
    onMessagesClick(e);
  });
  const ta = modal.querySelector('textarea');
  const form = modal.querySelector('form');
  ta.addEventListener('input', () => autosize(ta));
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  form.onsubmit = async (e) => {
    e.preventDefault();
    const content = ta.value.trim();
    if (!content) return;
    ta.value = '';
    autosize(ta);
    try {
      await req('message:send', { channelId, content, threadId: rootId });
    } catch (ex) {
      toast(ex.message, 'error');
      if (!ta.value) ta.value = content;
    }
  };

  try {
    const res = await req('thread:fetch', { channelId, rootId });
    if (state.thread !== thread) return;
    thread.root = res.root;
    thread.list = res.messages;
    renderThread();
    if (highlightId) jumpTo(highlightId);
    ta.focus();
  } catch (ex) {
    toast(ex.message, 'error');
    close();
  }
}

function closeThread() {
  state.thread?.close();
  state.thread = null;
}

function renderThread() {
  const thread = state.thread;
  if (!thread?.root) return;
  const box = thread.modal.querySelector('.thread-list');
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
  box.innerHTML = '';
  const root = messageNode(thread.root, null);
  root.classList.add('thread-root');
  // The first message is edited in the channel itself.
  root.querySelectorAll('[data-act=thread], [data-act=edit], .thread-chip').forEach((n) => n.remove());
  box.append(root);
  box.append(h(`<div class="day-divider">${(thread.list.length === 1 ? t('1 Antwort') : t('{n} Antworten', { n: numberFmt.format(thread.list.length) }))}</div>`));
  let prev = null;
  for (const m of thread.list) {
    box.append(messageNode(m, prev));
    prev = m;
  }
  if (atBottom || !box.dataset.ready) box.scrollTop = box.scrollHeight;
  box.dataset.ready = '1';
}

// Live updates from app.js.
function threadAdd(msg) {
  const thread = state.thread;
  if (!thread || thread.rootId !== msg.threadId || thread.list.some((m) => m.id === msg.id)) return;
  thread.list.push(msg);
  renderThread();
}

function threadUpdate(msg) {
  const thread = state.thread;
  if (!thread?.root) return;
  if (msg.id === thread.root.id) thread.root = msg;
  else {
    const i = thread.list.findIndex((m) => m.id === msg.id);
    if (i < 0) return;
    thread.list[i] = msg;
  }
  if (!state.editingId) renderThread();
}

function threadRemove(channelId, messageId) {
  const thread = state.thread;
  if (!thread || thread.channelId !== channelId) return;
  if (messageId === thread.rootId) {
    toast(t('Der Thread wurde gelöscht.'), 'error');
    return closeThread();
  }
  const before = thread.list.length;
  thread.list = thread.list.filter((m) => m.id !== messageId);
  if (thread.list.length !== before) renderThread();
}

/* ---------- friends ---------- */

let friendsTab = 'online';

function friendState(userId) {
  const f = state.friends;
  if (f.friends.includes(userId)) return 'friends';
  if (f.incoming.includes(userId)) return 'incoming';
  if (f.outgoing.includes(userId)) return 'outgoing';
  return 'none';
}

function friendButton(userId) {
  const label = { friends: `✓ ${t('Befreundet')}`, incoming: `${ICONS.check} ${t('Annehmen')}`, outgoing: t('Angefragt'), none: `${ICONS.friends} ${t('Freund')}` }[friendState(userId)];
  return `<button class="btn friend-btn ${friendState(userId)}" data-act="friend" title="${t('Freundschaft')}">${label}</button>`;
}

function bindFriendButton(root, userId) {
  root.querySelector('[data-act=friend]')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const st = friendState(userId);
    try {
      if (st === 'none') {
        const res = await req('friend:request', { userId });
        toast(res.status === 'friends' ? t('🤝 Ihr seid jetzt befreundet') : t('Freundschaftsanfrage geschickt'));
      } else if (st === 'incoming') {
        await req('friend:accept', { userId });
        toast(t('🤝 Ihr seid jetzt befreundet'));
      } else {
        const text = st === 'friends' ? t('{name} ist dann nicht mehr in deiner Freundesliste.', { name: userOf(userId).displayName }) : t('Die Anfrage an {name} wird zurückgezogen.', { name: userOf(userId).displayName });
        if (!(await confirmDialog(st === 'friends' ? t('Freundschaft beenden?') : t('Anfrage zurückziehen?'), text, st === 'friends' ? t('Beenden') : t('Zurückziehen')))) return;
        await req('friend:remove', { userId });
      }
      btn.outerHTML = friendButton(userId);
      bindFriendButton(root, userId);
    } catch (ex) {
      toast(ex.message, 'error');
    }
  });
}

function renderFriendsPage(box) {
  const f = state.friends;
  const friends = f.friends.map(userOf).sort((a, b) => a.displayName.localeCompare(b.displayName));
  const onlineFriends = friends.filter((u) => statusOf(u.id) !== 'offline');
  const tabs = [
    ['online', `${t('Online')} · ${onlineFriends.length}`],
    ['all', `${t('Alle')} · ${friends.length}`],
    ['requests', `${t('Anfragen')}${f.incoming.length ? ` · ${f.incoming.length}` : ''}`],
    ['add', t('Hinzufügen')],
  ];
  box.innerHTML = '';
  const page = h(`<div class="friends-page">
    <div class="friends-hero"><h2>${t('Hey {name}!', { name: esc(state.me.displayName) })}</h2><p>${t('Deine Freunde, Anfragen und neue Leute an einem Ort.')}</p></div>
    <div class="tabs">${tabs.map(([id, label]) => `<button type="button" data-tab="${id}" class="${friendsTab === id ? 'active' : ''}">${label}</button>`).join('')}</div>
    <div class="friends-body"></div></div>`);
  box.append(page);
  page.querySelector('.tabs').onclick = (e) => {
    const tab = e.target.closest('[data-tab]')?.dataset.tab;
    if (!tab) return;
    friendsTab = tab;
    renderFriendsPage(box);
  };
  const body = page.querySelector('.friends-body');

  const row = (u, actions) => {
    const r = h(`<div class="friend-row">${avatar(u, { dot: true, size: 40 })}
      <div class="info"><div class="name">${esc(u.displayName)}${verified(u)}</div><div class="bio">@${esc(u.username)} · ${esc(STATUS_LABEL[statusOf(u.id)])}</div></div>
      <div class="friend-acts">${actions}</div></div>`);
    r.querySelector('.avatar').onclick = (e) => showProfile(u.id, e.currentTarget);
    return r;
  };
  const act = (name, label, cls = '') => `<button class="btn small ${cls}" data-act="${name}">${label}</button>`;
  const bind = (r, u) => r.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (!a) return;
    try {
      if (a === 'dm') return openDmWith(u.id);
      if (a === 'accept') await req('friend:accept', { userId: u.id });
      if (a === 'decline' || a === 'cancel') await req('friend:remove', { userId: u.id });
      if (a === 'remove') {
        if (!(await confirmDialog(t('Freundschaft beenden?'), t('{name} ist dann nicht mehr in deiner Freundesliste.', { name: u.displayName }), t('Beenden')))) return;
        await req('friend:remove', { userId: u.id });
      }
    } catch (ex) {
      toast(ex.message, 'error');
    }
  });

  if (friendsTab === 'online' || friendsTab === 'all') {
    const list = friendsTab === 'online' ? onlineFriends : friends;
    if (!list.length) {
      body.append(h(`<div class="empty-hint">${friends.length ? t('Gerade ist niemand von deinen Freunden online.') : t('Noch keine Freunde. Schick jemandem eine Anfrage – unter „Hinzufügen“ oder im Profil.')}</div>`));
    }
    for (const u of list) {
      const r = row(u, act('dm', `${ICONS.chat} ${t('Schreiben')}`, 'primary') + act('remove', ICONS.x));
      bind(r, u);
      body.append(r);
    }
  } else if (friendsTab === 'requests') {
    if (!f.incoming.length && !f.outgoing.length) body.append(h(`<div class="empty-hint">${t('Keine offenen Anfragen.')}</div>`));
    if (f.incoming.length) body.append(h(`<div class="section-label"><span>${t('An dich')} — ${f.incoming.length}</span></div>`));
    for (const u of f.incoming.map(userOf)) {
      const r = row(u, act('accept', `${ICONS.check} ${t('Annehmen')}`, 'primary') + act('decline', t('Ablehnen')));
      bind(r, u);
      body.append(r);
    }
    if (f.outgoing.length) body.append(h(`<div class="section-label"><span>${t('Von dir')} — ${f.outgoing.length}</span></div>`));
    for (const u of f.outgoing.map(userOf)) {
      const r = row(u, act('cancel', t('Zurückziehen')));
      bind(r, u);
      body.append(r);
    }
  } else {
    const form = h(`<form class="friend-add"><p class="sub">${t('Gib den Benutzernamen ein – Groß- und Kleinschreibung egal.')}</p>
      <div class="bot-add-row"><input class="input" name="name" maxlength="32" placeholder="${t('z. B. nova_rider')}" autocomplete="off" /><button type="submit" class="btn primary">${t('Anfrage schicken')}</button></div>
      <p class="form-error"></p></form>`);
    form.onsubmit = (e) => {
      e.preventDefault();
      submitting(form, async () => {
        const res = await req('friend:request', { username: form.name.value.trim() });
        form.name.value = '';
        toast(res.status === 'friends' ? t('🤝 Ihr seid jetzt befreundet') : t('Freundschaftsanfrage an {name} geschickt', { name: res.user.displayName }));
      });
    };
    body.append(form);
    requestAnimationFrame(() => form.name.focus());
  }
}

/* ---------- member moderation (profile card in a hub) ---------- */

function memberToolsHtml(hub, userId) {
  const target = userOf(userId);
  if (target.bot || !outranksIn(hub, userId)) return '';
  const assignable = (hub.roles || []).some((r, i) => i > hubRankOf(hub, state.me.id));
  const tools = [
    canIn(hub, 'manageRoles') && assignable && `<button class="btn small" data-mod="roles">${ICONS.roles} ${t('Rollen')}</button>`,
    canIn(hub, 'kick') && `<button class="btn small" data-mod="timeout">⏳ ${t('Auszeit')}</button>`,
    canIn(hub, 'kick') && `<button class="btn small danger" data-mod="kick">${t('Rauswerfen')}</button>`,
    canIn(hub, 'ban') && `<button class="btn small danger" data-mod="ban">🚫 ${t('Sperren')}</button>`,
  ].filter(Boolean);
  return tools.length ? `<div class="member-tools">${tools.join('')}</div>` : '';
}

function bindMemberTools(pop, hub, userId) {
  const u = userOf(userId);
  pop.querySelector('.member-tools')?.addEventListener('click', async (e) => {
    const action = e.target.closest('[data-mod]')?.dataset.mod;
    if (!action) return;
    closePopover();
    try {
      if (action === 'roles') return openMemberRoles(hub.id, userId);
      if (action === 'timeout') return openTimeout(hub.id, userId);
      if (action === 'kick') {
        if (!(await confirmDialog(t('{name} rauswerfen?', { name: u.displayName }), t('{name} verlässt „{hub}“ und kann per Einladung zurückkommen.', { name: u.displayName, hub: hub.name }), t('Rauswerfen')))) return;
        await req('hub:kick', { hubId: hub.id, userId });
        toast(t('{name} wurde rausgeworfen', { name: u.displayName }));
      }
      if (action === 'ban') openBanDialog(hub.id, userId);
    } catch (ex) {
      toast(ex.message, 'error');
    }
  });
}

function openMemberRoles(hubId, userId) {
  const hub = state.hubs.get(hubId);
  const u = userOf(userId);
  const myRank = hubRankOf(hub, state.me.id);
  const { modal } = openModal(`<h3>${t('Rollen von {name}', { name: esc(u.displayName) })}</h3>
    <p class="sub">${t('Du kannst nur Rollen unter deiner höchsten vergeben.')}</p>
    <div class="role-picks"></div>
    <div class="modal-actions"><button class="btn" data-close>${t('Fertig')}</button></div>`);
  const box = modal.querySelector('.role-picks');
  const render = () => {
    const fresh = state.hubs.get(hubId);
    const mine = fresh.memberRoles?.[userId] || [];
    box.innerHTML = (fresh.roles || []).map((r, i) => `<label class="role-pick ${i <= myRank ? 'locked' : ''}" style="--rc:${esc(r.color || '#9a8170')}">
      <input type="checkbox" data-role="${esc(r.id)}" ${mine.includes(r.id) ? 'checked' : ''} ${i <= myRank ? 'disabled' : ''} /><i></i><span>${esc(r.name)}</span></label>`).join('') || `<div class="empty-hint">${t('Dieser Hub hat noch keine Rollen.')}</div>`;
  };
  box.addEventListener('change', async (e) => {
    const cb = e.target.closest('[data-role]');
    if (!cb) return;
    try {
      await req('role:assign', { hubId, userId, roleId: cb.dataset.role, on: cb.checked });
    } catch (ex) {
      cb.checked = !cb.checked;
      toast(ex.message, 'error');
    }
  });
  render();
}

function openTimeout(hubId, userId) {
  const u = userOf(userId);
  const options = [[10, t('10 Minuten')], [60, t('1 Stunde')], [1440, t('1 Tag')], [10080, t('1 Woche')], [0, t('Auszeit beenden')]];
  const { modal, close } = openModal(`<h3>⏳ ${t('Auszeit für {name}', { name: esc(u.displayName) })}</h3>
    <p class="sub">${t('So lange kann {name} in diesem Hub nichts schreiben.', { name: esc(u.displayName) })}</p>
    <div class="timeout-opts">${options.map(([m, label]) => `<button class="btn ${m ? '' : 'danger'}" data-m="${m}">${label}</button>`).join('')}</div>
    <div class="modal-actions"><button class="btn" data-close>${t('Abbrechen')}</button></div>`);
  modal.querySelector('.timeout-opts').onclick = async (e) => {
    const b = e.target.closest('[data-m]');
    if (!b) return;
    try {
      await req('hub:timeout', { hubId, userId, minutes: Number(b.dataset.m) });
      toast(Number(b.dataset.m) ? t('⏳ Auszeit für {name}', { name: u.displayName }) : t('Auszeit beendet'));
      close();
    } catch (ex) {
      toast(ex.message, 'error');
    }
  };
}

function openBanDialog(hubId, userId) {
  const hub = state.hubs.get(hubId);
  const u = userOf(userId);
  const { modal, close } = openModal(`<h3>🚫 ${t('{name} sperren?', { name: esc(u.displayName) })}</h3>
    <p class="sub">${t('{name} fliegt aus „{hub}“ und kann nicht wieder beitreten, bis die Sperre aufgehoben ist.', { name: esc(u.displayName), hub: esc(hub.name) })}</p>
    <form><label class="field"><span>${t('Grund')} <em>${t('(optional)')}</em></span><input name="reason" maxlength="200" /></label>
    <p class="form-error"></p>
    <div class="modal-actions"><button type="button" class="btn" data-close>${t('Abbrechen')}</button><button type="submit" class="btn danger">${t('Sperren')}</button></div></form>`);
  const form = modal.querySelector('form');
  form.onsubmit = (e) => {
    e.preventDefault();
    submitting(form, async () => {
      await req('hub:ban', { hubId, userId, reason: form.reason.value });
      toast(t('{name} ist gesperrt', { name: u.displayName }));
      close();
    });
  };
}

async function openBanList(hubId) {
  const { modal } = openModal(`<h3>🚫 ${t('Gesperrte Mitglieder')}</h3>
    <p class="sub">${t('Wer hier steht, kann dem Hub nicht beitreten.')}</p>
    <div class="ban-list"><div class="empty-hint">${t('Lädt…')}</div></div>
    <div class="modal-actions"><button class="btn" data-close>${t('Schließen')}</button></div>`);
  const box = modal.querySelector('.ban-list');
  const render = async () => {
    try {
      const { bans } = await req('hub:bans', { hubId });
      box.innerHTML = bans.length ? '' : `<div class="empty-hint">${t('Niemand ist gesperrt.')}</div>`;
      for (const b of bans) {
        const row = h(`<div class="bot-row">${avatar(b.user, { size: 30 })}<div class="info"><div class="name">${esc(b.user.displayName)}</div>
          <div class="bio">@${esc(b.user.username)} · ${esc(dateFmt.format(b.at))}${b.reason ? ` · ${esc(b.reason)}` : ''}</div></div>
          <button class="btn small">${t('Entsperren')}</button></div>`);
        row.querySelector('button').onclick = async () => {
          try {
            await req('hub:unban', { hubId, userId: b.user.id });
            render();
          } catch (ex) {
            toast(ex.message, 'error');
          }
        };
        box.append(row);
      }
    } catch (ex) {
      box.innerHTML = `<div class="empty-hint">${esc(ex.message)}</div>`;
    }
  };
  render();
}

/* ---------- role manager ---------- */

function openRoleManager(hubId) {
  const { modal } = openModal(`<h3>${ICONS.roles} ${t('Rollen')}</h3>
    <p class="sub">${t('Oben stehende Rollen stehen über den unteren. Die höchste Rolle mit Farbe färbt den Namen.')}</p>
    <div class="role-list"></div>
    <div class="modal-actions"><button class="btn primary" data-act="new">${ICONS.plus} ${t('Neue Rolle')}</button><span class="spacer"></span><button class="btn" data-close>${t('Fertig')}</button></div>`, { className: 'roles-modal' });
  const box = modal.querySelector('.role-list');
  const render = () => {
    const hub = state.hubs.get(hubId);
    if (!hub) return;
    const myRank = hubRankOf(hub, state.me.id);
    const roles = hub.roles || [];
    box.innerHTML = roles.length ? '' : `<div class="empty-hint">${t('Noch keine Rollen. Leg z. B. „Moderator“ an und gib ihr das Recht, Nachrichten zu verwalten.')}</div>`;
    roles.forEach((r, i) => {
      const count = hub.members.filter((m) => (hub.memberRoles?.[m] || []).includes(r.id)).length;
      const editable = i > myRank;
      const row = h(`<div class="role-row" style="--rc:${esc(r.color || '#9a8170')}"><i class="role-dot"></i>
        <div class="info"><div class="name">${esc(r.name)}${r.hoist ? ` <em>${t('separat')}</em>` : ''}</div>
        <div class="bio">${plural(count, 'Mitglied', 'Mitglieder')} · ${r.perms.length ? r.perms.map((p) => esc(PERM_INFO.find((x) => x[0] === p)?.[1] || p)).join(', ') : t('keine Rechte')}</div></div>
        ${editable ? `<button class="icon-btn" data-act="up" title="${t('Nach oben')}" ${i - 1 <= myRank ? 'disabled' : ''}>▲</button>
        <button class="icon-btn" data-act="down" title="${t('Nach unten')}" ${i === roles.length - 1 ? 'disabled' : ''}>▼</button>
        <button class="icon-btn" data-act="edit" title="${t('Bearbeiten')}">${ICONS.edit}</button>
        <button class="icon-btn danger" data-act="delete" title="${t('Löschen')}">${ICONS.trash}</button>` : '<span class="role-lock" title="">🔒</span>'}</div>`);
      row.addEventListener('click', async (e) => {
        const a = e.target.closest('[data-act]')?.dataset.act;
        try {
          if (a === 'up' || a === 'down') await req('role:move', { hubId, roleId: r.id, dir: a === 'up' ? -1 : 1 });
          if (a === 'edit') openRoleEditor(hubId, r);
          if (a === 'delete' && (await confirmDialog(t('Rolle löschen?'), t('„{name}“ wird allen {n} Mitgliedern weggenommen.', { name: r.name, n: count }), t('Löschen')))) await req('role:delete', { hubId, roleId: r.id });
        } catch (ex) {
          toast(ex.message, 'error');
        }
      });
      box.append(row);
    });
  };
  modal.querySelector('[data-act=new]').onclick = () => openRoleEditor(hubId, null);
  const onHub = (e) => {
    if (!modal.isConnected) return document.removeEventListener('nexora:hub', onHub);
    if (e.detail.id === hubId) render();
  };
  document.addEventListener('nexora:hub', onHub);
  render();
}

function openRoleEditor(hubId, role) {
  const hub = state.hubs.get(hubId);
  let color = role?.color || '';
  const { modal, close } = openModal(`<h3>${role ? t('Rolle bearbeiten') : t('Neue Rolle')}</h3>
    <form>
      <label class="field"><span>${t('Name')}</span><input name="name" maxlength="32" required placeholder="${t('z. B. Moderator')}" /></label>
      <div class="field"><span>${t('Farbe')}</span></div>
      <div class="color-row">${ROLE_COLORS.map((c) => `<button type="button" class="swatch ${c === color ? 'sel' : ''} ${c ? '' : 'none'}" data-c="${c}" style="--c:${c || 'transparent'}" title="${c ? c : t('Keine Farbe')}">${c ? '' : '∅'}</button>`).join('')}<input type="color" value="${esc(color || '#ff7a18')}" title="${t('Eigene Farbe')}" /></div>
      <div class="field"><span>${t('Rechte')}</span></div>
      <div class="perm-list">${PERM_INFO.map(([id, label, desc]) => {
        const allowed = canIn(hub, id) || role?.perms.includes(id);
        return `<label class="perm ${allowed ? '' : 'locked'}"><input type="checkbox" name="perm" value="${id}" ${role?.perms.includes(id) ? 'checked' : ''} ${allowed ? '' : 'disabled'} />
          <span><b>${label}</b><small>${desc}</small></span></label>`;
      }).join('')}</div>
      <label class="perm"><input type="checkbox" name="hoist" ${role?.hoist ? 'checked' : ''} /><span><b>${t('Separat anzeigen')}</b><small>${t('Mitglieder mit dieser Rolle stehen in der Mitgliederliste in einer eigenen Gruppe.')}</small></span></label>
      <p class="form-error"></p>
      <div class="modal-actions sticky"><button type="button" class="btn" data-close>${t('Abbrechen')}</button><button type="submit" class="btn primary">${role ? t('Speichern') : t('Erstellen')}</button></div>
    </form>`);
  const form = modal.querySelector('form');
  form.name.value = role?.name || '';
  const swatches = modal.querySelector('.color-row');
  swatches.addEventListener('click', (e) => {
    const b = e.target.closest('[data-c]');
    if (!b) return;
    color = b.dataset.c;
    swatches.querySelectorAll('.swatch').forEach((x) => x.classList.toggle('sel', x === b));
  });
  swatches.querySelector('input[type=color]').addEventListener('input', (e) => {
    color = e.target.value;
    swatches.querySelectorAll('.swatch').forEach((x) => x.classList.remove('sel'));
  });
  form.onsubmit = (e) => {
    e.preventDefault();
    submitting(form, async () => {
      const perms = [...form.querySelectorAll('[name=perm]:checked')].map((x) => x.value);
      await req('role:save', { hubId, role: { id: role?.id, name: form.name.value, color, perms, hoist: form.hoist.checked } });
      toast(role ? t('Rolle gespeichert') : t('Rolle erstellt'));
      close();
    });
  };
}
