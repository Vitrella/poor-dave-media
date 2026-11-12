import * as THREE from 'three';
import { box, cyl, ico, cone, plane, rng, lerp, clamp, smooth, easeOut, easeIn, prog, emis, canvasTex, texMat, checkerTex, bakeStatic, softSprite, asphaltTex, grassTex, mulberry32 } from './util.js';
import { M, Person, makeCar, makeTree, makeLamp, makeCup, makeSmoke, updateSmoke } from './kit.js';
import { baseSet, buildSpace } from './sets.js';
import { makeDave, makePriya } from './water.js';
import { buildCity } from './world.js';

// ---------- helpers ----------
function lblTex(text, w = 512, h = 128, fg = '#ffffff', bg = null, font = 'bold 64px sans-serif') { return canvasTex(w, h, (ctx, W, H) => { if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); } ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, W / 2, H / 2); }); }
export function lbl(text, w, h, o = {}) { const t = lblTex(text, o.pw || 512, o.ph || 128, o.fg, o.bg, o.font); t.magFilter = THREE.LinearFilter; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !o.bg, side: THREE.DoubleSide })); return m; }
const whitesOf = (p) => p.neck.children.filter(m => m.isMesh && m.material && m.material.color && m.material.color.getHex() === 0xf8f6f2 && m.geometry.type === 'IcosahedronGeometry');
export function face(p, c = {}) { const W = p._whites || (p._whites = whitesOf(p)); const w = c.wide ?? 0; W.forEach(x => x.scale.set(1 + 0.5 * w, 1 + 0.5 * w, 0.55)); p.mouth.scale.set(1 + 0.5 * (c.open ?? 0), 1 + 3 * (c.open ?? 0) + (c.smile ? 0.3 : 0), 1); }
// grow: k = 0 normal, 1 = doubled
export function setGrow(p, k) { p._s ??= p.g.scale.x; p.g.scale.setScalar(p._s * (1 + clamp(k, 0, 1))); }
// clothes that did not grow: crop top, short sleeves, shorts
function cropInit(p) {
  if (p._crop) return p._crop;
  const skin = p.parts.skin; const shirtBox = p.torso.children[0];
  const belly = box(0.41, 0.6, 0.23, skin, 0, 0.3, 0); belly.visible = false; p.torso.add(belly);
  const fore = [p.armL, p.armR].map(a => { const f = box(0.12, 0.54, 0.12, skin, 0, -0.27, 0); f.visible = false; a.add(f); return f; });
  const sleeves = [p.armL.children[0], p.armR.children[0]];
  const shins = [p.legL, p.legR].map(l => l.userData.knee.children[0]); const shinMat = shins[0].material;
  p._crop = { shirtBox, belly, fore, sleeves, shins, shinMat, skin, sy: shirtBox.position.y, sh: shirtBox.geometry.parameters.height || 0.62, dress: !!p.opts.dress };
  return p._crop;
}
export function cropClothes(p, k) {
  const c = cropInit(p); k = clamp(k, 0, 1); const f = 1 - 0.5 * k;
  if (!c.dress) { c.shirtBox.scale.y = f; c.shirtBox.position.y = c.sy + (c.sh * (1 - f)) / 2; c.belly.visible = k > 0.02; }
  if (p.opts.sleeves !== false) { c.sleeves.forEach(s => { s.scale.y = f; s.position.y = -0.26 * f; }); c.fore.forEach(x => x.visible = k > 0.02); }
  c.shins.forEach(s => s.material = k > 0.5 ? c.skin : c.shinMat);
}
// hole in a slab/roof around a neck
function holeRing(r = 0.4, dark = 0x1c1917) {
  const g = new THREE.Group(); const ring = new THREE.Mesh(new THREE.RingGeometry(r, r * 1.55, 9), new THREE.MeshBasicMaterial({ color: dark, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; g.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r * 1.02, 12), new THREE.MeshBasicMaterial({ color: 0x050403, side: THREE.DoubleSide })); disc.rotation.x = -Math.PI / 2; disc.position.y = -0.01; g.add(disc);
  const rim = new THREE.Mesh(new THREE.RingGeometry(r * 1.55, r * 1.75, 9), new THREE.MeshBasicMaterial({ color: 0xe8e2d4, side: THREE.DoubleSide })); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.005; g.add(rim);
  const rr = rng(Math.round(r * 100)); for (let i = 0; i < 6; i++) { const a = i * 1.05 + rr.f(); const c = box(0.14, 0.05, 0.1, M(0xe8e2d4), Math.cos(a) * r * 1.9, 0.03, Math.sin(a) * r * 1.9); c.rotation.y = a; g.add(c); }
  g.visible = false; return g;
}
function bag(color = 0xc9a56b) { const g = new THREE.Group(); g.add(box(0.3, 0.36, 0.16, M(color), 0, -0.18, 0)); g.add(box(0.3, 0.05, 0.16, M(0xf4efe4), 0, -0.02, 0)); g.add(box(0.03, 0.12, 0.02, M(0x6b4a2b), -0.08, 0.05, 0)); g.add(box(0.03, 0.12, 0.02, M(0x6b4a2b), 0.08, 0.05, 0)); return g; }
function eggBox(crushed = false) { const g = new THREE.Group(); const m = M(0xf2e8c8); g.add(box(0.2, crushed ? 0.03 : 0.08, 0.13, m, 0, crushed ? 0.015 : 0.04, 0)); if (!crushed) { for (let i = 0; i < 3; i++) g.add(ico(0.022, M(0xfff4dc), 1, -0.06 + i * 0.06, 0.09, 0)); } else { const y = new THREE.Mesh(new THREE.CircleGeometry(0.16, 12), M(0xf2b63a)); y.rotation.x = -Math.PI / 2; y.position.set(0.08, 0.004, 0.06); g.add(y); const y2 = new THREE.Mesh(new THREE.CircleGeometry(0.07, 10), M(0xffd45a)); y2.rotation.x = -Math.PI / 2; y2.position.set(0.1, 0.006, 0.07); g.add(y2); for (let i = 0; i < 4; i++) g.add(box(0.05, 0.01, 0.04, M(0xfff4dc), -0.1 + i * 0.07, 0.01, 0.1)); } return g; }
function listTex(opts = {}) { return canvasTex(512, 700, (ctx, w, h) => { ctx.fillStyle = '#e4ddc9'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#b9c4d4'; ctx.lineWidth = 2; for (let y = 90; y < h; y += 62) { ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(w - 30, y); ctx.stroke(); } ctx.fillStyle = '#1f2a44'; ctx.font = 'bold 44px serif'; ctx.fillText('DAVE — WEDDING SHOP', 40, 62); ctx.font = 'italic 44px serif'; const lines = ['1. eggs', '2. flour', '3. candles', '4. YOUR SUIT!!', '5. ring Nan']; lines.forEach((l, i) => ctx.fillText(l, 50, 142 + i * 62)); ctx.font = 'italic 36px serif'; ctx.fillText('— P x', 340, 470); if (opts.again) { ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(44, 128); ctx.lineTo(190, 132); ctx.stroke(); } }); }
function brickTex() { return canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = '#9a5a3c'; ctx.fillRect(0, 0, w, h); const r = mulberry32(3); for (let y = 0; y < h; y += 16) { const off = (y / 16) % 2 ? 16 : 0; for (let x = -16; x < w; x += 32) { ctx.fillStyle = ['#a8664a', '#8e5236', '#b06f50'][Math.floor(r() * 3)]; ctx.fillRect(x + off + 1, y + 1, 30, 14); } } }, [1, 1]); }
function tileTex() { return canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = '#5a4a46'; ctx.fillRect(0, 0, w, h); const r = mulberry32(5); for (let y = 0; y < h; y += 22) { const off = (y / 22) % 2 ? 20 : 0; for (let x = -20; x < w; x += 40) { ctx.fillStyle = ['#6b5753', '#4f403d', '#7a625c'][Math.floor(r() * 3)]; ctx.fillRect(x + off + 1, y + 1, 38, 20); } } }, [1, 1]); }
const poseStd = (p, name, t, o) => { p.pose(name, t, o); };
// extra poses for Dave
function crawl(p) { p.pose('stand'); p.hips.position.y = 0.52; p.legL.rotation.x = -1.5; p.legR.rotation.x = -1.5; p.legL.userData.knee.rotation.x = 1.6; p.legR.userData.knee.rotation.x = 1.6; p.torso.rotation.x = 1.35; p.armL.rotation.x = -1.5; p.armR.rotation.x = -1.5; p.neck.rotation.x = -1.1; }
function squat(p) { p.pose('stand'); p.hips.position.y = 0.4; p.legL.rotation.x = -1.7; p.legR.rotation.x = -1.7; p.legL.userData.knee.rotation.x = 1.9; p.legR.userData.knee.rotation.x = 1.9; p.torso.rotation.x = 0.45; p.armL.rotation.x = -1.6; p.armL.rotation.z = 0.5; p.armR.rotation.x = -1.6; p.armR.rotation.z = -0.5; p.neck.rotation.x = 0.35; p.neck.rotation.z = 0.4; }

