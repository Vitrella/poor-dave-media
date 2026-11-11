import * as THREE from 'three';
import { mat, box, cyl, ico, cone, plane, rng, lerp, clamp, smooth, easeOut, easeIn, prog, emis, canvasTex, texMat, windowTex, bakeStatic, softSprite, glowSprite, makeStars, checkerTex } from './util.js';
import { M, FAB, Person, makeTree, makeLamp, makeAirliner, makeCar } from './kit.js';
import { baseSet, buildSkyPlane } from './sets.js';
import { makeDave, makePriya, buildOcean } from './water.js';
import { buildCity, buildStudio } from './world.js';
import { buildStreet } from './lions.js';
import { lbl } from './ice.js';
import { mergeGeometries } from '/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';

// ---------- helpers ----------
const whitesOf = (p) => p.neck.children.filter(m => m.isMesh && m.material && m.material.color && m.material.color.getHex() === 0xf8f6f2 && m.geometry.type === 'IcosahedronGeometry');
export function face(p, c = {}) { const W = p._whites || (p._whites = whitesOf(p)); const w = c.wide ?? 0; W.forEach(x => x.scale.set(1 + 0.5 * w, 1 + 0.5 * w, 0.55)); p.mouth.scale.set(1 + 0.5 * (c.open ?? 0), 1 + 3 * (c.open ?? 0) + (c.smile ? 0.3 : 0), 1); }
function dynLbl(w, h, o = {}) { const c = document.createElement('canvas'); c.width = o.pw || 512; c.height = o.ph || 128; const ctx = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.LinearFilter; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !o.bg, side: THREE.DoubleSide })); m.userData.last = null; m.userData.set = (text) => { if (text === m.userData.last) return; m.userData.last = text; ctx.clearRect(0, 0, c.width, c.height); if (o.bg) { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, c.width, c.height); } ctx.fillStyle = o.fg || '#fff'; ctx.font = o.font || 'bold 64px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, c.width / 2, c.height / 2); t.needsUpdate = true; }; m.userData.set(o.text || ''); return m; }
const SUIT = 0x2b3a55, GOLD = 0xf2c85b;
// Dave in the navy polyester suit / in a cotton vest and boxers / the empty suit
function makeDaveSuit() { const d = new Person({ seed: 7, skin: 0xf1c9a5, shirt: SUIT, pants: SUIT, hair: 0x4a2f1f, scale: 1.0 }); const tie = box(0.06, 0.3, 0.02, M(0x8a2a2a), 0, 0.42, 0.13); d.torso.add(tie); const shirtV = box(0.14, 0.2, 0.02, M(0xf4f4f4), 0, 0.5, 0.125); d.torso.add(shirtV); return d; }
function makeDaveVest() { const d = new Person({ seed: 7, skin: 0xf1c9a5, shirt: 0xf4f4f4, pants: 0xf4f4f4, hair: 0x4a2f1f, scale: 1.0, sleeves: false }); const skin = M(0xf1c9a5); [d.legL, d.legR].forEach(l => { l.userData.knee.children[0].material = skin; }); return d; }
function makeSuitEmpty() { const d = makeDaveSuit(); d.neck.visible = false; d.torso.children.forEach(c => { if (c.isGroup) c.children.forEach(x => { if (x.material && x.material.color && x.material.color.getHex() === 0xf1c9a5) x.visible = false; }); }); [d.legL, d.legR].forEach(l => { l.userData.knee.children[1].visible = false; }); return d; }
function sparkle(scene, n = 14, size = 0.25) { const g = new THREE.Group(); const r = rng(3); for (let i = 0; i < n; i++) { const s = softSprite(0xffffff, size * r.range(0.6, 1.4), 0); s.userData = { o: new THREE.Vector3(r.range(-0.4, 0.4), r.range(-0.8, 0.7), r.range(-0.3, 0.3)), d: new THREE.Vector3(r.range(-1, 1), r.range(0.2, 1.2), r.range(-1, 1)) }; g.add(s); } scene.add(g); g.userData.set = (k, pos) => { g.visible = k > 0 && k < 1; if (g.visible) { g.position.copy(pos); g.children.forEach(s => { s.position.copy(s.userData.o).addScaledVector(s.userData.d, k * 0.6); s.material.opacity = 0.9 * (1 - k); }); } }; g.userData.set(-1, new THREE.Vector3()); return g; }

