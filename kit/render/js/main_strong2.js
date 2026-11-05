import * as THREE from 'three'; window.THREE = THREE;
import { buildNanKitchen, buildToastKitchen, buildStrongStreet } from './strong.js';
import { buildCity, buildStudio } from './world.js';
import { buildSpace } from './sets.js';
import { buildShotsStrong2 as buildShotsStrong, overlayCfgStrong } from './shots_strong2.js';
import { OverlayG } from './overlay_generic.js';
import { EffectComposer } from '/node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from '/node_modules/three/examples/jsm/postprocessing/GTAOPass.js';
import { ShaderPass } from '/node_modules/three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from '/node_modules/three/examples/jsm/postprocessing/OutputPass.js';
const GradeShader = { uniforms: { tDiffuse: { value: null }, contrast: { value: 1.08 }, sat: { value: 1.14 }, warm: { value: 0.035 }, vig: { value: 0.32 }, grain: { value: 0.025 }, seed: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float contrast, sat, warm, vig, grain, seed; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + seed) * 43758.5453); }
  void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; c = (c - 0.5) * contrast + 0.5; float l = dot(c, vec3(0.299,0.587,0.114)); c = mix(vec3(l), c, sat);
    c += vec3(warm, warm*0.35, -warm*0.6) * (1.0 - l); vec2 d = vUv - 0.5; d.x *= 0.62; c *= 1.0 - vig * smoothstep(0.25, 0.75, length(d));
    c += (h(vUv*1000.0) - 0.5) * grain; gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }` };

const W = 1080, H = 1920;
const FONTS = [
  ['Playfair Display', '/node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2', { weight: '400', style: 'normal' }],
  ['Playfair Display', '/node_modules/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2', { weight: '700', style: 'normal' }],
  ['Playfair Display', '/node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff2', { weight: '400', style: 'italic' }],
  ['Inter', '/node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2', { weight: '500', style: 'normal' }],
  ['Inter', '/node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2', { weight: '400', style: 'normal' }],
];

const Q = new URLSearchParams(location.search); window.__Q = Q;
async function init() {
  for (const [fam, url, desc] of FONTS) { try { const f = new FontFace(fam, `url(${url})`, desc); await f.load(); document.fonts.add(f); } catch (e) { console.warn('font fail', url, e.message); } }
  const TL = await (await fetch('/render/timeline_strong.json')).json();
  const glCanvas = document.getElementById('gl');
  const RS = parseFloat(Q.get('scale') || '1'); const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: Q.get('aa') !== '0', preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setSize(Math.round(W * RS), Math.round(H * RS), false); renderer.setPixelRatio(1); renderer.shadowMap.enabled = Q.get('shadows') !== '0'; renderer.shadowMap.type = Q.get('stype') === 'basic' ? THREE.BasicShadowMap : (Q.get('stype') === 'vsm' ? THREE.VSMShadowMap : THREE.PCFShadowMap);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const sets = { kitchen: buildNanKitchen(), toast: buildToastKitchen(), street: buildStrongStreet(), city: buildCity(), studio: buildStudio(), space: buildSpace() };
  const { shots } = buildShotsStrong(TL);
  const PW = Math.round(W * RS), PH = Math.round(H * RS); const POST = Q.get('post') !== '0';
  const composer = new EffectComposer(renderer); composer.setSize(PW, PH);
  const rp = new RenderPass(sets.kitchen.scene, sets.kitchen.cam); composer.addPass(rp);
  let gtao = null; if (Q.get('ao') !== '0') { gtao = new GTAOPass(sets.kitchen.scene, sets.kitchen.cam, PW, PH); gtao.blendIntensity = 0.75; gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 1.0, scale: 1.0, samples: parseInt(Q.get('aos') || '6') }); gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: parseInt(Q.get('aop') || '4') }); composer.addPass(gtao); gtao.setSize(Math.round(PW * 0.5), Math.round(PH * 0.5)); }
  const bloom = new UnrealBloomPass(new THREE.Vector2(PW, PH), 0.3, 0.55, 0.86); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(GradeShader); composer.addPass(grade);
  window.__composer = composer;
  const overlay = new OverlayG(TL, overlayCfgStrong(TL));
  const out = document.getElementById('out'); const octx = out.getContext('2d');
  const black = document.createElement('canvas'); black.width = W; black.height = H; black.getContext('2d').fillRect(0, 0, W, H);
  window.__shots = shots; window.__sets = sets; window.__renderer = renderer; window.__gl = glCanvas;
  window.findShot = (t) => shots.find(s => t >= s.from && t < s.to) || shots[shots.length - 1];
  window.renderFrame = (t, quality = 0.92, fmt = 'image/jpeg') => {
    const shot = window.findShot(t);
    const tl = t - shot.from; const ctx = shot.ctx(t, tl) || {}; ctx.tl = tl;
    if (shot.set === 'black') { octx.drawImage(black, 0, 0); }
    else {
      const S = sets[shot.set]; const c = shot.cam(tl, shot.to - shot.from, t);
      S.cam.position.copy(c.pos); S.cam.lookAt(c.look); if (c.fov) { S.cam.fov = c.fov; S.cam.updateProjectionMatrix(); }
      if (S.sun) { S.sun.target.position.copy(c.look); S.sun.position.copy(c.look).add(S.sunOffset || new THREE.Vector3(75, 55, 30)); S.sun.target.updateMatrixWorld(); }
      S.update(t, ctx);
      if (POST) { rp.scene = S.scene; rp.camera = S.cam; if (gtao) { gtao.scene = S.scene; gtao.camera = S.cam; } grade.uniforms.seed.value = (t * 97.13) % 100; grade.uniforms.warm.value = ctx.warm ?? 0.035; grade.uniforms.sat.value = ctx.sat ?? 1.14; composer.render(); }
      else renderer.render(S.scene, S.cam);
      octx.drawImage(glCanvas, 0, 0, W, H);
    }
    overlay.draw(t, ctx);
    octx.drawImage(overlay.c, 0, 0);
    return out.toDataURL(fmt, quality);
  };
  window.shotList = () => shots.map(s => ({ id: s.id, from: s.from, to: s.to, set: s.set }));
  window.ready = true;
}
init().catch(e => { console.error('INIT ERROR', e.message, e.stack); window.initError = e.message + '\n' + e.stack; });
window.renderDebug = (setName, pos, look, t = 5, fov = 38, ctx = {}) => {
  const S = window.__sets[setName]; S.cam.position.set(...pos); S.cam.lookAt(new THREE.Vector3(...look)); S.cam.fov = fov; S.cam.updateProjectionMatrix();
  S.update(t, ctx); window.__renderer.render(S.scene, S.cam); const o = document.getElementById('out'); o.getContext('2d').drawImage(window.__gl, 0, 0, 1080, 1920); return o.toDataURL('image/jpeg', 0.9);
};