// ======================= STREET: Dave's front door =======================
// ctx: grow 0..1, crop 0..1, dave ('walk'|'stand'|'bump'|'side'|'window'|'crawl'|'in'|'down'|'anxious'), walkK, priyaRoof 0..1, roofHole, eggs ('ok'|'crushed'|'none'), doorOpen 0..1, wide/open/smile, flash
export function buildStreetH() {
  const S = baseSet({ shadowExtent: 16, fogNear: 60, fogFar: 300, shadowRes: 2048 });
  const { scene } = S; const r = rng(71); const ST = new THREE.Group(); scene.add(ST); S.sunOffset = new THREE.Vector3(40, 50, 60); S.sun.intensity = 2.6; S.hemi.intensity = 0.95;
  const pave = plane(60, 4, M(0x9a9a96), 0, 0, 2); scene.add(pave); const aT = asphaltTex(); aT.repeat.set(12, 2); scene.add(plane(60, 10, texMat({ map: aT }), 0, -0.01, 9)); scene.add(box(60, 0.12, 0.2, M(0xb0b0ac), 0, 0.06, 4.05));
  scene.add(plane(60, 4, M(0x9a9a96), 0, 0, 16)); // far pavement
  const bT = brickTex(); bT.repeat.set(12, 3); const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 5.3), texMat({ map: bT })); wall.position.set(0, 2.65, 0); wall.receiveShadow = true; scene.add(wall);
  // pitched roof (front slope) + ridge
  const tT = tileTex(); tT.repeat.set(16, 3); const roof = new THREE.Mesh(new THREE.BoxGeometry(30.4, 0.26, 4.6), texMat({ map: tT })); roof.position.set(0, 6.35, -1.85); roof.rotation.x = 0.56; roof.castShadow = true; roof.receiveShadow = true; scene.add(roof);
  scene.add(box(30.4, 0.3, 0.5, M(0x4a4a4a), 0, 5.3, 0.15)); // gutter / eave
  const chimney = box(0.9, 1.4, 0.9, M(0x8e5236), 6.5, 7.2, -2.6); scene.add(chimney);
  // doors and windows along the terrace
  const doors = [-5.2, 0, 5.2]; const colors = [0xc0392b, 0x2b4c7e, 0x2f6b4a];
  const heroDoor = new THREE.Group(); heroDoor.position.set(-0.475, 0, 0.05); scene.add(heroDoor);
  doors.forEach((x, i) => {
    if (i === 1) { heroDoor.add(box(0.95, 2.0, 0.08, M(colors[i]), 0.475, 1.0, 0)); heroDoor.add(ico(0.03, M(0xd8c060), 0, 0.82, 1.0, 0.05)); }
    else { scene.add(box(0.95, 2.0, 0.08, M(colors[i]), x, 1.0, 0.05)); scene.add(ico(0.03, M(0xd8c060), 0, x + 0.35, 1.0, 0.1)); }
    if (i === 1) { scene.add(box(0.08, 2.12, 0.07, M(0xffffff), x - 0.51, 1.06, 0.03)); scene.add(box(0.08, 2.12, 0.07, M(0xffffff), x + 0.51, 1.06, 0.03)); scene.add(box(1.1, 0.1, 0.07, M(0xffffff), x, 2.07, 0.03)); } else scene.add(box(1.1, 2.12, 0.05, M(0xffffff), x, 1.06, 0.03));
    scene.add(box(1.2, 0.12, 0.5, M(0xb0b0ac), x, 0.06, 0.3)); scene.add(plane(0.9, 0.4, emis(0xcfe8ff, 0.5), x, 2.35, 0.05, 0)); scene.add(box(1.0, 0.5, 0.04, M(0xffffff), x, 2.35, 0.03));
    for (const wx of [x - 1.9, x + 1.9]) { for (const wy of [1.5, 3.9]) { scene.add(plane(1.0, 1.4, emis(0xbfdcf2, 0.4), wx, wy, 0.05, 0)); scene.add(box(1.14, 1.54, 0.04, M(0xffffff), wx, wy, 0.03)); scene.add(box(0.05, 1.4, 0.06, M(0xffffff), wx, wy, 0.06)); scene.add(box(1.14, 0.1, 0.12, M(0xd0d0c8), wx, wy - 0.77, 0.08)); } }
  });
  const dark = box(0.95, 2.0, 0.05, M(0x14110f), 0, 1.0, 0.0); scene.add(dark); // hallway behind the open door
  const hall = new THREE.Group(); hall.visible = false; scene.add(hall); const hm = M(0x4a403a); hall.add(box(0.1, 2.5, 3.2, hm, -0.7, 1.25, -1.6)); hall.add(box(0.1, 2.5, 3.2, hm, 0.7, 1.25, -1.6)); hall.add(box(1.5, 0.1, 3.2, M(0xdcd6cc), 0, 2.45, -1.6)); hall.add(plane(1.5, 3.2, M(0x6b4a2b), 0, 0.005, -1.6)); hall.add(box(1.5, 2.5, 0.1, hm, 0, 1.25, -3.2)); hall.add(box(0.4, 0.9, 0.3, M(0x8a6a4a), -0.45, 0.45, -1.4)); hall.add(cyl(0.12, 0.1, 0.25, M(0x2b4c7e), 10, -0.45, 1.02, -1.4)); hall.add(box(0.03, 1.0, 0.03, M(0x333333), 0.6, 1.6, -2.2)); hall.add(box(0.5, 0.05, 0.05, M(0x333333), 0.45, 2.05, -2.2));
  // Priya's list on the door
  const list = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), new THREE.MeshLambertMaterial({ map: listTex() })); list.position.set(-0.22, 1.42, 0.095); scene.add(list); scene.add(box(0.06, 0.02, 0.01, M(0xd9534f), -0.22, 1.56, 0.1));
  // props
  for (const x of [-2.9, 2.9]) { const bin = cyl(0.3, 0.26, 0.9, M(0x4a5a4a), 10, x, 0.45, 0.6); ST.add(bin); ST.add(cyl(0.32, 0.32, 0.06, M(0x3a4a3a), 10, x, 0.93, 0.6)); }
  const lamp = makeLamp(); lamp.position.set(3.6, 0, 3.6); lamp.scale.setScalar(1.3); ST.add(lamp);
  const car = makeCar(77, { color: 0xc7c9cc }); car.position.set(-4, 0, 6.5); car.rotation.y = Math.PI / 2; ST.add(car); const car2 = makeCar(78); car2.position.set(6, 0, 6.5); car2.rotation.y = Math.PI / 2; ST.add(car2);
  const tree = makeTree(81); tree.position.set(-9, 0, 13); ST.add(tree); const tree2 = makeTree(82); tree2.position.set(10, 0, 13.5); ST.add(tree2);
  for (let i = 0; i < 7; i++) { const b = box(r.range(6, 9), r.range(7, 12), 8, M(r.pick([0xb9b0a2, 0xa7a39b, 0xc2b8a8])), -18 + i * 6.5, 4, 23); ST.add(b); }
  const pot = new THREE.Group(); pot.position.set(1.0, 0, 0.5); pot.add(cyl(0.18, 0.14, 0.3, M(0xb5603a), 10, 0, 0.15, 0)); pot.add(ico(0.22, M(0x4f8a3d), 1, 0, 0.45, 0)); ST.add(pot);
  bakeStatic(ST, scene);
  // Dave + 4 bags + eggs
  const dave = makeDave(); dave.g.position.set(0, 0, 0.9); dave.g.rotation.y = Math.PI; scene.add(dave.g);
  const bags = []; [[dave.armL, -0.09], [dave.armL, 0.11], [dave.armR, -0.11], [dave.armR, 0.09]].forEach(([a, dx], i) => { const b = bag([0xc9a56b, 0xd9534f, 0xc9a56b, 0x4a7fb5][i]); b.position.set(dx, -0.62, 0.02 + (i % 2) * 0.1); a.add(b); bags.push(b); });
  const eggs = eggBox(false); eggs.scale.setScalar(0.8); eggs.position.set(0, 0.0, 0.0); bags[3].add(eggs); eggs.position.set(0, 0.0, 0.02);
  const eggsStep = eggBox(true); eggsStep.position.set(0.45, 0.13, 0.42); eggsStep.visible = false; scene.add(eggsStep);
  const eggsOk = eggBox(false); eggsOk.position.set(0.45, 0.13, 0.42); eggsOk.visible = false; scene.add(eggsOk);
  // Priya (through the roof)
  const priya = makePriya(); priya.g.position.set(0, 3.1, -1.3); priya.g.visible = false; scene.add(priya.g);
  const roofHole = holeRing(0.5, 0x1a1512); roofHole.position.set(0, 6.26, -1.32); roofHole.rotation.x = 0.56; scene.add(roofHole);
  // neighbours
  const nb = [];
  const mk = (o, x, z, ry, mode) => { const p = new Person(o); p.g.position.set(x, 0, z); p.g.rotation.y = ry; scene.add(p.g); nb.push({ p, mode, x0: x, z0: z, ph: nb.length }); return p; };
  mk({ seed: 601, shirt: 0x4a7fb5 }, -3.6, 1.7, 0.4, 'stand'); mk({ seed: 602, dress: true, hairStyle: 'long', shirt: 0x6fa36b }, -2.8, 2.3, -0.5, 'stand');
  mk({ seed: 603, shirt: 0xf2c14e, pants: 0x222222 }, 12, 3.0, -Math.PI / 2, 'jog'); mk({ seed: 604, hairStyle: 'bun', dress: true }, 3.4, 2.1, 2.6, 'stand'); mk({ seed: 605, scale: 0.62 }, 2.6, 3.2, 0.9, 'kid');
  mk({ seed: 606, shirt: 0xd9534f }, -9.5, 16.5, 0.2, 'stand'); mk({ seed: 607, shirt: 0xffffff, hairStyle: 'long' }, 9.8, 16.5, -0.3, 'stand');
  const dog = new THREE.Group(); dog.add(box(0.55, 0.3, 0.25, M(0xc8a26b), 0, 0.4, 0)); dog.add(ico(0.14, M(0xc8a26b), 0, 0.33, 0.55, 0)); for (const sx of [-0.2, 0.2]) for (const sz of [-0.08, 0.08]) dog.add(box(0.07, 0.3, 0.07, M(0xc8a26b), sx, 0.15, sz)); dog.position.set(4.2, 0, 2.5); dog.rotation.y = 2.6; scene.add(dog);
  const ball = ico(0.14, M(0xd9534f), 1, 3.0, 0.14, 3.7); scene.add(ball);
  const dust = makeSmoke(8, 0xd8d0c0, 0.5, 21); dust.position.set(0, 5.9, -1.0); dust.visible = false; scene.add(dust);
  const all = [dave, priya, ...nb.map(n => n.p)];
  S.actors = { dave, priya, bags, eggs, eggsStep, eggsOk, nb, heroDoor, list };
  S.update = (t, c) => {
    S.setSky(0); const g = c.grow ?? 0; const cr = c.crop ?? 0;
    all.forEach(p => { setGrow(p, g); cropClothes(p, cr); });
    bags.forEach(b => b.scale.setScalar(1 / (1 + g)));
    // neighbours
    nb.forEach((n, i) => { const p = n.p; if (n.mode === 'jog') { const x = 12 - ((t * 1.6) % 26); p.g.position.x = x; p.pose('walk', t * 1.5, { phase: i }); } else if (n.mode === 'kid') { p.pose('stand', t, { phase: i }); p.neck.rotation.x = g > 0.5 ? 0.3 : 0; } else { p.pose('stand', t, { phase: i * 1.7 }); } if (g > 0.4 && n.mode !== 'kid') { p.pose('lookUp', t); p.armL.rotation.z = 0.6; p.armR.rotation.z = -0.6; p.neck.rotation.x = -0.2; } });
    ball.position.x = 3.0 + Math.sin(t * 1.3) * 0.5;
    // Dave
    const mode = c.dave ?? 'stand'; const look = c.look ?? 'door'; dave.g.rotation.y = look === 'door' ? Math.PI : 1.05; dave.g.position.set(0.1, 0, 0.95);
    const lookCam = () => { if (look !== 'door') { dave.neck.rotation.y = 0; } };
    if (mode === 'walk') { const k = c.walkK ?? 0; dave.g.position.set(lerp(6.5, 0.2, k), 0, lerp(2.6, 0.95, k)); dave.g.rotation.y = lerp(-Math.PI / 2 - 0.3, Math.PI, smooth(prog(k, 0.75, 1))); dave.pose('walk', t); dave.armL.rotation.x = -0.25; dave.armR.rotation.x = -0.25; }
    else if (mode === 'stand') { dave.pose('stand', t); dave.armL.rotation.x = -0.2; dave.armR.rotation.x = -0.2; dave.armL.rotation.z = 0.22; dave.armR.rotation.z = -0.22; lookCam(); }
    else if (mode === 'bump') { dave.pose('stand', t); dave.armL.rotation.x = -0.2; dave.armR.rotation.x = -0.2; dave.neck.rotation.x = 0.3 + Math.sin(t * 9) * 0.03; dave.torso.rotation.x = 0.1; lookCam(); }
    else if (mode === 'anxious') { dave.pose('stand', t); dave.armL.rotation.x = -0.2; dave.armR.rotation.x = -0.2; dave.neck.rotation.z = Math.sin(t * 8) * 0.06; lookCam(); }
    else if (mode === 'down') { dave.pose('stand', t); dave.armL.rotation.z = 0.9; dave.armR.rotation.z = -0.9; dave.neck.rotation.x = 0.75; dave.neck.rotation.y = -0.2; }
    else if (mode === 'side') { dave.g.rotation.y = Math.PI / 2; dave.g.position.set(0.15, 0, 0.75); dave.pose('stand', t); dave.torso.rotation.z = -0.35; dave.neck.rotation.z = -0.5; dave.neck.rotation.y = 0.5; dave.armL.rotation.x = -0.4; dave.armR.rotation.x = -1.2; dave.armR.rotation.z = -0.6; }
    else if (mode === 'window') { dave.g.position.set(-1.9, 0, 1.5); crawl(dave); dave.hips.position.y = 0.45; dave.neck.rotation.x = -1.25; }
    else if (mode === 'crawl') { dave.g.position.set(0, 0, 1.4 - (c.crawlK ?? 0) * 0.5); crawl(dave); dave.neck.rotation.z = Math.sin(t * 6) * 0.1; }
    else if (mode === 'in') { const k = c.inK ?? 0; dave.g.position.set(0, 0, lerp(0.9, -0.6, k)); dave.pose('walk', t * 1.2); dave.armL.rotation.x = -0.25; dave.armR.rotation.x = -0.25; }
    face(dave, { wide: c.wide ?? 0, open: c.open ?? 0, smile: !!c.smile });
    // door
    heroDoor.rotation.y = -(c.doorOpen ?? 0) * 1.6; dark.visible = (c.doorOpen ?? 0) > 0.05 && !c.hall; hall.visible = !!c.hall;
    // eggs: in the bag / on the step
    const e = c.eggs ?? 'bag'; eggs.visible = e === 'bag'; eggsOk.visible = e === 'ok'; eggsStep.visible = e === 'crushed';
    // Priya through the roof
    const pk = c.priyaRoof ?? 0; priya.g.visible = pk > 0.01; if (priya.g.visible) { priya.pose('stand', t); priya.armL.rotation.z = 0.3; priya.armR.rotation.z = -0.3; priya.neck.rotation.y = Math.sin(t * 1.5) * 0.3; priya.neck.rotation.x = -0.1; priya.g.position.y = lerp(2.2, 3.6, smooth(pk)); priya.g.scale.setScalar(0.97 * 2); face(priya, { wide: 0.6, open: 0.3 }); }
    roofHole.visible = !!c.roofHole; dust.visible = !!c.dust; if (dust.visible) updateSmoke(dust, t, 0.8, 1.2, 0.2);
  };
  return S;
}

