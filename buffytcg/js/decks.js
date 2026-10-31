/* Buffyverse TCG – Starter- und KI-Decks, Sammlung, Booster, Tausch */
(function (G) {
  const B = G.BTCG;
  const CFG = B.CONFIG;

  function mkDeck(core, energy) {
    const d = Object.assign({}, core);
    const used = Object.values(core).reduce((a, b) => a + b, 0);
    let rest = CFG.DECK_SIZE - used;
    const keys = Object.keys(energy);
    const tot = keys.reduce((a, k) => a + energy[k], 0);
    keys.forEach((k, i) => {
      const n = i === keys.length - 1 ? rest : Math.round(((CFG.DECK_SIZE - used) * energy[k]) / tot);
      d['e_' + k] = (d['e_' + k] || 0) + n;
      rest -= n;
    });
    return d;
  }

  B.PREBUILT = [
    { id: 'scoobies', name: 'Die Scooby-Gang', starter: true, season: 'Starter', desc: 'Buffy, Willow, Xander & Giles – Kampf und Magie.',
      cards: mkDeck({ buffy1: 4, buffy2: 3, buffy3: 1, willow1: 3, willow2: 2, willow4: 1, xander1: 2, xander2: 1, giles1: 2, tara: 1,
        giles_training: 2, library: 2, patrol: 1, joyce_cocoa: 1, magic_box: 2, mr_pointy: 2, switch: 2, watcher_diary: 2, crossbow: 1, herbs: 1, restfield: 1 }, { K: 12, M: 8, W: 3 }) },
    { id: 'nacht', name: 'Kinder der Nacht', starter: true, season: 'Starter', desc: 'Vampire unter Führung des Meisters.',
      cards: mkDeck({ vampgen: 4, spike1: 3, angel1: 2, angelus: 2, darla: 2, drusilla: 2, harmony: 2, luke: 2, master: 1,
        spike_crypt: 2, library: 2, patrol: 1, council: 1, switch: 2, watcher_diary: 2, gem_amara: 1, leather_coat: 2, shame: 2, herbs: 1, blood_bags: 1 }, { V: 20, K: 3 }) },
    { id: 's1', name: 'Staffel 1 – Der Meister', season: '1', desc: 'Der Meister und seine Gefolgsleute.',
      cards: mkDeck({ master: 2, vampgen: 4, luke: 3, darla: 2, collin: 3, moloch: 2, missfrench: 2, catherine: 2, harmony: 2,
        library: 2, patrol: 2, watcher_diary: 3, switch: 1, blood_bags: 2, shame: 2, herbs: 1, leather_coat: 1, council: 1 }, { V: 20, M: 3 }) },
    { id: 's2', name: 'Staffel 2 – Angelus & Drusilla', season: '2', desc: 'Angelus ohne Seele, Dru und der Richter.',
      cards: mkDeck({ angel1: 4, angelus: 3, drusilla: 3, spike1: 2, judge: 2, eyghon: 2, ted: 2, vampgen: 3,
        spike_crypt: 2, patrol: 2, library: 2, council: 1, crawford: 1, shame: 1, leather_coat: 2, watcher_diary: 2, blood_bags: 2 }, { V: 19, K: 2, W: 3 }) },
    { id: 's3', name: 'Staffel 3 – Die Abschlussfeier', season: '3', desc: 'Der Bürgermeister steigt auf, Faith wechselt die Seiten.',
      cards: mkDeck({ mayor1: 4, mayor2: 2, mrtrick: 3, faith1: 3, faith2: 2, vampwillow: 2, kakistos: 2, balthazar: 1, snyder: 1,
        giles_training: 2, library: 2, patrol: 1, watcher_diary: 2, switch: 2, hellmouth: 2, amulet: 2, old_books: 1, herbs: 1 }, { V: 13, W: 7, K: 5 }) },
    { id: 's4', name: 'Staffel 4 – Die Initiative', season: '4', desc: 'Adam und die Soldaten aus Labor 314.',
      cards: mkDeck({ adam: 2, riley: 3, walsh: 2, forrest: 4, graham: 4, gentlemen: 2, veruca: 2, xander3: 1,
        initiative_brief: 2, lab314: 3, library: 2, patrol: 1, switch: 2, rocket_launcher: 2, leather_coat: 1, armory: 2 }, { K: 15, W: 6, V: 4 }) },
    { id: 's5', name: 'Staffel 5 – Glory', season: '5', desc: 'Ben verwandelt sich in die Höllengöttin.',
      cards: mkDeck({ ben: 4, glory: 3, minions: 4, doc: 2, dracula: 2, queller: 3, knights: 2,
        giles_training: 2, willow_hack: 1, library: 2, patrol: 2, watcher_diary: 2, hellmouth: 2, blood_bags: 2, switch: 1, amulet: 1 }, { V: 18, W: 4, K: 3 }) },
    { id: 's6', name: 'Staffel 6 – Dark Willow & das Trio', season: '6', desc: 'Magie außer Kontrolle.',
      cards: mkDeck({ willow1: 4, willow2: 3, willow3: 2, warren1: 3, warren2: 2, jonathan: 2, andrew: 2, rack: 2, sweet: 1,
        giles_training: 2, library: 2, council: 1, patrol: 1, spellbook: 2, magic_box: 2, herbs: 2, magic_shop_stadium: 2 }, { M: 17, W: 6, V: 2 }) },
    { id: 's7', name: 'Staffel 7 – Die Erste', season: '7', desc: 'Das Urböse, Caleb und die Übervampire.',
      cards: mkDeck({ first: 2, caleb: 2, turokhan: 3, bringer: 4, vampgen: 3, andrew: 2, halfrek: 2, dhoffryn: 1, drusilla: 1,
        library: 2, patrol: 2, council: 1, watcher_diary: 2, switch: 2, hellmouth: 2, leather_coat: 2, blood_bags: 2 }, { V: 20, K: 3, W: 2 }) },
    { id: 'slayers', name: 'Die Jägerinnen', season: '2–7', desc: 'Buffy, Faith, Kendra und die Potentiellen.',
      cards: mkDeck({ buffy1: 4, buffy2: 3, buffy3: 2, kendra: 2, faith1: 2, potential: 3, kennedy: 2, wood: 1, firstslayer: 1,
        giles_training: 2, library: 2, patrol: 1, switch: 2, scythe: 1, mr_pointy: 2, armory: 2, restfield: 2, joyce_cocoa: 1 }, { K: 23, W: 2 }) },
  ];

  // ---------- Speicherstand ----------
  const KEY = 'buffyverse_tcg_save_v1';
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  B.today = today;

  B.defaultStats = () => ({
    played: 0, won: 0, byLevel: { beginner: [0, 0], erfahren: [0, 0], profi: [0, 0] },
    kos: 0, bigBadKos: 0, damage: 0, maxHit: 0, weakHits: 0, evolutions: 0, stage2: 0, supporters: 0, stadiums: 0, tools: 0,
    abilities: 0, retreats: 0, statuses: 0, boosters: 0, trades: 0, decksSaved: 0, images: 0, streak: 0, bestStreak: 0,
    winsVs: {}, gamesByDay: {}, darkWillow: false, gilesRipper: false,
  });
  B.newSave = function () {
    const coll = {};
    for (const id of ['scoobies', 'nacht']) {
      const d = B.PREBUILT.find((x) => x.id === id);
      for (const [cid, n] of Object.entries(d.cards)) if (!cid.startsWith('e_')) coll[cid] = Math.max(coll[cid] || 0, 0) + n;
    }
    return {
      version: 1,
      playerName: B.lang === 'de' ? 'Jägerin' : 'Slayer',
      collection: coll,
      seen: Object.keys(coll),
      decks: [
        { id: 'd1', name: B.t('deck.scoobies.n'), cards: Object.assign({}, B.PREBUILT[0].cards) },
        { id: 'd2', name: B.t('deck.nacht.n'), cards: Object.assign({}, B.PREBUILT[1].cards) },
      ],
      activeDeck: 'd1',
      booster: { date: today(), opened: 0 },
      stats: B.defaultStats(),
      ach: { unlocked: {} },
      bonusBoosters: 0,
      story: { cleared: {} },
      tutorialDone: false,
      settings: { level: 'erfahren', animSpeed: 1, sound: true, lang: 'en', mode: 'ai' },
    };
  };
  B.loadSave = function () {
    try {
      const raw = G.localStorage && G.localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.collection) {
          const merged = Object.assign(B.newSave(), s);
          merged.stats = Object.assign(B.defaultStats(), s.stats || {});
          merged.ach = Object.assign({ unlocked: {} }, s.ach || {});
          merged.bonusBoosters = s.bonusBoosters || 0;
          merged.story = Object.assign({ cleared: {} }, s.story || {});
          merged.settings = Object.assign(B.newSave().settings, s.settings || {});
          return merged;
        }
      }
    } catch (e) { /* ignorieren */ }
    return B.newSave();
  };
  B.storeSave = function (save) {
    try { G.localStorage && G.localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* ignorieren */ }
  };
  B.owned = (save, id) => (id.startsWith('e_') ? Infinity : save.collection[id] || 0);

  // ---------- Booster ----------
  B.boostersLeft = function (save) {
    if (save.booster.date !== today()) save.booster = { date: today(), opened: 0 };
    return Math.max(0, CFG.BOOSTERS_PER_DAY - save.booster.opened);
  };
  B.totalBoosters = (save) => B.boostersLeft(save) + (save.bonusBoosters || 0);
  B.openBooster = function (save) {
    const daily = B.boostersLeft(save) > 0;
    if (!daily && !(save.bonusBoosters > 0)) return null;
    const pool = { C: [], U: [], R: [], L: [] };
    for (const c of Object.values(B.CARDS)) if (pool[c.rarity]) pool[c.rarity].push(c.id);
    const pick = (r) => pool[r][Math.floor(Math.random() * pool[r].length)];
    const cards = [];
    for (let i = 0; i < 6; i++) cards.push(pick('C'));
    for (let i = 0; i < 3; i++) cards.push(pick('U'));
    cards.push(Math.random() < 0.22 ? pick('L') : pick('R'));
    const result = cards.map((id) => ({ id, isNew: !(save.collection[id] > 0) }));
    for (const id of cards) save.collection[id] = (save.collection[id] || 0) + 1;
    if (daily) save.booster.opened++; else save.bonusBoosters--;
    save.stats.boosters = (save.stats.boosters || 0) + 1;
    B.storeSave(save);
    return result;
  };

  // ---------- Tauschbörse ----------
  B.trade = function (save, giveId, wishId) {
    const wish = B.CARDS[wishId];
    const cost = B.tradeCost(wish);
    const M = B.Engine.M;
    if ((save.collection[giveId] || 0) < cost) return { ok: false, msg: M('tr.needN', { n: cost }) };
    if (giveId === wishId) return { ok: false, msg: M('tr.pickOther') };
    if (wish.promo) return { ok: false, msg: M('tr.promo') };
    save.collection[giveId] -= cost;
    save.collection[wishId] = (save.collection[wishId] || 0) + 1;
    save.stats.trades = (save.stats.trades || 0) + 1;
    B.storeSave(save);
    return { ok: true, msg: B.Engine.M('tr.ok', { n: cost, a: '@' + giveId, b: '@' + wishId }) };
  };

  // Prüft, ob ein gespeichertes Deck mit der aktuellen Sammlung spielbar ist
  B.deckProblems = function (save, deck) {
    const errs = B.Engine.validateDeck(deck.cards);
    for (const [id, n] of Object.entries(deck.cards)) {
      if (!B.CARDS[id]) continue;
      if (n > B.owned(save, id)) errs.push(B.Engine.M('err.owned', { n: B.owned(save, id), c: '@' + id, d: n }));
    }
    return errs;
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
