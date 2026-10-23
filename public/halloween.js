/* =========================================================================
   Nexora — Halloween Edition 2026
   Seasonal effects: laughing pumpkins on the splash and login, a countdown,
   ghosts that float by and can be caught (rare golden ones count three times;
   they are spent in the Geister-Laden), a candy burst for every catch and a candy rain for "trick or treat".
   Uses helpers from app.js.
   ========================================================================= */

(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.body.classList.toggle('calm', store('spooky') === false);

  const today = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };
  const isHalloween = () => {
    const d = today();
    return d.getMonth() === 9 && d.getDate() === 31;
  };
  const spooky = () => !document.hidden && !reducedMotion.matches && !document.body.classList.contains('calm');

  // Big laughing pumpkins, built from the avatar accessory so both look the same.
  const pumpkin = (extra) => {
    const el = h(accessoryHtml('kuerbis'));
    el.classList.add('hw-pumpkin', extra);
    return el;
  };
  $('#splash').replaceChildren(pumpkin('hw-splash-pumpkin'));
  $('#hw-hero-pumpkin')?.replaceWith(pumpkin('hw-hero-pumpkin'));

  // Countdown to October 31st on the login screen. After Halloween it counts to next year's.
  const countdown = $('#hw-countdown');
  if (countdown) {
    const d = today();
    const nights = Math.round((new Date(d.getFullYear(), 9, 31) - d) / 864e5);
    countdown.textContent =
      nights > 1 ? t('🕯️ Noch {n} Nächte bis Halloween', { n: nights })
      : nights === 1 ? t('🕯️ Morgen ist Halloween!')
      : nights === 0 ? t('🎃 Happy Halloween! Süßes oder Saures?')
      : nights > -8 ? t('🕸️ Danke fürs Mitgruseln!')
      : t('🕯️ Noch {n} Nächte bis Halloween', { n: Math.round((new Date(d.getFullYear() + 1, 9, 31) - d) / 864e5) });
  }

  /* ---------- candy ---------- */

  const CANDY = ['🍬', '🍭', '🍫', '🎃', '👻', '🦇', '✨'];
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  // A handful of sweets bursting out of a point on the screen.
  function burst(x, y, count = 9, golden = false) {
    if (reducedMotion.matches) return;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const dist = 50 + Math.random() * 70;
      const el = h(`<span class="hw-candy" aria-hidden="true">${golden && i % 2 ? '⭐' : pick(CANDY)}</span>`);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      el.style.setProperty('--dy', `${Math.sin(angle) * dist - 30}px`);
      el.style.setProperty('--r', `${Math.round(Math.random() * 360 - 180)}deg`);
      el.addEventListener('animationend', () => el.remove());
      document.body.append(el);
    }
  }

  // Sweets falling over the whole screen, at most every 20 seconds.
  let lastRain = 0;
  function candyRain() {
    if (!spooky() || Date.now() - lastRain < 20000) return;
    lastRain = Date.now();
    for (let i = 0; i < 28; i++) {
      const el = h(`<span class="hw-candy rain" aria-hidden="true">${pick(CANDY)}</span>`);
      el.style.left = `${Math.random() * 100}vw`;
      el.style.animationDelay = `${Math.random() * 1.6}s`;
      el.style.animationDuration = `${2.6 + Math.random() * 1.8}s`;
      el.style.setProperty('--r', `${Math.round(Math.random() * 540 - 270)}deg`);
      el.addEventListener('animationend', () => el.remove());
      document.body.append(el);
    }
  }

  const TRICK_OR_TREAT = /süßes oder saures|suesses oder saures|trick or treat|happy halloween|🎃\s*🎃\s*🎃/i;
  document.addEventListener('nexora:message', (e) => {
    if (TRICK_OR_TREAT.test(e.detail?.content || '')) candyRain();
  });

  /* ---------- ghost hunt ---------- */

  const GHOST_SVG = '<svg viewBox="0 0 30 34"><path class="body" d="M15 2C7 2 3 8 3 15v17l4-3 4 3 4-3 4 3 4-3 4 3V15c0-7-4-13-12-13z"/><ellipse class="eye" cx="11" cy="14" rx="2" ry="3"/><ellipse class="eye" cx="19" cy="14" rx="2" ry="3"/><ellipse class="eye" cx="15" cy="22" rx="2.5" ry="2"/></svg>';
  const GOLDEN_CHANCE = 1 / 8;
  const GOLDEN_VALUE = 3;
  const MILESTONES = {
    1: t('Buh! Dein erster Geist ist gefangen 👻'),
    5: t('5 Geister! Die Lounge spukt schon weniger 🕯️'),
    13: t('13 Geister – Unglückszahl? Nicht für dich. Offiziell Geisterjäger:in 🏆'),
    31: t('31 Geister zum 31. Oktober. Legendär! 🎃👑'),
    66: t('66 Geister! Du bist jetzt eine Legende der Nacht 🌕'),
  };

  // The counter belongs to the account (server); older versions kept it on the device only.
  document.addEventListener('nexora:ready', () => {
    const local = Number(store('ghosts')) || 0;
    if (!local || store('ghostsSynced')) return;
    req('halloween:sync', { count: local })
      .then(({ ghosts, ghostsCaught }) => {
        store('ghostsSynced', true);
        state.me.ghosts = ghosts;
        state.me.ghostsCaught = ghostsCaught;
        state.users.set(state.me.id, state.me);
      })
      .catch(() => {});
  });

  function catchGhost(ghost) {
    if (ghost.classList.contains('caught')) return;
    const golden = ghost.classList.contains('golden');
    // Freeze the ghost where it was caught, then let it vanish.
    ghost.style.transform = getComputedStyle(ghost).transform;
    ghost.style.animation = 'none';
    ghost.classList.add('caught');
    setTimeout(() => ghost.remove(), 600);
    const r = ghost.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, golden ? 14 : 9, golden);

    // Milestones count every ghost ever caught; "you now have" is what is left to spend in the shop.
    const before = state.me.ghostsCaught || 0;
    const value = golden ? GOLDEN_VALUE : 1;
    const after = before + value;
    const wallet = (state.me.ghosts || 0) + value;
    state.me.ghostsCaught = after;
    state.me.ghosts = wallet;
    // A golden ghost can jump over a milestone, so take the highest one passed.
    const passed = Object.keys(MILESTONES).map(Number).filter((m) => m > before && m <= after).pop();
    const text = passed ? MILESTONES[passed]
      : golden ? t('✨ Ein goldener Geist! Zählt dreifach – du hast jetzt {n}.', { n: wallet })
      : t('Buh! Geist gefangen 👻 Du hast jetzt {n}.', { n: wallet });
    toast(text, 'spooky');
    req('halloween:ghost', { golden })
      .then(({ ghosts, ghostsCaught }) => {
        state.me.ghosts = ghosts;
        state.me.ghostsCaught = ghostsCaught;
        state.users.set(state.me.id, state.me);
      })
      .catch(() => {});
  }

  function spawnGhost() {
    const app = $('#app');
    if (!spooky() || !state.me) return;
    if (!app || app.classList.contains('hidden') || $('.hw-ghost')) return;
    const golden = Math.random() < GOLDEN_CHANCE;
    const label = golden ? t('Goldenen Geist fangen') : t('Geist fangen');
    const ghost = h(`<button type="button" class="hw-ghost${golden ? ' golden' : ''}" title="${esc(t('Fang mich!'))}" aria-label="${esc(label)}">${GHOST_SVG}</button>`);
    ghost.style.top = `${12 + Math.random() * 60}%`;
    if (Math.random() < 0.5) ghost.classList.add('rtl');
    ghost.addEventListener('click', () => catchGhost(ghost));
    ghost.addEventListener('animationend', (e) => {
      if (e.target === ghost && !ghost.classList.contains('caught')) ghost.remove();
    });
    document.body.append(ghost);
  }

  // On Halloween night the ghosts come more than twice as often.
  (function schedule(delay) {
    setTimeout(() => {
      spawnGhost();
      schedule(isHalloween() ? 15000 + Math.random() * 20000 : 40000 + Math.random() * 50000);
    }, delay);
  })(isHalloween() ? 8000 : 20000);
})();
