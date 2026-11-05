import * as THREE from 'three';
import { box, cyl, ico, plane, rng, lerp, clamp, smooth, easeOut, easeIn, prog, emis, canvasTex, texMat, windowTex, bakeStatic, softSprite } from './util.js';
import { M, Person, makeCar, makeTree } from './kit.js';
import { baseSet } from './sets.js';
import { makeDave } from './water.js';

// ======================= CITY FROM ABOVE =======================
// ctx: mode ('still'|'jump'|'roofs'|'traffic'|'stopped'|'flash'), jt (local time), flash
export function buildCity() {
  const S = baseSet({ shadowExtent: 120, fogNear: 150, fogFar: 700, shadowRes: 2048 }); const { scene } = S; S.sun.intensity = 2.4; S.sunOffset = new THREE.Vector3(80, 120, 60);
  const ST = new THREE.Group(); scene.add(ST); const r = rng(9);
  ST.add(plane(800, 800, M(0x6f8f55), 0, 0, 0));
  const B = 14, ROAD = 6, N = 9; const span = N * (B + ROAD); const o = -span / 2;
  for (let i = 0; i <= N; i++) { ST.add(plane(span, ROAD, M(0x3d4148), 0, 0.02, o + i * (B + ROAD) - ROAD / 2)); ST.add(plane(ROAD, span, M(0x3d4148), o + i * (B + ROAD) - ROAD / 2, 0.021, 0)); }
  const texs = ['#b9b0a2', '#a7a39b', '#8a8f99', '#c2b8a8', '#9a6b4f'].map((c, i) => texMat({ map: windowTex(c, '#ffe9b0', 3, 4, 0.2, i + 3) }));
  const roofM = [M(0x4a4a4a), M(0x5c4a3e), M(0x6b6f74)]; const roofs = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const cx = o + i * (B + ROAD) + B / 2, cz = o + j * (B + ROAD) + B / 2;
    if (r.f() < 0.12) { const tr = makeTree(400 + i * 9 + j); tr.position.set(cx, 0, cz); tr.scale.setScalar(1.6); ST.add(tr); continue; }
    for (let k = 0; k < 2; k++) { const w = B * 0.46, d = B * 0.9, h = r.range(7, 16) * (Math.hypot(cx, cz) < 40 ? 1.8 : 1); const bx = cx - B / 4 + k * B / 2; const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), texs[(i + j + k) % texs.length]); m.position.set(bx, h / 2, cz); m.castShadow = true; m.receiveShadow = true; ST.add(m); ST.add(box(w + 0.2, 0.3, d + 0.2, roofM[(i + k) % 3], bx, h + 0.15, cz)); roofs.push([bx, h + 0.3, cz]); }
  }
  bakeStatic(ST, scene);
  // people (tiny boxes) on the streets and roofs
  const pplM = [0xc0392b, 0x2980b9, 0xf1c40f, 0x27ae60, 0x8e44ad, 0xe67e22, 0xecf0f1].map(c => M(c));
  const people = []; for (let i = 0; i < 260; i++) { const p = new THREE.Group(); p.add(box(0.5, 1.2, 0.35, pplM[i % 7], 0, 0.6, 0)); p.add(ico(0.22, M(0xe0b090), 0, 0, 1.38, 0)); const street = r.f() < 0.6; const ln = r.int(0, N); const t = r.range(o, o + span); p.userData = street ? { x: r.f() < 0.5 ? t : o + ln * (B + ROAD) - ROAD / 2 + r.range(-2.5, 2.5), z: r.f() < 0.5 ? o + ln * (B + ROAD) - ROAD / 2 + r.range(-2.5, 2.5) : t, roof: roofs[r.int(0, roofs.length - 1)], ph: r.range(0, 2) } : { x: 0, z: 0, roof: roofs[r.int(0, roofs.length - 1)], ph: r.range(0, 2), onRoof: true }; if (street) { p.userData.x = clamp(p.userData.x, o, o + span); p.userData.z = clamp(p.userData.z, o, o + span); } scene.add(p); people.push(p); }
  // cars on the roads
  const cars = []; for (let i = 0; i < 70; i++) { const c = makeCar(500 + i); const ln = r.int(0, N); const alongX = i % 2 === 0; c.userData = { alongX, lane: o + ln * (B + ROAD) - ROAD / 2 + (i % 4 < 2 ? 1.4 : -1.4), p0: r.range(o, o + span), v: r.range(8, 13) * (i % 4 < 2 ? 1 : -1) }; c.rotation.y = alongX ? (c.userData.v > 0 ? Math.PI / 2 : -Math.PI / 2) : (c.userData.v > 0 ? 0 : Math.PI); scene.add(c); cars.push(c); }
  const wrap = (v) => o + ((((v - o) % span) + span) % span);
  S.update = (t, c) => {
    S.setSky(0); const mode = c.mode || 'still'; const jt = c.jt ?? 0;
    people.forEach((p, i) => { const u = p.userData; let x = u.x, z = u.z, y = 0;
      if (mode === 'roofs' || (u.onRoof && mode !== 'jump') || (mode === 'jump' && jt - u.ph > 2.4)) { [x, y, z] = u.roof; x += (i % 5 - 2) * 0.7; }
      else if (mode === 'jump') { const lt = jt - u.ph; if (lt > 0) { const T = 2.4; const k = lt / T; y = Math.max(0, 4 * 9 * k * (1 - k)); const R = u.roof; const kk = smooth(k); x = lerp(u.x, R[0], kk); z = lerp(u.z, R[2], kk); if (k > 0.5) y = Math.max(y, lerp(0, R[1], smooth((k - 0.5) * 2))); } }
      p.position.set(x, y, z); });
    cars.forEach((car, i) => { const u = car.userData; let s = u.p0 + (mode === 'traffic' ? u.v * t : 0); if (mode === 'stopped') s = u.p0 + u.v * Math.min(c.st ?? 0, 0.3); const v = wrap(s); if (u.alongX) car.position.set(v, 0, u.lane); else car.position.set(u.lane, 0, v); });
  };
  return S;
}

