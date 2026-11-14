import { lerp, easeInOut, easeOut, easeIn, prog, smooth, clamp, V3, lerpV } from './util.js';
const GOLD = '#f2c85b';
function camKeys(keys) { return (tl) => { if (tl <= keys[0].t) return keys[0]; for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (tl <= b.t) { const k = easeInOut(prog(tl, a.t, b.t)); return { pos: lerpV(a.pos, b.pos, k), look: lerpV(a.look, b.look, k), fov: lerp(a.fov ?? 44, b.fov ?? 44, k) }; } } return keys[keys.length - 1]; }; }
const K = (t, pos, look, fov) => ({ t, pos: V3(...pos), look: V3(...look), fov });
const mv = (p0, p1, l0, l1, fov = 44, d = 3) => camKeys([K(0, p0, l0, fov), K(d, p1, l1, fov)]);

// Earth-clock model: seconds elapsed on Earth since departure (18:58:00), as a function of video time
export function earthElapsed(t, m) {
  const logI = (a, b, k) => Math.exp(lerp(Math.log(a), Math.log(b), k));
  const PL = 17577; // Pluto: 4 h 52 min 57 s of light time
  if (t < m.passes) return 0;
  if (t < m.micro) return lerp(0, 1e-5, easeOut(prog(t, m.passes, m.micro)));
  if (t < m.moon) return logI(1e-5, 1.28, prog(t, m.micro, m.moon));
  if (t < m.jupiter) return logI(1.28, 2400, prog(t, m.moon, m.jupiter));
  if (t < m.pluto) return logI(2400, PL, prog(t, m.jupiter, m.pluto));
  if (t < m.turns) return PL;
  if (t < m.walks) return lerp(PL, 2 * PL, easeInOut(prog(t, m.turns, m.walks)));
  return 2 * PL;
}
const pad = (n, w = 2) => String(n).padStart(w, '0');
export function clockStr(secFrom1858, frac = false) { let s = 18 * 3600 + 58 * 60 + secFrom1858; s = ((s % 86400) + 86400) % 86400; const h = Math.floor(s / 3600), mi = Math.floor((s % 3600) / 60), se = s % 60; if (!frac) return `${pad(h)}:${pad(mi)}:${pad(Math.floor(se))}`; const whole = Math.floor(se); const f = se - whole; if (secFrom1858 < 1) return `${pad(h)}:${pad(mi)}:${pad(whole)}.${pad(Math.floor(f * 1e6), 6)}`; return `${pad(h)}:${pad(mi)}:${pad(whole)}.${pad(Math.floor(f * 1000), 3)}`; }

