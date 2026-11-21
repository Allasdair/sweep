const {E,ok,section,hintBot}=require('./lib');
// Golden fingerprints: if these change, the league board generator changed and players on different
// versions would get different boards. Only update them together with a deliberate FD_VER bump.
const GOLDEN={'2026-11-21':['96a2d3cb',154],'2026-12-01':['edfdd362',91],'2027-02-28':['f4600992',171]};
section('League boards are identical to the golden fingerprints',()=>{
  for(const [d,[fp,start]] of Object.entries(GOLDEN)){ const b=E.fdBoard(d); ok(b.fp===fp&&b.start===start,`${d} board changed: ${b.fp}/${b.start}`); } });
section('League boards are deterministic and no-guess from their start tile',()=>{
  for(let n=1050;n<1110;n++){ const d=E.fdDate(n), a=E.fdBoard(d), b=E.fdBoard(d); ok(a.fp===b.fp,`${d} not repeatable`);
    const g=new E.Classic(16,16,40); g.setMines(a.mines); g.state='play'; g.t0=Date.now(); g.click(a.start%16,Math.floor(a.start/16)); ok(hintBot(g)==='won',`${d} not cleared`); } });
section('League numbering: League 0 = November 2026, +1 each month',()=>{
  ok(E.lgNo('2026-11-21')===0&&E.lgNo('2026-12-01')===1&&E.lgNo('2027-11-30')===12,'lgNo');
  ok(E.lgMonth(0).join()==='2026,11'&&E.lgMonth(2).join()==='2027,1'&&E.lgLen(0)===30&&E.lgLen(3)===28,'lgMonth/lgLen');
  ok(E.fdDate(E.fdDay('2027-03-01'))==='2027-03-01','fdDay/fdDate roundtrip'); });
section('Season codes round-trip (v2) and old v1 codes still decode',()=>{
  const days={1:{won:true,h:0,t:88.4,p:100},2:{won:false,h:1,t:40,p:82},31:{won:true,h:2,t:300,p:100}};
  const c=E.encodeSeason({season:3,pid:[1,2,3,4,5,6],prev:1,fpDay:2,fp:'0a0b0c0d',days,name:'Zoë <b>'});
  const d=E.decodeSeason('hi '+c+' bye');
  ok(d.season===3&&d.pid==='010203040506'&&d.prev===1&&d.fp==='0a0b0c0d'&&d.name==='Zoë b','header fields');
  ok(d.days[2].p===82&&!d.days[2].won&&d.days[2].h===1&&d.days[1].t===88.4&&d.days[31].h===2,'round fields');
  const v1=[1,0,0,1,2,3,4,5,6,0,1,10,11,12,13,1,0,0,0,1,1000&255,1000>>8,1,65];
  const o=E.decodeSeason('SWL1.'+Buffer.from(v1).toString('base64url'));
  ok(o.days[1].won&&o.days[1].p===100&&o.days[1].t===100&&o.name==='A','v1 decode'); });
section('Challenge and result codes round-trip; names are cleaned',()=>{
  const g=new E.Classic(16,16,40,null,{mode:'hex'}); g.click(8,8);
  const ch=E.decodeChallenge(E.encodeChallenge(g,{diff:1,start:8*16+8,time:71.2,hints:0,name:'<img onerror=x>'}));
  ok(ch.mode==='hex'&&ch.mines.every((v,i)=>v===g.mines[i])&&ch.time===71.2&&!/[<>]/.test(ch.name),'challenge code');
  const r=E.decodeResult(E.encodeResult({day:1055,pid:[9,9,9,9,9,9],won:true,hints:1,time:-5,fp:'01020304',name:'Pat'}));
  ok(r.time===0&&r.won&&r.hints===1&&r.name==='Pat','result code (negative time clamps to 0)'); });
