import * as THREE from 'three';
import { mat, box, cyl, ico, cone, plane, rng, lerp, clamp, smooth, easeOut, easeIn, prog, emis, canvasTex, texMat, windowTex, bakeStatic, softSprite, glowSprite, makeStars, pathTex, waterTex } from './util.js';
import { M, Person, makeTree, makeLamp, makePigeon, flapPigeon, makeAirliner, makeClockTower, makeBuilding } from './kit.js';
import { baseSet } from './sets.js';
import { makeDave, makePriya, buildOcean } from './water.js';
import { buildCity, buildStudio } from './world.js';

// ---------- small helpers ----------
function lblTex(text, w = 512, h = 128, fg = '#ffffff', bg = null, font = 'bold 64px sans-serif') { return canvasTex(w, h, (ctx, W, H) => { if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); } ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, W / 2, H / 2); }); }
export function lbl(text, w, h, o = {}) { const t = lblTex(text, o.pw || 512, o.ph || 128, o.fg, o.bg, o.font); t.magFilter = THREE.LinearFilter; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !o.bg, side: THREE.DoubleSide })); m.userData.tex = t; return m; }
// label whose text can change at runtime (redraws its canvas only when the text changes)
function dynLbl(w, h, o = {}) { const c = document.createElement('canvas'); c.width = o.pw || 512; c.height = o.ph || 128; const ctx = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.LinearFilter; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !o.bg, side: THREE.DoubleSide })); m.userData.last = null; m.userData.set = (text) => { if (text === m.userData.last) return; m.userData.last = text; ctx.clearRect(0, 0, c.width, c.height); if (o.bg) { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, c.width, c.height); } ctx.fillStyle = o.fg || '#fff'; ctx.font = o.font || 'bold 64px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, c.width / 2, c.height / 2); t.needsUpdate = true; }; m.userData.set(o.text || ''); return m; }
const whitesOf = (p) => p.neck.children.filter(m => m.isMesh && m.material && m.material.color && m.material.color.getHex() === 0xf8f6f2 && m.geometry.type === 'IcosahedronGeometry');
function face(p, c = {}) { const W = p._whites || (p._whites = whitesOf(p)); const w = c.wide ?? 0; W.forEach(x => x.scale.set(1 + 0.5 * w, 1 + 0.5 * w, 0.55)); p.mouth.scale.set(1 + 0.5 * (c.open ?? 0), 1 + 3 * (c.open ?? 0) + (c.smile ? 0.3 : 0), 1); }
export function makePenguin(s = 1) { const g = new THREE.Group(); g.add(cyl(0.1, 0.15, 0.42, M(0x1b1f26), 8, 0, 0.21, 0)); g.add(box(0.14, 0.3, 0.06, M(0xf4f4f4), 0, 0.2, 0.11)); g.add(ico(0.1, M(0x1b1f26), 1, 0, 0.47, 0)); const bk = cone(0.03, 0.1, M(0xe8902a), 5, 0, 0.46, 0.12); bk.rotation.x = Math.PI / 2; g.add(bk); for (const sx of [-0.05, 0.05]) g.add(box(0.07, 0.03, 0.1, M(0xe8902a), sx, 0.015, 0.03)); for (const sx of [-1, 1]) { const w = box(0.03, 0.26, 0.1, M(0x1b1f26), sx * 0.13, 0.22, 0); w.rotation.z = sx * 0.25; g.add(w); } g.scale.setScalar(s); return g; }
const WATER = 0x5fb3e6;

