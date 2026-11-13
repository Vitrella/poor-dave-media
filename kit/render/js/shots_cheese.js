import { lerp, easeInOut, easeOut, easeIn, prog, smooth, V3, lerpV } from './util.js';
const GOLD = '#f2c85b';
function camKeys(keys) { return (tl) => { if (tl <= keys[0].t) return keys[0]; for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (tl <= b.t) { const k = easeInOut(prog(tl, a.t, b.t)); return { pos: lerpV(a.pos, b.pos, k), look: lerpV(a.look, b.look, k), fov: lerp(a.fov ?? 44, b.fov ?? 44, k) }; } } return keys[keys.length - 1]; }; }
const K = (t, pos, look, fov) => ({ t, pos: V3(...pos), look: V3(...look), fov });
const mv = (p0, p1, l0, l1, fov = 44, d = 3) => camKeys([K(0, p0, l0, fov), K(d, p1, l1, fov)]);

export function overlayCfgCheese(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on;
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (t) => {
    if (t < m.minute) { const v = t - ON; const s = Math.floor(v); const ms = Math.floor((v - s) * 1000); return `0:00:${pad(s)}.${String(ms).padStart(3, '0')}`; }
    if (t < sc.heat.start) { const k = easeOut(prog(t, m.minute, m.minute + 0.6)); const v = lerp(11, 60, k); return `0:${pad(Math.floor(v / 60))}:${pad(Math.floor(v % 60))}.${String(Math.floor((v % 1) * 1000)).padStart(3, '0')}`; }
    if (t < m.weeks) { const d = 1 + Math.floor(easeOut(prog(t, sc.heat.start, m.melts)) * 1.0); return `DAY ${d}`; }
    if (t < sc.pressure.start) { const d = 1 + Math.floor(easeOut(prog(t, m.weeks, m.weeks + 1.2)) * 13.4); return `DAY ${d}`; }
    if (t < sc.bright.start) return '1 MONTH';
    if (t < m.million) return '1 YEAR';
    if (t < sc.end.start) { const k = easeOut(prog(t, m.million, m.million + 1.6)); const yrs = Math.pow(10, lerp(0, 6, k)); return `${Math.round(yrs).toLocaleString('en-GB')} YRS`; }
    return '1,000,000 YRS';
  };
  return {
    title: [[{ t: 'What if ' }, { t: 'the Moon', c: GOLD }, { t: ' was' }], [{ t: 'made of ' }, { t: 'cheese?', c: GOLD }]],
    titleFrom: 0.3, titleTo: 4.9,
    counter: { from: ON - 0.05, label: (t) => 'TIME SINCE CHEESE', fmt, color: (t) => t >= sc.end.start ? GOLD : '#fff', font: '700 84px "Playfair Display"' },
    status: [[sc.dave.start, 'DAVE’S INVITATION PHOTO · TAKE 1'], [m.job, 'DAVE · ONE JOB'], [ON, 'THE MOON · CHEESE'], [m.weighs, 'THE MOON · 2.4 × 10²² KG'], [sc.vacuum.start, 'DAVE · ADJUSTING EXPOSURE'], [m.melts, 'DAVE · STILL ADJUSTING'], [sc.pressure.start, 'PRIYA · WAITING'], [sc.gravity.start, 'DAVE · TAKE 2'], [sc.tides.start, 'DAVE · TAKE 3'], [m.brighter, 'DAVE · EXPOSURE −5 STOPS'], [m.white, 'PHOTO · A WHITE CIRCLE'], [sc.calories.start, 'PRIYA · “IT’S A PLATE”'], [m.million, 'DAVE · STILL HERE'], [m.photo, 'PHOTO · TAKEN'], [m.priya, 'PRIYA · “IT’S A BISCUIT”']],
    callouts: [
      [m.moon0, m.invitation - 0.1, 'FRIDAY · 21:40', 'THE MOON'],
      [m.invitation, m.job - 0.1, 'WEDDING INVITATION', 'BIG · ROUND · ROMANTIC'],
      [m.job, ON - 0.1, 'DAVE', 'ONE JOB'],
      [ON, m.allofit - 0.1, 'THE MOON', 'CHEESE'],
      [m.allofit, m.instantly - 0.1, 'ALL OF IT', '2.2 × 10¹⁰ KM³'],
      [m.instantly, sc.density.start - 0.1, 'TRANSITION', 'INSTANT'],
      [m.third, m.weighs - 0.1, 'DENSITY', '3.3 → 1.1 G/CM³'],
      [m.weighs, m.same - 0.1, 'MASS', '7.3 → 2.4 × 10²² KG'],
      [m.same, m.gravitas - 0.1, 'DIAMETER', '3,474 KM'],
      [m.gravitas, sc.vacuum.start - 0.1, 'GRAVITAS', 'REDUCED'],
      [m.air, m.minute - 0.1, 'LUNAR ATMOSPHERE', '≈ 0 ATM'],
      [m.minute, m.freeze - 0.1, 'WATER IN CHEDDAR', '37% → BOILS'],
      [m.freeze, sc.heat.start - 0.1, 'THE MOON', 'FREEZE-DRIED'],
      [m.sunlit, m.melts - 0.1, 'LUNAR DAY · EQUATOR', '+121 °C'],
      [m.melts, m.weeks - 0.1, 'MILK FAT', 'LIQUID ABOVE ≈ 35 °C'],
      [m.weeks, m.thirty - 0.1, 'LUNAR DAY', '29.5 EARTH DAYS'],
      [m.thirty, sc.pressure.start - 0.1, 'LUNAR NIGHT', '−133 °C'],
      [m.centre, m.atmospheres - 0.1, 'CENTRE OF A CHEESE MOON', '0.5 GPA'],
      [m.atmospheres, m.scientists - 0.1, 'PRESSURE', '≈ 5,000 ATM'],
      [m.scientists, m.premium - 0.1, 'HIGH-PRESSURE PROCESSING', '400–600 MPA'],
      [m.premium, sc.gravity.start - 0.1, 'THE CORE', 'PREMIUM'],
      [m.gravity, m.seven - 0.1, 'SURFACE GRAVITY', '1.62 → 0.53 M/S²'],
      [m.seven, m.landing - 0.1, 'STANDING JUMP', '0.4 M → 7 M'],
      [m.landing, sc.tides.start - 0.1, 'LANDING', 'THE PROBLEM'],
      [m.tides, m.half - 0.1, 'TIDAL FORCE', '∝ MASS / DISTANCE³'],
      [m.half, m.boats - 0.1, 'TIDAL RANGE', '−46%'],
      [m.boats, m.surfers - 0.1, 'BOATS', 'ON MUD'],
      [m.surfers, sc.bright.start - 0.1, 'SURFERS', 'WALKING HOME'],
      [m.pale, m.carpark - 0.1, 'ALBEDO · CHEESE', '≈ 0.6 (EST.)'],
      [m.carpark, m.brighter - 0.1, 'ALBEDO · MOON ROCK', '0.12'],
      [m.brighter, m.white - 0.1, 'FULL MOON', '×5 BRIGHTER'],
      [m.white, sc.calories.start - 0.1, 'DAVE’S PHOTO', 'A WHITE CIRCLE'],
      [m.feed, m.sixteen - 0.1, 'CHEDDAR', '403 KCAL / 100 G'],
      [m.sixteen, m.universe - 0.1, 'LUNCH FOR 8 BILLION', '16,000,000,000 YEARS'],
      [m.universe, sc.future.start - 0.1, 'AGE OF THE UNIVERSE', '13,800,000,000 YEARS'],
      [m.million, m.toast - 0.1, 'SPACE WEATHERING', '10⁶ YEARS'],
      [m.toast, m.dry - 0.1, 'MICROMETEORITES · SOLAR WIND', 'TOASTED'],
      [m.dry, sc.end.start - 0.1, 'SURFACE', 'DRY · DARK · CRACKED'],
      [sc.end.start, m.photo - 0.1, 'THE MOON', 'TECHNICALLY A BISCUIT'],
      [m.photo, m.priya - 0.1, 'DAVE', 'GETS HIS PHOTO'],
      [m.priya, sc.endcard.start - 0.1, 'PRIYA', '“IT LOOKS LIKE A BISCUIT”'],
    ],
    end: { lines: ['A CHEESE MOON: ⅓ THE MASS, 16 BILLION YEARS OF LUNCH.', 'THE UNIVERSE IS 13.8 BILLION YEARS OLD.'] },
  };
}

