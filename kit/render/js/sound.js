import * as THREE from 'three';
import { mat, box, cyl, ico, cone, plane, rng, lerp, clamp, smooth, easeOut, easeIn, prog, emis, canvasTex, texMat, bakeStatic, softSprite, glowSprite, asphaltTex, grassTex, windowTex, checkerTex } from './util.js';
import { M, Person, makeCar, makeTree, makeBuilding, makeLamp, makePigeon, flapPigeon, makeBench } from './kit.js';
import { baseSet, buildSpace } from './sets.js';
import { makeDave, makePriya } from './water.js';
import { buildCity } from './world.js';

export const GOLD = 0xf2c85b;
// ---------- helpers ----------
function lblTex(text, w = 512, h = 128, fg = '#ffffff', bg = null, font = 'bold 64px sans-serif') { return canvasTex(w, h, (ctx, W, H) => { if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); } ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, W / 2, H / 2); }); }
export function lbl(text, w, h, o = {}) { const t = lblTex(text, o.pw || 512, o.ph || 128, o.fg, o.bg, o.font); t.magFilter = THREE.LinearFilter; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !o.bg, side: THREE.DoubleSide })); return m; }
export function dynLbl(w, h, o = {}) { const c = document.createElement('canvas'); c.width = o.pw || 512; c.height = o.ph || 128; const ctx = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.LinearFilter; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !o.bg, side: THREE.DoubleSide })); m.userData.last = null; m.userData.set = (text) => { if (text === m.userData.last) return; m.userData.last = text; ctx.clearRect(0, 0, c.width, c.height); if (o.bg) { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, c.width, c.height); } ctx.fillStyle = o.fg || '#fff'; ctx.font = o.font || 'bold 64px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, c.width / 2, c.height / 2); t.needsUpdate = true; }; m.userData.set(o.text || ''); return m; }
const whitesOf = (p) => p.neck.children.filter(m => m.isMesh && m.material && m.material.color && m.material.color.getHex() === 0xf8f6f2 && m.geometry.type === 'IcosahedronGeometry');
export function face(p, c = {}) { const W = p._whites || (p._whites = whitesOf(p)); const w = c.wide ?? 0; const bl = c.blink ?? 0; W.forEach(x => x.scale.set(1 + 0.5 * w, Math.max(0.05, (1 + 0.5 * w) * (1 - bl)), 0.55)); p.eyes.forEach(e => e.scale.set(1, Math.max(0.05, 1 - bl), 0.5)); p.mouth.scale.set(1 + 0.5 * (c.open ?? 0), 1 + 3 * (c.open ?? 0) + (c.smile ? 0.3 : 0), 1); }
const ADD = (color, op) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
// Mach cone: apex at origin, opening toward -x (object moves along +x). half = half-angle (rad).
export function makeMach(len, half, color = 0xffffff, op = 0.22) { const g = new THREE.Group(); const r = Math.tan(half) * len; const m = new THREE.Mesh(new THREE.ConeGeometry(r, len, 28, 1, true), ADD(color, op)); m.rotation.z = -Math.PI / 2; m.position.x = -len / 2; g.add(m); const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012 + r * 0.02, 6, 48), ADD(color, op * 2.2)); rim.rotation.y = Math.PI / 2; rim.position.x = -len; g.add(rim); g.userData.m = m; return g; }
// flat ring (on the ground or vertical): torus of radius 1, scaled per frame
export function makeRing(color = GOLD, op = 0.8, tube = 0.02) { const m = new THREE.Mesh(new THREE.TorusGeometry(1, tube, 6, 64), ADD(color, op)); m.rotation.x = Math.PI / 2; m.visible = false; return m; }
// boom rings from events [{x,z,t0}] (ground, expanding at v m/s over life s)
export function updateRings(rings, events, t, o = {}) { const v = o.v ?? 6, life = o.life ?? 0.9, y = o.y ?? 0.03, op = o.op ?? 0.85; rings.forEach((r, i) => { const e = events[i]; if (!e || t < e.t0 || t > e.t0 + life) { r.visible = false; return; } const age = t - e.t0; const R = Math.max(0.05, (e.r0 ?? 0.2) + v * age); r.visible = true; r.position.set(e.x, e.y ?? y, e.z); r.scale.set(R, R, 1); r.material.opacity = op * (1 - age / life); }); }
// sine-wave ribbon (a whisper in flight): plane in the XY plane from x=0 to x=len (scaled), gold
function waveTex() { const t = canvasTex(1024, 128, (ctx, W, H) => { ctx.clearRect(0, 0, W, H); ctx.strokeStyle = '#ffd98a'; ctx.lineWidth = 7; ctx.shadowColor = '#f2c85b'; ctx.shadowBlur = 10; ctx.beginPath(); for (let x = 0; x <= W; x += 2) { const y = H / 2 + Math.sin(x / W * Math.PI * 2 * 16) * H * 0.34 * (0.6 + 0.4 * Math.sin(x / W * Math.PI * 2 * 3)); if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }); t.magFilter = THREE.LinearFilter; t.wrapS = THREE.RepeatWrapping; return t; }
export function makeWave(h = 0.5) { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.PlaneGeometry(1, h), new THREE.MeshBasicMaterial({ map: waveTex(), transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); m.position.x = 0.5; g.add(m); const head = new THREE.Mesh(new THREE.TorusGeometry(h * 0.55, 0.02, 6, 40), ADD(GOLD, 0.9)); head.rotation.y = Math.PI / 2; head.position.x = 1; g.add(head); const glow = glowSprite(0xffe0a0, h * 2.2, 0.8); glow.position.x = 1; g.add(glow); g.userData = { m, head, glow, h }; g.userData.setLen = (L) => { L = Math.max(0.02, L); m.scale.x = L; m.position.x = L / 2; m.material.map.repeat.x = L / 1.6; head.position.x = L; glow.position.x = L; }; g.userData.setLen(1); return g; }
// slow concentric rings from a point source: v m/s, period T, n rings
export function makeSlowRings(n = 4, color = GOLD, vertical = false) { const g = new THREE.Group(); const rs = []; for (let i = 0; i < n; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 64), ADD(color, 0.7)); if (!vertical) r.rotation.x = Math.PI / 2; g.add(r); rs.push(r); } g.userData.rs = rs; return g; }
export function updateSlowRings(g, since, o = {}) { const v = o.v ?? 1.4, T = o.T ?? 1.0, maxR = o.maxR ?? 3.5; g.visible = since >= 0; if (!g.visible) return; g.userData.rs.forEach((r, i) => { const age = since - i * T; if (age < 0) { r.visible = false; return; } const R = v * age; r.visible = R < maxR && R > 0.02; r.scale.set(Math.max(0.02, R), Math.max(0.02, R), 1); r.material.opacity = 0.7 * (1 - R / maxR); }); }

// ---------- dog ----------
export function makeDog(o = {}) {
  const c = M(o.color ?? 0xc8a26b), dark = M(o.dark ?? 0x3a2a1a); const g = new THREE.Group(); const s = o.size ?? 1;
  const body = box(0.62, 0.3, 0.26, c, 0, 0.42, 0); g.add(body);
  const head = new THREE.Group(); head.position.set(0.34, 0.62, 0); g.add(head);
  head.add(ico(0.15, c, 1, 0, 0, 0)); head.add(box(0.14, 0.1, 0.12, c, 0.14, -0.04, 0)); head.add(ico(0.035, dark, 0, 0.215, -0.03, 0));
  const ears = []; for (const sz of [-1, 1]) { const e = new THREE.Group(); e.position.set(-0.03, 0.1, sz * 0.11); e.add(box(0.08, 0.2, 0.04, dark, 0, -0.08, 0)); head.add(e); ears.push({ e, sz }); }
  const white = M(0xf8f6f2), pupil = M(0x1b1410); const brows = []; const eyes = [];
  for (const sz of [-1, 1]) { const w = ico(0.03, white, 1, 0.1, 0.03, sz * 0.07); head.add(w); const p = ico(0.016, pupil, 1, 0.125, 0.03, sz * 0.07); head.add(p); eyes.push({ w, p }); const b = box(0.02, 0.012, 0.06, dark, 0.11, 0.085, sz * 0.07); head.add(b); brows.push({ b, sz }); }
  const legs = []; for (const sx of [-0.22, 0.22]) for (const sz of [-0.09, 0.09]) { const l = box(0.08, 0.3, 0.08, c, sx, 0.15, sz); g.add(l); legs.push(l); }
  const tail = new THREE.Group(); tail.position.set(-0.31, 0.5, 0); const tb = box(0.25, 0.05, 0.05, c, -0.12, 0.06, 0); tb.rotation.z = -0.5; tail.add(tb); g.add(tail);
  g.scale.setScalar(s); g.userData = { head, ears, brows, eyes, tail, body, legs };
  return g;
}
// c: alert 0..1 (ears up, head up), turn (rad, head yaw), tilt (rad, head roll), flat (bool: unimpressed brows), wag (bool), lie (bool), nod
export function dogPose(d, t, c = {}) {
  const u = d.userData; const a = c.alert ?? 0;
  u.ears.forEach(({ e, sz }) => { e.rotation.x = sz * lerp(0.95, 0.12, a); e.rotation.z = lerp(0.25, -0.15, a) * (c.flat ? 1.6 : 1); });
  u.head.rotation.set(c.tilt ?? 0, c.turn ?? 0, lerp(-0.05, 0.3, a) + (c.nod ?? 0) - (c.flat ? 0.25 : 0));
  u.brows.forEach(({ b, sz }) => { b.rotation.x = c.flat ? 0 : sz * -0.35; b.position.y = c.flat ? 0.075 : 0.085 + (c.raise ?? 0) * 0.02; b.scale.z = c.flat ? 1.6 : 1; });
  u.eyes.forEach(({ w, p }) => { const s = c.flat ? 0.55 : 1; w.scale.set(1, s, 1); p.scale.set(1, s, 1); });
  u.tail.rotation.y = Math.sin(t * (c.wag ? 18 : 2.5)) * (c.wag ? 0.6 : 0.08);
  const lie = c.lie ? 1 : 0; u.body.position.y = lerp(0.42, 0.27, lie); u.legs.forEach((l, i) => { l.scale.y = lerp(1, 0.35, lie); l.position.y = lerp(0.15, 0.06, lie); l.position.x = (i < 2 ? -0.22 : 0.22) + (lie && i >= 2 ? 0.14 : 0); }); u.head.position.y = lerp(0.62, 0.5, lie); u.tail.position.y = lerp(0.5, 0.35, lie);
}

