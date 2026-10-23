'use strict';

/* =========================================================================
   Admin panel for official Nexora accounts: statistics, announcements and
   moderation of users, hubs and bots. The server checks every action again.
   ========================================================================= */

const numberFmt = new Intl.NumberFormat('de-DE');

// "1 Hub", "3 Hubs"
function plural(n, one, many) {
  return `${numberFmt.format(n)} ${n === 1 ? one : many}`;
}

function since(ts) {
  const minutes = Math.floor((Date.now() - ts) / 60000);
  if (minutes < 60) return `${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} Std.`;
  return `${Math.floor(hours / 24)} Tagen`;
}

function openAdminPanel(tab = 'overview') {
  closePopover();
  if (!state.me?.official) return toast('Nur für offizielle Nexora-Accounts.', 'error');
  const { modal, close } = openModal(`
    <div class="bm-hero"><span class="bm-ico">${ICONS.shield}</span><div><h3>Admin-Panel</h3>
      <p class="sub">Nexora verwalten · angemeldet als <b>@${esc(state.me.username)}</b></p></div></div>
    <div class="tabs" role="tablist">
      <button type="button" data-tab="overview">Übersicht</button>
      <button type="button" data-tab="users">Nutzer</button>
      <button type="button" data-tab="hubs">Hubs</button>
      <button type="button" data-tab="bots">Bots</button>
    </div>
    <div class="tab-body admin-body"></div>
    <div class="modal-actions"><button class="btn" data-close>Schließen</button></div>`, { className: 'wide admin' });
  const body = modal.querySelector('.tab-body');
  let query = '';

  const fail = (ex) => {
    body.innerHTML = `<div class="notice danger">${esc(ex.message)}</div>`;
  };

  const views = {
    async overview() {
      const d = await req('admin:overview');
      const c = d.counts;
      const tile = (value, label, hint = '') => `<div class="stat"><b>${numberFmt.format(value)}</b><span>${label}</span>${hint ? `<small>${hint}</small>` : ''}</div>`;
      body.innerHTML = `
        <div class="stats">
          ${tile(c.users, 'Nutzer', c.newToday ? `+${c.newToday} heute` : '')}
          ${tile(c.online, 'Gerade online')}
          ${tile(c.messages, 'Nachrichten', `${numberFmt.format(c.messagesToday)} in 24 Std.`)}
          ${tile(c.hubs, 'Hubs', `${numberFmt.format(c.channels)} Kanäle`)}
          ${tile(c.bots, 'Bots')}
          ${tile(c.dms, 'DM-Unterhaltungen')}
          ${tile(c.inVoice, 'In Sprachkanälen')}
          ${tile(c.banned, 'Gesperrt')}
        </div>
        <div class="sysinfo">
          <span>Version <b>${esc(d.version)}</b></span>
          <span>Speicher <b>${esc(d.storage)}</b></span>
          <span>Läuft seit <b>${since(d.startedAt)}</b></span>
          <span>RAM <b>${formatSize(d.memory)}</b></span>
          <span>Daten <b>${formatSize(d.dataSize)}</b></span>
        </div>
        <hr />
        <form class="announce-form">
          <div class="field"><span>Ankündigung <em>– erscheint bei allen oben im Chat</em></span></div>
          ${d.announcement ? `<div class="notice">${ICONS.megaphone}<span>Aktiv seit ${esc(stamp(d.announcement.createdAt))}: ${formatMessage(d.announcement.text)}</span></div>` : ''}
          <label class="field"><textarea name="text" maxlength="300" rows="2" placeholder="z. B. Heute Abend um 20 Uhr kurze Wartung 🔧"></textarea></label>
          <p class="form-error"></p>
          <div class="modal-actions" style="justify-content:flex-start">
            <button type="submit" class="btn primary">${ICONS.megaphone} Veröffentlichen</button>
            ${d.announcement ? '<button type="button" class="btn" data-act="clear">Ankündigung entfernen</button>' : ''}
          </div>
        </form>`;
      const form = body.querySelector('form');
      form.onsubmit = (e) => {
        e.preventDefault();
        if (!form.text.value.trim()) return (form.querySelector('.form-error').textContent = 'Schreib zuerst einen Text.');
        submitting(form, async () => {
          await req('admin:announce', { text: form.text.value });
          toast('Ankündigung ist live');
          show('overview');
        });
      };
      body.querySelector('[data-act=clear]')?.addEventListener('click', async () => {
        try {
          await req('admin:announce', { text: '' });
          toast('Ankündigung entfernt');
          show('overview');
        } catch (ex) {
          toast(ex.message, 'error');
        }
      });
    },

    async users() {
      body.innerHTML = `<div class="admin-search">${ICONS.search}<input class="input" placeholder="Nutzer suchen…" autocomplete="off" /></div><div class="admin-list"></div>`;
      const search = body.querySelector('input');
      const list = body.querySelector('.admin-list');
      search.value = query;
      const load = async () => {
        const { users, total } = await req('admin:users', { query });
        list.innerHTML = `<div class="admin-count">${users.length < total ? `${users.length} von ${numberFmt.format(total)}` : numberFmt.format(users.length)} Nutzer${query ? ` für „${esc(query)}“` : ''} · die neuesten zuerst</div>`;
        for (const u of users) list.append(userRow(u, load));
        if (!users.length) list.append(h('<div class="empty-hint">Niemand gefunden.</div>'));
      };
      let timer;
      search.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          query = search.value.trim();
          load().catch(fail);
        }, 250);
      });
      await load();
      search.focus();
    },

    async hubs() {
      const { hubs } = await req('admin:hubs');
      body.innerHTML = '<div class="admin-list"></div>';
      const list = body.querySelector('.admin-list');
      list.append(h(`<div class="admin-count">${plural(hubs.length, 'Hub', 'Hubs')}</div>`));
      for (const hub of hubs) {
        const joined = state.hubs.has(hub.id);
        const row = h(`<div class="admin-row">
          <span class="hub-ico" style="--hub-color:${esc(hub.color)}">${esc(hub.icon || initials(hub.name))}</span>
          <div class="info">
            <div class="name">${esc(hub.name)}${hub.isLounge ? ' <span class="pill">Lounge</span>' : ''}</div>
            <div class="bio">${hub.owner ? `von @${esc(hub.owner.username)}` : 'Nexora'} · ${plural(hub.members, 'Mitglied', 'Mitglieder')}${hub.bots ? ` · ${plural(hub.bots, 'Bot', 'Bots')}` : ''} · ${plural(hub.channels, 'Kanal', 'Kanäle')} · ${plural(hub.messages, 'Nachricht', 'Nachrichten')} · Code <code>${esc(hub.inviteCode)}</code></div>
          </div>
          <div class="admin-actions">
            <button class="btn small" data-act="open">${joined ? 'Öffnen' : 'Beitreten'}</button>
            ${hub.isLounge ? '' : `<button class="btn small danger" data-act="delete">${ICONS.trash} Löschen</button>`}
          </div>
        </div>`);
        row.querySelector('[data-act=open]').onclick = async () => {
          close();
          if (joined) openHub(hub.id);
          else joinHub(hub.inviteCode);
        };
        const del = row.querySelector('[data-act=delete]');
        if (del) armButton(del, 'Wirklich löschen?', async () => {
          await req('admin:deleteHub', { hubId: hub.id });
          toast(`„${hub.name}“ wurde gelöscht`);
          row.remove();
        });
        list.append(row);
      }
    },

    async bots() {
      const { bots } = await req('admin:bots');
      body.innerHTML = '<div class="admin-list"></div>';
      const list = body.querySelector('.admin-list');
      list.append(h(`<div class="admin-count">${plural(bots.length, 'Bot', 'Bots')}</div>`));
      if (!bots.length) list.append(h('<div class="empty-hint">Noch niemand hat einen Bot erstellt.</div>'));
      for (const bot of bots) {
        const row = h(`<div class="admin-row">
          ${avatar(bot, { size: 38 })}
          <div class="info">
            <div class="name">${esc(bot.displayName)}${verified(bot)} ${bot.disabled ? '<span class="pill danger">Gesperrt</span>' : ''}${bot.public ? '<span class="pill">Öffentlich</span>' : ''}</div>
            <div class="bio">@${esc(bot.username)} · von ${bot.owner ? `@${esc(bot.owner.username)}` : 'unbekannt'} · ${plural(bot.commands.length, 'Befehl', 'Befehle')} (${plural(bot.scripts, 'Skript', 'Skripte')}) · ${plural(bot.hubs, 'Hub', 'Hubs')}</div>
          </div>
          <div class="admin-actions">
            <button class="btn small" data-act="toggle">${bot.disabled ? 'Entsperren' : 'Sperren'}</button>
            <button class="btn small danger" data-act="delete">${ICONS.trash} Löschen</button>
          </div>
        </div>`);
        row.querySelector('[data-act=toggle]').onclick = async () => {
          try {
            await req('admin:botDisable', { botId: bot.id, disabled: !bot.disabled });
            toast(bot.disabled ? `${bot.displayName} ist wieder aktiv` : `${bot.displayName} wurde gesperrt`);
            show('bots');
          } catch (ex) {
            toast(ex.message, 'error');
          }
        };
        armButton(row.querySelector('[data-act=delete]'), 'Wirklich löschen?', async () => {
          await req('admin:deleteBot', { botId: bot.id });
          toast(`${bot.displayName} wurde gelöscht`);
          row.remove();
        });
        list.append(row);
      }
    },
  };

  const show = (name) => {
    tab = name;
    modal.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    body.innerHTML = '<div class="empty-hint">Lädt…</div>';
    views[name]().catch(fail);
  };
  modal.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) show(b.dataset.tab);
  });
  show(tab);
}

