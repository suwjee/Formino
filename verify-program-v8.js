'use strict';

const assert=require('node:assert/strict');
global.window=global;
for(const file of ['workouts-v2','workouts-v3','workouts-v4','workouts-v43','workouts-v411','research-data','workouts','tutorials-v8'])require('./'+file+'.js');
const plan=require('./program-v8.js');
const fixed=require('./fixed-workout-v8.js');
const guides=global.FORMINO_EXERCISE_GUIDES;
const tutorials=global.FORMINO_TUTORIALS||{};

const sum=(items,key)=>items.reduce((total,item)=>total+item[key],0);
const ids=new Set(), movements=new Map();
const totals={rows:0,sets:0,weighted:0,band:0,barSkills:0,cardioSeconds:0,minutes:[]};

function checkGuide(guide,expected,location){
 assert.ok(guide,location+' has a guide for '+expected);
 assert.ok(guide.fa&&guide.en&&guide.how?.length,guide.id+' has bilingual names and execution steps');
 assert.ok(guides.search(guide.en).some(result=>result.id===guide.id),guide.id+' searchable in English');
 assert.ok(guides.search(guide.fa).some(result=>result.id===guide.id),guide.id+' searchable in Persian');
 movements.set(guide.id,guide);
}
function checkActivity(item,location){
 assert.ok(item.name_fa&&item.name_en&&item.instruction_fa,location+' complete instructions');
 assert.ok(Number.isInteger(item.duration_seconds)&&item.duration_seconds>0,location+' time');
 assert.ok(['easy','moderate','vigorous'].includes(item.intensity),location+' intensity');
 checkGuide(guides.get(item.id)||guides.forStage(item.name_en),item.name_en,location);
 for(const alt of [item.alternative,item.easyAlternative].filter(Boolean)){
  assert.equal(alt.duration_seconds,item.duration_seconds,location+' equal-duration alternate');
  checkActivity(alt,location+' alternate');
 }
}

for(let n=1;n<=120;n++){
 const session=plan.forNumber(n), week=Math.ceil(n/5), code='ADBEC'[(n-1)%5];
 assert.equal(session.sessionNumber,n);
 assert.equal(session.week,week);
 assert.equal(session.code,code);
 assert.equal(plan.prescription(week,code),session);
 assert.ok(!ids.has(session.sessionId));
 ids.add(session.sessionId);
 assert.equal(session.kind,'ABC'.includes(code)?'strength':'cardio');
 assert.ok(session.weekGoal&&session.recoveryRule);
 const time=session.timeBreakdown, cardio=session.cardioDetails;
 assert.equal(sum(session.warmupItems,'duration_seconds'),time.warmupSeconds);
 assert.equal(sum(session.cooldownItems,'duration_seconds'),time.cooldownSeconds);
 assert.equal(sum(session.steps,'estimatedSeconds'),time.strengthSeconds);
 assert.equal(sum(cardio.steps,'duration_seconds'),cardio.round_seconds);
 assert.equal(cardio.round_seconds*cardio.rounds,cardio.total_seconds);
 assert.equal(cardio.total_seconds,time.cardioSeconds);
 assert.equal(time.transitionsSeconds,session.transitionsSeconds);
 assert.equal(Object.values(time).reduce((total,seconds)=>total+seconds,0),session.durationSeconds);
 assert.equal(sum(session.optionalSkills,'duration_seconds'),session.optionalSkillSeconds);
 for(const activity of [...session.warmupItems,...cardio.steps,...session.cooldownItems])checkActivity(activity,session.sessionId);
 for(const step of session.steps){
  const name=session.sessionId+' '+step.id;
  assert.equal(step.sets,step.targets.length,name);
  assert.ok(step.targets.every(target=>Number.isInteger(target)&&target>0),name);
  assert.ok(step.rest>0,name);
  assert.equal(step.restSides>0,step.side,name);
  assert.ok(!step.equipment?.includes('دو دمبل'),name);
  assert.equal(Boolean(plan.exercises[step.id].side),step.side,name);
  assert.equal(fixed.resolveLoad(step,session,{},[]),step.kind==='weight'?4:null,name);
  assert.equal(step.loadKg,step.kind==='weight'?4:null,name);
  assert.equal(step.estimatedSeconds,
   step.setupSeconds+step.betweenSetSeconds+step.sideChangeSeconds+step.activeSeconds,name);
  assert.equal(step.activeSeconds,step.targets.reduce((sum,target)=>sum+target,0)*(step.side?2:1)*(step.unit==='seconds'?1:step.tempoSeconds),name);
  checkGuide(guides.get(step.id,8),step.id,name);
  totals.rows++;
  totals.sets+=step.sets;
  if(step.kind==='weight')totals.weighted++;
  if(step.kind==='band')totals.band++;
 }
 for(const skill of session.optionalSkills){
  assert.ok(skill.prerequisite&&skill.rest&&skill.duration_seconds);
  assert.match(skill.gate,/^bar-safe/);
  checkGuide(guides.get(skill.id,8),skill.id,session.sessionId);
  totals.barSkills++;
 }
 totals.cardioSeconds+=cardio.total_seconds;
 totals.minutes.push(session.durationSeconds);
}
assert.equal(plan.forNumber(121),null);
assert.equal(plan.weeks.length,24);
for(const week of plan.weeks){
 assert.equal(week.session_ids.length,5);
 assert.ok(week.directSets.chest&&week.directSets.lats&&week.directSets.quadriceps);
}
assert.ok(plan.weeks[7].weekly_set_count<plan.weeks[6].weekly_set_count);
assert.ok(plan.weeks[15].weekly_set_count<plan.weeks[14].weekly_set_count);
assert.ok(plan.weeks.at(-1).cardioTotalSeconds>plan.weeks[0].cardioTotalSeconds);
assert.ok(totals.band>0&&totals.barSkills>0);

let missingLinks=0,baseLinks=0,videoLinks=0;
for(const [id,guide] of movements){
 const link=tutorials[id];
 const direct=link?.source?.url;
 if(!direct){missingLinks++;console.log('UNVERIFIED direct exercise tutorial: '+id+' '+guide.en);continue;}
 const url=new URL(direct);
 assert.equal(url.protocol,'https:');
 assert.ok(!/youtube|google\./i.test(url.hostname),'Primary source must link to a movement');
 if(link.status==='base')baseLinks++;
 if(link.video){
  videoLinks++;
  const video=new URL(link.video.url);
  assert.match(video.hostname,/^(www\.)?(youtube\.com|youtu\.be)$/);
  assert.ok(video.searchParams.get('v')||video.hostname==='youtu.be');
 }
}

assert.equal(missingLinks,0,'All active movements need a matching or explicitly labeled base source');
console.log('PASS fixed order and all 120 sessions; exact totals, bilateral timing, 4 kg baseline, deloads, and '+movements.size+' bilingual guides.');
console.log(JSON.stringify({...totals,minutes:undefined,minSeconds:Math.min(...totals.minutes),maxSeconds:Math.max(...totals.minutes),guides:movements.size,missingLinks,baseLinks,videoLinks}));

