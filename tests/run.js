// Runs every *.test.js in this folder. Exit code 1 if anything fails.  Usage: node tests/run.js
const fs=require('fs'), path=require('path'); const t0=Date.now();
for(const f of fs.readdirSync(__dirname).filter(f=>f.endsWith('.test.js')).sort()){ console.log(`\n${f}`); require(path.join(__dirname,f)); }
const {fails,passes}=require('./lib').done();
console.log(`\n${passes} checks passed, ${fails} failed (${((Date.now()-t0)/1000).toFixed(1)} s)`); process.exit(fails?1:0);
