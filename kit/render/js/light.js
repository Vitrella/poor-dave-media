import * as THREE from 'three';
import { mat, box, cyl, ico, cone, plane, rng, lerp, clamp, smooth, easeOut, easeIn, prog, emis, canvasTex, texMat, bakeStatic, softSprite, glowSprite, makeStars, checkerTex, stripeTex } from './util.js';
import { M, Person, makeCar, makeTree, makeBuilding, makeLamp, makeSandwich, makeEarth, makeFlame, updateFlame, makePigeon, flapPigeon } from './kit.js';
import { baseSet } from './sets.js';
import { makeDave, makePriya } from './water.js';
import { buildStudio, buildCity } from './world.js';
import { lbl } from './ice.js';
import { face } from './plastic.js';

const GOLD = 0xf2c85b;
export function dynLbl(w, h, o = {}) { const c = document.createElement('canvas'); c.width = o.pw || 512; c.height = o.ph || 128; const ctx = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.LinearFilter; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !o.bg, side: THREE.DoubleSide })); m.userData.last = null; m.userData.set = (text) => { if (text === m.userData.last) return; m.userData.last = text; ctx.clearRect(0, 0, c.width, c.height); if (o.bg) { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, c.width, c.height); } ctx.fillStyle = o.fg || '#fff'; ctx.font = o.font || 'bold 64px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, c.width / 2, c.height / 2); t.needsUpdate = true; }; m.userData.set(o.text || ''); return m; }
// eyes: find the white eye meshes of a Person (colour 0xf8f6f2) and the pupils (p.eyes)
function whites(p) { if (p._wh) return p._wh; const w = []; p.neck.children.forEach(o => { if (o.isMesh && o.material && o.material.color && o.material.color.getHex() === 0xf8f6f2) w.push(o); }); return (p._wh = w); }
export function blink(p, k) { const s = Math.max(0.04, 1 - k); whites(p).forEach(w => w.scale.y = s); p.eyes.forEach(e => e.scale.y = s); }
// hair swept back: rotate the hair cap backwards
function hairBack(p, k) { const cap = p.neck.children.find(o => o.geometry && o.geometry.type === 'SphereGeometry' && o.material === p.parts.hair); if (cap) { cap.rotation.x = -0.55 - 0.7 * k; cap.position.z = -0.02 - 0.08 * k; cap.scale.set(1, 1, 1 + 0.4 * k); } }
export function makeCakeBox(scale = 1) { const g = new THREE.Group(); g.add(box(0.36, 0.14, 0.36, M(0xf6ecdc), 0, 0.07, 0)); g.add(box(0.37, 0.03, 0.08, M(0xd9534f), 0, 0.14, 0)); g.add(box(0.08, 0.03, 0.37, M(0xd9534f), 0, 0.14, 0)); const l = lbl('LEMON', 0.22, 0.07, { bg: '#fff8dc', fg: '#1b1b1b', font: 'bold 72px sans-serif' }); l.position.set(0, 0.08, 0.185); g.add(l); g.scale.setScalar(scale); return g; }
// wrist watch with a dynamic face (text set per frame)
function makeWatch() { const g = new THREE.Group(); g.add(box(0.12, 0.05, 0.15, M(0x1b1b1b), 0, 0, 0)); const d = dynLbl(0.1, 0.06, { bg: '#cfcac0', fg: '#111', font: 'bold 60px monospace', text: '18:58:00', pw: 512, ph: 300 }); d.position.set(0, 0, 0.078); d.rotation.z = Math.PI; g.add(d); g.userData.set = (s) => d.userData.set(s); return g; }
// Dave with cake box + watch; poses: run(t), fly(t), stand(t), door, place
export function makeDaveL() {
  const d = makeDave(); const cake = makeCakeBox(0.75); d.armL.add(cake); cake.position.set(0.1, -0.62, 0.2); cake.rotation.x = -0.2; d.cake = cake;
  const w = makeWatch(); d.armR.add(w); w.position.set(0, -0.5, 0.0); d.watch = w;
  d.setPose = (name, t = 0, k = 0) => {
    d.pose('stand', t); hairBack(d, 0); d.g.rotation.set(0, d.g.rotation.y, 0);
    if (name === 'run') { const w0 = Math.sin(t * 11); d.legL.rotation.x = w0 * 0.9; d.legR.rotation.x = -w0 * 0.9; d.legL.userData.knee.rotation.x = Math.max(0, -w0) * 1.2; d.legR.userData.knee.rotation.x = Math.max(0, w0) * 1.2; d.hips.position.y = 0.86 + Math.abs(Math.cos(t * 11)) * 0.05; d.torso.rotation.x = 0.25; d.armL.rotation.x = -1.1; d.armL.rotation.z = 0.35; d.armR.rotation.x = -1.3 + w0 * 0.2; d.armR.rotation.z = -0.4; d.neck.rotation.x = -0.15; }
    if (name === 'fly') { hairBack(d, 1); d.legL.rotation.x = 0.1 + Math.sin(t * 2) * 0.05; d.legR.rotation.x = -0.05; d.armR.rotation.x = -3.0; d.armR.rotation.z = -0.15; d.armL.rotation.x = 0.25; d.armL.rotation.z = 0.15; d.neck.rotation.x = -0.35; d.torso.rotation.x = 0.0; }
    if (name === 'door') { d.armL.rotation.x = -1.0; d.armL.rotation.z = 0.35; d.armR.rotation.x = -0.3; d.neck.rotation.x = 0.05; hairBack(d, 0.9); }
    if (name === 'walk') { const w0 = Math.sin(t * 6); d.legL.rotation.x = w0 * 0.5; d.legR.rotation.x = -w0 * 0.5; d.legL.userData.knee.rotation.x = Math.max(0, -w0) * 0.9; d.legR.userData.knee.rotation.x = Math.max(0, w0) * 0.9; d.armL.rotation.x = -1.0; d.armL.rotation.z = 0.35; d.armR.rotation.x = w0 * 0.3; hairBack(d, 0.9); }
    if (name === 'place') { d.armL.rotation.x = -0.9 - k * 0.3; d.armL.rotation.z = 0.2; d.armR.rotation.x = -0.7; d.torso.rotation.x = 0.15 * k; d.neck.rotation.x = 0.35; hairBack(d, 0.9); }
    if (name === 'stand') { d.armL.rotation.x = -0.75; d.armL.rotation.z = 0.35; }
  };
  return d;
}
function wallClock(r = 0.32) { const g = new THREE.Group(); const faceT = canvasTex(256, 256, (ctx, W, H) => { ctx.fillStyle = '#d8d2c4'; ctx.beginPath(); ctx.arc(128, 128, 124, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#2b2d33'; ctx.lineWidth = 8; ctx.stroke(); ctx.fillStyle = '#2b2d33'; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.fillRect(128 + Math.cos(a) * 104 - 3, 128 + Math.sin(a) * 104 - 3, 6, 6); } }); faceT.magFilter = THREE.LinearFilter; const f = new THREE.Mesh(new THREE.CircleGeometry(r, 32), new THREE.MeshBasicMaterial({ map: faceT })); g.add(f); g.add(cyl(r * 1.05, r * 1.05, 0.04, M(0x4a3222), 32, 0, 0, -0.03)); g.children[1].rotation.x = Math.PI / 2; const hh = box(0.03, r * 0.55, 0.012, M(0x1b1b1b), 0, r * 0.25, 0.012); const hg = new THREE.Group(); hg.add(hh); g.add(hg); const mh = box(0.022, r * 0.85, 0.012, M(0x1b1b1b), 0, r * 0.4, 0.016); const mg = new THREE.Group(); mg.add(mh); g.add(mg); const sh = box(0.012, r * 0.9, 0.012, M(0xc0392b), 0, r * 0.42, 0.02); const sg = new THREE.Group(); sg.add(sh); g.add(sg); g.userData.set = (hours) => { const h = hours % 12, mnt = (hours * 60) % 60, sec = (hours * 3600) % 60; hg.rotation.z = -h / 12 * Math.PI * 2; mg.rotation.z = -mnt / 60 * Math.PI * 2; sg.rotation.z = -sec / 60 * Math.PI * 2; }; return g; }

// ======================= RESTAURANT (Italian place; evening → night → dawn → morning) =======================
// ctx: mode ('evening'|'night'|'dawn'|'morning'), clock (hours, e.g. 18.97), priya ('watch'|'phone'|'sleep'|'look'|'up'|'pat'|'sit'), parents ('sit'|'sleep'|'look'), waiter ('stand'|'bread'|'flip'|'croissant'|'none'), dave (null|'door'|'walk'|'place'|'sit'), daveK, sign ('dinner'|'breakfast'), flipK, candle (0..1), blow (0..1), cake (bool), flash
export function buildRest() {
  const S = baseSet({ shadowExtent: 8, fogNear: 60, fogFar: 200, shadowRes: 2048 }); const { scene } = S; const ST = new THREE.Group(); scene.add(ST);
  S.sunOffset = new THREE.Vector3(3, 7, 5); S.sun.intensity = 0.9; S.hemi.intensity = 0.9; const warm = new THREE.PointLight(0xffd9a0, 1.2, 12, 1.6); warm.position.set(0, 2.9, 0.5); scene.add(warm); const amb = new THREE.AmbientLight(0xffe8d0, 0.35); scene.add(amb);
  const woodT = canvasTex(256, 256, (ctx, W, H) => { ctx.fillStyle = '#8a5a3a'; ctx.fillRect(0, 0, W, H); const r = rng(5); for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#7a4e30' : '#95654a'; ctx.fillRect(0, i * 32, W, 30); } ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 60; i++) ctx.fillRect(r.f() * W, r.f() * H, 2 + r.f() * 30, 1); }); woodT.repeat.set(4, 4); const floor = plane(12, 12, texMat({ map: woodT }), 0, 0, 0); floor.receiveShadow = true; scene.add(floor);
  const wallM = M(0xe9d7b8); ST.add(box(12, 3.4, 0.12, wallM, 0, 1.7, -3.0)); ST.add(box(0.12, 3.4, 10, wallM, -4.5, 1.7, 0)); ST.add(box(0.12, 3.4, 10, M(0xb84a3a), 4.5, 1.7, 0)); ST.add(plane(12, 12, M(0xf6efe2), 0, 3.4, 0, Math.PI / 2));
  // terracotta dado + skirting
  ST.add(box(12, 0.9, 0.14, M(0xb84a3a), 0, 0.45, -2.99)); ST.add(box(0.14, 0.9, 10, M(0xb84a3a), -4.49, 0.45, 0));
  // window on the back wall (sky plane changes with mode) + frame + street silhouette
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.5), new THREE.MeshBasicMaterial({ color: 0xffb070 })); sky.position.set(-1.2, 1.9, -2.93); scene.add(sky);
  const frame = M(0x4a3222); ST.add(box(2.8, 0.08, 0.1, frame, -1.2, 2.68, -2.9)); ST.add(box(2.8, 0.08, 0.1, frame, -1.2, 1.12, -2.9)); ST.add(box(0.08, 1.6, 0.1, frame, -2.55, 1.9, -2.9)); ST.add(box(0.08, 1.6, 0.1, frame, 0.15, 1.9, -2.9)); ST.add(box(0.06, 1.5, 0.08, frame, -1.2, 1.9, -2.9));
  const sil = new THREE.Group(); for (let i = 0; i < 6; i++) { sil.add(box(0.36, 0.3 + (i % 3) * 0.25, 0.05, M(0x3a2a3a), -2.3 + i * 0.45, 1.3 + (0.3 + (i % 3) * 0.25) / 2, -2.94)); } scene.add(sil);
  const streetLamp = glowSprite(0xffd98a, 0.5, 0.9); streetLamp.position.set(-0.6, 2.1, -2.92); scene.add(streetLamp);
  // door on the right wall
  const door = new THREE.Group(); door.add(box(0.08, 2.2, 1.0, M(0x4a3222), 0, 1.1, 0)); door.add(box(0.1, 0.5, 0.5, mat(0xcfe8ff, { transparent: true, opacity: 0.5 }), 0, 1.6, 0)); door.add(ico(0.04, M(0xd8c060), 0, -0.07, 1.0, 0.35)); door.position.set(4.44, 0, -0.5); scene.add(door); const doorLight = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.2), new THREE.MeshBasicMaterial({ color: 0xffd0a0 })); doorLight.rotation.y = -Math.PI / 2; doorLight.position.set(4.47, 1.1, -0.5); doorLight.visible = false; scene.add(doorLight);
  // clock on the back wall
  const clock = wallClock(0.34); clock.position.set(0.9, 2.45, -2.92); scene.add(clock);
  // chalkboard easel
  const easel = new THREE.Group(); easel.add(box(0.9, 0.7, 0.04, M(0x1f2a24), 0, 1.25, 0)); easel.add(box(0.98, 0.78, 0.03, M(0x6b4a2b), 0, 1.25, -0.01)); for (const sx of [-0.4, 0.4]) { const leg = box(0.04, 1.6, 0.04, M(0x6b4a2b), sx, 0.8, -0.1); leg.rotation.x = 0.12; easel.add(leg); } const sD = lbl('REHEARSAL DINNER · 19:00', 0.84, 0.17, { fg: '#f4efe4', font: 'bold 60px sans-serif', pw: 1024 }); sD.position.set(0, 1.35, 0.03); easel.add(sD); const sD2 = lbl('PRIYA & DAVE', 0.6, 0.14, { fg: '#f2c85b', font: 'bold 70px sans-serif' }); sD2.position.set(0, 1.12, 0.03); easel.add(sD2); const sB = lbl('REHEARSAL BREAKFAST · 04:44', 0.84, 0.17, { fg: '#f4efe4', font: 'bold 56px sans-serif', pw: 1024 }); sB.position.set(0, 1.35, 0.03); sB.visible = false; easel.add(sB); easel.position.set(2.9, 0, -1.9); easel.rotation.y = -0.5; scene.add(easel);
  // main table (2.0 x 1.0) at origin, head seats at x = ±1.3
  const tbl = (x, z, w, d, ry = 0) => { const g = new THREE.Group(); g.add(box(w, 0.05, d, texMat({ map: checkerTex('#c0392b', '#f7f3ea', 10), roughness: 1 }), 0, 0.75, 0)); g.add(box(w - 0.3, 0.04, d - 0.3, M(0x8a6a4a), 0, 0.71, 0)); g.add(cyl(0.05, 0.14, 0.7, M(0x3a3a3a), 8, 0, 0.35, 0)); g.position.set(x, 0, z); g.rotation.y = ry; return g; };
  scene.add(tbl(0, 0, 2.0, 1.0));
  const chair = (x, z, ry) => { const g = new THREE.Group(); g.add(box(0.44, 0.05, 0.44, M(0x4a3222), 0, 0.46, 0)); g.add(box(0.44, 0.5, 0.05, M(0x4a3222), 0, 0.74, -0.2)); for (const sx of [-0.19, 0.19]) for (const sz of [-0.19, 0.19]) g.add(box(0.04, 0.46, 0.04, M(0x4a3222), sx, 0.23, sz)); g.position.set(x, 0, z); g.rotation.y = ry; ST.add(g); return g; };
  chair(-0.5, -0.85, 0); chair(0.5, -0.85, 0); chair(-1.35, 0, Math.PI / 2); const daveChair = chair(1.35, 0, -Math.PI / 2); chair(0.0, 0.85, Math.PI);
  // table dressing: plates, glasses, bread, candle, wine
  const plate = (x, z) => { ST.add(cyl(0.14, 0.14, 0.015, M(0xf4f4f4), 20, x, 0.785, z)); };
  plate(-0.5, -0.3); plate(0.5, -0.3); plate(-0.95, 0); plate(0.95, 0); plate(0, 0.3);
  const glass = (x, z) => { const g = cyl(0.04, 0.03, 0.14, mat(0xcfe8ff, { transparent: true, opacity: 0.5 }), 8, x, 0.85, z); scene.add(g); return g; }; glass(-0.3, -0.3); glass(0.7, -0.3); glass(-0.95, 0.25); glass(0.95, -0.25); glass(0.2, 0.3);
  const bottle = cyl(0.04, 0.045, 0.3, M(0x2a4a2a), 8, 0.2, 0.93, -0.1); scene.add(bottle); scene.add(cyl(0.015, 0.02, 0.1, M(0x2a4a2a), 8, 0.2, 1.12, -0.1));
  const candleM = cyl(0.025, 0.025, 0.22, M(0xfff6dc), 8, -0.3, 0.89, 0.05); scene.add(candleM); const cFlame = makeFlame(0.04, 0.07); cFlame.position.set(-0.3, 1.0, 0.05); cFlame.userData.light.intensity = 0.5; scene.add(cFlame);
  const basket = new THREE.Group(); basket.add(cyl(0.16, 0.13, 0.08, M(0xb08a4e), 10, 0, 0.04, 0)); for (let i = 0; i < 4; i++) basket.add(ico(0.06, M(0xe0b06a), 1, (i - 1.5) * 0.06, 0.1, (i % 2) * 0.04)); basket.position.set(0.6, 0.78, 0.15); basket.visible = false; scene.add(basket);
  const croissants = new THREE.Group(); for (let i = 0; i < 3; i++) { const c = ico(0.07, M(0xd9a05a), 1, (i - 1) * 0.16, 0.82, 0.3); c.scale.set(1.5, 0.7, 1); croissants.add(c); } croissants.visible = false; scene.add(croissants);
  const coffee = cyl(0.045, 0.04, 0.09, M(0xffffff), 10, -0.5, 0.83, -0.25); coffee.visible = false; scene.add(coffee);
  const cakeOn = makeCakeBox(1.0); cakeOn.position.set(0.95, 0.775, 0.0); cakeOn.visible = false; scene.add(cakeOn);
  // napkins that blow away
  const napkins = []; for (let i = 0; i < 4; i++) { const n = plane(0.18, 0.18, M(0xfafafa), -0.6 + i * 0.45, 0.79, -0.05 + (i % 2) * 0.25); n.userData.p0 = n.position.clone(); scene.add(n); napkins.push(n); }
  // background tables with couples (static)
  [[-3.3, -1.9, 0.4], [-3.5, 2.5, -0.3], [2.6, 1.9, 0.6]].forEach(([x, z, ry], i) => { ST.add(tbl(x, z, 1.1, 1.1, ry)); for (let k = 0; k < 2; k++) { const p = new Person({ seed: 700 + i * 2 + k, dress: k === 1, hairStyle: k ? 'long' : 'short', shirt: [0x4a7fb5, 0x6fa36b, 0x9b7bb8, 0x3aa5a0, 0xd9534f, 0x2f3b4e][i * 2 + k] }); const a = ry + k * Math.PI; p.g.position.set(x + Math.sin(a) * 0.75, 0.02, z + Math.cos(a) * 0.75); p.g.rotation.y = a + Math.PI; p.pose('sit'); ST.add(p.g); } const cm = cyl(0.02, 0.02, 0.18, M(0xfff6dc), 6, x, 0.87, z); ST.add(cm); });
  // paintings + plant + bar
  ST.add(box(0.9, 0.7, 0.04, M(0x6b4a2b), -3.6, 2.0, -2.95)); ST.add(box(0.8, 0.6, 0.02, M(0x5aa0d8), -3.6, 2.0, -2.93)); ST.add(box(0.3, 0.25, 0.01, M(0xe8c48a), -3.6, 1.95, -2.92));
  const pot = cyl(0.25, 0.2, 0.4, M(0xb84a3a), 10, -3.9, 0.2, -2.4); ST.add(pot); for (let i = 0; i < 6; i++) { const lf = box(0.08, 0.6, 0.02, M(0x3f7a35), -3.9 + Math.cos(i) * 0.15, 0.7, -2.4 + Math.sin(i) * 0.15); lf.rotation.z = Math.cos(i) * 0.5; lf.rotation.x = Math.sin(i) * 0.4; ST.add(lf); }
  ST.add(box(2.4, 1.0, 0.6, M(0x4a3222), 3.0, 0.5, 2.6)); ST.add(box(2.5, 0.06, 0.7, M(0xd8c8a8), 3.0, 1.03, 2.6)); for (let i = 0; i < 5; i++) ST.add(cyl(0.035, 0.04, 0.28, M([0x2a4a2a, 0x7a2a2a, 0x2a4a2a, 0xd8c060, 0x7a2a2a][i]), 8, 2.2 + i * 0.4, 1.2, 2.5));
  bakeStatic(ST, scene);
  // people
  const priya = makePriya(); priya.g.position.set(-0.5, 0.02, -0.72); priya.g.rotation.y = 0; scene.add(priya.g);
  const mum = new Person({ seed: 811, skin: 0xc68642, shirt: 0x6b3fa0, hair: 0x7a7a7a, dress: true, hairStyle: 'bun', scale: 0.95 }); mum.g.position.set(0.5, 0.02, -0.72); scene.add(mum.g);
  const dad = new Person({ seed: 812, skin: 0xc68642, shirt: 0xf5f1e6, pants: 0x2f3b4e, hair: 0x7a7a7a, hairStyle: 'bald', scale: 1.0 }); dad.g.position.set(-1.22, 0.02, 0); dad.g.rotation.y = Math.PI / 2; scene.add(dad.g);
  const specs = box(0.2, 0.05, 0.03, M(0x1b1b1b), 0, 0.2, 0.17); dad.neck.add(specs); const tash = box(0.09, 0.025, 0.02, M(0x7a7a7a), 0, 0.14, 0.165); dad.neck.add(tash);
  const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), texMat({ map: stripeTex('#2b5c9e', '#f4f4f4', 6) })); scarf.position.set(0, 0.55, 0.02); dad.torso.add(scarf);
  const suitcase = box(0.45, 0.6, 0.2, M(0x3b4a6b), -1.9, 0.3, 0.5); scene.add(suitcase); const tag = lbl('LEICESTER', 0.26, 0.08, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 60px sans-serif' }); tag.position.set(-1.88, 0.55, 0.61); scene.add(tag);
  const waiter = new Person({ seed: 813, shirt: 0xffffff, pants: 0x1b1b1b, hair: 0x111111, skin: 0xe0ac7e, hairStyle: 'short' }); waiter.g.position.set(1.8, 0.02, -1.6); waiter.g.rotation.y = -0.6; scene.add(waiter.g); const apron = box(0.46, 0.5, 0.02, M(0x1b1b1b), 0, 0.15, 0.14); waiter.torso.add(apron); const tray = cyl(0.2, 0.2, 0.02, M(0xd0d0d0), 16, 0, -0.6, 0.12); waiter.armL.add(tray);
  const dave = makeDaveL(); dave.g.visible = false; scene.add(dave.g);
  const sunrise = new THREE.PointLight(0xffc080, 0, 9, 1.4); sunrise.position.set(-1.2, 1.9, -2.5); scene.add(sunrise);
  const SKYC = { evening: 0xff9a50, night: 0x0d1830, dawn: 0xf59a8a, morning: 0xbfe3ff };
  const S2 = S; S2.actors = { priya, mum, dad, waiter, dave, clock };
  S.update = (t, c) => {
    const mode = c.mode || 'evening'; const dk = { evening: 0.45, night: 1.0, dawn: 0.75, morning: 0.0 }[mode]; S.setSky(dk);
    sky.material.color.setHex(SKYC[mode]); if (c.flash) sky.material.color.lerp(new THREE.Color(0xffffff), Math.min(1, c.flash * 2));
    warm.intensity = { evening: 1.2, night: 0.6, dawn: 0.5, morning: 0.8 }[mode]; amb.intensity = { evening: 0.35, night: 0.12, dawn: 0.25, morning: 0.5 }[mode]; S.hemi.intensity = { evening: 0.9, night: 0.35, dawn: 0.6, morning: 1.1 }[mode]; S.sun.intensity = { evening: 0.9, night: 0.15, dawn: 0.5, morning: 1.4 }[mode];
    sunrise.intensity = mode === 'dawn' ? 1.1 : mode === 'morning' ? 0.6 : 0; streetLamp.material.opacity = mode === 'morning' ? 0 : 0.9;
    clock.userData.set(c.clock ?? 18.97);
    const cd = c.candle ?? 1; candleM.scale.y = Math.max(0.1, cd); candleM.position.y = 0.78 + 0.11 * Math.max(0.1, cd); cFlame.position.y = 0.78 + 0.22 * Math.max(0.1, cd) + 0.0; updateFlame(cFlame, t, cd > 0.05 ? 1 : 0);
    // priya
    const pm = c.priya || 'watch'; priya.pose('sit'); priya.g.position.set(-0.5, 0.02, -0.72); priya.torso.rotation.set(0.04, 0, 0); priya.neck.rotation.set(0, 0, 0);
    if (pm === 'watch') { priya.armL.rotation.x = -1.2; priya.armL.rotation.z = 0.6; priya.neck.rotation.x = 0.35; priya.neck.rotation.y = 0.3; }
    if (pm === 'phone') { priya.armR.rotation.x = -1.4; priya.armR.rotation.z = -0.3; priya.neck.rotation.x = 0.45; }
    if (pm === 'sleep') { priya.torso.rotation.x = 0.9; priya.armL.rotation.x = -1.9; priya.armR.rotation.x = -1.9; priya.armL.rotation.z = 0.3; priya.armR.rotation.z = -0.3; priya.neck.rotation.x = 0.5; priya.neck.rotation.z = 0.5; }
    if (pm === 'look') { priya.neck.rotation.y = -0.9; priya.neck.rotation.x = -0.05; }
    if (pm === 'up') { const k = c.upK ?? 1; priya.torso.rotation.x = lerp(0.9, 0.1, k); priya.armL.rotation.x = lerp(-1.9, -0.6, k); priya.armR.rotation.x = lerp(-1.9, -0.6, k); priya.neck.rotation.x = lerp(0.5, -0.05, k); priya.neck.rotation.y = lerp(0, -0.8, k); priya.neck.rotation.z = lerp(0.5, 0, k); }
    if (pm === 'pat') { priya.armR.rotation.x = -1.6 + Math.sin(t * 6) * 0.08; priya.armR.rotation.z = -1.1; priya.neck.rotation.y = -0.6; priya.neck.rotation.x = 0.2; }
    face(priya, { wide: c.priyaWide ?? 0, open: c.priyaOpen ?? 0, smile: !!c.priyaSmile }); blink(priya, pm === 'sleep' ? 1 : 0);
    // parents
    const pa = c.parents || 'sit'; [mum, dad].forEach((p, i) => { p.pose('sit'); p.torso.rotation.set(0.04, 0, 0); p.neck.rotation.set(0, 0, 0); if (pa === 'sleep') { p.neck.rotation.x = 0.7; p.neck.rotation.z = i ? -0.3 : 0.3; p.torso.rotation.x = 0.25; } if (pa === 'look') { p.neck.rotation.y = i ? -0.5 : -0.8; } if (pa === 'wave') { p.armR.rotation.x = -2.3; p.armR.rotation.z = -0.4; } blink(p, pa === 'sleep' ? 1 : 0); face(p, { smile: pa === 'look' && !!c.parentsSmile }); });
    mum.g.position.set(0.5, 0.02, -0.72); dad.g.position.set(-1.22, 0.02, 0); dad.g.rotation.y = Math.PI / 2; dad.neck.rotation.y += pa === 'look' ? -0.5 : 0;
    // waiter
    const wm = c.waiter || 'stand'; waiter.g.visible = wm !== 'none'; waiter.pose('stand', t); waiter.g.position.set(1.8, 0.02, -1.6); waiter.g.rotation.y = -0.6; waiter.armL.rotation.x = -1.4; waiter.armL.rotation.z = 0.2;
    if (wm === 'bread') { const k = c.waiterK ?? 0; waiter.g.position.set(lerp(1.8, 1.0, k), 0.02, lerp(-1.6, -0.6, k)); waiter.pose('walk', t * 1.2); waiter.armL.rotation.x = -1.4; waiter.g.rotation.y = -0.9; basket.visible = k > 0.8; }
    if (wm === 'flip') { waiter.g.position.set(2.45, 0.02, -1.35); waiter.g.rotation.y = -2.2; waiter.armR.rotation.x = -1.9; waiter.armR.rotation.z = -0.4; waiter.armL.rotation.x = -0.4; }
    if (wm === 'croissant') { waiter.g.position.set(-0.05, 0.02, -1.55); waiter.g.rotation.y = 0.1; waiter.armL.rotation.x = -1.2; waiter.armL.rotation.z = 0.4; }
    face(waiter, { smile: true });
    const fk = c.flipK ?? (c.sign === 'breakfast' ? 1 : 0); easel.children[4].visible = fk < 0.5; easel.children[6].visible = fk >= 0.5; easel.children[4].rotation.x = fk * Math.PI; easel.children[6].rotation.x = (1 - fk) * Math.PI;
    basket.visible = basket.visible || mode === 'night' || mode === 'dawn' || mode === 'morning'; croissants.visible = mode === 'morning' || mode === 'dawn' && !!c.croissants; coffee.visible = mode === 'morning' || (mode === 'dawn' && !!c.croissants);
    // dave
    const dm = c.dave || null; dave.g.visible = !!dm; doorLight.visible = dm === 'door' || dm === 'walk';
    if (dm === 'door') { dave.g.position.set(3.9, 0.02, -0.5); dave.g.rotation.y = -Math.PI / 2; dave.setPose('door', t); door.children[0].rotation.y = -1.3; door.children[0].position.set(0.35, 1.1, -0.35); }
    else if (dm === 'walk') { const k = c.daveK ?? 0; dave.g.position.set(lerp(3.9, 1.95, k), 0.02, lerp(-0.5, 0.0, k)); dave.g.rotation.y = -Math.PI / 2; dave.setPose('walk', t); door.children[0].rotation.y = -1.3; door.children[0].position.set(0.35, 1.1, -0.35); }
    else if (dm === 'place') { const k = c.daveK ?? 0; dave.g.position.set(1.95, 0.02, 0.0); dave.g.rotation.y = -Math.PI / 2; dave.setPose('place', t, k); dave.cake.visible = k < 0.5; cakeOn.visible = k >= 0.5; }
    else if (dm === 'sit') { dave.g.position.set(1.35, 0.02, 0.0); dave.g.rotation.y = -Math.PI / 2; dave.pose('sit'); dave.armL.rotation.x = -0.6; dave.armR.rotation.x = -0.6; hairBack(dave, 0.9); dave.cake.visible = false; cakeOn.visible = true; }
    else { door.children[0].rotation.y = 0; door.children[0].position.set(0, 1.1, 0); }
    if (dm !== 'place' && dm !== 'sit') { dave.cake.visible = true; cakeOn.visible = !!c.cake; }
    face(dave, { wide: c.daveWide ?? 0, open: c.daveOpen ?? 0 }); dave.watch.userData.set(c.watch || '18:58:51');
    // blow (napkins fly when Dave passes outside)
    const bl = c.blow ?? 0; napkins.forEach((n, i) => { const p0 = n.userData.p0; n.position.set(p0.x + bl * (1.5 + i * 0.4), p0.y + bl * (0.8 + i * 0.2) * (1 - bl * 0.5), p0.z + bl * (0.3 - i * 0.2)); n.rotation.set(-Math.PI / 2 + bl * 2 * (i % 2 ? 1 : -1), bl * 1.5, bl * i); });
    if (bl > 0) { [priya, mum].forEach(p => hairBack(p, bl)); } else { [priya, mum].forEach(p => hairBack(p, 0)); }
  };
  return S;
}

// ======================= HIGH STREET (dusk / dawn) =======================
// ctx: mode ('dusk'|'dawn'), dave ('run'|'none'|'arrive'|'skid'|'stand'), daveX, runT, streak (0..1), streakX, flash, arriveK
export function buildStreet() {
  const S = baseSet({ shadowExtent: 40, fogNear: 60, fogFar: 320, shadowRes: 2048 }); const { scene } = S; const ST = new THREE.Group(); scene.add(ST); const r = rng(21);
  S.sunOffset = new THREE.Vector3(-60, 30, 50); S.sun.intensity = 1.4;
  scene.add(plane(400, 400, M(0x5f6f55), 0, -0.02, 0));
  const aT = canvasTex(256, 256, (ctx, W, H) => { ctx.fillStyle = '#3d4148'; ctx.fillRect(0, 0, W, H); const rr = rng(4); for (let i = 0; i < 300; i++) { ctx.fillStyle = rr.f() < 0.5 ? '#343840' : '#4a4f57'; ctx.fillRect(rr.f() * W, rr.f() * H, 3, 3); } }); aT.repeat.set(30, 2); scene.add(plane(400, 9, texMat({ map: aT }), 0, 0, 0));
  const pT = canvasTex(256, 256, (ctx, W, H) => { ctx.fillStyle = '#a9a39a'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = '#8f8a82'; ctx.lineWidth = 4; for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(W, i * 64); ctx.stroke(); } }); pT.repeat.set(60, 1);
  scene.add(plane(400, 4, texMat({ map: pT }), 0, 0.08, -6.5)); scene.add(plane(400, 4, texMat({ map: pT }), 0, 0.08, 6.5)); scene.add(box(400, 0.16, 0.2, M(0x8f8a82), 0, 0.08, -4.5)); scene.add(box(400, 0.16, 0.2, M(0x8f8a82), 0, 0.08, 4.5));
  for (let x = -200; x < 200; x += 6) ST.add(plane(2.5, 0.2, M(0xf2f2f2), x, 0.01, 0));
  // shop fronts along z = -9.5 (facing +z) and z = +9.5
  const cols = ['#c2b8a8', '#b9b0a2', '#9aa4ae', '#d9c7a2', '#8a8f99', '#c89a7a', '#a7a39b'];
  const shop = (x, w, h, col, z, back) => { const g = new THREE.Group(); const b = makeBuilding(w, h, 10, 300 + Math.round(x), { base: col, litRatio: 0.35 }); g.add(b); g.add(box(w * 0.92, 2.4, 0.3, M(0x4a3222), 0, 1.2, 5.1)); g.add(box(w * 0.8, 1.5, 0.05, emis(0xffe2b0, 0.5), 0, 1.35, 5.28)); const awn = box(w * 0.9, 0.08, 1.2, M([0xc0392b, 0x2b5c9e, 0x4e8f5a, 0xd8c060][Math.round(Math.abs(x)) % 4]), 0, 2.5, 5.8); awn.rotation.x = 0.25; g.add(awn); g.position.set(x, 0, z); if (back) g.rotation.y = Math.PI; return g; };
  let x = -60; while (x < 70) { const w = r.range(6, 10); if (Math.abs(x + w / 2 - 12) > 6) ST.add(shop(x + w / 2, w, r.range(7, 14), r.pick(cols), -14.5, false)); x += w + 0.3; }
  x = -60; while (x < 70) { const w = r.range(6, 10); ST.add(shop(x + w / 2, w, r.range(7, 14), r.pick(cols), 14.5, true)); x += w + 0.3; }
  // the restaurant at x = 12 (front face at z = -9.3)
  const rest = new THREE.Group(); const rb = makeBuilding(11, 9, 10, 777, { base: '#e2c9a6', litRatio: 0.4 }); rest.add(rb); rest.add(box(10.4, 2.6, 0.3, M(0xb84a3a), 0, 1.3, 5.1)); rest.add(box(8.6, 1.6, 0.05, emis(0xffd9a0, 0.5, { transparent: true, opacity: 0.4 }), 0, 1.4, 5.28)); for (const sx of [-2.9, 0, 2.9]) rest.add(box(0.14, 1.7, 0.1, M(0x4a3222), sx, 1.4, 5.3)); rest.add(box(10.6, 0.1, 1.4, M(0x4e8f5a), 0, 2.7, 5.8)); rest.children[rest.children.length - 1].rotation.x = 0.22;
  const sign = lbl('DA MARIO · TRATTORIA', 7.0, 0.9, { bg: '#1f2a24', fg: '#f2c85b', font: 'bold 72px sans-serif', pw: 1024 }); sign.position.set(0, 3.5, 5.32); rest.add(sign); const signGlow = glowSprite(0xffd98a, 9, 0.35); signGlow.position.set(0, 3.5, 5.6); rest.add(signGlow);
  const door2 = box(1.2, 2.2, 0.1, M(0x4a3222), 3.6, 1.1, 5.3); rest.add(door2); const dLight = glowSprite(0xffd0a0, 2.5, 0.6); dLight.position.set(3.6, 2.4, 5.7); rest.add(dLight);
  const diners = []; for (let i = 0; i < 3; i++) { const p = new Person({ seed: 760 + i, dress: i === 1, hairStyle: i === 1 ? 'long' : 'short', shirt: i === 1 ? 0xd94f6a : undefined }); p.g.position.set(-2.4 + i * 1.6, 0.1, 4.6); p.g.rotation.y = Math.PI; p.pose('sit'); rest.add(p.g); diners.push(p); }
  rest.position.set(12, 0, -14.5); scene.add(rest); const priyaSil = diners[1];
  // lamps, trees, parked cars, pedestrians
  for (let i = 0; i < 12; i++) { const l = makeLamp(); l.position.set(-55 + i * 10 + (i % 2) * 3, 0, i % 2 ? -8.9 : 8.9); l.scale.setScalar(1.3); ST.add(l); }
  const streetAmb = new THREE.AmbientLight(0xffe0c0, 0.4); scene.add(streetAmb);
  for (let i = 0; i < 8; i++) { const tr = makeTree(500 + i); tr.position.set(-50 + i * 14 + 4, 0, i % 2 ? -7.5 : 7.5); tr.scale.setScalar(0.8); ST.add(tr); }
  const cars = []; for (let i = 0; i < 7; i++) { const c = makeCar(600 + i); c.position.set(-45 + i * 13 + r.range(-2, 2), 0, i % 2 ? -3.2 : 3.2); c.rotation.y = i % 2 ? 0 : Math.PI; ST.add(c); }
  const peds = []; for (let i = 0; i < 7; i++) { const p = new Person({ seed: 780 + i, dress: r.f() < 0.4, hairStyle: r.pick(['short', 'long', 'bun']) }); p.g.position.set(-40 + i * 11, 0.1, i % 2 ? -7.7 : 7.7); p.g.rotation.y = i % 2 ? Math.PI / 2 : -Math.PI / 2; scene.add(p.g); peds.push({ p, x0: p.g.position.x, dir: i % 2 ? 1 : -1 }); }
  const pigeons = []; for (let i = 0; i < 5; i++) { const pg = makePigeon(90 + i); pg.position.set(6 + i * 0.5, 0.1, -5.8 + (i % 2) * 0.4); pg.rotation.y = r.f() * 6; scene.add(pg); pigeons.push(pg); }
  // skyline behind the far row
  for (let i = 0; i < 24; i++) { const b = makeBuilding(r.range(12, 22), r.range(25, 70), r.range(12, 20), 900 + i, { litRatio: 0.3 }); b.position.set(-150 + i * 13, 0, -70 - r.range(0, 50)); ST.add(b); }
  bakeStatic(ST, scene);
  // Dave + streak
  const dave = makeDaveL(); scene.add(dave.g);
  const streak = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false })); streak.rotation.z = Math.PI / 2; scene.add(streak);
  const streakGlow = glowSprite(0xfff0c0, 6, 0); scene.add(streakGlow); const streakHead = glowSprite(0xffffff, 3, 0); scene.add(streakHead);
  const skid = []; for (let i = 0; i < 6; i++) { const s = softSprite(0xaaaaaa, 1.2, 0); scene.add(s); skid.push(s); }
  S.actors = { dave, priyaSil, streak };
  S.update = (t, c) => {
    const mode = c.mode || 'dusk'; S.setSky(mode === 'dusk' ? 0.55 : 0.3); if (mode === 'dawn') { S.sky.material.uniforms.horizon.value.setHex(0xf7b08a); S.sky.material.uniforms.top.value.setHex(0x6a7fb8); scene.fog.color.setHex(0xf0b8a0); S.sun.intensity = 1.0; S.hemi.intensity = 0.9; } else { S.sun.intensity = 1.7; S.hemi.intensity = 1.15; }
    signGlow.material.opacity = mode === 'dusk' ? 0.35 : 0.15;
    peds.forEach((pp, i) => { const span = 60; let x = pp.x0 + pp.dir * 1.1 * t; x = ((x + span) % (2 * span) + 2 * span) % (2 * span) - span; pp.p.g.position.x = x; pp.p.pose('walk', t, { phase: i }); pp.p.g.visible = (mode === 'dusk' || i < 2) && c.peds !== false; });
    pigeons.forEach((pg, i) => { pg.visible = true; if (c.scatter) { const k = clamp((c.scatter - i * 0.05) * 2, 0, 1); pg.position.y = 0.1 + k * 3; pg.position.x = 6 + i * 0.5 + k * 3 * (i % 2 ? 1 : -1); pg.rotation.z = k * 0.4; flapPigeon(pg, t + i, 1.2); } else { pg.position.y = 0.1; pg.rotation.x = Math.sin(t * 5 + i) * 0.08; } });
    diners.forEach((p, i) => { p.pose('sit'); if (i === 1) { p.neck.rotation.y = c.priyaTurn ? 0.9 : 0; p.armL.rotation.x = -1.2; p.armL.rotation.z = 0.6; } });
    const dm = c.dave || 'run'; dave.g.visible = dm !== 'none'; dave.cake.visible = true;
    if (dm === 'run') { const x = c.daveX ?? -6; dave.g.position.set(x, 0.1, -6.2); dave.g.rotation.y = Math.PI / 2; dave.setPose('run', c.runT ?? t); }
    if (dm === 'arrive') { const k = c.arriveK ?? 0; dave.g.position.set(lerp(-20, 14, easeOut(k)), 0.1, -6.2); dave.g.rotation.y = Math.PI / 2; dave.setPose(k < 0.85 ? 'fly' : 'stand', t); dave.g.rotation.x = k < 0.85 ? Math.PI / 2 - 0.2 : 0; dave.g.position.y = k < 0.85 ? 1.2 : 0.1; }
    if (dm === 'skid') { const k = c.arriveK ?? 1; dave.g.position.set(lerp(13.5, 15.6, easeOut(k)), 0.1, -6.2); dave.g.rotation.y = Math.PI / 2; dave.setPose('stand', t); dave.torso.rotation.x = -0.35 * (1 - k); dave.legL.rotation.x = -0.6 * (1 - k); dave.legR.rotation.x = 0.4 * (1 - k); hairBack(dave, 1); }
    if (dm === 'stand') { dave.g.position.set(15.6, 0.1, -6.2); dave.g.rotation.y = Math.PI / 2; dave.setPose('stand', t); hairBack(dave, 0.9); dave.neck.rotation.y = c.daveLook === 'cam' ? -0.5 : 0; }
    face(dave, { wide: c.wide ?? 0, open: c.open ?? 0 }); dave.watch.userData.set(c.watch || '18:58:00');
    const sk = c.streak ?? 0; const sx = c.streakX ?? 0; const L = 40 + sk * 120; streak.scale.set(1, L, 1); streak.position.set(sx, 1.1, -6.2); streak.material.opacity = sk * 0.85; streakGlow.position.set(sx, 1.1, -6.2); streakGlow.material.opacity = sk * 0.7; streakGlow.scale.set(L * 0.9, 5, 1); streakHead.position.set(sx + L / 2 * (c.streakDir ?? 1), 1.1, -6.2); streakHead.material.opacity = sk;
    skid.forEach((s, i) => { const k = c.skidK ?? 0; s.material.opacity = k > 0 ? 0.5 * (1 - k) : 0; s.position.set(13.5 + i * 0.4 + k * 1.5, 0.3 + k * 0.6, -6.2 + (i % 2) * 0.4); s.scale.setScalar(0.8 + k * 1.6); });
  };
  return S;
}
