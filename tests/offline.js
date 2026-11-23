// Offline behaviour of the built PWA (docs/). Needs Playwright and Chrome:
//   npm i -D playwright && npx playwright install chromium   (or set CHROME=/path/to/chrome)
//   python3 build.py && node tests/offline.js
// Checks: opens instantly with a hanging connection and in airplane mode; saves survive;
// a broken update is rejected; a good update installs in the background and is used next launch;
// other apps' caches on the same site are never deleted.
const {chromium}=require('playwright'); const http=require('http'), fs=require('fs'), path=require('path'), os=require('os');
const SRC=path.join(__dirname,'..','docs'), ROOT=fs.mkdtempSync(path.join(os.tmpdir(),'sweep-off-')), SITE=path.join(ROOT,'sweep');
fs.cpSync(SRC,SITE,{recursive:true});
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml'};
const srv=http.createServer((q,r)=>{ let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0])); if(f.endsWith('/')) f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){ r.writeHead(404); return r.end(); } r.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream','cache-control':'max-age=600'}); r.end(d); }); });
let fails=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c) fails++; };
const edit=(f,a,b)=>fs.writeFileSync(path.join(SITE,f),fs.readFileSync(path.join(SITE,f),'utf8').replace(a,b));
srv.listen(0,async()=>{ const URL=`http://localhost:${srv.address().port}/sweep/`;
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{}); const ctx=await b.newContext(); const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL); await p.evaluate(()=>navigator.serviceWorker.ready); await p.reload();
  const v0=await p.evaluate(()=>VERSION); ok(await p.evaluate(()=>!!navigator.serviceWorker.controller),'service worker controls the page');
  await p.evaluate(async()=>{ S.tutDone=true; S.seenVer=VERSION; S.xp=4321; persist(); await caches.open('other-app-1').then(c=>c.put('/other/x',new Response('x'))); });
  let hang=true; await ctx.route('**/*',r=>{ if(!hang) r.continue(); });
  let t=Date.now(); await p.reload({timeout:10000}); ok(Date.now()-t<3000,`opens with a hanging connection (${Date.now()-t} ms)`);
  ok(await p.evaluate(()=>S.xp)===4321,'save intact');
  hang=false; await ctx.unroute('**/*'); await ctx.setOffline(true);
  t=Date.now(); await p.reload(); ok(Date.now()-t<3000&&await p.evaluate(()=>cur==='home'),`opens in airplane mode (${Date.now()-t} ms)`);
  await p.goto(URL+'privacy.html'); ok(/Privacy/.test(await p.title()),'privacy page works offline'); await p.goto(URL);
  await ctx.setOffline(false);
  edit('index.html',`VERSION='${v0}'`,"VERSION='broken'"); edit('sw.js',/const VERSION='[^']+'/,"const VERSION='sweep-test-broken'");
  fs.renameSync(path.join(SITE,'fonts/caveat-700.woff2'),path.join(ROOT,'caveat.bak'));
  await p.evaluate(()=>navigator.serviceWorker.getRegistration().then(r=>r.update()).catch(()=>{})); await p.waitForTimeout(1500); await p.reload();
  ok(await p.evaluate(()=>VERSION)===v0,'a failed update leaves the working version in place');
  ok(!(await p.evaluate(()=>caches.keys())).includes('sweep-test-broken'),'the failed download is cleaned up');
  fs.renameSync(path.join(ROOT,'caveat.bak'),path.join(SITE,'fonts/caveat-700.woff2'));
  edit('index.html',"VERSION='broken'","VERSION='next'"); edit('sw.js',"sweep-test-broken","sweep-test-next");
  await p.reload(); ok(await p.evaluate(()=>VERSION)===v0,'launch opens the saved copy while an update is pending');
  await p.evaluate(()=>navigator.serviceWorker.getRegistration().then(r=>r.update())); await p.waitForTimeout(2000); await p.reload();
  ok(await p.evaluate(()=>VERSION)==='next','the update is used on the next launch');
  ok(await p.evaluate(()=>S.xp)===4321,'save survives the update');
  const ks=await p.evaluate(()=>caches.keys()); ok(ks.includes('other-app-1'),"another app's cache is left alone"); ok(ks.filter(k=>k.startsWith('sweep-')).length===1,'only one Sweep copy remains');
  ok(!errs.length,'no page errors'+(errs.length?': '+errs[0]:''));
  await b.close(); srv.close(); fs.rmSync(ROOT,{recursive:true,force:true});
  console.log(fails?`${fails} offline check(s) failed`:'offline checks passed'); process.exit(fails?1:0); });
