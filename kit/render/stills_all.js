const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('[err]', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 300)); });
  await p.goto('http://127.0.0.1:8765/render/' + process.env.PAGE + '?scale=' + (process.env.SCALE || '0.4'));
  await p.waitForFunction('window.ready === true || window.initError', null, { timeout: 240000 });
  const err = await p.evaluate(() => window.initError); if (err) { console.log('INIT', err); process.exit(1); }
  const list = await p.evaluate(() => window.shotList()); const out = path.resolve(__dirname, '..', process.env.OUT || 'frames/all'); fs.mkdirSync(out, { recursive: true });
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  for (const [i, s] of list.entries()) { if (only && !only.includes(s.id)) continue; const t = s.from + (s.to - s.from) * (parseFloat(process.env.FRAC || '0.6')); const d = await p.evaluate((t) => window.renderFrame(t, 0.85), t); fs.writeFileSync(path.join(out, String(i).padStart(2, '0') + '_' + s.id + '.jpg'), Buffer.from(d.split(',')[1], 'base64')); }
  console.log(list.length, 'shots', list.map(s => s.id + ':' + (s.to - s.from).toFixed(1)).join(' '));
  await b.close();
})();
