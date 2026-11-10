import { lerp, easeInOut, easeOut, easeIn, prog, smooth, V3, lerpV } from './util.js';
const GOLD = '#f2c85b';
function camKeys(keys) { return (tl) => { if (tl <= keys[0].t) return keys[0]; for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (tl <= b.t) { const k = easeInOut(prog(tl, a.t, b.t)); return { pos: lerpV(a.pos, b.pos, k), look: lerpV(a.look, b.look, k), fov: lerp(a.fov ?? 44, b.fov ?? 44, k) }; } } return keys[keys.length - 1]; }; }
const K = (t, pos, look, fov) => ({ t, pos: V3(...pos), look: V3(...look), fov });
const mv = (p0, p1, l0, l1, fov = 44, d = 3) => camKeys([K(0, p0, l0, fov), K(d, p1, l1, fov)]);

export function overlayCfgIce(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on, SNAP = m.way;
  const fmtT = (v) => { v = Math.max(0, v); const s = Math.floor(v); const ms = Math.floor((v - s) * 1000); return `0:0${s}.${String(ms).padStart(3, '0')}`; };
  const level = (t) => t < m.rise ? 0 : 70 * easeOut(prog(t, m.rise, m.everywhere + 0.3));
  return {
    title: [[{ t: 'What if all the ice on Earth' }], [{ t: 'melted in 5 seconds', c: GOLD }, { t: '?' }]],
    titleFrom: 0.3, titleTo: sc.dave.start + 4.2,
    counter: { from: ON - 0.05,
      label: (t) => t < SNAP ? 'MELT COMPLETE IN' : t < sc.flood.start ? 'MELT COMPLETE' : t < m.everywhere + 0.3 ? 'SEA LEVEL' : 'SEA LEVEL · FINAL',
      fmt: (t) => t < sc.flood.start ? fmtT(5 * (1 - prog(t, ON, SNAP))) : t < m.everywhere + 0.3 ? `+${level(t).toFixed(1)} M` : '+70 M',
      color: (t) => t >= m.rise && t < m.everywhere + 0.3 ? GOLD : '#fff' },
    status: [[sc.dave.start, 'DAVE’S SANDCASTLE · TOWERS: 3 OF 4'], [m.model, 'DAVE’S SANDCASTLE · SCALE 1:40'], [m.priya, 'DAVE’S SANDCASTLE · TOWERS: 4 OF 4'], [ON, 'DAVE’S SANDCASTLE · MOAT: NOT YET'], [m.beach, 'DAVE’S SANDCASTLE · STILL STANDING'], [m.notice, 'DAVE’S SANDCASTLE · HORIZON: NOTED'], [m.moat, 'DAVE’S SANDCASTLE · MOAT: IN PROGRESS'], [m.week, 'DAVE’S SANDCASTLE · MOAT: COMPLETE'], [m.factor, 'DAVE’S SANDCASTLE · STATUS: SUBMERGED'], [m.plan, 'DAVE’S SANDCASTLE · BUCKET: SAVED']],
    callouts: [
      [m.model, m.priya - 0.1, 'SCALE', '1:40'],
      [m.priya, ON - 0.1, 'SEATING PLAN · TABLE 7', 'UNRESOLVED'],
      [m.allofit, m.five - 0.1, 'ANTARCTICA · GREENLAND · GLACIERS', 'ALL OF IT'],
      [m.vol, m.thick - 0.1, 'ALL THE ICE ON EARTH', '30,000,000 KM³'],
      [m.thick, m.water - 0.1, 'ANTARCTIC ICE, AVERAGE', '≈ 2 KM THICK'],
      [m.water, sc.energy.start - 0.1, 'NOW', '2 KM OF WATER'],
      [m.energy, m.five2 - 0.1, 'HEAT TO MELT IT', '≈ 9 × 10²⁴ J'],
      [m.five2, m.five2 + 0.3, 'WORLD ENERGY USE', '≈ 15,000 YEARS'],
      [m.beach, m.poles - 0.1, 'ICE CREAM', 'ALSO ICE'],
      [m.poles, m.way - 0.1, 'MELTWATER AT THE SOUTH POLE', '≈ 90%'],
      [m.slides, m.tsunami - 0.1, 'BIGGEST FLOOD IN HISTORY', 'BY SOME MARGIN'],
      [m.tsunami, m.speed - 0.1, 'DEEP-OCEAN WAVE SPEED', '√(g·h)'],
      [m.speed, sc.arrival.start - 0.1, 'SAME AS', 'A JET AIRLINER'],
      [m.day, m.rise - 0.1, 'ANTARCTICA → BRIGHTON', '≈ 21 H'],
      [m.rise, m.storey - 0.1, 'SEA LEVEL', '+70 M'],
      [m.storey, m.everywhere - 0.1, '70 M', '≈ 20 STOREYS'],
      [m.everywhere, sc.cities.start - 0.1, 'NEW COASTLINE', 'EVERYWHERE'],
      [m.london, m.ny - 0.1, 'LONDON', '≈ 11 M ABOVE SEA'],
      [m.ny, m.shanghai - 0.1, 'NEW YORK', '≈ 10 M'],
      [m.shanghai, m.tokyo - 0.1, 'SHANGHAI', '≈ 4 M'],
      [m.tokyo, m.eight - 0.1, 'TOKYO', '≈ 40 M'],
      [m.eight, sc.seaice.start - 0.1, 'BIGGEST CITIES ON A COAST', '8 OF 10'],
      [m.seaice, m.already - 0.1, 'ARCTIC SEA ICE', 'SEA LEVEL +0 M'],
      [m.already, m.arch - 0.1, 'FLOATING ICE DISPLACES', 'ITS OWN WEIGHT'],
      [m.arch, sc.dave_mid.start - 0.1, 'ARCHIMEDES', 'c. 250 BC'],
      [m.notice, m.moat - 0.1, 'HORIZON', 'HIGHER THAN USUAL'],
      [m.moat, sc.salt.start - 0.1, 'MOAT CAPACITY', '≈ 40 LITRES'],
      [m.salt, m.fish - 0.1, 'SALINITY', '35 → 34.2 G/KG'],
      [m.fish, m.onlyfish - 0.1, 'FISH', 'FINE'],
      [m.onlyfish, sc.earth.start - 0.1, 'EVERYONE ELSE', 'NOT FINE'],
      [m.space, m.darker - 0.1, 'ICE COVER', '0%'],
      [m.darker, m.week - 0.1, 'SUNLIGHT REFLECTED · ICE / SEA', '≈ 80% / 6%'],
      [m.week, sc.dave_end.start - 0.1, 'LONG-TERM FORECAST', 'WARMER'],
      [m.factor, m.venue - 0.1, 'SANDCASTLE', 'NO LONGER A FACTOR'],
      [m.venue, m.plan - 0.1, 'THE VENUE', 'ALSO ON THE COAST'],
      [m.plan, sc.endcard.start - 0.1, 'SEATING PLAN', 'DRY'],
    ],
    end: { lines: ['ALL THE LAND ICE = ABOUT 70 M OF SEA LEVEL.', 'THE REAL SEA IS RISING ABOUT 4 MM A YEAR.'] },
  };
}