// One user in the admin list, with moderation actions.
function userRow(u, reload) {
  const row = h(`<div class="admin-row ${u.banned ? 'banned' : ''}">
    ${avatar(u, { size: 38 })}
    <div class="info">
      <div class="name">${esc(u.displayName)}${verified(u)}
        ${u.online ? '<span class="pill ok">Online</span>' : ''}${u.banned ? '<span class="pill danger">Gesperrt</span>' : ''}</div>
      <div class="bio">@${esc(u.username)} · dabei seit ${esc(fullFmt.format(u.createdAt).split(',')[0])} · ${plural(u.hubs, 'Hub', 'Hubs')} · ${plural(u.messages, 'Nachricht', 'Nachrichten')}${u.bots ? ` · ${plural(u.bots, 'Bot', 'Bots')}` : ''}</div>
      ${u.banned?.reason ? `<div class="bio">Grund: ${esc(u.banned.reason)}</div>` : ''}
    </div>
    <div class="admin-actions"></div>
  </div>`);
  const actions = row.querySelector('.admin-actions');
  if (u.official) {
    actions.innerHTML = '<span class="pill">Offiziell</span>';
    return row;
  }

  const run = async (event, payload, done) => {
    try {
      const res = await req(event, { userId: u.id, ...payload });
      done?.(res);
      if (!done) reload();
    } catch (ex) {
      toast(ex.message, 'error');
    }
  };

  const showButtons = () => {
    actions.innerHTML = `
      ${u.banned ? '<button class="btn small" data-act="unban">Entsperren</button>' : '<button class="btn small danger" data-act="ban">Sperren</button>'}
      <button class="btn small" data-act="logout" ${u.sessions ? '' : 'disabled'} title="${u.sessions} aktive Anmeldung(en)">Abmelden</button>
      <button class="btn small" data-act="reset">Passwort neu</button>`;
    actions.querySelector('[data-act=unban]')?.addEventListener('click', () => run('admin:unban', {}, () => { toast(`@${u.username} ist entsperrt`); reload(); }));
    actions.querySelector('[data-act=ban]')?.addEventListener('click', showBanForm);
    armButton(actions.querySelector('[data-act=logout]'), 'Überall abmelden?', () => run('admin:logout', {}, () => { toast(`@${u.username} wurde abgemeldet`); reload(); }));
    armButton(actions.querySelector('[data-act=reset]'), 'Wirklich zurücksetzen?', () => run('admin:resetPassword', {}, ({ password }) => {
      actions.innerHTML = `<div class="new-pass"><span>Neues Passwort:</span><code>${esc(password)}</code><button class="btn small" data-act="copy">${ICONS.copy}</button></div>`;
      actions.querySelector('[data-act=copy]').onclick = () => copyText(password);
    }));
  };

  const showBanForm = () => {
    actions.innerHTML = `<form class="ban-form"><input class="input" name="reason" maxlength="200" placeholder="Grund (optional, sieht die Person)" />
      <button type="submit" class="btn small danger">Sperren</button><button type="button" class="btn small" data-act="cancel">Abbrechen</button></form>`;
    const form = actions.querySelector('form');
    form.reason.focus();
    form.onsubmit = (e) => {
      e.preventDefault();
      run('admin:ban', { reason: form.reason.value }, () => { toast(`@${u.username} wurde gesperrt`); reload(); });
    };
    form.querySelector('[data-act=cancel]').onclick = showButtons;
  };

  showButtons();
  return row;
}
