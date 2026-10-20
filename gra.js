/* Śmierdzipacha: silnik gry (ruch, walka, grafika, dźwięk, ekrany).
   Zadania matematyczne dla klas 1–8 są w pliku zadania.js. */
(() => {
'use strict';
const HAS_DOM = typeof document !== 'undefined';
const Z = globalThis.Zadania;
const WERSJA = 10;         // numer wersji gry; opis zmian w ZMIANY.md

/* ============================================================
   Helpers
   ============================================================ */
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const MINUS = '−';
const group = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/* ============================================================
   Stage settings
   8 classes (klasa 1–8) × 40 stages. Later stages: more gates, less time, more enemies.
   ============================================================ */
const STAGES = 40;
const START = 10;          // soldiers at the start, before armoury upgrades
// The youngest read slowest, so they get the most time per problem
const CLASS_CFG = [
  { think: 9.0, speed: 5.0 }, { think: 9.0, speed: 5.3 }, { think: 8.5, speed: 5.6 }, { think: 8.5, speed: 5.9 },
  { think: 8.5, speed: 6.0 }, { think: 8.5, speed: 6.2 }, { think: 9.0, speed: 6.2 }, { think: 9.5, speed: 6.4 },
];
// Worlds: every topic of a level runs through another place; brighter ones for the youngest, city and space for the oldest
const LEVEL_WORLDS = [
  ['most', 'las', 'kanion', 'snieg'], ['las', 'most', 'snieg', 'kanion'], ['kanion', 'las', 'most', 'snieg'], ['snieg', 'kanion', 'las', 'wulkan'],
  ['wulkan', 'las', 'kanion', 'miasto'], ['miasto', 'snieg', 'wulkan', 'kanion'], ['miasto', 'wulkan', 'kosmos', 'snieg'], ['kosmos', 'miasto', 'wulkan', 'kanion'],
];
const worldOf = (cls, s) => LEVEL_WORLDS[cls][s === STAGES - 1 ? 0 : Math.floor(s / 5) % 4];
function stageConfig(cls, s) {
  const C = CLASS_CFG[cls], info = Z.stage(cls, s), f = s / (STAGES - 1), d = Math.floor(s / 10);
  const think = C.think * (1.1 - 0.3 * f) * (info.time || 1);
  const speed = C.speed + 0.6 * f;
  return {
    cls, s, info, think, speed, spacing: speed * (think + 1.0), start: START,
    gates: 5 + d + (s >= 35 ? 1 : 0),
    rLo: 5 + 2 * d, rHi: 15 + 3 * d,            // soldiers won or lost at one gate
    squadsPer: s >= 20 ? 2 : 1, enemyMul: 1.8 * (0.3 + 0.5 * f),   // zombies per span = enemyMul × average gate reward
    brutes: s >= 10,                            // big zombies with many lives, from game 11
    bridges: s >= 3 ? 1 : 0,                    // broken bridge to repair by shooting, from game 4
  };
}

/* ============================================================
   Weapons, power-ups and the armoury (bought with gold earned by playing; never with money, never by chance)
   ============================================================ */
// Toy-like weapons: damage of one shot and how fast the army fires
const WEAPONS = [
  { name: 'Blaster', dmg: 1, rate: 1.0 },
  { name: 'Turboblaster', dmg: 1.5, rate: 1.1 },
  { name: 'Plazma', dmg: 2, rate: 1.2 },
  { name: 'Działko', dmg: 2.5, rate: 1.3 },
  { name: 'Laser', dmg: 3, rate: 1.4 },
];
const MAX_WEAPON = WEAPONS.length - 1;
const POWERS = { giant: { name: 'Olbrzymy', dmg: 1.5, rate: 1 }, turbo: { name: 'Szybki ogień', dmg: 1, rate: 1.4 } };
// Permanent upgrades: price of every next level
const ARMORY = {
  weapon: { name: 'Broń na start', prices: [120, 300] },
  army: { name: 'Żołnierze na start', prices: [40, 80, 130, 190, 260], per: 2 },
  power: { name: 'Siła ognia', prices: [60, 110, 170, 240, 320], per: 0.1 },
};
const NO_ARM = { weapon: 0, army: 0, power: 0 };
const GOLD = { gate: 5, fight: 5, practice: 3, brute: 2, star: 10 };
const shotDmg = g => WEAPONS[g.weapon].dmg * (g.giant ? POWERS.giant.dmg : 1);
const shotRate = g => WEAPONS[g.weapon].rate * (g.turbo ? POWERS.turbo.rate : 1) * g.fireBonus;
const firePower = g => shotDmg(g) * shotRate(g);       // how hard one soldier hits the monster

/* ============================================================
   Simulation (no drawing here, so it can be tested without a browser)
   ============================================================ */
const CAP = 150;          // most soldiers shown in one group
const ROAD = 4;           // half width of the lanes
const XMAX = 3.2;         // how far the army centre can go sideways
const FORM = 0.27;        // spacing of the formation
const FIGHT_DIST = 11;    // the army stops this far in front of the monster
// The fight goes in rounds: every answer (or a run-out clock) is one round.
// The army fires (each soldier hits with the fire power of its weapon), then the monster strikes back.
// Speed does not matter, only whether the answer is right.
const ATK_FRAC = 0.075;   // the monster's blow kills this share of the expected army, never more than the smallest reward,
                          // so a right answer always brings at least as many soldiers as the blow takes
const ROUNDS = 6;         // monster life ≈ this many volleys of the expected army
const HP_K = 1.8;         // monster strength: with every gate right and fight answers at random it wins about 1 time in 3
const ARM_EASE = 0.12;    // share of the extra fire power from armoury upgrades that really weakens the monster
const OX = new Float32Array(CAP), OZ = new Float32Array(CAP);
for (let i = 0; i < CAP; i++) { const r = FORM * Math.sqrt(i + 0.35), t = i * 2.39996; OX[i] = Math.cos(t) * r; OZ[i] = Math.sin(t) * r * 0.9; }
const radius = n => FORM * Math.sqrt(clamp(n, 1, CAP)) + 0.3;
// A big army marches as a narrower column, so it is clear which gate it takes
const squeeze = n => Math.min(1, 1.9 / (FORM * Math.sqrt(clamp(n, 1, CAP))));
// Things to shoot at the side of the road; each has a number of hits it needs
const PROP_W = { cage: 0.75, crate: 0.7, bridge: 0.95 }, BRIDGE_L = 6;
const RANGE = 26;         // how far a shot flies

function makeGroup(n, scale) {
  const men = [];
  for (let i = 0; i < Math.min(n, CAP); i++) men.push({ ox: OX[i] * scale, oz: OZ[i] * scale, ph: Math.random() * 4, hp: 1, max: 1 });
  return men;
}
function freshProblem(g) {
  let p = g.gen();
  for (let tries = 0; tries < 8 && p.q === g.lastQ; tries++) p = g.gen();
  g.lastQ = p.q;
  return p;
}

function createGame(cls, s, attract, arm) {
  const cfg = stageConfig(cls, s);
  arm = arm || NO_ARM;
  const g = {
    cls, s, cfg, arm, attract: !!attract, time: 0, state: 'run', endAt: 0, gen: cfg.info.gen, lastQ: '', world: worldOf(cls, s),
    army: { x: 0, tx: 0, z: 0, n: attract ? 40 : cfg.start + ARMORY.army.per * arm.army, born: new Float32Array(CAP).fill(-10) },
    gates: [], squads: [], props: [], bullets: [], hits: [], monster: null, fight: null, finishZ: 1e9,
    fire: 0, correct: 0, answered: 0, mistakes: [], events: [], gold: 0,
    weapon: arm.weapon, fireBonus: 1 + ARMORY.power.per * arm.power, giant: false, turbo: false,
  };
  if (attract) return g;
  let z = 6;
  for (let k = 0; k < cfg.gates; k++) {
    z += cfg.spacing;
    g.gates.push({ z, p: freshProblem(g), r: randi(cfg.rLo, cfg.rHi), left: Math.random() < 0.5, done: false, choseLeft: false, ok: false, t: 0 });
  }
  const tail = Math.max(42, cfg.speed * 6.5);
  const spans = [];
  for (let k = 1; k < cfg.gates; k++) spans.push([g.gates[k - 1].z, g.gates[k].z]);
  spans.push([z, z + tail - FIGHT_DIST]);
  const avgR = (cfg.rLo + cfg.rHi) / 2;
  for (const [z0, z1] of spans) {
    for (let j = 0; j < cfg.squadsPer; j++) {
      const at = cfg.squadsPer === 1 ? rand(0.5, 0.62) : (j === 0 ? rand(0.34, 0.42) : rand(0.64, 0.72));
      const n = Math.max(3, Math.round(avgR * cfg.enemyMul / cfg.squadsPer) + randi(0, 2));
      const sq = { x: rand(-2.4, 2.4), z: z0 + (z1 - z0) * at, men: makeGroup(n, 1.0), active: false };
      if (cfg.brutes && Math.random() < 0.7) {           // a big zombie walks in front of the horde
        const hp = Math.round(avgR * 0.35) + randi(2, 4);
        sq.men.unshift({ ox: 0, oz: -0.9, ph: Math.random() * 4, hp, max: hp, big: true });
      }
      g.squads.push(sq);
    }
  }
  // One thing to shoot between every two gates: cages with prisoners, weapon crates and a broken bridge
  const kinds = ['cage', 'crate'];
  if (cfg.bridges) kinds.push('bridge');
  while (kinds.length < spans.length - 1) kinds.push(kinds.length % 2 ? 'crate' : 'cage');
  for (let i = 0; i < spans.length - 1; i++) {
    const [z0, z1] = spans[i], kind = kinds[i], side = Math.random() < 0.5 ? -1 : 1;
    const hp = Math.round(avgR * { cage: 0.6, crate: 0.75, bridge: 1.1 }[kind]) + randi(1, 3);
    const prop = { kind, x: side * (kind === 'bridge' ? 3.0 : 2.6), z: z0 + (z1 - z0) * (kind === 'bridge' ? 0.12 : 0.2), hp, max: hp, hit: -1, done: false, doneAt: 0 };
    if (kind === 'cage') prop.reward = randi(cfg.rLo, cfg.rHi);
    if (kind === 'bridge') prop.power = Math.random() < 0.5 ? 'giant' : 'turbo';
    g.props.push(prop);
  }
  g.monster = { x: 0, z: z + tail, hp: 1, max: 1, kind: cls, atkK: 2, anim: -9, hit: -9, dead: false, deadAt: 0 };
  g.finishZ = g.monster.z + 6;
  // Monster strength follows what a player would bring with every gate right (a few quick test runs of this very stage).
  // Armoury upgrades make it easier, but only by the square root of the extra power, so the fight still needs right answers.
  const test = a => { let n = 0, np = 0; for (let i = 0; i < 3; i++) { const r = perfectRun(g, a); n += r.n / 3; np += r.n * r.power / 3; } return [Math.max(12, n), Math.max(12, np)]; };
  const [N0, NP0] = test(NO_ARM);
  const NP1 = arm.weapon || arm.army || arm.power ? Math.max(NP0, test(arm)[1]) : NP0;
  const atkK = clamp(Math.round(N0 * ATK_FRAC), 2, cfg.rLo);
  const hp = Math.max(60, Math.round(HP_K * ROUNDS * NP0 * Math.pow(NP1 / NP0, 1 - ARM_EASE) / 10) * 10);
  Object.assign(g.monster, { hp, max: hp, atkK });
  return g;
}

// Plays the running part of a copy of the stage with every gate right and the given armoury, steering to the things
// at the side of the road between gates; returns the army and its fire power at the monster
function perfectRun(g, arm) {
  const sim = {
    ...g, time: 0, state: 'run', events: [], bullets: [], hits: [], fight: null, fire: 0, correct: 0, answered: 0, mistakes: [], gold: 0,
    weapon: arm.weapon, fireBonus: 1 + ARMORY.power.per * arm.power, giant: false, turbo: false,
    army: { x: 0, tx: 0, z: 0, n: g.cfg.start + ARMORY.army.per * arm.army, born: new Float32Array(CAP) },
    gates: g.gates.map(x => ({ ...x })), props: g.props.map(b => ({ ...b })), monster: { ...g.monster },
    squads: g.squads.map(q => ({ ...q, men: q.men.map(m => ({ ...m })) })),
  };
  for (let i = 0; i < 6000 && sim.state === 'run'; i++) {
    const a = sim.army, gt = sim.gates.find(x => !x.done);
    let tx = 0;
    if (gt && gt.z - a.z < sim.cfg.speed * 2.2) tx = gt.left ? -1.9 : 1.9;
    else {
      const p = sim.props.find(q => !q.done && q.z + (q.kind === 'bridge' ? BRIDGE_L : 0) > a.z - 1 && q.z - a.z < 30);
      if (p) tx = p.z - a.z > 3.5 ? p.x * 0.85 : -Math.sign(p.x) * 1.6;
    }
    a.tx = tx;
    step(sim, 1 / 20); sim.events.length = 0;
  }
  return { n: sim.army.n, power: firePower(sim) };
}

function grow(g, k) {
  const a = g.army;
  for (let i = a.n; i < Math.min(a.n + k, CAP); i++) a.born[i] = g.time;
  a.n += k;
}
function propDone(g, p) {
  p.done = true; p.doneAt = g.time;
  if (p.kind === 'cage') { grow(g, p.reward); g.events.push({ type: 'cage', x: p.x, z: p.z, n: p.reward }); }
  else if (p.kind === 'crate') {
    if (g.weapon < MAX_WEAPON) { g.weapon++; g.events.push({ type: 'weapon', x: p.x, z: p.z, name: WEAPONS[g.weapon].name }); }
    else { grow(g, 10); g.events.push({ type: 'cage', x: p.x, z: p.z, n: 10 }); }
  } else {
    g[p.power] = true;
    g.events.push({ type: 'power', x: p.x, z: p.z + BRIDGE_L, name: POWERS[p.power].name, power: p.power });
  }
}

function bulletHit(g, b, zPrev) {
  const lo = zPrev - 0.25, hi = b.z + 0.25, dmg = shotDmg(g);
  for (const s of g.squads) {
    if (s.z < lo - 3 || s.z > hi + 3) continue;
    for (let j = 0; j < s.men.length; j++) {
      const m = s.men[j], mx = s.x + m.ox, mz = s.z + m.oz;
      if (mz >= lo && mz <= hi && Math.abs(mx - b.x) < (m.big ? 0.7 : 0.36)) {
        m.hp -= dmg; m.hit = g.time;
        if (m.hp <= 0) {
          s.men.splice(j, 1);
          if (m.big) g.gold += GOLD.brute;
          g.events.push({ type: 'kill', x: mx, z: mz, big: !!m.big });
        }
        return true;
      }
    }
  }
  for (const p of g.props) {
    const len = p.kind === 'bridge' ? BRIDGE_L : 0.4;
    if (!p.done && p.hp > 0 && p.z <= hi && p.z + len >= lo && Math.abs(p.x - b.x) < PROP_W[p.kind]) {
      p.hp = Math.max(0, p.hp - dmg); p.hit = g.time;
      if (p.hp <= 0 && g.state === 'run') propDone(g, p);
      return true;
    }
  }
  const M = g.monster;
  if (M && !M.dead && hi >= M.z - 1.4) { M.hit = g.time; g.events.push({ type: 'spark', x: b.x, z: M.z - 1.4 }); return true; }
  return false;
}

function startFight(g) {
  g.state = 'fight';
  g.army.tx = 0;
  g.fight = { p: null, r: 0, left: true, done: true, next: g.time + 1.6, deadline: 0, shownAt: 0, count: 0, volleyUntil: 0 };
  g.events.push({ type: 'fight' });
}
function nextFightProblem(g) {
  const f = g.fight;
  f.p = freshProblem(g); f.r = randi(g.cfg.rLo, g.cfg.rHi); f.left = Math.random() < 0.5;
  f.done = false; f.shownAt = g.time; f.deadline = g.time + g.cfg.think; f.count++;
  g.events.push({ type: 'fightProblem' });
}
// left: true / false = the button picked; null = time ran out
function answerFight(g, left) {
  const f = g.fight;
  if (!f || !f.p || f.done || g.state !== 'fight') return;
  f.done = true; f.next = g.time + 1.9; f.volleyUntil = g.time + 0.6; g.answered++;
  const ok = left === f.left, t = g.time, M = g.monster;
  if (ok) { g.correct++; g.gold += GOLD.fight; grow(g, f.r); }
  else g.mistakes.push({ q: f.p.q, a: f.p.a, w: left === null ? null : f.p.w, sol: f.p.sol, ask: f.p.ask });
  // The round: army volley, then the monster's blow (and a fireball after a wrong answer)
  g.hits.push({ at: t + 0.6, kind: 'volley' }, { at: t + 0.65, kind: 'growl', fire: !ok }, { at: t + 1.2, kind: 'stomp', n: M.atkK });
  if (!ok) g.hits.push({ at: t + 1.2, kind: 'blast', n: f.r });
  g.events.push({ type: 'fightAnswer', ok, timeout: left === null, p: f.p, r: f.r });
}

function step(g, dt) {
  g.time += dt;
  const a = g.army, ev = g.events, M = g.monster;
  if (g.attract) a.tx = Math.sin(g.time * 0.55) * 2.2;
  a.x += (clamp(a.tx, -XMAX, XMAX) - a.x) * Math.min(1, dt * 14);
  let sp = g.cfg.speed;
  if (g.state === 'fight' || g.state === 'lost') sp = 0;
  if (g.state === 'won') sp = a.z < g.finishZ + 6 ? g.cfg.speed * 0.7 : 0;
  a.z += sp * dt;
  if (g.state === 'run' && M && a.z >= M.z - FIGHT_DIST) { a.z = M.z - FIGHT_DIST; startFight(g); }

  // Gates
  if (g.state === 'run') {
    for (const gt of g.gates) {
      if (gt.done || a.z < gt.z) continue;
      gt.done = true; gt.t = g.time; gt.choseLeft = a.x < 0; gt.ok = gt.choseLeft === gt.left;
      g.answered++;
      if (gt.ok) { g.correct++; g.gold += GOLD.gate; grow(g, gt.r); ev.push({ type: 'gate', ok: true, gate: gt, n: gt.r }); }
      else {
        const loss = Math.min(gt.r, a.n - 1);     // a gate never takes the last soldier
        a.n -= loss;
        g.mistakes.push({ q: gt.p.q, a: gt.p.a, w: gt.p.w, sol: gt.p.sol, ask: gt.p.ask });
        ev.push({ type: 'gate', ok: false, gate: gt, n: loss });
      }
    }
  }

  // Shooting (in the fight only during the volley after an answer)
  const volley = g.state === 'fight' && g.time < g.fight.volleyUntil;
  if (a.n > 0 && (g.state === 'run' || volley)) {
    g.fire += (volley ? Math.min(40, 8 + a.n / 3) : (3 + 1.1 * Math.sqrt(a.n)) * shotRate(g)) * dt;
    const sq = squeeze(a.n);
    while (g.fire >= 1) {
      g.fire -= 1;
      const i = Math.floor(Math.random() * Math.min(a.n, CAP));
      g.bullets.push({ x: clamp(a.x + OX[i] * sq, -ROAD + 0.2, ROAD - 0.2), z: a.z + OZ[i] + 0.3, d: 0 });
    }
  }
  const bv = (30 + sp) * dt;
  for (let i = g.bullets.length - 1; i >= 0; i--) {
    const b = g.bullets[i], zp = b.z;
    b.z += bv; b.d += bv;
    if (b.d > RANGE || bulletHit(g, b, zp)) { g.bullets[i] = g.bullets[g.bullets.length - 1]; g.bullets.pop(); }
  }

  // Zombies and the things at the side of the road
  const R = radius(a.n), RX = (R - 0.3) * squeeze(a.n) + 0.5, RZ = R + 0.2;
  const inside = (dx, dz) => (dx / RX) ** 2 + (dz / RZ) ** 2 < 1;
  const running = g.state === 'run';
  for (let si = g.squads.length - 1; si >= 0; si--) {
    const s = g.squads[si];
    if (!s.active && s.z - a.z < 32) { s.active = true; ev.push({ type: 'horde' }); }
    if (s.active && running) { s.z -= 2.0 * dt; s.x = clamp(s.x + clamp(a.x - s.x, -1, 1) * 0.9 * dt, -3.4, 3.4); }
    if (running) {
      for (let j = s.men.length - 1; j >= 0; j--) {
        const m = s.men[j], dx = s.x + m.ox - a.x, dz = s.z + m.oz - a.z;
        if (inside(dx, dz) && a.n > 0) {
          // a big zombie takes several soldiers; on the road the last soldier always survives, so the monster is always reached
          const k = Math.min(a.n - 1, m.big ? Math.min(6, Math.ceil(m.hp)) : 1);
          s.men.splice(j, 1); a.n -= k; ev.push({ type: 'clash', x: a.x + dx, z: a.z + dz, big: !!m.big, n: k });
        }
      }
    }
    if (!s.men.length || s.z < a.z - 14) g.squads.splice(si, 1);
  }
  for (const p of g.props) {
    if (p.done || !running) continue;
    const len = p.kind === 'bridge' ? BRIDGE_L : 0;
    if (a.z > p.z - R * 0.8 - 0.4 && a.z < p.z + len + 0.4 && Math.abs(p.x - a.x) < RX + PROP_W[p.kind] - 0.4) {
      const loss = Math.min(p.kind === 'bridge' ? 6 : 5, a.n - 1);   // ran into it (or into the hole) before it was shot open
      p.done = true; p.doneAt = g.time; p.lost = true; a.n -= loss;
      ev.push({ type: 'smash', x: p.x, z: p.z, n: loss, kind: p.kind });
    }
  }

  // Monster fight
  if (g.state === 'fight') {
    const f = g.fight;
    if (f.p && !f.done && g.time >= f.deadline) answerFight(g, null);
    if (f.done && g.time >= f.next && M.hp > 0) nextFightProblem(g);
  }
  while (g.hits.length && g.hits[0].at <= g.time) {
    const h = g.hits.shift();
    if (g.state !== 'fight') continue;
    if (h.kind === 'volley') {
      const dmg = Math.min(M.hp, Math.round(a.n * firePower(g)));
      M.hp -= dmg; M.hit = g.time;
      ev.push({ type: 'volley', n: dmg });
      if (M.hp <= 0) { g.hits.length = 0; break; }     // a beaten monster does not strike back
    } else if (h.kind === 'growl') { M.anim = g.time; ev.push({ type: 'growl', fire: h.fire }); }
    else { const k = Math.min(h.n, a.n); a.n -= k; ev.push({ type: h.kind, n: k }); }
  }

  // End of the stage
  if (g.state === 'fight' && M.hp <= 0) {
    M.dead = true; M.deadAt = g.time;
    if (a.n < 1) a.n = 1;
    g.state = 'won'; g.endAt = g.time + 2.6; ev.push({ type: 'won' });
  } else if ((g.state === 'run' || g.state === 'fight') && a.n <= 0) {
    a.n = 0; g.state = 'lost'; g.endAt = g.time + 3.0; ev.push({ type: 'lost' });
  }
}

if (!HAS_DOM) { globalThis.ArmiaLiczb = { STAGES, stageConfig, createGame, step, answerFight, WEAPONS, ARMORY, GOLD, firePower }; return; }

/* ============================================================
   Saved progress (stays on this phone only)
   ============================================================ */
const KEY = 'armia-liczb-v2';
const NCLS = Z.KLASY.length;
const save = { stars: new Array(NCLS * STAGES).fill(0), next: [0, 0], music: true, sfx: true, learn: true, tab: 0, gold: 0, arm: { ...NO_ARM }, skin: 0, skins: [0], musicStyle: 'auto' };
try { Object.assign(save, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* storage blocked */ }
if (!Array.isArray(save.stars) || save.stars.length !== NCLS * STAGES) save.stars = new Array(NCLS * STAGES).fill(0);
if (!Array.isArray(save.next) || save.next.length !== 2) save.next = [0, 0];
save.gold = Math.max(0, Math.floor(+save.gold || 0));
save.arm = Object.fromEntries(Object.keys(NO_ARM).map(k => [k, clamp(Math.floor(+(save.arm || {})[k] || 0), 0, ARMORY[k].prices.length)]));
if (!Array.isArray(save.skins)) save.skins = [0];
if (!save.skins.includes(save.skin)) save.skin = 0;
const MUSIC_STYLES = { auto: 'Auto', wesola: 'Wesoła', przygoda: 'Przygoda', chill: 'Chill', elektro: 'Elektro', retro: 'Retro', off: 'wył.' };
if (!(save.musicStyle in MUSIC_STYLES)) save.musicStyle = 'auto';
if (save.music === false) save.musicStyle = 'off';
save.music = save.musicStyle !== 'off';
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* storage blocked */ } };
const starsOf = (c, s) => save.stars[c * STAGES + s];
const unlocked = (c, s) => s === 0 || starsOf(c, s - 1) > 0 || starsOf(c, s) > 0;

/* ============================================================
   Sound: music and effects are generated, no sound files
   ============================================================ */
const Snd = (() => {
  let ctx = null, master, musicBus, sfxBus, noise, unlocked = false, silent = null;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = save.music ? 0.32 : 0; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  // A short silent WAV: playing it through an <audio> element lets iPhone sound play even with the ring switch set to silent
  function silentWav() {
    const n = 4000, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
    str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); str(36, 'data'); v.setUint32(40, n, true);
    b.fill(128, 44);
    let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return 'data:audio/wav;base64,' + btoa(s);
  }
  function unlock() {
    if (!save.music && !save.sfx) return;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* not supported */ }
    if (!init()) return;
    if (ctx.state !== 'running') ctx.resume().then(() => { if (want && !cur && want.style && want.style !== 'retro') play(want.name, want.style, true); }).catch(() => {});
    if (unlocked) return;
    unlocked = true;
    try { const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050); b.connect(ctx.destination); b.start(0); } catch (e) { /* ignore */ }
    if (!navigator.audioSession) {
      try { silent = new Audio(silentWav()); silent.loop = true; silent.setAttribute('playsinline', ''); const p = silent.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
    }
  }
  const live = () => ctx && ctx.state === 'running';

  function env(gn, t, peak, dur) {
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    gn.gain.setValueAtTime(peak, t + Math.max(0.008, dur * 0.55));
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(type, f, t, dur, vol, dest, f2, lp) {
    const o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    let node = o;
    if (lp) { const q = ctx.createBiquadFilter(); q.type = 'lowpass'; q.frequency.value = lp; o.connect(q); node = q; }
    node.connect(gn); gn.connect(dest); env(gn, t, vol, dur);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function hiss(t, dur, vol, dest, type, freq, q) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gn = ctx.createGain();
    s.buffer = noise; f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    s.connect(f); f.connect(gn); gn.connect(dest);
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function kick(t, v) {
    const o = ctx.createOscillator(), gn = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    o.connect(gn); gn.connect(musicBus); o.start(t); o.stop(t + 0.26);
  }

  /* ---------- music ---------- */
  // Each bar: chord root (MIDI), chord type and melody notes [step, note, length in 16ths]
  const MAJ = [0, 4, 7], MIN = [0, 3, 7];
  const RUN_A = [
    [48, MAJ, [[0, 76, 2], [2, 79, 2], [4, 84, 2], [6, 79, 2], [8, 76, 2], [10, 79, 2], [12, 81, 2], [14, 79, 2]]],
    [45, MIN, [[0, 76, 2], [2, 81, 2], [4, 84, 2], [6, 81, 2], [8, 76, 2], [10, 81, 2], [12, 83, 2], [14, 81, 2]]],
    [41, MAJ, [[0, 77, 2], [2, 81, 2], [4, 84, 2], [6, 81, 2], [8, 77, 2], [10, 81, 2], [12, 84, 2], [14, 86, 2]]],
    [43, MAJ, [[0, 86, 3], [3, 83, 1], [4, 79, 2], [6, 83, 2], [8, 86, 4], [12, 84, 2], [14, 83, 2]]],
  ];
  const RUN_B = [
    [48, MAJ, [[0, 84, 4], [4, 79, 2], [6, 81, 2], [8, 84, 6], [14, 86, 2]]],
    [45, MIN, [[0, 88, 4], [4, 86, 2], [6, 84, 2], [8, 81, 6], [14, 79, 2]]],
    [41, MAJ, [[0, 81, 4], [4, 84, 2], [6, 81, 2], [8, 77, 4], [12, 79, 2], [14, 81, 2]]],
    [43, MAJ, [[0, 79, 4], [4, 83, 2], [6, 86, 2], [8, 91, 4], [12, 86, 4]]],
  ];
  const FIGHT_A = [
    [45, MIN, [[0, 81, 2], [2, 84, 2], [4, 88, 2], [6, 84, 2], [8, 81, 2], [10, 84, 2], [12, 88, 2], [14, 89, 2]]],
    [41, MAJ, [[0, 89, 2], [2, 84, 2], [4, 81, 2], [6, 84, 2], [8, 89, 4], [12, 88, 2], [14, 86, 2]]],
    [43, MAJ, [[0, 86, 2], [2, 83, 2], [4, 79, 2], [6, 83, 2], [8, 86, 4], [12, 88, 2], [14, 86, 2]]],
    [40, MAJ, [[0, 88, 4], [4, 92, 2], [6, 88, 2], [8, 83, 4], [12, 80, 2], [14, 83, 2]]],
  ];
  const FIGHT_B = [
    [45, MIN, [[0, 93, 4], [4, 91, 2], [6, 89, 2], [8, 88, 4], [12, 84, 4]]],
    [41, MAJ, [[0, 89, 4], [4, 88, 2], [6, 86, 2], [8, 84, 4], [12, 81, 4]]],
    [43, MAJ, [[0, 83, 2], [2, 86, 2], [4, 91, 4], [8, 89, 2], [10, 88, 2], [12, 86, 4]]],
    [40, MAJ, [[0, 88, 2], [2, 80, 2], [4, 83, 2], [6, 88, 2], [8, 92, 6], [14, 88, 2]]],
  ];
  const TRACKS = {
    menu: { bpm: 108, bars: [...RUN_B, ...RUN_A], drums: 'soft', lead: 0.06 },
    run: { bpm: 128, bars: [...RUN_A, ...RUN_B], drums: 'run', lead: 0.075 },
    fight: { bpm: 152, bars: [...FIGHT_A, ...FIGHT_B], drums: 'fight', lead: 0.075 },
  };
  for (const k in TRACKS) for (const bar of TRACKS[k].bars) { const by = []; for (const n of bar[2]) by[n[0]] = n; bar.push(by); }
  let track = null, stepN = 0, nextT = 0, timer = null;
  function playStep(T, st, t, sd) {
    const bar = T.bars[Math.floor(st / 16) % T.bars.length], s = st % 16, root = bar[0];
    const bassNote = root + (T.drums === 'fight' ? (s % 4 === 2 ? 12 : 0) : (s % 4 === 2 ? 12 : s % 8 === 6 ? 7 : 0));
    if (s % 2 === 0) tone('square', mtof(bassNote), t, sd * 1.7, 0.11, musicBus, 0, 700);
    if (T.drums === 'run') {
      if (s === 0 || s === 8 || (s === 10 && (st >> 4) % 2)) kick(t, 0.8);
      if (s === 4 || s === 12) { hiss(t, 0.15, 0.22, musicBus, 'bandpass', 1900, 0.8); tone('triangle', 190, t, 0.07, 0.16, musicBus, 120); }
      if (s % 2 === 0) hiss(t, 0.03, s % 4 === 2 ? 0.1 : 0.05, musicBus, 'highpass', 7500);
    } else if (T.drums === 'fight') {
      if (s % 4 === 0) kick(t, 0.9);
      if (s === 4 || s === 12) { hiss(t, 0.16, 0.26, musicBus, 'bandpass', 1800, 0.8); tone('triangle', 180, t, 0.07, 0.18, musicBus, 110); }
      hiss(t, 0.025, s % 2 ? 0.05 : 0.09, musicBus, 'highpass', 8000);
    } else if (s % 4 === 2) hiss(t, 0.03, 0.04, musicBus, 'highpass', 8000);
    if (s % 4 === 2) for (const iv of bar[1]) tone('triangle', mtof(root + 24 + iv), t, sd * 1.2, 0.028, musicBus);
    const n = bar[3][s];
    if (n) tone('square', mtof(n[1]), t, sd * n[2] * 0.92, T.lead, musicBus, 0, 2600);
  }
  function tick() {
    if (!live() || !track) return;
    const T = TRACKS[track], sd = 60 / T.bpm / 4;
    if (nextT < ctx.currentTime - 0.05) nextT = ctx.currentTime + 0.03;   // came back from a pause
    while (nextT < ctx.currentTime + 0.15) { playStep(T, stepN, nextT, sd); nextT += sd; stepN++; }
  }
  function playSeq(name) {
    if (track === name && timer) return;
    track = name; stepN = 0;
    if (!init()) return;
    nextT = ctx.currentTime + 0.05;
    if (!timer) timer = setInterval(tick, 25);
  }

  /* ---------- recorded music: loops in muzyka/, made by narzedzia/muzyka.py with real instrument sounds ---------- */
  // where the loop starts and ends in every file (printed by narzedzia/muzyka.py)
  const MUSIC_LOOPS = { 'wesola-bieg': [0.5, 33.603424], 'wesola-walka': [0.5, 29.590884], 'przygoda-bieg': [0.5, 36.055578], 'przygoda-walka': [0.5, 27.928549],
    'chill-bieg': [0.5, 46.214308], 'chill-walka': [0.5, 41.351066], 'elektro-bieg': [0.5, 33.042404], 'elektro-walka': [0.5, 29.156712] };
  const buffers = {}, loading = {}, failed = {};
  let cur = null, want = null;
  function loadLoop(file) {
    if (buffers[file]) return Promise.resolve(buffers[file]);
    if (Date.now() - (failed[file] || -1e9) < 60000) return Promise.resolve(null);   // do not ask again at once after a failure
    if (!loading[file]) {
      loading[file] = fetch(`muzyka/${file}.mp3`).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(b => new Promise((res, rej) => ctx.decodeAudioData(b, res, rej)))
        .then(buf => (buffers[file] = buf)).catch(() => { failed[file] = Date.now(); return null; })
        .finally(() => { delete loading[file]; });
    }
    return loading[file];
  }
  function startLoop(file) {
    const [a, b] = MUSIC_LOOPS[file], t = ctx.currentTime;
    const src = ctx.createBufferSource(), gn = ctx.createGain();
    src.buffer = buffers[file]; src.loop = true; src.loopStart = a; src.loopEnd = b;
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(1, t + 0.5);
    src.connect(gn); gn.connect(musicBus); src.start(t + 0.02, a);
    cur = { file, src, gn };
  }
  function stopLoop() {
    if (!cur) return;
    const { src, gn } = cur, t = ctx.currentTime;
    gn.gain.cancelScheduledValues(t); gn.gain.setValueAtTime(Math.max(0.0001, gn.gain.value), t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    src.stop(t + 0.65); cur = null;
  }
  // name: menu, run or fight; style: wesola, przygoda, chill, elektro, retro (the old tunes made in code) or null (off)
  function play(name, style, retry) {
    want = { name, style };
    if (!style) { track = null; stopLoop(); return; }
    if (style === 'retro') { stopLoop(); playSeq(name); return; }
    track = null;
    const file = `${style}-${name === 'fight' ? 'walka' : 'bieg'}`;
    if (cur && cur.file === file && !retry) return;
    stopLoop();
    if (!init()) return;
    for (const k in buffers) if (!k.startsWith(style + '-')) delete buffers[k];   // keep only one style in memory
    loadLoop(file).then(buf => {
      if (!want || want.name !== name || want.style !== style || (cur && cur.file === file)) return;
      if (!buf) { playSeq(name); return; }            // no file (for example offline): the tunes made in code
      if (live()) startLoop(file);
    });
    loadLoop(`${style}-${name === 'fight' ? 'bieg' : 'walka'}`);
  }
  function stop() { track = null; want = null; stopLoop(); }
  function setMusic(on) { if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.32 : 0, ctx.currentTime, 0.05); }
  function duck(on) { if (musicBus && save.music) musicBus.gain.setTargetAtTime(on ? 0.1 : 0.32, ctx.currentTime, 0.1); }

  /* ---------- effects ---------- */
  const last = {};
  const fx = (name, gap, fn) => () => {
    if (!save.sfx || !live()) return;
    const t = ctx.currentTime;
    if (gap && last[name] && t - last[name] < gap) return;
    last[name] = t; fn(t);
  };
  return {
    unlock, play, stop, setMusic, duck,
    suspend() { if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {}); },
    resume() { if (ctx && ctx.state !== 'running' && (save.music || save.sfx)) ctx.resume().catch(() => {}); },
    good: fx('good', 0, t => { [84, 88, 91, 96].forEach((m, i) => tone('square', mtof(m), t + i * 0.06, 0.12, 0.12, sfxBus, 0, 4200)); tone('triangle', mtof(96), t + 0.24, 0.32, 0.12, sfxBus); }),
    bad: fx('bad', 0, t => { tone('sawtooth', 330, t, 0.38, 0.15, sfxBus, 105, 1400); hiss(t, 0.25, 0.1, sfxBus, 'lowpass', 900); }),
    pop: fx('pop', 0.05, t => tone('square', rand(480, 760), t, 0.05, 0.035, sfxBus, 190, 3000)),
    shot: fx('shot', 0.085, t => hiss(t, 0.035, 0.035, sfxBus, 'bandpass', 2600, 1.4)),
    coin: fx('coin', 0, t => { tone('square', 988, t, 0.08, 0.08, sfxBus); tone('square', 1319, t + 0.08, 0.26, 0.08, sfxBus); }),
    tap: fx('tap', 0.03, t => tone('triangle', 560, t, 0.05, 0.08, sfxBus)),
    reinforce: fx('reinforce', 0, t => { [72, 76, 79, 84, 88].forEach((m, i) => tone('square', mtof(m), t + i * 0.065, 0.14, 0.09, sfxBus, 0, 3600)); }),
    stomp: fx('stomp', 0.2, t => { tone('sine', 120, t, 0.4, 0.55, sfxBus, 32); hiss(t, 0.32, 0.3, sfxBus, 'lowpass', 420); }),
    hit: fx('hit', 0.1, t => { hiss(t, 0.28, 0.32, sfxBus, 'lowpass', 2400); tone('square', 230, t, 0.14, 0.08, sfxBus, 100, 1600); }),
    boom: fx('boom', 0.2, t => { hiss(t, 0.65, 0.42, sfxBus, 'lowpass', 1300); tone('sine', 95, t, 0.45, 0.42, sfxBus, 30); }),
    growl: fx('growl', 0.5, t => { tone('sawtooth', 95, t, 0.45, 0.09, sfxBus, 70, 600); hiss(t, 0.4, 0.07, sfxBus, 'bandpass', 380, 1.2); }),
    roar: fx('roar', 0, t => {
      const o = tone('sawtooth', 150, t, 1.1, 0.2, sfxBus, 62, 900);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 18; lg.gain.value = 12;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 1.15);
      hiss(t, 1.0, 0.22, sfxBus, 'bandpass', 520, 0.7);
    }),
    win: fx('win', 0, t => { [72, 76, 79, 84, 79, 84, 88].forEach((m, i) => tone('square', mtof(m), t + i * 0.12, i === 6 ? 0.6 : 0.14, 0.12, sfxBus, 0, 3800)); }),
    // A zombie horde comes into view: low, wobbly moan
    groan: fx('groan', 1.5, t => {
      const o = tone('sawtooth', rand(85, 110), t, 0.9, 0.07, sfxBus, 62, 520);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 6; lg.gain.value = 9;
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 0.95);
      hiss(t, 0.7, 0.04, sfxBus, 'bandpass', 300, 1.5);
    }),
    thud: fx('thud', 0.12, t => { tone('sine', 160, t, 0.25, 0.4, sfxBus, 45); hiss(t, 0.2, 0.18, sfxBus, 'lowpass', 700); }),
    // Cage broken open: clank and a short cheer
    freed: fx('freed', 0, t => {
      hiss(t, 0.2, 0.25, sfxBus, 'bandpass', 3200, 2); tone('square', 880, t, 0.06, 0.06, sfxBus, 0, 3000);
      [72, 76, 79].forEach((m, i) => tone('triangle', mtof(m), t + 0.08 + i * 0.07, 0.2, 0.12, sfxBus));
    }),
    // New weapon or power: rising sweep and a bright chord
    power: fx('power', 0, t => {
      tone('sawtooth', 220, t, 0.45, 0.08, sfxBus, 1760, 3000);
      [84, 88, 91, 96].forEach(m => tone('square', mtof(m), t + 0.4, 0.45, 0.05, sfxBus, 0, 4000));
    }),
    splash: fx('splash', 0.3, t => { hiss(t, 0.6, 0.35, sfxBus, 'lowpass', 1600); hiss(t + 0.05, 0.4, 0.12, sfxBus, 'highpass', 4000); }),
    // Booing crowd, "uuuuu": several low voices through the formants of the vowel "u", sliding down
    boo: fx('boo', 1, t => {
      const dur = 2.1, out = ctx.createGain(), mix = ctx.createGain();
      out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(1, t + 0.3);
      out.gain.setValueAtTime(1, t + 1.3); out.gain.linearRampToValueAtTime(0, t + dur);
      out.connect(sfxBus);
      for (const [f, q, v] of [[330, 3, 1.6], [820, 5, 0.5]]) {
        const bp = ctx.createBiquadFilter(), g = ctx.createGain();
        bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; g.gain.value = v;
        mix.connect(bp); bp.connect(g); g.connect(out);
      }
      for (let i = 0; i < 7; i++) {
        const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        const f = rand(120, 215), t0 = t + rand(0, 0.15);
        o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.06, t0); o.frequency.exponentialRampToValueAtTime(f * 0.8, t + dur);
        lfo.frequency.value = rand(4.5, 6.5); lg.gain.value = f * 0.02;
        lfo.connect(lg); lg.connect(o.frequency);
        g.gain.value = 0.11; o.connect(g); g.connect(mix);
        o.start(t0); lfo.start(t0); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
      }
      hiss(t, dur, 0.06, out, 'bandpass', 420, 1.5);
    }),
  };
})();