function bookRow(ST, x0, y, z, w, seed) { const r = rng(seed); const cols = [0xb84a3a, 0x3b6fb6, 0x3f7a3a, 0xe0a526, 0x6b3fa0, 0x2f3b4e, 0xd9534f, 0xf4efe4, 0x8a5a3a, 0x3aa5a0]; let x = x0; while (x < x0 + w - 0.03) { const bw = r.range(0.035, 0.07), bh = r.range(0.2, 0.3); ST.add(box(bw, bh, 0.22, M(r.pick(cols)), x + bw / 2, y + bh / 2, z)); x += bw + 0.004; } }

// ======================= LIBRARY =======================
// ctx: dave ('stand'|'whisper'|'walk'|'thumbs'|'startled'|'shoes'|'none'), daveX, priya ('read'|'look'|'shrug'|'read2'), dog {alert,flat,turn,...}
//      whisperK (0..1 of 7 m; <0 hidden), walker (walkerX,walkerCone), footBooms [{x,z,t0}], slowSince (clock rings), coughSince, shush (0..1), shushBoom (0..1), pages (0..1), books (0..1), lib ('idle'|'point'|'shush'), flash, envelope
export function buildLibrary() {
  const S = baseSet({ shadowExtent: 12, fogNear: 80, fogFar: 300, shadowRes: 2048 }); const { scene } = S; const ST = new THREE.Group(); scene.add(ST);
  S.sunOffset = new THREE.Vector3(4, 10, 7); S.sun.intensity = 1.3; S.hemi.intensity = 1.0; scene.add(new THREE.AmbientLight(0xfff0dc, 0.42));
  for (const x of [-5, 0, 5]) { const w = new THREE.PointLight(0xffe2b8, 0.9, 14, 1.6); w.position.set(x, 3.5, 0.5); scene.add(w); }
  const woodT = canvasTex(256, 256, (ctx, W, H) => { ctx.fillStyle = '#9a6a44'; ctx.fillRect(0, 0, W, H); const r = rng(5); for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#8a5a38' : '#a8764e'; ctx.fillRect(0, i * 32, W, 30); } ctx.fillStyle = 'rgba(0,0,0,0.22)'; for (let i = 0; i < 70; i++) ctx.fillRect(r.f() * W, r.f() * H, 2 + r.f() * 36, 1); }); woodT.repeat.set(8, 6);
  const floor = plane(24, 16, texMat({ map: woodT }), 0, 0, 1); floor.receiveShadow = true; scene.add(floor);
  const rug = plane(10, 2.6, texMat({ map: checkerTex('#7a3b3b', '#9a5050', 10) }), 0, 0.005, 0); scene.add(rug);
  const wallM = M(0xe6dcc6); ST.add(box(24, 4.1, 0.14, wallM, 0, 2.05, -6.0)); ST.add(box(0.14, 4.1, 16, wallM, -12, 2.05, 1)); ST.add(box(0.14, 4.1, 16, wallM, 12, 2.05, 1));
  const ceil = plane(24, 16, M(0xf6f1e6), 0, 4.1, 1, Math.PI / 2); scene.add(ceil);
  for (const x of [-7, -2.5, 2, 6.5]) for (const z of [-3, 0.5, 4]) { const sk = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), new THREE.MeshBasicMaterial({ color: 0xe6ddc8 })); sk.rotation.x = Math.PI / 2; sk.position.set(x, 4.08, z); scene.add(sk); }
  // tall windows on the end walls (bright planes + frames)
  for (const sx of [-1, 1]) for (const z of [-3.2, 0, 3.2]) { if (sx > 0 && z < -1) continue; const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.6), new THREE.MeshBasicMaterial({ color: 0xaac4e0 })); w.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2; w.position.set(sx * 11.9, 2.2, z); scene.add(w); const fr = M(0x5a3a22); ST.add(box(0.08, 2.7, 0.1, fr, sx * 11.88, 2.2, z - 0.8)); ST.add(box(0.08, 2.7, 0.1, fr, sx * 11.88, 2.2, z + 0.8)); ST.add(box(0.08, 0.1, 1.7, fr, sx * 11.88, 3.55, z)); ST.add(box(0.08, 0.1, 1.7, fr, sx * 11.88, 0.85, z)); ST.add(box(0.08, 2.6, 0.06, fr, sx * 11.88, 2.2, z)); }
  // shelves along the back wall (z = -5.8), full of books
  const shelfM = M(0x5a3a22); for (let i = 0; i < 11; i++) { const x = -11 + i * 2.1 + 0.2; if (i === 5) continue; ST.add(box(2.0, 3.3, 0.3, M(0x6b4a2b), x + 1.0, 1.65, -5.75)); for (let k = 0; k < 6; k++) { const y = 0.25 + k * 0.52; ST.add(box(1.96, 0.04, 0.3, shelfM, x + 1.0, y, -5.75)); bookRow(ST, x + 0.05, y + 0.02, -5.72, 1.9, 100 + i * 7 + k); } }
  // wall clock on the back wall gap
  const clock = new THREE.Group(); clock.add(cyl(0.36, 0.36, 0.05, M(0x2b2d33), 24, 0, 0, 0)); clock.children[0].rotation.x = Math.PI / 2; const cf = new THREE.Mesh(new THREE.CircleGeometry(0.32, 24), M(0xd8d2c4)); cf.position.z = 0.03; clock.add(cf); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; clock.add(box(0.03, 0.06, 0.01, M(0x2b2d33), Math.sin(a) * 0.27, Math.cos(a) * 0.27, 0.04)); } const hH = box(0.03, 0.18, 0.01, M(0x2b2d33), 0, 0.08, 0.05); hH.rotation.z = -0.9; clock.add(hH); const hM = box(0.02, 0.26, 0.01, M(0x2b2d33), 0, 0.12, 0.05); hM.rotation.z = 2.4; clock.add(hM); clock.position.set(0.7, 3.0, -5.9); scene.add(clock);
  const sign = lbl('QUIET PLEASE', 1.6, 0.36, { bg: '#2b2d33', fg: '#f4efe4', font: 'bold 72px sans-serif', pw: 1024, ph: 230 }); sign.position.set(0.7, 2.2, -5.9); scene.add(sign);
  const sign2 = lbl('READING ROOM', 1.4, 0.3, { bg: '#b84a3a', fg: '#f4efe4', font: 'bold 72px sans-serif', pw: 1024, ph: 220 }); sign2.position.set(-8.9, 3.6, -5.9); scene.add(sign2);
  // long reading table 8 m (x -4..4), banker lamps, book stacks
  ST.add(box(8.6, 0.08, 1.3, M(0x7a4e30), 0, 0.76, 0)); ST.add(box(8.4, 0.05, 1.1, M(0x8a5a3a), 0, 0.79, 0)); for (const x of [-4.0, -1.35, 1.35, 4.0]) for (const z of [-0.55, 0.55]) ST.add(box(0.1, 0.74, 0.1, M(0x4a3222), x, 0.37, z));
  for (const x of [-2.6, 0, 2.6]) { const g = new THREE.Group(); g.add(cyl(0.12, 0.14, 0.03, M(0xb8922a), 12, 0, 0.015, 0)); g.add(cyl(0.015, 0.015, 0.32, M(0xb8922a), 8, 0, 0.17, 0)); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.26, 0.12, 12, 1, true), new THREE.MeshLambertMaterial({ color: 0x2f7a4a, side: THREE.DoubleSide })); sh.position.y = 0.36; g.add(sh); const bulb = glowSprite(0xffe9b0, 0.5, 0.7); bulb.position.y = 0.33; g.add(bulb); g.position.set(x, 0.815, -0.1); scene.add(g); }
  const stacks = []; [[-3.2, 0.3], [-0.8, -0.35], [1.6, 0.35], [3.3, -0.3]].forEach(([x, z], i) => { const r = rng(300 + i); let y = 0.815; for (let k = 0; k < 3; k++) { const h = r.range(0.04, 0.07); const b = box(r.range(0.26, 0.34), h, r.range(0.2, 0.26), M(r.pick([0xb84a3a, 0x3b6fb6, 0x3f7a3a, 0xe0a526, 0x2f3b4e, 0xf4efe4])), x + r.range(-0.03, 0.03), y + h / 2, z); b.rotation.y = r.range(-0.2, 0.2); b.userData.p0 = b.position.clone(); scene.add(b); stacks.push(b); y += h; } });
  // chairs along both sides
  const chair = (x, z, ry) => { const g = new THREE.Group(); g.add(box(0.46, 0.05, 0.46, M(0x4a3222), 0, 0.46, 0)); g.add(box(0.46, 0.5, 0.05, M(0x4a3222), 0, 0.74, -0.21)); for (const sx of [-0.2, 0.2]) for (const sz of [-0.2, 0.2]) g.add(box(0.04, 0.46, 0.04, M(0x4a3222), sx, 0.23, sz)); g.position.set(x, 0, z); g.rotation.y = ry; ST.add(g); return g; };
  for (const x of [-3.0, -1.6, -0.2, 1.2, 2.6]) { chair(x, -1.15, 0); chair(x, 1.45, Math.PI); } chair(4.75, 0, -Math.PI / 2);
  // librarian desk (left), with lamp + sign
  ST.add(box(2.4, 1.0, 0.9, M(0x6b4a2b), -8.5, 0.5, -3.2)); ST.add(box(2.6, 0.06, 1.0, M(0x8a5a3a), -8.5, 1.03, -3.2)); const dsign = lbl('SHH', 0.5, 0.26, { bg: '#f4efe4', fg: '#2b2d33', font: 'bold 90px sans-serif' }); dsign.position.set(-8.0, 1.2, -2.78); scene.add(dsign); ST.add(box(0.5, 0.3, 0.05, M(0x6b4a2b), -8.0, 1.19, -2.8));
  // side shelves + trolley + plants (right side, z>0 background for shots looking +z)
  for (let i = 0; i < 4; i++) { const z = 5.6; const x = 2 + i * 2.1; ST.add(box(2.0, 3.0, 0.3, M(0x6b4a2b), x + 1.0, 1.5, z)); for (let k = 0; k < 5; k++) { const y = 0.3 + k * 0.55; ST.add(box(1.96, 0.04, 0.3, shelfM, x + 1.0, y, z)); bookRow(ST, x + 0.05, y + 0.02, z - 0.03, 1.9, 500 + i * 5 + k); } }
  const trolley = new THREE.Group(); trolley.add(box(0.8, 0.06, 0.45, M(0x8a8a8a), 0, 0.4, 0)); trolley.add(box(0.8, 0.06, 0.45, M(0x8a8a8a), 0, 0.8, 0)); for (const sx of [-0.35, 0.35]) for (const sz of [-0.18, 0.18]) { trolley.add(box(0.04, 0.85, 0.04, M(0x8a8a8a), sx, 0.43, sz)); const w = cyl(0.06, 0.06, 0.04, M(0x222), 8, sx, 0.06, sz); w.rotation.x = Math.PI / 2; trolley.add(w); } bookRow(trolley, -0.36, 0.83, 0, 0.7, 77); trolley.position.set(7.5, 0, 3.5); ST.add(trolley);
  for (const [x, z] of [[-10.5, 4.5], [10.8, -4.6]]) { ST.add(cyl(0.25, 0.2, 0.5, M(0xb84a3a), 10, x, 0.25, z)); for (let k = 0; k < 7; k++) { const lf = ico(0.22, M(0x3f7a3a), 0, x + Math.sin(k * 2.1) * 0.3, 0.75 + (k % 3) * 0.2, z + Math.cos(k * 2.1) * 0.3); lf.scale.set(1, 1.6, 0.4); lf.rotation.z = k; ST.add(lf); } }
  bakeStatic(ST, scene);
  // ---- actors ----
  const dave = makeDave(); scene.add(dave.g); const priya = makePriya(); scene.add(priya.g);
  const lib = new Person({ seed: 41, skin: 0xffdbb4, shirt: 0x6b3fa0, pants: 0x2f3b4e, hair: 0x7a7a7a, hairStyle: 'bun', dress: true, scale: 0.98 }); scene.add(lib.g);
  const glasses = new THREE.Group(); for (const sx of [-1, 1]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.006, 6, 16), M(0x2b2d33)); rim.position.set(sx * 0.062, 0.215, 0.165); glasses.add(rim); } glasses.add(box(0.03, 0.006, 0.006, M(0x2b2d33), 0, 0.215, 0.165)); lib.neck.add(glasses);
  const readers = [new Person({ seed: 51, shirt: 0x4a7fb5, hair: 0x2b1d14 }), new Person({ seed: 52, shirt: 0x6fa36b, hair: 0xd9b36b, hairStyle: 'long' }), new Person({ seed: 53, shirt: 0x3aa5a0, hair: 0x111111 }), new Person({ seed: 54, shirt: 0xe88c6a, hair: 0x8b5a2b, hairStyle: 'long', dress: true })];
  readers.forEach(p => scene.add(p.g));
  const seat = (p, x, z, ry) => { p.g.position.set(x, 0.02, z); p.g.rotation.y = ry; p.pose('sit'); p.armL.rotation.x = -1.3; p.armR.rotation.x = -1.3; };
  const dog = makeDog({ color: 0xc8a26b }); dog.position.set(3.0, 0, 0.3); dog.rotation.y = -1.2; scene.add(dog);
  // Priya's seating plan (paper) and pen; Dave's envelope
  const planP = lbl('SEATING PLAN', 0.42, 0.3, { bg: '#f7f3ea', fg: '#2b2d33', font: 'bold 56px sans-serif', pw: 512, ph: 360 }); planP.rotation.x = -Math.PI / 2; planP.rotation.z = Math.PI / 2; planP.position.set(3.95, 0.825, 0.0); scene.add(planP);
  const env = lbl('WEDDING · TOP SECRET', 0.3, 0.2, { bg: '#e8c38a', fg: '#b84a3a', font: 'bold 60px sans-serif', pw: 1024, ph: 680 }); scene.add(env);
  // sound visuals
  const whisper = makeWave(0.5); scene.add(whisper); whisper.position.set(-4.25, 1.52, 0.0);
  const clockRings = makeSlowRings(5, GOLD, true); clockRings.position.set(0.7, 3.0, -5.7); scene.add(clockRings);
  const coughRings = makeSlowRings(4, 0x9fd0ff, false); coughRings.position.set(-1.6, 1.3, -1.1); scene.add(coughRings);
  const lampRings = makeSlowRings(3, 0x9fd0ff, true); lampRings.position.set(-8.3, 1.3, -3.0); scene.add(lampRings);
  const footCone = makeMach(1.4, 0.34, 0xffffff, 0.3); scene.add(footCone); footCone.visible = false;
  const shushCone = makeMach(3.2, 0.09, 0xcfe8ff, 0.55); scene.add(shushCone); shushCone.visible = false; for (let i = 1; i <= 4; i++) { const rr = new THREE.Mesh(new THREE.TorusGeometry(0.09 * i * 0.8, 0.012, 6, 32), ADD(0xffffff, 0.8)); rr.rotation.y = Math.PI / 2; rr.position.x = -0.8 * i; shushCone.add(rr); } const shushGlow = glowSprite(0xdfefff, 0.5, 0.9); shushCone.add(shushGlow);
  const booms = []; for (let i = 0; i < 10; i++) { const r = makeRing(0xffffff, 0.85, 0.02); scene.add(r); booms.push(r); }
  const shushRing = makeRing(0xffffff, 0.9, 0.03); scene.add(shushRing);
  const bigRings = []; for (let i = 0; i < 6; i++) { const r = makeRing(GOLD, 0.6, 0.015); scene.add(r); bigRings.push(r); }
  const pages = []; const pr = rng(9); for (let i = 0; i < 14; i++) { const p = plane(0.21, 0.3, M(0xf7f3ea), 0, 0, 0); p.userData = { x: pr.range(-4, 4), z: pr.range(-0.5, 0.5), ph: pr.f() * 6, dx: pr.range(-1.5, 1.5), dz: pr.range(-1.2, 1.2) }; p.visible = false; scene.add(p); pages.push(p); }
  const hatM = M(0x2b2d33);
  S.actors = { dave, priya, lib, readers, dog, whisper };
  S.update = (t, c) => {
    S.setSky(0);
    // Dave
    const dv = c.dave ?? 'stand'; dave.g.visible = dv !== 'none'; const dx = c.daveX ?? -4.75;
    dave.g.position.set(dx, 0, c.daveZ ?? 0); dave.g.rotation.y = c.daveRot ?? Math.PI / 2;
    if (dv === 'walk') { dave.pose('walk', (c.walkT ?? t) * 1.1); dave.armR.rotation.x = -1.2; dave.armR.rotation.z = -0.45; dave.neck.rotation.y = c.neckY ?? 0.5; }
    else if (dv === 'whisper') { dave.pose('stand', t); dave.armR.rotation.set(-1.98, 0, -0.69); dave.armL.rotation.x = -0.3; dave.torso.rotation.x = 0.12 + (c.lean ?? 0); dave.neck.rotation.x = 0.1; dave.neck.rotation.y = c.neckY ?? 0; }
    else if (dv === 'thumbs') { dave.pose('stand', t); dave.armR.rotation.x = -1.6; dave.armR.rotation.z = -0.5; dave.neck.rotation.x = -0.05; }
    else if (dv === 'startled') { dave.pose('stand', t); dave.armL.rotation.x = -1.4; dave.armR.rotation.x = -1.4; dave.armL.rotation.z = 0.6; dave.armR.rotation.z = -0.6; dave.torso.rotation.x = -0.15; dave.neck.rotation.x = -0.2; }
    else if (dv === 'shoes') { dave.pose('stand', t); dave.neck.rotation.x = 0.75; dave.torso.rotation.x = 0.2; }
    else if (dv === 'lips') { dave.pose('stand', t); dave.armR.rotation.set(-1.95, 0, -0.78); dave.neck.rotation.y = c.neckY ?? 0.25; }
    else { dave.pose('stand', t); dave.neck.rotation.y = c.neckY ?? 0; }
    face(dave, { wide: c.daveWide ?? 0, open: c.daveOpen ?? 0, blink: c.daveBlink ?? 0, smile: c.daveSmile });
    env.visible = !!c.envelope; if (c.envelope) { env.position.set(dx + 0.25, 1.05, 0.22); env.rotation.set(-0.3, Math.PI / 2 + 0.3, 0); }
    // Priya at the far end, facing -x
    const pv = c.priya ?? 'read'; seat(priya, 4.75, 0, -Math.PI / 2); priya.armL.rotation.x = -1.4; priya.armR.rotation.x = -1.5; priya.armR.rotation.z = -0.2;
    if (pv === 'read') { priya.neck.rotation.x = 0.35; } if (pv === 'look') { priya.neck.rotation.x = -0.05; priya.neck.rotation.y = c.priyaTurn ?? 0; } if (pv === 'shrug') { priya.armL.rotation.set(-1.0, 0, 0.8); priya.armR.rotation.set(-1.0, 0, -0.8); priya.neck.rotation.z = 0.2; } if (pv === 'ear') { priya.neck.rotation.x = 0.0; priya.neck.rotation.y = 0.45; priya.armR.rotation.set(-2.4, 0, -0.6); }
    face(priya, { wide: c.priyaWide ?? 0, open: c.priyaOpen ?? 0, blink: c.priyaBlink ?? 0, smile: c.priyaSmile });
    // librarian behind the desk
    lib.g.position.set(-8.5, 0, -3.75); lib.g.rotation.y = Math.PI / 4; const lm = c.lib ?? 'idle'; lib.pose('stand', t);
    if (lm === 'point') { lib.armR.rotation.x = -1.9; lib.armR.rotation.z = -0.9; lib.neck.rotation.y = -0.3; }
    if (lm === 'shush') { lib.armR.rotation.set(-1.95, 0, -0.78); lib.torso.rotation.x = 0.2 + 0.2 * (c.shush ?? 0); lib.neck.rotation.x = 0.05; }
    if (lm === 'type') { lib.armL.rotation.x = -1.2; lib.armR.rotation.x = -1.2; lib.neck.rotation.x = 0.3; }
    face(lib, { wide: c.libWide ?? 0, open: c.libOpen ?? 0 });
    // readers
    seat(readers[0], -2.3, -1.15, 0); readers[0].neck.rotation.x = 0.3; seat(readers[1], 0.5, 1.45, Math.PI); readers[1].neck.rotation.x = 0.3; seat(readers[3], -0.9, -1.15, 0); readers[3].neck.rotation.x = 0.25;
    if (c.lookUp) readers.forEach(p => { p.neck.rotation.x = -0.1; p.neck.rotation.y = (c.lookUp === 'dave' ? -0.6 : 0.3); face(p, { wide: 0.6, open: 0.3 }); }); else readers.forEach(p => face(p, {}));
    // the walker (reader 2): either seated or walking along +x behind the table
    const wk = c.walker; if (wk) { readers[2].g.position.set(wk.x, 0, -2.2); readers[2].g.rotation.y = Math.PI / 2; readers[2].pose('walk', t * 1.1); readers[2].neck.rotation.y = wk.look ?? 0; }
    else { seat(readers[2], 2.1, -1.15, 0); readers[2].neck.rotation.x = 0.3; }
    // foot Mach cone attached to the leading foot of a walker (walker or Dave)
    const fc = c.footCone; footCone.visible = !!fc; if (fc) { const p = fc.who === 'dave' ? dave : readers[2]; const leg = Math.sin((fc.who === 'dave' ? (c.walkT ?? t) * 1.1 : t * 1.1) * 6) > 0 ? p.legL : p.legR; const w = new THREE.Vector3(); leg.userData.knee.children[1].getWorldPosition(w); footCone.position.copy(w); footCone.position.x += 0.12; footCone.rotation.y = 0; footCone.scale.setScalar(fc.scale ?? 1); }
    updateRings(booms, c.footBooms || [], t, { v: 5, life: 0.8, y: 0.02 });
    // slow rings (sound at 1.4 m/s) from clock, a cough, the desk lamp switch
    updateSlowRings(clockRings, c.slowSince ?? -1, { v: 1.4, T: 1.0, maxR: 3.2 }); updateSlowRings(coughRings, c.coughSince ?? -1, { v: 1.4, T: 0.6, maxR: 2.4 }); updateSlowRings(lampRings, c.lampSince ?? -1, { v: 1.4, T: 0.8, maxR: 2.0 });
    // the whisper ribbon: from Dave's mouth along the table (x from -4.25), 7 m at k = 1
    const wkk = c.whisperK ?? -1; whisper.visible = wkk >= 0; if (whisper.visible) { whisper.position.set(c.whisperX0 ?? -4.25, 1.5, 0.0); whisper.userData.setLen(Math.max(0.03, wkk * 7)); whisper.userData.glow.material.opacity = 0.5 + 0.3 * Math.sin(t * 20); whisper.userData.m.material.map.offset.x = -t * 1.5; }
    // shush: cone from the librarian's mouth toward +x/+z (into the room), expanding shock ring
    const sh = c.shush ?? 0; shushCone.visible = sh > 0; if (sh > 0) { const mw = new THREE.Vector3(); lib.mouth.getWorldPosition(mw); shushCone.position.copy(mw); shushCone.rotation.y = -Math.PI / 4; shushCone.scale.setScalar(0.3 + 0.7 * sh); }
    const sb = c.shushBoom ?? 0; shushRing.visible = sb > 0; if (sb > 0) { const R = 0.3 + sb * 14; shushRing.position.set(-8.2, 1.2, -3.2); shushRing.scale.set(R, R, 1); shushRing.material.opacity = 0.9 * (1 - sb); }
    // sound comes back: big gold rings expanding fast (snap)
    const bk = c.snapK ?? -1; bigRings.forEach((r, i) => { const k = bk - i * 0.08; r.visible = bk >= 0 && k > 0 && k < 1; if (r.visible) { const R = 0.3 + k * 20; r.position.set(-4.25 + i * 1.4, 1.5, 0); r.rotation.set(0, Math.PI / 2, 0); r.scale.set(R, R, 1); r.material.opacity = 0.7 * (1 - k); } });
    // flying pages & toppled stacks
    const pg = c.pages ?? 0; pages.forEach((p, i) => { p.visible = pg > 0; if (pg > 0) { const u = p.userData; const k = clamp(pg * 1.2 - i * 0.03, 0, 1); p.position.set(u.x + u.dx * k, 0.85 + k * 1.6 + Math.sin(t * 6 + u.ph) * 0.1, u.z + u.dz * k); p.rotation.set(t * 3 + u.ph, t * 2, k * 2); } });
    const bkk = c.books ?? 0; stacks.forEach((b, i) => { const u = b.userData; const k = clamp(bkk * 1.3 - (i % 3) * 0.1, 0, 1); b.position.set(u.p0.x + k * (0.3 + (i % 4) * 0.15) * (i % 2 ? 1 : -1), u.p0.y - k * (u.p0.y - 0.85) * 0.0 + k * 0.1 * Math.sin(i), u.p0.z + k * 0.4 * (i % 3 ? 1 : -1)); b.rotation.set(k * 0.6 * (i % 2 ? 1 : -1), b.rotation.y, k * 1.2); });
    // dog
    dogPose(dog, t, Object.assign({ lie: true }, c.dog || {}));
  };
  return S;
}

