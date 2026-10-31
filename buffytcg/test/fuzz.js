require('../js/version.js'); require('../js/cards.js'); require('../js/i18n-cards.js'); require('../js/i18n.js'); require('../js/engine.js'); require('../js/ai.js'); require('../js/decks.js');
const B = globalThis.BTCG, E = B.Engine;
// Alle Karten einmal in ein Zufallsdeck, damit jede Karte vorkommt
const all = Object.values(B.CARDS).filter(c=>c.kind!=='energy').map(c=>c.id);
function randDeck() { const d = {}; let n=0; const pool = all.slice().sort(()=>Math.random()-.5);
  for (const id of pool) { if (n>=36) break; const k = 1+Math.floor(Math.random()*2); d[id]=k; n+=k; }
  // Basis sicherstellen
  d['vampgen']=(d['vampgen']||0)+2; n+=2;
  for (const e of ['K','M','V','W']) d['e_'+e]=0;
  while(n<60){ const e=['K','M','V','W'][Math.floor(Math.random()*4)]; d['e_'+e]++; n++; }
  return d; }
let games=0, errs=0, overs=0, stuck=0;
const seen = new Set();
for (let g=0; g<1500; g++) {
  try {
    const s = E.newGame([randDeck(), randDeck()], {ai:[true,true]});
    E.autoSetup(s,0, Math.floor(Math.random()*6)); E.autoSetup(s,1,Math.floor(Math.random()*6)); E.begin(s);
    let steps=0;
    while (s.phase!=='over' && steps<1500) {
      steps++;
      if (s.phase==='promote') { const pi=s.pendingPromote[0]; const b=s.players[pi].bench; E.promote(s,pi,b[Math.floor(Math.random()*b.length)].id); continue; }
      const acts = E.legalActions(s);
      // ziemlich zufällig, aber 'end' seltener
      let a = acts[Math.floor(Math.random()*acts.length)];
      if (a.type==='end' && acts.length>1 && Math.random()<0.8) a = acts[Math.floor(Math.random()*(acts.length-1))];
      const steps2 = E.choiceSpec(s,a);
      const picks = B.AI.chooseFor(s,a,steps2,'beginner');
      if (a.type==='trainer') seen.add(B.CARDS[s.cards[a.uid]].id);
      if (a.type==='attack') seen.add(E.top(s,s.players[s.current].active).id+':'+a.idx);
      if (a.type==='ability') seen.add('ab:'+E.top(s,E.findSlot(s,a.slot).slot).id);
      E.apply(s,a,picks); s.events=[];
      // Invarianten
      for (const p of s.players) {
        const cnt = p.deck.length+p.hand.length+p.discard.length+E.slotsOf(p).reduce((x,sl)=>x+sl.cards.length+sl.energy.length+(sl.tool?1:0),0) + (s.stadium && s.players[s.stadiumOwner]===p ? 1:0);
        if (cnt!==60) throw new Error('Kartenzahl '+cnt+' nach '+a.type);
        if (p.bench.length>5) throw new Error('Bank > 5');
      }
    }
    games++; if (s.phase==='over') overs++; else stuck++;
  } catch(e) { errs++; if (errs<5) console.log(e.stack.split('\n').slice(0,3).join(' | ')); }
}
const trainers = Object.values(B.CARDS).filter(c=>c.kind==='trainer').map(c=>c.id).filter(id=>!seen.has(id));
console.log({games, overs, stuck, errs, nichtGespielteTrainer: trainers});
