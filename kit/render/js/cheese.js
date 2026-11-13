import * as THREE from 'three';
import { box, cyl, ico, cone, plane, rng, lerp, clamp, smooth, easeOut, easeIn, prog, emis, mat, canvasTex, texMat, checkerTex, bakeStatic, softSprite, glowSprite, grassTex, asphaltTex, mulberry32, makeStars } from './util.js';
import { M, Person, makeCar, makeTree, makeLamp, makeCup, makeSmoke, updateSmoke, makeBuilding, makeClockTower, makeFerrisWheel, makeEarth, makeBench } from './kit.js';
import { baseSet, buildSpace } from './sets.js';
import { makeDave, makePriya, buildOcean } from './water.js';
import { buildCity } from './world.js';
import { lbl, face } from './height.js';

// ============================================================ MOON TEXTURE (rock / cheese / biscuit) ============================================================
const HOLES = (() => { const r = rng(1212); const h = []; for (let i = 0; i < 64; i++) { const u = r.f(), v = 0.12 + r.f() * 0.76; const rad = r.range(0.012, 0.05); h.push({ u, v, r: rad, ph: r.f() }); } return h; })();
const MARE = (() => { const r = rng(77); const m = []; for (let i = 0; i < 9; i++) m.push({ u: r.f(), v: 0.25 + r.f() * 0.5, rx: r.range(0.04, 0.11), ry: r.range(0.03, 0.07) }); return m; })();
const CRACKS = (() => { const r = rng(31); const c = []; for (let i = 0; i < 26; i++) { const pts = [[r.f(), 0.1 + r.f() * 0.8]]; for (let k = 0; k < 6; k++) { const p = pts[pts.length - 1]; pts.push([p[0] + r.range(-0.03, 0.03), p[1] + r.range(-0.03, 0.03)]); } c.push(pts); } return c; })();
const lerpC = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), clamp(t, 0, 1)).getHexString();
// returns {tex, draw(state)} ; state: cheese 0..1, biscuit 0..1, melt 0..1, meltU (centre longitude 0..1 of the melted band), vent 0..1, dark 0..1
export function moonTexture(W = 1024, H = 512) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
  let last = '';
  function draw(s = {}) {
    const ch = clamp(s.cheese ?? 0, 0, 1), bi = clamp(s.biscuit ?? 0, 0, 1), me = clamp(s.melt ?? 0, 0, 1), dk = clamp(s.dark ?? 0, 0, 1);
    const key = [ch, bi, me, s.meltU ?? 0, dk].map(x => Math.round(x * 50)).join(',');
    if (key === last) return; last = key;
    const base = lerpC(lerpC('#8e8e88', '#f1c44e', ch), '#b6762c', bi); const base2 = lerpC(lerpC('#7a7a74', '#e2ad32', ch), '#8f5a22', bi);
    ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
    // mottling
    const r = mulberry32(5); for (let i = 0; i < 400; i++) { ctx.globalAlpha = 0.12; ctx.fillStyle = r() < 0.5 ? base2 : '#ffffff'; const x = r() * W, y = r() * H, w = 6 + r() * 40; ctx.fillRect(x, y, w, w * 0.4); } ctx.globalAlpha = 1;
    // mare (rock only)
    if (ch < 1) { ctx.globalAlpha = 0.45 * (1 - ch); ctx.fillStyle = '#5a5b5c'; MARE.forEach(m => { ctx.beginPath(); ctx.ellipse(m.u * W, m.v * H, m.rx * W, m.ry * H, 0, 0, 6.283); ctx.fill(); }); ctx.globalAlpha = 1; }
    // melted band (dayside) and set-fat band (night side)
    if (me > 0.01) {
      const mu = ((s.meltU ?? 0.25) % 1 + 1) % 1; const bw = 0.22;
      for (const off of [-1, 0, 1]) { const x0 = (mu - bw + off) * W, x1 = (mu + bw + off) * W; const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, 'rgba(255,140,40,0)'); g.addColorStop(0.3, `rgba(255,150,50,${0.75 * me})`); g.addColorStop(0.7, `rgba(255,170,60,${0.75 * me})`); g.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = g; ctx.fillRect(x0, 0, x1 - x0, H); }
      // glossy streaks
      ctx.globalAlpha = 0.5 * me; ctx.fillStyle = '#fff3c0'; const rr = mulberry32(9); for (let i = 0; i < 40; i++) { const x = ((mu + rr() * 0.4 - 0.2) % 1 + 1) % 1 * W, y = rr() * H; ctx.fillRect(x, y, 3 + rr() * 8, 20 + rr() * 60); } ctx.globalAlpha = 1;
      // set fat band on the opposite side: pale ridges
      const su = (mu + 0.5) % 1; for (const off of [-1, 0, 1]) { const x0 = (su - 0.2 + off) * W, x1 = (su + 0.2 + off) * W; const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, 'rgba(255,245,220,0)'); g.addColorStop(0.5, `rgba(255,245,220,${0.7 * me})`); g.addColorStop(1, 'rgba(255,245,220,0)'); ctx.fillStyle = g; ctx.fillRect(x0, 0, x1 - x0, H); ctx.strokeStyle = `rgba(200,170,110,${0.6 * me})`; ctx.lineWidth = 3; for (let y = 20; y < H; y += 26) { ctx.beginPath(); for (let x = x0; x <= x1; x += 12) ctx.lineTo(x, y + Math.sin(x * 0.05 + y) * 5); ctx.stroke(); } }
    }
    // holes / craters
    HOLES.forEach((h, i) => {
      const x = h.u * W, y = h.v * H, rad = h.r * W * (1 - 0.25 * bi);
      for (const off of [-W, 0, W]) {
        const cx = x + off;
        if (ch < 1) { // crater: dark floor + light rim
          ctx.globalAlpha = 1 - ch; ctx.fillStyle = '#6c6c68'; ctx.beginPath(); ctx.arc(cx, y, rad, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#b4b4ae'; ctx.lineWidth = rad * 0.22; ctx.beginPath(); ctx.arc(cx, y, rad * 1.05, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1;
        }
        if (ch > 0) { // cheese hole: dark inner with warm shading, highlight crescent
          ctx.globalAlpha = ch; const g = ctx.createRadialGradient(cx - rad * 0.3, y - rad * 0.3, rad * 0.1, cx, y, rad); g.addColorStop(0, lerpC('#8a6416', '#5a3a12', bi)); g.addColorStop(0.75, lerpC('#b8871f', '#7a4e18', bi)); g.addColorStop(1, lerpC('#d9a62c', '#9a6324', bi)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, y, rad, 0, 6.283); ctx.fill();
          ctx.strokeStyle = `rgba(255,240,180,${0.55 * (1 - bi)})`; ctx.lineWidth = rad * 0.16; ctx.beginPath(); ctx.arc(cx, y, rad * 0.98, 3.4, 5.6); ctx.stroke(); ctx.globalAlpha = 1;
        }
      }
    });
    // biscuit: docker dots and cracks
    if (bi > 0.01) {
      ctx.globalAlpha = 0.6 * bi; ctx.fillStyle = '#6a3f14'; for (let gx = 0; gx < W; gx += 34) for (let gy = 17; gy < H; gy += 34) { ctx.beginPath(); ctx.arc(gx + (Math.floor(gy / 34) % 2) * 17, gy, 4, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = Math.min(1, bi * 1.2); ctx.strokeStyle = '#3a2208'; ctx.lineWidth = 5; CRACKS.forEach((pts, i) => { if (i / CRACKS.length > bi * 1.15) return; ctx.beginPath(); pts.forEach(([u, v], k) => { const X = u * W, Y = v * H; k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); });
      // toasted edges: darker blotches
      const rr = mulberry32(21); ctx.globalAlpha = 0.35 * bi; ctx.fillStyle = '#5a3210'; for (let i = 0; i < 60; i++) { ctx.beginPath(); ctx.ellipse(rr() * W, rr() * H, 20 + rr() * 60, 10 + rr() * 30, rr() * 3, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (dk > 0.01) { ctx.globalAlpha = dk * 0.5; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    tex.needsUpdate = true;
  }
  draw({}); return { tex, draw, canvas: c };
}
// sphere with dimples at the hole positions
function dimpledSphere(R, segs = 128, rings = 80, depth = 0.06) {
  const g = new THREE.SphereGeometry(R, segs, rings); const p = g.attributes.position; const uv = g.attributes.uv; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { const u = uv.getX(i), vv = 1 - uv.getY(i); let d = 0; for (const h of HOLES) { let du = Math.abs(u - h.u); du = Math.min(du, 1 - du); du *= Math.cos((vv - 0.5) * Math.PI) * 2; const dv = (vv - h.v) * 1.0; const dist = Math.hypot(du, dv); if (dist < h.r) d = Math.max(d, (1 - (dist / h.r) ** 2)); } v.fromBufferAttribute(p, i); v.multiplyScalar(1 - depth * d); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
function makeCamera() { const g = new THREE.Group(); const dark = M(0x2a2a2e); for (let i = 0; i < 3; i++) { const a = i * 2.094; const leg = cyl(0.015, 0.02, 1.3, M(0x3a3a3e), 6, Math.sin(a) * 0.22, 0.6, Math.cos(a) * 0.22); leg.rotation.z = Math.sin(a) * 0.33; leg.rotation.x = -Math.cos(a) * 0.33; g.add(leg); } g.add(cyl(0.04, 0.04, 0.2, dark, 8, 0, 1.3, 0)); const body = box(0.26, 0.17, 0.14, dark, 0, 1.46, 0); g.add(body); const lens = cyl(0.06, 0.07, 0.16, M(0x111111), 12, 0, 1.46, 0.14); lens.rotation.x = Math.PI / 2; g.add(lens); g.add(cyl(0.05, 0.05, 0.01, M(0x3355aa), 12, 0, 1.46, 0.225)); g.children[g.children.length - 1].rotation.x = Math.PI / 2; const screen = plane(0.16, 0.1, emis(0x202830, 0.6), 0, 1.46, -0.071, 0); screen.rotation.y = Math.PI; g.add(screen); g.add(box(0.05, 0.03, 0.05, M(0x444), 0.08, 1.56, 0)); const fl = glowSprite(0xffffff, 1.6, 0); fl.position.set(0, 1.5, 0.3); g.add(fl); g.userData = { flash: fl, screen }; return g; }
function makeAstronaut(seed = 5) { const p = new Person({ seed, shirt: 0xf2f2f2, pants: 0xf2f2f2, skin: 0xf1c9a5, hair: 0x4a2f1f, hairStyle: 'bald', scale: 1.0 }); const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), mat(0xffd27a, { transparent: true, opacity: 0.45 })); helmet.position.set(0, 0.19, 0.02); p.neck.add(helmet); const ring = cyl(0.14, 0.14, 0.06, M(0xcfd3d8), 12, 0, -0.03, 0); p.neck.add(ring); p.torso.add(box(0.36, 0.44, 0.18, M(0xd8dde2), 0, 0.3, -0.2)); p.torso.add(box(0.1, 0.1, 0.1, M(0x2b5c9e), 0.15, 0.4, 0.14)); [p.legL, p.legR].forEach(l => l.userData.knee.children[1].scale.set(1.3, 1.6, 1.2)); return p; }
function cheeseStrings(n = 6) { const g = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 8, 20), M(0xe2ad32)); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.02, 0.05); g.add(ring); for (let i = 0; i < n; i++) { const s = cyl(0.025, 0.035, 1, M(0xf1c44e), 6, 0, 0.5, 0); s.geometry.translate(0, 0, 0); s.userData = { a: i * 1.05, r: 0.1 + (i % 3) * 0.05 }; g.add(s); } g.visible = false; return g; }

// ============================================================ HILL (Dave photographs the Moon, dusk, city skyline) ============================================================
// ctx: moon ('rock'|'cheese'|'biscuit'), bright 0..1, dave ('shoot'|'look'|'cam'|'shrug'|'press'|'knob'|'screen'), priya ('point'|'card'|'face'|'look'|'card2'), flashK 0..1, wide/open/smile, shield
export function buildHill() {
  const S = baseSet({ shadowExtent: 14, fogNear: 200, fogFar: 1400, shadowRes: 2048 });
  const { scene } = S; const r = rng(55); const ST = new THREE.Group(); scene.add(ST); S.sunOffset = new THREE.Vector3(-60, 40, -30); S.sun.intensity = 1.1;
  // hill: ground with a bump; grass texture
  const gg = new THREE.PlaneGeometry(900, 900, 80, 80); const pa = gg.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); const d = Math.hypot(x, y); pa.setZ(i, 14 * Math.exp(-d * d / 7000) - 14 + Math.sin(x * 0.03) * 0.6 * smooth(d / 40)); } gg.computeVertexNormals();
  const gT = grassTex(2); gT.repeat.set(70, 70); const ground = new THREE.Mesh(gg, texMat({ map: gT, color: 0x6f9a5a })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // path up the hill
  const path = plane(2.2, 60, M(0xb9a98a), 3, 0.02, 10); path.rotation.z = 0.1; scene.add(path);
  // skyline (far, below the hill), windows lit
  for (let i = 0; i < 70; i++) { const w = r.range(12, 26), h = r.range(18, 70), d = r.range(12, 22); const b = makeBuilding(w, h, d, 2000 + i, { litRatio: 0.55, lit: '#ffe2a0' }); b.position.set(-420 + i * 12.5 + r.range(-5, 5), -14.5, -260 - r.range(0, 160)); b.scale.setScalar(1.3); scene.add(b); }
  for (let i = 0; i < 12; i++) { const h = r.range(90, 170); const b = makeBuilding(r.range(16, 26), h, r.range(16, 26), 2100 + i, { base: '#8fb0cf', lit: '#dff1ff', litRatio: 0.6 }); b.position.set(30 + i * 24 + r.range(-6, 6), -14.5, -360 - r.range(0, 120)); b.scale.setScalar(1.3); scene.add(b); }
  const tower = makeClockTower(); tower.position.set(-110, -14.5, -300); tower.scale.setScalar(1.4); ST.add(tower); const wheel = makeFerrisWheel(32); wheel.position.set(140, -14.5, -330); wheel.scale.setScalar(1.5); ST.add(wheel);
  for (let i = 0; i < 90; i++) { const t = makeTree(1500 + i, r.f() < 0.3 ? 'tall' : 'plane'); const a = r.f() * 6.283, d = 26 + r.range(0, 120); t.position.set(Math.cos(a) * d, -14 + 14 * Math.exp(-d * d / 7000) - 0.4, Math.sin(a) * d); t.scale.setScalar(r.range(1.1, 1.8)); if (Math.abs(Math.sin(a)) > 0.3 || Math.cos(a) > 0) ST.add(t); }
  [[-7, 4], [8, 5], [-4, -7]].forEach(([x, z]) => { const l = makeLamp(); l.position.set(x, 0, z); ST.add(l); });
  // bench with a couple, dog walker
  const bench = makeBench(); bench.position.set(-5.5, 0, 1.5); bench.rotation.y = 0.5; ST.add(bench);
  const c1 = new Person({ seed: 801, shirt: 0x4a7fb5 }); c1.g.position.set(-5.9, 0.02, 1.9); c1.g.rotation.y = 0.5; c1.pose('sit'); scene.add(c1.g); const c2 = new Person({ seed: 802, dress: true, hairStyle: 'long', shirt: 0x9b7bb8 }); c2.g.position.set(-5.1, 0.02, 1.5); c2.g.rotation.y = 0.5; c2.pose('sit'); scene.add(c2.g);
  const walker = new Person({ seed: 803, shirt: 0xf2c14e }); walker.g.position.set(7, 0, 4); scene.add(walker.g);
  const dog = new THREE.Group(); dog.add(box(0.55, 0.3, 0.25, M(0xc8a26b), 0, 0.4, 0)); dog.add(ico(0.14, M(0xc8a26b), 0, 0.33, 0.55, 0)); for (const sx of [-0.2, 0.2]) for (const sz of [-0.08, 0.08]) dog.add(box(0.07, 0.3, 0.07, M(0xc8a26b), sx, 0.15, sz)); scene.add(dog);
  // the Moon (big, cinematic) + glow
  const MT = moonTexture(1024, 512); const moon = new THREE.Mesh(new THREE.SphereGeometry(58, 48, 32), new THREE.MeshBasicMaterial({ map: MT.tex })); moon.position.set(-150, 190, -520); moon.rotation.y = 2.2; scene.add(moon);
  const moonGlow = glowSprite(0xfff3c4, 220, 0.35); moonGlow.position.copy(moon.position); scene.add(moonGlow);
  const moonLight = new THREE.DirectionalLight(0xdfe8ff, 0.9); moonLight.position.copy(moon.position.clone().normalize().multiplyScalar(60)); scene.add(moonLight); scene.add(moonLight.target);
  // Dave at the tripod, Priya with the card
  const dave = makeDave(); dave.g.position.set(0, 0, 0); dave.g.rotation.y = Math.PI + 0.35; scene.add(dave.g);
  const camG = makeCamera(); camG.position.set(-0.55, 0, -0.75); camG.rotation.y = 0.35; scene.add(camG); camG.rotation.x = -0.25;
  const priya = makePriya(); priya.g.position.set(1.15, 0, -0.1); priya.g.rotation.y = Math.PI - 0.4; scene.add(priya.g);
  const cardTex = cardCanvas(); const card = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.21), new THREE.MeshLambertMaterial({ map: cardTex.tex, side: THREE.DoubleSide })); card.position.set(0.02, -0.62, 0.12); card.rotation.x = -1.2; priya.armL.add(card);
  const flashSprite = camG.userData.flash;
  bakeStatic(ST, scene);
  S.actors = { dave, priya, camG, moon, MT, card, cardTex };
  let lastMoon = '';
  S.update = (t, c) => {
    const br = c.bright ?? 0; S.setSky(0.82 - 0.25 * br); S.hemi.intensity = 0.95 + 1.2 * br; S.sun.intensity = 1.1 + 1.6 * br; moonLight.intensity = 0.9 + 2.5 * br;
    const mk = c.moon ?? 'rock'; if (mk !== lastMoon) { lastMoon = mk; MT.draw({ cheese: mk === 'rock' ? 0 : 1, biscuit: mk === 'biscuit' ? 1 : 0 }); }
    moon.material.color.setHex(mk === 'rock' ? 0xcfd0d2 : 0xffffff); if (c.moonPos === 'cam') moon.position.set(560, 215, 30); else moon.position.set(-210, 150, -520); moonGlow.position.copy(moon.position); moonLight.position.copy(moon.position.clone().normalize().multiplyScalar(60)); moonGlow.material.opacity = (mk === 'rock' ? 0.25 : 0.45) + 0.5 * br; moonGlow.scale.setScalar(220 + 160 * br + (mk === 'rock' ? 0 : 20));
    cardTex.draw(c.card ?? 'blank');
    // crowd
    c1.pose('sit'); c2.pose('sit'); [c1, c2].forEach(p => { p.neck.rotation.x = -0.45; if (c.shield) { p.armR.rotation.x = -2.6; p.armR.rotation.z = -0.2; } }); c2.neck.rotation.y = 0.3;
    walker.g.position.set(7 - ((t * 1.1) % 16), 0, 4 + Math.sin(t * 0.3) * 0.5); walker.g.rotation.y = -Math.PI / 2; walker.pose('walk', t); if (c.shield) { walker.pose('shield'); } dog.position.set(walker.g.position.x - 0.9, 0, walker.g.position.z + 0.5); dog.rotation.y = -Math.PI / 2; dog.rotation.x = Math.sin(t * 8) * 0.05;
    // Dave
    const dm = c.dave ?? 'shoot'; dave.pose('stand', t); dave.g.position.set(0, 0, 0); dave.g.rotation.y = Math.PI + 0.35;
    if (dm === 'shoot' || dm === 'press') { dave.torso.rotation.x = 0.42; dave.neck.rotation.x = -0.25; dave.armL.rotation.x = -1.35; dave.armL.rotation.z = 0.25; dave.armR.rotation.x = -1.2; dave.armR.rotation.z = -0.1; if (dm === 'press') { dave.armR.rotation.x = -1.5 + Math.sin(t * 20) * 0.03; } }
    else if (dm === 'look') { dave.neck.rotation.x = -0.6; dave.armL.rotation.x = -0.1; dave.armR.rotation.x = -0.1; }
    else if (dm === 'cam') { dave.g.rotation.y = -Math.PI * 0.5 - 0.2; dave.neck.rotation.x = -0.05; dave.neck.rotation.y = 0.1; }
    else if (dm === 'tilt') { dave.g.rotation.y = -Math.PI * 0.5 - 0.2; dave.neck.rotation.z = 0.28; dave.neck.rotation.x = 0.05; dave.armL.rotation.z = 0.5; dave.armR.rotation.z = -0.5; dave.armL.rotation.x = -0.3; dave.armR.rotation.x = -0.3; }
    else if (dm === 'shrug') { dave.g.rotation.y = -Math.PI * 0.5 - 0.2; dave.armL.rotation.z = 0.8; dave.armR.rotation.z = -0.8; dave.armL.rotation.x = -0.5; dave.armR.rotation.x = -0.5; dave.neck.rotation.z = 0.2; }
    else if (dm === 'knob') { dave.torso.rotation.x = 0.3; dave.neck.rotation.x = 0.1; dave.armR.rotation.x = -1.3 + Math.sin(t * 6) * 0.15; dave.armR.rotation.z = -0.2; dave.armL.rotation.x = -0.9; }
    else if (dm === 'screen') { dave.torso.rotation.x = 0.2; dave.neck.rotation.x = 0.55; dave.armL.rotation.x = -1.5; dave.armL.rotation.z = 0.3; dave.armR.rotation.x = -1.5; dave.armR.rotation.z = -0.3; dave.g.rotation.y = -Math.PI * 0.5 - 0.2; }
    face(dave, { wide: c.wide ?? 0, open: c.open ?? 0, smile: !!c.smile });
    // Priya
    const pm = c.priya ?? 'card'; priya.pose('stand', t + 1.3); priya.g.rotation.y = Math.PI - 0.4;
    if (pm === 'point') { priya.armR.rotation.x = -2.4; priya.armR.rotation.z = -0.2; priya.neck.rotation.x = -0.5; priya.armL.rotation.x = -0.9; priya.armL.rotation.z = 0.4; }
    else if (pm === 'card') { priya.armL.rotation.x = -1.4; priya.armL.rotation.z = 0.35; priya.armR.rotation.x = -1.3; priya.armR.rotation.z = -0.4; priya.neck.rotation.x = 0.35; priya.neck.rotation.y = -0.1; }
    else if (pm === 'face') { priya.armL.rotation.x = -2.5; priya.armL.rotation.z = 0.5; priya.armR.rotation.x = -2.5; priya.armR.rotation.z = -0.5; priya.neck.rotation.x = -0.4; }
    else if (pm === 'look') { priya.neck.rotation.x = -0.55; priya.armL.rotation.x = -0.6; priya.armL.rotation.z = 0.3; }
    else if (pm === 'cam') { priya.g.rotation.y = Math.PI * 0.5 - 0.2; priya.armL.rotation.x = -1.4; priya.armL.rotation.z = 0.35; priya.neck.rotation.x = 0.0; priya.neck.rotation.y = 0.1; }
    face(priya, { wide: c.pwide ?? 0, open: c.popen ?? 0, smile: !!c.psmile });
    const fk = c.flashK ?? 0; flashSprite.material.opacity = fk; flashSprite.scale.setScalar(1.6 + fk * 3);
    camG.userData.screen.material.emissiveIntensity = c.card === 'white' ? 2.0 : 0.6; camG.userData.screen.material.color.setHex(c.card === 'white' ? 0xffffff : 0x202830); camG.userData.screen.material.emissive.setHex(c.card === 'white' ? 0xffffff : 0x202830);
  };
  return S;
}

