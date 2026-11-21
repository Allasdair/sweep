const {E,ok,section,hintBot}=require('./lib');
const D={beginner:[9,9,10],intermediate:[16,16,40],expert:[30,16,99]};
const dbl=M=>{ const cells=Math.round(M/1.3); return {cells,doubles:M-cells}; };
section('Classic boards are no-guess (hint bot clears every board)',()=>{
  for(const [d,[W,H,M]] of Object.entries(D)) for(let r=0;r<(d==='expert'?4:8);r++){
    const g=new E.Classic(W,H,M); g.click(W>>1,H>>1); ok(hintBot(g)==='won',`${d} #${r} not cleared by hints`); } });
section('Rule variants are no-guess (hex, wrap, knight, double mines)',()=>{
  for(const [mode,isD] of [['hex',0],['wrap',0],['knight',0],['sq',1]]) for(const [d,[W,H,M]] of Object.entries(D)){
    const opts=isD?{dbl:dbl(M)}:{mode}; const g=new E.Classic(W,H,M,null,opts); g.click(W>>1,H>>1);
    ok(hintBot(g)==='won',`${isD?'double':mode} ${d} not cleared by hints`); } });
section('Board shapes keep one connected region and stay solvable',()=>{
  for(const sh of E.SHAPES){ const mask=E.shapeMask(sh,16,16,Math.random); let P=0; for(const v of mask) P+=v;
    ok(P>40,`${sh} too small`); const g=new E.Classic(16,16,Math.round(P*.14),mask); let s=-1; for(let i=0;i<256;i++) if(mask[i]&&s<0&&i>100) s=i;
    g.click(s%16,Math.floor(s/16)); ok(hintBot(g)==='won',`${sh} not cleared by hints`); } });
section('Analysis: a hint-only run has 3BV, no guesses',()=>{
  const g=new E.Classic(16,16,40); g.click(8,8); const log=[{t:0,a:'r',i:8*16+8}]; let t=0;
  while(g.state==='play'){ const h=E.classicHint(g,8,8); if(!h) break; t+=400; const i=h.t[1]*16+h.t[0]; log.push({t,a:'r',i}); g.click(...h.t); }
  const a=E.analyze(g,log); ok(g.state==='won','run not won'); ok(a.bbbv>0&&a.bbbv<=log.length,'3BV out of range'); ok(a.guesses.length===0,'hint run flagged as guessing'); });
