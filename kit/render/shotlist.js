const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('http://127.0.0.1:8765/render/' + process.env.PAGE + '?scale=0.2'); await p.waitForFunction('window.ready === true || window.initError', null, { timeout: 240000 });
  const list = await p.evaluate(() => window.shotList()); console.log(JSON.stringify(list)); await b.close(); })();
