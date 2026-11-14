/* Formino Final: executable program QA. No external modules, real source dataset. */
'use strict';
const assert=require('node:assert/strict');
global.window=global;
require('./research-data.js');require('./workouts.js');require('./adaptive-final.js');
const P=global.FITNESS_PLAN,A=global.FORMINO_ADAPT,D=global.FORMINO_RESEARCH_DATA;
assert.equal(P.version,7);assert.equal(D.sessions.length,120);
assert.equal(D.weeks.length,24);assert.equal(D.exercises.length,22);
assert.equal(Object.keys(P.sourceVariants).length,71);
assert.deepEqual(P.sessions.map(s=>s.code),['A','D','B','C','E']);
let totalMain=0,totalSets=0,errors=[];let mins=Infinity,maxs=-Infinity;
for(let i=1;i<=120;i++){
 const raw=D.sessions[i-1],p=P.forNumber(i),same=P.prescription(raw.week,raw.type);
 assert.equal(p.sessionId,raw.id);assert.equal(p.sessionId,same.sessionId);
 assert.equal(p.steps.length,raw.main.length);
 assert.equal(p.durationSeconds,raw.duration_seconds);
 assert.ok(Number.isFinite(p.duration)&&p.duration>0);
 assert.equal(Math.round((p.warmup+p.strength+p.cardioMinutes+p.cooldown)*60),raw.duration_seconds);
 const warm=raw.warm_up.reduce((v,x)=>v+x.duration_seconds,0),cool=raw.cool_down.reduce((v,x)=>v+x.duration_seconds,0);
 assert.equal(p.warmup*60,warm);assert.equal(p.cooldown*60,cool);
 assert.equal(p.cardioMinutes*60,raw.cardio.total_seconds);
 assert.equal(raw.cardio.round_seconds,raw.cardio.steps.reduce((v,x)=>v+x.duration_seconds,0));
 assert.equal(raw.cardio.rounds*raw.cardio.round_seconds,raw.cardio.total_seconds);
 const ids=new Set();
 for(let j=0;j<raw.main.length;j++){
  const x=raw.main[j],row=p.steps[j],ex=P.exercises[x.variant_id];
  assert.equal(row.id,x.variant_id);assert.ok(!ids.has(row.id));ids.add(row.id);
  assert.ok(ex&&ex.how.length>=3&&ex.fa&&ex.en&&ex.safety);
  assert.equal(row.sets,x.sets);assert.equal(row.targets.length,row.sets);
  assert.deepEqual(row.targets,x.set_targets.map(s=>s.target));
  assert.equal(row.unit,x.set_targets[0].unit);
  assert.equal(row.side,x.set_targets[0].per_side);
  assert.ok(row.rest>=45&&row.rest<=180);
  assert.ok(row.targets.every(n=>Number.isInteger(n)&&n>0));
  assert.ok(!/chair|bench|door_anchor|step_box|smith_machine/.test(ex.equip.toLowerCase()));
  const recommended=A.resolve(row,{finalCalibration:{},availableDumbbellWeights:[]},[], '2026-11-13');
  assert.equal(recommended.targets.length,row.sets);assert.ok(recommended.targets.every(x=>Number.isInteger(x)&&x>0));
  if(ex.type==='weight')assert.equal(recommended.calibrationPending,true);
  totalSets+=row.sets;
  totalMain++;
 }
 mins=Math.min(mins,p.duration);maxs=Math.max(maxs,p.duration);
}
assert.equal(totalMain,624);
assert.equal(D.sessions.filter(x=>['D','E'].includes(x.type)).length,48);
assert.equal(D.sessions.filter(x=>['A','B','C'].includes(x.type)).length,72);
// The research BUSY fallback applies only to resistance sessions, with fewer prescribed rows/sets.
let busyCount=0;
for(let n=1;n<=120;n++){
 const full=P.forNumber(n),short=P.busyForNumber(n);
 if(full.kind!=='strength'){
  assert.equal(short.sessionId,full.sessionId);
  continue;
 }
 assert.equal(short.sessionId,full.sessionId);
 assert.equal(short.executionMode,'busy');
 assert.ok(short.steps.length>=1&&short.steps.length<full.steps.length);
 assert.ok(short.steps.every(x=>x.sets>=1&&x.sets<=2));
 assert.ok(short.durationSeconds<full.durationSeconds);
 assert.ok(short.durationSeconds>0);
 assert.equal(Math.round((short.warmup+short.strength+short.cardioMinutes+short.cooldown)*60),short.durationSeconds);
 assert.ok(short.steps.reduce((n,x)=>n+x.sets,0)<=full.steps.reduce((n,x)=>n+x.sets,0),'BUSY cannot exceed full total sets');
 for(const x of short.steps){
  const base=full.steps.find(k=>k.familyId===x.familyId);
  assert.ok(P.exercises[x.id]&&P.sourceExercises[x.familyId],'BUSY must use source-verified movements');
  if(base)assert.ok(x.sets<=base.sets,'BUSY must not add sets for existing movement');
  assert.equal(x.targets.length,x.sets);
 }
 busyCount++;
}
assert.equal(busyCount,72);
assert.equal(P.research.weeks[7].weekly_set_count,24);
for(const week of P.research.weeks){assert.equal(week.session_ids.length,5);assert.equal(week.session_ids[0],`S${String((week.week-1)*5+1).padStart(3,'0')}`);}
// Regression: set count changing may not reset goals to initial base.
const row=P.forNumber(6).steps.find(x=>x.familyId==='PU');
const cfg={finalCalibration:{},availableDumbbellWeights:[2,4,6,8]};
const last={familyId:'PU',variantId:'PU-V2',id:'PU-V2',completedDate:'2026-11-10',sessionNumber:1,sets:A.makeSets([9],'reps',null),difficulty:'okay'};
last.sets.forEach(q=>{q.done=true;q.reps='9';});
const outcome=A.resolve(row,cfg,[last],'2026-11-13');
assert.ok(outcome.targets[0]>=9,'set-count change must retain achieved reps, not reset to 6');
// Two easy exposures can promote within the same stable level, without a calendar-week shortcut.
const easy1={...last,completedDate:'2026-11-01',difficulty:'easy',sets:A.makeSets([9],'reps',null)};
const easy2={...last,completedDate:'2026-11-08',difficulty:'easy',sets:A.makeSets([9],'reps',null)};
for(const x of [easy1,easy2]){x.sets.forEach(s=>{s.done=true;s.reps='9'})}
const easy=A.resolve({...row,sets:1,targets:[6]},cfg,[easy1,easy2],'2026-11-13');
assert.ok(easy.targets[0]>9,'easy successful history should advance prescribed reps');
// Failure must not escalate next session.
const failed={...last,sets:A.makeSets([10],'reps',null),difficulty:'hard'};failed.sets[0].failed=true;
const stalled=A.resolve({...row,sets:1,targets:[6]},cfg,[failed],'2026-11-13');
assert.ok(stalled.targets[0]<=10);
// Time since last training may reduce volume, not add advanced difficulty.
const breakTest=A.resolve({...row,sets:3,targets:[8,8,8]},cfg,[{...last,completedDate:'2026-10-01'}],'2026-11-13');
assert.ok(breakTest.setCount<=2);
// Weight choices remain unknown; no falsely invented kg.
const rowWeight=P.forNumber(1).steps.find(x=>x.familyId==='ROW');
assert.equal(A.resolve(rowWeight,cfg,[], '2026-11-13').load,null);
assert.equal(A.approvedVariant('PULL','PULL-V3',{pullupBarVerified:false,strictPullupConfirmed:false}),false);
assert.equal(A.approvedVariant('PU','PU-V1',{}),true);
console.log(`PASS: 120 sessions, ${totalMain} exercise rows, ${totalSets} prescribed sets, 22 families / 71 variants.`);
console.log(`PASS: exact warm-up/main/cardio/cool-down totals and cadence, durations ${mins}–${maxs} min.`);
console.log('PASS: 72 source-defined BUSY sessions preserve stage time, reduce total sets, and retain session identity.');
console.log('PASS: legacy-safe identifiers, adaptive rules, incomplete sets, unknown weight, 14-day breaks, bar safety gating.');
