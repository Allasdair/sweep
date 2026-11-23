"""Build Sweep.

  python3 build.py           -> docs/ (installable web app, served by GitHub Pages)
  python3 build.py --single  -> dist/sweep.html (one self-contained file, no install/offline support)

Needs only Python 3. No dependencies.
"""
import re, shutil, os, sys, hashlib
root=os.path.dirname(os.path.abspath(__file__)); src=os.path.join(root,'src'); web=os.path.join(root,'web')
rd=lambda *p: open(os.path.join(*p),encoding='utf-8').read()
i18n=''.join(rd(src,f)+'\n' for f in sorted(os.listdir(src)) if f.startswith('i18n') and f.endswith('.js'))
html=rd(src,'app.html').replace('/*ENGINE*/',rd(src,'engine.js')+'\n'+rd(src,'camp.js')+'\n'+i18n)
ver=re.search(r"VERSION='([\d.]+)'",html).group(1)

if '--single' in sys.argv:
    os.makedirs(os.path.join(root,'dist'),exist_ok=True)
    open(os.path.join(root,'dist','sweep.html'),'w',encoding='utf-8').write(html); print('built dist/sweep.html'); sys.exit()

gf=re.search(r'<link rel="preconnect" href="https://fonts.googleapis.com">.*?rel="stylesheet">',html,re.S); assert gf
head='''<meta name="description" content="Ad-free, no-guess minesweeper. Every board can be cleared with logic alone.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Sweep"><meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="stylesheet" href="fonts.css">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'">'''
html=html.replace(gf.group(0),head)
reg='''<script>
// Offline support + ask the browser to keep saved progress from being cleared under storage pressure
if('serviceWorker' in navigator) addEventListener('load',()=>{
  const sw=navigator.serviceWorker, had=!!sw.controller;
  // A new version finished downloading in the background and took over: it's used next launch.
  sw.addEventListener('controllerchange',()=>{ if(had&&typeof toast==='function') toast('Update ready. Restart Sweep to use it.'); });
  sw.register('sw.js').then(reg=>{ let last=Date.now();
    // Installed apps can stay open for days: re-check for updates when brought back, at most every 30 min.
    document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&Date.now()-last>18e5){ last=Date.now(); reg.update().catch(()=>{}); } });
  }).catch(()=>{});
});
if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().catch(()=>{});
</script>
</body>'''
assert html.count('</body>')==1; html=html.replace('</body>',reg)
assert 'googleapis' not in html and 'gstatic' not in html
h=hashlib.sha1(html.encode()).hexdigest()[:8]
out=os.path.join(root,'docs')
if os.path.exists(out): shutil.rmtree(out)
os.makedirs(out)
open(os.path.join(out,'index.html'),'w',encoding='utf-8').write(html)
for f in ['manifest.webmanifest','fonts.css','privacy.html']: shutil.copy(os.path.join(web,f),out)
for d in ['fonts','icons']: shutil.copytree(os.path.join(web,d),os.path.join(out,d))
open(os.path.join(out,'sw.js'),'w').write(rd(web,'sw.template.js').replace('__VERSION__',f'sweep-{ver}-{h}'))
open(os.path.join(out,'.nojekyll'),'w').write('')
print(f'built docs/ (v{ver}, cache {h})')
