const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'}); const p=await b.newPage();
  await p.goto('file://'+__dirname+'/icon.html'); await p.evaluate(()=>document.fonts.load('800 40px Inter')); await p.waitForTimeout(300);
  const out=[['icon-192.png',192,0],['icon-512.png',512,0],['maskable-512.png',512,1],['apple-touch-icon.png',180,1],['favicon-32.png',32,0]];
  for(const [f,sz,m] of out){ const d=await p.evaluate(([sz,m])=>draw(sz,m),[sz,m]); fs.writeFileSync(__dirname+'/icons/'+f,Buffer.from(d.split(',')[1],'base64')); }
  await b.close(); })();
