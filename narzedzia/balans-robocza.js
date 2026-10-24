/* Wersja robocza: sprawdza balans bitwy bez ekranu.
   Rozgrywa wiele bitew na kilku etapach, z dwoma sposobami wybierania kart:
   „losowo” (jak dziecko, które klika cokolwiek) i „z głową” (najpierw super i połączenia, potem wieżyczki i ulepszenia).
   Uruchom: node narzedzia/balans-robocza.js [bitew na etap] [ostatni etap] */
'use strict';
const R = require('../wersja-robocza/gra.js');
const N = +process.argv[2] || 40, LAST = +process.argv[3] || 5;

const choosers = {
  losowo: (G, off) => off[Math.floor(Math.random() * off.length)],
  'z głową': (G, off) => {
    const built = Object.keys(G.w).length - 1;
    const score = c => c.type === 'super' ? 100 : c.type === 'combo' ? 70
      : c.type === 'build' ? 60 - 10 * built : c.type === 'heal' ? (G.baseHp < G.baseMax * 0.4 ? 90 : 5)
      : 30 + (c.id === 'dmg' ? 8 : 0) + Math.random() * 10;
    return off.reduce((a, b) => (score(b) > score(a) ? b : a));
  },
};

function battle(stage, choose) {
  const G = R.newBattle(stage), dt = 1 / 30, lv = {};
  let bossAt = null, minHp = 1;
  while (!G.over && G.t < 600) {
    if (G.pending) { R.applyCard(G, choose(G, R.makeOffer(G))); continue; }
    R.step(G, dt);
    if (!lv[G.lvl]) lv[G.lvl] = G.t;
    if (G.boss && bossAt === null) bossAt = G.t;
    minHp = Math.min(minHp, G.baseHp / G.baseMax);
  }
  return { win: G.over === 'win', t: G.t, hp: G.baseHp / G.baseMax, minHp, lvl: G.lvl, lv, bossFight: bossAt !== null && G.over === 'win' ? G.t - bossAt : null, dmg: G.dmg, kills: G.kills, w: Object.keys(G.w) };
}

const avg = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const pct = x => `${Math.round(x * 100)}%`.padStart(5);
const sec = x => (isNaN(x) ? '   –' : `${Math.round(x)}`.padStart(4));
console.log(`Bitew na etap: ${N}\n`);
for (const [name, choose] of Object.entries(choosers)) {
  console.log(`Karty wybierane ${name}:`);
  console.log('etap  wygrane  przegrane przed/z Asteroidą  życie po wygranej  najniżej  poziom  walka z Asteroidą (s)  poziom 2/5/10/15 w sekundzie');
  const share = {};
  for (let st = 1; st <= LAST; st++) {
    const res = [];
    for (let i = 0; i < N; i++) res.push(battle(st, choose));
    const wins = res.filter(r => r.win);
    const lvT = L => sec(avg(res.filter(r => r.lv[L] !== undefined).map(r => r.lv[L])));
    const lost = res.filter(r => !r.win), early = lost.filter(r => r.t < R.TIME_BOSS).length;
    console.log(`${String(st).padStart(4)}   ${pct(wins.length / N)}       ${pct(early / N)} / ${pct((lost.length - early) / N)}          ${pct(avg(wins.map(r => r.hp)))}              ${pct(avg(res.map(r => r.minHp)))}   ${avg(res.map(r => r.lvl)).toFixed(1).padStart(5)}   ${sec(avg(wins.map(r => r.bossFight)))}                   ${lvT(2)} ${lvT(5)} ${lvT(10)} ${lvT(15)}`);
    if (st === 1) for (const r of res) { const tot = Object.values(r.dmg).reduce((a, b) => a + b, 0); for (const k of r.w) (share[k] = share[k] || []).push(r.dmg[k] / tot); }
  }
  console.log('Udział broni w obrażeniach na etapie 1 (gdy była zbudowana): ' + Object.entries(share).map(([k, v]) => `${k} ${pct(avg(v)).trim()} (${v.length}×)`).join(', '));
  console.log('');
}