// ======================= STREET (library outside) =======================
// ctx: cars [{x, cone}] positions along +x (lane z=5), dave ('walk'|'none'), daveX, peds (bool), booms, hats (0..1), cracks (0..1), flash
export function buildStreetS() {
  const S = baseSet({ shadowExtent: 26, fogNear: 60, fogFar: 320, shadowRes: 2048 }); const { scene } = S; const ST = new THREE.Group(); scene.add(ST); const r = rng(77);
  S.sunOffset = new THREE.Vector3(40, 55, 50); S.sun.intensity = 2.5; S.hemi.intensity = 0.95;
  const aT = asphaltTex(); aT.repeat.set(16, 2); scene.add(plane(90, 10, texMat({ map: aT }), 0, -0.01, 5)); scene.add(plane(90, 5, M(0x9a9a96), 0, 0, -2.5)); scene.add(plane(90, 5, M(0x9a9a96), 0, 0, 12.5)); ST.add(box(90, 0.12, 0.2, M(0xb0b0ac), 0, 0.06, 0.05)); ST.add(box(90, 0.12, 0.2, M(0xb0b0ac), 0, 0.06, 10.0));
  for (let i = -8; i < 9; i++) ST.add(box(2.0, 0.01, 0.15, M(0xe8e8e0), i * 5.5, 0.005, 5));
  // library facade (centre), classical: steps, columns, pediment, sign
  const stone = M(0xd8cfb8); ST.add(box(14, 7.5, 6, stone, -4, 3.75, -8)); ST.add(box(12, 0.5, 2.4, stone, -4, 0.25, -3.8)); ST.add(box(11, 0.4, 1.6, stone, -4, 0.65, -3.9)); for (let i = 0; i < 5; i++) ST.add(cyl(0.38, 0.42, 6.0, M(0xe4dcc8), 12, -8.5 + i * 2.25, 3.9, -4.3)); ST.add(box(13, 0.7, 2.6, stone, -4, 7.2, -5.6)); const ped = new THREE.Mesh(new THREE.ConeGeometry(7.5, 2.6, 4), stone); ped.rotation.y = Math.PI / 4; ped.scale.set(1.25, 1, 0.3); ped.position.set(-4, 8.8, -5.6); ped.castShadow = true; ST.add(ped);
  ST.add(box(2.4, 3.4, 0.3, M(0x4a3222), -4, 2.3, -5.05)); ST.add(box(2.0, 3.0, 0.1, M(0x6b4a2b), -4, 2.1, -4.95)); ST.add(cyl(0.05, 0.05, 0.3, M(0xd8c060), 8, -3.5, 1.5, -4.9));
  const libSign = lbl('PUBLIC LIBRARY', 7.0, 0.8, { fg: '#2b2d33', font: 'bold 90px sans-serif', pw: 1024, ph: 120 }); libSign.position.set(-4, 6.7, -4.26); scene.add(libSign);
  const banner = lbl('QUIET PLEASE', 2.4, 0.5, { bg: '#b84a3a', fg: '#f4efe4', font: 'bold 80px sans-serif', pw: 1024, ph: 220 }); banner.position.set(-8.6, 4.6, -4.25); scene.add(banner);
  // terraced houses either side and across the road
  const bT = canvasTex(128, 128, (ctx, W, H) => { ctx.fillStyle = '#a65a3a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#c9b8a0'; for (let y = 0; y < H; y += 16) { ctx.fillRect(0, y, W, 2); for (let x = (y / 16) % 2 ? 0 : 16; x < W; x += 32) ctx.fillRect(x, y, 2, 16); } });
  const wT = (seed) => texMat({ map: windowTex('#b9b0a2', '#ffe9b0', 2, 3, 0.2, seed) });
  const house = (x, z, w, h, seed, ry = 0) => { const g = new THREE.Group(); const t2 = bT.clone(); t2.needsUpdate = true; t2.repeat.set(w / 2, h / 2); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 7), [texMat({ map: t2 }), texMat({ map: t2 }), M(0x4a4a4a), M(0x444), wT(seed), texMat({ map: t2 })]); m.position.y = h / 2; m.castShadow = true; m.receiveShadow = true; g.add(m); g.add(box(w + 0.2, 0.3, 7.2, M(0x3a3a40), 0, h + 0.15, 0)); const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.75, 2.2, 4), M(0x4a4a50)); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 7 / (w * 1.06)); roof.position.y = h + 1.3; roof.castShadow = true; g.add(roof); g.add(box(1.0, 2.2, 0.2, M([0x2f6fb6, 0xb84a3a, 0x3f7a3a, 0x2b2d33][seed % 4]), -w / 4, 1.1, 3.55)); g.add(cyl(0.3, 0.3, 1.0, M(0x8a5a3a), 6, w / 4, h + 2.2, 1)); g.position.set(x, 0, z); g.rotation.y = ry; ST.add(g); };
  let x = 5; for (let i = 0; i < 6; i++) { const w = 5 + (i % 2); house(x + w / 2, -8.5, w, 6 + (i % 3) * 0.5, 10 + i); x += w; } x = -12; for (let i = 0; i < 6; i++) { const w = 5 + (i % 2); house(x - w / 2, -8.5, w, 6 + (i % 2) * 0.6, 20 + i); x -= w; }
  x = -40; for (let i = 0; i < 15; i++) { const w = 5 + (i % 2); house(x + w / 2, 18.5, w, 6 + (i % 3) * 0.5, 30 + i, Math.PI); x += w; }
  for (const lx of [-16, -1, 14]) { const l = makeLamp(); l.position.set(lx, 0, -0.6); ST.add(l); } for (const lx of [-9, 7, 22]) { const tr = makeTree(60 + lx); tr.position.set(lx, 0, 11.2); ST.add(tr); } for (const lx of [-24, 20]) { const tr = makeTree(80 + lx); tr.position.set(lx, 0, -1.2); ST.add(tr); }
  bakeStatic(ST, scene);
  // actors
  const dave = makeDave(); scene.add(dave.g); const env = lbl('WEDDING · TOP SECRET', 0.3, 0.2, { bg: '#e8c38a', fg: '#b84a3a', font: 'bold 60px sans-serif', pw: 1024, ph: 680 }); scene.add(env);
  const cars = []; const cols = [0xd9534f, 0x3b6fb6, 0xf2f2f2, 0x4e8f5a]; for (let i = 0; i < 4; i++) { const c = makeCar(600 + i, { color: cols[i] }); scene.add(c); const cone = makeMach(14, 0.1, 0xcfe8ff, 0.1); c.add(cone); cone.position.set(2.5, 0.7, 0); cone.visible = false; c.userData.cone = cone; cars.push(c); }
  const peds = []; const pc = [0x4a7fb5, 0xd9534f, 0x6fa36b, 0x9b7bb8, 0xe88c6a, 0x3aa5a0, 0x2f3b4e]; for (let i = 0; i < 7; i++) { const p = new Person({ seed: 800 + i, shirt: pc[i], hairStyle: i % 3 === 1 ? 'long' : 'short', dress: i % 3 === 1 }); p.g.position.set(-20 + i * 6.5 + (i % 2) * 2, 0, i % 2 ? -2.0 : 11.8); p.g.rotation.y = i % 2 ? Math.PI / 2 : -Math.PI / 2; scene.add(p.g); peds.push(p); }
  const hats = []; for (let i = 0; i < 3; i++) { const h = new THREE.Group(); h.add(cyl(0.24, 0.24, 0.03, M(0x2b2d33), 10, 0, 0, 0)); h.add(cyl(0.16, 0.17, 0.16, M(0x2b2d33), 10, 0, 0.09, 0)); h.visible = false; scene.add(h); hats.push(h); }
  const booms = []; for (let i = 0; i < 8; i++) { const rr = makeRing(GOLD, 0.95, 0.035); scene.add(rr); booms.push(rr); }
  const sweep = []; for (let i = 0; i < 4; i++) { const rr = makeRing(0xffffff, 0.5, 0.025); rr.rotation.x = 0; scene.add(rr); sweep.push(rr); }
  const cracks = []; for (let i = 0; i < 5; i++) { const cr = new THREE.Group(); for (let k = 0; k < 4; k++) { const b = box(0.03, 0.5, 0.02, M(0x1b1b1b), Math.sin(k * 2.3) * 0.25, Math.cos(k * 1.7) * 0.3, 0); b.rotation.z = k * 0.9; cr.add(b); } cr.position.set(6 + i * 5.6, 3.6, -5.0); cr.visible = false; scene.add(cr); cracks.push(cr); }
  S.actors = { dave, cars, peds };
  S.update = (t, c) => {
    S.setSky(0);
    const dv = c.dave ?? 'none'; dave.g.visible = dv !== 'none'; if (dv !== 'none') { dave.g.position.set(c.daveX ?? -6, 0, c.daveZ ?? -2.2); dave.g.rotation.y = c.daveRot ?? -Math.PI / 2; if (dv === 'walk') { dave.pose('walk', t * 1.1); dave.armL.rotation.x = -1.3; dave.armL.rotation.z = 0.3; } else dave.pose('stand', t); face(dave, {}); }
    env.visible = dv !== 'none' && !!c.envelope; if (env.visible) { env.position.copy(dave.g.position); env.position.y = 1.05; env.position.x -= 0.3; env.position.z += 0.1; env.rotation.set(-0.2, -Math.PI / 2 + 0.3, 0); }
    const cs = c.cars || []; cars.forEach((car, i) => { const d = cs[i]; car.visible = !!d; if (!d) return; car.position.set(d.x, 0, d.z ?? 5.2); car.rotation.y = d.dir === -1 ? Math.PI : 0; car.userData.cone.visible = !!d.cone; if (d.cone) car.userData.cone.scale.setScalar(d.cone); });
    peds.forEach((p, i) => { p.g.visible = c.peds !== false; const m = c.pedMode ?? 'walk'; if (m === 'walk') { p.pose('walk', t * 1.1 + i); p.g.position.x = (i === 3 && c.stepX !== undefined) ? c.stepX : -20 + i * 6.5 + (i % 2) * 2 + ((t * 1.2 + i * 3) % 8) - 4; if (i === 3 && c.stepX !== undefined) { p.g.rotation.y = Math.PI / 2; p.pose('walk', t * 1.3); } } else { p.pose('stand', t); if (m === 'ears') { p.armL.rotation.set(-2.5, 0, 0.55); p.armR.rotation.set(-2.5, 0, -0.55); p.neck.rotation.x = 0.25; p.torso.rotation.x = 0.1; face(p, { wide: 0.8, open: 0.6 }); } } });
    const hk = c.hats ?? 0; hats.forEach((h, i) => { h.visible = hk > 0; if (hk > 0) { const p = peds[i * 2 + 1]; h.position.set(p.g.position.x + hk * (2 + i), 1.78 + hk * 1.6 - hk * hk * 1.2, p.g.position.z); h.rotation.z = hk * 4; } });
    updateRings(booms, c.booms || [], t, { v: c.boomV ?? 7, life: 0.9, y: 0.03 });
    const sw = c.sweep ?? -1; sweep.forEach((rr, i) => { const k = sw - i * 0.12; rr.visible = sw >= 0 && k > 0 && k < 1; if (rr.visible) { const R = 0.5 + k * 9; rr.position.set((c.sweepX ?? 0) - i * 3, 0.8, 5.2); rr.rotation.set(0, Math.PI / 2, 0); rr.scale.set(R, R, 1); rr.material.opacity = 0.5 * (1 - k); } });
    const ck = c.cracks ?? 0; cracks.forEach((cr, i) => { cr.visible = ck > i * 0.15; cr.scale.setScalar(Math.min(1, (ck - i * 0.15) * 3)); });
  };
  return S;
}

