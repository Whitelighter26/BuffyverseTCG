/* Buffyverse TCG – Sound
   Alles wird live per Web Audio synthetisiert: keine fremden Audiodateien, funktioniert offline.
   Musik: generativer Gothic-Loop (Menü ruhiger, im Spiel spannender). */
(function (G) {
  const B = G.BTCG;
  const S = (B.Sound = {});
  let ctx = null, master, sfx, music, verb, verbSend;
  let muted = false, sfxVol = 0.8, musicVol = 0.5;
  let musicMode = null, musicTimer = null, nextBar = 0, barIdx = 0;

  function impulse(sec, decay) {
    const len = ctx.sampleRate * sec, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }
  function init() {
    if (ctx) return true;
    const AC = G.AudioContext || G.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1;
    sfx = ctx.createGain(); sfx.gain.value = sfxVol;
    music = ctx.createGain(); music.gain.value = 0;
    verb = ctx.createConvolver(); verb.buffer = impulse(2.8, 2.6);
    verbSend = ctx.createGain(); verbSend.gain.value = 0.35;
    sfx.connect(master); music.connect(master);
    verbSend.connect(verb); verb.connect(master);
    master.connect(comp); comp.connect(ctx.destination);
    return true;
  }
  // Browser erlauben Ton erst nach der ersten Interaktion
  const unlock = () => { if (!init()) return; if (ctx.state === 'suspended') ctx.resume(); if (musicMode && !musicTimer) startScheduler(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => G.addEventListener && G.addEventListener(ev, unlock, { capture: true }));

  // ---------- Bausteine ----------
  function tone(freq, dur, o) {
    if (!ctx) return;
    o = o || {};
    const t = ctx.currentTime + (o.at || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + (o.glide || dur));
    if (o.detune) osc.detune.value = o.detune;
    const v = (o.vol == null ? 0.3 : o.vol);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.a || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
    node.connect(g);
    g.connect(o.dest || sfx);
    if (o.verb) { const s = ctx.createGain(); s.gain.value = o.verb; g.connect(s); s.connect(verbSend); }
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  let noiseBuf = null;
  function noise(dur, o) {
    if (!ctx) return;
    o = o || {};
    if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const t = ctx.currentTime + (o.at || 0);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = o.filter || 'bandpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f || 1000, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = ctx.createGain(), v = o.vol == null ? 0.3 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.a || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfx);
    if (o.verb) { const s = ctx.createGain(); s.gain.value = o.verb; g.connect(s); s.connect(verbSend); }
    src.start(t); src.stop(t + dur + 0.05);
  }
  const N = (m) => 440 * Math.pow(2, (m - 69) / 12); // MIDI → Hz
  function bell(freq, at, vol) {
    [1, 2.76, 5.4, 8.93].forEach((r, i) => tone(freq * r, 2.2 / (i + 1), { at, vol: (vol || 0.12) / (i + 1.2), verb: 0.6 }));
  }

  // ---------- Effekte ----------
  const FX = {
    click: () => { tone(1250, 0.05, { vol: 0.06, type: 'triangle' }); },
    card: () => noise(0.09, { f: 3500, to: 1800, q: 0.7, vol: 0.08, filter: 'highpass' }),
    drop: () => { tone(150, 0.18, { to: 60, vol: 0.25 }); noise(0.08, { f: 2500, vol: 0.06 }); },
    invalid: () => { tone(110, 0.16, { type: 'square', vol: 0.05, lp: 600 }); tone(98, 0.16, { type: 'square', vol: 0.05, lp: 600, at: 0.08 }); },
    energy: (e) => {
      const base = { K: 330, M: 523, V: 262, W: 440 }[e] || 400;
      tone(base, 0.12, { type: 'triangle', vol: 0.12 }); tone(base * 1.5, 0.18, { type: 'triangle', vol: 0.12, at: 0.07, verb: 0.3 });
    },
    bench: () => { noise(0.12, { f: 1200, to: 400, vol: 0.1 }); tone(196, 0.2, { vol: 0.15, to: 120 }); },
    evolve: () => {
      noise(1.1, { f: 400, to: 6000, q: 0.6, vol: 0.12, filter: 'bandpass', a: 0.5 });
      [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => tone(N(m), 0.9, { at: 0.12 * i, type: 'triangle', vol: 0.11, verb: 0.7 }));
      tone(N(48), 1.6, { at: 0.8, type: 'sawtooth', vol: 0.06, lp: 900, verb: 0.5, a: 0.2 });
    },
    attack: (type) => {
      noise(0.16, { f: 500, to: 2600, q: 0.8, vol: 0.14 }); // Ausholen
      switch (type) {
        case 'Kampf': tone(130, 0.2, { to: 45, vol: 0.45, at: 0.14 }); noise(0.07, { f: 1800, vol: 0.25, at: 0.14 }); break;
        case 'Magie': for (let i = 0; i < 7; i++) tone(1400 + Math.random() * 2000, 0.4, { at: 0.08 + i * 0.04, vol: 0.06, verb: 0.8 }); tone(110, 0.6, { type: 'sawtooth', lp: 500, vol: 0.08, at: 0.1 }); break;
        case 'Vampir': noise(0.35, { f: 5000, filter: 'highpass', vol: 0.12, a: 0.05 }); noise(0.05, { f: 900, vol: 0.3, at: 0.22 }); noise(0.05, { f: 700, vol: 0.3, at: 0.29 }); tone(70, 0.5, { type: 'sawtooth', lp: 300, vol: 0.12, at: 0.1 }); break;
        case 'Dämon': tone(65, 0.7, { type: 'sawtooth', lp: 380, vol: 0.2, to: 45 }); tone(68, 0.7, { type: 'sawtooth', lp: 380, vol: 0.15 }); tone(120, 0.25, { to: 40, vol: 0.4, at: 0.25 }); break;
        case 'Wissen': noise(0.12, { f: 300, filter: 'lowpass', vol: 0.4, at: 0.12 }); bell(N(81), 0.18, 0.1); break;
        case 'Militär': tone(1400, 0.16, { to: 180, type: 'square', vol: 0.07, lp: 3000 }); noise(0.18, { f: 1200, vol: 0.3, at: 0.13, q: 0.4 }); break;
        default: tone(120, 0.2, { to: 50, vol: 0.4, at: 0.12 });
      }
    },
    hit: (n, weak) => {
      const v = Math.min(0.5, 0.15 + n / 400);
      tone(90, 0.25 + n / 600, { to: 38, vol: v });
      noise(0.12, { f: 1400, vol: v * 0.6 });
      if (n >= 100) { tone(55, 0.9, { to: 30, vol: 0.4, verb: 0.4 }); noise(0.6, { f: 250, filter: 'lowpass', vol: 0.25, verb: 0.5 }); }
      if (weak) { tone(2400, 0.25, { type: 'triangle', vol: 0.08, at: 0.05 }); tone(3200, 0.3, { type: 'triangle', vol: 0.06, at: 0.1, verb: 0.5 }); }
    },
    ko: (type) => {
      tone(80, 1.2, { to: 28, vol: 0.5, glide: 1.0 });
      [69, 65, 62, 57].forEach((m, i) => tone(N(m), 0.5, { at: 0.12 + i * 0.16, type: 'sawtooth', lp: 1400, vol: 0.07, verb: 0.6 }));
      noise(1.4, { f: type === 'Vampir' ? 3000 : 900, to: 200, filter: 'lowpass', vol: 0.18, a: 0.3, at: 0.15, verb: 0.6 });
      if (type === 'Vampir') noise(0.5, { f: 6000, filter: 'highpass', vol: 0.1, at: 0.1 }); // „Puff“ – zu Staub
    },
    heal: () => [72, 76, 79].forEach((m, i) => tone(N(m), 0.4, { at: i * 0.06, vol: 0.06, verb: 0.6, type: 'sine' })),
    status: () => { tone(300, 0.4, { to: 180, type: 'triangle', vol: 0.08 }); tone(310, 0.4, { to: 190, type: 'triangle', vol: 0.06 }); },
    coin: (heads) => {
      for (let i = 0; i < 5; i++) tone(2200 + (i % 2) * 400, 0.06, { at: i * 0.07, type: 'triangle', vol: 0.05 });
      tone(heads ? 1568 : 988, 0.5, { at: 0.42, type: 'triangle', vol: 0.12, verb: 0.4 });
    },
    turn: (mine) => bell(mine ? N(57) : N(50), 0, mine ? 0.14 : 0.1),
    win: () => {
      [60, 64, 67, 72].forEach((m, i) => tone(N(m), 0.5, { at: i * 0.14, type: 'sawtooth', lp: 2500, vol: 0.1, verb: 0.5 }));
      [60, 64, 67, 72, 76].forEach((m) => tone(N(m), 1.8, { at: 0.6, type: 'triangle', vol: 0.08, verb: 0.7, a: 0.05 }));
    },
    lose: () => [[62, 65, 69], [58, 62, 65], [57, 61, 64]].forEach((ch, i) => ch.forEach((m) => tone(N(m - 12), 1.2, { at: i * 0.6, type: 'sawtooth', lp: 900, vol: 0.06, verb: 0.6, a: 0.08 }))),
    booster: (legend) => {
      noise(0.35, { f: 800, to: 5000, q: 1.2, vol: 0.2 });
      for (let i = 0; i < 10; i++) tone(1800 + Math.random() * 2400, 0.3, { at: 0.3 + i * 0.05, vol: 0.05, verb: 0.7 });
      if (legend) [62, 66, 69, 74].forEach((m) => tone(N(m), 2.4, { at: 0.5, type: 'sawtooth', lp: 1800, vol: 0.05, a: 0.4, verb: 0.9 }));
    },
    achievement: () => { [76, 79, 84, 88].forEach((m, i) => tone(N(m), 0.6, { at: i * 0.09, type: 'triangle', vol: 0.09, verb: 0.7 })); },
  };
  S.play = function (name, ...args) {
    if (muted || !FX[name]) return;
    if (!init()) return;
    if (ctx.state === 'suspended') return;
    try { FX[name](...args); } catch (e) { /* Ton ist Kür, kein Muss */ }
  };

  // ---------- Musik ----------
  const PROG = {
    menu: { bpm: 54, chords: [[50, 57, 62, 65], [46, 53, 58, 62], [43, 50, 55, 58], [45, 52, 57, 61]], vol: 0.55, pluck: 0.45 }, // Dm Bb Gm A
    game: { bpm: 68, chords: [[45, 52, 57, 60], [41, 48, 53, 57], [38, 45, 50, 53], [40, 47, 52, 56]], vol: 0.32, pluck: 0.3 }, // Am F Dm E
  };
  function scheduleBar(p, t) {
    const ch = p.chords[barIdx % p.chords.length];
    const bar = (60 / p.bpm) * 4;
    // Pad: verstimmte Sägezähne, weich gefiltert
    ch.forEach((m, i) => {
      [-7, 7].forEach((det) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.value = N(m); o.detune.value = det;
        f.type = 'lowpass'; f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(900 + i * 80, t + bar / 2); f.frequency.linearRampToValueAtTime(500, t + bar);
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.022, t + bar * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + bar * 1.05);
        o.connect(f); f.connect(g); g.connect(music);
        const s = ctx.createGain(); s.gain.value = 0.5; g.connect(s); s.connect(verbSend);
        o.start(t); o.stop(t + bar * 1.1);
      });
    });
    // Bass
    const bo = ctx.createOscillator(), bg = ctx.createGain();
    bo.type = 'sine'; bo.frequency.value = N(ch[0] - 12);
    bg.gain.setValueAtTime(0.0001, t); bg.gain.linearRampToValueAtTime(0.09, t + 0.3); bg.gain.linearRampToValueAtTime(0.0001, t + bar);
    bo.connect(bg); bg.connect(music); bo.start(t); bo.stop(t + bar + 0.1);
    // Glockenspiel-Tupfer (Cembalo-artig)
    const steps = 8, st = bar / steps;
    for (let i = 0; i < steps; i++) {
      if (Math.random() > p.pluck) continue;
      const m = ch[1 + Math.floor(Math.random() * 3)] + 12 + (Math.random() < 0.3 ? 12 : 0);
      const o = ctx.createOscillator(), g = ctx.createGain(), tt = t + i * st;
      o.type = 'triangle'; o.frequency.value = N(m);
      g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.03, tt + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, tt + 1.2);
      o.connect(g); g.connect(music);
      const s = ctx.createGain(); s.gain.value = 0.8; g.connect(s); s.connect(verbSend);
      o.start(tt); o.stop(tt + 1.3);
    }
    barIdx++;
    return bar;
  }
  function startScheduler() {
    if (!ctx || musicTimer) return;
    nextBar = Math.max(nextBar, ctx.currentTime + 0.1);
    musicTimer = setInterval(() => {
      if (!musicMode || ctx.state !== 'running') return;
      while (nextBar < ctx.currentTime + 1.5) nextBar += scheduleBar(PROG[musicMode], nextBar);
    }, 250);
  }
  S.music = function (mode) {
    if (mode === musicMode) return;
    musicMode = mode;
    if (!init()) return;
    const target = mode ? PROG[mode].vol * musicVol : 0;
    music.gain.cancelScheduledValues(ctx.currentTime);
    music.gain.setTargetAtTime(target, ctx.currentTime, 0.8);
    if (mode) startScheduler();
  };

  // ---------- Lautstärke ----------
  S.setMuted = function (m) {
    muted = !!m;
    if (ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05); }
  };
  S.isMuted = () => muted;
  S.setVolumes = function (sv, mv) {
    sfxVol = sv; musicVol = mv;
    if (ctx) { sfx.gain.value = sfxVol; if (musicMode) music.gain.setTargetAtTime(PROG[musicMode].vol * musicVol, ctx.currentTime, 0.2); }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
