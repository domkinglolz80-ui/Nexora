/* =========================================================================
   Nexora — Halloween Edition 2026
   Seasonal effects: laughing pumpkins on the splash and login, a countdown
   and ghosts that float by and can be caught. Uses helpers from app.js.
   ========================================================================= */

(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.body.classList.toggle('calm', store('spooky') === false);

  // Big laughing pumpkins, built from the avatar accessory so both look the same.
  const pumpkin = (extra) => {
    const el = h(accessoryHtml('kuerbis'));
    el.classList.add('hw-pumpkin', extra);
    return el;
  };
  $('#splash').replaceChildren(pumpkin('hw-splash-pumpkin'));
  $('#hw-hero-pumpkin')?.replaceWith(pumpkin('hw-hero-pumpkin'));

  // Countdown to October 31st on the login screen.
  const countdown = $('#hw-countdown');
  if (countdown) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nights = Math.round((new Date(now.getFullYear(), 9, 31) - today) / 864e5);
    countdown.textContent =
      nights > 1 ? `🕯️ Noch ${nights} Nächte bis Halloween`
      : nights === 1 ? '🕯️ Morgen ist Halloween!'
      : nights === 0 ? '🎃 Happy Halloween! Süßes oder Saures?'
      : '🕸️ Danke fürs Mitgruseln!';
  }

  /* ---------- ghost hunt ---------- */

  const GHOST_SVG = '<svg viewBox="0 0 30 34"><path class="body" d="M15 2C7 2 3 8 3 15v17l4-3 4 3 4-3 4 3 4-3 4 3V15c0-7-4-13-12-13z"/><ellipse class="eye" cx="11" cy="14" rx="2" ry="3"/><ellipse class="eye" cx="19" cy="14" rx="2" ry="3"/><ellipse class="eye" cx="15" cy="22" rx="2.5" ry="2"/></svg>';
  const MILESTONES = {
    1: 'Buh! Dein erster Geist ist gefangen 👻',
    5: '5 Geister! Die Lounge spukt schon weniger 🕯️',
    13: '13 Geister – Unglückszahl? Nicht für dich. Offiziell Geisterjäger:in 🏆',
    31: '31 Geister zum 31. Oktober. Legendär! 🎃👑',
  };

  function catchGhost(ghost) {
    if (ghost.classList.contains('caught')) return;
    // Freeze the ghost where it was caught, then let it vanish.
    ghost.style.transform = getComputedStyle(ghost).transform;
    ghost.style.animation = 'none';
    ghost.classList.add('caught');
    setTimeout(() => ghost.remove(), 600);
    const n = (Number(store('ghosts')) || 0) + 1;
    store('ghosts', n);
    toast(MILESTONES[n] || `Buh! Geist gefangen 👻 Du hast jetzt ${n}.`, 'spooky');
  }

  function spawnGhost() {
    const app = $('#app');
    if (document.hidden || reducedMotion.matches || document.body.classList.contains('calm')) return;
    if (!app || app.classList.contains('hidden') || $('.hw-ghost')) return;
    const ghost = h(`<button type="button" class="hw-ghost" title="Fang mich!" aria-label="Geist fangen">${GHOST_SVG}</button>`);
    ghost.style.top = `${12 + Math.random() * 60}%`;
    if (Math.random() < 0.5) ghost.classList.add('rtl');
    ghost.addEventListener('click', () => catchGhost(ghost));
    ghost.addEventListener('animationend', (e) => {
      if (e.target === ghost && !ghost.classList.contains('caught')) ghost.remove();
    });
    document.body.append(ghost);
  }

  (function schedule(delay) {
    setTimeout(() => {
      spawnGhost();
      schedule(40000 + Math.random() * 50000);
    }, delay);
  })(20000);
})();