/* ============================================================
   Text with fractions: "[3/4]" is shown as a stacked fraction
   ============================================================ */
const FR_RE = /\[([^\/\]]+)\/([^\]]+)\]/g;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const richHTML = s => esc(s).replace(FR_RE, '<span class="fr"><span>$1</span><span>$2</span></span>');
const plain = s => String(s).replace(/(\d)\[/g, '$1 [').replace(FR_RE, '$1/$2');
const richCache = new Map();
function parseRich(s) {
  let segs = richCache.get(s);
  if (segs) return segs;
  segs = []; let lastI = 0;
  String(s).replace(FR_RE, (m, n, d, i) => { if (i > lastI) segs.push({ t: s.slice(lastI, i) }); segs.push({ n, d }); lastI = i + m.length; return m; });
  if (lastI < s.length) segs.push({ t: s.slice(lastI) });
  if (richCache.size > 400) richCache.clear();
  richCache.set(s, segs);
  return segs;
}

/* ============================================================
   Drawing
   ============================================================ */
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const FD = '"Lilita One", "Paytone One", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
const REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const PITCH = 36 * Math.PI / 180, SINP = Math.sin(PITCH), COSP = Math.cos(PITCH), TANP = Math.tan(PITCH);
const CAM_H = 10, CAM_BACK = 8;
const ARMY_D = CAM_H * SINP + CAM_BACK * COSP;     // depth of the army from the camera
const ARMY_K = -(-CAM_H * COSP + CAM_BACK * SINP) / ARMY_D;   // army sits this many F below the view centre
const MON_H = 7.6;                                 // monster height used to frame the fight
const MON_K = (() => { const ry = MON_H + 1.2 - CAM_H, rz = CAM_BACK + FIGHT_DIST; return (ry * COSP + rz * SINP) / (-ry * SINP + rz * COSP); })();
const view = { w: 1, h: 1, dpr: 1, F0: 400, F: 400, cx: 0, cy: 0, camX: 0, camZ: 0, sx: 0, sy: 0, hudBottom: 0, k: 0, fightY: 0, topY: 0 };
const P0 = {}, P1 = {}, P2 = {}, P3 = {}, P4 = {};

function layout() {
  const w = window.innerWidth, h = window.innerHeight;
  view.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * view.dpr); canvas.height = Math.round(h * view.dpr);
  view.w = w; view.h = h; view.cx = w / 2;
  const horizon = Math.max(h * 0.16, view.hudBottom + 6);
  const Fw = Math.min(w, h * 0.62) * ARMY_D / 9.6;
  const Fh = (h * 0.8 - horizon) / (ARMY_K + TANP);
  view.F0 = Math.max(120, Math.min(Fw, Fh));
  if (!view.fightY) view.fightY = h * 0.62;
  if (!view.topY) view.topY = h * 0.17;
}
// Moves the camera between running (army low on screen) and fighting (army above the answer buttons)
function updateCamera(fighting, dt) {
  view.k += ((fighting ? 1 : 0) - view.k) * Math.min(1, dt * 2.5);
  const yRun = view.h * 0.8, yFight = view.fightY;
  const Ff = Math.max(100, Math.min(view.F0, (yFight - view.topY) / (ARMY_K + MON_K)));
  view.F = view.F0 + (Ff - view.F0) * view.k;
  view.cy = yRun + (yFight - yRun) * view.k - view.F * ARMY_K;
}