// ============================================================ CARD (wedding invitation canvas) ============================================================
function cardCanvas() {
  const c = document.createElement('canvas'); c.width = 768; c.height = 540; const ctx = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.LinearFilter; let last = '';
  function draw(variant = 'blank', k = 1) {
    const key = variant + Math.round(k * 20); if (key === last) return; last = key;
    ctx.fillStyle = '#f6efe0'; ctx.fillRect(0, 0, 768, 540); ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 6; ctx.strokeRect(22, 22, 724, 496);
    ctx.fillStyle = '#2b2d3a'; ctx.textAlign = 'center'; ctx.font = 'italic 54px serif'; ctx.fillText('Priya & Dave', 384, 92); ctx.font = '26px serif'; ctx.fillText('are getting married', 384, 132); ctx.font = 'bold 30px serif'; ctx.fillText('Saturday 14th June · 2 pm', 384, 480);
    const cx = 384, cy = 300, R = 118;
    if (variant === 'blank') { ctx.setLineDash([12, 10]); ctx.strokeStyle = '#8a8f99'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#8a8f99'; ctx.font = 'bold 24px sans-serif'; ctx.fillText('MOON PHOTO HERE', cx, cy - 6); ctx.font = '20px sans-serif'; ctx.fillText('(big, round, romantic — P)', cx, cy + 26); }
    else { // photo: night sky square
      ctx.fillStyle = '#0d1326'; ctx.fillRect(cx - 150, cy - 140, 300, 280); const rr = mulberry32(4); ctx.fillStyle = '#fff'; for (let i = 0; i < 50; i++) { ctx.globalAlpha = 0.3 + rr() * 0.6; ctx.fillRect(cx - 150 + rr() * 300, cy - 140 + rr() * 280, 2, 2); } ctx.globalAlpha = 1;
      if (variant === 'white') { ctx.globalAlpha = k; const g = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 1.3); g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#ffffff'); g.addColorStop(0.75, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.3, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; }
      if (variant === 'biscuit') { ctx.globalAlpha = k; ctx.fillStyle = '#b6762c'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.9, 0, 6.283); ctx.fill(); ctx.fillStyle = '#6a3f14'; for (let gx = -4; gx <= 4; gx++) for (let gy = -4; gy <= 4; gy++) { if (Math.hypot(gx, gy) < 4) { ctx.beginPath(); ctx.arc(cx + gx * 22, cy + gy * 22, 3.5, 0, 6.283); ctx.fill(); } } ctx.strokeStyle = '#3a2208'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 60, cy - 30); ctx.lineTo(cx - 10, cy + 10); ctx.lineTo(cx + 40, cy - 5); ctx.stroke(); ctx.globalAlpha = 1; }
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.strokeRect(cx - 150, cy - 140, 300, 280);
    }
    tex.needsUpdate = true;
  }
  draw('blank'); return { tex, draw, canvas: c };
}
// ctx: variant ('blank'|'white'|'biscuit'), k, thumb
export function buildCard() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x2a2f3a); const cam = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.05, 50);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.0)); const key = new THREE.DirectionalLight(0xfff2e0, 1.5); key.position.set(1.5, 3, 2); key.castShadow = true; scene.add(key);
  const wT = canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = '#4a5464'; ctx.fillRect(0, 0, w, h); const r = mulberry32(2); for (let i = 0; i < 40; i++) { ctx.fillStyle = r() < 0.5 ? '#3f4856' : '#56617a'; ctx.fillRect(0, r() * h, w, 1 + r() * 3); } }); wT.repeat.set(3, 3); const table = plane(6, 6, texMat({ map: wT }), 0, 0, 0); table.receiveShadow = true; scene.add(table);
  const CT = cardCanvas(); const card = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.675), new THREE.MeshLambertMaterial({ map: CT.tex })); card.rotation.x = -Math.PI / 2; card.rotation.z = 0.05; card.position.set(0, 0.006, 0); card.receiveShadow = true; scene.add(card);
  const thumb = ico(0.07, M(0xe0ac7e), 1, 0.46, 0.03, 0.22); thumb.scale.set(1.0, 0.6, 1.6); scene.add(thumb); const finger = box(0.06, 0.04, 0.18, M(0xe0ac7e), 0.52, 0.0, 0.28); scene.add(finger);
  const pen = cyl(0.011, 0.009, 0.4, M(0x2b4c7e), 8, -0.6, 0.012, -0.3); pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.4; scene.add(pen); const mug = makeCup(0xd9534f); mug.scale.setScalar(1.6); mug.position.set(0.75, 0, -0.42); scene.add(mug);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 8, 16), M(0xf5d76e)); ring.rotation.x = Math.PI / 2; ring.position.set(-0.62, 0.01, 0.3); scene.add(ring);
  const S = { scene, cam, key };
  S.update = (t, c) => { CT.draw(c.variant ?? 'blank', clamp(c.k ?? 1, 0, 1)); thumb.visible = finger.visible = c.thumb !== false; };
  return S;
}

