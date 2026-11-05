import * as THREE from 'three';
import { box, cyl, ico, plane, rng, lerp, clamp, smooth, easeOut, prog, emis, texMat, grassTex, softSprite, bakeStatic } from './util.js';
import { M, Person, FAB, makeCar, makeTree } from './kit.js';
import { baseSet } from './sets.js';
import { makeDave } from './water.js';
import { buildStreet } from './lions.js';

const whitesOf = (p) => p.neck.children.filter(m => m.isMesh && m.material && m.material.color && m.material.color.getHex() === 0xf8f6f2 && m.geometry.type === 'IcosahedronGeometry');
function eyes(p, w) { const W = p._whites || (p._whites = whitesOf(p)); W.forEach(x => x.scale.set(1 + 0.5 * w, 1 + 0.5 * w, 0.55)); }

// green jumper bunched over Dave's head and raised arms
function makeJumper() {
  const g = new THREE.Group(); const knit = FAB(0x3f8f5a, 'knit');
  const body = box(0.5, 0.46, 0.44, knit, 0, 0.02, 0.02); g.add(body); // bunched around head
  const top = ico(0.2, knit, 1, 0, 0.18, 0); top.scale.set(1.25, 0.8, 1.15); g.add(top);
  const sl = []; for (const sx of [-1, 1]) { const s = box(0.17, 0.5, 0.17, knit, sx * 0.3, 0.32, 0); s.rotation.z = -sx * 0.12; g.add(s); sl.push(s); }
  const hem = box(0.52, 0.06, 0.34, FAB(0x2f6f45, 'knit'), 0, -0.22, 0); g.add(hem);
  return g;
}

