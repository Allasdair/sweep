// ===================== ENGINE =====================
// Generic constraint deduction. cons: [{c:[cellIds], n:minesAmongThem}]
// kind tells which technique was needed: 'single' (one number) or 'pair' (two numbers together)
function deduce(cons){
  const safe=new Set(), mine=new Set();
  for(const k of cons){
    if(k.n===0){ for(const x of k.c) safe.add(x); }
    else if(k.n===k.c.length){ for(const x of k.c) mine.add(x); }
  }
  if(safe.size||mine.size) return {safe,mine,kind:'single'};
  const byCell=new Map();
  for(let i=0;i<cons.length;i++) for(const x of cons[i].c){ let a=byCell.get(x); if(!a) byCell.set(x,a=[]); a.push(i); }
  const sets=cons.map(k=>new Set(k.c));
  for(let i=0;i<cons.length;i++){
    const A=cons[i], sA=sets[i], partners=new Set();
    for(const x of A.c) for(const j of byCell.get(x)) if(j!==i) partners.add(j);
    for(const j of partners){
      const B=cons[j], sB=sets[j], onlyA=[], onlyB=[];
      for(const x of B.c) if(!sA.has(x)) onlyB.push(x);
      for(const x of A.c) if(!sB.has(x)) onlyA.push(x);
      if(B.n-A.n===onlyB.length && (onlyA.length||onlyB.length)){
        for(const x of onlyB) mine.add(x);
        for(const x of onlyA) safe.add(x);
      }
    }
    if(safe.size||mine.size) return {safe,mine,kind:'pair'};
  }
  return {safe,mine,kind:null};
}

// ---------- Double mines: cells hold 0..maxV mines, numbers count mines ----------
// cons: [{c:[cells], n, o:origin}]. Returns {safe:Set, mine:Map(cell->value), kind, from:[origins]} or null.
function feasible(v,val,Cv,cons,maxV,limit){
  const cells=[v], seen=new Set([v]);
  for(const ci of Cv) for(const x of cons[ci].c) if(!seen.has(x)){ seen.add(x); cells.push(x); }
  const sum=new Int16Array(Cv.length), rem=new Int16Array(Cv.length), mem=cells.map(()=>[]);
  Cv.forEach((ci,k)=>{ rem[k]=cons[ci].c.length*maxV; cons[ci].c.forEach(x=>mem[cells.indexOf(x)].push(k)); });
  let nodes=0;
  const go=(d)=>{ if(++nodes>limit) return null;
    if(d===cells.length){ for(let k=0;k<Cv.length;k++) if(sum[k]!==cons[Cv[k]].n) return false; return true; }
    const lo=d===0?val:0, hi=d===0?val:maxV;
    for(let w=lo;w<=hi;w++){ let ok=true;
      for(const k of mem[d]){ sum[k]+=w; rem[k]-=maxV; if(sum[k]>cons[Cv[k]].n||sum[k]+rem[k]<cons[Cv[k]].n) ok=false; }
      let r=false; if(ok) r=go(d+1);
      for(const k of mem[d]){ sum[k]-=w; rem[k]+=maxV; }
      if(r===null) return null; if(r) return true; }
    return false; };
  return go(0);
}
function dblDeduce(cons,maxV,simpleOnly){
  for(const k of cons){ if(!k.c.length) continue;
    if(k.n===0) return {safe:new Set(k.c),mine:new Map(),kind:'single',from:[k.o]};
    if(k.n===maxV*k.c.length) return {safe:new Set(),mine:new Map(k.c.map(x=>[x,maxV])),kind:'single',from:[k.o]};
    if(k.c.length===1&&k.n<=maxV) return {safe:new Set(),mine:new Map([[k.c[0],k.n]]),kind:'single',from:[k.o]}; }
  if(simpleOnly) return null;
  const byCell=new Map(); cons.forEach((k,i)=>k.c.forEach(x=>{ let a=byCell.get(x); if(!a) byCell.set(x,a=[]); a.push(i); }));
  for(const [v,Cv] of byCell){
    const poss=[]; let bad=false;
    for(let val=0;val<=maxV;val++){ const r=feasible(v,val,Cv,cons,maxV,4000); if(r===null){ bad=true; break; } if(r) poss.push(val); }
    if(bad||poss.length!==1) continue;
    const from=Cv.map(i=>cons[i].o);
    if(poss[0]===0) return {safe:new Set([v]),mine:new Map(),kind:'pair',from};
    return {safe:new Set(),mine:new Map([[v,poss[0]]]),kind:'pair',from};
  }
  return null;
}
function dblSolve(N,nb,mines,start,total,mask,opt){
  const num=countNums(N,nb,mines), rev=new Uint8Array(N), known=new Uint8Array(N), stats={single:0,pair:0,count:0};
  let NP=N; if(mask){ NP=0; for(let i=0;i<N;i++) NP+=mask[i]; }
  let mineCells=0; for(let i=0;i<N;i++) if(mines[i]) mineCells++;
  let revCount=0, kw=0, snap=null; const target=NP-mineCells;
  const open=s=>{ const st=[s]; while(st.length){ const i=st.pop(); if(rev[i]||known[i]) continue;
    if(mines[i]) throw new Error('solver opened a mine'); rev[i]=1; revCount++;
    if(num[i]===0) for(const j of nb[i]) if(!rev[j]) st.push(j); } };
  open(start);
  while(revCount<target){
    const cons=[];
    for(let i=0;i<N;i++){ if(!rev[i]||num[i]===0) continue; const c=[]; let m=0;
      for(const j of nb[i]){ if(known[j]) m+=mines[j]; else if(!rev[j]) c.push(j); }
      if(c.length) cons.push({c,n:num[i]-m,o:i}); }
    let r=dblDeduce(cons,2);
    if(!r){ const rem=total-kw, unk=[]; for(let i=0;i<N;i++) if(!rev[i]&&!known[i]&&(!mask||mask[i])) unk.push(i);
      if(rem===0) r={safe:new Set(unk),mine:new Map()}; else if(rem===2*unk.length) r={safe:new Set(),mine:new Map(unk.map(x=>[x,2]))};
      else return {ok:false,rev,mk:known,stats}; stats.count++; }
    else if(r.kind==='pair'){ if(opt&&opt.snap&&!snap){ const f=revCount/target; if(f>=opt.snap[0]&&f<=opt.snap[1]) snap={rev:rev.slice(),mk:known.slice()}; } stats.pair++; }
    else stats.single++;
    for(const [x] of r.mine) if(!known[x]){ known[x]=1; kw+=mines[x]; }
    for(const x of r.safe) open(x);
  }
  return {ok:true,stats,snap};
}

