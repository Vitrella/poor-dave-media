import { lerp, easeInOut, easeOut, easeIn, prog, smooth, V3, lerpV } from './util.js';
const GOLD = '#f2c85b';
function camKeys(keys) { return (tl) => { if (tl <= keys[0].t) return keys[0]; for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (tl <= b.t) { const k = easeInOut(prog(tl, a.t, b.t)); return { pos: lerpV(a.pos, b.pos, k), look: lerpV(a.look, b.look, k), fov: lerp(a.fov ?? 44, b.fov ?? 44, k) }; } } return keys[keys.length - 1]; }; }
const K = (t, pos, look, fov) => ({ t, pos: V3(...pos), look: V3(...look), fov });
const mv = (p0, p1, l0, l1, fov = 44, d = 3) => camKeys([K(0, p0, l0, fov), K(d, p1, l1, fov)]);

export function overlayCfgPlastic(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on, SNAP = m.back;
  const fmtT = (v) => { v = Math.max(0, v); const s = Math.floor(v); const ms = Math.floor((v - s) * 1000); return `0:0${s}.${String(ms).padStart(3, '0')}`; };
  return {
    title: [[{ t: 'What if all plastic on Earth' }], [{ t: 'vanished for 5 seconds', c: GOLD }, { t: '?' }]],
    titleFrom: 0.3, titleTo: sc.dave.start + 4.0,
    counter: { from: ON - 0.05, label: (t) => t < SNAP ? 'PLASTIC RETURNS IN' : 'PLASTIC', fmt: (t) => t < SNAP ? fmtT(5 * (1 - prog(t, ON, SNAP))) : 'BACK', color: (t) => t < SNAP ? '#fff' : GOLD },
    status: [[sc.dave.start, 'DAVE’S SUIT · FITTING: IN PROGRESS'], [m.close1, 'DAVE’S SUIT · TAILOR: CLOSE ENOUGH'], [ON, 'DAVE’S SUIT · STATUS: GONE'], [m.suitgo, 'DAVE’S SUIT · VEST: COTTON (STILL HERE)'], [m.thirds, 'DAVE’S SUIT · DIGNITY: PENDING'], [m.half, 'DAVE’S SUIT · STILL GONE'], [m.vest, 'DAVE’S SUIT · CURTAIN: ALSO GONE'], [m.ceiling, 'DAVE’S SUIT · PRIYA: CEILING'], [m.back, 'DAVE’S SUIT · STATUS: BACK'], [m.returns, 'DAVE’S SUIT · OCCUPANT: NONE'], [m.doesnt, 'DAVE’S SUIT · STATUS: ON THE FLOOR'], [m.close2, 'DAVE’S SUIT · PURCHASED ANYWAY']],
    callouts: [
      [m.close1, ON - 0.1, 'TAILOR’S VERDICT', 'CLOSE ENOUGH'],
      [m.five, m.suitgo - 0.1, 'EVERY PIECE', 'ALL OF IT'],
      [m.suitgo, m.elastic - 0.1, 'POLYESTER', 'GONE'],
      [m.elastic, m.billion - 0.1, 'ELASTANE', 'ALSO PLASTIC'],
      [m.thirds, m.popular - 0.1, 'CLOTHING FIBRE · SYNTHETIC', '≈ 2/3'],
      [m.popular, sc.cars.start - 0.1, 'WOOL · COTTON', 'SUDDENLY POPULAR'],
      [m.half, m.dash - 0.1, 'PLASTIC IN A CAR', '50% VOL · <10% WT'],
      [m.dash, m.touch - 0.1, 'WIRE INSULATION', 'PVC'],
      [m.touch, m.vehicles - 0.1, 'COPPER + COPPER', 'SHORT CIRCUIT'],
      [m.vehicles, sc.grid.start - 0.1, 'VEHICLES ON EARTH', '≈ 1.5 BILLION'],
      [m.cable, m.lights - 0.1, 'EVERY CABLE', 'SAME PROBLEM'],
      [m.lights, sc.planes.start - 0.1, 'GRID STATUS', 'OFF'],
      [m.aircraft, m.halfplastic - 0.1, 'AIRBORNE RIGHT NOW', '≈ 10,000'],
      [m.halfplastic, m.halfair - 0.1, '787 · COMPOSITE BY WEIGHT', '≈ 50%'],
      [m.halfair, sc.lenses.start - 0.1, 'REMAINING', 'THE OTHER HALF'],
      [m.lenses, m.spectacle - 0.1, 'CONTACT LENS WEARERS', '≈ 140,000,000'],
      [m.spectacle, m.blurry - 0.1, 'SPECTACLE LENSES', 'MOSTLY PLASTIC'],
      [m.blurry, sc.shop.start - 0.1, 'VISIBILITY', 'REDUCED'],
      [m.bottle, m.hold - 0.1, 'PET BOTTLES', 'GONE'],
      [m.hold, m.remember - 0.1, 'THE DRINKS', 'STILL HERE'],
      [m.remember, sc.ocean.start - 0.1, 'GRAVITY', 'REMEMBERED'],
      [m.sea, m.clean - 0.1, 'PLASTIC PIECES AT SEA', '≈ 171 TRILLION'],
      [m.clean, m.fish - 0.1, 'OCEAN', 'CLEAN (TEMPORARILY)'],
      [m.fish, sc.dave_mid.start - 0.1, 'FISH', 'SUSPICIOUS'],
      [m.vest, m.ceiling - 0.1, 'CURTAIN', 'ALSO POLYESTER'],
      [m.ceiling, sc.back.start - 0.1, 'PRIYA', 'STUDYING THE CEILING'],
      [m.back, m.exactly - 0.1, 'PLASTIC', 'BACK'],
      [m.exactly, m.notnow - 0.1, 'POSITION', 'EXACTLY WHERE IT WAS'],
      [m.notnow, sc.end.start - 0.1, 'THE DRINKS', 'NOT IN THE BOTTLES'],
      [m.returns, m.moved - 0.1, 'THE SUIT', 'ON THE PODIUM'],
      [m.moved, m.stands - 0.1, 'DAVE', 'NOT ON THE PODIUM'],
      [m.stands, m.doesnt - 0.1, 'SUIT', 'FREESTANDING'],
      [m.doesnt, m.close2 - 0.1, 'SUIT', 'NO LONGER FREESTANDING'],
      [m.close2, sc.endcard.start - 0.1, 'TAILOR’S VERDICT', 'CLOSE ENOUGH'],
    ],
    end: { lines: ['PLASTIC MADE SINCE 1950: ABOUT 11 BILLION TONNES.', 'TWO THIRDS OF ALL CLOTHING FIBRE IS SYNTHETIC.'] },
  };
}