// ======================= TAILOR'S SHOP =======================
// ctx: suit ('on'|'off'|'empty'|'none'), emptyK (0..1 collapse), where ('podium'|'booth'), daveLook ('cam'|'down'|'priya'|'mirror'|'suit'), wide/open/smile, tailor ('measure'|'kneelLook'|'stand'|'shrug'|'point'), priya ('phone'|'look'|'ceiling'|'thumbs'|'clap'), vanish (bool), flash, sparkK, armsCover (bool)
export function buildTailor() {
  const S = baseSet({ shadowExtent: 8, fogNear: 40, fogFar: 160, shadowRes: 2048 }); const { scene } = S; const r = rng(31); const ST = new THREE.Group(); scene.add(ST);
  S.sunOffset = new THREE.Vector3(-3, 7, 6); S.sun.intensity = 1.1; S.hemi.intensity = 1.0; scene.add(new THREE.AmbientLight(0xfff1dc, 0.35));
  scene.add(new THREE.PointLight(0xfff1dc, 1.6, 10, 1.5).translateY(3.0).translateZ(1.0));
  const floorT = checkerTex('#8a6a4a', '#7a5c3e', 16); floorT.repeat.set(1, 1); const floor = plane(16, 16, texMat({ map: floorT }), 0, 0, 1); floor.receiveShadow = true; scene.add(floor);
  const wallM = M(0xe6dfd2);
  ST.add(box(16, 3.4, 0.1, wallM, 0, 1.7, -3.2)); // back wall
  ST.add(box(0.1, 3.4, 12, wallM, -4.8, 1.7, 2)); ST.add(box(0.1, 3.4, 12, wallM, 4.8, 1.7, 2)); // side walls
  ST.add(plane(16, 16, M(0xf4f1ea), 0, 3.4, 1, Math.PI / 2)); // ceiling
  // front window (light) at z=6
  scene.add(plane(5, 2.6, emis(0xd8ecff, 0.9), 0, 1.6, 5.9, 0)); ST.add(box(5.2, 0.1, 0.1, M(0x3a3a3a), 0, 2.95, 5.9)); ST.add(box(5.2, 0.3, 0.1, M(0x3a3a3a), 0, 0.15, 5.9));
  ST.add(box(16, 3.4, 0.1, wallM, 0, 1.7, 6.0)); // front wall behind window (window is drawn on top)
  // big mirror on the back wall, tilted
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.4), emis(0xc9d6de, 0.45)); mirror.position.set(0, 1.45, -3.1); scene.add(mirror); ST.add(box(1.75, 2.55, 0.06, M(0x6b4a2b), 0, 1.45, -3.14));
  // podium
  ST.add(cyl(0.75, 0.8, 0.16, M(0x8a2a2a), 24, 0, 0.08, 0)); ST.add(cyl(0.78, 0.78, 0.02, M(0xd8c060), 24, 0, 0.17, 0));
  // fitting booth on the left: walls x=-4.8..-2.9, z=-3.2..-1.2, open at the front; curtain across z=-1.2
  ST.add(box(0.08, 2.6, 2.1, wallM, -2.9, 1.3, -2.2)); ST.add(box(1.9, 0.08, 2.1, M(0xd0c8b8), -3.85, 2.6, -2.2));
  ST.add(box(2.0, 0.04, 0.04, M(0x9aa1a8), -3.85, 2.45, -1.2)); // rail
  const curtain = new THREE.Group(); scene.add(curtain); for (let i = 0; i < 14; i++) curtain.add(box(0.14, 2.3, 0.06, M(i % 2 ? 0x8b1e2d : 0x9f2a39), -4.7 + i * 0.13, 1.28, -1.2 + (i % 2) * 0.04));
  ST.add(box(0.5, 0.42, 0.35, M(0x6b4a2b), -4.2, 0.21, -2.8)); // stool in the booth
  // counter with a till (right-back)
  ST.add(box(2.2, 0.95, 0.7, M(0x6b4a2b), 3.2, 0.475, -2.3)); ST.add(box(2.3, 0.06, 0.8, M(0x3a2a1a), 3.2, 0.98, -2.3)); ST.add(box(0.4, 0.3, 0.35, M(0x2b2d33), 3.6, 1.16, -2.3));
  const till = box(0.5, 0.25, 0.4, M(0xd0d0cc), 2.7, 1.14, -2.3); scene.add(till); // plastic till
  // rails of clothes on the right wall: two thirds synthetic (vanish)
  const garments = []; for (let k = 0; k < 2; k++) { const rz = -0.4 + k * 2.6; ST.add(box(0.04, 0.04, 2.0, M(0x9aa1a8), 4.3, 1.75, rz)); ST.add(box(0.04, 1.75, 0.04, M(0x9aa1a8), 4.3, 0.875, rz - 1.0)); ST.add(box(0.04, 1.75, 0.04, M(0x9aa1a8), 4.3, 0.875, rz + 1.0)); for (let i = 0; i < 11; i++) { const syn = (i % 3) !== 1; const col = syn ? [0x2b3a55, 0x1f2a38, 0x3a3f45, 0x4a5a6a, 0x5b3a6b][i % 5] : [0xc8a26a, 0xd9d2c4, 0x8a6a4a, 0xb04a3a][i % 4]; const g = new THREE.Group(); g.add(box(0.05, 0.9, 0.42, M(col), 0, 1.25, 0)); g.add(box(0.03, 0.08, 0.03, M(0xd8c060), 0, 1.74, 0)); g.position.set(4.2, 0, rz - 0.9 + i * 0.18); g.userData.syn = syn; scene.add(g); garments.push(g); } }
  // a mannequin by the window (plastic!)
  const mann = new THREE.Group(); mann.position.set(-3.0, 0, 4.2); mann.add(cyl(0.3, 0.3, 0.05, M(0x3a3a3a), 12, 0, 0.025, 0)); mann.add(cyl(0.03, 0.03, 0.8, M(0x9aa1a8), 6, 0, 0.45, 0)); mann.add(box(0.44, 0.62, 0.25, M(0x4a5a6a), 0, 1.16, 0)); mann.add(ico(0.16, M(0xf0ece4), 1, 0, 1.68, 0)); scene.add(mann);
  const mannSuit = box(0.46, 0.64, 0.27, FAB(0x6b3a3a), 0, 1.16, 0); mann.add(mannSuit);
  // plants and a chair for Priya
  const chair = new THREE.Group(); chair.position.set(2.1, 0, 1.75); chair.rotation.y = -2.2; chair.add(box(0.5, 0.06, 0.5, M(0x6b4a2b), 0, 0.45, 0)); chair.add(box(0.5, 0.5, 0.06, M(0x6b4a2b), 0, 0.73, -0.22)); for (const sx of [-0.2, 0.2]) for (const sz of [-0.2, 0.2]) chair.add(box(0.05, 0.45, 0.05, M(0x5a3a1a), sx, 0.225, sz)); ST.add(chair);
  const pot = new THREE.Group(); pot.position.set(-2.2, 0, 4.6); pot.add(cyl(0.25, 0.2, 0.4, M(0xb5603a), 10, 0, 0.2, 0)); pot.add(ico(0.35, M(0x4f8a3d), 1, 0, 0.75, 0)); pot.add(ico(0.25, M(0x5c9a46), 1, 0.15, 1.0, 0.1)); ST.add(pot);
  bakeStatic(ST, scene);
  // people
  const dSuit = makeDaveSuit(), dVest = makeDaveVest(), dEmpty = makeSuitEmpty(); [dSuit, dVest, dEmpty].forEach(d => scene.add(d.g));
  const tailor = new Person({ seed: 51, skin: 0xe0ac7e, shirt: 0x55606e, pants: 0x2b2d33, hair: 0x9a9a9a, hairStyle: 'bald' }); scene.add(tailor.g);
  const tape = box(0.05, 0.02, 0.5, M(0xf2c85b), 0, -0.6, 0.06); tailor.armR.add(tape); const tapeNeck = box(0.3, 0.03, 0.08, M(0xf2c85b), 0, 0.55, 0.14); tailor.torso.add(tapeNeck);
  const specs = box(0.2, 0.05, 0.03, M(0x1b1b1b), 0, 0.2, 0.17); tailor.neck.add(specs);
  const priya = makePriya(); scene.add(priya.g); const phone = box(0.07, 0.13, 0.01, M(0x1b1b1b), 0, -0.6, 0.08); priya.armR.add(phone);
  const sp = sparkle(scene, 18, 0.3);
  const tmp = new THREE.Vector3();
  S.actors = { dSuit, dVest, dEmpty, tailor, priya };
  S.update = (t, c) => {
    S.setSky(0);
    const van = !!c.vanish; curtain.visible = !van; till.visible = !van; mannSuit.visible = !van; tape.visible = !van; tapeNeck.visible = !van; phone.visible = !van; specs.visible = !van; mann.children[1].visible = !van; mann.children[2].visible = !van; mann.children[3].visible = !van; mann.children[0].visible = !van;
    garments.forEach(g => { g.visible = !(van && g.userData.syn); });
    // Dave
    const sm = c.suit || 'on'; const where = c.where || 'podium';
    const pos = where === 'podium' ? [0, 0.17, 0] : where === 'peek' ? [-3.25, 0, -0.95] : [-3.85, 0, -2.3]; const ry = where === 'podium' ? 0 : where === 'peek' ? 1.1 : 0.35;
    dSuit.g.visible = sm === 'on'; dVest.g.visible = sm !== 'on' && sm !== 'none'; dEmpty.g.visible = sm === 'empty';
    const D = sm === 'on' ? dSuit : dVest;
    D.g.position.set(pos[0], pos[1], pos[2]); D.g.rotation.y = ry; D.pose('stand', t);
    if (c.armsCover) { D.armL.rotation.x = -0.55; D.armL.rotation.z = 0.75; D.armR.rotation.x = -0.35; D.armR.rotation.z = -0.15; D.torso.rotation.x = 0.06; }
    if (c.handsHips) { D.armL.rotation.x = 0.35; D.armL.rotation.z = 0.4; D.armR.rotation.x = 0.35; D.armR.rotation.z = -0.4; }
    if (c.holdSuit) { D.armL.rotation.x = -0.8; D.armR.rotation.x = -0.8; D.armL.rotation.z = 0.3; D.armR.rotation.z = -0.3; }
    const dl = c.daveLook || 'mirror'; D.neck.rotation.set(0, 0, 0); if (dl === 'cam') D.neck.rotation.x = -0.02; else if (dl === 'down') D.neck.rotation.x = 0.55; else if (dl === 'priya') { D.neck.rotation.y = -0.8; D.neck.rotation.x = 0.05; } else if (dl === 'suit') { D.neck.rotation.y = 0.9; D.neck.rotation.x = 0.15; } else if (dl === 'mirror') { D.neck.rotation.y = Math.PI * 0.95; }
    if (dl === 'mirror') { D.g.rotation.y = Math.PI; D.neck.rotation.set(0.02, 0, 0); }
    face(D, { wide: c.wide ?? 0, open: c.open ?? 0, smile: !!c.smile });
    // the empty suit on the podium: stands, then collapses
    if (sm === 'empty') { const k = easeIn(c.emptyK ?? 0); dEmpty.g.position.set(0, 0.17, 0); dEmpty.g.rotation.y = 0; dEmpty.pose('stand', 0); dEmpty.armL.rotation.z = 0.15; dEmpty.armR.rotation.z = -0.15; dEmpty.g.scale.set(1 + k * 0.4, Math.max(0.06, 1 - k * 0.94), 1 + k * 0.4); dEmpty.g.rotation.z = k * 0.25; dEmpty.g.rotation.x = k * 0.3; }
    // tailor
    const tm = c.tailor || 'measure'; tailor.g.visible = tm !== 'none';
    if (tm === 'measure' || tm === 'kneelLook') { tailor.g.position.set(1.0, 0, 0.3); tailor.g.rotation.y = -Math.PI / 2; tailor.pose('kneel'); tailor.armR.rotation.x = -0.9; tailor.armR.rotation.z = -0.2; tailor.armL.rotation.x = -0.7; tailor.neck.rotation.x = tm === 'measure' ? 0.5 + Math.sin(t * 3) * 0.05 : -0.55; if (tm === 'measure') tailor.armR.rotation.x += Math.sin(t * 4) * 0.12; }
    else { tailor.g.position.set(1.2, 0, 1.3); tailor.g.rotation.y = Math.PI + 0.4; tailor.pose('stand', t); if (tm === 'shrug') { tailor.armL.rotation.z = -0.5; tailor.armR.rotation.z = 0.5; tailor.armL.rotation.x = -0.55; tailor.armR.rotation.x = -0.55; tailor.neck.rotation.z = 0.15; tailor.neck.rotation.x = -0.05; } if (tm === 'point') { tailor.armR.rotation.x = -1.4; tailor.armR.rotation.z = -0.3; } if (tm === 'standLook') { tailor.neck.rotation.y = 0.5; } }
    face(tailor, { wide: c.tailorWide ?? 0, smile: tm === 'shrug' });
    // Priya on the chair
    const pm = c.priya || 'phone'; priya.g.visible = pm !== 'none'; priya.g.position.set(2.1, 0.02, 1.75); priya.g.rotation.y = -2.2; priya.pose('sit');
    priya.armR.rotation.x = -1.3; priya.armR.rotation.z = -0.25; priya.armL.rotation.x = -0.6; priya.neck.rotation.set(0.3, 0, 0);
    if (pm === 'look') { priya.neck.rotation.set(0.0, 0.5, 0); priya.armR.rotation.x = -0.9; } if (pm === 'ceiling') { priya.neck.rotation.set(-0.7, 0.35, 0); priya.armR.rotation.x = -0.9; priya.armL.rotation.x = -0.9; } if (pm === 'thumbs') { priya.neck.rotation.set(0.0, 0.5, 0); priya.armR.rotation.x = -1.6; priya.armR.rotation.z = -0.4; } if (pm === 'clap') { priya.neck.rotation.set(0.0, 0.5, 0); const w = Math.sin(t * 14) * 0.15; priya.armR.rotation.x = -1.2; priya.armL.rotation.x = -1.2; priya.armR.rotation.z = -0.3 + w; priya.armL.rotation.z = 0.3 - w; }
    face(priya, { wide: c.priyaWide ?? 0, smile: pm === 'thumbs' || pm === 'clap' });
    // sparkle at the moment the suit vanishes / returns
    D.g.updateMatrixWorld(true); D.torso.getWorldPosition(tmp); tmp.y += 0.3; sp.userData.set(c.sparkK ?? -1, tmp);
  };
  return S;
}