function proj(x, y, z, o) {
  const rx = x - view.camX, ry = y - CAM_H, rz = z - view.camZ;
  const d = -ry * SINP + rz * COSP;
  if (d < 0.6) return false;
  const v = ry * COSP + rz * SINP, s = view.F / d;
  o.x = view.cx + rx * s + view.sx; o.y = view.cy - v * s + view.sy; o.s = s; o.d = d;
  return true;
}
function poly4(fill, stroke, lw) {
  ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y); ctx.lineTo(P2.x, P2.y); ctx.lineTo(P3.x, P3.y); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
// Flat rectangle on the ground, a wall facing the camera (z fixed) or a wall along the road (x fixed)
function ground(x0, x1, z0, z1, y, fill) { if (proj(x0, y, z0, P0) && proj(x1, y, z0, P1) && proj(x1, y, z1, P2) && proj(x0, y, z1, P3)) poly4(fill); }
function wallZ(x0, x1, y0, y1, z, fill, stroke, lw) { if (proj(x0, y0, z, P0) && proj(x1, y0, z, P1) && proj(x1, y1, z, P2) && proj(x0, y1, z, P3)) { poly4(fill, stroke, lw); return true; } return false; }
function wallX(x, z0, z1, y0, y1, fill) { if (proj(x, y0, z0, P0) && proj(x, y0, z1, P1) && proj(x, y1, z1, P2) && proj(x, y1, z0, P3)) poly4(fill); }
function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function outlined(text, x, y, size, fill, stroke) {
  ctx.font = `${size}px ${FD}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, size * 0.18); ctx.strokeStyle = stroke; ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
}
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// Rich text on the canvas: text runs and stacked fractions, centred on (cx, cy), shrunk to fit maxW
function richWidth(segs, size) {
  let w = 0;
  for (const g of segs) {
    if (g.t !== undefined) { ctx.font = `${size}px ${FD}`; w += ctx.measureText(g.t).width; }
    else { ctx.font = `${size * 0.62}px ${FD}`; w += Math.max(ctx.measureText(g.n).width, ctx.measureText(g.d).width) + size * 0.2; }
  }
  return w;
}
function drawRich(s, cx, cy, size, fill, stroke, maxW) {
  const segs = parseRich(s);
  let w = richWidth(segs, size);
  if (maxW && w > maxW) { size *= maxW / w; w = maxW; }
  let x = cx - w / 2;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const put = (t, px, py, fs) => {
    ctx.font = `${fs}px ${FD}`;
    if (stroke) { ctx.lineWidth = Math.max(2, fs * 0.18); ctx.strokeStyle = stroke; ctx.strokeText(t, px, py); }
    ctx.fillStyle = fill; ctx.fillText(t, px, py);
  };
  for (const g of segs) {
    if (g.t !== undefined) {
      ctx.font = `${size}px ${FD}`; const tw = ctx.measureText(g.t).width;
      put(g.t, x + tw / 2, cy, size); x += tw;
    } else {
      const fs = size * 0.62; ctx.font = `${fs}px ${FD}`;
      const fw = Math.max(ctx.measureText(g.n).width, ctx.measureText(g.d).width) + size * 0.2, mx = x + fw / 2;
      const bar = () => { ctx.beginPath(); ctx.moveTo(x + size * 0.06, cy); ctx.lineTo(x + fw - size * 0.06, cy); ctx.stroke(); };
      ctx.lineCap = 'round';
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = size * 0.07 + Math.max(2, fs * 0.18); bar(); }
      ctx.strokeStyle = fill; ctx.lineWidth = Math.max(1.2, size * 0.07); bar();
      put(g.n, mx, cy - size * 0.36, fs); put(g.d, mx, cy + size * 0.38, fs);
      x += fw;
    }
  }
}

/* ---------- soldier and zombie sprites, drawn once ---------- */
const SW = 72, SH = 108;
// Army colours to choose in the armoury: main, dark, light
const SKINS = [
  { name: 'Niebieski', price: 0, c: ['#2f7df6', '#1c4fb4', '#9cc4ff'] },
  { name: 'Zielony', price: 30, c: ['#2fae5a', '#1d7a3d', '#9fe6b8'] },
  { name: 'Pomarańczowy', price: 30, c: ['#f08a24', '#b25d0f', '#ffd0a0'] },
  { name: 'Fioletowy', price: 50, c: ['#8a4fd6', '#5a2a9c', '#d4b8f7'] },
  { name: 'Czarny', price: 60, c: ['#3a4150', '#1e232d', '#9aa3b5'] },
  { name: 'Złoty', price: 150, c: ['#f2c230', '#b8860b', '#fff0a8'] },
];
function makeSoldier(col, frame) {
  const c = document.createElement('canvas'); c.width = SW; c.height = SH;
  const x = c.getContext('2d');
  const [main, dark, light] = col, ink = '#15233b', boot = '#262b36';
  const ph = frame / 4 * Math.PI * 2, sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 3;
  x.lineJoin = 'round'; x.lineCap = 'round'; x.lineWidth = 3.5; x.strokeStyle = ink;
  const blob = (path, fill) => { x.beginPath(); path(); x.fillStyle = fill; x.fill(); x.stroke(); };
  const legTop = 72 - bob;
  blob(() => rr(x, 22, legTop, 12, 104 - legTop - Math.max(0, sw) * 7, 5), boot);
  blob(() => rr(x, 38, legTop, 12, 104 - legTop - Math.max(0, -sw) * 7, 5), boot);
  blob(() => x.ellipse(13, 58 - bob + sw * 4, 7, 10, 0, 0, Math.PI * 2), dark);
  blob(() => x.ellipse(59, 58 - bob - sw * 4, 7, 10, 0, 0, Math.PI * 2), dark);
  blob(() => rr(x, 15, 40 - bob, 42, 38, 14), main);
  blob(() => rr(x, 23, 45 - bob, 26, 24, 7), dark);                  // backpack, seen from behind
  blob(() => x.arc(36, 29 - bob, 19, 0, Math.PI * 2), main);        // helmet
  x.beginPath(); x.arc(36, 29 - bob, 12, Math.PI * 1.15, Math.PI * 1.6); x.strokeStyle = light; x.lineWidth = 5; x.stroke();
  return c;
}
// Zombies walk towards the army, so we see their faces; a big one is fatter and angrier
function makeZombie(frame, big) {
  const c = document.createElement('canvas'); c.width = SW; c.height = SH;
  const x = c.getContext('2d');
  const ink = '#15233b', skin = big ? '#74b84f' : '#93d36c', skinDk = big ? '#4f8a33' : '#62a446';
  const shirt = big ? '#7a4a2a' : '#7b5fb8', shirtDk = big ? '#4e2c16' : '#4f3a85', pants = '#3b4252';
  const ph = frame / 4 * Math.PI * 2, sw = Math.sin(ph), bob = Math.abs(Math.cos(ph)) * 2.5, lean = sw * 2.5;
  x.lineJoin = 'round'; x.lineCap = 'round'; x.lineWidth = 3.5; x.strokeStyle = ink;
  const blob = (path, fill) => { x.beginPath(); path(); x.fillStyle = fill; x.fill(); x.stroke(); };
  const legTop = 74 - bob;
  blob(() => rr(x, 22, legTop, 12, 104 - legTop - Math.max(0, sw) * 6, 4), pants);
  blob(() => rr(x, 38, legTop, 12, 104 - legTop - Math.max(0, -sw) * 6, 4), pants);
  const bw = big ? 50 : 40, bx = 36 - bw / 2 + lean;
  // torn shirt with a ragged hem
  blob(() => {
    x.moveTo(bx + 8, 42 - bob); x.lineTo(bx + bw - 8, 42 - bob); x.quadraticCurveTo(bx + bw + 2, 44 - bob, bx + bw, 60 - bob);
    for (let i = 0; i <= 6; i++) x.lineTo(bx + bw - i * bw / 6, 78 - bob + (i % 2 ? -5 : 1));
    x.quadraticCurveTo(bx - 2, 44 - bob, bx + 8, 42 - bob);
  }, shirt);
  x.beginPath(); x.moveTo(bx + 12, 56 - bob); x.lineTo(bx + 18, 62 - bob); x.lineTo(bx + 14, 66 - bob); x.strokeStyle = shirtDk; x.lineWidth = 3; x.stroke();
  x.strokeStyle = ink; x.lineWidth = 3.5;
  // arms stretched towards us: sleeves and hands in front of the chest
  blob(() => x.ellipse(bx + 2, 54 - bob + sw * 3, 8, 7, 0, 0, Math.PI * 2), shirtDk);
  blob(() => x.ellipse(bx + bw - 2, 54 - bob - sw * 3, 8, 7, 0, 0, Math.PI * 2), shirtDk);
  blob(() => x.ellipse(bx + 6, 50 - bob + sw * 3, 7, 6.5, 0, 0, Math.PI * 2), skin);
  blob(() => x.ellipse(bx + bw - 6, 50 - bob - sw * 3, 7, 6.5, 0, 0, Math.PI * 2), skin);
  // head
  const hr = big ? 19 : 16, hx = 36 + lean * 1.4, hy = 27 - bob;
  blob(() => x.arc(hx, hy, hr, 0, Math.PI * 2), skin);
  x.fillStyle = skinDk; x.beginPath(); x.ellipse(hx - hr * 0.45, hy + hr * 0.1, hr * 0.32, hr * 0.26, 0, 0, Math.PI * 2); x.ellipse(hx + hr * 0.45, hy + hr * 0.1, hr * 0.32, hr * 0.26, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#ffffff'; x.beginPath(); x.arc(hx - hr * 0.42, hy, hr * 0.24, 0, 7); x.arc(hx + hr * 0.42, hy, hr * 0.2, 0, 7); x.fill();
  x.fillStyle = ink; x.beginPath(); x.arc(hx - hr * 0.36, hy + 1, hr * 0.1, 0, 7); x.arc(hx + hr * 0.47, hy - 1, hr * 0.09, 0, 7); x.fill();
  if (big) { x.beginPath(); x.moveTo(hx - hr * 0.75, hy - hr * 0.42); x.lineTo(hx - hr * 0.2, hy - hr * 0.22); x.moveTo(hx + hr * 0.75, hy - hr * 0.42); x.lineTo(hx + hr * 0.2, hy - hr * 0.22); x.stroke(); }
  x.beginPath(); x.moveTo(hx - hr * 0.42, hy + hr * 0.55); x.quadraticCurveTo(hx, hy + hr * 0.4, hx + hr * 0.45, hy + hr * 0.58); x.stroke();
  x.fillStyle = '#ffffff'; x.fillRect(hx - 1, hy + hr * 0.46, 5, 5);
  x.beginPath(); x.moveTo(hx - 3, hy - hr); x.lineTo(hx - 6, hy - hr - 6); x.moveTo(hx + 3, hy - hr); x.lineTo(hx + 5, hy - hr - 5); x.stroke();
  return c;
}
const ZOMB = [[0, 1, 2, 3].map(f => makeZombie(f, false)), [0, 1, 2, 3].map(f => makeZombie(f, true))];
const armySprites = [];
const armySprite = (skin, f) => (armySprites[skin] = armySprites[skin] || [0, 1, 2, 3].map(k => makeSoldier(SKINS[skin].c, k)))[f];
const backOut = t => { const c = 1.9; t -= 1; return 1 + t * t * ((c + 1) * t + c); };

/* ---------- monsters: one for every class ---------- */
const MONSTERS = [
  { name: 'Glutek', body: '#5cc443', dark: '#2c7a26', light: '#b9f59a', eyes: 1, horns: 0, size: 0.82 },
  { name: 'Kudłacz', body: '#9a5bd6', dark: '#572a8c', light: '#d6b8f7', eyes: 2, horns: 1, fur: true, size: 0.86 },
  { name: 'Ropuchor', body: '#f08a2e', dark: '#9c4c17', light: '#ffd29a', eyes: 2, horns: 0, spots: true, size: 0.9 },
  { name: 'Głazor', body: '#8e98a5', dark: '#4f5966', light: '#cfd6de', eyes: 2, horns: 0, cracks: true, size: 0.94 },
  { name: 'Płomyk', body: '#e2452f', dark: '#871d12', light: '#ffb07a', eyes: 2, horns: 2, flames: true, size: 0.96 },
  { name: 'Lodowiec', body: '#79cfee', dark: '#2a7fa6', light: '#e8f9ff', eyes: 2, horns: 1, spikes: true, size: 0.98 },
  { name: 'Trójoki', body: '#23a094', dark: '#115d56', light: '#9fe8e0', eyes: 3, horns: 2, spikes: true, size: 1.0 },
  { name: 'Liczożerca', body: '#b02a3e', dark: '#5a1020', light: '#ff9aa8', eyes: 2, horns: 2, wings: true, spikes: true, size: 1.0 },
];

function drawMonster(M, g, o) {
  const T = MONSTERS[M.kind], t = g.time, u = o.s * T.size;
  const atk = clamp(1 - (t - M.anim) / 0.7, 0, 1), lunge = Math.sin(atk * Math.PI);
  let alpha = 1, sink = 0, tilt = 0;
  if (M.dead) { const k = clamp((t - M.deadAt) / 1.1, 0, 1); alpha = 1 - k; sink = k * 2.5; tilt = k * 0.5; }
  if (alpha <= 0) return;
  const breathe = 1 + 0.03 * Math.sin(t * 2.4);
  const X = x => o.x + x * u, Y = y => o.y - (y - sink) * u;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (tilt) { ctx.translate(o.x, o.y); ctx.rotate(tilt); ctx.translate(-o.x, -o.y); }
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#15233b'; ctx.lineWidth = Math.max(2, 0.09 * u);
  // shadow
  ctx.fillStyle = 'rgba(10,30,50,0.28)'; ctx.beginPath(); ctx.ellipse(o.x, o.y, 3.4 * u, 0.8 * u, 0, 0, Math.PI * 2); ctx.fill();
  const cy = 3.2 + lunge * 0.35, rx = 3.0 * (1 + lunge * 0.05), ry = 2.9 * breathe * (1 + lunge * 0.06);
  // wings
  if (T.wings) {
    const flap = Math.sin(t * 5) * 0.4;
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(X(sd * 1.8), Y(cy + 1.4)); ctx.lineTo(X(sd * 5.4), Y(cy + 3.6 + flap)); ctx.lineTo(X(sd * 4.6), Y(cy + 0.6 + flap));
      ctx.lineTo(X(sd * 3.6), Y(cy + 1.4)); ctx.lineTo(X(sd * 2.9), Y(cy - 0.2)); ctx.closePath();
      ctx.fillStyle = T.dark; ctx.fill(); ctx.stroke();
    }
  }
  // feet and arms
  for (const sd of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(X(sd * 1.4), Y(0.35), 0.9 * u, 0.45 * u, 0, 0, Math.PI * 2); ctx.fillStyle = T.dark; ctx.fill(); ctx.stroke();
    const raise = lunge * 1.6;
    ctx.beginPath(); ctx.ellipse(X(sd * 3.0), Y(cy - 0.4 + raise), 0.75 * u, 1.25 * u, sd * (0.5 + lunge * 0.8), 0, Math.PI * 2); ctx.fillStyle = T.body; ctx.fill(); ctx.stroke();
    for (let c = -1; c <= 1; c++) { ctx.beginPath(); ctx.arc(X(sd * 3.2 + c * 0.32), Y(cy - 1.5 + raise * 1.3), 0.18 * u, 0, Math.PI * 2); ctx.fillStyle = '#fff6e0'; ctx.fill(); ctx.stroke(); }
  }
  // horns
  if (T.horns) {
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      if (T.horns === 1) { ctx.moveTo(X(sd * 0.9), Y(cy + ry - 0.3)); ctx.lineTo(X(sd * 1.3), Y(cy + ry + 1.0)); ctx.lineTo(X(sd * 1.7), Y(cy + ry - 0.5)); }
      else { ctx.moveTo(X(sd * 1.0), Y(cy + ry - 0.4)); ctx.quadraticCurveTo(X(sd * 2.6), Y(cy + ry + 0.4), X(sd * 2.4), Y(cy + ry + 1.9)); ctx.quadraticCurveTo(X(sd * 2.0), Y(cy + ry + 0.5), X(sd * 1.9), Y(cy + ry - 0.6)); }
      ctx.closePath(); ctx.fillStyle = '#fff1d6'; ctx.fill(); ctx.stroke();
    }
  }
  // spikes along the back
  if (T.spikes) {
    for (let i = -2; i <= 2; i++) {
      const a0 = -Math.PI / 2 + i * 0.38, bx = Math.cos(a0) * rx, by = -Math.sin(a0) * ry;
      ctx.beginPath(); ctx.moveTo(X(bx - 0.35), Y(cy + by - 0.15)); ctx.lineTo(X(bx * 1.12), Y(cy + by * 1.22 + 0.5)); ctx.lineTo(X(bx + 0.35), Y(cy + by - 0.15)); ctx.closePath();
      ctx.fillStyle = T.light; ctx.fill(); ctx.stroke();
    }
  }
  // body
  ctx.beginPath();
  if (T.fur) {
    for (let i = 0; i <= 40; i++) { const a0 = i / 40 * Math.PI * 2, rr2 = 1 + (i % 2 ? 0.07 : -0.02); const px = X(Math.cos(a0) * rx * rr2), py = Y(cy + Math.sin(a0) * ry * rr2); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath();
  } else ctx.ellipse(X(0), Y(cy), rx * u, ry * u, 0, 0, Math.PI * 2);
  ctx.fillStyle = T.body; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(X(0), Y(cy - 0.9), 1.9 * u, 1.5 * u, 0, 0, Math.PI * 2); ctx.fillStyle = T.light; ctx.fill();
  if (T.spots) { ctx.fillStyle = T.dark; for (const [sx, sy, r] of [[-1.9, 4.6, 0.35], [2.0, 4.3, 0.42], [-2.3, 2.2, 0.3], [2.4, 1.9, 0.28]]) { ctx.beginPath(); ctx.arc(X(sx), Y(sy + lunge * 0.35), r * u, 0, Math.PI * 2); ctx.fill(); } }
  if (T.cracks) { ctx.beginPath(); ctx.moveTo(X(-2.2), Y(4.6)); ctx.lineTo(X(-1.6), Y(4.0)); ctx.lineTo(X(-1.9), Y(3.4)); ctx.moveTo(X(2.0), Y(2.0)); ctx.lineTo(X(1.5), Y(2.6)); ctx.lineTo(X(1.8), Y(3.1)); ctx.strokeStyle = T.dark; ctx.stroke(); ctx.strokeStyle = '#15233b'; }
  if (T.flames) {
    for (let i = -2; i <= 2; i++) {
      const h = 0.9 + 0.4 * Math.sin(t * 9 + i * 1.7);
      ctx.beginPath(); ctx.moveTo(X(i * 0.55 - 0.3), Y(cy + ry - 0.25)); ctx.quadraticCurveTo(X(i * 0.55), Y(cy + ry + h * 1.6), X(i * 0.55 + 0.3), Y(cy + ry - 0.25)); ctx.closePath();
      ctx.fillStyle = i % 2 ? '#ffd23f' : '#ff8a2a'; ctx.fill();
    }
  }
  // eyes look at the army
  const ey = cy + 1.05, eyes = T.eyes === 1 ? [[0, ey + 0.2, 0.95]] : T.eyes === 2 ? [[-0.95, ey, 0.62], [0.95, ey, 0.62]] : [[-1.15, ey - 0.1, 0.5], [0, ey + 0.55, 0.55], [1.15, ey - 0.1, 0.5]];
  const blink = (t % 3.7) < 0.12;
  for (const [ex, eY, er] of eyes) {
    ctx.beginPath(); ctx.ellipse(X(ex), Y(eY), er * u, (blink ? 0.12 : 1) * er * u, 0, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
    if (!blink) { ctx.beginPath(); ctx.arc(X(ex), Y(eY - er * 0.3), er * 0.45 * u, 0, Math.PI * 2); ctx.fillStyle = '#15233b'; ctx.fill(); ctx.beginPath(); ctx.arc(X(ex - er * 0.15), Y(eY - er * 0.12), er * 0.14 * u, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(X(ex - er * 1.0), Y(eY + er * 1.05)); ctx.lineTo(X(ex + er * 0.9), Y(eY + er * (ex < 0 ? 0.6 : 1.25) + (ex === 0 ? -0.2 : 0))); ctx.lineWidth = Math.max(2, 0.16 * u); ctx.stroke(); ctx.lineWidth = Math.max(2, 0.09 * u);
  }
  // mouth opens wide when attacking
  const mw = 1.5, mh = 0.35 + lunge * 0.95, my = cy - 0.75;
  ctx.beginPath(); ctx.ellipse(X(0), Y(my), mw * u, mh * u, 0, 0, Math.PI * 2); ctx.fillStyle = '#5b0f1c'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fffaf0';
  for (let i = -2; i <= 2; i++) {
    const tx = i * 0.5; ctx.beginPath(); ctx.moveTo(X(tx - 0.2), Y(my + mh * 0.75)); ctx.lineTo(X(tx), Y(my + mh * 0.75 - 0.35)); ctx.lineTo(X(tx + 0.2), Y(my + mh * 0.75)); ctx.closePath(); ctx.fill();
  }
  // flash when hit
  if (t - M.hit < 0.06 && !M.dead) { ctx.globalAlpha = 0.25 * alpha; ctx.beginPath(); ctx.ellipse(X(0), Y(cy), rx * u, ry * u, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); }
  ctx.restore();
}

/* ---------- scenery ---------- */
/* ---------- worlds: every topic of a level runs through another place ---------- */
// sky top/bottom, far silhouette, ground gradient, ground marks, road colours, rails, decoration, hole in a broken road
const WORLDS = {
  most: { name: 'Most nad morzem', sky: ['#6fc0f2', '#d9f1ff'], far: ['hills', '#a9cfe8'], ground: ['#79bfe9', '#3b8fd0', '#14589a'], marks: 'waves',
    side: '#e4e6ea', road: '#a9afb8', edge: '#f4f5f7', dash: 'rgba(255,255,255,0.92)', deck: '#a5352b', rail: 'bridge', hole: ['#0d3a66', '#1d5f9c'], splash: ['#7cc4ff', '#ffffff', '#1d5f9c'] },
  las: { name: 'Las', sky: ['#78c4ee', '#e4f6ff'], far: ['hills', '#79ab6e'], ground: ['#8fd16a', '#5fae48', '#3f8c34'], marks: 'grass',
    side: '#8a6a43', road: '#b98f5c', edge: '#e2c69a', dash: 'rgba(255,240,210,0.7)', rail: 'fence', decor: 'tree', hole: ['#24170a', '#3d2a14'], splash: ['#6b4424', '#8fd16a', '#3d2a14'] },
  kanion: { name: 'Kanion', sky: ['#f1a95f', '#ffe3b3'], far: ['mesas', '#d4835a'], ground: ['#eab274', '#d99650', '#b9773c'], marks: 'sand',
    side: '#a87a48', road: '#cfa572', edge: '#f4d8a6', dash: 'rgba(255,245,220,0.75)', rail: 'none', walls: ['#c4683a', '#9e4c27', '#e38c57'], decor: 'cactus', hole: ['#2e170b', '#4e2a15'], splash: ['#e9b071', '#b8743a', '#ffe2b0'] },
  snieg: { name: 'Śnieżne góry', sky: ['#9fd0f3', '#f3f9ff'], far: ['peaks', '#b7cde3'], ground: ['#f6f9fd', '#dfeaf5', '#c4d7ea'], marks: 'snow',
    side: '#e6edf5', road: '#b6c6d8', edge: '#ffffff', dash: 'rgba(255,255,255,0.95)', rail: 'fence', decor: 'pine', hole: ['#12304d', '#2b5276'], splash: ['#ffffff', '#cfe6ff', '#7fb2e0'], fall: 'snow' },
  wulkan: { name: 'Wulkan', sky: ['#2b1220', '#d4502a'], far: ['volcano', '#3d2224'], ground: ['#3d2c2b', '#2a1e1e', '#181212'], marks: 'lava',
    side: '#2b2323', road: '#504747', edge: '#ff7a2a', dash: 'rgba(255,150,60,0.75)', rail: 'none', decor: 'rock', hole: ['#ff5a14', '#ffb02e'], splash: ['#ff6a1a', '#ffd23f', '#ff3a10'], fall: 'embers', lavaGlow: true },
  miasto: { name: 'Miasto nocą', sky: ['#0b1430', '#2e3d72'], far: ['skyline', '#18213f'], ground: ['#1d2438', '#161c2c', '#10141f'], marks: null,
    side: '#5c6274', road: '#383d4c', edge: '#ffd23f', dash: 'rgba(255,255,255,0.7)', rail: 'lamps', decor: 'building', hole: ['#04060b', '#111726'], splash: ['#8a93a8', '#ffffff', '#3a3f4e'], stars: true },
  kosmos: { name: 'Kosmos', sky: ['#04030d', '#1c1142'], far: ['planets'], ground: ['#0b0922', '#0e0a2b', '#120b38'], marks: 'stars',
    side: '#363b52', road: '#565c74', edge: '#3ef0ff', dash: 'rgba(62,240,255,0.7)', rail: 'neon', decor: 'asteroid', hole: ['#000000', '#0e0a2b'], splash: ['#3ef0ff', '#ffffff', '#8a4fd6'], stars: true },
};

// Far scenery on the horizon, fixed to the screen
function drawFar(Wd, hy, W) {
  const [kind, col] = Wd.far;
  ctx.fillStyle = col;
  if (kind === 'hills') {
    ctx.beginPath(); ctx.moveTo(0, hy);
    for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, hy - 6 - 10 * (0.5 + 0.5 * Math.sin(x * 0.013 + 1.3)) * (0.6 + 0.4 * Math.sin(x * 0.031)));
    ctx.lineTo(W, hy); ctx.closePath(); ctx.fill();
  } else if (kind === 'mesas') {
    ctx.beginPath(); ctx.moveTo(0, hy);
    for (let i = 0; i <= 12; i++) {
      const x0 = i / 12 * W, h = 10 + 26 * hash(i + 3), w = W / 12;
      ctx.lineTo(x0 + w * 0.15, hy - h); ctx.lineTo(x0 + w * 0.85, hy - h); ctx.lineTo(x0 + w, hy - 4);
    }
    ctx.lineTo(W, hy); ctx.closePath(); ctx.fill();
  } else if (kind === 'peaks') {
    const pts = [];
    for (let i = 0; i <= 14; i++) pts.push([i / 14 * W, hy - (i % 2 ? 14 + 40 * hash(i * 7.3) : 4 + 10 * hash(i))]);
    ctx.beginPath(); ctx.moveTo(0, hy); for (const [x, y] of pts) ctx.lineTo(x, y); ctx.lineTo(W, hy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (let i = 1; i < 14; i += 2) {
      const [x, y] = pts[i], [xa, ya] = pts[i - 1], [xb, yb] = pts[i + 1], k = 0.35;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (xa - x) * k, y + (ya - y) * k); ctx.lineTo(x + (xb - x) * k, y + (yb - y) * k); ctx.closePath(); ctx.fill();
    }
  } else if (kind === 'volcano') {
    const cx = W * 0.62, top = hy - 70;
    ctx.beginPath(); ctx.moveTo(cx - 170, hy); ctx.lineTo(cx - 26, top); ctx.lineTo(cx + 26, top); ctx.lineTo(cx + 190, hy); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, hy); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, hy - 8 - 8 * hash(x)); ctx.lineTo(W, hy); ctx.closePath(); ctx.fill();
    const glow = ctx.createRadialGradient(cx, top, 2, cx, top, 70);
    glow.addColorStop(0, 'rgba(255,200,80,0.9)'); glow.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = glow; ctx.fillRect(cx - 70, top - 70, 140, 100);
  } else if (kind === 'skyline') {
    for (let i = 0; i < 26; i++) {
      const w = W / 22, x = i * w * 0.9 - 10, h = 18 + 60 * hash(i * 3.1);
      ctx.fillStyle = col; ctx.fillRect(x, hy - h, w * 0.8, h);
      ctx.fillStyle = 'rgba(255,214,110,0.55)';
      for (let r = 0; r < h / 9 - 1; r++) for (let c = 0; c < 2; c++) if (hash(i * 31 + r * 7 + c) > 0.55) ctx.fillRect(x + 3 + c * w * 0.35, hy - h + 5 + r * 9, 3, 4);
    }
  } else if (kind === 'planets') {
    const p1 = ctx.createRadialGradient(W * 0.2, hy * 0.35, 4, W * 0.24, hy * 0.42, 60);
    p1.addColorStop(0, '#ffcf8a'); p1.addColorStop(1, '#a8452a');
    ctx.fillStyle = p1; ctx.beginPath(); ctx.arc(W * 0.24, hy * 0.42, 46, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,170,0.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(W * 0.24, hy * 0.42, 74, 14, -0.3, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#7fb7ff'; ctx.beginPath(); ctx.arc(W * 0.82, hy * 0.25, 14, 0, Math.PI * 2); ctx.fill();
  }
}
// Stars in a night or space sky, fixed to the screen, twinkling
function drawSkyStars(hy, t) {
  for (let i = 0; i < 70; i++) {
    const x = hash(i * 1.7) * view.w, y = hash(i * 2.9 + 5) * hy;
    ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.3 + i));
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, i % 9 ? 1.5 : 2.5, i % 9 ? 1.5 : 2.5);
  }
  ctx.globalAlpha = 1;
}
// Small marks on the ground beside the road, so the world moves past: waves, grass, sand, snow, lava cracks, stars
function drawMarks(Wd, g) {
  const kind = Wd.marks;
  if (!kind) return;
  const zc0 = Math.floor(view.camZ / 6) * 6, near = kind === 'waves' ? 7.5 : 5.2;
  if (kind === 'waves' || kind === 'lava') {
    ctx.strokeStyle = kind === 'waves' ? 'rgba(255,255,255,0.32)' : `rgba(255,${110 + 40 * Math.sin(g.time * 2) | 0},30,0.75)`;
    ctx.lineCap = 'round'; ctx.lineWidth = kind === 'waves' ? 1.6 : 2.2; ctx.beginPath();
  }
  for (let zc = zc0; zc < view.camZ + 140; zc += 6) {
    for (let j = 0; j < 6; j++) {
      let x = (hash(zc * 0.37 + j * 7.1) - 0.5) * 100; if (Math.abs(x) < near) x += x < 0 ? -near : near;
      const z = zc + hash(zc * 0.71 + j * 3.3) * 6;
      if (!proj(x, 0, z, P0)) continue;
      const l = 0.8 * P0.s;
      if (kind === 'waves') { const wob = Math.sin(g.time * 1.5 + j + zc) * 0.15 * P0.s; ctx.moveTo(P0.x - l + wob, P0.y); ctx.quadraticCurveTo(P0.x + wob, P0.y - l * 0.3, P0.x + l + wob, P0.y); }
      else if (kind === 'lava') { ctx.moveTo(P0.x - l, P0.y); ctx.lineTo(P0.x - l * 0.2, P0.y - l * 0.12); ctx.lineTo(P0.x + l * 0.4, P0.y + l * 0.05); ctx.lineTo(P0.x + l, P0.y - l * 0.1); }
      else if (kind === 'grass') { ctx.fillStyle = j % 2 ? '#4f9a3a' : '#7cc45a'; ctx.fillRect(P0.x - 0.04 * P0.s, P0.y - 0.35 * P0.s, Math.max(1, 0.08 * P0.s), 0.35 * P0.s); ctx.fillRect(P0.x + 0.1 * P0.s, P0.y - 0.25 * P0.s, Math.max(1, 0.07 * P0.s), 0.25 * P0.s); }
      else if (kind === 'sand') { ctx.fillStyle = j % 2 ? '#c98a4a' : '#f3c98c'; ctx.fillRect(P0.x, P0.y, Math.max(1.5, 0.12 * P0.s), Math.max(1, 0.06 * P0.s)); }
      else if (kind === 'snow') { ctx.fillStyle = j % 2 ? '#c9dbee' : '#ffffff'; ctx.beginPath(); ctx.ellipse(P0.x, P0.y, Math.max(1.5, 0.3 * P0.s), Math.max(1, 0.08 * P0.s), 0, 0, Math.PI * 2); ctx.fill(); }
      else if (kind === 'stars') { ctx.fillStyle = j % 3 ? 'rgba(255,255,255,0.8)' : 'rgba(140,200,255,0.9)'; const r = Math.max(1, 0.06 * P0.s); ctx.fillRect(P0.x - r, P0.y - r, r * 2, r * 2); }
    }
  }
  if (kind === 'waves' || kind === 'lava') ctx.stroke();
}
// Canyon walls far on both sides, with a ragged top and layers of rock
function drawCanyonWalls(Wd, zn, zf) {
  for (const sx of [-1, 1]) {
    const x = sx * 9.5;
    ctx.beginPath(); let first = true;
    for (let z = zn; z <= zf; z += 4) { if (!proj(x, 0, z, P0)) continue; if (first) { ctx.moveTo(P0.x, P0.y); first = false; } else ctx.lineTo(P0.x, P0.y); }
    for (let z = Math.floor(zf / 4) * 4; z >= zn; z -= 4) { const h = 11 + 5 * hash(Math.floor(z / 4) + sx * 50); if (proj(x, h, z, P0)) ctx.lineTo(P0.x, P0.y); }
    ctx.closePath(); ctx.fillStyle = Wd.walls[0]; ctx.fill();
    ctx.strokeStyle = Wd.walls[1]; ctx.lineWidth = 2;
    for (const y of [3, 6.5]) { ctx.beginPath(); first = true; for (let z = zn; z <= zf; z += 4) { if (!proj(x, y + hash(Math.floor(z / 4)) * 0.6, z, P0)) continue; if (first) { ctx.moveTo(P0.x, P0.y); first = false; } else ctx.lineTo(P0.x, P0.y); } ctx.stroke(); }
  }
}
// Rails along the road: bridge rails, a wooden fence, street lamps or neon posts
function drawRails(Wd, g, zn) {
  const far = view.camZ + 110;
  if (Wd.rail === 'fence') {
    for (const sx of [-4.55, 4.55]) {
      ctx.strokeStyle = '#7a5531'; ctx.lineCap = 'round';
      for (let z = Math.ceil(zn / 3) * 3; z < far; z += 3) {
        if (!proj(sx, 0, z, P0) || !proj(sx, 0.9, z, P1)) continue;
        ctx.lineWidth = Math.max(1.5, 0.14 * P0.s); ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y); ctx.stroke();
      }
      ctx.beginPath(); let first = true;
      for (let z = zn; z <= far; z += 3) { if (!proj(sx, 0.75, z, P0)) continue; if (first) { ctx.moveTo(P0.x, P0.y); first = false; } else ctx.lineTo(P0.x, P0.y); }
      ctx.lineWidth = 3; ctx.strokeStyle = '#9b6f42'; ctx.stroke();
    }
  } else if (Wd.rail === 'lamps') {
    ctx.globalCompositeOperation = 'lighter';
    for (let z = Math.ceil(zn / 12) * 12; z < far; z += 12) for (const sx of [-3.6, 3.6]) {
      if (!proj(sx, 0.01, z, P0)) continue;
      ctx.fillStyle = 'rgba(255,214,120,0.16)'; ctx.beginPath(); ctx.ellipse(P0.x, P0.y, 1.8 * P0.s, 0.6 * P0.s, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let z = Math.ceil(zn / 12) * 12; z < far; z += 12) for (const sx of [-4.6, 4.6]) {
      if (!proj(sx, 0, z, P0) || !proj(sx, 4.2, z, P1) || !proj(sx * 0.82, 4.2, z, P2)) continue;
      ctx.strokeStyle = '#2a2f3b'; ctx.lineWidth = Math.max(1.5, 0.12 * P0.s); ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y); ctx.lineTo(P2.x, P2.y); ctx.stroke();
      const r = Math.max(2, 0.28 * P2.s), gl = ctx.createRadialGradient(P2.x, P2.y, 0, P2.x, P2.y, r * 3);
      gl.addColorStop(0, 'rgba(255,240,190,1)'); gl.addColorStop(1, 'rgba(255,200,90,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(P2.x, P2.y, r * 3, 0, Math.PI * 2); ctx.fill();
    }
  } else if (Wd.rail === 'neon') {
    ctx.globalCompositeOperation = 'lighter';
    for (const sx of [-4.5, 4.5]) {
      ctx.beginPath(); let first = true;
      for (let z = zn; z <= far; z += 3) { if (!proj(sx, 0.6, z, P0)) continue; if (first) { ctx.moveTo(P0.x, P0.y); first = false; } else ctx.lineTo(P0.x, P0.y); }
      ctx.strokeStyle = 'rgba(62,240,255,0.35)'; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = 'rgba(200,255,255,0.95)'; ctx.lineWidth = 2; ctx.stroke();
      for (let z = Math.ceil(zn / 4) * 4; z < far; z += 4) {
        if (!proj(sx, 0, z, P0) || !proj(sx, 0.6, z, P1)) continue;
        ctx.strokeStyle = 'rgba(62,240,255,0.7)'; ctx.lineWidth = Math.max(1, 0.08 * P0.s); ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

const TOWER_GAP = 80, TOWER_X = 5.25, TOWER_TOP = 16;
function drawBackdrop(g) {
  const Wd = WORLDS[g.world], W = view.w, H = view.h, hy = view.cy - view.F * TANP + view.sy;
  const sky = ctx.createLinearGradient(0, 0, 0, Math.max(1, hy));
  sky.addColorStop(0, Wd.sky[0]); sky.addColorStop(1, Wd.sky[1]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, Math.max(0, hy) + 1);
  if (Wd.stars) drawSkyStars(hy, g.time);
  drawFar(Wd, hy, W);
  const gr = ctx.createLinearGradient(0, hy, 0, H);
  gr.addColorStop(0, Wd.ground[0]); gr.addColorStop(0.18, Wd.ground[1]); gr.addColorStop(1, Wd.ground[2]);
  ctx.fillStyle = gr; ctx.fillRect(0, hy, W, H - hy);
  drawMarks(Wd, g);

  const zn = view.camZ + 1.0, zf = view.camZ + 175;
  if (Wd.walls) drawCanyonWalls(Wd, zn, zf);
  if (Wd.lavaGlow) for (const sx of [-1, 1]) {        // rivers of lava beside the road
    ground(sx * 6.2, sx * 7.6, zn, zf, 0, `rgba(255,${90 + 30 * Math.sin(g.time * 1.7) | 0},20,0.85)`);
    ground(sx * 6.6, sx * 7.2, zn, zf, 0.005, 'rgba(255,214,90,0.8)');
  }
  if (Wd.deck) { wallX(-4.75, zn, zf, -1.0, 0, Wd.deck); wallX(4.75, zn, zf, -1.0, 0, Wd.deck); }
  ground(-4.75, 4.75, zn, zf, 0, Wd.side);
  ground(-4.35, 4.35, zn, zf, 0, Wd.road);
  ground(-4.0, -3.86, zn, view.camZ + 120, 0.01, Wd.edge);
  ground(3.86, 4.0, zn, view.camZ + 120, 0.01, Wd.edge);
  const d0 = Math.floor(zn / 4) * 4;
  for (let z = d0; z < view.camZ + 110; z += 4) ground(-0.09, 0.09, Math.max(z, zn), z + 2, 0.01, Wd.dash);
  if (g.finishZ < view.camZ + 170 && g.finishZ > view.camZ) {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 10; c++) {
      ground(-4.35 + c * 0.87, -4.35 + (c + 1) * 0.87, g.finishZ + r * 0.8, g.finishZ + (r + 1) * 0.8, 0.02, (r + c) % 2 ? '#15233b' : '#ffffff');
    }
  }
  for (const p of g.props) if (p.kind === 'bridge') drawBridge(p, g);
  if (Wd.rail !== 'bridge') { drawRails(Wd, g, zn); return; }
  for (const sx of [-4.5, 4.5]) {
    ctx.strokeStyle = '#c4372c'; ctx.lineCap = 'butt';
    const p0 = Math.ceil(zn / 1.6) * 1.6;
    for (let z = p0; z < view.camZ + 110; z += 1.6) {
      if (!proj(sx, 0, z, P0) || !proj(sx, 1.0, z, P1)) continue;
      ctx.lineWidth = Math.max(1, 0.09 * P0.s); ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y); ctx.stroke();
    }
    for (const [ya, yb] of [[0.92, 1.06], [0.46, 0.56]]) {
      ctx.beginPath(); let first = true;
      for (let z = zn; z <= view.camZ + 120; z += 3) { if (!proj(sx, yb, z, P0)) continue; if (first) { ctx.moveTo(P0.x, P0.y); first = false; } else ctx.lineTo(P0.x, P0.y); }
      for (let z = view.camZ + 120; z >= zn; z -= 3) { if (proj(sx, ya, z, P0)) ctx.lineTo(P0.x, P0.y); }
      ctx.closePath(); ctx.fillStyle = '#d8443a'; ctx.fill();
    }
  }
  ctx.strokeStyle = '#b8382d';
  for (const sx of [-TOWER_X, TOWER_X]) {
    const k0 = Math.floor((zn - 30) / TOWER_GAP);
    ctx.lineWidth = 2.6; ctx.beginPath();
    for (let k = k0; k < k0 + 4; k++) {
      const za = 30 + k * TOWER_GAP, mid = za + TOWER_GAP / 2; let first = true;
      for (let z = Math.max(za, zn); z <= Math.min(za + TOWER_GAP, zf); z += 2) {
        const y = 1.6 + (TOWER_TOP - 1.6) * Math.pow((z - mid) / (TOWER_GAP / 2), 2);
        if (!proj(sx, y, z, P0)) { first = true; continue; }
        if (first) { ctx.moveTo(P0.x, P0.y); first = false; } else ctx.lineTo(P0.x, P0.y);
      }
    }
    ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath();
    for (let z = Math.ceil(zn / 3) * 3; z < view.camZ + 100; z += 3) {
      const k = Math.floor((z - 30) / TOWER_GAP), mid = 30 + k * TOWER_GAP + TOWER_GAP / 2;
      const y = 1.6 + (TOWER_TOP - 1.6) * Math.pow((z - mid) / (TOWER_GAP / 2), 2);
      if (!proj(sx, y, z, P0) || !proj(sx, 1.0, z, P1)) continue;
      ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y);
    }
    ctx.stroke();
  }
}

function drawTower(z) {
  for (const sx of [-TOWER_X, TOWER_X]) {
    const inner = sx < 0 ? sx + 0.5 : sx - 0.5;
    wallX(inner, z, z + 1.1, -6, TOWER_TOP + 0.6, '#9b2f26');
    wallZ(sx - 0.5, sx + 0.5, -6, TOWER_TOP + 0.6, z, '#c63d31');
    if (proj(sx, TOWER_TOP + 0.6, z, P0)) { ctx.fillStyle = '#e0574a'; ctx.fillRect(P0.x - 0.5 * P0.s, P0.y, P0.s, Math.max(1, 0.25 * P0.s)); }
  }
  for (const y of [TOWER_TOP - 4.2, TOWER_TOP - 0.8]) {
    if (proj(-TOWER_X, y, z, P0) && proj(TOWER_X, y, z, P1) && proj(TOWER_X, y, z + 1.1, P2) && proj(-TOWER_X, y, z + 1.1, P3)) poly4('#8e2a22');
    wallZ(-TOWER_X, TOWER_X, y, y + 0.9, z, '#c63d31');
  }
}

function drawGate(gt, g) {
  const z = gt.z, top = 2.5, beam = 3.4;
  const age = gt.done ? g.time - gt.t : 0;
  const fade = gt.done ? clamp(1 - (age - 0.6) / 0.6, 0, 1) : 1;
  if (fade <= 0) return;
  ctx.globalAlpha = fade;
  for (let side = 0; side < 2; side++) {
    const isLeft = side === 0, x0 = isLeft ? -ROAD : 0.06, x1 = isLeft ? -0.06 : ROAD;
    let fill = 'rgba(70,165,255,0.45)';
    if (gt.done) fill = isLeft === gt.choseLeft ? (gt.ok ? 'rgba(40,200,105,0.7)' : 'rgba(235,65,55,0.7)') : 'rgba(70,165,255,0.2)';
    if (!wallZ(x0, x1, 0, top, z, fill, 'rgba(255,255,255,0.95)', 0)) continue;
    ctx.lineWidth = Math.max(1.5, 0.07 * P0.s); ctx.stroke();
    const w = P1.x - P0.x;
    if (!proj((x0 + x1) / 2, top * 0.52, z, P4)) continue;
    drawRich(isLeft === gt.left ? gt.p.a : gt.p.w, P4.x, P4.y, 1.25 * P4.s, '#ffffff', '#15233b', w * 0.86);
  }
  for (const px of [-ROAD - 0.12, 0, ROAD + 0.12]) wallZ(px - 0.12, px + 0.12, 0, beam, z, '#f1f3f6', '#15233b', 1);
  if (wallZ(-ROAD - 0.25, ROAD + 0.25, top + 0.05, beam, z, '#ffc531', '#15233b', 1.5) && proj(0, (top + beam) / 2 + 0.02, z, P4)) {
    const bw = P1.x - P0.x, bh = P0.y - P3.y;
    drawRich(gt.p.q, P4.x, P4.y, Math.min(bh * 0.62, 0.55 * P4.s), '#15233b', null, bw * 0.9);
    if (!gt.done && proj(ROAD - 0.3, beam + 0.55, z, P4)) {
      const fs = clamp(0.62 * P4.s, 10, 26);
      outlined('+' + gt.r, P4.x, P4.y, fs, '#4be08a', '#0d4a26');
    }
  }
  ctx.globalAlpha = 1;
}

// Number of hits still needed, and what you get, above a thing at the side of the road
function propLabels(p, g, top) {
  if (p.z - g.army.z > 48 || !proj(p.x, top, p.z, P4)) return;
  const s = P4.s;
  outlined(String(Math.ceil(p.hp)), P4.x, P4.y - 0.3 * s, clamp(0.7 * s, 12, 34), '#ffffff', '#15233b');
  const what = p.kind === 'cage' ? '+' + p.reward : g.weapon < MAX_WEAPON ? WEAPONS[g.weapon + 1].name : '+10';
  outlined(what, P4.x, P4.y - 0.95 * s, clamp(0.45 * s, 10, 22), p.kind === 'cage' || g.weapon >= MAX_WEAPON ? '#4be08a' : '#ffd23f', '#15233b');
}
// A cage with prisoners waving from inside: shoot it open and they join the army
function drawCage(p, g) {
  const x0 = p.x - 0.7, x1 = p.x + 0.7, z0 = p.z, z1 = p.z + 1.0, h = 1.5, lit = g.time - p.hit < 0.06;
  ground(x0, x1, z0, z1, 0.02, '#5b3d22');
  for (const [dx, dz] of [[-0.33, 0.55], [0.33, 0.6], [0, 0.3]]) {
    if (!proj(p.x + dx, 0.05, p.z + dz, P0)) continue;
    const hh = 0.95 * P0.s * 0.8, ww = hh * SW / SH;
    ctx.drawImage(armySprite(save.skin, ((g.time * 4 + dx * 9) | 0) & 3), P0.x - ww / 2, P0.y - hh, ww, hh);
  }
  if (proj(x0, h, z0, P0) && proj(x1, h, z0, P1) && proj(x1, h, z1, P2) && proj(x0, h, z1, P3)) poly4('rgba(120,86,52,0.92)', '#15233b', 1);
  ctx.strokeStyle = lit ? '#ffe28a' : '#8c96a3'; ctx.lineCap = 'round';
  for (let i = 0; i <= 6; i++) {
    const bx = x0 + (x1 - x0) * i / 6;
    if (!proj(bx, 0, z0, P0) || !proj(bx, h, z0, P1)) continue;
    ctx.lineWidth = Math.max(1.5, 0.08 * P0.s); ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.lineTo(P1.x, P1.y); ctx.stroke();
  }
  wallZ(x0, x1, h - 0.16, h, z0, lit ? '#ffe28a' : '#6b7480', '#15233b', 1);
  wallZ(x0, x1, 0, 0.14, z0, '#6b7480', '#15233b', 1);
  propLabels(p, g, h + 0.6);
}
// A crate with a better weapon inside
function drawCrate(p, g) {
  const x0 = p.x - 0.65, x1 = p.x + 0.65, z0 = p.z, z1 = p.z + 1.1, h = 1.2, lit = g.time - p.hit < 0.06;
  const side = view.camX < p.x ? x0 : x1;
  wallX(side, z0, z1, 0, h, lit ? '#a8c47a' : '#46602b');
  if (proj(x0, h, z0, P0) && proj(x1, h, z0, P1) && proj(x1, h, z1, P2) && proj(x0, h, z1, P3)) poly4(lit ? '#d4ec9e' : '#86a85a', '#15233b', 1);
  if (!wallZ(x0, x1, 0, h, z0, lit ? '#c4e08e' : '#5d7a3a', '#15233b', 1.5)) return;
  ctx.lineWidth = Math.max(1, 0.06 * P0.s);
  wallZ(x0 + 0.08, x1 - 0.08, h * 0.42, h * 0.58, z0, '#ffd23f', '#15233b', 1);
  if (proj(p.x, h * 0.5, z0, P4)) outlined('★', P4.x, P4.y, clamp(0.55 * P4.s, 10, 26), '#ffd23f', '#15233b');
  propLabels(p, g, h + 0.6);
}
// A broken piece of the road: every hit lays another plank; finished, it gives a power for the rest of the game
const PLANKS = 12;
function drawBridge(p, g) {
  if (p.done && !p.lost && g.time - p.doneAt > 3) { /* fully built, stays as a plain road */ }
  const x0 = p.x - PROP_W.bridge, x1 = p.x + PROP_W.bridge, z0 = p.z, z1 = p.z + BRIDGE_L;
  if (z1 < view.camZ + 1) return;
  const built = p.done && !p.lost ? PLANKS : Math.floor((1 - p.hp / p.max) * PLANKS);
  if (built < PLANKS) {
    const [h0, h1] = WORLDS[g.world].hole;
    ground(x0, x1, Math.max(z0, view.camZ + 1), z1, 0.012, h0);
    ground(x0 + 0.08, x1 - 0.08, Math.max(z0, view.camZ + 1), z1, 0.014, h1);
  }
  const pl = BRIDGE_L / PLANKS, lit = g.time - p.hit < 0.06;
  for (let i = 0; i < built; i++) {
    const za = z0 + i * pl + 0.05, zb = z0 + (i + 1) * pl - 0.05;
    if (zb < view.camZ + 1) continue;
    ground(x0 + 0.04, x1 - 0.04, za, zb, 0.03, i === built - 1 && lit ? '#ffd9a0' : i % 2 ? '#c58a4a' : '#b37a3d');
  }
  for (const ex of [x0, x1]) ground(ex - 0.05, ex + 0.05, Math.max(z0, view.camZ + 1), z1, 0.035, '#6b4424');
}
// Labels for a bridge (drawn above the soldiers): hits needed and the power it gives
function drawBridgeLabels(p, g) {
  if (p.done) return;
  if (!proj(p.x, 0.4, p.z + BRIDGE_L * 0.5, P4)) return;
  const s = P4.s;
  outlined(String(Math.ceil(p.hp)), P4.x, P4.y, clamp(0.8 * s, 12, 36), '#ffffff', '#15233b');
  if (proj(p.x, 0.6, p.z + BRIDGE_L + 0.2, P4)) bubble(P4.x, P4.y, POWERS[p.power].name, '#8a4fd6', clamp(0.42 * P4.s, 10, 18));
}

/* ---------- scenery beside the road in every world, drawn once as pictures ---------- */
const DECOR = {
  tree: { h: 5.2, xs: [5.6, 13], n: 2 }, pine: { h: 5.8, xs: [5.6, 13], n: 2 }, cactus: { h: 3.0, xs: [5.4, 9], n: 2 },
  rock: { h: 1.8, xs: [8.2, 14], n: 2 }, asteroid: { h: 2.2, xs: [6, 15], n: 2, float: true },
};
function makeDecor(kind, v) {
  const c = document.createElement('canvas'); c.width = 120; c.height = 180;
  const x = c.getContext('2d'); x.lineJoin = 'round'; x.lineCap = 'round'; x.lineWidth = 4; x.strokeStyle = '#15233b';
  const blob = (path, fill) => { x.beginPath(); path(); x.fillStyle = fill; x.fill(); x.stroke(); };
  if (kind === 'tree') {
    blob(() => rr(x, 52, 110, 16, 66, 5), '#7a4a26');
    const g1 = v ? '#4f9e3c' : '#62b348', g2 = v ? '#3b7f2e' : '#4b9638';
    blob(() => { x.arc(40, 90, 30, 0, 7); }, g2); blob(() => { x.arc(80, 88, 30, 0, 7); }, g2); blob(() => { x.arc(60, 55, 40, 0, 7); }, g1);
    x.fillStyle = 'rgba(255,255,255,0.25)'; x.beginPath(); x.arc(50, 40, 12, 0, 7); x.fill();
  } else if (kind === 'pine') {
    blob(() => rr(x, 54, 140, 12, 36, 4), '#6b4424');
    const green = v ? '#2f6f4a' : '#3d8158';
    for (const [y, w] of [[150, 52], [112, 42], [76, 32]]) {
      blob(() => { x.moveTo(60, y - 52); x.lineTo(60 + w, y); x.lineTo(60 - w, y); x.closePath(); }, green);
      x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(60, y - 52); x.lineTo(60 + w * 0.42, y - 30); x.lineTo(60 - w * 0.42, y - 30); x.closePath(); x.fill();
    }
  } else if (kind === 'cactus') {
    if (v) {   // a sandstone boulder
      blob(() => { x.moveTo(14, 176); x.quadraticCurveTo(10, 120, 50, 112); x.quadraticCurveTo(100, 104, 108, 176); x.closePath(); }, '#c98a4a');
      x.strokeStyle = '#a0662f'; x.beginPath(); x.moveTo(30, 150); x.lineTo(90, 146); x.stroke();
    } else {
      const g = '#4f9e3c';
      blob(() => rr(x, 46, 30, 28, 146, 14), g);
      blob(() => { rr(x, 14, 80, 20, 50, 10); }, g); blob(() => rr(x, 14, 116, 40, 18, 9), g);
      blob(() => { rr(x, 88, 60, 20, 56, 10); }, g); blob(() => rr(x, 66, 104, 42, 18, 9), g);
      x.strokeStyle = '#2f6f28'; x.lineWidth = 2; x.beginPath(); x.moveTo(60, 40); x.lineTo(60, 170); x.stroke();
    }
  } else if (kind === 'rock') {
    blob(() => { x.moveTo(8, 176); x.lineTo(22, 120); x.lineTo(58, 100); x.lineTo(100, 118); x.lineTo(114, 176); x.closePath(); }, v ? '#3a3030' : '#4a3d3b');
    x.strokeStyle = '#ff7a2a'; x.lineWidth = 3; x.beginPath(); x.moveTo(36, 170); x.lineTo(50, 140); x.lineTo(64, 150); x.lineTo(76, 124); x.stroke();
  } else if (kind === 'asteroid') {
    blob(() => { x.moveTo(20, 120); x.lineTo(30, 72); x.lineTo(70, 56); x.lineTo(104, 80); x.lineTo(108, 128); x.lineTo(70, 160); x.lineTo(32, 152); x.closePath(); }, v ? '#7d7f96' : '#9a93a8');
    x.fillStyle = 'rgba(21,35,59,0.35)'; for (const [cx, cy, r] of [[50, 96, 12], [80, 124, 9], [76, 84, 6]]) { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); }
  }
  return c;
}
const decorImg = {};
const decorSprite = (kind, v) => (decorImg[kind + v] = decorImg[kind + v] || makeDecor(kind, v));
const DECOR_STEP = 5;
// Lists the scenery near the camera for the far-to-near drawing
function listDecor(g) {
  const Wd = WORLDS[g.world];
  if (Wd.decor === 'building') return listBuildings();
  const D = DECOR[Wd.decor];
  if (!D) return;
  const k0 = Math.floor(view.camZ / DECOR_STEP);
  for (let k = k0; k < k0 + 34; k++) for (const sx of [-1, 1]) for (let j = 0; j < 2; j++) {
    const h = hash(k * 13.1 + sx * 3.7 + j * 29.3);
    if (h < 0.35) continue;
    const z = (k + hash(k * 7.7 + sx + j * 5.1)) * DECOR_STEP, x = sx * (D.xs[0] + (D.xs[1] - D.xs[0]) * hash(k * 3.3 + sx * 9.1 + j * 1.7));
    const y = D.float ? 1 + 2.5 * hash(k + j) + 0.3 * Math.sin(g.time + k) : 0;
    if (z < view.camZ + 1 || !proj(x, y, z, P0)) continue;
    if (P0.x < -150 || P0.x > view.w + 150) continue;
    const o = item(6, P0.d); o.x = P0.x; o.y = P0.y; o.s = P0.s * D.h * (0.8 + 0.4 * h); o.img = decorSprite(Wd.decor, (k + j) & 1);
  }
}
// City blocks with lit windows on both sides of the road
const BLOCK = 10;
function listBuildings() {
  const k0 = Math.floor(view.camZ / BLOCK);
  for (let k = k0; k < k0 + 17; k++) for (const sx of [-1, 1]) {
    const z0 = k * BLOCK + 1, z1 = z0 + 6 + 2 * hash(k * 5 + sx), xi = sx * 6.2;
    if (z1 < view.camZ + 1 || !proj(xi, 0, Math.max(z0, view.camZ + 1.2), P0)) continue;
    const o = item(7, P0.d); o.sx = sx; o.z0 = z0; o.z1 = z1; o.bk = k;
    o.h = 6 + 18 * hash(k * 11.3 + sx * 2.1); o.w = 4 + 3 * hash(k * 2.9 + sx);
  }
}
function drawBuilding(o) {
  const { sx, z1, h, w } = o, z0 = Math.max(o.z0, view.camZ + 1.2), xi = sx * 6.2, xo = sx * (6.2 + w);
  const tone = 30 + Math.round(20 * hash(o.bk * 1.7 + sx)), wall = `rgb(${tone},${tone + 8},${tone + 34})`, front = `rgb(${tone + 14},${tone + 22},${tone + 50})`;
  wallX(xi, z0, z1, 0, h, wall);
  if (h < CAM_H && proj(xi, h, z0, P0) && proj(xo, h, z0, P1) && proj(xo, h, z1, P2) && proj(xi, h, z1, P3)) poly4(`rgb(${tone + 24},${tone + 30},${tone + 58})`);
  wallZ(Math.min(xi, xo), Math.max(xi, xo), 0, h, z0, front);
  // windows on the side facing the road
  for (let r = 1.2; r < h - 0.8; r += 1.7) for (let zz = z0 + 0.6; zz < z1 - 0.5; zz += 1.5) {
    if (hash(o.bk * 97 + r * 13 + zz * 7 + sx) < 0.45) continue;
    if (!proj(xi, r, zz, P0) || !proj(xi, r + 0.8, zz + 0.7, P1)) continue;
    ctx.fillStyle = hash(r * 3 + zz) > 0.3 ? '#ffd86e' : '#9fd8ff';
    ctx.fillRect(Math.min(P0.x, P1.x), P1.y, Math.max(1, Math.abs(P1.x - P0.x)), Math.max(1, P0.y - P1.y));
  }
}

/* ---------- drawing list sorted far to near ---------- */
const pool = []; let pn = 0; const order = [];
function item(kind, d) { let o = pool[pn]; if (!o) o = pool[pn] = {}; pn++; o.k = kind; o.d = d; return o; }
const byDepth = (p, q) => q.d - p.d;

function addSoldier(team, x, z, frame, sc) {
  if (!proj(x, 0, z, P0)) return;
  if (P0.y > view.h + 80 || P0.y < -80 || P0.x < -60 || P0.x > view.w + 60) return;
  const o = item(0, P0.d); o.team = team; o.x = P0.x; o.y = P0.y; o.s = P0.s * sc; o.f = frame;
  const rx = 0.34 * P0.s * sc, ry = 0.14 * P0.s * sc;
  ctx.moveTo(P0.x + rx, P0.y); ctx.ellipse(P0.x, P0.y, rx, ry, 0, 0, Math.PI * 2);
}

function drawEntities(g) {
  pn = 0;
  const a = g.army, t = g.time, moving = g.state === 'run' || g.state === 'won' || g.attract;
  ctx.beginPath();     // collects ground shadows while soldiers are listed
  const an = Math.min(a.n, CAP), sq = squeeze(a.n), big = g.giant ? 1.35 : 1;
  for (let i = 0; i < an; i++) {
    const age = t - a.born[i];
    const sc = (age < 0.35 ? Math.max(0.05, backOut(age / 0.35)) : 1) * big;
    addSoldier(0, clamp(a.x + OX[i] * sq * big, -3.95, 3.95), a.z + OZ[i] * big, moving ? ((t * 9 + i * 0.73) | 0) & 3 : ((t * 3 + i) | 0) & 1, sc);
  }
  for (const s of g.squads) {
    for (const m of s.men) addSoldier(m.big ? 2 : 1, s.x + m.ox, s.z + m.oz, s.active ? ((t * 6 + m.ph) | 0) & 3 : 0, m.big ? 1.75 : 1.15);
  }
  ctx.fillStyle = 'rgba(10,30,50,0.22)'; ctx.fill();

  for (const gt of g.gates) if (gt.z > view.camZ + 1 && gt.z < view.camZ + 170 && proj(0, 0, gt.z, P0)) { const o = item(2, P0.d); o.r = gt; }
  for (const p of g.props) if (!p.done && p.kind !== 'bridge' && proj(p.x, 0, p.z, P0)) { const o = item(3, P0.d); o.r = p; }
  const M = g.monster;
  if (M && M.z < view.camZ + 175 && proj(M.x, 0, M.z, P0)) { const o = item(5, P0.d); o.x = P0.x; o.y = P0.y; o.s = P0.s; }
  if (WORLDS[g.world].rail === 'bridge') {
    const k0 = Math.floor((view.camZ - 30) / TOWER_GAP);
    for (let k = k0; k < k0 + 3; k++) { const z = 30 + k * TOWER_GAP; if (z > view.camZ + 1 && proj(0, 0, z, P0)) { const o = item(4, P0.d); o.z = z; } }
  } else listDecor(g);

  order.length = pn; for (let i = 0; i < pn; i++) order[i] = pool[i];
  order.sort(byDepth);
  for (const o of order) {
    if (o.k === 0) {
      const h = 0.95 * o.s, w = h * SW / SH;
      ctx.drawImage(o.team === 0 ? armySprite(save.skin, o.f) : ZOMB[o.team - 1][o.f], o.x - w / 2, o.y - h, w, h);
    } else if (o.k === 2) drawGate(o.r, g);
    else if (o.k === 3) (o.r.kind === 'cage' ? drawCage : drawCrate)(o.r, g);
    else if (o.k === 4) drawTower(o.z);
    else if (o.k === 6) { const w = o.s * 120 / 180; ctx.drawImage(o.img, o.x - w / 2, o.y - o.s, w, o.s); }
    else if (o.k === 7) drawBuilding(o);
    else if (o.k === 5) drawMonster(g.monster, g, o);
  }
}

function bubble(x, y, text, fill, size) {
  ctx.font = `${size}px ${FD}`;
  const tw = ctx.measureText(text).width, pw = tw + size * 0.95, ph = size * 1.32;
  ctx.beginPath(); rr(ctx, x - pw / 2, y - ph / 2, pw, ph, ph / 2);
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = Math.max(2, size * 0.13); ctx.strokeStyle = '#ffffff'; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + size * 0.06);
}

function drawMonsterBar(g) {
  const M = g.monster;
  if (!M || M.dead || M.z > view.camZ + 120) return;
  const T = MONSTERS[M.kind];
  if (!proj(M.x, MON_H * T.size + 0.9, M.z, P0)) return;
  const w = clamp(5.2 * P0.s, 90, view.w - 40), h = clamp(0.42 * P0.s, 8, 16), x = P0.x - w / 2, y = Math.max(view.topY - 14, P0.y);
  const fs = clamp(0.55 * P0.s, 12, 22);
  outlined(T.name, P0.x, y - h - fs * 0.55, fs, '#ffffff', '#15233b');
  ctx.beginPath(); rr(ctx, x - 2, y - h / 2 - 2, w + 4, h + 4, h); ctx.fillStyle = '#15233b'; ctx.fill();
  const k = M.hp / M.max;
  if (k > 0) { ctx.beginPath(); rr(ctx, x, y - h / 2, Math.max(h, w * k), h, h / 2); ctx.fillStyle = k > 0.5 ? '#3ad06e' : k > 0.25 ? '#ffc531' : '#ff4d40'; ctx.fill(); }
  if (h >= 12) { ctx.font = `${h * 0.95}px ${FD}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.fillText(group(Math.ceil(M.hp)), P0.x, y + 1); }
  // damage of the last volley, rising from the bar
  for (let i = hitTexts.length - 1; i >= 0; i--) {
    const f = hitTexts[i]; f.t += hitDt;
    if (f.t > 1.1) { hitTexts.splice(i, 1); continue; }
    ctx.globalAlpha = clamp(1.6 - f.t * 1.5, 0, 1);
    outlined(f.text, P0.x + w * 0.3, y + 56 - f.t * 30, 30, '#ffe066', '#15233b');
    ctx.globalAlpha = 1;
  }
}

