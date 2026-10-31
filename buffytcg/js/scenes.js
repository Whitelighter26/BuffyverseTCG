/* Buffyverse TCG – Hintergründe: Menü (düster, modern, Blutspritzer) + zufällige Schauplätze pro Spiel
   Alles ist selbst gezeichnetes SVG – keine fremden Bilder. */
(function (G) {
  const B = G.BTCG;
  const SC = (B.Scenes = {});
  const W = 1600, H = 900;
  function rng(seed) { let t = seed >>> 0; return () => { t = (t + 0x6d2b79f5) | 0; let r = Math.imul(t ^ (t >>> 15), t | 1); r ^= r + Math.imul(r ^ (r >>> 7), r | 61); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  const wrap = (defs, body, bg) => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs><rect width="${W}" height="${H}" fill="${bg || '#08060a'}"/>${body}</svg>`;
  const grain = (id, op) => `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${op || 0.08} 0"/></filter>`;

  // ---------- Blutspritzer ----------
  function splatter(x, y, r, seed, col) {
    const R = rng(seed);
    col = col || '#7d0a18';
    let out = '';
    // Hauptfleck: unregelmäßiger Kreis
    const pts = [];
    const n = 18;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const rr = r * (0.6 + R() * 0.55); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n; i++) { const p = pts[(i + 1) % n], c = pts[i]; d += ` Q${c[0] + (R() - 0.5) * r * 0.4},${c[1] + (R() - 0.5) * r * 0.4} ${(c[0] + p[0]) / 2},${(c[1] + p[1]) / 2}`; }
    out += `<path d="${d}Z" fill="${col}"/>`;
    // Spritzer-Strahlen
    for (let i = 0; i < 9; i++) {
      const a = R() * Math.PI * 2, len = r * (1.2 + R() * 1.6), w = r * (0.05 + R() * 0.1);
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      out += `<path d="M${x + Math.cos(a + 0.2) * r * 0.6},${y + Math.sin(a + 0.2) * r * 0.6} L${ex},${ey} L${x + Math.cos(a - 0.2) * r * 0.6},${y + Math.sin(a - 0.2) * r * 0.6}Z" fill="${col}" opacity=".9"/><circle cx="${ex}" cy="${ey}" r="${w * 1.6}" fill="${col}"/>`;
    }
    // Tröpfchen
    for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, dist = r * (1.1 + R() * 2.6); out += `<circle cx="${x + Math.cos(a) * dist}" cy="${y + Math.sin(a) * dist}" r="${r * (0.02 + R() * 0.09)}" fill="${col}" opacity="${0.6 + R() * 0.4}"/>`; }
    // Läufer nach unten
    for (let i = 0; i < 3; i++) {
      const dx = x + (R() - 0.5) * r, len = r * (0.8 + R() * 2.4), w = r * (0.06 + R() * 0.08);
      out += `<rect x="${dx - w / 2}" y="${y}" width="${w}" height="${len}" rx="${w / 2}" fill="${col}"/><circle cx="${dx}" cy="${y + len}" r="${w * 0.9}" fill="${col}"/>`;
    }
    // Glanz
    out += `<ellipse cx="${x - r * 0.25}" cy="${y - r * 0.3}" rx="${r * 0.22}" ry="${r * 0.1}" fill="#ff5a6e" opacity=".18" transform="rotate(-25 ${x} ${y})"/>`;
    return `<g>${out}</g>`;
  }
  SC.splatter = splatter;

  // ---------- Menü ----------
  SC.menuSVG = function () {
    const defs = `<radialGradient id="mv" cx=".5" cy=".45" r=".75"><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
      <linearGradient id="mbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#140910"/><stop offset=".5" stop-color="#0a0709"/><stop offset="1" stop-color="#1a0a10"/></linearGradient>
      <linearGradient id="neon" x1="0" x2="1"><stop offset="0" stop-color="#ff2a4a" stop-opacity="0"/><stop offset=".5" stop-color="#ff2a4a"/><stop offset="1" stop-color="#ff2a4a" stop-opacity="0"/></linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="6"/></filter>${grain('mgr', 0.1)}`;
    let body = `<rect width="${W}" height="${H}" fill="url(#mbg)"/>`;
    // feine Linien-Struktur (modern)
    for (let i = 0; i < 26; i++) body += `<line x1="${i * 70 - 300}" y1="0" x2="${i * 70 + 300}" y2="${H}" stroke="#ffffff" stroke-opacity=".015"/>`;
    // Blutspritzer
    body += `<g opacity=".95">${splatter(130, 120, 95, 7, '#6e0814')}${splatter(1480, 760, 120, 21, '#5c0712')}${splatter(1380, 120, 40, 33, '#7d0a18')}${splatter(240, 800, 55, 44, '#650a16')}</g>`;
    // diagonale Neon-Schnittlinie
    body += `<g transform="rotate(-14 800 450)"><rect x="-100" y="640" width="1800" height="3" fill="url(#neon)" filter="url(#glow)"/><rect x="-100" y="641" width="1800" height="1.2" fill="url(#neon)"/></g>`;
    // schmale Mondsichel
    body += `<g transform="translate(1250 230)"><circle r="70" fill="#f3e8d0" opacity=".85"/><circle cx="-26" cy="-12" r="66" fill="#0e080b"/><circle r="140" fill="#ff2a4a" opacity=".05"/></g>`;
    // Fledermäuse
    const bat = (x, y, s) => `<path transform="translate(${x},${y}) scale(${s})" fill="#050304" d="M0 0 C-3 -4 -8 -5 -12 -2 C-10 -2 -9 0 -9 2 C-7 0 -5 1 -4 3 C-3 1 -1 1 0 2 C1 1 3 1 4 3 C5 1 7 0 9 2 C9 0 10 -2 12 -2 C8 -5 3 -4 0 0 Z"/>`;
    body += bat(1180, 300, 2.4) + bat(1320, 350, 1.6) + bat(1100, 380, 1.2);
    // langsam laufender Tropfen
    body += `<g><rect x="168" y="200" width="7" height="40" rx="3.5" fill="#6e0814"><animate attributeName="height" values="40;210;40" dur="14s" repeatCount="indefinite"/></rect></g>`;
    body += `<rect width="${W}" height="${H}" filter="url(#mgr)"/><rect width="${W}" height="${H}" fill="url(#mv)"/>`;
    return wrap(defs, body);
  };

  // ---------- Schauplätze ----------
  const LIST = {};
  function scene(id, en, de, fn) { LIST[id] = { id, name: () => (B.lang === 'en' ? en : de), svg: fn }; }

  scene('bronze', 'The Bronze', 'Das Bronze', () => {
    const R = rng(11);
    const defs = `<linearGradient id="bw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120820"/><stop offset="1" stop-color="#05030a"/></linearGradient>
      ${['#ff3cac', '#38c6ff', '#9b5cff', '#ff3cac', '#38c6ff'].map((c, i) => `<linearGradient id="beam${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`).join('')}
      <filter id="nglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>${grain('bgr', 0.07)}`;
    let b = `<rect width="${W}" height="${H}" fill="url(#bw)"/>`;
    // Ziegelwand
    for (let y = 0; y < 560; y += 28) for (let x = (y / 28) % 2 ? -40 : 0; x < W; x += 80) b += `<rect x="${x}" y="${y}" width="76" height="24" fill="#1a0e22" opacity="${0.35 + R() * 0.3}"/>`;
    // Lichtkegel
    [[200, -10], [520, 25], [800, -15], [1080, 20], [1400, -20]].forEach(([x, rot], i) => {
      b += `<g transform="rotate(${rot} ${x} 60)"><polygon points="${x - 18},60 ${x + 18},60 ${x + 230},900 ${x - 230},900" fill="url(#beam${i})" opacity=".55"><animate attributeName="opacity" values=".25;.6;.3;.55;.25" dur="${6 + i}s" repeatCount="indefinite"/></polygon></g>`;
    });
    // Traverse mit Scheinwerfern
    b += `<rect x="0" y="40" width="${W}" height="14" fill="#0a0610"/>`;
    for (let x = 200; x < W; x += 300) b += `<circle cx="${x}" cy="62" r="14" fill="#1b1424" stroke="#3a2a4a"/>`;
    // Neon-Schild
    b += `<text x="${W / 2}" y="200" text-anchor="middle" font-family="Georgia, serif" font-size="96" font-weight="700" fill="none" stroke="#ff4fae" stroke-width="3" filter="url(#nglow)" letter-spacing="14">THE BRONZE<animate attributeName="opacity" values="1;1;.4;1;1;1;.6;1" dur="7s" repeatCount="indefinite"/></text>`;
    // Bühne + Band
    b += `<rect x="300" y="560" width="1000" height="60" fill="#120a14"/><rect x="300" y="556" width="1000" height="6" fill="#2a1830"/>`;
    b += `<g fill="#050307"><circle cx="560" cy="470" r="22"/><rect x="540" y="490" width="40" height="70" rx="10"/><rect x="560" y="505" width="80" height="10" transform="rotate(-20 560 505)"/>
      <circle cx="1040" cy="470" r="22"/><rect x="1020" y="490" width="40" height="70" rx="10"/><rect x="1000" y="505" width="80" height="10" transform="rotate(20 1040 505)"/>
      <circle cx="800" cy="500" r="16"/><ellipse cx="800" cy="545" rx="70" ry="14"/><circle cx="740" cy="520" r="20"/><circle cx="860" cy="520" r="20"/></g>`;
    // Publikum
    for (let x = -20; x < W + 40; x += 34 + R() * 20) { const h = 640 + R() * 50; b += `<g fill="#030204"><circle cx="${x}" cy="${h}" r="${18 + R() * 6}"/><rect x="${x - 30}" y="${h + 14}" width="60" height="300" rx="26"/></g>`; }
    // Bokeh
    for (let i = 0; i < 30; i++) b += `<circle cx="${R() * W}" cy="${R() * 500}" r="${3 + R() * 10}" fill="${['#ff3cac', '#38c6ff', '#ffd77a'][i % 3]}" opacity="${0.08 + R() * 0.2}"/>`;
    b += `<rect width="${W}" height="${H}" filter="url(#bgr)"/>`;
    return wrap(defs, b);
  });

  scene('school', 'Sunnydale High', 'Sunnydale High', () => {
    const vx = 800, vy = 400;
    const defs = `<linearGradient id="sf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14201e"/><stop offset="1" stop-color="#0a100f"/></linearGradient>
      <radialGradient id="sl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d9f7e6" stop-opacity=".9"/><stop offset="1" stop-color="#d9f7e6" stop-opacity="0"/></radialGradient>${grain('sgr', 0.08)}`;
    let b = `<rect width="${W}" height="${H}" fill="#0b1211"/>`;
    // Decke, Boden, Wände
    b += `<polygon points="0,0 ${W},0 ${vx + 140},${vy - 90} ${vx - 140},${vy - 90}" fill="#101917"/>`;
    b += `<polygon points="0,${H} ${W},${H} ${vx + 140},${vy + 70} ${vx - 140},${vy + 70}" fill="url(#sf)"/>`;
    b += `<polygon points="0,0 ${vx - 140},${vy - 90} ${vx - 140},${vy + 70} 0,${H}" fill="#12211f"/><polygon points="${W},0 ${vx + 140},${vy - 90} ${vx + 140},${vy + 70} ${W},${H}" fill="#102020"/>`;
    // Spinde links/rechts in Perspektive
    const lerp = (a, c, t) => a + (c - a) * t;
    for (let i = 0; i < 14; i++) {
      const t1 = Math.pow(i / 14, 0.75), t2 = Math.pow((i + 0.85) / 14, 0.75);
      [[0, vx - 140, 1], [W, vx + 140, -1]].forEach(([x0, x1]) => {
        const xa = lerp(x0, x1, t1), xb = lerp(x0, x1, t2);
        const topA = lerp(150, vy - 60, t1), botA = lerp(820, vy + 60, t1), topB = lerp(150, vy - 60, t2), botB = lerp(820, vy + 60, t2);
        b += `<polygon points="${xa},${topA} ${xb},${topB} ${xb},${botB} ${xa},${botA}" fill="${i % 2 ? '#1d4a5a' : '#1a4252'}" stroke="#0b1d24" stroke-width="2"/>`;
        for (let k = 0; k < 3; k++) { const yy = lerp(topA, botA, 0.12 + k * 0.05); const yy2 = lerp(topB, botB, 0.12 + k * 0.05); b += `<line x1="${xa + (xb - xa) * 0.2}" y1="${yy}" x2="${xa + (xb - xa) * 0.8}" y2="${yy2}" stroke="#0b1d24" stroke-width="2"/>`; }
      });
    }
    // Leuchtstoffröhren
    for (let i = 0; i < 6; i++) {
      const t = Math.pow(i / 6, 0.8), y = lerp(40, vy - 85, t), w = lerp(380, 60, t);
      b += `<rect x="${vx - w / 2}" y="${y}" width="${w}" height="${lerp(16, 3, t)}" fill="#dff8ea" opacity="${i === 2 ? 1 : 0.85}">${i === 2 ? '<animate attributeName="opacity" values=".9;.2;.9;.9;.1;.9" dur="5s" repeatCount="indefinite"/>' : ''}</rect><ellipse cx="${vx}" cy="${y + 8}" rx="${w * 0.9}" ry="${lerp(60, 10, t)}" fill="url(#sl)" opacity=".25"/>`;
    }
    // Ende des Flurs + Exit
    b += `<rect x="${vx - 140}" y="${vy - 90}" width="280" height="160" fill="#050807"/><rect x="${vx - 40}" y="${vy - 40}" width="80" height="110" fill="#0d1413"/><rect x="${vx - 26}" y="${vy - 76}" width="52" height="18" fill="#c41d3a"/><text x="${vx}" y="${vy - 62}" text-anchor="middle" font-size="13" font-family="Arial" font-weight="700" fill="#ffd7dd">EXIT</text>`;
    // Banner
    b += `<g transform="translate(${vx - 230} 300)"><rect width="460" height="44" fill="#7d0a18" opacity=".9"/><text x="230" y="31" text-anchor="middle" font-family="Georgia, serif" font-size="26" font-weight="700" fill="#f3e8d0" letter-spacing="6">SUNNYDALE HIGH</text></g>`;
    // Bodenspiegelung
    b += `<polygon points="${vx - 60},${vy + 70} ${vx + 60},${vy + 70} ${vx + 300},${H} ${vx - 300},${H}" fill="#dff8ea" opacity=".04"/>`;
    b += `<rect width="${W}" height="${H}" filter="url(#sgr)"/>`;
    return wrap(defs, b);
  });

  scene('cemetery', 'Restfield Cemetery', 'Friedhof Restfield', () => {
    const R = rng(5);
    const defs = `<linearGradient id="cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0c1c"/><stop offset=".6" stop-color="#1a1530"/><stop offset="1" stop-color="#0a0810"/></linearGradient>
      <radialGradient id="cm"><stop offset="0" stop-color="#fff6d8" stop-opacity=".55"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
      <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8b0d0" stop-opacity="0"/><stop offset=".5" stop-color="#b8b0d0" stop-opacity=".16"/><stop offset="1" stop-color="#b8b0d0" stop-opacity="0"/></linearGradient>${grain('cgr', 0.07)}`;
    let b = `<rect width="${W}" height="${H}" fill="url(#cs)"/>`;
    for (let i = 0; i < 90; i++) b += `<circle cx="${R() * W}" cy="${R() * 420}" r="${R() * 1.6}" fill="#fff" opacity="${0.3 + R() * 0.6}"/>`;
    b += `<circle cx="1180" cy="200" r="260" fill="url(#cm)"/><circle cx="1180" cy="200" r="95" fill="#f2ead2"/><circle cx="1150" cy="180" r="14" fill="#d9cfb2" opacity=".6"/><circle cx="1210" cy="230" r="9" fill="#d9cfb2" opacity=".5"/>`;
    // Wolken
    b += `<g opacity=".35"><ellipse cx="300" cy="160" rx="260" ry="34" fill="#2a2440"><animateTransform attributeName="transform" type="translate" values="0 0;120 0;0 0" dur="60s" repeatCount="indefinite"/></ellipse><ellipse cx="1300" cy="300" rx="300" ry="26" fill="#2a2440"><animateTransform attributeName="transform" type="translate" values="0 0;-140 0;0 0" dur="75s" repeatCount="indefinite"/></ellipse></g>`;
    // Hügel
    b += `<path d="M0 640 Q 400 560 800 620 T 1600 600 V900 H0Z" fill="#0b0a12"/>`;
    // Mausoleum
    b += `<g fill="#06050a"><rect x="180" y="420" width="300" height="220"/><polygon points="160,425 330,330 500,425"/>${[0, 1, 2, 3].map((i) => `<rect x="${205 + i * 70}" y="440" width="22" height="200" fill="#0e0c16"/>`).join('')}<rect x="300" y="520" width="60" height="120" fill="#000"/></g>`;
    // toter Baum
    b += `<g stroke="#050408" stroke-linecap="round" fill="none"><path d="M1400 700 C1395 600 1410 520 1390 430" stroke-width="22"/><path d="M1392 520 C1440 480 1480 470 1530 430" stroke-width="10"/><path d="M1398 470 C1350 430 1320 420 1280 380" stroke-width="9"/><path d="M1390 430 C1400 380 1380 340 1395 300" stroke-width="7"/><path d="M1480 465 C1500 440 1510 420 1540 410" stroke-width="5"/><path d="M1320 410 C1300 390 1290 370 1270 360" stroke-width="4"/></g>`;
    // Grabsteine
    for (let i = 0; i < 16; i++) {
      const x = 40 + i * 100 + R() * 40, y = 640 + R() * 120, h = 50 + R() * 70, w = 34 + R() * 26;
      if (x > 170 && x < 500 && y < 700) continue;
      b += R() < 0.3 ? `<g fill="#07060c"><rect x="${x + w / 2 - 6}" y="${y - h}" width="12" height="${h}"/><rect x="${x}" y="${y - h * 0.7}" width="${w}" height="11"/></g>` : `<path d="M${x} ${y} V${y - h + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y - h + w / 2} V${y}Z" fill="#0a0912" stroke="#1d1a28"/>`;
    }
    // Nebel
    b += `<rect x="-200" y="600" width="2000" height="220" fill="url(#cf)"><animateTransform attributeName="transform" type="translate" values="0 0;160 0;0 0" dur="40s" repeatCount="indefinite"/></rect>`;
    b += `<rect width="${W}" height="${H}" filter="url(#cgr)"/>`;
    return wrap(defs, b);
  });

  scene('summers', 'Revello Drive', 'Revello Drive', () => {
    const defs = `<linearGradient id="hw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a14"/><stop offset="1" stop-color="#140c09"/></linearGradient>
      <radialGradient id="lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
      <linearGradient id="win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1030"/><stop offset="1" stop-color="#1c1a3a"/></linearGradient>${grain('hgr', 0.06)}`;
    let b = `<rect width="${W}" height="${H}" fill="url(#hw)"/>`;
    for (let x = 0; x < W; x += 46) b += `<rect x="${x}" y="0" width="22" height="640" fill="#3a2418" opacity=".18"/>`;
    // Fußleiste, Boden, Teppich
    b += `<rect x="0" y="640" width="${W}" height="16" fill="#3c2416"/><rect x="0" y="656" width="${W}" height="244" fill="#1d120c"/>`;
    for (let x = 0; x < W; x += 120) b += `<line x1="${x}" y1="656" x2="${x - 80}" y2="900" stroke="#140c08" stroke-width="3"/>`;
    b += `<ellipse cx="800" cy="800" rx="520" ry="70" fill="#5a1a1e" opacity=".55"/><ellipse cx="800" cy="800" rx="470" ry="56" fill="none" stroke="#c99a2e" stroke-opacity=".25" stroke-width="4"/>`;
    // Fenster mit Mond und Vorhängen
    b += `<rect x="1060" y="130" width="340" height="300" fill="url(#win)" stroke="#4a2c1c" stroke-width="16"/><circle cx="1300" cy="210" r="34" fill="#f2ead2" opacity=".9"/><line x1="1230" y1="130" x2="1230" y2="430" stroke="#4a2c1c" stroke-width="10"/><line x1="1060" y1="280" x2="1400" y2="280" stroke="#4a2c1c" stroke-width="10"/>`;
    b += `<path d="M1030 110 Q1080 300 1040 460 L1000 460 L1000 110Z" fill="#6e1a22"/><path d="M1430 110 Q1380 300 1420 460 L1460 460 L1460 110Z" fill="#6e1a22"/><rect x="990" y="100" width="480" height="14" fill="#3a2010"/>`;
    // Bilderrahmen
    [[180, 170, 120, 90], [340, 150, 90, 120], [460, 190, 140, 80]].forEach(([x, y, w, h]) => (b += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1a1210" stroke="#a07a3a" stroke-width="7"/><rect x="${x + 14}" y="${y + 14}" width="${w - 28}" height="${h - 28}" fill="#2a2030" opacity=".8"/>`));
    // Stehlampe
    b += `<circle cx="300" cy="400" r="260" fill="url(#lamp)"/><rect x="292" y="400" width="8" height="250" fill="#1a110a"/><polygon points="250,400 350,400 330,330 270,330" fill="#e8b860"/><ellipse cx="296" cy="650" rx="44" ry="8" fill="#0d0805"/>`;
    // Sofa
    b += `<g><rect x="520" y="520" width="560" height="150" rx="30" fill="#3a1e2a"/><rect x="500" y="470" width="600" height="80" rx="34" fill="#4a2636"/><rect x="480" y="540" width="80" height="140" rx="26" fill="#43222f"/><rect x="1040" y="540" width="80" height="140" rx="26" fill="#43222f"/>
      <rect x="600" y="505" width="170" height="70" rx="20" fill="#5a2e42"/><rect x="830" y="505" width="170" height="70" rx="20" fill="#5a2e42"/><rect x="680" y="530" width="80" height="60" rx="14" fill="#c99a2e" opacity=".7"/></g>`;
    // Couchtisch mit Kerze
    b += `<rect x="680" y="720" width="240" height="20" rx="6" fill="#2a180e"/><rect x="700" y="740" width="12" height="60" fill="#1a0e08"/><rect x="888" y="740" width="12" height="60" fill="#1a0e08"/><rect x="790" y="690" width="14" height="30" fill="#efe6cf"/><path d="M797 689 q -6 -10 0 -20 q 6 10 0 20Z" fill="#ffcf5a"><animate attributeName="opacity" values="1;.7;1;.85;1" dur="1.6s" repeatCount="indefinite"/></path><circle cx="797" cy="680" r="70" fill="url(#lamp)" opacity=".6"/>`;
    b += `<rect width="${W}" height="${H}" filter="url(#hgr)"/>`;
    return wrap(defs, b);
  });

  scene('magicbox', 'The Magic Box', 'Der Zauberladen', () => {
    const R = rng(77);
    const defs = `<linearGradient id="mw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120c1c"/><stop offset="1" stop-color="#0a0710"/></linearGradient>
      <radialGradient id="orb"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#c9a8ff"/><stop offset="1" stop-color="#6d2fd0" stop-opacity="0"/></radialGradient>
      <radialGradient id="jarg"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>${grain('zgr', 0.07)}`;
    let b = `<rect width="${W}" height="${H}" fill="url(#mw)"/>`;
    // Regale
    for (let sx of [60, 1120]) {
      b += `<rect x="${sx}" y="60" width="420" height="640" fill="#1c1208" stroke="#2e1f10" stroke-width="10"/>`;
      for (let row = 0; row < 5; row++) {
        const y = 150 + row * 120;
        b += `<rect x="${sx}" y="${y}" width="420" height="12" fill="#3a2614"/>`;
        for (let k = 0; k < 7; k++) {
          const x = sx + 25 + k * 56 + R() * 6, h = 40 + R() * 40, col = ['#8a4fd8', '#3f9a4a', '#c41d3a', '#c99a2e', '#38c6ff'][Math.floor(R() * 5)];
          if (R() < 0.45) b += `<rect x="${x}" y="${y - h}" width="${14 + R() * 16}" height="${h}" fill="${['#5a2a1a', '#2a3a5a', '#4a1a2a', '#2a4a2a'][k % 4]}"/>`;
          else b += `<g><rect x="${x}" y="${y - h}" width="34" height="${h}" rx="8" fill="${col}" opacity=".35"/><circle cx="${x + 17}" cy="${y - h / 2}" r="${h / 2}" fill="url(#jarg)" opacity=".18"><animate attributeName="opacity" values=".1;.3;.1" dur="${3 + R() * 4}s" repeatCount="indefinite"/></circle><rect x="${x + 6}" y="${y - h - 8}" width="22" height="10" fill="#3a2614"/></g>`;
        }
      }
    }
    // Kräuterbündel
    for (let i = 0; i < 8; i++) { const x = 560 + i * 70; b += `<line x1="${x}" y1="0" x2="${x}" y2="${60 + (i % 3) * 20}" stroke="#2e1f10" stroke-width="2"/><path d="M${x - 14} ${60 + (i % 3) * 20} Q${x} ${150 + (i % 3) * 20} ${x + 14} ${60 + (i % 3) * 20}Z" fill="#2f5a2a" opacity=".8"/>`; }
    // Theke mit Kristallkugel
    b += `<rect x="520" y="600" width="560" height="160" fill="#2a1a0c" stroke="#3a2614" stroke-width="8"/><rect x="500" y="590" width="600" height="20" fill="#4a2e14"/>`;
    b += `<circle cx="800" cy="540" r="160" fill="url(#orb)" opacity=".35"><animate attributeName="r" values="150;175;150" dur="5s" repeatCount="indefinite"/></circle><circle cx="800" cy="545" r="44" fill="url(#orb)"/><rect x="770" y="585" width="60" height="12" rx="4" fill="#3a2614"/>`;
    // Kerzen
    [[600, 590], [990, 590]].forEach(([x, y]) => (b += `<rect x="${x}" y="${y - 40}" width="12" height="40" fill="#efe6cf"/><path d="M${x + 6} ${y - 41} q -6 -10 0 -20 q 6 10 0 20Z" fill="#ffcf5a"><animate attributeName="opacity" values="1;.7;1" dur="1.4s" repeatCount="indefinite"/></path>`));
    b += `<rect x="0" y="760" width="${W}" height="140" fill="#0c0806"/>`;
    b += `<rect width="${W}" height="${H}" filter="url(#zgr)"/>`;
    return wrap(defs, b);
  });

  scene('hellmouth', 'The Hellmouth', 'Der Höllenschlund', () => {
    const R = rng(66);
    const defs = `<radialGradient id="hg" cx=".5" cy=".62" r=".7"><stop offset="0" stop-color="#ff6a1a" stop-opacity=".9"/><stop offset=".25" stop-color="#c41d3a" stop-opacity=".5"/><stop offset=".7" stop-color="#2a0508" stop-opacity=".3"/><stop offset="1" stop-color="#050203" stop-opacity="0"/></radialGradient>
      <linearGradient id="hc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff3a1a"/></linearGradient>
      <filter id="hblur"><feGaussianBlur stdDeviation="4"/></filter>${grain('hgr2', 0.09)}`;
    let b = `<rect width="${W}" height="${H}" fill="#070304"/><rect width="${W}" height="${H}" fill="url(#hg)"/>`;
    // Felsen
    b += `<path d="M0 0 L0 520 Q120 470 200 380 Q260 300 230 180 Q210 90 300 0Z" fill="#0c0506"/><path d="M${W} 0 L${W} 560 Q1480 500 1400 400 Q1330 300 1370 170 Q1400 80 1310 0Z" fill="#0c0506"/>`;
    // Bodenriss mit Leuchten
    let crack = 'M300 560';
    for (let x = 340; x <= 1300; x += 40) crack += ` L${x} ${560 + (R() - 0.5) * 50 + (x > 700 && x < 900 ? 20 : 0)}`;
    b += `<path d="M0 540 Q800 480 1600 540 V900 H0Z" fill="#100607"/>`;
    b += `<path d="${crack}" stroke="url(#hc)" stroke-width="16" fill="none" filter="url(#hblur)"><animate attributeName="stroke-width" values="12;22;12" dur="3s" repeatCount="indefinite"/></path><path d="${crack}" stroke="#ffe7a8" stroke-width="3" fill="none"/>`;
    for (let i = 0; i < 9; i++) { const x = 360 + i * 110 + R() * 40; let d = `M${x} ${560 + (R() - 0.5) * 30}`; let y = 560; for (let k = 0; k < 4; k++) { y += 20 + R() * 30; d += ` L${x + (R() - 0.5) * 60} ${y}`; } b += `<path d="${d}" stroke="#ff6a1a" stroke-width="3" fill="none" opacity=".8"/>`; }
    // Glut
    for (let i = 0; i < 40; i++) { const x = 300 + R() * 1000, dur = 4 + R() * 6; b += `<circle cx="${x}" cy="600" r="${1.5 + R() * 2.5}" fill="#ffb347"><animate attributeName="cy" values="600;${200 + R() * 300}" dur="${dur}s" begin="${-R() * dur}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="${dur}s" begin="${-R() * dur}s" repeatCount="indefinite"/></circle>`; }
    b += `<g opacity=".7">${splatter(150, 820, 60, 9, '#4a0610')}${splatter(1480, 140, 50, 13, '#4a0610')}</g>`;
    b += `<rect width="${W}" height="${H}" filter="url(#hgr2)"/>`;
    return wrap(defs, b);
  });

  scene('initiative', 'Initiative HQ', 'Initiative-Hauptquartier', () => {
    const vx = 800, vy = 380;
    const defs = `<linearGradient id="iw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1418"/><stop offset="1" stop-color="#05090b"/></linearGradient>
      <linearGradient id="ff" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#38c6ff" stop-opacity="0"/><stop offset=".5" stop-color="#38c6ff" stop-opacity=".35"/><stop offset="1" stop-color="#38c6ff" stop-opacity="0"/></linearGradient>${grain('igr', 0.07)}`;
    let b = `<rect width="${W}" height="${H}" fill="url(#iw)"/>`;
    // Gitterboden
    for (let i = -20; i <= 20; i++) b += `<line x1="${vx}" y1="${vy + 60}" x2="${vx + i * 120}" y2="${H}" stroke="#38c6ff" stroke-opacity=".12"/>`;
    for (let k = 1; k < 10; k++) { const y = vy + 60 + Math.pow(k / 10, 2) * (H - vy - 60); b += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#38c6ff" stroke-opacity=".1"/>`; }
    // Zellen mit Kraftfeld
    for (let i = 0; i < 4; i++) {
      const xl = 40 + i * 150, xr = W - 40 - i * 150 - 120, s = 1 - i * 0.18, y = 240 + i * 30, h = 320 * s;
      [xl, xr].forEach((x) => (b += `<rect x="${x}" y="${y}" width="${120 * s}" height="${h}" fill="#0b1a20" stroke="#1d3a44" stroke-width="4"/><rect x="${x + 6}" y="${y + 6}" width="${120 * s - 12}" height="${h - 12}" fill="url(#ff)"><animate attributeName="opacity" values=".5;1;.5" dur="${2 + i}s" repeatCount="indefinite"/></rect>`));
    }
    // Tor am Ende mit Warnstreifen
    b += `<rect x="${vx - 150}" y="${vy - 120}" width="300" height="180" fill="#081013" stroke="#1d3a44" stroke-width="6"/>`;
    for (let i = 0; i < 10; i++) b += `<polygon points="${vx - 150 + i * 30},${vy + 40} ${vx - 135 + i * 30},${vy + 40} ${vx - 150 + i * 30 + 30},${vy + 60} ${vx - 165 + i * 30 + 30},${vy + 60}" fill="#e4c43a" opacity=".8"/>`;
    b += `<text x="${vx}" y="${vy - 30}" text-anchor="middle" font-family="Arial Black, Arial" font-size="72" font-weight="900" fill="#9fb34a" opacity=".55">314</text>`;
    // Deckenlichter
    for (let i = 0; i < 5; i++) b += `<rect x="${vx - 300 + i * 150}" y="40" width="80" height="8" fill="#bff0ff" opacity=".7"/>`;
    // roter Alarm
    b += `<circle cx="${vx}" cy="${vy - 150}" r="10" fill="#ff2a4a"><animate attributeName="opacity" values="1;.15;1" dur="1.2s" repeatCount="indefinite"/></circle>`;
    b += `<rect width="${W}" height="${H}" filter="url(#igr)"/>`;
    return wrap(defs, b);
  });

  SC.get = (id) => LIST[id] || LIST.cemetery;
  SC.ids = () => Object.keys(LIST);
  SC.random = () => { const ids = SC.ids(); return ids[Math.floor(Math.random() * ids.length)]; };
})(typeof globalThis !== 'undefined' ? globalThis : window);