// ======================= CITY (aerial) with sound effects =======================
// ctx: mode (city), pops (bool: rings bursting at people), cones (bool: cones on cars), bubbles (0..1: 7 m bubbles around people), crack (0..1: one huge ring), dark
export function buildCitySnd() {
  const S = buildCity(); const { scene } = S; const base = S.update;
  const rings = []; for (let i = 0; i < 60; i++) { const r = makeRing(0xffffff, 0.8, 0.06); scene.add(r); rings.push(r); }
  const cones = S.cars.map(car => { const cn = makeMach(16, 0.1, 0xffffff, 0.25); cn.position.set(0, 0.8, 0); car.add(cn); cn.rotation.y = -Math.PI / 2; cn.position.z = 2.2; cn.visible = false; return cn; });
  const bubbles = []; for (let i = 0; i < 90; i++) { const b = new THREE.Mesh(new THREE.CircleGeometry(3.5, 24), ADD(GOLD, 0.5)); b.rotation.x = -Math.PI / 2; b.visible = false; scene.add(b); bubbles.push(b); }
  const crack = makeRing(0xffffff, 0.9, 0.012); scene.add(crack); const crackG = makeRing(GOLD, 0.5, 0.03); scene.add(crackG);
  S.update = (t, c) => {
    base(t, c);
    rings.forEach((r, i) => { const p = S.people[i * 4]; const ph = (t * 1.6 + i * 0.37) % 1; r.visible = !!c.pops && p.position.y < 0.5; if (r.visible) { const R = 0.3 + ph * 7; r.position.set(p.position.x, 0.2, p.position.z); r.scale.set(R, R, 1); r.material.opacity = 0.8 * (1 - ph); } });
    cones.forEach((cn, i) => { cn.visible = !!c.cones; if (c.cones) cn.scale.setScalar(0.6 + 0.4 * Math.sin(t * 3 + i)); });
    const bb = c.bubbles ?? 0; bubbles.forEach((b, i) => { const p = S.people[i * 2]; b.visible = bb > 0 && p.position.y < 0.5; if (b.visible) { b.position.set(p.position.x, 0.25, p.position.z); b.scale.setScalar(Math.max(0.02, bb)); b.material.opacity = 0.45 + 0.1 * Math.sin(t * 5 + i); } });
    const ck = c.crack ?? -1; crack.visible = crackG.visible = ck >= 0 && ck < 1; if (crack.visible) { const R = 2 + ck * 160; crack.position.set(0, 1, 0); crack.scale.set(R, R, 1); crack.material.opacity = 0.9 * (1 - ck); crackG.position.set(0, 1, 0); crackG.scale.set(R * 0.9, R * 0.9, 1); crackG.material.opacity = 0.5 * (1 - ck); }
  };
  return S;
}

