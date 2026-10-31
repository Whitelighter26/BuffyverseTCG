/* Buffyverse TCG – Übersetzungen / Translations (Standard: Englisch) */
(function (G) {
  const B = G.BTCG;
  B.lang = 'en';
  B.setLang = (l) => { B.lang = l === 'de' ? 'de' : 'en'; };

  const D = {}; // Wörterbuch: D[key] = { en, de }
  const add = (obj) => Object.entries(obj).forEach(([k, v]) => (D[k] = { en: v[0], de: v[1] }));

  // ---------- Template-Auflösung ----------
  function resolve(v) {
    if (v == null) return '';
    if (typeof v === 'object' && v.k) return B.t(v.k, v.p);
    if (typeof v !== 'string') return String(v);
    if (v[0] === '@') return B.cn(v.slice(1));
    if (v[0] === '%') return B.typeName(v.slice(1));
    if (v[0] === '¤') return B.abn(v.slice(1));
    if (v[0] === '§') { const [id, i] = v.slice(1).split(':'); return B.an(id, +i); }
    return v;
  }
  B.t = function (key, p) {
    const e = D[key];
    let s = e ? (e[B.lang] != null ? e[B.lang] : e.en) : key;
    if (p) s = s.replace(/\{(\w+)\}/g, (_, k) => (k in p ? resolve(p[k]) : '{' + k + '}'));
    return s;
  };
  B.tr = (m) => (m == null ? '' : typeof m === 'object' ? (m.k ? B.t(m.k, m.p) : '') : resolve(m));
  B.hasKey = (k) => !!D[k];

  // ---------- Karten ----------
  const EN = () => B.CARD_EN || {};
  const en = () => B.lang === 'en';
  B.cn = (id) => { const c = B.CARDS[id]; if (!c) return id; return (en() && EN()[id] && EN()[id].n) || c.name; };
  B.an = (id, i) => { const c = B.CARDS[id]; return (en() && EN()[id] && EN()[id].a && EN()[id].a[i]) || (c && c.attacks[i] ? c.attacks[i].name : ''); };
  B.abn = (id) => { const c = B.CARDS[id]; return (en() && EN()[id] && EN()[id].ab && EN()[id].ab[0]) || (c && c.ability ? c.ability.name : ''); };
  B.abt = (id) => { const c = B.CARDS[id]; return (en() && EN()[id] && EN()[id].ab && EN()[id].ab[1]) || (c && c.ability ? c.ability.text : ''); };
  B.ttext = (id) => { const c = B.CARDS[id]; return (en() && EN()[id] && EN()[id].t) || (c && c.text) || ''; };
  B.flav = (id) => { const c = B.CARDS[id]; return (en() && EN()[id] && EN()[id].f) || (c && c.flavor) || ''; };
  const TYPE_EN = { Kampf: 'Fight', Magie: 'Magic', Vampir: 'Vampire', 'Dämon': 'Demon', Wissen: 'Knowledge', 'Militär': 'Military' };
  B.typeName = (ty) => (en() ? TYPE_EN[ty] || ty : ty);
  B.subName = (sub) => B.t('sub.' + sub);
  B.stageName = (c) => (c.kind !== 'char' ? '' : c.stage === 0 ? B.t('c.basic') : B.t('c.stage', { n: c.stage }));
  B.rarityName = (r) => B.t('rar.' + r);
  B.statusName = (s) => B.t('status.' + s);

  // ---------- Effekt-Texte ----------
  const DE_FX = B.fxText; // Original (deutsch) aus cards.js
  function fxEN(fx) {
    const out = [];
    const n1 = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
    for (const f of fx) {
      switch (f.t) {
        case 'vsType': out.push(`+${f.n} damage against ${B.typeName(f.type)} characters.`); break;
        case 'vsTag': out.push(`+${f.n} damage against Slayers.`); break;
        case 'vsBigBad': out.push(`+${f.n} damage against Big Bads.`); break;
        case 'ifAlly': out.push(`+${f.n} damage if you have a ${f.name} card in play.`); break;
        case 'coinBonus': out.push(`Flip a coin. If heads, +${f.n} damage.`); break;
        case 'coinFail': out.push('Flip a coin. If tails, this attack does nothing.'); break;
        case 'coins': out.push(`Flip ${f.k} coins. ${f.per} damage for each heads.`); break;
        case 'perBench': out.push(`+${f.n} damage for each of your Benched characters.`); break;
        case 'perDamageSelf': out.push(`+${f.n} damage for each 10 damage on this character.`); break;
        case 'ifDamaged': out.push(`+${f.n} damage if the Defending character already has damage.`); break;
        case 'ifStatus': out.push(`+${f.n} damage if the Defending character has a Special Condition.`); break;
        case 'gustBefore': out.push("First, switch 1 of your opponent's Benched characters with their Active character. The damage hits the new Active character."); break;
        case 'draw': out.push(`Draw ${n1(f.n, 'card')}.`); break;
        case 'healSelf': out.push(`Heal ${f.n} damage from this character.`); break;
        case 'selfDmg': out.push(`This character does ${f.n} damage to itself.`); break;
        case 'discardSelfEnergy': out.push(`Discard ${f.n} Energy from this character.`); break;
        case 'status': out.push((f.coin ? 'Flip a coin. If heads, the' : 'The') + ` Defending character is now ${B.t('status.' + f.s)}.`); break;
        case 'benchOne': out.push(`Do ${f.n} damage to 1 of your opponent's Benched characters.`); break;
        case 'benchAll': out.push(`Do ${f.n} damage to each of your opponent's Benched characters.`); break;
        case 'lifesteal': out.push('Heal from this character the same amount of damage you did.'); break;
        case 'searchBasic': out.push(`Search your deck for up to ${f.n} ${f.type ? B.typeName(f.type) + ' ' : ''}Basic character${f.n > 1 ? 's' : ''} and put ${f.n > 1 ? 'them' : 'it'} onto your Bench.`); break;
        case 'energyFromDiscard': out.push(`Attach up to ${f.n} ${B.ENERGY[f.e].icon} Energy from your discard pile to this character.`); break;
        case 'energyFromDiscardPick': out.push(`Attach up to ${f.n} ${B.ENERGY[f.e].icon} Energy from your discard pile to one of your characters.`); break;
        case 'switchSelf': out.push('You may switch this character with 1 of your Benched characters afterwards.'); break;
        case 'preventNext': out.push((f.coin ? 'Flip a coin. If heads, prevent' : 'Prevent') + " all damage done to this character during your opponent's next turn."); break;
        case 'discardOppHand': out.push(`Your opponent discards ${n1(f.n, 'random card')} from their hand.`); break;
        case 'healAllOwn': out.push(`Heal ${f.n} damage from each of your characters.`); break;
        case 'searchTool': out.push('Search your deck for a Tool and put it into your hand.'); break;
        case 'discardOppTool': out.push("Discard a Tool from your opponent's Active character."); break;
        case 'healOwnPick': out.push(`Heal ${f.n} damage from one of your characters.`); break;
        default: break;
      }
    }
    return out.join(' ');
  }
  B.fxText = (fx) => (en() ? fxEN(fx) : DE_FX(fx));

  // =====================================================================
  //  Wörterbuch  [English, Deutsch]
  // =====================================================================
  add({
    // allgemein
    'common.cancel': ['Cancel', 'Abbrechen'], 'common.confirm': ['Confirm', 'Bestätigen'], 'common.menu': ['Menu', 'Menü'], 'common.close': ['Close', 'Schließen'], 'common.save': ['Save', 'Speichern'],
    'w.heads': ['Heads', 'Kopf'], 'w.tails': ['Tails', 'Zahl'],
    'status.para': ['Paralyzed', 'Gelähmt'], 'status.sleep': ['Asleep', 'Schläft'], 'status.poison': ['Poisoned', 'Vergiftet'], 'status.burn': ['Burned', 'Verbrannt'],
    'sub.Unterstützer': ['Supporter', 'Unterstützer'], 'sub.Gegenstand': ['Item', 'Gegenstand'], 'sub.Ausrüstung': ['Tool', 'Ausrüstung'], 'sub.Stadion': ['Stadium', 'Stadion'],
    'rar.C': ['Common', 'Gewöhnlich'], 'rar.U': ['Uncommon', 'Ungewöhnlich'], 'rar.R': ['Rare', 'Selten'], 'rar.L': ['Legendary', 'Legendär'], 'rar.P': ['Achievement card', 'Erfolgs-Karte'], 'rar.E': ['Energy', 'Energie'],
    'lv.beginner': ['Beginner', 'Beginner'], 'lv.erfahren': ['Experienced', 'Erfahren'], 'lv.profi': ['Pro', 'Profi'],
    'lv.beginner.d': ['Plays from the gut. Great for learning the rules.', 'Spielt eher aus dem Bauch heraus. Gut zum Regeln-Lernen.'],
    'lv.erfahren.d': ['Weighs every move, but still makes mistakes.', 'Bewertet jeden Zug, macht aber noch Fehler.'],
    'lv.profi.d': ['Plans knockouts, draws first and protects its Big Bads.', 'Plant K.O.s, zieht erst Karten, schützt seine Big Bads.'],

    // Karten
    'c.hp': ['HP', 'KP'], 'c.basic': ['Basic', 'Basis'], 'c.stage': ['Stage {n}', 'Stufe {n}'], 'c.from': ['from {n}', 'aus {n}'], 'c.season': ['Season {s}', 'Staffel {s}'],
    'c.weak': ['Weakness', 'Schwäche'], 'c.res': ['Resist.', 'Resist.'], 'c.retreat': ['Retreat', 'Rückzug'], 'c.basicEnergy': ['Basic Energy', 'Basis-Energie'], 'c.new': ['NEW', 'NEU'],
    'c.rule.Unterstützer': ['1 Supporter per turn', '1 Unterstützer pro Zug'], 'c.rule.Stadion': ['Stays in play', 'Bleibt im Spiel'], 'c.rule.Ausrüstung': ['1 per character', '1 pro Charakter'], 'c.rule.Gegenstand': ['Any number per turn', 'Beliebig oft'],
    'c.rarity': ['Rarity', 'Seltenheit'], 'c.inColl': ['In your collection', 'In deiner Sammlung'], 'c.tradeValue': ['Wish-card price: {n}× of one card', 'Tauschwert als Wunschkarte: {n}× einer Karte'],
    'c.promoFrom': ['✦ Only as a reward for {a}.', '✦ Nur als Belohnung für {a}.'], 'c.secretAch': ['a secret achievement', 'einen geheimen Erfolg'],
    'c.faction': ['Faction', 'Fraktion'], 'c.fac.good': ['Scoobies & allies', 'Scoobies & Verbündete'], 'c.fac.evil': ['Baddies', 'Baddies'], 'c.fac.both': ['Switches sides', 'Wechselt die Seiten'],
    'c.pickImg': ['Choose your own image', 'Eigenes Bild wählen'], 'c.delImg': ['Remove image', 'Bild entfernen'], 'c.imgSaved': ['Image saved – only on this device.', 'Bild gespeichert – nur auf diesem Gerät.'],
    'c.imgErr': ["The image couldn't be loaded.", 'Das Bild konnte nicht geladen werden.'], 'c.imgDeleted': ['Custom image removed.', 'Eigenes Bild entfernt.'],
    'c.imgHint': ['Custom images are cropped to 5:3 and stay on this device.', 'Eigene Bilder werden auf 5:3 zugeschnitten und bleiben lokal auf diesem Gerät gespeichert.'],
    'c.search': ['Search …', 'Suchen …'], 'c.all': ['All', 'Alle'], 'c.chars': ['Characters', 'Charaktere'], 'c.support': ['Support', 'Support'], 'c.allTypes': ['All types', 'Alle Typen'],
    'c.allSeasons': ['All seasons', 'Alle Staffeln'], 'c.mine': ['Mine only', 'Nur meine'], 'c.none': ['No cards found.', 'Keine Karten gefunden.'], 'c.count': ['{n} of {max} collected', '{n} von {max} gesammelt'],

    // Menü
    'm.subtitle': ['The Trading Card Game · Seasons 1 to 7', 'Das Sammelkartenspiel · Staffel 1 bis 7'],
    'm.play': ['Play', 'Spielen'], 'm.playSub': ['vs. AI or a friend', 'gegen KI oder zu zweit'], 'm.story': ['Story Mode', 'Story-Modus'], 'm.storySub': ['{n} / {max} chapters', '{n} / {max} Kapitel'],
    'm.booster': ['Boosters', 'Booster'], 'm.boosterReady': ['{n} ready to open', '{n} zum Öffnen bereit'], 'm.boosterTomorrow': ['new ones tomorrow', 'morgen gibt es neue'],
    'm.collection': ['Collection', 'Sammlung'], 'm.cards': ['{n} / {max} cards', '{n} / {max} Karten'], 'm.decks': ['Decks', 'Decks'], 'm.decksSub': ['{n} saved', '{n} gespeichert'],
    'm.trade': ['Trading Post', 'Tauschbörse'], 'm.tradeSub': ['Duplicates → wish card', 'Duplikate → Wunschkarte'], 'm.ach': ['Achievements', 'Erfolge'], 'm.achSub': ['{n} / {max} unlocked', '{n} / {max} freigeschaltet'],
    'm.tutorial': ['Tutorial', 'Tutorial'], 'm.tutorialSub': ['Learn by playing', 'Spielend lernen'], 'm.tutorialDone': ['completed', 'abgeschlossen'],
    'm.rules': ['Rules', 'Regeln'], 'm.rulesSub': ['Short & sweet', 'Kurz & knackig'], 'm.settings': ['Settings', 'Einstellungen'], 'm.settingsSub': ['Language, sound, save', 'Sprache, Ton, Spielstand'],
    'm.stats': ['Played: {p} · Won: {w}', 'Gespielt: {p} · Gewonnen: {w}'], 'm.version': ['Version {v} · Version history', 'Version {v} · Versionshistorie'],

    // Spiel vorbereiten
    'p.title': ['New Game', 'Neues Spiel'], 'p.mode': ['Mode', 'Modus'], 'p.vsAI': ['vs. AI', 'Gegen die KI'], 'p.vsAId': ['Three difficulty levels, counts for stats & achievements.', 'Drei Schwierigkeitsstufen, zählt für Statistik & Erfolge.'],
    'p.vs2': ['2 Players', '2 Spieler'], 'p.vs2d': ['Hotseat on one device – hands are hidden when you pass it over.', 'An einem Gerät – beim Weitergeben wird die Hand verdeckt.'],
    'p.yourDeck': ['Your deck', 'Dein Deck'], 'p.p1Deck': ['Deck for {p}', 'Deck für {p}'], 'p.level': ['Difficulty', 'Schwierigkeit'], 'p.oppDeck': ['Opponent deck', 'Gegner-Deck'],
    'p.random': ['Random', 'Zufällig'], 'p.randomD': ['Surprise me!', 'Überrasch mich!'], 'p.ready': ['ready to play', 'spielbereit'], 'p.start': ['Go on patrol!', 'Auf Patrouille!'],
    'p.p2': ['Player 2', 'Spieler 2'], 'p.p2Deck': ['Deck for player 2', 'Deck für Spieler 2'], 'p.fromColl': ['from your collection', 'aus deiner Sammlung'], 'p.loaner': ['loaner deck', 'Leih-Deck'],
    'p.hotseatHint': ['2-player games don\'t count towards stats or achievements.', '2-Spieler-Partien zählen nicht für Statistik und Erfolge.'],
    'p.player1': ['Slayer', 'Jägerin'], 'p.player2': ['Player 2', 'Spieler 2'], 'p.pickDeck': ['Please choose a deck.', 'Bitte wähle ein Deck.'],

    // Spiel
    'g.aiName': ['{d} (AI)', '{d} (KI)'], 'g.begins': ['{p} goes first!', '{p} beginnt!'], 'g.quit': ['Give up', 'Aufgeben'], 'g.quitQ': ['Give up?', 'Aufgeben?'],
    'g.quitT': ['The game counts as a loss.', 'Das Spiel zählt als Niederlage.'], 'g.quitT2': ['The game will end.', 'Das Spiel wird beendet.'], 'g.log': ['Log', 'Log'],
    'g.endTurn': ['End turn', 'Zug beenden'], 'g.noActive': ['no Active character', 'kein aktiver Charakter'], 'g.kos': ['K.O.s', 'K.O.s'], 'g.tapHint': ['Tap or drag a card to play it.', 'Tippe oder ziehe eine Karte, um sie zu spielen.'],
    'g.benchEmpty': ['Bench empty', 'Bank leer'], 'g.noStadium': ['No stadium', 'Kein Stadion'], 'g.discard': ['Discard', 'Ablage'], 'g.over': ['Game over', 'Spiel vorbei'], 'g.setupPhase': ['Setup', 'Aufstellung'],
    'g.yourTurn': ["It's your turn", 'Du bist dran'], 'g.theirTurn': ["{p}'s turn …", '{p} ist dran …'], 'g.turnN': ['Turn {n}', 'Zug {n}'],
    'g.flags': ['Energy {e} · Supporter {s} · Retreat {r}', 'Energie {e} · Unterstützer {s} · Rückzug {r}'], 'g.firstTurnHint': ['First turn: no attack, no Supporter.', 'Erster Zug: kein Angriff, kein Unterstützer.'],
    'g.weakFx': ['WEAKNESS!', 'SCHWÄCHE!'], 'g.ko': ['{c} is knocked out!', '{c} ist K.O.!'], 'g.koBig': ['{c} is knocked out! (counts double)', '{c} ist K.O.! (zählt doppelt)'],
    'g.miss': ['Missed!', 'Daneben!'], 'g.noDmg': ['No damage', 'Kein Schaden'], 'g.plays': ['{p} plays: {c}', '{p} spielt: {c}'], 'g.oppHand': ["Opponent's hand", 'Hand des Gegners'], 'g.empty': ['empty', 'leer'],
    'g.turnOf': ["{p}'s turn", '{p} ist dran'], 'g.yourTurnBanner': ['Your turn', 'Dein Zug'],
    'g.handTo': ['Pass the device to {p}', 'Übergib an {p}'], 'g.handHint': ['Everyone else: no peeking! 👀', 'Alle anderen: nicht spicken! 👀'], 'g.ready': ["I'm ready", 'Bereit'],
    'g.setupHint': ['First tap your <b style="color:var(--ink)">Active</b> character, then any number for your <b style="color:var(--ink)">Bench</b> (max. 5).', 'Tippe zuerst deinen <b style="color:var(--ink)">aktiven</b> Charakter an, danach beliebig viele für die <b style="color:var(--ink)">Bank</b> (max. 5).'],
    'g.setupTitle': ['Setup', 'Aufstellung'], 'g.auto': ['Automatic', 'Automatisch'], 'g.letsGo': ["Let's go", "Los geht's"], 'g.pickActiveFirst': ['Choose an Active character first.', 'Wähle zuerst einen aktiven Charakter.'],
    'g.active': ['ACTIVE', 'AKTIV'], 'g.bench': ['BENCH', 'BANK'], 'g.promoteQ': ['{p}Your Active character was knocked out – who steps up?', '{p}Dein aktiver Charakter ist K.O. – wer rückt nach?'],
    'g.endQ': ['End turn?', 'Zug beenden?'], 'g.endQt': ['You could still attack. End anyway?', 'Du könntest noch angreifen. Trotzdem beenden?'],
    'g.wait': ['Wait until it is your turn.', 'Warte, bis du am Zug bist.'], 'g.toBench': ['Put on Bench', 'Auf die Bank'], 'g.evolveOn': ['Evolve: {c}', 'Entwickeln: {c}'],
    'g.noEvoFirst': ["You can't evolve during your first turn.", 'Im ersten Zug darfst du nicht entwickeln.'], 'g.needBase': ['You need “{c}” in play (not put down this turn).', 'Du brauchst „{c}“ im Spiel (nicht erst in diesem Zug gelegt).'],
    'g.benchFull': ['Your Bench is full.', 'Deine Bank ist voll.'], 'g.attachTo': ['Attach to {c}', 'Anlegen an {c}'], 'g.activeShort': ['active', 'aktiv'], 'g.energyDone': ['You already attached an Energy this turn.', 'Du hast in diesem Zug schon eine Energie angelegt.'],
    'g.playCard': ['Play {s}', '{s} ausspielen'], 'g.notPlayable': ["Can't be played right now.", 'Gerade nicht spielbar.'], 'g.energy': ['Energy', 'Energie'], 'g.none': ['none', 'keine'],
    'g.tool': ['Tool', 'Ausrüstung'], 'g.status': ['Condition', 'Zustand'], 'g.evolvedFrom': ['Evolved from', 'Entwickelt aus'], 'g.weakShort': ['Weakness!', 'Schwäche!'],
    'g.retreat': ['Retreat (cost: {c})', 'Rückzug (Kosten: {c})'], 'g.free': ['free', 'gratis'], 'g.dropPlay': ['Drop here to play', 'Hier ablegen zum Ausspielen'], 'g.dropStadium': ['Stadium goes here', 'Stadion hierher'],
    'g.discardOf': ['Discard pile – {p}', 'Ablage – {p}'], 'g.victory': ['Victory!', 'Sieg!'], 'g.defeat': ['Defeat', 'Niederlage'], 'g.wins': ['{p} wins!', '{p} gewinnt!'],
    'g.winLine': ['Sunnydale is safe again – at least until tomorrow.', 'Sunnydale ist wieder sicher – zumindest bis morgen.'], 'g.loseLine': ['The Hellmouth won today.', 'Der Höllenschlund hat heute gewonnen.'],
    'g.hotEnd': ['What a duel! Rematch?', 'Was für ein Duell! Revanche?'], 'g.balance': ['Record vs. “{l}”: {w} wins in {p} games.', 'Bilanz gegen „{l}“: {w} Siege aus {p} Spielen.'], 'g.rematch': ['Rematch', 'Revanche'],

    // Auswahl
    'pick.exact': ['Choose {n}.', 'Wähle {n}.'], 'pick.range': ['Choose {a} to {b}.', 'Wähle {a} bis {b}.'], 'pick.upTo': ['Choose up to {n}.', 'Wähle bis zu {n}.'],
    'pick.optional': ['Optional – you can also confirm without choosing.', 'Optional – du kannst auch ohne Auswahl bestätigen.'], 'pick.tap': ['Tap your choice.', 'Tippe deine Wahl an.'], 'pick.min': ['Please choose at least {n}.', 'Bitte mindestens {n} wählen.'],
    'pick.tool': ['Attach {c} to which character?', '{c} an welchen Charakter anlegen?'], 'pick.deckCards': ['Choose cards from your deck', 'Wähle Karten aus deinem Deck'],
    'pick.gust': ["Which of your opponent's Benched characters comes forward?", 'Welcher gegnerische Bank-Charakter soll nach vorne?'], 'pick.benchDmg': ['Which Benched character takes {n} damage?', 'Welcher Bank-Charakter erhält {n} Schaden?'],
    'pick.topPick': ['Put {n} cards into your hand', 'Nimm {n} Karten auf die Hand'], 'pick.heal': ['Heal whom?', 'Wen heilen?'], 'pick.energyDiscard': ['Which Energy from the discard pile?', 'Welche Energie aus der Ablage?'],
    'pick.attachTo': ['Attach to which character?', 'An welchen Charakter anlegen?'], 'pick.whoForward': ['Who comes forward?', 'Wer kommt nach vorne?'], 'pick.named': ['To which {n} character?', 'An welchen {n}-Charakter?'],
    'pick.recover': ['Which character goes back to your hand?', 'Welchen Charakter zurück auf die Hand?'], 'pick.abAttach': ['{a}: To which character?', '{a}: An welchen Charakter?'], 'pick.abHeal': ['{a}: Heal whom?', '{a}: Wen heilen?'],
    'pick.abDiscard': ['{a}: Which card do you discard?', '{a}: Welche Karte ablegen?'], 'pick.abEnergy': ['{a}: Which Energy?', '{a}: Welche Energie?'], 'pick.searchBasic': ['Put Basic characters onto your Bench', 'Basis-Charaktere auf die Bank legen'],
    'pick.searchTool': ['Put a Tool into your hand', 'Ausrüstung auf die Hand nehmen'], 'pick.switchOpt': ['Retreat afterwards? (optional)', 'Danach zurückziehen? (optional)'], 'pick.efd': ['Attach Energy to which character?', 'An welchen Charakter Energie anlegen?'],

    // Regel-Hinweise (Engine)
    'err.noActive': ['No Active character.', 'Kein aktiver Charakter.'], 'err.firstAttack': ["Whoever goes first can't attack on their first turn.", 'Wer beginnt, darf im ersten Zug nicht angreifen.'],
    'err.para': ['Paralyzed.', 'Gelähmt.'], 'err.sleep': ['Asleep.', 'Schläft.'], 'err.cantAttack': ["Can't attack this turn.", 'Kann in diesem Zug nicht angreifen.'],
    'err.chip': ['The Chip: a Military character is in play.', 'Der Chip: Ein Militär-Charakter ist im Spiel.'], 'err.unknownAttack': ['Unknown attack.', 'Unbekannter Angriff.'], 'err.energy': ['Not enough Energy.', 'Nicht genug Energie.'],
    'err.retreatDone': ['You already retreated this turn.', 'Du hast dich in diesem Zug schon zurückgezogen.'], 'err.noBench': ['No Bench.', 'Keine Bank.'], 'err.noRetreat': ["{a}: can't retreat.", '{a}: Kein Rückzug möglich.'],
    'err.paraSleep': ['Paralyzed or asleep.', 'Gelähmt oder schlafend.'], 'err.retreatEnergy': ['Not enough Energy to retreat.', 'Nicht genug Energie für den Rückzug.'],
    'err.firstSupporter': ["You can't play a Supporter on your first turn.", 'Im ersten Zug darfst du keinen Unterstützer spielen.'], 'err.oneSupporter': ['Only 1 Supporter per turn.', 'Nur 1 Unterstützer pro Zug.'],
    'err.oneStadium': ['Only 1 Stadium per turn.', 'Nur 1 Stadion pro Zug.'], 'err.stadiumInPlay': ['This Stadium is already in play.', 'Dieses Stadion ist schon im Spiel.'], 'err.noToolTarget': ['No suitable character without a Tool.', 'Kein passender Charakter ohne Ausrüstung.'],
    'err.oppNoBench': ['Your opponent has no Bench.', 'Der Gegner hat keine Bank.'], 'err.noHealTarget': ['No suitable damaged character.', 'Kein passender verletzter Charakter.'], 'err.oppNotType': ["Your opponent's Active character isn't a {t}.", 'Der aktive Gegner ist kein {t}.'],
    'err.noCharDiscard': ['No character in your discard pile.', 'Kein Charakter in der Ablage.'], 'err.noEnergyDiscard': ['No Energy in your discard pile.', 'Keine Energie in der Ablage.'], 'err.noStadium': ['No Stadium in play.', 'Kein Stadion im Spiel.'],
    'err.noNamed': ['No {n} character in play.', 'Kein {n}-Charakter im Spiel.'], 'err.deckEmpty': ['Your deck is empty.', 'Dein Deck ist leer.'], 'err.benchFull': ['Your Bench is full.', 'Deine Bank ist voll.'],
    'err.noAbility': ['No usable ability.', 'Keine aktivierbare Fähigkeit.'], 'err.abilityUsed': ['Already used this turn.', 'Schon in diesem Zug benutzt.'], 'err.needActive': ['Only while this character is Active.', 'Nur wenn der Charakter aktiv ist.'],
    'err.noEnergyDiscardType': ['No matching Energy in your discard pile.', 'Keine passende Energie in der Ablage.'], 'err.nothingToDiscard': ['No card to discard.', 'Keine Karte zum Ablegen.'], 'err.noneHurt': ['Nobody is hurt.', 'Niemand ist verletzt.'],
    'err.noEnergyHand': ['No Energy in your hand.', 'Keine Energie auf der Hand.'], 'err.noOpp': ['No opponent.', 'Kein Gegner.'],
    'err.deckSize': ['The deck has {n} instead of {max} cards.', 'Das Deck hat {n} statt {max} Karten.'], 'err.noBasic': ['The deck needs at least one Basic character.', 'Das Deck braucht mindestens einen Basis-Charakter.'],
    'err.copies': ['“{c}” is in it {n}× (max. {max}).', '„{c}“ ist {n}× enthalten (max. {max}).'], 'err.owned': ['You only own {n}× “{c}” (in deck: {d}).', 'Du besitzt nur {n}× „{c}“ (im Deck: {d}).'],

    // Log
    'log.coin': ['🪙 {l}: {r}', '🪙 {l}: {r}'], 'log.mulligan': ['{p} has no Basic character and reshuffles (mulligan).', '{p} hat keinen Basis-Charakter auf der Hand und mischt neu (Mulligan).'],
    'log.mulliganExtra': ["{p} draws {n} extra card(s) because of the opponent's mulligan.", '{p} zieht {n} Extra-Karte(n) wegen des gegnerischen Mulligans.'], 'log.setup': ['Choose your Active character and your Bench.', 'Wählt euren aktiven Charakter und eure Bank.'],
    'log.first': ['🪙 Coin flip: {p} goes first.', '🪙 Münzwurf: {p} beginnt.'], 'log.turn': ['— Turn {n}: {p} —', '— Zug {n}: {p} —'], 'log.win': ['🏆 {p} wins! {r}', '🏆 {p} gewinnt! {r}'],
    'win.deckout': ["{p} can't draw a card anymore.", '{p} kann keine Karte mehr ziehen.'], 'win.kos': ['Knocked out {n} opponents.', '{n} Gegner K.O. gesetzt.'], 'win.noChars': ['{p} has no characters left in play.', '{p} hat keine Charaktere mehr im Spiel.'],
    'log.benchShield': ['Heart of the Group protects the Bench.', 'Herz der Gruppe schützt die Bank.'], 'log.dmg': ['{c} takes {n} damage.', '{c} erhält {n} Schaden.'], 'log.dmgWeak': ['{c} takes {n} damage (Weakness!).', '{c} erhält {n} Schaden (Schwäche!).'],
    'log.dmgRes': ['{c} takes {n} damage (Resistance).', '{c} erhält {n} Schaden (Resistenz).'], 'log.heal': ['{c} heals {n} damage.', '{c} heilt {n} Schaden.'], 'log.status': ['{c}: {s}.', '{c}: {s}.'],
    'log.ko': ['💀 {c} is knocked out!', '💀 {c} ist K.O.!'], 'log.koBig': ['💀 {c} is knocked out! (Big Bad – counts double)', '💀 {c} ist K.O.! (Big Bad – zählt doppelt)'], 'log.promote': ['{p} sends {c} forward.', '{p} schickt {c} nach vorne.'],
    'log.poison': ['☠️ {c} takes 10 poison damage.', '☠️ {c} erhält 10 Giftschaden.'], 'log.burn': ['🔥 {c} takes 20 burn damage.', '🔥 {c} erhält 20 Verbrennungsschaden.'], 'coin.burn': ['{c} (burn)', '{c} (Verbrennung)'],
    'coin.sleep': ['{c} (sleep)', '{c} (Schlaf)'], 'log.wake': ['{c} wakes up.', '{c} wacht auf.'], 'log.unpara': ['{c} is no longer paralyzed.', '{c} ist nicht mehr gelähmt.'],
    'log.stadiumDmg': ['{c}: each Active character takes {n} damage.', '{c}: Jeder aktive Charakter erhält {n} Schaden.'], 'log.bench': ['{p} puts {c} on the Bench.', '{p} legt {c} auf die Bank.'],
    'log.evolve': ['✨ {a} evolves into {b}!', '✨ {a} entwickelt sich zu {b}!'], 'log.energy': ['{p} attaches {e} to {c}.', '{p} legt {e} an {c} an.'], 'log.retreat': ['{a} retreats, {b} steps forward.', '{a} zieht sich zurück, {b} kommt nach vorne.'],
    'log.end': ['{p} ends the turn.', '{p} beendet den Zug.'], 'log.trainer': ['{p} plays {sub}: {c}.', '{p} spielt {sub}: {c}.'], 'log.tool': ['{t} is attached to {c}.', '{t} wird an {c} angelegt.'],
    'log.take': ['{p} takes {c}.', '{p} nimmt {c}.'], 'log.gusted': ['{c} is dragged forward.', '{c} wird nach vorne gezerrt.'], 'log.energyNamed': ['{n} Energy from the discard pile to {c}.', '{n} Energie aus der Ablage an {c}.'],
    'log.amara': ['The Gem of Amarra protects against Items.', 'Der Ring von Amara schützt vor Gegenständen.'], 'log.energyAttach': ['{e} is attached to {c}.', '{e} wird an {c} angelegt.'], 'log.forward': ['{c} steps forward.', '{c} kommt nach vorne.'],
    'log.wrecked': ['{c} is demolished.', '{c} wird abgerissen.'], 'log.ability': ['{c} uses {a}.', '{c} nutzt {a}.'], 'log.attack': ['⚔️ {c} uses “{a}”!', '⚔️ {c} setzt „{a}“ ein!'], 'log.miss': ['The attack misses.', 'Der Angriff geht daneben.'],
    'log.nodmg': ['{c} takes no damage.', '{c} erhält keinen Schaden.'], 'log.recoil': ['{c} takes {n} recoil damage.', '{c} erhält {n} Rückstoß-Schaden.'], 'log.discardE': ['{c} discards {n} Energy.', '{c} legt {n} Energie ab.'],
    'log.toBench': ['{c} comes onto the Bench.', '{c} kommt auf die Bank.'], 'log.efd': ['{n}× {e} from the discard pile to {c}.', '{n}× {e} aus der Ablage an {c}.'], 'log.flee': ['{c} flees to the Bench.', '{c} flüchtet auf die Bank.'],
    'log.shield': ['{c} is protected next turn.', '{c} ist im nächsten Zug geschützt.'], 'log.oppDiscard': ['{p} discards {c}.', '{p} legt {c} ab.'], 'log.toolDiscarded': ['{c} is discarded.', '{c} wird abgelegt.'],

    // Sammlung, Decks, Booster, Tausch
    'd.title': ['Your Decks', 'Deine Decks'], 'd.template': ['Use template', 'Vorlage übernehmen'], 'd.new': ['New deck', 'Neues Deck'], 'd.active': ['Active', 'Aktiv'], 'd.nCards': ['{n} cards', '{n} Karten'],
    'd.edit': ['Edit', 'Bearbeiten'], 'd.setActive': ['Set active', 'Aktiv setzen'], 'd.copy': ['Copy', 'Kopieren'], 'd.delete': ['Delete', 'Löschen'], 'd.copyName': ['copy', 'Kopie'],
    'd.delQ': ['Delete deck?', 'Deck löschen?'], 'd.delT': ['“{d}” will be deleted. The cards stay in your collection.', '„{d}“ wird gelöscht. Die Karten bleiben in deiner Sammlung.'], 'd.newName': ['New deck', 'Neues Deck'],
    'd.missing': ['you are still missing {n} card(s)', '{n} Karte(n) fehlen dir noch'], 'd.complete': ['all in your collection', 'komplett in deiner Sammlung'],
    'd.copied': ['Template copied. Get missing cards from boosters or the Trading Post.', 'Vorlage kopiert. Fehlende Karten bekommst du über Booster oder die Tauschbörse.'],
    'd.editTitle': ['Edit deck', 'Deck bearbeiten'], 'd.fill': ['Fill with Energy', 'Energie auffüllen'], 'd.maxCopies': ['max. {n} per name', 'max. {n} pro Name'], 'd.leaveQ': ['Leave without saving?', 'Ohne Speichern verlassen?'],
    'd.leaveT': ['Unsaved changes will be lost.', 'Ungespeicherte Änderungen gehen verloren.'], 'd.leave': ['Leave', 'Verlassen'], 'd.full': ['The deck already has 60 cards.', 'Das Deck hat schon 60 Karten.'],
    'd.maxName': ['Max. {n}× “{c}”.', 'Maximal {n}× „{c}“.'], 'd.ownOnly': ['You only own {n}× this card.', 'Du besitzt nur {n}× diese Karte.'], 'd.countOf': ['{n} / {max} cards', '{n} / {max} Karten'],
    'd.emptyList': ['Still empty – add cards on the left.', 'Noch leer – füge links Karten hinzu.'], 'd.ok': ['The deck is ready to play.', 'Das Deck ist spielbereit.'],
    'd.filled': ['Added {n} Energy cards matching your attacks.', '{n} Energie-Karten passend zu deinen Angriffen ergänzt.'], 'd.saved': ['Deck saved.', 'Deck gespeichert.'],
    'b.title': ['Open Boosters', 'Booster öffnen'], 'b.left': ['{n} of {max} left today', 'Heute noch {n} von {max}'], 'b.bonus': ['{n} bonus', '{n} Bonus'],
    'b.packInfo': ['10 cards · at least 1 rare<br>Tap to open', '10 Karten · mind. 1 seltene<br>Tippen zum Öffnen'], 'b.contents': ['Contents: 6 common, 3 uncommon and 1 rare or legendary card.', 'Inhalt: 6 gewöhnliche, 3 ungewöhnliche und 1 seltene oder legendäre Karte.'],
    'b.empty': ['All out for today', 'Für heute leer'], 'b.midnight': ['{n} new boosters at midnight.', 'Ab Mitternacht gibt es {n} neue Booster.'], 'b.tip': ['Tip: achievements and the story mode give you bonus boosters.', 'Tipp: Erfolge und der Story-Modus schenken dir Bonus-Booster.'],
    'b.next': ['Open next booster', 'Nächsten Booster öffnen'], 'b.toColl': ['To collection', 'Zur Sammlung'], 'b.newCards': ['✨ {n} new card(s)!', '✨ {n} neue Karte(n)!'], 'b.onlyDupes': ['Only duplicates – great for the Trading Post!', 'Nur Duplikate – gut für die Tauschbörse!'],
    'tr.give': ['You give', 'Das gibst du ab'], 'tr.from': ['from {n} copies', 'ab {n} Exemplaren'], 'tr.wish': ['Your wish card', 'Deine Wunschkarte'], 'tr.do': ['Trade', 'Tauschen'],
    'tr.none': ['No card in your collection {n}× yet. Open your daily boosters – duplicates pile up faster than you think.', 'Noch keine Karte mindestens {n}× in deiner Sammlung. Öffne täglich deine Booster – Duplikate sammeln sich schneller, als man denkt.'],
    'tr.prices': ['Prices: Basic/Support {a}× · Stage 1 {b}× · Stage 2 {c}× · Big Bad {d}× – always of <b>one</b> card.', 'Preise: Basis/Support {a}× · Stufe 1 {b}× · Stufe 2 {c}× · Big Bad {d}× – jeweils von <b>einer</b> Karte.'],
    'tr.have': ['you have {n}×', 'du hast {n}×'], 'tr.same': ['same card', 'gleiche Karte'], 'tr.missing': ['you are missing {n}', 'dir fehlen {n}'],
    'tr.needN': ['You need {n}× of this card.', 'Du brauchst {n}× diese Karte.'], 'tr.pickOther': ['Better trade for a different card.', 'Tausche lieber gegen eine andere Karte.'], 'tr.promo': ['Achievement cards are only available through achievements.', 'Erfolgs-Karten gibt es nur über Erfolge.'],
    'tr.ok': ['{n}× {a} → {b}', '{n}× {a} → {b}'],

    // Regeln
    'r.type': ['Type', 'Typ'], 'r.weakTo': ['Weak to', 'Schwach gegen'], 'r.resTo': ['Resists', 'Resistent gegen'], 'r.startTut': ['Start the guided tutorial', 'Geführtes Tutorial starten'],
    'r.body': [
      `<h3>Goal</h3><p>Knock out <b>3 opposing characters</b>. A <b>Big Bad</b> counts double. You also win if your opponent has no characters left in play or can't draw a card.</p>
      <h3>Setup</h3><p>Decks have exactly 60 cards, at most 4 cards with the same name (basic Energy is unlimited). Each player draws 7 cards and puts down an Active Basic character and up to 5 on the Bench. A coin flip decides who goes first.</p>
      <h3>Your turn</h3><p>1. Draw a card. 2. As often as you like: put Basic characters on your Bench, evolve, play Items, Tools, a Stadium and <b>one</b> Supporter, use abilities, attach <b>one</b> Energy and retreat <b>once</b> (discard Energy equal to the Retreat cost). 3. Attack – this ends your turn.</p>
      <p>The player who goes first can neither attack nor play a Supporter on their first turn. Evolving is only possible from each player's second turn on, and not on a character that came into play this turn.</p>
      <h3>Energy</h3><p>🥊 Fight · 🔮 Magic · 🦇 Vampire/Demonic · 🎓 Knowledge · ⚪ = any Energy.</p>
      <h3>Weakness &amp; Resistance</h3><p>Weakness doubles the damage, Resistance subtracts 30. The types form a circle:</p>{table}
      <h3>Special Conditions</h3><p>💤 <b>Asleep</b>: can't attack or retreat; flip a coin between turns (heads = awake). ⚡ <b>Paralyzed</b>: can't attack or retreat until the end of your next turn. ☠️ <b>Poisoned</b>: 10 damage between turns. Moving to the Bench or evolving removes conditions.</p>
      <h3>The Initiative &amp; the Chip</h3><p>Initiative characters have the type 🎖️ Military. As long as any Military character is in play, <i>Spike – Bounty Hunter</i> can't attack.</p>
      <h3>Boosters &amp; Trading</h3><p>You can open {boosters} boosters every day. If you own a card often enough, trade copies for a wish card: Basic &amp; Support {a}×, Stage 1 {b}×, Stage 2 {c}×, Big Bad {d}×.</p>`,
      `<h3>Ziel</h3><p>Setze <b>3 gegnerische Charaktere K.O.</b>. Ein <b>Big Bad</b> zählt doppelt. Du gewinnst auch, wenn dein Gegner keine Charaktere mehr im Spiel hat oder keine Karte mehr ziehen kann.</p>
      <h3>Aufbau</h3><p>Deck mit genau 60 Karten, höchstens 4 Karten mit gleichem Namen (Basis-Energie unbegrenzt). Jede Seite zieht 7 Karten und legt einen aktiven Basis-Charakter sowie bis zu 5 auf die Bank. Ein Münzwurf entscheidet, wer beginnt.</p>
      <h3>Dein Zug</h3><p>1. Ziehe eine Karte. 2. Beliebig oft: Basis-Charaktere auf die Bank legen, entwickeln, Gegenstände, Ausrüstung, ein Stadion und <b>einen</b> Unterstützer spielen, Fähigkeiten nutzen, <b>eine</b> Energie anlegen und dich <b>einmal</b> zurückziehen (Energie in Höhe der Rückzugskosten ablegen). 3. Angreifen – das beendet den Zug.</p>
      <p>Wer beginnt, darf im ersten Zug weder angreifen noch einen Unterstützer spielen. Entwickeln geht erst ab dem jeweils zweiten eigenen Zug und nicht mit einem Charakter, der in diesem Zug ins Spiel kam.</p>
      <h3>Energie</h3><p>🥊 Kampf · 🔮 Magie · 🦇 Vampir/Dämonisch · 🎓 Wissen · ⚪ = beliebige Energie.</p>
      <h3>Schwäche &amp; Resistenz</h3><p>Schwäche verdoppelt den Schaden, Resistenz zieht 30 ab. Die Typen bilden einen Kreis:</p>{table}
      <h3>Zustände</h3><p>💤 <b>Schläft</b>: kein Angriff/Rückzug, zwischen den Zügen Münzwurf (Kopf = wach). ⚡ <b>Gelähmt</b>: kein Angriff/Rückzug bis zum Ende deines nächsten Zuges. ☠️ <b>Vergiftet</b>: 10 Schaden zwischen den Zügen. Auf die Bank wechseln oder Entwickeln heilt Zustände.</p>
      <h3>Die Initiative &amp; der Chip</h3><p>Charaktere der Initiative haben den Typ 🎖️ Militär. Solange irgendein Militär-Charakter im Spiel ist, kann <i>Spike – Kopfgeldjäger</i> nicht angreifen.</p>
      <h3>Booster &amp; Tausch</h3><p>Jeden Tag kannst du {boosters} Booster öffnen. Besitzt du eine Karte oft genug, tauschst du die Exemplare gegen eine Wunschkarte: Basis &amp; Support {a}×, Stufe 1 {b}×, Stufe 2 {c}×, Big Bad {d}×.</p>`],

    // Einstellungen & Versionen
    's.lang': ['Language', 'Sprache'], 's.name': ['Your name', 'Dein Name'], 's.sound': ['Sound', 'Ton'], 's.muteAll': ['Mute everything', 'Alles stumm'], 's.sfx': ['Effects', 'Effekte'], 's.music': ['Music', 'Musik'],
    's.aiSpeed': ['AI speed', 'KI-Tempo'], 's.slow': ['Relaxed', 'Gemütlich'], 's.fast': ['Fast', 'Schnell'], 's.saveTitle': ['Back up your save', 'Spielstand sichern'],
    's.saveHint': ['Handy for moving to another device (e.g. your iPhone). Custom card images are not included.', 'Praktisch, um auf ein anderes Gerät (z. B. dein iPhone) umzuziehen. Eigene Kartenbilder sind nicht enthalten.'],
    's.export': ['Export', 'Exportieren'], 's.import': ['Import', 'Importieren'], 's.imported': ['Save imported.', 'Spielstand importiert.'], 's.badFile': ["This file isn't a valid save.", 'Diese Datei ist kein gültiger Spielstand.'],
    's.restart': ['Start over', 'Neu anfangen'], 's.reset': ['Reset save', 'Spielstand zurücksetzen'], 's.resetQ': ['Really reset?', 'Wirklich zurücksetzen?'],
    's.resetT': ['Collection, decks and stats will be deleted. Custom images are kept.', 'Sammlung, Decks und Statistik werden gelöscht. Eigene Bilder bleiben erhalten.'], 's.muteTip': ['Sound on/off (M)', 'Ton an/aus (M)'],
    'v.title': ['Version history', 'Versionshistorie'], 'v.current': ['installed: {v}', 'installiert: {v}'], 'v.latest': ['current', 'aktuell'], 'v.whatsNew': ["What's new", 'Was ist neu'], 'v.all': ['All versions', 'Alle Versionen'], 'v.go': ["Let's go!", "Los geht's!"],

    // Erfolge
    'a.new': ['New achievements', 'Neue Erfolge'], 'a.secretFound': ['secret achievement!', 'geheimer Erfolg!'], 'a.sum': ['{n} / {max} · {b} bonus boosters ready', '{n} / {max} · {b} Bonus-Booster bereit'],
    'a.all': ['All', 'Alle'], 'a.open': ['Open', 'Offen'], 'a.done': ['Unlocked', 'Freigeschaltet'], 'a.secret': ['Secret', 'Geheim'], 'a.secretTitle': ['Secret achievement', 'Geheimer Erfolg'], 'a.secretTag': ['secret', 'geheim'],
    'a.veiled': ["How to unlock it? Nobody will tell you … not even Giles.", 'Wie man ihn freischaltet, verrät dir niemand … nicht mal Giles.'], 'a.reward': ['Reward', 'Belohnung'], 'a.booster': ['{n} booster(s)', '{n} Booster'],

    // Story
    'st.title': ['Story Mode', 'Story-Modus'], 'st.progress': ['{n} / {max} chapters cleared', '{n} / {max} Kapitel geschafft'], 'st.chapter': ['Chapter {n}', 'Kapitel {n}'],
    'st.intro': ['Seven seasons, seven Big Bads. Play through Sunnydale chapter by chapter with your active deck – every first victory earns you bonus boosters.', 'Sieben Staffeln, sieben Big Bads. Spiel dich Kapitel für Kapitel durch Sunnydale – mit deinem aktiven Deck. Jeder erste Sieg bringt Bonus-Booster.'],
    'st.locked': ['Locked – clear the previous chapter first.', 'Gesperrt – schaffe erst das vorige Kapitel.'], 'st.reward': ['Reward', 'Belohnung'], 'st.boosters': ['boosters', 'Booster'], 'st.levelLbl': ['Difficulty', 'Schwierigkeit'],
    'st.cleared': ['✔ cleared', '✔ geschafft'], 'st.fight': ['Fight', 'Kämpfen'], 'st.vs': ['Opponent: {d} · {l}', 'Gegner: {d} · {l}'], 'st.yourDeck': ['Your deck: {d} (change it under Decks → Set active)', 'Dein Deck: {d} (ändern unter Decks → Aktiv setzen)'],
    'st.toStory': ['Back to the story', 'Zurück zur Story'], 'st.got': ['First victory: +{n} bonus boosters!', 'Erster Sieg: +{n} Bonus-Booster!'], 'st.finale': ['You saved the world. A lot. Sunnydale salutes you.', 'Du hast die Welt gerettet. Mehrmals. Sunnydale verneigt sich.'],

    // Tutorial
    'tu.offerTitle': ['New in Sunnydale?', 'Neu in Sunnydale?'], 'tu.offerText': ['Would you like a short guided tutorial? It takes about 3 minutes and gives you 2 bonus boosters.', 'Möchtest du ein kurzes geführtes Tutorial? Dauert etwa 3 Minuten und bringt dir 2 Bonus-Booster.'],
    'tu.offerYes': ['Start tutorial', 'Tutorial starten'], 'tu.oppName': ['Training dummy', 'Trainings-Vampir'], 'tu.coach': ['Your Watcher', 'Dein Wächter'],
    'tu.next': ['Next', 'Weiter'], 'tu.go': ["Let's go!", "Los geht's!"], 'tu.skip': ['Skip tutorial', 'Tutorial überspringen'], 'tu.skipped': ['Tutorial skipped – the game continues normally.', 'Tutorial übersprungen – das Spiel läuft normal weiter.'],
    'tu.readFirst': ['Read the hint first and click “Next”.', 'Lies erst den Hinweis und klicke auf „Weiter“.'], 'tu.notNow': ['Not yet – follow the hint above.', 'Noch nicht – folge dem Hinweis oben.'],
    'tu.done': ['Tutorial completed!', 'Tutorial abgeschlossen!'], 'tu.reward': ['+2 bonus boosters for you.', '+2 Bonus-Booster für dich.'],
    'tu.welcome': ['Welcome to the Hellmouth! Your goal: <b>knock out 3 opposing characters</b>. Today you are practising against a few weak vampires.', 'Willkommen auf dem Höllenschlund! Dein Ziel: <b>3 gegnerische Charaktere K.O. setzen</b>. Heute übst du gegen ein paar schwache Vampire.'],
    'tu.board': ['The highlighted areas: your <b>Active</b> character fights, your <b>Bench</b> waits for its turn, your <b>hand</b> is at the bottom. The tombstones show the knockouts so far.', 'Die markierten Bereiche: Dein <b>aktiver</b> Charakter kämpft, deine <b>Bank</b> wartet auf ihren Einsatz, unten liegt deine <b>Hand</b>. Die Grabsteine zeigen die bisherigen K.O.s.'],
    'tu.energy': ['Attacks need <b>Energy</b>. Drag a 🥊 <b>Fight Energy</b> onto Buffy (or tap it and choose “Attach”). Only one Energy per turn!', 'Angriffe brauchen <b>Energie</b>. Ziehe eine 🥊 <b>Kampf-Energie</b> auf Buffy (oder tippe sie an und wähle „Anlegen“). Nur eine Energie pro Zug!'],
    'tu.bench': ['Now drag <b>Xander</b> onto your Bench. Benched characters protect you if your Active character falls.', 'Jetzt ziehe <b>Xander</b> auf deine Bank. Bank-Charaktere sichern dich ab, falls dein aktiver Charakter fällt.'],
    'tu.end1': ["Whoever goes first can't attack on their first turn. Click <b>End turn</b>.", 'Wer beginnt, darf im ersten Zug nicht angreifen. Klicke auf <b>Zug beenden</b>.'],
    'tu.opp': ["Now it's the vampire's turn. Watch what happens …", 'Jetzt ist der Vampir dran. Schau zu, was passiert …'],
    'tu.energy2': ['Your turn again! Attach another 🥊 <b>Energy</b> to Buffy.', 'Wieder du! Lege noch eine 🥊 <b>Energie</b> an Buffy an.'],
    'tu.evolve': ['Time to grow up: drag <b>Buffy – The Chosen One</b> onto your Buffy. When you hover or drag it, only valid targets glow gold.', 'Zeit zu wachsen: Ziehe <b>Buffy – Die Auserwählte</b> auf deine Buffy. Beim Ziehen leuchten nur passende Ziele golden.'],
    'tu.attack': ['Now <b>tap Buffy</b> and choose the attack <b>Quip</b>. Vampires are weak to 🥊 Fight – the damage doubles!', 'Jetzt <b>tippe Buffy an</b> und wähle den Angriff <b>Schlagfertig</b>. Vampire sind schwach gegen 🥊 Kampf – der Schaden verdoppelt sich!'],
    'tu.weak': ['Stake to the heart! 💀 That was <b>Weakness</b> in action. Check the bottom of each card: Weakness, Resistance and Retreat cost.', 'Pfahl ins Herz! 💀 Das war <b>Schwäche</b> in Aktion. Unten auf jeder Karte stehen Schwäche, Resistenz und Rückzugskosten.'],
    'tu.free': ['You know the basics now. Finish the game on your own – supporters like <b>Research in the Library</b> draw cards. Good luck, Slayer!', 'Du kennst jetzt die Grundlagen. Spiel die Partie allein zu Ende – Unterstützer wie <b>Recherche in der Bibliothek</b> ziehen Karten. Viel Glück, Jägerin!'],
  });

  // Decks
  add({
    'deck.scoobies.n': ['The Scooby Gang', 'Die Scooby-Gang'], 'deck.scoobies.d': ['Buffy, Willow, Xander & Giles – Fight and Magic.', 'Buffy, Willow, Xander & Giles – Kampf und Magie.'],
    'deck.nacht.n': ['Children of the Night', 'Kinder der Nacht'], 'deck.nacht.d': ['Vampires led by the Master.', 'Vampire unter Führung des Meisters.'],
    'deck.s1.n': ['Season 1 – The Master', 'Staffel 1 – Der Meister'], 'deck.s1.d': ['The Master and his followers.', 'Der Meister und seine Gefolgsleute.'],
    'deck.s2.n': ['Season 2 – Angelus & Drusilla', 'Staffel 2 – Angelus & Drusilla'], 'deck.s2.d': ['Soulless Angelus, Dru and the Judge.', 'Angelus ohne Seele, Dru und der Richter.'],
    'deck.s3.n': ['Season 3 – Graduation Day', 'Staffel 3 – Die Abschlussfeier'], 'deck.s3.d': ['The Mayor ascends, Faith switches sides.', 'Der Bürgermeister steigt auf, Faith wechselt die Seiten.'],
    'deck.s4.n': ['Season 4 – The Initiative', 'Staffel 4 – Die Initiative'], 'deck.s4.d': ['Adam and the soldiers of Room 314.', 'Adam und die Soldaten aus Labor 314.'],
    'deck.s5.n': ['Season 5 – Glory', 'Staffel 5 – Glory'], 'deck.s5.d': ['Ben turns into the Hell God.', 'Ben verwandelt sich in die Höllengöttin.'],
    'deck.s6.n': ['Season 6 – Dark Willow & the Trio', 'Staffel 6 – Dark Willow & das Trio'], 'deck.s6.d': ['Magic out of control.', 'Magie außer Kontrolle.'],
    'deck.s7.n': ['Season 7 – The First', 'Staffel 7 – Die Erste'], 'deck.s7.d': ['The Ultimate Evil, Caleb and the Übervamps.', 'Das Urböse, Caleb und die Übervampire.'],
    'deck.slayers.n': ['The Slayers', 'Die Jägerinnen'], 'deck.slayers.d': ['Buffy, Faith, Kendra and the Potentials.', 'Buffy, Faith, Kendra und die Potentiellen.'],
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