// ======================= STUDIO for numbers =======================
function labelTex(text, w = 512, h = 128, fg = '#ffffff', bg = null, font = 'bold 64px sans-serif') { return canvasTex(w, h, (ctx, W, H) => { if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); } ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, W / 2, H / 2); }); }
function labelMesh(text, w, h, opts = {}) { const t = labelTex(text, opts.pw || 512, opts.ph || 128, opts.fg, opts.bg, opts.font); t.magFilter = THREE.LinearFilter; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !opts.bg })); return m; }
function dialTex(max, unit) { const t = canvasTex(512, 512, (ctx, W, H) => { ctx.fillStyle = '#f4efe4'; ctx.beginPath(); ctx.arc(256, 256, 250, 0, 6.283); ctx.fill(); ctx.lineWidth = 14; ctx.strokeStyle = '#2b2d33'; ctx.stroke(); for (let i = 0; i <= 50; i++) { const a = Math.PI * (0.75 + 1.5 * i / 50); const L = i % 5 === 0 ? 34 : 16; ctx.lineWidth = i % 5 === 0 ? 6 : 3; ctx.strokeStyle = i > 40 ? '#c0392b' : '#2b2d33'; ctx.beginPath(); ctx.moveTo(256 + Math.cos(a) * 220, 256 + Math.sin(a) * 220); ctx.lineTo(256 + Math.cos(a) * (220 - L), 256 + Math.sin(a) * (220 - L)); ctx.stroke(); if (i % 10 === 0) { ctx.fillStyle = '#2b2d33'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(max * i / 50), 256 + Math.cos(a) * 150, 256 + Math.sin(a) * 150); } } ctx.font = 'bold 40px sans-serif'; ctx.fillText(unit, 256, 380); }); t.magFilter = THREE.LinearFilter; return t; }
function poleTex() { const t = canvasTex(128, 1024, (ctx, W, H) => { ctx.fillStyle = '#f4efe4'; ctx.fillRect(0, 0, W, H); for (let m = 0; m <= 80; m++) { const y = H - (m / 80) * H; ctx.fillStyle = m % 10 === 0 ? '#c0392b' : '#2b2d33'; ctx.fillRect(0, y - 2, m % 10 === 0 ? 90 : 40, m % 10 === 0 ? 6 : 3); if (m % 10 === 0 && m > 0) { ctx.font = 'bold 34px sans-serif'; ctx.fillText((m / 10) + ' m', 46, y + 30); } } }); t.magFilter = THREE.LinearFilter; return t; }