// ============================================================ MOON in space (close) ============================================================
// ctx: cheese 0..1, biscuit 0..1, melt 0..1, meltU, rotY, wobble 0..1, vent 0..1, cut (bool), ring (bool), rain 0..1, earth (bool), sunX (-1..1), flash
export function buildMoon() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x02030a); const cam = new THREE.PerspectiveCamera(42, 1080 / 1920, 0.1, 3000);
  const stars = makeStars(1800, 1400, 3); stars.material.opacity = 0.95; stars.material.size = 2.4; scene.add(stars); const stars2 = makeStars(1800, 1400, 4); stars2.rotation.z = Math.PI; stars2.material.opacity = 0.95; stars2.material.size = 2.4; scene.add(stars2);
  const sun = new THREE.DirectionalLight(0xfff6e8, 3.0); sun.position.set(60, 20, 40); scene.add(sun); const ambM = new THREE.AmbientLight(0x2a3a66, 0.45); scene.add(ambM);
  const R = 10; const MT = moonTexture(2048, 1024); const moonMat = new THREE.MeshLambertMaterial({ map: MT.tex }); const moon = new THREE.Mesh(dimpledSphere(R, 160, 100, 0.05), moonMat); scene.add(moon);
  const gloss = glowSprite(0xffe6a0, 9, 0); scene.add(gloss);
  // vents: jets from a few holes
  const jets = []; for (let i = 0; i < 32; i++) { const h = HOLES[i * 2]; const g = new THREE.Group(); for (let k = 0; k < 6; k++) { const s = softSprite(0xffffff, 1.6 + k * 0.6, 0); s.userData = { k }; g.add(s); } const th = h.v * Math.PI, ph = -h.u * Math.PI * 2; const n = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)); g.userData = { n, ph: h.ph }; g.position.copy(n.clone().multiplyScalar(R)); scene.add(g); jets.push(g); }
  // drips (dayside blobs sliding)
  const drips = []; for (let i = 0; i < 40; i++) { const d = ico(0.3 + (i % 3) * 0.1, M(0xf29a2e), 1); d.scale.set(1, 0.5, 1.6); d.userData = { lat: (Math.random() - 0.5) * 2.4, lon0: Math.random() * 6.283, sp: 0.2 + Math.random() * 0.3 }; d.visible = false; scene.add(d); drips.push(d); }
  // cutaway
  const cut = new THREE.Group(); cut.visible = false; scene.add(cut); const half = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48, 0, Math.PI), moonMat); half.rotation.y = Math.PI / 2; cut.add(half);
  const layers = [[R, 0xb98326], [R * 0.93, 0xf1c44e], [R * 0.55, 0xe0a93a], [R * 0.22, 0x7a4e18]]; layers.forEach(([rr, cc], i) => { const d = new THREE.Mesh(new THREE.CircleGeometry(rr, 64), M(cc)); d.rotation.y = -Math.PI / 2; d.position.x = -0.01 * (i + 1); cut.add(d); }); const rr5 = rng(5); for (let i = 0; i < 40; i++) { const a = rr5.f() * 6.283, d = rr5.range(R * 0.25, R * 0.9); const h = new THREE.Mesh(new THREE.CircleGeometry(rr5.range(0.25, 0.7), 12), M(0x9a6a1a)); h.rotation.y = -Math.PI / 2; h.position.set(-0.06, Math.sin(a) * d, Math.cos(a) * d); cut.add(h); }
  const lcore = lbl('CORE · 5,000 ATM', 6.4, 1.05, { bg: '#c0392b', fg: '#ffffff', font: 'bold 60px sans-serif', pw: 1024 }); lcore.position.set(-0.3, -0.2, 0); lcore.rotation.y = -Math.PI / 2; cut.add(lcore);
  const lrind = lbl('RIND · 0 ATM', 5.2, 1.0, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 60px sans-serif', pw: 1024 }); lrind.position.set(-0.3, R * 0.8, 0); lrind.rotation.y = -Math.PI / 2; cut.add(lrind);
  const lmid = lbl('CHEESE · 1,500 ATM', 6.4, 1.0, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 60px sans-serif', pw: 1024 }); lmid.position.set(-0.3, R * 0.42, 0); lmid.rotation.y = -Math.PI / 2; cut.add(lmid);
  const arrows = []; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; const ar = cone(0.4, 1.2, M(0xffffff), 6, 0, Math.sin(a) * R * 0.75, Math.cos(a) * R * 0.75); ar.rotation.x = a + Math.PI / 2; ar.visible = false; cut.add(ar); arrows.push(ar); }
  // measuring ring / bracket
  const ringG = new THREE.Group(); ringG.visible = false; scene.add(ringG); const rr2 = new THREE.Mesh(new THREE.TorusGeometry(R * 1.08, 0.06, 8, 96), new THREE.MeshBasicMaterial({ color: 0xf2c85b })); ringG.add(rr2); const lR = lbl('3,474 KM · UNCHANGED', 6.5, 0.9, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 64px sans-serif', pw: 1024 }); lR.position.set(0, -R * 1.35, 0); ringG.add(lR); for (const s of [-1, 1]) ringG.add(box(0.1, 1.2, 0.1, M(0xf2c85b), s * R * 1.08, -R * 1.2, 0));
  // Earth in the background
  const earth = makeEarth(16); earth.position.set(-60, 14, -90); earth.rotation.z = 0.4; scene.add(earth);
  // micrometeorite streaks + sparks
  const streaks = []; for (let i = 0; i < 24; i++) { const s = box(0.05, 0.05, 2.5, emis(0xffffff, 1.5)); s.userData = { ph: Math.random(), dir: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize() }; s.visible = false; scene.add(s); streaks.push(s); }
  const sparks = []; for (let i = 0; i < 24; i++) { const s = glowSprite(0xffc070, 0.9, 0); scene.add(s); sparks.push(s); }
  const S = { scene, cam, sun, moon, MT, earth };
  S.update = (t, c) => {
    const ch = c.cheese ?? 1, bi = c.biscuit ?? 0, me = c.melt ?? 0;
    MT.draw({ cheese: ch, biscuit: bi, melt: me, meltU: c.meltU ?? 0.25 });
    const sx = c.sunX ?? 1; sun.position.set(60 * sx, 20, 40 * (c.sunZ ?? 1)); sun.intensity = c.sunI ?? 3.0; ambM.intensity = c.amb ?? 0.45; ambM.color.setHex(c.amb > 1 ? 0x8fa0d8 : 0x2a3a66); moon.rotation.y = c.rotY ?? 0.6; const w = c.wobble ?? 0; const ws = 1 + 0.03 * w * Math.sin(t * 28); moon.scale.set(ws, 1 / ws, ws);
    moon.visible = !c.cut; cut.visible = !!c.cut; if (c.cut) { cut.rotation.y = c.cutRot ?? 0.5; arrows.forEach((a, i) => { a.visible = true; const k = 0.75 - 0.08 * Math.abs(Math.sin(t * 3)); const ang = i / 8 * 6.283; a.position.set(-0.4, Math.sin(ang) * R * k, Math.cos(ang) * R * k); }); }
    ringG.visible = !!c.ring; if (c.ring) ringG.rotation.z = Math.sin(t * 0.3) * 0.05;
    gloss.material.opacity = me * 0.55; gloss.position.set(R * 0.62 * sx, R * 0.25, R * 0.72); gloss.scale.setScalar(7 + 2 * Math.sin(t * 2));
    const vk = c.vent ?? 0; jets.forEach((g, i) => { g.visible = vk > 0.01; if (!g.visible) return; const n = g.userData.n.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), moon.rotation.y); g.position.copy(n.clone().multiplyScalar(R * 0.98)); g.children.forEach((s, k) => { const ph = ((t * 0.7 + g.userData.ph + k * 0.2) % 1); s.position.copy(n.clone().multiplyScalar(ph * 7 * vk)); const sc = (0.8 + ph * 3.5) * vk; s.scale.set(sc, sc, 1); s.material.opacity = vk * 0.75 * (1 - ph) * Math.min(1, ph * 5); }); });
    drips.forEach((d, i) => { d.visible = me > 0.05; if (!d.visible) return; const u = d.userData; const lon = u.lon0 + moon.rotation.y - t * u.sp * 0.4; const lat = u.lat; const p = new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)); const dayside = p.clone().normalize().dot(sun.position.clone().normalize()); d.visible = dayside > 0.15 && me > 0.05; d.position.copy(p.multiplyScalar(R * 1.004)); d.lookAt(0, 0, 0); d.scale.set(1, 0.5 + 0.5 * me, 1.6 + 1.2 * me); });
    const rk = c.rain ?? 0; streaks.forEach((s, i) => { s.visible = rk > 0.01; if (!s.visible) return; const ph = ((t * 1.4 + s.userData.ph) % 1); const dir = s.userData.dir; const p = dir.clone().multiplyScalar(R + 1 + (1 - ph) * 30); s.position.copy(p); s.lookAt(0, 0, 0); s.material.opacity = 1; const sp = sparks[i]; sp.position.copy(dir.clone().multiplyScalar(R * 1.02)); sp.material.opacity = ph > 0.9 ? rk * (1 - (ph - 0.9) * 10) * 0.9 : 0; sp.scale.setScalar(0.6 + (ph - 0.9) * 12); });
    earth.visible = c.earth !== false; earth.rotation.y = t * 0.02;
  };
  return S;
}

