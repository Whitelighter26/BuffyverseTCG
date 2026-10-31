require('../js/version.js'); require('../js/cards.js'); require('../js/i18n-cards.js'); require('../js/i18n.js'); require('../js/engine.js'); require('../js/ai.js'); require('../js/decks.js');
const B = globalThis.BTCG, E = B.Engine;
function play(d0, d1, l0, l1, seed) {
  const s = E.newGame([d0, d1], { ai: [true, true], seed });
  B.AI.setup(s, 0, l0); B.AI.setup(s, 1, l1); E.begin(s);
  const lv = [l0, l1]; let steps = 0;
  while (s.phase !== 'over' && steps < 3000) {
    steps++;
    if (s.phase === 'promote') { const pi = s.pendingPromote[0]; B.AI.promote(s, pi, lv[pi]); continue; }
    const { action, picks } = B.AI.decide(s, lv[s.current]);
    E.apply(s, action, picks); s.events = [];
  }
  return s.phase === 'over' ? s.winner : -1;
}
const [a, b] = (process.argv[2] || 'erfahren,profi').split(',');
const N = +(process.argv[3] || 40);
let wa = 0, wb = 0, d = 0;
for (let i = 0; i < N; i++) {
  const deck = B.PREBUILT[i % B.PREBUILT.length].cards;
  const flip = i % 2;
  const w = play(deck, deck, flip ? b : a, flip ? a : b, 5000 + i);
  if (w < 0) d++; else if ((w === 0) !== !!flip) wa++; else wb++;
}
console.log(`${a}: ${wa}  ${b}: ${wb}  offen: ${d}`);
