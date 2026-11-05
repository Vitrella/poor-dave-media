import { lerp, easeInOut, easeOut, prog, V3, lerpV } from './util.js';
export { overlayCfgFriction } from './shots_friction.js';
function camKeys(keys) { return (tl) => { if (tl <= keys[0].t) return keys[0]; for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (tl <= b.t) { const k = easeInOut(prog(tl, a.t, b.t)); return { pos: lerpV(a.pos, b.pos, k), look: lerpV(a.look, b.look, k), fov: lerp(a.fov ?? 44, b.fov ?? 44, k) }; } } return keys[keys.length - 1]; }; }
const K = (t, pos, look, fov) => ({ t, pos: V3(...pos), look: V3(...look), fov });
const mv = (p0, p1, l0, l1, fov = 44, d = 3) => camKeys([K(0, p0, l0, fov), K(d, p1, l1, fov)]);
// Video 7 v2: 40 shots, 6 sets (room, street, pitch, city, studio, space)
export function buildShotsFriction2(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on, SNAP = m.back;
  const shots = []; const add = (id, from, to, set, cam, ctx) => shots.push({ id, from, to, set, cam, ctx });
  const flashAt = (t, t0, a = 0.55) => t >= t0 ? Math.max(0, a - (t - t0) * 2.3) : 0;
  const fr = (t) => ({ stuck: 1, tug: t < SNAP, fly: prog(t, m.including + 0.1, m.including + 1.0), wide: t >= ON && t < SNAP ? 1 : 0, assistant: 'none' });
  const W = mv([0.35, 1.55, 2.25], [0.3, 1.52, 2.05], [0, 1.4, -0.3], [0, 1.4, -0.3], 46);
  const C = mv([0.25, 1.7, 1.75], [0.22, 1.7, 1.55], [0, 1.6, -0.2], [0, 1.6, -0.2], 39);
  const SIDE = mv([-0.45, 1.75, 2.0], [-0.35, 1.7, 1.8], [0.05, 1.45, -0.3], [0.05, 1.45, -0.3], 42);
  const LOW = mv([-0.5, 0.9, 1.8], [-0.4, 1.0, 1.6], [0, 1.5, -0.3], [0, 1.5, -0.3], 44);
  const ST = (y = 2.0, z = 5.5, fov = 44) => mv([0.6, y + 0.3, z], [-0.4, y + 0.1, z - 0.8], [0, y, 0], [0, y, 0], fov);
  const STC = (y = 2.0, z = 4.2, fov = 40) => mv([-0.5, y + 0.2, z], [0.3, y + 0.05, z - 0.5], [0, y, 0], [0, y, 0], fov);
  const CITY = (a = 0, h = 75) => mv([60 * Math.cos(a), h, 60 * Math.sin(a) + 40], [55 * Math.cos(a + 0.25), h - 13, 55 * Math.sin(a + 0.25) + 30], [0, 0, 0], [0, 4, 0], 46, 4);
  const STREET = mv([3.5, 5.5, 17.4], [2.5, 5.2, 17.2], [-3, 0.3, 9.5], [-2, 0.3, 9.5], 48, 4);
  const STREET2 = mv([11, 2.2, 17], [10.8, 2.2, 16.8], [4, 0.8, 11], [4, 0.8, 11], 44, 2);
  const STREET3 = mv([-4, 4.5, 17.2], [-3.4, 4.3, 17.0], [2.5, 0.3, 10], [3.2, 0.3, 10], 46, 2.5);
  const carT = (t) => t - m.seven - 0.2;
  // intro
  add('h1', 0, 1.0, 'room', C, (t) => ({ ...fr(t), wide: 1 }));
  add('h2', 1.0, sc.dave.start, 'city', CITY(0.4), () => ({ mode: 'traffic' }));
  // dave
  add('d1', sc.dave.start, 3.8, 'room', W, (t) => ({ ...fr(t), assistant: 'idle' }));
  add('d2', 3.8, 5.05, 'room', SIDE, (t) => ({ ...fr(t), assistant: 'idle' }));
  add('d3', 5.05, 6.95, 'room', C, (t) => ({ ...fr(t) }));
  add('d4', 6.95, sc.event.start, 'room', LOW, (t) => ({ ...fr(t) }));
  // event
  add('e1', sc.event.start, 10.4, 'street', STREET3, (t) => ({ carT: -1.5 + (t - sc.event.start) * 0.3, flash: flashAt(t, ON) }));
  add('e2', 10.4, 11.95, 'space', mv([0, 30, 330], [10, 25, 290], [0, 0, 0], [0, 0, 0], 36, 2), () => ({ atmGrow: 0 }));
  add('e3', 11.95, 13.15, 'studio', ST(2.0, 5.0), (t) => ({ prop: 'knot', knotK: easeOut(prog(t, 12.2, 13.1)) }));
  add('e4', 13.15, sc.jumper.start, 'city', CITY(2.0, 60), () => ({ mode: 'stopped' }));
  // jumper
  add('j1', sc.jumper.start, 16.7, 'room', SIDE, (t) => ({ ...fr(t), tug: true }));
  add('j2', 16.7, sc.cars.start, 'room', mv([0.25, 1.7, 1.9], [0.2, 1.7, 1.3], [0, 1.65, -0.2], [0, 1.65, -0.2], 36, 1.7), (t) => ({ ...fr(t), tug: true }));
  // cars
  add('c1', sc.cars.start, 21.3, 'street', STREET, (t) => ({ carT: carT(t) }));
  add('c2', 21.3, 23.0, 'studio', mv([4.5, 6.5, 3.0], [4.0, 6.2, 2.4], [0, 0.3, -6], [0, 0.3, -6], 56, 2), (t) => ({ prop: 'brake', ghost: true, brakeK: prog(t, 21.4, 22.9) }));
  add('c3', 23.0, 24.8, 'street', STREET3, (t) => ({ carT: carT(t) }));
  add('c4', 24.8, 26.7, 'city', CITY(3.4, 55), () => ({ mode: 'stopped' }));
  add('c5', 26.7, sc.engines.start, 'street', STREET2, (t) => ({ carT: carT(t) }));
  // engines
  add('g1', sc.engines.start, 30.9, 'street', mv([1.0, 5.0, 17.3], [0.6, 4.8, 17.1], [-6, 0.3, 10], [-6, 0.3, 10], 46, 2), (t) => ({ carT: 20 }));
  add('g2', 30.9, 32.6, 'studio', ST(2.4, 9.5), () => ({ prop: 'fuel', fuelK: 0 }));
  add('g3', 32.6, 35.1, 'studio', STC(2.4, 8.6), (t) => ({ prop: 'fuel', fuelK: easeOut(prog(t, 33.8, 34.8)) }));
  add('g4', 35.1, sc.football.start, 'city', CITY(1.2, 70), (t) => ({ mode: 'traffic' }));
  // football
  add('b1', sc.football.start, 39.9, 'pitch', mv([1.8, 1.6, 6], [1.7, 1.7, 5], [0.3, 0.4, -15], [0.3, 0.4, -18], 44, 2.2), (t) => ({ kickT: t - m.ball - 0.4 }));
  add('b2', 39.9, 41.6, 'pitch', mv([2.2, 0.35, -14], [2.0, 0.4, -15.5], [0.3, 0.15, -19], [0.3, 0.15, -19], 42, 1.7), (t) => ({ kickT: t - m.ball - 0.4 }));
  add('b3', 41.6, sc.hands.start, 'pitch', mv([1.2, 1.6, -31], [1.0, 1.6, -32], [0, 1.3, -36.5], [0, 1.4, -36.5], 42, 2.4), (t) => ({ kickT: 20, credit: t >= m.keeper }));
  // hands
  add('n1', sc.hands.start, 45.6, 'studio', ST(2.0, 6.2), () => ({ prop: 'hands', heat: 0 }));
  add('n2', 45.6, 47.5, 'studio', STC(2.0, 3.8), (t) => ({ prop: 'hands', heat: easeOut(prog(t, 45.8, 46.8)) }));
  add('n3', 47.5, 49.4, 'room', C, (t) => ({ ...fr(t) }));
  add('n4', 49.4, sc.stuck.start, 'room', mv([0.35, 0.95, 1.35], [0.3, 1.0, 1.2], [0, 1.95, -0.3], [0, 2.0, -0.3], 50, 2.4), (t) => ({ ...fr(t) }));
  // stuck
  add('s1', sc.stuck.start, 53.9, 'studio', ST(2.0, 5.0), (t) => ({ prop: 'zip', zipK: lerp(0, 0.9, prog(t, 52.2, 54.4)) }));
  add('s2', 53.9, 55.5, 'room', mv([0.4, 1.5, 4.0], [0.45, 1.5, 3.8], [1.45, 1.1, 1.6], [1.45, 1.1, 1.6], 38, 1.6), (t) => ({ ...fr(t), assistant: 'zip', zipTug: true }));
  add('s3', 55.5, 57.7, 'studio', STC(2.0, 4.0), (t) => ({ prop: 'knot', knotK: easeOut(prog(t, 55.9, 57.0)) }));
  add('s4', 57.7, sc.back.start, 'studio', ST(2.0, 5.0), () => ({ prop: 'screw', shake: 1 }));
  // back
  add('k1', sc.back.start, 61.8, 'space', mv([40, 20, 300], [30, 18, 270], [0, 0, 0], [0, 0, 0], 36, 1.8), () => ({ atmGrow: 0 }));
  add('k2', 61.8, sc.aftermath.start, 'room', W, (t) => ({ ...fr(t), flash: flashAt(t, SNAP, 0.6), assistant: 'idle' }));
  // aftermath
  add('a1', sc.aftermath.start, 64.6, 'city', CITY(4.4, 65), () => ({ mode: 'traffic' }));
  add('a2', 64.6, 66.0, 'room', W, (t) => ({ ...fr(t), assistant: 'idle', wide: t > m.including + 0.3 ? 0.7 : 0 }));
  add('a3', 66.0, sc.dave_end.start, 'room', mv([0.25, 1.75, 1.9], [0.22, 1.72, 1.6], [0, 1.65, -0.2], [0, 1.6, -0.2], 40, 0.9), (t) => ({ ...fr(t), assistant: 'idle', wide: 0.7 }));
  // end
  add('z1', sc.dave_end.start, 69.0, 'room', SIDE, () => ({ stuck: 0, folded: true, smile: true, assistant: 'idle' }));
  add('z2', 69.0, sc.endcard.start, 'room', mv([0.3, 1.5, 1.9], [0.28, 1.5, 1.6], [0, 1.3, -0.3], [0, 1.3, -0.3], 40, 2.6), () => ({ stuck: 0, folded: true, smile: true, assistant: 'none' }));
  add('endcard', sc.endcard.start, sc.endcard.end, 'black', () => ({ pos: V3(0, 0, 5), look: V3(0, 0, 0) }), () => ({}));
  return { shots };
}
