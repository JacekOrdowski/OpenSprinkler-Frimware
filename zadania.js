/* Armia Liczb: zadania matematyczne dla klas 1–8 szkoły podstawowej.

   Każda klasa ma 8 tematów. Każdy temat to 5 gier: 4 stopnie trudności i powtórka.
   Gra 40 każdej klasy to sprawdzian z całej klasy.

   Zapis zadań: "[3/4]" to ułamek zwykły (gra rysuje go piętrowo), "2[1/3]" to liczba mieszana,
   przecinek dziesiętny jak w szkole (0,75), mnożenie "·", dzielenie ":". */
(() => {
'use strict';

/* ---------- helpers ---------- */
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
const lcm = (a, b) => a / gcd(a, b) * b;
const M = '−';                                   // minus sign
const NB = ' ';
const group = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
const N = n => { const s = String(Math.abs(n)); const g = Math.abs(n) >= 10000 ? group(s) : s; return n < 0 ? M + g : g; };
const P = n => (n < 0 ? `(${N(n)})` : N(n));          // a negative number inside an expression goes in brackets
// Decimal written from a whole count of 1/10^p: D(75, 2) = "0,75"
const D = (k, p) => {
  const neg = k < 0, s = String(Math.abs(k)).padStart(p + 1, '0');
  let ip = s.slice(0, s.length - p); const fp = s.slice(s.length - p).replace(/0+$/, '');
  if (Number(ip) >= 10000) ip = group(ip);
  return (neg ? M : '') + ip + (fp ? ',' + fp : '');
};
const PD = (k, p) => (k < 0 ? `(${D(k, p)})` : D(k, p));
// Fraction in lowest terms; mixed number when bigger than 1 ("1[1/4]")
const F = (n, d, mixed = true) => {
  if (d < 0) { n = -n; d = -d; }
  const k = gcd(n, d); n /= k; d /= k;
  if (d === 1) return N(n);
  const sign = n < 0 ? M : ''; n = Math.abs(n);
  return mixed && n > d ? `${sign}${Math.floor(n / d)}[${n % d}/${d}]` : `${sign}[${n}/${d}]`;
};
const FR = (n, d) => `[${n}/${d}]`;                   // fraction exactly as written in a problem
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(c => SUP[+c]).join('');
const term = (k, v) => (k === 1 ? v : k === -1 ? M + v : N(k) + v);   // 3x, x, −x
// Linear expression k·v + c written the school way: "2x + 6", "−x + 4", "a − 6"
const lin = (k, v, c) => {
  let s = k ? term(k, v) : '';
  if (c) s = s ? `${s} ${c < 0 ? M : '+'} ${N(Math.abs(c))}` : N(c);
  return s || '0';
};

// Builds one problem. `wrongs` are candidate wrong answers; `o.mistake` is a typical error, used half of the time.
function mk(q, a, wrongs, o = {}) {
  const S = v => (typeof v === 'number' ? N(v) : v);
  const A = S(a);
  const ok = v => v !== null && v !== undefined && !(typeof v === 'number' && !Number.isFinite(v)) && S(v) !== A;
  const res = { q, a: A, w: null, sub: o.sub || '' };
  if (o.sol) res.sol = o.sol;
  if (o.ask) res.ask = o.ask;
  if (ok(o.mistake) && Math.random() < 0.55) { res.w = S(o.mistake); return res; }
  const pool = [...new Set(wrongs.filter(ok).map(S))];
  res.w = pool.length ? pick(pool) : (typeof a === 'number' ? N(a + 1) : A + '0');
  return res;
}
const near = (n, neg) => {
  const out = [n + 1, n - 1, n + 2, n - 2];
  if (Math.abs(n) >= 20) out.push(n + 10, n - 10);
  return neg ? out : out.filter(v => v >= 0);
};
const nearDec = (k, p, neg) => {
  const u = 10 ** (p - 1) || 1;
  return [k + u, k - u, k + 10 * u, k - 10 * u, k * 10, k / 10].filter(v => Number.isInteger(v) && (neg || v >= 0)).map(v => D(v, p));
};
// Wrong fractions close to n/d
const nearFr = (n, d, mixed = true) => [F(n + 1, d, mixed), F(n - 1, d, mixed), F(n, d + 1, mixed), F(n + d, d, mixed), F(n * 2, d, mixed)];
const cmp = (x, y) => (x < y ? '<' : x > y ? '>' : '=');
const T = (nazwa, gen, czas) => ({ nazwa, gen, czas: czas || 1 });
const swap = (a, b) => (Math.random() < 0.5 ? [a, b] : [b, a]);


const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const ROM = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const roman = n => { let s = ''; for (const [v, r] of ROM) while (n >= v) { s += r; n -= v; } return s; };
const zl = v => `${N(v)} zł`;
const deg = v => `${v}°`;
// √n with the square factor taken out: simpleRoot(8) = "2√2", simpleRoot(13) = "√13"
function simpleRoot(n) {
  let k = 1, r = n;
  for (let i = Math.floor(Math.sqrt(n)); i > 1; i--) if (n % (i * i) === 0) { k = i; r = n / (i * i); break; }
  if (r === 1) return N(k);
  return (k > 1 ? N(k) : '') + '√' + r;
}
// A fraction or decimal result shown the way a pupil would write it: decimal when it ends, otherwise a fraction
function nice(n, d) {
  const k = gcd(n, d); n /= k; d /= k;
  for (let p = 0; p <= 3; p++) if ((n * 10 ** p) % d === 0) return D(n * 10 ** p / d, p);
  return F(n, d);
}

/* ============================================================
   KLASA 1: liczby do 20, porównywanie, okienka, pieniądze
   ============================================================ */
const K1 = [
  T('Dodawanie do 10', t => {
    if (t === 4) { const a = randi(1, 4), b = randi(1, 4), c = randi(1, 10 - a - b), v = a + b + c; return mk(`${a} + ${b} + ${c} = ?`, v, near(v)); }
    const max = [5, 7, 10][t - 1], a = randi(1, max - 1), b = randi(1, max - a);
    return mk(`${a} + ${b} = ?`, a + b, near(a + b));
  }),
  T('Odejmowanie do 10', t => {
    if (t === 4) { const a = randi(6, 10), b = randi(1, 3), c = randi(1, a - b - 1), v = a - b - c; return mk(`${a} ${M} ${b} ${M} ${c} = ?`, v, near(v)); }
    const max = [5, 7, 10][t - 1], a = randi(2, max), b = randi(1, a - 1);
    return mk(`${a} ${M} ${b} = ?`, a - b, near(a - b), { mistake: a + b });
  }),
  T('Porównywanie liczb', t => {
    let L, R, lv, rv;
    if (t === 1) { lv = randi(0, 10); rv = randi(0, 10); L = N(lv); R = N(rv); }
    else if (t === 2) { lv = randi(5, 20); rv = Math.random() < 0.2 ? lv : randi(5, 20); L = N(lv); R = N(rv); }
    else if (t === 3) { const a = randi(1, 9), b = randi(1, 10 - a); lv = a + b; rv = Math.max(0, lv + randi(-2, 2)); L = `${a} + ${b}`; R = N(rv); }
    else { const a = randi(1, 9), b = randi(1, 10 - a), c = randi(5, 10), d = randi(0, c - 1); lv = a + b; rv = c - d; L = `${a} + ${b}`; R = `${c} ${M} ${d}`; }
    return mk(`${L} ? ${R}`, cmp(lv, rv), ['<', '>', '='], { sub: 'Jaki znak: <, > czy =?' });
  }),
  T('Dodawanie i odejmowanie do 20', t => {
    if (t === 1) { const b = randi(1, 9), [x, y] = swap('10', String(b)); return mk(`${x} + ${y} = ?`, 10 + b, near(10 + b)); }
    if (t === 2) { const u = randi(1, 8), b = randi(1, 9 - u), a = 10 + u; return mk(`${a} + ${b} = ?`, a + b, near(a + b)); }
    if (t === 3) { const u = randi(2, 9), b = randi(1, u), a = 10 + u; return mk(`${a} ${M} ${b} = ?`, a - b, near(a - b)); }
    const u = randi(1, 6), b = randi(2, 8 - u), c = randi(1, u + b), a = 10 + u, v = a + b - c;
    return mk(`${a} + ${b} ${M} ${c} = ?`, v, near(v));
  }),
  T('Dodawanie z przekroczeniem 10', t => {
    if (t === 4) { const x = randi(2, 7), y = randi(2, 8), z = randi(Math.max(1, 11 - x - y), Math.min(9, 20 - x - y)), v = x + y + z; return mk(`${x} + ${y} + ${z} = ?`, v, near(v)); }
    const a = t === 1 ? 9 : t === 2 ? randi(7, 8) : randi(3, 9), b = randi(Math.max(2, 11 - a), 9), [x, y] = swap(a, b);
    return mk(`${x} + ${y} = ?`, a + b, near(a + b), { mistake: a + b - 10 });
  }),
  T('Odejmowanie z przekroczeniem 10', t => {
    if (t === 4 && Math.random() < 0.5) { const b = randi(2, 9); return mk(`20 ${M} ${b} = ?`, 20 - b, near(20 - b), { mistake: 10 - b }); }
    const a = t === 1 ? randi(11, 12) : t === 2 ? randi(11, 15) : randi(11, 18), u = a - 10, b = randi(u + 1, 9);
    return mk(`${a} ${M} ${b} = ?`, a - b, near(a - b), { mistake: 10 + b - u });
  }),
  T('Okienka', t => {
    if (t === 1) { const c = randi(3, 10), a = randi(1, c - 1); return mk(`${a} + ? = ${c}`, c - a, near(c - a).filter(v => v > 0), { mistake: c + a }); }
    if (t === 2) { const c = randi(5, 20), b = randi(1, Math.min(9, c - 1)); return mk(`? + ${b} = ${c}`, c - b, near(c - b).filter(v => v > 0)); }
    if (t === 3) { const a = randi(6, 20), b = randi(1, Math.min(9, a - 1)); return mk(`${a} ${M} ? = ${a - b}`, b, near(b).filter(v => v > 0)); }
    const b = randi(2, 9), r = randi(1, 20 - b); return mk(`? ${M} ${b} = ${r}`, r + b, near(r + b), { mistake: r - b > 0 ? r - b : null });
  }),
  T('Pieniądze do 20 zł', t => {
    const coins = [1, 2, 5];
    if (t === 1) { const a = pick(coins), b = pick(coins), v = a + b; return mk(`${a} zł + ${b} zł = ?`, zl(v), [zl(v + 1), zl(Math.max(1, v - 1)), zl(v + 2)]); }
    if (t === 2) { const a = pick(coins), b = pick(coins), c = pick(coins), v = a + b + c; return mk(`${a} zł + ${b} zł + ${c} zł = ?`, zl(v), [zl(v + 1), zl(v - 1), zl(v + 2)]); }
    if (t === 3) { const a = pick(coins), b = pick(coins), v = 10 + a + b; return mk(`10 zł + ${a} zł + ${b} zł = ?`, zl(v), [zl(v + 1), zl(v - 1), zl(a + b + 1)]); }
    const a = randi(2, 9), b = Math.random() < 0.5 ? 10 : 20, v = b - a; return mk(`${b} zł ${M} ${a} zł = ?`, zl(v), [zl(v + 1), zl(v - 1), zl(v + 2)], { sub: 'Ile reszty?' });
  }),
];

/* ============================================================
   KLASA 2: liczby do 100, mnożenie i dzielenie do 30, pieniądze i miary, liczby rzymskie
   ============================================================ */
const mulIn = (max, list) => { for (;;) { const a = pick(list), b = randi(1, 10); if (a * b <= max && a * b > 1) return [a, b]; } };
const mulProblem = (a, b) => { const p = a * b, [x, y] = swap(a, b); return mk(`${x} · ${y} = ?`, p, [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, p + 1, p - 1].filter(v => v > 0), { mistake: a + b }); };
const divProblem = (a, b) => mk(`${a * b} : ${a} = ?`, b, [b + 1, b - 1, b + 2].filter(v => v > 0), { mistake: a * b - a });
const K2 = [
  T('Dodawanie i odejmowanie dziesiątek', t => {
    if (t === 1) { const a = randi(1, 8), b = randi(1, 9 - a), v = (a + b) * 10; return mk(`${a * 10} + ${b * 10} = ?`, v, [v + 10, v - 10], { mistake: a + b }); }
    if (t === 2) { const a = randi(2, 9), b = randi(1, a - 1), v = (a - b) * 10; return mk(`${a * 10} ${M} ${b * 10} = ?`, v, [v + 10, v - 10].filter(x => x > 0)); }
    if (t === 3) { const a = randi(11, 69), b = randi(1, Math.floor((99 - a) / 10)) * 10, v = a + b; return mk(`${a} + ${b} = ?`, v, [v + 10, v - 10, v + 1, v - 1], { mistake: a + b / 10 }); }
    const a = randi(31, 99), b = randi(1, Math.floor(a / 10) - 1) * 10, v = a - b; return mk(`${a} ${M} ${b} = ?`, v, [v + 10, v - 10, v + 1], { mistake: a - b / 10 });
  }),
  T('Dodawanie do 100', t => {
    if (t === 1) { const a = randi(11, 89), u = a % 10, b = randi(1, Math.max(1, 9 - u)); if (u + b > 9) return K2[1].gen(1); return mk(`${a} + ${b} = ?`, a + b, near(a + b)); }
    if (t === 2) { const b = randi(3, 9), a = randi(1, 8) * 10 + randi(10 - b, 9), v = a + b; return mk(`${a} + ${b} = ?`, v, [v - 10, v + 1, v - 1], { mistake: v - 10 }); }
    if (t === 3) { const a = randi(1, 6) * 10 + randi(0, 5), b = randi(1, 8 - Math.floor(a / 10)) * 10 + randi(1, 9 - (a % 10)), v = a + b; return mk(`${a} + ${b} = ?`, v, [v + 10, v - 10, v + 1, v - 1]); }
    const a = randi(15, 59), b = randi(12, 99 - a), v = a + b; return mk(`${a} + ${b} = ?`, v, [v + 10, v - 10, v + 1, v - 1], { mistake: (a % 10) + (b % 10) < 10 ? null : v - 10 });
  }),
  T('Odejmowanie do 100', t => {
    if (t === 1) { const a = randi(11, 99), u = a % 10; if (u < 2) return K2[2].gen(1); const b = randi(1, u); return mk(`${a} ${M} ${b} = ?`, a - b, near(a - b)); }
    if (t === 2) { const a = randi(2, 9) * 10 + randi(0, 6), u = a % 10, b = randi(u + 1, 9), v = a - b; return mk(`${a} ${M} ${b} = ?`, v, [v + 10, v + 1, v - 1], { mistake: v + 10 }); }
    if (t === 3) { const a = randi(3, 9) * 10 + randi(2, 9), b = randi(1, Math.floor(a / 10) - 1) * 10 + randi(1, a % 10), v = a - b; return mk(`${a} ${M} ${b} = ?`, v, [v + 10, v - 10, v + 1, v - 1].filter(x => x >= 0)); }
    const a = randi(4, 9) * 10 + randi(0, 7), b = randi(1, Math.floor(a / 10) - 2) * 10 + randi(a % 10 + 1, 9), v = a - b;
    return mk(`${a} ${M} ${b} = ?`, v, [v + 10, v - 10, v + 1, v - 1].filter(x => x >= 0), { mistake: v + 10 });
  }),
  T('Mnożenie do 30', t => mulProblem(...mulIn(30, [[2], [2, 3], [2, 3, 4, 5], [2, 3, 4, 5, 6]][t - 1]))),
  T('Dzielenie do 30', t => divProblem(...mulIn(30, [[2], [2, 3], [2, 3, 4, 5], [2, 3, 4, 5, 6]][t - 1]))),
  T('Okienka do 100', t => {
    if (t === 1) { const c = randi(3, 10) * 10, a = randi(1, c / 10 - 1) * 10; return mk(`${a} + ? = ${c}`, c - a, [c - a + 10, c - a - 10].filter(v => v > 0), { mistake: c + a <= 100 ? c + a : null }); }
    if (t === 2) { const c = randi(30, 100), a = randi(11, c - 5); return Math.random() < 0.5 ? mk(`${a} + ? = ${c}`, c - a, [c - a + 10, c - a - 10, c - a + 1, c - a - 1].filter(v => v > 0)) : mk(`${c} ${M} ? = ${a}`, c - a, [c - a + 10, c - a - 10, c + a].filter(v => v > 0 && v <= 100)); }
    if (t === 3) { const [a, b] = mulIn(30, [2, 3, 4, 5]); return mk(`${a} · ? = ${a * b}`, b, [b + 1, b - 1, a * b - a].filter(v => v > 0)); }
    const [a, b] = mulIn(30, [2, 3, 4, 5]); return mk(`? : ${a} = ${b}`, a * b, [a * b + a, a * b - a, a + b].filter(v => v > 0));
  }),
  T('Pieniądze i miary', t => {
    if (t === 1) { const a = randi(1, 7) * 10 + randi(0, 9), b = randi(1, 9 - Math.floor(a / 10)) * 10, v = a + b; return mk(`${a} zł + ${b} zł = ?`, zl(v), [zl(v + 10), zl(v - 10), zl(v + 1)]); }
    if (t === 2) { const [big, small, k] = pick([['zł', 'gr', 100], ['m', 'cm', 100]]), n = randi(1, 5); return mk(`${n} ${big} = ? ${small}`, n * k, [n * 10, n * k * 10, n * k + 10], { mistake: n * 10 }); }
    if (t === 3) { const a = randi(11, 89), v = 100 - a; return mk(`100 zł ${M} ${a} zł = ?`, zl(v), [zl(v + 10), zl(v - 1 > 0 ? v - 1 : v + 2), zl(110 - a)].filter(x => x !== zl(v)), { sub: 'Ile reszty ze 100 zł?' }); }
    const [big, small] = pick([['m', 'cm'], ['zł', 'gr']]), a = randi(1, 9) * 10, v = 100 - a; return mk(`1 ${big} ${M} ${a} ${small} = ? ${small}`, v, [v + 10, v - 10, a].filter(x => x > 0 && x !== v), { mistake: 1 * 10 - a / 10 > 0 ? 10 - a / 10 : null });
  }),
  T('Liczby rzymskie do XII', t => {
    if (t === 1) { const n = pick([1, 2, 3, 5, 6, 7, 8, 10, 11, 12]); return mk(`${roman(n)} = ?`, n, [n + 1, n - 1].filter(v => v > 0)); }
    if (t === 2) { const n = pick([4, 9, 6, 11, 4, 9]); return mk(`${roman(n)} = ?`, n, [n + 1, n - 1], { mistake: n === 4 ? 6 : n === 9 ? 11 : n === 6 ? 4 : 9 }); }
    if (t === 3) { const n = randi(1, 12); return mk(`${n} = ?`, roman(n), [roman(n + 1), n > 1 ? roman(n - 1) : roman(3)], { sub: 'Zapisz liczbę po rzymsku', mistake: n === 4 ? 'IIII' : n === 9 ? 'VIIII' : n === 6 ? 'IV' : n === 11 ? 'IX' : null }); }
    const a = randi(1, 8), b = randi(1, 12 - a); return mk(`${roman(a)} + ${roman(b)} = ?`, roman(a + b), [roman(a + b + 1), roman(Math.max(1, a + b - 1))].filter(x => x !== roman(a + b)), { sub: 'Wynik zapisz po rzymsku' });
  }),
];

/* ============================================================
   KLASA 3: tabliczka mnożenia, liczby do 1000, obwody, jednostki
   ============================================================ */
const K3 = [
  T('Dodawanie i odejmowanie do 100', t => (t <= 2 ? K2[1].gen(t + 2) : K2[2].gen(t))),
  T('Tabliczka mnożenia', t => { const a = pick([[2, 3, 4, 5], [6, 7], [8, 9], [2, 3, 4, 5, 6, 7, 8, 9, 10]][t - 1]), b = randi(2, 10); return mulProblem(a, b); }),
  T('Dzielenie w zakresie tabliczki', t => { const a = pick([[2, 3, 4, 5], [6, 7], [8, 9], [2, 3, 4, 5, 6, 7, 8, 9, 10]][t - 1]), b = randi(2, 10); return divProblem(a, b); }),
  T('Mnożenie i dzielenie z okienkiem', t => {
    const a = randi(2, 9), b = randi(2, 10), p = a * b;
    if (t === 1) return mk(`${a} · ? = ${p}`, b, [b + 1, b - 1, p - a].filter(v => v > 0));
    if (t === 2) return mk(`? · ${a} = ${p}`, b, [b + 1, b - 1, b + 2].filter(v => v > 0));
    if (t === 3) return mk(`${p} : ? = ${b}`, a, [a + 1, a - 1, p - b].filter(v => v > 0 && v !== a));
    return mk(`? : ${a} = ${b}`, p, [p + a, p - a, a + b].filter(v => v > 0));
  }),
  T('Liczby do 1000', t => {
    if (t === 1) { const a = randi(1, 8), b = randi(1, 9 - a), v = (a + b) * 100; return mk(`${a * 100} + ${b * 100} = ?`, v, [v + 100, v - 100], { mistake: v / 10 }); }
    if (t === 2) { const a = randi(2, 9), b = randi(1, a - 1), v = (a - b) * 100; return mk(`${a * 100} ${M} ${b * 100} = ?`, v, [v + 100, v - 100].filter(x => x > 0), { mistake: a - b }); }
    if (t === 3) { if (Math.random() < 0.5) { const a = randi(1, 8) * 100 + randi(0, 5) * 10, b = randi(1, 4) * 10, v = a + b; return mk(`${a} + ${b} = ?`, v, [v + 100, v - 10, v + 10]); } const a = randi(1, 9) * 100 + randi(5, 9) * 10, b = randi(1, 5) * 10, v = a - b; return mk(`${a} ${M} ${b} = ?`, v, [v - 100, v - 10, v + 10]); }
    if (Math.random() < 0.5) { const h = randi(1, 8), d = randi(1, 9), v = (h + 1) * 100; return mk(`${h * 100 + d * 10} + ${100 - d * 10} = ?`, v, [v + 100, v - 10, v + 10]); }
    const h = randi(1, 9), d = randi(1, 9), v = h * 100; return mk(`${h * 100 + d * 10} ${M} ${d * 10} = ?`, v, [v + 10, v - 10, v - 100].filter(x => x > 0));
  }),
  T('Mnożenie przez 10 i przez 2', t => {
    if (t === 1) { const a = randi(2, 19), [x, y] = swap(a, 10); return mk(`${x} · ${y} = ?`, a * 10, [a * 100, a + 10, a * 10 + 10], { mistake: a + 10 }); }
    if (t === 2) { const a = randi(11, 49), v = a * 2; return mk(`${a} · 2 = ?`, v, [v + 10, v - 10, v + 2], { mistake: a + 2 }); }
    if (t === 3) { const a = randi(11, 49), v = a * 2; return mk(`${v} : 2 = ?`, a, [a + 10, a - 10, a + 1], { mistake: v - 2 }); }
    if (Math.random() < 0.5) { const a = randi(11, 99); return mk(`${a * 10} : 10 = ?`, a, [a * 100, a + 10, a - 10].filter(v => v > 0)); }
    const a = randi(2, 9), b = randi(2, 9), v = a * b * 10; return mk(`${a * 10} · ${b} = ?`, v, [v * 10, v / 10, v + 10]);
  }),
  T('Obwody figur', t => {
    if (t === 1) { const a = randi(2, 12); return mk('Obwód = ? cm', 4 * a, [2 * a, a * a, 4 * a + 4].filter(v => v !== 4 * a), { sub: `Kwadrat o boku ${a} cm`, sol: `Kwadrat o boku ${a} cm: obwód = 4 · ${a} = ${4 * a} cm`, mistake: a * a === 4 * a ? 2 * a : a * a }); }
    if (t === 2) { const a = randi(3, 12), b = randi(2, a - 1), v = 2 * (a + b); return mk('Obwód = ? cm', v, [a + b, a * b, v + 2].filter(x => x !== v), { sub: `Prostokąt ${a} cm na ${b} cm`, sol: `Prostokąt ${a} cm na ${b} cm: obwód = ${a} + ${b} + ${a} + ${b} = ${v} cm`, mistake: a + b }); }
    if (t === 3) { const a = randi(3, 9), b = randi(3, 9), c = randi(Math.abs(a - b) + 1, Math.min(9, a + b - 1)), v = a + b + c; return mk('Obwód = ? cm', v, [v + 1, v - 1, v + 2], { sub: `Trójkąt o bokach ${a} cm, ${b} cm, ${c} cm`, sol: `Obwód = ${a} + ${b} + ${c} = ${v} cm` }); }
    const a = randi(2, 12); return mk('Bok = ? cm', a, [a * 2, a + 2, a - 1].filter(v => v > 0 && v !== a), { sub: `Kwadrat ma obwód ${4 * a} cm`, sol: `Obwód ${4 * a} cm : 4 = bok ${a} cm`, mistake: 4 * a / 2 });
  }),
  T('Jednostki, połowa i ćwierć', t => {
    if (t <= 2) {
      const [big, small, k] = pick(t === 1 ? [['m', 'cm', 100], ['zł', 'gr', 100], ['cm', 'mm', 10]] : [['kg', 'dag', 100], ['km', 'm', 1000], ['h', 'min', 60], ['t', 'kg', 1000], ['dag', 'g', 10]]);
      const n = randi(2, 9); return mk(`${n} ${big} = ? ${small}`, n * k, [n * k * 10, n * k / 10, n * k + k].filter(Number.isInteger), { mistake: k === 60 ? n * 100 : n * k * 10 });
    }
    if (t === 3) { const [big, small] = pick([['m', 'cm'], ['zł', 'gr'], ['kg', 'dag']]), n = randi(1, 5), m = randi(1, 9) * 10, v = n * 100 + m; return mk(`${n} ${big} ${m} ${small} = ? ${small}`, v, [n * 10 + m, v + 100, v + 10], { mistake: n * 10 + m }); }
    const r = Math.random();
    if (r < 0.4) { const n = randi(2, 20) * 2; return mk(`Połowa z ${n} = ?`, n / 2, [n / 2 + 1, n / 2 - 1, n * 2], { mistake: n - 2 }); }
    if (r < 0.8) { const n = randi(2, 10) * 4; return mk(`Ćwierć z ${n} = ?`, n / 4, [n / 2, n / 4 + 1, n - 4], { mistake: n / 2 }); }
    const [q, v] = pick([['Pół godziny = ? min', 30], ['Kwadrans = ? min', 15], ['Pół litra + pół litra = ? l', 1], ['Pół kilograma = ? dag', 50]]); return mk(q, v, [v * 2, v === 1 ? 2 : v + 10, v === 15 ? 25 : v / 2].filter(Number.isInteger));
  }),
];

/* ============================================================
   KLASA 4: rachunki w pamięci, dzielenie z resztą, kwadraty i sześciany, kolejność działań,
   liczby rzymskie, działania pisemne, ułamki zwykłe i dziesiętne
   ============================================================ */
const K4 = [
  T('Rachunki w pamięci', t => {
    if (t === 1) { const a = randi(11, 69) * 100, b = randi(1, 9) * 100; return Math.random() < 0.5 ? mk(`${N(a)} + ${b} = ?`, a + b, [a + b + 100, a + b - 100, a + b * 10]) : mk(`${N(a)} ${M} ${b} = ?`, a - b, [a - b + 100, a - b - 100, a - b * 10].filter(v => v > 0)); }
    if (t === 2) { const d = randi(2, 6), q = randi(11, Math.floor(99 / d)); return Math.random() < 0.5 ? mk(`${d * q} : ${d} = ?`, q, [q + 1, q - 1, q + 10]) : mk(`${q} · ${d} = ?`, q * d, [q * d + 10, q * d - 10, q * d + d]); }
    if (t === 3) { const a = randi(2, 9) * 10, b = randi(2, 9) * 10, p = a * b; return Math.random() < 0.5 ? mk(`${a} · ${b} = ?`, p, [p * 10, p / 10, p + 100]) : mk(`${N(p)} : ${a} = ?`, b, [b * 10, b / 10, b + 10].filter(Number.isInteger)); }
    const a = randi(11, 49) * 1000, b = randi(11, 99) * 100; return Math.random() < 0.5 ? mk(`${N(a)} ${M} ${N(b)} = ?`, a - b, [a - b + 1000, a - b - 1000, a - b + 100]) : mk(`${N(a)} + ${N(b)} = ?`, a + b, [a + b + 1000, a + b - 1000, a + b + 100]);
  }),
  T('Dzielenie z resztą', t => {
    const d = t === 1 ? randi(2, 5) : randi(3, 9), q = t <= 2 ? randi(2, 9) : t === 3 ? randi(3, 12) : randi(10, 25), r = randi(1, d - 1), n = d * q + r;
    const R = (a, b) => `${a} r. ${b}`;
    const w = [R(q + 1, r)]; if (q > 1) w.push(R(q - 1, r)); if (r + 1 < d) w.push(R(q, r + 1)); else if (r > 1) w.push(R(q, r - 1));
    return mk(`${n} : ${d} = ?`, R(q, r), w, { mistake: q > 1 ? R(q - 1, r + d) : null, sol: `${n} : ${d} = ${R(q, r)}, bo ${d} · ${q} + ${r} = ${n}` });
  }),
  T('Kwadraty i sześciany liczb', t => {
    if (t === 1) { const a = randi(2, 10), v = a * a; return mk(`${a}² = ?`, v, [v + a, v - a, v + 1], { mistake: a === 2 ? null : 2 * a }); }
    if (t === 2) { const a = pick([1, 2, 3, 4, 5, 10]), v = a ** 3; return mk(`${a}³ = ?`, v, [a * a, v + a, v * 10].filter(x => x !== v), { mistake: a * 3 === v ? null : a * 3 }); }
    if (t === 3) { const a = randi(2, 6), b = randi(2, 6), v = a * a + b * b; return mk(`${a}² + ${b}² = ?`, v, near(v), { mistake: (a + b) ** 2 }); }
    const a = randi(2, 4), b = randi(2, 5), c = randi(2, 9), v = a ** 3 * b - c * c; if (v < 0) return K4[2].gen(4);
    return mk(`${a}³ · ${b} ${M} ${c}² = ?`, v, near(v), { mistake: a * 3 * b - c * 2 >= 0 ? a * 3 * b - c * 2 : null });
  }),
  T('Kolejność wykonywania działań', t => {
    if (t === 1) { const a = randi(2, 30), b = randi(2, 9), c = randi(2, 9), v = a + b * c; return mk(`${a} + ${b} · ${c} = ?`, v, near(v), { mistake: (a + b) * c }); }
    if (t === 2) { const a = randi(5, 20), b = randi(1, a - 2), c = randi(2, 6), v = (a - b) * c; return mk(`(${a} ${M} ${b}) · ${c} = ?`, v, near(v), { mistake: a - b * c >= 0 ? a - b * c : null }); }
    if (t === 3) { const s = randi(3, 9), b = randi(1, s - 1), q = randi(2, 9), n = s * q, e = randi(1, 20), v = q + e; return mk(`${n} : (${b} + ${s - b}) + ${e} = ?`, v, near(v)); }
    const c = randi(2, 4), d = randi(2, 4), b = c * d + randi(1, 9), a = randi(2, 5), e = randi(1, 20), v = a * (b - c * d) + e;
    return mk(`${a} · (${b} ${M} ${c} · ${d}) + ${e} = ?`, v, near(v), { mistake: (b - c) * d * a + e > 0 ? (b - c) * d * a + e : null });
  }, 1.2),
  T('Liczby rzymskie', t => {
    if (t === 1) { const n = randi(4, 20); return mk(`${roman(n)} = ?`, n, [n + 1, n - 1, n + 2], { mistake: /IV|IX/.test(roman(n)) ? n + 2 : null }); }
    if (t === 2) { const n = randi(14, 39); return mk(`${roman(n)} = ?`, n, [n + 1, n - 1, n + 10, n - 10], { mistake: /IV|IX/.test(roman(n)) ? n + 2 : null }); }
    if (t === 3) { const n = randi(4, 39); return mk(`${n} = ?`, roman(n), [roman(n + 1), roman(n - 1), roman(n + 10)], { sub: 'Zapisz liczbę po rzymsku' }); }
    const a = randi(4, 20), b = randi(4, 19); return mk(`${roman(a)} + ${roman(b)} = ?`, a + b, [a + b + 1, a + b - 1, a + b + 10]);
  }),
  T('Działania pisemne', t => {
    if (t === 1) { const a = randi(1200, 7999), b = randi(110, 999); return Math.random() < 0.5 ? mk(`${N(a)} + ${N(b)} = ?`, a + b, [a + b + 10, a + b - 10, a + b + 100, a + b - 100]) : mk(`${N(a)} ${M} ${N(b)} = ?`, a - b, [a - b + 10, a - b - 10, a - b + 100, a - b - 100]); }
    if (t === 2) { const a = randi(112, 499), b = randi(3, 9), p = a * b; return mk(`${a} · ${b} = ?`, p, [p + 10, p - 10, p + 100, p - 100]); }
    if (t === 3) { const d = randi(3, 9), q = randi(102, Math.floor(999 / d)), n = d * q; return mk(`${n} : ${d} = ?`, q, [q + 1, q - 1, q + 10, q - 10]); }
    const a = randi(12, 49), b = randi(12, 29), p = a * b; return mk(`${a} · ${b} = ?`, p, [p + 10, p - 10, p + 100, p - 100], { mistake: a * (b % 10) + a * Math.floor(b / 10) });
  }, 1.2),
  T('Ułamki zwykłe', t => {
    if (t === 1) { const d = randi(5, 12), a = randi(1, d - 2), b = randi(1, d - 1 - a); if (gcd(a + b, d) > 1) return K4[6].gen(1); return mk(`${FR(a, d)} + ${FR(b, d)} = ?`, FR(a + b, d), [FR(a + b + 1, d), FR(Math.max(1, a + b - 1), d)], { mistake: FR(a + b, d + d) }); }
    if (t === 2) { const d = randi(5, 12), a = randi(3, d - 1), b = randi(1, a - 1); if (gcd(a - b, d) > 1) return K4[6].gen(2); return mk(`${FR(a, d)} ${M} ${FR(b, d)} = ?`, FR(a - b, d), [FR(a - b + 1, d), FR(a + b, d)].filter(x => x !== FR(d, d))); }
    if (t === 3) { const d = randi(3, 9), w = randi(1, 3), a = randi(1, d - 1), b = randi(1, d - 1), n = w * d + a + b; if ((gcd(n, d) > 1 && n % d !== 0) || gcd(a, d) > 1 || gcd(b, d) > 1) return K4[6].gen(3); return mk(`${w}${FR(a, d)} + ${FR(b, d)} = ?`, F(n, d), [F(n + d, d), F(n - 1, d), F(n + 1, d)]); }
    const d = randi(3, 9), w = randi(1, 4), a = randi(1, d - 1); if (gcd(a, d) > 1) return K4[6].gen(4); const n = w * d - a;
    return mk(`${w} ${M} ${FR(a, d)} = ?`, F(n, d), [F(n + d, d), F(n + 1, d), F(n - 1, d)], { mistake: w > 1 ? `${w - 1}${FR(a, d)}` : FR(a, d) });
  }, 1.1),
  T('Ułamki dziesiętne', t => {
    if (t === 1) {
      if (Math.random() < 0.5) { const p = pick([1, 2]), k = randi(1, 10 ** p - 1); if (k % 10 === 0 && p === 2) return K4[7].gen(1); return mk(`${FR(k, 10 ** p)} = ?`, D(k, p), [D(k, p + 1), D(k, p - 1)]); }
      const m = randi(1, 9), c = randi(1, 9); return mk(`${m} m ${c} cm = ? m`, D(m * 100 + c, 2), [D(m * 10 + c, 1), D(m * 1000 + c, 3)], { mistake: D(m * 10 + c, 1) });
    }
    if (t === 2) { const a = randi(1, 99), b = randi(1, 9) * 10; const [x, y] = swap(a, b); return mk(`${D(x, 2)} ? ${D(y, 2)}`, cmp(x, y), ['<', '>', '='], { sub: 'Jaki znak: <, > czy =?' }); }
    if (t === 3) { const a = randi(1, 8), b = randi(1, 9 - a), w = randi(0, 3); return mk(`${D(w * 10 + a, 1)} + ${D(b, 1)} = ?`, D(w * 10 + a + b, 1), nearDec(w * 10 + a + b, 1)); }
    if (Math.random() < 0.5) { const a = randi(11, 59), b = randi(2, Math.min(9, a - 2)), v = a - b; return mk(`${D(a, 1)} ${M} ${D(b, 1)} = ?`, D(v, 1), nearDec(v, 1)); }
    const a = randi(101, 499), b = randi(1, 9) * 10, v = a + b; return mk(`${D(a, 2)} + ${D(b, 2)} = ?`, D(v, 2), [D(v + 10, 2), D(v - 10, 2)], { mistake: D(a + b / 10, 2) });
  }),
];

/* ============================================================
   KLASA 5: potęgi, podzielność, działania na ułamkach, ułamki dziesiętne, kąty i pola, liczby całkowite
   ============================================================ */
const K5 = [
  T('Potęgi i kolejność działań', t => {
    if (t === 1) { const [b, e] = pick([[2, 4], [2, 5], [10, 3], [10, 4], [3, 3], [1, 7]]), v = b ** e; return mk(`${b}${sup(e)} = ?`, v, [b ** (e + 1), b ** (e - 1)], { mistake: b * e === v ? null : b * e }); }
    if (t === 2) { const [b, e] = pick([[3, 4], [5, 3], [4, 3], [2, 6], [6, 2], [0, 5]]), v = b ** e; return mk(`${b}${sup(e)} = ?`, v, [b ** (e + 1), b ** (e - 1), v + b].filter(x => x !== v), { mistake: b * e === v ? null : b * e }); }
    if (t === 3) { const a = randi(2, 4), b = randi(2, 5), v = a ** 3 + b ** 2; return mk(`${a}³ + ${b}² = ?`, v, near(v), { mistake: a * 3 + b * 2 }); }
    const a = randi(2, 5), b = randi(1, 4), c = randi(2, 4), v = (a + b) ** 2 - c ** 3; if (v < 0) return K5[0].gen(4);
    return mk(`(${a} + ${b})² ${M} ${c}³ = ?`, v, near(v), { mistake: a * a + b * b - c ** 3 >= 0 ? a * a + b * b - c ** 3 : null });
  }),
  T('Podzielność, liczby pierwsze, NWD i NWW', t => {
    if (t <= 2) {
      const d = t === 1 ? pick([2, 5, 10]) : pick([3, 9, 4]), yes = Math.random() < 0.5;
      let n; do { n = randi(100, 999); } while ((n % d === 0) !== yes);
      return mk(`Czy ${n} dzieli się przez ${d}?`, yes ? 'tak' : 'nie', [yes ? 'nie' : 'tak'], { sol: `${n} ${yes ? '' : 'nie '}dzieli się przez ${d}` });
    }
    if (t === 3) {
      let p, c; do { p = randi(11, 97); } while (!isPrime(p)); do { c = randi(11, 99); } while (isPrime(c) || c % 2 === 0 || c % 5 === 0);
      let f = 3; while (c % f) f += 2;
      return mk('Która liczba jest pierwsza?', N(p), [N(c)], { sol: `${p} jest liczbą pierwszą, ${c} nie (${c} = ${f} · ${c / f})` });
    }
    const a = randi(2, 6) * pick([2, 3]), b = randi(2, 6) * pick([2, 3, 5]);
    if (a === b) return K5[1].gen(4);
    return Math.random() < 0.5
      ? mk(`NWD(${a}, ${b}) = ?`, gcd(a, b), [lcm(a, b), gcd(a, b) * 2, Math.min(a, b)].filter(v => v !== gcd(a, b)), { sub: 'Największy wspólny dzielnik' })
      : mk(`NWW(${a}, ${b}) = ?`, lcm(a, b), [a * b, gcd(a, b), lcm(a, b) * 2].filter(v => v !== lcm(a, b)), { sub: 'Najmniejsza wspólna wielokrotność' });
  }),
  T('Skracanie i rozszerzanie ułamków', t => {
    const d0 = randi(3, 9), n0 = randi(1, d0 - 1); if (gcd(n0, d0) > 1) return K5[2].gen(t);
    const k = randi(2, t <= 2 ? 4 : 8);
    if (t === 1) return mk(`${FR(n0, d0)} = [?/${d0 * k}]`, N(n0 * k), [N(n0 * k + 1), N(n0 + k), N(n0 * k - 1)].filter(x => x !== '0'));
    if (t === 2) return mk(`${FR(n0 * k, d0 * k)} = [?/${d0}]`, N(n0), [N(n0 + 1), N(n0 * k), N(n0 + k)].filter(x => x !== N(n0)));
    return mk(`Skróć: ${FR(n0 * k, d0 * k)} = ?`, FR(n0, d0), [FR(n0 + 1, d0), FR(n0, d0 + 1), FR(n0 * k, d0)], { sub: 'Do postaci nieskracalnej', mistake: FR(n0, d0 * k) });
  }),
  T('Dodawanie i odejmowanie ułamków', t => {
    let b, d;
    if (t === 1) { b = pick([2, 3, 4, 5]); d = b * pick([2, 3]); } else { [b, d] = pick([[2, 3], [3, 4], [2, 5], [4, 6], [3, 5], [4, 5], [6, 8], [3, 8]]); }
    const a = randi(1, b - 1), c = randi(1, d - 1);
    if (gcd(a, b) > 1 || gcd(c, d) > 1) return K5[3].gen(t);
    if (t <= 2) return mk(`${FR(a, b)} + ${FR(c, d)} = ?`, F(a * d + c * b, b * d), nearFr(a * d + c * b, b * d), { mistake: F(a + c, b + d) });
    if (t === 3) {
      const x = a * d, y = c * b; if (x === y) return K5[3].gen(3);
      const [hi, lo] = x > y ? [[a, b], [c, d]] : [[c, d], [a, b]], n = hi[0] * lo[1] - lo[0] * hi[1], m = b * d;
      return mk(`${FR(hi[0], hi[1])} ${M} ${FR(lo[0], lo[1])} = ?`, F(n, m), nearFr(n, m), { mistake: hi[1] !== lo[1] && hi[0] > lo[0] ? F(hi[0] - lo[0], Math.abs(hi[1] - lo[1])) : null });
    }
    const w1 = randi(1, 3), w2 = randi(1, 2), n = (w1 * b + a) * d + (w2 * d + c) * b, m = b * d;
    return mk(`${w1}${FR(a, b)} + ${w2}${FR(c, d)} = ?`, F(n, m), nearFr(n, m), { mistake: `${w1 + w2}${F(a + c, b + d)}` });
  }, 1.25),
  T('Mnożenie i dzielenie ułamków', t => {
    if (t === 1) {
      if (Math.random() < 0.5) { const d = randi(2, 9), n = randi(1, d - 1), k = d * randi(1, 3); if (gcd(n, d) > 1) return K5[4].gen(1); return mk(`${FR(n, d)} · ${k} = ?`, F(n * k, d), [F(n + k, d), F(n * k + d, d)], { mistake: F(n, d * k) }); }
      const d = randi(2, 6), n = randi(1, d - 1), w = d * randi(2, 9); if (gcd(n, d) > 1) return K5[4].gen(1); return mk(`${FR(n, d)} z ${w} = ?`, w / d * n, [w / d, w / d * n + n, w * n].filter(v => v !== w / d * n), { mistake: n > 1 ? w / d : w - w / d });
    }
    if (t === 2) { const b = randi(2, 7), d = randi(2, 7), a = randi(1, b - 1), c = randi(1, d - 1); if (gcd(a, b) > 1 || gcd(c, d) > 1) return K5[4].gen(2); return mk(`${FR(a, b)} · ${FR(c, d)} = ?`, F(a * c, b * d), nearFr(a * c, b * d), { mistake: F(a * d, b * c) }); }
    if (t === 3) {
      if (Math.random() < 0.5) { const b = randi(2, 7), d = randi(2, 7), a = randi(1, b - 1), c = randi(1, d - 1); if (gcd(a, b) > 1 || gcd(c, d) > 1) return K5[4].gen(3); return mk(`${FR(a, b)} : ${FR(c, d)} = ?`, F(a * d, b * c), nearFr(a * d, b * c), { mistake: F(a * c, b * d) }); }
      const w = randi(2, 6), d = randi(2, 5), c = randi(1, d - 1); if (gcd(c, d) > 1) return K5[4].gen(3); return mk(`${w} : ${FR(c, d)} = ?`, F(w * d, c), [F(w * c, d), F(w * d + 1, c)], { mistake: F(w * c, d) });
    }
    const w = randi(1, 2), b = randi(2, 5), a = randi(1, b - 1), d = randi(2, 6), c = randi(1, d - 1);
    if (gcd(a, b) > 1 || gcd(c, d) > 1) return K5[4].gen(4);
    if (Math.random() < 0.5) return mk(`${w}${FR(a, b)} · ${FR(c, d)} = ?`, F((w * b + a) * c, b * d), nearFr((w * b + a) * c, b * d), { mistake: `${w}${F(a * c, b * d)}` });
    return mk(`${w}${FR(a, b)} : ${FR(c, d)} = ?`, F((w * b + a) * d, b * c), nearFr((w * b + a) * d, b * c), { mistake: F((w * b + a) * c, b * d) });
  }, 1.25),
  T('Ułamki dziesiętne: działania', t => {
    if (t === 1) { const z = randi(1, 3), k = 10 ** z, a = randi(11, 999), p = pick([1, 2]); return Math.random() < 0.5
      ? mk(`${D(a, p)} · ${N(k)} = ?`, D(a * k, p), [D(a * k, p + 1), D(a * k * 10, p), D(a, p + z)])
      : mk(`${D(a, p)} : ${N(k)} = ?`, D(a, p + z), [D(a, p + z - 1), D(a * k, p), D(a, p + z + 1)]); }
    if (t === 2) { const a = randi(2, 9), b = randi(2, 9); return Math.random() < 0.5
      ? mk(`${D(a, 1)} · ${b} = ?`, D(a * b, 1), nearDec(a * b, 1), { mistake: D(a * b, 2) })
      : mk(`${D(a * b, 1)} : ${b} = ?`, D(a, 1), nearDec(a, 1), { mistake: D(a, 2) }); }
    if (t === 3) { const a = randi(2, 9), b = randi(2, 9); return mk(`${D(a, 1)} · ${D(b, 1)} = ?`, D(a * b, 2), [D(a * b, 3), D(a * b + 1, 2)], { mistake: D(a * b, 1) }); }
    const b = randi(2, 9), q = randi(2, 9), p = pick([1, 2]); return mk(`${D(b * q, p)} : ${D(b, p)} = ?`, N(q), [N(q * 10), D(q, 2)].filter(x => x !== N(q)), { mistake: D(q, 1) });
  }, 1.15),
  T('Kąty i pola figur', t => {
    if (t === 1) { const a = randi(30, 80), b = randi(30, 150 - a - 10), c = 180 - a - b; return mk(`${deg(a)} + ${deg(b)} + ? = 180°`, deg(c), [deg(c + 10), deg(360 - a - b), deg(c - 10)].filter(x => x !== deg(c)), { sub: 'Trzeci kąt trójkąta', sol: `${a}° + ${b}° + ${c}° = 180°`, mistake: deg(360 - a - b) }); }
    if (t === 2) { const top = randi(2, 14) * 10, base = (180 - top) / 2; return mk('Kąt przy podstawie = ?', deg(base), [deg(180 - top), deg(top), deg(base + 10)].filter(x => x !== deg(base)), { sub: `Trójkąt równoramienny, kąt między ramionami ${top}°`, sol: `(180° − ${top}°) : 2 = ${base}°`, mistake: deg(180 - top) }); }
    if (t === 3) {
      if (Math.random() < 0.5) { const a = randi(2, 12), h = randi(1, 6) * 2; return mk('P = ? cm²', a * h / 2, [a * h, a * h / 2 + 2], { sub: `Trójkąt: a = ${a} cm, h = ${h} cm`, sol: `Trójkąt: P = ${a} · ${h} : 2 = ${a * h / 2} cm²`, mistake: a * h }); }
      const a = randi(3, 12), h = randi(2, 9); return mk('P = ? cm²', a * h, [a * h + a, 2 * (a + h)].filter(v => v !== a * h), { sub: `Równoległobok: a = ${a} cm, h = ${h} cm`, sol: `Równoległobok: P = ${a} · ${h} = ${a * h} cm²`, mistake: Number.isInteger(a * h / 2) ? a * h / 2 : null });
    }
    const a = randi(4, 12), b = randi(2, a - 1), h = randi(1, 5) * 2, v = (a + b) * h / 2;
    return mk('P = ? cm²', v, [(a + b) * h, v + h], { sub: `Trapez: a = ${a} cm, b = ${b} cm, h = ${h} cm`, sol: `Trapez: P = (${a} + ${b}) · ${h} : 2 = ${v} cm²`, mistake: (a + b) * h });
  }, 1.2),
  T('Liczby całkowite: dodawanie i odejmowanie', t => {
    const a = randi(1, 12), b = randi(1, 12);
    if (t === 1) { if (a === b) return K5[7].gen(1); return mk(`${M}${a} + ${b} = ?`, b - a, near(b - a, true), { mistake: a - b }); }
    if (t === 2) { const x = randi(1, 9), y = randi(x + 1, 15); return mk(`${x} ${M} ${y} = ?`, x - y, near(x - y, true), { mistake: y - x }); }
    if (t === 3) return mk(`${M}${a} ${M} ${b} = ?`, -a - b, near(-a - b, true), { mistake: b - a === 0 ? a + b : b - a });
    if (Math.random() < 0.5) return mk(`${M}${a} ${M} (${M}${b}) = ?`, b - a, near(b - a, true), { mistake: -a - b });
    const c = randi(1, 6), v = a - b - c; return mk(`${a} + (${M}${b}) ${M} ${c} = ?`, v, near(v, true), { mistake: a + b - c });
  }),
];

/* ============================================================
   KLASA 6: ułamki razem, liczby całkowite, procenty, wyrażenia, równania, prędkość, objętość
   ============================================================ */
// A fraction n/d and a decimal k/10^p combined with one operation; the answer in the simplest school form
function fracDec(op) {
  const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 10], [3, 10]]), [k, p] = pick([[5, 1], [25, 2], [2, 1], [75, 2], [4, 1], [6, 1], [15, 2]]);
  const P10 = 10 ** p;
  let rn, rd, sym;
  if (op === '+') { rn = n * P10 + k * d; rd = d * P10; sym = '+'; }
  else if (op === '-') { rn = n * P10 - k * d; rd = d * P10; sym = M; if (rn <= 0) return fracDec(op); }
  else if (op === '*') { rn = n * k; rd = d * P10; sym = '·'; }
  else { rn = n * P10; rd = d * k; sym = ':'; }
  const [L, R] = op === '+' || op === '*' ? swap(FR(n, d), D(k, p)) : [FR(n, d), D(k, p)];
  const tenth = rd % 10 === 0 ? nice(rn + rd / 10, rd) : nice(rn + 1, rd);
  return mk(`${L} ${sym} ${R} = ?`, nice(rn, rd), [tenth, nice(rn * 2, rd), nice(rn + rd, rd)]);
}
const K6 = [
  T('Ułamki zwykłe i dziesiętne razem', t => fracDec(['+', '-', '*', ':'][t - 1]), 1.3),
  T('Zamiana ułamków i zaokrąglanie', t => {
    const opts = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [1, 20], [7, 20], [3, 25]];
    const [n, d] = pick(opts); let p = 1; while ((n * 10 ** p) % d) p++; const k = n * 10 ** p / d;
    if (t === 1) return mk(`${FR(n, d)} = ?`, D(k, p), [D(k, p + 1), D(k + 1, p), D(n, 1)].filter(x => x !== D(k, p)), { mistake: `${n},${d}` });
    if (t === 2) return mk(`${D(k, p)} = ?`, F(n, d), [F(n + 1, d), F(n, d + 1), F(k, 10 ** p + 1)], { sub: 'Zapisz jako ułamek zwykły' });
    if (t === 3) { const [a, b] = pick([[1, 3], [2, 3], [1, 6], [5, 6], [1, 7], [2, 7], [1, 9], [5, 9], [4, 7]]), h = Math.round(a * 100 / b); return mk(`${FR(a, b)} ≈ ?`, D(h, 2), [D(Math.floor(a * 100 / b) === h ? h + 1 : h - 1, 2), D(Math.round(a * 10 / b), 1), D(h + 10, 2)].filter(x => x !== D(h, 2)), { sub: 'Zaokrąglij do części setnych', sol: `${a}/${b} ≈ ${D(h, 2)}` }); }
    const [a, b, s, wr] = pick([[1, 3, '0,(3)', '0,3'], [2, 3, '0,(6)', '0,6'], [1, 9, '0,(1)', '0,1'], [4, 9, '0,(4)', '0,4'], [1, 6, '0,1(6)', '0,16'], [5, 6, '0,8(3)', '0,83'], [1, 11, '0,(09)', '0,09']]);
    return mk(`${FR(a, b)} = ?`, s, [wr], { sub: 'Ułamek okresowy', sol: `${a}/${b} = ${s}` });
  }, 1.1),
  T('Liczby całkowite: wszystkie działania', t => {
    const a = randi(2, 12), b = randi(2, 12), c = randi(2, 9);
    if (t === 1) return Math.random() < 0.5 ? mk(`(${M}${a}) · ${b} = ?`, -a * b, [-a * b + a, -a * b - b], { mistake: a * b }) : mk(`(${M}${a}) · (${M}${b}) = ?`, a * b, [a * b + a, a * b - b], { mistake: -a * b });
    if (t === 2) return Math.random() < 0.5 ? mk(`(${M}${a * b}) : ${b} = ?`, -a, [-a + 1, -a - 1], { mistake: a }) : mk(`(${M}${a * b}) : (${M}${b}) = ?`, a, [a + 1, a - 1], { mistake: -a });
    if (t === 3) { const x = randi(2, 9), y = randi(2, 9), v = -x + y * -c; return mk(`${M}${x} + ${y} · (${M}${c}) = ?`, v, near(v, true), { mistake: (-x + y) * -c }); }
    if (Math.random() < 0.5) { const e = randi(2, 3), v = (-c) ** e; return mk(`(${M}${c})${sup(e)} = ?`, v, [v + c, (-c) * e], { mistake: -v }); }
    const x = randi(2, 9), y = randi(2, 9), v = x * x - y * -c; return mk(`(${M}${x})² ${M} ${y} · (${M}${c}) = ?`, v, near(v, true), { mistake: -(x * x) + y * c });
  }),
  T('Procenty', t => {
    if (t === 1) { const p = pick([1, 10, 25, 50]), w = p === 1 ? 100 * randi(2, 9) : p === 25 ? 4 * randi(2, 25) : 10 * randi(2, 20), v = w * p / 100; return mk(`${p}% z ${w} = ?`, v, [v * 2, v + 10, w - v].filter(x => x !== v && x > 0)); }
    if (t === 2) { const [n, d, pc] = pick([[1, 2, 50], [1, 4, 25], [3, 4, 75], [1, 5, 20], [2, 5, 40], [1, 10, 10], [3, 10, 30]]); return Math.random() < 0.5 ? mk(`${FR(n, d)} = ?%`, `${pc}%`, [`${n * 10}%`, `${pc + 5}%`, `${d}%`].filter(x => x !== `${pc}%`), { sol: `${n}/${d} = ${pc}%` }) : mk(`${pc}% = ?`, F(n, d), [F(n + 1, d), FR(1, pc), F(n, d * 2)].filter(x => x !== F(n, d)), { sub: 'Zapisz jako ułamek zwykły', sol: `${pc}% = ${n}/${d}` }); }
    if (t === 3) { const p = pick([10, 20, 25, 50, 75]), w = 20 * randi(1, 10), part = w * p / 100; return mk(`${part} to ?% liczby ${w}`, `${p}%`, [`${p + 5}%`, `${p * 2}%`, `${Math.max(1, p - 5)}%`].filter(x => x !== `${p}%`), { sol: `${part} to ${p}% liczby ${w}` }); }
    const p = pick([10, 20, 25, 50]), w = 20 * randi(2, 15), up = Math.random() < 0.5, v = up ? w + w * p / 100 : w - w * p / 100;
    return mk(`${w} zł ${up ? '+' : M} ${p}% = ?`, zl(v), [zl(up ? w - w * p / 100 : w + w * p / 100), zl(up ? w + p : w - p)], { sub: up ? 'Podwyżka ceny' : 'Obniżka ceny', sol: `${w} zł ${up ? 'po podwyżce' : 'po obniżce'} o ${p}% = ${zl(v)}` });
  }, 1.1),
  T('Wyrażenia algebraiczne', t => {
    if (t === 1) { const k = randi(2, 9), c = randi(1, 15), x = randi(2, 9), v = pick(['a', 'x', 'b']); return mk(`${k}${v} + ${c} = ?`, k * x + c, [k + x + c, k * x, k * (x + c)], { sub: `dla ${v} = ${x}`, sol: `${k} · ${x} + ${c} = ${k * x + c}` }); }
    if (t === 2) { const a = randi(2, 9), b = randi(2, 9), v = pick(['x', 'a', 'y']); return mk(`${a}${v} + ${b}${v} = ?`, term(a + b, v), [term(a * b, v), N(a + b)], { mistake: `${a + b}${v}²` }); }
    if (t === 3) { const a = randi(5, 12), b = randi(1, a - 2), c = randi(1, 5), v = pick(['x', 'a']); return mk(`${a}${v} ${M} ${b}${v} + ${c}${v} = ?`, term(a - b + c, v), [term(a - b - c, v), term(a + b + c, v), term(a - b + c + 1, v)].filter(s => !s.startsWith(M) && s !== '0' + v)); }
    const a = randi(2, 6), b = randi(1, 8), c = randi(2, 6), d = randi(1, 8);
    if (b === d) return K6[4].gen(4);
    return mk(`${a}x + ${b} + ${c}x ${M} ${d} = ?`, lin(a + c, 'x', b - d), [lin(a + c + 1, 'x', b - d), lin(a * c, 'x', b - d)], { mistake: lin(a + c, 'x', b + d) });
  }, 1.1),
  T('Równania', t => {
    const x = randi(2, 12);
    if (t === 1) { const b = randi(2, 20); return mk(`x + ${b} = ${x + b}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: 2 * x + b }); }
    if (t === 2) { const a = randi(2, 9); return mk(`${a}x = ${a * x}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: a * x - a }); }
    if (t === 3) { const a = randi(2, 6), b = randi(1, 15); return mk(`${a}x ${M} ${b} = ${a * x - b}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: (a * x - 2 * b) % a === 0 && a * x - 2 * b > 0 ? (a * x - 2 * b) / a : null }); }
    const a = randi(3, 7), c = randi(1, a - 1), b = randi(1, 10), d = (a - c) * x + b; return mk(`${a}x + ${b} = ${c}x + ${d}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: (d - b) % (a + c) === 0 ? (d - b) / (a + c) : null });
  }, 1.2),
  T('Prędkość, droga i czas', t => {
    const v = pick([4, 5, 10, 12, 15, 20, 30, 40, 50, 60, 70, 80, 90]), h = randi(2, 5);
    if (t === 1) return mk('s = ? km', v * h, [v + h, v * h + v, v * (h - 1)], { sub: `Prędkość ${v} km/h, czas ${h} h`, sol: `s = ${v} km/h · ${h} h = ${v * h} km`, mistake: v + h });
    if (t === 2) return mk('v = ? km/h', v, [v * h * h, v + h, v * 2].filter(x => x !== v), { sub: `Droga ${v * h} km, czas ${h} h`, sol: `v = ${v * h} km : ${h} h = ${v} km/h`, mistake: v * h * h });
    if (t === 3) return mk('t = ? h', h, [h + 1, h * 2, v].filter(x => x !== h), { sub: `Droga ${v * h} km, prędkość ${v} km/h`, sol: `t = ${v * h} km : ${v} km/h = ${h} h` });
    const [min, frac] = pick([[30, 2], [15, 4], [20, 3], [12, 5], [6, 10]]), w = frac * randi(1, 12), s = w / frac;
    return mk('s = ? km', s, [w * min, w / 2 === s ? w : w / 2, s + w / frac / 2].filter(z => Number.isInteger(z) && z !== s), { sub: `Prędkość ${w} km/h, czas ${min} min`, sol: `${min} min = ${FR(1, frac)} h, więc s = ${w} : ${frac} = ${s} km`, mistake: w * min });
  }, 1.2),
  T('Objętość prostopadłościanu', t => {
    if (t === 1) { const a = randi(2, 6); return mk('V = ? cm³', a ** 3, [a * a, 6 * a * a, 3 * a], { sub: `Sześcian o krawędzi ${a} cm`, sol: `Sześcian o krawędzi ${a} cm: V = ${a ** 3} cm³`, mistake: a * a }); }
    if (t === 2) { const a = randi(2, 6), b = randi(2, 6), c = randi(2, 9); return mk('V = ? cm³', a * b * c, [a * b + c, 2 * (a * b + b * c + a * c), a * b * c + a * b], { sub: `Prostopadłościan ${a} cm × ${b} cm × ${c} cm`, sol: `V = ${a} · ${b} · ${c} = ${a * b * c} cm³` }); }
    if (t === 3) { const [from, to, k] = pick([['dm³', 'l', 1], ['l', 'cm³', 1000], ['l', 'ml', 1000], ['m³', 'dm³', 1000]]), n = randi(2, 9); return mk(`${n} ${from} = ? ${to}`, n * k, [n * 10, n * 100, n * k * 10].filter(v => v !== n * k)); }
    const a = randi(2, 5), b = randi(2, 6), c = randi(2, 9); return mk('c = ? cm', c, [c + 1, a * b * c - a * b, c * 2].filter(v => v !== c), { sub: `Prostopadłościan: V = ${a * b * c} cm³, a = ${a} cm, b = ${b} cm`, sol: `c = ${a * b * c} : (${a} · ${b}) = ${c} cm` });
  }, 1.2),
];

