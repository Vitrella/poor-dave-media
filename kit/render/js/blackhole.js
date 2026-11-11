import * as THREE from 'three';
import { mat, box, cyl, ico, cone, plane, rng, lerp, clamp, smooth, easeOut, easeIn, prog, emis, canvasTex, texMat, bakeStatic, softSprite, glowSprite, makeStars, checkerTex } from './util.js';
import { M, FAB, Person } from './kit.js';
import { baseSet } from './sets.js';
import { makeDave, makePriya } from './water.js';
import { buildStudio } from './world.js';
import { lbl } from './ice.js';
import { face } from './plastic.js';

const GOLD = 0xf2c85b;
function dynLbl(w, h, o = {}) { const c = document.createElement('canvas'); c.width = o.pw || 512; c.height = o.ph || 128; const ctx = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.LinearFilter; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: !o.bg, side: THREE.DoubleSide })); m.userData.last = null; m.userData.set = (text) => { if (text === m.userData.last) return; m.userData.last = text; ctx.clearRect(0, 0, c.width, c.height); if (o.bg) { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, c.width, c.height); } ctx.fillStyle = o.fg || '#fff'; ctx.font = o.font || 'bold 64px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, c.width / 2, c.height / 2); t.needsUpdate = true; }; m.userData.set(o.text || ''); return m; }
// a Dave whose materials are private, so he can be tinted red and faded
function makeDaveTint() { const d = makeDave(); const mats = []; d.g.traverse(o => { if (o.isMesh && o.material) { o.material = o.material.clone(); o.material.userData.base = o.material.color.clone(); mats.push(o.material); } }); d.tint = (red = 0, fade = 0) => { mats.forEach(mm => { mm.color.copy(mm.userData.base).lerp(new THREE.Color(0xff3020), red).multiplyScalar(1 - fade); if (mm.emissive) { mm.emissive.setHex(0xff2010).multiplyScalar(red * 0.4 * (1 - fade)); } mm.transparent = fade > 0; mm.opacity = 1 - fade * 0.85; }); }; return d; }
function makeHelmet() { const h = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), mat(0xcfe8ff, { transparent: true, opacity: 0.22 })); h.castShadow = false; return h; }
// phone with a dynamic screen; state: 'draft' (typing), 'sending', 'sent?'
export function makePhone() { const g = new THREE.Group(); g.add(box(0.1, 0.19, 0.012, M(0x1b1b1b), 0, 0, 0)); const c = document.createElement('canvas'); c.width = 256; c.height = 480; const ctx = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.LinearFilter; const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.175), new THREE.MeshBasicMaterial({ map: t, color: 0x8c8c8c })); scr.position.z = 0.0065; scr.rotation.z = Math.PI; g.add(scr); let last = '';
  g.userData.set = (mode, k = 0, tt = 0) => { const key = mode + '|' + Math.round(k * 40) + '|' + Math.floor(tt * 3); if (key === last) return; last = key; ctx.fillStyle = '#dfe3ea'; ctx.fillRect(0, 0, 256, 480); ctx.fillStyle = '#2b3a55'; ctx.fillRect(0, 0, 256, 70); ctx.fillStyle = '#fff'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Priya ♥', 128, 45); ctx.textAlign = 'left'; ctx.fillStyle = '#dfe6f0'; ctx.beginPath(); ctx.roundRect(14, 100, 180, 60, 16); ctx.fill(); ctx.fillStyle = '#1b1b1b'; ctx.font = '22px sans-serif'; ctx.fillText('cake?? which one', 26, 137); const msg = 'Lemon or Victoria sponge?'; const n = Math.round(msg.length * clamp(k, 0, 1)); const shown = msg.slice(0, n); ctx.fillStyle = '#2f80ed'; ctx.beginPath(); ctx.roundRect(40, 200, 200, 110, 16); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '24px sans-serif'; const words = shown.split(' '); let line = '', y = 238; for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > 170) { ctx.fillText(line, 54, y); line = w; y += 30; } else line = test; } ctx.fillText(line, 54, y); if (mode === 'draft') { if (Math.floor(tt * 3) % 2 === 0) ctx.fillRect(54 + ctx.measureText(line).width + 4, y - 20, 3, 26); } if (mode === 'sending') { ctx.fillStyle = '#6b7280'; ctx.font = 'italic 22px sans-serif'; const dots = '.'.repeat(1 + Math.floor(tt * 3) % 3); ctx.fillText('Sending' + dots, 110, 345); ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(80, 338, 12, tt * 6, tt * 6 + 4.5); ctx.stroke(); } if (mode === 'forever') { ctx.fillStyle = '#6b7280'; ctx.font = 'italic 22px sans-serif'; ctx.fillText('Sending...', 110, 345); ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(80, 338, 12, tt * 6, tt * 6 + 4.5); ctx.stroke(); ctx.fillStyle = '#c0392b'; ctx.font = 'bold 26px sans-serif'; ctx.fillText('ETA: NEVER', 60, 400); } ctx.fillStyle = '#9aa1a8'; ctx.font = '18px sans-serif'; ctx.textAlign = 'right'; ctx.fillText(mode === 'draft' ? '▮ 1 bar' : '▮ 0 bars', 240, 30); ctx.textAlign = 'left'; t.needsUpdate = true; };
  g.userData.set('draft', 0, 0); return g; }