// ======================= STREET with plastic cars and walkers =======================
// ctx: vanish (bool), drive (bool), stopT (seconds since the short, or -1), spark (bool), grab (bool: people hold their waistbands), crowd (0..1: everyone runs to the man in wool), glasses (0..1 bump), flash
export function buildPlasticStreet() {
  const S = buildStreet(); const { scene } = S; const { lionA, lionB, cat, hole, splinters, flap } = S.actors; [lionA.g, lionB.g, cat.g, hole, splinters, flap].forEach(o => o.visible = false);
  scene.add(plane(60, 4, M(0x9a9a96), 0, 0.005, 16)); scene.add(box(60, 0.12, 0.2, M(0xb0b0ac), 0, 0.06, 13.95)); scene.add(plane(60, 8, M(0x6aa64e), 0, 0.003, 22));
  const hedge = []; for (let i = 0; i < 7; i++) { const h = box(3.0, 1.1, 0.9, M(0x3f7a35), -14 + i * 4.6, 0.55, 18.6); scene.add(h); hedge.push(h); }
  // cars with separate plastic parts
  function makePCar(color) { const g = new THREE.Group(); const L = 4.4, W = 1.85; const paint = M(color); g.add(box(L, 0.55, W, paint, 0, 0.55, 0)); g.add(box(L * 0.5, 0.55, W * 0.9, M(0x26303b), -0.2, 1.07, 0)); const wheelM = M(0x1a1a1a); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const wh = cyl(0.36, 0.36, 0.25, wheelM, 10, sx * L * 0.33, 0.36, sz * (W / 2)); wh.rotation.x = Math.PI / 2; g.add(wh); } const P = new THREE.Group(); g.add(P); const pm = M(0x2b2d33); P.add(box(0.25, 0.3, W + 0.1, pm, L / 2 + 0.1, 0.45, 0)); P.add(box(0.25, 0.3, W + 0.1, pm, -L / 2 - 0.1, 0.45, 0)); for (const sz of [-1, 1]) { P.add(box(0.1, 0.1, 0.16, M(0x3a3f45), 0.9, 1.15, sz * (W / 2 + 0.1))); P.add(box(0.1, 0.14, 0.34, emis(0xfff2c8, 0.6), L / 2 + 0.01, 0.62, sz * (W * 0.32), false)); P.add(box(0.08, 0.16, 0.36, emis(0xff2a1a, 0.4), -L / 2 - 0.01, 0.62, sz * (W * 0.32), false)); } P.add(box(0.06, 0.12, 0.5, M(0xf4f4f4), L / 2 + 0.24, 0.5, 0)); P.add(box(0.3, 0.1, W * 0.9, M(0x2b2d33), 0.9, 1.05, 0)); P.add(box(0.05, 0.25, W * 0.8, M(0x1b1f24), L / 2 - 0.2, 0.75, 0)); g.userData.P = P; const sp = []; for (let i = 0; i < 4; i++) { const s = softSprite(0xffe08a, 0.5, 0); s.position.set(1.4 + i * 0.2, 0.9, (i % 2 ? 0.5 : -0.5)); g.add(s); sp.push(s); } g.userData.sp = sp; const smoke = softSprite(0x8a8f96, 1.2, 0); smoke.position.set(1.6, 1.3, 0); g.add(smoke); g.userData.smoke = smoke; return g; }
  const cars = [makePCar(0xd9534f), makePCar(0x3b6fb6), makePCar(0xf2c14e)]; cars.forEach((c, i) => { c.rotation.y = Math.PI / 2; c.position.set(-16 + i * 11, 0, 11.2); scene.add(c); });
  // walkers on the pavement (z=2) and the man in the wool jumper
  const walkers = []; const cols = [0xd9534f, 0x4a7fb5, 0x9b7bb8, 0xe88c6a, 0x2f3b4e]; for (let i = 0; i < 5; i++) { const p = new Person({ seed: 300 + i, shirt: cols[i], pants: [0x2f3b4e, 0x4a5a6a, 0x8a7560, 0x1f2a38, 0x6b6f7a][i], hairStyle: i % 2 ? 'long' : 'short', dress: i === 2 }); const v = new Person({ seed: 300 + i, shirt: 0xf4f4f4, pants: 0xf4f4f4, hairStyle: i % 2 ? 'long' : 'short', sleeves: false }); const skin = v.parts.skin; [v.legL, v.legR].forEach(l => { l.userData.knee.children[0].material = skin; }); scene.add(p.g); scene.add(v.g); walkers.push({ p, v, x0: -9 + i * 4.2, dir: i % 2 ? 1 : -1, sp: 1.0 + (i % 3) * 0.2 }); }
  const wool = new Person({ seed: 320, shirt: 0xb04a3a, pants: 0x8a7560, knit: true, hat: 0x3a2a1a }); scene.add(wool.g); wool.g.position.set(1.5, 0, 2.2); wool.g.rotation.y = 0.2;
  const specsMan = new Person({ seed: 330, shirt: 0x6fa36b, pants: 0x2f3b4e }); scene.add(specsMan.g); const frame = new THREE.Group(); frame.add(box(0.2, 0.05, 0.02, M(0x1b1b1b), 0, 0.2, 0.17)); for (const sx of [-1, 1]) frame.add(new THREE.Mesh(new THREE.CircleGeometry(0.045, 10), mat(0xcfe8ff, { transparent: true, opacity: 0.45 }))); frame.children[1].position.set(-0.062, 0.2, 0.18); frame.children[2].position.set(0.062, 0.2, 0.18); specsMan.neck.add(frame);
  const flashS = softSprite(0xffffff, 3, 0); scene.add(flashS);
  S.update = (t, c) => {
    S.setSky(0); const van = !!c.vanish; const st = c.stopT ?? -1; if (c.sunDir) S.sun.position.copy(S.sun.target.position).add(new THREE.Vector3(c.sunDir[0], c.sunDir[1], c.sunDir[2]));
    cars.forEach((car, i) => { car.userData.P.visible = !van; let x = -16 + i * 11; if (c.drive) { const v = 6.5; if (st < 0) x += v * t; else { const t0 = t - st; const tt = Math.min(st, 1.4); x += v * t0 + v * tt - 0.5 * (v / 1.4) * tt * tt; } x = ((x + 30) % 60 + 60) % 60 - 30; } car.position.x = x; const spk = !!c.spark; car.userData.sp.forEach((s, k) => { s.material.opacity = spk ? (Math.sin(t * 37 + k * 2 + i) > 0.2 ? 0.95 : 0) : 0; s.scale.setScalar(0.3 + Math.random() * 0.4); }); car.userData.smoke.material.opacity = spk ? 0.45 : 0; car.userData.smoke.position.y = 1.3 + ((t * 0.7) % 1) * 0.8; });
    walkers.forEach((w, i) => { const span = 24; let x = w.x0 + w.dir * w.sp * t; x = ((x + 12) % span + span) % span - 12; const P = van ? w.v : w.p; w.p.g.visible = !van; w.v.g.visible = van; const cr = c.crowd ?? 0; if (c.grab || cr > 0) { x = w.x0 + w.dir * w.sp * (c.grabAt ?? 0); x = ((x + 12) % span + span) % span - 12; const sx0 = -2.6 + i * 1.5; const gx = lerp(sx0, 1.5 + (i - 2) * 0.75, smooth(cr)); P.g.position.set(gx, 0, lerp(2.2 + (i % 2) * 0.6, 3.2, smooth(cr))); P.g.rotation.y = cr > 0.1 ? Math.PI : (i % 2 ? 0.35 : -0.35); if (cr > 0 && cr < 1) P.pose('walk', t * 1.6, { phase: i }); else { P.pose('stand', t, { phase: i }); P.armL.rotation.x = 0.35; P.armL.rotation.z = 0.45; P.armR.rotation.x = 0.35; P.armR.rotation.z = -0.45; P.torso.rotation.x = 0.1; } face(P, { wide: 1, open: cr > 0.9 ? 0.4 : 0 }); if (cr >= 1) { P.armL.rotation.x = -1.2; P.armR.rotation.x = -1.2; P.armL.rotation.z = 0.2; P.armR.rotation.z = -0.2; } }
      else { P.g.position.set(x, 0, 2.2 + (i % 2) * 0.6); P.g.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2; P.pose('walk', t, { phase: i }); face(P, { wide: 0 }); } });
    wool.g.visible = !!c.wool; if (wool.g.visible) { wool.pose('stand', t); const cr = c.crowd ?? 0; wool.neck.rotation.y = Math.sin(t * 2) * 0.3; face(wool, { wide: cr, open: cr > 0.9 ? 0.5 : 0 }); if (cr > 0.9) { wool.armL.rotation.x = -1.4; wool.armR.rotation.x = -1.4; wool.armL.rotation.z = 0.5; wool.armR.rotation.z = -0.5; } }
    const gk = c.glasses ?? -1; specsMan.g.visible = gk >= 0; if (gk >= 0) { frame.children[1].visible = !van; frame.children[2].visible = !van; const x = -2 + Math.min(gk, 1.0) * 5.0; specsMan.g.position.set(x, 0, 2.6); specsMan.g.rotation.y = Math.PI / 2; specsMan.pose(gk < 1.0 ? 'walk' : 'stand', t); specsMan.armL.rotation.x = -1.3; specsMan.armL.rotation.z = 0.3; specsMan.neck.rotation.y = -0.3; if (gk >= 1.0) { specsMan.torso.rotation.x = -0.35 * Math.max(0, 1 - (gk - 1) * 2); specsMan.g.rotation.z = -0.2 * Math.max(0, 1 - (gk - 1) * 2); specsMan.armL.rotation.x = -2.5; specsMan.armR.rotation.x = -1.0; face(specsMan, { wide: 1, open: 0.5 }); } else face(specsMan, { wide: 0.3 }); }
    hedge.forEach(h => h.visible = true);
  };
  return S;
}