// =============== FITTING ROOM ===============
// ctx: stuck (0..1 jumper up), tug (bool), fly (0..1 jumper flies off), wide, daveLook, smile, folded (jumper in hands), assistant ('zip'|'none')
export function buildFittingRoom() {
  const S = baseSet({ shadowExtent: 6, fogNear: 40, fogFar: 120, shadowRes: 1024 }); const { scene } = S; S.sun.position.set(-3, 8, 6); S.sun.intensity = 0.7; S.hemi.intensity = 0.9;
  scene.add(new THREE.PointLight(0xfff1dc, 2.5, 8, 1.6).translateY(2.9).translateZ(1.2));
  const floor = plane(14, 14, M(0xb9a68a), 0, 0, 0); floor.receiveShadow = true; scene.add(floor);
  // booth: back wall z=-1, side walls x=±0.9
  scene.add(box(1.9, 2.5, 0.06, M(0xe8e3d9), 0, 1.25, -1.0)); for (const sx of [-0.95, 0.95]) scene.add(box(0.06, 2.5, 2.0, M(0xe8e3d9), sx, 1.25, 0));
  const mirror = box(0.7, 1.6, 0.02, emis(0xc9d6de, 0.35), 0, 1.25, -0.96); scene.add(mirror); scene.add(box(0.78, 1.68, 0.02, M(0x8a6a4a), 0, 1.25, -0.97));
  scene.add(box(0.5, 0.42, 0.35, M(0x6b4a2b), -0.6, 0.21, -0.7)); // stool
  const hook = box(0.04, 0.04, 0.12, M(0x9aa1a8), 0.75, 1.8, -0.9); scene.add(hook);
  // curtain rail + curtain pulled to the left
  scene.add(box(2.0, 0.04, 0.04, M(0x9aa1a8), 0, 2.45, 1.0)); const curtain = new THREE.Group(); scene.add(curtain); for (let i = 0; i < 5; i++) curtain.add(box(0.1, 2.3, 0.06, M(i % 2 ? 0x8b1e2d : 0x9f2a39), -0.85 + i * 0.06, 1.3, 1.0 + (i % 2) * 0.05));
  // shop floor behind the camera side: rails of clothes
  for (let k = 0; k < 2; k++) { const rx = -2.2 + k * 4.4; scene.add(box(1.4, 0.04, 0.04, M(0x9aa1a8), rx, 1.6, 2.6)); for (let i = 0; i < 8; i++) { const c = box(0.05, 0.75, 0.4, M([0xc0392b, 0x2980b9, 0xf1c40f, 0x7f8c8d, 0x8e44ad, 0x16a085][i % 6]), rx - 0.6 + i * 0.17, 1.2, 2.6); scene.add(c); } }
  scene.add(box(12, 3.2, 0.1, M(0xd9d2c4), 0, 1.6, -1.1));
  const dave = makeDave(); scene.add(dave.g);
  const jumper = makeJumper(); scene.add(jumper);
  const folded = box(0.34, 0.08, 0.26, FAB(0x3f8f5a, 'knit'), 0, 0, 0); scene.add(folded);
  const asst = new Person({ seed: 91, shirt: 0x2c3e50, pants: 0x2c3e50, hairStyle: 'long', hair: 0x3a2618, skin: 0xc68e62 }); asst.g.position.set(1.55, 0, 1.6); asst.g.rotation.y = -0.6; scene.add(asst.g);
  const zip = box(0.05, 0.08, 0.03, M(0xd8c060), 0, 0, 0); scene.add(zip);
  const tmp = new THREE.Vector3();
  S.update = (t, c) => {
    S.setSky(0);
    const st = c.stuck ?? 1, fly = c.fly ?? 0;
    dave.g.position.set(0, 0, -0.1); dave.g.rotation.y = 0; dave.pose('stand', t); dave.neck.rotation.set(0, 0, 0);
    const up = st * (1 - smooth(fly * 3));
    dave.armL.rotation.x = lerp(0, -2.95, up); dave.armR.rotation.x = lerp(0, -2.95, up); dave.armL.rotation.z = lerp(0.06, 0.2, up); dave.armR.rotation.z = lerp(-0.06, -0.2, up);
    if (c.tug) { const w = Math.sin(t * 7); dave.torso.rotation.z = w * 0.07; dave.armL.rotation.x += w * 0.08; dave.armR.rotation.x -= w * 0.08; dave.hips.position.y = 0.86 + Math.abs(w) * 0.02; }
    if (c.daveLook === 'down') dave.neck.rotation.x = 0.35; if (c.daveLook === 'cam') dave.neck.rotation.x = 0.0;
    eyes(dave, c.wide ?? 0); dave.mouth.scale.y = c.smile ? 1.4 : 1;
    // jumper over head
    dave.g.updateMatrixWorld(true); dave.neck.getWorldPosition(tmp);
    if (fly <= 0) { jumper.visible = st > 0.01 && !c.folded; jumper.position.set(tmp.x, tmp.y + 0.62, tmp.z); jumper.rotation.set(0, 0, 0); jumper.children[0].visible = true; }
    else { const f = easeOut(fly); jumper.visible = fly < 1; jumper.position.set(tmp.x + 0.5 * f, tmp.y + 0.62 + 1.2 * f - 1.6 * fly * fly, tmp.z + 0.9 * f); jumper.rotation.set(f * 3, f * 2, f * 4); }
    folded.visible = !!c.folded; if (c.folded) { dave.armL.rotation.x = -0.9; dave.armR.rotation.x = -0.9; dave.armL.rotation.z = 0.35; dave.armR.rotation.z = -0.35; dave.g.updateMatrixWorld(true); dave.armL.children[1].getWorldPosition(tmp); const a = tmp.clone(); dave.armR.children[1].getWorldPosition(tmp); a.add(tmp).multiplyScalar(0.5); folded.position.set(a.x, a.y + 0.03, a.z); }
    // assistant with a stuck zip
    asst.pose('stand', t); const zp = c.assistant === 'zip'; asst.g.visible = c.assistant !== 'none';
    asst.armR.rotation.x = zp ? -0.9 : 0; asst.armR.rotation.z = zp ? -0.7 : -0.06; asst.armL.rotation.x = zp ? -0.6 : 0; asst.armL.rotation.z = zp ? 0.5 : 0.06; asst.neck.rotation.x = zp ? 0.45 : 0;
    if (zp && c.zipTug) asst.armR.rotation.x += Math.sin(t * 9) * 0.1;
    asst.g.updateMatrixWorld(true); asst.armR.children[1].getWorldPosition(tmp); zip.position.copy(tmp); zip.visible = zp; eyes(asst, zp ? 0.6 : 0);
  };
  S.actors = { dave, jumper, asst };
  return S;
}