// black hole model: black sphere, accretion disc (gradient ring), photon ring, lensed halo arcs
export function makeBlackHole(R = 10) {
  const g = new THREE.Group();
  const hole = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })); g.add(hole);
  const discTex = canvasTex(512, 64, (ctx, w, h) => { const gr = ctx.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,230,150,1)'); gr.addColorStop(0.35, 'rgba(255,140,40,0.95)'); gr.addColorStop(0.7, 'rgba(200,60,20,0.6)'); gr.addColorStop(1, 'rgba(120,20,10,0)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h); const r = rng(4); ctx.globalAlpha = 0.25; for (let i = 0; i < 80; i++) { ctx.fillStyle = r.f() < 0.5 ? '#000' : '#fff'; ctx.fillRect(r.f() * w, r.f() * h, 2 + r.f() * 14, 1 + r.f() * 3); } ctx.globalAlpha = 1; });
  // ring geometry UVs go around; we want the gradient radial -> remap UVs so u = radial fraction
  const rg = new THREE.RingGeometry(R * 1.25, R * 3.4, 96, 1); { const pos = rg.attributes.position, uv = rg.attributes.uv; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); const rr = Math.hypot(x, y); uv.setXY(i, (rr - R * 1.25) / (R * 2.15), 0.5); } }
  const disc = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: discTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); disc.rotation.x = -Math.PI / 2 + 0.18; g.add(disc);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(R * 1.12, R * 0.09, 8, 96), new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(halo); g.userData.halo = halo;
  const arcTop = new THREE.Mesh(new THREE.TorusGeometry(R * 1.3, R * 0.16, 8, 64, Math.PI), new THREE.MeshBasicMaterial({ color: 0xffb060, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })); arcTop.rotation.z = 0; g.add(arcTop);
  const arcBot = arcTop.clone(); arcBot.rotation.z = Math.PI; arcBot.scale.set(0.85, 0.6, 1); g.add(arcBot);
  const glow = glowSprite(0xffc070, R * 5, 0.10); g.add(glow);
  const glow2 = glowSprite(0xfff4e0, R * 2.6, 0.16); g.add(glow2);
  g.userData.R = R; g.userData.disc = disc; g.userData.arcs = [arcTop, arcBot]; g.userData.glows = [glow, glow2];
  return g;
}
function spaceScene() { const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000004); const cam = new THREE.PerspectiveCamera(42, 1080 / 1920, 0.1, 80000); const s1 = makeStars(1800, 2600, 3); s1.material.opacity = 0.9; s1.material.size = 2.4; scene.add(s1); const s2 = makeStars(1800, 2600, 4); s2.rotation.z = Math.PI; s2.material.opacity = 0.9; s2.material.size = 2.4; scene.add(s2); const s3 = makeStars(600, 2500, 5); s3.rotation.x = Math.PI / 2; s3.material.size = 3.6; s3.material.opacity = 0.8; scene.add(s3); return { scene, cam }; }

// ======================= FLOAT: Dave drifting in space with his phone =======================
// ctx: phone ('draft'|'sending'|'forever'), typeK 0..1, daveLook ('phone'|'cam'|'hole'), wide/open/smile, stretch (1..), tint 0..1, fade 0..1, holeK (bool: hole visible), thumbs (bool), flash
export function buildFloat() {
  const { scene, cam } = spaceScene();
  const sun = new THREE.DirectionalLight(0xfff6e8, 2.2); sun.position.set(60, 40, 80); scene.add(sun); scene.add(new THREE.AmbientLight(0x3a4a7a, 0.9));
  const rim = new THREE.DirectionalLight(0xff9a40, 1.4); rim.position.set(-40, 10, -60); scene.add(rim);
  const dave = makeDaveTint(); scene.add(dave.g); const helmet = makeHelmet(); helmet.position.set(0, 0.2, 0); dave.neck.add(helmet);
  const phone = makePhone(); dave.armR.add(phone); phone.position.set(0.02, -0.62, 0.1); phone.rotation.x = -1.1; phone.rotation.y = 0.2;
  const hole = makeBlackHole(10); hole.position.set(-40, 27, -120); scene.add(hole);
  const dust = []; const r = rng(9); for (let i = 0; i < 40; i++) { const s = softSprite(0xffffff, r.range(0.04, 0.12), 0.5); s.position.set(r.range(-4, 4), r.range(-3, 4), r.range(-4, 2)); s.userData.ph = r.f() * 6; scene.add(s); dust.push(s); }
  const S = { scene, cam, actors: { dave, phone, hole } };
  S.update = (t, c) => {
    dave.g.position.set(0, 0, 0); dave.g.rotation.set(-0.15 + Math.sin(t * 0.5) * 0.04, 0.1, 0.08 + Math.sin(t * 0.4) * 0.03); dave.pose('stand', 0);
    dave.legL.rotation.x = -0.3 + Math.sin(t * 0.7) * 0.05; dave.legR.rotation.x = -0.15; dave.legL.userData.knee.rotation.x = 0.4; dave.legR.userData.knee.rotation.x = 0.3;
    dave.armR.rotation.x = -1.35; dave.armR.rotation.z = -0.25; dave.armL.rotation.x = -1.05; dave.armL.rotation.z = 0.45; if (c.thumbs) { dave.armL.rotation.x = -1.3 + Math.sin(t * 14) * 0.05; }
    const dl = c.daveLook || 'phone'; dave.neck.rotation.set(0, 0, 0); if (dl === 'phone') { dave.neck.rotation.x = 0.5; dave.neck.rotation.y = 0.2; } else if (dl === 'cam') { dave.neck.rotation.x = -0.02; } else if (dl === 'hole') { dave.neck.rotation.y = -0.9; dave.neck.rotation.x = -0.2; }
    face(dave, { wide: c.wide ?? 0, open: c.open ?? 0, smile: !!c.smile });
    const st = c.stretch ?? 1; dave.g.scale.set(1 / Math.sqrt(st), st, 1 / Math.sqrt(st)); dave.g.position.y = -(st - 1) * 1.4; dave.tint(c.tint ?? 0, c.fade ?? 0);
    phone.userData.set(c.phone || 'draft', c.typeK ?? 0, t);
    hole.visible = c.holeK !== false; hole.rotation.y = t * 0.05; hole.userData.disc.rotation.z = t * 0.2;
    dust.forEach((s, i) => { s.position.y += Math.sin(t * 0.3 + s.userData.ph) * 0.0005; s.material.opacity = 0.3 + 0.2 * Math.sin(t * 1.5 + s.userData.ph); });
  };
  return S;
}