// ======================= STUDIO props =======================
// props: pie (pieK), carcut (carK), wires (insul 0..1, touch 0..1, spark), crowd (count 0..1), lens (lensK, specsK), planes (n 0..1), bottle (bk: 0 bottle, 1 gone, collapse 0..1, back)
export function buildStudioPlastic() {
  const S = buildStudio(); const { scene, P } = S; const add = (k, g) => { P[k] = g; scene.add(g); return g; };
  // fibre pie: two thirds gold (plastic), one third white (cotton, wool, other)
  { const g = new THREE.Group(); const base = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.36, 48, 1, false, Math.PI * 2 / 3, Math.PI * 4 / 3), M(GOLD)); g.add(base); const nat = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.36, 48, 1, false, 0, Math.PI * 2 / 3), M(0xf4efe4)); g.add(nat); const lp = lbl('PLASTIC · 2/3', 1.4, 0.32, { fg: '#1b1b1b', font: 'bold 64px sans-serif' }); lp.rotation.x = -Math.PI / 2; lp.position.set(-0.62, 0.2, -0.3); g.add(lp); const ln = lbl('COTTON · WOOL · 1/3', 1.5, 0.3, { fg: '#1b1b1b', font: 'bold 56px sans-serif', pw: 1024 }); ln.rotation.x = -Math.PI / 2; ln.position.set(0.55, 0.2, -0.55); g.add(ln); const title = lbl('CLOTHING FIBRE, WORLD', 2.6, 0.32, { fg: '#ffffff', font: 'bold 60px sans-serif', pw: 1024 }); title.position.set(0, 1.9, 0); g.add(title); g.rotation.x = 0.75; g.position.set(0, 2.6, 0); g.userData = { base, lp, title }; add('pie', g); }
  // car cutaway with plastic parts in gold
  { const g = new THREE.Group(); const car = makeCar(77, { color: 0x9aa1a8, length: 4.6 }); g.add(car); const gold = M(GOLD); const parts = new THREE.Group(); g.add(parts); parts.add(box(0.3, 0.32, 2.0, gold, 2.4, 0.45, 0)); parts.add(box(0.3, 0.32, 2.0, gold, -2.4, 0.45, 0)); parts.add(box(0.5, 0.18, 1.6, gold, 0.9, 1.05, 0)); parts.add(box(0.3, 0.3, 0.3, gold, 0.4, 1.4, 0)); for (let i = 0; i < 6; i++) parts.add(box(0.12, 0.12, 0.12, gold, -1.6 + i * 0.5, 1.15, (i % 2 ? 0.5 : -0.5))); parts.add(box(2.2, 0.08, 1.7, gold, -0.3, 0.3, 0)); for (const sz of [-1, 1]) parts.add(box(0.12, 0.1, 0.2, gold, 0.9, 1.25, sz * 1.0)); const l1 = lbl('50% OF THE VOLUME', 2.4, 0.34, { fg: '#f2c85b', font: 'bold 64px sans-serif', pw: 1024 }); l1.position.set(0, 2.4, 0.5); g.add(l1); const l2 = lbl('< 10% OF THE WEIGHT', 2.2, 0.28, { fg: '#ffffff', font: 'bold 56px sans-serif', pw: 1024 }); l2.position.set(0, 2.05, 0.5); g.add(l2); g.scale.setScalar(0.85); g.position.y = 0.2; g.userData = { parts, car }; add('carcut', g); }
  // three wires: copper cores with coloured insulation
  { const g = new THREE.Group(); const cols = [0xd9534f, 0x3b6fb6, 0xf2c14e]; const wires = []; cols.forEach((cc, i) => { const w = new THREE.Group(); const ins = cyl(0.12, 0.12, 3.2, M(cc), 12, 0, 0, 0); ins.rotation.z = Math.PI / 2; w.add(ins); const core = cyl(0.06, 0.06, 3.25, M(0xc8793a), 10, 0, 0, 0); core.rotation.z = Math.PI / 2; w.add(core); w.position.set(0, 2.1 - i * 0.45, 0); g.add(w); wires.push({ w, ins, core }); }); const sp = []; for (let i = 0; i < 6; i++) { const s = softSprite(0xffe08a, 0.6, 0); s.position.set(-0.6 + i * 0.25, 1.65 + (i % 2) * 0.2, 0.3); g.add(s); sp.push(s); } const l = lbl('INSULATION: PVC', 2.0, 0.3, { fg: '#ffffff', font: 'bold 60px sans-serif', pw: 1024 }); l.position.set(0, 3.1, 0); g.add(l); const l2 = lbl('ALSO PLASTIC', 1.6, 0.42, { bg: '#c0392b', fg: '#fff', font: 'bold 72px sans-serif' }); l2.position.set(0.3, 2.75, 0.4); l2.rotation.z = 0.12; l2.visible = false; g.add(l2); g.userData = { wires, sp, l2 }; add('wires', g); }
  // crowd: instanced tiny people + counter
  { const g = new THREE.Group(); const N = 3000; const geo = new THREE.BoxGeometry(0.08, 0.16, 0.05); const im = new THREE.InstancedMesh(geo, M(0xf4f4f4), N); const d = new THREE.Object3D(); const r = rng(8); for (let i = 0; i < N; i++) { d.position.set((i % 60 - 30) * 0.12 + r.range(-0.02, 0.02), 0.08, -Math.floor(i / 60) * 0.12 + 2.5); d.updateMatrix(); im.setMatrixAt(i, d.matrix); } im.castShadow = false; g.add(im); const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 6, 5), M(0xe0b090), N); for (let i = 0; i < N; i++) { d.position.set((i % 60 - 30) * 0.12, 0.2, -Math.floor(i / 60) * 0.12 + 2.5); d.updateMatrix(); heads.setMatrixAt(i, d.matrix); } g.add(heads); const cl = dynLbl(3.2, 0.6, { fg: '#f2c85b', font: 'bold 96px sans-serif', text: '0', pw: 1024, ph: 192 }); cl.position.set(0, 2.9, 0); g.add(cl); const sub = lbl('PEOPLE · HANDS ON WAISTBAND', 2.6, 0.26, { fg: '#ffffff', font: 'bold 56px sans-serif', pw: 1024 }); sub.position.set(0, 2.45, 0); g.add(sub); g.userData = { cl }; add('crowd', g); }
  // contact lens on a fingertip + spectacles
  { const g = new THREE.Group(); const finger = cyl(0.42, 0.46, 2.0, M(0xf1c9a5), 14, 0, 1.6, -0.6); finger.rotation.x = Math.PI / 2; g.add(finger); g.add(ico(0.42, M(0xf1c9a5), 2, 0, 1.6, 0.4)); const nail = box(0.5, 0.3, 0.05, M(0xf6d7c0), 0, 1.95, 0.05); g.add(nail); const lensM = mat(0xbfe3ff, { transparent: true, opacity: 0.6 }); const lens = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), lensM); lens.position.set(0, 1.6, 0.6); lens.rotation.x = Math.PI / 2; g.add(lens); const nl = dynLbl(2.0, 0.42, { fg: '#f2c85b', font: 'bold 84px sans-serif', text: '0', pw: 1024, ph: 196 }); nl.position.set(0, 3.1, 0); g.add(nl); const sub = lbl('CONTACT LENSES · ALL PLASTIC', 1.9, 0.2, { fg: '#ffffff', font: 'bold 56px sans-serif', pw: 1024 }); sub.position.set(0, 2.8, 0); g.add(sub); const spec = new THREE.Group(); spec.position.set(0, 1.9, 1.2); spec.add(box(1.9, 0.08, 0.06, M(0x1b1b1b), 0, 0.45, 0)); const rings = []; for (const sx of [-1, 1]) { const rg = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 24), M(0x1b1b1b)); rg.position.set(sx * 0.5, 0, 0); spec.add(rg); const gl = new THREE.Mesh(new THREE.CircleGeometry(0.4, 24), mat(0xcfe8ff, { transparent: true, opacity: 0.5, side: THREE.DoubleSide })); gl.position.set(sx * 0.5, 0, 0.01); spec.add(gl); rings.push(gl); } spec.add(box(0.2, 0.05, 0.05, M(0x1b1b1b), 0, 0.05, 0)); spec.visible = false; g.add(spec); const sl = lbl('SPECTACLE LENSES: MOSTLY PLASTIC', 1.5, 0.16, { fg: '#ffffff', font: 'bold 52px sans-serif', pw: 1024 }); sl.position.set(0, 2.7, 1.2); sl.visible = false; g.add(sl); g.userData = { lens, nl, spec, rings, sl, finger, nail }; add('lens', g); }
  // ten thousand aircraft: instanced little planes
  { const g = new THREE.Group(); const N = 10000; const fus = new THREE.BoxGeometry(0.075, 0.014, 0.014); const wing = new THREE.BoxGeometry(0.022, 0.007, 0.068); const tail = new THREE.BoxGeometry(0.012, 0.022, 0.007); tail.translate(-0.032, 0.01, 0); const geo = mergeGeometries([fus, wing, tail], false); const im = new THREE.InstancedMesh(geo, M(0xf4f6f8), N); const d = new THREE.Object3D(); for (let i = 0; i < N; i++) { d.position.set((i % 100 - 50) * 0.08, 0.3 + Math.floor(i / 100) * 0.08, 0); d.rotation.set(0, 0, 0); d.updateMatrix(); im.setMatrixAt(i, d.matrix); } g.add(im); const nl = dynLbl(3.0, 0.5, { fg: '#f2c85b', font: 'bold 84px sans-serif', text: '0', pw: 1024, ph: 196 }); nl.position.set(0, 9.0, 0); g.add(nl); const sub = lbl('AIRCRAFT IN THE AIR RIGHT NOW', 2.8, 0.26, { fg: '#ffffff', font: 'bold 56px sans-serif', pw: 1024 }); sub.position.set(0, 8.6, 0); g.add(sub); g.userData = { im, nl, N }; add('planes', g); }
  // a bottle on a table: vanishes, liquid stands, collapses, bottle returns empty
  { const g = new THREE.Group(); g.add(box(2.4, 0.08, 1.2, M(0x8a6a4a), 0, 0.96, 0)); for (const sx of [-1, 1]) g.add(box(0.08, 0.95, 0.08, M(0x6b4a2b), sx, 0.475, 0)); const shell = cyl(0.22, 0.2, 0.9, mat(0xdfefff, { transparent: true, opacity: 0.35 }), 14, 0, 1.45, 0); g.add(shell); const cap = cyl(0.1, 0.1, 0.1, M(0xd9534f), 10, 0, 1.95, 0); g.add(cap); const liq = cyl(0.19, 0.18, 0.78, M(0x5a2d0c), 14, 0, 1.39, 0); g.add(liq); const pud = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), M(0x5a2d0c)); pud.rotation.x = -Math.PI / 2; pud.position.set(0.1, 1.005, 0.1); pud.visible = false; g.add(pud); const lbA = lbl('COLA · 2 L', 1.1, 0.26, { fg: '#f2c85b', font: 'bold 60px sans-serif' }); lbA.position.set(0, 2.3, 0); g.add(lbA); const lbB = lbl('STILL HERE', 1.4, 0.42, { bg: '#4e8f5a', fg: '#fff', font: 'bold 72px sans-serif' }); lbB.position.set(0.1, 2.3, 0.3); lbB.visible = false; g.add(lbB); const lbC = lbl('NOT WHERE THINGS ARE NOW', 2.2, 0.36, { bg: '#c0392b', fg: '#fff', font: 'bold 64px sans-serif', pw: 1024 }); lbC.position.set(0.1, 2.5, 0.3); lbC.rotation.z = 0.08; lbC.visible = false; g.add(lbC); g.userData = { shell, cap, liq, pud, lbA, lbB, lbC }; add('bottle', g); }
  const upd = S.update;
  S.update = (t, c) => {
    upd(t, c); const prop = c.prop || 'dial'; const u = P[prop].userData;
    if (prop === 'pie') { const k = c.pieK ?? 0; const s = Math.max(0.001, 1 - easeIn(k)); u.base.scale.set(s, 1, s); u.lp.visible = k < 0.5; P.pie.rotation.z = Math.sin(t * 0.5) * 0.05; }
    if (prop === 'carcut') { const k = c.carK ?? 0; u.parts.visible = k < 1; u.parts.children.forEach((p, i) => { const kk = clamp(k * 1.6 - i * 0.08, 0, 1); p.scale.setScalar(Math.max(0.001, 1 - kk)); }); P.carcut.rotation.y = -0.5 + Math.sin(t * 0.4) * 0.1; }
    if (prop === 'wires') { const ins = c.insul ?? 1; const touch = c.touch ?? 0; u.wires.forEach(({ w, ins: insM }, i) => { insM.scale.set(1, Math.max(0.001, ins), Math.max(0.001, ins)); w.position.y = lerp(2.1 - i * 0.45, 1.65 + (i - 1) * 0.1, easeOut(touch)); w.rotation.z = (i - 1) * 0.34 * easeOut(touch); w.position.z = (i - 1) * 0.08; }); u.sp.forEach((s, i) => { s.material.opacity = c.spark ? (Math.sin(t * 41 + i * 1.7) > 0.1 ? 0.95 : 0) : 0; }); u.l2.visible = !!c.also; }
    if (prop === 'crowd') { const k = c.count ?? 0; const n = Math.round(8e9 * easeOut(k)); u.cl.userData.set(n.toLocaleString('en-GB')); }
    if (prop === 'lens') { const k = c.lensK ?? 0; u.lens.visible = k < 1; u.lens.scale.setScalar(Math.max(0.001, 1 - easeIn(k))); u.nl.userData.set(Math.round(140e6 * easeOut(c.lensN ?? 0)).toLocaleString('en-GB')); const sk = c.specsK ?? -1; u.spec.visible = sk >= 0; u.sl.visible = sk >= 0; u.finger.visible = sk < 0; P.lens.children[1].visible = sk < 0; u.nail.visible = sk < 0; u.lens.visible = u.lens.visible && sk < 0; u.nl.visible = sk < 0; P.lens.children[5].visible = sk < 0; u.rings.forEach(r => { r.visible = sk < 0.5; r.material.opacity = 0.5 * (1 - clamp(sk * 2, 0, 1)); }); }
    if (prop === 'planes') { const k = c.n ?? 1; const vis = Math.round(u.N * easeOut(k)); u.im.count = vis; u.nl.userData.set(vis.toLocaleString('en-GB')); P.planes.position.y = c.camY ?? 0; }
    if (prop === 'bottle') { const bk = c.bk ?? 0; const col = c.collapse ?? 0; u.shell.visible = bk < 0.5 || !!c.back; u.cap.visible = u.shell.visible; const cs = easeIn(col); u.liq.visible = cs < 0.98; u.liq.scale.set(1 + cs * 2.6, Math.max(0.03, 1 - cs * 0.97), 1 + cs * 2.6); u.liq.position.y = 1.0 + 0.39 * (1 - cs * 0.97); u.pud.visible = cs > 0.9; u.lbA.visible = bk < 0.5; u.lbB.visible = bk >= 0.5 && !c.back && col < 0.6; u.lbC.visible = !!c.back; }
  };
  return S;
}

