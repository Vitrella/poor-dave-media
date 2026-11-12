import { lerp, easeInOut, easeOut, easeIn, prog, smooth, V3, lerpV } from './util.js';
const GOLD = '#f2c85b';
function camKeys(keys) { return (tl) => { if (tl <= keys[0].t) return keys[0]; for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (tl <= b.t) { const k = easeInOut(prog(tl, a.t, b.t)); return { pos: lerpV(a.pos, b.pos, k), look: lerpV(a.look, b.look, k), fov: lerp(a.fov ?? 44, b.fov ?? 44, k) }; } } return keys[keys.length - 1]; }; }
const K = (t, pos, look, fov) => ({ t, pos: V3(...pos), look: V3(...look), fov });
const mv = (p0, p1, l0, l1, fov = 44, d = 3) => camKeys([K(0, p0, l0, fov), K(d, p1, l1, fov)]);
const fmtBn = (v) => Math.round(v).toLocaleString('en-GB');

export function overlayCfgHeight(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on, SNAP = m.back;
  const fmtC = (v) => { v = Math.max(0, v); const s = Math.floor(v); const ms = Math.floor((v - s) * 1000); return `0:0${s}.${String(ms).padStart(3, '0')}`; };
  return {
    title: [[{ t: 'What if ' }, { t: 'everyone', c: GOLD }, { t: ' doubled' }], [{ t: 'in height', c: GOLD }, { t: ' for 5 seconds?' }]],
    titleFrom: 0.3, titleTo: 4.9,
    counter: { from: ON - 0.05, label: (t) => t < SNAP ? 'HEIGHT RETURNS IN' : 'HEIGHT RETURNED', fmt: (t) => fmtC(5 * (1 - prog(t, ON, SNAP))), color: (t) => t >= SNAP ? GOLD : '#fff' },
    status: [[sc.dave.start, 'DAVE’S SHOP · 4 BAGS'], [m.list, 'PRIYA’S LIST · 5 ITEMS'], [m.eggs, 'ITEM 1 · EGGS · INTACT'], [ON, 'DAVE · 3.4 M'], [m.weight, 'DAVE · 560 KG'], [m.lift, 'DAVE · 560 KG · 3.4 M'], [m.crop, 'DAVE’S JUMPER · CROP TOP'], [m.sideways, 'DOOR · ATTEMPT 1 OF 3'], [m.window, 'WINDOW · ATTEMPT 2 OF 3'], [m.again, 'DOOR · ATTEMPT 3 OF 3'], [SNAP, 'DAVE · 1.7 M · STILL A CROP TOP'], [m.through, 'DAVE · INDOORS'], [m.itemone, 'ITEM 1 · EGGS · NOT INTACT'], [m.writes, 'PRIYA’S LIST · 6 ITEMS']],
    callouts: [
      [m.bags, m.list - 0.1, 'THE BIG SHOP', '4 BAGS'],
      [m.list, m.eggs - 0.1, 'PRIYA’S WEDDING LIST', '5 ITEMS'],
      [m.eggs, ON - 0.1, 'ITEM ONE', 'EGGS'],
      [ON, m.five - 0.1, 'EVERYONE ON EARTH', 'HEIGHT ×2'],
      [m.five, sc.height.start - 0.1, 'FOR', '5 SECONDS'],
      [m.h17, m.h34 - 0.1, 'AVERAGE ADULT', '1.7 M'],
      [m.h34, m.doors - 0.1, 'NOW', '3.4 M'],
      [m.doors, m.ceilings - 0.1, 'DOORS', '2.0 M'],
      [m.ceilings, sc.world.start - 0.1, 'CEILINGS', '2.4 M'],
      [m.billion, m.allof - 0.1, 'PEOPLE', '8,000,000,000'],
      [m.allof, m.atonce - 0.1, 'ALL OF THEM', '3.4 M'],
      [m.atonce, sc.indoor.start - 0.1, 'AT ONCE', '5 SECONDS'],
      [m.indoors, m.loft - 0.1, 'INDOORS', 'PARTLY UPSTAIRS'],
      [m.loft, sc.mass.start - 0.1, 'PRIYA', 'IN THE LOFT'],
      [m.weight, m.kg560 - 0.1, 'WEIGHT (2³)', '×8'],
      [m.kg560, m.bear - 0.1, 'DAVE', '70 KG → 560 KG'],
      [m.bear, m.anxious - 0.1, 'ADULT MALE POLAR BEAR', '≈ 560 KG'],
      [m.anxious, sc.bones.start - 0.1, 'DAVE', 'ANXIOUS'],
      [m.bones, m.double - 0.1, 'BONE CROSS-SECTION (2²)', '×4'],
      [m.double, m.galileo - 0.1, 'LOAD PER BONE', '×2'],
      [m.galileo, m.nobody - 0.1, 'GALILEO · TWO NEW SCIENCES', '1638'],
      [m.nobody, sc.floor.start - 0.1, 'LISTENED', 'NOBODY'],
      [m.floor, m.family - 0.1, 'LIVING ROOM FLOOR', '150 KG / M²'],
      [m.family, sc.lift.start - 0.1, 'FAMILY OF FOUR', '≈ 2,000 KG'],
      [m.lift, m.barely - 0.1, 'LIFT · 630 KG', '8 PERSONS → 1'],
      [m.barely, sc.cars.start - 0.1, 'FITS', 'BARELY'],
      [m.cars, m.zero - 0.1, 'CARS ON EARTH', '1,400,000,000'],
      [m.zero, m.sunroof - 0.1, 'DRIVERS THAT FIT', '0'],
      [m.sunroof, sc.clothes.start - 0.1, 'SUNROOF', 'HAT'],
      [m.clothes, m.outfits - 0.1, 'CLOTHES', '×1'],
      [m.outfits, m.crop - 0.1, 'OUTFITS FAILING', '8,000,000,000'],
      [m.crop, sc.heart.start - 0.1, 'DAVE’S JUMPER', 'CROP TOP'],
      [m.heart, m.giraffes - 0.1, 'HEART → HEAD', '+35 CM · ≈ +27 MMHG'],
      [m.giraffes, m.practising - 0.1, 'GIRAFFE BLOOD PRESSURE', '280 / 180 MMHG'],
      [m.practising, sc.door.start - 0.1, 'GIRAFFES', 'PRACTISING'],
      [m.sideways, m.window - 0.1, 'DOOR', 'SIDEWAYS'],
      [m.window, m.again - 0.1, 'WINDOW', '1.0 M × 1.4 M'],
      [m.again, SNAP - 0.1, 'DOOR', 'AGAIN'],
      [SNAP, sc.after.start - 0.1, 'EVERYONE', '1.7 M'],
      [m.heads, m.holes - 0.1, 'HEADS', 'COMING DOWN'],
      [m.holes, sc.end.start - 0.1, 'HOLES', 'STAYING'],
      [m.through, m.itemone - 0.1, 'DAVE', 'THROUGH THE DOOR'],
      [m.itemone, m.writes - 0.1, 'ITEM ONE', 'DID NOT'],
      [m.writes, sc.endcard.start - 0.1, 'PRIYA’S LIST', '1. EGGS (AGAIN)'],
    ],
    end: { lines: ['1.7 M → 3.4 M: 8× THE WEIGHT, 4× THE BONE.', 'GALILEO SAID SO IN 1638. NOBODY LISTENED.'] },
  };
}

