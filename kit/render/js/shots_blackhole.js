import { lerp, easeInOut, easeOut, easeIn, prog, smooth, V3, lerpV } from './util.js';
const GOLD = '#f2c85b';
function camKeys(keys) { return (tl) => { if (tl <= keys[0].t) return keys[0]; for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (tl <= b.t) { const k = easeInOut(prog(tl, a.t, b.t)); return { pos: lerpV(a.pos, b.pos, k), look: lerpV(a.look, b.look, k), fov: lerp(a.fov ?? 44, b.fov ?? 44, k) }; } } return keys[keys.length - 1]; }; }
const K = (t, pos, look, fov) => ({ t, pos: V3(...pos), look: V3(...look), fov });
const mv = (p0, p1, l0, l1, fov = 44, d = 3) => camKeys([K(0, p0, l0, fov), K(d, p1, l1, fov)]);
const V = (a) => V3(...a); const pathPos = (at, far, near) => lerpV(V(far), V(near), smooth(at));
const relCam = (p, offP, offL, fov = 42) => () => ({ pos: p.clone().add(V(offP)), look: p.clone().add(V(offL)), fov });
const BIGF = [30, 60, 4150], BIGN = [0, 0, 4003]; const STF = [30, 14, 46], STN = [0, 4, 9.6];
const fmtKm = (v) => Math.max(0, Math.round(v)).toLocaleString('en-GB') + ' KM';

