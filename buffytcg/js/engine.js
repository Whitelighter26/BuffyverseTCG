/* Buffyverse TCG – Regel-Engine (angelehnt an die Pokémon-TCG-Regeln)
   Der Spielzustand ist ein reines Datenobjekt (klonbar), damit die KI Züge durchspielen kann. */
(function (G) {
  const B = G.BTCG;
  const CFG = B.CONFIG;
  const E = (B.Engine = {});

  // ---------- Zufall (im Zustand gespeichert, damit Klone unabhängig würfeln) ----------
  function rnd(s) {
    let t = (s.seed = (s.seed + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function shuffle(s, arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd(s) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function coin(s, label) {
    const heads = rnd(s) < 0.5;
    s.events.push({ type: 'coin', heads, label });
    log(s, M('log.coin', { l: label, r: M(heads ? 'w.heads' : 'w.tails') }));
    return heads;
  }
  // Meldungen werden als { k: Schlüssel, p: Parameter } gespeichert und erst in der Oberfläche übersetzt.
  // Parameter-Präfixe: '@id' = Kartenname, '%Typ' = Typname, '§id:i' = Angriffsname, '¤id' = Fähigkeitsname
  const M = (k, p) => ({ k, p: p || {} });
  const C = (id) => '@' + id;
  const AB = (id) => '¤' + id;
  const AT = (id, i) => '§' + id + ':' + i;
  E.M = M;
  function log(s, text) {
    s.log.push(text);
    if (s.log.length > 300) s.log.splice(0, s.log.length - 300);
  }
  E.rnd = rnd;

  // ---------- Hilfen ----------
  const def = (s, uid) => B.CARDS[s.cards[uid]];
  const top = (s, slot) => def(s, slot.cards[slot.cards.length - 1]);
  const slotsOf = (p) => (p.active ? [p.active] : []).concat(p.bench);
  const opp = (pi) => 1 - pi;
  E.def = def;
  E.top = top;
  E.slotsOf = slotsOf;

  function findSlot(s, id) {
    for (let pi = 0; pi < 2; pi++) {
      const p = s.players[pi];
      if (p.active && p.active.id === id) return { pi, slot: p.active, pos: 'active' };
      const bi = p.bench.findIndex((b) => b.id === id);
      if (bi >= 0) return { pi, slot: p.bench[bi], pos: 'bench', bi };
    }
    return null;
  }
  E.findSlot = findSlot;
  function abilityOf(s, slot) {
    return top(s, slot).ability || null;
  }
  function hasPassive(s, slot, t) {
    const ab = abilityOf(s, slot);
    return ab && ab.kind === 'passive' && ab.t === t ? ab : null;
  }
  function toolOf(s, slot) {
    return slot.tool ? def(s, slot.tool).fx : null;
  }
  function hpMax(s, slot) {
    const t = toolOf(s, slot);
    return top(s, slot).hp + (t && t.hpBonus ? t.hpBonus : 0);
  }
  E.hpMax = hpMax;
  function stadiumFx(s) {
    return s.stadium ? def(s, s.stadium).fx : null;
  }
  function newSlot(s, uid) {
    return { id: 's' + s.nextSlot++, cards: [uid], energy: [], tool: null, damage: 0, status: {}, playedTurn: s.turn, evolvedTurn: -1, abilityTurn: -1, noAttackTurn: -1, shieldTurn: -1 };
  }
  function energyTypes(s, slot) {
    return slot.energy.map((u) => def(s, u).energy);
  }
  E.energyTypes = energyTypes;

  E.canPay = function (cost, types) {
    const pool = {};
    for (const t of types) pool[t] = (pool[t] || 0) + 1;
    let any = 0;
    for (const c of cost) {
      if (c === '*') { any++; continue; }
      if (!pool[c]) return false;
      pool[c]--;
    }
    const rest = Object.values(pool).reduce((a, b) => a + b, 0);
    return rest >= any;
  };

  // ---------- Deckprüfung ----------
  E.validateDeck = function (counts) {
    const errs = [];
    let total = 0, basics = 0;
    const byName = {}, idOf = {};
    for (const [id, n] of Object.entries(counts)) {
      const c = B.CARDS[id];
      if (!c || n <= 0) continue;
      total += n;
      if (c.kind === 'char' && c.stage === 0) basics += n;
      if (c.kind !== 'energy') { byName[c.name] = (byName[c.name] || 0) + n; idOf[c.name] = id; }
    }
    if (total !== CFG.DECK_SIZE) errs.push(M('err.deckSize', { n: total, max: CFG.DECK_SIZE }));
    if (basics === 0) errs.push(M('err.noBasic'));
    for (const [name, n] of Object.entries(byName)) if (n > CFG.MAX_COPIES) errs.push(M('err.copies', { c: C(idOf[name]), n, max: CFG.MAX_COPIES }));
    return errs;
  };

  // ---------- Spielstart ----------
  E.newGame = function (decks, opts) {
    opts = opts || {};
    const s = {
      seed: opts.seed != null ? opts.seed : Math.floor(Math.random() * 2 ** 31),
      cards: {}, nextUid: 1, nextSlot: 1, turn: 0, current: 0, phase: 'setup', winner: null, winReason: '',
      stadium: null, stadiumOwner: null, log: [], events: [], flags: {}, pendingPromote: [], after: null,
      players: [0, 1].map((pi) => ({ name: (opts.names || ['Du', 'KI'])[pi], ai: !!(opts.ai || [false, true])[pi], deck: [], hand: [], discard: [], active: null, bench: [], kos: 0, ready: false })),
    };
    for (let pi = 0; pi < 2; pi++) {
      const p = s.players[pi];
      for (const [id, n] of Object.entries(decks[pi])) for (let i = 0; i < n; i++) { const u = 'c' + s.nextUid++; s.cards[u] = id; p.deck.push(u); }
      shuffle(s, p.deck);
    }
    // Starthand mit Mulligan (keine Basis-Karte → neu mischen, Gegner zieht 1 Extra-Karte)
    const mull = [0, 0];
    for (let pi = 0; pi < 2; pi++) {
      const p = s.players[pi];
      for (let tries = 0; tries < 50; tries++) {
        p.hand = p.deck.splice(0, CFG.HAND_START);
        if (p.hand.some((u) => def(s, u).kind === 'char' && def(s, u).stage === 0)) break;
        p.deck.push(...p.hand); p.hand = []; shuffle(s, p.deck); mull[pi]++;
        log(s, M('log.mulligan', { p: p.name }));
      }
    }
    for (let pi = 0; pi < 2; pi++) {
      const extra = Math.min(mull[opp(pi)], 3);
      for (let i = 0; i < extra && s.players[pi].deck.length; i++) s.players[pi].hand.push(s.players[pi].deck.shift());
      if (extra) log(s, M('log.mulliganExtra', { p: s.players[pi].name, n: extra }));
    }
    log(s, M('log.setup'));
    return s;
  };

  E.basicsInHand = (s, pi) => s.players[pi].hand.filter((u) => def(s, u).kind === 'char' && def(s, u).stage === 0);

  E.setupPlace = function (s, pi, activeUid, benchUids) {
    const p = s.players[pi];
    const take = (u) => { const i = p.hand.indexOf(u); if (i >= 0) p.hand.splice(i, 1); };
    take(activeUid);
    p.active = newSlot(s, activeUid);
    for (const u of (benchUids || []).slice(0, CFG.BENCH_MAX)) { take(u); p.bench.push(newSlot(s, u)); }
    p.ready = true;
  };

  E.autoSetup = function (s, pi, maxBench) {
    const basics = E.basicsInHand(s, pi).map((u) => ({ u, c: def(s, u) }));
    // Aktiv: bevorzugt viel KP und günstiger erster Angriff
    basics.sort((x, y) => scoreOpener(y.c) - scoreOpener(x.c));
    const active = basics[0].u;
    const bench = basics.slice(1, 1 + (maxBench == null ? CFG.BENCH_MAX : maxBench)).map((x) => x.u);
    E.setupPlace(s, pi, active, bench);
  };
  function scoreOpener(c) {
    const cheapest = Math.min(...c.attacks.map((a) => a.cost.length));
    return c.hp - cheapest * 15 + (c.bigBad ? 40 : 0);
  }

  E.begin = function (s, firstPi) {
    s.current = firstPi != null ? firstPi : (rnd(s) < 0.5 ? 0 : 1);
    log(s, M('log.first', { p: s.players[s.current].name }));
    s.turn = 1;
    startTurn(s);
  };

  function startTurn(s) {
    const p = s.players[s.current];
    s.flags = { energy: false, supporter: false, stadium: false, retreat: false, attacked: false };
    s.phase = 'main';
    log(s, M('log.turn', { n: s.turn, p: p.name }));
    if (!p.deck.length) { return win(s, opp(s.current), M('win.deckout', { p: p.name })); }
    const u = p.deck.shift();
    p.hand.push(u);
    s.events.push({ type: 'draw', pi: s.current, uid: u });
  }

  function win(s, pi, reason) {
    if (s.phase === 'over') return;
    s.phase = 'over';
    s.winner = pi;
    s.winReason = reason;
    log(s, M('log.win', { p: s.players[pi].name, r: reason }));
  }

  // ---------- Regelprüfungen ----------
  E.isFirstTurn = (s) => s.turn === 1;

  function militaryInPlay(s) {
    return s.players.some((p) => slotsOf(p).some((sl) => top(s, sl).type === 'Militär'));
  }

  E.militaryInPlay = militaryInPlay;
  E.attackBlockReason = function (s, idx) {
    const pi = s.current, p = s.players[pi], sl = p.active;
    if (s.phase !== 'main' || !sl) return M('err.noActive');
    if (s.turn === 1) return M('err.firstAttack');
    if (sl.status.para) return M('err.para');
    if (sl.status.sleep) return M('err.sleep');
    if (sl.noAttackTurn === s.turn) return M('err.cantAttack');
    if (hasPassive(s, sl, 'chip') && militaryInPlay(s)) return M('err.chip');
    const atk = top(s, sl).attacks[idx];
    if (!atk) return M('err.unknownAttack');
    if (!E.canPay(atk.cost, energyTypes(s, sl))) return M('err.energy');
    return null;
  };

  E.retreatCost = function (s, pi, slot) {
    const c = top(s, slot);
    let cost = c.retreat;
    if (slotsOf(s.players[pi]).some((x) => { const ab = hasPassive(s, x, 'retreatZero'); return ab && ab.type === c.type; })) cost = 0;
    const st = stadiumFx(s);
    if (st && st.t === 'retreatZero' && st.type === c.type) cost = 0;
    if (st && st.t === 'retreatMinus') cost -= st.n;
    return Math.max(0, cost);
  };
  E.retreatBlockReason = function (s) {
    const p = s.players[s.current], sl = p.active;
    if (s.phase !== 'main' || !sl) return M('err.noActive');
    if (s.flags.retreat) return M('err.retreatDone');
    if (!p.bench.length) return M('err.noBench');
    if (hasPassive(s, sl, 'noRetreat')) return M('err.noRetreat', { a: AB(top(s, sl).id) });
    if (sl.status.para || sl.status.sleep) return M('err.paraSleep');
    if (sl.energy.length < E.retreatCost(s, s.current, sl)) return M('err.retreatEnergy');
    return null;
  };

  function canEvolve(s, pi, card, slot) {
    return card.kind === 'char' && card.stage > 0 && top(s, slot).id === card.from && s.turn > 2 && slot.playedTurn < s.turn && slot.evolvedTurn < s.turn;
  }
  function toolAllowed(s, tcard, slot) {
    if (slot.tool) return false;
    const c = top(s, slot), f = tcard.fx;
    if (f.onlyTag && !c.tags.includes(f.onlyTag)) return false;
    if (f.onlyType && c.type !== f.onlyType) return false;
    return true;
  }

  function trainerBlockReason(s, uid) {
    const pi = s.current, p = s.players[pi], o = s.players[opp(pi)], c = def(s, uid), f = c.fx;
    if (c.sub === 'Unterstützer') {
      if (s.turn === 1) return M('err.firstSupporter');
      if (s.flags.supporter) return M('err.oneSupporter');
    }
    if (c.sub === 'Stadion') {
      if (s.flags.stadium) return M('err.oneStadium');
      if (s.stadium && def(s, s.stadium).id === c.id) return M('err.stadiumInPlay');
      return null;
    }
    if (c.sub === 'Ausrüstung') return slotsOf(p).some((sl) => toolAllowed(s, c, sl)) ? null : M('err.noToolTarget');
    switch (f.t) {
      case 'gust': case 'benchDmg': return o.bench.length ? null : M('err.oppNoBench');
      case 'healPick': return slotsOf(p).some((sl) => sl.damage > 0 && (!f.type || top(s, sl).type === f.type)) ? null : M('err.noHealTarget');
      case 'dmgOppActive': case 'coinParaOpp': return o.active && top(s, o.active).type === f.type ? null : M('err.oppNotType', { t: '%' + f.type });
      case 'switchSelf': return p.bench.length ? null : M('err.noBench');
      case 'recoverChar': return p.discard.some((u) => def(s, u).kind === 'char') ? null : M('err.noCharDiscard');
      case 'energyFromDiscardPick': return p.discard.some((u) => def(s, u).kind === 'energy') ? null : M('err.noEnergyDiscard');
      case 'discardStadium': return s.stadium ? null : M('err.noStadium');
      case 'energyToNamed': if (!slotsOf(p).some((sl) => top(s, sl).name.startsWith(f.name))) return M('err.noNamed', { n: f.name }); return p.discard.some((u) => def(s, u).kind === 'energy') ? null : M('err.noEnergyDiscard');
      case 'healAllDraw': return null;
      case 'drawNamed': return p.deck.length ? null : M('err.deckEmpty');
      case 'searchDeck': if (f.to === 'bench' && p.bench.length >= CFG.BENCH_MAX) return M('err.benchFull'); return p.deck.length ? null : M('err.deckEmpty');
      case 'draw': case 'drawTo': case 'drawPerChar': case 'topPick': case 'searchEnergy': return p.deck.length ? null : M('err.deckEmpty');
      default: return null;
    }
  }
  E.trainerBlockReason = trainerBlockReason;

  function abilityBlockReason(s, slot) {
    const pi = s.current, p = s.players[pi], o = s.players[opp(pi)];
    const ab = abilityOf(s, slot);
    if (!ab || ab.kind !== 'active') return M('err.noAbility');
    if (slot.abilityTurn === s.turn) return M('err.abilityUsed');
    if (ab.needActive && p.active !== slot) return M('err.needActive');
    switch (ab.t) {
      case 'draw': return p.deck.length ? null : M('err.deckEmpty');
      case 'energyFromDiscardPick': return p.discard.some((u) => def(s, u).energy === ab.e) ? null : M('err.noEnergyDiscardType');
      case 'discardDraw': return p.hand.length && p.deck.length ? null : M('err.nothingToDiscard');
      case 'healPick': case 'healAll': return slotsOf(p).some((x) => x.damage > 0) ? null : M('err.noneHurt');
      case 'extraEnergy': return p.hand.some((u) => def(s, u).kind === 'energy') ? null : M('err.noEnergyHand');
      case 'coinSleep': case 'coinPara': return o.active ? null : M('err.noOpp');
      default: return null;
    }
  }
  E.abilityBlockReason = abilityBlockReason;

  // ---------- Legale Aktionen ----------
  E.legalActions = function (s) {
    const acts = [];
    if (s.phase !== 'main') return acts;
    const pi = s.current, p = s.players[pi];
    const mySlots = slotsOf(p);
    for (const u of p.hand) {
      const c = def(s, u);
      if (c.kind === 'char' && c.stage === 0 && p.bench.length < CFG.BENCH_MAX) acts.push({ type: 'bench', uid: u });
      if (c.kind === 'char' && c.stage > 0) for (const sl of mySlots) if (canEvolve(s, pi, c, sl)) acts.push({ type: 'evolve', uid: u, target: sl.id });
      if (c.kind === 'energy' && !s.flags.energy) for (const sl of mySlots) acts.push({ type: 'energy', uid: u, target: sl.id });
      if (c.kind === 'trainer' && !trainerBlockReason(s, u)) acts.push({ type: 'trainer', uid: u });
    }
    if (!E.retreatBlockReason(s)) for (const b of p.bench) acts.push({ type: 'retreat', target: b.id });
    for (const sl of mySlots) if (!abilityBlockReason(s, sl)) acts.push({ type: 'ability', slot: sl.id });
    if (p.active) top(s, p.active).attacks.forEach((a, i) => { if (!E.attackBlockReason(s, i)) acts.push({ type: 'attack', idx: i }); });
    acts.push({ type: 'end' });
    return acts;
  };

  // ---------- Auswahl-Schritte (für UI und KI) ----------
  const optSlot = (sl) => ({ ref: sl.id, slot: sl.id });
  const optCard = (s, u) => ({ ref: u, card: u });
  E.choiceSpec = function (s, action) {
    const pi = s.current, p = s.players[pi], o = s.players[opp(pi)];
    const steps = [];
    const mySlots = slotsOf(p);
    if (action.type === 'trainer') {
      const c = def(s, action.uid), f = c.fx;
      if (c.sub === 'Ausrüstung') {
        steps.push({ key: 'target', title: M('pick.tool', { c: C(c.id) }), options: mySlots.filter((sl) => toolAllowed(s, c, sl)).map(optSlot), min: 1, max: 1 });
        return steps;
      }
      switch (f.t) {
        case 'searchDeck': {
          const okF = (u) => { const d = def(s, u); if (f.filter === 'basic') return d.kind === 'char' && d.stage === 0; if (f.filter === 'vampir') return d.kind === 'char' && d.type === 'Vampir'; if (f.filter === 'militaer') return d.kind === 'char' && d.type === 'Militär'; if (f.filter === 'jaegerin') return d.kind === 'char' && d.tags.includes('Jägerin'); if (f.filter === 'jaegerinBasic') return d.kind === 'char' && d.stage === 0 && d.tags.includes('Jägerin'); if (f.filter === 'toolOrEvo') return (d.kind === 'trainer' && d.sub === 'Ausrüstung') || (d.kind === 'char' && d.stage > 0); return false; };
          const max = f.to === 'bench' ? Math.min(f.n, CFG.BENCH_MAX - p.bench.length) : f.n;
          steps.push({ key: 'cards', title: M('pick.deckCards'), options: p.deck.filter(okF).map((u) => optCard(s, u)), min: 0, max });
          break;
        }
        case 'gust': steps.push({ key: 'target', title: M('pick.gust'), options: o.bench.map(optSlot), min: 1, max: 1 }); break;
        case 'benchDmg': steps.push({ key: 'target', title: M('pick.benchDmg', { n: f.n }), options: o.bench.map(optSlot), min: 1, max: 1 }); break;
        case 'topPick': { const tops = p.deck.slice(0, f.look); steps.push({ key: 'cards', title: M('pick.topPick', { n: f.take }), options: tops.map((u) => optCard(s, u)), min: Math.min(f.take, tops.length), max: f.take }); break; }
        case 'healPick': steps.push({ key: 'target', purpose: 'heal', title: M('pick.heal'), options: mySlots.filter((sl) => sl.damage > 0 && (!f.type || top(s, sl).type === f.type)).map(optSlot), min: 1, max: 1 }); break;
        case 'energyFromDiscardPick': {
          steps.push({ key: 'cards', title: M('pick.energyDiscard'), options: uniqEnergy(s, p.discard).map((u) => optCard(s, u)), min: 1, max: 1 });
          steps.push({ key: 'target', title: M('pick.attachTo'), options: mySlots.map(optSlot), min: 1, max: 1 });
          break;
        }
        case 'switchSelf': steps.push({ key: 'target', title: M('pick.whoForward'), options: p.bench.map(optSlot), min: 1, max: 1 }); break;
        case 'energyToNamed': steps.push({ key: 'target', title: M('pick.named', { n: f.name }), options: mySlots.filter((sl) => top(s, sl).name.startsWith(f.name)).map(optSlot), min: 1, max: 1 }); break;
        case 'recoverChar': steps.push({ key: 'cards', title: M('pick.recover'), options: p.discard.filter((u) => def(s, u).kind === 'char').map((u) => optCard(s, u)), min: 1, max: 1 }); break;
        default: break;
      }
    } else if (action.type === 'ability') {
      const sl = findSlot(s, action.slot).slot, ab = abilityOf(s, sl);
      if (ab.t === 'energyFromDiscardPick') steps.push({ key: 'target', title: M('pick.abAttach', { a: AB(top(s, sl).id) }), options: mySlots.map(optSlot), min: 1, max: 1 });
      if (ab.t === 'healPick') steps.push({ key: 'target', purpose: 'heal', title: M('pick.abHeal', { a: AB(top(s, sl).id) }), options: mySlots.filter((x) => x.damage > 0).map(optSlot), min: 1, max: 1 });
      if (ab.t === 'discardDraw') steps.push({ key: 'cards', purpose: 'discard', title: M('pick.abDiscard', { a: AB(top(s, sl).id) }), options: p.hand.map((u) => optCard(s, u)), min: 1, max: 1 });
      if (ab.t === 'extraEnergy') {
        steps.push({ key: 'cards', title: M('pick.abEnergy', { a: AB(top(s, sl).id) }), options: p.hand.filter((u) => def(s, u).kind === 'energy').map((u) => optCard(s, u)), min: 1, max: 1 });
        steps.push({ key: 'target', title: M('pick.attachTo'), options: mySlots.map(optSlot), min: 1, max: 1 });
      }
    } else if (action.type === 'attack') {
      const atk = top(s, p.active).attacks[action.idx];
      for (const f of atk.fx) {
        if (f.t === 'gustBefore' && o.bench.length) steps.push({ key: 'gust', title: M('pick.gust'), options: o.bench.map(optSlot), min: 1, max: 1 });
        if (f.t === 'benchOne' && o.bench.length) steps.push({ key: 'benchOne', title: M('pick.benchDmg', { n: f.n }), options: o.bench.map(optSlot), min: 1, max: 1 });
        if (f.t === 'searchBasic') {
          const max = Math.min(f.n, CFG.BENCH_MAX - p.bench.length);
          if (max > 0) steps.push({ key: 'search', title: M('pick.searchBasic'), options: p.deck.filter((u) => { const d = def(s, u); return d.kind === 'char' && d.stage === 0 && (!f.type || d.type === f.type); }).map((u) => optCard(s, u)), min: 0, max });
        }
        if (f.t === 'searchTool') steps.push({ key: 'tool', title: M('pick.searchTool'), options: p.deck.filter((u) => def(s, u).sub === 'Ausrüstung').map((u) => optCard(s, u)), min: 0, max: 1 });
        if (f.t === 'switchSelf' && p.bench.length) steps.push({ key: 'switch', title: M('pick.switchOpt'), options: p.bench.map(optSlot), min: 0, max: 1 });
        if (f.t === 'healOwnPick') steps.push({ key: 'heal', purpose: 'heal', title: M('pick.heal'), options: mySlots.map(optSlot), min: 1, max: 1 });
        if (f.t === 'energyFromDiscardPick') steps.push({ key: 'efd', title: M('pick.efd'), options: mySlots.map(optSlot), min: 1, max: 1 });
      }
    }
    return steps.filter((st) => st.options.length || st.min === 0).map((st) => ({ ...st, min: Math.min(st.min, st.options.length) }));
  };
  function uniqEnergy(s, pile) {
    const seen = new Set(), out = [];
    for (const u of pile) { const d = def(s, u); if (d.kind === 'energy' && !seen.has(d.id)) { seen.add(d.id); out.push(u); } }
    return out;
  }

  // ---------- Schaden ----------
  E.calcDamage = function (s, attPi, attSlot, defSlot, atk, mode) {
    // mode: 'roll' (echte Münzwürfe) | 'expected' (Erwartungswert für die KI)
    const A = top(s, attSlot), D = defSlot ? top(s, defSlot) : null;
    let dmg = atk.dmg, fail = false, factor = 1;
    const p = s.players[attPi];
    for (const f of atk.fx) {
      switch (f.t) {
        case 'coins': { let h = 0; if (mode === 'roll') { for (let i = 0; i < f.k; i++) if (coin(s, C(A.id))) h++; } else h = f.k / 2; dmg = f.per * h; break; }
        case 'coinFail': if (mode === 'roll') { if (!coin(s, C(A.id))) fail = true; } else factor *= 0.5; break;
        case 'coinBonus': if (mode === 'roll') { if (coin(s, C(A.id))) dmg += f.n; } else dmg += f.n / 2; break;
        case 'vsType': if (D && D.type === f.type) dmg += f.n; break;
        case 'vsTag': if (D && D.tags.includes(f.tag)) dmg += f.n; break;
        case 'vsBigBad': if (D && D.bigBad) dmg += f.n; break;
        case 'ifAlly': if (slotsOf(p).some((x) => top(s, x).name.startsWith(f.name))) dmg += f.n; break;
        case 'perBench': dmg += f.n * p.bench.length; break;
        case 'perDamageSelf': dmg += f.n * Math.floor(attSlot.damage / 10); break;
        case 'ifDamaged': if (defSlot && defSlot.damage > 0) dmg += f.n; break;
        case 'ifStatus': if (defSlot && Object.keys(defSlot.status).length) dmg += f.n; break;
        default: break;
      }
    }
    if (fail || !D || dmg <= 0) return { dmg: 0, fail, weak: false, res: false };
    // Boni des Angreifers
    if (hasPassive(s, attSlot, 'rageBonus') && attSlot.damage > 0) dmg += A.ability.n;
    for (const x of slotsOf(p)) { const ab = hasPassive(s, x, 'teamBonus'); if (ab && ab.type === A.type) dmg += ab.n; }
    const tf = toolOf(s, attSlot);
    if (tf && tf.bonus) {
      if (tf.vsType) { if (D.type === tf.vsType) dmg += tf.bonus; }
      else if (tf.vsBigBad) { if (D.bigBad) dmg += tf.bonus; }
      else dmg += tf.bonus;
    }
    const st = stadiumFx(s);
    if (st && st.t === 'typeBonus' && st.type === A.type) dmg += st.n;
    if (st && st.t === 'allBonus') dmg += st.n;
    // Schwäche / Resistenz
    let weak = false, res = false;
    if (B.WEAK[D.type] === A.type) { dmg *= CFG.WEAKNESS_MULT; weak = true; }
    if (B.RES[D.type] === A.type) { dmg -= CFG.RESISTANCE; res = true; }
    // Verteidiger
    const dab = hasPassive(s, defSlot, 'immuneType');
    if (dab && dab.types.includes(A.type)) dmg = 0;
    const red = hasPassive(s, defSlot, 'reduceDmg');
    if (red && (!red.fromType || red.fromType.includes(A.type))) dmg -= red.n;
    const dt = toolOf(s, defSlot);
    if (dt && dt.reduce && (!dt.reduceFromType || dt.reduceFromType.includes(A.type))) dmg -= dt.reduce;
    if (defSlot.shieldTurn === s.turn) dmg = 0;
    return { dmg: Math.max(0, Math.round(dmg * factor)), fail: false, weak, res };
  };

  function benchDamage(s, ownerPi, slot, n, fromItem) {
    const owner = s.players[ownerPi];
    if (!fromItem && slotsOf(owner).some((x) => hasPassive(s, x, 'benchShield'))) { log(s, M('log.benchShield')); return 0; }
    const dt = toolOf(s, slot);
    if (fromItem && dt && dt.itemImmune) return 0;
    if (slot.shieldTurn === s.turn) return 0;
    slot.damage += n;
    log(s, M('log.dmg', { c: C(top(s, slot).id), n }));
    s.events.push({ type: 'damage', pi: ownerPi, slot: slot.id, n, weak: false, bench: true, ctype: s.players[s.current].active ? top(s, s.players[s.current].active).type : 'Kampf' });
    return n;
  }

  function heal(s, slot, n) {
    const before = slot.damage;
    slot.damage = Math.max(0, slot.damage - n);
    if (before !== slot.damage) { log(s, M('log.heal', { c: C(top(s, slot).id), n: before - slot.damage })); s.events.push({ type: 'heal', slot: slot.id, n: before - slot.damage }); }
  }
  function applyStatus(s, slot, st) {
    if (!slot) return;
    if (st === 'para' || st === 'sleep') { delete slot.status.para; delete slot.status.sleep; }
    slot.status[st] = st === 'para' ? s.turn : true;
    log(s, M('log.status', { c: C(top(s, slot).id), s: M('status.' + st) }));
    s.events.push({ type: 'status', by: s.current, st, slot: slot.id });
  }
  function discardSlot(s, pi, slot) {
    const p = s.players[pi];
    p.discard.push(...slot.cards, ...slot.energy);
    if (slot.tool) p.discard.push(slot.tool);
  }
  function moveToActive(s, pi, benchId) {
    const p = s.players[pi];
    const i = p.bench.findIndex((b) => b.id === benchId);
    if (i < 0) return;
    const nb = p.bench.splice(i, 1)[0];
    if (p.active) { p.active.status = {}; p.bench.push(p.active); }
    p.active = nb;
  }

  // ---------- KO-Prüfung & Zugfluss ----------
  function checkKOs(s) {
    for (let pi = 0; pi < 2; pi++) {
      const p = s.players[pi];
      for (const sl of slotsOf(p).slice()) {
        if (sl.damage >= hpMax(s, sl)) {
          const c = top(s, sl);
          const val = c.bigBad ? CFG.BIGBAD_KO_VALUE : 1;
          s.players[opp(pi)].kos += val;
          log(s, M(c.bigBad ? 'log.koBig' : 'log.ko', { c: C(c.id) }));
          const by = s.players[s.current].active;
          s.events.push({ type: 'ko', pi, name: C(c.id), card: c.id, ctype: c.type, slot: sl.id, bigBad: c.bigBad, by: s.current, attacker: by && by !== sl ? top(s, by).id : null });
          discardSlot(s, pi, sl);
          if (p.active === sl) { p.active = null; }
          else p.bench = p.bench.filter((b) => b !== sl);
        }
      }
    }
    // Sieg durch KOs
    const w = [0, 1].filter((pi) => s.players[pi].kos >= CFG.KO_TO_WIN);
    if (w.length) return win(s, w.length === 2 ? s.current : w[0], M('win.kos', { n: CFG.KO_TO_WIN })), true;
    for (let pi = 0; pi < 2; pi++) {
      const p = s.players[pi];
      if (!p.active && !p.bench.length) return win(s, opp(pi), M('win.noChars', { p: p.name })), true;
    }
    for (let pi = 0; pi < 2; pi++) if (!s.players[pi].active && !s.pendingPromote.includes(pi)) s.pendingPromote.push(pi);
    return false;
  }

  function flow(s, cont) {
    if (s.phase === 'over') return;
    if (checkKOs(s)) return;
    if (s.pendingPromote.length) { s.phase = 'promote'; s.after = cont; return; }
    if (cont === 'endTurn') endTurn(s);
    else if (cont === 'nextTurn') nextTurn(s);
  }

  E.promote = function (s, pi, benchId) {
    moveToActive(s, pi, benchId);
    log(s, M('log.promote', { p: s.players[pi].name, c: C(top(s, s.players[pi].active).id) }));
    s.pendingPromote = s.pendingPromote.filter((x) => x !== pi);
    if (!s.pendingPromote.length && s.phase === 'promote') {
      const cont = s.after; s.after = null; s.phase = 'main';
      flow(s, cont);
    }
  };
  E.autoPromote = function (s, pi) {
    const p = s.players[pi];
    const best = p.bench.slice().sort((a, b) => promoteScore(s, b) - promoteScore(s, a))[0];
    E.promote(s, pi, best.id);
  };
  function promoteScore(s, sl) {
    const c = top(s, sl);
    const ready = c.attacks.some((a) => E.canPay(a.cost, energyTypes(s, sl)));
    return (hpMax(s, sl) - sl.damage) + sl.energy.length * 25 + (ready ? 60 : 0);
  }

  function endTurn(s) {
    // Zwischen den Zügen: Zustände und Stadion
    const st = stadiumFx(s);
    for (let pi = 0; pi < 2; pi++) {
      const a = s.players[pi].active;
      if (!a) continue;
      const nm = C(top(s, a).id);
      if (a.status.poison) { a.damage += 10; log(s, M('log.poison', { c: nm })); }
      if (a.status.burn) { a.damage += 20; log(s, M('log.burn', { c: nm })); if (coin(s, M('coin.burn', { c: nm }))) delete a.status.burn; }
      if (a.status.sleep) { if (coin(s, M('coin.sleep', { c: nm }))) { delete a.status.sleep; log(s, M('log.wake', { c: nm })); } }
      if (a.status.para && pi === s.current && a.status.para < s.turn + 1) { delete a.status.para; log(s, M('log.unpara', { c: nm })); }
      if (st && st.t === 'endTurnDmg') { a.damage += st.n; }
    }
    if (st && st.t === 'endTurnDmg') log(s, M('log.stadiumDmg', { c: C(def(s, s.stadium).id), n: st.n }));
    if (st && st.t === 'endTurnHeal') for (const p of s.players) if (p.active) heal(s, p.active, st.n);
    if (st && st.t === 'vampRegen') for (const p of s.players) for (const sl of slotsOf(p)) if (top(s, sl).type === 'Vampir' && sl.damage > 0) heal(s, sl, st.n);
    flow(s, 'nextTurn');
  }
  function nextTurn(s) {
    if (s.phase === 'over') return;
    s.current = opp(s.current);
    s.turn++;
    startTurn(s);
  }

  // ---------- Aktionen ausführen ----------
  E.apply = function (s, action, picks) {
    picks = picks || {};
    const pi = s.current, p = s.players[pi], o = s.players[opp(pi)];
    const fromHand = (u) => { const i = p.hand.indexOf(u); if (i >= 0) p.hand.splice(i, 1); };
    const pk = (k) => picks[k] || [];
    switch (action.type) {
      case 'bench': {
        fromHand(action.uid);
        p.bench.push(newSlot(s, action.uid));
        log(s, M('log.bench', { p: p.name, c: C(def(s, action.uid).id) }));
        s.events.push({ type: 'bench', pi, slot: p.bench[p.bench.length - 1].id });
        break;
      }
      case 'evolve': {
        const sl = findSlot(s, action.target).slot;
        const old = C(top(s, sl).id);
        fromHand(action.uid);
        sl.cards.push(action.uid);
        sl.evolvedTurn = s.turn;
        sl.status = {};
        log(s, M('log.evolve', { a: old, b: C(def(s, action.uid).id) }));
        s.events.push({ type: 'evolve', pi, slot: sl.id, card: def(s, action.uid).id });
        break;
      }
      case 'energy': {
        const sl = findSlot(s, action.target).slot;
        fromHand(action.uid);
        sl.energy.push(action.uid);
        s.flags.energy = true;
        s.events.push({ type: 'energy', pi, slot: sl.id, e: def(s, action.uid).energy });
        log(s, M('log.energy', { p: p.name, e: B.ENERGY[def(s, action.uid).energy].icon, c: C(top(s, sl).id) }));
        break;
      }
      case 'retreat': {
        const sl = p.active, cost = E.retreatCost(s, pi, sl);
        const paid = sl.energy.splice(sl.energy.length - cost, cost);
        p.discard.push(...paid);
        const nm = C(top(s, sl).id);
        moveToActive(s, pi, action.target);
        s.flags.retreat = true;
        log(s, M('log.retreat', { a: nm, b: C(top(s, p.active).id) }));
        s.events.push({ type: 'retreat', pi });
        break;
      }
      case 'trainer': playTrainer(s, action.uid, picks); return flow(s, null);
      case 'ability': useAbility(s, action.slot, picks); return flow(s, null);
      case 'attack': return doAttack(s, action.idx, picks);
      case 'end': log(s, M('log.end', { p: p.name })); return endTurn(s);
      default: break;
    }
    void o;
  };

  function playTrainer(s, uid, picks) {
    const pi = s.current, p = s.players[pi], o = s.players[opp(pi)];
    const c = def(s, uid), f = c.fx;
    const pk = (k) => picks[k] || [];
    p.hand.splice(p.hand.indexOf(uid), 1);
    log(s, M('log.trainer', { p: p.name, sub: M('sub.' + c.sub), c: C(c.id) }));
    s.events.push({ type: 'trainer', pi, uid, sub: c.sub, card: c.id });
    if (c.sub === 'Unterstützer') s.flags.supporter = true;
    if (c.sub === 'Ausrüstung') {
      const sl = findSlot(s, pk('target')[0]).slot;
      sl.tool = uid;
      s.events.push({ type: 'tool', pi, slot: sl.id });
      log(s, M('log.tool', { t: C(c.id), c: C(top(s, sl).id) }));
      return;
    }
    if (c.sub === 'Stadion') {
      if (s.stadium) s.players[s.stadiumOwner].discard.push(s.stadium);
      s.stadium = uid; s.stadiumOwner = pi; s.flags.stadium = true;
      return;
    }
    const draw = (n) => { for (let i = 0; i < n && p.deck.length; i++) p.hand.push(p.deck.shift()); };
    switch (f.t) {
      case 'draw': draw(f.n); break;
      case 'shuffleDraw': p.deck.push(...p.hand); p.hand = []; shuffle(s, p.deck); draw(f.n); break;
      case 'drawTo': draw(Math.max(0, f.n - p.hand.length)); break;
      case 'drawPerChar': draw(slotsOf(p).length); break;
      case 'searchDeck': {
        for (const u of pk('cards')) {
          const i = p.deck.indexOf(u); if (i < 0) continue;
          p.deck.splice(i, 1);
          if (f.to === 'bench' && p.bench.length < CFG.BENCH_MAX) p.bench.push(newSlot(s, u)); else p.hand.push(u);
          log(s, M('log.take', { p: p.name, c: C(def(s, u).id) }));
        }
        shuffle(s, p.deck);
        break;
      }
      case 'topPick': {
        for (const u of pk('cards')) { const i = p.deck.indexOf(u); if (i >= 0) { p.deck.splice(i, 1); p.hand.push(u); } }
        shuffle(s, p.deck);
        break;
      }
      case 'searchEnergy': {
        let n = f.n;
        for (let i = 0; i < p.deck.length && n > 0; i++) if (def(s, p.deck[i]).energy === f.e) { p.hand.push(p.deck.splice(i, 1)[0]); i--; n--; }
        shuffle(s, p.deck);
        break;
      }
      case 'gust': moveToActive(s, opp(pi), pk('target')[0]); log(s, M('log.gusted', { c: C(top(s, o.active).id) })); break;
      case 'healPick': { const t = findSlot(s, pk('target')[0]).slot; heal(s, t, f.n); if (f.clear) t.status = {}; break; }
      case 'healAllDraw': for (const x of slotsOf(p)) heal(s, x, f.n); draw(f.d); break;
      case 'drawNamed': draw(f.n + (slotsOf(p).some((x) => top(s, x).name.startsWith(f.name)) ? f.bonus : 0)); break;
      case 'energyToNamed': {
        const t = findSlot(s, pk('target')[0]).slot;
        let n = f.n;
        for (let i = 0; i < p.discard.length && n > 0; i++) if (def(s, p.discard[i]).kind === 'energy') { t.energy.push(p.discard.splice(i, 1)[0]); i--; n--; }
        log(s, M('log.energyNamed', { n: f.n - n, c: C(top(s, t).id) }));
        break;
      }
      case 'dmgOppActive': {
        const t = toolOf(s, o.active);
        if (t && t.itemImmune) log(s, M('log.amara'));
        else { o.active.damage += f.n; log(s, M('log.dmg', { c: C(top(s, o.active).id), n: f.n })); }
        break;
      }
      case 'coinParaOpp': if (coin(s, C(c.id))) applyStatus(s, o.active, 'para'); break;
      case 'benchDmg': benchDamage(s, opp(pi), findSlot(s, pk('target')[0]).slot, f.n, true); break;
      case 'energyFromDiscardPick': {
        const u = pk('cards')[0], sl = findSlot(s, pk('target')[0]).slot;
        p.discard.splice(p.discard.indexOf(u), 1); sl.energy.push(u);
        log(s, M('log.energyAttach', { e: B.ENERGY[def(s, u).energy].icon, c: C(top(s, sl).id) }));
        break;
      }
      case 'switchSelf': moveToActive(s, pi, pk('target')[0]); log(s, M('log.forward', { c: C(top(s, p.active).id) })); break;
      case 'recoverChar': { const u = pk('cards')[0]; p.discard.splice(p.discard.indexOf(u), 1); p.hand.push(u); break; }
      case 'discardStadium': s.players[s.stadiumOwner].discard.push(s.stadium); log(s, M('log.wrecked', { c: C(def(s, s.stadium).id) })); s.stadium = null; s.stadiumOwner = null; break;
      default: break;
    }
    p.discard.push(uid);
  }

  function useAbility(s, slotId, picks) {
    const pi = s.current, p = s.players[pi], o = s.players[opp(pi)];
    const sl = findSlot(s, slotId).slot, ab = abilityOf(s, sl), nm = C(top(s, sl).id);
    const pk = (k) => picks[k] || [];
    sl.abilityTurn = s.turn;
    log(s, M('log.ability', { c: nm, a: AB(top(s, sl).id) }));
    s.events.push({ type: 'ability', pi, card: top(s, sl).id });
    switch (ab.t) {
      case 'draw': for (let i = 0; i < ab.n && p.deck.length; i++) p.hand.push(p.deck.shift()); break;
      case 'energyFromDiscardPick': {
        const i = p.discard.findIndex((u) => def(s, u).energy === ab.e);
        const t = findSlot(s, pk('target')[0]).slot;
        t.energy.push(p.discard.splice(i, 1)[0]);
        break;
      }
      case 'peekHand': s.events.push({ type: 'peek', pi, cards: o.hand.slice() }); break;
      case 'discardDraw': { const u = pk('cards')[0]; p.hand.splice(p.hand.indexOf(u), 1); p.discard.push(u); for (let i = 0; i < 2 && p.deck.length; i++) p.hand.push(p.deck.shift()); break; }
      case 'healPick': heal(s, findSlot(s, pk('target')[0]).slot, ab.n); break;
      case 'healAll': for (const x of slotsOf(p)) heal(s, x, ab.n); break;
      case 'extraEnergy': {
        const u = pk('cards')[0], t = findSlot(s, pk('target')[0]).slot;
        p.hand.splice(p.hand.indexOf(u), 1); t.energy.push(u); sl.damage += ab.selfDmg;
        break;
      }
      case 'coinSleep': if (coin(s, nm)) applyStatus(s, o.active, 'sleep'); break;
      case 'coinPara': if (coin(s, nm)) applyStatus(s, o.active, 'para'); break;
      default: break;
    }
  }

  function doAttack(s, idx, picks) {
    const pi = s.current, p = s.players[pi], o = s.players[opp(pi)];
    const att = p.active, A = top(s, att), atk = A.attacks[idx];
    const pk = (k) => picks[k] || [];
    s.flags.attacked = true;
    log(s, M('log.attack', { c: C(A.id), a: AT(A.id, idx) }));
    s.events.push({ type: 'attack', pi, name: AT(A.id, idx), card: A.id, ctype: A.type, slot: att.id });
    if (atk.fx.some((f) => f.t === 'gustBefore') && pk('gust').length) { moveToActive(s, opp(pi), pk('gust')[0]); log(s, M('log.gusted', { c: C(top(s, o.active).id) })); }
    const defSlot = o.active;
    const r = E.calcDamage(s, pi, att, defSlot, atk, 'roll');
    if (r.fail) { log(s, M('log.miss')); s.events.push({ type: 'miss', slot: defSlot.id }); return flow(s, 'endTurn'); }
    let dealt = 0;
    if (r.dmg > 0) {
      defSlot.damage += r.dmg; dealt = r.dmg;
      log(s, M(r.weak ? 'log.dmgWeak' : r.res ? 'log.dmgRes' : 'log.dmg', { c: C(top(s, defSlot).id), n: r.dmg }));
      s.events.push({ type: 'damage', pi: opp(pi), slot: defSlot.id, n: r.dmg, weak: r.weak, by: A.id, ctype: A.type });
    } else if (atk.dmg > 0 || atk.fx.some((f) => f.t === 'coins')) { log(s, M('log.nodmg', { c: C(top(s, defSlot).id) })); s.events.push({ type: 'nodmg', slot: defSlot.id }); }
    const draw = (n) => { for (let i = 0; i < n && p.deck.length; i++) p.hand.push(p.deck.shift()); };
    for (const f of atk.fx) {
      switch (f.t) {
        case 'draw': draw(f.n); break;
        case 'healSelf': heal(s, att, f.n); break;
        case 'selfDmg': att.damage += f.n; log(s, M('log.recoil', { c: C(A.id), n: f.n })); break;
        case 'discardSelfEnergy': { const n = Math.min(f.n, att.energy.length); p.discard.push(...att.energy.splice(att.energy.length - n, n)); log(s, M('log.discardE', { c: C(A.id), n })); break; }
        case 'status': if (o.active === defSlot && (!f.coin || coin(s, AT(A.id, idx)))) applyStatus(s, defSlot, f.s); break;
        case 'benchOne': for (const id of pk('benchOne')) { const t = findSlot(s, id); if (t) benchDamage(s, opp(pi), t.slot, f.n); } break;
        case 'benchAll': for (const b of o.bench.slice()) benchDamage(s, opp(pi), b, f.n); break;
        case 'lifesteal': heal(s, att, dealt); break;
        case 'searchBasic': for (const u of pk('search')) { const i = p.deck.indexOf(u); if (i >= 0 && p.bench.length < CFG.BENCH_MAX) { p.deck.splice(i, 1); p.bench.push(newSlot(s, u)); log(s, M('log.toBench', { c: C(def(s, u).id) })); } } shuffle(s, p.deck); break;
        case 'searchTool': for (const u of pk('tool')) { const i = p.deck.indexOf(u); if (i >= 0) { p.deck.splice(i, 1); p.hand.push(u); } } shuffle(s, p.deck); break;
        case 'energyFromDiscard': case 'energyFromDiscardPick': {
          const tgt = f.t === 'energyFromDiscard' ? att : (pk('efd').length ? findSlot(s, pk('efd')[0]).slot : att);
          let n = f.n;
          for (let i = 0; i < p.discard.length && n > 0; i++) if (def(s, p.discard[i]).energy === f.e) { tgt.energy.push(p.discard.splice(i, 1)[0]); i--; n--; }
          if (n < f.n) log(s, M('log.efd', { n: f.n - n, e: B.ENERGY[f.e].icon, c: C(top(s, tgt).id) }));
          break;
        }
        case 'switchSelf': if (pk('switch').length && p.active === att) { moveToActive(s, pi, pk('switch')[0]); log(s, M('log.flee', { c: C(A.id) })); s.events.push({ type: 'flee', pi, card: A.id }); } break;
        case 'cantAttackNext': att.noAttackTurn = s.turn + 2; break;
        case 'preventNext': if (!f.coin || coin(s, AT(A.id, idx))) { att.shieldTurn = s.turn + 1; log(s, M('log.shield', { c: C(A.id) })); } break;
        case 'discardOppHand': for (let i = 0; i < f.n && o.hand.length; i++) { const j = Math.floor(rnd(s) * o.hand.length); const u = o.hand.splice(j, 1)[0]; o.discard.push(u); log(s, M('log.oppDiscard', { p: o.name, c: C(def(s, u).id) })); } break;
        case 'healAllOwn': for (const x of slotsOf(p)) heal(s, x, f.n); break;
        case 'healOwnPick': for (const id of pk('heal')) { const t = findSlot(s, id); if (t) heal(s, t.slot, f.n); } break;
        case 'discardOppTool': if (o.active && o.active.tool) { o.discard.push(o.active.tool); log(s, M('log.toolDiscarded', { c: C(def(s, o.active.tool).id) })); o.active.tool = null; } break;
        default: break;
      }
    }
    flow(s, 'endTurn');
  }

  E.clone = (s) => JSON.parse(JSON.stringify(s));
  E.flow = flow;
})(typeof globalThis !== 'undefined' ? globalThis : window);
