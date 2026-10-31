/* Buffyverse TCG – visuelle Effekte (DOM + Web Animations, keine Bibliotheken) */
(function (G) {
  const B = G.BTCG;
  const F = (B.FX = {});
  const doc = G.document;
  let layer = null;
  F.reduced = G.matchMedia ? G.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  function L() {
    if (!layer || !doc.body.contains(layer)) { layer = doc.createElement('div'); layer.id = 'fx'; doc.body.appendChild(layer); }
    return layer;
  }
  function mk(cls, x, y, html) {
    const e = doc.createElement('div');
    e.className = cls;
    if (x != null) { e.style.left = x + 'px'; e.style.top = y + 'px'; }
    if (html) e.innerHTML = html;
    L().appendChild(e);
    return e;
  }
  const kill = (e, ms) => setTimeout(() => e.remove(), ms);
  const center = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  const rnd = (a, b) => a + Math.random() * (b - a);

  const TYPE_FX = {
    Kampf: { color: ['#ffb347', '#ff7a2f', '#ffe08a'], shape: 'spark' },
    Magie: { color: ['#d6b8ff', '#9b5cff', '#ffffff'], shape: 'star' },
    Vampir: { color: ['#ff3355', '#8e1027', '#2a0a12'], shape: 'bat' },
    'Dämon': { color: ['#9cff6a', '#3f9a4a', '#e0ff9a'], shape: 'ember' },
    Wissen: { color: ['#ffd77a', '#c99a2e', '#fff3c9'], shape: 'rune' },
    'Militär': { color: ['#e4ff9a', '#9fb34a', '#ffffff'], shape: 'spark' },
  };
  F.TYPE_FX = TYPE_FX;

  // Partikel-Explosion
  F.burst = function (x, y, o) {
    o = o || {};
    const n = F.reduced ? Math.min(6, o.count || 18) : o.count || 18;
    const colors = o.color || ['#ffd77a'];
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), d = rnd(o.min || 30, o.spread || 90);
      const p = mk('fxp ' + (o.shape || 'dot'), x, y);
      if (o.shape === 'bat') p.textContent = '🦇';
      else if (o.shape === 'rune') p.textContent = 'ᚠᚢᚦᚨᚱᚲᚷᚹ'[i % 8];
      else if (o.shape === 'star') p.textContent = '✦';
      p.style.color = colors[i % colors.length];
      p.style.background = o.shape === 'dot' || o.shape === 'spark' || o.shape === 'ember' || !o.shape ? colors[i % colors.length] : 'transparent';
      const s = rnd(0.6, 1.4) * (o.size || 1);
      const dur = rnd(500, 900) * (o.slow || 1);
      p.animate([
        { transform: `translate(-50%,-50%) scale(${s})`, opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + (o.gravity || 0)}px)) scale(${s * 0.2}) rotate(${rnd(-180, 180)}deg)`, opacity: 0 },
      ], { duration: dur, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
      kill(p, dur + 50);
    }
  };

  F.floatText = function (x, y, text, cls) {
    const e = mk('fxtext ' + (cls || ''), x, y, text);
    e.animate([
      { transform: 'translate(-50%,-50%) scale(.5)', opacity: 0 },
      { transform: 'translate(-50%,-90%) scale(1.25)', opacity: 1, offset: 0.2 },
      { transform: 'translate(-50%,-170%) scale(1)', opacity: 0 },
    ], { duration: 1300, easing: 'ease-out', fill: 'forwards' });
    kill(e, 1350);
  };

  F.shake = function (strength) {
    if (F.reduced) return;
    const app = doc.getElementById('app');
    const k = Math.min(14, strength || 6);
    app.animate([
      { transform: 'translate(0,0)' }, { transform: `translate(${-k}px, ${k / 2}px)` }, { transform: `translate(${k}px, ${-k / 2}px)` },
      { transform: `translate(${-k / 2}px, ${k / 3}px)` }, { transform: 'translate(0,0)' },
    ], { duration: 380, easing: 'ease-out' });
  };

  F.flash = function (color, ms) {
    const e = mk('fxflash');
    e.style.background = color || 'rgba(255,255,255,.35)';
    e.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0 }], { duration: ms || 450, fill: 'forwards' });
    kill(e, (ms || 450) + 30);
  };

  // Angreifer macht einen Ausfallschritt Richtung Verteidiger
  F.lunge = function (attEl, defEl) {
    if (!attEl || !defEl || F.reduced) return;
    const a = attEl.getBoundingClientRect(), d = defEl.getBoundingClientRect();
    const dx = (d.left - a.left) * 0.35, dy = (d.top - a.top) * 0.35;
    attEl.animate([
      { transform: 'none' },
      { transform: `translate(${-dx * 0.15}px, ${-dy * 0.15}px) scale(.97)`, offset: 0.25 },
      { transform: `translate(${dx}px, ${dy}px) scale(1.08)`, offset: 0.55 },
      { transform: 'none' },
    ], { duration: 520, easing: 'ease-in-out' });
  };

  F.impact = function (el, type, dmg, weak, weakLabel) {
    if (!el) return;
    const r = el.getBoundingClientRect(), c = center(r);
    const t = TYPE_FX[type] || TYPE_FX.Kampf;
    F.burst(c.x, c.y, { color: t.color, shape: t.shape, count: 14 + Math.min(20, dmg / 10), spread: 70 + Math.min(80, dmg / 2) });
    const ring = mk('fxring', c.x, c.y);
    ring.style.borderColor = t.color[0];
    kill(ring, 600);
    el.animate([{ filter: 'brightness(2.2) saturate(.3)' }, { filter: 'none' }], { duration: 300 });
    F.floatText(c.x, r.top + 10, `−${dmg}`, weak ? 'dmg weak' : 'dmg');
    if (weak) setTimeout(() => F.floatText(c.x, r.top + 40, weakLabel || 'WEAKNESS!', 'weaklbl'), 120);
    if (dmg >= 100) { F.shake(dmg >= 180 ? 12 : 7); F.flash('rgba(255,80,60,.18)'); }
  };

  F.heal = function (el, n) {
    if (!el) return;
    const r = el.getBoundingClientRect(), c = center(r);
    F.floatText(c.x, r.top + 14, `+${n}`, 'healtxt');
    F.burst(c.x, c.y, { color: ['#9bffb1', '#d8ffe0'], shape: 'star', count: 8, spread: 50, gravity: -40 });
  };

  F.pop = function (el, text) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    F.floatText(r.left + r.width / 2, r.top + r.height * 0.4, text, 'poptxt');
  };

  // Entwicklung: Lichtsäule, Strahlen, Funken
  F.evolve = function (el, name) {
    if (!el) return;
    const r = el.getBoundingClientRect(), c = center(r);
    const pillar = mk('fxpillar', c.x, r.bottom);
    pillar.style.width = r.width * 0.9 + 'px';
    kill(pillar, 1500);
    const rays = mk('fxrays', c.x, c.y);
    rays.style.width = rays.style.height = r.width * 2.4 + 'px';
    kill(rays, 1500);
    F.flash('rgba(255,225,140,.25)', 600);
    setTimeout(() => F.burst(c.x, c.y, { color: ['#fff6c8', '#ffd77a', '#ffffff'], shape: 'star', count: 26, spread: 120, slow: 1.4 }), 350);
    el.animate([
      { transform: 'scale(1)', filter: 'brightness(1)' },
      { transform: 'scale(1.12)', filter: 'brightness(2.4) saturate(.4)', offset: 0.4 },
      { transform: 'scale(.96)', filter: 'brightness(1.3)', offset: 0.7 },
      { transform: 'scale(1)', filter: 'brightness(1)' },
    ], { duration: 1100, easing: 'ease-out' });
    if (name) setTimeout(() => F.floatText(c.x, r.top - 6, '✨ ' + name, 'evotxt'), 300);
  };

  // K.O.: Karte zerfällt zu Staub (Vampire) bzw. löst sich in Rauch auf
  F.ko = function (snap, type, name, bigBad) {
    if (!snap) return;
    const r = snap.rect, c = center(r);
    const ghost = mk('fxghost');
    ghost.innerHTML = snap.html;
    Object.assign(ghost.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    const vamp = type === 'Vampir';
    ghost.animate([
      { transform: 'none', filter: 'none', opacity: 1 },
      { transform: 'translateX(-5px) rotate(-1deg)', filter: 'grayscale(.5) brightness(1.6)', opacity: 1, offset: 0.15 },
      { transform: 'translateX(5px) rotate(1deg)', filter: 'grayscale(1) brightness(.8)', opacity: 1, offset: 0.3 },
      { transform: 'translateY(8px) scale(.96)', filter: 'grayscale(1) brightness(.5) blur(1px)', opacity: 0.85, offset: 0.55 },
      { transform: 'translateY(26px) scale(.9)', filter: 'grayscale(1) brightness(.3) blur(5px)', opacity: 0 },
    ], { duration: 1300, easing: 'ease-in', fill: 'forwards' });
    kill(ghost, 1350);
    setTimeout(() => {
      const dust = vamp ? ['#b9a58a', '#8a7a64', '#d8c9ad'] : type === 'Dämon' ? ['#3f9a4a', '#1d3d22', '#9cff6a'] : ['#8a2333', '#3a1020', '#c9a9b2'];
      for (let k = 0; k < (F.reduced ? 1 : 3); k++) setTimeout(() => F.burst(c.x + rnd(-r.width / 3, r.width / 3), c.y + rnd(-r.height / 4, r.height / 4), { color: dust, shape: 'dot', count: 22, spread: 110, gravity: 60, slow: 1.6, size: 1.3 }), k * 120);
      F.floatText(c.x, c.y, bigBad ? '💀💀' : '💀', 'kotxt');
    }, 380);
    F.flash(bigBad ? 'rgba(196,29,58,.35)' : 'rgba(0,0,0,.35)', 700);
    F.shake(bigBad ? 12 : 6);
  };

  // Münzwurf in der Bildschirmmitte
  F.coin = function (heads, label, at, hTxt, zTxt) {
    setTimeout(() => {
      const e = mk('fxcoin', null, null, `<div class="c3d"><div class="face kopf">🦇<small>${hTxt || 'HEADS'}</small></div><div class="face zahl">✝<small>${zTxt || 'TAILS'}</small></div></div><div class="clbl">${label || ''}</div>`);
      const c3 = e.querySelector('.c3d');
      c3.animate([{ transform: 'rotateY(0) translateY(0)' }, { transform: `rotateY(${heads ? 1440 : 1620}deg) translateY(-30px)`, offset: 0.6 }, { transform: `rotateY(${heads ? 1440 : 1620}deg) translateY(0)` }], { duration: 900, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
      e.animate([{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 1500, fill: 'forwards' });
      kill(e, 1550);
    }, at || 0);
  };

  F.banner = function (text, cls) {
    const e = mk('fxbanner ' + (cls || ''), null, null, `<span>${text}</span>`);
    e.animate([
      { transform: 'translate(-50%,-50%) scaleX(0)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scaleX(1)', opacity: 1, offset: 0.2 },
      { transform: 'translate(-50%,-50%) scaleX(1)', opacity: 1, offset: 0.8 },
      { transform: 'translate(-50%,-50%) scaleX(1.05)', opacity: 0 },
    ], { duration: 1400, easing: 'ease-out', fill: 'forwards' });
    kill(e, 1450);
  };

  F.confetti = function () {
    const W = G.innerWidth;
    for (let i = 0; i < (F.reduced ? 20 : 90); i++) {
      const p = mk('fxp confetti', rnd(0, W), -20);
      p.style.background = ['#d6ad52', '#c41d3a', '#f1e9d8', '#8a4fd8'][i % 4];
      const dur = rnd(1800, 3200);
      p.animate([{ transform: `translateY(0) rotate(0)` }, { transform: `translate(${rnd(-120, 120)}px, ${G.innerHeight + 60}px) rotate(${rnd(360, 1080)}deg)` }], { duration: dur, delay: rnd(0, 700), easing: 'ease-in', fill: 'forwards' });
      kill(p, dur + 800);
    }
  };
  F.gloom = function () {
    const e = mk('fxgloom');
    e.animate([{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 2600, fill: 'forwards' });
    kill(e, 2650);
  };

  F.glowOnce = function (el, color) {
    if (!el) return;
    el.animate([{ boxShadow: `0 0 0 0 ${color}` }, { boxShadow: `0 0 0 18px rgba(0,0,0,0)` }], { duration: 600, easing: 'ease-out' });
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