export function overlayCfgLight(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on;
  const fmt = (t) => { if (t < ON) return clockStr(t - ON); const E = earthElapsed(t, m); return E < 60 ? clockStr(E, true) : clockStr(E); };
  return {
    title: [[{ t: 'What if ' }, { t: 'Dave', c: GOLD }, { t: ' travelled' }], [{ t: 'at the ' }, { t: 'speed of light?', c: GOLD }]],
    titleFrom: 0.3, titleTo: 4.6,
    counter: { from: 0.0, label: (t) => t >= m.walks ? 'EARTH CLOCK · SATURDAY' : (t >= ON ? 'EARTH CLOCK · FRIDAY' : 'FRIDAY'), fmt, color: (t) => (t >= m.walks ? GOLD : '#fff'), font: '700 78px "Playfair Display"' },
    status: [[0.2, 'DAVE · LATE'], [m.three, 'DAVE · 3 KM AWAY · WITH CAKE'], [ON, 'DAVE · 99.9999% OF c'], [m.kilos, 'DAVE · 75 KG (CAKE INCLUDED)'], [m.sandwich, 'FUEL · ONE SANDWICH'], [m.passes, 'RESTAURANT · PASSED'], [m.brakes, 'BRAKES · NONE'], [m.moon, 'DAVE · STILL APOLOGISING'], [sc.time.start, 'DAVE · AT PLUTO · EXPLAINING'], [sc.light.start, 'DAVE · ASSUMES IT’S NIGHT'], [sc.hydrogen.start, 'SWEATER · NOT RATED FOR THIS'], [m.tingle, 'DAVE · A TINGLE'], [m.turns, 'U-TURN · DON’T ASK'], [m.walks, 'DAVE · ON TIME (HIS WATCH)'], [m.waited, 'PRIYA · WAITED'], [m.breakfast, 'DINNER → BREAKFAST']],
    callouts: [
      [0.3, m.late - 0.1, 'FRIDAY · 18:58', 'REHEARSAL DINNER · 19:00'],
      [m.late, m.seven - 0.1, 'DAVE', 'LATE'],
      [m.seven, m.leicester - 0.1, 'THE ITALIAN PLACE', 'TABLE FOR FIVE'],
      [m.leicester, m.three - 0.1, 'PRIYA’S PARENTS', 'FROM LEICESTER'],
      [m.three, m.cake - 0.1, 'DISTANCE', '3 KM'],
      [m.cake, ON - 0.1, 'CARGO', 'ONE LEMON CAKE'],
      [ON, m.nearly - 0.1, 'SPEED OF LIGHT', '299,792 KM/S'],
      [m.nearly, m.mass - 0.1, 'NEARLY', 'LIGHT SPEED'],
      [m.mass, m.infinite - 0.1, 'ENERGY AT 100% c', '(γ − 1) mc² → ∞'],
      [m.infinite, m.settles - 0.1, 'REQUIRED ENERGY', 'INFINITE'],
      [m.settles, m.percent - 0.1, 'DAVE SETTLES FOR', '99.9999% OF c'],
      [m.percent, sc.energy.start - 0.1, 'LORENTZ FACTOR γ', '707'],
      [m.kilos, m.joules - 0.1, 'DAVE (WITH CAKE)', '75 KG'],
      [m.joules, m.eight - 0.1, 'ENERGY (γ − 1) mc²', '4.8 × 10²¹ J'],
      [m.eight, m.sandwich - 0.1, 'WORLD ENERGY USE', '620 EJ / YEAR → 8 YEARS'],
      [m.sandwich, m.passes - 0.1, 'FUEL ON BOARD', 'ONE SANDWICH · 1.5 MJ'],
      [m.passes, m.micro - 0.1, 'THE RESTAURANT', 'PASSED'],
      [m.micro, m.brakes - 0.1, '3 KM AT c', '10 MICROSECONDS'],
      [m.brakes, m.moon - 0.1, 'BRAKES', 'NOT INCLUDED'],
      [m.moon, m.jupiter - 0.1, 'MOON · 384,400 KM', '1.3 S'],
      [m.jupiter, m.pluto - 0.1, 'JUPITER', '≈ 40 LIGHT-MINUTES'],
      [m.pluto, m.sorry - 0.1, 'PLUTO · 35 AU', '4 H 53 MIN'],
      [m.sorry, sc.time.start - 0.1, 'DAVE', 'STILL APOLOGISING'],
      [sc.time.start, m.slower - 0.1, 'TIME DILATION', 'γ = 1 / √(1 − v²/c²)'],
      [m.slower, m.oneday - 0.1, 'DAVE’S CLOCK', '707× SLOWER'],
      [m.oneday, m.twoyears - 0.1, '1 DAY FOR DAVE', '707 DAYS ON EARTH'],
      [m.twoyears, sc.length.start - 0.1, 'ON EARTH', '1.9 YEARS'],
      [m.squashes, m.watch - 0.1, 'LENGTH CONTRACTION', '÷ 707'],
      [m.watch, m.twentyfive - 0.1, 'EARTH → PLUTO', '5 H → 25 S'],
      [m.twentyfive, sc.light.start - 0.1, 'ON DAVE’S WATCH', '25 SECONDS'],
      [sc.light.start, m.xrays - 0.1, 'DOPPLER SHIFT AHEAD', '× 1,414'],
      [m.xrays, m.dot - 0.1, '550 NM →', '0.39 NM · X-RAY'],
      [m.dot, m.behind - 0.1, 'ABERRATION', 'WHOLE SKY → ONE DOT'],
      [m.behind, m.night - 0.1, 'BEHIND DAVE', 'REDSHIFTED TO MICROWAVE'],
      [m.night, sc.hydrogen.start - 0.1, 'DAVE', 'ASSUMES IT’S NIGHT'],
      [sc.hydrogen.start, m.atom - 0.1, 'INTERSTELLAR GAS', '≈ 1 ATOM / CM³'],
      [m.atom, m.collider - 0.1, 'EACH PROTON', '≈ 660 GeV'],
      [m.collider, m.lethal - 0.1, 'LIKE', 'A COLLIDER BEAM'],
      [m.lethal, m.tingle - 0.1, 'DOSE', 'LETHAL IN < 1 S'],
      [m.tingle, sc.uturn.start - 0.1, 'DAVE REPORTS', 'A TINGLE'],
      [sc.uturn.start, m.turns - 0.1, 'PLUTO', '5.3 BILLION KM OUT'],
      [m.turns, m.fifty - 0.1, 'U-TURN', 'DON’T ASK'],
      [m.fifty, sc.end.start - 0.1, 'DAVE’S WATCH', '0:51 ELAPSED'],
      [sc.end.start, m.watch2 - 0.1, 'ROUND TRIP ON EARTH', '9 H 46 MIN'],
      [m.watch2, m.five - 0.1, 'BY HIS WATCH', 'ON TIME'],
      [m.five, m.waited - 0.1, 'SATURDAY', '04:44'],
      [m.waited, m.breakfast - 0.1, 'PRIYA', 'WAITED'],
      [m.breakfast, m.cake2 - 0.1, 'REHEARSAL DINNER', 'REHEARSAL BREAKFAST'],
      [m.cake2, sc.endcard.start - 0.1, 'THE CAKE', 'STILL LEMON'],
    ],
    extra: (ctx, t, c2) => { if (t < ON) return; const E = earthElapsed(t, m); const D = E / 707; const s = clockStr(D, D < 60); ctx.save(); ctx.globalAlpha = smooth(prog(t, ON, ON + 0.4)); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 12; ctx.textAlign = 'left'; ctx.font = '500 21px "Inter"'; ctx.letterSpacing = '5px'; ctx.fillStyle = GOLD; ctx.fillText('DAVE’S WATCH · ' + s, 72, 1085); ctx.letterSpacing = '0px'; ctx.restore(); },
    end: { lines: ['AT 99.9999% OF c, ONE DAY FOR DAVE IS TWO YEARS ON EARTH.', 'NOTHING WITH MASS REACHES 100%. NOT EVEN DAVE.'] },
  };
}