export function buildShotsHeight(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on, SNAP = m.back;
  const shots = []; const add = (id, from, to, set, cam, ctx) => shots.push({ id, from, to, set, cam, ctx });
  const flashAt = (t, t0, a = 0.55) => t >= t0 ? Math.max(0, a - (t - t0) * 2.3) : 0;
  const G = (t) => easeOut(prog(t, ON, ON + 0.45)) * (1 - smooth(prog(t, SNAP, SNAP + 0.35)));
  const CR = (t) => prog(t, ON + 0.1, ON + 0.5);
  const big = (t, o = {}) => ({ grow: G(t), crop: CR(t), ...o });
  // street cameras
  const S_FACE_BIG = mv([1.85, 2.95, 2.05], [1.75, 2.95, 1.95], [0.1, 2.9, 0.95], [0.1, 2.9, 0.95], 42);
  const S_FACE = mv([1.7, 1.6, 1.95], [1.6, 1.6, 1.85], [0.1, 1.6, 0.95], [0.1, 1.6, 0.95], 36);
  const S_MED = mv([2.8, 1.6, 3.6], [2.5, 1.55, 3.3], [0.1, 1.0, 0.9], [0.1, 1.0, 0.9], 44);
  const S_WIDE = mv([5.5, 3.0, 8.5], [5.0, 3.2, 8.0], [0, 1.6, 0.5], [0, 1.6, 0.5], 46);
  const S_HIGH = mv([3, 9.5, 9.5], [2, 9.0, 8.5], [0, 1.5, 1], [0, 1.5, 1], 50);
  const S_ROOF = mv([2.7, 6.35, 4.1], [2.3, 6.3, 3.7], [0, 6.65, -1.3], [0, 6.65, -1.3], 38);
  // ---- hook
  add('h1', 0, 1.1, 'street', mv([0.05, 1.35, -2.6], [0.05, 1.37, -2.45], [0.0, 1.45, 0.3], [0.0, 1.45, 0.3], 44), (t) => ({ grow: 1, crop: 1, dave: 'crawl', crawlK: -0.1, doorOpen: 1, hall: true, wide: 0.9, open: 0.3 }));
  add('h2', 1.1, sc.dave.start, 'street', mv([7.5, 2.6, 7.5], [6.6, 2.4, 6.6], [1.5, 1.2, 1.5], [1.2, 1.1, 1.3], 46), (t) => ({ dave: 'walk', walkK: prog(t, 1.1, 2.9) }));
  // ---- dave
  add('d1', sc.dave.start, 4.6, 'street', S_MED, (t) => ({ dave: 'stand', look: 'door' }));
  add('d2', 4.6, 6.35, 'street', mv([0.46, 1.58, 1.0], [0.42, 1.55, 0.92], [-0.22, 1.42, 0.1], [-0.22, 1.42, 0.1], 30), (t) => ({ dave: 'stand', look: 'door' }));
  add('d3', 6.35, sc.event.start, 'street', mv([-0.66, 1.04, 0.28], [-0.6, 1.0, 0.33], [-0.14, 0.86, 0.68], [-0.14, 0.86, 0.68], 36), (t) => ({ dave: 'stand', look: 'door' }));
  // ---- event
  add('e1', sc.event.start, ON + 0.5, 'street', S_WIDE, (t) => big(t, { dave: 'stand', look: 'door', flash: flashAt(t, ON) }));
  add('e2', ON + 0.5, m.five - 0.05, 'street', camKeys([K(0, [2.4, 2.0, 2.0], [0.0, 2.1, 0.4], 46), K(1.1, [2.4, 2.3, 2.0], [0.0, 2.7, 0.4], 46)]), (t) => big(t, { dave: 'bump', look: 'cam', wide: 0.7, open: 0.4 }));
  add('e3', m.five - 0.05, sc.height.start, 'city', mv([70, 85, 110], [62, 80, 98], [0, 0, 0], [0, 0, 0], 46), (t) => ({ mode: 'traffic', grow: 1 }));
  // ---- height
  add('g1', sc.height.start, 14.4, 'studio', mv([0.6, 2.2, 7.2], [0.4, 2.1, 6.8], [0, 1.9, 0], [0, 1.9, 0], 46), (t) => ({ prop: 'pole', k: easeOut(prog(t, 14.1, 14.6)) }));
  add('g2', 14.4, m.doors - 0.1, 'studio', mv([1.2, 3.4, 3.8], [1.0, 3.35, 3.5], [0, 3.2, 0], [0, 3.2, 0], 40), (t) => ({ prop: 'pole', k: 1 }));
  add('g3', m.doors - 0.1, m.ceilings - 0.1, 'house', mv([1.6, 1.7, 2.4], [1.5, 1.75, 2.0], [1.5, 1.9, -4.0], [1.5, 1.9, -4.0], 50), (t) => ({ grow: 1, crop: 1, holes: true, doorLbl: true }));
  add('g4', m.ceilings - 0.1, sc.world.start, 'house', mv([-1.2, 2.6, 4.2], [-1.0, 2.6, 3.8], [0.3, 2.45, -2.9], [0.3, 2.45, -2.9], 50), (t) => ({ grow: 1, crop: 1, holes: true, ceilLbl: true, dust: true }));
  // ---- world
  add('w1', sc.world.start, m.allof - 0.05, 'earth', mv([0, 36, 270], [0, 30, 250], [0, 0, 0], [0, 0, 0], 44), (t) => ({ flash: flashAt(t, m.billion, 0.35) }));
  add('w2', m.allof - 0.05, m.atonce - 0.05, 'city', mv([7, 10, 17], [7, 9.5, 15], [7, 1, 2], [7, 1, 1], 52), (t) => ({ mode: 'traffic', grow: 1 }));
  add('w3', m.atonce - 0.05, sc.indoor.start, 'street', S_HIGH, (t) => big(t, { dave: 'stand', look: 'door' }));
  // ---- indoor
  add('i1', sc.indoor.start, 24.5, 'house', mv([1.6, 3.3, 9.6], [1.2, 3.2, 9.0], [0, 2.6, -2.2], [0, 2.6, -2.2], 48), (t) => ({ grow: 1, crop: 1, holes: true, dust: true }));
  add('i2', 24.5, m.loft - 0.05, 'house', mv([1.0, 3.7, 0.6], [0.9, 3.65, 0.4], [-0.6, 3.1, -2.7], [-0.6, 3.1, -2.7], 40), (t) => ({ grow: 1, crop: 1, holes: true, teen: 'look' }));
  add('i3', m.loft - 0.05, sc.mass.start, 'street', S_ROOF, (t) => big(t, { dave: 'stand', look: 'door', priyaRoof: easeOut(prog(t, m.loft - 0.05, m.loft + 0.5)), roofHole: true, dust: t > m.loft }));
  // ---- mass
  add('m1', sc.mass.start, 28.9, 'studio', mv([0.8, 2.3, 6.8], [0.6, 2.2, 6.4], [0, 1.9, 0], [0, 1.9, 0], 46), (t) => ({ prop: 'scale', k: easeOut(prog(t, m.eight - 0.2, m.eight + 0.4)), kg: lerp(70, 560, easeOut(prog(t, m.eight - 0.2, m.eight + 0.6))) }));
  add('m2', 28.9, 30.3, 'studio', mv([-0.35, 3.55, 2.7], [-0.4, 3.5, 2.5], [-1.75, 3.35, -0.3], [-1.75, 3.35, -0.3], 38), (t) => ({ prop: 'scale', k: 1, kg: 560, ld: true }));
  add('m2b', 30.3, m.bear - 0.1, 'studio', mv([0.6, 2.5, 6.6], [0.5, 2.4, 6.2], [-0.5, 2.0, 0], [-0.5, 2.0, 0], 48), (t) => ({ prop: 'scale', k: 1, kg: 560, ld: true }));
  add('m3', m.bear - 0.1, m.anxious - 0.1, 'studio', mv([2.0, 2.6, 10.8], [1.9, 2.5, 10.3], [1.7, 1.7, 0], [1.7, 1.7, 0], 50), (t) => ({ prop: 'scale', k: 1, kg: 560, bear: true, wide: 0.6 }));
  add('m4', m.anxious - 0.1, sc.bones.start, 'street', mv([1.85, 2.95, 2.05], [1.75, 2.95, 1.95], [0.4, 2.9, 0.75], [0.4, 2.9, 0.75], 42), (t) => big(t, { dave: 'anxious', look: 'cam', wide: 1, open: 0.2 }));
  // ---- bones
  add('b1', sc.bones.start, 35.4, 'studio', mv([0.0, 2.4, 8.2], [-0.1, 2.35, 7.8], [-0.2, 2.2, 0], [-0.2, 2.2, 0], 44), (t) => ({ prop: 'discs', k: prog(t, m.bones + 0.6, m.bones + 1.3) }));
  add('b1b', 35.4, m.double - 0.1, 'studio', mv([1.0, 2.4, 4.6], [0.9, 2.35, 4.3], [0.4, 2.0, 0], [0.4, 2.0, 0], 44), (t) => ({ prop: 'discs', k: 1 }));
  add('b2', m.double - 0.1, 38.0, 'studio', mv([0.4, 2.5, 7.8], [0.3, 2.45, 7.4], [0, 2.1, 0], [0, 2.1, 0], 46), (t) => ({ prop: 'load', k: prog(t, m.double - 0.1, m.double + 0.9), bend: prog(t, m.double + 0.7, m.double + 1.2) }));
  add('b2b', 38.0, m.galileo - 0.1, 'studio', mv([1.2, 2.9, 4.8], [1.1, 2.85, 4.6], [0.5, 2.6, 0], [0.5, 2.6, 0], 46), (t) => ({ prop: 'load', k: 1, bend: 1, lblOn: true }));
  add('b3', m.galileo - 0.1, 40.6, 'studio', mv([1.0, 1.8, 5.4], [0.8, 1.75, 5.0], [0.5, 1.5, 0], [0.5, 1.5, 0], 46), (t) => ({ prop: 'galileo' }));
  add('b3b', 40.6, m.nobody - 0.1, 'studio', mv([2.0, 0.95, 1.7], [1.95, 0.9, 1.55], [1.5, 0.35, 0.2], [1.5, 0.35, 0.2], 40), (t) => ({ prop: 'galileo' }));
  add('b4', m.nobody - 0.1, sc.floor.start, 'studio', mv([0.5, 1.9, 6.0], [0.4, 1.85, 5.7], [0, 1.5, 0.5], [0, 1.5, 0.5], 46), (t) => ({ prop: 'galileo', crowd: true, lblOn: t > m.nobody + 0.35 }));
  // ---- floor
  add('f1', sc.floor.start, 45.0, 'house', mv([2.6, 2.3, 2.8], [2.4, 2.25, 2.5], [0.4, 0.5, -2.0], [0.4, 0.5, -2.0], 48), (t) => ({ grow: 1, crop: 1, holes: true, floorLbl: true, crack: prog(t, sc.floor.start + 0.3, sc.floor.start + 1.4) }));
  add('f2', 45.0, m.family - 0.05, 'house', mv([1.4, 1.1, 0.3], [1.2, 1.0, 0.0], [0.6, 0.0, -2.6], [0.6, 0.0, -2.6], 46), (t) => ({ grow: 1, crop: 1, holes: true, floorLbl: true, crack: 1, dust: true }));
  add('f3', m.family - 0.05, 48.7, 'house', mv([0.6, 2.0, 7.2], [0.5, 1.95, 6.8], [0.3, 1.4, -2.2], [0.3, 1.4, -2.2], 46), (t) => ({ grow: 1, crop: 1, holes: true, floorLbl: true, crack: 1, weightLbl: t > m.family + 0.5 }));
  add('f3b', 48.7, sc.lift.start, 'house', mv([-2.3, 0.45, 1.6], [-2.1, 0.5, 1.3], [0.5, 1.6, -2.8], [0.5, 1.6, -2.8], 50), (t) => ({ grow: 1, crop: 1, holes: true, crack: 1, weightLbl: true, dust: true }));
  // ---- lift
  add('l1', sc.lift.start, 52.0, 'lift', mv([1.3, 1.6, 1.7], [1.1, 1.55, 1.4], [0, 1.2, -2.6], [0, 1.2, -2.6], 44), (t) => ({ who: 'eight', door: 0 }));
  add('l2', 52.0, sc.cars.start, 'lift', mv([1.1, 1.75, 1.5], [0.9, 1.65, 1.2], [0, 1.3, -2.6], [0, 1.3, -2.6], 44), (t) => ({ who: 'dave', bump: true, wide: 0.8, barely: t > m.barely }));
  // ---- cars
  add('c1', sc.cars.start, m.zero - 0.05, 'road', camKeys([K(0, [-2.4, 4.2, 10.5], [-2.4, 1.0, -1.9], 50), K(2.4, [2.4, 4.2, 10.5], [2.4, 1.0, -1.9], 50)]), (t) => ({ grow: 1, holes: true, v: 2 }));
  add('c2', m.zero - 0.05, m.sunroof - 0.05, 'road', mv([2.8, 2.7, 3.0], [2.6, 2.65, 2.8], [0, 1.7, -1.9], [0, 1.7, -1.9], 46), (t) => ({ grow: 1, holes: true, v: 0 }));
  add('c3', m.sunroof - 0.05, sc.clothes.start, 'road', mv([1.5, 2.7, 0.7], [1.4, 2.65, 0.6], [0, 2.3, -1.9], [0, 2.3, -1.9], 32), (t) => ({ grow: 1, holes: true, v: 0, hat: t > m.sunroof + 0.5 }));
  // ---- clothes
  add('k1', sc.clothes.start, m.outfits - 0.05, 'studio', mv([0.6, 2.0, 6.4], [0.5, 1.95, 6.0], [0, 1.7, 0], [0, 1.7, 0], 46), (t) => ({ prop: 'crop', k: easeOut(prog(t, sc.clothes.start + 0.2, sc.clothes.start + 0.8)) }));
  add('k2', m.outfits - 0.05, 62.6, 'street', mv([-7.5, 1.6, 3.4], [-6.8, 1.65, 3.3], [1.5, 2.3, 1.6], [1.5, 2.3, 1.6], 50), (t) => big(t, { dave: 'stand', look: 'door' }));
  add('k2b', 62.6, m.crop - 0.05, 'house', mv([0.9, 1.7, 4.6], [0.7, 1.65, 4.2], [0.2, 1.6, -2.4], [0.2, 1.6, -2.4], 44), (t) => ({ grow: 1, crop: 1, holes: true }));
  add('k3', m.crop - 0.05, sc.heart.start, 'street', mv([2.4, 2.7, 2.5], [2.3, 2.65, 2.4], [0.1, 2.5, 0.95], [0.1, 2.5, 0.95], 38), (t) => big(t, { dave: 'down', look: 'down' }));
  // ---- heart
  add('r1', sc.heart.start, 68.2, 'studio', mv([0.0, 2.2, 7.4], [-0.1, 2.15, 7.0], [-0.2, 1.9, 0], [-0.2, 1.9, 0], 46), (t) => ({ prop: 'heart', k: prog(t, m.heart + 0.3, m.heart + 1.6) }));
  add('r2', 68.2, m.giraffes - 0.05, 'studio', mv([1.9, 2.95, 3.6], [1.8, 2.9, 3.4], [1.35, 2.8, 0.3], [1.35, 2.8, 0.3], 38), (t) => ({ prop: 'heart', k: 1, lblOn: true }));
  add('r3', m.giraffes - 0.05, m.practising - 0.05, 'studio', mv([1.4, 2.6, 7.6], [1.2, 2.5, 7.2], [1.4, 2.2, 0], [1.4, 2.2, 0], 48), (t) => ({ prop: 'heart', k: 1, giraffe: easeOut(prog(t, m.giraffes - 0.05, m.giraffes + 0.6)) }));
  add('r4', m.practising - 0.05, sc.door.start, 'studio', mv([3.2, 4.4, 3.4], [3.1, 4.35, 3.2], [2.6, 4.4, -0.5], [2.6, 4.4, -0.5], 42), (t) => ({ prop: 'heart', k: 1, giraffe: 1, nod: 1 }));
  // ---- door
  add('o1', sc.door.start, m.window - 0.1, 'street', mv([2.7, 2.5, 3.3], [2.5, 2.4, 3.0], [0.1, 2.0, 0.6], [0.1, 2.0, 0.6], 44), (t) => big(t, { dave: 'side', wide: 0.3 }));
  add('o2', m.window - 0.1, m.again - 0.1, 'street', mv([0.4, 1.7, 3.8], [0.2, 1.65, 3.5], [-1.9, 1.3, 0.6], [-1.9, 1.3, 0.6], 44), (t) => big(t, { dave: 'window', wide: 0.6 }));
  add('o3', m.again - 0.1, sc.back.start, 'street', mv([2.5, 1.7, 3.2], [2.3, 1.6, 2.9], [0, 1.1, 0.6], [0, 1.1, 0.6], 44), (t) => big(t, { dave: 'crawl', crawlK: prog(t, m.again, m.again + 1.0), wide: 0.5 }));
  // ---- back
  add('a1', sc.back.start, sc.after.start, 'street', S_WIDE, (t) => big(t, { dave: 'crawl', crawlK: 1, flash: flashAt(t, SNAP), doorOpen: prog(t, SNAP + 0.2, SNAP + 0.8) }));
  // ---- after
  add('a2', sc.after.start, 82.0, 'house', mv([1.6, 3.3, 9.6], [1.3, 3.2, 9.1], [0, 2.6, -2.2], [0, 2.6, -2.2], 48), (t) => ({ grow: 1 - smooth(prog(t, m.heads, m.heads + 0.5)), crop: 1, holes: true }));
  add('a3', 82.0, 83.0, 'road', mv([3, 2.8, 5.2], [2.8, 2.75, 5.0], [0, 1.5, -1], [0, 1.5, -1], 46), (t) => ({ grow: 1 - smooth(prog(t, 82.1, 82.6)), sink: prog(t, 82.3, 82.8), holes: true, v: 0 }));
  add('a4', 83.0, sc.end.start, 'street', S_ROOF, (t) => big(t, { dave: 'crawl', crawlK: 1, priyaRoof: 1 - smooth(prog(t, 83.5, 84.3)), roofHole: true }));
  // ---- end
  add('z1', sc.end.start, m.itemone - 0.1, 'street', mv([1.9, 1.5, 3.1], [1.7, 1.45, 2.9], [0, 1.0, 0.3], [0, 1.0, 0.3], 44), (t) => big(t, { dave: 'in', inK: prog(t, sc.end.start, m.itemone - 0.2), doorOpen: 1, eggs: 'crushed' }));
  add('z2', m.itemone - 0.1, m.writes - 0.1, 'street', mv([0.95, 0.75, 1.35], [0.9, 0.7, 1.25], [0.45, 0.14, 0.42], [0.45, 0.14, 0.42], 36), (t) => big(t, { dave: 'in', inK: 1, doorOpen: 1, eggs: 'crushed' }));
  add('z3', m.writes - 0.1, 90.3, 'list', mv([0.16, 1.25, 0.8], [0.12, 1.2, 0.72], [0, 0, 0.05], [0, 0, 0.05], 42), (t) => ({ k: prog(t, m.writes, m.writes + 1.3) }));
  add('z4', 90.3, sc.endcard.start, 'street', mv([0.05, 1.45, -2.6], [0.05, 1.45, -2.45], [0.1, 1.5, 0.95], [0.1, 1.5, 0.95], 44), (t) => big(t, { dave: 'stand', look: 'door', doorOpen: 1, hall: true, smile: true }));
  add('endcard', sc.endcard.start, sc.endcard.end, 'black', () => ({ pos: V3(0, 0, 5), look: V3(0, 0, 0) }), () => ({}));
  return { shots };
}
