/* Buffyverse TCG – Kartenmotive (eigene, abstrakte Motive je Typ) + eigene Bilder (IndexedDB) */
(function (G) {
  const B = G.BTCG;
  const A = (B.Art = {});

  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let t = seed; return () => { t = (t + 0x6d2b79f5) | 0; let r = Math.imul(t ^ (t >>> 15), t | 1); r ^= r + Math.imul(r ^ (r >>> 7), r | 61); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }

  const EMOJI = {
    giles_training: '📚', library: '📖', council: '🏛️', patrol: '🪦', xander_basement: '🛋️', willow_hack: '💻', anya_shop: '💰', joyce_cocoa: '☕',
    spike_crypt: '⚰️', scooby_meeting: '🍩', initiative_brief: '📋', magic_box: '🔮', holy_water: '💧', cross: '✝️', crossbow: '🏹', watcher_diary: '📓',
    herbs: '🌿', switch: '🚪', resurrection: '🕯️', bronze_night: '🎸', spellbook: '📕', armory: '⚔️', blood_bags: '🩸', old_books: '📜', wrecking: '🏗️',
    mr_pointy: '🪵', scythe: '🪓', leather_coat: '🧥', amulet: '📿', gem_amara: '💍', rocket_launcher: '🚀', shame: '🌙', sunnydale_high: '🏫', bronze: '🎶',
    hellmouth: '🌋', lab314: '🧪', restfield: '🪦', crawford: '🏚️', acathla: '🗿', magic_shop_stadium: '✨',
  };

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r * f); g = Math.round(g * f); b = Math.round(b * f);
    return `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
  }
  const bat = (x, y, s, col) => `<path transform="translate(${x},${y}) scale(${s})" fill="${col}" d="M0 0 C-3 -4 -8 -5 -12 -2 C-10 -2 -9 0 -9 2 C-7 0 -5 1 -4 3 C-3 1 -1 1 0 2 C1 1 3 1 4 3 C5 1 7 0 9 2 C9 0 10 -2 12 -2 C8 -5 3 -4 0 0 Z"/>`;

  A.svg = function (id) {
    const c = B.CARDS[id];
    const r = rng(hash(id));
    const uid = 'g' + hash(id).toString(36);
    let base = '#4a3d63', motif = '', overlay = '';
    if (c.kind === 'char') base = B.TYPES[c.type].color;
    else if (c.kind === 'energy') base = B.ENERGY[c.energy].color;
    else base = { 'Unterstützer': '#2f8f8a', Gegenstand: '#3a6fb5', 'Ausrüstung': '#8a8f98', Stadion: '#4f8a3a' }[c.sub];

    // Sternenhimmel
    let stars = '';
    for (let i = 0; i < 26; i++) stars += `<circle cx="${(r() * 200).toFixed(1)}" cy="${(r() * 70).toFixed(1)}" r="${(r() * 0.9 + 0.2).toFixed(2)}" fill="#fff" opacity="${(r() * 0.6 + 0.2).toFixed(2)}"/>`;
    const mx = 30 + r() * 140, my = 18 + r() * 18, mr = 10 + r() * 8;
    const moon = `<circle cx="${mx}" cy="${my}" r="${mr * 2.2}" fill="url(#${uid}m)"/><circle cx="${mx}" cy="${my}" r="${mr}" fill="#f4ecd2"/><circle cx="${mx + mr * 0.4}" cy="${my - mr * 0.15}" r="${mr * 0.92}" fill="${shade(base, 0.22)}" opacity="${c.kind === 'char' && c.type === 'Vampir' ? 0 : 0.0}"/>`;

    // Friedhofs-Horizont
    let ground = `<path d="M0 ${96 + r() * 6} Q 50 ${88 + r() * 8} 100 ${94 + r() * 6} T 200 ${92 + r() * 6} V120 H0Z" fill="#07060b"/>`;
    for (let i = 0; i < 5; i++) {
      const x = r() * 190, h = 8 + r() * 10, w = 6 + r() * 5;
      ground += `<path d="M${x} 118 V${118 - h} q ${w / 2} -${w * 0.7} ${w} 0 V118Z" fill="#07060b"/>`;
      if (r() < 0.4) ground += `<rect x="${x + w / 2 - 0.7}" y="${118 - h - 9}" width="1.4" height="7" fill="#07060b"/><rect x="${x + w / 2 - 3}" y="${118 - h - 7}" width="6" height="1.4" fill="#07060b"/>`;
    }

    if (c.kind === 'char') {
      const init = c.name.replace(/^(Der|Die|Das) /, '').charAt(0);
      motif += `<text x="${150 - r() * 100}" y="98" font-family="Georgia,serif" font-size="96" font-weight="700" fill="#fff" opacity="0.07">${init}</text>`;
      switch (c.type) {
        case 'Kampf': {
          const cx = 100 + (r() - 0.5) * 40;
          for (const ang of [-28, 28]) motif += `<g transform="translate(${cx},66) rotate(${ang})"><path d="M-3 -40 L3 -40 L4 26 L0 38 L-4 26Z" fill="#8a5a33" stroke="#3a2412" stroke-width="1"/><path d="M-3 -34 H3 M-3 -20 H3" stroke="#5c3a1c" stroke-width="1"/></g>`;
          motif += `<circle cx="${cx}" cy="66" r="30" fill="url(#${uid}m)" opacity="0.6"/>`;
          break;
        }
        case 'Magie': {
          const cx = 100 + (r() - 0.5) * 50, cy = 60;
          motif += `<circle cx="${cx}" cy="${cy}" r="34" fill="none" stroke="#d8c2ff" stroke-width="0.8" stroke-dasharray="3 2" opacity="0.7"/><circle cx="${cx}" cy="${cy}" r="27" fill="none" stroke="#d8c2ff" stroke-width="0.5" opacity="0.5"/>`;
          for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + r(); motif += `<text x="${cx + Math.cos(a) * 31}" y="${cy + Math.sin(a) * 31 + 2}" font-size="6" fill="#eadcff" text-anchor="middle" opacity="0.8">${'ᚠᚢᚦᚨᚱᚲᛉᛟ'[Math.floor(r() * 8)]}</text>`; }
          motif += `<circle cx="${cx}" cy="${cy}" r="16" fill="url(#${uid}o)"/>`;
          for (let i = 0; i < 12; i++) motif += `<circle cx="${cx + (r() - 0.5) * 80}" cy="${cy + (r() - 0.5) * 60}" r="${r() * 1.4 + 0.3}" fill="#f3e8ff" opacity="${r() * 0.8 + 0.2}"/>`;
          break;
        }
        case 'Vampir': {
          for (let i = 0; i < 5; i++) motif += bat(20 + r() * 160, 20 + r() * 50, 0.8 + r() * 1.6, '#0a0508');
          const ax = 70 + r() * 60;
          motif += `<path d="M${ax - 22} 118 V72 Q ${ax} 40 ${ax + 22} 72 V118Z" fill="#0b070d"/><path d="M${ax - 12} 118 V80 Q ${ax} 62 ${ax + 12} 80 V118Z" fill="#2b0910"/>`;
          break;
        }
        case 'Dämon': {
          for (let i = 0; i < 3; i++) motif += `<ellipse cx="${100 + (r() - 0.5) * 120}" cy="${80 + r() * 20}" rx="${50 + r() * 40}" ry="${8 + r() * 6}" fill="#9fe3a8" opacity="0.08"/>`;
          const ex = 100 + (r() - 0.5) * 50, ey = 58 + (r() - 0.5) * 14, col = r() < 0.5 ? '#ff4d3a' : '#b6ff5c';
          motif += `<path d="M${ex - 34} ${ey - 4} L ${ex - 22} ${ey - 30} L ${ex - 16} ${ey - 8}Z M${ex + 34} ${ey - 4} L ${ex + 22} ${ey - 30} L ${ex + 16} ${ey - 8}Z" fill="#06040a"/>`;
          motif += `<ellipse cx="${ex - 10}" cy="${ey}" rx="6" ry="2.6" fill="${col}"/><ellipse cx="${ex + 10}" cy="${ey}" rx="6" ry="2.6" fill="${col}"/><ellipse cx="${ex}" cy="${ey}" rx="30" ry="12" fill="${col}" opacity="0.12"/>`;
          break;
        }
        case 'Wissen': {
          const bx = 100 + (r() - 0.5) * 40;
          motif += `<path d="M${bx} 86 L${bx - 40} 80 L${bx - 40} 58 L${bx} 64Z" fill="#e9dcc0" stroke="#5a4425"/><path d="M${bx} 86 L${bx + 40} 80 L${bx + 40} 58 L${bx} 64Z" fill="#f2e7cf" stroke="#5a4425"/>`;
          for (let i = 0; i < 4; i++) motif += `<path d="M${bx - 34} ${66 + i * 4} L${bx - 6} ${70 + i * 4} M${bx + 6} ${70 + i * 4} L${bx + 34} ${66 + i * 4}" stroke="#8b7550" stroke-width="0.6"/>`;
          const kx = bx + 52;
          motif += `<rect x="${kx - 3}" y="62" width="6" height="22" fill="#efe6cf"/><path d="M${kx} 61 q -4 -6 0 -12 q 4 6 0 12Z" fill="#ffcf5a"/><circle cx="${kx}" cy="55" r="14" fill="url(#${uid}m)"/>`;
          break;
        }
        case 'Militär': {
          const cx = 100 + (r() - 0.5) * 40, cy = 60;
          for (let i = 1; i <= 3; i++) motif += `<circle cx="${cx}" cy="${cy}" r="${i * 12}" fill="none" stroke="#c8e6a0" stroke-width="0.6" opacity="0.6"/>`;
          motif += `<path d="M${cx - 44} ${cy} H${cx + 44} M${cx} ${cy - 44} V${cy + 44}" stroke="#c8e6a0" stroke-width="0.6" opacity="0.6"/>`;
          motif += `<path d="M${cx} ${cy} L${cx + 36 * Math.cos(r() * 6.28)} ${cy + 36 * Math.sin(r() * 6.28)}" stroke="#d8ff9a" stroke-width="1.4"/>`;
          for (let i = 0; i < 3; i++) motif += `<path d="M${20} ${30 + i * 6} l8 -4 l8 4" fill="none" stroke="#e4d27a" stroke-width="1.6"/>`;
          break;
        }
      }
      if (c.bigBad) overlay += `<rect width="200" height="120" fill="url(#${uid}bb)"/>`;
    } else if (c.kind === 'energy') {
      motif += `<circle cx="100" cy="58" r="40" fill="url(#${uid}m)"/><text x="100" y="74" font-size="46" text-anchor="middle">${B.ENERGY[c.energy].icon}</text>`;
      ground = '';
    } else {
      if (c.sub === 'Stadion') {
        let sky = '';
        for (let x = 0; x < 200; x += 14 + r() * 10) { const h = 14 + r() * 30; sky += `<rect x="${x}" y="${100 - h}" width="${10 + r() * 8}" height="${h + 20}" fill="#0a0910"/>`; if (r() < 0.5) sky += `<rect x="${x + 3}" y="${100 - h + 5}" width="2.4" height="2.4" fill="#ffd77a" opacity="0.8"/>`; }
        motif += sky;
      }
      motif += `<circle cx="100" cy="56" r="34" fill="url(#${uid}m)"/><text x="100" y="72" font-size="42" text-anchor="middle">${EMOJI[c.id] || '🃏'}</text>`;
    }

    return `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><defs>
      <linearGradient id="${uid}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(base, 0.18)}"/><stop offset="1" stop-color="${shade(base, 0.62)}"/></linearGradient>
      <radialGradient id="${uid}m"><stop offset="0" stop-color="#fff6d8" stop-opacity="0.55"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
      <radialGradient id="${uid}o"><stop offset="0" stop-color="#fff"/><stop offset="0.35" stop-color="#cfa8ff"/><stop offset="1" stop-color="#6d2fd0" stop-opacity="0"/></radialGradient>
      <radialGradient id="${uid}bb" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#ff1e3c" stop-opacity="0"/><stop offset="1" stop-color="#ff1e3c" stop-opacity="0.55"/></radialGradient>
    </defs><rect width="200" height="120" fill="url(#${uid}bg)"/>${stars}${c.kind === 'energy' ? '' : moon}${motif}${ground}${overlay}</svg>`;
  };

  // ---------- Eigene Bilder (bleiben lokal auf deinem Gerät) ----------
  A.user = {};
  let db = null;
  function openDb() {
    return new Promise((res) => {
      if (!G.indexedDB) return res(null);
      try {
        const req = G.indexedDB.open('buffyverse_tcg_art', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('art');
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(null);
      } catch (e) { res(null); }
    });
  }
  A.init = async function () {
    db = await openDb();
    if (!db) return;
    await new Promise((res) => {
      const tx = db.transaction('art', 'readonly');
      const st = tx.objectStore('art');
      const req = st.openCursor();
      req.onsuccess = () => { const cur = req.result; if (cur) { A.user[cur.key] = cur.value; cur.continue(); } else res(); };
      req.onerror = () => res();
    });
  };
  A.set = function (id, dataUrl) {
    A.user[id] = dataUrl;
    if (!db) return;
    const tx = db.transaction('art', 'readwrite');
    if (dataUrl) tx.objectStore('art').put(dataUrl, id); else tx.objectStore('art').delete(id);
  };
  A.fromFile = function (file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          // auf das Kartenformat 5:3 zuschneiden und verkleinern
          const W = 500, H = 300, cv = document.createElement('canvas');
          cv.width = W; cv.height = H;
          const ctx = cv.getContext('2d');
          const sc = Math.max(W / img.width, H / img.height);
          const w = img.width * sc, h = img.height * sc;
          ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
          res(cv.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = rej;
        img.src = fr.result;
      };
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  };
  A.html = function (id) {
    if (A.user[id]) return `<img src="${A.user[id]}" alt="">`;
    return A.svg(id);
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