/* ---------- effects ---------- */
const parts = [], floats = [], confetti = [], rings = [], balls = [], hitTexts = [];
let hitDt = 0;
const fx = { flash: 0, flashColor: '0,0,0', shake: 0 };
function burst(x, z, colors, n, y) {
  if (parts.length > 600) return;
  for (let i = 0; i < n; i++) parts.push({ x, y: y || 0.5, z, vx: rand(-2.5, 2.5), vy: rand(2, 5.5), vz: rand(-2, 2.5), t: 0, max: rand(0.35, 0.65), c: pick(colors), sz: rand(0.08, 0.16) });
}
function floatText(text, color) { floats.push({ text, color, t: 0 }); }
function confettiBurst() {
  if (REDUCED) return;
  const cols = ['#ffc531', '#2f7df6', '#e5463b', '#1f9d55', '#ffffff', '#8a4fd6'];
  for (let i = 0; i < 150; i++) confetti.push({ x: rand(0, view.w), y: rand(-view.h * 0.4, -10), vx: rand(-40, 40), vy: rand(120, 260), r: rand(0, 6), vr: rand(-6, 6), c: pick(cols), w: rand(6, 11), h: rand(3, 6) });
}

// Shots look different for every weapon: glow colour, core colour, thickness and length
const SHOT_FX = [
  ['rgba(255,170,40,0.55)', 'rgba(255,245,190,1)', 0.26, 1.0],
  ['rgba(255,110,30,0.6)', 'rgba(255,230,170,1)', 0.3, 1.2],
  ['rgba(255,60,200,0.6)', 'rgba(255,215,250,1)', 0.34, 1.3],
  ['rgba(255,50,40,0.65)', 'rgba(255,225,200,1)', 0.42, 1.2],
  ['rgba(40,220,255,0.65)', 'rgba(220,255,255,1)', 0.3, 2.2],
];
function drawEffects(g, dt) {
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  const [glow, core, thick, len] = SHOT_FX[g.weapon], fat = g.giant ? 1.35 : 1;
  for (const b of g.bullets) {
    if (!proj(b.x, 0.55 * fat, b.z, P0) || !proj(b.x, 0.55 * fat, b.z - len, P1)) continue;
    ctx.strokeStyle = glow; ctx.lineWidth = Math.max(3, thick * fat * P0.s);
    ctx.beginPath(); ctx.moveTo(P1.x, P1.y); ctx.lineTo(P0.x, P0.y); ctx.stroke();
    ctx.strokeStyle = core; ctx.lineWidth = Math.max(1.2, thick * 0.4 * fat * P0.s); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  // shock waves from the monster's stomp
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i]; r.t += dt;
    if (r.t > 0.6) { rings.splice(i, 1); continue; }
    if (!proj(r.x, 0.05, r.z, P0)) continue;
    const k = r.t / 0.6, rad = (1 + k * r.size) * P0.s;
    ctx.globalAlpha = 1 - k; ctx.strokeStyle = r.c; ctx.lineWidth = Math.max(2, 0.3 * P0.s * (1 - k));
    ctx.beginPath(); ctx.ellipse(P0.x, P0.y, rad, rad * 0.42, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
  }
  // fireballs thrown after a wrong answer
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i]; b.t += dt;
    const k = b.t / 0.55;
    if (k >= 1) { balls.splice(i, 1); continue; }
    const x = b.x0 + (b.x1 - b.x0) * k, z = b.z0 + (b.z1 - b.z0) * k, y = 3.2 + 2.5 * Math.sin(k * Math.PI) - 2.7 * k;
    if (!proj(x, y, z, P0)) continue;
    const rad = Math.max(6, 0.55 * P0.s);
    const grd = ctx.createRadialGradient(P0.x, P0.y, 0, P0.x, P0.y, rad * 1.6);
    grd.addColorStop(0, '#fff6c2'); grd.addColorStop(0.35, '#ffb02e'); grd.addColorStop(1, 'rgba(255,60,20,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(P0.x, P0.y, rad * 1.6, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.t += dt;
    if (p.t > p.max) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
    p.vy -= 14 * dt; p.x += p.vx * dt; p.y = Math.max(0, p.y + p.vy * dt); p.z += p.vz * dt;
    if (!proj(p.x, p.y, p.z, P0)) continue;
    const s = p.sz * P0.s * (1 - p.t / p.max * 0.5);
    ctx.fillStyle = p.c; ctx.fillRect(P0.x - s / 2, P0.y - s / 2, s, s);
  }
  const a = g.army;
  if (g.state === 'run') {
    for (const s of g.squads) {
      if (!s.men.length || s.z - a.z > 48) continue;
      const small = s.men.filter(m => !m.big).length;
      if (small && proj(s.x, 1.9, s.z + 0.3, P0) && P0.y > view.hudBottom) bubble(P0.x, P0.y, String(small), '#4f8a33', clamp(0.55 * P0.s, 13, 22));
      for (const m of s.men) if (m.big && proj(s.x + m.ox, 3.0, s.z + m.oz, P0) && P0.y > view.hudBottom) bubble(P0.x, P0.y, String(Math.ceil(m.hp)), '#7a4a2a', clamp(0.5 * P0.s, 12, 20));
    }
    for (const p of g.props) if (p.kind === 'bridge' && p.z - a.z < 48) drawBridgeLabels(p, g);
  }
  hitDt = dt; drawMonsterBar(g);
  if (a.n > 0 && proj(a.x, 1.75 * (g.giant ? 1.35 : 1), a.z + radius(a.n) * 0.55, P0)) {
    bubble(P0.x, P0.y, String(a.n), SKINS[save.skin].c[0], 24);
    if (!g.attract) {
      const tags = [WEAPONS[g.weapon].name, g.giant && POWERS.giant.name, g.turbo && POWERS.turbo.name].filter(Boolean).join(' · ');
      ctx.globalAlpha = 0.95; outlined(tags, P0.x, P0.y + 26, 14, '#ffffff', '#15233b'); ctx.globalAlpha = 1;
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i]; f.t += dt;
      if (f.t > 1.1) { floats.splice(i, 1); continue; }
      ctx.globalAlpha = clamp(1.6 - f.t * 1.5, 0, 1);
      outlined(f.text, P0.x + 56, P0.y - 18 - f.t * 70, 34, f.color, '#15233b');
      ctx.globalAlpha = 1;
    }
  } else floats.length = 0;
  const fall = WORLDS[g.world].fall;
  if (fall && !REDUCED) {
    const t = g.time, W = view.w, H = view.h, snow = fall === 'snow';
    for (let i = 0; i < 46; i++) {
      const sp = snow ? 30 + 40 * hash(i * 1.3) : -(20 + 40 * hash(i * 1.3));
      const x = ((hash(i * 2.1) * W + Math.sin(t * 0.8 + i) * 18) % W + W) % W, y = ((hash(i * 3.7) * H + t * sp) % H + H) % H;
      ctx.globalAlpha = snow ? 0.85 : 0.5 + 0.5 * Math.sin(t * 6 + i);
      ctx.fillStyle = snow ? '#ffffff' : (i % 2 ? '#ffb02e' : '#ff5a14');
      ctx.beginPath(); ctx.arc(x, y, snow ? 1.5 + 2 * hash(i) : 1.2 + 1.3 * hash(i), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (fx.flash > 0) {
    fx.flash = Math.max(0, fx.flash - dt * 2.2);
    const grd = ctx.createRadialGradient(view.w / 2, view.h / 2, view.h * 0.25, view.w / 2, view.h / 2, view.h * 0.75);
    grd.addColorStop(0, `rgba(${fx.flashColor},0)`); grd.addColorStop(1, `rgba(${fx.flashColor},${0.55 * fx.flash})`);
    ctx.fillStyle = grd; ctx.fillRect(0, 0, view.w, view.h);
  }
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i]; c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt;
    if (c.y > view.h + 20) { confetti.splice(i, 1); continue; }
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.r); ctx.fillStyle = c.c; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h); ctx.restore();
  }
}

