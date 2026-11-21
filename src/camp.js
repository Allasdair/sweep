// ===================== CAMPAIGNS =====================
// Each level is a recipe; every attempt gets a fresh board built from it.
// pair: how many "two numbers together" steps the board must need [min,max]
// shape: board shape · puzzle: start part-solved · twist: replaces the time star · grad: graduation board
const CAMPS=[
 {id:'beginner',name:'Beginner',xp:5,bonus:50,k:.5,levels:[
  {n:'First Light',W:6,H:6,M:3,pair:[0,0],tip:'Each number counts the mines touching that tile, diagonals included.'},
  {n:'Warm-Up',W:7,H:7,M:5,pair:[0,0],tip:'If a number has exactly that many hidden neighbours, they\'re all mines. Flag them.'},
  {n:'Clearing',W:8,H:8,M:7,pair:[0,0],tip:'When a number\'s mines are all flagged, tap it to clear the rest at once.'},
  {n:'Diamond',shape:'diamond',W:10,H:10,d:.11,pair:[0,0],tip:'Shaped boards follow the same rules. Edge tiles just have fewer neighbours.'},
  {n:'Two Heads',W:8,H:9,M:9,pair:[1,99],tip:'New: some tiles need two numbers together. Look for a 1 next to a 1 along an edge.'},
  {n:'Pairs',W:9,H:9,M:10,pair:[1,99],tip:'Compare neighbouring numbers that share hidden tiles. The difference tells you something.'},
  {n:'Pacifist',W:9,H:9,M:11,pair:[1,99],twist:'noflag',tip:'Bonus star: win without placing a single flag.'},
  {n:'Heart',shape:'heart',W:11,H:10,d:.12,pair:[1,99],tip:'A shaped board with a pair or two to find.'},
  {n:'Busy',W:10,H:10,M:13,pair:[2,99],tip:'More mines, more pairs. There\'s no clock on the first two stars.'},
  {n:'Halfway',puzzle:true,W:10,H:10,M:14,pair:[2,99],tip:'Puzzle: this board is part-solved. The next move needs two numbers together.'},
  {n:'Widening',W:10,H:12,M:16,pair:[2,99],tip:'A bigger board with the same logic.'},
  {n:'Ring',shape:'ring',W:12,H:12,d:.14,pair:[2,99],tip:'Work your way around the ring.'},
  {n:'Dense',W:11,H:12,M:19,pair:[3,99],tip:'Nearly Intermediate density.'},
  {n:'No Shortcuts',W:12,H:12,M:21,pair:[3,99],twist:'nochord',tip:'Bonus star: win without tapping a number to clear around it.'},
  {n:'Graduation',W:16,H:16,M:40,grad:true,tip:'A full Intermediate board. Clear it to graduate.'},
 ]},
 {id:'intermediate',name:'Intermediate',xp:8,bonus:100,k:.42,levels:[
  {n:'Step Up',W:13,H:13,M:26,tip:'Welcome to Intermediate. Same logic, more of it.'},
  {n:'Room to Think',W:14,H:14,M:31,tip:'Look for pairs along the edges of open areas.'},
  {n:'Overlaps',W:15,H:15,M:36,pair:[3,99],tip:'Plenty of spots where two numbers share tiles.'},
  {n:'Cross',shape:'cross',W:18,H:18,d:.16,tip:'Clear the centre, then work out along each arm.'},
  {n:'Standard Issue',W:16,H:16,M:42,pair:[3,99],tip:'Slightly denser than a regular Intermediate board.'},
  {n:'Hands Off',W:16,H:16,M:44,twist:'noflag',tip:'Bonus star: win without placing a flag.'},
  {n:'Tall Order',W:16,H:18,M:50,pair:[4,99],tip:'A taller board with more pairs to find.'},
  {n:'Hourglass',shape:'hourglass',W:20,H:20,d:.17,tip:'The narrow waist joins the two halves.'},
  {n:'Long Field',W:16,H:20,M:56,tip:'Keep a steady rhythm.'},
  {n:'Deadlock',puzzle:true,W:16,H:16,M:44,pair:[4,99],tip:'Puzzle: part-solved. Find the move that needs two numbers.'},
  {n:'Pressure',W:18,H:18,M:58,tip:'Near Expert density now.'},
  {n:'Swiss Cheese',shape:'swiss',W:20,H:20,d:.17,tip:'Holes make new edges, and edges make new patterns.'},
  {n:'Crowded',W:18,H:20,M:66,tip:'Busier still.'},
  {n:'Steady Hands',W:18,H:22,M:76,twist:'nochord',tip:'Bonus star: win without tapping numbers to clear around them.'},
  {n:'Graduation',W:16,H:30,M:99,grad:true,tip:'A full Expert board. Clear it to graduate.'},
 ]},
 {id:'expert',name:'Expert',xp:12,bonus:150,k:.4,levels:[
  {n:'Deep End',W:16,H:24,M:78,tip:'Expert density on a smaller board.'},
  {n:'Stretch',W:16,H:26,M:85,tip:'Growing toward full size.'},
  {n:'Full Expert',W:16,H:30,M:99,pair:[6,99],tip:'A regular Expert board, with plenty of pairs.'},
  {n:'Twin Islands',shape:'islands',W:30,H:30,d:.19,tip:'Cross the bridge to reach the second island.'},
  {n:'Tighter',W:16,H:30,M:103,tip:'A few more mines than standard Expert.'},
  {n:'Zen',W:18,H:30,M:110,twist:'noflag',tip:'Bonus star: win without placing a flag.'},
  {n:'Minefield',W:16,H:30,M:106,tip:'Denser than standard Expert.'},
  {n:'Big Ring',shape:'ring',W:26,H:26,d:.2,tip:'A wide ring with dense edges.'},
  {n:'Wide Open',W:18,H:30,M:120,tip:'A bigger board with denser mines.'},
  {n:'Gordian',puzzle:true,W:16,H:30,M:105,pair:[6,99],tip:'Puzzle: a dense board, part-solved. The next move needs two numbers.'},
  {n:'Gauntlet',W:20,H:30,M:135,tip:'Now past standard Expert.'},
  {n:'Diamond Mine',shape:'diamond',W:30,H:30,d:.2,tip:'A big diamond.'},
  {n:'Crush',W:20,H:30,M:140,tip:'Very dense. Take your time.'},
  {n:'Precision',W:20,H:32,M:150,twist:'nochord',tip:'Bonus star: win without tapping numbers to clear around them.'},
  {n:'Grandmaster',W:24,H:30,M:170,grad:true,tip:'The final board, beyond Expert.'},
 ]},
];
// Build a concrete spec for a level (portrait boards rotate on landscape screens)
function levelSpec(ci,li,landscape){
  const C=CAMPS[ci], L=C.levels[li]; let W=L.W, H=L.H;
  if(landscape&&W<H) [W,H]=[H,W];
  let mask=null, M=L.M;
  if(L.shape){ mask=shapeMask(L.shape,W,H); let P=0; for(const v of mask) P+=v; M=Math.round(P*L.d); }
  const pr=L.pair||[0,99], accept=st=>st.pair>=pr[0]&&st.pair<=pr[1];
  let P=W*H; if(mask){ P=0; for(const v of mask) P+=v; }
  const dens=M/P, par=Math.round(((P-M)*C.k*(1+Math.max(0,dens-.12)*2.5)+10)/5)*5;
  return {W,H,M,mask,accept,par,P};
}
if(typeof module!=='undefined') module.exports={CAMPS,levelSpec};
