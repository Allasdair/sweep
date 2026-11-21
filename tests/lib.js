// Tiny test helper: no dependencies, so `node tests/run.js` works anywhere Node 18+ is installed.
const E=require('../src/engine.js'); Object.assign(globalThis,E); // camp.js uses engine functions as globals, like in the browser
const C=require('../src/camp.js');
let fails=0, passes=0;
function ok(cond,msg){ if(cond) passes++; else { fails++; console.log('  ✗ '+msg); } }
function section(name,fn){ const t=Date.now(); const f0=fails; fn(); console.log(`${fails===f0?'✓':'✗'} ${name} (${Date.now()-t} ms)`); }
// Plays a started Classic game to the end using only hints; returns 'won', 'stuck' or 'boom'.
function hintBot(g,limit=4000){
  for(let k=0;k<limit&&g.state==='play';k++){ const h=E.classicHint(g,g.W/2,g.H/2); if(!h) return 'stuck';
    const i=h.t[1]*g.W+h.t[0]; if(g.mines[i]) return 'boom'; g.click(...h.t); }
  return g.state==='won'?'won':g.state; }
module.exports={E,C,ok,section,hintBot,done:()=>({fails,passes})};