// ============================================================ MOON SURFACE (astronaut on cheese) ============================================================
// ctx: astro ('stand'|'shield'|'jump'|'sink'|'slip'|'walk'|'wave'), jumpK 0..1, vent 0..1, melt 0..1, night 0..1, rain 0..1, brown 0..1, strings 0..1, earth (bool), lblJump
export function buildSurface() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x02030a); const cam = new THREE.PerspectiveCamera(44, 1080 / 1920, 0.05, 2000);
  const stars = makeStars(1600, 1200, 8); stars.material.opacity = 0.9; stars.material.size = 2.2; scene.add(stars);
  const sun = new THREE.DirectionalLight(0xfff4e0, 3.0); sun.position.set(30, 40, 25); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 200 }); sun.shadow.bias = -0.0005; scene.add(sun); scene.add(sun.target);
  const amb = new THREE.AmbientLight(0x6070a0, 0.35); scene.add(amb); const hemi = new THREE.HemisphereLight(0x8090c0, 0x3a2a10, 0.35); scene.add(hemi);
  // cheese ground with dimples
  const GT = moonTexture(1024, 1024); GT.tex.repeat.set(1, 1);
  const gg = new THREE.PlaneGeometry(160, 160, 160, 160); const pa = gg.attributes.position; const r = rng(99); const pits = []; for (let i = 0; i < 70; i++) pits.push({ x: r.range(-70, 70), z: r.range(-70, 70), r: r.range(1.2, 5), d: r.range(0.3, 1.2) });
  pits.push({ x: 2.6, z: -2.2, r: 2.2, d: 0.9 }); pits.push({ x: -3.2, z: 1.8, r: 1.6, d: 0.7 });
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = -pa.getY(i); let y = Math.sin(x * 0.15) * Math.cos(z * 0.12) * 0.25; for (const p of pits) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r) y -= p.d * (1 - (d / p.r) ** 2); } if (Math.hypot(x, z) < 1.4) y = 0; pa.setZ(i, y); } gg.computeVertexNormals();
  const groundMat = new THREE.MeshLambertMaterial({ map: GT.tex }); const ground = new THREE.Mesh(gg, groundMat); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // horizon hills
  const ST = new THREE.Group(); scene.add(ST); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; const h = ico(r.range(8, 20), M(0xd9ad3a), 1, Math.cos(a) * 90, -6, Math.sin(a) * 90); h.scale.y = 0.45; ST.add(h); }
  // Earth in the sky
  const earth = makeEarth(7); earth.position.set(-26, 30, -70); earth.rotation.z = 0.4; scene.add(earth);
  // lander + flag
  const lander = new THREE.Group(); lander.position.set(-7, 0, -9); scene.add(lander); lander.add(box(2.2, 1.0, 2.2, M(0xd8b03a), 0, 1.6, 0)); lander.add(cyl(0.9, 1.0, 1.1, M(0xe9ecef), 10, 0, 2.6, 0)); for (let i = 0; i < 4; i++) { const a = i * 1.571 + 0.785; const leg = cyl(0.06, 0.06, 2.0, M(0xb8b8b8), 6, Math.cos(a) * 1.6, 0.9, Math.sin(a) * 1.6); leg.rotation.z = Math.cos(a) * 0.5; leg.rotation.x = -Math.sin(a) * 0.5; lander.add(leg); lander.add(cyl(0.35, 0.35, 0.08, M(0xb8b8b8), 10, Math.cos(a) * 2.1, 0.04, Math.sin(a) * 2.1)); }
  const flag = new THREE.Group(); flag.position.set(2.0, 0, -3.5); scene.add(flag); flag.add(cyl(0.03, 0.03, 2.4, M(0xdddddd), 6, 0, 1.2, 0)); const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), new THREE.MeshLambertMaterial({ map: canvasTex(128, 80, (ctx, w, h) => { ctx.fillStyle = '#f2c85b'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#1b1b1b'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('CHEESE', 64, 50); }), side: THREE.DoubleSide })); cloth.position.set(0.46, 2.1, 0); flag.add(cloth);
  // astronaut
  const astro = makeAstronaut(5); astro.g.position.set(0, 0, 0); astro.g.rotation.y = Math.PI * 0.15; scene.add(astro.g);
  const strings = cheeseStrings(7); scene.add(strings);
  const bootPrints = []; for (let i = 0; i < 6; i++) { const b = plane(0.3, 0.45, M(0xb88a22), -1 - i * 0.6, 0.01, 1.5 + (i % 2) * 0.3); b.rotation.z = 0.3; scene.add(b); bootPrints.push(b); }
  // geysers from pits near camera
  const geysers = pits.slice(-12).map((p, i) => { const g = new THREE.Group(); g.position.set(p.x, -p.d * 0.5, p.z); for (let k = 0; k < 7; k++) { const s = softSprite(0xffffff, 1 + k * 0.4, 0); g.add(s); } g.userData = { ph: i * 0.13 }; scene.add(g); return g; });
  // melted puddles (shiny) + shimmer
  pits.push({ x: 0.6, z: -0.5, r: 1.0, d: 0.0 }); const puddles = pits.slice(-13).map(p => { const d = new THREE.Mesh(new THREE.CircleGeometry(p.r * 0.75, 20), new THREE.MeshStandardMaterial({ color: 0xff9a30, emissive: 0x7a3a00, emissiveIntensity: 0.6, roughness: 0.15, metalness: 0.3 })); d.rotation.x = -Math.PI / 2; d.position.set(p.x, -p.d + 0.35, p.z); d.visible = false; scene.add(d); return d; });
  const shimmer = []; for (let i = 0; i < 12; i++) { const s = softSprite(0xffd090, 3, 0); s.position.set(r.range(-12, 12), 1.5, r.range(-12, 2)); scene.add(s); shimmer.push(s); }
  // frozen fat ridges (night)
  const ridges = []; for (let i = 0; i < 14; i++) { const rg = box(r.range(3, 7), 0.25, 0.6, M(0xfff1d6), r.range(-14, 14), 0.1, r.range(-12, 4)); rg.rotation.y = r.f(); rg.visible = false; scene.add(rg); ridges.push(rg); }
  // micrometeorite streaks + puffs
  const streaks = []; for (let i = 0; i < 20; i++) { const s = box(0.04, 0.04, 3, emis(0xffffff, 1.5)); s.userData = { ph: r.f(), x: r.range(-14, 14), z: r.range(-16, 4) }; s.visible = false; scene.add(s); streaks.push(s); }
  const puffs = streaks.map(s => { const p = softSprite(0xd8b06a, 1.2, 0); scene.add(p); return p; });
  const lblJump = lbl('7 M', 1.6, 0.6, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 72px sans-serif' }); lblJump.position.set(1.4, 7.4, 0); lblJump.visible = false; scene.add(lblJump);
  const ruler = new THREE.Group(); ruler.visible = false; scene.add(ruler); for (let m = 0; m <= 8; m++) { ruler.add(box(0.5, 0.06, 0.06, M(m % 2 ? 0xffffff : 0xf2c85b), -1.6, m, 0)); if (m % 2 === 0) { const l = lbl(m + ' M', 0.7, 0.3, { fg: '#ffffff', font: 'bold 64px sans-serif' }); l.position.set(-2.2, m, 0); ruler.add(l); } } ruler.add(box(0.06, 8.2, 0.06, M(0xffffff), -1.35, 4.1, 0));
  bakeStatic(ST, scene);
  const S = { scene, cam, sun, astro, GT };
  S.update = (t, c) => {
    const br = c.brown ?? 0, me = c.melt ?? 0, ni = c.night ?? 0; GT.draw({ cheese: 1, biscuit: br, melt: 0 });
    sun.intensity = lerp(3.0, 0.6, ni); sun.color.setHex(ni > 0.5 ? 0x9fb4ff : 0xfff4e0); amb.intensity = lerp(0.35, 0.9, ni); amb.color.setHex(ni > 0.5 ? 0x4050a0 : 0x6070a0); hemi.intensity = lerp(0.35, 0.6, ni); groundMat.color.setHex(ni > 0.5 ? 0x8fa0d8 : 0xffffff);
    const m = c.astro ?? 'stand'; const jk = c.jumpK ?? 0; astro.pose('stand', t); astro.g.position.set(0, 0, 0); astro.g.rotation.y = Math.PI * 0.15; astro.g.rotation.z = 0; astro.g.rotation.x = 0;
    if (m === 'shield') { astro.armR.rotation.x = -2.5; astro.armR.rotation.z = -0.2; astro.neck.rotation.x = -0.4; astro.armL.rotation.x = -0.6; }
    else if (m === 'jump') { const h = Math.sin(jk * Math.PI) * 7.2; astro.g.position.y = h; astro.armL.rotation.z = 1.4 - jk * 0.5; astro.armR.rotation.z = -1.4 + jk * 0.5; astro.armL.rotation.x = -0.8; astro.armR.rotation.x = -0.8; astro.legL.rotation.x = -0.3 + Math.sin(jk * 6) * 0.2; astro.legR.rotation.x = 0.2; astro.neck.rotation.x = jk < 0.5 ? -0.5 : 0.5; }
    else if (m === 'sink') { const k = c.sinkK ?? 1; const lift = c.strings ?? 0; astro.g.position.y = -0.45 * k + 0.1 * lift; astro.armL.rotation.z = 0.9; astro.armR.rotation.z = -0.9; astro.armL.rotation.x = -0.7; astro.armR.rotation.x = -0.7; astro.neck.rotation.x = 0.6; astro.torso.rotation.x = 0.2 * k; astro.legL.rotation.x = -1.1 * lift; astro.legL.userData.knee.rotation.x = 1.2 * lift; astro.legR.rotation.x = 0.15 * k; }
    else if (m === 'slip') { astro.g.rotation.z = 0.35 + Math.sin(t * 9) * 0.08; astro.armL.rotation.z = 1.6; astro.armR.rotation.z = -1.6; astro.armL.rotation.x = -1.0 + Math.sin(t * 12) * 0.3; astro.armR.rotation.x = -1.0 - Math.sin(t * 12) * 0.3; astro.legL.rotation.x = -0.9; astro.legR.rotation.x = 0.6; astro.neck.rotation.x = -0.3; }
    else if (m === 'walk') { astro.pose('walk', t * 1.2); astro.g.position.x = (c.tl ?? 0) * 0.6 - 1; }
    else if (m === 'wave') { astro.armR.rotation.x = -2.6; astro.armR.rotation.z = -0.4 + Math.sin(t * 6) * 0.3; }
    const sk = c.strings ?? 0; strings.visible = sk > 0.01; if (strings.visible) { strings.children.forEach((s, i) => { if (i === 0) { s.scale.setScalar(0.6 + 0.6 * sk); return; } const u = s.userData; const bx = Math.cos(u.a) * u.r, bz = Math.sin(u.a) * u.r; const top = 0.15 + sk * 0.7; s.position.set(-0.11 + bx * (1 + sk), -0.4, 0.1 + bz * (1 + sk)); s.scale.y = top; s.rotation.z = -Math.cos(u.a) * 0.5 * sk; s.rotation.x = Math.sin(u.a) * 0.5 * sk; }); }
    const vk = c.vent ?? 0; geysers.forEach((g, i) => { g.visible = vk > 0.01; if (!g.visible) return; g.children.forEach((s, k) => { const ph = ((t * 0.9 + g.userData.ph + k * 0.14) % 1); s.position.set(Math.sin(ph * 9 + k) * 0.3, ph * 9 * vk, 0); const sc = (0.8 + ph * 4) * vk; s.scale.set(sc, sc * 1.3, 1); s.material.opacity = vk * 0.8 * (1 - ph) * Math.min(1, ph * 6); }); });
    puddles.forEach((p, i) => { p.visible = me > 0.05; p.material.emissiveIntensity = 0.3 + 0.5 * me + 0.2 * Math.sin(t * 3 + i); }); shimmer.forEach((s, i) => { s.material.opacity = me * 0.25 * (0.5 + 0.5 * Math.sin(t * 5 + i)); s.position.y = 1 + ((t * 0.5 + i * 0.3) % 2); });
    ridges.forEach(rg => rg.visible = ni > 0.5);
    const rk = c.rain ?? 0; streaks.forEach((s, i) => { s.visible = rk > 0.01; if (!s.visible) return; const ph = ((t * 1.6 + s.userData.ph) % 1); s.position.set(s.userData.x + (1 - ph) * 6, (1 - ph) * 24, s.userData.z + (1 - ph) * 3); s.rotation.set(0.3, 0, -0.25); const p = puffs[i]; p.position.set(s.userData.x, 0.3, s.userData.z); p.material.opacity = ph > 0.92 ? rk * 0.9 : (ph < 0.08 ? rk * (1 - ph * 12) : 0); p.scale.setScalar(1 + ph * 2); });
    earth.visible = c.earth !== false; earth.rotation.y = t * 0.02; lblJump.visible = !!c.lblJump; ruler.visible = !!c.ruler;
  };
  return S;
}

// ============================================================ STUDIO (numbers) ============================================================
// ctx: prop ('blocks'|'weigh'|'dried'|'press'|'jump'|'tide'|'albedo'|'feed'), k, plus per-prop flags
export function buildStudioC() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1d2b45); const cam = new THREE.PerspectiveCamera(44, 1080 / 1920, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x203050, 1.1)); const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(3, 6, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 8, bottom: -2 }); scene.add(key); scene.add(key.target);
  const floor = plane(40, 40, M(0x24365a), 0, 0, 0); floor.receiveShadow = true; scene.add(floor);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 14, 32, 1, true, Math.PI * 0.75, Math.PI * 1.5), new THREE.MeshLambertMaterial({ color: 0x2a3d66, side: THREE.BackSide })); back.position.set(0, 7, 0); scene.add(back);
  const spot = softSprite(0x6f9cff, 9, 0.25); spot.position.set(0, 3, -6); scene.add(spot);
  const P = {}; const add = (k, g) => { P[k] = g; scene.add(g); return g; };
  const TAG = { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 56px sans-serif' }; const RED = { bg: '#c0392b', fg: '#ffffff', font: 'bold 56px sans-serif' }; const GOLDF = { fg: '#f2c85b', font: 'bold 60px sans-serif' };
  const cheeseTex = () => { const T = moonTexture(512, 256); T.draw({ cheese: 1 }); return T.tex; };
  const rockTex = () => { const T = moonTexture(512, 256); T.draw({ cheese: 0 }); return T.tex; };
  const cheeseM = new THREE.MeshLambertMaterial({ map: cheeseTex() }); const rockM = new THREE.MeshLambertMaterial({ map: rockTex() });
  function dialTex(max, unit, step) { const t = canvasTex(512, 512, (ctx, W, H) => { ctx.fillStyle = '#f4efe4'; ctx.beginPath(); ctx.arc(256, 256, 250, 0, 6.283); ctx.fill(); ctx.lineWidth = 14; ctx.strokeStyle = '#2b2d33'; ctx.stroke(); const N = max / step; for (let i = 0; i <= N * 5; i++) { const a = Math.PI * (0.75 + 1.5 * i / (N * 5)); const L = i % 5 === 0 ? 34 : 16; ctx.lineWidth = i % 5 === 0 ? 6 : 3; ctx.strokeStyle = '#2b2d33'; ctx.beginPath(); ctx.moveTo(256 + Math.cos(a) * 220, 256 + Math.sin(a) * 220); ctx.lineTo(256 + Math.cos(a) * (220 - L), 256 + Math.sin(a) * (220 - L)); ctx.stroke(); if (i % 5 === 0) { ctx.fillStyle = '#2b2d33'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(step * i / 5), 256 + Math.cos(a) * 150, 256 + Math.sin(a) * 150); } } ctx.font = 'bold 36px sans-serif'; ctx.fillText(unit, 256, 380); }); t.magFilter = THREE.LinearFilter; return t; }
  const needleAngle = (v, max) => -(Math.PI * (0.75 + 1.5 * clamp(v, 0, max) / max) + Math.PI / 2);
  // blocks: balance with rock cube vs cheese cube
  { const g = new THREE.Group(); g.add(cyl(0.12, 0.3, 2.2, M(0x9aa1a8), 10, 0, 1.1, 0)); const beam = new THREE.Group(); beam.position.y = 2.3; g.add(beam); beam.add(box(2.6, 0.1, 0.12, M(0xcfd3d8), 0, 0, 0)); const pans = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * 1.15, 0, 0); for (const a of [0.6, 2.7, 4.7]) p.add(cyl(0.01, 0.01, 1.4, M(0xdddddd), 4, Math.cos(a) * 0.42, -0.7, Math.sin(a) * 0.42)); p.add(cyl(0.62, 0.52, 0.08, M(0xcfd3d8), 24, 0, -1.4, 0)); beam.add(p); return p; });
      const rock = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), rockM); rock.position.y = -0.98; rock.castShadow = true; pans[0].add(rock); const ch = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), cheeseM); ch.position.y = -0.98; ch.castShadow = true; pans[1].add(ch);
      const l1 = lbl('MOON ROCK · 3.3 G/CM³', 2.0, 0.25, { ...TAG, pw: 1024 }); l1.position.set(-1.1, 3.55, 0.2); g.add(l1); const l2 = lbl('CHEESE · 1.1 G/CM³', 1.9, 0.25, { ...TAG, pw: 1024 }); l2.position.set(1.1, 3.55, 0.2); g.add(l2); const l3 = lbl('÷ 3', 0.9, 0.5, GOLDF); l3.position.set(1.15, 0.5, 0.3); l3.visible = false; g.add(l3);
      g.userData = { beam, pans, l3 }; add('blocks', g); }
  // weigh: bathroom scale with the Moon on it
  { const g = new THREE.Group(); g.add(box(2.2, 0.16, 1.6, M(0x9aa1a8), 0, 0.08, 0)); g.add(box(2.0, 0.04, 1.4, M(0x2b2d33), 0, 0.18, 0)); g.add(box(0.2, 2.6, 0.2, M(0x9aa1a8), -1.15, 1.3, -0.5)); const face_ = new THREE.Mesh(new THREE.CircleGeometry(0.85, 48), new THREE.MeshLambertMaterial({ map: dialTex(8, '×10²² KG', 1) })); face_.position.set(-1.15, 2.95, -0.37); g.add(face_); const back_ = cyl(0.92, 0.92, 0.12, M(0x2b2d33), 48, -1.15, 2.95, -0.46); back_.rotation.x = Math.PI / 2; g.add(back_); const needle = new THREE.Group(); needle.position.set(-1.15, 2.95, -0.34); needle.add(box(0.06, 0.8, 0.03, M(0xc0392b), 0, 0.36, 0)); needle.add(cyl(0.08, 0.08, 0.05, M(0x2b2d33), 16, 0, 0, 0.01)); needle.children[1].rotation.x = Math.PI / 2; g.add(needle);
      const moonS = new THREE.Mesh(new THREE.SphereGeometry(0.9, 48, 32), rockM); moonS.position.set(0.1, 1.1, 0); moonS.castShadow = true; g.add(moonS);
      const l1 = lbl('7.3 → 2.4 × 10²² KG', 1.9, 0.26, { ...TAG, pw: 1024 }); l1.position.set(0.5, 2.3, 0.7); l1.visible = false; g.add(l1); const l2 = lbl('SAME SIZE', 1.2, 0.26, TAG); l2.position.set(0.5, 2.65, 0.7); l2.visible = false; g.add(l2);
      g.userData = { needle, moonS, l1, l2 }; add('weigh', g); }
  // dried: freeze-dried cheese cube on a plinth + packet
  { const g = new THREE.Group(); g.add(box(1.4, 1.0, 1.4, M(0x8a8f99), 0, 0.5, 0)); const cube = new THREE.Group(); cube.position.y = 1.5; g.add(cube); const dm = M(0xf7e3a6); cube.add(box(0.9, 0.9, 0.9, cheeseM.clone(), 0, 0, 0)); const pores = []; const rr = rng(4); for (let i = 0; i < 40; i++) { const p = ico(rr.range(0.05, 0.12), M(0xb8871f), 0, rr.range(-0.42, 0.42), rr.range(-0.42, 0.42), 0.45); p.scale.z = 0.3; p.visible = false; cube.add(p); pores.push(p); }
      const steam = makeSmoke(10, 0xffffff, 0.6, 12); steam.position.set(0, 2.0, 0); g.add(steam);
      const pk = new THREE.Group(); pk.position.set(1.05, 0, 0.4); g.add(pk); pk.add(box(0.7, 1.0, 0.25, M(0xd8dde2), 0, 0.5, 0)); const pl = lbl('ASTRONAUT CHEESE · 0% WATER', 0.66, 0.165, { bg: '#2b5c9e', fg: '#ffffff', font: 'bold 44px sans-serif', pw: 1024 }); pl.position.set(0, 0.7, 0.13); pk.add(pl); const pl2 = lbl('FREEZE-DRIED', 0.6, 0.15, { ...RED, font: 'bold 60px sans-serif' }); pl2.position.set(0, 0.42, 0.13); pk.add(pl2);
      const l1 = lbl('WATER 37% → 0%', 1.5, 0.25, { ...TAG, pw: 1024 }); l1.position.set(0.25, 2.35, 0.6); g.add(l1); const l2 = lbl('0 ATM · WATER BOILS', 1.7, 0.25, { ...RED, pw: 1024 }); l2.position.set(0.25, 2.7, 0.6); l2.visible = false; g.add(l2);
      g.userData = { cube, pores, steam, l2 }; add('dried', g); }
  // press: hydraulic press with gauge, cheese block, food scientist
  { const g = new THREE.Group(); const fm = M(0x3a4756); g.add(box(0.4, 3.6, 0.4, fm, -1.2, 1.8, 0)); g.add(box(0.4, 3.6, 0.4, fm, 1.2, 1.8, 0)); g.add(box(2.8, 0.5, 0.6, fm, 0, 3.55, 0)); g.add(box(2.8, 0.3, 1.0, M(0x9aa1a8), 0, 0.15, 0)); const ram = new THREE.Group(); g.add(ram); ram.add(cyl(0.3, 0.3, 1.6, M(0xb8bfc6), 16, 0, 2.5, 0)); ram.add(box(1.6, 0.25, 0.9, M(0x2b2d33), 0, 1.6, 0)); const block = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.8), cheeseM); block.position.y = 0.8; block.castShadow = true; g.add(block);
      const gaugeF = new THREE.Mesh(new THREE.CircleGeometry(0.6, 48), new THREE.MeshLambertMaterial({ map: dialTex(6000, 'ATM', 1000) })); gaugeF.position.set(1.2, 2.75, 0.34); g.add(gaugeF); const gb = cyl(0.66, 0.66, 0.12, M(0x2b2d33), 48, 1.2, 2.75, 0.26); gb.rotation.x = Math.PI / 2; g.add(gb); const needle = new THREE.Group(); needle.position.set(1.2, 2.75, 0.37); needle.add(box(0.05, 0.5, 0.03, M(0xc0392b), 0, 0.22, 0)); g.add(needle);
      const sci = new Person({ seed: 909, shirt: 0xffffff, pants: 0x2f3b4e, hairStyle: 'bun' }); sci.g.position.set(-2.4, 0, 0.6); sci.g.rotation.y = 0.9; g.add(sci.g); for (const sx of [-1, 1]) { const gg = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 12), M(0x222222)); gg.position.set(sx * 0.062, 0.215, 0.17); sci.neck.add(gg); } const clip = box(0.22, 0.3, 0.02, M(0x8a6a4a), 0, -0.5, 0.12); sci.armL.add(clip); clip.rotation.x = -0.6;
      const lhpp = lbl('HPP · 400–600 MPA', 1.5, 0.26, { ...TAG, pw: 1024 }); lhpp.position.set(-1.75, 2.45, 0.6); lhpp.visible = false; g.add(lhpp);
      const sticker = lbl('PREMIUM', 0.6, 0.26, { bg: '#f2c85b', fg: '#8a1a1a', font: 'bold 72px serif' }); sticker.position.set(0.1, 0.6, 0.52); sticker.visible = false; g.add(sticker);
      const l1 = lbl('MOON CORE · 5,000 ATM', 2.2, 0.3, { ...RED, pw: 1024 }); l1.position.set(0, 3.55, 0.32); g.add(l1);
      g.userData = { ram, block, needle, sci, lhpp, sticker }; add('press', g); }
  // jump: ruler + two astronauts (Earth 0.4 m vs cheese Moon 7 m)
  { const g = new THREE.Group(); const pole = new THREE.Group(); g.add(pole); for (let m = 0; m <= 8; m++) { pole.add(box(0.6, 0.06, 0.06, M(m % 2 ? 0xffffff : 0xf2c85b), 0, m, 0)); if (m % 2 === 0) { const l = lbl(m + ' M', 0.7, 0.3, { fg: '#ffffff', font: 'bold 64px sans-serif' }); l.position.set(-0.75, m, 0); pole.add(l); } } pole.add(box(0.06, 8.3, 0.06, M(0xffffff), 0.3, 4.15, 0));
      const a1 = makeAstronaut(6); a1.g.position.set(-1.8, 0, 0); g.add(a1.g); const a2 = makeAstronaut(7); a2.g.position.set(1.8, 0, 0); g.add(a2.g);
      const l1 = lbl('EARTH · 9.81 M/S²', 1.7, 0.21, { ...TAG, pw: 1024 }); l1.position.set(-1.8, -0.05, 0.6); l1.rotation.x = -0.3; g.add(l1); const l2 = lbl('CHEESE MOON · 0.53 M/S²', 2.0, 0.21, { ...TAG, pw: 1024 }); l2.position.set(1.8, -0.05, 0.6); l2.rotation.x = -0.3; g.add(l2); const l3 = lbl('0.4 M', 0.8, 0.3, GOLDF); l3.position.set(-1.8, 2.5, 0.3); g.add(l3);
      g.userData = { a1, a2 }; add('jump', g); }
  // tide: tank with a tide pole; two bars lunar/solar
  { const g = new THREE.Group(); const tank = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.0, 1.2), mat(0xbfe3ff, { transparent: true, opacity: 0.18 })); tank.position.set(-0.8, 1.5, 0); g.add(tank); const water = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1, 1.1), mat(0x4aa0d8, { transparent: true, opacity: 0.75 })); water.position.set(-0.8, 0.5, 0); g.add(water);
      const poleT = canvasTex(64, 512, (ctx, w, h) => { for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? '#c0392b' : '#ffffff'; ctx.fillRect(0, i * 32, w, 32); } }); const pole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.0, 0.16), new THREE.MeshLambertMaterial({ map: poleT })); pole.position.set(-1.5, 1.5, 0.3); g.add(pole);
      const lOld = lbl('HIGH TIDE · BEFORE', 1.6, 0.22, { ...TAG, pw: 1024 }); lOld.position.set(-0.5, 2.3, 0.7); g.add(lOld); const lNew = lbl('HIGH TIDE · NOW · −46%', 1.9, 0.24, { ...RED, pw: 1024 }); lNew.position.set(-0.5, 1.6, 0.7); lNew.visible = false; g.add(lNew);
      const bars = new THREE.Group(); bars.position.set(1.35, 0, 0); g.add(bars); const bL = box(0.5, 1, 0.5, M(0xf2c85b), -0.35, 0.5, 0); const bS = box(0.5, 1, 0.5, M(0xe88c6a), 0.35, 0.5, 0); bars.add(bL, bS); const lL = lbl('MOON', 0.7, 0.25, { fg: '#ffffff', font: 'bold 60px sans-serif' }); lL.position.set(-0.35, -0.25, 0.4); const lS = lbl('SUN', 0.7, 0.25, { fg: '#ffffff', font: 'bold 60px sans-serif' }); lS.position.set(0.35, -0.25, 0.4); bars.add(lL, lS); const lb1 = lbl('1.00 → 0.33', 1.0, 0.22, GOLDF); lb1.position.set(-0.35, 3.3, 0.4); const lb2 = lbl('0.46', 0.6, 0.22, GOLDF); lb2.position.set(0.35, 1.85, 0.4); bars.add(lb1, lb2);
      g.userData = { water, bL, bS, lNew, lb1 }; add('tide', g); }
  // albedo: asphalt disc (car park) vs cheese disc under a lamp
  { const g = new THREE.Group(); const aT = canvasTex(512, 512, (ctx, w, h) => { ctx.fillStyle = '#3d4148'; ctx.fillRect(0, 0, w, h); const r = mulberry32(5); for (let i = 0; i < 900; i++) { ctx.fillStyle = r() < 0.5 ? '#2f3237' : '#555a62'; ctx.fillRect(r() * w, r() * h, 3, 3); } ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 12; for (let x = 76; x < w; x += 120) { ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x, 420); ctx.stroke(); } ctx.fillStyle = '#f2c85b'; ctx.font = 'bold 110px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('P', 256, 120); });
      const dA = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.15, 48), new THREE.MeshLambertMaterial({ map: aT })); dA.position.set(-0.9, 1.5, 0); dA.rotation.x = Math.PI / 2; dA.scale.set(0.82, 1, 0.82); g.add(dA); const car = makeCar(12, { color: 0xd9534f }); car.scale.setScalar(0.085); car.position.set(-0.9, 1.5, 0.09); car.rotation.x = -Math.PI / 2; car.rotation.z = 0.2; g.add(car);
      const dC = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.15, 48), cheeseM); dC.position.set(0.9, 1.5, 0); dC.scale.set(0.82, 1, 0.82); dC.rotation.x = Math.PI / 2; g.add(dC);
      const lamp = new THREE.Group(); lamp.position.set(0, 4.2, 1.2); g.add(lamp); lamp.add(cone(0.5, 0.6, M(0x2b2d33), 12, 0, 0, 0)); const beam = glowSprite(0xffffff, 3, 0); beam.position.set(0, -0.6, 0); lamp.add(beam);
      const l1 = lbl('MOON ROCK · ALBEDO 0.12', 1.8, 0.225, { ...TAG, pw: 1024 }); l1.position.set(-0.9, 2.45, 0.3); l1.scale.setScalar(0.85); g.add(l1); const l2 = lbl('CHEESE · ≈ 0.6 (EST.)', 1.7, 0.225, { ...TAG, pw: 1024 }); l2.position.set(0.9, 2.45, 0.3); l2.scale.setScalar(0.85); l2.visible = false; g.add(l2); const l3 = lbl('×5 BRIGHTER', 1.4, 0.35, GOLDF); l3.position.set(0.9, 0.5, 0.3); l3.visible = false; g.add(l3); const l4 = lbl('CAR PARK', 1.1, 0.27, RED); l4.position.set(-0.9, 0.5, 0.3); g.add(l4);
      const glowC = glowSprite(0xfff0b0, 4, 0); glowC.position.set(0.9, 1.5, 0.4); g.add(glowC);
      g.userData = { dA, dC, beam, glowC, l2, l3 }; add('albedo', g); }
  // feed: cheese Moon with a wedge out, queue with plates, counter, two bars
  { const g = new THREE.Group(); const Rm = 1.3; const body = new THREE.Mesh(new THREE.SphereGeometry(Rm, 48, 32, 0.5, Math.PI * 2 - 0.5), cheeseM); body.position.set(-0.6, 1.9, 0); g.add(body); const inner = M(0xf4d26a); const cap1 = new THREE.Mesh(new THREE.CircleGeometry(Rm, 32, 0, Math.PI), inner); cap1.position.copy(body.position); cap1.rotation.y = Math.PI / 2 - 0.0; g.add(cap1); const wedge = new THREE.Group(); wedge.position.set(1.4, 1.9, 0.8); g.add(wedge); const wm = new THREE.Mesh(new THREE.SphereGeometry(Rm, 24, 16, 0, 0.5), cheeseM); wedge.add(wm); const wi = new THREE.Mesh(new THREE.CircleGeometry(Rm, 24, 0, Math.PI), inner); wi.rotation.y = Math.PI / 2; wedge.add(wi); const wi2 = wi.clone(); wi2.rotation.y = Math.PI / 2 - 0.5; wedge.add(wi2);
      const queue = []; for (let i = 0; i < 7; i++) { const p = new Person({ seed: 930 + i, hairStyle: i % 2 ? 'long' : 'short', dress: i % 3 === 1 }); p.g.position.set(3.0 + i * 0.9, 0, 1.2 + (i % 2) * 0.3); p.g.rotation.y = -Math.PI / 2; const plate = cyl(0.14, 0.14, 0.02, M(0xffffff), 16, 0, -0.55, 0.16); p.armL.add(plate); g.add(p.g); queue.push(p); }
      const cc = document.createElement('canvas'); cc.width = 1024; cc.height = 160; const cctx = cc.getContext('2d'); const ctex = new THREE.CanvasTexture(cc); ctex.colorSpace = THREE.SRGBColorSpace; const counter = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.44), new THREE.MeshBasicMaterial({ map: ctex, transparent: true })); counter.position.set(3.6, 3.5, 0.9); g.add(counter);
      const bars = new THREE.Group(); bars.position.set(0, 0, 1.6); bars.visible = false; g.add(bars); const b1 = box(0.8, 1, 0.5, M(0xf2c85b), -0.6, 0.5, 0); const b2 = box(0.8, 1, 0.5, M(0x6f9cff), 0.6, 0.5, 0); bars.add(b1, b2); const bl1 = lbl('CHEESE · 16 BN YRS', 1.5, 0.2, { ...TAG, pw: 1024 }); bl1.position.set(-0.6, 4.2, 0.26); const bl2 = lbl('UNIVERSE · 13.8 BN YRS', 1.6, 0.2, { bg: '#6f9cff', fg: '#0b1020', font: 'bold 56px sans-serif', pw: 1024 }); bl2.position.set(0.6, 3.6, 0.26); bars.add(bl1, bl2);
      let lastN = -1; const drawCounter = (n) => { if (n === lastN) return; lastN = n; cctx.clearRect(0, 0, 1024, 160); cctx.fillStyle = 'rgba(0,0,0,0.35)'; cctx.fillRect(0, 0, 1024, 160); cctx.fillStyle = '#ffffff'; cctx.font = 'bold 40px sans-serif'; cctx.textAlign = 'center'; cctx.fillText('YEARS OF LUNCH FOR EVERYONE', 512, 50); cctx.fillStyle = '#f2c85b'; cctx.font = 'bold 86px sans-serif'; cctx.fillText(Math.round(n).toLocaleString('en-GB'), 512, 135); ctex.needsUpdate = true; };
      drawCounter(0);
      g.userData = { body, wedge, queue, drawCounter, bars, b1, b2, counter }; add('feed', g); }
  const S = { scene, cam, key, P };
  S.update = (t, c) => {
    const prop = c.prop || 'blocks'; Object.entries(P).forEach(([k, g]) => g.visible = k === prop); key.target.position.copy(P[prop].position); key.target.updateMatrixWorld();
    const u = P[prop].userData; const k = c.k ?? 0;
    if (prop === 'blocks') { const tilt = -0.22 * easeOut(k); u.beam.rotation.z = tilt + Math.sin(t * 2) * 0.01 * k; u.pans.forEach(p => p.rotation.z = -u.beam.rotation.z); u.l3.visible = k > 0.8; }
    if (prop === 'weigh') { const kg = lerp(7.3, 2.4, easeOut(k)); u.needle.rotation.z = needleAngle(kg, 8) + Math.sin(t * 30) * 0.01 * (k > 0 && k < 1 ? 1 : 0); u.moonS.material = k > 0.5 ? cheeseM : rockM; u.moonS.rotation.y = t * 0.3; u.l1.visible = k > 0.9; u.l2.visible = !!c.same; u.moonS.scale.setScalar(1 + 0.03 * Math.sin(t * 25) * (k > 0.1 && k < 0.9 ? 1 : 0)); }
    if (prop === 'dried') { u.pores.forEach((p, i) => p.visible = k * 40 > i); updateSmoke(u.steam, t, k < 0.9 ? 1 : 0.3, 1.5, 0.3); u.cube.rotation.y = Math.sin(t * 0.5) * 0.2; u.cube.children[0].material.color.setHex(k > 0.5 ? 0xffe9a8 : 0xffffff); u.l2.visible = !!c.boil; }
    if (prop === 'press') { const sq = easeOut(k); u.ram.position.y = -sq * 0.45; u.block.scale.set(1 + 0.25 * sq, 1 - 0.45 * sq, 1 + 0.25 * sq); u.block.position.y = 0.3 + 0.5 * (1 - 0.45 * sq); u.needle.rotation.z = needleAngle(5000 * sq, 6000) + Math.sin(t * 40) * 0.01 * (sq > 0.1 && sq < 1 ? 1 : 0); u.sci.pose('stand', t); u.sci.armL.rotation.x = -1.2; u.sci.armL.rotation.z = 0.3; u.sci.armR.rotation.x = -0.9; u.sci.neck.rotation.x = c.nod ? 0.15 + Math.sin(t * 5) * 0.12 : 0.25; u.sci.neck.rotation.y = 0.5; u.lhpp.visible = !!c.hpp; u.sticker.visible = !!c.sticker; face(u.sci, { smile: !!c.sticker }); }
    if (prop === 'jump') { const j1 = Math.sin(clamp(k * 1.6, 0, 1) * Math.PI) * 0.4; const j2 = Math.sin(clamp(k, 0, 1) * Math.PI) * 7.2; [u.a1, u.a2].forEach((a, i) => { a.pose('stand', t); a.g.position.y = i ? j2 : j1; a.armL.rotation.z = 1.2; a.armR.rotation.z = -1.2; a.armL.rotation.x = -0.6; a.armR.rotation.x = -0.6; a.legL.rotation.x = -0.3; a.legR.rotation.x = 0.2; if (!i && k > 0.65) { a.pose('stand', t); a.g.position.y = 0; } }); }
    if (prop === 'tide') { const h = lerp(2.0, 1.08, easeOut(k)); u.water.scale.y = h; u.water.position.y = h / 2; u.lNew.position.y = h + 0.2; u.bL.scale.y = lerp(2.0, 0.66, easeOut(k)); u.bL.position.y = u.bL.scale.y / 2; u.bS.scale.y = 0.92; u.bS.position.y = 0.46; u.lNew.visible = k > 0.9; }
    if (prop === 'albedo') { u.beam.material.opacity = 0.2 + 0.2 * Math.sin(t * 3); u.glowC.material.opacity = 0.7 * easeOut(k); u.glowC.scale.setScalar(4 + 4 * easeOut(k)); u.l2.visible = k > 0.2; u.l3.visible = k > 0.8; u.dC.rotation.z = t * 0.2; u.dA.rotation.z = -t * 0.1; }
    if (prop === 'feed') { u.wedge.position.set(lerp(-0.1, 1.5, easeOut(k)), 1.9 + 0.3 * Math.sin(easeOut(k) * Math.PI), lerp(0.1, 1.0, easeOut(k))); u.wedge.rotation.y = -0.4 * easeOut(k); u.body.rotation.y = t * 0.1; u.queue.forEach((p, i) => { p.pose('walk', t, { phase: i }); p.g.position.x = 3.0 + i * 0.9 - ((t * 0.35) % 0.9); p.armL.rotation.x = -1.3; p.armL.rotation.z = 0.2; p.neck.rotation.y = 0.3; }); u.drawCounter(16.1e9 * easeOut(c.count ?? 0)); u.bars.visible = !!c.bars; if (c.bars) { const bk = easeOut(c.barsK ?? 1); u.b1.scale.y = Math.max(0.01, 4.6 * bk); u.b1.position.y = u.b1.scale.y / 2; u.b2.scale.y = Math.max(0.01, 3.95 * bk); u.b2.position.y = u.b2.scale.y / 2; } u.counter.visible = !c.bars; }
  };
  return S;
}