// ======================= BLACK HOLE: approach, stretch, noodle, crossing, freezing =======================
// ctx: R (hole scale factor, 1 = stellar, 400 = supermassive), daveAt (0..1 along the approach path), stretch, noodle (0..1), tint, fade, daveVis, spin, rays (0..1: light trying to escape), frozen (bool)
export function buildHole() {
  const { scene, cam } = spaceScene();
  scene.add(new THREE.AmbientLight(0x303a60, 0.8)); const key = new THREE.PointLight(0xffc070, 3, 400, 1.2); scene.add(key); const fill = new THREE.DirectionalLight(0x6f8fff, 0.8); fill.position.set(80, 60, 100); scene.add(fill);
  const hole = makeBlackHole(10); scene.add(hole);
  const dave = makeDaveTint(); scene.add(dave.g); const helmet = makeHelmet(); helmet.position.set(0, 0.2, 0); dave.neck.add(helmet); const phone = makePhone(); dave.armR.add(phone); phone.position.set(0.02, -0.62, 0.1); phone.rotation.x = -1.1;
  // escaping light rays that curve back (arcs on the horizon)
  const rays = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const pts = []; for (let k = 0; k <= 20; k++) { const u = k / 20; const rr = 10.5 + Math.sin(u * Math.PI) * 4; pts.push(new THREE.Vector3(Math.cos(a + u * 0.9) * rr, (u - 0.5) * 2, Math.sin(a + u * 0.9) * rr)); } const geo = new THREE.BufferGeometry().setFromPoints(pts); const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0 })); hole.add(l); rays.push(l); }
  const S = { scene, cam, actors: { hole, dave } };
  S.update = (t, c) => {
    const R = c.R ?? 1; hole.scale.setScalar(R); hole.position.set(0, 0, 0); hole.rotation.y = (c.spin ?? 0.03) * t; hole.userData.disc.rotation.z = t * 0.25;
    
    const at = c.daveAt ?? 0.5; // 0 = far (toward camera side), 1 = at the horizon surface
    const far = c.farPos || [18, 3, 30], near = c.nearPos || [0, 0, 10.4];
    const p = new THREE.Vector3(...far).lerp(new THREE.Vector3(...near), smooth(at)).multiplyScalar(c.pathScale ?? 1);
    p.z -= (c.sink ?? 0); dave.g.position.copy(p); key.position.copy(p).add(new THREE.Vector3(4, 6, 8)); key.distance = 120; key.intensity = 60; dave.g.visible = c.daveVis !== false; hole.userData.glows.forEach(sp => sp.visible = c.glow !== false); hole.userData.disc.material.opacity = c.discDim ? 0.14 : 1; hole.userData.halo.material.opacity = c.discDim ? 0.3 : 0.95; hole.userData.arcs.forEach(ar => ar.material.opacity = c.discDim ? 0.25 : 0.8);
    // orient Dave so that his feet point to the hole (radial), head away
    const toHole = p.clone().negate().normalize(); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), toHole); dave.g.quaternion.copy(q); dave.g.rotateY(c.daveYaw ?? 0.6);
    const st = c.stretch ?? 1; dave.g.scale.set(1 / Math.sqrt(st), st, 1 / Math.sqrt(st)); if (c.daveScale) dave.g.scale.multiplyScalar(c.daveScale);
    dave.pose('stand', 0); dave.armL.rotation.x = -0.9; dave.armL.rotation.z = 0.6 + (c.flail ? Math.sin(t * 9) * 0.4 : 0); dave.armR.rotation.x = -1.35; dave.armR.rotation.z = -0.25; dave.neck.rotation.x = c.lookPhone === false ? -0.1 : 0.5;
    const nd = c.noodle ?? 0; if (nd > 0) { dave.legL.rotation.x = -0.2 * nd; dave.legR.rotation.x = 0.2 * nd; dave.torso.rotation.z = Math.sin(t * 3) * 0.1 * nd; }
    face(dave, { wide: c.wide ?? 0, open: c.open ?? 0, smile: !!c.smile }); dave.tint(c.tint ?? 0, c.fade ?? 0);
    phone.userData.set(c.phone || 'draft', c.typeK ?? 1, t);
    const rk = c.rays ?? 0; rays.forEach((l, i) => { l.material.opacity = rk > 0 ? 0.8 * Math.max(0, Math.sin(t * 2 + i)) * rk : 0; });
  };
  return S;
}