export function buildShotsIce(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on, SNAP = m.way;
  const shots = []; const add = (id, from, to, set, cam, ctx) => shots.push({ id, from, to, set, cam, ctx });
  const flashAt = (t, t0, a = 0.55) => t >= t0 ? Math.max(0, a - (t - t0) * 2.3) : 0;
  const melt = (t) => prog(t, ON, SNAP); // 0..1 over the five "seconds"
  const ST = (y = 2.0, z = 5.5, fov = 44) => mv([0.6, y + 0.3, z], [-0.4, y + 0.1, z - 0.8], [0, y, 0], [0, y, 0], fov);
  const CITYF = (a = 0, h = 75, d = 4) => mv([60 * Math.cos(a), h, 60 * Math.sin(a) + 40], [55 * Math.cos(a + 0.25), h - 13, 55 * Math.sin(a + 0.25) + 30], [0, 0, 0], [0, 4, 0], 46, d);
  // beach cameras (Dave kneels at (0,0,-0.7) facing +z, castle at origin, Priya's chair at (2,0,0.6))
  const DCLOSE = mv([0.12, 1.32, 1.25], [0.1, 1.3, 1.15], [0, 1.22, -0.7], [0, 1.22, -0.7], 30);
  const DMED = mv([1.7, 1.45, 3.4], [1.5, 1.4, 3.1], [0.5, 0.7, -0.3], [0.5, 0.7, -0.3], 44);
  const CASTLE = mv([2.1, 0.9, 2.4], [1.95, 0.85, 2.25], [0, 0.45, 0], [0, 0.45, 0], 40);
  const PRIYA = mv([2.4, 1.25, 2.5], [2.3, 1.2, 2.3], [2.0, 0.85, 0.6], [2.0, 0.85, 0.6], 38);
  const BWIDE = mv([-3, 2.6, 9.5], [-2.6, 2.5, 8.8], [-4, 1.5, -30], [-4, 1.5, -30], 55);
  const OTS = mv([-0.1, 1.8, 0.15], [-0.1, 1.78, 0.0], [-0.3, 1.6, -60], [-0.3, 1.65, -60], 46);
  const POV = mv([-0.3, 1.62, -1.1], [-0.3, 1.62, -1.3], [-14, 8, -200], [-10, 10, -200], 52);
  const DIG = mv([-1.9, 1.5, 0.9], [-1.75, 1.45, 0.8], [0.0, 0.5, -0.4], [0.0, 0.5, -0.4], 42);
  const DFRONT = mv([0.3, 1.3, 1.5], [0.25, 1.28, 1.4], [0, 1.18, -0.7], [0, 1.18, -0.7], 36);
  const ZLOW = mv([-1.3, 1.05, 1.7], [-1.2, 1.0, 1.6], [0, 0.4, -0.1], [0, 0.4, -0.1], 44);
  const ZWIDE = mv([3.8, 2.3, 5.2], [3.5, 2.2, 4.8], [0.8, 1.0, -0.8], [0.8, 1.0, -0.8], 48);
  const PUP = mv([2.6, 2.1, 2.6], [2.5, 2.1, 2.45], [2.0, 2.0, 0.55], [2.0, 2.0, 0.55], 44);
  const ZCHIN = mv([0.12, 1.28, 1.25], [0.1, 1.27, 1.18], [0, 1.2, -0.7], [0, 1.2, -0.7], 30);
  const beach = (t, o = {}) => ({ icecream: t < ON + 0.4, tower4: prog(t, m.model + 0.9, m.model + 1.5), ...o });
  // ---- hook
  add('h1', 0, 0.9, 'space', mv([0, -290, 75], [0, -275, 72], [0, 0, 0], [0, 0, 0], 36), (t) => ({ melt: prog(t, 0.2, 0.8), seaIce: 1 - prog(t, 0.2, 0.8), spin: 0, sunDir: [150, -170, 160] }));
  add('h2', 0.9, sc.dave.start, 'beach', DCLOSE, (t) => beach(t, { dave: 'pat', daveLook: 'cam', gull: 'post' }));
  // ---- dave
  add('d1', sc.dave.start, 4.4, 'beach', DMED, (t) => beach(t, { dave: 'pat', gull: 'post' }));
  add('d2', 4.4, m.priya - 0.1, 'beach', CASTLE, (t) => beach(t, { dave: 'pat' }));
  add('d3', m.priya - 0.1, sc.event.start, 'beach', PRIYA, (t) => beach(t, { priya: t > m.priya + 1.0 ? 'look' : 'read' }));
  // ---- event
  add('e1', sc.event.start, 10.6, 'beach', DCLOSE, (t) => beach(t, { dave: 'frozen', daveLook: 'cam', flash: flashAt(t, ON), wide: t > ON ? 1 : 0, open: t > ON ? 0.6 : 0 }));
  add('e2', 10.6, m.allofit - 0.1, 'antarctic', mv([-6, 2.2, -8], [-5, 2.3, -6], [1, 0.8, 8], [1, 0.8, 8], 46), (t) => ({ melt: melt(t) * 0.5 }));
  add('e3', m.allofit - 0.1, m.five - 0.1, 'space', mv([60, 80, 230], [50, 75, 215], [0, 0, 0], [0, 0, 0], 40), (t) => ({ melt: melt(t), seaIce: 1 - melt(t) * 2 }));
  add('e4', m.five - 0.1, sc.volume.start, 'antarctic', mv([-6, 1.3, 18], [-5, 1.2, 16], [-2, 0.6, 9], [-2, 0.6, 9], 40), (t) => ({ melt: 0.75 + melt(t) * 0.25, waterY: lerp(-0.4, -0.05, prog(t, m.five, m.five + 1)) }));
  // ---- volume
  add('v1', sc.volume.start, m.thick - 0.1, 'studio', camKeys([K(0, [1.4, 0.9, 7], [0, 1.0, 0], 44), K(2.6, [0.8, 2.6, 9.5], [0, 2.1, 0], 44)]), (t) => ({ prop: 'cube' }));
  add('v2', m.thick - 0.1, m.water - 0.1, 'studio', ST(1.8, 12.0, 46), (t) => ({ prop: 'slab', slabMelt: 0 }));
  add('v3', m.water - 0.1, 22.1, 'studio', mv([1.4, 2.6, 5.2], [1.0, 2.5, 4.6], [0, 2.0, 0], [0, 2.0, 0], 40), (t) => ({ prop: 'slab', slabMelt: prog(t, m.water + 0.1, m.water + 0.9) }));
  add('v4', 22.1, sc.energy.start, 'antarctic', mv([-70, 40, -60], [-62, 38, -52], [10, 0, 40], [10, 0, 40], 50), (t) => ({ melt: 1 }));
  // ---- energy
  add('n1', sc.energy.start, 25.6, 'studio', camKeys([K(0, [0.7, 1.0, 7.5], [0, 1.2, 0], 46), K(2.0, [0.6, 4.4, 9.5], [0, 4.4, 0], 46)]), (t) => ({ prop: 'energy', years: 0.6 * easeOut(prog(t, sc.energy.start + 0.2, 25.4)) }));
  add('n2', 25.6, m.five2 - 0.1, 'city', CITYF(1.2, 70, 2), (t) => ({ mode: 'traffic' }));
  add('n3', m.five2 - 0.1, m.beach - 0.1, 'studio', mv([0.9, 7.0, 8.5], [0.8, 6.9, 8.0], [0.1, 6.6, 0], [0.1, 6.6, 0], 40), (t) => ({ prop: 'energy', years: lerp(0.6, 1, easeOut(prog(t, m.five2 - 0.1, m.five2 + 0.5))), stamp: prog(t, m.five2 + 0.35, m.five2 + 0.75) }));
  add('n4', m.beach - 0.1, m.poles - 0.1, 'beach', BWIDE, (t) => beach(t, { dave: 'pat', gull: 'post' }));
  add('n5', m.poles - 0.1, m.way - 0.1, 'space', mv([0, 160, 220], [10, 150, 210], [0, 0, 0], [0, 0, 0], 40), (t) => ({ melt: 1, seaIce: 0, poleGlow: 1, sunDir: [150, 170, 160] }));
  add('n6', m.way - 0.1, sc.flood.start, 'antarctic', camKeys([K(0, [0, 3, 380], [0, 2.5, 0], 60), K(1.2, [0, 3.5, 40], [0, 2.5, -400], 60)]), (t) => ({ melt: 1 }));
  // ---- flood
  add('f1', sc.flood.start, 36.1, 'antarctic', mv([260, 60, -520], [240, 58, -545], [-150, -30, -260], [-150, -32, -270], 50), (t) => ({ melt: 1, slide: prog(t, sc.flood.start, sc.flood.start + 2.4) * 0.8 }));
  add('f2', 36.1, m.tsunami - 0.1, 'space', mv([-180, -90, 200], [-170, -80, 195], [0, -20, 0], [0, -20, 0], 42), (t) => ({ melt: 1, seaIce: 0, ring: 0.1 + 1.3 * prog(t, 36.1, m.tsunami - 0.2), spin: 0 }));
  add('f3', m.tsunami - 0.1, m.speed - 0.1, 'ocean', mv([40, 25, -60], [35, 24, -70], [0, 5, -700], [0, 8, -500], 46), (t) => ({ waveZ: lerp(-1500, -260, easeIn(prog(t, m.tsunami - 0.1, m.speed - 0.1))), waveH: 10, shipDrop: 0 }));
  { const wz = (t) => lerp(-900, -300, prog(t, m.speed - 0.1, sc.arrival.start)); add('f4', m.speed - 0.1, sc.arrival.start, 'ocean', (tl, d, t) => ({ pos: V3(170, 48, wz(t) + 90), look: V3(0, 14, wz(t)), fov: 46 }), (t) => ({ waveZ: wz(t), waveH: 10, plane: true, planeX: 40, planeY: 34, planeZ: wz(t) + 10 })); }
  // ---- arrival
  add('a1', sc.arrival.start, m.rise - 0.1, 'ocean', mv([0, 5, 320], [0, 7, 305], [0, 12, 0], [0, 14, 0], 50), (t) => ({ floodY: 26 * easeIn(prog(t, sc.arrival.start + 0.3, m.rise + 0.2)), splashK: prog(t, sc.arrival.start + 0.5, m.rise) }));
  add('a2', m.rise - 0.1, m.storey - 0.1, 'studio', camKeys([K(0, [2.5, 2.0, 9], [0.5, 1.6, 0], 48), K(1.9, [2.0, 8.0, 10], [0.5, 4.4, 0], 48)]), (t) => ({ prop: 'tower', waterK: easeOut(prog(t, m.rise, m.storey - 0.2)) }));
  add('a3', m.storey - 0.1, m.everywhere - 0.1, 'city', CITYF(0.3, 90, 2), (t) => ({ mode: 'roofs', floodY: lerp(2, 20, prog(t, m.storey - 0.1, m.everywhere - 0.2)) }));
  add('a4', m.everywhere - 0.1, sc.cities.start, 'space', mv([0, 40, 250], [0, 30, 230], [0, 0, 0], [0, 0, 0], 40), (t) => ({ melt: 1, seaIce: 0, rise: prog(t, m.everywhere - 0.1, m.everywhere + 0.6) }));
  // ---- cities
  add('c1', sc.cities.start, m.ny - 0.1, 'city', mv([-42, 32, 30], [-38, 30, 26], [-13, 14, -13], [-13, 14, -13], 46), (t) => ({ mode: 'roofs', floodY: 18, london: true }));
  add('c2', m.ny - 0.1, m.shanghai - 0.1, 'city', CITYF(2.0, 60, 1), (t) => ({ mode: 'roofs', floodY: 22 }));
  add('c3', m.shanghai - 0.1, m.tokyo - 0.1, 'city', mv([10, 110, 10], [8, 100, 8], [0, 0, 0], [0, 0, 0], 50), (t) => ({ mode: 'roofs', floodY: 24 }));
  add('c4', m.tokyo - 0.1, m.eight - 0.1, 'city', mv([40, 26, -60], [36, 25, -54], [0, 20, 0], [0, 20, 0], 46), (t) => ({ mode: 'roofs', floodY: 20 }));
  add('c5', m.eight - 0.1, 54.8, 'studio', ST(1.1, 10.5, 46), (t) => ({ prop: 'cities', waterK: easeOut(prog(t, m.eight, m.eight + 1.3)) }));
  add('c6', 54.8, sc.seaice.start, 'studio', camKeys([K(0, [-2.2, 1.3, 3.6], [-2.2, 0.8, 0], 44), K(1.6, [2.2, 1.3, 3.6], [2.2, 0.8, 0], 44)]), (t) => ({ prop: 'cities', waterK: 1, were: t > 55.9 }));
  // ---- sea ice
  add('s1', sc.seaice.start, m.already - 0.1, 'space', mv([0, 230, 60], [0, 220, 50], [0, 0, 0], [0, 0, 0], 36), (t) => ({ melt: 1, seaIce: 1 - prog(t, m.seaice + 0.3, m.already - 0.3), spin: 0, sunDir: [150, 170, 160] }));
  add('s2', m.already - 0.1, m.arch - 0.1, 'studio', ST(0.9, 4.4, 44), (t) => ({ prop: 'bath', cubeK: 1 }));
  add('s3', m.arch - 0.1, 61.5, 'studio', mv([-0.5, 1.5, 2.8], [-0.45, 1.4, 2.5], [-0.55, 0.95, 0.1], [-0.55, 0.95, 0.1], 34), (t) => ({ prop: 'bath', cubeK: 1 - easeIn(prog(t, m.arch, m.arch + 1.1)) }));
  add('s4', 61.5, sc.dave_mid.start, 'studio', mv([1.0, 1.8, 3.8], [0.9, 1.8, 3.5], [0.3, 1.6, 0], [0.3, 1.6, 0], 44), (t) => ({ prop: 'bath', cubeK: 0, eureka: true, eurekaK: prog(t, 61.5, 61.9) }));
  // ---- dave mid
  add('m1', sc.dave_mid.start, 64.6, 'beach', OTS, (t) => beach(t, { dave: 'standSea', wallH: 70, lift: 0.4 }));
  add('m2', 64.6, m.moat - 0.1, 'beach', POV, (t) => beach(t, { dave: 'standSea', wallH: 70, lift: 0.4, flock: true, gullT: prog(t, 64.6, m.moat + 0.2) }));
  add('m3', m.moat - 0.1, sc.salt.start, 'beach', DIG, (t) => beach(t, { dave: 'dig', priya: 'look', wallH: 70, lift: 0.4, moat: 1 }));
  // ---- salt
  add('l1', sc.salt.start, 69.6, 'studio', ST(1.9, 9.5, 46), (t) => ({ prop: 'salt', pour: prog(t, sc.salt.start + 0.2, sc.salt.start + 0.8), saltK: prog(t, sc.salt.start + 0.8, m.fish) }));
  add('l2', 69.6, m.fish - 0.1, 'studio', mv([2.5, 1.8, 3.2], [2.4, 1.7, 2.9], [2.15, 1.3, 0], [2.15, 1.3, 0], 40), (t) => ({ prop: 'salt', pour: 1, saltK: prog(t, sc.salt.start + 0.8, m.fish) }));
  add('l3', m.fish - 0.1, m.onlyfish - 0.1, 'studio', mv([0.4, 1.4, 3.4], [0.3, 1.35, 3.0], [0, 1.1, 0], [0, 1.1, 0], 36), (t) => ({ prop: 'salt', pour: 0, saltK: 1, fine: t > m.fish + 0.5 }));
  add('l4', m.onlyfish - 0.1, sc.earth.start, 'city', mv([30, 24, -40], [27, 23, -36], [0, 18, 10], [0, 18, 10], 44), (t) => ({ mode: 'roofs', floodY: 22 }));
  // ---- earth
  add('r1', sc.earth.start, m.darker - 0.1, 'space', mv([150, 60, 260], [140, 55, 250], [0, 0, 0], [0, 0, 0], 40), (t) => ({ melt: 1, seaIce: 0, rise: 1 }));
  add('r2', m.darker - 0.1, m.week - 0.1, 'space', mv([-120, 30, 200], [-100, 28, 190], [0, 0, 0], [0, 0, 0], 34), (t) => ({ melt: 1, seaIce: 0, rise: 1, sunDir: [-230, 60, 60] }));
  add('r3', m.week - 0.1, sc.dave_end.start, 'beach', DFRONT, (t) => beach(t, { dave: 'frozen', daveLook: 'cam', wallH: 70, lift: 0.4, moat: 1, priya: 'look' }));
  // ---- end
  add('z1', sc.dave_end.start, 82.9, 'beach', ZLOW, (t) => beach(t, { dave: 'frozen', daveLook: 'castle', wallH: 70, lift: 0.4, moat: 1, floodY: 0.75 * easeOut(prog(t, m.factor, m.factor + 1.6)) }));
  add('z2', 82.9, m.plan - 0.1, 'beach', ZWIDE, (t) => beach(t, { dave: 'frozen', daveLook: 'priya', bucket: t > m.venue + 0.2, wallH: 70, lift: 0.4, moat: 1, floodY: lerp(0.75, 1.0, prog(t, 82.9, m.plan)), priya: t > m.venue - 0.2 ? 'stand' : 'up' }));
  add('z3', m.plan - 0.1, 86.6, 'beach', PUP, (t) => beach(t, { dave: 'frozen', daveLook: 'priya', bucket: true, wallH: 70, lift: 0.4, moat: 1, floodY: 1.02, priya: 'stand' }));
  add('z4', 86.6, sc.endcard.start, 'beach', ZCHIN, (t) => beach(t, { dave: 'frozen', daveLook: 'cam', bucket: true, wallH: 70, lift: 0.4, floodY: 1.06, priya: 'stand', gull: 'dave' }));
  add('endcard', sc.endcard.start, sc.endcard.end, 'black', () => ({ pos: V3(0, 0, 5), look: V3(0, 0, 0) }), () => ({}));
  return { shots };
}
