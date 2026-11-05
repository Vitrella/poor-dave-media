import * as THREE from 'three';
import { box, cyl, ico, plane, rng, lerp, clamp, smooth, easeOut, easeIn, prog, emis, canvasTex, texMat } from './util.js';
import { M, Person } from './kit.js';
import { buildKitchen } from './sets.js';
import { makeDave } from './water.js';
import { buildStreet } from './lions.js';

// ---------- characters ----------
export function makeNan() { return new Person({ seed: 31, skin: 0xf0c8ab, shirt: 0x8a6fa8, hair: 0xd9d6d0, dress: true, hairStyle: 'bun', scale: 0.9 }); }
const whitesOf = (p) => p.neck.children.filter(m => m.isMesh && m.material && m.material.color && m.material.color.getHex() === 0xf8f6f2 && m.geometry.type === 'IcosahedronGeometry');
function face(p, c) { // c: wide 0..1, strain 0..1, talk bool, t
  const W = p._whites || (p._whites = whitesOf(p)); const w = c.wide ?? 0; W.forEach(x => x.scale.set(1 + 0.5 * w, 1 + 0.5 * w, 0.55));
  p.mouth.scale.set(1 + 0.6 * (c.strain ?? 0), c.talk ? 1 + 3 * Math.max(0, Math.sin(c.t * 13)) : 1 + (c.strain ?? 0) * 0.6 + (c.smile ? 0.3 : 0), 1);
}