// ======================= EARTH with lightning =======================
// ctx: flashes (bool), rate, crack (0..1: ring around the globe), label
export function buildEarthSnd() {
  const S = buildSpace(); const { scene, earth } = S; S.iss.visible = false; const base = S.update;
  const R = 60; const r = rng(44); const flashes = []; for (let i = 0; i < 70; i++) { const sp = glowSprite(0xfff4c8, 8, 0); const lat = r.range(-0.9, 0.9), lon = r.range(0, Math.PI * 2); sp.position.set(Math.cos(lat) * Math.cos(lon) * R * 1.01, Math.sin(lat) * R * 1.01, Math.cos(lat) * Math.sin(lon) * R * 1.01); sp.userData.ph = r.f(); earth.add(sp); flashes.push(sp); }
  const ring = makeRing(0xffffff, 0.9, 0.25); ring.rotation.x = 0; scene.add(ring); const ring2 = makeRing(GOLD, 0.6, 0.8); ring2.rotation.x = 0; scene.add(ring2);
  const ears = []; for (let i = 0; i < 40; i++) { const g = new THREE.Group(); for (const sx of [-1, 1]) { const e = cone(0.9, 2.4, M(0xc8a26b), 5, sx * 1.1, 1.2, 0); e.rotation.z = -sx * 0.35; g.add(e); } const lat = r.range(-0.8, 0.8), lon = r.range(0, Math.PI * 2); const p = new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)); g.position.copy(p.clone().multiplyScalar(R)); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p); g.visible = false; earth.add(g); ears.push(g); }
  S.update = (t, c) => {
    base(t, c); earth.rotation.y = (c.spin ?? 0.01) * t + (c.rotY ?? 0);
    flashes.forEach((sp, i) => { const ph = ((t * (c.rate ?? 3.0)) + sp.userData.ph * 7) % 1; const on = c.flashes && ph < 0.12 && (i % 3 !== 1 || c.many); sp.material.opacity = on ? 1 : 0; sp.scale.setScalar(on ? 7 + 9 * (1 - ph / 0.12) : 0.01); });
    const ck = c.crack ?? -1; ring.visible = ring2.visible = ck >= 0 && ck < 1; if (ring.visible) { const Rr = R * (0.2 + ck * 1.9); ring.scale.set(Rr, Rr, 1); ring.material.opacity = 0.9 * (1 - ck); ring2.scale.set(Rr * 0.92, Rr * 0.92, 1); ring2.material.opacity = 0.6 * (1 - ck); ring.lookAt(S.cam.position); ring2.lookAt(S.cam.position); }
    const ek = c.ears ?? 0; ears.forEach((g, i) => { const k = clamp(ek * 1.5 - i * 0.012, 0, 1); g.visible = k > 0; g.scale.setScalar(0.01 + k * 1.3); });
  };
  return S;
}

