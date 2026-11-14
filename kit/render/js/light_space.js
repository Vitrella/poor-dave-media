import * as THREE from 'three';
import { mat, box, cyl, ico, cone, plane, rng, lerp, clamp, smooth, easeOut, easeIn, prog, emis, canvasTex, texMat, softSprite, glowSprite, makeStars } from './util.js';
import { M, makeEarth } from './kit.js';
import { buildCity } from './world.js';
import { lbl } from './ice.js';
import { face } from './plastic.js';
import { makeDaveL, dynLbl, blink } from './light.js';

function spaceScene(far = 5000) { const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000004); const cam = new THREE.PerspectiveCamera(42, 1080 / 1920, 0.1, far); const s1 = makeStars(1800, 2600, 3); s1.material.opacity = 0.9; s1.material.size = 2.4; scene.add(s1); const s2 = makeStars(1800, 2600, 4); s2.rotation.z = Math.PI; s2.material.opacity = 0.9; s2.material.size = 2.4; scene.add(s2); const s3 = makeStars(600, 2500, 5); s3.rotation.x = Math.PI / 2; s3.material.size = 3.6; s3.material.opacity = 0.8; scene.add(s3); return { scene, cam, stars: [s1, s2, s3] }; }
const FWD = new THREE.Vector3(0, 0, -1);