export function buildShotsLight(TL) {
  const m = TL.marks; const sc = Object.fromEntries(TL.scenes.map(s => [s.id, s])); const ON = m.on;
  const shots = []; const add = (id, from, to, set, cam, ctx) => shots.push({ id, from, to, set, cam, ctx });
  const flashAt = (t, t0, a = 0.55) => t >= t0 ? Math.max(0, a - (t - t0) * 2.3) : 0;
  const W = (t) => { const E = earthElapsed(t, m) / 707; return clockStr(E, false); }; // Dave's watch text
  const PL = 17577;
  // ---------------- intro ----------------
  add('h1', 0, 1.1, 'flight', mv([0.45, 2.5, -1.6], [0.4, 2.4, -1.55], [0, 0.2, -1.0], [0, 0.2, -1.0], 36), (t) => ({ speed: 1, ahead: 1, aheadBlue: 0.7, wide: 0.7, open: 0.35, neckX: 0.3, watch: '18:58:00' }));
  add('h2', 1.1, 2.2, 'street', mv([-6, 2.4, 2.5], [-6.5, 2.3, 2.0], [-9, 1.1, -6.2], [-8.4, 1.1, -6.2], 50), (t) => ({ dave: 'run', daveX: -12 + (t - 1.1) * 4.5, runT: t }));
  add('h3', 2.2, sc.dave.start, 'rest', mv([0.6, 1.9, 4.2], [0.55, 1.85, 3.9], [0, 1.0, -0.5], [0, 1.0, -0.5], 46), (t) => ({ mode: 'evening', clock: 18.965, priya: 'watch', parents: 'sit' }));
  // ---------------- dave ----------------
  add('d1', sc.dave.start, 4.6, 'street', mv([12.8, 3.2, 3.0], [12.6, 3.1, 2.4], [12.5, 2.4, -9.3], [12.5, 2.4, -9.3], 50), (t) => ({ dave: 'none' }));
  add('d2', 4.6, 5.75, 'rest', mv([0.3, 1.6, 2.5], [0.2, 1.55, 2.3], [-0.3, 1.1, -0.5], [-0.3, 1.1, -0.5], 44), (t) => ({ mode: 'evening', clock: 18.97, priya: 'watch', parents: 'sit' }));
  add('d2b', 5.75, m.leicester + 0.05, 'rest', mv([-1.6, 0.95, 1.9], [-1.62, 0.9, 1.8], [-1.9, 0.5, 0.5], [-1.9, 0.5, 0.5], 36), (t) => ({ mode: 'evening', clock: 18.97, priya: 'watch', parents: 'sit' }));
  const dX3 = (t) => -3 + (t - 6.8) * 4.2;
  add('d3', m.leicester + 0.05, 8.3, 'street', (tl, d, t) => ({ pos: V3(dX3(t) + 2.6, 1.5, -3.4), look: V3(dX3(t), 1.1, -6.2), fov: 42 }), (t) => ({ dave: 'run', daveX: dX3(t), runT: t, wide: 0.2, open: 0.3 }));
  add('d4', 8.3, 9.8, 'city', mv([0, 175, 150], [2, 170, 144], [-3, 0, 0], [-3, 0, 0], 50), (t) => ({ mode: 'traffic', dark: 0.5, pins: true, dotsK: prog(t, 8.4, 9.3) }));
  const dX5 = (t) => 4 + (t - 9.8) * 4.2;
  add('d5', 9.8, sc.event.start, 'street', (tl, d, t) => ({ pos: V3(dX5(t) + 1.7, 1.35, -5.2), look: V3(dX5(t) + 0.5, 1.15, -6.2), fov: 34 }), (t) => ({ dave: 'run', daveX: dX5(t), runT: t }));
  // ---------------- event ----------------
  add('e1', sc.event.start, 11.9, 'street', mv([-1.5, 1.7, -2.2], [-1.0, 1.65, -2.4], [3, 1.1, -6.2], [4, 1.1, -6.2], 48), (t) => ({ peds: false, dave: t < ON ? 'run' : 'none', daveX: 1 + (t - sc.event.start) * 4.2, runT: t, streak: t >= ON ? Math.max(0, 1 - (t - ON) * 1.4) : 0, streakX: 10 + (t - ON) * 60, streakDir: 1, flash: flashAt(t, ON, 0.7), scatter: t >= ON ? (t - ON) : 0 }));
  add('e2', 11.9, 13.3, 'flight', mv([2.0, 1.8, -3.4], [1.9, 1.75, -3.2], [0, 0.2, 0.2], [0, 0.2, 0.2], 44), (t) => ({ speed: 0.5 + 0.5 * prog(t, 11.9, 12.6), ahead: 0.7, aheadBlue: 0.3, wide: t > m.nearly ? 0.5 : 0.1, watch: '18:58:00' }));
  add('e3', 13.3, 15.3, 'studio', mv([0.3, 2.6, 9.6], [0.2, 2.55, 9.3], [0, 2.5, 0], [0, 2.5, 0], 46), (t) => ({ prop: 'graph', k: prog(t, 13.4, 15.2) * 0.96 }));
  add('e3b', 15.3, 16.6, 'studio', mv([1.2, 4.1, 5.0], [1.3, 4.1, 4.8], [1.4, 4.0, 0], [1.4, 4.0, 0], 40), (t) => ({ prop: 'graph', k: 1 }));
  add('e4', 16.6, 18.6, 'studio', mv([0.3, 3.0, 7.4], [0.25, 2.95, 7.1], [0, 2.6, 0], [0, 2.6, 0], 46), (t) => ({ prop: 'speedo', k: prog(t, 16.7, m.settles + 0.5) }));
  add('e5', 18.6, 19.7, 'flight', mv([0.45, 2.5, -1.6], [0.42, 2.45, -1.58], [0, 0.2, -1.0], [0, 0.2, -1.0], 36), (t) => ({ speed: 1, ahead: 0.9, aheadBlue: 0.6, wide: 0.0, open: 0.0, neckX: 0.3, watch: '18:58:00' }));
  add('e5b', 19.7, sc.energy.start, 'flight', mv([3.4, 2.2, 2.6], [3.2, 2.1, 2.3], [0, 0.1, -0.6], [0, 0.1, -0.6], 48), (t) => ({ speed: 1, ahead: 1, aheadBlue: 0.7, watch: '18:58:00' }));
  // ---------------- energy ----------------
  add('n1', sc.energy.start, 22.6, 'studio', mv([0.5, 1.9, 7.6], [0.4, 1.85, 7.3], [0, 1.6, 0], [0, 1.6, 0], 48), (t) => ({ prop: 'scale', k: prog(t, 21.0, m.kilos + 0.5) }));
  add('n2', 22.6, 24.2, 'studio', mv([0.2, 2.8, 12.6], [0.1, 2.75, 12.2], [0, 2.6, 0], [0, 2.6, 0], 46), (t) => ({ prop: 'joules', k: prog(t, 22.7, m.joules + 0.3) }));
  add('n2b', 24.2, 25.5, 'studio', mv([1.9, 1.5, 3.8], [1.8, 1.45, 3.6], [1.0, 1.1, 0], [1.0, 1.1, 0], 40), (t) => ({ prop: 'joules', k: 1 }));
  add('n3', 25.5, 27.4, 'planet', mv([1, 4, 46], [0.5, 3.8, 44.5], [0, 2, 0], [0, 2, 0], 42), (t) => ({ which: 'earth', mode: 'pass', k: -1, lights: 1 - 0.85 * easeOut(prog(t, m.eight, m.eight + 1.0)), label: t > m.eight ? '8 YEARS' : '', sub: t > m.eight + 0.3 ? 'OF THE WHOLE PLANET’S ENERGY' : '', labelPos: [0, 14.5, 0], sunX: 0.35, sunZ: -1, moonVis: false }));
  add('n4', 27.4, 29.0, 'studio', mv([0.3, 2.0, 6.6], [0.25, 1.95, 6.3], [0, 1.7, 0], [0, 1.7, 0], 46), (t) => ({ prop: 'sandwich', sticker: t > m.sandwich + 0.15, stickerK: prog(t, m.sandwich + 0.15, m.sandwich + 0.45) }));
  add('n5', 29.0, sc.pass.start, 'flight', mv([0.45, 2.5, -1.6], [0.44, 2.48, -1.6], [0, 0.2, -1.0], [0, 0.2, -1.0], 36), (t) => ({ speed: 1, ahead: 0.9, aheadBlue: 0.6, open: 0.3 + 0.3 * Math.sin(t * 14), wide: 0.1, neckX: 0.3, watch: '18:58:00' }));
  // ---------------- pass ----------------
  add('p1', sc.pass.start, 31.0, 'street', mv([9.0, 2.6, 1.0], [8.7, 2.55, 0.6], [14, 2.0, -9.3], [14, 2.0, -9.3], 50), (t) => ({ dave: 'none', streak: t >= m.passes ? Math.max(0, 1 - (t - m.passes) * 1.2) : 0, streakX: 12 + (t - m.passes) * 80, streakDir: 1, flash: flashAt(t, m.passes, 0.8), priyaTurn: t > m.passes + 0.15, scatter: t >= m.passes ? (t - m.passes) : 0 }));
  add('p2', 31.0, 32.3, 'rest', mv([0.6, 1.9, 4.0], [0.5, 1.85, 3.8], [0, 1.1, -0.6], [0, 1.1, -0.6], 46), (t) => ({ mode: 'evening', clock: 18.9667, priya: 'look', parents: 'look', blow: t > m.micro ? Math.min(1, (t - m.micro) * 2.5) : 0, flash: flashAt(t, m.micro, 0.6), priyaWide: t > m.micro ? 0.7 : 0 }));
  add('p3', 32.3, 33.6, 'flight', mv([-2.6, 1.7, -1.2], [-2.5, 1.65, -1.0], [0, 0.2, -0.2], [0, 0.2, -0.2], 44), (t) => ({ speed: 1, ahead: 0.8, aheadBlue: 0.5, kick: 1, wide: 0.5, open: 0.3, watch: '18:58:00' }));
  add('p4', 33.6, sc.tour.start, 'studio', mv([0.6, 2.5, 6.4], [0.55, 2.45, 6.1], [0, 2.3, 0], [0, 2.3, 0], 44), (t) => ({ prop: 'pedal' }));
  // ---------------- tour ----------------
  add('t1', sc.tour.start, 35.8, 'planet', mv([14, 14, 62], [14.5, 13.6, 60], [18, 4, -4], [18, 4, -4], 50), (t) => ({ which: 'earth', mode: 'leave', k: prog(t, m.moon - 0.1, m.moon + 0.7), label: t > m.moon + 0.5 ? '1.3 SECONDS' : '', labelPos: [17, 19, -6], lights: 1, moonVis: true, daveScale: 1.6 }));
  add('t2', 35.8, 36.8, 'planet', mv([0, 6, 44], [0, 5.5, 42], [0, 2.5, 0], [0, 2.5, 0], 44), (t) => ({ which: 'moon', mode: 'pass', k: prog(t, 35.8, 36.8), pathY: 4, label: '384,400 KM', labelPos: [0, 14.5, 0], daveScale: 1.5 }));
  add('t3', 36.8, 38.5, 'planet', mv([2, 8, 56], [1, 7.5, 54], [0, 3.5, 0], [0, 3.5, 0], 44), (t) => ({ which: 'jupiter', mode: 'pass', k: prog(t, m.jupiter - 0.1, m.jupiter + 1.3), pathY: 5, label: t > m.jupiter + 0.2 ? '40 MINUTES' : '', labelPos: [0, 18, 0], daveScale: 1.8 }));
  add('t4', 38.5, 40.3, 'system', mv([26, 60, 52], [27, 58, 50], [28, 0, -2], [28, 0, -2], 50), (t) => ({ k: 0.3 + 0.7 * easeOut(prog(t, 38.5, m.pluto + 0.9)), stamps: true }));
  add('t5', 40.3, 41.3, 'planet', mv([6, 7, 40], [5.5, 6.6, 38.5], [0, 2.5, 0], [0, 2.5, 0], 42), (t) => ({ which: 'pluto', mode: 'pass', k: prog(t, 40.3, 41.3), pathY: 3, label: '5 HOURS', labelPos: [0, 13.5, 0], daveScale: 1.5, sunX: 1 }));
  add('t6', 41.3, sc.time.start, 'flight', mv([2.4, 1.7, -2.6], [2.3, 1.65, -2.5], [0.3, 0.2, 0.6], [0.3, 0.2, 0.6], 44), (t) => ({ speed: 1, ahead: 0.8, aheadBlue: 0.5, sorry: 1, open: 0.5 + 0.3 * Math.sin(t * 9), watch: '18:58:25' }));
  // ---------------- time ----------------
  add('c1', sc.time.start, 44.3, 'studio', mv([0.2, 3.8, 10.6], [0.15, 3.75, 10.2], [0, 3.6, 0], [0, 3.6, 0], 46), (t) => ({ prop: 'clocks', daveH: 18.9667 + (t - sc.time.start) * 0.00005, earthH: 18.9667 + (t - sc.time.start) * 0.9, daText: 'DAVE', dbText: 'EARTH · × 707' }));
  add('c2', 44.3, 45.9, 'flight', mv([0.55, 0.95, -1.5], [0.54, 0.94, -1.48], [0.24, 0.36, -0.73], [0.24, 0.36, -0.73], 24), (t) => ({ speed: 1, ahead: 0.7, aheadBlue: 0.5, look: 'watch', watch: '18:58:25', wide: 0.2 }));
  const c3k = (t) => prog(t, 45.9, 47.5);
  add('c3', 45.9, 47.6, 'rest', mv([0.7, 1.9, 4.0], [0.6, 1.85, 3.8], [0, 1.1, -0.5], [0, 1.1, -0.5], 46), (t) => ({ mode: c3k(t) < 0.5 ? 'evening' : 'night', clock: 19.0 + c3k(t) * 4.8, candle: 1 - 0.8 * c3k(t), priya: c3k(t) < 0.5 ? 'watch' : 'phone', parents: 'sit', waiter: 'bread', waiterK: c3k(t) }));
  add('c4', 47.6, 48.9, 'studio', mv([1.45, 3.9, 6.6], [1.45, 3.85, 6.4], [1.45, 3.7, 0], [1.45, 3.7, 0], 46), (t) => ({ prop: 'clocks', daveH: 18.97, earthH: 18.9667 + (t - sc.time.start) * 0.9, daText: '1 DAY', dbText: '707 DAYS', years: t > m.twoyears }));
  add('c5', 48.9, sc.length.start, 'city', mv([60, 75, 100], [55, 72, 96], [0, 0, 0], [0, 0, 0], 48), (t) => { const k = (t - 48.9) / (sc.length.start - 48.9); const ang = k * Math.PI * 4; return { mode: 'traffic', dark: 0.5 - 0.5 * Math.sin(ang), sunAng: ang * 0.5 + 0.4 }; });
  // ---------------- length ----------------
  add('l1', sc.length.start, 51.3, 'pov', mv([0, 0, 0], [0, 0, 0], [0, 0, -10], [0, 0, -10], 70), (t) => ({ beta: lerp(0.9, 0.999999, smooth(prog(t, sc.length.start, 51.2))), pluto: prog(t, m.squashes - 0.2, 51.2), dot: 0.6, arms: true }));
  add('l2', 51.3, 53.3, 'studio', mv([0.2, 2.8, 11.2], [0.15, 2.75, 10.8], [0, 2.7, 0], [0, 2.7, 0], 46), (t) => ({ prop: 'ruler', k: prog(t, 52.0, 52.9) }));
  add('l3', 53.3, 54.9, 'flight', mv([0.55, 0.95, -1.5], [0.54, 0.94, -1.48], [0.24, 0.36, -0.73], [0.24, 0.36, -0.73], 24), (t) => ({ speed: 1, ahead: 0.7, aheadBlue: 0.5, look: 'watch', watch: '18:58:25', wide: 0.4, open: 0.2 }));
  add('l4', 54.9, sc.light.start, 'system', camKeys([K(0, [24, 48, 44], [24, 0, -2], 50), K(1.0, [8, 36, 34], [6, 0, -1], 50)]), (t) => ({ k: 1, squash: prog(t, 54.95, 55.6), stamps: false }));
  // ---------------- light ----------------
  add('x1', sc.light.start, 57.9, 'pov', mv([0, 0, 0], [0, 0, 0], [0, 0, -10], [0, 0, -10], 70), (t) => ({ beta: lerp(0.95, 0.99995, smooth(prog(t, sc.light.start, 57.8))), dot: 0.5 + 0.5 * prog(t, m.xrays - 0.3, 57.8), arms: true, hideSun: true }));
  add('x2', 57.9, 59.6, 'studio', mv([0.2, 3.5, 10.0], [0.15, 3.45, 9.7], [0, 3.4, 0], [0, 3.4, 0], 46), (t) => ({ prop: 'spectrum', k: prog(t, 58.0, 59.3) }));
  add('x3', 59.6, 61.3, 'pov', mv([0, 0, 0], [0, 0, 0], [0, 0, -10], [0, 0, -10], 70), (t) => ({ beta: lerp(0.9999, 0.999999, smooth(prog(t, 59.6, m.dot + 0.2))), dot: 1, arms: true, hideSun: true }));
  add('x4', 61.3, 62.9, 'pov', mv([0, 0, 0], [0, 0, 0], [0, 0, 10], [0, 0, 10], 70), (t) => ({ beta: 0.999999, rear: true, blackout: 0.92, dot: 0 }));
  add('x5', 62.9, 63.9, 'flight', mv([-1.6, 1.4, 1.8], [-1.5, 1.35, 1.6], [0, 0.3, -0.3], [0, 0.3, -0.3], 40), (t) => ({ speed: 1, ahead: 0.6, aheadBlue: 0.6, look: 'back', wide: 0.6, dim: 0.25, watch: '18:58:25' }));
  add('x5b', 63.9, sc.hydrogen.start, 'flight', mv([0.45, 2.5, -1.6], [0.44, 2.48, -1.6], [0, 0.2, -1.0], [0, 0.2, -1.0], 36), (t) => ({ speed: 1, ahead: 0.6, aheadBlue: 0.6, eyes: t > m.night - 0.1 ? 'closed' : 'open', dim: 0.45, neckX: 0.3, watch: '18:58:25' }));
  // ---------------- hydrogen ----------------
  add('y1', sc.hydrogen.start, 66.9, 'studio', mv([0.6, 2.8, 7.6], [0.5, 2.75, 7.3], [0, 2.6, 0], [0, 2.6, 0], 46), (t) => ({ prop: 'atom' }));
  add('y2', 66.9, 68.4, 'flight', mv([0.9, 2.5, -2.3], [0.85, 2.45, -2.25], [0, 0.25, -0.8], [0, 0.25, -0.8], 40), (t) => ({ speed: 1, ahead: 0.8, aheadBlue: 0.7, sparks: 1, wide: 0.8, open: 0.4, xray: 0.4, neckX: 0.3, watch: '18:58:25' }));
  add('y3', 68.4, 70.3, 'studio', mv([0.2, 2.6, 12.2], [0.15, 2.55, 11.8], [0, 2.3, 0], [0, 2.3, 0], 46), (t) => ({ prop: 'collider', k: prog(t, 68.6, m.collider + 0.15) }));
  add('y4', 70.3, 72.3, 'studio', mv([0.7, 2.7, 10.6], [0.65, 2.65, 10.2], [0.5, 2.5, 0], [0.5, 2.5, 0], 46), (t) => ({ prop: 'dose', k: prog(t, 70.4, m.lethal + 0.5) }));
  add('y5', 72.3, 73.3, 'flight', mv([0.6, 2.4, -1.1], [0.58, 2.38, -1.1], [0, 0.25, -0.5], [0, 0.25, -0.5], 40), (t) => ({ speed: 1, ahead: 0.7, aheadBlue: 0.6, tingle: 1, sparks: 0.4, wide: 0.4, open: 0.15, neckX: 0.3, watch: '18:58:25' }));
  add('y6', 73.3, sc.uturn.start, 'studio', mv([2.8, 1.7, 4.2], [2.75, 1.65, 4.0], [2.3, 1.3, 0.4], [2.3, 1.3, 0.4], 36), (t) => ({ prop: 'dose', k: 1, tingle: true }));
  // ---------------- u-turn ----------------
  add('u1', sc.uturn.start, 75.0, 'planet', mv([30, 24, 62], [29, 23, 60], [2, 2, 14], [2, 2, 14], 46), (t) => ({ which: 'pluto', mode: 'uturn', k: lerp(0.05, 0.36, prog(t, sc.uturn.start, 75.0)), daveScale: 1.6, label: 'PLUTO', sub: '5.3 BILLION KM FROM EARTH', labelPos: [-14, 15, 0], labelScale: 0.9, sunX: 1 }));
  add('u1b', 75.0, 76.2, 'planet', mv([2, 26, 48], [1, 25, 46], [0, 1, 8], [0, 1, 8], 46), (t) => ({ which: 'pluto', mode: 'uturn', k: lerp(0.36, 0.72, prog(t, 75.0, 76.2)), daveScale: 1.6, skid: prog(t, m.turns, m.turns + 0.5), sunX: 1 }));
  add('u2', 76.2, 77.4, 'system', mv([44, 26, 30], [45, 25, 29], [44, 0, -3], [44, 0, -3], 46), (t) => ({ k: 1, stamps: false, uturn: true, noScale: false }));
  add('u3', 77.4, sc.end.start, 'flight', mv([0.55, 0.95, -1.5], [0.54, 0.94, -1.48], [0.24, 0.36, -0.73], [0.24, 0.36, -0.73], 24), (t) => ({ speed: 1, ahead: 0.7, aheadBlue: 0.5, look: 'watch', watch: '18:58:51', wide: 0.3 }));
  // ---------------- end ----------------
  add('z1', sc.end.start, 79.6, 'street', mv([9, 1.9, -2.4], [9.5, 1.85, -2.6], [14, 1.3, -6.5], [14.5, 1.3, -6.5], 46), (t) => ({ mode: 'dawn', dave: 'arrive', arriveK: prog(t, sc.end.start, 79.5), streak: prog(t, sc.end.start, 79.3) < 1 ? 0.8 : 0, streakX: lerp(-40, 10, prog(t, sc.end.start, 79.4)), streakDir: 1, skidK: prog(t, 79.3, 79.6) }));
  add('z1b', 79.6, 80.6, 'street', mv([17.0, 1.6, -3.8], [16.9, 1.58, -3.9], [15.6, 1.2, -6.3], [15.6, 1.2, -6.3], 40), (t) => ({ mode: 'dawn', dave: 'skid', arriveK: prog(t, 79.6, 80.1), skidK: prog(t, 79.6, 80.6), watch: '18:58:51', wide: 0.3 }));
  add('z2', 80.6, 81.9, 'rest', mv([2.0, 1.6, 1.6], [1.9, 1.55, 1.5], [3.9, 1.2, -0.5], [3.9, 1.2, -0.5], 40), (t) => ({ mode: 'dawn', clock: 4.73, priya: 'sleep', parents: 'sleep', waiter: 'stand', dave: 'door', watch: '18:58:51', daveWide: 0.2 }));
  add('z3', 81.9, 83.3, 'rest', mv([0.1, 2.1, 0.3], [0.08, 2.1, 0.15], [0.3, 2.25, -2.92], [0.3, 2.25, -2.92], 56), (t) => ({ mode: 'dawn', clock: 4.733, priya: 'sleep', parents: 'sleep', waiter: 'none', dave: 'door' }));
  add('z4', 83.3, 84.9, 'rest', mv([-0.3, 1.45, 1.5], [-0.35, 1.42, 1.4], [-0.5, 1.05, -0.72], [-0.5, 1.05, -0.72], 38), (t) => ({ mode: 'dawn', clock: 4.735, priya: 'up', upK: prog(t, m.waited - 0.3, m.waited + 0.5), parents: 'sleep', waiter: 'none', dave: 'walk', daveK: prog(t, 83.3, 84.9), priyaWide: 0.3 }));
  add('z5', 84.9, 86.3, 'rest', mv([3.9, 1.75, 0.5], [3.8, 1.7, 0.4], [2.9, 1.25, -1.9], [2.9, 1.25, -1.9], 40), (t) => ({ mode: 'dawn', clock: 4.736, priya: 'look', parents: 'look', waiter: 'flip', flipK: prog(t, 85.0, 85.8), croissants: true, dave: 'walk', daveK: 1 }));
  add('z6', 86.3, 87.9, 'rest', mv([1.3, 2.2, 3.8], [1.2, 2.15, 3.6], [0.6, 0.9, -0.2], [0.6, 0.9, -0.2], 48), (t) => ({ mode: 'dawn', clock: 4.74, priya: 'pat', parents: 'look', parentsSmile: true, waiter: 'croissant', croissants: true, dave: 'place', daveK: prog(t, 86.4, 87.2), priyaSmile: true }));
  add('z7', 87.9, 89.0, 'rest', mv([1.35, 1.3, 1.05], [1.3, 1.25, 1.0], [0.95, 0.85, 0], [0.95, 0.85, 0], 34), (t) => ({ mode: 'dawn', clock: 4.74, priya: 'pat', parents: 'look', waiter: 'none', dave: 'place', daveK: 1, croissants: true, priyaSmile: true }));
  add('z8', 89.0, sc.endcard.start, 'rest', mv([0.15, 1.45, 0.2], [0.2, 1.42, 0.2], [1.35, 1.3, 0], [1.35, 1.3, 0], 34), (t) => ({ mode: 'dawn', clock: 4.74, priya: 'look', parents: 'look', waiter: 'none', dave: 'sit', croissants: true, daveWide: 0.3 }));
  add('endcard', sc.endcard.start, sc.endcard.end, 'black', () => ({ pos: V3(0, 0, 5), look: V3(0, 0, 0) }), () => ({}));
  return { shots };
}