function render(g, dt) {
  const a = g.army;
  updateCamera(g.state === 'fight' || (g.state === 'lost' && !!g.fight), dt);
  view.camX += (a.x * 0.35 - view.camX) * Math.min(1, dt * 6);
  view.camZ = a.z - CAM_BACK;
  if (fx.shake > 0 && !REDUCED) { fx.shake = Math.max(0, fx.shake - dt); const m = 18 * fx.shake; view.sx = rand(-m, m); view.sy = rand(-m, m); }
  else { view.sx = 0; view.sy = 0; }
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  drawBackdrop(g);
  drawEntities(g);
  drawEffects(g, dt);
}

/* ============================================================
   Screens, HUD and controls
   ============================================================ */
const $ = id => document.getElementById(id);
const screens = { menu: $('scrMenu'), levels: $('scrLevels'), intro: $('scrIntro'), pause: $('scrPause'), result: $('scrResult'), lesson: $('scrLesson'), armory: $('scrArmory') };
const hud = $('hud'), probCard = $('probCard'), probText = $('probText'), probSub = $('probSub'), probTime = $('probTime'), probReward = $('probReward');
const fight = $('fightPanel'), fqText = $('fqText'), fqSub = $('fqSub'), fqTime = $('fqTime'), ansL = $('ansL'), ansR = $('ansR');
const ICON = {
  star: on => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z" fill="${on ? '#ffc531' : '#e3d6bb'}" stroke="${on ? '#8a5a00' : '#cbbd9f'}" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" stroke="none"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
};