// ---------- planet textures ----------
export function moonTex() { return canvasTex(1024, 512, (ctx, W, H) => { ctx.fillStyle = '#9a9aa0'; ctx.fillRect(0, 0, W, H); const r = rng(13); for (let i = 0; i < 260; i++) { const x = r.f() * W, y = r.f() * H, rad = 3 + r.f() * r.f() * 40; ctx.fillStyle = r.f() < 0.5 ? '#7d7d84' : '#8a8a90'; ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#b4b4ba'; ctx.lineWidth = 2; ctx.stroke(); } for (let i = 0; i < 12; i++) { ctx.fillStyle = '#6d6d74'; ctx.beginPath(); ctx.ellipse(r.f() * W, H * 0.3 + r.f() * H * 0.4, 40 + r.f() * 120, 25 + r.f() * 60, r.f() * 3, 0, 6.283); ctx.fill(); } }); }
export function jupiterTex() { return canvasTex(1024, 512, (ctx, W, H) => { const bands = ['#d9b78a', '#b48a5a', '#e8d2b0', '#9c6a44', '#d8b48c', '#c49a6c', '#efe0c8', '#a87a52', '#d6b690', '#b58a60', '#e3cdb0', '#c89c70']; const bh = H / bands.length; bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * bh, W, bh + 1); }); const r = rng(17); ctx.globalAlpha = 0.25; for (let i = 0; i < 400; i++) { ctx.fillStyle = r.f() < 0.5 ? '#fff' : '#6a4a30'; ctx.fillRect(r.f() * W, r.f() * H, 20 + r.f() * 120, 2 + r.f() * 4); } ctx.globalAlpha = 1; ctx.fillStyle = '#c45a3a'; ctx.beginPath(); ctx.ellipse(W * 0.3, H * 0.62, 70, 36, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#e07a58'; ctx.beginPath(); ctx.ellipse(W * 0.3, H * 0.62, 50, 24, 0, 0, 6.283); ctx.fill(); }); }
export function plutoTex() { return canvasTex(1024, 512, (ctx, W, H) => { ctx.fillStyle = '#b98a68'; ctx.fillRect(0, 0, W, H); const r = rng(19); for (let i = 0; i < 60; i++) { ctx.fillStyle = r.f() < 0.5 ? '#8a5a40' : '#d4b090'; ctx.beginPath(); ctx.ellipse(r.f() * W, r.f() * H, 30 + r.f() * 120, 20 + r.f() * 60, r.f() * 3, 0, 6.283); ctx.fill(); } ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.ellipse(W * 0.72, H * 0.5, 120, 70, 0.3, 0, 6.283); ctx.fill(); // Tombaugh Regio (the heart)
    const cx = W * 0.5, cy = H * 0.55, s = 2.3; ctx.fillStyle = '#f1e4cf'; ctx.beginPath(); ctx.moveTo(cx, cy + 60 * s); ctx.bezierCurveTo(cx - 90 * s, cy - 10 * s, cx - 60 * s, cy - 70 * s, cx, cy - 30 * s); ctx.bezierCurveTo(cx + 60 * s, cy - 70 * s, cx + 90 * s, cy - 10 * s, cx, cy + 60 * s); ctx.fill(); ctx.fillStyle = '#e4d2b8'; ctx.beginPath(); ctx.ellipse(cx + 40 * s, cy + 5 * s, 40 * s, 45 * s, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#f6ece0'; ctx.beginPath(); ctx.ellipse(cx - 40 * s, cy - 5 * s, 38 * s, 40 * s, 0, 0, 6.283); ctx.fill(); }); }
function dottedTex(n = 180, seed = 23) { return canvasTex(1024, 512, (ctx, W, H) => { ctx.clearRect(0, 0, W, H); const r = rng(seed); for (let i = 0; i < n; i++) { const x = r.f() * W, y = H * 0.12 + r.f() * H * 0.76; const g = ctx.createRadialGradient(x, y, 0, x, y, 6 + r.f() * 14); g.addColorStop(0, 'rgba(255,220,140,0.95)'); g.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = g; ctx.fillRect(x - 20, y - 20, 40, 40); } }); }

// ======================= FLIGHT: Dave flying head-first along -z =======================
// ctx: speed (0..1 streak intensity), ahead (0..1 forward dot), aheadBlue (0..1), sparks (0..1), tingle (0..1), sorry (0..1), eyes ('open'|'closed'), watch (text), wide, open, cakeVis, dim (0..1 darkens Dave: nothing behind), xray (0..1 Dave glows violet)
export function buildFlight() {
  const { scene, cam, stars } = spaceScene();
  const key = new THREE.DirectionalLight(0xfff6e8, 2.0); key.position.set(2, 6, -5); scene.add(key); const fill = new THREE.AmbientLight(0x3a4a7a, 0.9); scene.add(fill); const fill2 = new THREE.DirectionalLight(0xcfe0ff, 0.9); fill2.position.set(-5, 3, 3); scene.add(fill2); const rim = new THREE.DirectionalLight(0x9fd0ff, 1.6); rim.position.set(-3, 2, -10); scene.add(rim);
  const dave = makeDaveL(); scene.add(dave.g); dave.g.rotation.x = -Math.PI / 2; dave.g.position.set(0, 0, 0.7);
  // streaks
  const N = 420; const pos = new Float32Array(N * 6); const col = new Float32Array(N * 6); const meta = []; const r = rng(41);
  for (let i = 0; i < N; i++) { const a = r.f() * Math.PI * 2, rad = 2.2 + Math.pow(r.f(), 0.6) * 34; meta.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad, z0: r.range(-120, 40), sp: r.range(0.7, 1.3), w: r.f() }); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 })); lines.frustumCulled = false; scene.add(lines);
  const ahead = glowSprite(0xffffff, 60, 0); ahead.position.set(0, 0, -220); scene.add(ahead); const ahead2 = glowSprite(0x9fd0ff, 160, 0); ahead2.position.set(0, 0, -230); scene.add(ahead2);
  const sparks = []; for (let i = 0; i < 26; i++) { const s = glowSprite(i % 3 ? 0xffffff : 0xbfe3ff, 0.5, 0); s.userData = { ph: r.f(), x: r.range(-0.45, 0.45), y: r.range(-0.3, 0.5), z: r.range(-1.9, 0.6) }; scene.add(s); sparks.push(s); }
  const tingles = []; for (let i = 0; i < 8; i++) { const pts = []; for (let k = 0; k < 7; k++) pts.push(new THREE.Vector3(k * 0.05, (k % 2 ? 0.05 : -0.05), 0)); const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0 })); l.userData.ph = r.f() * 6; scene.add(l); tingles.push(l); }
  const sorries = []; for (let i = 0; i < 4; i++) { const l = lbl(['sorry', 'sorry!', 'so sorry', 'sorry…'][i], 0.9, 0.3, { fg: '#ffffff', font: 'italic 80px serif' }); l.material.transparent = true; l.material.opacity = 0; scene.add(l); sorries.push(l); }
  const halo = glowSprite(0xc8a0ff, 2.6, 0); scene.add(halo);
  const S = { scene, cam, actors: { dave, lines } };
  S.update = (t, c) => {
    const sp = c.speed ?? 1; dave.setPose('fly', t); dave.g.rotation.set(-Math.PI / 2 + Math.sin(t * 0.7) * 0.02, 0, Math.sin(t * 0.5) * 0.03); dave.g.position.set(0, Math.sin(t * 1.1) * 0.03, 0.7);
    if (c.kick) { const w = Math.sin(t * 16); dave.legL.rotation.x = w * 0.8; dave.legR.rotation.x = -w * 0.8; dave.legL.userData.knee.rotation.x = Math.max(0, -w) * 1.1; dave.legR.userData.knee.rotation.x = Math.max(0, w) * 1.1; }
    if (c.look === 'back') { dave.neck.rotation.x = -0.4; dave.neck.rotation.y = 1.1; } if (c.look === 'watch') { dave.neck.rotation.x = -0.6; dave.neck.rotation.y = 0.5; dave.armR.rotation.set(-1.4, 0, -0.1); }
    if (c.neckX !== undefined) dave.neck.rotation.x = c.neckX; face(dave, { wide: c.wide ?? 0, open: c.open ?? 0, smile: !!c.smile }); blink(dave, c.eyes === 'closed' ? 1 : 0); dave.cake.visible = c.cakeVis !== false; dave.watch.userData.set(c.watch || '18:58:00');
    const L = 1.5 + sp * sp * 90; const blue = c.aheadBlue ?? 0;
    for (let i = 0; i < N; i++) { const m = meta[i]; let z = m.z0 + ((t * (40 + 400 * sp) * m.sp) % 200); z = ((z + 140) % 200) - 140; pos[i * 6] = m.x; pos[i * 6 + 1] = m.y; pos[i * 6 + 2] = z; pos[i * 6 + 3] = m.x; pos[i * 6 + 4] = m.y; pos[i * 6 + 5] = z + L; const cc = [1, 1 - blue * 0.25, 1 - blue * 0.05 + 0.0]; const dimz = clamp(1 - (z + 20) / 60, 0.25, 1); for (let k = 0; k < 2; k++) { col[i * 6 + k * 3] = cc[0] * dimz * (0.6 + m.w * 0.4); col[i * 6 + k * 3 + 1] = cc[1] * dimz * (0.6 + m.w * 0.4); col[i * 6 + k * 3 + 2] = cc[2] * dimz; } }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; lines.material.opacity = 0.25 + 0.7 * sp;
    const ah = c.ahead ?? sp; ahead.material.opacity = ah * 0.9; ahead.material.color.setHex(blue > 0.5 ? 0xf0e8ff : 0xffffff); ahead.scale.setScalar(40 + ah * 40); ahead2.material.opacity = ah * 0.55; ahead2.material.color.lerpColors(new THREE.Color(0xffd9a0), new THREE.Color(0x9fd0ff), blue); ahead2.scale.setScalar(120 + ah * 80);
    stars.forEach(s => s.material.opacity = 0.9 * (1 - sp * 0.6));
    const sk = c.sparks ?? 0; sparks.forEach((s, i) => { const life = (t * 3.2 + s.userData.ph) % 1; s.material.opacity = 0.6 * sk * (1 - life) * (life < 0.08 ? life / 0.08 : 1); s.scale.setScalar(0.04 + life * 0.14); s.position.set(s.userData.x, s.userData.y + 0.1, s.userData.z + 0.7 - life * 1.2); });
    const tk = c.tingle ?? 0; tingles.forEach((l, i) => { l.material.opacity = tk * (0.4 + 0.6 * Math.max(0, Math.sin(t * 9 + l.userData.ph))); const a = i / 8 * Math.PI * 2 + t * 0.5; l.position.set(Math.cos(a) * 0.55, 0.25 + Math.sin(a) * 0.45, -0.6 + Math.sin(t * 2 + i) * 0.5); l.rotation.z = a; });
    const sy = c.sorry ?? 0; sorries.forEach((l, i) => { const k = sy > 0 ? ((t * 0.45 + i * 0.25) % 1) : 0; l.material.opacity = sy > 0 ? (1 - k) * 0.9 : 0; l.position.set(-0.3 + i * 0.25 - k * 0.6, 0.3 + i * 0.1 + k * 0.4, 1.6 + k * 4.5 + i * 0.3); l.scale.setScalar(1 + k * 1.5); l.lookAt(cam.position); });
    const xr = c.xray ?? 0; halo.material.opacity = xr * 0.6; halo.position.set(0, 0.2, -0.9); halo.scale.setScalar(2.2 + xr); rim.intensity = 1.6 + xr * 3; rim.color.setHex(xr > 0 ? 0xd0a8ff : 0x9fd0ff);
    const dim = c.dim ?? 0; key.intensity = 2.0 * (1 - dim * 0.7); fill.intensity = 0.9 * (1 - dim * 0.6);
  };
  return S;
}

// ======================= PLANET flyby / U-turn =======================
// ctx: which ('earth'|'moon'|'jupiter'|'pluto'), mode ('pass'|'leave'|'uturn'), k (0..1 head of the streak), label (text), sub (text), lights (0..1 earth city lights), spin, daveScale, sunX
export function buildPlanet() {
  const { scene, cam } = spaceScene(20000);
  const sun = new THREE.DirectionalLight(0xfff6e8, 2.6); sun.position.set(200, 60, 160); scene.add(sun); scene.add(new THREE.AmbientLight(0x30405a, 0.9));
  const R = 10; const P = {};
  const earth = makeEarth(R); earth.rotation.z = 0.3; scene.add(earth); P.earth = earth;
  const lightsT = dottedTex(420); const lights = new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, 48, 32), new THREE.MeshBasicMaterial({ map: lightsT, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending })); earth.add(lights);
  const moonSmall = new THREE.Mesh(new THREE.SphereGeometry(2.7, 32, 24), texMat({ map: moonTex() })); moonSmall.position.set(42, 7, -14); scene.add(moonSmall);
  const mk = (tex, rad = R) => { const m = new THREE.Mesh(new THREE.SphereGeometry(rad, 48, 32), texMat({ map: tex })); m.castShadow = false; scene.add(m); return m; };
  P.moon = mk(moonTex()); P.jupiter = mk(jupiterTex(), R * 1.25); P.pluto = mk(plutoTex(), R * 0.85);
  const charon = new THREE.Mesh(new THREE.SphereGeometry(R * 0.42, 32, 24), texMat({ map: moonTex() })); charon.position.set(-26, 6, -30); scene.add(charon);
  const jglow = glowSprite(0xffd9a0, R * 3.4, 0.18); scene.add(jglow); const eglow = glowSprite(0x6fb6ff, R * 3.0, 0.3); scene.add(eglow);
  // streak: trail beads + head Dave
  const beads = []; for (let i = 0; i < 40; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.5 * (1 - i / 44), 8, 6), new THREE.MeshBasicMaterial({ color: i < 6 ? 0xffffff : 0xffe6a0, transparent: true, opacity: 1 - i / 42 })); scene.add(b); beads.push(b); }
  const headGlow = glowSprite(0xffffff, 7, 0.9); scene.add(headGlow); const headGlow2 = glowSprite(0xfff0c0, 18, 0.45); scene.add(headGlow2);
  const dave = makeDaveL(); scene.add(dave.g); dave.g.scale.setScalar(1.0);
  const big = dynLbl(16, 4, { fg: '#f2c85b', font: 'bold 150px sans-serif', text: '1.3 S', pw: 1024, ph: 256 }); scene.add(big); const sub = dynLbl(16, 2.2, { fg: '#ffffff', font: 'bold 58px sans-serif', text: '', pw: 1024, ph: 140 }); scene.add(sub);
  const skidMarks = []; for (let i = 0; i < 10; i++) { const s = softSprite(0xffd080, 1.4, 0); scene.add(s); skidMarks.push(s); }
  const path = (mode, u) => {
    if (mode === 'leave') return new THREE.Vector3(lerp(2, 40, u), lerp(R * 0.98, 8, u), lerp(R * 0.3, -12, u));
    if (mode === 'uturn') { const Rr = 13; if (u < 0.35) { const k = u / 0.35; return new THREE.Vector3(Rr, 2, lerp(90, 0, k)); } if (u < 0.65) { const a = (u - 0.35) / 0.3 * Math.PI; return new THREE.Vector3(Math.cos(a) * Rr, 2, Math.sin(a) * Rr); } const k = (u - 0.65) / 0.35; return new THREE.Vector3(-Rr, 2, lerp(0, 90, k)); }
    return new THREE.Vector3(lerp(-80, 80, u), c_y, 16);
  }; let c_y = 3;
  const S = { scene, cam, actors: { dave, earth } };
  S.update = (t, c) => {
    const which = c.which || 'earth'; Object.entries(P).forEach(([k, m]) => m.visible = k === which); moonSmall.visible = which === 'earth' && c.moonVis !== false; charon.visible = which === 'pluto'; jglow.visible = which === 'jupiter'; eglow.visible = which === 'earth'; lights.material.opacity = c.lights ?? 1;
    const spin = c.spin ?? 0.03; earth.rotation.y = t * spin; P.moon.rotation.y = t * spin * 0.5; P.jupiter.rotation.y = t * spin * 2; P.pluto.rotation.y = -Math.PI / 2 + 0.3 + t * spin * 0.3; charon.rotation.y = t * spin * 0.5;
    sun.position.set((c.sunX ?? 1) * 200, 60, (c.sunZ ?? 1) * 160);
    const mode = c.mode || 'pass'; c_y = c.pathY ?? 3; const k = c.k ?? 0.5; const head = path(mode, k);
    beads.forEach((b, i) => { const u = k - i * (mode === 'uturn' ? 0.012 : 0.009); b.visible = u > 0 && k > 0; if (b.visible) b.position.copy(path(mode, u)); });
    const ahead = path(mode, Math.min(1, k + 0.01)); const dir = ahead.clone().sub(head).normalize(); dave.g.visible = k > 0 && k < 1 && c.daveVis !== false; dave.g.position.copy(head); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); dave.g.quaternion.copy(q); dave.g.rotateY(c.daveYaw ?? 0); dave.setPose('fly', t); dave.g.scale.setScalar(c.daveScale ?? 1.0); face(dave, { wide: c.wide ?? 0.2, open: c.open ?? 0.1 }); dave.watch.userData.set(c.watch || '18:58:00');
    headGlow.position.copy(head); headGlow2.position.copy(head); headGlow.material.opacity = k > 0 && k < 1 ? 0.9 : 0; headGlow2.material.opacity = k > 0 && k < 1 ? 0.45 : 0; headGlow.scale.setScalar((c.daveScale ?? 1) * 7); headGlow2.scale.setScalar((c.daveScale ?? 1) * 18);
    big.userData.set(c.label || ''); sub.userData.set(c.sub || ''); const lp = c.labelPos || [0, R * 1.7, 0]; big.position.set(...lp); sub.position.set(lp[0], lp[1] - 2.8, lp[2]); big.lookAt(cam.position); sub.lookAt(cam.position); big.visible = !!c.label; sub.visible = !!c.sub; big.scale.setScalar(c.labelScale ?? 1); sub.scale.setScalar(c.labelScale ?? 1);
    skidMarks.forEach((s, i) => { const sk = c.skid ?? 0; s.material.opacity = sk > 0 ? 0.6 * sk * (1 - i / 10) : 0; const a = (0.35 + 0.3 * (i / 10)); const p = path('uturn', a); s.position.copy(p).add(new THREE.Vector3(0, -0.5, 0)); s.scale.setScalar(1.2 + i * 0.3); });
  };
  return S;
}