// ======================= CITY from above: cars stop, sparks =======================
// ctx: mode (as buildCity), st, sparks (bool), flash
export function buildCityPlastic() {
  const S = buildCity(); const { scene } = S; const r = rng(44);
  const sparks = []; for (let i = 0; i < 90; i++) { const s = softSprite(0xffe08a, r.range(1.5, 3), 0); s.position.set(r.range(-80, 80), 2.5, r.range(-80, 80)); s.userData.ph = r.f() * 7; scene.add(s); sparks.push(s); }
  const upd = S.update;
  S.update = (t, c) => { upd(t, c); const on = !!c.sparks; sparks.forEach((s, i) => { s.material.opacity = on ? (Math.sin(t * 23 + s.userData.ph) > 0.4 ? 0.9 : 0) : 0; }); };
  return S;
}

// ======================= EARTH: night lights, ocean garbage, pulse =======================
// ctx: lights 0..1, garbage 0..1, ring (0..pi), sunDir, spin, pulse 0..1
export function buildEarthPlastic() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000004);
  const cam = new THREE.PerspectiveCamera(42, 1080 / 1920, 0.1, 3000);
  const stars = makeStars(1600, 1400, 3); stars.material.opacity = 0.9; stars.material.size = 2.4; scene.add(stars);
  const stars2 = makeStars(1600, 1400, 4); stars2.rotation.z = Math.PI; stars2.material.opacity = 0.9; stars2.material.size = 2.4; scene.add(stars2);
  const sun = new THREE.DirectionalLight(0xfff6e8, 2.6); sun.position.set(200, 40, 120); scene.add(sun); scene.add(new THREE.AmbientLight(0x224466, 0.45));
  const R = 60; const g = new THREE.Group(); scene.add(g);
  const land = []; { const r = rng(5); for (let i = 0; i < 70; i++) land.push({ x: r.f() * 1024, y: 512 * 0.15 + r.f() * 512 * 0.7, rx: 20 + r.f() * 90, ry: 15 + r.f() * 55, a: r.f() * 3, c: r.f() < 0.3 ? '#b59a5a' : '#3f7a3a' }); }
  const tex = canvasTex(1024, 512, (ctx, w, h) => { ctx.fillStyle = '#1f4f8f'; ctx.fillRect(0, 0, w, h); land.forEach(l => { ctx.beginPath(); ctx.ellipse(l.x, l.y, l.rx, l.ry, l.a, 0, Math.PI * 2); ctx.fillStyle = l.c; ctx.fill(); }); ctx.fillStyle = '#f4f7fa'; ctx.fillRect(0, 0, w, h * 0.06); ctx.fillRect(0, h * 0.94, w, h * 0.06); }); tex.magFilter = THREE.LinearFilter;
  // city lights: dots on land, shown only on the night side by a small shader
  const lightTex = canvasTex(1024, 512, (ctx, w, h) => { ctx.clearRect(0, 0, w, h); const r = rng(12); ctx.fillStyle = '#ffe9b0'; land.forEach(l => { const n = Math.round(l.rx * l.ry / 90); for (let i = 0; i < n; i++) { const a = r.f() * Math.PI * 2, d = Math.sqrt(r.f()); ctx.globalAlpha = 0.5 + r.f() * 0.5; ctx.beginPath(); ctx.arc(l.x + Math.cos(a) * d * l.rx * 0.9, l.y + Math.sin(a) * d * l.ry * 0.9, 1.2 + r.f() * 1.8, 0, Math.PI * 2); ctx.fill(); } }); ctx.globalAlpha = 1; }); lightTex.magFilter = THREE.LinearFilter;
  const earthMat = new THREE.ShaderMaterial({ uniforms: { day: { value: tex }, lights: { value: lightTex }, sunDir: { value: new THREE.Vector3(1, 0, 0) }, lightsK: { value: 1 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D day; uniform sampler2D lights; uniform vec3 sunDir; uniform float lightsK; varying vec2 vUv; varying vec3 vN; void main(){ float d = dot(normalize(vN), normalize(sunDir)); vec3 c = pow(texture2D(day, vUv).rgb, vec3(2.2)); float lit = clamp(d, 0.0, 1.0); vec3 col = c * (0.05 + 0.95 * lit); vec4 L = texture2D(lights, vUv); float night = 1.0 - smoothstep(-0.2, 0.08, d); col += pow(L.rgb, vec3(2.2)) * L.a * night * lightsK * 1.8; gl_FragColor = vec4(col, 1.0); }' });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), earthMat); g.add(earth);
  const cloudTex = canvasTex(1024, 512, (c2, w, h) => { c2.clearRect(0, 0, w, h); const r = rng(9); c2.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 80; i++) { c2.beginPath(); c2.ellipse(r.f() * w, h * 0.12 + r.f() * h * 0.76, 8 + r.f() * 40, 3 + r.f() * 9, r.f() * 3, 0, Math.PI * 2); c2.fill(); } });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 48, 32), texMat({ map: cloudTex, transparent: true, roughness: 1 })); g.add(clouds);
  const atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 48, 32), new THREE.MeshBasicMaterial({ color: 0x6fb6ff, transparent: true, opacity: 0.18, side: THREE.BackSide, depthWrite: false })); g.add(atm);
  const atm2 = new THREE.Mesh(new THREE.SphereGeometry(R * 1.035, 48, 32), new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.12, depthWrite: false })); g.add(atm2);
  // ocean garbage: five gyres of white dots
  const gy = [[0.5, 0.3], [0.5, -0.3], [-0.9, 0.35], [-0.9, -0.3], [2.2, -0.2]]; const n = 2500; const pos = new Float32Array(n * 3); { const r = rng(21); for (let i = 0; i < n; i++) { const gg = gy[i % 5]; const lon = gg[0] + (r.f() - 0.5) * 0.9, lat = gg[1] + (r.f() - 0.5) * 0.5; const rr = R * 1.015; pos[i * 3] = rr * Math.cos(lat) * Math.cos(lon); pos[i * 3 + 1] = rr * Math.sin(lat); pos[i * 3 + 2] = rr * Math.cos(lat) * Math.sin(lon); } }
  const gge = new THREE.BufferGeometry(); gge.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const garbage = new THREE.Points(gge, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false })); garbage.frustumCulled = false; g.add(garbage);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false })); ring.rotation.x = Math.PI / 2; ring.visible = false; g.add(ring);
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 48, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); g.add(pulse);
  const glow = glowSprite(0x9fd0ff, 190, 0.22); scene.add(glow);
  const S = { scene, cam, earth: g };
  S.update = (t, c) => {
    const sd = c.sunDir || [200, 40, 120]; sun.position.set(sd[0], sd[1], sd[2]);
    g.rotation.y = (c.spin ?? 0.02) * t; clouds.rotation.y = t * 0.004; earthMat.uniforms.lightsK.value = c.lights ?? 1; earthMat.uniforms.sunDir.value.set(sd[0], sd[1], sd[2]); garbage.material.opacity = 0.9 * (c.garbage ?? 0); garbage.visible = garbage.material.opacity > 0.01;
    const th = c.ring ?? 0; ring.visible = th > 0.01 && th < Math.PI; if (ring.visible) { const rr = Math.max(0.5, R * 1.02 * Math.sin(th)); ring.scale.set(rr, rr, 1); ring.position.y = -R * 1.02 * Math.cos(th); }
    const pk = c.pulse ?? 0; pulse.material.opacity = pk > 0 && pk < 1 ? 0.5 * (1 - pk) : 0; pulse.scale.setScalar(1 + pk * 0.4);
    const ni = !!c.night; atm2.material.opacity = ni ? 0.03 : 0.12; atm.material.opacity = ni ? 0.08 : 0.18; glow.material.opacity = ni ? 0.06 : 0.22;
  };
  return S;
}