let game = createGame(save.next[0], save.next[1], true);
let mode = 'menu';            // menu | levels | intro | play | pause | lesson | result | armory
let pending = null;           // the stage shown on the intro card, started by "Start"
const ui = { shownGate: null, until: 0, lessonQ: null, music: null };
const stageLabel = (c, s) => `Level ${c + 1} · gra ${s + 1}`;
const solved = p => p.sol || (p.q.includes('?') ? p.q.replace('?', p.a) : /^x [<>≤≥]/.test(p.a) ? `${p.q}, więc ${p.a}` : `${p.q}, ${p.ask || 'x'} = ${p.a}`);

function show(name) { for (const k in screens) screens[k].hidden = k !== name; }
function goMenu() {
  mode = 'menu'; game = createGame(save.next[0], save.next[1], true); hud.hidden = true; fight.hidden = true; view.hudBottom = 0; layout();
  ui.lessonQ = null; lesson = null; $('stink').hidden = true;
  $('btnPlay').textContent = `Graj · ${stageLabel(save.next[0], save.next[1])}`;
  $('btnArmory').textContent = `Zbrojownia · ${group(save.gold)} złota`;
  $('menuVersion').textContent = `Wersja ${WERSJA}`;
  updateSoundBtns(); show('menu'); playMusic('menu', save.next[0]); Snd.duck(false);
}
function openIntro(c, s) {
  mode = 'intro'; pending = createGame(c, s, false, save.arm);
  const info = pending.cfg.info, M = MONSTERS[c];
  $('inWorld').textContent = `${stageLabel(c, s)} z ${STAGES} · ${WORLDS[pending.world].name}`;
  $('inTitle').textContent = info.name;
  $('inTopic').textContent = info.final ? 'Sprawdzian z całego levelu' : info.review ? 'Powtórka: wszystkie dotychczasowe tematy tego levelu' : `Stopień trudności ${info.tier} z 4`;
  $('inExample').innerHTML = richHTML(pending.gen().q);
  $('inMonster').textContent = M.name;
  $('inHp').textContent = group(pending.monster.max);
  $('inHint').textContent = c === 0 && s === 0
    ? 'Przesuwaj palcem w lewo i w prawo. Wbiegnij w bramkę z dobrym wynikiem.'
    : `${pending.cfg.gates} bramek. Każda daje tylu żołnierzy, ile pokazuje zielona liczba.`;
  show('intro');
}
function startStage(g) {
  game = g; mode = 'play'; pending = null;
  ui.shownGate = null; ui.until = 0; ui.lessonQ = null; lesson = null; $('stink').hidden = true;
  parts.length = 0; floats.length = 0; confetti.length = 0; rings.length = 0; balls.length = 0; hitTexts.length = 0;
  show(null); hud.hidden = false; fight.hidden = true; probCard.hidden = false; view.k = 0;
  $('hudLevel').textContent = stageLabel(g.cls, g.s);
  updGold(g);
  updateProblem(g, true);
  view.hudBottom = probCard.getBoundingClientRect().bottom;
  view.topY = $('hudTop').getBoundingClientRect().bottom + 56;
  layout();
  view.camX = 0;
  playMusic('run', g.cls); Snd.duck(false);
}
const restart = g => startStage(createGame(g.cls, g.s, false, save.arm));
function pauseGame() { if (mode !== 'play') return; mode = 'pause'; show('pause'); Snd.duck(true); }
function resumeGame() { if (mode !== 'pause') return; mode = 'play'; show(null); last = performance.now(); Snd.resume(); Snd.duck(false); }