// ======================= BEACH =======================
// ctx: dave ('kneel'|'pat'|'dig'|'standSea'|'frozen'), tower4 (0..1 drop-in), wide/open (face), daveLook ('castle'|'cam'|'sea'|'priya'), priya ('read'|'look'|'up'|'stand'), bucket (bool: Dave holds it up),
//      icecream (bool), floodY (m), wallH (m), lift (sea slab rise), gull ('dave'|'fly'|'post'|null), gullT, flash
export function buildBeach() {
  const S = baseSet({ shadowExtent: 30, fogNear: 300, fogFar: 1600, shadowRes: 2048 }); const { scene } = S; const r = rng(77); const ST = new THREE.Group(); scene.add(ST);
  S.sunOffset = new THREE.Vector3(40, 60, 50); S.sun.intensity = 2.6;
  const sandT = pathTex(4); sandT.repeat.set(200, 40); const sand = plane(3000, 250, texMat({ map: sandT }), 0, 0, 65); sand.receiveShadow = true; scene.add(sand);
  // sea slab behind the beach (z < -60), with a water texture on top
  const wT = waterTex(); wT.repeat.set(120, 60); const sea = new THREE.Mesh(new THREE.BoxGeometry(3000, 30, 1500), [M(0x2a6f9c), M(0x2a6f9c), texMat({ map: wT }), M(0x2a6f9c), M(0x2a6f9c), M(0x2a6f9c)]); sea.position.set(0, -15.3, -60 - 750); sea.receiveShadow = true; scene.add(sea);
  scene.add(box(3000, 0.25, 6, M(0xf4f1e6), 0, -0.1, -60)); // foam line at the water's edge
  // the wall of water on the horizon (its height is driven by ctx.wallH)
  const wall = new THREE.Mesh(new THREE.BoxGeometry(3000, 1, 80), mat(0x7fc3ee, { transparent: true, opacity: 0.92 })); wall.position.set(0, 0.5, -330); wall.visible = false; scene.add(wall);
  const wallFoam = box(3000, 0.06, 90, M(0xffffff), 0, 1, -330, false); wallFoam.visible = false; scene.add(wallFoam);
  // flood plane over the sand (driven by ctx.floodY)
  const flood = plane(3000, 260, mat(0x7fc3ee, { transparent: true, opacity: 0.78 }), 0, -1, 40); flood.visible = false; scene.add(flood);
  // pier on the left
  const wood = M(0x7a5a3a); for (let z = 0; z >= -130; z -= 9) for (const x of [-27, -21]) ST.add(cyl(0.3, 0.35, 6.5, M(0x4a4a4a), 8, x, 2.5, z));
  ST.add(box(9, 0.35, 145, wood, -24, 5, -62)); for (const x of [-28.3, -19.7]) { ST.add(box(0.12, 1.0, 145, M(0xf4f4f4), x, 5.7, -62)); for (let z = 5; z >= -130; z -= 4.5) ST.add(box(0.12, 1.0, 0.12, M(0xf4f4f4), x, 5.7, z)); }
  const pav = new THREE.Group(); pav.position.set(-24, 5.2, -128); pav.add(box(11, 4.2, 11, M(0xf4efe4), 0, 2.1, 0)); const pr = cone(8.5, 4.5, M(0x4e8f5a), 4, 0, 6.4, 0); pr.rotation.y = Math.PI / 4; pav.add(pr); pav.add(cyl(0.08, 0.08, 3, M(0xdddddd), 6, 0, 10, 0)); pav.add(box(1.4, 0.8, 0.05, M(0xd9534f), 0.7, 11, 0)); ST.add(pav);
  for (let z = -20; z >= -120; z -= 25) ST.add((() => { const l = makeLamp(); l.position.set(-24, 5.2, z); l.scale.setScalar(0.8); return l; })());
  // beach huts + promenade + town behind
  const hutC = [0x6fb3e8, 0xf2c85b, 0xe88c6a, 0x8fd09a, 0xd98fc2, 0xf4efe4, 0x6fb3e8];
  for (let i = 0; i < 9; i++) { const x = -16 + i * 4.2; ST.add(box(2.4, 2.4, 2.4, M(hutC[i % 7]), x, 1.2, 46)); const rf = cone(1.9, 1.2, M(0x3a3f45), 4, x, 3.0, 46); rf.rotation.y = Math.PI / 4; ST.add(rf); ST.add(box(0.8, 1.5, 0.08, M(0x3a3f45), x, 0.75, 44.75)); }
  ST.add(plane(3000, 30, M(0x9a9ea6), 0, 0.3, 70)); ST.add(box(3000, 1.0, 0.8, M(0xc9c3b5), 0, 0.5, 55));
  for (let x = -40; x <= 40; x += 16) { const l = makeLamp(); l.position.set(x, 0.3, 60); ST.add(l); }
  for (let i = 0; i < 14; i++) { const b = makeBuilding(r.range(8, 14), r.range(8, 20), 10, 2200 + i, { base: r.pick(['#f1e4d0', '#e6cfc0', '#d9e2ea', '#f4efe4']), litRatio: 0.08 }); b.position.set(-90 + i * 14 + r.range(-3, 3), 0.3, 95 + r.range(0, 30)); ST.add(b); }
  for (let i = 0; i < 10; i++) { const t = makeTree(2300 + i); t.position.set(r.range(-80, 80), 0.3, r.range(78, 90)); t.scale.setScalar(r.range(1.0, 1.5)); ST.add(t); }
  // towels, parasol, background people
  ST.add(box(2.0, 0.03, 1.2, M(0xd9534f), 6, 0.02, 5)); ST.add(box(2.0, 0.03, 1.2, M(0x2f80ed), -7, 0.02, 7));
  const para = new THREE.Group(); para.position.set(7.5, 0, 4); para.add(cyl(0.04, 0.04, 2.2, M(0xdddddd), 6, 0, 1.1, 0)); para.add(cone(1.3, 0.5, M(0xf2c85b), 10, 0, 2.3, 0)); ST.add(para);
  bakeStatic(ST, scene);
  const bg1 = new Person({ seed: 21, shirt: 0x2f80ed, pants: 0xf4efe4 }); bg1.g.position.set(6.4, 0, 5.6); bg1.g.rotation.y = Math.PI; bg1.g.rotation.x = -Math.PI / 2 + 0.1; bg1.g.position.y = 0.25; scene.add(bg1.g); // lying on the towel
  const bg2 = new Person({ seed: 22, shirt: 0xe88c6a, pants: 0x3b4a6b }); bg2.g.position.set(-9, 0, 2.5); bg2.g.rotation.y = Math.PI; scene.add(bg2.g);
  const bg3 = new Person({ seed: 23, shirt: 0x8fd09a, pants: 0x2b2d33, hairStyle: 'long' }); bg3.g.position.set(-10, 0, 2.2); bg3.g.rotation.y = Math.PI + 0.3; scene.add(bg3.g);
  // Dave at the castle, Priya in a deckchair
  const dave = makeDave(); dave.g.position.set(0, 0, -0.7); scene.add(dave.g);
  const bucket = new THREE.Group(); const bk = cyl(0.13, 0.1, 0.22, M(0xd9534f), 10, 0, 0, 0); bucket.add(bk); bucket.add(cyl(0.135, 0.135, 0.03, M(0xf4efe4), 10, 0, 0.1, 0)); bucket.position.set(0.9, 0.11, -0.2); scene.add(bucket);
  const handBucket = bucket.clone(); handBucket.rotation.x = Math.PI; handBucket.position.set(0, -0.72, 0); handBucket.visible = false; dave.armL.add(handBucket);
  const spade = new THREE.Group(); spade.add(cyl(0.015, 0.015, 0.5, M(0xf2c85b), 6, 0, 0.25, 0)); spade.add(box(0.12, 0.16, 0.02, M(0xf2c85b), 0, 0.02, 0)); spade.position.set(-0.75, 0, 0.1); spade.rotation.z = 0.5; scene.add(spade);
  const chair = new THREE.Group(); chair.position.set(2.0, 0, 0.6); scene.add(chair); chair.add(box(1.0, 0.05, 1.3, M(0x2f80ed), 0, 0.5, 0.1)); const back = box(1.0, 1.0, 0.05, M(0x2f80ed), 0, 0.95, -0.55); back.rotation.x = -0.45; chair.add(back); for (const sx of [-0.45, 0.45]) { chair.add(box(0.05, 0.5, 0.05, M(0xd0d0d0), sx, 0.25, 0.6)); chair.add(box(0.05, 0.5, 0.05, M(0xd0d0d0), sx, 0.25, -0.5)); }
  for (let i = 0; i < 5; i++) chair.add(box(1.0, 0.05, 0.001, M(0xf4efe4), 0, 0.53, -0.4 + i * 0.22, false));
  const priya = makePriya(); priya.g.position.set(2.0, 0, 0.75); scene.add(priya.g);
  const paperT = lblTex('SEATING PLAN', 256, 342, '#333', '#f8f6f0', 'bold 30px sans-serif'); paperT.magFilter = THREE.LinearFilter; const paper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.008), [M(0xf4efe4), M(0xf4efe4), M(0xf4efe4), M(0xf4efe4), texMat({ map: paperT }), M(0xf4efe4)]); paper.position.set(0.08, -0.6, 0.14); paper.rotation.set(-0.35, 0, 0); priya.armR.add(paper);
  const sun = new THREE.Group(); sun.add(box(0.19, 0.055, 0.03, M(0x1b1b1b), 0, 0.2, 0.17)); priya.neck.add(sun); // sunglasses
  // kid with an ice cream (the scoop vanishes at the event)
  const kid = new Person({ seed: 44, scale: 0.62, shirt: 0x58b0e0, pants: 0xf0d060, skin: 0xc68642 }); kid.g.position.set(-3.6, 0, 2.6); kid.g.rotation.y = 0.5; scene.add(kid.g);
  const cone0 = cone(0.05, 0.15, M(0xe0b27a), 6, 0, -0.62, 0.05); cone0.rotation.x = Math.PI; kid.armR.add(cone0); const scoop = ico(0.065, M(0xf6a5c0), 1, 0, -0.5, 0.05); kid.armR.add(scoop); const scoop2 = ico(0.05, M(0xf4efe4), 1, 0, -0.42, 0.05); kid.armR.add(scoop2); const drip = ico(0.03, M(0xf6a5c0), 0, 0, -0.7, 0.05); kid.armR.add(drip); const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), M(0xf6a5c0)); puddle.rotation.x = -Math.PI / 2; puddle.position.set(-3.45, 0.012, 2.95); scene.add(puddle);
  // the sandcastle: a scale model of the venue
  const castle = new THREE.Group(); scene.add(castle); const sm = M(0xdcc38f), sm2 = M(0xcdb27c);
  castle.add(cyl(1.0, 1.15, 0.22, sm2, 14, 0, 0.11, 0)); castle.add(box(0.7, 0.5, 0.5, sm, 0, 0.47, 0)); castle.add(box(0.76, 0.06, 0.56, sm2, 0, 0.75, 0));
  const towers = []; [[-0.55, -0.4], [0.55, -0.4], [-0.55, 0.45], [0.55, 0.45]].forEach(([x, z], i) => { const tw = new THREE.Group(); tw.position.set(x, 0.22, z); tw.add(cyl(0.16, 0.18, 0.45, sm, 10, 0, 0.225, 0)); tw.add(cyl(0.19, 0.19, 0.06, sm2, 10, 0, 0.47, 0)); for (let k = 0; k < 5; k++) tw.add(box(0.06, 0.06, 0.06, sm, Math.cos(k * 1.26) * 0.17, 0.53, Math.sin(k * 1.26) * 0.17)); castle.add(tw); towers.push(tw); });
  castle.add(cyl(0.012, 0.012, 0.42, M(0x8a6a4a), 5, 0.55, 0.9, -0.42)); const flag = lbl('VENUE', 0.22, 0.1, { bg: '#d9534f', fg: '#fff', font: 'bold 56px sans-serif', pw: 256, ph: 118 }); flag.position.set(0.67, 1.06, -0.42); castle.add(flag);
  for (let i = 0; i < 6; i++) castle.add(box(0.05, 0.03, 0.05, M(0xf4efe4), -0.25 + i * 0.1, 0.78, (i % 2) * 0.16 - 0.08, false)); // tiny "tables" on the roof
  const moat = new THREE.Mesh(new THREE.RingGeometry(1.12, 1.4, 24), M(0xb89b63)); moat.rotation.x = -Math.PI / 2; moat.position.y = 0.01; moat.visible = false; scene.add(moat);
  const sandBits = []; for (let i = 0; i < 10; i++) { const b = ico(0.03, sm2, 0, 0, 0, 0, false); b.visible = false; scene.add(b); sandBits.push(b); }
  // seagull
  const gull = makePigeon(5); gull.traverse(o => { if (o.isMesh && o.material.color && o.material.color.getHex() !== 0xe0a050) o.material = M(0xf4f4f4); }); gull.scale.setScalar(1.15); scene.add(gull);
  const gulls = []; for (let i = 0; i < 5; i++) { const g2 = makePigeon(6 + i); g2.traverse(o => { if (o.isMesh && o.material.color && o.material.color.getHex() !== 0xe0a050) o.material = M(0xf4f4f4); }); g2.scale.setScalar(2.2); g2.visible = false; scene.add(g2); gulls.push(g2); }
  S.actors = { dave, priya, kid, castle, gull };
  S.update = (t, c) => {
    S.setSky(0);
    const dm = c.dave || 'kneel';
    // Dave
    if (dm === 'standSea') { dave.pose('stand', t); dave.g.rotation.y = Math.PI; dave.neck.rotation.x = -0.25; dave.g.position.set(-0.3, 0, -0.9); }
    else { dave.g.rotation.y = 0; dave.g.position.set(0, 0, -0.7); dave.pose('kneel'); dave.neck.rotation.x = 0.35; }
    if (dm === 'pat') { dave.armR.rotation.x = -1.3 + Math.sin(t * 9) * 0.25; dave.armR.rotation.z = -0.3; }
    if (dm === 'dig') { const w = Math.sin(t * 7); dave.armR.rotation.x = -1.2 + w * 0.4; dave.armL.rotation.x = -1.1 - w * 0.4; dave.armR.rotation.z = -0.35; dave.armL.rotation.z = 0.35; dave.torso.rotation.y = w * 0.12; dave.neck.rotation.x = 0.45; }
    if (dm === 'frozen') { dave.armL.rotation.x = -0.4; dave.armR.rotation.x = -0.4; }
    const dl = c.daveLook || (dm === 'standSea' ? 'sea' : 'castle'); dave.neck.rotation.y = 0;
    if (dl === 'cam') dave.neck.rotation.x = -0.05; else if (dl === 'priya') { dave.neck.rotation.y = -0.7; dave.neck.rotation.x = 0.1; } else if (dl === 'sea') { dave.neck.rotation.x = -0.25; }
    if (c.bucket) { handBucket.visible = true; dave.armL.rotation.x = -3.0; dave.armL.rotation.z = 0.15; } else handBucket.visible = false;
    face(dave, { wide: c.wide ?? 0, open: c.open ?? 0, smile: !!c.smile });
    // the 4th tower drops into place
    const k4 = c.tower4 ?? 1; towers[3].position.y = 0.22 + (1 - easeOut(k4)) * 0.6; towers[3].visible = k4 > 0.01;
    moat.visible = (c.moat ?? 0) > 0.01;
    sandBits.forEach((b, i) => { const on = dm === 'dig'; b.visible = on; if (on) { const s = ((t * 1.4 + i * 0.1) % 1); b.position.set(-0.6 - s * 0.9, 0.3 + Math.sin(s * Math.PI) * 0.5, 0.3 + (i % 3 - 1) * 0.15); } });
    // Priya
    const pm = c.priya || 'read'; priya.g.position.y = pm === 'stand' ? 0.52 : 0; priya.g.position.z = pm === 'stand' ? 0.55 : 0.75;
    if (pm === 'stand') { priya.pose('stand', t); priya.armR.rotation.x = -3.05; priya.armR.rotation.z = -0.1; priya.neck.rotation.x = -0.1; }
    else { priya.pose('sit'); priya.armR.rotation.x = -1.15; priya.armR.rotation.z = -0.15; priya.armL.rotation.x = -1.0; priya.armL.rotation.z = 0.2; priya.neck.rotation.x = 0.25; if (pm === 'look') { priya.neck.rotation.y = 0.75; priya.neck.rotation.x = 0.05; } if (pm === 'up') { priya.armR.rotation.x = -3.05; priya.neck.rotation.x = -0.1; } }
    priya.g.rotation.y = 0;
    // kid
    kid.pose('stand', t); kid.armR.rotation.x = -1.35; kid.neck.rotation.x = 0.3; const ic = c.icecream ?? true; scoop.visible = ic; scoop2.visible = ic; drip.visible = !ic; puddle.visible = !ic; if (!ic) { kid.neck.rotation.x = 0.5; drip.position.y = -0.7 - ((t * 0.7) % 1) * 0.25; }
    // water
    const fy = c.floodY ?? 0; flood.visible = fy > 0.005; flood.position.y = fy; flood.position.z = lerp(-200, 40, clamp(fy / 0.3, 0, 1));
    const wh = c.wallH ?? 0; wall.visible = wh > 0.05; wall.scale.y = Math.max(0.01, wh); wall.position.y = wh / 2; wallFoam.visible = wall.visible; wallFoam.position.y = wh + 0.05;
    sea.position.y = -15.3 + (c.lift ?? 0);
    // gulls
    const gm = c.gull || null; gull.visible = !!gm;
    if (gm === 'dave') { gull.position.set(0.02, 1.44 + (dm === 'standSea' ? 0.4 : 0), -0.72); gull.rotation.y = -0.6; flapPigeon(gull, t, 0.1); }
    else if (gm === 'post') { gull.position.set(0.9, 0.24, -0.2); gull.rotation.y = -1.2; flapPigeon(gull, t, 0.05); }
    else if (gm === 'fly') { const lt = c.gullT ?? 0; gull.position.set(-1 + lt * 2.5, 1.6 + lt * 2.5, 2 - lt * 8); gull.rotation.y = Math.PI; flapPigeon(gull, t, 0.9); }
    gulls.forEach((g2, i) => { const on = !!c.flock; g2.visible = on; if (on) { const lt = (c.gullT ?? 0) + i * 0.07; g2.position.set(-14 + i * 3.2 + lt * 10, 5 + i * 0.9 - lt * 1.5, -90 + lt * 100); g2.rotation.y = -Math.PI / 2 + 0.2; flapPigeon(g2, t + i, 0.9); } });
  };
  return S;
}