// ======================= SKY: the 787 loses its skin =======================
// ctx: skin (bool), engines, tl
export function buildSkyPlastic() {
  const S = buildSkyPlane(); const { scene } = S; const { jet } = S.actors;
  const skinIdx = [0, 1, 2, 3, 4, 5, 6, 7, 10]; const skin = skinIdx.map(i => jet.children[i]);
  const frame = new THREE.Group(); jet.add(frame); const fm = M(0x9aa1a8);
  for (let i = 0; i < 14; i++) { const rg = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.12, 6, 20), fm); rg.rotation.y = Math.PI / 2; rg.position.x = -17 + i * 2.6; frame.add(rg); }
  for (const y of [-1.2, 1.6]) frame.add(box(36, 0.2, 0.3, fm, 0, y, 0)); frame.add(box(36, 0.3, 3.4, fm, 0, -0.6, 0));
  frame.add(box(6, 0.2, 34, fm, 1, -0.6, 0)); for (const sz of [-1, 1]) { const sp = box(0.25, 0.3, 16, fm, -1, -0.6, sz * 9); sp.rotation.y = -sz * 0.35; frame.add(sp); }
  frame.add(box(0.3, 7, 0.3, fm, -19.5, 4.5, 0)); frame.children[frame.children.length - 1].rotation.z = 0.45;
  const seats = new THREE.Group(); frame.add(seats); for (let r = 0; r < 12; r++) for (const sz of [-1.1, -0.5, 0.5, 1.1]) { seats.add(box(0.6, 0.6, 0.5, M(0x2f4a7a), -14 + r * 2.4, -0.3, sz)); seats.add(box(0.6, 0.7, 0.12, M(0x2f4a7a), -14.3 + r * 2.4, 0.3, sz)); }
  const pax = []; for (let i = 0; i < 8; i++) { const p = new Person({ seed: 1400 + i, scale: 0.95 }); p.g.position.set(-13.6 + (i % 4) * 4.8, -0.65, i < 4 ? -1.1 : 1.1); p.g.rotation.y = Math.PI / 2; p.pose('sit'); frame.add(p.g); pax.push(p); }
  frame.visible = false; const wind = []; for (let i = 0; i < 20; i++) { const s = softSprite(0xffffff, 3, 0); frame.add(s); wind.push(s); }
  const upd = S.update;
  S.update = (t, c) => { upd(t, c); const sk = c.skin !== false; skin.forEach(m => m.visible = sk); frame.visible = !sk; if (!sk) { pax.forEach((p, i) => { p.pose('sit'); p.armL.rotation.x = -2.6; p.armR.rotation.x = -2.6; p.neck.rotation.x = -0.3; p.neck.rotation.z = Math.sin(t * 20 + i) * 0.08; face(p, { wide: 1, open: 0.8 }); }); wind.forEach((s, i) => { const k = (t * 1.8 + i * 0.05) % 1; s.position.set(14 - k * 34, 0.5 + (i % 3 - 1) * 0.6, (i % 2 ? 1.2 : -1.2)); s.material.opacity = 0.35 * (1 - k); }); } };
  S.actors.frame = frame;
  return S;
}

