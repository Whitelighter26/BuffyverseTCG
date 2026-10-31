/* Buffyverse TCG – Kartenkatalog Staffel 1–7
   Alle Werte sind bewusst hier zentral gepflegt, damit du das Balancing leicht anpassen kannst. */
(function (G) {
  const B = (G.BTCG = G.BTCG || {});

  // ---------- Typen, Energie, Schwächen ----------
  B.ENERGY = {
    K: { name: 'Kampf', icon: '🥊', color: '#d9572b' },
    M: { name: 'Magie', icon: '🔮', color: '#8a4fd8' },
    V: { name: 'Vampir/Dämonisch', icon: '🦇', color: '#b0172f' },
    W: { name: 'Wissen', icon: '🎓', color: '#c99a2e' },
    '*': { name: 'Beliebig', icon: '⚪', color: '#9aa0a6' },
  };
  B.TYPES = {
    Kampf: { color: '#d9572b', icon: '🥊', energy: 'K' },
    Magie: { color: '#8a4fd8', icon: '🔮', energy: 'M' },
    Vampir: { color: '#b0172f', icon: '🦇', energy: 'V' },
    'Dämon': { color: '#3f9a4a', icon: '👹', energy: 'V' },
    Wissen: { color: '#c99a2e', icon: '🎓', energy: 'W' },
    'Militär': { color: '#6f7d3c', icon: '🎖️', energy: 'K' },
  };
  // Schwäche (×2) gegen Angriffe dieses Typs – ein Kreislauf, damit kein Typ alles dominiert
  B.WEAK = { Kampf: 'Militär', Vampir: 'Kampf', Wissen: 'Vampir', 'Dämon': 'Wissen', Magie: 'Dämon', 'Militär': 'Magie' };
  // Resistenz (−30)
  B.RES = { 'Dämon': 'Kampf', 'Militär': 'Dämon' };

  B.CONFIG = {
    KO_TO_WIN: 3,
    BIGBAD_KO_VALUE: 2,
    DECK_SIZE: 60,
    MAX_COPIES: 4,
    HAND_START: 7,
    BENCH_MAX: 5,
    WEAKNESS_MULT: 2,
    RESISTANCE: 30,
    BOOSTERS_PER_DAY: 2,
    BOOSTER_SIZE: 10,
    // Tauschbörse: so viele Exemplare EINER Karte gibst du ab, je nach Stufe der Wunschkarte
    TRADE_COST: { basis: 10, stufe1: 12, stufe2: 15, bigbad: 20 },
  };

  const CARDS = {};
  const a = (name, cost, dmg, fx) => ({ name, cost, dmg, fx: fx || [] });
  function ch(id, name, o) {
    CARDS[id] = Object.assign(
      { id, name, kind: 'char', stage: 0, tags: [], retreat: 1, rarity: 'C', faction: 'gut', attacks: [], bigBad: false },
      o
    );
  }
  function tr(id, name, sub, rarity, text, fx, o) {
    CARDS[id] = Object.assign({ id, name, kind: 'trainer', sub, rarity, text, fx }, o || {});
  }

  // =====================================================================
  //  SCOOBY-GANG & VERBÜNDETE
  // =====================================================================
  ch('buffy1', 'Buffy – Neue Jägerin', { type: 'Kampf', hp: 70, tags: ['Jägerin'], seasons: '1–2', attacks: [
    a('Pfahl ins Herz', 'K', 20, [{ t: 'vsType', type: 'Vampir', n: 20 }]),
    a('Saltokick', 'KK', 40)] , flavor: 'In jeder Generation wird eine Auserwählte geboren …' });
  ch('buffy2', 'Buffy – Die Auserwählte', { type: 'Kampf', hp: 120, stage: 1, from: 'buffy1', rarity: 'U', tags: ['Jägerin'], seasons: '2–6', attacks: [
    a('Schlagfertig', 'K*', 40, [{ t: 'draw', n: 1 }]),
    a('Volle Wucht', 'KK*', 90)], flavor: 'Erst der Spruch, dann der Pfahl.' });
  ch('buffy3', 'Buffy – Anführerin der Potentiellen', { type: 'Kampf', hp: 170, stage: 2, from: 'buffy2', rarity: 'R', retreat: 2, tags: ['Jägerin'], seasons: '7', attacks: [
    a('Ansprache an die Truppe', 'K', 0, [{ t: 'healAllOwn', n: 30 }]),
    a('Das letzte Gefecht', 'KK**', 160)], flavor: 'Bist du bereit, stark zu sein?' });

  ch('willow1', 'Willow – Schülerin', { type: 'Magie', hp: 60, seasons: '1–2', attacks: [
    a('Recherche', 'M', 0, [{ t: 'draw', n: 2 }]),
    a('Lichtblitz', 'MM', 30)], flavor: 'Computer, Bücher und ein Hauch Magie.' });
  ch('willow2', 'Willow – Wicca', { type: 'Magie', hp: 100, stage: 1, from: 'willow1', rarity: 'U', seasons: '3–5',
    ability: { kind: 'active', t: 'energyFromDiscardPick', e: 'M', name: 'Wicca-Kreis', text: 'Einmal pro Zug: Lege 1 🔮-Energie aus deiner Ablage an einen deiner Charaktere an.' },
    attacks: [a('Schutzkreis', 'M', 10, [{ t: 'preventNext', coin: true }]), a('Schwebezauber', 'MM*', 70)] });
  ch('willow3', 'Dark Willow', { type: 'Magie', hp: 220, stage: 2, from: 'willow2', rarity: 'L', retreat: 3, bigBad: true, faction: 'böse', seasons: '6', attacks: [
    a('Dunkle Absorption', 'M', 0, [{ t: 'energyFromDiscard', e: 'M', n: 2 }, { t: 'healSelf', n: 30 }]),
    a('Verheerende Magie', 'MMM*', 200, [{ t: 'discardSelfEnergy', n: 2 }])], flavor: 'Gelangweilt. Jetzt.' });
  ch('willow4', 'Willow – Göttliche Hexe', { type: 'Magie', hp: 180, stage: 2, from: 'willow2', rarity: 'R', retreat: 2, seasons: '7', attacks: [
    a('Erweckung der Jägerinnen', 'MM', 0, [{ t: 'energyFromDiscardPick', e: 'K', n: 2 }]),
    a('Weißes Licht', 'MMM', 130, [{ t: 'healSelf', n: 30 }])] });

  ch('xander1', 'Xander – Klassenclown', { type: 'Wissen', hp: 70, seasons: '1–3',
    ability: { kind: 'passive', t: 'benchShield', name: 'Herz der Gruppe', text: 'Deine Charaktere auf der Bank erhalten keinen Schaden durch gegnerische Angriffe.' },
    attacks: [a('Schlechter Witz', 'W*', 20, [{ t: 'status', s: 'para', coin: true }])] });
  ch('xander2', 'Xander – Bauarbeiter', { type: 'Wissen', hp: 110, stage: 1, from: 'xander1', rarity: 'U', seasons: '4–7', attacks: [
    a('Hammer & Nägel', 'WW', 50),
    a('Gelber Buntstift', 'WW*', 70, [{ t: 'healAllOwn', n: 20 }])] });
  ch('xander3', 'Xander – Halloween-Soldat', { type: 'Militär', hp: 80, rarity: 'U', seasons: '2', attacks: [
    a('Lagebesprechung', 'W', 0, [{ t: 'draw', n: 1 }]),
    a('Raketenwerfer', 'KW*', 90, [{ t: 'discardSelfEnergy', n: 2 }])] });

  ch('giles1', 'Giles – Bibliothekar', { type: 'Wissen', hp: 80, retreat: 2, seasons: '1–7',
    ability: { kind: 'active', t: 'draw', n: 1, name: 'Wächter-Wissen', text: 'Einmal pro Zug: Ziehe 1 Karte.' },
    attacks: [a('Dicker Wälzer', 'W*', 30)] });
  ch('giles2', 'Ripper', { type: 'Magie', hp: 130, stage: 1, from: 'giles1', rarity: 'U', retreat: 2, seasons: '2, 6', attacks: [
    a('Dunkle Vergangenheit', 'M*', 0, [{ t: 'coins', k: 3, per: 30 }]),
    a('Zorn des Wächters', 'MM*', 100, [{ t: 'selfDmg', n: 20 }])] });

  ch('cordelia', 'Cordelia – Königin von Sunnydale', { type: 'Wissen', hp: 60, seasons: '1–3',
    ability: { kind: 'active', t: 'peekHand', name: 'Gnadenlose Ehrlichkeit', text: 'Einmal pro Zug: Sieh dir die Hand deines Gegners an.' },
    attacks: [a('Spitzer Kommentar', 'W', 10, [{ t: 'ifStatus', n: 30 }]), a('Cheerleader-Kick', 'W*', 30)] });

  ch('oz1', 'Oz – Gitarrist', { type: 'Wissen', hp: 70, seasons: '2–4', attacks: [
    a('Stoischer Blick', 'W', 10, [{ t: 'draw', n: 1 }]), a('Bandprobe', 'W*', 30)] });
  ch('oz2', 'Oz – Werwolf', { type: 'Dämon', hp: 130, stage: 1, from: 'oz1', rarity: 'U', retreat: 2, seasons: '2–4', attacks: [
    a('Vollmondnacht', 'V*', 50), a('Wilde Raserei', 'VV*', 100, [{ t: 'selfDmg', n: 20 }])] });

  ch('angel1', 'Angel – Der Geheimnisvolle', { type: 'Vampir', hp: 90, seasons: '1–3',
    ability: { kind: 'passive', t: 'reduceDmg', fromType: ['Vampir'], n: 20, name: 'Beseelt', text: 'Angel erhält 20 Schaden weniger durch Angriffe von Vampir-Charakteren.' },
    attacks: [a('Kryptische Warnung', 'V', 0, [{ t: 'draw', n: 2 }]), a('Vampirgesicht', 'VV*', 60)] });
  ch('angelus', 'Angelus', { type: 'Vampir', hp: 150, stage: 1, from: 'angel1', rarity: 'L', retreat: 2, bigBad: true, faction: 'böse', seasons: '2', attacks: [
    a('Psychoterror', 'V*', 30, [{ t: 'discardOppHand', n: 1 }]),
    a('Ohne Seele', 'VVV*', 130, [{ t: 'healSelf', n: 30 }])], flavor: 'Ein glücklicher Moment, und die Seele ist weg.' });

  ch('spike1', 'Spike – Kopfgeldjäger', { type: 'Vampir', hp: 90, rarity: 'U', faction: 'beide', seasons: '2–5',
    ability: { kind: 'passive', t: 'chip', name: 'Der Chip', text: 'Solange ein Militär-Charakter (Die Initiative) im Spiel ist, kann Spike nicht angreifen.' },
    attacks: [a('Hinterhalt', 'KK', 40), a('Jägerinnen-Schreck', 'VV*', 60, [{ t: 'vsTag', tag: 'Jägerin', n: 40 }])] });
  ch('spike2', 'Spike – Mit Seele', { type: 'Vampir', hp: 140, stage: 1, from: 'spike1', rarity: 'U', seasons: '6–7', attacks: [
    a('Schlechte Poesie', 'V', 0, [{ t: 'status', s: 'sleep' }]),
    a('Für die Jägerin', 'KV*', 100)], flavor: 'William der Blutige – jetzt mit Gewissen.' });

  ch('anya1', 'Anya – Ex-Dämonin', { type: 'Wissen', hp: 70, seasons: '3–7',
    ability: { kind: 'active', t: 'discardDraw', name: 'Kapitalismus!', text: 'Einmal pro Zug: Lege 1 Karte aus deiner Hand ab und ziehe 2 Karten.' },
    attacks: [a('Hasen-Panik', 'W*', 30, [{ t: 'switchSelf' }])] });
  ch('anyanka', 'Anyanka – Rachedämonin', { type: 'Dämon', hp: 120, stage: 1, from: 'anya1', rarity: 'U', retreat: 2, faction: 'böse', seasons: '3, 6', attacks: [
    a('Ich wünschte …', 'V*', 20, [{ t: 'discardOppHand', n: 2 }]),
    a('Rachefluch', 'VV*', 90)] });

  ch('tara', 'Tara – Sanfte Hexe', { type: 'Magie', hp: 70, seasons: '4–6',
    ability: { kind: 'active', t: 'healPick', n: 20, name: 'Heilende Hände', text: 'Einmal pro Zug: Heile 20 Schaden bei einem deiner Charaktere.' },
    attacks: [a('Schutzzauber', 'MM', 30, [{ t: 'preventNext', coin: true }])] });

  ch('dawn', 'Dawn – Der Schlüssel', { type: 'Magie', hp: 60, rarity: 'U', seasons: '5–7',
    ability: { kind: 'active', t: 'extraEnergy', selfDmg: 10, name: 'Der Schlüssel', text: 'Einmal pro Zug: Lege zusätzlich 1 Energie aus deiner Hand an einen deiner Charaktere an. Dawn erhält 10 Schaden.' },
    attacks: [a('Tagebuch-Eintrag', '*', 0, [{ t: 'draw', n: 2 }])] });

  ch('faith1', 'Faith – Rebellische Jägerin', { type: 'Kampf', hp: 90, rarity: 'U', faction: 'beide', tags: ['Jägerin'], seasons: '3, 7', attacks: [
    a('Fünf mal fünf', 'K*', 40), a('Wollen, nehmen, haben', 'KK*', 80, [{ t: 'selfDmg', n: 10 }])] });
  ch('faith2', 'Faith – Dunkle Jägerin', { type: 'Kampf', hp: 140, stage: 1, from: 'faith1', rarity: 'R', faction: 'böse', tags: ['Jägerin'], seasons: '3',
    ability: { kind: 'passive', t: 'rageBonus', n: 30, name: 'Lust auf Chaos', text: 'Hat Faith Schaden, machen ihre Angriffe 30 Schaden mehr.' },
    attacks: [a('Messerwurf', 'K', 20, [{ t: 'benchOne', n: 20 }]), a('Rachefeldzug', 'KK**', 110)] });

  ch('kendra', 'Kendra – Jägerin', { type: 'Kampf', hp: 80, tags: ['Jägerin'], seasons: '2', attacks: [
    a('Lehrbuch-Taktik', 'K', 0, [{ t: 'searchTool' }]), a('Präziser Stoß', 'KK', 50)] });
  ch('riley', 'Riley – Initiative-Agent', { type: 'Militär', hp: 90, rarity: 'U', seasons: '4–5',
    ability: { kind: 'passive', t: 'retreatZero', type: 'Militär', name: 'Initiative-Drill', text: 'Deine Militär-Charaktere haben keine Rückzugskosten.' },
    attacks: [a('Taser', 'K*', 30, [{ t: 'status', s: 'para', coin: true }]), a('Kommando-Aktion', 'KW*', 70)] });
  ch('jenny', 'Jenny Calendar – Techno-Heidin', { type: 'Magie', hp: 70, seasons: '1–2', attacks: [
    a('Online-Zirkel', 'M', 0, [{ t: 'draw', n: 2 }]), a('Fluch der Kalderash', 'MM', 40, [{ t: 'vsType', type: 'Vampir', n: 30 }])] });
  ch('joyce', 'Joyce Summers', { type: 'Wissen', hp: 60, seasons: '1–5',
    ability: { kind: 'active', t: 'healAll', n: 10, name: 'Heiße Schokolade', text: 'Einmal pro Zug: Heile 10 Schaden bei jedem deiner Charaktere.' },
    attacks: [a('Weg von meiner Tochter!', 'W*', 40)] });
  ch('wesley', 'Wesley – Neuer Wächter', { type: 'Wissen', hp: 60, seasons: '3', attacks: [
    a('Wächterrat-Protokoll', 'W', 0, [{ t: 'searchBasic', n: 1 }]), a('Ungeschickter Angriff', 'W*', 50, [{ t: 'coinFail' }])] });
  ch('amy', 'Amy Madison – Hexe', { type: 'Magie', hp: 60, faction: 'beide', seasons: '1–7', attacks: [
    a('Ratten-Verwandlung', 'M*', 20, [{ t: 'status', s: 'para', coin: true }]), a('Magiesucht', 'MM', 60, [{ t: 'selfDmg', n: 20 }])] });
  ch('jonathan', 'Jonathan – Superstar', { type: 'Wissen', hp: 50, faction: 'beide', seasons: '1–7', attacks: [
    a('Superstar', 'W*', 10, [{ t: 'draw', n: 2 }])] });
  ch('andrew', 'Andrew – Möchtegern-Schurke', { type: 'Wissen', hp: 50, faction: 'beide', seasons: '6–7', attacks: [
    a('Nerd-Monolog', 'W', 0, [{ t: 'draw', n: 1 }]), a('Fliegende Affen', 'WW', 20, [{ t: 'benchAll', n: 10 }])] });
  ch('kennedy', 'Kennedy – Potentielle', { type: 'Kampf', hp: 70, tags: ['Jägerin'], seasons: '7', attacks: [
    a('Großmaul', 'K', 10, [{ t: 'ifDamaged', n: 30 }]), a('Kampfausbildung', 'KK', 50)] });
  ch('potential', 'Potentielle Jägerin', { type: 'Kampf', hp: 60, tags: ['Jägerin'], seasons: '7', attacks: [
    a('Zusammenhalt', 'K', 10, [{ t: 'perBench', n: 10 }])] });
  ch('wood', 'Robin Wood – Direktor', { type: 'Kampf', hp: 90, rarity: 'U', seasons: '7', attacks: [
    a('Waffenkammer im Büro', 'K', 0, [{ t: 'searchTool' }]), a('Vergeltung', 'KK*', 70, [{ t: 'vsType', type: 'Vampir', n: 30 }])] });
  ch('clem', 'Clem – Freundlicher Dämon', { type: 'Dämon', hp: 80, seasons: '5–7', attacks: [
    a('Pokerabend', 'V', 0, [{ t: 'draw', n: 2 }]), a('Hängebacken-Rempler', 'VV', 40)] });
  ch('firstslayer', 'Die Erste Jägerin', { type: 'Kampf', hp: 120, rarity: 'R', retreat: 2, faction: 'beide', tags: ['Jägerin'], seasons: '4', attacks: [
    a('Traumpfad', 'K*', 20, [{ t: 'status', s: 'sleep' }]), a('Urkraft', 'KK**', 110)] });
  ch('ben', 'Ben – Assistenzarzt', { type: 'Wissen', hp: 70, faction: 'beide', seasons: '5', attacks: [
    a('Notfallversorgung', 'W', 0, [{ t: 'healOwnPick', n: 30 }]), a('Skalpell', 'W*', 20)] });

  // =====================================================================
  //  BADDIES – STAFFEL 1
  // =====================================================================
  ch('master', 'Der Meister', { type: 'Vampir', hp: 200, retreat: 4, rarity: 'L', bigBad: true, faction: 'böse', seasons: '1',
    ability: { kind: 'passive', t: 'noRetreat', name: 'Gefangen im Höllenschlund', text: 'Der Meister kann sich nicht zurückziehen.' },
    attacks: [a('Hypnotischer Griff', 'V*', 30, [{ t: 'status', s: 'para', coin: true }]), a('Uralter Biss', 'VVV*', 150, [{ t: 'healSelf', n: 50 }])],
    flavor: 'Big Bad der 1. Staffel.' });
  ch('darla', 'Darla – Erzeugerin', { type: 'Vampir', hp: 90, rarity: 'U', faction: 'böse', seasons: '1–2',
    ability: { kind: 'passive', t: 'retreatZero', type: 'Vampir', name: 'Erzeugerin', text: 'Deine Vampir-Charaktere haben keine Rückzugskosten.' },
    attacks: [a('Zwei Pistolen', 'VV', 0, [{ t: 'coins', k: 2, per: 40 }])] });
  ch('luke', 'Luke – Gefolgsmann des Meisters', { type: 'Vampir', hp: 90, faction: 'böse', seasons: '1', attacks: [
    a('Erntezeit', 'V', 0, [{ t: 'searchBasic', n: 1, type: 'Vampir' }]), a('Brutaler Schlag', 'VV*', 70)] });
  ch('collin', 'Der Gesalbte', { type: 'Vampir', hp: 60, faction: 'böse', seasons: '1', attacks: [
    a('Die Prophezeiung', 'V', 0, [{ t: 'draw', n: 2 }]), a('Unerwarteter Angriff', 'V*', 30, [{ t: 'status', s: 'sleep', coin: true }])] });
  ch('moloch', 'Moloch – Der Verderber', { type: 'Dämon', hp: 110, rarity: 'U', faction: 'böse', seasons: '1', attacks: [
    a('Netz-Manipulation', 'V*', 20, [{ t: 'discardOppHand', n: 1 }]), a('Roboterkörper', 'VV*', 80)] });
  ch('catherine', 'Catherine Madison – Hexenmutter', { type: 'Magie', hp: 80, rarity: 'U', faction: 'böse', seasons: '1', attacks: [
    a('Körpertausch', 'MM', 30, [{ t: 'gustBefore' }]), a('Erblindungsfluch', 'M*', 30, [{ t: 'status', s: 'para', coin: true }])] });
  ch('missfrench', 'Miss French – Gottesanbeterin', { type: 'Dämon', hp: 80, faction: 'böse', seasons: '1', attacks: [
    a('Verführung', 'V', 0, [{ t: 'status', s: 'sleep' }]), a('Fangarme', 'VV', 50)] });
  ch('snyder', 'Direktor Snyder', { type: 'Wissen', hp: 60, faction: 'böse', seasons: '1–3',
    ability: { kind: 'active', t: 'coinPara', needActive: true, name: 'Nachsitzen', text: 'Einmal pro Zug, wenn Snyder aktiv ist: Wirf eine Münze. Kopf: Der aktive Charakter des Gegners ist gelähmt.' },
    attacks: [a('Disziplinarstrafe', 'W*', 30)] });
  ch('harmony', 'Harmony – Möchtegern-Vampirin', { type: 'Vampir', hp: 60, faction: 'böse', seasons: '1–5', attacks: [
    a('Kleiner Biss', 'V', 20, [{ t: 'lifesteal' }]), a('Nervensäge', 'V*', 30, [{ t: 'status', s: 'sleep', coin: true }])] });
  ch('vampgen', 'Vampir-Gefolgsmann', { type: 'Vampir', hp: 60, faction: 'böse', seasons: '1–7', attacks: [
    a('Biss', 'V', 20, [{ t: 'healSelf', n: 10 }]), a('Rudelangriff', 'V*', 10, [{ t: 'perBench', n: 10 }])] });

  // =====================================================================
  //  STAFFEL 2
  // =====================================================================
  ch('drusilla', 'Drusilla – Die Seherin', { type: 'Vampir', hp: 100, rarity: 'U', faction: 'böse', seasons: '2, 5, 7',
    ability: { kind: 'active', t: 'coinSleep', needActive: true, name: 'Hypnose', text: 'Einmal pro Zug, wenn Drusilla aktiv ist: Wirf eine Münze. Kopf: Der aktive Charakter des Gegners schläft ein.' },
    attacks: [a('Miss Edith flüstert', 'V', 0, [{ t: 'draw', n: 1 }, { t: 'healSelf', n: 20 }]), a('Wahnsinniger Tanz', 'VV*', 70, [{ t: 'status', s: 'poison' }])] });
  ch('judge', 'Der Richter', { type: 'Dämon', hp: 160, retreat: 3, rarity: 'R', faction: 'böse', seasons: '2',
    ability: { kind: 'passive', t: 'immuneType', types: ['Kampf'], name: 'Keine geschmiedete Waffe', text: 'Verhindert jeglichen Schaden durch Angriffe von Kampf-Charakteren.' },
    attacks: [a('Läuterung', 'VV*', 80, [{ t: 'vsType', type: 'Wissen', n: 40 }])] });
  ch('ted', 'Ted – Der perfekte Stiefvater', { type: 'Wissen', hp: 90, faction: 'böse', seasons: '2', attacks: [
    a('Kekse mit Extra', 'W', 10, [{ t: 'status', s: 'sleep' }]), a('Roboter-Raserei', 'WW*', 70)] });
  ch('eyghon', 'Eyghon – Der Schläfer', { type: 'Dämon', hp: 100, rarity: 'U', faction: 'böse', seasons: '2', attacks: [
    a('Besessenheit', 'V*', 30, [{ t: 'gustBefore' }]), a('Uralter Fluch', 'VV*', 70, [{ t: 'status', s: 'poison' }])] });
  ch('ethan', 'Ethan Rayne – Chaos-Magier', { type: 'Magie', hp: 80, rarity: 'U', faction: 'böse', seasons: '2–4', attacks: [
    a('Kostümzauber', 'M*', 0, [{ t: 'coins', k: 2, per: 40 }]), a('Chaos-Ritual', 'MM*', 70, [{ t: 'status', s: 'sleep', coin: true }])] });

  // =====================================================================
  //  STAFFEL 3
  // =====================================================================
  ch('mayor1', 'Bürgermeister Wilkins', { type: 'Wissen', hp: 100, retreat: 2, rarity: 'U', faction: 'böse', seasons: '3',
    ability: { kind: 'passive', t: 'reduceDmg', n: 30, name: 'Unverwundbarkeit', text: 'Der Bürgermeister erhält 30 Schaden weniger durch Angriffe.' },
    attacks: [a('Feuchttuch-Pause', 'W', 0, [{ t: 'healSelf', n: 30 }, { t: 'draw', n: 1 }]), a('Freundliche Drohung', 'WW*', 60)] });
  ch('mayor2', 'Der Bürgermeister – Aufgestiegen', { type: 'Dämon', hp: 230, stage: 1, from: 'mayor1', retreat: 4, rarity: 'L', bigBad: true, faction: 'böse', seasons: '3', attacks: [
    a('Schlangenbiss', 'VV*', 80, [{ t: 'status', s: 'poison' }]),
    a('Abschlussfeier', 'VVV**', 190, [{ t: 'discardSelfEnergy', n: 2 }])], flavor: 'Big Bad der 3. Staffel.' });
  ch('mrtrick', 'Mr. Trick', { type: 'Vampir', hp: 90, rarity: 'U', faction: 'böse', seasons: '3', attacks: [
    a('Kopfgeld ausschreiben', 'V', 0, [{ t: 'searchBasic', n: 2 }]), a('Eleganter Konter', 'VV', 50)] });
  ch('balthazar', 'Balthazar – Dämonenfürst', { type: 'Dämon', hp: 140, retreat: 3, rarity: 'U', faction: 'böse', seasons: '3', attacks: [
    a('Thermalbad', 'V*', 0, [{ t: 'healSelf', n: 50 }]), a('Massiver Hieb', 'VVV', 100)] });
  ch('kakistos', 'Kakistos – Uralter Vampir', { type: 'Vampir', hp: 130, retreat: 2, rarity: 'U', faction: 'böse', seasons: '3', attacks: [
    a('Uralte Wut', 'V*', 30, [{ t: 'perDamageSelf', n: 10 }]), a('Gespaltener Huf', 'VVV', 100)] });
  ch('vampwillow', 'Vampir-Willow', { type: 'Vampir', hp: 90, rarity: 'U', faction: 'böse', seasons: '3', attacks: [
    a('Gelangweilt jetzt', 'V*', 30, [{ t: 'status', s: 'para', coin: true }]), a('Spiegelwelt-Biss', 'VV*', 60, [{ t: 'lifesteal' }])] });
  ch('gwendolyn', 'Gwendolyn Post – Falsche Wächterin', { type: 'Magie', hp: 70, faction: 'böse', seasons: '3', attacks: [
    a('Falsche Akten', 'W', 10, [{ t: 'discardOppTool' }]), a('Handschuh von Myhnegon', 'MM*', 90, [{ t: 'selfDmg', n: 30 }])] });

  // =====================================================================
  //  STAFFEL 4 – DIE INITIATIVE
  // =====================================================================
  ch('adam', 'Adam – Projekt 314', { type: 'Militär', hp: 210, retreat: 3, rarity: 'L', bigBad: true, faction: 'böse', seasons: '4',
    ability: { kind: 'passive', t: 'reduceDmg', n: 20, name: 'Kybernetischer Körper', text: 'Adam erhält 20 Schaden weniger durch Angriffe.' },
    attacks: [a('Analyse', 'W*', 30, [{ t: 'draw', n: 1 }]), a('Uran-Herz', 'KK**', 150)], flavor: 'Big Bad der 4. Staffel.' });
  ch('walsh', 'Professor Maggie Walsh', { type: 'Militär', hp: 80, rarity: 'U', faction: 'böse', seasons: '4',
    ability: { kind: 'passive', t: 'teamBonus', type: 'Militär', n: 10, name: 'Projektleitung', text: 'Angriffe deiner Militär-Charaktere machen 10 Schaden mehr.' },
    attacks: [a('Psychologie-Vorlesung', 'W*', 20, [{ t: 'status', s: 'sleep' }])] });
  ch('forrest', 'Forrest – Initiative-Soldat', { type: 'Militär', hp: 80, faction: 'böse', seasons: '4', attacks: [
    a('Granatwerfer', 'K*', 20, [{ t: 'benchOne', n: 20 }]), a('Sturmangriff', 'KK*', 70)] });
  ch('graham', 'Graham – Initiative-Soldat', { type: 'Militär', hp: 70, faction: 'beide', seasons: '4–5', attacks: [
    a('Verstärkung rufen', 'K', 0, [{ t: 'searchBasic', n: 1, type: 'Militär' }]), a('Sturmgewehr', 'K*', 30)] });
  ch('gentlemen', 'Die Gentlemen', { type: 'Dämon', hp: 100, rarity: 'U', faction: 'böse', seasons: '4', attacks: [
    a('Stille', 'V*', 20, [{ t: 'status', s: 'para', coin: true }]), a('Unheimliches Lächeln', 'VV*', 70)] });
  ch('veruca', 'Veruca – Werwölfin', { type: 'Dämon', hp: 90, faction: 'böse', seasons: '4', attacks: [
    a('Rudelinstinkt', 'V*', 40), a('Wilde Krallen', 'VV*', 70, [{ t: 'selfDmg', n: 10 }])] });
  ch('sunday', 'Sunday – Bandenchefin', { type: 'Vampir', hp: 80, faction: 'böse', seasons: '4', attacks: [
    a('Zimmer plündern', 'V*', 20, [{ t: 'discardOppHand', n: 1 }]), a('Armhebel', 'VV', 50)] });

  // =====================================================================
  //  STAFFEL 5
  // =====================================================================
  ch('glory', 'Glory – Höllengöttin', { type: 'Dämon', hp: 230, stage: 1, from: 'ben', retreat: 3, rarity: 'L', bigBad: true, faction: 'böse', seasons: '5',
    ability: { kind: 'passive', t: 'reduceDmg', n: 30, name: 'Göttin', text: 'Glory erhält 30 Schaden weniger durch Angriffe.' },
    attacks: [a('Verstand rauben', 'V*', 40, [{ t: 'discardOppHand', n: 1 }]), a('Göttlicher Zorn', 'VVV*', 180)], flavor: 'Big Bad der 5. Staffel.' });
  ch('doc', 'Doc', { type: 'Dämon', hp: 100, rarity: 'U', faction: 'böse', seasons: '5', attacks: [
    a('Zungenschlag', 'V*', 30, [{ t: 'status', s: 'poison' }]), a('Ritualvorbereitung', 'VV', 20, [{ t: 'energyFromDiscard', e: 'V', n: 2 }])] });
  ch('dracula', 'Dracula', { type: 'Vampir', hp: 130, retreat: 2, rarity: 'R', faction: 'böse', seasons: '5', attacks: [
    a('Hypnotischer Blick', 'V*', 20, [{ t: 'status', s: 'sleep' }]), a('Nebelgestalt', 'VV*', 60, [{ t: 'preventNext', coin: true }])] });
  ch('knights', 'Ritter von Byzanz', { type: 'Kampf', hp: 80, faction: 'böse', seasons: '5', attacks: [
    a('Lanzenstoß', 'K*', 40), a('Ordensgelübde', 'KK', 60)] });
  ch('minions', 'Glorys Lakaien', { type: 'Dämon', hp: 50, retreat: 0, faction: 'böse', seasons: '5', attacks: [
    a('Unterwürfiges Kriechen', 'V', 0, [{ t: 'searchBasic', n: 1, type: 'Dämon' }]), a('Gemeinsam stark', 'V*', 10, [{ t: 'perBench', n: 10 }])] });
  ch('queller', 'Queller-Dämon', { type: 'Dämon', hp: 80, faction: 'böse', seasons: '5', attacks: [
    a('Würgegriff', 'VV', 40, [{ t: 'status', s: 'para', coin: true }])] });

  // =====================================================================
  //  STAFFEL 6 – DAS TRIO
  // =====================================================================
  ch('warren1', 'Warren – Gadget-Genie', { type: 'Wissen', hp: 80, faction: 'böse', seasons: '5–6', attacks: [
    a('Gefrierstrahl', 'W*', 20, [{ t: 'status', s: 'para', coin: true }]), a('Roboter-Armee', 'WW*', 60)] });
  ch('warren2', 'Warren – Magisch verstärkt', { type: 'Magie', hp: 140, stage: 1, from: 'warren1', retreat: 2, rarity: 'U', faction: 'böse', seasons: '6',
    ability: { kind: 'passive', t: 'reduceDmg', n: 30, name: 'Orbs von Nezzla\'khan', text: 'Warren erhält 30 Schaden weniger durch Angriffe.' },
    attacks: [a('Größenwahn', 'MW*', 100)] });
  ch('sweet', 'Sweet – Tanzdämon', { type: 'Dämon', hp: 130, retreat: 2, rarity: 'R', faction: 'böse', seasons: '6', attacks: [
    a('Alle singen mit!', 'V*', 10, [{ t: 'status', s: 'sleep' }, { t: 'benchAll', n: 10 }]), a('Unwiderstehlicher Rhythmus', 'VV*', 90)] });
  ch('rack', 'Rack – Magiedealer', { type: 'Magie', hp: 90, rarity: 'U', faction: 'böse', seasons: '6', attacks: [
    a('Magischer Rausch', 'M', 0, [{ t: 'energyFromDiscard', e: 'M', n: 1 }, { t: 'draw', n: 1 }]), a('Dunkle Ladung', 'MM*', 80)] });
  ch('halfrek', 'Halfrek – Rachedämonin', { type: 'Dämon', hp: 90, faction: 'böse', seasons: '6–7', attacks: [
    a('Wunsch gewährt', 'V*', 30, [{ t: 'discardOppHand', n: 1 }]), a('Rache-Welle', 'VV*', 70)] });
  ch('dhoffryn', "D'Hoffryn – Herr der Rache", { type: 'Dämon', hp: 130, retreat: 2, rarity: 'R', faction: 'böse', seasons: '3–7',
    ability: { kind: 'passive', t: 'teamBonus', type: 'Dämon', n: 10, name: 'Rache-Imperium', text: 'Angriffe deiner Dämon-Charaktere machen 10 Schaden mehr.' },
    attacks: [a('Höllenfeuer', 'VVV*', 120)] });

  // =====================================================================
  //  STAFFEL 7 – DIE ERSTE
  // =====================================================================
  ch('first', 'Die Erste – Das Urböse', { type: 'Dämon', hp: 210, retreat: 2, rarity: 'L', bigBad: true, faction: 'böse', seasons: '7',
    ability: { kind: 'passive', t: 'reduceDmg', fromType: ['Kampf', 'Militär'], n: 50, name: 'Unkörperlich', text: 'Die Erste erhält 50 Schaden weniger durch Angriffe von Kampf- und Militär-Charakteren.' },
    attacks: [a('Gestaltwandel', 'V*', 20, [{ t: 'draw', n: 2 }]), a('Das Ende aller Dinge', 'VVV*', 170)], flavor: 'Big Bad der 7. Staffel.' });
  ch('caleb', 'Caleb – Der Prediger', { type: 'Kampf', hp: 160, retreat: 2, rarity: 'R', faction: 'böse', seasons: '7', attacks: [
    a('Ein Wort, Mädchen', 'K*', 40, [{ t: 'status', s: 'para', coin: true }]), a('Rechte Hand der Ersten', 'KK**', 140)] });
  ch('turokhan', 'Turok-Han – Übervampir', { type: 'Vampir', hp: 140, retreat: 2, rarity: 'U', faction: 'böse', seasons: '7',
    ability: { kind: 'passive', t: 'reduceDmg', n: 20, name: 'Urvampir', text: 'Turok-Han erhält 20 Schaden weniger durch Angriffe.' },
    attacks: [a('Urbiss', 'VV*', 90, [{ t: 'healSelf', n: 20 }])] });
  ch('bringer', 'Bringer – Diener der Ersten', { type: 'Dämon', hp: 60, faction: 'böse', seasons: '7', attacks: [
    a('Lautlose Klinge', 'V', 20, [{ t: 'status', s: 'poison' }]), a('Fluchritus', 'VV', 40)] });

  // =====================================================================
  //  SUPPORT-KARTEN
  // =====================================================================
  // Unterstützer (1 pro Zug)
  tr('giles_training', "Giles' Trainingsstunde", 'Unterstützer', 'U', 'Durchsuche dein Deck nach einer Ausrüstung oder einer Entwicklungskarte und nimm sie auf die Hand.', { t: 'searchDeck', filter: 'toolOrEvo', n: 1 });
  tr('library', 'Recherche in der Bibliothek', 'Unterstützer', 'C', 'Ziehe 3 Karten.', { t: 'draw', n: 3 });
  tr('council', 'Der Wächterrat', 'Unterstützer', 'U', 'Mische deine Hand in dein Deck. Ziehe dann 6 Karten.', { t: 'shuffleDraw', n: 6 });
  tr('patrol', 'Patrouille auf dem Friedhof', 'Unterstützer', 'U', 'Wähle einen Charakter auf der Bank deines Gegners und tausche ihn mit dessen aktivem Charakter.', { t: 'gust' });
  tr('xander_basement', 'Xanders Kellerwohnung', 'Unterstützer', 'U', 'Durchsuche dein Deck nach bis zu 2 Basis-Charakteren und lege sie auf deine Bank.', { t: 'searchDeck', filter: 'basic', n: 2, to: 'bench' });
  tr('willow_hack', 'Willows Hacking', 'Unterstützer', 'U', 'Sieh dir die obersten 5 Karten deines Decks an. Nimm 2 davon auf die Hand, mische den Rest zurück.', { t: 'topPick', look: 5, take: 2 });
  tr('anya_shop', 'Anyas Ladenkasse', 'Unterstützer', 'C', 'Ziehe Karten, bis du 6 Karten auf der Hand hast.', { t: 'drawTo', n: 6 });
  tr('joyce_cocoa', 'Joyces Kakao', 'Unterstützer', 'C', 'Heile 60 Schaden bei einem deiner Charaktere.', { t: 'healPick', n: 60 });
  tr('spike_crypt', 'Spikes Krypta', 'Unterstützer', 'U', 'Durchsuche dein Deck nach bis zu 2 Vampir-Charakteren und nimm sie auf die Hand.', { t: 'searchDeck', filter: 'vampir', n: 2 });
  tr('scooby_meeting', 'Scooby-Treffen', 'Unterstützer', 'C', 'Ziehe 1 Karte für jeden deiner Charaktere im Spiel.', { t: 'drawPerChar' });
  tr('initiative_brief', 'Initiative-Einsatzbefehl', 'Unterstützer', 'U', 'Durchsuche dein Deck nach bis zu 2 Militär-Charakteren und nimm sie auf die Hand.', { t: 'searchDeck', filter: 'militaer', n: 2 });

  // Gegenstände
  tr('magic_box', 'Der Zauberladen', 'Gegenstand', 'C', 'Heile 30 Schaden bei einem deiner Magie-Charaktere.', { t: 'healPick', n: 30, type: 'Magie' });
  tr('holy_water', 'Weihwasser', 'Gegenstand', 'C', 'Nur wenn der aktive Charakter des Gegners ein Vampir ist: Er erhält 30 Schaden.', { t: 'dmgOppActive', n: 30, type: 'Vampir' });
  tr('cross', 'Kreuz', 'Gegenstand', 'C', 'Nur gegen einen aktiven Vampir: Wirf eine Münze. Kopf: Er ist gelähmt.', { t: 'coinParaOpp', type: 'Vampir' });
  tr('crossbow', 'Armbrust', 'Gegenstand', 'C', 'Ein Charakter auf der gegnerischen Bank erhält 20 Schaden.', { t: 'benchDmg', n: 20 });
  tr('watcher_diary', 'Wächter-Tagebuch', 'Gegenstand', 'C', 'Durchsuche dein Deck nach einem Basis-Charakter und nimm ihn auf die Hand.', { t: 'searchDeck', filter: 'basic', n: 1 });
  tr('herbs', 'Kräuterbündel', 'Gegenstand', 'C', 'Lege 1 Energie aus deiner Ablage an einen deiner Charaktere an.', { t: 'energyFromDiscardPick', n: 1 });
  tr('switch', 'Rückzug in die Bibliothek', 'Gegenstand', 'C', 'Tausche deinen aktiven Charakter gegen einen Charakter auf deiner Bank.', { t: 'switchSelf' });
  tr('resurrection', 'Auferstehungszauber', 'Gegenstand', 'U', 'Nimm einen Charakter aus deiner Ablage auf die Hand.', { t: 'recoverChar' });
  tr('bronze_night', 'Ein Abend im Bronze', 'Gegenstand', 'U', 'Ziehe 2 Karten.', { t: 'draw', n: 2 });
  tr('spellbook', 'Zauberbuch', 'Gegenstand', 'C', 'Durchsuche dein Deck nach bis zu 2 🔮-Energien und nimm sie auf die Hand.', { t: 'searchEnergy', e: 'M', n: 2 });
  tr('armory', 'Waffenkammer', 'Gegenstand', 'C', 'Durchsuche dein Deck nach bis zu 2 🥊-Energien und nimm sie auf die Hand.', { t: 'searchEnergy', e: 'K', n: 2 });
  tr('blood_bags', 'Blutkonserven', 'Gegenstand', 'C', 'Durchsuche dein Deck nach bis zu 2 🦇-Energien und nimm sie auf die Hand.', { t: 'searchEnergy', e: 'V', n: 2 });
  tr('old_books', 'Stapel alter Bücher', 'Gegenstand', 'C', 'Durchsuche dein Deck nach bis zu 2 🎓-Energien und nimm sie auf die Hand.', { t: 'searchEnergy', e: 'W', n: 2 });
  tr('wrecking', 'Abrissbirne', 'Gegenstand', 'C', 'Lege das Stadion im Spiel ab.', { t: 'discardStadium' });

  // Ausrüstung (1 pro Charakter)
  tr('mr_pointy', 'Mr. Pointy', 'Ausrüstung', 'U', 'Nur an eine Jägerin anlegen. Ihre Angriffe machen 20 Schaden mehr gegen Vampire.', { onlyTag: 'Jägerin', bonus: 20, vsType: 'Vampir' });
  tr('scythe', 'Die Sense', 'Ausrüstung', 'R', 'Nur an eine Jägerin anlegen. Ihre Angriffe machen 30 Schaden mehr.', { onlyTag: 'Jägerin', bonus: 30 });
  tr('leather_coat', 'Ledermantel', 'Ausrüstung', 'U', 'Der Charakter erhält 20 Schaden weniger durch Angriffe.', { reduce: 20 });
  tr('amulet', 'Das Amulett', 'Ausrüstung', 'U', 'Der Charakter hat 40 KP mehr.', { hpBonus: 40 });
  tr('gem_amara', 'Ring von Amara', 'Ausrüstung', 'R', 'Nur an einen Vampir anlegen. Er erhält 30 Schaden weniger durch Kampf-Charaktere und keinen Schaden durch Gegenstände.', { onlyType: 'Vampir', reduce: 30, reduceFromType: ['Kampf'], itemImmune: true });
  tr('rocket_launcher', 'Raketenwerfer', 'Ausrüstung', 'U', 'Angriffe dieses Charakters machen 40 Schaden mehr gegen Big Bads.', { bonus: 40, vsBigBad: true });

  // Stadien
  tr('shame', 'Die Schandtat', 'Stadion', 'U', 'Zwischen den Zügen heilen alle Vampir-Charaktere 10 Schaden.', { t: 'vampRegen', n: 10 });
  tr('sunnydale_high', 'Sunnydale High', 'Stadion', 'C', 'Angriffe von Wissen-Charakteren machen 10 Schaden mehr.', { t: 'typeBonus', type: 'Wissen', n: 10 });
  tr('bronze', 'Das Bronze', 'Stadion', 'C', 'Die Rückzugskosten aller Charaktere sind um 1 geringer.', { t: 'retreatMinus', n: 1 });
  tr('hellmouth', 'Der Höllenschlund', 'Stadion', 'U', 'Angriffe von Dämon-Charakteren machen 20 Schaden mehr.', { t: 'typeBonus', type: 'Dämon', n: 20 });
  tr('lab314', 'Labor 314', 'Stadion', 'U', 'Angriffe von Militär-Charakteren machen 20 Schaden mehr.', { t: 'typeBonus', type: 'Militär', n: 20 });
  tr('restfield', 'Friedhof Restfield', 'Stadion', 'C', 'Angriffe von Kampf-Charakteren machen 10 Schaden mehr.', { t: 'typeBonus', type: 'Kampf', n: 10 });
  tr('crawford', 'Villa in der Crawford Street', 'Stadion', 'U', 'Vampir-Charaktere haben keine Rückzugskosten.', { t: 'retreatZero', type: 'Vampir' });
  tr('acathla', 'Acathlas Grotte', 'Stadion', 'U', 'Zwischen den Zügen erhält jeder aktive Charakter 10 Schaden.', { t: 'endTurnDmg', n: 10 });
  tr('magic_shop_stadium', 'Hinterzimmer des Zauberladens', 'Stadion', 'C', 'Angriffe von Magie-Charakteren machen 10 Schaden mehr.', { t: 'typeBonus', type: 'Magie', n: 10 });

  // Basis-Energie (unbegrenzt verfügbar)
  for (const e of ['K', 'M', 'V', 'W']) {
    CARDS['e_' + e] = { id: 'e_' + e, name: B.ENERGY[e].name + '-Energie', kind: 'energy', energy: e, rarity: 'E' };
  }

  // =====================================================================
  //  MEHR DAWN
  // =====================================================================
  ch('dawn0', 'Dawn – Kleine Schwester', { type: 'Wissen', hp: 60, seasons: '5–6', attacks: [
    a('Kleptomanie', 'W', 10, [{ t: 'discardOppHand', n: 1 }]),
    a('Petze!', 'W*', 30)], flavor: 'Mom! Buffy ist schon wieder auf Patrouille!' });
  ch('dawn_pot', 'Dawn – Potentielle?', { type: 'Kampf', hp: 110, stage: 1, from: 'dawn', rarity: 'U', tags: ['Jägerin'], seasons: '7', attacks: [
    a('Training mit Spike', 'K*', 40),
    a('Schwester der Jägerin', 'KK*', 80, [{ t: 'ifAlly', name: 'Buffy', n: 30 }])], flavor: 'Potentielle – oder doch nicht? Kämpfen kann sie trotzdem.' });
  ch('dawn_portal', 'Dawn – Das Tor öffnet sich', { type: 'Magie', hp: 120, stage: 1, from: 'dawn', rarity: 'R', retreat: 2, seasons: '5', attacks: [
    a('Blut des Schlüssels', 'M*', 30, [{ t: 'energyFromDiscard', e: 'M', n: 2 }]),
    a('Riss zwischen den Welten', 'MMM', 140, [{ t: 'selfDmg', n: 30 }, { t: 'benchAll', n: 10 }])], flavor: 'Wenn die Grenzen der Dimensionen fallen …' });
  tr('dawn_diary', 'Dawns Tagebuch', 'Unterstützer', 'C', 'Ziehe 3 Karten. Ist ein Dawn-Charakter im Spiel, ziehe 1 Karte mehr.', { t: 'drawNamed', n: 3, name: 'Dawn', bonus: 1 });
  tr('key_item', 'Der Schlüssel', 'Gegenstand', 'U', 'Lege bis zu 2 Energien aus deiner Ablage an einen Dawn-Charakter an.', { t: 'energyToNamed', name: 'Dawn', n: 2 });

  // =====================================================================
  //  ERFOLGS-KARTEN (nur über Erfolge erhältlich)
  // =====================================================================
  const P = { rarity: 'P', promo: true };
  ch('p_prom_buffy', 'Buffy – Ballkleid & Armbrust', Object.assign({ type: 'Kampf', hp: 90, tags: ['Jägerin'], seasons: '1, 3', attacks: [
    a('Der Prophezeiung trotzen', 'K*', 40, [{ t: 'vsBigBad', n: 40 }]),
    a('Ballnacht-Bolzen', 'KK', 30, [{ t: 'benchOne', n: 30 }])], flavor: 'Erst die Apokalypse verhindern, dann tanzen.' }, P));
  ch('p_buffybot', 'Buffybot', Object.assign({ type: 'Wissen', hp: 100, seasons: '5–6',
    ability: { kind: 'passive', t: 'reduceDmg', n: 10, name: 'Robotergehäuse', text: 'Erhält 10 Schaden weniger durch Angriffe.' },
    attacks: [a('Wortwitz-Fehlfunktion', 'W*', 30, [{ t: 'coinBonus', n: 30 }]), a('Mechanischer Pfahl', 'WW*', 80, [{ t: 'selfDmg', n: 10 }])] }, P));
  ch('p_xander_hyena', 'Xander – Hyänen-Besessen', Object.assign({ type: 'Dämon', hp: 90, seasons: '1', attacks: [
    a('Rudel-Lachen', 'V*', 20, [{ t: 'perBench', n: 10 }]), a('Wildes Gelächter', 'VV', 60)] }, P));
  ch('p_giles_fyarl', 'Giles – Fyarl-Dämon', Object.assign({ type: 'Dämon', hp: 130, retreat: 2, seasons: '4', attacks: [
    a('Lähmender Schleim', 'V*', 30, [{ t: 'status', s: 'para' }]), a('Hörner des Fyarl', 'VVV', 110)], flavor: 'Ein neuer Mann – mit Hörnern.' }, P));
  ch('p_william', 'William der Blutige', Object.assign({ type: 'Vampir', hp: 100, faction: 'beide', seasons: '2–5', attacks: [
    a('Eisenbahnnagel', 'V*', 50), a('Grausige Poesie', 'VV*', 70, [{ t: 'status', s: 'sleep', coin: true }])] }, P));
  ch('p_faith_swap', 'Faith – Im falschen Körper', Object.assign({ type: 'Kampf', hp: 110, tags: ['Jägerin'], faction: 'beide', seasons: '4', attacks: [
    a('Wer bist du?', 'K*', 30, [{ t: 'switchSelf' }]), a('Spiegelbild', 'KK*', 90, [{ t: 'ifDamaged', n: 20 }])] }, P));
  ch('p_doublemeat', 'Buffy – Doublemeat Palace', Object.assign({ type: 'Kampf', hp: 90, tags: ['Jägerin'], seasons: '6',
    ability: { kind: 'active', t: 'draw', n: 1, name: 'Doppelschicht', text: 'Einmal pro Zug: Ziehe 1 Karte.' },
    attacks: [a('Geheimrezept', 'K*', 40, [{ t: 'healSelf', n: 20 }])] }, P));
  ch('p_xander_renfield', 'Xander – Draculas Diener', Object.assign({ type: 'Wissen', hp: 70, seasons: '5', attacks: [
    a('Insekten-Snack', 'W', 10, [{ t: 'healSelf', n: 30 }]), a('Ja, Meister!', 'W*', 30, [{ t: 'gustBefore' }])] }, P));
  ch('p_vamp_xander', 'Vampir-Xander', Object.assign({ type: 'Vampir', hp: 90, faction: 'böse', seasons: '3', attacks: [
    a('Wunschwelt-Biss', 'V*', 40, [{ t: 'lifesteal' }]), a('Herrscher des Bronze', 'VV*', 70)] }, P));
  ch('p_joyce_candy', 'Joyce – Band Candy', Object.assign({ type: 'Wissen', hp: 80, seasons: '3',
    ability: { kind: 'active', t: 'healAll', n: 10, name: 'Mutterinstinkt', text: 'Einmal pro Zug: Heile 10 Schaden bei jedem deiner Charaktere.' },
    attacks: [a('Teenager-Rebellion', 'W*', 40, [{ t: 'coinBonus', n: 40 }])] }, P));
  ch('p_anya_bunny', 'Anya – Hasenkostüm', Object.assign({ type: 'Wissen', hp: 80, seasons: '4', attacks: [
    a('Hasen-Alarm!', 'W', 0, [{ t: 'draw', n: 2 }, { t: 'switchSelf' }]), a('Kapitalistische Wut', 'WW*', 70)] }, P));
  ch('p_dawn_heir', 'Dawn – Erbin der Sense', Object.assign({ type: 'Kampf', hp: 170, stage: 2, from: 'dawn_pot', retreat: 2, tags: ['Jägerin'], seasons: '7', attacks: [
    a('Der Schlüssel öffnet alles', 'K', 0, [{ t: 'energyFromDiscard', e: 'K', n: 2 }]),
    a('Schwester der Auserwählten', 'KK**', 150, [{ t: 'ifAlly', name: 'Buffy', n: 40 }])], flavor: 'Aus Energie gemacht – und aus purem Willen.' }, P));
  tr('p_umbrella', 'Klassenbeschützer-Schirm', 'Ausrüstung', 'P', 'Der Charakter hat 30 KP mehr und erhält 10 Schaden weniger durch Angriffe.', { hpBonus: 30, reduce: 10 }, P);
  tr('p_mr_gordo', 'Mr. Gordo', 'Gegenstand', 'P', 'Heile 20 Schaden bei jedem deiner Charaktere. Ziehe 1 Karte.', { t: 'healAllDraw', n: 20, d: 1 }, P);
  tr('p_orb', 'Orb von Thesulah', 'Gegenstand', 'P', 'Heile 60 Schaden bei einem deiner Vampir-Charaktere und entferne alle Zustände.', { t: 'healPick', n: 60, type: 'Vampir', clear: true }, P);
  tr('p_crater', 'Krater von Sunnydale', 'Stadion', 'P', 'Alle Angriffe machen 10 Schaden mehr.', { t: 'allBonus', n: 10 }, P);
  tr('p_slayer_army', 'Erweckung aller Jägerinnen', 'Unterstützer', 'P', 'Durchsuche dein Deck nach bis zu 3 Basis-Jägerinnen und lege sie auf deine Bank.', { t: 'searchDeck', filter: 'jaegerinBasic', n: 3, to: 'bench' }, P);
  tr('p_musical', 'Once More, with Feeling', 'Stadion', 'P', 'Zwischen den Zügen heilt jeder aktive Charakter 10 Schaden.', { t: 'endTurnHeal', n: 10 }, P);
  tr('p_wish', 'Der Wunsch', 'Unterstützer', 'P', 'Mische deine Hand in dein Deck. Ziehe dann 7 Karten.', { t: 'shuffleDraw', n: 7 }, P);
  tr('p_slayer_handbook', 'Handbuch der Jägerin', 'Gegenstand', 'P', 'Durchsuche dein Deck nach einer Jägerin (beliebige Stufe) und nimm sie auf die Hand.', { t: 'searchDeck', filter: 'jaegerin', n: 1 }, P);

  B.CARDS = CARDS;

  // ---------- Hilfsfunktionen für Kartentexte ----------
  const SN = { para: 'gelähmt', sleep: 'schläft ein', poison: 'vergiftet', burn: 'verbrannt' };
  B.STATUS_NAMES = { para: 'Gelähmt', sleep: 'Schläft', poison: 'Vergiftet', burn: 'Verbrannt' };
  B.costIcons = (c) => c.split('').map((s) => B.ENERGY[s].icon).join('');
  B.fxText = function (fx) {
    const out = [];
    for (const f of fx) {
      switch (f.t) {
        case 'vsType': out.push(`+${f.n} Schaden gegen ${f.type}-Charaktere.`); break;
        case 'vsTag': out.push(`+${f.n} Schaden gegen Jägerinnen.`); break;
        case 'vsBigBad': out.push(`+${f.n} Schaden gegen Big Bads.`); break;
        case 'ifAlly': out.push(`+${f.n} Schaden, wenn eine ${f.name}-Karte in deinem Spiel ist.`); break;
        case 'coinBonus': out.push(`Wirf eine Münze. Kopf: +${f.n} Schaden.`); break;
        case 'coinFail': out.push('Wirf eine Münze. Zahl: Dieser Angriff bewirkt nichts.'); break;
        case 'coins': out.push(`Wirf ${f.k} Münzen. ${f.per} Schaden pro Kopf.`); break;
        case 'perBench': out.push(`+${f.n} Schaden für jeden Charakter auf deiner Bank.`); break;
        case 'perDamageSelf': out.push(`+${f.n} Schaden pro 10 Schaden auf diesem Charakter.`); break;
        case 'ifDamaged': out.push(`+${f.n} Schaden, wenn der Verteidiger bereits Schaden hat.`); break;
        case 'ifStatus': out.push(`+${f.n} Schaden, wenn der Verteidiger einen Zustand hat.`); break;
        case 'gustBefore': out.push('Tausche vorher einen Charakter von der gegnerischen Bank mit dessen aktivem Charakter. Der Schaden trifft den neuen aktiven Charakter.'); break;
        case 'draw': out.push(`Ziehe ${f.n} Karte${f.n > 1 ? 'n' : ''}.`); break;
        case 'healSelf': out.push(`Heile ${f.n} Schaden bei diesem Charakter.`); break;
        case 'selfDmg': out.push(`Dieser Charakter erhält ${f.n} Schaden.`); break;
        case 'discardSelfEnergy': out.push(`Lege ${f.n} Energie von diesem Charakter ab.`); break;
        case 'status': out.push((f.coin ? 'Wirf eine Münze. Kopf: ' : '') + `Der Verteidiger ${f.s === 'sleep' ? 'schläft ein' : 'ist ' + SN[f.s]}.`); break;
        case 'benchOne': out.push(`Ein Charakter auf der gegnerischen Bank erhält ${f.n} Schaden.`); break;
        case 'benchAll': out.push(`Jeder Charakter auf der gegnerischen Bank erhält ${f.n} Schaden.`); break;
        case 'lifesteal': out.push('Heile so viel Schaden bei diesem Charakter, wie du zugefügt hast.'); break;
        case 'searchBasic': out.push(`Durchsuche dein Deck nach bis zu ${f.n} ${f.type ? f.type + '-' : ''}Basis-Charakter${f.n > 1 ? 'en' : ''} und lege sie auf deine Bank.`); break;
        case 'energyFromDiscard': out.push(`Lege bis zu ${f.n} ${B.ENERGY[f.e].icon}-Energie aus deiner Ablage an diesen Charakter an.`); break;
        case 'energyFromDiscardPick': out.push(`Lege bis zu ${f.n} ${B.ENERGY[f.e].icon}-Energie aus deiner Ablage an einen deiner Charaktere an.`); break;
        case 'switchSelf': out.push('Du darfst diesen Charakter danach gegen einen Charakter auf deiner Bank tauschen.'); break;
        case 'preventNext': out.push((f.coin ? 'Wirf eine Münze. Kopf: ' : '') + 'Verhindere im nächsten Zug des Gegners jeglichen Schaden an diesem Charakter.'); break;
        case 'discardOppHand': out.push(`Dein Gegner legt ${f.n} zufällige Karte${f.n > 1 ? 'n' : ''} von seiner Hand ab.`); break;
        case 'healAllOwn': out.push(`Heile ${f.n} Schaden bei jedem deiner Charaktere.`); break;
        case 'searchTool': out.push('Durchsuche dein Deck nach einer Ausrüstung und nimm sie auf die Hand.'); break;
        case 'discardOppTool': out.push('Lege eine Ausrüstung vom aktiven Charakter des Gegners ab.'); break;
        case 'healOwnPick': out.push(`Heile ${f.n} Schaden bei einem deiner Charaktere.`); break;
        default: break;
      }
    }
    return out.join(' ');
  };
  B.stageName = (c) => (c.kind !== 'char' ? '' : c.stage === 0 ? 'Basis' : 'Stufe ' + c.stage);
  B.rarityName = { C: 'Gewöhnlich', U: 'Ungewöhnlich', R: 'Selten', L: 'Legendär', P: 'Erfolgs-Karte', E: 'Energie' };
  B.rarityIcon = { C: '●', U: '◆', R: '★', L: '★★', P: '✦', E: '' };
  B.tradeCost = function (c) {
    const tc = B.CONFIG.TRADE_COST;
    if (c.kind === 'char' && c.bigBad) return tc.bigbad;
    if (c.kind === 'char' && c.stage === 2) return tc.stufe2;
    if (c.kind === 'char' && c.stage === 1) return tc.stufe1;
    return tc.basis;
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
