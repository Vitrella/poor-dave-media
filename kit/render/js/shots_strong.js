import { lerp, smooth, easeInOut, prog, V3, lerpV } from './util.js';
function camKeys(keys) { return (tl) => { if (tl <= keys[0].t) return keys[0]; for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (tl <= b.t) { const k = easeInOut(prog(tl, a.t, b.t)); return { pos: lerpV(a.pos, b.pos, k), look: lerpV(a.look, b.look, k), fov: lerp(a.fov ?? 44, b.fov ?? 44, k) }; } } return keys[keys.length - 1]; }; }
const K = (t, pos, look, fov) => ({ t, pos: V3(...pos), look: V3(...look), fov });
const GOLD = '#f2c85b';
export function buildShotsStrong(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s]));
  const ON = m.on, SNAP = m.back; const shots = []; const add = (id, from, to, set, cam, ctx) => shots.push({ id, from, to, set, cam, ctx });
  const flashAt = (t, t0, a = 0.55) => t >= t0 ? Math.max(0, a - (t - t0) * 2.3) : 0;
  const jarMode = (t) => t >= SNAP ? 'open' : t >= m.takes ? 'nan' : t >= m.slowly + 1.4 ? 'table' : t >= m.down ? 'down' : 'dave';
  const base = (t) => ({ jarMode: jarMode(t), down: prog(t, m.down, m.slowly + 1.4), twist: t < ON, strain: t < ON ? 0.8 : 0, wide: t >= ON && t < SNAP ? 1 : 0, lidPop: prog(t, m.ask + 0.15, m.ask + 0.85), nanArms: t >= SNAP ? 'folded' : t >= m.takes ? 'jar' : 'lap' });
  const F = camKeys([K(0, [1.75, 1.5, 2.3], [1.75, 1.0, -0.6], 44), K(6, [1.7, 1.45, 2.1], [1.75, 1.0, -0.6], 44)]);
  add('hook', 0, sc.dave.start, 'kitchen', camKeys([K(0, [1.4, 1.42, 0.7], [1.35, 1.38, -1.15], 36), K(1.8, [1.4, 1.42, 0.55], [1.35, 1.38, -1.15], 35)]), (t) => ({ ...base(t), daveLook: 'jar' }));
  add('dave_a', sc.dave.start, m.made - 0.1, 'kitchen', F, (t) => ({ ...base(t), daveLook: 'jar', nanLook: 'dave' }));
  add('dave_b', m.made - 0.1, sc.event.start, 'kitchen', camKeys([K(0, [1.5, 1.35, 0.5], [1.36, 1.15, -1.0], 36), K(4, [1.48, 1.33, 0.4], [1.36, 1.15, -1.0], 34)]), (t) => ({ ...base(t), daveLook: 'jar' }));
  add('event_a', sc.event.start, m.only - 0.1, 'kitchen', F, (t) => ({ ...base(t), flash: flashAt(t, ON), daveLook: t > ON + 0.3 ? 'hands' : 'jar', nanLook: 'dave' }));
  add('event_b', m.only - 0.1, sc.grip.start, 'kitchen', camKeys([K(0, [1.5, 1.3, 0.7], [2.55, 0.95, -0.45], 40), K(5, [1.55, 1.28, 0.6], [2.55, 0.95, -0.45], 38)]), (t) => ({ ...base(t), nanLook: t >= m.through ? 'cam' : 'dave', nanWide: 0 }));
  add('grip_a', sc.grip.start, m.down - 0.1, 'kitchen', camKeys([K(0, [1.45, 1.45, 0.75], [1.35, 1.15, -1.15], 38), K(4, [1.45, 1.43, 0.6], [1.35, 1.15, -1.15], 36)]), (t) => ({ ...base(t), daveLook: 'jar' }));
  add('grip_b', m.down - 0.1, sc.jump.start, 'kitchen', camKeys([K(0, [1.65, 1.15, 0.15], [1.4, 0.95, -0.8], 42), K(4, [1.6, 1.1, 0.1], [1.4, 0.9, -0.8], 42)]), (t) => ({ ...base(t), daveLook: 'jar' }));
  add('jump', sc.jump.start, sc.doors.start, 'street', camKeys([K(0, [1.5, 2.2, 17], [0, 3.8, 0], 50), K(7.7, [1.2, 2.4, 16], [0, 4.0, 0], 50)]), (t) => ({ mode: 'jump', jt: t - m.jump7 + 0.4, doorsOff: false }));
  add('doors', sc.doors.start, sc.bite.start, 'street', camKeys([K(0, [2.4, 1.7, 7.5], [5.2, 1.3, 1.0], 46), K(5.5, [2.6, 1.65, 7.0], [5.2, 1.3, 1.0], 44)]), (t) => ({ mode: 'doors' }));
  add('bite_a', sc.bite.start, m.car - 0.1, 'toast', camKeys([K(0, [-0.55, 1.5, 1.55], [1.15, 1.3, 0.3], 40), K(5, [-0.5, 1.5, 1.45], [1.15, 1.32, 0.3], 38)]), (t) => ({ biteT: t >= m.bite8k + 0.25 ? t - m.bite8k - 0.25 : -1 }));
  add('bite_b', m.car - 0.1, sc.bones.start, 'toast', camKeys([K(0, [0.35, 1.45, 2.5], [1.2, 1.2, 0.35], 44), K(5.5, [0.4, 1.45, 2.4], [1.2, 1.2, 0.35], 44)]), (t) => ({ biteT: t - m.bite8k - 0.25 }));
  add('bones_a', sc.bones.start, m.brain - 0.1, 'kitchen', camKeys([K(0, [1.4, 1.5, 0.8], [1.35, 1.25, -1.15], 40), K(7, [1.4, 1.5, 0.5], [1.35, 1.3, -1.15], 36)]), (t) => ({ ...base(t), frozen: true, daveLook: 'cam' }));
  add('bones_b', m.brain - 0.1, sc.nan.start, 'kitchen', F, (t) => ({ ...base(t), frozen: true, daveLook: 'cam', nanLook: 'dave', shake: t >= m.busy ? 1 : 0 }));
  add('nan_a', sc.nan.start, m.takes - 0.1, 'kitchen', camKeys([K(0, [1.5, 1.3, 0.75], [2.5, 0.95, -0.45], 40), K(3.6, [1.55, 1.28, 0.65], [2.5, 0.95, -0.45], 38)]), (t) => ({ ...base(t), frozen: true, nanLook: 'jar' }));
  add('nan_b', m.takes - 0.1, sc.back.start, 'kitchen', camKeys([K(0, [1.6, 1.35, 0.85], [2.4, 1.05, -0.45], 42), K(4, [1.62, 1.33, 0.8], [2.4, 1.1, -0.45], 42)]), (t) => ({ ...base(t), frozen: true, nanLook: t >= m.ask + 0.2 ? 'up' : 'jar', twist: t < m.ask + 0.15 }));
  add('back', sc.back.start, sc.aftermath.start, 'kitchen', F, (t) => ({ ...base(t), flash: flashAt(t, SNAP, 0.6), daveLook: 'jar', nanLook: 'dave' }));
  add('after', sc.aftermath.start, sc.dave_end.start, 'street', camKeys([K(0, [2.2, 2.0, 15], [0, 4.2, 0], 48), K(6.3, [2.0, 2.4, 14], [0, 4.6, 0], 48)]), (t) => ({ mode: 'after' }));
  add('end_a', sc.dave_end.start, m.comment - 0.1, 'kitchen', F, (t) => ({ ...base(t), daveLook: 'nan', talk: t >= m.loosened && t < m.loosened + 1.6, nanLook: 'dave' }));
  add('end_b', m.comment - 0.1, sc.endcard.start, 'kitchen', camKeys([K(0, [1.5, 1.3, 0.7], [2.55, 0.95, -0.45], 40), K(3, [1.52, 1.29, 0.62], [2.55, 0.95, -0.45], 39)]), (t) => ({ ...base(t), nanLook: 'cam' }));
  add('endcard', sc.endcard.start, sc.endcard.end, 'black', () => ({ pos: V3(0, 0, 5), look: V3(0, 0, 0) }), () => ({}));
  return { shots };
}
export function overlayCfgStrong(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on, SNAP = m.back;
  const fmt = (v) => { v = Math.max(0, v); const s = Math.floor(v); const ms = Math.floor((v - s) * 1000); return `0:0${s}.${String(ms).padStart(3, '0')}`; };
  return {
    title: [[{ t: 'What if everyone on Earth' }], [{ t: 'was ' }, { t: '10× stronger', c: GOLD }, { t: ' for 5 seconds?' }]],
    titleFrom: 0.3, titleTo: sc.dave.start + 4.2,
    counter: { from: ON - 0.05, label: (t) => t >= SNAP ? 'NORMAL STRENGTH RESTORED' : 'NORMAL STRENGTH IN', fmt: (t) => fmt(5 * (1 - prog(t, ON, SNAP))) },
    status: [[sc.dave.start, 'NAN’S PICKLES · LID: STUCK SINCE 1998'], [m.down, 'NAN’S PICKLES · JAR: PUT DOWN'], [m.takes, 'NAN’S PICKLES · NAN HAS THE JAR'], [m.ask, 'NAN’S PICKLES · LID: OFF'], [m.loosened, 'NAN’S PICKLES · CREDIT: DISPUTED']],
    callouts: [
      [m.made, m.lid - 0.1, 'PICKLES MADE', '1998'],
      [m.lid, sc.event.start - 0.1, 'LID ROTATIONS SINCE', '0'],
      [m.only, m.heart - 0.1, 'APPLIES TO', 'SKELETAL MUSCLE'],
      [m.heart, sc.grip.start - 0.1, 'HEART', 'EXCLUDED'],
      [m.grip47, m.grip470 - 0.1, 'AVERAGE ADULT GRIP', '47 KG'],
      [m.grip470, m.down - 0.1, 'GRIP NOW', '470 KG'],
      [m.jump40, m.jump7 - 0.1, 'AVERAGE JUMP', '40 CM'],
      [m.jump7, m.roof - 0.1, 'JUMP NOW', '≈ 7 M'],
      [m.roof, sc.doors.start - 0.1, 'ROOF HEIGHT', '7.6 M'],
      [m.door + 0.4, sc.bite.start - 0.1, 'HINGES', 'NOT CONSULTED'],
      [m.bite, m.bite8k - 0.1, 'MOLAR BITE FORCE', '850 N'],
      [m.bite8k, m.car - 0.1, 'BITE NOW', '8,500 N'],
      [m.car, m.toast - 0.1, '1 SMALL CAR', '≈ 870 KG'],
      [m.same, m.break - 0.1, 'MUSCLE · BONE · TENDON', '10× · 1× · 1×'],
      [m.break, m.brain - 0.1, 'BONES BROKEN BY OWN MUSCLES', 'IT HAPPENS'],
      [m.brain, sc.nan.start - 0.1, 'SAFETY LIMIT', 'YOUR BRAIN'],
      [m.nan19, m.nan190 - 0.1, 'GRIP, WOMEN 75–79', '19 KG'],
      [m.nan190, m.takes - 0.1, 'NAN’S GRIP NOW', '190 KG'],
      [m.roofers, sc.dave_end.start - 0.1, 'PEOPLE ON ROOFS', 'MANY'],
      [m.loosened, sc.endcard.start - 0.1, 'WHO LOOSENED IT', 'NAN'],
    ],
    end: { lines: ['YOUR MUSCLES CAN ALREADY BREAK YOUR BONES.', 'YOUR BRAIN HOLDS THEM BACK.'] },
  };
}