function setCard(text, sub, cls, reward) {
  probText.innerHTML = richHTML(text);
  const len = plain(text).length;
  probText.classList.toggle('long', len > 13 && len <= 22);
  probText.classList.toggle('xlong', len > 22);
  probSub.innerHTML = richHTML(sub || '');
  probReward.textContent = reward ? '+' + reward : '';
  probReward.hidden = !reward;
  probCard.className = 'problem' + (cls ? ' ' + cls : '');
  void probCard.offsetWidth; probCard.classList.add('pop');
}
function updateProblem(g, force) {
  if (g.state !== 'run' || (g.time < ui.until && !force)) return;
  const next = g.gates.find(x => !x.done);
  if (next) {
    if (ui.shownGate !== next || force) {
      ui.shownGate = next;
      const hint = g.cls === 0 && g.s === 0 && next === g.gates[0] ? 'Przesuń palcem w stronę dobrej odpowiedzi' : next.p.sub;
      setCard(next.p.q, hint, '', next.r);
    }
    const i = g.gates.indexOf(next), from = (i ? g.gates[i - 1].z : 0) + g.cfg.speed;
    probTime.style.transform = `scaleX(${clamp((next.z - g.army.z) / (next.z - from), 0, 1)})`;
  } else if (ui.shownGate !== 'monster') {
    ui.shownGate = 'monster';
    setCard('Potwór!', `${MONSTERS[g.cls].name} czeka na końcu drogi`, 'boss', 0);
  }
}
function setFight(text, sub, cls) {
  fqText.innerHTML = richHTML(text);
  const len = plain(text).length;
  fqText.classList.toggle('long', len > 13 && len <= 22);
  fqText.classList.toggle('xlong', len > 22);
  fqSub.innerHTML = richHTML(sub || '');
  fight.className = 'fight' + (cls ? ' ' + cls : '');
  void fight.offsetWidth; fight.classList.add('pop');
}
function showFightProblem(g) {
  const f = g.fight;
  setFight(f.p.q, f.count === 1 && g.cls === 0 && g.s < 3 ? 'Stuknij w dobrą odpowiedź' : (f.p.sub || `Dobra odpowiedź: +${f.r} żołnierzy`), '');
  ansL.innerHTML = richHTML(f.left ? f.p.a : f.p.w);
  ansR.innerHTML = richHTML(f.left ? f.p.w : f.p.a);
  ansL.disabled = ansR.disabled = false;
  ansL.className = ansR.className = 'ans';
}
function pickAnswer(left) {
  if (mode !== 'play' || game.state !== 'fight' || !game.fight || game.fight.done) return;
  Snd.unlock();
  (left ? ansL : ansR).classList.add('picked');
  answerFight(game, left);
  handleEvents(game);
}

function onGate(g, e) {
  const p = e.gate.p;
  if (e.ok) {
    setCard('Dobrze!', `+${e.n} żołnierzy · +${GOLD.gate} złota`, 'good', 0); Snd.good(); Snd.coin();
    floatText('+' + e.n, '#4be08a'); fx.flash = 0.6; fx.flashColor = '40,210,110';
  } else {
    setCard(solved(p), `Twoja odpowiedź: ${p.w}`, 'bad', 0); Snd.bad();
    if (save.learn) ui.lessonQ = { p, your: p.w, at: g.time + 1.1 };
    if (e.n > 0) floatText(MINUS + e.n, '#ff6a5e');
    fx.flash = 0.8; fx.flashColor = '235,60,50'; fx.shake = 0.35;
  }
  ui.until = g.time + 1.0;
  updGold(g);
}

const WOOD = ['#c07a33', '#6b4424', '#ffd27a'], ZGREEN = ['#93d36c', '#4f8a33', '#7b5fb8'];
const updGold = g => { $('hudGold').textContent = group(g.gold); };
function handleEvents(g) {
  const a = g.army, M = g.monster;
  for (const e of g.events) {
    switch (e.type) {
      case 'gate': onGate(g, e); break;
      case 'kill':
        if (e.big) { burst(e.x, e.z, ZGREEN, 22, 1.2); floatText('+' + GOLD.brute + ' złota', '#ffd23f'); Snd.thud(); updGold(g); }
        else { burst(e.x, e.z, ZGREEN, 5); Snd.pop(); }
        break;
      case 'clash':
        burst(e.x, e.z, ZGREEN, 3); burst(e.x, e.z, SKINS[save.skin].c, 3); Snd.pop();
        if (e.big) { floatText(MINUS + e.n, '#ff6a5e'); fx.shake = 0.3; Snd.thud(); }
        break;
      case 'horde': Snd.groan(); break;
      case 'spark': if (Math.random() < 0.5) burst(e.x, e.z, ['#fff2a8', '#ffb02e', MONSTERS[g.cls].light], 2, rand(1.5, 4.5)); Snd.shot(); break;
      case 'cage': burst(e.x, e.z, ['#8c96a3', '#c9d1db', '#ffffff'], 18, 0.8); floatText('+' + e.n, '#4be08a'); Snd.freed(); break;
      case 'weapon':
        burst(e.x, e.z, ['#ffd23f', '#86a85a', '#ffffff'], 24, 0.8); floatText(e.name + '!', '#ffd23f');
        Snd.power(); fx.flash = 0.5; fx.flashColor = '255,210,60';
        break;
      case 'power':
        burst(e.x, e.z, ['#c9a2ff', '#ffd23f', '#ffffff'], 30, 0.6); floatText(e.name + '!', '#d6b8ff');
        Snd.power(); Snd.reinforce(); fx.flash = 0.6; fx.flashColor = '160,90,255';
        break;
      case 'smash':
        if (e.kind === 'bridge') { burst(e.x, e.z + 1, WORLDS[g.world].splash, 26, 0.2); Snd.splash(); }
        else burst(e.x, e.z, WOOD, 16);
        if (e.n > 0) floatText(MINUS + e.n, '#ff6a5e');
        Snd.bad(); fx.shake = 0.25;
        break;
      case 'fight':
        probCard.hidden = true; fight.hidden = false;
        setFight('Walka!', 'Każda odpowiedź to runda: armia strzela, potem atakuje potwór.', 'boss');
        ansL.innerHTML = ansR.innerHTML = '…'; ansL.disabled = ansR.disabled = true;
        view.fightY = fight.getBoundingClientRect().top - 14;
        playMusic('fight', g.cls); Snd.roar(); fx.shake = 0.3;
        break;
      case 'fightProblem': showFightProblem(g); break;
      case 'fightAnswer':
        ansL.disabled = ansR.disabled = true;
        (g.fight.left ? ansL : ansR).classList.add('right');
        updGold(g);
        if (e.ok) { setFight('Dobrze!', `Posiłki: +${e.r} · +${GOLD.fight} złota`, 'good'); Snd.reinforce(); floatText('+' + e.r, '#4be08a'); fx.flash = 0.5; fx.flashColor = '40,210,110'; }
        else {
          setFight(solved(e.p), e.timeout ? 'Za późno! Potwór atakuje' : `Twoja odpowiedź: ${e.p.w}`, 'bad');
          Snd.bad(); Snd.roar();
          if (save.learn) ui.lessonQ = { p: e.p, your: e.timeout ? null : e.p.w, at: g.time + 1.5 };
        }
        break;
      case 'volley': if (e.n > 0) { hitTexts.push({ text: MINUS + group(e.n), t: 0 }); Snd.hit(); } break;
      case 'growl':
        Snd.growl();
        if (e.fire) balls.push({ t: 0, x0: M.x, z0: M.z - 1.5, x1: a.x, z1: a.z });
        break;
      case 'stomp':
        rings.push({ x: M.x, z: M.z - 2, t: 0, size: 9, c: 'rgba(255,255,255,0.9)' });
        if (e.n > 0) { floatText(MINUS + e.n, '#ff6a5e'); burst(a.x, a.z + radius(a.n) * 0.6, SKINS[save.skin].c, 10); }
        Snd.stomp(); fx.shake = 0.3;
        break;
      case 'blast':
        rings.push({ x: a.x, z: a.z, t: 0, size: 3, c: 'rgba(255,170,40,0.95)' });
        burst(a.x, a.z, ['#ffb02e', '#ff5a2a', '#fff2a8'], 18, 1); burst(a.x, a.z, SKINS[save.skin].c, 10);
        if (e.n > 0) floatText(MINUS + e.n, '#ff6a5e');
        Snd.boom(); fx.flash = 0.8; fx.flashColor = '235,60,50'; fx.shake = 0.45;
        break;
      case 'won':
        Snd.stop(); Snd.win(); confettiBurst();
        if (M) for (let i = 0; i < 4; i++) burst(M.x + rand(-2, 2), M.z, [MONSTERS[g.cls].body, MONSTERS[g.cls].light, '#ffffff'], 16, rand(1, 6));
        if (g.fight) { setFight('Wygrana!', `${MONSTERS[g.cls].name} pokonany`, 'good'); ansL.disabled = ansR.disabled = true; }
        else setCard('Wygrana!', 'Potwór pokonany', 'good', 0);
        break;
      case 'lost':
        Snd.stop(); Snd.boo(); stinkShow();          // "buuuu" and the joke the children asked for
        if (g.fight) { setFight('Przegrana', `${MONSTERS[g.cls].name} był silniejszy`, 'bad'); ansL.disabled = ansR.disabled = true; }
        else setCard('Przegrana', 'Wrogowie mieli przewagę', 'bad', 0);
        break;
    }
  }
  g.events.length = 0;
}

/* ============================================================
   After a mistake: how to calculate it in your head, then practice of the same kind
   ============================================================ */
const NEED = 2, MAX_TASKS = 5;   // 2 good answers to go back to the game; at most 5 tries
let lesson = null;
const le = {
  card: $('leCard'), eyebrow: $('leEyebrow'), solved: $('leSolved'), your: $('leYour'), title: $('leTitle'), steps: $('leSteps'),
  task: $('leTask'), q: $('leQ'), sub: $('leSub'), L: $('leL'), R: $('leR'), msg: $('leMsg'), next: $('leNext'),
};
// "{…}" in a step is a calculation, shown in bold
const stepHTML = s => s.split(/(\{[^}]*\})/).map(x => x[0] === '{' ? `<b class="calc${plain(x).length < 20 ? ' nw' : ''}">${richHTML(x.slice(1, -1))}</b>` : richHTML(x)).join('');
function showSteps(how) {
  le.title.textContent = how.t;
  le.steps.innerHTML = how.s.map(x => `<li><span>${stepHTML(x)}</span></li>`).join('');
}
function setMsg(html, cls) { le.msg.innerHTML = html; le.msg.className = 'le-msg' + (cls ? ' ' + cls : ''); le.msg.hidden = !html; }
const later = (sec, fn) => { const L = lesson; setTimeout(() => { if (lesson === L && mode === 'lesson') fn(); }, sec * 1000); };

function openLesson(p, your) {
  const tasks = p.how ? Z.practice(p, MAX_TASKS) : [];
  if (tasks.length < NEED) return;   // nothing to practise: keep playing
  lesson = { tasks, n: 0, good: 0, bad: 0, cur: null, left: true, busy: false, panels: [hud.hidden, fight.hidden] };
  mode = 'lesson'; Snd.duck(true);
  hud.hidden = fight.hidden = true;   // the problem behind the card would only confuse
  le.eyebrow.textContent = 'Jak to policzyć w pamięci?';
  le.solved.innerHTML = richHTML(solved(p)); le.solved.hidden = false;
  le.your.innerHTML = your === null ? 'Zabrakło czasu' : richHTML(`Twoja odpowiedź: ${your}`); le.your.hidden = false;
  showSteps(p.how);
  le.task.hidden = true; setMsg('');
  le.next.textContent = `Ćwiczymy: ${NEED} zadania`; le.next.hidden = false;
  show('lesson'); le.card.scrollTop = 0;
}
function nextTask() {
  const L = lesson, t = L.cur = L.tasks[L.n++];
  L.left = Math.random() < 0.5; L.busy = false;
  le.eyebrow.textContent = `Ćwiczenie ${L.good + 1} z ${NEED}`;
  le.solved.hidden = le.your.hidden = true;
  le.q.innerHTML = richHTML(t.q);
  const len = plain(t.q).length;
  le.q.classList.toggle('long', len > 13 && len <= 22); le.q.classList.toggle('xlong', len > 22);
  le.sub.innerHTML = richHTML(t.sub || ''); le.sub.hidden = !t.sub;
  le.L.innerHTML = richHTML(L.left ? t.a : t.w); le.R.innerHTML = richHTML(L.left ? t.w : t.a);
  le.L.className = le.R.className = 'ans'; le.L.disabled = le.R.disabled = false;
  le.task.hidden = false; setMsg(''); le.next.hidden = true;
  le.card.scrollTop = le.card.scrollHeight;
}
function lessonPick(left) {
  const L = lesson;
  if (!L || !L.cur || L.busy || le.task.hidden) return;
  Snd.unlock();
  L.busy = true; le.L.disabled = le.R.disabled = true;
  (left ? le.L : le.R).classList.add('picked');
  (L.left ? le.L : le.R).classList.add('right');
  if (left === L.left) {
    L.good++; Snd.good(); Snd.coin();
    game.gold += GOLD.practice; updGold(game);     // practice after a mistake earns gold too
    const gold = `<small>+${GOLD.practice} złota</small>`;
    if (L.good < NEED) { setMsg('Dobrze!' + gold, 'good'); later(0.9, nextTask); }
    else { setMsg((L.bad ? 'Dobrze! Już umiesz. Grasz dalej.' : 'Super! Grasz dalej.') + gold, 'good'); Snd.reinforce(); later(1.4, closeLesson); }
  } else {
    L.bad++; Snd.bad(); shakeCard();
    const out = L.n >= L.tasks.length;
    setMsg(`Prawie!<small>${richHTML(`Dobra odpowiedź: ${L.cur.a}`)}${out ? '. Ten temat warto jeszcze poćwiczyć.' : '. Spójrz, jak to policzyć.'}</small>`, 'bad');
    showSteps(L.cur.how);
    le.next.textContent = out ? 'Wracamy do gry' : 'Jeszcze jedno zadanie'; le.next.hidden = false;
  }
  le.card.scrollTop = le.card.scrollHeight;
}
function lessonNext() {
  if (!lesson || mode !== 'lesson') return;
  if (lesson.cur && lesson.n >= lesson.tasks.length) closeLesson(); else nextTask();
}
function closeLesson() {
  [hud.hidden, fight.hidden] = lesson.panels;
  lesson = null; mode = 'play'; show(null); last = performance.now(); Snd.duck(false);
}
function shakeCard() { if (!REDUCED) { le.card.classList.remove('shake'); void le.card.offsetWidth; le.card.classList.add('shake'); } }

/* ============================================================
   Armoury: permanent upgrades and army colours, bought with gold earned by playing
   ============================================================ */
const COIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#ffc531" stroke="#8a5a00" stroke-width="2"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#d99300" stroke-width="2"/></svg>';
let armoryBack = 'menu';
const armoryNow = {
  weapon: L => `Teraz: ${WEAPONS[L].name}.` + (L < ARMORY.weapon.prices.length ? ` Następna: ${WEAPONS[L + 1].name}.` : ' Każda skrzynia w grze da jeszcze lepszą.'),
  army: L => `Na start: ${START + ARMORY.army.per * L} żołnierzy` + (L < ARMORY.army.prices.length ? `, potem ${START + ARMORY.army.per * (L + 1)}.` : '.'),
  power: L => (L ? `Szybsze strzelanie: +${Math.round(100 * ARMORY.power.per * L)}%` : 'Każdy poziom: strzelanie szybsze o 10%') + (L && L < ARMORY.power.prices.length ? `, potem +${Math.round(100 * ARMORY.power.per * (L + 1))}%.` : '.'),
};
function openArmory(from) {
  armoryBack = from; mode = 'armory'; buildArmory(); show('armory');
  screens.armory.querySelector('.card').scrollTop = 0;
}
function buildArmory() {
  $('arGold').textContent = group(save.gold);
  const list = $('arList'); list.innerHTML = '';
  for (const key of Object.keys(ARMORY)) {
    const A = ARMORY[key], L = save.arm[key], max = L >= A.prices.length, price = max ? 0 : A.prices[L];
    const row = document.createElement('div'); row.className = 'ar-item';
    row.innerHTML = `<h3>${esc(A.name)}</h3><div class="pips">${A.prices.map((_, i) => `<i class="${i < L ? 'on' : ''}"></i>`).join('')}</div><p>${esc(armoryNow[key](L))}</p>`;
    const b = document.createElement('button'); b.className = 'buy';
    b.innerHTML = max ? 'Gotowe' : `${COIN}${group(price)}`;
    b.disabled = max || save.gold < price;
    b.setAttribute('aria-label', max ? `${A.name}: najwyższy poziom` : `Kup: ${A.name} za ${price} złota`);
    b.addEventListener('click', () => {
      if (save.gold < price || save.arm[key] >= A.prices.length) return;
      save.gold -= price; save.arm[key]++; persist(); Snd.unlock(); Snd.coin(); Snd.power(); buildArmory();
    });
    row.appendChild(b); list.appendChild(row);
  }
  const box = $('arSkins'); box.innerHTML = '';
  SKINS.forEach((K, i) => {
    const own = save.skins.includes(i), b = document.createElement('button');
    b.className = 'skin' + (save.skin === i ? ' on' : '');
    b.innerHTML = `<img alt="" src="${armySprite(i, 0).toDataURL()}"><span>${esc(K.name)}</span>` + (own ? '' : `<span class="price">${COIN}${K.price}</span>`);
    b.disabled = !own && save.gold < K.price;
    b.setAttribute('aria-pressed', String(save.skin === i));
    b.addEventListener('click', () => {
      if (!own) { if (save.gold < K.price) return; save.gold -= K.price; save.skins.push(i); Snd.coin(); }
      save.skin = i; persist(); Snd.unlock(); Snd.tap(); buildArmory();
    });
    box.appendChild(b);
  });
}
function closeArmory() {
  if (armoryBack === 'result') { mode = 'result'; showResultAgain(); } else goMenu();
}

