// Śmierdzipacha: dobiera siłę wrogów (tabela ENEMY_P w gra.js) do zestawu ulepszeń, który ma gracz z 80% złota.
// Uruchom po każdej zmianie ulepszeń, cen albo złota:  node narzedzia/balans.js   (kilka minut)
// i wklej wypisaną na końcu tabelę do gra.js w miejsce "const ENEMY_P = …".
//
// Jak to działa: w każdym punkcie kontrolnym (level, gra) armia bez ulepszeń gra trasę przy zwykłych wrogach
// i liczy się, ilu żołnierzy zabrali jej wrogowie. Potem armia z oczekiwanymi ulepszeniami gra tę samą trasę
// przy coraz silniejszych wrogach, aż straci tyle samo. Ta siła trafia do tabeli. Każda gra ma ustalone losowanie,
// więc obie armie widzą te same trasy.
'use strict';
const fs = require('fs'), path = require('path'), { fork } = require('child_process');
const ROOT = path.join(__dirname, '..');
new Function(fs.readFileSync(path.join(ROOT, 'zadania.js'), 'utf8'))();
new Function(fs.readFileSync(path.join(ROOT, 'gra.js'), 'utf8'))();
const A = globalThis.ArmiaLiczb;
const N = +process.env.BALANS_N || 40, ITER = 8, POINTS = [4, 14, 24, 34];

function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
// soldiers taken by enemies on the road (all gates right, careful steering), average of N games
function road(c, s, kit, P) {
  A.setScale(() => P);
  const real = Math.random;
  let loss = 0;
  for (let k = 0; k < N; k++) {
    Math.random = rng(1000 * c + 37 * s + 7919 * k); A.forget();
    const g = A.createGame(c, s, false, kit, false, true);
    for (let i = 0; i < 40000 && g.state === 'run'; i++) {
      const a = g.army, gt = g.gates.find(x => !x.done);
      a.tx = gt && gt.shown && gt.z - a.z < g.cfg.speed * 2.2 ? (gt.left ? -1.9 : 1.9) : A.autoSteer(g);
      if (a.z >= g.monster.z - 11.5) break;
      A.step(g, 1 / 30);
      for (const e of g.events) if (e.type === 'leak' || e.type === 'clash') loss += e.n;
      g.events.length = 0;
    }
  }
  Math.random = real;
  A.setScale(null);
  return loss / N;
}
function point(c, s) {
  const base = road(c, s, A.KIT0, 1), kit = A.expectedKit(c, s);
  let lo = 0, hi = Math.log(400);
  for (let it = 0; it < ITER; it++) { const mid = (lo + hi) / 2; if (road(c, s, kit, Math.exp(mid)) < base) lo = mid; else hi = mid; }
  return { G: c * A.STAGES + s, P: Math.exp((lo + hi) / 2), base };
}

if (require.main !== module) module.exports = { road, A };
else if (process.argv[2] === 'worker') {
  process.on('message', ({ c, s }) => process.send(point(c, s)));
} else {
  const jobs = [];
  for (let c = 0; c < 8; c++) for (const s of POINTS) jobs.push({ c, s });
  const out = [], workers = Math.max(1, Math.min(4, require('os').cpus().length));
  let next = 0, done = 0;
  for (let w = 0; w < workers; w++) {
    const ch = fork(__filename, ['worker']);
    const give = () => { if (next < jobs.length) ch.send(jobs[next++]); else ch.kill(); };
    ch.on('message', r => {
      out.push(r); done++;
      process.stderr.write(`level ${Math.floor(r.G / 40) + 1}, gra ${r.G % 40 + 1}: siła ${r.P.toFixed(2)} (straty bez ulepszeń ${r.base.toFixed(1)})\n`);
      if (done === jobs.length) {
        out.sort((a, b) => a.G - b.G);
        // a little smoothing against chance: every point together with its neighbours (in the logarithm)
        const L = out.map(r => Math.log(r.P)), sm = L.map((v, i) => i === 0 || i === L.length - 1 ? v : 0.25 * L[i - 1] + 0.5 * v + 0.25 * L[i + 1]);
        const rows = [[0, 1], ...out.map((r, i) => [r.G, +Math.max(1, Math.exp(sm[i])).toFixed(2)])];
        console.log(`const ENEMY_P = [${rows.map(r => `[${r[0]}, ${r[1]}]`).join(', ')}];`);
      }
      give();
    });
    give();
  }
}