// ======================= INSIDE: every direction leads to the centre =======================
// ctx: tl, daveK 0..1 (falls toward the centre), phone mode, tint
export function buildInside() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000); const cam = new THREE.PerspectiveCamera(50, 1080 / 1920, 0.1, 3000);
  scene.add(new THREE.AmbientLight(0x504060, 1.2)); const pl = new THREE.PointLight(0xff8040, 4, 200, 1.0); pl.position.set(0, 0, -40); scene.add(pl); const dl = new THREE.DirectionalLight(0xfff0e0, 1.6); dl.position.set(2, 3, 6); scene.add(dl);
  const N = 500; const pos = new Float32Array(N * 6); const meta = []; const r = rng(31);
  for (let i = 0; i < N; i++) { const th = r.f() * Math.PI * 2, ph = Math.acos(2 * r.f() - 1); const dir = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th) * 0.6, Math.cos(ph)); meta.push({ dir, off: r.f(), len: r.range(4, 14) }); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffb070, transparent: true, opacity: 0.55 })); lines.frustumCulled = false; scene.add(lines);
  const core = glowSprite(0xffffff, 30, 0.9); core.position.set(0, 0, -200); scene.add(core); const core2 = glowSprite(0xff7030, 90, 0.5); core2.position.set(0, 0, -200); scene.add(core2);
  const dave = makeDaveTint(); scene.add(dave.g); const helmet = makeHelmet(); helmet.position.set(0, 0.2, 0); dave.neck.add(helmet); const phone = makePhone(); dave.armR.add(phone); phone.position.set(0.02, -0.62, 0.1); phone.rotation.x = -1.1;
  const S = { scene, cam, actors: { dave } };
  S.update = (t, c) => {
    const tl = c.tl ?? t; const C = new THREE.Vector3(0, 0, -200);
    for (let i = 0; i < N; i++) { const m = meta[i]; const u = ((tl * 0.35 + m.off) % 1); const d0 = 230 * (1 - u) + 6; const a = C.clone().addScaledVector(m.dir, d0); const b = C.clone().addScaledVector(m.dir, Math.max(6, d0 - m.len * (0.3 + u))); pos[i * 6] = a.x; pos[i * 6 + 1] = a.y; pos[i * 6 + 2] = a.z; pos[i * 6 + 3] = b.x; pos[i * 6 + 4] = b.y; pos[i * 6 + 5] = b.z; }
    geo.attributes.position.needsUpdate = true;
    const k = c.daveK ?? 0; dave.g.position.set(0.3 - k * 0.3, -1.0 + k * 0.6, -6 - k * 120); dave.g.rotation.set(0.2, 0.35, 0.15); dave.pose('stand', 0); dave.armR.rotation.x = -1.35; dave.armR.rotation.z = -0.25; dave.armL.rotation.x = -1.0; dave.armL.rotation.z = 0.5; dave.neck.rotation.x = 0.5;
    const st = c.stretch ?? 1; dave.g.scale.set(1 / Math.sqrt(st), st, 1 / Math.sqrt(st)); dave.tint(c.tint ?? 0, c.fade ?? 0); face(dave, { wide: c.wide ?? 0.3, open: c.open ?? 0 });
    phone.userData.set(c.phone || 'sending', 1, t); core.material.opacity = 0.7 + 0.2 * Math.sin(t * 5);
  };
  return S;
}

// ======================= GALAXY: dive to the centre =======================
// ctx: none (camera only), coreK (glow)
export function buildGalaxy() {
  const { scene, cam } = spaceScene();
  const N = 24000; const pos = new Float32Array(N * 3); const col = new Float32Array(N * 3); const r = rng(77);
  for (let i = 0; i < N; i++) { const arm = i % 4; const d = Math.pow(r.f(), 0.7) * 300; const a = d * 0.022 + arm * Math.PI / 2 + r.range(-0.35, 0.35) * (1 - d / 400); const x = Math.cos(a) * d + r.range(-6, 6), z = Math.sin(a) * d + r.range(-6, 6); const y = r.range(-1, 1) * (3 + 14 * Math.exp(-d / 40)); pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; const warm = d < 60 ? 1 : r.f() < 0.3 ? 1 : 0; col[i * 3] = warm ? 1 : 0.7; col[i * 3 + 1] = warm ? 0.85 : 0.8; col[i * 3 + 2] = warm ? 0.6 : 1; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false })); scene.add(pts);
  const core = glowSprite(0xffe0b0, 90, 0.9); scene.add(core); const core2 = glowSprite(0xffffff, 30, 1); scene.add(core2);
  const hole = makeBlackHole(1.2); hole.userData.glows.forEach(sp => sp.visible = false); scene.add(hole);
  const S = { scene, cam, actors: { pts } };
  S.update = (t, c) => { pts.rotation.y = t * 0.004; hole.rotation.y = t * 0.1; hole.userData.disc.rotation.z = t * 0.5; const ck = c.coreK ?? 1; core.material.opacity = 0.9 * ck; core2.material.opacity = ck; hole.visible = (c.hole ?? true); };
  return S;
}