export function overlayCfgHole(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on;
  const fmtT = (v) => { v = Math.max(0, v); const s = Math.floor(v); const d = Math.floor((v - s) * 10); return `0:${String(s).padStart(2, '0')}.${d}`; };
  const dots = (t) => '.'.repeat(1 + Math.floor(t * 2) % 3);
  return {
    title: [[{ t: 'What if Dave fell' }], [{ t: 'into a black hole', c: GOLD }, { t: '?' }]],
    titleFrom: 0.3, titleTo: sc.dave.start + 3.8,
    counter: { from: ON - 0.05,
      label: (t) => t < m.opt1 ? 'KINDS OF BLACK HOLE' : t < m.horizon ? 'DISTANCE TO HORIZON' : t < m.opt2 ? 'TIDE AT THE HORIZON' : t < m.crosses ? 'DISTANCE TO HORIZON' : t < m.outside ? 'TIME TO THE CENTRE' : 'DAVE’S MESSAGE',
      fmt: (t) => t < m.opt1 ? '2' : t < m.horizon ? fmtKm(10000 * Math.pow(1 - prog(t, m.opt1, m.horizon), 1.22)) : t < m.opt2 ? '20,000,000 G' : t < m.crosses ? fmtKm(12e6 * Math.pow(1 - prog(t, m.opt2, m.crosses), 1.5)) : t < m.outside ? fmtT(59.9 - (t - m.crosses)) : 'SENDING' + dots(t),
      color: (t) => (t >= m.horizon && t < m.opt2) || t >= m.outside ? GOLD : '#fff' },
    status: [[sc.dave.start, 'DAVE’S TEXT · DRAFT: “CAKE??”'], [m.lemon1, 'DAVE’S TEXT · LEMON OR VICTORIA SPONGE?'], [m.typing1, 'DAVE’S TEXT · TYPING…'], [ON, 'DAVE’S TEXT · SIGNAL: 1 BAR'], [m.feet, 'DAVE’S HEIGHT · 1.78 M'], [m.taller, 'DAVE’S HEIGHT · 2.40 M'], [m.horizon, 'DAVE’S HEIGHT · 11 KM'], [m.noodle, 'DAVE · STATUS: NOODLE'], [m.opt2, 'DAVE’S TEXT · TYPING… (TAKE TWO)'], [m.crosses, 'DAVE · HORIZON: CROSSED'], [m.still, 'DAVE’S TEXT · STILL TYPING'], [m.sending1, 'DAVE’S TEXT · SENDING…'], [m.outside, 'DAVE’S TEXT · SENDING… (STILL)'], [m.forever, 'DAVE’S TEXT · SENDING… (FOREVER)'], [m.orders, 'PRIYA · ORDERED: LEMON'], [m.sorted, 'THE CAKE · SORTED']],
    callouts: [
      [m.job, m.lemon1 - 0.1, 'TODAY’S JOB', 'THE CAKE'],
      [m.lemon1, m.typing1 - 0.1, 'OPTIONS', 'LEMON · VICTORIA SPONGE'],
      [m.typing1, ON - 0.1, 'SIGNAL', '1 BAR'],
      [m.two, m.both - 0.1, 'KINDS OF BLACK HOLE', 'TWO'],
      [m.both, sc.small.start - 0.1, 'PLAN', 'BOTH'],
      [m.tensuns, m.thirty - 0.1, 'MASS', '10 SUNS'],
      [m.thirty, sc.tides.start - 0.1, 'HORIZON RADIUS', '≈ 30 KM'],
      [m.feet, m.km3500 - 0.1, 'GRAVITY', 'FEET > HEAD'],
      [m.km3500, m.teng - 0.1, 'DISTANCE', '3,500 KM'],
      [m.teng, m.taller - 0.1, 'HEAD-TO-FEET DIFFERENCE', '≈ 10 G'],
      [m.taller, sc.spaghetti.start - 0.1, 'DAVE', 'TALLER'],
      [m.horizon, m.noodle - 0.1, 'AT THE HORIZON', '≈ 20,000,000 G'],
      [m.noodle, m.spag - 0.1, 'DAVE', 'NOODLE'],
      [m.spag, m.sorry - 0.1, 'TECHNICAL TERM', 'SPAGHETTIFICATION'],
      [m.sorry, sc.big.start - 0.1, 'PHYSICISTS', 'NOT SORRY'],
      [m.opt2, m.fourm - 0.1, 'SAGITTARIUS A*', '26,000 LIGHT-YEARS AWAY'],
      [m.fourm, m.twelvem - 0.1, 'MASS', '≈ 4,000,000 SUNS'],
      [m.twelvem, m.eighteen - 0.1, 'HORIZON RADIUS', '≈ 12,000,000 KM'],
      [m.eighteen, sc.cross.start - 0.1, 'THAT IS', '18 SUNS IN A ROW'],
      [m.tide2, m.crosses - 0.1, 'TIDE AT THE HORIZON', '≈ 0.0001 G'],
      [m.crosses, m.notice - 0.1, 'DAVE', 'IN ONE PIECE'],
      [m.notice, m.still - 0.1, 'NOTICED', 'NOTHING'],
      [m.still, sc.inside.start - 0.1, 'DAVE’S TEXT', 'TYPING…'],
      [m.inside, m.minute - 0.1, 'EVERY DIRECTION', 'LEADS TO THE CENTRE'],
      [m.minute, m.sending1 - 0.1, 'TIME LEFT · AT MOST', '≈ 1 MINUTE'],
      [m.sending1, sc.outside.start - 0.1, 'PHONE', 'SENDING…'],
      [m.outside, m.slows - 0.1, 'VIEW', 'FROM OUTSIDE'],
      [m.slows, m.red - 0.1, 'DAVE’S CLOCK', 'SLOWING'],
      [m.red, m.fades - 0.1, 'HIS LIGHT', 'REDSHIFTED'],
      [m.fades, m.edge - 0.1, 'HIS LIGHT', 'FADING'],
      [m.edge, sc.message.start - 0.1, 'REACHES THE EDGE', 'NEVER, FROM OUT HERE'],
      [m.nothing, m.light - 0.1, 'ESCAPES', 'NOTHING'],
      [m.light, m.text - 0.1, 'NOT EVEN', 'LIGHT'],
      [m.text, m.forever - 0.1, 'NOT EVEN', 'A TEXT'],
      [m.forever, sc.priya.start - 0.1, 'DELIVERY ESTIMATE', 'NEVER'],
      [m.orders, sc.end.start - 0.1, 'PRIYA’S ORDER', 'LEMON'],
      [m.wouldhave, m.long - 0.1, 'DAVE’S VOTE', 'LEMON (UNSENT)'],
      [m.long, m.gone - 0.1, 'OPTION ONE', 'VERY LONG'],
      [m.gone, m.sorted - 0.1, 'OPTION TWO', 'VERY GONE'],
      [m.sorted, sc.endcard.start - 0.1, 'THE CAKE', 'SORTED'],
    ],
    end: { lines: ['SGR A*: 4 MILLION SUNS, 26,000 LIGHT-YEARS AWAY.', 'NOTHING GETS OUT OF THE HORIZON. NOT EVEN A TEXT.'] },
  };
}

