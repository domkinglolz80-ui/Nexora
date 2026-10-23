'use strict';

/* =========================================================================
   Admin panel for official Nexora accounts: statistics, announcements and
   moderation of users, hubs and bots. The server checks every action again.
   ========================================================================= */

function since(ts) {
  const minutes = Math.floor((Date.now() - ts) / 60000);
  if (minutes < 60) return t('{n} Min.', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return t('{n} Std.', { n: hours });
  return t('{n} Tagen', { n: Math.floor(hours / 24) });
}

function openAdminPanel(tab = 'overview') {
  closePopover();
  if (!state.me?.official) return toast(t('Nur für offizielle Nexora-Accounts.'), 'error');
  const { modal, close } = openModal(`
    <div class="bm-hero"><span class="bm-ico">${ICONS.shield}</span><div><h3>${t('Admin-Panel')}</h3>
      <p class="sub">${t('Nexora verwalten · angemeldet als <b>@{name}</b>', { name: esc(state.me.username) })}</p></div></div>
    <div class="tabs" role="tablist">
      <button type="button" data-tab="overview">${t('Übersicht')}</button>
      <button type="button" data-tab="users">${t('Nutzer')}</button>
      <button type="button" data-tab="hubs">${t('Hubs')}</button>
      <button type="button" data-tab="bots">${t('Bots')}</button>
    </div>
    <div class="tab-body admin-body"></div>
    <div class="modal-actions"><button class="btn" data-close>${t('Schließen')}</button></div>`, { className: 'wide admin' });
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
          ${tile(c.users, t('Nutzer'), c.newToday ? t('+{n} heute', { n: c.newToday }) : '')}
          ${tile(c.online, t('Gerade online'))}
          ${tile(c.messages, t('Nachrichten'), t('{n} in 24 Std.', { n: numberFmt.format(c.messagesToday) }))}
          ${tile(c.hubs, t('Hubs'), plural(c.channels, 'Kanal', 'Kanäle'))}
          ${tile(c.bots, t('Bots'))}
          ${tile(c.dms, t('DM-Unterhaltungen'))}
          ${tile(c.inVoice, t('In Sprachkanälen'))}
          ${tile(c.banned, t('Gesperrt'))}
        </div>
        <div class="sysinfo">
          <span>${t('Version')} <b>${esc(d.version)}</b></span>
          <span>${t('Speicher')} <b>${esc(tServer(d.storage))}</b></span>
          <span>${t('Läuft seit')} <b>${since(d.startedAt)}</b></span>
          <span>RAM <b>${formatSize(d.memory)}</b></span>
          <span>${t('Daten')} <b>${formatSize(d.dataSize)}</b></span>
        </div>
        <hr />
        <form class="announce-form">
          <div class="field"><span>${t('Ankündigung')} <em>${t('– erscheint bei allen oben im Chat')}</em></span></div>
          ${d.announcement ? `<div class="notice">${ICONS.megaphone}<span>${t('Aktiv seit {time}:', { time: esc(stamp(d.announcement.createdAt)) })} ${formatMessage(d.announcement.text)}</span></div>` : ''}
          <label class="field"><textarea name="text" maxlength="300" rows="2" placeholder="${t('z. B. Heute Abend um 20 Uhr kurze Wartung 🔧')}"></textarea></label>
          <p class="form-error"></p>
          <div class="modal-actions" style="justify-content:flex-start">
            <button type="submit" class="btn primary">${ICONS.megaphone} ${t('Veröffentlichen')}</button>
            ${d.announcement ? `<button type="button" class="btn" data-act="clear">${t('Ankündigung entfernen')}</button>` : ''}
          </div>
        </form>`;
      const form = body.querySelector('form');
      form.onsubmit = (e) => {
        e.preventDefault();
        if (!form.text.value.trim()) return (form.querySelector('.form-error').textContent = t('Schreib zuerst einen Text.'));
        submitting(form, async () => {
          await req('admin:announce', { text: form.text.value });
          toast(t('Ankündigung ist live'));
          show('overview');
        });
      };
      body.querySelector('[data-act=clear]')?.addEventListener('click', async () => {
        try {
          await req('admin:announce', { text: '' });
          toast(t('Ankündigung entfernt'));
          show('overview');
        } catch (ex) {
          toast(ex.message, 'error');
        }
      });
    },

    async users() {
      body.innerHTML = `<div class="admin-search">${ICONS.search}<input class="input" placeholder="${t('Nutzer suchen…')}" autocomplete="off" /></div><div class="admin-list"></div>`;
      const search = body.querySelector('input');
      const list = body.querySelector('.admin-list');
      search.value = query;
      const load = async () => {
        const { users, total } = await req('admin:users', { query });
        const count = users.length < total ? t('{n} von {total}', { n: users.length, total: numberFmt.format(total) }) : numberFmt.format(users.length);
        list.innerHTML = `<div class="admin-count">${t('{count} Nutzer', { count })}${query ? ` ${t('für „{query}“', { query: esc(query) })}` : ''} · ${t('die neuesten zuerst')}</div>`;
        for (const u of users) list.append(userRow(u, load));
        if (!users.length) list.append(h(`<div class="empty-hint">${t('Niemand gefunden.')}</div>`));
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
            <div class="bio">${hub.owner ? t('von @{name}', { name: esc(hub.owner.username) }) : 'Nexora'} · ${plural(hub.members, 'Mitglied', 'Mitglieder')}${hub.bots ? ` · ${plural(hub.bots, 'Bot', 'Bots')}` : ''} · ${plural(hub.channels, 'Kanal', 'Kanäle')} · ${plural(hub.messages, 'Nachricht', 'Nachrichten')} · ${t('Code')} <code>${esc(hub.inviteCode)}</code></div>
          </div>
          <div class="admin-actions">
            <button class="btn small" data-act="open">${joined ? t('Öffnen') : t('Beitreten')}</button>
            ${hub.isLounge ? '' : `<button class="btn small danger" data-act="delete">${ICONS.trash} ${t('Löschen')}</button>`}
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
          toast(t('„{name}“ wurde gelöscht', { name: hub.name }));
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
      if (!bots.length) list.append(h(`<div class="empty-hint">${t('Noch niemand hat einen Bot erstellt.')}</div>`));
      for (const bot of bots) {
        const row = h(`<div class="admin-row">
          ${avatar(bot, { size: 38 })}
          <div class="info">
            <div class="name">${esc(bot.displayName)}${verified(bot)} ${bot.disabled ? `<span class="pill danger">${t('Gesperrt')}</span>` : ''}${bot.public ? `<span class="pill">${t('Öffentlich')}</span>` : ''}</div>
            <div class="bio">@${esc(bot.username)} · ${t('von {name}', { name: bot.owner ? `@${esc(bot.owner.username)}` : t('unbekannt') })} · ${plural(bot.commands.length, 'Befehl', 'Befehle')} (${plural(bot.scripts, 'Skript', 'Skripte')}) · ${plural(bot.hubs, 'Hub', 'Hubs')}</div>
          </div>
          <div class="admin-actions">
            <button class="btn small" data-act="toggle">${bot.disabled ? t('Entsperren') : t('Sperren')}</button>
            <button class="btn small danger" data-act="delete">${ICONS.trash} ${t('Löschen')}</button>
          </div>
        </div>`);
        row.querySelector('[data-act=toggle]').onclick = async () => {
          try {
            await req('admin:botDisable', { botId: bot.id, disabled: !bot.disabled });
            toast(t(bot.disabled ? '{name} ist wieder aktiv' : '{name} wurde gesperrt', { name: bot.displayName }));
            show('bots');
          } catch (ex) {
            toast(ex.message, 'error');
          }
        };
        armButton(row.querySelector('[data-act=delete]'), 'Wirklich löschen?', async () => {
          await req('admin:deleteBot', { botId: bot.id });
          toast(t('{name} wurde gelöscht', { name: bot.displayName }));
          row.remove();
        });
        list.append(row);
      }
    },
  };

  const show = (name) => {
    tab = name;
    modal.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    body.innerHTML = `<div class="empty-hint">${t('Lädt…')}</div>`;
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
        ${u.online ? `<span class="pill ok">${t('Online')}</span>` : ''}${u.banned ? `<span class="pill danger">${t('Gesperrt')}</span>` : ''}</div>
      <div class="bio">@${esc(u.username)} · ${t('dabei seit {date}', { date: esc(dateFmt.format(u.createdAt)) })} · ${plural(u.hubs, 'Hub', 'Hubs')} · ${plural(u.messages, 'Nachricht', 'Nachrichten')}${u.bots ? ` · ${plural(u.bots, 'Bot', 'Bots')}` : ''}</div>
      ${u.banned?.reason ? `<div class="bio">${t('Grund: {reason}', { reason: esc(u.banned.reason) })}</div>` : ''}
    </div>
    <div class="admin-actions"></div>
  </div>`);
  const actions = row.querySelector('.admin-actions');
  if (u.official) {
    actions.innerHTML = `<span class="pill">${t('Offiziell')}</span>`;
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
      ${u.banned ? `<button class="btn small" data-act="unban">${t('Entsperren')}</button>` : `<button class="btn small danger" data-act="ban">${t('Sperren')}</button>`}
      <button class="btn small" data-act="logout" ${u.sessions ? '' : 'disabled'} title="${t('{n} aktive Anmeldung(en)', { n: u.sessions })}">${t('Abmelden')}</button>
      <button class="btn small" data-act="reset">${t('Passwort neu')}</button>`;
    actions.querySelector('[data-act=unban]')?.addEventListener('click', () => run('admin:unban', {}, () => { toast(t('@{name} ist entsperrt', { name: u.username })); reload(); }));
    actions.querySelector('[data-act=ban]')?.addEventListener('click', showBanForm);
    armButton(actions.querySelector('[data-act=logout]'), 'Überall abmelden?', () => run('admin:logout', {}, () => { toast(t('@{name} wurde abgemeldet', { name: u.username })); reload(); }));
    armButton(actions.querySelector('[data-act=reset]'), 'Wirklich zurücksetzen?', () => run('admin:resetPassword', {}, ({ password }) => {
      actions.innerHTML = `<div class="new-pass"><span>${t('Neues Passwort:')}</span><code>${esc(password)}</code><button class="btn small" data-act="copy">${ICONS.copy}</button></div>`;
      actions.querySelector('[data-act=copy]').onclick = () => copyText(password);
    }));
  };

  const showBanForm = () => {
    actions.innerHTML = `<form class="ban-form"><input class="input" name="reason" maxlength="200" placeholder="${t('Grund (optional, sieht die Person)')}" />
      <button type="submit" class="btn small danger">${t('Sperren')}</button><button type="button" class="btn small" data-act="cancel">${t('Abbrechen')}</button></form>`;
    const form = actions.querySelector('form');
    form.reason.focus();
    form.onsubmit = (e) => {
      e.preventDefault();
      run('admin:ban', { reason: form.reason.value }, () => { toast(t('@{name} wurde gesperrt', { name: u.username })); reload(); });
    };
    form.querySelector('[data-act=cancel]').onclick = showButtons;
  };

  showButtons();
  return row;
}
