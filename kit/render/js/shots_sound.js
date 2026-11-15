import { lerp, easeInOut, easeOut, easeIn, prog, smooth, clamp, V3, lerpV } from './util.js';
const GOLD = '#f2c85b';
function camKeys(keys) { return (tl) => { if (tl <= keys[0].t) return keys[0]; for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (tl <= b.t) { const k = easeInOut(prog(tl, a.t, b.t)); return { pos: lerpV(a.pos, b.pos, k), look: lerpV(a.look, b.look, k), fov: lerp(a.fov ?? 44, b.fov ?? 44, k) }; } } return keys[keys.length - 1]; }; }
const K = (t, pos, look, fov) => ({ t, pos: V3(...pos), look: V3(...look), fov });
const mv = (p0, p1, l0, l1, fov = 44, d = 3) => camKeys([K(0, p0, l0, fov), K(d, p1, l1, fov)]);
const fmtC = (s) => { s = Math.max(0, s); const w = Math.floor(s); const ms = Math.floor((s - w) * 1000); return `0:${String(w).padStart(2, '0')}.${String(ms).padStart(3, '0')}`; };

export function overlayCfgSound(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on, SNAP = m.back;
  return {
    title: [[{ t: 'What if the ' }, { t: 'speed of sound', c: GOLD }], [{ t: 'dropped to ' }, { t: 'walking pace', c: GOLD }], [{ t: 'for 5 seconds?' }]],
    titleFrom: 0.3, titleTo: 4.4,
    counter: { from: ON - 0.05, label: (t) => t < SNAP ? 'SOUND RETURNS IN' : 'SOUND RETURNED', fmt: (t) => fmtC(5 * (1 - prog(t, ON, SNAP))), color: (t) => t >= SNAP ? GOLD : '#fff' },
    status: [[0.2, 'DAVE · HAS A SECRET'], [m.library, 'DAVE · IN THE LIBRARY'], [m.eight, 'PRIYA · 8 M AWAY'], [ON, 'SOUND · 1.4 M/S'], [m.whispers, 'DAVE’S WHISPER · IN TRANSIT'], [m.walks, 'DAVE · ESCORTING A WHISPER'], [m.supersonic, 'DAVE · SUPERSONIC (STROLLING)'], [m.shush, 'LIBRARIAN · MACH 20'], [sc.street.start, 'EVERY CAR · A JET ENGINE'], [m.bats, 'BATS · CONCERNED'], [sc.thunder.start, 'THUNDER · WALKING'], [SNAP, 'WHISPER · 1 M SHORT'], [m.dogs, 'DOGS · INFORMED'], [m.reaches, 'PRIYA · HEARD A CLICK'], [m.safe, 'SECRET · SAFE'], [m.knows, 'THE DOG · KNOWS']],
    callouts: [
      [0.3, m.secret - 0.1, 'DAVE', 'HAS A WEDDING SECRET'],
      [m.secret, m.whispering - 0.1, 'CLASSIFICATION', 'TOP SECRET (WEDDING)'],
      [m.whispering, sc.dave.start - 0.1, 'DELIVERY METHOD', 'WHISPER'],
      [m.library, m.priya - 0.1, 'THE LIBRARY', 'QUIET PLEASE'],
      [m.priya, m.eight - 0.1, 'PRIYA', 'FAR END OF THE TABLE'],
      [m.eight, m.considers - 0.1, 'DISTANCE', '8 M'],
      [m.considers, ON - 0.1, 'WHISPERING DISTANCE?', 'DAVE THINKS SO'],
      [ON, m.onefour - 0.1, 'SPEED OF SOUND', '343 M/S → 1.4 M/S'],
      [m.onefour, m.slower - 0.1, 'WALKING PACE', '1.4 M/S · 5 KM/H'],
      [m.slower, sc.whisper.start - 0.1, 'SLOWER BY', '÷ 245'],
      [m.whispers, m.leaves - 0.1, 'DAVE', 'WHISPERS'],
      [m.leaves, m.walks - 0.1, 'WHISPER SPEED', '1.4 M/S'],
      [m.walks, sc.steps.start - 0.1, 'DAVE', 'ESCORTS IT'],
      [sc.steps.start, m.supersonic - 0.1, 'FASTER THAN A STROLL', 'SUPERSONIC'],
      [m.supersonic, m.foot - 0.1, 'MACH 1', '1.4 M/S'],
      [m.foot, m.mach3 - 0.1, 'YOUR FOOT (SWING)', '≈ 4 M/S'],
      [m.mach3, m.boom - 0.1, 'FOOT', 'MACH 3'],
      [m.boom, m.thunderclap - 0.1, 'EVERY STEP', 'A SONIC BOOM'],
      [m.thunderclap, sc.shh.start - 0.1, '≈ 120 dB', 'A THUNDERCLAP'],
      [sc.shh.start, m.shush - 0.1, 'THE LIBRARIAN', 'SHH'],
      [m.shush, m.mach20 - 0.1, 'BREATH OF A SHUSH', '≈ 30 M/S'],
      [m.mach20, m.shboom - 0.1, 'SHUSH', 'MACH 20'],
      [m.shboom, sc.street.start - 0.1, 'THE SHUSH', 'IS A SONIC BOOM'],
      [sc.street.start, m.car - 0.1, 'OUTSIDE', '50 KM/H = 13.9 M/S'],
      [m.car, m.mach10 - 0.1, 'A CAR AT 50', 'MACH 10'],
      [m.mach10, m.dragging - 0.1, 'SHOCK CONE', '5.7°'],
      [m.dragging, m.db - 0.1, 'SHOCK WAVE', '≈ 200 PA'],
      [m.db, sc.world.start - 0.1, '≈ 140 dB', 'A JET ENGINE · PER CAR'],
      [m.rain, m.pigeons - 0.1, 'RAIN · 9 M/S', 'MACH 6'],
      [m.pigeons, m.bats - 0.1, 'PIGEONS · 20 M/S', 'MACH 14'],
      [m.bats, m.concerned - 0.1, 'BATS · 5–6 M/S', 'MACH 4 · OUTRUN ECHOES'],
      [m.concerned, sc.thunder.start - 0.1, 'BATS', 'CONCERNED'],
      [sc.thunder.start, m.none - 0.1, 'LIGHTNING ON EARTH', '44 FLASHES / S'],
      [m.none, m.walking2 - 0.1, '5 SECONDS · 220 BOLTS', '0 THUNDER'],
      [m.walking2, sc.back.start - 0.1, 'THUNDER', 'WALKING · 1.4 M/S'],
      [sc.back.start, SNAP - 0.1, 'SOUND', 'RETURNING'],
      [SNAP, m.seven - 0.1, 'SOUND', '343 M/S AGAIN'],
      [m.seven, m.twenty - 0.1, '5 S OF SOUND', 'WITHIN 7 M'],
      [m.twenty, m.pitched - 0.1, '7 M AT 343 M/S', '20 MILLISECONDS'],
      [m.pitched, sc.dogs.start - 0.1, 'PITCH', '× 245'],
      [m.dogs, m.click - 0.1, 'DOGS ON EARTH', '≈ 900,000,000'],
      [m.click, m.impressed - 0.1, '100 HZ → 24,500 HZ', 'DOGS HEAR TO 45,000 HZ'],
      [m.impressed, sc.end.start - 0.1, 'DOGS', 'NOT IMPRESSED'],
      [m.reaches, m.safe - 0.1, 'DAVE’S WHISPER', 'ONE CLICK'],
      [m.safe, m.knows - 0.1, 'THE SECRET', 'SAFE'],
      [m.knows, sc.endcard.start - 0.1, 'THE DOG', 'KNOWS'],
    ],
    end: { lines: ['AT WALKING PACE, 5 SECONDS OF SOUND FIT IN 7 METRES.', 'AIR THAT SLOW WOULD BE 0.005 K. WE IGNORED THAT.'] },
  };
}