// ============================================================ EARTH + MOON (orbit, tides) ============================================================
// ctx: cheese 0..1, pulse (s since) or -1, bulge 0..1 (1 = normal bulge), showBulge, bite (bool), moonA (angle)
export function buildEarthC() {
  const S = buildSpace(); const { scene } = S; S.iss.visible = false; S.debris.visible = false;
  const MT = moonTexture(1024, 512); const mm = new THREE.MeshLambertMaterial({ map: MT.tex }); const moon = new THREE.Mesh(new THREE.SphereGeometry(17, 48, 32), mm); scene.add(moon);
  const bite = new THREE.Mesh(new THREE.SphereGeometry(17, 48, 32, 0.6, Math.PI * 2 - 0.6), mm); bite.visible = false; scene.add(bite); const biteCap = new THREE.Mesh(new THREE.CircleGeometry(17, 32, 0, Math.PI), M(0xf4d26a)); biteCap.rotation.y = Math.PI / 2; bite.add(biteCap); const biteCap2 = biteCap.clone(); biteCap2.rotation.y = Math.PI / 2 - 0.6; bite.add(biteCap2);
  const bulge = new THREE.Mesh(new THREE.SphereGeometry(61.5, 48, 32), mat(0x5fb0ff, { transparent: true, opacity: 0.22 })); scene.add(bulge);
  const pulse = new THREE.Mesh(new THREE.RingGeometry(1, 1.12, 64), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0, side: THREE.DoubleSide })); scene.add(pulse);
  const lB = lbl('TIDAL BULGE (NOT TO SCALE)', 60, 7, { ...{ bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 56px sans-serif' }, pw: 1024 }); lB.position.set(0, 84, 0); lB.visible = false; scene.add(lB);
  const lM = lbl('+2.7 H PER MONTH', 40, 6, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 60px sans-serif', pw: 1024 }); lM.visible = false; scene.add(lM);
  const orbit = new THREE.Mesh(new THREE.RingGeometry(159, 160.5, 128), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, side: THREE.DoubleSide })); orbit.rotation.x = Math.PI / 2 - 0.3; orbit.visible = false; scene.add(orbit);
  const upd = S.update; let lastCh = -1;
  S.update = (t, c) => {
    upd(t, {}); S.iss.visible = false; S.debris.visible = false; S.earth.rotation.y = t * 0.03;
    const ch = c.cheese ?? 1; if (ch !== lastCh) { lastCh = ch; MT.draw({ cheese: ch }); }
    const a = c.moonA ?? 0.3; const pos = new THREE.Vector3(Math.cos(a) * 160, Math.sin(a) * 160 * 0.3 + 10, Math.sin(a) * 160 * -0.95); moon.position.copy(pos); bite.position.copy(pos); moon.rotation.y = t * 0.1; bite.rotation.y = 0.8 + t * 0.1; moon.visible = !c.bite; bite.visible = !!c.bite;
    const pk = c.pulse ?? -1; if (pk >= 0 && pk < 1.4) { pulse.visible = true; pulse.position.copy(pos); pulse.lookAt(S.cam.position); pulse.scale.setScalar(20 + pk * 160); pulse.material.opacity = 0.8 * (1 - pk / 1.4); } else pulse.visible = false;
    const bk = c.bulge ?? 1; bulge.visible = !!c.showBulge; if (bulge.visible) { bulge.lookAt(pos); bulge.scale.set(1 - 0.03 * bk, 1 - 0.03 * bk, 1 + 0.42 * bk); } lB.visible = false;
    lM.visible = !!c.month; if (c.month) { lM.position.copy(pos).add(new THREE.Vector3(0, 32, 0)); lM.lookAt(S.cam.position); } orbit.visible = !!c.month;
  };
  return S;
}

// ============================================================ COAST (tide out) ============================================================
// ctx: lift (m, negative), shipDrop, surferK, labels
export function buildCoastC() {
  const S = buildOcean(); const { scene } = S;
  // sloping mud ramp from the sea wall down into the sea
  const rampGeo = new THREE.PlaneGeometry(3000, 140, 1, 1); const ramp = new THREE.Mesh(rampGeo, M(0x6f5a44)); ramp.rotation.x = -Math.PI / 2 - 0.1; ramp.position.set(0, -7, -69); ramp.receiveShadow = true; scene.add(ramp);
  const yAt = (z) => -0.1 * (-z) ; // ramp height at z (z<0): 0 at shore, -3 at z=-30
  // boats on the mud
  const boats = []; [[-30, -14, 0.4], [10, -22, -0.5], [45, -10, 0.3], [-70, -26, -0.3], [90, -18, 0.5]].forEach(([x, z, rz], i) => { const g = new THREE.Group(); const hull = M([0x2b4c7e, 0xf2f2f2, 0xc0392b][i % 3]); g.add(box(6, 1.2, 2.2, hull, 0, 0.6, 0)); g.add(box(2.4, 1.0, 1.8, M(0xf4f4f4), -0.6, 1.6, 0)); g.add(cyl(0.06, 0.06, 5, M(0xdddddd), 6, 0.8, 3.5, 0)); g.position.set(x, yAt(z) - 0.2, z); g.userData = { rz, z }; scene.add(g); boats.push(g); });
  // tide pole with labels
  const poleT = canvasTex(64, 512, (ctx, w, h) => { for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? '#c0392b' : '#ffffff'; ctx.fillRect(0, i * 32, w, 32); } });
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.9, 10, 0.9), new THREE.MeshLambertMaterial({ map: poleT })); pole.position.set(-6, 1, -40); scene.add(pole);
  const lOld = lbl('HIGH TIDE · BEFORE', 8.0, 1.1, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 56px sans-serif', pw: 1024 }); lOld.position.set(-1.0, 0.5, -39.5); scene.add(lOld);
  const lNew = lbl('HIGH TIDE · NOW · −46%', 9.0, 1.15, { bg: '#c0392b', fg: '#ffffff', font: 'bold 56px sans-serif', pw: 1024 }); lNew.position.set(-0.5, -2.3, -39.5); lNew.visible = false; scene.add(lNew);
  // surfer walking home on the mud
  const surfer = new Person({ seed: 940, shirt: 0x1b1f24, pants: 0x1b1f24, hairStyle: 'long', hair: 0xd9b36b }); scene.add(surfer.g); const board = box(2.2, 0.08, 0.5, M(0xffffff), 0, -0.3, -0.35); board.rotation.z = 0.1; surfer.armR.add(board); const stripe = box(1.6, 0.09, 0.1, M(0xd9534f), 0, -0.3, -0.35); surfer.armR.add(stripe);
  // seagulls
  const gulls = []; for (let i = 0; i < 5; i++) { const g = new THREE.Group(); g.add(box(0.5, 0.05, 0.12, M(0xffffff), -0.25, 0, 0)); g.add(box(0.5, 0.05, 0.12, M(0xffffff), 0.25, 0, 0)); g.add(ico(0.08, M(0xeeeeee), 0, 0, 0, 0)); scene.add(g); gulls.push(g); }
  const upd = S.update;
  S.update = (t, c) => {
    upd(t, { lift: c.lift ?? 0, shipDrop: c.shipDrop ?? 0 });
    const lk = clamp(-(c.lift ?? 0) / 3, 0, 1);
    boats.forEach((b, i) => { b.rotation.z = b.userData.rz * lk; b.position.y = lerp(0.3, yAt(b.userData.z) - 0.1, lk); });
    lNew.visible = lk > 0.9; lOld.visible = c.labels !== false; lNew.visible = lNew.visible && c.labels !== false;
    const sk = c.surferK ?? -1; surfer.g.visible = sk >= 0; if (surfer.g.visible) { const z = lerp(-28, -4, sk); surfer.g.position.set(4 + Math.sin(sk * 3) * 0.5, yAt(z), z); surfer.g.rotation.y = 0.1; surfer.pose('walk', t * 1.1); surfer.armR.rotation.x = -0.4; surfer.armR.rotation.z = -0.9; surfer.neck.rotation.x = 0.25; }
    gulls.forEach((g, i) => { const a = t * 0.4 + i * 1.3; g.position.set(Math.cos(a) * 30 - 10, 8 + Math.sin(t + i) * 1.5, -20 + Math.sin(a) * 15); g.rotation.y = -a; g.children[0].rotation.z = Math.sin(t * 9 + i) * 0.6; g.children[1].rotation.z = -Math.sin(t * 9 + i) * 0.6; });
  };
  return S;
}

