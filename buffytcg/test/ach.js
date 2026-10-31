global.localStorage = { d:{}, getItem(k){return this.d[k]||null}, setItem(k,v){this.d[k]=v} };
require('../js/version.js'); require('../js/cards.js'); require('../js/i18n-cards.js'); require('../js/i18n.js'); require('../js/engine.js'); require('../js/ai.js'); require('../js/decks.js'); require('../js/achievements.js');
const B = globalThis.BTCG, E = B.Engine;
const save = B.newSave();
const got = {};
for (let i = 0; i < 80; i++) {
  const opp = B.PREBUILT[i % B.PREBUILT.length];
  const mine = B.PREBUILT[(i*3+1) % B.PREBUILT.length];
  const s = E.newGame([mine.cards, opp.cards], { ai: [true, true] });
  const t = B.Ach.newTracker('erfahren', opp.id);
  B.AI.setup(s,0,'profi'); B.AI.setup(s,1,'erfahren'); E.begin(s);
  while (s.phase !== 'over') {
    if (s.phase === 'promote') { B.AI.promote(s, s.pendingPromote[0], 'erfahren'); }
    else { const { action, picks } = B.AI.decide(s, s.current ? 'erfahren' : 'profi'); E.apply(s, action, picks); }
    for (const ev of s.events) B.Ach.track(t, s, ev, 0); B.Ach.track(t, s, {type:'tick'}, 0); s.events = [];
  }
  t.won = s.winner === 0; t.turns = s.turn;
  B.Ach.applyGame(save, t);
  for (const a of B.Ach.check(save, { type: 'game', game: t })) got[a.id] = i;
}
for (let i=0;i<30;i++){ save.booster.opened=0; B.openBooster(save); B.Ach.check(save,{type:'booster'}).forEach(a=>got[a.id]='b'); }
console.log(Object.keys(got).length, 'freigeschaltet:', Object.keys(got).join(' '));
console.log('Bonus-Booster:', save.bonusBoosters, 'Promo-Karten:', Object.keys(save.collection).filter(id=>B.CARDS[id].promo));
console.log('stats', JSON.stringify(save.stats).slice(0,400));