/* ============================================================
   KLASA 7: procenty, potęgi, notacja wykładnicza, pierwiastki, wyrażenia, równania, Pitagoras, układ współrzędnych
   ============================================================ */
const pt = (x, y) => `(${N(x)}, ${N(y)})`;
const K7 = [
  T('Procenty', t => {
    if (t === 1) { const p = pick([5, 15, 30, 40, 60, 75]), w = 20 * randi(2, 20), v = w * p / 100; return mk(`${p}% z ${w} = ?`, v, [v + 5, v + 10, v * 2].filter(x => x !== v)); }
    if (t === 2) { const p = pick([5, 15, 20, 30, 40, 60, 75, 80]), w = 20 * randi(1, 10), part = w * p / 100; return mk(`${part} to ?% liczby ${w}`, `${p}%`, [`${p + 5}%`, `${p + 10}%`, `${Math.max(1, p - 5)}%`].filter(x => x !== `${p}%`), { sol: `${part} to ${p}% liczby ${w}` }); }
    if (t === 3) { const p = pick([10, 20, 50]), w = 100 * randi(1, 9), up = w + w * p / 100, v = up - up * p / 100; return mk(`${w} zł, +${p}%, potem ${M}${p}% = ?`, zl(v), [zl(w), zl(w + w * p / 100)], { sub: 'Podwyżka, a potem obniżka', sol: `${w} zł + ${p}% = ${zl(up)}, potem ${M}${p}% = ${zl(v)}`, mistake: zl(w) }); }
    const p = pick([10, 20, 25, 50]), x = (100 / p) * randi(2, 20), part = x * p / 100; return mk(`${p}% liczby = ${part}`, x, [part * p / 100, x + part, x / 2].filter(v => Number.isInteger(v) && v !== x), { sub: 'Jaka to liczba?', ask: 'liczba', sol: `${p}% liczby ${x} to ${part}` });
  }, 1.2),
  T('Potęgi: działania', t => {
    const b = randi(2, 7), m = randi(2, 6), n = randi(2, 6);
    if (t === 1) return mk(`${b}${sup(m)} · ${b}${sup(n)} = ?`, `${b}${sup(m + n)}`, [`${b * b}${sup(m + n)}`, `${b}${sup(m + n + 1)}`], { mistake: m * n === m + n ? null : `${b}${sup(m * n)}` });
    if (t === 2) { const k = m + n; return mk(`${b}${sup(k)} : ${b}${sup(n)} = ?`, `${b}${sup(m)}`, [`${b}${sup(k + n)}`, `${b}${sup(m + 1)}`], { mistake: Number.isInteger(k / n) && k / n !== m ? `${b}${sup(k / n)}` : null }); }
    if (t === 3) return mk(`(${b}${sup(m)})${sup(n)} = ?`, `${b}${sup(m * n)}`, [`${b}${sup(m * n + 1)}`, `${b}${sup(m * n - 1)}`], { mistake: m + n === m * n ? null : `${b}${sup(m + n)}` });
    const r = Math.random();
    if (r < 0.3) return mk(`${randi(2, 99)}⁰ = ?`, 1, [0]);
    if (r < 0.65) { const c = randi(2, 3), e = randi(2, 5), v = (-c) ** e; return mk(`(${M}${c})${sup(e)} = ?`, v, [-v]); }
    const [a, c] = pick([[2, 5], [5, 2], [4, 5], [2, 3]]), e = randi(2, 4); return mk(`${a}${sup(e)} · ${c}${sup(e)} = ?`, `${a * c}${sup(e)}`, [`${a + c}${sup(e)}`], { mistake: `${a * c}${sup(2 * e)}` });
  }),
  T('Notacja wykładnicza', t => {
    if (t === 1) { const a = randi(2, 9), e = randi(3, 6); return mk(`${a} · 10${sup(e)} = ?`, N(a * 10 ** e), [N(a * 10 ** (e + 1)), N(a * 10 ** (e - 1))], { mistake: N(a * 10 * e) }); }
    if (t === 2) { const k = randi(11, 99), e = randi(3, 6), n = k * 10 ** (e - 1); if (k % 10 === 0) return K7[2].gen(2); return mk(`${N(n)} = ?`, `${D(k, 1)} · 10${sup(e)}`, [`${D(k, 1)} · 10${sup(e - 1)}`, `${D(k, 1)} · 10${sup(e + 1)}`], { sub: 'Zapisz w notacji wykładniczej', sol: `${N(n)} = ${D(k, 1)} · 10${sup(e)}` }); }
    if (t === 3) { const k = randi(11, 99), e = randi(2, 5); return mk(`${D(k, 1)} · 10${sup(e)} = ?`, N(k * 10 ** (e - 1)), [N(k * 10 ** e), N(k * 10 ** (e - 2))]); }
    const a = randi(2, 4), b = randi(2, Math.floor(9 / a)), e = randi(2, 4), f = randi(2, 4);
    return mk(`(${a} · 10${sup(e)}) · (${b} · 10${sup(f)}) = ?`, `${a * b} · 10${sup(e + f)}`, [`${a + b} · 10${sup(e + f)}`, `${a * b} · 10${sup(e + f + 1)}`], { mistake: e * f === e + f ? null : `${a * b} · 10${sup(e * f)}` });
  }, 1.2),
  T('Pierwiastki', t => {
    if (t === 1) { const a = randi(2, 15); return mk(`√${a * a} = ?`, a, [a + 1, a - 1], { mistake: a * a % 2 === 0 ? a * a / 2 : null }); }
    if (t === 2) { const a = randi(2, 6), neg = Math.random() < 0.35; return neg ? mk(`∛(${M}${a ** 3}) = ?`, -a, [a, -a - 1], { mistake: a }) : mk(`∛${a ** 3} = ?`, a, [a + 1, a - 1, a * a].filter(v => v > 0 && v !== a)); }
    if (t === 3) {
      if (Math.random() < 0.5) { let n; do { n = randi(5, 200); } while (Number.isInteger(Math.sqrt(n))); const k = Math.floor(Math.sqrt(n)); return mk(`√${n} jest między ? a ?`, `${k} i ${k + 1}`, [`${k - 1} i ${k}`, `${k + 1} i ${k + 2}`].filter(x => !x.startsWith('0 ')), { sub: 'Między którymi liczbami całkowitymi?', sol: `${k}² = ${k * k} < ${n} < ${(k + 1) ** 2} = ${k + 1}², więc √${n} jest między ${k} a ${k + 1}` }); }
      const a = randi(2, 5), b = randi(2, 5); return mk(`√(${a * a} · ${b * b}) = ?`, a * b, [a * a + b * b, a + b, a * b + 1].filter(v => v !== a * b));
    }
    if (Math.random() < 0.5) { const k = randi(2, 6), r = pick([2, 3, 5]); return mk(`√${k * k * r} = ?`, `${k}√${r}`, [`${r}√${k}`, `${k + 1}√${r}`], { sub: 'Wyłącz czynnik przed pierwiastek', mistake: `${k * k}√${r}` }); }
    const [x, y] = pick([[2, 8], [3, 12], [2, 18], [5, 20], [3, 27], [2, 32]]), v = Math.sqrt(x * y);
    return mk(`√${x} · √${y} = ?`, v, [v + 1, x * y], { mistake: Math.sqrt(y / x) });
  }),
  T('Wyrażenia algebraiczne', t => {
    if (t === 1) { const a = randi(2, 7), b = randi(1, 6), c = randi(1, a + b - 1); return mk(`${a}x + ${b}x ${M} ${c}x = ?`, term(a + b - c, 'x'), [term(a + b + c, 'x'), term(a + b - c + 1, 'x')], { mistake: `${a + b - c}x²` }); }
    if (t === 2) { const k = randi(2, 7), c = randi(1, 9), neg = Math.random() < 0.4; return mk(`${k}(x ${neg ? M : '+'} ${c}) = ?`, lin(k, 'x', neg ? -k * c : k * c), [lin(k, 'x', neg ? k * c : -k * c), lin(k + c, 'x', 0)], { mistake: lin(k, 'x', neg ? -c : c) }); }
    if (t === 3) {
      if (Math.random() < 0.5) { const c = randi(1, 9); return mk(`${M}(x ${M} ${c}) = ?`, lin(-1, 'x', c), [lin(1, 'x', c)], { mistake: lin(-1, 'x', -c) }); }
      const k = randi(2, 5), c = randi(1, 6), j = randi(1, k - 1); return mk(`${k}(a ${M} ${c}) ${M} ${term(j, 'a')} = ?`, lin(k - j, 'a', -k * c), [lin(k + j, 'a', -k * c), lin(k - j, 'a', k * c)], { mistake: lin(k - j, 'a', -c) });
    }
    const a = randi(1, 6), b = randi(1, 6);
    if (Math.random() < 0.5) return mk(`(x + ${a})(x + ${b}) = ?`, `x² + ${a + b}x + ${a * b}`, [`x² + ${a * b}x + ${a + b}`, `2x + ${a * b}`], { mistake: `x² + ${a * b}` });
    if (a === b) return K7[4].gen(4);
    const mid = b - a, mx = Math.abs(mid) === 1 ? 'x' : `${Math.abs(mid)}x`;
    return mk(`(x ${M} ${a})(x + ${b}) = ?`, `x² ${mid < 0 ? M : '+'} ${mx} ${M} ${a * b}`, [`x² ${mid < 0 ? '+' : M} ${mx} ${M} ${a * b}`, `x² + ${a + b}x ${M} ${a * b}`], { mistake: `x² ${M} ${a * b}` });
  }, 1.25),
  T('Równania', t => {
    const x = randi(2, 12);
    if (t === 1) { const a = randi(2, 9), b = randi(1, 20); return mk(`${a}x + ${b} = ${a * x + b}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: (a * x + 2 * b) % a === 0 ? (a * x + 2 * b) / a : null }); }
    if (t === 2) { const a = randi(2, 6), c = randi(1, x - 1); return mk(`${a}(x ${M} ${c}) = ${a * (x - c)}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: (a * (x - c) + c) % a === 0 && (a * (x - c) + c) / a !== x ? (a * (x - c) + c) / a : null }); }
    if (t === 3) { const d = randi(2, 6), v = randi(2, 9); return mk(`${FR('x', d)} = ${v}`, d * v, [d * v + d, v], { sub: 'x = ?', ask: 'x', mistake: d + v }); }
    if (Math.random() < 0.5) { const [a, b] = pick([[4, 3], [2, 5], [3, 2], [5, 4], [5, 2]]), k = randi(2, 4); return mk(`${FR('x', b * k)} = ${FR(a, b)}`, a * k, [a + k, a * b * k], { sub: 'Proporcja: x = ?', ask: 'x' }); }
    const a = randi(4, 8), c = randi(1, a - 2), b = randi(1, 10), d = (a - c) * x - b; if (d <= 0) return K7[5].gen(4);
    return mk(`${a}x ${M} ${b} = ${c}x + ${d}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: (d - b) % (a - c) === 0 && (d - b) / (a - c) > 0 && (d - b) / (a - c) !== x ? (d - b) / (a - c) : null });
  }, 1.25),
  T('Twierdzenie Pitagorasa', t => {
    const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25]];
    if (t <= 2) { const [a, b, c] = pick(t === 1 ? triples.slice(0, 2) : triples.slice(2)); return mk('c = ?', c, [c + 1, c - 1], { sub: `Trójkąt prostokątny, przyprostokątne ${a} i ${b}`, sol: `c = √(${a}² + ${b}²) = √${a * a + b * b} = ${c}`, mistake: a + b }); }
    if (t === 3) { const [a, b, c] = pick(triples); return mk('b = ?', b, [b + 1, b - 1].filter(v => v > 0), { sub: `Przeciwprostokątna ${c}, przyprostokątna ${a}`, sol: `b = √(${c}² − ${a}²) = √${c * c - a * a} = ${b}`, mistake: c - a === b ? null : c - a }); }
    const r = Math.random();
    if (r < 0.35) { const a = randi(2, 9); return mk('d = ?', `${a}√2`, [`${a}√3`, `${2 * a}`, `${a * 2}√2`], { sub: `Przekątna kwadratu o boku ${a}`, sol: `Przekątna kwadratu o boku ${a} = ${a}√2`, mistake: `${a}√3` }); }
    if (r < 0.65) { const a = 2 * randi(1, 6); return mk('h = ?', `${a / 2 === 1 ? '' : a / 2}√3`, [`${a}√3`, `${a / 2 === 1 ? '' : a / 2}√2`], { sub: `Wysokość trójkąta równobocznego o boku ${a}`, sol: `h = ${a}√3 : 2 = ${a / 2 === 1 ? '' : a / 2}√3`, mistake: `${a}√3` }); }
    const [a, b] = pick([[1, 2], [2, 3], [1, 3], [1, 4], [2, 4], [3, 5]]), s = a * a + b * b, out = simpleRoot(s);
    return mk('c = ?', out, [simpleRoot(s + 1), N(a + b)].filter(x => x !== out), { sub: `Trójkąt prostokątny, przyprostokątne ${a} i ${b}`, sol: `c = √(${a}² + ${b}²) = √${s} = ${out}` });
  }),
  T('Układ współrzędnych', t => {
    if (t === 1) { const y = randi(-5, 8), x1 = randi(-6, 4), x2 = x1 + 2 * randi(1, 5), m = (x1 + x2) / 2; return mk('S = ?', pt(m, y), [pt(m + 1, y), pt(x2 - x1, y), pt(m, y + 1)], { sub: `Środek odcinka A = ${pt(x1, y)}, B = ${pt(x2, y)}`, sol: `Środek odcinka ${pt(x1, y)} – ${pt(x2, y)}: S = ${pt(m, y)}` }); }
    if (t === 2) { const x1 = randi(-6, 6), y1 = randi(-6, 6), dx = 2 * randi(-4, 4), dy = 2 * randi(1, 4), x2 = x1 + dx, y2 = y1 + dy, mx = (x1 + x2) / 2, my = (y1 + y2) / 2; return mk('S = ?', pt(mx, my), [pt(my, mx), pt(dx / 2, dy / 2), pt(mx + 1, my)].filter(s => s !== pt(mx, my)), { sub: `Środek odcinka A = ${pt(x1, y1)}, B = ${pt(x2, y2)}`, sol: `S = (${N(x1)} + ${N(x2)}) : 2, (${N(y1)} + ${N(y2)}) : 2 = ${pt(mx, my)}` }); }
    if (t === 3) { const x = randi(-6, 6), y1 = randi(-6, 2), y2 = randi(y1 + 1, 9); return mk('|AB| = ?', y2 - y1, [Math.abs(y2 + y1), y2 - y1 + 1].filter(v => v !== y2 - y1 && v > 0), { sub: `A = ${pt(x, y1)}, B = ${pt(x, y2)}`, sol: `|AB| = ${N(y2)} − ${P(y1)} = ${y2 - y1}`, mistake: Math.abs(y2 + y1) !== y2 - y1 ? Math.abs(y2 + y1) : null }); }
    const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13]]), x1 = randi(-4, 4), y1 = randi(-4, 4), [dx, dy] = swap(a, b);
    return mk('|AB| = ?', c, [a + b, c + 1], { sub: `A = ${pt(x1, y1)}, B = ${pt(x1 + dx, y1 + dy)}`, sol: `|AB| = √(${dx}² + ${dy}²) = ${c}`, mistake: a + b });
  }, 1.2),
];

/* ============================================================
   KLASA 8: statystyka, prawdopodobieństwo, nierówności, równania, procenty, trójkąty i symetria, bryły, koło
   ============================================================ */
const ineq = (s, b) => `x ${s} ${N(b)}`;
const flip = s => ({ '>': '<', '<': '>', '≥': '≤', '≤': '≥' }[s]);
const K8 = [
  T('Średnia i mediana', t => {
    const n = t === 1 ? 3 : 4;
    if (t <= 2) { let xs, s; do { xs = Array.from({ length: n }, () => randi(1, 12)); s = xs.reduce((a, b) => a + b, 0); } while (s % n); return mk('Średnia = ?', s / n, [s, s / n + 1, s / n - 1].filter(v => v > 0 && v !== s / n), { sub: `Liczby: ${xs.join(', ')}`, sol: `Średnia liczb ${xs.join(', ')} = ${s} : ${n} = ${s / n}` }); }
    if (t === 3) { const xs = Array.from({ length: 5 }, () => randi(1, 20)), srt = [...xs].sort((a, b) => a - b), med = srt[2]; if (xs[2] === med) return K8[0].gen(3); return mk('Mediana = ?', med, [srt[1], srt[3]].filter(v => v !== med), { sub: `Liczby: ${xs.join(', ')}`, sol: `Po ułożeniu: ${srt.join(', ')}. Mediana = ${med}`, mistake: xs[2] }); }
    const avg = randi(4, 12), k = randi(3, 5); return mk(`Średnia ${k} liczb = ${avg}`, avg * k, [avg + k, avg * (k - 1), avg * k + avg], { sub: 'Ile wynosi ich suma?', ask: 'Suma', sol: `Suma = ${avg} · ${k} = ${avg * k}` });
  }),
  T('Prawdopodobieństwo', t => {
    if (t === 1) { const [txt, k] = pick([['liczba parzysta', 3], ['liczba nieparzysta', 3], ['szóstka', 1], ['liczba większa od 4', 2], ['liczba mniejsza od 3', 2], ['liczba podzielna przez 3', 2]]); return mk('P = ?', F(k, 6), [F(k, 12), F(6 - k, 6) === F(k, 6) ? F(k + 1, 6) : F(6 - k, 6), FR(1, k + 1)].filter(x => x !== F(k, 6)), { sub: `Rzut kostką: ${txt}`, sol: `Kostka, ${txt}: P = ${F(k, 6)}` }); }
    if (t === 2) { const r = randi(1, 6), b = randi(1, 7); return mk('P(czerwona) = ?', F(r, r + b), [F(b, r + b), F(r + 1, r + b + 1)].filter(x => x !== F(r, r + b)), { sub: `W worku ${r} czerwonych i ${b} niebieskich kul`, sol: `${r} czerwonych z ${r + b} kul: P = ${F(r, r + b)}`, mistake: F(r, b) }); }
    if (t === 3) { const [txt, k] = pick([['liczba pierwsza', 8], ['liczba podzielna przez 5', 4], ['liczba parzysta', 10], ['liczba większa od 15', 5], ['liczba podzielna przez 3', 6]]); return mk('P = ?', F(k, 20), [F(k + 1, 20), F(k, 10), F(20 - k, 20)].filter(x => x !== F(k, 20)), { sub: `Losujemy liczbę od 1 do 20: ${txt}`, sol: `${txt}: ${k} z 20, P = ${F(k, 20)}` }); }
    const [ch, k] = pick([['A', 3], ['M', 2], ['T', 2], ['K', 1], ['E', 1]]); return mk('P = ?', F(k, 10), [F(k, 9), F(k + 1, 10), F(1, 6)].filter(x => x !== F(k, 10)), { sub: `Losujemy literę ze słowa MATEMATYKA: litera ${ch}`, sol: `MATEMATYKA ma 10 liter, w tym ${k} × ${ch}: P = ${F(k, 10)}`, mistake: F(1, 6) });
  }, 1.1),
  T('Nierówności', t => {
    const s = pick(['>', '<', '≥', '≤']), r = randi(-5, 9);
    if (t === 1) { const a = randi(1, 9); return mk(`x + ${a} ${s} ${N(r + a)}`, ineq(s, r), [ineq(flip(s), r), ineq(s, r + 1)], { sub: 'Rozwiąż nierówność', mistake: ineq(s, r + 2 * a) }); }
    if (t === 2) { const k = randi(2, 6); return mk(`${k}x ${s} ${N(k * r)}`, ineq(s, r), [ineq(flip(s), r), ineq(s, r + 1)], { sub: 'Rozwiąż nierówność', mistake: ineq(s, k * r - k) }); }
    if (t === 3) { const k = randi(2, 5), c = randi(1, 9), wrongR = (k * r - 2 * c) / k; return mk(`${k}x ${M} ${c} ${s} ${N(k * r - c)}`, ineq(s, r), [ineq(flip(s), r), ineq(s, r + 1)], { sub: 'Rozwiąż nierówność', mistake: Number.isInteger(wrongR) ? ineq(s, wrongR) : null }); }
    const k = randi(2, 5); return mk(`${M}${k}x ${s} ${N(-k * r)}`, ineq(flip(s), r), [ineq(s, r), ineq(flip(s), -r)].filter(x => x !== ineq(flip(s), r)), { sub: 'Uwaga: dzielisz przez liczbę ujemną', mistake: ineq(s, r) });
  }, 1.25),
  T('Równania i proporcje', t => {
    const x = randi(2, 12);
    if (t === 1) { const d = randi(2, 5), b = randi(1, 9); return mk(`${FR('x', d)} + ${b} = ${x + b}`, d * x, [d * x + b, d * (x + b)], { sub: 'x = ?', ask: 'x', mistake: x }); }
    if (t === 2) { const a = randi(2, 5), c = randi(1, 6), v = a * (x + c) - x; return mk(`${a}(x + ${c}) ${M} x = ${v}`, x, [x + 1, x - 1], { sub: 'x = ?', ask: 'x', mistake: (v - c) % (a - 1) === 0 && (v - c) / (a - 1) > 0 && (v - c) / (a - 1) !== x ? (v - c) / (a - 1) : null }); }
    if (t === 3) { const [a, b] = pick([[3, 4], [2, 3], [5, 2], [4, 5], [3, 2]]), k = randi(2, 5); return mk(`${FR(a, 'x')} = ${FR(a * k, b * k)}`, b, [b * k, a * k, b + 1].filter(v => v !== b), { sub: 'Proporcja: x = ?', ask: 'x' }); }
    const d = pick([2, 3, 4]), c = randi(1, 5), v = randi(2, 8), xx = d * v - c;
    return mk(`${FR(`x + ${c}`, d)} = ${v}`, xx, [d * v, xx + 1, xx - 1], { sub: 'x = ?', ask: 'x', mistake: d * v + c });
  }, 1.3),
  T('Procenty w praktyce', t => {
    if (t === 1) { const w = 100 * randi(1, 9), v = w * 123 / 100; return mk(`${w} zł + 23% VAT = ?`, zl(v), [zl(w * 12 / 10), zl(w * 132 / 100)], { sub: 'Cena z podatkiem VAT', sol: `${w} zł + 23% VAT = ${zl(v)}`, mistake: zl(w + 23) }); }
    if (t === 2) { const k = pick([1000, 2000, 5000]), p = pick([2, 4, 5, 6]), v = k + k * p / 100; return mk(`${N(k)} zł, ${p}% na rok`, zl(v), [zl(k + k * p / 10), zl(k + 2 * k * p / 100)], { sub: 'Lokata w banku: ile będzie po roku?', sol: `${N(k)} zł + ${p}% = ${zl(v)}`, mistake: zl(k + p) }); }
    if (t === 3) { const [a, b] = pick([[40, 50], [80, 100], [50, 60], [20, 25], [200, 250], [60, 45], [80, 60], [50, 40]]), p = Math.round((b - a) / a * 100), q = Math.round((b - a) / b * 100); return mk(`${a} zł → ${b} zł`, `${p > 0 ? '+' : M}${Math.abs(p)}%`, [`${p > 0 ? '+' : M}${Math.abs(b - a)}%`].filter(x => x !== `${p > 0 ? '+' : M}${Math.abs(p)}%`), { sub: 'O ile procent zmieniła się cena?', sol: `${a} zł → ${b} zł: ${p > 0 ? 'wzrost' : 'spadek'} o ${Math.abs(p)}%`, mistake: q !== p ? `${p > 0 ? '+' : M}${Math.abs(q)}%` : null }); }
    const p = pick([10, 20, 25, 50]), before = 20 * randi(2, 20), after = before - before * p / 100, naive = after * p / 100;
    return mk(`Po obniżce o ${p}%: ${zl(after)}`, zl(before), [zl(after + p), zl(before + 10)], { sub: 'Ile kosztowało przed obniżką?', sol: `Przed obniżką ${zl(before)}, bo ${zl(before)} − ${p}% = ${zl(after)}`, mistake: Number.isInteger(naive) && after + naive !== before ? zl(after + naive) : null });
  }, 1.3),
  T('Trójkąty i symetria', t => {
    if (t <= 2) {
      const a = randi(2, 9), b = randi(2, 9), ok = Math.random() < 0.5, lo = Math.abs(a - b) + 1, hi = a + b - 1;
      const c = ok ? randi(lo, hi) : (Math.random() < 0.5 || lo <= 1 ? a + b + randi(0, 3) : randi(1, Math.abs(a - b)));
      if (c < 1) return K8[5].gen(t);
      const yes = a + b > c && a + c > b && b + c > a;
      return mk(`Czy z odcinków ${a}, ${b} i ${c} zbudujesz trójkąt?`, yes ? 'tak' : 'nie', [yes ? 'nie' : 'tak'], { sol: `${a}, ${b}, ${c}: ${yes ? 'tak' : 'nie'}, bo ${yes ? 'każdy bok jest krótszy od sumy dwóch pozostałych' : 'jeden bok nie jest krótszy od sumy dwóch pozostałych'}` });
    }
    if (t === 3) { const [f, k] = pick([['kwadrat', 4], ['prostokąt', 2], ['trójkąt równoboczny', 3], ['romb', 2], ['sześciokąt foremny', 6], ['trójkąt równoramienny', 1], ['pięciokąt foremny', 5]]); return mk('Liczba osi symetrii = ?', k, [k + 1, k * 2, k - 1].filter(v => v >= 0 && v !== k), { sub: `Ile osi symetrii ma ${f}?`, sol: `${f[0].toUpperCase() + f.slice(1)} ma ${k} ${k === 1 ? 'oś' : k < 5 ? 'osie' : 'osi'} symetrii` }); }
    let x = randi(-7, 7), y = randi(-7, 7); if (!x) x = 3; if (!y) y = -2;
    const [txt, sx, sy] = pick([['osi x', x, -y], ['osi y', -x, y], ['punktu (0, 0)', -x, -y]]);
    return mk('A′ = ?', pt(sx, sy), [pt(-sx, -sy), pt(y, x), pt(sx === x ? -x : x, sy === y ? -y : y)].filter(s => s !== pt(sx, sy)), { sub: `Punkt symetryczny do A = ${pt(x, y)} względem ${txt}`, sol: `Względem ${txt}: A = ${pt(x, y)} → A′ = ${pt(sx, sy)}` });
  }, 1.2),
  T('Graniastosłupy i ostrosłupy', t => {
    if (t === 1) { const pp = randi(3, 20), h = randi(2, 9); return mk('V = ? cm³', pp * h, [pp + h, pp * h * 2], { sub: `Graniastosłup: pole podstawy ${pp} cm², wysokość ${h} cm`, sol: `V = ${pp} · ${h} = ${pp * h} cm³`, mistake: Number.isInteger(pp * h / 3) ? pp * h / 3 : null }); }
    if (t === 2) { const a = randi(2, 8), h = randi(2, 10); return mk('V = ? cm³', a * a * h, [a * h, 4 * a * h, a * a + h], { sub: `Graniastosłup prawidłowy czworokątny: krawędź podstawy ${a} cm, wysokość ${h} cm`, sol: `V = ${a}² · ${h} = ${a * a * h} cm³` }); }
    if (t === 3) { const pp = 3 * randi(2, 10), h = randi(2, 9); return mk('V = ? cm³', pp * h / 3, [pp * h, pp * h / 3 + h], { sub: `Ostrosłup: pole podstawy ${pp} cm², wysokość ${h} cm`, sol: `V = ${FR(1, 3)} · ${pp} · ${h} = ${pp * h / 3} cm³`, mistake: pp * h }); }
    const a = 3 * randi(1, 4), h = randi(2, 9); return mk('V = ? cm³', a * a * h / 3, [a * a * h, a * h], { sub: `Ostrosłup prawidłowy czworokątny: krawędź podstawy ${a} cm, wysokość ${h} cm`, sol: `V = ${FR(1, 3)} · ${a}² · ${h} = ${a * a * h / 3} cm³`, mistake: a * a * h });
  }, 1.3),
  T('Koło i okrąg', t => {
    const r = randi(2, 10);
    if (t === 1) return mk('P = ?', `${r * r}π`, [`${r}π`, `${r * r * 2}π`], { sub: `Pole koła o promieniu ${r}`, sol: `P = π · ${r}² = ${r * r}π`, mistake: `${2 * r}π` });
    if (t === 2) return mk('Obwód = ?', `${2 * r}π`, [`${r}π`, `${4 * r}π`], { sub: `Obwód okręgu o promieniu ${r}`, sol: `Obwód = 2π · ${r} = ${2 * r}π`, mistake: `${r * r}π` });
    if (t === 3) { const d = 2 * r; return mk('P = ?', `${r * r}π`, [`${d}π`, `${r}π`], { sub: `Pole koła o średnicy ${d}`, sol: `Średnica ${d}, więc promień ${r}: P = ${r * r}π`, mistake: `${d * d}π` }); }
    return Math.random() < 0.5 ? mk('r = ?', r, [2 * r, r * r, r + 1].filter(v => v !== r), { sub: `Obwód okręgu = ${2 * r}π`, sol: `2πr = ${2 * r}π, więc r = ${r}` })
      : mk('r = ?', r, [r * r, 2 * r, r + 1].filter(v => v !== r), { sub: `Pole koła = ${r * r}π`, sol: `πr² = ${r * r}π, więc r = ${r}` });
  }, 1.2),
];

const KLASY = [
  { nr: 1, opis: 'Liczby do 20, porównywanie, pieniądze', tematy: K1 },
  { nr: 2, opis: 'Liczby do 100, mnożenie i dzielenie do 30', tematy: K2 },
  { nr: 3, opis: 'Tabliczka mnożenia, liczby do 1000, jednostki', tematy: K3 },
  { nr: 4, opis: 'Działania pisemne, kwadraty, pierwsze ułamki', tematy: K4 },
  { nr: 5, opis: 'Potęgi, podzielność, ułamki, kąty i pola', tematy: K5 },
  { nr: 6, opis: 'Liczby całkowite, procenty, wyrażenia, równania', tematy: K6 },
  { nr: 7, opis: 'Potęgi, pierwiastki, wyrażenia, Pitagoras', tematy: K7 },
  { nr: 8, opis: 'Statystyka, prawdopodobieństwo, bryły, koło', tematy: K8 },
];

// Stage s (0–39) of class c: 8 topics × (4 levels + a review); stage 40 is the test of the whole class
function stage(c, s) {
  const K = KLASY[c], b = Math.floor(s / 5), pos = s % 5;
  if (pos < 4) { const tm = K.tematy[b]; return { name: tm.nazwa, tier: pos + 1, review: false, final: false, gen: () => tm.gen(pos + 1), time: tm.czas }; }
  const final = s === 39, pool = K.tematy.slice(0, final ? K.tematy.length : b + 1);
  const gen = () => { const i = final ? randi(0, pool.length - 1) : (Math.random() < 0.4 ? b : randi(0, b)); return pool[i].gen(randi(2, 4)); };
  return { name: final ? `Sprawdzian: klasa ${c + 1}` : 'Powtórka', tier: 4, review: true, final, gen, time: Math.max(...pool.map(tm => tm.czas)) };
}

globalThis.Zadania = { KLASY, stage, _test: { roman, simpleRoot, nice } };
})();
