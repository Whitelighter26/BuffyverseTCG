/* Buffyverse TCG – KI mit drei Schwierigkeitsstufen
   Beginner : spielt zufällig mit leichtem Gespür fürs Offensichtliche
   Erfahren : bewertet jede Aktion per Simulation, etwas Rauschen, denkt nicht an Konter
   Profi    : volle Simulation, plant K.O.s, schützt Big Bads, rechnet mit dem Gegenschlag */
(function (G) {
  const B = G.BTCG;
  const E = B.Engine;
  const AI = (B.AI = {});
  AI.P = { hand: 10, threat: 30, threatE: 0, drawFirst: 25, noise: 30 };
  const LEVELS = { beginner: 'Beginner', erfahren: 'Erfahren', profi: 'Profi' };
  AI.LEVELS = LEVELS;

  const rand = () => Math.random();
  const pickRandom = (arr) => arr[Math.floor(rand() * arr.length)];
  const def = E.def, top = E.top, slotsOf = E.slotsOf;

  // ---------- Bewertungsfunktion ----------
  function bestExpected(s, attPi, attSlot, defSlot, extraEnergy) {
    if (!attSlot || !defSlot) return 0;
    const types = E.energyTypes(s, attSlot).concat(extraEnergy || []);
    let best = 0;
    for (const a of top(s, attSlot).attacks) {
      if (!E.canPay(a.cost, types)) continue;
      const r = E.calcDamage(s, attPi, attSlot, defSlot, a, 'expected');
      if (r.dmg > best) best = r.dmg;
    }
    return best;
  }
  function slotValue(s, sl, isActive) {
    const c = top(s, sl);
    const rem = E.hpMax(s, sl) - sl.damage;
    let v = rem * 0.6 + sl.energy.length * 18 + c.stage * 30 + (sl.tool ? 10 : 0) + (c.bigBad ? 35 : 0);
    if (isActive) {
      if (c.attacks.some((a) => E.canPay(a.cost, E.energyTypes(s, sl)))) v += 20;
      if (sl.status.sleep || sl.status.para) v -= 25;
      if (sl.status.poison) v -= 12;
      if (sl.status.burn) v -= 18;
    }
    return v;
  }
  function evaluate(s, pi, level) {
    if (s.phase === 'over') return s.winner === pi ? 1e6 : -1e6;
    const me = s.players[pi], op = s.players[1 - pi];
    let v = 450 * (me.kos - op.kos);
    if (me.active) v += slotValue(s, me.active, true);
    for (const b of me.bench) v += slotValue(s, b, false);
    if (op.active) v -= slotValue(s, op.active, true);
    for (const b of op.bench) v -= slotValue(s, b, false);
    v += Math.min(me.hand.length, 10) * (level === 'profi' ? AI.P.hand : 7) - Math.min(op.hand.length, 8) * 3;
    v += Math.min(me.bench.length, 4) * 12;
    if (me.deck.length < 6) v -= (6 - me.deck.length) * 15;
    // Kann ich den aktiven Gegner diesen Zug K.O. schlagen?
    if (me.active && op.active) {
      const dmg = bestExpected(s, pi, me.active, op.active);
      const rem = E.hpMax(s, op.active) - op.active.damage;
      if (dmg >= rem) v += 140 * (top(s, op.active).bigBad ? 2 : 1);
      else v += dmg * 0.8;
    }
    // Profi: Was kann der Gegner mir im nächsten Zug antun? (+1 Energie angenommen)
    if (level === 'profi' && me.active && op.active) {
      const e = B.TYPES[top(s, op.active).type].energy;
      const dmg = bestExpected(s, 1 - pi, op.active, me.active, [e]);
      const rem = E.hpMax(s, me.active) - me.active.damage;
      if (dmg >= rem) v -= AI.P.threat * (top(s, me.active).bigBad ? 2 : 1) + me.active.energy.length * AI.P.threatE;
    }
    return v;
  }
  AI.evaluate = evaluate;

  // ---------- Auswahl-Heuristiken ----------
  function remHp(s, sl) { return E.hpMax(s, sl) - sl.damage; }
  function energyGain(s, sl, eType) {
    const c = top(s, sl), before = E.energyTypes(s, sl), after = before.concat([eType]);
    const best = (types) => Math.max(0, ...c.attacks.filter((a) => E.canPay(a.cost, types)).map((a) => a.dmg + a.fx.length * 15));
    let gain = best(after) - best(before);
    // Fortschritt Richtung teuerstem Angriff
    const big = c.attacks.slice().sort((x, y) => y.cost.length - x.cost.length)[0];
    if (big && !E.canPay(big.cost, before) && before.length < big.cost.length) {
      const need = big.cost.split('').filter((x) => x !== '*');
      const has = before.slice();
      const useful = need.includes(eType) ? need.filter((x) => x === eType).length > has.filter((x) => x === eType).length : big.cost.includes('*');
      if (useful) gain += 25;
    }
    // Energie, deren Typ der Charakter nie braucht, ist fast wertlos
    if (!c.attacks.some((a) => a.cost.includes(eType) || a.cost.includes('*'))) gain -= 40;
    return gain;
  }
  AI.energyGain = energyGain;

  function chooseFor(s, action, steps, level) {
    const picks = {};
    const pi = s.current, p = s.players[pi], o = s.players[1 - pi];
    for (const st of steps) {
      const opts = st.options.slice();
      if (!opts.length) { picks[st.key] = []; continue; }
      if (level === 'beginner') {
        const n = st.min + Math.floor(rand() * (st.max - st.min + 1));
        picks[st.key] = shuffleCopy(opts).slice(0, Math.max(st.min, n)).map((x) => x.ref);
        continue;
      }
      let scored;
      const slotOf = (ref) => E.findSlot(s, ref);
      const kind = action.type === 'trainer' ? def(s, action.uid).fx.t || def(s, action.uid).sub : action.type;
      if (opts[0].slot) {
        scored = opts.map((x) => {
          const f = slotOf(x.ref), sl = f.slot, mine = f.pi === pi;
          let sc = 0;
          if (!mine) {
            // Gegner-Bank: K.O.-Kandidaten bevorzugen
            const dmgHere = st.key === 'gust' || kind === 'gust' ? bestExpectedAgainst(s, pi, sl) : 20;
            const r = remHp(s, sl);
            sc = (dmgHere >= r ? 500 * (top(s, sl).bigBad ? 2 : 1) : 0) + sl.energy.length * 30 + top(s, sl).stage * 20 - r * 0.5;
            if (st.key === 'gust' || kind === 'gust') sc += sl.energy.length === 0 ? 20 : 0;
          } else if (st.key === 'switch' || kind === 'switchSelf') {
            const ready = top(s, sl).attacks.some((a) => E.canPay(a.cost, E.energyTypes(s, sl)));
            sc = (ready ? 100 : 0) + remHp(s, sl) * 0.5 + sl.energy.length * 15;
          } else if (kind === 'healPick' || st.key === 'heal' || st.purpose === 'heal') {
            sc = sl.damage + (sl === p.active ? 15 : 0);
          } else {
            // Energie/Ausrüstung anlegen
            sc = sl.energy.length * 10 + (sl === p.active ? 20 : 0) + top(s, sl).stage * 15 + (top(s, sl).bigBad ? 25 : 0);
          }
          return { x, sc };
        });
      } else {
        scored = opts.map((x) => ({ x, sc: cardWant(s, pi, x.ref, action, st) }));
      }
      scored.sort((a, b) => b.sc - a.sc);
      let n = st.max;
      if (st.key === 'switch') n = scored[0].sc >= 100 && p.active && remHp(s, p.active) < 50 ? 1 : 0;
      if (st.purpose === 'discard') { scored.sort((a, b) => a.sc - b.sc); n = 1; }
      picks[st.key] = scored.slice(0, Math.max(st.min, n)).map((y) => y.x.ref);
    }
    return picks;
  }
  AI.chooseFor = chooseFor;
  function shuffleCopy(a) { const c = a.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; }
  function bestExpectedAgainst(s, pi, targetSlot) {
    const me = s.players[pi];
    return me.active ? bestExpected(s, pi, me.active, targetSlot) : 0;
  }
  function cardWant(s, pi, uid, action, st) {
    const p = s.players[pi], c = def(s, uid);
    const inPlayIds = slotsOf(p).map((sl) => top(s, sl).id);
    if (c.kind === 'char') {
      if (c.stage > 0 && inPlayIds.includes(c.from)) return 200 + c.hp;
      if (c.stage > 0) return 40 + c.hp * 0.2;
      return 80 + c.hp * 0.3 + (c.bigBad ? 60 : 0);
    }
    if (c.kind === 'energy') {
      const gains = slotsOf(p).map((sl) => energyGain(s, sl, c.energy));
      return 60 + Math.max(0, ...gains) * 0.5;
    }
    if (c.sub === 'Unterstützer') return 70;
    if (c.sub === 'Ausrüstung') return 75;
    return 50;
  }

  // ---------- Aufbau & Nachrücken ----------
  AI.setup = function (s, pi, level) {
    if (level === 'beginner') return E.autoSetup(s, pi, 1 + Math.floor(rand() * 2));
    E.autoSetup(s, pi, level === 'profi' ? 5 : 3);
  };
  AI.promote = function (s, pi, level) {
    const p = s.players[pi];
    if (level === 'beginner') return E.promote(s, pi, pickRandom(p.bench).id);
    if (level === 'profi') {
      // Kandidaten simulieren und den besten Zustand wählen
      let best = null, bestV = -Infinity;
      for (const b of p.bench) {
        const c = E.clone(s);
        c.seed = (Math.random() * 2 ** 31) | 0;
        c.after = null; c.phase = 'main';
        c.pendingPromote = [];
        const pl = c.players[pi];
        const idx = pl.bench.findIndex((x) => x.id === b.id);
        const nb = pl.bench.splice(idx, 1)[0];
        pl.active = nb;
        const v = evaluate(c, pi, 'profi') + (top(c, nb).bigBad && remHp(c, nb) < 80 ? -150 : 0);
        if (v > bestV) { bestV = v; best = b.id; }
      }
      return E.promote(s, pi, best);
    }
    E.autoPromote(s, pi);
  };

  // ---------- Hauptentscheidung ----------
  // Gibt die nächste Aktion samt Auswahl zurück: { action, picks }
  AI.decide = function (s, level) {
    const acts = E.legalActions(s);
    if (level === 'beginner') return decideBeginner(s, acts);
    return decideSim(s, acts, level);
  };

  function decideBeginner(s, acts) {
    const pi = s.current, p = s.players[pi];
    const mk = (a) => ({ action: a, picks: chooseFor(s, a, E.choiceSpec(s, a), 'beginner') });
    const by = (t) => acts.filter((a) => a.type === t);
    s.aiMemo = s.aiMemo || {};
    const memo = s.aiMemo;
    if (memo.turn !== s.turn) { memo.turn = s.turn; memo.count = 0; memo.skip = {}; }
    memo.count++;
    if (memo.count > 25) return { action: { type: 'end' }, picks: {} };
    const evo = by('evolve');
    if (evo.length && rand() < 0.7) return mk(pickRandom(evo));
    const ben = by('bench');
    if (ben.length && p.bench.length < 3 && rand() < 0.6) return mk(pickRandom(ben));
    const en = by('energy');
    if (en.length) {
      const pref = rand() < 0.6 ? en.filter((a) => a.target === (p.active && p.active.id)) : en;
      return mk(pickRandom(pref.length ? pref : en));
    }
    const tr = by('trainer').filter((a) => !memo.skip[a.uid]);
    if (tr.length) {
      const a = pickRandom(tr);
      if (rand() < 0.45) return mk(a);
      memo.skip[a.uid] = true;
    }
    const ab = by('ability').filter((a) => !memo.skip[a.slot]);
    if (ab.length) { const a = pickRandom(ab); memo.skip[a.slot] = true; if (rand() < 0.5) return mk(a); }
    const at = by('attack');
    if (at.length) return mk(pickRandom(at));
    return { action: { type: 'end' }, picks: {} };
  }

  const DRAWISH = ['draw', 'drawTo', 'shuffleDraw', 'drawPerChar', 'topPick', 'searchDeck', 'searchEnergy'];
  function isDrawish(s, a) {
    if (a.type === 'trainer') return DRAWISH.includes(def(s, a.uid).fx.t);
    if (a.type === 'ability') { const ab = top(s, E.findSlot(s, a.slot).slot).ability; return ab.t === 'draw' || ab.t === 'discardDraw'; }
    return false;
  }
  function simulate(s, action, picks) {
    const c = E.clone(s);
    c.seed = (Math.random() * 2 ** 31) | 0;
    c.events = [];
    E.apply(c, action, picks);
    return c;
  }

  function decideSim(s, acts, level) {
    const pi = s.current;
    const noise = level === 'erfahren' ? AI.P.noise : 0;
    const rollouts = level === 'profi' ? 5 : 2;
    s.aiMemo = s.aiMemo || {};
    const memo = s.aiMemo;
    if (memo.turn !== s.turn) { memo.turn = s.turn; memo.count = 0; }
    memo.count++;
    const base = evaluate(s, pi, level);
    let best = null, bestGain = level === 'profi' ? 3 : 6;
    if (memo.count < 30) {
      for (const a of acts) {
        if (a.type === 'attack' || a.type === 'end') continue;
        if (level === 'erfahren' && a.type === 'retreat' && rand() < 0.5) continue;
        const picks = chooseFor(s, a, E.choiceSpec(s, a), level);
        // Zufällige Kartenzieher mehrfach simulieren, damit Glück die Bewertung nicht verzerrt
        const isRandom = a.type === 'trainer' || a.type === 'ability';
        const n = isRandom ? (level === 'profi' ? 3 : 1) : 1;
        let sum = 0;
        for (let i = 0; i < n; i++) sum += evaluate(simulate(s, a, picks), pi, level);
        let gain = sum / n - base + (noise ? (rand() - 0.5) * noise * 2 : 0);
        // Energie-Anlegen bekommt einen kleinen strategischen Bonus (Entwicklung braucht sie später)
        if (a.type === 'energy') gain += Math.max(-20, energyGain(s, E.findSlot(s, a.target).slot, def(s, a.uid).energy) * 0.3) + 4;
        if (a.type === 'evolve') gain += 15;
        if (a.type === 'bench' && s.players[pi].bench.length < 3) gain += 8;
        // Profi: erst Karten ziehen/suchen, dann entscheiden, wohin die Energie geht
        if (level === 'profi' && !s.flags.energy && isDrawish(s, a)) gain += AI.P.drawFirst;
        if (gain > bestGain) { bestGain = gain; best = { action: a, picks }; }
      }
    }
    if (best) return best;
    // Angriff wählen
    const attacks = acts.filter((a) => a.type === 'attack');
    if (attacks.length) {
      let bestA = null, bestV = -Infinity;
      for (const a of attacks) {
        const picks = chooseFor(s, a, E.choiceSpec(s, a), level);
        let sum = 0;
        for (let i = 0; i < rollouts; i++) sum += evaluate(simulate(s, a, picks), pi, level);
        const v = sum / rollouts + (noise ? (rand() - 0.5) * noise : 0);
        if (v > bestV) { bestV = v; bestA = { action: a, picks }; }
      }
      // Ein Angriff beendet den Zug – nur angreifen, wenn es nicht schadet
      const endV = evaluate(simulate(s, { type: 'end' }, {}), pi, level);
      if (bestV >= endV - 5) return bestA;
    }
    return { action: { type: 'end' }, picks: {} };
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