// ---------- Board shapes (mask: 1 = playable tile, 0 = no tile) ----------
const SHAPES=['ring','heart','diamond','cross','hourglass','swiss','islands'];
const SHAPE_NAMES={ring:'Ring',heart:'Heart',diamond:'Diamond',cross:'Cross',hourglass:'Hourglass',swiss:'Swiss Cheese',islands:'Twin Islands'};
const SHAPE_FILL={ring:.58,heart:.6,diamond:.52,cross:.56,hourglass:.6,swiss:.82,islands:.5};
function shapeMask(name,W,H,rng=Math.random){
  const m=new Uint8Array(W*H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const u=(x+.5)/W*2-1, v=(y+.5)/H*2-1; let on=1;
    if(name==='ring'){ const r=Math.hypot(u,v); on=r<=1.02&&r>=.5; }
    else if(name==='heart'){ const X=u*1.22, Y=-v*1.25+.22, a=X*X+Y*Y-1; on=a*a*a-X*X*Y*Y*Y<=0; }
    else if(name==='diamond') on=Math.abs(u)+Math.abs(v)<=1.04;
    else if(name==='cross') on=Math.abs(u)<=.37||Math.abs(v)<=.37;
    else if(name==='hourglass') on=Math.abs(u)<=Math.abs(v)*.95+.24;
    else if(name==='islands'){ const r1=Math.hypot((u+.5)*1.05,v), r2=Math.hypot((u-.5)*1.05,v); on=r1<=.52||r2<=.52||(Math.abs(v)<=.16&&Math.abs(u)<=.55); }
    m[y*W+x]=on?1:0;
  }
  if(name==='swiss'){ const holes=Math.max(3,Math.round(W*H/42));
    for(let h=0;h<holes;h++){ const cx=1+rng()*(W-2), cy=1+rng()*(H-2), r=.9+rng()*.9;
      for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(Math.hypot(x+.5-cx,y+.5-cy)<=r) m[y*W+x]=0; } }
  // keep only the largest connected region so the whole board is reachable by logic
  const seen=new Int32Array(W*H).fill(-1); let best=-1, bestN=0, id=0;
  for(let i=0;i<W*H;i++){ if(!m[i]||seen[i]>=0) continue; let n=0; const st=[i]; seen[i]=id;
    while(st.length){ const c=st.pop(); n++; const cx=c%W, cy=(c/W)|0;
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const nx=cx+dx, ny=cy+dy; if(nx<0||ny<0||nx>=W||ny>=H) continue;
        const j=ny*W+nx; if(m[j]&&seen[j]<0){ seen[j]=id; st.push(j); } } }
    if(n>bestN){ bestN=n; best=id; } id++; }
  for(let i=0;i<W*H;i++) if(m[i]&&seen[i]!==best) m[i]=0;
  return m;
}