export function buildShotsSound(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on, SNAP = m.back;
  const shots = []; const add = (id, from, to, set, cam, ctx) => shots.push({ id, from, to, set, cam, ctx });
  const flashAt = (t, t0, a = 0.55) => t >= t0 ? Math.max(0, a - (t - t0) * 2.3) : 0;
  const ring = (t, t0) => t >= t0 ? (t - t0) : -1;
  // ---------------- intro ----------------
  add('h1', 0, 1.1, 'lib', mv([-3.15, 1.8, 0.72], [-3.2, 1.78, 0.7], [-4.6, 1.68, 0.0], [-4.6, 1.68, 0.0], 36), (t) => ({ dave: 'whisper', whisperK: 0.06 + 0.08 * t, whisperX0: -4.45, daveWide: 0.4, daveOpen: 0.3, neckY: -0.25, slowSince: t + 1.5 }));
  add('h2', 1.1, 2.2, 'street', mv([3.0, 1.7, 2.6], [2.7, 1.65, 2.5], [-1.0, 1.9, -4.2], [-1.2, 1.9, -4.2], 50), (t) => ({ dave: 'walk', daveX: 1.8 - (t - 1.1) * 1.6, daveZ: -2.2, envelope: true, peds: false }));
  add('h3', 2.2, sc.dave.start, 'lib', mv([-3.3, 1.8, 0.62], [-3.25, 1.78, 0.6], [-4.6, 1.68, 0.02], [-4.6, 1.68, 0.02], 36), (t) => ({ dave: 'lips', neckY: -0.3, daveWide: 0.3, daveSmile: true }));
  // ---------------- dave ----------------
  add('d1', sc.dave.start, 4.6, 'street', mv([-3.0, 2.8, 9.0], [-3.4, 2.7, 8.4], [-4, 3.6, -5], [-4, 3.6, -5], 50), (t) => ({ dave: 'walk', daveX: -3.2, daveZ: -2.6, envelope: true, pedMode: 'walk', cars: [{ x: 14 - (t - 3.28) * 6, dir: -1 }] }));
  add('d2', 4.6, 6.0, 'lib', mv([2.3, 1.3, 1.5], [2.4, 1.28, 1.4], [4.6, 0.9, -0.35], [4.6, 0.9, -0.35], 40), (t) => ({ dave: 'stand', priya: 'read', dog: { lie: true, alert: 0.1 } }));
  add('d3', 6.0, 7.7, 'lib', mv([-6.6, 1.95, 1.0], [-6.3, 1.9, 0.95], [0, 0.95, 0], [0.5, 0.95, 0], 46), (t) => ({ dave: 'stand', neckY: 0, priya: 'read' }));
  add('d4', 7.7, 9.4, 'studio', mv([0.3, 4.2, 9.5], [0.25, 4.1, 9.2], [0.2, 0.5, -0.5], [0.2, 0.5, -0.5], 48), (t) => ({ prop: 'ruler8', k: prog(t, m.considers - 0.4, m.considers) }));
  add('d5', 9.4, sc.event.start, 'lib', mv([-3.3, 1.65, 1.2], [-3.35, 1.62, 1.1], [-4.65, 1.5, 0.0], [-4.65, 1.5, 0.0], 40), (t) => ({ dave: 'whisper', neckY: -0.45, lean: 0.1, daveWide: 0.2, daveOpen: 0.15, lib: 'point', libWide: 0.5 }));
  // ---------------- event ----------------
  add('e1', sc.event.start, 13.55, 'lib', mv([-2.5, 1.65, 1.5], [-2.6, 1.6, 1.4], [-4.5, 1.2, 0.0], [-4.5, 1.2, 0.0], 44), (t) => ({ dave: 'stand', neckY: -0.4, daveWide: t > ON ? 0.6 : 0, flash: flashAt(t, ON, 0.75), slowSince: ring(t, ON), coughSince: ring(t, ON + 0.15), lookUp: t > ON + 0.2 ? 'clock' : false }));
  add('e2', 13.55, 14.95, 'studio', mv([0.0, 2.7, 7.5], [-0.05, 2.65, 7.2], [0.0, 2.4, 0], [0.0, 2.4, 0], 46), (t) => ({ prop: 'speedo', k: prog(t, 13.65, m.onefour + 0.1) }));
  add('e3', 14.95, 16.45, 'studio', mv([-0.1, 1.9, 6.4], [-0.15, 1.85, 6.1], [-0.2, 1.3, 0], [-0.2, 1.3, 0], 46), (t) => ({ prop: 'pace' }));
  add('e4', 16.45, 17.95, 'studio', mv([0.1, 2.7, 7.2], [0.05, 2.65, 6.9], [0, 2.5, 0], [0, 2.5, 0], 46), (t) => ({ prop: 'ratio', k: prog(t, m.slower - 0.5, m.slower + 0.6) }));
  add('e5', 17.95, sc.whisper.start, 'city', mv([0, 78, 68], [2, 74, 64], [0, 0, 0], [0, 0, 0], 50), (t) => ({ mode: 'traffic', pops: true, bubbles: 0.3 + 0.4 * prog(t, 17.95, 19.9) }));
  // ---------------- whisper ----------------
  add('w1', sc.whisper.start, 21.3, 'lib', mv([-3.35, 1.72, 0.72], [-3.3, 1.7, 0.7], [-4.55, 1.62, 0.0], [-4.55, 1.62, 0.0], 34), (t) => ({ dave: 'whisper', neckY: -0.2, daveOpen: 0.4, whisperK: t > m.whispers ? 0.2 * (t - m.whispers) : -1, whisperX0: -4.45 }));
  add('w2', 21.3, 22.9, 'lib', mv([-1.6, 1.45, 2.7], [-1.7, 1.42, 2.6], [-3.0, 1.35, 0], [-2.8, 1.35, 0], 44), (t) => ({ dave: 'whisper', neckY: -0.1, daveOpen: 0.3, whisperK: 0.12 + 0.2 * (t - 21.3), whisperX0: -4.45, priya: 'read' }));
  add('w3', 22.9, 24.6, 'lib', mv([4.55, 1.3, 0.05], [4.5, 1.3, 0.05], [-2.0, 0.95, 0.1], [-2.5, 0.95, 0.1], 46), (t) => ({ dave: 'whisper', neckY: 0, daveOpen: 0.3, whisperK: 0.3 + 0.2 * (t - 22.9), whisperX0: -4.45, priya: 'read', dog: { lie: true, alert: 0.4, turn: -0.3 } }));
  const w4x = (t) => -4.45 + 7 * (0.3 + 0.2 * (t - 24.6));
  add('w4', 24.6, sc.steps.start, 'lib', (tl, d, t) => ({ pos: V3(w4x(t) + 0.9, 1.5, 3.3), look: V3(w4x(t) - 0.3, 1.25, 0.3), fov: 44 }), (t) => ({ dave: 'walk', daveX: w4x(t) - 0.35, daveZ: 0.98, daveRot: Math.PI / 2, walkT: t, neckY: 0.35, daveSmile: true, whisperK: 0.3 + 0.2 * (t - 24.6), whisperX0: -4.45, priya: 'read' }));
  // ---------------- steps ----------------
  const s1x = (t) => -1.5 + 1.4 * (t - sc.steps.start);
  add('s1', sc.steps.start, 27.6, 'lib', (tl, d, t) => ({ pos: V3(s1x(t) + 2.3, 1.15, -0.2), look: V3(s1x(t) + 0.2, 0.55, -2.2), fov: 44 }), (t) => ({ dave: 'none', priya: 'read', walker: { x: s1x(t), look: 0 }, footCone: { who: 'walker', scale: 0.9 }, footBooms: [0, 1, 2, 3].map(i => ({ x: -1.5 + i * 0.55, z: -2.2, t0: sc.steps.start + i * 0.4 })), whisperK: 0.5, whisperX0: -4.45 }));
  add('s2', 27.6, 28.9, 'city', mv([30, 95, 115], [27, 92, 112], [0, 0, 0], [0, 0, 0], 50), (t) => ({ mode: 'traffic', pops: true }));
  add('s3', 28.9, 30.5, 'studio', mv([0.9, 1.6, 6.0], [0.8, 1.55, 5.8], [0.2, 1.2, 0], [0.2, 1.2, 0], 46), (t) => ({ prop: 'foot', mach: false }));
  add('s4', 30.5, 31.9, 'studio', mv([1.6, 0.9, 4.6], [1.5, 0.88, 4.5], [0.3, 0.8, 0], [0.3, 0.8, 0], 42), (t) => ({ prop: 'foot', mach: t > m.mach3 - 0.1, booms: true }));
  const s5x = (t) => 0.5 + 1.4 * (t - 31.9);
  add('s5', 31.9, 33.4, 'street', (tl, d, t) => ({ pos: V3(s5x(t) + 2.4, 1.0, 0.7), look: V3(s5x(t) + 0.2, 0.5, -2.0), fov: 44 }), (t) => ({ dave: 'none', pedMode: 'walk', stepX: s5x(t), booms: [0, 1, 2, 3, 4].map(i => ({ x: 0.3 + i * 0.5, z: -2.0, t0: 31.9 + i * 0.33 })), boomV: 6, flash: flashAt(t, m.boom, 0.35) }));
  add('s6', 33.4, 34.6, 'studio', mv([0.4, 2.5, 7.0], [0.35, 2.45, 6.8], [0.3, 2.3, 0], [0.3, 2.3, 0], 46), (t) => ({ prop: 'meter', v: 118 * easeOut(prog(t, 33.45, m.thunderclap)) }));
  add('s7', 34.6, sc.shh.start, 'studio', mv([0.9, 1.3, 4.4], [0.85, 1.25, 4.3], [0.1, 0.9, 0], [0.1, 0.9, 0], 42), (t) => ({ prop: 'foot', shoes: true }));
  // ---------------- shh ----------------
  add('q1', sc.shh.start, 37.3, 'lib', mv([-6.7, 1.55, -1.9], [-6.8, 1.5, -1.95], [-8.4, 1.35, -3.6], [-8.4, 1.35, -3.6], 40), (t) => ({ dave: 'whisper', neckY: 0.1, priya: 'read', whisperK: 0.55, whisperX0: -4.45, lib: 'shush', shush: t > m.shush ? Math.min(1, (t - m.shush) * 2) : 0, libWide: 0.5, libOpen: 0.5, flash: flashAt(t, m.shush, 0.35) }));
  add('q2', 37.3, 38.8, 'lib', mv([-7.4, 1.66, -2.45], [-7.45, 1.65, -2.5], [-8.4, 1.6, -3.65], [-8.4, 1.6, -3.65], 34), (t) => ({ dave: 'none', priya: 'read', lib: 'shush', shush: 1, libWide: 0.6, libOpen: 0.6 }));
  add('q3', 38.8, 40.3, 'studio', mv([1.65, 3.0, 7.6], [1.6, 2.95, 7.3], [1.65, 2.4, 0], [1.65, 2.4, 0], 46), (t) => ({ prop: 'ladder', hl: t > m.mach20 ? 6 : -1 }));
  add('q4', 40.3, sc.street.start, 'lib', mv([6.4, 2.3, 2.6], [6.0, 2.2, 2.4], [-2.5, 1.2, -0.6], [-2.5, 1.2, -0.6], 52), (t) => ({ dave: t > m.shboom ? 'startled' : 'whisper', neckY: -0.4, daveWide: t > m.shboom ? 0.9 : 0.2, daveOpen: t > m.shboom ? 0.7 : 0.2, priya: 'read', whisperK: 0.6, whisperX0: -4.45, lib: 'shush', shush: 1, shushBoom: t > m.shboom ? Math.min(1, (t - m.shboom) * 1.4) : 0, pages: t > m.shboom ? Math.min(1, (t - m.shboom) * 1.6) : 0, books: t > m.shboom ? Math.min(1, (t - m.shboom) * 1.6) : 0, lookUp: t > m.shboom ? 'clock' : false, flash: flashAt(t, m.shboom, 0.6) }));
  // ---------------- street ----------------
  add('r1', sc.street.start, 43.3, 'street', mv([-3.0, 1.9, 1.6], [-3.3, 1.85, 1.5], [9, 1.0, 5.2], [8, 1.0, 5.2], 48), (t) => ({ dave: 'none', pedMode: 'ears', cars: [{ x: 24 - 13.9 * (t - sc.street.start), dir: -1, cone: 1 }], flash: flashAt(t, m.car, 0.3) }));
  add('r2', 43.3, 44.7, 'street', mv([-1.0, 0.75, 2.5], [-1.2, 0.72, 2.45], [4, 0.9, 5.2], [3, 0.9, 5.2], 44), (t) => ({ dave: 'none', pedMode: 'ears', cars: [{ x: 12 - 13.9 * (t - 43.3), dir: -1, cone: 1 }], sweep: (t - 43.3) / 1.4, sweepX: 12 - 13.9 * (t - 43.3) + 5, flash: flashAt(t, m.mach10, 0.35) }));
  add('r3', 44.7, 46.2, 'street', mv([-1.5, 1.7, 3.5], [-1.7, 1.65, 3.3], [3.5, 1.8, -3.5], [3.5, 1.8, -3.5], 52), (t) => ({ dave: 'none', pedMode: 'ears', cars: [{ x: 18 - 13.9 * (t - 44.7), dir: -1, cone: 1 }], hats: prog(t, m.dragging, m.dragging + 1.0), cracks: prog(t, m.dragging + 0.1, m.dragging + 1.0), flash: flashAt(t, m.dragging, 0.3) }));
  add('r4', 46.2, 47.8, 'studio', mv([0.4, 2.6, 7.0], [0.35, 2.55, 6.8], [0.3, 2.35, 0], [0.3, 2.35, 0], 46), (t) => ({ prop: 'meter', v: 118 + 22 * easeOut(prog(t, 46.3, m.db + 0.1)) }));
  add('r5', 47.8, sc.world.start, 'city', mv([-45, 60, 95], [-40, 58, 92], [0, 0, 10], [0, 0, 10], 48), (t) => ({ mode: 'traffic', cones: true, pops: true }));
  // ---------------- world ----------------
  add('v1', sc.world.start, 51.1, 'park', mv([-6.5, 2.0, 9.5], [-6.2, 1.95, 9.2], [0, 2.4, 0], [0, 2.4, 0], 46), (t) => ({ mode: 'rain', dark: 0.25 }));
  add('v2', 51.1, 52.9, 'park', mv([-8.5, 1.6, 6.5], [-8.0, 1.6, 6.3], [0, 3.4, -1], [0.5, 3.4, -1], 48), (t) => ({ mode: 'pigeons' }));
  const pg = (t) => ({ x: -14 + ((t * 7) % 28), y: 2.2 + Math.sin(t * 2) * 0.3, z: -3 });
  add('v3', 52.9, 54.3, 'park', (tl, d, t) => { const p = pg(t); return { pos: V3(p.x + 2.3, p.y + 0.35, p.z + 2.3), look: V3(p.x, p.y, p.z), fov: 40 }; }, (t) => ({ mode: 'pigeons' }));
  add('v4', 54.3, 55.9, 'park', mv([-6.5, 2.4, 7.5], [-6.0, 2.4, 7.2], [2, 3.4, 0], [2.5, 3.4, 0], 48), (t) => ({ mode: 'bats', dark: 0.85 }));
  const bt = (t) => ({ x: -10 + ((t * 5.6) % 22), y: 3 + Math.sin(t * 4) * 0.35, z: -2 });
  add('v5', 55.9, 57.4, 'park', (tl, d, t) => { const b = bt(t); return { pos: V3(b.x + 1.5, b.y + 0.25, b.z + 1.7), look: V3(b.x, b.y, b.z), fov: 36 }; }, (t) => ({ mode: 'bats', dark: 0.85 }));
  add('v6', 57.4, sc.thunder.start, 'studio', mv([-1.65, 2.0, 6.0], [-1.6, 1.95, 5.8], [-1.65, 1.35, 0], [-1.65, 1.35, 0], 46), (t) => ({ prop: 'ladder', hl: 2 }));
  // ---------------- thunder ----------------
  add('t1', sc.thunder.start, 59.9, 'earth', mv([60, 30, 250], [58, 29, 244], [0, 0, 0], [0, 0, 0], 42), (t) => ({ flashes: true, rate: 3.2, many: true }));
  add('t2', 59.9, 61.4, 'storm', mv([7, 3.2, 15], [6.5, 3.1, 14.4], [-2, 7, 0], [-2, 7, 0], 50), (t) => ({ bolt: t < 60.2 ? 1 : Math.max(0, 1 - (t - 60.2) * 1.5), thunderX: -3, thunder: t > 60.1, label: false, cowLook: 0.6 }));
  add('t3', 61.4, 63.0, 'storm', mv([1.4, 1.7, 4.6], [1.2, 1.65, 4.4], [-1.6, 1.5, 0.4], [-1.7, 1.5, 0.4], 42), (t) => ({ bolt: Math.sin(t * 9) > 0.92 ? 0.8 : 0, thunderX: -1.4, label: true, cowLook: -0.9, cowTilt: 0.2 }));
  add('t4', 63.0, 64.6, 'earth', mv([-45, 55, 225], [-43, 53, 220], [0, 0, 0], [0, 0, 0], 42), (t) => ({ flashes: true, rate: 3.6, many: true, rotY: 1.5 }));
  const thx = (t) => -1.4 + 1.4 * (t - 64.6);
  add('t5', 64.6, sc.back.start, 'storm', (tl, d, t) => ({ pos: V3(thx(t) + 2.6, 1.5, 4.2), look: V3(thx(t), 1.3, 0.4), fov: 42 }), (t) => ({ bolt: 0.0, thunderX: thx(t), walking: true, walkT: t, label: true, cowLook: -0.6 - 0.3 * (t - 64.6), cowTilt: 0.25 }));
  // ---------------- back ----------------
  add('b1', sc.back.start, 67.95, 'lib', mv([-1.6, 2.6, 6.2], [-1.8, 2.55, 6.0], [-2.6, 1.1, -1.0], [-2.6, 1.1, -1.0], 52), (t) => ({ dave: 'whisper', neckY: 0.1, priya: 'read', whisperK: t < SNAP ? 0.9 + 0.2 * (t - sc.back.start) : -1, whisperX0: -4.45, slowSince: t < SNAP ? 3 : -1, coughSince: t < SNAP ? 2.2 : -1, lampSince: t < SNAP ? 1.6 : -1, snapK: t >= SNAP ? (t - SNAP) * 1.8 : -1, flash: flashAt(t, SNAP, 0.8), lookUp: t > SNAP ? 'dave' : false, daveWide: t > SNAP ? 0.6 : 0 }));
  add('b2', 67.95, 69.4, 'lib', mv([-9.2, 5.4, 0.0], [-9.0, 5.3, 0.0], [0.2, 0.8, 0], [0.2, 0.8, 0], 46), (t) => ({ dave: 'whisper', neckY: 0, priya: 'read', whisperK: 1.0, whisperX0: -4.45, dog: { lie: true, alert: 0.3 } }));
  add('b3', 69.4, 70.9, 'studio', mv([0.3, 2.3, 8.2], [0.2, 2.25, 7.9], [0, 1.6, 0], [0, 1.6, 0], 46), (t) => ({ prop: 'slab' }));
  add('b4', 70.9, 72.4, 'city', mv([25, 70, 85], [23, 68, 82], [0, 0, 0], [0, 0, 0], 48), (t) => ({ mode: 'traffic', bubbles: 1 }));
  add('b5', 72.4, 74.1, 'studio', mv([0.4, 2.6, 7.4], [0.35, 2.55, 7.1], [0.3, 2.3, 0], [0.3, 2.3, 0], 46), (t) => ({ prop: 'slab', passK: prog(t, m.twenty - 0.4, m.twenty + 0.6) }));
  add('b6', 74.1, 75.9, 'studio', mv([0.2, 1.9, 8.0], [0.1, 1.85, 7.7], [0, 1.4, 0], [0, 1.4, 0], 46), (t) => ({ prop: 'pitch', k: prog(t, 74.3, m.pitched + 0.5) }));
  add('b7', 75.9, sc.dogs.start, 'city', mv([0, 150, 110], [0, 146, 106], [0, 0, -10], [0, 0, -10], 50), (t) => ({ mode: 'traffic', crack: prog(t, 76.0, 77.6), flash: flashAt(t, 76.0, 0.4) }));
  // ---------------- dogs ----------------
  add('g1', sc.dogs.start, 79.5, 'earth', mv([30, 40, 215], [28, 38, 210], [0, 0, 0], [0, 0, 0], 42), (t) => ({ ears: prog(t, m.dogs - 0.1, m.dogs + 1.2), rotY: 3.5, spin: 0.02 }));
  add('g2', 79.5, 81.0, 'dogs', mv([0, 1.1, 13.0], [0.2, 1.08, 12.7], [0, 0.6, 0], [0, 0.6, 0], 50), (t) => ({ alert: smooth(prog(t, 79.6, 80.1)), turn: 0, wag: false }));
  add('g3', 81.0, 82.4, 'dogs', mv([-0.6, 1.0, 4.4], [-0.55, 1.0, 4.3], [-0.6, 0.65, 0], [-0.6, 0.65, 0], 46), (t) => ({ alert: 1, tilt: 0.35 * smooth(prog(t, m.click - 0.1, m.click + 0.3)), flash: flashAt(t, m.click, 0.3) }));
  add('g4', 82.4, sc.end.start, 'dogs', mv([0.25, 1.05, 2.2], [0.22, 1.02, 2.15], [0.05, 0.75, 0.45], [0.05, 0.75, 0.45], 34), (t) => ({ alert: 1 - 0.6 * smooth(prog(t, m.impressed, m.impressed + 0.5)), flat: t > m.impressed, nod: -0.1 * smooth(prog(t, m.impressed, m.impressed + 0.6)) }));
  // ---------------- end ----------------
  add('z1', sc.end.start, 85.3, 'lib', mv([3.3, 1.3, -0.6], [3.35, 1.28, -0.58], [4.65, 1.15, 0.0], [4.65, 1.15, 0.0], 36), (t) => ({ dave: 'none', priya: t > m.reaches + 0.1 ? 'ear' : 'read', priyaWide: t > m.reaches ? 0.5 : 0, priyaBlink: t > m.reaches && t < m.reaches + 0.25 ? 1 : 0, flash: flashAt(t, m.reaches, 0.3), dog: { lie: true, alert: 0.6, turn: 0.3 } }));
  add('z2', 85.3, 86.7, 'lib', mv([-3.1, 1.55, 1.45], [-3.15, 1.52, 1.4], [-4.7, 1.3, 0.0], [-4.7, 1.3, 0.0], 40), (t) => ({ dave: 'thumbs', neckY: 0.3, daveSmile: true, priya: 'look' }));
  add('z3', 86.7, 88.3, 'lib', mv([3.2, 1.4, 0.7], [3.25, 1.38, 0.66], [4.6, 1.15, 0.0], [4.6, 1.15, 0.0], 40), (t) => ({ dave: 'thumbs', priya: t < 87.6 ? 'shrug' : 'read', priyaWide: 0.2, dog: { lie: true, alert: 0.9, turn: 0.5 } }));
  add('z4', 88.3, 89.4, 'lib', mv([1.3, 0.56, 1.5], [1.35, 0.55, 1.46], [3.0, 0.42, 0.35], [3.0, 0.42, 0.35], 36), (t) => ({ dave: 'thumbs', priya: 'read', dog: { lie: true, alert: 1, turn: 0.75, raise: 1 } }));
  add('z5', 89.4, sc.endcard.start, 'lib', mv([-3.3, 1.8, 0.62], [-3.25, 1.78, 0.6], [-4.6, 1.68, 0.02], [-4.6, 1.68, 0.02], 36), (t) => ({ dave: 'lips', neckY: -0.3, daveWide: 0.2, daveSmile: true }));
  add('endcard', sc.endcard.start, sc.endcard.end, 'black', () => ({ pos: V3(0, 0, 0), look: V3(0, 0, -1) }), () => ({}));
  return { shots };
}
