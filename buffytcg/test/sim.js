require('../js/version.js'); require('../js/cards.js'); require('../js/i18n-cards.js'); require('../js/i18n.js'); require('../js/engine.js'); require('../js/ai.js'); require('../js/decks.js');
const B = globalThis.BTCG, E = B.Engine;
let problems = 0;
const chars = Object.values(B.CARDS).filter(c=>c.kind==='char');
for (const c of chars) {
  if (c.stage>0 && !B.CARDS[c.from]) { console.log('missing from', c.id); problems++; }
  for (const a of c.attacks) if (!/^[KMVW*]+$/.test(a.cost)) { console.log('bad cost', c.id); problems++; }
}
console.log('Charaktere:', chars.length, 'Support:', Object.values(B.CARDS).filter(c=>c.kind==='trainer').length);
for (const d of B.PREBUILT) { const e = E.validateDeck(d.cards); if (e.length) { console.log(d.id, e); problems++; } }
function play(d0, d1, l0, l1, seed) {
  const s = E.newGame([d0, d1], { ai: [true, true], seed });
  B.AI.setup(s, 0, l0); B.AI.setup(s, 1, l1); E.begin(s);
  const lv = [l0, l1]; let steps = 0;
  while (s.phase !== 'over' && steps < 3000) {
    steps++;
    if (s.phase === 'promote') { const pi = s.pendingPromote[0]; B.AI.promote(s, pi, lv[pi]); continue; }
    const { action, picks } = B.AI.decide(s, lv[s.current]);
    E.apply(s, action, picks); s.events = [];
    if (s.turn > 200) break;
  }
  return { winner: s.phase === 'over' ? s.winner : -1, turns: s.turn, steps };
}
const lv = process.argv[2] ? process.argv[2].split(',') : ['beginner','erfahren','profi'];
const N = +(process.argv[3] || 6);
const decks = B.PREBUILT;
const t0 = Date.now();
const res = {};
let draws = 0, totalTurns = 0, games = 0;
const deckWins = {};
for (let i = 0; i < N; i++) for (const a of lv) for (const b of lv) {
  if (a === b) continue;
  const da = decks[(i*3) % decks.length], db = decks[(i*7+1) % decks.length];
  const r = play(da.cards, db.cards, a, b, 1000 + i);
  games++; totalTurns += r.turns;
  const k = a + ' vs ' + b; res[k] = res[k] || [0, 0, 0];
  if (r.winner === -1) { res[k][2]++; draws++; } else res[k][r.winner]++;
  if (r.winner >= 0) { const w = r.winner === 0 ? da.id : db.id; deckWins[w] = (deckWins[w]||0)+1; }
}
console.log(res, 'unentschieden/abgebrochen:', draws, 'Ø Züge:', (totalTurns/games).toFixed(1), 'Zeit:', ((Date.now()-t0)/1000).toFixed(1)+'s');
console.log('Deck-Siege:', deckWins, 'Probleme:', problems);