// ============================================================ CITY (aerial, dusk, moonlit) ============================================================
export function buildCityC() {
  const S = buildCity(); const upd = S.update; const { scene } = S;
  const MT = moonTexture(512, 256); MT.draw({ cheese: 1 }); const moon = new THREE.Mesh(new THREE.SphereGeometry(42, 32, 24), new THREE.MeshBasicMaterial({ map: MT.tex })); moon.position.set(-180, 150, -420); scene.add(moon); const glow = glowSprite(0xfff3c4, 180, 0.4); glow.position.copy(moon.position); scene.add(glow);
  // street lamps as small glows
  const lamps = []; const r = rng(3); for (let i = 0; i < 60; i++) { const s = glowSprite(0xffd98a, 6, 0.9); s.position.set(r.range(-90, 90), 1.5, r.range(-90, 90)); scene.add(s); lamps.push(s); }
  S.update = (t, c) => { upd(t, c); const br = c.bright ?? 0; S.setSky(0.85 - 0.3 * br); S.hemi.intensity = 0.7 + 1.1 * br; S.sun.intensity = 0.8 + 1.4 * br; glow.material.opacity = 0.4 + 0.5 * br; glow.scale.setScalar(180 + 160 * br); lamps.forEach(s => s.material.opacity = 0.9 - 0.5 * br); };
  return S;
}