// ---------- Classic (fixed board, optional shape mask) ----------
// Rule variants change who counts as a neighbour:
// sq = the usual 8 · hex = 6 (odd rows shifted right) · wrap = 8 with edges joined · knight = the 8 knight's moves
const OFF_SQ=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]], OFF_KN=[[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
const OFF_HEX=[[[-1,0],[1,0],[-1,-1],[0,-1],[-1,1],[0,1]],[[-1,0],[1,0],[0,-1],[1,-1],[0,1],[1,1]]];
function makeNb(W,H,mask,mode){
  const nb=new Array(W*H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const a=[], i=y*W+x;
    if(!mask||mask[i]){
      const offs=mode==='hex'?OFF_HEX[y&1]:mode==='knight'?OFF_KN:OFF_SQ;
      for(const [dx,dy] of offs){ let nx=x+dx, ny=y+dy;
        if(mode==='wrap'){ nx=(nx+W)%W; ny=(ny+H)%H; }
        if(nx>=0&&ny>=0&&nx<W&&ny<H&&(!mask||mask[ny*W+nx])){ const j=ny*W+nx; if(j!==i&&!a.includes(j)) a.push(j); } }
    }
    nb[i]=a;
  }
  return nb;
}
function countNums(N,nb,mines){
  const num=new Uint8Array(N);
  for(let i=0;i<N;i++){ if(mines[i]){num[i]=9;continue;} let c=0; for(const j of nb[i]) c+=mines[j]; num[i]=c; }
  return num;
}
// Solves from the first click using logic only. Returns ok, which techniques were needed,
// and optionally a snapshot taken at the first two-number step once progress is within opt.snap=[lo,hi].
function classicSolve(N,nb,mines,start,total,mask,opt){
  const num=countNums(N,nb,mines), rev=new Uint8Array(N), mk=new Uint8Array(N), stats={single:0,pair:0,count:0};
  let NP=N; if(mask){ NP=0; for(let i=0;i<N;i++) NP+=mask[i]; }
  let revCount=0, mkCount=0, snap=null; const target=NP-total;
  const open=s=>{ const st=[s]; while(st.length){ const i=st.pop(); if(rev[i]||mk[i]) continue;
    if(mines[i]) throw new Error('solver opened a mine'); rev[i]=1; revCount++;
    if(num[i]===0) for(const j of nb[i]) if(!rev[j]) st.push(j); } };
  open(start);
  while(revCount<target){
    const cons=[];
    for(let i=0;i<N;i++){ if(!rev[i]||num[i]===0) continue; const c=[]; let m=0;
      for(const j of nb[i]){ if(mk[j]) m++; else if(!rev[j]) c.push(j); }
      if(c.length) cons.push({c,n:num[i]-m}); }
    const {safe,mine,kind}=deduce(cons);
    if(!safe.size&&!mine.size){
      const rem=total-mkCount, unk=[];
      for(let i=0;i<N;i++) if(!rev[i]&&!mk[i]&&(!mask||mask[i])) unk.push(i);
      if(rem===0) unk.forEach(x=>safe.add(x));
      else if(rem===unk.length) unk.forEach(x=>mine.add(x));
      else return {ok:false,rev,mk,stats};
      stats.count++;
    } else if(kind==='pair'){
      if(opt&&opt.snap&&!snap){ const f=revCount/target; if(f>=opt.snap[0]&&f<=opt.snap[1]) snap={rev:rev.slice(),mk:mk.slice()}; }
      stats.pair++;
    } else stats.single++;
    for(const x of mine) if(!mk[x]){ mk[x]=1; mkCount++; }
    for(const x of safe) open(x);
  }
  return {ok:true,stats,snap};
}
// opts: {mask, accept(stats)->bool, snap:[lo,hi] (puzzle levels need a snapshot), budget ms}
function genClassic(W,H,total,start,rng=Math.random,opts={}){
  const N=W*H, mask=opts.mask||null, nb=makeNb(W,H,mask,opts.mode), zone=new Uint8Array(N), budget=opts.budget||4000;
  const dbl=opts.dbl, solve=dbl?dblSolve:classicSolve, cellsN=dbl?dbl.cells:total;
  let NP=N; if(mask){ NP=0; for(let i=0;i<N;i++) NP+=mask[i]; }
  zone[start]=1; if(NP-total>=nb[start].length+1) for(const j of nb[start]) zone[j]=1;
  const cand=[]; for(let i=0;i<N;i++) if(!zone[i]&&(!mask||mask[i])) cand.push(i);
  const place=()=>{ const m=new Uint8Array(N), c=cand.slice();
    for(let k=0;k<cellsN;k++){ const r=k+(rng()*(c.length-k)|0); [c[k],c[r]]=[c[r],c[k]]; m[c[k]]=dbl&&k<dbl.doubles?2:1; } return m; };
  let mines=place(), fallback=null; const t0=Date.now(), soft=budget*.6, steps=opts.steps||0;
  for(let it=0;;it++){
    const r=solve(N,nb,mines,start,total,mask,opts);
    if(r.ok){
      const good=(!opts.accept||opts.accept(r.stats))&&(!opts.snap||r.snap);
      if(good) return {mines,tries:it,ok:true,stats:r.stats,snap:r.snap};
      if(!opts.snap&&!fallback) fallback={mines:mines.slice(),stats:r.stats};
      if((steps?it>=steps*.6:Date.now()-t0>soft)&&fallback) return {mines:fallback.mines,tries:it,ok:true,stats:fallback.stats,graded:false};
      mines=place(); continue;
    }
    if(steps?it>=steps:Date.now()-t0>budget) return fallback?{mines:fallback.mines,tries:it,ok:true,stats:fallback.stats,graded:false}:{mines,tries:it,ok:false};
    if(it%50===49){ mines=place(); continue; }
    const fr=[], inr=[];
    for(let i=0;i<N;i++){ if(r.rev[i]||(mask&&!mask[i])) continue; let adj=false;
      for(const j of nb[i]) if(r.rev[j]){adj=true;break;}
      if(adj){ if(mines[i]&&!r.mk[i]) fr.push(i); } else if(!mines[i]&&!zone[i]) inr.push(i); }
    if(!fr.length||!inr.length){ mines=place(); continue; }
    const from=fr[rng()*fr.length|0], to=inr[rng()*inr.length|0]; mines[to]=mines[from]; mines[from]=0;
  }
}

class Classic{
  constructor(W,H,total,mask,genOpts){
    mask=mask||new Uint8Array(W*H).fill(1); let NP=0; for(const v of mask) NP+=v; genOpts=genOpts||{};
    const mode=genOpts.mode||'sq', dbl=genOpts.dbl||null;
    Object.assign(this,{W,H,total,N:W*H,NP,mask,mode,dbl,mineCells:dbl?dbl.cells:total,genOpts,nb:makeNb(W,H,mask,mode),mines:null,num:null,
      rev:new Uint8Array(W*H),flag:new Uint8Array(W*H),state:'ready',revCount:0,flagCount:0,
      flagsPlaced:0,chords:0,t0:0,t1:0,boom:-1});
  }
  has(x,y){ return x>=0&&y>=0&&x<this.W&&y<this.H&&!!this.mask[y*this.W+x]; }
  cell(x,y){ // {r:revealed,n:number,f:flag,m:mine(shown only at end),v:void}
    const i=y*this.W+x; if(!this.mask[i]) return {v:1};
    return {r:this.rev[i],n:this.num?this.num[i]:0,f:this.flag[i],m:this.mines?this.mines[i]:0};
  }
  elapsed(){ return this.state==='ready'?0:((this.state==='play'?Date.now():this.t1)-this.t0)/1000; }
  _open(s){ const st=[s];
    while(st.length){ const i=st.pop(); if(this.rev[i]||this.flag[i]) continue; this.rev[i]=1; this.revCount++; if(this.opened) this.opened.push(i);
      if(this.num[i]===0) for(const j of this.nb[i]) if(!this.rev[j]) st.push(j); } }
  // Lay out a finished board (used by puzzles and saves)
  setMines(mines){ this.mines=mines; this.num=countNums(this.N,this.nb,mines); }
  click(x,y){
    if(this.state==='won'||this.state==='lost') return;
    const i=y*this.W+x; if(!this.mask[i]) return;
    if(this.state==='ready'){
      const g=genClassic(this.W,this.H,this.total,i,Math.random,Object.assign({mask:this.mask},this.genOpts));
      this.setMines(g.mines); this.genStats=g.stats;
      this.state='play'; this.t0=Date.now();
    }
    if(this.rev[i]) return this.chord(i);
    if(this.flag[i]) return;
    if(this.mines[i]) return this._lose(i);
    this._open(i); this._checkWin();
  }
  chord(i){
    const n=this.num[i]; if(!n) return; let f=0;
    for(const j of this.nb[i]) f+=this.flag[j]; // flag value = mines marked (2 on double-mine boards)
    if(f!==n) return;
    let any=false;
    for(const j of this.nb[i]) if(!this.rev[j]&&!this.flag[j]){ any=true; if(this.mines[j]){ this.chords++; return this._lose(j); } this._open(j); }
    if(any) this.chords++;
    this._checkWin();
  }
  toggleFlag(x,y){
    if(this.state!=='play') return false; const i=y*this.W+x; if(this.rev[i]||!this.mask[i]) return false;
    const old=this.flag[i], nv=this.dbl?(old+1)%3:old^1; this.flag[i]=nv; this.flagCount+=nv-old; if(nv>old&&old===0) this.flagsPlaced++; return true;
  }
  _lose(i){ this.state='lost'; this.boom=i; this.t1=Date.now(); }
  _checkWin(){ if(this.revCount===this.NP-this.mineCells){ this.state='won'; this.t1=Date.now();
    for(let i=0;i<this.N;i++) if(this.mines[i]&&this.flag[i]!==this.mines[i]){ this.flagCount+=this.mines[i]-this.flag[i]; this.flag[i]=this.mines[i]; } } }
}
// Build a "solve this position" puzzle: a no-guess board shown part-way through,
// stopped right where the next move needs two numbers together. Deduced mines come pre-flagged.
function makePuzzle(W,H,total,opts={}){
  const mask=opts.mask||null, N=W*H, nb=makeNb(W,H,mask);
  for(let tries=0;tries<40;tries++){
    const cands=[]; for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){ const i=y*W+x; if(!mask||mask[i]) cands.push(i); }
    const start=cands[Math.random()*cands.length|0];
    const g=genClassic(W,H,total,start,Math.random,Object.assign({},opts,{snap:opts.snap||[.3,.7],budget:1500}));
    if(g.ok&&g.snap) return {mines:g.mines,rev:g.snap.rev,mk:g.snap.mk,stats:g.stats};
  }
  return null;
}
// ---------- Endless (infinite map, lazily committed) ----------
const OFF=16777216, MUL=33554432;
const K=(x,y)=>(x+OFF)*MUL+(y+OFF);
const KX=k=>Math.floor(k/MUL)-OFF, KY=k=>(k%MUL)-OFF;
const nbK=k=>[k-MUL-1,k-MUL,k-MUL+1,k-1,k+1,k+MUL-1,k+MUL,k+MUL+1];

class Endless{
  constructor(p,rng=Math.random){
    Object.assign(this,{p,rng,st:new Map(),rev:new Map(),flags:new Set(),front:new Set(),km:new Set(),
      hints:new Set(),state:'ready',cleared:0,flagsPlaced:0,boom:null,t0:0,t1:0,hintsGiven:0});
  }
  has(){ return true; }
  cell(x,y){ const k=K(x,y), r=this.rev.has(k);
    return {r:r?1:0,n:r?this.rev.get(k):0,f:this.flags.has(k)?1:0,m:this.st.get(k)===1?1:0,h:this.hints.has(k)}; }
  elapsed(){ return this.state==='ready'?0:((this.state==='play'?Date.now():this.t1)-this.t0)/1000; }
  _commit(k,log){ if(!this.st.has(k)){ this.st.set(k,this.rng()<this.p?1:0); log.c.push(k); } }
  _open(s,log){
    const stack=[s];
    while(stack.length){
      const k=stack.pop(); if(this.rev.has(k)||this.flags.has(k)) continue;
      const nb=nbK(k); for(const j of nb) this._commit(j,log);
      let n=0; for(const j of nb) n+=this.st.get(j);
      this.rev.set(k,n); log.r.push(k); this.hints.delete(k);
      if(n>0){ this.front.add(k); log.f.push(k); }
      else for(const j of nb) if(!this.rev.has(j)) stack.push(j);
      if(log.r.length>30000) break;
    }
  }
  _rollback(log){ for(const k of log.r) this.rev.delete(k); for(const k of log.f) this.front.delete(k); for(const k of log.c) this.st.delete(k); }
  // Is there at least one cell a player can prove safe right now?
  _check(){
    const km=new Set(this.km);
    for(let it=0;it<400;it++){
      const cons=[];
      for(const f of this.front){ const c=[]; let m=0;
        for(const j of nbK(f)){ if(km.has(j)) m++; else if(!this.rev.has(j)) c.push(j); }
        if(c.length) cons.push({c,n:this.rev.get(f)-m}); }
      const {safe,mine}=deduce(cons);
      if(safe.size) return {ok:true,km};
      if(!mine.size) return {ok:false,km};
      for(const x of mine) km.add(x);
    }
    return {ok:false,km};
  }
  _prune(){ for(const f of this.front){ let open=false;
    for(const j of nbK(f)) if(!this.rev.has(j)&&!this.km.has(j)){open=true;break;}
    if(!open) this.front.delete(f); } }
  _hint(){ // logic ran dry: light up a guaranteed-safe frontier cell
    const c=[]; for(const f of this.front) for(const j of nbK(f))
      if(!this.rev.has(j)&&!this.km.has(j)&&this.st.get(j)===0&&!this.flags.has(j)) c.push(j);
    if(c.length){ this.hints.add(c[this.rng()*c.length|0]); this.hintsGiven++; }
  }
  click(x,y){ return this.clickK(K(x,y)); }
  clickK(k){
    if(this.state==='lost') return;
    if(this.rev.has(k)) return this.chord(k);
    if(this.flags.has(k)) return;
    if(this.state==='ready'){ this.state='play'; this.t0=Date.now(); this.st.set(k,0); for(const j of nbK(k)) this.st.set(j,0); }
    if(!this.st.has(k)) this.st.set(k,this.rng()<this.p?1:0); // blind guess far from the frontier
    if(this.st.get(k)===1) return this._lose(k);
    this._reveal(k);
  }
  _reveal(k){
    const TRIES=10; let res, log;
    for(let t=0;t<TRIES;t++){
      log={c:[],r:[],f:[]}; this._open(k,log); res=this._check();
      if(res.ok||t===TRIES-1) break;
      this._rollback(log);
    }
    this.cleared+=log.r.length; this.km=res.km; this._prune();
    if(this.opened) for(const k of log.r) this.opened.push(k);
    if(!res.ok&&!this.hints.size) this._hint();
  }
  chord(k){
    const n=this.rev.get(k); if(!n) return; let f=0; const nb=nbK(k);
    for(const j of nb) if(this.flags.has(j)) f++;
    if(f!==n) return;
    for(const j of nb) if(!this.rev.has(j)&&!this.flags.has(j)){ if(this.st.get(j)===1) return this._lose(j); this._reveal(j); }
  }
  toggleFlag(x,y){
    if(this.state!=='play') return false; const k=K(x,y); if(this.rev.has(k)) return false;
    if(this.flags.has(k)) this.flags.delete(k); else { this.flags.add(k); this.flagsPlaced++; } return true;
  }
  _lose(k){ this.state='lost'; this.boom=k; this.t1=Date.now(); }
}

// ---------- Hints: find a provable move and the numbers that prove it ----------
function pairScan(cons,wantSafe){
  const byCell=new Map();
  for(let i=0;i<cons.length;i++) for(const x of cons[i].c){ let a=byCell.get(x); if(!a) byCell.set(x,a=[]); a.push(i); }
  const sets=cons.map(k=>new Set(k.c));
  for(let i=0;i<cons.length;i++){
    const A=cons[i], sA=sets[i], partners=new Set();
    for(const x of A.c) for(const j of byCell.get(x)) if(j!==i) partners.add(j);
    for(const j of partners){
      const B=cons[j], sB=sets[j], onlyA=[], onlyB=[];
      for(const x of B.c) if(!sA.has(x)) onlyB.push(x);
      for(const x of A.c) if(!sB.has(x)) onlyA.push(x);
      if(B.n-A.n===onlyB.length&&(onlyA.length||onlyB.length)){
        if(wantSafe&&onlyA.length) return {safe:onlyA,mine:onlyB,from:[A.o,B.o]};
        if(!wantSafe&&onlyB.length) return {safe:[],mine:onlyB,from:[A.o,B.o]};
      }
    }
  }
  return null;
}
function explainStep(cons){ // prefers safe cells, simplest reasoning first
  for(const k of cons) if(k.n===0) return {safe:k.c,mine:[],from:[k.o]};
  const ps=pairScan(cons,true); if(ps) return ps;
  for(const k of cons) if(k.n===k.c.length) return {safe:[],mine:k.c,from:[k.o]};
  return pairScan(cons,false);
}
function searchHint(build,km,fallback){
  for(let it=0;it<600;it++){
    let r=explainStep(build());
    if(!r&&fallback) r=fallback();
    if(!r||(!r.safe.length&&!r.mine.length)) return null;
    if(r.safe.length) return r;
    for(const m of r.mine) km.add(m);
  }
  return null;
}
// Returns {t:[x,y], from:[[x,y]], mines:[[x,y]], count:bool, wrongFlag:bool} or null
function dblHint(g,cx,cy){
  const W=g.W, km=new Map(), xy=i=>[i%W,Math.floor(i/W)], dist=i=>(i%W-cx)**2+(Math.floor(i/W)-cy)**2;
  for(let it=0;it<400;it++){
    const cons=[];
    for(let i=0;i<g.N;i++){ if(!g.rev[i]||!g.num[i]) continue; const c=[]; let m=0;
      for(const j of g.nb[i]){ if(km.has(j)) m+=km.get(j); else if(!g.rev[j]) c.push(j); }
      if(c.length) cons.push({c,n:g.num[i]-m,o:i,d:dist(i)}); }
    cons.sort((a,b)=>a.d-b.d);
    let r=dblDeduce(cons,2);
    if(!r){ let kw=0; for(const v of km.values()) kw+=v; const unk=[]; for(let i=0;i<g.N;i++) if(!g.rev[i]&&!km.has(i)&&g.mask[i]) unk.push(i);
      if(unk.length&&g.total-kw===0) r={safe:new Set(unk),mine:new Map(),from:[],count:true}; else return null; }
    if(r.safe.size){ const t=[...r.safe].sort((a,b)=>(g.flag[a]-g.flag[b])||(dist(a)-dist(b)))[0];
      const near=new Set(); for(const o of r.from) for(const j of g.nb[o]) near.add(j);
      return {t:xy(t),from:r.from.map(xy),mines:[...km.keys()].filter(j=>near.has(j)&&!g.rev[j]).map(xy),count:!!r.count,wrongFlag:!!g.flag[t]}; }
    for(const [x,v] of r.mine) km.set(x,v);
  }
  return null;
}
function classicHint(g,cx,cy){
  if(g.state!=='play') return null;
  if(g.dbl) return dblHint(g,cx,cy);
  const W=g.W, km=new Set(), xy=i=>[i%W,Math.floor(i/W)], dist=i=>(i%W-cx)**2+(Math.floor(i/W)-cy)**2;
  const build=()=>{ const cons=[];
    for(let i=0;i<g.N;i++){ if(!g.rev[i]||!g.num[i]) continue; const c=[]; let m=0;
      for(const j of g.nb[i]){ if(km.has(j)) m++; else if(!g.rev[j]) c.push(j); }
      if(c.length) cons.push({c,n:g.num[i]-m,o:i,d:dist(i)}); }
    return cons.sort((a,b)=>a.d-b.d); };
  const fallback=()=>{ const unk=[]; for(let i=0;i<g.N;i++) if(!g.rev[i]&&!km.has(i)&&g.mask[i]) unk.push(i);
    if(!unk.length) return null; const rem=g.total-km.size;
    if(rem===0) return {safe:unk,mine:[],from:[],count:true};
    if(rem===unk.length) return {safe:[],mine:unk,from:[],count:true}; return null; };
  const r=searchHint(build,km,fallback); if(!r) return null;
  const cand=r.safe.slice().sort((a,b)=>(g.flag[a]-g.flag[b])||(dist(a)-dist(b))), t=cand[0];
  const near=new Set(); for(const o of r.from) for(const j of g.nb[o]) near.add(j);
  const mines=[...new Set([...km,...r.mine])].filter(j=>near.has(j)&&!g.rev[j]);
  return {t:xy(t),from:r.from.map(xy),mines:mines.map(xy),count:!!r.count,wrongFlag:!!g.flag[t]};
}
function endlessHint(g,cx,cy){
  if(g.state!=='play') return null;
  const km=new Set(g.km), xy=k=>[KX(k),KY(k)], dist=k=>(KX(k)-cx)**2+(KY(k)-cy)**2;
  const build=()=>{ const cons=[];
    for(const f of g.front){ const c=[]; let m=0;
      for(const j of nbK(f)){ if(km.has(j)) m++; else if(!g.rev.has(j)) c.push(j); }
      if(c.length) cons.push({c,n:g.rev.get(f)-m,o:f,d:dist(f)}); }
    return cons.sort((a,b)=>a.d-b.d); };
  const r=searchHint(build,km,null); if(!r) return null;
  const fl=k=>g.flags.has(k)?1:0;
  const cand=r.safe.slice().sort((a,b)=>(fl(a)-fl(b))||(dist(a)-dist(b))), t=cand[0];
  const near=new Set(); for(const o of r.from) for(const j of nbK(o)) near.add(j);
  const mines=[...new Set([...km,...r.mine])].filter(j=>near.has(j)&&!g.rev.has(j));
  return {t:xy(t),from:r.from.map(xy),mines:mines.map(xy),count:false,wrongFlag:!!fl(t)};
}
// ---------- 3BV: the fewest clicks that can clear the board ----------
// Each opening (connected zero region) counts 1, plus every number not touching an opening.
function bbbv(g,rev0){
  const seen=new Uint8Array(g.N); let n=0;
  for(let i=0;i<g.N;i++){ if(!g.mask[i]||g.mines[i]||g.num[i]!==0||seen[i]) continue;
    let fresh=!rev0||!rev0[i]; const st=[i]; seen[i]=1;
    while(st.length){ const c=st.pop(); for(const j of g.nb[c]){ if(g.mines[j]) continue; if(rev0&&!rev0[j]) fresh=true;
      if(g.num[j]===0&&!seen[j]){ seen[j]=1; st.push(j); } else if(g.num[j]>0) seen[j]=1; } }
    if(fresh) n++; }
  for(let i=0;i<g.N;i++) if(g.mask[i]&&!g.mines[i]&&g.num[i]>0&&!seen[i]&&!(rev0&&rev0[i])) n++;
  return n;
}
// Could the player have proved this tile safe (or a mine) at this moment? Returns the simplest technique needed.
function provable(g,rev,target,want,level){
  const maxV=g.dbl?2:1, km=new Map(), safe=new Set();
  for(let it=0;it<300;it++){
    const cons=[];
    for(let i=0;i<g.N;i++){ if(!rev[i]||!g.num[i]) continue; const c=[]; let m=0;
      for(const j of g.nb[i]){ if(km.has(j)) m+=km.get(j); else if(!rev[j]&&!safe.has(j)) c.push(j); }
      if(c.length) cons.push({c,n:g.num[i]-m,o:i}); }
    let r=null;
    if(g.dbl) r=dblDeduce(cons,maxV,level<2);
    else { const d=level<2?simpleDeduce(cons):deduce(cons); if(d.safe.size||d.mine.size) r={safe:d.safe,mine:new Map([...d.mine].map(x=>[x,1]))}; }
    if(!r&&level>=3){ let kw=0; for(const v of km.values()) kw+=v; const unk=[]; for(let i=0;i<g.N;i++) if(g.mask[i]&&!rev[i]&&!km.has(i)&&!safe.has(i)) unk.push(i);
      const rem=g.total-kw; if(unk.length&&rem===0) r={safe:new Set(unk),mine:new Map()}; else if(unk.length&&rem===maxV*unk.length&&!g.dbl) r={safe:new Set(),mine:new Map(unk.map(x=>[x,1]))}; }
    if(!r) break;
    for(const x of r.safe) safe.add(x); for(const [x,v] of r.mine) km.set(x,v);
    if(want==='safe'?safe.has(target):km.has(target)) return true;
  }
  return want==='safe'?safe.has(target):km.has(target);
}
function simpleDeduce(cons){ const safe=new Set(), mine=new Set();
  for(const k of cons){ if(k.n===0) k.c.forEach(x=>safe.add(x)); else if(k.n===k.c.length) k.c.forEach(x=>mine.add(x)); } return {safe,mine}; }
function classify(g,rev,target,want){
  if(provable(g,rev,target,want,1)) return 'single';
  if(provable(g,rev,target,want,2)) return 'pair';
  if(provable(g,rev,target,want,3)) return 'count';
  return 'guess';
}
// Replays a finished game's moves. log: [{t:ms since start, a:'r'|'f'|'c', i:cell}]
function analyze(g,log,rev0){
  const rev=rev0?rev0.slice():new Uint8Array(g.N), open=s=>{ const st=[s]; while(st.length){ const i=st.pop(); if(rev[i]) continue; rev[i]=1;
    if(g.num[i]===0) for(const j of g.nb[i]) if(!rev[j]) st.push(j); } };
  const steps=[], guesses=[]; let first=!rev0, prevT=0;
  for(const m of log){
    let kind=null;
    if(m.a==='r'&&!rev[m.i]){ if(first) kind='start'; else kind=classify(g,rev,m.i,'safe'); first=false; }
    else if(m.a==='f') kind=classify(g,rev,m.i,'mine');
    steps.push({gap:m.t-prevT,i:m.i,a:m.a,kind}); prevT=m.t;
    if(kind==='guess'&&m.a==='r') guesses.push(m.i);
    if(m.a==='r'&&!rev[m.i]&&!g.mines[m.i]) open(m.i);
    else if(m.a==='c'){ let f=0; for(const j of g.nb[m.i]) if(g.flag[j]||g.mines[j]) f++; for(const j of g.nb[m.i]) if(!g.mines[j]&&!rev[j]) open(j); }
  }
  const hes=steps.filter(s=>s.kind&&s.kind!=='start'&&s.gap>=1500).sort((a,b)=>b.gap-a.gap).slice(0,3);
  return {bbbv:bbbv(g,rev0),clicks:log.length,hes,guesses};
}
// ---------- Challenge codes: the exact board, packed into a short text code ----------
const B64U='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const toB64U=b=>{ let s=''; for(let i=0;i<b.length;i+=3){ const n=(b[i]<<16)|((b[i+1]||0)<<8)|(b[i+2]||0);
  s+=B64U[n>>18&63]+B64U[n>>12&63]+(i+1<b.length?B64U[n>>6&63]:'')+(i+2<b.length?B64U[n&63]:''); } return s; };
