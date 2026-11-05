import { lerp, easeInOut, easeOut, prog, V3, lerpV } from './util.js';
export { overlayCfgStrong } from './shots_strong.js';
function camKeys(keys) { return (tl) => { if (tl <= keys[0].t) return keys[0]; for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (tl <= b.t) { const k = easeInOut(prog(tl, a.t, b.t)); return { pos: lerpV(a.pos, b.pos, k), look: lerpV(a.look, b.look, k), fov: lerp(a.fov ?? 44, b.fov ?? 44, k) }; } } return keys[keys.length - 1]; }; }
const K = (t, pos, look, fov) => ({ t, pos: V3(...pos), look: V3(...look), fov });
const mv = (p0, p1, l0, l1, fov = 44, d = 3) => camKeys([K(0, p0, l0, fov), K(d, p1, l1, fov)]);
export function buildShotsStrong2(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on, SNAP = m.back;
  const shots = []; const add = (id, from, to, set, cam, ctx) => shots.push({ id, from, to, set, cam, ctx });
  const flashAt = (t, t0, a = 0.55) => t >= t0 ? Math.max(0, a - (t - t0) * 2.3) : 0;
  const jarMode = (t) => t >= SNAP ? 'open' : t >= m.takes ? 'nan' : t >= m.slowly + 1.0 ? 'table' : t >= m.down ? 'down' : 'dave';
  const base = (t) => ({ jarMode: jarMode(t), down: prog(t, m.down, m.slowly + 1.0), twist: t < ON, strain: t < ON ? 0.8 : 0, wide: t >= ON && t < SNAP ? 1 : 0, lidPop: prog(t, m.ask + 0.15, m.ask + 0.85), nanArms: t >= SNAP ? 'folded' : t >= m.takes ? 'jar' : 'lap' });
  const F = mv([1.75, 1.5, 2.3], [1.7, 1.45, 2.0], [1.75, 1.0, -0.6], [1.75, 1.0, -0.6]);
  const DAVEC = mv([1.4, 1.42, 0.7], [1.4, 1.42, 0.45], [1.35, 1.38, -1.15], [1.35, 1.38, -1.15], 36);
  const NANC = mv([1.5, 1.3, 0.7], [1.55, 1.28, 0.55], [2.55, 0.95, -0.45], [2.55, 0.95, -0.45], 38);
  const JARC = mv([1.5, 1.35, 0.5], [1.45, 1.32, 0.35], [1.36, 1.15, -1.0], [1.36, 1.15, -1.0], 32);
  const ST = (y = 2.0, z = 5.5, fov = 44) => mv([0.6, y + 0.3, z], [-0.4, y + 0.1, z - 0.8], [0, y, 0], [0, y, 0], fov);
  const CITY = (a = 0) => mv([60 * Math.cos(a), 75, 60 * Math.sin(a) + 40], [55 * Math.cos(a + 0.25), 62, 55 * Math.sin(a + 0.25) + 30], [0, 0, 0], [0, 4, 0], 46, 4);
  const STREETW = mv([1.5, 2.2, 17], [1.2, 2.4, 16], [0, 3.8, 0], [0, 4.0, 0], 50);
  // --- hook
  add('h1', 0, 0.95, 'street', mv([1.2, 2.2, 15], [1.0, 2.6, 14.5], [0, 4.5, 0], [0, 5, 0], 46, 1), (t) => ({ mode: 'jump', jt: 1.0 + t, doorsOff: true }));
  add('h2', 0.95, sc.dave.start, 'kitchen', DAVEC, (t) => ({ ...base(t), daveLook: 'jar' }));
  // --- dave
  add('d1', sc.dave.start, 3.3, 'kitchen', F, (t) => ({ ...base(t), daveLook: 'jar', nanLook: 'dave' }));
  add('d2', 3.3, m.made - 0.1, 'kitchen', JARC, (t) => ({ ...base(t), daveLook: 'jar' }));
  add('d3', m.made - 0.1, m.lid - 0.1, 'kitchen', NANC, (t) => ({ ...base(t), nanLook: 'cam' }));
  add('d4', m.lid - 0.1, sc.event.start, 'kitchen', mv([2.4, 1.35, 0.5], [2.25, 1.3, 0.3], [1.4, 1.0, -0.75], [1.4, 1.0, -0.75], 34), (t) => ({ ...base(t), daveLook: 'jar' }));
  // --- event
  add('e1', sc.event.start, 11.0, 'kitchen', DAVEC, (t) => ({ ...base(t), flash: flashAt(t, ON), daveLook: t > ON + 0.3 ? 'cam' : 'jar' }));
  add('e2', 11.0, m.only - 0.1, 'space', mv([0, 30, 330], [10, 25, 290], [0, 0, 0], [0, 0, 0], 36, 2), (t) => ({ atmGrow: 0 }));
  add('e3', m.only - 0.1, m.heart - 0.1, 'studio', ST(1.6, 5.8), (t) => ({ prop: 'muscle', flex: prog(t, m.only, m.only + 0.8) }));
  add('e4', m.heart - 0.1, m.through - 0.1, 'studio', ST(1.5, 5.8, 42), (t) => ({ prop: 'heart' }));
  add('e5', m.through - 0.1, sc.grip.start, 'kitchen', NANC, (t) => ({ ...base(t), nanLook: 'cam' }));
  // --- grip
  add('g1', sc.grip.start, m.grip470 - 0.1, 'studio', ST(2.1, 7.0), (t) => ({ prop: 'dial', dialV: 47 * easeOut(prog(t, sc.grip.start + 0.2, sc.grip.start + 1.2)), squeeze: 0.5 }));
  add('g2', m.grip470 - 0.1, m.down - 0.1, 'studio', mv([0.2, 2.2, 7.4], [0, 2.1, 6.6], [0, 1.9, 0], [0, 1.9, 0], 44, 2), (t) => ({ prop: 'dial', dialV: lerp(47, 470, easeOut(prog(t, m.grip470, m.grip470 + 0.9))), squeeze: 1, dialBreak: prog(t, m.grip470 + 1.2, m.grip470 + 2.0) }));
  add('g3', m.down - 0.1, m.slowly - 0.1, 'kitchen', mv([1.65, 1.15, 0.15], [1.6, 1.1, 0.05], [1.4, 0.95, -0.8], [1.4, 0.9, -0.8], 40), (t) => ({ ...base(t), daveLook: 'jar' }));
  add('g4', m.slowly - 0.1, sc.jump.start, 'kitchen', DAVEC, (t) => ({ ...base(t), daveLook: 'jar', wide: 1 }));
  // --- jump
  add('j1', sc.jump.start, m.jump7 - 0.1, 'studio', mv([2.2, 1.2, 6.5], [2.0, 1.4, 6.0], [0.2, 1.2, 0], [0.2, 1.5, 0], 44), (t) => ({ prop: 'pole', poleH: 0.4 * Math.max(0, Math.sin(prog(t, sc.jump.start + 0.6, sc.jump.start + 1.2) * Math.PI)) }));
  add('j2', m.jump7 - 0.1, m.roof - 0.1, 'studio', camKeys([K(0, [3.5, 1.5, 10], [0.2, 1.5, 0], 50), K(2.2, [3.5, 6.0, 10], [0.2, 6.5, 0], 50)]), (t) => ({ prop: 'pole', poleH: 7 * Math.sin(Math.min(1, prog(t, m.jump7 + 0.1, m.jump7 + 2.0)) * Math.PI / 2), ghost: true, ghostH: 0.0 }));
  add('j3', m.roof - 0.1, 32.0, 'street', STREETW, (t) => ({ mode: 'jump', jt: t - m.jump7 + 0.4, doorsOff: false }));
  add('j4', 32.0, sc.doors.start, 'city', CITY(0.6), (t) => ({ mode: 'roofs' }));
  // --- doors
  add('o1', sc.doors.start, 35.2, 'street', mv([2.4, 1.7, 7.5], [2.6, 1.65, 7.0], [5.2, 1.3, 1.0], [5.2, 1.3, 1.0], 46), (t) => ({ mode: 'doors' }));
  add('o2', 35.2, m.hinges - 0.1, 'street', mv([-2.6, 1.6, 6.5], [-2.8, 1.6, 6.2], [-5.2, 1.3, 1.0], [-5.2, 1.3, 1.0], 44, 2), (t) => ({ mode: 'doors' }));
  add('o3', m.hinges - 0.1, sc.bite.start, 'street', mv([3.6, 1.5, 6.2], [3.9, 1.5, 5.6], [5.0, 1.1, 0.0], [5.0, 1.1, 0.0], 46, 2), (t) => ({ mode: 'doors' }));
  // --- bite
  add('b1', sc.bite.start, m.bite8k - 0.1, 'toast', mv([-0.55, 1.5, 1.55], [-0.5, 1.5, 1.45], [1.15, 1.3, 0.3], [1.15, 1.32, 0.3], 40), (t) => ({ biteT: -1 }));
  add('b2', m.bite8k - 0.1, m.car - 0.1, 'toast', mv([0.2, 1.65, 1.3], [0.3, 1.63, 1.2], [1.2, 1.55, 0.35], [1.2, 1.55, 0.35], 34, 2), (t) => ({ biteT: t >= m.bite8k + 0.25 ? t - m.bite8k - 0.25 : -1 }));
  add('b3', m.car - 0.1, m.toast - 0.1, 'studio', ST(2.8, 9.5), (t) => ({ prop: 'tooth', carK: prog(t, m.car + 0.2, m.car + 1.6) }));
  add('b4', m.toast - 0.1, sc.bones.start, 'toast', mv([0.35, 1.45, 2.5], [0.4, 1.45, 2.4], [1.2, 1.2, 0.35], [1.2, 1.2, 0.35], 44), (t) => ({ biteT: t - m.bite8k - 0.25 }));
  // --- bones
  add('n1', sc.bones.start, m.same - 0.1, 'kitchen', DAVEC, (t) => ({ ...base(t), frozen: true, daveLook: 'cam' }));
  add('n2', m.same - 0.1, m.break - 0.1, 'studio', ST(3.2, 13.5), (t) => ({ prop: 'bars', barsK: easeOut(prog(t, m.same + 0.4, m.same + 2.2)) }));
  add('n3', m.break - 0.1, m.brain - 0.1, 'studio', ST(2.2, 6.5, 40), (t) => ({ prop: 'bone', crack: prog(t, m.break + 0.7, m.break + 1.4) }));
  add('n4', m.brain - 0.1, m.busy - 0.1, 'studio', ST(1.9, 6.0, 40), (t) => ({ prop: 'brain', strain: 0.3 }));
  add('n5', m.busy - 0.1, 60.3, 'studio', mv([0.3, 2.0, 4.4], [0.1, 1.95, 3.9], [0, 1.85, 0], [0, 1.85, 0], 40, 1.6), (t) => ({ prop: 'brain', strain: 1 }));
  add('n6', 60.3, sc.nan.start, 'kitchen', F, (t) => ({ ...base(t), frozen: true, daveLook: 'cam', nanLook: 'dave', shake: 1 }));
  // --- nan
  add('a1', sc.nan.start, m.nan190 - 0.1, 'studio', ST(2.1, 7.0), (t) => ({ prop: 'dial', dialV: 19 * easeOut(prog(t, sc.nan.start + 0.3, sc.nan.start + 1.3)), squeeze: 0.3 }));
  add('a2', m.nan190 - 0.1, m.takes - 0.1, 'studio', mv([0.2, 2.2, 7.4], [0, 2.1, 6.6], [0, 1.9, 0], [0, 1.9, 0], 44, 2), (t) => ({ prop: 'dial', dialV: lerp(19, 190, easeOut(prog(t, m.nan190, m.nan190 + 1.0))), squeeze: 1 }));
  add('a3', m.takes - 0.1, m.ask - 0.1, 'kitchen', NANC, (t) => ({ ...base(t), frozen: true, nanLook: 'jar', twist: true }));
  add('a4', m.ask - 0.1, sc.back.start, 'kitchen', mv([1.6, 1.35, 0.85], [1.62, 1.4, 0.8], [2.4, 1.05, -0.45], [2.4, 1.3, -0.45], 42, 1.5), (t) => ({ ...base(t), frozen: true, nanLook: t >= m.ask + 0.2 ? 'up' : 'jar' }));
  // --- back + aftermath
  add('k1', sc.back.start, sc.aftermath.start, 'kitchen', F, (t) => ({ ...base(t), flash: flashAt(t, SNAP, 0.6), daveLook: 'jar', nanLook: 'dave' }));
  add('f1', sc.aftermath.start, 73.3, 'city', CITY(2.2), (t) => ({ mode: 'roofs' }));
  add('f2', 73.3, m.roofers - 0.1, 'street', mv([3.5, 1.6, 6.5], [3.2, 1.6, 6.0], [5.2, 1.0, 1.0], [5.2, 1.0, 1.0], 44, 2), (t) => ({ mode: 'after' }));
  add('f3', m.roofers - 0.1, sc.dave_end.start, 'street', camKeys([K(0, [2.0, 1.6, 9], [-0.5, 2.5, 0.5], 46), K(2.3, [1.8, 3.2, 9], [-0.5, 6.5, 0.5], 46)]), (t) => ({ mode: 'after' }));
  // --- end
  add('z1', sc.dave_end.start, m.loosened - 0.1, 'kitchen', JARC, (t) => ({ ...base(t), daveLook: 'jar' }));
  add('z2', m.loosened - 0.1, m.comment - 0.1, 'kitchen', F, (t) => ({ ...base(t), daveLook: 'nan', talk: t < m.loosened + 1.6, nanLook: 'dave' }));
  add('z3', m.comment - 0.1, sc.endcard.start, 'kitchen', NANC, (t) => ({ ...base(t), nanLook: 'cam' }));
  add('endcard', sc.endcard.start, sc.endcard.end, 'black', () => ({ pos: V3(0, 0, 5), look: V3(0, 0, 0) }), () => ({}));
  return { shots };
}
