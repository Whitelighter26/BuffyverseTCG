require('../js/version.js'); require('../js/cards.js'); require('../js/i18n-cards.js'); require('../js/i18n.js'); require('../js/engine.js'); require('../js/ai.js'); require('../js/decks.js');
const B = globalThis.BTCG, E = B.Engine;
const lvls = (process.argv[2]||'erfahren,profi').split(',');
const stat = {}; lvls.forEach(l=>stat[l]={});
for (let i=0;i<30;i++){
  const deck = B.PREBUILT[i % B.PREBUILT.length].cards;
  const s = E.newGame([deck, deck], { ai:[true,true], seed: 7000+i });
  const lv = i%2? [lvls[1],lvls[0]] : lvls;
  B.AI.setup(s,0,lv[0]); B.AI.setup(s,1,lv[1]); E.begin(s);
  let lastTurnAttacked = {};
  while (s.phase!=='over') {
    if (s.phase==='promote'){ const pi=s.pendingPromote[0]; B.AI.promote(s,pi,lv[pi]); continue; }
    const L = lv[s.current]; const {action,picks}=B.AI.decide(s,L);
    let k = action.type; if (k==='trainer') k='T:'+B.CARDS[s.cards[action.uid]].sub;
    if (k==='end') { const could = E.legalActions(s).some(a=>a.type==='attack'); if (could) k='end_without_attack'; }
    stat[L][k]=(stat[L][k]||0)+1;
    E.apply(s,action,picks); s.events=[];
  }
}
console.log(stat);