// ======================= ANTARCTICA =======================
// ctx: melt 0..1, slide 0..1 (wave sliding off the edge), waterY override, pov (bool: faster foam)
export function buildAntarctica() {
  const S = baseSet({ shadowExtent: 80, fogNear: 500, fogFar: 2600, shadowRes: 2048 }); const { scene } = S; const r = rng(55); const ST = new THREE.Group(); scene.add(ST);
  S.sunOffset = new THREE.Vector3(60, 40, 80); S.sun.intensity = 2.4;
  const iceM = mat(0xf4f8fb, { transparent: true, opacity: 1 }); const seaM = M(0x2a6f9c);
  const ice = plane(4000, 2600, iceM, 0, 0, 1100); ice.receiveShadow = true; scene.add(ice); // plateau at y=0, from z=-200 to z=+2400
  const cliff = new THREE.Mesh(new THREE.BoxGeometry(4000, 60, 4), iceM); cliff.position.set(0, -30, -200); scene.add(cliff);
  scene.add(plane(4000, 3000, seaM, 0, -60, -1700)); // the sea in front, 60 m down
  const inland = plane(4000, 2600, mat(0x3f8fc6, { transparent: true, opacity: 0.9 }), 0, -60, 1100); scene.add(inland); // meltwater on the continent (rises with melt)
  // mountains poking through
  for (let i = 0; i < 14; i++) { const m = ico(r.range(25, 60), M(0x6b6f74), 1, r.range(-900, 900), r.range(-10, 10), r.range(500, 1500)); m.scale.y = 1.6; ST.add(m); const cap = ico(r.range(12, 25), iceM, 1, m.position.x, m.position.y + 40, m.position.z); scene.add(cap); }
  // ice blocks / sastrugi
  bakeStatic(ST, scene);
  // research station (red boxes on stilts) + penguins
  const station = new THREE.Group(); station.position.set(8, 0, 20); for (let i = 0; i < 3; i++) { station.add(box(6, 3, 5, M(0xd9534f), i * 7, 2.6, 0)); for (const [sx, sz] of [[-2.5, -2], [2.5, -2], [-2.5, 2], [2.5, 2]]) station.add(cyl(0.2, 0.2, 1.2, M(0x333333), 6, i * 7 + sx, 0.6, sz)); } station.add(cyl(0.1, 0.1, 6, M(0xdddddd), 6, -3, 3, 0)); station.add(box(1.2, 0.8, 0.05, M(0x2f80ed), -2.4, 5.6, 0)); scene.add(station);
  const pens = []; for (let i = 0; i < 9; i++) { const p = makePenguin(1.8); p.position.set(-8 + (i % 5) * 3 + r.range(-0.6, 0.6), 0, 8 + Math.floor(i / 5) * 3 + r.range(-0.6, 0.6)); p.rotation.y = r.range(-0.6, 0.6); scene.add(p); pens.push(p); }
  // the wave sliding off the edge
  const wave = new THREE.Mesh(new THREE.BoxGeometry(4000, 50, 160), mat(0x8fd0ee, { transparent: true, opacity: 0.9 })); wave.visible = false; scene.add(wave);
  const foam = box(4000, 2, 170, M(0xffffff), 0, 0, 0, false); foam.visible = false; scene.add(foam);
  const falls = new THREE.Mesh(new THREE.BoxGeometry(4000, 58, 30), mat(0x8fd0ee, { transparent: true, opacity: 0.88 })); falls.position.set(0, -31, -215); falls.visible = false; scene.add(falls);
  const fallFoam = []; for (let i = 0; i < 30; i++) { const sp = softSprite(0xffffff, 40, 0); sp.userData = { x: -1500 + i * 100, ph: (i * 0.37) % 1 }; scene.add(sp); fallFoam.push(sp); }
  const spray = []; for (let i = 0; i < 24; i++) { const s = softSprite(0xffffff, r.range(20, 50), 0); s.userData = { x: r.range(-1500, 1500), ph: r.f() }; scene.add(s); spray.push(s); }
  S.actors = { station, pens };
  S.update = (t, c) => {
    S.setSky(0);
    const k = c.melt ?? 0; const ks = smooth(k);
    iceM.color.setHex(0xf4f8fb).lerp(new THREE.Color(0x3f8fc6), ks * 0.9); iceM.opacity = lerp(1, 0.0, clamp((ks - 0.25) / 0.6, 0, 1)); ice.visible = iceM.opacity > 0.02; cliff.visible = ice.visible;
    const wy = c.waterY ?? lerp(-60, -1.5, clamp(ks * 1.25, 0, 1)); inland.position.y = wy; inland.visible = wy > -59;
    const fl = wy > -2.5; station.position.y = fl ? wy + 0.3 + Math.sin(t * 1.2) * 0.15 : 0; station.rotation.z = fl ? 0.08 * Math.sin(t * 0.8) : 0; station.rotation.x = fl ? 0.06 : 0;
    pens.forEach((p, i) => { const fl2 = wy > -1.8; p.position.y = fl2 ? wy + 0.05 + Math.sin(t * 2 + i) * 0.08 : 0; p.rotation.x = fl2 ? Math.sin(t * 1.5 + i) * 0.2 : 0; });
    const sl = c.slide ?? 0; falls.visible = sl > 0.01; fallFoam.forEach((sp, i) => { sp.visible = sl > 0.01; if (sp.visible) { const kk = (t * 0.8 + sp.userData.ph) % 1; sp.position.set(sp.userData.x + Math.sin(t + i) * 10, -58 + kk * 45, -232 - kk * 30); sp.material.opacity = 0.7 * (1 - kk); const sc = 30 + kk * 50; sp.scale.set(sc, sc * 0.8, 1); } });
    wave.visible = sl > 0.01; if (wave.visible) { const z = -220 - sl * 1500; wave.position.set(0, -60 + 25 - sl * 10, z); foam.visible = true; foam.position.set(0, wave.position.y + 25, z); }
    else foam.visible = false;
    spray.forEach((s, i) => { const on = sl > 0.01; s.visible = on; if (on) { const kk = (t * 0.6 + s.userData.ph) % 1; s.position.set(s.userData.x, wave.position.y + 25 + kk * 40, wave.position.z + 60 - kk * 30); s.material.opacity = 0.6 * (1 - kk); const sc = 20 + kk * 40; s.scale.set(sc, sc, 1); } });
  };
  return S;
}