// =============== STREET: cars braking ===============
// ctx: carT (seconds since braking started, <0 = cruising), brake (bool), groan (bool)
export function buildBrakeStreet() {
  const S = buildStreet(); const { scene } = S; const { lionA, lionB, cat, hole, splinters, flap } = S.actors;
  [lionA.g, lionB.g, cat.g, hole, splinters, flap].forEach(o => o.visible = false);
  scene.add(plane(60, 4, M(0x9a9a96), 0, 0.005, 16)); scene.add(box(60, 0.12, 0.2, M(0xb0b0ac), 0, 0.06, 13.95)); scene.add(plane(60, 8, M(0x6aa64e), 0, 0.003, 22));
  const cars = []; const cols = [0xd9534f, 0x3b6fb6, 0xf2c14e, 0x4e8f5a];
  for (let i = 0; i < 4; i++) { const c = makeCar(200 + i, { color: cols[i] }); c.rotation.y = Math.PI / 2; scene.add(c); cars.push(c); }
  const puffs = []; for (let i = 0; i < 12; i++) { const p = softSprite(0x8a8a8a, 0.6, 0.5); scene.add(p); puffs.push(p); }
  const marks = []; for (let i = 0; i < 4; i++) { const m = box(1, 0.005, 0.12, M(0x1b1b1b), 0, 0.006, 0, false); scene.add(m); marks.push(m); }
  const pax = new Person({ seed: 95, shirt: 0xe67e22 }); scene.add(pax.g); pax.g.scale.setScalar(0.8);
  const v0 = 13.9; const dBrake = 7; const a = v0 * v0 / (2 * dBrake); const tStop = v0 / a;
  S.update = (t, c) => {
    S.setSky(0); const ct = c.carT ?? -10;
    cars.forEach((car, i) => {
      const gap = 9; const x0 = -2 - i * gap; let x;
      if (ct < 0) x = x0 + v0 * ct; else { const tt = Math.min(ct, tStop); x = x0 + v0 * tt - 0.5 * a * tt * tt; }
      car.position.set(x, 0, 11); const decel = ct >= 0 && ct < tStop; car.rotation.z = decel ? -0.05 : 0; car.position.y = decel ? 0.03 : 0;
      const m = marks[i]; m.visible = ct >= 0; if (ct >= 0) { const tt = Math.min(ct, tStop); const xs = x0, xe = x0 + v0 * tt - 0.5 * a * tt * tt; m.scale.x = Math.max(0.01, xe - xs); m.position.set((xs + xe) / 2 - 1.2, 0.006, 11.3); }
      if (c.groan) car.position.y = Math.sin(t * 40 + i) * 0.015;
    });
    puffs.forEach((p, k) => { const car = cars[k % 4]; const ph = ((t * 1.3 + k * 0.27) % 1); p.visible = !!c.groan; p.position.set(car.position.x - 2.3 - ph * 1.5, 0.35 + ph * 0.6, 11.3 + (k % 2) * 0.2); p.material.opacity = 0.5 * (1 - ph); p.scale.setScalar(0.4 + ph * 1.2); });
    // passenger lurching forward in the lead car
    const car0 = cars[0]; pax.g.position.set(car0.position.x + 0.2, 0.25, 10.85); pax.g.rotation.y = Math.PI / 2; pax.pose('sit', t); const lur = ct >= 0 && ct < tStop + 0.5 ? Math.sin(prog(ct, 0, tStop + 0.5) * Math.PI) : 0; pax.torso.rotation.x = 0.5 * lur; eyes(pax, lur);
  };
  S.tStop = tStop;
  return S;
}