// ======================= SOLAR SYSTEM MAP =======================
// ctx: k (0..1 trail Earth→Pluto), stamps (bool), squash (0..1), uturn (bool), noScale (bool)
export function buildSystem() {
  const { scene, cam } = spaceScene(20000); scene.add(new THREE.AmbientLight(0xffffff, 1.2)); const sunL = new THREE.PointLight(0xfff0c0, 2, 400, 1); scene.add(sunL);
  const G = new THREE.Group(); scene.add(G);
  const sunG = glowSprite(0xffe08a, 16, 1); G.add(sunG); const sunG2 = glowSprite(0xffffff, 6, 1); G.add(sunG2);
  const planets = [['MERCURY', 6, 0.35, 0x9a9a9a, 2.2], ['VENUS', 9, 0.6, 0xe8c48a, 3.4], ['EARTH', 12, 0.65, 0x3f7fb8, 0], ['MARS', 15, 0.45, 0xc0552a, 4.4], ['JUPITER', 22, 1.8, 0xd9b78a, 0], ['SATURN', 29, 1.5, 0xe8d2a0, 2.6], ['URANUS', 35, 1.0, 0x9fd0e0, 2.8], ['NEPTUNE', 41, 1.0, 0x3b5cc8, 3.9], ['PLUTO', 47, 0.4, 0xd4b090, 0]];
  const ringM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, side: THREE.DoubleSide });
  const bodies = {};
  planets.forEach(([n, rad, s, col, ang]) => { const ring = new THREE.Mesh(new THREE.RingGeometry(rad - 0.05, rad + 0.05, 128), ringM); ring.rotation.x = -Math.PI / 2; G.add(ring); const p = new THREE.Mesh(new THREE.SphereGeometry(s, 20, 14), M(col)); p.position.set(Math.cos(ang) * rad, 0, -Math.sin(ang) * rad); G.add(p); const l = lbl(n, 4.2, 0.9, { fg: '#ffffff', font: 'bold 64px sans-serif' }); l.position.set(p.position.x, 0.1, p.position.z + 2.0); l.rotation.x = -Math.PI / 2; G.add(l); bodies[n] = p; if (n === 'SATURN') { const rr = new THREE.Mesh(new THREE.RingGeometry(2.0, 3.2, 48), new THREE.MeshBasicMaterial({ color: 0xd8c8a0, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })); rr.rotation.x = -Math.PI / 2 + 0.4; rr.position.copy(p.position); G.add(rr); } });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), M(0xbbbbbb)); moon.position.set(13.1, 0, 0); G.add(moon);
  const beads = []; for (let i = 0; i < 44; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.42 * (1 - i / 50), 8, 6), new THREE.MeshBasicMaterial({ color: i < 5 ? 0xffffff : 0xffe6a0 })); G.add(b); beads.push(b); }
  const headGlow = glowSprite(0xffffff, 5, 0.9); G.add(headGlow);
  const stamps = [['MOON · 1.3 S', 13.1, 2.6], ['JUPITER · 40 MIN', 22, 3.6], ['PLUTO · 4 H 53 MIN', 47, 3.6]].map(([tx, x, y]) => { const l = lbl(tx, 8.5, 1.4, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 60px sans-serif', pw: 1024 }); l.position.set(x, y, 0); l.visible = false; G.add(l); return { l, x }; });
  const ns = lbl('NOT TO SCALE · DAVE’S ROUTE', 11, 1.0, { fg: 'rgba(255,255,255,0.8)', font: 'bold 56px sans-serif', pw: 1024 }); ns.position.set(26, 0.1, 10); ns.rotation.x = -Math.PI / 2; G.add(ns);
  const div = lbl('÷ 707', 10, 3.2, { fg: '#f2c85b', font: 'bold 150px sans-serif' }); div.position.set(30, 7, -6); div.visible = false; G.add(div);
  // U-turn arrow at Pluto + sign
  const arc = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.22, 8, 32, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffd080 })); arc.position.set(47, 0.2, -2.2); arc.rotation.x = -Math.PI / 2; arc.rotation.z = Math.PI / 2; arc.visible = false; G.add(arc);
  const arrowHead = cone(0.6, 1.2, M(0xffd080), 8, 47 - 2.2, 0.2, -2.2 + 2.2); arrowHead.rotation.x = Math.PI / 2; arrowHead.visible = false; G.add(arrowHead);
  const sign = lbl('← EARTH · 4.9 LIGHT-HOURS', 10, 1.5, { bg: '#2b5c9e', fg: '#ffffff', font: 'bold 60px sans-serif', pw: 1024 }); sign.position.set(42, 4.6, -4); sign.visible = false; G.add(sign);
  const S = { scene, cam, actors: { bodies } };
  S.update = (t, c) => {
    const k = c.k ?? 0; const x0 = 12, x1 = 47; beads.forEach((b, i) => { const u = k - i * 0.012; b.visible = u > 0 && k > 0; b.position.set(lerp(x0, x1, Math.max(0, u)), 0.5, 0); });
    headGlow.position.set(lerp(x0, x1, k), 0.5, 0); headGlow.visible = k > 0 && k < 0.999;
    const hx = lerp(x0, x1, k); stamps.forEach(s => { s.l.visible = !!c.stamps && hx >= s.x - 0.3; s.l.lookAt(cam.position); });
    const sq = c.squash ?? 0; G.scale.set(lerp(1, 0.04, sq), 1, 1); div.visible = sq > 0.05; div.scale.set(1 / Math.max(0.04, G.scale.x), 1, 1); div.lookAt(cam.position);
    ns.visible = c.noScale !== false && sq < 0.05;
    arc.visible = arrowHead.visible = sign.visible = !!c.uturn; if (c.uturn) sign.lookAt(cam.position);
    sunG.material.opacity = 1; bodies.EARTH.rotation.y = t * 0.3;
  };
  return S;
}