export function buildShotsHole(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on;
  const shots = []; const add = (id, from, to, set, cam, ctx) => shots.push({ id, from, to, set, cam, ctx });
  const flashAt = (t, t0, a = 0.55) => t >= t0 ? Math.max(0, a - (t - t0) * 2.3) : 0;
  const ST = (y = 2.0, z = 5.5, fov = 44) => mv([0.6, y + 0.3, z], [-0.4, y + 0.1, z - 0.8], [0, y, 0], [0, y, 0], fov);
  // float cameras (Dave at origin, head ≈ y 1.65, hole far at (-20, 6, -120))
  const FCLOSE = mv([0.3, 1.62, 1.55], [0.26, 1.6, 1.42], [-0.3, 1.46, -0.5], [-0.3, 1.46, -0.5], 34);
  const FMED = mv([1.7, 1.5, 3.4], [1.5, 1.45, 3.1], [-0.3, 1.0, -1.2], [-0.3, 1.0, -1.2], 48);
  const FPHONE = mv([0.26, 1.8, 0.06], [0.25, 1.78, 0.08], [0.08, 1.48, 0.43], [0.08, 1.48, 0.43], 30);
  const FFACE = mv([0.1, 1.5, 1.25], [0.08, 1.49, 1.15], [-0.16, 1.38, -0.17], [-0.16, 1.38, -0.17], 32);
  // bakery cameras (Priya at (-0.6, 0, 0.9) facing -z; counter at z=-0.6; baker at (0.4, 0, -1.5))
  const BWIDE = mv([3.0, 1.7, 2.8], [2.7, 1.65, 2.5], [-0.3, 1.0, -0.4], [-0.3, 1.0, -0.4], 46);
  const BPRIYA = mv([-0.1, 1.55, -0.4], [-0.15, 1.53, -0.3], [-0.6, 1.28, 0.9], [-0.6, 1.28, 0.9], 36);
  const BCAKES = mv([1.7, 1.65, 2.3], [1.6, 1.6, 2.2], [-0.5, 1.05, 0.1], [-0.5, 1.05, 0.1], 44);
  const BPHONE = mv([-0.95, 1.72, 0.72], [-0.93, 1.7, 0.7], [-0.76, 1.33, 0.31], [-0.76, 1.33, 0.31], 30);
  // stellar hole: R = 1 (radius 10). Dave path far [18,3,30] -> near [0,0,10.4]
  const small = (o = {}) => ({ R: 1, farPos: STF, nearPos: STN, ...o });
  // supermassive: R = 400 (radius 4000). Dave path along +z above the surface
  const big = (o = {}) => ({ R: 400, glow: false, farPos: [30, 60, 4150], nearPos: [0, 0, 4003], ...o });
  // ---- hook
  add('h1', 0, 1.0, 'float', FCLOSE, (t) => ({ phone: 'draft', typeK: 0.1, daveLook: 'cam', smile: true }));
  add('h2', 1.0, sc.dave.start, 'float', FMED, (t) => ({ phone: 'draft', typeK: 0.15, daveLook: 'phone' }));
  // ---- dave
  add('d1', sc.dave.start, 4.6, 'float', FFACE, (t) => ({ phone: 'draft', typeK: 0.2, daveLook: 'phone' }));
  add('d1b', 4.6, m.lemon1 - 0.1, 'float', FPHONE, (t) => ({ phone: 'draft', typeK: prog(t, 4.6, m.typing1 + 0.4) * 0.8, daveLook: 'phone' }));
  add('d2', m.lemon1 - 0.1, m.typing1 - 0.1, 'bakery', BWIDE, (t) => ({ priya: 'look', baker: 'present', screen: 'typing' }));
  add('d3', m.typing1 - 0.1, sc.event.start, 'float', FPHONE, (t) => ({ phone: 'draft', typeK: 0.6 + 0.4 * prog(t, m.typing1 - 0.1, sc.event.start), thumbs: true }));
  // ---- event
  add('e1', sc.event.start, ON + 0.6, 'hole', mv([36, 20, 56], [28, 17, 46], [18, 10, 30], [14, 8, 24], 46), (t) => small({ glow: false, daveAt: prog(t, sc.event.start, ON + 0.6) * 0.35, flail: t > ON, flash: flashAt(t, ON), wide: t > ON ? 1 : 0, open: t > ON ? 0.6 : 0, lookPhone: false }));
  add('e2', ON + 0.6, m.both - 0.1, 'studio', ST(2.3, 6.5, 46), (t) => ({ prop: 'two' }));
  add('e3', m.both - 0.1, sc.small.start, 'float', FFACE, (t) => ({ phone: 'draft', typeK: 0.6, daveLook: 'cam', wide: 0.6 }));
  // ---- option one
  add('o1', sc.small.start, 16.4, 'studio', ST(2.1, 7.0, 46), (t) => ({ prop: 'suns', k: 0 }));
  add('o1b', 16.4, m.thirty - 0.1, 'studio', mv([0.8, 2.0, 4.6], [0.6, 1.8, 4.0], [0, 1.4, 0], [0, 1.2, 0], 42), (t) => ({ prop: 'suns', k: prog(t, m.tensuns + 0.4, m.thirty - 0.2) }));
  add('o2', m.thirty - 0.1, sc.tides.start, 'hole', mv([30, 14, 60], [26, 12, 54], [0, 0, 0], [0, 0, 0], 46), (t) => small({ daveAt: 0.2, daveScale: 2.5, lookPhone: false, glow: false }));
  // ---- tides
  add('t1', sc.tides.start, 21.0, 'studio', ST(1.9, 6.2, 46), (t) => ({ prop: 'tide', g: 1, stretch: 1.02 }));
  add('t1b', 21.0, m.km3500 - 0.1, 'studio', mv([0.9, 1.4, 4.6], [0.8, 1.35, 4.3], [0.3, 1.1, 0], [0.3, 1.1, 0], 42), (t) => ({ prop: 'tide', g: 1, stretch: 1.05 }));
  add('t2', m.km3500 - 0.1, 23.9, 'hole', relCam(pathPos(0.5, STF, STN), [6.5, 1.8, -1.5], [0.4, 0.9, 1.9], 42), (t) => small({ daveAt: 0.5, daveScale: 2.2, stretch: lerp(1.0, 1.25, prog(t, m.km3500, 23.9)), lookPhone: false, wide: 0.5 }));
  add('t2b', 23.9, m.teng - 0.1, 'studio', ST(1.9, 5.6, 44), (t) => ({ prop: 'tide', g: lerp(1, 10, prog(t, 23.9, m.teng + 0.3)), stretch: 1.3, wide: 0.8 }));
  add('t3', m.teng - 0.1, 26.9, 'float', FFACE, (t) => ({ phone: 'draft', typeK: 0.7, daveLook: 'cam', stretch: lerp(1.0, 1.5, prog(t, m.teng, 26.8)), wide: 0.9, open: 0.3, holeK: true }));
  add('t3b', 26.9, sc.spaghetti.start, 'hole', relCam(pathPos(0.72, STF, STN), [5.5, 2.0, 0.6], [0.9, 1.3, 3.0], 44), (t) => small({ glow: false, discDim: true, daveAt: 0.72, daveScale: 1.6, stretch: 1.8, lookPhone: false, wide: 1, open: 0.4 }));
  // ---- spaghetti
  add('s1', sc.spaghetti.start, 29.8, 'hole', mv([13, 8.5, 12], [12.5, 8.8, 12.5], [1.1, 7.8, 19], [1.2, 8.2, 20], 46), (t) => small({ glow: false, discDim: true, daveAt: 0.92, daveScale: 1.4, stretch: lerp(2, 8, prog(t, m.horizon - 0.1, 29.7)), noodle: 1, lookPhone: false, wide: 1, open: 0.7 }));
  add('s1b', 29.8, m.noodle - 0.1, 'studio', ST(2.9, 7.4, 46), (t) => ({ prop: 'tide', g: 2e7, stretch: 2.0, wide: 1, open: 0.6 }));
  add('s2', m.noodle - 0.1, m.spag - 0.1, 'studio', camKeys([K(0, [0.5, 1.6, 6], [0, 1.6, 0], 48), K(2.0, [0.8, 7.0, 6.5], [0, 7.2, 0], 48)]), (t) => ({ prop: 'noodle', k: prog(t, m.noodle - 0.1, m.noodle + 0.8) }));
  add('s3', m.spag - 0.1, m.sorry - 0.1, 'studio', mv([1.2, 7.7, 4.6], [1.0, 7.6, 4.3], [0, 7.6, 0], [0, 7.6, 0], 40), (t) => ({ prop: 'noodle', k: 1, real: t > m.spag + 0.9 }));
  add('s4', m.sorry - 0.1, sc.big.start, 'studio', ST(1.5, 5.4, 44), (t) => ({ prop: 'physicists', shrug: t > m.sorry + 0.3 }));
  // ---- option two
  add('b1', sc.big.start, 38.2, 'galaxy', camKeys([K(0, [40, 460, 380], [0, 0, 0], 46), K(1.7, [10, 120, 150], [0, 0, 0], 46)]), (t) => ({ coreK: 1 }));
  add('b1b', 38.2, m.fourm - 0.1, 'galaxy', camKeys([K(0, [6, 40, 60], [0, 0, 0], 46), K(1.4, [1.5, 4, 9], [0, 0, 0], 46)]), (t) => ({ coreK: lerp(0.8, 0.12, prog(t, 38.2, 39.2)) }));
  add('b2', m.fourm - 0.1, 41.2, 'hole', mv([3000, 9500, 16500], [2800, 9000, 15800], [0, 0, 0], [0, 0, 0], 46), (t) => big({ daveVis: false, glow: true }));
  add('b2b', 41.2, m.twelvem - 0.1, 'float', FCLOSE, (t) => ({ phone: 'draft', typeK: 0.7, daveLook: 'hole', wide: 0.7, open: 0.3 }));
  add('b3', m.twelvem - 0.1, 44.2, 'studio', mv([0.3, 2.9, 9.2], [0.2, 2.85, 8.8], [0, 2.7, 0], [0, 2.7, 0], 50), (t) => ({ prop: 'row', k: prog(t, m.twelvem + 0.2, m.eighteen + 0.6) }));
  add('b3b', 44.2, m.eighteen - 0.1, 'studio', mv([2.0, 3.2, 3.6], [1.9, 3.15, 3.4], [1.5, 2.9, 0], [1.5, 2.9, 0], 40), (t) => ({ prop: 'row', k: prog(t, m.twelvem + 0.2, m.eighteen + 0.6) }));
  add('b4', m.eighteen - 0.1, sc.cross.start, 'hole', relCam(pathPos(0.2, BIGF, BIGN), [14, 3, 2], [0, 1.5, 2.5], 44), (t) => big({ daveAt: 0.2, daveScale: 3, lookPhone: true, discDim: true }));
  // ---- cross
  add('c1', sc.cross.start, 49.5, 'hole', relCam(pathPos(0.45, BIGF, BIGN), [9, 2, 2], [0, 1, 2.2], 42), (t) => big({ daveAt: 0.45, daveScale: 2.5, stretch: 1.0, lookPhone: true, discDim: true }));
  add('c1b', 49.5, m.crosses - 0.1, 'hole', relCam(pathPos(0.85, BIGF, BIGN), [6, 1.5, 1.5], [0, 0.8, 1.4], 40), (t) => big({ discDim: true, daveAt: lerp(0.7, 1.0, prog(t, 49.5, m.crosses + 0.1)), daveScale: 1.6, lookPhone: true }));
  add('c2', m.crosses - 0.1, 52.7, 'hole', relCam(V3(...BIGN), [5, 1.8, 1.5], [0, 0.5, 1.0], 40), (t) => big({ discDim: true, daveAt: 1.0, sink: 3.2 * prog(t, m.crosses, 52.6), daveScale: 1.6, lookPhone: true }));
  add('c2b', 52.7, m.notice - 0.1, 'float', FFACE, (t) => ({ phone: 'draft', typeK: 0.85, daveLook: 'phone', holeK: false, smile: false }));
  add('c3', m.notice - 0.1, sc.inside.start, 'float', FPHONE, (t) => ({ phone: 'draft', typeK: 0.9 + 0.1 * prog(t, m.still, m.still + 0.6), thumbs: true, holeK: false }));
  // ---- inside
  add('i1', sc.inside.start, 58.0, 'inside', mv([0.6, 0.8, 3.0], [0.4, 0.6, 2.0], [0, 0, -60], [0, 0, -60], 56), (t) => ({ daveK: prog(t, sc.inside.start, 62.4) * 0.5, phone: 'draft' }));
  add('i1b', 58.0, m.sending1 - 0.1, 'studio', ST(2.8, 6.6, 46), (t) => ({ prop: 'clock', secs: 59.9 - (t - m.crosses) }));
  add('i3', m.sending1 - 0.1, sc.outside.start, 'inside', mv([1.4, 0.9, -3.5], [1.3, 0.85, -3.7], [0.25, 0.45, -6], [0.25, 0.45, -6], 38), (t) => ({ daveK: 0.0, phone: 'sending', open: 0.3 }));
  // ---- outside
  add('x1', sc.outside.start, 64.2, 'hole', mv([2800, 9000, 15500], [2600, 8600, 14800], [0, 0, 0], [0, 0, 0], 46), (t) => big({ daveAt: 0.95, daveScale: 90, farPos: [1200, 300, 5200], nearPos: [0, 0, 4010], lookPhone: true, tint: 0.2, glow: true }));
  add('x1b', 64.2, m.slows - 0.1, 'bakery', BPRIYA, (t) => ({ priya: 'phone', baker: 'stand', screen: 'typing' }));
  add('x2', m.slows - 0.1, m.red - 0.1, 'hole', relCam(pathPos(0.9, BIGF, BIGN), [40, 10, 8], [0, 4, 7], 40), (t) => big({ daveAt: 0.9, daveScale: 8, lookPhone: true, tint: 0.3, wide: 0.5, discDim: true }));
  add('x3', m.red - 0.1, m.fades - 0.1, 'hole', relCam(pathPos(0.9, BIGF, BIGN), [5.5, 1.4, 1.5], [0, 0.5, 1.5], 42), (t) => big({ daveAt: 0.9, daveScale: 1.6, lookPhone: true, tint: prog(t, m.red - 0.1, m.red + 0.8), wide: 0.5, discDim: true }));
  add('x4', m.fades - 0.1, m.edge - 0.1, 'studio', ST(2.0, 5.8, 44), (t) => ({ prop: 'spectrum', k: lerp(0.25, 0.95, prog(t, m.fades - 0.1, m.edge)) }));
  add('x5', m.edge - 0.1, sc.message.start, 'hole', relCam(pathPos(0.92, BIGF, BIGN), [5.5, 1.4, 1.5], [0, 0.5, 1.5], 42), (t) => big({ discDim: true, daveAt: 0.92, daveScale: 1.6, lookPhone: true, tint: 1, fade: lerp(0.5, 0.85, prog(t, m.edge, sc.message.start)) }));
  // ---- message
  add('n1', sc.message.start, m.light - 0.1, 'hole', mv([26, 10, 48], [22, 9, 42], [0, 0, 0], [0, 0, 0], 46), (t) => small({ daveVis: false, rays: 1, spin: 0.1, glow: false }));
  add('n2', m.light - 0.1, m.text - 0.1, 'studio', ST(2.4, 7.6, 44), (t) => ({ prop: 'phone', mode: 'sending' }));
  add('n3', m.text - 0.1, m.forever - 0.1, 'inside', mv([1.5, 0.7, -3.3], [1.4, 0.65, -3.5], [0.25, 0.3, -6], [0.25, 0.3, -6], 40), (t) => ({ daveK: 0, phone: 'sending', tint: 0.3, open: 0.2 }));
  add('n4', m.forever - 0.1, sc.priya.start, 'studio', mv([0.5, 2.5, 7.4], [0.4, 2.45, 7.0], [0, 2.3, 0], [0, 2.3, 0], 42), (t) => ({ prop: 'phone', mode: 'forever', forever: t > m.forever + 0.4, foreverK: prog(t, m.forever + 0.4, m.forever + 0.8) }));
  // ---- priya
  add('p1', sc.priya.start, sc.end.start, 'bakery', BCAKES, (t) => ({ priya: 'point', baker: 'present', screen: 'forever' }));
  // ---- end
  add('z1', sc.end.start, 82.1, 'float', FFACE, (t) => ({ phone: 'forever', typeK: 1, daveLook: 'cam', smile: true, holeK: false }));
  add('z1b', 82.1, m.long - 0.1, 'bakery', BPHONE, (t) => ({ priya: 'phone', baker: 'box', screen: 'forever', box: true }));
  add('z2', m.long - 0.1, m.gone - 0.1, 'studio', mv([0.8, 4.0, 9.5], [0.7, 3.9, 9.0], [0, 4.0, 0], [0, 4.0, 0], 50), (t) => ({ prop: 'noodle', k: 1 }));
  add('z3', m.gone - 0.1, m.sorted - 0.1, 'hole', relCam(pathPos(0.92, BIGF, BIGN), [5.5, 1.4, 1.5], [0, 0.5, 1.5], 42), (t) => big({ daveAt: 0.92, daveScale: 1.6, tint: 1, fade: 0.95, discDim: true }));
  add('z4', m.sorted - 0.1, 87.3, 'bakery', BWIDE, (t) => ({ priya: 'wait', baker: 'box', screen: 'forever', box: true, sorted: t > m.sorted + 0.3 }));
  add('z5', 87.3, sc.endcard.start, 'float', FCLOSE, (t) => ({ phone: 'forever', typeK: 1, daveLook: 'cam', smile: true, holeK: true }));
  add('endcard', sc.endcard.start, sc.endcard.end, 'black', () => ({ pos: V3(0, 0, 5), look: V3(0, 0, 0) }), () => ({}));
  return { shots };
}
