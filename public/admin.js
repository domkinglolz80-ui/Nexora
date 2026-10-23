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
  const isOwner = Boolean(state.me.owner);
  const { modal, close } = openModal(`
    <div class="bm-hero"><span class="bm-ico">${isOwner ? '👑' : ICONS.shield}</span><div><h3>${isOwner ? t('Owner-Zentrale') : t('Admin-Panel')}</h3>
      <p class="sub">${isOwner ? t('Voller Zugriff auf Nexora · angemeldet als <b>@{name}</b>', { name: esc(state.me.username) }) : t('Nexora verwalten · angemeldet als <b>@{name}</b>', { name: esc(state.me.username) })}</p></div></div>
    <div class="tabs" role="tablist">
      <button type="button" data-tab="overview">${t('Übersicht')}</button>
      <button type="button" data-tab="users">${t('Nutzer')}</button>
      <button type="button" data-tab="hubs">${t('Hubs')}</button>
      <button type="button" data-tab="bots">${t('Bots')}</button>
      ${isOwner ? `<button type="button" class="owner-tab" data-tab="team">👑 ${t('Team')}</button>
      <button type="button" class="owner-tab" data-tab="control">⚡ ${t('Kontrolle')}</button>
      <button type="button" class="owner-tab" data-tab="log">📜 ${t('Protokoll')}</button>` : ''}
    </div>
    <div class="tab-body admin-body"></div>
    <div class="modal-actions"><button class="btn" data-close>${t('Schließen')}</button></div>`, { className: `wide admin${isOwner ? ' owner' : ''}` });
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
            ${isOwner && !hub.isLounge ? `<button class="btn small" data-act="owner">👑 ${t('Besitzer')}</button>` : ''}
            ${hub.isLounge ? '' : `<button class="btn small danger" data-act="delete">${ICONS.trash} ${t('Löschen')}</button>`}
          </div>
        </div>`);
        row.querySelector('[data-act=owner]')?.addEventListener('click', () => {
          const actions = row.querySelector('.admin-actions');
          actions.innerHTML = `<form class="ban-form"><input class="input" name="username" maxlength="32" placeholder="${t('@nutzer – oder dein Name')}" value="@${esc(state.me.username)}" />
            <button type="submit" class="btn small primary">${t('Übertragen')}</button><button type="button" class="btn small" data-act="cancel">${t('Abbrechen')}</button></form>`;
          const form = actions.querySelector('form');
          form.username.select();
          form.querySelector('[data-act=cancel]').onclick = () => show('hubs');
          form.onsubmit = async (e) => {
            e.preventDefault();
            try {
              await req('owner:hubOwner', { hubId: hub.id, username: form.username.value });
              toast(t('„{name}“ hat einen neuen Besitzer', { name: hub.name }));
              show('hubs');
            } catch (ex) {
              toast(ex.message, 'error');
            }
          };
        });
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

  if (isOwner) Object.assign(views, ownerViews(body, () => show(tab)));

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

/* ---------- owner tools (@nexora only; the server checks it again) ---------- */

const AUDIT_LABELS = {
  register: ['🆕', 'hat sich registriert'],
  ban: ['🔨', 'hat gesperrt'],
  unban: ['✅', 'hat entsperrt'],
  kick: ['👢', 'hat aus einem Hub geworfen'],
  warn: ['⚠️', 'hat verwarnt'],
  logout: ['🚪', 'hat abgemeldet'],
  resetPassword: ['🔑', 'hat ein Passwort zurückgesetzt'],
  deleteHub: ['🗑️', 'hat einen Hub gelöscht'],
  hubOwner: ['👑', 'hat einen Hub übertragen'],
  botDisable: ['⛔', 'hat einen Bot gesperrt'],
  botEnable: ['🤖', 'hat einen Bot entsperrt'],
  deleteBot: ['🗑️', 'hat einen Bot gelöscht'],
  announce: ['📣', 'hat eine Ankündigung veröffentlicht'],
  announceClear: ['📣', 'hat die Ankündigung entfernt'],
  teamAdd: ['🛡️', 'hat ins Team geholt'],
  teamRemove: ['🛡️', 'hat aus dem Team entfernt'],
  maintenanceOn: ['🚧', 'hat den Wartungsmodus eingeschaltet'],
  maintenanceOff: ['🟢', 'hat den Wartungsmodus beendet'],
  broadcast: ['📢', 'hat eine Durchsage gesendet'],
};

function ownerViews(body, reload) {
  const run = async (event, payload, message) => {
    try {
      const res = await req(event, payload);
      if (message) toast(typeof message === 'function' ? message(res) : message);
      reload();
      return res;
    } catch (ex) {
      toast(ex.message, 'error');
      return null;
    }
  };

  return {
    async team() {
      const { team } = await req('owner:state');
      body.innerHTML = `
        <form class="owner-form">
          <div class="field"><span>${t('Ins Team holen')} <em>${t('– bekommt ✓-Abzeichen, Admin-Panel und den Nexora Helper')}</em></span></div>
          <div class="owner-inline"><input class="input" name="username" maxlength="32" placeholder="@nutzer" autocomplete="off" />
            <button type="submit" class="btn primary">🛡️ ${t('Ernennen')}</button></div>
        </form>
        <div class="admin-list"><div class="admin-count">${t('{n} im Team', { n: team.length })}</div></div>`;
      const list = body.querySelector('.admin-list');
      for (const u of team) {
        const row = h(`<div class="admin-row">
          ${avatar(u, { size: 38 })}
          <div class="info"><div class="name">${esc(u.displayName)}${verified(u)} ${u.online ? `<span class="pill ok">${t('Online')}</span>` : ''}</div>
            <div class="bio">@${esc(u.username)} · ${u.owner ? t('Owner') : u.fixed ? t('fest über NEXORA_OFFICIAL') : t('von dir ernannt')}</div></div>
          <div class="admin-actions">${u.owner || u.fixed ? '' : `<button class="btn small danger" data-act="remove">${t('Entfernen')}</button>`}</div>
        </div>`);
        const remove = row.querySelector('[data-act=remove]');
        if (remove) armButton(remove, 'Wirklich entfernen?', () => run('owner:setOfficial', { username: u.username, official: false }, t('@{name} ist nicht mehr im Team', { name: u.username })));
        list.append(row);
      }
      const form = body.querySelector('form');
      form.onsubmit = (e) => {
        e.preventDefault();
        const username = form.username.value.trim();
        if (username) run('owner:setOfficial', { username, official: true }, ({ user }) => t('@{name} ist jetzt im Team', { name: user.username }));
      };
    },

    async control() {
      const { maintenance } = await req('owner:state');
      body.innerHTML = `
        <form class="owner-card ${maintenance ? 'danger' : ''}" data-form="maintenance">
          <h4>🚧 ${t('Wartungsmodus')} ${maintenance ? `<span class="pill danger">${t('Aktiv seit {time}', { time: esc(stamp(maintenance.at)) })}</span>` : ''}</h4>
          <p class="hint">${t('Alle außer dem Team werden sofort abgemeldet und können sich erst wieder anmelden, wenn du den Wartungsmodus beendest. Neue Registrierungen sind solange gesperrt.')}</p>
          ${maintenance ? '' : `<label class="field"><input class="input" name="text" maxlength="200" placeholder="${t('Hinweis, z. B. Wir sind um 21 Uhr zurück 🔧')}" /></label>`}
          <div class="modal-actions" style="justify-content:flex-start">
            ${maintenance ? `<button type="submit" class="btn primary">🟢 ${t('Wartung beenden')}</button>` : `<button type="submit" class="btn danger" data-act="on">🚧 ${t('Wartung starten')}</button>`}
          </div>
        </form>
        <form class="owner-card" data-form="broadcast">
          <h4>📢 ${t('Live-Durchsage')}</h4>
          <p class="hint">${t('Erscheint sofort groß bei allen, die gerade online sind – egal wo sie in Nexora sind.')}</p>
          <label class="field"><textarea name="text" maxlength="300" rows="2" placeholder="${t('z. B. Happy Halloween, Leute! 🎃')}"></textarea></label>
          <div class="modal-actions" style="justify-content:flex-start"><button type="submit" class="btn primary">📢 ${t('Jetzt senden')}</button></div>
        </form>
        <div class="owner-card">
          <h4>✨ ${t('Deine Owner-Vorteile')}</h4>
          <ul class="owner-perks">
            <li>🏰 ${t('Du verwaltest jeden Hub wie sein Besitzer')}</li>
            <li>✍️ ${t('{n} Zeichen pro Nachricht', { n: numberFmt.format(myLimit(MAX_MESSAGE)) })}</li>
            <li>📎 ${t('{n} Anhänge mit je {mb} MB', { n: myLimit(MAX_ATTACHMENTS), mb: myLimit(MAX_FILE) / 1024 / 1024 })}</li>
            <li>📊 ${t('{n} Antworten pro Umfrage', { n: myLimit(MAX_POLL_OPTIONS) })}</li>
            <li>🤖 ${t('{n} eigene Bots', { n: myLimit(MAX_BOTS) })}</li>
            <li>⚡ ${t('Doppeltes Sende-Tempo')}</li>
          </ul>
        </div>`;
      const mForm = body.querySelector('[data-form=maintenance]');
      const onBtn = mForm.querySelector('[data-act=on]');
      if (onBtn) {
        onBtn.type = 'button';
        armButton(onBtn, 'Wirklich alle abmelden?', () => run('owner:maintenance', { enabled: true, text: mForm.text.value }, t('Wartungsmodus ist an')));
      } else {
        mForm.onsubmit = (e) => {
          e.preventDefault();
          run('owner:maintenance', { enabled: false }, t('Wartungsmodus ist aus – alle dürfen wieder rein'));
        };
      }
      const bForm = body.querySelector('[data-form=broadcast]');
      bForm.onsubmit = (e) => {
        e.preventDefault();
        if (!bForm.text.value.trim()) return;
        run('owner:broadcast', { text: bForm.text.value }, ({ reached }) => t('Durchsage an {n} online gesendet', { n: reached }));
      };
    },

    async log() {
      const { audit } = await req('owner:state');
      body.innerHTML = `<div class="admin-list audit-list"><div class="admin-count">${t('Die letzten {n} Ereignisse · neueste zuerst', { n: audit.length })}</div></div>`;
      const list = body.querySelector('.admin-list');
      if (!audit.length) list.append(h(`<div class="empty-hint">${t('Noch nichts passiert.')}</div>`));
      for (const e of audit) {
        const [icon, label] = AUDIT_LABELS[e.action] || ['•', e.action];
        list.append(h(`<div class="audit-row">
          <span class="audit-ico">${icon}</span>
          <div class="info"><div><b>${e.user ? `@${esc(e.user.username)}` : 'Nexora'}</b> ${t(label)}${e.detail ? ` <span class="audit-detail">${esc(e.detail)}</span>` : ''}</div>
            <small>${esc(stamp(e.at))}</small></div>
        </div>`));
      }
    },
  };
}