// ======================= STUDIO props for the numbers =======================
// props: two, suns (k), tide (g), noodle (k), physicists (shrug), row, clock (secs), phone (mode), spectrum (k)
export function buildStudioHole() {
  const S = buildStudio(); const { scene, P } = S; const add = (k, g) => { P[k] = g; scene.add(g); return g; };
  const sunM = emis(0xffd060, 0.75);
  // two kinds
  { const g = new THREE.Group(); const a = makeBlackHole(0.35); a.position.set(-1.1, 2.4, 0); g.add(a); const b = makeBlackHole(0.8); b.position.set(1.0, 2.4, -0.4); g.add(b); const la = lbl('STELLAR · 10 SUNS', 1.4, 0.2, { fg: '#ffffff', font: 'bold 56px sans-serif', pw: 1024 }); la.position.set(-1.1, 1.2, 0.6); g.add(la); const lb = lbl('SUPERMASSIVE · 4,000,000 SUNS', 1.8, 0.2, { fg: '#f2c85b', font: 'bold 52px sans-serif', pw: 1024 }); lb.position.set(0.3, 0.8, 0.8); g.add(lb); const t = lbl('TWO KINDS OF BLACK HOLE', 2.6, 0.3, { fg: '#ffffff', font: 'bold 60px sans-serif', pw: 1024 }); t.position.set(0, 4.3, 0); g.add(t); g.userData = { a, b }; add('two', g); }
  // ten suns squeezed into 30 km (a marble next to a city skyline)
  { const g = new THREE.Group(); const suns = []; for (let i = 0; i < 10; i++) { const s = ico(0.36, sunM, 2, (i % 5 - 2) * 1.0, 2.6 + Math.floor(i / 5) * -1.0, 0); s.userData.p0 = s.position.clone(); g.add(s); suns.push(s); } const marble = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshBasicMaterial({ color: 0x000000 })); marble.position.set(0, 1.0, 0); marble.visible = false; g.add(marble); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffd080 })); ring.position.copy(marble.position); ring.visible = false; g.add(ring); const city = new THREE.Group(); const r = rng(3); for (let i = 0; i < 14; i++) { const h = r.range(0.15, 0.5); city.add(box(0.14, h, 0.14, M(0x6b7280), -1.1 + i * 0.17, h / 2, 0)); } city.position.set(0.0, 0.7, 0.5); city.visible = false; g.add(city); const l1 = lbl('TEN SUNS', 1.4, 0.3, { fg: '#f2c85b', font: 'bold 72px sans-serif' }); l1.position.set(0, 3.6, 0); g.add(l1); const l2 = lbl('30 KM ACROSS · ONE CITY', 1.7, 0.2, { fg: '#ffffff', font: 'bold 56px sans-serif', pw: 1024 }); l2.position.set(0, 1.6, 0.6); l2.visible = false; g.add(l2); g.userData = { suns, marble, ring, city, l1, l2 }; add('suns', g); }
  // tide: Dave with arrows at feet and head
  { const g = new THREE.Group(); const d = makeDave(); d.g.position.set(0, 0.3, 0); g.add(d.g); const arrowM = M(0xc0392b); const mk = (len) => { const a = new THREE.Group(); a.add(cyl(0.06, 0.06, len, arrowM, 8, 0, -len / 2, 0)); a.add(cone(0.16, 0.3, arrowM, 8, 0, -len - 0.12, 0)); a.children[1].rotation.x = Math.PI; return a; }; const feet = mk(1.6); feet.position.set(0.65, 0.4, 0); g.add(feet); const head = mk(0.5); head.position.set(0.65, 2.1, 0); g.add(head); const lf = lbl('FEET', 0.6, 0.18, { fg: '#ffffff', font: 'bold 64px sans-serif' }); lf.position.set(1.05, 0.3, 0.1); g.add(lf); const lh = lbl('HEAD', 0.6, 0.18, { fg: '#ffffff', font: 'bold 64px sans-serif' }); lh.position.set(1.05, 2.0, 0.1); g.add(lh); const dl = dynLbl(2.2, 0.4, { fg: '#f2c85b', font: 'bold 84px sans-serif', text: '10 G', pw: 1024, ph: 180 }); dl.position.set(0, 3.3, 0); g.add(dl); const dt = lbl('FEET MINUS HEAD', 1.4, 0.18, { fg: '#ffffff', font: 'bold 56px sans-serif', pw: 1024 }); dt.position.set(0, 3.65, 0); g.add(dt); const hole = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })); hole.position.set(0, -1.9, -0.3); g.add(hole); const hr = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.75, 48), new THREE.MeshBasicMaterial({ color: 0xffc070 })); hr.position.copy(hole.position); g.add(hr); g.position.y = 0.6; g.userData = { d, feet, head, dl, dt }; add('tide', g); }
  // noodle: a very long Dave
  { const g = new THREE.Group(); const d = makeDave(); g.add(d.g); const l = lbl('SPAGHETTIFICATION', 2.6, 0.32, { fg: '#f2c85b', font: 'bold 72px sans-serif', pw: 1024 }); l.position.set(0, 8.7, 0); g.add(l); const l2 = lbl('A REAL WORD', 1.4, 0.4, { bg: '#4e8f5a', fg: '#fff', font: 'bold 72px sans-serif' }); l2.position.set(1.2, 8.1, 0.3); l2.rotation.z = -0.1; l2.visible = false; g.add(l2); g.userData = { d, l2 }; add('noodle', g); }
  // physicists not sorry
  { const g = new THREE.Group(); const ps = []; for (let i = 0; i < 3; i++) { const p = new Person({ seed: 500 + i, shirt: 0xf4f4f4, pants: [0x2f3b4e, 0x4a5a6a, 0x1f2a38][i], hairStyle: i === 1 ? 'long' : i === 2 ? 'bald' : 'short', hair: [0x4a2f1f, 0x2b1d14, 0x7a7a7a][i] }); p.g.position.set((i - 1) * 1.1, 0, 0); g.add(p.g); ps.push(p); const specs = box(0.2, 0.05, 0.03, M(0x1b1b1b), 0, 0.2, 0.17); if (i !== 1) p.neck.add(specs); const board = box(0.3, 0.4, 0.03, M(0x8a6a4a), 0, -0.55, 0.1); if (i === 2) p.armL.add(board); } const l = lbl('PHYSICISTS', 1.6, 0.3, { fg: '#ffffff', font: 'bold 64px sans-serif' }); l.position.set(0, 2.9, 0); g.add(l); const l2 = lbl('NOT SORRY', 1.6, 0.46, { bg: '#c0392b', fg: '#fff', font: 'bold 80px sans-serif' }); l2.position.set(0.2, 2.15, 0.5); l2.rotation.z = 0.08; l2.visible = false; g.add(l2); g.userData = { ps, l2 }; add('physicists', g); }
  // eighteen suns in a row = horizon radius
  { const g = new THREE.Group(); const hole = new THREE.Mesh(new THREE.CircleGeometry(4.5, 64), new THREE.MeshBasicMaterial({ color: 0x000000 })); hole.position.set(-2.25, 3.0, -0.2); g.add(hole); const hr = new THREE.Mesh(new THREE.RingGeometry(4.5, 4.62, 96), new THREE.MeshBasicMaterial({ color: 0xffc070 })); hr.position.copy(hole.position); g.add(hr); const suns = []; for (let i = 0; i < 18; i++) { const s = ico(0.115, sunM, 1, -2.25 + 0.125 + i * 0.25, 3.0, 0); s.visible = false; g.add(s); suns.push(s); } const l = lbl('HORIZON RADIUS = 18 SUNS IN A ROW', 2.2, 0.22, { fg: '#f2c85b', font: 'bold 56px sans-serif', pw: 1024 }); l.position.set(0, 3.9, 0.2); g.add(l); const l2 = lbl('12,000,000 KM', 1.4, 0.26, { fg: '#ffffff', font: 'bold 72px sans-serif' }); l2.position.set(0, 1.7, 0.2); g.add(l2); const d = makeDave(); d.g.scale.setScalar(0.22); d.g.position.set(2.55, 2.75, 0.3); g.add(d.g); g.userData = { suns, d }; add('row', g); }
  // clock: time to the centre
  { const g = new THREE.Group(); const dl = dynLbl(3.2, 0.9, { fg: '#f2c85b', font: 'bold 150px sans-serif', text: '0:59.9', pw: 1024, ph: 300 }); dl.position.set(0, 3.4, 0); g.add(dl); const l = lbl('TIME TO THE CENTRE · AT MOST', 2.4, 0.24, { fg: '#ffffff', font: 'bold 56px sans-serif', pw: 1024 }); l.position.set(0, 4.1, 0); g.add(l); const l2 = lbl('EVERY DIRECTION IS DOWN', 2.2, 0.36, { bg: '#c0392b', fg: '#fff', font: 'bold 64px sans-serif', pw: 1024 }); l2.position.set(0.2, 2.4, 0.3); l2.rotation.z = -0.06; g.add(l2); const arrows = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const ar = new THREE.Group(); ar.add(cyl(0.04, 0.04, 0.6, M(0xffc070), 6, 0, 0.3, 0)); ar.add(cone(0.1, 0.2, M(0xffc070), 6, 0, 0.7, 0)); ar.position.set(Math.cos(a) * 1.3, 1.2 + Math.sin(a) * 0.7, 0.2); ar.rotation.z = a + Math.PI / 2; g.add(ar); arrows.push(ar); } g.userData = { dl, arrows }; add('clock', g); }
  // giant phone
  { const g = new THREE.Group(); const ph = makePhone(); ph.scale.setScalar(22); ph.position.set(0, 2.4, 0); ph.children[1].rotation.z = 0; g.add(ph); const l2 = lbl('FOREVER', 1.8, 0.5, { bg: '#c0392b', fg: '#fff', font: 'bold 96px sans-serif' }); l2.position.set(0.5, 1.4, 0.6); l2.rotation.z = -0.12; l2.visible = false; g.add(l2); g.userData = { ph, l2 }; add('phone', g); }
  // spectrum: Dave's head redshifting
  { const g = new THREE.Group(); const d = makeDaveTint(); d.g.scale.setScalar(1.6); d.g.position.set(0, -1.2, 0); g.add(d.g); const barT = canvasTex(512, 64, (ctx, w, h) => { const gr = ctx.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, '#ffd080'); gr.addColorStop(0.6, '#ff4020'); gr.addColorStop(0.85, '#5a0000'); gr.addColorStop(1, '#000000'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h); }); barT.magFilter = THREE.LinearFilter; const bar = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.3), new THREE.MeshBasicMaterial({ map: barT })); bar.position.set(0, 3.0, 0); g.add(bar); const mk = cone(0.12, 0.25, M(0xffffff), 6, -1.5, 3.3, 0.05); mk.rotation.x = Math.PI; g.add(mk); const l = lbl('LIGHT FROM DAVE, SEEN FROM OUTSIDE', 2.0, 0.17, { fg: '#ffffff', font: 'bold 42px sans-serif', pw: 1024 }); l.position.set(0, 3.5, 0); g.add(l); const ls = [['VISIBLE', -1.2], ['RED', 0.2], ['INFRARED', 1.0], ['GONE', 1.45]].map(([tx, x]) => { const m = lbl(tx, 0.9, 0.18, { fg: '#ffffff', font: 'bold 52px sans-serif' }); m.position.set(x, 2.7, 0); g.add(m); return m; }); g.userData = { d, mk }; add('spectrum', g); }
  const upd = S.update;
  S.update = (t, c) => {
    upd(t, c); const prop = c.prop || 'dial'; const u = P[prop].userData;
    if (prop === 'two') { u.a.rotation.y = t * 0.3; u.b.rotation.y = t * 0.2; u.a.userData.disc.rotation.z = t * 0.6; u.b.userData.disc.rotation.z = t * 0.4; }
    if (prop === 'suns') { const k = smooth(c.k ?? 0); u.suns.forEach(s => { s.position.lerpVectors(s.userData.p0, u.marble.position, k); s.scale.setScalar(Math.max(0.02, 1 - k * 0.98)); s.visible = k < 0.99; }); u.marble.visible = k > 0.9; u.ring.visible = k > 0.9; u.city.visible = k > 0.9; u.l2.visible = k > 0.9; u.l1.visible = k < 0.5; }
    if (prop === 'tide') { const gg = c.g ?? 10; const stt = c.stretch ?? 1; u.dl.position.y = 3.3 + (stt - 1) * 2.0; u.dt.position.y = 3.65 + (stt - 1) * 2.0; u.dl.userData.set(gg >= 1e6 ? '20,000,000 G' : gg < 0.01 ? '0.0001 G' : `${Math.round(gg)} G`); const st = c.stretch ?? 1; u.d.g.scale.set(1 / Math.sqrt(st), st, 1 / Math.sqrt(st)); u.d.pose('stand', t); u.d.armL.rotation.z = 0.5; u.d.armR.rotation.z = -0.5; u.d.neck.rotation.x = 0.4; face(u.d, { wide: c.wide ?? 0.5, open: c.open ?? 0.2 }); const pulse = 1 + 0.08 * Math.sin(t * 8); u.feet.scale.y = pulse; }
    if (prop === 'noodle') { const k = c.k ?? 1; const st = lerp(1, 4.5, k); u.d.g.scale.set(1 / Math.sqrt(st), st, 1 / Math.sqrt(st)); u.d.pose('stand', 0); u.d.armL.rotation.z = 0.3; u.d.armR.rotation.z = -0.3; u.d.neck.rotation.x = 0.1; face(u.d, { wide: 1, open: 0.6 }); u.l2.visible = !!c.real; }
    if (prop === 'physicists') { u.ps.forEach((p, i) => { p.pose('stand', t, { phase: i }); if (c.shrug) { p.armL.rotation.z = -0.5; p.armR.rotation.z = 0.5; p.armL.rotation.x = -0.6; p.armR.rotation.x = -0.6; p.neck.rotation.z = (i - 1) * 0.12; } if (i === 2) { p.armL.rotation.x = -1.2; } face(p, { smile: !!c.shrug }); }); u.l2.visible = !!c.shrug; }
    if (prop === 'row') { const n = Math.round(18 * (c.k ?? 1)); u.suns.forEach((s, i) => s.visible = i < n); u.d.pose('stand', t); u.d.neck.rotation.y = -0.8; }
    if (prop === 'clock') { const s = Math.max(0, c.secs ?? 59.9); u.dl.userData.set(`0:${String(Math.floor(s)).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`); u.arrows.forEach((a, i) => { const k = ((t * 0.8 + i * 0.125) % 1); const ang = (i / 8) * Math.PI * 2; a.position.set(Math.cos(ang) * (1.6 - k * 0.9), 1.2 + Math.sin(ang) * (0.9 - k * 0.5), 0.2); a.scale.setScalar(1 - k * 0.5); }); }
    if (prop === 'phone') { u.ph.userData.set(c.mode || 'sending', 1, t); u.l2.visible = !!c.forever; u.l2.scale.setScalar(c.forever ? lerp(2.2, 1, easeOut(c.foreverK ?? 1)) : 1); }
    if (prop === 'spectrum') { const k = c.k ?? 0; u.d.tint(clamp(k * 1.6, 0, 1), clamp((k - 0.55) / 0.45, 0, 1)); u.mk.position.x = -1.5 + 3.0 * k; u.d.pose('stand', 0); u.d.neck.rotation.x = -0.05; face(u.d, { wide: 0.4, open: 0.2 }); }
  };
  return S;
}