export function buildShotsCheese(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on;
  const shots = []; const add = (id, from, to, set, cam, ctx) => shots.push({ id, from, to, set, cam, ctx });
  const flashAt = (t, t0, a = 0.55) => t >= t0 ? Math.max(0, a - (t - t0) * 2.3) : 0;
  const MOON = (t) => t < ON ? 'rock' : (t >= m.million ? 'biscuit' : 'cheese');
  const hill = (t, o = {}) => ({ moon: MOON(t), ...o });
  // hill cameras (Dave at origin facing -z, tripod at (-0.55,0,-0.75), Priya at (1.15,0,-0.1))
  const H_WIDE = mv([5.5, 2.4, 6.5], [5.0, 2.5, 6.0], [0, 2.4, -6], [0, 2.5, -6], 48);
  const H_MED = mv([2.8, 1.6, 2.6], [2.5, 1.55, 2.3], [0.3, 1.1, -0.5], [0.3, 1.1, -0.5], 44);
  const H_FACE = mv([-1.7, 1.55, -0.1], [-1.6, 1.55, -0.08], [0, 1.55, 0.05], [0, 1.55, 0.05], 32);
  const H_FACE_MOON = mv([-2.1, 1.25, -0.15], [-2.0, 1.27, -0.15], [0.3, 1.95, 0.1], [0.3, 1.95, 0.1], 40);
  const H_PRIYA = mv([1.9, 1.5, -1.7], [1.8, 1.5, -1.6], [1.15, 1.4, -0.1], [1.15, 1.4, -0.1], 36);
  const H_HIGH = mv([-5, 9, 9], [-4, 8.5, 8], [0, 0.6, -3], [0, 0.6, -3], 50);
  const H_BACK = mv([0.9, 1.9, 2.4], [0.8, 1.85, 2.2], [-0.4, 1.6, -4], [-0.4, 1.6, -4], 46);
  // ---- hook / intro
  add('h1', 0, 1.25, 'hill', H_FACE_MOON, (t) => ({ moon: 'cheese', moonPos: 'cam', dave: 'cam', priya: 'look', wide: 0.6, open: 0.25 }));
  add('h2', 1.25, 2.55, 'moon', mv([2, 3, 30], [1, 2.5, 27], [0, 0, 0], [0, 0, 0], 42), (t) => ({ cheese: 1, rotY: 0.6 + (t - 1.25) * 0.08, earth: true }));
  add('h3', 2.55, sc.dave.start, 'hill', H_WIDE, (t) => hill(t, { dave: 'shoot', priya: 'point' }));
  // ---- dave
  add('d1', sc.dave.start, 4.75, 'hill', H_MED, (t) => hill(t, { dave: 'shoot', priya: 'point' }));
  add('d2', 4.75, 6.25, 'card', mv([0.1, 1.15, 0.75], [0.08, 1.1, 0.7], [0, 0, 0.02], [0, 0, 0.02], 40), (t) => ({ variant: 'blank' }));
  add('d3', 6.25, sc.event.start, 'hill', H_FACE, (t) => hill(t, { dave: 'cam', priya: 'card', wide: 0.1 }));
  // ---- event
  add('e1', sc.event.start, m.allofit - 0.05, 'moon', mv([0, 1.5, 31], [0, 1.5, 29], [0, 0, 0], [0, 0, 0], 44), (t) => ({ cheese: easeOut(prog(t, ON, ON + 0.35)), wobble: t > ON ? Math.max(0, 1 - (t - ON) * 1.5) : 0, rotY: 0.6, flash: flashAt(t, ON) }));
  add('e2', m.allofit - 0.05, m.instantly - 0.05, 'earth', mv([70, 40, 300], [66, 38, 292], [110, 10, -40], [110, 10, -40], 46), (t) => ({ cheese: 1, pulse: (t - (m.allofit - 0.05)) * 0.9, moonA: 0.3 }));
  add('e3', m.instantly - 0.05, sc.density.start, 'hill', H_BACK, (t) => hill(t, { dave: 'look', priya: 'face', flash: flashAt(t, m.instantly, 0.3) }));
  // ---- density
  add('n1', sc.density.start, 14.35, 'studio', mv([0.4, 2.5, 8.6], [0.3, 2.45, 8.2], [0, 2.1, 0], [0, 2.1, 0], 46), (t) => ({ prop: 'blocks', k: prog(t, m.third - 0.2, m.third + 0.8) }));
  add('n2', 14.35, m.weighs - 0.05, 'studio', mv([0.6, 2.5, 6.6], [0.5, 2.45, 6.3], [-0.4, 1.9, 0], [-0.4, 1.9, 0], 46), (t) => ({ prop: 'weigh', k: 0 }));
  add('n3', m.weighs - 0.05, m.same - 0.05, 'studio', mv([-0.5, 3.4, 2.7], [-0.55, 3.38, 2.55], [-0.75, 3.3, -0.3], [-0.75, 3.3, -0.3], 36), (t) => ({ prop: 'weigh', k: prog(t, m.weighs, m.weighs + 1.0) }));
  add('n4', m.same - 0.05, m.gravitas - 0.05, 'moon', mv([0, 0, 36], [0, 0, 34], [0, 0, 0], [0, 0, 0], 48), (t) => ({ cheese: 1, ring: true, rotY: 0.6 + (t - m.same) * 0.1, earth: false }));
  add('n5', m.gravitas - 0.05, sc.vacuum.start, 'hill', H_FACE, (t) => hill(t, { dave: 'tilt', priya: 'card', wide: 0.2 }));
  // ---- vacuum
  add('v1', sc.vacuum.start, m.minute - 0.05, 'moon', mv([14, 10, 26], [13.5, 9.7, 25], [3.6, 6.3, -4.2], [3.6, 6.3, -4.2], 40), (t) => ({ cheese: 1, rotY: 0.6, vent: prog(t, m.air + 0.2, m.air + 0.8), earth: false }));
  add('v2', m.minute - 0.05, 24.4, 'surface', mv([4.5, 1.7, 5.0], [4.0, 1.6, 4.5], [0, 1.4, -1], [0, 1.4, -1], 48), (t) => ({ astro: 'shield', vent: prog(t, m.minute - 0.05, m.minute + 0.4), earth: true }));
  add('v3', 24.4, m.freeze - 0.05, 'moon', mv([0, 3, 34], [0, 2.5, 31], [0, 0, 0], [0, 0, 0], 44), (t) => ({ cheese: 1, rotY: 0.9, vent: 1, earth: true }));
  add('v4', m.freeze - 0.05, sc.heat.start, 'studio', mv([0.8, 2.3, 5.4], [0.6, 2.25, 5.1], [0.4, 1.7, 0], [0.4, 1.7, 0], 44), (t) => ({ prop: 'dried', k: prog(t, m.freeze - 0.05, m.freeze + 0.7), boil: true }));
  // ---- heat
  add('t1', sc.heat.start, m.twenty + 0.2, 'moon', mv([-4, 3, 33], [-3, 2.6, 31], [0, 0, 0], [0, 0, 0], 44), (t) => ({ cheese: 1, rotY: 0.6, melt: prog(t, m.twenty - 0.3, m.twenty + 0.6), meltU: 0.25, sunX: 1, earth: true }));
  add('t1b', m.twenty + 0.2, m.melts - 0.05, 'moon', mv([15, 9, 25], [14.5, 8.8, 24], [4.2, 5.8, -4.6], [4.2, 5.8, -4.6], 40), (t) => ({ cheese: 1, rotY: 0.6, melt: 1, meltU: 0.25, sunX: 1, earth: false }));
  add('t2', m.melts - 0.05, m.weeks - 0.05, 'surface', mv([1.9, 0.75, 2.5], [1.75, 0.7, 2.3], [0.3, 0.45, -0.5], [0.3, 0.45, -0.5], 44), (t) => ({ astro: 'stand', melt: 1, earth: true }));
  add('t3', m.weeks - 0.05, 33.0, 'moon', camKeys([K(0, [12, 4, 28], [0, 0, 0], 44), K(1.3, [-12, 4, 28], [0, 0, 0], 44)]), (t) => ({ cheese: 1, melt: 1, meltU: 0.25 + (t - m.weeks) * 0.22, rotY: 0.6 + (t - m.weeks) * 1.4, earth: true }));
  add('t4', 33.0, m.sets - 0.05, 'moon', mv([-6, 4, 28], [-7, 4, 27], [-1, 0, 0], [-1, 0, 0], 44), (t) => ({ cheese: 1, melt: 1, meltU: 0.75, rotY: 0.6 + 2.6, sunX: -0.5, sunZ: -1, amb: 2.2, earth: true }));
  add('t5', m.sets - 0.05, sc.pressure.start, 'surface', mv([3.2, 1.3, 3.4], [3.0, 1.25, 3.1], [0, 0.9, 0], [0, 0.9, 0], 46), (t) => ({ astro: 'slip', night: 1, earth: true }));
  // ---- pressure
  add('p1', sc.pressure.start, 37.3, 'moon', mv([-31, 4, 8], [-29, 3.5, 7.5], [0, 0, 0], [0, 0, 0], 46), (t) => ({ cheese: 1, cut: true, cutRot: 0.0, sunX: -1, sunZ: 1, earth: false }));
  add('p2', 37.3, m.scientists - 0.05, 'studio', mv([0.6, 2.4, 7.0], [0.5, 2.3, 6.6], [0, 2.0, 0], [0, 2.0, 0], 46), (t) => ({ prop: 'press', k: prog(t, 37.4, m.atmospheres + 0.6) }));
  add('p3', m.scientists - 0.05, 41.1, 'studio', mv([-1.6, 1.9, 4.6], [-1.7, 1.85, 4.3], [-1.9, 1.4, 0.4], [-1.9, 1.4, 0.4], 42), (t) => ({ prop: 'press', k: 1, nod: true, hpp: t > m.scientists + 0.5 }));
  add('p4', 41.1, 42.4, 'studio', mv([1.6, 1.6, 3.2], [1.5, 1.55, 3.0], [0.1, 1.0, 0], [0.1, 1.0, 0], 40), (t) => ({ prop: 'press', k: 1, hpp: false }));
  add('p4b', 42.4, 43.3, 'studio', mv([0.35, 0.95, 2.0], [0.33, 0.93, 1.9], [0.1, 0.62, 0], [0.1, 0.62, 0], 36), (t) => ({ prop: 'press', k: 1, sticker: t > m.premium + 0.15, nod: true }));
  add('p5', 43.3, sc.gravity.start, 'hill', H_PRIYA, (t) => hill(t, { dave: 'knob', priya: 'cam', pwide: 0.2 }));
  // ---- gravity
  add('g1', sc.gravity.start, 45.7, 'studio', mv([0.4, 4.6, 11.8], [0.3, 4.5, 11.4], [0, 4.3, 0], [0, 4.3, 0], 50), (t) => ({ prop: 'jump', k: prog(t, m.gravity + 0.1, m.gravity + 1.9) }));
  add('g2', 45.7, m.seven - 0.05, 'surface', mv([2.6, 0.5, 3.6], [2.4, 0.5, 3.4], [0, 3.0, -0.5], [0, 4.2, -0.5], 54), (t) => ({ astro: 'jump', jumpK: prog(t, 45.7, 47.7) * 0.5, earth: true, ruler: true }));
  add('g3', m.seven - 0.05, m.landing - 0.05, 'surface', mv([7, 7.2, 8], [6.5, 7.0, 7.5], [0, 6.8, 0], [0, 6.8, 0], 44), (t) => ({ astro: 'jump', jumpK: 0.5 + prog(t, m.seven - 0.05, m.landing + 0.3) * 0.5, earth: true, lblJump: true, ruler: true }));
  add('g4', m.landing - 0.05, sc.tides.start, 'surface', mv([1.7, 0.4, 1.5], [1.6, 0.38, 1.4], [0, 0.2, 0], [0, 0.2, 0], 40), (t) => ({ astro: 'sink', sinkK: prog(t, m.landing + 0.1, m.landing + 0.7), strings: prog(t, m.landing + 0.3, m.landing + 1.0), earth: true }));
  // ---- tides
  add('w1', sc.tides.start, 52.0, 'earth', mv([35, 50, 330], [32, 48, 322], [85, 0, -20], [85, 0, -20], 46), (t) => ({ cheese: 1, showBulge: true, bulge: 1 - 0.6 * easeOut(prog(t, m.tides + 0.8, m.tides + 1.6)), moonA: 0.15, month: false }));
  add('w2', 52.0, 53.7, 'studio', mv([0.3, 2.3, 7.0], [0.2, 2.25, 6.7], [0.2, 1.6, 0], [0.2, 1.6, 0], 46), (t) => ({ prop: 'tide', k: prog(t, 52.1, 53.2) }));
  add('w3', 53.7, m.boats - 0.05, 'coast', mv([-16, 14, 24], [-14, 13, 21], [-2, -4, -50], [-2, -4, -50], 52), (t) => ({ lift: -3 * easeOut(prog(t, 53.7, m.half + 0.4)), shipDrop: 2.5 * easeOut(prog(t, 53.7, m.half + 0.4)), surferK: -1 }));
  add('w4', m.boats - 0.05, m.surfers - 0.05, 'coast', mv([-14, 3, -4], [-13, 3.2, -5], [-28, 0, -16], [-28, 0, -16], 44), (t) => ({ lift: -3, shipDrop: 2.5, surferK: -1 }));
  add('w5', m.surfers - 0.05, sc.bright.start, 'coast', mv([7, 1.8, 2], [6.5, 1.7, 1.5], [4, 0.5, -14], [4, 0.5, -14], 42), (t) => ({ lift: -3, shipDrop: 2.5, surferK: prog(t, m.surfers - 0.05, m.surfers + 1.9) * 0.55, labels: false }));
  // ---- bright
  add('b1', sc.bright.start, 60.2, 'studio', mv([0.2, 2.4, 7.6], [0.15, 2.35, 7.3], [0, 1.7, 0], [0, 1.7, 0], 46), (t) => ({ prop: 'albedo', k: prog(t, m.pale, m.pale + 0.8) }));
  add('b2', 60.2, m.carpark + 0.9, 'studio', mv([-0.9, 2.2, 2.4], [-0.9, 2.1, 2.2], [-0.9, 1.3, 0], [-0.9, 1.3, 0], 36), (t) => ({ prop: 'albedo', k: 1 }));
  add('b3', m.carpark + 0.9, m.brighter - 0.05, 'city', mv([70, 85, 110], [62, 80, 98], [0, 0, 0], [0, 0, 0], 46), (t) => ({ mode: 'traffic', bright: 0 }));
  add('b4', m.brighter - 0.05, 65.3, 'city', mv([20, 30, 40], [18, 28, 36], [0, 4, 0], [0, 4, 0], 50), (t) => ({ mode: 'traffic', bright: easeOut(prog(t, m.brighter, m.brighter + 0.6)) }));
  add('b5', 65.3, m.white - 0.05, 'hill', H_MED, (t) => hill(t, { dave: 'press', priya: 'card', bright: 1, shield: true, flashK: flashAt(t, 65.9, 1), flash: flashAt(t, 65.9, 0.4) }));
  add('b6', m.white - 0.05, sc.calories.start, 'card', mv([0.1, 1.15, 0.75], [0.08, 1.1, 0.7], [0, 0, 0.02], [0, 0, 0.02], 40), (t) => ({ variant: 'white', k: prog(t, m.white, m.white + 0.4) }));
  // ---- calories
  add('c1', sc.calories.start, m.feed + 0.1, 'studio', mv([2.0, 2.5, 8.8], [1.8, 2.45, 8.4], [1.5, 1.9, 0], [1.5, 1.9, 0], 48), (t) => ({ prop: 'feed', k: prog(t, sc.calories.start + 0.1, sc.calories.start + 1.0), count: 0 }));
  add('c2', m.feed + 0.1, m.sixteen + 0.9, 'studio', mv([4.4, 2.5, 6.2], [4.2, 2.45, 5.9], [3.6, 2.3, 0.3], [3.6, 2.3, 0.3], 46), (t) => ({ prop: 'feed', k: 1, count: prog(t, m.feed + 0.1, m.sixteen + 0.6) }));
  add('c3', m.sixteen + 0.9, m.universe + 0.8, 'studio', mv([0.2, 3.0, 7.8], [0.1, 2.95, 7.4], [0, 2.6, 0.5], [0, 2.6, 0.5], 48), (t) => ({ prop: 'feed', k: 1, count: 1, bars: true, barsK: prog(t, m.sixteen + 0.9, m.universe + 0.5) }));
  add('c4', m.universe + 0.8, sc.future.start, 'earth', mv([70, 40, 300], [68, 38, 290], [110, 10, -40], [110, 10, -40], 40), (t) => ({ cheese: 1, bite: true, moonA: 0.25 }));
  // ---- future
  add('f1', sc.future.start, 75.7, 'moon', mv([0, 3, 32], [0, 2.5, 30], [0, 0, 0], [0, 0, 0], 44), (t) => ({ cheese: 1, biscuit: 0.35 * prog(t, m.million, m.million + 1.2), rotY: 0.6 + (t - sc.future.start) * 2.0, earth: true }));
  add('f2', 75.7, m.toast + 0.6, 'surface', mv([6, 2.2, 7], [5.5, 2.1, 6.5], [0, 1.5, -3], [0, 1.5, -3], 48), (t) => ({ astro: 'wave', rain: 1, brown: 0.5, earth: true }));
  add('f3', m.toast + 0.6, m.dry + 0.6, 'moon', mv([13, 10, 24], [12.6, 9.7, 23.2], [3.4, 6.2, -4.0], [3.4, 6.2, -4.0], 40), (t) => ({ cheese: 1, biscuit: 0.5 + 0.5 * prog(t, m.toast + 0.6, m.dry + 0.3), rain: 1, rotY: 1.2, earth: false }));
  add('f4', m.dry + 0.6, sc.end.start, 'moon', mv([0, 2, 31], [0, 1.5, 29], [0, 0, 0], [0, 0, 0], 44), (t) => ({ cheese: 1, biscuit: 1, rotY: 1.0 + (t - m.dry) * 0.05, earth: true }));
  // ---- end
  add('z1', sc.end.start, m.biscuit - 0.1, 'hill', H_HIGH, (t) => hill(t, { dave: 'shoot', priya: 'card' }));
  add('z2', m.biscuit - 0.1, m.photo - 0.05, 'hill', H_FACE_MOON, (t) => hill(t, { moonPos: 'cam', dave: 'cam', priya: 'look', wide: 0.3 }));
  add('z3', m.photo - 0.05, m.priya - 0.05, 'hill', H_MED, (t) => hill(t, { dave: 'press', priya: 'card', flashK: flashAt(t, m.photo + 0.35, 1), flash: flashAt(t, m.photo + 0.35, 0.4) }));
  add('z4', m.priya - 0.05, 87.6, 'card', mv([0.1, 1.15, 0.75], [0.08, 1.1, 0.7], [0, 0, 0.02], [0, 0, 0.02], 40), (t) => ({ variant: 'biscuit', k: 1 }));
  add('z5', 87.6, sc.endcard.start, 'hill', H_PRIYA, (t) => hill(t, { dave: 'cam', priya: 'cam', card: 'biscuit', pwide: 0.1 }));
  add('endcard', sc.endcard.start, sc.endcard.end, 'black', () => ({ pos: V3(0, 0, 5), look: V3(0, 0, 0) }), () => ({}));
  return { shots };
}