const fromB64U=s=>{ const out=[]; let buf=0,bits=0; for(const ch of s){ const v=B64U.indexOf(ch); if(v<0) throw new Error('char'); buf=(buf<<6)|v; bits+=6; if(bits>=8){ bits-=8; out.push((buf>>bits)&255); } } return Uint8Array.from(out); };
const MODES=['sq','hex','wrap','knight'];
const cleanName=t=>[...String(t).replace(/[\u0000-\u001f\u007f<>&"'`]/g,'')].slice(0,16).join('').trim(); // names are display-only text

// ---------- Friends' Board: the same board on every device for a given date ----------
// Seeded from the date alone and generated with a step limit instead of a time limit, so a slow phone
// and a fast one build the identical board. Results carry a fingerprint of the board, so a friend on a
// different game version is detected instead of being compared on a different board.
const FD_VER=1, FD_W=16, FD_H=16, FD_M=40, EPOCH=Date.UTC(2024,0,1);
function seedRng(str){ // cyrb128 -> sfc32
  let h1=1779033703,h2=3144134277,h3=1013904242,h4=2773480762;
  for(let i=0;i<str.length;i++){ const k=str.charCodeAt(i); h1=h2^Math.imul(h1^k,597399067); h2=h3^Math.imul(h2^k,2869860233); h3=h4^Math.imul(h3^k,951274213); h4=h1^Math.imul(h4^k,2716044813); }
  h1=Math.imul(h3^(h1>>>18),597399067); h2=Math.imul(h4^(h2>>>22),2869860233); h3=Math.imul(h1^(h3>>>17),951274213); h4=Math.imul(h2^(h4>>>19),2716044813);
  let a=(h1^h2^h3^h4)>>>0, b=(h2^h1)>>>0, c=(h3^h1)>>>0, d=(h4^h1)>>>0;
  const r=()=>{ a>>>=0; b>>>=0; c>>>=0; d>>>=0; let t=(a+b)|0; a=b^(b>>>9); b=(c+(c<<3))|0; c=(c<<21)|(c>>>11); d=(d+1)|0; t=(t+d)|0; c=(c+t)|0; return (t>>>0)/4294967296; };
  for(let i=0;i<15;i++) r(); return r;
}
function boardPrint(W,H,mines,start){ let h=2166136261; const add=v=>{ h^=v&255; h=Math.imul(h,16777619); };
  add(W); add(H); add(start&255); add(start>>8); for(let i=0;i<mines.length;i++) add(mines[i]); return (h>>>0).toString(16).padStart(8,'0'); }
const fdDay=date=>{ const [y,m,d]=date.split('-').map(Number); return Math.round((Date.UTC(y,m-1,d)-EPOCH)/864e5); };
const fdDate=n=>{ const t=new Date(EPOCH+n*864e5); return t.getUTCFullYear()+'-'+String(t.getUTCMonth()+1).padStart(2,'0')+'-'+String(t.getUTCDate()).padStart(2,'0'); };
function fdBoard(date){
  for(let a=0;a<20;a++){ const rng=seedRng(`SWFD${FD_VER}|${date}|${a}`);
    const sx=4+(rng()*8|0), sy=4+(rng()*8|0), start=sy*FD_W+sx;
    const g=genClassic(FD_W,FD_H,FD_M,start,rng,{steps:8000});
    if(g.ok) return {W:FD_W,H:FD_H,M:FD_M,start,mines:g.mines,fp:boardPrint(FD_W,FD_H,g.mines,start)}; }
  throw new Error('fd generation failed');
}
// Result code: SWR1.<base64url> = version, day, player id (6 bytes, random, anonymous), won+hints, time, board print, name
function encodeResult(r){
  const b=[1, r.day&255, r.day>>8, ...r.pid, (r.won?1:0)|(Math.min(127,r.hints|0)<<1)];
  const t=Math.max(0,Math.min(0xffffff,Math.round(r.time*10))); b.push(t&255,(t>>8)&255,t>>16);
  for(let i=0;i<8;i+=2) b.push(parseInt(r.fp.substr(i,2),16));
  const nm=new TextEncoder().encode(cleanName(r.name||'')); b.push(nm.length,...nm);
  return 'SWR1.'+toB64U(Uint8Array.from(b));
}
function decodeResult(code){
  const m=String(code).match(/SWR1\.([A-Za-z0-9_-]+)/); if(!m) throw new Error('nocode');
  const b=fromB64U(m[1]); if(b[0]!==1||b.length<18) throw new Error('version');
  let p=1; const day=b[p]|(b[p+1]<<8); p+=2; const pid=[...b.slice(p,p+6)]; p+=6; const st=b[p++];
  const time=(b[p]|(b[p+1]<<8)|(b[p+2]<<16))/10; p+=3; const fp=[...b.slice(p,p+4)].map(v=>v.toString(16).padStart(2,'0')).join(''); p+=4;
  const nl=b[p++]||0, name=cleanName(new TextDecoder().decode(b.slice(p,p+nl)));
  return {day,date:fdDate(day),pid:pid.map(v=>v.toString(16).padStart(2,'0')).join(''),won:!!(st&1),hints:st>>1,time,fp,name};
}
// ---------- League: League 0 is November 2026, then +1 every calendar month (local time) ----------
const lgNo=date=>{ const [y,m]=date.split('-').map(Number); return (y-2026)*12+(m-11); };
const lgMonth=n=>{ const t=10+n; return [2026+Math.floor(t/12),((t%12)+12)%12+1]; };
const lgDate=(n,day)=>{ const [y,m]=lgMonth(n); return `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`; };
const lgLen=n=>{ const [y,m]=lgMonth(n); return new Date(y,m,0).getDate(); };
// Season code: SWL2.<base64url> = version, season, player id, last season's rank, fingerprint of one played round,
// a bitmask of rounds played, then won+hints, time and % cleared for each played round, then the name.
// (SWL1 codes from v0.10 had no % cleared: wins read as 100%, losses as 0%.)
function encodeSeason(r){
  const b=[1, r.season&255, r.season>>8, ...r.pid, r.prev|0, r.fpDay|0];
  for(let i=0;i<8;i+=2) b.push(r.fp?parseInt(r.fp.substr(i,2),16):0);
  const days=Object.keys(r.days).map(Number).filter(d=>d>=1&&d<=31).sort((a,b)=>a-b); let mask=0; for(const d of days) mask|=1<<(d-1);
  b.push(mask&255,(mask>>>8)&255,(mask>>>16)&255,(mask>>>24)&255);
  for(const d of days){ const x=r.days[d], t=Math.max(0,Math.min(65535,Math.round(x.t*10))); b.push((x.won?1:0)|(Math.min(127,x.h|0)<<1),t&255,t>>8,Math.max(0,Math.min(100,x.won?100:Math.round(x.p||0)))); }
  const nm=new TextEncoder().encode(cleanName(r.name||'')); b[0]=2; b.push(nm.length,...nm);
  return 'SWL2.'+toB64U(Uint8Array.from(b));
}
function decodeSeason(code){
  const m=String(code).match(/SWL([12])\.([A-Za-z0-9_-]+)/); if(!m) throw new Error('nocode');
  const b=fromB64U(m[2]), v=b[0]; if(String(v)!==m[1]||b.length<20) throw new Error('version'); const per=v===2?4:3;
  let p=1; const season=b[p]|(b[p+1]<<8); p+=2; const pid=[...b.slice(p,p+6)].map(v=>v.toString(16).padStart(2,'0')).join(''); p+=6;
  const prev=b[p++], fpDay=b[p++], fp=[...b.slice(p,p+4)].map(v=>v.toString(16).padStart(2,'0')).join(''); p+=4;
  const mask=(b[p]|(b[p+1]<<8)|(b[p+2]<<16)|(b[p+3]<<24))>>>0; p+=4; const days={};
  for(let d=1;d<=31;d++) if(mask&(1<<(d-1))){ if(p+per>b.length) throw new Error('short'); const st=b[p], won=!!(st&1);
    days[d]={won,h:st>>1,t:(b[p+1]|(b[p+2]<<8))/10,p:won?100:per===4?Math.min(100,b[p+3]):0}; p+=per; }
  const nl=b[p++]||0, name=cleanName(new TextDecoder().decode(b.slice(p,p+nl)));
  return {season,pid,prev,fpDay,fp,days,name};
}
const allCodes=(text,re)=>[...String(text).matchAll(re)].map(m=>m[0]);
function encodeChallenge(g,meta){
  const b=[1, MODES.indexOf(g.mode)|(g.dbl?4:0)|(g.NP<g.N?8:0), meta.diff|0, g.W, g.H, meta.start&255, meta.start>>8,
    Math.min(65535,Math.round(meta.time*10))&255, Math.min(65535,Math.round(meta.time*10))>>8, meta.hints|0, meta.src|0, meta.lv|0];
  const nm=new TextEncoder().encode((meta.name||'').slice(0,16)); b.push(nm.length,...nm);
  const bits=[]; if(g.NP<g.N) for(let i=0;i<g.N;i++) bits.push(g.mask[i]);
  for(let i=0;i<g.N;i++){ if(g.dbl){ bits.push(g.mines[i]>>1&1,g.mines[i]&1); } else bits.push(g.mines[i]?1:0); }
  for(let i=0;i<bits.length;i+=8){ let v=0; for(let k=0;k<8;k++) v=(v<<1)|(bits[i+k]||0); b.push(v); }
  return 'SWC1.'+toB64U(Uint8Array.from(b));
}
function decodeChallenge(text){
  const m=String(text).match(/SWC1\.([A-Za-z0-9_-]+)/); if(!m) throw new Error('nocode');
  const b=fromB64U(m[1]); let p=0; const ver=b[p++]; if(ver!==1) throw new Error('version');
  const fl=b[p++], diff=b[p++], W=b[p++], H=b[p++], start=b[p++]|(b[p++]<<8), time=(b[p++]|(b[p++]<<8))/10, hints=b[p++], src=b[p++], lv=b[p++];
  const nl=b[p++], name=cleanName(new TextDecoder().decode(b.slice(p,p+nl))); p+=nl;
  const N=W*H, rd=(()=>{ let bi=0; return ()=>{ const v=(b[p+(bi>>3)]>>(7-(bi&7)))&1; bi++; return v; }; })();
  if(!W||!H||N>4000) throw new Error('size');
  const mode=MODES[fl&3], dbl=!!(fl&4), hasMask=!!(fl&8);
  const mask=new Uint8Array(N).fill(1); if(hasMask) for(let i=0;i<N;i++) mask[i]=rd();
  const mines=new Uint8Array(N); for(let i=0;i<N;i++) mines[i]=dbl?(rd()<<1|rd()):rd();
  if(start>=N||!mask[start]||mines[start]) throw new Error('start');
  return {mode,dbl,hasMask,mask,mines,W,H,diff,start,time,hints,src,lv,name};
}
if(typeof module!=='undefined') module.exports={deduce,genClassic,classicSolve,makeNb,Classic,Endless,K,KX,KY,nbK,classicHint,endlessHint,countNums,shapeMask,SHAPES,SHAPE_FILL,makePuzzle,makeNb,dblSolve,bbbv,analyze,classify,encodeChallenge,decodeChallenge,fdBoard,fdDay,fdDate,encodeResult,decodeResult,seedRng,boardPrint,allCodes,cleanName,lgNo,lgMonth,lgDate,lgLen,encodeSeason,decodeSeason};