// ======================= EARTH (space) =======================
// ctx: melt 0..1 (land ice), seaIce 0..1 (arctic floating ice: 1 = present), rise 0..1 (coasts move inland), ring (0..pi, wave front from the south pole), spin
export function buildEarthIce() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000004);
  const cam = new THREE.PerspectiveCamera(42, 1080 / 1920, 0.1, 3000);
  const stars = makeStars(1600, 1400, 3); stars.material.opacity = 0.9; stars.material.size = 2.4; scene.add(stars);
  const stars2 = makeStars(1600, 1400, 4); stars2.rotation.z = Math.PI; stars2.material.opacity = 0.9; stars2.material.size = 2.4; scene.add(stars2);
  const sun = new THREE.DirectionalLight(0xfff6e8, 2.6); sun.position.set(200, 40, 120); scene.add(sun); scene.add(new THREE.AmbientLight(0x224466, 0.55));
  const R = 60; const g = new THREE.Group(); scene.add(g);
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.LinearFilter;
  const land = []; { const r = rng(5); for (let i = 0; i < 70; i++) land.push({ x: r.f() * 1024, y: 512 * 0.15 + r.f() * 512 * 0.7, rx: 20 + r.f() * 90, ry: 15 + r.f() * 55, a: r.f() * 3, c: r.f() < 0.3 ? '#b59a5a' : '#3f7a3a' }); }
  const seaIceBits = []; { const r = rng(17); for (let i = 0; i < 60; i++) seaIceBits.push({ x: r.f() * 1024, y: 10 + r.f() * 62, rx: 18 + r.f() * 70, ry: 7 + r.f() * 16 }); }
  let last = '';
  function draw(melt, seaIce, rise) {
    const key = [melt.toFixed(2), seaIce.toFixed(2), rise.toFixed(2)].join('|'); if (key === last) return; last = key;
    ctx.fillStyle = '#1f4f8f'; ctx.fillRect(0, 0, 1024, 512);
    const sh = 1 - 0.18 * rise; land.forEach(l => { ctx.beginPath(); ctx.ellipse(l.x, l.y, l.rx * sh, l.ry * sh, l.a, 0, Math.PI * 2); ctx.fillStyle = l.c; ctx.fill(); });
    const ch = 512 * 0.13 * (1 - melt); ctx.fillStyle = '#f4f7fa'; if (ch > 0.5) { ctx.fillRect(0, 512 - ch, 1024, ch); ctx.fillRect(0, 0, 1024, ch * 0.35); }
    if (melt < 1) { ctx.beginPath(); ctx.ellipse(300, 70, 70 * (1 - melt), 40 * (1 - melt), 0.3, 0, Math.PI * 2); ctx.fill(); } // greenland
    if (seaIce > 0) { ctx.fillStyle = 'rgba(244,247,250,' + (0.95 * seaIce).toFixed(2) + ')'; seaIceBits.forEach(b => { ctx.beginPath(); ctx.ellipse(b.x, b.y, b.rx * seaIce, b.ry * seaIce, 0, 0, Math.PI * 2); ctx.fill(); }); }
    tex.needsUpdate = true;
  }
  draw(0, 1, 0);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), texMat({ map: tex, roughness: 0.9 })); g.add(earth);
  const cloudTex = canvasTex(1024, 512, (c2, w, h) => { c2.clearRect(0, 0, w, h); const r = rng(9); c2.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < 90; i++) { c2.beginPath(); c2.ellipse(r.f() * w, h * 0.12 + r.f() * h * 0.76, 8 + r.f() * 40, 3 + r.f() * 9, r.f() * 3, 0, Math.PI * 2); c2.fill(); } });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 48, 32), texMat({ map: cloudTex, transparent: true, roughness: 1 })); g.add(clouds);
  const atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 48, 32), new THREE.MeshBasicMaterial({ color: 0x6fb6ff, transparent: true, opacity: 0.18, side: THREE.BackSide, depthWrite: false })); g.add(atm);
  const atm2 = new THREE.Mesh(new THREE.SphereGeometry(R * 1.035, 48, 32), new THREE.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.12, depthWrite: false })); g.add(atm2);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false })); ring.rotation.x = Math.PI / 2; ring.visible = false; g.add(ring);
  const ring2 = ring.clone(); ring2.material = ring.material.clone(); ring2.material.opacity = 0.35; g.add(ring2);
  const glow = glowSprite(0x9fd0ff, 190, 0.22); scene.add(glow);
  const pg = [1, -1].map(sg => { const sp = softSprite(0x9fd0ff, 46, 0); sp.position.set(0, sg * R * 1.04, 0); g.add(sp); return sp; });
  const S = { scene, cam, earth: g };
  S.update = (t, c) => {
    draw(clamp(c.melt ?? 0, 0, 1), clamp(c.seaIce ?? 1, 0, 1), clamp(c.rise ?? 0, 0, 1)); const sd = c.sunDir || [200, 40, 120]; sun.position.set(sd[0], sd[1], sd[2]);
    g.rotation.y = (c.spin ?? 0.02) * t; clouds.rotation.y = t * 0.004; pg.forEach(sp => { sp.material.opacity = (c.poleGlow ?? 0) * (0.55 + 0.15 * Math.sin(t * 5)); });
    const th = c.ring ?? 0; [ring, ring2].forEach((rg, i) => { const tt = Math.max(0, th - i * 0.25); rg.visible = tt > 0.01 && tt < Math.PI; if (rg.visible) { const rr = Math.max(0.5, R * 1.02 * Math.sin(tt)); rg.scale.set(rr, rr, 1); rg.position.y = -R * 1.02 * Math.cos(tt); } });
  };
  return S;
}