// ======================= BAKERY =======================
// ctx: priya ('phone'|'look'|'point'|'wait'), baker ('stand'|'box'|'present'), lemonTag (bool), sorted (bool), screen ('typing'|'sending'|'forever'), box (bool)
export function buildBakery() {
  const S = baseSet({ shadowExtent: 8, fogNear: 40, fogFar: 160, shadowRes: 2048 }); const { scene } = S; const ST = new THREE.Group(); scene.add(ST);
  S.sunOffset = new THREE.Vector3(-4, 8, 6); S.sun.intensity = 1.2; S.hemi.intensity = 1.0; scene.add(new THREE.AmbientLight(0xfff1dc, 0.3)); scene.add(new THREE.PointLight(0xfff1dc, 1.4, 10, 1.5).translateY(3.0).translateZ(1.0));
  const floorT = checkerTex('#d9d2c4', '#efe9dc', 12); const floor = plane(14, 14, texMat({ map: floorT }), 0, 0, 1); floor.receiveShadow = true; scene.add(floor);
  ST.add(box(14, 3.4, 0.1, M(0xf4e7d4), 0, 1.7, -3.0)); ST.add(box(0.1, 3.4, 12, M(0xf4e7d4), -5, 1.7, 2)); ST.add(box(0.1, 3.4, 12, M(0xf4e7d4), 5, 1.7, 2)); ST.add(plane(14, 14, M(0xfaf6ee), 0, 3.4, 1, Math.PI / 2));
  // shelves with bread behind the counter
  for (let s = 0; s < 3; s++) { const y = 1.3 + s * 0.6; ST.add(box(6, 0.05, 0.4, M(0x8a6a4a), 0, y, -2.75)); for (let i = 0; i < 10; i++) { const b = ico(0.17, M([0xc8923a, 0xe0b06a, 0xa0632a][(i + s) % 3]), 1, -2.6 + i * 0.58, y + 0.15, -2.75); b.scale.set(1.6, 0.8, 0.9); ST.add(b); } }
  const sign = lbl('BAKERY', 2.4, 0.6, { bg: '#8a2a2a', fg: '#fff', font: 'bold 100px sans-serif' }); sign.position.set(0, 3.0, -2.93); scene.add(sign);
  // counter with glass front
  ST.add(box(5, 0.95, 0.9, M(0xa0744a), 0, 0.475, -0.6)); ST.add(box(5.1, 0.06, 1.0, M(0xf4efe4), 0, 0.98, -0.6));
  const glass = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.7, 0.04), mat(0xcfe8ff, { transparent: true, opacity: 0.25 })); glass.position.set(0, 1.36, -0.15); scene.add(glass);
  // two cakes on stands
  const stand = (x) => { ST.add(cyl(0.42, 0.42, 0.04, M(0xf4efe4), 24, x, 1.03, -0.6)); ST.add(cyl(0.06, 0.08, 0.12, M(0xd0d0d0), 8, x, 1.09, -0.6)); ST.add(cyl(0.45, 0.45, 0.04, M(0xf4efe4), 24, x, 1.17, -0.6)); };
  stand(-1.0); stand(1.0);
  const lemon = new THREE.Group(); lemon.position.set(-1.0, 1.19, -0.6); lemon.add(cyl(0.36, 0.36, 0.26, M(0xf5d76e), 24, 0, 0.13, 0)); lemon.add(cyl(0.37, 0.37, 0.05, M(0xfff8dc), 24, 0, 0.28, 0)); for (let i = 0; i < 6; i++) { const sl = cyl(0.06, 0.06, 0.02, M(0xffe680), 12, Math.cos(i * 1.05) * 0.26, 0.32, Math.sin(i * 1.05) * 0.26); lemon.add(sl); } scene.add(lemon);
  const vic = new THREE.Group(); vic.position.set(1.0, 1.19, -0.6); vic.add(cyl(0.36, 0.36, 0.12, M(0xe8c48a), 24, 0, 0.06, 0)); vic.add(cyl(0.37, 0.37, 0.03, M(0xd9534f), 24, 0, 0.135, 0)); vic.add(cyl(0.37, 0.37, 0.03, M(0xfff8f0), 24, 0, 0.165, 0)); vic.add(cyl(0.36, 0.36, 0.12, M(0xe8c48a), 24, 0, 0.24, 0)); vic.add(cyl(0.37, 0.37, 0.01, M(0xffffff), 24, 0, 0.305, 0)); scene.add(vic);
  const tl1 = lbl('LEMON', 0.7, 0.2, { bg: '#f4efe4', fg: '#1b1b1b', font: 'bold 72px sans-serif' }); tl1.position.set(-1.0, 1.08, -0.12); scene.add(tl1); const tl2 = lbl('VICTORIA SPONGE', 1.1, 0.2, { bg: '#f4efe4', fg: '#1b1b1b', font: 'bold 56px sans-serif', pw: 1024 }); tl2.position.set(1.0, 1.08, -0.12); scene.add(tl2);
  const sorted = lbl('SORTED', 0.9, 0.34, { bg: '#4e8f5a', fg: '#fff', font: 'bold 80px sans-serif' }); sorted.position.set(-1.0, 1.75, -0.4); sorted.rotation.z = -0.1; sorted.visible = false; scene.add(sorted);
  const cakeBox = new THREE.Group(); cakeBox.position.set(-0.2, 1.01, -0.2); cakeBox.add(box(0.9, 0.3, 0.9, M(0xf4e7d4), 0, 0.15, 0)); cakeBox.add(box(0.92, 0.04, 0.92, M(0xd9534f), 0, 0.32, 0)); cakeBox.visible = false; scene.add(cakeBox);
  bakeStatic(ST, scene);
  const baker = new Person({ seed: 88, shirt: 0xf4f4f4, pants: 0x2f3b4e, hat: 0xffffff, skin: 0xc68642, hairStyle: 'short' }); baker.g.position.set(0.4, 0, -1.5); baker.g.rotation.y = 0; scene.add(baker.g);
  const apron = box(0.46, 0.5, 0.02, M(0xe8e0d2), 0, 0.2, 0.14); baker.torso.add(apron);
  const priya = makePriya(); priya.g.position.set(-0.6, 0, 0.9); priya.g.rotation.y = Math.PI; scene.add(priya.g);
  const phone = makePhone(); priya.armR.add(phone); phone.position.set(0.02, -0.62, 0.1); phone.rotation.x = -1.1; phone.rotation.y = 0.1;
  // Priya's screen: what she sees
  const pc = document.createElement('canvas'); pc.width = 256; pc.height = 480; const pctx = pc.getContext('2d'); const pt = new THREE.CanvasTexture(pc); pt.colorSpace = THREE.SRGBColorSpace; pt.magFilter = THREE.LinearFilter; phone.children[1].material = new THREE.MeshBasicMaterial({ map: pt, color: 0x8c8c8c }); let plast = '';
  const drawP = (mode, t) => { const key = mode + '|' + Math.floor(t * 2); if (key === plast) return; plast = key; pctx.fillStyle = '#dfe3ea'; pctx.fillRect(0, 0, 256, 480); pctx.fillStyle = '#2b3a55'; pctx.fillRect(0, 0, 256, 70); pctx.fillStyle = '#fff'; pctx.font = 'bold 28px sans-serif'; pctx.textAlign = 'center'; pctx.fillText('Dave', 128, 45); pctx.textAlign = 'left'; pctx.fillStyle = '#2f80ed'; pctx.beginPath(); pctx.roundRect(60, 100, 180, 60, 16); pctx.fill(); pctx.fillStyle = '#fff'; pctx.font = '22px sans-serif'; pctx.fillText('cake?? which one', 74, 137); pctx.fillStyle = '#6b7280'; pctx.font = 'italic 24px sans-serif'; const dots = '.'.repeat(1 + Math.floor(t * 2) % 3); pctx.fillText(mode === 'forever' ? 'Dave is typing' + dots : 'Dave is typing' + dots, 20, 220); if (mode === 'forever') { pctx.fillStyle = '#c0392b'; pctx.font = 'bold 22px sans-serif'; pctx.fillText('since: 14 minutes ago', 20, 260); pctx.fillText('(and counting)', 20, 290); } pt.needsUpdate = true; };
  S.actors = { priya, baker, lemon, vic };
  S.update = (t, c) => {
    S.setSky(0);
    const pm = c.priya || 'phone'; priya.pose('stand', t); priya.g.position.set(-0.6, 0, 0.9); priya.g.rotation.y = Math.PI;
    priya.armR.rotation.x = -1.3; priya.armR.rotation.z = -0.25; priya.armL.rotation.x = -0.2; priya.neck.rotation.set(0.45, 0.15, 0);
    if (pm === 'look') { priya.neck.rotation.set(0.1, 0, 0); } if (pm === 'point') { priya.armL.rotation.x = -1.5; priya.armL.rotation.z = 0.5; priya.neck.rotation.set(0.1, 0.35, 0); } if (pm === 'wait') { priya.armR.rotation.x = -0.6; priya.armL.rotation.x = -0.6; priya.neck.rotation.set(0.05, 0, 0); }
    face(priya, { wide: c.priyaWide ?? 0, smile: pm === 'point' || !!c.sorted });
    const bm = c.baker || 'stand'; baker.pose('stand', t + 1); baker.g.position.set(0.4, 0, -1.5); baker.g.rotation.y = 0; baker.armL.rotation.x = -0.7; baker.armR.rotation.x = -0.7; if (bm === 'present') { baker.armL.rotation.x = -1.1; baker.armL.rotation.z = 0.5; baker.neck.rotation.y = 0.3; } if (bm === 'box') { baker.armL.rotation.x = -1.2; baker.armR.rotation.x = -1.2; baker.neck.rotation.x = 0.4; }
    face(baker, { smile: true });
    lemon.visible = !c.box; cakeBox.visible = !!c.box; sorted.visible = !!c.sorted; drawP(c.screen || 'typing', t);
  };
  return S;
}
