import { lerp, easeInOut, prog, V3, lerpV } from './util.js';
function camKeys(keys) { return (tl) => { if (tl <= keys[0].t) return keys[0]; for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (tl <= b.t) { const k = easeInOut(prog(tl, a.t, b.t)); return { pos: lerpV(a.pos, b.pos, k), look: lerpV(a.look, b.look, k), fov: lerp(a.fov ?? 44, b.fov ?? 44, k) }; } } return keys[keys.length - 1]; }; }
const K = (t, pos, look, fov) => ({ t, pos: V3(...pos), look: V3(...look), fov });
const GOLD = '#f2c85b';
export function buildShotsFriction(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on, SNAP = m.back;
  const shots = []; const add = (id, from, to, set, cam, ctx) => shots.push({ id, from, to, set, cam, ctx });
  const flashAt = (t, t0, a = 0.55) => t >= t0 ? Math.max(0, a - (t - t0) * 2.3) : 0;
  const fr = (t) => ({ stuck: 1, tug: t < SNAP, fly: prog(t, m.including + 0.1, m.including + 1.0), wide: t >= ON && t < SNAP ? 1 : 0, assistant: 'none' });
  const W = camKeys([K(0, [0.35, 1.55, 2.25], [0, 1.4, -0.3], 46), K(6, [0.3, 1.52, 2.1], [0, 1.4, -0.3], 46)]);
  const C = camKeys([K(0, [0.25, 1.7, 1.75], [0, 1.6, -0.2], 40), K(5, [0.22, 1.7, 1.6], [0, 1.6, -0.2], 38)]);
  add('hook', 0, sc.dave.start, 'room', C, (t) => ({ ...fr(t) }));
  add('dave_a', sc.dave.start, m.halfway - 0.1, 'room', W, (t) => ({ ...fr(t), assistant: 'idle' }));
  add('dave_b', m.halfway - 0.1, sc.event.start, 'room', C, (t) => ({ ...fr(t) }));
  add('event', sc.event.start, sc.jumper.start, 'room', W, (t) => ({ ...fr(t), flash: flashAt(t, ON), assistant: 'idle' }));
  add('jumper', sc.jumper.start, sc.cars.start, 'room', C, (t) => ({ ...fr(t), tug: true }));
  add('cars_a', sc.cars.start, m.seatbelt - 0.1, 'street', camKeys([K(0, [4, 2.6, 17.2], [-3, 0.6, 11], 56), K(10, [3.5, 2.5, 17], [-2, 0.6, 11], 56)]), (t) => ({ carT: t - m.seven - 0.2 }));
  add('cars_b', m.seatbelt - 0.1, sc.engines.start, 'street', camKeys([K(0, [11, 2.2, 17], [4, 0.8, 11], 44), K(2.2, [10.8, 2.2, 16.8], [4, 0.8, 11], 44)]), (t) => ({ carT: t - m.seven - 0.2 }));
  add('engines', sc.engines.start, sc.football.start, 'street', camKeys([K(0, [3, 2.0, 17.2], [-7, 0.6, 11], 50), K(8.6, [2.5, 2.0, 16.8], [-7, 0.6, 11], 50)]), (t) => ({ carT: 20, groan: t >= m.twothirds }));
  add('football', sc.football.start, sc.hands.start, 'pitch', camKeys([K(0, [1.8, 1.6, 6], [0.3, 0.4, -15], 44), K(6.4, [1.6, 1.8, 4], [0.3, 0.4, -20], 44)]), (t) => ({ kickT: t - m.ball - 0.4, credit: t >= m.keeper }));
  add('hands', sc.hands.start, sc.stuck.start, 'room', camKeys([K(0, [0.6, 1.6, 1.6], [0, 1.5, -0.3], 42), K(7.8, [0.5, 1.6, 1.4], [0, 1.5, -0.3], 40)]), (t) => ({ ...fr(t) }));
  add('stuck', sc.stuck.start, sc.back.start, 'room', camKeys([K(0, [0.4, 1.5, 4.0], [1.45, 1.1, 1.6], 40), K(8, [0.45, 1.5, 3.8], [1.45, 1.1, 1.6], 38)]), (t) => ({ ...fr(t), assistant: 'zip', zipTug: true }));
  add('back', sc.back.start, sc.aftermath.start, 'room', W, (t) => ({ ...fr(t), flash: flashAt(t, SNAP, 0.6), assistant: 'idle' }));
  add('after', sc.aftermath.start, sc.dave_end.start, 'room', W, (t) => ({ ...fr(t), assistant: 'idle', wide: t > m.including + 0.3 ? 0.7 : 0 }));
  add('end', sc.dave_end.start, sc.endcard.start, 'room', camKeys([K(0, [0.3, 1.5, 1.9], [0, 1.3, -0.3], 42), K(4.7, [0.28, 1.5, 1.75], [0, 1.3, -0.3], 40)]), (t) => ({ stuck: 0, folded: true, smile: true, assistant: 'none' }));
  add('endcard', sc.endcard.start, sc.endcard.end, 'black', () => ({ pos: V3(0, 0, 5), look: V3(0, 0, 0) }), () => ({}));
  return { shots };
}
export function overlayCfgFriction(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on, SNAP = m.back;
  const fmt = (v) => { v = Math.max(0, v); const s = Math.floor(v); const ms = Math.floor((v - s) * 1000); return `0:0${s}.${String(ms).padStart(3, '0')}`; };
  return {
    title: [[{ t: 'What if ' }, { t: 'friction', c: GOLD }, { t: ' doubled' }], [{ t: 'for 5 seconds?' }]],
    titleFrom: 0.3, titleTo: sc.dave.start + 4.0,
    counter: { from: ON - 0.05, label: (t) => t >= SNAP ? 'FRICTION BACK TO NORMAL' : 'FRICTION NORMAL IN', fmt: (t) => fmt(5 * (1 - prog(t, ON, SNAP))) },
    status: [[sc.dave.start, 'DAVE’S JUMPER · HALFWAY OFF'], [m.committed, 'DAVE’S JUMPER · COMMITTED'], [m.cannot, 'DAVE’S JUMPER · STILL ON'], [m.including, 'DAVE’S JUMPER · OFF'], [m.buys, 'DAVE’S JUMPER · PURCHASED']],
    callouts: [
      [m.small, m.halfway - 0.1, 'JUMPER SIZE', 'ONE TOO SMALL'],
      [m.grips, sc.jumper.start - 0.1, 'FRICTION COEFFICIENT', 'μ → 2μ'],
      [m.car50, m.seven - 0.1, 'BRAKING FROM 50 KM/H', '14 M'],
      [m.seven, m.seatbelt - 0.1, 'BRAKING NOW', '7 M'],
      [m.seatbelt, sc.engines.start - 0.1, 'PASSENGERS', 'FORWARD'],
      [m.fuel, m.twothirds - 0.1, 'CAR FUEL LOST TO FRICTION', '1 / 3'],
      [m.twothirds, m.groan - 0.1, 'FOR 5 SECONDS', '2 / 3'],
      [m.groan, sc.football.start - 0.1, 'CARS ON EARTH', '1,400,000,000+'],
      [m.ball, m.keeper - 0.1, 'BALL ROLLS', '40 M → 20 M'],
      [m.keeper, sc.hands.start - 0.1, 'GOALKEEPER', 'TAKING CREDIT'],
      [m.rub, m.cannot - 0.1, 'HANDS WARM UP', '2× FASTER'],
      [m.zip, m.knot - 0.1, 'ZIPS', 'HALFWAY'],
      [m.knot, m.screw - 0.1, 'KNOTS', '2× TIGHTER'],
      [m.screw, sc.back.start - 0.1, 'SCREWS', '2× STUCK'],
      [m.including, sc.dave_end.start - 0.1, 'JUMPER', 'RELEASED'],
      [m.buys, sc.endcard.start - 0.1, 'JUMPER', 'PURCHASED'],
    ],
    end: { lines: ['A THIRD OF A CAR’S FUEL GOES ON FRICTION.', 'WITHOUT IT YOU COULD NOT WALK, BRAKE OR TIE A KNOT.'] },
  };
}
