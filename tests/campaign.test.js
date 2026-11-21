const {E,C,ok,section,hintBot}=require('./lib');
section('All 45 campaign levels generate to recipe and are no-guess',()=>{
  C.CAMPS.forEach((camp,ci)=>camp.levels.forEach((L,li)=>{ const sp=C.levelSpec(ci,li,false); let s=-1;
    for(let y=sp.H>>2;y<sp.H&&s<0;y++) for(let x=sp.W>>2;x<sp.W&&s<0;x++){ const i=y*sp.W+x; if(!sp.mask||sp.mask[i]) s=i; }
    const r=E.genClassic(sp.W,sp.H,sp.M,s,Math.random,{mask:sp.mask,accept:sp.accept,budget:4000});
    ok(r.ok,`${camp.name} ${li+1} (${L.n}) failed to generate`);
    if(r.ok){ const g=new E.Classic(sp.W,sp.H,sp.M,sp.mask); g.setMines(r.mines); g.state='play'; g.t0=Date.now(); g.click(s%sp.W,Math.floor(s/sp.W));
      ok(hintBot(g)==='won',`${camp.name} ${li+1} not cleared by hints`); } })); });