// ======================= POV: Dave's eyes (aberration + Doppler) =======================
// ctx: beta (0..0.999999), rear (bool), pluto (0..1: length contraction, Pluto rushes closer), arms (bool), dot (0..1 extra forward glow), blackout (0..1)
export function buildPov() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000002); const cam = new THREE.PerspectiveCamera(70, 1080 / 1920, 0.05, 5000);
  scene.add(new THREE.AmbientLight(0xffffff, 0.8)); const key = new THREE.DirectionalLight(0xfff6e8, 1.6); key.position.set(0, 2, -3); scene.add(key);
  const N = 2600; const pos = new Float32Array(N * 3); const col = new Float32Array(N * 3); const dirs = []; const r = rng(53);
  for (let i = 0; i < N; i++) { const th = r.f() * Math.PI * 2, ph = Math.acos(2 * r.f() - 1); dirs.push({ d: new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)), b: 0.5 + r.f() * 0.5, c: r.f() < 0.2 ? [1, 0.85, 0.6] : r.f() < 0.1 ? [0.7, 0.8, 1] : [1, 1, 1] }); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 3.4, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 0.95, depthWrite: false })); pts.frustumCulled = false; scene.add(pts);
  const dot = glowSprite(0xffffff, 30, 0); dot.position.set(0, 0, -400); scene.add(dot); const dot2 = glowSprite(0xc8b0ff, 90, 0); dot2.position.set(0, 0, -410); scene.add(dot2);
  const pluto = new THREE.Mesh(new THREE.SphereGeometry(8, 32, 24), texMat({ map: plutoTex() })); pluto.position.set(2, 1, -400); scene.add(pluto); const sunDot = glowSprite(0xffffff, 4, 0.9); sunDot.position.set(-30, 10, -600); scene.add(sunDot);
  // Dave's arms + cake in the foreground
  const arms = new THREE.Group(); scene.add(arms); const sleeve = (sx) => { const a = new THREE.Group(); a.add(box(0.11, 0.11, 0.55, M(0xe0a526), 0, 0, -0.27)); a.add(ico(0.07, M(0xf1c9a5), 1, 0, 0, -0.58)); a.position.set(sx * 0.28, -0.22, -0.25); a.rotation.y = -sx * 0.12; arms.add(a); return a; }; sleeve(-1); const ra = sleeve(1); const cakeG = new THREE.Group(); cakeG.add(box(0.36, 0.14, 0.36, M(0xf6ecdc), 0, 0.07, 0)); cakeG.add(box(0.37, 0.03, 0.08, M(0xd9534f), 0, 0.14, 0)); cakeG.add(box(0.08, 0.03, 0.37, M(0xd9534f), 0, 0.14, 0)); cakeG.position.set(-0.3, -0.3, -0.75); arms.add(cakeG);
  const S = { scene, cam, actors: {} };
  const tmp = new THREE.Vector3(), perp = new THREE.Vector3();
  S.update = (t, c) => {
    const beta = clamp(c.beta ?? 0, 0, 0.9999995); const gamma = 1 / Math.sqrt(1 - beta * beta); const rear = !!c.rear;
    for (let i = 0; i < N; i++) { const s = dirs[i]; const cosT = -s.d.z; // angle from forward (-z)
      const cosT2 = (cosT + beta) / (1 + beta * cosT); const sinT2 = Math.sqrt(Math.max(0, 1 - cosT2 * cosT2)); perp.copy(s.d).addScaledVector(FWD, -cosT); const pl = perp.length(); if (pl > 1e-6) perp.multiplyScalar(1 / pl); else perp.set(1, 0, 0);
      tmp.copy(FWD).multiplyScalar(cosT2).addScaledVector(perp, sinT2).multiplyScalar(400); pos[i * 3] = tmp.x; pos[i * 3 + 1] = tmp.y; pos[i * 3 + 2] = tmp.z;
      const D = 1 / (gamma * (1 - beta * cosT2)); // observed/emitted frequency ratio
      const lg = Math.log10(Math.max(1e-6, D)); let rr, gg, bb; const br = s.b * clamp(Math.pow(D, 1.2), 0, 3) * (1 - (c.blackout ?? 0));
      if (lg < 0) { const k = clamp(-lg / 1.2, 0, 1); rr = 1; gg = 0.6 * (1 - k); bb = 0.4 * (1 - k); } else if (lg < 0.35) { const k = lg / 0.35; rr = 1 - 0.3 * k; gg = 1 - 0.15 * k; bb = 1; } else if (lg < 1.2) { const k = (lg - 0.35) / 0.85; rr = 0.7 + 0.1 * k; gg = 0.85 - 0.5 * k; bb = 1; } else { rr = 0.95; gg = 0.9; bb = 1; }
      col[i * 3] = s.c[0] * rr * br; col[i * 3 + 1] = s.c[1] * gg * br; col[i * 3 + 2] = s.c[2] * bb * br; }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    const dk = (c.dot ?? 0) * (1 - (c.blackout ?? 0)); dot.material.opacity = dk * 0.95; dot.scale.setScalar(20 + dk * 50); dot2.material.opacity = dk * 0.6; dot2.scale.setScalar(60 + dk * 160);
    const pk = c.pluto ?? -1; pluto.visible = pk >= 0; if (pluto.visible) { const d = lerp(300, 18, smooth(pk)); pluto.position.set(2 + 1 * (1 - pk), 1.5, -d); pluto.rotation.y = -Math.PI / 2 + 0.3; } sunDot.visible = !rear && !c.hideSun;
    arms.visible = c.arms !== false && !rear; arms.position.y = Math.sin(t * 1.3) * 0.01; cakeG.rotation.y = Math.sin(t * 0.9) * 0.05;
    pts.material.size = 3.4 - 1.0 * beta;
  };
  return S;
}