// ======================= PARK (rain / pigeons / bats) =======================
// ctx: mode ('rain'|'pigeons'|'bats'), dark, rainK, pigeonT, batT
export function buildPark() {
  const S = baseSet({ shadowExtent: 24, fogNear: 60, fogFar: 300, shadowRes: 2048 }); const { scene } = S; const ST = new THREE.Group(); scene.add(ST); const r = rng(31);
  S.sunOffset = new THREE.Vector3(50, 60, 40); S.sun.intensity = 2.2;
  const gT = grassTex(); gT.repeat.set(14, 14); scene.add(plane(160, 160, texMat({ map: gT }), 0, 0, 0));
  scene.add(plane(60, 3, M(0xd8c7a2), 0, 0.01, 4)); const pond = plane(10, 7, mat(0x4f8fc8, { transparent: true, opacity: 0.85 }), 10, 0.012, -6); scene.add(pond);
  for (let i = 0; i < 14; i++) { const tr = makeTree(200 + i, i % 4 === 0 ? 'tall' : 'plane'); tr.position.set(r.range(-30, 30), 0, r.range(-30, -8) + (i % 3) * 1); if (Math.abs(tr.position.x - 10) < 7 && tr.position.z > -12) tr.position.x += 14; ST.add(tr); }
  for (let i = 0; i < 6; i++) { const tr = makeTree(240 + i); tr.position.set(-28 + i * 11, 0, 12 + (i % 2) * 3); ST.add(tr); }
  const bench = makeBench(); bench.position.set(-3, 0, 2.2); bench.rotation.y = Math.PI; ST.add(bench); const lamp = makeLamp(); lamp.position.set(3, 0, 2.5); ST.add(lamp);
  for (let i = 0; i < 20; i++) { const bl = makeBuilding(r.range(8, 14), r.range(10, 26), 8, 300 + i); bl.position.set(-60 + i * 6.5, 0, -60 - (i % 3) * 8); ST.add(bl); }
  bakeStatic(ST, scene);
  // people: one with umbrella, one walking, one on the bench
  const pu = new Person({ seed: 61, shirt: 0xd9534f, hair: 0x2b1d14 }); pu.g.position.set(-1.5, 0, 4.2); pu.g.rotation.y = 0.4; scene.add(pu.g);
  const umb = new THREE.Group(); const can = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.3, 10), M(0x2f6fb6)); can.position.y = 2.2; umb.add(can); umb.add(cyl(0.015, 0.015, 1.0, M(0x2b2d33), 6, 0, 1.6, 0)); scene.add(umb);
  const pb = new Person({ seed: 62, shirt: 0x6fa36b, hair: 0xd9b36b, hairStyle: 'long', dress: true }); pb.g.position.set(-3.2, 0.03, 2.0); pb.g.rotation.y = Math.PI; scene.add(pb.g); pb.pose('sit');
  const pw = new Person({ seed: 63, shirt: 0x4a7fb5 }); scene.add(pw.g);
  // rain: drops (thin boxes) each with a tiny Mach cone, plus splash rings
  const drops = []; const dr = rng(5); for (let i = 0; i < 90; i++) { const g = new THREE.Group(); const d = box(0.03, 0.22, 0.03, ADD(0xcfe8ff, 0.8), 0, 0, 0, false); g.add(d); const cn = makeMach(0.7, 0.16, 0xffffff, 0.35); cn.rotation.z = Math.PI / 2; cn.position.y = -0.11; g.add(cn); g.userData = { x: dr.range(-9, 9), z: dr.range(-5, 8), ph: dr.f(), sp: dr.range(0.9, 1.1) }; scene.add(g); drops.push(g); }
  const splashes = []; for (let i = 0; i < 24; i++) { const rr = makeRing(0xffffff, 0.7, 0.02); scene.add(rr); splashes.push(rr); }
  // pigeons with cones
  const pigeons = []; for (let i = 0; i < 5; i++) { const g = new THREE.Group(); const p = makePigeon(i + 1); p.scale.setScalar(1.3); g.add(p); const cn = makeMach(2.4, 0.07, 0xffffff, 0.3); cn.position.set(0.3, 0.2, 0); g.add(cn); g.userData = { p, cn, ph: i * 1.3, y: 2.2 + i * 0.5, z: -3 + i * 1.6 }; scene.add(g); pigeons.push(g); }
  const pigeonRings = []; for (let i = 0; i < 10; i++) { const rr = makeRing(0xffffff, 0.6, 0.02); scene.add(rr); pigeonRings.push(rr); }
  // bats: two flapping wing boxes + body, with trailing echo rings that lag behind
  const bats = []; for (let i = 0; i < 5; i++) { const g = new THREE.Group(); const body = ico(0.12, M(0x2b2230), 0, 0, 0, 0); g.add(body); const wl = new THREE.Group(), wr = new THREE.Group(); const wm = M(0x3a2f42); const w1 = box(0.42, 0.02, 0.26, wm, -0.24, 0, 0); const w2 = box(0.42, 0.02, 0.26, wm, 0.24, 0, 0); wl.add(w1); wr.add(w2); g.add(wl, wr); const ear1 = cone(0.03, 0.08, M(0x2b2230), 4, -0.05, 0.14, 0.03); const ear2 = cone(0.03, 0.08, M(0x2b2230), 4, 0.05, 0.14, 0.03); g.add(ear1, ear2); const eyeM = emis(0xffe08a, 1.2); g.add(ico(0.02, eyeM, 0, -0.04, 0.05, 0.1)); g.add(ico(0.02, eyeM, 0, 0.04, 0.05, 0.1)); const brows = [box(0.05, 0.01, 0.01, M(0x111), -0.04, 0.085, 0.11), box(0.05, 0.01, 0.01, M(0x111), 0.04, 0.085, 0.11)]; brows[0].rotation.z = 0.5; brows[1].rotation.z = -0.5; g.add(...brows); const cn = makeMach(1.6, 0.25, 0xffffff, 0.25); cn.rotation.y = Math.PI / 2; cn.position.z = 0.1; g.add(cn); g.userData = { wl, wr, ph: i * 1.1, y: 3 + i * 0.6, x: -6 + i * 3 }; scene.add(g); bats.push(g); }
  const echo = []; for (let i = 0; i < 25; i++) { const rr = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 48), ADD(0x9fd0ff, 0.7)); rr.visible = false; scene.add(rr); echo.push(rr); }
  S.update = (t, c) => {
    S.setSky(c.dark ?? 0); const mode = c.mode ?? 'rain'; if (mode === 'bats') { S.sky.material.uniforms.top.value.setHex(0x070a1c); S.sky.material.uniforms.horizon.value.setHex(0x1b2240); S.sky.material.uniforms.bottom.value.setHex(0x0b0e1a); S.scene.fog.color.setHex(0x1b2240); S.sun.intensity = 0.35; S.hemi.intensity = 0.3; S.stars.material.opacity = 0.8; } else { S.stars.material.opacity = 0; }
    pu.g.visible = mode === 'rain'; umb.visible = mode === 'rain'; pu.pose('stand', t); pu.armR.rotation.x = -2.6; pu.armR.rotation.z = -0.2; umb.position.set(pu.g.position.x + 0.1, 0.2, pu.g.position.z + 0.2); pb.g.visible = mode !== 'bats'; pb.pose('sit'); pb.armL.rotation.x = -1.2; pb.armR.rotation.x = -1.2; pb.neck.rotation.x = mode === 'pigeons' ? -0.5 : 0.2;
    pw.g.visible = mode !== 'bats'; pw.g.position.set(4 + Math.sin(t * 0.3) * 2, 0, 4.0); pw.g.rotation.y = -Math.PI / 2; pw.pose('walk', t * 1.1); if (mode === 'pigeons') pw.neck.rotation.x = -0.6; if (mode === 'rain') { pw.armL.rotation.set(-2.5, 0, 0.5); pw.armR.rotation.set(-2.5, 0, -0.5); pw.neck.rotation.x = 0.3; }
    drops.forEach((g, i) => { g.visible = mode === 'rain'; if (!g.visible) return; const u = g.userData; const ph = ((t * 1.3 * u.sp) + u.ph) % 1; g.position.set(u.x, 9 - ph * 9, u.z); });
    splashes.forEach((rr, i) => { const g = drops[i * 3]; const u = g.userData; const ph = ((t * 1.3 * u.sp) + u.ph) % 1; rr.visible = mode === 'rain' && ph > 0.0 && ph < 0.35; if (rr.visible) { const R = 0.1 + ph * 2.2; rr.position.set(u.x, 0.02, u.z); rr.scale.set(R, R, 1); rr.material.opacity = 0.7 * (1 - ph / 0.35); } });
    pigeons.forEach((g, i) => { g.visible = mode === 'pigeons'; if (!g.visible) return; const u = g.userData; const x = -14 + ((t * 7 * (c.pigeonSpeed ?? 1) + u.ph * 5) % 28); g.position.set(x, u.y + Math.sin(t * 2 + u.ph) * 0.3, u.z); flapPigeon(u.p, t + u.ph, 0.9); u.cn.scale.setScalar(0.8 + 0.2 * Math.sin(t * 5 + i)); });
    pigeonRings.forEach((rr, i) => { const g = pigeons[i % 5]; const ph = ((t * 1.5) + i * 0.1) % 1; rr.visible = mode === 'pigeons'; if (rr.visible) { const R = 0.15 + ph * 1.6; rr.position.set(g.position.x - 0.5 - ph * 3, g.position.y - 0.1, g.position.z); rr.rotation.set(0, Math.PI / 2, 0); rr.scale.set(R, R, 1); rr.material.opacity = 0.6 * (1 - ph); } });
    bats.forEach((g, i) => { g.visible = mode === 'bats'; if (!g.visible) return; const u = g.userData; const sp = c.batSpeed ?? 5.6; const x = -10 + ((t * sp + u.ph * 4) % 22); g.position.set(x, u.y + Math.sin(t * 4 + u.ph) * 0.35, -2 + i * 1.2); g.rotation.y = Math.PI / 2; const f = Math.sin(t * 24 + u.ph) * 0.9; u.wl.rotation.z = -f; u.wr.rotation.z = f; g.userData.x = x; });
    echo.forEach((rr, i) => { const b = bats[i % 5]; rr.visible = mode === 'bats'; if (!rr.visible) return; const u = b.userData; const sp = c.batSpeed ?? 5.6; const age = ((t * 2.0) + (i / 5) * 0.2 + Math.floor(i / 5) * 0.2) % 1; const dt = age * 1.2; const x = u.x - sp * dt; const R = 0.08 + 0.9 * dt; rr.position.set(x, b.position.y, b.position.z); rr.rotation.set(0, Math.PI / 2, 0); rr.scale.set(R, R, 1); rr.material.opacity = 0.7 * (1 - age); });
  };
  S.actors = { bats, pigeons };
  return S;
}