export function buildShotsPlastic(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on, SNAP = m.back;
  const shots = []; const add = (id, from, to, set, cam, ctx) => shots.push({ id, from, to, set, cam, ctx });
  const flashAt = (t, t0, a = 0.55) => t >= t0 ? Math.max(0, a - (t - t0) * 2.3) : 0;
  const ST = (y = 2.0, z = 5.5, fov = 44) => mv([0.6, y + 0.3, z], [-0.4, y + 0.1, z - 0.8], [0, y, 0], [0, y, 0], fov);
  const CITYF = (a = 0, h = 75, d = 4) => mv([60 * Math.cos(a), h, 60 * Math.sin(a) + 40], [55 * Math.cos(a + 0.25), h - 13, 55 * Math.sin(a + 0.25) + 30], [0, 0, 0], [0, 4, 0], 46, d);
  const gone = (t) => t >= ON && t < SNAP; // plastic is away
  // tailor cameras (podium at origin, Dave's head ≈ y 1.82; booth at (-3.85, 0, -2.3); Priya at (2.1, 0, 1.75); tailor kneels at (0.15, 0, 1.05))
  const TCLOSE = mv([0.15, 1.9, 1.8], [0.12, 1.88, 1.65], [0, 1.78, 0], [0, 1.78, 0], 32);
  const TMED = mv([-1.6, 1.5, 3.3], [-1.4, 1.45, 3.05], [0.35, 0.95, 0.1], [0.35, 0.95, 0.1], 44);
  const THEM = mv([-0.9, 1.0, 2.2], [-0.8, 0.95, 2.05], [0.7, 0.7, 0.3], [0.7, 0.7, 0.3], 40);
  const TWIDE = mv([-0.6, 2.0, 5.2], [-0.4, 1.95, 4.8], [-0.6, 1.0, -0.5], [-0.6, 1.0, -0.5], 54);
  const TBOOTH = mv([-3.2, 1.5, 1.4], [-3.3, 1.5, 1.1], [-3.85, 1.2, -2.3], [-3.85, 1.2, -2.3], 40);
  const TBOOTHC = mv([-3.5, 1.75, -0.6], [-3.55, 1.72, -0.75], [-3.85, 1.6, -2.3], [-3.85, 1.6, -2.3], 32);
  const TPRIYA = mv([1.1, 1.45, 0.8], [1.2, 1.42, 0.9], [2.1, 1.22, 1.75], [2.1, 1.22, 1.75], 34);
  const TWIDE2 = mv([0.3, 2.1, 4.9], [0.1, 2.0, 4.6], [-1.6, 0.9, -1.0], [-1.6, 0.9, -1.0], 54);
  const TLOW = mv([0.7, 0.5, 2.5], [0.6, 0.55, 2.3], [0, 1.0, 0], [0, 1.0, 0], 44);
  const TBOOTHIN = mv([-3.2, 1.8, -1.3], [-3.25, 1.78, -1.38], [-3.85, 1.62, -2.3], [-3.85, 1.62, -2.3], 34);
  const TTAILOR = mv([-0.3, 1.6, -1.7], [-0.25, 1.6, -1.55], [1.2, 1.15, 1.3], [1.2, 1.15, 1.3], 40);
  const TPEEK = mv([-1.3, 1.72, -0.25], [-1.4, 1.72, -0.3], [-3.25, 1.62, -0.95], [-3.25, 1.62, -0.95], 34);
  const tailor0 = (t, o = {}) => ({ vanish: gone(t), ...o });
  // ---- hook
  add('h1', 0, 0.9, 'shop', mv([0.3, 0.9, 3.0], [0.25, 0.95, 2.6], [0, 1.3, -6], [0, 1.3, -6], 50), (t) => ({ vanish: t > 0.2, collapse: prog(t, 0.24, 0.6), splash: prog(t, 0.28, 0.8), shopper: 'none', flash: flashAt(t, 0.2, 0.35) }));
  add('h2', 0.9, 3.6, 'tailor', TCLOSE, (t) => tailor0(t, { daveLook: 'cam', tailor: 'measure', smile: t > 2.5 }));
  // ---- dave
  add('d1', 3.6, m.close1 - 0.1, 'tailor', TMED, (t) => tailor0(t, { daveLook: 'down', tailor: 'measure', priya: 'phone' }));
  add('d2', m.close1 - 0.1, sc.event.start, 'tailor', THEM, (t) => tailor0(t, { daveLook: 'down', tailor: t > m.close1 + 0.6 ? 'kneelLook' : 'measure' }));
  // ---- event
  add('e1', sc.event.start, ON + 0.5, 'tailor', TCLOSE, (t) => tailor0(t, { suit: t >= ON ? 'off' : 'on', daveLook: 'cam', tailor: 'measure', flash: flashAt(t, ON), wide: t >= ON ? 1 : 0, open: t >= ON ? 0.6 : 0, sparkK: prog(t, ON, ON + 0.5) }));
  add('e2', ON + 0.5, m.five - 0.1, 'space', mv([0, 30, 220], [0, 28, 210], [0, 0, 0], [0, 0, 0], 40), (t) => ({ pulse: prog(t, ON + 0.5, m.five), garbage: 1 - prog(t, ON + 0.6, m.five - 0.1), lights: 1 }));
  add('e3', m.five - 0.1, sc.suit.start, 'tailor', TWIDE, (t) => tailor0(t, { suit: 'off', armsCover: true, daveLook: 'down', tailor: 'kneelLook', tailorWide: 1, priya: 'look', priyaWide: 1, wide: 1 }));
  // ---- suit
  add('s1', sc.suit.start, m.elastic - 0.1, 'tailor', mv([0.5, 1.5, 2.6], [0.4, 1.45, 2.4], [0, 1.2, 0], [0, 1.2, 0], 40), (t) => tailor0(t, { suit: 'off', armsCover: true, daveLook: 'cam', tailor: 'kneelLook', tailorWide: 1, wide: 0.8, open: 0.2 }));
  add('s2', m.elastic - 0.1, m.billion - 0.1, 'street', mv([-1.2, 1.5, 6.8], [-0.8, 1.45, 6.3], [0.4, 1.0, 2.4], [0.4, 1.0, 2.4], 44), (t) => ({ vanish: true, grab: true, grabAt: ON, drive: true }));
  add('s3', m.billion - 0.1, sc.clothes.start, 'studio', camKeys([K(0, [0, 3.6, 8.5], [0, 0.9, -0.5], 50), K(2.5, [0, 4.2, 7.2], [0, 1.1, -0.8], 50)]), (t) => ({ prop: 'crowd', count: prog(t, m.billion, m.billion + 1.4) }));
  // ---- clothes
  add('c1', sc.clothes.start, 21.3, 'studio', ST(2.4, 6.8, 44), (t) => ({ prop: 'pie', pieK: 0 }));
  add('c1b', 21.3, m.popular - 0.1, 'studio', mv([1.0, 3.6, 4.6], [0.8, 3.5, 4.3], [0, 2.6, 0], [0, 2.6, 0], 40), (t) => ({ prop: 'pie', pieK: prog(t, 21.5, 22.3) }));
  add('c2', m.popular - 0.1, sc.cars.start, 'street', mv([0.3, 1.7, 7.2], [0.6, 1.6, 6.6], [1.5, 1.0, 2.6], [1.5, 1.0, 2.6], 44), (t) => ({ vanish: true, wool: true, crowd: prog(t, m.popular, m.popular + 1.6), grabAt: ON, drive: true }));
  // ---- cars
  add('v1', sc.cars.start, 26.6, 'studio', ST(1.3, 7.8, 46), (t) => ({ prop: 'carcut', carK: 0 }));
  add('v1b', 26.6, m.dash - 0.1, 'studio', mv([2.2, 1.9, 4.8], [1.8, 1.8, 4.4], [0.3, 1.0, 0], [0.3, 1.0, 0], 40), (t) => ({ prop: 'carcut', carK: prog(t, 26.9, 27.9) }));
  add('v2a', m.dash - 0.1, 30.0, 'street', mv([-7, 1.1, 15.8], [-5, 1.05, 15.6], [1, 0.7, 11.2], [1.5, 0.7, 11.2], 40), (t) => ({ vanish: true, drive: true, sunDir: [10, 120, 30] }));
  add('v2b', 30.0, m.touch - 0.1, 'studio', ST(1.75, 5.4, 44), (t) => ({ prop: 'wires', insul: 1 - prog(t, 30.3, 31.2), touch: 0 }));
  add('v3', m.touch - 0.1, m.vehicles - 0.1, 'studio', mv([0.5, 2.1, 4.6], [0.4, 2.05, 4.3], [0, 1.65, 0], [0, 1.65, 0], 40), (t) => ({ prop: 'wires', insul: 0, touch: prog(t, m.touch, m.touch + 0.5), spark: t > m.touch + 0.4 }));
  add('v4', m.vehicles - 0.1, 34.5, 'city', CITYF(0.8, 70, 2), (t) => ({ mode: 'stopped', st: t - (m.vehicles - 0.1), sparks: t > m.vehicles + 0.2 }));
  add('v4b', 34.5, sc.grid.start, 'street', mv([3.5, 1.3, 14.5], [3.0, 1.25, 14.2], [-1.5, 0.8, 11.2], [-1.5, 0.8, 11.2], 44), (t) => ({ vanish: true, drive: true, stopT: t - 33.2, spark: true, sunDir: [10, 120, 30] }));
  // ---- grid
  add('g1', sc.grid.start, 37.1, 'city', mv([10, 125, 10], [8, 112, 8], [0, 0, 0], [0, 0, 0], 50), (t) => ({ mode: 'stopped', st: 1, sparks: true }));
  add('g2', 37.1, 38.4, 'space', mv([0, 20, 205], [0, 18, 195], [0, 0, 0], [0, 0, 0], 40), (t) => ({ sunDir: [-200, 40, -140], lights: 1, garbage: 0, night: true }));
  add('g3', 38.4, sc.planes.start, 'space', mv([10, 12, 238], [6, 10, 226], [0, 0, 0], [0, 0, 0], 40), (t) => ({ sunDir: [-200, 40, -140], lights: 1 - prog(t, m.lights + 0.3, m.lights + 1.6), garbage: 0, night: true }));
  // ---- planes
  add('p1a', sc.planes.start, 41.6, 'studio', camKeys([K(0, [0.3, 1.0, 1.6], [0, 1.0, 0], 50), K(1.3, [0, 4.8, 12.5], [0, 4.6, 0], 50)]), (t) => ({ prop: 'planes', n: prog(t, m.aircraft, m.aircraft + 1.1) }));
  add('p1b', 41.6, m.halfplastic - 0.1, 'sky', mv([62, 14, 78], [56, 13, 72], [0, 0, 0], [0, -1, 0], 44), (t) => ({ skin: true, dark: 0.6 }));
  add('p2', m.halfplastic - 0.1, m.halfair - 0.1, 'sky', mv([14, 5, 34], [10, 4, 30], [0, 0, 0], [-2, 0, 0], 42), (t) => ({ skin: t < m.halfplastic + 0.8, dark: 0.6 }));
  add('p3', m.halfair - 0.1, sc.lenses.start, 'sky', mv([-50, 16, 30], [-44, 14, 33], [4, -2, 0], [4, -2, 0], 46), (t) => ({ skin: false, dark: 0.6 }));
  // ---- lenses
  add('l1', sc.lenses.start, 49.3, 'studio', mv([3.4, 2.7, 4.4], [3.2, 2.65, 4.2], [0, 2.1, -0.2], [0, 2.1, -0.2], 44), (t) => ({ prop: 'lens', lensK: 0, lensN: prog(t, m.lenses, m.lenses + 1.3) }));
  add('l1b', 49.3, m.spectacle - 0.1, 'studio', mv([2.3, 2.3, 3.0], [2.2, 2.25, 2.85], [0, 1.7, 0.3], [0, 1.7, 0.3], 36), (t) => ({ prop: 'lens', lensK: prog(t, 49.6, 50.3), lensN: 1 }));
  add('l2', m.spectacle - 0.1, m.blurry - 0.1, 'studio', mv([0.5, 2.3, 5.4], [0.4, 2.25, 5.1], [0, 2.15, 1.2], [0, 2.15, 1.2], 42), (t) => ({ prop: 'lens', specsK: prog(t, m.spectacle + 0.3, m.spectacle + 1.0), lensN: 1 }));
  add('l3', m.blurry - 0.1, sc.shop.start, 'street', mv([0.6, 1.4, 7.2], [0.9, 1.35, 6.8], [2.2, 1.1, 2.8], [2.4, 1.1, 2.8], 40), (t) => ({ vanish: true, glasses: prog(t, m.blurry - 0.1, m.blurry + 1.0) * 1.35, blur: 9, drive: true, grab: true, grabAt: ON, sunDir: [10, 120, 30] }));
  // ---- shop
  add('b1', sc.shop.start, 55.3, 'shop', mv([0, 1.6, 3.6], [0, 1.6, 2.2], [0, 1.4, -6], [0, 1.4, -6], 48), (t) => ({ vanish: t > m.bottle + 0.5, collapse: 0, shopper: 'push', shopperX: -2.5 - (t - sc.shop.start) * 0.5, flash: flashAt(t, m.bottle + 0.5, 0.3) }));
  add('b1b', 55.3, m.hold - 0.1, 'shop', mv([-0.2, 1.6, -1.6], [-0.3, 1.55, -1.9], [-2.1, 1.3, -4.6], [-2.1, 1.3, -4.6], 44), (t) => ({ vanish: true, collapse: 0, shopper: 'look', shopperX: -1.2 }));
  add('b2', m.hold - 0.1, m.remember - 0.1, 'shop', mv([-1.15, 1.45, -2.9], [-1.25, 1.4, -3.1], [-2.05, 1.25, -4.3], [-2.05, 1.25, -4.3], 36), (t) => ({ vanish: true, collapse: 0, shopper: 'none' }));
  add('b3', m.remember - 0.1, sc.ocean.start, 'shop', mv([-0.5, 1.7, -1.3], [-0.6, 1.6, -1.6], [-2.1, 0.9, -4.2], [-2.1, 0.9, -4.2], 46), (t) => ({ vanish: true, collapse: prog(t, m.remember + 0.1, m.remember + 0.8), splash: prog(t, m.remember + 0.3, m.remember + 1.1), shopper: 'look', shopperX: -1.0 }));
  // ---- ocean
  add('o1', sc.ocean.start, 63.0, 'ocean', mv([40, 30, -20], [36, 29, -26], [0, 0, -140], [0, 0, -140], 48), (t) => ({ vanish: t > 62.2, flash: flashAt(t, 62.2, 0.3) }));
  add('o2', 63.0, m.clean - 0.1, 'space', mv([60, 60, 190], [55, 58, 185], [0, 0, 0], [0, 0, 0], 40), (t) => ({ garbage: 1 - prog(t, 63.2, 64.3), lights: 1, spin: 0.01 }));
  add('o3', m.clean - 0.1, m.fish - 0.1, 'ocean', mv([0, -8, 6.5], [0.5, -8.2, 6.0], [0, -13.5, -12], [0, -13.5, -12], 40), (t) => ({ vanish: true, hero: true, suspicious: 0, underwater: true }));
  add('o4', m.fish - 0.1, sc.dave_mid.start, 'ocean', mv([0.3, -11.6, 2.2], [0.2, -11.7, 1.8], [0, -12.8, -10], [0, -12.8, -10], 36), (t) => ({ vanish: true, hero: true, suspicious: prog(t, m.fish + 0.1, m.fish + 0.8), underwater: true }));
  // ---- dave mid
  add('m1', sc.dave_mid.start, 71.3, 'tailor', TWIDE2, (t) => tailor0(t, { suit: 'off', where: 'booth', armsCover: true, daveLook: 'cam', tailor: 'standLook', priya: 'look', wide: 0.6 }));
  add('m2', 71.3, m.ceiling - 0.1, 'tailor', TBOOTH, (t) => tailor0(t, { suit: 'off', where: 'booth', armsCover: true, daveLook: 'cam', tailor: 'none', priya: 'none', wide: 0.8, open: 0.2 }));
  add('m3', m.ceiling - 0.1, sc.back.start, 'tailor', TPRIYA, (t) => tailor0(t, { suit: 'off', where: 'booth', tailor: 'none', priya: 'ceiling' }));
  // ---- back
  add('k1', sc.back.start, SNAP + 0.3, 'tailor', TBOOTHC, (t) => ({ vanish: true, suit: 'off', where: 'booth', armsCover: true, daveLook: 'cam', tailor: 'none', priya: 'none', wide: 0.8, open: t >= SNAP ? 0.4 : 0, flash: flashAt(t, SNAP) }));
  add('k2', SNAP + 0.3, m.notnow - 0.1, 'street', mv([3.2, 1.3, 14.8], [2.8, 1.25, 14.4], [-1.5, 0.8, 11.2], [-1.5, 0.8, 11.2], 44), (t) => ({ vanish: false, drive: true, stopT: t - 33.2, spark: false, sunDir: [10, 120, 30] }));
  add('k3', m.notnow - 0.1, sc.end.start, 'shop', mv([-1.0, 1.5, -2.7], [-1.1, 1.45, -2.9], [-2.05, 1.2, -4.3], [-2.05, 1.2, -4.3], 38), (t) => ({ vanish: true, back: true, collapse: 1, shopper: 'none' }));
  // ---- end
  add('z1', sc.end.start, 81.6, 'tailor', mv([0.9, 1.4, 3.4], [0.8, 1.38, 3.2], [0, 0.95, 0], [0, 0.95, 0], 42), (t) => tailor0(t, { suit: t >= m.returns ? 'empty' : 'none', emptyK: 0, where: 'booth', tailor: 'standLook', priya: 'look', sparkK: prog(t, m.returns, m.returns + 0.5), flash: flashAt(t, m.returns, 0.25) }));
  add('z1b', 81.6, m.moved - 0.1, 'tailor', mv([-0.3, 2.0, 5.2], [-0.1, 1.95, 4.9], [-1.3, 1.0, -0.6], [-1.3, 1.0, -0.6], 56), (t) => tailor0(t, { suit: 'empty', emptyK: 0, where: 'peek', armsCover: true, daveLook: 'suit', tailor: 'standLook', tailorWide: 0.8, priya: 'look' }));
  add('z2', m.moved - 0.1, m.stands - 0.1, 'tailor', TPEEK, (t) => tailor0(t, { suit: 'empty', emptyK: 0, where: 'peek', armsCover: true, daveLook: 'suit', tailor: 'none', priya: 'none', wide: 0.5 }));
  add('z3', m.stands - 0.1, m.doesnt - 0.1, 'tailor', TLOW, (t) => tailor0(t, { suit: 'empty', emptyK: 0, where: 'peek', tailor: 'point', priya: 'clap' }));
  add('z4', m.doesnt - 0.1, m.close2 - 0.1, 'tailor', mv([0.8, 1.2, 2.6], [0.7, 1.15, 2.4], [0, 0.7, 0], [0, 0.6, 0], 42), (t) => tailor0(t, { suit: 'empty', emptyK: prog(t, m.doesnt + 0.15, m.doesnt + 0.75), where: 'peek', tailor: 'point', priya: 'look' }));
  add('z5', m.close2 - 0.1, 89.4, 'tailor', TTAILOR, (t) => tailor0(t, { suit: 'empty', emptyK: 1, where: 'peek', tailor: 'shrug', priya: 'thumbs' }));
  add('z6', 89.4, sc.endcard.start, 'tailor', TBOOTHIN, (t) => tailor0(t, { suit: 'off', where: 'booth', handsHips: true, daveLook: 'cam', tailor: 'none', priya: 'none', smile: true }));
  add('endcard', sc.endcard.start, sc.endcard.end, 'black', () => ({ pos: V3(0, 0, 5), look: V3(0, 0, 0) }), () => ({}));
  return { shots };
}