// ---------- the jar ----------
function labelTex() { return canvasTex(256, 128, (ctx, w, h) => { ctx.fillStyle = '#f4ecd8'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#a0522d'; ctx.lineWidth = 6; ctx.strokeRect(6, 6, w - 12, h - 12); ctx.fillStyle = '#5a3a1a'; ctx.font = 'bold 44px serif'; ctx.textAlign = 'center'; ctx.fillText('PICKLES', w / 2, 62); ctx.font = 'italic 30px serif'; ctx.fillText("Nan · '98", w / 2, 104); }); }
export function makeJar() {
  const g = new THREE.Group();
  const glass = cyl(0.085, 0.085, 0.2, M(0xc9cf8a), 14, 0, 0.1, 0); g.add(glass);
  const shine = box(0.018, 0.16, 0.01, M(0xf4f6e4), -0.05, 0.1, 0.07, false); g.add(shine);
  for (let i = 0; i < 5; i++) { const pk = cyl(0.022, 0.022, 0.15, M(0x5c7a2e), 6, Math.cos(i * 1.3) * 0.045, 0.1, Math.sin(i * 1.3) * 0.045, false); g.add(pk); }
  const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.087, 0.087, 0.08, 14, 1, true, -0.9, 1.8), texMat({ map: labelTex() })); lab.position.y = 0.09; g.add(lab);
  const lid = new THREE.Group(); lid.position.y = 0.2; g.add(lid); lid.add(cyl(0.09, 0.09, 0.035, M(0xc9a236), 14, 0, 0.0175, 0));
  for (let i = 0; i < 12; i++) { const r = box(0.006, 0.03, 0.01, M(0xa8862a), Math.cos(i * 0.52) * 0.09, 0.0175, Math.sin(i * 0.52) * 0.09, false); r.rotation.y = -i * 0.52; lid.add(r); }
  g.userData.lid = lid; return g;
}

// =============== NAN'S KITCHEN ===============
// ctx: jarMode ('dave'|'table'|'nan'|'open'), twist, down (0..1), lidPop (0..1), wide, strain, daveLook, nanLook, frozen, flash, nanArms ('lap'|'jar'|'folded'), talk
export function buildNanKitchen() {
  const S = buildKitchen(); const { scene } = S; const { cook, cFlame } = S.actors;
  cook.g.visible = false; cFlame.visible = false;
  scene.traverse(o => { if (o.isMesh && o.geometry.type === 'CylinderGeometry' && Math.abs(o.position.x - 1.6) < 0.01 && Math.abs(o.position.y - 0.88) < 0.01) o.visible = false; });
  // tablecloth + plate + teapot
  scene.add(box(1.24, 0.012, 0.84, M(0xd96b5a), 1.6, 0.782, -0.4, false));
  scene.add(cyl(0.12, 0.1, 0.02, M(0xffffff), 12, 1.95, 0.8, -0.55)); const tp = cyl(0.09, 0.11, 0.14, M(0x6a8fb8), 10, 1.12, 0.86, -0.7); scene.add(tp); scene.add(ico(0.035, M(0x6a8fb8), 0, 1.12, 0.95, -0.7));
  // chair for Nan
  const chair = new THREE.Group(); chair.position.set(2.6, 0, -0.4); chair.rotation.y = -Math.PI / 2; scene.add(chair); chair.add(box(0.5, 0.05, 0.46, M(0x7a5434), 0, 0.45, 0)); chair.add(box(0.5, 0.6, 0.05, M(0x7a5434), 0, 0.75, -0.21)); for (const sx of [-0.21, 0.21]) for (const sz of [-0.19, 0.19]) chair.add(box(0.04, 0.45, 0.04, M(0x6b4a2b), sx, 0.225, sz));
  const dave = makeDave(); dave.g.position.set(1.35, 0, -1.15); dave.g.rotation.y = 0; scene.add(dave.g);
  const nan = makeNan(); nan.g.position.set(2.6, 0, -0.4); nan.g.rotation.y = -Math.PI / 2; scene.add(nan.g);
  const jar = makeJar(); scene.add(jar);
  const tmp = new THREE.Vector3();
  S.actors.dave = dave; S.actors.nan = nan; S.actors.jar = jar;
  S.update = (t, c) => {
    S.setSky(0);
    const mode = c.jarMode || 'dave';
    // Dave
    dave.pose('stand', t);
    const hold = mode === 'dave' || mode === 'open';
    const down = c.down ?? 0;
    if (hold || down > 0) {
      const k = hold ? (mode === 'open' ? 0 : down) : 1;
      dave.armL.rotation.x = lerp(-1.15, -0.55, k); dave.armR.rotation.x = lerp(-1.15, -0.55, k); dave.armL.rotation.z = 0.42; dave.armR.rotation.z = -0.42; dave.torso.rotation.x = lerp(0.0, 0.32, k);
      if (c.twist) { dave.armR.rotation.y = Math.sin(t * 9) * 0.25; dave.torso.rotation.y = Math.sin(t * 9) * 0.04; }
    }
    if (c.frozen) { dave.armL.rotation.set(0, 0, 0.02); dave.armR.rotation.set(0, 0, -0.02); dave.torso.rotation.set(0, 0, 0); }
    dave.neck.rotation.set(0, 0, 0); const dl = c.daveLook || 'jar';
    if (dl === 'jar') dave.neck.rotation.x = 0.45; else if (dl === 'nan') { dave.neck.rotation.y = -0.55; dave.neck.rotation.x = 0.2; } else if (dl === 'cam') dave.neck.rotation.x = 0.0; else if (dl === 'hands') dave.neck.rotation.x = 0.6;
    if (c.shake) dave.neck.rotation.z = Math.sin(t * 40) * 0.03;
    face(dave, { wide: c.wide, strain: c.strain, talk: c.talk, t, smile: c.smileD });
    // Nan seated
    nan.pose('sit', t); nan.neck.rotation.set(0, 0, 0);
    const nl = c.nanLook || 'dave'; if (nl === 'dave') { nan.neck.rotation.y = -0.45; nan.neck.rotation.x = -0.05; } else if (nl === 'jar') nan.neck.rotation.x = 0.4; else if (nl === 'cam') nan.neck.rotation.x = 0.05; else if (nl === 'up') { nan.neck.rotation.x = -0.25; nan.neck.rotation.y = 0.3; }
    const na = c.nanArms || 'lap';
    if (na === 'lap') { nan.armL.rotation.x = -0.55; nan.armR.rotation.x = -0.55; nan.armL.rotation.z = 0.2; nan.armR.rotation.z = -0.2; }
    else if (na === 'jar') { nan.armL.rotation.x = -1.25; nan.armR.rotation.x = -1.25; nan.armL.rotation.z = 0.42; nan.armR.rotation.z = -0.42; if (c.twist) nan.armR.rotation.y = Math.sin(t * 6) * 0.15; }
    else if (na === 'folded') { nan.armL.rotation.x = -1.35; nan.armR.rotation.x = -1.35; nan.armL.rotation.z = 0.95; nan.armR.rotation.z = -0.95; }
    face(nan, { wide: c.nanWide, strain: 0, t, smile: false });
    // Jar placement
    jar.rotation.set(0, 0, 0); const lid = jar.userData.lid; lid.position.set(0, 0.2, 0); lid.rotation.set(0, 0, 0);
    if (mode === 'dave' || mode === 'open') {
      dave.g.updateMatrixWorld(true); dave.armL.children[1].getWorldPosition(tmp); const a = tmp.clone(); dave.armR.children[1].getWorldPosition(tmp); const mid = a.add(tmp).multiplyScalar(0.5);
      jar.position.set(mid.x, mid.y - 0.1, mid.z); if (c.twist) jar.rotation.y = Math.sin(t * 9) * 0.05;
    } else if (mode === 'table' || mode === 'down') {
      if (down < 1 && mode === 'down') { dave.g.updateMatrixWorld(true); dave.armL.children[1].getWorldPosition(tmp); const a = tmp.clone(); dave.armR.children[1].getWorldPosition(tmp); const mid = a.add(tmp).multiplyScalar(0.5); jar.position.set(mid.x, Math.max(0.79, mid.y - 0.1), mid.z); }
      else jar.position.set(1.45, 0.79, -0.6);
    } else if (mode === 'nan') {
      nan.g.updateMatrixWorld(true); nan.armL.children[1].getWorldPosition(tmp); const a = tmp.clone(); nan.armR.children[1].getWorldPosition(tmp); const mid = a.add(tmp).multiplyScalar(0.5);
      jar.position.set(mid.x, mid.y - 0.1, mid.z); if (c.twist) jar.rotation.y = Math.sin(t * 6) * 0.05;
      const p = c.lidPop ?? 0; if (p > 0) { lid.position.set(-0.15 * p, 0.2 + 0.9 * Math.sqrt(p), 0.05 * p); lid.rotation.set(p * 9, p * 4, p * 6); }
    }
    if (mode === 'open') lid.visible = false; else lid.visible = !(mode === 'nan' && (c.lidPop ?? 0) >= 1);
  };
  return S;
}

// =============== BITE (a second kitchen: someone eating toast) ===============
export function buildToastKitchen() {
  const S = buildKitchen(); const { scene } = S; const { cook } = S.actors;
  const plate = cyl(0.14, 0.12, 0.02, M(0xffffff), 14, 1.45, 0.79, -0.25); scene.add(plate);
  const toast = new THREE.Group(); scene.add(toast); toast.add(box(0.11, 0.11, 0.02, M(0xd9a35a), 0, 0, 0)); toast.add(box(0.12, 0.12, 0.016, M(0xa56a2e), 0, 0, -0.004));
  const crumbs = []; const r = rng(5); for (let i = 0; i < 26; i++) { const cb = box(0.02, 0.02, 0.02, M(r.f() < 0.5 ? 0xd9a35a : 0xa56a2e), 0, 0, 0, false); cb.userData.v = new THREE.Vector3(r.range(-1, 1), r.range(0.2, 1.4), r.range(-0.2, 1.2)); scene.add(cb); crumbs.push(cb); }
  const tmp = new THREE.Vector3();
  S.update = (t, c) => {
    S.setSky(0); cook.g.position.set(1.2, 0, 0.35); cook.g.rotation.y = -0.45; cook.pose('stand', t);
    cook.armR.rotation.x = -2.3; cook.armR.rotation.z = -0.55; cook.neck.rotation.set(0.05, 0, 0);
    cook.g.updateMatrixWorld(true); cook.armR.children[1].getWorldPosition(tmp);
    const b = c.biteT ?? -1; toast.visible = b < 0.05; toast.position.copy(tmp); toast.position.y += 0.06; toast.lookAt(cook.neck.getWorldPosition(new THREE.Vector3()));
    cook.mouth.scale.y = b >= 0 && b < 0.2 ? 4 : 1;
    const _w = cook._w || (cook._w = whitesOf(cook)); _w.forEach(x => x.scale.set(b > 0 ? 1.5 : 1, b > 0 ? 1.5 : 1, 0.55));
    crumbs.forEach(cb => { cb.visible = b > 0; if (b > 0) { const tt = Math.min(b, 1.2); cb.position.set(tmp.x + cb.userData.v.x * tt, tmp.y + 0.08 + cb.userData.v.y * tt - 4.9 * tt * tt * 0.5, tmp.z + cb.userData.v.z * tt); if (cb.position.y < 0.01) cb.position.y = 0.01; cb.rotation.set(tt * 9, tt * 7, 0); } });
  };
  return S;
}

// =============== STREET (jumpers, doors, roofs) ===============
// ctx: mode ('jump'|'doors'|'after'), jt (local time for the jumps)
export function buildStrongStreet() {
  const S = buildStreet(); const { scene } = S; const { lionA, lionB, cat, hole, splinters, flap } = S.actors;
  [lionA.g, lionB.g, cat.g, splinters, flap].forEach(o => o.visible = false);
  const r = rng(17);
  const pal = [0x3a6ea5, 0xc0392b, 0x2f6b4a, 0x8e44ad, 0xe67e22, 0x16a085, 0x7f8c8d];
  const jumpers = []; for (let i = 0; i < 7; i++) { const p = new Person({ seed: 40 + i, shirt: pal[i] }); p.g.position.set(-9 + i * 3 + r.range(-0.4, 0.4), 0, 2.2 + r.range(0, 1.6)); p.g.rotation.y = r.range(-0.4, 0.4); p.userData = { t0: r.range(0, 1.6), x: p.g.position.x }; scene.add(p.g); jumpers.push(p); }
  const roofers = []; for (let i = 0; i < 3; i++) { const p = new Person({ seed: 60 + i, shirt: pal[(i * 2 + 1) % 7] }); p.g.position.set(-6 + i * 5.5, 7.85, 0.25); scene.add(p.g); roofers.push(p); }
  // the green door (x=5.2) comes off: dark opening + a man holding the door
  const gap = box(0.95, 2.1, 0.1, M(0x161616), 5.2, 1.05, 0.06); scene.add(gap);
  const doorMan = new Person({ seed: 70, shirt: 0xf1c40f, pants: 0x34495e }); doorMan.g.position.set(5.0, 0, 1.55); doorMan.g.rotation.y = -0.25; scene.add(doorMan.g);
  const door = new THREE.Group(); scene.add(door); door.add(box(0.95, 2.1, 0.08, M(0x2f6b4a), 0, 0, 0)); door.add(ico(0.03, M(0xd8c060), 0, 0.35, 0, 0.05)); for (const y of [0.7, -0.7]) door.add(box(0.06, 0.16, 0.1, M(0x9aa1a8), -0.47, y, 0));
  // second detached door (red, x=-5.2) for the wide shot
  const gap2 = box(0.95, 2.1, 0.1, M(0x161616), -5.2, 1.05, 0.06); scene.add(gap2);
  const doorMan2 = new Person({ seed: 71, shirt: 0x95a5a6 }); doorMan2.g.position.set(-5.0, 0, 1.6); doorMan2.g.rotation.y = 0.3; scene.add(doorMan2.g);
  const door2 = new THREE.Group(); scene.add(door2); door2.add(box(0.95, 2.1, 0.08, M(0xc0392b), 0, 0, 0));
  // ladder for the aftermath
  const ladder = new THREE.Group(); ladder.position.set(-0.5, 0, 0.9); ladder.rotation.x = -0.12; scene.add(ladder); for (const sx of [-0.25, 0.25]) ladder.add(box(0.06, 8.2, 0.06, M(0xb0b4b8), sx, 4.1, 0)); for (let i = 0; i < 20; i++) ladder.add(box(0.5, 0.04, 0.04, M(0xb0b4b8), 0, 0.3 + i * 0.4, 0));
  const climber = new Person({ seed: 80, shirt: 0xe67e22, pants: 0x2c3e50, hat: 0xf1c40f }); scene.add(climber.g);
  const g = 9.8, v = Math.sqrt(2 * g * 7);
  S.update = (t, c) => {
    S.setSky(0); const mode = c.mode || 'jump'; const jt = c.jt ?? 0;
    hole.visible = false; ladder.visible = mode === 'after'; climber.g.visible = mode === 'after';
    const doorsOff = mode !== 'jump' || (c.doorsOff ?? false); gap.visible = doorsOff; gap2.visible = doorsOff;
    jumpers.forEach((p, i) => {
      p.g.visible = mode !== 'after' || i % 2 === 0; const lt = jt - p.userData.t0; p.pose('stand', t, { phase: i });
      if (mode === 'jump' && lt > 0) { const T = 2 * v / g; const u = lt % (T + 0.6); const y = u < T ? v * u - 0.5 * g * u * u : 0; p.g.position.y = Math.max(0, y); if (u < T) { p.armL.rotation.x = -2.8; p.armR.rotation.x = -2.8; p.legL.rotation.x = -0.3; p.legR.rotation.x = 0.2; p.neck.rotation.x = -0.3; } }
      else p.g.position.y = 0;
    });
    roofers.forEach((p, i) => { p.g.visible = mode !== 'doors'; p.pose('sit', t); p.g.position.y = 7.85 - 0.4; p.g.position.z = 0.55; p.neck.rotation.x = 0.35; p.armL.rotation.x = -0.2; p.armR.rotation.x = mode === 'after' && i === 1 ? -2.6 : -0.2; });
    [doorMan, doorMan2].forEach((m, i) => { m.g.visible = doorsOff; m.pose('stand', t, { phase: i }); m.armL.rotation.x = -1.2; m.armR.rotation.x = -1.2; m.armL.rotation.z = 0.25; m.armR.rotation.z = -0.25; const w = m._w || (m._w = whitesOf(m)); w.forEach(x => x.scale.set(1.5, 1.5, 0.55)); m.neck.rotation.x = 0.25; });
    const place = (d, m, dx) => { m.g.updateMatrixWorld(true); const h = new THREE.Vector3(); m.armL.children[1].getWorldPosition(h); const h2 = new THREE.Vector3(); m.armR.children[1].getWorldPosition(h2); h.add(h2).multiplyScalar(0.5); d.position.set(h.x + dx, h.y + 0.2, h.z + 0.08); d.rotation.set(0, m.g.rotation.y, 0.08); d.visible = doorsOff; };
    place(door, doorMan, 0.75); place(door2, doorMan2, -0.75);
    climber.pose('walk', t * 0.6); climber.g.rotation.y = Math.PI; climber.g.position.set(-0.5, 2.2 + Math.sin(t * 2) * 0.05, 1.05); climber.armL.rotation.x = -2.6; climber.armR.rotation.x = -2.3;
  };
  return S;
}