// ======================= STUDIO (extra props) =======================
// props: cube, slab (slabMelt), energy (years 0..1, stamp 0..1), tower (waterK), cities (waterK), bath (cubeK, eureka), salt (saltK, pour)
export function buildStudioIce() {
  const S = buildStudio(); const { scene, P } = S; const add = (k, g) => { P[k] = g; scene.add(g); return g; };
  // 30 million km3 ice cube with a tiny Dave
  { const g = new THREE.Group(); const im = mat(0xcfeaff, { transparent: true, opacity: 0.72 }); const cube = box(3.2, 3.2, 3.2, im, 0, 1.6, 0); g.add(cube); g.add(box(3.25, 3.25, 3.25, mat(0xffffff, { wireframe: true, transparent: true, opacity: 0.25 }), 0, 1.6, 0, false)); const l = lbl('30,000,000 KM³', 2.6, 0.5, { fg: '#f2c85b', font: 'bold 60px sans-serif' }); l.position.set(0, 3.7, 0); g.add(l); const d = makeDave(); d.g.scale.setScalar(0.35); d.g.position.set(-0.4, 0, 2.0); g.add(d.g); const l2 = lbl('DAVE, FOR SCALE', 1.1, 0.2, { fg: '#ffffff', font: 'bold 52px sans-serif' }); l2.position.set(-0.4, 0.95, 2.0); g.add(l2); g.userData = { d }; add('cube', g); }
  // Antarctica cross-section: 2 km of ice on rock, turning into 2 km of water
  { const g = new THREE.Group(); g.add(box(4.2, 1.0, 2.2, M(0x6b5141), 0, 0.5, 0)); const im = mat(0xf4f8fb, { transparent: true, opacity: 1 }); const iceB = box(4.2, 1.8, 2.2, im, 0, 1.9, 0); g.add(iceB); const pole = box(0.08, 1.8, 0.08, M(0xf2c85b), 2.4, 1.9, 0.5); g.add(pole); for (const y of [1.0, 2.8]) g.add(box(0.4, 0.05, 0.08, M(0xf2c85b), 2.4, y, 0.5)); const l = lbl('2 KM', 0.9, 0.3, { fg: '#f2c85b', font: 'bold 72px sans-serif' }); l.position.set(2.4, 3.1, 0.5); g.add(l); const la = lbl('ICE', 1.2, 0.36, { fg: '#1b1b1b', font: 'bold 72px sans-serif' }); la.position.set(0, 1.9, 1.12); g.add(la); const lw = lbl('WATER', 1.6, 0.36, { fg: '#ffffff', font: 'bold 72px sans-serif' }); lw.position.set(0, 1.9, 1.12); lw.visible = false; g.add(lw); const lr = lbl('ROCK', 1.2, 0.3, { fg: '#ffffff', font: 'bold 64px sans-serif' }); lr.position.set(0, 0.5, 1.12); g.add(lr); const pen = makePenguin(0.5); pen.position.set(-0.8, 2.8, 0.4); g.add(pen); const ripple = []; for (let i = 0; i < 3; i++) { const rp = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.26, 24), mat(0xffffff, { transparent: true, opacity: 0 })); rp.rotation.x = -Math.PI / 2; rp.position.set(0.6, 2.81, -0.2); g.add(rp); ripple.push(rp); } g.userData = { im, la, lw, pen, ripple, iceB }; add('slab', g); }
  // energy: a tower of batteries + a year counter
  { const g = new THREE.Group(); const cells = []; for (let i = 0; i < 14; i++) { const c = new THREE.Group(); c.add(box(0.9, 0.42, 0.9, M(i % 2 ? 0xf2c85b : 0xe0a526), 0, 0.21, 0)); c.add(box(0.95, 0.04, 0.95, M(0x2b2d33), 0, 0.44, 0)); c.add(cyl(0.12, 0.12, 0.06, M(0x9aa1a8), 10, 0, 0.49, 0)); c.position.y = i * 0.48; c.visible = false; g.add(c); cells.push(c); } const yl = dynLbl(2.6, 0.5, { fg: '#f2c85b', font: 'bold 84px sans-serif', text: '0 YEARS', pw: 1024, ph: 196 }); yl.position.set(0, 1.0, 0.6); g.add(yl); const sub = lbl('OF WORLD ENERGY USE', 2.0, 0.22, { fg: '#ffffff', font: 'bold 64px sans-serif', pw: 1024 }); sub.position.set(0, 0.6, 0.6); g.add(sub); const stamp = lbl('IN 5 SECONDS', 2.0, 0.5, { bg: '#c0392b', fg: '#fff', font: 'bold 72px sans-serif' }); stamp.position.set(0.3, 1.8, 0.8); stamp.rotation.z = 0.15; stamp.visible = false; g.add(stamp); const flash = softSprite(0xffd36b, 6, 0); flash.position.set(0, 3.2, 0.5); g.add(flash); g.userData = { cells, yl, sub, stamp, flash }; add('energy', g); }
  // 20-storey tower with the sea rising to 70 m
  { const g = new THREE.Group(); const wt = windowTex('#9aa4ae', '#ffe9b0', 4, 20, 0.2, 4); const b = new THREE.Mesh(new THREE.BoxGeometry(1.3, 6.0, 1.3), texMat({ map: wt })); b.position.y = 3.0; b.castShadow = true; g.add(b); g.add(box(1.4, 0.15, 1.4, M(0x444444), 0, 6.05, 0)); const pole = box(0.08, 6.2, 0.08, M(0xf2c85b), 1.6, 3.1, 0); g.add(pole); [[0, '0 M'], [3, '35 M'], [6, '70 M']].forEach(([y, s]) => { g.add(box(0.4, 0.05, 0.08, M(0xf2c85b), 1.6, y, 0)); const l = lbl(s, 0.9, 0.3, { fg: '#f2c85b', font: 'bold 72px sans-serif' }); l.position.set(2.3, y + 0.1, 0); g.add(l); }); const water = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat(0x7fc3ee, { transparent: true, opacity: 0.92, side: THREE.DoubleSide })); water.rotation.x = -Math.PI / 2; water.position.y = 0.01; g.add(water); const l20 = lbl('20 STOREYS', 1.6, 0.3, { fg: '#ffffff', font: 'bold 64px sans-serif' }); l20.position.set(0, 6.6, 0); g.add(l20); const d = makeDave(); d.g.scale.setScalar(0.3); d.g.position.set(0, 6.12, 0.3); g.add(d.g); g.userData = { water, d }; add('tower', g); }
  // ten biggest cities: eight by the coast go under
  { const g = new THREE.Group(); const r = rng(81); const groups = []; for (let i = 0; i < 10; i++) { const c = new THREE.Group(); const high = (i === 2 || i === 6); const x = -2.8 + i * 0.62; c.position.set(x, 0, 0); if (high) c.add(box(0.56, 1.3, 1.2, M(0x8a6a4a), 0, 0.65, 0)); const base = high ? 1.3 : 0; for (let k = 0; k < 3; k++) { const h = r.range(0.35, 0.9); c.add(box(0.16, h, 0.4, M([0x9aa4ae, 0xb9b0a2, 0x7d8591][k]), -0.19 + k * 0.19, base + h / 2, 0)); } g.add(c); groups.push(c); } const water = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 6), mat(WATER, { transparent: true, opacity: 0.8 })); water.position.y = 0.5; g.add(water); const l = lbl('10 BIGGEST CITIES', 2.4, 0.3, { fg: '#ffffff', font: 'bold 72px sans-serif', pw: 1024 }); l.position.set(0, 2.5, 0); g.add(l); const were = lbl('WERE', 1.0, 0.42, { bg: '#c0392b', fg: '#fff', font: 'bold 80px sans-serif' }); were.position.set(0, 1.9, 0.6); were.rotation.z = -0.1; were.visible = false; g.add(were); g.userData = { water, were }; add('cities', g); }
  // Archimedes in the bath with an ice cube
  { const g = new THREE.Group(); g.add(box(2.4, 0.9, 1.3, M(0xf4f4f4), 0, 0.45, 0)); const wtop = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), mat(WATER, { transparent: true, opacity: 0.85 })); wtop.rotation.x = -Math.PI / 2; wtop.position.y = 0.905; g.add(wtop); g.add(box(2.42, 0.03, 0.02, M(0xc0392b), 0, 0.82, 0.66, false)); const lv = lbl('LEVEL', 0.8, 0.22, { fg: '#c0392b', font: 'bold 64px sans-serif' }); lv.position.set(1.65, 0.82, 0.66); g.add(lv); for (const sx of [-0.9, 0.9]) g.add(cyl(0.06, 0.08, 0.2, M(0xd0d0d0), 8, sx, 0.1, 0.45)); const tap = new THREE.Group(); tap.position.set(-1.0, 0.9, -0.3); tap.add(cyl(0.05, 0.05, 0.5, M(0xd0d0d0), 8, 0, 0.25, 0)); tap.add(cyl(0.04, 0.04, 0.35, M(0xd0d0d0), 8, 0.15, 0.5, 0)); tap.children[1].rotation.z = Math.PI / 2; g.add(tap); const man = new Person({ seed: 61, skin: 0xe8c39e, shirt: 0xe8c39e, pants: 0xe8c39e, hairStyle: 'bald', sleeves: false, scale: 1.0 }); man.g.position.set(0.3, 0.1, 0); man.g.rotation.y = -0.4; g.add(man.g); const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.035, 6, 14), M(0x4e8f5a)); wreath.rotation.x = Math.PI / 2 - 0.2; wreath.position.set(0, 0.3, 0); man.neck.add(wreath); const cube = new THREE.Group(); cube.add(box(0.4, 0.4, 0.4, mat(0xbfe3ff, { transparent: true, opacity: 0.88 }), 0, 0, 0)); cube.add(box(0.41, 0.41, 0.41, mat(0xffffff, { wireframe: true }), 0, 0, 0, false)); cube.position.set(-0.6, 1.0, 0.1); g.add(cube); const l = lbl('ICE', 0.5, 0.2, { fg: '#1b1b1b', font: 'bold 64px sans-serif' }); l.position.set(-0.6, 1.35, 0.1); g.add(l); const eur = lbl('EUREKA.', 1.2, 0.34, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 72px sans-serif' }); eur.position.set(0.1, 2.15, 0.3); eur.visible = false; g.add(eur); g.userData = { man, cube, l, eur }; add('bath', g); }
  // ocean beaker with salinity gauge and fish
  { const g = new THREE.Group(); const glass = cyl(1.3, 1.3, 2.8, mat(0xcfeaff, { transparent: true, opacity: 0.25 }), 24, 0, 1.4, 0); glass.castShadow = false; g.add(glass); const water = cyl(1.25, 1.25, 2.2, mat(0x3f8fc6, { transparent: true, opacity: 0.6 }), 24, 0, 1.1, 0); water.castShadow = false; g.add(water); g.add(cyl(1.32, 1.32, 0.08, M(0x9aa1a8), 24, 0, 2.84, 0)); const fish = []; for (let i = 0; i < 4; i++) { const f = new THREE.Group(); const cc = [0xf2c14e, 0xe88c6a, 0x9fd09a, 0xf4f4f4][i]; const b = ico(0.14, M(cc), 1, 0, 0, 0, false); b.scale.set(1.8, 0.8, 0.5); f.add(b); const tl = cone(0.1, 0.2, M(cc), 4, -0.28, 0, 0, false); tl.rotation.z = Math.PI / 2; f.add(tl); f.add(ico(0.025, M(0x1b1b1b), 0, 0.14, 0.04, 0.06, false)); f.userData = { ph: i * 1.6, y: 0.6 + i * 0.4, r: 0.5 + (i % 2) * 0.35 }; g.add(f); fish.push(f); } const bubbles = []; for (let i = 0; i < 10; i++) { const bb = ico(0.03, mat(0xffffff, { transparent: true, opacity: 0.7 }), 0, 0, 0, 0, false); g.add(bb); bubbles.push(bb); } const gauge = new THREE.Group(); gauge.position.set(1.85, 1.4, 0); gauge.add(box(0.5, 2.4, 0.1, M(0xf4efe4), 0, 0, 0)); for (let i = 0; i <= 10; i++) gauge.add(box(i % 5 === 0 ? 0.3 : 0.15, 0.03, 0.02, M(0x2b2d33), -0.1 + (i % 5 === 0 ? 0 : 0.07), -1.0 + i * 0.2, 0.06, false)); const l35 = lbl('35', 0.5, 0.22, { fg: '#2b2d33', font: 'bold 80px sans-serif' }); l35.position.set(0.5, 1.0, 0.06); gauge.add(l35); const l34 = lbl('34', 0.5, 0.22, { fg: '#2b2d33', font: 'bold 80px sans-serif' }); l34.position.set(0.5, -1.0, 0.06); gauge.add(l34); const unit = lbl('G/KG', 0.6, 0.2, { fg: '#2b2d33', font: 'bold 56px sans-serif' }); unit.position.set(0, 1.4, 0.06); gauge.add(unit); const needle = box(0.6, 0.05, 0.04, M(0xc0392b), 0, 1.0, 0.08); gauge.add(needle); const nl = dynLbl(0.7, 0.24, { fg: '#c0392b', font: 'bold 80px sans-serif', text: '35.0' }); nl.position.set(0.72, 1.0, 0.08); gauge.add(nl); g.add(gauge); const sal = lbl('SALINITY', 1.2, 0.26, { fg: '#ffffff', font: 'bold 60px sans-serif' }); sal.position.set(1.85, 2.9, 0); g.add(sal); const pour = cyl(0.12, 0.16, 3, mat(0x9fd0ff, { transparent: true, opacity: 0.85 }), 10, -0.3, 3.7, 0); pour.visible = false; g.add(pour); const splash = softSprite(0xffffff, 1.4, 0); splash.position.set(-0.3, 2.25, 0.3); g.add(splash); const fl = lbl('FINE', 0.9, 0.35, { bg: '#4e8f5a', fg: '#fff', font: 'bold 80px sans-serif' }); fl.position.set(0, 3.3, 0.4); fl.visible = false; g.add(fl); g.userData = { fish, bubbles, needle, nl, pour, splash, water, fl }; add('salt', g); }
  const upd = S.update;
  S.update = (t, c) => {
    upd(t, c); const prop = c.prop || 'dial'; const u = P[prop].userData;
    if (prop === 'cube') { u.d.pose('lookUp', t); u.d.neck.rotation.x = -0.8; }
    if (prop === 'slab') { const k = smooth(c.slabMelt ?? 0); u.im.color.setHex(0xf4f8fb).lerp(new THREE.Color(0x3f8fc6), k); u.im.opacity = lerp(1, 0.75, k); u.la.visible = k < 0.5; u.lw.visible = k >= 0.5; u.iceB.scale.y = 1 + (k > 0.05 ? Math.sin(t * 6) * 0.01 * k : 0); u.pen.position.y = 2.8 + (k > 0.5 ? Math.sin(t * 2.5) * 0.04 : 0); u.pen.rotation.x = k > 0.5 ? Math.sin(t * 2) * 0.15 : 0; u.ripple.forEach((rp, i) => { const kk = k > 0.05 ? ((t * 0.7 + i * 0.33) % 1) : 0; rp.scale.setScalar(1 + kk * 5); rp.material.opacity = k > 0.05 ? 0.6 * (1 - kk) : 0; }); }
    if (prop === 'energy') { const k = c.years ?? 0; const n = Math.round(14 * k); u.cells.forEach((cell, i) => cell.visible = i < n); const yrs = Math.round(15000 * k); u.yl.userData.set(yrs.toLocaleString('en-GB') + (yrs === 1 ? ' YEAR' : ' YEARS')); const top = n * 0.48; u.yl.position.y = top + 0.75; u.sub.position.y = top + 0.4; u.stamp.position.y = top + 1.4; const s = c.stamp ?? 0; u.stamp.visible = s > 0.01; u.stamp.scale.setScalar(lerp(2.5, 1, easeOut(s))); u.flash.material.opacity = s > 0 ? 0.8 * Math.max(0, 1 - s * 1.5) : 0; }
    if (prop === 'tower') { const k = c.waterK ?? 0; u.water.position.y = 0.01 + 6.0 * k; u.d.pose(k > 0.9 ? 'armsOut' : 'stand', t); u.d.neck.rotation.x = 0.4; }
    if (prop === 'cities') { const k = c.waterK ?? 0; const h = Math.max(0.01, 1.05 * k); u.water.scale.y = h; u.water.position.y = h / 2; u.were.visible = !!c.were; }
    if (prop === 'bath') { const k = c.cubeK ?? 1; u.cube.scale.setScalar(Math.max(0.001, k)); u.cube.position.y = 1.0 - (1 - k) * 0.25; u.l.visible = k > 0.3; u.man.pose('sit'); u.man.armL.rotation.x = -0.9; u.man.armR.rotation.x = c.eureka ? -3.0 : -0.9; u.man.neck.rotation.x = c.eureka ? -0.3 : 0.15; u.man.neck.rotation.y = c.eureka ? 0 : 0.4; u.eur.visible = !!c.eureka; u.eur.scale.setScalar(c.eureka ? lerp(2, 1, easeOut(c.eurekaK ?? 1)) : 1); }
    if (prop === 'salt') { const k = c.saltK ?? 0; const v = 35 - 0.8 * k; const y = -1.0 + (v - 34) * 2.0; u.needle.position.y = y; u.nl.position.y = y; u.nl.userData.set(v.toFixed(1)); u.fish.forEach((f, i) => { const a = t * 0.9 + f.userData.ph; f.position.set(Math.cos(a) * f.userData.r, f.userData.y + Math.sin(t * 2 + i) * 0.05, Math.sin(a) * f.userData.r); f.rotation.y = -a + Math.PI; f.rotation.z = Math.sin(t * 6 + i) * 0.08; }); u.bubbles.forEach((b, i) => { const kk = (t * 0.35 + i * 0.1) % 1; b.position.set(Math.sin(i * 2.1) * 0.6, 0.3 + kk * 1.8, Math.cos(i * 1.7) * 0.6); b.visible = kk < 0.95; }); const p = c.pour ?? 0; u.pour.visible = p > 0.01; u.pour.scale.y = Math.max(0.01, p); u.pour.position.y = 2.2 + 1.5 * p; u.splash.material.opacity = p > 0.3 ? 0.5 + 0.3 * Math.sin(t * 20) : 0; u.fl.visible = !!c.fine; }
  };
  return S;
}

