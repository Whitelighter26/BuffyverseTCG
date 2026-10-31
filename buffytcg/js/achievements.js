/* Buffyverse TCG – Erfolge: 50 sichtbare + 20 geheime
   Belohnung: Booster (sofort als Bonus-Booster gutgeschrieben) oder eine exklusive Erfolgs-Karte. */
(function (G) {
  const B = G.BTCG;
  const A = (B.Ach = {});
  const SEASONS = { s1: 'Der Meister', s2: 'Angelus & Drusilla', s3: 'Die Abschlussfeier', s4: 'Die Initiative', s5: 'Glory', s6: 'Dark Willow & das Trio', s7: 'Die Erste' };

  const uniqueOwned = (save) => Object.values(B.CARDS).filter((c) => c.kind !== 'energy' && !c.promo && save.collection[c.id] > 0).length;
  const boosterPool = () => Object.values(B.CARDS).filter((c) => c.kind !== 'energy' && !c.promo).length;
  const g = (ctx) => (ctx && ctx.game) || null;
  const won = (ctx) => g(ctx) && g(ctx).won;
  const koOf = (ctx, test) => g(ctx) && g(ctx).kos.some(test);

  // reward: { booster: n } | { card: id }
  const L = [];
  const add = (id, icon, name, desc, reward, test, progress, hidden) => L.push({ id, icon, name, desc, reward, test, progress, hidden: !!hidden });
  const cnt = (key, n) => [(st) => (st[key] || 0) >= n, (st) => [Math.min(st[key] || 0, n), n]];

  // ---------- Spielen & Siegen ----------
  add('play1', '🌙', 'Willkommen auf dem Höllenschlund', 'Spiele dein erstes Spiel.', { booster: 1 }, ...cnt('played', 1));
  add('win1', '⚔️', 'Erste Patrouille', 'Gewinne dein erstes Spiel.', { booster: 1 }, ...cnt('won', 1));
  add('win5', '🔦', 'Nachtschicht', 'Gewinne 5 Spiele.', { booster: 1 }, ...cnt('won', 5));
  add('win25', '🪵', 'Jägerin im Dauereinsatz', 'Gewinne 25 Spiele.', { booster: 2 }, ...cnt('won', 25));
  add('win50', '👑', 'Die Auserwählte', 'Gewinne 50 Spiele.', { card: 'p_prom_buffy' }, ...cnt('won', 50));
  add('play50', '🎸', 'Stammgast im Bronze', 'Spiele 50 Partien.', { booster: 2 }, ...cnt('played', 50));
  add('lvBeg', '📖', 'Training mit Giles', 'Besiege die KI auf „Beginner“.', { booster: 1 }, (st) => st.byLevel.beginner[1] >= 1);
  add('lvErf', '🕯️', 'Stake-Out', 'Besiege die KI auf „Erfahren“.', { booster: 1 }, (st) => st.byLevel.erfahren[1] >= 1);
  add('lvPro', '🔥', 'Gegen das Böse bestehen', 'Besiege die KI auf „Profi“.', { booster: 2 }, (st) => st.byLevel.profi[1] >= 1);
  add('lvPro10', '🌋', 'Apokalypse? Schon wieder.', 'Gewinne 10 Spiele auf „Profi“.', { card: 'p_slayer_handbook' }, (st) => st.byLevel.profi[1] >= 10, (st) => [Math.min(st.byLevel.profi[1], 10), 10]);
  add('streak3', '🏃‍♀️', 'Lauf der Jägerin', 'Gewinne 3 Spiele in Folge.', { booster: 1 }, (st) => st.bestStreak >= 3, (st) => [Math.min(st.bestStreak, 3), 3]);
  add('streak7', '✨', 'Sieben Staffeln, sieben Siege', 'Gewinne 7 Spiele in Folge.', { card: 'p_slayer_army' }, (st) => st.bestStreak >= 7, (st) => [Math.min(st.bestStreak, 7), 7]);
  Object.entries(SEASONS).forEach(([k, nm], i) => add('season_' + k, ['👴', '💔', '🎓', '🎖️', '🗝️', '🔮', '👁️'][i], `Staffel ${i + 1} bezwungen`, `Gewinne gegen das Deck „Staffel ${i + 1} – ${nm}“.`, { booster: i === 6 ? 2 : 1 }, (st) => (st.winsVs[k] || 0) >= 1));
  add('allSeasons', '🕳️', 'Sieben Big Bads', 'Gewinne gegen alle sieben Staffel-Decks.', { card: 'p_crater' }, (st) => Object.keys(SEASONS).every((k) => st.winsVs[k] > 0), (st) => [Object.keys(SEASONS).filter((k) => st.winsVs[k] > 0).length, 7]);

  // ---------- Kampf ----------
  add('ko1', '🎯', 'Pfahl getroffen', 'Setze einen gegnerischen Charakter K.O.', { booster: 1 }, ...cnt('kos', 1));
  add('ko100', '🧹', 'Staubsauger von Sunnydale', 'Setze insgesamt 100 Gegner K.O.', { booster: 2 }, ...cnt('kos', 100));
  add('bb1', '😈', 'Big Bad? Big Problem.', 'Setze einen Big Bad K.O.', { booster: 1 }, ...cnt('bigBadKos', 1));
  add('bb10', '🔒', 'Höllenschlund versiegelt', 'Setze insgesamt 10 Big Bads K.O.', { card: 'p_orb' }, ...cnt('bigBadKos', 10));
  add('hit100', '💥', 'Volle Wucht', 'Verursache mit einem Angriff 100 Schaden oder mehr.', { booster: 1 }, (st) => st.maxHit >= 100, (st) => [Math.min(st.maxHit, 100), 100]);
  add('hit200', '☄️', 'Verheerend', 'Verursache mit einem Angriff 200 Schaden oder mehr.', { booster: 1 }, (st) => st.maxHit >= 200, (st) => [Math.min(st.maxHit, 200), 200]);
  add('weak10', '🎯', 'Achillesferse', 'Triff 10-mal eine Schwäche.', { booster: 1 }, ...cnt('weakHits', 10));
  add('dmg10k', '🪓', 'Zehntausend Pfähle', 'Verursache insgesamt 10.000 Schaden.', { booster: 2 }, ...cnt('damage', 10000));
  add('perfect', '🛡️', 'Ohne einen Kratzer', 'Gewinne, ohne einen eigenen Charakter zu verlieren.', { booster: 2 }, (st, ctx) => won(ctx) && g(ctx).lost === 0);
  add('fast', '🌅', 'Vor Sonnenaufgang', 'Gewinne ein Spiel bis Zug 12.', { booster: 1 }, (st, ctx) => won(ctx) && g(ctx).turns <= 12);
  add('evo1', '🌱', 'Wachstumsschub', 'Entwickle einen Charakter.', { booster: 1 }, ...cnt('evolutions', 1));
  add('stage2', '⛰️', 'Ganz nach oben', 'Entwickle einen Charakter auf Stufe 2.', { booster: 1 }, ...cnt('stage2', 1));
  add('evo50', '🦋', 'Evolution statt Revolution', 'Entwickle insgesamt 50 Charaktere.', { booster: 2 }, ...cnt('evolutions', 50));
  add('darkWillow', '🖤', 'Gelangweilt. Jetzt.', 'Entwickle Willow zu Dark Willow.', { booster: 2 }, (st) => st.darkWillow);
  add('sup50', '🍩', 'Die Scooby-Gang hilft', 'Spiele 50 Unterstützer.', { booster: 1 }, ...cnt('supporters', 50));
  add('stad10', '🏟️', 'Lage, Lage, Lage', 'Spiele 10 Stadien.', { booster: 1 }, ...cnt('stadiums', 10));
  add('tool20', '🧥', 'Gut ausgerüstet', 'Lege 20 Ausrüstungen an.', { booster: 1 }, ...cnt('tools', 20));
  add('abil30', '⚡', 'Kräfte entfesselt', 'Nutze 30 Fähigkeiten.', { booster: 1 }, ...cnt('abilities', 30));
  add('retreat25', '↩️', 'Taktischer Rückzug', 'Ziehe dich 25-mal zurück.', { booster: 1 }, ...cnt('retreats', 25));
  add('status25', '💤', 'Schlaf gut, Dämon', 'Verursache 25 Zustände.', { booster: 1 }, ...cnt('statuses', 25));

  // ---------- Sammeln ----------
  add('boost1', '🎁', 'Frische Ware', 'Öffne deinen ersten Booster.', { booster: 1 }, ...cnt('boosters', 1));
  add('boost25', '🛍️', 'Stammkundin im Zauberladen', 'Öffne 25 Booster.', { booster: 2 }, ...cnt('boosters', 25));
  add('boost100', '💰', 'Anyas Lieblingskundin', 'Öffne 100 Booster.', { card: 'p_mr_gordo' }, ...cnt('boosters', 100));
  add('coll50', '🗄️', 'Wächter-Archiv', 'Sammle 50 verschiedene Karten.', { booster: 1 }, (st, ctx, save) => uniqueOwned(save) >= 50, (st, save) => [Math.min(uniqueOwned(save), 50), 50]);
  add('coll100', '🏛️', 'Bibliothek von Sunnydale', 'Sammle 100 verschiedene Karten.', { booster: 2 }, (st, ctx, save) => uniqueOwned(save) >= 100, (st, save) => [Math.min(uniqueOwned(save), 100), 100]);
  add('collAll', '📜', 'Vollständige Chronik', 'Sammle alle Karten aus den Boostern.', { card: 'p_wish' }, (st, ctx, save) => uniqueOwned(save) >= boosterPool(), (st, save) => [uniqueOwned(save), boosterPool()]);
  add('legend', '🌟', 'Legendär!', 'Besitze eine legendäre Karte.', { booster: 1 }, (st, ctx, save) => Object.values(B.CARDS).some((c) => c.rarity === 'L' && save.collection[c.id] > 0));
  add('trade1', '🔁', 'Fairer Handel', 'Tausche zum ersten Mal in der Tauschbörse.', { booster: 1 }, ...cnt('trades', 1));
  add('deck1', '🗃️', 'Eigene Strategie', 'Speichere ein Deck im Deck-Editor.', { booster: 1 }, ...cnt('decksSaved', 1));
  add('image1', '🖼️', 'Künstlerin', 'Hinterlege ein eigenes Bild auf einer Karte.', { booster: 1 }, ...cnt('images', 1));

  // ---------- Geheim ----------
  const H = (id, icon, name, desc, reward, test) => add(id, icon, name, desc, reward, test, null, true);
  H('h_sisters', '💚', 'Schwesternliebe', 'Gewinne, während Dawn und Buffy gemeinsam in deinem Spiel sind.', { card: 'p_dawn_heir' }, (st, ctx) => won(ctx) && g(ctx).dawnBuffy);
  H('h_chip', '📟', 'Chip-Frust', 'Spike konnte wegen des Chips nicht angreifen.', { card: 'p_william' }, (st, ctx) => g(ctx) && g(ctx).chip);
  H('h_bunnies', '🐰', 'Hasen! Hasen!', 'Lass Anya mit „Hasen-Panik“ auf die Bank flüchten.', { card: 'p_anya_bunny' }, (st, ctx) => g(ctx) && g(ctx).bunny);
  H('h_heads', '🍀', 'Glückspilz', 'Wirf 5-mal in Folge Kopf.', { booster: 2 }, (st, ctx) => g(ctx) && g(ctx).maxHeads >= 5);
  H('h_tails', '🌧️', 'Pechvogel', 'Wirf 5-mal in Folge Zahl.', { booster: 2 }, (st, ctx) => g(ctx) && g(ctx).maxTails >= 5);
  H('h_prophecy', '⚰️', 'Prophezeiung erfüllt', 'Verliere gegen „Staffel 1 – Der Meister“.', { booster: 1 }, (st, ctx) => g(ctx) && !g(ctx).won && g(ctx).opp === 's1');
  H('h_dracula', '🧛', 'Was willst du von mir?', 'Setze Dracula K.O.', { card: 'p_xander_renfield' }, (st, ctx) => koOf(ctx, (k) => k.victim === 'dracula'));
  H('h_musical', '🎤', 'Once More, with Feeling', 'Setze Sweet K.O.', { card: 'p_musical' }, (st, ctx) => koOf(ctx, (k) => k.victim === 'sweet'));
  H('h_comeback', '🔥', 'Gegen alle Wahrscheinlichkeit', 'Gewinne nach einem 0:2-Rückstand.', { booster: 2 }, (st, ctx) => won(ctx) && g(ctx).wasBehind);
  H('h_wishverse', '🪞', 'Die Wunsch-Welt', 'Gewinne mit Vampir-Willow im Spiel.', { card: 'p_vamp_xander' }, (st, ctx) => won(ctx) && g(ctx).vampWillow);
  H('h_zeppo', '🚗', 'Der Zeppo', 'Setze mit einer Xander-Karte einen Gegner K.O.', { card: 'p_xander_hyena' }, (st, ctx) => koOf(ctx, (k) => k.attacker && k.attacker.startsWith('xander')));
  H('h_ripper', '🎩', 'Ein neuer Mann', 'Entwickle Giles zu Ripper.', { card: 'p_giles_fyarl' }, (st) => st.gilesRipper);
  H('h_double', '🍔', 'Doppelschicht', 'Spiele 5 Partien an einem Tag.', { card: 'p_doublemeat' }, (st) => Object.values(st.gamesByDay).some((n) => n >= 5));
  H('h_robot', '🤖', 'Maschinenherz', 'Setze Ted oder Adam K.O.', { card: 'p_buffybot' }, (st, ctx) => koOf(ctx, (k) => k.victim === 'ted' || k.victim === 'adam'));
  H('h_candy', '🍬', 'Band Candy', 'Setze mit Joyce einen Gegner K.O.', { card: 'p_joyce_candy' }, (st, ctx) => koOf(ctx, (k) => k.attacker && /joyce/.test(k.attacker)));
  H('h_whoareyou', '🎭', 'Wer bist du?', 'Erziele den letzten K.O. eines Sieges mit Faith.', { card: 'p_faith_swap' }, (st, ctx) => won(ctx) && g(ctx).lastKoBy && /faith/.test(g(ctx).lastKoBy));
  H('h_graduation', '🐍', 'Abschlussfeier', 'Setze den aufgestiegenen Bürgermeister K.O.', { card: 'p_umbrella' }, (st, ctx) => koOf(ctx, (k) => k.victim === 'mayor2'));
  H('h_midnight', '🕛', 'Geisterstunde', 'Öffne einen Booster zwischen Mitternacht und 1 Uhr.', { booster: 2 }, (st, ctx) => ctx && ctx.type === 'booster' && new Date().getHours() === 0);
  H('h_halloween', '🎃', 'Halloween in Sunnydale', 'Spiele am 31. Oktober eine Partie.', { booster: 3 }, (st, ctx) => g(ctx) && new Date().getMonth() === 9 && new Date().getDate() === 31);
  H('h_first', '👁️', 'Die Erste wird die Letzte sein', 'Setze Die Erste K.O.', { booster: 3 }, (st, ctx) => koOf(ctx, (k) => k.victim === 'first'));

  A.LIST = L;
  A.SEASONS = SEASONS;

  A.rewardText = (r) => (r.booster ? '🎁 ' + B.t('a.booster', { n: r.booster }) : '✦ ' + B.cn(r.card));
  const EN = {
    play1: ['Welcome to the Hellmouth', 'Play your first game.'], win1: ['First Patrol', 'Win your first game.'], win5: ['Night Shift', 'Win 5 games.'],
    win25: ['Slayer on Duty', 'Win 25 games.'], win50: ['The Chosen One', 'Win 50 games.'], play50: ['Regular at the Bronze', 'Play 50 games.'],
    lvBeg: ['Training with Giles', 'Beat the AI on “Beginner”.'], lvErf: ['Stake-Out', 'Beat the AI on “Experienced”.'], lvPro: ['Standing Against Evil', 'Beat the AI on “Pro”.'],
    lvPro10: ['Apocalypse? Again?', 'Win 10 games on “Pro”.'], streak3: ['Slayer on a Roll', 'Win 3 games in a row.'], streak7: ['Seven Seasons, Seven Wins', 'Win 7 games in a row.'],
    allSeasons: ['Seven Big Bads', 'Win against all seven season decks.'],
    ko1: ['Stake Hits Home', 'Knock out an opposing character.'], ko100: ['The Sunnydale Vacuum', 'Knock out 100 opponents in total.'], bb1: ['Big Bad? Big Problem.', 'Knock out a Big Bad.'],
    bb10: ['Hellmouth Sealed', 'Knock out 10 Big Bads in total.'], hit100: ['Full Force', 'Deal 100 or more damage with one attack.'], hit200: ['Devastating', 'Deal 200 or more damage with one attack.'],
    weak10: ["Achilles' Heel", 'Hit a Weakness 10 times.'], dmg10k: ['Ten Thousand Stakes', 'Deal 10,000 damage in total.'], perfect: ['Without a Scratch', 'Win without losing a single character.'],
    fast: ['Before Sunrise', 'Win a game by turn 12.'], evo1: ['Growth Spurt', 'Evolve a character.'], stage2: ['All the Way Up', 'Evolve a character to Stage 2.'],
    evo50: ['Evolution, Not Revolution', 'Evolve 50 characters in total.'], darkWillow: ['Bored Now.', 'Evolve Willow into Dark Willow.'], sup50: ['The Scooby Gang Helps', 'Play 50 Supporters.'],
    stad10: ['Location, Location', 'Play 10 Stadiums.'], tool20: ['Well Equipped', 'Attach 20 Tools.'], abil30: ['Powers Unleashed', 'Use 30 abilities.'], retreat25: ['Tactical Retreat', 'Retreat 25 times.'],
    status25: ['Sleep Tight, Demon', 'Inflict 25 Special Conditions.'], boost1: ['Fresh Stock', 'Open your first booster.'], boost25: ['Magic Box Regular', 'Open 25 boosters.'],
    boost100: ["Anya's Favourite Customer", 'Open 100 boosters.'], coll50: ["Watcher's Archive", 'Collect 50 different cards.'], coll100: ['Sunnydale Library', 'Collect 100 different cards.'],
    collAll: ['Complete Chronicle', 'Collect every card from the boosters.'], legend: ['Legendary!', 'Own a legendary card.'], trade1: ['Fair Trade', 'Trade at the Trading Post for the first time.'],
    deck1: ['Your Own Strategy', 'Save a deck in the deck editor.'], image1: ['Artist', 'Add your own image to a card.'],
    h_sisters: ['Sisterly Love', 'Win a game in which Dawn and Buffy were in play together.'], h_chip: ['Chip Frustration', "Spike couldn't attack because of the chip."],
    h_bunnies: ['Bunnies! Bunnies!', 'Let Anya flee to the Bench with “Bunny Panic”.'], h_heads: ['Lucky Duck', 'Flip heads 5 times in a row.'], h_tails: ['Bad Luck Charm', 'Flip tails 5 times in a row.'],
    h_prophecy: ['Prophecy Fulfilled', 'Lose against “Season 1 – The Master”.'], h_dracula: ['What Do You Want From Me?', 'Knock out Dracula.'], h_musical: ['Once More, with Feeling', 'Knock out Sweet.'],
    h_comeback: ['Against All Odds', 'Win after being down 0:2.'], h_wishverse: ['The Wishverse', 'Win with Vampire Willow in play.'], h_zeppo: ['The Zeppo', 'Knock out an opponent with a Xander card.'],
    h_ripper: ['A New Man', 'Evolve Giles into Ripper.'], h_double: ['Double Shift', 'Play 5 games in one day.'], h_robot: ['Mechanical Heart', 'Knock out Ted or Adam.'],
    h_candy: ['Band Candy', 'Knock out an opponent with Joyce.'], h_whoareyou: ['Who Are You?', 'Score the final knockout of a victory with Faith.'], h_graduation: ['Graduation Day', 'Knock out the Ascended Mayor.'],
    h_midnight: ['Witching Hour', 'Open a booster between midnight and 1 a.m.'], h_halloween: ['Halloween in Sunnydale', 'Play a game on October 31st.'], h_first: ['The First Shall Be Last', 'Knock out The First.'],
  };
  const SEASON_EN = { s1: 'The Master', s2: 'Angelus & Drusilla', s3: 'Graduation Day', s4: 'The Initiative', s5: 'Glory', s6: 'Dark Willow & the Trio', s7: 'The First' };
  A.name = (a) => {
    if (B.lang !== 'en') return a.name;
    if (a.id.startsWith('season_')) return `Season ${a.id.slice(8)} conquered`;
    return (EN[a.id] || [a.name])[0];
  };
  A.desc = (a) => {
    if (B.lang !== 'en') return a.desc;
    if (a.id.startsWith('season_')) { const k = a.id.slice(7); return `Win against the deck “Season ${k.slice(1)} – ${SEASON_EN[k]}”.`; }
    return (EN[a.id] || [0, a.desc])[1];
  };

  // Belohnung gutschreiben
  function grant(save, ach) {
    if (ach.reward.booster) save.bonusBoosters = (save.bonusBoosters || 0) + ach.reward.booster;
    if (ach.reward.card) save.collection[ach.reward.card] = (save.collection[ach.reward.card] || 0) + 1;
  }

  // Prüft alle noch offenen Erfolge; gibt die neu freigeschalteten zurück
  A.check = function (save, ctx) {
    const fresh = [];
    // Mehrere Durchläufe, weil Belohnungen (Karten) neue Sammel-Erfolge auslösen können
    for (let pass = 0; pass < 3; pass++) {
      let any = false;
      for (const ach of L) {
        if (save.ach.unlocked[ach.id]) continue;
        let ok = false;
        try { ok = !!ach.test(save.stats, ctx, save); } catch (e) { ok = false; }
        if (ok) { save.ach.unlocked[ach.id] = B.today(); grant(save, ach); fresh.push(ach); any = true; }
      }
      if (!any) break;
    }
    if (fresh.length) B.storeSave(save);
    return fresh;
  };

  A.progress = function (save, ach) {
    if (!ach.progress) return null;
    try { return ach.progress(save.stats, save); } catch (e) { return null; }
  };

  // Welche Erfolgs-Karte gibt es wofür?
  A.sourceOf = (cardId) => L.find((a) => a.reward.card === cardId) || null;

  // ---------- Spielauswertung: Statistik aktualisieren ----------
  A.applyGame = function (save, game) {
    const st = save.stats;
    st.played++;
    if (game.won) { st.won++; st.streak = (st.streak || 0) + 1; st.bestStreak = Math.max(st.bestStreak || 0, st.streak); if (game.opp) st.winsVs[game.opp] = (st.winsVs[game.opp] || 0) + 1; }
    else st.streak = 0;
    const bl = st.byLevel[game.level]; bl[0]++; if (game.won) bl[1]++;
    st.kos += game.kos.length;
    st.bigBadKos += game.kos.filter((k) => k.bigBad).length;
    st.damage += game.damage;
    st.maxHit = Math.max(st.maxHit || 0, game.maxHit);
    st.weakHits += game.weakHits;
    st.evolutions += game.evolutions.length;
    st.stage2 += game.evolutions.filter((id) => B.CARDS[id].stage === 2).length;
    if (game.evolutions.includes('willow3')) st.darkWillow = true;
    if (game.evolutions.includes('giles2')) st.gilesRipper = true;
    st.supporters += game.trainers['Unterstützer'] || 0;
    st.stadiums += game.trainers.Stadion || 0;
    st.tools += game.trainers['Ausrüstung'] || 0;
    st.abilities += game.abilities;
    st.retreats += game.retreats;
    st.statuses += game.statuses;
    const d = B.today();
    st.gamesByDay = { [d]: (st.gamesByDay[d] || 0) + 1 }; // nur der heutige Tag zählt
    B.storeSave(save);
  };

  // ---------- Tracker für eine laufende Partie ----------
  A.newTracker = (level, opp) => ({
    level, opp, won: false, turns: 0, kos: [], lost: 0, damage: 0, maxHit: 0, weakHits: 0, evolutions: [], trainers: {}, abilities: 0,
    retreats: 0, statuses: 0, run: 0, runHeads: null, maxHeads: 0, maxTails: 0, chip: false, bunny: false, wasBehind: false,
    lastKoBy: null, dawnBuffy: false, vampWillow: false,
  });
  A.track = function (t, s, ev, me) {
    switch (ev.type) {
      case 'damage': if (ev.pi !== me) { t.damage += ev.n; t.maxHit = Math.max(t.maxHit, ev.n); if (ev.weak) t.weakHits++; } break;
      case 'ko':
        if (ev.pi !== me) { t.kos.push({ victim: ev.card, bigBad: ev.bigBad, attacker: ev.by === me ? ev.attacker : null }); if (ev.by === me && ev.attacker) t.lastKoBy = ev.attacker; }
        else t.lost++;
        break;
      case 'evolve': if (ev.pi === me) t.evolutions.push(ev.card); break;
      case 'trainer': if (ev.pi === me) t.trainers[ev.sub] = (t.trainers[ev.sub] || 0) + 1; break;
      case 'ability': if (ev.pi === me) t.abilities++; break;
      case 'retreat': if (ev.pi === me) t.retreats++; break;
      case 'status': if (ev.by === me) t.statuses++; break;
      case 'flee': if (ev.pi === me && /anya/.test(ev.card)) t.bunny = true; break;
      case 'coin':
        if (t.runHeads === ev.heads) t.run++; else { t.run = 1; t.runHeads = ev.heads; }
        if (ev.heads) t.maxHeads = Math.max(t.maxHeads, t.run); else t.maxTails = Math.max(t.maxTails, t.run);
        break;
      default: break;
    }
    // Zustand des Bretts beobachten
    const p = s.players[me], o = s.players[1 - me];
    if (o.kos >= 2 && p.kos === 0) t.wasBehind = true;
    const names = B.Engine.slotsOf(p).map((sl) => B.Engine.top(s, sl).id);
    if (names.includes('vampwillow')) t.vampWillow = true;
    const hasDawn = names.some((id) => B.CARDS[id].name.startsWith('Dawn')), hasBuffy = names.some((id) => B.CARDS[id].name.startsWith('Buffy'));
    t.dawnBuffyNow = hasDawn && hasBuffy;
    if (t.dawnBuffyNow) t.dawnBuffy = true;
    if (s.phase === 'main' && s.current === me && p.active && B.Engine.top(s, p.active).id === 'spike1' && B.Engine.militaryInPlay(s)) t.chip = true;
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