// =============== FOOTBALL PITCH ===============
// ctx: kickT (seconds since kick), halfRoll (bool: friction doubled)
export function buildPitch() {
  const S = baseSet({ shadowExtent: 30, fogNear: 60, fogFar: 400, shadowRes: 2048 }); const { scene } = S; const ST = new THREE.Group(); scene.add(ST);
  const gT = grassTex(); gT.repeat.set(40, 40); const ground = plane(200, 200, texMat({ map: gT }), 0, 0, 0); ground.receiveShadow = true; scene.add(ground);
  for (let i = 0; i < 8; i++) { const s = plane(6, 60, M(i % 2 ? 0x5f9a45 : 0x6aa64e), -21 + i * 6, 0.01, -10); ST.add(s); }
  ST.add(plane(0.12, 60, M(0xffffff), 0, 0.02, -10)); ST.add(plane(60, 0.12, M(0xffffff), 0, 0.02, -38));
  // goal at z=-38
  const goal = new THREE.Group(); goal.position.set(0, 0, -38); ST.add(goal); for (const sx of [-3.66, 3.66]) goal.add(cyl(0.06, 0.06, 2.44, M(0xffffff), 8, sx, 1.22, 0)); const bar = box(7.4, 0.12, 0.12, M(0xffffff), 0, 2.44, 0); goal.add(bar); goal.add(box(7.4, 2.44, 0.02, M(0xdddddd, { transparent: true, opacity: 0.35 }), 0, 1.22, -1.2));
  for (let i = 0; i < 12; i++) { const tr = makeTree(300 + i); tr.position.set(-40 + i * 7, 0, -60 - (i % 3) * 6); ST.add(tr); }
  bakeStatic(ST, scene);
  const ball = new THREE.Group(); scene.add(ball); ball.add(ico(0.11, M(0xffffff), 1, 0, 0, 0)); for (let i = 0; i < 6; i++) { const p = ico(0.04, M(0x111111), 0, Math.cos(i) * 0.09, Math.sin(i * 1.7) * 0.07, Math.sin(i) * 0.07, false); ball.add(p); }
  const kicker = new Person({ seed: 120, shirt: 0xc0392b, pants: 0xffffff }); kicker.g.position.set(0.3, 0, 2.0); kicker.g.rotation.y = Math.PI; scene.add(kicker.g);
  const keeper = new Person({ seed: 121, shirt: 0x27ae60, pants: 0x111111 }); keeper.g.position.set(0, 0, -36.5); scene.add(keeper.g);
  // ball rolls 20 m (would be 40) with constant deceleration
  const D = 20, v0 = 9.0; const a = v0 * v0 / (2 * D); const T = v0 / a;
  S.update = (t, c) => {
    S.setSky(0); const k = c.kickT ?? -1;
    kicker.pose(k < 0 ? 'stand' : 'stand', t); if (k > -0.4 && k < 0.3) { kicker.legR.rotation.x = k < 0 ? 0.6 : -0.9; }
    let d = 0; if (k > 0) { const tt = Math.min(k, T); d = v0 * tt - 0.5 * a * tt * tt; }
    ball.position.set(0.3, 0.11, 1.2 - d); ball.rotation.x = -d / 0.11;
    keeper.pose('stand', t); keeper.armL.rotation.z = 0.5; keeper.armR.rotation.z = -0.5; if (c.credit) { keeper.armL.rotation.x = -2.8; keeper.armR.rotation.x = -2.8; keeper.armL.rotation.z = 0.3; keeper.armR.rotation.z = -0.3; }
  };
  S.ball = ball; return S;
}