// ======================= CITY with flood + clock tower =======================
// ctx: mode (as buildCity), floodY (m), plus everything buildCity reads
export function buildCityFlood() {
  const S = buildCity(); const { scene } = S;
  const tower = makeClockTower(); tower.scale.setScalar(0.55); tower.position.set(-13, 0, -13); scene.add(tower);
  const water = plane(900, 900, mat(0x4f9fd8, { transparent: true, opacity: 0.86 }), 0, -1, 0); water.visible = false; scene.add(water);
  const boats = []; for (let i = 0; i < 6; i++) { const b = new THREE.Group(); b.add(box(2.2, 0.5, 0.9, M([0xd9534f, 0xf4f4f4, 0xf2c85b][i % 3]), 0, 0.25, 0)); b.add(box(0.8, 0.5, 0.7, M(0xf4f4f4), -0.3, 0.7, 0)); b.position.set(-40 + i * 16, 0, -30 + (i % 2) * 25); b.visible = false; scene.add(b); boats.push(b); }
  const upd = S.update;
  S.update = (t, c) => { upd(t, c); tower.visible = !!c.london; const fy = c.floodY ?? 0; water.visible = fy > 0.05; water.position.y = fy; boats.forEach((b, i) => { b.visible = fy > 3; b.position.y = fy + Math.sin(t * 1.5 + i) * 0.1; b.position.x = -40 + i * 16 + Math.sin(t * 0.3 + i) * 2; b.rotation.z = Math.sin(t * 1.2 + i) * 0.05; }); };
  return S;
}

// ======================= OCEAN with flood plane + airliner =======================
// ctx: waveZ, waveH, shipDrop, splashK, floodY (m), plane (bool), planeZ
export function buildOceanIce() {
  const S = buildOcean(); const { scene } = S;
  const flood = plane(4000, 4000, mat(0x4f9fd8, { transparent: true, opacity: 0.9 }), 0, -1, -400); flood.visible = false; scene.add(flood);
  const jet = makeAirliner(0.5); jet.visible = false; jet.rotation.y = -Math.PI / 2; scene.add(jet);
  const upd = S.update;
  S.update = (t, c) => { upd(t, c); const fy = c.floodY ?? 0; flood.visible = fy > 0.05; flood.position.y = fy; jet.visible = !!c.plane; if (jet.visible) { jet.position.set(c.planeX ?? 40, c.planeY ?? 28, (c.planeZ ?? c.waveZ ?? -500) + 10); jet.rotation.z = Math.sin(t * 0.7) * 0.03; } };
  return S;
}