// ======================= CITY (aerial) with streak + pins =======================
// ctx: dark (0..1), streak (0..1), pins (bool), mode (city traffic), spinSun (time-lapse)
export function buildCityL() {
  const S = buildCity(); const upd = S.update; const { scene } = S;
  const streak = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 260, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); streak.rotation.z = Math.PI / 2; streak.position.set(0, 3.5, -3); scene.add(streak);
  const sg = glowSprite(0xfff0c0, 40, 0); sg.position.set(0, 3.5, -3); scene.add(sg);
  const pin = (x, z, text, col) => { const g = new THREE.Group(); const c = cone(3.2, 8, M(col), 8, 0, 4, 0); c.rotation.x = Math.PI; g.add(c); g.add(ico(3.4, M(col), 1, 0, 10.4, 0)); const l = lbl(text, 30, 6, { bg: '#' + new THREE.Color(col).getHexString(), fg: '#ffffff', font: 'bold 80px sans-serif', pw: 1024 }); l.position.set(0, 18, 0); g.add(l); g.position.set(x, 12, z); g.userData.l = l; scene.add(g); return g; };
  const pinD = pin(-48, 28, 'DAVE', 0xe0a526); const pinR = pin(42, -26, 'THE RESTAURANT', 0xc0392b);
  const dots = []; for (let i = 1; i < 14; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); d.position.set(lerp(-48, 42, i / 14), 16, lerp(28, -26, i / 14)); scene.add(d); dots.push(d); }
  const km = lbl('3 KM', 18, 4.6, { bg: '#f2c85b', fg: '#1b1b1b', font: 'bold 90px sans-serif' }); km.position.set(-3, 26, 1); scene.add(km);
  const lamps = []; const r = rng(3); for (let i = 0; i < 80; i++) { const s = glowSprite(0xffd98a, 5, 0); s.position.set(r.range(-90, 90), 1.5, r.range(-90, 90)); scene.add(s); lamps.push(s); }
  S.update = (t, c) => { upd(t, c); const dk = c.dark ?? 0.55; S.setSky(dk); S.hemi.intensity = 0.75 - 0.3 * dk; S.sun.intensity = 2.4 - 1.6 * dk; lamps.forEach(s => s.material.opacity = clamp((dk - 0.4) * 2, 0, 0.9));
    const sk = c.streak ?? 0; streak.material.opacity = sk * 0.9; sg.material.opacity = sk * 0.8; sg.scale.set(260, 30, 1); streak.visible = sk > 0; sg.visible = sk > 0;
    const pins = !!c.pins; [pinD, pinR].forEach(p => { p.visible = pins; p.position.y = 14 + Math.sin(t * 2) * 0.8; p.userData.l.lookAt(S.cam.position); }); dots.forEach((d, i) => d.visible = pins && (c.dotsK === undefined || i / 14 <= c.dotsK)); km.visible = pins && (c.dotsK === undefined || c.dotsK > 0.9); km.lookAt(S.cam.position);
    if (c.sunAng !== undefined) { S.sunOffset = new THREE.Vector3(Math.cos(c.sunAng) * 120, Math.max(8, Math.sin(c.sunAng) * 120), 60); }
  };
  return S;
}
