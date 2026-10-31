/* Buffyverse TCG – Oberfläche (zweisprachig, KI / Hotseat / Story / Tutorial) */
(function () {
  const B = window.BTCG, E = B.Engine, AI = B.AI, CFG = B.CONFIG;
  let save = B.loadSave();
  B.setLang(save.settings.lang || 'en');
  const t = B.t, tr = B.tr, cn = B.cn;
  const app = document.getElementById('app');
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const el = (html) => { const tp = document.createElement('template'); tp.innerHTML = html.trim(); return tp.content.firstElementChild; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const persist = () => B.storeSave(save);
  const S = B.Sound, FX = B.FX;
  const TRAINER_COLOR = { 'Unterstützer': '#2f8f8a', Gegenstand: '#3a6fb5', 'Ausrüstung': '#9aa0a8', Stadion: '#4f8a3a' };
  const LEVELS = ['beginner', 'erfahren', 'profi'];
  const lvName = (k) => t('lv.' + k);
  let curScreen = null;

  // =====================================================================
  //  Bausteine
  // =====================================================================
  function tcOf(c) {
    if (c.kind === 'char') return B.TYPES[c.type].color;
    if (c.kind === 'energy') return B.ENERGY[c.energy].color;
    return TRAINER_COLOR[c.sub];
  }
  function cardHTML(id, size, x) {
    x = x || {};
    const c = B.CARDS[id];
    const cls = ['card', size || 'm', 'r-' + c.rarity];
    if (x.unowned) cls.push('unowned');
    if (x.clickable) cls.push('clickable');
    if (x.cls) cls.push(x.cls);
    if (c.kind === 'energy') cls.push('energy');
    let inner = '';
    const badges = (x.count != null ? `<div class="count">${x.count === Infinity ? '∞' : '×' + x.count}</div>` : '') + (x.isNew ? `<div class="newb">${t('c.new')}</div>` : '');
    if (c.kind === 'char') {
      const ty = B.TYPES[c.type];
      const weak = B.WEAK[c.type], res = B.RES[c.type];
      inner = `<div class="hdr"><span class="stage">${B.stageName(c)}</span><span class="nm">${esc(cn(id))}</span><span class="hp"><small>${t('c.hp')}</small> ${c.hp}</span></div>
        <div class="art">${B.Art.html(id)}${badges}${c.bigBad ? '<span class="bb">BIG BAD</span>' : ''}</div>
        <div class="meta"><span>${ty.icon} ${B.typeName(c.type)}${c.stage ? ' · ' + t('c.from', { n: esc(cn(c.from).split(' – ')[0]) }) : ''}</span><span>${t('c.season', { s: c.seasons })}</span></div>
        ${c.ability ? `<div class="abil"><b>${c.ability.kind === 'active' ? '⚡' : '◈'} ${esc(B.abn(id))}</b> ${esc(B.abt(id))}</div>` : ''}
        ${c.attacks.map((a, i) => `<div class="atk"><div class="row"><span class="cost">${B.costIcons(a.cost)}</span><span class="nm2">${esc(B.an(id, i))}</span><span class="dmg">${a.dmg || (a.fx.some((f) => f.t === 'coins') ? a.fx.find((f) => f.t === 'coins').per + '×' : '')}${a.dmg && a.fx.some((f) => /^(vsType|vsTag|vsBigBad|ifAlly|perBench|perDamageSelf|ifDamaged|ifStatus|coinBonus)$/.test(f.t)) ? '+' : ''}</span></div>${B.fxText(a.fx) ? `<div>${esc(B.fxText(a.fx))}</div>` : ''}</div>`).join('')}
        ${B.flav(id) && size === 'l' ? `<div class="flavor">${esc(B.flav(id))}</div>` : ''}
        <div class="ftr"><span>${t('c.weak')} ${B.TYPES[weak].icon}×2</span><span>${t('c.res')} ${res ? B.TYPES[res].icon + '−30' : '–'}</span><span>${t('c.retreat')} ${'⚪'.repeat(c.retreat) || '0'}</span><span class="rar" title="${B.rarityName(c.rarity)}">${B.rarityIcon[c.rarity]}</span></div>`;
    } else if (c.kind === 'trainer') {
      inner = `<div class="hdr"><span class="stage">${B.subName(c.sub)}</span><span class="nm">${esc(cn(id))}</span></div>
        <div class="art">${B.Art.html(id)}${badges}</div>
        <div class="ttxt">${esc(B.ttext(id))}</div>
        <div class="ftr"><span>${t('c.rule.' + c.sub)}</span><span class="rar" title="${B.rarityName(c.rarity)}">${B.rarityIcon[c.rarity]}</span></div>`;
    } else {
      inner = `<div class="hdr"><span class="nm" style="text-align:center">${esc(cn(id))}</span></div><div class="art">${B.Art.html(id)}${badges}</div><div class="ttxt" style="text-align:center">${t('c.basicEnergy')}</div>`;
    }
    return `<div class="${cls.join(' ')}" style="--tc:${tcOf(c)};${x.style || ''}" data-id="${id}" ${x.uid ? `data-uid="${x.uid}"` : ''}><div class="inner">${inner}</div></div>`;
  }

  function slotHTML(s, sl, isActive, x) {
    x = x || {};
    if (!sl) return `<div class="slot ${isActive ? 'active ' : ''}empty">${isActive ? t('g.noActive') : ''}</div>`;
    const c = E.top(s, sl), max = E.hpMax(s, sl), rem = Math.max(0, max - sl.damage);
    const en = E.energyTypes(s, sl).map((ty) => B.ENERGY[ty].icon).join('');
    const st = Object.keys(sl.status).map((k) => `<span>${{ para: '⚡', sleep: '💤', poison: '☠️', burn: '🔥' }[k]}${B.statusName(k)}</span>`).join('');
    const tool = sl.tool ? `<span class="tool" title="${esc(cn(E.def(s, sl.tool).id))}">🛡️</span>` : '';
    return `<div class="slot ${isActive ? 'active' : ''} ${x.cls || ''}" style="--tc:${B.TYPES[c.type].color}" data-slot="${sl.id}">
      <div class="sart">${B.Art.html(c.id)}${sl.damage ? `<span class="dmgc">−${sl.damage}</span>` : ''}<span class="stt">${st}</span>${tool}<span class="stg">${c.bigBad ? '👑 ' : ''}${B.stageName(c)}</span></div>
      <div class="sname">${esc(cn(c.id))}</div>
      <div class="hpbar"><i class="${rem / max < 0.35 ? 'low' : ''}" style="width:${(rem / max) * 100}%"></i></div>
      <div class="sfoot"><span class="en">${en || '<span class="muted">–</span>'}</span><span>${rem}/${max}</span></div></div>`;
  }

  let modalStack = [];
  function modal(o) {
    const bg = el(`<div class="modal-bg"><div class="modal" style="${o.width ? 'width:' + o.width : ''}"><div class="mh"><h3>${o.title || ''}</h3>${o.closable === false ? '' : '<button class="btn small" data-x>✕</button>'}</div><div class="mb"></div><div class="mf"></div></div></div>`);
    const mb = $('.mb', bg), mf = $('.mf', bg);
    if (typeof o.body === 'string') mb.innerHTML = o.body; else if (o.body) mb.appendChild(o.body);
    const close = () => { bg.remove(); modalStack = modalStack.filter((m) => m !== api); if (o.onClose) o.onClose(); };
    const api = { el: bg, close, body: mb, foot: mf, closable: o.closable !== false };
    (o.buttons || []).forEach((b) => {
      const btn = el(`<button class="btn ${b.cls || ''}">${b.label}</button>`);
      if (b.disabled) btn.disabled = true;
      btn.onclick = () => { if (b.keep !== true) close(); if (b.onClick) b.onClick(btn); };
      mf.appendChild(btn);
    });
    if (!(o.buttons || []).length) mf.remove();
    const xb = $('[data-x]', bg);
    if (xb) xb.onclick = close;
    if (o.closable !== false) bg.addEventListener('mousedown', (e) => { if (e.target === bg) close(); });
    document.body.appendChild(bg);
    modalStack.push(api);
    return api;
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalStack.length && modalStack[modalStack.length - 1].closable) modalStack[modalStack.length - 1].close(); });
  function closeAllModals() { modalStack.slice().forEach((m) => m.close()); }

  function toast(text, big) {
    const n = el(`<div class="toast ${big ? 'big' : ''}">${text}</div>`);
    $('#toasts').appendChild(n);
    setTimeout(() => n.remove(), 2700);
  }
  function confirmBox(title, text, yes, onYes) {
    modal({ title, body: `<p>${text}</p>`, buttons: [{ label: t('common.cancel') }, { label: yes, cls: 'primary', onClick: onYes }] });
  }
  function topbar(title, extra) {
    return `<div class="topbar"><button class="btn small" data-back>← ${t('common.menu')}</button><h2>${title}</h2>${extra || ''}</div>`;
  }
  function bindBack(root) { const b = $('[data-back]', root); if (b) b.onclick = () => go(screenMenu); }
  function go(fn) { stopAI(); closeAllModals(); clearHandover(); app.innerHTML = ''; B.Sound.music('menu'); curScreen = fn; fn(); }

  function cardDetail(id, opts) {
    opts = opts || {};
    const c = B.CARDS[id];
    const wrap = el(`<div class="detail">${cardHTML(id, 'l')}<div class="dside"></div></div>`);
    const side = $('.dside', wrap);
    let m = null;
    if (opts.info !== false && c.kind !== 'energy') {
      const n = B.owned(save, id);
      const src = c.promo ? B.Ach.sourceOf(id) : null;
      const srcName = src ? (src.hidden && !save.ach.unlocked[src.id] ? t('c.secretAch') : `„${esc(B.Ach.name(src))}“`) : '';
      const fac = { gut: t('c.fac.good'), 'böse': t('c.fac.evil'), beide: t('c.fac.both') }[c.faction];
      side.appendChild(el(`<div><div class="muted">${t('c.rarity')}: ${B.rarityName(c.rarity)} ${B.rarityIcon[c.rarity]}</div><div class="muted">${t('c.inColl')}: <b style="color:var(--ink)">${n}×</b></div><div class="muted">${c.promo ? t('c.promoFrom', { a: srcName }) : t('c.tradeValue', { n: B.tradeCost(c) })}</div>${fac ? `<div class="muted">${t('c.faction')}: ${fac}</div>` : ''}</div>`));
      const file = el('<input type="file" accept="image/*" class="hidden">');
      const pick = el(`<button class="btn small">🖼️ ${t('c.pickImg')}</button>`);
      const del = el(`<button class="btn small">${t('c.delImg')}</button>`);
      pick.onclick = () => file.click();
      file.onchange = async () => {
        if (!file.files[0]) return;
        try { B.Art.set(id, await B.Art.fromFile(file.files[0])); toast(t('c.imgSaved')); save.stats.images = (save.stats.images || 0) + 1; persist(); announce(B.Ach.check(save, { type: 'image' })); if (opts.onChange) opts.onChange(); m.close(); cardDetail(id, opts); }
        catch (e) { toast(t('c.imgErr')); }
      };
      del.onclick = () => { B.Art.set(id, null); toast(t('c.imgDeleted')); if (opts.onChange) opts.onChange(); m.close(); cardDetail(id, opts); };
      const row = el('<div style="display:flex;gap:6px;flex-wrap:wrap"></div>');
      row.append(pick); if (B.Art.user[id]) row.append(del);
      side.append(row, file, el(`<div class="hint">${t('c.imgHint')}</div>`));
    }
    if (opts.extra) side.appendChild(opts.extra);
    m = modal({ title: esc(cn(id)), body: wrap, onClose: opts.onClose });
    return m;
  }
  const deckName = (d) => (d.id && B.PREBUILT.some((x) => x.id === d.id) ? t('deck.' + d.id + '.n') : d.name);
  const deckDesc = (d) => t('deck.' + d.id + '.d');

  // =====================================================================
  //  Hauptmenü
  // =====================================================================
  function menuBg() {
    return `<div class="menu-bg">${B.Scenes.menuSVG()}<div class="fog f1"></div><div class="fog f2"></div></div>`;
  }
  function screenMenu() {
    const left = B.totalBoosters(save);
    const st = save.stats;
    const owned = Object.values(B.CARDS).filter((c) => c.kind !== 'energy' && save.collection[c.id] > 0).length;
    const total = Object.values(B.CARDS).filter((c) => c.kind !== 'energy').length;
    const achN = Object.keys(save.ach.unlocked).length;
    const storyN = Object.keys(save.story.cleared).length;
    const s = el(`<div class="screen menu scroll">
      ${menuBg()}
      <div class="logo"><div class="t1">BUFFY<span>VERSE</span></div><div class="t2">${t('m.subtitle')}</div></div>
      <div class="menu-grid">
        <button class="btn primary" data-go="play"><span class="ico">⚔️</span>${t('m.play')}<span class="sub">${t('m.playSub')}</span></button>
        <button class="btn primary2" data-go="story"><span class="ico">📖</span>${t('m.story')}<span class="sub">${t('m.storySub', { n: storyN, max: B.STORY.length })}</span></button>
        <button class="btn" data-go="booster"><span class="ico">🎁</span>${t('m.booster')} ${left ? `<span class="badge">${left}</span>` : ''}<span class="sub">${left ? t('m.boosterReady', { n: left }) : t('m.boosterTomorrow')}</span></button>
        <button class="btn" data-go="collection"><span class="ico">📚</span>${t('m.collection')}<span class="sub">${t('m.cards', { n: owned, max: total })}</span></button>
        <button class="btn" data-go="decks"><span class="ico">🗃️</span>${t('m.decks')}<span class="sub">${t('m.decksSub', { n: save.decks.length })}</span></button>
        <button class="btn" data-go="trade"><span class="ico">🔁</span>${t('m.trade')}<span class="sub">${t('m.tradeSub')}</span></button>
        <button class="btn" data-go="ach"><span class="ico">🏆</span>${t('m.ach')}<span class="sub">${t('m.achSub', { n: achN, max: B.Ach.LIST.length })}</span></button>
        <button class="btn" data-go="tutorial"><span class="ico">🎓</span>${t('m.tutorial')}<span class="sub">${save.tutorialDone ? '✔ ' + t('m.tutorialDone') : t('m.tutorialSub')}</span></button>
        <button class="btn" data-go="rules"><span class="ico">📜</span>${t('m.rules')}<span class="sub">${t('m.rulesSub')}</span></button>
        <button class="btn" data-go="settings"><span class="ico">⚙️</span>${t('m.settings')}<span class="sub">${t('m.settingsSub')}</span></button>
      </div>
      <div class="stats">${t('m.stats', { p: st.played, w: st.won })}${st.played ? ' (' + Math.round((st.won / st.played) * 100) + ' %)' : ''}<br>
      ${LEVELS.map((k) => `${lvName(k)}: ${st.byLevel[k][1]}/${st.byLevel[k][0]}`).join(' · ')}<br>
      <a href="#" class="verlink" data-go="versions">${t('m.version', { v: B.VERSION })}</a></div>
    </div>`);
    $$('[data-go]', s).forEach((b) => (b.onclick = (e) => { e.preventDefault(); go({ play: screenPlaySetup, story: screenStory, booster: screenBooster, collection: screenCollection, decks: screenDecks, trade: screenTrade, rules: screenRules, settings: screenSettings, ach: screenAchievements, versions: screenVersions, tutorial: startTutorial }[b.dataset.go]); }));
    app.appendChild(s);
    if (!save.tutorialOffered && st.played === 0) {
      save.tutorialOffered = true; persist();
      setTimeout(() => confirmBox('🎓 ' + t('tu.offerTitle'), t('tu.offerText'), t('tu.offerYes'), () => go(startTutorial)), 900);
    }
  }

  // =====================================================================
  //  Spiel vorbereiten (KI oder 2 Spieler)
  // =====================================================================
  function screenPlaySetup() {
    let mode = save.settings.mode || 'ai';
    let myDeck = save.activeDeck, opp = 'random', level = save.settings.level || 'erfahren';
    let p2Deck = 'pre:scoobies', p2Name = save.settings.p2Name || t('p.player2');
    const s = el(`<div class="screen">${topbar(t('p.title'))}<div class="scroll" style="flex:1;padding:16px"><div style="max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:18px" data-body></div></div></div>`);
    bindBack(s);
    const body = $('[data-body]', s);
    const deckOpt = (d, sel, key) => { const p = B.deckProblems(save, d); return `<div class="opt ${sel ? 'sel' : ''} ${p.length ? 'bad' : ''}" data-${key}="${d.id}"><div class="t">${esc(d.name)}</div><div class="d">${p.length ? '⚠️ ' + esc(tr(p[0])) : '✔ ' + t('p.ready')}</div></div>`; };
    const render = () => {
      body.innerHTML = `
        <div><h3 style="margin-bottom:8px">${t('p.mode')}</h3><div class="setup-grid">
          <div class="opt ${mode === 'ai' ? 'sel' : ''}" data-mode="ai"><div class="t">🤖 ${t('p.vsAI')}</div><div class="d">${t('p.vsAId')}</div></div>
          <div class="opt ${mode === 'hotseat' ? 'sel' : ''}" data-mode="hotseat"><div class="t">👥 ${t('p.vs2')}</div><div class="d">${t('p.vs2d')}</div></div></div></div>
        <div><h3 style="margin-bottom:8px">${mode === 'ai' ? t('p.yourDeck') : t('p.p1Deck', { p: esc(save.playerName) })}</h3><div class="setup-grid">${save.decks.map((d) => deckOpt(d, myDeck === d.id, 'my')).join('')}</div></div>
        ${mode === 'ai' ? `
        <div><h3 style="margin-bottom:8px">${t('p.level')}</h3><div class="setup-grid">${LEVELS.map((k) => `<div class="opt ${level === k ? 'sel' : ''}" data-lv="${k}"><div class="t">${lvName(k)}</div><div class="d">${t('lv.' + k + '.d')}</div></div>`).join('')}</div></div>
        <div><h3 style="margin-bottom:8px">${t('p.oppDeck')}</h3><div class="setup-grid"><div class="opt ${opp === 'random' ? 'sel' : ''}" data-op="random"><div class="t">🎲 ${t('p.random')}</div><div class="d">${t('p.randomD')}</div></div>
          ${B.PREBUILT.map((d) => `<div class="opt ${opp === d.id ? 'sel' : ''}" data-op="${d.id}"><div class="t">${esc(deckName(d))}</div><div class="d">${esc(deckDesc(d))}</div></div>`).join('')}</div></div>`
        : `
        <div><h3 style="margin-bottom:8px">${t('p.p2')}</h3><input class="field" data-p2name value="${esc(p2Name)}" style="width:260px"></div>
        <div><h3 style="margin-bottom:8px">${t('p.p2Deck')}</h3><div class="setup-grid">
          ${save.decks.map((d) => { const p = B.deckProblems(save, d); return `<div class="opt ${p2Deck === 'my:' + d.id ? 'sel' : ''} ${p.length ? 'bad' : ''}" data-p2="my:${d.id}"><div class="t">${esc(d.name)}</div><div class="d">${p.length ? '⚠️ ' + esc(tr(p[0])) : t('p.fromColl')}</div></div>`; }).join('')}
          ${B.PREBUILT.map((d) => `<div class="opt ${p2Deck === 'pre:' + d.id ? 'sel' : ''}" data-p2="pre:${d.id}"><div class="t">${esc(deckName(d))}</div><div class="d">${t('p.loaner')}</div></div>`).join('')}</div>
          <p class="hint">${t('p.hotseatHint')}</p></div>`}
        <div style="display:flex;gap:10px;align-items:center;justify-content:flex-end"><span class="errs" data-err style="padding:0"></span><button class="btn primary" data-start style="padding:14px 28px;font-size:17px">⚔️ ${t('p.start')}</button></div>`;
      $$('[data-mode]', body).forEach((o) => (o.onclick = () => { mode = o.dataset.mode; render(); }));
      $$('[data-my]', body).forEach((o) => (o.onclick = () => { myDeck = o.dataset.my; render(); }));
      $$('[data-lv]', body).forEach((o) => (o.onclick = () => { level = o.dataset.lv; render(); }));
      $$('[data-op]', body).forEach((o) => (o.onclick = () => { opp = o.dataset.op; render(); }));
      $$('[data-p2]', body).forEach((o) => (o.onclick = () => { p2Deck = o.dataset.p2; render(); }));
      const n2 = $('[data-p2name]', body); if (n2) n2.oninput = () => (p2Name = n2.value.slice(0, 24));
      $('[data-start]', body).onclick = () => {
        const d = save.decks.find((x) => x.id === myDeck);
        const p = d ? B.deckProblems(save, d) : [B.Engine.M('p.pickDeck')];
        if (p.length) { $('[data-err]', body).textContent = tr(p[0]); return; }
        save.activeDeck = d.id; save.settings.mode = mode; persist();
        if (mode === 'ai') {
          save.settings.level = level; persist();
          const od = opp === 'random' ? B.PREBUILT[Math.floor(Math.random() * B.PREBUILT.length)] : B.PREBUILT.find((x) => x.id === opp);
          go(() => startGame({ mode: 'ai', myDeck: d, oppDeck: od, level }));
        } else {
          let d2;
          if (p2Deck.startsWith('my:')) { d2 = save.decks.find((x) => x.id === p2Deck.slice(3)); const p2 = B.deckProblems(save, d2); if (p2.length) { $('[data-err]', body).textContent = tr(p2[0]); return; } d2 = { id: d2.id, name: d2.name, cards: d2.cards }; }
          else { const pd = B.PREBUILT.find((x) => x.id === p2Deck.slice(4)); d2 = { id: pd.id, name: deckName(pd), cards: pd.cards }; }
          save.settings.p2Name = (p2Name || t('p.player2')).trim(); persist();
          go(() => startGame({ mode: 'hotseat', myDeck: d, oppDeck: d2, p2Name: save.settings.p2Name }));
        }
      };
    };
    render();
    app.appendChild(s);
  }

  // =====================================================================
  //  Das Spiel
  // =====================================================================
  const GM = { s: null, mode: 'ai', level: 'erfahren', timer: null, root: null, view: 0, recorded: false, opts: null };
  function stopAI() { if (GM.timer) clearTimeout(GM.timer); GM.timer = null; }
  const delay = () => (save.settings.animSpeed === 2 ? 350 : 800);
  function later(fn, ms) { stopAI(); GM.timer = setTimeout(() => { GM.timer = null; fn(); }, ms); }
  const isHuman = (pi) => GM.s && !GM.s.players[pi].ai;
  const counts = () => GM.mode !== 'hotseat' && GM.mode !== 'tutorial';

  function startGame(o) {
    GM.opts = o; GM.mode = o.mode; GM.level = o.level || 'erfahren'; GM.recorded = false; GM.view = 0; GM.lastTurn = null; GM.handing = false;
    const vsAI = o.mode !== 'hotseat';
    const oppName = vsAI ? t('g.aiName', { d: deckName(o.oppDeck).replace(/^(Staffel|Season) \d – /, '') }) : o.p2Name;
    GM.s = E.newGame([o.myDeck.cards, o.oppDeck.cards], { names: [save.playerName || t('p.player1'), oppName], ai: [false, vsAI], seed: o.seed });
    GM.tracker = counts() ? B.Ach.newTracker(GM.level, o.oppDeck.id) : null;
    GM.scene = o.scene || B.Scenes.random();
    B.Sound.music('game');
    buildBoard();
    if (o.prepare) o.prepare(GM.s);
    renderBoard();
    if (o.mode === 'tutorial') return Tutorial.begin();
    if (vsAI) { AI.setup(GM.s, 1, GM.level); humanSetup(0, begin); }
    else humanSetup(0, () => handover(1, () => humanSetup(1, begin)));
  }
  function begin() {
    const s = GM.s;
    E.begin(s);
    toast('🪙 ' + t('g.begins', { p: esc(s.players[s.current].name) }), true);
    pump();
  }

  function buildBoard() {
    const sc = B.Scenes.get(GM.scene);
    const s = el(`<div class="screen game">
      <div class="board-bg">${sc.svg()}</div><div class="board-shade"></div>
      <div class="topbar"><button class="btn small" data-quit>🏳️ ${t('g.quit')}</button><h2>Buffyverse TCG <span class="muted" style="font-size:14px;font-family:var(--sans);font-weight:400">· ${GM.mode === 'hotseat' ? t('p.vs2') : GM.mode === 'tutorial' ? t('m.tutorial') : GM.mode === 'story' ? t('m.story') + ' ' + GM.opts.chapter : lvName(GM.level)}</span></h2><button class="btn small logtoggle" data-log>📜 ${t('g.log')}</button></div>
      <div class="board">
        <div class="field-area scroll">
          <div class="pinfo" data-oinfo></div>
          <div class="row" data-obench></div>
          <div class="mid">
            <div class="stadium" data-stadium></div>
            <div style="display:flex;flex-direction:column;gap:10px;align-items:center" data-actives></div>
            <div class="piles" data-piles></div>
          </div>
          <div class="row" data-mbench></div>
          <div class="pinfo" data-minfo></div>
          <div class="scene-tag">📍 ${esc(sc.name())}</div>
        </div>
        <div class="side" data-side>
          <div class="phase" data-phase></div>
          <div class="log" data-logbox></div>
        </div>
      </div>
      <div class="mobile-bar"><span class="hint" data-mhint></span><button class="btn small primary" data-mend>${t('g.endTurn')}</button></div>
      <div class="hand" data-hand></div>
    </div>`);
    GM.root = s;
    $('[data-quit]', s).onclick = () => {
      if (GM.s.phase === 'over') return go(screenMenu);
      confirmBox(t('g.quitQ'), counts() ? t('g.quitT') : t('g.quitT2'), t('g.quit'), () => { const f = recordResult(false); go(screenMenu); announce(f); });
    };
    $('[data-log]', s).onclick = () => $('[data-side]', s).classList.toggle('open');
    $('[data-mend]', s).onclick = () => humanEndTurn();
    setupDrag(s);
    s.addEventListener('click', (e) => {
      if (GM.suppressClick) return;
      const sl = e.target.closest('[data-slot]');
      if (sl && GM.root.contains(sl)) return onSlotClick(sl.dataset.slot);
      const hc = e.target.closest('.hand .card');
      if (hc) return onHandClick(hc.dataset.uid);
      const sb = e.target.closest('[data-stadiumcard]');
      if (sb) return cardDetail(sb.dataset.stadiumcard, { info: false });
      const pile = e.target.closest('[data-pile]');
      if (pile) return showPile(+pile.dataset.pi);
    });
    app.appendChild(s);
  }

  function renderBoard() {
    const s = GM.s, r = GM.root;
    if (!r || !s) return;
    r.classList.remove('targeting', 'evolving');
    const V = GM.view;
    const me = s.players[V], op = s.players[1 - V];
    const kos = (n) => `<span class="kos">${[0, 1, 2].map((i) => `<span class="${i < n ? 'on' : ''}">${i < n ? '💀' : '🪦'}</span>`).join('')}</span>`;
    $('[data-oinfo]', r).innerHTML = `<span class="who">${esc(op.name)}</span><span>✋ ${op.hand.length}</span><span>🂠 ${op.deck.length}</span><span>${t('g.kos')}: ${kos(op.kos)}</span>`;
    $('[data-minfo]', r).innerHTML = `<span class="who">${esc(me.name)}</span><span>🂠 ${me.deck.length}</span><span>${t('g.kos')}: ${kos(me.kos)}</span><span class="hint">${t('g.tapHint')}</span>`;
    $('[data-obench]', r).innerHTML = op.bench.map((b) => slotHTML(s, b, false)).join('') || `<span class="hint">${t('g.benchEmpty')}</span>`;
    $('[data-mbench]', r).innerHTML = me.bench.map((b) => slotHTML(s, b, false)).join('') || `<span class="hint">${t('g.benchEmpty')}</span>`;
    $('[data-actives]', r).innerHTML = slotHTML(s, op.active, true) + slotHTML(s, me.active, true);
    $('[data-stadium]', r).innerHTML = s.stadium
      ? `<div class="sbox" data-stadiumcard="${s.cards[s.stadium]}"><div style="font-size:26px">🏟️</div><b style="color:var(--ink)">${esc(cn(s.cards[s.stadium]))}</b><div>${esc(B.ttext(s.cards[s.stadium]))}</div></div>`
      : `<div class="sbox empty">${t('g.noStadium')}</div>`;
    $('[data-piles]', r).innerHTML = `<div class="pile" data-pile="${1 - V}"><b>${op.discard.length}</b>${t('g.discard')}</div><div style="height:30px"></div><div class="pile" data-pile="${V}"><b>${me.discard.length}</b>${t('g.discard')}</div>`;
    const myTurn = s.phase === 'main' && s.current === V && isHuman(V) && !GM.handing;
    const legal = myTurn ? E.legalActions(s) : [];
    const playable = new Set(legal.filter((a) => a.uid).map((a) => a.uid));
    $('[data-hand]', r).innerHTML = GM.handing ? '' : me.hand.map((u) => cardHTML(s.cards[u], 's', { uid: u, cls: playable.has(u) ? 'playable' : '' })).join('');
    const f = s.flags;
    const whose = s.phase === 'over' ? t('g.over') : s.phase === 'setup' ? t('g.setupPhase') : myTurn ? t('g.yourTurn') : t('g.theirTurn', { p: esc(s.players[s.current].name) });
    $('[data-phase]', r).innerHTML = `<div class="turn">${t('g.turnN', { n: s.turn })} · ${whose}</div>
      ${myTurn ? `<div class="hint">${t('g.flags', { e: f.energy ? '✔' : '○', s: f.supporter ? '✔' : '○', r: f.retreat ? '✔' : '○' })}${s.turn === 1 ? '<br>' + t('g.firstTurnHint') : ''}</div>` : ''}
      <button class="btn primary" data-end ${myTurn ? '' : 'disabled'}>${t('g.endTurn')}</button>`;
    $('[data-end]', r).onclick = () => humanEndTurn();
    $('[data-mhint]', r).textContent = myTurn ? t('g.yourTurn') : s.phase === 'over' ? t('g.over') : t('g.theirTurn', { p: s.players[s.current].name });
    $('[data-mend]', r).disabled = !myTurn;
    const lb = $('[data-logbox]', r);
    lb.innerHTML = s.log.slice(-150).map((m) => `<div class="${m && m.k === 'log.turn' ? 't' : ''}">${esc(tr(m))}</div>`).join('');
    lb.scrollTop = lb.scrollHeight;
    if (GM.mode === 'tutorial') Tutorial.render();
  }

  function snapshotSlots() {
    const snap = {};
    if (GM.root) $$('[data-slot]', GM.root).forEach((e) => { snap[e.dataset.slot] = { rect: e.getBoundingClientRect(), html: e.outerHTML }; });
    return snap;
  }
  function slotRef(id, snap) {
    const e = GM.root && $(`[data-slot="${id}"]`, GM.root);
    if (e) return e;
    const sn = snap && snap[id];
    return sn ? { getBoundingClientRect: () => sn.rect, animate: () => null } : null;
  }
  function processEvents(snap) {
    const s = GM.s;
    const evs = s.events.splice(0);
    if (GM.tracker) { for (const ev of evs) B.Ach.track(GM.tracker, s, ev, 0); B.Ach.track(GM.tracker, s, { type: 'tick' }, 0); }
    let tm = 0;
    const at = (ms, fn) => setTimeout(() => { if (GM.root && document.body.contains(GM.root)) fn(); }, ms);
    const aiPi = (pi) => s.players[pi].ai;
    evs.forEach((ev, i) => {
      switch (ev.type) {
        case 'coin': { const tt = tm; at(tt, () => S.play('coin', ev.heads)); FX.coin(ev.heads, esc(tr(ev.label)), tt, t('w.heads').toUpperCase(), t('w.tails').toUpperCase()); tm += 1050; break; }
        case 'attack': {
          const nextDmg = evs.slice(i + 1).find((x) => x.type === 'damage' && !x.bench);
          const defId = nextDmg ? nextDmg.slot : (s.players[1 - ev.pi].active || {}).id;
          at(tm, () => { FX.lunge(slotRef(ev.slot, snap), slotRef(defId, snap)); S.play('attack', ev.ctype); if (aiPi(ev.pi) || GM.mode === 'hotseat') toast(`⚔️ ${esc(tr(ev.name))}`); });
          tm += 300; break;
        }
        case 'damage': at(tm, () => { FX.impact(slotRef(ev.slot, snap), ev.ctype, ev.n, ev.weak, t('g.weakFx')); S.play('hit', ev.n, ev.weak); }); tm += ev.bench ? 140 : 320; break;
        case 'heal': at(tm, () => { FX.heal(slotRef(ev.slot, snap), ev.n); S.play('heal'); }); tm += 120; break;
        case 'ko': { const tt = tm + 120; at(tt, () => { FX.ko(snap[ev.slot], ev.ctype, '', ev.bigBad); S.play('ko', ev.ctype); toast('💀 ' + t(ev.bigBad ? 'g.koBig' : 'g.ko', { c: esc(tr(ev.name)) }), true); }); tm = tt + 1400; break; }
        case 'evolve': at(tm, () => { FX.evolve(slotRef(ev.slot, snap), cn(ev.card)); S.play('evolve'); }); tm += 1250; break;
        case 'energy': at(tm, () => { const e = slotRef(ev.slot, snap); FX.pop(e, B.ENERGY[ev.e].icon); FX.glowOnce(e, B.ENERGY[ev.e].color); S.play('energy', ev.e); }); tm += 180; break;
        case 'bench': at(tm, () => { const e = slotRef(ev.slot, snap); if (e && e.animate) e.animate([{ transform: 'translateY(-30px) scale(1.15)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.3,1.4,.5,1)' }); S.play('bench'); }); tm += 160; break;
        case 'tool': at(tm, () => { FX.pop(slotRef(ev.slot, snap), '🛡️'); S.play('drop'); }); tm += 160; break;
        case 'status': at(tm, () => { FX.pop(slotRef(ev.slot, snap), { para: '⚡', sleep: '💤', poison: '☠️', burn: '🔥' }[ev.st] + ' ' + B.statusName(ev.st)); S.play('status'); }); tm += 260; break;
        case 'miss': at(tm, () => FX.pop(slotRef(ev.slot, snap), t('g.miss'))); tm += 300; break;
        case 'nodmg': at(tm, () => FX.pop(slotRef(ev.slot, snap), t('g.noDmg'))); tm += 250; break;
        case 'trainer': at(tm, () => { S.play('card'); if (aiPi(ev.pi) || GM.mode === 'hotseat') toast(t('g.plays', { p: esc(s.players[ev.pi].name), c: esc(cn(ev.card)) })); }); tm += aiPi(ev.pi) ? 200 : 60; break;
        case 'retreat': at(tm, () => S.play('card')); break;
        case 'peek':
          if (ev.pi === GM.view && isHuman(ev.pi)) modal({ title: t('g.oppHand'), body: `<div class="pickgrid">${ev.cards.map((u) => cardHTML(s.cards[u], 's')).join('') || `<span class="muted">${t('g.empty')}</span>`}</div>`, buttons: [{ label: 'OK' }] });
          break;
        default: break;
      }
    });
    return tm;
  }

  function pump() {
    const s = GM.s;
    if (!s || !GM.root || !document.body.contains(GM.root)) return;
    const snap = snapshotSlots();
    renderBoard();
    let dur = processEvents(snap);
    if (GM.mode === 'tutorial') Tutorial.check();
    if (s.phase === 'main' && s.turn !== GM.lastTurn) {
      GM.lastTurn = s.turn;
      const mine = isHuman(s.current);
      const txt = GM.mode === 'hotseat' ? t('g.turnOf', { p: esc(s.players[s.current].name) }) : mine ? t('g.yourTurnBanner') : t('g.turnOf', { p: esc(s.players[s.current].name) });
      if (GM.mode !== 'hotseat') setTimeout(() => { if (GM.root && document.body.contains(GM.root)) { FX.banner(txt, mine ? 'mine' : ''); S.play('turn', mine); } }, dur);
      dur += mine ? 700 : 500;
    }
    if (s.phase === 'over') { stopAI(); GM.timer = setTimeout(gameOver, dur); return; }
    if (s.phase === 'promote') {
      const pi = s.pendingPromote[0];
      if (s.players[pi].ai) later(() => { AI.promote(s, pi, GM.level); pump(); }, delay() + dur);
      else later(() => humanPromote(pi), dur);
      return;
    }
    if (s.phase === 'main' && s.players[s.current].ai) return later(aiStep, delay() + dur);
    if (GM.mode === 'hotseat' && s.phase === 'main' && s.current !== GM.view) later(() => handover(s.current, () => { S.play('turn', true); pump(); }), dur);
  }
  function aiStep() {
    const s = GM.s;
    if (!s || s.phase !== 'main' || !s.players[s.current].ai) return pump();
    const { action, picks } = AI.decide(s, GM.level);
    E.apply(s, action, picks);
    pump();
  }

  // ---------- Geräte-Übergabe (Hotseat) ----------
  function handover(pi, cb) {
    clearHandover();
    GM.handing = true;
    renderBoard();
    const o = el(`<div class="handover"><div class="hbox"><div style="font-size:46px">🔄</div><h2>${t('g.handTo', { p: esc(GM.s.players[pi].name) })}</h2><p class="muted">${t('g.handHint')}</p><button class="btn primary" style="padding:14px 30px;font-size:18px">${t('g.ready')}</button></div></div>`);
    document.body.appendChild(o);
    $('button', o).onclick = () => { o.remove(); GM.handing = false; GM.view = pi; renderBoard(); if (cb) cb(); };
  }
  function clearHandover() { $$('.handover').forEach((e) => e.remove()); GM.handing = false; }

  function humanSetup(pi, done) {
    const s = GM.s;
    GM.view = pi; renderBoard();
    const basics = E.basicsInHand(s, pi);
    let active = null; const bench = new Set();
    const body = el(`<div><p class="muted" style="margin-top:0">${t('g.setupHint')}</p><div class="pickgrid"></div></div>`);
    const grid = $('.pickgrid', body);
    const m = modal({ title: (GM.mode === 'hotseat' ? esc(s.players[pi].name) + ': ' : '') + t('g.setupTitle'), body, closable: false, buttons: [
      { label: t('g.auto'), onClick: () => { E.autoSetup(s, pi); done(); } },
      { label: t('g.letsGo'), cls: 'primary', keep: true, onClick: () => { if (!active) return toast(t('g.pickActiveFirst')); m.close(); E.setupPlace(s, pi, active, [...bench]); done(); } },
    ] });
    const draw = () => {
      grid.innerHTML = basics.map((u) => `<div class="pickable ${active === u || bench.has(u) ? 'on' : ''}" data-u="${u}" style="position:relative">${cardHTML(s.cards[u], 'm')}${active === u ? `<div class="newb" style="position:absolute;top:8px;left:8px;z-index:3;background:var(--blood);color:#fff">${t('g.active')}</div>` : bench.has(u) ? `<div class="newb" style="position:absolute;top:8px;left:8px;z-index:3">${t('g.bench')}</div>` : ''}</div>`).join('');
      $$('.pickable', grid).forEach((p) => (p.onclick = () => {
        const u = p.dataset.u;
        if (active === u) active = null;
        else if (bench.has(u)) bench.delete(u);
        else if (!active) active = u;
        else if (bench.size < CFG.BENCH_MAX) bench.add(u);
        draw();
      }));
    };
    draw();
  }

  function humanPromote(pi) {
    const s = GM.s;
    const p = s.players[pi];
    pickSteps([{ key: 'p', title: B.Engine.M('g.promoteQ', { p: GM.mode === 'hotseat' ? p.name + ': ' : '' }), options: p.bench.map((b) => ({ ref: b.id, slot: b.id })), min: 1, max: 1 }], (picks) => { E.promote(s, pi, picks.p[0]); pump(); }, false);
  }

  function pickSteps(steps, done, cancelable) {
    const s = GM.s;
    const picks = {};
    const next = (i) => {
      if (i >= steps.length) return done(picks);
      const st = steps[i];
      if (!st.options.length) { picks[st.key] = []; return next(i + 1); }
      const sel = new Set();
      const hint = st.max > 1 ? (st.min === st.max ? t('pick.exact', { n: st.max }) : st.min ? t('pick.range', { a: st.min, b: st.max }) : t('pick.upTo', { n: st.max })) : st.min === 0 ? t('pick.optional') : t('pick.tap');
      const body = el(`<div><p class="muted" style="margin-top:0">${hint}</p><div class="pickgrid"></div></div>`);
      const grid = $('.pickgrid', body);
      const auto = st.min === 1 && st.max === 1;
      const btns = [];
      if (cancelable !== false) btns.push({ label: t('common.cancel') });
      if (!auto) btns.push({ label: t('common.confirm'), cls: 'primary', keep: true, onClick: () => { if (sel.size < st.min) return toast(t('pick.min', { n: st.min })); m.close(); picks[st.key] = [...sel]; next(i + 1); } });
      const m = modal({ title: esc(tr(st.title)), body, closable: cancelable !== false, buttons: btns });
      const draw = () => {
        grid.innerHTML = st.options.map((o) => {
          const inner = o.slot ? (() => { const f = E.findSlot(s, o.slot); return slotHTML(s, f.slot, f.pos === 'active'); })() : cardHTML(s.cards[o.card], 's');
          return `<div class="pickable ${sel.has(o.ref) ? 'on' : ''}" data-ref="${o.ref}">${inner}</div>`;
        }).join('');
        $$('.pickable', grid).forEach((p) => (p.onclick = (e) => {
          e.stopPropagation();
          const ref = p.dataset.ref;
          if (auto) { m.close(); picks[st.key] = [ref]; return next(i + 1); }
          if (sel.has(ref)) sel.delete(ref); else if (sel.size < st.max) sel.add(ref); else if (st.max === 1) { sel.clear(); sel.add(ref); }
          draw();
        }));
      };
      draw();
    };
    next(0);
  }

  const myTurnNow = () => GM.s && GM.s.phase === 'main' && GM.s.current === GM.view && isHuman(GM.view) && !GM.handing;
  function humanAct(action) {
    const s = GM.s;
    if (!myTurnNow()) return;
    if (GM.mode === 'tutorial' && !Tutorial.allow(action)) return;
    const steps = E.choiceSpec(s, action);
    pickSteps(steps, (picks) => { E.apply(s, action, picks); pump(); }, true);
  }
  function humanEndTurn() {
    const s = GM.s;
    if (!myTurnNow()) return;
    if (GM.mode === 'tutorial' && !Tutorial.allow({ type: 'end' })) return;
    const canAtk = E.legalActions(s).some((a) => a.type === 'attack');
    if (canAtk) confirmBox(t('g.endQ'), t('g.endQt'), t('g.endTurn'), () => humanAct({ type: 'end' }));
    else humanAct({ type: 'end' });
  }

  function onHandClick(uid) {
    const s = GM.s;
    const c = E.def(s, uid);
    const myTurn = myTurnNow();
    const legal = myTurn ? E.legalActions(s).filter((a) => a.uid === uid) : [];
    const list = el('<div class="actlist"></div>');
    let m = null;
    const add = (label, action, cls) => { const b = el(`<button class="btn ${cls || ''}">${label}</button>`); b.onclick = () => { m.close(); humanAct(action); }; list.appendChild(b); };
    const why = (x) => list.appendChild(el(`<div class="why">${esc(x)}</div>`));
    const nameOf = (id) => esc(cn(E.top(s, E.findSlot(s, id).slot).id));
    if (!myTurn) why(s.phase === 'main' ? t('g.wait') : '');
    else if (c.kind === 'char') {
      legal.filter((a) => a.type === 'bench').forEach((a) => add('➕ ' + t('g.toBench'), a, 'primary'));
      legal.filter((a) => a.type === 'evolve').forEach((a) => add('✨ ' + t('g.evolveOn', { c: nameOf(a.target) }), a, 'primary'));
      if (!legal.length) why(c.stage ? (s.turn <= 2 ? t('g.noEvoFirst') : t('g.needBase', { c: cn(c.from) })) : t('g.benchFull'));
    } else if (c.kind === 'energy') {
      legal.forEach((a) => add(`${B.ENERGY[c.energy].icon} ${t('g.attachTo', { c: nameOf(a.target) })}${E.findSlot(s, a.target).pos === 'active' ? ' (' + t('g.activeShort') + ')' : ''}`, a));
      if (!legal.length) why(t('g.energyDone'));
    } else {
      if (legal.length) add('▶ ' + t('g.playCard', { s: B.subName(c.sub) }), legal[0], 'primary');
      else why(tr(E.trainerBlockReason(s, uid)) || t('g.notPlayable'));
    }
    showTargets(uid);
    m = cardDetail(s.cards[uid], { info: false, extra: list, onClose: clearTargets });
  }

  function onSlotClick(slotId) {
    const s = GM.s;
    const f = E.findSlot(s, slotId);
    if (!f) return;
    const sl = f.slot, c = E.top(s, sl);
    const mine = f.pi === GM.view, myTurn = myTurnNow();
    const list = el('<div class="actlist"></div>');
    let m = null;
    const st = Object.keys(sl.status).map((k) => B.statusName(k)).join(', ');
    list.appendChild(el(`<div class="muted">${t('c.hp')} ${E.hpMax(s, sl) - sl.damage} / ${E.hpMax(s, sl)} · ${t('g.energy')}: ${E.energyTypes(s, sl).map((ty) => B.ENERGY[ty].icon).join('') || t('g.none')}${sl.tool ? `<br>${t('g.tool')}: ${esc(cn(E.def(s, sl.tool).id))} – ${esc(B.ttext(E.def(s, sl.tool).id))}` : ''}${st ? '<br>' + t('g.status') + ': ' + st : ''}${sl.cards.length > 1 ? '<br>' + t('g.evolvedFrom') + ': ' + sl.cards.slice(0, -1).map((u) => esc(cn(E.def(s, u).id))).join(' → ') : ''}</div>`));
    if (mine && myTurn) {
      if (f.pos === 'active') {
        c.attacks.forEach((a, i) => {
          const reason = E.attackBlockReason(s, i);
          const opp = s.players[1 - GM.view].active;
          let prev = '';
          if (!reason && opp && a.dmg + a.fx.length) { const r = E.calcDamage(s, GM.view, sl, opp, a, 'expected'); prev = r.dmg ? ` → ≈${r.dmg}${r.weak ? ' (' + t('g.weakShort') + ')' : ''}` : ''; }
          const b = el(`<button class="btn ${reason ? '' : 'primary'}" data-atk="${i}"><span class="cost">${B.costIcons(a.cost)}</span> ${esc(B.an(c.id, i))} ${a.dmg ? '· ' + a.dmg : ''}${prev}</button>`);
          if (reason) { b.disabled = true; list.appendChild(b); list.appendChild(el(`<div class="why">${esc(tr(reason))}</div>`)); }
          else { b.onclick = () => { m.close(); humanAct({ type: 'attack', idx: i }); }; list.appendChild(b); }
        });
        const rr = E.retreatBlockReason(s);
        const rb = el(`<button class="btn">↩ ${t('g.retreat', { c: '⚪'.repeat(E.retreatCost(s, GM.view, sl)) || t('g.free') })}</button>`);
        if (rr) { rb.disabled = true; list.appendChild(rb); list.appendChild(el(`<div class="why">${esc(tr(rr))}</div>`)); }
        else {
          rb.onclick = () => {
            m.close();
            if (GM.mode === 'tutorial' && !Tutorial.allow({ type: 'retreat' })) return;
            const p = s.players[GM.view];
            pickSteps([{ key: 'tg', title: E.M('pick.whoForward'), options: p.bench.map((b) => ({ ref: b.id, slot: b.id })), min: 1, max: 1 }], (pk) => { E.apply(s, { type: 'retreat', target: pk.tg[0] }, {}); pump(); });
          };
          list.appendChild(rb);
        }
      }
      if (c.ability && c.ability.kind === 'active') {
        const r = E.abilityBlockReason(s, sl);
        const b = el(`<button class="btn ${r ? '' : 'gold'}">⚡ ${esc(B.abn(c.id))}</button>`);
        if (r) { b.disabled = true; list.appendChild(b); list.appendChild(el(`<div class="why">${esc(tr(r))}</div>`)); }
        else { b.onclick = () => { m.close(); humanAct({ type: 'ability', slot: sl.id }); }; list.appendChild(b); }
      }
    }
    m = cardDetail(c.id, { info: false, extra: list });
  }

  // ---------- Ziel-Hervorhebung & Drag and Drop ----------
  function dropTargetsFor(uid) {
    const s = GM.s;
    if (!myTurnNow()) return [];
    const c = E.def(s, uid);
    const out = [];
    for (const a of E.legalActions(s).filter((x) => x.uid === uid)) {
      if (a.type === 'bench') out.push({ zone: 'bench', action: a });
      else if (a.type === 'evolve' || a.type === 'energy') out.push({ slot: a.target, action: a });
      else if (a.type === 'trainer') {
        if (c.sub === 'Ausrüstung') E.choiceSpec(s, a)[0].options.forEach((o) => out.push({ slot: o.slot, action: a, picks: { target: [o.ref] } }));
        else if (c.sub === 'Stadion') out.push({ zone: 'stadium', action: a });
        else out.push({ zone: 'field', action: a });
      }
    }
    return out;
  }
  function targetEl(tg) {
    const r = GM.root;
    if (tg.slot) return $(`[data-slot="${tg.slot}"]`, r);
    if (tg.zone === 'bench') return $('[data-mbench]', r);
    if (tg.zone === 'stadium') return $('[data-stadium]', r);
    return $('.mid', r);
  }
  function showTargets(uid) {
    clearTargets();
    const targets = dropTargetsFor(uid);
    if (!targets.length) return [];
    const r = GM.root;
    r.classList.add('targeting');
    if (targets[0].action.type === 'evolve') r.classList.add('evolving');
    if (targets.some((x) => x.zone === 'bench')) $('[data-mbench]', r).appendChild(el(`<div class="slot empty bench-drop">＋ ${t('g.toBench')}</div>`));
    if (targets.some((x) => x.zone === 'field')) $('.mid', r).setAttribute('data-hint', t('g.dropPlay'));
    if (targets.some((x) => x.zone === 'stadium')) $('[data-stadium]', r).setAttribute('data-hint', t('g.dropStadium'));
    targets.forEach((x) => { const e = targetEl(x); if (e) e.classList.add('drop-ok'); x.el = e; });
    const hc = $(`.hand .card[data-uid="${uid}"]`, r);
    if (hc) hc.classList.add('drag-src-hint');
    return targets;
  }
  function clearTargets() {
    const r = GM.root;
    if (!r) return;
    r.classList.remove('targeting', 'evolving');
    $$('.drop-ok, .drop-hover', r).forEach((e) => e.classList.remove('drop-ok', 'drop-hover'));
    $$('.bench-drop', r).forEach((e) => e.remove());
    $$('[data-hint]', r).forEach((e) => e.removeAttribute('data-hint'));
    $$('.drag-src-hint', r).forEach((e) => e.classList.remove('drag-src-hint'));
  }
  function hitTarget(targets, x, y) {
    const sorted = targets.slice().sort((a, b) => (a.slot ? 0 : 1) - (b.slot ? 0 : 1));
    for (const tg of sorted) {
      const e = tg.zone === 'bench' ? $('[data-mbench]', GM.root) : tg.el;
      if (!e) continue;
      const rc = e.getBoundingClientRect();
      const pad = tg.zone === 'bench' ? 24 : 6;
      if (x >= rc.left - pad && x <= rc.right + pad && y >= rc.top - pad && y <= rc.bottom + pad) return tg;
    }
    return null;
  }
  function sparkle(x, y) {
    for (let i = 0; i < 12; i++) {
      const sp = el('<i class="spark"></i>');
      const a = (i / 12) * Math.PI * 2, d = 40 + Math.random() * 30;
      sp.style.left = x + 'px'; sp.style.top = y + 'px';
      sp.style.setProperty('--dx', Math.cos(a) * d + 'px'); sp.style.setProperty('--dy', Math.sin(a) * d + 'px');
      document.body.appendChild(sp);
      setTimeout(() => sp.remove(), 650);
    }
  }
  function performDrop(tg) {
    const e = tg.zone === 'bench' ? null : tg.el;
    if (e) { e.classList.add('landed'); setTimeout(() => e.classList.remove('landed'), 600); }
    if (GM.mode === 'tutorial' && !Tutorial.allow(tg.action)) return;
    if (tg.picks) { E.apply(GM.s, tg.action, tg.picks); pump(); }
    else humanAct(tg.action);
  }
  function setupDrag(root) {
    const hand = $('[data-hand]', root);
    let st = null;
    hand.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse' || st) return;
      const c = e.target.closest('.card'); if (!c) return;
      if (!c.contains(e.relatedTarget)) showTargets(c.dataset.uid);
    });
    hand.addEventListener('pointerout', (e) => {
      if (e.pointerType !== 'mouse' || st) return;
      const c = e.target.closest('.card'); if (c && !c.contains(e.relatedTarget)) clearTargets();
    });
    hand.addEventListener('pointerdown', (e) => {
      const c = e.target.closest('.card');
      if (!c || e.button > 0) return;
      st = { uid: c.dataset.uid, x: e.clientX, y: e.clientY, lastX: e.clientX, dragging: false, src: c, id: e.pointerId, type: e.pointerType };
    });
    window.addEventListener('pointermove', (e) => {
      if (!st || e.pointerId !== st.id) return;
      const dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.dragging) {
        if (Math.hypot(dx, dy) < 8) return;
        if (st.type !== 'mouse' && Math.abs(dx) > Math.abs(dy)) { st = null; return; }
        const targets = showTargets(st.uid);
        if (!targets.length) { st = null; return; }
        st.targets = targets;
        st.dragging = true;
        const rc = st.src.getBoundingClientRect();
        st.home = { x: rc.left + rc.width / 2, y: rc.top + rc.height / 2 };
        st.ghost = el(cardHTML(GM.s.cards[st.uid], 's', { cls: 'drag-ghost' }));
        document.body.appendChild(st.ghost);
        st.src.classList.add('drag-src');
      }
      const vx = e.clientX - st.lastX; st.lastX = e.clientX;
      st.ghost.style.left = e.clientX + 'px'; st.ghost.style.top = e.clientY + 'px';
      st.ghost.style.setProperty('--rot', Math.max(-14, Math.min(14, vx * 1.2)) + 'deg');
      const hit = hitTarget(st.targets, e.clientX, e.clientY);
      st.targets.forEach((x) => { const te = x.zone === 'bench' ? $('.bench-drop', GM.root) : x.el; if (te) te.classList.toggle('drop-hover', x === hit); });
      st.ghost.classList.toggle('over', !!hit);
      e.preventDefault();
    }, { passive: false });
    const end = (e, cancel) => {
      if (!st || (e && e.pointerId !== st.id)) return;
      const cur = st; st = null;
      if (!cur.dragging) return;
      GM.suppressClick = true; setTimeout(() => (GM.suppressClick = false), 50);
      const hit = cancel ? null : hitTarget(cur.targets, e.clientX, e.clientY);
      const g = cur.ghost;
      if (hit) {
        const te = hit.zone === 'bench' ? $('.bench-drop', GM.root) || hit.el : hit.el;
        const rc = te.getBoundingClientRect();
        const cx = rc.left + rc.width / 2, cy = rc.top + rc.height / 2;
        g.classList.add('drop-in');
        g.style.left = cx + 'px'; g.style.top = cy + 'px';
        sparkle(cx, cy);
        S.play('drop');
        setTimeout(() => { g.remove(); clearTargets(); performDrop(hit); }, 230);
      } else {
        g.classList.add('fly-home');
        S.play('invalid');
        g.style.left = cur.home.x + 'px'; g.style.top = cur.home.y + 'px';
        setTimeout(() => { g.remove(); cur.src.classList.remove('drag-src'); clearTargets(); }, 260);
      }
    };
    window.addEventListener('pointerup', (e) => end(e, false));
    window.addEventListener('pointercancel', (e) => end(e, true));
  }

  function showPile(pi) {
    const s = GM.s, p = s.players[pi];
    modal({ title: t('g.discardOf', { p: esc(p.name) }), body: `<div class="pickgrid">${p.discard.map((u) => cardHTML(s.cards[u], 's')).join('') || `<span class="muted">${t('g.empty')}</span>`}</div>`, buttons: [{ label: t('common.close') }] });
  }

  function recordResult(won) {
    if (GM.recorded) return [];
    GM.recorded = true;
    if (!counts()) return [];
    const tk = GM.tracker;
    tk.won = won; tk.turns = GM.s.turn;
    B.Ach.applyGame(save, tk);
    return B.Ach.check(save, { type: 'game', game: tk });
  }
  function gameOver() {
    const s = GM.s;
    if (GM.recorded) return;
    const won = s.winner === 0;
    const fresh = recordResult(won);
    stopAI();
    const hot = GM.mode === 'hotseat';
    if (won || hot) { S.play('win'); FX.confetti(); FX.banner(hot ? t('g.wins', { p: esc(s.players[s.winner].name) }) : t('g.victory'), 'win'); } else { S.play('lose'); FX.gloom(); FX.banner(t('g.defeat'), 'lose'); }
    let extra = '';
    if (GM.mode === 'story' && won) extra = storyCleared(GM.opts.chapter);
    if (GM.mode === 'tutorial') extra = tutorialFinished();
    setTimeout(() => {
      const title = hot ? '🏆 ' + t('g.wins', { p: esc(s.players[s.winner].name) }) : won ? '🏆 ' + t('g.victory') : '🪦 ' + t('g.defeat');
      const line = hot ? t('g.hotEnd') : won ? t('g.winLine') : t('g.loseLine');
      const bal = counts() && GM.mode === 'ai' ? `<p class="muted">${t('g.balance', { l: lvName(GM.level), w: save.stats.byLevel[GM.level][1], p: save.stats.byLevel[GM.level][0] })}</p>` : '';
      const btns = [{ label: t('common.menu'), onClick: () => go(screenMenu) }];
      if (GM.mode === 'story') btns.push({ label: t('st.toStory'), cls: 'primary', onClick: () => go(screenStory) });
      else if (GM.mode !== 'tutorial') btns.push({ label: t('g.rematch'), cls: 'primary', onClick: () => go(() => startGame(Object.assign({}, GM.opts, { scene: null }))) });
      modal({ title, closable: false, body: `<p style="font-family:var(--serif);font-size:18px;margin-top:0">${line}</p><p class="muted">${esc(tr(s.winReason))}</p>${bal}${extra}${achListHTML(fresh)}`, buttons: btns });
    }, 900);
  }

  // =====================================================================
  //  Story-Modus
  // =====================================================================
  function screenStory() {
    const s = el(`<div class="screen story">${menuBg()}${topbar('📖 ' + t('st.title'), `<span class="muted">${t('st.progress', { n: Object.keys(save.story.cleared).length, max: B.STORY.length })}</span>`)}<div class="scroll" style="flex:1;padding:16px;position:relative;z-index:1"><div class="chapters"></div></div></div>`);
    bindBack(s);
    const box = $('.chapters', s);
    box.innerHTML = `<p class="prose" style="padding:0 0 10px;margin:0 auto;max-width:900px">${t('st.intro')}</p>` + B.STORY.map((ch, i) => {
      const unlocked = i === 0 || save.story.cleared[B.STORY[i - 1].n];
      const done = save.story.cleared[ch.n];
      return `<div class="chapter ${unlocked ? '' : 'locked'} ${done ? 'done' : ''}" data-ch="${ch.n}">
        <div class="chn">${done ? '✔' : unlocked ? ch.n : '🔒'}</div>
        <div class="cht"><b>${t('st.chapter', { n: ch.n })} · ${esc(B.storyText(ch, 'title'))}</b><div class="muted">${unlocked ? esc(B.storyText(ch, 'teaser')) : t('st.locked')}</div>
        <div class="rw">${t('st.reward')}: 🎁 ${ch.reward} ${t('st.boosters')} · ${t('st.levelLbl')}: ${lvName(ch.level)}${done ? ' · ' + t('st.cleared') : ''}</div></div></div>`;
    }).join('');
    $$('.chapter', box).forEach((c) => (c.onclick = () => {
      const ch = B.STORY.find((x) => x.n === +c.dataset.ch);
      const i = B.STORY.indexOf(ch);
      if (!(i === 0 || save.story.cleared[B.STORY[i - 1].n])) return toast('🔒 ' + t('st.locked'));
      const d = save.decks.find((x) => x.id === save.activeDeck) || save.decks[0];
      const probs = d ? B.deckProblems(save, d) : [E.M('p.pickDeck')];
      const od = B.PREBUILT.find((x) => x.id === ch.deck);
      modal({ title: `${t('st.chapter', { n: ch.n })} · ${esc(B.storyText(ch, 'title'))}`, body: `<div class="storytext">${B.storyText(ch, 'intro').split('\n').map((p) => `<p>${esc(p)}</p>`).join('')}</div><p class="muted">${t('st.vs', { d: esc(deckName(od)), l: lvName(ch.level) })}<br>${t('st.yourDeck', { d: esc(d ? d.name : '–') })}${probs.length ? ` <span style="color:#ff9aaa">⚠️ ${esc(tr(probs[0]))}</span>` : ''}</p>`,
        buttons: [{ label: t('common.cancel') }, { label: '⚔️ ' + t('st.fight'), cls: 'primary', disabled: !!probs.length, onClick: () => go(() => startGame({ mode: 'story', chapter: ch.n, myDeck: d, oppDeck: od, level: ch.level, scene: ch.scene })) }] });
    }));
    app.appendChild(s);
  }
  function storyCleared(n) {
    const ch = B.STORY.find((x) => x.n === n);
    const first = !save.story.cleared[n];
    save.story.cleared[n] = B.today();
    if (first) save.bonusBoosters = (save.bonusBoosters || 0) + ch.reward;
    persist();
    return `<div class="storytext" style="margin-top:10px">${B.storyText(ch, 'outro').split('\n').map((p) => `<p>${esc(p)}</p>`).join('')}</div>${first ? `<p style="color:var(--gold)">🎁 ${t('st.got', { n: ch.reward })}</p>` : ''}${n === B.STORY.length && first ? `<p style="color:var(--gold)">✨ ${t('st.finale')}</p>` : ''}`;
  }

  // =====================================================================
  //  Tutorial
  // =====================================================================
  const TUT_DECK_ME = { buffy1: 2, buffy2: 2, willow1: 2, xander1: 2, library: 2, watcher_diary: 2, mr_pointy: 2, e_K: 30, e_M: 10, e_W: 6 };
  const TUT_DECK_OPP = { vampgen: 8, harmony: 4, e_V: 48 };
  function startTutorial() {
    startGame({
      mode: 'tutorial', level: 'beginner', scene: 'school', seed: 4242,
      myDeck: { id: 'tut', name: 'Tutorial', cards: TUT_DECK_ME }, oppDeck: { id: 'tutopp', name: t('tu.oppName'), cards: TUT_DECK_OPP },
      prepare: (s) => {
        // Starthand festlegen: Buffy, Xander, Buffy – Die Auserwählte, 3× Kampf-Energie, Bibliothek
        const p = s.players[0];
        const all = p.deck.concat(p.hand); p.hand = []; p.deck = all;
        const want = ['buffy1', 'xander1', 'buffy2', 'e_K', 'e_K', 'e_K', 'library'];
        for (const id of want) { const i = p.deck.findIndex((u) => s.cards[u] === id); p.hand.push(p.deck.splice(i, 1)[0]); }
        const o = s.players[1];
        const oall = o.deck.concat(o.hand); o.hand = []; o.deck = oall;
        for (const id of ['vampgen', 'vampgen', 'e_V', 'e_V', 'e_V', 'e_V', 'e_V']) { const i = o.deck.findIndex((u) => s.cards[u] === id); o.hand.push(o.deck.splice(i, 1)[0]); }
        s.log = [];
      },
    });
  }
  const Tutorial = (() => {
    let step = 0, box = null;
    const s = () => GM.s;
    const me = () => s().players[0];
    const STEPS = [
      { k: 'welcome', btn: true },
      { k: 'board', btn: true, hl: ['[data-actives] .slot:last-child', '[data-mbench]', '[data-hand]', '[data-oinfo] .kos', '[data-minfo] .kos'] },
      { k: 'energy', hl: ['.hand .card[data-id="e_K"]', '[data-actives] .slot:last-child'], allow: (a) => a.type === 'energy', done: () => me().active.energy.length >= 1 },
      { k: 'bench', hl: ['.hand .card[data-id="xander1"]', '[data-mbench]'], allow: (a) => a.type === 'bench', done: () => me().bench.length >= 1 },
      { k: 'end1', hl: ['[data-end]', '[data-mend]'], allow: (a) => a.type === 'end', done: () => s().turn >= 2 },
      { k: 'opp', done: () => s().turn >= 3 && s().current === 0 && s().phase === 'main' },
      { k: 'energy2', hl: ['.hand .card[data-id="e_K"]', '[data-actives] .slot:last-child'], allow: (a) => a.type === 'energy', done: () => me().active.energy.length >= 2 },
      { k: 'evolve', hl: ['.hand .card[data-id="buffy2"]'], allow: (a) => a.type === 'evolve', done: () => E.top(s(), me().active).id === 'buffy2' },
      { k: 'attack', hl: ['[data-actives] .slot:last-child'], allow: (a) => a.type === 'attack', done: () => me().kos >= 1 || s().turn >= 4 },
      { k: 'weak', btn: true },
      { k: 'free', btn: true, last: true },
    ];
    function render() {
      if (!GM.root) return;
      $$('.coach-hl').forEach((e) => e.classList.remove('coach-hl'));
      if (step >= STEPS.length) { if (box) box.remove(); box = null; return; }
      const st = STEPS[step];
      if (!box || !document.body.contains(box)) { box = el('<div class="coach"></div>'); GM.root.appendChild(box); }
      box.innerHTML = `<div class="cav">🎓</div><div class="ctx"><b>${t('tu.coach')}</b> <span class="muted">(${step + 1}/${STEPS.length})</span><div>${t('tu.' + st.k)}</div></div><div class="cbtns">${st.btn ? `<button class="btn small primary" data-next>${st.last ? t('tu.go') : t('tu.next')}</button>` : ''}<button class="btn small" data-skip>${t('tu.skip')}</button></div>`;
      const nb = $('[data-next]', box); if (nb) nb.onclick = () => { step++; render(); pump(); };
      $('[data-skip]', box).onclick = () => { step = STEPS.length; render(); toast(t('tu.skipped')); };
      (st.hl || []).forEach((sel) => $$(sel, GM.root).forEach((e) => e.classList.add('coach-hl')));
    }
    return {
      begin() {
        step = 0;
        const sx = GM.s;
        E.autoSetup(sx, 1, 0);
        const p = sx.players[0];
        E.setupPlace(sx, 0, p.hand.find((u) => sx.cards[u] === 'buffy1'), []);
        E.begin(sx, 0);
        render();
        pump();
      },
      render,
      check() {
        if (step >= STEPS.length) return;
        const st = STEPS[step];
        if (st.done && st.done()) { step++; S.play('achievement'); }
        render();
      },
      allow(action) {
        if (step >= STEPS.length) return true;
        const st = STEPS[step];
        if (st.btn) { toast(t('tu.readFirst')); return false; }
        if (st.allow && !st.allow(action)) { toast(t('tu.notNow')); S.play('invalid'); return false; }
        if (!st.allow && st.k === 'opp') return false;
        return true;
      },
    };
  })();
  function tutorialFinished() {
    const first = !save.tutorialDone;
    save.tutorialDone = true;
    if (first) save.bonusBoosters = (save.bonusBoosters || 0) + 2;
    persist();
    return `<p style="color:var(--gold)">🎓 ${t('tu.done')}${first ? ' ' + t('tu.reward') : ''}</p>`;
  }

  // =====================================================================
  //  Sammlung
  // =====================================================================
  function filterBar(state, onChange, opts) {
    opts = opts || {};
    const bar = el('<div class="filters"></div>');
    const chips = (key, items) => items.map(([v, l]) => `<span class="chip ${state[key] === v ? 'on' : ''}" data-k="${key}" data-v="${v}">${l}</span>`).join('');
    const draw = () => {
      bar.innerHTML = `<input type="search" placeholder="${t('c.search')}" value="${esc(state.q || '')}" style="width:150px">` +
        chips('kind', [['all', t('c.all')], ['char', t('c.chars')], ['trainer', t('c.support')]]) + '<span style="width:8px"></span>' +
        chips('type', [['all', t('c.allTypes')], ...Object.entries(B.TYPES).map(([k, ty]) => [k, ty.icon + ' ' + B.typeName(k)])]) + '<span style="width:8px"></span>' +
        `<select class="field" data-season style="padding:5px"><option value="all">${t('c.allSeasons')}</option>${[1, 2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}" ${state.season == n ? 'selected' : ''}>${t('c.season', { s: n })}</option>`).join('')}</select>` +
        (opts.ownedToggle ? `<span class="chip ${state.owned ? 'on' : ''}" data-own>${t('c.mine')}</span>` : '');
      const q = $('input', bar);
      q.oninput = () => { state.q = q.value; onChange(); };
      $$('.chip[data-k]', bar).forEach((c) => (c.onclick = () => { state[c.dataset.k] = c.dataset.v; draw(); onChange(); }));
      $('[data-season]', bar).onchange = (e) => { state.season = e.target.value; onChange(); };
      const own = $('[data-own]', bar); if (own) own.onclick = () => { state.owned = !state.owned; draw(); onChange(); };
    };
    draw();
    return bar;
  }
  function inSeason(c, n) {
    if (!c.seasons) return true;
    return c.seasons.split(',').some((part) => { const m = part.trim().split('–').map(Number); return m.length === 2 ? n >= m[0] && n <= m[1] : n === m[0]; });
  }
  function filterCards(state) {
    const q = (state.q || '').toLowerCase();
    return Object.values(B.CARDS).filter((c) => {
      if (c.kind === 'energy') return false;
      if (state.kind !== 'all' && c.kind !== state.kind) return false;
      if (state.type !== 'all' && c.type !== state.type) return false;
      if (state.season !== 'all' && c.kind === 'char' && !inSeason(c, +state.season)) return false;
      if (state.season !== 'all' && c.kind !== 'char') return false;
      if (state.owned && !(save.collection[c.id] > 0)) return false;
      if (q && !(cn(c.id).toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (c.kind === 'trainer' && B.ttext(c.id).toLowerCase().includes(q)))) return false;
      return true;
    });
  }
  const sortCards = (a, b) => (a.kind === b.kind ? 0 : a.kind === 'char' ? -1 : 1) || (a.type || a.sub || '').localeCompare(b.type || b.sub || '') || cn(a.id).localeCompare(cn(b.id));

  function screenCollection() {
    const state = { kind: 'all', type: 'all', season: 'all', q: '', owned: false };
    const s = el(`<div class="screen">${topbar(t('m.collection'), '<span class="muted" data-cnt></span>')}<div data-f></div><div class="grid scroll" style="flex:1"></div></div>`);
    bindBack(s);
    const grid = $('.grid', s);
    const render = () => {
      const list = filterCards(state).sort(sortCards);
      grid.innerHTML = list.map((c) => cardHTML(c.id, 'm', { count: save.collection[c.id] || 0, unowned: !(save.collection[c.id] > 0), clickable: true })).join('') || `<p class="muted">${t('c.none')}</p>`;
      const owned = Object.values(B.CARDS).filter((c) => c.kind !== 'energy' && save.collection[c.id] > 0).length;
      $('[data-cnt]', s).textContent = t('c.count', { n: owned, max: Object.values(B.CARDS).filter((c) => c.kind !== 'energy').length });
    };
    $('[data-f]', s).appendChild(filterBar(state, render, { ownedToggle: true }));
    grid.onclick = (e) => { const c = e.target.closest('.card'); if (c) cardDetail(c.dataset.id, { onChange: render }); };
    render();
    app.appendChild(s);
  }

  // =====================================================================
  //  Decks
  // =====================================================================
  function screenDecks() {
    const s = el(`<div class="screen">${topbar(t('d.title'), `<button class="btn small" data-tpl>📋 ${t('d.template')}</button><button class="btn small primary" data-new>＋ ${t('d.new')}</button>`)}<div class="decklist scroll" style="flex:1"></div></div>`);
    bindBack(s);
    const list = $('.decklist', s);
    const render = () => {
      list.innerHTML = save.decks.map((d) => {
        const p = B.deckProblems(save, d);
        const n = Object.values(d.cards).reduce((a, b) => a + b, 0);
        const chars = Object.entries(d.cards).filter(([id]) => B.CARDS[id] && B.CARDS[id].kind === 'char');
        const types = [...new Set(chars.map(([id]) => B.TYPES[B.CARDS[id].type].icon))].join(' ');
        return `<div class="decktile ${save.activeDeck === d.id ? 'active' : ''}" data-id="${d.id}"><div style="display:flex;gap:8px;align-items:center"><h3 style="flex:1;font-size:17px">${esc(d.name)}</h3>${save.activeDeck === d.id ? `<span class="badge" style="background:var(--gold);color:#1a1205">${t('d.active')}</span>` : ''}</div>
          <div class="muted" style="font-size:13px">${t('d.nCards', { n })} · ${types}</div>
          <div style="font-size:12px;color:${p.length ? '#ff9aaa' : 'var(--ok)'}">${p.length ? '⚠️ ' + esc(tr(p[0])) + (p.length > 1 ? ` (+${p.length - 1})` : '') : '✔ ' + t('p.ready')}</div>
          <div class="acts"><button class="btn small primary" data-a="edit">${t('d.edit')}</button><button class="btn small" data-a="use">${t('d.setActive')}</button><button class="btn small" data-a="dup">${t('d.copy')}</button><button class="btn small" data-a="del">${t('d.delete')}</button></div></div>`;
      }).join('');
      $$('.decktile', list).forEach((tl) => $$('[data-a]', tl).forEach((b) => (b.onclick = () => {
        const d = save.decks.find((x) => x.id === tl.dataset.id);
        if (b.dataset.a === 'edit') go(() => screenDeckEdit(d));
        if (b.dataset.a === 'use') { save.activeDeck = d.id; persist(); render(); }
        if (b.dataset.a === 'dup') { save.decks.push({ id: 'd' + Date.now(), name: d.name + ' (' + t('d.copyName') + ')', cards: Object.assign({}, d.cards) }); persist(); render(); }
        if (b.dataset.a === 'del') confirmBox(t('d.delQ'), t('d.delT', { d: esc(d.name) }), t('d.delete'), () => { save.decks = save.decks.filter((x) => x !== d); if (save.activeDeck === d.id && save.decks[0]) save.activeDeck = save.decks[0].id; persist(); render(); });
      })));
    };
    $('[data-new]', s).onclick = () => { const d = { id: 'd' + Date.now(), name: t('d.newName'), cards: {} }; save.decks.push(d); persist(); go(() => screenDeckEdit(d)); };
    $('[data-tpl]', s).onclick = () => {
      const body = el(`<div class="setup-grid">${B.PREBUILT.map((d) => { const p = B.deckProblems(save, d); return `<div class="opt ${p.length ? 'bad' : ''}" data-id="${d.id}"><div class="t">${esc(deckName(d))}</div><div class="d">${esc(deckDesc(d))}<br>${p.length ? '⚠️ ' + t('d.missing', { n: p.length }) : '✔ ' + t('d.complete')}</div></div>`; }).join('')}</div>`);
      const m = modal({ title: t('d.template'), body, buttons: [{ label: t('common.cancel') }] });
      $$('.opt', body).forEach((o) => (o.onclick = () => { const tp = B.PREBUILT.find((x) => x.id === o.dataset.id); save.decks.push({ id: 'd' + Date.now(), name: deckName(tp), cards: Object.assign({}, tp.cards) }); persist(); m.close(); render(); toast(t('d.copied')); }));
    };
    render();
    app.appendChild(s);
  }

  function screenDeckEdit(deck) {
    const work = { name: deck.name, cards: Object.assign({}, deck.cards) };
    const state = { kind: 'all', type: 'all', season: 'all', q: '', owned: true };
    const s = el(`<div class="screen">${topbar(t('d.editTitle'), `<button class="btn small" data-fill>⚡ ${t('d.fill')}</button><button class="btn small primary" data-save>${t('common.save')}</button>`)}
      <div class="deckedit"><div class="left"><div data-f></div><div class="grid scroll" style="flex:1" data-grid></div></div>
      <div class="right"><div class="dhead"><input class="field" data-name value="${esc(work.name)}"><div style="display:flex;justify-content:space-between;align-items:center"><b data-count></b><span class="muted" style="font-size:12px">${t('d.maxCopies', { n: CFG.MAX_COPIES })}</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap" data-energy></div></div><div class="errs" data-errs></div><div class="dlist scroll" data-list></div></div></div></div>`);
    bindBack(s);
    $('[data-back]', s).onclick = () => confirmBox(t('d.leaveQ'), t('d.leaveT'), t('d.leave'), () => go(screenDecks));
    const total = () => Object.values(work.cards).reduce((a, b) => a + b, 0);
    const byName = (name) => Object.entries(work.cards).filter(([id]) => B.CARDS[id] && B.CARDS[id].name === name).reduce((a, [, n]) => a + n, 0);
    const addCard = (id, d) => {
      const c = B.CARDS[id];
      const n = (work.cards[id] || 0) + d;
      if (d > 0) {
        if (total() >= CFG.DECK_SIZE) return toast(t('d.full'));
        if (c.kind !== 'energy' && byName(c.name) >= CFG.MAX_COPIES) return toast(t('d.maxName', { n: CFG.MAX_COPIES, c: cn(id) }));
        if (n > B.owned(save, id)) return toast(t('d.ownOnly', { n: B.owned(save, id) }));
      }
      if (n <= 0) delete work.cards[id]; else work.cards[id] = n;
      renderRight(); renderGridCounts();
    };
    const grid = $('[data-grid]', s);
    const renderGrid = () => {
      const list = filterCards(state).sort(sortCards);
      grid.innerHTML = list.map((c) => `<div class="addwrap" data-id="${c.id}">${cardHTML(c.id, 's', { count: save.collection[c.id] || 0, unowned: !(save.collection[c.id] > 0), clickable: true })}<div class="addbar"><button class="btn small" data-d="-1">−</button><span class="badge" data-in>${work.cards[c.id] || 0}</span><button class="btn small" data-d="1">＋</button></div></div>`).join('');
    };
    const renderGridCounts = () => $$('.addwrap', grid).forEach((w) => ($('[data-in]', w).textContent = work.cards[w.dataset.id] || 0));
    grid.onclick = (e) => {
      const w = e.target.closest('.addwrap'); if (!w) return;
      const b = e.target.closest('[data-d]');
      if (b) return addCard(w.dataset.id, +b.dataset.d);
      if (e.target.closest('.card')) cardDetail(w.dataset.id);
    };
    const renderRight = () => {
      $('[data-count]', s).textContent = t('d.countOf', { n: total(), max: CFG.DECK_SIZE });
      $('[data-energy]', s).innerHTML = ['K', 'M', 'V', 'W'].map((e) => `<span class="chip" style="cursor:default">${B.ENERGY[e].icon} <button class="btn small" data-e="${e}" data-d="-1" style="padding:0 6px">−</button><b>${work.cards['e_' + e] || 0}</b><button class="btn small" data-e="${e}" data-d="1" style="padding:0 6px">＋</button></span>`).join('');
      $$('[data-e]', s).forEach((b) => (b.onclick = () => addCard('e_' + b.dataset.e, +b.dataset.d)));
      const rows = Object.entries(work.cards).filter(([id]) => B.CARDS[id] && B.CARDS[id].kind !== 'energy').map(([id, n]) => ({ c: B.CARDS[id], n })).sort((a, b) => sortCards(a.c, b.c));
      const grp = (title, arr) => arr.length ? `<div class="muted" style="font-size:12px;margin:8px 0 2px;text-transform:uppercase;letter-spacing:.06em">${title} (${arr.reduce((a, r) => a + r.n, 0)})</div>` + arr.map((r) => `<div class="drow" data-id="${r.c.id}"><span class="tdot" style="background:${tcOf(r.c)}"></span><span class="n">${esc(cn(r.c.id))}${r.c.kind === 'char' ? ` <span class="muted">${B.stageName(r.c)}</span>` : ''}</span><button class="btn small" data-d="-1" style="padding:0 7px">−</button><span class="q">${r.n}</span><button class="btn small" data-d="1" style="padding:0 7px">＋</button></div>`).join('') : '';
      $('[data-list]', s).innerHTML = grp(t('c.chars'), rows.filter((r) => r.c.kind === 'char')) + grp(t('c.support'), rows.filter((r) => r.c.kind === 'trainer')) || `<p class="muted">${t('d.emptyList')}</p>`;
      $$('[data-list] .drow', s).forEach((r) => { $$('[data-d]', r).forEach((b) => (b.onclick = () => addCard(r.dataset.id, +b.dataset.d))); $('.n', r).onclick = () => cardDetail(r.dataset.id); });
      const errs = B.deckProblems(save, work);
      $('[data-errs]', s).className = errs.length ? 'errs' : 'okmsg';
      $('[data-errs]', s).innerHTML = errs.length ? errs.slice(0, 4).map((x) => esc(tr(x))).join('<br>') : '✔ ' + t('d.ok');
    };
    $('[data-f]', s).appendChild(filterBar(state, renderGrid, { ownedToggle: true }));
    $('[data-name]', s).oninput = (e) => (work.name = e.target.value);
    $('[data-fill]', s).onclick = () => {
      const need = CFG.DECK_SIZE - total();
      if (need <= 0) return toast(t('d.full'));
      const weight = { K: 0, M: 0, V: 0, W: 0 };
      for (const [id, n] of Object.entries(work.cards)) { const c = B.CARDS[id]; if (c && c.kind === 'char') for (const a of c.attacks) for (const ch of a.cost) if (weight[ch] != null) weight[ch] += n; }
      const sum = Object.values(weight).reduce((a, b) => a + b, 0) || 1;
      let rest = need;
      const keys = Object.keys(weight).filter((k) => weight[k] > 0);
      if (!keys.length) keys.push('K');
      keys.forEach((k, i) => { const add = i === keys.length - 1 ? rest : Math.round((need * weight[k]) / sum); work.cards['e_' + k] = (work.cards['e_' + k] || 0) + add; rest -= add; });
      renderRight(); toast(t('d.filled', { n: need }));
    };
    $('[data-save]', s).onclick = () => { deck.name = work.name.trim() || 'Deck'; deck.cards = work.cards; save.stats.decksSaved = (save.stats.decksSaved || 0) + 1; persist(); toast(t('d.saved')); go(screenDecks); announce(B.Ach.check(save, { type: 'deck' })); };
    renderGrid(); renderRight();
    app.appendChild(s);
  }

  // =====================================================================
  //  Booster
  // =====================================================================
  function screenBooster() {
    const s = el(`<div class="screen">${topbar(t('b.title'), '<span class="muted" data-left></span>')}<div class="scroll" style="flex:1;display:flex;flex-direction:column;align-items:center;padding:20px;gap:18px" data-body></div></div>`);
    bindBack(s);
    const body = $('[data-body]', s);
    const label = () => t('b.left', { n: B.boostersLeft(save), max: CFG.BOOSTERS_PER_DAY }) + (save.bonusBoosters ? ' · ' + t('b.bonus', { n: save.bonusBoosters }) : '');
    const idle = () => {
      const left = B.totalBoosters(save);
      $('[data-left]', s).textContent = label();
      body.innerHTML = left
        ? `<div class="pack" data-open><div style="font-size:54px">🦇</div><div class="pl">Booster</div><div class="muted" style="font-family:var(--sans);font-size:13px">${t('b.packInfo')}</div></div><p class="muted">${t('b.contents')}</p>`
        : `<div class="pack" style="filter:grayscale(.8);cursor:default"><div style="font-size:54px">🌙</div><div class="pl">${t('b.empty')}</div><div class="muted" style="font-family:var(--sans);font-size:13px">${t('b.midnight', { n: CFG.BOOSTERS_PER_DAY })}</div></div><p class="muted">${t('b.tip')}</p>`;
      const o = $('[data-open]', body);
      if (o) o.onclick = open;
    };
    const open = () => {
      const packEl = $('[data-open]', body);
      const pr = packEl ? packEl.getBoundingClientRect() : null;
      const res = B.openBooster(save);
      if (!res) return idle();
      const legend = res.some((r) => B.CARDS[r.id].rarity === 'L');
      S.play('booster', legend);
      if (pr) { FX.burst(pr.left + pr.width / 2, pr.top + pr.height / 2, { color: legend ? ['#ffd77a', '#fff6c8', '#ff3355'] : ['#ffd77a', '#c41d3a', '#f1e9d8'], shape: 'star', count: 30, spread: 220, slow: 1.3 }); FX.flash(legend ? 'rgba(255,215,120,.35)' : 'rgba(255,255,255,.2)', 500); }
      const fresh = B.Ach.check(save, { type: 'booster' });
      const order = res.slice().sort((a, b) => 'CURL'.indexOf(B.CARDS[a.id].rarity) - 'CURL'.indexOf(B.CARDS[b.id].rarity));
      $('[data-left]', s).textContent = label();
      body.innerHTML = `<div class="grid reveal" style="padding:0">${order.map((r, i) => cardHTML(r.id, 'm', { isNew: r.isNew, clickable: true, count: save.collection[r.id], style: `animation-delay:${i * 0.12}s` })).join('')}</div>
        <div style="display:flex;gap:10px">${B.totalBoosters(save) ? `<button class="btn primary" data-again>${t('b.next')}</button>` : ''}<button class="btn" data-coll>${t('b.toColl')}</button></div>`;
      const neu = res.filter((r) => r.isNew).length;
      toast(neu ? t('b.newCards', { n: neu }) : t('b.onlyDupes'), true);
      $$('.card', body).forEach((c) => (c.onclick = () => cardDetail(c.dataset.id)));
      const a = $('[data-again]', body); if (a) a.onclick = open;
      $('[data-coll]', body).onclick = () => go(screenCollection);
      setTimeout(() => announce(fresh), 1400);
    };
    idle();
    app.appendChild(s);
  }

  // =====================================================================
  //  Tauschbörse
  // =====================================================================
  function screenTrade() {
    let give = null, wish = null;
    const state = { kind: 'all', type: 'all', season: 'all', q: '', owned: false };
    const minCost = Math.min(...Object.values(CFG.TRADE_COST));
    const s = el(`<div class="screen">${topbar(t('m.trade'))}
      <div class="trade"><div><h3>1 · ${t('tr.give')} <span class="muted" style="font-size:12px;font-family:var(--sans)">(${t('tr.from', { n: minCost })})</span></h3><div class="grid scroll" style="flex:1" data-give></div></div>
      <div><h3>2 · ${t('tr.wish')}</h3><div data-f></div><div class="grid scroll" style="flex:1" data-wish></div></div></div>
      <div class="tradebar"><div style="flex:1" data-sum></div><button class="btn gold" data-do disabled>${t('tr.do')}</button></div></div>`);
    bindBack(s);
    const tc = CFG.TRADE_COST;
    const renderGive = () => {
      const list = Object.values(B.CARDS).filter((c) => c.kind !== 'energy' && (save.collection[c.id] || 0) >= minCost).sort(sortCards);
      $('[data-give]', s).innerHTML = list.map((c) => `<div class="pickable ${give === c.id ? 'on' : ''}" data-id="${c.id}">${cardHTML(c.id, 's', { count: save.collection[c.id] })}</div>`).join('') || `<p class="muted" style="max-width:340px;text-align:center">${t('tr.none', { n: minCost })}</p>`;
      $$('[data-give] .pickable', s).forEach((p) => (p.onclick = () => { give = p.dataset.id; renderGive(); renderSum(); }));
    };
    const renderWish = () => {
      const list = filterCards(state).filter((c) => !c.promo).sort(sortCards);
      $('[data-wish]', s).innerHTML = list.map((c) => `<div class="pickable ${wish === c.id ? 'on' : ''}" data-id="${c.id}">${cardHTML(c.id, 's', { count: save.collection[c.id] || 0, unowned: !(save.collection[c.id] > 0) })}</div>`).join('');
      $$('[data-wish] .pickable', s).forEach((p) => (p.onclick = () => { wish = p.dataset.id; renderWish(); renderSum(); }));
    };
    const renderSum = () => {
      const btn = $('[data-do]', s);
      let txt = `<span class="muted">${t('tr.prices', { a: tc.basis, b: tc.stufe1, c: tc.stufe2, d: tc.bigbad })}</span>`;
      btn.disabled = true;
      if (give && wish) {
        const cost = B.tradeCost(B.CARDS[wish]);
        const have = save.collection[give] || 0;
        const ok = have >= cost && give !== wish;
        txt = `<b>${cost}× ${esc(cn(give))}</b> → <b>1× ${esc(cn(wish))}</b> <span class="muted">(${t('tr.have', { n: have })})</span>${ok ? '' : give === wish ? ` <span style="color:#ff9aaa">– ${t('tr.same')}</span>` : ` <span style="color:#ff9aaa">– ${t('tr.missing', { n: cost - have })}</span>`}`;
        btn.disabled = !ok;
      }
      $('[data-sum]', s).innerHTML = txt;
    };
    $('[data-do]', s).onclick = () => {
      const r = B.trade(save, give, wish);
      toast((r.ok ? '🔁 ' : '') + esc(tr(r.msg)), r.ok);
      if (r.ok) { announce(B.Ach.check(save, { type: 'trade' })); if ((save.collection[give] || 0) < minCost) give = null; renderGive(); renderWish(); renderSum(); }
    };
    $('[data-f]', s).appendChild(filterBar(state, renderWish));
    renderGive(); renderWish(); renderSum();
    app.appendChild(s);
  }

  // =====================================================================
  //  Regeln, Einstellungen, Versionen
  // =====================================================================
  function screenRules() {
    const T = B.TYPES;
    const table = `<table><tr><th>${t('r.type')}</th><th>${t('r.weakTo')}</th><th>${t('r.resTo')}</th></tr>${Object.keys(T).map((k) => `<tr><td>${T[k].icon} ${B.typeName(k)}</td><td>${T[B.WEAK[k]].icon} ${B.typeName(B.WEAK[k])}</td><td>${B.RES[k] ? T[B.RES[k]].icon + ' ' + B.typeName(B.RES[k]) : '–'}</td></tr>`).join('')}</table>`;
    const s = el(`<div class="screen">${topbar(t('m.rules'))}<div class="scroll" style="flex:1"><div class="prose">${t('r.body', { table, boosters: CFG.BOOSTERS_PER_DAY, a: CFG.TRADE_COST.basis, b: CFG.TRADE_COST.stufe1, c: CFG.TRADE_COST.stufe2, d: CFG.TRADE_COST.bigbad })}
      <p style="margin-top:20px"><button class="btn primary" data-tut>🎓 ${t('r.startTut')}</button></p></div></div></div>`);
    bindBack(s);
    $('[data-tut]', s).onclick = () => go(startTutorial);
    app.appendChild(s);
  }

  function screenVersions() {
    const s = el(`<div class="screen">${topbar('📜 ' + t('v.title'), `<span class="muted">${t('v.current', { v: B.VERSION })}</span>`)}<div class="scroll" style="flex:1"><div class="prose versions">${B.CHANGELOG.map((c, i) => `<div class="vitem ${i === 0 ? 'cur' : ''}"><div class="vhead"><span class="vtag">v${c.v}</span><span class="muted">${c.date}</span>${i === 0 ? `<span class="badge" style="background:var(--gold);color:#1a1205">${t('v.latest')}</span>` : ''}</div><ul>${c.items.map((it) => `<li>${esc(it[B.lang] || it.de)}</li>`).join('')}</ul></div>`).join('')}</div></div></div>`);
    bindBack(s);
    app.appendChild(s);
  }

  function screenSettings() {
    const s = el(`<div class="screen">${topbar(t('m.settings'))}<div class="scroll" style="flex:1"><div class="prose" style="display:flex;flex-direction:column;gap:16px">
      <div><b>🌐 ${t('s.lang')}</b><br><span class="chip ${B.lang === 'en' ? 'on' : ''}" data-lang="en">🇬🇧 English</span> <span class="chip ${B.lang === 'de' ? 'on' : ''}" data-lang="de">🇩🇪 Deutsch</span></div>
      <label>${t('s.name')}<br><input class="field" data-name value="${esc(save.playerName)}" style="width:260px;margin-top:4px"></label>
      <div><b>${t('s.sound')}</b><br>
        <label class="rowlbl"><input type="checkbox" data-mute ${save.settings.muted ? 'checked' : ''}> ${t('s.muteAll')}</label>
        <label class="rowlbl">${t('s.sfx')} <input type="range" min="0" max="100" data-sfx value="${Math.round((save.settings.sfxVol ?? 0.8) * 100)}"></label>
        <label class="rowlbl">${t('s.music')} <input type="range" min="0" max="100" data-mus value="${Math.round((save.settings.musicVol ?? 0.5) * 100)}"></label></div>
      <div>${t('s.aiSpeed')}<br><span class="chip ${save.settings.animSpeed !== 2 ? 'on' : ''}" data-sp="1">${t('s.slow')}</span> <span class="chip ${save.settings.animSpeed === 2 ? 'on' : ''}" data-sp="2">${t('s.fast')}</span></div>
      <div><b>${t('s.saveTitle')}</b><br><span class="muted">${t('s.saveHint')}</span><br>
        <button class="btn small" data-exp style="margin-top:6px">⬇️ ${t('s.export')}</button> <button class="btn small" data-imp>⬆️ ${t('s.import')}</button><input type="file" accept=".json,application/json" class="hidden" data-file></div>
      <div><b>${t('v.title')}</b><br><button class="btn small" data-news style="margin-top:6px">📜 ${t('m.version', { v: B.VERSION })}</button></div>
      <div><b>${t('s.restart')}</b><br><button class="btn small" data-reset style="margin-top:6px">🗑️ ${t('s.reset')}</button></div>
    </div></div></div>`);
    bindBack(s);
    $$('[data-lang]', s).forEach((c) => (c.onclick = () => { save.settings.lang = c.dataset.lang; B.setLang(c.dataset.lang); persist(); document.title = `Buffyverse TCG ${B.VERSION}`; go(screenSettings); }));
    $('[data-name]', s).oninput = (e) => { save.playerName = e.target.value.slice(0, 24) || 'Slayer'; persist(); };
    $('[data-news]', s).onclick = () => go(screenVersions);
    $('[data-mute]', s).onchange = (e) => setMuted(e.target.checked);
    const vol = () => { save.settings.sfxVol = $('[data-sfx]', s).value / 100; save.settings.musicVol = $('[data-mus]', s).value / 100; B.Sound.setVolumes(save.settings.sfxVol, save.settings.musicVol); persist(); };
    $('[data-sfx]', s).oninput = vol; $('[data-mus]', s).oninput = vol;
    $('[data-sfx]', s).onchange = () => B.Sound.play('hit', 60, false);
    $$('[data-sp]', s).forEach((c) => (c.onclick = () => { save.settings.animSpeed = +c.dataset.sp; persist(); go(screenSettings); }));
    $('[data-exp]', s).onclick = () => {
      const blob = new Blob([JSON.stringify(save, null, 1)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `buffyverse-tcg-save-${B.today()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    const file = $('[data-file]', s);
    $('[data-imp]', s).onclick = () => file.click();
    file.onchange = async () => {
      try { const data = JSON.parse(await file.files[0].text()); if (!data.collection || !data.decks) throw new Error(); localStorage.setItem('buffyverse_tcg_save_v1', JSON.stringify(data)); save = B.loadSave(); B.setLang(save.settings.lang || 'en'); toast(t('s.imported')); go(screenMenu); }
      catch (e) { toast(t('s.badFile')); }
    };
    $('[data-reset]', s).onclick = () => confirmBox(t('s.resetQ'), t('s.resetT'), t('s.reset'), () => { const lang = B.lang; save = B.newSave(); save.settings.lang = lang; persist(); go(screenMenu); });
    app.appendChild(s);
  }

  // =====================================================================
  //  Erfolge
  // =====================================================================
  const A_reward = (a) => B.Ach.rewardText(a.reward);
  function achListHTML(list) {
    if (!list || !list.length) return '';
    return `<div style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px"><b style="font-family:var(--serif);color:var(--gold)">🏆 ${t('a.new')}</b>${list.map((a) => `<div class="achmini"><span class="ai">${a.icon}</span><span><b>${esc(B.Ach.name(a))}</b><br><span class="muted">${esc(A_reward(a))}</span></span></div>`).join('')}</div>`;
  }
  function announce(list) {
    (list || []).forEach((a, i) => setTimeout(() => S.play('achievement'), i * 900));
    (list || []).forEach((a, i) => setTimeout(() => toast(`🏆 <b>${esc(B.Ach.name(a))}</b><br><span style="font-size:13px">${esc(A_reward(a))}${a.hidden ? ' · ' + t('a.secretFound') : ''}</span>`, true), i * 900));
  }
  function screenAchievements() {
    let filter = 'all';
    const L = B.Ach.LIST;
    const s = el(`<div class="screen">${topbar(t('m.ach'), '<span class="muted" data-sum></span>')}<div class="filters" data-f></div><div class="achgrid scroll" style="flex:1" data-grid></div></div>`);
    bindBack(s);
    const render = () => {
      const un = save.ach.unlocked;
      $('[data-sum]', s).innerHTML = t('a.sum', { n: Object.keys(un).length, max: L.length, b: save.bonusBoosters || 0 });
      $('[data-f]', s).innerHTML = [['all', t('a.all')], ['open', t('a.open')], ['done', t('a.done')], ['secret', t('a.secret')]].map(([k, l]) => `<span class="chip ${filter === k ? 'on' : ''}" data-k="${k}">${l}</span>`).join('');
      $$('[data-k]', s).forEach((c) => (c.onclick = () => { filter = c.dataset.k; render(); }));
      const list = L.filter((a) => filter === 'all' || (filter === 'open' && !un[a.id]) || (filter === 'done' && un[a.id]) || (filter === 'secret' && a.hidden));
      $('[data-grid]', s).innerHTML = list.map((a) => {
        const done = !!un[a.id], veiled = a.hidden && !done;
        const pr = !done && !veiled ? B.Ach.progress(save, a) : null;
        return `<div class="ach ${done ? 'done' : ''} ${veiled ? 'veiled' : ''}" data-id="${a.id}">
          <div class="ai">${veiled ? '🔒' : a.icon}</div>
          <div class="at"><b>${veiled ? t('a.secretTitle') : esc(B.Ach.name(a))}</b>${a.hidden && done ? ` <span class="chip" style="cursor:default;font-size:10px">${t('a.secretTag')}</span>` : ''}
          <div class="muted">${veiled ? t('a.veiled') : esc(B.Ach.desc(a))}</div>
          ${pr ? `<div class="prog"><i style="width:${(pr[0] / pr[1]) * 100}%"></i></div><div class="muted" style="font-size:11px">${pr[0].toLocaleString(B.lang)} / ${pr[1].toLocaleString(B.lang)}</div>` : ''}
          <div class="rw">${t('a.reward')}: ${veiled ? '???' : esc(A_reward(a))}${done ? ` · ✔ ${un[a.id]}` : ''}</div></div></div>`;
      }).join('');
      $$('.ach', s).forEach((tl) => (tl.onclick = () => {
        const a = L.find((x) => x.id === tl.dataset.id);
        if (a.reward.card && (!a.hidden || un[a.id])) cardDetail(a.reward.card);
      }));
    };
    render();
    app.appendChild(s);
  }

  // =====================================================================
  //  Start
  // =====================================================================
  const soundBtn = el('<button id="soundbtn"></button>');
  document.body.appendChild(soundBtn);
  function setMuted(m) {
    save.settings.muted = !!m; persist();
    B.Sound.setMuted(save.settings.muted);
    soundBtn.textContent = save.settings.muted ? '🔇' : '🔊';
    soundBtn.title = t('s.muteTip');
    soundBtn.classList.toggle('off', save.settings.muted);
    const cb = $('[data-mute]'); if (cb) cb.checked = save.settings.muted;
  }
  soundBtn.onclick = () => { setMuted(!save.settings.muted); if (!save.settings.muted) B.Sound.play('click'); };
  document.addEventListener('keydown', (e) => { if ((e.key === 'm' || e.key === 'M') && !/input|textarea/i.test(e.target.tagName)) soundBtn.onclick(); });
  B.Sound.setVolumes(save.settings.sfxVol ?? 0.8, save.settings.musicVol ?? 0.5);
  setMuted(!!save.settings.muted);
  document.addEventListener('click', (e) => { if (e.target.closest('#soundbtn')) return; if (e.target.closest('.btn, .chip, .opt, .pickable, .verlink, .chapter')) B.Sound.play('click'); }, true);
  document.title = `Buffyverse TCG ${B.VERSION}`;

  function showChangelog() {
    const c = B.CHANGELOG[0];
    modal({ title: `📜 ${t('v.whatsNew')} · v${B.VERSION}`, body: `<div class="chlog"><ul>${c.items.map((i) => `<li>${esc(i[B.lang] || i.de)}</li>`).join('')}</ul></div>`, buttons: [{ label: t('v.all'), onClick: () => go(screenVersions) }, { label: t('v.go'), cls: 'primary' }] });
  }

  B.Art.init().then(() => {
    go(screenMenu);
    if (save.lastVersion !== B.VERSION) { const had = !!save.lastVersion; save.lastVersion = B.VERSION; persist(); if (had) setTimeout(showChangelog, 400); }
    const f = B.Ach.check(save, { type: 'startup' }); if (f.length) announce(f);
  });
  window.__btcg = { get save() { return save; }, GM, go, startGame, Tutorial, renderBoard: () => renderBoard(), pump: () => pump(), screens: { screenMenu, screenCollection, screenDecks, screenBooster, screenTrade, screenRules, screenPlaySetup, screenSettings, screenAchievements, screenVersions, screenStory, startTutorial } };
})();