// Lost: a green stink cloud and a big joke over the scene, until the result card
function stinkShow() {
  const el = $('stink');
  el.hidden = false; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
}
function showResult(g) {
  mode = 'result'; fight.hidden = true; $('stink').hidden = true;
  const won = g.state === 'won', c = g.cls, s = g.s;
  const ratio = g.answered ? g.correct / g.answered : 0;
  const stars = won ? (ratio === 1 ? 3 : ratio >= 0.75 ? 2 : 1) : 0;
  if (won) {
    save.stars[c * STAGES + s] = Math.max(starsOf(c, s), stars);
    save.next = s + 1 < STAGES ? [c, s + 1] : (c + 1 < NCLS ? [c + 1, 0] : [c, s]);
  } else save.next = [c, s];
  const gain = g.gold + (won ? stars * GOLD.star : 0);   // gold earned in the game is kept even after a loss
  save.gold += gain;
  persist();
  $('reGold').textContent = `+${group(gain)} · masz ${group(save.gold)}`;
  $('reLevel').textContent = `${stageLabel(c, s)} · ${g.cfg.info.name}`;
  $('reTitle').textContent = won ? 'Wygrana!' : 'Śmierdzi Ci spod pachy!!!';
  $('reStars').innerHTML = [0, 1, 2].map(i => ICON.star(i < stars)).join('');
  [...$('reStars').children].forEach((el, i) => el.classList.toggle('on', i < stars));
  $('reStars').hidden = !won;
  $('reNote').textContent = won
    ? (stars === 3 ? 'Wszystkie odpowiedzi dobre. Brawo!' : 'Bez pomyłek będą 3 gwiazdki.')
    : (g.fight ? 'W walce każda dobra odpowiedź to posiłki. Spróbuj jeszcze raz.' : 'Dobre odpowiedzi dają więcej żołnierzy. Spróbuj jeszcze raz.');
  $('reCorrect').textContent = `${g.correct} z ${g.answered}`;
  $('reArmy').textContent = String(g.army.n);
  const list = $('reList'); list.innerHTML = '';
  for (const m of g.mistakes.slice(0, 6)) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${richHTML(solved(m))}</strong><span></span>`;
    li.lastChild.innerHTML = m.w === null ? 'Za późno' : richHTML(`Twoja odpowiedź: ${m.w}`);
    list.appendChild(li);
  }
  $('reReview').hidden = g.mistakes.length === 0;
  const lastOne = c === NCLS - 1 && s === STAGES - 1;
  $('btnNext').hidden = !won;
  $('btnNext').textContent = lastOne ? 'Cała gra ukończona!' : s === STAGES - 1 ? `Level ${c + 2}` : 'Następna gra';
  $('btnNext').disabled = lastOne;
  show('result');
}
function showResultAgain() {
  $('reGold').textContent = $('reGold').textContent.replace(/masz [\d ]+/, `masz ${group(save.gold)}`);
  show('result');
}

function buildLevelList() {
  const tabs = $('classTabs'), box = $('levelList');
  tabs.innerHTML = '';
  Z.KLASY.forEach((K, c) => {
    const b = document.createElement('button');
    b.className = 'tab' + (c === save.tab ? ' on' : ''); b.textContent = String(c + 1);
    b.setAttribute('aria-label', `Level ${c + 1}`); b.setAttribute('aria-pressed', String(c === save.tab));
    b.addEventListener('click', () => { Snd.unlock(); Snd.tap(); save.tab = c; persist(); buildLevelList(); });
    tabs.appendChild(b);
  });
  const c = save.tab, K = Z.KLASY[c];
  const done = save.stars.slice(c * STAGES, c * STAGES + STAGES).filter(x => x > 0).length;
  $('lvClass').textContent = `Level ${c + 1}`;
  $('lvAbout').textContent = `${c + 1}. klasa · ${K.opis} · ukończone: ${done} z ${STAGES}`;
  box.innerHTML = '';
  K.tematy.forEach((tm, b) => {
    const sec = document.createElement('section'); sec.className = 'topic-row';
    sec.innerHTML = `<h3>${esc(tm.nazwa)}</h3><div class="grid5"></div>`;
    const grid = sec.querySelector('.grid5');
    for (let s = b * 5; s < b * 5 + 5; s++) {
      const info = Z.stage(c, s), btn = document.createElement('button');
      const isNext = save.next[0] === c && save.next[1] === s;
      btn.className = 'lvl' + (info.review ? ' rev' : '') + (isNext ? ' cur' : '');
      if (unlocked(c, s)) {
        btn.innerHTML = `<span>${s + 1}</span><span class="st">${[0, 1, 2].map(k => ICON.star(k < starsOf(c, s))).join('')}</span>`;
        btn.setAttribute('aria-label', `Gra ${s + 1}: ${info.name}, gwiazdki: ${starsOf(c, s)} z 3`);
        btn.addEventListener('click', () => { Snd.unlock(); Snd.tap(); openIntro(c, s); });
      } else { btn.disabled = true; btn.innerHTML = ICON.lock; btn.setAttribute('aria-label', `Gra ${s + 1}, zablokowana`); }
      grid.appendChild(btn);
    }
    box.appendChild(sec);
  });
}
// Music style: Auto picks by age (cheerful for levels 1–3, adventure for 4–6, electro for 7–8); the player may pick any
const styleFor = cls => { const m = save.musicStyle; return m === 'off' ? null : m !== 'auto' ? m : cls < 3 ? 'wesola' : cls < 6 ? 'przygoda' : 'elektro'; };
function playMusic(track, cls) { ui.music = { track, cls }; Snd.play(track, styleFor(cls)); }
function updateSoundBtns() {
  for (const [key, label] of [['sfx', 'Dźwięki'], ['learn', 'Nauka po błędzie']]) {
    for (const b of document.querySelectorAll(`[data-toggle="${key}"]`)) { b.textContent = `${label}: ${save[key] ? 'wł.' : 'wył.'}`; b.setAttribute('aria-pressed', String(save[key])); }
  }
  for (const b of document.querySelectorAll('[data-toggle="music"]')) {
    b.textContent = `Muzyka: ${MUSIC_STYLES[save.musicStyle]}`;
    b.setAttribute('aria-label', `Muzyka: ${MUSIC_STYLES[save.musicStyle]}. Stuknij, żeby zmienić styl.`);
  }
}
function toggle(key) {
  if (key === 'music') {      // the music button goes through the styles
    const keys = Object.keys(MUSIC_STYLES);
    save.musicStyle = keys[(keys.indexOf(save.musicStyle) + 1) % keys.length];
    save.music = save.musicStyle !== 'off';
    persist(); updateSoundBtns();
    Snd.unlock(); Snd.setMusic(save.music);
    if (ui.music) playMusic(ui.music.track, ui.music.cls);
    return;
  }
  save[key] = !save[key]; persist(); updateSoundBtns();
  if (save[key] && key !== 'learn') Snd.unlock();
}

const tap = (id, fn) => $(id).addEventListener('click', () => { Snd.unlock(); Snd.tap(); fn(); });
tap('btnPlay', () => openIntro(save.next[0], save.next[1]));
tap('btnLevels', () => { mode = 'levels'; save.tab = save.next[0]; buildLevelList(); show('levels'); });
tap('btnLevelsClose', goMenu);
for (const b of document.querySelectorAll('[data-toggle]')) b.addEventListener('click', () => { Snd.unlock(); toggle(b.dataset.toggle); Snd.tap(); });
tap('btnStart', () => startStage(pending));
tap('btnIntroBack', goMenu);
tap('btnPause', pauseGame);
tap('btnResume', resumeGame);
tap('btnRestart', () => restart(game));
tap('btnPauseMenu', goMenu);
tap('btnNext', () => { const [c, s] = save.next; openIntro(c, s); });
tap('btnAgain', () => restart(game));
tap('btnResultMenu', goMenu);
tap('btnArmory', () => openArmory('menu'));
tap('btnResultArmory', () => openArmory('result'));
tap('btnArmoryBack', closeArmory);
le.L.addEventListener('click', () => lessonPick(true));
le.R.addEventListener('click', () => lessonPick(false));
tap('leNext', lessonNext);
ansL.addEventListener('click', () => pickAnswer(true));
ansR.addEventListener('click', () => pickAnswer(false));

/* ============================================================
   How to add the game to the home screen: shown every time the game is opened in a phone browser
   (not when it already runs from the home screen), with pictures for iPhone and Android
   ============================================================ */
const UA = navigator.userAgent || '';
const IS_IOS = /iPhone|iPad|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_ANDROID = /Android/i.test(UA);
// browsers inside other apps (Messenger, Facebook, Instagram, TikTok…) cannot put a page on the home screen
const IN_APP = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|Line\/|TikTok|musical_ly|Snapchat|GSA\/|; wv\)/.test(UA);
const isStandalone = () => navigator.standalone === true ||
  (!!window.matchMedia && ['standalone', 'fullscreen', 'minimal-ui'].some(m => matchMedia(`(display-mode: ${m})`).matches));
const canOfferInstall = () => (IS_IOS || IS_ANDROID) && !isStandalone() && window.top === window;
let installEvent = null;      // Android Chrome: the system "install" window, if the phone offers it
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvent = e; $('instInstall').hidden = instOS !== 'android'; });
window.addEventListener('appinstalled', () => { installEvent = null; closeInstall(); $('btnInstallHelp').hidden = true; });

// Pictures: a phone screen with the button to tap circled in orange
const TAP = '#ff9f1a', INK = '#15233b', BLUEI = '#2f7df6', GREY = '#5f6b7d';
const pic = body => `<svg viewBox="0 0 260 140" aria-hidden="true"><rect width="260" height="140" rx="14" fill="#e8eef6"/>${body}</svg>`;
const dots = (x, y, vertical) => `<g fill="${INK}">${[-7, 0, 7].map(d => `<circle cx="${vertical ? x : x + d}" cy="${vertical ? y + d : y}" r="2.3"/>`).join('')}</g>`;
const ring = (x, y, r) => `<circle class="tap" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${TAP}" stroke-width="4"/>`;
const box = (x, y, w, h) => `<rect class="tap" x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="none" stroke="${TAP}" stroke-width="3.5"/>`;
const row = (y, label, icon, hi) => `${hi ? `<rect x="74" y="${y}" width="168" height="26" rx="8" fill="#fff3d6"/>` : ''}<text x="86" y="${y + 17}" font-size="12" fill="${INK}">${label}</text>${icon || ''}${hi ? box(72, y - 2, 172, 30) : ''}`;
const shareIcon = (x, y) => `<g fill="none" stroke="${BLUEI}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M${x} ${y + 2}v-12M${x - 4} ${y - 6}l4-4 4 4M${x - 6} ${y - 2}h-2v10h16v-10h-2"/></g>`;
const plusIcon = (x, y) => `<g fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"><rect x="${x - 7}" y="${y - 7}" width="14" height="14" rx="3"/><path d="M${x} ${y - 4}v8M${x - 4} ${y}h8"/></g>`;
const gameIcon = (x, y, s) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.24}" fill="#ffc531" stroke="${INK}" stroke-width="2"/><text class="disp" x="${x + s / 2}" y="${y + s * 0.62}" text-anchor="middle" font-size="${s * 0.34}" fill="${INK}">7·8</text>`;
const INSTALL = {
  ios: [
    ['Stuknij <b>⋯</b> (trzy kropki) obok adresu strony na dole ekranu. Jeśli od razu widzisz ikonę <b>Udostępnij</b> (kwadrat ze strzałką w górę), stuknij ją i przejdź do kroku 3.',
      pic(`<rect x="14" y="12" width="232" height="70" rx="10" fill="#fff"/><text class="disp" x="130" y="46" text-anchor="middle" font-size="20" fill="${INK}">Śmierdzipacha</text><text x="130" y="66" text-anchor="middle" font-size="10" fill="${GREY}">strona gry w Safari</text>
        <circle cx="34" cy="111" r="16" fill="#fff"/><path d="M38 103l-8 8 8 8" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
        <rect x="58" y="95" width="188" height="32" rx="16" fill="#fff" stroke="#cdd6e2"/><text x="72" y="115" font-size="11" fill="${INK}">jacekordowski.github.io</text>
        <circle cx="226" cy="111" r="12" fill="#e8eef6"/>${dots(226, 111)}${ring(226, 111, 18)}`)],
    ['Stuknij <b>Udostępnij</b>.',
      pic(`<rect x="70" y="12" width="176" height="116" rx="14" fill="#fff"/>${row(20, 'Nowa karta', plusIcon(228, 33))}${row(48, 'Dodaj zakładkę', '')}${row(76, 'Udostępnij', shareIcon(228, 93), true)}${row(104, 'Znajdź na stronie', '')}`)],
    ['Przewiń listę w dół i stuknij <b>Dodaj do ekranu początkowego</b>.',
      pic(`<rect x="14" y="12" width="232" height="116" rx="14" fill="#fff"/>${[40, 80, 120, 160, 200].map(x => `<circle cx="${x + 10}" cy="34" r="13" fill="#dfe6ef"/>`).join('')}
        <g transform="translate(-56 0)">${row(56, 'Kopiuj', '')}${row(84, 'Dodaj do ekranu początkowego', plusIcon(290, 97), true)}</g>
        <text x="30" y="128" font-size="11" fill="${GREY}">Dodaj do ulubionych…</text>`)],
    ['Zostaw włączone <b>Otwórz jako aplikację internetową</b> i stuknij <b>Dodaj</b> w prawym górnym rogu.',
      pic(`<rect x="14" y="12" width="232" height="116" rx="14" fill="#fff"/><text x="28" y="34" font-size="12" fill="${BLUEI}">Anuluj</text><text x="130" y="34" text-anchor="middle" font-size="12" fill="${INK}">Dodaj do ekranu</text>
        <text x="230" y="34" text-anchor="end" font-size="13" fill="${BLUEI}">Dodaj</text>${box(194, 18, 46, 24)}
        ${gameIcon(28, 50, 38)}<rect x="76" y="56" width="156" height="26" rx="8" fill="#eef2f7"/><text x="86" y="73" font-size="12" fill="${INK}">Śmierdzipacha</text>
        <text x="28" y="104" font-size="11" fill="${INK}">Otwórz jako aplikację</text><text x="28" y="119" font-size="11" fill="${INK}">internetową</text><rect x="196" y="98" width="36" height="20" rx="10" fill="#34c759"/><circle cx="222" cy="108" r="8" fill="#fff"/>`)],
  ],
  android: [
    ['W przeglądarce Chrome stuknij <b>⋮</b> (trzy kropki) w prawym górnym rogu.',
      pic(`<rect x="10" y="10" width="240" height="40" rx="10" fill="#fff"/><rect x="22" y="18" width="160" height="24" rx="12" fill="#eef2f7"/><text x="34" y="34" font-size="11" fill="${INK}">jacekordowski.github.io</text>
        <rect x="194" y="21" width="18" height="18" rx="4" fill="none" stroke="${INK}" stroke-width="2"/><text x="203" y="34" text-anchor="middle" font-size="10" fill="${INK}">1</text>
        ${dots(232, 30, true)}${ring(232, 30, 16)}<rect x="10" y="58" width="240" height="72" rx="10" fill="#fff"/><text class="disp" x="130" y="100" text-anchor="middle" font-size="20" fill="${INK}">Śmierdzipacha</text>`)],
    ['Stuknij <b>Dodaj do ekranu głównego</b>. W niektórych telefonach ten napis to <b>Zainstaluj aplikację</b>.',
      pic(`<rect x="70" y="8" width="176" height="124" rx="12" fill="#fff"/>${row(14, 'Nowa karta', '')}${row(38, 'Historia', '')}${row(62, 'Pobrane pliki', '')}${row(88, 'Dodaj do ekranu głównego', '', true)}${row(112, 'Ustawienia', '')}`)],
    ['Stuknij <b>Zainstaluj</b> (albo <b>Dodaj</b>). Jeśli telefon zapyta, gdzie położyć ikonę, wybierz <b>Dodaj automatycznie</b>.',
      pic(`<rect x="34" y="14" width="192" height="112" rx="16" fill="#fff"/><text x="52" y="40" font-size="13" fill="${INK}">Zainstalować aplikację?</text>${gameIcon(52, 52, 32)}<text x="94" y="73" font-size="12" fill="${INK}">Śmierdzipacha</text>
        <text x="120" y="112" text-anchor="middle" font-size="12" fill="${BLUEI}">Anuluj</text><rect x="152" y="94" width="62" height="26" rx="13" fill="${BLUEI}"/><text x="183" y="112" text-anchor="middle" font-size="12" fill="#fff">Zainstaluj</text>${box(148, 90, 70, 34)}`)],
  ],
  done: ['Gotowe! Uruchamiaj grę tą ikoną. Otworzy się na cały ekran, jak zwykła aplikacja.',
    pic(`<rect x="10" y="8" width="240" height="124" rx="12" fill="#5b6fd6"/>${[0, 1, 2, 3].map(i => [0, 1].map(j => (i === 1 && j === 0) ? '' : `<rect x="${34 + i * 52}" y="${20 + j * 58}" width="36" height="36" rx="9" fill="rgba(255,255,255,0.35)"/>`).join('')).join('')}
      ${gameIcon(86, 20, 36)}${ring(104, 38, 26)}<text x="104" y="70" text-anchor="middle" font-size="9" fill="#fff">Śmierdzipacha</text>`)],
  inApp: ['Ten link otworzył się w komunikatorze, np. w Messengerze. Stąd nie da się dodać gry do ekranu. Stuknij <b>⋯</b> albo <b>⋮</b> w rogu i wybierz <b>Otwórz w przeglądarce</b> (Safari albo Chrome). Możesz też skopiować link i wkleić go w przeglądarce.',
    pic(`<rect x="10" y="10" width="240" height="34" rx="10" fill="#fff"/><path d="M24 21l10 10M34 21L24 31" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/><text x="130" y="31" text-anchor="middle" font-size="11" fill="${INK}">jacekordowski.github.io</text>
      ${dots(230, 27)}${ring(230, 27, 15)}<rect x="96" y="52" width="150" height="76" rx="12" fill="#fff"/>
      <rect x="102" y="60" width="138" height="26" rx="8" fill="#fff3d6"/><text x="112" y="77" font-size="11" fill="${INK}">Otwórz w przeglądarce</text>${box(100, 58, 142, 30)}<text x="112" y="111" font-size="11" fill="${GREY}">Kopiuj link</text>`)],
};
let instOS = IS_ANDROID ? 'android' : 'ios';
function renderInstall() {
  const li = ([text, svg]) => `<li><p><span>${text}</span></p>${svg}</li>`;
  const inApp = IN_APP && canOfferInstall();
  $('instTitle').textContent = inApp ? 'Otwórz grę w przeglądarce' : 'Dodaj grę do ekranu telefonu';
  $('instWhy').textContent = inApp ? 'Potem dodasz ją do ekranu telefonu i będzie się otwierać jak aplikacja.'
    : 'Gra otworzy się jak aplikacja: na cały ekran, bez paska przeglądarki, jednym stuknięciem.';
  $('instTabs').hidden = inApp;
  $('instCopy').hidden = !inApp;
  $('instInstall').hidden = !(installEvent && instOS === 'android' && !inApp);
  $('instSteps').innerHTML = inApp ? li(INSTALL.inApp) : INSTALL[instOS].map(li).join('') + li(INSTALL.done);
  for (const b of $('instTabs').children) b.setAttribute('aria-selected', String(b.dataset.os === instOS));
}
function openInstall() { renderInstall(); $('scrInstall').hidden = false; $('scrInstall').querySelector('.card').scrollTop = 0; }
function closeInstall() { $('scrInstall').hidden = true; }
for (const b of $('instTabs').children) b.addEventListener('click', () => { Snd.unlock(); Snd.tap(); instOS = b.dataset.os; renderInstall(); });
tap('instClose', closeInstall);
tap('instLater', closeInstall);
tap('btnInstallHelp', openInstall);
tap('instInstall', () => {
  if (!installEvent) return;
  installEvent.prompt();
  installEvent.userChoice.then(c => { if (c.outcome === 'accepted') closeInstall(); }).catch(() => {});
  installEvent = null; renderInstall();
});
tap('instCopy', () => {
  const done = () => { $('instCopy').textContent = 'Skopiowano. Wklej link w Safari albo Chrome'; };
  try { navigator.clipboard.writeText(location.href).then(done, () => { prompt('Skopiuj ten link:', location.href); }); } catch (e) { prompt('Skopiuj ten link:', location.href); }
});

// Steering: the army follows the finger
let drag = null;
canvas.addEventListener('pointerdown', e => {
  Snd.unlock();
  if (mode !== 'play' || game.state !== 'run') return;
  drag = { id: e.pointerId, x: e.clientX };
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
});
canvas.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id || mode !== 'play' || game.state !== 'run') return;
  const dx = e.clientX - drag.x; drag.x = e.clientX;
  game.army.tx = clamp(game.army.tx + dx / (view.F / ARMY_D) * 1.15, -XMAX, XMAX);
});
const endDrag = e => { if (drag && e.pointerId === drag.id) drag = null; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
document.addEventListener('touchmove', e => { if (mode === 'play') e.preventDefault(); }, { passive: false });

const keys = { left: false, right: false };
window.addEventListener('keydown', e => {
  const L = e.key === 'ArrowLeft' || e.key === 'a', R = e.key === 'ArrowRight' || e.key === 'd';
  if (mode === 'play' && game.state === 'fight' && (L || R)) { if (!e.repeat) pickAnswer(L); return; }
  if (!$('scrInstall').hidden) { if (e.key === 'Escape') closeInstall(); return; }
  if (mode === 'lesson') { if ((L || R) && !e.repeat) lessonPick(L); return; }
  if (L) keys.left = true; else if (R) keys.right = true;
  else if (e.key === 'Escape' || e.key === 'p') { if (mode === 'play') pauseGame(); else if (mode === 'pause') resumeGame(); }
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
  else if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseGame(); Snd.suspend(); } else if (mode !== 'pause') Snd.resume(); });
window.addEventListener('resize', () => {
  if (mode === 'play') { view.hudBottom = probCard.hidden ? view.hudBottom : probCard.getBoundingClientRect().bottom; if (!fight.hidden) view.fightY = fight.getBoundingClientRect().top - 14; }
  layout();
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  if (mode === 'play') {
    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (dir && game.state === 'run') game.army.tx = clamp(game.army.tx + dir * 7 * dt, -XMAX, XMAX);
    step(game, dt);
    handleEvents(game);
    updateProblem(game, false);
    if (game.state === 'fight' && game.fight.p && !game.fight.done) fqTime.style.transform = `scaleX(${clamp((game.fight.deadline - game.time) / game.cfg.think, 0, 1)})`;
    $('hudProg').style.transform = `scaleX(${clamp(game.army.z / (game.monster.z - FIGHT_DIST), 0, 1)})`;
    if (game.state !== 'run' && game.state !== 'fight' && game.time > game.endAt) showResult(game);
    else if (ui.lessonQ && game.time >= ui.lessonQ.at) {
      const q = ui.lessonQ; ui.lessonQ = null;
      if (game.state === 'run' || game.state === 'fight') openLesson(q.p, q.your);
    }
  } else if (mode !== 'pause' && mode !== 'lesson') {
    step(game, dt);
    handleEvents(game);
  }
  render(game, dt);
  requestAnimationFrame(frame);
}

function boot() {
  layout();
  goMenu();
  if ('serviceWorker' in navigator && window.top === window && /^https:|^http:\/\/(localhost|127\.0\.0\.1)/.test(location.href)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});   // lets the game open without internet
  }
  $('btnInstallHelp').hidden = !canOfferInstall();
  if (canOfferInstall()) openInstall();
  if (document.fonts && document.fonts.load) document.fonts.load(`40px ${FD}`, 'Aąćęńśźż').catch(() => {});
  requestAnimationFrame(t => { last = t; frame(t); });
}
const hot = window.claude && window.claude.hot;
if (hot && hot.ready) hot.ready(boot); else boot();
})();