// ctx: prop, plus per-prop params (see S.update)
export function buildStudio() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1d2b45); const cam = new THREE.PerspectiveCamera(44, 1080 / 1920, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x203050, 1.1)); const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(3, 6, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 8, bottom: -2 }); scene.add(key); scene.add(key.target);
  const floor = plane(40, 40, M(0x24365a), 0, 0, 0); floor.receiveShadow = true; scene.add(floor);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 14, 32, 1, true, Math.PI * 0.75, Math.PI * 1.5), new THREE.MeshLambertMaterial({ color: 0x2a3d66, side: THREE.BackSide })); back.position.set(0, 7, 0); scene.add(back);
  const spot = softSprite(0x6f9cff, 9, 0.25); spot.position.set(0, 3, -6); scene.add(spot);
  const P = {}; const add = (k, g) => { P[k] = g; scene.add(g); return g; };
  // dial (grip gauge)
  { const g = new THREE.Group(); const face = new THREE.Mesh(new THREE.CircleGeometry(1.2, 48), new THREE.MeshLambertMaterial({ map: dialTex(500, 'KG') })); g.add(face); g.add(cyl(1.3, 1.3, 0.15, M(0x2b2d33), 48, 0, 0, -0.08)); g.children[1].rotation.x = Math.PI / 2; const needle = new THREE.Group(); needle.add(box(0.06, 1.0, 0.03, M(0xc0392b), 0, 0.45, 0.05)); needle.add(cyl(0.09, 0.09, 0.05, M(0x2b2d33), 16, 0, 0, 0.06)); needle.children[1].rotation.x = Math.PI / 2; g.add(needle); const hand = ico(0.35, M(0xf1c9a5), 1, 1.15, -1.1, 0.3); hand.scale.set(1, 1.3, 0.8); g.add(hand); g.add(box(0.25, 0.9, 0.25, M(0x9aa1a8), 1.15, -1.75, 0.2)); g.position.set(0, 2.2, 0); g.userData = { needle, hand }; add('dial', g); }
  // heart on a deckchair
  { const g = new THREE.Group(); const hm = M(0xd63c4a); const h = new THREE.Group(); h.add(ico(0.32, hm, 1, -0.2, 0.15, 0)); h.add(ico(0.32, hm, 1, 0.2, 0.15, 0)); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.7, 8), hm); tip.rotation.z = Math.PI; tip.position.y = -0.25; h.add(tip); h.add(box(0.5, 0.08, 0.05, M(0x111111), 0, 0.22, 0.3)); h.position.set(0, 1.25, 0.1); h.rotation.x = -0.3; g.add(h); const chair = new THREE.Group(); chair.add(box(1.0, 0.05, 1.4, M(0x2f80ed), 0, 0.5, 0)); chair.add(box(1.0, 1.0, 0.05, M(0x2f80ed), 0, 0.95, -0.65)); chair.children[1].rotation.x = 0.5; for (const sx of [-0.45, 0.45]) { chair.add(box(0.05, 0.5, 0.05, M(0xd0d0d0), sx, 0.25, 0.6)); chair.add(box(0.05, 0.5, 0.05, M(0xd0d0d0), sx, 0.25, -0.6)); } g.add(chair); const sign = labelMesh('EXCLUDED', 1.8, 0.45, { bg: '#f2c85b', fg: '#1b1b1b' }); sign.position.set(0, 2.5, 0); g.add(sign); g.userData = { h }; add('heart', g); }
  // Dave flexing
  { const d = makeDave(); d.g.position.set(0, 0, 0); const g = new THREE.Group(); g.add(d.g); const glow = softSprite(0xffd36b, 3.5, 0.0); glow.position.set(0, 1.6, -0.3); g.add(glow); g.userData = { d, glow }; add('muscle', g); }
  // measuring pole + jumper
  { const g = new THREE.Group(); const pole = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 0.1), new THREE.MeshLambertMaterial({ map: poleTex() })); pole.position.set(-0.8, 4, 0); g.add(pole); const d = makeDave(); g.add(d.g); d.g.position.set(0.4, 0, 0); const ghost = makeDave(); ghost.g.position.set(1.4, 0, 0); ghost.g.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.35; } }); g.add(ghost.g); g.userData = { d, ghost }; add('pole', g); }
  // giant tooth + car
  { const g = new THREE.Group(); const tw = M(0xf6f3ea); g.add(box(1.6, 1.4, 1.4, tw, 0, 1.5, 0)); for (const [x, z] of [[-0.45, -0.4], [0.45, -0.4], [-0.45, 0.4], [0.45, 0.4]]) g.add(ico(0.42, tw, 1, x, 2.25, z)); for (const x of [-0.45, 0.45]) { const root = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.0, 6), tw); root.rotation.z = Math.PI; root.position.set(x, 0.5, 0); g.add(root); } const car = makeCar(77, { color: 0xd9534f }); car.scale.setScalar(0.55); g.add(car); const kg = labelMesh('≈ 870 KG', 1.6, 0.4, { fg: '#f2c85b' }); kg.position.set(0, 4.6, 0); g.add(kg); g.userData = { car }; add('tooth', g); }
  // bars (muscle / bone / tendon)
  { const g = new THREE.Group(); const cols = [0xd63c4a, 0xf4efe4, 0xf2c85b], names = ['MUSCLE', 'BONE', 'TENDON']; const bars = []; names.forEach((n, i) => { const b = box(0.7, 1, 0.7, M(cols[i]), (i - 1) * 1.1, 0.5, 0); g.add(b); bars.push(b); const l = labelMesh(n, 1.1, 0.28, { fg: '#ffffff', font: 'bold 56px sans-serif' }); l.position.set((i - 1) * 1.1, -0.25, 0.4); g.add(l); }); g.position.y = 0.3; g.userData = { bars }; add('bars', g); }
  // bone cracking
  { const g = new THREE.Group(); const bm = M(0xf4efe4); const halves = []; for (const s of [-1, 1]) { const h = new THREE.Group(); h.add(cyl(0.16, 0.16, 1.3, bm, 10, 0, s * 0.65, 0)); h.add(ico(0.26, bm, 1, 0.12, s * 1.35, 0)); h.add(ico(0.26, bm, 1, -0.12, s * 1.35, 0)); g.add(h); halves.push(h); } const crackFlash = softSprite(0xffffff, 1.2, 0); g.add(crackFlash); g.position.set(0, 2.2, 0); g.rotation.z = Math.PI / 2; g.userData = { halves, crackFlash }; add('bone', g); }
  // brain with a limiter knob
  { const g = new THREE.Group(); const pm = M(0xe8a0b4); for (let i = 0; i < 14; i++) { const a = i * 2.4; g.add(ico(0.32, pm, 1, Math.cos(a) * 0.45, 0.25 + Math.sin(i * 1.3) * 0.25, Math.sin(a) * 0.35)); } const knob = new THREE.Group(); knob.add(cyl(0.22, 0.22, 0.12, M(0x2b2d33), 16, 0, 0, 0)); knob.children[0].rotation.x = Math.PI / 2; knob.add(box(0.05, 0.2, 0.05, M(0xf2c85b), 0, 0.12, 0.07)); knob.position.set(0, 0.3, 0.75); g.add(knob); const sign = labelMesh('LIMITER', 1.4, 0.35, { bg: '#c0392b', fg: '#ffffff' }); sign.position.set(0, 1.3, 0.3); g.add(sign); g.position.set(0, 1.6, 0); g.userData = { knob }; add('brain', g); }
  // braking distance strip
  { const g = new THREE.Group(); g.add(box(1.6, 0.02, 16, M(0x3d4148), 0, 0.01, -6)); for (let m = 0; m <= 14; m += 7) { const l = labelMesh(m + ' m', 1.0, 0.3, { fg: '#f2c85b' }); l.rotation.x = -Math.PI / 2; l.position.set(1.4, 0.03, -m); g.add(l); g.add(box(1.6, 0.03, 0.08, M(0xffffff), 0, 0.02, -m)); } const car = makeCar(88, { color: 0x3b6fb6 }); car.rotation.y = Math.PI; g.add(car); const ghost = makeCar(89, { color: 0x9aa1a8 }); ghost.rotation.y = Math.PI; ghost.position.x = -0.0; g.add(ghost); g.userData = { car, ghost }; add('brake', g); }
  // fuel pie
  { const g = new THREE.Group(); const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.4, 48), M(0x7f8c8d)); g.add(base); const seg = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 0.44, 48, 1, false, 0, Math.PI * 2 / 3), M(0xc0392b)); g.add(seg); const l = labelMesh('LOST TO FRICTION', 2.6, 0.4, { fg: '#ffffff' }); l.position.set(0, 1.6, 0); g.add(l); g.rotation.x = 0.9; g.position.set(0, 2.0, 0); g.userData = { seg }; add('fuel', g); }
  // hands rubbing
  { const g = new THREE.Group(); const sk = M(0xf1c9a5); const hs = []; for (const s of [-1, 1]) { const h = new THREE.Group(); h.add(box(0.6, 0.9, 0.18, sk, 0, 0, 0)); h.add(box(0.2, 0.9, 0.2, FABM(), 0, -0.85, 0)); h.position.set(s * 0.12, 2.0, 0); h.rotation.y = s * 0.2; g.add(h); hs.push(h); } const heat = softSprite(0xff7a2a, 2.5, 0); heat.position.set(0, 2.0, 0.3); g.add(heat); g.userData = { hs, heat }; add('hands', g); }
  // zip
  { const g = new THREE.Group(); g.add(box(2.2, 3.2, 0.06, M(0x2c3e50), 0, 2, 0)); for (let i = 0; i < 26; i++) { g.add(box(0.12, 0.06, 0.08, M(0xd8c060), (i % 2 ? 0.06 : -0.06), 0.5 + i * 0.11, 0.05)); } const slider = box(0.3, 0.3, 0.14, M(0xb8b8b8), 0, 1.9, 0.1); g.add(slider); const pull = box(0.12, 0.35, 0.05, M(0xb8b8b8), 0, 1.65, 0.17); g.add(pull); g.userData = { slider, pull }; add('zip', g); }
  // knot
  { const g = new THREE.Group(); const k = new THREE.Mesh(new THREE.TorusKnotGeometry(0.7, 0.18, 120, 12), M(0xc8a26a)); g.add(k); for (const s of [-1, 1]) g.add(cyl(0.18, 0.18, 2.0, M(0xc8a26a), 10, s * 1.6, 0, 0)); g.children[1].rotation.z = Math.PI / 2; g.children[2].rotation.z = Math.PI / 2; g.position.set(0, 2.0, 0); g.userData = { k }; add('knot', g); }
  // screw
  { const g = new THREE.Group(); g.add(box(2.4, 1.0, 1.4, M(0x8a6a4a), 0, 0.5, 0)); const sc = new THREE.Group(); sc.add(cyl(0.3, 0.3, 0.12, M(0xb8b8b8), 16, 0, 1.06, 0)); sc.add(box(0.5, 0.04, 0.08, M(0x333333), 0, 1.13, 0)); g.add(sc); const drv = new THREE.Group(); drv.add(cyl(0.05, 0.05, 1.0, M(0x9aa1a8), 8, 0, 1.65, 0)); drv.add(cyl(0.16, 0.16, 0.8, M(0xc0392b), 12, 0, 2.5, 0)); g.add(drv); g.userData = { sc, drv }; add('screw', g); }
  function FABM() { return M(0xe0a526); }
  const S = { scene, cam, key, P };
  S.update = (t, c) => {
    const prop = c.prop || 'dial'; Object.entries(P).forEach(([k, g]) => g.visible = k === prop); key.target.position.copy(P[prop].position); key.target.updateMatrixWorld();
    const u = P[prop].userData;
    if (prop === 'dial') { const v = c.dialV ?? 0; const br = c.dialBreak ?? 0; u.needle.rotation.z = -(Math.PI * (0.75 + 1.5 * Math.min(v, 500) / 500) + Math.PI / 2); if (br > 0) { u.needle.position.set(br * 1.5, br * 2 - br * br * 3, br * 1.2); u.needle.rotation.z += br * 12; } else u.needle.position.set(0, 0, 0); u.hand.scale.set(1, 1.3 - (c.squeeze ?? 0) * 0.25, 0.8); u.hand.position.x = 1.15 + Math.sin(t * 30) * 0.01 * (c.squeeze ?? 0); }
    if (prop === 'heart') { const b = 1 + 0.06 * Math.max(0, Math.sin(t * 7.5)); u.h.scale.setScalar(b); }
    if (prop === 'muscle') { const d = u.d; d.pose('stand', t); d.armL.rotation.set(0, 0, 1.6); d.armR.rotation.set(0, 0, -1.6); const f = c.flex ?? 0; d.armL.rotation.x = -0.2 * f; d.armR.rotation.x = -0.2 * f; [d.armL, d.armR].forEach(a => a.children[0].scale.set(1 + f * 0.9, 1, 1 + f * 0.9)); u.glow.material.opacity = 0.5 * f; d.mouth.scale.y = 1 + f; }
    if (prop === 'pole') { const d = u.d, gh = u.ghost; d.pose('stand', t); gh.pose('stand', t); const h = c.poleH ?? 0; d.g.position.y = h; if (h > 0.05) { d.armL.rotation.x = -2.8; d.armR.rotation.x = -2.8; d.legL.rotation.x = -0.4; d.legR.rotation.x = 0.3; } gh.g.visible = !!c.ghost; gh.g.position.y = c.ghostH ?? 0.4; }
    if (prop === 'tooth') { const k = c.carK ?? 1; u.car.position.set(0, 2.62 + (1 - easeOut(k)) * 4, 0); u.car.rotation.y = Math.PI / 2 + (1 - k) * 1.5; }
    if (prop === 'bars') { const k = c.barsK ?? 1; u.bars.forEach((b, i) => { const h = i === 0 ? lerp(1, 6, k) : 1; b.scale.y = h; b.position.y = h / 2; }); }
    if (prop === 'bone') { const cr = c.crack ?? 0; u.halves[0].rotation.z = -0.5 * easeOut(cr); u.halves[1].rotation.z = 0.5 * easeOut(cr); u.halves[0].position.x = -0.15 * cr; u.halves[1].position.x = -0.15 * cr; u.crackFlash.material.opacity = cr > 0 && cr < 0.6 ? 0.9 * (1 - cr / 0.6) : 0; }
    if (prop === 'brain') { const s = c.strain ?? 0; u.knob.rotation.z = Math.sin(t * 40) * 0.25 * s; P.brain.position.x = Math.sin(t * 33) * 0.04 * s; P.brain.children.slice(0, 14).forEach((b, i) => b.position.y = 0.25 + Math.sin(i * 1.3) * 0.25 + Math.sin(t * 20 + i) * 0.03 * s); }
    if (prop === 'brake') { const k = c.brakeK ?? 1; u.ghost.position.z = -14 * easeOut(Math.min(1, k * 1.2)); u.car.position.set(0.0, 0, -7 * easeOut(Math.min(1, k * 1.6))); u.ghost.position.x = 0; u.car.position.x = 0; u.ghost.visible = !!c.ghost; }
    if (prop === 'fuel') { const k = c.fuelK ?? 0; u.seg.geometry.dispose(); u.seg.geometry = new THREE.CylinderGeometry(1.32, 1.32, 0.44, 48, 1, false, 0, Math.PI * 2 * lerp(1 / 3, 2 / 3, k)); }
    if (prop === 'hands') { const r = Math.sin(t * 18); u.hs[0].position.y = 2.0 + r * 0.12; u.hs[1].position.y = 2.0 - r * 0.12; u.heat.material.opacity = (c.heat ?? 0) * 0.85; u.heat.scale.setScalar(2 + (c.heat ?? 0) * 2); }
    if (prop === 'zip') { const k = c.zipK ?? 0; const y = 0.6 + Math.min(k, 0.5) * 2.4; u.slider.position.y = y + (k > 0.5 ? Math.sin(t * 25) * 0.02 : 0); u.pull.position.y = y - 0.25; }
    if (prop === 'knot') { const k = c.knotK ?? 0; u.k.scale.setScalar(lerp(1, 0.6, k)); u.k.rotation.z = t * 0.3; }
    if (prop === 'screw') { const sh = c.shake ?? 0; u.drv.rotation.y = Math.sin(t * 30) * 0.3 * sh; u.sc.rotation.y = 0; }
  };
  return S;
}