// ======================= SUPERMARKET aisle =======================
// ctx: vanish (bool), collapse 0..1, back (bool), shopper ('push'|'look'|'none'), splash 0..1
export function buildSupermarket() {
  const S = baseSet({ shadowExtent: 10, fogNear: 40, fogFar: 160, shadowRes: 2048 }); const { scene } = S; const r = rng(66); const ST = new THREE.Group(); scene.add(ST);
  S.sunOffset = new THREE.Vector3(2, 9, 4); S.sun.intensity = 0.85; S.hemi.intensity = 0.7; scene.add(new THREE.AmbientLight(0xffffff, 0.12));
  const floorT = checkerTex('#e8e4dc', '#d9d4ca', 24); const floor = plane(30, 30, texMat({ map: floorT }), 0, 0, -2); floor.receiveShadow = true; scene.add(floor);
  ST.add(plane(30, 30, M(0xf4f4f2), 0, 4.2, -2, Math.PI / 2)); for (let i = 0; i < 5; i++) scene.add(box(0.3, 0.08, 2.4, emis(0xffffff, 0.9), 0, 4.1, 2 - i * 3.2));
  ST.add(box(30, 4.2, 0.1, M(0xd8e4f0), 0, 2.1, -12)); const sign = lbl('DRINKS', 3.0, 0.8, { bg: '#c0392b', fg: '#fff', font: 'bold 100px sans-serif' }); sign.position.set(0, 3.5, -11.9); scene.add(sign);
  const shelfM = M(0xc9ccd1), postM = M(0x8a9099); const bottles = [];
  const cols = [0x5a2d0c, 0xe8902a, 0x9fd0ff, 0xf4f4f4, 0x4e8f5a, 0xd9534f];
  for (const sx of [-1, 1]) { const x = sx * 2.3; for (let s = 0; s < 4; s++) { const y = 0.25 + s * 0.85; ST.add(box(1.0, 0.05, 12, shelfM, x, y, -4)); } ST.add(box(1.0, 3.6, 12, M(0xe6e8ea), x + sx * 0.5, 1.8, -4)); for (let z = 2; z >= -10; z -= 3) ST.add(box(0.06, 3.6, 0.06, postM, x - sx * 0.5, 1.8, z));
    for (let s = 0; s < 4; s++) { const y = 0.275 + s * 0.85; for (let i = 0; i < 28; i++) { const z = 1.6 - i * 0.4; const cc = cols[(s + Math.floor(i / 4)) % 6]; const bx = x - sx * 0.25; const shell = cyl(0.11, 0.1, 0.62, mat(0xdfefff, { transparent: true, opacity: 0.3 }), 10, bx, y + 0.31, z); shell.castShadow = false; scene.add(shell); const cap = cyl(0.05, 0.05, 0.06, M(cols[(i + s) % 6]), 8, bx, y + 0.65, z); scene.add(cap); const liq = cyl(0.095, 0.09, 0.54, M(cc), 10, bx, y + 0.27, z); liq.castShadow = false; scene.add(liq); bottles.push({ shell, cap, liq, y0: y, x: bx, z, ph: r.f() }); } } }
  bakeStatic(ST, scene);
  const shopper = new Person({ seed: 77, shirt: 0x6fa36b, pants: 0x2f3b4e, hairStyle: 'long' }); scene.add(shopper.g);
  const trolley = new THREE.Group(); const tm = M(0xb8bcc4); trolley.add(box(0.6, 0.4, 0.9, tm, 0, 0.75, 0)); trolley.add(box(0.62, 0.04, 0.92, M(0x2b2d33), 0, 0.55, 0)); for (const sx of [-0.28, 0.28]) for (const sz of [-0.4, 0.4]) { trolley.add(cyl(0.05, 0.05, 0.04, M(0x1b1b1b), 8, sx, 0.05, sz)); trolley.add(box(0.03, 0.5, 0.03, tm, sx, 0.3, sz)); } trolley.add(box(0.7, 0.04, 0.04, M(0xd9534f), 0, 1.0, 0.5)); scene.add(trolley); const handle = trolley.children[trolley.children.length - 1];
  const splash = []; for (let i = 0; i < 24; i++) { const s = softSprite(0xffffff, 0.3, 0); scene.add(s); splash.push(s); }
  S.actors = { shopper, bottles };
  S.update = (t, c) => {
    S.setSky(0); const van = !!c.vanish; const col = easeIn(c.collapse ?? 0);
    bottles.forEach((b, i) => { const back = !!c.back; b.shell.visible = !van || back; b.cap.visible = b.shell.visible; const k = clamp(col * 1.3 - b.ph * 0.3, 0, 1); b.liq.scale.set(1 + k * 2.4, Math.max(0.04, 1 - k * 0.96), 1 + k * 2.4); b.liq.position.y = b.y0 + 0.27 * (1 - k * 0.96) + 0.0; b.liq.rotation.z = van && k < 0.9 && !c.back ? Math.sin(t * 5 + i * 1.3) * 0.045 : 0; });
    const sm = c.shopper || 'push'; shopper.g.visible = sm !== 'none'; trolley.visible = sm !== 'none'; handle.visible = !van;
    const sx = c.shopperX ?? -3.0; shopper.g.position.set(0, 0, sx); shopper.g.rotation.y = Math.PI; trolley.position.set(0, 0, sx - 1.0); trolley.rotation.y = 0;
    shopper.pose(sm === 'push' ? 'walk' : 'stand', t); shopper.armL.rotation.x = -0.9; shopper.armR.rotation.x = -0.9; if (sm === 'look') { shopper.neck.rotation.y = 0.7; shopper.neck.rotation.x = 0.1; shopper.armR.rotation.x = -1.0; } face(shopper, { wide: sm === 'look' ? 0.9 : 0, open: sm === 'look' && col > 0.5 ? 0.5 : 0 });
    const spk = c.splash ?? 0; splash.forEach((s, i) => { const k = clamp(spk * 1.2 - (i % 6) * 0.08, 0, 1); s.visible = k > 0 && k < 1; const side = i % 2 ? 1 : -1; s.position.set(side * (1.8 - k * 0.8), 0.3 + (i % 4) * 0.85 + Math.sin(k * Math.PI) * 0.4, 1.0 - (i % 8) * 1.1); s.material.opacity = 0.8 * (1 - k); s.scale.setScalar(0.2 + k * 0.5); });
  };
  return S;
}