// ======================= STORM FIELD (thunder walking) =======================
// ctx: bolt (0..1 brightness), thunderX, walkT (legs), label, cowLook
export function buildStorm() {
  const S = baseSet({ shadowExtent: 20, fogNear: 40, fogFar: 260, shadowRes: 1024 }); const { scene } = S; const ST = new THREE.Group(); scene.add(ST); const r = rng(13);
  const gT = grassTex(); gT.repeat.set(12, 12); scene.add(plane(160, 160, texMat({ map: gT }), 0, 0, 0));
  for (let i = 0; i < 12; i++) { ST.add(box(0.12, 1.1, 0.12, M(0x6b4a2b), -16 + i * 3, 0.55, -6)); } ST.add(box(34, 0.06, 0.06, M(0x6b4a2b), 0, 0.9, -6)); ST.add(box(34, 0.06, 0.06, M(0x6b4a2b), 0, 0.5, -6));
  for (let i = 0; i < 8; i++) { const tr = makeTree(400 + i); tr.position.set(-30 + i * 9, 0, -16 - (i % 2) * 6); ST.add(tr); }
  // cow
  const cow = new THREE.Group(); const cw = M(0xf4f4f4), ck = M(0x1b1b1b); cow.add(box(1.4, 0.7, 0.6, cw, 0, 0.9, 0)); cow.add(box(0.5, 0.4, 0.3, ck, 0.2, 0.95, 0.31)); cow.add(box(0.4, 0.3, 0.3, ck, -0.4, 0.8, -0.31)); const chead = new THREE.Group(); chead.position.set(0.85, 1.1, 0); chead.add(box(0.5, 0.4, 0.36, cw, 0.1, 0, 0)); chead.add(box(0.2, 0.22, 0.3, M(0xe0ac9e), 0.4, -0.1, 0)); for (const sz of [-1, 1]) { chead.add(cone(0.05, 0.2, M(0xd8d2c4), 5, 0.0, 0.3, sz * 0.14)); chead.add(ico(0.035, ck, 0, 0.3, 0.1, sz * 0.19)); } cow.add(chead); for (const sx of [-0.5, 0.5]) for (const sz of [-0.2, 0.2]) cow.add(box(0.16, 0.6, 0.16, cw, sx, 0.3, sz)); cow.position.set(-3.8, 0, -2.2); cow.rotation.y = 0.7; scene.add(cow);
  bakeStatic(ST, scene);
  // bolt: zigzag of emissive boxes from the cloud (y=22) to the ground at x=-3
  const bolt = new THREE.Group(); const bm = emis(0xfff6d0, 3.0); bm.transparent = true; let y = 22, x = -3.2; for (let i = 0; i < 9; i++) { const ny = y - 2.4, nx = x + (i % 2 ? -0.9 : 1.1); const seg = box(0.18, Math.hypot(nx - x, ny - y) + 0.1, 0.18, bm, (x + nx) / 2, (y + ny) / 2, 0, false); seg.rotation.z = Math.atan2(nx - x, y - ny); bolt.add(seg); x = nx; y = ny; } const bglow = glowSprite(0xfff4d6, 16, 0.8); bglow.position.set(-3, 12, 0); bolt.add(bglow); scene.add(bolt); const bLight = new THREE.PointLight(0xdfe8ff, 0, 60, 1.2); bLight.position.set(-3, 8, 2); scene.add(bLight);
  const clouds = []; for (let i = 0; i < 9; i++) { const s = softSprite(0x3a3f4c, 26 + (i % 3) * 8, 0.95); s.position.set(-30 + i * 8, 22 + (i % 2) * 2, -10 + (i % 3) * 4); scene.add(s); clouds.push(s); }
  // thunder: a translucent grey rumble-sphere with two little legs and feet, walking at 1.4 m/s
  const th = new THREE.Group(); const sph = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 2), mat(0x8a8f9a, { transparent: true, opacity: 0.75 })); sph.position.y = 1.5; th.add(sph); const inner = glowSprite(0xffffff, 1.6, 0.35); inner.position.y = 1.5; th.add(inner);
  const legs = []; for (const sx of [-0.28, 0.28]) { const l = new THREE.Group(); l.position.set(sx, 0.75, 0); l.add(box(0.14, 0.7, 0.14, M(0x5a5f6a), 0, -0.35, 0)); l.add(box(0.18, 0.1, 0.3, M(0x2b2d33), 0, -0.72, 0.06)); th.add(l); legs.push(l); }
  const thLabel = lbl('THUNDER', 1.4, 0.3, { fg: '#f2c85b', font: 'bold 80px sans-serif' }); thLabel.position.y = 2.9; th.add(thLabel); const thLabel2 = lbl('1.4 M/S', 1.0, 0.24, { fg: '#ffffff', font: 'bold 72px sans-serif' }); thLabel2.position.y = 2.6; th.add(thLabel2);
  scene.add(th);
  const sheep = []; for (let i = 0; i < 4; i++) { const g = new THREE.Group(); g.add(ico(0.35, M(0xf4f4f4), 1, 0, 0.5, 0)); g.add(ico(0.14, M(0x2b2d33), 0, 0.32, 0.55, 0)); for (const sx of [-0.15, 0.15]) for (const sz of [-0.12, 0.12]) g.add(box(0.07, 0.3, 0.07, M(0x2b2d33), sx, 0.15, sz)); g.position.set(-8 + i * 2.5 + (i % 2) * 3, 0, 3 + (i % 2) * 2.5); g.rotation.y = i * 1.5; scene.add(g); sheep.push(g); }
  S.update = (t, c) => {
    S.setSky(0.92); const bk = c.bolt ?? 0; bolt.visible = bk > 0.02; bm.opacity = Math.min(1, bk * 1.5); bm.emissiveIntensity = 3.0 * bk; bolt.children.forEach(o => { if (o.isSprite) o.material.opacity = 0.8 * bk; }); bLight.intensity = 30 * bk; S.sun.intensity = 0.25 + 0.5 * bk; S.hemi.intensity = 0.55;
    const tx = c.thunderX ?? -3; th.position.set(tx, 0, 0.4); th.visible = c.thunder !== false; const wt = c.walkT ?? 0; legs.forEach((l, i) => { l.rotation.x = Math.sin(wt * 6 + i * Math.PI) * 0.6 * (c.walking ? 1 : 0); }); sph.position.y = 1.5 + Math.abs(Math.sin(wt * 6)) * 0.05 * (c.walking ? 1 : 0); sph.scale.setScalar(1 + 0.04 * Math.sin(t * 9)); th.rotation.y = c.thunderRot ?? 0; thLabel.visible = thLabel2.visible = c.label !== false; thLabel2.userData.lab = 1;
    chead.rotation.y = c.cowLook ?? 0; chead.rotation.z = (c.cowTilt ?? 0);
  };
  return S;
}