// ======================= HOUSE CUTAWAY (family home) =======================
// ctx: grow 0..1, crop 0..1, holes (bool), crack 0..1, dust, floorLbl, weightLbl, doorLbl, ceilLbl, teen ('type'|'look')
export function buildHouse() {
  const S = baseSet({ shadowExtent: 10, fogNear: 60, fogFar: 300, shadowRes: 2048 });
  const { scene } = S; S.sunOffset = new THREE.Vector3(18, 26, 40); S.sun.intensity = 2.0; S.hemi.intensity = 0.9; scene.add(new THREE.AmbientLight(0xffffff, 0.22));
  const ST = new THREE.Group(); scene.add(ST);
  const W = 6, D = 4.5, H1 = 2.4, SL = 0.25; const y1 = H1 + SL, H2 = 2.4, y2 = y1 + H2 + SL;
  // garden ground
  const gT = grassTex(4); gT.repeat.set(30, 30); scene.add(plane(200, 200, texMat({ map: gT }), 0, -0.02, 0));
  ST.add(plane(W + 0.4, D + 0.4, M(0xd8cfc0), 0, -0.01, -D / 2 + 0.1));
  // floors
  const floorGF = new THREE.Mesh(new THREE.PlaneGeometry(W, D), texMat({ map: (() => { const t = canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = '#a8865e'; ctx.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(0, y, w, 2); for (let x = (y / 32 % 2) * 64; x < w; x += 128) ctx.fillRect(x, y, 2, 32); } }); t.repeat.set(4, 3); t.magFilter = THREE.LinearFilter; return t; })() })); floorGF.rotation.x = -Math.PI / 2; floorGF.position.set(0, 0.001, -D / 2); floorGF.receiveShadow = true; scene.add(floorGF);
  const slab1 = box(W, SL, D, M(0xe6e0d4), 0, H1 + SL / 2, -D / 2); scene.add(slab1);
  const floorFF = plane(W, D, M(0x8fa3b8), 0, y1 + 0.002, -D / 2); scene.add(floorFF);
  const slab2 = box(W, SL, D, M(0xe6e0d4), 0, y1 + H2 + SL / 2, -D / 2); scene.add(slab2);
  // walls (back + sides), gable, roof
  const bT = brickTex(); bT.repeat.set(2, 3);
  ST.add(plane(W, y2 + 0.1, M(0xe9e4da), 0, (y2 + 0.1) / 2, -D, 0));
  const sideL = plane(D, y2 + 0.1, M(0xdfe6e0), -W / 2, (y2 + 0.1) / 2, -D / 2, 0); sideL.rotation.y = Math.PI / 2; ST.add(sideL); const sideR = plane(D, y2 + 0.1, M(0xdfe6e0), W / 2, (y2 + 0.1) / 2, -D / 2, 0); sideR.rotation.y = -Math.PI / 2; ST.add(sideR);
  const outerL = new THREE.Mesh(new THREE.PlaneGeometry(D + 0.2, y2 + 0.1), texMat({ map: bT })); outerL.rotation.y = -Math.PI / 2; outerL.position.set(-W / 2 - 0.12, (y2 + 0.1) / 2, -D / 2); ST.add(outerL); const outerR = outerL.clone(); outerR.rotation.y = Math.PI / 2; outerR.position.x = W / 2 + 0.12; ST.add(outerR);
  const gable = new THREE.Shape(); gable.moveTo(-W / 2 - 0.2, y2); gable.lineTo(W / 2 + 0.2, y2); gable.lineTo(0, y2 + 2.2); gable.lineTo(-W / 2 - 0.2, y2); const gm = new THREE.Mesh(new THREE.ShapeGeometry(gable), M(0xe9e4da)); gm.position.z = -D + 0.01; ST.add(gm);
  const tT = tileTex(); tT.repeat.set(4, 3); const rl = Math.hypot(W / 2 + 0.3, 2.2); for (const s of [-1, 1]) { const rf = new THREE.Mesh(new THREE.BoxGeometry(rl, 0.2, D + 0.6), texMat({ map: tT })); rf.position.set(s * (W / 4 + 0.08), y2 + 1.1, -D / 2); rf.rotation.z = -s * Math.atan2(2.2, W / 2 + 0.3); rf.castShadow = true; ST.add(rf); }
  // ground floor furniture
  const sofa = new THREE.Group(); sofa.position.set(-1.7, 0, -3.9); ST.add(sofa); sofa.add(box(1.9, 0.45, 0.85, M(0x3f5a7a), 0, 0.22, 0)); sofa.add(box(1.9, 0.5, 0.25, M(0x3f5a7a), 0, 0.6, -0.3)); for (const sx of [-0.9, 0.9]) sofa.add(box(0.12, 0.3, 0.85, M(0x3f5a7a), sx, 0.55, 0)); sofa.add(box(0.4, 0.12, 0.4, M(0xf2c14e), -0.4, 0.5, 0.05));
  const tv = new THREE.Group(); tv.position.set(-2.75, 0, -2.2); tv.rotation.y = Math.PI / 2; ST.add(tv); tv.add(box(1.2, 0.5, 0.4, M(0x8a6a4a), 0, 0.25, 0)); tv.add(box(1.1, 0.65, 0.05, M(0x111111), 0, 0.85, 0)); tv.add(plane(1.0, 0.56, emis(0x9fd0ee, 0.7), 0, 0.85, 0.03, 0));
  const table = new THREE.Group(); table.position.set(-0.4, 0, -2.3); ST.add(table); table.add(box(1.1, 0.05, 0.6, M(0x8a6a4a), 0, 0.42, 0)); for (const sx of [-0.5, 0.5]) for (const sz of [-0.25, 0.25]) table.add(box(0.05, 0.4, 0.05, M(0x6b4a2b), sx, 0.2, sz)); table.add(box(0.4, 0.04, 0.4, M(0x2f6b4a), -0.1, 0.47, 0)); const cup = makeCup(0xd9534f); cup.position.set(0.35, 0.45, 0.1); table.add(cup);
  ST.add(plane(2.6, 1.8, M(0xb04a3f), -0.4, 0.004, -2.2));
  const plant = new THREE.Group(); plant.position.set(2.6, 0, -0.6); ST.add(plant); plant.add(cyl(0.22, 0.17, 0.4, M(0xb5603a), 10, 0, 0.2, 0)); plant.add(ico(0.35, M(0x4f8a3d), 1, 0, 0.75, 0)); plant.add(ico(0.25, M(0x5c9a46), 1, 0.15, 1.05, 0.1));
  // interior door frame on the back wall (2.0 m)
  const df = new THREE.Group(); df.position.set(2.0, 0, -D + 0.03); ST.add(df); df.add(box(0.9, 2.0, 0.04, M(0x2a2420), 0, 1.0, 0)); df.add(box(0.08, 2.08, 0.12, M(0xffffff), -0.49, 1.04, 0)); df.add(box(0.08, 2.08, 0.12, M(0xffffff), 0.49, 1.04, 0)); df.add(box(1.06, 0.08, 0.12, M(0xffffff), 0, 2.04, 0));
  const doorLbl = lbl('DOOR · 2.0 M', 1.3, 0.3, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 56px sans-serif' }); doorLbl.position.set(2.0, 2.3, -D + 0.12); doorLbl.visible = false; scene.add(doorLbl);
  const ceilLbl = lbl('CEILING · 2.4 M', 1.3, 0.22, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 56px sans-serif' }); ceilLbl.position.set(0.5, H1 + SL / 2, 0.02); ceilLbl.visible = false; scene.add(ceilLbl);
  const ruler = box(0.08, H1, 0.08, M(0xf4efe4), -2.9, H1 / 2, -0.6); scene.add(ruler); for (let i = 1; i < 5; i++) scene.add(box(0.2, 0.03, 0.1, M(0xc0392b), -2.86, i * 0.5, -0.6));
  const floorLbl = lbl('RATED · 150 KG / M²', 2.2, 0.275, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 60px sans-serif', pw: 1024 }); floorLbl.rotation.x = -Math.PI / 2; floorLbl.position.set(1.0, 0.02, -1.0); floorLbl.visible = false; scene.add(floorLbl);
  const weightLbl = lbl('FAMILY OF FOUR ≈ 2,000 KG', 1.7, 0.2125, { bg: '#c0392b', fg: '#ffffff', font: 'bold 46px sans-serif', pw: 1024 }); weightLbl.position.set(0.2, H1 + SL / 2, 0.03); weightLbl.visible = false; scene.add(weightLbl);
  // first floor furniture
  const bed = new THREE.Group(); bed.position.set(-1.9, y1, -3.4); ST.add(bed); bed.add(box(1.5, 0.4, 2.0, M(0x6b4a2b), 0, 0.2, 0)); bed.add(box(1.46, 0.18, 1.9, M(0xf4f1ea), 0, 0.48, 0)); bed.add(box(1.48, 0.12, 1.2, M(0x6f8fb5), 0, 0.62, 0.3)); bed.add(box(0.6, 0.12, 0.4, M(0xffffff), 0, 0.62, -0.7)); bed.add(box(1.5, 0.9, 0.08, M(0x6b4a2b), 0, 0.6, -1.0));
  const desk = new THREE.Group(); desk.position.set(2.1, y1, -3.9); ST.add(desk); desk.add(box(1.3, 0.05, 0.7, M(0x8a6a4a), 0, 0.74, 0)); for (const sx of [-0.6, 0.6]) desk.add(box(0.05, 0.72, 0.64, M(0x3a3a3a), sx, 0.36, 0)); desk.add(box(0.42, 0.26, 0.02, M(0x9aa1a8), 0, 0.9, -0.1)); desk.add(plane(0.4, 0.24, emis(0xbfd4ff, 0.8), 0, 0.9, -0.09, 0));
  const ward = box(1.0, 2.0, 0.6, M(0xcbb79a), -2.45, y1 + 1.0, -1.0); ST.add(ward); ST.add(plane(2.0, 1.4, M(0xd9736a), 0.3, y1 + 0.004, -1.8));
  const bLamp = new THREE.Group(); bLamp.position.set(-0.4, y1, -4.1); ST.add(bLamp); bLamp.add(box(0.45, 0.5, 0.4, M(0x8a6a4a), 0, 0.25, 0)); bLamp.add(cyl(0.03, 0.03, 0.3, M(0x333), 6, 0, 0.65, 0)); bLamp.add(cone(0.14, 0.14, M(0xf2c14e), 10, 0, 0.85, 0));
  // loft
  for (let i = 0; i < 5; i++) ST.add(box(0.5, 0.4, 0.5, M([0xb08a4e, 0xc9a56b, 0x8a6a4a][i % 3]), -2.2 + i * 0.75, y2 + 0.2 + (i % 2) * 0.4, -3.6 + (i % 2) * 0.5));
  ST.add(box(0.7, 0.45, 0.3, M(0x2b4c7e), 1.8, y2 + 0.23, -3.2)); ST.add(cyl(0.02, 0.02, 1.2, M(0x333), 6, 0, y2 + 1.6, -2.4));
  bakeStatic(ST, scene);
  // people
  const dad = new Person({ seed: 701, shirt: 0x4a7fb5, pants: 0x2f3b4e, scale: 1.0 }); dad.g.position.set(1.0, 0, -3.5); dad.g.rotation.y = 0; scene.add(dad.g);
  const mum = new Person({ seed: 702, dress: true, hairStyle: 'bun', shirt: 0x9b7bb8, scale: 0.97 }); mum.g.position.set(-0.9, 0, -2.9); mum.g.rotation.y = 0.3; scene.add(mum.g);
  const kid1 = new Person({ seed: 703, scale: 0.62, shirt: 0xf2c14e }); kid1.g.position.set(-2.3, 0, -0.9); kid1.g.rotation.y = -0.5; scene.add(kid1.g);
  const kid2 = new Person({ seed: 704, scale: 0.58, hairStyle: 'long', shirt: 0x3aa5a0 }); kid2.g.position.set(0.7, 0, -1.4); kid2.g.rotation.y = 0.6; scene.add(kid2.g);
  const teen = new Person({ seed: 705, scale: 0.9, shirt: 0x2f3b4e, hairStyle: 'long' }); teen.g.position.set(-1.1, y1, -2.35); teen.g.rotation.y = 0.2; scene.add(teen.g);
  const holes = [[1.0, -3.5, 0.4], [-0.9, -2.9, 0.4]].map(([x, z, rr]) => { const h = holeRing(rr); h.position.set(x, H1 + SL + 0.005, z); scene.add(h); return h; });
  const dusts = holes.map(h => { const d = makeSmoke(8, 0xe8e2d4, 0.45, 31); d.position.set(h.position.x, H1 - 0.1, h.position.z); d.visible = false; scene.add(d); return d; });
  // cracks on the ground floor
  const cracks = []; const cr = rng(13); for (const [cx, cz] of [[1.0, -3.5], [-0.9, -2.9]]) for (let i = 0; i < 7; i++) { const a = i * 0.9 + cr.f() * 0.5; const L = cr.range(0.9, 1.9); const c = box(L, 0.012, 0.1, M(0x1a1208), cx + Math.cos(a) * L / 2, 0.012, cz + Math.sin(a) * L / 2); c.rotation.y = -a; c.userData.L = L; c.scale.x = 0.001; scene.add(c); cracks.push(c); }
  const ppl = [dad, mum, kid1, kid2];
  S.actors = { dad, mum, kid1, kid2, teen, holes };
  S.update = (t, c) => {
    S.setSky(0); const g = c.grow ?? 0; const crp = c.crop ?? 0;
    ppl.forEach(p => { setGrow(p, g); cropClothes(p, crp); });
    dad.pose('stand', t); mum.pose('stand', t, { phase: 2 }); kid1.pose('stand', t, { phase: 1 }); kid2.pose('stand', t, { phase: 3 });
    if (g > 0.5) { [dad, mum].forEach(p => { p.armL.rotation.z = 0.5; p.armR.rotation.z = -0.5; p.armL.rotation.x = -0.4; p.armR.rotation.x = -0.4; }); [kid1, kid2].forEach(p => { p.neck.rotation.x = -0.6; }); }
    teen.pose('sit'); teen.hips.position.y = 0.5 + 0.56; teen.g.position.y = y1 + 0.0; teen.armL.rotation.x = -1.2; teen.armR.rotation.x = -1.2; if (c.teen === 'look') { teen.neck.rotation.y = 0.9; teen.neck.rotation.x = 0.1; face(teen, { wide: 1, open: 0.5 }); } else face(teen, {});
    holes.forEach(h => h.visible = !!c.holes); dusts.forEach(d => { d.visible = !!c.dust; if (d.visible) updateSmoke(d, t, 0.9, -0.9, 0.3); });
    const ck = c.crack ?? 0; cracks.forEach((cc, i) => { const k = clamp(ck * 1.4 - (i % 7) * 0.05, 0, 1); cc.scale.x = Math.max(0.001, k); cc.position.x = cc.position.x; });
    doorLbl.visible = !!c.doorLbl; ceilLbl.visible = !!c.ceilLbl; floorLbl.visible = !!c.floorLbl; weightLbl.visible = !!c.weightLbl;
  };
  return S;
}

// ======================= STUDIO (numbers) =======================
// ctx: prop ('pole'|'scale'|'discs'|'load'|'galileo'|'crop'|'heart'), k, kg, bear, bend, lblOn, crowd, giraffe, nod, wide
export function buildStudioH() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1d2b45); const cam = new THREE.PerspectiveCamera(44, 1080 / 1920, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x203050, 1.1)); const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(3, 6, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 8, bottom: -2 }); scene.add(key); scene.add(key.target);
  const floor = plane(40, 40, M(0x24365a), 0, 0, 0); floor.receiveShadow = true; scene.add(floor);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 14, 32, 1, true, Math.PI * 0.75, Math.PI * 1.5), new THREE.MeshLambertMaterial({ color: 0x2a3d66, side: THREE.BackSide })); back.position.set(0, 7, 0); scene.add(back);
  const spot = softSprite(0x6f9cff, 9, 0.25); spot.position.set(0, 3, -6); scene.add(spot);
  const P = {}; const add = (k, g) => { P[k] = g; scene.add(g); return g; };
  const GOLD = { fg: '#f2c85b', font: 'bold 60px sans-serif' }; const TAG = { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 56px sans-serif' };
  // pole: ruler 0-4 m, Dave grows, ghost of normal Dave
  { const g = new THREE.Group(); const pt = canvasTex(128, 1024, (ctx, W, H) => { ctx.fillStyle = '#f4efe4'; ctx.fillRect(0, 0, W, H); for (let m = 0; m <= 40; m++) { const y = H - (m / 40) * H; ctx.fillStyle = m % 10 === 0 ? '#c0392b' : '#2b2d33'; ctx.fillRect(0, y - 2, m % 10 === 0 ? 90 : (m % 5 === 0 ? 60 : 36), m % 10 === 0 ? 6 : 3); if (m % 10 === 0 && m > 0) { ctx.font = 'bold 40px sans-serif'; ctx.fillText((m / 10) + ' m', 44, y + 38); } } }); pt.magFilter = THREE.LinearFilter;
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.1), new THREE.MeshLambertMaterial({ map: pt })); pole.position.set(-1.0, 2, 0); g.add(pole);
    const d = makeDave(); d.g.position.set(0.3, 0, 0); g.add(d.g); const ghost = makeDave(); ghost.g.position.set(1.3, 0, -0.2); ghost.g.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.35; } }); g.add(ghost.g);
    const l17 = lbl('1.7 M', 0.9, 0.3, TAG); l17.position.set(1.3, 1.95, 0.2); g.add(l17); const l34 = lbl('3.4 M', 0.9, 0.3, TAG); l34.position.set(0.3, 3.68, 0.3); g.add(l34);
    g.userData = { d, ghost, l17, l34 }; add('pole', g); }
  // scale: platform + dial, Dave; second platform with a polar bear
  function dialTex(max) { const t = canvasTex(512, 512, (ctx, W, H) => { ctx.fillStyle = '#f4efe4'; ctx.beginPath(); ctx.arc(256, 256, 250, 0, 6.283); ctx.fill(); ctx.lineWidth = 14; ctx.strokeStyle = '#2b2d33'; ctx.stroke(); for (let i = 0; i <= 60; i++) { const a = Math.PI * (0.75 + 1.5 * i / 60); const L = i % 10 === 0 ? 34 : 16; ctx.lineWidth = i % 10 === 0 ? 6 : 3; ctx.strokeStyle = i > 50 ? '#c0392b' : '#2b2d33'; ctx.beginPath(); ctx.moveTo(256 + Math.cos(a) * 220, 256 + Math.sin(a) * 220); ctx.lineTo(256 + Math.cos(a) * (220 - L), 256 + Math.sin(a) * (220 - L)); ctx.stroke(); if (i % 10 === 0) { ctx.fillStyle = '#2b2d33'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(max * i / 60), 256 + Math.cos(a) * 150, 256 + Math.sin(a) * 150); } } ctx.font = 'bold 40px sans-serif'; ctx.fillText('KG', 256, 380); }); t.magFilter = THREE.LinearFilter; return t; }
  function makeScale(x) { const g = new THREE.Group(); g.position.x = x; g.add(box(1.7, 0.16, 1.3, M(0x9aa1a8), 0, 0.08, 0)); g.add(box(1.5, 0.04, 1.1, M(0x2b2d33), 0, 0.18, 0)); g.add(box(0.2, 2.6, 0.2, M(0x9aa1a8), -1.25, 1.3, -0.4)); const face_ = new THREE.Mesh(new THREE.CircleGeometry(0.75, 48), new THREE.MeshLambertMaterial({ map: dialTex(600) })); face_.position.set(-1.25, 2.9, -0.28); g.add(face_); g.add(cyl(0.82, 0.82, 0.12, M(0x2b2d33), 48, -1.25, 2.9, -0.36)); g.children[g.children.length - 1].rotation.x = Math.PI / 2; const needle = new THREE.Group(); needle.position.set(-1.25, 2.9, -0.25); needle.add(box(0.05, 0.62, 0.03, M(0xc0392b), 0, 0.28, 0)); needle.add(cyl(0.07, 0.07, 0.05, M(0x2b2d33), 16, 0, 0, 0.01)); needle.children[1].rotation.x = Math.PI / 2; g.add(needle); g.userData.needle = needle; return g; }
  function makeBear() { const g = new THREE.Group(); const w = M(0xf1f1ea); const body = ico(0.7, w, 1, 0, 1.0, 0); body.scale.set(1.55, 1.0, 0.95); g.add(body); const head = ico(0.36, w, 1, 1.05, 1.35, 0); head.scale.set(1.15, 0.95, 0.95); g.add(head); g.add(box(0.3, 0.22, 0.26, w, 1.42, 1.25, 0)); g.add(ico(0.07, M(0x111111), 0, 1.58, 1.28, 0)); for (const sz of [-0.2, 0.2]) { g.add(ico(0.09, w, 0, 1.0, 1.68, sz)); g.add(ico(0.035, M(0x111111), 0, 1.3, 1.42, sz * 0.75)); } for (const sx of [-0.65, 0.55]) for (const sz of [-0.3, 0.3]) g.add(cyl(0.17, 0.2, 0.75, w, 8, sx, 0.38, sz)); g.add(ico(0.1, w, 0, -1.05, 1.1, 0)); return g; }
  { const g = new THREE.Group(); const s1 = makeScale(0); g.add(s1); const d = makeDave(); d.g.position.set(0, 0.2, 0.1); g.add(d.g); const s2 = makeScale(3.4); g.add(s2); s2.children[2].position.x = 1.25; s2.children[3].position.x = 1.25; s2.children[4].position.x = 1.25; s2.children[5].position.x = 1.25; const bear = makeBear(); bear.position.set(3.4, 0.2, 0.1); bear.rotation.y = -Math.PI / 2 + 0.45; bear.scale.setScalar(0.95); g.add(bear); const lb = lbl('POLAR BEAR ≈ 560 KG', 2.0, 0.25, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 56px sans-serif', pw: 1024 }); lb.position.set(3.1, 2.3, 0.9); g.add(lb); const ld = lbl('DAVE · 560 KG', 1.5, 0.34, TAG); ld.position.set(-1.25, 3.95, -0.2); g.add(ld); g.userData = { d, s1, s2, bear, lb, ld }; add('scale', g); }
  // discs: bone cross-sections 1x -> 4x
  { const g = new THREE.Group(); const bm = M(0xf4efe4), inner = M(0xe8c9a8); const mkDisc = (rr, x) => { const d = new THREE.Group(); d.position.set(x, 2.4, 0); const c1 = cyl(rr, rr, 0.12, bm, 32, 0, 0, 0); c1.rotation.x = Math.PI / 2; d.add(c1); const c2 = cyl(rr * 0.55, rr * 0.55, 0.13, inner, 24, 0, 0, 0.0); c2.rotation.x = Math.PI / 2; d.add(c2); return d; }; const small = mkDisc(0.42, -1.3); const big = mkDisc(0.84, 0.9); g.add(small, big); const l1 = lbl('1×', 0.6, 0.3, GOLD); l1.position.set(-1.3, 1.65, 0); const l4 = lbl('4× THE AREA', 1.6, 0.3, GOLD); l4.position.set(0.9, 1.25, 0); g.add(l1, l4); g.userData = { big, l4 }; add('discs', g); }
  // load: two bones, 1 weight vs 8 weights
  { const g = new THREE.Group(); const bm = M(0xf4efe4); const mkBone = (x) => { const b = new THREE.Group(); b.position.set(x, 0, 0); b.add(cyl(0.16, 0.16, 1.5, bm, 10, 0, 0.75, 0)); for (const y of [0.05, 1.45]) { b.add(ico(0.26, bm, 1, 0.14, y, 0)); b.add(ico(0.26, bm, 1, -0.14, y, 0)); } return b; }; const b1 = mkBone(-1.3), b8 = mkBone(1.1); g.add(b1, b8); const wm = M(0x6b6f7a); const w1 = box(0.5, 0.5, 0.5, wm, -1.3, 1.95, 0); g.add(w1); const ws = []; for (let i = 0; i < 8; i++) { const w = box(0.5, 0.5, 0.5, wm, 1.1 + ((i % 2) - 0.5) * 0.52, 1.95 + Math.floor(i / 4) * 0.52, ((Math.floor(i / 2) % 2) - 0.5) * 0.52); w.userData.y0 = w.position.y; g.add(w); ws.push(w); } const l1 = lbl('WEIGHT 1×', 1.2, 0.3, GOLD); l1.position.set(-1.3, 3.1, 0); const l8 = lbl('WEIGHT 8×', 1.2, 0.3, GOLD); l8.position.set(1.1, 3.5, 0); const l2 = lbl('LOAD PER BONE ×2', 2.2, 0.275, { bg: '#c0392b', fg: '#ffffff', font: 'bold 64px sans-serif', pw: 1024 }); l2.position.set(0.45, 3.3, 0.4); l2.visible = false; g.add(l1, l8, l2); g.userData = { b8, ws, l2 }; add('load', g); }
  // galileo: plinth, bust, book, passers-by on phones
  { const g = new THREE.Group(); g.add(box(1.0, 1.2, 0.8, M(0x8a8f99), 0, 0.6, 0)); const bust = new THREE.Group(); bust.position.y = 1.2; g.add(bust); const stone = M(0xd9d4c8); bust.add(box(0.8, 0.45, 0.4, stone, 0, 0.22, 0)); bust.add(cyl(0.12, 0.14, 0.14, stone, 10, 0, 0.5, 0)); const head = ico(0.24, stone, 2, 0, 0.78, 0); bust.add(head); bust.add(cone(0.16, 0.34, stone, 7, 0, 0.5, 0.14)); bust.children[bust.children.length - 1].rotation.x = Math.PI; const hcap = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), stone); hcap.position.set(0, 0.8, -0.03); hcap.rotation.x = -0.5; bust.add(hcap); bust.add(box(0.5, 0.06, 0.04, M(0xc0b8a8), 0, 0.3, 0.2)); for (const sx of [-1, 1]) bust.add(ico(0.03, M(0x333333), 0, sx * 0.09, 0.82, 0.235)); bust.add(ico(0.04, stone, 0, 0, 0.76, 0.25)); for (const sx of [-1, 1]) { const b = box(0.08, 0.02, 0.02, M(0x8a8a8a), sx * 0.09, 0.88, 0.235); bust.add(b); }
    const name = lbl('GALILEO · 1638', 1.4, 0.3, TAG); name.position.set(0, 0.95, 0.42); g.add(name);
    const book = new THREE.Group(); book.position.set(1.3, 0, 0.2); g.add(book); book.add(box(0.5, 0.7, 0.1, M(0x6b3a2a), 0, 0.35, 0)); book.add(box(0.46, 0.66, 0.11, M(0xf4efe4), 0, 0.35, -0.0)); const bt = lbl('TWO NEW SCIENCES', 0.46, 0.14, { fg: '#f2c85b', font: 'bold 40px serif', pw: 512, ph: 160 }); bt.position.set(0, 0.5, 0.056); book.add(bt); const by = lbl('1638', 0.4, 0.16, { fg: '#f2c85b', font: 'bold 90px serif' }); by.position.set(0, 0.22, 0.056); book.add(by);
    const crowd = []; for (let i = 0; i < 3; i++) { const p = new Person({ seed: 720 + i }); p.g.position.set(-3 + i * 1.4, 0, 1.6); p.g.rotation.y = Math.PI / 2; p.g.visible = false; g.add(p.g); crowd.push(p); }
    const nl = lbl('NOBODY LISTENED', 2.0, 0.25, { bg: '#c0392b', fg: '#ffffff', font: 'bold 64px sans-serif', pw: 1024 }); nl.position.set(0, 2.7, 0.4); nl.visible = false; g.add(nl);
    g.userData = { bust, crowd, nl }; add('galileo', g); }
  // crop: Dave grows, jumper stays
  { const g = new THREE.Group(); const d = makeDave(); g.add(d.g); const l = lbl('CROP TOP', 1.2, 0.3, TAG); l.position.set(0.9, 2.5, 0.5); l.visible = false; g.add(l); g.userData = { d, l }; add('crop', g); }
  // heart: two Daves (1x, 2x) with blood columns heart->head; giraffe
  function makeGiraffe() { const g = new THREE.Group(); const y = M(0xe6b85c), br = M(0x8a5a2a); const body = box(1.3, 0.8, 0.6, y, 0, 1.6, 0); g.add(body); for (const sx of [-0.45, 0.45]) for (const sz of [-0.2, 0.2]) g.add(box(0.16, 1.3, 0.16, y, sx, 0.65, sz)); const neck = new THREE.Group(); neck.position.set(0.6, 1.9, 0); g.add(neck); neck.add(box(0.3, 2.3, 0.3, y, 0, 1.15, 0)); const head = new THREE.Group(); head.position.set(0, 2.3, 0); neck.add(head); head.add(box(0.55, 0.3, 0.28, y, 0.2, 0.1, 0)); head.add(box(0.2, 0.18, 0.26, br, 0.45, 0.08, 0)); for (const sz of [-0.09, 0.09]) { head.add(cyl(0.03, 0.03, 0.22, br, 6, 0.05, 0.34, sz)); head.add(ico(0.03, M(0x111), 0, 0.3, 0.2, sz * 1.5)); } const rr = rng(8); for (let i = 0; i < 14; i++) { const s = ico(0.12, br, 0, rr.range(-0.55, 0.55), 1.6 + rr.range(-0.3, 0.3), 0.31 * (i % 2 ? 1 : -1)); s.scale.z = 0.3; g.add(s); } for (let i = 0; i < 6; i++) { const s = ico(0.08, br, 0, 0.16 * (i % 2 ? 1 : -1), 0.4 + i * 0.35, 0); s.scale.x = 0.3; neck.add(s); } const tail = box(0.05, 0.6, 0.05, br, -0.65, 1.3, 0); g.add(tail); g.userData = { neck, head }; return g; }
  { const g = new THREE.Group(); const d1 = makeDave(); d1.g.position.set(-1.1, 0, 0); g.add(d1.g); const d2 = makeDave(); d2.g.position.set(0.5, 0, -0.1); d2.g.scale.setScalar(2); g.add(d2.g); const red = M(0xd63c4a); const mkCol = (x, y0, h, z) => { const c = box(0.12, h, 0.12, red, x, y0 + h / 2, z); c.userData = { y0, h }; c.scale.y = 0.001; return c; }; const c1 = mkCol(-1.1 + 0.32, 1.25, 0.35, 0.25); const c2 = mkCol(0.5 + 0.64, 2.5, 0.7, 0.35); g.add(c1, c2); const h1 = ico(0.08, red, 1, -1.1 + 0.32, 1.25, 0.25); const h2 = ico(0.16, red, 1, 0.5 + 0.64, 2.5, 0.35); g.add(h1, h2); const l35 = lbl('+35 CM', 0.9, 0.3, TAG); l35.position.set(1.85, 2.78, 0.45); l35.visible = false; g.add(l35); const lg = lbl('GIRAFFE · 280/180 MMHG', 1.0, 0.125, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 48px sans-serif', pw: 1024 }); lg.position.set(2.72, 4.98, 0.1); lg.visible = false; g.add(lg); const gir = makeGiraffe(); gir.position.set(2.9, 0, -0.6); gir.rotation.y = Math.PI + 0.9; gir.visible = false; g.add(gir); g.userData = { d1, d2, c1, c2, h1, h2, l35, lg, gir }; add('heart', g); }
  const S = { scene, cam, key, P };
  S.update = (t, c) => {
    const prop = c.prop || 'pole'; Object.entries(P).forEach(([k, g]) => g.visible = k === prop); key.target.position.copy(P[prop].position); key.target.updateMatrixWorld();
    const u = P[prop].userData; const k = c.k ?? 0;
    if (prop === 'pole') { u.d.pose('stand', t); u.ghost.pose('stand', t); setGrow(u.d, k); u.l17.visible = k < 0.5; u.l34.visible = k > 0.9; u.ghost.g.visible = k > 0.1; face(u.d, { wide: k }); }
    if (prop === 'scale') { u.d.pose('stand', t); setGrow(u.d, k); u.d.armL.rotation.z = 0.25; u.d.armR.rotation.z = -0.25; const kg = c.kg ?? 70; u.s1.userData.needle.rotation.z = -(Math.PI * (0.75 + 1.5 * Math.min(kg, 600) / 600) + Math.PI / 2); u.s2.userData.needle.rotation.z = -(Math.PI * (0.75 + 1.5 * 560 / 600) + Math.PI / 2); u.s2.visible = !!c.bear; u.bear.visible = !!c.bear; u.lb.visible = !!c.bear; u.ld.visible = !!c.ld; if (c.bear) { u.bear.children[1].rotation.y = Math.sin(t * 1.2) * 0.2; } face(u.d, { wide: c.wide ?? 0, open: c.open ?? 0 }); u.d.neck.rotation.y = c.bear ? 0.6 : 0; }
    if (prop === 'discs') { const s = lerp(0.5, 1, easeOut(k)); u.big.scale.set(s, s, 1); u.l4.visible = k > 0.6; u.big.rotation.y = Math.sin(t * 0.8) * 0.15; }
    if (prop === 'load') { u.ws.forEach((w, i) => { const kk = clamp(k * 8 - i, 0, 1); w.visible = kk > 0; w.position.y = w.userData.y0 + (1 - easeIn(kk)) * 3; }); const b = c.bend ?? 0; u.b8.rotation.z = 0.12 * b; u.b8.scale.x = 1 + 0.25 * b; u.b8.position.y = -0.1 * b; u.l2.visible = !!c.lblOn; }
    if (prop === 'galileo') { u.bust.rotation.y = Math.sin(t * 0.5) * 0.08; u.nl.visible = !!c.lblOn; u.crowd.forEach((p, i) => { p.g.visible = !!c.crowd; if (c.crowd) { p.g.position.x = -3.5 + ((t * 0.9 + i * 1.4) % 7); p.pose('walk', t, { phase: i }); p.armR.rotation.x = -2.2; p.armR.rotation.z = -0.3; p.neck.rotation.x = 0.45; } }); }
    if (prop === 'crop') { u.d.pose('stand', t); setGrow(u.d, k); cropClothes(u.d, k); u.d.armL.rotation.z = 0.5; u.d.armR.rotation.z = -0.5; u.d.neck.rotation.x = 0.5 * k; u.l.visible = k > 0.95; face(u.d, { wide: k * 0.5 }); }
    if (prop === 'heart') { [u.d1, u.d2].forEach((d, i) => { d.pose('stand', t, { phase: i }); d.g.traverse(o => { if (o.isMesh && o.material && !o._dim) { o._dim = true; o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.45; } }); }); const pulse = 1 + 0.12 * Math.max(0, Math.sin(t * 7)); u.h1.scale.setScalar(pulse); u.h2.scale.setScalar(pulse); [u.c1, u.c2].forEach(cc => { const kk = easeOut(k); cc.scale.y = Math.max(0.001, kk); cc.position.y = cc.userData.y0 + cc.userData.h * kk / 2; }); u.l35.visible = !!c.lblOn; u.lg.visible = !!c.giraffe && (c.nod ?? 0) > 0; const gk = c.giraffe ?? 0; u.gir.visible = gk > 0.01; u.gir.position.x = lerp(5.5, 2.9, smooth(gk)); u.gir.userData.head.rotation.z = (c.nod ? Math.sin(t * 4) * 0.25 : 0) + 0.1; u.gir.userData.neck.rotation.z = 0.15; }
  };
  return S;
}

// ======================= CITY (aerial) with growth =======================
export function buildCityH() {
  const S = buildCity(); const upd = S.update;
  S.update = (t, c) => { upd(t, c); const g = c.grow ?? 0; if (S.people) S.people.forEach(p => p.scale.setScalar(1 + g)); };
  return S;
}

// ======================= EARTH =======================
export function buildEarthH() {
  const S = buildSpace(); S.iss.visible = false; S.debris.visible = false; const upd = S.update;
  S.update = (t, c) => { upd(t, { atmGrow: c.atmGrow ?? 0 }); S.iss.visible = false; S.debris.visible = false; S.earth.rotation.y = t * 0.03; };
  return S;
}

// ======================= ROAD: cars with giants through the roof =======================
// ctx: v (m/s), grow 0..1, holes, hat, sink
export function buildRoad() {
  const S = baseSet({ shadowExtent: 30, fogNear: 60, fogFar: 320, shadowRes: 2048 });
  const { scene } = S; const r = rng(33); const ST = new THREE.Group(); scene.add(ST); S.sunOffset = new THREE.Vector3(30, 60, 50); S.sun.intensity = 2.5;
  const gT = grassTex(6); gT.repeat.set(60, 60); scene.add(plane(400, 400, texMat({ map: gT }), 0, -0.02, 0));
  const aT = asphaltTex(); aT.repeat.set(40, 2); scene.add(plane(200, 9, texMat({ map: aT }), 0, 0, 0)); scene.add(plane(200, 2.5, M(0x9a9a96), 0, 0.01, 5.7)); scene.add(plane(200, 2.5, M(0x9a9a96), 0, 0.01, -5.7));
  for (let x = -100; x < 100; x += 6) ST.add(plane(3, 0.18, M(0xf2f2f2), x, 0.02, 0));
  for (let i = 0; i < 18; i++) { const tr = makeTree(900 + i); tr.position.set(-90 + i * 10 + r.range(-2, 2), 0, r.pick([-1, 1]) * r.range(13, 22)); tr.scale.setScalar(r.range(1, 1.5)); ST.add(tr); }
  for (let i = 0; i < 8; i++) { const l = makeLamp(); l.position.set(-70 + i * 20, 0, 6.5); l.scale.setScalar(1.6); ST.add(l); }
  for (let i = 0; i < 10; i++) { const b = box(r.range(8, 14), r.range(8, 22), 10, M(r.pick([0xb9b0a2, 0xa7a39b, 0x8a8f99])), -70 + i * 15, 6, -34); ST.add(b); }
  bakeStatic(ST, scene);
  const cars = []; const specs = [[0, -1.9, 1, 0xd9534f], [-6, -1.9, 1, 0x3b6fb6], [-12.5, -1.9, 1, 0xf2f2f2], [6.5, -1.9, 1, 0xe8b23a], [13, -1.9, 1, 0x4e8f5a], [7, 1.9, -1, 0x9aa0a6], [-7.5, 1.9, -1, 0x6b3fa0], [-15, 1.9, -1, 0x1f3f6b], [15, 1.9, -1, 0xc7c9cc]];
  specs.forEach(([x0, z, dir, color], i) => { const g = new THREE.Group(); const car = makeCar(300 + i, { color }); car.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(car); const p = new Person({ seed: 800 + i, hairStyle: i % 2 ? 'long' : 'short' }); p.g.position.set(-0.1 * dir, 0.02, 0); p.g.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; p.legL.visible = false; p.legR.visible = false; g.add(p.g); const hole = holeRing(0.5, 0x1a1512); hole.position.set(0, 1.36, 0); g.add(hole); let hat = null; if (i === 0) { hat = new THREE.Group(); const hm = M(0x2a2a2e); hat.add(box(0.8, 0.05, 0.06, hm, 0, 0, 0.3)); hat.add(box(0.8, 0.05, 0.06, hm, 0, 0, -0.3)); hat.add(box(0.06, 0.05, 0.66, hm, 0.4, 0, 0)); hat.add(box(0.06, 0.05, 0.66, hm, -0.4, 0, 0)); hat.position.set(0, 0.33, -0.02); hat.rotation.z = 0.25; hat.rotation.x = 0.1; hat.visible = false; p.neck.add(hat); } g.position.set(x0, 0, z); scene.add(g); cars.push({ g, car, p, hole, hat, x0, dir }); });
  S.actors = { cars };
  S.update = (t, c) => {
    S.setSky(0); const g = c.grow ?? 0; const v = c.v ?? 0;
    cars.forEach((o, i) => { let x = o.x0 + o.dir * v * (c.tl ?? 0); o.g.position.x = x; const p = o.p; setGrow(p, g); p.pose('sit'); p.hips.position.y = 0.45 - (c.sink ?? 0) * 0.35; p.armL.rotation.set(-0.3, 0, 0.9); p.armR.rotation.set(-0.3, 0, -0.9); if (g < 0.5) { p.armL.rotation.set(-1.0, 0, 0.3); p.armR.rotation.set(-1.0, 0, -0.3); } p.neck.rotation.y = Math.sin(t * 1.3 + i) * 0.25; face(p, { wide: g * 0.8, open: g * 0.4 * (i % 2) }); o.hole.visible = !!c.holes; if (o.hat) o.hat.visible = !!c.hat; });
  };
  return S;
}

// ======================= LIFT lobby =======================
// ctx: who ('eight'|'dave'), door 0..1, bump (bool), wide
export function buildLift() {
  const S = baseSet({ shadowExtent: 6, fogNear: 40, fogFar: 120, shadowRes: 1024 });
  const { scene } = S; S.sunOffset = new THREE.Vector3(6, 14, 20); S.sun.intensity = 1.6; S.hemi.intensity = 1.0; scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), texMat({ map: checkerTex('#d8d4cc', '#b8b4ac', 10) })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallM = M(0xcfd6dd); scene.add(box(4.3, 3.2, 0.1, wallM, -2.85, 1.6, -2.0)); scene.add(box(4.3, 3.2, 0.1, wallM, 2.85, 1.6, -2.0)); scene.add(box(1.5, 0.8, 0.1, wallM, 0, 2.8, -2.0)); const ceil = plane(10, 10, M(0xf4f1ea), 0, 3.2, 0, Math.PI / 2); scene.add(ceil);
  const frame = M(0x8a9099); scene.add(box(0.12, 2.4, 0.2, frame, -0.66, 1.2, -1.95)); scene.add(box(0.12, 2.4, 0.2, frame, 0.66, 1.2, -1.95)); scene.add(box(1.44, 0.14, 0.2, frame, 0, 2.33, -1.95));
  // car interior behind the opening
  const carM = M(0xa9b0b8); scene.add(box(1.4, 2.4, 0.06, carM, 0, 1.2, -3.5)); scene.add(box(0.06, 2.4, 1.5, carM, -0.7, 1.2, -2.75)); scene.add(box(0.06, 2.4, 1.5, carM, 0.7, 1.2, -2.75)); scene.add(box(1.4, 0.06, 1.5, carM, 0, 2.38, -2.75)); scene.add(plane(1.4, 1.5, M(0x6b6f7a), 0, 0.001, -2.75)); scene.add(plane(1.0, 0.1, emis(0xfff4dc, 1.4), 0, 2.37, -2.75, Math.PI / 2));
  const sign = lbl('MAX 630 KG · 8 PERSONS', 1.5, 0.19, { bg: '#2b2d33', fg: '#f2c85b', font: 'bold 52px sans-serif', pw: 1024 }); sign.position.set(0, 2.62, -1.84); scene.add(sign);
  const panel = box(0.2, 0.5, 0.05, M(0xe9ecef), 1.0, 1.3, -1.97); scene.add(panel); scene.add(ico(0.03, emis(0xff8a3a, 1), 0, 1.0, 1.42, -1.93)); scene.add(ico(0.03, emis(0xffffff, 1), 0, 1.0, 1.3, -1.93));
  const doorL = box(0.62, 2.3, 0.06, M(0xb8bfc6), 0, 1.15, 0); const doorR = box(0.62, 2.3, 0.06, M(0xb8bfc6), 0, 1.15, 0); scene.add(doorL, doorR);
  const plant = new THREE.Group(); plant.position.set(2.2, 0, -1.5); scene.add(plant); plant.add(cyl(0.25, 0.2, 0.5, M(0xb5603a), 10, 0, 0.25, 0)); plant.add(ico(0.4, M(0x4f8a3d), 1, 0, 0.9, 0));
  const eight = []; for (let i = 0; i < 8; i++) { const p = new Person({ seed: 760 + i, scale: 0.9 + (i % 3) * 0.04, hairStyle: i % 3 ? 'short' : 'long', dress: i % 4 === 1 }); p.g.position.set(-0.45 + (i % 4) * 0.3, 0, -2.3 - Math.floor(i / 4) * 0.55); scene.add(p.g); eight.push(p); }
  const dave = makeDave(); dave.g.position.set(0, 0, -2.6); dave.g.scale.setScalar(2); scene.add(dave.g);
  const lbarely = lbl('1 PERSON · BARELY', 1.5, 0.19, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 52px sans-serif', pw: 1024 }); lbarely.position.set(0, 2.62, -1.83); lbarely.visible = false; scene.add(lbarely);
  S.update = (t, c) => {
    S.setSky(0); const who = c.who ?? 'eight'; eight.forEach((p, i) => { p.g.visible = who === 'eight'; p.pose('stand', t, { phase: i }); p.neck.rotation.y = Math.sin(t + i) * 0.2; });
    dave.g.visible = who === 'dave'; if (dave.g.visible) { squat(dave); dave.g.scale.setScalar(2); dave.neck.rotation.z = 0.45 + Math.sin(t * 5) * 0.03; face(dave, { wide: c.wide ?? 0.7, open: 0.2 }); }
    const d = c.door ?? 0; const bump = c.bump ? 0.35 + 0.08 * Math.sin(t * 7) : d; doorL.position.set(-0.98 + 0.66 * bump, 1.15, -1.93); doorR.position.set(0.98 - 0.66 * bump, 1.15, -1.93);
    sign.visible = !c.barely; lbarely.visible = !!c.barely;
  };
  return S;
}

// ======================= LIST (Priya writes "eggs" again) =======================
// ctx: k 0..1 (writing progress)
export function buildList() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x8a6a4a); const cam = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.05, 50);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x665544, 1.0)); const key = new THREE.DirectionalLight(0xfff2e0, 1.6); key.position.set(1.5, 3, 2); key.castShadow = true; scene.add(key);
  const wT = canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = '#8a6a4a'; ctx.fillRect(0, 0, w, h); const r = mulberry32(2); for (let i = 0; i < 40; i++) { ctx.fillStyle = r() < 0.5 ? '#7a5a3a' : '#9a7a5a'; ctx.fillRect(0, r() * h, w, 1 + r() * 3); } }); wT.repeat.set(3, 3); const table = plane(6, 6, texMat({ map: wT }), 0, 0, 0); table.receiveShadow = true; scene.add(table);
  const c = document.createElement('canvas'); c.width = 512; c.height = 700; const ctx = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.LinearFilter;
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.025), new THREE.MeshLambertMaterial({ map: tex })); paper.rotation.x = -Math.PI / 2; paper.rotation.z = 0.06; paper.position.set(0, 0.004, 0); paper.receiveShadow = true; scene.add(paper);
  const pen = new THREE.Group(); scene.add(pen); const pb = cyl(0.012, 0.009, 0.42, M(0x2b4c7e), 8, 0, 0.21, 0); pen.add(pb); pen.add(cone(0.009, 0.03, M(0x9aa1a8), 8, 0, -0.01, 0)); pen.children[1].rotation.x = Math.PI; pen.rotation.x = 0.9; pen.rotation.z = -0.35;
  const hand = ico(0.07, M(0xe0ac7e), 1, 0, 0, 0); hand.scale.set(1.2, 0.8, 1.5); pen.add(hand); hand.position.set(0.01, 0.1, 0.0); for (let i = 0; i < 3; i++) { const f = box(0.025, 0.02, 0.09, M(0xe0ac7e), -0.02 + i * 0.025, 0.06, 0.06); pen.add(f); }
  const mug = makeCup(0xd9534f); mug.scale.setScalar(1.6); mug.position.set(0.55, 0, -0.35); scene.add(mug);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 8, 16), M(0xf5d76e)); ring.rotation.x = Math.PI / 2; ring.position.set(-0.5, 0.01, 0.3); scene.add(ring);
  let last = -1; const WRITE = '1. eggs  (again)';
  function draw(k) { ctx.fillStyle = '#fbf7ec'; ctx.fillRect(0, 0, 512, 700); ctx.strokeStyle = '#cfd8e6'; ctx.lineWidth = 2; for (let y = 90; y < 700; y += 62) { ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(482, y); ctx.stroke(); } ctx.fillStyle = '#1f2a44'; ctx.font = 'bold 40px serif'; ctx.fillText('DAVE — WEDDING SHOP', 40, 62); ctx.font = 'italic 44px serif'; ['1. eggs', '2. flour', '3. candles', '4. YOUR SUIT!!', '5. ring Nan'].forEach((l, i) => ctx.fillText(l, 50, 142 + i * 62)); ctx.strokeStyle = '#1f2a44'; ctx.lineWidth = 4; [1, 2, 3, 4].forEach(i => { ctx.beginPath(); ctx.moveTo(44, 128 + i * 62); ctx.lineTo(260, 132 + i * 62); ctx.stroke(); }); ctx.strokeStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(44, 128); ctx.lineTo(190, 132); ctx.stroke(); ctx.fillStyle = '#c0392b'; ctx.font = 'italic 46px serif'; const n = Math.floor(k * WRITE.length); ctx.fillText(WRITE.slice(0, n), 50, 142 + 6 * 62); ctx.font = 'italic 36px serif'; ctx.fillStyle = '#1f2a44'; ctx.fillText('— P x', 340, 640); tex.needsUpdate = true; }
  draw(0);
  const S = { scene, cam, key };
  S.update = (t, c) => { const k = clamp(c.k ?? 0, 0, 1); if (k !== last) { draw(k); last = k; } const n = k * WRITE.length; const px = -0.36 + (n / WRITE.length) * 0.42 + Math.sin(t * 25) * 0.004 * (k > 0 && k < 1 ? 1 : 0); const pz = 0.5 * (142 + 6 * 62) / 700 - 0.5 + 0.02; pen.position.set(px, 0.0, pz * 1.025 + 0.02); pen.rotation.z = -0.35 + Math.sin(t * 25) * 0.03 * (k > 0 && k < 1 ? 1 : 0); };
  return S;
}