// ======================= OCEAN with floating plastic + suspicious fish =======================
// ctx: vanish (bool), hero (bool: close fish), suspicious 0..1, flash
export function buildOceanPlastic() {
  const S = buildOcean(); const { scene } = S; const r = rng(123);
  const debris = new THREE.Group(); scene.add(debris);
  for (let i = 0; i < 160; i++) { const k = i % 3; let m; if (k === 0) { m = cyl(0.5, 0.45, 2.4, M(r.pick([0xf4f4f4, 0x9fd0ff, 0x4e8f5a])), 8, 0, 0, 0); m.rotation.z = Math.PI / 2; } else if (k === 1) { m = box(2.2, 0.15, 1.6, M(r.pick([0xf4f4f4, 0xd9534f, 0xf2c14e])), 0, 0, 0); } else { m = box(1.2, 0.5, 0.9, M(r.pick([0x3b6fb6, 0xe8902a, 0xf4f4f4])), 0, 0, 0); } const g = new THREE.Group(); g.add(m); g.position.set(r.range(-260, 260), 0.3, r.range(-420, -8)); g.rotation.y = r.f() * 6; g.userData.ph = r.f() * 6; debris.add(g); }
  const heroes = []; for (let i = 0; i < 3; i++) { const f = new THREE.Group(); const cc = [0xf2c14e, 0xe88c6a, 0x4a7fb5][i]; const body = ico(1.1, M(cc), 1, 0, 0, 0); body.scale.set(1.8, 0.8, 0.5); f.add(body); const tail = cone(0.8, 1.6, M(cc), 4, -2.2, 0, 0); tail.rotation.z = Math.PI / 2; f.add(tail); const eye = ico(0.28, M(0xffffff), 1, 1.2, 0.25, 0.45); eye.scale.z = 0.5; f.add(eye); const pup = ico(0.14, M(0x1b1b1b), 1, 1.3, 0.25, 0.58); f.add(pup); const brow = box(0.5, 0.08, 0.06, M(0x1b1b1b), 1.2, 0.58, 0.5); f.add(brow); f.userData = { brow, eye, pup }; f.position.set(-3 + i * 3.2, -12 - (i % 2) * 1.6, -9 - i * 1.5); scene.add(f); heroes.push(f); }
  const upd = S.update;
  S.update = (t, c) => {
    upd(t, c); if (c.underwater) { scene.fog.color.set(0x2f7fb3); scene.fog.near = 1; scene.fog.far = c.fogFar ?? 48; S.sun.intensity = 1.2; const u = S.sky.material.uniforms; u.top.value.set(0x1a5f98); u.horizon.value.set(0x2f7fb3); u.bottom.value.set(0x2a6f9c); } else { scene.fog.near = 400; scene.fog.far = 2200; S.sun.intensity = 2.7; } const van = !!c.vanish; debris.visible = !van; if (!van) debris.children.forEach((g, i) => { g.position.y = 0.3 + Math.sin(t * 1.2 + g.userData.ph) * 0.25; g.rotation.z = Math.sin(t * 0.9 + g.userData.ph) * 0.08; });
    const hero = !!c.hero; heroes.forEach((f, i) => { f.visible = hero; if (hero) { const s = c.suspicious ?? 0; f.rotation.y = lerp(0.2, -0.45, s) + Math.sin(t * 0.7 + i) * 0.05; f.position.x = -3 + i * 3.2 + Math.sin(t * 0.5 + i) * 0.3; f.position.y = -12 - (i % 2) * 1.6 + Math.sin(t * 1.3 + i) * 0.2; f.userData.brow.rotation.z = -0.55 * s; f.userData.brow.position.y = 0.58 - 0.12 * s; f.userData.eye.scale.y = 1 - 0.35 * s; f.children[1].rotation.y = Math.sin(t * 5 + i) * 0.3; } });
  };
  return S;
}