// ======================= DOG LINE-UP (suburban garden) =======================
// ctx: alert (0..1), turn (rad), flat (bool), nod, lie (bool), count label
export function buildDogs() {
  const S = baseSet({ shadowExtent: 14, fogNear: 60, fogFar: 300, shadowRes: 2048 }); const { scene } = S; const ST = new THREE.Group(); scene.add(ST); const r = rng(23);
  S.sunOffset = new THREE.Vector3(30, 50, 45); S.sun.intensity = 2.3;
  const gT = grassTex(); gT.repeat.set(10, 10); scene.add(plane(120, 120, texMat({ map: gT }), 0, 0, 0));
  for (let i = 0; i < 14; i++) ST.add(box(0.1, 1.0, 0.08, M(0xf4efe4), -7 + i * 1.1, 0.5, -3)); ST.add(box(15.5, 0.1, 0.06, M(0xf4efe4), 0, 0.75, -3)); ST.add(box(15.5, 0.1, 0.06, M(0xf4efe4), 0, 0.3, -3));
  for (let i = 0; i < 6; i++) { const h = ico(0.7, M(0x3f7a3a), 1, -8 + i * 3.2, 0.6, -4.5); h.scale.set(1.6, 1, 1); ST.add(h); }
  const bT = canvasTex(128, 128, (ctx, W, H) => { ctx.fillStyle = '#b9b0a2'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#9a8f80'; for (let y = 0; y < H; y += 16) ctx.fillRect(0, y, W, 2); });
  for (let i = 0; i < 4; i++) { const x = -12 + i * 8; const m = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 6), [texMat({ map: bT }), texMat({ map: bT }), M(0x4a4a4a), M(0x444), texMat({ map: windowTex('#c2b8a8', '#ffe9b0', 3, 2, 0.3, 40 + i) }), texMat({ map: bT })]); m.position.set(x, 3, -10); m.castShadow = true; ST.add(m); const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.4, 4), M(0x5c4a3e)); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.85); roof.position.set(x, 7.2, -10); ST.add(roof); ST.add(box(1.0, 2.2, 0.2, M([0x2f6fb6, 0xb84a3a, 0xe0a526, 0x2b2d33][i]), x - 1.5, 1.1, -6.95)); }
  for (const lx of [-16, 16]) { const tr = makeTree(90 + lx); tr.position.set(lx, 0, -6); ST.add(tr); }
  bakeStatic(ST, scene);
  const dogs = []; const specs = [[0xc8a26b, 1.0], [0x2b2d33, 0.75], [0xf4efe4, 0.9], [0x8a5a3a, 1.25], [0xd9b36b, 0.6], [0x6b6f7a, 1.1], [0xb84a3a, 0.85]];
  specs.forEach(([col, sz], i) => { const d = makeDog({ color: col, size: sz, dark: col === 0x2b2d33 ? 0x111111 : 0x3a2a1a }); d.position.set(-3.6 + i * 1.2, 0, 0); d.rotation.y = -Math.PI / 2 - 0.2 + (i % 3) * 0.2; scene.add(d); dogs.push(d); });
  const bowl = cyl(0.22, 0.18, 0.1, M(0xd9534f), 12, 2.6, 0.05, 1.2); scene.add(bowl); const ball = ico(0.14, M(0xe0a526), 1, -3.5, 0.14, 1.4); scene.add(ball);
  S.update = (t, c) => {
    S.setSky(0); const a = c.alert ?? 0;
    dogs.forEach((d, i) => { const off = -0.2 + (i % 3) * 0.2; dogPose(d, t + i, { alert: a, turn: (c.turn ?? 0), tilt: (c.tilt ?? 0) * (i % 2 ? 1 : -1), flat: !!c.flat, nod: c.nod ?? 0, lie: !!c.lie, wag: !!c.wag }); d.rotation.y = -Math.PI / 2 + off * (1 - a); });
  };
  S.actors = { dogs };
  return S;
}
